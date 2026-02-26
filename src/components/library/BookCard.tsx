import React from "react";
import { useTranslation } from "react-i18next";
import { Book } from "lucide-react";
import type { LibraryBook } from "../../types/library";

interface BookCardProps {
  book: LibraryBook;
  onClick: () => void;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const { t } = useTranslation();
  const volumeCount = book.volumes.length;
  const volumeLabel =
    volumeCount === 1
      ? t("library.volumes_count", { count: volumeCount })
      : t("library.volumes_count_plural", { count: volumeCount });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-2xl overflow-hidden bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-brand/40 dark:hover:border-brand/40 hover:shadow-xl hover:shadow-stone-200/50 dark:hover:shadow-black/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-stone-50 dark:focus:ring-offset-stone-950"
    >
      <div className="aspect-[3/4] bg-gradient-to-br from-stone-300 to-stone-400 dark:from-stone-700 dark:to-stone-800 flex items-center justify-center">
        <Book className="w-20 h-20 text-white/70 dark:text-white/50 group-hover:scale-105 transition-transform duration-300" strokeWidth={1.25} />
      </div>

      <div className="p-4">
        <p className="font-heading font-medium text-stone-900 dark:text-stone-100 truncate text-[15px] leading-snug">
          {book.title}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {volumeLabel}
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
          {t("library.added_at", { date: formatDate(book.addedAt) })}
        </p>
      </div>
    </button>
  );
};
