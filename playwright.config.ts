import { defineConfig } from "@playwright/test";
const port = process.env.PORTFOLIO_TEST_PORT || "3100";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      process.env.PORTFOLIO_PRODUCTION_TEST === "1"
        ? `npm start -- --hostname 127.0.0.1 --port ${port}`
        : `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://localhost:${port}`,
    timeout: 120000,
    reuseExistingServer: false,
  },
});
