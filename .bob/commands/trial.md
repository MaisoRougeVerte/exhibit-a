---
description: Run a full Exhibit A trial on a bug report
argument-hint: <bug-report-path> <case-id>
---
Switches to the tribunal mode and runs the full trial procedure of `.bob/skills/exhibit-a/SKILL.md` section 4.

## What it does

1. Switches to the **Tribunal** mode (`tribunal` slug in `.bob/custom_modes.yaml`).
2. Reads the bug report at `$1` (path inside `demo-repo/docs/bug-reports/`).
3. Runs every step of that procedure in order, using `$2` as the case id:
   - launches parallel `explore` subagents (git history, source, tests, logs),
   - writes the reproduction test in `demo-repo/tests/repro/$2.test.ts`,
   - writes initial claims in `cases/$2.json` with `source: "bob-ide"`,
   - runs `pnpm judge cases/$2.json` after each round,
   - launches the prosecutor as a `general` subagent (no conversation history),
   - answers objections with new evidence or withdraws claims,
   - repeats at most three rounds,
   - writes the verdict and runs `pnpm judge cases/$2.json` one final time.

## Usage

```
/trial demo-repo/docs/bug-reports/001-promo-code-one-cent.md vanishing-discount
/trial demo-repo/docs/bug-reports/003-negative-stock.md framed-commit
```

The task is done only when `pnpm judge cases/$2.json` exits without integrity errors.
