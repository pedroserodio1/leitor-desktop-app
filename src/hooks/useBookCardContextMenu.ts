import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { showContextMenu, type ContextMenuEntry } from "../utils/contextMenu";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type { LibraryBook } from "../types/library";
import type { Shelf } from "../services/dbService";

interface BookCardContextMenuCallbacks {
  onOpen: () => void;
  onRead?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  onMarkCompleted?: () => void | Promise<void>;
  onResetProgress?: () => void | Promise<void>;
  addToShelf?: (bookId: string, shelfId: string) => void | Promise<void>;
}

export function useBookCardContextMenu(
  book: LibraryBook,
  shelves: Shelf[],
  callbacks: BookCardContextMenuCallbacks,
  hasProgress?: boolean
) {
  const { t } = useTranslation();

  return useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const items: ContextMenuEntry[] = [
        {
          id: "open",
          text: t("context.open"),
          action: callbacks.onOpen,
        },
      ];

      if (callbacks.onRead) {
        items.push({
          id: "read",
          text: hasProgress ? t("context.continue_reading") : t("context.read"),
          action: callbacks.onRead,
        });
      }

      if (callbacks.onEdit) {
        items.push({
          id: "edit",
          text: t("context.edit"),
          action: callbacks.onEdit,
        });
      }

      items.push({
        id: "search_metadata",
        text: t("context.search_metadata"),
        action: () => {
          callbacks.onOpen();
          // Metadata search is triggered from BookDetailView; opening details is the first step
        },
      });

      if (callbacks.addToShelf && shelves.length > 0) {
        items.push({
          id: "add_to_shelf",
          text: t("context.add_to_shelf"),
          items: shelves.map((shelf) => ({
            id: `shelf-${shelf.id}`,
            text: shelf.name,
            action: () => callbacks.addToShelf!(book.id, shelf.id),
          })),
        });
      }

      items.push({
        id: "reveal",
        text: t("context.reveal_in_folder"),
        action: () => {
          revealItemInDir(book.path).catch(() => {});
        },
      });

      if (callbacks.onMarkCompleted) {
        items.push({
          id: "mark_completed",
          text: t("context.mark_completed"),
          action: () => void callbacks.onMarkCompleted!(),
        });
      }

      if (callbacks.onResetProgress && hasProgress) {
        items.push({
          id: "reset_progress",
          text: t("context.reset_progress"),
          action: () => void callbacks.onResetProgress!(),
        });
      }

      if (callbacks.onRemove) {
        items.push({
          id: "remove",
          text: t("context.remove"),
          action: callbacks.onRemove,
        });
      }

      showContextMenu(items, e.clientX, e.clientY).catch(() => {});
    },
    [
      book.id,
      book.path,
      shelves,
      callbacks,
      hasProgress,
      t,
    ]
  );
}
