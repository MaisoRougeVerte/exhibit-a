import { z } from "zod";

/**
 * Outcome of one reproduction test at every commit of a repository, oldest first.
 * Produced by the real judge, so a page can let visitors accuse any commit without
 * running anything in the browser.
 */
export const timelineSchema = z.object({
  schemaVersion: z.literal(1),
  caseId: z.string().regex(/^[a-z][a-z0-9-]*$/),
  repo: z.string().min(1),
  file: z.string().min(1),
  testName: z.string().min(1).optional(),
  generatedAt: z.iso.datetime({ offset: true }),
  commits: z
    .array(
      z.object({
        sha: z.string().regex(/^[0-9a-f]{7,40}$/),
        subject: z.string(),
        status: z.enum(["pass", "fail", "error"]),
      }),
    )
    .min(1),
});

export type Timeline = z.infer<typeof timelineSchema>;
export type TimelineCommit = Timeline["commits"][number];
