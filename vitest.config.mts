import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({
  resolve: { alias: { "@hyperpbi": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    pool: "threads",
    maxWorkers: 4,
    // The standalone migration regression launches a fresh Node process. It
    // completes in a few seconds alone but can exceed Vitest's 5s default when
    // the complete browser-heavy suite is sharing the machine.
    testTimeout: 15_000
  }
});
