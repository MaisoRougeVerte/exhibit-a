import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const CHARS_PER_TICK = 2;
const TICK_MS = 30;

type Typewriter = {
  shown: string;
  done: boolean;
  finish: () => void;
};

/** Reveals `text` progressively, restarting whenever the text changes. */
export function useTypewriter(text: string): Typewriter {
  const reduceMotion = useReducedMotion() ?? false;
  const [progress, setProgress] = useState({ text, count: 0 });

  // Resetting during render, not in an effect, avoids one frame of the previous line.
  let count = progress.count;
  if (progress.text !== text) {
    count = 0;
    setProgress({ text, count });
  }
  const visible = reduceMotion ? text.length : Math.min(count, text.length);
  const done = visible >= text.length;

  useEffect(() => {
    if (done) return;
    const timer = window.setInterval(() => {
      setProgress((current) => ({ ...current, count: current.count + CHARS_PER_TICK }));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [done]);

  return {
    shown: text.slice(0, visible),
    done,
    finish: () => setProgress({ text, count: text.length }),
  };
}
