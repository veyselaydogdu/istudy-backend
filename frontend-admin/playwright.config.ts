import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "./tests/e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: 1,
    reporter: [
        ["list"],
        ["json", { outputFile: "tests/results/playwright-report.json" }],
    ],
    use: {
        baseURL: "http://localhost:3001",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "off",
        actionTimeout: 10000,
        navigationTimeout: 15000,
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    // Not: Next.js dev server başlatılmaz — Docker üzerinden test edilir
})
