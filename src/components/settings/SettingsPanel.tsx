import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { saveGlobalSettings } from '../../services/dbService';
import { X, Type, SplitSquareHorizontal, Square, ArrowDownToLine, ArrowRightLeft, Monitor, Moon, Sun, BookOpen } from 'lucide-react';
import type { ViewMode, Direction, Theme, EpubTheme } from '../../types/reader';

export const SettingsPanel: React.FC = () => {
  const { settings, setSetting, settingsPanelOpen, toggleSettingsPanel, adapterType } = useReaderStore();
  const { t } = useTranslation();

  const viewModes: ViewMode[] = adapterType === 'epub'
    ? ['single']
    : ['single', 'dual', 'scroll'];

  return (
    <div
      className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 shadow-2xl transition-transform duration-300 ease-in-out z-50 ${settingsPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <h2 className="font-heading font-semibold text-xl tracking-tight text-stone-900 dark:text-stone-100">
          {t('settings.title')}
        </h2>
        <button
          onClick={toggleSettingsPanel}
          className="p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-stone-500 dark:text-stone-400"
        >
          <X className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-80px)]">
        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {t('settings.layout')}
          </h3>

          <div className="space-y-4">
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block">
              {t('settings.view_mode')}
            </label>
            <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
              {viewModes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSetting('viewMode', mode)}
                  className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${settings.viewMode === mode ? 'bg-white dark:bg-stone-600 shadow-sm text-brand' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
                >
                  {mode === 'single' && <Square className="w-4 h-4" strokeWidth={1.75} />}
                  {mode === 'dual' && <SplitSquareHorizontal className="w-4 h-4" strokeWidth={1.75} />}
                  {mode === 'scroll' && <ArrowDownToLine className="w-4 h-4" strokeWidth={1.75} />}
                  <span className="capitalize">{t(`controls.${mode}`)}</span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-3">
                {t('settings.reading_direction')}
              </label>
              <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
                {(['ltr', 'rtl'] as Direction[]).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setSetting('direction', dir)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors ${settings.direction === dir ? 'bg-white dark:bg-stone-600 shadow-sm text-brand' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
                  >
                    <ArrowRightLeft className="w-4 h-4" strokeWidth={1.75} />
                    <span className="uppercase">{dir}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            {t('settings.appearance')}
          </h3>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-3">
                Language
              </label>
              <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
                {(['en', 'pt-BR', 'es'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSetting('language', lang)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors uppercase ${settings.language === lang ? 'bg-white dark:bg-stone-600 shadow-sm text-brand' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-3">
                {t('settings.theme')}
              </label>
              <div className="flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
                {(['light', 'dark', 'system'] as Theme[]).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => {
                      setSetting('theme', theme);
                      setSetting('customThemeId', null);
                      saveGlobalSettings({ theme, custom_theme_id: null }).catch((e) => console.error('[SettingsPanel] saveGlobalSettings:', e));
                    }}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${settings.theme === theme ? 'bg-white dark:bg-stone-600 shadow-sm text-brand' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
                  >
                    {theme === 'light' && <Sun className="w-4 h-4" strokeWidth={1.75} />}
                    {theme === 'dark' && <Moon className="w-4 h-4" strokeWidth={1.75} />}
                    {theme === 'system' && <Monitor className="w-4 h-4" strokeWidth={1.75} />}
                    <span className="capitalize">{theme === 'system' ? t('settings.theme_system') : theme}</span>
                  </button>
                ))}
              </div>
            </div>

            {adapterType === 'epub' && (
              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-stone-200 block mb-3">
                  {t('settings.epub_theme')}
                </label>
                <div className="flex flex-wrap gap-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl p-1.5">
                  {(['light', 'dark', 'sepia', 'system'] as EpubTheme[]).map((epubTheme) => (
                    <button
                      key={epubTheme}
                      onClick={() => setSetting('epubTheme', epubTheme)}
                      className={`flex-1 min-w-[70px] py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${settings.epubTheme === epubTheme ? 'bg-white dark:bg-stone-600 shadow-sm text-brand' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
                    >
                      {epubTheme === 'light' && <Sun className="w-4 h-4" strokeWidth={1.75} />}
                      {epubTheme === 'dark' && <Moon className="w-4 h-4" strokeWidth={1.75} />}
                      {epubTheme === 'sepia' && <BookOpen className="w-4 h-4" strokeWidth={1.75} />}
                      {epubTheme === 'system' && <Monitor className="w-4 h-4" strokeWidth={1.75} />}
                      <span className="capitalize">{epubTheme === 'system' ? t('settings.theme_system') : epubTheme}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="text-sm font-medium text-stone-700 dark:text-stone-200 flex items-center justify-between mb-3">
                <span>{t('settings.font_size')}</span>
                <span className="text-brand bg-brand/10 dark:bg-brand/20 px-2.5 py-0.5 rounded-lg text-xs font-medium tabular-nums">
                  {settings.fontSize}px
                </span>
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="12"
                  max="32"
                  step="1"
                  value={settings.fontSize}
                  onChange={(e) => setSetting('fontSize', parseInt(e.target.value))}
                  className="accent-brand w-full h-2 rounded-full appearance-none bg-stone-200 dark:bg-stone-700"
                />
                <div className="flex justify-between text-stone-500 dark:text-stone-400">
                  <Type className="w-3 h-3" />
                  <Type className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800/50">
          <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
            {t('settings.philosophy')}
          </p>
        </div>
      </div>
    </div>
  );
};
