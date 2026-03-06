import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function extractAtRuleBlock(source: string, atRule: string): string {
	const startIndex = source.indexOf(atRule);
	if (startIndex < 0) {
		return "";
	}

	const openBraceIndex = source.indexOf("{", startIndex);
	if (openBraceIndex < 0) {
		return "";
	}

	let depth = 0;
	for (let index = openBraceIndex; index < source.length; index += 1) {
		const char = source[index];
		if (char === "{") {
			depth += 1;
			continue;
		}
		if (char === "}") {
			depth -= 1;
			if (depth === 0) {
				return source.slice(openBraceIndex + 1, index);
			}
		}
	}

	return "";
}

describe("popup responsive scope", () => {
	it("does not allow popup selectors inside max-width mobile rules", () => {
		const stylesPath = resolve(process.cwd(), "src/styles.css");
		const source = readFileSync(stylesPath, "utf8");
		const mediaBlock = extractAtRuleBlock(source, "@media (max-width: 760px)");

		expect(mediaBlock.length).toBeGreaterThan(0);
		expect(mediaBlock).not.toMatch(/\.popup-/);
	});

	it("keeps clipy responsive rules scoped to inline expanded shell", () => {
		const stylesPath = resolve(process.cwd(), "src/styles.css");
		const source = readFileSync(stylesPath, "utf8");
		const mediaBlock = extractAtRuleBlock(source, "@media (max-width: 760px)");
		const selectorMatches = [...mediaBlock.matchAll(/([^{}]+)\{/g)];

		expect(selectorMatches.length).toBeGreaterThan(0);

		for (const match of selectorMatches) {
			const selectorGroup = match[1].trim();
			if (selectorGroup.startsWith("@")) {
				continue;
			}

			const selectors = selectorGroup
				.split(",")
				.map((selector) => selector.trim())
				.filter((selector) => selector.length > 0);

			for (const selector of selectors) {
				if (!selector.includes(".clipy-")) {
					continue;
				}
				if (selector === ".app-shell:not(.clipy-management-shell)") {
					continue;
				}

				expect(selector.startsWith(".app-shell-expanded ")).toBe(true);
			}
		}
	});
});
