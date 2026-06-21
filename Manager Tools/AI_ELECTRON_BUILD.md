# AI Electron Build Guide

This project is a Windows-only Electron wrapper around the HTML Data Manager and its bundled gallery template.

## Goal

When HTML, CSS, or JS changes are made, an agent should be able to:

1. update the source files,
2. verify syntax,
3. rebuild the Electron app,
4. refresh the portable Windows executable.

## Main App Files

- `Data_Manager.html`
- `css/data_manager.css`
- `js/data_manager.js`
- `main.js`
- `preload.js`
- `package.json`
- `app.ico`

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

If the template UI changes, rebuild the Electron app after updating the template files.

## Custom Window Chrome

There are two custom title bar systems:

1. Manager window chrome
   - implemented in `Data_Manager.html`, `css/data_manager.css`, and `js/data_manager.js`

2. Homepage/viewer window chrome
   - implemented by runtime injection from `preload.js`
   - the preview windows are created frameless in `main.js`

If homepage or viewer window decoration changes, inspect both `main.js` and `preload.js`.

## New Library Builder

The `Build New Library` button in the manager uses Electron IPC to copy `default_gallery` into a user-selected destination.

Relevant files:

- `Data_Manager.html`
- `js/data_manager.js`
- `main.js`

The template copy and homepage naming logic are handled in `main.js`.

## Rebuild Steps

Run these commands from the project root:

```powershell
npm install
node --check main.js
node --check preload.js
node --check js\data_manager.js
$env:ELECTRON_BUILDER_MULTI_THREAD = "true"
npm run dist
```

**Always use multi-threading** by setting `$env:ELECTRON_BUILDER_MULTI_THREAD = "true"` before `npm run dist` to use all CPU cores for faster builds.

## Build Output

Successful builds produce:

- `dist/win-unpacked/Xedryk Data Manager.exe`
- `dist/Xedryk Data Manager-1.0.0-x64-lite.exe`

The `-lite` suffix indicates the executable has been trimmed of unnecessary Electron/Chromium files.

## Size Optimization

The `scripts/afterPack.js` hook strips these unused files from the win-unpacked output to reduce size:

| Stripped file | Typical size saved | Reason |
|---------------|-------------------|--------|
| `locales/*.pak` (keeps only `en-US.pak`) | ~30 MB | Unused Chromium UI translations |
| `vk_swiftshader.dll` | ~5 MB | GPU software fallback — not needed |
| `vulkan-1.dll` | ~1 MB | Used by SwiftShader |
| `LICENSES.chromium.html` | ~10 MB | Chromium open-source license text |

**Net savings: ~46 MB in the unpacked folder (~25 MB in the portable `.exe`).**

The portable `-lite.exe` is compressed by electron-builder's NSIS, so the compressed size saving is smaller than the unpacked saving.

Note: If the app ever needs WebGL rendering without a physical GPU, re-add `vk_swiftshader.dll` and `vulkan-1.dll`.

## What To Verify After Changes

1. The manager window opens with the custom thin title bar.
2. Homepage and viewer windows open frameless with the injected title bar.
3. Viewer title bar includes the `Home` button.
4. `Build New Library` creates a new folder from `default_gallery` and opens it in the manager.
5. Story multi-select is easy to use in the Stories panel.
6. Emoji still render correctly in manager/template UI.
7. Report numbers stay sequential after delete/reorder/reload.

## Packaging Notes

- The build is Windows-only.
- The executable is unsigned.
- `electron-builder` is configured with `signAndEditExecutable: false`.
- The app uses `app.ico` for its icon (configured in `package.json`).

## Library Reader (Self-Extracting Single Exe)

A minimal standalone Electron app (`library-reader/`) for opening library folders (`homepage.html`/`index.html`) without the Data Manager. Delivered as a single `.exe` that self-extracts into `./engine/` on first run.

### Architecture

```
library-folder/
  Library Reader-1.0.0-x64.exe   ← single file to distribute
  engine/                         ← created on first run (auto-extracted)
    Library Reader.exe
    resources/app/main.js         ← patched to read LIBRARY_READER_ROOT env var
    ...Electron runtime files...
```

The Rust-based launcher (`launcher/src/main.rs`):
1. Checks if `./engine/Library Reader.exe` exists.
2. If not, extracts an appended ZIP archive into `./engine/`.
3. Sets `LIBRARY_READER_ROOT` env var to the launcher's directory (library root).
4. Launches `./engine/Library Reader.exe` with that env var set.
5. Exits (the reader continues independently).

The reader's `resolveLibraryRoot()` in `main.js` checks `process.env.LIBRARY_READER_ROOT` first, then falls back to the exe dir, its parent, and `process.cwd()`.

