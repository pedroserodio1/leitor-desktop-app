//! Cache de buscas por query normalizada.
//! TTL configurável (7-30 dias).

use serde::{Deserialize, Serialize};

/// TTL padrão do cache em segundos (7 dias).
pub const DEFAULT_CACHE_TTL_SECS: i64 = 7 * 24 * 3600;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedResult {
    pub source: String,
    pub results_json: String,
    pub cached_at: i64,
}

impl CachedResult {
    pub fn is_expired(&self, ttl_secs: i64) -> bool {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        now - self.cached_at > ttl_secs
    }
}
