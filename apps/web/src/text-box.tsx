import { motion, useReducedMotion } from "motion/react";
import { CommitText } from "./commit-text.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import type { Speaker } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";

type TextBoxProps = {
  speaker: Speaker;
  text: string;
  done: boolean;
};

const PANEL = "linear-gradient(180deg, rgba(20,32,70,0.96) 0%, rgba(6,10,24,0.96) 100%)";

/** Pixel-console dialogue box: navy panel in a light pixel frame, name tag on top. */
export function TextBox({ speaker, text, done }: TextBoxProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const style = speakerStyles[speaker];
  const narrating = speaker === "narrator";
  return (
    <div className="absolute inset-x-[3%] bottom-[4%] h-[26%] portrait:bottom-[3%] portrait:h-[22%]">
      {!narrating && (
        <PixelFrame
          fill={`linear-gradient(180deg, ${style.nameplate} 0%, #0d1838 100%)`}
          className="absolute -top-[1.45em] left-[2%] z-10 text-vn-name"
        >
          <p className="px-[1.1em] py-[0.1em] font-display leading-tight tracking-wider text-white">
            {style.name}
          </p>
        </PixelFrame>
      )}
      <PixelFrame fill={PANEL} className="h-full">
        <div className="px-[3%] pt-[2.2%] pb-[2%]">
          <p
            aria-live="polite"
            className={`text-vn-body font-medium leading-snug [text-shadow:0_2px_0_rgba(0,0,0,0.9)] ${narrating ? "text-sky-100" : "text-white"}`}
          >
            <CommitText text={text} />
          </p>
        </div>
        {done && (
          <motion.span
            aria-hidden="true"
            animate={reduceMotion ? {} : { y: [0, 5, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.9 }}
            className="absolute right-[2.5%] bottom-[10%] text-vn-body text-slate-100"
          >
            ▼
          </motion.span>
        )}
      </PixelFrame>
    </div>
  );
}
