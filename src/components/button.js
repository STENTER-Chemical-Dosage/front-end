/**
 * src/components/button.js — Button Component
 *
 * Generates HTML strings for consistently styled buttons.
 * All buttons automatically pick up the .btn styles from global.css.
 *
 * SIGNATURE:
 *   ButtonComponent.render({ id, label, variant, type, disabled })
 *   → HTML string
 *
 * VARIANTS:
 *  - "primary"  (default) — filled blue, full-width
 *  - "ghost"              — outlined, used for secondary actions
 *
 * HOW TO EXTEND:
 *  - Add new variants by adding a CSS class in global.css (.btn--danger, etc.)
 *    and mapping them in the `variant` switch below.
 *  - Add an `icon` option to prepend an SVG or emoji inside the button.
 */

window.ButtonComponent = (() => {
  /**
   * Renders a button as an HTML string.
   *
   * @param {Object} opts
   * @param {string}  opts.id              — Unique element id
   * @param {string}  opts.label           — Button text content
   * @param {"primary"|"ghost"} [opts.variant="primary"]
   * @param {"button"|"submit"|"reset"}    [opts.type="button"]
   * @param {boolean} [opts.disabled=false]
   * @returns {string} HTML string
   */
  function render({ id, label, variant = "primary", type = "button", disabled = false }) {
    const disabledAttr = disabled ? "disabled" : "";
    return `
      <button
        id="${id}"
        type="${type}"
        class="btn btn--${variant}"
        ${disabledAttr}
      >${label}</button>`.trim();
  }

  return { render };
})();
