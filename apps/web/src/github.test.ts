import { describe, expect, it } from "vitest";
import { memoize } from "./github.ts";

describe("memoize", () => {
  it("returns the same promise while a load succeeds", async () => {
    let calls = 0;
    const load = memoize(() => {
      calls += 1;
      return Promise.resolve({ ok: true, value: calls });
    });
    const first = load("a/b");
    await first;
    expect(load("a/b")).toBe(first);
    expect(calls).toBe(1);
  });

  it("retries a key whose load failed", async () => {
    let calls = 0;
    const load = memoize(() => {
      calls += 1;
      return Promise.resolve(
        calls === 1 ? { ok: false, error: "network error" } : { ok: true, value: calls },
      );
    });
    expect(await load("a/b")).toEqual({ ok: false, error: "network error" });
    expect(await load("a/b")).toEqual({ ok: true, value: 2 });
    expect(calls).toBe(2);
  });

  it("retries a key whose load rejected", async () => {
    let calls = 0;
    const load = memoize(() => {
      calls += 1;
      return calls === 1
        ? Promise.reject(new Error("boom"))
        : Promise.resolve({ ok: true, value: calls });
    });
    await expect(load("a/b")).rejects.toThrow("boom");
    expect(await load("a/b")).toEqual({ ok: true, value: 2 });
  });
});
