/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.large.{test,spec}.?(c|m)[jt]s?(x)"],
    reporters: Deno.env.get("CI") ? ["verbose", "github-actions"] : ["verbose"],
    testTimeout: 30000,
    maxConcurrency: 1,
  },
});
