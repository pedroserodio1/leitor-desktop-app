mod archive;
mod commands;
mod db;
mod error;
mod models;
mod repositories;

pub use error::{Error, Result};
use commands::{
  add_book, delete_book, get_book_settings, get_books, get_global_settings, get_progress,
  save_book_settings, save_global_settings, save_progress,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      archive::extract_archive,
      archive::delete_temp_dir,
      add_book,
      get_books,
      delete_book,
      save_progress,
      get_progress,
      save_book_settings,
      get_book_settings,
      get_global_settings,
      save_global_settings,
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

