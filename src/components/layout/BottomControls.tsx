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
      className="absolute bottom-0 left-0 w-full h-36 flex items-end justify-center pb-8 z-20"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className={`bg-white/95 dark:bg-stone-800/95 backdrop-blur-md border border-stone-200 dark:border-stone-700 rounded-2xl shadow-xl px-6 py-4 flex items-center gap-6 transition-all duration-300 transform ${isHovering ? 'translate-y-0 opacity-100 visible' : 'translate-y-6 opacity-0 invisible'}`}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            className="p-2.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors flex items-center justify-center text-stone-700 dark:text-stone-200"
            title={t('controls.prev')}
          >
            <ChevronLeft className="w-6 h-6" strokeWidth={2} />
          </button>
          <button
            onClick={nextPage}
            className="p-2.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl transition-colors flex items-center justify-center text-stone-700 dark:text-stone-200"
            title={t('controls.next')}
          >
            <ChevronRight className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>

        <div className="w-px h-9 bg-stone-200 dark:bg-stone-700" />

        <div className="flex bg-stone-100 dark:bg-stone-700/80 p-1.5 rounded-xl">
          {[
            { mode: 'single' as const, Icon: Square, key: 'single' },
            { mode: 'dual' as const, Icon: SplitSquareHorizontal, key: 'dual' },
            { mode: 'scroll' as const, Icon: ArrowDownToLine, key: 'scroll' },
          ].map(({ mode, Icon, key }) => (
            <button
              key={key}
              onClick={() => setSetting('viewMode', mode)}
              className={`p-2 rounded-lg transition-colors flex items-center justify-center ${settings.viewMode === mode ? 'bg-white dark:bg-stone-600 shadow-sm text-brand' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'}`}
              title={t(`controls.${key}`)}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
            </button>
          ))}
        </div>

        <div className="w-px h-9 bg-stone-200 dark:bg-stone-700" />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSetting('zoom', Math.max(50, settings.zoom - 10))}
            className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <ZoomOut className="w-5 h-5" strokeWidth={1.75} />
          </button>
          <span className="text-sm font-medium w-12 text-center text-stone-700 dark:text-stone-200 tabular-nums">
            {settings.zoom}%
          </span>
          <button
            onClick={() => setSetting('zoom', Math.min(300, settings.zoom + 10))}
            className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
          >
            <ZoomIn className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="w-px h-9 bg-stone-200 dark:bg-stone-700" />

        <button
          onClick={() => setSetting('direction', settings.direction === 'ltr' ? 'rtl' : 'ltr')}
          className={`p-2.5 rounded-xl transition-colors flex items-center gap-2 ${settings.direction === 'rtl' ? 'text-brand bg-brand/10 dark:bg-brand/20' : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700'}`}
          title={t('controls.toggle_direction')}
        >
          <ArrowRightLeft className="w-5 h-5" strokeWidth={1.75} />
          <span className="text-xs font-bold tabular-nums">{settings.direction.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};
