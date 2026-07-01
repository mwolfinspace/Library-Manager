# V2 Migration Plan: Vanilla JS → React + shadcn/ui

> **Checkpoint**: `81b13d4` — Phase 0 complete. Working directory: `Manager Tools/react-ui/`.
> Next step: **Phase 1** — copy pure logic into `src/lib/`, wrap file I/O into `src/services/`.

## Goal
Replace all UI in `Data_Manager.html` + `data_manager.js` with React + shadcn/ui components while keeping **all functionality intact**. File I/O, data logic, cryptography — none of that changes.

---

## Progress

| Phase | Status | Commit | Date |
|-------|--------|--------|------|
| 0 — Scaffold Vite + React + shadcn/ui | ✅ Done | `81b13d4` | 2026-07-01 |
| 1 — Pure logic to `src/lib/` + services | ⏳ Pending | | |
| 2 — Types + stores + layout shell | ⏳ Pending | | |
| 3 — Story components (list, form, search, markdown) | ⏳ Pending | | |
| 4 — Media components (manager, preview, cover upload) | ⏳ Pending | | |
| 5 — Cover editor (position, presets, preview) | ⏳ Pending | | |
| 6 — Modals (dialog, help, settings, library builder) | ⏳ Pending | | |
| 7 — UI primitives (toast, all shadcn components) | ⏳ Pending | | |
| 8 — Hooks (library, story, media, cover, settings, theme, password) | ⏳ Pending | | |
| 9 — Integration + cutover (replace old HTML/JS) | ⏳ Pending | | |
| 10 — Polish (verify all handlers, theming, build scripts) | ⏳ Pending | | |

---

## Architecture (New React App)

```
Manager Tools/
├── index.html                 ← Vite entry (replaces Data_Manager.html shell)
├── src/
│   ├── main.tsx               ← React root + providers
│   ├── App.tsx                ← Layout + routing
│   ├── App.css                ← Tailwind + shadcn variables
│   ├── lib/                   ← PURE_LOGIC (copied verbatim)
│   │   ├── story-utils.ts
│   │   ├── markdown-utils.ts
│   │   ├── media-utils.ts
│   │   ├── catalog-utils.ts
│   │   ├── password-utils.ts
│   │   └── path-utils.ts
│   ├── services/              ← FILE_IO (wrapped as async functions)
│   │   ├── file-system.ts
│   │   ├── catalog.ts
│   │   ├── password-vault.ts
│   │   └── electron-bridge.ts
│   ├── hooks/                 ← Custom React hooks
│   │   ├── useLibrary.ts
│   │   ├── useStory.ts
│   │   ├── useMedia.ts
│   │   ├── useSettings.ts
│   │   ├── useCoverPosition.ts
│   │   ├── useUndoHistory.ts
│   │   ├── useTheme.ts
│   │   └── usePasswordVault.ts
│   ├── components/            ← React components
│   │   ├── ui/                ← shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── command.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppShell.tsx          ← Main layout (sidebar + main)
│   │   │   ├── ElectronChrome.tsx    ← Custom title bar
│   │   │   └── StatusBar.tsx
│   │   ├── story/
│   │   │   ├── StoryList.tsx         ← Story panel
│   │   │   ├── StoryCard.tsx         ← Individual story
│   │   │   ├── StoryForm.tsx         ← Edit form
│   │   │   ├── StorySearch.tsx       ← Search bar
│   │   │   └── MarkdownToolbar.tsx   ← Text formatting
│   │   ├── media/
│   │   │   ├── ImageManager.tsx      ← Image grid
│   │   │   ├── ImageCard.tsx         ← Individual image
│   │   │   ├── MediaPreview.tsx      ← Preview overlay
│   │   │   └── CoverMediaUpload.tsx  ← Cover upload
│   │   ├── cover/
│   │   │   ├── CoverPositionEditor.tsx
│   │   │   ├── CoverPresetGrid.tsx
│   │   │   └── CoverPreview.tsx
│   │   ├── modals/
│   │   │   ├── Dialog.tsx            ← Themed confirm dialog
│   │   │   ├── HelpModal.tsx
│   │   │   ├── SettingsModal.tsx
│   │   │   └── LibraryBuilder.tsx
│   │   └── ui/
│   │       ├── Toast.tsx
│   │       └── LoadingScreen.tsx
│   ├── stores/                ← React context/state
│   │   ├── app-state.tsx      ← Global app state provider
│   │   ├── toast-store.tsx    ← Toast notifications
│   │   └── theme-store.tsx    ← Theme state
│   └── types/                 ← TypeScript types
│       ├── story.ts
│       ├── media.ts
│       ├── catalog.ts
│       └── electron.ts
├── package.json               ← Updated with React + shadcn deps
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── components.json            ← shadcn/ui config
└── postcss.config.js
```

---

## Complete Function Inventory

Every function/section in `data_manager.js` mapped to its new home.

### SECTION A: PURE_LOGIC — Copied verbatim to `src/lib/`

No DOM access, no browser APIs. Zero changes needed.

