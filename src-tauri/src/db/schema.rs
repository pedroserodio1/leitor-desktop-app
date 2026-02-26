//! Definição das tabelas e migrações do SQLite.
//! Estrutura preparada para futura sincronização (updated_at para LWW).

pub const SCHEMA_SQL: &str = r#"
-- Livros da biblioteca
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    path TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('folder', 'file')),
    added_at INTEGER NOT NULL,
    hash TEXT
);

-- Volumes (ex.: mangás)
CREATE TABLE IF NOT EXISTS volumes (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_volumes_book_id ON volumes(book_id);

-- Capítulos
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,
    volume_id TEXT NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    position INTEGER NOT NULL,
    FOREIGN KEY (volume_id) REFERENCES volumes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chapters_volume_id ON chapters(volume_id);

-- Progresso de leitura (um por volume)
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

-- Configurações por livro
CREATE TABLE IF NOT EXISTS book_settings (
    book_id TEXT PRIMARY KEY,
    layout_mode TEXT NOT NULL CHECK (layout_mode IN ('single', 'double', 'scroll')),
    reading_direction TEXT NOT NULL CHECK (reading_direction IN ('ltr', 'rtl')),
    zoom REAL NOT NULL DEFAULT 1.0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Configurações globais (única linha, id = 1)
CREATE TABLE IF NOT EXISTS global_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    theme TEXT,
    default_layout_mode TEXT,
    default_reading_direction TEXT,
    updated_at INTEGER NOT NULL
);

-- Inserir linha padrão de global_settings se não existir
INSERT OR IGNORE INTO global_settings (id, theme, default_layout_mode, default_reading_direction, updated_at)
VALUES (1, 'light', 'single', 'ltr', 0);
"#;

/// Migração: se a tabela reading_progress tiver schema antigo (current_volume_id), recria com PK (book_id, volume_id).
fn migrate_progress_per_volume(conn: &rusqlite::Connection) -> rusqlite::Result<()> {
    let has_old: bool = conn.query_row(
        "SELECT 1 FROM pragma_table_info('reading_progress') WHERE name='current_volume_id' LIMIT 1",
        [],
        |row| row.get(0),
    ).unwrap_or(false);
    if has_old {
        conn.execute_batch(
            r#"
            DROP TABLE IF EXISTS reading_progress;
            CREATE TABLE reading_progress (
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
            "#,
        )?;
    }
    Ok(())
}

/// Executa o schema (criação de tabelas) e migrações. Idempotente.
pub fn run_migrations(conn: &rusqlite::Connection) -> rusqlite::Result<()> {
    conn.execute_batch(SCHEMA_SQL)?;
    migrate_progress_per_volume(conn)?;
    Ok(())
}
