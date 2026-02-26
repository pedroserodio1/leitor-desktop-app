//! Modelo de estante (shelf).

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Shelf {
    pub id: String,
    pub name: String,
}
