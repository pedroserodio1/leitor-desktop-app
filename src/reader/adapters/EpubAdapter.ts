import ePub from 'epubjs';
import type Book from 'epubjs/types/book';
import type Rendition from 'epubjs/types/rendition';
import { BaseAdapter } from './BaseAdapter';
import { useReaderStore } from '../../store/readerStore';

/**
 * EpubAdapter — Real epub.js integration
 *
 * Architecture:
 * - Always renders in paginated mode (flow: 'paginated')
 * - Generates locations for flat page indexing
 * - Maintains CFI tracking for position preservation
 * - On fontSize change: saves CFI, regenerates locations, remaps position
 *
 * Sandbox: O epub.js cria iframes com srcdoc; o navegador pode exibir
 * "Blocked script execution in 'about:srcdoc'..." se o EPUB contiver scripts.
 * O epub.js não expõe allowScriptedContent/sandbox em renderTo (ver
 * futurepress/epub.js#1083). A maioria dos EPUBs não usa scripts; o aviso
 * no console pode ser ignorado. EPUBs com scripts não terão interatividade.
 *
 * Fontes: EPUBs com fontes embedadas podem gerar "Failed to decode downloaded font"
 * ou "OTS parsing error: cmap" quando a fonte tem subtabelas não suportadas.
 * O browser faz fallback para fontes do sistema; o aviso no console pode ser ignorado.
 */
export class EpubAdapter extends BaseAdapter {
  private book: Book | null = null;
  private rendition: Rendition | null = null;
  private fontSize = 16;
  private currentCfi: string | null = null;
  private renditionContainer: HTMLElement | null = null;

  async load(source: string | string[] | ArrayBuffer): Promise<void> {
    this.destroyInternal();

    let src: string | Blob | ArrayBuffer = Array.isArray(source) ? source[0] : source;

    // epub.js tem bug com ArrayBuffer direto (book.ready não resolve).
    // Converter para Blob com type correto é a solução mais confiável.
    if (src instanceof ArrayBuffer) {
      src = new Blob([src], { type: 'application/epub+zip' });
    }

    try {
      // epub.js aceita Blob em runtime; tipos oficiais declaram apenas string | ArrayBuffer
      this.book = ePub(src as string | ArrayBuffer);
      await this.book.ready;

      // Characteres por "página" — valor maior = menos locations = carregamento mais rápido
      // 1600-2000 é bom equilíbrio entre velocidade e precisão
      await this.book.locations.generate(1600);
      this.totalPages = this.book.locations.length();
      this.currentPage = 1;
    } catch (err) {
      console.error('[EpubAdapter] load() ERRO:', err);
      throw err;
    }
  }

  async render(container: HTMLElement, pageIndex: number): Promise<void> {
    if (!this.book) throw new Error('EPUB book not loaded');

    this.container = container;
    this.currentPage = pageIndex;

    // Create rendition if not exists, or if container changed
    if (!this.rendition || this.renditionContainer !== container) {
      if (this.rendition) {
        this.rendition.destroy();
      }

      container.innerHTML = '';
      this.renditionContainer = container;

      // epub.js exige dimensões não-zero; sem isso o container fica vazio
      const w = Math.max(container.clientWidth || 400, 100);
      const h = Math.max(container.clientHeight || 600, 100);
      const viewMode = useReaderStore.getState().settings.viewMode;
      const useSpread = viewMode === 'dual';
      const useScrolled = viewMode === 'scroll';

      const direction = useReaderStore.getState().settings.direction;

      this.rendition = this.book.renderTo(container, {
        flow: useScrolled ? 'scrolled-doc' : 'paginated',
        width: w,
        height: h,
        spread: useSpread ? 'always' : 'none',
        defaultDirection: direction,
      });

      // Apply current font size
      this.rendition.themes.fontSize(`${this.fontSize}px`);

      // Register and apply EPUB themes (light, dark, sepia)
      this.registerThemes();
      this.applyEpubTheme(useReaderStore.getState().settings.epubTheme);

      // Listen for relocations to track current CFI and page
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.rendition.on('relocated', (location: any) => {
        if (location?.start?.cfi) {
          this.currentCfi = location.start.cfi;

          const locIndex = this.book!.locations.locationFromCfi(location.start.cfi);
          if (typeof locIndex === 'number' && locIndex >= 0) {
            this.currentPage = locIndex + 1; // 1-indexed
          }
        }
      });
    }

    // Navigate to the requested page via location index
    const viewMode = useReaderStore.getState().settings.viewMode;
    if (viewMode === 'scroll') {
      // scrolled-doc: mostrar do início
      await this.rendition.display();
    } else {
      const cfi = this.book.locations.cfiFromLocation(pageIndex - 1); // 0-indexed
      if (cfi) {
        await this.rendition.display(cfi);
      } else {
        await this.rendition.display();
      }
    }
  }

