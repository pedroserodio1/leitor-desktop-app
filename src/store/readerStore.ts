import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReaderState, ReaderStatus, ProfilePreset } from '../types/reader';
import { presets } from './presets';

export const useReaderStore = create<ReaderState>()(
  persist(
    (set) => ({
      settings: {
        viewMode: 'single',
        direction: 'ltr',
        zoom: 100,
        fontSize: 16,
        theme: 'light',
        customThemeId: null,
        epubTheme: 'light',
        language: 'en',
        preRenderEnabled: true,
      },
      status: 'empty',
      adapterType: null,
      currentPage: 1,
      totalPages: 0,
      title: '',
      errorMessage: null,
      sidebarOpen: true,
      settingsPanelOpen: false,
      customThemeRefreshKey: 0,

      setSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value,
          },
        })),

      applyPreset: (preset: ProfilePreset) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...presets[preset],
          },
        })),

      nextPage: () =>
        set((state) => {
          const step = state.settings.viewMode === 'dual' ? 2 : 1;
          return {
            currentPage: Math.min(state.currentPage + step, Math.max(1, state.totalPages)),
          };
        }),

      prevPage: () =>
        set((state) => {
          const step = state.settings.viewMode === 'dual' ? 2 : 1;
          return {
            currentPage: Math.max(1, state.currentPage - step),
          };
        }),

      setStatus: (status: ReaderStatus) => set({ status }),

      setAdapterType: (adapterType) => set({ adapterType }),

      setTitle: (title: string) => set({ title }),

      setTotalPages: (totalPages: number) => set({ totalPages }),

      setCurrentPage: (currentPage: number) => set({ currentPage }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      toggleSettingsPanel: () =>
        set((state) => ({ settingsPanelOpen: !state.settingsPanelOpen })),

      refreshCustomTheme: () =>
        set((state) => ({ customThemeRefreshKey: (state.customThemeRefreshKey ?? 0) + 1 })),
    }),
    {
      name: 'reader-storage',
      // Only persist user settings (theme, language, zoom, etc.)
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
