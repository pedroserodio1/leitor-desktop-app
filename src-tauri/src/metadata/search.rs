//! Orquestrador: normalização → variações → fontes → scorer → decisão.

use std::sync::mpsc;
use std::thread;

use crate::metadata::decision::{BookMetadataState, MetadataDecision};
use crate::metadata::scorer::ScoreContext;
use crate::metadata::sources::all_sources;
use crate::metadata::{generate_variations, score_candidate_with_context};
use crate::metadata::{MediaType, MetadataCandidate};

/// Candidato ranqueado para exibição ao usuário.
#[derive(Debug, Clone)]
pub struct RankedCandidate {
    pub candidate: MetadataCandidate,
    pub score: f32,
}

/// Resultado da busca de metadados.
#[derive(Debug, Clone)]
pub struct SearchResult {
    /// Lista de candidatos ranqueados (top 5 com score >= threshold).
    pub ranked_candidates: Vec<RankedCandidate>,
    /// Query usada que gerou o melhor resultado.
    pub search_query_used: String,
    /// Melhor decisão (para retrocompatibilidade / aplicar automático quando 1 resultado).
    pub decision: Option<MetadataDecision>,
}

/// Executa busca de metadados para um livro.
/// Consulta fontes em paralelo, ranqueia e retorna a decisão.
/// Usa título, path, autor, nomes e paths dos capítulos para gerar variações.
pub fn search_metadata(
    title: &str,
    path: Option<&str>,
    author: Option<&str>,
    chapter_names: Option<&[String]>,
    chapter_paths: Option<&[String]>,
    flags: &BookMetadataState,
) -> Option<SearchResult> {
    let variations = generate_variations(title, path, author, chapter_names, chapter_paths);
    log::info!("[metadata] Variações de busca: {:?}", variations);

    if variations.is_empty() {
        return None;
    }

    let mut all_candidates: Vec<(MetadataCandidate, String)> = Vec::new();

    for query in &variations {
        log::debug!("[metadata] Consultando query: \"{}\"", query);
        let query_clone = query.clone();
        let sources = all_sources();
        let (tx, rx) = mpsc::channel();

        for source in sources {
            let tx = tx.clone();
            let q = query_clone.clone();
            thread::spawn(move || {
                let results = source.search(&q);
                for c in results {
                    let _ = tx.send((c, q.clone()));
                }
            });
        }
        drop(tx);

        while let Ok((candidate, q)) = rx.recv() {
            log::debug!(
                "[metadata] Candidato: source={}, title=\"{}\"",
                candidate.source,
                candidate.title
            );
            all_candidates.push((candidate, q));
        }
    }

    log::info!("[metadata] Total de candidatos: {}", all_candidates.len());

    if all_candidates.is_empty() {
        return None;
    }

    let score_ctx = ScoreContext::new(title, path);
    let mut scored: Vec<(MetadataCandidate, f32, String)> = Vec::new();
    for (candidate, query) in all_candidates {
        let score = score_candidate_with_context(&candidate, title, author, None, Some(&score_ctx));
        log::debug!(
            "[metadata] Score {:.1}: source={}, media={:?}, title=\"{}\"",
            score,
            candidate.source,
            candidate.media_type,
            candidate.title
        );
        scored.push((candidate, score, query));
    }

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));

    const MIN_SCORE: f32 = 55.0;
    const MAX_CANDIDATES: usize = 5;
    // Exclui anime: só livro, manga e novel
    let ranked_candidates: Vec<RankedCandidate> = scored
        .into_iter()
        .filter(|(c, s, _)| {
            if c.media_type == MediaType::Anime {
                return false;
            }
            *s >= MIN_SCORE
        })
        .take(MAX_CANDIDATES)
        .map(|(candidate, score, _)| RankedCandidate { candidate, score })
        .collect();

    if ranked_candidates.is_empty() {
        return None;
    }

    let search_query_used = variations.first().cloned().unwrap_or_default();
    let best = &ranked_candidates[0];
    let decision = if ranked_candidates.len() == 1
        && best.score >= crate::metadata::decision::SCORE_THRESHOLD
    {
        Some(crate::metadata::decision::apply_metadata_decision(
            best.candidate.clone(),
            best.score,
            flags,
        ))
    } else {
        None
    };

    Some(SearchResult {
        ranked_candidates,
        search_query_used,
        decision,
    })
}
