---
name: exhibit-a
description: >
  Evidence rules, case file format, and prosecutor brief for Exhibit A trials.
  Load this skill at the start of every tribunal-mode session and before
  launching the prosecutor subagent.
---

# Exhibit A — Evidence Rules and Case File Format

This skill defines the rules of evidence, the case file schema, and the exact
brief to hand the prosecutor subagent. It is the authoritative reference for
the tribunal mode. The schema source of truth is `packages/schema/src/case-file.ts`
and `packages/schema/src/integrity.ts`. Never invent a field that does not appear there.

---

## 1. Case file structure

A case file is a single JSON object. Every field is required unless marked optional.

```
{
  schemaVersion: 1,
  id:            string  — lowercase slug, e.g. "framed-commit"
  title:         string  — max 80 chars, human-readable case title
  source:        "bob-ide" | "fixture"
  recordedAt:    ISO 8601 datetime with offset, e.g. "2026-09-20T14:00:00+02:00"
  repo: {
    name: string         — e.g. "MaisoRougeVerte/crumb-and-co"
    head: string         — abbreviated or full commit SHA (7–40 hex chars)
  }
  bugReport: {
    title: string        — max 120 chars
    body:  string        — max 4000 chars
  }
  events: CaseEvent[]    — ordered list, must end with a verdict
}
```

### 1.1 Event types

Events are discriminated by the `type` field. They must appear in a valid causal
order (references always point to earlier events by id).

#### `narration`
Scene text with no speaker.
```json
{ "type": "narration", "line": "The courtroom falls silent." }
```

#### `claim`
The investigator or the prosecutor asserts something and attaches evidence.
```json
{
  "type":       "claim",
  "id":         "claim-1",
  "speaker":    "investigator",
  "expression": "confident",
  "line":       "The rounding change in commit 3cabb03 swapped integer cents for euros, dropping one cent.",
  "evidence": [
    {
      "id":       "ev-repro",
      "kind":     "test",
      "file":     "tests/repro/vanishing-discount.test.ts",
      "testName": "promo code gives 2.29 EUR",
      "expect":   "fail"
    }
  ],
  "respondsTo": "obj-1"   // optional — id of the objection this claim answers
}
```

- `speaker`: `"investigator"` or `"prosecutor"`
- `expression`: one of `neutral | confident | thinking | sweating | shocked | angry | smug | defeated`
- `evidence`: array of at least one item (see section 2)
- `respondsTo`: optional id of a prior `objection` event

#### `ruling`
Written **only by the judge** (`pnpm judge cases/<id>.json`). Never write or
edit a ruling by hand.
```json
{
  "type":       "ruling",
  "evidenceId": "ev-repro",
  "status":     "upheld",
  "exitCode":   1,
  "excerpt":    "AssertionError: expected 2.30 to equal 2.29",
  "durationMs": 812
}
```
- `status`: `"upheld"` | `"rejected"` | `"error"`
- `exitCode`: integer or `null`
- `excerpt`: max 2000 chars of stdout/stderr

#### `objection`
The prosecutor or the developer attacks an earlier claim.
```json
{
  "type":       "objection",
  "id":         "obj-1",
  "speaker":    "prosecutor",
  "target":     "claim-1",
  "expression": "angry",
  "line":       "The parent of that commit already fails this test. You have the wrong commit."
}
```
- `speaker`: `"prosecutor"` or `"developer"`
- `target`: id of an earlier `claim`

#### `withdrawal`
The investigator abandons a claim. The withdrawn claim cannot appear in the verdict.
```json
{
  "type":       "withdrawal",
  "speaker":    "investigator",
  "target":     "claim-1",
  "expression": "defeated",
  "line":       "I withdraw claim-1. The evidence does not survive the prosecutor's alibi test."
}
```

