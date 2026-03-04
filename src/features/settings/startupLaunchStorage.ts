export const STARTUP_LAUNCH_STORAGE_KEY = "klip.settings.startupLaunchEnabled";

const STARTUP_LAUNCH_ENABLED_VALUE = "enabled";
const STARTUP_LAUNCH_DISABLED_VALUE = "disabled";

export const DEFAULT_STARTUP_LAUNCH_ENABLED = false;

export function readStartupLaunchEnabled(storage: Storage): boolean {
	const rawValue = storage.getItem(STARTUP_LAUNCH_STORAGE_KEY);
	if (rawValue === null) {
		return DEFAULT_STARTUP_LAUNCH_ENABLED;
	}

	const normalized = normalizeStartupLaunchEnabled(rawValue);
	storage.setItem(
		STARTUP_LAUNCH_STORAGE_KEY,
		normalized ? STARTUP_LAUNCH_ENABLED_VALUE : STARTUP_LAUNCH_DISABLED_VALUE,
	);
	return normalized;
}

export function writeStartupLaunchEnabled(
	storage: Storage,
	value: boolean | string,
): boolean {
	const normalized = normalizeStartupLaunchEnabled(value);
	storage.setItem(
		STARTUP_LAUNCH_STORAGE_KEY,
		normalized ? STARTUP_LAUNCH_ENABLED_VALUE : STARTUP_LAUNCH_DISABLED_VALUE,
	);
	return normalized;
}

function normalizeStartupLaunchEnabled(value: boolean | string): boolean {
	if (typeof value === "boolean") {
		return value;
	}

	const normalized = value.trim().toLowerCase();
	return (
		normalized === STARTUP_LAUNCH_ENABLED_VALUE ||
		normalized === "true" ||
		normalized === "1" ||
		normalized === "yes" ||
		normalized === "on"
	);
}
