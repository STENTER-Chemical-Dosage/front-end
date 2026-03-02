/**
 * src/pages/home/constants.js — Design Tokens, Colors & Chemical Data
 *
 * Initialises the shared HomeApp namespace and defines all constants
 * used across the LiqCalc pages: color palette, chemical list, and mock data.
 *
 * Must be loaded FIRST among all home/* scripts.
 */

window.HomeApp = (() => {
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

  // ── Date Helpers ───────────────────────────────────────────────────────────
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysAgoISO(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  function escape(str) {
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

  // ── Shared State Container ─────────────────────────────────────────────────
  // Mutable state used across all home sub-modules.
  // The orchestrator (home/index.js) manages this via setState().
  let _container = null;
  let _user = null;
  let _state = {};
  let _renderFn = null; // set by the orchestrator

  function defaultState() {
    return {
      showAdmin: false,
      page: 1,
      activeTab: "simple",
      dropdownOpen: false,
      batchNumber: "",
      scheduleDate: "",
      wetDry: "Wet",
      stenter: "Stenter 1",
      gsm: "",
      width: "",
      length: "",
      clothWeight: "",
      chemicals: [],
      selectedChemical: "",
      chemicalDensity: "",
      fetchingBatch: false,
      errors: {},
      adminDateMode: "single",
      adminSingleDate: todayISO(),
      adminDateFrom: daysAgoISO(6),
      adminDateTo: todayISO(),
      // ── Admin – Chemical Management tab ──────────────────────────────────
      adminTab: "analytics",
      chemRegistry: [],            // loaded from DB on tab open
      chemRegistryLoading: false,
      chemFetchAttempted: false,     // prevents infinite re-fetch when registry is empty
      uploadState: "idle",         // "idle" | "parsing" | "preview" | "importing" | "done" | "error"
      uploadMsg: "",
      uploadedRows: [],
      importResult: null,          // { added: [], skipped: [] } after a successful import
      chemSearch: "",
      editingChem: null,            // { chemical_id, chemical_name } when the edit modal is open
      chemSortCol: "chemical_id",  // active sort column key
      chemSortDir: "asc",          // "asc" | "desc"
      // ── Admin – Batch Management tab ─────────────────────────────────────
      batchRegistry: [],
      batchRegistryLoading: false,
      batchFetchAttempted: false,
      batchUploadState: "idle",
      batchUploadMsg: "",
      batchUploadedRows: [],
      batchImportResult: null,
      batchSearch: "",
      batchSortCol: "schedule_date",
      batchSortDir: "desc",
      expandedBatchId: null,
      editingBatch: null,
      // ── GSM Multiplier Registry ───────────────────────────────────────────────
      multiplierRegistry: [],       // loaded from DB on app start + admin tab open
      multiplierRegistryLoading: false,
      multiplierFetchAttempted: false,
      // ── Admin – Production Records tab ──────────────────────────────────
      prodRegistry: [],
      prodRegistryLoading: false,
      prodFetchAttempted: false,
      prodSearch: "",
      prodSortCol: "submitted_at",
      prodSortDir: "desc",
      expandedProdId: null,
      prodSelectedIds: [],           // array of selected record IDs for XLSX export
      // ── Admin – Analytics tab ────────────────────────────────────────────
      analyticsBarData: [],            // [{ chemical_name, total_dosage }] for bar chart
      analyticsBarLoading: false,
      analyticsFetchedBar: false,
      analyticsTrendData: [],          // [{ date, total_dosage }] for line chart
      analyticsTrendLoading: false,
      analyticsFetchedTrend: false,
      analyticsChemNames: [],          // distinct chemical names from production records
      analyticsChemNamesLoading: false,
      analyticsFetchedChemNames: false,
      analyticsSelectedChem: "",       // currently selected chemical for trend chart
      analyticsTrendRange: "week",     // "week" | "month" | "3month" | "custom"
      analyticsTrendFrom: daysAgoISO(6),
      analyticsTrendTo: todayISO(),
    };
  }

  function setState(updates) {
    Object.assign(_state, updates);
    if (_renderFn) _renderFn();
  }

  function getState() {
    return _state;
  }

  function setRenderFn(fn) {
    _renderFn = fn;
  }

  function getContainer() {
    return _container;
  }

  function setContainer(c) {
    _container = c;
  }

  function getUser() {
    return _user;
  }

  function setUser(u) {
    _user = u;
  }

  function resetState() {
    // Preserve fetched registries (app-level data that shouldn't be cleared)
    const preserved = {
      chemRegistry: _state.chemRegistry || [],
      chemFetchAttempted: _state.chemFetchAttempted || false,
      batchRegistry: _state.batchRegistry || [],
      batchFetchAttempted: _state.batchFetchAttempted || false,
      prodRegistry: _state.prodRegistry || [],
      prodFetchAttempted: _state.prodFetchAttempted || false,
      analyticsChemNames: _state.analyticsChemNames || [],
      analyticsFetchedChemNames: _state.analyticsFetchedChemNames || false,
      multiplierRegistry: _state.multiplierRegistry || [],
      multiplierFetchAttempted: _state.multiplierFetchAttempted || false,
    };
    _state = defaultState();
    Object.assign(_state, preserved);
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    // Design tokens
    ACCENT: ACCENT,
    ACCENT_LIGHT: ACCENT_LIGHT,
    ACCENT_HOVER: ACCENT_HOVER,
    BG: BG,
    CARD: CARD,
    BORDER: BORDER,
    TEXT: TEXT,
    MUTED: MUTED,
    DANGER: DANGER,
    SUCCESS: SUCCESS,
    CHEM_COLORS: CHEM_COLORS,
    CHEMICAL_LIST: CHEMICAL_LIST,
    MOCK_DATA: MOCK_DATA,

    // Helpers
    todayISO: todayISO,
    daysAgoISO: daysAgoISO,
    escape: escape,

    // State management
    defaultState: defaultState,
    setState: setState,
    getState: getState,
    resetState: resetState,
    setRenderFn: setRenderFn,
    getContainer: getContainer,
    setContainer: setContainer,
    getUser: getUser,
    setUser: setUser,
  };
})();
