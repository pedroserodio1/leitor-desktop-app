//! Erro unificado para commands Tauri. Serializável para retorno ao frontend.

use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(tag = "kind", content = "message")]
pub enum Error {
    #[serde(rename = "path")]
    Path(String),
    #[serde(rename = "io")]
    Io(String),
    #[serde(rename = "db")]
    Db(String),
    #[serde(rename = "not_found")]
    NotFound(String),
    #[serde(rename = "validation")]
    Validation(String),
}

impl From<rusqlite::Error> for Error {
    fn from(e: rusqlite::Error) -> Self {
        Error::Db(e.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
