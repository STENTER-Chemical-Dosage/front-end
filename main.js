/**
 * main.js — Electron Main Process
 *
 * This is the entry point for the Electron app. It creates the BrowserWindow,
 * configures security settings, and sets up IPC listeners.
 *
 * HOW TO ADD NEW WINDOWS:
 *  - Call createWindow() with custom options, or create a separate
 *    createSecondaryWindow() function following the same pattern below.
 *
 * HOW TO ADD NEW IPC HANDLERS:
 *  - Use ipcMain.handle('channel-name', async (event, ...args) => { ... })
 *    and expose it via preload.js contextBridge.
 */

const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// ─── Window Creation ───────────────────────────────────────────────────────────

/**
 * createWindow — Creates and configures the main BrowserWindow.
 *
 * Security settings used:
 *  - contextIsolation: true  → renderer and preload run in separate contexts
 *  - nodeIntegration: false  → renderer cannot access Node.js APIs directly
 *  - preload script          → selectively expose safe APIs via contextBridge
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    title: "Stenter Chemical Dosage",
    // Center the window on launch
    center: true,
    // Show only after content is ready to avoid white flash
    show: false,
    webPreferences: {
      // Path to the preload script that bridges main ↔ renderer
      preload: path.join(__dirname, "preload.js"),
      // Isolate renderer context from Node.js and preload
      contextIsolation: true,
      // Disable direct Node.js access in renderer for security
      nodeIntegration: false,
    },
  });

  // Load the SPA shell (index.html)
  win.loadFile("index.html");

  // Show the window once the DOM is fully loaded (avoids white flash)
  win.once("ready-to-show", () => {
    win.show();
  });

  // Open DevTools in development. Remove or gate behind an env variable
  // before shipping to production:
  //   if (process.env.NODE_ENV === "development") win.webContents.openDevTools();
  // win.webContents.openDevTools();
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window when dock icon is clicked and no windows are open
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ─── IPC Handlers ──────────────────────────────────────────────────────────────
// Add main-process IPC handlers here.
// These are invoked from the renderer via window.electronAPI.xxx()
//
// Example:
//   ipcMain.handle("get-app-version", () => app.getVersion());
//
// Then in preload.js, expose it:
//   getAppVersion: () => ipcRenderer.invoke("get-app-version")

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});