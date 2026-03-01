//! Geração de variações de busca (múltiplas tentativas por livro).

use super::normalizer;
use std::path::Path;

/// Siglas comuns -> título completo.
static SIGLAS: &[(&str, &str)] = &[
    ("got", "game of thrones"),
    ("asoiaf", "a song of ice and fire"),
    ("lotr", "lord of the rings"),
    ("hp", "harry potter"),
    ("twot", "the wheel of time"),
    ("wot", "wheel of time"),
    ("tbate", "the beginning after the end"),
];

/// Indica se o conteúdo parece ser livro/novel ocidental (para filtrar anime).
/// Considera título, path e siglas expandidas.
pub fn is_likely_western_book(title: &str, path: Option<&str>) -> bool {
    let check = |s: &str| {
        let norm = normalizer::normalize(s);
        if norm.is_empty() {
            return false;
        }
        if looks_western_book(&norm) {
            return true;
        }
        if let Some(expanded) = expand_sigla(&norm) {
            if looks_western_book(&expanded) {
                return true;
            }
        }
        false
    };
    if check(title) {
        return true;
    }
    if let Some(p) = path {
        for component in Path::new(p).components() {
            if let std::path::Component::Normal(os_str) = component {
                if let Some(s) = os_str.to_str() {
                    if check(s) {
                        return true;
                    }
                }
            }
        }
    }
    false
}

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
        "beginning",
        "after",
        "end",
    ];
    let has_book_like = words.iter().any(|w| {
        let low = w.to_lowercase();
        book_indicators.contains(&low.as_str())
    });
    let no_numbers = !norm.chars().any(|c| c.is_ascii_digit());
    has_book_like && no_numbers
}

/// Gera variações de busca em ordem de prioridade.
/// Usa título, path (nome da pasta/arquivo), autor, nomes e paths dos capítulos.
pub fn generate_variations(
    title: &str,
    path: Option<&str>,
    author: Option<&str>,
    chapter_names: Option<&[String]>,
    chapter_paths: Option<&[String]>,
) -> Vec<String> {
    let mut variations = Vec::new();

    // Variações baseadas no título
    let normalized = normalizer::normalize(title);
    if !normalized.is_empty() {
        add_with_sigla_expansion(&mut variations, &normalized);

        // Sem artigo inicial: "a game of thrones" -> "game of thrones"
        let without_article = strip_leading_article(&normalized);
        if !without_article.is_empty() && without_article != normalized {
            add_with_sigla_expansion(&mut variations, &without_article);
        }

        // 2 e 3. Título principal (antes de : ou -)
        let main_title = title_before_colon_or_dash(&normalized);
        if !main_title.is_empty() && main_title != normalized {
            add_with_sigla_expansion(&mut variations, &main_title);
        }

        // 4. 3-5 palavras principais
        let keywords = extract_keywords(&normalized, 5);
        if !keywords.is_empty() && keywords != normalized {
            add_with_sigla_expansion(&mut variations, &keywords);
        }
    }

    // Variações baseadas no path (nome da pasta/arquivo)
    if let Some(p) = path {
        for path_var in extract_path_variations(p) {
            if !path_var.is_empty() {
                add_with_sigla_expansion(&mut variations, &path_var);
            }
        }
    }

    // Variações baseadas nos nomes dos capítulos (ex: "001 - The Kingsroad", "Author - Title - 001")
    if let Some(names) = chapter_names {
        for ch_name in names.iter().take(15) {
            extract_from_chapter_name(&mut variations, ch_name);
        }
    }

    // Variações baseadas nos paths dos arquivos (pastas intermediárias, nome do arquivo)
    if let Some(paths) = chapter_paths {
        for ch_path in paths.iter().take(20) {
            extract_from_chapter_path(&mut variations, ch_path);
        }
    }

    // 5. Título + autor (se existir)
    let base = normalized.as_str();
    if !base.is_empty() {
        if let Some(a) = author {
            let a_norm = normalizer::normalize(a);
            if !a_norm.is_empty() {
                variations.push(format!("{} {}", base, a_norm));
            }
        }
    }

    variations.dedup();
    variations
}

fn add_with_sigla_expansion(variations: &mut Vec<String>, s: &str) {
    let s = s.trim();
    if s.is_empty() {
        return;
    }
    if !variations.contains(&s.to_string()) {
        variations.push(s.to_string());
    }
    // Se parece sigla (2-6 letras, só alfabético), expandir
    if let Some(expanded) = expand_sigla(s) {
        if !variations.contains(&expanded) {
            variations.push(expanded);
        }
    }
}

fn expand_sigla(s: &str) -> Option<String> {
    let s = s.trim().to_lowercase();
    if s.len() >= 2 && s.len() <= 6 && s.chars().all(|c| c.is_ascii_alphabetic()) {
        SIGLAS
            .iter()
            .find(|(sig, _)| *sig == s)
            .map(|(_, full)| full.to_string())
    } else {
        None
    }
}

