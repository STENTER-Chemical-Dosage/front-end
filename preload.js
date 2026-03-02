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

  // ── Chemicals IPC wrappers ───────────────────────────────────────────────

  /**
   * chemicalsList — Returns all chemicals from the database.
   */
  chemicalsList: () =>
    ipcRenderer.invoke("chemicals:list"),

  /**
   * chemicalsImport — Inserts new chemicals, skipping duplicate chemical_ids.
   * @param {Array<{ chemical_id: string, chemical_name: string, unit: string }>} rows
   */
  chemicalsImport: (rows) =>
    ipcRenderer.invoke("chemicals:import", { rows }),

  chemicalsDelete: (chemical_id) =>
    ipcRenderer.invoke("chemicals:delete", { chemical_id }),

  chemicalsUpdate: (old_id, new_id, new_name) =>
    ipcRenderer.invoke("chemicals:update", { old_id, new_id, new_name }),

  // ── Batches IPC wrappers ─────────────────────────────────────────────────
  batchesList: () =>
    ipcRenderer.invoke("batches:list"),

  batchesImport: (rows) =>
    ipcRenderer.invoke("batches:import", { rows }),

  batchesDelete: (batch_id) =>
    ipcRenderer.invoke("batches:delete", { batch_id }),

  batchesGet: (batch_id) =>
    ipcRenderer.invoke("batches:get", { batch_id }),

  batchesUpdateFull: (old_id, batch) =>
    ipcRenderer.invoke("batches:update-full", { old_id, batch }),
});
