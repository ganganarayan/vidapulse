'use strict';

/**
 * Structured logger for VidaPulse backend.
 *
 * Levels (lowest → highest severity): debug → info → warn → error
 * Set LOG_LEVEL env var to control what gets printed.
 * In Railway, all console output is captured in the deployment logs.
 *
 * Usage:
 *   const logger = require('./config/logger');
 *   logger.info('[module] Something happened');
 *   logger.error('[module] Something broke:', err.message);
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

// Default to 'info' in production, 'debug' in development
const rawLevel = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase();
const currentLevel = LEVELS[rawLevel] ?? LEVELS.info;

/**
 * Formats and prints a log entry.
 * Format: [ISO_TIMESTAMP] [LEVEL] ...args
 */
function log(level, ...args) {
  if (LEVELS[level] < currentLevel) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase().padEnd(5)}]`;

  // Separate Error objects so their stack is printed on its own line
  const parts = args.map(arg => {
    if (arg instanceof Error) return `${arg.message}\n${arg.stack}`;
    if (typeof arg === 'object') {
      try { return JSON.stringify(arg); } catch { return String(arg); }
    }
    return String(arg);
  });

  const message = `${prefix} ${parts.join(' ')}`;

  if (level === 'error' || level === 'warn') {
    console.error(message);
  } else {
    console.log(message);
  }
}

module.exports = {
  debug : (...args) => log('debug', ...args),
  info  : (...args) => log('info',  ...args),
  warn  : (...args) => log('warn',  ...args),
  error : (...args) => log('error', ...args),
};
