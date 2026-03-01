//! Modelo unificado de resultado de busca de metadados (todas as fontes).

use serde::{Deserialize, Serialize};

/// Tipo de mídia: livro, anime ou mangá.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Book,
    Anime,
    Manga,
}

/// Resultado candidato de uma fonte de metadados.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataCandidate {
    /// Identificador da fonte (open_library, loc, anilist, kitsu, jikan)
    pub source: String,
    /// ID do item na fonte (ex: OL27448W, 12345)
    pub source_id: String,
    /// Tipo de mídia (livro, anime, mangá)
    pub media_type: MediaType,
    /// Título principal
    pub title: String,
    /// Títulos alternativos (romaji, english, native para anime)
    pub title_alternatives: Vec<String>,
    /// Autor ou staff (para anime: studio/diretor)
    pub author: Option<String>,
    /// Descrição/sinopse
    pub description: Option<String>,
    /// URL da capa para download (será baixada e salva localmente)
    pub cover_url: Option<String>,
    /// Ano de publicação/lançamento
    pub year: Option<i32>,
    /// Código de idioma (eng, por, jpn, etc)
    pub language: Option<String>,
}
