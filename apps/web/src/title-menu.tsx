import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PixelFrame } from "./pixel-frame.tsx";

export type MenuItem = { label: string; href: string; hint: string };

/** Game title menu: one panel, a moving cursor, arrow keys and Enter, or the mouse. */
export function TitleMenu({ items }: { items: readonly MenuItem[] }) {
  const [selected, setSelected] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        setSelected((index) => (index + step + items.length) % items.length);
      } else if (event.key === "Enter") {
        const item = items[selected];
        if (item !== undefined) window.location.hash = item.href.replace(/^#/, "");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, selected]);

  const current = items[selected];
  return (
    <div className="flex w-[min(34rem,90%)] flex-col items-center gap-3">
      <PixelFrame
        fill="linear-gradient(180deg, rgba(20,32,70,0.95), rgba(6,10,24,0.95))"
        className="w-full"
      >
        {/* No gaps between rows: the pointer is always over exactly one item, so the cursor never flickers. */}
        <ul className="flex flex-col py-3">
          {items.map((item, index) => (
            <li key={item.href} className="block">
              <a
                href={item.href}
                onPointerMove={() => {
                  if (index !== selected) setSelected(index);
                }}
                onFocus={() => setSelected(index)}
                className={`flex w-full items-center gap-3 px-6 py-2 text-vn-menu leading-none outline-none ${index === selected ? "bg-white/10 text-amber-200" : "text-white/85"}`}
              >
                <span aria-hidden="true" className="w-4 font-display text-amber-300">
                  {index === selected ? ">" : ""}
                </span>
                <span className="font-display tracking-[0.12em] uppercase">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
        {current !== undefined && (
          <p className="border-t-2 border-dashed border-white/20 px-6 py-2 text-vn-small text-white/75">
            {current.hint}
          </p>
        )}
      </PixelFrame>
      <motion.p
        animate={reduceMotion ? {} : { opacity: [1, 0.15, 1] }}
        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4 }}
        className="font-display text-vn-small tracking-[0.3em] text-amber-200 [text-shadow:0_2px_0_#000]"
      >
        PRESS ENTER · ↑↓ TO CHOOSE
      </motion.p>
    </div>
  );
}
