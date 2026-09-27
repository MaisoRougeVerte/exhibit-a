import { CommitText } from "./commit-text.tsx";
import { describeEvidence, excerptSummary, type RecordEntry } from "./scene.ts";

const stamp: Record<RecordEntry["status"], string> = {
  pending: "border-stone-500 text-stone-600",
  upheld: "border-emerald-700 text-emerald-700",
  rejected: "border-red-700 text-red-700",
  error: "border-amber-700 text-amber-700",
};

type CourtRecordProps = {
  entries: readonly RecordEntry[];
};

/** Evidence as exhibit cards: what was claimed, the judge's stamp, and what was observed. */
export function CourtRecord({ entries }: CourtRecordProps) {
  if (entries.length === 0) return <p className="opacity-70">No evidence yet.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={entry.evidence.id}
          className="rounded-sm border-2 border-[#2b1a0e]/30 bg-[#fbf3df] p-3 text-[#2b1a0e]"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-sm text-[#8b1d1d]">{entry.evidence.id}</p>
            <span
              className={`-rotate-6 border-2 px-2 font-display text-base tracking-widest uppercase ${stamp[entry.status]}`}
            >
              {entry.status}
            </span>
          </div>
          <p className="mt-1">
            <CommitText text={describeEvidence(entry.evidence)} />
          </p>
          {entry.excerpt !== "" && (
            <pre className="mt-2 overflow-x-auto rounded-sm bg-[#2b1a0e] p-2 text-xs whitespace-pre-wrap text-[#f6ead0]">
              {excerptSummary(entry.excerpt)}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
}
