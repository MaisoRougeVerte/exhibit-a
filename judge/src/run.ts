import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CaseEvent, CaseFileShape } from "@exhibit-a/schema";
import { caseFileShape, parseCaseFile } from "@exhibit-a/schema";
import { z } from "zod";
import { readRepoConfig } from "./repo-config.ts";
import { ruleEvidence } from "./rules.ts";

export type RunResult = { ok: true; ruledCount: number } | { ok: false; reason: string };

/**
 * Loads a case file, rules every evidence item that has no ruling yet,
 * appends the ruling events, writes the file back, and re-validates.
 *
 * Uses caseFileShape (shape-only, no integrity) for the initial parse so it
 * can operate on mid-trial files that have no verdict yet.  The full
 * parseCaseFile is called at the very end to confirm the final state is valid.
 *
 * Returns { ok: false } for expected failures; throws only for programmer errors.
 */
export async function runJudge(caseFilePath: string, repoDir: string): Promise<RunResult> {
  const absCase = resolve(caseFilePath);
  const absRepo = resolve(repoDir);

  const parseResult = await loadCaseFile(absCase);
  if (!parseResult.ok) return parseResult;
  const { json, caseFile } = parseResult;

  const configResult = await loadTestCmd(absRepo);
  if (!configResult.ok) return configResult;
  const testCmd = configResult.testCmd;

  const unruled = collectUnruled(caseFile);

  if (unruled.length === 0) {
    return revalidate(json);
  }

  const newRulings = await runAll(unruled, absRepo, testCmd);
  const updated = insertRulings(caseFile, newRulings);
  await writeFile(absCase, `${JSON.stringify(updated, null, 2)}\n`, "utf8");

  const integrityResult = checkFinalIntegrity(updated);
  if (!integrityResult.ok) return integrityResult;
  return { ok: true, ruledCount: newRulings.length };
}

// ---------------------------------------------------------------------------
// Helpers extracted to keep runJudge below the complexity ceiling
// ---------------------------------------------------------------------------

type LoadResult =
  | { ok: true; json: unknown; caseFile: CaseFileShape }
  | { ok: false; reason: string };

async function loadCaseFile(absCase: string): Promise<LoadResult> {
  const raw = await readFile(absCase, "utf8");
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, reason: `${absCase} is not valid JSON` };
  }
  const shapeResult = caseFileShape.safeParse(json);
  if (!shapeResult.success) {
    return { ok: false, reason: `schema error: ${z.prettifyError(shapeResult.error)}` };
  }
  return { ok: true, json, caseFile: shapeResult.data };
}

type ConfigResult = { ok: true; testCmd: string[] } | { ok: false; reason: string };

async function loadTestCmd(absRepo: string): Promise<ConfigResult> {
  try {
    const cfg = await readRepoConfig(absRepo);
    return { ok: true, testCmd: cfg.test };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: `could not read .exhibit-a.json: ${msg}` };
  }
}

function collectUnruled(
  caseFile: CaseFileShape,
): Array<Extract<CaseEvent, { type: "claim" }>["evidence"][number]> {
  const ruled = new Set<string>(
    caseFile.events
      .filter((e): e is Extract<CaseEvent, { type: "ruling" }> => e.type === "ruling")
      .map((e) => e.evidenceId),
  );
  const unruled: Array<Extract<CaseEvent, { type: "claim" }>["evidence"][number]> = [];
  for (const event of caseFile.events) {
    if (event.type !== "claim") continue;
    for (const item of event.evidence) {
      if (!ruled.has(item.id)) unruled.push(item);
    }
  }
  return unruled;
}

async function runAll(
  unruled: Array<Extract<CaseEvent, { type: "claim" }>["evidence"][number]>,
  absRepo: string,
  testCmd: string[],
): Promise<CaseEvent[]> {
  const rulings: CaseEvent[] = [];
  for (const evidence of unruled) {
    const result = await ruleEvidence(evidence, absRepo, testCmd);
    rulings.push({
      type: "ruling",
      evidenceId: evidence.id,
      status: result.status,
      exitCode: result.exitCode,
      excerpt: result.excerpt,
      durationMs: result.durationMs,
    });
  }
  return rulings;
}

function insertRulings(caseFile: CaseFileShape, newRulings: CaseEvent[]): CaseFileShape {
  const events = [...caseFile.events];
  const verdictIndex = events.findLastIndex((e) => e.type === "verdict");
  if (verdictIndex === -1) {
    events.push(...newRulings);
  } else {
    events.splice(verdictIndex, 0, ...newRulings);
  }
  return { ...caseFile, events };
}

function revalidate(json: unknown): RunResult {
  const result = parseCaseFile(json);
  if (!result.ok) {
    // A mid-trial file without a verdict fails integrity — that is expected.
    if (!result.error.includes("must end with a verdict")) {
      return { ok: false, reason: result.error };
    }
  }
  return { ok: true, ruledCount: 0 };
}

function checkFinalIntegrity(updated: CaseFileShape): RunResult {
  const result = parseCaseFile(updated);
  if (!result.ok) {
    // "must end with a verdict" is expected for mid-trial files — not an error.
    if (!result.error.includes("must end with a verdict")) {
      return { ok: false, reason: `integrity check failed: ${result.error}` };
    }
  }
  return { ok: true, ruledCount: 0 };
}
