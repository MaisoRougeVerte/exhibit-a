import { type CaseFile, parseCaseFile } from "@exhibit-a/schema";

const recorded = import.meta.glob<unknown>("../../../cases/*.json", {
  eager: true,
  import: "default",
});
const fixtures = import.meta.glob<unknown>("../../../cases/fixtures/*.json", {
  eager: true,
  import: "default",
});

// Bundled trials are part of the build: a malformed one must fail the build, not the visitor.
function load(modules: Record<string, unknown>): CaseFile[] {
  return Object.entries(modules).map(([path, json]) => {
    const result = parseCaseFile(json);
    if (!result.ok) throw new Error(`${path} is not a valid case file:\n${result.error}`);
    return result.value;
  });
}

// Hand-written fixtures help development; the public site shows recorded Bob trials only.
export const bundledCases: readonly CaseFile[] = import.meta.env.DEV
  ? [...load(recorded), ...load(fixtures)]
  : load(recorded);

export function findCase(caseId: string): CaseFile | undefined {
  return bundledCases.find((caseFile) => caseFile.id === caseId);
}
