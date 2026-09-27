import type { CaseEvent, CaseFile } from "@exhibit-a/schema";

export type Scoreboard = {
  trials: number;
  claims: number;
  withdrawn: number;
  survived: number;
  evidence: number;
  rejected: number;
  objections: number;
};

type Tally = Omit<Scoreboard, "trials">;

function count(events: readonly CaseEvent[], predicate: (event: CaseEvent) => boolean): number {
  return events.filter(predicate).length;
}

function tallyOf(caseFile: CaseFile): Tally {
  const events = caseFile.events;
  const claims = new Set(
    events.flatMap((e) => (e.type === "claim" && e.speaker === "investigator" ? [e.id] : [])),
  );
  const withdrawn = new Set(events.flatMap((e) => (e.type === "withdrawal" ? [e.target] : [])));
  const upheld = events.flatMap((e) => (e.type === "verdict" ? e.upheldClaims : []));
  return {
    claims: claims.size,
    withdrawn: [...claims].filter((id) => withdrawn.has(id)).length,
    survived: upheld.filter((id) => claims.has(id)).length,
    evidence: count(events, (e) => e.type === "ruling"),
    rejected: count(events, (e) => e.type === "ruling" && e.status !== "upheld"),
    objections: count(events, (e) => e.type === "objection"),
  };
}

/**
 * How the investigator's claims fared in court: the share that did not survive is a
 * measured hallucination rate, not an estimate.
 */
export function scoreboard(cases: readonly CaseFile[]): Scoreboard {
  const empty: Tally = {
    claims: 0,
    withdrawn: 0,
    survived: 0,
    evidence: 0,
    rejected: 0,
    objections: 0,
  };
  const total = cases.map(tallyOf).reduce(
    (sum, tally) => ({
      claims: sum.claims + tally.claims,
      withdrawn: sum.withdrawn + tally.withdrawn,
      survived: sum.survived + tally.survived,
      evidence: sum.evidence + tally.evidence,
      rejected: sum.rejected + tally.rejected,
      objections: sum.objections + tally.objections,
    }),
    empty,
  );
  return { trials: cases.length, ...total };
}
