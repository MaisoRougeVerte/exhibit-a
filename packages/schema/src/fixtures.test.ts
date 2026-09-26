import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCaseFile } from "./index.ts";

const fixturesDir = join(import.meta.dirname, "../../../cases/fixtures");

describe("case fixtures", async () => {
  const names = (await readdir(fixturesDir)).filter((name) => name.endsWith(".json"));

  it("exist", () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it.each(names)("%s is a valid case file", async (name) => {
    const json: unknown = JSON.parse(await readFile(join(fixturesDir, name), "utf8"));
    const result = parseCaseFile(json);
    expect(result.ok ? "valid" : result.error).toBe("valid");
  });
});
