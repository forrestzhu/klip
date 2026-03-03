import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const hasVitestConfig =
	existsSync("vitest.config.ts") ||
	existsSync("vitest.config.js") ||
	existsSync("vitest.config.mts") ||
	existsSync("vitest.config.mjs");

const hasTestsDir = existsSync("tests");

if (!hasVitestConfig && !hasTestsDir) {
	console.log("[skip] no test configuration found; skipping coverage.");
	process.exit(0);
}

const result = spawnSync(
	"npx",
	["--no-install", "vitest", "run", "--coverage", "--passWithNoTests"],
	{
		stdio: "inherit",
		shell: process.platform === "win32",
	},
);

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 1);
