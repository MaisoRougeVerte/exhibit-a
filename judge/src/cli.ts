import { parseArgs } from "node:util";
import { runJudge } from "./run.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    repo: { type: "string", default: "demo-repo" },
  },
});

const caseFile = positionals[0];
if (caseFile === undefined) {
  console.error("usage: pnpm judge <case-file> [--repo <path>]");
  process.exit(1);
}

const repoDir = values.repo ?? "demo-repo";

const result = await runJudge(caseFile, repoDir);

if (!result.ok) {
  console.error(`judge: ${result.reason}`);
  process.exit(1);
}

console.log(`judge: ruled ${result.ruledCount} evidence item(s) in ${caseFile}`);
