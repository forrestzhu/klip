/**
 * History Constants
 *
 * Configuration constants for the clipboard history feature.
 */

/** Current schema version for history storage */
export const HISTORY_SCHEMA_VERSION = 1;

/** Default maximum number of history items to retain */
export const DEFAULT_HISTORY_MAX_ITEMS = 30;

/** Minimum allowed value for maxItems configuration */
export const MIN_HISTORY_MAX_ITEMS = 10;

/** Maximum allowed value for maxItems configuration */
export const MAX_HISTORY_MAX_ITEMS = 5000;

/** Default interval for polling clipboard changes (milliseconds) */
export const DEFAULT_CLIPBOARD_POLL_INTERVAL_MS = 350;

/** Default timeout for clipboard to become ready (milliseconds) */
export const DEFAULT_CLIPBOARD_READY_TIMEOUT_MS = 2_000;

/** Default duration to suppress detecting own clipboard writes (milliseconds) */
export const DEFAULT_SELF_WRITE_SUPPRESSION_MS = 1_500;
