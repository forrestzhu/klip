import { describe, expect, it } from "vitest";
import { toClipboardPreview } from "../src/utils/toClipboardPreview";

describe("toClipboardPreview", () => {
	it("normalizes line breaks and extra spaces", () => {
		const input = "first line\n  second   line";
		expect(toClipboardPreview(input)).toBe("first line second line");
	});

	it("truncates content with an ellipsis", () => {
		const input = "abcdefghijklmnopqrstuvwxyz";
		expect(toClipboardPreview(input, 10)).toBe("abcdefghi…");
	});
});
