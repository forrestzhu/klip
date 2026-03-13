/**
 * Startup Launch Storage Module
 *
 * Manages persistent storage of auto-launch settings.
 * Controls whether the app automatically starts when the user logs in.
 *
 * Features:
 * - Read/write startup launch enabled/disabled state
 * - Normalize various input formats to boolean
 * - Persistent storage via localStorage
 */

export const STARTUP_LAUNCH_STORAGE_KEY = "klip.settings.startupLaunchEnabled";

const STARTUP_LAUNCH_ENABLED_VALUE = "enabled";
const STARTUP_LAUNCH_DISABLED_VALUE = "disabled";

export const DEFAULT_STARTUP_LAUNCH_ENABLED = false;

/**
 * Read startup launch enabled state from storage
 * @param storage - Storage interface (typically localStorage)
 * @returns true if startup launch is enabled, false otherwise
 */
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

/**
 * Write startup launch enabled state to storage
 * @param storage - Storage interface (typically localStorage)
 * @param value - Boolean or string value (will be normalized)
 * @returns Normalized boolean value that was persisted
 * @example
 * ```ts
 * writeStartupLaunchEnabled(localStorage, true);
 * writeStartupLaunchEnabled(localStorage, "yes");
 * writeStartupLaunchEnabled(localStorage, "1");
 * // All persist and return true
 * ```
 */
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

/**
 * Normalize startup launch value to boolean
 * Accepts various formats: boolean, "enabled"/"disabled", "true"/"false", "1"/"0", "yes"/"no", "on"/"off"
 * @param value - Value to normalize
 * @returns Normalized boolean value
 */
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
