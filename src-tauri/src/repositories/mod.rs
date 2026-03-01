mod book_repository;
mod custom_theme_repository;
mod metadata_repository;
mod progress_repository;
mod settings_repository;
mod shelf_repository;

pub use book_repository::{
    delete_book, insert_book, insert_chapter, insert_volume, list_books, list_chapters,
    list_volumes, update_book, update_book_partial,
};
pub use custom_theme_repository::{
    delete_custom_theme, get_custom_theme, insert_custom_theme, list_custom_themes,
    update_custom_theme,
};
pub use metadata_repository::{get_metadata_flags, insert_search_result, set_metadata_flags};
pub use progress_repository::{
    get_progress, list_all_progress, list_recent_progress, upsert_progress,
};
pub use settings_repository::{
    get_book_settings, get_global_settings, save_global_settings, upsert_book_settings,
};
pub use shelf_repository::{
    add_book_to_shelf, create_shelf, get_book_shelf_ids, get_books_in_shelf, list_shelves,
    remove_book_from_shelf,
};
