//! Tauri commands para busca de metadados.

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

use crate::commands::book_commands::{BookWithVolumes, VolumeWithChaptersOut};
use crate::db;
use crate::metadata;
use crate::metadata::decision::BookMetadataState;
use crate::metadata::MetadataCandidate;
use crate::repositories;

#[derive(Debug, Serialize, Deserialize)]
pub struct MetadataCandidateDto {
    pub source: String,
    #[serde(alias = "sourceId")]
    pub source_id: String,
    #[serde(alias = "mediaType")]
    pub media_type: String,
    pub title: String,
    #[serde(default, alias = "titleAlternatives")]
    pub title_alternatives: Vec<String>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default, alias = "coverUrl")]
    pub cover_url: Option<String>,
    #[serde(default)]
    pub year: Option<i32>,
    #[serde(default)]
    pub language: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct RankedCandidateDto {
    pub candidate: MetadataCandidateDto,
    pub score: f32,
}

#[derive(Debug, Serialize)]
pub struct SearchMetadataResult {
    pub applied: bool,
    pub confirmed: bool,
    pub score: f32,
    pub source: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub has_description: bool,
    pub has_cover: bool,
    /// Lista de candidatos ranqueados para o usuário escolher (quando múltiplos resultados).
    pub candidates: Vec<RankedCandidateDto>,
}

/// Sanitiza book_id para uso como nome de arquivo (evita paths inválidos no Windows).
fn sanitize_book_id_for_filename(book_id: &str) -> String {
    book_id
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect::<String>()
}

fn candidate_to_dto(c: &MetadataCandidate) -> MetadataCandidateDto {
    MetadataCandidateDto {
        source: c.source.clone(),
        source_id: c.source_id.clone(),
        media_type: format!("{:?}", c.media_type).to_lowercase(),
        title: c.title.clone(),
        title_alternatives: c.title_alternatives.clone(),
        author: c.author.clone(),
        description: c.description.clone(),
        cover_url: c.cover_url.clone(),
        year: c.year,
        language: c.language.clone(),
    }
}

