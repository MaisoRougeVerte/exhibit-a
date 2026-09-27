import { type FormEvent, Suspense, use, useState } from "react";
import { bundledCases } from "./cases.ts";
import { saveConnectedRepos, useConnectedRepos } from "./connected-repos.ts";
import { docsReports } from "./docs-reports.ts";
import { fetchTrials, parseRepoInput, TRIALS_BRANCH } from "./github.ts";
import { PageShell, Panel } from "./page-shell.tsx";
import { accuseHref, docsHref, remoteTrialHref, reportHref, trialHref } from "./route.ts";
import { scoreboard } from "./scoreboard.ts";
import { findTimeline } from "./timelines.ts";

// Flipped once the reusable GitHub Action is published; until then setup is shown as roadmap.
const ACTION_READY = false;

function RepoTrials({ owner, repo }: { owner: string; repo: string }) {
  const trials = use(fetchTrials(owner, repo));
  if (!trials.ok)
    return <p className="text-sm text-red-800">Could not read the repo: {trials.error}.</p>;
  if (trials.value.length === 0) {
    return (
      <p className="text-sm opacity-80">
        No trial yet. Trials appear here once published on the <code>{TRIALS_BRANCH}</code> branch,
        under <code>cases/</code>.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {trials.value.map(({ file, caseFile }) => (
        <li
          key={file}
          className="flex items-center justify-between gap-3 rounded-sm border-2 border-[#2b1a0e]/30 bg-[#fbf3df] px-3 py-2"
        >
          <span>
            {caseFile.title}
            <span className="ml-2 text-sm opacity-60">{caseFile.bugReport.title}</span>
          </span>
          <a
            href={remoteTrialHref(owner, repo, file)}
            className="rounded bg-brass-500 px-3 py-1 text-sm font-extrabold text-wood-950"
          >
            Replay
          </a>
        </li>
      ))}
    </ul>
  );
}

function SetupSteps({ owner, repo }: { owner: string; repo: string }) {
  if (!ACTION_READY) {
    return (
      <p className="text-sm opacity-80">
        <span className="mr-2 rounded bg-stone-700 text-white px-2 py-0.5 text-xs uppercase">
          Roadmap
        </span>
        One-click setup of the GitHub Action for {owner}/{repo} ships with the action.
      </p>
    );
  }
  return (
    <a
      href={`https://github.com/${owner}/${repo}/settings/secrets/actions/new`}
      className="text-sm underline"
    >
      Add your BOB_API_KEY secret on GitHub
    </a>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-sm border-2 border-white/15 bg-black/40 px-4 py-3">
      <p className="font-display text-4xl text-amber-200">{value}</p>
      <p className="text-sm text-white/70">{label}</p>
    </div>
  );
}

function DemoCourtroom() {
  const recorded = bundledCases.filter((caseFile) => caseFile.source === "bob-ide");
  const score = scoreboard(recorded);
  const docs = docsReports[0];
  const docsBroken = docs?.findings.filter((finding) => finding.status === "broken").length ?? 0;
  return (
    <Panel title="MaisoRougeVerte/crumb-and-co · demo courtroom">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat value={String(score.trials)} label="trials run by Bob" />
        <Stat value={`${score.withdrawn}/${score.claims}`} label="claims that did not survive" />
        <Stat value={String(score.evidence)} label="evidence re-run by the judge" />
        {docs !== undefined && (
          <Stat
            value={`${docsBroken}/${docs.findings.length}`}
            label="false references in the docs"
          />
        )}
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {recorded.map((caseFile) => {
          const verdict = caseFile.events.at(-1);
          return (
            <li
              key={caseFile.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-black/35 px-3 py-2"
            >
              <span>
                <span className="mr-2 -rotate-3 inline-block border-2 border-red-400 px-1 font-display text-xs tracking-widest text-red-300">
                  GUILTY
                </span>
                {caseFile.bugReport.title}
                {verdict?.type === "verdict" && verdict.culpritCommit !== undefined && (
                  <span className="ml-2 font-mono text-sm text-amber-300">
                    {verdict.culpritCommit}
                  </span>
                )}
              </span>
              <span className="flex gap-2 text-sm">
                <a href={trialHref(caseFile.id)} className="underline">
                  Replay
                </a>
                <a href={reportHref(caseFile.id)} className="underline">
                  Verdict
                </a>
                {findTimeline(caseFile.id) !== undefined && (
                  <a href={accuseHref(caseFile.id)} className="underline">
                    Accuse
                  </a>
                )}
              </span>
            </li>
          );
        })}
      </ul>
      {docs !== undefined && (
        <a
          href={docsHref(docs.repo)}
          className="mt-4 inline-block rounded-sm bg-amber-500 px-4 py-1.5 font-extrabold text-stone-950"
        >
          Docs on trial
        </a>
      )}
    </Panel>
  );
}

export function DashboardPage() {
  const repos = useConnectedRepos();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  function connect(event: FormEvent) {
    event.preventDefault();
    const parsed = parseRepoInput(input);
    if (parsed === undefined) {
      setError("Enter a public GitHub repository as owner/repo.");
      return;
    }
    setError("");
    setInput("");
    saveConnectedRepos([...repos, `${parsed.owner}/${parsed.repo}`]);
  }

  return (
    <PageShell
      eyebrow="DASHBOARD"
      title="Your courtrooms"
      backdrop="prosecution"
      subtitle="Connect a public GitHub repository to follow its trials. Nothing is stored on our side: the list lives in this browser, trials are read from GitHub, and API keys only ever go into your repository's GitHub secrets."
    >
      <DemoCourtroom />
      <Panel title="Connect a repository">
        <form onSubmit={connect} className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="repo">
            Repository
          </label>
          <input
            id="repo"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="owner/repo"
            className="min-w-64 flex-1 rounded-sm border-2 border-white/40 bg-black/50 px-4 py-2 font-mono text-white placeholder:text-white/40"
          />
          <button
            type="submit"
            className="rounded-sm bg-amber-500 px-5 py-2 font-extrabold text-stone-950"
          >
            Connect
          </button>
          {error !== "" && <p className="w-full text-sm text-red-300">{error}</p>}
        </form>
      </Panel>

      {repos.map((fullName) => {
        const [owner = "", repo = ""] = fullName.split("/");
        return (
          <Panel key={fullName} title={fullName} tone="parchment">
            <div className="flex flex-col gap-3">
              <Suspense
                fallback={<p className="text-sm opacity-70">Reading trials from GitHub…</p>}
              >
                <RepoTrials owner={owner} repo={repo} />
              </Suspense>
              <SetupSteps owner={owner} repo={repo} />
              <button
                type="button"
                onClick={() => saveConnectedRepos(repos.filter((name) => name !== fullName))}
                className="self-start text-sm underline opacity-70 hover:opacity-100"
              >
                Disconnect
              </button>
            </div>
          </Panel>
        );
      })}
    </PageShell>
  );
}
