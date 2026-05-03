const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs/promises');
const path = require('path');

function createNamedError(name, message, code = '') {
    const error = new Error(message);
    error.name = name;
    if (code) {
        error.code = code;
    }
    return error;
}

function makeDescriptor(targetPath, kind) {
    const resolved = path.resolve(targetPath);
    return {
        kind,
        name: path.basename(resolved),
        path: resolved,
    };
}

function normalizeChildName(name) {
    const normalized = String(name || '').trim();
    if (!normalized || normalized === '.' || normalized === '..' || /[\\/]/.test(normalized)) {
        throw createNamedError('TypeError', 'Invalid entry name.');
    }
    return normalized;
}

function inferMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.avif': 'image/avif',
        '.bmp': 'image/bmp',
        '.gif': 'image/gif',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.json': 'application/json',
        '.md': 'text/markdown',
        '.mov': 'video/quicktime',
        '.mp4': 'video/mp4',
        '.ogg': 'video/ogg',
        '.ogv': 'video/ogg',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.txt': 'text/plain',
        '.webm': 'video/webm',
        '.webp': 'image/webp',
    };
    return mimeTypes[ext] || '';
}

async function pathExists(targetPath) {
    try {
        await fs.access(targetPath);
        return true;
    } catch (error) {
        return false;
    }
}

async function getDirectoryHandle(parentPath, name, create = false) {
    const childName = normalizeChildName(name);
    const targetPath = path.resolve(parentPath, childName);
    try {
        const stats = await fs.stat(targetPath);
        if (!stats.isDirectory()) {
            throw createNamedError('TypeMismatchError', `Expected "${childName}" to be a directory.`);
        }
        return makeDescriptor(targetPath, 'directory');
    } catch (error) {
        if (error && error.code === 'ENOENT' && create) {
            await fs.mkdir(targetPath, { recursive: true });
            return makeDescriptor(targetPath, 'directory');
        }
        if (error && error.code === 'ENOENT') {
            throw createNamedError('NotFoundError', `Directory "${childName}" was not found.`, 'ENOENT');
        }
        throw error;
    }
}

async function getFileHandle(parentPath, name, create = false) {
    const childName = normalizeChildName(name);
    const targetPath = path.resolve(parentPath, childName);
    try {
        const stats = await fs.stat(targetPath);
        if (!stats.isFile()) {
            throw createNamedError('TypeMismatchError', `Expected "${childName}" to be a file.`);
        }
        return makeDescriptor(targetPath, 'file');
    } catch (error) {
        if (error && error.code === 'ENOENT' && create) {
            await fs.mkdir(path.dirname(targetPath), { recursive: true });
            await fs.writeFile(targetPath, '');
            return makeDescriptor(targetPath, 'file');
        }
        if (error && error.code === 'ENOENT') {
            throw createNamedError('NotFoundError', `File "${childName}" was not found.`, 'ENOENT');
        }
        throw error;
    }
}

async function listDirectory(dirPath) {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
        throw createNamedError('TypeMismatchError', 'Expected a directory path.');
    }
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
        .filter(entry => entry.isDirectory() || entry.isFile())
        .sort((left, right) => {
            if (left.isDirectory() && !right.isDirectory()) {
                return -1;
            }
            if (!left.isDirectory() && right.isDirectory()) {
                return 1;
            }
            return left.name.localeCompare(right.name);
        })
        .map(entry => makeDescriptor(
            path.join(dirPath, entry.name),
            entry.isDirectory() ? 'directory' : 'file',
        ));
}

async function removeEntry(parentPath, name, recursive = false) {
    const childName = normalizeChildName(name);
    const targetPath = path.resolve(parentPath, childName);
    await fs.rm(targetPath, {
        recursive: !!recursive,
        force: false,
    });
}

async function readFile(filePath) {
    const [buffer, stats] = await Promise.all([
        fs.readFile(filePath),
        fs.stat(filePath),
    ]);
    return {
        name: path.basename(filePath),
        type: inferMimeType(filePath),
        lastModified: Number.isFinite(stats.mtimeMs) ? Math.round(stats.mtimeMs) : Date.now(),
        data: Uint8Array.from(buffer),
    };
}

async function writeFile(filePath, data) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    if (typeof data === 'string') {
        await fs.writeFile(filePath, data);
        return true;
    }
    if (data instanceof Uint8Array) {
        await fs.writeFile(filePath, Buffer.from(data));
        return true;
    }
    if (ArrayBuffer.isView(data)) {
        await fs.writeFile(filePath, Buffer.from(data.buffer, data.byteOffset, data.byteLength));
        return true;
    }
    if (data instanceof ArrayBuffer) {
        await fs.writeFile(filePath, Buffer.from(data));
        return true;
    }
    await fs.writeFile(filePath, '');
    return true;
}

contextBridge.exposeInMainWorld('electronDataManager', {
    isDesktopApp: true,
    electronVersion: process.versions.electron,
    showDirectoryPicker: options => ipcRenderer.invoke('data-manager:show-directory-picker', options || {}),
    showOpenFilePicker: options => ipcRenderer.invoke('data-manager:show-open-file-picker', options || {}),
    openLibraryPage: payload => ipcRenderer.invoke('data-manager:open-library-page', payload || {}),
    pathExists,
    getDirectoryHandle,
    getFileHandle,
    listDirectory,
    removeEntry,
    readFile,
    writeFile,
});
