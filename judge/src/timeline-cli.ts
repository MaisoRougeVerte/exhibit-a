import { writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";
import { readRepoConfig } from "./repo-config.ts";
import { buildTimeline } from "./timeline.ts";

const { values } = parseArgs({
  options: {
    case: { type: "string" },
    file: { type: "string" },
    "test-name": { type: "string" },
    repo: { type: "string", default: "demo-repo" },
    "repo-name": { type: "string" },
    out: { type: "string" },
  },
});

if (values.case === undefined || values.file === undefined || values.out === undefined) {
  console.error(
    "usage: pnpm timeline --case <id> --file <test file> [--test-name <name>] [--repo <path>] [--repo-name <name>] --out <json>",
  );
  process.exit(1);
}

const repoDir = resolve(values.repo ?? "demo-repo");
const config = await readRepoConfig(repoDir);
const timeline = await buildTimeline({
  caseId: values.case,
  repoName: values["repo-name"] ?? basename(repoDir),
  repoDir,
  testCmd: config.test,
  file: values.file,
  testName: values["test-name"],
});
await writeFile(values.out, `${JSON.stringify(timeline, null, 2)}\n`, "utf8");
console.log(`timeline: ${timeline.commits.length} commits written to ${values.out}`);
