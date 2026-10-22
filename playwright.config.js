// Playwright tests for the prototype. Run them with: npx playwright test
// They start their own copy of the prototype on port 8767, so they don't touch the shared screen.
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "tests",
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:8767/", ...devices["Desktop Chrome"] },
  webServer: {
    command: "node tests/serve.js 8767",
    url: "http://127.0.0.1:8767/",
    reuseExistingServer: true,
    stdout: "ignore",
    stderr: "ignore"
  }
});