| # | Function | Lines | New File | Migration |
|---|----------|-------|----------|-----------|
| A01 | `formatFileSize(bytes)` | 249-254 | `lib/story-utils.ts` | Copy as-is |
| A02 | `isElectronDesktopApp()` | 256-258 | `lib/electron.ts` | Copy as-is |
| A03 | `slugifyLibraryFolderName(name)` | 396-403 | `lib/path-utils.ts` | Copy as-is |
| A04 | `createNamedError(name, msg)` | 405-413 | `lib/path-utils.ts` | Copy as-is |
| A05 | `getDescriptorNameFromPath(path)` | 415-422 | `lib/path-utils.ts` | Copy as-is |
| A06 | `isElectronHandleDescriptor(val)` | 424-429 | `lib/electron.ts` | Copy as-is |
| A07 | `serializeHandleForStorage(handle)` | 431-443 | `lib/electron.ts` | Copy as-is |
| A08 | `normalizeWritablePayload(writable)` | 445-459 | `lib/path-utils.ts` | Copy as-is |
| A09 | `toFiniteNumber(val, fallback)` | 589-592 | `lib/story-utils.ts` | Copy as-is |
| A10 | `toBoolean(val)` | 594-605 | `lib/story-utils.ts` | Copy as-is |
| A11 | `normalizePasswordValue(val)` | 607-609 | `lib/password-utils.ts` | Copy as-is |
| A12 | `hasPasswordValue(val)` | 611-613 | `lib/password-utils.ts` | Copy as-is |
| A13 | `normalizeStoryPasswordVault(vault)` | 626-642 | `lib/password-utils.ts` | Copy as-is |
| A14 | `buildStoryPasswordVaultPayload(entries)` | 644-651 | `lib/password-utils.ts` | Copy as-is |
| A15 | `getSavedStoryPassword(id)` | 653-659 | `lib/password-utils.ts` | Copy as-is |
| A16 | `storyPasswordMapsEqual(a, b)` | 780-789 | `lib/password-utils.ts` | Copy as-is |
| A17 | `toBase64(buf)` | 993-1001 | `lib/crypto-utils.ts` | Copy as-is |
| A18 | `fromBase64(str)` | 1003-1010 | `lib/crypto-utils.ts` | Copy as-is |
| A19 | `isWebCryptoReady()` | 1012-1014 | `lib/crypto-utils.ts` | Copy as-is |
| A20 | `ensureWebCryptoReady()` | 1016-1020 | `lib/crypto-utils.ts` | Copy as-is |
| A21 | `buildEncryptedPayload(ct, iv, salt)` | 1022-1024 | `lib/crypto-utils.ts` | Copy as-is |
| A22 | `parseEncryptedPayload(payload)` | 1026-1050 | `lib/crypto-utils.ts` | Copy as-is |
| A23 | `inferMimeTypeFromExtension(ext)` | 1052-1080 | `lib/media-utils.ts` | Copy as-is |
| A24 | `deriveEncryptionKey(password, salt)` | 1082-1107 | `lib/crypto-utils.ts` | Copy as-is |
| A25 | `encryptBytesToPayload(bytes, password)` | 1109-1130 | `lib/crypto-utils.ts` | Copy as-is |
| A26 | `decryptPayloadToBytes(payload, password)` | 1132-1158 | `lib/crypto-utils.ts` | Copy as-is |
| A27 | `encryptStoryMarkdown(markdown, password)` | 1160-1167 | `lib/crypto-utils.ts` | Copy as-is |
| A28 | `decryptStoryMarkdown(payload, password)` | 1169-1172 | `lib/crypto-utils.ts` | Copy as-is |
| A29 | `isEntryProtected(entry)` | 1174-1176 | `lib/crypto-utils.ts` | Copy as-is |
| A30 | `buildStoryCryptoContext(story, id)` | 1178-1186 | `lib/crypto-utils.ts` | Copy as-is |
| A31 | `normalizeBindingMap(saved, defaults)` | 1203-1215 | `lib/catalog-utils.ts` | Copy as-is |
| A32 | `normalizeColorTheme(saved, defaults)` | 1217-1228 | `lib/catalog-utils.ts` | Copy as-is |
| A33 | `normalizeHomepageColors(saved)` | 1230-1236 | `lib/catalog-utils.ts` | Copy as-is |
| A34 | `extractHomepageSettings(hpSettings)` | 1238-1269 | `lib/catalog-utils.ts` | Copy as-is |
| A35 | `extractViewerSettings(vSettings)` | 1271-1287 | `lib/catalog-utils.ts` | Copy as-is |
| A36 | `composeSettingsFile(hp, vw)` | 1289-1347 | `lib/catalog-utils.ts` | Copy as-is |
| A37 | `inferToastType(message)` | 1488-1506 | `lib/story-utils.ts` | Copy as-is |
| A38 | `getToastIcon(type)` | 1508-1526 | `lib/story-utils.ts` | Copy as-is |
| A39 | `getDialogIconByType(type)` | 1577-1595 | `lib/story-utils.ts` | Copy as-is |
| A40 | `formatByteSize(bytes)` | 2043-2057 | `lib/media-utils.ts` | Copy as-is |
| A41 | `buildLibraryStatsText(stats)` | 2059-2070 | `lib/catalog-utils.ts` | Copy as-is |
| A42 | `getLibraryBaseUrlStorageKey(libName)` | 2263-2268 | `lib/path-utils.ts` | Copy as-is |
| A43 | `loadLibraryBaseUrlMap()` | 2270-2284 | `lib/path-utils.ts` | Copy as-is |
| A44 | `saveLibraryBaseUrlMap(map)` | 2286-2291 | `lib/path-utils.ts` | Copy as-is |
| A45 | `getStoredLibraryBaseUrl(libName)` | 2293-2301 | `lib/path-utils.ts` | Copy as-is |
| A46 | `loadWorkflowState()` | 2303-2314 | `lib/path-utils.ts` | Copy as-is |
| A47 | `saveWorkflowStateMap(map)` | 2316-2321 | `lib/path-utils.ts` | Copy as-is |
| A48 | `saveCurrentWorkflowState(path)` | 2323-2339 | `lib/path-utils.ts` | Copy as-is |
| A49 | `getCurrentWorkflowState()` | 2341-2349 | `lib/path-utils.ts` | Copy as-is |
| A50 | `normalizeLibraryBaseUrl(libName, url)` | 2377-2418 | `lib/path-utils.ts` | Copy as-is |
| A51 | `getCurrentManagerLibraryBaseUrl()` | 2420-2430 | `lib/path-utils.ts` | Copy as-is |
| A52 | `getCurrentManagerLibraryFolderName()` | 2432-2443 | `lib/path-utils.ts` | Copy as-is |
| A53 | `buildRelativeLibraryBaseUrl(libName)` | 2445-2464 | `lib/path-utils.ts` | Copy as-is |
| A54 | `isManagerInsideSelectedLibrary(libName)` | 2466-2476 | `lib/path-utils.ts` | Copy as-is |
| A55 | `createMediaId()` | 2517-2520 | `lib/media-utils.ts` | Copy as-is |
| A56 | `getFileExtension(filename)` | 2522-2525 | `lib/media-utils.ts` | Copy as-is |
| A57 | `detectCoverMediaType(file)` | 2527-2537 | `lib/media-utils.ts` | Copy as-is |
| A58 | `createMediaItemFromFile(file, id)` | 2539-2552 | `lib/media-utils.ts` | Copy as-is |
| A59 | `createMediaItemFromPath(path, id)` | 2554-2567 | `lib/media-utils.ts` | Copy as-is |
| A60 | `getMediaItemById(items, id)` | 2569-2571 | `lib/media-utils.ts` | Copy as-is |
| A61 | `normalizeCoverPosition(pos)` | 2739-2764 | `lib/media-utils.ts` | Copy as-is |
| A62 | `formatCoverPositionValue(value)` | 2766-2770 | `lib/media-utils.ts` | Copy as-is |
| A63 | `getCoverPreviewMediaAspect(el)` | 2772-2789 | `lib/media-utils.ts` | Copy as-is |
| A64 | `computeCoverMediaRender(media, vw, vh)` | 2791-2804 | `lib/media-utils.ts` | Copy as-is |
| A65 | `estimateHomepageLayoutAspect(mode)` | 2806-2832 | `lib/media-utils.ts` | Copy as-is |
| A66 | `getCoverLayoutViewportSpec(mode)` | 2834-2841 | `lib/media-utils.ts` | Copy as-is |
| A67 | `normalizeCoverPositionMap(map, fallback)` | 2918-2929 | `lib/media-utils.ts` | Copy as-is |
| A68 | `loadCoverPositionForMode(mode)` | 2931-2937 | `lib/media-utils.ts` | Copy as-is |
| A69 | `normalizeCoverSelection(sel)` | 2953-2968 | `lib/media-utils.ts` | Copy as-is |
| A70 | `normalizeKey(key)` | 3014-3029 | `lib/media-utils.ts` | Copy as-is |
| A71 | `formatMediaTypeLabel(type)` | 3031-3035 | `lib/media-utils.ts` | Copy as-is |
| A72 | `formatMediaTypeBadge(type)` | 3037-3041 | `lib/media-utils.ts` | Copy as-is |
| A73 | `reorderMediaToIndex(items, id, idx)` | 3091-3103 | `lib/media-utils.ts` | Copy as-is |
| A74 | `getDropIndexFromClientY(container, y)` | 3127-3137 | `lib/media-utils.ts` | Copy as-is |
| A75 | `sanitizeCoverPresetMode(mode)` | 3601-3604 | `lib/media-utils.ts` | Copy as-is |
| A76 | `getCoverPresetPoints(mode)` | 3606-3608 | `lib/media-utils.ts` | Copy as-is |
| A77 | `findNearestPresetIndex(modes, x, y)` | 3610-3621 | `lib/media-utils.ts` | Copy as-is |
| A78 | `escapeRegExp(str)` | 3968-3970 | `lib/story-utils.ts` | Copy as-is |
| A79 | `loadAutoScanSetting()` | 3972-3975 | `lib/catalog-utils.ts` | Copy as-is |
| A80 | `saveAutoScanSetting(val)` | 3977-3979 | `lib/catalog-utils.ts` | Copy as-is |
| A81 | `loadCloseAfterSaveSetting()` | 3981-3987 | `lib/catalog-utils.ts` | Copy as-is |
| A82 | `saveCloseAfterSaveSetting(val)` | 3989-3991 | `lib/catalog-utils.ts` | Copy as-is |
| A83 | `clampImageCardHeight(val)` | 3993-3995 | `lib/media-utils.ts` | Copy as-is |
| A84 | `loadImageCardHeightSetting()` | 3997-4003 | `lib/media-utils.ts` | Copy as-is |
| A85 | `stripQueryAndHash(url)` | 4144-4146 | `lib/path-utils.ts` | Copy as-is |
| A86 | `isLikelyWindowsAbsolutePath(str)` | 4148-4150 | `lib/path-utils.ts` | Copy as-is |
| A87 | `canonicalizeProjectRelativePath(path)` | 4152-4166 | `lib/path-utils.ts` | Copy as-is |
| A88 | `extractProjectRelativePath(url, base)` | 4168-4195 | `lib/path-utils.ts` | Copy as-is |
| A89 | `normalizeCatalogPath(path, base)` | 4197-4242 | `lib/path-utils.ts` | Copy as-is |
| A90 | `getFileName(path)` | 4244-4253 | `lib/path-utils.ts` | Copy as-is |
| A91 | `normalizeRelativePath(path)` | 4255-4263 | `lib/path-utils.ts` | Copy as-is |
| A92 | `isDirectAssetUrl(path)` | 4283-4297 | `lib/path-utils.ts` | Copy as-is |
| A93 | `buildLibraryPathCandidates(baseUrl)` | 4299-4336 | `lib/path-utils.ts` | Copy as-is |
| A94 | `applyQueryToUrl(base, query)` | 4563-4582 | `lib/path-utils.ts` | Copy as-is |
| A95 | `buildLibraryPageUrl(base, page, query)` | 4584-4606 | `lib/path-utils.ts` | Copy as-is |
| A96 | `generateStoryId()` | 4762-4766 | `lib/story-utils.ts` | Copy as-is |
| A97 | `parseTags(raw)` | 4768-4773 | `lib/story-utils.ts` | Copy as-is |
| A98 | `isStandaloneMarkdownMarkerAt(text, pos)` | 4784-4795 | `lib/markdown-utils.ts` | Copy as-is |
| A99 | `findMarkdownMarkerBackward(text, pos)` | 4797-4810 | `lib/markdown-utils.ts` | Copy as-is |
| A100 | `findMarkdownMarkerForward(text, pos)` | 4812-4825 | `lib/markdown-utils.ts` | Copy as-is |
| A101 | `findEnclosingInlineMarkdownRange(text, pos)` | 4827-4851 | `lib/markdown-utils.ts` | Copy as-is |
| A102 | `toggleInlineMarkdown(textarea, delim)` | 4853-4904 | `lib/markdown-utils.ts` | Copy as-is |
| A103 | `togglePrefixedLines(textarea, prefix)` | 4906-4921 | `lib/markdown-utils.ts` | Copy as-is |
| A104 | `toggleLinkMarkdown(textarea)` | 4923-4946 | `lib/markdown-utils.ts` | Copy as-is |
| A105 | `toggleCodeMarkdown(textarea)` | 4948-4977 | `lib/markdown-utils.ts` | Copy as-is |
| A106 | `getStoryEditorSnapshot(textarea)` | 4979-4988 | `lib/markdown-utils.ts` | Copy as-is |
| A107 | `snapshotsEqual(a, b)` | 4990-4997 | `lib/markdown-utils.ts` | Copy as-is |
| A108 | `getNextReportNumber()` | 5247-5250 | `lib/story-utils.ts` | Copy as-is |
| A109 | `hasDisplayOrder()` | 5265-5267 | `lib/story-utils.ts` | Copy as-is |
| A110 | `getNextDisplayOrder()` | 5269-5275 | `lib/story-utils.ts` | Copy as-is |
| A111 | `getStorySearchTokens(query)` | 5919-5925 | `lib/story-utils.ts` | Copy as-is |
| A112 | `storyMatchesSearch(story, tokens)` | 5941-5956 | `lib/story-utils.ts` | Copy as-is |
| A113 | `sortStories(stories, sortBy, asc)` | 5758-5771 | `lib/story-utils.ts` | Copy as-is |
| A114 | `reindexReportNumbers()` | 5773-5778 | `lib/story-utils.ts` | Copy as-is |
| A115 | `applyDisplayOrder()` | 5780-5784 | `lib/story-utils.ts` | Copy as-is |
| A116 | `collectProtectedStoryMediaPaths(stories)` | 5675-5703 | `lib/story-utils.ts` | Copy as-is |
| A117 | `normalizeCatalog(catalog, settings)` | 3891-3966 | `lib/catalog-utils.ts` | Copy as-is |