### Full Build (Reader + Launcher)

```powershell
cd library-reader

# Step 1: Build the Electron win-unpacked
npm install
node --check main.js
node --check preload.js
$env:ELECTRON_BUILDER_MULTI_THREAD = "true"
npm run dist

# Step 2: Build the Rust launcher and pack
powershell -ExecutionPolicy Bypass -File scripts\build-launcher.ps1

# Output will appear at:
#   dist\Library Reader-1.0.0-x64.exe   (~96 MB, single self-extracting exe)
```

### What `build-launcher.ps1` does

1. Builds the Rust launcher (`launcher/` → `launcher/target/release/reader-launcher.exe`).
2. Zips `dist/win-unpacked/` into a temporary ZIP file (using .NET's `System.IO.Compression`).
3. Appends the ZIP to `reader-launcher.exe` (simple binary concatenation).
4. Outputs `dist/Library Reader-1.0.0-x64.exe`.

### How the appended ZIP is found

The launcher scans backwards from the end of its own `.exe` for the ZIP EOCD signature (`PK\x05\x06`), parses the central directory offset, and extracts using the `zip` crate (deflate only).

### Prerequisites

- Rust toolchain (`rustup`, `cargo`) for the launcher.
- Node.js + npm for the Electron build.
- MSVC Build Tools (for Rust linking) — already installed.

### Rebuild after source changes

If `main.js`, `preload.js`, or the reader HTML/CSS changes:

1. Rebuild the Electron `win-unpacked` with `npm run dist`.
2. Re-run `build-launcher.ps1` to repack.

If only the launcher logic (`launcher/src/main.rs`) changes:

1. Re-run `build-launcher.ps1` — it recompiles the Rust code automatically.

### Usage

Drop `Library Reader-1.0.0-x64.exe` into any library folder (containing `homepage.html` or `index.html`) and run it. First launch takes ~10 seconds (extracting the engine). Subsequent launches are instant.

### Titlebar Injection

The `preload.js` injects a custom dark-glass titlebar (`.rdr-bar`) with inline SVG icons for minimize, maximize, and close. Since the preload script runs only once per window but the reader navigates from splash → homepage, a polling loop (`setInterval` every 400 ms) detects URL changes and calls `injectTitlebar()` on the real page. The function also retries if `document.body` is not yet ready.

The titlebar uses `-webkit-app-region: drag` for window dragging and `no-drag` for the button area. Window state changes (maximize ↔ restore) update the glyph via IPC `onMaximizeChange`.

### Icon

At build time, `build-launcher.ps1` extracts the "My Computer" icon from `shell32.dll` (index 15) using `[System.Drawing.Icon]::FromHandle()` and saves it to `build/icon.ico`. This icon is embedded into the `Library Reader.exe` by electron-builder, so the taskbar and ALT+TAB show the system computer icon. The script also copies it into `win-unpacked/resources/app/build/icon.ico` so the `BrowserWindow` `icon` option in `main.js` resolves correctly.

### Known Limitations

- First launch extracts ~200 MB to `./engine/`. Allow 5–15 seconds.
- `asar` is disabled in the reader's `package.json` so `main.js` and `preload.js` are accessible as plain files.
- The launcher is compiled as a Windows GUI app (`windows_subsystem = "windows"`) — no console window appears.
- Error messages from the launcher are not visible (no console). Failures show as a missing reader window.
- The titlebar polling loop (400 ms interval) runs indefinitely — negligible overhead (~1 µs per tick).
- `destroy()` is used instead of `close()` to force-kill the window and prevent freeze on failed loads.
- `webSecurity: false` is required for `file:///` URL loading.

## Agent Rule Of Thumb

If a user says they changed HTML and wants the desktop app refreshed:

1. update the relevant source files,
2. run the syntax checks,
3. run `npm run dist`,
4. report the output executable path.

If a user says they changed HTML and wants the Library Reader refreshed:

1. update `library-reader/main.js` or `library-reader/preload.js` if needed,
2. run `node --check main.js` and `node --check preload.js`,
3. run `$env:ELECTRON_BUILDER_MULTI_THREAD = "true" ; npm run dist`,
4. run `powershell -ExecutionPolicy Bypass -File scripts\build-launcher.ps1`,
5. report the output path: `dist\Library Reader-1.0.0-x64.exe`.

If a user asks for story ID reindexing (sequential report numbers), the code is in `js/data_manager.js`:

- `reindexReportNumbers()` - re-sequences reportNumber and displayOrder from 1 to N
- Called after: `loadLibrary()` (reload button), `handleRemove()` (delete), `reorderStoryToIndex()` (drag-drop)
