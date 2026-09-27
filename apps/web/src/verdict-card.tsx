import type { CaseFile, VerdictEvent } from "@exhibit-a/schema";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";
import { CommitText } from "./commit-text.tsx";
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
      <p className="font-display text-sm tracking-[0.2em] opacity-90">{label}</p>
      <p className="text-white/95 leading-snug">{children}</p>
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
      className="absolute top-[11%] left-[3%] z-30 w-[50%] portrait:inset-x-[3%] portrait:w-auto"
    >
      <PixelFrame fill="linear-gradient(180deg, rgba(20,32,70,0.97), rgba(6,10,24,0.97))">
        <div className="flex flex-col gap-[0.9em] p-[1.2em] text-vn-small text-white">
          <div className="flex items-center gap-4 border-b-2 border-dashed border-white/20 pb-[0.8em]">
            <span className="-rotate-6 border-4 border-red-500 px-2 font-display text-vn-name tracking-widest text-red-400">
              GUILTY
            </span>
            <div className="min-w-0">
              {verdict.culpritCommit !== undefined && (
                <p className="font-mono text-amber-300">
                  <CommitText text={verdict.culpritCommit} />
                </p>
              )}
              {subject !== undefined && <p className="truncate text-sm text-white/70">{subject}</p>}
            </div>
          </div>

          <Fact label="WHY IT BREAKS" tone="border-red-400 text-red-300">
            {verdict.rootCause}
          </Fact>
          <Fact label="HOW TO FIX" tone="border-emerald-400 text-emerald-300">
            {verdict.fixSummary}
          </Fact>

          <div className="rounded-sm border-2 border-black bg-black/70">
            <p className="border-b border-white/10 px-3 py-1 font-display text-sm tracking-[0.2em] text-sky-300">
              VERIFY IT YOURSELF
            </p>
            <ul className="py-1">
              {commands.map((command) => (
                <li key={command} className="group flex items-center gap-2 px-3 py-0.5">
                  <span className="text-emerald-400">$</span>
                  <code className="min-w-0 flex-1 truncate text-sm text-sky-100" title={command}>
                    {command}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copy(command)}
                    className="rounded-sm border border-white/30 px-2 text-xs text-white/70 hover:bg-white/10"
                  >
                    {copied === command ? "copied" : "copy"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-[0.8em]">
            {canReport && (
              <a
                href={reportHref(caseFile.id)}
                className="rounded-sm bg-amber-500 px-4 py-1.5 font-extrabold text-stone-950"
              >
                Full report
              </a>
            )}
            {canAccuse && (
              <a
                href={accuseHref(caseFile.id)}
                className="rounded-sm border-2 border-white/60 px-4 py-1.5 hover:bg-white/10"
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
