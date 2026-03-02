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

    await client.query(`
      CREATE TABLE IF NOT EXISTS chemicals (
        chemical_id   TEXT        PRIMARY KEY,
        chemical_name TEXT        NOT NULL,
        unit          TEXT        NOT NULL DEFAULT 'g/L',
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS batches (
        batch_id      TEXT        PRIMARY KEY,
        schedule_date TEXT,
        stenter       TEXT,
        weight        TEXT,
        width         TEXT,
        length        TEXT,
        gsm           TEXT,
        temperature   TEXT,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS batch_chemicals (
        id          SERIAL PRIMARY KEY,
        batch_id    TEXT NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
        chemical_id TEXT NOT NULL,
        density     TEXT NOT NULL
      )
    `);

    console.log("[DB] Database initialised — users, chemicals & batches tables ready.");
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

// ── Chemical Handlers ───────────────────────────────────────────────────────────

/**
 * chemicals:list — Returns all chemicals ordered by chemical_id.
 */
ipcMain.handle("chemicals:list", async () => {
  try {
    const { rows } = await pool.query(
      "SELECT chemical_id, chemical_name, unit FROM chemicals ORDER BY chemical_id"
    );
    return { success: true, data: rows };
  } catch (err) {
    console.error("[DB] chemicals:list error:", err.message);
    return { success: false, message: "Failed to load chemicals.", code: "UNKNOWN" };
  }
});

/**
 * chemicals:import — Inserts new chemicals, skipping any whose chemical_id
 * already exists.  Returns counts of added rows and the skipped ones.
 *
 * @param {{ rows: Array<{ chemical_id: string, chemical_name: string, unit: string }> }} payload
 */
ipcMain.handle("chemicals:import", async (_event, { rows }) => {
  const added   = [];
  const skipped = [];

  for (const row of rows) {
    try {
      await pool.query(
        `INSERT INTO chemicals (chemical_id, chemical_name, unit)
         VALUES ($1, $2, $3)`,
        [row.chemical_id.trim(), row.chemical_name.trim(), row.unit || "g/L"]
      );
      added.push(row);
    } catch (err) {
      // 23505 = unique_violation (chemical_id already exists)
      if (err.code === "23505") {
        skipped.push(row);
      } else {
        console.error("[DB] chemicals:import row error:", err.message, row);
        skipped.push({ ...row, _error: err.message });
      }
    }
  }

  return { success: true, data: { added, skipped } };
});

/**
 * chemicals:delete — Deletes a single chemical by chemical_id.
 */
ipcMain.handle("chemicals:delete", async (_event, { chemical_id }) => {
  try {
    await pool.query("DELETE FROM chemicals WHERE chemical_id = $1", [chemical_id]);
    return { success: true };
  } catch (err) {
    console.error("[DB] chemicals:delete error:", err.message);
    return { success: false, message: "Failed to delete chemical." };
  }
});

/**
 * chemicals:update — Renames chemical_id and/or chemical_name.
 * Returns DUPLICATE_ID error if the new id already belongs to another row.
 */
ipcMain.handle("chemicals:update", async (_event, { old_id, new_id, new_name }) => {
  try {
    if (new_id.trim() !== old_id.trim()) {
      const { rows } = await pool.query(
        "SELECT 1 FROM chemicals WHERE chemical_id = $1",
        [new_id.trim()]
      );
      if (rows.length > 0) {
        return {
          success: false,
          code: "DUPLICATE_ID",
          message: `Cannot rename: a chemical with ID "${new_id.trim()}" already exists.`,
        };
      }
    }
    await pool.query(
      "UPDATE chemicals SET chemical_id = $1, chemical_name = $2 WHERE chemical_id = $3",
      [new_id.trim(), new_name.trim(), old_id.trim()]
    );
    return { success: true };
  } catch (err) {
    console.error("[DB] chemicals:update error:", err.message);
    return { success: false, message: "Failed to update chemical." };
  }
});

// ── Batch Handlers ─────────────────────────────────────────────────────────────

ipcMain.handle("batches:list", async () => {
  try {
    const { rows } = await pool.query(`
      SELECT b.batch_id, b.schedule_date, b.stenter, b.weight, b.width,
             b.length, b.gsm, b.temperature, b.created_at,
             COALESCE(
               json_agg(
                 json_build_object(
                   'chemical_id', bc.chemical_id,
                   'density', bc.density,
                   'chemical_name', c.chemical_name
                 )
               ) FILTER (WHERE bc.chemical_id IS NOT NULL),
               '[]'::json
             ) AS chemicals
      FROM batches b
      LEFT JOIN batch_chemicals bc ON b.batch_id = bc.batch_id
      LEFT JOIN chemicals c ON bc.chemical_id = c.chemical_id
      GROUP BY b.batch_id, b.schedule_date, b.stenter, b.weight, b.width,
               b.length, b.gsm, b.temperature, b.created_at
      ORDER BY b.schedule_date DESC, b.batch_id
    `);
    return { success: true, data: rows };
  } catch (err) {
    console.error("[DB] batches:list error:", err.message);
    return { success: false, message: "Failed to load batches." };
  }
});

