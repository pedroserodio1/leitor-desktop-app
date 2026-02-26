/**
 * Script para popular o banco de dados com um livro de teste para E2E.
 * Executa antes dos testes para que a biblioteca tenha conteúdo.
 */
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..', '..');
const projectDirs = path.join(rootDir, 'fixtures', 'e2e-book', 'volume1');
const pagePath = path.join(projectDirs, 'page.png');

if (!fs.existsSync(pagePath)) {
  console.error('[seed-db] Fixture não encontrado:', pagePath);
  process.exit(1);
}

let dbPath;
if (process.platform === 'win32') {
  dbPath = path.join(process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming'), 'com.serodio.leitor', 'leitor.db');
} else if (process.platform === 'darwin') {
  dbPath = path.join(process.env.HOME, 'Library', 'Application Support', 'com.serodio.leitor', 'leitor.db');
} else {
  dbPath = path.join(process.env.XDG_DATA_HOME || path.join(process.env.HOME, '.local', 'share'), 'com.serodio.leitor', 'leitor.db');
}

const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

let Database;
try {
  Database = require('better-sqlite3');
} catch {
  console.error('[seed-db] better-sqlite3 não instalado. Execute: cd e2e-tests && npm install');
  process.exit(1);
}

const conn = new Database(dbPath);

const schema = `
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
  added_at INTEGER NOT NULL,
  hash TEXT
);
CREATE TABLE IF NOT EXISTS volumes (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  volume_id TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reading_progress (
  book_id TEXT NOT NULL,
  volume_id TEXT NOT NULL,
  current_chapter_id TEXT,
  page_index INTEGER NOT NULL DEFAULT 1,
  scroll_offset REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (book_id, volume_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS book_settings (
  book_id TEXT PRIMARY KEY,
  layout_mode TEXT NOT NULL,
  reading_direction TEXT NOT NULL,
  zoom REAL NOT NULL DEFAULT 1.0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS global_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  theme TEXT,
  default_layout_mode TEXT,
  default_reading_direction TEXT,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO global_settings (id, theme, default_layout_mode, default_reading_direction, updated_at)
VALUES (1, 'light', 'single', 'ltr', 0);
`;

conn.exec(schema);

const bookId = 'e2e-test-book';
const volumeId = 'e2e-test-volume';
const chapterId = 'e2e-test-chapter';
const bookPath = path.resolve(projectDirs).replace(/\\/g, '/');
const chapterPath = path.resolve(pagePath).replace(/\\/g, '/');
const addedAt = Date.now();

conn.prepare('DELETE FROM books WHERE id = ?').run(bookId);

const insertBook = conn.prepare(`
  INSERT INTO books (id, title, path, type, added_at, hash) VALUES (?, ?, ?, 'folder', ?, NULL)
`);
insertBook.run(bookId, 'E2E Test Book', bookPath, addedAt);

const insertVolume = conn.prepare(`
  INSERT INTO volumes (id, book_id, name) VALUES (?, ?, ?)
`);
insertVolume.run(volumeId, bookId, 'Volume 1');

const insertChapter = conn.prepare(`
  INSERT INTO chapters (id, volume_id, name, path, position) VALUES (?, ?, ?, ?, 0)
`);
insertChapter.run(chapterId, volumeId, 'page', chapterPath);

conn.close();
console.log('[seed-db] Banco populado com livro de teste em', dbPath);
