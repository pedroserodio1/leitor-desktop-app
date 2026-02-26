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

export async function saveProgress(progress: ReadingProgress): Promise<void> {
  await invoke("save_progress", { progress });
}

export async function getProgress(
  bookId: string,
  volumeId: string
): Promise<ReadingProgress | null> {
  return invoke<ReadingProgress | null>("get_progress", { bookId, volumeId });
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
