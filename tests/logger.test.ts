import { describe, expect, it, vi } from "vitest";
import { createLogger, Logger, LogLevel } from "../src/utils/logger";

describe("Logger", () => {
	it("should create a logger with context", () => {
		const logger = createLogger("test");
		expect(logger).toBeInstanceOf(Logger);
	});

	it("should format messages with timestamp and level", () => {
		const logger = new Logger("test");
		const consoleSpy = vi.spyOn(console, "info");

		logger.info("test message");

		expect(consoleSpy).toHaveBeenCalled();
		const loggedMessage = consoleSpy.mock.calls[0][0];
		expect(loggedMessage).toContain("[INFO]");
		expect(loggedMessage).toContain("[test]");
		expect(loggedMessage).toContain("test message");

		consoleSpy.mockRestore();
	});

	it("should log errors with stack trace", () => {
		const logger = new Logger("test");
		const consoleSpy = vi.spyOn(console, "error");

		const error = new Error("test error");
		logger.error("something failed", error);

		expect(consoleSpy).toHaveBeenCalledTimes(2);

		consoleSpy.mockRestore();
	});
});
