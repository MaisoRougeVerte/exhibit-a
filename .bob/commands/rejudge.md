---
description: Re-run every piece of evidence of a recorded trial
argument-hint: <case-id>
---
Re-runs every evidence item in a recorded trial and summarizes every ruling.

## What it does

Runs:

```bash
pnpm judge --check cases/$1.json
```

Then prints one line per ruling in this format:

```
<evidence-id>  <status>  <observed>
```

- **evidence-id**: the `id` field of the evidence item as recorded in the case file.
- **status**: `upheld`, `rejected`, or `error`.
- **observed**: one short phrase — what the judge actually saw (exit code, match count, first failing assertion, or error message).

Rulings that match the recorded result are printed as-is. Rulings that differ from the
recorded result are prefixed with `CHANGED:`.

## Usage

```
/rejudge framed-commit
/rejudge vanishing-discount
```

No edits are made to the case file; this command is read-only.
