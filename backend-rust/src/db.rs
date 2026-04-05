use rusqlite::Connection;
use std::path::Path;

pub fn init(path: &str) -> Connection {
    // Create parent directory
    if let Some(parent) = Path::new(path).parent() {
        std::fs::create_dir_all(parent).expect("Failed to create database directory");
    }

    let conn = Connection::open(path).expect("Failed to open database");

    conn.pragma_update(None, "journal_mode", "WAL")
        .expect("Failed to set journal_mode");
    conn.pragma_update(None, "foreign_keys", "ON")
        .expect("Failed to enable foreign_keys");

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            name TEXT,
            current_history_id INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            settings TEXT DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS history_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            latex_content TEXT NOT NULL DEFAULT '',
            source TEXT NOT NULL CHECK(source IN ('voice','voice_edit','manual_edit','initial')),
            transcript TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_history_session ON history_entries(session_id, id);
        ",
    )
    .expect("Failed to initialize database schema");

    conn
}
