import React, { useEffect, useRef } from 'react';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';

interface PageItemProps {
    pageNum: number;
    zoom: number;
}

export const PageItem: React.FC<PageItemProps> = ({ pageNum, zoom }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { renderToContainer } = useReaderAdapterContext();

    useEffect(() => {
        if (containerRef.current) {
            // Limpa o container antes de renderizar para não duplicar
            containerRef.current.innerHTML = ''; 
            renderToContainer(containerRef.current, pageNum);
        }
    }, [pageNum, renderToContainer, zoom]); // Re-renderiza se o zoom mudar

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center overflow-hidden shadow-inner bg-white dark:bg-slate-900"
        />
    );
};