import type { TimelineCommit } from "@exhibit-a/schema";
import { allCommits } from "./timelines.ts";

const SHA = /\b([0-9a-f]{7,12})(\^|~\d+)?\b/g;

function subjectOf(sha: string): string | undefined {
  return allCommits().find(
    (commit: TimelineCommit) => sha.startsWith(commit.sha) || commit.sha.startsWith(sha),
  )?.subject;
}

/**
 * Renders text with every known commit id wrapped in a hover card showing the commit's
 * message, so a reader never has to decode a bare hash.
 */
export function CommitText({ text }: { text: string }) {
  const parts: Array<string | { sha: string; suffix: string; subject: string }> = [];
  let last = 0;
  for (const match of text.matchAll(SHA)) {
    const [whole, sha = "", suffix = ""] = match;
    const subject = subjectOf(sha);
    if (subject === undefined) continue;
    parts.push(text.slice(last, match.index), { sha, suffix, subject });
    last = match.index + whole.length;
  }
  parts.push(text.slice(last));
  return (
    <>
      {parts.map((part, index) =>
        typeof part === "string" ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts of one immutable string, never reordered
          <span key={index}>{part}</span>
        ) : (
          <button
            type="button"
            // biome-ignore lint/suspicious/noArrayIndexKey: parts of one immutable string, never reordered
            key={index}
            aria-label={`${part.sha}${part.suffix}: ${part.subject}`}
            className="group pointer-events-auto relative inline cursor-help bg-transparent p-0 font-mono text-amber-300 underline decoration-dotted underline-offset-4"
          >
            {part.sha}
            {part.suffix}
            <span
              role="tooltip"
              className="invisible absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[22rem] -translate-x-1/2 rounded border-2 border-slate-200 bg-slate-950 px-3 py-2 font-sans text-sm text-white not-italic no-underline shadow-lg group-hover:visible group-focus:visible"
            >
              {part.suffix === "" ? "" : "Parent of: "}
              {part.subject}
            </span>
          </button>
        ),
      )}
    </>
  );
}
