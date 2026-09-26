import type { CaseFile } from "@exhibit-a/schema";
import { useCallback, useEffect, useState } from "react";
import { CharacterPortrait } from "./character-portrait.tsx";
import { CourtRecord } from "./court-record.tsx";
import { DialogueBox } from "./dialogue-box.tsx";
import { EffectBurst } from "./effect-burst.tsx";
import { reportHref } from "./route.ts";
import { courtRecord, toScene } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";
import { useTypewriter } from "./use-typewriter.ts";

type TrialPageProps = {
  caseFile: CaseFile;
};

export function TrialPage({ caseFile }: TrialPageProps) {
  const [index, setIndex] = useState(0);
  const lastIndex = caseFile.events.length - 1;
  const event = caseFile.events[Math.min(index, lastIndex)];
  if (event === undefined) throw new Error(`case ${caseFile.id} has no events`);

  const scene = toScene(event, caseFile);
  const typing = useTypewriter(scene.line);
  const record = courtRecord(caseFile, index);
  const isLast = index >= lastIndex;

  const advance = useCallback(() => {
    if (!typing.done) {
      typing.finish();
      return;
    }
    setIndex((current) => Math.min(current + 1, lastIndex));
  }, [typing, lastIndex]);

  const back = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), []);

  useEffect(() => {
    function onKey(keyEvent: KeyboardEvent) {
      if (keyEvent.key === " " || keyEvent.key === "Enter") {
        keyEvent.preventDefault();
        advance();
      } else if (keyEvent.key === "ArrowLeft") {
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-stone-950 text-white lg:grid-cols-[1fr_22rem]">
      <section
        aria-label={`Trial: ${caseFile.title}`}
        className={`relative flex flex-col justify-end gap-6 overflow-hidden bg-gradient-to-b p-6 ${speakerStyles[scene.speaker].backdrop}`}
      >
        <header className="absolute inset-x-6 top-5 flex items-center justify-between text-sm text-white/60">
          <a href="#/" className="hover:text-white">
            ← Exhibit A
          </a>
          <span>
            {caseFile.title} · {index + 1}/{caseFile.events.length}
          </span>
        </header>

        <button
          type="button"
          onClick={advance}
          aria-label="Next line"
          className="flex min-h-80 flex-1 items-end justify-center pt-16"
        >
          {scene.speaker !== "narrator" && (
            <CharacterPortrait speaker={scene.speaker} expression={scene.expression} />
          )}
        </button>

        <EffectBurst effect={scene.effect} eventIndex={index} />
        <DialogueBox speaker={scene.speaker} text={typing.shown} done={typing.done} />

        <nav className="flex justify-between text-sm">
          <button
            type="button"
            onClick={back}
            disabled={index === 0}
            className="text-white/60 hover:text-white disabled:opacity-30"
          >
            ← Back
          </button>
          {isLast && typing.done ? (
            <a
              href={reportHref(caseFile.id)}
              className="rounded bg-brass-500 px-4 py-2 font-semibold text-wood-950"
            >
              Read the verdict report
            </a>
          ) : (
            <button type="button" onClick={advance} className="text-white/80 hover:text-white">
              Next →
            </button>
          )}
        </nav>
      </section>

      <aside className="border-l border-brass-500/30 bg-wood-950 p-6">
        <CourtRecord entries={record} />
      </aside>
    </main>
  );
}
