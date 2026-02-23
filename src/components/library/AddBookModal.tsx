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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700 mx-4 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="add-book-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t("library.add_book")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={handleSelectFolder}
            disabled={isImporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 dark:hover:bg-brand/20 border border-slate-200 dark:border-slate-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 rounded-lg bg-brand/20 dark:bg-brand/30">
              <FolderOpen className="w-6 h-6 text-brand" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t("library.select_folder")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Pasta com subpastas (volumes) ou arquivos de imagem/PDF
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleSelectFile}
            disabled={isImporting}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 dark:hover:bg-brand/20 border border-slate-200 dark:border-slate-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-3 rounded-lg bg-slate-200 dark:bg-slate-700">
              <FileText className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t("library.select_file")}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                JPG, PNG, WebP, PDF ou EPUB
              </p>
            </div>
          </button>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm"
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
