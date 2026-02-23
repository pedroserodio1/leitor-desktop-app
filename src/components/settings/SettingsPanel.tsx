import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { X, Type, SplitSquareHorizontal, Square, ArrowDownToLine, ArrowRightLeft } from 'lucide-react';
import type { ViewMode, Direction, Theme } from '../../types/reader';

export const SettingsPanel: React.FC = () => {
    const { settings, setSetting, settingsPanelOpen, toggleSettingsPanel } = useReaderStore();
    const { t } = useTranslation();

    return (
        <div
            className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out z-50 transform ${settingsPanelOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">{t('settings.title')}</h2>
                <button
                    onClick={toggleSettingsPanel}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                >
                    <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
            </div>

            <div className="p-6 space-y-8 overflow-y-auto h-[calc(100vh-65px)]">

                {/* Layout & Reading Mode */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('settings.layout')}</h3>

                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center justify-between text-slate-700 dark:text-slate-200">
                            {t('settings.view_mode')}
                        </label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            {(['single', 'dual', 'scroll'] as ViewMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setSetting('viewMode', mode)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${settings.viewMode === mode
                                            ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                        }`}
                                >
                                    {mode === 'single' && <Square className="w-4 h-4" />}
                                    {mode === 'dual' && <SplitSquareHorizontal className="w-4 h-4" />}
                                    {mode === 'scroll' && <ArrowDownToLine className="w-4 h-4" />}
                                    <span className="capitalize">{t(`controls.${mode}`)}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-2">
                            <label className="text-sm font-medium flex items-center justify-between mb-3 text-slate-700 dark:text-slate-200">
                                {t('settings.reading_direction')}
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                {(['ltr', 'rtl'] as Direction[]).map((dir) => (
                                    <button
                                        key={dir}
                                        onClick={() => setSetting('direction', dir)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-colors ${settings.direction === dir
                                                ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                            }`}
                                    >
                                        <ArrowRightLeft className="w-4 h-4" />
                                        <span className="uppercase">{dir}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Appearance */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('settings.appearance')}</h3>

                    <div className="space-y-4">

                        {/* Language Selection */}
                        <div>
                            <label className="text-sm font-medium flex items-center justify-between mb-3 text-slate-700 dark:text-slate-200">
                                Language
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                {(['en', 'pt-BR', 'es'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setSetting('language', lang)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center transition-colors uppercase ${settings.language === lang
                                                ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme */}
                        <div>
                            <label className="text-sm font-medium flex items-center justify-between mb-3 text-slate-700 dark:text-slate-200">
                                {t('settings.theme')}
                            </label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                {(['light', 'dark'] as Theme[]).map((theme) => (
                                    <button
                                        key={theme}
                                        onClick={() => setSetting('theme', theme)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center transition-colors capitalize ${settings.theme === theme
                                                ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                            }`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="pt-2">
                            <label className="text-sm font-medium flex items-center justify-between mb-3 text-slate-700 dark:text-slate-200">
                                <span>{t('settings.font_size')}</span>
                                <span className="text-brand bg-brand/10 px-2 rounded">{settings.fontSize}px</span>
                            </label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="range"
                                    min="12"
                                    max="32"
                                    step="1"
                                    value={settings.fontSize}
                                    onChange={(e) => setSetting('fontSize', parseInt(e.target.value))}
                                    className="accent-brand"
                                />
                                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <Type className="w-3 h-3" />
                                    <Type className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Info */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-800/50">
                    <p className="text-xs text-blue-800 dark:text-blue-300">
                        {t('settings.philosophy')}
                    </p>
                </div>

            </div>
        </div>
    );
};
