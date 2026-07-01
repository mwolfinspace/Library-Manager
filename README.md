# Xedryk's Library Manager

A Windows desktop application for managing Xedryk gallery libraries. Built with Electron and Tauri, wrapping a web-based Data Manager UI and a bundled gallery template.

## Features

- **Story Management** — Create, edit, delete, and reorder stories with rich text, images, tags, and covers.
- **Library Builder** — Create new library folders from the `default_gallery` template in one click.
- **Report Number Reindex** — Automatically renumber stories 1..N after deletion or reorder.
- **Gallery Preview** — Launch a frameless preview window of the homepage and viewer.
- **Cross-Platform Desktop** — Available as Electron (NSIS installer, portable `.exe`) and Tauri builds.

## Project Structure

```
Xedryk's Library Manager/
├── Manager Tools/                  # Data Manager web app + build configs
│   ├── Data_Manager.html           # Main UI
│   ├── main.js                     # Electron main process (Manager Tools)
│   ├── preload.js                  # Electron preload
│   ├── package.json                # npm config for Manager Tools builds
│   ├── css/                        # Manager stylesheets
│   ├── js/                         # Manager JavaScript
│   │   ├── data_manager.js         # Core logic
│   │   ├── icon-helper.js          # Siyuan icon rendering
│   │   ├── setting_manager.js      # Settings panel
│   │   └── tauri_bridge.js         # Tauri IPC bridge
│   ├── default_gallery/            # Template for new libraries
│   │   ├── homepage.html           # Gallery homepage
│   │   ├── index.html              # Gallery index
│   │   ├── css/                    # Gallery stylesheets
│   │   ├── js/                     # Gallery scripts
│   │   ├── js/shared/              # Shared utilities (path, crypto)
│   │   ├── view/                   # Story viewer (markdown, KaTeX)
│   │   └── database/               # Empty catalog & settings
│   ├── build/                      # electron-builder resources
│   ├── scripts/                    # Build helper scripts
│   ├── src-tauri/                  # Tauri Rust source
│   │   ├── src/lib.rs
│   │   ├── src/main.rs
│   │   ├── Cargo.toml
│   │   └── tauri.conf.json
│   ├── library-reader/             # Standalone self-extracting reader (Electron)
│   └── themes/                     # Gallery themes (e.g. Asri)
├── release/electron/               # Electron wrapper (root build)
│   ├── main.js                     # Electron main process (root)
│   ├── preload.js                  # Electron preload (root)
│   └── README.md
├── css/                            # Gallery CSS (live)
├── js/                             # Gallery JS (live)
├── fonts/                          # Gallery fonts (live)
├── view/                           # Gallery viewer (live)
├── database/                       # Gallery database & settings
├── story/                          # Story markdown files (user data — gitignored)
├── media-scr/                      # Uploaded images (user data — gitignored)
├── package.json                    # Root Electron wrapper config
└── .gitignore
```

## Prerequisites

- **Node.js** 18+ and npm
- **Rust** toolchain (`rustup`, `cargo`) — only needed for Tauri build
- **MSVC Build Tools** (for Rust linking on Windows)
- **Windows** (the app is Windows-only)

## Quick Start

### Clone and install

```powershell
git clone https://github.com/mwolfinspace/Library-Manager.git
cd Library-Manager
npm install
cd Manager Tools
npm install
```

### Run in development mode

**Root Electron wrapper** (opens Manager Tools in an Electron window):
```powershell
npm run desktop:dev
```

**Manager Tools standalone** (opens just the Data Manager):
```powershell
cd Manager Tools
npm run start
```

## Building

### Root Electron build (NSIS installer + portable)

```powershell
npm run desktop:build
```

Output: `release/dist/Xedryk Data Manager-1.0.0-x64.exe` (installer) and `release/dist/Xedryk Data Manager-1.0.0-x64-lite.exe` (portable).

### Manager Tools Electron build (standalone Data Manager)

```powershell
cd Manager Tools
npm run dist          # NSIS installer
npm run dist:portable # Portable .exe
npm run pack           # Unpacked folder (win-unpacked)
```

Output: `Manager Tools/dist/Xedryk Data Manager-1.0.0-x64-setup.exe`, `Manager Tools/dist/Xedryk Data Manager-1.0.0-x64-lite.exe`, `Manager Tools/dist/win-unpacked/`.

### Tauri build

```powershell
cd Manager Tools
npx tauri build
```

Output: `Manager Tools/src-tauri/target/release/bundle/nsis/` (NSIS) and `Manager Tools/src-tauri/target/release/bundle/msi/` (MSI).

## Gallery Template

The `Manager Tools/default_gallery/` directory is the template used by the **Build New Library** feature. It includes:
- Homepage and index pages
- Story viewer with Markdown + KaTeX support
- Emoji font
- Default catalog and settings
- Multiple gallery fonts
- Asri theme

When a user clicks "Build New Library" in the Manager UI, a copy of `default_gallery` is written to the chosen folder and registered as the active library.

## Making Changes

1. Edit the source files in `Manager Tools/`.
2. For UI changes, modify `Data_Manager.html`, `css/data_manager.css`, or `js/data_manager.js`.
3. For gallery template changes, edit files under `Manager Tools/default_gallery/`.
4. Rebuild with the appropriate command above.

## Repository Info

- **Public repo** at [github.com/mwolfinspace/Library-Manager](https://github.com/mwolfinspace/Library-Manager)
- User data (story files, media uploads, generated JSON) is gitignored — only source code and templates are tracked.
