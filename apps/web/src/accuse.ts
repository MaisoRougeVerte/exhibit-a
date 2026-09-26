import type { Timeline, TimelineCommit } from "@exhibit-a/schema";

export type Accusation =
  | { verdict: "guilty"; commit: TimelineCommit; parent: TimelineCommit | undefined }
  | { verdict: "alibi"; commit: TimelineCommit; parent: TimelineCommit }
  | { verdict: "innocent"; commit: TimelineCommit }
  | { verdict: "no-ruling"; commit: TimelineCommit };

/**
 * Rules on an accusation the way the judge checks an alibi: a commit is guilty only if
 * the test fails there and did not fail at its parent. A parent where the test cannot
 * run yet counts as "bug absent", since the code under test did not exist.
 */
export function accuse(timeline: Timeline, index: number): Accusation {
  const commit = timeline.commits[index];
  if (commit === undefined) throw new Error(`no commit at index ${index}`);
  if (commit.status === "error") return { verdict: "no-ruling", commit };
  if (commit.status === "pass") return { verdict: "innocent", commit };
  const parent = timeline.commits[index - 1];
  if (parent?.status === "fail") return { verdict: "alibi", commit, parent };
  return { verdict: "guilty", commit, parent };
}

/** Index of the commit that introduced the failure, as a bisect would find it. */
export function culpritIndex(timeline: Timeline): number | undefined {
  const index = timeline.commits.findIndex(
    (commit, i) => commit.status === "fail" && timeline.commits[i - 1]?.status !== "fail",
  );
  return index === -1 ? undefined : index;
}
