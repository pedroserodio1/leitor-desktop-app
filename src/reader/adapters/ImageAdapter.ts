import { BaseAdapter } from './BaseAdapter';
import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * ImageAdapter — Real image loading for manga/comic pages
 *
 * Accepts an array of file paths from the Tauri file dialog.
 * Converts them to displayable URLs using Tauri's convertFileSrc().
 * Pre-loads adjacent images via Image() objects for instant display.
 */
export class ImageAdapter extends BaseAdapter {
  private imagePaths: string[] = [];
  private imageUrls: string[] = [];
  private preloadedImages: Map<number, HTMLImageElement> = new Map();

  async load(source: string | string[]): Promise<void> {
    const paths = typeof source === 'string' ? [source] : source;

    // Natural sort: page_2 before page_10
    this.imagePaths = paths.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    );

    // Convert file paths to URLs that the webview can display
    this.imageUrls = this.imagePaths.map((p) => {
      // If it's already a URL (http/https/blob), use as-is
      if (p.startsWith('http') || p.startsWith('blob:') || p.startsWith('data:')) {
        return p;
      }
      // For local files in Tauri, convert to asset protocol
      return convertFileSrc(p);
    });

    this.totalPages = this.imageUrls.length;
    this.currentPage = 1;

    // Pre-load the first few images
    if (this.preRenderEnabled && this.totalPages > 0) {
      await this.preloadImages([1, 2, 3].filter((p) => p <= this.totalPages));
    }
  }

  protected async renderPage(pageIndex: number): Promise<HTMLElement> {
    const imgSrc = this.imageUrls[pageIndex - 1]; // 1-indexed → 0-indexed

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;

    // Use pre-loaded image if available, otherwise create a new one
    let img = this.preloadedImages.get(pageIndex);

    if (!img) {
      img = new Image();
      img.src = imgSrc;
      await new Promise<void>((resolve, reject) => {
        img!.onload = () => resolve();
        img!.onerror = () => reject(new Error(`Failed to load image: ${imgSrc}`));
      });
    }

    const renderedImg = img.cloneNode(true) as HTMLImageElement;
    renderedImg.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    `;

    wrapper.appendChild(renderedImg);
    return wrapper;
  }

  destroy(): void {
    this.preloadedImages.forEach((img) => {
      img.src = '';
    });
    this.preloadedImages.clear();

    this.invalidateCache();
    this.imagePaths = [];
    this.imageUrls = [];
    this.container = undefined;
    this.currentPage = 1;
    this.totalPages = 0;
  }

  private async preloadImages(pageIndices: number[]): Promise<void> {
    const loads = pageIndices
      .filter((p) => !this.preloadedImages.has(p) && p >= 1 && p <= this.totalPages)
      .map(async (pageIndex) => {
        const src = this.imageUrls[pageIndex - 1];
        const img = new Image();
        img.src = src;

        try {
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
          });
          this.preloadedImages.set(pageIndex, img);
        } catch {
          // Silently skip — will be retried on render
        }
      });

    await Promise.allSettled(loads);
  }

  protected async preRender(centerPage: number): Promise<void> {
    const adjacent = [centerPage - 1, centerPage + 1].filter(
      (p) => p >= 1 && p <= this.totalPages
    );
    await this.preloadImages(adjacent);
    await super.preRender(centerPage);
  }
}
