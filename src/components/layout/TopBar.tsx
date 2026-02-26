import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { saveGlobalSettings } from '../../services/dbService';
import { Menu, Moon, Sun, Monitor, Settings, ArrowLeft, Maximize2, Minimize2 } from 'lucide-react';
import { ProfilePresetSelector } from '../settings/ProfilePresetSelector.tsx';

interface TopBarProps {
  onBackToLibrary?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onBackToLibrary, isFullscreen, onToggleFullscreen }) => {
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
    <div className="h-14 border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md flex items-center justify-between px-5 shrink-0 z-10 relative">
      <div className="flex items-center gap-2">
        {onBackToLibrary && (
          <button
            onClick={onBackToLibrary}
            data-testid="btn-back-to-library"
            className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-300"
            title={t('states.error.back')}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-300"
          title={t('topbar.toggle_sidebar')}
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {title ? (
          <div className="flex flex-col min-w-0">
            <h1 className="font-heading text-sm font-semibold truncate max-w-[240px] text-stone-900 dark:text-stone-100">
              {title}
            </h1>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {t('topbar.page_of', { current: currentPage, total: totalPages })}
            </span>
          </div>
        ) : (
          <h1 className="font-heading text-sm font-semibold text-stone-400 dark:text-stone-500 italic">
            {t('topbar.no_book')}
          </h1>
        )}
      </div>

      {title && totalPages > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-stone-200 dark:bg-stone-800 w-full">
          <div
            className="h-full bg-brand transition-all duration-300 ease-out rounded-r-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <ProfilePresetSelector />

        <div className="w-px h-7 bg-stone-200 dark:bg-stone-700 mx-1" />

        <button
          onClick={() => {
            const next = settings.theme === 'light' ? 'dark' : settings.theme === 'dark' ? 'system' : 'light';
            setSetting('theme', next);
            saveGlobalSettings({ theme: next }).catch((e) => console.error('[TopBar] saveGlobalSettings:', e));
          }}
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-300"
          title={t('topbar.toggle_theme')}
        >
          {settings.theme === 'light' ? (
            <Sun className="w-5 h-5" strokeWidth={1.75} />
          ) : settings.theme === 'dark' ? (
            <Moon className="w-5 h-5" strokeWidth={1.75} />
          ) : (
            <Monitor className="w-5 h-5" strokeWidth={1.75} />
          )}
        </button>

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-300"
            title={isFullscreen ? t('settings.fullscreen_exit') : t('settings.fullscreen_enter')}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Maximize2 className="w-5 h-5" strokeWidth={1.75} />
            )}
          </button>
        )}

        <button
          onClick={toggleSettingsPanel}
          className="p-2.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-300"
          title={t('topbar.settings')}
        >
          <Settings className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};
