'use strict';

/**
 * Global Express error handler.
 *
 * Must be registered LAST in the middleware chain (after all routes).
 * Catches all errors passed via next(err).
 *
 * Behaviour:
 *   - Development: returns full stack trace + request details
 *   - Production: returns safe message only (no internal details exposed)
 *
 * Usage: app.use(errorHandler)   ← must be last
 */

const logger = require('../config/logger');

/**
 * Central error handler middleware.
 * The 4-parameter signature (err, req, res, next) is required by Express
 * to identify this as an error handler — do not remove the `next` param
 * even though it's unused.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next - Required by Express; unused here
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status  = err.status || err.statusCode || 500;
  const isDev   = process.env.NODE_ENV !== 'production';
  const reqInfo = `${req.method} ${req.originalUrl}`;

  if (status >= 500) {
    logger.error(`[errorHandler] 500 on ${reqInfo}: ${err.message}`);
    if (isDev) logger.error(`[errorHandler] Stack:\n${err.stack}`);
  } else {
    logger.warn(`[errorHandler] ${status} on ${reqInfo}: ${err.message}`);
  }

  // Never expose stack traces or internal messages in production
  res.status(status).json({
    error   : err.name || 'Error',
    message : status < 500
      ? err.message                                    // 4xx — safe to show
      : isDev ? err.message : 'Internal server error', // 5xx — hide in prod
    ...(isDev && status >= 500 && {
      stack : err.stack,
      path  : req.originalUrl,
      method: req.method,
    }),
  });
}

module.exports = { errorHandler };
