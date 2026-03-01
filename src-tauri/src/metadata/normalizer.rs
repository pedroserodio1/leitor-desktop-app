//! Pipeline de normalização de título e autor antes da busca.
//! Remove acentos, pontuação, termos de edição/volume, lowercase.

use regex::Regex;
use std::sync::LazyLock;

/// Termos de edição/volume para remoção (PT e EN).
static EDITION_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)(\d+ª?\s*ed\.?ição?|revised\s+edition|ed\.?\s*\d+|volume\s*\d+|vol\.?\s*\d+)")
        .expect("edition regex")
});

/// Mapeamento de acentos para ASCII.
const ACCENT_MAP: &[(char, char)] = &[
    ('á', 'a'),
    ('à', 'a'),
    ('â', 'a'),
    ('ã', 'a'),
    ('ä', 'a'),
    ('å', 'a'),
    ('é', 'e'),
    ('è', 'e'),
    ('ê', 'e'),
    ('ë', 'e'),
    ('í', 'i'),
    ('ì', 'i'),
    ('î', 'i'),
    ('ï', 'i'),
    ('ó', 'o'),
    ('ò', 'o'),
    ('ô', 'o'),
    ('õ', 'o'),
    ('ö', 'o'),
    ('ú', 'u'),
    ('ù', 'u'),
    ('û', 'u'),
    ('ü', 'u'),
    ('ý', 'y'),
    ('ÿ', 'y'),
    ('ñ', 'n'),
    ('ç', 'c'),
];

/// Normaliza uma string para busca.
/// 1. Remove acentos
/// 2. Lowercase
/// 3. Remove termos de edição/volume
/// 4. Remove pontuação irrelevante
/// 5. Colapsa espaços múltiplos
/// 6. Trim
pub fn normalize(s: &str) -> String {
    let mut result = s.to_lowercase();
    for (accented, plain) in ACCENT_MAP {
        result = result.replace(*accented, &plain.to_string());
    }
    result = EDITION_REGEX.replace_all(&result, " ").to_string();
    result = result
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c.is_whitespace() {
                c
            } else {
                ' '
            }
        })
        .collect();
    result = result.split_whitespace().collect::<Vec<_>>().join(" ");
    result.trim().to_string()
}

/// Detecta se o texto contém caracteres japoneses (Hiragana, Katakana ou Kanji).
pub fn contains_japanese(s: &str) -> bool {
    s.chars().any(|c| {
        matches!(c,
            '\u{3040}'..='\u{309F}' | // Hiragana
            '\u{30A0}'..='\u{30FF}' | // Katakana
            '\u{4E00}'..='\u{9FFF}'   // Kanji (CJK básico)
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize() {
        assert_eq!(normalize("São Paulo"), "sao paulo");
        assert_eq!(normalize("Harry Potter"), "harry potter");
        assert_eq!(normalize("O Senhor: 2ª ed."), "o senhor");
        assert_eq!(normalize("Volume 1"), "volume");
        assert_eq!(normalize("revised edition"), "");
    }
}
