import type { Expression } from "@exhibit-a/schema";
import { motion, useReducedMotion } from "motion/react";
import type { Speaker } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";

type CharacterPortraitProps = {
  speaker: Exclude<Speaker, "narrator">;
  expression: Expression;
};

export function CharacterPortrait({ speaker, expression }: CharacterPortraitProps) {
  const style = speakerStyles[speaker];
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <motion.figure
      key={speaker}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-3"
    >
      <div
        role="img"
        aria-label={`${style.name}, ${expression}`}
        className={`grid size-56 place-items-center rounded-t-full bg-gradient-to-b shadow-2xl sm:size-72 ${style.portrait}`}
      >
        <span className="font-display text-8xl text-white/90">{style.initial}</span>
      </div>
      <figcaption className="rounded bg-black/50 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
        {expression}
      </figcaption>
    </motion.figure>
  );
}
