import { Router } from "express";
import db from "../db.js";

interface SessionRow {
  id: string;
  current_history_id: number | null;
}

interface HistoryRow {
  id: number;
  session_id: string;
  latex_content: string;
  source: string;
  transcript: string | null;
  created_at: string;
}

const router = Router({ mergeParams: true });

function getSessionId(req: { params: Record<string, string> }): string {
  return req.params.id;
}

// Get all history entries for a session
router.get("/", (req, res) => {
  const entries = db
    .prepare("SELECT * FROM history_entries WHERE session_id = ? ORDER BY id ASC")
    .all(getSessionId(req));
  res.json({ success: true, data: entries });
});

// Add a new history entry
router.post("/", (req, res) => {
  const { latex_content, source, transcript } = req.body;
  const sessionId = getSessionId(req);

  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as SessionRow | undefined;

  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  const transaction = db.transaction(() => {
    // If current_history_id is not the last entry, truncate entries after it
    if (session.current_history_id != null) {
      db.prepare(
        "DELETE FROM history_entries WHERE session_id = ? AND id > ?"
      ).run(sessionId, session.current_history_id);
    }

    // Insert new entry
    const result = db
      .prepare(
        "INSERT INTO history_entries (session_id, latex_content, source, transcript) VALUES (?, ?, ?, ?)"
      )
      .run(sessionId, latex_content ?? "", source, transcript ?? null);

    // Update session cursor and timestamp
    db.prepare(
      "UPDATE sessions SET current_history_id = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(result.lastInsertRowid, sessionId);

    return result.lastInsertRowid;
  });

  const entryId = transaction();
  const entry = db.prepare("SELECT * FROM history_entries WHERE id = ?").get(entryId);
  res.status(201).json({ success: true, data: entry });
});

// Undo
router.post("/undo", (req, res) => {
  const sessionId = getSessionId(req);
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as SessionRow | undefined;

  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  // Find the entry before current
  const prevEntry = db
    .prepare(
      "SELECT * FROM history_entries WHERE session_id = ? AND id < ? ORDER BY id DESC LIMIT 1"
    )
    .get(sessionId, session.current_history_id);

  if (!prevEntry) {
    res.status(400).json({ success: false, error: "Nothing to undo" });
    return;
  }

  db.prepare("UPDATE sessions SET current_history_id = ?, updated_at = datetime('now') WHERE id = ?").run(
    (prevEntry as HistoryRow).id,
    sessionId
  );

  res.json({ success: true, data: prevEntry });
});

// Redo
router.post("/redo", (req, res) => {
  const sessionId = getSessionId(req);
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as SessionRow | undefined;

  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  // Find the entry after current
  const nextEntry = db
    .prepare(
      "SELECT * FROM history_entries WHERE session_id = ? AND id > ? ORDER BY id ASC LIMIT 1"
    )
    .get(sessionId, session.current_history_id);

  if (!nextEntry) {
    res.status(400).json({ success: false, error: "Nothing to redo" });
    return;
  }

  db.prepare("UPDATE sessions SET current_history_id = ?, updated_at = datetime('now') WHERE id = ?").run(
    (nextEntry as HistoryRow).id,
    sessionId
  );

  res.json({ success: true, data: nextEntry });
});

export default router;
