mod db;
mod models;
mod routes;

use std::sync::{Arc, Mutex};

use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::CorsLayer;

#[tokio::main]
async fn main() {
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);

    let db_path = std::env::var("VOICETEX_DB_PATH").unwrap_or_else(|_| "./data/voicetex.db".to_string());

    let conn = db::init(&db_path);
    let state: routes::sessions::DbState = Arc::new(Mutex::new(conn));

    let api = Router::new()
        .route("/api/sessions", get(routes::sessions::list).post(routes::sessions::create))
        .route(
            "/api/sessions/{id}",
            get(routes::sessions::get_one)
                .patch(routes::sessions::update)
                .delete(routes::sessions::delete),
        )
        .route("/api/sessions/{id}/history", get(routes::history::list).post(routes::history::add))
        .route("/api/sessions/{id}/history/undo", post(routes::history::undo))
        .route("/api/sessions/{id}/history/redo", post(routes::history::redo));

    let mut app = api.with_state(state);

    // In production, serve the built frontend
    if std::env::var("NODE_ENV").ok().as_deref() == Some("production") {
        let dist_path = std::env::var("VOICETEX_DIST_PATH").unwrap_or_else(|_| "./dist".to_string());
        let serve_dir = tower_http::services::ServeDir::new(&dist_path)
            .fallback(tower_http::services::ServeFile::new(
                format!("{}/index.html", dist_path),
            ));
        app = app.fallback_service(serve_dir);
    }

    let cors = CorsLayer::permissive();
    let app = app.layer(cors);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await
        .expect("Failed to bind address");

    println!("Backend server running on http://localhost:{}", port);

    axum::serve(listener, app).await.expect("Server failed");
}
