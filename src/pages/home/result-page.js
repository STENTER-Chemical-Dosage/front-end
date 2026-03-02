/**
 * src/pages/home/result-page.js — Page 3: Calculation Result
 *
 * Implements the STENTER Recipe Calculation Algorithm:
 *   Step 1 – Inputs: GSM (A), Width (B), Length (C), Chemicals (name, percentage)
 *   Step 2 – Fabric Factor: D = B × C
 *   Step 3 – GSM Range Multiplier (strict ranges)
 *   Step 4 – Total Bath: total_bath = D × multiplier
 *   Step 5 – T Value: T = round(total_bath / 25) × 25  (nearest 25 multiple)
 *   Step 6 – Bath Concentration: bath_concentration = T × 0.01
 *   Step 7 – Chemical Dosage: dosage = bath_concentration × percentage
 *
 * Depends on: HomeApp (constants.js), HomeApp.icons, HomeApp.styles, HomeApp.renderNavbar
 */

(function () {
  var H = window.HomeApp;

  // ── GSM Range Multiplier lookup ─────────────────────────────────────────────
  // Looks up the correct multiplier for the given GSM value and cloth type (Wet/Dry).
  // Uses the live DB registry (multiplierRegistry) when available;
  // falls back to built-in defaults if the registry hasn't loaded yet.
  function _getGsmMultiplier(gsm, wetDry, multiplierRegistry) {
    var reg = multiplierRegistry && multiplierRegistry.length > 0
      ? multiplierRegistry
      : [
          { range_min: 100, range_max: 120, wet_multiplier: 1.2, dry_multiplier: 1.2 },
          { range_min: 120, range_max: 140, wet_multiplier: 1.4, dry_multiplier: 1.4 },
          { range_min: 140, range_max: 160, wet_multiplier: 1.6, dry_multiplier: 1.6 },
          { range_min: 160, range_max: 180, wet_multiplier: 1.8, dry_multiplier: 1.8 },
          { range_min: 180, range_max: 200, wet_multiplier: 2.0, dry_multiplier: 2.0 },
        ];
    for (var i = 0; i < reg.length; i++) {
      var r     = reg[i];
      var rMin  = parseFloat(r.range_min);
      var rMax  = parseFloat(r.range_max);
      if (gsm > rMin && gsm <= rMax) {
        var mult = wetDry === "Dry"
          ? parseFloat(r.dry_multiplier)
          : parseFloat(r.wet_multiplier);
        return { multiplier: mult, range: rMin + " < gsm <= " + rMax };
      }
    }
    return null; // outside all defined ranges
  }

  function renderResultPage() {
    var s = H.getState();
    var isComplex = s.activeTab !== "simple";

    // ── Step 1: Inputs (populated from DB for simple mode, manual for complex)
    var A = parseFloat(s.gsm) || 0;       // GSM
    var B = parseFloat(s.width) || 0;     // Width (cm)
    var C = parseFloat(s.length) || 0;    // Length (m)
    var chemicals = s.chemicals && s.chemicals.length > 0
      ? s.chemicals
      : [{ name: "Standard Mix", percentage: 10 }];

    // ── Step 2: Fabric Factor ─────────────────────────────────────────────────
    var D = B * C;

    // ── Step 3: GSM Range Multiplier (from DB registry, keyed by cloth type) ──
    var gsmResult = _getGsmMultiplier(A, s.wetDry, s.multiplierRegistry);
    var multiplier = gsmResult ? gsmResult.multiplier : 0;
    var gsmRange = gsmResult ? gsmResult.range : "Out of range";

    // ── Step 4: Total Bath ────────────────────────────────────────────────────
    var totalBath = D * multiplier;

    // ── Step 5: T Value (normalize to nearest 25 multiple) ────────────────────
    var T = Math.round(totalBath / 25) * 25;

    // ── Step 6: Bath Concentration ────────────────────────────────────────────
    var bathConcentration = T * 0.01;

    // ── Step 7: Chemical Dosages ──────────────────────────────────────────────
    var chemDosages = chemicals.map(function (c) {
      var pct = parseFloat(c.percentage) || 0;
      var dosage = bathConcentration * pct;
      return { name: c.name, percentage: pct, dosage: dosage };
    });

    // ── Input Summary rows ────────────────────────────────────────────────────
    var summaryRows = [
      ["Batch Number",  H.escape(s.batchNumber)],
      ["Cloth Type",    H.escape(s.wetDry)],
      ["Stenter",       s.stenter ? H.escape(s.stenter) : "N/A"],
      ["GSM",           s.gsm ? H.escape(s.gsm) + " g/m&sup2;" : "N/A"],
      ["Width",         s.width ? H.escape(s.width) + " cm" : "N/A"],
      ["Length",        s.length ? H.escape(s.length) + " m" : "N/A"],
      ["Cloth Weight",  s.clothWeight ? H.escape(s.clothWeight) + " kg" : "N/A"],
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

    // ── Calculation Breakdown Card ────────────────────────────────────────────
    function calcRow(label, value, highlight) {
      var valStyle = "font-size:14px;font-family:'IBM Plex Mono',monospace;font-weight:" + (highlight ? "700" : "600") +
        ";color:" + (highlight ? H.ACCENT : H.TEXT);
      return (
        '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid ' + H.BORDER + '">' +
        '<span style="font-size:13px;color:' + H.MUTED + '">' + label + "</span>" +
        '<span style="' + valStyle + '">' + value + "</span>" +
        "</div>"
      );
    }

    var calcSection =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:10px;padding:16px 20px;margin-bottom:20px">' +
      '<div style="font-size:11px;font-weight:700;color:#A0ACAB;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:10px">Calculation Breakdown</div>' +
      calcRow("Fabric Factor (Width &times; Length)", D.toLocaleString() + " cm&middot;m") +
      calcRow("GSM Range", gsmRange) +
      calcRow("Multiplier", "&times; " + multiplier) +
      calcRow("Total Bath (D &times; Multiplier)", totalBath.toLocaleString()) +
      calcRow("T Value (nearest 25)", T.toLocaleString()) +
      calcRow("Bath Concentration (T &times; 0.01)", bathConcentration.toFixed(2), true) +
      "</div>";

    // ── Chemical Dosage Table ─────────────────────────────────────────────────
    var rows = chemDosages
      .map(function (c) {
        return (
          "<tr>" +
          '<td style="padding:10px 14px;font-size:14px;color:' + H.TEXT + ';border-bottom:1px solid ' + H.BORDER + '">' + H.escape(c.name) + "</td>" +
          '<td style="padding:10px 14px;font-size:14px;border-bottom:1px solid ' + H.BORDER + '">' +
            '<span style="background:' + H.ACCENT_LIGHT + ';color:' + H.ACCENT + ';font-size:12px;font-weight:600;padding:3px 8px;border-radius:4px;font-family:\'IBM Plex Mono\',monospace">' +
            c.percentage + "%</span>" +
          "</td>" +
          '<td style="padding:10px 14px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;font-weight:700;color:' + H.TEXT + ';border-bottom:1px solid ' + H.BORDER + '">' + c.dosage.toFixed(2) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    var chemTable =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:10px;overflow:hidden;margin-top:20px">' +
      '<div style="padding:14px 20px;border-bottom:1px solid ' + H.BORDER + '">' +
        '<div style="font-size:11px;font-weight:700;color:#A0ACAB;text-transform:uppercase;letter-spacing:0.07em">Chemical Dosage</div>' +
      "</div>" +
      '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:' + H.BG + '">' +
      '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Chemical Name</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Percentage (%)</th>' +
      '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Dosage</th>' +
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
      calcSection +

      // Result highlight card
      '<div style="background:' + H.ACCENT_LIGHT + ";border:2px solid " + H.ACCENT +
        ';border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:4px">' +
        '<div style="font-size:12px;font-weight:700;color:' + H.ACCENT + ';text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px">Total Bath (T Value)</div>' +
        '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:42px;font-weight:700;color:' + H.ACCENT + '">' +
          T.toLocaleString() +
        "</div>" +
        '<div style="font-size:13px;color:' + H.ACCENT + ';margin-top:6px;opacity:0.75">' +
          "Bath Concentration: " + bathConcentration.toFixed(2) +
          " &middot; GSM " + gsmRange +
          " &middot; Multiplier &times;" + multiplier +
        "</div>" +
      "</div>" +

      chemTable +
      buttons +

      "</main></div>"
    );
  }

  H.renderResultPage = renderResultPage;
})();
