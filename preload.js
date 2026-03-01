/**
 * preload.js — Electron Preload Script
 *
 * Runs in a privileged context BEFORE the renderer page loads. It bridges
 * the secure main process and the sandboxed renderer using contextBridge.
 *
 * SECURITY MODEL:
 *  - Only explicitly listed functions are available to the renderer.
 *  - The full `ipcRenderer` object is NOT exposed — only safe wrappers.
 *
 * HOW TO EXPOSE A NEW IPC CALL TO THE RENDERER:
 *  1. Add an ipcMain.handle('your-channel', handler) in main.js.
 *  2. Add a wrapper below: yourFunc: () => ipcRenderer.invoke('your-channel')
 *  3. Call it in the renderer as: window.electronAPI.yourFunc()
 */

const { contextBridge, ipcRenderer } = require("electron");

// Expose a controlled set of Electron APIs under window.electronAPI
contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * getAppVersion — Returns the current Electron app version string.
   * Usage: const ver = await window.electronAPI.getAppVersion();
   */
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),

  // ── Auth IPC wrappers ────────────────────────────────────────────────────
  // These call the database handlers in src/db/database.js via the main process.

  /**
   * authLogin — Authenticates a user against the PostgreSQL database.
   * @param {string} email
   * @param {string} password
   */
  authLogin: (email, password) =>
    ipcRenderer.invoke("auth:login", { email, password }),

  /**
   * authSignup — Registers a new user in the PostgreSQL database.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   */
  authSignup: (name, email, password) =>
    ipcRenderer.invoke("auth:signup", { name, email, password }),

  /**
   * authPasswordReset — Requests a password reset for the given email.
   * @param {string} email
   */
  authPasswordReset: (email) =>
    ipcRenderer.invoke("auth:password-reset", { email }),
});
