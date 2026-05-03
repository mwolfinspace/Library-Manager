const { contextBridge, ipcRenderer } = require('electron');

const previewWindowApi = {
  showDirectoryPicker(options = {}) {
    return ipcRenderer.invoke('data-manager:show-directory-picker', options);
  },
  showOpenFilePicker(options = {}) {
    return ipcRenderer.invoke('data-manager:show-open-file-picker', options);
  },
  pathExists(targetPath) {
    return ipcRenderer.invoke('data-manager:path-exists', targetPath);
  },
  readFile(filePath) {
    return ipcRenderer.invoke('data-manager:read-file', filePath);
  },
  writeFile(filePath, data) {
    return ipcRenderer.invoke('data-manager:write-file', filePath, data);
  },
  getDirectoryHandle(parentPath, name, create = false) {
    return ipcRenderer.invoke('data-manager:get-directory-handle', parentPath, name, create);
  },
  getFileHandle(parentPath, name, create = false) {
    return ipcRenderer.invoke('data-manager:get-file-handle', parentPath, name, create);
  },
  removeEntry(parentPath, name, recursive = false) {
    return ipcRenderer.invoke('data-manager:remove-entry', parentPath, name, recursive);
  },
  listDirectory(directoryPath) {
    return ipcRenderer.invoke('data-manager:list-directory', directoryPath);
  },
  openLibraryPage(payload) {
    return ipcRenderer.invoke('data-manager:open-library-page', payload);
  },
  buildNewLibrary(payload) {
    return ipcRenderer.invoke('data-manager:build-new-library', payload);
  },
  minimizeWindow() {
    return ipcRenderer.invoke('data-manager:window-action', 'minimize');
  },
  toggleMaximizeWindow() {
    return ipcRenderer.invoke('data-manager:window-action', 'toggle-maximize');
  },
  closeWindow() {
    return ipcRenderer.invoke('data-manager:window-action', 'close');
  },
  getWindowState() {
    return ipcRenderer.invoke('data-manager:get-window-state');
  },
  onWindowStateChanged(callback) {
    if (typeof callback !== 'function') {
      return;
    }
    ipcRenderer.on('data-manager:window-state', (_event, state) => {
      callback(state);
    });
  },
  getAppPath() {
    return ipcRenderer.invoke('data-manager:get-app-path');
  },
  getEmojiFontUrl() {
    return ipcRenderer.invoke('data-manager:get-emoji-font-url');
  },
  revealInExplorer(folderPath) {
    return ipcRenderer.invoke('data-manager:reveal-in-explorer', folderPath);
  },
  resolveLibraryPath(libraryName) {
    return ipcRenderer.invoke('data-manager:resolve-library-path', libraryName);
  },
  saveLibraryPath(libraryPath) {
    return ipcRenderer.invoke('data-manager:save-library-path', libraryPath);
  },
  pickLibraryFolder() {
    return ipcRenderer.invoke('data-manager:pick-library-folder');
  },
  setAlwaysOnTop(value) {
    return ipcRenderer.invoke('data-manager:set-always-on-top', value);
  },
  getAlwaysOnTop() {
    return ipcRenderer.invoke('data-manager:get-always-on-top');
  },
  getPreviewWindowData() {
    return ipcRenderer.invoke('data-manager:get-preview-window-data');
  },
  reloadCurrentPage() {
    return ipcRenderer.invoke('data-manager:reload-preview-windows');
  },
  getSettings() {
    return ipcRenderer.invoke('data-manager:get-settings');
  },
  saveSettings(settings) {
    return ipcRenderer.invoke('data-manager:save-settings', settings);
  },
  getSystemFonts() {
    return ipcRenderer.invoke('data-manager:get-system-fonts');
  },
  getLogoPath() {
    return ipcRenderer.invoke('data-manager:get-logo-path');
  },
};

contextBridge.exposeInMainWorld('electronDataManager', previewWindowApi);

function getPageFileName() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const segments = String(pathname || '')
    .split('/')
    .filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1].toLowerCase() : '';
}

