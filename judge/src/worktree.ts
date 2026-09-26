import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type Worktree = {
  dir: string;
  cleanup: () => Promise<void>;
};

function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}

/**
 * Checks out `revision` in a temporary git worktree, links the repo's installed
 * node_modules, and copies `carry` files from the current working tree into it.
 * Carrying matters: the reproduction test is written today, so older commits do not
 * contain it, yet an alibi or a bisect must run that exact test against old code.
 */
export async function createWorktree(
  repoDir: string,
  revision: string,
  carry: readonly string[] = [],
): Promise<Worktree> {
  const base = await mkdtemp(join(tmpdir(), "exhibit-a-wt-"));
  const dir = join(base, "wt");
  const cleanup = async () => {
    await execFileAsync("git", ["-C", repoDir, "worktree", "remove", "--force", dir], {
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
    await rm(base, { recursive: true, force: true });
    await execFileAsync("git", ["-C", repoDir, "worktree", "prune"], {
      signal: AbortSignal.timeout(10_000),
    }).catch(() => undefined);
  };
  try {
    await execFileAsync("git", ["-C", repoDir, "worktree", "add", "--detach", dir, revision], {
      signal: AbortSignal.timeout(30_000),
    });
    if (await exists(join(repoDir, "node_modules"))) {
      await symlink(join(repoDir, "node_modules"), join(dir, "node_modules"));
    }
    // pnpm 11 tries to reinstall when it sees a workspace file it did not set up.
    for (const workspaceFile of ["pnpm-workspace.yaml", "pnpm-workspace.yml"]) {
      await rm(join(dir, workspaceFile), { force: true });
    }
    for (const file of carry) {
      const source = join(repoDir, file);
      if (!(await exists(source))) continue;
      await mkdir(dirname(join(dir, file)), { recursive: true });
      await copyFile(source, join(dir, file));
    }
  } catch (error) {
    await cleanup();
    throw error;
  }
  return { dir, cleanup };
}
