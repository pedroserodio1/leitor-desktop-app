import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Library as LibraryIcon, Plus } from "lucide-react";
import { BookCard } from "./BookCard";
import { AddBookModal } from "./AddBookModal";
import { useLibrary } from "../../hooks/useLibrary";
import type { LibraryBook } from "../../types/library";

interface LibraryViewProps {
  onSelectBook: (book: LibraryBook) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ onSelectBook }) => {
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
    <div className="h-screen w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <LibraryIcon className="w-8 h-8 text-brand" />
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t("library.title")}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t("library.add_book")}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
              <LibraryIcon className="w-12 h-12 text-slate-500 dark:text-slate-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-sm">
              {t("library.no_books")}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              {t("library.add_book")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
