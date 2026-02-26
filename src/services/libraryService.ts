/**
 * Serviço de Biblioteca — Scan de pastas/arquivos, persistência via SQLite (Tauri invoke).
 */

import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import * as db from "./dbService";
import type { BookWithVolumes } from "../types/db";
import type { LibraryBook, Volume, Chapter } from "../types/library";

const MEDIA_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "epub", "cbz", "zip", "rar"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp"];

function getCoverPathFromBook(volumes: { chapters: { path: string }[] }[]): string | undefined {
  const firstChapterPath = volumes[0]?.chapters[0]?.path;
  if (!firstChapterPath) return undefined;
  const ext = firstChapterPath.split(".").pop()?.toLowerCase();
  return ext && IMAGE_EXT.includes(ext) ? firstChapterPath : undefined;
}

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
  const entries = await readDir(dirPath);

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
      const subEntries = await readDir(subPath);
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
  const coverPath = getCoverPathFromBook(volumes);

  return {
    id,
    title,
    path: dirPath.replace(/\\/g, "/"),
    type: "folder",
    volumes,
    addedAt: Date.now(),
    ...(coverPath && { coverPath }),
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

  const coverPath = getCoverPathFromBook([volume]);

  return {
    id: normalizePath(filePath),
    title,
    path: filePath.replace(/\\/g, "/"),
    type: "file",
    volumes: [volume],
    addedAt: Date.now(),
    ...(coverPath && { coverPath }),
  };
}

/** Converte resposta do backend (BookWithVolumes[]) para LibraryBook[]. */
function mapBookWithVolumesToLibraryBook(b: BookWithVolumes): LibraryBook {
  const volumes = b.volumes.map((v) => ({
    id: v.volume.id,
    name: v.volume.name,
    chapters: v.chapters.map((c) => ({ id: c.id, name: c.name, path: c.path })),
  }));
  const derivedCover = getCoverPathFromBook(volumes);
  const coverPath = b.book.cover_path ?? derivedCover;
  return {
    id: b.book.id,
    title: b.book.title,
    path: b.book.path,
    type: b.book.type as "folder" | "file",
    addedAt: b.book.added_at,
    volumes,
    ...(coverPath && { coverPath }),
    ...(b.book.author && { author: b.book.author }),
    ...(b.book.description && { description: b.book.description }),
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

export interface RecentProgressItem {
  book: LibraryBook;
  volume: { id: string; name: string; chapters: { path: string }[] };
  pageIndex: number;
  updatedAt: number;
}

/** Carrega itens "Continuar lendo" (progresso recente + dados do livro). */
export type BookProgressStatus = "not_started" | "reading" | "completed";

export function computeBooksWithProgress(
  books: LibraryBook[],
  allProgress: { book_id: string; volume_id: string; page_index: number }[]
): Map<string, { status: BookProgressStatus; progressPercent: number }> {
  const map = new Map<string, { status: BookProgressStatus; progressPercent: number }>();
  for (const book of books) {
    const volumeProgresses = allProgress.filter((p) => p.book_id === book.id);
    if (volumeProgresses.length === 0) {
      map.set(book.id, { status: "not_started", progressPercent: 0 });
      continue;
    }
    let totalPages = 0;
    let readPages = 0;
    let anyInProgress = false;
    let allCompleted = true;
    for (const v of book.volumes) {
      const total = v.chapters.length;
      totalPages += total;
      const p = volumeProgresses.find((x) => x.volume_id === v.id);
      if (p) {
        readPages += Math.min(p.page_index, total);
        if (p.page_index < total) {
          anyInProgress = true;
          allCompleted = false;
        }
      } else {
        allCompleted = false;
      }
    }
    const progressPercent = totalPages > 0 ? (readPages / totalPages) * 100 : 0;
    const status: BookProgressStatus = allCompleted
      ? "completed"
      : anyInProgress
        ? "reading"
        : "not_started";
    map.set(book.id, { status, progressPercent });
  }
  return map;
}

export function getBookFormat(book: LibraryBook): "images" | "pdf" | "epub" | "archive" | "other" {
  const path = book.volumes[0]?.chapters[0]?.path ?? "";
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext)) return "images";
  if (ext === "pdf") return "pdf";
  if (ext === "epub") return "epub";
  if (["cbz", "zip", "rar"].includes(ext)) return "archive";
  return "other";
}

export async function loadRecentProgress(limit: number): Promise<RecentProgressItem[]> {
  try {
    const [progressList, bookList] = await Promise.all([
      db.getRecentProgress(limit),
      db.getBooks(),
    ]);
    const bookMap = new Map(
      bookList.map((b) => [b.book.id, mapBookWithVolumesToLibraryBook(b)])
    );
    const result: RecentProgressItem[] = [];
    for (const p of progressList) {
      const book = bookMap.get(p.book_id);
      if (!book) continue;
      const volume = book.volumes.find((v) => v.id === p.volume_id);
      if (!volume) continue;
      const totalPages = volume.chapters.length;
      if (p.page_index >= totalPages) continue; // já concluído
      result.push({
        book,
        volume,
        pageIndex: p.page_index,
        updatedAt: p.updated_at,
      });
    }
    return result;
  } catch (e) {
    console.error("[libraryService] loadRecentProgress:", e);
    return [];
  }
}
