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
    }, [content.paths.join(","), content.title, loadPaths]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (status !== 'ready') return;
        if (settings.viewMode === 'scroll') return; // scroll mode: usuário rola, sem prev/next
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        const isRtl = settings.direction === 'rtl';
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            (isRtl ? nextPage : prevPage)();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            (isRtl ? prevPage : nextPage)();
        }
    }, [status, settings.viewMode, settings.direction, prevPage, nextPage]);

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
        <div className={`flex h-screen w-full overflow-hidden transition-colors duration-300 ${settings.theme === 'dark' ? 'dark' : ''}`}>

            {/* Sidebar - Collapsible */}
            <div
                className={`flex-shrink-0 h-full border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'
                    }`}
            >
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative h-full overflow-hidden">
                <TopBar onBackToLibrary={onBack} />

                <div className="flex-1 relative overflow-hidden">
                    <ReaderArea />
                </div>

                <BottomControls />
            </div>

            {/* Slide-over Settings Panel */}
            <SettingsPanel />

        </div>
    );
};
