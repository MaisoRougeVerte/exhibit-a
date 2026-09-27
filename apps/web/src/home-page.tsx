import type { Expression } from "@exhibit-a/schema";
import type { ReactNode } from "react";
import { bustFrames } from "./art.ts";
import objectionArt from "./assets/effects/objection.webp";
import { bundledCases } from "./cases.ts";
import { CourtroomBackdrop } from "./courtroom-backdrop.tsx";
import { docsReports } from "./docs-reports.ts";
import { NAVY_PANEL, PARCHMENT } from "./page-shell.tsx";
import { PixelFade } from "./pixel-fade.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import { accuseHref, docsHref, reportHref, trialHref } from "./route.ts";
import type { Speaker } from "./scene.ts";
import { scoreboard } from "./scoreboard.ts";
import { type Study, StudyCard } from "./study-card.tsx";
import { findTimeline, firstTimeline } from "./timelines.ts";

const SO_2025 = "https://survey.stackoverflow.co/2025/ai";
const METR_2025 = "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/";

function Sprite({ speaker, expression }: { speaker: Speaker; expression: Expression }) {
  const url = bustFrames(speaker, expression)?.idle;
  return url === undefined ? null : (
    <img
      src={url}
      alt=""
      width={160}
      height={160}
      className="size-40 object-contain object-bottom"
    />
  );
}

function BugNote() {
  return (
    <div className="relative mb-8 w-[82%] -rotate-3 border-4 border-[#2b1a0e] bg-[#f6ead0] p-3 text-left text-[#2b1a0e] shadow-[6px_6px_0_#000]">
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 size-5 -translate-x-1/2 rounded-full border-2 border-black bg-red-600"
      />
      <p className="font-display text-base text-[#8b1d1d]">BUG #3 · URGENT</p>
      <p className="mt-1 text-sm leading-tight font-extrabold">
        Stock went negative on the last baguette
      </p>
      <div aria-hidden="true" className="mt-2 flex flex-col gap-1">
        <span className="h-1.5 w-full bg-[#2b1a0e]/25" />
        <span className="h-1.5 w-4/5 bg-[#2b1a0e]/25" />
        <span className="h-1.5 w-3/5 bg-[#2b1a0e]/25" />
      </div>
    </div>
  );
}

function Objecting() {
  return (
    <div className="relative flex h-full w-full items-end justify-center">
      <Sprite speaker="prosecutor" expression="angry" />
      <img
        src={objectionArt}
        alt=""
        className="absolute top-6 right-0 w-28 rotate-6 drop-shadow-[0_3px_0_#000]"
      />
    </div>
  );
}

function Verdict() {
  return (
    <div className="relative flex h-full w-full items-end justify-center">
      <Sprite speaker="judge" expression="angry" />
      <p className="absolute bottom-8 left-1/2 -translate-x-1/2 -rotate-12 border-4 border-red-500 bg-black/70 px-2 font-display text-3xl tracking-widest text-red-400 shadow-[4px_4px_0_#000]">
        GUILTY
      </p>
    </div>
  );
}

const flow: { title: string; text: string; art: ReactNode }[] = [
  { title: "Bug report", text: "An issue, written the way a user saw it.", art: <BugNote /> },
  {
    title: "Investigate",
    text: "Bob explores history, logs and code in parallel, and writes a failing test.",
    art: <Sprite speaker="investigator" expression="thinking" />,
  },
  {
    title: "Accuse",
    text: "Every claim cites runnable evidence: test, replay, log search, bisect.",
    art: <Sprite speaker="investigator" expression="confident" />,
  },
  {
    title: "Object & judge",
    text: "An independent prosecutor objects; plain code re-runs every piece of evidence.",
    art: <Objecting />,
  },
  {
    title: "Verdict",
    text: "Culprit, root cause, fix, and commands to check it yourself.",
    art: <Verdict />,
  },
];

