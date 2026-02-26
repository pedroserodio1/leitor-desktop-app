/**
 * Hook useLibrary — Estado da biblioteca, adicionar/remover livros (persistência via SQLite).
 */

import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  scanFolder,
  scanFile,
  loadLibrary,
  loadRecentProgress,
  persistBook,
  removeBookFromBackend,
  hasBookByPath,
  computeBooksWithProgress,
} from "../services/libraryService";
import * as db from "../services/dbService";
import type { LibraryBook } from "../types/library";

const RECENT_LIMIT = 5;

export function useLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [recentProgress, setRecentProgress] = useState<
    Awaited<ReturnType<typeof loadRecentProgress>>
  >([]);
  const [allProgress, setAllProgress] = useState<{ book_id: string; volume_id: string; page_index: number }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const refresh = useCallback(async () => {
    const [list, recent, progress] = await Promise.all([
      loadLibrary(),
      loadRecentProgress(RECENT_LIMIT),
      db.getAllProgress(),
    ]);
    setBooks(list);
    setRecentProgress(recent);
    setAllProgress(progress);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addBook = useCallback(async (book: LibraryBook) => {
    if (hasBookByPath(books, book.path)) return;
    try {
      await persistBook(book);
      const next = [...books, book].sort((a, b) => b.addedAt - a.addedAt);
      setBooks(next);
      Promise.all([
        loadRecentProgress(RECENT_LIMIT),
        db.getAllProgress(),
      ]).then(([recent, progress]) => {
        setRecentProgress(recent);
        setAllProgress(progress);
      });
    } catch (e) {
      console.error("[useLibrary] persistBook:", e);
      setError("import_error");
    }
  }, [books]);

  const removeBook = useCallback(async (id: string) => {
    try {
      await removeBookFromBackend(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error("[useLibrary] removeBook:", e);
    }
  }, []);

  const addFromFolder = useCallback(async (): Promise<LibraryBook | null> => {
    setError(null);
    setIsImporting(true);
    try {
      const result = await open({ directory: true, multiple: false });

      if (!result || (Array.isArray(result) && result.length === 0)) {
        return null;
      }

      const dirPath = typeof result === "string" ? result : result[0];
      if (!dirPath) return null;

      const book = await scanFolder(dirPath);

      if (hasBookByPath(books, book.path)) {
        setError("duplicate");
        return null;
      }

      await addBook(book);
      return book;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);
      if (message === "empty_folder") {
        setError("empty_folder");
      } else {
        setError("import_error");
        console.error("[useLibrary] addFromFolder error:", err);
      }
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [books, addBook]);

  const addFromFile = useCallback(async (): Promise<LibraryBook | null> => {
    setError(null);
    setIsImporting(true);
    try {
      const result = await open({
        multiple: false,
        filters: [
          {
            name: "Livros, arquivos e imagens",
            extensions: ["jpg", "jpeg", "png", "webp", "pdf", "epub", "cbz", "zip", "rar"],
          },
        ],
      });

      if (!result) return null;

      const filePath = typeof result === "string" ? result : result[0];
      if (!filePath) return null;

      const book = scanFile(filePath);

      if (hasBookByPath(books, book.path)) {
        setError("duplicate");
        return null;
      }

      await addBook(book);
      return book;
    } catch (err) {
      setError("import_error");
      console.error("[useLibrary] addFromFile error:", err);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [books, addBook]);

  const clearError = useCallback(() => setError(null), []);

  const progressMap = computeBooksWithProgress(books, allProgress);

  return {
    books,
    recentProgress,
    progressMap,
    loaded,
    addBook,
    removeBook,
    addFromFolder,
    addFromFile,
    refresh,
    error,
    clearError,
    isImporting,
  };
}
