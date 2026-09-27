import { bundledCases } from "./cases.ts";
import { CourtroomBackdrop } from "./courtroom-backdrop.tsx";
import { accuseHref, reportHref, trialHref } from "./route.ts";
import { scoreboard } from "./scoreboard.ts";
import { findTimeline, firstTimeline } from "./timelines.ts";

const roles = [
  {
    title: "The investigator",
    text: "IBM Bob digs through the code, the history and the logs with parallel subagents. Every claim must come with evidence the court can run.",
  },
  {
    title: "The prosecutor",
    text: "An independent Bob subagent, blind to the investigator's reasoning, attacks every claim that its evidence does not prove.",
  },
  {
    title: "The judge",
    text: "Plain code, no AI. It re-runs every test, commit replay, log search and bisect. Only what it can run reaches the verdict.",
  },
];

export function HomePage() {
  const timeline = firstTimeline();
  const score = scoreboard(bundledCases);
  return (
    <main className="min-h-dvh bg-stone-950 text-white">
      <section className="grid min-h-dvh place-items-center bg-black">
        <div className="@container relative aspect-video w-full max-w-[calc(100dvh*16/9)] overflow-hidden portrait:aspect-auto portrait:h-dvh portrait:max-w-none">
          <CourtroomBackdrop position="defense" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[2.5cqw] px-[6%] text-center text-white">
            <p className="font-display text-vn-tag tracking-[0.6em] text-amber-300">
              DEBUGGING ON TRIAL
            </p>
            <h1 className="font-display text-vn-title leading-none tracking-wider text-amber-100 [text-shadow:0_6px_0_rgba(0,0,0,0.7)]">
              EXHIBIT A
            </h1>
            <p className="max-w-[70%] text-vn-lead font-extrabold portrait:max-w-[92%] [text-shadow:0_2px_0_rgba(0,0,0,0.9)]">
              Your AI says it found the bug. Make it prove it.
            </p>
            <p className="max-w-[70%] text-vn-small text-white/80 portrait:max-w-[92%]">
              66% of developers say AI answers are "almost right, but not quite". Here, IBM Bob
              investigates, a prosecutor objects, and a deterministic judge re-runs every piece of
              evidence before any verdict.
            </p>
            {score.claims > 0 && (
              <p className="rounded bg-black/60 px-[1em] py-[0.4em] text-vn-small text-amber-100">
                In {score.trials} real trials, Bob made {score.claims} claims.{" "}
                <span className="font-extrabold text-red-300">
                  {score.withdrawn} did not survive the court
                </span>{" "}
                after {score.objections} objections and {score.evidence} re-run pieces of evidence.
              </p>
            )}
            <nav className="mt-[1cqw] flex flex-col items-stretch gap-[0.9cqw] text-vn-menu portrait:gap-3">
              {bundledCases[0] !== undefined && (
                <a
                  href={trialHref(bundledCases[0].id)}
                  className="rounded border-2 border-amber-300 bg-black/70 px-[3em] py-[0.35em] font-extrabold hover:bg-amber-500 hover:text-stone-950"
                >
                  Watch a trial
                </a>
              )}
              {timeline !== undefined && (
                <a
                  href={accuseHref(timeline.caseId)}
                  className="rounded border-2 border-white/60 bg-black/70 px-[3em] py-[0.35em] hover:bg-white/15"
                >
                  Accuse a commit yourself
                </a>
              )}
              <a
                href="#/try"
                className="rounded border-2 border-white/60 bg-black/70 px-[3em] py-[0.35em] hover:bg-white/15"
              >
                Try it on your code
              </a>
            </nav>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 sm:grid-cols-3">
        {roles.map((role) => (
          <article key={role.title} className="rounded-xl bg-wood-900 p-6">
            <h2 className="font-display text-2xl text-brass-400">{role.title}</h2>
            <p className="mt-3 text-white/75">{role.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="font-display text-3xl">Trials</h2>
          <a href="#/dashboard" className="text-sm text-brass-400 underline">
            Connect your repository
          </a>
        </div>
        <ul className="mt-6 grid gap-4">
          {bundledCases.map((caseFile) => (
            <li
              key={caseFile.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-black/40 p-5"
            >
              <div>
                <p className="font-extrabold">{caseFile.title}</p>
                <p className="text-sm text-white/60">
                  {caseFile.bugReport.title}
                  {caseFile.source === "fixture" && " · sample"}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <a
                  href={trialHref(caseFile.id)}
                  className="rounded bg-brass-500 px-4 py-2 font-extrabold text-wood-950"
                >
                  Replay
                </a>
                <a
                  href={reportHref(caseFile.id)}
                  className="rounded border border-white/30 px-4 py-2"
                >
                  Report
                </a>
                {findTimeline(caseFile.id) !== undefined && (
                  <a
                    href={accuseHref(caseFile.id)}
                    className="rounded border border-brass-400 px-4 py-2 text-brass-400"
                  >
                    Accuse a commit
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
