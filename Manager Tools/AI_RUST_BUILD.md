# AI Rust Build Guide

This project should be rebuilt as a Windows-only Rust desktop app that keeps the existing HTML, CSS, and JavaScript UI, but removes Electron completely.

Use **Tauri 2** as the Rust app shell. Tauri builds a Rust executable and renders the current web UI through the native Windows WebView2 runtime instead of bundling Electron, Node.js, or Chromium.

Official references:

- Tauri prerequisites: https://v2.tauri.app/start/prerequisites/
- Tauri project setup: https://v2.tauri.app/start/create-project/
- Tauri Rust commands from JavaScript: https://v2.tauri.app/develop/calling-rust/
- Tauri Windows bundling: https://tauri.app/distribute/windows-installer/

## Goal

When HTML, CSS, JS, template files, or Rust backend code changes are made, an agent should be able to:

1. update the source files,
2. verify frontend syntax,
3. verify Rust syntax and tests,
4. build a native Windows `.exe`,
5. confirm there are no Electron dependencies in the Rust build output.

## Target Architecture

The app remains a web UI, but the desktop backend moves from:

```text
Electron main.js + preload.js + BrowserWindow + ipcMain
```

to:

```text
Rust src-tauri backend + Tauri WebView windows + Tauri commands
```

Important rule:

- Do not ship `electron`, `electron-builder`, `main.js`, or `preload.js` in the Rust app bundle.
- Do not use Node.js APIs at runtime.
- Use Rust/Tauri commands for file access, dialogs, window actions, template copying, settings, tray behavior, and preview windows.

## Existing Frontend Files To Keep

The Rust build should continue to load these files:

- `Data_Manager.html`
- `css/data_manager.css`
- `js/data_manager.js`
- `app.ico`
- `build/logo.ico`
- `build/logo.png`
- `icons/**/*`
- `themes/**/*`
- `plugins/**/*`
- `vendor/**/*`

## Bundled Library Template

The app can build new libraries by copying `default_gallery`.

Important template files:

- `default_gallery/homepage.html`
- `default_gallery/index.html`
- `default_gallery/css/homepage.css`
- `default_gallery/css/fonts.css`
- `default_gallery/js/homepage.js`
- `default_gallery/view/viewer.html`
- `default_gallery/view/viewer.css`
- `default_gallery/view/viewer.js`

The emoji font used by new libraries lives at:

- `default_gallery/fonts/emoji/Segoe.UI.Emoji.with.Twemoji.Flags.ttf`

If the template UI changes, rebuild the Rust app after updating the template files.

## Proposed Rust Project Layout

Create a Tauri project in this repository without moving the existing frontend files:

```text
src-tauri/
  Cargo.toml
  build.rs
  tauri.conf.json
  capabilities/
    default.json
  src/
    lib.rs
    main.rs
    commands.rs
    files.rs
    library_builder.rs
    settings.rs
    windows.rs
```

Keep frontend files at the repository root and configure Tauri to load them as static app assets.

## Windows GUI Executable

The release executable must be built as a Windows GUI app, not a console app. Otherwise launching `Xedryk Data Manager-tauri.exe` will open an unwanted terminal window beside the main app window.

Add this as the first line of `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
```

Expected `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    xedryk_data_manager_tauri::run();
}
```

Keep this release-only with `not(debug_assertions)` so debug builds can still show console output when troubleshooting.

## Setup Commands

Run from the project root in PowerShell:

```powershell
winget install Rustlang.Rustup
winget install Microsoft.VisualStudio.2022.BuildTools
rustup default stable
cargo install tauri-cli --version "^2.0.0" --locked
cargo install create-tauri-app --locked
```

If this repo does not have `src-tauri` yet, scaffold Tauri once:

```powershell
cargo tauri init
```

Recommended `cargo tauri init` choices:

- App name: `Xedryk Data Manager`
- Window title: `Xedryk Data Manager`
- Web assets location: `..`
- Frontend dev command: empty
- Frontend build command: empty

If `cargo tauri init` does not fit the current repo state, use `cargo create-tauri-app` in a temporary folder, choose the vanilla JavaScript template, then copy only the generated `src-tauri` directory into this repository.

## Tauri Config Requirements

