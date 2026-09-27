import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseCaseFile } from "@exhibit-a/schema";
import { expect, it } from "vitest";
import { scoreboard } from "./scoreboard.ts";

it("counts claims, withdrawals and rulings of a trial", async () => {
  const path = join(import.meta.dirname, "../../../cases/fixtures/framed-commit.json");
  const parsed = parseCaseFile(JSON.parse(await readFile(path, "utf8")));
  if (!parsed.ok) throw new Error(parsed.error);
  expect(scoreboard([parsed.value])).toEqual({
    trials: 1,
    claims: 2,
    withdrawn: 1,
    survived: 1,
    evidence: 5,
    rejected: 0,
    objections: 1,
  });
});
