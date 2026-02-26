import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { Book, Library, Settings as SettingsIcon, FolderOpen, ImageIcon } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { setStatus, setTitle, setTotalPages } = useReaderStore();
  const { openFile, openImages } = useReaderAdapterContext();
  const { t } = useTranslation();

  const loadMockBook = (title: string, pages: number, status: 'ready' | 'loading' | 'error' | 'empty') => {
    setTitle(title);
    setTotalPages(pages);
    setStatus(status);
  };

  return (
    <div className="h-full flex flex-col bg-stone-50 dark:bg-stone-900/95 border-r border-stone-200 dark:border-stone-800 w-72 shrink-0">
      <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-brand/10 dark:bg-brand/20">
          <Library className="w-5 h-5 text-brand" strokeWidth={1.75} />
        </div>
        <h2 className="font-heading font-semibold text-lg tracking-tight text-stone-900 dark:text-stone-100">
          {t('library.title')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="space-y-2 mb-6">
          <button
            onClick={openFile}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-brand/10 hover:bg-brand/15 dark:bg-brand/20 dark:hover:bg-brand/25 transition-colors text-left border border-brand/20"
          >
            <FolderOpen className="w-5 h-5 text-brand shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-medium text-sm text-brand">{t('library.open_file')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">PDF, EPUB, CBZ, RAR</p>
            </div>
          </button>

          <button
            onClick={openImages}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition-colors text-left border border-stone-200 dark:border-stone-700"
          >
            <ImageIcon className="w-5 h-5 text-stone-500 dark:text-stone-400 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-medium text-sm text-stone-700 dark:text-stone-200">{t('library.open_images')}</p>
              <p className="text-xs text-stone-500 dark:text-stone-400">JPG, PNG, WebP</p>
            </div>
          </button>
        </div>

        <div className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
          {t('library.mock_library')}
        </div>

        <button
          onClick={() => loadMockBook('Dune', 896, 'ready')}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-left"
        >
          <div className="w-9 h-11 rounded-lg bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
            <Book className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-medium truncate text-sm text-stone-900 dark:text-stone-100">Dune (Sci-Fi Book)</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">896 pages</p>
          </div>
        </button>

        <button
          onClick={() => loadMockBook('Berserk Vol. 1', 224, 'ready')}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-left"
        >
          <div className="w-9 h-11 rounded-lg bg-rose-700 flex items-center justify-center shrink-0 shadow-sm">
            <Book className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-medium truncate text-sm text-stone-900 dark:text-stone-100">Berserk Vol. 1</p>
            <p className="text-xs text-stone-500 dark:text-stone-400">224 pages (RTL Preset)</p>
          </div>
        </button>

        <button
          onClick={() => loadMockBook('', 0, 'loading')}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-left mt-4 border border-dashed border-stone-300 dark:border-stone-600"
        >
          <p className="text-xs italic text-stone-500 dark:text-stone-400">{t('library.test_loading')}</p>
        </button>

        <button
          onClick={() => loadMockBook('', 0, 'error')}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-left border border-dashed border-stone-300 dark:border-stone-600"
        >
          <p className="text-xs italic text-stone-500 dark:text-stone-400">{t('library.test_error')}</p>
        </button>
      </div>

      <div className="p-4 border-t border-stone-200 dark:border-stone-800">
        <button className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors rounded-lg py-1.5 px-2 hover:bg-stone-100 dark:hover:bg-stone-800">
          <SettingsIcon className="w-4 h-4" strokeWidth={1.75} />
          <span>{t('library.app_settings')}</span>
        </button>
      </div>
    </div>
  );
};