`src-tauri/tauri.conf.json` should be Windows-focused:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Xedryk Data Manager",
  "version": "1.0.0",
  "identifier": "com.xedryk.datamanager",
  "build": {
    "frontendDist": "../",
    "beforeDevCommand": "",
    "beforeBuildCommand": ""
  },
  "app": {
    "withGlobalTauri": true,
    "windows": [
      {
        "label": "manager",
        "title": "Xedryk Data Manager",
        "url": "Data_Manager.html",
        "width": 1280,
        "height": 820,
        "minWidth": 980,
        "minHeight": 680,
        "decorations": false,
        "visible": true
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": ["../build/icon.ico", "../app.ico"],
    "resources": {
      "../default_gallery": "default_gallery",
      "../build": "build",
      "../icons": "icons",
      "../themes": "themes",
      "../plugins": "plugins",
      "../vendor": "vendor"
    },
    "windows": {
      "signCommand": null,
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      }
    }
  }
}
```

For a portable `.exe`, add a custom copy step after `cargo tauri build` that copies:

```text
src-tauri/target/release/xedryk-data-manager.exe
```

to the project root or a release folder.

## JavaScript Bridge Migration

Current frontend code expects:

```js
window.electronDataManager
```

For the Rust build, replace it with:

```js
window.xedrykDataManager
```

During migration, a compatibility alias is acceptable:

```js
window.electronDataManager = window.xedrykDataManager;
```

Remove the alias before final cleanup if the goal is to remove all visible Electron naming.

The Rust bridge should expose equivalents for the current preload API:

- `showDirectoryPicker(options)`
- `showOpenFilePicker(options)`
- `pathExists(targetPath)`
- `readFile(filePath)`
- `writeFile(filePath, data)`
- `getDirectoryHandle(parentPath, name, create)`
- `getFileHandle(parentPath, name, create)`
- `removeEntry(parentPath, name, recursive)`
- `listDirectory(directoryPath)`
- `openLibraryPage(payload)`
- `buildNewLibrary(payload)`
- `minimizeWindow()`
- `toggleMaximizeWindow()`
- `closeWindow()`
- `getWindowState()`
- `onWindowStateChanged(callback)`
- `getAppPath()`
- `getEmojiFontUrl()`
- `revealInExplorer(folderPath)`
- `resolveLibraryPath(libraryName)`
- `saveLibraryPath(libraryPath)`
- `pickLibraryFolder()`
- `setAlwaysOnTop(value)`
- `getAlwaysOnTop()`
- `getPreviewWindowData()`
- `reloadCurrentPage()`
- `getSettings()`
- `saveSettings(settings)`
- `getSystemFonts()`
- `getLogoPath()`

Each JavaScript method should call a Rust command through Tauri. Because this app currently uses plain script tags, prefer the global Tauri API:

```js
const invoke = window.__TAURI__.core.invoke;

window.xedrykDataManager = {
  pathExists(targetPath) {
    return invoke('path_exists', { targetPath });
  },
  buildNewLibrary(payload) {
    return invoke('build_new_library', { payload });
  }
};
```

If the frontend is later moved to a bundled module setup, import `invoke` from `@tauri-apps/api/core` instead.

## Rust Command Map

Implement these command groups in Rust:

### File Commands

Rust replacements for Electron file IPC:

- `show_directory_picker`
- `show_open_file_picker`
- `path_exists`
- `read_file`
- `write_file`
- `get_directory_handle`
- `get_file_handle`
- `remove_entry`
- `list_directory`

Use Rust crates and APIs:

- `std::fs`
- `std::path`
- `serde`
- `tauri_plugin_dialog`
- `tauri_plugin_fs` only where it helps

Keep the current descriptor shape used by `js/data_manager.js`:

```json
{
  "name": "file-or-folder-name",
  "kind": "file",
  "path": "C:\\absolute\\path",
  "type": "text/html",
  "lastModified": 1710000000000
}
```

### Library Builder Commands

Rust replacement for `data-manager:build-new-library`:

- validate destination parent folder,
- sanitize folder name,
- copy `default_gallery` recursively,
- prevent path traversal outside the chosen destination,
- personalize the new library homepage title,
- return the same payload shape currently returned by Electron.

### Window Commands

Rust replacements for Electron window actions:

- minimize current window,
- toggle maximize,
- close,
- emit window state changes,
- set/get always-on-top,
- open homepage/viewer preview windows,
- reload preview windows for the active library root.

Preview windows should be frameless Tauri windows with labels such as:

```text
preview-homepage-{id}
preview-viewer-{id}
```

Homepage/viewer custom title bars are currently injected by `preload.js`. In Rust/Tauri, move that injection into one of these places:

1. a shared frontend script loaded by `homepage.html` and `viewer.html`, or
2. a Tauri initialization script configured for preview windows.

Prefer option 1 because it removes preload-style behavior completely.

### Settings Commands

Rust replacements for settings and startup behavior:

- read/write `settings.json`,
- close-to-tray,
- start minimized,
- auto-run registry key,
- follow system theme if still required.

Use the Tauri app data directory for settings unless keeping the Electron behavior is required. The old Electron behavior saved `recent-library.txt` beside the executable.

## Frontend Cleanup Checklist

Remove or rename Electron-specific UI text and classes:

- `window.electronDataManager`
- `isElectronDesktopApp`
- `electron-preview-shell`
- `electron-homepage-shell`
- `electron-viewer-shell`
- `electron-preview-titlebar`
- messages that say `available in the Electron desktop app`

Suggested replacements:

- `window.xedrykDataManager`
- `isDesktopApp`
- `desktop-preview-shell`
- `desktop-homepage-shell`
- `desktop-viewer-shell`
- `desktop-preview-titlebar`
- `available in the desktop app`

Do not remove behavior while renaming. Keep the app working after each small rename.

## Build Steps

Run these commands from the project root:

```powershell
node --check js\data_manager.js
powershell -ExecutionPolicy Bypass -File scripts\prepare-tauri-assets.ps1
$env:CARGO_BUILD_JOBS = [Environment]::ProcessorCount
cargo tauri build
```

Always set `$env:CARGO_BUILD_JOBS = [Environment]::ProcessorCount` before Rust checks/builds to use all CPU cores for faster compilation.

`prepare-tauri-assets.ps1` copies source files into `tauri-dist/` and rewrites `electronDataManager` → `xedrykDataManager`, `Electron` → `Desktop`, `electron` → `desktop` in the HTML/CSS/JS files.

**PowerShell 5.1 encoding note**: `Get-Content -Raw` defaults to ANSI, which corrupts emoji characters. Both `Get-Content` calls in the script must use `-Encoding UTF8`. If emoji render as mojibake in the built app, check that this flag is present.

## Icon RC Path Workaround

The project path contains an apostrophe (`Xedryk's_Report1`) which breaks Windows `RC.exe` when `tauri-winres` generates the .rc file with an unquoted absolute path. The `src-tauri/build.rs` works around this by copying `icons/icon.ico` to a temporary directory (without apostrophes) and setting `TAURI_CONFIG` to override the bundle icon path before calling `tauri_build::build()`.

