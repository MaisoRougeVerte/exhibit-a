import type { CaseFile, VerdictEvent } from "@exhibit-a/schema";
import { motion } from "motion/react";
import { useState } from "react";
import { CommitText } from "./commit-text.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import { accuseHref, reportHref } from "./route.ts";

type VerdictCardProps = {
  caseFile: CaseFile;
  verdict: VerdictEvent;
  canAccuse: boolean;
};

function commandsFor(caseFile: CaseFile, verdict: VerdictEvent): string[] {
  const test = verdict.regressionTest;
  const run =
    test === undefined
      ? undefined
      : `vitest run ${test.file}${test.testName === undefined ? "" : ` -t "${test.testName}"`}`;
  return [
    ...(verdict.culpritCommit === undefined ? [] : [`git show ${verdict.culpritCommit}`]),
    ...(run === undefined ? [] : [run]),
    `pnpm judge cases/${caseFile.id}.json`,
  ];
}

/** End of trial: what a developer needs to act, not a victory screen. */
export function VerdictCard({ caseFile, verdict, canAccuse }: VerdictCardProps) {
  const [copied, setCopied] = useState<string | undefined>(undefined);
  const commands = commandsFor(caseFile, verdict);

  async function copy(command: string) {
    await navigator.clipboard.writeText(command);
    setCopied(command);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-[12%] left-[3%] z-30 w-[46%] portrait:inset-x-[3%] portrait:w-auto"
    >
      <PixelFrame fill="linear-gradient(180deg, rgba(20,32,70,0.97), rgba(6,10,24,0.97))">
        <div className="flex flex-col gap-[0.6em] p-[1.1em] text-vn-small text-white">
          <p className="font-display text-vn-name tracking-wider text-red-400">
            Guilty
            {verdict.culpritCommit !== undefined && (
              <span className="ml-2 font-sans text-vn-small text-white">
                <CommitText text={verdict.culpritCommit} />
              </span>
            )}
          </p>
          <p>
            <span className="font-display text-amber-300">Root cause · </span>
            {verdict.rootCause}
          </p>
          <p>
            <span className="font-display text-amber-300">Fix · </span>
            {verdict.fixSummary}
          </p>
          <ul className="flex flex-col gap-1">
            {commands.map((command) => (
              <li key={command}>
                <button
                  type="button"
                  onClick={() => void copy(command)}
                  className="w-full truncate rounded bg-black/50 px-2 py-1 text-left font-mono text-xs text-sky-200 hover:bg-black/70"
                  title="Copy"
                >
                  {copied === command ? "✓ copied" : `$ ${command}`}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-[0.8em] pt-1">
            <a
              href={reportHref(caseFile.id)}
              className="rounded bg-amber-500 px-3 py-1 font-extrabold text-stone-950"
            >
              Full report
            </a>
            {canAccuse && (
              <a
                href={accuseHref(caseFile.id)}
                className="rounded border border-white/60 px-3 py-1"
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
