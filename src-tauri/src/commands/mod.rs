mod book_commands;
mod custom_theme_commands;
mod metadata_commands;
mod pending_open;
mod progress_commands;
mod settings_commands;
mod shelf_commands;

pub use book_commands::{
    add_book, delete_book, get_books, update_book, AddBookPayload, BookWithVolumes,
    UpdateBookPayload,
};
pub use custom_theme_commands::{
    create_custom_theme, delete_custom_theme, get_custom_theme, list_custom_themes,
    update_custom_theme, CreateCustomThemePayload, UpdateCustomThemePayload,
};
pub use metadata_commands::{
    apply_metadata_candidate, search_metadata, MetadataCandidateDto, SearchMetadataResult,
};
pub use pending_open::{collect_pending_from_args, get_pending_file_to_open, PendingFileOpen};
pub use progress_commands::{get_all_progress, get_progress, get_recent_progress, save_progress};
pub use settings_commands::{
    get_book_settings, get_global_settings, save_book_settings, save_global_settings,
    SaveGlobalSettingsPayload,
};
pub use shelf_commands::{
    add_book_to_shelf, create_shelf, get_book_shelf_ids, get_books_in_shelf, list_shelves,
    remove_book_from_shelf,
};
