//! Sistema de busca e enriquecimento de metadados.

mod cache;
mod candidate;
pub mod decision;
mod normalizer;
mod scorer;
mod search;
mod variations;

pub mod cover;
pub mod sources;

pub use cache::CachedResult;
pub use candidate::{MediaType, MetadataCandidate};
pub use decision::apply_metadata_decision;
pub use normalizer::normalize;
pub use scorer::{score_candidate, score_candidate_with_context};
pub use search::{search_metadata, RankedCandidate, SearchResult};
pub use variations::{generate_variations, is_likely_western_book};
