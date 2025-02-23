use surrealdb::engine::local::Db;
use surrealdb::Surreal;
use tauri::State;
use thunes_cli::transaction::Tag;

#[tauri::command]
pub async fn get_tags(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
) -> Result<Vec<Tag>, String> {
    let database = database.lock().await;

    thunes_cli::get_tags(&database).await.map_err(|error| {
        tracing::error!(%error, "database error");
        "failed to get tags".to_string()
    })
}

#[tauri::command]
pub async fn add_tags(
    database: State<'_, tokio::sync::Mutex<Surreal<Db>>>,
    tags: Vec<Tag>,
) -> Result<(), String> {
    let database = database.lock().await;

    thunes_cli::add_tags(&database, tags)
        .await
        .map_err(|error| {
            tracing::error!(%error, "database error");
            "failed to add tags".to_string()
        })
}
