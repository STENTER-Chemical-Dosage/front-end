/**
 * renderer.js — SPA Entry Point (Renderer Process)
 *
 * This is the first script that runs in the renderer process.
 * By the time this file executes, every utility, API, component, and page
 * module has already been loaded (in the order declared in index.html).
 *
 * THIS FILE'S RESPONSIBILITIES:
 *  1. Register all routes with the Router.
 *  2. Start the Router (triggers the initial page render).
 *
 * ─── HOW TO ADD A NEW PAGE ────────────────────────────────────────────────
 * 1. Create src/pages/my-page.js  (exports window.MyPage = { render() {} })
 * 2. Add  <script src="src/pages/my-page.js">  in index.html BEFORE renderer.js
 * 3. Add  Router.register("my-page", MyPage.render, { protected: true })  below
 * 4. Navigate to it:  Router.navigate("my-page")  or  <a href="#my-page">
 *
 * ─── ROUTE OPTIONS ────────────────────────────────────────────────────────
 *  { protected  : true }  → Requires a valid session; redirects to #login otherwise
 *  { publicOnly : true }  → Redirects to #home if the user is already logged in
 *  {}  (default)          → Accessible to everyone regardless of auth state
 */

(function bootstrap() {
  Logger.info("App", "Bootstrapping renderer…");

  // ── Register routes ────────────────────────────────────────────────────────

  // Public-only pages  → redirect to #home when user is already authenticated
  Router.register("login",  LoginPage.render,  { publicOnly: true });
  Router.register("signup", SignupPage.render, { publicOnly: true });
  Router.register("reset",  ResetPage.render,  { publicOnly: true });

  // Protected pages  → redirect to #login when no valid session exists
  Router.register("home", HomePage.render, { protected: true });

  // ── Start the router ───────────────────────────────────────────────────────
  // Resolves the current URL hash and renders the matching page.
  // If the hash is empty (first load) it defaults to #login (see Router.NOT_FOUND).
  Router.start();

  Logger.info("App", "Router started — app is ready");
})();
