//! Download e armazenamento local de capas.

use std::path::Path;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(10);

/// Baixa a capa da URL e salva em `dest_path`.
/// Retorna Ok(()) em sucesso, Err em falha.
pub fn download_cover(url: &str, dest_path: &Path) -> crate::Result<()> {
    let client = reqwest::blocking::Client::builder()
        .timeout(TIMEOUT)
        .user_agent("Readito/1.0")
        .build()
        .map_err(|e| crate::Error::Io(e.to_string()))?;

    let resp = client
        .get(url)
        .send()
        .map_err(|e| crate::Error::Io(e.to_string()))?;

    if !resp.status().is_success() {
        return Err(crate::Error::Io(format!("HTTP {}", resp.status())));
    }

    let bytes = resp.bytes().map_err(|e| crate::Error::Io(e.to_string()))?;

    if let Some(parent) = dest_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| crate::Error::Io(e.to_string()))?;
    }

    std::fs::write(dest_path, bytes).map_err(|e| crate::Error::Io(e.to_string()))?;
    Ok(())
}
