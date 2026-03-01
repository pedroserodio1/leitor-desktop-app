//! Repositório de estantes (shelves) e associações book_shelves.

use crate::models::Shelf;
use rusqlite::params;

pub fn list_shelves(conn: &rusqlite::Connection) -> crate::Result<Vec<Shelf>> {
    let mut stmt = conn.prepare("SELECT id, name FROM shelves ORDER BY name")?;
    let rows = stmt.query_map([], |row| {
        Ok(Shelf {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    })?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}

pub fn create_shelf(conn: &rusqlite::Connection, id: &str, name: &str) -> crate::Result<()> {
    conn.execute(
        "INSERT INTO shelves (id, name) VALUES (?1, ?2)",
        params![id, name],
    )?;
    Ok(())
}

pub fn add_book_to_shelf(
    conn: &rusqlite::Connection,
    book_id: &str,
    shelf_id: &str,
) -> crate::Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO book_shelves (book_id, shelf_id) VALUES (?1, ?2)",
        params![book_id, shelf_id],
    )?;
    Ok(())
}

pub fn remove_book_from_shelf(
    conn: &rusqlite::Connection,
    book_id: &str,
    shelf_id: &str,
) -> crate::Result<()> {
    conn.execute(
        "DELETE FROM book_shelves WHERE book_id = ?1 AND shelf_id = ?2",
        params![book_id, shelf_id],
    )?;
    Ok(())
}

pub fn get_book_shelf_ids(
    conn: &rusqlite::Connection,
    book_id: &str,
) -> crate::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT shelf_id FROM book_shelves WHERE book_id = ?1")?;
    let rows = stmt.query_map([book_id], |row| row.get::<_, String>(0))?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}

pub fn get_books_in_shelf(
    conn: &rusqlite::Connection,
    shelf_id: &str,
) -> crate::Result<Vec<String>> {
    let mut stmt = conn.prepare("SELECT book_id FROM book_shelves WHERE shelf_id = ?1")?;
    let rows = stmt.query_map([shelf_id], |row| row.get::<_, String>(0))?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row?);
    }
    Ok(out)
}