#[tauri::command]
pub async fn search_metadata(
    app: AppHandle,
    book_id: String,
) -> crate::Result<SearchMetadataResult> {
    log::info!("[metadata] Iniciando busca para book_id={}", book_id);

    tauri::async_runtime::spawn_blocking(move || {
        let conn = db::open(&app)?;

        let book = repositories::list_books(&conn)?
        .into_iter()
        .find(|b| b.id == book_id)
        .ok_or_else(|| crate::Error::NotFound("Book not found".to_string()))?;

        let volumes = repositories::list_volumes(&conn, &book_id)?;
        let mut chapter_names: Vec<String> = Vec::new();
        let mut chapter_paths: Vec<String> = Vec::new();
        for vol in &volumes {
            let chapters = repositories::list_chapters(&conn, &vol.id)?;
            for ch in chapters {
                chapter_names.push(ch.name.clone());
                chapter_paths.push(ch.path.clone());
            }
        }

        log::info!(
            "[metadata] Livro: title=\"{}\", path=\"{}\", author={:?}, {} capítulos",
            book.title,
            book.path,
            book.author,
            chapter_names.len()
        );

        let (author_me, desc_me, cover_me, _title_me) = repositories::get_metadata_flags(&conn, &book_id)?;
        let flags = BookMetadataState {
            author_manually_edited: author_me,
            description_manually_edited: desc_me,
            cover_manually_edited: cover_me,
            title_manually_edited: false,
        };

        let chapter_names_opt = if chapter_names.is_empty() {
            None
        } else {
            Some(chapter_names.as_slice())
        };
        let chapter_paths_opt = if chapter_paths.is_empty() {
            None
        } else {
            Some(chapter_paths.as_slice())
        };
        let result = metadata::search_metadata(
            &book.title,
            Some(&book.path),
            book.author.as_deref(),
            chapter_names_opt,
            chapter_paths_opt,
            &flags,
        );

        let Some(search_result) = result else {
            log::info!("[metadata] Nenhum resultado encontrado");
            return Ok(SearchMetadataResult {
                applied: false,
                confirmed: false,
                score: 0.0,
                source: String::new(),
                title: None,
                author: None,
                has_description: false,
                has_cover: false,
                candidates: vec![],
            });
        };

        let candidates: Vec<RankedCandidateDto> = search_result
            .ranked_candidates
            .iter()
            .map(|rc| RankedCandidateDto {
                candidate: candidate_to_dto(&rc.candidate),
                score: rc.score,
            })
            .collect();

        let (dec, applied) = if let Some(dec) = &search_result.decision {
            log::info!(
                "[metadata] Aplicando automaticamente: source={}, title=\"{}\", score={:.1}",
                dec.candidate.source,
                dec.candidate.title,
                dec.score
            );
            (dec.clone(), dec.apply)
        } else {
            let best = &search_result.ranked_candidates[0];
            log::info!(
                "[metadata] Múltiplos candidatos: source={}, title=\"{}\", score={:.1} - aguardando seleção",
                best.candidate.source,
                best.candidate.title,
                best.score
            );
            (
                metadata::decision::MetadataDecision {
                    apply: false,
                    confirmed: best.score >= metadata::decision::SCORE_THRESHOLD,
                    score: best.score,
                    candidate: best.candidate.clone(),
                },
                false,
            )
        };

        if applied {
            let c = &dec.candidate;
            let mut new_author: Option<Option<&str>> = None;
            let mut new_desc: Option<Option<&str>> = None;
            let mut new_cover: Option<Option<&str>> = None;

            // Só atualiza author/description quando o candidato tem valor
            if !flags.author_manually_edited && c.author.as_ref().map(|s| !s.is_empty()).unwrap_or(false) {
                new_author = Some(c.author.as_deref());
            }
            if !flags.description_manually_edited && c.description.as_ref().map(|s| !s.is_empty()).unwrap_or(false) {
                new_desc = Some(c.description.as_deref());
            }

            let mut cover_path: Option<String> = None;
            if !flags.cover_manually_edited {
                if let Some(ref cover_url) = c.cover_url {
                    let app_data = app
                        .path()
                        .app_data_dir()
                        .map_err(|e| crate::Error::Path(e.to_string()))?;
                    let covers_dir = app_data.join("covers");
                    std::fs::create_dir_all(&covers_dir)
                        .map_err(|e| crate::Error::Io(e.to_string()))?;
                    let covers_dir = std::fs::canonicalize(&covers_dir)
                        .map_err(|e| crate::Error::Io(format!("covers_dir: {}", e)))?;
                    let ext = if cover_url.contains(".png") { "png" } else { "jpg" };
                    let safe_name = sanitize_book_id_for_filename(&book_id);
                    let dest = covers_dir.join(format!("{}.{}", safe_name, ext));
                    if metadata::cover::download_cover(cover_url, &dest).is_ok() {
                        log::info!("[metadata] Capa baixada em: {}", dest.display());
                        cover_path = Some(dest.to_string_lossy().to_string());
                    } else {
                        log::warn!("[metadata] Falha ao baixar capa de {}", cover_url);
                    }
                }
                new_cover = cover_path.as_deref().map(Some);
            }

            repositories::update_book_partial(
                &conn,
                &book_id,
                Some(c.title.as_str()),
                new_author,
                new_desc,
                new_cover,
            )?;
        }

        let result_id = format!(
            "{}-{}",
            book_id,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
        );
        repositories::insert_search_result(
            &conn,
            &result_id,
            &book_id,
            &dec.candidate.source,
            Some(&dec.candidate.source_id),
            dec.score,
            &search_result.search_query_used,
            dec.apply,
            dec.confirmed,
        )?;

        Ok(SearchMetadataResult {
            applied,
            confirmed: dec.confirmed,
            score: dec.score,
            source: dec.candidate.source.clone(),
            title: Some(dec.candidate.title.clone()),
            author: dec.candidate.author.clone(),
            has_description: dec.candidate.description.is_some(),
            has_cover: dec.candidate.cover_url.is_some(),
            candidates,
        })
    })
    .await
    .map_err(|e| crate::Error::Io(format!("spawn_blocking: {:?}", e)))?
}

