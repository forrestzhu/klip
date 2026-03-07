import { describe, expect, it } from "vitest";

import {
	formatBuildCommitLabel,
	normalizeBuildCommitValue,
} from "../src/features/build/buildInfo";

describe("buildInfo", () => {
	it("formats a normal short commit label", () => {
		expect(formatBuildCommitLabel("2799b1d")).toBe("Commit: 2799b1d");
	});

	it("preserves dirty suffixes", () => {
		expect(formatBuildCommitLabel("2799b1d-dirty")).toBe(
			"Commit: 2799b1d-dirty",
		);
	});

	it("falls back to unknown for empty values", () => {
		expect(normalizeBuildCommitValue("")).toBe("unknown");
		expect(normalizeBuildCommitValue("   ")).toBe("unknown");
		expect(formatBuildCommitLabel("")).toBe("Commit: unknown");
	});
});