### SECTION B: FILE_IO — Wrapped as service functions in `src/services/`

Logic stays, wrapped in try/catch, called from React hooks.

| # | Function | Lines | New File | Migration |
|---|----------|-------|----------|-----------|
| B01 | `hydrateElectronHandle(descriptor)` | 473-538 | `services/electron-bridge.ts` | Wrap as async |
| B02 | `hydrateStoredHandle(handle)` | 540-545 | `services/electron-bridge.ts` | Wrap as async |
| B03 | `toElectronPickerOptions(options)` | 547-557 | `services/electron-bridge.ts` | Wrap as async |
| B04 | `electronShowDirectoryPicker(options)` | 559-565 | `services/electron-bridge.ts` | Wrap as async |
| B05 | `electronShowOpenFilePicker(options)` | 567-575 | `services/electron-bridge.ts` | Wrap as async |
| B06 | `resolveElectronDecryptRootHandle()` | 577-582 | `services/electron-bridge.ts` | Wrap as async |
| B07 | `ensureHandleReadWritePermission(handle)` | 661-679 | `services/file-system.ts` | Wrap as async |
| B08 | `pickDecryptRootHandle(hint)` | 681-696 | `services/electron-bridge.ts` | Wrap as async |
| B09 | `ensureDecryptRootHandle()` | 698-754 | `services/password-vault.ts` | Wrap as async |
| B10 | `getStoryPasswordVaultDir(rootHandle)` | 756-766 | `services/password-vault.ts` | Wrap as async |
| B11 | `removeFileIfExists(dir, name)` | 768-778 | `services/file-system.ts` | Wrap as async |
| B12 | `getLegacyStoryPasswordVaultSources()` | 791-829 | `services/password-vault.ts` | Wrap as async |
| B13 | `migrateLegacyStoryPasswordVault(vault)` | 831-889 | `services/password-vault.ts` | Wrap as async |
| B14 | `writeStoryPasswordVault(vault)` | 891-905 | `services/password-vault.ts` | Wrap as async |
| B15 | `loadStoryPasswordVault()` | 907-924 | `services/password-vault.ts` | Wrap as async |
| B16 | `setSavedPassword(id, password)` | 926-937 | `services/password-vault.ts` | Wrap as async |
| B17 | `clearSavedStoryPassword(id)` | 939-946 | `services/password-vault.ts` | Wrap as async |
| B18 | `clearSavedStoryPasswords(ids)` | 948-964 | `services/password-vault.ts` | Wrap as async |
| B19 | `syncSavedStoryPassword(id, password)` | 966-973 | `services/password-vault.ts` | Wrap as async |
| B20 | `pruneSavedStoryPasswords(ids)` | 975-991 | `services/password-vault.ts` | Wrap as async |
| B21 | `saveMergedSettings(hp, vw)` | 1397-1430 | `services/catalog.ts` | Wrap as async |
| B22 | `openHandleDb()` | 1945-1957 | `services/file-system.ts` | Wrap as async |
| B23 | `saveStoredHandle(key, handle)` | 1959-1972 | `services/file-system.ts` | Wrap as async |
| B24 | `loadStoredHandle(key)` | 1974-1986 | `services/file-system.ts` | Wrap as async |
| B25 | `saveRecentHandle(handle)` | 1988-1990 | `services/file-system.ts` | Wrap as async |
| B26 | `loadRecentHandle()` | 1992-1994 | `services/file-system.ts` | Wrap as async |
| B27 | `saveDecryptRootHandle(handle)` | 1996-1998 | `services/file-system.ts` | Wrap as async |
| B28 | `loadDecryptRootHandle()` | 2000-2002 | `services/file-system.ts` | Wrap as async |
| B29 | `saveRelocateStartHandle(handle)` | 2004-2006 | `services/file-system.ts` | Wrap as async |
| B30 | `loadRelocateStartHandle()` | 2008-2010 | `services/file-system.ts` | Wrap as async |
| B31 | `pickRelocationFile()` | 2012-2041 | `services/electron-bridge.ts` | Wrap as async |
| B32 | `collectLibraryStats(handle)` | 2079-2126 | `services/catalog.ts` | Wrap as async |
| B33 | `refreshLibraryStats()` | 2128-2175 | `services/catalog.ts` | Wrap as async |
| B34 | `getDirectory(type, create)` | 4095-4097 | `services/file-system.ts` | Wrap as async |
| B35 | `getDatabaseDir()` | 4099-4101 | `services/file-system.ts` | Wrap as async |
| B36 | `getStoryDir()` | 4103-4105 | `services/file-system.ts` | Wrap as async |
| B37 | `getImageDir()` | 4107-4109 | `services/file-system.ts` | Wrap as async |
| B38 | `readJsonFile(dir, name)` | 4111-4123 | `services/file-system.ts` | Wrap as async |
| B39 | `readTextFile(dir, name)` | 4125-4133 | `services/file-system.ts` | Wrap as async |
| B40 | `fileExists(dir, name)` | 4135-4142 | `services/file-system.ts` | Wrap as async |
| B41 | `getLibraryFileFromRelativePath(path)` | 4338-4367 | `services/file-system.ts` | Wrap as async |
| B42 | `resolveMediaFileSize(path)` | 4369-4379 | `services/file-system.ts` | Wrap as async |
| B43 | `findLibraryFilePathByName(name)` | 4381-4433 | `services/file-system.ts` | Wrap as async |
| B44 | `cacheLibraryPreviewUrl(key, url)` | 4435-4445 | `services/file-system.ts` | Wrap as async |
| B45 | `createLibraryPreviewObjectUrl(dir, name)` | 4447-4475 | `services/file-system.ts` | Wrap as async |
| B46 | `resolveLibraryPreviewAssetUrl(path)` | 4477-4535 | `services/file-system.ts` | Wrap as async |
| B47 | `libraryPathExists(path)` | 4537-4539 | `services/file-system.ts` | Wrap as async |
| B48 | `findFirstExistingLibraryPath(paths)` | 4541-4561 | `services/file-system.ts` | Wrap as async |
| B49 | `verifyLaunchBaseUrl(url)` | 4608-4638 | `services/file-system.ts` | Wrap as async |
| B50 | `resolveLibraryLaunchBaseUrl()` | 4640-4675 | `services/file-system.ts` | Wrap as async |
| B51 | `writeFile(dir, name, content)` | 4755-4760 | `services/file-system.ts` | Wrap as async |
| B52 | `ensureStructure()` | 5277-5296 | `services/file-system.ts` | Wrap as async |
| B53 | `getFontsDir()` | 5298-5300 | `services/file-system.ts` | Wrap as async |
| B54 | `loadFontsIntoSelect()` | 5302-5306 | `services/file-system.ts` | Wrap as async |
| B55 | `updateFonts()` | 5308-5453 | `services/catalog.ts` | Wrap as async |
| B56 | `loadLibrary()` | 5456-5490 | `services/catalog.ts` | Wrap as async |
| B57 | `scanLibrary()` | 5492-5641 | `services/catalog.ts` | Wrap as async |
| B58 | `writeCatalog(stories)` | 5643-5673 | `services/catalog.ts` | Wrap as async |
| B59 | `buildProtectedMediaPayloadsForCatalog(stories)` | 5705-5743 | `services/catalog.ts` | Wrap as async |
| B60 | `writeCatalogSafetyBackup(stories)` | 5745-5756 | `services/catalog.ts` | Wrap as async |
| B61 | `autoSaveCurrentStory()` | 5829-5902 | `services/catalog.ts` | Wrap as async |
| B62 | `removeStoryFiles(id)` | 6316-6338 | `services/file-system.ts` | Wrap as async |
| B63 | `cleanupUnusedImages()` | 6340-6367 | `services/catalog.ts` | Wrap as async |
| B64 | `handleSave(e)` | 6369-6508 | `services/catalog.ts` | Wrap as async |
| B65 | `resolveMediaSourceData(item)` | 6510-6540 | `services/file-system.ts` | Wrap as async |
| B66 | `encodeMediaForWrite(item)` | 6542-6556 | `services/file-system.ts` | Wrap as async |
| B67 | `persistStoryImages(images)` | 6558-6658 | `services/catalog.ts` | Wrap as async |
| B68 | `persistCoverMedia(media)` | 6660-6740 | `services/catalog.ts` | Wrap as async |
| B69 | `cleanupImagesById(keepIds)` | 6742-6750 | `services/catalog.ts` | Wrap as async |
| B70 | `handleRemove()` | 6752-6803 | `services/catalog.ts` | Wrap as async |
| B71 | `handleCreateNewStory()` | 6805-6855 | `services/catalog.ts` | Wrap as async |
| B72 | `handleReindexStories()` | 6857-6881 | `services/catalog.ts` | Wrap as async |
| B73 | `fixMissingFiles()` | 6883-7115 | `services/catalog.ts` | Wrap as async |
| B74 | `saveRecentFolder(handle)` | 2246-2253 | `services/file-system.ts` | Wrap as async |
| B75 | `saveRecentStory(handle)` | 2255-2261 | `services/file-system.ts` | Wrap as async |
| B76 | `restoreCurrentWorkflowState(handle)` | 2351-2365 | `services/file-system.ts` | Wrap as async |
| B77 | `promptForLibraryBaseUrl()` | 2478-2515 | `services/electron-bridge.ts` | Wrap as async |
| B78 | `pickLibraryFolder()` | 4029-4093 | `services/electron-bridge.ts` | Wrap as async |
| B79 | `handleBuildLibrarySubmit(e)` | 1848-1943 | `services/catalog.ts` | Wrap as async |
| B80 | `chooseLibraryBuilderLocation()` | 1829-1846 | `services/electron-bridge.ts` | Wrap as async |
| B81 | `tryUseRecentHandle(automatic)` | 2197-2244 | `services/file-system.ts` | Wrap as async |
| B82 | `openLibraryPage(url)` | 4677-4715 | `services/electron-bridge.ts` | Wrap as async |
| B83 | `openHomepageFromSelectedLibrary()` | 4717-4725 | `services/electron-bridge.ts` | Wrap as async |
| B84 | `openStoryPreviewInSelectedLibrary(id)` | 4727-4753 | `services/electron-bridge.ts` | Wrap as async |
| B85 | `resolveExistingMediaPreviewUrl(id, path)` | 2595-2626 | `services/file-system.ts` | Wrap as async |
| B86 | `resolveExternalCoverPreviewUrl(media)` | 2628-2659 | `services/file-system.ts` | Wrap as async |

