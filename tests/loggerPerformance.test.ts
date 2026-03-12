/**
 * Tests for Logger performance monitoring features
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger, type Logger, LogLevel } from "../src/utils/logger";

describe("Logger Performance Monitoring", () => {
	let logger: Logger;
	let consoleSpy: {
		info: ReturnType<typeof vi.spyOn>;
		warn: ReturnType<typeof vi.spyOn>;
		error: ReturnType<typeof vi.spyOn>;
		debug: ReturnType<typeof vi.spyOn>;
	};

	beforeEach(() => {
		logger = createLogger("TestContext");

		// Spy on console methods
		consoleSpy = {
			info: vi.spyOn(console, "info").mockImplementation(() => {}),
			warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
			error: vi.spyOn(console, "error").mockImplementation(() => {}),
			debug: vi.spyOn(console, "debug").mockImplementation(() => {}),
		};
	});

	describe("time() and timeEnd()", () => {
		it("should measure and log elapsed time", () => {
			logger.time("test-operation");

			// Simulate some work
			const start = performance.now();
			while (performance.now() - start < 10) {
				// Busy wait for ~10ms
			}

			const duration = logger.timeEnd("test-operation");

			expect(duration).toBeGreaterThan(0);
			expect(consoleSpy.info).toHaveBeenCalled();

			const logMessage = consoleSpy.info.mock.calls[0][0];
			expect(logMessage).toContain("⏱️");
			expect(logMessage).toContain("test-operation");
			expect(logMessage).toContain("ms");
		});

		it("should warn when ending non-existent timer", () => {
			const duration = logger.timeEnd("non-existent");

			expect(duration).toBe(-1);
			expect(consoleSpy.warn).toHaveBeenCalled();
		});

		it("should warn when overwriting existing timer", () => {
			logger.time("duplicate");
			logger.time("duplicate");

			expect(consoleSpy.warn).toHaveBeenCalled();
		});
	});

	describe("measureSync()", () => {
		it("should measure sync function execution", () => {
			const result = logger.measureSync("sync-op", () => {
				let sum = 0;
				for (let i = 0; i < 1000; i++) {
					sum += i;
				}
				return sum;
			});

			expect(result).toBe(499500);
			expect(consoleSpy.info).toHaveBeenCalled();
		});

		it("should measure and re-throw errors", () => {
			expect(() => {
				logger.measureSync("failing-op", () => {
					throw new Error("Test error");
				});
			}).toThrow("Test error");

			// Should still log timing even when error occurs
			expect(consoleSpy.info).toHaveBeenCalled();
		});
	});

	describe("measureAsync()", () => {
		it("should measure async function execution", async () => {
			const result = await logger.measureAsync("async-op", async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return "async-result";
			});

			expect(result).toBe("async-result");
			expect(consoleSpy.info).toHaveBeenCalled();
		});

		it("should measure and re-throw async errors", async () => {
			await expect(
				logger.measureAsync("failing-async", async () => {
					await new Promise((resolve) => setTimeout(resolve, 5));
					throw new Error("Async error");
				}),
			).rejects.toThrow("Async error");

			// Should still log timing even when error occurs
			expect(consoleSpy.info).toHaveBeenCalled();
		});
	});

	describe("Performance Entries", () => {
		it("should track performance entries", () => {
			logger.time("op1");
			logger.time("op2");
			logger.timeEnd("op1");
			logger.timeEnd("op2");

			const entries = logger.getPerformanceEntries();

			expect(entries).toHaveLength(2);
			expect(entries[0].label).toBe("op1");
			expect(entries[0].duration).toBeDefined();
			expect(entries[1].label).toBe("op2");
			expect(entries[1].duration).toBeDefined();
		});

		it("should clear performance entries", () => {
			logger.time("op");
			logger.timeEnd("op");

			expect(logger.getPerformanceEntries()).toHaveLength(1);

			logger.clearPerformance();

			expect(logger.getPerformanceEntries()).toHaveLength(0);
		});
	});

	describe("Performance Summary", () => {
		it("should calculate performance statistics", () => {
			// Run multiple operations
			for (let i = 0; i < 5; i++) {
				logger.measureSync(`op-${i}`, () => {
					const start = performance.now();
					while (performance.now() - start < i * 2) {
						// Variable delay
					}
				});
			}

			const summary = logger.getPerformanceSummary();

			expect(summary.totalEntries).toBe(5);
			expect(summary.averageDuration).toBeGreaterThan(0);
			expect(summary.maxDuration).toBeGreaterThanOrEqual(summary.minDuration);
		});

		it("should return zeros when no entries", () => {
			const summary = logger.getPerformanceSummary();

			expect(summary.totalEntries).toBe(0);
			expect(summary.averageDuration).toBe(0);
			expect(summary.maxDuration).toBe(0);
			expect(summary.minDuration).toBe(0);
		});
	});

	describe("Integration", () => {
		it("should work with existing log methods", () => {
			logger.info("Starting operation");
			logger.time("operation");
			logger.timeEnd("operation");
			logger.info("Operation completed");

			expect(consoleSpy.info).toHaveBeenCalledTimes(3);
		});

		it("should format performance logs with context", () => {
			logger.time("test");
			logger.timeEnd("test");

			const logMessage = consoleSpy.info.mock.calls[0][0];
			expect(logMessage).toContain("[TestContext]");
			expect(logMessage).toContain("[INFO]");
		});
	});
});
