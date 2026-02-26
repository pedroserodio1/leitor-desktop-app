import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ArrowLeft, BookOpen, FileText, ChevronRight, Bookmark, Pencil, Book, Trash2, CheckCircle, RotateCcw, Check } from "lucide-react";
import { useShelves } from "../../hooks/useShelves";
import { saveProgress } from "../../services/dbService";
import type { LibraryBook, Volume, Chapter } from "../../types/library";

interface BookDetailViewProps {
  book: LibraryBook;
  onBack: () => void;
  onRead: (paths: string[], title: string, bookId: string, volumeId: string) => void;
  onEdit?: () => void;
  onRemove?: (bookId: string) => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  onBack,
  onRead,
  onEdit,
  onRemove,
}) => {
  const { t } = useTranslation();
  const { shelves, bookShelfIds, loadBookShelfIds, addToShelf, removeFromShelf } = useShelves();
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);
  const [showShelfMenu, setShowShelfMenu] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const shelfMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBookShelfIds(book.id);
  }, [book.id, loadBookShelfIds]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showShelfMenu && shelfMenuRef.current && !shelfMenuRef.current.contains(e.target as Node)) {
        setShowShelfMenu(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showShelfMenu]);

  const currentShelfIds = bookShelfIds.get(book.id) ?? [];

  const hasMultipleVolumes = book.volumes.length > 1;
  const currentChapters = selectedVolume?.chapters ?? book.volumes[0]?.chapters ?? [];

  const handleVolumeClick = (volume: Volume) => {
    if (hasMultipleVolumes) {
      setSelectedVolume(volume);
    }
  };

  const handleChapterClick = (chapter: Chapter, volume: Volume) => {
    onRead([chapter.path], chapter.name, book.id, volume.id);
  };

  const handleReadVolume = (volume: Volume) => {
    const paths = volume.chapters.map((c) => c.path);
    onRead(paths, volume.name, book.id, volume.id);
  };

  const handleMarkCompleted = async () => {
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
  };

  const handleResetProgress = async () => {
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
  };

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950" data-testid="book-detail-view">
      <header className="flex-shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={selectedVolume ? () => setSelectedVolume(null) : onBack}
          data-testid="btn-back"
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100 truncate">
            {book.title}
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            {selectedVolume
              ? selectedVolume.name
              : hasMultipleVolumes
                ? t("library.book_detail.select_volume")
                : t("library.book_detail.chapters")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              data-testid="btn-edit-book"
              className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
              title={t("library.book_detail.edit")}
            >
              <Pencil className="w-5 h-5" strokeWidth={1.75} />
            </button>
          )}
          <div className="relative" ref={shelfMenuRef}>
            <button
              type="button"
              onClick={() => setShowShelfMenu((s) => !s)}
              className={`p-2.5 rounded-xl transition-colors ${showShelfMenu ? "bg-brand/15 dark:bg-brand/25 text-brand" : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"}`}
              title={t("library.add_to_shelf")}
            >
              <Bookmark className="w-5 h-5" strokeWidth={1.75} />
            </button>
            {showShelfMenu && (
              <div className="absolute right-0 top-full mt-2 py-2 min-w-[200px] rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                    {t("library.add_to_shelf")}
                  </p>
                </div>
                {shelves.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-stone-500 dark:text-stone-400">{t("library.no_shelves", "Nenhuma estante")}</p>
                ) : (
                  shelves.map((shelf) => {
                    const isIn = currentShelfIds.includes(shelf.id);
                    return (
                      <button
                        key={shelf.id}
                        type="button"
                        onClick={async () => {
                          if (isIn) await removeFromShelf(book.id, shelf.id);
                          else await addToShelf(book.id, shelf.id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${isIn ? "bg-brand/10 dark:bg-brand/20 text-brand" : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/80"}`}
                      >
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${isIn ? "bg-brand text-white" : "border-2 border-stone-300 dark:border-stone-600"}`}>
                          {isIn && <Check className="w-3 h-3" strokeWidth={3} />}
                        </span>
                        <Bookmark className="w-4 h-4 text-stone-400" strokeWidth={1.75} />
                        {shelf.name}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {!selectedVolume && (
          <div className="flex flex-col sm:flex-row gap-8 max-w-4xl mb-8">
            <div className="shrink-0 w-36 sm:w-48">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                {book.coverPath ? (
                  <img
                    src={convertFileSrc(book.coverPath)}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Book className="w-16 h-16 text-stone-400 dark:text-stone-500" strokeWidth={1.25} />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <h2 className="font-heading text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {book.title}
              </h2>
              {book.author ? (
                <p className="text-stone-600 dark:text-stone-300">{book.author}</p>
              ) : onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-sm text-stone-400 dark:text-stone-500 hover:text-brand transition-colors"
                >
                  {t("library.book_detail.add_author")}
                </button>
              )}
              {book.description ? (
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-4">
                  {book.description}
                </p>
              ) : onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-sm text-stone-400 dark:text-stone-500 hover:text-brand transition-colors"
                >
                  {t("library.book_detail.add_description")}
                </button>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" strokeWidth={1.75} />
                  {t("library.book_detail.mark_completed")}
                </button>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                  {t("library.book_detail.reset_progress")}
                </button>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    {t("library.book_detail.remove_from_library")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showRemoveConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-md"
            onClick={(e) => e.target === e.currentTarget && setShowRemoveConfirm(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="remove-confirm-title"
              className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 mx-4 overflow-hidden"
            >
              <div className="p-6">
                <h2 id="remove-confirm-title" className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                  {t("library.book_detail.remove_confirm_title")}
                </h2>
                <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
                  {t("library.book_detail.remove_confirm_message")}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    {t("library.book_detail.remove_confirm_no")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onRemove?.(book.id);
                      setShowRemoveConfirm(false);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  >
                    {t("library.book_detail.remove_confirm_yes")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedVolume && hasMultipleVolumes ? (
          <div className="space-y-3 max-w-xl">
            {book.volumes.map((volume) => (
              <button
                key={volume.id}
                type="button"
                onClick={() => handleVolumeClick(volume)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-brand/30 dark:hover:border-brand/30 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800">
                    <BookOpen className="w-6 h-6 text-brand" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">
                      {volume.name}
                    </p>
                    <p className="text-sm text-stone-500 dark:text-stone-400">
                      {t("library.book_detail.chapters_count", {
                        count: volume.chapters.length,
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-stone-400 shrink-0" strokeWidth={2} />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl">
            {(() => {
              const volume = selectedVolume ?? book.volumes[0];
              const ext = volume.chapters[0]?.path.split(".").pop()?.toLowerCase() ?? "";
              const isImage = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext);
              const showReadVolume = volume.chapters.length > 1 && isImage;

              return (
                <>
                  {showReadVolume && (
                    <button
                      type="button"
                      onClick={() => handleReadVolume(volume)}
                      data-testid="btn-read-volume"
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-brand/10 dark:bg-brand/20 border border-brand/20 hover:bg-brand/15 dark:hover:bg-brand/25 transition-colors text-left"
                    >
                      <BookOpen className="w-6 h-6 text-brand shrink-0" strokeWidth={1.5} />
                      <p className="font-medium text-brand">
                        {t("library.book_detail.read_entire_volume")}
                      </p>
                    </button>
                  )}
                  <div className="space-y-2">
                    {currentChapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        onClick={() => handleChapterClick(chapter, volume)}
                        data-testid={`chapter-${chapter.id}`}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 hover:border-brand/30 dark:hover:border-brand/30 transition-all duration-200 text-left"
                      >
                        <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800 shrink-0">
                          <FileText className="w-5 h-5 text-stone-500 dark:text-stone-400" strokeWidth={1.5} />
                        </div>
                        <p className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {chapter.name}
                        </p>
                        <ChevronRight className="w-5 h-5 text-stone-400 shrink-0 ml-auto" strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
};