function sanitizeHomeEntryFileName(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) {
    return '';
  }
  const clean = value.split('?')[0].split('#')[0];
  const fileName = clean.split('/').pop();
  if (!fileName) {
    return '';
  }
  return /^[a-zA-Z0-9._-]+\.html?$/i.test(fileName) ? fileName : '';
}

function resolveViewerHomeUrl() {
  const params = new URLSearchParams(window.location.search || '');
  const homeFile = sanitizeHomeEntryFileName(params.get('home'))
    || sanitizeHomeEntryFileName(params.get('from'))
    || 'index.html';
  return new URL(`../${homeFile}`, window.location.href).href;
}

async function installPreviewWindowChrome() {
  const pageFile = getPageFileName();
  if (!['viewer.html', 'homepage.html', 'index.html'].includes(pageFile)) {
    return;
  }
  if (!document.body || document.getElementById('electron-preview-titlebar')) {
    return;
  }

  const isViewer = pageFile === 'viewer.html';

  const emojiFontUrl = await previewWindowApi.getEmojiFontUrl();

  const fontStyle = document.createElement('style');
  fontStyle.id = 'electron-preview-emoji-style';
  const fontFaceSrc = emojiFontUrl
    ? `src: url('${emojiFontUrl}') format('truetype');`
    : `src: url('../fonts/emoji/Segoe.UI.Emoji.with.Twemoji.Flags.ttf') format('truetype');`;
  fontStyle.textContent = `
    @font-face {
      font-family: 'TwemojiFlagsEmoji';
      font-style: normal;
      font-weight: 400;
      ${fontFaceSrc}
    }
    :root {
      --emoji-font-stack: 'TwemojiFlagsEmoji', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji';
    }
    .emoji, [data-emoji] {
      font-family: var(--emoji-font-stack) !important;
    }
    span:not([class]):not([id]) {
      font-family: inherit;
    }
  `;
  document.head.appendChild(fontStyle);

  const style = document.createElement('style');
  style.id = 'electron-preview-titlebar-style';
  style.textContent = `
    :root {
      --electron-preview-titlebar-height: 40px;
      --electron-preview-titlebar-ink: rgba(232, 241, 255, 0.92);
      --electron-preview-titlebar-muted: rgba(172, 204, 231, 0.7);
      --electron-preview-titlebar-border: rgba(98, 247, 255, 0.22);
      --electron-preview-titlebar-bg: linear-gradient(135deg, rgba(7, 13, 24, 0.98), rgba(10, 18, 32, 0.94));
      --electron-preview-titlebar-shadow: 0 14px 26px rgba(2, 8, 16, 0.34);
    }

    body.electron-preview-shell {
      --electron-preview-safe-top: var(--electron-preview-titlebar-height);
    }

    #electron-preview-titlebar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--electron-preview-titlebar-height);
      display: flex;
      align-items: stretch;
      justify-content: space-between;
      background: var(--electron-preview-titlebar-bg);
      border-bottom: 1px solid var(--electron-preview-titlebar-border);
      box-shadow: var(--electron-preview-titlebar-shadow);
      backdrop-filter: blur(12px);
      z-index: 2147483000;
    }

    #electron-preview-titlebar.is-unfocused {
      box-shadow: 0 10px 20px rgba(2, 8, 16, 0.18);
    }

    #electron-preview-titlebar .epw-drag {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px;
      -webkit-app-region: drag;
      user-select: none;
    }

    #electron-preview-titlebar .epw-brand {
      min-width: 0;
      display: inline-flex;
      align-items: center;
      gap: 9px;
    }

    #electron-preview-titlebar .epw-mark {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex: 0 0 auto;
      background: linear-gradient(135deg, rgba(98, 247, 255, 0.95), rgba(141, 255, 123, 0.9));
      box-shadow: 0 0 14px rgba(98, 247, 255, 0.3);
    }

    #electron-preview-titlebar .epw-copy {
      min-width: 0;
      display: grid;
      gap: 1px;
    }

    #electron-preview-titlebar .epw-kicker {
      margin: 0;
      font: 600 9px/1 "Segoe UI", sans-serif;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--electron-preview-titlebar-muted);
    }

    #electron-preview-titlebar .epw-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font: 700 12px/1.2 "Segoe UI", sans-serif;
      letter-spacing: 0.02em;
      color: var(--electron-preview-titlebar-ink);
    }

    #electron-preview-titlebar .epw-nav,
    #electron-preview-titlebar .epw-actions {
      display: inline-flex;
      align-items: stretch;
      gap: 0;
      -webkit-app-region: no-drag;
    }

    #electron-preview-titlebar .epw-nav {
      margin-left: auto;
      padding-right: 4px;
    }

    #electron-preview-titlebar .epw-btn {
      min-width: 46px;
      height: var(--electron-preview-titlebar-height);
      padding: 0 12px;
      border: none;
      border-radius: 0;
      background: transparent;
      color: var(--electron-preview-titlebar-ink);
      box-shadow: none;
      cursor: pointer;
      font: 600 12px/1 "Segoe UI", sans-serif;
      letter-spacing: 0.03em;
      transition: background-color 0.16s ease, color 0.16s ease;
    }

    #electron-preview-titlebar .epw-btn:hover {
      background: rgba(98, 247, 255, 0.12);
    }

    #electron-preview-titlebar .epw-btn:focus-visible {
      outline: none;
      background: rgba(98, 247, 255, 0.18);
    }

    #electron-preview-titlebar .epw-btn.epw-window-btn {
      padding: 0;
      width: 46px;
      min-width: 46px;
      font-size: 14px;
    }

    #electron-preview-titlebar .epw-btn.epw-window-btn.close:hover,
    #electron-preview-titlebar .epw-btn.epw-window-btn.close:focus-visible {
      background: rgba(255, 107, 107, 0.92);
      color: #ffffff;
    }

    body.electron-preview-shell[data-electron-window-maximized="true"] #electron-preview-titlebar {
      box-shadow: none;
    }

    body.electron-preview-shell[data-electron-window-maximized="true"] #electron-preview-titlebar .epw-window-btn.maximize {
      color: rgba(141, 255, 123, 0.94);
    }

    body.electron-preview-shell.electron-homepage-shell .page {
      padding-top: calc(20px + var(--electron-preview-safe-top)) !important;
    }

    body.electron-preview-shell.electron-homepage-shell .hero {
      top: calc(var(--electron-preview-safe-top) + 12px) !important;
    }

    body.electron-preview-shell.electron-viewer-shell .viewer {
      height: calc(100vh - var(--electron-preview-safe-top)) !important;
      margin-top: var(--electron-preview-safe-top) !important;
    }

    body.electron-preview-shell.electron-viewer-shell .viewer-toolbar {
      top: var(--electron-preview-safe-top) !important;
    }

    body.electron-preview-shell.electron-viewer-shell .viewer-body {
      padding-top: calc(var(--panel-gap) + var(--toolbar-height) + var(--electron-preview-safe-top)) !important;
    }

    body.electron-preview-shell.electron-viewer-shell .video-audio-btn {
      top: calc(var(--toolbar-height) + var(--electron-preview-safe-top) + 14px) !important;
    }

    body.electron-preview-shell.electron-viewer-shell .code-field {
      inset: var(--electron-preview-safe-top) 0 0 0 !important;
    }

    @media (max-width: 720px) {
      #electron-preview-titlebar .epw-kicker {
        display: none;
      }

      #electron-preview-titlebar .epw-btn,
      #electron-preview-titlebar .epw-btn.epw-window-btn {
        min-width: 42px;
        width: 42px;
      }

      #electron-preview-titlebar .epw-drag {
        padding-left: 8px;
      }
    }
  `;

  document.head.appendChild(style);

  const titlebar = document.createElement('div');
  titlebar.id = 'electron-preview-titlebar';
  titlebar.innerHTML = `
    <div class="epw-drag">
      <div class="epw-brand">
        <span class="epw-mark" aria-hidden="true"></span>
        <div class="epw-copy">
          <p class="epw-kicker">${isViewer ? 'Viewer Window' : 'Homepage Window'}</p>
          <strong class="epw-title" id="electron-preview-titlebar-text"></strong>
        </div>
      </div>
      ${isViewer ? '<div class="epw-nav"><button class="epw-btn" id="electron-preview-home-btn" type="button" title="Go to homepage" aria-label="Go to homepage">Home</button></div>' : ''}
    </div>
    <div class="epw-actions">
      <button class="epw-btn epw-window-btn reload" id="electron-preview-reload-btn" type="button" title="Reload" aria-label="Reload">&#8635;</button>
      <button class="epw-btn epw-window-btn minimize" id="electron-preview-min-btn" type="button" title="Minimize" aria-label="Minimize">&#9472;</button>
      <button class="epw-btn epw-window-btn maximize" id="electron-preview-max-btn" type="button" title="Maximize" aria-label="Maximize"><span id="electron-preview-max-glyph">&#9723;</span></button>
      <button class="epw-btn epw-window-btn close" id="electron-preview-close-btn" type="button" title="Close" aria-label="Close">&#10005;</button>
    </div>
  `;

  document.body.prepend(titlebar);
  document.body.classList.add('electron-preview-shell');
  document.body.classList.add(isViewer ? 'electron-viewer-shell' : 'electron-homepage-shell');

  const titleEl = document.getElementById('electron-preview-titlebar-text');
  const maxBtn = document.getElementById('electron-preview-max-btn');
  const maxGlyph = document.getElementById('electron-preview-max-glyph');
  const minBtn = document.getElementById('electron-preview-min-btn');
  const closeBtn = document.getElementById('electron-preview-close-btn');
  const homeBtn = document.getElementById('electron-preview-home-btn');
  const reloadBtn = document.getElementById('electron-preview-reload-btn');

  const updateTitle = () => {
    const fallback = isViewer ? 'Story Viewer' : 'Library Homepage';
    if (titleEl) {
      titleEl.textContent = document.title || fallback;
    }
  };

  const applyWindowState = (state = {}) => {
    const isMaximized = !!state.isMaximized;
    const isFocused = state.isFocused !== false;
    document.body.dataset.electronWindowMaximized = isMaximized ? 'true' : 'false';
    titlebar.classList.toggle('is-unfocused', !isFocused);
    if (maxBtn) {
      const label = isMaximized ? 'Restore Down' : 'Maximize';
      maxBtn.title = label;
      maxBtn.setAttribute('aria-label', label);
    }
    if (maxGlyph) {
      maxGlyph.innerHTML = isMaximized ? '&#10064;' : '&#9723;';
    }
  };

  updateTitle();

  const titleNode = document.querySelector('title');
  if (titleNode) {
    const titleObserver = new MutationObserver(() => {
      updateTitle();
    });
    titleObserver.observe(titleNode, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    window.addEventListener('beforeunload', () => {
      titleObserver.disconnect();
    });
  } else {
    window.addEventListener('load', updateTitle, { once: true });
  }

  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      window.location.href = resolveViewerHomeUrl();
    });
  }
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  if (minBtn) {
    minBtn.addEventListener('click', () => {
      void previewWindowApi.minimizeWindow();
    });
  }
  if (maxBtn) {
    maxBtn.addEventListener('click', async () => {
      const state = await previewWindowApi.toggleMaximizeWindow();
      applyWindowState(state);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      void previewWindowApi.closeWindow();
    });
  }

  previewWindowApi.onWindowStateChanged(state => {
    applyWindowState(state);
  });
  void previewWindowApi.getWindowState()
    .then(state => {
      applyWindowState(state);
    })
    .catch(() => {
      applyWindowState();
    });
}

window.addEventListener('DOMContentLoaded', () => {
  const pageFile = getPageFileName();
  if (pageFile === 'data_manager.html') {
    return;
  }
  void installPreviewWindowChrome();
});
