//! Adapter para Kitsu (anime).
//! GET https://kitsu.io/api/edge/anime?filter[text]=X

use super::source_trait::MetadataSource;
use crate::metadata::{MediaType, MetadataCandidate};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(8);
const BASE_URL: &str = "https://kitsu.io/api/edge/anime";

#[derive(Deserialize)]
struct KitsuResponse {
    data: Option<Vec<KitsuItem>>,
}

#[derive(Deserialize)]
struct KitsuItem {
    id: Option<String>,
    #[serde(rename = "attributes")]
    attrs: Option<KitsuAttributes>,
}

#[derive(Deserialize)]
struct KitsuAttributes {
    #[serde(rename = "canonicalTitle")]
    canonical_title: Option<String>,
    #[serde(rename = "titles")]
    titles: Option<serde_json::Value>,
    synopsis: Option<String>,
    #[serde(rename = "posterImage")]
    poster_image: Option<KitsuPosterImage>,
    #[serde(rename = "startDate")]
    start_date: Option<String>,
}

#[derive(Deserialize)]
struct KitsuPosterImage {
    #[serde(rename = "original")]
    original: Option<String>,
    large: Option<String>,
}

pub struct KitsuSource;

impl MetadataSource for KitsuSource {
    fn name(&self) -> &'static str {
        "kitsu"
    }

    fn search(&self, query: &str) -> Vec<MetadataCandidate> {
        log::debug!("[metadata:kitsu] Buscando \"{}\"", query);

        let client = match Client::builder()
            .timeout(TIMEOUT)
            .user_agent("Readito/1.0")
            .build()
        {
            Ok(c) => c,
            Err(e) => {
                log::warn!("[metadata:kitsu] Falha ao criar client: {}", e);
                return vec![];
            }
        };

        let url = format!("{}?filter[text]={}", BASE_URL, urlencoding::encode(query));

        let resp = match client
            .get(&url)
            .header("Accept", "application/vnd.api+json")
            .send()
        {
            Ok(r) => r,
            Err(e) => {
                log::warn!("[metadata:kitsu] Falha na requisição: {}", e);
                return vec![];
            }
        };

        let data: KitsuResponse = match resp.json() {
            Ok(d) => d,
            Err(e) => {
                log::warn!("[metadata:kitsu] Falha ao parsear JSON: {}", e);
                return vec![];
            }
        };

        let items = match data.data {
            Some(d) if !d.is_empty() => {
                log::info!("[metadata:kitsu] {} resultados para \"{}\"", d.len(), query);
                d
            }
            _ => return vec![],
        };

        items
            .into_iter()
            .filter_map(|item| {
                let attrs = item.attrs?;
                let title = attrs.canonical_title?.trim().to_string();
                if title.is_empty() {
                    return None;
                }
                let mut alts = vec![title.clone()];
                if let Some(titles) = attrs.titles {
                    if let Some(obj) = titles.as_object() {
                        for (_, v) in obj {
                            if let Some(s) = v.as_str() {
                                let s = s.trim();
                                if !s.is_empty() && !alts.contains(&s.to_string()) {
                                    alts.push(s.to_string());
                                }
                            }
                        }
                    }
                }
                let cover_url = attrs.poster_image.and_then(|p| p.original.or(p.large));
                let year = attrs
                    .start_date
                    .as_ref()
                    .and_then(|s| s.chars().take(4).collect::<String>().parse::<i32>().ok());
                Some(MetadataCandidate {
                    source: "kitsu".to_string(),
                    source_id: item.id.unwrap_or_default(),
                    media_type: MediaType::Anime,
                    title,
                    title_alternatives: alts,
                    author: None,
                    description: attrs.synopsis.filter(|s| !s.trim().is_empty()),
                    cover_url,
                    year,
                    language: None,
                })
            })
            .collect()
    }
}