#### `verdict`
The last event. Must be the final event in the `events` array.
```json
{
  "type":         "verdict",
  "rootCause":    "The stock check and decrement were split across an await in commit 1293f22, making the race condition possible.",
  "culpritCommit": "1293f22",
  "upheldClaims": ["claim-2"],
  "regressionTest": {
    "file":     "tests/repro/framed-commit.test.ts",
    "testName": "concurrent orders cannot both succeed on the last baguette"
  },
  "fixSummary":   "Wrap the check-and-decrement in an atomic operation or a mutex to prevent interleaving.",
  "line":         "The real culprit is the async split, not the rename. The inventory module is innocent."
}
```
- `upheldClaims`: ids of non-withdrawn claims whose **every** evidence item was ruled `"upheld"`.
  The schema's `checkIntegrity` enforces this: the file will not parse if any listed claim has a
  non-upheld evidence item or has been withdrawn.
- `culpritCommit`: optional abbreviated or full SHA
- `regressionTest`: optional `{ file, testName? }`
- `rootCause`, `fixSummary`: max 1000 chars each
- `line`: max 280 chars

---

## 2. Evidence kinds and judge ruling rules

All runs happen inside `demo-repo/`, one at a time, with a 60-second timeout.
The test command comes from `demo-repo/.exhibit-a.json` (`"test"` array).
The judge appends the test file path and `-t <testName>` when a `testName` is provided.

| Kind | What the judge runs | Upheld when |
|---|---|---|
| `test` | Test command + `<file>` + optional `-t <testName>` on the working tree | `expect: "fail"`: ≥1 test ran and failed on an assertion. Compile error or test-not-found → `error`. `expect: "pass"`: ≥1 test ran and all passed. |
| `test-at-commit` | Same test, but in a temporary worktree checked out at `commit` | Same rule as `test`. Use to check an alibi: does the bug exist at this commit? |
| `log-search` | Counts lines in `file` containing `pattern` as a **literal substring** (not regex) | The count equals `expectMatches` exactly. |
| `bisect` | Binary search between `good` and `bad`, running the test at each step | `good` passes, `bad` fails, and the first failing commit matches `expectCulprit`. |

### Evidence field reference

```
test:
  id:       string  — lowercase slug
  kind:     "test"
  file:     string  — repo-relative path, no leading slash, no ".."
  testName: string  — optional, the -t argument
  expect:   "fail" | "pass"

test-at-commit:
  id:       string
  kind:     "test-at-commit"
  file:     string
  testName: string  — optional
  commit:   string  — SHA (7–40 hex), optionally followed by ~N or ^
  expect:   "fail" | "pass"

log-search:
  id:            string
  kind:          "log-search"
  file:          string  — repo-relative path
  pattern:       string  — literal substring to count
  expectMatches: integer >= 0

bisect:
  id:            string
  kind:          "bisect"
  file:          string
  testName:      string  — optional
  good:          string  — SHA, optionally ~N or ^
  bad:           string  — SHA, optionally ~N or ^
  expectCulprit: string  — abbreviated SHA (7–40 hex)
```

---

## 3. Integrity rules (enforced by the judge and `checkIntegrity`)

These rules are enforced in code — the schema's `parse` rejects a file that breaks them.

1. Every id in the file is unique (claims, evidence, objections all share one id space).
2. An `objection.target` must reference an earlier `claim` (by id).
3. A `claim.respondsTo` must reference an earlier `objection` (by id).
4. A `ruling.evidenceId` must reference an earlier evidence item (by id), and each evidence
   item may be ruled on at most once.
5. The verdict must be the last event.
6. Every id in `verdict.upheldClaims` must:
   - reference an earlier `claim`
   - not be in the `withdrawn` set
   - have every evidence item ruled `"upheld"` (not `"rejected"`, not `"error"`, not missing)

Rule 6 is the "no claim without executable evidence" invariant in code.

---

## 4. Tribunal step-by-step checklist

These steps are from PLAN.md section 7. Follow them in order.

