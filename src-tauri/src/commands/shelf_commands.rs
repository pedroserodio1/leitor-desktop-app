//! Tauri commands para estantes (shelves).

use tauri::AppHandle;

use crate::db;
use crate::repositories;

#[tauri::command]
pub fn list_shelves(app: AppHandle) -> crate::Result<Vec<crate::models::Shelf>> {
    let conn = db::open(&app)?;
    repositories::list_shelves(&conn)
}

#[tauri::command]
pub fn create_shelf(app: AppHandle, id: String, name: String) -> crate::Result<()> {
    let conn = db::open(&app)?;
    repositories::create_shelf(&conn, &id, &name)
}

#[tauri::command]
pub fn add_book_to_shelf(app: AppHandle, book_id: String, shelf_id: String) -> crate::Result<()> {
    let conn = db::open(&app)?;
    repositories::add_book_to_shelf(&conn, &book_id, &shelf_id)
}

#[tauri::command]
pub fn remove_book_from_shelf(
    app: AppHandle,
    book_id: String,
    shelf_id: String,
) -> crate::Result<()> {
    let conn = db::open(&app)?;
    repositories::remove_book_from_shelf(&conn, &book_id, &shelf_id)
}

#[tauri::command]
pub fn get_book_shelf_ids(app: AppHandle, book_id: String) -> crate::Result<Vec<String>> {
    let conn = db::open(&app)?;
    repositories::get_book_shelf_ids(&conn, &book_id)
}

#[tauri::command]
pub fn get_books_in_shelf(app: AppHandle, shelf_id: String) -> crate::Result<Vec<String>> {
    let conn = db::open(&app)?;
    repositories::get_books_in_shelf(&conn, &shelf_id)
}
