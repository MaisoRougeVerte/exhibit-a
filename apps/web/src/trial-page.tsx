import { assertNever, type CaseFile } from "@exhibit-a/schema";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CharacterSprite } from "./character-sprite.tsx";
import { CourtRecordOverlay } from "./court-record-overlay.tsx";
import { CourtroomBackdrop, CourtroomDesk } from "./courtroom-backdrop.tsx";
import { fromOtherControl } from "./key-target.ts";
import { ObjectionBubble } from "./objection-bubble.tsx";
import { positionOf } from "./positions.ts";
import { courtRecord, toScene } from "./scene.ts";
import { TextBox } from "./text-box.tsx";
import { findTimeline } from "./timelines.ts";
import { useTypewriter } from "./use-typewriter.ts";
import { VerdictCard } from "./verdict-card.tsx";

type TrialPageProps = {
  caseFile: CaseFile;
  /** Event index to open on, for deep links. */
  startAt?: number;
  /** A trial loaded from a connected repo has no bundled report or timeline to link to. */
  remote?: boolean;
};

type StageCommand = "advance" | "back" | "toggle-record" | "close-record" | "none";

function stageCommand(
  keyEvent: KeyboardEvent,
  recordOpen: boolean,
  stageButton: Element | null,
): StageCommand {
  const { key } = keyEvent;
  if (key === "Escape") return "close-record";
  if (key === "r" || key === "R") return "toggle-record";
  // The trial is paused while the Court Record covers the stage.
  if (recordOpen) return "none";
  if (key === "ArrowLeft") return "back";
  if (key !== " " && key !== "Enter") return "none";
  // Enter on ‹ Menu, Back or a copy button must activate that control, not the stage.
  return fromOtherControl(keyEvent, stageButton) ? "none" : "advance";
}

const hudButton =
  "rounded border border-white/60 bg-black/60 px-[1em] py-[0.3em] text-vn-hud text-white hover:bg-black/80";

export function TrialPage({ caseFile, startAt = 0, remote = false }: TrialPageProps) {
  const [index, setIndex] = useState(Math.min(Math.max(startAt, 0), caseFile.events.length - 1));
  const [recordOpen, setRecordOpen] = useState(false);
  const stageButton = useRef<HTMLButtonElement>(null);
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
      const command = stageCommand(keyEvent, recordOpen, stageButton.current);
      switch (command) {
        case "advance":
          keyEvent.preventDefault();
          return advance();
        case "back":
          return back();
        case "toggle-record":
          return setRecordOpen((open) => !open);
        case "close-record":
          return setRecordOpen(false);
        case "none":
          return;
        default:
          return assertNever(command);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back, recordOpen]);

  const shake = scene.effect === "objection" && !reduceMotion;

  return (
    <main className="grid min-h-dvh place-items-center bg-black">
      <section
        aria-label={`Trial: ${caseFile.title}`}
        className="@container relative aspect-video w-full max-w-[calc(100dvh*16/9)] overflow-hidden portrait:aspect-auto portrait:h-dvh portrait:max-w-none bg-stone-900 text-white select-none"
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
          ref={stageButton}
          type="button"
          onClick={advance}
          aria-label="Next line"
          className="absolute inset-0 z-10 cursor-pointer"
        />

        <div className="pointer-events-none absolute inset-0 z-10">
          <TextBox
            speaker={scene.speaker}
            text={typing.shown}
            line={scene.line}
            done={typing.done}
          />
        </div>

        <header className="absolute inset-x-[2%] top-[3%] z-20 flex items-start justify-between gap-4">
          <div className="flex items-center gap-[1em] text-vn-hud">
            <a href="#/" className={hudButton}>
              ‹ Menu
            </a>
            <span className="rounded bg-black/60 px-[0.8em] py-[0.3em] text-white/80 max-sm:hidden">
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

        {finished && event.type === "verdict" && (
          <VerdictCard
            caseFile={caseFile}
            verdict={event}
            canReport={!remote}
            canAccuse={!remote && findTimeline(caseFile.id) !== undefined}
          />
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
