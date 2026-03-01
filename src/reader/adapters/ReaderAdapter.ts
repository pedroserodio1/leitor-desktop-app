export interface ReaderAdapter {
  
  load(source: string | string[] | Uint8Array | ArrayBuffer): Promise<void>;

  render(container: HTMLElement, pageIndex: number): Promise<void>;

  goTo(pageIndex: number): Promise<void>;

  next(): Promise<void>;

  prev(): Promise<void>;

  getTotalPages(): number;

  getCurrentPage(): number;

  /** Aspect ratio em cache (altura/largura). Usado para displayMode instantâneo no dual page. */
  getPageAspectRatio?(pageIndex: number): number | undefined;

  setZoom?(zoom: number): Promise<void>;

  setFontSize?(size: number): Promise<void>;

  setDirection?(dir: 'ltr' | 'rtl'): void;

  setEpubTheme?(theme: 'light' | 'dark' | 'sepia' | 'system'): void;

  setPreRender(enabled: boolean): void;

  destroy(): void;
}
