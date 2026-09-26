import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Effect } from "./scene.ts";

const JAGGED =
  "M40 120 L120 60 L110 10 L230 50 L300 0 L360 45 L470 10 L470 70 L590 60 L520 130 L600 190 L490 200 L520 270 L390 220 L330 290 L270 225 L140 280 L160 205 L20 210 L90 160 Z";

type ObjectionBubbleProps = {
  effect: Effect;
  eventIndex: number;
};

/** Full-stage burst: jagged speech bubble for objections, a gavel card for rulings. */
export function ObjectionBubble({ effect, eventIndex }: ObjectionBubbleProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <AnimatePresence>
      {effect === "objection" && (
        <motion.div
          key={`objection-${eventIndex}`}
          aria-hidden="true"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 2.2, rotate: -8 }}
          animate={{ opacity: [0, 1, 1, 0], scale: 1, rotate: -4 }}
          transition={{ duration: 1.2, times: [0, 0.12, 0.8, 1] }}
          className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
        >
          <svg
            viewBox="0 0 620 300"
            aria-hidden="true"
            className="w-[70%] portrait:w-[95%] drop-shadow-[0_10px_0_rgba(0,0,0,0.6)]"
          >
            <path d={JAGGED} fill="#fff" stroke="#111" strokeWidth="10" strokeLinejoin="round" />
            <text
              x="310"
              y="180"
              textAnchor="middle"
              fontSize="92"
              fontStyle="italic"
              fontWeight="900"
              fontFamily="Bangers, Impact, sans-serif"
              fill="#d4141c"
              stroke="#111"
              strokeWidth="6"
              paintOrder="stroke"
            >
              OBJECTION!
            </text>
          </svg>
        </motion.div>
      )}
      {effect === "gavel" && (
        <motion.div
          key={`gavel-${eventIndex}`}
          aria-hidden="true"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 0.9, times: [0, 0.15, 0.75, 1] }}
          className="pointer-events-none absolute top-[8%] right-[4%] z-30 rounded-md border-2 border-amber-300 bg-black/80 px-[1.5em] py-[0.4em] font-display text-vn-body tracking-[0.3em] text-amber-300"
        >
          RULING
        </motion.div>
      )}
    </AnimatePresence>
  );
}
