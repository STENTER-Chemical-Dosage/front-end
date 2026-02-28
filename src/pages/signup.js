/**
 * src/pages/signup.js — Signup / Registration Page
 *
 * ─── PAGE FLOW ────────────────────────────────────────────────────────────
 * 1. render()         injects the registration form into #app.
 * 2. _attachEvents()  wires the submit handler and per-field input cleanup.
 * 3. _handleSubmit()  validates all four fields, calls AuthAPI.signup(),
 *    saves the new session, then navigates to #home.
 *
 * ─── HOW TO EXTEND ────────────────────────────────────────────────────────
 * - Add extra registration fields (phone, company, etc.) by adding
 *   FormGroup.render() calls in _template() and validation in _handleSubmit().
 * - Add terms-and-conditions checkbox: add an <input type="checkbox"> below
 *   the confirm-password field and check it in _handleSubmit().
 * - Send a welcome email after signup: call an EmailAPI function after
 *   AuthAPI.signup() resolves successfully.
 */

window.SignupPage = (() => {
  // ── Template ───────────────────────────────────────────────────────────────

  function _template() {
    return `
      <div class="auth-page">
        <div class="auth-card">

          <div class="auth-card__logo">
            <div class="auth-card__logo-icon">S</div>
          </div>

          <h1 class="auth-card__title">Create account</h1>
          <p class="auth-card__subtitle">Join Stenter Chemical Dosage</p>

          <!-- Global error / success alert -->
          <div id="signup-alert" class="alert hidden" role="alert"></div>

          <form id="signup-form" novalidate>

            ${FormGroup.render({
              id          : "signup-name",
              label       : "Full Name",
              type        : "text",
              placeholder : "Jane Smith",
              autocomplete: "name",
              required    : true,
            })}

            ${FormGroup.render({
              id          : "signup-email",
              label       : "Email Address",
              type        : "email",
              placeholder : "you@example.com",
              autocomplete: "email",
              required    : true,
            })}

            ${FormGroup.render({
              id          : "signup-password",
              label       : "Password",
              type        : "password",
              placeholder : "Min. 8 characters, 1 letter and 1 number",
              autocomplete: "new-password",
              required     : true,
            })}

            ${FormGroup.render({
              id          : "signup-confirm",
              label       : "Confirm Password",
              type        : "password",
              placeholder : "Re-enter your password",
              autocomplete: "new-password",
              required     : true,
            })}

            ${ButtonComponent.render({
              id     : "signup-submit",
              label  : "Create Account",
              type   : "submit",
              variant: "primary",
            })}

          </form>

          <div class="auth-footer">
            Already have an account? <a href="#login">Sign in</a>
          </div>

        </div>
      </div>`;
  }

  // ── Event handling ─────────────────────────────────────────────────────────

  function _attachEvents() {
    const form = document.getElementById("signup-form");
    if (form) form.addEventListener("submit", _handleSubmit);

    // Real-time confirm-password mismatch hint
    const confirmEl = document.getElementById("signup-confirm");
    if (confirmEl) {
      confirmEl.addEventListener("input", () => {
        const pw      = document.getElementById("signup-password")?.value || "";
        const confirm = confirmEl.value;
        // Only show mismatch warning after user has typed something
        if (confirm.length > 0 && pw !== confirm) {
          Helpers.setFieldError("signup-confirm", "Passwords do not match.");
        } else {
          Helpers.setFieldError("signup-confirm", "");
        }
      });
    }

    // Clear field error on focus/input for other fields
    ["signup-name", "signup-email", "signup-password"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => Helpers.setFieldError(id, ""));
    });
  }

  /**
   * Validates all fields, calls AuthAPI.signup(), handles response.
   * @param {SubmitEvent} e
   */
  async function _handleSubmit(e) {
    e.preventDefault();

    // ── 1. Read values ───────────────────────────────────────────────────────
    const name     = Helpers.normalise(document.getElementById("signup-name")?.value);
    const email    = Helpers.normalise(document.getElementById("signup-email")?.value);
    const password = document.getElementById("signup-password")?.value || "";
    const confirm  = document.getElementById("signup-confirm")?.value  || "";

    // ── 2. Clear previous messages ────────────────────────────────────────────
    Helpers.clearFieldErrors(["signup-name", "signup-email", "signup-password", "signup-confirm"]);
    Helpers.setAlert("signup-alert", "");

    // ── 3. Client-side validation ─────────────────────────────────────────────
    let hasError = false;

    const nameCheck = Helpers.validateName(name);
    if (!nameCheck.valid) {
      Helpers.setFieldError("signup-name", nameCheck.message);
      hasError = true;
    }

    const emailCheck = Helpers.validateEmail(email);
    if (!emailCheck.valid) {
      Helpers.setFieldError("signup-email", emailCheck.message);
      hasError = true;
    }

    const pwCheck = Helpers.validatePassword(password);
    if (!pwCheck.valid) {
      Helpers.setFieldError("signup-password", pwCheck.message);
      hasError = true;
    }

    const matchCheck = Helpers.validatePasswordMatch(password, confirm);
    if (!matchCheck.valid) {
      Helpers.setFieldError("signup-confirm", matchCheck.message);
      hasError = true;
    }

    if (hasError) {
      Logger.warn("SignupPage", "Form validation failed");
      return;
    }

    // ── 4. Show loading ───────────────────────────────────────────────────────
    Helpers.setButtonLoading("signup-submit", true, "Creating account…", "Create Account");

    // ── 5. Call API ───────────────────────────────────────────────────────────
    try {
      const result = await AuthAPI.signup(name, email, password);

      if (result.success) {
        AuthGuard.saveSession(result.data);
        Logger.success("SignupPage", "Signup successful — navigating to home");
        Router.navigate("home");
      } else {
        Helpers.setAlert("signup-alert", result.message, "error");
        Logger.warn("SignupPage", "Signup failed", { code: result.code });
      }
    } catch (err) {
      Helpers.setAlert("signup-alert", "Something went wrong. Please try again.", "error");
      Logger.error("SignupPage", "Unexpected error during signup", err);
    } finally {
      Helpers.setButtonLoading("signup-submit", false, "", "Create Account");
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  function render(container) {
    container.innerHTML = _template();
    _attachEvents();
    Logger.info("SignupPage", "Signup page rendered");
    document.getElementById("signup-name")?.focus();
  }

  return { render };
})();
