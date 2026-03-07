import { describe, expect, it } from "vitest";
import { shouldHidePanelAfterDirectPaste } from "../src/features/paste";

describe("direct paste feedback", () => {
	it("hides the panel after a direct paste succeeds", () => {
		expect(shouldHidePanelAfterDirectPaste("direct")).toBe(true);
	});

	it("keeps the panel open when direct paste falls back", () => {
		expect(shouldHidePanelAfterDirectPaste("fallback")).toBe(false);
	});
});
