import { spawn } from "node:child_process";

const TIMEOUT_MS = 60_000;
const EXCERPT_MAX = 2000;

export type TestOutcome =
  | { status: "pass"; exitCode: number; output: string; durationMs: number }
  | { status: "fail"; exitCode: number; output: string; durationMs: number }
  | { status: "error"; exitCode: number | null; output: string; durationMs: number };

/**
 * Runs the test command in the given working directory, targeting a specific file
 * and optional test name.  Returns a structured outcome; never throws for test
 * failures or timeouts.
 *
 * The "pass" vs "fail" vs "error" distinction follows PLAN.md section 6:
 *   - exit 0 → pass (at least one test ran and all passed)
 *   - exit non-zero + output contains an assertion failure → fail
 *   - exit non-zero + no assertion evidence (compile error, not-found, timeout) → error
 */
export async function runTest(
  testCmd: string[],
  cwd: string,
  file: string,
  testName: string | undefined,
): Promise<TestOutcome> {
  const args = [...testCmd.slice(1), file];
  if (testName !== undefined) {
    args.push("-t", testName);
  }
  const bin = testCmd[0];
  if (bin === undefined) throw new Error("test command is empty");

  const start = Date.now();
  const output = await spawnCollect(bin, args, cwd);
  const durationMs = Date.now() - start;

  if (output.exitCode === 0) {
    return { status: "pass", exitCode: 0, output: truncate(output.combined), durationMs };
  }

  // Timed out or killed
  if (output.exitCode === null) {
    return {
      status: "error",
      exitCode: null,
      output: truncate(output.combined),
      durationMs,
    };
  }

  // Distinguish an assertion failure from a compile/not-found error.
  // Vitest prints "AssertionError", "expected", or "FAIL" on assertion failures.
  // If none of those markers appear it is most likely a compile or import error.
  if (looksLikeAssertionFailure(output.combined)) {
    return {
      status: "fail",
      exitCode: output.exitCode,
      output: truncate(output.combined),
      durationMs,
    };
  }
  return {
    status: "error",
    exitCode: output.exitCode,
    output: truncate(output.combined),
    durationMs,
  };
}

function looksLikeAssertionFailure(output: string): boolean {
  return (
    output.includes("AssertionError") ||
    output.includes("expected ") ||
    // Vitest "× test name" or "✗ test name"
    /[×✗✕]\s/.test(output) ||
    output.includes(" FAIL ") ||
    output.includes("Tests failed") ||
    output.includes("test failed")
  );
}

type SpawnResult = { exitCode: number | null; combined: string };

function spawnCollect(bin: string, args: string[], cwd: string): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const signal = AbortSignal.timeout(TIMEOUT_MS);

    const child = spawn(bin, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Kill the process when the timeout fires.
    const onAbort = () => {
      child.kill("SIGKILL");
    };
    signal.addEventListener("abort", onAbort, { once: true });

    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));

    child.on("close", (code) => {
      signal.removeEventListener("abort", onAbort);
      resolve({ exitCode: code, combined: Buffer.concat(chunks).toString("utf8") });
    });
  });
}

function truncate(s: string): string {
  if (s.length <= EXCERPT_MAX) return s;
  // Keep the tail: test output is most useful at the end.
  return `…${s.slice(s.length - (EXCERPT_MAX - 1))}`;
}
