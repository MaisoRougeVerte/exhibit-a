#!/usr/bin/env bash
# Commits the case file and its reproduction test to the `exhibit-a` branch of the repository
# on trial, then posts the verdict on the issue. Runs inside the Exhibit A GitHub Action.
set -euo pipefail

case_id="issue-${ISSUE_NUMBER}"
case_file="${EXHIBIT_A}/cases/${case_id}.json"
repro_test="${GITHUB_WORKSPACE}/target/tests/repro/${case_id}.test.ts"
branch_dir="$(mktemp -d)"
trap 'git -C "$GITHUB_WORKSPACE/target" worktree remove --force "$branch_dir" 2>/dev/null || true; rm -rf "$branch_dir"' EXIT

cd "$GITHUB_WORKSPACE/target"
# The checkout kept no credentials, so git authenticates with GH_TOKEN from here on.
gh auth setup-git
git config user.name "exhibit-a[bot]"
git config user.email "exhibit-a[bot]@users.noreply.github.com"

if git ls-remote --exit-code --heads origin exhibit-a >/dev/null; then
  git fetch origin exhibit-a
  git worktree add "$branch_dir" origin/exhibit-a
  git -C "$branch_dir" switch -C exhibit-a
else
  git worktree add --detach "$branch_dir"
  git -C "$branch_dir" switch --orphan exhibit-a
fi

mkdir -p "$branch_dir/cases" "$branch_dir/tests/repro"
cp "$case_file" "$branch_dir/cases/"
if [ -f "$repro_test" ]; then cp "$repro_test" "$branch_dir/tests/repro/"; fi
git -C "$branch_dir" add cases tests
# A re-run of the same issue may change nothing; that is not a failure.
if ! git -C "$branch_dir" diff --cached --quiet; then
  git -C "$branch_dir" commit -m "trial: ${case_id}"
  git -C "$branch_dir" push origin exhibit-a
fi

verdict="$(node -e 'const c=require(process.argv[1]);const v=c.events.at(-1);console.log(v.type==="verdict"?`**Verdict:** ${v.line}\n\n**Root cause:** ${v.rootCause}\n\n**Fix:** ${v.fixSummary}`:"The trial ended without a verdict.")' "$case_file")"
replay="${SITE_URL}/#/r/${REPO}/${case_id}.json"
gh issue comment "$ISSUE_NUMBER" --repo "$REPO" --body "$(printf '## Exhibit A: trial closed\n\n%s\n\nEvery claim above survived a deterministic judge that re-ran its evidence.\n\n[Replay the trial](%s)\n' "$verdict" "$replay")"
