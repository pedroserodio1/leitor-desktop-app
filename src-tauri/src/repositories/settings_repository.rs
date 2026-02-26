//! Repositório de configurações por livro e globais.

use rusqlite::params;
use crate::models::{BookSettings, GlobalSettings};

pub fn upsert_book_settings(conn: &rusqlite::Connection, s: &BookSettings) -> crate::Result<()> {
    conn.execute(
        r#"
        INSERT INTO book_settings (book_id, layout_mode, reading_direction, zoom, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5)
        ON CONFLICT(book_id) DO UPDATE SET
            layout_mode = excluded.layout_mode,
            reading_direction = excluded.reading_direction,
            zoom = excluded.zoom,
            updated_at = excluded.updated_at
        "#,
        params![
            s.book_id,
            s.layout_mode,
            s.reading_direction,
            s.zoom,
            s.updated_at,
        ],
    )?;
    Ok(())
}

pub fn get_book_settings(
    conn: &rusqlite::Connection,
    book_id: &str,
) -> crate::Result<Option<BookSettings>> {
    let mut stmt = conn.prepare(
        "SELECT book_id, layout_mode, reading_direction, zoom, updated_at FROM book_settings WHERE book_id = ?1",
    )?;
    let mut rows = stmt.query([book_id])?;
    if let Some(row) = rows.next()? {
        let r = row;
        return Ok(Some(BookSettings {
            book_id: r.get(0)?,
            layout_mode: r.get(1)?,
            reading_direction: r.get(2)?,
            zoom: r.get(3)?,
            updated_at: r.get(4)?,
        }));
    }
    Ok(None)
}

pub fn get_global_settings(conn: &rusqlite::Connection) -> crate::Result<GlobalSettings> {
    let mut stmt = conn.prepare(
        "SELECT id, theme, default_layout_mode, default_reading_direction, updated_at FROM global_settings WHERE id = 1",
    )?;
    let row = stmt.query_row([], |r| {
        Ok(GlobalSettings {
            id: r.get(0)?,
            theme: r.get(1)?,
            default_layout_mode: r.get(2)?,
            default_reading_direction: r.get(3)?,
            updated_at: r.get(4)?,
        })
    })?;
    Ok(row)
}

pub fn save_global_settings(conn: &rusqlite::Connection, s: &GlobalSettings) -> crate::Result<()> {
    conn.execute(
        r#"
        INSERT INTO global_settings (id, theme, default_layout_mode, default_reading_direction, updated_at)
        VALUES (1, ?1, ?2, ?3, ?4)
        ON CONFLICT(id) DO UPDATE SET
            theme = excluded.theme,
            default_layout_mode = excluded.default_layout_mode,
            default_reading_direction = excluded.default_reading_direction,
            updated_at = excluded.updated_at
        "#,
        params![
            s.theme,
            s.default_layout_mode,
            s.default_reading_direction,
            s.updated_at,
        ],
    )?;
    Ok(())
}
