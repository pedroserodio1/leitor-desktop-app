mod archive;
mod commands;
mod db;
mod error;
mod metadata;
mod models;
mod repositories;

use commands::{
    add_book, add_book_to_shelf, apply_metadata_candidate, create_custom_theme,
    create_shelf, delete_book, delete_custom_theme, get_all_progress, get_book_settings,
    get_book_shelf_ids, get_books, get_books_in_shelf, get_custom_theme, get_global_settings,
    get_pending_file_to_open, get_progress, get_recent_progress, list_custom_themes, list_shelves,
    remove_book_from_shelf, save_book_settings, save_global_settings, save_progress,
    search_metadata, update_book, update_custom_theme,
};
use commands::{collect_pending_from_args, PendingFileOpen};
pub use error::{Error, Result};
use std::panic;
use std::sync::{Mutex, OnceLock};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

static CRASH_LOG_DIR: OnceLock<std::path::PathBuf> = OnceLock::new();

fn init_panic_hook() {
    let default_hook = panic::take_hook();
    panic::set_hook(Box::new(move |info| {
        default_hook(info);
        if cfg!(not(debug_assertions)) {
            if let Some(dir) = CRASH_LOG_DIR.get() {
                let timestamp = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .map(|d| d.as_secs())
                    .unwrap_or(0);
                let path = dir.join(format!("crash-{}.log", timestamp));
                if let Ok(mut f) = std::fs::File::create(&path) {
                    let _ = std::io::Write::write_all(
                        &mut f,
                        format!(
                            "Readito panic {}\n\npanic: {:?}\n\nbacktrace:\n{:?}",
                            timestamp,
                            info,
                            std::backtrace::Backtrace::force_capture()
                        )
                        .as_bytes(),
                    );
                }
            }
        }
    }));
}

#[tauri::command]
fn close_splashscreen(app: tauri::AppHandle) {
    if let Some(splash) = app.get_webview_window("splashscreen") {
        let _ = splash.close();
    }
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(PendingFileOpen(Mutex::new(collect_pending_from_args())))
        .invoke_handler(tauri::generate_handler![
            close_splashscreen,
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
            search_metadata,
            apply_metadata_candidate,
            list_custom_themes,
            get_custom_theme,
            create_custom_theme,
            update_custom_theme,
            delete_custom_theme,
        ])
        .setup(|app| {
            if cfg!(not(debug_assertions)) {
                if let Ok(dir) = app.path().app_data_dir() {
                    let _ = std::fs::create_dir_all(&dir);
                    let _ = CRASH_LOG_DIR.set(dir);
                }
                init_panic_hook();
            }
            if cfg!(debug_assertions) {
                use tauri_plugin_log::{Target, TargetKind};
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .target(Target::new(TargetKind::LogDir {
                            file_name: Some("readito".into()),
                        }))
                        .level(log::LevelFilter::Debug)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
