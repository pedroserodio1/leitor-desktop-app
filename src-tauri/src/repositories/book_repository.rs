//! Repositório de livros, volumes e capítulos.

use rusqlite::params;
use crate::models::{Book, Chapter, Volume};

pub fn insert_book(conn: &rusqlite::Connection, book: &Book) -> crate::Result<()> {
    conn.execute(
        r#"
        INSERT INTO books (id, title, path, type, added_at, hash)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        "#,
        params![
            book.id,
            book.title,
            book.path,
            book.book_type,
            book.added_at,
            book.hash,
        ],
    )?;
    Ok(())
}

pub fn insert_volume(conn: &rusqlite::Connection, volume: &Volume) -> crate::Result<()> {
    conn.execute(
        "INSERT INTO volumes (id, book_id, name) VALUES (?1, ?2, ?3)",
        params![volume.id, volume.book_id, volume.name],
    )?;
    Ok(())
}

pub fn insert_chapter(conn: &rusqlite::Connection, chapter: &Chapter) -> crate::Result<()> {
    conn.execute(
        r#"
        INSERT INTO chapters (id, volume_id, name, path, position)
        VALUES (?1, ?2, ?3, ?4, ?5)
        "#,
        params![
            chapter.id,
            chapter.volume_id,
            chapter.name,
            chapter.path,
            chapter.position,
        ],
    )?;
    Ok(())
}

pub fn list_books(conn: &rusqlite::Connection) -> crate::Result<Vec<Book>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, path, type, added_at, hash FROM books ORDER BY added_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            path: row.get(2)?,
            book_type: row.get(3)?,
            added_at: row.get(4)?,
            hash: row.get(5)?,
        })
    })?;
    let mut books = Vec::new();
    for row in rows {
        books.push(row?);
    }
    Ok(books)
}

pub fn list_volumes(conn: &rusqlite::Connection, book_id: &str) -> crate::Result<Vec<Volume>> {
    let mut stmt = conn.prepare(
        "SELECT id, book_id, name FROM volumes WHERE book_id = ?1 ORDER BY name",
    )?;
    let rows = stmt.query_map([book_id], |row| {
        Ok(Volume {
            id: row.get(0)?,
            book_id: row.get(1)?,
            name: row.get(2)?,
        })
    })?;
    let mut volumes = Vec::new();
    for row in rows {
        volumes.push(row?);
    }
    Ok(volumes)
}

pub fn list_chapters(conn: &rusqlite::Connection, volume_id: &str) -> crate::Result<Vec<Chapter>> {
    let mut stmt = conn.prepare(
        "SELECT id, volume_id, name, path, position FROM chapters WHERE volume_id = ?1 ORDER BY position",
    )?;
    let rows = stmt.query_map([volume_id], |row| {
        Ok(Chapter {
            id: row.get(0)?,
            volume_id: row.get(1)?,
            name: row.get(2)?,
            path: row.get(3)?,
            position: row.get(4)?,
        })
    })?;
    let mut chapters = Vec::new();
    for row in rows {
        chapters.push(row?);
    }
    Ok(chapters)
}

pub fn delete_book(conn: &rusqlite::Connection, book_id: &str) -> crate::Result<()> {
    conn.execute("DELETE FROM books WHERE id = ?1", [book_id])?;
    Ok(())
}
