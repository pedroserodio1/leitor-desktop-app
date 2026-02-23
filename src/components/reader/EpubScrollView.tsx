import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { useReaderStore } from '../../store/readerStore';

/**
 * Scroll view para EPUB: uma única container com flow scrolled-doc.
 * O epub.js não suporta múltiplas renditions simultâneas (ScrollView normal
 * usa vários PageItems, o que causa o erro "Cannot read properties of undefined (reading 'package')").
 */
export const EpubScrollView: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasDimensions, setHasDimensions] = useState(false);
    const { renderToContainer } = useReaderAdapterContext();

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const check = () => {
            if (el.clientWidth > 0 && el.clientHeight > 0) {
                setHasDimensions(true);
                return true;
            }
            return false;
        };

        if (check()) return;

        const ro = new ResizeObserver(() => {
            if (check()) ro.disconnect();
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        if (!hasDimensions || !containerRef.current) return;
        // pageIndex 1 — scrolled-doc mostra o documento inteiro a partir do início
        renderToContainer(containerRef.current, 1);
    }, [renderToContainer, hasDimensions]);

    const direction = useReaderStore((s) => s.settings.direction);
    return (
        <div className="w-full h-full overflow-y-auto overflow-x-hidden bg-white dark:bg-slate-900 flex justify-center py-[10%] px-[10%] box-border" dir={direction ?? 'ltr'}>
            <div
                ref={containerRef}
                className="reader-page-view min-h-full w-full max-w-[80%] bg-white dark:bg-slate-900"
                style={{ minHeight: '80vh' }}
            />
        </div>
    );
};
