/**
 * src/api/auth.js — Authentication API Calls
 *
 * All auth-related API functions live here: login, signup, and password reset.
 * Currently uses MOCK responses with a simulated network delay so you can
 * develop and test the UI without a real backend.
 *
 * ─── HOW TO SWITCH FROM MOCK TO A REAL API ────────────────────────────────
 * 1. Set USE_MOCK = false below (or gate on an environment variable).
 * 2. Replace the mock implementations in _mockLogin / _mockSignup /
 *    _mockRequestPasswordReset with real fetch / axios calls.
 * 3. Adjust BASE_URL to point to your backend.
 *
 * ─── HOW TO ADD A NEW API CALL ────────────────────────────────────────────
 * 1. Write a private _mock<Action>() function that returns the resolved shape.
 * 2. Write a public async function (e.g. updateProfile) that:
 *    a. Validates / normalises inputs.
 *    b. Calls _mockDelay() to simulate latency (remove in production).
 *    c. Calls the mock or real endpoint.
 *    d. Returns { success: true, data: {...} }  or throws an ApiError.
 * 3. Export the function on window.AuthAPI.
 * 4. Import / call it from your page module.
 *
 * ─── RESPONSE SHAPE CONVENTION ────────────────────────────────────────────
 * All public functions resolve to:
 *   { success: true,  data: { ... } }         — on success
 *   { success: false, message: "...", code: "..." } — on known errors
 * Unexpected errors are rethrown as ApiError instances so the page can
 * display a generic "something went wrong" message.
 */

