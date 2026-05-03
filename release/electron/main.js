const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs/promises');
const path = require('path');

function getProjectRoot() {
    return path.resolve(__dirname, '..', '..');
}

function getManagerHtmlPath() {
    return path.join(getProjectRoot(), 'Manager Tools', 'Data_Manager.html');
}

function createMainWindow() {
    const mainWindow = new BrowserWindow({
        width: 1600,
        height: 980,
        minWidth: 1180,
        minHeight: 760,
        title: 'Xedryk Data Manager',
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile(getManagerHtmlPath());
    mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    return mainWindow;
}

function getOwnerWindow(webContents) {
    return BrowserWindow.fromWebContents(webContents) || null;
}

function normalizeQueryObject(query) {
    if (!query) {
        return undefined;
    }
    if (typeof query === 'string') {
        const text = query.startsWith('?') ? query.slice(1) : query;
        return Object.fromEntries(new URLSearchParams(text));
    }
    if (typeof query !== 'object' || Array.isArray(query)) {
        return undefined;
    }
    const normalized = {};
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            normalized[key] = String(value);
        }
    });
    return Object.keys(normalized).length > 0 ? normalized : undefined;
}

async function normalizeDefaultPath(targetPath) {
    if (!targetPath) {
        return undefined;
    }
    try {
        const stats = await fs.stat(targetPath);
        return stats.isDirectory() ? targetPath : path.dirname(targetPath);
    } catch (error) {
        return targetPath;
    }
}

function makeDescriptor(targetPath, kind) {
    const resolved = path.resolve(targetPath);
    return {
        kind,
        name: path.basename(resolved),
        path: resolved,
    };
}

function toDialogFilters(types = []) {
    const filters = [];
    for (const type of Array.isArray(types) ? types : []) {
        const accept = type && typeof type === 'object' ? type.accept : null;
        const extensions = new Set();
        if (accept && typeof accept === 'object') {
            Object.values(accept).forEach(list => {
                if (!Array.isArray(list)) {
                    return;
                }
                list.forEach(ext => {
                    const normalized = String(ext || '').trim().replace(/^\./, '').toLowerCase();
                    if (normalized) {
                        extensions.add(normalized);
                    }
                });
            });
        }
        if (extensions.size > 0) {
            filters.push({
                name: type && type.description ? String(type.description) : 'Files',
                extensions: Array.from(extensions),
            });
        }
    }
    return filters;
}

ipcMain.handle('data-manager:show-directory-picker', async (event, options = {}) => {
    const ownerWindow = getOwnerWindow(event.sender);
    const defaultPath = await normalizeDefaultPath(options.startInPath);
    const result = await dialog.showOpenDialog(ownerWindow, {
        title: 'Choose Library Folder',
        defaultPath,
        properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) {
        return null;
    }
    return makeDescriptor(result.filePaths[0], 'directory');
});

ipcMain.handle('data-manager:show-open-file-picker', async (event, options = {}) => {
    const ownerWindow = getOwnerWindow(event.sender);
    const defaultPath = await normalizeDefaultPath(options.startInPath);
    const properties = ['openFile'];
    if (options.multiple) {
        properties.push('multiSelections');
    }
    const result = await dialog.showOpenDialog(ownerWindow, {
        title: 'Choose File',
        defaultPath,
        properties,
        filters: toDialogFilters(options.types),
    });
    if (result.canceled || !Array.isArray(result.filePaths)) {
        return [];
    }
    return result.filePaths.map(filePath => makeDescriptor(filePath, 'file'));
});

ipcMain.handle('data-manager:open-library-page', async (_event, payload = {}) => {
    const rootPath = path.resolve(String(payload.rootPath || ''));
    const relativePath = String(payload.relativePath || '').replace(/^[/\\]+/, '');
    if (!rootPath || !relativePath) {
        return false;
    }

    const targetPath = path.resolve(rootPath, relativePath);
    const relativeToRoot = path.relative(rootPath, targetPath);
    if (!relativeToRoot || relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
        return false;
    }

    try {
        await fs.access(targetPath);
    } catch (error) {
        return false;
    }

    const previewWindow = new BrowserWindow({
        width: 1440,
        height: 960,
        autoHideMenuBar: true,
        title: payload.label ? `Preview - ${payload.label}` : 'Preview',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    await previewWindow.loadFile(targetPath, {
        query: normalizeQueryObject(payload.query),
    });
    return true;
});

app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
