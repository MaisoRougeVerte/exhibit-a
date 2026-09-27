import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

export type InitResult = { path: string; action: "created" | "skipped"; reason?: string };

type TestConfig = { test: string[]; install?: string[] };

function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

async function packageManager(repoDir: string): Promise<string> {
  if (await exists(join(repoDir, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(join(repoDir, "yarn.lock"))) return "yarn";
  return "npm";
}

/** Guesses the test command from the repository, preferring runners the judge reads natively. */
export async function detectTestConfig(repoDir: string): Promise<TestConfig | undefined> {
  const raw = await readFile(join(repoDir, "package.json"), "utf8").catch(() => undefined);
  if (raw !== undefined) {
    const install = [await packageManager(repoDir), "install"];
    if (raw.includes('"vitest"')) return { test: ["node_modules/.bin/vitest", "run"], install };
    if (raw.includes('"jest"')) return { test: ["node_modules/.bin/jest"], install };
    return { test: [install[0] ?? "npm", "test", "--"], install };
  }
  if (
    (await exists(join(repoDir, "pyproject.toml"))) ||
    (await exists(join(repoDir, "pytest.ini")))
  ) {
    return { test: ["python", "-m", "pytest"] };
  }
  if (await exists(join(repoDir, "go.mod"))) return { test: ["go", "test"] };
  return undefined;
}

async function writeOnce(path: string, content: string, results: InitResult[], root: string) {
  const shown = relative(root, path);
  if (await exists(path)) {
    results.push({ path: shown, action: "skipped", reason: "already exists" });
    return;
  }
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  results.push({ path: shown, action: "created" });
}

type InitOptions = {
  repoDir: string;
  /** Root of the Exhibit A checkout, used for templates and the judge command. */
  exhibitDir: string;
};

/**
 * Sets up a repository for trials without touching anything that already exists: test
 * config, agent instructions, the Bob tribunal mode and skill, and the GitHub workflow.
 */
export async function initRepo({ repoDir, exhibitDir }: InitOptions): Promise<InitResult[]> {
  const results: InitResult[] = [];
  const judge = `node ${relative(repoDir, join(exhibitDir, "judge/src/cli.ts")) || "judge/src/cli.ts"}`;
  const fill = (text: string) => text.replaceAll("{{JUDGE}}", judge);

  const config = await detectTestConfig(repoDir);
  if (config === undefined) {
    results.push({
      path: ".exhibit-a.json",
      action: "skipped",
      reason: "no test runner detected, write it by hand",
    });
  } else {
    await writeOnce(
      join(repoDir, ".exhibit-a.json"),
      `${JSON.stringify(config, null, 2)}\n`,
      results,
      repoDir,
    );
  }

  const procedure = await readFile(join(exhibitDir, "judge/templates/procedure.md"), "utf8");
  const skill = await readFile(join(exhibitDir, ".bob/skills/exhibit-a/SKILL.md"), "utf8");
  // The skill body is the authoritative case file format; drop its front matter and repo-specific pointer.
  const format = skill
    .replace(/^---[\s\S]*?---\s*/, "")
    .replace(/The schema source of truth is[\s\S]*?there\.\n/, "")
    .replace(/^# .*\n/, "## Case file format\n");
  await writeOnce(join(repoDir, "EXHIBIT-A.md"), fill(`${procedure}${format}`), results, repoDir);

  const modes = await readFile(join(exhibitDir, "judge/templates/custom_modes.yaml"), "utf8");
  await writeOnce(join(repoDir, ".bob/custom_modes.yaml"), fill(modes), results, repoDir);
  await writeOnce(join(repoDir, ".bob/skills/exhibit-a/SKILL.md"), skill, results, repoDir);

  const workflow = await readFile(join(exhibitDir, "action/example-workflow.yml"), "utf8");
  await writeOnce(join(repoDir, ".github/workflows/exhibit-a.yml"), workflow, results, repoDir);

  const agents = join(repoDir, "AGENTS.md");
  if (await exists(agents)) {
    const text = await readFile(agents, "utf8");
    if (!text.includes("EXHIBIT-A.md")) {
      await writeFile(
        agents,
        `${text.trimEnd()}\n\nTo debug a bug, follow EXHIBIT-A.md: no claim without executable evidence.\n`,
      );
      results.push({
        path: "AGENTS.md",
        action: "created",
        reason: "pointer to EXHIBIT-A.md appended",
      });
    }
  }
  return results;
}
