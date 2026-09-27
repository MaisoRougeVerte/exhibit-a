import type { ReactNode } from "react";
import { bustFrames } from "./art.ts";
import { bundledCases } from "./cases.ts";
import { CourtroomBackdrop } from "./courtroom-backdrop.tsx";
import { docsReports } from "./docs-reports.ts";
import { NAVY_PANEL, PARCHMENT } from "./page-shell.tsx";
import { PixelFade } from "./pixel-fade.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import { accuseHref, docsHref, reportHref, trialHref } from "./route.ts";
import type { Speaker } from "./scene.ts";
import { scoreboard } from "./scoreboard.ts";
import { findTimeline, firstTimeline } from "./timelines.ts";
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
          <img src={portrait} alt="" className="h-48 object-contain object-bottom" />
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

      <Section eyebrow="THE PROBLEM" title="AI answers are almost right">
        <div className="grid gap-6 md:grid-cols-2">
          <PixelFrame fill={NAVY_PANEL}>
            <div className="p-6">
              <p className="font-display text-7xl text-red-400">66%</p>
              <p className="mt-2 text-lg">
                of developers name "AI solutions that are almost right, but not quite" as their top
                frustration.{" "}
                <span className="text-white/60">Stack Overflow Developer Survey 2025</span>
              </p>
            </div>
          </PixelFrame>
          <PixelFrame fill={NAVY_PANEL}>
            <div className="p-6">
              <p className="font-display text-7xl text-red-400">
                {score.withdrawn}/{score.claims}
              </p>
              <p className="mt-2 text-lg">
                of IBM Bob's claims did not survive our court, across {score.trials} real trials,{" "}
                {score.objections} objections and {score.evidence} re-run pieces of evidence.
                Measured, not estimated.
              </p>
            </div>
          </PixelFrame>
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
