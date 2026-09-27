import { NAVY_PANEL } from "./page-shell.tsx";
import { PixelFrame } from "./pixel-frame.tsx";

export type Study = {
  value: string;
  /** Share of the meter to fill, 0 to 1. */
  share: number;
  statement: string;
  source: string;
  href: string;
};

const BLOCKS = 10;

/** One study, one number: a stat tile with a 10-block pixel meter in a single hue. */
export function StudyCard({ value, share, statement, source, href }: Study) {
  const filled = Math.round(share * BLOCKS);
  return (
    <PixelFrame fill={NAVY_PANEL}>
      <figure className="flex h-full flex-col gap-3 p-5">
        <p className="font-display text-6xl leading-none text-amber-200">{value}</p>
        <div className="flex gap-1" role="img" aria-label={`${Math.round(share * 100)} percent`}>
          {Array.from({ length: BLOCKS }, (_, block) => block).map((block) => (
            <span
              key={block}
              className={`h-4 flex-1 ${block < filled ? "bg-amber-400" : "bg-white/12"}`}
            />
          ))}
        </div>
        <figcaption className="flex flex-1 flex-col justify-between gap-3">
          <p className="text-white/90">{statement}</p>
          <a
            href={href}
            className="text-sm text-white/55 underline decoration-dotted hover:text-white/80"
          >
            {source}
          </a>
        </figcaption>
      </figure>
    </PixelFrame>
  );
}
