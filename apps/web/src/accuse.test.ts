import type { Timeline } from "@exhibit-a/schema";
import { describe, expect, it } from "vitest";
import { accuse, culpritIndex } from "./accuse.ts";

const timeline: Timeline = {
  schemaVersion: 1,
  caseId: "framed-commit",
  repo: "crumb-and-co",
  file: "tests/repro/framed-commit.test.ts",
  generatedAt: "2026-09-26T14:00:00+02:00",
  commits: [
    { sha: "09c8ae1", subject: "bootstrap", status: "error" },
    { sha: "06856da", subject: "report", status: "pass" },
    { sha: "1293f22", subject: "async inventory", status: "fail" },
    { sha: "3cabb03", subject: "cart in euros", status: "fail" },
    { sha: "a6fe65a", subject: "rename stock module", status: "fail" },
  ],
};

describe("accuse", () => {
  it("finds the real culprit guilty: fails here, passed at its parent", () => {
    expect(accuse(timeline, 2)).toMatchObject({ verdict: "guilty", parent: { sha: "06856da" } });
  });

  it("acquits the framed commit on an alibi: its parent already fails", () => {
    expect(accuse(timeline, 4)).toMatchObject({ verdict: "alibi", parent: { sha: "3cabb03" } });
  });

  it("acquits a commit where the test passes", () => {
    expect(accuse(timeline, 1).verdict).toBe("innocent");
  });

  it("gives no ruling where the test cannot run", () => {
    expect(accuse(timeline, 0).verdict).toBe("no-ruling");
  });
});

describe("culpritIndex", () => {
  it("points at the first failing commit after a passing one", () => {
    expect(culpritIndex(timeline)).toBe(2);
  });
});
