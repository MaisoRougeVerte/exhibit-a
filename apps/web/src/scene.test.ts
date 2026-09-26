import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type CaseFile, parseCaseFile } from "@exhibit-a/schema";
import { beforeAll, describe, expect, it } from "vitest";
import { courtRecord, toScene } from "./scene.ts";

let sample: CaseFile;

beforeAll(async () => {
  const path = join(import.meta.dirname, "../../../cases/fixtures/framed-commit.json");
  const result = parseCaseFile(JSON.parse(await readFile(path, "utf8")));
  if (!result.ok) throw new Error(result.error);
  sample = result.value;
});

function sceneAt(index: number) {
  const event = sample.events[index];
  if (event === undefined) throw new Error(`no event at ${index}`);
  return toScene(event, sample);
}

describe("toScene", () => {
  it("gives the narrator the opening line", () => {
    expect(sceneAt(0)).toMatchObject({ speaker: "narrator", effect: "none" });
  });

  it("plays the objection effect when the prosecutor objects", () => {
    expect(sceneAt(4)).toMatchObject({ speaker: "prosecutor", effect: "objection" });
  });

  it("lets the judge announce a ruling in plain words", () => {
    expect(sceneAt(2)).toMatchObject({ speaker: "judge", effect: "gavel" });
    expect(sceneAt(2).line).toContain("Exhibit ev-1 is upheld");
    expect(sceneAt(2).line).toContain('"never oversells the last baguette" fails today');
  });
});

describe("courtRecord", () => {
  it("lists evidence as pending until the judge rules", () => {
    const record = courtRecord(sample, 1);
    expect(record.map((entry) => [entry.evidence.id, entry.status])).toEqual([
      ["ev-1", "pending"],
      ["ev-2", "pending"],
    ]);
  });

  it("records the ruling and its excerpt once given", () => {
    const record = courtRecord(sample, 2);
    expect(record[0]).toMatchObject({ status: "upheld", excerpt: expect.stringContaining("-1") });
  });
});
