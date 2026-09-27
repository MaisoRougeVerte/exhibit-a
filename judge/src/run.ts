import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { CaseEvent, CaseFileShape, Evidence } from "@exhibit-a/schema";
import { caseFileShape, checkIntegrity } from "@exhibit-a/schema";
import { z } from "zod";
import { readRepoConfig } from "./repo-config.ts";
import { ruleEvidence } from "./rules.ts";
import { truncate } from "./run-test.ts";

type RulingEvent = Extract<CaseEvent, { type: "ruling" }>;

export type RunResult =
  | { ok: true; ruledCount: number; changed: string[] }
  | { ok: false; reason: string };

export type RunOptions = { write: boolean };

/**
 * Re-runs every evidence item of a case file, even the ones that already carry a ruling:
 * a ruling written by anyone but the judge is never trusted. Existing rulings are replaced
 * in place, new ones go before the verdict. The file is written back only if the result
 * passes the integrity rules; a mid-trial file may still lack its verdict.
 *
 * Returns { ok: false } for expected failures; throws only for programmer errors.
 */
export async function runJudge(
  caseFilePath: string,
  repoDir: string,
  options: RunOptions = { write: true },
): Promise<RunResult> {
  const absCase = resolve(caseFilePath);
  const absRepo = resolve(repoDir);

  const loaded = await loadCaseFile(absCase);
  if (!loaded.ok) return loaded;
  const { caseFile } = loaded;

  // The verdict is checked after the run: it may rely on rulings the judge has yet to write.
  const before = integrityErrors(withoutVerdict(caseFile));
  if (before !== undefined) return { ok: false, reason: `integrity check failed: ${before}` };

  const configResult = await loadTestCmd(absRepo);
  if (!configResult.ok) return configResult;

  const evidence = collectEvidence(caseFile);
  const rulings = await runAll(evidence, absRepo, configResult.testCmd);
  const updated = applyRulings(caseFile, rulings);

  const after = integrityErrors(updated);
  if (after !== undefined) return { ok: false, reason: `integrity check failed: ${after}` };

  if (options.write) {
    await writeFile(absCase, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  }
  return { ok: true, ruledCount: rulings.size, changed: changedRulings(caseFile, rulings) };
}

type LoadResult = { ok: true; caseFile: CaseFileShape } | { ok: false; reason: string };

async function loadCaseFile(absCase: string): Promise<LoadResult> {
  let json: unknown;
  try {
    json = JSON.parse(await readFile(absCase, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: `could not read ${absCase}: ${message}` };
  }
  // Shape only: a mid-trial file has no verdict yet, so integrity is checked separately.
  const shapeResult = caseFileShape.safeParse(json);
  if (!shapeResult.success) {
    return { ok: false, reason: `schema error: ${z.prettifyError(shapeResult.error)}` };
  }
  return { ok: true, caseFile: shapeResult.data };
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

const MISSING_VERDICT = "a trial must end with a verdict";

/** Every integrity issue except the missing verdict, which is normal mid-trial. */
function integrityErrors(caseFile: CaseFileShape): string | undefined {
  const issues = checkIntegrity(caseFile).filter((issue) => issue.message !== MISSING_VERDICT);
  if (issues.length === 0) return undefined;
  return issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

function withoutVerdict(caseFile: CaseFileShape): CaseFileShape {
  return { ...caseFile, events: caseFile.events.filter((event) => event.type !== "verdict") };
}

function collectEvidence(caseFile: CaseFileShape): Evidence[] {
  return caseFile.events.flatMap((event) => (event.type === "claim" ? event.evidence : []));
}

async function runAll(
  evidence: Evidence[],
  absRepo: string,
  testCmd: string[],
): Promise<Map<string, RulingEvent>> {
  // One item at a time: parallel runs would share the repository's working tree.
  const rulings = new Map<string, RulingEvent>();
  for (const item of evidence) {
    const result = await ruleEvidence(item, absRepo, testCmd);
    // Truncated last: rules add prefixes to outputs that may already be at the limit.
    rulings.set(item.id, {
      type: "ruling",
      evidenceId: item.id,
      ...result,
      excerpt: truncate(result.excerpt),
    });
  }
  return rulings;
}

function applyRulings(caseFile: CaseFileShape, rulings: Map<string, RulingEvent>): CaseFileShape {
  const recorded = new Set<string>();
  const events = caseFile.events.map((event) => {
    if (event.type !== "ruling") return event;
    recorded.add(event.evidenceId);
    return rulings.get(event.evidenceId) ?? event;
  });
  const fresh = [...rulings.values()].filter((ruling) => !recorded.has(ruling.evidenceId));
  const verdictIndex = events.findLastIndex((event) => event.type === "verdict");
  events.splice(verdictIndex === -1 ? events.length : verdictIndex, 0, ...fresh);
  return { ...caseFile, events };
}

/** Evidence ids whose recorded ruling disagrees with the judge's own run. */
function changedRulings(caseFile: CaseFileShape, rulings: Map<string, RulingEvent>): string[] {
  return caseFile.events.flatMap((event) =>
    event.type === "ruling" && rulings.get(event.evidenceId)?.status !== event.status
      ? [event.evidenceId]
      : [],
  );
}
