/**
 * Serviço de Biblioteca — Scan de pastas/arquivos, persistência via SQLite (Tauri invoke).
 */

import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import * as db from "./dbService";
import type { BookWithVolumes } from "../types/db";
import type { LibraryBook, Volume, Chapter } from "../types/library";

const MEDIA_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "epub", "cbz", "zip", "rar"];

function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function isMediaFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext ? MEDIA_EXT.includes(ext) : false;
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").toLowerCase().trim();
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function scanFolder(dirPath: string): Promise<LibraryBook> {
  const entries = await readDir(dirPath, { recursive: false });

  const dirs = entries
    .filter((e) => e.isDirectory)
    .map((e) => e.name)
    .sort(naturalSort);

  const files = entries
    .filter((e) => e.isFile && isMediaFile(e.name))
    .map((e) => e.name)
    .sort(naturalSort);

  const title = dirPath.split(/[/\\]/).filter(Boolean).pop() ?? "Unknown";

  const volumes: Volume[] = [];

  if (dirs.length > 0) {
    // Subpastas = volumes
    for (const dirName of dirs) {
      const subPath = await join(dirPath, dirName);
      const subEntries = await readDir(subPath, { recursive: false });
      const chapterFiles = subEntries
        .filter((e) => e.isFile && isMediaFile(e.name))
        .map((e) => e.name)
        .sort(naturalSort);

      if (chapterFiles.length === 0) continue;

      const chapters: Chapter[] = await Promise.all(
        chapterFiles.map(async (fileName) => ({
          id: generateId(),
          name: fileName.replace(/\.[^.]+$/, ""),
          path: await join(subPath, fileName),
        }))
      );

      volumes.push({
        id: generateId(),
        name: dirName,
        chapters,
      });
    }

    if (volumes.length === 0) {
      throw new Error("empty_folder");
    }
  } else {
    // Sem subpastas = um volume com todos os arquivos
    if (files.length === 0) {
      throw new Error("empty_folder");
    }

    const chapters: Chapter[] = await Promise.all(
      files.map(async (fileName) => ({
        id: generateId(),
        name: fileName.replace(/\.[^.]+$/, ""),
        path: await join(dirPath, fileName),
      }))
    );

    volumes.push({
      id: generateId(),
      name: "Volume 1",
      chapters,
    });
  }

  const id = normalizePath(dirPath);

  return {
    id,
    title,
    path: dirPath.replace(/\\/g, "/"),
    type: "folder",
    volumes,
    addedAt: Date.now(),
  };
}

export function scanFile(filePath: string): LibraryBook {
  const name = filePath.split(/[/\\]/).filter(Boolean).pop() ?? "Unknown";
  const title = name.replace(/\.[^.]+$/, "");

  const chapter: Chapter = {
    id: generateId(),
    name: title,
    path: filePath.replace(/\\/g, "/"),
  };

  const volume: Volume = {
    id: generateId(),
    name: "Volume 1",
    chapters: [chapter],
  };

  return {
    id: normalizePath(filePath),
    title,
    path: filePath.replace(/\\/g, "/"),
    type: "file",
    volumes: [volume],
    addedAt: Date.now(),
  };
}

/** Converte resposta do backend (BookWithVolumes[]) para LibraryBook[]. */
function mapBookWithVolumesToLibraryBook(b: BookWithVolumes): LibraryBook {
  return {
    id: b.book.id,
    title: b.book.title,
    path: b.book.path,
    type: b.book.type as "folder" | "file",
    addedAt: b.book.added_at,
    volumes: b.volumes.map((v) => ({
      id: v.volume.id,
      name: v.volume.name,
      chapters: v.chapters.map((c) => ({ id: c.id, name: c.name, path: c.path })),
    })),
  };
}

/** Carrega a biblioteca do banco local (SQLite via Tauri). */
export async function loadLibrary(): Promise<LibraryBook[]> {
  try {
    const list = await db.getBooks();
    return list.map(mapBookWithVolumesToLibraryBook).sort((a, b) => b.addedAt - a.addedAt);
  } catch (e) {
    console.error("[libraryService] loadLibrary:", e);
    return [];
  }
}

/** Persiste um livro no banco (chamado ao adicionar). */
export async function persistBook(book: LibraryBook): Promise<void> {
  await db.addBook({
    book: {
      id: book.id,
      title: book.title,
      path: book.path,
      type: book.type,
      added_at: book.addedAt,
      hash: null,
    },
    volumes: book.volumes.map((v) => ({
      id: v.id,
      book_id: book.id,
      name: v.name,
      chapters: v.chapters.map((c, i) => ({
        id: c.id,
        volume_id: v.id,
        name: c.name,
        path: c.path,
        position: i,
      })),
    })),
  });
}

/** Remove um livro do banco. */
export async function removeBookFromBackend(bookId: string): Promise<void> {
  await db.deleteBook(bookId);
}

export function hasBookByPath(books: LibraryBook[], path: string): boolean {
  const norm = normalizePath(path);
  return books.some((b) => normalizePath(b.path) === norm);
}
