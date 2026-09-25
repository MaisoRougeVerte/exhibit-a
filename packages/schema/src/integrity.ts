import { assertNever } from "./assert-never.ts";
import type { CaseEvent, CaseFileShape, ClaimEvent, VerdictEvent } from "./case-file.ts";

export type IntegrityIssue = {
  path: (string | number)[];
  message: string;
};

type RulingStatus = "upheld" | "rejected" | "error";

type Ledger = {
  ids: Set<string>;
  claims: Map<string, ClaimEvent>;
  objections: Set<string>;
  evidenceIds: Set<string>;
  rulings: Map<string, RulingStatus>;
  withdrawn: Set<string>;
  issues: IntegrityIssue[];
};

/**
 * Checks the rules a flat schema cannot express: references point backwards in time,
 * ids are unique, and the verdict only upholds claims whose every piece of evidence
 * the judge actually upheld. This is the "no claim without evidence" invariant.
 */
export function checkIntegrity(caseFile: CaseFileShape): IntegrityIssue[] {
  const ledger: Ledger = {
    ids: new Set(),
    claims: new Map(),
    objections: new Set(),
    evidenceIds: new Set(),
    rulings: new Map(),
    withdrawn: new Set(),
    issues: [],
  };
  const lastIndex = caseFile.events.length - 1;
  caseFile.events.forEach((event, index) => {
    visit(ledger, event, ["events", index], index === lastIndex);
  });
  if (caseFile.events.at(-1)?.type !== "verdict") {
    report(ledger, ["events"], "a trial must end with a verdict");
  }
  return ledger.issues;
}

function visit(ledger: Ledger, event: CaseEvent, path: (string | number)[], isLast: boolean) {
  switch (event.type) {
    case "narration":
      return;
    case "claim":
      return visitClaim(ledger, event, path);
    case "ruling":
      return visitRuling(ledger, event.evidenceId, event.status, path);
    case "objection":
      register(ledger, event.id, path);
      ledger.objections.add(event.id);
      return requireClaim(ledger, event.target, [...path, "target"]);
    case "withdrawal":
      requireClaim(ledger, event.target, [...path, "target"]);
      if (ledger.withdrawn.has(event.target)) {
        report(ledger, [...path, "target"], `claim "${event.target}" is already withdrawn`);
      }
      ledger.withdrawn.add(event.target);
      return;
    case "verdict":
      if (!isLast) report(ledger, path, "the verdict must be the last event");
      return visitVerdict(ledger, event, path);
    default:
      return assertNever(event);
  }
}

function visitClaim(ledger: Ledger, claim: ClaimEvent, path: (string | number)[]) {
  register(ledger, claim.id, path);
  ledger.claims.set(claim.id, claim);
  if (claim.respondsTo !== undefined && !ledger.objections.has(claim.respondsTo)) {
    report(ledger, [...path, "respondsTo"], `no earlier objection "${claim.respondsTo}"`);
  }
  claim.evidence.forEach((item, index) => {
    register(ledger, item.id, [...path, "evidence", index]);
    ledger.evidenceIds.add(item.id);
  });
}

function visitRuling(
  ledger: Ledger,
  evidenceId: string,
  status: RulingStatus,
  path: (string | number)[],
) {
  if (!ledger.evidenceIds.has(evidenceId)) {
    report(ledger, [...path, "evidenceId"], `no earlier evidence "${evidenceId}"`);
  } else if (ledger.rulings.has(evidenceId)) {
    report(ledger, [...path, "evidenceId"], `evidence "${evidenceId}" was already ruled on`);
  }
  ledger.rulings.set(evidenceId, status);
}

function visitVerdict(ledger: Ledger, verdict: VerdictEvent, path: (string | number)[]) {
  verdict.upheldClaims.forEach((claimId, index) => {
    const claimPath = [...path, "upheldClaims", index];
    const claim = ledger.claims.get(claimId);
    if (claim === undefined) {
      report(ledger, claimPath, `no earlier claim "${claimId}"`);
      return;
    }
    if (ledger.withdrawn.has(claimId)) {
      report(ledger, claimPath, `claim "${claimId}" was withdrawn and cannot be upheld`);
    }
    for (const item of claim.evidence) {
      if (ledger.rulings.get(item.id) !== "upheld") {
        report(
          ledger,
          claimPath,
          `claim "${claimId}" relies on evidence "${item.id}" that the judge did not uphold`,
        );
      }
    }
  });
}

function register(ledger: Ledger, id: string, path: (string | number)[]) {
  if (ledger.ids.has(id)) report(ledger, [...path, "id"], `duplicate id "${id}"`);
  ledger.ids.add(id);
}

function requireClaim(ledger: Ledger, claimId: string, path: (string | number)[]) {
  if (!ledger.claims.has(claimId)) report(ledger, path, `no earlier claim "${claimId}"`);
}

function report(ledger: Ledger, path: (string | number)[], message: string) {
  ledger.issues.push({ path, message });
}
