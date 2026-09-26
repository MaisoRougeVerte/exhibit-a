import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runJudge } from "./run.ts";

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Minimal fake test runner
//
// To avoid any npm/pnpm installation in test temp dirs, the tests use a tiny
// shell script as the test runner.  The script reads the test FILE and decides
// what to do based on its content:
//   - file contains "PASS"  → exit 0
//   - file contains "FAIL"  → exit 1, print "AssertionError: test failed"
//   - anything else         → exit 1, print "SyntaxError: cannot parse"
//
// This lets us test all ruling outcomes without a real test framework.
// ---------------------------------------------------------------------------

const FAKE_RUNNER = `#!/usr/bin/env bash
set -euo pipefail
FILE=""
SKIP_NEXT=0
for arg in "$@"; do
  if [ "$SKIP_NEXT" = "1" ]; then SKIP_NEXT=0; continue; fi
  case "$arg" in
    -t) SKIP_NEXT=1 ;;
    -*) ;;
    *) FILE="$arg" ;;
  esac
done
if [ -z "$FILE" ]; then echo "no file given"; exit 1; fi
CONTENT=$(cat "$FILE" 2>/dev/null || echo "")
if echo "$CONTENT" | grep -q "PASS"; then
  echo "✓ test passed"
  exit 0
elif echo "$CONTENT" | grep -q "FAIL"; then
  echo "AssertionError: expected true to equal false"
  exit 1
else
  echo "SyntaxError: cannot parse test file"
  exit 1
fi
`;

type TestRepo = {
  dir: string;
  cleanup: () => Promise<void>;
};

/** Creates a minimal git repository with a fake test runner and .exhibit-a.json. */
async function makeTestRepo(opts?: { skipGitInit?: boolean }): Promise<TestRepo> {
  const dir = await mkdtemp(join(tmpdir(), "exhibit-a-testrepo-"));

  await writeFile(
    join(dir, ".exhibit-a.json"),
    JSON.stringify({ test: ["bash", "runner.sh"] }, null, 2),
  );
  await writeFile(join(dir, "runner.sh"), FAKE_RUNNER, { mode: 0o755 });

  if (opts?.skipGitInit !== true) {
    await execFileAsync("git", ["-C", dir, "init", "--initial-branch=main"], {
      signal: AbortSignal.timeout(10_000),
    });
    await execFileAsync("git", ["-C", dir, "config", "user.email", "test@example.com"], {
      signal: AbortSignal.timeout(5_000),
    });
    await execFileAsync("git", ["-C", dir, "config", "user.name", "Test"], {
      signal: AbortSignal.timeout(5_000),
    });
    // First commit — passing test.
    await mkdir(join(dir, "tests"), { recursive: true });
    await writeFile(join(dir, "tests", "subject.test.ts"), "PASS");
    await execFileAsync("git", ["-C", dir, "add", "-A"], { signal: AbortSignal.timeout(5_000) });
    await execFileAsync("git", ["-C", dir, "commit", "-m", "feat: initial"], {
      signal: AbortSignal.timeout(5_000),
    });
  }

  const cleanup = async () => {
    await execFileAsync("git", ["-C", dir, "worktree", "prune"], {
      signal: AbortSignal.timeout(5_000),
    }).catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  };

  return { dir, cleanup };
}

/** Commits a change to the test file and returns the new full SHA. */
async function commitChange(repoDir: string, content: string, message: string): Promise<string> {
  await mkdir(join(repoDir, "tests"), { recursive: true });
  await writeFile(join(repoDir, "tests", "subject.test.ts"), content);
  await execFileAsync("git", ["-C", repoDir, "add", "-A"], { signal: AbortSignal.timeout(5_000) });
  await execFileAsync("git", ["-C", repoDir, "commit", "-m", message], {
    signal: AbortSignal.timeout(5_000),
  });
  const { stdout } = await execFileAsync("git", ["-C", repoDir, "rev-parse", "HEAD"], {
    signal: AbortSignal.timeout(5_000),
  });
  return stdout.trim();
}

/** Returns the short (7-char) SHA of HEAD. */
async function headSha(repoDir: string): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", repoDir, "rev-parse", "--short=7", "HEAD"], {
    signal: AbortSignal.timeout(5_000),
  });
  return stdout.trim();
}

// ---------------------------------------------------------------------------
// Minimal case-file builder
// ---------------------------------------------------------------------------

