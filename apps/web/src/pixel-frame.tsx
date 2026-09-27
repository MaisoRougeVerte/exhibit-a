import type { ReactNode } from "react";

// Stepped corners, like a pixel-art UI panel, built from two 4px steps per corner.
const STEP = "4px";
const TWO = "8px";
const PIXEL_CORNERS = `polygon(0 ${TWO}, ${STEP} ${TWO}, ${STEP} ${STEP}, ${TWO} ${STEP}, ${TWO} 0, calc(100% - ${TWO}) 0, calc(100% - ${TWO}) ${STEP}, calc(100% - ${STEP}) ${STEP}, calc(100% - ${STEP}) ${TWO}, 100% ${TWO}, 100% calc(100% - ${TWO}), calc(100% - ${STEP}) calc(100% - ${TWO}), calc(100% - ${STEP}) calc(100% - ${STEP}), calc(100% - ${TWO}) calc(100% - ${STEP}), calc(100% - ${TWO}) 100%, ${TWO} 100%, ${TWO} calc(100% - ${STEP}), ${STEP} calc(100% - ${STEP}), ${STEP} calc(100% - ${TWO}), 0 calc(100% - ${TWO}))`;

type PixelFrameProps = {
  fill: string;
  className?: string;
  /** Outer frame and inner gap colors; defaults suit the navy console panels. */
  frame?: string;
  gap?: string;
  children: ReactNode;
};

/**
 * Light outer frame, dark gap, then the panel: three stacked layers clipped to pixel corners.
 * Content sits above the layers, unclipped, so hover cards can overflow the frame.
 */
export function PixelFrame({
  fill,
  className = "",
  frame = "#f1f5f9",
  gap = "#05070f",
  children,
}: PixelFrameProps) {
  return (
    // Callers may position the frame themselves; otherwise it anchors its own layers.
    <div className={/\b(absolute|fixed)\b/.test(className) ? className : `relative ${className}`}>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ clipPath: PIXEL_CORNERS, background: frame }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-[3px]"
        style={{ clipPath: PIXEL_CORNERS, background: gap }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-[5px]"
        style={{ clipPath: PIXEL_CORNERS, background: fill }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}
