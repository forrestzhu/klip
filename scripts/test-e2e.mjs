import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const hasPlaywrightConfig =
	existsSync("playwright.config.ts") ||
	existsSync("playwright.config.js") ||
	existsSync("playwright.config.mts") ||
	existsSync("playwright.config.mjs");

const hasE2eDir = existsSync("tests/e2e");

if (!hasPlaywrightConfig || !hasE2eDir) {
	console.log("[skip] no Playwright e2e setup found; skipping e2e tests.");
	process.exit(0);
}

const result = spawnSync("npx", ["--no-install", "playwright", "test"], {
	stdio: "inherit",
	shell: process.platform === "win32",
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 1);
