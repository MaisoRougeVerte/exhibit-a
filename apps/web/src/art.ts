import { localArtFiles } from "virtual:local-art";
import type { Expression } from "@exhibit-a/schema";
import type { Position } from "./positions.ts";
import type { Speaker } from "./scene.ts";

// Shipped art: bust sprites and backgrounds dropped into src/assets/.
const shippedSprites = import.meta.glob<string>("./assets/characters/*/*.png", {
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

function pick(table: Record<string, string>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const url = table[key];
    if (url !== undefined) return url;
  }
  return undefined;
}

/** Full-frame sprites share the background's frame; bust sprites stand behind the desk. */
export function spriteFor(
  speaker: Speaker,
  expression: Expression,
  talking: boolean,
): Sprite | undefined {
  const variants = talking ? ["talk", "idle"] : ["idle"];
  const names = [...variants.map((v) => `${expression}-${v}`), "neutral-idle"];
  const local = names
    .map((n) => `characters/${speaker}/${n}.gif`)
    .find((path) => localArt.has(path));
  if (local !== undefined) return { url: `/${local}`, fullFrame: true };
  const shipped = pick(
    shippedSprites,
    names.map((n) => `./assets/characters/${speaker}/${n}.png`),
  );
  return shipped === undefined ? undefined : { url: shipped, fullFrame: false };
}

export function backgroundFor(position: Position): string | undefined {
  return (
    (localArt.has(`backgrounds/${position}.png`) ? `/backgrounds/${position}.png` : undefined) ??
    pick(
      shippedBackgrounds,
      ["png", "jpg", "webp"].map((ext) => `./assets/backgrounds/${position}.${ext}`),
    )
  );
}
