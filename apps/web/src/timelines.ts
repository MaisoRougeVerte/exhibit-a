import { type Timeline, timelineSchema } from "@exhibit-a/schema";

const modules = import.meta.glob<unknown>("../../../cases/timelines/*.json", {
  eager: true,
  import: "default",
});

// Timelines ship with the build: a malformed one must fail the build, not the visitor.
const timelines: readonly Timeline[] = Object.entries(modules).map(([path, json]) => {
  const parsed = timelineSchema.safeParse(json);
  if (!parsed.success) throw new Error(`${path} is not a valid timeline`);
  return parsed.data;
});

export function findTimeline(caseId: string): Timeline | undefined {
  return timelines.find((timeline) => timeline.caseId === caseId);
}

export function firstTimeline(): Timeline | undefined {
  return timelines[0];
}
