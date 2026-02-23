import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { Menu, Moon, Sun, Settings, ArrowLeft } from 'lucide-react';
import { ProfilePresetSelector } from '../settings/ProfilePresetSelector.tsx';

interface TopBarProps {
  onBackToLibrary?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onBackToLibrary }) => {
    const {
        title,
        currentPage,
        totalPages,
        settings,
        setSetting,
        toggleSidebar,
        toggleSettingsPanel,
    } = useReaderStore();
    const { t } = useTranslation();

    const progress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

    return (
        <div className="h-12 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-10 relative">
            <div className="flex items-center gap-4">
                {onBackToLibrary ? (
                    <button
                        onClick={onBackToLibrary}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-700 dark:text-slate-300"
                        title={t('states.error.back')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-700 dark:text-slate-300"
                        title={t('topbar.toggle_sidebar')}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {title ? (
                    <div className="flex flex-col">
                        <h1 className="text-sm font-semibold truncate max-w-xs text-slate-900 dark:text-slate-100">{title}</h1>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {t('topbar.page_of', { current: currentPage, total: totalPages })}
                        </span>
                    </div>
                ) : (
                    <h1 className="text-sm font-semibold text-slate-400 dark:text-slate-500 italic">{t('topbar.no_book')}</h1>
                )}
            </div>

            {title && totalPages > 0 && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-brand/20 w-full">
                    <div
                        className="h-full bg-brand transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            <div className="flex items-center gap-2">
                <ProfilePresetSelector />

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

                <button
                    onClick={() => setSetting('theme', settings.theme === 'light' ? 'dark' : 'light')}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-700 dark:text-slate-300"
                    title={t('topbar.toggle_theme')}
                >
                    {settings.theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>

                <button
                    onClick={toggleSettingsPanel}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-700 dark:text-slate-300"
                    title={t('topbar.settings')}
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
