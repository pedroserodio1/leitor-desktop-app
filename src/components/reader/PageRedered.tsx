import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { useReaderStore } from '../../store/readerStore';

interface PageRendererProps {
    pageNum: number;
    /** Chamado após o conteúdo ser renderizado (para medir altura no modo duplo). */
    onRendered?: (container: HTMLDivElement) => void;
}

export const PageRenderer: React.FC<PageRendererProps> = ({ pageNum, onRendered }) => {
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
        const el = containerRef.current;
        renderToContainer(el, pageNum).then(() => {
            if (!el || !onRendered) return;
            requestAnimationFrame(() => {
                if (el.isConnected) onRendered(el);
            });
        });
    }, [pageNum, renderToContainer, hasDimensions, adapterType, onRendered]);

    return <div ref={containerRef} className="w-full h-full min-h-[200px] flex items-center justify-center" />;
};