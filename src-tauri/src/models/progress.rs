//! Modelo de progresso de leitura (tabela reading_progress). Um registro por volume.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadingProgress {
    pub book_id: String,
    pub volume_id: String,
    pub current_chapter_id: Option<String>,
    pub page_index: i32,
    pub scroll_offset: f64,
    pub updated_at: i64,
}
