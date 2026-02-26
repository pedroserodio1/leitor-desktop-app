import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Library as LibraryIcon, Plus, Settings } from "lucide-react";
import { BookCard } from "./BookCard";
import { AddBookModal } from "./AddBookModal";
import { useLibrary } from "../../hooks/useLibrary";
import type { LibraryBook } from "../../types/library";

interface LibraryViewProps {
  onSelectBook: (book: LibraryBook) => void;
  onOpenSettings?: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectBook, onOpenSettings }) => {
  const { t } = useTranslation();
  const {
    books,
    addFromFolder,
    addFromFile,
    error,
    clearError,
    isImporting,
  } = useLibrary();

  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectFolder = useCallback(async () => {
    const book = await addFromFolder();
    if (book) {
      setModalOpen(false);
    }
  }, [addFromFolder]);

  const handleSelectFile = useCallback(async () => {
    const book = await addFromFile();
    if (book) {
      setModalOpen(false);
    }
  }, [addFromFile]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    clearError();
  }, [clearError]);

  return (
    <div className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950">
      <header className="shrink-0 flex items-center justify-between px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-brand/10 dark:bg-brand/20">
            <LibraryIcon className="w-7 h-7 text-brand" strokeWidth={1.75} />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            {t("library.title")}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition-colors"
              title={t("library.app_settings")}
              aria-label={t("library.app_settings")}
            >
              <Settings className="w-6 h-6" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all duration-200"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            {t("library.add_book")}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-28 h-28 rounded-3xl bg-stone-200/80 dark:bg-stone-800/80 flex items-center justify-center mb-6 shadow-inner">
              <LibraryIcon className="w-14 h-14 text-stone-400 dark:text-stone-500" strokeWidth={1.25} />
            </div>
            <p className="font-heading text-xl text-stone-700 dark:text-stone-300 mb-2">
              {t("library.no_books")}
            </p>
            <p className="text-stone-500 dark:text-stone-400 text-sm max-w-sm mb-8">
              Adicione uma pasta ou arquivo para começar a ler.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium shadow-lg shadow-brand/20 transition-all duration-200"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              {t("library.add_book")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => onSelectBook(book)}
              />
            ))}
          </div>
        )}
      </main>

      <AddBookModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSelectFolder={handleSelectFolder}
        onSelectFile={handleSelectFile}
        error={error}
        onClearError={clearError}
        isImporting={isImporting}
      />
    </div>
  );
};
