/**
 * Hook useShelves — Estado das estantes e associações.
 */

import { useState, useCallback, useEffect } from "react";
import * as db from "../services/dbService";

const DEFAULT_SHELVES = [
  { id: "reading", name: "Lendo" },
  { id: "want", name: "Quero ler" },
  { id: "favorites", name: "Favoritos" },
];

export function useShelves() {
  const [shelves, setShelves] = useState<db.Shelf[]>([]);
  const [bookShelfIds, setBookShelfIds] = useState<Map<string, string[]>>(new Map());

  const refresh = useCallback(async () => {
    const list = await db.listShelves();
    if (list.length === 0) {
      for (const s of DEFAULT_SHELVES) {
        try {
          await db.createShelf(s.id, s.name);
        } catch {
          // ignore if exists
        }
      }
      const again = await db.listShelves();
      setShelves(again);
    } else {
      setShelves(list);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loadBookShelfIds = useCallback(async (bookId: string) => {
    const ids = await db.getBookShelfIds(bookId);
    setBookShelfIds((prev) => new Map(prev).set(bookId, ids));
    return ids;
  }, []);

  const addToShelf = useCallback(
    async (bookId: string, shelfId: string) => {
      await db.addBookToShelf(bookId, shelfId);
      const ids = await db.getBookShelfIds(bookId);
      setBookShelfIds((prev) => new Map(prev).set(bookId, ids));
    },
    []
  );

  const removeFromShelf = useCallback(
    async (bookId: string, shelfId: string) => {
      await db.removeBookFromShelf(bookId, shelfId);
      const ids = await db.getBookShelfIds(bookId);
      setBookShelfIds((prev) => new Map(prev).set(bookId, ids));
    },
    []
  );

  const createShelf = useCallback(async (id: string, name: string) => {
    await db.createShelf(id, name);
    await refresh();
  }, [refresh]);

  return {
    shelves,
    bookShelfIds,
    loadBookShelfIds,
    addToShelf,
    removeFromShelf,
    createShelf,
    refresh,
  };
}
