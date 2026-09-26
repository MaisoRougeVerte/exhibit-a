import { motion, useReducedMotion } from "motion/react";
import type { Speaker } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";

type TextBoxProps = {
  speaker: Speaker;
  text: string;
  done: boolean;
};

export function TextBox({ speaker, text, done }: TextBoxProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const style = speakerStyles[speaker];
  const narrating = speaker === "narrator";
  return (
    <div className="absolute inset-x-[3%] bottom-[4%] h-[26%]">
      {!narrating && (
        <p
          className="absolute -top-[1.1em] left-[3%] z-10 rounded-t-md border-2 border-b-0 border-white/80 px-[1.2em] py-[0.15em] font-display text-[2.6cqw] leading-tight text-white shadow"
          style={{ backgroundColor: style.nameplate }}
        >
          {style.name}
        </p>
      )}
      <div className="relative h-full rounded-lg border-2 border-white/80 bg-black/75 px-[3%] py-[2%] shadow-[0_0_0_4px_rgba(0,0,0,0.5)]">
        <p
          aria-live="polite"
          className={`text-[2.4cqw] font-semibold leading-snug tracking-wide [text-shadow:0_2px_0_rgba(0,0,0,0.9)] ${narrating ? "text-center italic text-sky-100" : "text-white"}`}
        >
          {text}
        </p>
        {done && (
          <motion.span
            aria-hidden="true"
            animate={reduceMotion ? {} : { y: [0, 6, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.9 }}
            className="absolute right-[2.5%] bottom-[8%] text-[2.2cqw] text-amber-300"
          >
            ▼
          </motion.span>
        )}
      </div>
    </div>
  );
}
