'use strict';

/**
 * Server startup metadata.
 * Required once at boot — Node's module cache ensures startedAt is
 * set exactly once and stays constant for the life of the process.
 * A new deploy restarts the process, so startedAt changes, which the
 * frontend version-watcher uses to detect deploys and auto-reload.
 */
module.exports = {
  startedAt: new Date().toISOString(),
};
