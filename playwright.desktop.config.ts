import { defineConfig } from "@playwright/test";

/**
 * Playwright Desktop Testing Configuration
 *
 * This configuration is for testing Tauri desktop applications
 * using the hybrid approach: Playwright + Tauri API
 */

export default defineConfig({
	testDir: "./tests/desktop",
	timeout: 60000,
	expect: {
		timeout: 10000,
	},
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Desktop tests should run sequentially
	reporter: [["list"], ["html", { open: "never" }]],
	use: {
		// Desktop tests don't use browser
		// We'll use Tauri API directly
		headless: false,
	},
});