### SECTION C: STATE — Becomes React state in `src/stores/` and hooks

| # | Variable | Lines | Type | New Home | Migration |
|---|----------|-------|------|----------|-----------|
| C01 | `state.rootHandle` | 112 | `FileSystemDirectoryHandle` | `stores/app-state.tsx` | Context state |
| C02 | `state.stories` | 113 | `Story[]` | `stores/app-state.tsx` | Context state |
| C03 | `state.selectedId` | 114 | `string | null` | `stores/app-state.tsx` | Context state |
| C04 | `state.selectedEntry` | 115 | `Story | null` | `stores/app-state.tsx` | Context state |
| C05 | `state.currentLibraryUrl` | 116 | `string | null` | `stores/app-state.tsx` | Context state |
| C06 | `undoRedoState` | 121-126 | object | `hooks/useUndoHistory.ts` | Hook state |
| C07 | `storyInputHistoryTimer` | 127 | `number` | `hooks/useStory.ts` | Hook state |
| C08 | `libraryPreviewAssetUrlCache` | 148 | `Map` | `services/file-system.ts` | Module-level cache |
| C09 | `libraryPreviewPageUrls` | 149 | `Set` | `services/file-system.ts` | Module-level cache |
| C10 | `libraryFileLookupCache` | 150 | `Map` | `services/file-system.ts` | Module-level cache |
| C11 | `workingMediaItems` | 1432 | `MediaItem[]` | `hooks/useMedia.ts` | Hook state |
| C12 | `selectedMediaIds` | 1433 | `Set<string>` | `hooks/useMedia.ts` | Hook state |
| C13 | `mediaDragId` | 1434 | `string | null` | `hooks/useMedia.ts` | Hook state |
| C14 | `mediaDropIndex` | 1435 | `number | null` | `hooks/useMedia.ts` | Hook state |
| C15 | `mediaDropPlaceholderEl` | 1436 | `Element | null` | `hooks/useMedia.ts` | React ref |
| C16 | `selectedStoryIds` | 1437 | `Set<string>` | `stores/app-state.tsx` | Context state |
| C17 | `storySearchQuery` | 1438 | `string` | `hooks/useStory.ts` | Hook state |
| C18 | `storyDragId` | 1439 | `string | null` | `hooks/useStory.ts` | Hook state |
| C19 | `storyDropIndex` | 1440 | `number | null` | `hooks/useStory.ts` | Hook state |
| C20 | `storyDropPlaceholderEl` | 1441 | `Element | null` | `hooks/useStory.ts` | React ref |
| C21 | `libraryBuilderTargetHandle` | 1442 | handle | `hooks/useStory.ts` | Hook state |
| C22 | `libraryBuilderFolderNameTouched` | 1443 | `boolean` | `components/modals/LibraryBuilder.tsx` | Component state |
| C23 | `coverSelection` | 1444 | object | `hooks/useCoverPosition.ts` | Hook state |
| C24 | `externalCoverMedia` | 1445 | object | `hooks/useMedia.ts` | Hook state |
| C25 | `coverPosition` | 1446 | `{x,y}` | `hooks/useCoverPosition.ts` | Hook state |
| C26 | `coverViewportPosition` | 1447 | `{x,y}` | `hooks/useCoverPosition.ts` | Hook state |
| C27 | `coverPositionsByLayout` | 1448 | object | `hooks/useCoverPosition.ts` | Hook state |
| C28 | `coverPositionsByLayoutBeforeEdit` | 1449 | object | `hooks/useCoverPosition.ts` | Hook state |
| C29 | `coverPositionBeforeEdit` | 1450 | object | `hooks/useCoverPosition.ts` | Hook state |
| C30 | `coverViewportPositionBeforeEdit` | 1451 | object | `hooks/useCoverPosition.ts` | Hook state |
| C31 | `coverDragging` | 1452 | `boolean` | `hooks/useCoverPosition.ts` | Hook state |
| C32 | `coverDragStart` | 1453 | object | `hooks/useCoverPosition.ts` | Hook state |
| C33 | `coverPositionPreviewEl` | 1454 | `Element | null` | `hooks/useCoverPosition.ts` | React ref |
| C34 | `coverPresetMode` | 1455 | `string` | `hooks/useCoverPosition.ts` | Hook state |
| C35 | `mediaIdCounter` | 1456 | `number` | `lib/media-utils.ts` | Module counter |
| C36 | `imageCardHeight` | 1457 | `number` | `hooks/useMedia.ts` | Hook state |
| C37 | `pendingReplaceMediaId` | 1458 | `string | null` | `hooks/useMedia.ts` | Hook state |
| C38 | `decryptRootHandle` | 1459 | handle | `hooks/usePasswordVault.ts` | Hook state |
| C39 | `activeStoryPassword` | 1460 | `string` | `hooks/usePasswordVault.ts` | Hook state |
| C40 | `storyPasswordVault` | 1461 | object | `hooks/usePasswordVault.ts` | Hook state |
| C41 | `passwordUnlockTimer` | 1462 | `number` | `hooks/usePasswordVault.ts` | Hook ref |
| C42 | `mediaObjectUrls` | 1463 | `Map` | `hooks/useMedia.ts` | Hook state |
| C43 | `imageManagerRefreshQueued` | 1464 | `boolean` | `hooks/useMedia.ts` | Hook ref |
| C44 | `imageManagerRefreshFrameId` | 1465 | `number` | `hooks/useMedia.ts` | Hook ref |
| C45 | `libraryStatsRequestId` | 1466 | `number` | `hooks/useStory.ts` | Hook ref |
| C46 | `libraryStats` | 1467-1474 | object | `stores/app-state.tsx` | Context state |
| C47 | `dialogOpen` | 1575 | `boolean` | `components/modals/Dialog.tsx` | Component state |

### SECTION D: DOM ELEMENT REFERENCES — Becomes JSX or `useRef`

All ~110 `document.getElementById` calls from lines 1-110 plus scattered references.

