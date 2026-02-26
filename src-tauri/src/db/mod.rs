//! Camada de acesso a dados: conexão e schema SQLite.

mod connection;
mod schema;

pub use connection::{app_db_path, open};
pub use schema::{run_migrations, SCHEMA_SQL};
