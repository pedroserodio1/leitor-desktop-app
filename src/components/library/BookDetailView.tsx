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
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950">
      <header className="flex-shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={selectedVolume ? () => setSelectedVolume(null) : onBack}
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
      </header>

      <main className="flex-1 overflow-y-auto p-8">
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
