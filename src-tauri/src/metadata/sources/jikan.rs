//! Adapter para Jikan (MyAnimeList - anime e mangá).
//! GET https://api.jikan.moe/v4/anime?q=X ou /v4/manga?q=X

use super::source_trait::MetadataSource;
use crate::metadata::{MediaType, MetadataCandidate};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(8);
const ANIME_URL: &str = "https://api.jikan.moe/v4/anime";
const MANGA_URL: &str = "https://api.jikan.moe/v4/manga";

#[derive(Deserialize)]
struct JikanResponse {
    data: Option<Vec<JikanItem>>,
}

#[derive(Deserialize)]
struct JikanItem {
    mal_id: Option<i64>,
    title: Option<String>,
    #[serde(rename = "title_english")]
    title_english: Option<String>,
    #[serde(rename = "title_japanese")]
    title_japanese: Option<String>,
    synopsis: Option<String>,
    images: Option<JikanImages>,
    #[serde(rename = "published")]
    published: Option<JikanDateRange>,
}

#[derive(Deserialize)]
struct JikanImages {
    jpg: Option<JikanImageUrls>,
}

#[derive(Deserialize)]
struct JikanImageUrls {
    #[serde(rename = "image_url")]
    image_url: Option<String>,
    #[serde(rename = "large_image_url")]
    large_image_url: Option<String>,
}

#[derive(Deserialize)]
struct JikanDateRange {
    #[serde(rename = "from")]
    from: Option<String>,
}

pub struct JikanSource;

impl MetadataSource for JikanSource {
    fn name(&self) -> &'static str {
        "jikan"
    }

    fn search(&self, query: &str) -> Vec<MetadataCandidate> {
        // Apenas manga (anime excluído - app é para livros/manga/novel)
        search_endpoint(query, MANGA_URL, MediaType::Manga)
    }
}

fn search_endpoint(query: &str, url: &str, media_type: MediaType) -> Vec<MetadataCandidate> {
    let endpoint = if url.contains("anime") {
        "anime"
    } else {
        "manga"
    };
    log::debug!("[metadata:jikan] Buscando \"{}\" em {}", query, endpoint);

    let client = match Client::builder()
        .timeout(TIMEOUT)
        .user_agent("Readito/1.0")
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            log::warn!("[metadata:jikan] Falha ao criar client: {}", e);
            return vec![];
        }
    };

    let full_url = format!("{}?q={}&limit=5", url, urlencoding::encode(query));

    let resp = match client.get(&full_url).send() {
        Ok(r) => r,
        Err(e) => {
            log::warn!("[metadata:jikan] Falha na requisição {}: {}", endpoint, e);
            return vec![];
        }
    };

    let data: JikanResponse = match resp.json() {
        Ok(d) => d,
        Err(e) => {
            log::warn!("[metadata:jikan] Falha ao parsear JSON: {}", e);
            return vec![];
        }
    };

    let items = match data.data {
        Some(d) if !d.is_empty() => {
            log::info!(
                "[metadata:jikan] {} resultados em {} para \"{}\"",
                d.len(),
                endpoint,
                query
            );
            d
        }
        _ => return vec![],
    };

    items
        .into_iter()
        .filter_map(|item| {
            let title = item.title?.trim().to_string();
            if title.is_empty() {
                return None;
            }
            let mut alts = vec![title.clone()];
            for t in [&item.title_english, &item.title_japanese] {
                if let Some(s) = t {
                    let s = s.trim();
                    if !s.is_empty() && !alts.contains(&s.to_string()) {
                        alts.push(s.to_string());
                    }
                }
            }
            let cover_url = item
                .images
                .and_then(|i| i.jpg)
                .and_then(|j| j.large_image_url.or(j.image_url));
            let year = item
                .published
                .and_then(|p| p.from)
                .as_ref()
                .and_then(|s| s.chars().take(4).collect::<String>().parse::<i32>().ok());
            Some(MetadataCandidate {
                source: "jikan".to_string(),
                source_id: item.mal_id.map(|id| id.to_string()).unwrap_or_default(),
                media_type,
                title,
                title_alternatives: alts,
                author: None,
                description: item.synopsis.filter(|s| !s.trim().is_empty()),
                cover_url,
                year,
                language: None,
            })
        })
        .collect()
}
