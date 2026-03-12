/**
 * Enhanced logger utility with timestamps, log levels, and performance monitoring
 */

export enum LogLevel {
	DEBUG = "DEBUG",
	INFO = "INFO",
	WARN = "WARN",
	ERROR = "ERROR",
}

/**
 * Performance timing entry
 */
interface PerformanceEntry {
	label: string;
	startTime: number;
	endTime?: number;
	duration?: number;
}

export class Logger {
	private context: string;
	private timers: Map<string, number> = new Map();
	private performanceEntries: PerformanceEntry[] = [];

	constructor(context: string) {
		this.context = context;
	}

	private formatMessage(level: LogLevel, message: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${level}] [${this.context}] ${message}`;
	}

	debug(message: string): void {
		if (process.env.NODE_ENV === "development") {
			console.debug(this.formatMessage(LogLevel.DEBUG, message));
		}
	}

	info(message: string): void {
		console.info(this.formatMessage(LogLevel.INFO, message));
	}

	warn(message: string): void {
		console.warn(this.formatMessage(LogLevel.WARN, message));
	}

	error(message: string, error?: Error): void {
		console.error(this.formatMessage(LogLevel.ERROR, message));
		if (error) {
			console.error(error.stack);
		}
	}

	/**
	 * Start a performance timer
	 * @param label - Unique label for this timer
	 */
	time(label: string): void {
		if (this.timers.has(label)) {
			this.warn(`Timer '${label}' already exists. Overwriting.`);
		}
		this.timers.set(label, performance.now());
		this.performanceEntries.push({
			label,
			startTime: performance.now(),
		});
	}

	/**
	 * End a performance timer and log the duration
	 * @param label - Label of the timer to end
	 * @returns Duration in milliseconds, or -1 if timer not found
	 */
	timeEnd(label: string): number {
		const startTime = this.timers.get(label);
		if (startTime === undefined) {
			this.warn(`Timer '${label}' does not exist.`);
			return -1;
		}

		const endTime = performance.now();
		const duration = endTime - startTime;
		this.timers.delete(label);

		// Update performance entry
		const entry = this.performanceEntries.find(
			(e) => e.label === label && e.endTime === undefined,
		);
		if (entry) {
			entry.endTime = endTime;
			entry.duration = duration;
		}

		this.info(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
		return duration;
	}

	/**
	 * Get all performance entries
	 */
	getPerformanceEntries(): PerformanceEntry[] {
		return [...this.performanceEntries];
	}

	/**
	 * Clear all performance entries
	 */
	clearPerformance(): void {
		this.performanceEntries = [];
		this.timers.clear();
	}

	/**
	 * Measure execution time of an async function
	 * @param label - Label for the measurement
	 * @param fn - Async function to measure
	 * @returns Result of the function
	 */
	async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
		this.time(label);
		try {
			const result = await fn();
			this.timeEnd(label);
			return result;
		} catch (error) {
			this.timeEnd(label);
			throw error;
		}
	}

	/**
	 * Measure execution time of a sync function
	 * @param label - Label for the measurement
	 * @param fn - Sync function to measure
	 * @returns Result of the function
	 */
	measureSync<T>(label: string, fn: () => T): T {
		this.time(label);
		try {
			const result = fn();
			this.timeEnd(label);
			return result;
		} catch (error) {
			this.timeEnd(label);
			throw error;
		}
	}

	/**
	 * Get performance summary statistics
	 */
	getPerformanceSummary(): {
		totalEntries: number;
		averageDuration: number;
		maxDuration: number;
		minDuration: number;
	} {
		const completed = this.performanceEntries.filter(
			(e) => e.duration !== undefined,
		);
		const durations = completed.map((e) => e.duration as number);

		if (durations.length === 0) {
			return {
				totalEntries: 0,
				averageDuration: 0,
				maxDuration: 0,
				minDuration: 0,
			};
		}

		return {
			totalEntries: completed.length,
			averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
			maxDuration: Math.max(...durations),
			minDuration: Math.min(...durations),
		};
	}
}

export function createLogger(context: string): Logger {
	return new Logger(context);
}
