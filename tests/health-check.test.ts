/**
 * Health Check Script Tests
 *
 * Tests for the project health check script functionality
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("Project Health Check", () => {
	const healthCheckScript = join(process.cwd(), "scripts", "health-check.sh");

	describe("Script Existence", () => {
		it("should exist in scripts directory", () => {
			expect(existsSync(healthCheckScript)).toBe(true);
		});

		it("should be executable", () => {
			// Check if file has execute permissions
			const stats = require("fs").statSync(healthCheckScript);
			// Check if any execute bit is set
			expect(stats.mode & 0o111).toBeGreaterThan(0);
		});
	});

	describe("Script Execution", () => {
		it("should run without errors", () => {
			expect(() => {
				execSync(`bash ${healthCheckScript}`, {
					stdio: "pipe",
					timeout: 30000,
				});
			}).not.toThrow();
		});

		it("should output expected sections", () => {
			const output = execSync(`bash ${healthCheckScript}`, {
				encoding: "utf-8",
				timeout: 30000,
			});

			// Check for expected output sections
			expect(output).toContain("Klip Project Health Check");
			expect(output).toContain("Checking Node version");
			expect(output).toContain("Checking Rust version");
			expect(output).toContain("Checking dependencies");
			expect(output).toContain("Checking working tree");
			expect(output).toContain("Running lint check");
			expect(output).toContain("Running typecheck");
			expect(output).toContain("Checking tests");
			expect(output).toContain("Health check complete!");
		});
	});

	describe("Environment Checks", () => {
		it("should detect Node.js installation", () => {
			const nodeVersion = execSync("node -v", { encoding: "utf-8" }).trim();
			expect(nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
		});

		it("should detect Rust installation", () => {
			const rustVersion = execSync("rustc --version", {
				encoding: "utf-8",
			}).trim();
			expect(rustVersion).toMatch(/^rustc \d+\.\d+\.\d+/);
		});

		it("should have node_modules directory", () => {
			const nodeModulesPath = join(process.cwd(), "node_modules");
			expect(existsSync(nodeModulesPath)).toBe(true);
		});
	});
});
