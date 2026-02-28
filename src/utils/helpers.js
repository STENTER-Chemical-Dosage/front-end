/**
 * src/utils/helpers.js — Validation & General Utilities
 *
 * Pure, side-effect-free helper functions used across pages and components.
 *
 * HOW TO EXTEND:
 *  - Add new validation functions following the same pattern:
 *    return { valid: bool, message: string }
 *  - Add general helpers (formatters, sanitisers, etc.) as plain functions.
 */

window.Helpers = (() => {
  // ── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validates an email address using a standard RFC-5322 simplified regex.
   * @param {string} email
   * @returns {{ valid: boolean, message: string }}
   */
  function validateEmail(email) {
    if (!email || email.trim() === "") {
      return { valid: false, message: "Email is required." };
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email.trim())) {
      return { valid: false, message: "Please enter a valid email address." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validates a password.
   * Rules: minimum 8 characters, at least one letter and one number.
   * @param {string} password
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePassword(password) {
    if (!password) {
      return { valid: false, message: "Password is required." };
    }
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters." };
    }
    if (!/[a-zA-Z]/.test(password)) {
      return { valid: false, message: "Password must contain at least one letter." };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Password must contain at least one number." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validates that two password strings match.
   * @param {string} password
   * @param {string} confirmPassword
   * @returns {{ valid: boolean, message: string }}
   */
  function validatePasswordMatch(password, confirmPassword) {
    if (!confirmPassword) {
      return { valid: false, message: "Please confirm your password." };
    }
    if (password !== confirmPassword) {
      return { valid: false, message: "Passwords do not match." };
    }
    return { valid: true, message: "" };
  }

  /**
   * Validates a full name (non-empty, at least 2 characters, only letters/spaces/hyphens).
   * @param {string} name
   * @returns {{ valid: boolean, message: string }}
   */
  function validateName(name) {
    if (!name || name.trim() === "") {
      return { valid: false, message: "Name is required." };
    }
    if (name.trim().length < 2) {
      return { valid: false, message: "Name must be at least 2 characters." };
    }
    if (!/^[a-zA-Z\s\-']+$/.test(name.trim())) {
      return { valid: false, message: "Name can only contain letters, spaces, hyphens, and apostrophes." };
    }
    return { valid: true, message: "" };
  }

  // ── DOM helpers ────────────────────────────────────────────────────────────

  /**
   * Queries a single element within a given root (defaults to document).
   * Throws a descriptive error if the element is not found, making bugs obvious.
   * @param {string}       selector  CSS selector
   * @param {Element|Document} [root] Defaults to document
   * @returns {Element}
   */
  function qs(selector, root = document) {
    const el = root.querySelector(selector);
    if (!el) throw new Error(`[Helpers.qs] Element not found: "${selector}"`);
    return el;
  }

  /**
   * Sets the error message for a form field and marks the input as invalid.
   * @param {string} fieldId  The input element's id
   * @param {string} message  Error text to show (pass "" to clear the error)
   */
  function setFieldError(fieldId, message) {
    const input    = document.getElementById(fieldId);
    const errorEl  = document.getElementById(`${fieldId}-error`);
    if (!input || !errorEl) return;

    if (message) {
      input.classList.add("input--error");
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    } else {
      input.classList.remove("input--error");
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
  }

  /**
   * Clears all error states on the named fields.
   * @param {string[]} fieldIds
   */
  function clearFieldErrors(fieldIds) {
    fieldIds.forEach((id) => setFieldError(id, ""));
  }

  /**
   * Shows or hides a global alert banner on the page.
   * @param {string} alertId  The element id of the alert container
   * @param {string} message  Text to show (pass "" to hide the alert)
   * @param {"error"|"success"|"warning"} [type="error"]
   */
  function setAlert(alertId, message, type = "error") {
    const el = document.getElementById(alertId);
    if (!el) return;

    if (message) {
      el.textContent       = message;
      el.className         = `alert alert--${type}`;
      el.classList.remove("hidden");
    } else {
      el.textContent = "";
      el.classList.add("hidden");
    }
  }

  /**
   * Puts a button into a loading state (disabled + spinner text).
   * @param {string}  btnId
   * @param {boolean} loading
   * @param {string}  [loadingText="Loading…"]
   * @param {string}  [defaultText="Submit"]
   */
  function setButtonLoading(btnId, loading, loadingText = "Loading…", defaultText = "Submit") {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.disabled   = loading;
    btn.innerHTML  = loading
      ? `<span class="spinner"></span> ${loadingText}`
      : defaultText;
    btn.classList.toggle("btn--loading", loading);
  }

  // ── String utilities ───────────────────────────────────────────────────────

  /**
   * Capitalises the first letter of every word in a string.
   * @param {string} str
   * @returns {string}
   */
  function titleCase(str) {
    return str.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Trims whitespace and returns null for empty strings.
   * Useful for normalising form input before sending to the API.
   * @param {string|null|undefined} value
   * @returns {string|null}
   */
  function normalise(value) {
    const trimmed = (value || "").trim();
    return trimmed === "" ? null : trimmed;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateName,
    qs,
    setFieldError,
    clearFieldErrors,
    setAlert,
    setButtonLoading,
    titleCase,
    normalise,
  };
})();
