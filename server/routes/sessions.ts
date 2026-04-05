import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";

const router = Router();

// List sessions (with optional date filter)
router.get("/", (req, res) => {
  const { from, to } = req.query;
  let sql = "SELECT * FROM sessions";
  const params: string[] = [];

  if (from || to) {
    const conditions: string[] = [];
    if (typeof from === "string") {
      conditions.push("created_at >= ?");
      params.push(from);
    }
    if (typeof to === "string") {
      conditions.push("created_at <= ?");
      params.push(to + "T23:59:59");
    }
    sql += " WHERE " + conditions.join(" AND ");
  }

  sql += " ORDER BY updated_at DESC";

  const sessions = db.prepare(sql).all(...params);
  res.json({ success: true, data: sessions });
});

// Get session by ID
router.get("/:id", (req, res) => {
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }
  res.json({ success: true, data: session });
});

// Create session
router.post("/", (_req, res) => {
  const id = uuidv4();
  const now = new Date();
  const name = `Session ${now.toISOString().slice(0, 16).replace("T", " ")}`;

  const insertSession = db.prepare(
    "INSERT INTO sessions (id, name) VALUES (?, ?)"
  );
  const insertEntry = db.prepare(
    "INSERT INTO history_entries (session_id, latex_content, source) VALUES (?, '', 'initial')"
  );
  const updateCursor = db.prepare(
    "UPDATE sessions SET current_history_id = ? WHERE id = ?"
  );

  const transaction = db.transaction(() => {
    insertSession.run(id, name);
    const result = insertEntry.run(id);
    updateCursor.run(result.lastInsertRowid, id);
  });

  transaction();

  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(id);
  res.status(201).json({ success: true, data: session });
});

// Update session (name or settings)
router.patch("/:id", (req, res) => {
  const { name, settings } = req.body;
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(req.params.id);
  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  if (name !== undefined) {
    db.prepare("UPDATE sessions SET name = ?, updated_at = datetime('now') WHERE id = ?").run(
      name,
      req.params.id
    );
  }
  if (settings !== undefined) {
    db.prepare("UPDATE sessions SET settings = ?, updated_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(settings),
      req.params.id
    );
  }

  const updated = db.prepare("SELECT * FROM sessions WHERE id = ?").get(req.params.id);
  res.json({ success: true, data: updated });
});

// Delete session
router.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM sessions WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
