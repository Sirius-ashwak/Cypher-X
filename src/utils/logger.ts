import winston from 'winston';

/**
 * Centralized logging configuration for Project Cypher
 * 
 * Provides structured, contextual logging for all components:
 * - Agent workflow steps and decisions
 * - Vincent AI policy validations
 * - Lit Protocol PKP operations
 * - Trading execution and results
 * - Error tracking and debugging
 */

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4
};

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logLine = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      logLine += ` ${JSON.stringify(meta)}`;
    }
    
    return logLine;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'project-cypher',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for persistent logging
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json()
    }),
    
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json()
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  // Directory might already exist
}

// Helper functions for contextual logging
export const createContextLogger = (context: string) => {
  return {
    info: (message: string, meta?: any) => logger.info(message, { context, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { context, ...meta }),
    error: (message: string, meta?: any) => logger.error(message, { context, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { context, ...meta }),
  };
};

// Performance monitoring helpers
export const createTimer = (operation: string) => {
  const startTime = Date.now();
  
  return {
    end: (meta?: any) => {
      const duration = Date.now() - startTime;
      logger.info(`Operation completed: ${operation}`, {
        duration,
        operation,
        ...meta
      });
      return duration;
    }
  };
};

// Trading-specific logging helpers
export const logTrade = (type: 'BUY' | 'SELL' | 'HOLD', data: any) => {
  logger.info(`Trading decision: ${type}`, {
    tradeType: type,
    ...data
  });
};

export const logError = (component: string, error: Error | string, context?: any) => {
  const errorMessage = error instanceof Error ? error.message : error;
  const stack = error instanceof Error ? error.stack : undefined;
  
  logger.error(`${component} error: ${errorMessage}`, {
    component,
    error: errorMessage,
    stack,
    ...context
  });
};

// Initialize logger
logger.info('Project Cypher logger initialized', {
  logLevel: process.env.LOG_LEVEL || 'info',
  timestamp: new Date().toISOString()
});