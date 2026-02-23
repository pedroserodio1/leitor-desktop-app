/**
 * Serviço de Biblioteca — Scan de pastas/arquivos, persistência
 *
 * Persistência temporária em localStorage.
 * Futuramente: SQLite, metadados, SHA-256, geração de capa.
 */

import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { LibraryBook, Volume, Chapter } from "../types/library";

const STORAGE_KEY = "library-books";
const MEDIA_EXT = ["jpg", "jpeg", "png", "webp", "pdf", "epub"];

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

export function loadLibrary(): LibraryBook[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLibrary(books: LibraryBook[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function hasBookByPath(books: LibraryBook[], path: string): boolean {
  const norm = normalizePath(path);
  return books.some((b) => normalizePath(b.path) === norm);
}
