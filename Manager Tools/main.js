const { app, BrowserWindow, dialog, ipcMain, shell, Tray, Menu, nativeTheme } = require('electron');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { exec } = require('node:child_process');

app.setName('Xedryk Data Manager');
app.setAppUserModelId('com.xedryk.datamanager');

app.commandLine.appendSwitch('disable-frame-rate-limit');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('use-gl', 'angle');
app.commandLine.appendSwitch('use-angle', 'd3d11');
app.commandLine.appendSwitch('enable-features', [
  'Vulkan,DefaultANGLEVulkan,VulkanFromANGLE',
].join(','));

const IS_WINDOWS = process.platform === 'win32';
const APP_ID = 'com.xedryk.datamanager';

const previewWindows = new Set();
let appTray = null;
let managerWindow = null;
let splashWindow = null;

const SPLASH_HTML = `<!DOCTYPE html><html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#1a1a2e;display:flex;align-items:center;justify-content:center;height:100vh;font-family:'Segoe UI',sans-serif;overflow:hidden;user-select:none}
wrap{display:flex;flex-direction:column;align-items:center;gap:12px}
.logo{width:64px;height:64px;background:url("file:///__ICON__") center/contain no-repeat;filter:drop-shadow(0 2px 8px rgba(100,140,255,.3))}
.name{font-size:13px;font-weight:600;color:rgba(255,255,255,.85);letter-spacing:.5px}
.bar{width:140px;height:2px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden}
.fill{height:100%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:2px;width:0;animation:load 1.8s ease-in-out infinite}
@keyframes load{0%{width:0;margin-left:0}50%{width:70%}100%{width:0;margin-left:100%}}
</style></head><body>
<div class="wrap"><div class="logo"></div><div class="name">Xedryk Data Manager</div><div class="bar"><div class="fill"></div></div></div>
</body></html>`;

function createSplashWindow() {
  const iconPath = getAppResourcePath('app.ico');
  const html = SPLASH_HTML.replace('__ICON__', iconPath.replace(/\\/g, '/'));
  splashWindow = new BrowserWindow({
    width: 300,
    height: 220,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    backgroundColor: '#1a1a2e',
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });
  splashWindow.setMenuBarVisibility(false);
  splashWindow.loadURL(`data:text/html,${encodeURIComponent(html)}`);
}

const DEFAULT_SETTINGS = {
  autoRun: false,
  closeToTray: false,
  startMinimized: false,
  followSystem: false,
  uiFont: '',
};

let startedMinimized = false;

function getSettingsPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'settings.json');
}

