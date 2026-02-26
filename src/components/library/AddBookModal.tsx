import React from "react";
import { useTranslation } from "react-i18next";
import { X, FolderOpen, FileText } from "lucide-react";

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: () => void;
  onSelectFile: () => void;
  error: string | null;
  onClearError: () => void;
  isImporting: boolean;
}

export const AddBookModal: React.FC<AddBookModalProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  onSelectFile,
  error,
  onClearError,
  isImporting,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSelectFolder = () => {
    onClearError();
    onSelectFolder();
  };

  const handleSelectFile = () => {
    onClearError();
    onSelectFile();
  };

  const errorMessage =
    error === "empty_folder"
      ? t("library.empty_folder")
      : error === "duplicate"
        ? t("library.duplicate")
        : error === "import_error"
          ? t("library.import_error")
          : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
        className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-100 dark:border-stone-800">
          <h2 id="add-book-title" className="font-heading text-xl font-semibold text-stone-900 dark:text-stone-100">
            {t("library.add_book")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <button
            type="button"
            onClick={handleSelectFolder}
            disabled={isImporting}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 hover:bg-brand/5 dark:hover:bg-brand/10 border border-stone-200 dark:border-stone-700 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3.5 rounded-xl bg-brand/15 dark:bg-brand/25">
              <FolderOpen className="w-6 h-6 text-brand" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {t("library.select_folder")}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Pasta com subpastas (volumes) ou arquivos de imagem/PDF
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectFile}
            disabled={isImporting}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-700/50 border border-stone-200 dark:border-stone-700 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3.5 rounded-xl bg-stone-200 dark:bg-stone-700">
              <FileText className="w-6 h-6 text-stone-600 dark:text-stone-300" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-medium text-stone-900 dark:text-stone-100">
                {t("library.select_file")}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                JPG, PNG, WebP, PDF, EPUB, CBZ ou RAR
              </p>
            </div>
          </button>

          {errorMessage && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm"
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
