/**
 * Enhanced logger utility with timestamps and log levels
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${this.context}] ${message}`;
  }

  debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
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
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
