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

describe("parseRoute, service pages", () => {
  it.each([
    ["#/dashboard", { page: "dashboard" }],
    ["#/try", { page: "try" }],
    ["#/accuse/framed-commit", { page: "accuse", caseId: "framed-commit" }],
    [
      "#/r/acme/shop/framed-commit.json",
      { page: "remote-trial", owner: "acme", repo: "shop", file: "framed-commit.json" },
    ],
    ["#/r/acme/shop", { page: "not-found" }],
    ["#/dashboard/extra", { page: "not-found" }],
  ])("parses %s", (hash, route) => {
    expect(parseRoute(hash)).toEqual(route);
  });
});
