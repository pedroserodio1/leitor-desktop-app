import type { ReaderAdapter } from './ReaderAdapter';

/**
 * Extrai aspect ratio (altura/largura) de um nó DOM (img ou canvas).
 */
function getContentAspectRatio(node: HTMLElement): number {
  const img = node.querySelector('img');
  if (img) {
    if (img.naturalWidth > 0 && img.naturalHeight > 0)
      return img.naturalHeight / img.naturalWidth;
    const rect = img.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect.height / rect.width;
  }
  const canvas = node.querySelector('canvas');
  if (canvas) {
    if (canvas.width > 0 && canvas.height > 0)
      return canvas.height / canvas.width;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return rect.height / rect.width;
  }
  return 0;
}

/**
 * BaseAdapter — Abstract base class that provides:
 * 1. Page state tracking (currentPage, totalPages)
 * 2. Sliding-window page cache (current ± 3)
 * 3. Pre-render toggle
 * 4. Aspect ratio cache para displayMode instantâneo no dual page
 *
 * Subclasses must implement:
 * - load()
 * - renderPage() — the engine-specific rendering of a single page
 * - destroy()
 *
 * The cache stores rendered HTMLElement snapshots keyed by page index.
 * When preRenderEnabled is false, the cache is bypassed entirely
 * and only the requested page is rendered on demand.
 */
export abstract class BaseAdapter implements ReaderAdapter {
  protected currentPage = 1;
  protected totalPages = 0;
  protected container?: HTMLElement;

  // --- Cache ---
  protected pageCache: Map<number, HTMLElement> = new Map();
  protected aspectRatioCache: Map<number, number> = new Map();
  protected preRenderEnabled = true;

  // -------------------------------------------------------------------
  // Abstract — subclasses MUST implement these
  // -------------------------------------------------------------------

  abstract load(source: string | string[]): Promise<void>;

  /**
   * Engine-specific: render page `pageIndex` and return a detached DOM node.
   * This is the only method a subclass MUST produce — everything else is handled
   * by BaseAdapter's orchestration logic.
   */
  protected abstract renderPage(pageIndex: number): Promise<HTMLElement>;

  abstract destroy(): void;

  // -------------------------------------------------------------------
  // Implemented by BaseAdapter
  // -------------------------------------------------------------------

  async render(container: HTMLElement, pageIndex: number): Promise<void> {
    this.container = container;
    this.currentPage = pageIndex;

    // Clear previous content
    container.innerHTML = '';

    // Try cache first
    let node = this.pageCache.get(pageIndex);

    if (!node) {
      // Cache miss → render fresh
      node = await this.renderPage(pageIndex);

      if (this.preRenderEnabled) {
        this.pageCache.set(pageIndex, node);
        const ar = getContentAspectRatio(node);
        if (ar > 0) this.aspectRatioCache.set(pageIndex, ar);
      }
    }

    // Clone into container so the cache keeps its own copy
    container.appendChild(node.cloneNode(true));

    // Maintain cache window & pre-render adjacent pages
    if (this.preRenderEnabled) {
      this.maintainCache(pageIndex);
      this.preRender(pageIndex);
    }
  }

  async goTo(pageIndex: number): Promise<void> {
    if (pageIndex < 1 || pageIndex > this.totalPages) return;
    this.currentPage = pageIndex;

    if (this.container) {
      await this.render(this.container, pageIndex);
    }
  }

  async next(): Promise<void> {
    if (this.currentPage < this.totalPages) {
      await this.goTo(this.currentPage + 1);
    }
  }

  async prev(): Promise<void> {
    if (this.currentPage > 1) {
      await this.goTo(this.currentPage - 1);
    }
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  setPreRender(enabled: boolean): void {
    this.preRenderEnabled = enabled;

    if (!enabled) {
      // Immediately drop all cached pages to free memory
      this.invalidateCache();
    }
  }

  /**
   * Retorna aspect ratio em cache (se disponível) para displayMode instantâneo no dual page.
   */
  getPageAspectRatio(pageIndex: number): number | undefined {
    return this.aspectRatioCache.get(pageIndex);
  }

  // -------------------------------------------------------------------
  // Cache management — sliding window (3 atrás, 3 à frente)
  // -------------------------------------------------------------------

  /**
   * Evict pages outside the window [current-3, current+3].
   */
  protected maintainCache(centerPage: number): void {
    const windowStart = Math.max(1, centerPage - 3);
    const windowEnd = Math.min(this.totalPages, centerPage + 3);

    for (const [key] of this.pageCache) {
      if (key < windowStart || key > windowEnd) {
        this.pageCache.delete(key);
        this.aspectRatioCache.delete(key);
      }
    }
  }

  /**
   * Pre-render 3 páginas atrás e 3 à frente para troca fluida e cálculo antecipado.
   */
  protected async preRender(centerPage: number): Promise<void> {
    const adjacentPages = [
      centerPage - 3,
      centerPage - 2,
      centerPage - 1,
      centerPage + 1,
      centerPage + 2,
      centerPage + 3,
    ].filter((p) => p >= 1 && p <= this.totalPages && !this.pageCache.has(p));

    // Render in parallel — each subclass's renderPage is independent
    const renders = adjacentPages.map(async (pageIndex) => {
      try {
        const node = await this.renderPage(pageIndex);
        if (this.preRenderEnabled) {
          this.pageCache.set(pageIndex, node);
          const ar = getContentAspectRatio(node);
          if (ar > 0) this.aspectRatioCache.set(pageIndex, ar);
        }
      } catch {
        // Silently skip failed pre-renders — they'll be retried on demand
      }
    });

    await Promise.allSettled(renders);
  }

  /**
   * Clear all cached pages. Called when:
   * - Font size changes (EPUB reflow)
   * - Zoom changes (PDF re-render at new scale)
   * - Pre-render is disabled
   */
  protected invalidateCache(): void {
    this.pageCache.clear();
    this.aspectRatioCache.clear();
  }
}
