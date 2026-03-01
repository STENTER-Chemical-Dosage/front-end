/**
 * src/db/database.js — PostgreSQL Database + IPC Auth Handlers
 *
 * Connects to the Supabase PostgreSQL database directly using the `pg` pool.
 * Registers ipcMain handlers for all auth operations so the renderer can
 * call them safely via the preload contextBridge.
 *
 * IPC Channels exposed:
 *  - auth:login          → { email, password }
 *  - auth:signup         → { name, email, password }
 *  - auth:password-reset → { email }
 *
 * Call initDB() once in main.js after app is ready to create the users
 * table if it doesn't already exist.
 */

const { ipcMain } = require("electron");
const { Pool }    = require("pg");
const bcrypt      = require("bcryptjs");

// ── Database Connection ────────────────────────────────────────────────────────

/**
 * pg connection pool — using individual params instead of a URL string
 * so special characters in the password (e.g. semicolon) are handled safely.
 */
const pool = new Pool({
  user    : "postgres",
  password: "stenterchemical;dosage",
  host    : "db.svetohbyasqzinlzvvky.supabase.co",
  port    : 5432,
  database: "postgres",
  ssl     : { rejectUnauthorized: false }, // required for Supabase hosted Postgres
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

// ── Initialisation ─────────────────────────────────────────────────────────────

/**
 * initDB — Creates the users table if it doesn't already exist.
 * Must be awaited before the first auth query hits the database.
 */
async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
        name         TEXT        NOT NULL,
        email        TEXT        UNIQUE NOT NULL,
        password_hash TEXT       NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("[DB] Database initialised — users table is ready.");
  } catch (err) {
    console.error("[DB] Failed to initialise database:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ── IPC Handlers ───────────────────────────────────────────────────────────────

/**
 * auth:login — Verifies email/password against the database.
 * Returns a session-like object with a token and user info on success.
 */
ipcMain.handle("auth:login", async (_event, { email, password }) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: "Invalid email or password. Please try again.",
        code   : "INVALID_CREDENTIALS",
      };
    }

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return {
        success: false,
        message: "Invalid email or password. Please try again.",
        code   : "INVALID_CREDENTIALS",
      };
    }

    return {
      success: true,
      data: {
        // For a real production app replace with a proper JWT
        token: "db-session-" + user.id,
        user : { id: user.id, name: user.name, email: user.email },
      },
    };
  } catch (err) {
    console.error("[DB] auth:login error:", err.message);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      code   : "UNKNOWN",
    };
  }
});

/**
 * auth:signup — Creates a new user after hashing the password.
 * Returns INVALID if the email is already taken.
 */
ipcMain.handle("auth:signup", async (_event, { name, email, password }) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );

    const user = rows[0];
    return {
      success: true,
      data: {
        token: "db-session-" + user.id,
        user : { id: user.id, name: user.name, email: user.email },
      },
    };
  } catch (err) {
    console.error("[DB] auth:signup error:", err.message);

    // PostgreSQL unique-violation error code
    if (err.code === "23505") {
      return {
        success: false,
        message: "An account with this email already exists. Try logging in.",
        code   : "EMAIL_TAKEN",
      };
    }

    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      code   : "UNKNOWN",
    };
  }
});

/**
 * auth:password-reset — Prototype stub: acknowledges the request.
 * To send a real reset email, integrate an email provider (e.g. SendGrid,
 * Resend) here and generate a time-limited reset token stored in the DB.
 */
ipcMain.handle("auth:password-reset", async (_event, { email }) => {
  try {
    // Check whether the user exists (result intentionally not exposed to caller)
    const { rows } = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      console.warn("[DB] Password reset requested for unknown email — generic response sent.");
    }

    // Always return generic success to avoid confirming account existence
    return {
      success: true,
      message: "If an account with that email exists, a reset link has been sent.",
    };
  } catch (err) {
    console.error("[DB] auth:password-reset error:", err.message);
    return {
      success: false,
      message: "An unexpected error occurred. Please try again.",
      code   : "UNKNOWN",
    };
  }
});

module.exports = { initDB, pool };
