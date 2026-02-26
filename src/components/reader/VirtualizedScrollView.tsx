import { useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useReaderStore } from '../../store/readerStore';
import { PageSlot } from './PageSlot';

const GAP = 32;
const PAGE_WIDTH_PCT = 0.8;
const PAGE_ASPECT = 1.414; // A4 height/width
const FALLBACK_ITEM_HEIGHT = 600;

export const VirtualizedScrollView: React.FC = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { totalPages, settings, currentPage, setCurrentPage } = useReaderStore();
  const { t } = useTranslation();
  const lastReportedPageRef = useRef(currentPage);

  const zoomFactor = settings.zoom / 100;

  const getItemSize = useCallback(() => {
    if (!parentRef.current) return FALLBACK_ITEM_HEIGHT + GAP;
    const w = parentRef.current.clientWidth * PAGE_WIDTH_PCT;
    return Math.round((w / PAGE_ASPECT) * zoomFactor) + GAP;
  }, [zoomFactor]);

  const virtualizer = useVirtualizer({
    count: totalPages,
    getScrollElement: () => parentRef.current,
    estimateSize: getItemSize,
    overscan: 3,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const scrollToPageOnMountRef = useRef(currentPage);
  scrollToPageOnMountRef.current = currentPage;
  useEffect(() => {
    if (totalPages === 0) return;
    const pageToScroll = scrollToPageOnMountRef.current;
    const timer = setTimeout(() => {
      virtualizer.scrollToIndex(pageToScroll - 1, { align: 'start' });
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount / totalPages change
  }, [totalPages]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = el.scrollTop;
        const itemSize = getItemSize();
        const index = Math.round(scrollTop / itemSize);
        const page = Math.max(1, Math.min(index + 1, totalPages));
        if (page !== lastReportedPageRef.current) {
          lastReportedPageRef.current = page;
          setCurrentPage(page);
        }
        ticking = false;
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [totalPages, getItemSize, setCurrentPage]);

  return (
    <div
      ref={parentRef}
      className="w-full h-full overflow-y-auto overflow-x-hidden py-[10%] px-[10%] bg-white dark:bg-slate-900"
      dir={settings.direction}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const pageNum = virtualRow.index + 1;
          const baseHeight = (virtualRow.size - GAP) / zoomFactor;
          const baseWidth = baseHeight / PAGE_ASPECT;

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
              }}
            >
              <div
                className="reader-page-view relative bg-white dark:bg-slate-900 shrink-0 overflow-hidden flex items-center justify-center"
                style={{
                  width: `${PAGE_WIDTH_PCT * 100}%`,
                  maxWidth: baseWidth,
                  height: baseHeight,
                  transform: `scale(${zoomFactor})`,
                  transformOrigin: 'top center',
                }}
              >
                <PageSlot
                  pageNum={pageNum}
                  className="shadow-inner bg-white dark:bg-slate-900"
                />
                <div
                  className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                  aria-hidden
                >
                  {t('views.page')} {pageNum}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
