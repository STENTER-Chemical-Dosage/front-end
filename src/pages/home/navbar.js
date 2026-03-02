/**
 * src/pages/home/navbar.js — Top Navigation Bar
 *
 * Renders the LiqCalc navigation bar with the logo, avatar button,
 * and dropdown menu (Profile, Admin Dashboard, Sign Out).
 *
 * Depends on: HomeApp (constants.js), HomeApp.icons (icons.js)
 */

(function () {
  var H = window.HomeApp;

  function renderNavbar() {
    var s = H.getState();
    var dd = "";

    if (s.dropdownOpen) {
      dd =
        '<div id="dropdown-menu" style="position:absolute;top:46px;right:0;background:' + H.CARD +
        ";border:1px solid " + H.BORDER + ";border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.08);" +
        'min-width:210px;padding:6px 0;z-index:200">' +
        '<button class="dd-item" data-action="profile" style="display:flex;align-items:center;gap:10px;width:100%;' +
        "padding:10px 16px;border:none;background:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;" +
        'font-size:14px;color:' + H.TEXT + ';text-align:left">' +
        H.icons.person(16, H.MUTED) + " My Profile</button>" +
        '<button class="dd-item" data-action="admin" style="display:flex;align-items:center;gap:10px;width:100%;' +
        "padding:10px 16px;border:none;background:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;" +
        'font-size:14px;color:' + H.TEXT + ';text-align:left">' +
        H.icons.grid(16, H.MUTED) + " Admin Dashboard</button>" +
        '<div style="height:1px;background:' + H.BORDER + ';margin:4px 0"></div>' +
        '<button class="dd-item" data-action="signout" style="display:flex;align-items:center;gap:10px;width:100%;' +
        "padding:10px 16px;border:none;background:none;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;" +
        'font-size:14px;color:' + H.DANGER + ';text-align:left">' +
        H.icons.logout(16, H.DANGER) + " Sign Out</button>" +
        "</div>";
    }

    return (
      '<nav style="display:flex;align-items:center;justify-content:space-between;padding:0 24px;' +
      "height:56px;background:" + H.CARD + ";border-bottom:1px solid " + H.BORDER + ";position:relative;z-index:100" +
      '">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<div style="width:34px;height:34px;background:' + H.ACCENT +
      ';border-radius:8px;display:flex;align-items:center;justify-content:center">' +
      H.icons.flask() +
      "</div>" +
      "<span style=\"font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:18px;color:" +
      H.TEXT + '">LiqCalc</span>' +
      "</div>" +
      '<div style="position:relative">' +
      '<button id="avatar-btn" style="display:flex;align-items:center;gap:6px;background:none;border:1px solid ' +
      H.BORDER + ";border-radius:8px;padding:6px 12px;cursor:pointer;font-family:'IBM Plex Sans',sans-serif;color:" +
      H.TEXT + '">' +
      H.icons.person(18, H.MUTED) +
      H.icons.chevronDown(14, H.MUTED) +
      "</button>" +
      dd +
      "</div>" +
      "</nav>"
    );
  }

  H.renderNavbar = renderNavbar;
})();
