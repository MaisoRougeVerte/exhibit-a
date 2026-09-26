import { type CaseFile, parseCaseFile } from "@exhibit-a/schema";
import { z } from "zod";

/** Trials are published on this branch of the connected repository, under `cases/`. */
export const TRIALS_BRANCH = "exhibit-a";

export type Loaded<T> = { ok: true; value: T } | { ok: false; error: string };

export type RemoteTrial = { file: string; caseFile: CaseFile };

const listingSchema = z.array(z.object({ name: z.string(), type: z.string() }));

// One promise per key, so React's `use()` sees a stable value across renders.
function memoize<T>(load: (key: string) => Promise<T>): (key: string) => Promise<T> {
  const cache = new Map<string, Promise<T>>();
  return (key) => {
    const existing = cache.get(key);
    if (existing !== undefined) return existing;
    const promise = load(key);
    cache.set(key, promise);
    return promise;
  };
}

async function getJson(url: string): Promise<Loaded<unknown>> {
  try {
    const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (response.status === 404) return { ok: false, error: "not found" };
    if (!response.ok) return { ok: false, error: `GitHub answered ${response.status}` };
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, error: "network error" };
  }
}

function caseUrl(owner: string, repo: string, file: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${TRIALS_BRANCH}/cases/${file}`;
}

async function loadCase(owner: string, repo: string, file: string): Promise<Loaded<CaseFile>> {
  const json = await getJson(caseUrl(owner, repo, file));
  if (!json.ok) return json;
  const parsed = parseCaseFile(json.value);
  return parsed.ok ? { ok: true, value: parsed.value } : { ok: false, error: parsed.error };
}

async function loadTrials(owner: string, repo: string): Promise<Loaded<RemoteTrial[]>> {
  const listing = await getJson(
    `https://api.github.com/repos/${owner}/${repo}/contents/cases?ref=${TRIALS_BRANCH}`,
  );
  if (!listing.ok) {
    return listing.error === "not found"
      ? { ok: true, value: [] }
      : { ok: false, error: listing.error };
  }
  const entries = listingSchema.safeParse(listing.value);
  if (!entries.success) return { ok: false, error: "unexpected answer from GitHub" };
  const files = entries.data
    .filter((entry) => entry.type === "file" && entry.name.endsWith(".json"))
    .map((entry) => entry.name);
  const trials = await Promise.all(
    files.map(async (file) => ({ file, loaded: await loadCase(owner, repo, file) })),
  );
  return {
    ok: true,
    value: trials.flatMap(({ file, loaded }) =>
      loaded.ok ? [{ file, caseFile: loaded.value }] : [],
    ),
  };
}

const trialsByRepo = memoize((key) => {
  const [owner = "", repo = ""] = key.split("/");
  return loadTrials(owner, repo);
});

const caseByPath = memoize((key) => {
  const [owner = "", repo = "", ...file] = key.split("/");
  return loadCase(owner, repo, file.join("/"));
});

export function fetchTrials(owner: string, repo: string): Promise<Loaded<RemoteTrial[]>> {
  return trialsByRepo(`${owner}/${repo}`);
}

export function fetchCase(owner: string, repo: string, file: string): Promise<Loaded<CaseFile>> {
  return caseByPath(`${owner}/${repo}/${file}`);
}

export function parseRepoInput(input: string): { owner: string; repo: string } | undefined {
  const match =
    /^(?:https:\/\/github\.com\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/.exec(
      input.trim(),
    );
  const [, owner, repo] = match ?? [];
  return owner !== undefined && repo !== undefined ? { owner, repo } : undefined;
}
