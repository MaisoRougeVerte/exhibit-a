import type { CaseFile } from "@exhibit-a/schema";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { CharacterSprite } from "./character-sprite.tsx";
import { CourtRecordOverlay } from "./court-record-overlay.tsx";
import { CourtroomBackdrop, CourtroomDesk } from "./courtroom-backdrop.tsx";
import { ObjectionBubble } from "./objection-bubble.tsx";
import { positionOf } from "./positions.ts";
import { accuseHref, reportHref } from "./route.ts";
import { courtRecord, toScene } from "./scene.ts";
import { TextBox } from "./text-box.tsx";
import { findTimeline } from "./timelines.ts";
import { useTypewriter } from "./use-typewriter.ts";

type TrialPageProps = {
  caseFile: CaseFile;
};

const hudButton =
  "rounded border border-white/60 bg-black/60 px-[1em] py-[0.3em] text-[1.4cqw] text-white hover:bg-black/80";

export function TrialPage({ caseFile }: TrialPageProps) {
  const [index, setIndex] = useState(0);
  const [recordOpen, setRecordOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const lastIndex = caseFile.events.length - 1;
  const event = caseFile.events[Math.min(index, lastIndex)];
  if (event === undefined) throw new Error(`case ${caseFile.id} has no events`);

  const scene = toScene(event, caseFile);
  const typing = useTypewriter(scene.line);
  const record = courtRecord(caseFile, index);
  const position = positionOf[scene.speaker];
  const finished = index >= lastIndex && typing.done;

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
      } else if (keyEvent.key === "r" || keyEvent.key === "R") {
        setRecordOpen((open) => !open);
      } else if (keyEvent.key === "Escape") {
        setRecordOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  const shake = scene.effect === "objection" && !reduceMotion;

  return (
    <main className="grid min-h-dvh place-items-center bg-black">
      <section
        aria-label={`Trial: ${caseFile.title}`}
        className="@container relative aspect-video w-full max-w-[calc(100dvh*16/9)] overflow-hidden bg-stone-900 text-white select-none"
      >
        <motion.div
          key={`camera-${index}`}
          animate={shake ? { x: [0, -18, 16, -10, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.45 }}
          className="absolute inset-0"
        >
          <CourtroomBackdrop position={position} />
          {scene.speaker !== "narrator" && (
            <CharacterSprite
              speaker={scene.speaker}
              expression={scene.expression}
              talking={!typing.done}
            />
          )}
          <CourtroomDesk position={position} />
        </motion.div>

        {shake && (
          <motion.div
            key={`flash-${index}`}
            aria-hidden="true"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-0 z-20 bg-white"
          />
        )}

        <ObjectionBubble effect={scene.effect} eventIndex={index} />

        <button
          type="button"
          onClick={advance}
          aria-label="Next line"
          className="absolute inset-0 z-10 cursor-pointer"
        />

        <div className="pointer-events-none absolute inset-0 z-10">
          <TextBox speaker={scene.speaker} text={typing.shown} done={typing.done} />
        </div>

        <header className="absolute inset-x-[2%] top-[3%] z-20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-[1em] text-[1.4cqw]">
            <a href="#/" className={hudButton}>
              ◀ Menu
            </a>
            <span className="rounded bg-black/60 px-[0.8em] py-[0.3em] text-white/80">
              {caseFile.title} · {index + 1}/{caseFile.events.length}
            </span>
          </div>
          <div className="flex gap-[0.8em]">
            <button
              type="button"
              onClick={back}
              disabled={index === 0}
              className={`${hudButton} disabled:opacity-40`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setRecordOpen((open) => !open)}
              className={hudButton}
            >
              Court Record ({record.length})
            </button>
          </div>
        </header>

        {finished && (
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 top-[22%] z-30 flex flex-col items-center gap-[1.2em]"
          >
            <p className="rotate-[-4deg] border-4 border-red-600 px-[0.6em] font-display text-[6cqw] font-black tracking-widest text-red-600 [text-shadow:0_3px_0_rgba(0,0,0,0.8)]">
              GUILTY
            </p>
            <div className="flex gap-[1em] text-[1.6cqw]">
              <a
                href={reportHref(caseFile.id)}
                className="rounded bg-amber-500 px-[1.2em] py-[0.5em] font-semibold text-stone-950"
              >
                Verdict report
              </a>
              {findTimeline(caseFile.id) !== undefined && (
                <a href={accuseHref(caseFile.id)} className={hudButton}>
                  Accuse a commit yourself
                </a>
              )}
            </div>
          </motion.nav>
        )}

        <CourtRecordOverlay
          open={recordOpen}
          entries={record}
          onClose={() => setRecordOpen(false)}
        />
      </section>
    </main>
  );
}
