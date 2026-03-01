//! Adaptadores para fontes de metadados (livros e anime).

mod anilist;
mod jikan;
mod kitsu;
mod loc;
mod open_library;
mod source_trait;

pub use anilist::AniListSource;
pub use jikan::JikanSource;
pub use kitsu::KitsuSource;
pub use loc::LocSource;
pub use open_library::OpenLibrarySource;
pub use source_trait::MetadataSource;

use crate::metadata::MetadataCandidate;

/// Todas as fontes disponíveis para busca em paralelo.
/// Apenas livros (Open Library, LOC) e manga (AniList, Jikan). Anime excluído.
pub fn all_sources() -> Vec<Box<dyn MetadataSource + Send>> {
    vec![
        Box::new(OpenLibrarySource),
        Box::new(LocSource),
        Box::new(AniListSource),
        Box::new(JikanSource),
    ]
}
