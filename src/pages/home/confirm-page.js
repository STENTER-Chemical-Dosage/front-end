/**
 * src/pages/home/confirm-page.js — Page 2: Confirm Details
 *
 * Renders a read-only review of all entered data before processing.
 * Shows batch number, type, stenter, dimensions, and chemicals.
 *
 * Depends on: HomeApp (constants.js), HomeApp.icons, HomeApp.styles, HomeApp.renderNavbar
 */

(function () {
  var H = window.HomeApp;

  function renderConfirmPage() {
    var s = H.getState();
    var isSimple = s.activeTab === "simple";

    function row(label, value) {
      var display = value
        ? value
        : '<span style="font-style:italic;color:' + H.MUTED + '">Auto (from system)</span>';
      return (
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid ' + H.BORDER + '">' +
        '<span style="font-size:14px;font-weight:600;color:' + H.MUTED + '">' + label + "</span>" +
        '<span style="font-size:14px;font-family:\'IBM Plex Mono\',monospace;color:' + H.TEXT + '">' + display + "</span>" +
        "</div>"
      );
    }

    function badge(text) {
      return (
        '<span style="display:inline-block;padding:2px 12px;border-radius:999px;background:' + H.ACCENT_LIGHT +
        ";color:" + H.ACCENT + ';font-size:13px;font-weight:600">' + text + "</span>"
      );
    }

    var chemDisplay = "";
    if (s.chemicals.length > 0) {
      chemDisplay = s.chemicals
        .map(function (c) {
          return H.escape(c.name) + " (" + c.percentage + "%)";
        })
        .join(", ");
    }

    return (
      '<div style="min-height:100vh;background:' + H.BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + H.TEXT + '">' +
      H.renderNavbar() +
      '<main style="max-width:720px;margin:0 auto;padding:32px 24px">' +
      '<div style="background:' + H.CARD + ";border:1px solid " + H.BORDER + ';border-radius:12px;padding:28px 32px">' +
      '<h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:' + H.TEXT + '">Confirm Details</h2>' +
      (isSimple ? '<div style="margin-bottom:14px;padding:10px 14px;background:' + H.ACCENT_LIGHT + ';border-radius:8px;font-size:13px;color:' + H.ACCENT + ';font-weight:600">Data fetched from database for batch ' + H.escape(s.batchNumber) + '</div>' : '') +
      row("Batch Number", H.escape(s.batchNumber)) +
      row("Type", badge(s.wetDry)) +
      row("Stenter", s.stenter ? H.escape(s.stenter) : "") +
      row("GSM", s.gsm ? s.gsm + " g/m&sup2;" : "") +
      row("Width", s.width ? s.width + " cm" : "") +
      row("Length", s.length ? s.length + " m" : "") +
      row("Cloth Weight", s.clothWeight ? s.clothWeight + " kg" : "") +
      row("Chemicals", chemDisplay) +

      // Buttons
      '<div style="display:flex;gap:12px;margin-top:24px">' +
      '<button id="btn-back" style="flex:1;height:46px;background:transparent;border:1px solid ' + H.BORDER +
      ";border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;color:" + H.MUTED +
      ';cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">' +
      H.icons.arrowLeft(14, H.MUTED) + " Cancel</button>" +
      '<button id="btn-confirm" style="flex:1;height:46px;background:' + H.ACCENT +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;" +
      'font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">' +
      "Confirm " + H.icons.check(14, "#fff") + "</button>" +
      "</div>" +

      "</div></main></div>"
    );
  }

  H.renderConfirmPage = renderConfirmPage;
})();
