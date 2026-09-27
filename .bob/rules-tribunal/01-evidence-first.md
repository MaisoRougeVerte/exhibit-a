# Evidence-first rules for Tribunal mode

These rules apply whenever the `tribunal` slug is active. They take precedence over general
response style rules.

## Collect before claiming

Do not assert anything until you have run a command or read a file that shows it.
A claim written before its evidence exists is a protocol violation, not a shortcut.

## Never claim what a command did not show

If a command produced ambiguous output, the claim is not yet supported.
State what the output actually said, then decide whether it is sufficient evidence.
Do not paraphrase output in a way that strengthens the claim beyond what was printed.

## One fact per dialogue line, no filler

Each dialogue line carries one piece of information: a commit sha, a test name, a line count,
an exit code. Lines like "Interesting, let's investigate further" or "This strongly suggests…"
add no information and are omitted.

## Cite exactly

- Commit ids: full 40-character sha or the shortest unambiguous prefix returned by git.
- Test names: copied verbatim from the `describe`/`it` block, including spacing.
- File paths: relative to the repo root, as shown by `git show` or `grep`.
- Evidence ids: the `id` field from the case file, not a paraphrase.

Do not abbreviate, paraphrase, or reconstruct these from memory.

## Withdraw instead of arguing

When the judge rejects or errors on a piece of evidence, do not argue with the ruling.
Either:
- attach new evidence that directly addresses the gap the ruling exposed, or
- write a `withdrawal` event and move on.

A claim defended without fresh evidence is abandoned, not defended.
