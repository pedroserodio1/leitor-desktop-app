//! Cálculo de score para ranqueamento de candidatos.
//! Pesos: similaridade textual 40%, autor 25%, ano 15%, idioma 10%, capa 5%, descrição 5%.
//! Ajustes: boost manga quando conteúdo japonês; penaliza anime quando título parece ocidental.

use crate::metadata::{normalizer, MediaType, MetadataCandidate};

const TITLE_WEIGHT: f32 = 0.40;
const AUTHOR_WEIGHT: f32 = 0.25;
const YEAR_WEIGHT: f32 = 0.15;
const LANGUAGE_WEIGHT: f32 = 0.10;
const COVER_WEIGHT: f32 = 0.05;
const DESCRIPTION_WEIGHT: f32 = 0.05;

/// Parâmetros contextuais para o scorer.
#[derive(Clone)]
pub struct ScoreContext {
    pub search_title: String,
    pub search_path: Option<String>,
    pub is_japanese: bool,
}

impl ScoreContext {
    pub fn new(search_title: &str, path: Option<&str>) -> Self {
        let search_title = search_title.to_string();
        let search_path = path.map(String::from);
        let is_japanese = normalizer::contains_japanese(search_title.as_str())
            || search_path
                .as_ref()
                .map(|p| normalizer::contains_japanese(p))
                .unwrap_or(false);
        Self {
            search_title,
            search_path,
            is_japanese,
        }
    }
}

/// Score de 0 a 100.
pub fn score_candidate(
    candidate: &MetadataCandidate,
    search_title: &str,
    search_author: Option<&str>,
    _preferred_language: Option<&str>,
) -> f32 {
    score_candidate_with_context(
        candidate,
        search_title,
        search_author,
        _preferred_language,
        None,
    )
}

/// Score com contexto de path para detecção de japonês.
pub fn score_candidate_with_context(
    candidate: &MetadataCandidate,
    search_title: &str,
    search_author: Option<&str>,
    _preferred_language: Option<&str>,
    ctx: Option<&ScoreContext>,
) -> f32 {
    let norm_search = normalizer::normalize(search_title);
    let is_japanese = ctx
        .map(|c| c.is_japanese)
        .unwrap_or_else(|| normalizer::contains_japanese(search_title));

    let title_score = title_similarity(candidate, &norm_search);
    let author_score = author_score(candidate, search_author);
    let year_score = 50.0;
    let language_score = 50.0;
    let cover_score = if candidate.cover_url.is_some() {
        100.0
    } else {
        0.0
    };
    let desc_score = if candidate.description.is_some() {
        100.0
    } else {
        0.0
    };

    let base = (title_score * TITLE_WEIGHT
        + author_score * AUTHOR_WEIGHT
        + year_score * YEAR_WEIGHT
        + language_score * LANGUAGE_WEIGHT
        + cover_score * COVER_WEIGHT
        + desc_score * DESCRIPTION_WEIGHT)
        .min(100.0);

    let media_adjustment = media_type_adjustment(candidate.media_type, is_japanese, &norm_search);
    (base + media_adjustment).clamp(0.0, 100.0)
}

/// Ajuste de score por tipo de mídia e idioma detectado.
/// - Japonês: boost manga (+15), anime neutro.
/// - Ocidental: penaliza anime (-25) para títulos que parecem livros (evitar "Game of Thrones" como anime).
fn media_type_adjustment(media_type: MediaType, is_japanese: bool, norm_search: &str) -> f32 {
    match media_type {
        MediaType::Book => 0.0,
        MediaType::Manga => {
            if is_japanese {
                15.0 // Priorizar manga quando conteúdo japonês
            } else {
                0.0
            }
        }
        MediaType::Anime => {
            if is_japanese {
                0.0
            } else if looks_western_book(norm_search) {
                -40.0 // Penalizar anime para títulos que parecem livros ocidentais
            } else {
                0.0
            }
        }
    }
}

/// Indica se o título parece ser de livro ocidental (ex: "game of thrones", "lord of the rings").
fn looks_western_book(norm: &str) -> bool {
    let words: Vec<&str> = norm.split_whitespace().collect();
    if words.len() < 2 {
        return false;
    }
    let book_indicators = [
        "of",
        "and",
        "the",
        "song",
        "fire",
        "ice",
        "king",
        "queen",
        "lord",
        "rings",
        "chronicles",
        "saga",
        "tale",
        "tales",
        "storm",
        "sword",
        "dragon",
        "dungeon",
    ];
    let has_book_like = words.iter().any(|w| {
        let low = w.to_lowercase();
        book_indicators.contains(&low.as_str())
    });
    let no_numbers = !norm.chars().any(|c| c.is_ascii_digit());
    has_book_like && no_numbers
}

fn title_similarity(candidate: &MetadataCandidate, norm_search: &str) -> f32 {
    if norm_search.is_empty() {
        return 0.0;
    }
    let search_words: std::collections::HashSet<_> = norm_search
        .split_whitespace()
        .map(|s| s.to_lowercase())
        .collect();
    let mut best = 0.0f32;
    for alt in candidate
        .title_alternatives
        .iter()
        .chain([&candidate.title])
    {
        let norm_alt = normalizer::normalize(alt);
        let alt_words: std::collections::HashSet<_> = norm_alt
            .split_whitespace()
            .map(|s| s.to_lowercase())
            .collect();
        if alt_words.is_empty() {
            continue;
        }
        let intersection = search_words.intersection(&alt_words).count();
        let union = search_words.union(&alt_words).count();
        let jaccard = if union > 0 {
            (intersection as f32) / (union as f32)
        } else {
            0.0
        };
        if norm_alt.contains(norm_search) || norm_search.contains(norm_alt.as_str()) {
            best = best.max(90.0);
        }
        best = best.max(jaccard * 100.0);
    }
    best
}

fn author_score(candidate: &MetadataCandidate, search_author: Option<&str>) -> f32 {
    match (candidate.author.as_ref(), search_author) {
        (Some(ca), Some(sa)) => {
            let ca_norm = normalizer::normalize(ca);
            let sa_norm = normalizer::normalize(sa);
            if ca_norm.contains(&sa_norm) || sa_norm.contains(&ca_norm) {
                100.0
            } else {
                let cw: std::collections::HashSet<_> = ca_norm
                    .split_whitespace()
                    .map(|s| s.to_lowercase())
                    .collect();
                let sw: std::collections::HashSet<_> = sa_norm
                    .split_whitespace()
                    .map(|s| s.to_lowercase())
                    .collect();
                let inter = cw.intersection(&sw).count();
                if inter > 0 {
                    (inter as f32 / sw.len().max(1) as f32) * 80.0
                } else {
                    0.0
                }
            }
        }
        (Some(_), None) => 50.0,
        (None, Some(_)) => 0.0,
        (None, None) => 50.0,
    }
}
