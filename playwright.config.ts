/* eslint-disable powerbi-visuals/no-http-string -- Playwright uses a loopback-only test server. */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:4179",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4179",
    url: "http://127.0.0.1:4179/tests/browser/studio-authoring.html",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