| # | Old ID | Line | New Home | Migration |
|---|--------|------|----------|-----------|
| D01 | `choose-folder` | 1 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D02 | `build-library` | 2 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D03 | `open-recent` | 3 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D04 | `scan-library` | 4 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D05 | `reload-catalog` | 5 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D06 | `update-fonts` | 6 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D07 | `fix-missing` | 7 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D08 | `open-homepage` | 8 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D09 | `reveal-library` | 9 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D10 | `help-btn` | 10 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D11 | `help-modal` | 11 | `components/modals/HelpModal.tsx` | JSX `<Dialog>` |
| D12 | `help-close` | 12 | `components/modals/HelpModal.tsx` | JSX `<Button>` |
| D13 | `help-ok` | 13 | `components/modals/HelpModal.tsx` | JSX `<Button>` |
| D14 | `help-body` | 14 | `components/modals/HelpModal.tsx` | JSX content |
| D15 | `library-builder-overlay` | 15 | `components/modals/LibraryBuilder.tsx` | JSX `<Dialog>` |
| D16 | `library-builder-form` | 16 | `components/modals/LibraryBuilder.tsx` | JSX `<form>` |
| D17 | `library-builder-path` | 17 | `components/modals/LibraryBuilder.tsx` | JSX `<Input>` |
| D18 | `library-builder-pick-path` | 18 | `components/modals/LibraryBuilder.tsx` | JSX `<Button>` |
| D19 | `library-builder-folder-name` | 19 | `components/modals/LibraryBuilder.tsx` | JSX `<Input>` |
| D20 | `library-builder-name` | 20 | `components/modals/LibraryBuilder.tsx` | JSX `<Input>` |
| D21 | `library-builder-note` | 21 | `components/modals/LibraryBuilder.tsx` | JSX content |
| D22 | `library-builder-close` | 22 | `components/modals/LibraryBuilder.tsx` | JSX `<Button>` |
| D23 | `library-builder-cancel` | 23 | `components/modals/LibraryBuilder.tsx` | JSX `<Button>` |
| D24 | `library-builder-submit` | 24 | `components/modals/LibraryBuilder.tsx` | JSX `<Button type=submit>` |
| D25 | `auto-scan` | 25 | `components/layout/AppShell.tsx` | JSX `<Switch>` |
| D26 | `status` | 26 | `components/layout/StatusBar.tsx` | JSX content |
| D27 | `recent-info` | 27 | `components/layout/StatusBar.tsx` | JSX content |
| D28 | `status-bar-text` | 28 | `components/layout/StatusBar.tsx` | JSX content |
| D29 | `status-bar-recent` | 29 | `components/layout/StatusBar.tsx` | JSX content |
| D30 | `status-bar-library` | 30 | `components/layout/StatusBar.tsx` | JSX content |
| D31 | `app-titlebar` | 31 | `components/layout/ElectronChrome.tsx` | JSX |
| D32 | `app-titlebar-text` | 32 | `components/layout/ElectronChrome.tsx` | JSX content |
| D33 | `window-minimize` | 33 | `components/layout/ElectronChrome.tsx` | JSX `<Button>` |
| D34 | `window-maximize` | 34 | `components/layout/ElectronChrome.tsx` | JSX `<Button>` |
| D35 | `window-maximize-glyph` | 35 | `components/layout/ElectronChrome.tsx` | JSX content |
| D36 | `window-close` | 36 | `components/layout/ElectronChrome.tsx` | JSX `<Button>` |
| D37 | `story-form` | 37 | `components/story/StoryForm.tsx` | JSX `<form>` |
| D38 | `report-number` | 38 | `components/story/StoryForm.tsx` | JSX `<Input>` |
| D39 | `report-number-dec` | 39 | `components/story/StoryForm.tsx` | JSX `<Button>` |
| D40 | `report-number-inc` | 40 | `components/story/StoryForm.tsx` | JSX `<Button>` |
| D41 | `report-password` | 41 | `components/story/StoryForm.tsx` | JSX `<Input type=password>` |
| D42 | `report-password-clear` | 42 | `components/story/StoryForm.tsx` | JSX `<Button>` |
| D43 | `report-title` | 43 | `components/story/StoryForm.tsx` | JSX `<Input>` |
| D44 | `report-description` | 44 | `components/story/StoryForm.tsx` | JSX `<Input>` |
| D45 | `report-tags` | 45 | `components/story/StoryForm.tsx` | JSX `<Input>` |
| D46 | `cover-position` | 46 | `components/story/StoryForm.tsx` | JSX `<Input>` |
| D47 | `cover-picker-btn` | 47 | `components/media/CoverMediaUpload.tsx` | JSX `<Button>` |
| D48 | `set-cover-position-btn` | 48 | `components/story/StoryForm.tsx` | JSX `<Button>` |
| D49 | `cover-summary` | 49 | `components/media/CoverMediaUpload.tsx` | JSX content |
| D50 | `add-images-btn` | 50 | `components/media/ImageManager.tsx` | JSX `<Button>` |
| D51 | `remove-images-btn` | 51 | `components/media/ImageManager.tsx` | JSX `<Button>` |
| D52 | `upload-cover-media-btn` | 52 | `components/media/CoverMediaUpload.tsx` | JSX `<Button>` |
| D53 | `clear-cover-media-btn` | 53 | `components/media/CoverMediaUpload.tsx` | JSX `<Button>` |
| D54 | `image-manager-summary` | 54 | `components/media/ImageManager.tsx` | JSX content |
| D55 | `image-card-grid` | 55 | `components/media/ImageManager.tsx` | JSX grid |
| D56 | `.image-panel` | 56 | `components/media/ImageManager.tsx` | JSX section |
| D57 | `image-manager-input` | 57 | `components/media/ImageManager.tsx` | JSX `<Input type=file>` |
| D58 | `replace-image-input` | 58 | `components/media/ImageManager.tsx` | JSX `<Input type=file>` |
| D59 | `cover-media-input` | 59 | `components/media/CoverMediaUpload.tsx` | JSX `<Input type=file>` |
| D60 | `card-height-dec` | 60 | `components/media/ImageManager.tsx` | JSX `<Button>` |
| D61 | `card-height-inc` | 61 | `components/media/ImageManager.tsx` | JSX `<Button>` |
| D62 | `card-height-value` | 62 | `components/media/ImageManager.tsx` | JSX content |
| D63 | `markdown-toolbar` | 63 | `components/story/MarkdownToolbar.tsx` | JSX toolbar |
| D64 | `button[data-md-action]` | 64-66 | `components/story/MarkdownToolbar.tsx` | JSX buttons |
| D65 | `cover-position-overlay` | 67 | `components/cover/CoverPositionEditor.tsx` | JSX `<Dialog>` |
| D66 | `cover-position-frame` | 68 | `components/cover/CoverPositionEditor.tsx` | JSX div |
| D67 | `cover-layout-viewport` | 69 | `components/cover/CoverPositionEditor.tsx` | JSX div |
| D68 | `cover-layout-label` | 70 | `components/cover/CoverPositionEditor.tsx` | JSX content |
| D69 | `cover-preset-modes` | 71 | `components/cover/CoverPresetGrid.tsx` | JSX nav |
| D70 | `cover-preset-grid` | 72 | `components/cover/CoverPresetGrid.tsx` | JSX grid |
| D71 | `cover-preset-hint` | 73 | `components/cover/CoverPresetGrid.tsx` | JSX content |
| D72 | `cover-pos-top` | 74 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D73 | `cover-pos-up` | 75 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D74 | `cover-pos-down` | 76 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D75 | `cover-pos-bottom` | 77 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D76 | `cover-pos-left` | 78 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D77 | `cover-pos-right` | 79 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D78 | `cover-position-close` | 80 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D79 | `cover-position-save-layout` | 81 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D80 | `cover-position-reset` | 82 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D81 | `cover-position-cancel` | 83 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D82 | `cover-position-save` | 84 | `components/cover/CoverPositionEditor.tsx` | JSX `<Button>` |
| D83 | `media-preview-overlay` | 85 | `components/media/MediaPreview.tsx` | JSX `<Dialog>` |
| D84 | `media-preview-close` | 86 | `components/media/MediaPreview.tsx` | JSX `<Button>` |
| D85 | `media-preview-image` | 87 | `components/media/MediaPreview.tsx` | JSX `<img>` |
| D86 | `media-preview-video` | 88 | `components/media/MediaPreview.tsx` | JSX `<video>` |
| D87 | `.story-text-field` | 89 | `components/story/StoryForm.tsx` | JSX div |
| D88 | `story-text` | 90 | `components/story/StoryForm.tsx` | JSX `<textarea>` |
| D89 | `story-file` | 91 | `components/story/StoryForm.tsx` | JSX `<Input type=file>` |
| D90 | `story-list` | 92 | `components/story/StoryList.tsx` | JSX list container |
| D91 | `story-search` | 93 | `components/story/StorySearch.tsx` | JSX `<Input>` |
| D92 | `story-search-clear` | 94 | `components/story/StorySearch.tsx` | JSX `<Button>` |
| D93 | `close-after-save` | 95 | `components/story/StoryForm.tsx` | JSX `<Switch>` |
| D94 | `load-story-btn` | 96 | `components/story/StoryForm.tsx` | JSX `<Button>` |
| D95 | `clear-form` | 97 | `components/story/StoryForm.tsx` | JSX `<Button>` |
| D96 | `create-story` | 98 | `components/story/StoryList.tsx` | JSX `<Button>` |
| D97 | `remove-selected` | 99 | `components/story/StoryList.tsx` | JSX `<Button>` |
| D98 | `cleanup-selected` | 100 | `components/story/StoryList.tsx` | JSX `<Button>` |
| D99 | `reindex-stories` | 101 | `components/story/StoryList.tsx` | JSX `<Button>` |
| D100 | `delete-files` | 102 | `components/story/StoryList.tsx` | JSX `<Checkbox>` |
| D101 | `dialog-overlay` | 103 | `components/modals/Dialog.tsx` | JSX `<Dialog>` |
| D102 | `dialog-title` | 104 | `components/modals/Dialog.tsx` | JSX content |
| D103 | `dialog-icon` | 105 | `components/modals/Dialog.tsx` | JSX content |
| D104 | `dialog-message` | 106 | `components/modals/Dialog.tsx` | JSX content |
| D105 | `dialog-input` | 107 | `components/modals/Dialog.tsx` | JSX `<Input>` |
| D106 | `dialog-cancel` | 108 | `components/modals/Dialog.tsx` | JSX `<Button>` |
| D107 | `dialog-confirm` | 109 | `components/modals/Dialog.tsx` | JSX `<Button>` |
| D108 | `dialog-close` | 110 | `components/modals/Dialog.tsx` | JSX `<Button>` |
| D109 | `toast-container` | 1486 | `components/ui/Toast.tsx` | JSX container |
| D110 | `app-loading-screen` | 7946 | `components/ui/LoadingScreen.tsx` | JSX |
| D111 | `app-titlebar-logo` | 294 | `components/layout/ElectronChrome.tsx` | JSX `<img>` |
| D112 | `header h1` | 312 | `components/layout/ElectronChrome.tsx` | JSX content |
| D113 | `theme-toggle` | 7194 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D114 | `pin-window` | 7215 | `components/layout/ElectronChrome.tsx` | JSX `<Button>` |
| D115 | `accent-color-btn` | 7231 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D116 | `accent-color-input` | 7232 | `components/layout/AppShell.tsx` | JSX `<Input type=color>` |
| D117 | `settings-btn` | 7260 | `components/layout/AppShell.tsx` | JSX `<Button>` |
| D118 | `settings-modal` | 7261 | `components/modals/SettingsModal.tsx` | JSX `<Dialog>` |
| D119 | `settings-close` | 7262 | `components/modals/SettingsModal.tsx` | JSX `<Button>` |
| D120 | `setting-auto-run` | 7263 | `components/modals/SettingsModal.tsx` | JSX `<Switch>` |
| D121 | `setting-close-to-tray` | 7264 | `components/modals/SettingsModal.tsx` | JSX `<Switch>` |
| D122 | `setting-start-minimized` | 7265 | `components/modals/SettingsModal.tsx` | JSX `<Switch>` |
| D123 | `setting-follow-system` | 7266 | `components/modals/SettingsModal.tsx` | JSX `<Switch>` |
| D124 | `setting-ui-font` | 7267 | `components/modals/SettingsModal.tsx` | JSX `<Select>` |
| D125 | `delete-files-toggle` | 7419 | `components/story/StoryList.tsx` | JSX label |
| D126 | `save-btn` (querySelector) | 7873 | `components/story/StoryForm.tsx` | JSX `<Button type=submit>` |