window.AuthAPI = (() => {
  // ── Configuration ──────────────────────────────────────────────────────────

  /** Toggle to false to use the real PostgreSQL database via IPC */
  const USE_MOCK = false;

  /** Base URL for real API calls (unused — real calls go through Electron IPC) */
  const BASE_URL = "https://your-api-domain.com/api/v1";

  /** Simulated network latency in milliseconds */
  const MOCK_DELAY_MS = 900;

  // ── Mock data store ────────────────────────────────────────────────────────

  /**
   * In-memory user store for mock mode.
   * Pre-seeded with one demo user so login works out of the box.
   * @type {Array<{ id: string, name: string, email: string, password: string }>}
   */
  const _mockUsers = [
    {
      id      : "user-001",
      name    : "Demo User",
      email   : "demo@example.com",
      password: "Password1",
    },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns a Promise that resolves after MOCK_DELAY_MS milliseconds.
   * Simulates real network latency during development.
   * Remove all calls to _mockDelay() when switching to a real API.
   * @returns {Promise<void>}
   */
  function _mockDelay() {
    return new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  }

  /**
   * Generates a pseudo-random token string (for mock sessions only).
   * Real backends issue JWTs — replace this.
   * @returns {string}
   */
  function _generateMockToken() {
    return "mock-token-" + Math.random().toString(36).slice(2) + Date.now();
  }

  // ── Mock implementations ───────────────────────────────────────────────────

  /**
   * Mock login: searches the in-memory user store for a matching credential.
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, data?: object, message?: string, code?: string }}
   */
  async function _mockLogin(email, password) {
    await _mockDelay();

    const user = _mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
      return {
        success: false,
        message: "Invalid email or password. Please try again.",
        code   : "INVALID_CREDENTIALS",
      };
    }

    return {
      success: true,
      data: {
        token: _generateMockToken(),
        user : { id: user.id, name: user.name, email: user.email },
      },
    };
  }

  /**
   * Mock signup: creates a new user in the in-memory store.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {{ success: boolean, data?: object, message?: string, code?: string }}
   */
  async function _mockSignup(name, email, password) {
    await _mockDelay();

    const exists = _mockUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
      return {
        success: false,
        message: "An account with this email already exists. Try logging in.",
        code   : "EMAIL_TAKEN",
      };
    }

    const newUser = {
      id      : "user-" + Math.random().toString(36).slice(2),
      name    : name.trim(),
      email   : email.toLowerCase().trim(),
      password,
    };
    _mockUsers.push(newUser);

    Logger.success("AuthAPI", "Mock user created", { email: newUser.email });

    return {
      success: true,
      data: {
        token: _generateMockToken(),
        user : { id: newUser.id, name: newUser.name, email: newUser.email },
      },
    };
  }

  /**
   * Mock password reset: checks the user exists and pretends to send an email.
   * @param {string} email
   * @returns {{ success: boolean, message?: string, code?: string }}
   */
  async function _mockRequestPasswordReset(email) {
    await _mockDelay();

    const exists = _mockUsers.some(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    // Return success even if the email doesn't exist (security best-practice:
    // don't confirm whether an account exists).
    if (!exists) {
      Logger.warn("AuthAPI", "Password reset requested for unknown email — sending generic response");
    }

    return {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    };
  }

  // ── Real API implementations (via Electron IPC → PostgreSQL) ─────────────────
  // These call the IPC handlers in src/db/database.js through the preload bridge.
  // window.electronAPI is exposed by preload.js via contextBridge.

  /**
   * _realLogin — Calls the main process auth:login IPC handler.
   * The main process queries the Supabase PostgreSQL database and
   * verifies the password hash using bcryptjs.
   */
  async function _realLogin(email, password) {
    return await window.electronAPI.authLogin(email, password);
  }

  /**
   * _realSignup — Calls the main process auth:signup IPC handler.
   * The main process hashes the password and inserts a new row into users.
   */
  async function _realSignup(name, email, password) {
    return await window.electronAPI.authSignup(name, email, password);
  }

  /**
   * _realRequestPasswordReset — Calls the main process auth:password-reset handler.
   * Currently a prototype stub. Wire up an email provider in database.js
   * to send a real reset link.
   */
  async function _realRequestPasswordReset(email) {
    return await window.electronAPI.authPasswordReset(email);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * login — Authenticates a user with email and password.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, data?: { token: string, user: object }, message?: string, code?: string }>}
   *
   * USAGE:
   *   const result = await AuthAPI.login(email, password);
   *   if (result.success) {
   *     AuthGuard.saveSession(result.data);
   *     Router.navigate("home");
   *   } else {
   *     showError(result.message);
   *   }
   */
  async function login(email, password) {
    Logger.info("AuthAPI", "login() called", { email });
    try {
      const result = USE_MOCK
        ? await _mockLogin(email, password)
        : await _realLogin(email, password);

      if (result.success) {
        Logger.success("AuthAPI", "Login successful", { email });
      } else {
        Logger.warn("AuthAPI", "Login failed", { email, code: result.code });
      }
      return result;
    } catch (err) {
      Logger.error("AuthAPI", "login() threw an unexpected error", err);
      return { success: false, message: "An unexpected error occurred. Please try again.", code: "UNKNOWN" };
    }
  }

  /**
   * signup — Registers a new user account.
   *
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ success: boolean, data?: { token: string, user: object }, message?: string, code?: string }>}
   */
  async function signup(name, email, password) {
    Logger.info("AuthAPI", "signup() called", { email });
    try {
      const result = USE_MOCK
        ? await _mockSignup(name, email, password)
        : await _realSignup(name, email, password);

      if (result.success) {
        Logger.success("AuthAPI", "Signup successful", { email });
      } else {
        Logger.warn("AuthAPI", "Signup failed", { email, code: result.code });
      }
      return result;
    } catch (err) {
      Logger.error("AuthAPI", "signup() threw an unexpected error", err);
      return { success: false, message: "An unexpected error occurred. Please try again.", code: "UNKNOWN" };
    }
  }

  /**
   * requestPasswordReset — Sends a password reset email.
   *
   * @param {string} email
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async function requestPasswordReset(email) {
    Logger.info("AuthAPI", "requestPasswordReset() called", { email });
    try {
      const result = USE_MOCK
        ? await _mockRequestPasswordReset(email)
        : await _realRequestPasswordReset(email);

      Logger.success("AuthAPI", "Password reset response received");
      return result;
    } catch (err) {
      Logger.error("AuthAPI", "requestPasswordReset() threw an unexpected error", err);
      return { success: false, message: "An unexpected error occurred. Please try again.", code: "UNKNOWN" };
    }
  }

  return { login, signup, requestPasswordReset };
})();
