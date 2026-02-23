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
      className="group w-full text-left rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand/50 dark:hover:border-brand/50 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950"
    >
      {/* Capa placeholder */}
      <div className="aspect-[3/4] bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
        <Book className="w-16 h-16 text-white/60 dark:text-white/40 group-hover:scale-110 transition-transform duration-200" />
      </div>

      <div className="p-3">
        <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
          {book.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {volumeLabel}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {t("library.added_at", { date: formatDate(book.addedAt) })}
        </p>
      </div>
    </button>
  );
};
