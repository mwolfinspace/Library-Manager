# Changelog

## [1.0.1] - 2026-07-12

### UI Redesign
- Liquid glass + WinUI 3 mica-tinted light theme overhaul for both Data Manager and Settings Manager
- 12-color accent color picker with persistent selection (localStorage)
- Titlebar restructured: eject button, merged scan/reload button, font manager button

### Font Manager
- New font manager popup: browse or drag-drop fonts, live preview via FontFace API, delete with confirmation

### Story Card Reorder
- Reorder controls redesigned as compact centered group (circular up/down buttons, number input)
- Column uses `align-self: center` — group stays vertically centered regardless of card height
- Padding on both sides so controls don't touch separator bar or card border

### Button System
- Single source of truth for all button styles (dark, light, ghost, danger)
- Removed 3 duplicate CSS layers that caused inconsistent button colors
- All 47 hardcoded blue colors replaced with `var(--accent-alpha-*)` for full accent picker support
- Fixed root cause: `:root` (dark theme) had no `--accent-alpha-*` variables

### Accent Color Propagation Fix
- `setAccentColor()` now sets CSS variables on both `document.documentElement` and `document.body`
- Fixes buttons staying hardcoded #0078D4 despite accent picker selection (body's CSS declarations overrode html's inherited values)

### Scroll Performance
- Stripped 108 `backdrop-filter: blur()` instances from scrolling children
- Added GPU acceleration flags in Electron main.js
- Set `backgroundThrottling: false` for smoother rendering

### Status Bar
- Simplified to single span with emoji icons

### Tauri
- Direct file commands (`read_text_file`, `read_json_file_content`) for reliable JSON/text reading
- `readJsonFile`/`readTextFile`/`fileExists` use direct Tauri path commands
- Drag support via `window.startDragging()` API
- Release profile: `lto = "fat"`, `codegen-units = 1`, `strip = true`

### Bug Fixes
- Fixed `ensureStructure` catalog overwrite bug
- Fixed `handleSave` redundant `loadLibrary()` call
- Fixed syntax error (extra `}` on line 5782)
- Fixed last hardcoded teal color on `.story-reorder-controls` border
- Added `core:window:allow-start-dragging` permission for Tauri drag
