//! Repositório de temas personalizados.

use crate::models::CustomTheme;
use rusqlite::params;

pub fn list_custom_themes(conn: &rusqlite::Connection) -> crate::Result<Vec<CustomTheme>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, css, updated_at FROM custom_themes ORDER BY name",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(CustomTheme {
            id: row.get(0)?,
            name: row.get(1)?,
            css: row.get(2)?,
            updated_at: row.get(3)?,
        })
    })?;
    let mut themes = Vec::new();
    for row in rows {
        themes.push(row?);
    }
    Ok(themes)
}

pub fn get_custom_theme(conn: &rusqlite::Connection, id: &str) -> crate::Result<Option<CustomTheme>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, css, updated_at FROM custom_themes WHERE id = ?1",
    )?;
    let mut rows = stmt.query([id])?;
    if let Some(row) = rows.next()? {
        return Ok(Some(CustomTheme {
            id: row.get(0)?,
            name: row.get(1)?,
            css: row.get(2)?,
            updated_at: row.get(3)?,
        }));
    }
    Ok(None)
}

pub fn insert_custom_theme(conn: &rusqlite::Connection, t: &CustomTheme) -> crate::Result<()> {
    conn.execute(
        "INSERT INTO custom_themes (id, name, css, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![t.id, t.name, t.css, t.updated_at],
    )?;
    Ok(())
}

pub fn update_custom_theme(conn: &rusqlite::Connection, t: &CustomTheme) -> crate::Result<()> {
    conn.execute(
        "UPDATE custom_themes SET name = ?1, css = ?2, updated_at = ?3 WHERE id = ?4",
        params![t.name, t.css, t.updated_at, t.id],
    )?;
    Ok(())
}

pub fn delete_custom_theme(conn: &rusqlite::Connection, id: &str) -> crate::Result<()> {
    conn.execute("DELETE FROM custom_themes WHERE id = ?1", [id])?;
    Ok(())
}
