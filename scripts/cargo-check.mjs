import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

if (!existsSync("src-tauri/Cargo.toml")) {
	console.log("[skip] src-tauri/Cargo.toml not found; skipping cargo check.");
	process.exit(0);
}

const result = spawnSync(
	"cargo",
	["check", "--manifest-path", "src-tauri/Cargo.toml", "--locked"],
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
