import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ArrowLeft, Book } from "lucide-react";
import { updateBook } from "../../services/dbService";
import type { LibraryBook } from "../../types/library";

interface BookEditViewProps {
  book: LibraryBook;
  onBack: () => void;
  onSave: (updated: LibraryBook) => void;
}

export const BookEditView: React.FC<BookEditViewProps> = ({
  book,
  onBack,
  onSave,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(book.title);
  const [author, setAuthor] = useState(book.author ?? "");
  const [description, setDescription] = useState(book.description ?? "");
  const [coverPath, setCoverPath] = useState<string | null>(
    book.coverPath ?? null
  );
  const [coverError, setCoverError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChooseCover = async () => {
    try {
      const result = await open({
        multiple: false,
        filters: [
          {
            name: "Images",
            extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"],
          },
        ],
      });
      if (result && typeof result === "string") {
        setCoverPath(result);
        setCoverError(false);
      }
    } catch (e) {
      console.error("[BookEditView] handleChooseCover:", e);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateBook({
        book_id: book.id,
        title: trimmedTitle,
        author: author.trim() || null,
        description: description.trim() || null,
        cover_path: coverPath || null,
      });
      const updated: LibraryBook = {
        ...book,
        title: trimmedTitle,
        author: author.trim() || undefined,
        description: description.trim() || undefined,
        coverPath: coverPath ?? book.coverPath,
      };
      onSave(updated);
    } catch (e) {
      console.error("[BookEditView] handleSave:", e);
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="h-screen w-full flex flex-col bg-stone-50 dark:bg-stone-950"
      data-testid="book-edit-view"
    >
      <header className="flex-shrink-0 flex items-center gap-4 px-8 py-5 border-b border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          data-testid="btn-back"
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <h1 className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100">
          {t("library.book_detail.edit_book")}
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="edit-title"
              className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-2"
            >
              {t("library.book_detail.title")}
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-brand/50 focus:outline-none text-sm text-stone-900 dark:text-stone-100"
            />
          </div>

          <div>
            <label
              htmlFor="edit-author"
              className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-2"
            >
              {t("library.book_detail.author")}
            </label>
            <input
              id="edit-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t("library.book_detail.add_author")}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-brand/50 focus:outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
          </div>

          <div>
            <label
              htmlFor="edit-description"
              className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-2"
            >
              {t("library.book_detail.description")}
            </label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("library.book_detail.add_description")}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-transparent focus:border-brand/50 focus:outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 resize-y"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-2">
              {t("library.book_detail.cover")}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-32 rounded-xl overflow-hidden bg-stone-200 dark:bg-stone-800 flex items-center justify-center shrink-0">
                {coverPath && !coverError ? (
                  <img
                    src={convertFileSrc(coverPath)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={() => setCoverError(true)}
                  />
                ) : (
                  <Book
                    className="w-10 h-10 text-stone-400 dark:text-stone-500"
                    strokeWidth={1.25}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleChooseCover}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm font-medium transition-colors"
              >
                {t("library.book_detail.choose_cover")}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 text-amber-800 dark:text-amber-200 text-sm"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            data-testid="btn-save-book"
            className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "..." : t("library.book_detail.save")}
          </button>
        </div>
      </main>
    </div>
  );
};
