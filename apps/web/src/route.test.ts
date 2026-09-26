import { describe, expect, it } from "vitest";
import { parseRoute, trialHref } from "./route.ts";

describe("parseRoute", () => {
  it.each([
    ["", { page: "home" }],
    ["#/", { page: "home" }],
    ["#/trial/framed-commit", { page: "trial", caseId: "framed-commit" }],
    ["#/report/framed-commit", { page: "report", caseId: "framed-commit" }],
    ["#/trial", { page: "not-found" }],
    ["#/trial/a/b", { page: "not-found" }],
    ["#/elsewhere/x", { page: "not-found" }],
  ])("parses %s", (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });

  it("round-trips the ids it builds", () => {
    expect(parseRoute(trialHref("odd id"))).toEqual({ page: "trial", caseId: "odd id" });
  });
});
