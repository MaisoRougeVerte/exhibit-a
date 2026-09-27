import { type FormEvent, Suspense, use, useState } from "react";
import { saveConnectedRepos, useConnectedRepos } from "./connected-repos.ts";
import { fetchTrials, parseRepoInput, TRIALS_BRANCH } from "./github.ts";
import { PageShell, Panel } from "./page-shell.tsx";
import { remoteTrialHref } from "./route.ts";

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
