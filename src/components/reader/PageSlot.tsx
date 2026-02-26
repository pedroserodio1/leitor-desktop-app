import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useReaderAdapterContext } from '../../reader/ReaderAdapterContext';
import { useReaderStore } from '../../store/readerStore';

export interface PageSlotProps {
  pageNum: number;
  /** Chamado após o conteúdo ser renderizado (para medir aspect ratio no modo dual). */
  onRendered?: (container: HTMLDivElement) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Slot único para renderizar uma página. Usado por Single, Dual e Scroll (virtualizado).
 * Substitui PageRenderer e PageItem com uma implementação unificada.
 */
export const PageSlot: React.FC<PageSlotProps> = ({
  pageNum,
  onRendered,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasDimensions, setHasDimensions] = useState(false);
  const adapterType = useReaderStore((s) => s.adapterType);
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

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[200px] flex items-center justify-center overflow-hidden ${className}`.trim()}
      style={style}
    />
  );
};
