import { assertNever, type Timeline, type TimelineCommit } from "@exhibit-a/schema";
import { useEffect, useRef, useState } from "react";
import { type Accusation, accuse, culpritIndex } from "./accuse.ts";
import { CharacterSprite } from "./character-sprite.tsx";
import { CourtroomBackdrop } from "./courtroom-backdrop.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import { trialHref } from "./route.ts";
import { TextBox } from "./text-box.tsx";

type AccusePageProps = {
  timeline: Timeline;
  bugTitle: string;
};

const PANEL = "linear-gradient(180deg, rgba(20,32,70,0.95), rgba(6,10,24,0.95))";

function judgeLine(accusation: Accusation | undefined): string {
  return accusation === undefined
    ? "Pick the commit you suspect. I will replay the reproduction test there and at its parent, exactly like an alibi check."
    : rulingLine(accusation);
}

function isShown(index: number, accused: number | undefined, revealed: boolean): boolean {
  return revealed || index === accused || (accused !== undefined && index === accused - 1);
}

function rulingLine(accusation: Accusation): string {
  const sha = accusation.commit.sha;
  switch (accusation.verdict) {
    case "guilty":
      return accusation.parent === undefined
        ? `Guilty. ${sha} fails the reproduction test, and nothing came before it.`
        : `Guilty. The test fails at ${sha} and passed at its parent ${accusation.parent.sha}: this commit introduced the bug.`;
    case "alibi":
      return `Acquitted. The test fails at ${sha}, but it already failed at its parent ${accusation.parent.sha}. The bug is older.`;
    case "innocent":
      return `Acquitted. The reproduction test passes at ${sha}: the bug does not exist yet.`;
    case "no-ruling":
      return `No ruling. The test cannot run at ${sha}: the code it exercises does not exist yet.`;
    default:
      return assertNever(accusation);
  }
}

const PARCHMENT = "linear-gradient(180deg, #f6ead0 0%, #e8d4a6 100%)";

type CommitRowProps = {
  commit: TimelineCommit;
  selected: boolean;
  accused: boolean;
  status: TimelineCommit["status"] | undefined;
  culprit: boolean;
  onHover: () => void;
  onAccuse: () => void;
};

const node = {
  pass: "bg-emerald-600",
  fail: "bg-red-600",
  error: "bg-stone-400",
} as const;

function CommitRow({
  commit,
  selected,
  accused,
  status,
  culprit,
  onHover,
  onAccuse,
}: CommitRowProps) {
  return (
    <li className="relative">
      <button
        type="button"
        onMouseEnter={onHover}
        onClick={onAccuse}
        aria-pressed={accused}
        className={`flex w-full items-center gap-3 rounded-sm py-[0.3em] pr-2 pl-1 text-left ${selected ? "bg-[#3b2412]/15" : ""} ${accused ? "outline-2 outline-[#8b1d1d] outline-dashed" : ""}`}
      >
        <span aria-hidden="true" className="w-3 text-[#8b1d1d]">
          {selected ? "▶" : ""}
        </span>
        {/* Git-graph node on the history line; its color is the test result at this commit. */}
        <span
          aria-hidden="true"
          className={`relative z-10 size-[0.85em] shrink-0 rounded-full border-2 border-[#2b1a0e] ${status === undefined ? "bg-[#f3e6c4]" : node[status]} ${culprit ? "scale-150 ring-2 ring-red-700" : ""}`}
        />
        <span className="font-mono text-[#8b1d1d]">{commit.sha}</span>
        <span className="min-w-0 flex-1 truncate text-[#2b1a0e]">{commit.subject}</span>
        {culprit && (
          <span className="-rotate-6 border-2 border-red-700 px-1.5 font-display text-sm tracking-widest text-red-700">
            CULPRIT
          </span>
        )}
      </button>
    </li>
  );
}

