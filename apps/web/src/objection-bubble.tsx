import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import objectionArt from "./assets/effects/objection.webp";
import type { Effect } from "./scene.ts";

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
          <img
            src={objectionArt}
            alt=""
            className="w-[70%] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)] portrait:w-[95%]"
          />
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
