//! Modelo de decisão: aplicar ou não metadados com base em threshold e flags de edição.

use crate::metadata::MetadataCandidate;

/// Threshold mínimo (60-70). Abaixo disso, não aplicar automaticamente.
pub const SCORE_THRESHOLD: f32 = 65.0;

/// Decisão para um candidato.
#[derive(Debug, Clone)]
pub struct MetadataDecision {
    pub apply: bool,
    pub confirmed: bool,
    pub score: f32,
    pub candidate: MetadataCandidate,
}

/// Dados locais do livro para decisão.
#[derive(Debug, Clone)]
pub struct BookMetadataState {
    pub author_manually_edited: bool,
    pub description_manually_edited: bool,
    pub cover_manually_edited: bool,
    pub title_manually_edited: bool,
}

/// Decide se deve aplicar o melhor candidato.
pub fn apply_metadata_decision(
    candidate: MetadataCandidate,
    score: f32,
    flags: &BookMetadataState,
) -> MetadataDecision {
    let confirmed = score >= SCORE_THRESHOLD;
    let apply = confirmed;
    MetadataDecision {
        apply,
        confirmed,
        score,
        candidate,
    }
}
