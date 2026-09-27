import { motion, useReducedMotion } from "motion/react";
import { CommitText } from "./commit-text.tsx";
import type { Speaker } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";

type TextBoxProps = {
  speaker: Speaker;
  text: string;
  done: boolean;
};

const TAB_SHAPE = "polygon(0 0, calc(100% - 0.9em) 0, 100% 100%, 0 100%)";

/** Pixel-console dialogue box: navy panel, double light frame, name tab with a cut corner. */
export function TextBox({ speaker, text, done }: TextBoxProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const style = speakerStyles[speaker];
  const narrating = speaker === "narrator";
  return (
    <div className="absolute inset-x-[3%] bottom-[4%] h-[26%] portrait:bottom-[3%] portrait:h-[22%]">
      {!narrating && (
        <div
          className="absolute -top-[1.35em] left-[2.5%] z-10 bg-slate-100 p-[3px] pb-0 text-vn-name"
          style={{ clipPath: TAB_SHAPE }}
        >
          <p
            className="py-[0.12em] pr-[1.6em] pl-[0.8em] font-extrabold leading-tight tracking-wide text-white"
            style={{ backgroundColor: style.nameplate, clipPath: TAB_SHAPE }}
          >
            {style.name}
          </p>
        </div>
      )}
      <div className="relative h-full rounded-[4px] border-[3px] border-slate-100 bg-gradient-to-b from-[#16244d]/95 to-[#060a18]/95 px-[3%] py-[2%] shadow-[inset_0_0_0_3px_#0a1130,inset_0_0_0_5px_#5d6fa3,0_0_0_3px_#05070f]">
        <p
          aria-live="polite"
          className={`text-vn-body font-medium leading-snug [text-shadow:0_2px_0_rgba(0,0,0,0.9)] ${narrating ? "text-center italic text-sky-100" : "text-white"}`}
        >
          <CommitText text={text} />
        </p>
        {done && (
          <motion.span
            aria-hidden="true"
            animate={reduceMotion ? {} : { y: [0, 6, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.9 }}
            className="absolute right-[2.5%] bottom-[8%] text-vn-body text-slate-100"
          >
            ▼
          </motion.span>
        )}
      </div>
    </div>
  );
}
