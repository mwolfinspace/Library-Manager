(function () {
    const tauri = window.__TAURI__;
    const invoke = tauri && tauri.core && tauri.core.invoke;
    const tauriEvent = tauri && tauri.event;

    if (typeof invoke !== 'function') {
        return;
    }

    const listeners = new Set();

    function call(command, args) {
        return invoke(command, args || {});
    }

    function emitWindowState(state) {
        listeners.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                // Ignore listener failures so one bad callback cannot break chrome updates.
            }
        });
    }

    if (tauriEvent && typeof tauriEvent.listen === 'function') {
        ['focus', 'blur', 'resize', 'move'].forEach(eventName => {
            tauriEvent.listen(`tauri://${eventName}`, () => {
                call('get_window_state').then(state => {
                    if (state) emitWindowState(state);
                }).catch(() => {});
            });
        });
    }

    const api = {
        showDirectoryPicker(options = {}) {
            return call('show_directory_picker', { options });
        },
        showOpenFilePicker(options = {}) {
            return call('show_open_file_picker', { options });
        },
        pathExists(targetPath) {
            return call('path_exists', { targetPath });
        },
        readFile(filePath) {
            return call('read_file', { filePath });
        },
        async writeFile(filePath, data) {
            if (typeof data === 'string') {
                return call('write_file', { filePath, data });
            }
            if (data instanceof Blob) {
                data = await data.arrayBuffer();
            }
            if (data instanceof ArrayBuffer) {
                return call('write_file', { filePath, data: Array.from(new Uint8Array(data)) });
            }
            if (ArrayBuffer.isView(data)) {
                return call('write_file', {
                    filePath,
                    data: Array.from(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)),
                });
            }
            return call('write_file', { filePath, data: '' });
        },
        getDirectoryHandle(parentPath, name, create = false) {
            return call('get_directory_handle', { parentPath, name, create });
        },
        getFileHandle(parentPath, name, create = false) {
            return call('get_file_handle', { parentPath, name, create });
        },
        removeEntry(parentPath, name, recursive = false) {
            return call('remove_entry', { parentPath, name, recursive });
        },
        listDirectory(directoryPath) {
            return call('list_directory', { directoryPath });
        },
        openLibraryPage(payload) {
            return call('open_library_page', { payload });
        },
        buildNewLibrary(payload) {
            return call('build_new_library', { payload });
        },
        async minimizeWindow() {
            const state = await call('window_action', { action: 'minimize' });
            emitWindowState(state);
            return state;
        },
        async toggleMaximizeWindow() {
            const state = await call('window_action', { action: 'toggle-maximize' });
            emitWindowState(state);
            return state;
        },
        async closeWindow() {
            const state = await call('window_action', { action: 'close' });
            emitWindowState(state);
            return state;
        },
        getWindowState() {
            return call('get_window_state');
        },
        onWindowStateChanged(callback) {
            if (typeof callback === 'function') {
                listeners.add(callback);
            }
        },
        getAppPath() {
            return call('get_app_path');
        },
        getEmojiFontUrl() {
            return call('get_emoji_font_url');
        },
        revealInExplorer(folderPath) {
            return call('reveal_in_explorer', { folderPath });
        },
        resolveLibraryPath(libraryName) {
            return call('resolve_library_path', { libraryName });
        },
        saveLibraryPath(libraryPath) {
            return call('save_library_path', { libraryPath });
        },
        async pickLibraryFolder() {
            const result = await call('pick_library_folder');
            if (result && result.success && result.path) {
                const name = result.path.split(/[/\\]/).filter(Boolean).pop() || 'library';
                result.handle = {
                    kind: 'directory',
                    path: result.path,
                    name: name,
                };
            }
            return result;
        },
        setAlwaysOnTop(value) {
            return call('set_always_on_top', { value });
        },
        getAlwaysOnTop() {
            return call('get_always_on_top');
        },
        getPreviewWindowData() {
            return call('get_preview_window_data');
        },
        reloadCurrentPage(payload = {}) {
            return call('reload_preview_windows', payload);
        },
        getSettings() {
            return call('get_settings');
        },
        saveSettings(settings) {
            return call('save_settings', { settings });
        },
        getSystemFonts() {
            return call('get_system_fonts');
        },
        getLogoPath() {
            return call('get_logo_path');
        },
    };

    window.xedrykDataManager = api;
    window.electronDataManager = api;
}());
