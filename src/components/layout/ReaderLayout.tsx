import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useReaderStore } from '../../store/readerStore';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { Sidebar } from './Sidebar.tsx';
import { TopBar } from './TopBar.tsx';
import { BottomControls } from './BottomControls.tsx';
import { ReaderArea } from '../reader/ReaderArea.tsx';
import { SettingsPanel } from '../settings/SettingsPanel.tsx';

interface ReaderLayoutProps {
  content: { paths: string[]; title: string };
  onBack?: () => void;
}

export const ReaderLayout: React.FC<ReaderLayoutProps> = ({ content, onBack }) => {
  const { settings, sidebarOpen, status, prevPage, nextPage } = useReaderStore();
  const { i18n } = useTranslation();
  const { loadPaths } = useReaderAdapterContext();

  useEffect(() => {
    loadPaths(content.paths, content.title);
  }, [content.paths.join(','), content.title, loadPaths]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (status !== 'ready') return;
      if (settings.viewMode === 'scroll') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const isRtl = settings.direction === 'rtl';
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        isRtl ? nextPage() : prevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        isRtl ? prevPage() : nextPage();
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
        </div>

        <BottomControls />
      </div>

      <SettingsPanel />
    </div>
  );
};
