use axum::{
    extract::{Path, State},
    Json,
};
use serde::Deserialize;

use crate::models::{ok, created, AppError, HistoryEntry};
use crate::routes::sessions::DbState;

pub async fn list(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<Json<crate::models::ApiResponse<Vec<HistoryEntry>>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let mut stmt = conn.prepare(
            "SELECT * FROM history_entries WHERE session_id = ? ORDER BY id ASC",
        )?;
        let rows = stmt.query_map(rusqlite::params![id], |row| {
            Ok(HistoryEntry {
                id: row.get(0)?,
                session_id: row.get(1)?,
                latex_content: row.get(2)?,
                source: row.get(3)?,
                transcript: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;
        let entries: Vec<HistoryEntry> = rows.collect::<Result<_, _>>()?;
        Ok(ok(entries))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

#[derive(Debug, Deserialize)]
pub struct AddBody {
    pub latex_content: Option<String>,
    pub source: String,
    pub transcript: Option<String>,
}

pub async fn add(
    State(db): State<DbState>,
    Path(id): Path<String>,
    Json(body): Json<AddBody>,
) -> Result<
    (
        axum::http::StatusCode,
        Json<crate::models::ApiResponse<HistoryEntry>>,
    ),
    AppError,
> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Get session
        let current_history_id: Option<i64> = conn
            .prepare("SELECT current_history_id FROM sessions WHERE id = ?")?
            .query_row(rusqlite::params![id], |row| row.get(0))
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::NotFound("Session not found".to_string())
                }
                other => AppError::Internal(other.to_string()),
            })?;

        // Truncate entries after current
        if let Some(cursor) = current_history_id {
            conn.execute(
                "DELETE FROM history_entries WHERE session_id = ? AND id > ?",
                rusqlite::params![id, cursor],
            )?;
        }

        let latex_content = body.latex_content.unwrap_or_default();

        // Insert new entry
        conn.execute(
            "INSERT INTO history_entries (session_id, latex_content, source, transcript) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![id, latex_content, body.source, body.transcript],
        )?;
        let entry_id = conn.last_insert_rowid();

        // Update session cursor
        conn.execute(
            "UPDATE sessions SET current_history_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![entry_id, id],
        )?;

        // Fetch the new entry
        let mut stmt = conn.prepare("SELECT * FROM history_entries WHERE id = ?")?;
        let entry = stmt.query_row(rusqlite::params![entry_id], |row| {
            Ok(HistoryEntry {
                id: row.get(0)?,
                session_id: row.get(1)?,
                latex_content: row.get(2)?,
                source: row.get(3)?,
                transcript: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;

        Ok(created(entry))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

pub async fn undo(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<Json<crate::models::ApiResponse<HistoryEntry>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Get session
        let current_history_id: Option<i64> = conn
            .prepare("SELECT current_history_id FROM sessions WHERE id = ?")?
            .query_row(rusqlite::params![id], |row| row.get(0))
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::NotFound("Session not found".to_string())
                }
                other => AppError::Internal(other.to_string()),
            })?;

        let cursor = current_history_id.ok_or_else(|| {
            AppError::BadRequest("Nothing to undo".to_string())
        })?;

        // Find previous entry
        let prev_entry = conn
            .prepare(
                "SELECT * FROM history_entries WHERE session_id = ? AND id < ? ORDER BY id DESC LIMIT 1",
            )?
            .query_row(rusqlite::params![id, cursor], |row| {
                Ok(HistoryEntry {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    latex_content: row.get(2)?,
                    source: row.get(3)?,
                    transcript: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::BadRequest("Nothing to undo".to_string())
                }
                other => AppError::Internal(other.to_string()),
            })?;

        // Update cursor
        conn.execute(
            "UPDATE sessions SET current_history_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![prev_entry.id, id],
        )?;

        Ok(ok(prev_entry))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

pub async fn redo(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<Json<crate::models::ApiResponse<HistoryEntry>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Get session
        let current_history_id: Option<i64> = conn
            .prepare("SELECT current_history_id FROM sessions WHERE id = ?")?
            .query_row(rusqlite::params![id], |row| row.get(0))
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::NotFound("Session not found".to_string())
                }
                other => AppError::Internal(other.to_string()),
            })?;

        let cursor = current_history_id.ok_or_else(|| {
            AppError::BadRequest("Nothing to redo".to_string())
        })?;

        // Find next entry
        let next_entry = conn
            .prepare(
                "SELECT * FROM history_entries WHERE session_id = ? AND id > ? ORDER BY id ASC LIMIT 1",
            )?
            .query_row(rusqlite::params![id, cursor], |row| {
                Ok(HistoryEntry {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    latex_content: row.get(2)?,
                    source: row.get(3)?,
                    transcript: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::BadRequest("Nothing to redo".to_string())
                }
                other => AppError::Internal(other.to_string()),
            })?;

        // Update cursor
        conn.execute(
            "UPDATE sessions SET current_history_id = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![next_entry.id, id],
        )?;

        Ok(ok(next_entry))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}
