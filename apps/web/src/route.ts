export type Route =
  | { page: "home" }
  | { page: "trial"; caseId: string }
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
  if (isCasePage(page) && rest.length === 1 && rest[0] !== undefined) {
    return { page, caseId: rest[0] };
  }
  const [owner, repo, file] = rest;
  if (page === "r" && rest.length === 3 && owner && repo && file) {
    return { page: "remote-trial", owner, repo, file };
  }
  return { page: "not-found" };
}

export function trialHref(caseId: string): string {
  return `#/trial/${encodeURIComponent(caseId)}`;
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
