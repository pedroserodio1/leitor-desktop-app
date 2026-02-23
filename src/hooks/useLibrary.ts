/**
 * Hook useLibrary — Estado da biblioteca, adicionar/remover livros
 */

import { useState, useCallback, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import {
  scanFolder,
  scanFile,
  loadLibrary,
  saveLibrary,
  hasBookByPath,
} from "../services/libraryService";
import type { LibraryBook } from "../types/library";

export function useLibrary() {
  const [books, setBooks] = useState<LibraryBook[]>(() => loadLibrary());
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    saveLibrary(books);
  }, [books]);

  const addBook = useCallback((book: LibraryBook) => {
    setBooks((prev) => {
      if (hasBookByPath(prev, book.path)) return prev;
      return [...prev, book].sort((a, b) => b.addedAt - a.addedAt);
    });
  }, []);

  const removeBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
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

      addBook(book);
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
            name: "Livros e Imagens",
            extensions: ["jpg", "jpeg", "png", "webp", "pdf", "epub"],
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

      addBook(book);
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
    addBook,
    removeBook,
    addFromFolder,
    addFromFile,
    error,
    clearError,
    isImporting,
  };
}
