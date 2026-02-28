/**
 * src/pages/reset.js — Password Reset Page
 *
 * ─── PAGE FLOW ────────────────────────────────────────────────────────────
 * 1. render()         injects the password-reset form into #app.
 * 2. _attachEvents()  wires the submit listener.
 * 3. _handleSubmit()  validates the email, calls AuthAPI.requestPasswordReset(),
 *    and shows a success confirmation message regardless of whether the email
 *    exists (security best-practice — don't reveal account existence).
 *
 * ─── HOW TO EXTEND ────────────────────────────────────────────────────────
 * - Add a second step (enter the reset token + new password) by rendering a
 *   second form when the URL hash contains a ?token=... param, or creating a
 *   dedicated "reset-confirm" route that handles the token.
 * - For OTP-based reset, add a phone number field and call a separate SMS API.
 */

window.ResetPage = (() => {
  // ── Template ───────────────────────────────────────────────────────────────

  function _template() {
    return `
      <div class="auth-page">
        <div class="auth-card">

          <div class="auth-card__logo">
            <div class="auth-card__logo-icon">S</div>
          </div>

          <h1 class="auth-card__title">Reset password</h1>
          <p class="auth-card__subtitle">
            Enter your email and we'll send you a reset link.
          </p>

          <!-- Alert slot (hidden initially; shows success ✓ or error message) -->
          <div id="reset-alert" class="alert hidden" role="alert"></div>

          <!-- Reset form — hidden once success message is shown -->
          <form id="reset-form" novalidate>

            ${FormGroup.render({
              id          : "reset-email",
              label       : "Email Address",
              type        : "email",
              placeholder : "you@example.com",
              autocomplete: "email",
              required    : true,
            })}

            ${ButtonComponent.render({
              id     : "reset-submit",
              label  : "Send Reset Link",
              type   : "submit",
              variant: "primary",
            })}

          </form>

          <!-- Success panel (hidden initially; shown after a successful request) -->
          <div id="reset-success-panel" class="hidden" style="text-align:center">
            <div style="font-size:2.5rem;margin-bottom:var(--space-4)">📧</div>
            <p style="font-size:var(--font-size-base);color:var(--color-text);margin-bottom:var(--space-2)">
              <strong>Check your inbox</strong>
            </p>
            <p style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-bottom:var(--space-6)">
              If an account is registered with that email address, you'll receive
              a password reset link within a few minutes.
            </p>
            <a href="#login" class="btn btn--ghost" style="width:100%;display:flex;justify-content:center">
              Back to Sign In
            </a>
          </div>

          <div class="auth-footer">
            Remember your password? <a href="#login">Sign in</a>
          </div>

        </div>
      </div>`;
  }

  // ── Event handling ─────────────────────────────────────────────────────────

  function _attachEvents() {
    const form = document.getElementById("reset-form");
    if (form) form.addEventListener("submit", _handleSubmit);

    document.getElementById("reset-email")?.addEventListener("input", () => {
      Helpers.setFieldError("reset-email", "");
      Helpers.setAlert("reset-alert", "");
    });
  }

  /**
   * Validates the email, calls the API, then swaps the form for a success panel.
   * @param {SubmitEvent} e
   */
  async function _handleSubmit(e) {
    e.preventDefault();

    // ── 1. Read value ────────────────────────────────────────────────────────
    const email = Helpers.normalise(document.getElementById("reset-email")?.value);

    // ── 2. Clear previous messages ────────────────────────────────────────────
    Helpers.setFieldError("reset-email", "");
    Helpers.setAlert("reset-alert", "");

    // ── 3. Validate ───────────────────────────────────────────────────────────
    const emailCheck = Helpers.validateEmail(email);
    if (!emailCheck.valid) {
      Helpers.setFieldError("reset-email", emailCheck.message);
      Logger.warn("ResetPage", "Validation failed — invalid email");
      return;
    }

    // ── 4. Loading state ──────────────────────────────────────────────────────
    Helpers.setButtonLoading("reset-submit", true, "Sending…", "Send Reset Link");

    // ── 5. Call API ───────────────────────────────────────────────────────────
    try {
      const result = await AuthAPI.requestPasswordReset(email);

      if (result.success) {
        // Hide the form and show the confirmation panel
        const form         = document.getElementById("reset-form");
        const successPanel = document.getElementById("reset-success-panel");
        if (form)         form.classList.add("hidden");
        if (successPanel) successPanel.classList.remove("hidden");

        Logger.success("ResetPage", "Password reset email sent (or silently skipped)", { email });
      } else {
        Helpers.setAlert("reset-alert", result.message || "Failed to send reset link.", "error");
        Logger.warn("ResetPage", "Password reset request failed", { code: result.code });
      }
    } catch (err) {
      Helpers.setAlert("reset-alert", "Something went wrong. Please try again.", "error");
      Logger.error("ResetPage", "Unexpected error during password reset", err);
    } finally {
      Helpers.setButtonLoading("reset-submit", false, "", "Send Reset Link");
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function render(container) {
    container.innerHTML = _template();
    _attachEvents();
    Logger.info("ResetPage", "Password reset page rendered");
    document.getElementById("reset-email")?.focus();
  }

  return { render };
})();
