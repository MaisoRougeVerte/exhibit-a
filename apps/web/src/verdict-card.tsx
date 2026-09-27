import type { CaseFile, VerdictEvent } from "@exhibit-a/schema";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { CommitText } from "./commit-text.tsx";
import { NAVY_PANEL } from "./page-shell.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import { accuseHref, reportHref } from "./route.ts";
import { allCommits } from "./timelines.ts";

type VerdictCardProps = {
  caseFile: CaseFile;
  verdict: VerdictEvent;
  canReport: boolean;
  canAccuse: boolean;
};

export function commandsFor(caseFile: CaseFile, verdict: VerdictEvent): string[] {
  const test = verdict.regressionTest;
  const run =
    test === undefined
      ? undefined
      : `vitest run ${test.file}${test.testName === undefined ? "" : ` -t "${test.testName}"`}`;
  return [
    ...(verdict.culpritCommit === undefined ? [] : [`git show ${verdict.culpritCommit}`]),
    ...(run === undefined ? [] : [run]),
    `pnpm judge --check cases/${caseFile.id}.json`,
  ];
}

function subjectOf(sha: string | undefined): string | undefined {
  if (sha === undefined) return undefined;
  return allCommits().find((commit) => commit.sha.startsWith(sha) || sha.startsWith(commit.sha))
    ?.subject;
}

function Fact({ label, tone, children }: { label: string; tone: string; children: ReactNode }) {
  return (
    <div className={`border-l-4 pl-3 ${tone}`}>
      <h3 className="mb-2 font-display text-[1.2em] tracking-[0.14em]">{label}</h3>
      <p className="text-white/95 leading-relaxed">{children}</p>
    </div>
  );
}

/** End of trial: what a developer needs to act, not a victory screen. */
export function VerdictCard({ caseFile, verdict, canReport, canAccuse }: VerdictCardProps) {
  const [copied, setCopied] = useState<string | undefined>(undefined);
  const reduceMotion = useReducedMotion() ?? false;
  const commands = commandsFor(caseFile, verdict);
  const subject = subjectOf(verdict.culpritCommit);

  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(command);
    } catch {
      // Clipboard access can be denied; the command stays visible to copy by hand.
    }
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      role="region"
      aria-label="Final verdict"
      className="absolute top-[12%] bottom-[5%] left-[3%] z-30 w-[61%] select-text portrait:inset-x-[3%] portrait:bottom-[3%] portrait:w-auto"
    >
      <PixelFrame fill={NAVY_PANEL} frame="#d9b25f" className="h-full">
        <div className="flex h-full flex-col p-[clamp(1rem,1.8cqw,2.5rem)] text-[clamp(0.95rem,1.05cqw,1.4rem)] text-white">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b-2 border-dashed border-amber-200/25 pb-[0.9em]">
            <div>
              <p className="font-display text-[0.85em] tracking-[0.24em] text-amber-300">
                EXHIBIT A · CASE CLOSED
              </p>
              <h2 className="font-display text-[clamp(2rem,3cqw,4rem)] leading-none tracking-wide">
                The verdict
              </h2>
            </div>
            <span className="-rotate-6 border-4 border-red-500 px-3 font-display text-[clamp(1.5rem,3cqw,3.5rem)] tracking-widest text-red-400">
              GUILTY
            </span>
          </div>

          <div className="min-h-0 flex-1 space-y-[1em] overflow-y-auto overscroll-contain py-[1em] pr-2">
            <div className="border border-amber-300/25 bg-black/30 px-[1em] py-[0.7em]">
              <p className="font-display text-[0.85em] tracking-[0.2em] text-amber-200/75">
                CULPRIT COMMIT
              </p>
              {verdict.culpritCommit !== undefined && (
                <p className="mt-1 font-mono text-[1.35em] text-amber-300">
                  <CommitText text={verdict.culpritCommit} />
                </p>
              )}
              {subject !== undefined && (
                <p className="mt-1 text-[0.8em] text-white/70">{subject}</p>
              )}
            </div>

            <Fact label="WHY IT BREAKS" tone="border-red-400 text-red-300">
              {verdict.rootCause}
            </Fact>
            <Fact label="HOW TO FIX" tone="border-emerald-400 text-emerald-300">
              {verdict.fixSummary}
            </Fact>

            <details className="rounded-sm border border-sky-200/25 bg-black/50">
              <summary className="cursor-pointer px-4 py-3 font-display text-[1em] tracking-[0.15em] text-sky-200 hover:bg-white/5">
                VERIFY IT YOURSELF · {commands.length} COMMANDS
              </summary>
              <ul className="space-y-3 border-t border-white/10 p-3">
                {commands.map((command) => (
                  <li key={command} className="group flex items-center gap-2 px-3 py-0.5">
                    <span className="text-emerald-400">$</span>
                    <code className="min-w-0 flex-1 break-all text-[0.75em] text-sky-100">
                      {command}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copy(command)}
                      className="min-h-9 shrink-0 rounded-sm border border-white/30 px-3 text-[0.7em] text-white/80 hover:bg-white/10"
                    >
                      {copied === command ? "copied" : "copy"}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          </div>

          <div className="flex shrink-0 flex-wrap gap-[0.65em] border-t-2 border-dashed border-amber-200/25 pt-[0.9em]">
            {canReport && (
              <a
                href={reportHref(caseFile.id)}
                className="rounded-sm border-b-4 border-amber-700 bg-amber-400 px-[1.2em] py-[0.65em] font-extrabold text-stone-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Full report →
              </a>
            )}
            {canAccuse && (
              <a
                href={accuseHref(caseFile.id)}
                className="rounded-sm border-2 border-white/50 px-[1em] py-[0.65em] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300"
              >
                Accuse a commit yourself
              </a>
            )}
          </div>
        </div>
      </PixelFrame>
    </motion.div>
  );
}
