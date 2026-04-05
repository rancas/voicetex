use std::sync::{Arc, Mutex};

use axum::{
    extract::{Path, Query, State},
    Json,
};
use rusqlite::Connection;
use serde::Deserialize;

use crate::models::{ok, ok_empty, created, AppError, Session};

pub type DbState = Arc<Mutex<Connection>>;

#[derive(Debug, Deserialize)]
pub struct ListParams {
    pub from: Option<String>,
    pub to: Option<String>,
}

pub async fn list(
    State(db): State<DbState>,
    Query(params): Query<ListParams>,
) -> Result<Json<crate::models::ApiResponse<Vec<Session>>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        let mut sql = String::from("SELECT * FROM sessions");
        let mut bind_params: Vec<String> = Vec::new();

        if params.from.is_some() || params.to.is_some() {
            let mut conditions: Vec<String> = Vec::new();
            if let Some(ref from) = params.from {
                conditions.push("created_at >= ?".to_string());
                bind_params.push(from.clone());
            }
            if let Some(ref to) = params.to {
                conditions.push("created_at <= ?".to_string());
                bind_params.push(format!("{}T23:59:59", to));
            }
            sql.push_str(" WHERE ");
            sql.push_str(&conditions.join(" AND "));
        }

        sql.push_str(" ORDER BY updated_at DESC");

        let mut stmt = conn.prepare(&sql)?;
        let rows = stmt.query_map(rusqlite::params_from_iter(&bind_params), |row| {
            Ok(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                current_history_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                settings: row.get(5)?,
            })
        })?;

        let sessions: Vec<Session> = rows.collect::<Result<_, _>>()?;
        Ok(ok(sessions))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

pub async fn get_one(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<Json<crate::models::ApiResponse<Session>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let mut stmt = conn.prepare("SELECT * FROM sessions WHERE id = ?")?;
        let session = stmt
            .query_row(rusqlite::params![id], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    current_history_id: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                    settings: row.get(5)?,
                })
            })
            .map_err(|e| match e {
                rusqlite::Error::QueryReturnedNoRows => {
                    AppError::NotFound("Session not found".to_string())
                }
                other => AppError::Internal(other.to_string()),
            })?;
        Ok(ok(session))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

pub async fn create(
    State(db): State<DbState>,
) -> Result<
    (
        axum::http::StatusCode,
        Json<crate::models::ApiResponse<Session>>,
    ),
    AppError,
> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let id = uuid::Uuid::new_v4().to_string();
        let name = format!(
            "Session {}",
            chrono::Utc::now().format("%Y-%m-%d %H:%M")
        );

        conn.execute(
            "INSERT INTO sessions (id, name) VALUES (?1, ?2)",
            rusqlite::params![id, name],
        )?;
        conn.execute(
            "INSERT INTO history_entries (session_id, latex_content, source) VALUES (?1, '', 'initial')",
            rusqlite::params![id],
        )?;
        let last_id = conn.last_insert_rowid();
        conn.execute(
            "UPDATE sessions SET current_history_id = ?1 WHERE id = ?2",
            rusqlite::params![last_id, id],
        )?;

        let mut stmt = conn.prepare("SELECT * FROM sessions WHERE id = ?")?;
        let session = stmt.query_row(rusqlite::params![id], |row| {
            Ok(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                current_history_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                settings: row.get(5)?,
            })
        })?;

        Ok(created(session))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

#[derive(Debug, Deserialize)]
pub struct UpdateBody {
    pub name: Option<String>,
    pub settings: Option<serde_json::Value>,
}

pub async fn update(
    State(db): State<DbState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateBody>,
) -> Result<Json<crate::models::ApiResponse<Session>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

        // Check session exists
        let exists: bool = conn
            .prepare("SELECT COUNT(*) FROM sessions WHERE id = ?")?
            .query_row(rusqlite::params![id], |row| row.get::<_, i64>(0))
            .map(|c| c > 0)?;

        if !exists {
            return Err(AppError::NotFound("Session not found".to_string()));
        }

        if let Some(ref name) = body.name {
            conn.execute(
                "UPDATE sessions SET name = ?1, updated_at = datetime('now') WHERE id = ?2",
                rusqlite::params![name, id],
            )?;
        }
        if let Some(ref settings) = body.settings {
            let settings_str = serde_json::to_string(settings)
                .map_err(|e| AppError::Internal(e.to_string()))?;
            conn.execute(
                "UPDATE sessions SET settings = ?1, updated_at = datetime('now') WHERE id = ?2",
                rusqlite::params![settings_str, id],
            )?;
        }

        let mut stmt = conn.prepare("SELECT * FROM sessions WHERE id = ?")?;
        let session = stmt.query_row(rusqlite::params![id], |row| {
            Ok(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                current_history_id: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                settings: row.get(5)?,
            })
        })?;

        Ok(ok(session))
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}

pub async fn delete(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<Json<crate::models::ApiResponse<()>>, AppError> {
    let db = db.clone();
    tokio::task::spawn_blocking(move || {
        let conn = db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
        let changes = conn.execute(
            "DELETE FROM sessions WHERE id = ?",
            rusqlite::params![id],
        )?;
        if changes == 0 {
            return Err(AppError::NotFound("Session not found".to_string()));
        }
        Ok(ok_empty())
    })
    .await
    .map_err(|e| AppError::Internal(e.to_string()))?
}