### SECTION E: EVENT HANDLERS — Becomes React event handlers

All ~107 `addEventListener` calls. Each becomes a React `onClick`, `onChange`, `onKeyDown`, `onDragOver`, `onDrop`, etc. on the corresponding component.

| # | Old Element | Event | Old Handler | New Component | New Prop |
|---|-------------|-------|-------------|---------------|----------|
| E01 | `windowMinimizeBtn` | click | `runElectronWindowAction('minimize')` | `ElectronChrome` | `onMinimize` |
| E02 | `windowMaximizeBtn` | click | `runElectronWindowAction('toggle-maximize')` | `ElectronChrome` | `onMaximize` |
| E03 | `windowCloseBtn` | click | `runElectronWindowAction('close')` | `ElectronChrome` | `onClose` |
| E04 | `electronDesktopApi` | onWindowStateChanged | `applyElectronWindowState` | `ElectronChrome` | `useEffect` |
| E05 | toast closeBtn | click | `toast.remove()` | `Toast` | `onDismiss` |
| E06 | dialog confirm | click | `onConfirm()` | `Dialog` | `onConfirm` |
| E07 | dialog cancel | click | `onCancel()` | `Dialog` | `onCancel` |
| E08 | dialog close | click | `reject()` | `Dialog` | `onClose` |
| E09 | dialog keydown | keydown | Enter/Escape | `Dialog` | `onKeyDown` |
| E10 | `autoScanToggle` | change | `saveAutoScanSetting` | `AppShell` | `onCheckedChange` |
| E11 | `chooseFolderBtn` | click | `pickLibraryFolder` | `AppShell` | `onClick` |
| E12 | `buildLibraryBtn` | click | `openLibraryBuilder` | `AppShell` | `onClick` |
| E13 | `openRecentBtn` | click | `tryUseRecentHandle(false)` | `AppShell` | `onClick` |
| E14 | `openHomepageBtn` | click | open homepage (shift variant) | `AppShell` | `onClick` |
| E15 | `revealLibraryBtn` | click | reveal in explorer | `AppShell` | `onClick` |
| E16 | `scanLibraryBtn` | click | `scanLibrary` | `AppShell` | `onClick` |
| E17 | `reloadCatalogBtn` | click | `loadLibrary` | `AppShell` | `onClick` |
| E18 | `updateFontsBtn` | click | `updateFonts` | `AppShell` | `onClick` |
| E19 | `fixMissingBtn` | click | `fixMissingFiles` | `AppShell` | `onClick` |
| E20 | `themeToggleBtn` | click | toggle theme | `AppShell` | `onClick` |
| E21 | `pinWindowBtn` | click | toggle pin | `ElectronChrome` | `onClick` |
| E22 | `accentColorBtn` | click | open color picker | `AppShell` | `onClick` |
| E23 | `accentColorInput` | input | change accent | `AppShell` | `onChange` |
| E24 | `accentColorInput` | change | save accent | `AppShell` | `onChange` |
| E25 | `helpBtn` | click | `openHelpModal` | `AppShell` | `onClick` |
| E26 | `settingsBtn` | click | `openSettingsModal` | `AppShell` | `onClick` |
| E27 | `settingsClose` | click | `closeSettingsModal` | `SettingsModal` | `onClose` |
| E28 | `settingsModal` | click backdrop | `closeSettingsModal` | `SettingsModal` | backdrop click |
| E29 | `settingAutoRun` | change | save setting | `SettingsModal` | `onCheckedChange` |
| E30 | `settingStartMinimized` | change | save setting | `SettingsModal` | `onCheckedChange` |
| E31 | `settingCloseToTray` | change | save setting | `SettingsModal` | `onCheckedChange` |
| E32 | `settingFollowSystem` | change | save setting | `SettingsModal` | `onCheckedChange` |
| E33 | `settingUiFont` | change | update font | `SettingsModal` | `onValueChange` |
| E34 | `helpClose` | click | `closeHelpModal` | `HelpModal` | `onClose` |
| E35 | `helpOk` | click | `closeHelpModal` | `HelpModal` | `onClose` |
| E36 | `libraryBuilderCloseBtn` | click | `closeLibraryBuilder` | `LibraryBuilder` | `onClose` |
| E37 | `libraryBuilderCancelBtn` | click | `closeLibraryBuilder` | `LibraryBuilder` | `onClose` |
| E38 | `libraryBuilderPickPathBtn` | click | `chooseLibraryBuilderLocation` | `LibraryBuilder` | `onClick` |
| E39 | `libraryBuilderNameInput` | input | validate name | `LibraryBuilder` | `onChange` |
| E40 | `libraryBuilderFolderInput` | input | update path | `LibraryBuilder` | `onChange` |
| E41 | `libraryBuilderFolderInput` | blur | auto-name | `LibraryBuilder` | `onBlur` |
| E42 | `libraryBuilderForm` | submit | `handleBuildLibrarySubmit` | `LibraryBuilder` | `onSubmit` |
| E43 | `clearFormBtn` | click | `resetForm` | `StoryForm` | `onClick` |
| E44 | `removeSelectedBtn` | click | `handleRemove` | `StoryList` | `onClick` |
| E45 | `cleanupSelectedBtn` | click | `cleanupUnusedImages` | `StoryList` | `onClick` |
| E46 | `createStoryBtn` | click | `handleCreateNewStory` | `StoryList` | `onClick` |
| E47 | `reindexStoriesBtn` | click | `handleReindexStories` | `StoryList` | `onClick` |
| E48 | `deleteFilesToggle` | click | toggle checkbox | `StoryList` | `onClick` |
| E49 | `document` | keydown | Escape + Undo/Redo | `AppShell` | `useEffect` |
| E50 | `storyForm` | submit | `handleSave` | `StoryForm` | `onSubmit` |
| E51 | `markdownToolbar` | pointerdown | prevent default | `MarkdownToolbar` | `onPointerDown` |
| E52 | `markdownToolbar` | pointercancel | prevent default | `MarkdownToolbar` | `onPointerCancel` |
| E53 | `markdownToolbar` | click | execute action | `MarkdownToolbar` | `onClick` |
| E54 | `storyTextInput` | blur | auto-save check | `StoryForm` | `onBlur` |
| E55 | `storyTextInput` | input | track changes | `StoryForm` | `onChange` |
| E56 | `storyTextInput` | click | update toolbar | `StoryForm` | `onClick` |
| E57 | `storyTextInput` | keyup | update toolbar | `StoryForm` | `onKeyUp` |
| E58 | `storyTextInput` | select | update toolbar | `StoryForm` | `onSelect` |
| E59 | `storyTextInput` | keydown Tab | insert tab | `StoryForm` | `onKeyDown` |
| E60 | `reportPasswordClearBtn` | click | clear password | `StoryForm` | `onClick` |
| E61 | `reportNumberDecBtn` | click | `adjustReportNumber(-1)` | `StoryForm` | `onClick` |
| E62 | `reportNumberIncBtn` | click | `adjustReportNumber(1)` | `StoryForm` | `onClick` |
| E63 | `reportPasswordInput` | input | unlock story | `StoryForm` | `onChange` |
| E64 | `storySearchInput` | input | filter stories | `StorySearch` | `onChange` |
| E65 | `storySearchInput` | search | clear on x | `StorySearch` | `onChange` |
| E66 | `storySearchClearBtn` | click | clear search | `StorySearch` | `onClick` |
| E67 | `loadStoryBtn` | click | load story from file | `StoryForm` | `onClick` |
| E68 | `addImagesBtn` | click | open file picker | `ImageManager` | `onClick` |
| E69 | `imageManagerInput` | change | add images | `ImageManager` | `onChange` |
| E70 | `replaceImageInput` | change | replace image | `ImageManager` | `onChange` |
| E71 | `removeImagesBtn` | click | `removeSelectedMedia` | `ImageManager` | `onClick` |
| E72 | `cardHeightDecBtn` | click | `adjustImageCardHeight(-18)` | `ImageManager` | `onClick` |
| E73 | `cardHeightIncBtn` | click | `adjustImageCardHeight(18)` | `ImageManager` | `onClick` |
| E74 | `uploadCoverMediaBtn` | click | open file picker | `CoverMediaUpload` | `onClick` |
| E75 | `coverMediaInput` | change | add cover media | `CoverMediaUpload` | `onChange` |
| E76 | `imageCardGrid` | dragover | reorder preview | `ImageManager` | `onDragOver` |
| E77 | `imageCardGrid` | drop | reorder | `ImageManager` | `onDrop` |
| E78 | `storyListEl` | dragover | reorder preview | `StoryList` | `onDragOver` |
| E79 | `storyListEl` | drop | reorder | `StoryList` | `onDrop` |
| E80 | `clearCoverMediaBtn` | click | clear cover | `CoverMediaUpload` | `onClick` |
| E81 | `coverPickerBtn` | click | open cover picker | `CoverMediaUpload` | `onClick` |
| E82 | `setCoverPositionBtn` | click | `openCoverPositionEditor` | `StoryForm` | `onClick` |
| E83 | `coverPresetModes` | click | change mode | `CoverPresetGrid` | `onClick` |
| E84 | `coverPositionSaveLayout` | click | `saveCurrentLayoutCoverPosition` | `CoverPositionEditor` | `onClick` |
| E85 | `coverPosTop` | click | set top | `CoverPositionEditor` | `onClick` |
| E86 | `coverPosBottom` | click | set bottom | `CoverPositionEditor` | `onClick` |
| E87 | `coverPosUp` | click | `nudgeCoverPosition(0, -6)` | `CoverPositionEditor` | `onClick` |
| E88 | `coverPosDown` | click | `nudgeCoverPosition(0, 6)` | `CoverPositionEditor` | `onClick` |
| E89 | `coverPosLeft` | click | `nudgeCoverPosition(-6, 0)` | `CoverPositionEditor` | `onClick` |
| E90 | `coverPosRight` | click | `nudgeCoverPosition(6, 0)` | `CoverPositionEditor` | `onClick` |
| E91 | `coverPositionClose` | click | `cancelCoverPositionEdit` | `CoverPositionEditor` | `onClick` |
| E92 | `coverPositionCancel` | click | `cancelCoverPositionEdit` | `CoverPositionEditor` | `onClick` |
| E93 | `coverPositionReset` | click | `resetCoverPosition` | `CoverPositionEditor` | `onClick` |
| E94 | `coverPositionSave` | click | `saveCoverPositionEdit` | `CoverPositionEditor` | `onClick` |
| E95 | `coverPositionFrame` | mousedown | `startCoverDrag` | `CoverPositionEditor` | `onMouseDown` |
| E96 | `document` | mousemove | `moveCoverDrag` | `CoverPositionEditor` | `onMouseMove` |
| E97 | `document` | mouseup | `endCoverDrag` | `CoverPositionEditor` | `onMouseUp` |
| E98 | `window` | resize | update sizes | `AppShell` | `useEffect` |
| E99 | `mediaPreviewClose` | click | `closeMediaPreview` | `MediaPreview` | `onClose` |
| E100 | `storyFileInput` | change | load story file | `StoryForm` | `onChange` |
| E101 | `window` | beforeunload | cleanup | `AppShell` | `useEffect` |

