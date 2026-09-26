import { describeEvidence, type RecordEntry } from "./scene.ts";

const statusStyles: Record<RecordEntry["status"], string> = {
  pending: "bg-stone-600 text-stone-100",
  upheld: "bg-emerald-600 text-white",
  rejected: "bg-red-600 text-white",
  error: "bg-amber-600 text-white",
};

type CourtRecordProps = {
  entries: readonly RecordEntry[];
};

export function CourtRecord({ entries }: CourtRecordProps) {
  return (
    <section aria-label="Court record" className="flex flex-col gap-3">
      <h2 className="font-display text-xl text-brass-400">Court record</h2>
      {entries.length === 0 && <p className="text-sm text-white/50">No evidence yet.</p>}
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.evidence.id} className="rounded-lg bg-black/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-white/60">{entry.evidence.id}</span>
              <span
                className={`rounded px-2 py-0.5 text-xs uppercase ${statusStyles[entry.status]}`}
              >
                {entry.status}
              </span>
            </div>
            <p className="mt-1 text-white/85">{describeEvidence(entry.evidence)}</p>
            {entry.excerpt !== "" && (
              <pre className="mt-2 overflow-x-auto rounded bg-black/60 p-2 text-xs text-white/60">
                {entry.excerpt}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
