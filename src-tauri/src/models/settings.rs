//! Modelos de configurações (book_settings, global_settings).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BookSettings {
    pub book_id: String,
    pub layout_mode: String,       // "single" | "double" | "scroll"
    pub reading_direction: String, // "ltr" | "rtl"
    pub zoom: f64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalSettings {
    pub id: i64,
    pub theme: Option<String>,
    pub custom_theme_id: Option<String>,
    pub default_layout_mode: Option<String>,
    pub default_reading_direction: Option<String>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomTheme {
    pub id: String,
    pub name: String,
    pub css: String,
    pub updated_at: i64,
}