ipcMain.handle("batches:import", async (_event, { rows }) => {
  const added    = [];
  const skipped  = [];
  const warnings = []; // unrecognized chemical_ids

  for (const row of rows) {
    try {
      await pool.query(
        `INSERT INTO batches (batch_id, schedule_date, stenter, weight, width, length, gsm, temperature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [row.batch_id, row.schedule_date, row.stenter, row.weight,
         row.width, row.length, row.gsm, row.temperature]
      );
      for (const chem of (row.chemicals || [])) {
        // Strip leading zeros so "0011" matches stored id "11", "0002" -> "2"
        const normId = /^\d+$/.test(chem.chemical_id)
          ? String(parseInt(chem.chemical_id, 10))
          : chem.chemical_id;
        const { rows: existing } = await pool.query(
          "SELECT 1 FROM chemicals WHERE chemical_id = $1", [normId]
        );
        if (existing.length === 0) {
          warnings.push({ batch_id: row.batch_id, chemical_id: chem.chemical_id });
          continue;
        }
        await pool.query(
          "INSERT INTO batch_chemicals (batch_id, chemical_id, density) VALUES ($1, $2, $3)",
          [row.batch_id, normId, chem.density]
        );
      }
      added.push(row.batch_id);
    } catch (err) {
      if (err.code === "23505") {
        skipped.push(row.batch_id);
      } else {
        console.error("[DB] batches:import row error:", err.message, row.batch_id);
        skipped.push(row.batch_id);
      }
    }
  }
  return { success: true, data: { added, skipped, warnings } };
});

ipcMain.handle("batches:delete", async (_event, { batch_id }) => {
  try {
    await pool.query("DELETE FROM batches WHERE batch_id = $1", [batch_id]);
    return { success: true };
  } catch (err) {
    console.error("[DB] batches:delete error:", err.message);
    return { success: false, message: "Failed to delete batch." };
  }
});

/**
 * batches:get — Fetches a single batch by batch_id, including its chemicals.
 */
ipcMain.handle("batches:get", async (_event, { batch_id }) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.batch_id, b.schedule_date, b.stenter, b.weight, b.width,
             b.length, b.gsm, b.temperature,
             COALESCE(
               json_agg(
                 json_build_object(
                   'chemical_id', bc.chemical_id,
                   'density', bc.density,
                   'chemical_name', c.chemical_name
                 )
               ) FILTER (WHERE bc.chemical_id IS NOT NULL),
               '[]'::json
             ) AS chemicals
      FROM batches b
      LEFT JOIN batch_chemicals bc ON b.batch_id = bc.batch_id
      LEFT JOIN chemicals c ON bc.chemical_id = c.chemical_id
      WHERE b.batch_id = $1
      GROUP BY b.batch_id, b.schedule_date, b.stenter, b.weight, b.width,
               b.length, b.gsm, b.temperature`,
      [batch_id.trim()]
    );
    if (rows.length === 0) {
      return { success: false, message: "Batch not found.", code: "NOT_FOUND" };
    }
    return { success: true, data: rows[0] };
  } catch (err) {
    console.error("[DB] batches:get error:", err.message);
    return { success: false, message: "Failed to fetch batch." };
  }
});

ipcMain.handle("batches:update-full", async (_event, { old_id, batch }) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const newId = (batch.batch_id || "").trim();
    if (!newId) {
      await client.query("ROLLBACK");
      return { success: false, message: "Batch ID is required." };
    }
    if (newId !== old_id.trim()) {
      const { rows } = await client.query(
        "SELECT 1 FROM batches WHERE batch_id = $1", [newId]
      );
      if (rows.length > 0) {
        await client.query("ROLLBACK");
        return { success: false, message: `Batch ID "${newId}" already exists.` };
      }
    }
    await client.query(
      `UPDATE batches SET batch_id=$1, schedule_date=$2, stenter=$3, weight=$4,
       width=$5, length=$6, gsm=$7, temperature=$8 WHERE batch_id=$9`,
      [newId, batch.schedule_date || "", batch.stenter || "", batch.weight || "",
       batch.width || "", batch.length || "", batch.gsm || "", batch.temperature || "",
       old_id.trim()]
    );
    // Replace all chemicals for this batch
    await client.query("DELETE FROM batch_chemicals WHERE batch_id = $1", [newId]);
    for (const chem of (batch.chemicals || [])) {
      await client.query(
        "INSERT INTO batch_chemicals (batch_id, chemical_id, density) VALUES ($1, $2, $3)",
        [newId, chem.chemical_id, chem.density]
      );
    }
    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[DB] batches:update-full error:", err.message);
    return { success: false, message: err.message };
  } finally {
    client.release();
  }
});

module.exports = { initDB, pool };
