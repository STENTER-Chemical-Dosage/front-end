/**
 * src/utils/logger.js — Application Logger
 *
 * Provides a consistent, structured logging interface for the renderer.
 * All log messages are prefixed with a timestamp and a severity tag so they
 * are easy to grep in the DevTools console.
 *
 * LEVELS:
 *  - info    → general informational messages (blue)
 *  - success → positive outcomes, e.g. "Login successful" (green)
 *  - warn    → non-fatal warnings (orange)
 *  - error   → errors and exceptions (red)
 *  - debug   → verbose developer messages (gray). Silenced in production.
 *
 * USAGE:
 *  Logger.info("Auth", "User logged in", { email: "..." });
 *  Logger.error("API", "Request failed", err);
 *
 * HOW TO EXTEND:
 *  - To ship logs to a remote endpoint add an HTTP call inside _log().
 *  - To persist logs locally, push each entry to an array and expose a
 *    Logger.getLogs() method.
 */

window.Logger = (() => {
  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Returns a formatted timestamp string for log prefixes.
   * @returns {string}  e.g. "14:32:07.123"
   */
  function _timestamp() {
    return new Date().toTimeString().split(" ")[0] +
      "." + String(new Date().getMilliseconds()).padStart(3, "0");
  }

  /**
   * Core log function. All public methods delegate here.
   * @param {"info"|"success"|"warn"|"error"|"debug"} level
   * @param {string}  module  — Caller context, e.g. "Auth", "API"
   * @param {string}  message — What happened
   * @param {*}       [data]  — Optional extra payload (object, Error, string…)
   */
  function _log(level, module, message, data) {
    // Map level to a console method and colour tag
    const styles = {
      info:    ["color:#2563eb;font-weight:600", console.info],
      success: ["color:#16a34a;font-weight:600", console.info],
      warn:    ["color:#d97706;font-weight:600", console.warn],
      error:   ["color:#dc2626;font-weight:600", console.error],
      debug:   ["color:#94a3b8;font-weight:600", console.debug],
    };

    const [css, consoleFn] = styles[level] || styles.info;
    const prefix           = `%c[${level.toUpperCase()}] [${_timestamp()}] [${module}]`;

    if (data !== undefined) {
      consoleFn(prefix, css, message, data);
    } else {
      consoleFn(prefix, css, message);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    /** Log an informational message */
    info(module, message, data) {
      _log("info", module, message, data);
    },

    /** Log a success message (positive outcome) */
    success(module, message, data) {
      _log("success", module, message, data);
    },

    /** Log a non-fatal warning */
    warn(module, message, data) {
      _log("warn", module, message, data);
    },

    /** Log an error. Pass the caught Error object as `data` for a stack trace */
    error(module, message, data) {
      _log("error", module, message, data);
    },

    /** Log a verbose debug message. Add a production guard here if needed */
    debug(module, message, data) {
      _log("debug", module, message, data);
    },
  };
})();
