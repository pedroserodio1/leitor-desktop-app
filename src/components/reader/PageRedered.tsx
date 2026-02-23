import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { useReaderStore } from '../../store/readerStore';

export const PageRenderer: React.FC<{ pageNum: number }> = ({ pageNum }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasDimensions, setHasDimensions] = useState(false);
    const adapterType = useReaderStore((s) => s.adapterType);
    const { renderToContainer } = useReaderAdapterContext();

    // EPUB exige container com dimensões; aguardar layout (useLayoutEffect = mais cedo)
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
        // EPUB: não limpar — o rendition gerencia o iframe; limpar quebra o estado
        if (adapterType !== 'epub') {
            containerRef.current.innerHTML = '';
        }
        renderToContainer(containerRef.current, pageNum);
    }, [pageNum, renderToContainer, hasDimensions, adapterType]);

    return <div ref={containerRef} className="w-full h-full min-h-[200px] flex items-center justify-center" />;
};