fn strip_leading_article(s: &str) -> String {
    const ARTICLES: &[&str] = &["a ", "the ", "o ", "os ", "as ", "um ", "uma ", "an "];
    let lower = s.trim().to_lowercase();
    for art in ARTICLES {
        if lower.starts_with(art) {
            return lower[art.len()..].trim().to_string();
        }
    }
    lower
}

fn extract_from_chapter_name(variations: &mut Vec<String>, ch_name: &str) {
    let norm = normalizer::normalize(ch_name);
    if norm.len() < 3 {
        return;
    }
    // Parte antes de : ou - (no nome original)
    let part = title_before_colon_or_dash(&norm);
    let meaningful = extract_keywords(&part, 5);
    if !meaningful.is_empty() && meaningful.len() >= 4 {
        add_with_sigla_expansion(variations, &meaningful);
    }
    // Padrão "Autor - Título - 001" — partes separadas por " - " ou " _ " (no nome original)
    for segment in ch_name.split(" - ").chain(ch_name.split(" _ ")) {
        let seg = segment.trim();
        if seg.len() < 3 {
            continue;
        }
        let seg_norm = normalizer::normalize(seg);
        if seg_norm.len() >= 4 && !seg_norm.chars().all(|c| c.is_ascii_digit()) {
            add_with_sigla_expansion(variations, &seg_norm);
        }
    }
}

fn extract_from_chapter_path(variations: &mut Vec<String>, ch_path: &str) {
    let path_obj = Path::new(ch_path);
    for component in path_obj.components() {
        if let std::path::Component::Normal(os_str) = component {
            if let Some(s) = os_str.to_str() {
                let stem = Path::new(s)
                    .file_stem()
                    .and_then(|x| x.to_str())
                    .unwrap_or(s);
                // Partes separadas por " - " ou " _ " (antes de normalizar)
                for segment in stem.split(" - ").chain(stem.split(" _ ")) {
                    let seg = segment.trim();
                    if seg.is_empty() {
                        continue;
                    }
                    let norm = normalizer::normalize(seg);
                    if norm.len() >= 4 && !norm.chars().all(|c| c.is_ascii_digit()) {
                        add_with_sigla_expansion(variations, &norm);
                    }
                }
                // Nome completo (sem extensão)
                let norm = normalizer::normalize(stem);
                if norm.len() >= 4 && !norm.chars().all(|c| c.is_ascii_digit()) {
                    add_with_sigla_expansion(variations, &norm);
                }
            }
        }
    }
}

/// Extrai variações de busca a partir do path (nome da pasta ou arquivo).
fn extract_path_variations(path: &str) -> Vec<String> {
    let path_obj = Path::new(path);
    let mut vars = Vec::new();

    // Último componente (nome da pasta ou arquivo)
    if let Some(name) = path_obj.file_stem() {
        if let Some(s) = name.to_str() {
            let norm = normalizer::normalize(s);
            if !norm.is_empty() {
                vars.push(norm.clone());

                // Sem extensão, pode ter "Vol 01 - Romance Dawn" — usar parte antes de "-"
                let main = title_before_colon_or_dash(&norm);
                if !main.is_empty() && main != norm {
                    vars.push(main);
                }

                let kw = extract_keywords(&norm, 5);
                if !kw.is_empty() && kw != norm {
                    vars.push(kw);
                }
            }
        }
    }

    // Se há pasta pai (ex: "One Piece/Vol 01"), adicionar nome da pasta pai
    if let Some(parent) = path_obj.parent() {
        if let Some(parent_name) = parent.file_name() {
            if let Some(s) = parent_name.to_str() {
                let norm = normalizer::normalize(s);
                if !norm.is_empty() && !vars.contains(&norm) {
                    vars.push(norm.clone());
                }
                // Série + volume: "one piece vol 01"
                if let Some(name) = path_obj.file_stem() {
                    if let Some(n) = name.to_str() {
                        let combined = format!("{} {}", norm, normalizer::normalize(n));
                        if !combined.is_empty() && combined != norm && !vars.contains(&combined) {
                            vars.push(combined);
                        }
                    }
                }
            }
        }
    }

    vars
}

fn title_before_colon_or_dash(s: &str) -> String {
    for sep in [':', '–', '-', '—'] {
        if let Some(pos) = s.find(sep) {
            let part = s[..pos].trim();
            if !part.is_empty() {
                return part.to_string();
            }
        }
    }
    s.to_string()
}

/// Artigos e preposições comuns para filtrar nas palavras-chave.
const STOP_WORDS: &[&str] = &[
    "a", "o", "e", "de", "da", "do", "das", "dos", "um", "uma", "os", "as", "the", "a", "an", "of",
    "and", "or", "in", "on", "to", "for", "no", "na", "em", "com", "por", "para",
];

fn extract_keywords(s: &str, max_words: usize) -> String {
    let words: Vec<&str> = s
        .split_whitespace()
        .filter(|w| {
            let lower = w.to_lowercase();
            !STOP_WORDS.iter().any(|sw| *sw == lower)
        })
        .take(max_words)
        .collect();
    words.join(" ")
}
