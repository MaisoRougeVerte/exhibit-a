import type { DocsFinding, DocsReport } from "@exhibit-a/schema";
import { PageShell, Panel } from "./page-shell.tsx";

const kindLabel: Record<DocsFinding["kind"], string> = {
  file: "file",
  script: "command",
  symbol: "code name",
};

function Finding({ finding }: { finding: DocsFinding }) {
  const broken = finding.status === "broken";
  return (
    <li className="flex items-start gap-3 rounded-sm border-2 border-[#2b1a0e]/25 bg-[#fbf3df] px-3 py-2">
      <span
        className={`mt-0.5 -rotate-6 border-2 px-1.5 font-display text-sm tracking-widest ${broken ? "border-red-700 text-red-700" : "border-emerald-700 text-emerald-700"}`}
      >
        {broken ? "FALSE" : "TRUE"}
      </span>
      <div className="min-w-0 flex-1">
        <p>
          <code className="rounded-sm bg-[#2b1a0e] px-1.5 text-[#f6ead0]">{finding.quote}</code>{" "}
          <span className="text-sm opacity-70">
            {kindLabel[finding.kind]} · {finding.doc}:{finding.line}
          </span>
        </p>
        <p className={`text-sm ${broken ? "text-red-800" : "opacity-80"}`}>{finding.detail}</p>
      </div>
    </li>
  );
}

export function DocsPage({ report }: { report: DocsReport }) {
  const broken = report.findings.filter((finding) => finding.status === "broken");
  const docs = [...new Set(report.findings.map((finding) => finding.doc))];
  return (
    <PageShell
      eyebrow="DOCS ON TRIAL"
      title="Does the documentation match the code?"
      backdrop="prosecution"
      subtitle={
        <>
          {report.repo} at <code>{report.head}</code>. Every file, command and code name quoted in
          the docs is checked against the repository by plain code, no AI.
        </>
      }
    >
      <Panel title="Verdict">
        <p className="flex flex-wrap items-center gap-4">
          <span className="font-display text-5xl text-red-400">
            {broken.length} / {report.findings.length}
          </span>
          <span className="text-lg">
            references in the docs are false. A developer following these docs would hit{" "}
            {broken.length} dead ends.
          </span>
        </p>
      </Panel>
      {docs.map((doc) => {
        const findings = report.findings
          .filter((finding) => finding.doc === doc)
          .sort(
            (a, b) =>
              Number(b.status === "broken") - Number(a.status === "broken") || a.line - b.line,
          );
        return (
          <Panel key={doc} title={doc} tone="parchment">
            <ul className="flex flex-col gap-2">
              {findings.map((finding) => (
                <Finding key={`${finding.line}:${finding.quote}`} finding={finding} />
              ))}
            </ul>
          </Panel>
        );
      })}
      <Panel title="Run it on your repository">
        <pre className="overflow-x-auto rounded-sm bg-black/60 p-3 text-sm text-sky-100">
          pnpm docs-check --repo path/to/your/repo
        </pre>
      </Panel>
    </PageShell>
  );
}
