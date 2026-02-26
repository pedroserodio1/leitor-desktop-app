mod archive;
mod commands;
mod db;
mod error;
mod models;
mod repositories;

pub use error::{Error, Result};
use commands::{
  add_book, add_book_to_shelf, create_shelf, delete_book, get_all_progress, get_book_shelf_ids,
  get_books, get_books_in_shelf, get_book_settings, get_global_settings, get_pending_file_to_open,
  get_progress, get_recent_progress, list_shelves, remove_book_from_shelf, save_book_settings,
  save_global_settings, save_progress, update_book,
};
use commands::{collect_pending_from_args, PendingFileOpen};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .manage(PendingFileOpen(Mutex::new(collect_pending_from_args())))
    .invoke_handler(tauri::generate_handler![
      archive::extract_archive,
      archive::delete_temp_dir,
      add_book,
      get_pending_file_to_open,
      get_books,
      delete_book,
      update_book,
      save_progress,
      get_progress,
      get_all_progress,
      get_recent_progress,
      save_book_settings,
      get_book_settings,
      get_global_settings,
      save_global_settings,
      list_shelves,
      create_shelf,
      add_book_to_shelf,
      remove_book_from_shelf,
      get_book_shelf_ids,
      get_books_in_shelf,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

