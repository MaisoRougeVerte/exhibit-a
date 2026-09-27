import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { detectTestConfig, initRepo } from "./init.ts";

const exhibitDir = resolve(import.meta.dirname, "../..");
let repo: string;

beforeEach(async () => {
  repo = await mkdtemp(join(tmpdir(), "exhibit-a-init-"));
  await writeFile(join(repo, "package.json"), JSON.stringify({ devDependencies: { vitest: "5" } }));
  await writeFile(join(repo, "pnpm-lock.yaml"), "");
});

afterEach(async () => {
  await rm(repo, { recursive: true, force: true });
});

it("detects a vitest project run with pnpm", async () => {
  expect(await detectTestConfig(repo)).toEqual({
    test: ["node_modules/.bin/vitest", "run"],
    install: ["pnpm", "install"],
  });
});

it("sets up a repository and never overwrites existing files", async () => {
  await writeFile(join(repo, "AGENTS.md"), "# Agents\n");
  const first = await initRepo({ repoDir: repo, exhibitDir });
  expect(first.filter((r) => r.action === "created").map((r) => r.path)).toEqual([
    ".exhibit-a.json",
    "EXHIBIT-A.md",
    ".bob/custom_modes.yaml",
    ".bob/skills/exhibit-a/SKILL.md",
    ".github/workflows/exhibit-a.yml",
    "AGENTS.md",
  ]);
  const instructions = await readFile(join(repo, "EXHIBIT-A.md"), "utf8");
  expect(instructions).toContain("no claim without executable evidence");
  expect(instructions).toContain("judge/src/cli.ts cases/<case-id>.json --repo .");
  expect(instructions).not.toContain("{{JUDGE}}");

  const second = await initRepo({ repoDir: repo, exhibitDir });
  expect(second.every((r) => r.action === "skipped")).toBe(true);
});