### SECTION F: DOM_MUTATION FUNCTIONS — Becomes React components

| # | Old Function | Lines | New Component | Migration |
|---|-------------|-------|---------------|----------|
| F01 | `setElectronShellEnabled` | 286-305 | `ElectronChrome.tsx` | Conditional render |
| F02 | `updateElectronTitleBarText` | 307-317 | `ElectronChrome.tsx` | Props |
| F03 | `applyElectronWindowState` | 319-333 | `ElectronChrome.tsx` | Props + state |
| F04 | `setStatus` | 1476-1483 | `StatusBar.tsx` | Context/state |
| F05 | `showToast` | 1528-1573 | `Toast.tsx` + `toast-store.tsx` | Toast provider |
| F06 | `showThemedDialog` | 1597-1709 | `Dialog.tsx` | Promise-based dialog |
| F07 | `openHelpModal` | 1743-1750 | `HelpModal.tsx` | State toggle |
| F08 | `closeHelpModal` | 1752-1758 | `HelpModal.tsx` | State toggle |
| F09 | `toggleStorySelection` | 1760-1770 | `StoryList.tsx` | State toggle |
| F10 | `setLibraryBuilderTargetHandle` | 1772-1779 | `LibraryBuilder.tsx` | State |
| F11 | `resetLibraryBuilderForm` | 1781-1796 | `LibraryBuilder.tsx` | Form reset |
| F12 | `openLibraryBuilder` | 1798-1816 | `LibraryBuilder.tsx` | State toggle |
| F13 | `closeLibraryBuilder` | 1818-1827 | `LibraryBuilder.tsx` | State toggle |
| F14 | `renderLibraryStatsBar` | 2072-2077 | `StatusBar.tsx` | Props |
| F15 | `updateRecentInfo` | 2177-2195 | `StatusBar.tsx` | Props |
| F16 | `renderImageManager` | 3223-3533 | `ImageManager.tsx` + `ImageCard.tsx` | Full component |
| F17 | `appendMediaTypeBadge` | 3043-3053 | `ImageCard.tsx` | JSX |
| F18 | `clearMediaDropPlaceholder` | 3105-3113 | `ImageManager.tsx` | State + ref |
| F19 | `ensureMediaDropPlaceholder` | 3115-3125 | `ImageManager.tsx` | State + ref |
| F20 | `autoScrollDuringDrag` | 3139-3152 | `ImageManager.tsx` | useEffect |
| F21 | `updateMediaDropPlaceholder` | 3154-3173 | `ImageManager.tsx` | State + ref |
| F22 | `openMediaPreview` | 3175-3209 | `MediaPreview.tsx` | State toggle |
| F23 | `closeMediaPreview` | 3211-3221 | `MediaPreview.tsx` | State toggle |
| F24 | `updateCoverPresetModeButtons` | 3623-3639 | `CoverPresetGrid.tsx` | State |
| F25 | `updateCoverPresetGridSelection` | 3641-3654 | `CoverPresetGrid.tsx` | State |
| F26 | `renderCoverPresetGrid` | 3656-3687 | `CoverPresetGrid.tsx` | Full component |
| F27 | `updateCoverLayoutViewport` | 3689-3704 | `CoverPositionEditor.tsx` | State |
| F28 | `applyCoverPosition` | 3706-3721 | `CoverPreview.tsx` | Style prop |
| F29 | `renderCoverPositionPreview` | 3731-3767 | `CoverPreview.tsx` | Full component |
| F30 | `openCoverPositionEditor` | 3769-3793 | `CoverPositionEditor.tsx` | State toggle |
| F31 | `closeCoverPosition` | 3795-3808 | `CoverPositionEditor.tsx` | State toggle |
| F32 | `startCoverDrag` | 3853-3864 | `CoverPositionEditor.tsx` | Mouse events |
| F33 | `moveCoverDrag` | 3866-3878 | `CoverPositionEditor.tsx` | Mouse events |
| F34 | `endCoverDrag` | 3880-3885 | `CoverPositionEditor.tsx` | Mouse events |
| F35 | `renderStoryList` | 5958-6076 | `StoryList.tsx` + `StoryCard.tsx` | Full component |
| F36 | `clearStoryDropPlaceholder` | 5786-5794 | `StoryList.tsx` | State + ref |
| F37 | `ensureStoryDropPlaceholder` | 5796-5805 | `StoryList.tsx` | State + ref |
| F38 | `updateStoryDropPlaceholder` | 5807-5826 | `StoryList.tsx` | State + ref |
| F39 | `applyImageCardHeightSetting` | 4005-4021 | `ImageManager.tsx` | Style prop |
| F40 | `refreshStorySearchUi` | 5927-5933 | `StorySearch.tsx` | State |
| F41 | `openSettingsModal` | 7269-7275 | `SettingsModal.tsx` | State toggle |
| F42 | `closeSettingsModal` | 7277-7281 | `SettingsModal.tsx` | State toggle |
| F43 | `loadSettingsIntoUI` | 7283-7296 | `SettingsModal.tsx` | Props |
| F44 | `loadSystemFontsIntoUI` | 7298-7310 | `SettingsModal.tsx` | Props |
| F45 | `initIcons` | 7852-7894 | All components | Lucide React icons |
| F46 | `updateReportPasswordClearButtonState` | 619-624 | `StoryForm.tsx` | State |
| F47 | `setStoryEditorLocked` | 1188-1201 | `StoryForm.tsx` | State |
| F48 | `updateMarkdownToolbarState` | 5012-5031 | `MarkdownToolbar.tsx` | State |
| F49 | `restoreStoryEditorSnapshot` | 4999-5010 | `StoryForm.tsx` | State + ref |
| F50 | `replaceTextSelection` | 4775-4782 | `StoryForm.tsx` | State + ref |
| F51 | `editStory` | 6135-6271 | `StoryForm.tsx` | Props + useEffect |
| F52 | `resetForm` | 6273-6314 | `StoryForm.tsx` | Form reset |
| F53 | `adjustReportNumber` | 5252-5263 | `StoryForm.tsx` | Increment/decrement |
| F54 | `getMediaObjectUrl` | 2573-2581 | `services/file-system.ts` | Service function |
| F55 | `releaseUnusedMediaUrls` | 2716-2732 | `hooks/useMedia.ts` | useEffect cleanup |
| F56 | `releaseAllMediaUrls` | 2734-2737 | `hooks/useMedia.ts` | useEffect cleanup |
| F57 | `clearLibraryPreviewAssetUrls` | 4265-4275 | `services/file-system.ts` | Module function |
| F58 | `clearLibraryPreviewCaches` | 4277-4281 | `services/file-system.ts` | Module function |
| F59 | `resetMediaPreviewState` | 2697-2714 | `hooks/useMedia.ts` | State reset |
| F60 | `notifyPreviewWindowsReload` | 260-271 | `services/electron-bridge.ts` | Service function |

