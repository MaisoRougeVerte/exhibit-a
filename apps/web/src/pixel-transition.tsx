import { motion, useReducedMotion } from "motion/react";

const COLS = 16;
const ROWS = 9;
const CELLS = Array.from({ length: COLS * ROWS }, (_, index) => ({
  index,
  // Diagonal order, like the screen wipes of 16-bit games.
  wave: (index % COLS) + Math.floor(index / COLS),
}));
const MAX_WAVE = COLS + ROWS - 2;

/** Full-screen block wipe played on every page change; keyed by the route so it replays. */
export function PixelTransition() {
  const reduceMotion = useReducedMotion() ?? false;
  if (reduceMotion) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] grid"
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {CELLS.map((cell) => (
        <motion.span
          key={cell.index}
          className="block bg-[#060a18]"
          initial={{ opacity: 1, scale: 1.02 }}
          animate={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.16, delay: (cell.wave / MAX_WAVE) * 0.38, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
