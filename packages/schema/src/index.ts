import { z } from "zod";
import { caseFileShape } from "./case-file.ts";
import { checkIntegrity } from "./integrity.ts";

export { assertNever } from "./assert-never.ts";
export type {
  CaseEvent,
  CaseFileShape,
  ClaimEvent,
  Evidence,
  Expression,
  VerdictEvent,
} from "./case-file.ts";
export { caseEventSchema, caseFileShape, evidenceSchema, expressionSchema } from "./case-file.ts";
export type { IntegrityIssue } from "./integrity.ts";
export { checkIntegrity } from "./integrity.ts";

/** Full case file schema: shape validation plus cross-event integrity rules. */
export const caseFileSchema = caseFileShape.superRefine((caseFile, ctx) => {
  for (const issue of checkIntegrity(caseFile)) {
    ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
  }
});

export type CaseFile = z.infer<typeof caseFileSchema>;

export type ParseResult = { ok: true; value: CaseFile } | { ok: false; error: string };

/** Parses untrusted JSON at a boundary. Never throws for invalid input. */
export function parseCaseFile(input: unknown): ParseResult {
  const result = caseFileSchema.safeParse(input);
  return result.success
    ? { ok: true, value: result.data }
    : { ok: false, error: z.prettifyError(result.error) };
}
export type { DocsFinding, DocsReport } from "./docs-report.ts";
export { docsReportSchema } from "./docs-report.ts";
export type { Timeline, TimelineCommit } from "./timeline.ts";
export { timelineSchema } from "./timeline.ts";
