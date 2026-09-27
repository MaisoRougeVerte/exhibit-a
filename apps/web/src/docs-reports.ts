import { type DocsReport, docsReportSchema } from "@exhibit-a/schema";

const modules = import.meta.glob<unknown>("../../../cases/docs/*.json", {
  eager: true,
  import: "default",
});

// Reports ship with the build: a malformed one must fail the build, not the visitor.
export const docsReports: readonly DocsReport[] = Object.entries(modules).map(([path, json]) => {
  const parsed = docsReportSchema.safeParse(json);
  if (!parsed.success) throw new Error(`${path} is not a valid docs report`);
  return parsed.data;
});

export function findDocsReport(repo: string): DocsReport | undefined {
  return docsReports.find((report) => report.repo === repo);
}
