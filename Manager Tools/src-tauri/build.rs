fn main() {
    #[cfg(windows)]
    {
        let icon_src = std::path::Path::new("icons").join("icon.ico");
        if icon_src.exists() {
            let tmp = std::env::temp_dir().join("tauri-build-icon");
            let _ = std::fs::create_dir_all(&tmp);
            let icon_dst = tmp.join("icon.ico");
            if std::fs::copy(&icon_src, &icon_dst).is_ok() {
                let dst_str = icon_dst.to_string_lossy().replace('\\', "\\\\");
                let json_config = format!("{{\"bundle\":{{\"icon\":[\"{}\"]}}}}", dst_str);
                std::env::set_var("TAURI_CONFIG", &json_config);
            }
        }
    }
    tauri_build::build();
}
