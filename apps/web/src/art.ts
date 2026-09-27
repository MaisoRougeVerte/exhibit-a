import { localArtFiles } from "virtual:local-art";
import type { Expression } from "@exhibit-a/schema";
import investigatorRedrawn from "./assets/characters/investigator/redrawn-idle.png";
import judgeCorrected from "./assets/characters/judge/angry-corrected.png";
import type { Position } from "./positions.ts";
import type { Speaker } from "./scene.ts";

// Shipped art: bust sprites and backgrounds dropped into src/assets/.
const shippedSprites = import.meta.glob<string>("./assets/characters/*/*.{png,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});
const shippedBackgrounds = import.meta.glob<string>("./assets/backgrounds/*.{png,jpg,webp}", {
  eager: true,
  import: "default",
  query: "?url",
});

// Local test art in apps/web/local-art/ is never committed and only exists on the dev server.
const localArt = new Set(localArtFiles);

export type Sprite = { url: string; fullFrame: boolean };

/** Idle frame plus an optional mouth-open frame, for lip flap while a line is typed. */
type SpriteFrames = { idle: string; talk: string | undefined };

/** Frames of shipped bust sprites for one expression, falling back to the neutral pose. */
export function bustFrames(speaker: Speaker, expression: Expression): SpriteFrames | undefined {
  if (speaker === "judge" && expression === "angry")
    return { idle: judgeCorrected, talk: undefined };
  const url = (name: string) => {
    // Keep each pose and its speaking frame in the corrected character set.
    if (speaker === "investigator")
      return name === "neutral-idle"
        ? investigatorRedrawn
        : shippedSprites[`./assets/characters/investigator/corrected-${name}.png`];
    return (
      shippedSprites[`./assets/characters/${speaker}/${name}.webp`] ??
      shippedSprites[`./assets/characters/${speaker}/${name}.png`]
    );
  };
  const idle = url(`${expression}-idle`);
  if (idle !== undefined) return { idle, talk: url(`${expression}-talk`) };
  const neutral = url("neutral-idle");
  return neutral === undefined ? undefined : { idle: neutral, talk: url("neutral-talk") };
}

function pick(table: Record<string, string>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const url = table[key];
    if (url !== undefined) return url;
  }
  return undefined;
}

/** Shipped bust sprites win; the dev-only full-frame test art is a fallback. */
export function spriteFor(
  speaker: Speaker,
  expression: Expression,
  talking: boolean,
): Sprite | undefined {
  const frames = bustFrames(speaker, expression);
  if (frames !== undefined)
    return { url: talking ? (frames.talk ?? frames.idle) : frames.idle, fullFrame: false };
  const variants = talking ? ["talk", "idle"] : ["idle"];
  const names = [...variants.map((v) => `${expression}-${v}`), "neutral-idle"];
  const local = names
    .map((n) => `characters/${speaker}/${n}.gif`)
    .find((path) => localArt.has(path));
  return local === undefined ? undefined : { url: `/${local}`, fullFrame: true };
}

export function backgroundFor(position: Position): string | undefined {
  return (
    pick(
      shippedBackgrounds,
      ["webp", "png", "jpg"].map((ext) => `./assets/backgrounds/${position}.${ext}`),
    ) ?? (localArt.has(`backgrounds/${position}.png`) ? `/backgrounds/${position}.png` : undefined)
  );
}
