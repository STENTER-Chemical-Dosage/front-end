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

    // Searchable chemical picker options - use real DB chemicals from chemRegistry.
    var chemRegistry = s.chemRegistry || [];
    var selectedChem = chemRegistry.find(function (c) {
      return String(c.chemical_id || "") === String(s.selectedChemicalId || "");
    });
    if (!selectedChem && s.selectedChemical) {
      selectedChem = chemRegistry.find(function (c) {
        return String(c.chemical_name || "") === String(s.selectedChemical || "");
      });
    }
    var selectedChemLabel = selectedChem
      ? String(selectedChem.chemical_id || "") + " - " + String(selectedChem.chemical_name || "")
      : (s.chemicalSearch || "");
    var chemOpts = "";
    if (chemRegistry.length === 0) {
      chemOpts =
        '<div id="chem-picker-empty" style="padding:12px 14px;font-size:13px;color:' + H.MUTED + '">' +
        (s.chemRegistryLoading ? "Loading chemicals..." : "No chemicals found.") +
        "</div>";
    } else {
      chemOpts = chemRegistry.map(function (c) {
        var id = String(c.chemical_id || "");
        var name = String(c.chemical_name || "");
        var searchText = (id + " " + name).toLowerCase();
        var isSelected = selectedChem && String(selectedChem.chemical_id || "") === id;
        return (
          '<button type="button" data-chem-option data-chem-id="' + H.escape(id) + '" data-chem-name="' + H.escape(name) + '" data-search="' + H.escape(searchText) + '"' +
          ' style="width:100%;display:flex;gap:10px;align-items:center;text-align:left;padding:10px 12px;border:none;background:' + (isSelected ? H.ACCENT_LIGHT : H.CARD) +
          ';cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + '">' +
          '<span style="min-width:58px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(id) + "</span>" +
          '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px">' + H.escape(name) + "</span>" +
          "</button>"
        );
      }).join("") +
        '<div id="chem-picker-empty" style="display:none;padding:12px 14px;font-size:13px;color:' + H.MUTED + '">No matching chemical.</div>';
    }

    // Chemical table rows
    var chemRows = "";
    s.chemicals.forEach(function (c, i) {
      chemRows +=
        "<tr>" +
        '<td style="padding:8px 12px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;border-bottom:1px solid ' + H.BORDER + '">' + H.escape(c.chemical_id || "") + "</td>" +
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
        '<th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Chemical ID</th>' +
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
      '<div id="chem-combobox" style="position:relative">' +
      '<input id="inp-chem-search" type="text" value="' + H.escape(selectedChemLabel) +
      '" placeholder="Search by chemical ID or name" autocomplete="off" style="' +
      H.styles.input(false) + ';padding-right:44px" />' +
      '<input id="inp-chem-select" type="hidden" value="' + H.escape(s.selectedChemicalId || "") + '" />' +
      '<button id="btn-chem-picker-toggle" type="button" aria-label="Show chemicals" style="position:absolute;right:6px;top:6px;width:32px;height:32px;border:none;background:transparent;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer">' +
      H.icons.chevronDown(16, H.MUTED) + "</button>" +
      '<div id="chem-picker-menu" style="display:none;position:absolute;top:48px;left:0;right:0;max-height:240px;overflow:auto;background:' + H.CARD +
      ';border:1px solid ' + H.BORDER + ';border-radius:8px;box-shadow:0 12px 28px rgba(0,0,0,0.14);z-index:50">' +
      chemOpts +
      "</div>" +
      "</div>" +
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
