import type { CaseFile, VerdictEvent } from "@exhibit-a/schema";
import { CourtRecord } from "./court-record.tsx";
import { trialHref } from "./route.ts";
import { courtRecord } from "./scene.ts";

type ReportPageProps = {
  caseFile: CaseFile;
};

function verdictOf(caseFile: CaseFile): VerdictEvent | undefined {
  const last = caseFile.events.at(-1);
  return last?.type === "verdict" ? last : undefined;
}

export function ReportPage({ caseFile }: ReportPageProps) {
  const verdict = verdictOf(caseFile);
  const withdrawn = caseFile.events.filter((event) => event.type === "withdrawal").length;
  const record = courtRecord(caseFile, caseFile.events.length - 1);
  const rejected = record.filter((entry) => entry.status !== "upheld").length;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 bg-stone-950 px-6 py-10 text-white">
      <nav className="flex justify-between text-sm text-white/60">
        <a href="#/" className="hover:text-white">
          ← Exhibit A
        </a>
        <a href={trialHref(caseFile.id)} className="hover:text-white">
          Replay the trial
        </a>
      </nav>

      <header>
        <p className="text-sm uppercase tracking-widest text-brass-400">Verdict report</p>
        <h1 className="font-display text-4xl">{caseFile.title}</h1>
        <p className="mt-2 text-white/60">
          {caseFile.repo.name} at {caseFile.repo.head}
          {caseFile.source === "fixture" && " · hand-written sample, not a recorded Bob run"}
        </p>
      </header>

      <section className="rounded-xl bg-wood-900 p-5">
        <h2 className="font-display text-xl text-brass-400">Bug report</h2>
        <p className="mt-1 font-extrabold">{caseFile.bugReport.title}</p>
        <p className="mt-2 text-white/80">{caseFile.bugReport.body}</p>
      </section>

      {verdict !== undefined && (
        <section className="grid gap-4 rounded-xl border border-brass-500/40 bg-black/40 p-5">
          <h2 className="font-display text-xl text-brass-400">Verdict</h2>
          <dl className="grid gap-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-white/60">Root cause</dt>
            <dd>{verdict.rootCause}</dd>
            {verdict.culpritCommit !== undefined && (
              <>
                <dt className="text-white/60">Culprit commit</dt>
                <dd className="font-mono">{verdict.culpritCommit}</dd>
              </>
            )}
            {verdict.regressionTest !== undefined && (
              <>
                <dt className="text-white/60">Regression test</dt>
                <dd className="font-mono text-sm">
                  {verdict.regressionTest.file}
                  {verdict.regressionTest.testName !== undefined &&
                    ` › ${verdict.regressionTest.testName}`}
                </dd>
              </>
            )}
            <dt className="text-white/60">Fix</dt>
            <dd>{verdict.fixSummary}</dd>
            <dt className="text-white/60">Trial</dt>
            <dd>
              {record.length} pieces of evidence re-run by the judge, {rejected} not upheld,{" "}
              {withdrawn} claim{withdrawn === 1 ? "" : "s"} withdrawn.
            </dd>
          </dl>
        </section>
      )}

      <CourtRecord entries={record} />
    </main>
  );
}
