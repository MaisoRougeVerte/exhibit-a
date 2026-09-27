import { useState } from "react";
import { PageShell, Panel } from "./page-shell.tsx";

type Step = { title: string; text: string; commands: string[] };

const steps: Step[] = [
  {
    title: "1 · Get Exhibit A",
    text: "Clone it next to your project and install it. It needs Node 24 and pnpm.",
    commands: [
      "git clone https://github.com/MaisoRougeVerte/exhibit-a",
      "cd exhibit-a && pnpm install",
    ],
  },
  {
    title: "2 · Set up your repository",
    text: "Detects your test runner and adds EXHIBIT-A.md, the Bob Tribunal mode and the GitHub workflow. Existing files are never overwritten.",
    commands: ["pnpm init-repo --repo ../your-project"],
  },
  {
    title: "3 · Put a bug on trial",
    text: "Open your project in IBM Bob, pick the Tribunal mode and describe the bug. Any other agent can follow EXHIBIT-A.md instead. Then let the judge re-run the evidence.",
    commands: ["node ../exhibit-a/judge/src/cli.ts cases/<case-id>.json --repo ."],
  },
  {
    title: "4 · Check your docs too",
    text: "Every file, command and code name quoted in your README and docs, checked against the code.",
    commands: ["pnpm docs-check --repo ../your-project"],
  },
];

function Command({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="flex items-center gap-2 rounded-sm bg-black/60 px-3 py-1.5">
      <span className="text-emerald-400">$</span>
      <code className="min-w-0 flex-1 overflow-x-auto text-sm whitespace-nowrap text-sky-100">
        {command}
      </code>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(command).then(() => setCopied(true));
        }}
        className="rounded-sm border border-white/30 px-2 text-xs text-white/80 hover:bg-white/10"
      >
        {copied ? "copied" : "copy"}
      </button>
    </li>
  );
}

export function SetupPage() {
  return (
    <PageShell
      eyebrow="SET UP"
      title="Put your own project on trial"
      backdrop="defense"
      subtitle="Four steps, about five minutes. No account, no server, no key stored by us."
    >
      {steps.map((step) => (
        <Panel key={step.title} title={step.title}>
          <p className="mb-3 text-white/85">{step.text}</p>
          <ul className="flex flex-col gap-2">
            {step.commands.map((command) => (
              <Command key={command} command={command} />
            ))}
          </ul>
        </Panel>
      ))}
      <Panel title="Optional · trials in CI" tone="parchment">
        <p>
          Add your IBM Bob API key as the repository secret <code>BOB_API_KEY</code>, then label any
          bug issue <code>on-trial</code>. The workflow added in step 2 runs the trial with Bob
          Shell, caps the spend, re-runs the judge and posts the verdict on the issue.
        </p>
      </Panel>
    </PageShell>
  );
}
