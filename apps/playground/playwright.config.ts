/* eslint-disable powerbi-visuals/no-http-string -- Playwright uses a loopback-only test server. */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./tests",
    // A cold Vite transform includes the existing 500KB+ component catalog;
    // keep the end-to-end workflow deterministic on slower CI machines.
    timeout: 120_000,
    fullyParallel: false,
    use: {
        baseURL: "http://127.0.0.1:4180",
        trace: "retain-on-failure",
        screenshot: "only-on-failure"
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        command: "node ../../node_modules/vite/bin/vite.js --config vite.config.mts --host 127.0.0.1 --port 4180",
        url: "http://127.0.0.1:4180/",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
    }
});