async function loadSettings() {
  const settingsPath = getSettingsPath();
  try {
    const data = await fs.readFile(settingsPath, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings(settings) {
  const settingsPath = getSettingsPath();
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  return true;
}

function getSystemFonts() {
  const fonts = [
    'Segoe UI',
    'Arial',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Tahoma',
    'Calibri',
    'Cambria',
    'Comic Relief',
    'Geo',
    'IBM Plex Mono',
    'Lexend Deca',
    'Literata',
    'Nova Square',
    'Orbitron',
    'Quantico',
    'Roboto Mono',
    'Share Tech Mono',
    'SN Pro',
    'Space Mono',
    'VT323',
  ];
  return Promise.resolve(fonts);
}

let currentSettings = { ...DEFAULT_SETTINGS };

function createTray() {
  if (appTray) {
    return;
  }
  try {
    const iconPath = getAppResourcePath('app.ico');
    if (fsSync.existsSync(iconPath)) {
      appTray = new Tray(iconPath);
      updateTrayMenu();
      appTray.setToolTip('Xedryk Data Manager');
      appTray.on('double-click', () => {
        if (managerWindow) {
          showMainWindow();
        }
      });
    }
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

function updateTrayMenu() {
  if (!appTray) return;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => showMainWindow(),
    },
    {
      label: 'Hide Window',
      click: () => hideMainWindow(),
    },
    { type: 'separator' },
    {
      label: 'Exit',
      click: () => {
        app.quit();
      },
    },
  ]);
  appTray.setContextMenu(contextMenu);
}

function showMainWindow() {
  if (!managerWindow || managerWindow.isDestroyed()) {
    createManagerWindow();
  }
  if (managerWindow) {
    managerWindow.show();
    if (managerWindow.isMinimized()) {
      managerWindow.restore();
    }
    managerWindow.focus();
  }
}

function hideMainWindow() {
  if (managerWindow && !managerWindow.isDestroyed()) {
    managerWindow.hide();
  }
}

function destroyTray() {
  if (appTray) {
    appTray.destroy();
    appTray = null;
  }
}

function ensureTray() {
  if (appTray) {
    return;
  }
  try {
    const iconPath = getAppResourcePath('app.ico');
    if (fsSync.existsSync(iconPath)) {
      appTray = new Tray(iconPath);
    } else {
      console.error('Tray icon not found:', iconPath);
      return;
    }
    updateTrayMenu();
    appTray.setToolTip('Xedryk Data Manager');
    appTray.on('double-click', () => {
      if (managerWindow) {
        showMainWindow();
      }
    });
  } catch (error) {
    console.error('Failed to create tray:', error);
  }
}

function setAutoRun(enable) {
  const exePath = process.execPath;
  const appName = 'XedrykDataManager';
  const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

  if (enable) {
    exec(`reg add "${regKey}" /v "${appName}" /t REG_SZ /d "\\"${exePath}\\"" /f`, (error) => {
      if (error) {
        console.error('Failed to enable auto-run:', error);
      }
    });
  } else {
    exec(`reg delete "${regKey}" /v "${appName}" /f`, (error) => {
      if (error) {
        console.error('Failed to disable auto-run:', error);
      }
    });
  }
}

async function applySettings(settings) {
  currentSettings = { ...DEFAULT_SETTINGS, ...settings };
  if (currentSettings.autoRun && currentSettings.startMinimized) {
    startedMinimized = true;
  }
  setAutoRun(!!currentSettings.autoRun);
  if (currentSettings.closeToTray) {
    ensureTray();
    if (managerWindow && !managerWindow.isDestroyed()) {
      if (!managerWindow._closeToTrayHandler) {
        managerWindow._closeToTrayHandler = (event) => {
          if (!app.isQuitting) {
            event.preventDefault();
            hideMainWindow();
          }
        };
        managerWindow.on('close', managerWindow._closeToTrayHandler);
      }
    }
  } else {
    if (managerWindow && !managerWindow.isDestroyed()) {
      if (managerWindow._closeToTrayHandler) {
        managerWindow.removeListener('close', managerWindow._closeToTrayHandler);
        managerWindow._closeToTrayHandler = null;
      }
    }
    destroyTray();
  }
  if (currentSettings.followSystem) {
    nativeTheme.themeSource = 'system';
  }
}

function getAppResourcePath(relativePath) {
  const appPath = app.getAppPath();
  const unpackedPath = appPath.replace(/\.asar$/, '.asar.unpacked');
  const unpackedFullPath = path.join(unpackedPath, relativePath);
  if (fsSync.existsSync(unpackedFullPath)) {
    return unpackedFullPath;
  }
  return path.join(appPath, relativePath);
}

const MANAGER_HTML_PATH = getAppResourcePath('Data_Manager.html');
const PRELOAD_PATH = getAppResourcePath('preload.js');
const DEFAULT_GALLERY_PATH = getAppResourcePath('default_gallery');
const TRAY_ICON_PATH = getAppResourcePath('build/logo.ico');
const EMPTY_WINDOW_STATE = {
  isFocused: false,
  isFullScreen: false,
  isMaximized: false,
  isMinimized: false,
};

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.avi': 'video/x-msvideo',
  '.bmp': 'image/bmp',
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.html': 'text/html',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.m4v': 'video/x-m4v',
  '.md': 'text/markdown',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.ogg': 'video/ogg',
  '.ogv': 'video/ogg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.txt': 'text/plain',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

if (IS_WINDOWS) {
  app.setAppUserModelId(APP_ID);
}

function isPathInside(parentPath, targetPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(targetPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function ensurePathInside(parentPath, targetPath, label) {
  if (!isPathInside(parentPath, targetPath)) {
    throw new Error(`${label} must stay inside the selected folder.`);
  }
}

function normalizeEntryName(name) {
  const value = String(name || '').trim();
  if (!value || value === '.' || value === '..' || value.includes('/') || value.includes('\\')) {
    throw new Error('Invalid entry name.');
  }
  return value;
}

function resolveChildPath(parentPath, name) {
  const safeName = normalizeEntryName(name);
  const resolvedParent = path.resolve(parentPath);
  const childPath = path.resolve(resolvedParent, safeName);
  ensurePathInside(resolvedParent, childPath, 'Entry path');
  return childPath;
}

function normalizeRelativeSegments(relativePath) {
  const source = String(relativePath || '');
  const segments = source.split(/[\\/]+/).filter(Boolean);
  if (segments.length === 0 || segments.some(segment => segment === '.' || segment === '..')) {
    throw new Error('Invalid relative path.');
  }
  return segments;
}

function resolveLibraryPath(rootPath, relativePath) {
  const resolvedRoot = path.resolve(rootPath);
  const segments = normalizeRelativeSegments(relativePath);
  const targetPath = path.resolve(resolvedRoot, ...segments);
  ensurePathInside(resolvedRoot, targetPath, 'Library path');
  return targetPath;
}

function toDescriptor(targetPath, kind) {
  const resolvedPath = path.resolve(targetPath);
  return {
    kind,
    name: path.basename(resolvedPath),
    path: resolvedPath,
  };
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return MIME_TYPES[extension] || '';
}

function normalizeDialogDefaultPath(candidatePath, { directoryOnly = false } = {}) {
  if (!candidatePath) {
    return undefined;
  }

  const resolvedPath = path.resolve(String(candidatePath));
  if (fsSync.existsSync(resolvedPath)) {
    const stats = fsSync.statSync(resolvedPath);
    if (directoryOnly && !stats.isDirectory()) {
      return path.dirname(resolvedPath);
    }
    return resolvedPath;
  }

  const parentPath = path.dirname(resolvedPath);
  return fsSync.existsSync(parentPath) ? parentPath : undefined;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeLibraryName(value) {
  const name = String(value || '').trim();
  if (!name) {
    throw new Error('Library name is required.');
  }
  return name;
}

function applyLibraryBranding(html, libraryName) {
  const safeName = escapeHtml(libraryName);
  const safeUpper = escapeHtml(libraryName.toUpperCase());

  return String(html || '')
    .replace(/Xedryk Archive - Part 01/g, safeName)
    .replace(/Xedryk's Archive/g, safeName)
    .replace(/Xedryk Archive/g, safeName)
    .replace(/XEDRYK ARCHIVE/g, safeUpper)
    .replace(/Legacy Report/g, safeName);
}

async function personalizeLibraryTemplate(targetRootPath, libraryName) {
  const homepagePath = path.join(targetRootPath, 'homepage.html');
  const indexPath = path.join(targetRootPath, 'index.html');

  if (fsSync.existsSync(homepagePath)) {
    const homepageHtml = await fs.readFile(homepagePath, 'utf8');
    await fs.writeFile(homepagePath, applyLibraryBranding(homepageHtml, libraryName), 'utf8');
  }

  if (fsSync.existsSync(indexPath)) {
    const indexHtml = await fs.readFile(indexPath, 'utf8');
    const updatedIndex = applyLibraryBranding(indexHtml, libraryName)
      .replace(/Redirecting to <a href="homepage\.html">homepage\.html<\/a>\.\.\./g, `Redirecting to <a href="homepage.html">${escapeHtml(libraryName)}</a>...`);
    await fs.writeFile(indexPath, updatedIndex, 'utf8');
  }
}

function toDialogFilters(types = []) {
  const filters = [];

  for (const type of Array.isArray(types) ? types : []) {
    const accept = type && typeof type.accept === 'object' ? type.accept : {};
    const extensions = Object.values(accept)
      .flatMap(value => Array.isArray(value) ? value : [])
      .map(extension => String(extension || '').trim().replace(/^\./, '').toLowerCase())
      .filter(Boolean);

    if (extensions.length > 0) {
      filters.push({
        name: type.description || 'Supported files',
        extensions: Array.from(new Set(extensions)),
      });
    }
  }

  return filters;
}

function applyQuery(url, query) {
  if (!query) {
    return;
  }

  if (typeof query === 'string') {
    url.search = query.startsWith('?') ? query.slice(1) : query;
    return;
  }

  if (query instanceof URLSearchParams) {
    url.search = query.toString();
    return;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }
  url.search = params.toString();
}

function createManagerWindow() {
  const iconPath = getAppResourcePath('app.ico');
  managerWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    frame: false,
    roundedCorners: true,
    transparent: true,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f3f3f3',
    title: 'Xedryk Data Manager',
    icon: iconPath,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  });

  managerWindow.setMenuBarVisibility(false);
  managerWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  attachWindowStateEvents(managerWindow);
  managerWindow.loadFile(MANAGER_HTML_PATH);

  managerWindow.once('ready-to-show', () => {
    managerWindow.show();
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
  });

  managerWindow.on('closed', () => {
    managerWindow = null;
  });
}

function createPreviewWindow(title, windowData = {}) {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    autoHideMenuBar: true,
    backgroundColor: '#f3f3f3',
    title,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  window.windowData = windowData;
  previewWindows.add(window);

  window.on('closed', () => {
    previewWindows.delete(window);
  });

  window.setMenuBarVisibility(false);
  attachWindowStateEvents(window);
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(String(url || ''))) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });
  return window;
}

function normalizeWritePayload(data) {
  if (typeof data === 'string') {
    return data;
  }
  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  return '';
}

function getWindowState(window) {
  if (!window || window.isDestroyed()) {
    return EMPTY_WINDOW_STATE;
  }
  return {
    isFocused: window.isFocused(),
    isFullScreen: window.isFullScreen(),
    isMaximized: window.isMaximized(),
    isMinimized: window.isMinimized(),
  };
}

function emitWindowState(window) {
  if (window.isDestroyed()) {
    return;
  }
  window.webContents.send('data-manager:window-state', getWindowState(window));
}

function attachWindowStateEvents(window) {
  const events = [
    'blur',
    'enter-full-screen',
    'focus',
    'leave-full-screen',
    'maximize',
    'minimize',
    'move',
    'resize',
    'ready-to-show',
    'restore',
    'unmaximize',
  ];

  for (const eventName of events) {
    window.on(eventName, () => {
      emitWindowState(window);
    });
  }
}

function registerIpcHandlers() {
  ipcMain.handle('data-manager:show-directory-picker', async (_event, options = {}) => {
    const result = await dialog.showOpenDialog({
      title: 'Choose Library Folder',
      properties: ['openDirectory'],
      defaultPath: normalizeDialogDefaultPath(options.startInPath, { directoryOnly: true }),
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return toDescriptor(result.filePaths[0], 'directory');
  });

  ipcMain.handle('data-manager:show-open-file-picker', async (_event, options = {}) => {
    const properties = ['openFile'];
    if (options.multiple) {
      properties.push('multiSelections');
    }

    const result = await dialog.showOpenDialog({
      title: 'Select File',
      properties,
      filters: toDialogFilters(options.types),
      defaultPath: normalizeDialogDefaultPath(options.startInPath),
    });

    if (result.canceled || result.filePaths.length === 0) {
      return [];
    }

    return result.filePaths.map(filePath => toDescriptor(filePath, 'file'));
  });

  ipcMain.handle('data-manager:path-exists', async (_event, targetPath) => {
    try {
      await fs.access(path.resolve(String(targetPath)));
      return true;
    } catch (error) {
      return false;
    }
  });

  ipcMain.handle('data-manager:read-file', async (_event, filePath) => {
    const resolvedPath = path.resolve(String(filePath));
    const [buffer, stats] = await Promise.all([
      fs.readFile(resolvedPath),
      fs.stat(resolvedPath),
    ]);

    return {
      name: path.basename(resolvedPath),
      type: getMimeType(resolvedPath),
      lastModified: stats.mtimeMs,
      data: Uint8Array.from(buffer),
    };
  });

  ipcMain.handle('data-manager:write-file', async (_event, filePath, data) => {
    const resolvedPath = path.resolve(String(filePath));
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, normalizeWritePayload(data));
    return true;
  });

  ipcMain.handle('data-manager:get-directory-handle', async (_event, parentPath, name, create = false) => {
    const directoryPath = resolveChildPath(String(parentPath), name);
    if (create) {
      await fs.mkdir(directoryPath, { recursive: true });
    } else {
      const stats = await fs.stat(directoryPath);
      if (!stats.isDirectory()) {
        throw new Error('Requested path is not a directory.');
      }
    }
    return toDescriptor(directoryPath, 'directory');
  });

  ipcMain.handle('data-manager:get-file-handle', async (_event, parentPath, name, create = false) => {
    const filePath = resolveChildPath(String(parentPath), name);
    if (create) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      const handle = await fs.open(filePath, 'a');
      await handle.close();
    } else {
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error('Requested path is not a file.');
      }
    }
    return toDescriptor(filePath, 'file');
  });

  ipcMain.handle('data-manager:remove-entry', async (_event, parentPath, name, recursive = false) => {
    const entryPath = resolveChildPath(String(parentPath), name);
    const stats = await fs.stat(entryPath);

    if (stats.isDirectory()) {
      await fs.rm(entryPath, { recursive: !!recursive, force: false });
    } else {
      await fs.unlink(entryPath);
    }

    return true;
  });

  ipcMain.handle('data-manager:list-directory', async (_event, directoryPath) => {
    const resolvedPath = path.resolve(String(directoryPath));
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });

    return entries.map(entry => {
      const kind = entry.isDirectory() ? 'directory' : 'file';
      return toDescriptor(path.join(resolvedPath, entry.name), kind);
    });
  });

  ipcMain.handle('data-manager:open-library-page', async (_event, payload = {}) => {
    const rootPath = String(payload.rootPath || '');
    const relativePath = String(payload.relativePath || '');
    const label = String(payload.label || 'Library Preview');
    const pageType = String(payload.pageType || 'homepage');

    try {
      const absolutePath = resolveLibraryPath(rootPath, relativePath);
      const fileUrl = pathToFileURL(absolutePath);
      applyQuery(fileUrl, payload.query);

      const previewWindow = createPreviewWindow(label, {
        rootPath: path.resolve(rootPath),
        relativePath,
        pageType,
        query: payload.query || {},
      });
      await previewWindow.loadURL(fileUrl.href);
      previewWindow.show();
      return true;
    } catch (error) {
      return false;
    }
  });

  ipcMain.handle('data-manager:reload-preview-windows', async (_event, payload = {}) => {
    const rootPath = path.resolve(String(payload.rootPath || ''));
    let reloaded = 0;
    for (const win of previewWindows) {
      if (!win.isDestroyed() && win.windowData) {
        const storedPath = path.resolve(win.windowData.rootPath || '');
        if (storedPath === rootPath) {
          try {
            await win.webContents.reload();
            reloaded++;
          } catch (error) {
            console.error('Failed to reload preview window:', error);
          }
        }
      }
    }
    return reloaded;
  });

  ipcMain.handle('data-manager:get-preview-window-data', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && win.windowData) {
      return win.windowData;
    }
    return null;
  });

  ipcMain.handle('data-manager:build-new-library', async (_event, payload = {}) => {
    const parentSource = String(payload.parentPath || '').trim();
    if (!parentSource) {
      throw new Error('Destination folder is required.');
    }
    const parentPath = path.resolve(parentSource);
    const folderName = normalizeEntryName(payload.folderName || '');
    const libraryName = normalizeLibraryName(payload.libraryName || '');

    if (!fsSync.existsSync(DEFAULT_GALLERY_PATH)) {
      throw new Error('The default gallery template is missing.');
    }

    const targetRootPath = path.resolve(parentPath, folderName);
    ensurePathInside(parentPath, targetRootPath, 'New library path');

    try {
      await fs.access(targetRootPath);
      throw new Error(`A folder named "${folderName}" already exists in that location.`);
    } catch (error) {
      if (error && error.code !== 'ENOENT') {
        throw error;
      }
    }

    await fs.mkdir(parentPath, { recursive: true });
    await fs.cp(DEFAULT_GALLERY_PATH, targetRootPath, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    await personalizeLibraryTemplate(targetRootPath, libraryName);

    return {
      folderName,
      handle: toDescriptor(targetRootPath, 'directory'),
      libraryName,
      targetPath: targetRootPath,
    };
  });

  ipcMain.handle('data-manager:window-action', (event, action) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) {
      return getWindowState(BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0] || null);
    }

    switch (action) {
      case 'close':
        window.close();
        break;
      case 'minimize':
        window.minimize();
        break;
      case 'toggle-maximize':
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
        break;
      default:
        break;
    }

    return getWindowState(window);
  });

  ipcMain.handle('data-manager:get-window-state', event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return getWindowState(window);
  });

  ipcMain.handle('data-manager:get-app-path', () => {
    return app.getPath('exe');
  });

  ipcMain.handle('data-manager:get-emoji-font-url', async () => {
    const emojiFontPath = path.join(__dirname, 'default_gallery', 'fonts', 'emoji', 'Segoe.UI.Emoji.with.Twemoji.Flags.ttf');
    try {
      const buffer = await fs.readFile(emojiFontPath);
      const base64 = buffer.toString('base64');
      return `data:font/truetype;base64,${base64}`;
    } catch (error) {
      return null;
    }
  });

  ipcMain.handle('data-manager:resolve-library-path', async (_event, libraryName) => {
    try {
      const exeDir = path.dirname(app.getPath('exe'));
      const recentPath = path.join(exeDir, 'recent-library.txt');
      try {
        const savedPath = await fs.readFile(recentPath, 'utf8');
        if (savedPath && savedPath.trim()) {
          return savedPath.trim();
        }
      } catch (e) {
      }
      return null;
    } catch (error) {
      return null;
    }
  });

  ipcMain.handle('data-manager:save-library-path', async (_event, libraryPath) => {
    try {
      const exeDir = path.dirname(app.getPath('exe'));
      const recentPath = path.join(exeDir, 'recent-library.txt');
      await fs.writeFile(recentPath, String(libraryPath || ''), 'utf8');
      return true;
    } catch (error) {
      return false;
    }
  });

  ipcMain.handle('data-manager:pick-library-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Library Folder',
    });
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    return { success: true, path: result.filePaths[0] };
  });

  ipcMain.handle('data-manager:reveal-in-explorer', async (_event, folderPath) => {
    try {
      let cleanPath = decodeURIComponent(String(folderPath || ''));
      cleanPath = cleanPath.replace(/^[\\/]([a-zA-Z]:[\\/])/, '$1');
      const finalPath = path.normalize(cleanPath);
      if (!finalPath) {
        return { success: false, error: 'No path provided' };
      }
      const errorMessage = await shell.openPath(finalPath);
      if (errorMessage) {
        return { success: false, error: errorMessage };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('data-manager:set-always-on-top', (_event, value) => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      window.setAlwaysOnTop(Boolean(value));
      return window.isAlwaysOnTop();
    }
    return false;
  });

  ipcMain.handle('data-manager:get-always-on-top', () => {
    const window = BrowserWindow.getFocusedWindow();
    if (window) {
      return window.isAlwaysOnTop();
    }
    return false;
  });

  ipcMain.handle('data-manager:get-settings', async () => {
    return await loadSettings();
  });

  ipcMain.handle('data-manager:save-settings', async (_event, settings) => {
    await saveSettings(settings);
    await applySettings(settings);
    return true;
  });

  ipcMain.handle('data-manager:get-system-fonts', async () => {
    return await getSystemFonts();
  });

  ipcMain.handle('data-manager:get-logo-path', async () => {
    const candidates = ['logo.png', 'logo.ico', 'app.ico'];
    for (const name of candidates) {
      const logoPath = getAppResourcePath(name);
      if (fsSync.existsSync(logoPath)) {
        try {
          const buffer = await fs.readFile(logoPath);
          const ext = path.extname(name).toLowerCase();
          const mime = ext === '.png' ? 'image/png' : 'image/x-icon';
          return `data:${mime};base64,${buffer.toString('base64')}`;
        } catch (error) {
          // Continue to next candidate
        }
      }
    }
    return '';
  });
}

async function boot() {
  if (!IS_WINDOWS) {
    dialog.showErrorBox(
      'Unsupported Platform',
      'Xedryk Data Manager is configured to run only on Windows.',
    );
    app.quit();
    return;
  }

  if (!fsSync.existsSync(MANAGER_HTML_PATH)) {
    dialog.showErrorBox(
      'Missing App Files',
      `Could not find ${MANAGER_HTML_PATH}.`,
    );
    app.quit();
    return;
  }

  createSplashWindow();
  const settings = await loadSettings();
  registerIpcHandlers();
  createManagerWindow();

  const prevAutoRun = currentSettings.autoRun;
  await applySettings(settings);
  if (settings.autoRun !== undefined && settings.autoRun !== prevAutoRun) {
    setAutoRun(!!settings.autoRun);
  }

  const startMinimizedArg = process.argv.includes('--start-minimized');
  const shouldStartMinimized = startMinimizedArg || startedMinimized;
  if (shouldStartMinimized && currentSettings.closeToTray) {
    ensureTray();
    hideMainWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createManagerWindow();
    }
  });
}

app.whenReady().then(boot);

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('window-all-closed', () => {
  if (!currentSettings.closeToTray) {
    destroyTray();
    app.quit();
    return;
  }
  if (!app.isQuitting) {
    return;
  }
  destroyTray();
  app.quit();
});
