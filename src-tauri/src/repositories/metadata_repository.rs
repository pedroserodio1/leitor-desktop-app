//! Repositório para flags de edição manual e histórico de buscas.

use rusqlite::params;

pub fn get_metadata_flags(
    conn: &rusqlite::Connection,
    book_id: &str,
) -> crate::Result<(bool, bool, bool, bool)> {
    let row = conn.query_row(
        "SELECT author_manually_edited, description_manually_edited, cover_manually_edited, title_manually_edited FROM book_metadata_flags WHERE book_id = ?1",
        [book_id],
        |row| {
            Ok((
                row.get::<_, i32>(0)? != 0,
                row.get::<_, i32>(1)? != 0,
                row.get::<_, i32>(2)? != 0,
                row.get::<_, i32>(3)? != 0,
            ))
        },
    );
    match row {
        Ok(r) => Ok(r),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok((false, false, false, false)),
        Err(e) => Err(e.into()),
    }
}

pub fn set_metadata_flags(
    conn: &rusqlite::Connection,
    book_id: &str,
    author: bool,
    description: bool,
    cover: bool,
    title: bool,
) -> crate::Result<()> {
    conn.execute(
        r#"
        INSERT INTO book_metadata_flags (book_id, author_manually_edited, description_manually_edited, cover_manually_edited, title_manually_edited)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(book_id) DO UPDATE SET
            author_manually_edited = MAX(author_manually_edited, ?2),
            description_manually_edited = MAX(description_manually_edited, ?3),
            cover_manually_edited = MAX(cover_manually_edited, ?4),
            title_manually_edited = MAX(title_manually_edited, ?5)
        "#,
        params![book_id, author as i32, description as i32, cover as i32, title as i32],
    )?;
    Ok(())
}

pub fn insert_search_result(
    conn: &rusqlite::Connection,
    id: &str,
    book_id: &str,
    source: &str,
    source_id: Option<&str>,
    score: f32,
    search_query: &str,
    applied: bool,
    confirmed: bool,
) -> crate::Result<()> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        r#"
        INSERT INTO metadata_search_results (id, book_id, source, source_id, score, search_query, search_date, applied, confirmed)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        params![
            id,
            book_id,
            source,
            source_id.unwrap_or(""),
            score,
            search_query,
            now,
            applied as i32,
            confirmed as i32,
        ],
    )?;
    Ok(())
}