1. Read the bug report (`demo-repo/docs/bug-reports/`).
2. Launch `explore` subagents in parallel: git history, source, tests, logs.
3. Write the reproduction test in `demo-repo/tests/repro/<case-id>.test.ts`.
4. Write initial claims in `cases/<case-id>.json` (`source: "bob-ide"`).
5. Run `pnpm judge cases/<case-id>.json` — reads back the rulings.
6. Launch the prosecutor as a `general` subagent **without conversation history**.
   Use the brief in section 5 below.
7. Answer each objection with a new `claim` (`respondsTo: <objection-id>`) or
   issue a `withdrawal`.
8. Repeat from step 5, at most **three rounds** total.
9. Write the `verdict` event. Run `pnpm judge` one last time to confirm validity.

---

## 5. Prosecutor subagent brief

Copy this brief verbatim when launching the prosecutor. Do not include the
conversation history.

---

**BEGIN PROSECUTOR BRIEF**

You are the Exhibit A prosecutor. Your only job is to find flaws in the investigator's
claims. You are skeptical, rigorous, and never accept a conclusion the evidence does not
strictly prove.

You will receive a JSON array of events from a case file. It contains `claim` events and
`ruling` events. Read them carefully.

For every claim, ask:

1. Does the evidence actually prove what the claim says?
   - A test that fails does NOT prove a specific commit is guilty unless the same test
     passes at that commit's parent (`test-at-commit` with `expect: "pass"`).
   - A `log-search` that matches lines does NOT prove causation, only correlation.
   - A `bisect` only proves the first failing commit, not the root cause.

2. Is the accused commit actually innocent?
   - Check whether the parent commit already fails the same test. If so, the accused
     commit is not the introducer.

3. Is any evidence missing?
   - A claim with only one evidence item that proves existence of the bug (not its cause)
     is incomplete. There should be evidence pinning the cause.

For each flaw you find, emit one `objection` event:
```json
{
  "type":       "objection",
  "id":         "obj-<n>",
  "speaker":    "prosecutor",
  "target":     "<claim-id>",
  "expression": "angry",
  "line":       "<your objection in <= 280 characters>"
}
```

If you find no flaws, emit:
```json
{ "type": "narration", "line": "The prosecutor finds no further objections. The evidence stands." }
```

Return only the JSON events as a JSON array. No prose outside the array.

**END PROSECUTOR BRIEF**

---

## 6. Complete example — `framed-commit` trial skeleton

This is a valid (abbreviated) trial illustrating the key events. Real trials have more
claims and more evidence items. The exact SHAs below are from the `demo-repo` history.

