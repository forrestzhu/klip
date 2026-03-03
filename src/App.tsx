import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ClipboardMonitor,
	type ClipboardPort,
	createBrowserClipboardPort,
	createBrowserHistoryStorage,
	type HistoryItem,
	HistoryRepository,
} from "./features/history";
import { toClipboardPreview } from "./utils/toClipboardPreview";

interface HistoryRuntimeContext {
	clipboard: ClipboardPort;
	monitor: ClipboardMonitor;
	repository: HistoryRepository;
}

type ListenerStatus = "starting" | "ready" | "error";

export function App() {
	const [items, setItems] = useState<HistoryItem[]>([]);
	const [maxItems, setMaxItems] = useState(200);
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [listenerStatus, setListenerStatus] =
		useState<ListenerStatus>("starting");
	const [listenerMessage, setListenerMessage] = useState(
		"Starting clipboard listener...",
	);
	const [actionMessage, setActionMessage] = useState<string | null>(null);

	const runtimeRef = useRef<HistoryRuntimeContext | null>(null);

	const filteredItems = useMemo(() => {
		const keyword = query.trim().toLowerCase();
		if (keyword.length === 0) {
			return items;
		}

		return items.filter((item) => item.text.toLowerCase().includes(keyword));
	}, [items, query]);

	useEffect(() => {
		setSelectedIndex((current) => {
			if (filteredItems.length === 0) {
				return 0;
			}

			return Math.min(current, filteredItems.length - 1);
		});
	}, [filteredItems.length]);

	useEffect(() => {
		let disposed = false;

		if (typeof window === "undefined") {
			setListenerStatus("error");
			setListenerMessage("Browser runtime unavailable.");
			return undefined;
		}

		const repository = new HistoryRepository({
			storage: createBrowserHistoryStorage(window.localStorage),
		});
		const clipboard = createBrowserClipboardPort();
		const refresh = () => {
			if (disposed) {
				return;
			}

			setItems(repository.getItems());
			setMaxItems(repository.getMaxItems());
		};

		const monitor = new ClipboardMonitor({
			reader: clipboard,
			onTextCaptured: async (text) => {
				const created = await repository.addCapturedText({ text });
				if (created !== null) {
					refresh();
				}
			},
		});

		runtimeRef.current = {
			clipboard,
			monitor,
			repository,
		};

		const bootstrap = async () => {
			try {
				setListenerStatus("starting");
				setListenerMessage("Starting clipboard listener...");
				await repository.load();
				refresh();
				monitor.start();
				await monitor.whenReady();

				if (disposed) {
					return;
				}

				setListenerStatus("ready");
				setListenerMessage("Clipboard listener is ready.");
			} catch (error) {
				if (disposed) {
					return;
				}

				setListenerStatus("error");
				setListenerMessage(toErrorMessage(error));
			}
		};

		void bootstrap();

		return () => {
			disposed = true;
			monitor.stop();
			runtimeRef.current = null;
		};
	}, []);

	const handleSearchKeyDown = async (
		event: KeyboardEvent<HTMLInputElement>,
	) => {
		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelectedIndex((current) =>
				Math.min(current + 1, Math.max(0, filteredItems.length - 1)),
			);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedIndex((current) => Math.max(current - 1, 0));
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			await copySelectedItem();
		}
	};

	const handleChangeMaxItems = async (event: ChangeEvent<HTMLInputElement>) => {
		const value = Number(event.currentTarget.value);
		if (!Number.isFinite(value)) {
			return;
		}

		const runtime = runtimeRef.current;
		if (!runtime) {
			return;
		}

		const applied = await runtime.repository.setMaxItems(value);
		setMaxItems(applied);
		setItems(runtime.repository.getItems());
		setActionMessage(`History limit updated to ${applied}.`);
	};

	const copySelectedItem = async () => {
		const selectedItem = filteredItems[selectedIndex];
		if (!selectedItem) {
			return;
		}

		const runtime = runtimeRef.current;
		if (!runtime) {
			setActionMessage("Runtime is not ready.");
			return;
		}

		try {
			runtime.monitor.suppressText(selectedItem.text);
			await runtime.clipboard.writeText(selectedItem.text);
			setActionMessage("Copied selected history text to clipboard.");
		} catch (error) {
			setActionMessage(`Copy failed: ${toErrorMessage(error)}`);
		}
	};

	return (
		<main className="app-shell">
			<header className="topbar">
				<div>
					<h1>Klip</h1>
					<p className="status-line">
						Status:{" "}
						<span className={`status-pill status-${listenerStatus}`}>
							{listenerStatus}
						</span>{" "}
						{listenerMessage}
					</p>
				</div>
				<label className="max-items-field">
					Max history
					<input
						aria-label="Max history items"
						min={10}
						max={5000}
						type="number"
						value={maxItems}
						onChange={(event) => {
							void handleChangeMaxItems(event);
						}}
					/>
				</label>
			</header>

			<section className="panel">
				<div className="panel-title-row">
					<h2>History</h2>
					<button
						className="ghost-button"
						type="button"
						onClick={() => {
							void copySelectedItem();
						}}
					>
						Copy Selected
					</button>
				</div>

				<label className="search-field" htmlFor="history-search">
					Search
				</label>
				<input
					id="history-search"
					autoComplete="off"
					className="search-input"
					placeholder="Type to filter history..."
					type="text"
					value={query}
					onChange={(event) => {
						setQuery(event.currentTarget.value);
						setSelectedIndex(0);
					}}
					onKeyDown={(event) => {
						void handleSearchKeyDown(event);
					}}
				/>

				<ul className="history-list">
					{filteredItems.length === 0 ? (
						<li className="empty-row">No history items yet.</li>
					) : (
						filteredItems.map((item, index) => (
							<li key={item.id}>
								<button
									className={`history-item ${
										index === selectedIndex ? "selected" : ""
									}`}
									type="button"
									onClick={() => {
										setSelectedIndex(index);
										void copySelectedItem();
									}}
								>
									<div className="history-main">
										{toClipboardPreview(item.text, 96)}
									</div>
									<div className="history-meta">
										{new Date(item.createdAt).toLocaleString()}
									</div>
								</button>
							</li>
						))
					)}
				</ul>
				{actionMessage ? (
					<p className="action-message">{actionMessage}</p>
				) : null}
			</section>
		</main>
	);
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}

	return "Unexpected runtime error.";
}
