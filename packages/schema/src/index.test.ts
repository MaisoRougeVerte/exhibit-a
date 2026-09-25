import { describe, expect, it } from "vitest";
import { type CaseEvent, type Evidence, parseCaseFile } from "./index.ts";

const testEvidence = {
  id: "ev-1",
  kind: "test",
  file: "tests/stock-race.test.ts",
  expect: "fail",
} satisfies Evidence;

const claim = {
  type: "claim",
  id: "claim-1",
  speaker: "investigator",
  expression: "confident",
  line: "The stock check races with the decrement.",
  evidence: [testEvidence],
} satisfies CaseEvent;

const upheld = {
  type: "ruling",
  evidenceId: "ev-1",
  status: "upheld",
  exitCode: 1,
  excerpt: "expected stock >= 0, received -1",
  durationMs: 812,
} satisfies CaseEvent;

const verdict = {
  type: "verdict",
  rootCause: "reserveStock awaits between the availability check and the decrement.",
  upheldClaims: ["claim-1"],
  fixSummary: "Make the check and the decrement a single atomic operation.",
  line: "The court finds the race condition guilty.",
} satisfies CaseEvent;

function caseWith(events: CaseEvent[]) {
  return {
    schemaVersion: 1,
    id: "framed-commit",
    title: "The Framed Commit",
    source: "fixture",
    recordedAt: "2026-09-26T01:00:00+02:00",
    repo: { name: "crumb-and-co", head: "abc1234" },
    bugReport: { title: "Stock goes negative", body: "Two customers bought the last baguette." },
    events,
  };
}

function errorOf(events: CaseEvent[]): string {
  const result = parseCaseFile(caseWith(events));
  if (result.ok) throw new Error("expected the case file to be rejected");
  return result.error;
}

describe("parseCaseFile", () => {
  it("accepts a trial whose upheld claims have upheld evidence", () => {
    expect(parseCaseFile(caseWith([claim, upheld, verdict])).ok).toBe(true);
  });

  it("rejects a claim without evidence", () => {
    expect(errorOf([{ ...claim, evidence: [] }, verdict])).toContain("inadmissible");
  });

  it("rejects a verdict that upholds a claim whose evidence was rejected", () => {
    const rejected = { ...upheld, status: "rejected" } satisfies CaseEvent;
    expect(errorOf([claim, rejected, verdict])).toContain("did not uphold");
  });

  it("rejects a verdict that upholds a claim never ruled on", () => {
    expect(errorOf([claim, verdict])).toContain("did not uphold");
  });

  it("rejects a verdict that upholds a withdrawn claim", () => {
    const withdrawal = {
      type: "withdrawal",
      speaker: "investigator",
      target: "claim-1",
      expression: "sweating",
      line: "I withdraw the accusation.",
    } satisfies CaseEvent;
    expect(errorOf([claim, upheld, withdrawal, verdict])).toContain("withdrawn");
  });

  it("rejects an objection that targets a claim not made yet", () => {
    const objection = {
      type: "objection",
      id: "obj-1",
      speaker: "prosecutor",
      target: "claim-1",
      expression: "angry",
      line: "Objection!",
    } satisfies CaseEvent;
    expect(errorOf([objection, claim, upheld, verdict])).toContain('no earlier claim "claim-1"');
  });

  it("rejects a ruling on unknown evidence", () => {
    expect(errorOf([claim, { ...upheld, evidenceId: "ev-9" }, verdict])).toContain(
      'no earlier evidence "ev-9"',
    );
  });

  it("rejects a second ruling on the same evidence", () => {
    expect(errorOf([claim, upheld, upheld, verdict])).toContain("already ruled on");
  });

  it("rejects duplicate ids", () => {
    const twin = { ...claim, evidence: [{ ...testEvidence, id: "ev-2" }] };
    expect(errorOf([claim, upheld, twin, verdict])).toContain('duplicate id "claim-1"');
  });

  it("requires the verdict to be the last event", () => {
    const narration = { type: "narration", line: "The court is adjourned." } satisfies CaseEvent;
    expect(errorOf([claim, upheld, verdict, narration])).toContain("must end with a verdict");
  });

  it("rejects evidence paths that escape the repository", () => {
    const escaping = { ...claim, evidence: [{ ...testEvidence, file: "../secrets.txt" }] };
    expect(errorOf([escaping, upheld, verdict])).toContain("stay inside the repository");
  });
});
