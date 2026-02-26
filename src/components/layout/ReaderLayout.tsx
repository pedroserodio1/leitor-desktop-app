import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { getProgress, saveProgress } from '../../services/dbService';
import { Sidebar } from './Sidebar.tsx';
import { TopBar } from './TopBar.tsx';
import { BottomControls } from './BottomControls.tsx';
import { ReaderArea } from '../reader/ReaderArea.tsx';
import { SettingsPanel } from '../settings/SettingsPanel.tsx';

const PROGRESS_SAVE_DEBOUNCE_MS = 1200;

interface ReaderLayoutProps {
  content: { paths: string[]; title: string; bookId: string; volumeId: string };
  onBack?: () => void;
  onBackToLibrary?: () => void;
}

export const ReaderLayout: React.FC<ReaderLayoutProps> = ({ content, onBack, onBackToLibrary }) => {
  const { settings, sidebarOpen, status, currentPage, totalPages, setCurrentPage, prevPage, nextPage } = useReaderStore();
  const { i18n } = useTranslation();
  const { loadPaths } = useReaderAdapterContext();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathsKey = content.paths.join(',');
  useEffect(
    () => {
      let cancelled = false;
      (async () => {
        let initialPage = 1;
        if (content.bookId && content.volumeId) {
          try {
            const p = await getProgress(content.bookId, content.volumeId);
            if (!cancelled && p?.page_index != null) initialPage = p.page_index;
          } catch {
            // ignora erro; inicia na página 1
          }
        }
        if (cancelled) return;
        loadPaths(content.paths, content.title, initialPage);
      })();
      return () => {
        cancelled = true;
      };
    },
    // pathsKey deriva de content.paths; re-run quando paths/title/book/volume mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathsKey, content.title, content.bookId, content.volumeId, loadPaths]
  );

  useEffect(() => {
    if (!content.bookId || !content.volumeId || status !== 'ready') return;
    const bookId = content.bookId;
    const volumeId = content.volumeId;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      const page = useReaderStore.getState().currentPage;
      saveProgress({
        book_id: bookId,
        volume_id: volumeId,
        current_chapter_id: null,
        page_index: page,
        scroll_offset: 0,
        updated_at: 0,
      }).catch((e) => console.error('[ReaderLayout] saveProgress:', e));
    }, PROGRESS_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        const page = useReaderStore.getState().currentPage;
        saveProgress({
          book_id: bookId,
          volume_id: volumeId,
          current_chapter_id: null,
          page_index: page,
          scroll_offset: 0,
          updated_at: 0,
        }).catch((e) => console.error('[ReaderLayout] saveProgress (on unmount):', e));
      }
    };
  }, [content.bookId, content.volumeId, currentPage, status]);

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showGoToPageModal, setShowGoToPageModal] = React.useState(false);
  const [goToPageInput, setGoToPageInput] = useState('');

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // fullscreen may fail (e.g. iframes)
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (onBack) {
          onBack();
        }
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleFullscreen();
        }
        return;
      }

      if (status !== 'ready') return;
      if (settings.viewMode === 'scroll') return;

      const isRtl = settings.direction === 'rtl';
      const goPrev = () => (isRtl ? nextPage() : prevPage());
      const goNext = () => (isRtl ? prevPage() : nextPage());

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goNext();
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) goPrev();
          else goNext();
          break;
        case 'PageDown':
          e.preventDefault();
          goNext();
          break;
        case 'PageUp':
          e.preventDefault();
          goPrev();
          break;
        case 'Home':
          e.preventDefault();
          setCurrentPage(1);
          break;
        case 'End':
          e.preventDefault();
          setCurrentPage(Math.max(1, totalPages));
          break;
        case 'g':
        case 'G':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setShowGoToPageModal(true);
          }
          break;
        default:
          break;
      }
    },
    [status, settings.viewMode, settings.direction, prevPage, nextPage, onBack, toggleFullscreen, totalPages, setCurrentPage]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  return (
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-300" data-testid="reader-layout">
      {!isFullscreen && (
        <div
          className={`flex-shrink-0 h-full border-r border-stone-200 dark:border-stone-800 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}
        >
          <Sidebar onBackToLibrary={onBackToLibrary} onOpenSettings={undefined} />
        </div>
      )}

      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-stone-100 dark:bg-stone-950">
        {!isFullscreen && (
          <TopBar
            onBackToLibrary={onBack}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
          />
        )}

        <div
          className={`flex-1 relative overflow-hidden group ${isFullscreen ? 'bg-black' : 'bg-stone-100 dark:bg-stone-950'}`}
          onTouchStart={(e) => {
            if (status !== 'ready' || settings.viewMode === 'scroll') return;
            (e.currentTarget as HTMLElement).dataset.touchStartX = String(e.touches[0]?.clientX ?? 0);
          }}
          onTouchEnd={(e) => {
            if (status !== 'ready' || settings.viewMode === 'scroll') return;
            const startX = parseFloat((e.currentTarget as HTMLElement).dataset.touchStartX ?? '0');
            const endX = e.changedTouches[0]?.clientX ?? 0;
            const delta = endX - startX;
            if (Math.abs(delta) < 50) return;
            const isRtl = settings.direction === 'rtl';
            if (delta > 0) (isRtl ? nextPage : prevPage)();
            else (isRtl ? prevPage : nextPage)();
          }}
        >
          <ReaderArea />
          {isFullscreen && status === 'ready' && (
            <div className="absolute inset-0 z-[100] flex items-end justify-center pb-8 pointer-events-none">
              <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-2xl px-4 py-3 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={settings.direction === 'rtl' ? nextPage : prevPage}
                  className="p-2 rounded-xl hover:bg-white/20 text-white"
                  title="Previous"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button
                  type="button"
                  onClick={settings.direction === 'rtl' ? prevPage : nextPage}
                  className="p-2 rounded-xl hover:bg-white/20 text-white"
                  title="Next"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
          {settings.viewMode === 'dual' && (
            <div
              className="absolute inset-0 z-[100] cursor-pointer"
              style={{ pointerEvents: 'auto' }}
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const w = rect.width;
                if (w <= 0) return;
                const x = e.clientX - rect.left;
                const pct = x / w;
                const isRtl = settings.direction === 'rtl';
                if (pct < 0.33) {
                  e.preventDefault();
                  e.stopPropagation();
                  document.dispatchEvent(new CustomEvent('reader-navigate', { detail: { direction: isRtl ? 'next' : 'prev' }, bubbles: true }));
                } else if (pct > 0.66) {
                  e.preventDefault();
                  e.stopPropagation();
                  document.dispatchEvent(new CustomEvent('reader-navigate', { detail: { direction: isRtl ? 'prev' : 'next' }, bubbles: true }));
                }
              }}
              onClick={(e) => e.preventDefault()}
              role="presentation"
              aria-label="Clique esquerda: voltar. Direita: avançar."
            />
          )}
        </div>

        {!isFullscreen && <BottomControls />}
      </div>

      <SettingsPanel />

      {showGoToPageModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950/60 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowGoToPageModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="go-to-page-title"
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800 mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="go-to-page-title" className="font-heading text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
              {i18n.t('views.go_to_page')}
            </h2>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = parseInt(goToPageInput, 10);
                  if (!isNaN(n) && n >= 1 && n <= totalPages) {
                    setCurrentPage(n);
                    setShowGoToPageModal(false);
                    setGoToPageInput('');
                  }
                } else if (e.key === 'Escape') {
                  setShowGoToPageModal(false);
                  setGoToPageInput('');
                }
              }}
              placeholder={i18n.t('views.go_to_page_placeholder')}
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-0 text-stone-900 dark:text-stone-100 text-sm mb-4"
            />
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              1 – {totalPages}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowGoToPageModal(false);
                  setGoToPageInput('');
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                {i18n.t('library.book_detail.remove_confirm_no')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const n = parseInt(goToPageInput, 10);
                  if (!isNaN(n) && n >= 1 && n <= totalPages) {
                    setCurrentPage(n);
                    setShowGoToPageModal(false);
                    setGoToPageInput('');
                  }
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-brand hover:bg-brand-hover text-white"
              >
                {i18n.t('views.go')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
