export type Route =
  | { page: "home" }
  | { page: "trial"; caseId: string; step: number }
  | { page: "report"; caseId: string }
  | { page: "accuse"; caseId: string }
  | { page: "dashboard" }
  | { page: "remote-trial"; owner: string; repo: string; file: string }
  | { page: "try" }
  | { page: "not-found" };

const caseRoutes = ["trial", "report", "accuse"] as const;
type CasePage = (typeof caseRoutes)[number];

function isCasePage(page: string): page is CasePage {
  return caseRoutes.some((candidate) => candidate === page);
}

/** Hash routes keep the site fully static, e.g. `#/trial/<id>` or `#/r/<owner>/<repo>/<file>`. */
export function parseRoute(hash: string): Route {
  const parts = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  const [page, ...rest] = parts;
  if (page === undefined) return { page: "home" };
  if (rest.length === 0 && (page === "dashboard" || page === "try")) return { page };
  if (page === "trial" && rest[0] !== undefined && rest.length <= 2) {
    // An optional step deep-links to one moment of the trial, 1-based like the on-screen counter.
    const step = rest[1] === undefined ? 1 : Number(rest[1]);
    if (!Number.isInteger(step) || step < 1) return { page: "not-found" };
    return { page: "trial", caseId: rest[0], step };
  }
  if (isCasePage(page) && page !== "trial" && rest.length === 1 && rest[0] !== undefined) {
    return { page, caseId: rest[0] };
  }
  const [owner, repo, file] = rest;
  if (page === "r" && rest.length === 3 && owner && repo && file) {
    return { page: "remote-trial", owner, repo, file };
  }
  return { page: "not-found" };
}

export function trialHref(caseId: string, step?: number): string {
  const base = `#/trial/${encodeURIComponent(caseId)}`;
  return step === undefined ? base : `${base}/${step}`;
}

export function reportHref(caseId: string): string {
  return `#/report/${encodeURIComponent(caseId)}`;
}

export function accuseHref(caseId: string): string {
  return `#/accuse/${encodeURIComponent(caseId)}`;
}

export function remoteTrialHref(owner: string, repo: string, file: string): string {
  return `#/r/${[owner, repo, file].map(encodeURIComponent).join("/")}`;
}
