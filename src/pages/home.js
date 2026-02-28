/**
 * src/pages/home.js — Home / Dashboard Page
 *
 * This is the main page shown after a successful login or signup.
 * It is a protected route — the Router redirects unauthenticated users
 * to #login before this page is rendered.
 *
 * ─── PAGE FLOW ────────────────────────────────────────────────────────────
 * 1. render()         reads the current user from AuthGuard.getUser().
 * 2. _template(user)  builds the dashboard HTML, greeting the user by name.
 * 3. _attachEvents()  wires the logout button.
 *
 * ─── HOW TO EXTEND ────────────────────────────────────────────────────────
 * - Add new dashboard cards by appending <div class="info-card">…</div>
 *   blocks inside .cards-grid in _template().
 * - Fetch and display real data by calling a domain API in render() before
 *   injecting the template, then pass it as arguments to _template().
 * - Add navigation to sub-pages via <a href="#my-page"> links in the navbar.
 */

window.HomePage = (() => {
  // ── Template ───────────────────────────────────────────────────────────────

  /**
   * Builds the dashboard HTML.
   * @param {{ id: string, name: string, email: string }} user
   * @param {string} appVersion  — Electron app version from the main process
   * @returns {string}
   */
  function _template(user, appVersion) {
    const firstName = (user.name || "User").split(" ")[0];
    const greeting  = _timeGreeting();

    return `
      <div class="page">

        <!-- ── Navigation bar ──────────────────────────────────────── -->
        <nav class="navbar">
          <a class="navbar__brand" href="#home">
            <div class="navbar__brand-icon">S</div>
            Stenter Dosage
          </a>

          <div class="navbar__actions">
            <span class="navbar__user">
              Signed in as <strong>${_escape(user.name)}</strong>
            </span>
            ${ButtonComponent.render({
              id     : "logout-btn",
              label  : "Sign Out",
              variant: "ghost",
            })}
          </div>
        </nav>

        <!-- ── Main content ────────────────────────────────────────── -->
        <main class="main-content">

          <!-- Welcome hero -->
          <div class="welcome-hero">
            <h1>${greeting}, ${_escape(firstName)}! 👋</h1>
            <p>Welcome to the Stenter Chemical Dosage dashboard.</p>
          </div>

          <!-- Quick-info cards -->
          <div class="cards-grid">

            <div class="info-card">
              <div class="info-card__label">Logged in as</div>
              <div class="info-card__value" style="font-size:var(--font-size-base);word-break:break-word">
                ${_escape(user.email)}
              </div>
            </div>

            <div class="info-card">
              <div class="info-card__label">Session status</div>
              <div class="info-card__value" style="color:var(--color-success)">Active ✓</div>
            </div>

            <div class="info-card">
              <div class="info-card__label">App version</div>
              <div class="info-card__value" style="font-size:var(--font-size-lg)">
                v${_escape(appVersion || "—")}
              </div>
            </div>

            <!--
              HOW TO ADD A NEW CARD:
              Copy one of the info-card blocks above and update the
              info-card__label and info-card__value content.
              For dynamic data, fetch it before calling _template() and
              pass it in as a parameter.
            -->

          </div>

          <!-- Getting-started hint -->
          <div style="margin-top:var(--space-10);
                      padding: var(--space-6);
                      background:var(--color-primary-light);
                      border-radius:var(--radius-lg);
                      border-left:4px solid var(--color-primary)">
            <p style="font-size:var(--font-size-sm);color:var(--color-primary-dark);font-weight:var(--font-weight-medium)">
              🚀  Getting started
            </p>
            <p style="font-size:var(--font-size-sm);color:var(--color-text-muted);margin-top:var(--space-1)">
              Expand this dashboard by adding new routes in <code>renderer.js</code>,
              new pages in <code>src/pages/</code>, and new API calls in <code>src/api/</code>.
              See the top-of-file comments in each file for instructions.
            </p>
          </div>

        </main>
      </div>`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns a time-appropriate greeting (Good morning / afternoon / evening).
   * @returns {string}
   */
  function _timeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }

  /** Minimal HTML escaping for injected user data */
  function _escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Event handling ─────────────────────────────────────────────────────────

  function _attachEvents() {
    document.getElementById("logout-btn")?.addEventListener("click", _handleLogout);
  }

  /**
   * Clears the session and redirects to the login page.
   */
  function _handleLogout() {
    Logger.info("HomePage", "User initiated logout");
    AuthGuard.clearSession();
    Router.navigate("login");
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * render — Entry point called by the Router for the protected #home route.
   * @param {HTMLElement} container — The #app div
   */
  async function render(container) {
    const user = AuthGuard.getUser();

    // Safety net: the Router's protected guard should catch this first,
    // but we defend here too in case render() is called directly.
    if (!user) {
      Logger.warn("HomePage", "No user in session — redirecting to login");
      Router.navigate("login");
      return;
    }

    // Fetch the app version from the main process via the preload bridge
    let appVersion = "1.0.0";
    try {
      appVersion = await window.electronAPI.getAppVersion();
    } catch {
      Logger.warn("HomePage", "Could not fetch app version from main process");
    }

    container.innerHTML = _template(user, appVersion);
    _attachEvents();
    Logger.info("HomePage", "Home page rendered", { user: user.email });
  }

  return { render };
})();
