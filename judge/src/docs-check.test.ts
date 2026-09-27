import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkDocs, classify } from "./docs-check.ts";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "exhibit-a-docs-"));
  await mkdir(join(dir, "src"), { recursive: true });
  await writeFile(join(dir, "package.json"), JSON.stringify({ scripts: { test: "vitest run" } }));
  await writeFile(
    join(dir, "src", "index.ts"),
    "export const CODES = { BIENVENUE10: 10 };\nexport function priceCart() {}\n",
  );
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("classify", () => {
  it.each([
    ["src/index.ts", "file"],
    ["pnpm test", "script"],
    ["pnpm run lint", "script"],
    ["priceCart(lines)", "symbol"],
    ["BIENVENUE10", "symbol"],
    ["-1", undefined],
    ["a + b", undefined],
  ])("%s is a %s reference", (quote, kind) => {
    expect(classify(quote)).toBe(kind);
  });
});

describe("checkDocs", () => {
  it("flags every reference that does not match the code", async () => {
    await writeFile(
      join(dir, "README.md"),
      "Call `priceCart(lines)` with `BIENVENUE10` or `FIDELITE20`.\nRun `pnpm test` then `pnpm lint`.\nSee `src/index.ts` and `src/refunds.ts`.\n```ts\n`ignoredInsideFence`\n```\n",
    );
    const findings = await checkDocs(dir);
    const broken = findings.filter((f) => f.status === "broken").map((f) => f.quote);
    const holds = findings.filter((f) => f.status === "holds").map((f) => f.quote);
    expect(broken).toEqual(["FIDELITE20", "pnpm lint", "src/refunds.ts"]);
    expect(holds).toEqual(["priceCart(lines)", "BIENVENUE10", "pnpm test", "src/index.ts"]);
    expect(findings.find((f) => f.quote === "pnpm lint")).toMatchObject({
      line: 2,
      doc: "README.md",
    });
  });
});
