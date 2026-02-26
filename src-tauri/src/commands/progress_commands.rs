//! Tauri commands para progresso de leitura.
//! Frontend deve fazer debounce/throttle para evitar writes excessivos.

use tauri::AppHandle;

use crate::db;
use crate::models::ReadingProgress;
use crate::repositories;

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[tauri::command]
pub fn save_progress(app: AppHandle, progress: ReadingProgress) -> crate::Result<()> {
    let conn = db::open(&app)?;
    let p = ReadingProgress {
        updated_at: now_secs(),
        ..progress
    };
    repositories::upsert_progress(&conn, &p)?;
    Ok(())
}

#[tauri::command]
pub fn get_progress(
    app: AppHandle,
    book_id: String,
    volume_id: String,
) -> crate::Result<Option<ReadingProgress>> {
    let conn = db::open(&app)?;
    repositories::get_progress(&conn, &book_id, &volume_id)
}
