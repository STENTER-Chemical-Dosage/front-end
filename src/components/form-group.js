/**
 * src/components/form-group.js — Form Group Component
 *
 * Generates the HTML string for a labelled input field with an inline
 * error message slot. Keeps page templates lean and consistent.
 *
 * SIGNATURE:
 *   FormGroup.render({ id, label, type, placeholder, autocomplete, required })
 *   → HTML string
 *
 * HOW TO EXTEND:
 *  - Add a `hint` option to render a sub-label hint below the input.
 *  - Add a `prefix` / `suffix` option to render icon badges inside the input.
 *  - For textarea support, add a `multiline: true` option and render a <textarea>.
 *
 * USAGE IN A PAGE:
 *   container.innerHTML += FormGroup.render({
 *     id         : "email",
 *     label      : "Email Address",
 *     type       : "email",
 *     placeholder: "you@example.com",
 *   });
 */

window.FormGroup = (() => {
  /**
   * Renders a form group (label + input + error slot) as an HTML string.
   *
   * @param {Object} opts
   * @param {string}  opts.id            — Unique id for the <input> and its <label>
   * @param {string}  opts.label         — Display label text
   * @param {string}  [opts.type="text"] — HTML input type
   * @param {string}  [opts.placeholder] — Placeholder text
   * @param {string}  [opts.autocomplete]— autocomplete attribute value
   * @param {boolean} [opts.required]    — Adds HTML required attribute
   * @param {string}  [opts.value]       — Pre-filled value
   * @returns {string} HTML string
   */
  function render({ id, label, type = "text", placeholder = "", autocomplete = "", required = false, value = "" }) {
    const reqAttr   = required    ? "required"                        : "";
    const acAttr    = autocomplete ? `autocomplete="${autocomplete}"` : "";
    const valueAttr = value        ? `value="${_escape(value)}"`      : "";

    return `
      <div class="form-group">
        <label for="${id}">${_escape(label)}${required ? ' <span aria-hidden="true" style="color:var(--color-error)">*</span>' : ""}</label>
        <input
          id="${id}"
          name="${id}"
          type="${type}"
          placeholder="${_escape(placeholder)}"
          ${acAttr}
          ${reqAttr}
          ${valueAttr}
        />
        <span id="${id}-error" class="form-group__error hidden" role="alert" aria-live="polite"></span>
      </div>`.trim();
  }

  /**
   * Minimal HTML-escape to prevent XSS from injected attribute/text values.
   * Only used for values coming from outside (labels / placeholders are static
   * in this project, but it's a good habit to escape them anyway).
   * @param {string} str
   * @returns {string}
   */
  function _escape(str) {
    return String(str)
      .replace(/&/g,  "&amp;")
      .replace(/"/g,  "&quot;")
      .replace(/</g,  "&lt;")
      .replace(/>/g,  "&gt;");
  }

  return { render };
})();
