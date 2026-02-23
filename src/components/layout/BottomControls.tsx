import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import {
    ChevronLeft,
    ChevronRight,
    ZoomIn,
    ZoomOut,
    SplitSquareHorizontal,
    Square,
    ArrowDownToLine,
    ArrowRightLeft,
} from 'lucide-react';

export const BottomControls: React.FC = () => {
    const { settings, setSetting, status, prevPage, nextPage } = useReaderStore();
    const { t } = useTranslation();
    const [isHovering, setIsHovering] = useState(false);

    if (status !== 'ready') return null;

    return (
        <div
            className="absolute bottom-0 left-0 w-full h-32 flex items-end justify-center pb-6 z-20"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                className={`bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl px-6 py-3 flex items-center gap-6 transition-all duration-300 transform ${isHovering ? 'translate-y-0 opacity-100 visible' : 'translate-y-4 opacity-0 invisible'
                    }`}
            >
                {/* Navigation */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevPage}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center text-slate-700 dark:text-slate-200"
                        title={t('controls.prev')}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextPage}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center justify-center text-slate-700 dark:text-slate-200"
                        title={t('controls.next')}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

                {/* View Mode */}
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => setSetting('viewMode', 'single')}
                        className={`p-1.5 rounded-md transition-colors ${settings.viewMode === 'single'
                                ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                        title={t('controls.single')}
                    >
                        <Square className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSetting('viewMode', 'dual')}
                        className={`p-1.5 rounded-md transition-colors ${settings.viewMode === 'dual'
                                ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                        title={t('controls.dual')}
                    >
                        <SplitSquareHorizontal className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setSetting('viewMode', 'scroll')}
                        className={`p-1.5 rounded-md transition-colors ${settings.viewMode === 'scroll'
                                ? 'bg-white dark:bg-slate-600 shadow-sm text-brand'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                        title={t('controls.scroll')}
                    >
                        <ArrowDownToLine className="w-5 h-5" />
                    </button>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

                {/* Zoom */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSetting('zoom', Math.max(50, settings.zoom - 10))}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>

                    <span className="text-sm font-medium w-12 text-center text-slate-700 dark:text-slate-200">
                        {settings.zoom}%
                    </span>

                    <button
                        onClick={() => setSetting('zoom', Math.min(300, settings.zoom + 10))}
                        className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>
                </div>

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

                {/* Direction Toggle */}
                <button
                    onClick={() => setSetting('direction', settings.direction === 'ltr' ? 'rtl' : 'ltr')}
                    className={`p-2 rounded-md transition-colors flex items-center gap-2 ${settings.direction === 'rtl'
                            ? 'text-brand bg-brand/10'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                    title={t('controls.toggle_direction')}
                >
                    <ArrowRightLeft className="w-5 h-5" />
                    <span className="text-xs font-bold">{settings.direction.toUpperCase()}</span>
                </button>
            </div>
        </div>
    );
};
