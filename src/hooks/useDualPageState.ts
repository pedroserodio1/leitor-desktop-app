import { useState, useCallback, useEffect, useRef } from 'react';

/** Diferença mínima (8%) no aspect ratio para considerar uma página "mais baixa" e exibir sozinha. */
const ASPECT_DIFF_THRESHOLD = 0.08;

/**
 * Aspect ratio intrínseco (altura/largura) do conteúdo.
 * Preferir naturalWidth/naturalHeight (estável); fallback para dimensões renderizadas.
 */
function getContentAspectRatio(container: HTMLDivElement): number {
  const img = container.querySelector('img');
  if (img) {
    if (img.naturalWidth > 0 && img.naturalHeight > 0)
      return img.naturalHeight / img.naturalWidth;
    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect.height / rect.width;
  }
  const canvas = container.querySelector('canvas');
  if (canvas) {
    if (canvas.width > 0 && canvas.height > 0)
      return canvas.height / canvas.width;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect.height / rect.width;
  }
  return 0;
}

export type DualDisplayMode = 'spread' | 'leftOnly' | 'rightOnly';

export interface UseDualPageStateParams {
  leftPage: number | null;
  rightPage: number | null;
  totalPages: number;
  /** Retorna aspect ratio em cache para displayMode instantâneo (evita travada inicial). */
  getCachedAspectRatio?: (pageIndex: number) => number | undefined;
}

export interface UseDualPageStateResult {
  displayMode: DualDisplayMode;
  onLeftRendered: (el: HTMLDivElement) => void;
  onRightRendered: (el: HTMLDivElement) => void;
}

/**
 * Mede aspect ratio das páginas left/right e determina se exibir spread ou uma página grande.
 * Evita race conditions usando refs e só atualiza estado após ambas medidas.
 */
export function useDualPageState({
  leftPage,
  rightPage,
  totalPages,
  getCachedAspectRatio,
}: UseDualPageStateParams): UseDualPageStateResult {
  const leftContainerRef = useRef<HTMLDivElement | null>(null);
  const rightContainerRef = useRef<HTMLDivElement | null>(null);
  const [leftAspect, setLeftAspect] = useState(0);
  const [rightAspect, setRightAspect] = useState(0);

  const measureBoth = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const l = leftContainerRef.current;
        const r = rightContainerRef.current;
        if (l && r) {
          const la = getContentAspectRatio(l);
          const ra = getContentAspectRatio(r);
          setLeftAspect(la);
          setRightAspect(ra);
        }
      });
    });
  }, []);

  const onLeftRendered = useCallback(
    (el: HTMLDivElement) => {
      leftContainerRef.current = el;
      if (rightContainerRef.current) measureBoth();
    },
    [measureBoth]
  );

  const onRightRendered = useCallback(
    (el: HTMLDivElement) => {
      rightContainerRef.current = el;
      if (leftContainerRef.current) measureBoth();
    },
    [measureBoth]
  );

  useEffect(() => {
    setLeftAspect(0);
    setRightAspect(0);
  }, [totalPages]);

  useEffect(() => {
    leftContainerRef.current = null;
    rightContainerRef.current = null;

    const cachedLeft = leftPage != null && getCachedAspectRatio ? getCachedAspectRatio(leftPage) : undefined;
    const cachedRight = rightPage != null && getCachedAspectRatio ? getCachedAspectRatio(rightPage) : undefined;

    if (cachedLeft != null && cachedRight != null && cachedLeft > 0 && cachedRight > 0) {
      setLeftAspect(cachedLeft);
      setRightAspect(cachedRight);
    } else {
      setLeftAspect(0);
      setRightAspect(0);
    }
  }, [leftPage, rightPage, getCachedAspectRatio]);

  const leftShorter =
    leftAspect > 0 &&
    rightAspect > 0 &&
    leftAspect <= rightAspect * (1 - ASPECT_DIFF_THRESHOLD);
  const rightShorter =
    rightAspect > 0 &&
    leftAspect > 0 &&
    rightAspect <= leftAspect * (1 - ASPECT_DIFF_THRESHOLD);
  const showOnlyOne = leftShorter || rightShorter;

  const displayMode: DualDisplayMode = showOnlyOne
    ? rightShorter
      ? 'rightOnly'
      : 'leftOnly'
    : 'spread';

  return {
    displayMode,
    onLeftRendered,
    onRightRendered,
  };
}
