import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["{apps,packages}/*/src/**/*.test.{ts,tsx}", "judge/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "demo-repo/**"],
  },
});
