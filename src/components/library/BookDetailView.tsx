import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, FileText, ChevronRight } from "lucide-react";
import type { LibraryBook, Volume, Chapter } from "../../types/library";

interface BookDetailViewProps {
  book: LibraryBook;
  onBack: () => void;
  onRead: (paths: string[], title: string) => void;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
  book,
  onBack,
  onRead,
}) => {
  const { t } = useTranslation();
  const [selectedVolume, setSelectedVolume] = useState<Volume | null>(null);

  const hasMultipleVolumes = book.volumes.length > 1;
  const currentChapters = selectedVolume?.chapters ?? book.volumes[0]?.chapters ?? [];

  const handleVolumeClick = (volume: Volume) => {
    if (hasMultipleVolumes) {
      setSelectedVolume(volume);
    }
  };

  const handleChapterClick = (chapter: Chapter, volume: Volume) => {
    onRead([chapter.path], chapter.name);
  };

  const handleReadVolume = (volume: Volume) => {
    const paths = volume.chapters.map((c) => c.path);
    onRead(paths, volume.name);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-4 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          type="button"
          onClick={selectedVolume ? () => setSelectedVolume(null) : onBack}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {book.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {selectedVolume
              ? selectedVolume.name
              : hasMultipleVolumes
                ? t("library.book_detail.select_volume")
                : t("library.book_detail.chapters")}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {!selectedVolume && hasMultipleVolumes ? (
          /* Lista de volumes */
          <div className="space-y-2">
            {book.volumes.map((volume) => (
              <button
                key={volume.id}
                type="button"
                onClick={() => handleVolumeClick(volume)}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand/50 dark:hover:border-brand/50 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <BookOpen className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {volume.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t("library.book_detail.chapters_count", {
                        count: volume.chapters.length,
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          /* Lista de capítulos */
          <div className="space-y-3">
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
                      className="w-full flex items-center gap-4 p-4 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/30 hover:bg-brand/20 dark:hover:bg-brand/30 transition-colors text-left"
                    >
                      <BookOpen className="w-6 h-6 text-brand shrink-0" />
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
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand/50 dark:hover:border-brand/50 transition-colors text-left"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                          <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {chapter.name}
                        </p>
                        <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 ml-auto" />
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
