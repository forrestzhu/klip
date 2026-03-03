import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("tsconfig.json")) {
	console.log("[skip] tsconfig.json not found; skipping typecheck.");
	process.exit(0);
}

const result = spawnSync("npx", ["--no-install", "tsc", "--noEmit"], {
	stdio: "inherit",
	shell: process.platform === "win32",
});

if (result.error) {
	console.error(result.error.message);
	process.exit(1);
}

process.exit(result.status ?? 1);
