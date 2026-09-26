import {
  assertNever,
  type CaseEvent,
  type CaseFile,
  type Evidence,
  type Expression,
} from "@exhibit-a/schema";

export type Speaker = "investigator" | "prosecutor" | "judge" | "developer" | "narrator";

export type Effect = "none" | "objection" | "gavel";

export type Scene = {
  speaker: Speaker;
  expression: Expression;
  line: string;
  effect: Effect;
};

export type RulingStatus = "upheld" | "rejected" | "error";

export type RecordEntry = {
  evidence: Evidence;
  status: RulingStatus | "pending";
  excerpt: string;
};

/** Human-readable statement of what a piece of evidence asserts. */
export function describeEvidence(evidence: Evidence): string {
  const test = evidence.kind === "log-search" ? "" : testLabel(evidence.file, evidence.testName);
  switch (evidence.kind) {
    case "test":
      return `${test} ${evidence.expect === "fail" ? "fails" : "passes"} today`;
    case "test-at-commit":
      return `${test} ${evidence.expect === "fail" ? "fails" : "passes"} at ${evidence.commit}`;
    case "log-search":
      return `${evidence.expectMatches} lines of ${evidence.file} contain "${evidence.pattern}"`;
    case "bisect":
      return `bisecting ${test} from ${evidence.good} to ${evidence.bad} blames ${evidence.expectCulprit}`;
    default:
      return assertNever(evidence);
  }
}

function testLabel(file: string, testName: string | undefined): string {
  return testName === undefined ? file : `"${testName}"`;
}

function evidenceIndex(caseFile: CaseFile): Map<string, Evidence> {
  const index = new Map<string, Evidence>();
  for (const event of caseFile.events) {
    if (event.type !== "claim") continue;
    for (const item of event.evidence) index.set(item.id, item);
  }
  return index;
}

/** Turns one event of the trial into what the stage shows. */
export function toScene(event: CaseEvent, caseFile: CaseFile): Scene {
  switch (event.type) {
    case "narration":
      return { speaker: "narrator", expression: "neutral", line: event.line, effect: "none" };
    case "claim":
    case "objection":
    case "withdrawal":
      return {
        speaker: event.speaker,
        expression: event.expression,
        line: event.line,
        effect: event.type === "objection" ? "objection" : "none",
      };
    case "ruling":
      return rulingScene(event.evidenceId, event.status, evidenceIndex(caseFile));
    case "verdict":
      return { speaker: "judge", expression: "neutral", line: event.line, effect: "gavel" };
    default:
      return assertNever(event);
  }
}

function rulingScene(
  evidenceId: string,
  status: RulingStatus,
  index: ReadonlyMap<string, Evidence>,
): Scene {
  const evidence = index.get(evidenceId);
  const claim = evidence === undefined ? evidenceId : describeEvidence(evidence);
  switch (status) {
    case "upheld":
      return {
        speaker: "judge",
        expression: "neutral",
        line: `Exhibit ${evidenceId} is upheld. The court re-ran it: ${claim}.`,
        effect: "gavel",
      };
    case "rejected":
      return {
        speaker: "judge",
        expression: "angry",
        line: `Exhibit ${evidenceId} is rejected. The court re-ran it, and it is not true that ${claim}.`,
        effect: "gavel",
      };
    case "error":
      return {
        speaker: "judge",
        expression: "thinking",
        line: `Exhibit ${evidenceId} could not be run. It carries no weight.`,
        effect: "gavel",
      };
    default:
      return assertNever(status);
  }
}

/** Evidence presented up to and including `eventIndex`, with the judge's ruling if given yet. */
export function courtRecord(caseFile: CaseFile, eventIndex: number): RecordEntry[] {
  const entries = new Map<string, RecordEntry>();
  for (const event of caseFile.events.slice(0, eventIndex + 1)) {
    if (event.type === "claim") {
      for (const evidence of event.evidence) {
        entries.set(evidence.id, { evidence, status: "pending", excerpt: "" });
      }
    } else if (event.type === "ruling") {
      const entry = entries.get(event.evidenceId);
      if (entry !== undefined) {
        entries.set(event.evidenceId, { ...entry, status: event.status, excerpt: event.excerpt });
      }
    }
  }
  return [...entries.values()];
}
