export type Route =
  | { page: "home" }
  | { page: "trial"; caseId: string }
  | { page: "report"; caseId: string }
  | { page: "not-found" };

/** Hash routes keep the site fully static: `#/trial/<id>` and `#/report/<id>`. */
export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [page, caseId, ...rest] = parts;
  if (page === undefined) return { page: "home" };
  if (caseId === undefined || rest.length > 0) return { page: "not-found" };
  if (page === "trial") return { page: "trial", caseId: decodeURIComponent(caseId) };
  if (page === "report") return { page: "report", caseId: decodeURIComponent(caseId) };
  return { page: "not-found" };
}

export function trialHref(caseId: string): string {
  return `#/trial/${encodeURIComponent(caseId)}`;
}

export function reportHref(caseId: string): string {
  return `#/report/${encodeURIComponent(caseId)}`;
}
