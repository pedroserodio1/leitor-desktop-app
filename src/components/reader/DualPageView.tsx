import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageSlot } from './PageSlot';
import { useReaderStore } from '../../store/readerStore';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { useDualPageState } from '../../hooks/useDualPageState';
import { useReaderNavigation } from '../../hooks/useReaderNavigation';

const SLOT_ASPECT = 1.414; // altura/largura do slot (A4)

export const DualPageView: React.FC = () => {
  const {
    currentPage,
    settings,
    totalPages,
    adapterType,
  } = useReaderStore();
  const { getCachedAspectRatio } = useReaderAdapterContext();
  const { t } = useTranslation();

  let page1 = currentPage;
  if (page1 % 2 === 0) page1--;
  const page2 = page1 + 1 <= totalPages ? page1 + 1 : null;

  const leftPage = settings.direction === 'rtl' ? page2 : page1;
  const rightPage = settings.direction === 'rtl' ? page1 : page2;

  const { displayMode, onLeftRendered, onRightRendered } = useDualPageState({
    leftPage,
    rightPage,
    totalPages,
    getCachedAspectRatio,
  });

  const { handlePrev, handleNext } = useReaderNavigation({
    viewMode: 'dual',
    dualDisplayMode: displayMode,
    page1,
    leftPage,
    rightPage,
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as CustomEvent<{ direction: 'prev' | 'next' }>;
      if (ev.detail?.direction === 'prev') handlePrev();
      else if (ev.detail?.direction === 'next') handleNext();
    };
    document.addEventListener('reader-navigate', handler);
    return () => document.removeEventListener('reader-navigate', handler);
  }, [handlePrev, handleNext]);

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

  const hideLeft = displayMode === 'rightOnly';
  const hideRight = displayMode === 'leftOnly';
  const singleShot = displayMode !== 'spread';

  const isEpub = adapterType === 'epub';

  if (isEpub) {
    return (
      <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative">
        <div
          className="absolute inset-0 z-20 cursor-pointer"
          onPointerDown={handleAreaPointerDown}
          onClick={(e) => e.preventDefault()}
          role="presentation"
          aria-hidden
        />
        <div
          className="reader-page-view absolute inset-0 flex items-center justify-center transition-all duration-300 overflow-hidden"
          dir="ltr"
          style={{
            transform: `scale(${settings.zoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            key={page1}
            className={`h-full w-full bg-white dark:bg-slate-900 relative overflow-hidden ${settings.direction === 'rtl' ? 'page-transition-prev' : 'page-transition-next'}`}
          >
            <PageSlot pageNum={page1} />
          </div>
        </div>
      </div>
    );
  }

  const slotClass = 'dual-page-slot h-full flex-shrink-0';
  const slotStyle: React.CSSProperties = singleShot
    ? { width: '100%', height: '100%' }
    : { aspectRatio: 1 / SLOT_ASPECT, maxWidth: '100%' };
  const animateLeft = !hideLeft;
  const animateRight = !hideRight;
  const transitionClass = settings.direction === 'rtl' ? 'page-transition-prev' : 'page-transition-next';

  const gridCols =
    displayMode === 'rightOnly' ? '0fr 1fr' : displayMode === 'leftOnly' ? '1fr 0fr' : '1fr 1fr';
  const leftSlotWrapClass =
    'h-full min-w-0 overflow-hidden bg-white dark:bg-slate-900 flex relative ' +
    (hideRight ? 'items-stretch justify-center' : 'items-center justify-end');
  const rightSlotWrapClass =
    'h-full min-w-0 overflow-hidden bg-white dark:bg-slate-900 flex relative ' +
    (hideLeft ? 'items-stretch justify-center' : 'items-center justify-start');

  const showSpineEffect = displayMode === 'spread' && !hideLeft && !hideRight;

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 relative"
      role="presentation"
    >
      <div
        className="reader-page-view absolute inset-0 grid items-stretch overflow-hidden"
        dir="ltr"
        style={{
          transform: `scale(${settings.zoom / 100})`,
          transformOrigin: 'center center',
          gridTemplateColumns: gridCols,
          transition: 'grid-template-columns 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {showSpineEffect && (
          <div
            className="absolute left-1/2 top-0 bottom-0 w-[3%] min-w-[4px] max-w-[12px] -translate-x-1/2 z-10 pointer-events-none"
            aria-hidden
          >
            <div
              className="absolute inset-0 opacity-40 dark:opacity-50"
              style={{
                background: 'linear-gradient(to right, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)',
              }}
            />
          </div>
        )}
        <div className={leftSlotWrapClass}>
          {leftPage ? (
            <div
              key={leftPage}
              className={`${slotClass} ${animateLeft ? transitionClass : ''}`}
              style={slotStyle}
            >
              <PageSlot pageNum={leftPage} onRendered={onLeftRendered} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600 text-sm italic">
              {t('views.blank')}
            </div>
          )}
        </div>
        <div className={rightSlotWrapClass}>
          {rightPage ? (
            <div
              key={rightPage}
              className={`${slotClass} ${animateRight ? transitionClass : ''}`}
              style={slotStyle}
            >
              <PageSlot pageNum={rightPage} onRendered={onRightRendered} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-600 text-sm italic">
              {t('views.blank')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
