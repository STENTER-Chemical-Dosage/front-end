/**
 * src/pages/home/input-page.js — Page 1: Chemical Input Form
 *
 * Renders the Simple / Complex chemical input form with:
 *  - Batch number, Wet/Dry toggle, tab switching
 *  - Complex mode: Stenter, GSM, Width, Length, Cloth Weight, Chemicals table
 *
 * Depends on: HomeApp (constants.js), HomeApp.icons, HomeApp.styles, HomeApp.renderNavbar
 */

(function () {
  var H = window.HomeApp;

  // ── Complex Input Fields (sub-section of Input page) ───────────────────────
  function _renderComplexFields() {
    var s = H.getState();
    var errors = s.errors || {};

    // Stenter dropdown
    var stenterOpts = ["Stenter 2", "Stenter 3"]
      .map(function (v) {
        return '<option value="' + v + '"' + (s.stenter === v ? " selected" : "") + ">" + v + "</option>";
      })
      .join("");

    // Chemical dropdown options — use real DB chemicals from chemRegistry
    var chemList = (s.chemRegistry || []).map(function (c) { return c.chemical_name; });
    if (chemList.length === 0) chemList = ["(loading chemicals…)"];
    var chemOpts = chemList.map(function (c) {
      return '<option value="' + H.escape(c) + '"' + (s.selectedChemical === c ? " selected" : "") + ">" + H.escape(c) + "</option>";
    }).join("");

    // Chemical table rows
    var chemRows = "";
    s.chemicals.forEach(function (c, i) {
      chemRows +=
        "<tr>" +
        '<td style="padding:8px 12px;font-size:14px;border-bottom:1px solid ' + H.BORDER + '">' + H.escape(c.name) + "</td>" +
        '<td style="padding:8px 12px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;border-bottom:1px solid ' + H.BORDER + '">' + c.density + " g/L</td>" +
        '<td style="padding:8px 12px;text-align:center;border-bottom:1px solid ' + H.BORDER + '">' +
        '<button data-remove-chem="' + i + '" style="background:none;border:none;cursor:pointer;color:' + H.DANGER + ';font-size:18px;line-height:1;padding:2px 6px">&times;</button>' +
        "</td></tr>";
    });

    var chemTable = "";
    if (s.chemicals.length > 0) {
      chemTable =
        '<table style="width:100%;border-collapse:collapse;margin-top:12px;border:1px solid ' + H.BORDER + ';border-radius:8px;overflow:hidden">' +
        '<thead><tr style="background:' + H.BG + '">' +
        '<th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Chemical Name</th>' +
        '<th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Density (g/L)</th>' +
        '<th style="padding:8px 12px;text-align:center;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '"></th>' +
        "</tr></thead><tbody>" + chemRows + "</tbody></table>";
    }

    return (
      // Stenter
      '<div style="margin-bottom:18px">' +
      '<label style="' + H.styles.label() + '">Stenter</label>' +
      '<select id="inp-stenter" style="' + H.styles.input(false) + '">' + stenterOpts + "</select>" +
      "</div>" +

      // Number fields grid (2 cols)
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">' +

      // GSM
      "<div>" +
      '<label style="' + H.styles.label() + '">GSM (g/m&sup2;)</label>' +
      '<input id="inp-gsm" type="number" value="' + H.escape(s.gsm) + '" placeholder="0" style="' + H.styles.monoInput(errors.gsm) + '" />' +
      (errors.gsm ? '<div style="' + H.styles.err() + '">' + errors.gsm + "</div>" : "") +
      "</div>" +

      // Width
      "<div>" +
      '<label style="' + H.styles.label() + '">Width (cm)</label>' +
      '<input id="inp-width" type="number" value="' + H.escape(s.width) + '" placeholder="0" style="' + H.styles.monoInput(errors.width) + '" />' +
      (errors.width ? '<div style="' + H.styles.err() + '">' + errors.width + "</div>" : "") +
      "</div>" +

      // Length
      "<div>" +
      '<label style="' + H.styles.label() + '">Length (m)</label>' +
      '<input id="inp-length" type="number" value="' + H.escape(s.length) + '" placeholder="0" style="' + H.styles.monoInput(errors.length) + '" />' +
      (errors.length ? '<div style="' + H.styles.err() + '">' + errors.length + "</div>" : "") +
      "</div>" +

      // Cloth Weight
      "<div>" +
      '<label style="' + H.styles.label() + '">Weight (kg)</label>' +
      '<input id="inp-weight" type="number" value="' + H.escape(s.clothWeight) + '" placeholder="0" style="' + H.styles.monoInput(errors.clothWeight) + '" />' +
      (errors.clothWeight ? '<div style="' + H.styles.err() + '">' + errors.clothWeight + "</div>" : "") +
      "</div>" +

      "</div>" +

      // Chemicals section
      '<div style="margin-bottom:18px">' +
      '<label style="' + H.styles.label() + '">Chemicals</label>' +
      '<div style="display:flex;gap:10px;align-items:flex-end">' +
      '<div style="flex:2">' +
      '<select id="inp-chem-select" style="' + H.styles.input(false) + '">' + chemOpts + "</select>" +
      "</div>" +
      '<div style="flex:1">' +
      '<input id="inp-chem-density" type="number" value="' + H.escape(s.chemicalDensity) +
      '" placeholder="Density (g/L)" style="' + H.styles.monoInput(errors.chemicalDensity) + '" />' +
      "</div>" +
      '<button id="btn-add-chem" style="height:44px;padding:0 18px;background:' + H.ACCENT +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
      'font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px">' +
      H.icons.plus(14, "#fff") + " Add</button>" +
      "</div>" +
      (errors.chemicals ? '<div style="' + H.styles.err() + '">' + errors.chemicals + "</div>" : "") +
      (errors.chemicalDensity ? '<div style="' + H.styles.err() + '">' + errors.chemicalDensity + "</div>" : "") +
      chemTable +
      "</div>"
    );
  }

  // ── Main Input Page Renderer ───────────────────────────────────────────────
  function renderInputPage() {
    var s = H.getState();
    var errors = s.errors || {};
    var isSimple = s.activeTab === "simple";

    var tabBtnStyle = function (active) {
      return (
        "flex:1;padding:10px;border:none;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
        "font-weight:600;cursor:pointer;background:" + (active ? H.ACCENT : "transparent") +
        ";color:" + (active ? "#fff" : H.MUTED)
      );
    };

    var toggleBtnStyle = function (active) {
      return (
        "padding:8px 24px;border:none;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
        "font-weight:600;cursor:pointer;background:" + (active ? H.ACCENT : "transparent") +
        ";color:" + (active ? "#fff" : H.MUTED)
      );
    };

    var html =
      '<div style="min-height:100vh;background:' + H.BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + H.TEXT + '">' +
      H.renderNavbar() +
      '<main style="max-width:720px;margin:0 auto;padding:32px 24px">' +
      '<div style="background:' + H.CARD + ";border:1px solid " + H.BORDER + ';border-radius:12px;padding:28px 32px">' +

      // Tabs
      '<div style="display:flex;gap:0;margin-bottom:24px;border-radius:8px;overflow:hidden;border:1px solid ' + H.BORDER + '">' +
      '<button data-tab="simple" style="' + tabBtnStyle(isSimple) + '">Simple Input</button>' +
      '<button data-tab="complex" style="' + tabBtnStyle(!isSimple) + '">Complex Input</button>' +
      "</div>" +

      // Batch Number
      '<div style="margin-bottom:18px">' +
      '<label style="' + H.styles.label() + '">Batch Number</label>' +
      '<input id="inp-batch" type="text" value="' + H.escape(s.batchNumber) +
      '" placeholder="Enter batch number" style="' + H.styles.input(errors.batchNumber) + '" />' +
      (errors.batchNumber ? '<div style="' + H.styles.err() + '">' + errors.batchNumber + "</div>" : "") +
      "</div>" +

      // Wet / Dry Toggle
      '<div style="margin-bottom:18px">' +
      '<label style="' + H.styles.label() + '">Type</label>' +
      '<div style="display:flex;gap:0;border-radius:8px;overflow:hidden;border:1px solid ' + H.BORDER + ';width:fit-content">' +
      '<button data-wetdry="Wet" style="' + toggleBtnStyle(s.wetDry === "Wet") + '">Wet</button>' +
      '<button data-wetdry="Dry" style="' + toggleBtnStyle(s.wetDry === "Dry") + '">Dry</button>' +
      "</div>" +
      "</div>";

    // Complex fields
    if (!isSimple) {
      html += _renderComplexFields();
    }

    // Process button (shows loading state when fetching batch from DB)
    var isFetching = s.fetchingBatch;
    html +=
      '<button id="btn-process"' + (isFetching ? ' disabled' : '') +
      ' style="display:flex;align-items:center;gap:8px;justify-content:center;' +
      "margin-top:24px;width:100%;height:46px;background:" + (isFetching ? H.MUTED : H.ACCENT) +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;" +
      'font-weight:600;cursor:' + (isFetching ? 'not-allowed' : 'pointer') + '">' +
      (isFetching
        ? "Fetching batch data\u2026"
        : "Process " + H.icons.arrowRight(14, "#fff")) +
      "</button>" +
      "</div></main></div>";

    return html;
  }

  H.renderInputPage = renderInputPage;
})();
