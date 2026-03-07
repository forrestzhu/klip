import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function resolveBuildCommit(): string {
	try {
		const shortCommit = execSync("git rev-parse --short=7 HEAD", {
			stdio: ["ignore", "pipe", "ignore"],
		})
			.toString()
			.trim();

		if (shortCommit.length === 0) {
			return "unknown";
		}

		const dirtyStatus = execSync("git status --porcelain", {
			stdio: ["ignore", "pipe", "ignore"],
		})
			.toString()
			.trim();

		return dirtyStatus.length > 0 ? `${shortCommit}-dirty` : shortCommit;
	} catch {
		return "unknown";
	}
}

export default defineConfig({
	plugins: [react()],
	define: {
		__KLIP_BUILD_COMMIT__: JSON.stringify(resolveBuildCommit()),
	},
});
