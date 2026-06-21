#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{Cursor, Read, Write};
use std::path::Path;
use std::{env, fs, thread, time};

const ENGINE_VERSION_FILE: &str = ".reader-engine";

fn find_zip_offset(data: &[u8]) -> Option<usize> {
    let eocd_sig = [0x50, 0x4b, 0x05, 0x06];
    let search_start = if data.len() > 65557 {
        data.len() - 65557
    } else {
        0
    };
    for i in (search_start..data.len() - 3).rev() {
        if data[i..i + 4] == eocd_sig {
            if i + 22 > data.len() {
                continue;
            }
            let cd_size = u32::from_le_bytes([
                data[i + 12],
                data[i + 13],
                data[i + 14],
                data[i + 15],
            ]) as usize;
            let cd_offset = u32::from_le_bytes([
                data[i + 16],
                data[i + 17],
                data[i + 18],
                data[i + 19],
            ]) as usize;
            let comment_len = u16::from_le_bytes([data[i + 20], data[i + 21]]) as usize;
            let eocd_size = 22 + comment_len;
            if i + eocd_size != data.len() {
                continue;
            }
            let zip_start = i as i64 - cd_size as i64 - cd_offset as i64;
            if zip_start >= 0 {
                return Some(zip_start as usize);
            }
        }
    }
    None
}

fn zip_fingerprint(exe_data: &[u8]) -> Option<u64> {
    let offset = find_zip_offset(exe_data)?;
    let len = exe_data.len() - offset;
    Some((offset as u64) << 32 | (len as u64))
}

fn read_stored_fingerprint(path: &Path) -> Option<u64> {
    let mut s = String::new();
    fs::File::open(path).ok()?.read_to_string(&mut s).ok()?;
    s.trim().parse::<u64>().ok()
}

fn write_fingerprint(path: &Path, fp: u64) {
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let mut f = fs::File::create(path).expect("Failed to write engine version file");
    write!(f, "{}", fp).expect("Failed to write fingerprint");
}

fn remove_dir_all(path: &Path) {
    if let Err(e) = fs::remove_dir_all(path) {
        eprintln!("Warning: could not remove old engine: {}", e);
    }
}

fn extract_archive(exe_path: &Path, engine_dir: &Path) {
    let exe_data = fs::read(exe_path).expect("Failed to read self");
    let zip_offset = find_zip_offset(&exe_data).expect("No appended ZIP archive found");
    let cursor = Cursor::new(&exe_data[zip_offset..]);
    let mut archive = zip::ZipArchive::new(cursor).expect("Failed to parse ZIP archive");
    fs::create_dir_all(engine_dir).expect("Failed to create engine directory");
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).expect("Failed to read ZIP entry");
        let name = entry.name().replace('\\', "/");
        let out_path = engine_dir.join(&name);
        if name.ends_with('/') {
            fs::create_dir_all(&out_path).expect("Failed to create directory");
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).expect("Failed to create parent directory");
            }
            let mut out = fs::File::create(&out_path).expect("Failed to create output file");
            std::io::copy(&mut entry, &mut out).expect("Failed to write file");
        }
    }
}

fn main() {
    let exe_path = env::current_exe().expect("Failed to get executable path");
    let exe_dir = exe_path.parent().expect("Failed to get executable directory");
    let engine_dir = exe_dir.join("engine");
    let version_file = engine_dir.join(ENGINE_VERSION_FILE);

    let exe_data = fs::read(&exe_path).expect("Failed to read self");
    let current_fp = zip_fingerprint(&exe_data).expect("No embedded archive found");
    let stored_fp = read_stored_fingerprint(&version_file);

    if stored_fp != Some(current_fp) {
        remove_dir_all(&engine_dir);
        extract_archive(&exe_path, &engine_dir);
        write_fingerprint(&version_file, current_fp);
    }

    let reader_exe = engine_dir.join("Library Reader.exe");
    match std::process::Command::new(&reader_exe).spawn() {
        Ok(mut child) => {
            thread::sleep(time::Duration::from_millis(500));
            match child.try_wait() {
                Ok(Some(status)) => {
                    eprintln!("Library Reader exited prematurely with code {}", status);
                    std::process::exit(1);
                }
                Ok(None) => {}
                Err(e) => {
                    eprintln!("Warning: error checking child status: {}", e);
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to launch Library Reader: {}", e);
            std::process::exit(1);
        }
    }
}
