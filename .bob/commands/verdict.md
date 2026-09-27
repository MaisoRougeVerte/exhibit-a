---
description: Summarize a trial verdict for a developer
argument-hint: <case-id>
---
Reads `cases/$1.json` and prints an actionable developer summary.

## What it does

Reads the case file and prints exactly four sections:

### Culprit commit
The verdict's `culpritCommit` and its one-line message from `git -C demo-repo log -1`.
If the verdict names no culprit, say so. Include the exact command to inspect it:

```
git -C demo-repo show <culpritCommit>
```

### Root cause
One or two sentences from the verdict's `rootCause` field, as written by the investigator
and upheld by the judge.

### Fix
The recommended fix from the verdict's `fixSummary` field.

### Reproduce
The exact commands to reproduce the bug and verify the fix, in order:

```bash
# 1. run the regression test named in the verdict's regressionTest field
pnpm -C demo-repo exec vitest run <regressionTest.file>

# 2. re-run every piece of evidence and compare with the recorded rulings
pnpm judge --check cases/$1.json
```

## Usage

```
/verdict framed-commit
/verdict midnight-order
```

No commands are run; this command only reads and formats the case file.
