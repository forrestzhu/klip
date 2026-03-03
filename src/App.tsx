import { toClipboardPreview } from "./utils/toClipboardPreview";

const SAMPLE_ITEMS = [
	"npm run lint && npm run test",
	"https://github.com/forrestzhu/klip/issues/1",
	"Line one\nLine two\nLine three",
];

export function App() {
	return (
		<main className="app-shell">
			<header>
				<h1>Klip</h1>
				<p>Clipboard manager bootstrap is ready.</p>
			</header>
			<section>
				<h2>Sample Preview</h2>
				<ul className="preview-list">
					{SAMPLE_ITEMS.map((item) => (
						<li key={item}>{toClipboardPreview(item, 42)}</li>
					))}
				</ul>
			</section>
		</main>
	);
}
