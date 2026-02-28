/**
 * src/utils/router.js — Hash-Based SPA Router
 *
 * Listens to URL hash changes (e.g. #login → #home) and swaps the content of
 * the #app element by calling the matching page's render() function.
 *
 * ROUTE REGISTRATION:
 *  Router.register("route-name", PageModule.render, { protected: bool })
 *
 * NAVIGATION:
 *  Router.navigate("home");   // programmatic navigation
 *  <a href="#home">           // declarative link navigation (zero JS needed)
 *
 * PROTECTED ROUTES:
 *  Mark a route with { protected: true } and the router will redirect to #login
 *  if AuthGuard.isLoggedIn() returns false.
 *
 * PUBLIC ROUTES (redirect if already authenticated):
 *  Mark a route with { publicOnly: true } and the router will redirect to #home
 *  if the user is already logged in (e.g. to prevent logged-in users seeing the
 *  login form again).
 *
 * HOW TO ADD A NEW PAGE:
 *  1. Create src/pages/my-page.js exporting window.MyPage = { render() { ... } }
 *  2. Add a <script src="src/pages/my-page.js"> in index.html (before renderer.js)
 *  3. Call Router.register("my-page", MyPage.render) in renderer.js
 *  4. Navigate via Router.navigate("my-page") or <a href="#my-page">
 */

window.Router = (() => {
  // ── Internal state ─────────────────────────────────────────────────────────

  /**
   * Map of route name → { render: Function, options: Object }
   * @type {Map<string, { render: Function, options: Object }>}
   */
  const routes    = new Map();

  /** The name of the fallback route shown when no match is found */
  const NOT_FOUND = "login";

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Returns the current route name from the URL hash.
   * e.g. "#login" → "login",  "" → ""
   * @returns {string}
   */
  function _currentRoute() {
    return (window.location.hash || "").replace(/^#\/?/, "").toLowerCase();
  }

  /**
   * Injects HTML into the #app container and logs the navigation.
   * @param {string}   routeName
   * @param {Function} renderFn   — Page render function that returns void (mutates #app)
   */
  function _renderPage(routeName, renderFn) {
    const app = document.getElementById("app");
    if (!app) {
      Logger.error("Router", "#app container not found in the DOM");
      return;
    }

    // Tear down previous page markup
    app.innerHTML = "";

    Logger.info("Router", `Rendering page: #${routeName}`);

    try {
      renderFn(app);
    } catch (err) {
      Logger.error("Router", `Error rendering page "${routeName}"`, err);
      app.innerHTML = `
        <div style="padding:2rem;text-align:center;color:#dc2626">
          <h2>Page Error</h2>
          <p>Something went wrong loading this page. Check the console for details.</p>
          <a href="#login">Go to Login</a>
        </div>`;
    }
  }

  /**
   * Resolves the current hash route, applies guards, and renders the page.
   */
  function _resolve() {
    const name  = _currentRoute() || NOT_FOUND;
    const route = routes.get(name);

    if (!route) {
      Logger.warn("Router", `Unknown route "#${name}" — redirecting to #${NOT_FOUND}`);
      navigate(NOT_FOUND);
      return;
    }

    const { render, options } = route;

    // Protected route guard: redirect to login if not authenticated
    if (options.protected && !AuthGuard.isLoggedIn()) {
      Logger.warn("Router", `Route "#${name}" requires auth — redirecting to #login`);
      navigate("login");
      return;
    }

    // Public-only route guard: redirect to home if already authenticated
    if (options.publicOnly && AuthGuard.isLoggedIn()) {
      Logger.info("Router", `Already logged in — redirecting from "#${name}" to #home`);
      navigate("home");
      return;
    }

    _renderPage(name, render);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Registers a route with the router.
   *
   * @param {string}   name      Route identifier (matches the URL hash without #)
   * @param {Function} renderFn  Page render function — receives the #app element
   * @param {Object}   [options]
   * @param {boolean}  [options.protected=false]  Requires authentication
   * @param {boolean}  [options.publicOnly=false] Redirects to home if authenticated
   */
  function register(name, renderFn, options = {}) {
    routes.set(name.toLowerCase(), {
      render : renderFn,
      options: { protected: false, publicOnly: false, ...options },
    });
    Logger.debug("Router", `Route registered: #${name}`);
  }

  /**
   * Navigates programmatically to a named route.
   * If the route is the same as the current one, it forces a re-render.
   * @param {string} name Route identifier
   */
  function navigate(name) {
    const target = name.toLowerCase();
    if (_currentRoute() === target) {
      // Same route — force a re-render
      _resolve();
    } else {
      window.location.hash = `#${target}`;
    }
  }

  /**
   * Starts the router. Call once after all routes have been registered.
   */
  function start() {
    // Listen for hash changes (back/forward, link clicks, etc.)
    window.addEventListener("hashchange", _resolve);
    // Resolve the initial route on first load
    _resolve();
    Logger.info("Router", "Router started");
  }

  return { register, navigate, start };
})();
