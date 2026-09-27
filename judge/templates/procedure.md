# EXHIBIT-A.md — debugging on trial

Instructions for any AI coding agent (IBM Bob, Claude Code, Copilot, Codex…) asked to find the
cause of a bug in this repository. Follow them exactly: the output is read by a deterministic
judge and by the Exhibit A site, so the format is strict.

**Core rule: no claim without executable evidence.** An opinion is not evidence. Only the judge,
plain code, decides whether evidence holds.

## Procedure

1. Read the bug report you were given.
2. Explore in parallel if you can: the git history of the suspect area, the logs, the code.
3. Write a reproduction test in `tests/repro/<case-id>.test.*`. It must fail today because of
   the bug, and exercise the real code. This is the only source file you may create.
4. Write your claims, each with evidence, in `cases/<case-id>.json` (format below), with
   `"source": "bob-ide"` if you are IBM Bob, otherwise `"source": "fixture"`.
5. Run the judge: `{{JUDGE}} cases/<case-id>.json --repo .`
   It appends one ruling per piece of evidence. Never write rulings yourself.
6. Be your own prosecutor, ideally as a separate agent that sees only the claims and rulings:
   object to any claim whose evidence does not prove it (for example, a blamed commit whose
   parent already fails the test).
7. Answer each objection with new evidence in a new claim (`respondsTo`), or withdraw the claim.
8. Repeat from step 5, three rounds at most.
9. Write the verdict as the last event, then run the judge once more: it must exit 0.

## Style of every dialogue line

- One fact per line, 280 characters maximum. No filler, no drama.
- Cite commit ids and test names exactly as they appear.
- Never fix the bug during the trial: the verdict describes the fix.

