//! Adapter para Open Library (livros).
//! https://openlibrary.org/search.json?title=X ou q=X

use super::source_trait::MetadataSource;
use crate::metadata::{MediaType, MetadataCandidate};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(8);
const BASE_URL: &str = "https://openlibrary.org/search.json";

#[derive(Deserialize)]
struct OpenLibraryResponse {
    docs: Option<Vec<OpenLibraryDoc>>,
}

#[derive(Deserialize)]
struct OpenLibraryDoc {
    title: Option<String>,
    author_name: Option<Vec<String>>,
    first_publish_year: Option<i32>,
    cover_i: Option<i64>,
    key: Option<String>,
}

pub struct OpenLibrarySource;

impl MetadataSource for OpenLibrarySource {
    fn name(&self) -> &'static str {
        "open_library"
    }

    fn search(&self, query: &str) -> Vec<MetadataCandidate> {
        let client = match Client::builder().timeout(TIMEOUT).build() {
            Ok(c) => c,
            Err(e) => {
                log::warn!("[metadata:open_library] Falha ao criar client: {}", e);
                return vec![];
            }
        };

        let url = format!("{}?q={}", BASE_URL, urlencoding::encode(query));
        log::debug!("[metadata:open_library] GET {}", url);

        let resp = match client.get(&url).send() {
            Ok(r) => r,
            Err(e) => {
                log::warn!("[metadata:open_library] Falha na requisição: {}", e);
                return vec![];
            }
        };

        let data: OpenLibraryResponse = match resp.json() {
            Ok(d) => d,
            Err(e) => {
                log::warn!("[metadata:open_library] Falha ao parsear JSON: {}", e);
                return vec![];
            }
        };

        let docs = match data.docs {
            Some(d) if !d.is_empty() => {
                log::info!(
                    "[metadata:open_library] {} resultados para \"{}\"",
                    d.len(),
                    query
                );
                d
            }
            _ => return vec![],
        };

        docs.into_iter()
            .filter_map(|d| {
                let title = d.title?.trim().to_string();
                if title.is_empty() {
                    return None;
                }
                let source_id = d
                    .key
                    .unwrap_or_default()
                    .trim_start_matches("/works/")
                    .to_string();
                let cover_url = d
                    .cover_i
                    .map(|id| format!("https://covers.openlibrary.org/b/id/{}-L.jpg", id));
                Some(MetadataCandidate {
                    source: "open_library".to_string(),
                    source_id,
                    media_type: MediaType::Book,
                    title: title.clone(),
                    title_alternatives: vec![title],
                    author: d.author_name.and_then(|a| {
                        if a.is_empty() {
                            None
                        } else {
                            Some(a.join(", "))
                        }
                    }),
                    description: None,
                    cover_url,
                    year: d.first_publish_year,
                    language: None,
                })
            })
            .collect()
    }
}
