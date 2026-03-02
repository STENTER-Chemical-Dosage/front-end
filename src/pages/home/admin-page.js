/**
 * src/pages/home/admin-page.js â€” Admin Dashboard
 *
 * Renders the admin dashboard with:
 *  - Date controls (single day / date range)
 *  - SVG bar chart showing aggregated chemical usage
 *  - SVG line charts (2-column grid) showing 30-day trends per chemical
 *
 * Depends on: HomeApp (constants.js), HomeApp.icons, HomeApp.styles
 */

(function () {
  var H = window.HomeApp;

  // â”€â”€ Date Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _fmtDate(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  }

  function _getDatesInRange(start, end) {
    var dates = [];
    var cur = new Date(start + "T00:00:00");
    var last = new Date(end + "T00:00:00");
    while (cur <= last) {
      dates.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }

  // â”€â”€ Date Controls Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // ── Build aggregated data from real batchRegistry ────────────────────────
  // Returns { dates: { "YYYY-MM-DD": { chemName: totalDensity } }, chemNames: [...] }
  function _buildBatchData() {
    var s = H.getState();
    var batches = s.batchRegistry || [];
    var chemReg = s.chemRegistry || [];
    var dates = {};
    var chemSet = {};

    batches.forEach(function (b) {
      var d = b.schedule_date || "";
      if (!d) return;
      if (!dates[d]) dates[d] = {};
      (b.chemicals || []).forEach(function (c) {
        var name = c.chemical_name || c.chemical_id || "Unknown";
        chemSet[name] = true;
        dates[d][name] = (dates[d][name] || 0) + (parseFloat(c.density) || 0);
      });
    });

    // If no batch data yet, derive chemical names from chemRegistry
    var chemNames = Object.keys(chemSet);
    if (chemNames.length === 0) {
      chemNames = chemReg.map(function (c) { return c.chemical_name; });
    }

    return { dates: dates, chemNames: chemNames };
  }

  function _renderDateControls(allActiveDates, allDates) {
    var s = H.getState();
    var minDate = allDates.length > 0 ? allDates[0] : H.todayISO();
    var maxDate = allDates.length > 0 ? allDates[allDates.length - 1] : H.todayISO();
    var isSingle = s.adminDateMode === "single";

    var inputStyle =
      "height:38px;border:1.5px solid " + H.BORDER +
      ";border-radius:8px;padding:0 12px;font-size:13px;" +
      "font-family:'IBM Plex Sans',sans-serif;color:" + H.TEXT +
      ";background:#FAFBFC;outline:none;";

    var labelStyle =
      "font-size:12px;font-weight:600;color:" + H.MUTED +
      ";text-transform:uppercase;letter-spacing:0.06em";

    var dateFields = "";
    if (isSingle) {
      dateFields =
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<label style="' + labelStyle + '">Date</label>' +
        '<input id="inp-admin-single-date" type="date" value="' + s.adminSingleDate +
        '" min="' + minDate + '" max="' + maxDate + '" style="' + inputStyle + '" />' +
        "</div>";
    } else {
      var rangeDays = allActiveDates.length;
      dateFields =
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' +
        '<label style="' + labelStyle + '">From</label>' +
        '<input id="inp-admin-date-from" type="date" value="' + s.adminDateFrom +
        '" min="' + minDate + '" max="' + s.adminDateTo + '" style="' + inputStyle + '" />' +
        '<label style="' + labelStyle + '">To</label>' +
        '<input id="inp-admin-date-to" type="date" value="' + s.adminDateTo +
        '" min="' + s.adminDateFrom + '" max="' + maxDate + '" style="' + inputStyle + '" />' +
        '<span style="font-size:12px;color:' + H.ACCENT + ';background:' + H.ACCENT_LIGHT +
        ';padding:4px 12px;border-radius:20px;font-weight:700">' + rangeDays + "d selected</span>" +
        "</div>";
    }

    return (
      '<div style="background:' + H.CARD + ";border:1px solid " + H.BORDER +
      ';border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">' +
      '<div style="display:flex;gap:0;border:1.5px solid ' + H.BORDER + ';border-radius:8px;overflow:hidden">' +
      '<button data-datemode="single" style="padding:8px 20px;font-size:13px;font-weight:' +
      (isSingle ? "600" : "400") + ';cursor:pointer;background:' + (isSingle ? H.ACCENT : "transparent") +
      ";color:" + (isSingle ? "#fff" : H.MUTED) +
      ";border:none;font-family:'IBM Plex Sans',sans-serif\">Single Day</button>" +
      '<button data-datemode="range" style="padding:8px 20px;font-size:13px;font-weight:' +
      (!isSingle ? "600" : "400") + ';cursor:pointer;background:' + (!isSingle ? H.ACCENT : "transparent") +
      ";color:" + (!isSingle ? "#fff" : H.MUTED) +
      ";border:none;font-family:'IBM Plex Sans',sans-serif\">Date Range</button>" +
      "</div>" +
      dateFields +
      "</div>"
    );
  }

  // â”€â”€ SVG Bar Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _renderBarChart(aggregated, subtitle, chemNames) {
    if (!chemNames || chemNames.length === 0) {
      return '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER +
        ';border-radius:12px;padding:24px;margin-bottom:20px;text-align:center;color:' + H.MUTED +
        ';font-size:14px">No chemical data available. Import batches to see analytics.</div>';
    }
    var vals = chemNames.map(function (c) { return aggregated[c] || 0; });
    var maxVal = Math.max.apply(null, vals.concat([1]));

    var barW = 56, gap = 18, chartH = 180;
    var total = chemNames.length;
    var svgW = total * (barW + gap) + gap;

    // Grid lines at 0%, 25%, 50%, 75%, 100%
    var gridSvg = "";
    [0, 0.25, 0.5, 0.75, 1].forEach(function (f) {
      var y = chartH - f * chartH;
      var isBase = f === 0;
      gridSvg +=
        '<line x1="0" y1="' + y + '" x2="' + svgW + '" y2="' + y +
        '" stroke="' + (isBase ? "#E5E7EB" : "#F3F4F6") + '" stroke-width="1"' +
        (isBase ? "" : ' stroke-dasharray="4,3"') + "/>";
      if (f > 0) {
        gridSvg +=
          '<text x="4" y="' + (y - 4) +
          '" font-size="9" fill="#9CA3AF" font-family="IBM Plex Mono, monospace">' +
          Math.round(f * maxVal) + "g</text>";
      }
    });

    // Bars + labels
    var barsSvg = "";
    var legendHtml = "";
    chemNames.forEach(function (chem, i) {
      var color = H.CHEM_COLORS[i % H.CHEM_COLORS.length];
      var val = aggregated[chem] || 0;
      var roundVal = Math.round(val * 100) / 100;
      var barH = Math.max((val / maxVal) * chartH, 2);
      var x = gap + i * (barW + gap);
      var y = chartH - barH;
      var parts = chem.split(" ");
      var word1 = parts[0] || chem;
      var word2 = parts.slice(1).join(" ");

      barsSvg +=
        '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + barH +
        '" rx="6" fill="' + color + '"/>';
      barsSvg +=
        '<text x="' + (x + barW / 2) + '" y="' + (chartH + 16) +
        '" text-anchor="middle" font-size="11" fill="#374151" font-weight="600"' +
        ' font-family="IBM Plex Sans, sans-serif">' + word1 + "</text>";
      if (word2) {
        barsSvg +=
          '<text x="' + (x + barW / 2) + '" y="' + (chartH + 29) +
          '" text-anchor="middle" font-size="10" fill="#9CA3AF"' +
          ' font-family="IBM Plex Sans, sans-serif">' + word2 + "</text>";
      }
      barsSvg +=
        '<text x="' + (x + barW / 2) + '" y="' + (y - 7) +
        '" text-anchor="middle" font-size="11" fill="' + color +
        '" font-weight="700" font-family="IBM Plex Mono, monospace">' + roundVal + "</text>";

      legendHtml +=
        '<div style="display:flex;align-items:center;gap:6px;font-size:12px">' +
        '<div style="width:10px;height:10px;border-radius:3px;background:' + color + '"></div>' +
        '<span style="color:' + H.TEXT + ';font-weight:500">' + chem + "</span>" +
        '<span style="color:' + color + ";font-family:'IBM Plex Mono',monospace;font-weight:700\">" +
        roundVal + "</span>" +
        "</div>";
    });

    return (
      '<div style="background:' + H.CARD + ";border:1px solid " + H.BORDER +
      ';border-radius:12px;padding:24px 24px 18px;margin-bottom:20px">' +
      '<div style="margin-bottom:18px">' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Total Chemical Consumption</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:3px">' + subtitle + "</div>" +
      "</div>" +
      '<div style="overflow-x:auto">' +
      '<svg width="' + svgW + '" height="' + (chartH + 44) +
      '" style="font-family:\'IBM Plex Sans\',sans-serif;display:block">' +
      gridSvg + barsSvg +
      "</svg></div>" +
      '<div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;padding-top:14px;border-top:1px solid ' +
      H.BORDER + '">' + legendHtml + "</div>" +
      "</div>"
    );
  }

  // â”€â”€ SVG Line Charts (2-column grid) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _renderLineCharts(allDates, chemNames, batchDates) {
    if (!chemNames || chemNames.length === 0) return "";
    var todayStr = allDates[allDates.length - 1];
    var charts = "";
    chemNames.forEach(function (chem, idx) {
      charts += _renderSingleLineChart(chem, idx, allDates, todayStr, batchDates);
    });
    return (
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + ';margin-bottom:14px">' +
      "Daily Usage per Chemical" +
      '<span style="font-size:12px;font-weight:400;color:' + H.MUTED + ';margin-left:10px">' + allDates.length + ' days</span>' +
      "</div>" +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' + charts + "</div>"
    );
  }

  function _renderSingleLineChart(chem, idx, allDates, todayStr, batchDates) {
    var color = H.CHEM_COLORS[idx % H.CHEM_COLORS.length];
    var values = allDates.map(function (d) {
      return batchDates[d] ? (batchDates[d][chem] || 0) : 0;
    });

    // Stats
    var sum = 0;
    values.forEach(function (v) { sum += v; });
    var avg = Math.round(sum / values.length);
    var latest = batchDates[todayStr] ? (batchDates[todayStr][chem] || 0) : 0;

    // Chart dimensions
    var chartH = 110;
    var chartW = Math.max(allDates.length * 26, 280);
    var pad = { l: 36, r: 12, t: 14, b: 28 };
    var w = chartW + pad.l + pad.r;
    var h = chartH + pad.t + pad.b;

    var maxVal = Math.max.apply(null, values.concat([1]));
    var minVal = Math.min.apply(null, values);
    var range = maxVal - minVal || 1;

    function toX(i) {
      return pad.l + (allDates.length > 1 ? (i / (allDates.length - 1)) * chartW : chartW / 2);
    }
    function toY(v) {
      return pad.t + chartH - ((v - minVal) / range) * chartH;
    }

    var pts = values.map(function (v, i) { return [toX(i), toY(v)]; });
    var polyline = pts.map(function (p) { return p[0] + "," + p[1]; }).join(" ");
    var area =
      pad.l + "," + (pad.t + chartH) + " " +
      polyline + " " +
      (pad.l + chartW) + "," + (pad.t + chartH);

    // Y-axis (min, mid, max)
    var yAxisSvg = [0, 0.5, 1].map(function (f) {
      var y = pad.t + chartH - f * chartH;
      var val = Math.round(minVal + f * (maxVal - minVal));
      return (
        '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (pad.l + chartW) + '" y2="' + y +
        '" stroke="#F3F4F6" stroke-width="1"/>' +
        '<text x="' + (pad.l - 4) + '" y="' + (y + 4) +
        '" text-anchor="end" font-size="8" fill="#9CA3AF" font-family="IBM Plex Mono, monospace">' +
        val + "g</text>"
      );
    }).join("");

    // X-axis date labels (every showEvery points + last)
    var showEvery = Math.ceil(allDates.length / 6);
    var xLabels = "";
    pts.forEach(function (p, i) {
      if (i % showEvery === 0 || i === allDates.length - 1) {
        xLabels +=
          '<text x="' + p[0] + '" y="' + (h - 4) +
          '" text-anchor="middle" font-size="8" fill="#9CA3AF" font-family="IBM Plex Mono, monospace">' +
          _fmtDate(allDates[i]) + "</text>";
      }
    });

    // Dots
    var dots = pts.map(function (p) {
      return (
        '<circle cx="' + p[0] + '" cy="' + p[1] +
        '" r="2.5" fill="' + color + '"/>'
      );
    }).join("");

    return (
      '<div style="background:' + H.CARD + ";border:1px solid " + H.BORDER +
      ';border-radius:12px;padding:18px 20px">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
      '<div style="width:10px;height:10px;border-radius:3px;background:' + color + ';flex-shrink:0"></div>' +
      '<span style="font-size:13px;font-weight:700;color:' + H.TEXT + '">' + chem + "</span>" +
      '<div style="margin-left:auto;display:flex;gap:10px">' +
      '<span style="font-size:11px;color:' + H.MUTED + '">avg <b style="color:' + H.TEXT +
      ";font-family:'IBM Plex Mono',monospace\">" + avg + "g</b></span>" +
      '<span style="font-size:11px;color:' + H.MUTED + '">today <b style="color:' + color +
      ";font-family:'IBM Plex Mono',monospace\">" + latest + "g</b></span>" +
      "</div></div>" +
      '<div style="overflow-x:auto">' +
      '<svg width="' + w + '" height="' + h +
      '" style="font-family:\'IBM Plex Sans\',sans-serif;display:block">' +
      yAxisSvg +
      '<polygon points="' + area + '" fill="' + color + '" opacity="0.1"/>' +
      '<polyline points="' + polyline + '" fill="none" stroke="' + color +
      '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + xLabels +
      "</svg></div></div>"
    );
  }

  // â”€â”€ Tab Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _renderTabBar(adminTab) {
    var tabs = [
      { id: "analytics",   label: "Analytics",           icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
      { id: "chemicals",   label: "Chemical Management",  icon: "M9 3H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V8l-5-5zM9 3v5h5M9 13h6M9 17h4" },
      { id: "batches",     label: "Batch Management",     icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
      { id: "multipliers", label: "GSM Multipliers",      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { id: "production",  label: "Production Log",       icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    ];
    var html = '<div style="background:#fff;border-bottom:1px solid #E5E7EB;padding:0 28px;display:flex">';
    tabs.forEach(function (tab) {
      var isActive = adminTab === tab.id;
      html +=
        '<button data-admintab="' + tab.id + '" style="' +
        'display:flex;align-items:center;gap:8px;padding:14px 20px;font-size:13px;' +
        'font-weight:' + (isActive ? '700' : '500') + ';' +
        'color:' + (isActive ? H.ACCENT : H.MUTED) + ';' +
        'background:transparent;border:none;' +
        'border-bottom:2.5px solid ' + (isActive ? H.ACCENT : 'transparent') + ';' +
        "cursor:pointer;font-family:'IBM Plex Sans',sans-serif;margin-bottom:-1px;transition:color 0.15s\">" +
        '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">' +
        '<path d="' + tab.icon + '"/></svg>' +
        tab.label + '</button>';
    });
    html += '</div>';
    return html;
  }

  // â”€â”€ Chemicals Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function _renderChemicalsTab(s) {
    var uploadState  = s.uploadState  || "idle";
    var uploadMsg    = s.uploadMsg    || "";
    var uploadedRows = s.uploadedRows || [];
    var search       = s.chemSearch   || "";
    var registry     = s.chemRegistry || [];
    var loading      = s.chemRegistryLoading || false;
    var importResult = s.importResult || null;
    var sortCol      = s.chemSortCol  || "chemical_id";
    var sortDir      = s.chemSortDir  || "asc";

    var filtered = registry.filter(function (c) {
      var q = search.toLowerCase();
      return c.chemical_id.toLowerCase().indexOf(q) !== -1 ||
             c.chemical_name.toLowerCase().indexOf(q) !== -1;
    });

    // ── Sort ──
    filtered = filtered.slice().sort(function (a, b) {
      var av = (a[sortCol] || "").toLowerCase();
      var bv = (b[sortCol] || "").toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    var dropBorder = uploadState === "error" ? "#FECACA"
                   : (uploadState === "idle"  ? H.BORDER : H.ACCENT);
    var dropBg     = uploadState === "error" ? "#FEF2F2"
                   : (uploadState === "idle"  ? "#FAFBFC" : H.ACCENT_LIGHT);
    var dropContent = "";

    if (uploadState === "idle") {
      dropContent =
        '<svg width="36" height="36" fill="none" stroke="#9CA3AF" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 10px;display:block">' +
        '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/>' +
        '<line x1="12" y1="18" x2="12" y2="12"/>' +
        '<polyline points="9 15 12 12 15 15"/>' +
        '</svg>' +
        '<div style="font-size:14px;font-weight:600;color:' + H.TEXT + '">Drop your Excel file here or <span style="color:' + H.ACCENT + '">browse</span></div>' +
        '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:4px">.xlsx \u00b7 .xls \u00b7 .csv</div>' +
        '<div style="font-size:11px;color:' + H.MUTED + ';margin-top:3px">Chemicals start from <b>Row 3</b> \u00b7 Column C = Chemical ID \u00b7 Column G = Chemical Name</div>';

    } else if (uploadState === "parsing") {
      dropContent =
        '<div style="font-size:14px;color:' + H.MUTED + ';display:flex;align-items:center;justify-content:center;gap:10px">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/>' +
        '</svg>Reading file\u2026</div>';

    } else if (uploadState === "preview") {
      dropContent =
        '<div style="font-size:13px;color:' + H.ACCENT + ';font-weight:600">' +
        '\u2139\ufe0f ' + H.escape(uploadMsg) + ' \u2014 review below before importing</div>';

    } else if (uploadState === "importing") {
      dropContent =
        '<div style="font-size:14px;color:' + H.MUTED + ';display:flex;align-items:center;justify-content:center;gap:10px">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/>' +
        '</svg>Saving to database\u2026</div>';

    } else if (uploadState === "done") {
      dropContent =
        '<div style="font-size:13px;color:#15803D;font-weight:600">' +
        '\u2713 Import complete \u2014 click or drop another file to import more</div>';

    } else if (uploadState === "error") {
      dropContent =
        '<div style="font-size:13px;color:#DC2626;font-weight:600">\u26a0\ufe0f ' + H.escape(uploadMsg) + '</div>';
    }

    var uploadCard =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;padding:24px;margin-bottom:20px">' +
      '<div style="margin-bottom:16px">' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Upload Chemicals via Excel</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:3px">Reads Column C (ID) and Column G (Name) starting from Row 3 \u00b7 Duplicate IDs are skipped</div>' +
      '</div>' +
      '<div id="chem-dropzone" style="border:2px dashed ' + dropBorder + ';border-radius:10px;padding:32px 24px;text-align:center;cursor:pointer;background:' + dropBg + ';transition:all 0.2s">' +
      '<input id="chem-file-input" type="file" accept=".xlsx,.xls,.csv" style="display:none" />' +
      dropContent +
      '</div>';

    // â”€â”€ Preview table â”€â”€
    if (uploadState === "preview" && uploadedRows.length > 0) {
      var previewRows = "";
      uploadedRows.slice(0, 8).forEach(function (r) {
        previewRows +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + '">' +
          '<td style="padding:8px 14px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(r.chemical_id) + '</td>' +
          '<td style="padding:8px 14px;font-weight:600">' + H.escape(r.chemical_name) + '</td>' +
          '<td style="padding:8px 14px;color:' + H.MUTED + '">' + H.escape(r.unit) + '</td>' +
          '</tr>';
      });
      if (uploadedRows.length > 8) {
        previewRows += '<tr><td colspan="3" style="padding:8px 14px;color:' + H.MUTED + ';text-align:center;font-size:12px">\u2026and ' + (uploadedRows.length - 8) + ' more rows</td></tr>';
      }
      uploadCard +=
        '<div style="margin-top:16px">' +
        '<div style="font-size:13px;font-weight:700;color:' + H.TEXT + ';margin-bottom:10px">' +
        'Preview \u2014 ' + uploadedRows.length + ' chemical' + (uploadedRows.length > 1 ? 's' : '') + ' detected' +
        '</div>' +
        '<div style="overflow-x:auto;border:1px solid ' + H.BORDER + ';border-radius:8px;margin-bottom:14px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:#F8F9FA">' +
        ['Chemical ID','Chemical Name','Unit'].map(function (h) {
          return '<th style="padding:9px 14px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + '">' + h + '</th>';
        }).join('') +
        '</tr></thead><tbody>' + previewRows + '</tbody>' +
        '</table></div>' +
        '<div style="display:flex;gap:10px">' +
        '<button id="btn-chem-confirm-import" style="height:38px;padding:0 22px;background:' + H.ACCENT + ';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">' +
        '\u2713 Import ' + uploadedRows.length + ' Chemical' + (uploadedRows.length > 1 ? 's' : '') + ' to Database</button>' +
        '<button id="btn-chem-discard-import" style="height:38px;padding:0 18px;background:transparent;color:' + H.TEXT + ';border:1.5px solid ' + H.BORDER + ';border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">Discard</button>' +
        '</div></div>';
    }

    // â”€â”€ Import result â”€â”€
    if (uploadState === "done" && importResult) {
      var skippedHtml = "";
      if (importResult.skipped && importResult.skipped.length > 0) {
        var skippedItems = importResult.skipped.map(function (r) {
          return '<li style="padding:3px 0;font-size:12px;color:#92400E">' +
            '<code style="background:#FDE68A;padding:1px 6px;border-radius:4px;font-size:11px;margin-right:6px">' + H.escape(r.chemical_id) + '</code>' +
            H.escape(r.chemical_name) +
            '</li>';
        }).join('');
        skippedHtml =
          '<div style="margin-top:12px;padding:12px 16px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px">' +
          '<div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px">' +
          '\u26a0\ufe0f ' + importResult.skipped.length + ' already existed \u2014 not added:' +
          '</div>' +
          '<ul style="list-style:none;padding:0;margin:0">' + skippedItems + '</ul>' +
          '</div>';
      }
      uploadCard +=
        '<div style="margin-top:16px;padding:14px 16px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px">' +
        '<div style="font-size:14px;font-weight:700;color:#15803D">\u2713 ' + importResult.added.length + ' chemical' + (importResult.added.length !== 1 ? 's' : '') + ' added to the database.</div>' +
        skippedHtml +
        '</div>';
    }

    uploadCard += '</div>';

    // â”€â”€ Registry table â”€â”€
    var inputSm = 'height:36px;border:1.5px solid ' + H.BORDER + ';border-radius:8px;padding:0 12px;font-size:13px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#FAFBFC;outline:none;';

    var tableBody = "";
    if (loading) {
      tableBody = '<tr><td colspan="4" style="padding:40px;text-align:center">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite;margin:0 auto;display:block">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/>' +
        '</svg>' +
        '<div style="font-size:13px;color:' + H.MUTED + ';margin-top:8px">Loading chemicals\u2026</div>' +
        '</td></tr>';
    } else if (filtered.length === 0) {
      tableBody = '<tr><td colspan="4" style="padding:36px;text-align:center;color:' + H.MUTED + ';font-size:14px">' +
        (registry.length === 0 ? 'No chemicals in the database yet.' : 'No chemicals match your search.') +
        '</td></tr>';
    } else {
      filtered.forEach(function (c, i) {
        tableBody +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + ';background:' + (i % 2 === 0 ? '#fff' : '#FAFBFC') + '">' +
          '<td style="padding:11px 14px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(c.chemical_id) + '</td>' +
          '<td style="padding:11px 14px;font-weight:600;color:' + H.TEXT + '">' + H.escape(c.chemical_name) + '</td>' +
          '<td style="padding:11px 14px;color:' + H.MUTED + '">' + H.escape(c.unit) + '</td>' +
          '<td style="padding:11px 14px">' +
          '<div style="display:flex;gap:6px;align-items:center">' +
          '<button data-chem-edit="' + H.escape(c.chemical_id) + '" style="height:28px;padding:0 10px;background:transparent;border:1px solid ' + H.BORDER + ';border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;color:' + H.TEXT + ';font-family:\'IBM Plex Sans\',sans-serif">Edit</button>' +
          '<button data-chem-remove="' + H.escape(c.chemical_id) + '" style="height:28px;width:28px;background:transparent;border:1px solid #FECACA;border-radius:6px;font-size:15px;cursor:pointer;color:#DC2626;display:inline-flex;align-items:center;justify-content:center;padding:0">&times;</button>' +
          '</div></td></tr>';
      });
    }

    var registryTable =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;padding:24px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">' +
      '<div>' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Chemical Registry</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:2px">' +
      (loading ? 'Loading\u2026' : filtered.length + ' of ' + registry.length + ' chemicals') +
      '</div>' +
      '</div>' +
      '<div style="position:relative">' +
      '<svg width="14" height="14" fill="none" stroke="' + H.MUTED + '" stroke-width="2" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%)">' +
      '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '<input id="chem-search" placeholder="Search ID or name\u2026" value="' + H.escape(search) + '" style="' + inputSm + 'padding-left:30px;padding-right:12px;width:210px" />' +
      '</div></div>' +
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#F8F9FA">' +
      [
        { label: 'Chemical ID',   key: 'chemical_id' },
        { label: 'Chemical Name', key: 'chemical_name' },
        { label: 'Unit',          key: 'unit' },
        { label: 'Actions',       key: null },
      ].map(function (col) {
        if (!col.key) {
          return '<th style="padding:10px 14px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap">' + col.label + '</th>';
        }
        var isActive = sortCol === col.key;
        var arrow = isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' <span style="opacity:0.25">▲</span>';
        return '<th data-sort-col="' + col.key + '" style="padding:10px 14px;text-align:left;font-weight:700;color:' + (isActive ? H.ACCENT : H.MUTED) + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap;cursor:pointer;user-select:none">' + col.label + arrow + '</th>';
      }).join('') +
      '</tr></thead>' +
      '<tbody>' + tableBody + '</tbody>' +
      '</table></div></div>';

    return uploadCard + registryTable +
      '<style>@keyframes chemSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>';
  }
  // ── GSM Multipliers Tab ────────────────────────────────────────────────────────
  function _renderMultipliersTab(s) {
    var registry = s.multiplierRegistry || [];
    var loading  = s.multiplierRegistryLoading || false;

    var inpStyle =
      'width:110px;height:38px;border:1.5px solid ' + H.BORDER +
      ';border-radius:8px;padding:0 10px;font-size:14px;' +
      "font-family:'IBM Plex Mono',monospace;color:" + H.TEXT +
      ';background:#fff;outline:none;box-sizing:border-box';

    var tableBody = '';
    if (loading) {
      tableBody =
        '<tr><td colspan="4" style="padding:48px;text-align:center">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite;margin:0 auto;display:block">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>' +
        '<div style="font-size:13px;color:' + H.MUTED + ';margin-top:8px">Loading multipliers\u2026</div>' +
        '</td></tr>';
    } else if (registry.length === 0) {
      tableBody =
        '<tr><td colspan="4" style="padding:40px;text-align:center;color:' + H.MUTED + ';font-size:14px">' +
        'No multiplier data found in the database.' +
        '</td></tr>';
    } else {
      registry.forEach(function (r) {
        var range = H.escape(r.gsm_range);
        tableBody +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + '">' +
          // Range badge
          '<td style="padding:14px 18px;white-space:nowrap">' +
          '<span style="background:' + H.ACCENT_LIGHT + ';color:' + H.ACCENT +
          ';padding:5px 14px;border-radius:7px;font-family:\'IBM Plex Mono\',monospace;font-size:13px;font-weight:700">' +
          range + '</span>' +
          '</td>' +
          // Wet multiplier input
          '<td style="padding:14px 18px">' +
          '<input id="inp-wet-mult-' + range + '" type="number" step="0.01" min="0.01" value="' +
          parseFloat(r.wet_multiplier).toFixed(2) + '" style="' + inpStyle + '" />' +
          '</td>' +
          // Dry multiplier input
          '<td style="padding:14px 18px">' +
          '<input id="inp-dry-mult-' + range + '" type="number" step="0.01" min="0.01" value="' +
          parseFloat(r.dry_multiplier).toFixed(2) + '" style="' + inpStyle + '" />' +
          '</td>' +
          // Save button + inline error
          '<td style="padding:14px 18px">' +
          '<div style="display:flex;align-items:center;gap:10px">' +
          '<button data-save-multiplier="' + range + '" style="height:36px;padding:0 20px;background:' + H.ACCENT +
          ';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;' +
          "font-family:'IBM Plex Sans',sans-serif\">Save</button>" +
          '<span id="mult-msg-' + range + '" style="font-size:12px"></span>' +
          '</div>' +
          '</td>' +
          '</tr>';
      });
    }

    return (
      // Info card
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;padding:22px 24px;margin-bottom:20px">' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + ';margin-bottom:4px">GSM Range Multipliers</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';line-height:1.6">' +
      'These multipliers feed directly into the chemical dosage algorithm: <code style="background:#F3F4F6;padding:1px 6px;border-radius:4px">Total Bath = (Width \u00d7 Length) \u00d7 Multiplier</code>. ' +
      'Set separate values for <b>Wet</b> and <b>Dry</b> cloth for each GSM range. Changes saved here take effect on the next calculation.</div>' +
      '</div>' +
      // Table card
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;overflow:hidden">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#F8F9FA">' +
      '<th style="padding:11px 18px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + '">GSM Range</th>' +
      '<th style="padding:11px 18px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + '">Wet Multiplier</th>' +
      '<th style="padding:11px 18px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + '">Dry Multiplier</th>' +
      '<th style="padding:11px 18px;border-bottom:1px solid ' + H.BORDER + '"></th>' +
      '</tr></thead>' +
      '<tbody>' + tableBody + '</tbody>' +
      '</table></div>' +
      '<style>@keyframes chemSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>'
    );
  }
  // ── Batches Tab ──────────────────────────────────────────────────────────
  function _renderBatchesTab(s) {
    var uploadState  = s.batchUploadState     || "idle";
    var uploadMsg    = s.batchUploadMsg       || "";
    var uploadedRows = s.batchUploadedRows    || [];
    var search       = s.batchSearch         || "";
    var registry     = s.batchRegistry       || [];
    var loading      = s.batchRegistryLoading || false;
    var importResult = s.batchImportResult   || null;
    var sortCol      = s.batchSortCol        || "schedule_date";
    var sortDir      = s.batchSortDir        || "desc";
    var expandedId   = s.expandedBatchId     || null;

    var filtered = registry.filter(function (b) {
      var q = search.toLowerCase();
      return (b.batch_id || "").toLowerCase().indexOf(q) !== -1 ||
             (b.stenter  || "").toLowerCase().indexOf(q) !== -1 ||
             (b.schedule_date || "").toLowerCase().indexOf(q) !== -1;
    });
    filtered = filtered.slice().sort(function (a, bItem) {
      var av = (a[sortCol]     || "").toLowerCase();
      var bv = (bItem[sortCol] || "").toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    var dropBorder = uploadState === "error" ? "#FECACA" : (uploadState === "idle" ? H.BORDER : H.ACCENT);
    var dropBg     = uploadState === "error" ? "#FEF2F2" : (uploadState === "idle" ? "#FAFBFC" : H.ACCENT_LIGHT);
    var dropContent = "";
    if (uploadState === "idle") {
      dropContent =
        '<svg width="36" height="36" fill="none" stroke="#9CA3AF" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto 10px;display:block">' +
        '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>' +
        '<rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>' +
        '<div style="font-size:14px;font-weight:600;color:' + H.TEXT + '">Drop your Excel file here or <span style="color:' + H.ACCENT + '">browse</span></div>' +
        '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:4px">.xlsx \u00b7 .xls \u00b7 .csv</div>' +
        '<div style="font-size:11px;color:' + H.MUTED + ';margin-top:3px">Row 2+ \u00b7 A=Date \u00b7 B=Stenter \u00b7 C=Batch ID \u00b7 H=Weight \u00b7 I=Length \u00b7 K=Width \u00b7 L=GSM \u00b7 N=Temp \u00b7 P=Chemicals</div>';
    } else if (uploadState === "parsing") {
      dropContent =
        '<div style="font-size:14px;color:' + H.MUTED + ';display:flex;align-items:center;justify-content:center;gap:10px">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>Reading file\u2026</div>';
    } else if (uploadState === "preview") {
      dropContent = '<div style="font-size:13px;color:' + H.ACCENT + ';font-weight:600">\u2139\ufe0f ' + H.escape(uploadMsg) + ' \u2014 review below before importing</div>';
    } else if (uploadState === "importing") {
      dropContent =
        '<div style="font-size:14px;color:' + H.MUTED + ';display:flex;align-items:center;justify-content:center;gap:10px">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>Saving to database\u2026</div>';
    } else if (uploadState === "done") {
      dropContent = '<div style="font-size:13px;color:#15803D;font-weight:600">\u2713 Import complete \u2014 drop another file to import more</div>';
    } else if (uploadState === "error") {
      dropContent = '<div style="font-size:13px;color:#DC2626;font-weight:600">\u26a0\ufe0f ' + H.escape(uploadMsg) + '</div>';
    }

    var uploadCard =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;padding:24px;margin-bottom:20px">' +
      '<div style="margin-bottom:16px">' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Upload Batches via Excel</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:3px">Parses chemicals from Column P \u00b7 Duplicate Batch IDs are skipped \u00b7 Unrecognized chemicals are reported</div>' +
      '</div>' +
      '<div id="batch-dropzone" style="border:2px dashed ' + dropBorder + ';border-radius:10px;padding:32px 24px;text-align:center;cursor:pointer;background:' + dropBg + ';transition:all 0.2s">' +
      '<input id="batch-file-input" type="file" accept=".xlsx,.xls,.csv" style="display:none" />' +
      dropContent + '</div>';

    if (uploadState === "preview" && uploadedRows.length > 0) {
      var prevRows = "";
      uploadedRows.slice(0, 8).forEach(function (b) {
        prevRows +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + '">' +
          '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(b.batch_id) + '</td>' +
          '<td style="padding:8px 12px">' + H.escape(b.schedule_date) + '</td>' +
          '<td style="padding:8px 12px">' + H.escape(b.stenter) + '</td>' +
          '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace">' + H.escape(b.weight) + '</td>' +
          '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace">' + H.escape(b.gsm) + '</td>' +
          '<td style="padding:8px 12px">' + H.escape(b.temperature) + '</td>' +
          '<td style="padding:8px 12px;color:' + H.MUTED + ';font-size:11px">' + b.chemicals.length + ' chem' + (b.chemicals.length !== 1 ? 's' : '') + '</td>' +
          '</tr>';
      });
      if (uploadedRows.length > 8) prevRows += '<tr><td colspan="7" style="padding:8px 12px;text-align:center;color:' + H.MUTED + ';font-size:12px">\u2026and ' + (uploadedRows.length - 8) + ' more batches</td></tr>';
      uploadCard +=
        '<div style="margin-top:16px">' +
        '<div style="font-size:13px;font-weight:700;color:' + H.TEXT + ';margin-bottom:10px">Preview \u2014 ' + uploadedRows.length + ' batch' + (uploadedRows.length > 1 ? 'es' : '') + ' detected</div>' +
        '<div style="overflow-x:auto;border:1px solid ' + H.BORDER + ';border-radius:8px;margin-bottom:14px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:#F8F9FA">' +
        ['Batch ID','Date','Stenter','Weight','GSM','Temp','Chems'].map(function (h) {
          return '<th style="padding:9px 12px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap">' + h + '</th>';
        }).join('') +
        '</tr></thead><tbody>' + prevRows + '</tbody></table></div>' +
        '<div style="display:flex;gap:10px">' +
        '<button id="btn-batch-confirm-import" style="height:38px;padding:0 22px;background:' + H.ACCENT + ';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">' +
        '\u2713 Import ' + uploadedRows.length + ' Batch' + (uploadedRows.length > 1 ? 'es' : '') + ' to Database</button>' +
        '<button id="btn-batch-discard-import" style="height:38px;padding:0 18px;background:transparent;color:' + H.TEXT + ';border:1.5px solid ' + H.BORDER + ';border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">Discard</button>' +
        '</div></div>';
    }

    if (uploadState === "done" && importResult) {
      var resHtml =
        '<div style="margin-top:16px;padding:14px 16px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px">' +
        '<div style="font-size:14px;font-weight:700;color:#15803D">\u2713 ' + importResult.added.length + ' batch' + (importResult.added.length !== 1 ? 'es' : '') + ' added to the database.</div>';
      if (importResult.skipped && importResult.skipped.length > 0) {
        resHtml += '<div style="margin-top:8px;font-size:12px;color:#92400E;font-weight:600">\u26a0\ufe0f ' + importResult.skipped.length + ' batch ID' + (importResult.skipped.length > 1 ? 's' : '') + ' already existed \u2014 skipped.</div>';
      }
      if (importResult.warnings && importResult.warnings.length > 0) {
        var wItems = importResult.warnings.map(function (w) {
          return '<li style="padding:2px 0;font-size:12px;color:#92400E">' +
            'Batch <code style="background:#FDE68A;padding:1px 5px;border-radius:3px;margin:0 4px">' + H.escape(w.batch_id) + '</code>' +
            '\u2014 Unrecognized chemical <code style="background:#FECACA;padding:1px 5px;border-radius:3px;font-weight:700">' + H.escape(w.chemical_id) + '</code>' +
            '</li>';
        }).join('');
        resHtml +=
          '<div style="margin-top:10px;padding:10px 14px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px">' +
          '<div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px">\u26a0\ufe0f Unrecognized chemicals \u2014 not linked (add them in Chemical Management first):</div>' +
          '<ul style="list-style:none;padding:0;margin:0">' + wItems + '</ul></div>';
      }
      resHtml += '</div>';
      uploadCard += resHtml;
    }
    uploadCard += '</div>';

    var inputSm = 'height:36px;border:1.5px solid ' + H.BORDER + ';border-radius:8px;padding:0 12px;font-size:13px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#FAFBFC;outline:none;';
    var tableBody = "";
    if (loading) {
      tableBody = '<tr><td colspan="10" style="padding:40px;text-align:center">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite;margin:0 auto;display:block">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>' +
        '<div style="font-size:13px;color:' + H.MUTED + ';margin-top:8px">Loading batches\u2026</div></td></tr>';
    } else if (filtered.length === 0) {
      tableBody = '<tr><td colspan="10" style="padding:36px;text-align:center;color:' + H.MUTED + ';font-size:14px">' +
        (registry.length === 0 ? 'No batches in the database yet.' : 'No batches match your search.') + '</td></tr>';
    } else {
      filtered.forEach(function (b, i) {
        var isExpanded = expandedId === b.batch_id;
        tableBody +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + ';background:' + (i % 2 === 0 ? '#fff' : '#FAFBFC') + '">' +
          '<td style="padding:10px 8px;width:32px">' +
          '<button data-batch-expand="' + H.escape(b.batch_id) + '" title="' + (isExpanded ? 'Collapse' : 'View chemicals') + '" style="height:24px;width:24px;background:' + (isExpanded ? H.ACCENT_LIGHT : 'transparent') + ';border:1px solid ' + (isExpanded ? H.ACCENT : H.BORDER) + ';border-radius:5px;cursor:pointer;font-size:10px;display:inline-flex;align-items:center;justify-content:center;color:' + (isExpanded ? H.ACCENT : H.MUTED) + ';font-weight:700;padding:0">' + (isExpanded ? '\u25bc' : '\u25b6') + '</button></td>' +
          '<td style="padding:10px 12px;color:' + H.MUTED + ';white-space:nowrap;font-size:12px">' + H.escape(b.schedule_date || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(b.batch_id) + '</td>' +
          '<td style="padding:10px 12px">' + H.escape(b.stenter || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;text-align:right;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + H.escape(b.weight || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;text-align:right;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + H.escape(b.width || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;text-align:right;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + H.escape(b.length || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;text-align:right;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + H.escape(b.gsm || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;font-size:12px">' + H.escape(b.temperature || '\u2014') + '</td>' +
          '<td style="padding:10px 12px">' +
          '<div style="display:flex;gap:6px;align-items:center">' +
          '<button data-batch-edit="' + H.escape(b.batch_id) + '" style="height:28px;padding:0 10px;background:transparent;border:1px solid ' + H.BORDER + ';border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;color:' + H.TEXT + ';font-family:\'IBM Plex Sans\',sans-serif">Edit</button>' +
          '<button data-batch-remove="' + H.escape(b.batch_id) + '" style="height:28px;width:28px;background:transparent;border:1px solid #FECACA;border-radius:6px;font-size:15px;cursor:pointer;color:#DC2626;display:inline-flex;align-items:center;justify-content:center;padding:0">&times;</button>' +
          '</div></td></tr>';

        if (isExpanded) {
          var chems = Array.isArray(b.chemicals) ? b.chemicals : [];
          var chemRows = chems.length === 0
            ? '<tr><td colspan="3" style="padding:14px;text-align:center;color:' + H.MUTED + ';font-size:13px">No chemicals linked to this batch.</td></tr>'
            : chems.map(function (c) {
                return '<tr style="border-bottom:1px solid #F3F4F6">' +
                  '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(c.chemical_id) + '</td>' +
                  '<td style="padding:8px 12px;font-weight:500">' + H.escape(c.chemical_name || '\u2014') + '</td>' +
                  '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + H.escape(c.density) + '</td>' +
                  '</tr>';
              }).join('');
          tableBody +=
            '<tr style="background:#F8FAFF">' +
            '<td colspan="10" style="padding:0;border-bottom:2px solid ' + H.ACCENT + '">' +
            '<div style="padding:16px 20px 20px">' +
            '<div style="font-size:12px;font-weight:700;color:' + H.ACCENT + ';text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">' +
            '\u2198 Chemicals for Batch ' + H.escape(b.batch_id) + ' (' + chems.length + ')</div>' +
            '<table style="width:auto;min-width:400px;border-collapse:collapse;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">' +
            '<thead><tr style="background:#F3F4F6">' +
            ['Chemical ID','Chemical Name','Density'].map(function (h) {
              return '<th style="padding:8px 14px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #E5E7EB;white-space:nowrap">' + h + '</th>';
            }).join('') +
            '</tr></thead><tbody>' + chemRows + '</tbody></table></div></td></tr>';
        }
      });
    }

    var batchSortCols = [
      { label: '',         key: null },
      { label: 'Date',     key: 'schedule_date' },
      { label: 'Batch ID', key: 'batch_id' },
      { label: 'Stenter',  key: 'stenter' },
      { label: 'Weight',   key: 'weight' },
      { label: 'Width',    key: 'width' },
      { label: 'Length',   key: 'length' },
      { label: 'GSM',      key: 'gsm' },
      { label: 'Temp',     key: 'temperature' },
      { label: 'Actions',  key: null },
    ];
    var registryTable =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;padding:24px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">' +
      '<div>' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Batch Registry</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:2px">' + (loading ? 'Loading\u2026' : filtered.length + ' of ' + registry.length + ' batches') + '</div>' +
      '</div>' +
      '<div style="position:relative">' +
      '<svg width="14" height="14" fill="none" stroke="' + H.MUTED + '" stroke-width="2" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%)">' +
      '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '<input id="batch-search" placeholder="Search ID, stenter or date\u2026" value="' + H.escape(search) + '" style="' + inputSm + 'padding-left:30px;padding-right:12px;width:230px" />' +
      '</div></div>' +
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#F8F9FA">' +
      batchSortCols.map(function (col) {
        if (!col.key) return '<th style="padding:10px 8px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap">' + col.label + '</th>';
        var isActive = sortCol === col.key;
        var arrow = isActive ? (sortDir === 'asc' ? ' \u25b2' : ' \u25bc') : ' <span style="opacity:0.25">\u25b2</span>';
        return '<th data-batch-sort-col="' + col.key + '" style="padding:10px 8px;text-align:left;font-weight:700;color:' + (isActive ? H.ACCENT : H.MUTED) + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap;cursor:pointer;user-select:none">' + col.label + arrow + '</th>';
      }).join('') +
      '</tr></thead>' +
      '<tbody>' + tableBody + '</tbody>' +
      '</table></div></div>';

    return uploadCard + registryTable +
      '<style>@keyframes chemSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>';
  }

  // ── Main Admin Renderer ────────────────────────────────────────────────────
  function renderAdmin() {
    var s = H.getState();
    var batchData = _buildBatchData();
    var batchDates = batchData.dates;
    var chemNames = batchData.chemNames;
    var allDates = Object.keys(batchDates).sort();

    // Determine active dates for bar chart aggregation
    var activeDates = [];
    if (s.adminDateMode === "single") {
      if (batchDates[s.adminSingleDate]) {
        activeDates = [s.adminSingleDate];
      }
    } else {
      activeDates = _getDatesInRange(s.adminDateFrom, s.adminDateTo).filter(function (d) {
        return !!batchDates[d];
      });
    }

    // Subtitle for bar chart card
    var subtitle = "";
    if (s.adminDateMode === "single") {
      subtitle = "Usage on " + _fmtDate(s.adminSingleDate);
    } else {
      subtitle = "Aggregated: " + _fmtDate(s.adminDateFrom) + " \u2013 " + _fmtDate(s.adminDateTo);
    }

    // Aggregate from real batch data
    var aggregated = {};
    chemNames.forEach(function (c) { aggregated[c] = 0; });
    activeDates.forEach(function (d) {
      chemNames.forEach(function (c) { aggregated[c] += (batchDates[d] && batchDates[d][c]) || 0; });
    });

    // All calendar days in range (for badge count)
    var allActiveDates = s.adminDateMode === "range"
      ? _getDatesInRange(s.adminDateFrom, s.adminDateTo)
      : activeDates;

    return (
      '<div style="font-family:\'IBM Plex Sans\',sans-serif;background:' + H.BG +
      ';min-height:100vh;color:' + H.TEXT + '">' +

      // â”€â”€ Navbar â”€â”€
      '<div style="background:#fff;border-bottom:1px solid #E5E7EB;padding:0 28px;height:56px;' +
      'display:flex;align-items:center;gap:14px">' +
      '<button id="btn-admin-back" style="display:flex;align-items:center;gap:6px;' +
      "padding:6px 12px;border-radius:8px;border:1px solid #E5E7EB;background:transparent;" +
      "cursor:pointer;font-size:13px;font-family:'IBM Plex Sans',sans-serif;color:" + H.TEXT +
      ';font-weight:500">' +
      '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">' +
      '<path d="M19 12H5M12 5l-7 7 7 7"/></svg>Back</button>' +
      '<div style="width:1px;height:22px;background:#E5E7EB"></div>' +
      '<span style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Admin Dashboard</span>' +
      '<span style="font-size:11px;font-weight:700;background:' + H.ACCENT_LIGHT + ';color:' + H.ACCENT +
      ';padding:3px 10px;border-radius:20px;letter-spacing:0.04em">ADMIN</span>' +
      "</div>" +

      // â”€â”€ Tab Bar â”€â”€
      _renderTabBar(s.adminTab) +

      // â”€â”€ Main Content â”€â”€
      '<div style="max-width:1000px;margin:0 auto;padding:28px 24px">' +
      (s.adminTab === "batches"
        ? _renderBatchesTab(s)
        : s.adminTab === "chemicals"
          ? _renderChemicalsTab(s)
          : s.adminTab === "multipliers"
            ? _renderMultipliersTab(s)
            : s.adminTab === "production"
              ? _renderProductionTab(s)
              : _renderDateControls(allActiveDates, allDates) +
                _renderBarChart(aggregated, subtitle, chemNames) +
                _renderLineCharts(allDates, chemNames, batchDates)
      ) +
      "</div></div>" +

      // ── Edit Modals ──
      _renderEditModal(s.editingChem) +
      _renderEditBatchModal(s.editingBatch, s.chemRegistry)
    );
  }

  function _renderEditBatchModal(eb, chemReg) {
    if (!eb) return "";
    var inp = 'width:100%;height:38px;border:1.5px solid ' + H.BORDER + ';border-radius:8px;padding:0 12px;font-size:13px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#fff;outline:none;box-sizing:border-box;';
    var lbl = 'font-size:11px;font-weight:700;color:' + H.MUTED + ';text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:5px';
    var fg  = 'margin-bottom:14px';

    var chemicals  = eb.chemicals || [];
    var usedIds    = chemicals.map(function (c) { return c.chemical_id; });
    var availChems = (chemReg || []).filter(function (c) { return usedIds.indexOf(c.chemical_id) === -1; });

    var chemRows = "";
    if (chemicals.length === 0) {
      chemRows = '<tr><td colspan="4" style="padding:10px 0;text-align:center;color:' + H.MUTED + ';font-size:12px">No chemicals linked.</td></tr>';
    } else {
      chemicals.forEach(function (c) {
        chemRows +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + '">' +
          '<td style="padding:6px 8px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(c.chemical_id) + '</td>' +
          '<td style="padding:6px 8px;font-size:12px">' + H.escape(c.chemical_name || '') + '</td>' +
          '<td style="padding:6px 8px;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + H.escape(c.density || '') + '</td>' +
          '<td style="padding:6px 4px;text-align:right">' +
          '<button data-batch-modal-chem-remove="' + H.escape(c.chemical_id) + '" title="Remove" style="height:22px;width:22px;background:#FEE2E2;border:none;border-radius:4px;cursor:pointer;font-size:13px;color:#DC2626;font-weight:700;padding:0;line-height:1">×</button>' +
          '</td></tr>';
      });
    }

    var selectOpts = availChems.map(function (c) {
      return '<option value="' + H.escape(c.chemical_id) + '">' + H.escape(c.chemical_id) + ' — ' + H.escape(c.chemical_name) + '</option>';
    }).join('');

    var addRow = availChems.length > 0
      ? '<div style="margin-top:10px;padding:10px 12px;background:#F8F9FA;border:1px solid ' + H.BORDER + ';border-radius:8px">' +
        '<div style="font-size:11px;font-weight:700;color:' + H.MUTED + ';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Add Chemical</div>' +
        '<select id="batch-modal-chem-select" style="width:100%;height:34px;border:1.5px solid ' + H.BORDER + ';border-radius:7px;padding:0 8px;font-size:12px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#fff;outline:none;box-sizing:border-box;margin-bottom:8px">' +
        '<option value="">Select chemical…</option>' + selectOpts + '</select>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<input id="batch-modal-chem-density" type="number" min="0" step="any" placeholder="Density (number)" style="flex:1;height:34px;border:1.5px solid ' + H.BORDER + ';border-radius:7px;padding:0 10px;font-size:12px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#fff;outline:none;box-sizing:border-box" />' +
        '<span style="font-size:12px;color:' + H.MUTED + ';white-space:nowrap">g/L</span>' +
        '<button id="btn-batch-modal-chem-add" style="height:34px;padding:0 16px;background:' + H.ACCENT + ';color:#fff;border:none;border-radius:7px;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:\'IBM Plex Sans\',sans-serif">+ Add</button>' +
        '</div></div>'
      : '<div style="margin-top:8px;font-size:12px;color:' + H.MUTED + '">All chemicals are already linked.</div>';

    return (
      '<div id="edit-batch-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:32px 16px">' +
      '<div style="background:#fff;border-radius:14px;padding:28px 28px 24px;width:580px;max-width:95vw;box-shadow:0 20px 60px rgba(0,0,0,0.2)">' +
      '<div style="font-size:16px;font-weight:700;color:' + H.TEXT + ';margin-bottom:4px">Edit Batch</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-bottom:22px">Changes are saved directly to the database.</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">' +
      '<div style="' + fg + '"><label style="' + lbl + '">Batch ID</label><input id="edit-batch-id" value="' + H.escape(eb.batch_id) + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">Date</label><input id="edit-batch-date" value="' + H.escape(eb.schedule_date || '') + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">Stenter</label><input id="edit-batch-stenter" value="' + H.escape(eb.stenter || '') + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">Weight</label><input id="edit-batch-weight" value="' + H.escape(eb.weight || '') + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">Width</label><input id="edit-batch-width" value="' + H.escape(eb.width || '') + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">Length</label><input id="edit-batch-length" value="' + H.escape(eb.length || '') + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">GSM</label><input id="edit-batch-gsm" value="' + H.escape(eb.gsm || '') + '" style="' + inp + '" /></div>' +
      '<div style="' + fg + '"><label style="' + lbl + '">Temperature</label><input id="edit-batch-temperature" value="' + H.escape(eb.temperature || '') + '" style="' + inp + '" /></div>' +
      '</div>' +

      '<div style="font-size:11px;font-weight:700;color:' + H.MUTED + ';text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Chemicals</div>' +
      '<div style="border:1px solid ' + H.BORDER + ';border-radius:8px;overflow:hidden">' +
      '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:#F8F9FA">' +
      '<th style="padding:7px 8px;text-align:left;font-size:11px;font-weight:700;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">ID</th>' +
      '<th style="padding:7px 8px;text-align:left;font-size:11px;font-weight:700;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Name</th>' +
      '<th style="padding:7px 8px;text-align:left;font-size:11px;font-weight:700;color:' + H.MUTED + ';border-bottom:1px solid ' + H.BORDER + '">Density</th>' +
      '<th style="padding:7px 8px;border-bottom:1px solid ' + H.BORDER + '"></th>' +
      '</tr></thead><tbody>' + chemRows + '</tbody></table></div>' +
      addRow +

      '<div id="edit-batch-error" style="min-height:18px;font-size:12px;color:#DC2626;margin-top:8px;margin-bottom:12px"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button id="btn-edit-batch-cancel" style="height:38px;padding:0 18px;background:transparent;color:' + H.TEXT + ';border:1.5px solid ' + H.BORDER + ';border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">Cancel</button>' +
      '<button id="btn-edit-batch-save" style="height:38px;padding:0 22px;background:' + H.ACCENT + ';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">Save Changes</button>' +
      '</div></div></div>'
    );
  }

  function _renderEditModal(ec) {
    if (!ec) return "";
    var inp = 'width:100%;height:40px;border:1.5px solid ' + H.BORDER + ';border-radius:8px;padding:0 12px;font-size:14px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#fff;outline:none;box-sizing:border-box;';
    return (
      '<div id="edit-chem-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center">' +
      '<div style="background:#fff;border-radius:14px;padding:28px;width:420px;max-width:90vw;box-shadow:0 20px 60px rgba(0,0,0,0.2)">' +
      '<div style="font-size:16px;font-weight:700;color:' + H.TEXT + ';margin-bottom:6px">Edit Chemical</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-bottom:22px">Changes are saved directly to the database.</div>' +

      '<label style="font-size:12px;font-weight:700;color:' + H.MUTED + ';text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">Chemical ID</label>' +
      '<input id="edit-chem-id" value="' + H.escape(ec.chemical_id) + '" style="' + inp + 'margin-bottom:16px" />' +

      '<label style="font-size:12px;font-weight:700;color:' + H.MUTED + ';text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:6px">Chemical Name</label>' +
      '<input id="edit-chem-name" value="' + H.escape(ec.chemical_name) + '" style="' + inp + 'margin-bottom:6px" />' +

      '<div id="edit-chem-error" style="min-height:20px;font-size:12px;color:#DC2626;margin-bottom:16px"></div>' +

      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button id="btn-edit-chem-cancel" style="height:38px;padding:0 18px;background:transparent;color:' + H.TEXT + ';border:1.5px solid ' + H.BORDER + ';border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">Cancel</button>' +
      '<button id="btn-edit-chem-save" style="height:38px;padding:0 22px;background:' + H.ACCENT + ';color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif">Save Changes</button>' +
      '</div></div></div>'
    );
  }

  H.renderAdmin = renderAdmin;

  // ── Production Records Tab ───────────────────────────────────────────────
  function _renderProductionTab(s) {
    var registry  = s.prodRegistry        || [];
    var loading   = s.prodRegistryLoading || false;
    var search    = s.prodSearch          || "";
    var sortCol   = s.prodSortCol         || "submitted_at";
    var sortDir   = s.prodSortDir         || "desc";
    var expandedId = s.expandedProdId     || null;
    var selectedIds = s.prodSelectedIds   || [];

    var filtered = registry.filter(function (r) {
      var q = search.toLowerCase();
      return (r.batch_id    || "").toLowerCase().indexOf(q) !== -1 ||
             (r.stenter     || "").toLowerCase().indexOf(q) !== -1 ||
             (r.user_name   || "").toLowerCase().indexOf(q) !== -1 ||
             (String(r.id)        ).indexOf(q) !== -1;
    });
    filtered = filtered.slice().sort(function (a, b) {
      var av, bv;
      if (sortCol === "submitted_at" || sortCol === "schedule_date") {
        av = a[sortCol] || "";
        bv = b[sortCol] || "";
      } else if (sortCol === "id" || sortCol === "t_value") {
        av = parseFloat(a[sortCol]) || 0;
        bv = parseFloat(b[sortCol]) || 0;
        return sortDir === "asc" ? av - bv : bv - av;
      } else {
        av = (a[sortCol] || "").toLowerCase();
        bv = (b[sortCol] || "").toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    // ── Select all checkbox state ──
    var allVisibleIds = filtered.map(function (r) { return r.id; });
    var allSelected = allVisibleIds.length > 0 && allVisibleIds.every(function (id) {
      return selectedIds.indexOf(id) !== -1;
    });

    var inputSm = 'height:36px;border:1.5px solid ' + H.BORDER + ';border-radius:8px;padding:0 12px;font-size:13px;font-family:\'IBM Plex Sans\',sans-serif;color:' + H.TEXT + ';background:#FAFBFC;outline:none;';

    var tableBody = "";
    if (loading) {
      tableBody = '<tr><td colspan="9" style="padding:40px;text-align:center">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + H.ACCENT + '" stroke-width="2" style="animation:chemSpin 1s linear infinite;margin:0 auto;display:block">' +
        '<path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/></svg>' +
        '<div style="font-size:13px;color:' + H.MUTED + ';margin-top:8px">Loading production records\u2026</div></td></tr>';
    } else if (filtered.length === 0) {
      tableBody = '<tr><td colspan="9" style="padding:36px;text-align:center;color:' + H.MUTED + ';font-size:14px">' +
        (registry.length === 0 ? 'No production records yet. Workers submit records from the calculation result page.' : 'No records match your search.') + '</td></tr>';
    } else {
      filtered.forEach(function (r, i) {
        var isExpanded = expandedId === r.id;
        var isChecked = selectedIds.indexOf(r.id) !== -1;
        var submittedDate = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '\u2014';
        var submittedTime = r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
        tableBody +=
          '<tr style="border-bottom:1px solid ' + H.BORDER + ';background:' + (i % 2 === 0 ? '#fff' : '#FAFBFC') + '">' +
          '<td style="padding:10px 8px;width:32px">' +
          '<input type="checkbox" data-prod-select="' + r.id + '" ' + (isChecked ? 'checked' : '') +
          ' style="width:16px;height:16px;cursor:pointer;accent-color:' + H.ACCENT + '" /></td>' +
          '<td style="padding:10px 8px;width:32px">' +
          '<button data-prod-expand="' + r.id + '" title="' + (isExpanded ? 'Collapse' : 'View details') + '" style="height:24px;width:24px;background:' + (isExpanded ? H.ACCENT_LIGHT : 'transparent') + ';border:1px solid ' + (isExpanded ? H.ACCENT : H.BORDER) + ';border-radius:5px;cursor:pointer;font-size:10px;display:inline-flex;align-items:center;justify-content:center;color:' + (isExpanded ? H.ACCENT : H.MUTED) + ';font-weight:700;padding:0">' + (isExpanded ? '\u25bc' : '\u25b6') + '</button></td>' +
          '<td style="padding:10px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">#' + r.id + '</td>' +
          '<td style="padding:10px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.TEXT + '">' + H.escape(r.batch_id || '\u2014') + '</td>' +
          '<td style="padding:10px 12px;font-size:12px">' + H.escape(r.user_name || 'Unknown') + '</td>' +
          '<td style="padding:10px 12px;font-size:12px;color:' + H.MUTED + ';white-space:nowrap">' + submittedDate + (submittedTime ? '<br><span style="font-size:11px">' + submittedTime + '</span>' : '') + '</td>' +
          '<td style="padding:10px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:14px;font-weight:700;text-align:right">' + (parseFloat(r.t_value) || 0).toLocaleString() + ' L</td>' +
          '<td style="padding:10px 12px">' + H.escape(r.stenter || '\u2014') + '</td>' +
          '<td style="padding:10px 8px">' +
          '<button data-prod-remove="' + r.id + '" style="height:28px;width:28px;background:transparent;border:1px solid #FECACA;border-radius:6px;font-size:15px;cursor:pointer;color:#DC2626;display:inline-flex;align-items:center;justify-content:center;padding:0">&times;</button>' +
          '</td></tr>';

        if (isExpanded) {
          var chems = Array.isArray(r.chemicals) ? r.chemicals : [];
          var chemRows = chems.length === 0
            ? '<tr><td colspan="4" style="padding:14px;text-align:center;color:' + H.MUTED + ';font-size:13px">No chemicals in this record.</td></tr>'
            : chems.map(function (c) {
                return '<tr style="border-bottom:1px solid #F3F4F6">' +
                  '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.ACCENT + '">' + H.escape(c.chemical_id || '\u2014') + '</td>' +
                  '<td style="padding:8px 12px;font-weight:500">' + H.escape(c.chemical_name || '\u2014') + '</td>' +
                  '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px">' + (parseFloat(c.density) || 0) + ' g/L</td>' +
                  '<td style="padding:8px 12px;font-family:\'IBM Plex Mono\',monospace;font-size:12px;font-weight:700;color:' + H.TEXT + '">' + (parseFloat(c.dosage) || 0).toFixed(2) + '</td>' +
                  '</tr>';
              }).join('');

          var detailPairs = [
            ['Cloth Type', r.wet_dry || '\u2014'],
            ['GSM', r.gsm ? r.gsm + ' g/m\u00b2' : '\u2014'],
            ['Width', r.width ? r.width + ' cm' : '\u2014'],
            ['Length', r.length ? r.length + ' m' : '\u2014'],
            ['Cloth Weight', r.cloth_weight ? r.cloth_weight + ' kg' : '\u2014'],
            ['Schedule Date', r.schedule_date || '\u2014'],
            ['Fabric Factor', r.fabric_factor != null ? parseFloat(r.fabric_factor).toLocaleString() : '\u2014'],
            ['GSM Range', r.gsm_range || '\u2014'],
            ['Multiplier', r.multiplier != null ? '\u00d7 ' + r.multiplier : '\u2014'],
            ['Total Bath (raw)', r.total_bath != null ? parseFloat(r.total_bath).toLocaleString() : '\u2014'],
            ['T Value (ceil 25)', r.t_value ? parseFloat(r.t_value).toLocaleString() + ' L' : '\u2014'],
            ['Bath Concentration', r.bath_concentration != null ? parseFloat(r.bath_concentration).toFixed(2) : '\u2014'],
          ];
          var detailHtml = detailPairs.map(function (p) {
            return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F3F4F6">' +
              '<span style="font-size:12px;color:' + H.MUTED + '">' + p[0] + '</span>' +
              '<span style="font-size:12px;font-weight:600;color:' + H.TEXT + ';font-family:\'IBM Plex Mono\',monospace">' + p[1] + '</span></div>';
          }).join('');

          tableBody +=
            '<tr style="background:#F8FAFF">' +
            '<td colspan="9" style="padding:0;border-bottom:2px solid ' + H.ACCENT + '">' +
            '<div style="padding:16px 20px 20px">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">' +

            // Left column: calculation details
            '<div>' +
            '<div style="font-size:12px;font-weight:700;color:' + H.ACCENT + ';text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">' +
            '\u2198 Calculation Details</div>' +
            '<div style="background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:12px 16px">' + detailHtml + '</div>' +
            '</div>' +

            // Right column: chemicals table
            '<div>' +
            '<div style="font-size:12px;font-weight:700;color:' + H.ACCENT + ';text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">' +
            '\u2198 Chemical Dosages (' + chems.length + ')</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:13px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden">' +
            '<thead><tr style="background:#F3F4F6">' +
            ['Chemical ID','Chemical Name','Density (g/L)','Dosage'].map(function (h) {
              return '<th style="padding:8px 14px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #E5E7EB;white-space:nowrap">' + h + '</th>';
            }).join('') +
            '</tr></thead><tbody>' + chemRows + '</tbody></table>' +
            '</div>' +

            '</div></div></td></tr>';
        }
      });
    }

    var prodSortCols = [
      { label: '',           key: null },
      { label: '',           key: null },
      { label: 'Record',     key: 'id' },
      { label: 'Batch ID',   key: 'batch_id' },
      { label: 'Operator',   key: 'user_name' },
      { label: 'Submitted',  key: 'submitted_at' },
      { label: 'T Value',    key: 't_value' },
      { label: 'Stenter',    key: 'stenter' },
      { label: 'Delete',     key: null },
    ];

    var selectedCount = selectedIds.length;

    var registryTable =
      '<div style="background:' + H.CARD + ';border:1px solid ' + H.BORDER + ';border-radius:12px;padding:24px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px">' +
      '<div>' +
      '<div style="font-size:15px;font-weight:700;color:' + H.TEXT + '">Production Log</div>' +
      '<div style="font-size:12px;color:' + H.MUTED + ';margin-top:2px">' + (loading ? 'Loading\u2026' : filtered.length + ' of ' + registry.length + ' records') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;align-items:center">' +
      (selectedCount > 0
        ? '<button id="btn-prod-download" style="height:36px;padding:0 18px;background:' + H.ACCENT + ';color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:\'IBM Plex Sans\',sans-serif;display:flex;align-items:center;gap:6px">' +
          '<svg width="14" height="14" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>' +
          'Download ' + selectedCount + ' Record' + (selectedCount > 1 ? 's' : '') + ' (.xlsx)</button>'
        : '') +
      '<div style="position:relative">' +
      '<svg width="14" height="14" fill="none" stroke="' + H.MUTED + '" stroke-width="2" viewBox="0 0 24 24" style="position:absolute;left:10px;top:50%;transform:translateY(-50%)">' +
      '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
      '<input id="prod-search" placeholder="Search ID, batch, operator\u2026" value="' + H.escape(search) + '" style="' + inputSm + 'padding-left:30px;padding-right:12px;width:230px" />' +
      '</div></div></div>' +
      '<div style="overflow-x:auto">' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:#F8F9FA">' +
      prodSortCols.map(function (col, ci) {
        // First column: select-all checkbox
        if (ci === 0) {
          return '<th style="padding:10px 8px;width:32px;border-bottom:1px solid ' + H.BORDER + '">' +
            '<input type="checkbox" id="prod-select-all" ' + (allSelected ? 'checked' : '') +
            ' style="width:16px;height:16px;cursor:pointer;accent-color:' + H.ACCENT + '" /></th>';
        }
        if (!col.key) return '<th style="padding:10px 8px;text-align:left;font-weight:700;color:' + H.MUTED + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap">' + col.label + '</th>';
        var isActive = sortCol === col.key;
        var arrow = isActive ? (sortDir === 'asc' ? ' \u25b2' : ' \u25bc') : ' <span style="opacity:0.25">\u25b2</span>';
        return '<th data-prod-sort-col="' + col.key + '" style="padding:10px 8px;text-align:left;font-weight:700;color:' + (isActive ? H.ACCENT : H.MUTED) + ';font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ' + H.BORDER + ';white-space:nowrap;cursor:pointer;user-select:none">' + col.label + arrow + '</th>';
      }).join('') +
      '</tr></thead>' +
      '<tbody>' + tableBody + '</tbody>' +
      '</table></div></div>';

    return registryTable +
      '<style>@keyframes chemSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>';
  }
})();