function FighterCard({
  name,
  tone,
  portrait,
  slots,
}: {
  name: string;
  tone: "gray" | "gold";
  portrait: ReactNode;
  slots: readonly string[];
}) {
  const gold = tone === "gold";
  return (
    <PixelFrame
      fill={gold ? NAVY_PANEL : "linear-gradient(180deg, #1f2430, #0d0f14)"}
      frame={gold ? "#fcd34d" : "#6b7280"}
    >
      <div className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-end gap-4">
          <div className="flex h-36 w-36 shrink-0 items-end justify-center">{portrait}</div>
          <div className="flex flex-col gap-1">
            <p className="font-display text-sm tracking-[0.25em] text-white/50">
              {gold ? "PLAYER 1" : "CPU"}
            </p>
            <p
              className={`font-display text-3xl tracking-wide ${gold ? "text-amber-300" : "text-white/55"}`}
            >
              {name}
            </p>
          </div>
        </div>
        <ul className="grid gap-2">
          {slots.map((slot) => (
            <li
              key={slot}
              className={`flex items-center gap-3 border-2 px-3 py-2 ${gold ? "border-amber-300/70 bg-amber-300/10 text-white" : "border-white/10 bg-black/30 text-white/45"}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-6 shrink-0 place-items-center font-display text-sm ${gold ? "bg-amber-300 text-[#0b1220]" : "bg-[#374151] text-[#9ca3af]"}`}
              >
                {gold ? "+" : "x"}
              </span>
              <span className="text-sm">{slot}</span>
              {!gold && (
                <span className="ml-auto font-display text-xs tracking-widest text-white/35">
                  LOCKED
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </PixelFrame>
  );
}

const typical = [
  "Names a root cause with total confidence",
  "Nothing to re-run: you trust it or re-check by hand",
  "Wrong guesses look exactly like right ones",
  "The same model grades its own answer",
];

const exhibit = [
  "Every claim comes with evidence the court can run",
  "A deterministic judge re-runs it, no AI involved",
  "Wrong claims are withdrawn in the open, and counted",
  "An independent prosecutor, blind to the reasoning",
];

const studies: Study[] = [
  {
    value: "66%",
    share: 0.66,
    statement:
      'of developers name "AI solutions that are almost right, but not quite" as their top frustration.',
    source: "Stack Overflow Developer Survey 2025",
    href: SO_2025,
  },
  {
    value: "45%",
    share: 0.45,
    statement: "say debugging AI-generated code takes more time.",
    source: "Stack Overflow Developer Survey 2025",
    href: SO_2025,
  },
  {
    value: "46%",
    share: 0.46,
    statement: "actively distrust the accuracy of AI tools. Only 3% highly trust it.",
    source: "Stack Overflow Developer Survey 2025",
    href: SO_2025,
  },
  {
    value: "+19%",
    share: 0.19,
    statement:
      "more time taken by experienced developers using AI in a randomized trial, while they believed it made them faster.",
    source: "METR randomized controlled trial, 2025",
    href: METR_2025,
  },
];

import { type MenuItem, TitleMenu } from "./title-menu.tsx";

const recorded = bundledCases.filter((caseFile) => caseFile.source === "bob-ide");

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14">
      <div>
        <p className="font-display text-lg tracking-[0.3em] text-amber-300">{eyebrow}</p>
        <h2 className="font-display text-4xl tracking-wide text-amber-50 sm:text-5xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const roles: { speaker: Speaker; name: string; text: string }[] = [
  {
    speaker: "investigator",
    name: "The investigator",
    text: "IBM Bob, in a custom Tribunal mode, digs through code, git history and logs with parallel subagents. Every claim must cite evidence the court can run.",
  },
  {
    speaker: "prosecutor",
    name: "The prosecutor",
    text: "An independent Bob subagent, blind to the investigator's reasoning. It objects to every claim its evidence does not prove.",
  },
  {
    speaker: "judge",
    name: "The judge",
    text: "Plain code, no AI. It re-runs every test, commit replay, log search and bisect. Only what it can run reaches the verdict.",
  },
];

function RoleCard({ speaker, name, text }: (typeof roles)[number]) {
  const portrait = bustFrames(speaker, "neutral")?.idle;
  return (
    <PixelFrame fill={NAVY_PANEL} className="flex-1">
      <div className="flex h-full flex-col items-center gap-3 px-5 pt-4 pb-6 text-center">
        {portrait !== undefined && (
          <img
            src={portrait}
            alt=""
            width={192}
            height={192}
            loading="eager"
            className="size-48 object-contain object-bottom"
          />
        )}
        <h3 className="font-display text-2xl tracking-wider text-amber-300">{name}</h3>
        <p className="text-white/85">{text}</p>
      </div>
    </PixelFrame>
  );
}

function FeatureCard({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <PixelFrame fill={PARCHMENT} frame="#2b1a0e" gap="#c9a86a">
      <div className="flex h-full flex-col gap-2 px-5 py-4 text-[#2b1a0e]">
        <h3 className="font-display text-2xl tracking-wide text-[#8b1d1d]">{title}</h3>
        <p className="flex-1">{text}</p>
        <a
          href={href}
          className="self-start rounded-sm bg-[#2b1a0e] px-4 py-1.5 font-extrabold text-[#f6ead0]"
        >
          {cta}
        </a>
      </div>
    </PixelFrame>
  );
}

export function HomePage() {
  const timeline = firstTimeline();
  const score = scoreboard(recorded);
  const docs = docsReports[0];
  const docsBroken = docs?.findings.filter((finding) => finding.status === "broken").length ?? 0;
  const firstCase = recorded[0];
  const menu: MenuItem[] = [
    ...(firstCase === undefined
      ? []
      : [
          {
            label: "Watch a trial",
            href: trialHref(firstCase.id),
            hint: "Replay a real trial run by IBM Bob, objection included.",
          },
        ]),
    {
      label: "Set up your project",
      href: "#/setup",
      hint: "Four commands to put your own repository on trial.",
    },
    ...(timeline === undefined
      ? []
      : [
          {
            label: "Accuse a commit",
            href: accuseHref(timeline.caseId),
            hint: "Pick a suspect in the git history; the judge checks its alibi.",
          },
        ]),
    {
      label: "Dashboard",
      href: "#/dashboard",
      hint: "Trials, survival rate and docs verdict, per repository.",
    },
  ];

  return (
    <main className="bg-[#060a18] text-white">
      <section className="@container relative min-h-dvh overflow-hidden">
        <CourtroomBackdrop position="defense" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/35 to-black/80" />
        <div className="relative flex min-h-dvh flex-col items-center justify-center gap-[3cqw] px-[4%] pb-28 text-center">
          <div className="flex flex-col items-center gap-[1.2cqw] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.35)_45%,transparent_72%)] px-[8cqw] py-[3cqw]">
            <p className="font-display text-vn-tag tracking-[0.3em] text-amber-300 [text-shadow:2px_0_0_#000,-2px_0_0_#000,0_2px_0_#000,0_-2px_0_#000]">
              DEBUGGING ON TRIAL
            </p>
            <h1 className="font-display text-vn-logo leading-none tracking-wider text-amber-50 [text-shadow:3px_0_0_#0b1220,-3px_0_0_#0b1220,0_3px_0_#0b1220,0_-3px_0_#0b1220,3px_3px_0_#0b1220,-3px_3px_0_#0b1220,3px_-3px_0_#0b1220,-3px_-3px_0_#0b1220,0_8px_0_rgba(0,0,0,0.55)]">
              EXHIBIT A
            </h1>
            <p className="text-vn-lead font-extrabold text-white [text-shadow:2px_0_0_#0b1220,-2px_0_0_#0b1220,0_2px_0_#0b1220,0_-2px_0_#0b1220,0_4px_0_rgba(0,0,0,0.6)]">
              Your AI says it found the bug. Make it prove it.
            </p>
          </div>
          <TitleMenu items={menu} />
        </div>
        <PixelFade className="absolute inset-x-0 bottom-0" />
      </section>

      <Section eyebrow="THE PROBLEM" title="AI answers are almost right, and hard to check">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {studies.map((study) => (
            <StudyCard key={study.statement} {...study} />
          ))}
        </div>
        <PixelFrame fill="linear-gradient(180deg, rgba(90,20,20,0.9), rgba(30,6,6,0.95))">
          <div className="flex flex-wrap items-center gap-6 p-6">
            <p className="font-display text-7xl leading-none text-red-300">
              {score.withdrawn}/{score.claims}
            </p>
            <div className="flex min-w-64 flex-1 flex-col gap-2">
              <p className="font-display text-xl tracking-[0.2em] text-red-200">
                OUR OWN MEASUREMENT
              </p>
              <p className="text-lg text-white/90">
                of IBM Bob's claims did not survive our court, across {score.trials} real trials,{" "}
                {score.objections} objections and {score.evidence} re-run pieces of evidence. Every
                one can be re-checked with <code className="text-amber-200">pnpm judge</code>.
              </p>
            </div>
          </div>
        </PixelFrame>
      </Section>

      <Section eyebrow="THE SOLUTION" title="Put the bug on trial">
        <div className="relative">
          <ol className="relative grid gap-5 md:grid-cols-5">
            {flow.map((step, index) => (
              <li
                key={step.title}
                className="group relative flex flex-col items-center text-center"
              >
                <PixelFrame
                  fill="radial-gradient(circle at 50% 70%, #243a78 0%, #0b1330 75%)"
                  frame="#e2e8f0"
                  className="w-full transition-transform duration-150 group-hover:-translate-y-1 [&>div:first-child]:group-hover:!bg-amber-300"
                >
                  <div className="relative flex h-[220px] items-end justify-center overflow-hidden">
                    <span className="absolute top-2 left-3 font-display text-sm tracking-[0.2em] text-amber-300">
                      STAGE {index + 1}
                    </span>
                    {step.art}
                  </div>
                </PixelFrame>
                {index < flow.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-[108px] -right-5 z-10 hidden h-2 w-5 bg-amber-300 shadow-[0_2px_0_#000] md:block"
                  />
                )}
                <p className="mt-3 flex items-center gap-2 font-display text-2xl tracking-wide text-amber-50">
                  <span
                    aria-hidden="true"
                    className="text-amber-300 opacity-0 group-hover:opacity-100"
                  >
                    {">"}
                  </span>
                  {step.title}
                </p>
                <p className="mt-1 max-w-56 text-sm text-white/75">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <FighterCard
            name="TYPICAL AI ASSISTANT"
            tone="gray"
            portrait={
              <span className="grid size-36 place-items-center border-4 border-[#4b5563] bg-[#1f2937] font-display text-8xl text-[#6b7280]">
                ?
              </span>
            }
            slots={typical}
          />
          <p className="self-center justify-self-center font-display text-8xl text-red-500 [text-shadow:4px_0_0_#000,-4px_0_0_#000,0_4px_0_#000,0_-4px_0_#000,0_10px_0_#7f1d1d]">
            VS
          </p>
          <FighterCard
            name="EXHIBIT A"
            tone="gold"
            portrait={<Sprite speaker="investigator" expression="confident" />}
            slots={exhibit}
          />
        </div>
      </Section>

      <Section eyebrow="THE COURT" title="Three roles, one rule: no claim without evidence">
        <div className="flex flex-col gap-6 md:flex-row">
          {roles.map((role) => (
            <RoleCard key={role.speaker} {...role} />
          ))}
        </div>
      </Section>

      <Section eyebrow="WHAT YOU GET" title="Tools that serve the developer">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {firstCase !== undefined && (
            <FeatureCard
              title="Verified root cause"
              text="Culprit commit, root cause, regression test, fix, and the exact commands to check it yourself."
              href={reportHref(firstCase.id)}
              cta="Read a verdict"
            />
          )}
          {timeline !== undefined && (
            <FeatureCard
              title="Accuse a commit"
              text="The whole git history with the reproduction test's real result at every commit. Pick a suspect, the judge checks its alibi."
              href={accuseHref(timeline.caseId)}
              cta="Play"
            />
          )}
          {docs !== undefined && (
            <FeatureCard
              title="Docs on trial"
              text={`Every file, command and code name quoted in the docs is checked against the code. ${docsBroken} of ${docs.findings.length} references in the demo docs are false.`}
              href={docsHref(docs.repo)}
              cta="See the docs verdict"
            />
          )}
          <FeatureCard
            title="Dashboard"
            text="Connect public repositories and follow their trials. No backend, no key ever stored by the site."
            href="#/dashboard"
            cta="Open"
          />
          <FeatureCard
            title="GitHub Action"
            text="Label an issue on-trial: Bob Shell runs the Tribunal mode in your CI, the judge re-runs the evidence, the verdict lands on the issue."
            href="#/setup"
            cta="Set it up"
          />
          <FeatureCard
            title="Re-run the judge"
            text="Clone the repository and run pnpm judge on any recorded trial. Same rulings, no AI involved."
            href="https://github.com/MaisoRougeVerte/exhibit-a"
            cta="Open the repo"
          />
        </div>
      </Section>

      <Section eyebrow="CASE FILES" title="Recorded trials">
        <ul className="flex flex-col gap-4">
          {recorded.map((caseFile) => {
            const verdict = caseFile.events.at(-1);
            const culprit = verdict?.type === "verdict" ? verdict.culpritCommit : undefined;
            return (
              <li key={caseFile.id}>
                <PixelFrame fill={NAVY_PANEL}>
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="font-extrabold">{caseFile.bugReport.title}</p>
                      <p className="text-sm text-white/65">
                        {culprit === undefined ? "No culprit named" : `Culprit ${culprit}`} ·{" "}
                        {caseFile.events.length} events
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <a
                        href={trialHref(caseFile.id)}
                        className="rounded-sm bg-amber-500 px-4 py-1.5 font-extrabold text-stone-950"
                      >
                        Replay
                      </a>
                      <a
                        href={reportHref(caseFile.id)}
                        className="rounded-sm border-2 border-white/50 px-4 py-1.5"
                      >
                        Verdict
                      </a>
                      {findTimeline(caseFile.id) !== undefined && (
                        <a
                          href={accuseHref(caseFile.id)}
                          className="rounded-sm border-2 border-white/50 px-4 py-1.5"
                        >
                          Accuse
                        </a>
                      )}
                    </div>
                  </div>
                </PixelFrame>
              </li>
            );
          })}
        </ul>
      </Section>

      <footer className="border-t-2 border-white/10 px-5 py-10 text-center text-sm text-white/60">
        <p className="font-display text-2xl tracking-widest text-amber-200">EXHIBIT A</p>
        <p className="mt-2">
          Built with IBM Bob 2.0 for the IBM Bob 2.0 Hackathon ·{" "}
          <a href="https://github.com/MaisoRougeVerte/exhibit-a" className="underline">
            GitHub
          </a>{" "}
          ·{" "}
          <a href="#/try" className="underline">
            Try it
          </a>
        </p>
      </footer>
    </main>
  );
}
