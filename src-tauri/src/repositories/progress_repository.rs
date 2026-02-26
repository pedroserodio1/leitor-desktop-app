//! Repositório de progresso de leitura (um por volume).
//! Frontend faz debounce para evitar writes excessivos.

use rusqlite::params;
use crate::models::ReadingProgress;

pub fn upsert_progress(conn: &rusqlite::Connection, p: &ReadingProgress) -> crate::Result<()> {
    conn.execute(
        r#"
        INSERT INTO reading_progress (book_id, volume_id, current_chapter_id, page_index, scroll_offset, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ON CONFLICT(book_id, volume_id) DO UPDATE SET
            current_chapter_id = excluded.current_chapter_id,
            page_index = excluded.page_index,
            scroll_offset = excluded.scroll_offset,
            updated_at = excluded.updated_at
        "#,
        params![
            p.book_id,
            p.volume_id,
            p.current_chapter_id,
            p.page_index,
            p.scroll_offset,
            p.updated_at,
        ],
    )?;
    Ok(())
}

pub fn get_progress(
    conn: &rusqlite::Connection,
    book_id: &str,
    volume_id: &str,
) -> crate::Result<Option<ReadingProgress>> {
    let mut stmt = conn.prepare(
        r#"
        SELECT book_id, volume_id, current_chapter_id, page_index, scroll_offset, updated_at
        FROM reading_progress WHERE book_id = ?1 AND volume_id = ?2
        "#,
    )?;
    let mut rows = stmt.query(params![book_id, volume_id])?;
    if let Some(row) = rows.next()? {
        let r = row;
        return Ok(Some(ReadingProgress {
            book_id: r.get(0)?,
            volume_id: r.get(1)?,
            current_chapter_id: r.get(2)?,
            page_index: r.get(3)?,
            scroll_offset: r.get(4)?,
            updated_at: r.get(5)?,
        }));
    }
    Ok(None)
}
