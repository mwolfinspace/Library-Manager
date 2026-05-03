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
- `dist/Xedryk Data Manager-1.0.0-x64.exe`

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

## Agent Rule Of Thumb

If a user says they changed HTML and wants the desktop app refreshed:

1. update the relevant source files,
2. run the syntax checks,
3. run `npm run dist`,
4. report the output executable path.

If a user asks for story ID reindexing (sequential report numbers), the code is in `js/data_manager.js`:

- `reindexReportNumbers()` - re-sequences reportNumber and displayOrder from 1 to N
- Called after: `loadLibrary()` (reload button), `handleRemove()` (delete), `reorderStoryToIndex()` (drag-drop)
