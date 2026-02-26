//! Comando para abrir arquivo passado pela associação do sistema (duplo clique).

use std::path::Path;
use std::sync::Mutex;
use tauri::State;

const SUPPORTED_EXT: &[&str] = &["epub", "pdf", "cbz", "cbr", "zip", "rar", "jpg", "jpeg", "png", "webp"];

fn is_supported_path(path: &str) -> bool {
    let p = Path::new(path);
    if !p.exists() || !p.is_file() {
        return false;
    }
    p.extension()
        .and_then(|e| e.to_str())
        .map(|ext| SUPPORTED_EXT.iter().any(|e| e.eq_ignore_ascii_case(ext)))
        .unwrap_or(false)
}

/// Lê argumentos da linha de comando e retorna o primeiro path de arquivo suportado.
/// Usado quando o app é iniciado via "Abrir com" (file association).
pub fn collect_pending_from_args() -> Option<String> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    for arg in args {
        let trimmed = arg.trim().trim_matches('"');
        if !trimmed.is_empty() && is_supported_path(trimmed) {
            return Some(trimmed.to_string());
        }
    }
    None
}

pub struct PendingFileOpen(pub Mutex<Option<String>>);

#[tauri::command]
pub fn get_pending_file_to_open(state: State<PendingFileOpen>) -> Option<String> {
    let mut guard = state.0.lock().unwrap();
    guard.take()
}
