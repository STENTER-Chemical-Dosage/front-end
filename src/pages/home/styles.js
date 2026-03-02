/**
 * src/pages/home/styles.js — Shared Style Builder Functions
 *
 * Provides reusable inline-style generators for inputs, labels, and
 * error messages used across multiple LiqCalc pages.
 *
 * Depends on: HomeApp (constants.js)
 */

(function () {
  var H = window.HomeApp;

  function inputStyle(hasError) {
    return (
      "width:100%;box-sizing:border-box;height:44px;padding:0 14px;" +
      "border:1px solid " + (hasError ? H.DANGER : H.BORDER) + ";" +
      "border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
      "color:" + H.TEXT + ";outline:none;background:" + H.CARD
    );
  }

  function monoInputStyle(hasError) {
    return (
      "width:100%;box-sizing:border-box;height:44px;padding:0 14px;" +
      "border:1px solid " + (hasError ? H.DANGER : H.BORDER) + ";" +
      "border-radius:8px;font-family:'IBM Plex Mono',monospace;font-size:14px;" +
      "color:" + H.TEXT + ";outline:none;background:" + H.CARD
    );
  }

  function labelStyle() {
    return "display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:" + H.MUTED;
  }

  function errStyle() {
    return "color:" + H.DANGER + ";font-size:12px;margin-top:4px";
  }

  // Expose on HomeApp
  H.styles = {
    input: inputStyle,
    monoInput: monoInputStyle,
    label: labelStyle,
    err: errStyle,
  };
})();
