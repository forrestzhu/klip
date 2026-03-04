import { readFileSync } from "node:fs";

const COMMIT_MESSAGE_PATH = process.argv[2];

if (!COMMIT_MESSAGE_PATH) {
	console.error("Commit message path is required.");
	process.exit(1);
}

const requiredHeadings = [
	"### What changes were proposed in this CL?",
	"### Why are the changes needed?",
	"### How was this CL tested?",
];

const rawMessage = readFileSync(COMMIT_MESSAGE_PATH, "utf8").replaceAll(
	"\r\n",
	"\n",
);
const visibleLines = rawMessage
	.split("\n")
	.map((line) => line.trimEnd())
	.filter((line) => {
		const trimmed = line.trimStart();
		return !(trimmed.startsWith("#") && !trimmed.startsWith("### "));
	});

const headerLineIndex = visibleLines.findIndex(
	(line) => line.trim().length > 0,
);
if (headerLineIndex === -1) {
	process.exit(0);
}

const headerLine = visibleLines[headerLineIndex].trim();
if (headerLine.startsWith("Merge ") || headerLine.startsWith("Revert ")) {
	process.exit(0);
}

const headingIndexes = requiredHeadings.map((heading) =>
	visibleLines.findIndex(
		(line, index) => index > headerLineIndex && line.trim() === heading,
	),
);

if (headingIndexes.some((index) => index === -1)) {
	failValidation(requiredHeadings);
}

for (let i = 1; i < headingIndexes.length; i += 1) {
	if (headingIndexes[i] <= headingIndexes[i - 1]) {
		failValidation(requiredHeadings);
	}
}

for (let i = 0; i < headingIndexes.length; i += 1) {
	const currentHeadingIndex = headingIndexes[i];
	const nextHeadingIndex =
		i + 1 < headingIndexes.length ? headingIndexes[i + 1] : visibleLines.length;
	const sectionContent = visibleLines
		.slice(currentHeadingIndex + 1, nextHeadingIndex)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (sectionContent.length === 0) {
		failValidation(requiredHeadings);
	}
}

function failValidation(headings) {
	console.error(
		[
			"Commit message must include the required body template sections with non-empty content:",
			"",
			"feat|fix|docs|style|refactor|perf|test|chore|ci: short summary",
			"",
			...headings.map((heading) => `${heading}\n- ...`),
		].join("\n"),
	);
	process.exit(1);
}