```json
{
  "schemaVersion": 1,
  "id": "framed-commit",
  "title": "Stock goes negative when two customers buy the last baguette",
  "source": "bob-ide",
  "recordedAt": "2026-09-20T14:00:00+02:00",
  "repo": {
    "name": "MaisoRougeVerte/crumb-and-co",
    "head": "23db325"
  },
  "bugReport": {
    "title": "Stock went negative on the last baguette",
    "body": "On the night of 19 September, two customers paid for the last baguette tradition within the same second. The dashboard showed -1. Support thinks it started with the inventory refactor that renamed the stock module."
  },
  "events": [
    {
      "type": "narration",
      "line": "The courtroom assembles. A bakery is on trial for selling baguettes it does not have."
    },
    {
      "type": "claim",
      "id": "claim-rename",
      "speaker": "investigator",
      "expression": "confident",
      "line": "The rename refactor in a6fe65a introduced the race: it restructured the check-and-decrement path.",
      "evidence": [
        {
          "id": "ev-repro-fail",
          "kind": "test",
          "file": "tests/repro/framed-commit.test.ts",
          "testName": "concurrent orders cannot both succeed on the last baguette",
          "expect": "fail"
        },
        {
          "id": "ev-alibi-rename",
          "kind": "test-at-commit",
          "file": "tests/repro/framed-commit.test.ts",
          "testName": "concurrent orders cannot both succeed on the last baguette",
          "commit": "a6fe65a^",
          "expect": "pass"
        }
      ]
    },
    {
      "type": "ruling",
      "evidenceId": "ev-repro-fail",
      "status": "upheld",
      "exitCode": 1,
      "excerpt": "AssertionError: expected stock to be 0, got -1",
      "durationMs": 943
    },
    {
      "type": "ruling",
      "evidenceId": "ev-alibi-rename",
      "status": "rejected",
      "exitCode": 1,
      "excerpt": "AssertionError: expected stock to be 0, got -1 — the parent also fails",
      "durationMs": 1105
    },
    {
      "type": "objection",
      "id": "obj-alibi",
      "speaker": "prosecutor",
      "target": "claim-rename",
      "expression": "angry",
      "line": "The parent of a6fe65a already fails the test. That rename is innocent. You have framed the wrong commit."
    },
    {
      "type": "withdrawal",
      "speaker": "investigator",
      "target": "claim-rename",
      "expression": "sweating",
      "line": "I withdraw claim-rename. The alibi evidence confirms the rename did not introduce the race."
    },
    {
      "type": "claim",
      "id": "claim-async-split",
      "speaker": "investigator",
      "expression": "thinking",
      "line": "The real culprit is 1293f22: it split the stock check and decrement across an await, enabling the race.",
      "respondsTo": "obj-alibi",
      "evidence": [
        {
          "id": "ev-bisect",
          "kind": "bisect",
          "file": "tests/repro/framed-commit.test.ts",
          "testName": "concurrent orders cannot both succeed on the last baguette",
          "good": "903fbc3",
          "bad": "a6fe65a",
          "expectCulprit": "1293f22"
        }
      ]
    },
    {
      "type": "ruling",
      "evidenceId": "ev-bisect",
      "status": "upheld",
      "exitCode": 0,
      "excerpt": "bisect: first bad commit is 1293f22e3b190525ea58610f32c030004697f624",
      "durationMs": 8421
    },
    {
      "type": "verdict",
      "rootCause": "Commit 1293f22 introduced an async inventory store and split the stock check from the decrement across an await, creating a TOCTOU race condition. Two concurrent requests both read stock=1, both pass the check, and both decrement to 0 and -1.",
      "culpritCommit": "1293f22",
      "upheldClaims": ["claim-async-split"],
      "regressionTest": {
        "file": "tests/repro/framed-commit.test.ts",
        "testName": "concurrent orders cannot both succeed on the last baguette"
      },
      "fixSummary": "Make the check-and-decrement atomic: hold a lock, use a compare-and-swap, or serialize access to the inventory store so no two requests can interleave between the check and the decrement.",
      "line": "The rename is innocent. The async split in 1293f22 is the true culprit. Case closed."
    }
  ]
}
```

### Why this trial satisfies the invariant

- `claim-rename` was **withdrawn** after `ev-alibi-rename` was ruled `rejected`.
  It cannot appear in `upheldClaims` and does not.
- `claim-async-split` has one evidence item (`ev-bisect`) ruled `upheld`.
  It appears in `upheldClaims`. The schema's `checkIntegrity` accepts it.
- If you tried to put `claim-rename` in `upheldClaims`, `checkIntegrity` would report:
  `claim "claim-rename" was withdrawn and cannot be upheld`.
- If you tried to put `claim-async-split` in `upheldClaims` before `ev-bisect`
  received a ruling, `checkIntegrity` would report:
  `claim "claim-async-split" relies on evidence "ev-bisect" that the judge did not uphold`.

---

## 7. Quick reference — allowed id characters

All `id` fields (claim ids, evidence ids, objection ids) must match:

```
^[a-z][a-z0-9-]*$
```

Examples of valid ids: `claim-1`, `ev-repro-fail`, `obj-alibi`, `framed-commit`
Examples of invalid ids: `Claim1`, `ev_repro`, `1st-claim`, `claim 1`

## 8. Dialogue line limits

Every `line` field across all event types is trimmed and must be 1–280 characters.
Stay in character. The investigator is methodical and measured; the prosecutor is
skeptical and sharp; the judge speaks only through rulings (the judge never speaks
as a `claim` or `narration` speaker).
