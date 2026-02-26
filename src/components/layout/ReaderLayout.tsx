import React, { useEffect, useCallback, useRef } from 'react';
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
}

export const ReaderLayout: React.FC<ReaderLayoutProps> = ({ content, onBack }) => {
  const { settings, sidebarOpen, status, currentPage, prevPage, nextPage } = useReaderStore();
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (status !== 'ready') return;
      if (settings.viewMode === 'scroll') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const isRtl = settings.direction === 'rtl';
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (isRtl) nextPage();
        else prevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (isRtl) prevPage();
        else nextPage();
      }
    },
    [status, settings.viewMode, settings.direction, prevPage, nextPage]
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
    <div className="flex h-screen w-full overflow-hidden transition-colors duration-300">
      <div
        className={`flex-shrink-0 h-full border-r border-stone-200 dark:border-stone-800 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}
      >
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col relative h-full overflow-hidden bg-stone-100 dark:bg-stone-950">
        <TopBar onBackToLibrary={onBack} />

        <div className="flex-1 relative overflow-hidden">
          <ReaderArea />
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

        <BottomControls />
      </div>

      <SettingsPanel />
    </div>
  );
};
