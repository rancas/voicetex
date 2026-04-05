use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug, Serialize, serde::Deserialize, Clone)]
pub struct Session {
    pub id: String,
    pub name: Option<String>,
    pub current_history_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
    pub settings: String,
}

#[derive(Debug, Serialize, serde::Deserialize, Clone)]
pub struct HistoryEntry {
    pub id: i64,
    pub session_id: String,
    pub latex_content: String,
    pub source: String,
    pub transcript: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub fn ok<T: Serialize>(data: T) -> Json<ApiResponse<T>> {
    Json(ApiResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

pub fn ok_empty() -> Json<ApiResponse<()>> {
    Json(ApiResponse {
        success: true,
        data: None,
        error: None,
    })
}

pub fn created<T: Serialize>(data: T) -> (StatusCode, Json<ApiResponse<T>>) {
    (
        StatusCode::CREATED,
        Json(ApiResponse {
            success: true,
            data: Some(data),
            error: None,
        }),
    )
}

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    BadRequest(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        let body = Json(ApiResponse::<()> {
            success: false,
            data: None,
            error: Some(message),
        });

        (status, body).into_response()
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::Internal(err.to_string())
    }
}
