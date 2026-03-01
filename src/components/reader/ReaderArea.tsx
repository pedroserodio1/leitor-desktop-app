import React from 'react';
import { useReaderStore } from '../../store/readerStore';
import { PageView } from './PageView';
import { DualPageView } from './DualPageView';
import { VirtualizedScrollView } from './VirtualizedScrollView';
import { EmptyState } from './states/EmptyState.tsx';
import { LoadingState } from './states/LoadingState.tsx';
import { ErrorState } from './states/ErrorState.tsx';

export const ReaderArea: React.FC = () => {
    const { status, settings, adapterType } = useReaderStore();

    if (status === 'empty') return <EmptyState />;
    if (status === 'loading') return <LoadingState />;
    if (status === 'error') return <ErrorState />;

    // EPUB: apenas single mode (dual/scroll bloqueados por erros packaging e sandbox)
    const effectiveViewMode = adapterType === 'epub' ? 'single' : settings.viewMode;

    return (
        <div className="w-full h-full bg-white dark:bg-slate-900 overflow-hidden relative">
            {effectiveViewMode === 'single' && <PageView />}
            {effectiveViewMode === 'dual' && <DualPageView />}
            {effectiveViewMode === 'scroll' && <VirtualizedScrollView />}
        </div>
    );
};
