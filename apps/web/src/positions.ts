import type { Speaker } from "./scene.ts";

export type Position = "defense" | "prosecution" | "bench" | "gallery" | "wide";

/** Where the camera looks for each speaker, like the fixed shots of a courtroom game. */
export const positionOf: Record<Speaker, Position> = {
  investigator: "defense",
  prosecutor: "prosecution",
  judge: "bench",
  developer: "gallery",
  narrator: "wide",
};
