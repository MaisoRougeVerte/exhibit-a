import { homedir } from "node:os";
import { describe, expect, it } from "vitest";
import { classifyFromOutput, classifyVitestReport, redactPaths } from "./run-test.ts";

function suite(
  status: string,
  tests: Array<{ status: string; failure?: string }>,
  message?: string,
) {
  return {
    status,
    ...(message === undefined ? {} : { message }),
    assertionResults: tests.map((test, index) => ({
      fullName: `test ${index}`,
      status: test.status,
      failureMessages: test.failure === undefined ? [] : [test.failure],
    })),
  };
}

describe("classifyVitestReport", () => {
  it("calls a file that fails to load an error, never a failing test", () => {
    const report = { testResults: [suite("failed", [], "Cannot find module '../src/nope.ts'")] };
    expect(classifyVitestReport(report, "")).toMatchObject({ status: "error" });
  });

  it("calls a test name that matches nothing an error, never a pass", () => {
    const report = { testResults: [suite("passed", [{ status: "skipped" }])] };
    expect(classifyVitestReport(report, "")).toMatchObject({ status: "error" });
  });

  it("reports a failing assertion with its message", () => {
    const report = {
      testResults: [
        suite("failed", [{ status: "failed", failure: "AssertionError: expected 230 to be 229" }]),
      ],
    };
    const verdict = classifyVitestReport(report, "");
    expect(verdict.status).toBe("fail");
    expect(verdict.output).toContain("expected 230 to be 229");
  });

  it("passes only when a test actually ran and passed", () => {
    const report = { testResults: [suite("passed", [{ status: "passed" }])] };
    expect(classifyVitestReport(report, "")).toMatchObject({ status: "pass" });
  });

  it("treats a missing report as an error", () => {
    expect(classifyVitestReport(undefined, "boom")).toMatchObject({ status: "error" });
  });
});

describe("classifyFromOutput", () => {
  it("checks load errors before assertion words", () => {
    const run = { exitCode: 1, combined: "SyntaxError: Unexpected token, expected ',' to follow" };
    expect(classifyFromOutput(run)).toMatchObject({ status: "error" });
  });

  it("recognizes an assertion failure", () => {
    const run = { exitCode: 1, combined: "AssertionError: expected -1 to be greater than 0" };
    expect(classifyFromOutput(run)).toMatchObject({ status: "fail" });
  });

  it("treats a timeout as an error", () => {
    expect(classifyFromOutput({ exitCode: null, combined: "" })).toMatchObject({ status: "error" });
  });
});

describe("redactPaths", () => {
  it("hides the checkout path and the home directory", () => {
    const text = `at /tmp/exhibit-a-wt-x/wt/src/a.ts and ${homedir()}/code/b.ts`;
    expect(redactPaths(text, "/tmp/exhibit-a-wt-x/wt")).toBe("at <repo>/src/a.ts and ~/code/b.ts");
  });
});
