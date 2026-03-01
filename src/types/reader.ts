export type ViewMode = 'single' | 'dual' | 'scroll';
export type AdapterType = 'pdf' | 'epub' | 'image' | 'cbz' | 'rar';
export type Direction = 'ltr' | 'rtl';
export type Theme = 'light' | 'dark' | 'system' | 'custom';
export type EpubTheme = 'light' | 'dark' | 'sepia' | 'system';
export type ProfilePreset = 'book' | 'manga' | 'comic' | 'pdf';
export type ReaderStatus = 'empty' | 'loading' | 'ready' | 'error';

export interface ReaderSettings {
  viewMode: ViewMode;
  direction: Direction;
  zoom: number; // percentage, e.g., 100
  fontSize: number; // in px, e.g., 16
  theme: Theme;
  customThemeId: string | null;
  epubTheme: EpubTheme;
  language: 'en' | 'pt-BR' | 'es';
  preRenderEnabled: boolean;
}

export interface ReaderState {
  settings: ReaderSettings;
  status: ReaderStatus;
  adapterType: AdapterType | null;
  currentPage: number;
  totalPages: number;
  title: string;
  errorMessage: string | null;
  sidebarOpen: boolean;
  settingsPanelOpen: boolean;
  /** Incremented when a custom theme is updated; triggers re-application in App */
  customThemeRefreshKey: number;

  // Actions
  setSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  applyPreset: (preset: ProfilePreset) => void;
  nextPage: () => void;
  prevPage: () => void;
  setStatus: (status: ReaderStatus) => void;
  setAdapterType: (type: AdapterType | null) => void;
  setTitle: (title: string) => void;
  setTotalPages: (pages: number) => void;
  setCurrentPage: (page: number) => void;
  toggleSidebar: () => void;
  toggleSettingsPanel: () => void;
  refreshCustomTheme: () => void;
}
