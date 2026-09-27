import type { CaseFile, VerdictEvent } from "@exhibit-a/schema";
import { useState } from "react";
import { CommitText } from "./commit-text.tsx";
import { CourtRecord } from "./court-record.tsx";
import { PageShell, Panel } from "./page-shell.tsx";
import { accuseHref, trialHref } from "./route.ts";
import { courtRecord } from "./scene.ts";
import { findTimeline } from "./timelines.ts";
import { commandsFor } from "./verdict-card.tsx";

type ReportPageProps = {
  caseFile: CaseFile;
};

function verdictOf(caseFile: CaseFile): VerdictEvent | undefined {
  const last = caseFile.events.at(-1);
  return last?.type === "verdict" ? last : undefined;
}

function CopyCommands({ commands }: { commands: readonly string[] }) {
  const [copied, setCopied] = useState<string | undefined>(undefined);
  return (
    <ul className="flex flex-col gap-1.5">
      {commands.map((command) => (
        <li key={command}>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(command).then(() => setCopied(command));
            }}
            className="w-full truncate rounded-sm bg-black/50 px-3 py-1.5 text-left font-mono text-sm text-sky-200 hover:bg-black/70"
          >
            {copied === command ? "✓ copied" : `$ ${command}`}
          </button>
        </li>
      ))}
    </ul>
  );
}

const hud = "rounded border border-white/60 bg-black/60 px-3 py-1 hover:bg-black/80";

export function ReportPage({ caseFile }: ReportPageProps) {
  const verdict = verdictOf(caseFile);
  const record = courtRecord(caseFile, caseFile.events.length - 1);
  const withdrawn = caseFile.events.filter((event) => event.type === "withdrawal").length;
  const notUpheld = record.filter((entry) => entry.status !== "upheld").length;

  return (
    <PageShell
      eyebrow="VERDICT REPORT"
      title={caseFile.bugReport.title}
      backdrop="bench"
      subtitle={
        <>
          {caseFile.repo.name} at <CommitText text={caseFile.repo.head} />
          {caseFile.source === "fixture" && " · hand-written sample"}
        </>
      }
      actions={
        <>
          <a href={trialHref(caseFile.id)} className={hud}>
            Replay the trial
          </a>
          {findTimeline(caseFile.id) !== undefined && (
            <a href={accuseHref(caseFile.id)} className={hud}>
              Accuse a commit
            </a>
          )}
        </>
      }
    >
      {verdict !== undefined && (
        <Panel title="Verdict">
          <div className="flex flex-col gap-4">
            {verdict.culpritCommit !== undefined && (
              <p className="flex items-center gap-4">
                <span className="-rotate-3 border-4 border-red-500 px-3 font-display text-3xl tracking-widest text-red-400">
                  GUILTY
                </span>
                <span className="text-xl">
                  <CommitText text={verdict.culpritCommit} />
                </span>
              </p>
            )}
            <p>
              <span className="font-display text-lg tracking-wider text-amber-300">
                Root cause ·{" "}
              </span>
              <CommitText text={verdict.rootCause} />
            </p>
            <p>
              <span className="font-display text-lg tracking-wider text-amber-300">Fix · </span>
              {verdict.fixSummary}
            </p>
            <CopyCommands commands={commandsFor(caseFile, verdict)} />
            <p className="text-sm text-white/70">
              {record.length} pieces of evidence re-run by the judge · {notUpheld} not upheld ·{" "}
              {withdrawn} claim{withdrawn === 1 ? "" : "s"} withdrawn
            </p>
          </div>
        </Panel>
      )}

      <div className="grid gap-8 lg:grid-cols-[2fr_3fr]">
        <Panel title="Bug report" tone="parchment" className="self-start">
          <p className="font-extrabold">{caseFile.bugReport.title}</p>
          <p className="mt-2 leading-relaxed">{caseFile.bugReport.body}</p>
        </Panel>
        <Panel title="Court record" tone="parchment">
          <CourtRecord entries={record} />
        </Panel>
      </div>
    </PageShell>
  );
}
