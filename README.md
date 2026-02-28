# Stenter Chemical Dosage — Frontend

Electron-based desktop application for the Stenter Chemical Dosage system.
Includes a Login, Signup, Password Reset, and Home dashboard — all in a lightweight
single-page architecture with mock API support ready for real backend integration.

---

## Prerequisites

| Tool | Minimum version |
|------|----------------|
| [Node.js](https://nodejs.org) | 18.x |
| npm | 9.x (bundled with Node) |
| Git | any recent version |

---

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/STENTER-Chemical-Dosage/front-end.git
cd front-end
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the app

```bash
npm start
```

The Electron window will open automatically.

---

## Available scripts

| Command | Description |
|---------|-------------|
| `npm start` | Launch the Electron app |
| `npm run dev` | Launch with Node.js inspector attached (for debugging the main process) |

---

## Demo credentials

A pre-seeded mock account is available out of the box:

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `Password1` |

You can also register a new account via the **Sign Up** page — it is stored in memory for the current session.

---

## Project structure

```
front-end/
├── main.js              # Electron main process
├── preload.js           # contextBridge — secure Node ↔ renderer bridge
├── renderer.js          # SPA bootstrap — route registration
├── index.html           # App shell (single HTML file)
└── src/
    ├── styles/          # theme.css (tokens) + global.css (base styles)
    ├── utils/           # logger, helpers, auth-guard, router
    ├── api/             # auth.js — login / signup / password-reset (mock)
    ├── components/      # form-group, button (reusable HTML generators)
    └── pages/           # login, signup, reset, home
```

See the top-of-file comments in each source file for instructions on how to
add new pages, API calls, components, and IPC handlers.

---

## Switching to a real backend

1. Open `src/api/auth.js`.
2. Set `USE_MOCK = false`.
3. Set `BASE_URL` to your API root (e.g. `https://api.yourdomain.com/v1`).
4. Fill in the `_real*` stub functions using the commented-out `fetch` examples already there.

---

## License

ISC