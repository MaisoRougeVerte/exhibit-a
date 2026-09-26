import { type FormEvent, Suspense, use, useState } from "react";
import { saveConnectedRepos, useConnectedRepos } from "./connected-repos.ts";
import { fetchTrials, parseRepoInput, TRIALS_BRANCH } from "./github.ts";
import { remoteTrialHref } from "./route.ts";

// Flipped once the reusable GitHub Action is published; until then setup is shown as roadmap.
const ACTION_READY = false;

function RepoTrials({ owner, repo }: { owner: string; repo: string }) {
  const trials = use(fetchTrials(owner, repo));
  if (!trials.ok)
    return <p className="text-sm text-red-300">Could not read the repo: {trials.error}.</p>;
  if (trials.value.length === 0) {
    return (
      <p className="text-sm text-white/60">
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
          className="flex items-center justify-between gap-3 rounded bg-black/40 px-3 py-2"
        >
          <span>
            {caseFile.title}
            <span className="ml-2 text-sm text-white/50">{caseFile.bugReport.title}</span>
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
      <p className="text-sm text-white/60">
        <span className="mr-2 rounded bg-stone-700 px-2 py-0.5 text-xs uppercase">Roadmap</span>
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
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 bg-stone-950 px-6 py-10 text-white">
      <nav className="text-sm text-white/60">
        <a href="#/" className="hover:text-white">
          ← Exhibit A
        </a>
      </nav>
      <header>
        <p className="text-sm uppercase tracking-widest text-brass-400">Dashboard</p>
        <h1 className="font-display text-4xl">Your courtrooms</h1>
        <p className="mt-3 text-white/75">
          Connect a public GitHub repository to follow its trials. Nothing is stored on our side:
          the list lives in this browser, trials are read from GitHub, and API keys only ever go
          into your repository's GitHub secrets.
        </p>
      </header>

      <form onSubmit={connect} className="flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="repo">
          Repository
        </label>
        <input
          id="repo"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="owner/repo"
          className="min-w-64 flex-1 rounded bg-wood-900 px-4 py-2 text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          className="rounded bg-brass-500 px-5 py-2 font-extrabold text-wood-950"
        >
          Connect
        </button>
        {error !== "" && <p className="w-full text-sm text-red-300">{error}</p>}
      </form>

      {repos.map((fullName) => {
        const [owner = "", repo = ""] = fullName.split("/");
        return (
          <section key={fullName} className="flex flex-col gap-3 rounded-xl bg-wood-900 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{fullName}</h2>
              <button
                type="button"
                onClick={() => saveConnectedRepos(repos.filter((name) => name !== fullName))}
                className="text-sm text-white/50 hover:text-white"
              >
                Disconnect
              </button>
            </div>
            <Suspense
              fallback={<p className="text-sm text-white/50">Reading trials from GitHub…</p>}
            >
              <RepoTrials owner={owner} repo={repo} />
            </Suspense>
            <SetupSteps owner={owner} repo={repo} />
          </section>
        );
      })}
    </main>
  );
}
