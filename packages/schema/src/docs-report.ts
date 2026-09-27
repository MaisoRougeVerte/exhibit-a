import { z } from "zod";

/** Every code reference a document makes, checked against the repository by plain code. */
export const docsReportSchema = z.object({
  schemaVersion: z.literal(1),
  repo: z.string().min(1),
  head: z.string().regex(/^[0-9a-f]{7,40}$/),
  generatedAt: z.iso.datetime({ offset: true }),
  findings: z.array(
    z.object({
      doc: z.string().min(1),
      line: z.int().positive(),
      quote: z.string().min(1),
      kind: z.enum(["file", "script", "symbol"]),
      status: z.enum(["holds", "broken"]),
      detail: z.string(),
    }),
  ),
});

export type DocsReport = z.infer<typeof docsReportSchema>;
export type DocsFinding = DocsReport["findings"][number];