#[tauri::command]
pub async fn apply_metadata_candidate(
    app: AppHandle,
    book_id: String,
    candidate: MetadataCandidateDto,
) -> crate::Result<BookWithVolumes> {
    log::info!(
        "[metadata] Aplicando candidato: source={} title=\"{}\" author={:?} desc={} cover_url={}",
        candidate.source,
        candidate.title,
        candidate.author,
        candidate.description.as_ref().map(|s| s.len()).unwrap_or(0),
        candidate.cover_url.as_ref().map(|s| s.len()).unwrap_or(0),
    );

    tauri::async_runtime::spawn_blocking(move || {
        let conn = db::open(&app)?;

        let _book = repositories::list_books(&conn)?
            .into_iter()
            .find(|b| b.id == book_id)
            .ok_or_else(|| crate::Error::NotFound("Book not found".to_string()))?;

        let _ = repositories::get_metadata_flags(&conn, &book_id)?; // ignoramos flags quando usuário seleciona

        let c = MetadataCandidate {
            source: candidate.source,
            source_id: candidate.source_id,
            media_type: match candidate.media_type.as_str() {
                "manga" => metadata::MediaType::Manga,
                "anime" => metadata::MediaType::Anime,
                _ => metadata::MediaType::Book,
            },
            title: candidate.title,
            title_alternatives: candidate.title_alternatives,
            author: candidate.author,
            description: candidate.description,
            cover_url: candidate.cover_url,
            year: candidate.year,
            language: candidate.language,
        };

        let mut new_author: Option<Option<&str>> = None;
        let mut new_desc: Option<Option<&str>> = None;
        let mut new_cover: Option<Option<&str>> = None;

        // Usuário selecionou explicitamente: aplicar todos os campos que o candidato tiver.
        // (flags são respeitadas só na aplicação automática)
        if c.author.as_ref().map(|s| !s.is_empty()).unwrap_or(false) {
            new_author = Some(c.author.as_deref());
        }
        if c.description
            .as_ref()
            .map(|s| !s.is_empty())
            .unwrap_or(false)
        {
            new_desc = Some(c.description.as_deref());
        }

        let mut cover_path_owned: Option<String> = None;
        // Usuário selecionou: aplicar capa também (ignorar flag de edição manual)
        if let Some(ref cover_url) = c.cover_url {
            let app_data = app
                .path()
                .app_data_dir()
                .map_err(|e| crate::Error::Path(e.to_string()))?;
            let covers_dir = app_data.join("covers");
            std::fs::create_dir_all(&covers_dir).map_err(|e| crate::Error::Io(e.to_string()))?;
            let covers_dir = std::fs::canonicalize(&covers_dir)
                .map_err(|e| crate::Error::Io(format!("covers_dir: {}", e)))?;
            let ext = if cover_url.contains(".png") {
                "png"
            } else {
                "jpg"
            };
            let safe_name = sanitize_book_id_for_filename(&book_id);
            let dest = covers_dir.join(format!("{}.{}", safe_name, ext));
            if metadata::cover::download_cover(cover_url, &dest).is_ok() {
                log::info!("[metadata] Capa baixada em: {}", dest.display());
                cover_path_owned = Some(dest.to_string_lossy().to_string());
            }
        }
        new_cover = cover_path_owned.as_deref().map(Some);

        log::info!(
            "[metadata] Atualizando book_id={} author={:?} desc={} cover={}",
            book_id,
            new_author,
            new_desc.is_some(),
            new_cover.is_some(),
        );

        repositories::update_book_partial(
            &conn,
            &book_id,
            Some(c.title.as_str()),
            new_author,
            new_desc,
            new_cover,
        )?;

        let result_id = format!(
            "{}-{}",
            book_id,
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis()
        );
        repositories::insert_search_result(
            &conn,
            &result_id,
            &book_id,
            &c.source,
            Some(&c.source_id),
            100.0,
            "",
            true,
            true,
        )?;

        // Retorna o livro atualizado para o frontend usar diretamente
        let book = repositories::list_books(&conn)?
            .into_iter()
            .find(|b| b.id == book_id)
            .ok_or_else(|| crate::Error::NotFound("Book not found".to_string()))?;
        log::info!(
            "[metadata] Após update: author={:?} description={} cover_path={:?}",
            book.author,
            book.description.as_ref().map(|s| s.len()).unwrap_or(0),
            book.cover_path.as_ref().map(|s| s.len()).unwrap_or(0),
        );
        let volumes = repositories::list_volumes(&conn, &book_id)?;
        let volumes_with_chapters: Vec<VolumeWithChaptersOut> = volumes
            .into_iter()
            .map(|vol| {
                let chapters = repositories::list_chapters(&conn, &vol.id).unwrap_or_default();
                VolumeWithChaptersOut {
                    volume: vol,
                    chapters,
                }
            })
            .collect();

        Ok(BookWithVolumes {
            book,
            volumes: volumes_with_chapters,
        })
    })
    .await
    .map_err(|e| crate::Error::Io(format!("spawn_blocking: {:?}", e)))?
}
