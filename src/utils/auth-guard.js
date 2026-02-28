/**
 * src/utils/auth-guard.js — Authentication State & Session Management
 *
 * Stores the current user session in localStorage so it persists across
 * BrowserWindow reloads (but is cleared on logout).
 *
 * SESSION SHAPE (stored as JSON under key "scd_session"):
 * {
 *   token  : string,   // auth token returned by the API
 *   user   : {
 *     id    : string,
 *     name  : string,
 *     email : string,
 *   },
 *   expiresAt: number, // Unix timestamp ms — for future expiry checks
 * }
 *
 * HOW TO EXTEND:
 *  - To add token refresh logic, call AuthGuard.refreshSession() in Router
 *    before every protected route render.
 *  - To encrypt the stored data, replace JSON.stringify/parse with a simple
 *    cipher before calling localStorage.setItem / after getItem.
 */

window.AuthGuard = (() => {
  // Key used in localStorage
  const SESSION_KEY = "scd_session";

  // ── Session helpers ────────────────────────────────────────────────────────

  /**
   * Saves a new session after successful login / signup.
   * @param {{ token: string, user: { id: string, name: string, email: string } }} session
   */
  function saveSession(session) {
    try {
      // Add an expiry 24 hours from now (adjust as needed)
      const payload = {
        ...session,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      Logger.success("AuthGuard", "Session saved", { email: session.user?.email });
    } catch (err) {
      Logger.error("AuthGuard", "Failed to save session", err);
    }
  }

  /**
   * Retrieves the current session, or null if not logged in / expired.
   * @returns {{ token: string, user: object, expiresAt: number } | null}
   */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;

      const session = JSON.parse(raw);

      // Basic expiry check
      if (session.expiresAt && Date.now() > session.expiresAt) {
        Logger.warn("AuthGuard", "Session expired — clearing");
        clearSession();
        return null;
      }

      return session;
    } catch {
      clearSession();
      return null;
    }
  }

  /**
   * Returns just the user object from the active session, or null.
   * @returns {{ id: string, name: string, email: string } | null}
   */
  function getUser() {
    return getSession()?.user ?? null;
  }

  /**
   * Returns true when a valid, non-expired session exists.
   * @returns {boolean}
   */
  function isLoggedIn() {
    return getSession() !== null;
  }

  /**
   * Clears the session (logout).
   */
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    Logger.info("AuthGuard", "Session cleared (logout)");
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    saveSession,
    getSession,
    getUser,
    isLoggedIn,
    clearSession,
  };
})();
