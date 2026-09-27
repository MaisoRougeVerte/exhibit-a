export type Route =
  | { page: "home" }
  | { page: "trial"; caseId: string; step: number }
  | { page: "report"; caseId: string }
  | { page: "accuse"; caseId: string }
  | { page: "dashboard" }
  | { page: "remote-trial"; owner: string; repo: string; file: string }
  | { page: "try" }
  | { page: "docs"; repo: string }
  | { page: "not-found" };

type Parser = (rest: readonly string[]) => Route | undefined;

const one = (rest: readonly string[]) => (rest.length === 1 ? rest[0] : undefined);

const parsers: Record<string, Parser> = {
  dashboard: (rest) => (rest.length === 0 ? { page: "dashboard" } : undefined),
  try: (rest) => (rest.length === 0 ? { page: "try" } : undefined),
  report: (rest) => {
    const caseId = one(rest);
    return caseId === undefined ? undefined : { page: "report", caseId };
  },
  accuse: (rest) => {
    const caseId = one(rest);
    return caseId === undefined ? undefined : { page: "accuse", caseId };
  },
  docs: (rest) => {
    const repo = one(rest);
    return repo === undefined ? undefined : { page: "docs", repo };
  },
  trial: (rest) => {
    const [caseId, rawStep] = rest;
    if (caseId === undefined || rest.length > 2) return undefined;
    // An optional step deep-links to one moment of the trial, 1-based like the on-screen counter.
    const step = rawStep === undefined ? 1 : Number(rawStep);
    return Number.isInteger(step) && step >= 1 ? { page: "trial", caseId, step } : undefined;
  },
  r: (rest) => {
    const [owner, repo, file] = rest;
    return rest.length === 3 && owner && repo && file
      ? { page: "remote-trial", owner, repo, file }
      : undefined;
  },
};

/** Hash routes keep the site fully static, e.g. `#/trial/<id>` or `#/r/<owner>/<repo>/<file>`. */
export function parseRoute(hash: string): Route {
  const parts = hash
    .replace(/^#\/?/, "")
    .split("/")
    .filter(Boolean)
    .map((part) => decodeURIComponent(part));
  const [page, ...rest] = parts;
  if (page === undefined) return { page: "home" };
  return parsers[page]?.(rest) ?? { page: "not-found" };
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

export function docsHref(repo: string): string {
  return `#/docs/${encodeURIComponent(repo)}`;
}
