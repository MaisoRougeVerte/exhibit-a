import { describe, expect, it, vi } from "vitest";

vi.mock("virtual:local-art", () => ({ localArtFiles: [] }));

import { bustFrames, spriteFor } from "./art.ts";

describe("corrected courtroom sprites", () => {
  it("keeps the investigator's five emotional poses distinct", () => {
    const expressions = ["neutral", "confident", "thinking", "sweating", "defeated"] as const;
    const urls = expressions.map((expression) => {
      const frames = bustFrames("investigator", expression);
      expect(frames).toBeDefined();
      expect(spriteFor("investigator", expression, false)?.url).toBe(frames?.idle);
      return frames?.idle;
    });
    expect(new Set(urls).size).toBe(expressions.length);
  });

  it("uses matching speaking frames for neutral and confident dialogue", () => {
    for (const expression of ["neutral", "confident"] as const) {
      const frames = bustFrames("investigator", expression);
      expect(frames?.talk).toBeDefined();
      expect(frames?.talk).not.toBe(frames?.idle);
      expect(spriteFor("investigator", expression, true)?.url).toBe(frames?.talk);
    }
  });

  it("preserves the judge's distinct calm and raised-gavel poses", () => {
    expect(bustFrames("judge", "angry")?.idle).not.toBe(bustFrames("judge", "neutral")?.idle);
  });

  it("gives the judge distinct thinking and final-verdict poses", () => {
    const expressions = ["neutral", "angry", "thinking", "confident"] as const;
    const urls = expressions.map((expression) => bustFrames("judge", expression)?.idle);
    expect(urls.every((url) => url !== undefined)).toBe(true);
    expect(new Set(urls).size).toBe(expressions.length);
  });
});
