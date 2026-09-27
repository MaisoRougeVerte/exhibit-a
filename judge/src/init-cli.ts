import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { initRepo } from "./init.ts";

const { values } = parseArgs({ options: { repo: { type: "string" } } });
if (values.repo === undefined) {
  console.error("usage: pnpm init-repo --repo <path to the repository to set up>");
  process.exit(1);
}

const results = await initRepo({
  repoDir: resolve(values.repo),
  exhibitDir: resolve(import.meta.dirname, "../.."),
});
for (const result of results) {
  console.log(
    `${result.action.padEnd(8)} ${result.path}${result.reason === undefined ? "" : `  (${result.reason})`}`,
  );
}
console.log(
  "\nNext: open the repository in IBM Bob, pick the Tribunal mode, and give it a bug report.",
);
