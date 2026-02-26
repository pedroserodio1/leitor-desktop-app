/**
 * Tipos que espelham os models Rust da camada SQLite.
 * Usados nas chamadas invoke ao backend.
 */

export interface DbBook {
  id: string;
  title: string;
  path: string;
  type: string;
  added_at: number;
  hash: string | null;
  author?: string | null;
  description?: string | null;
  cover_path?: string | null;
}

export interface UpdateBookPayload {
  book_id: string;
  title: string;
  author?: string | null;
  description?: string | null;
  cover_path?: string | null;
}

export interface DbVolume {
  id: string;
  book_id: string;
  name: string;
}

export interface DbChapter {
  id: string;
  volume_id: string;
  name: string;
  path: string;
  position: number;
}

export interface BookWithVolumes {
  book: DbBook;
  volumes: VolumeWithChaptersOut[];
}

export interface VolumeWithChaptersOut {
  volume: DbVolume;
  chapters: DbChapter[];
}

export interface AddBookPayload {
  book: {
    id: string;
    title: string;
    path: string;
    type: string;
    added_at: number;
    hash?: string | null;
  };
  volumes: {
    id: string;
    book_id: string;
    name: string;
    chapters: {
      id: string;
      volume_id: string;
      name: string;
      path: string;
      position: number;
    }[];
  }[];
}

export interface ReadingProgress {
  book_id: string;
  volume_id: string;
  current_chapter_id: string | null;
  page_index: number;
  scroll_offset: number;
  updated_at: number;
}

export interface BookSettings {
  book_id: string;
  layout_mode: string;
  reading_direction: string;
  zoom: number;
  updated_at: number;
}

export interface GlobalSettings {
  id: number;
  theme: string | null;
  default_layout_mode: string | null;
  default_reading_direction: string | null;
  updated_at: number;
}

export interface SaveGlobalSettingsPayload {
  theme?: string | null;
  default_layout_mode?: string | null;
  default_reading_direction?: string | null;
}
