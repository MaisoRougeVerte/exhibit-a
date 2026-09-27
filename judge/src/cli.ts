import { parseArgs } from "node:util";
import { runJudge } from "./run.ts";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    repo: { type: "string", default: "demo-repo" },
    // Verify a recorded trial without rewriting it: exit 1 if any ruling differs.
    check: { type: "boolean", default: false },
  },
});

const caseFile = positionals[0];
if (caseFile === undefined) {
  console.error("usage: pnpm judge <case-file> [--repo <path>] [--check]");
  process.exit(1);
}

const repoDir = values.repo ?? "demo-repo";
const check = values.check ?? false;

const result = await runJudge(caseFile, repoDir, { write: !check });

if (!result.ok) {
  console.error(`judge: ${result.reason}`);
  process.exit(1);
}

console.log(`judge: re-ran ${result.ruledCount} evidence item(s) in ${caseFile}`);
if (result.changed.length > 0) {
  console.error(`judge: recorded rulings differ from this run for ${result.changed.join(", ")}`);
  if (check) process.exit(1);
} else if (check) {
  console.log("judge: every recorded ruling matches this run");
}
