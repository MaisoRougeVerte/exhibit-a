import { accuseHref } from "./route.ts";

const ways = [
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
    status: "Roadmap",
    title: "Put your own repository on trial",
    text: "Install the Exhibit A GitHub Action, add your Bob API key as a repository secret, and label a bug issue on-trial. The trial appears in your dashboard.",
    href: "#/dashboard",
    cta: "Open the dashboard",
  },
];

export function TryPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col gap-8 bg-stone-950 px-6 py-10 text-white">
      <nav className="text-sm text-white/60">
        <a href="#/" className="hover:text-white">
          ← Exhibit A
        </a>
      </nav>
      <header>
        <p className="text-sm uppercase tracking-widest text-brass-400">Try it</p>
        <h1 className="font-display text-4xl">Four ways to test Exhibit A</h1>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {ways.map((way) => (
          <li key={way.title} className="flex flex-col gap-3 rounded-xl bg-wood-900 p-5">
            <span
              className={`self-start rounded px-2 py-0.5 text-xs uppercase ${way.status === "Available" ? "bg-emerald-700" : "bg-stone-700"}`}
            >
              {way.status}
            </span>
            <h2 className="font-display text-2xl">{way.title}</h2>
            <p className="flex-1 text-white/75">{way.text}</p>
            <a
              href={way.href}
              className="self-start rounded border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
            >
              {way.cta}
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
