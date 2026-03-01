import React, { useCallback } from "react";
import { BookCard } from "./BookCard";
import { useBookCardContextMenu } from "../../hooks/useBookCardContextMenu";
import { saveProgress } from "../../services/dbService";
import type { LibraryBook } from "../../types/library";
import type { Shelf } from "../../services/dbService";

interface BookCardWithContextMenuProps {
  book: LibraryBook;
  shelves: Shelf[];
  onOpen: () => void;
  onRead?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onProgressChanged?: () => void | Promise<void>;
  addToShelf?: (bookId: string, shelfId: string) => void | Promise<void>;
  progressPercent?: number;
}

export const BookCardWithContextMenu: React.FC<BookCardWithContextMenuProps> = ({
  book,
  shelves,
  onOpen,
  onRead,
  onEdit,
  onRemove,
  onProgressChanged,
  addToShelf,
  progressPercent,
}) => {
  const hasProgress = (progressPercent ?? 0) > 0;

  const onMarkCompleted = useCallback(async () => {
    for (const vol of book.volumes) {
      await saveProgress({
        book_id: book.id,
        volume_id: vol.id,
        current_chapter_id: null,
        page_index: vol.chapters.length,
        scroll_offset: 0,
        updated_at: Date.now(),
      });
    }
    onProgressChanged?.();
  }, [book, onProgressChanged]);

  const onResetProgress = useCallback(async () => {
    for (const vol of book.volumes) {
      await saveProgress({
        book_id: book.id,
        volume_id: vol.id,
        current_chapter_id: null,
        page_index: 1,
        scroll_offset: 0,
        updated_at: Date.now(),
      });
    }
    onProgressChanged?.();
  }, [book, onProgressChanged]);

  const onContextMenu = useBookCardContextMenu(
    book,
    shelves,
    {
      onOpen,
      onRead,
      onEdit,
      onRemove,
      onMarkCompleted,
      onResetProgress,
      addToShelf,
    },
    hasProgress
  );

  return (
    <BookCard
      book={book}
      onClick={onOpen}
      progressPercent={progressPercent}
      onContextMenu={onContextMenu}
    />
  );
};
