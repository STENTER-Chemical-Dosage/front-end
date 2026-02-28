/**
 * src/pages/login.js — Login Page
 *
 * ─── PAGE FLOW ────────────────────────────────────────────────────────────
 * 1. render()    is called by the Router; it injects the login form HTML into #app.
 * 2. _attachEvents() wires the submit handler to _handleSubmit().
 * 3. _handleSubmit() validates fields, calls AuthAPI.login(), saves the session
 *    on success, and redirects to #home.  On failure it shows an error alert.
 *
 * ─── HOW TO EXTEND ────────────────────────────────────────────────────────
 * - Add extra fields: add a FormGroup.render({...}) call and a matching
 *   validation check in _handleSubmit() before the API call.
 * - Add social login buttons: render additional ButtonComponent rows above the
 *   divider and wire their click events in _attachEvents().
 * - Change the redirect after login: replace Router.navigate("home") with any
 *   other registered route name.
 */

window.LoginPage = (() => {
  // ── Template ───────────────────────────────────────────────────────────────

  /**
   * Returns the full HTML markup for the login page.
   * Uses shared FormGroup and ButtonComponent helpers to keep markup consistent.
   * @returns {string}
   */
  function _template() {
    return `
      <div class="auth-page">
        <div class="auth-card">

          <!-- Brand logo / icon -->
          <div class="auth-card__logo">
            <div class="auth-card__logo-icon">S</div>
          </div>

          <h1 class="auth-card__title">Welcome back</h1>
          <p class="auth-card__subtitle">Sign in to your Stenter account</p>

          <!-- Global error alert (hidden until an error occurs) -->
          <div id="login-alert" class="alert alert--error hidden" role="alert"></div>

          <!-- Login form -->
          <form id="login-form" novalidate>

            ${FormGroup.render({
              id          : "login-email",
              label       : "Email Address",
              type        : "email",
              placeholder : "you@example.com",
              autocomplete: "email",
              required    : true,
            })}

            ${FormGroup.render({
              id          : "login-password",
              label       : "Password",
              type        : "password",
              placeholder : "Enter your password",
              autocomplete: "current-password",
              required    : true,
            })}

            <!-- Forgot password link -->
            <div style="text-align:right;margin-top:-12px;margin-bottom:20px">
              <a href="#reset" style="font-size:var(--font-size-sm)">Forgot password?</a>
            </div>

            ${ButtonComponent.render({
              id    : "login-submit",
              label : "Sign In",
              type  : "submit",
              variant: "primary",
            })}
          </form>

          <!-- Navigation to signup -->
          <div class="auth-footer">
            Don't have an account? <a href="#signup">Create one</a>
          </div>

        </div>
      </div>`;
  }

  // ── Event handling ─────────────────────────────────────────────────────────

  /**
   * Attaches DOM event listeners after the template has been injected.
   * Called once by render() immediately after setting innerHTML.
   */
  function _attachEvents() {
    const form = document.getElementById("login-form");
    if (form) form.addEventListener("submit", _handleSubmit);

    // Clear field-level errors on input so user gets immediate feedback
    ["login-email", "login-password"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", () => Helpers.setFieldError(id, ""));
    });
  }

  /**
   * Handles the form submit event.
   * Validates inputs → calls API → saves session on success → navigates.
   * @param {SubmitEvent} e
   */
  async function _handleSubmit(e) {
    e.preventDefault();

    // ── 1. Read and normalise values ─────────────────────────────────────────
    const email    = Helpers.normalise(document.getElementById("login-email")?.value);
    const password = Helpers.normalise(document.getElementById("login-password")?.value);

    // ── 2. Clear previous messages ────────────────────────────────────────────
    Helpers.clearFieldErrors(["login-email", "login-password"]);
    Helpers.setAlert("login-alert", "");

    // ── 3. Client-side validation ─────────────────────────────────────────────
    let hasError = false;

    const emailCheck = Helpers.validateEmail(email);
    if (!emailCheck.valid) {
      Helpers.setFieldError("login-email", emailCheck.message);
      hasError = true;
    }

    if (!password) {
      Helpers.setFieldError("login-password", "Password is required.");
      hasError = true;
    }

    if (hasError) {
      Logger.warn("LoginPage", "Form validation failed");
      return;
    }

    // ── 4. Show loading state ────────────────────────────────────────────────
    Helpers.setButtonLoading("login-submit", true, "Signing in…", "Sign In");

    // ── 5. Call the API ───────────────────────────────────────────────────────
    try {
      const result = await AuthAPI.login(email, password);

      if (result.success) {
        // Save session data so AuthGuard.isLoggedIn() returns true
        AuthGuard.saveSession(result.data);
        Logger.success("LoginPage", "Login successful — navigating to home");
        Router.navigate("home");
      } else {
        // Known API error (wrong credentials, account locked, etc.)
        Helpers.setAlert("login-alert", result.message, "error");
        Logger.warn("LoginPage", "Login failed", { code: result.code });
      }
    } catch (err) {
      // Unexpected error — network down, etc.
      Helpers.setAlert("login-alert", "Something went wrong. Please try again.", "error");
      Logger.error("LoginPage", "Unexpected error during login", err);
    } finally {
      // Always restore the button state, even if an error occurred
      Helpers.setButtonLoading("login-submit", false, "", "Sign In");
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * render — Entry point called by the Router.
   * Injects HTML into the provided container and wires up event listeners.
   * @param {HTMLElement} container — The #app div
   */
  function render(container) {
    container.innerHTML = _template();
    _attachEvents();
    Logger.info("LoginPage", "Login page rendered");

    // Auto-focus the email input for keyboard accessibility
    document.getElementById("login-email")?.focus();
  }

  return { render };
})();
