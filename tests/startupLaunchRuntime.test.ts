/**
 * Tests for Startup Launch Runtime module
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import {
	readDesktopStartupLaunchEnabled,
	writeDesktopStartupLaunchEnabled,
} from "../src/features/settings/startupLaunchRuntime";

describe("startupLaunchRuntime", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("readDesktopStartupLaunchEnabled", () => {
		it("should return true when auto-start is enabled", async () => {
			vi.mocked(invoke).mockResolvedValue({ enabled: true });

			const result = await readDesktopStartupLaunchEnabled();

			expect(result).toBe(true);
			expect(invoke).toHaveBeenCalledWith("get_startup_launch_enabled");
		});

		it("should return false when auto-start is disabled", async () => {
			vi.mocked(invoke).mockResolvedValue({ enabled: false });

			const result = await readDesktopStartupLaunchEnabled();

			expect(result).toBe(false);
			expect(invoke).toHaveBeenCalledWith("get_startup_launch_enabled");
		});

		it("should handle numeric enabled value", async () => {
			vi.mocked(invoke).mockResolvedValue({ enabled: 1 as unknown as boolean });

			const result = await readDesktopStartupLaunchEnabled();

			expect(result).toBe(true);
		});

		it("should throw error when invoke fails", async () => {
			vi.mocked(invoke).mockRejectedValue(new Error("Tauri command failed"));

			await expect(readDesktopStartupLaunchEnabled()).rejects.toThrow(
				"Tauri command failed",
			);
		});
	});

	describe("writeDesktopStartupLaunchEnabled", () => {
		it("should enable auto-start when called with true", async () => {
			vi.mocked(invoke).mockResolvedValue({ enabled: true });

			const result = await writeDesktopStartupLaunchEnabled(true);

			expect(result).toBe(true);
			expect(invoke).toHaveBeenCalledWith("set_startup_launch_enabled", {
				enabled: true,
			});
		});

		it("should disable auto-start when called with false", async () => {
			vi.mocked(invoke).mockResolvedValue({ enabled: false });

			const result = await writeDesktopStartupLaunchEnabled(false);

			expect(result).toBe(false);
			expect(invoke).toHaveBeenCalledWith("set_startup_launch_enabled", {
				enabled: false,
			});
		});

		it("should return the new enabled state", async () => {
			vi.mocked(invoke).mockResolvedValue({ enabled: true });

			const result = await writeDesktopStartupLaunchEnabled(true);

			expect(result).toBe(true);
		});

		it("should throw error when invoke fails", async () => {
			vi.mocked(invoke).mockRejectedValue(new Error("Tauri command failed"));

			await expect(writeDesktopStartupLaunchEnabled(true)).rejects.toThrow(
				"Tauri command failed",
			);
		});
	});
});
