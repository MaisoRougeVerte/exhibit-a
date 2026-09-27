import type { ReactNode } from "react";
import { CourtroomBackdrop } from "./courtroom-backdrop.tsx";
import { PixelFrame } from "./pixel-frame.tsx";
import type { Position } from "./positions.ts";

export const NAVY_PANEL = "linear-gradient(180deg, rgba(20,32,70,0.96), rgba(6,10,24,0.96))";
export const PARCHMENT = "linear-gradient(180deg, #f6ead0 0%, #e8d4a6 100%)";

type PageShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
  backdrop?: Position;
  actions?: ReactNode;
  children: ReactNode;
};

/** Every non-stage page: dimmed courtroom behind, a pixel title plate, panels below. */
export function PageShell({
  eyebrow,
  title,
  subtitle,
  backdrop = "wide",
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-black text-white">
      <div aria-hidden="true" className="fixed inset-0">
        <CourtroomBackdrop position={backdrop} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95" />
      </div>
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 px-5 py-8">
        <nav className="flex items-center justify-between gap-4 text-sm">
          <a
            href="#/"
            className="rounded border border-white/60 bg-black/60 px-3 py-1 hover:bg-black/80"
          >
            ‹ Menu
          </a>
          <div className="flex gap-3">{actions}</div>
        </nav>
        <PixelFrame fill={NAVY_PANEL}>
          <header className="px-7 py-6">
            <p className="font-display text-lg tracking-[0.3em] text-amber-300">{eyebrow}</p>
            <h1 className="mt-1 font-display text-4xl leading-tight tracking-wide text-amber-50 sm:text-5xl">
              {title}
            </h1>
            {subtitle !== undefined && <div className="mt-2 text-white/75">{subtitle}</div>}
          </header>
        </PixelFrame>
        {children}
      </div>
    </main>
  );
}

type PanelProps = {
  title: string;
  tone?: "navy" | "parchment";
  className?: string;
  children: ReactNode;
};

export function Panel({ title, tone = "navy", className = "", children }: PanelProps) {
  const parchment = tone === "parchment";
  return (
    <PixelFrame
      fill={parchment ? PARCHMENT : NAVY_PANEL}
      frame={parchment ? "#2b1a0e" : "#f1f5f9"}
      gap={parchment ? "#c9a86a" : "#05070f"}
      className={className}
    >
      <section
        className={`px-7 py-6 ${parchment ? "text-[#2b1a0e] [&_button.font-mono]:text-[#8b1d1d]" : "text-white"}`}
      >
        <h2
          className={`mb-3 border-b-2 border-dashed pb-1 font-display text-2xl tracking-wider ${parchment ? "border-[#2b1a0e]/40 text-[#8b1d1d]" : "border-white/25 text-amber-300"}`}
        >
          {title}
        </h2>
        {children}
      </section>
    </PixelFrame>
  );
}
