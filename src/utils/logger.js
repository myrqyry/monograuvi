// src/utils/logger.js

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4 // Use this level to effectively disable all logging
};

// Determine the default log level based on the environment
let currentLogLevel = import.meta.env.MODE === 'production'
  ? LOG_LEVELS.INFO // In production, only show INFO, WARN, ERROR by default
  : LOG_LEVELS.DEBUG; // In development, show all logs

/**
 * Checks if a message with the given level should be logged.
 * @param {number} level - The log level of the message.
 * @returns {boolean}
 */
function shouldLog(level) {
  return level >= currentLogLevel;
}

/**
 * A simple logger utility for the frontend.
 */
const logger = {
  /**
   * Logs a debug message.
   * @param {...any} args - Arguments to log.
   */
  debug: (...args) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug('[MONOGRAUVI-DEBUG]', ...args);
    }
  },
  /**
   * Logs an informational message.
   * @param {...any} args - Arguments to log.
   */
  info: (...args) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info('[MONOGRAUVI-INFO]', ...args);
    }
  },
  /**
   * Logs a warning message.
   * @param {...any} args - Arguments to log.
   */
  warn: (...args) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn('[MONOGRAUVI-WARN]', ...args);
    }
  },
  /**
   * Logs an error message.
   * @param {...any} args - Arguments to log.
   */
  error: (...args) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error('[MONOGRAUVI-ERROR]', ...args);
    }
  },
  /**
   * Sets the minimum log level.
   * @param {'DEBUG'|'INFO'|'WARN'|'ERROR'|'NONE'} levelString - The desired log level as a string.
   */
  setLogLevel: (levelString) => {
    const level = LOG_LEVELS[levelString.toUpperCase()];
    if (level !== undefined) {
      currentLogLevel = level;
      console.log(`[MONOGRAUVI-CONFIG] Log level set to: ${levelString.toUpperCase()}`);
    } else {
      console.warn(`[MONOGRAUVI-CONFIG] Invalid log level: ${levelString}`);
    }
  }
};

export default logger;
