//! Adapter para AniList (anime e mangá).
//! POST https://graphql.anilist.co

use super::source_trait::MetadataSource;
use crate::metadata::{MediaType, MetadataCandidate};
use reqwest::blocking::Client;
use serde::Deserialize;
use serde_json::json;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(8);
const ENDPOINT: &str = "https://graphql.anilist.co";

#[derive(Deserialize)]
struct AniListResponse {
    data: Option<AniListData>,
}

#[derive(Deserialize)]
struct AniListData {
    #[serde(rename = "Page")]
    page: Option<AniListPage>,
}

#[derive(Deserialize)]
struct AniListPage {
    media: Option<Vec<AniListMedia>>,
}

#[derive(Deserialize)]
struct AniListMedia {
    id: Option<i64>,
    title: Option<AniListTitle>,
    #[serde(rename = "coverImage")]
    cover_image: Option<AniListCoverImage>,
    description: Option<String>,
    #[serde(rename = "startDate")]
    start_date: Option<AniListFuzzyDate>,
    studios: Option<AniListStudios>,
}

#[derive(Deserialize)]
struct AniListTitle {
    romaji: Option<String>,
    english: Option<String>,
    native: Option<String>,
}

#[derive(Deserialize)]
struct AniListCoverImage {
    large: Option<String>,
}

#[derive(Deserialize)]
struct AniListFuzzyDate {
    year: Option<i32>,
}

#[derive(Deserialize)]
struct AniListStudios {
    nodes: Option<Vec<AniListStudio>>,
}

#[derive(Deserialize)]
struct AniListStudio {
    name: Option<String>,
}

pub struct AniListSource;

impl MetadataSource for AniListSource {
    fn name(&self) -> &'static str {
        "anilist"
    }

    fn search(&self, query: &str) -> Vec<MetadataCandidate> {
        log::debug!("[metadata:anilist] Buscando \"{}\"", query);

        let client = match Client::builder().timeout(TIMEOUT).build() {
            Ok(c) => c,
            Err(e) => {
                log::warn!("[metadata:anilist] Falha ao criar client: {}", e);
                return vec![];
            }
        };

        let mut results = Vec::new();

        // Apenas manga (anime excluído - app é para livros/manga/novel)
        for (media_type, type_str) in [(MediaType::Manga, "MANGA")] {
            let query_body = format!(
                r#"
                query ($search: String!) {{
                    Page(perPage: 10) {{
                        media(search: $search, type: {}) {{
                            id
                            title {{ romaji english native }}
                            coverImage {{ large }}
                            description
                            startDate {{ year }}
                            studios(isMain: true) {{ nodes {{ name }} }}
                        }}
                    }}
                }}
            "#,
                type_str
            );

            let body = json!({
                "query": query_body,
                "variables": { "search": query }
            });

            let resp = match client
                .post(ENDPOINT)
                .json(&body)
                .header("Content-Type", "application/json")
                .send()
            {
                Ok(r) => r,
                Err(e) => {
                    log::warn!("[metadata:anilist] Falha na requisição {}: {}", type_str, e);
                    continue;
                }
            };

            let data: AniListResponse = match resp.json() {
                Ok(d) => d,
                Err(e) => {
                    log::warn!("[metadata:anilist] Falha ao parsear JSON: {}", e);
                    continue;
                }
            };

            let media_list = data
                .data
                .and_then(|d| d.page)
                .and_then(|p| p.media)
                .unwrap_or_default();

            if !media_list.is_empty() {
                log::info!(
                    "[metadata:anilist] {} resultados em {} para \"{}\"",
                    media_list.len(),
                    type_str,
                    query
                );
            }

            for m in media_list {
                let title_obj = match &m.title {
                    Some(t) => t,
                    None => continue,
                };
                let main_title = title_obj
                    .romaji
                    .clone()
                    .or(title_obj.english.clone())
                    .or(title_obj.native.clone())
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty());
                let main_title = match main_title {
                    Some(t) => t,
                    None => continue,
                };
                let mut alts = Vec::new();
                for t in [&title_obj.romaji, &title_obj.english, &title_obj.native] {
                    if let Some(s) = t {
                        let s = s.trim();
                        if !s.is_empty() && !alts.contains(&s.to_string()) {
                            alts.push(s.to_string());
                        }
                    }
                }
                let author = m
                    .studios
                    .and_then(|s| s.nodes)
                    .and_then(|n| n.into_iter().next())
                    .and_then(|st| st.name);
                let desc = m.description.as_ref().map(|s| strip_html(s.clone()));
                results.push(MetadataCandidate {
                    source: "anilist".to_string(),
                    source_id: m.id.map(|id| id.to_string()).unwrap_or_default(),
                    media_type,
                    title: main_title.clone(),
                    title_alternatives: if alts.is_empty() {
                        vec![main_title]
                    } else {
                        alts
                    },
                    author,
                    description: desc.filter(|s| !s.is_empty()),
                    cover_url: m.cover_image.as_ref().and_then(|c| c.large.clone()),
                    year: m.start_date.as_ref().and_then(|d| d.year),
                    language: None,
                });
            }
        }

        results
    }
}

fn strip_html(s: String) -> String {
    let mut out = String::new();
    let mut in_tag = false;
    for c in s.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out.replace("\\n", " ").trim().to_string()
}
