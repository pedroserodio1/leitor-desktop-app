//! Tauri commands para configurações por livro e globais.

use serde::Deserialize;
use tauri::AppHandle;

use crate::db;
use crate::models::{BookSettings, GlobalSettings};
use crate::repositories;

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[tauri::command]
pub fn save_book_settings(app: AppHandle, settings: BookSettings) -> crate::Result<()> {
    let conn = db::open(&app)?;
    let s = BookSettings {
        updated_at: now_secs(),
        ..settings
    };
    repositories::upsert_book_settings(&conn, &s)?;
    Ok(())
}

#[tauri::command]
pub fn get_book_settings(app: AppHandle, book_id: String) -> crate::Result<Option<BookSettings>> {
    let conn = db::open(&app)?;
    repositories::get_book_settings(&conn, &book_id)
}

#[tauri::command]
pub fn get_global_settings(app: AppHandle) -> crate::Result<GlobalSettings> {
    let conn = db::open(&app)?;
    repositories::get_global_settings(&conn)
}

#[derive(Debug, Deserialize)]
pub struct SaveGlobalSettingsPayload {
    pub theme: Option<String>,
    pub default_layout_mode: Option<String>,
    pub default_reading_direction: Option<String>,
}

#[tauri::command]
pub fn save_global_settings(app: AppHandle, payload: SaveGlobalSettingsPayload) -> crate::Result<()> {
    let conn = db::open(&app)?;
    let s = GlobalSettings {
        id: 1,
        theme: payload.theme,
        default_layout_mode: payload.default_layout_mode,
        default_reading_direction: payload.default_reading_direction,
        updated_at: now_secs(),
    };
    repositories::save_global_settings(&conn, &s)?;
    Ok(())
}
