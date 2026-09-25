import { z } from "zod";

const idSchema = z
  .string()
  .regex(/^[a-z][a-z0-9-]*$/, "ids must be lowercase slugs, like `claim-1`");

const shaSchema = z
  .string()
  .regex(/^[0-9a-f]{7,40}$/, "expected an abbreviated or full commit sha");

const revisionSchema = z
  .string()
  .regex(/^[0-9a-f]{7,40}(?:~\d+|\^)?$/, "expected a commit sha, optionally followed by ~n or ^");

const repoPathSchema = z
  .string()
  .min(1)
  .refine(
    (path) => !path.startsWith("/") && !path.split("/").includes(".."),
    "paths must be relative and stay inside the repository",
  );

const lineSchema = z.string().trim().min(1).max(280);

export const expressionSchema = z.enum([
  "neutral",
  "confident",
  "thinking",
  "sweating",
  "shocked",
  "angry",
  "smug",
  "defeated",
]);

const testTarget = {
  file: repoPathSchema,
  testName: z.string().min(1).optional(),
};

export const evidenceSchema = z.discriminatedUnion("kind", [
  z.object({
    id: idSchema,
    kind: z.literal("test"),
    ...testTarget,
    expect: z.enum(["fail", "pass"]),
  }),
  z.object({
    id: idSchema,
    kind: z.literal("test-at-commit"),
    ...testTarget,
    commit: revisionSchema,
    expect: z.enum(["fail", "pass"]),
  }),
  z.object({
    id: idSchema,
    kind: z.literal("log-search"),
    file: repoPathSchema,
    pattern: z.string().min(1),
    expectMatches: z.int().nonnegative(),
  }),
  z.object({
    id: idSchema,
    kind: z.literal("bisect"),
    ...testTarget,
    good: revisionSchema,
    bad: revisionSchema,
    expectCulprit: shaSchema,
  }),
]);

const narrationEvent = z.object({
  type: z.literal("narration"),
  line: lineSchema,
});

const claimEvent = z.object({
  type: z.literal("claim"),
  id: idSchema,
  speaker: z.enum(["investigator", "prosecutor"]),
  expression: expressionSchema,
  line: lineSchema,
  evidence: z.array(evidenceSchema).min(1, "a claim without evidence is inadmissible"),
  respondsTo: idSchema.optional(),
});

const rulingEvent = z.object({
  type: z.literal("ruling"),
  evidenceId: idSchema,
  status: z.enum(["upheld", "rejected", "error"]),
  exitCode: z.int().nullable(),
  excerpt: z.string().max(2000),
  durationMs: z.int().nonnegative(),
});

const objectionEvent = z.object({
  type: z.literal("objection"),
  id: idSchema,
  speaker: z.enum(["prosecutor", "developer"]),
  target: idSchema,
  expression: expressionSchema,
  line: lineSchema,
});

const withdrawalEvent = z.object({
  type: z.literal("withdrawal"),
  speaker: z.literal("investigator"),
  target: idSchema,
  expression: expressionSchema,
  line: lineSchema,
});

const verdictEvent = z.object({
  type: z.literal("verdict"),
  rootCause: z.string().trim().min(1).max(1000),
  culpritCommit: shaSchema.optional(),
  upheldClaims: z.array(idSchema).min(1),
  regressionTest: z.object(testTarget).optional(),
  fixSummary: z.string().trim().min(1).max(1000),
  line: lineSchema,
});

export const caseEventSchema = z.discriminatedUnion("type", [
  narrationEvent,
  claimEvent,
  rulingEvent,
  objectionEvent,
  withdrawalEvent,
  verdictEvent,
]);

export const caseFileShape = z.object({
  schemaVersion: z.literal(1),
  id: idSchema,
  title: z.string().trim().min(1).max(80),
  source: z.enum(["bob-ide", "fixture"]),
  recordedAt: z.iso.datetime({ offset: true }),
  repo: z.object({ name: z.string().min(1), head: shaSchema }),
  bugReport: z.object({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(4000),
  }),
  events: z.array(caseEventSchema).min(1),
});

export type Expression = z.infer<typeof expressionSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type CaseEvent = z.infer<typeof caseEventSchema>;
export type ClaimEvent = z.infer<typeof claimEvent>;
export type VerdictEvent = z.infer<typeof verdictEvent>;
export type CaseFileShape = z.infer<typeof caseFileShape>;