## Build Output

Successful builds produce:

- Portable `.exe`: `src-tauri/target/release/xedryk-data-manager-tauri.exe` (~39 MB)
- NSIS installer: `src-tauri/target/release/bundle/nsis/Xedryk Data Manager-tauri_1.0.0_x64-setup.exe` (~20 MB)

After building, copy the portable executable to the project root:

```powershell
Copy-Item src-tauri\target\release\xedryk-data-manager-tauri.exe "Xedryk Data Manager-tauri.exe"
```

Do not use the old Electron output paths as the source of truth:

- `dist/win-unpacked/Xedryk Data Manager.exe`
- `dist/Xedryk Data Manager-1.0.0-x64-lite.exe`

Those are Electron outputs.

## What To Verify After Changes

1. The manager window opens with the custom thin title bar.
2. No Electron process or Electron runtime is launched.
3. `Xedryk Data Manager.exe` runs directly from the Rust release output.
4. Homepage and viewer preview windows open frameless with the custom title bar.
5. Viewer title bar includes the `Home` button.
6. `Build New Library` creates a new folder from `default_gallery` and opens it in the manager.
7. File pickers, folder pickers, reads, writes, deletes, and directory listing work.
8. `Reveal in Explorer` opens the selected folder.
9. Close-to-tray, start-minimized, always-on-top, and settings save/load work.
10. Story multi-select is easy to use in the Stories panel.
11. Emoji still render correctly in manager/template UI.
12. Report numbers stay sequential after delete/reorder/reload.

## Packaging Notes

- The Rust build is Windows-only unless the app is intentionally made cross-platform later.
- The executable is unsigned.
- Release builds must use `windows_subsystem = "windows"` so no terminal window opens with the app.
- WebView2 is required on Windows because Tauri uses the system webview.
- The app icon should come from `build/icon.ico` or `app.ico`.
- Do not include `node_modules` in the Rust bundle.
- Do not include `package-lock.json` unless a remaining frontend build step requires npm.

## Agent Rule Of Thumb

If a user says they changed HTML and wants the Rust desktop app refreshed:

1. update the relevant source files,
2. run JS syntax checks,
3. set `$env:CARGO_BUILD_JOBS = [Environment]::ProcessorCount`,
4. run `cargo fmt`,
5. run `cargo check`,
6. run `cargo test`,
7. run `cargo tauri build`,
8. report the Rust `.exe` and installer paths.

If a user asks to remove Electron naming, update both the frontend bridge and user-facing text, then verify no Electron strings remain:

```powershell
rg -n "electron|Electron|ipcRenderer|ipcMain|BrowserWindow|preload" .
```

Some historical docs may still mention Electron, but the Rust app source and bundle should not.

If a user asks for story ID reindexing, the code is still in `js/data_manager.js`:

- `reindexReportNumbers()` - re-sequences reportNumber and displayOrder from 1 to N
- Called after: `loadLibrary()` (reload button), `handleRemove()` (delete), `reorderStoryToIndex()` (drag-drop)
