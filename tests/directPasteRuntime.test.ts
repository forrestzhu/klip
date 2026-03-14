/**
 * Tests for Direct Paste Runtime module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";
import { directPasteText, type DirectPasteMode } from "../src/features/paste/directPasteRuntime";

describe("directPasteRuntime", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("directPasteText", () => {
		it("should paste text directly and return direct mode", async () => {
			const mockResult = { mode: "direct" as DirectPasteMode, message: "Pasted successfully" };
			vi.mocked(invoke).mockResolvedValue(mockResult);

			const result = await directPasteText("Hello, World!");

			expect(result).toEqual(mockResult);
			expect(invoke).toHaveBeenCalledWith("direct_paste_text", { text: "Hello, World!" });
		});

		it("should use clipboard fallback when direct paste is unavailable", async () => {
			const mockResult = { mode: "fallback" as DirectPasteMode, message: "Used clipboard fallback" };
			vi.mocked(invoke).mockResolvedValue(mockResult);

			const result = await directPasteText("Test text");

			expect(result.mode).toBe("fallback");
			expect(result.message).toContain("fallback");
		});

		it("should pass the text parameter to the Tauri command", async () => {
			vi.mocked(invoke).mockResolvedValue({ mode: "direct" as DirectPasteMode, message: "OK" });

			await directPasteText("Sample text");

			expect(invoke).toHaveBeenCalledWith("direct_paste_text", { text: "Sample text" });
		});

		it("should handle empty string", async () => {
			vi.mocked(invoke).mockResolvedValue({ mode: "direct" as DirectPasteMode, message: "OK" });

			await directPasteText("");

			expect(invoke).toHaveBeenCalledWith("direct_paste_text", { text: "" });
		});

		it("should handle multiline text", async () => {
			const multilineText = "Line 1\nLine 2\nLine 3";
			vi.mocked(invoke).mockResolvedValue({ mode: "direct" as DirectPasteMode, message: "OK" });

			await directPasteText(multilineText);

			expect(invoke).toHaveBeenCalledWith("direct_paste_text", { text: multilineText });
		});

		it("should throw error when Tauri command fails", async () => {
			const errorMessage = "Failed to paste";
			vi.mocked(invoke).mockRejectedValue(new Error(errorMessage));

			await expect(directPasteText("Test")).rejects.toThrow(errorMessage);
		});

		it("should return the complete result object", async () => {
			const mockResult = { 
				mode: "direct" as DirectPasteMode, 
				message: "Success" 
			};
			vi.mocked(invoke).mockResolvedValue(mockResult);

			const result = await directPasteText("Test");

			expect(result).toHaveProperty("mode");
			expect(result).toHaveProperty("message");
			expect(result.mode).toBe("direct");
			expect(result.message).toBe("Success");
		});
	});
});
