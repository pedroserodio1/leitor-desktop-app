//! Modelos de livro, volume e capítulo (espelham tabelas books, volumes, chapters).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub path: String,
    #[serde(rename = "type")]
    pub book_type: String, // "folder" | "file"
    pub added_at: i64,
    pub hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Volume {
    pub id: String,
    pub book_id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub volume_id: String,
    pub name: String,
    pub path: String,
    pub position: i32,
}
