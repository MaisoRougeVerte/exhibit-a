import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const exhibitAConfigSchema = z.object({
  test: z.array(z.string()).min(1),
  install: z.array(z.string()).optional(),
});

export type ExhibitAConfig = z.infer<typeof exhibitAConfigSchema>;

export async function readRepoConfig(repoDir: string): Promise<ExhibitAConfig> {
  const raw = await readFile(join(repoDir, ".exhibit-a.json"), "utf8");
  const parsed = exhibitAConfigSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new Error(`.exhibit-a.json is invalid: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}
