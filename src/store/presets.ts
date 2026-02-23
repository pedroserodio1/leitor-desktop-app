import type { ProfilePreset, ReaderSettings } from '../types/reader';

export const presets: Record<ProfilePreset, Partial<ReaderSettings>> = {
  book: {
    viewMode: 'single',
    direction: 'ltr',
    zoom: 100,
    fontSize: 16,
  },
  manga: {
    viewMode: 'dual',
    direction: 'rtl',
    zoom: 100,
    fontSize: 16,
  },
  comic: {
    viewMode: 'dual',
    direction: 'ltr',
    zoom: 100,
    fontSize: 16,
  },
  pdf: {
    viewMode: 'single',
    direction: 'ltr',
    zoom: 100,
    fontSize: 16, // PDF typically scales via zoom, but we keep the structured type
  },
};
