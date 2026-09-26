import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Evidence } from "@exhibit-a/schema";
import { assertNever } from "@exhibit-a/schema";
import { runTest, type TestOutcome } from "./run-test.ts";
import { createWorktree } from "./worktree.ts";

const execFileAsync = promisify(execFile);

export type RulingResult = {
  status: "upheld" | "rejected" | "error";
  exitCode: number | null;
  excerpt: string;
  durationMs: number;
};

/**
 * Rules a single evidence item.  Returns a RulingResult; never throws for
 * expected failures.  Throws only for programmer errors (impossible branches).
 */
export function ruleEvidence(
  evidence: Evidence,
  repoDir: string,
  testCmd: string[],
): Promise<RulingResult> {
  switch (evidence.kind) {
    case "test":
      return ruleTest(evidence, repoDir, testCmd);
    case "test-at-commit":
      return ruleTestAtCommit(evidence, repoDir, testCmd);
    case "log-search":
      return ruleLogSearch(evidence, repoDir);
    case "bisect":
      return ruleBisect(evidence, repoDir, testCmd);
    default:
      return assertNever(evidence);
  }
}

// ---------------------------------------------------------------------------
// test
// ---------------------------------------------------------------------------

async function ruleTest(
  evidence: Extract<Evidence, { kind: "test" }>,
  repoDir: string,
  testCmd: string[],
): Promise<RulingResult> {
  const outcome = await runTest(testCmd, repoDir, evidence.file, evidence.testName);
  return outcomeToRuling(outcome, evidence.expect);
}

// ---------------------------------------------------------------------------
// test-at-commit
// ---------------------------------------------------------------------------

async function ruleTestAtCommit(
  evidence: Extract<Evidence, { kind: "test-at-commit" }>,
  repoDir: string,
  testCmd: string[],
): Promise<RulingResult> {
  const outcome = await runTestAtRevision(repoDir, testCmd, evidence, evidence.commit);
  return outcomeToRuling(outcome, evidence.expect);
}

// ---------------------------------------------------------------------------
// log-search
// ---------------------------------------------------------------------------

async function ruleLogSearch(
  evidence: Extract<Evidence, { kind: "log-search" }>,
  repoDir: string,
): Promise<RulingResult> {
  const start = Date.now();
  let content: string;
  try {
    content = await readFile(join(repoDir, evidence.file), "utf8");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { status: "error", exitCode: null, excerpt: msg, durationMs: Date.now() - start };
  }

  const lines = content.split("\n");
  const matches = lines.filter((line) => line.includes(evidence.pattern)).length;
  const durationMs = Date.now() - start;
  const excerpt = `${matches} line(s) contain "${evidence.pattern}" (expected ${evidence.expectMatches})`;

  if (matches === evidence.expectMatches) {
    return { status: "upheld", exitCode: 0, excerpt, durationMs };
  }
  return { status: "rejected", exitCode: 0, excerpt, durationMs };
}

// ---------------------------------------------------------------------------
// bisect
// ---------------------------------------------------------------------------