function makeCase(events: unknown[]) {
  return {
    schemaVersion: 1,
    id: "test-case",
    title: "Test case",
    source: "fixture",
    recordedAt: "2026-09-20T10:00:00+00:00",
    repo: { name: "test/repo", head: "abc1234" },
    bugReport: { title: "A bug", body: "A description." },
    events,
  };
}

// ---------------------------------------------------------------------------
// Helpers to read back the ruling from a written case file
// ---------------------------------------------------------------------------

type WrittenEvent = { type: string; status?: string; evidenceId?: string };

async function readRuling(caseFile: string, evidenceId: string): Promise<WrittenEvent | undefined> {
  const { readFile } = await import("node:fs/promises");
  const written = JSON.parse(await readFile(caseFile, "utf8")) as {
    events: WrittenEvent[];
  };
  return written.events.find((e) => e.type === "ruling" && e.evidenceId === evidenceId);
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

let repo: TestRepo;

beforeEach(async () => {
  repo = await makeTestRepo();
});

afterEach(async () => {
  await repo.cleanup();
});

// ---------------------------------------------------------------------------
// runJudge — integration tests that exercise ruleEvidence through the pipeline
// ---------------------------------------------------------------------------

describe("runJudge", () => {
  describe("test evidence", () => {
    it("upholds a test evidence item with expect:fail when the test fails", async () => {
      await writeFile(join(repo.dir, "tests", "subject.test.ts"), "FAIL");

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The bug is reproducible.",
          evidence: [{ id: "ev-1", kind: "test", file: "tests/subject.test.ts", expect: "fail" }],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "upheld" });
    });

    it("rejects a test evidence item with expect:fail when the test passes", async () => {
      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The bug is present.",
          evidence: [{ id: "ev-1", kind: "test", file: "tests/subject.test.ts", expect: "fail" }],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "rejected" });
    });

    it("errors on a test evidence item when the test file does not exist", async () => {
      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "neutral",
          line: "Testing a missing file.",
          evidence: [{ id: "ev-1", kind: "test", file: "tests/missing.test.ts", expect: "fail" }],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      // Missing file → runner prints SyntaxError (not an assertion failure) → error.
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "error" });
    });

    it("upholds a test evidence item with expect:pass when the test passes", async () => {
      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The fix works.",
          evidence: [{ id: "ev-1", kind: "test", file: "tests/subject.test.ts", expect: "pass" }],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "upheld" });
    });
  });

  describe("test-at-commit evidence", () => {
    it("upholds when the test fails at the target commit", async () => {
      const failSha = await commitChange(repo.dir, "FAIL", "feat: introduce bug");
      // Restore working tree to PASS.
      await writeFile(join(repo.dir, "tests", "subject.test.ts"), "PASS");
      await execFileAsync("git", ["-C", repo.dir, "add", "-A"], {
        signal: AbortSignal.timeout(5_000),
      });
      await execFileAsync("git", ["-C", repo.dir, "commit", "-m", "fix: restore"], {
        signal: AbortSignal.timeout(5_000),
      });

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The commit introduced the bug.",
          evidence: [
            {
              id: "ev-1",
              kind: "test-at-commit",
              file: "tests/subject.test.ts",
              commit: failSha.slice(0, 7),
              expect: "fail",
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "upheld" });
    });

    it("rejects when the test passes at the target commit (alibi)", async () => {
      const sha = await headSha(repo.dir);

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The bug existed at this commit.",
          evidence: [
            {
              id: "ev-1",
              kind: "test-at-commit",
              file: "tests/subject.test.ts",
              commit: sha,
              expect: "fail",
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "rejected" });
    });
  });

  describe("log-search evidence", () => {
    it("upholds when the pattern match count equals expectMatches", async () => {
      await writeFile(
        join(repo.dir, "app.log"),
        "error: stock negative\ninfo: order placed\nerror: stock negative\n",
      );

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The log shows two negative-stock errors.",
          evidence: [
            {
              id: "ev-1",
              kind: "log-search",
              file: "app.log",
              pattern: "error: stock negative",
              expectMatches: 2,
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "upheld" });
    });

    it("rejects when the pattern match count differs from expectMatches", async () => {
      await writeFile(join(repo.dir, "app.log"), "info: order placed\n");

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "neutral",
          line: "The log shows five negative-stock errors.",
          evidence: [
            {
              id: "ev-1",
              kind: "log-search",
              file: "app.log",
              pattern: "stock negative",
              expectMatches: 5,
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "rejected" });
    });

    it("errors when the log file does not exist", async () => {
      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "neutral",
          line: "The log shows errors.",
          evidence: [
            {
              id: "ev-1",
              kind: "log-search",
              file: "missing.log",
              pattern: "error",
              expectMatches: 1,
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "error" });
    });
  });

  describe("bisect evidence", () => {
    it("upholds when bisect finds the expected culprit commit", async () => {
      const goodSha = await headSha(repo.dir);
      const culpritSha = await commitChange(repo.dir, "FAIL // commit 2", "feat: introduce bug");
      // One more commit so bisect has range to search; content must differ from culprit.
      await commitChange(repo.dir, "FAIL // commit 3", "chore: unrelated change after bug");
      const badSha = await headSha(repo.dir);

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "The culprit commit introduced the failing test.",
          evidence: [
            {
              id: "ev-1",
              kind: "bisect",
              file: "tests/subject.test.ts",
              good: goodSha,
              bad: badSha,
              expectCulprit: culpritSha.slice(0, 7),
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "upheld" });
    });

    it("rejects a bisect claim when the named culprit does not match", async () => {
      const goodSha = await headSha(repo.dir);
      const realCulpritSha = await commitChange(
        repo.dir,
        "FAIL // commit 2",
        "feat: introduce bug",
      );
      const badSha = await commitChange(repo.dir, "FAIL // commit 3", "chore: something else");
      const wrongSha = goodSha.slice(0, 7);

      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "Wrong commit accused.",
          evidence: [
            {
              id: "ev-1",
              kind: "bisect",
              file: "tests/subject.test.ts",
              good: goodSha,
              bad: badSha,
              expectCulprit: wrongSha,
            },
          ],
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });
      expect(await readRuling(caseFile, "ev-1")).toMatchObject({ status: "rejected" });
      // Confirm the real culprit SHA is non-empty (avoids unused-variable lint).
      expect(realCulpritSha.length).toBeGreaterThan(0);
    });
  });

  describe("file handling", () => {
    it("skips evidence items that already have a ruling", async () => {
      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "Already-ruled claim.",
          evidence: [{ id: "ev-1", kind: "test", file: "tests/subject.test.ts", expect: "pass" }],
        },
        {
          type: "ruling",
          evidenceId: "ev-1",
          status: "upheld",
          exitCode: 0,
          excerpt: "already ruled",
          durationMs: 1,
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 0 });
    });

    it("returns ok:false for a missing .exhibit-a.json", async () => {
      const repo2 = await makeTestRepo({ skipGitInit: true });
      try {
        await rm(join(repo2.dir, ".exhibit-a.json"), { force: true });
        const caseData = makeCase([
          {
            type: "claim",
            id: "claim-1",
            speaker: "investigator",
            expression: "neutral",
            line: "Any claim.",
            evidence: [
              {
                id: "ev-1",
                kind: "log-search",
                file: "app.log",
                pattern: "x",
                expectMatches: 0,
              },
            ],
          },
        ]);
        const caseFile = join(repo2.dir, "case.json");
        await writeFile(caseFile, JSON.stringify(caseData, null, 2));
        const result = await runJudge(caseFile, repo2.dir);
        expect(result).toMatchObject({ ok: false });
        if (!result.ok) expect(result.reason).toContain(".exhibit-a.json");
      } finally {
        await repo2.cleanup();
      }
    });

    it("returns ok:false for invalid JSON", async () => {
      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, "{ not valid json");
      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: false });
    });

    it("inserts rulings before the verdict when a verdict is already present", async () => {
      const caseData = makeCase([
        {
          type: "claim",
          id: "claim-1",
          speaker: "investigator",
          expression: "confident",
          line: "A claim.",
          evidence: [{ id: "ev-1", kind: "test", file: "tests/subject.test.ts", expect: "pass" }],
        },
        {
          type: "verdict",
          rootCause: "The bug.",
          upheldClaims: ["claim-1"],
          fixSummary: "Fix it.",
          line: "Case closed.",
        },
      ]);

      const caseFile = join(repo.dir, "case.json");
      await writeFile(caseFile, JSON.stringify(caseData, null, 2));

      const result = await runJudge(caseFile, repo.dir);
      expect(result).toMatchObject({ ok: true, ruledCount: 1 });

      const { readFile } = await import("node:fs/promises");
      const written = JSON.parse(await readFile(caseFile, "utf8")) as {
        events: Array<{ type: string }>;
      };
      expect(written.events.at(-1)?.type).toBe("verdict");
      const rulingIdx = written.events.findIndex((e) => e.type === "ruling");
      const verdictIdx = written.events.findLastIndex((e) => e.type === "verdict");
      expect(rulingIdx).toBeLessThan(verdictIdx);
    });
  });
});
