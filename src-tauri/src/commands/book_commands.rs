//! Tauri commands para livros (add, list, delete).

use serde::Deserialize;
use tauri::AppHandle;

use crate::db;
use crate::models::{Book, Chapter, Volume};
use crate::repositories;

#[derive(Debug, Deserialize)]
pub struct VolumeWithChapters {
    pub id: String,
    pub book_id: String,
    pub name: String,
    pub chapters: Vec<ChapterPayload>,
}

#[derive(Debug, Deserialize)]
pub struct ChapterPayload {
    pub id: String,
    pub volume_id: String,
    pub name: String,
    pub path: String,
    pub position: i32,
}

#[derive(Debug, Deserialize)]
pub struct AddBookPayload {
    pub book: BookPayload,
    pub volumes: Vec<VolumeWithChapters>,
}

#[derive(Debug, Deserialize)]
pub struct BookPayload {
    pub id: String,
    pub title: String,
    pub path: String,
    #[serde(rename = "type")]
    pub book_type: String,
    pub added_at: i64,
    pub hash: Option<String>,
}

#[tauri::command]
pub fn add_book(app: AppHandle, payload: AddBookPayload) -> crate::Result<()> {
    let conn = db::open(&app)?;
    let book = Book {
        id: payload.book.id.clone(),
        title: payload.book.title,
        path: payload.book.path,
        book_type: payload.book.book_type,
        added_at: payload.book.added_at,
        hash: payload.book.hash,
    };
    repositories::insert_book(&conn, &book)?;
    for v in &payload.volumes {
        let volume = Volume {
            id: v.id.clone(),
            book_id: v.book_id.clone(),
            name: v.name.clone(),
        };
        repositories::insert_volume(&conn, &volume)?;
        for (_idx, c) in v.chapters.iter().enumerate() {
            let position = c.position;
            let chapter = Chapter {
                id: c.id.clone(),
                volume_id: c.volume_id.clone(),
                name: c.name.clone(),
                path: c.path.clone(),
                position,
            };
            repositories::insert_chapter(&conn, &chapter)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_books(app: AppHandle) -> crate::Result<Vec<BookWithVolumes>> {
    let conn = db::open(&app)?;
    let books = repositories::list_books(&conn)?;
    let mut result = Vec::with_capacity(books.len());
    for book in books {
        let volumes = repositories::list_volumes(&conn, &book.id)?;
        let mut volumes_with_chapters = Vec::with_capacity(volumes.len());
        for vol in volumes {
            let chapters = repositories::list_chapters(&conn, &vol.id)?;
            volumes_with_chapters.push(VolumeWithChaptersOut {
                volume: vol,
                chapters,
            });
        }
        result.push(BookWithVolumes {
            book,
            volumes: volumes_with_chapters,
        });
    }
    Ok(result)
}

#[derive(serde::Serialize)]
pub struct BookWithVolumes {
    pub book: Book,
    pub volumes: Vec<VolumeWithChaptersOut>,
}

#[derive(serde::Serialize)]
pub struct VolumeWithChaptersOut {
    pub volume: Volume,
    pub chapters: Vec<Chapter>,
}

#[tauri::command]
pub fn delete_book(app: AppHandle, book_id: String) -> crate::Result<()> {
    let conn = db::open(&app)?;
    repositories::delete_book(&conn, &book_id)?;
    Ok(())
}
