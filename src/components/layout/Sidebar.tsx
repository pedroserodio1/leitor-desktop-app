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
        <div className="h-full flex flex-col bg-slate-100 dark:bg-slate-900 w-64 shrink-0">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <Library className="w-5 h-5 text-brand" />
                <h2 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">{t('library.title')}</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">

                {/* ---- Open File Buttons ---- */}
                <div className="space-y-2 mb-6">
                    <button
                        onClick={openFile}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-brand/10 hover:bg-brand/20 dark:bg-brand/20 dark:hover:bg-brand/30 transition-colors text-left border border-brand/20"
                    >
                        <FolderOpen className="w-5 h-5 text-brand shrink-0" />
                        <div>
                            <p className="font-medium text-sm text-brand">{t('library.open_file')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">PDF, EPUB</p>
                        </div>
                    </button>

                    <button
                        onClick={openImages}
                        className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-200/60 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-left border border-slate-200 dark:border-slate-700"
                    >
                        <ImageIcon className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <div>
                            <p className="font-medium text-sm text-slate-700 dark:text-slate-200">{t('library.open_images')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">JPG, PNG, WebP</p>
                        </div>
                    </button>
                </div>

                {/* ---- Mock Library (dev) ---- */}
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    {t('library.mock_library')}
                </div>

                <button
                    onClick={() => loadMockBook('Dune', 896, 'ready')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
                >
                    <div className="w-8 h-10 bg-blue-500 rounded flex items-center justify-center shrink-0">
                        <Book className="w-4 h-4 text-white" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-medium truncate text-sm text-slate-900 dark:text-slate-100">Dune (Sci-Fi Book)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">896 pages</p>
                    </div>
                </button>

                <button
                    onClick={() => loadMockBook('Berserk Vol. 1', 224, 'ready')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
                >
                    <div className="w-8 h-10 bg-red-600 rounded flex items-center justify-center shrink-0">
                        <Book className="w-4 h-4 text-white" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-medium truncate text-sm text-slate-900 dark:text-slate-100">Berserk Vol. 1</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">224 pages (RTL Preset)</p>
                    </div>
                </button>

                <button
                    onClick={() => loadMockBook('', 0, 'loading')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left mt-4 border border-dashed border-slate-300 dark:border-slate-600"
                >
                    <p className="text-xs italic text-slate-500 dark:text-slate-400">{t('library.test_loading')}</p>
                </button>

                <button
                    onClick={() => loadMockBook('', 0, 'error')}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-left border border-dashed border-slate-300 dark:border-slate-600"
                >
                    <p className="text-xs italic text-slate-500 dark:text-slate-400">{t('library.test_error')}</p>
                </button>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    <SettingsIcon className="w-4 h-4" />
                    <span>{t('library.app_settings')}</span>
                </button>
            </div>
        </div>
    );
};
