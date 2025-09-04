// Simple logger implementation without external dependencies
interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

class SimpleLogger {
  private logLevel: string;

  constructor(level: string = 'info') {
    this.logLevel = level;
  }

  private formatMessage(entry: LogEntry): string {
    let log = `${entry.timestamp} [${entry.level.toUpperCase()}]: ${entry.message}`;
    if (entry.meta && Object.keys(entry.meta).length > 0) {
      log += ` ${JSON.stringify(entry.meta)}`;
    }
    return log;
  }

  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private log(level: string, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      meta
    };

    const formattedMessage = this.formatMessage(entry);
    
    if (level === 'error') {
      console.error(formattedMessage);
    } else if (level === 'warn') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.ERROR, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.WARN, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.INFO, message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log(LOG_LEVELS.DEBUG, message, meta);
  }
}

// Create logger instances
export const logger = new SimpleLogger(process.env.LOG_LEVEL || 'info');
export const auditLogger = new SimpleLogger('info');

// Helper functions for common logging patterns
export const logModelStatusChange = (modelId: string, oldStatus: string, newStatus: string, reason: string, userId: string) => {
  logger.info('Model status changed', {
    modelId,
    oldStatus,
    newStatus,
    reason,
    userId,
    category: 'model_lifecycle'
  });
};

export const logShiftCompletion = (shiftId: string, modelId: string, shiftType: string, userId: string) => {
  logger.info('Shift completed', {
    shiftId,
    modelId,
    shiftType,
    userId,
    category: 'shift_management'
  });
};

export const logUserAction = (action: string, userId: string, details: Record<string, unknown>) => {
  auditLogger.info('User action', {
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logError = (error: Error, context: string, userId?: string) => {
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    context,
    userId,
    category: 'error'
  });
};
