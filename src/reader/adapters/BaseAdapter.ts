import type { ReaderAdapter } from './ReaderAdapter';

/**
 * BaseAdapter — Abstract base class that provides:
 * 1. Page state tracking (currentPage, totalPages)
 * 2. Sliding-window page cache (current ± 1)
 * 3. Pre-render toggle
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
  protected maxCacheSize = 3; // current + prev + next
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

  // -------------------------------------------------------------------
  // Cache management — sliding window
  // -------------------------------------------------------------------

  /**
   * Evict pages that fall outside the window [current-1, current+1].
   * This keeps memory bounded to at most `maxCacheSize` rendered pages.
   */
  protected maintainCache(centerPage: number): void {
    const windowStart = Math.max(1, centerPage - 1);
    const windowEnd = Math.min(this.totalPages, centerPage + 1);

    for (const [key] of this.pageCache) {
      if (key < windowStart || key > windowEnd) {
        this.pageCache.delete(key);
      }
    }
  }

  /**
   * Pre-render adjacent pages (prev + next) in the background.
   * Runs after the current page is displayed, so it doesn't block the UI.
   */
  protected async preRender(centerPage: number): Promise<void> {
    const adjacentPages = [centerPage - 1, centerPage + 1].filter(
      (p) => p >= 1 && p <= this.totalPages && !this.pageCache.has(p)
    );

    // Render in parallel — each subclass's renderPage is independent
    const renders = adjacentPages.map(async (pageIndex) => {
      try {
        const node = await this.renderPage(pageIndex);
        // Only store if pre-render is still enabled (user might have toggled mid-render)
        if (this.preRenderEnabled) {
          this.pageCache.set(pageIndex, node);
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
  }
}
