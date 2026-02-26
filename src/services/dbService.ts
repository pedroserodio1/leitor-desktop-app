/**
 * Serviço de persistência local — todas as interações com o banco via invoke (Tauri).
 * Não acessa SQLite diretamente no frontend.
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  AddBookPayload,
  BookSettings,
  BookWithVolumes,
  GlobalSettings,
  ReadingProgress,
  SaveGlobalSettingsPayload,
  UpdateBookPayload,
} from "../types/db";

export async function addBook(payload: AddBookPayload): Promise<void> {
  await invoke("add_book", { payload });
}

export async function getBooks(): Promise<BookWithVolumes[]> {
  return invoke<BookWithVolumes[]>("get_books");
}

export async function deleteBook(bookId: string): Promise<void> {
  await invoke("delete_book", { bookId });
}

export async function updateBook(payload: UpdateBookPayload): Promise<void> {
  await invoke("update_book", { payload });
}

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  await invoke("save_progress", { progress });
}

export async function getProgress(
  bookId: string,
  volumeId: string
): Promise<ReadingProgress | null> {
  return invoke<ReadingProgress | null>("get_progress", { bookId, volumeId });
}

export async function getRecentProgress(limit: number): Promise<ReadingProgress[]> {
  return invoke<ReadingProgress[]>("get_recent_progress", { limit });
}

export async function getAllProgress(): Promise<ReadingProgress[]> {
  return invoke<ReadingProgress[]>("get_all_progress");
}

export interface Shelf {
  id: string;
  name: string;
}

export async function listShelves(): Promise<Shelf[]> {
  return invoke<Shelf[]>("list_shelves");
}

export async function createShelf(id: string, name: string): Promise<void> {
  await invoke("create_shelf", { id, name });
}

export async function addBookToShelf(
  bookId: string,
  shelfId: string
): Promise<void> {
  await invoke("add_book_to_shelf", { bookId, shelfId });
}

export async function removeBookFromShelf(
  bookId: string,
  shelfId: string
): Promise<void> {
  await invoke("remove_book_from_shelf", { bookId, shelfId });
}

export async function getBookShelfIds(bookId: string): Promise<string[]> {
  return invoke<string[]>("get_book_shelf_ids", { bookId });
}

export async function getBooksInShelf(shelfId: string): Promise<string[]> {
  return invoke<string[]>("get_books_in_shelf", { shelfId });
}

export async function saveBookSettings(settings: BookSettings): Promise<void> {
  await invoke("save_book_settings", { settings });
}

export async function getBookSettings(
  bookId: string
): Promise<BookSettings | null> {
  return invoke<BookSettings | null>("get_book_settings", { bookId });
}

export async function getGlobalSettings(): Promise<GlobalSettings> {
  return invoke<GlobalSettings>("get_global_settings");
}

export async function saveGlobalSettings(
  payload: SaveGlobalSettingsPayload
): Promise<void> {
  await invoke("save_global_settings", { payload });
}
