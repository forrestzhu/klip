import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const hasSource = existsSync("src");
if (!hasSource) {
	console.log("[skip] src/ not found; skipping build.");
	process.exit(0);
}

const hasViteConfig =
	existsSync("vite.config.ts") ||
	existsSync("vite.config.js") ||
	existsSync("vite.config.mts") ||
	existsSync("vite.config.mjs");

if (!hasViteConfig) {
	console.error("[error] src/ exists but Vite config is missing.");
	process.exit(1);
}

const result = spawnSync("npx", ["--no-install", "vite", "build"], {
	stdio: "inherit",
	shell: process.platform === "win32",
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 1);
