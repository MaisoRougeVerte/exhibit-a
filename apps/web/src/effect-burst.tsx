import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Effect } from "./scene.ts";

type EffectBurstProps = {
  effect: Effect;
  eventIndex: number;
};

const labels: Record<Exclude<Effect, "none">, { text: string; className: string }> = {
  objection: { text: "OBJECTION!", className: "text-red-500 -rotate-6 text-5xl sm:text-8xl" },
  gavel: { text: "RULING", className: "text-brass-400 text-4xl sm:text-6xl" },
};

export function EffectBurst({ effect, eventIndex }: EffectBurstProps) {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <AnimatePresence>
      {effect !== "none" && (
        <motion.p
          key={eventIndex}
          aria-hidden="true"
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 2.4 }}
          animate={{ opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: effect === "objection" ? 1.1 : 0.8, times: [0, 0.15, 0.75, 1] }}
          className={`pointer-events-none absolute inset-x-0 top-1/3 text-center font-display font-black tracking-tight drop-shadow-[0_6px_0_rgba(0,0,0,0.8)] ${labels[effect].className}`}
        >
          {labels[effect].text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
