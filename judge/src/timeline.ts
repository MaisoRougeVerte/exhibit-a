import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Timeline, TimelineCommit } from "@exhibit-a/schema";
import { runTest } from "./run-test.ts";
import { createWorktree } from "./worktree.ts";

const execFileAsync = promisify(execFile);

export type TimelineRequest = {
  caseId: string;
  repoName: string;
  repoDir: string;
  testCmd: string[];
  file: string;
  testName?: string | undefined;
};

/** Runs today's reproduction test against every commit, one checkout at a time. */
export async function buildTimeline(request: TimelineRequest): Promise<Timeline> {
  const { stdout } = await execFileAsync(
    "git",
    ["-C", request.repoDir, "log", "--reverse", "--format=%h%x09%s"],
    { signal: AbortSignal.timeout(10_000) },
  );
  const commits: TimelineCommit[] = [];
  for (const line of stdout.trim().split("\n")) {
    const [sha = "", subject = ""] = line.split("\t");
    commits.push({ sha, subject, status: await statusAt(request, sha) });
  }
  return {
    schemaVersion: 1,
    caseId: request.caseId,
    repo: request.repoName,
    file: request.file,
    ...(request.testName === undefined ? {} : { testName: request.testName }),
    generatedAt: new Date().toISOString(),
    commits,
  };
}

async function statusAt(request: TimelineRequest, sha: string): Promise<TimelineCommit["status"]> {
  const worktree = await createWorktree(request.repoDir, sha, [request.file]);
  try {
    const outcome = await runTest(request.testCmd, worktree.dir, request.file, request.testName);
    return outcome.status;
  } finally {
    await worktree.cleanup();
  }
}
