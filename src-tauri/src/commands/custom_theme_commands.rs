//! Tauri commands para temas personalizados.

use serde::Deserialize;
use tauri::AppHandle;
use uuid::Uuid;

use crate::db;
use crate::models::CustomTheme;
use crate::repositories;

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[tauri::command]
pub fn list_custom_themes(app: AppHandle) -> crate::Result<Vec<CustomTheme>> {
    let conn = db::open(&app)?;
    repositories::list_custom_themes(&conn)
}

#[tauri::command]
pub fn get_custom_theme(app: AppHandle, id: String) -> crate::Result<Option<CustomTheme>> {
    let conn = db::open(&app)?;
    repositories::get_custom_theme(&conn, &id)
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomThemePayload {
    pub name: String,
    pub css: String,
}

#[tauri::command]
pub fn create_custom_theme(
    app: AppHandle,
    payload: CreateCustomThemePayload,
) -> crate::Result<CustomTheme> {
    let conn = db::open(&app)?;
    let id = Uuid::new_v4().to_string();
    let now = now_secs();
    let theme = CustomTheme {
        id: id.clone(),
        name: payload.name,
        css: payload.css,
        updated_at: now,
    };
    repositories::insert_custom_theme(&conn, &theme)?;
    Ok(theme)
}

#[derive(Debug, Deserialize)]
pub struct UpdateCustomThemePayload {
    pub id: String,
    pub name: Option<String>,
    pub css: Option<String>,
}

#[tauri::command]
pub fn update_custom_theme(
    app: AppHandle,
    payload: UpdateCustomThemePayload,
) -> crate::Result<CustomTheme> {
    let conn = db::open(&app)?;
    let existing = repositories::get_custom_theme(&conn, &payload.id)?
        .ok_or_else(|| crate::Error::NotFound("Theme not found".into()))?;
    let now = now_secs();
    let theme = CustomTheme {
        id: payload.id,
        name: payload.name.unwrap_or(existing.name),
        css: payload.css.unwrap_or(existing.css),
        updated_at: now,
    };
    repositories::update_custom_theme(&conn, &theme)?;
    Ok(theme)
}

#[tauri::command]
pub fn delete_custom_theme(app: AppHandle, id: String) -> crate::Result<()> {
    let conn = db::open(&app)?;
    repositories::delete_custom_theme(&conn, &id)
}