async function ruleBisect(
  evidence: Extract<Evidence, { kind: "bisect" }>,
  repoDir: string,
  testCmd: string[],
): Promise<RulingResult> {
  const start = Date.now();

  const good = await resolveRevision(repoDir, evidence.good);
  const bad = await resolveRevision(repoDir, evidence.bad);

  if (good === null || bad === null) {
    return {
      status: "error",
      exitCode: null,
      excerpt: `could not resolve revisions: good=${evidence.good} bad=${evidence.bad}`,
      durationMs: Date.now() - start,
    };
  }

  const commits = await commitsBetween(repoDir, good, bad);
  if (commits.length === 0) {
    return {
      status: "error",
      exitCode: null,
      excerpt: `no commits between ${good} and ${bad}`,
      durationMs: Date.now() - start,
    };
  }

  // Verify preconditions: good passes, bad fails.
  const goodOutcome = await runTestAtRevision(repoDir, testCmd, evidence, good);
  if (goodOutcome.status !== "pass") {
    const excerpt = `precondition failed: good commit ${good} does not pass the test\n${goodOutcome.output}`;
    return {
      status: "rejected",
      exitCode: goodOutcome.exitCode,
      excerpt,
      durationMs: Date.now() - start,
    };
  }
  const badOutcome = await runTestAtRevision(repoDir, testCmd, evidence, bad);
  if (badOutcome.status !== "fail") {
    const excerpt = `precondition failed: bad commit ${bad} does not fail the test\n${badOutcome.output}`;
    return {
      status: "rejected",
      exitCode: badOutcome.exitCode,
      excerpt,
      durationMs: Date.now() - start,
    };
  }

  const culprit = await binarySearch(repoDir, testCmd, evidence, commits);

  if (culprit === null) {
    return {
      status: "error",
      exitCode: null,
      excerpt: "bisect did not converge to a single culprit commit",
      durationMs: Date.now() - start,
    };
  }

  const durationMs = Date.now() - start;
  const shortCulprit = culprit.slice(0, 12);
  const expectedShort = evidence.expectCulprit;
  const excerpt = `bisect: first bad commit is ${shortCulprit} (expected ${expectedShort})`;

  if (culprit.startsWith(expectedShort) || expectedShort.startsWith(culprit.slice(0, 7))) {
    return { status: "upheld", exitCode: 0, excerpt, durationMs };
  }
  return { status: "rejected", exitCode: 1, excerpt, durationMs };
}

// ---------------------------------------------------------------------------
// Bisect helpers
// ---------------------------------------------------------------------------

async function commitsBetween(repoDir: string, good: string, bad: string): Promise<string[]> {
  // git log --ancestry-path good..bad — newest first, bad included, good excluded.
  const { stdout } = await execFileAsync(
    "git",
    ["-C", repoDir, "log", "--ancestry-path", "--format=%H", `${good}..${bad}`],
    { signal: AbortSignal.timeout(10_000) },
  );
  return stdout.trim().split("\n").filter(Boolean);
}

async function resolveRevision(repoDir: string, rev: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["-C", repoDir, "rev-parse", rev], {
      signal: AbortSignal.timeout(5_000),
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

/** Runs the evidence's test against the code at `revision`, carrying today's test file. */
async function runTestAtRevision(
  repoDir: string,
  testCmd: string[],
  evidence: { file: string; testName?: string | undefined },
  revision: string,
): Promise<TestOutcome> {
  const start = Date.now();
  let wt: Awaited<ReturnType<typeof createWorktree>>;
  try {
    wt = await createWorktree(repoDir, revision, [evidence.file]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      exitCode: null,
      output: `could not check out ${revision}: ${message}`,
      durationMs: Date.now() - start,
    };
  }
  try {
    return await runTest(testCmd, wt.dir, evidence.file, evidence.testName);
  } finally {
    await wt.cleanup();
  }
}

/**
 * Finds the oldest commit in `commits` (newest-first) where the test still fails.
 * commits[0] is "bad" (known to fail).
 */
async function binarySearch(
  repoDir: string,
  testCmd: string[],
  evidence: Extract<Evidence, { kind: "bisect" }>,
  commits: string[],
): Promise<string | null> {
  let lo = 0;
  let hi = commits.length - 1;
  let culprit: string | null = commits[0] ?? null;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const sha = commits[mid];
    if (sha === undefined) break;
    const outcome = await runTestAtRevision(repoDir, testCmd, evidence, sha);
    if (outcome.status === "fail") {
      culprit = sha;
      lo = mid + 1;
    } else if (outcome.status === "pass") {
      hi = mid - 1;
    } else {
      // Error at this commit — treat conservatively as pass.
      hi = mid - 1;
    }
  }
  return culprit;
}

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

function outcomeToRuling(
  outcome: {
    status: "pass" | "fail" | "error";
    exitCode: number | null;
    output: string;
    durationMs: number;
  },
  expect: "pass" | "fail",
): RulingResult {
  const { exitCode, output, durationMs } = outcome;
  if (outcome.status === "error") {
    return { status: "error", exitCode, excerpt: output, durationMs };
  }
  if (outcome.status === expect) {
    return { status: "upheld", exitCode, excerpt: output, durationMs };
  }
  return { status: "rejected", exitCode, excerpt: output, durationMs };
}
