import { useCallback } from 'react';
import { useReaderStore } from '../store/readerStore';
import type { ViewMode } from '../types/reader';
import type { DualDisplayMode } from './useDualPageState';

export interface UseReaderNavigationParams {
  viewMode: ViewMode;
  dualDisplayMode?: DualDisplayMode;
  /** page1 do spread (ímpar em LTR) */
  page1: number;
  /** página esquerda no layout (pode ser page2 em RTL) */
  leftPage: number | null;
  /** página direita no layout (pode ser page1 em RTL) */
  rightPage: number | null;
}

export interface UseReaderNavigationResult {
  handlePrev: () => void;
  handleNext: () => void;
  goToPage: (page: number) => void;
  effectiveStep: number;
}

/**
 * Centraliza toda a lógica de navegação prev/next/spread/one-large.
 * Corrige o bug em dual-leftOnly quando currentPage === rightPage (usuário travava).
 */
export function useReaderNavigation({
  viewMode,
  dualDisplayMode = 'spread',
  page1,
  leftPage,
  rightPage,
}: UseReaderNavigationParams): UseReaderNavigationResult {
  const {
    currentPage,
    totalPages,
    prevPage,
    nextPage,
    setCurrentPage,
  } = useReaderStore();

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [setCurrentPage, totalPages]
  );

  const handlePrev = useCallback(() => {
    if (viewMode !== 'dual') {
      prevPage();
      return;
    }
    if (dualDisplayMode === 'rightOnly' && rightPage != null && leftPage != null) {
      setCurrentPage(leftPage);
      return;
    }
    if (dualDisplayMode === 'leftOnly') {
      setCurrentPage(Math.max(1, page1 - 2));
      return;
    }
    prevPage();
  }, [
    viewMode,
    dualDisplayMode,
    leftPage,
    rightPage,
    page1,
    prevPage,
    setCurrentPage,
  ]);

  const handleNext = useCallback(() => {
    if (viewMode !== 'dual') {
      nextPage();
      return;
    }
    if (dualDisplayMode === 'leftOnly' && rightPage != null) {
      if (currentPage !== rightPage) {
        setCurrentPage(rightPage);
      } else {
        nextPage();
      }
      return;
    }
    if (dualDisplayMode === 'rightOnly' && rightPage != null) {
      setCurrentPage(rightPage + 1);
      return;
    }
    nextPage();
  }, [
    viewMode,
    dualDisplayMode,
    currentPage,
    rightPage,
    nextPage,
    setCurrentPage,
  ]);

  const effectiveStep =
    viewMode === 'dual' && dualDisplayMode === 'spread' ? 2 : 1;

  return {
    handlePrev,
    handleNext,
    goToPage,
    effectiveStep,
  };
}
