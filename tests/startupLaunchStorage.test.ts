import { describe, expect, it } from "vitest";
import {
	DEFAULT_STARTUP_LAUNCH_ENABLED,
	readStartupLaunchEnabled,
	writeStartupLaunchEnabled,
} from "../src/features/settings";

describe("startup launch storage", () => {
	it("returns default when storage has no value", () => {
		const storage = createStorage();
		expect(readStartupLaunchEnabled(storage)).toBe(
			DEFAULT_STARTUP_LAUNCH_ENABLED,
		);
	});

	it("persists enabled value", () => {
		const storage = createStorage();
		const persisted = writeStartupLaunchEnabled(storage, true);

		expect(persisted).toBe(true);
		expect(readStartupLaunchEnabled(storage)).toBe(true);
	});

	it("persists disabled value", () => {
		const storage = createStorage();
		const persisted = writeStartupLaunchEnabled(storage, false);

		expect(persisted).toBe(false);
		expect(readStartupLaunchEnabled(storage)).toBe(false);
	});

	it("normalizes legacy truthy string values", () => {
		const storage = createStorage();
		storage.setItem("klip.settings.startupLaunchEnabled", "true");

		expect(readStartupLaunchEnabled(storage)).toBe(true);
		expect(storage.getItem("klip.settings.startupLaunchEnabled")).toBe(
			"enabled",
		);
	});

	it("falls back to disabled for unknown values", () => {
		const storage = createStorage();
		const persisted = writeStartupLaunchEnabled(storage, "invalid");

		expect(persisted).toBe(false);
		expect(readStartupLaunchEnabled(storage)).toBe(false);
	});
});

function createStorage(): Storage {
	const map = new Map<string, string>();

	return {
		getItem(key: string) {
			return map.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			map.set(key, value);
		},
		removeItem(key: string) {
			map.delete(key);
		},
		clear() {
			map.clear();
		},
		key(index: number) {
			return Array.from(map.keys())[index] ?? null;
		},
		get length() {
			return map.size;
		},
	};
}
