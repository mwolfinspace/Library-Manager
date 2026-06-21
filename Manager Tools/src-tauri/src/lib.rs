use base64::Engine;
use include_dir::{include_dir, Dir};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{
    fs,
    path::{Component, Path, PathBuf},
    process::Command,
    sync::Mutex,
    time::SystemTime,
};
use tauri::{Emitter, Manager, WebviewUrl, WebviewWindowBuilder, Window};

static DEFAULT_GALLERY: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/../default_gallery");
static EMOJI_FONT: &[u8] =
    include_bytes!("../../default_gallery/fonts/emoji/Segoe.UI.Emoji.with.Twemoji.Flags.ttf");
static APP_ICO: &[u8] = include_bytes!("../../app.ico");
static LOGO_PNG: &[u8] = include_bytes!("../../build/logo.png");

#[derive(Default)]
struct AppState {
    recent_library_path: Mutex<Option<String>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct HandleDescriptor {
    kind: String,
    name: String,
    path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FilePayload {
    name: String,
    #[serde(rename = "type")]
    mime_type: String,
    last_modified: u128,
    data: Vec<u8>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowState {
    is_focused: bool,
    is_full_screen: bool,
    is_maximized: bool,
    is_minimized: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PickerOptions {
    #[serde(default)]
    multiple: bool,
    #[serde(default)]
    start_in_path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OpenLibraryPayload {
    #[serde(default)]
    root_path: String,
    #[serde(default)]
    relative_path: String,
    #[serde(default = "default_preview_label")]
    label: String,
    #[serde(default = "default_page_type")]
    page_type: String,
    #[serde(default)]
    query: Value,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BuildLibraryPayload {
    #[serde(default)]
    parent_path: String,
    #[serde(default)]
    folder_name: String,
    #[serde(default)]
    library_name: String,
}

fn default_preview_label() -> String {
    "Library Preview".to_string()
}

fn default_page_type() -> String {
    "homepage".to_string()
}

fn descriptor(path: PathBuf, kind: &str) -> HandleDescriptor {
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(kind)
        .to_string();
    HandleDescriptor {
        kind: kind.to_string(),
        name,
        path: path.to_string_lossy().to_string(),
    }
}

fn resolve_child(parent: &str, name: &str) -> Result<PathBuf, String> {
    let parent_path = PathBuf::from(parent)
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let child = parent_path.join(name);
    let normalized = child.components().collect::<PathBuf>();
    if !normalized.starts_with(&parent_path) {
        return Err("Path escapes the selected folder.".to_string());
    }
    Ok(normalized)
}

fn normalize_relative_segments(relative_path: &str) -> Result<PathBuf, String> {
    let mut normalized = PathBuf::new();
    for component in Path::new(relative_path).components() {
        match component {
            Component::Normal(value) => normalized.push(value),
            _ => return Err("Invalid relative path.".to_string()),
        }
    }
    if normalized.as_os_str().is_empty() {
        return Err("Invalid relative path.".to_string());
    }
    Ok(normalized)
}

fn resolve_library_file_path(root_path: &str, relative_path: &str) -> Result<PathBuf, String> {
    let root = PathBuf::from(root_path)
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let target = root.join(normalize_relative_segments(relative_path)?);
    let normalized = target.components().collect::<PathBuf>();
    if !normalized.starts_with(&root) {
        return Err("Library path must stay inside the selected folder.".to_string());
    }
    Ok(normalized)
}

fn modified_ms(path: &Path) -> u128 {
    fs::metadata(path)
        .and_then(|metadata| metadata.modified())
        .ok()
        .and_then(|time| time.duration_since(SystemTime::UNIX_EPOCH).ok())
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn window_state(window: &Window) -> WindowState {
    WindowState {
        is_focused: window.is_focused().unwrap_or(true),
        is_full_screen: window.is_fullscreen().unwrap_or(false),
        is_maximized: window.is_maximized().unwrap_or(false),
        is_minimized: window.is_minimized().unwrap_or(false),
    }
}

fn app_data_file(app: &tauri::AppHandle, name: &str) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join(name))
}

fn escape_html(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

fn sanitize_entry_name(value: &str) -> String {
    let invalid = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    value
        .trim()
        .chars()
        .filter(|ch| !invalid.contains(ch) && !ch.is_control())
        .collect::<String>()
        .trim()
        .chars()
        .take(80)
        .collect()
}

fn copy_embedded_dir(dir: &Dir<'_>, target: &Path) -> Result<(), String> {
    for entry in dir.entries() {
        let entry_path = target.join(entry.path());
        if let Some(file) = entry.as_file() {
            if let Some(parent) = entry_path.parent() {
                fs::create_dir_all(parent).map_err(|error| error.to_string())?;
            }
            fs::write(&entry_path, file.contents()).map_err(|error| error.to_string())?;
        } else if let Some(child_dir) = entry.as_dir() {
            fs::create_dir_all(&entry_path).map_err(|error| error.to_string())?;
            copy_embedded_dir(child_dir, target)?;
        }
    }
    Ok(())
}

fn apply_library_branding(html: &str, library_name: &str) -> String {
    let safe_name = escape_html(library_name);
    let safe_upper = escape_html(&library_name.to_uppercase());
    html.replace("Xedryk Archive - Part 01", &safe_name)
        .replace("Xedryk's Archive", &safe_name)
        .replace("Xedryk Archive", &safe_name)
        .replace("XEDRYK ARCHIVE", &safe_upper)
        .replace("Legacy Report", &safe_name)
}

fn personalize_template(target: &Path, library_name: &str) -> Result<(), String> {
    let homepage = target.join("homepage.html");
    if homepage.exists() {
        let original = fs::read_to_string(&homepage).map_err(|error| error.to_string())?;
        fs::write(&homepage, apply_library_branding(&original, library_name))
            .map_err(|error| error.to_string())?;
    }

    let index = target.join("index.html");
    if index.exists() {
        let original = fs::read_to_string(&index).map_err(|error| error.to_string())?;
        let updated = apply_library_branding(&original, library_name).replace(
            r#"Redirecting to <a href="homepage.html">homepage.html</a>..."#,
            &format!(
                r#"Redirecting to <a href="homepage.html">{}</a>..."#,
                escape_html(library_name)
            ),
        );
        fs::write(&index, updated).map_err(|error| error.to_string())?;
    }
    Ok(())
}

fn write_payload_to_bytes(data: Value) -> Result<Vec<u8>, String> {
    if let Some(text) = data.as_str() {
        return Ok(text.as_bytes().to_vec());
    }
    if let Some(items) = data.as_array() {
        let mut bytes = Vec::with_capacity(items.len());
        for item in items {
            let value = item
                .as_u64()
                .ok_or_else(|| "Invalid binary write payload.".to_string())?;
            if value > u8::MAX as u64 {
                return Err("Invalid binary write byte value.".to_string());
            }
            bytes.push(value as u8);
        }
        return Ok(bytes);
    }
    Ok(Vec::new())
}

#[tauri::command]
fn show_directory_picker(options: PickerOptions) -> Result<Option<HandleDescriptor>, String> {
    let mut dialog = rfd::FileDialog::new().set_title("Choose Library Folder");
    if !options.start_in_path.trim().is_empty() {
        dialog = dialog.set_directory(options.start_in_path);
    }
    Ok(dialog
        .pick_folder()
        .map(|path| descriptor(path, "directory")))
}

#[tauri::command]
fn show_open_file_picker(options: PickerOptions) -> Result<Vec<HandleDescriptor>, String> {
    let mut dialog = rfd::FileDialog::new().set_title("Select File");
    if !options.start_in_path.trim().is_empty() {
        dialog = dialog.set_directory(options.start_in_path);
    }
    let paths = if options.multiple {
        dialog.pick_files().unwrap_or_default()
    } else {
        dialog.pick_file().into_iter().collect()
    };
    Ok(paths
        .into_iter()
        .map(|path| descriptor(path, "file"))
        .collect())
}

#[tauri::command]
fn path_exists(target_path: String) -> bool {
    PathBuf::from(target_path).exists()
}

#[tauri::command]
fn read_file(file_path: String) -> Result<FilePayload, String> {
    let path = PathBuf::from(file_path);
    let data = fs::read(&path).map_err(|error| error.to_string())?;
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("file")
        .to_string();
    let mime_type = mime_guess::from_path(&path)
        .first_or_octet_stream()
        .essence_str()
        .to_string();
    Ok(FilePayload {
        name,
        mime_type,
        last_modified: modified_ms(&path),
        data,
    })
}

#[tauri::command]
fn write_file(file_path: String, data: Value) -> Result<bool, String> {
    let path = PathBuf::from(file_path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(path, write_payload_to_bytes(data)?).map_err(|error| error.to_string())?;
    Ok(true)
}

#[tauri::command]
fn get_directory_handle(
    parent_path: String,
    name: String,
    create: bool,
) -> Result<HandleDescriptor, String> {
    let path = resolve_child(&parent_path, &name)?;
    if create {
        fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    } else if !path.is_dir() {
        return Err("Requested path is not a directory.".to_string());
    }
    Ok(descriptor(path, "directory"))
}

#[tauri::command]
fn get_file_handle(
    parent_path: String,
    name: String,
    create: bool,
) -> Result<HandleDescriptor, String> {
    let path = resolve_child(&parent_path, &name)?;
    if create {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
        fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)
            .map_err(|error| error.to_string())?;
    } else if !path.is_file() {
        return Err("Requested path is not a file.".to_string());
    }
    Ok(descriptor(path, "file"))
}

#[tauri::command]
fn remove_entry(parent_path: String, name: String, recursive: bool) -> Result<bool, String> {
    let path = resolve_child(&parent_path, &name)?;
    if path.is_dir() {
        if recursive {
            fs::remove_dir_all(path).map_err(|error| error.to_string())?;
        } else {
            fs::remove_dir(path).map_err(|error| error.to_string())?;
        }
    } else {
        fs::remove_file(path).map_err(|error| error.to_string())?;
    }
    Ok(true)
}

#[tauri::command]
fn list_directory(directory_path: String) -> Result<Vec<HandleDescriptor>, String> {
    let entries = fs::read_dir(directory_path).map_err(|error| error.to_string())?;
    let mut descriptors = Vec::new();
    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        let kind = if path.is_dir() { "directory" } else { "file" };
        descriptors.push(descriptor(path, kind));
    }
    Ok(descriptors)
}

#[tauri::command]
fn open_library_page(app: tauri::AppHandle, payload: OpenLibraryPayload) -> Result<bool, String> {
    let absolute = resolve_library_file_path(&payload.root_path, &payload.relative_path)?;
    let mut file_url = tauri::Url::from_file_path(&absolute)
        .map_err(|_| "Invalid library page path.".to_string())?;
    if let Some(query) = payload.query.as_str() {
        file_url.set_query(Some(query.trim_start_matches('?')));
    } else if let Some(query) = payload.query.as_object() {
        let mut params = url::form_urlencoded::Serializer::new(String::new());
        for (key, value) in query {
            if !value.is_null() {
                params.append_pair(key, value.as_str().unwrap_or(&value.to_string()));
            }
        }
        let encoded = params.finish();
        if !encoded.is_empty() {
            file_url.set_query(Some(&encoded));
        }
    }
    let url = WebviewUrl::External(file_url);
    let label = format!(
        "preview-{}-{}",
        payload.page_type,
        app.webview_windows().len() + 1
    );
    let mut builder = WebviewWindowBuilder::new(&app, label, url)
        .title(&payload.label)
        .decorations(false)
        .inner_size(1180.0, 780.0);
    if payload.query.is_object() {
        builder = builder.initialization_script(&format!(
            "window.__XEDRYK_PREVIEW_DATA__ = {};",
            json!({
                "rootPath": payload.root_path,
                "relativePath": payload.relative_path,
                "pageType": payload.page_type,
                "query": payload.query
            })
        ));
    }
    let window = builder.build().map_err(|error| error.to_string())?;
    window.show().map_err(|error| error.to_string())?;
    Ok(true)
}

#[tauri::command]
fn reload_preview_windows(app: tauri::AppHandle, payload: Value) -> Result<usize, String> {
    let root_path = payload
        .get("rootPath")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();
    let mut count = 0;
    for (label, window) in app.webview_windows() {
        if label.starts_with("preview-") {
            let _ = window.emit("xedryk-root-reload", root_path.clone());
            let _ = window.eval("window.location.reload()");
            count += 1;
        }
    }
    Ok(count)
}

#[tauri::command]
fn get_preview_window_data() -> Option<Value> {
    None
}

#[tauri::command]
fn build_new_library(payload: BuildLibraryPayload) -> Result<Value, String> {
    let parent = PathBuf::from(payload.parent_path.trim())
        .canonicalize()
        .map_err(|error| error.to_string())?;
    let folder_name = sanitize_entry_name(&payload.folder_name);
    let library_name = payload.library_name.trim().to_string();
    if folder_name.is_empty() || library_name.is_empty() {
        return Err("Folder name and library name are required.".to_string());
    }
    let target = parent.join(&folder_name);
    if !target.starts_with(&parent) {
        return Err("New library path escapes the selected folder.".to_string());
    }
    if target.exists() {
        return Err(format!(
            "A folder named \"{}\" already exists in that location.",
            folder_name
        ));
    }
    fs::create_dir_all(&target).map_err(|error| error.to_string())?;
    copy_embedded_dir(&DEFAULT_GALLERY, &target)?;
    personalize_template(&target, &library_name)?;
    Ok(json!({
        "folderName": folder_name,
        "handle": descriptor(target.clone(), "directory"),
        "libraryName": library_name,
        "targetPath": target.to_string_lossy()
    }))
}

#[tauri::command]
fn window_action(window: Window, action: String) -> Result<WindowState, String> {
    match action.as_str() {
        "close" => window.close().map_err(|error| error.to_string())?,
        "minimize" => window.minimize().map_err(|error| error.to_string())?,
        "toggle-maximize" => {
            if window.is_maximized().unwrap_or(false) {
                window.unmaximize().map_err(|error| error.to_string())?;
            } else {
                window.maximize().map_err(|error| error.to_string())?;
            }
        }
        _ => {}
    }
    Ok(window_state(&window))
}

#[tauri::command]
fn get_window_state(window: Window) -> WindowState {
    window_state(&window)
}

#[tauri::command]
fn get_app_path(app: tauri::AppHandle) -> Result<String, String> {
    app.path()
        .resolve("", tauri::path::BaseDirectory::Executable)
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_emoji_font_url() -> String {
    format!(
        "data:font/truetype;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(EMOJI_FONT)
    )
}

#[tauri::command]
fn reveal_in_explorer(folder_path: String) -> Value {
    let path = PathBuf::from(folder_path);
    let result = Command::new("explorer").arg(path).spawn();
    match result {
        Ok(_) => json!({ "success": true }),
        Err(error) => json!({ "success": false, "error": error.to_string() }),
    }
}

#[tauri::command]
fn resolve_library_path(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    _library_name: Option<String>,
) -> Option<String> {
    if let Ok(guard) = state.recent_library_path.lock() {
        if guard.is_some() {
            return guard.clone();
        }
    }
    app_data_file(&app, "recent-library.txt")
        .ok()
        .and_then(|path| fs::read_to_string(path).ok())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

#[tauri::command]
fn save_library_path(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    library_path: String,
) -> Result<bool, String> {
    if let Ok(mut guard) = state.recent_library_path.lock() {
        *guard = Some(library_path.clone());
    }
    let path = app_data_file(&app, "recent-library.txt")?;
    fs::write(path, library_path).map_err(|error| error.to_string())?;
    Ok(true)
}

#[tauri::command]
fn pick_library_folder() -> Value {
    match rfd::FileDialog::new()
        .set_title("Select Library Folder")
        .pick_folder()
    {
        Some(path) => json!({
            "success": true,
            "path": path.to_string_lossy(),
            "handle": descriptor(path, "directory")
        }),
        None => json!({ "success": false, "canceled": true }),
    }
}

#[tauri::command]
fn set_always_on_top(window: Window, value: bool) -> Result<bool, String> {
    window
        .set_always_on_top(value)
        .map_err(|error| error.to_string())?;
    Ok(value)
}

#[tauri::command]
fn get_always_on_top(_window: Window) -> bool {
    false
}

#[tauri::command]
fn get_settings(app: tauri::AppHandle) -> Value {
    let path = match app_data_file(&app, "settings.json") {
        Ok(path) => path,
        Err(_) => return json!({}),
    };
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_else(|| {
            json!({
                "autoRun": false,
                "closeToTray": false,
                "startMinimized": false,
                "followSystem": false,
                "uiFont": ""
            })
        })
}

#[tauri::command]
fn save_settings(app: tauri::AppHandle, settings: Value) -> Result<bool, String> {
    let path = app_data_file(&app, "settings.json")?;
    fs::write(
        path,
        serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?,
    )
    .map_err(|error| error.to_string())?;
    Ok(true)
}

#[tauri::command]
fn get_system_fonts() -> Vec<&'static str> {
    vec![
        "Segoe UI",
        "Arial",
        "Times New Roman",
        "Georgia",
        "Verdana",
        "Tahoma",
        "Calibri",
        "Cambria",
        "Comic Relief",
        "Geo",
        "IBM Plex Mono",
        "Lexend Deca",
        "Literata",
        "Nova Square",
        "Orbitron",
        "Quantico",
        "Roboto Mono",
        "Share Tech Mono",
        "SN Pro",
        "Space Mono",
        "VT323",
    ]
}

#[tauri::command]
fn get_logo_path() -> String {
    if !LOGO_PNG.is_empty() {
        return format!(
            "data:image/png;base64,{}",
            base64::engine::general_purpose::STANDARD.encode(LOGO_PNG)
        );
    }
    format!(
        "data:image/x-icon;base64,{}",
        base64::engine::general_purpose::STANDARD.encode(APP_ICO)
    )
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            show_directory_picker,
            show_open_file_picker,
            path_exists,
            read_file,
            write_file,
            get_directory_handle,
            get_file_handle,
            remove_entry,
            list_directory,
            open_library_page,
            reload_preview_windows,
            get_preview_window_data,
            build_new_library,
            window_action,
            get_window_state,
            get_app_path,
            get_emoji_font_url,
            reveal_in_explorer,
            resolve_library_path,
            save_library_path,
            pick_library_folder,
            set_always_on_top,
            get_always_on_top,
            get_settings,
            save_settings,
            get_system_fonts,
            get_logo_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running Xedryk Data Manager Tauri app");
}