### SECTION G: INIT_SETUP — Becomes React initialization

| # | Old Setup | Lines | New Home | Migration |
|---|-----------|-------|----------|-----------|
| G01 | DOM element refs collection | 1-110 | All components | JSX + refs |
| G02 | `toastContainer` ref | 1486 | `components/ui/Toast.tsx` | JSX container |
| G03 | Electron chrome init | 358-394 | `components/layout/ElectronChrome.tsx` | useEffect |
| G04 | `autoScanToggle` init | 7117-7120 | `components/layout/AppShell.tsx` | useState + useEffect |
| G05 | `closeAfterSaveToggle` init | 7121-7125 | `components/story/StoryForm.tsx` | useState |
| G06 | Settings button visibility | 7324-7329 | `components/layout/AppShell.tsx` | Conditional render |
| G07 | `accentColorInput` init | 7234-7238 | `hooks/useTheme.ts` | useState + useEffect |
| G08 | `imageCardHeight` init | 7916-7917 | `hooks/useMedia.ts` | useState + useEffect |
| G09 | `coverPresetMode` init | 7918 | `hooks/useCoverPosition.ts` | useState + useEffect |
| G10 | `coverPositionsByLayout` init | 7919 | `hooks/useCoverPosition.ts` | useState |
| G11 | `updateCoverPresetModeButtons` | 7923 | `CoverPresetGrid.tsx` | useEffect |
| G12 | `renderCoverPresetGrid` | 7924 | `CoverPresetGrid.tsx` | JSX (always renders) |
| G13 | `applyCoverPosition` | 7925 | `CoverPreview.tsx` | Inline style |
| G14 | `updateRecentInfo` | 7926 | `StatusBar.tsx` | Props |
| G15 | `renderImageManager` | 7927 | `ImageManager.tsx` | JSX (always renders) |
| G16 | `storySearchQuery` init | 7928-7929 | `StorySearch.tsx` | useState |
| G17 | `updateReportPasswordClearButtonState` | 7930 | `StoryForm.tsx` | Inline |
| G18 | `setStoryEditorLocked` | 7931 | `StoryForm.tsx` | useState |
| G19 | `initUndoHistory` | 7932 | `hooks/useUndoHistory.ts` | useEffect |
| G20 | `buildLibraryBtn.disabled` | 7933-7938 | `AppShell.tsx` | Feature check |
| G21 | `initializeElectronWindowChrome` | 7939 | `ElectronChrome.tsx` | useEffect |
| G22 | `window.beforeunload` | 7940-7943 | `AppShell.tsx` | useEffect cleanup |
| G23 | `tryUseRecentHandle(true)` | 7944 | `hooks/useLibrary.ts` | useEffect |
| G24 | Loading screen removal | 7946-7954 | `components/ui/LoadingScreen.tsx` | State toggle |
| G25 | `supportsFileSystemAccess()` | 7906-7914 | `hooks/useLibrary.ts` | Feature detect |
| G26 | `storyFileInput` handler | 7897-7904 | `StoryForm.tsx` | onChange |
| G27 | `initIcons()` | 7895 | All components | Inline JSX icons |

---

## Step-by-Step Execution Order

Each step is one actionable item. We'll work through them sequentially.

### Phase 0: Scaffolding ✅ (`81b13d4`)
- [x] **0.1** — Create Vite + React + TypeScript project in `Manager Tools/react-ui/`
- [x] **0.2** — Install shadcn/ui (Tailwind, CSS variables, design tokens)
- [x] **0.3** — Set up CSS variables with shadcn design tokens (light + dark)
- [x] **0.4** — Configure `vite.config.ts` for Electron/Tauri compatibility
  - Added `@tailwindcss/vite` plugin, `@/` path alias
- [x] **0.5** — Add `tsconfig.json` with strict mode + path mappings
- [x] **0.6** — Create `components.json` for shadcn/ui
- [x] **0.7** — Install Radix UI primitives + Lucide icons + utility libs
- [x] **0.8** — Create shadcn components: Button, Card, Input, Badge, Separator + `cn()` utility
- [x] **0.9** — Verify `tsc --noEmit` and `vite build` both pass cleanly
- [x] **0.10** — Commit checkpoint at `81b13d4`

### Phase 1: Foundation — Copy pure logic + services
- [ ] **1.1** — Copy all A01–A117 to `src/lib/` files (pure logic, no changes needed)
- [ ] **1.2** — Wrap all B01–B86 to `src/services/` files (file I/O, same logic)
- [ ] **1.3** — Create `src/types/` with TypeScript interfaces
- [ ] **1.4** — Create `src/stores/app-state.tsx` context
- [ ] **1.5** — Create `src/stores/toast-store.tsx`
- [ ] **1.6** — Create `src/stores/theme-store.tsx`

### Phase 2: Layout shell
- [ ] **2.1** — `LoadingScreen.tsx`
- [ ] **2.2** — `ElectronChrome.tsx`
- [ ] **2.3** — `StatusBar.tsx`
- [ ] **2.4** — `AppShell.tsx` (main layout)
- [ ] **2.5** — `App.tsx` (wire everything)

### Phase 3: Story management
- [ ] **3.1** — `StoryList.tsx` + `StoryCard.tsx`
- [ ] **3.2** — `StorySearch.tsx`
- [ ] **3.3** — `StoryForm.tsx` (form + fields)
- [ ] **3.4** — `MarkdownToolbar.tsx`
- [ ] **3.5** — `hooks/useStory.ts`
- [ ] **3.6** — `hooks/useUndoHistory.ts`

### Phase 4: Media management
- [ ] **4.1** — `ImageManager.tsx` + `ImageCard.tsx`
- [ ] **4.2** — `MediaPreview.tsx`
- [ ] **4.3** — `CoverMediaUpload.tsx`
- [ ] **4.4** — `hooks/useMedia.ts`

### Phase 5: Cover position editor
- [ ] **5.1** — `CoverPositionEditor.tsx`
- [ ] **5.2** — `CoverPresetGrid.tsx`
- [ ] **5.3** — `CoverPreview.tsx`
- [ ] **5.4** — `hooks/useCoverPosition.ts`

### Phase 6: Modals
- [ ] **6.1** — `Dialog.tsx`
- [ ] **6.2** — `HelpModal.tsx`
- [ ] **6.3** — `SettingsModal.tsx`
- [ ] **6.4** — `LibraryBuilder.tsx`

### Phase 7: UI primitives
- [ ] **7.1** — `Toast.tsx` (shadcn toast)
- [ ] **7.2** — Install all shadcn/ui primitives:
  - `button`, `card`, `input`, `dialog`, `select`, `switch`, `badge`, `separator`, `tooltip`, `command`, `checkbox`, `label`, `tabs`, `scroll-area`, `popover`

### Phase 8: Hooks
- [ ] **8.1** — `hooks/useLibrary.ts`
- [ ] **8.2** — `hooks/useSettings.ts`
- [ ] **8.3** — `hooks/useTheme.ts`
- [ ] **8.4** — `hooks/usePasswordVault.ts`

### Phase 9: Integration + cutover
- [ ] **9.1** — Wire all hooks into App.tsx
- [ ] **9.2** — Replace `Data_Manager.html` with `index.html`
- [ ] **9.3** — Update `main.js` to load React build
- [ ] **9.4** — Update `preload.js` if needed
- [ ] **9.5** — Test full save/load cycle in Electron
- [ ] **9.6** — Test in Tauri
- [ ] **9.7** — Test offline operation
- [ ] **9.8** — Remove old `js/data_manager.js` (keep as backup)

### Phase 10: Polish
- [ ] **10.1** — Verify all 107 event handlers work
- [ ] **10.2** — Verify all 110 DOM elements render
- [ ] **10.3** — Verify drag-drop reordering
- [ ] **10.4** — Verify cover position editor
- [ ] **10.5** — Verify password vault
- [ ] **10.6** — Verify theming (light/dark/accent)
- [ ] **10.7** — Update build scripts and README

---

## Dependency Map

```
lib/* (pure logic)          →  no deps
services/* (file I/O)       →  depends on lib/*
types/*                     →  no deps
hooks/*                     →  depends on services/* + lib/* + stores/*
components/ui/* (shadcn)    →  no deps (copied)
components/layout/*         →  depends on hooks/* + stores/*
components/story/*          →  depends on hooks/* + lib/* + stores/*
components/media/*          →  depends on hooks/* + lib/*
components/cover/*          →  depends on hooks/* + lib/*
components/modals/*         →  depends on hooks/* + stores/*
stores/*                    →  no deps
```

This means: **lib → services → hooks → components** — a clean dependency chain.
