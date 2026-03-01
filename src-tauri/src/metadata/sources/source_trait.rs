//! Trait para fontes de metadados.

use crate::metadata::MetadataCandidate;

/// Fonte de metadados (livros ou anime).
/// Cada implementação consulta sua API e retorna candidatos unificados.
pub trait MetadataSource: Send {
    /// Nome da fonte (open_library, loc, anilist, kitsu, jikan).
    fn name(&self) -> &'static str;

    /// Busca por query. Retorna candidatos ou lista vazia em caso de erro/timeout.
    fn search(&self, query: &str) -> Vec<MetadataCandidate>;
}
