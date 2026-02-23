export interface ReaderAdapter {
  
  load(source: string | string[] | Uint8Array | ArrayBuffer): Promise<void>;

  render(container: HTMLElement, pageIndex: number): Promise<void>;

  goTo(pageIndex: number): Promise<void>;

  next(): Promise<void>;

  prev(): Promise<void>;

  getTotalPages(): number;

  getCurrentPage(): number;

  setZoom?(zoom: number): Promise<void>;

  setFontSize?(size: number): Promise<void>;

  setDirection?(dir: 'ltr' | 'rtl'): void;

  setPreRender(enabled: boolean): void;

  destroy(): void;
}
