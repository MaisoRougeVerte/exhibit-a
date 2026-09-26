import { backgroundFor } from "./art.ts";
import type { Position } from "./positions.ts";

type Palette = { wall: string; wallDark: string; trim: string; light: string };

const palettes: Record<Position, Palette> = {
  defense: { wall: "#6b4a2b", wallDark: "#4a321c", trim: "#c29a45", light: "#f3d9a4" },
  prosecution: { wall: "#5e3b2a", wallDark: "#3f2519", trim: "#c29a45", light: "#f0c9a0" },
  bench: { wall: "#72502c", wallDark: "#4d341b", trim: "#d9b25f", light: "#fae3b0" },
  gallery: { wall: "#4f3a2a", wallDark: "#34261a", trim: "#a8864a", light: "#e8d2a8" },
  wide: { wall: "#5d4128", wallDark: "#3b2817", trim: "#c29a45", light: "#f3d9a4" },
};

const WALL_PANEL_X = [40, 235, 430, 625, 820, 1015, 1210, 1405];
const DESK_PANEL_X = [70, 330, 590, 850, 1110, 1370];

/** Drawn placeholder set: wood panels, pillars and a warm window, until illustrated backgrounds exist. */
export function CourtroomBackdrop({ position }: { position: Position }) {
  const image = backgroundFor(position);
  if (image !== undefined) {
    // Dev-only test art is low-resolution pixel art; shipped art is smooth.
    const pixelArt = image.startsWith("/backgrounds/");
    return (
      <img
        src={image}
        alt=""
        className={`absolute inset-0 size-full object-cover ${pixelArt ? "[image-rendering:pixelated]" : ""}`}
      />
    );
  }
  const p = palettes[position];
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`wall-${position}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.wallDark} />
          <stop offset="0.55" stopColor={p.wall} />
          <stop offset="1" stopColor={p.wallDark} />
        </linearGradient>
        <radialGradient id={`glow-${position}`} cx="0.5" cy="0.25" r="0.6">
          <stop offset="0" stopColor={p.light} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.light} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#wall-${position})`} />
      {WALL_PANEL_X.map((x) => (
        <g key={x}>
          <rect x={x} y={140} width={170} height={520} rx={6} fill={p.wallDark} opacity={0.55} />
          <rect
            x={x + 12}
            y={152}
            width={146}
            height={496}
            rx={4}
            fill="none"
            stroke={p.trim}
            strokeOpacity={0.35}
            strokeWidth={3}
          />
        </g>
      ))}
      <rect x="0" y="110" width="1600" height="22" fill={p.trim} opacity={0.7} />
      <rect x="0" y="660" width="1600" height="16" fill={p.trim} opacity={0.5} />
      {position === "bench" && (
        <g
          transform="translate(800 260)"
          stroke={p.trim}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        >
          <circle r="92" fill={p.wallDark} strokeOpacity="0.8" />
          <line x1="-60" y1="-30" x2="60" y2="-30" />
          <line x1="0" y1="-60" x2="0" y2="55" />
          <path d="M-60 -30 l-25 50 h50 z M60 -30 l-25 50 h50 z" />
        </g>
      )}
      <rect width="1600" height="900" fill={`url(#glow-${position})`} />
    </svg>
  );
}

/** Foreground desk the character stands behind: the signature courtroom framing. */
export function CourtroomDesk({ position }: { position: Position }) {
  // Illustrated backgrounds carry their own desk.
  if (position === "wide" || backgroundFor(position) !== undefined) return null;
  const p = palettes[position];
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    >
      <rect x="0" y="575" width="1600" height="325" fill={p.wallDark} />
      <rect x="0" y="560" width="1600" height="28" fill={p.trim} />
      <rect x="0" y="588" width="1600" height="12" fill="#000" opacity="0.35" />
      {DESK_PANEL_X.map((x) => (
        <rect
          key={x}
          x={x}
          y={615}
          width={220}
          height={110}
          rx={6}
          fill="none"
          stroke={p.trim}
          strokeOpacity="0.4"
          strokeWidth="4"
        />
      ))}
    </svg>
  );
}
