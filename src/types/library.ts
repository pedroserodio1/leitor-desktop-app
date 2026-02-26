/**
 * Biblioteca — Estrutura de dados para livros importados
 *
 * Preparado para futura expansão: metadados, capa, SHA-256, SQLite
 */

export interface Chapter {
  id: string;
  name: string;
  path: string;
}

export interface Volume {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface LibraryBook {
  id: string;
  title: string;
  path: string;
  type: "folder" | "file";
  volumes: Volume[];
  addedAt: number;
  /** Capa customizada ou derivada do primeiro capítulo */
  coverPath?: string;
  /** Autor (editável) */
  author?: string;
  /** Descrição/sinopse (editável) */
  description?: string;
}

/** Seleção para abrir no leitor: volume inteiro ou capítulo específico */
export interface LibrarySelection {
  book: LibraryBook;
  volumeIndex: number;
  chapterIndex?: number; // se omitido, carrega o volume inteiro
}
