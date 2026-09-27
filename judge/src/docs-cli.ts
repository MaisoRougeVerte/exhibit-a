import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { parseArgs, promisify } from "node:util";
import type { DocsReport } from "@exhibit-a/schema";
import { checkDocs } from "./docs-check.ts";

const { values } = parseArgs({
  options: {
    repo: { type: "string", default: "demo-repo" },
    "repo-name": { type: "string" },
    out: { type: "string" },
  },
});

const repoDir = resolve(values.repo ?? "demo-repo");
const { stdout } = await promisify(execFile)(
  "git",
  ["-C", repoDir, "rev-parse", "--short", "HEAD"],
  {
    signal: AbortSignal.timeout(10_000),
  },
);
const report: DocsReport = {
  schemaVersion: 1,
  repo: values["repo-name"] ?? basename(repoDir),
  head: stdout.trim(),
  generatedAt: new Date().toISOString(),
  findings: await checkDocs(repoDir),
};
const broken = report.findings.filter((finding) => finding.status === "broken");
for (const finding of broken) {
  console.log(`${finding.doc}:${finding.line}  ${finding.quote}  ${finding.detail}`);
}
console.log(`docs: ${report.findings.length} references checked, ${broken.length} broken`);
if (values.out !== undefined)
  await writeFile(values.out, `${JSON.stringify(report, null, 2)}\n`, "utf8");
