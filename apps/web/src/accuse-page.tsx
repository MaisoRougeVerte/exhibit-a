import { assertNever, type Timeline } from "@exhibit-a/schema";
import { useState } from "react";
import { type Accusation, accuse, culpritIndex } from "./accuse.ts";
import { trialHref } from "./route.ts";

type AccusePageProps = {
  timeline: Timeline;
  bugTitle: string;
};

function rulingText(accusation: Accusation): { title: string; body: string; tone: string } {
  const sha = accusation.commit.sha;
  switch (accusation.verdict) {
    case "guilty":
      return {
        title: `Guilty. Commit ${sha} introduced the bug.`,
        body:
          accusation.parent === undefined
            ? "The reproduction test fails here, and there is no earlier commit."
            : `The reproduction test fails at ${sha} and did not fail at its parent ${accusation.parent.sha}.`,
        tone: "border-red-500 bg-red-950/60",
      };
    case "alibi":
      return {
        title: `Acquitted. Commit ${sha} has an alibi.`,
        body: `The test fails here, but it already failed at its parent ${accusation.parent.sha}. The bug was there before this commit.`,
        tone: "border-emerald-500 bg-emerald-950/60",
      };
    case "innocent":
      return {
        title: `Acquitted. The bug does not exist at ${sha}.`,
        body: "The reproduction test passes at this commit.",
        tone: "border-emerald-500 bg-emerald-950/60",
      };
    case "no-ruling":
      return {
        title: "No ruling.",
        body: `The reproduction test cannot run at ${sha}: the code it exercises does not exist yet.`,
        tone: "border-stone-500 bg-stone-900",
      };
    default:
      return assertNever(accusation);
  }
}

const statusLabel = { pass: "passes", fail: "fails", error: "cannot run" } as const;

export function AccusePage({ timeline, bugTitle }: AccusePageProps) {
  const [accused, setAccused] = useState<number | undefined>(undefined);
  const [revealed, setRevealed] = useState(false);
  const accusation = accused === undefined ? undefined : accuse(timeline, accused);
  const ruling = accusation === undefined ? undefined : rulingText(accusation);
  const culprit = culpritIndex(timeline);
  const shown = (index: number) => revealed || index === accused || index === (accused ?? -2) - 1;

  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 bg-stone-950 px-6 py-10 text-white">
      <nav className="flex justify-between text-sm text-white/60">
        <a href="#/" className="hover:text-white">
          ← Exhibit A
        </a>
        <a href={trialHref(timeline.caseId)} className="hover:text-white">
          Watch Bob's trial
        </a>
      </nav>

      <header>
        <p className="text-sm uppercase tracking-widest text-brass-400">You are the investigator</p>
        <h1 className="font-display text-4xl">Accuse a commit</h1>
        <p className="mt-3 text-white/75">
          The case: {bugTitle}. Pick the commit you think is guilty. The judge checks it against the
          reproduction test, exactly like its alibi check. Every result below comes from a real run
          of the test at that commit in {timeline.repo}.
        </p>
      </header>

      {ruling !== undefined && (
        <section aria-live="polite" className={`rounded-xl border-2 p-5 ${ruling.tone}`}>
          <h2 className="font-display text-2xl">{ruling.title}</h2>
          <p className="mt-2 text-white/85">{ruling.body}</p>
        </section>
      )}

      <ol className="flex flex-col gap-2">
        {timeline.commits
          .map((commit, index) => ({ commit, index }))
          .reverse()
          .map(({ commit, index }) => (
            <li key={commit.sha}>
              <button
                type="button"
                onClick={() => setAccused(index)}
                aria-pressed={index === accused}
                className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left hover:bg-wood-800 ${index === accused ? "bg-wood-800 ring-2 ring-brass-400" : "bg-wood-900"}`}
              >
                <span className="font-mono text-sm text-brass-400">{commit.sha}</span>
                <span className="flex-1 text-white/85">{commit.subject}</span>
                <span className="text-xs uppercase text-white/60">
                  {shown(index) ? `test ${statusLabel[commit.status]}` : "?"}
                </span>
                {revealed && index === culprit && (
                  <span className="rounded bg-red-600 px-2 py-0.5 text-xs uppercase">culprit</span>
                )}
              </button>
            </li>
          ))}
      </ol>

      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="self-start rounded border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
      >
        Reveal every result
      </button>
    </main>
  );
}