/** Arrow keys move the menu cursor, Enter or Space accuses, R reveals every result. */
function useMenuKeys(
  size: number,
  cursor: number,
  setCursor: (update: (current: number) => number) => void,
  onAccuse: (row: number) => void,
  onReveal: () => void,
) {
  useEffect(() => {
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    function onKey(keyEvent: KeyboardEvent) {
      const move = moves[keyEvent.key];
      if (move !== undefined) {
        keyEvent.preventDefault();
        setCursor((current) => Math.min(Math.max(current + move, 0), size - 1));
      } else if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        keyEvent.preventDefault();
        onAccuse(cursor);
      } else if (keyEvent.key.toLowerCase() === "r") {
        onReveal();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [size, cursor, setCursor, onAccuse, onReveal]);
}

export function AccusePage({ timeline, bugTitle }: AccusePageProps) {
  const newestFirst = timeline.commits.map((commit, index) => ({ commit, index })).reverse();
  const [cursor, setCursor] = useState(0);
  const [accused, setAccused] = useState<number | undefined>(undefined);
  // Results are visible from the start: the timeline itself is useful to a developer.
  const [revealed, setRevealed] = useState(true);
  const listRef = useRef<HTMLOListElement>(null);

  const accusation = accused === undefined ? undefined : accuse(timeline, accused);
  const culprit = culpritIndex(timeline);
  const judgeMood = accusation?.verdict === "guilty" ? "angry" : "neutral";

  useMenuKeys(
    newestFirst.length,
    cursor,
    setCursor,
    (row) => {
      const entry = newestFirst[row];
      if (entry !== undefined) setAccused(entry.index);
    },
    () => setRevealed(true),
  );

  // Keep the keyboard cursor visible inside the scrolling menu.
  useEffect(() => {
    listRef.current?.children[cursor]?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <main className="grid min-h-dvh place-items-center bg-black">
      <section
        aria-label="Accuse a commit"
        className="@container relative aspect-video w-full max-w-[calc(100dvh*16/9)] overflow-hidden text-white select-none portrait:aspect-auto portrait:h-dvh portrait:max-w-none"
      >
        <CourtroomBackdrop position="bench" />
        <div className="absolute inset-0 bg-black/35" />
        <CharacterSprite speaker="judge" expression={judgeMood} talking={false} />

        <header className="absolute inset-x-[2%] top-[3%] z-20 flex items-start justify-between gap-4 text-vn-hud">
          <a
            href="#/"
            className="rounded border border-white/60 bg-black/60 px-[1em] py-[0.3em] hover:bg-black/80"
          >
            ‹ Menu
          </a>
          <PixelFrame fill={PANEL} className="max-w-[46%]">
            <p className="px-[1.2em] py-[0.5em] text-right">
              <span className="font-display text-vn-name tracking-wider text-amber-300">
                Accuse a commit
              </span>
              <br />
              <span className="text-white/80">Case: {bugTitle}</span>
            </p>
          </PixelFrame>
        </header>

        <PixelFrame
          fill={PARCHMENT}
          frame="#2b1a0e"
          gap="#c9a86a"
          className="absolute top-[14%] left-[2%] z-20 h-[54%] w-[46%] -rotate-1 shadow-2xl portrait:w-[96%]"
        >
          <div className="flex h-full flex-col px-[1.1em] py-[0.8em] text-vn-small text-[#2b1a0e]">
            <div className="mb-2 flex items-baseline justify-between gap-2 border-b-2 border-dashed border-[#2b1a0e]/40 pb-1">
              <p className="font-display text-vn-name tracking-wider text-[#8b1d1d]">
                Exhibit · git log
              </p>
              <p className="font-mono text-xs">{timeline.repo}</p>
            </div>
            <p className="mb-1 flex flex-wrap gap-3 text-xs">
              <span>
                <span className="mr-1 inline-block size-2.5 rounded-full bg-emerald-600" />
                test passes
              </span>
              <span>
                <span className="mr-1 inline-block size-2.5 rounded-full bg-red-600" />
                test fails
              </span>
              <span>
                <span className="mr-1 inline-block size-2.5 rounded-full bg-stone-400" />
                cannot run
              </span>
            </p>
            <ol ref={listRef} className="relative min-h-0 flex-1 overflow-y-auto pr-1">
              {/* The history line the commit nodes sit on. */}
              <span
                aria-hidden="true"
                className="absolute top-2 bottom-2 left-[2.35em] w-[3px] bg-[#2b1a0e]/50"
              />
              {newestFirst.map(({ commit, index }, row) => (
                <CommitRow
                  key={commit.sha}
                  commit={commit}
                  selected={row === cursor}
                  accused={index === accused}
                  status={isShown(index, accused, revealed) ? commit.status : undefined}
                  culprit={revealed && index === culprit}
                  onHover={() => setCursor(row)}
                  onAccuse={() => {
                    setCursor(row);
                    setAccused(index);
                  }}
                />
              ))}
            </ol>
            <p className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-[#2b1a0e]/70">
              <span>
                Each dot is a real run of the reproduction test · ↑↓ choose · Enter accuse
              </span>
              <a href={trialHref(timeline.caseId)} className="text-[#8b1d1d] underline">
                Watch Bob's trial
              </a>
            </p>
          </div>
        </PixelFrame>

        <div className="pointer-events-none absolute inset-0 z-10">
          <TextBox speaker="judge" done={accusation !== undefined} text={judgeLine(accusation)} />
        </div>
      </section>
    </main>
  );
}
