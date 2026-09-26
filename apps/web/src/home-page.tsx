import { bundledCases } from "./cases.ts";
import { accuseHref, reportHref, trialHref } from "./route.ts";
import { firstTimeline } from "./timelines.ts";

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
  return (
    <main className="min-h-dvh bg-stone-950 text-white">
      <section className="bg-gradient-to-b from-wood-800 to-stone-950 px-6 py-20 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-brass-400">Exhibit A</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
          Your AI says it found the bug. Make it prove it.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75">
          66% of developers say AI answers are "almost right, but not quite". Exhibit A puts the bug
          on trial: no claim reaches the verdict unless a deterministic judge re-ran its evidence.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {bundledCases[0] !== undefined && (
            <a
              href={trialHref(bundledCases[0].id)}
              className="rounded-lg bg-brass-500 px-6 py-3 text-lg font-semibold text-wood-950 hover:bg-brass-400"
            >
              Watch a trial
            </a>
          )}
          {timeline !== undefined && (
            <a
              href={accuseHref(timeline.caseId)}
              className="rounded-lg border border-brass-400 px-6 py-3 text-lg font-semibold text-brass-400 hover:bg-brass-500/10"
            >
              Accuse a commit yourself
            </a>
          )}
          <a
            href="#/try"
            className="rounded-lg px-6 py-3 text-lg text-white/80 underline hover:text-white"
          >
            Try it
          </a>
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
                <p className="font-semibold">{caseFile.title}</p>
                <p className="text-sm text-white/60">
                  {caseFile.bugReport.title}
                  {caseFile.source === "fixture" && " · sample"}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                <a
                  href={trialHref(caseFile.id)}
                  className="rounded bg-brass-500 px-4 py-2 font-semibold text-wood-950"
                >
                  Replay
                </a>
                <a
                  href={reportHref(caseFile.id)}
                  className="rounded border border-white/30 px-4 py-2"
                >
                  Report
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
