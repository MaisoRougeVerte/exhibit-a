# Exhibit A

**Your AI says it found the bug. Make it prove it.**

Exhibit A puts a bug on trial. IBM Bob investigates with parallel subagents and must back every
claim with executable evidence. An independent prosecutor subagent attacks each claim. A
deterministic judge, plain code with no LLM, re-runs every piece of evidence. Only claims that
survive reach the verdict: root cause, culprit commit, regression test and fix. The trial then
replays as a courtroom visual novel.

Built for the IBM Bob 2.0 Hackathon (lablab.ai, 25 to 27 September 2026).

## The problem

In the 2025 Stack Overflow Developer Survey, 66% of developers named "AI solutions that are almost
right, but not quite" as their top frustration, and 45% said debugging AI-generated code takes
more time. When an assistant confidently blames the wrong commit, the developer re-checks
everything by hand, and the time the AI saved is lost again.

## How a trial works

1. **Investigation.** In the Bob IDE `tribunal` mode, Bob reads the bug report, launches `explore`
   subagents in parallel on the git history, the logs and the code, and writes a reproduction test.
2. **Claims with evidence.** Every claim cites evidence the court can execute: a failing test, the
   same test replayed at a given commit, a literal log search, or a git bisect.
3. **The judge.** `pnpm judge` re-runs each piece of evidence in a temporary git worktree and
   appends a ruling: upheld, rejected or error. A test that does not compile or matches no test
   is an error, never a pass or a failure.
4. **The prosecutor.** A `general` subagent, started without the investigator's conversation,
   sees only the claims and the rulings, and objects to any claim its evidence does not prove.
5. **The verdict.** The schema itself refuses a verdict that upholds a withdrawn claim or a claim
   whose evidence was not upheld.

## A measured hallucination rate

Across the three recorded trials, Bob made **8 claims**. **4 of them did not survive the court:**
they were withdrawn after the prosecutor objected or the judge rejected their evidence. The judge
re-ran 12 pieces of evidence. The same courtroom can rate any AI debugger: plant bugs,
hallucination traps and security flaws, let each model investigate, and count what survives.
That benchmark is on the roadmap.

## Three recorded trials

All three were run by Bob on [Crumb & Co](https://github.com/MaisoRougeVerte/crumb-and-co), a small
bakery orders API with bugs planted on purpose.

| Trial | Culprit | What happened |
|---|---|---|
| `framed-commit` | `1293f22`, async inventory store | Bob first accused a recent refactor. The judge replayed the test at its parent, found the bug already there, and Bob withdrew. The prosecutor also struck two claims based only on log correlation. |
| `vanishing-discount` | `3cabb03`, totals computed in euros | Failing test, alibi at the parent, and a bisect all agreed. No objection. |
| `midnight-order` | `a936ae7`, day bucketed in UTC | The prosecutor objected to a log-based claim; Bob withdrew it and kept the executable proof. |

Anyone can verify them without any AI:

```bash
git clone --recurse-submodules https://github.com/MaisoRougeVerte/exhibit-a
cd exhibit-a
pnpm install && pnpm -C demo-repo install
pnpm judge cases/framed-commit.json   # the judge re-runs every piece of evidence
```

## Try it

- **Watch a trial** and read its verdict report on the site.
- **Accuse a commit yourself:** pick the commit you suspect, the judge checks it with the same
  alibi rule. Every result comes from a real run of the reproduction test at that commit.
- **Run a trial with Bob IDE:** open this repository in IBM Bob, choose the Tribunal mode and hand
  it a bug report from `demo-repo/docs/bug-reports/`.
- **Put your own repository on trial:** add [`action/example-workflow.yml`](action/example-workflow.yml)
  to your repo, a `.exhibit-a.json` with your test command, and a `BOB_API_KEY` secret, then label a
  bug issue `on-trial`. The action runs the trial with Bob Shell, caps the spend with `--max-cost`,
  re-runs the judge and comments the verdict on the issue.

## Repository

| Path | Content |
|---|---|
| `.bob/` | The Bob IDE `tribunal` mode and its evidence skill |
| `packages/schema` | Zod schema of a trial, with the integrity rules |
| `judge/` | Deterministic evidence runner and per-commit timelines |
| `cases/` | Trials recorded from real Bob runs, and their timelines |
| `apps/web` | Static site: visual novel player, verdict report, accuse game, dashboard |
| `action/` | Reusable GitHub Action |
| `demo-repo/` | Crumb & Co, as a submodule |
| `bob_sessions/` | IBM Bob task session summaries |

```bash
pnpm check   # typecheck, lint and tests
pnpm dev     # site on http://localhost:5173
```

## How IBM Bob was used

Bob is the engine of the product, not only a coding assistant:

- **Tribunal mode and evidence skill:** written with Bob IDE in Agent mode.
- **The judge:** first version written by Bob in Agent mode, then reviewed; three defects found in
  review were fixed and covered by tests (a compile error counted as a failing test, a test name
  matching nothing counted as a pass, and old commits did not receive the reproduction test).
- **The three trials:** each one is a Bob IDE task in the Tribunal mode, with parallel `explore`
  subagents and a `general` prosecutor subagent.
- **The GitHub Action:** runs the same mode headless with Bob Shell.

Session summaries are in [`bob_sessions/`](bob_sessions/).

## Other tools, honestly

The tooling, the demo repository, the web site and the reviews were written with Claude Code.
Character art and backgrounds were generated with OpenAI image generation through Codex; the
characters are original. Fonts: Jersey 10 and M PLUS Rounded 1c, all under the SIL Open
Font License.

## Limits

- Evidence kinds are limited to tests, commit replays, log searches and bisects.
- The judge supports Vitest reports natively; other runners fall back to output parsing.
- The site reads connected repositories through the public GitHub API, so public repos only.
