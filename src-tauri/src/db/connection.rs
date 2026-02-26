//! Conexão com o SQLite no diretório de dados da aplicação (API Tauri).
//! Não salva banco na raiz do projeto.

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use rusqlite::Connection;

const DB_FILENAME: &str = "leitor.db";

/// Retorna o caminho do arquivo do banco no app data dir.
/// Cria o diretório se não existir.
pub fn app_db_path(app: &AppHandle) -> crate::Result<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| crate::Error::Path(e.to_string()))?;
    std::fs::create_dir_all(&dir).map_err(|e| crate::Error::Io(e.to_string()))?;
    Ok(dir.join(DB_FILENAME))
}

/// Abre uma conexão com o banco e garante que o schema está aplicado.
pub fn open(app: &AppHandle) -> crate::Result<Connection> {
    let path = app_db_path(app)?;
    let conn = Connection::open(&path).map_err(|e| crate::Error::Db(e.to_string()))?;
    crate::db::schema::run_migrations(&conn).map_err(|e| crate::Error::Db(e.to_string()))?;
    Ok(conn)
}
