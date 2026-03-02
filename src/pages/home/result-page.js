/**
 * src/pages/home/result-page.js — Page 3: Calculation Result
 *
 * Displays the total bath calculation and chemical breakdown table
 * after the user confirms their input.
 *
 * Depends on: HomeApp (constants.js), HomeApp.icons, HomeApp.styles, HomeApp.renderNavbar
 */

(function () {
  var H = window.HomeApp;

  function renderResultPage() {
    var s = H.getState();
    var isComplex = s.activeTab !== "simple";
    var liquorRatio = 10;
    var weight = isComplex ? (parseFloat(s.clothWeight) || 0) : 100;
    var bathLiters = isComplex ? Math.round(weight * liquorRatio) : 1000;

    var auto = '<span style="font-style:italic;color:' + H.MUTED + '">Auto</span>';

    // ── Input Summary rows ────────────────────────────────────────────────────
    var summaryRows = [
      ["Batch Number",  H.escape(s.batchNumber)],
      ["Cloth Type",    H.escape(s.wetDry)],
      ["Stenter",       isComplex ? H.escape(s.stenter)          : auto],
      ["GSM",           isComplex ? H.escape(s.gsm) + " g/m&sup2;" : auto],
      ["Width",         isComplex ? H.escape(s.width) + " cm"    : auto],
      ["Length",        isComplex ? H.escape(s.length) + " m"    : auto],
      ["Cloth Weight",  isComplex ? H.escape(s.clothWeight) + " kg" : auto],
    ]
      .map(function (pair) {
        return (
          '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid ' + H.BORDER + '">' +
          '<span style="font-size:13px;color:' + H.MUTED + '">' + pair[0] + "</span>" +
          '<span style="font-size:13px;font-weight:600;color:' + H.TEXT + '">' + pair[1] + "</span>" +
          "</div>"
        );
      })
      .join("");

    var summarySection =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:10px;padding:16px 20px;margin-bottom:20px">' +
      '<div style="font-size:11px;font-weight:700;color:#A0ACAB;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">Input Summary</div>' +
      summaryRows +
      "</div>";

    // ── Chemical breakdown ────────────────────────────────────────────────────
    var chemicals = s.chemicals && s.chemicals.length > 0
      ? s.chemicals
      : [{ name: "Standard Mix", density: "20" }];

    var rows = chemicals
      .map(function (c) {
        var amount = Math.round(parseFloat(c.density) * bathLiters).toLocaleString();
        return (
          "<tr>" +
          '<td style="padding:10px 14px;font-size:14px;color:' + H.TEXT + ';border-bottom:1px solid ' + H.BORDER + '">' + H.escape(c.name) + "</td>" +
          '<td style="padding:10px 14px;font-size:14px;border-bottom:1px solid ' + H.BORDER + '">' +
            '<span style="background:' + H.ACCENT_LIGHT + ';color:' + H.ACCENT + ';font-size:12px;font-weight:600;padding:3px 8px;border-radius:4px;font-family:\'IBM Plex Mono\',monospace">' +
            H.escape(String(c.density)) + " g/L</span>" +
          "</td>" +
          '<td style="padding:10px 14px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;font-weight:700;color:' + H.TEXT + ';border-bottom:1px solid ' + H.BORDER + '">' + amount + " g</td>" +
          "</tr>"
        );
      })
      .join("");

    var chemTable =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:10px;overflow:hidden;margin-top:20px">' +
      '<div style="padding:14px 20px;border-bottom:1px solid ' + H.BORDER + '">' +
        '<div style="font-size:11px;font-weight:700;color:#A0ACAB;text-transform:uppercase;letter-spacing:0.07em">Chemical Breakdown</div>' +
      "</div>" +
      '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:' + H.BG + '">' +
      '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Chemical Name</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Density (g/L)</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Required Amount (g)</th>' +
      "</tr></thead><tbody>" + rows + "</tbody></table>" +
      "</div>";

    // ── Buttons ───────────────────────────────────────────────────────────────
    var buttons =
      '<div style="display:flex;gap:12px;margin-top:24px">' +
      '<button id="btn-cancel-result"' +
        ' onmouseover="this.style.background=\'#F0F2F5\'"' +
        ' onmouseout="this.style.background=\'transparent\'"' +
        ' style="flex:1;height:46px;background:transparent;border:1px solid ' + H.BORDER +
        ";border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;color:" + H.MUTED +
        ';cursor:pointer;transition:background 0.15s">' +
        "&#x2715; Cancel" +
      "</button>" +
      '<button id="btn-submit-result"' +
        ' onmouseover="this.style.background=\'#153D6B\'"' +
        ' onmouseout="this.style.background=\'' + H.SUCCESS + '\'"' +
        ' style="flex:1;height:46px;background:' + H.SUCCESS +
        ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;" +
        'font-weight:600;cursor:pointer;transition:background 0.15s">' +
        "&#x2713; Submit Record" +
      "</button>" +
      "</div>";

    return (
      '<div style="min-height:100vh;background:' + H.BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + H.TEXT + '">' +
      H.renderNavbar() +
      '<main style="max-width:720px;margin:0 auto;padding:32px 24px">' +

      // Page title
      '<div style="display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700;color:' + H.TEXT + ';margin-bottom:24px">' +
        '<svg width="22" height="22" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" viewBox="0 0 24 24">' +
          '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>' +
        "</svg>" +
        "Calculation Result" +
      "</div>" +

      summarySection +

      // Result highlight card
      '<div style="background:' + H.ACCENT_LIGHT + ";border:2px solid " + H.ACCENT +
        ';border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:4px">' +
        '<div style="font-size:12px;font-weight:700;color:' + H.ACCENT + ';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Total Bath Required</div>' +
        '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:42px;font-weight:700;color:' + H.ACCENT + '">' +
          bathLiters.toLocaleString() +
          ' <span style="font-size:22px;font-weight:600">Liters</span>' +
        "</div>" +
        '<div style="font-size:13px;color:' + H.ACCENT + ';margin-top:4px;opacity:0.75">' +
          "Calculated at " + liquorRatio + ":1 liquor ratio &middot; " +
          (isComplex ? H.escape(s.clothWeight) + " kg cloth weight" : "standard estimate") +
        "</div>" +
      "</div>" +

      chemTable +
      buttons +

      "</main></div>"
    );
  }

  H.renderResultPage = renderResultPage;
})();
