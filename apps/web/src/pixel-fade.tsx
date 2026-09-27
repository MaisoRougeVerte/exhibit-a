const BG = "#060a18";
const CELL = 8;

// Ordered-dither bands: each band covers more of the image with pixels, like a 16-bit fade.
const bands = [
  // 25%: one pixel in four
  `conic-gradient(from 90deg at ${CELL}px ${CELL}px, ${BG} 25%, transparent 0) 0 0 / ${CELL * 2}px ${CELL * 2}px`,
  // 50%: checkerboard
  `repeating-conic-gradient(${BG} 0 25%, transparent 0 50%) 0 0 / ${CELL * 2}px ${CELL * 2}px`,
  // 75%: three pixels in four
  `conic-gradient(from 90deg at ${CELL}px ${CELL}px, transparent 25%, ${BG} 0) 0 0 / ${CELL * 2}px ${CELL * 2}px`,
];

/** A stepped, dithered edge that blends a picture into the page background. */
export function PixelFade({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none flex flex-col ${className}`}>
      {bands.map((background) => (
        <div key={background} className="h-6" style={{ background }} />
      ))}
      <div className="h-6" style={{ background: BG }} />
    </div>
  );
}
