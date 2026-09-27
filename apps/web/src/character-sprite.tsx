import type { Expression } from "@exhibit-a/schema";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { bustFrames, spriteFor } from "./art.ts";
import type { Speaker } from "./scene.ts";
import { speakerStyles } from "./speakers.ts";

type CharacterSpriteProps = {
  speaker: Exclude<Speaker, "narrator">;
  expression: Expression;
  talking: boolean;
};

const FLAP_MS = 130;

/** Alternates between two frames while `active`, like a mouth flap. */
function useFlap(active: boolean): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setOpen((current) => !current), FLAP_MS);
    return () => window.clearInterval(timer);
  }, [active]);
  return active && open;
}

export function CharacterSprite({ speaker, expression, talking }: CharacterSpriteProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const style = speakerStyles[speaker];
  const sprite = spriteFor(speaker, expression, talking);
  const frames = bustFrames(speaker, expression);
  const mouthOpen = useFlap(talking && frames?.talk !== undefined);
  if (sprite?.fullFrame === true) {
    return (
      <img
        src={sprite.url}
        alt={`${style.name}, ${expression}`}
        className="absolute inset-0 size-full object-cover [image-rendering:pixelated]"
      />
    );
  }
  return (
    <motion.div
      key={speaker}
      initial={reduceMotion ? false : { opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      className="absolute inset-x-0 bottom-[30%] mx-auto flex h-[62%] justify-center portrait:bottom-[32%] portrait:h-[46%]"
    >
      {sprite === undefined ? (
        <svg
          viewBox="0 0 400 520"
          className="h-full drop-shadow-[0_12px_18px_rgba(0,0,0,0.5)]"
          role="img"
          aria-label={`${style.name}, ${expression}`}
        >
          <path d="M200 40 a92 100 0 1 1 -0.1 0 z" fill={style.silhouette} />
          <path
            d="M40 520 C40 330 110 250 200 250 C290 250 360 330 360 520 z"
            fill={style.silhouette}
          />
          <path d="M165 250 L200 330 L235 250 z" fill={style.accent} />
          <text
            x="200"
            y="175"
            textAnchor="middle"
            fontSize="92"
            fontFamily="Jersey 10, sans-serif"
            fill="rgba(255,255,255,0.85)"
          >
            {style.initial}
          </text>
        </svg>
      ) : (
        <img
          src={mouthOpen && frames?.talk !== undefined ? frames.talk : (frames?.idle ?? sprite.url)}
          alt={`${style.name}, ${expression}`}
          className="h-full object-contain object-bottom"
        />
      )}
    </motion.div>
  );
}
