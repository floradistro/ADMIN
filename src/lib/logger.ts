/**
 * Centralized logging utility
 * Provides structured logging with environment-based control
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  productId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = this.isClient ? '[CLIENT]' : '[SERVER]';
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
    console.error(this.formatMessage('error', message, errorContext));
  }

  // API-specific logging methods
  apiRequest(method: string, url: string, context?: LogContext) {
    this.debug(`API ${method} ${url}`, { ...context, type: 'api_request' });
  }

  apiResponse(method: string, url: string, status: number, context?: LogContext) {
    const level = status >= 400 ? 'warn' : 'debug';
    this[level](`API ${method} ${url} - ${status}`, { ...context, type: 'api_response', status });
  }

  // Component-specific logging
  componentMount(component: string, context?: LogContext) {
    this.debug(`Component mounted: ${component}`, { ...context, type: 'component_mount' });
  }

  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, { ...context, type: 'user_action' });
  }
}

export const logger = new Logger();
export type { LogContext };
