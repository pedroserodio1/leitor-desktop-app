import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { useReaderNavigation } from '../../hooks/useReaderNavigation';
import { PageSlot } from './PageSlot';

export const PageView: React.FC = () => {
  const { currentPage, settings, totalPages, adapterType } = useReaderStore();
  const { t } = useTranslation();
  const { handlePrev, handleNext } = useReaderNavigation({
    viewMode: 'single',
    page1: currentPage,
    leftPage: currentPage,
    rightPage: null,
  });

  const transitionClass = settings.direction === 'rtl' ? 'page-transition-prev' : 'page-transition-next';

  const handleAreaPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = rect.width > 0 ? x / rect.width : 0;
      if (pct < 0.25) {
        e.preventDefault();
        e.stopPropagation();
        if (settings.direction === 'rtl') handleNext();
        else handlePrev();
      } else if (pct > 0.75) {
        e.preventDefault();
        e.stopPropagation();
        if (settings.direction === 'rtl') handlePrev();
        else handleNext();
      }
    },
    [settings.direction, handlePrev, handleNext]
  );

  const isEpub = adapterType === 'epub';

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative">
      {isEpub ? (
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onPointerDown={handleAreaPointerDown}
          onClick={(e) => e.preventDefault()}
          role="presentation"
          aria-hidden
        />
      ) : (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer z-10"
            onClick={settings.direction === 'rtl' ? handleNext : handlePrev}
            title={settings.direction === 'rtl' ? t('controls.next') : t('controls.prev')}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer z-10"
            onClick={settings.direction === 'rtl' ? handlePrev : handleNext}
            title={settings.direction === 'rtl' ? t('controls.prev') : t('controls.next')}
          />
        </>
      )}
      <div
        className="reader-page-view absolute inset-0 flex items-center justify-center overflow-hidden"
        dir={settings.direction}
        style={{
          transform: `scale(${settings.zoom / 100})`,
          transformOrigin: 'center center',
        }}
      >
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          {currentPage > 0 ? (
            <div
              key={adapterType === 'epub' ? 'epub-slot' : currentPage}
              className={`w-full h-full flex items-center justify-center overflow-hidden ${transitionClass}`}
            >
              <PageSlot pageNum={currentPage} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p>{t('views.no_page')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-800/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
        {currentPage} / {totalPages}
      </div>
    </div>
  );
};