  protected async renderPage(pageIndex: number): Promise<HTMLElement> {
    // epub.js manages its own rendering via an iframe.
    // This method is required by BaseAdapter but won't be called for EPUB.
    const placeholder = document.createElement('div');
    placeholder.textContent = `EPUB Page ${pageIndex}`;
    return placeholder;
  }

  async goTo(pageIndex: number): Promise<void> {
    if (pageIndex < 1 || pageIndex > this.totalPages) return;
    if (this.container) {
      await this.render(this.container, pageIndex);
    }
  }

  async next(): Promise<void> {
    if (this.rendition) {
      await this.rendition.next();
    }
  }

  async prev(): Promise<void> {
    if (this.rendition) {
      await this.rendition.prev();
    }
  }

  setDirection(dir: 'ltr' | 'rtl'): void {
    if (this.rendition) {
      this.rendition.direction(dir);
    }
  }

  setEpubTheme(theme: 'light' | 'dark' | 'sepia' | 'system'): void {
    this.applyEpubTheme(theme);
  }

  private registerThemes(): void {
    if (!this.rendition) return;
    const themes = this.rendition.themes;
    themes.register('light', {
      body: {
        background: '#ffffff !important',
        color: '#18181b !important',
      },
      a: { color: '#3b82f6 !important' },
      'a:link': { color: '#3b82f6 !important', 'text-decoration': 'none !important' },
      img: { 'max-width': '100% !important' },
    });
    themes.register('dark', {
      body: {
        background: '#0f172a !important',
        color: '#e2e8f0 !important',
      },
      a: { color: '#93c5fd !important' },
      'a:link': { color: '#93c5fd !important', 'text-decoration': 'none !important' },
      img: { 'max-width': '100% !important' },
    });
    themes.register('sepia', {
      body: {
        background: '#f4ecd8 !important',
        color: '#5c4b37 !important',
      },
      a: { color: '#7c6b4a !important' },
      'a:link': { color: '#7c6b4a !important', 'text-decoration': 'none !important' },
      img: { 'max-width': '100% !important' },
    });
  }

  private resolveEpubTheme(theme: 'light' | 'dark' | 'sepia' | 'system'): 'light' | 'dark' | 'sepia' {
    if (theme !== 'system') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyEpubTheme(theme: 'light' | 'dark' | 'sepia' | 'system'): void {
    if (!this.rendition) return;
    const resolved = this.resolveEpubTheme(theme);
    this.rendition.themes.select(resolved);
  }

  async setFontSize(size: number): Promise<void> {
    if (!this.book || !this.rendition) return;

    // 1. Save current position
    const savedCfi = this.currentCfi;

    // 2. Update font size
    this.fontSize = size;
    this.rendition.themes.fontSize(`${size}px`);

    // 3. Regenerate locations (page count changes after reflow)
    await this.book.locations.generate(1600);
    this.totalPages = this.book.locations.length();

    // 4. Navigate back to saved position
    if (savedCfi) {
      await this.rendition.display(savedCfi);

      const locIndex = this.book.locations.locationFromCfi(savedCfi);
      if (typeof locIndex === 'number' && locIndex >= 0) {
        this.currentPage = locIndex + 1;
      }
    }
  }

  destroy(): void {
    this.destroyInternal();
  }

  private destroyInternal(): void {
    if (this.rendition) {
      this.rendition.destroy();
      this.rendition = null;
    }
    if (this.book) {
      this.book.destroy();
      this.book = null;
    }

    this.invalidateCache();
    this.currentCfi = null;
    this.renditionContainer = null;
    this.container = undefined;
    this.currentPage = 1;
    this.totalPages = 0;
  }
}
