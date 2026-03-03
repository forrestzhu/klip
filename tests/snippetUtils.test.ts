import { describe, expect, it, vi } from "vitest";
import {
	createSnippetId,
	deriveSnippetTitle,
	isNonEmptyText,
	normalizeFolderName,
	normalizeSnippetText,
	normalizeSnippetTitle,
} from "../src/features/snippets";

describe("snippetUtils", () => {
	it("validates non-empty snippet text", () => {
		expect(isNonEmptyText("hello")).toBe(true);
		expect(isNonEmptyText("  ")).toBe(false);
		expect(isNonEmptyText(null)).toBe(false);
	});

	it("normalizes folder name and uses default fallback", () => {
		expect(normalizeFolderName("  Team  ")).toBe("Team");
		expect(normalizeFolderName(" ")).toBe("General");
	});

	it("normalizes snippet title with fallback text", () => {
		expect(normalizeSnippetTitle("  Greeting  ")).toBe("Greeting");
		expect(normalizeSnippetTitle(" ", "hello world\nfrom klip")).toBe(
			"hello world from klip",
		);
		expect(normalizeSnippetTitle(undefined, "   ")).toBe("Untitled Snippet");
	});

	it("keeps original snippet text when capturable", () => {
		expect(normalizeSnippetText("  keep me  ")).toBe("  keep me  ");
		expect(normalizeSnippetText("   ")).toBeNull();
	});

	it("derives a bounded title from long text", () => {
		const longText = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const title = deriveSnippetTitle(longText);
		expect(title.length).toBeLessThanOrEqual(48);
		expect(title.endsWith("…")).toBe(true);
	});

	it("derives untitled when text is empty and rejects non-string text payload", () => {
		expect(deriveSnippetTitle("   \n\t")).toBe("Untitled Snippet");
		expect(normalizeSnippetText(undefined)).toBeNull();
	});

	it("uses randomUUID when available", () => {
		const randomUUID = vi.fn(() => "uuid-1");
		const originalCrypto = globalThis.crypto;

		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: { randomUUID },
		});

		expect(createSnippetId()).toBe("uuid-1");
		expect(randomUUID).toHaveBeenCalledTimes(1);

		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: originalCrypto,
		});
	});

	it("falls back to synthetic id when randomUUID is unavailable", () => {
		const originalCrypto = globalThis.crypto;
		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: {},
		});

		const id = createSnippetId();
		expect(id.startsWith("snpt-")).toBe(true);

		Object.defineProperty(globalThis, "crypto", {
			configurable: true,
			value: originalCrypto,
		});
	});
});
