import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type Worktree = {
  dir: string;
  cleanup: () => Promise<void>;
};

/**
 * Creates a temporary git worktree at the given revision and symlinks node_modules
 * from the main repo so tests can run without reinstalling.
 * The worktree is always removed in the returned cleanup function.
 */
export async function createWorktree(repoDir: string, revision: string): Promise<Worktree> {
  const base = await mkdtemp(join(tmpdir(), "exhibit-a-wt-"));
  const dir = join(base, "wt");
  try {
    await execFileAsync("git", ["-C", repoDir, "worktree", "add", "--detach", dir, revision], {
      signal: AbortSignal.timeout(30_000),
    });
    // Symlink node_modules so vitest binaries are available without reinstalling.
    await symlink(join(repoDir, "node_modules"), join(dir, "node_modules"));
    // pnpm 11 needs a workspace root; drop the workspace file so it does not try to
    // reinitialise when the binary detects a monorepo.
    for (const wf of ["pnpm-workspace.yaml", "pnpm-workspace.yml"]) {
      await rm(join(dir, wf), { force: true });
    }
  } catch (err) {
    // Clean up the temp dir if worktree add failed before we even made the symlink.
    await rm(base, { recursive: true, force: true });
    await execFileAsync("git", ["-C", repoDir, "worktree", "remove", "--force", dir], {
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
    throw err;
  }
  const cleanup = async () => {
    await rm(base, { recursive: true, force: true });
    await execFileAsync("git", ["-C", repoDir, "worktree", "remove", "--force", dir], {
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  };
  return { dir, cleanup };
}

/**
 * Creates a regular temp directory (not a git worktree) — used for log-search
 * and other operations that do not need a checkout.
 */
export async function createTempDir(): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), "exhibit-a-tmp-"));
  // Ensure the dir itself exists (mkdtemp guarantees this but be explicit).
  await mkdir(dir, { recursive: true });
  const cleanup = async () => {
    await rm(dir, { recursive: true, force: true });
  };
  return { dir, cleanup };
}
