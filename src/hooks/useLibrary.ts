/**
 * Hook useLibrary — Estado da biblioteca, adicionar/remover livros (persistência via SQLite).
 */

import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  scanFolder,
  scanFile,
  loadLibrary,
  persistBook,
  removeBookFromBackend,
  hasBookByPath,
} from "../services/libraryService";
import type { LibraryBook } from "../types/library";

export function useLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    loadLibrary().then((list) => {
      setBooks(list);
      setLoaded(true);
    });
  }, []);

  const addBook = useCallback(async (book: LibraryBook) => {
    if (hasBookByPath(books, book.path)) return;
    try {
      await persistBook(book);
      setBooks((prev) => [...prev, book].sort((a, b) => b.addedAt - a.addedAt));
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

  return {
    books,
    loaded,
    addBook,
    removeBook,
    addFromFolder,
    addFromFile,
    error,
    clearError,
    isImporting,
  };
}
