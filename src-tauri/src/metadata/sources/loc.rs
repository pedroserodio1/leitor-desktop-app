//! Adapter para Library of Congress (livros).
//! https://www.loc.gov/books/?q=X&fo=json

use super::source_trait::MetadataSource;
use crate::metadata::{MediaType, MetadataCandidate};
use reqwest::blocking::Client;
use serde::Deserialize;
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(8);
const BASE_URL: &str = "https://www.loc.gov/books/";

#[derive(Deserialize)]
struct LocResponse {
    results: Option<Vec<LocItem>>,
}

#[derive(Deserialize)]
struct LocItem {
    id: Option<String>,
    title: Option<String>,
    #[serde(rename = "date")]
    date_str: Option<String>,
}

pub struct LocSource;

impl MetadataSource for LocSource {
    fn name(&self) -> &'static str {
        "loc"
    }

    fn search(&self, query: &str) -> Vec<MetadataCandidate> {
        log::debug!("[metadata:loc] Buscando \"{}\"", query);

        let client = match Client::builder().timeout(TIMEOUT).build() {
            Ok(c) => c,
            Err(e) => {
                log::warn!("[metadata:loc] Falha ao criar client: {}", e);
                return vec![];
            }
        };

        let url = format!("{}?q={}&fo=json&c=10", BASE_URL, urlencoding::encode(query));
        let resp = match client.get(&url).send() {
            Ok(r) => r,
            Err(e) => {
                log::warn!("[metadata:loc] Falha na requisição: {}", e);
                return vec![];
            }
        };

        let data: LocResponse = match resp.json() {
            Ok(d) => d,
            Err(e) => {
                log::warn!("[metadata:loc] Falha ao parsear JSON: {}", e);
                return vec![];
            }
        };

        let items = match data.results {
            Some(r) if !r.is_empty() => {
                log::info!("[metadata:loc] {} resultados para \"{}\"", r.len(), query);
                r
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
                let source_id = item.id.unwrap_or_default();
                let year = item
                    .date_str
                    .and_then(|s| s.chars().take(4).collect::<String>().parse::<i32>().ok());
                Some(MetadataCandidate {
                    source: "loc".to_string(),
                    source_id,
                    media_type: MediaType::Book,
                    title: title.clone(),
                    title_alternatives: vec![title],
                    author: None,
                    description: None,
                    cover_url: None,
                    year,
                    language: None,
                })
            })
            .collect()
    }
}
