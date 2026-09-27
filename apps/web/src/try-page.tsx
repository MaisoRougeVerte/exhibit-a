import { PageShell, Panel } from "./page-shell.tsx";
import { accuseHref } from "./route.ts";

const ways = [
  {
    status: "Available",
    title: "Set up your repository",
    text: "From an Exhibit A checkout, run pnpm init-repo --repo ../your-repo. It detects your test runner and adds the Bob Tribunal mode, the GitHub workflow, and EXHIBIT-A.md: instructions any AI agent can follow so its answer is a trial the judge can check.",
    href: "https://github.com/MaisoRougeVerte/exhibit-a#set-up-any-repository-in-one-command",
    cta: "Read the setup",
  },
  {
    status: "Available",
    title: "Accuse a commit",
    text: "Play the investigator on Crumb & Co. Every ruling comes from a real run of the reproduction test at that commit.",
    href: accuseHref("framed-commit"),
    cta: "Play",
  },
  {
    status: "Available",
    title: "Re-run the judge yourself",
    text: "Clone the repository, run pnpm install, then pnpm judge on any recorded trial. The judge re-executes every piece of evidence and must reach the same rulings. No AI involved.",
    href: "https://github.com/MaisoRougeVerte/exhibit-a",
    cta: "Open the repo",
  },
  {
    status: "Available",
    title: "Run a trial with Bob IDE",
    text: "Open the repository in IBM Bob IDE, pick the Tribunal mode and hand it a bug report from demo-repo/docs/bug-reports. Bob investigates with your own Bobcoins.",
    href: "https://github.com/MaisoRougeVerte/exhibit-a",
    cta: "Open the repo",
  },
  {
    status: "Available",
    title: "Put your docs on trial",
    text: "Run pnpm docs-check --repo path/to/your/repo. Every file, command and code name quoted in your README and docs is checked against the code, with no AI.",
    href: "#/docs/crumb-and-co",
    cta: "See the demo verdict",
  },
  {
    status: "Roadmap",
    title: "Benchmark AI debuggers",
    text: "A suite of planted bugs, hallucination traps and security flaws, where every model faces the same prosecutor and the same deterministic judge. The share of claims that do not survive becomes a measured hallucination rate per model.",
    href: "#/",
    cta: "See the current score",
  },
  {
    status: "Roadmap",
    title: "Put your own repository on trial",
    text: "Install the Exhibit A GitHub Action, add your Bob API key as a repository secret, and label a bug issue on-trial. The trial appears in your dashboard.",
    href: "#/dashboard",
    cta: "Open the dashboard",
  },
];

export function TryPage() {
  return (
    <PageShell eyebrow="TRY IT" title="Ways to test Exhibit A" backdrop="defense">
      <ul className="grid gap-6 sm:grid-cols-2">
        {ways.map((way) => (
          <li key={way.title} className="flex">
            <Panel
              title={way.title}
              tone={way.status === "Available" ? "navy" : "parchment"}
              className="flex-1"
            >
              <p
                className={`mb-3 inline-block -rotate-3 border-2 px-2 font-display text-sm tracking-widest ${way.status === "Available" ? "border-emerald-400 text-emerald-300" : "border-[#8b1d1d] text-[#8b1d1d]"}`}
              >
                {way.status.toUpperCase()}
              </p>
              <p className="leading-relaxed opacity-90">{way.text}</p>
              <a
                href={way.href}
                className={`mt-4 inline-block rounded-sm px-4 py-1.5 font-extrabold ${way.status === "Available" ? "bg-amber-500 text-stone-950" : "border-2 border-[#2b1a0e]"}`}
              >
                {way.cta}
              </a>
            </Panel>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
