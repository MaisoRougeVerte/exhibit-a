import {
  assertNever,
  type CaseEvent,
  type CaseFile,
  type Evidence,
  type Expression,
} from "@exhibit-a/schema";

export type Speaker = "investigator" | "prosecutor" | "judge" | "developer" | "narrator";

export type Effect = "none" | "objection" | "gavel";

type Scene = {
  speaker: Speaker;
  expression: Expression;
  line: string;
  effect: Effect;
};

type RulingStatus = "upheld" | "rejected" | "error";

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

function firstLine(text: string): string {
  const line = text
    .split("\n")
    .find((candidate) => /expected|Error|passed|bisect|line/.test(candidate));
  return (line ?? text.split("\n")[0] ?? "").trim().slice(0, 140);
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`;
}

/** Turns one event of the trial into what the stage shows: facts first, no filler. */
export function toScene(event: CaseEvent, caseFile: CaseFile): Scene {
  switch (event.type) {
    case "narration":
      // The opening shows the real bug report instead of scene-setting prose.
      return caseFile.events[0] === event
        ? {
            speaker: "narrator",
            expression: "neutral",
            line: `Bug report: ${caseFile.bugReport.title}. ${caseFile.bugReport.body}`,
            effect: "none",
          }
        : { speaker: "narrator", expression: "neutral", line: event.line, effect: "none" };
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
      return rulingScene(event, evidenceIndex(caseFile));
    case "verdict":
      return { speaker: "judge", expression: "neutral", line: event.line, effect: "gavel" };
    default:
      return assertNever(event);
  }
}

type Ruling = Extract<CaseEvent, { type: "ruling" }>;

function rulingScene(ruling: Ruling, index: ReadonlyMap<string, Evidence>): Scene {
  const evidence = index.get(ruling.evidenceId);
  const claim = evidence === undefined ? ruling.evidenceId : describeEvidence(evidence);
  const observed = firstLine(ruling.excerpt);
  const facts = `${observed === "" ? "" : ` Observed: ${observed}.`} (${seconds(ruling.durationMs)})`;
  switch (ruling.status) {
    case "upheld":
      return {
        speaker: "judge",
        expression: "neutral",
        line: `${ruling.evidenceId} upheld. Re-ran it: ${claim}.${facts}`,
        effect: "gavel",
      };
    case "rejected":
      return {
        speaker: "judge",
        expression: "angry",
        line: `${ruling.evidenceId} rejected. Re-ran it: it is not true that ${claim}.${facts}`,
        effect: "gavel",
      };
    case "error":
      return {
        speaker: "judge",
        expression: "thinking",
        line: `${ruling.evidenceId} could not run, so it carries no weight.${facts}`,
        effect: "gavel",
      };
    default:
      return assertNever(ruling.status);
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

/** The useful part of a test output: the failure line and what follows, never the stack. */
export function excerptSummary(excerpt: string): string {
  const lines = excerpt.split("\n").filter((line) => line.trim() !== "" && !/^\s*at\s/.test(line));
  return lines.slice(0, 3).join("\n");
}
