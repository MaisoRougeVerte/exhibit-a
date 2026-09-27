import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import type { DocsFinding } from "@exhibit-a/schema";

type Reference = Pick<DocsFinding, "doc" | "line" | "quote" | "kind">;

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "bug-reports"]);
const PATH_LIKE = /^[\w./-]+\.(ts|tsx|js|mjs|json|md|jsonl|ya?ml)$|^[\w-]+\/[\w./-]+$/;
const PNPM = /^pnpm (?:run )?([\w:-]+)/;
const BUILTIN_PNPM = new Set(["install", "i", "add", "exec", "dlx"]);
const IDENTIFIER = /^([A-Za-z_$][\w$]*)(?:\(.*\))?$/;

async function walk(dir: string, keep: (path: string) => boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : walk(path, keep);
      return keep(path) ? [path] : [];
    }),
  );
  return nested.flat();
}

/** Classifies an inline code span; anything that is not a checkable reference is ignored. */
export function classify(quote: string): Reference["kind"] | undefined {
  if (PNPM.test(quote)) return "script";
  if (PATH_LIKE.test(quote) && !quote.includes(" ")) return "file";
  const identifier = IDENTIFIER.exec(quote)?.[1];
  if (identifier !== undefined && identifier.length >= 4) return "symbol";
  return undefined;
}

function referencesIn(doc: string, text: string): Reference[] {
  const references: Reference[] = [];
  let inFence = false;
  text.split("\n").forEach((content, index) => {
    if (content.trimStart().startsWith("```")) inFence = !inFence;
    if (inFence) return;
    for (const match of content.matchAll(/`([^`\n]+)`/g)) {
      const quote = match[1]?.trim() ?? "";
      const kind = classify(quote);
      if (kind !== undefined) references.push({ doc, line: index + 1, quote, kind });
    }
  });
  return references;
}

type Repo = { dir: string; scripts: Set<string>; source: string };

async function loadRepo(dir: string): Promise<Repo> {
  const pkg: unknown = JSON.parse(
    await readFile(join(dir, "package.json"), "utf8").catch(() => "{}"),
  );
  const scripts =
    typeof pkg === "object" &&
    pkg !== null &&
    "scripts" in pkg &&
    typeof pkg.scripts === "object" &&
    pkg.scripts !== null
      ? Object.keys(pkg.scripts)
      : [];
  const sourceFiles = await walk(join(dir, "src"), (path) => /\.(ts|tsx|js|mjs)$/.test(path));
  const source = (await Promise.all(sourceFiles.map((path) => readFile(path, "utf8")))).join("\n");
  return { dir, scripts: new Set(scripts), source };
}

function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

function verdict(reference: Reference, found: boolean, holds: string, broken: string): DocsFinding {
  return { ...reference, status: found ? "holds" : "broken", detail: found ? holds : broken };
}

async function check(repo: Repo, reference: Reference): Promise<DocsFinding> {
  switch (reference.kind) {
    case "file":
      return verdict(
        reference,
        await exists(join(repo.dir, reference.quote)),
        "file exists",
        "no such file in the repository",
      );
    case "script": {
      const name = PNPM.exec(reference.quote)?.[1] ?? "";
      return verdict(
        reference,
        BUILTIN_PNPM.has(name) || repo.scripts.has(name),
        `package.json defines "${name}"`,
        `package.json has no "${name}" script`,
      );
    }
    case "symbol": {
      const name = IDENTIFIER.exec(reference.quote)?.[1] ?? reference.quote;
      const pattern = new RegExp(`\\b${name.replace(/\$/g, "\\$")}\\b`);
      return verdict(
        reference,
        pattern.test(repo.source),
        `"${name}" appears in src/`,
        `"${name}" appears nowhere in src/`,
      );
    }
    default:
      return reference.kind satisfies never;
  }
}

/** Reads README and docs/, then checks every code reference against the repository. */
export async function checkDocs(repoDir: string): Promise<DocsFinding[]> {
  const repo = await loadRepo(repoDir);
  const docs = [
    ...((await exists(join(repoDir, "README.md"))) ? [join(repoDir, "README.md")] : []),
    ...(await walk(join(repoDir, "docs"), (path) => path.endsWith(".md"))),
  ];
  const findings: DocsFinding[] = [];
  for (const path of docs.sort()) {
    const references = referencesIn(relative(repoDir, path), await readFile(path, "utf8"));
    for (const reference of references) findings.push(await check(repo, reference));
  }
  return findings;
}
