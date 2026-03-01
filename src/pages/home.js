/**
 * src/pages/home.js — LiqCalc: Textile Bath Liquid Calculator
 *
 * Full LiqCalc application rendered after login.
 * Manages 3 pages (Input → Confirm → Result) + Admin Dashboard.
 * All state is managed internally. No external dependencies except AuthGuard/Router.
 *
 * Pages:
 *  1. Input   — Simple or Complex chemical input form
 *  2. Confirm — Review entered details before processing
 *  3. Result  — Total bath calculation + chemical breakdown
 *  Admin      — Dashboard with SVG charts showing 30-day usage data
 */

window.HomePage = (() => {
  // ── Design Tokens ──────────────────────────────────────────────────────────
  const ACCENT = "#1A4F8A";
  const ACCENT_LIGHT = "#E8EFF8";
  const ACCENT_HOVER = "#153D6B";
  const BG = "#F4F5F7";
  const CARD = "#FFFFFF";
  const BORDER = "#DDE1E7";
  const TEXT = "#1C2B2A";
  const MUTED = "#6B7A79";
  const DANGER = "#C0392B";
  const SUCCESS = "#1A4F8A";

  const CHEM_COLORS = ["#1A4F8A", "#3B82F6", "#60A5FA", "#1E40AF", "#6366F1", "#0EA5E9"];
  const CHEMICAL_LIST = [
    "Softener A",
    "Fixing Agent B",
    "Bleach C",
    "Enzyme D",
    "Salt E",
    "Soda Ash F",
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  let _container = null;
  let _user = null;
  let _state = {};

  function _defaultState() {
    return {
      showAdmin: false,
      page: 1,
      activeTab: "simple",
      dropdownOpen: false,
      batchNumber: "",
      wetDry: "Wet",
      stenter: "Stenter 1",
      gsm: "",
      width: "",
      length: "",
      clothWeight: "",
      chemicals: [],
      selectedChemical: "Softener A",
      chemicalDensity: "",
      errors: {},
      adminDateMode: "single",
      adminSingleDate: _todayISO(),
      adminDateFrom: _daysAgoISO(6),
      adminDateTo: _todayISO(),
    };
  }

  function setState(updates) {
    Object.assign(_state, updates);
    _render();
  }

  // ── Date Helpers ───────────────────────────────────────────────────────────
  function _todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function _daysAgoISO(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function _escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Mock Data (30 days, deterministic sine/cosine) ─────────────────────────
  function _generateMockData() {
    const data = {};
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      data[key] = {};
      CHEMICAL_LIST.forEach((chem, idx) => {
        const base = 200 + idx * 50;
        const val =
          base +
          Math.sin((i + idx * 3) * 0.3) * 80 +
          Math.cos((i * 0.5 + idx) * 0.7) * 40;
        data[key][chem] = Math.round(Math.max(50, val));
      });
    }
    return data;
  }

  const MOCK_DATA = _generateMockData();

  // ── SVG Icons (all inline) ─────────────────────────────────────────────────
  function _flaskSvg() {
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v7l5 8a2 2 0 0 1-1.7 3H5.7A2 2 0 0 1 4 18l5-8V3z"/><line x1="9" y1="3" x2="15" y2="3"/></svg>';
  }

  function _personSvg(size, color) {
    size = size || 18;
    color = color || MUTED;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    );
  }

  function _chevronDownSvg(size, color) {
    size = size || 14;
    color = color || MUTED;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="6 9 12 15 18 9"/></svg>'
    );
  }

  function _gridSvg(size, color) {
    size = size || 16;
    color = color || MUTED;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>' +
      '<rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
    );
  }

  function _logoutSvg(size, color) {
    size = size || 16;
    color = color || DANGER;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
      '<polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
    );
  }

  function _arrowLeftSvg(size, color) {
    size = size || 16;
    color = color || "white";
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'
    );
  }

  function _arrowRightSvg(size, color) {
    size = size || 14;
    color = color || "white";
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'
    );
  }

  function _xSvg(size, color) {
    size = size || 14;
    color = color || MUTED;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    );
  }

  function _checkSvg(size, color) {
    size = size || 14;
    color = color || "white";
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="20 6 9 17 4 12"/></svg>'
    );
  }

  function _plusSvg(size, color) {
    size = size || 14;
    color = color || "white";
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    );
  }

  // ── Shared: input style builder ────────────────────────────────────────────
  function _inputStyle(hasError) {
    return (
      "width:100%;box-sizing:border-box;height:44px;padding:0 14px;" +
      "border:1px solid " + (hasError ? DANGER : BORDER) + ";" +
      "border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
      "color:" + TEXT + ";outline:none;background:" + CARD
    );
  }

  function _monoInputStyle(hasError) {
    return (
      "width:100%;box-sizing:border-box;height:44px;padding:0 14px;" +
      "border:1px solid " + (hasError ? DANGER : BORDER) + ";" +
      "border-radius:8px;font-family:'IBM Plex Mono',monospace;font-size:14px;" +
      "color:" + TEXT + ";outline:none;background:" + CARD
    );
  }

  function _labelStyle() {
    return "display:block;margin-bottom:6px;font-size:13px;font-weight:600;color:" + MUTED;
  }

  function _errStyle() {
    return "color:" + DANGER + ";font-size:12px;margin-top:4px";
  }

  // ── Navbar ─────────────────────────────────────────────────────────────────
  function _renderNavbar() {
    var dd = "";
    if (_state.dropdownOpen) {
      dd =
        '<div id="dropdown-menu" style="position:absolute;top:46px;right:0;background:' + CARD +
        ";border:1px solid " + BORDER + ";border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.08);" +
        'min-width:210px;padding:6px 0;z-index:200">' +
        '<button class="dd-item" data-action="profile" style="display:flex;align-items:center;gap:10px;width:100%;' +
        "padding:10px 16px;border:none;background:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;" +
        'font-size:14px;color:' + TEXT + ';text-align:left">' +
        _personSvg(16, MUTED) + " My Profile</button>" +
        '<button class="dd-item" data-action="admin" style="display:flex;align-items:center;gap:10px;width:100%;' +
        "padding:10px 16px;border:none;background:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;" +
        'font-size:14px;color:' + TEXT + ';text-align:left">' +
        _gridSvg(16, MUTED) + " Admin Dashboard</button>" +
        '<div style="height:1px;background:' + BORDER + ';margin:4px 0"></div>' +
        '<button class="dd-item" data-action="signout" style="display:flex;align-items:center;gap:10px;width:100%;' +
        "padding:10px 16px;border:none;background:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;" +
        'font-size:14px;color:' + DANGER + ';text-align:left">' +
        _logoutSvg(16, DANGER) + " Sign Out</button>" +
        "</div>";
    }

    return (
      '<nav style="display:flex;align-items:center;justify-content:space-between;padding:0 24px;' +
      "height:56px;background:" + CARD + ";border-bottom:1px solid " + BORDER + ";position:relative;z-index:100" +
      '">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<div style="width:34px;height:34px;background:' + ACCENT +
      ';border-radius:8px;display:flex;align-items:center;justify-content:center">' +
      _flaskSvg() +
      "</div>" +
      "<span style=\"font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:18px;color:" +
      TEXT + '">LiqCalc</span>' +
      "</div>" +
      '<div style="position:relative">' +
      '<button id="avatar-btn" style="display:flex;align-items:center;gap:6px;background:none;border:1px solid ' +
      BORDER + ";border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;color:" +
      TEXT + '">' +
      _personSvg(18, MUTED) +
      _chevronDownSvg(14, MUTED) +
      "</button>" +
      dd +
      "</div>" +
      "</nav>"
    );
  }

  // ── Page 1: Input Page ─────────────────────────────────────────────────────
  function _renderInputPage() {
    var s = _state;
    var errors = s.errors || {};
    var isSimple = s.activeTab === "simple";

    var tabBtnStyle = function (active) {
      return (
        "flex:1;padding:10px;border:none;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
        "font-weight:600;cursor:pointer;background:" + (active ? ACCENT : "transparent") +
        ";color:" + (active ? "#fff" : MUTED)
      );
    };

    var toggleBtnStyle = function (active) {
      return (
        "padding:8px 24px;border:none;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
        "font-weight:600;cursor:pointer;background:" + (active ? ACCENT : "transparent") +
        ";color:" + (active ? "#fff" : MUTED)
      );
    };

    var html =
      '<div style="min-height:100vh;background:' + BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + TEXT + '">' +
      _renderNavbar() +
      '<main style="max-width:720px;margin:0 auto;padding:32px 24px">' +
      '<div style="background:' + CARD + ";border:1px solid " + BORDER + ';border-radius:12px;padding:28px 32px">' +

      // Tabs
      '<div style="display:flex;gap:0;margin-bottom:24px;border-radius:8px;overflow:hidden;border:1px solid ' + BORDER + '">' +
      '<button data-tab="simple" style="' + tabBtnStyle(isSimple) + '">Simple Input</button>' +
      '<button data-tab="complex" style="' + tabBtnStyle(!isSimple) + '">Complex Input</button>' +
      "</div>" +

      // Batch Number
      '<div style="margin-bottom:18px">' +
      '<label style="' + _labelStyle() + '">Batch Number</label>' +
      '<input id="inp-batch" type="text" value="' + _escape(s.batchNumber) +
      '" placeholder="Enter batch number" style="' + _inputStyle(errors.batchNumber) + '" />' +
      (errors.batchNumber ? '<div style="' + _errStyle() + '">' + errors.batchNumber + "</div>" : "") +
      "</div>" +

      // Wet / Dry Toggle
      '<div style="margin-bottom:18px">' +
      '<label style="' + _labelStyle() + '">Type</label>' +
      '<div style="display:flex;gap:0;border-radius:8px;overflow:hidden;border:1px solid ' + BORDER + ';width:fit-content">' +
      '<button data-wetdry="Wet" style="' + toggleBtnStyle(s.wetDry === "Wet") + '">Wet</button>' +
      '<button data-wetdry="Dry" style="' + toggleBtnStyle(s.wetDry === "Dry") + '">Dry</button>' +
      "</div>" +
      "</div>";

    // Complex fields
    if (!isSimple) {
      html += _renderComplexFields();
    }

    // Process button
    html +=
      '<button id="btn-process" style="display:flex;align-items:center;gap:8px;justify-content:center;' +
      "margin-top:24px;width:100%;height:46px;background:" + ACCENT +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;" +
      'font-weight:600;cursor:pointer">' +
      "Process " + _arrowRightSvg(14, "#fff") +
      "</button>" +
      "</div></main></div>";

    return html;
  }

  // ── Complex Input Fields ───────────────────────────────────────────────────
  function _renderComplexFields() {
    var s = _state;
    var errors = s.errors || {};

    // Stenter dropdown
    var stenterOpts = ["Stenter 1", "Stenter 2", "Stenter 3"]
      .map(function (v) {
        return '<option value="' + v + '"' + (s.stenter === v ? " selected" : "") + ">" + v + "</option>";
      })
      .join("");

    // Chemical dropdown options
    var chemOpts = CHEMICAL_LIST.map(function (c) {
      return '<option value="' + c + '"' + (s.selectedChemical === c ? " selected" : "") + ">" + c + "</option>";
    }).join("");

    // Chemical table rows
    var chemRows = "";
    s.chemicals.forEach(function (c, i) {
      chemRows +=
        "<tr>" +
        '<td style="padding:8px 12px;font-size:14px;border-bottom:1px solid ' + BORDER + '">' + _escape(c.name) + "</td>" +
        '<td style="padding:8px 12px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;border-bottom:1px solid ' + BORDER + '">' + c.density + "</td>" +
        '<td style="padding:8px 12px;text-align:center;border-bottom:1px solid ' + BORDER + '">' +
        '<button data-remove-chem="' + i + '" style="background:none;border:none;cursor:pointer;color:' + DANGER + ';font-size:18px;line-height:1;padding:2px 6px">&times;</button>' +
        "</td></tr>";
    });

    var chemTable = "";
    if (s.chemicals.length > 0) {
      chemTable =
        '<table style="width:100%;border-collapse:collapse;margin-top:12px;border:1px solid ' + BORDER + ';border-radius:8px;overflow:hidden">' +
        '<thead><tr style="background:' + BG + '">' +
        '<th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:' + MUTED + ';border-bottom:1px solid ' + BORDER + '">Chemical Name</th>' +
        '<th style="padding:8px 12px;text-align:left;font-size:12px;font-weight:600;color:' + MUTED + ';border-bottom:1px solid ' + BORDER + '">Density (g/L)</th>' +
        '<th style="padding:8px 12px;text-align:center;font-size:12px;font-weight:600;color:' + MUTED + ';border-bottom:1px solid ' + BORDER + '"></th>' +
        "</tr></thead><tbody>" + chemRows + "</tbody></table>";
    }

    return (
      // Stenter
      '<div style="margin-bottom:18px">' +
      '<label style="' + _labelStyle() + '">Stenter</label>' +
      '<select id="inp-stenter" style="' + _inputStyle(false) + '">' + stenterOpts + "</select>" +
      "</div>" +

      // Number fields grid (2 cols)
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">' +

      // GSM
      "<div>" +
      '<label style="' + _labelStyle() + '">GSM (g/m&sup2;)</label>' +
      '<input id="inp-gsm" type="number" value="' + _escape(s.gsm) + '" placeholder="0" style="' + _monoInputStyle(errors.gsm) + '" />' +
      (errors.gsm ? '<div style="' + _errStyle() + '">' + errors.gsm + "</div>" : "") +
      "</div>" +

      // Width
      "<div>" +
      '<label style="' + _labelStyle() + '">Width (cm)</label>' +
      '<input id="inp-width" type="number" value="' + _escape(s.width) + '" placeholder="0" style="' + _monoInputStyle(errors.width) + '" />' +
      (errors.width ? '<div style="' + _errStyle() + '">' + errors.width + "</div>" : "") +
      "</div>" +

      // Length
      "<div>" +
      '<label style="' + _labelStyle() + '">Length (m)</label>' +
      '<input id="inp-length" type="number" value="' + _escape(s.length) + '" placeholder="0" style="' + _monoInputStyle(errors.length) + '" />' +
      (errors.length ? '<div style="' + _errStyle() + '">' + errors.length + "</div>" : "") +
      "</div>" +

      // Cloth Weight
      "<div>" +
      '<label style="' + _labelStyle() + '">Cloth Weight (kg)</label>' +
      '<input id="inp-weight" type="number" value="' + _escape(s.clothWeight) + '" placeholder="0" style="' + _monoInputStyle(errors.clothWeight) + '" />' +
      (errors.clothWeight ? '<div style="' + _errStyle() + '">' + errors.clothWeight + "</div>" : "") +
      "</div>" +

      "</div>" +

      // Chemicals section
      '<div style="margin-bottom:18px">' +
      '<label style="' + _labelStyle() + '">Chemicals</label>' +
      '<div style="display:flex;gap:10px;align-items:flex-end">' +
      '<div style="flex:2">' +
      '<select id="inp-chem-select" style="' + _inputStyle(false) + '">' + chemOpts + "</select>" +
      "</div>" +
      '<div style="flex:1">' +
      '<input id="inp-chem-density" type="number" value="' + _escape(s.chemicalDensity) +
      '" placeholder="Density (g/L)" style="' + _monoInputStyle(errors.chemicalDensity) + '" />' +
      "</div>" +
      '<button id="btn-add-chem" style="height:44px;padding:0 18px;background:' + ACCENT +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;" +
      'font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px">' +
      _plusSvg(14, "#fff") + " Add</button>" +
      "</div>" +
      (errors.chemicals ? '<div style="' + _errStyle() + '">' + errors.chemicals + "</div>" : "") +
      (errors.chemicalDensity ? '<div style="' + _errStyle() + '">' + errors.chemicalDensity + "</div>" : "") +
      chemTable +
      "</div>"
    );
  }

  // ── Page 2: Confirm Details ────────────────────────────────────────────────
  function _renderConfirmPage() {
    var s = _state;
    var isSimple = s.activeTab === "simple";

    function row(label, value) {
      var display = value
        ? value
        : '<span style="font-style:italic;color:' + MUTED + '">Auto (from system)</span>';
      return (
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid ' + BORDER + '">' +
        '<span style="font-size:14px;font-weight:600;color:' + MUTED + '">' + label + "</span>" +
        '<span style="font-size:14px;font-family:\'IBM Plex Mono\',monospace;color:' + TEXT + '">' + display + "</span>" +
        "</div>"
      );
    }

    function badge(text) {
      return (
        '<span style="display:inline-block;padding:2px 12px;border-radius:999px;background:' + ACCENT_LIGHT +
        ";color:" + ACCENT + ';font-size:13px;font-weight:600">' + text + "</span>"
      );
    }

    var chemDisplay = "";
    if (s.chemicals.length > 0) {
      chemDisplay = s.chemicals
        .map(function (c) {
          return _escape(c.name) + " (" + c.density + " g/L)";
        })
        .join(", ");
    }

    return (
      '<div style="min-height:100vh;background:' + BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + TEXT + '">' +
      _renderNavbar() +
      '<main style="max-width:720px;margin:0 auto;padding:32px 24px">' +
      '<div style="background:' + CARD + ";border:1px solid " + BORDER + ';border-radius:12px;padding:28px 32px">' +
      '<h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:' + TEXT + '">Confirm Details</h2>' +
      row("Batch Number", _escape(s.batchNumber)) +
      row("Type", badge(s.wetDry)) +
      row("Stenter", isSimple ? "" : _escape(s.stenter)) +
      row("GSM", isSimple ? "" : s.gsm + " g/m&sup2;") +
      row("Width", isSimple ? "" : s.width + " cm") +
      row("Length", isSimple ? "" : s.length + " m") +
      row("Cloth Weight", isSimple ? "" : s.clothWeight + " kg") +
      row("Chemicals", isSimple ? "" : chemDisplay) +

      // Buttons
      '<div style="display:flex;gap:12px;margin-top:24px">' +
      '<button id="btn-back" style="flex:1;height:46px;background:transparent;border:1px solid ' + BORDER +
      ";border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;color:" + MUTED +
      ';cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">' +
      _arrowLeftSvg(14, MUTED) + " Cancel</button>" +
      '<button id="btn-confirm" style="flex:1;height:46px;background:' + ACCENT +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;" +
      'font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">' +
      "Confirm " + _checkSvg(14, "#fff") + "</button>" +
      "</div>" +

      "</div></main></div>"
    );
  }

  // ── Page 3: Result Page ────────────────────────────────────────────────────
  function _renderResultPage() {
    var s = _state;
    var isSimple = s.activeTab === "simple";
    var weight = isSimple ? 100 : parseFloat(s.clothWeight) || 100;
    var bathLiters = weight * 10;

    // Summary line
    var parts = ["Batch: " + _escape(s.batchNumber), "Type: " + s.wetDry];
    if (!isSimple) {
      parts.push(
        "Stenter: " + _escape(s.stenter),
        "GSM: " + s.gsm,
        "Width: " + s.width + "cm",
        "Length: " + s.length + "m",
        "Weight: " + s.clothWeight + "kg"
      );
    }

    // Chemical breakdown table
    var chemTable = "";
    if (s.chemicals.length > 0) {
      var rows = s.chemicals
        .map(function (c) {
          var amount = (parseFloat(c.density) * bathLiters).toFixed(1);
          return (
            "<tr>" +
            '<td style="padding:10px 14px;font-size:14px;border-bottom:1px solid ' + BORDER + '">' + _escape(c.name) + "</td>" +
            '<td style="padding:10px 14px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;border-bottom:1px solid ' + BORDER + '">' + c.density + "</td>" +
            '<td style="padding:10px 14px;font-size:14px;font-family:\'IBM Plex Mono\',monospace;font-weight:600;border-bottom:1px solid ' + BORDER + '">' + amount + " g</td>" +
            "</tr>"
          );
        })
        .join("");

      chemTable =
        '<div style="margin-top:24px">' +
        '<h3 style="font-size:16px;font-weight:700;margin:0 0 12px;color:' + TEXT + '">Chemical Breakdown</h3>' +
        '<table style="width:100%;border-collapse:collapse;border:1px solid ' + BORDER + ';border-radius:8px;overflow:hidden">' +
        '<thead><tr style="background:' + BG + '">' +
        '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + MUTED + ';border-bottom:1px solid ' + BORDER + '">Chemical Name</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + MUTED + ';border-bottom:1px solid ' + BORDER + '">Density (g/L)</th>' +
        '<th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:' + MUTED + ';border-bottom:1px solid ' + BORDER + '">Required Amount (g)</th>' +
        "</tr></thead><tbody>" + rows + "</tbody></table>" +
        "</div>";
    }

    return (
      '<div style="min-height:100vh;background:' + BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + TEXT + '">' +
      _renderNavbar() +
      '<main style="max-width:720px;margin:0 auto;padding:32px 24px">' +

      // Summary
      '<div style="font-size:13px;color:' + MUTED + ';margin-bottom:20px">' + parts.join(" &middot; ") + "</div>" +

      // Result highlight card
      '<div style="background:' + ACCENT_LIGHT + ";border:2px solid " + ACCENT +
      ';border-radius:12px;padding:28px 32px;text-align:center;margin-bottom:24px">' +
      '<div style="font-size:13px;font-weight:600;color:' + ACCENT + ';text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Total Bath Required</div>' +
      '<div style="font-family:\'IBM Plex Mono\',monospace;font-size:42px;font-weight:700;color:' + ACCENT + '">' + bathLiters.toLocaleString() + " L</div>" +
      '<div style="font-size:13px;color:' + MUTED + ';margin-top:8px">Formula: ' + weight + " kg &times; 10 (liquor ratio 10:1)</div>" +
      "</div>" +

      chemTable +

      // Buttons
      '<div style="display:flex;gap:12px;margin-top:24px">' +
      '<button id="btn-cancel-result" style="flex:1;height:46px;background:transparent;border:1px solid ' + BORDER +
      ";border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;color:" + MUTED +
      ';cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">' +
      _xSvg(14, MUTED) + " Cancel</button>" +
      '<button id="btn-submit-result" style="flex:1;height:46px;background:' + ACCENT +
      ";color:#fff;border:none;border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;" +
      'font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">' +
      _checkSvg(14, "#fff") + " Submit Record</button>" +
      "</div>" +

      "</main></div>"
    );
  }

  // ── Admin Dashboard ────────────────────────────────────────────────────────
  function _renderAdmin() {
    var s = _state;
    var dates = Object.keys(MOCK_DATA).sort();

    // Determine selected dates
    var selectedDates = [];
    if (s.adminDateMode === "single") {
      if (MOCK_DATA[s.adminSingleDate]) {
        selectedDates = [s.adminSingleDate];
      }
    } else {
      selectedDates = dates.filter(function (d) {
        return d >= s.adminDateFrom && d <= s.adminDateTo;
      });
    }

    // Aggregate chemical data across selected dates
    var aggregated = {};
    CHEMICAL_LIST.forEach(function (c) {
      aggregated[c] = 0;
    });
    selectedDates.forEach(function (d) {
      if (MOCK_DATA[d]) {
        CHEMICAL_LIST.forEach(function (c) {
          aggregated[c] += MOCK_DATA[d][c] || 0;
        });
      }
    });

    var daysBadge = s.adminDateMode === "range" ? selectedDates.length : 0;

    return (
      '<div style="min-height:100vh;background:' + BG + ";font-family:'IBM Plex Sans',sans-serif;color:" + TEXT + '">' +

      // Admin navbar
      '<nav style="display:flex;align-items:center;padding:0 24px;height:56px;background:' + CARD +
      ";border-bottom:1px solid " + BORDER + '">' +
      '<button id="btn-admin-back" style="display:flex;align-items:center;gap:8px;background:none;border:none;' +
      "cursor:pointer;font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;color:" + ACCENT + '">' +
      _arrowLeftSvg(16, ACCENT) + " Back to Calculator</button>" +
      '<span style="margin-left:16px;font-size:18px;font-weight:700;color:' + TEXT + '">Admin Dashboard</span>' +
      "</nav>" +

      '<main style="max-width:1050px;margin:0 auto;padding:28px 24px">' +
      _renderDateControls(daysBadge) +
      _renderBarChart(aggregated) +
      '<h3 style="font-size:16px;font-weight:700;color:' + TEXT + ';margin:24px 0 16px">Daily Usage Trends</h3>' +
      _renderLineCharts(dates) +
      "</main></div>"
    );
  }

  // ── Date Controls Card ─────────────────────────────────────────────────────
  function _renderDateControls(daysBadge) {
    var s = _state;
    var isSingle = s.adminDateMode === "single";

    var toggleStyle = function (active) {
      return (
        "padding:8px 20px;border:none;font-family:'IBM Plex Sans',sans-serif;font-size:13px;" +
        "font-weight:600;cursor:pointer;background:" + (active ? ACCENT : "transparent") +
        ";color:" + (active ? "#fff" : MUTED)
      );
    };

    var dateInputStyle =
      "height:44px;padding:0 14px;border:1px solid " + BORDER +
      ";border-radius:8px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;color:" + TEXT +
      ";background:" + CARD;

    var badgeHtml = "";
    if (!isSingle && daysBadge > 0) {
      badgeHtml =
        '<span style="display:inline-block;padding:2px 12px;border-radius:999px;background:' + ACCENT_LIGHT +
        ";color:" + ACCENT + ';font-size:13px;font-weight:600">' +
        daysBadge + " day" + (daysBadge !== 1 ? "s" : "") + "</span>";
    }

    var dateFields = "";
    if (isSingle) {
      dateFields = '<input id="inp-admin-single-date" type="date" value="' + s.adminSingleDate + '" style="' + dateInputStyle + '" />';
    } else {
      dateFields =
        '<div style="display:flex;gap:12px;align-items:center">' +
        "<div>" +
        '<label style="display:block;font-size:12px;font-weight:600;color:' + MUTED + ';margin-bottom:4px">From</label>' +
        '<input id="inp-admin-date-from" type="date" value="' + s.adminDateFrom + '" style="' + dateInputStyle + '" />' +
        "</div><div>" +
        '<label style="display:block;font-size:12px;font-weight:600;color:' + MUTED + ';margin-bottom:4px">To</label>' +
        '<input id="inp-admin-date-to" type="date" value="' + s.adminDateTo + '" style="' + dateInputStyle + '" />' +
        "</div></div>";
    }

    return (
      '<div style="background:' + CARD + ";border:1px solid " + BORDER + ';border-radius:12px;padding:20px 24px;margin-bottom:24px">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<div style="display:flex;gap:0;border-radius:8px;overflow:hidden;border:1px solid ' + BORDER + '">' +
      '<button data-datemode="single" style="' + toggleStyle(isSingle) + '">Single Day</button>' +
      '<button data-datemode="range" style="' + toggleStyle(!isSingle) + '">Date Range</button>' +
      "</div>" + badgeHtml +
      "</div>" + dateFields + "</div>"
    );
  }

  // ── SVG Bar Chart ──────────────────────────────────────────────────────────
  function _renderBarChart(aggregated) {
    var vals = CHEMICAL_LIST.map(function (c) { return aggregated[c]; });
    var maxVal = Math.max.apply(null, vals.concat([1]));

    var chartW = 700, chartH = 320;
    var padL = 70, padR = 20, padT = 30, padB = 60;
    var plotW = chartW - padL - padR;
    var plotH = chartH - padT - padB;
    var barGap = 16;
    var barW = (plotW - (CHEMICAL_LIST.length + 1) * barGap) / CHEMICAL_LIST.length;

    // Y-axis grid lines
    var gridCount = 5;
    var gridSvg = "";
    for (var g = 0; g <= gridCount; g++) {
      var gy = padT + plotH - (plotH * g / gridCount);
      var gval = Math.round(maxVal * g / gridCount);
      gridSvg +=
        '<line x1="' + padL + '" y1="' + gy + '" x2="' + (chartW - padR) +
        '" y2="' + gy + '" stroke="' + BORDER + '" stroke-width="1"/>';
      gridSvg +=
        '<text x="' + (padL - 8) + '" y="' + (gy + 4) +
        '" text-anchor="end" fill="' + MUTED +
        '" font-size="11" font-family="IBM Plex Mono, monospace">' + gval + "g</text>";
    }

    // Bars + labels
    var barsSvg = "";
    var legendHtml = "";
    CHEMICAL_LIST.forEach(function (chem, idx) {
      var val = aggregated[chem];
      var barH = (val / maxVal) * plotH;
      var bx = padL + barGap + idx * (barW + barGap);
      var by = padT + plotH - barH;

      barsSvg +=
        '<rect x="' + bx + '" y="' + by + '" width="' + barW +
        '" height="' + barH + '" fill="' + CHEM_COLORS[idx] + '" rx="4"/>';
      barsSvg +=
        '<text x="' + (bx + barW / 2) + '" y="' + (by - 6) +
        '" text-anchor="middle" fill="' + TEXT +
        '" font-size="11" font-family="IBM Plex Mono, monospace" font-weight="600">' + val + "g</text>";

      // X-axis label
      var shortName = chem.length > 10 ? chem.slice(0, 8) + "\u2026" : chem;
      barsSvg +=
        '<text x="' + (bx + barW / 2) + '" y="' + (padT + plotH + 20) +
        '" text-anchor="middle" fill="' + MUTED +
        '" font-size="10" font-family="IBM Plex Sans, sans-serif">' + shortName + "</text>";

      legendHtml +=
        '<div style="display:flex;align-items:center;gap:6px">' +
        '<div style="width:12px;height:12px;border-radius:3px;background:' + CHEM_COLORS[idx] + '"></div>' +
        '<span style="font-size:12px;color:' + MUTED + '">' + chem + "</span>" +
        '<span style="font-size:12px;font-family:\'IBM Plex Mono\',monospace;font-weight:600;color:' + TEXT + '">' + val + "g</span>" +
        "</div>";
    });

    return (
      '<div style="background:' + CARD + ";border:1px solid " + BORDER + ';border-radius:12px;padding:20px 24px;margin-bottom:24px">' +
      '<h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:' + TEXT + '">Chemical Usage Overview</h3>' +
      '<svg width="100%" viewBox="0 0 ' + chartW + " " + chartH + '" style="display:block">' +
      gridSvg + barsSvg +
      "</svg>" +
      '<div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:16px;justify-content:center">' + legendHtml + "</div>" +
      "</div>"
    );
  }

  // ── SVG Line Charts (2-column grid) ────────────────────────────────────────
  function _renderLineCharts(dates) {
    var charts = "";
    CHEMICAL_LIST.forEach(function (chem, idx) {
      charts += _renderSingleLineChart(chem, idx, dates);
    });
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' + charts + "</div>";
  }

  function _renderSingleLineChart(chem, idx, dates) {
    var color = CHEM_COLORS[idx];
    var values = dates.map(function (d) { return MOCK_DATA[d][chem]; });
    var todayVal = values[values.length - 1];
    var sum = 0;
    values.forEach(function (v) { sum += v; });
    var avg = Math.round(sum / values.length);
    var minV = Math.min.apply(null, values);
    var maxV = Math.max.apply(null, values);
    var midV = Math.round((minV + maxV) / 2);

    var chartW = 460, chartH = 200;
    var padL = 50, padR = 16, padT = 14, padB = 32;
    var plotW = chartW - padL - padR;
    var plotH = chartH - padT - padB;
    var rangeV = maxV - minV || 1;

    // Build points
    var points = values.map(function (v, i) {
      return {
        x: padL + (plotW * i / (values.length - 1)),
        y: padT + plotH - (plotH * (v - minV) / rangeV),
        v: v,
      };
    });

    var lineStr = points.map(function (p) { return p.x + "," + p.y; }).join(" ");
    var areaStr =
      padL + "," + (padT + plotH) + " " + lineStr + " " +
      points[points.length - 1].x + "," + (padT + plotH);

    // Y-axis labels + grid
    var yLabels = [
      { val: minV, y: padT + plotH },
      { val: midV, y: padT + plotH / 2 },
      { val: maxV, y: padT },
    ];
    var yAxisSvg = yLabels
      .map(function (l) {
        return (
          '<text x="' + (padL - 8) + '" y="' + (l.y + 4) +
          '" text-anchor="end" fill="' + MUTED +
          '" font-size="10" font-family="IBM Plex Mono, monospace">' + l.val + "</text>" +
          '<line x1="' + padL + '" y1="' + l.y + '" x2="' + (padL + plotW) +
          '" y2="' + l.y + '" stroke="' + BORDER + '" stroke-width="0.5" stroke-dasharray="3,3"/>'
        );
      })
      .join("");

    // X-axis date labels (~6 evenly spaced)
    var labelCount = 6;
    var xLabels = "";
    for (var li = 0; li < labelCount; li++) {
      var di = Math.round(li * (dates.length - 1) / (labelCount - 1));
      var lx = padL + (plotW * di / (dates.length - 1));
      var dateLabel = dates[di].slice(5); // MM-DD
      xLabels +=
        '<text x="' + lx + '" y="' + (padT + plotH + 18) +
        '" text-anchor="middle" fill="' + MUTED +
        '" font-size="9" font-family="IBM Plex Mono, monospace">' + dateLabel + "</text>";
    }

    // Dots
    var dots = points
      .map(function (p) {
        return (
          '<circle cx="' + p.x + '" cy="' + p.y +
          '" r="2.5" fill="' + color + '" stroke="white" stroke-width="1"/>'
        );
      })
      .join("");

    return (
      '<div style="background:' + CARD + ";border:1px solid " + BORDER + ';border-radius:12px;padding:16px 18px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<span style="font-size:14px;font-weight:700;color:' + TEXT + '">' + chem + "</span>" +
      '<div style="text-align:right">' +
      '<span style="font-size:11px;color:' + MUTED + '">avg </span>' +
      '<span style="font-size:12px;font-family:\'IBM Plex Mono\',monospace;font-weight:600;color:' + TEXT + '">' + avg + "g/day</span>" +
      '<span style="margin-left:8px;font-size:11px;color:' + MUTED + '">today </span>' +
      '<span style="font-size:12px;font-family:\'IBM Plex Mono\',monospace;font-weight:600;color:' + color + '">' + todayVal + "g</span>" +
      "</div></div>" +
      '<svg width="100%" viewBox="0 0 ' + chartW + " " + chartH + '" style="display:block">' +
      yAxisSvg +
      '<polygon points="' + areaStr + '" fill="' + color + '" opacity="0.1"/>' +
      '<polyline points="' + lineStr + '" fill="none" stroke="' + color + '" stroke-width="2.2"/>' +
      dots + xLabels +
      "</svg></div>"
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  function _render() {
    if (!_container) return;

    if (_state.showAdmin) {
      _container.innerHTML = _renderAdmin();
    } else {
      switch (_state.page) {
        case 1:
          _container.innerHTML = _renderInputPage();
          break;
        case 2:
          _container.innerHTML = _renderConfirmPage();
          break;
        case 3:
          _container.innerHTML = _renderResultPage();
          break;
      }
    }
    _attachEvents();
  }

  // ── Event Binding ──────────────────────────────────────────────────────────
  function _attachEvents() {
    // ── Avatar dropdown toggle ───────────────────────────────
    var avatarBtn = document.getElementById("avatar-btn");
    if (avatarBtn) {
      avatarBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        setState({ dropdownOpen: !_state.dropdownOpen });
      });
    }

    // ── Dropdown menu items ──────────────────────────────────
    document.querySelectorAll(".dd-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.dataset.action;
        if (action === "admin") {
          setState({ showAdmin: true, dropdownOpen: false });
        } else if (action === "signout") {
          AuthGuard.clearSession();
          Router.navigate("login");
        } else {
          setState({ dropdownOpen: false });
        }
      });

      // Hover effects for dropdown items
      btn.addEventListener("mouseenter", function () {
        btn.style.background = btn.dataset.action === "signout" ? "#FEF2F2" : BG;
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.background = "none";
      });
    });

    // ── Outside click → close dropdown ───────────────────────
    document.removeEventListener("click", _handleOutsideClick);
    document.addEventListener("click", _handleOutsideClick);

    // ── Tab switching ────────────────────────────────────────
    document.querySelectorAll("[data-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setState({ activeTab: btn.dataset.tab, errors: {} });
      });
    });

    // ── Wet / Dry toggle ─────────────────────────────────────
    document.querySelectorAll("[data-wetdry]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setState({ wetDry: btn.dataset.wetdry });
      });
    });

    // ── Process button (Page 1) ──────────────────────────────
    var processBtn = document.getElementById("btn-process");
    if (processBtn) processBtn.addEventListener("click", _handleProcess);

    // ── Confirm page buttons (Page 2) ────────────────────────
    var backBtn = document.getElementById("btn-back");
    if (backBtn) backBtn.addEventListener("click", function () { setState({ page: 1 }); });

    var confirmBtn = document.getElementById("btn-confirm");
    if (confirmBtn) confirmBtn.addEventListener("click", function () { setState({ page: 3 }); });

    // ── Result page buttons (Page 3) ─────────────────────────
    var cancelResult = document.getElementById("btn-cancel-result");
    if (cancelResult) cancelResult.addEventListener("click", _resetToPage1);

    var submitResult = document.getElementById("btn-submit-result");
    if (submitResult) submitResult.addEventListener("click", _resetToPage1);

    // ── Add chemical button ──────────────────────────────────
    var addChemBtn = document.getElementById("btn-add-chem");
    if (addChemBtn) addChemBtn.addEventListener("click", _handleAddChemical);

    // ── Remove chemical buttons ──────────────────────────────
    document.querySelectorAll("[data-remove-chem]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.removeChem, 10);
        var chemicals = _state.chemicals.slice();
        chemicals.splice(idx, 1);
        setState({ chemicals: chemicals });
      });
    });

    // ── Admin back button ────────────────────────────────────
    var adminBack = document.getElementById("btn-admin-back");
    if (adminBack) {
      adminBack.addEventListener("click", function () {
        setState({ showAdmin: false });
      });
    }

    // ── Date mode toggle (admin) ─────────────────────────────
    document.querySelectorAll("[data-datemode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setState({ adminDateMode: btn.dataset.datemode });
      });
    });

    // ── Date inputs (admin) ──────────────────────────────────
    var singleDate = document.getElementById("inp-admin-single-date");
    if (singleDate) {
      singleDate.addEventListener("change", function (e) {
        setState({ adminSingleDate: e.target.value });
      });
    }

    var dateFrom = document.getElementById("inp-admin-date-from");
    if (dateFrom) {
      dateFrom.addEventListener("change", function (e) {
        setState({ adminDateFrom: e.target.value });
      });
    }

    var dateTo = document.getElementById("inp-admin-date-to");
    if (dateTo) {
      dateTo.addEventListener("change", function (e) {
        setState({ adminDateTo: e.target.value });
      });
    }

    // ── Live input binding (no re-render) ────────────────────
    _attachInputListeners();

    // ── Button hover effects ─────────────────────────────────
    _attachHoverEffects();
  }

  // Bind form inputs to state without triggering re-render
  function _attachInputListeners() {
    var bindings = [
      { id: "inp-batch",        key: "batchNumber" },
      { id: "inp-stenter",      key: "stenter",       event: "change" },
      { id: "inp-gsm",          key: "gsm" },
      { id: "inp-width",        key: "width" },
      { id: "inp-length",       key: "length" },
      { id: "inp-weight",       key: "clothWeight" },
      { id: "inp-chem-select",  key: "selectedChemical", event: "change" },
      { id: "inp-chem-density", key: "chemicalDensity" },
    ];

    bindings.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (el) {
        el.addEventListener(b.event || "input", function (e) {
          _state[b.key] = e.target.value;
        });
      }
    });
  }

  // Apply hover effects for primary buttons
  function _attachHoverEffects() {
    var primaryBtns = [
      "btn-process", "btn-confirm", "btn-submit-result", "btn-add-chem",
    ];
    primaryBtns.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("mouseenter", function () { el.style.background = ACCENT_HOVER; });
        el.addEventListener("mouseleave", function () { el.style.background = ACCENT; });
      }
    });

    // Secondary button hover (back, cancel)
    var secondaryBtns = ["btn-back", "btn-cancel-result"];
    secondaryBtns.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("mouseenter", function () { el.style.background = BG; });
        el.addEventListener("mouseleave", function () { el.style.background = "transparent"; });
      }
    });

    // Admin back button hover
    var adminBack = document.getElementById("btn-admin-back");
    if (adminBack) {
      adminBack.addEventListener("mouseenter", function () { adminBack.style.background = ACCENT_LIGHT; });
      adminBack.addEventListener("mouseleave", function () { adminBack.style.background = "none"; });
    }
  }

  // ── Outside click handler for closing dropdown ─────────────────────────────
  function _handleOutsideClick(e) {
    if (_state.dropdownOpen) {
      var dropdown = document.getElementById("dropdown-menu");
      var avatar = document.getElementById("avatar-btn");
      if (
        dropdown && !dropdown.contains(e.target) &&
        avatar && !avatar.contains(e.target)
      ) {
        setState({ dropdownOpen: false });
      }
    }
  }

  // ── Sync input values from DOM into state ──────────────────────────────────
  function _syncInputState() {
    var fields = [
      { id: "inp-batch",        key: "batchNumber" },
      { id: "inp-stenter",      key: "stenter" },
      { id: "inp-gsm",          key: "gsm" },
      { id: "inp-width",        key: "width" },
      { id: "inp-length",       key: "length" },
      { id: "inp-weight",       key: "clothWeight" },
      { id: "inp-chem-select",  key: "selectedChemical" },
      { id: "inp-chem-density", key: "chemicalDensity" },
    ];
    fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (el) _state[f.key] = el.value;
    });
  }

  // ── Process button handler ─────────────────────────────────────────────────
  function _handleProcess() {
    _syncInputState();

    var errors = {};

    if (!_state.batchNumber.trim()) {
      errors.batchNumber = "Batch number is required";
    }

    if (_state.activeTab === "complex") {
      if (!_state.gsm || parseFloat(_state.gsm) <= 0) errors.gsm = "Must be a positive number";
      if (!_state.width || parseFloat(_state.width) <= 0) errors.width = "Must be a positive number";
      if (!_state.length || parseFloat(_state.length) <= 0) errors.length = "Must be a positive number";
      if (!_state.clothWeight || parseFloat(_state.clothWeight) <= 0) errors.clothWeight = "Must be a positive number";
      if (_state.chemicals.length === 0) errors.chemicals = "At least one chemical must be added";
    }

    if (Object.keys(errors).length > 0) {
      setState({ errors: errors });
      return;
    }

    setState({ errors: {}, page: 2 });
  }

  // ── Add chemical handler ───────────────────────────────────────────────────
  function _handleAddChemical() {
    _syncInputState();

    var density = parseFloat(_state.chemicalDensity);
    if (!density || density <= 0) {
      var newErrors = Object.assign({}, _state.errors || {});
      newErrors.chemicalDensity = "Enter a valid positive density";
      setState({ errors: newErrors });
      return;
    }

    var chemicals = _state.chemicals.slice();
    chemicals.push({ name: _state.selectedChemical, density: density });
    setState({ chemicals: chemicals, chemicalDensity: "", errors: {} });
  }

  // ── Reset everything and go back to Page 1 ────────────────────────────────
  function _resetToPage1() {
    _state = _defaultState();
    _render();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  async function render(container) {
    var user = AuthGuard.getUser();
    if (!user) {
      Logger.warn("HomePage", "No user in session — redirecting to login");
      Router.navigate("login");
      return;
    }

    _user = user;
    _container = container;
    _state = _defaultState();
    _render();
    Logger.info("HomePage", "LiqCalc loaded", { user: user.email });
  }

  return { render: render };
})();
