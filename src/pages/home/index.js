/**
 * src/pages/home/index.js — LiqCalc Home Page Orchestrator
 *
 * Wires together all home sub-modules (constants, icons, styles, navbar,
 * input-page, confirm-page, result-page, admin-page) and manages:
 *  - Page routing (Input → Confirm → Result → Admin)
 *  - DOM event binding
 *  - Form state synchronisation
 *  - The public window.HomePage API consumed by the Router
 *
 * Must be loaded LAST among all home/* scripts.
 *
 * Depends on:
 *  HomeApp   (constants.js)  — shared state & tokens
 *  icons.js                  — SVG icon helpers
 *  styles.js                 — style builders
 *  navbar.js                 — renderNavbar
 *  input-page.js             — renderInputPage
 *  confirm-page.js           — renderConfirmPage
 *  result-page.js            — renderResultPage
 *  admin-page.js             — renderAdmin
 */

window.HomePage = (() => {
  var H = window.HomeApp;

  // ── Main Render ────────────────────────────────────────────────────────────
  function _render() {
    var container = H.getContainer();
    if (!container) return;

    var s = H.getState();

    if (s.showAdmin) {
      container.innerHTML = H.renderAdmin();
    } else {
      switch (s.page) {
        case 1:
          container.innerHTML = H.renderInputPage();
          break;
        case 2:
          container.innerHTML = H.renderConfirmPage();
          break;
        case 3:
          container.innerHTML = H.renderResultPage();
          break;
      }
    }
    _attachEvents();
  }

  // Register the render function so setState() can trigger re-renders
  H.setRenderFn(_render);

  // ── Event Binding ──────────────────────────────────────────────────────────
  function _attachEvents() {
    // ── Avatar dropdown toggle ───────────────────────────────
    var avatarBtn = document.getElementById("avatar-btn");
    if (avatarBtn) {
      avatarBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        H.setState({ dropdownOpen: !H.getState().dropdownOpen });
      });
    }

    // ── Dropdown menu items ──────────────────────────────────
    document.querySelectorAll(".dd-item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.dataset.action;
        if (action === "admin") {
          H.setState({ showAdmin: true, dropdownOpen: false });
        } else if (action === "signout") {
          AuthGuard.clearSession();
          Router.navigate("login");
        } else {
          H.setState({ dropdownOpen: false });
        }
      });

      // Hover effects for dropdown items
      btn.addEventListener("mouseenter", function () {
        btn.style.background = btn.dataset.action === "signout" ? "#FEF2F2" : H.BG;
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
        H.setState({ activeTab: btn.dataset.tab, errors: {} });
      });
    });

    // ── Wet / Dry toggle ─────────────────────────────────────
    document.querySelectorAll("[data-wetdry]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        H.setState({ wetDry: btn.dataset.wetdry });
      });
    });

    // ── Process button (Page 1) ──────────────────────────────
    var processBtn = document.getElementById("btn-process");
    if (processBtn) processBtn.addEventListener("click", _handleProcess);

    // ── Confirm page buttons (Page 2) ────────────────────────
    var backBtn = document.getElementById("btn-back");
    if (backBtn) backBtn.addEventListener("click", function () { H.setState({ page: 1 }); });

    var confirmBtn = document.getElementById("btn-confirm");
    if (confirmBtn) confirmBtn.addEventListener("click", function () { H.setState({ page: 3 }); });

    // ── Result page buttons (Page 3) ─────────────────────────
    var cancelResult = document.getElementById("btn-cancel-result");
    if (cancelResult) cancelResult.addEventListener("click", _resetToPage1);

    var submitResult = document.getElementById("btn-submit-result");
    if (submitResult) submitResult.addEventListener("click", _handleSubmitRecord);

    // ── Add chemical button ──────────────────────────────────
    var addChemBtn = document.getElementById("btn-add-chem");
    if (addChemBtn) addChemBtn.addEventListener("click", _handleAddChemical);

    // ── Remove chemical buttons ──────────────────────────────
    document.querySelectorAll("[data-remove-chem]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.dataset.removeChem, 10);
        var chemicals = H.getState().chemicals.slice();
        chemicals.splice(idx, 1);
        H.setState({ chemicals: chemicals });
      });
    });

    // ── Admin back button ────────────────────────────────────
    var adminBack = document.getElementById("btn-admin-back");
    if (adminBack) {
      adminBack.addEventListener("click", function () {
        H.setState({ showAdmin: false, chemFetchAttempted: false, batchFetchAttempted: false, multiplierFetchAttempted: false });
      });
    }

    // ── Date mode toggle (admin) ─────────────────────────────
    document.querySelectorAll("[data-datemode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        H.setState({ adminDateMode: btn.dataset.datemode, analyticsFetchedBar: false });
      });
    });

    // ── Date inputs (admin) ──────────────────────────────────
    var singleDate = document.getElementById("inp-admin-single-date");
    if (singleDate) {
      singleDate.addEventListener("change", function (e) {
        H.setState({ adminSingleDate: e.target.value, analyticsFetchedBar: false });
      });
    }

    var dateFrom = document.getElementById("inp-admin-date-from");
    if (dateFrom) {
      dateFrom.addEventListener("change", function (e) {
        H.setState({ adminDateFrom: e.target.value, analyticsFetchedBar: false });
      });
    }

    var dateTo = document.getElementById("inp-admin-date-to");
    if (dateTo) {
      dateTo.addEventListener("change", function (e) {
        H.setState({ adminDateTo: e.target.value, analyticsFetchedBar: false });
      });
    }

    // ── Admin tab switching ───────────────────────────────────
    document.querySelectorAll("[data-admintab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tab = btn.dataset.admintab;
        H.setState({
          adminTab: tab,
          uploadState: "idle", uploadMsg: "", uploadedRows: [], importResult: null, chemFetchAttempted: false,
          batchUploadState: "idle", batchUploadMsg: "", batchUploadedRows: [], batchImportResult: null, batchFetchAttempted: false,
          prodFetchAttempted: false,
          analyticsFetchedBar: false, analyticsFetchedTrend: false, analyticsFetchedChemNames: false,
        });
      });
    });

    var _s = H.getState();
    if (_s.showAdmin && !_s.chemFetchAttempted && !_s.chemRegistryLoading) {
      _fetchChemicals();
    }
    if (_s.showAdmin && _s.adminTab === "batches" && !_s.batchFetchAttempted && !_s.batchRegistryLoading) {
      _fetchBatches();
    }
    if (_s.showAdmin && _s.adminTab === "multipliers" && !_s.multiplierFetchAttempted && !_s.multiplierRegistryLoading) {
      _fetchMultipliers();
    }
    if (_s.showAdmin && _s.adminTab === "production" && !_s.prodFetchAttempted && !_s.prodRegistryLoading) {
      _fetchProductionRecords();
    }

    // ── Analytics auto-fetch ────────────────────────────────
    if (_s.showAdmin && _s.adminTab === "analytics") {
      if (!_s.analyticsFetchedBar && !_s.analyticsBarLoading) {
        _fetchAnalyticsBarData();
      }
      if (!_s.analyticsFetchedChemNames && !_s.analyticsChemNamesLoading) {
        _fetchAnalyticsChemNames();
      }
      if (_s.analyticsSelectedChem && !_s.analyticsFetchedTrend && !_s.analyticsTrendLoading) {
        _fetchAnalyticsTrendData();
      }
    }

    // ── Trend chemical selector ─────────────────────────────
    var selTrendChem = document.getElementById("sel-trend-chem");
    if (selTrendChem) {
      selTrendChem.addEventListener("change", function (e) {
        H.setState({ analyticsSelectedChem: e.target.value, analyticsFetchedTrend: false, analyticsTrendData: [] });
      });
    }

    // ── Trend range preset buttons ──────────────────────────
    document.querySelectorAll("[data-trend-range]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        H.setState({ analyticsTrendRange: btn.dataset.trendRange, analyticsFetchedTrend: false, analyticsTrendData: [] });
      });
    });

    // ── Trend custom date inputs ────────────────────────────
    var trendFrom = document.getElementById("inp-trend-from");
    if (trendFrom) {
      trendFrom.addEventListener("change", function (e) {
        H.setState({ analyticsTrendFrom: e.target.value, analyticsFetchedTrend: false });
      });
    }
    var trendTo = document.getElementById("inp-trend-to");
    if (trendTo) {
      trendTo.addEventListener("change", function (e) {
        H.setState({ analyticsTrendTo: e.target.value, analyticsFetchedTrend: false });
      });
    }

    // ── Chemicals tab: drop zone ───────────────────────────────
    var dropzone = document.getElementById("chem-dropzone");
    if (dropzone) {
      dropzone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropzone.style.borderColor = H.ACCENT;
        dropzone.style.background = H.ACCENT_LIGHT;
      });
      dropzone.addEventListener("dragleave", function () {
        dropzone.style.borderColor = H.BORDER;
        dropzone.style.background = "#FAFBFC";
      });
      dropzone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropzone.style.borderColor = H.BORDER;
        dropzone.style.background = "#FAFBFC";
        _parseChemFile(e.dataTransfer.files[0]);
      });
      dropzone.addEventListener("click", function () {
        var fi = document.getElementById("chem-file-input");
        if (fi && H.getState().uploadState !== "parsing") fi.click();
      });
    }

    var chemFileInput = document.getElementById("chem-file-input");
    if (chemFileInput) {
      chemFileInput.addEventListener("change", function (e) {
        _parseChemFile(e.target.files[0]);
        e.target.value = ""; // reset so same file can be re-selected
      });
    }

    // ── Chemicals tab: confirm / discard import ───────────────────
    var confirmImport = document.getElementById("btn-chem-confirm-import");
    if (confirmImport) {
      confirmImport.addEventListener("click", async function () {
        var rows = H.getState().uploadedRows || [];
        H.setState({ uploadState: "importing", uploadedRows: [] });
        try {
          var result = await window.electronAPI.chemicalsImport(rows);
          if (result.success) {
            H.setState({ uploadState: "done", importResult: result.data });
            _fetchChemicals(); // refresh the registry from DB
          } else {
            H.setState({ uploadState: "error", uploadMsg: result.message || "Import failed." });
          }
        } catch (err) {
          H.setState({ uploadState: "error", uploadMsg: "Import error: " + err.message });
        }
      });
      confirmImport.addEventListener("mouseenter", function () { confirmImport.style.background = H.ACCENT_HOVER; });
      confirmImport.addEventListener("mouseleave", function () { confirmImport.style.background = H.ACCENT; });
    }

    var discardImport = document.getElementById("btn-chem-discard-import");
    if (discardImport) {
      discardImport.addEventListener("click", function () {
        H.setState({ uploadState: "idle", uploadMsg: "", uploadedRows: [] });
      });
    }

    // ── Chemicals tab: delete from database ──────────────────────
    document.querySelectorAll("[data-chem-remove]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var chemId = btn.dataset.chemRemove;
        if (!confirm('Delete chemical "' + chemId + '"?\n\nThis action cannot be undone.')) return;
        try {
          var result = await window.electronAPI.chemicalsDelete(chemId);
          if (result.success) {
            _fetchChemicals();
          } else {
            alert("Failed to delete: " + (result.message || "Unknown error."));
          }
        } catch (err) {
          alert("Delete error: " + err.message);
        }
      });
    });

    // ── Chemicals tab: open edit modal ────────────────────────────
    document.querySelectorAll("[data-chem-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chemId = btn.dataset.chemEdit;
        var chem = (H.getState().chemRegistry || []).find(function (c) { return c.chemical_id === chemId; });
        if (chem) H.setState({ editingChem: { chemical_id: chem.chemical_id, chemical_name: chem.chemical_name } });
      });
    });

    // ── Chemicals tab: edit modal save ────────────────────────────
    var editSaveBtn = document.getElementById("btn-edit-chem-save");
    if (editSaveBtn) {
      editSaveBtn.addEventListener("click", async function () {
        var oldId    = (H.getState().editingChem || {}).chemical_id;
        var newIdEl  = document.getElementById("edit-chem-id");
        var newNameEl = document.getElementById("edit-chem-name");
        var errEl    = document.getElementById("edit-chem-error");
        var newId    = newIdEl ? newIdEl.value.trim() : "";
        var newName  = newNameEl ? newNameEl.value.trim() : "";
        if (!newId || !newName) {
          if (errEl) errEl.textContent = "Both fields are required.";
          return;
        }
        editSaveBtn.disabled = true;
        editSaveBtn.textContent = "Saving\u2026";
        try {
          var result = await window.electronAPI.chemicalsUpdate(oldId, newId, newName);
          if (result.success) {
            H.setState({ editingChem: null, chemFetchAttempted: false });
          } else {
            if (errEl) errEl.textContent = result.message || "Update failed.";
            editSaveBtn.disabled = false;
            editSaveBtn.textContent = "Save Changes";
          }
        } catch (err) {
          if (errEl) errEl.textContent = "Save error: " + err.message;
          editSaveBtn.disabled = false;
          editSaveBtn.textContent = "Save Changes";
        }
      });
    }

    // ── Chemicals tab: edit modal cancel / backdrop click ─────────
    var editCancelBtn = document.getElementById("btn-edit-chem-cancel");
    if (editCancelBtn) {
      editCancelBtn.addEventListener("click", function () { H.setState({ editingChem: null }); });
    }
    var backdrop = document.getElementById("edit-chem-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) H.setState({ editingChem: null });
      });
    }

    // ── Chemicals tab: search (debounced) ──────────────────────
    var chemSearch = document.getElementById("chem-search");
    if (chemSearch) {
      var _chemSearchTimer = null;
      chemSearch.addEventListener("input", function (e) {
        var val = e.target.value;
        H.getState().chemSearch = val;
        clearTimeout(_chemSearchTimer);
        _chemSearchTimer = setTimeout(function () { H.setState({ chemSearch: val }); }, 260);
      });
    }

    // ── Chemicals tab: column sort ─────────────────────────────
    document.querySelectorAll("[data-sort-col]").forEach(function (th) {
      th.addEventListener("click", function () {
        var col = th.dataset.sortCol;
        var cur = H.getState();
        var newDir = (cur.chemSortCol === col && cur.chemSortDir === "asc") ? "desc" : "asc";
        H.setState({ chemSortCol: col, chemSortDir: newDir });
      });
    });

    // ── Batches tab: drop zone ────────────────────────────────────
    var batchDropzone = document.getElementById("batch-dropzone");
    if (batchDropzone) {
      batchDropzone.addEventListener("dragover", function (e) {
        e.preventDefault();
        batchDropzone.style.borderColor = H.ACCENT;
        batchDropzone.style.background = H.ACCENT_LIGHT;
      });
      batchDropzone.addEventListener("dragleave", function () {
        batchDropzone.style.borderColor = H.BORDER;
        batchDropzone.style.background = "#FAFBFC";
      });
      batchDropzone.addEventListener("drop", function (e) {
        e.preventDefault();
        batchDropzone.style.borderColor = H.BORDER;
        batchDropzone.style.background = "#FAFBFC";
        _parseBatchFile(e.dataTransfer.files[0]);
      });
      batchDropzone.addEventListener("click", function () {
        var fi = document.getElementById("batch-file-input");
        if (fi && H.getState().batchUploadState !== "parsing") fi.click();
      });
    }
    var batchFileInput = document.getElementById("batch-file-input");
    if (batchFileInput) {
      batchFileInput.addEventListener("change", function (e) {
        _parseBatchFile(e.target.files[0]);
        e.target.value = "";
      });
    }

    // ── Batches tab: confirm / discard import ─────────────────────
    var batchConfirmImport = document.getElementById("btn-batch-confirm-import");
    if (batchConfirmImport) {
      batchConfirmImport.addEventListener("click", async function () {
        var rows = H.getState().batchUploadedRows || [];
        H.setState({ batchUploadState: "importing", batchUploadedRows: [] });
        try {
          var result = await window.electronAPI.batchesImport(rows);
          if (result.success) {
            H.setState({ batchUploadState: "done", batchImportResult: result.data });
            _fetchBatches();
          } else {
            H.setState({ batchUploadState: "error", batchUploadMsg: result.message || "Import failed." });
          }
        } catch (err) {
          H.setState({ batchUploadState: "error", batchUploadMsg: "Import error: " + err.message });
        }
      });
      batchConfirmImport.addEventListener("mouseenter", function () { batchConfirmImport.style.background = H.ACCENT_HOVER; });
      batchConfirmImport.addEventListener("mouseleave", function () { batchConfirmImport.style.background = H.ACCENT; });
    }
    var batchDiscardImport = document.getElementById("btn-batch-discard-import");
    if (batchDiscardImport) {
      batchDiscardImport.addEventListener("click", function () {
        H.setState({ batchUploadState: "idle", batchUploadMsg: "", batchUploadedRows: [] });
      });
    }

    // ── Batches tab: delete ───────────────────────────────────────
    document.querySelectorAll("[data-batch-remove]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var batchId = btn.dataset.batchRemove;
        if (!confirm('Delete batch "' + batchId + '"?\n\nThis will also remove all linked chemical records. This action cannot be undone.')) return;
        try {
          var result = await window.electronAPI.batchesDelete(batchId);
          if (result.success) {
            _fetchBatches();
          } else {
            alert("Failed to delete: " + (result.message || "Unknown error."));
          }
        } catch (err) {
          alert("Delete error: " + err.message);
        }
      });
    });

    // ── Batches tab: expand row ─────────────────────────────────
    document.querySelectorAll("[data-batch-expand]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var batchId = btn.dataset.batchExpand;
        var cur = H.getState().expandedBatchId;
        H.setState({ expandedBatchId: cur === batchId ? null : batchId });
      });
    });

    // ── Batches tab: open edit modal ───────────────────────────
    document.querySelectorAll("[data-batch-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var batchId = btn.dataset.batchEdit;
        var batch   = (H.getState().batchRegistry || []).find(function (b) { return b.batch_id === batchId; });
        if (!batch) return;
        H.setState({
          editingBatch: {
            orig_batch_id: batch.batch_id,
            batch_id:      batch.batch_id,
            schedule_date: batch.schedule_date || "",
            stenter:       batch.stenter || "",
            weight:        batch.weight || "",
            width:         batch.width || "",
            length:        batch.length || "",
            gsm:           batch.gsm || "",
            temperature:   batch.temperature || "",
            chemicals:     JSON.parse(JSON.stringify(batch.chemicals || [])),
          }
        });
      });
    });

    // ── Batches tab: remove chemical in modal ──────────────────
    document.querySelectorAll("[data-batch-modal-chem-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var chemId = btn.dataset.batchModalChemRemove;
        var eb = H.getState().editingBatch;
        if (!eb) return;
        var newChems = (eb.chemicals || []).filter(function (c) { return c.chemical_id !== chemId; });
        H.setState({ editingBatch: Object.assign({}, eb, { chemicals: newChems }) });
      });
    });

    // ── Batches tab: add chemical in modal ─────────────────────
    var batchModalAddBtn = document.getElementById("btn-batch-modal-chem-add");
    if (batchModalAddBtn) {
      batchModalAddBtn.addEventListener("click", function () {
        var selectEl  = document.getElementById("batch-modal-chem-select");
        var densityEl = document.getElementById("batch-modal-chem-density");
        var errEl     = document.getElementById("edit-batch-error");
        var chemId    = selectEl  ? selectEl.value.trim()  : "";
        var densityRaw = densityEl ? densityEl.value.trim() : "";
        if (!chemId)    { if (errEl) errEl.textContent = "Please select a chemical."; return; }
        if (!densityRaw || isNaN(Number(densityRaw))) { if (errEl) errEl.textContent = "Please enter a numeric density."; return; }
        var density = densityRaw + "g/L";
        var eb = H.getState().editingBatch;
        if (!eb) return;
        var already = (eb.chemicals || []).some(function (c) { return c.chemical_id === chemId; });
        if (already) { if (errEl) errEl.textContent = "This chemical is already linked to this batch."; return; }
        var chemReg  = H.getState().chemRegistry || [];
        var chemObj  = chemReg.find(function (c) { return c.chemical_id === chemId; });
        var newChems = (eb.chemicals || []).concat([{
          chemical_id:   chemId,
          chemical_name: chemObj ? chemObj.chemical_name : "",
          density:       density,
        }]);
        if (errEl) errEl.textContent = "";
        H.setState({ editingBatch: Object.assign({}, eb, { chemicals: newChems }) });
      });
    }

    // ── Batches tab: edit modal save ──────────────────────────
    var batchSaveBtn = document.getElementById("btn-edit-batch-save");
    if (batchSaveBtn) {
      batchSaveBtn.addEventListener("click", async function () {
        var eb    = H.getState().editingBatch || {};
        var errEl = document.getElementById("edit-batch-error");
        var v     = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
        var newId = v("edit-batch-id");
        if (!newId) { if (errEl) errEl.textContent = "Batch ID is required."; return; }
        var batch = {
          batch_id:      newId,
          schedule_date: v("edit-batch-date"),
          stenter:       v("edit-batch-stenter"),
          weight:        v("edit-batch-weight"),
          width:         v("edit-batch-width"),
          length:        v("edit-batch-length"),
          gsm:           v("edit-batch-gsm"),
          temperature:   v("edit-batch-temperature"),
          chemicals:     eb.chemicals || [],
        };
        batchSaveBtn.disabled = true;
        batchSaveBtn.textContent = "Saving…";
        try {
          var result = await window.electronAPI.batchesUpdateFull(eb.orig_batch_id, batch);
          if (result.success) {
            H.setState({ editingBatch: null, batchFetchAttempted: false });
          } else {
            if (errEl) errEl.textContent = result.message || "Update failed.";
            batchSaveBtn.disabled = false;
            batchSaveBtn.textContent = "Save Changes";
          }
        } catch (err) {
          if (errEl) errEl.textContent = "Save error: " + err.message;
          batchSaveBtn.disabled = false;
          batchSaveBtn.textContent = "Save Changes";
        }
      });
    }
    var batchCancelBtn = document.getElementById("btn-edit-batch-cancel");
    if (batchCancelBtn) batchCancelBtn.addEventListener("click", function () { H.setState({ editingBatch: null }); });
    var batchBackdrop = document.getElementById("edit-batch-backdrop");
    if (batchBackdrop) batchBackdrop.addEventListener("click", function (e) { if (e.target === batchBackdrop) H.setState({ editingBatch: null }); });

    // ── Batches tab: search ──────────────────────────────────────
    var batchSearch = document.getElementById("batch-search");
    if (batchSearch) {
      var _batchSearchTimer = null;
      batchSearch.addEventListener("input", function (e) {
        var val = e.target.value;
        H.getState().batchSearch = val;
        clearTimeout(_batchSearchTimer);
        _batchSearchTimer = setTimeout(function () { H.setState({ batchSearch: val }); }, 260);
      });
    }

    // ── Batches tab: column sort ──────────────────────────────
    document.querySelectorAll("[data-batch-sort-col]").forEach(function (th) {
      th.addEventListener("click", function () {
        var col = th.dataset.batchSortCol;
        var cur = H.getState();
        var newDir = (cur.batchSortCol === col && cur.batchSortDir === "asc") ? "desc" : "asc";
        H.setState({ batchSortCol: col, batchSortDir: newDir });
      });
    });

    // ── Production tab: expand row ────────────────────────────
    document.querySelectorAll("[data-prod-expand]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var recId = parseInt(btn.dataset.prodExpand, 10);
        var cur = H.getState().expandedProdId;
        H.setState({ expandedProdId: cur === recId ? null : recId });
      });
    });

    // ── Production tab: delete ────────────────────────────────
    document.querySelectorAll("[data-prod-remove]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var recId = parseInt(btn.dataset.prodRemove, 10);
        if (!confirm("Delete production record #" + recId + "?\n\nThis action cannot be undone.")) return;
        try {
          var result = await window.electronAPI.productionDelete(recId);
          if (result.success) {
            // Remove from local state immediately
            var cur = H.getState();
            var updated = (cur.prodRegistry || []).filter(function (r) { return r.id !== recId; });
            var newSelected = (cur.prodSelectedIds || []).filter(function (id) { return id !== recId; });
            H.setState({ prodRegistry: updated, prodSelectedIds: newSelected });
          } else {
            alert("Failed to delete: " + (result.message || "Unknown error."));
          }
        } catch (err) {
          alert("Delete error: " + err.message);
        }
      });
    });

    // ── Production tab: individual select checkbox ────────────
    document.querySelectorAll("[data-prod-select]").forEach(function (cb) {
      cb.addEventListener("change", function () {
        var recId = parseInt(cb.dataset.prodSelect, 10);
        var cur = H.getState().prodSelectedIds || [];
        if (cb.checked) {
          if (cur.indexOf(recId) === -1) cur = cur.concat([recId]);
        } else {
          cur = cur.filter(function (id) { return id !== recId; });
        }
        H.setState({ prodSelectedIds: cur });
      });
    });

    // ── Production tab: select-all checkbox ───────────────────
    var prodSelectAll = document.getElementById("prod-select-all");
    if (prodSelectAll) {
      prodSelectAll.addEventListener("change", function () {
        var s = H.getState();
        var registry = s.prodRegistry || [];
        var search = (s.prodSearch || "").toLowerCase();
        var visibleIds = registry.filter(function (r) {
          return (r.batch_id || "").toLowerCase().indexOf(search) !== -1 ||
                 (r.stenter  || "").toLowerCase().indexOf(search) !== -1 ||
                 (r.user_name || "").toLowerCase().indexOf(search) !== -1 ||
                 String(r.id).indexOf(search) !== -1;
        }).map(function (r) { return r.id; });
        if (prodSelectAll.checked) {
          // Merge visible IDs with already selected
          var merged = (s.prodSelectedIds || []).slice();
          visibleIds.forEach(function (id) { if (merged.indexOf(id) === -1) merged.push(id); });
          H.setState({ prodSelectedIds: merged });
        } else {
          // Remove visible IDs from selection
          var remaining = (s.prodSelectedIds || []).filter(function (id) { return visibleIds.indexOf(id) === -1; });
          H.setState({ prodSelectedIds: remaining });
        }
      });
    }

    // ── Production tab: search (debounced) ────────────────────
    var prodSearch = document.getElementById("prod-search");
    if (prodSearch) {
      var _prodSearchTimer = null;
      prodSearch.addEventListener("input", function (e) {
        var val = e.target.value;
        H.getState().prodSearch = val;
        clearTimeout(_prodSearchTimer);
        _prodSearchTimer = setTimeout(function () { H.setState({ prodSearch: val }); }, 260);
      });
    }

    // ── Production tab: column sort ───────────────────────────
    document.querySelectorAll("[data-prod-sort-col]").forEach(function (th) {
      th.addEventListener("click", function () {
        var col = th.dataset.prodSortCol;
        var cur = H.getState();
        var newDir = (cur.prodSortCol === col && cur.prodSortDir === "asc") ? "desc" : "asc";
        H.setState({ prodSortCol: col, prodSortDir: newDir });
      });
    });

    // ── Production tab: XLSX download ─────────────────────────
    var prodDownloadBtn = document.getElementById("btn-prod-download");
    if (prodDownloadBtn) {
      prodDownloadBtn.addEventListener("click", function () {
        var XLSX = window.XLSX;
        if (!XLSX) { alert("XLSX library not available. Please restart the app."); return; }
        var s = H.getState();
        var selectedIds = s.prodSelectedIds || [];
        var registry = s.prodRegistry || [];
        var selected = registry.filter(function (r) { return selectedIds.indexOf(r.id) !== -1; });
        if (selected.length === 0) return;

        // Flatten records into rows (one row per chemical per record)
        var rows = [];
        selected.forEach(function (r) {
          var chemList = Array.isArray(r.chemicals) ? r.chemicals : [];
          if (chemList.length === 0) {
            rows.push({
              "Record ID":        r.id,
              "Batch ID":         r.batch_id || "",
              "Operator":         r.user_name || "",
              "Submitted":        r.submitted_at ? new Date(r.submitted_at).toLocaleString("en-GB") : "",
              "Schedule Date":    r.schedule_date || "",
              "Stenter":          r.stenter || "",
              "Wet/Dry":          r.wet_dry || "",
              "GSM":              r.gsm || "",
              "Width (cm)":       r.width || "",
              "Length (m)":       r.length || "",
              "Cloth Weight (kg)": r.cloth_weight || "",
              "Fabric Factor":    r.fabric_factor || "",
              "GSM Range":        r.gsm_range || "",
              "Multiplier":       r.multiplier || "",
              "Total Bath (raw)": r.total_bath || "",
              "T Value (L)":      r.t_value || "",
              "Bath Concentration": r.bath_concentration || "",
              "Chemical ID":      "",
              "Chemical Name":    "",
              "Density (g/L)":    "",
              "Dosage":           "",
            });
          } else {
            chemList.forEach(function (c) {
              rows.push({
                "Record ID":        r.id,
                "Batch ID":         r.batch_id || "",
                "Operator":         r.user_name || "",
                "Submitted":        r.submitted_at ? new Date(r.submitted_at).toLocaleString("en-GB") : "",
                "Schedule Date":    r.schedule_date || "",
                "Stenter":          r.stenter || "",
                "Wet/Dry":          r.wet_dry || "",
                "GSM":              r.gsm || "",
                "Width (cm)":       r.width || "",
                "Length (m)":       r.length || "",
                "Cloth Weight (kg)": r.cloth_weight || "",
                "Fabric Factor":    r.fabric_factor || "",
                "GSM Range":        r.gsm_range || "",
                "Multiplier":       r.multiplier || "",
                "Total Bath (raw)": r.total_bath || "",
                "T Value (L)":      r.t_value || "",
                "Bath Concentration": r.bath_concentration || "",
                "Chemical ID":      c.chemical_id || "",
                "Chemical Name":    c.chemical_name || "",
                "Density (g/L)":    c.density || "",
                "Dosage":           c.dosage || "",
              });
            });
          }
        });

        var ws = XLSX.utils.json_to_sheet(rows);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Production Records");
        var fileName = "production_records_" + new Date().toISOString().slice(0, 10) + ".xlsx";
        XLSX.writeFile(wb, fileName);
      });
    }

    // ── Multipliers tab: save button per row ─────────────────
    document.querySelectorAll("[data-save-multiplier]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var gsmRange = btn.dataset.saveMultiplier;
        var wetEl    = document.getElementById("inp-wet-mult-" + gsmRange);
        var dryEl    = document.getElementById("inp-dry-mult-" + gsmRange);
        var msgEl    = document.getElementById("mult-msg-" + gsmRange);
        var wet = wetEl ? parseFloat(wetEl.value) : NaN;
        var dry = dryEl ? parseFloat(dryEl.value) : NaN;
        if (isNaN(wet) || wet <= 0 || isNaN(dry) || dry <= 0) {
          if (msgEl) { msgEl.textContent = "Enter valid positive values."; msgEl.style.color = "#DC2626"; }
          return;
        }
        btn.disabled = true;
        btn.textContent = "Saving\u2026";
        try {
          var result = await window.electronAPI.multipliersUpdate(gsmRange, wet, dry);
          if (result.success) {
            var reg = (H.getState().multiplierRegistry || []).map(function (r) {
              return r.gsm_range === gsmRange
                ? Object.assign({}, r, { wet_multiplier: wet, dry_multiplier: dry })
                : r;
            });
            H.setState({ multiplierRegistry: reg });
          } else {
            btn.disabled = false;
            btn.textContent = "Save";
            if (msgEl) { msgEl.textContent = result.message || "Save failed."; msgEl.style.color = "#DC2626"; }
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = "Save";
          if (msgEl) { msgEl.textContent = "Error: " + err.message; msgEl.style.color = "#DC2626"; }
        }
      });
    });

    // ── Multipliers tab: delete button per row ───────────────
    document.querySelectorAll("[data-delete-multiplier]").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var gsmRange = btn.dataset.deleteMultiplier;
        var msgEl    = document.getElementById("mult-msg-" + gsmRange);
        if (!confirm("Delete multiplier range \"" + gsmRange + "\"?")) return;
        btn.disabled = true;
        try {
          var result = await window.electronAPI.multipliersDelete(gsmRange);
          if (result.success) {
            var reg = (H.getState().multiplierRegistry || []).filter(function (r) {
              return r.gsm_range !== gsmRange;
            });
            H.setState({ multiplierRegistry: reg });
          } else {
            btn.disabled = false;
            if (msgEl) { msgEl.textContent = result.message || "Delete failed."; msgEl.style.color = "#DC2626"; }
          }
        } catch (err) {
          btn.disabled = false;
          if (msgEl) { msgEl.textContent = "Error: " + err.message; msgEl.style.color = "#DC2626"; }
        }
      });
    });

    // ── Multipliers tab: add new range ───────────────────────
    var addMultBtn = document.getElementById("btn-add-multiplier");
    if (addMultBtn) {
      addMultBtn.addEventListener("click", async function () {
        var minEl  = document.getElementById("inp-new-mult-min");
        var maxEl  = document.getElementById("inp-new-mult-max");
        var wetEl  = document.getElementById("inp-new-mult-wet");
        var dryEl  = document.getElementById("inp-new-mult-dry");
        var msgEl  = document.getElementById("mult-add-msg");
        var rMin = minEl ? parseFloat(minEl.value) : NaN;
        var rMax = maxEl ? parseFloat(maxEl.value) : NaN;
        var wet  = wetEl ? parseFloat(wetEl.value) : NaN;
        var dry  = dryEl ? parseFloat(dryEl.value) : NaN;
        if (isNaN(rMin) || isNaN(rMax) || rMax <= rMin) {
          if (msgEl) { msgEl.textContent = "Range min must be less than max."; msgEl.style.color = "#DC2626"; }
          return;
        }
        if (isNaN(wet) || wet <= 0 || isNaN(dry) || dry <= 0) {
          if (msgEl) { msgEl.textContent = "Enter valid positive multiplier values."; msgEl.style.color = "#DC2626"; }
          return;
        }
        var gsmRange = Math.round(rMin) + "-" + Math.round(rMax);
        var sortOrder = (H.getState().multiplierRegistry || []).length + 1;
        addMultBtn.disabled = true;
        addMultBtn.textContent = "Adding\u2026";
        try {
          var result = await window.electronAPI.multipliersAdd(gsmRange, rMin, rMax, wet, dry, sortOrder);
          if (result.success) {
            // Refresh the full list from DB to get correct sort order
            var listRes = await window.electronAPI.multipliersList();
            if (listRes.success) {
              H.setState({ multiplierRegistry: listRes.data });
            } else {
              // Fallback: add locally
              var reg = (H.getState().multiplierRegistry || []).concat([{
                gsm_range: gsmRange, range_min: rMin, range_max: rMax,
                wet_multiplier: wet, dry_multiplier: dry, sort_order: sortOrder
              }]);
              H.setState({ multiplierRegistry: reg });
            }
          } else {
            addMultBtn.disabled = false;
            addMultBtn.textContent = "+ Add Range";
            if (msgEl) { msgEl.textContent = result.message || "Add failed."; msgEl.style.color = "#DC2626"; }
          }
        } catch (err) {
          addMultBtn.disabled = false;
          addMultBtn.textContent = "+ Add Range";
          if (msgEl) { msgEl.textContent = "Error: " + err.message; msgEl.style.color = "#DC2626"; }
        }
      });
    }

    // ── Live input binding (no re-render) ────────────────────
    _attachInputListeners();

    // ── Button hover effects ─────────────────────────────────
    _attachHoverEffects();
  }

  // Bind form inputs to state without triggering re-render
  function _attachInputListeners() {
    var s = H.getState();
    var bindings = [
      { id: "inp-batch",        key: "batchNumber" },
      { id: "inp-stenter",      key: "stenter",       event: "change" },
      { id: "inp-gsm",          key: "gsm" },
      { id: "inp-width",        key: "width" },
      { id: "inp-length",       key: "length" },
      { id: "inp-weight",       key: "clothWeight" },
      { id: "inp-chem-select",     key: "selectedChemical", event: "change" },
      { id: "inp-chem-density",  key: "chemicalDensity" },
    ];

    bindings.forEach(function (b) {
      var el = document.getElementById(b.id);
      if (el) {
        el.addEventListener(b.event || "input", function (e) {
          H.getState()[b.key] = e.target.value;
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
        el.addEventListener("mouseenter", function () { el.style.background = H.ACCENT_HOVER; });
        el.addEventListener("mouseleave", function () { el.style.background = H.ACCENT; });
      }
    });

    // Secondary button hover (back, cancel)
    var secondaryBtns = ["btn-back", "btn-cancel-result"];
    secondaryBtns.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("mouseenter", function () { el.style.background = H.BG; });
        el.addEventListener("mouseleave", function () { el.style.background = "transparent"; });
      }
    });

    // Admin back button hover
    var adminBack = document.getElementById("btn-admin-back");
    if (adminBack) {
      adminBack.addEventListener("mouseenter", function () { adminBack.style.background = H.ACCENT_LIGHT; });
      adminBack.addEventListener("mouseleave", function () { adminBack.style.background = "none"; });
    }
  }

  // ── Outside click handler for closing dropdown ─────────────────────────────
  function _handleOutsideClick(e) {
    if (H.getState().dropdownOpen) {
      var dropdown = document.getElementById("dropdown-menu");
      var avatar = document.getElementById("avatar-btn");
      if (
        dropdown && !dropdown.contains(e.target) &&
        avatar && !avatar.contains(e.target)
      ) {
        H.setState({ dropdownOpen: false });
      }
    }
  }

  // ── Sync input values from DOM into state ──────────────────────────────────
  function _syncInputState() {
    var s = H.getState();
    var fields = [
      { id: "inp-batch",        key: "batchNumber" },
      { id: "inp-stenter",      key: "stenter" },
      { id: "inp-gsm",          key: "gsm" },
      { id: "inp-width",        key: "width" },
      { id: "inp-length",       key: "length" },
      { id: "inp-weight",       key: "clothWeight" },
      { id: "inp-chem-select",     key: "selectedChemical" },
      { id: "inp-chem-density",  key: "chemicalDensity" },
    ];
    fields.forEach(function (f) {
      var el = document.getElementById(f.id);
      if (el) s[f.key] = el.value;
    });
  }

  // ── Process button handler ─────────────────────────────────────────────────
  function _handleProcess() {
    _syncInputState();

    var s = H.getState();
    var errors = {};

    if (!s.batchNumber.trim()) {
      errors.batchNumber = "Batch number is required";
    }

    if (s.activeTab === "complex") {
      var gsmVal = parseFloat(s.gsm);
      if (!s.gsm || gsmVal <= 0) {
        errors.gsm = "Must be a positive number";
      } else if (gsmVal <= 100 || gsmVal > 400) {
        errors.gsm = "GSM must be between 100 and 400";
      } else {
        // Validate GSM falls within a defined multiplier range
        var multReg = s.multiplierRegistry || [];
        var gsmInRange = false;
        for (var mi = 0; mi < multReg.length; mi++) {
          var rMin = parseFloat(multReg[mi].range_min);
          var rMax = parseFloat(multReg[mi].range_max);
          if (gsmVal > rMin && gsmVal <= rMax) { gsmInRange = true; break; }
        }
        if (!gsmInRange && multReg.length > 0) {
          errors.gsm = "GSM " + gsmVal + " does not match any defined multiplier range";
        }
      }
      if (!s.width || parseFloat(s.width) <= 0) errors.width = "Must be a positive number";
      if (!s.length || parseFloat(s.length) <= 0) errors.length = "Must be a positive number";
      if (!s.clothWeight || parseFloat(s.clothWeight) <= 0) errors.clothWeight = "Must be a positive number";
      if (s.chemicals.length === 0) errors.chemicals = "At least one chemical must be added";
    }

    if (Object.keys(errors).length > 0) {
      H.setState({ errors: errors });
      return;
    }

    // ── Simple mode: fetch batch data from database ──────────────────────────
    if (s.activeTab === "simple") {
      H.setState({ errors: {}, fetchingBatch: true });
      window.electronAPI.batchesGet(s.batchNumber.trim())
        .then(function (result) {
          if (!result.success) {
            H.setState({
              fetchingBatch: false,
              errors: { batchNumber: result.message || "Batch not found in database" }
            });
            return;
          }
          var b = result.data;
          // Validate GSM from DB
          var dbGsm = parseFloat(b.gsm) || 0;
          if (dbGsm <= 100 || dbGsm > 400) {
            H.setState({
              fetchingBatch: false,
              errors: { batchNumber: "Batch GSM (" + b.gsm + ") is outside valid ranges (100-400)" }
            });
            return;
          }
          // Map batch chemicals to the format used by the calculation
          var chems = (b.chemicals || []).map(function (c) {
            return { name: c.chemical_name || c.chemical_id, chemical_id: c.chemical_id || "", density: parseFloat(c.density) || 0 };
          });
          // Populate state with DB data and advance to confirm page
          H.setState({
            fetchingBatch: false,
            scheduleDate: b.schedule_date || "",
            stenter: b.stenter || "",
            gsm: b.gsm || "",
            width: b.width || "",
            length: b.length || "",
            clothWeight: b.weight || "",
            chemicals: chems,
            errors: {},
            page: 2,
          });
        })
        .catch(function (err) {
          H.setState({
            fetchingBatch: false,
            errors: { batchNumber: "Failed to fetch batch: " + err.message }
          });
        });
      return;
    }

    H.setState({ errors: {}, page: 2 });
  }

  // ── Add chemical handler ───────────────────────────────────────────────────
  function _handleAddChemical() {
    _syncInputState();

    var s = H.getState();
    var density = parseFloat(s.chemicalDensity);
    if (!density || density <= 0) {
      var newErrors = Object.assign({}, s.errors || {});
      newErrors.chemicalDensity = "Enter a valid positive density (g/L)";
      H.setState({ errors: newErrors });
      return;
    }

    var chemicals = s.chemicals.slice();
    chemicals.push({ name: s.selectedChemical, density: density });
    H.setState({ chemicals: chemicals, chemicalDensity: "", errors: {} });
  }

  // ── Reset everything and go back to Page 1 ────────────────────────────────
  function _resetToPage1() {
    H.resetState();
    _render();
  }

  // ── Submit production record handler ─────────────────────────────────────
  function _handleSubmitRecord() {
    var s = H.getState();
    var calc = s._calcResult;
    if (!calc) {
      console.error("[HomePage] No calculation result available for submission.");
      return;
    }

    var session = AuthGuard.getSession();
    if (!session || !session.user) {
      console.error("[HomePage] No user session — cannot submit.");
      return;
    }

    var record = {
      user_id: session.user.id,
      batch_id: s.batchNumber || null,
      schedule_date: s.scheduleDate || null,
      stenter: s.stenter || null,
      wet_dry: s.wetDry,
      gsm: parseFloat(s.gsm) || 0,
      width: parseFloat(s.width) || 0,
      length: parseFloat(s.length) || 0,
      cloth_weight: parseFloat(s.clothWeight) || 0,
      fabric_factor: calc.fabricFactor,
      gsm_range: calc.gsmRange,
      multiplier: calc.multiplier,
      total_bath: calc.totalBath,
      t_value: calc.tValue,
      bath_concentration: calc.bathConcentration,
      chemicals: calc.chemDosages.map(function (c) {
        return { name: c.name, chemical_id: c.chemical_id || "", density: c.density, dosage: c.dosage };
      }),
    };

    // Disable submit button during save
    var submitBtn = document.getElementById("btn-submit-result");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
      submitBtn.style.opacity = "0.6";
      submitBtn.style.cursor = "not-allowed";
    }

    window.electronAPI.productionSubmit(record)
      .then(function (result) {
        if (result.success) {
          // Show brief success feedback before resetting
          if (submitBtn) {
            submitBtn.textContent = "✓ Submitted!";
            submitBtn.style.background = "#16A34A";
          }
          setTimeout(function () {
            _resetToPage1();
          }, 800);
        } else {
          console.error("[HomePage] production:submit failed:", result.message);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "✓ Submit Record";
            submitBtn.style.opacity = "1";
            submitBtn.style.cursor = "pointer";
          }
          // Show error near the button
          var errDiv = document.createElement("div");
          errDiv.style.cssText = "color:#C0392B;font-size:13px;text-align:center;margin-top:8px";
          errDiv.textContent = result.message || "Failed to submit. Please try again.";
          if (submitBtn && submitBtn.parentNode && submitBtn.parentNode.parentNode) {
            submitBtn.parentNode.parentNode.appendChild(errDiv);
          }
        }
      })
      .catch(function (err) {
        console.error("[HomePage] production:submit error:", err.message);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "✓ Submit Record";
          submitBtn.style.opacity = "1";
          submitBtn.style.cursor = "pointer";
        }
      });
  }

  // ── Fetch chemicals from database ───────────────────────────────────
  function _fetchChemicals() {
    H.setState({ chemRegistryLoading: true, chemFetchAttempted: true });
    window.electronAPI.chemicalsList()
      .then(function (result) {
        if (result.success) {
          H.setState({ chemRegistry: result.data, chemRegistryLoading: false });
        } else {
          H.setState({ chemRegistryLoading: false });
          console.warn("[HomePage] Failed to load chemicals:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ chemRegistryLoading: false });
        console.error("[HomePage] chemicals:list error:", err.message);
      });
  }

  function _fetchBatches() {
    H.setState({ batchRegistryLoading: true, batchFetchAttempted: true });
    window.electronAPI.batchesList()
      .then(function (result) {
        if (result.success) {
          H.setState({ batchRegistry: result.data, batchRegistryLoading: false });
        } else {
          H.setState({ batchRegistryLoading: false });
          console.warn("[HomePage] Failed to load batches:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ batchRegistryLoading: false });
        console.error("[HomePage] batches:list error:", err.message);
      });
  }

  function _fetchMultipliers() {
    H.setState({ multiplierRegistryLoading: true, multiplierFetchAttempted: true });
    window.electronAPI.multipliersList()
      .then(function (result) {
        if (result.success) {
          H.setState({ multiplierRegistry: result.data, multiplierRegistryLoading: false });
        } else {
          H.setState({ multiplierRegistryLoading: false });
          console.warn("[HomePage] Failed to load multipliers:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ multiplierRegistryLoading: false });
        console.error("[HomePage] multipliers:list error:", err.message);
      });
  }

  function _fetchProductionRecords() {
    H.setState({ prodRegistryLoading: true, prodFetchAttempted: true });
    window.electronAPI.productionList()
      .then(function (result) {
        if (result.success) {
          H.setState({ prodRegistry: result.data, prodRegistryLoading: false });
        } else {
          H.setState({ prodRegistryLoading: false });
          console.warn("[HomePage] Failed to load production records:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ prodRegistryLoading: false });
        console.error("[HomePage] production:list error:", err.message);
      });
  }

  // ── Analytics data fetchers ─────────────────────────────────────────
  function _fetchAnalyticsBarData() {
    var s = H.getState();
    var dateFrom, dateTo;
    if (s.adminDateMode === "single") {
      dateFrom = s.adminSingleDate;
      dateTo = s.adminSingleDate;
    } else {
      dateFrom = s.adminDateFrom;
      dateTo = s.adminDateTo;
    }
    H.setState({ analyticsBarLoading: true, analyticsFetchedBar: true });
    window.electronAPI.analyticsDailyUsage(dateFrom, dateTo)
      .then(function (result) {
        if (result.success) {
          H.setState({ analyticsBarData: result.data, analyticsBarLoading: false });
        } else {
          H.setState({ analyticsBarData: [], analyticsBarLoading: false });
          console.warn("[HomePage] analytics:daily-usage failed:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ analyticsBarData: [], analyticsBarLoading: false });
        console.error("[HomePage] analytics:daily-usage error:", err.message);
      });
  }

  function _fetchAnalyticsChemNames() {
    H.setState({ analyticsChemNamesLoading: true, analyticsFetchedChemNames: true });
    window.electronAPI.analyticsChemicalNames()
      .then(function (result) {
        if (result.success) {
          H.setState({ analyticsChemNames: result.data, analyticsChemNamesLoading: false });
        } else {
          H.setState({ analyticsChemNames: [], analyticsChemNamesLoading: false });
          console.warn("[HomePage] analytics:chemical-names failed:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ analyticsChemNames: [], analyticsChemNamesLoading: false });
        console.error("[HomePage] analytics:chemical-names error:", err.message);
      });
  }

  function _fetchAnalyticsTrendData() {
    var s = H.getState();
    var chemName = s.analyticsSelectedChem;
    if (!chemName) return;
    var dateFrom, dateTo;
    if (s.analyticsTrendRange === "custom") {
      dateFrom = s.analyticsTrendFrom;
      dateTo = s.analyticsTrendTo;
    } else {
      dateTo = H.todayISO();
      if (s.analyticsTrendRange === "month") {
        dateFrom = H.daysAgoISO(29);
      } else if (s.analyticsTrendRange === "3month") {
        dateFrom = H.daysAgoISO(89);
      } else {
        dateFrom = H.daysAgoISO(6);
      }
    }
    H.setState({ analyticsTrendLoading: true, analyticsFetchedTrend: true });
    window.electronAPI.analyticsChemicalTrend(chemName, dateFrom, dateTo)
      .then(function (result) {
        if (result.success) {
          H.setState({ analyticsTrendData: result.data, analyticsTrendLoading: false });
        } else {
          H.setState({ analyticsTrendData: [], analyticsTrendLoading: false });
          console.warn("[HomePage] analytics:chemical-trend failed:", result.message);
        }
      })
      .catch(function (err) {
        H.setState({ analyticsTrendData: [], analyticsTrendLoading: false });
        console.error("[HomePage] analytics:chemical-trend error:", err.message);
      });
  }

  // ── Chemical file parser ────────────────────────────────────────────
  // Target columns: C (absolute col index 2, 0-based from A) = chemical_id
  //                 G (absolute col index 6, 0-based from A) = chemical_name
  // Data starts at Excel Row 3 (absolute row index 2, 0-based from row 1).
  // Column/row offsets are computed from the sheet's !ref so any sheet
  // layout (starting at B2, A1, etc.) is handled correctly.
  function _parseChemFile(file) {
    if (!file) return;
    var ext = file.name.split(".").pop().toLowerCase();
    if (["xlsx", "xls", "csv"].indexOf(ext) === -1) {
      H.setState({ uploadState: "error", uploadMsg: "Unsupported file type. Please upload .xlsx, .xls, or .csv" });
      return;
    }
    H.setState({ uploadState: "parsing", uploadedRows: [], importResult: null });

    if (ext === "csv") {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var lines = e.target.result.split(/\r?\n/);
          // Convert each line into a raw column array
          var rawRows = lines.map(function (l) {
            return l.split(",").map(function (v) { return v.trim().replace(/^"|"$/g, ""); });
          });
          // CSV has no !ref offset — col A = index 0, row 1 = index 0
          _processChemRows(rawRows, file.name, 0, 0);
        } catch (err) {
          H.setState({ uploadState: "error", uploadMsg: "CSV parse error: " + err.message });
        }
      };
      reader.readAsText(file);
    } else {
      // xlsx / xls — use SheetJS with header:1 to get raw column arrays
      var doRead = function () {
        var XLSX = window.XLSX;
        var reader2 = new FileReader();
        reader2.onload = function (e) {
          try {
            var wb  = XLSX.read(e.target.result, { type: "array" });
            var ws  = wb.Sheets[wb.SheetNames[0]];

            // Determine where the sheet's data actually starts
            var ref       = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : { s: { r: 0, c: 0 } };
            var colOffset = ref.s.c; // e.g. 1 if sheet starts at col B
            var rowOffset = ref.s.r; // e.g. 1 if sheet starts at row 2

            var rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
            _processChemRows(rawRows, file.name, colOffset, rowOffset);
          } catch (err) {
            H.setState({ uploadState: "error", uploadMsg: "XLSX parse error: " + err.message });
          }
        };
        reader2.readAsArrayBuffer(file);
      };
      if (window.XLSX) {
        doRead();
      } else {
        H.setState({ uploadState: "error", uploadMsg: "XLSX library not available. Please restart the app." });
      }
    }
  }

  // Processes raw row arrays produced by SheetJS header:1.
  // colOffset / rowOffset come from the sheet's !ref start position.
  // Absolute targets: col C = index 2, col G = index 6, data from Excel row 3 = abs row index 2.
  function _processChemRows(rawRows, fileName, colOffset, rowOffset) {
    colOffset = colOffset || 0;
    rowOffset = rowOffset || 0;

    // Excel row 3 = absolute row index 2; in the rawRows array that is (2 - rowOffset)
    var dataStart = Math.max(0, 2 - rowOffset);
    var colC = 2 - colOffset; // absolute col C (index 2) adjusted for sheet start
    var colG = 6 - colOffset; // absolute col G (index 6) adjusted for sheet start

    var dataRows = rawRows.slice(dataStart);
    var seen = {};
    var mapped = [];

    dataRows.forEach(function (row) {
      var chemId   = (row[colC] != null ? String(row[colC]) : "").trim();
      var chemName = (row[colG] != null ? String(row[colG]) : "").trim();
      if (!chemId || !chemName) return;    // skip blank rows
      if (seen[chemId]) return;            // deduplicate within file
      seen[chemId] = true;
      mapped.push({ chemical_id: chemId, chemical_name: chemName, unit: "g/L" });
    });

    if (!mapped.length) {
      H.setState({
        uploadState: "error",
        uploadMsg: "No valid rows found. Data must start at Row 3 — Column C = Chemical ID, Column G = Chemical Name.",
      });
      return;
    }
    H.setState({
      uploadState: "preview",
      uploadedRows: mapped,
      uploadMsg: mapped.length + " chemical" + (mapped.length > 1 ? "s" : "") + ' found in "' + fileName + '"',
    });
  }

  // ── Chemical-cell parser (Column P) ──────────────────────────────────
  // Finds all <id>:<number>g/L patterns. Skips water (id=0000).
  function _parseChemicalsFromCell(text) {
    if (!text) return [];
    var results = [];
    var seen = {};
    var regex = /([A-Za-z0-9]+):(\d+(?:\.\d+)?)\s*[Gg]\/[Ll]/g;
    var match;
    while ((match = regex.exec(String(text))) !== null) {
      var chemId  = match[1].trim();
      var density = match[2].trim() + "g/L";
      if (chemId === "0000") continue;
      if (seen[chemId]) continue;
      seen[chemId] = true;
      results.push({ chemical_id: chemId, density: density });
    }
    return results;
  }

  // ── Batch file parser ───────────────────────────────────────────────
  function _parseBatchFile(file) {
    if (!file) return;
    var ext = file.name.split(".").pop().toLowerCase();
    if (["xlsx", "xls", "csv"].indexOf(ext) === -1) {
      H.setState({ batchUploadState: "error", batchUploadMsg: "Unsupported file type. Please upload .xlsx, .xls, or .csv" });
      return;
    }
    H.setState({ batchUploadState: "parsing", batchUploadedRows: [], batchImportResult: null });

    if (ext === "csv") {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var lines = e.target.result.split(/\r?\n/);
          var rawRows = lines.map(function (l) {
            return l.split(",").map(function (v) { return v.trim().replace(/^"|"$/g, ""); });
          });
          _processBatchRows(rawRows, file.name, 0, 0);
        } catch (err) {
          H.setState({ batchUploadState: "error", batchUploadMsg: "CSV parse error: " + err.message });
        }
      };
      reader.readAsText(file);
    } else {
      if (!window.XLSX) {
        H.setState({ batchUploadState: "error", batchUploadMsg: "XLSX library not available. Please restart the app." });
        return;
      }
      var reader2 = new FileReader();
      reader2.onload = function (e) {
        try {
          var XLSX = window.XLSX;
          var wb   = XLSX.read(e.target.result, { type: "array", cellDates: true });
          var ws   = wb.Sheets[wb.SheetNames[0]];
          var ref  = ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : { s: { r: 0, c: 0 } };
          var rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
          _processBatchRows(rawRows, file.name, ref.s.c, ref.s.r);
        } catch (err) {
          H.setState({ batchUploadState: "error", batchUploadMsg: "XLSX parse error: " + err.message });
        }
      };
      reader2.readAsArrayBuffer(file);
    }
  }

  // ── Batch date formatter — outputs dd-mm-yy ────────────────────────
  function _fmtDate(v) {
    var d;
    if (v instanceof Date) {
      d = v;
    } else if (typeof v === "number") {
      // Excel serial date: days since 1899-12-30
      d = new Date(Math.round((v - 25569) * 86400 * 1000));
    } else {
      d = new Date(String(v));
    }
    if (!d || isNaN(d.getTime())) return String(v);
    var dd = String(d.getDate()).padStart(2, "0");
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var yy = String(d.getFullYear()).slice(-2);
    return dd + "-" + mm + "-" + yy;
  }

  // ── Batch row processor ─────────────────────────────────────────────
  // Col A=0 date, B=1 stenter, C=2 batch_id, H=7 weight, I=8 length,
  // K=10 width, L=11 gsm, N=13 temperature, P=15 chemicals
  // Batches start at Excel Row 2 = absolute row index 1.
  function _processBatchRows(rawRows, fileName, colOffset, rowOffset) {
    colOffset = colOffset || 0;
    rowOffset = rowOffset || 0;

    function gc(row, absIdx) {
      var i = absIdx - colOffset;
      if (i < 0 || i >= row.length) return "";
      return row[i] != null ? String(row[i]).trim() : "";
    }

    var dataStart = Math.max(0, 1 - rowOffset); // Excel row 2 = abs index 1
    var dataRows  = rawRows.slice(dataStart);
    var seen = {};
    var mapped = [];

    dataRows.forEach(function (row) {
      var batchId = gc(row, 2); // col C
      if (!batchId || seen[batchId]) return;
      seen[batchId] = true;
      mapped.push({
        batch_id:      batchId,
        schedule_date: _fmtDate(row[0 - colOffset] != null ? row[0 - colOffset] : ""),   // col A
        stenter:       gc(row, 1),   // col B
        weight:        gc(row, 7),   // col H
        length:        gc(row, 8),   // col I
        width:         gc(row, 10),  // col K
        gsm:           gc(row, 11),  // col L
        temperature:   gc(row, 13),  // col N
        chemicals:     _parseChemicalsFromCell(gc(row, 15)), // col P
      });
    });

    if (!mapped.length) {
      H.setState({ batchUploadState: "error", batchUploadMsg: "No valid batch rows found. Data must start at Row 2 \u2014 Column C = Batch ID." });
      return;
    }
    H.setState({
      batchUploadState: "preview",
      batchUploadedRows: mapped,
      batchUploadMsg: mapped.length + " batch" + (mapped.length > 1 ? "es" : "") + ' found in "' + fileName + '"',
    });
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  async function render(container) {
    var user = AuthGuard.getUser();
    if (!user) {
      Logger.warn("HomePage", "No user in session — redirecting to login");
      Router.navigate("login");
      return;
    }

    H.setUser(user);
    H.setContainer(container);
    H.resetState();
    _render();

    // Fetch chemicals from DB so the input dropdown uses real data
    _fetchChemicals();
    // Fetch multipliers from DB for the calculation algorithm
    _fetchMultipliers();

    Logger.info("HomePage", "LiqCalc loaded", { user: user.email });
  }

  return { render: render };
})();
