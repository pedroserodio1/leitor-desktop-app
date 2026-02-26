//! Temporary extraction of CBZ (ZIP) and RAR archives for reading.
//! Extracted images are stored in a temp dir and must be deleted when the reader closes.
//! RAR uses 7-Zip bundled with the app (resources/7z/) so the user does not need to install anything.

use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Manager;
use tauri::path::BaseDirectory;
use zip::ZipArchive;

const IMAGE_EXT: [&str; 7] = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"];

fn is_image(name: &str) -> bool {
    let ext = Path::new(name)
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();
    IMAGE_EXT.contains(&ext.as_str())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArchiveExtracted {
    pub temp_dir: String,
    pub paths: Vec<String>,
}

/// Extract a ZIP/CBZ archive to a temp directory and return the temp dir path and sorted image paths.
fn extract_zip(archive_path: &str) -> Result<ArchiveExtracted, String> {
    let path = Path::new(archive_path);
    if !path.exists() {
        return Err("Archive file not found".to_string());
    }

    let file = File::open(path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(BufReader::new(file)).map_err(|e| e.to_string())?;

    let temp_dir = std::env::temp_dir()
        .join("leitor")
        .join(format!("{:x}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos()));
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let mut image_paths: Vec<PathBuf> = Vec::new();

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = entry.name().to_string();
        if entry.is_dir() {
            let out_path = temp_dir.join(&name);
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
            continue;
        }
        if !is_image(&name) {
            continue;
        }
        let out_path = temp_dir.join(&name);
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let mut out_file = File::create(&out_path).map_err(|e| e.to_string())?;
        std::io::copy(&mut entry, &mut out_file).map_err(|e| e.to_string())?;
        image_paths.push(out_path);
    }

    image_paths.sort_by(|a, b| {
        natord::compare(a.to_string_lossy().as_ref(), b.to_string_lossy().as_ref())
    });

    let paths: Vec<String> = image_paths
        .into_iter()
        .filter_map(|p| p.to_str().map(String::from))
        .collect();

    if paths.is_empty() {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err("No image files found in archive".to_string());
    }

    Ok(ArchiveExtracted {
        temp_dir: temp_dir.to_str().unwrap_or("").to_string(),
        paths,
    })
}

/// Find 7z executable: bundled (resources/7z/), then PATH, then Windows Program Files.
/// Prefer 7z.exe (supports RAR); fallback to 7za.exe (no RAR, but works for other formats).
fn find_7z(app: &tauri::AppHandle) -> Option<(PathBuf, Option<PathBuf>)> {
    let exe_names: Vec<&str> = if cfg!(target_os = "windows") {
        vec!["7z.exe", "7za.exe"]
    } else {
        vec!["7z", "7za"]
    };
    // 1) Bundled with the app (no user installation)
    for exe_name in &exe_names {
        if let Ok(bundled) = app.path().resolve(format!("7z/{}", exe_name), BaseDirectory::Resource) {
            if bundled.exists() {
                let work_dir = bundled.parent().map(PathBuf::from);
                return Some((bundled, work_dir));
            }
        }
    }
    // 2) In PATH
    if which_7z().is_some() {
        return which_7z().map(|p| (p, None));
    }
    // 3) Windows: common install paths
    if cfg!(target_os = "windows") {
        for base in ["C:\\Program Files\\7-Zip\\7z.exe", "C:\\Program Files (x86)\\7-Zip\\7z.exe"] {
            let p = PathBuf::from(base);
            if p.exists() {
                return Some((p, None));
            }
        }
    }
    None
}

fn which_7z() -> Option<PathBuf> {
    let name = if cfg!(target_os = "windows") { "7z.exe" } else { "7z" };
    Command::new(name).arg("--help").output().ok().filter(|o| o.status.success())?;
    Some(PathBuf::from(name))
}

/// Extract a RAR archive using bundled 7z or system 7z/unrar. Returns temp dir and image paths.
fn extract_rar(app: &tauri::AppHandle, archive_path: &str) -> Result<ArchiveExtracted, String> {
    let path = Path::new(archive_path);
    if !path.exists() {
        return Err("Archive file not found".to_string());
    }

    let temp_dir = std::env::temp_dir()
        .join("leitor")
        .join(format!("rar_{:x}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos()));
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    let out_dir = format!("-o{}", temp_dir.to_str().unwrap());

    let (exe, work_dir) = find_7z(app).ok_or_else(|| {
        let _ = fs::remove_dir_all(&temp_dir);
        "RAR: coloque 7z.exe e 7z.dll em resources/7z/ (7za não abre RAR). Veja README na pasta.".to_string()
    })?;

    // 7za não suporta RAR; só 7z.exe + 7z.dll suportam
    let exe_str = exe.to_string_lossy();
    if exe_str.contains("7za") && archive_path.to_lowercase().ends_with(".rar") {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err("Para abrir RAR, use 7z.exe e 7z.dll (não 7za). Coloque em resources/7z/. Veja README.".to_string());
    }

    let mut cmd = Command::new(&exe);
    cmd.args(["x", archive_path, out_dir.as_str(), "-y"]);
    if let Some(dir) = work_dir {
        cmd.current_dir(dir);
    }

    let out = cmd.output().map_err(|e| {
        let _ = fs::remove_dir_all(&temp_dir);
        format!("Erro ao executar 7-Zip: {}", e)
    })?;

    if !out.status.success() {
        let _ = fs::remove_dir_all(&temp_dir);
        let stderr = String::from_utf8_lossy(&out.stderr);
        return Err(format!("Falha ao extrair RAR: {}", stderr.trim()));
    }

    // List image files in temp dir (recursive)
    let mut image_paths: Vec<PathBuf> = Vec::new();
    walk_dir(&temp_dir, &mut image_paths)?;
    image_paths.sort_by(|a, b| {
        natord::compare(a.to_string_lossy().as_ref(), b.to_string_lossy().as_ref())
    });

    let paths: Vec<String> = image_paths
        .into_iter()
        .filter_map(|p| p.to_str().map(String::from))
        .collect();

    if paths.is_empty() {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err("No image files found in RAR archive".to_string());
    }

    Ok(ArchiveExtracted {
        temp_dir: temp_dir.to_str().unwrap_or("").to_string(),
        paths,
    })
}

fn walk_dir(dir: &Path, out: &mut Vec<PathBuf>) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            walk_dir(&path, out)?;
        } else if path.is_file() {
            let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if is_image(name) {
                out.push(path);
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn extract_archive(app: tauri::AppHandle, archive_path: String) -> Result<ArchiveExtracted, String> {
    let path = archive_path.to_lowercase();
    if path.ends_with(".cbz") || path.ends_with(".zip") {
        extract_zip(&archive_path)
    } else if path.ends_with(".rar") {
        extract_rar(&app, &archive_path)
    } else {
        Err("Unsupported archive format. Use .cbz, .zip or .rar".to_string())
    }
}

#[tauri::command]
pub fn delete_temp_dir(temp_dir: String) -> Result<(), String> {
    let path = Path::new(&temp_dir);
    if path.exists() && path.starts_with(std::env::temp_dir()) {
        fs::remove_dir_all(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
