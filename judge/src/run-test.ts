import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";
import { z } from "zod";

const TIMEOUT_MS = 60_000;
const EXCERPT_MAX = 2000;

export type TestOutcome = {
  status: "pass" | "fail" | "error";
  exitCode: number | null;
  output: string;
  durationMs: number;
};

type Verdict = Pick<TestOutcome, "status" | "output">;

/**
 * Runs one test file with the repo's test command and classifies the result.
 * "fail" means at least one test ran and failed; a file that does not load, a name
 * that matches no test, or a timeout is "error", never "fail" or "pass".
 */
export async function runTest(
  testCmd: readonly string[],
  cwd: string,
  file: string,
  testName: string | undefined,
): Promise<TestOutcome> {
  const outcome = await runTestRaw(testCmd, cwd, file, testName);
  // Excerpts end up in public case files: never leak local paths or the user name.
  return { ...outcome, output: redactPaths(outcome.output, cwd) };
}

export function redactPaths(text: string, cwd: string): string {
  return text.replaceAll(cwd, "<repo>").replaceAll(homedir(), "~");
}

async function runTestRaw(
  testCmd: readonly string[],
  cwd: string,
  file: string,
  testName: string | undefined,
): Promise<TestOutcome> {
  const [bin, ...baseArgs] = testCmd;
  if (bin === undefined) throw new Error("test command is empty");
  const args = [...baseArgs, file, ...(testName === undefined ? [] : ["-t", testName])];
  const start = Date.now();

  if (!isVitest(testCmd)) {
    const run = await spawnCollect(bin, args, cwd);
    return { ...classifyFromOutput(run), exitCode: run.exitCode, durationMs: Date.now() - start };
  }

  // Vitest's JSON report says exactly how many tests ran, failed or failed to load.
  const reportDir = await mkdtemp(join(tmpdir(), "exhibit-a-report-"));
  try {
    const reportFile = join(reportDir, "report.json");
    const run = await spawnCollect(
      bin,
      [...args, "--reporter=json", `--outputFile=${reportFile}`],
      cwd,
    );
    const verdict =
      run.exitCode === null
        ? { status: "error" as const, output: `timed out or killed\n${run.combined}` }
        : classifyVitestReport(await readReport(reportFile), run.combined);
    return { ...verdict, exitCode: run.exitCode, durationMs: Date.now() - start };
  } finally {
    await rm(reportDir, { recursive: true, force: true });
  }
}

function isVitest(testCmd: readonly string[]): boolean {
  return testCmd.some((part) => basename(part) === "vitest");
}

const vitestReportSchema = z.object({
  testResults: z.array(
    z.object({
      status: z.string(),
      message: z.string().optional(),
      assertionResults: z.array(
        z.object({
          fullName: z.string(),
          status: z.string(),
          failureMessages: z.array(z.string()),
        }),
      ),
    }),
  ),
});

type VitestReport = z.infer<typeof vitestReportSchema>;

async function readReport(path: string): Promise<VitestReport | undefined> {
  try {
    const parsed = vitestReportSchema.safeParse(JSON.parse(await readFile(path, "utf8")));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export function classifyVitestReport(report: VitestReport | undefined, rawOutput: string): Verdict {
  if (report === undefined) {
    return { status: "error", output: truncate(`no test report produced\n${rawOutput}`) };
  }
  const brokenSuite = report.testResults.find(
    (suite) => suite.status === "failed" && suite.assertionResults.length === 0,
  );
  if (brokenSuite !== undefined) {
    return {
      status: "error",
      output: truncate(`test file failed to load: ${brokenSuite.message ?? ""}`),
    };
  }
  const ran = report.testResults
    .flatMap((suite) => suite.assertionResults)
    .filter((test) => test.status === "passed" || test.status === "failed");
  if (ran.length === 0) {
    return { status: "error", output: "no test ran: the file or test name matched nothing" };
  }
  const failed = ran.find((test) => test.status === "failed");
  if (failed !== undefined) {
    return {
      status: "fail",
      output: truncate(`${failed.fullName}\n${firstLines(failed.failureMessages[0] ?? "", 4)}`),
    };
  }
  return { status: "pass", output: `${ran.length} test(s) passed` };
}

// Fallback for runners without a machine-readable report: load errors are checked first
// so that a broken file can never be mistaken for a failing test.
const loadErrorMarkers =
  /No test files? found|No test found|Failed to load|Transform failed|SyntaxError|Cannot find module|ERR_MODULE_NOT_FOUND/;
const assertionMarkers = /AssertionError|expected .+ (?:to |not )/;

export function classifyFromOutput(run: { exitCode: number | null; combined: string }): Verdict {
  const output = truncate(run.combined);
  if (run.exitCode === null) return { status: "error", output: `timed out or killed\n${output}` };
  if (run.exitCode === 0) return { status: "pass", output };
  if (loadErrorMarkers.test(run.combined)) return { status: "error", output };
  if (assertionMarkers.test(run.combined)) return { status: "fail", output };
  return { status: "error", output };
}

type SpawnResult = { exitCode: number | null; combined: string };

function spawnCollect(bin: string, args: readonly string[], cwd: string): Promise<SpawnResult> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    // A process group of its own, so a timeout also kills the runner's workers: they hold
    // the output pipes open and would keep "close" from ever firing.
    const child = spawn(bin, args, { cwd, stdio: ["ignore", "pipe", "pipe"], detached: true });
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const killGroup = () => {
      if (child.pid === undefined) return;
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        // The group already exited.
      }
    };
    timeout.addEventListener("abort", killGroup, { once: true });
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    // A missing binary emits "error"; without a listener Node would crash.
    child.on("error", (error) => chunks.push(Buffer.from(`\n${error.message}\n`)));
    child.on("close", (code) => {
      timeout.removeEventListener("abort", killGroup);
      resolve({ exitCode: code, combined: Buffer.concat(chunks).toString("utf8") });
    });
  });
}

function firstLines(text: string, count: number): string {
  return text.split("\n").slice(0, count).join("\n");
}

/** Keeps an excerpt within the schema's limit. */
export function truncate(text: string): string {
  if (text.length <= EXCERPT_MAX) return text;
  // The end of test output carries the summary, so keep the tail.
  return `…${text.slice(text.length - (EXCERPT_MAX - 1))}`;
}
