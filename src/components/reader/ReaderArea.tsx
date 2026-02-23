import React from 'react';
import { useReaderStore } from '../../store/readerStore';
import { PageView } from './PageView.tsx';
import { DualPageView } from './DualPageView.tsx';
import { ScrollView } from './ScrollView.tsx';
import { EpubScrollView } from './EpubScrollView.tsx';
import { EmptyState } from './states/EmptyState.tsx';
import { LoadingState } from './states/LoadingState.tsx';
import { ErrorState } from './states/ErrorState.tsx';

export const ReaderArea: React.FC = () => {
    const { status, settings, adapterType } = useReaderStore();

    if (status === 'empty') return <EmptyState />;
    if (status === 'loading') return <LoadingState />;
    if (status === 'error') return <ErrorState />;

    // EPUB em scroll: uma única rendition com flow scrolled-doc (evita erro "package")
    const isEpubScroll = adapterType === 'epub' && settings.viewMode === 'scroll';

    return (
        <div className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden relative">
            {settings.viewMode === 'single' && <PageView />}
            {settings.viewMode === 'dual' && <DualPageView />}
            {settings.viewMode === 'scroll' && (isEpubScroll ? <EpubScrollView /> : <ScrollView />)}
        </div>
    );
};
