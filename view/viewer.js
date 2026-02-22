const KEY_PROFILES = {
  default: {
    prev: [],
    next: [],
    scrollUp: [],
    scrollDown: [],
    zoomIn: ["=", "e"],
    zoomOut: ["-", "q"],
    fit: ["0", "1"],
    fontUp: ["]"],
    fontDown: ["["],
    lineUp: ["}"],
    lineDown: ["{"],
    toggleTheme: ["t"],
    toggleSettings: ["?"],
    bookmark: ["b"],
    favorite: ["f"],
    blackout: ["space"],
    goToGallery: ["2", "/"],
  },
  left: {
    prev: [],
    next: [],
    scrollUp: ["w"],
    scrollDown: ["s"],
    zoomIn: ["e"],
    zoomOut: ["q"],
    fit: ["r", "1"],
    fontUp: ["x"],
    fontDown: ["z"],
    lineUp: ["c"],
    lineDown: ["v"],
    toggleTheme: ["t"],
    toggleSettings: ["?"],
    bookmark: ["b"],
    favorite: ["f"],
    blackout: ["space"],
    goToGallery: ["2", "/"],
  },
  right: {
    prev: ["j"],
    next: ["l"],
    scrollUp: ["i"],
    scrollDown: ["k"],
    zoomIn: ["o", "e"],
    zoomOut: ["u", "q"],
    fit: ["p", "1"],
    fontUp: ["."],
    fontDown: [","],
    lineUp: ["/"],
    lineDown: [";"],
    toggleTheme: ["t"],
    toggleSettings: ["?"],
    bookmark: ["b"],
    favorite: ["f"],
    blackout: ["space"],
    goToGallery: ["2", "/"],
  },
};

const DEFAULT_SETTINGS = {
  theme: "dark",
  fontSize: 16,
  lineSpacing: 1.6,
  scrollStep: 100,
  zoomStep: 0.25,
  keyboardMode: "default",
  panKeys: true,
  rememberZoom: true,
  fontFamily: "tech",
  customFont: "",
  customBindings: {},
  rememberViewAll: false,
  smoothScroll: true,
};

const DM_SETTINGS_EMBED = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("dm_settings") === "1";
  } catch (error) {
    return false;
  }
})();

function isDataManagerSettingsEmbedMode() {
  return DM_SETTINGS_EMBED;
}

document.addEventListener("DOMContentLoaded", () => {
  const els = {
    photo: document.getElementById("photo"),
    video: document.getElementById("video"),
    videoAudioBtn: document.getElementById("video-audio-btn"),
    imageFallback: document.getElementById("image-fallback"),
    prevBtn: document.getElementById("prev-btn"),
    nextBtn: document.getElementById("next-btn"),
    storyContent: document.getElementById("story-content"),
    storyTitle: document.getElementById("story-title"),
    storyMeta: document.getElementById("story-meta"),
    zoomInBtn: document.getElementById("zoom-in-btn"),
    zoomOutBtn: document.getElementById("zoom-out-btn"),
    fitViewBtn: document.getElementById("fit-view-btn"),
    imageCounter: document.getElementById("image-counter"),
    favoriteBtn: document.getElementById("favorite-btn"),
    bookmarkBtn: document.getElementById("bookmark-btn"),
    settingsBtn: document.getElementById("settings-btn"),
    themeToggleBtn: document.getElementById("theme-toggle-btn"),
    fontUpBtn: document.getElementById("font-up-btn"),
    fontDownBtn: document.getElementById("font-down-btn"),
    prevStoryBtn: document.getElementById("prev-story-btn"),
    nextStoryBtn: document.getElementById("next-story-btn"),
    settingsPanel: document.getElementById("settings-panel"),
    closeSettings: document.getElementById("settings-close"),
    tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
    themeSelect: document.getElementById("theme-select"),
    fontFamily: document.getElementById("font-family"),
    customFont: document.getElementById("custom-font"),
    fontSize: document.getElementById("font-size"),
    lineSpacing: document.getElementById("line-spacing"),
    scrollStep: document.getElementById("scroll-step"),
    zoomStep: document.getElementById("zoom-step"),
    keyboardMode: document.getElementById("keyboard-mode"),
    panKeys: document.getElementById("pan-keys"),
    rememberZoom: document.getElementById("remember-zoom"),
    rememberViewAll: document.getElementById("remember-view-all"),
    smoothScroll: document.getElementById("smooth-scroll"),
    shortcutList: document.getElementById("shortcut-list"),
    keybindList: document.getElementById("keybind-list"),
    backLink: document.getElementById("back-link"),
    homeLink: document.getElementById("home-link"),
    storyPanel: document.querySelector(".story-panel"),
    storyHeader: document.querySelector(".story-header"),
    blackout: document.getElementById("blackout"),
    codeField: document.querySelector(".code-field"),
    hudMarks: Array.from(document.querySelectorAll(".hud-mark")),
    eyebrow: document.querySelector(".eyebrow"),
  };

  if (!els.photo || !els.video || !els.storyContent) {
    return;
  }

  let storyId = null;
  let storyEntry = null;
  let currentPhotoIndex = 0;
  let photos = [];
  let failedLoads = 0;
  let zoomLevel = 1;
  let translateX = 0;
  let translateY = 0;
  let activeMediaType = "image";
  let dragMediaEl = null;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let settings = { ...DEFAULT_SETTINGS };
  let catalog = [];
  let storyIndex = -1;
  let filteredStorySequence = [];
  let filteredStoryIndex = -1;
  let bindingTarget = null;
  let codeRefreshTimer = null;
  let cursorRaf = null;
  let cursorX = 0.5;
  let cursorY = 0.45;
  const VIDEO_EXTENSIONS = new Set([
    "mp4",
    "webm",
    "ogg",
    "ogv",
    "mov",
    "m4v",
  ]);
  const ENCRYPTION_PREFIX = "XEDRYK_ENC_V1:";
  const ENCRYPTION_ITERATIONS_FALLBACK = 210000;
  const protectedMediaObjectUrls = new Set();
  const PROTECTED_LOCAL_PASSWORDS_KEY = "protectedStorySavedPasswords";
  const PROTECTED_SESSION_PASSWORDS_KEY = "protectedStorySessionPasswords";
  const PROTECTED_UNLOCK_TICKETS_KEY = "protectedStoryUnlockTickets";
  const PROTECTED_UNLOCK_TICKET_PARAM = "unlock_token";

  function sanitizeHomeEntryFileName(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) {
      return "";
    }
    const clean = value.split("?")[0].split("#")[0];
    const fileName = clean.split("/").pop();
    if (!fileName) {
      return "";
    }
    return /^[a-zA-Z0-9._-]+\.html?$/i.test(fileName) ? fileName : "";
  }

  function resolveHomeEntryFileName() {
    const params = new URLSearchParams(window.location.search);
    const queryHome = sanitizeHomeEntryFileName(params.get("home"));
    if (queryHome) {
      return queryHome;
    }
    const queryFrom = sanitizeHomeEntryFileName(params.get("from"));
    if (queryFrom) {
      return queryFrom;
    }
    try {
      const stored = sanitizeHomeEntryFileName(
        localStorage.getItem("homeEntryFile"),
      );
      if (stored) {
        return stored;
      }
    } catch (error) {
      // Ignore localStorage failures.
    }
    return "index.html";
  }

  const HOME_ENTRY_FILE = resolveHomeEntryFileName();

  try {
    localStorage.setItem("homeEntryFile", HOME_ENTRY_FILE);
  } catch (error) {
    // Ignore localStorage failures.
  }

  function getHomeBaseUrl() {
    return `../${HOME_ENTRY_FILE}`;
  }

  function buildHomeUrl(params = null) {
    const baseUrl = getHomeBaseUrl();
    if (!params || typeof params !== "object") {
      return baseUrl;
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        return;
      }
      query.set(key, String(value));
    });
    const queryText = query.toString();
    return queryText ? `${baseUrl}?${queryText}` : baseUrl;
  }

  function resolveBackBaseUrl() {
    const params = new URLSearchParams(window.location.search);
    const fromParam = sanitizeHomeEntryFileName(params.get("from"));
    if (fromParam) {
      return `../${fromParam}`;
    }
    return getHomeBaseUrl();
  }

  function appendViewerSource(url) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}from=viewer`;
  }

  els.video.loop = true;
  els.video.muted = true;
  els.video.autoplay = true;
  els.video.playsInline = true;

  function applyDataManagerEmbedLayout() {
    if (!isDataManagerSettingsEmbedMode()) {
      return;
    }
    document.body.classList.add("dm-settings-embed");
    if (!els.settingsPanel) {
      return;
    }
    els.settingsPanel.hidden = false;
    els.settingsPanel.style.left = "0px";
    els.settingsPanel.style.top = "0px";
    els.settingsPanel.style.width = "100%";
    els.settingsPanel.style.height = "100%";
    els.settingsPanel.style.maxWidth = "none";
    els.settingsPanel.style.maxHeight = "none";
    els.settingsPanel.style.minWidth = "0";
    els.settingsPanel.style.minHeight = "0";
    els.settingsPanel.style.borderRadius = "0";
    els.settingsPanel.style.resize = "none";
  }

  function getViewerSettingsSnapshotForDataManager() {
    return {
      ...settings,
      customBindings: { ...(settings.customBindings || {}) },
    };
  }

  function emitViewerSettingsSnapshot(token = null) {
    if (!isDataManagerSettingsEmbedMode() || window.parent === window) {
      return;
    }
    const payload = {
      type: "viewerSettingsSnapshot",
      settings: getViewerSettingsSnapshotForDataManager(),
    };
    if (typeof token === "string" && token) {
      payload.token = token;
    }
    window.parent.postMessage(payload, "*");
  }

  window.addEventListener("message", (event) => {
    if (!isDataManagerSettingsEmbedMode() || window.parent === window) {
      return;
    }
    const payload = event && event.data ? event.data : null;
    if (!payload || typeof payload !== "object" || !payload.type) {
      return;
    }
    if (payload.type === "requestViewerSettingsSnapshot") {
      emitViewerSettingsSnapshot(payload.token);
    }
  });

  const HUD_SYMBOLS = [
    "⟡⟢⟣⟤",
    "⌁⌁⌁",
    "∿∿∿",
    "▓▒░",
    "░▒▓",
    "▣▢⊠",
    "⧉⧈",
    "⟐⟐⟐",
    "⌘⌁⌘",
    "⟠⟡⟠",
    "⊞⊟",
    "⟁⌬⟁",
  ];

  function stripQueryAndHash(path) {
    return String(path || "").split("#")[0].split("?")[0];
  }

  function isLikelyWindowsAbsolutePath(path) {
    return /^[a-zA-Z]:\//.test(path) || /^\/[a-zA-Z]:\//.test(path);
  }

  function canonicalizeProjectRelativePath(path) {
    const relative = String(path || "").replace(/^\/+/, "").trim();
    if (!relative) {
      return "";
    }
    const separatorIndex = relative.indexOf("/");
    const head =
      separatorIndex >= 0
        ? relative.slice(0, separatorIndex).toLowerCase()
        : relative.toLowerCase();
    const tail = separatorIndex >= 0 ? relative.slice(separatorIndex + 1) : "";
    if (head === "media-scr" || head === "story" || head === "database") {
      return tail ? `${head}/${tail}` : head;
    }
    return relative;
  }

  function extractProjectRelativePath(rawPath) {
    const normalized = String(rawPath || "").replace(/\\/g, "/").trim();
    if (!normalized) {
      return "";
    }

    const cleanPath = stripQueryAndHash(normalized);
    const lowerPath = cleanPath.toLowerCase();
    const markers = [
      "/media-scr/",
      "/story/",
      "/database/",
      "media-scr/",
      "story/",
      "database/",
    ];
    for (const marker of markers) {
      const markerIndex = lowerPath.lastIndexOf(marker);
      if (markerIndex >= 0) {
        const offset = marker.startsWith("/") ? markerIndex + 1 : markerIndex;
        return canonicalizeProjectRelativePath(cleanPath.slice(offset));
      }
    }

    const relativePath = canonicalizeProjectRelativePath(
      cleanPath.replace(/^\/+/, ""),
    );
    if (
      relativePath.startsWith("media-scr/") ||
      relativePath.startsWith("story/") ||
      relativePath.startsWith("database/")
    ) {
      return relativePath;
    }

    return "";
  }

  function normalizeCatalogPath(rawPath) {
    if (typeof rawPath !== "string") {
      return "";
    }
    const trimmed = rawPath.trim();
    if (!trimmed) {
      return "";
    }
    if (/^(?:https?:|blob:|data:)/i.test(trimmed)) {
      return trimmed;
    }

    if (/^file:/i.test(trimmed)) {
      try {
        const fileUrl = new URL(trimmed);
        const fromUrl = extractProjectRelativePath(
          decodeURIComponent(fileUrl.pathname || ""),
        );
        if (fromUrl) {
          return fromUrl;
        }
      } catch (error) {
        // Ignore malformed file URLs and continue with string normalization.
      }
      return "";
    }

    const slashPath = trimmed.replace(/\\/g, "/");
    const extracted = extractProjectRelativePath(slashPath);
    if (extracted) {
      return extracted;
    }

    if (isLikelyWindowsAbsolutePath(stripQueryAndHash(slashPath))) {
      return "";
    }

    if (slashPath.startsWith("/")) {
      return stripQueryAndHash(slashPath).replace(/^\/+/, "");
    }

    return slashPath;
  }

  function resolvePath(path) {
    const normalizedPath = normalizeCatalogPath(path);
    if (!normalizedPath) {
      return "";
    }
    if (/^(?:https?:|blob:|data:)/i.test(normalizedPath)) {
      return normalizedPath;
    }
    if (normalizedPath.startsWith("./") || normalizedPath.startsWith("../")) {
      return normalizedPath;
    }
    return `../${normalizedPath}`;
  }

  function normalizePhotoIndex(value, total) {
    const numeric = Number.isFinite(value) ? value : parseInt(value, 10);
    if (!Number.isFinite(numeric) || numeric < 0 || numeric >= total) {
      return 0;
    }
    return numeric;
  }

  function sortPhotos(list) {
    return list.slice().sort((a, b) => {
      const aMatch = String(a).match(/_(\d+)\./);
      const bMatch = String(b).match(/_(\d+)\./);
      if (aMatch && bMatch) {
        const aNum = parseInt(aMatch[1], 10);
        const bNum = parseInt(bMatch[1], 10);
        if (aNum !== bNum) {
          return aNum - bNum;
        }
      }
      return String(a).localeCompare(String(b));
    });
  }

  function getFileExtension(path) {
    if (!path || typeof path !== "string") {
      return "";
    }
    const cleanPath = path.split("?")[0].split("#")[0];
    const parts = cleanPath.split(".");
    if (parts.length < 2) {
      return "";
    }
    return parts[parts.length - 1].toLowerCase();
  }

  function inferMediaType(path) {
    return VIDEO_EXTENSIONS.has(getFileExtension(path)) ? "video" : "image";
  }

  function inferMimeTypeFromPath(path, fallbackType = "image") {
    const ext = getFileExtension(path);
    const mimeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      avif: "image/avif",
      heic: "image/heic",
      heif: "image/heif",
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      ogv: "video/ogg",
      mov: "video/quicktime",
      m4v: "video/x-m4v",
      avi: "video/x-msvideo",
      mkv: "video/x-matroska",
    };
    if (mimeMap[ext]) {
      return mimeMap[ext];
    }
    return fallbackType === "video" ? "video/mp4" : "image/jpeg";
  }

  function isEntryProtected(entry) {
    return !!(entry && entry.storyProtected === true);
  }

  function parseEncryptedPayload(rawText) {
    if (typeof rawText !== "string" || !rawText.startsWith(ENCRYPTION_PREFIX)) {
      return null;
    }
    const jsonText = rawText.slice(ENCRYPTION_PREFIX.length);
    if (!jsonText.trim()) {
      return null;
    }
    try {
      const payload = JSON.parse(jsonText);
      if (
        !payload ||
        typeof payload !== "object" ||
        typeof payload.salt !== "string" ||
        typeof payload.iv !== "string" ||
        typeof payload.data !== "string"
      ) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  function fromBase64(base64Text) {
    const binary = atob(String(base64Text || ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function ensureWebCryptoReady() {
    if (!(window.crypto && window.crypto.subtle)) {
      throw new Error("Web Crypto API is unavailable in this browser.");
    }
  }

  async function deriveEncryptionKey(password, saltBytes, iterations) {
    ensureWebCryptoReady();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(String(password || "")),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"],
    );
  }

  async function decryptPayloadToBytes(rawText, password) {
    const payload = parseEncryptedPayload(rawText);
    if (!payload) {
      throw new Error("Encrypted payload format is invalid.");
    }
    const iterations = Number.isFinite(payload.iter)
      ? payload.iter
      : parseInt(payload.iter, 10) || ENCRYPTION_ITERATIONS_FALLBACK;
    const salt = fromBase64(payload.salt);
    const iv = fromBase64(payload.iv);
    const encryptedBytes = fromBase64(payload.data);
    const key = await deriveEncryptionKey(password, salt, iterations);
    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedBytes,
      );
      return {
        bytes: new Uint8Array(decrypted),
        mime: typeof payload.mime === "string" ? payload.mime : "",
      };
    } catch (error) {
      throw new Error("Incorrect story password.");
    }
  }

  async function fetchTextWithFallback(resolvedPath, missingMessage) {
    const requestPath =
      resolvePath(resolvedPath) || normalizeCatalogPath(resolvedPath);
    if (!requestPath) {
      throw new Error(missingMessage);
    }
    try {
      const response = await fetch(requestPath, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(missingMessage);
      }
      return response.text();
    } catch (error) {
      if (window.location.protocol === "file:") {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", requestPath, true);
          xhr.onload = () => {
            const ok =
              (xhr.status >= 200 && xhr.status < 300) ||
              (xhr.status === 0 && xhr.responseText);
            if (ok) {
              resolve(xhr.responseText);
            } else {
              reject(new Error(missingMessage));
            }
          };
          xhr.onerror = () => reject(new Error(missingMessage));
          xhr.send();
        });
      }
      throw error;
    }
  }

  function inferMediaTypeFromMime(fallbackType, mimeType) {
    const mime = String(mimeType || "").toLowerCase();
    if (mime.startsWith("video/")) {
      return "video";
    }
    return fallbackType === "video" ? "video" : "image";
  }

  function releaseProtectedMediaUrls() {
    protectedMediaObjectUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        // Ignore stale blob URLs.
      }
    });
    protectedMediaObjectUrls.clear();
  }

  function readInlineProtectedMediaPayload(entry, mediaPath) {
    if (!entry || typeof entry !== "object" || !mediaPath) {
      return "";
    }
    const payloadMap =
      entry.protectedMediaPayloads &&
      typeof entry.protectedMediaPayloads === "object" &&
      !Array.isArray(entry.protectedMediaPayloads)
        ? entry.protectedMediaPayloads
        : null;
    if (!payloadMap) {
      return "";
    }

    const normalizedPath = normalizeCatalogPath(mediaPath);
    const directValue =
      typeof payloadMap[mediaPath] === "string" ? payloadMap[mediaPath] : "";
    if (directValue) {
      return directValue;
    }
    if (normalizedPath && typeof payloadMap[normalizedPath] === "string") {
      return payloadMap[normalizedPath];
    }
    const normalizedLower = String(normalizedPath || mediaPath).toLowerCase();
    const matchKey = Object.keys(payloadMap).find(
      (key) => String(key || "").trim().toLowerCase() === normalizedLower,
    );
    if (!matchKey) {
      return "";
    }
    const matchedValue = payloadMap[matchKey];
    return typeof matchedValue === "string" ? matchedValue : "";
  }

  async function loadProtectedMediaItems(entry, password) {
    const mediaItems = collectMediaItems(entry);
    if (mediaItems.length === 0) {
      return [];
    }

    const resolvedItems = [];
    for (const item of mediaItems) {
      if (!item || !item.src) {
        continue;
      }
      const inlinePayload = readInlineProtectedMediaPayload(entry, item.src);
      let encryptedText = inlinePayload;
      if (!encryptedText) {
        if (window.location.protocol === "file:") {
          resolvedItems.push({
            src: item.src,
            type: item.type,
          });
          continue;
        }
        encryptedText = await fetchTextWithFallback(
          item.src,
          "Protected media is missing.",
        );
      }
      const payload = parseEncryptedPayload(encryptedText);
      if (!payload) {
        resolvedItems.push({
          src: item.src,
          type: item.type,
        });
        continue;
      }
      const decrypted = await decryptPayloadToBytes(encryptedText, password);
      const mimeType = decrypted.mime || "";
      const mediaType = inferMediaTypeFromMime(item.type, mimeType);
      const blob = new Blob([decrypted.bytes], {
        type: mimeType || inferMimeTypeFromPath(item.src, mediaType),
      });
      const objectUrl = URL.createObjectURL(blob);
      protectedMediaObjectUrls.add(objectUrl);
      resolvedItems.push({
        src: objectUrl,
        type: mediaType,
      });
    }
    return resolvedItems;
  }

  function loadPasswordStore(storage, key) {
    try {
      const raw = storage.getItem(key);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        storage.removeItem(key);
        return {};
      }
      const normalized = {};
      Object.entries(parsed).forEach(([storyKey, password]) => {
        if (typeof storyKey !== "string" || !storyKey.trim()) {
          return;
        }
        if (typeof password !== "string") {
          return;
        }
        const trimmed = password.trim();
        if (!trimmed) {
          return;
        }
        normalized[storyKey] = trimmed;
      });
      return normalized;
    } catch (error) {
      try {
        storage.removeItem(key);
      } catch (removeError) {
        // Ignore storage failures.
      }
      return {};
    }
  }

  function savePasswordStore(storage, key, store) {
    const safeStore = store && typeof store === "object" ? store : {};
    if (Object.keys(safeStore).length === 0) {
      storage.removeItem(key);
      return;
    }
    storage.setItem(key, JSON.stringify(safeStore));
  }

  function readSessionStoryPassword(storyKey) {
    if (!storyKey) {
      return "";
    }
    const store = loadPasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY);
    return typeof store[storyKey] === "string" ? store[storyKey] : "";
  }

  function readLocalStoryPassword(storyKey) {
    if (!storyKey) {
      return "";
    }
    const store = loadPasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY);
    return typeof store[storyKey] === "string" ? store[storyKey] : "";
  }

  function rememberSessionStoryPassword(storyKey, password) {
    if (!storyKey || !password) {
      return;
    }
    const store = loadPasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY);
    store[storyKey] = String(password).trim();
    savePasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY, store);
  }

  function clearStoredStoryPasswords(
    storyKey,
    { clearLocal = true, clearSession = true } = {},
  ) {
    if (!storyKey) {
      return;
    }
    if (clearLocal) {
      const localStore = loadPasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY);
      if (Object.prototype.hasOwnProperty.call(localStore, storyKey)) {
        delete localStore[storyKey];
        savePasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY, localStore);
      }
    }
    if (clearSession) {
      const sessionStore = loadPasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY);
      if (Object.prototype.hasOwnProperty.call(sessionStore, storyKey)) {
        delete sessionStore[storyKey];
        savePasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY, sessionStore);
      }
    }
  }

  function loadUnlockTicketStore() {
    try {
      const raw = sessionStorage.getItem(PROTECTED_UNLOCK_TICKETS_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        sessionStorage.removeItem(PROTECTED_UNLOCK_TICKETS_KEY);
        return {};
      }
      return parsed;
    } catch (error) {
      try {
        sessionStorage.removeItem(PROTECTED_UNLOCK_TICKETS_KEY);
      } catch (removeError) {
        // Ignore storage failures.
      }
      return {};
    }
  }

  function saveUnlockTicketStore(store) {
    const safeStore = store && typeof store === "object" ? store : {};
    if (Object.keys(safeStore).length === 0) {
      sessionStorage.removeItem(PROTECTED_UNLOCK_TICKETS_KEY);
      return;
    }
    sessionStorage.setItem(PROTECTED_UNLOCK_TICKETS_KEY, JSON.stringify(safeStore));
  }

  function consumeUnlockTicketPassword(storyKey) {
    if (!storyKey) {
      return "";
    }
    const params = new URLSearchParams(window.location.search);
    const token = String(params.get(PROTECTED_UNLOCK_TICKET_PARAM) || "").trim();
    if (!token) {
      return "";
    }
    try {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete(PROTECTED_UNLOCK_TICKET_PARAM);
      window.history.replaceState({}, "", cleanUrl.toString());
    } catch (error) {
      // Ignore URL rewrite errors.
    }

    const now = Date.now();
    const store = loadUnlockTicketStore();
    let matchedPassword = "";

    Object.entries(store).forEach(([entryToken, payload]) => {
      const expiresAt =
        payload && Number.isFinite(payload.expiresAt)
          ? payload.expiresAt
          : parseInt(payload?.expiresAt, 10) || 0;
      if (!expiresAt || expiresAt < now) {
        delete store[entryToken];
        return;
      }

      if (entryToken !== token) {
        return;
      }

      const payloadStoryId = String(payload.storyId || "").trim();
      const payloadPassword = String(payload.password || "").trim();
      delete store[entryToken];
      if (payloadStoryId === storyKey && payloadPassword) {
        matchedPassword = payloadPassword;
      }
    });

    saveUnlockTicketStore(store);
    if (matchedPassword) {
      rememberSessionStoryPassword(storyKey, matchedPassword);
    }
    return matchedPassword;
  }

  function resolveProtectedStoryPassword(storyKey) {
    const ticketPassword = consumeUnlockTicketPassword(storyKey);
    if (ticketPassword) {
      return { password: ticketPassword, source: "ticket" };
    }

    const sessionPassword = readSessionStoryPassword(storyKey);
    if (sessionPassword) {
      return { password: sessionPassword, source: "session" };
    }

    const localPassword = readLocalStoryPassword(storyKey);
    if (localPassword) {
      return { password: localPassword, source: "local" };
    }

    return { password: "", source: "none" };
  }

  function normalizeMediaItem(item) {
    if (!item) {
      return null;
    }

    if (typeof item === "string") {
      return {
        src: resolvePath(item),
        type: inferMediaType(item),
      };
    }

    if (typeof item !== "object") {
      return null;
    }

    const rawSrc = item.src || item.path || item.url || "";
    if (!rawSrc) {
      return null;
    }

    const normalizedType =
      typeof item.type === "string" ? item.type.toLowerCase() : "";

    return {
      src: resolvePath(rawSrc),
      type:
        normalizedType === "video" || normalizedType === "image"
          ? normalizedType
          : inferMediaType(rawSrc),
    };
  }

  function collectMediaItems(entry) {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    if (Array.isArray(entry.media) && entry.media.length > 0) {
      return entry.media.map(normalizeMediaItem).filter((item) => item && item.src);
    }

    const rawItems = [];

    if (Array.isArray(entry.images)) {
      rawItems.push(...sortPhotos(entry.images));
    } else if (typeof entry.images === "string") {
      rawItems.push(entry.images);
    }

    if (Array.isArray(entry.videos)) {
      rawItems.push(...sortPhotos(entry.videos));
    } else if (typeof entry.video === "string") {
      rawItems.push(entry.video);
    }

    return rawItems.map(normalizeMediaItem).filter((item) => item && item.src);
  }

  function normalizeCatalogEntryPaths(entry) {
    if (!entry || typeof entry !== "object") {
      return entry;
    }

    const normalized = { ...entry };
    if (typeof normalized.story === "string") {
      normalized.story = normalizeCatalogPath(normalized.story);
    }
    if (typeof normalized.cover === "string") {
      normalized.cover = normalizeCatalogPath(normalized.cover);
    }
    if (typeof normalized.video === "string") {
      normalized.video = normalizeCatalogPath(normalized.video);
    }
    if (Array.isArray(normalized.images)) {
      normalized.images = normalized.images
        .map((path) =>
          typeof path === "string" ? normalizeCatalogPath(path) : path,
        )
        .filter(Boolean);
    }
    if (Array.isArray(normalized.videos)) {
      normalized.videos = normalized.videos
        .map((path) =>
          typeof path === "string" ? normalizeCatalogPath(path) : path,
        )
        .filter(Boolean);
    }
    if (
      normalized.coverMedia &&
      typeof normalized.coverMedia === "object" &&
      typeof normalized.coverMedia.path === "string"
    ) {
      normalized.coverMedia = {
        ...normalized.coverMedia,
        path: normalizeCatalogPath(normalized.coverMedia.path),
      };
    }
    if (Array.isArray(normalized.media)) {
      normalized.media = normalized.media
        .map((item) => {
          if (typeof item === "string") {
            const nextPath = normalizeCatalogPath(item);
            return nextPath || null;
          }
          if (!item || typeof item !== "object") {
            return null;
          }
          const rawSrc = item.src || item.path || item.url || "";
          const nextPath = normalizeCatalogPath(rawSrc);
          if (!nextPath) {
            return null;
          }
          return {
            ...item,
            src: nextPath,
          };
        })
        .filter(Boolean);
    }
    return normalized;
  }

  function normalizeCatalogEntries(entries) {
    if (!Array.isArray(entries)) {
      return [];
    }
    return entries.map((entry) => normalizeCatalogEntryPaths(entry));
  }

  function getActiveMediaElement() {
    return activeMediaType === "video" ? els.video : els.photo;
  }

  function pauseAndClearVideo() {
    if (!els.video) {
      return;
    }
    els.video.pause();
    if (els.video.hasAttribute("src")) {
      els.video.removeAttribute("src");
      els.video.load();
    }
  }

  function setActiveMedia(type) {
    activeMediaType = type === "video" ? "video" : "image";

    const isVideo = activeMediaType === "video";
    els.photo.hidden = isVideo;
    els.video.hidden = !isVideo;
    els.photo.classList.remove("dragging");
    els.video.classList.remove("dragging");

    if (!isVideo) {
      pauseAndClearVideo();
    }
    updateVideoAudioButton();
  }

  function playVideoIfPossible() {
    if (activeMediaType !== "video" || !els.video) {
      return;
    }
    const playPromise = els.video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  }

  function updateVideoAudioButton() {
    if (!els.videoAudioBtn) {
      return;
    }
    const isVideo = activeMediaType === "video";
    els.videoAudioBtn.hidden = !isVideo;
    if (!isVideo) {
      return;
    }
    const isMuted = !!els.video.muted;
    els.videoAudioBtn.textContent = isMuted ? "🔇" : "🔊";
    els.videoAudioBtn.title = isMuted ? "Unmute video" : "Mute video";
    els.videoAudioBtn.setAttribute(
      "aria-label",
      isMuted ? "Unmute video" : "Mute video",
    );
  }

  function randomBinary(length) {
    let output = "";
    for (let i = 0; i < length; i += 1) {
      output += Math.random() > 0.5 ? "1" : "0";
    }
    return output;
  }

  function seedCodeLine(line) {
    const length = 48 + Math.floor(Math.random() * 36);
    line.textContent = randomBinary(length);
    line.style.left = `${Math.random() * 100}%`;
    line.style.top = `${Math.random() * 100}%`;
    line.style.fontSize = `${10 + Math.random() * 6}px`;
    line.style.animationDelay = `${-Math.random() * 10}s`;
    line.style.animationDuration = `${6 + Math.random() * 8}s`;
  }

  function updateCodeLine(line) {
    const length = 48 + Math.floor(Math.random() * 36);
    line.textContent = randomBinary(length);
  }

  function buildCodeField() {
    if (!els.codeField) {
      return;
    }
    els.codeField.innerHTML = "";
    const count = Math.min(
      36,
      Math.max(18, Math.floor(window.innerWidth / 40)),
    );
    for (let i = 0; i < count; i += 1) {
      const line = document.createElement("div");
      line.className = "code-line";
      seedCodeLine(line);
      els.codeField.appendChild(line);
    }
    if (codeRefreshTimer) {
      clearInterval(codeRefreshTimer);
    }
    codeRefreshTimer = setInterval(() => {
      els.codeField.querySelectorAll(".code-line").forEach(updateCodeLine);
    }, 4200);
    updateCursorGlow(cursorX, cursorY);
  }

  function updateCursorGlow(xRatio, yRatio) {
    if (!els.codeField) {
      return;
    }
    els.codeField.style.setProperty(
      "--cursor-x",
      `${(xRatio * 100).toFixed(2)}%`,
    );
    els.codeField.style.setProperty(
      "--cursor-y",
      `${(yRatio * 100).toFixed(2)}%`,
    );
  }

  function handleCursorMove(event) {
    if (!els.codeField) {
      return;
    }
    const x = event.clientX / Math.max(1, window.innerWidth);
    const y = event.clientY / Math.max(1, window.innerHeight);
    cursorX = Math.min(1, Math.max(0, x));
    cursorY = Math.min(1, Math.max(0, y));
    if (cursorRaf) {
      return;
    }
    cursorRaf = window.requestAnimationFrame(() => {
      cursorRaf = null;
      updateCursorGlow(cursorX, cursorY);
    });
  }

  function refreshHudMarks() {
    if (!els.hudMarks || els.hudMarks.length === 0) {
      return;
    }
    els.hudMarks.forEach((mark) => {
      const show = Math.random() > 0.2;
      mark.textContent = show
        ? HUD_SYMBOLS[Math.floor(Math.random() * HUD_SYMBOLS.length)]
        : "";
      mark.style.opacity = show
        ? (0.45 + Math.random() * 0.45).toFixed(2)
        : "0";
      const offsetX = Math.floor(Math.random() * 10) - 4;
      const offsetY = Math.floor(Math.random() * 10) - 4;
      mark.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      mark.style.letterSpacing = `${(0.25 + Math.random() * 0.35).toFixed(2)}em`;
    });
  }

  function showCorrupted(message) {
    els.storyContent.innerHTML = `<div style="padding:16px;border-radius:14px;background:rgba(255,107,107,0.15);color:#ff9d9d;">Report corrupted: ${message}</div>`;
    els.storyMeta.textContent = "Report corrupted";
    els.imageFallback.textContent = "Report corrupted";
    els.imageFallback.hidden = false;
    els.photo.removeAttribute("src");
    setActiveMedia("image");
    els.imageCounter.textContent = "0 / 0";
  }

  function showLocked(message) {
    els.storyContent.innerHTML = `<div style="padding:16px;border-radius:14px;background:rgba(255,196,107,0.15);color:#ffd59d;">Locked report: ${message}</div>`;
    els.storyMeta.textContent = "Report locked";
    els.imageFallback.textContent = "Report locked";
    els.imageFallback.hidden = false;
    els.photo.removeAttribute("src");
    setActiveMedia("image");
    els.imageCounter.textContent = "0 / 0";
  }

  // Load custom colors from homepage settings
  function loadHomepageColors() {
    try {
      const raw = localStorage.getItem("customColors");
      return raw ? JSON.parse(raw) : { dark: {}, light: {} };
    } catch (error) {
      return { dark: {}, light: {} };
    }
  }

  // Load homepage theme setting
  function loadHomepageTheme() {
    try {
      return localStorage.getItem("homepageTheme") || "dark";
    } catch (error) {
      return "dark";
    }
  }

  // Apply homepage colors to viewer
  function applyHomepageColors() {
    const customColors = loadHomepageColors();
    const currentTheme = settings.theme || "dark";
    const themeColors = customColors[currentTheme] || {};

    // Apply custom colors as CSS variables
    Object.entries(themeColors).forEach(([colorName, value]) => {
      if (value) {
        document.body.style.setProperty(`--${colorName}`, value);
      }
    });
  }

  // Sync theme with homepage
  function syncThemeWithHomepage() {
    const homepageTheme = loadHomepageTheme();
    if (settings.theme !== homepageTheme) {
      settings.theme = homepageTheme;
      return true; // Theme was changed
    }
    return false; // No change needed
  }

  // Save theme to homepage (bidirectional sync)
  function saveThemeToHomepage(theme) {
    try {
      localStorage.setItem("homepageTheme", theme);
      // Dispatch storage event to notify other tabs
      window.dispatchEvent(new StorageEvent("storage", {
        key: "homepageTheme",
        newValue: theme,
        oldValue: null,
        storageArea: localStorage
      }));
    } catch (error) {
      console.error("Failed to save theme to homepage:", error);
    }
  }

  function applySettings() {
    document.body.dataset.theme = settings.theme;
    
    // Find the font object from FONTS array by name
    const fontObj =
      window.FONTS?.find(
        (f) => f.name === settings.fontFamily || f.family === settings.fontFamily,
      ) || {};
    const fontFamily = fontObj.family || (settings.customFont ? `'${settings.customFont}'` : null);
    const fallback = fontObj.fallback || 'monospace';
    
    // If custom font is set, use it instead
    const finalFontFamily = (settings.customFont || "").trim() 
      ? `'${settings.customFont}'` 
      : (fontFamily || "monospace");
    
    const root = document.documentElement;
    if (root) {
        const fontValue = `${finalFontFamily}, ${fallback}`;
        root.style.setProperty('--font-family-main', fontValue);
    }

    els.storyContent.style.fontSize = `${settings.fontSize}px`;
    els.storyContent.style.lineHeight = settings.lineSpacing;

    if (els.themeSelect) els.themeSelect.value = settings.theme;
    if (els.fontFamily) {
      els.fontFamily.innerHTML = "";
      if (window.FONTS) {
        window.FONTS.forEach((font) => {
          const option = document.createElement("option");
          option.value = font.name;
          option.textContent = font.name;
          option.dataset.fallback = font.fallback || 'sans-serif';
          els.fontFamily.appendChild(option);
        });
      }
      // Try to match font family, or default to first available font
      const fontByName = window.FONTS?.find((f) => f.name === settings.fontFamily);
      const fontByFamily = window.FONTS?.find((f) => f.family === settings.fontFamily);
      if (fontByName) {
        els.fontFamily.value = fontByName.name;
      } else if (fontByFamily) {
        els.fontFamily.value = fontByFamily.name;
      } else if ((window.FONTS || []).length > 0) {
        els.fontFamily.value = window.FONTS[0].name;
      }
    }
    if (els.customFont) els.customFont.value = settings.customFont || "";
    if (els.fontSize) els.fontSize.value = settings.fontSize;
    if (els.lineSpacing) els.lineSpacing.value = settings.lineSpacing;
    if (els.scrollStep) els.scrollStep.value = settings.scrollStep;
    if (els.zoomStep) els.zoomStep.value = settings.zoomStep;
    
    // Update range value displays
    const scrollStepValue = document.getElementById('scroll-step-value');
    if (scrollStepValue) scrollStepValue.textContent = `${settings.scrollStep} px`;
    const zoomStepValue = document.getElementById('zoom-step-value');
    if (zoomStepValue) zoomStepValue.textContent = settings.zoomStep;
    if (els.keyboardMode) els.keyboardMode.value = settings.keyboardMode;
    if (els.panKeys) els.panKeys.checked = settings.panKeys;
    if (els.rememberZoom) els.rememberZoom.checked = settings.rememberZoom;
    if (els.rememberViewAll)
      els.rememberViewAll.checked = settings.rememberViewAll;
    if (els.smoothScroll) els.smoothScroll.checked = settings.smoothScroll;

    // Apply smooth scroll behavior
    if (els.storyContent) {
      els.storyContent.style.scrollBehavior = settings.smoothScroll ? 'smooth' : 'auto';
    }

    // Apply homepage colors after setting theme
    applyHomepageColors();

    updateThemeToggle();
    renderShortcutList();
    renderKeybindList();
  }

  function loadSettingsFromStorage() {
    try {
      const raw = localStorage.getItem("viewerSettings");
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function hydrateSettingsFromStorage() {
    const storedSettings = loadSettingsFromStorage();
    if (storedSettings) {
      settings = { ...settings, ...storedSettings };
    }

    if (!settings.fontFamily || settings.fontFamily === "tech") {
      settings.fontFamily = "Share Tech Mono";
    }

    settings.customBindings = Object.entries(settings.customBindings || {}).reduce((acc, [action, key]) => {
      const normalized = normalizeKey(key);
      if (normalized) {
        acc[action] = normalized;
      }
      return acc;
    }, {});

    if (typeof settings.panKeys !== "boolean") {
      settings.panKeys = true;
    }
    if (typeof settings.rememberZoom !== "boolean") {
      settings.rememberZoom = true;
    }
    if (typeof settings.rememberViewAll !== "boolean") {
      settings.rememberViewAll = false;
    }
    if (typeof settings.smoothScroll !== "boolean") {
      settings.smoothScroll = true;
    }

    syncThemeWithHomepage();
  }

  function saveSettings() {
    // Save to localStorage for immediate access
    localStorage.setItem("viewerSettings", JSON.stringify(settings));
  }

  async function loadDefaultSettings() {
    // First check DATABASE_SETTINGS (localStorage-based)
    if (window.DATABASE_SETTINGS && window.DATABASE_SETTINGS.db) {
      const dbSettings = window.DATABASE_SETTINGS.getViewerSettings();
      if (dbSettings) {
        settings = { ...settings, ...dbSettings };
        return;
      }
    }
    
    // Fallback to VIEWER_SETTINGS global
    if (window.VIEWER_SETTINGS) {
      settings = { ...settings, ...window.VIEWER_SETTINGS };
      return;
    }
    
    // No file fetch - all settings now use localStorage
  }

  function getStoryId() {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get("story");
    return paramId ? paramId.trim() : null;
  }

  function loadFilteredSequence() {
    try {
      const raw = localStorage.getItem("filteredStorySequence");
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function updateFilteredStoryIndex() {
    if (filteredStorySequence.length === 0 || !storyId) {
      filteredStoryIndex = -1;
      return;
    }
    filteredStoryIndex = filteredStorySequence.indexOf(storyId);
  }

  function setupBackLink() {
    const returnUrl = appendViewerSource(resolveBackBaseUrl());
    if (els.backLink) {
      els.backLink.href = returnUrl;
      els.backLink.hidden = false;
    }
    if (els.homeLink) {
      els.homeLink.href = returnUrl;
    }
  }

  function getStorageKey(key, options = {}) {
    if (options.global && settings.rememberViewAll) {
      return `${key}:global`;
    }
    return storyId ? `${key}:${storyId}` : key;
  }

  async function loadCatalog() {
    if (Array.isArray(window.REPORT_CATALOG)) {
      const normalizedCache = normalizeCatalogEntries(window.REPORT_CATALOG);
      window.REPORT_CATALOG = normalizedCache;
      return normalizedCache;
    }
    try {
      const response = await fetch("../database/catalog.json", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Catalog not found.");
      }
      const data = await response.json();
      const list = normalizeCatalogEntries(Array.isArray(data) ? data : []);
      const catalogCache = Array.isArray(window.REPORT_CATALOG)
        ? normalizeCatalogEntries(window.REPORT_CATALOG)
        : [];
      if (catalogCache.length > 0) {
        window.REPORT_CATALOG = catalogCache;
      }
      if (catalogCache.length === 0) {
        return list;
      }
      const cacheMap = new Map(
        catalogCache.map((item) => [item.id, item]),
      );
      return list.map((entry) => {
        const cachedEntry = cacheMap.get(entry.id);
        if (!cachedEntry) {
          return entry;
        }
        const merged = { ...entry };
        if (cachedEntry.storyText) {
          merged.storyText = cachedEntry.storyText;
        }
        if (cachedEntry.protectedMediaPayloads) {
          merged.protectedMediaPayloads = cachedEntry.protectedMediaPayloads;
        }
        return merged;
      });
    } catch (error) {
      throw error;
    }
  }

  async function loadStoryMarkdown(path, entry, storyPassword = "") {
    let rawStoryText = "";

    if (entry && entry.storyText) {
      rawStoryText = entry.storyText;
    } else if (entry && !entry.storyText && Array.isArray(window.REPORT_CATALOG)) {
      const cached = window.REPORT_CATALOG.find((item) => item.id === entry.id);
      if (cached && cached.storyText) {
        rawStoryText = cached.storyText;
      }
    }

    if (!rawStoryText) {
      if (!path) {
        throw new Error("Story file missing.");
      }
      const resolved = resolvePath(path);
      if (!resolved) {
        throw new Error("Story file missing.");
      }
      rawStoryText = await fetchTextWithFallback(resolved, "Story file missing.");
    }

    const encryptedPayload = parseEncryptedPayload(rawStoryText);
    if (!encryptedPayload) {
      return rawStoryText;
    }

    if (!storyPassword) {
      throw new Error("Password required.");
    }

    const decrypted = await decryptPayloadToBytes(rawStoryText, storyPassword);
    return new TextDecoder().decode(decrypted.bytes);
  }

  function applyStoryEntry(entry, mediaItemsOverride = null) {
    storyEntry = entry;
    const title =
      entry.title ||
      (entry.reportNumber ? `The Report #${entry.reportNumber}` : "Story");
    els.storyTitle.textContent = title;
    document.title = title;

    if (els.eyebrow && entry.reportNumber) {
      els.eyebrow.textContent = `Report #${entry.reportNumber}`;
    } else if (els.eyebrow) {
      els.eyebrow.textContent = "Report";
    }

    els.storyMeta.innerHTML = ""; // Clear it
    if (Array.isArray(entry.tags) && entry.tags.length > 0) {
      const tagsWrapper = document.createElement("div");
      tagsWrapper.className = "tags-list";
      entry.tags.forEach((tag) => {
        const tagLink = document.createElement("a");
        tagLink.className = "tag-link";
        tagLink.textContent = tag;
        tagLink.href = buildHomeUrl({ tag });
        tagsWrapper.appendChild(tagLink);
      });
      els.storyMeta.appendChild(tagsWrapper);
    }

    photos = Array.isArray(mediaItemsOverride)
      ? mediaItemsOverride
      : collectMediaItems(entry);
    failedLoads = 0;
    currentPhotoIndex = normalizePhotoIndex(currentPhotoIndex, photos.length);
    if (photos.length > 0) {
      updatePhoto();
    } else {
      setActiveMedia("image");
      els.photo.removeAttribute("src");
    }
  }

  function updatePhoto() {
    if (photos.length === 0) {
      setActiveMedia("image");
      els.photo.removeAttribute("src");
      els.imageCounter.textContent = "0 / 0";
      els.imageFallback.hidden = false;
      return;
    }

    if (currentPhotoIndex >= photos.length) {
      currentPhotoIndex = 0;
    }

    const mediaItem = photos[currentPhotoIndex];
    if (!mediaItem || !mediaItem.src) {
      els.imageFallback.hidden = false;
      return;
    }

    els.imageFallback.hidden = true;
    if (mediaItem.type === "video") {
      setActiveMedia("video");
      els.photo.removeAttribute("src");
      els.video.src = mediaItem.src;
      els.video.currentTime = 0;
      playVideoIfPossible();
    } else {
      setActiveMedia("image");
      els.photo.src = mediaItem.src;
    }
    els.imageCounter.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
    refreshHudMarks();

    if (settings.rememberZoom) {
      restoreZoomState();
    } else {
      resetView();
    }
  }

  function resetView() {
    zoomLevel = 1;
    translateX = 0;
    translateY = 0;
    updateTransform();
  }
  // --- Feature: Collapse Panel ---
  if (els.storyHeader) {
    els.storyHeader.addEventListener("click", (e) => {
      // Prevent collapse if user clicks tags/buttons inside header
      if (e.target.closest("button") || e.target.closest("a")) return;

      els.storyPanel.classList.toggle("collapsed");
    });
  }

  function updateTransform() {
    const transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
    els.photo.style.transform = transform;
    els.video.style.transform = transform;
  }

  function saveZoomState() {
    if (!settings.rememberZoom) {
      return;
    }
    localStorage.setItem(
      getStorageKey("zoomLevel", { global: true }),
      zoomLevel,
    );
    localStorage.setItem(
      getStorageKey("translateX", { global: true }),
      translateX,
    );
    localStorage.setItem(
      getStorageKey("translateY", { global: true }),
      translateY,
    );
  }

  function restoreZoomState() {
    zoomLevel =
      parseFloat(
        localStorage.getItem(getStorageKey("zoomLevel", { global: true })),
      ) || 1;
    translateX =
      parseFloat(
        localStorage.getItem(getStorageKey("translateX", { global: true })),
      ) || 0;
    translateY =
      parseFloat(
        localStorage.getItem(getStorageKey("translateY", { global: true })),
      ) || 0;
    updateTransform();
  }

  function saveScrollPosition() {
    localStorage.setItem(
      getStorageKey("scrollPosition"),
      els.storyContent.scrollTop,
    );
  }

  function restoreScrollPosition() {
    const scrollPosition = localStorage.getItem(
      getStorageKey("scrollPosition"),
    );
    if (scrollPosition) {
      els.storyContent.scrollTop = parseInt(scrollPosition, 10);
    }
  }

  function loadFavorites() {
    try {
      const raw = localStorage.getItem("favorites");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(Array.from(favorites)));
  }

  function loadPins() {
    try {
      const raw = localStorage.getItem("pinned");
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (error) {
      return new Set();
    }
  }

  function savePins(pins) {
    localStorage.setItem("pinned", JSON.stringify(Array.from(pins)));
  }

  function updateFavoriteButton() {
    const favorites = loadFavorites();
    if (storyId && favorites.has(storyId)) {
      els.favoriteBtn.textContent = "⭐";
      els.favoriteBtn.classList.add("active");
    } else {
      els.favoriteBtn.textContent = "⭐";
      els.favoriteBtn.classList.remove("active");
    }
  }

  function toggleFavorite() {
    if (!storyId) {
      return;
    }
    const favorites = loadFavorites();
    if (favorites.has(storyId)) {
      favorites.delete(storyId);
    } else {
      favorites.add(storyId);
    }
    saveFavorites(favorites);
    updateFavoriteButton();
  }

  function getBookmark() {
    if (!storyId) {
      return null;
    }
    try {
      const raw = localStorage.getItem(`bookmark:${storyId}`);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function updateBookmarkButton() {
    const pins = loadPins();
    if (storyId && pins.has(storyId)) {
      els.bookmarkBtn.classList.add("active");
    } else {
      els.bookmarkBtn.classList.remove("active");
    }
  }

  function setActiveTab(tabId) {
    if (!els.tabButtons || !els.tabPanels) {
      return;
    }
    els.tabButtons.forEach((button) => {
      const active = button.dataset.tab === tabId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    els.tabPanels.forEach((panel) => {
      const active = panel.dataset.tabPanel === tabId;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  function updateThemeToggle() {
    if (!els.themeToggleBtn) return;
    if (settings.theme === "dark") {
      els.themeToggleBtn.textContent = "☀️";
      els.themeToggleBtn.title = "Switch to light mode";
    } else {
      els.themeToggleBtn.textContent = "🌙";
      els.themeToggleBtn.title = "Switch to dark mode";
    }
  }

  function setStoryNavState() {
    if (!els.prevStoryBtn || !els.nextStoryBtn) return;

    // Use filtered sequence if available, otherwise use full catalog
    const hasFilteredSequence = filteredStorySequence.length > 0;

    let hasPrev, hasNext;
    if (hasFilteredSequence && filteredStoryIndex >= 0) {
      hasPrev = filteredStoryIndex > 0;
      hasNext = filteredStoryIndex < filteredStorySequence.length - 1;
    } else {
      hasPrev = storyIndex > 0;
      hasNext = storyIndex >= 0 && storyIndex < catalog.length - 1;
    }

    els.prevStoryBtn.disabled = !hasPrev;
    els.nextStoryBtn.disabled = !hasNext;
  }

  let blackoutTimeInterval = null;

  function updateBlackoutTime() {
    const timeElement = document.getElementById("blackout-time");
    if (!timeElement) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
  }

  function startBlackoutTimer() {
    updateBlackoutTime(); // Update immediately
    if (blackoutTimeInterval) {
      clearInterval(blackoutTimeInterval);
    }
    blackoutTimeInterval = setInterval(updateBlackoutTime, 100); // Update 10 times per second for smooth display
  }

  function stopBlackoutTimer() {
    if (blackoutTimeInterval) {
      clearInterval(blackoutTimeInterval);
      blackoutTimeInterval = null;
    }
  }

  // Update blackout resume text with current keybind
  function updateBlackoutResumeText() {
    const resumeKeyEl = document.getElementById('blackout-resume-key');
    if (resumeKeyEl) {
      const profile = KEY_PROFILES[settings.keyboardMode] || KEY_PROFILES.default;
      const custom = settings.customBindings && settings.customBindings.blackout;
      const blackoutKey = custom || (profile.blackout && profile.blackout[0]) || 'space';
      const keyDisplay = prettyKeyLabel(blackoutKey);
      resumeKeyEl.textContent = keyDisplay.toLowerCase() === 'spacebar' ? 'spacebar' : keyDisplay;
    }
  }

  function toggleBlackout() {
    if (!els.blackout) return;
    const willShow = els.blackout.hidden;
    els.blackout.hidden = !willShow;
    document.body.classList.toggle("blackout-active", willShow);

    if (willShow) {
      startBlackoutTimer();
    } else {
      stopBlackoutTimer();
    }
  }

  function buildStoryUrl(id) {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    const nextParams = new URLSearchParams();
    nextParams.set("story", id);
    if (from) {
      nextParams.set("from", from);
    }
    return `viewer.html?${nextParams.toString()}`;
  }

  function goToStory(index) {
    if (!catalog.length) {
      return;
    }

    // Use filtered sequence if available, otherwise use full catalog
    const hasFilteredSequence = filteredStorySequence.length > 0;
    let targetStoryId;

    if (hasFilteredSequence && filteredStoryIndex >= 0) {
      // Navigate within filtered sequence
      const newFilteredIndex = index;
      if (
        newFilteredIndex < 0 ||
        newFilteredIndex >= filteredStorySequence.length
      ) {
        return;
      }
      targetStoryId = filteredStorySequence[newFilteredIndex];
    } else {
      // Navigate within full catalog
      if (index < 0 || index >= catalog.length) {
        return;
      }
      targetStoryId = catalog[index].id;
    }

    saveScrollPosition();
    saveZoomState();
    localStorage.setItem(getStorageKey("currentPhotoIndex"), currentPhotoIndex);
    window.location.href = buildStoryUrl(targetStoryId);
  }

  function toggleBookmark() {
    if (!storyId) {
      return;
    }
    const pins = loadPins();
    if (pins.has(storyId)) {
      pins.delete(storyId);
    } else {
      pins.add(storyId);
    }
    savePins(pins);
    updateBookmarkButton();
  }

  function updateRecentViewTimestamp() {
    if (!storyId) {
      return;
    }
    // Always update the timestamp when viewing a story for "Recent" sorting
    const existingBookmark = getBookmark();
    const payload = {
      photoIndex: currentPhotoIndex,
      scrollPosition: els.storyContent.scrollTop,
      timestamp: new Date().toISOString(),
      source: "auto", // Mark as automatically created for recent tracking
    };
    localStorage.setItem(`bookmark:${storyId}`, JSON.stringify(payload));
  }

  // Panel dragging and resize state
  let isPanelDragging = false;
  let isPanelResizing = false;
  let panelStartX = 0;
  let panelStartY = 0;
  let panelStartLeft = 0;
  let panelStartTop = 0;

  function loadPanelSettings() {
    if (!els.settingsPanel) return;
    const saved = localStorage.getItem("viewerPanelSettings");
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.left) els.settingsPanel.style.left = settings.left;
        if (settings.top) els.settingsPanel.style.top = settings.top;
        if (settings.width) els.settingsPanel.style.width = settings.width;
        if (settings.height) els.settingsPanel.style.height = settings.height;
      } catch (e) {
        console.error("Failed to load panel settings", e);
      }
    }
  }

  function savePanelSettings() {
    if (!els.settingsPanel) return;
    const panelSettings = {
      left: els.settingsPanel.style.left,
      top: els.settingsPanel.style.top,
      width: els.settingsPanel.style.width,
      height: els.settingsPanel.style.height,
    };
    localStorage.setItem("viewerPanelSettings", JSON.stringify(panelSettings));
  }

  function initPanelDragging() {
    if (!els.settingsPanel) return;
    if (isDataManagerSettingsEmbedMode()) return;

    const header = els.settingsPanel.querySelector(".settings-header");
    if (!header) return;

    // Load saved panel position/size
    loadPanelSettings();

    // Mouse down on header - start dragging
    header.addEventListener("mousedown", (e) => {
      isPanelDragging = true;
      panelStartX = e.clientX;
      panelStartY = e.clientY;
      const rect = els.settingsPanel.getBoundingClientRect();
      panelStartLeft = rect.left;
      panelStartTop = rect.top;
      els.settingsPanel.classList.add("dragging");
    });

    // Track resize operations
    els.settingsPanel.addEventListener("mousedown", (e) => {
      const rect = els.settingsPanel.getBoundingClientRect();
      const isResizeHandle = 
        e.clientX > rect.right - 20 && 
        e.clientY > rect.bottom - 20;
      
      if (isResizeHandle) {
        isPanelResizing = true;
      }
    });

    // Mouse move - handle dragging
    document.addEventListener("mousemove", (e) => {
      if (!isPanelDragging) return;

      const deltaX = e.clientX - panelStartX;
      const deltaY = e.clientY - panelStartY;

      const newLeft = panelStartLeft + deltaX;
      const newTop = panelStartTop + deltaY;

      els.settingsPanel.style.left =
        Math.max(0, Math.min(newLeft, window.innerWidth - els.settingsPanel.offsetWidth)) + "px";
      els.settingsPanel.style.top =
        Math.max(0, Math.min(newTop, window.innerHeight - els.settingsPanel.offsetHeight)) + "px";
    });

    // Mouse up - stop dragging/resizing
    document.addEventListener("mouseup", () => {
      if (isPanelDragging) {
        isPanelDragging = false;
        els.settingsPanel.classList.remove("dragging");
        savePanelSettings();
      }
      if (isPanelResizing) {
        // Delay clearing the flag to prevent click event from firing
        setTimeout(() => {
          isPanelResizing = false;
        }, 100);
        savePanelSettings();
      }
    });

    // Save size when panel is resized via resize handle
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(els.settingsPanel.resizeTimeout);
      els.settingsPanel.resizeTimeout = setTimeout(() => {
        savePanelSettings();
      }, 100);
    });
    resizeObserver.observe(els.settingsPanel);

    // Also save on window resize to ensure position stays valid
    window.addEventListener("resize", () => {
      const rect = els.settingsPanel.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;

      if (rect.left > maxX) {
        els.settingsPanel.style.left = Math.max(0, maxX) + "px";
      }
      if (rect.top > maxY) {
        els.settingsPanel.style.top = Math.max(0, maxY) + "px";
      }
      savePanelSettings();
    });

    // Store the flag on the panel element so the click handler can access it
    els.settingsPanel.isResizing = () => isPanelResizing;
  }

  function showSettings() {
    if (!els.settingsPanel) return;
    hydrateSettingsFromStorage();
    applySettings();
    updateBlackoutResumeText();
    loadPanelSettings();
    els.settingsPanel.hidden = false;
    setActiveTab("appearance");
    // Initialize dragging if not already done
    if (!els.settingsPanel.dataset.draggingInitialized) {
      initPanelDragging();
      els.settingsPanel.dataset.draggingInitialized = "true";
    }
    if (isDataManagerSettingsEmbedMode()) {
      applyDataManagerEmbedLayout();
    }
  }

  function hideSettings() {
    if (!els.settingsPanel) return;
    els.settingsPanel.hidden = true;
  }

  function renderShortcutList() {
    // Shortcuts tab now focuses only on key assignment
    // Content is rendered by renderKeybindList
    els.shortcutList.innerHTML = '';
  }

  function isEditableTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function normalizeKey(key) {
    if (key === null || key === undefined) {
      return "";
    }
    if (key === " ") {
      return "space";
    }
    const normalized = String(key).trim().toLowerCase();
    const aliases = {
      spacebar: "space",
      esc: "escape",
      return: "enter",
      del: "delete",
    };
    return aliases[normalized] || normalized;
  }

  function getCustomBinding(action) {
    const value = settings.customBindings && settings.customBindings[action]
      ? settings.customBindings[action]
      : null;
    const normalized = normalizeKey(value);
    return normalized || null;
  }

  function keyMatches(list, key, action) {
    const normalized = normalizeKey(key);
    const custom = action ? getCustomBinding(action) : null;
    if (custom) {
      return custom === normalized;
    }
    return list.some(item => normalizeKey(item) === normalized);
  }

  function prettyKeyLabel(key) {
    const normalized = normalizeKey(key);
    const map = {
      arrowup: "↑",
      arrowdown: "↓",
      arrowleft: "←",
      arrowright: "→",
      space: "Spacebar",
      enter: "Enter",
      escape: "Esc",
      backspace: "Backspace",
      delete: "Delete",
    };
    return map[normalized] || normalized.toUpperCase();
  }

  function formatBinding(action, fallbackKeys) {
    const custom = getCustomBinding(action);
    if (custom) {
      return prettyKeyLabel(custom);
    }
    const fallback =
      fallbackKeys && fallbackKeys.length > 0 ? fallbackKeys[0] : "";
    return prettyKeyLabel(fallback.toString());
  }

  function renderKeybindList() {
    if (!els.keybindList) {
      return;
    }
    const profile = KEY_PROFILES[settings.keyboardMode] || KEY_PROFILES.default;
    const panKeysEnabled = settings.panKeys;

    // All bindings sorted by category but rendered as tag-like pills
    // Keys change based on panKeys setting
    const allBindings = [
      // Image Navigation - changes based on panKeys setting
      { 
        action: "prev", 
        label: "Previous image", 
        keys: panKeysEnabled 
          ? (profile.prev.length > 0 ? profile.prev : ["shift+arrowleft"])
          : ["a", "arrowleft"],
        category: "nav" 
      },
      { 
        action: "next", 
        label: "Next image", 
        keys: panKeysEnabled 
          ? (profile.next.length > 0 ? profile.next : ["shift+arrowright"])
          : ["d", "arrowright"],
        category: "nav" 
      },
      // Pan Image - only shown when panKeys is enabled
      { action: "panUp", label: "Pan image up", keys: ["w", "arrowup"], category: "pan", hide: !panKeysEnabled },
      { action: "panDown", label: "Pan image down", keys: ["s", "arrowdown"], category: "pan", hide: !panKeysEnabled },
      { action: "panLeft", label: "Pan image left", keys: ["a", "arrowleft"], category: "pan", hide: !panKeysEnabled },
      { action: "panRight", label: "Pan image right", keys: ["d", "arrowright"], category: "pan", hide: !panKeysEnabled },
      // Story Scroll - only shown when panKeys is disabled
      { action: "scrollUp", label: "Scroll story up", keys: ["w", "arrowup"], category: "scroll", hide: panKeysEnabled },
      { action: "scrollDown", label: "Scroll story down", keys: ["s", "arrowdown"], category: "scroll", hide: panKeysEnabled },
      // Story Navigation
      { action: "prevStory", label: "Previous story", keys: ["ctrl+arrowleft", "pageup"], category: "story" },
      { action: "nextStory", label: "Next story", keys: ["ctrl+arrowright", "pagedown"], category: "story" },
      // Zoom Controls
      { action: "zoomOut", label: "Zoom out", keys: profile.zoomOut, category: "zoom" },
      { action: "zoomIn", label: "Zoom in", keys: profile.zoomIn, category: "zoom" },
      { action: "fit", label: "Fit to view", keys: profile.fit, category: "zoom" },
      // Text Adjustment
      { action: "fontDown", label: "Decrease font size", keys: profile.fontDown, category: "text" },
      { action: "fontUp", label: "Increase font size", keys: profile.fontUp, category: "text" },
      { action: "lineDown", label: "Decrease line spacing", keys: profile.lineDown, category: "text" },
      { action: "lineUp", label: "Increase line spacing", keys: profile.lineUp, category: "text" },
      // Interface Actions
      { action: "favorite", label: "Toggle favorite", keys: profile.favorite, category: "ui" },
      { action: "bookmark", label: "Pin this story", keys: profile.bookmark, category: "ui" },
      { action: "toggleTheme", label: "Toggle dark/light theme", keys: profile.toggleTheme, category: "ui" },
      { action: "toggleSettings", label: "Open settings panel", keys: profile.toggleSettings, category: "ui" },
      { action: "blackout", label: "Blackout screen mode", keys: profile.blackout, category: "ui" },
      { action: "goToGallery", label: "Back to gallery", keys: profile.goToGallery, category: "ui" },
    ];

    // Filter out hidden bindings based on panKeys setting
    const visibleBindings = allBindings.filter(binding => !binding.hide);
    
    let content = '<div class="keybind-tags-container">';

    visibleBindings.forEach((binding) => {
      const currentKey = formatBinding(binding.action, binding.keys) || "—";
      const active = bindingTarget === binding.action;
      const activeClass = active ? " active" : "";
      const activeLabel = active ? " press key..." : "";

      content += `
        <div class="keybind-tag${activeClass}" data-action="${binding.action}" data-category="${binding.category}">
          <span class="keybind-tag-label">${binding.label}</span>
          <span class="keybind-tag-key">${currentKey}${activeLabel}</span>
          <button type="button" class="keybind-tag-assign" data-bind="${binding.action}" title="Click then press a key to assign">Assign</button>
        </div>
      `;
    });

    content += "</div>";

    els.keybindList.innerHTML = `<div class="keybind-instructions">Click <strong>Assign</strong> then press a key. <strong>Backspace</strong> to clear. <strong>Esc</strong> to cancel.</div>${content}<button type="button" class="reset-shortcuts-btn" id="reset-shortcuts-btn">Reset All to Default</button>`;

    els.keybindList.querySelectorAll("button[data-bind]").forEach((button) => {
      button.addEventListener("click", () => {
        bindingTarget = button.dataset.bind;
        renderKeybindList();
      });
    });

    const resetBtn = document.getElementById("reset-shortcuts-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        settings.customBindings = {};
        saveSettings();
        renderKeybindList();
        updateBlackoutResumeText();
      });
    }
  }

  // Blackout search functionality
  let isBlackoutSearchFocused = false;

  function initBlackoutSearch() {
    const searchInput = document.getElementById("blackout-search-input");
    const searchBtn = document.getElementById("blackout-search-btn");
    const blackoutDiv = document.getElementById("blackout");

    if (!searchInput || !searchBtn || !blackoutDiv) return;

    // Handle search button click
    searchBtn.addEventListener("click", () => {
      performBlackoutSearch(searchInput.value);
    });

    // Handle Enter key in search input
    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        performBlackoutSearch(searchInput.value);
      }
    });

    // Track focus state
    searchInput.addEventListener("focus", () => {
      isBlackoutSearchFocused = true;
    });

    searchInput.addEventListener("blur", () => {
      isBlackoutSearchFocused = false;
    });

    // Click outside search container to unfocus
    blackoutDiv.addEventListener("click", (event) => {
      if (!event.target.closest(".blackout-search-container")) {
        searchInput.blur();
      }
    });
  }

  function performBlackoutSearch(query) {
    if (!query || !query.trim()) return;

    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
    window.open(searchUrl, "_blank");

    // Clear the search input after opening
    const searchInput = document.getElementById("blackout-search-input");
    if (searchInput) {
      searchInput.value = "";
      searchInput.blur();
    }
  }

  function handleKeydown(event) {
    // Handle blackout search focus state first
    if (isBlackoutSearchFocused) {
      if (event.key === "Escape") {
        const searchInput = document.getElementById("blackout-search-input");
        if (searchInput) searchInput.blur();
      }
      // Allow all other keys including spacebar for typing
      return;
    }

    if (els.settingsPanel && !els.settingsPanel.hidden) {
      // Don't process keys if we're resizing
      if (els.settingsPanel.isResizing && els.settingsPanel.isResizing()) {
        return;
      }
      
      if (bindingTarget) {
        event.preventDefault();
        const pressed = normalizeKey(event.key);
        if (pressed === "escape") {
          bindingTarget = null;
          renderKeybindList();
          return;
        }
        if (pressed === "backspace" || pressed === "delete") {
          if (settings.customBindings) {
            delete settings.customBindings[bindingTarget];
            saveSettings();
          }
          bindingTarget = null;
          renderKeybindList();
          return;
        }
        if (!settings.customBindings) {
          settings.customBindings = {};
        }
        settings.customBindings[bindingTarget] = pressed;
        saveSettings();
        bindingTarget = null;
        renderKeybindList();
        updateBlackoutResumeText(); // Update blackout resume text with new keybind
        return;
      }

      if (event.key === "Escape") {
        if (isDataManagerSettingsEmbedMode() && window.parent !== window) {
          emitViewerSettingsSnapshot();
          window.parent.postMessage({ type: "closeViewerSettings" }, "*");
          return;
        }
        hideSettings();
      }
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    const profile = KEY_PROFILES[settings.keyboardMode] || KEY_PROFILES.default;
    const key = event.key.toLowerCase();

    if (keyMatches(profile.toggleSettings, key, "toggleSettings")) {
      event.preventDefault();
      showSettings();
      return;
    }

    if (keyMatches(profile.blackout, key, "blackout")) {
      event.preventDefault();
      toggleBlackout();
      return;
    }

    if (keyMatches(profile.goToGallery, key, "goToGallery")) {
      event.preventDefault();
      window.location.href = appendViewerSource(resolveBackBaseUrl());
      return;
    }

    if (keyMatches(profile.favorite, key, "favorite")) {
      event.preventDefault();
      toggleFavorite();
      return;
    }

    if (keyMatches(profile.bookmark, key, "bookmark")) {
      event.preventDefault();
      toggleBookmark();
      return;
    }

    if (keyMatches(profile.toggleTheme, key, "toggleTheme")) {
      event.preventDefault();
      settings.theme = settings.theme === "dark" ? "light" : "dark";
      saveThemeToHomepage(settings.theme); // Sync to homepage
      applySettings();
      saveSettings();
      return;
    }

    if (
      event.shiftKey &&
      (key === "w" || key === "s" || key === "arrowup" || key === "arrowdown")
    ) {
      event.preventDefault();
      const delta =
        key === "w" || key === "arrowup"
          ? -settings.scrollStep
          : settings.scrollStep;
      els.storyContent.scrollBy(0, delta);
      saveScrollPosition();
      return;
    }

    if (
      event.shiftKey &&
      (key === "a" ||
        key === "d" ||
        key === "arrowleft" ||
        key === "arrowright")
    ) {
      event.preventDefault();
      if (photos.length === 0) {
        return;
      }
      if (key === "a" || key === "arrowleft") {
        currentPhotoIndex =
          (currentPhotoIndex - 1 + photos.length) % photos.length;
      } else {
        currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
      }
      updatePhoto();
      return;
    }

    // Story navigation with Ctrl+Arrow keys (check BEFORE pan keys to avoid conflict)
    if (
      (key === "arrowleft" && event.ctrlKey) ||
      (key === "pageup" && !event.shiftKey)
    ) {
      event.preventDefault();
      const hasFilteredSequence = filteredStorySequence.length > 0;
      if (hasFilteredSequence && filteredStoryIndex > 0) {
        goToStory(filteredStoryIndex - 1);
      } else if (storyIndex > 0) {
        goToStory(storyIndex - 1);
      }
      return;
    }

    if (
      (key === "arrowright" && event.ctrlKey) ||
      (key === "pagedown" && !event.shiftKey)
    ) {
      event.preventDefault();
      const hasFilteredSequence = filteredStorySequence.length > 0;
      if (
        hasFilteredSequence &&
        filteredStoryIndex >= 0 &&
        filteredStoryIndex < filteredStorySequence.length - 1
      ) {
        goToStory(filteredStoryIndex + 1);
      } else if (storyIndex >= 0 && storyIndex < catalog.length - 1) {
        goToStory(storyIndex + 1);
      }
      return;
    }

    if (keyMatches(profile.prev, key, "prev")) {
      event.preventDefault();
      if (photos.length > 0) {
        currentPhotoIndex =
          (currentPhotoIndex - 1 + photos.length) % photos.length;
        updatePhoto();
      }
      return;
    }

    if (keyMatches(profile.next, key, "next")) {
      event.preventDefault();
      if (photos.length > 0) {
        currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
        updatePhoto();
      }
      return;
    }

    // Handle arrow/WASD keys based on panKeys setting
    if (!event.ctrlKey && !event.shiftKey) {
      if (settings.panKeys) {
        // Pan Keys ENABLED: Arrow/WASD keys pan the image
        const panStep = 24;
        let panHandled = false;
        
        if (keyMatches(["w", "arrowup"], key, "panUp")) {
          translateY -= panStep;
          panHandled = true;
        } else if (keyMatches(["s", "arrowdown"], key, "panDown")) {
          translateY += panStep;
          panHandled = true;
        } else if (keyMatches(["a", "arrowleft"], key, "panLeft")) {
          translateX -= panStep;
          panHandled = true;
        } else if (keyMatches(["d", "arrowright"], key, "panRight")) {
          translateX += panStep;
          panHandled = true;
        }
        
        if (panHandled) {
          event.preventDefault();
          updateTransform();
          saveZoomState();
          return;
        }
      } else {
        // Pan Keys DISABLED: Arrow/WASD keys for navigation and scrolling
        let navHandled = false;
        
        // W/S and Up/Down: Scroll story
        if (key === "w" || key === "arrowup") {
          els.storyContent.scrollBy(0, -settings.scrollStep);
          navHandled = true;
        } else if (key === "s" || key === "arrowdown") {
          els.storyContent.scrollBy(0, settings.scrollStep);
          navHandled = true;
        }
        // A/D and Left/Right: Previous/Next image
        else if (key === "a" || key === "arrowleft") {
          if (photos.length > 0) {
            currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
            updatePhoto();
          }
          navHandled = true;
        } else if (key === "d" || key === "arrowright") {
          if (photos.length > 0) {
            currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
            updatePhoto();
          }
          navHandled = true;
        }
        
        if (navHandled) {
          event.preventDefault();
          saveScrollPosition();
          return;
        }
      }
    }

    if (keyMatches(profile.zoomIn, key, "zoomIn")) {
      event.preventDefault();
      zoomLevel += settings.zoomStep;
      updateTransform();
      saveZoomState();
      return;
    }

    if (keyMatches(profile.zoomOut, key, "zoomOut")) {
      event.preventDefault();
      zoomLevel = Math.max(0.1, zoomLevel - settings.zoomStep);
      updateTransform();
      saveZoomState();
      return;
    }

    if (keyMatches(profile.fit, key, "fit")) {
      event.preventDefault();
      resetView();
      saveZoomState();
      return;
    }

    if (keyMatches(profile.fontUp, key, "fontUp")) {
      event.preventDefault();
      settings.fontSize = Math.min(26, settings.fontSize + 1);
      applySettings();
      saveSettings();
      return;
    }

    if (keyMatches(profile.fontDown, key, "fontDown")) {
      event.preventDefault();
      settings.fontSize = Math.max(14, settings.fontSize - 1);
      applySettings();
      saveSettings();
      return;
    }

    if (keyMatches(profile.lineUp, key, "lineUp")) {
      event.preventDefault();
      settings.lineSpacing = Math.min(
        2.2,
        +(settings.lineSpacing + 0.1).toFixed(1),
      );
      applySettings();
      saveSettings();
      return;
    }

    if (keyMatches(profile.lineDown, key, "lineDown")) {
      event.preventDefault();
      settings.lineSpacing = Math.max(
        1.2,
        +(settings.lineSpacing - 0.1).toFixed(1),
      );
      applySettings();
      saveSettings();
    }
  }

  els.prevBtn.addEventListener("click", () => {
    if (photos.length > 0) {
      currentPhotoIndex =
        (currentPhotoIndex - 1 + photos.length) % photos.length;
      updatePhoto();
    }
  });

  els.nextBtn.addEventListener("click", () => {
    if (photos.length > 0) {
      currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
      updatePhoto();
    }
  });

  els.zoomInBtn.addEventListener("click", () => {
    zoomLevel += settings.zoomStep;
    updateTransform();
    saveZoomState();
  });

  els.zoomOutBtn.addEventListener("click", () => {
    zoomLevel = Math.max(0.1, zoomLevel - settings.zoomStep);
    updateTransform();
    saveZoomState();
  });

  els.fitViewBtn.addEventListener("click", () => {
    resetView();
    saveZoomState();
  });

  function handleMediaMouseDown(event) {
    if (event.button !== 0) return;
    const activeMediaElement = getActiveMediaElement();
    if (!activeMediaElement || event.currentTarget !== activeMediaElement) {
      return;
    }
    event.preventDefault();
    isDragging = true;
    dragMediaEl = activeMediaElement;
    dragMediaEl.classList.add("dragging");
    startX = event.pageX - translateX;
    startY = event.pageY - translateY;
  }

  els.photo.addEventListener("mousedown", handleMediaMouseDown);
  els.video.addEventListener("mousedown", handleMediaMouseDown);

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      if (dragMediaEl) {
        dragMediaEl.classList.remove("dragging");
        dragMediaEl = null;
      }
      saveZoomState();
    }
  });

  window.addEventListener("mousemove", (event) => {
    if (!isDragging) return;
    event.preventDefault();
    translateX = event.pageX - startX;
    translateY = event.pageY - startY;
    updateTransform();
  });

  document.addEventListener(
    "wheel",
    (event) => {
      // Check if any overlay/modal is open - if so, don't zoom image
      const helpOverlay = document.getElementById("help-overlay");
      if (
        (els.storyPanel && els.storyPanel.contains(event.target)) ||
        (els.settingsPanel && !els.settingsPanel.hidden) ||
        (helpOverlay && !helpOverlay.hidden)
      ) {
        return;
      }

      event.preventDefault();

      const activeMediaElement = getActiveMediaElement();
      if (!activeMediaElement) {
        return;
      }

      const rect = activeMediaElement.getBoundingClientRect();
      const zoomOriginX = (event.clientX - rect.left) / zoomLevel;
      const zoomOriginY = (event.clientY - rect.top) / zoomLevel;

      const delta = event.deltaY > 0 ? -settings.zoomStep : settings.zoomStep;
      const oldZoomLevel = zoomLevel;
      zoomLevel = Math.max(0.1, zoomLevel + delta);

      translateX -= zoomOriginX * (zoomLevel - oldZoomLevel);
      translateY -= zoomOriginY * (zoomLevel - oldZoomLevel);

      updateTransform();
      saveZoomState();
    },
    { passive: false },
  );

  function preventNativeDrag(event) {
    event.preventDefault();
  }

  els.photo.addEventListener("dragstart", preventNativeDrag);
  els.video.addEventListener("dragstart", preventNativeDrag);

  if (els.videoAudioBtn) {
    els.videoAudioBtn.addEventListener("click", () => {
      if (activeMediaType !== "video") {
        return;
      }
      els.video.muted = !els.video.muted;
      if (!els.video.muted) {
        playVideoIfPossible();
      }
      updateVideoAudioButton();
    });
  }

  els.storyContent.addEventListener("scroll", saveScrollPosition);

  // Help button functionality
  const helpBtn = document.getElementById("help-btn");
  const helpOverlay = document.getElementById("help-overlay");
  const closeHelpBtn = document.getElementById("close-help");

  function showHelp() {
    if (helpOverlay) {
      helpOverlay.hidden = false;
      updateHelpShortcuts();
    }
  }

  function hideHelp() {
    if (helpOverlay) {
      helpOverlay.hidden = true;
    }
  }

  function updateHelpShortcuts() {
    if (!els.keybindList) return;

    const profile = KEY_PROFILES[settings.keyboardMode] || KEY_PROFILES.default;
    const customBindings = settings.customBindings || {};

    // Update shortcut keys in help modal
    const keyMappings = {
      "zoom-out-key": formatBinding("zoomOut", profile.zoomOut),
      "zoom-in-key": formatBinding("zoomIn", profile.zoomIn),
      "fit-key": formatBinding("fit", profile.fit),
      "font-down-key": formatBinding("fontDown", profile.fontDown),
      "font-up-key": formatBinding("fontUp", profile.fontUp),
      "line-down-key": formatBinding("lineDown", profile.lineDown),
      "line-up-key": formatBinding("lineUp", profile.lineUp),
      "favorite-key": formatBinding("favorite", profile.favorite),
      "bookmark-key": formatBinding("bookmark", profile.bookmark),
      "theme-key": formatBinding("toggleTheme", profile.toggleTheme),
      "settings-key": formatBinding("toggleSettings", profile.toggleSettings),
      "blackout-key": formatBinding("blackout", profile.blackout),
    };

    Object.entries(keyMappings).forEach(([id, key]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = key || "—";
      }
    });
  }

  if (helpBtn) {
    helpBtn.addEventListener("click", showHelp);
  }

  if (closeHelpBtn) {
    closeHelpBtn.addEventListener("click", hideHelp);
  }

  // Close help with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && helpOverlay && !helpOverlay.hidden) {
      hideHelp();
    }
  });

  // Close help when clicking outside
  if (helpOverlay) {
    helpOverlay.addEventListener("click", (event) => {
      if (event.target === helpOverlay) {
        hideHelp();
      }
    });
  }

  els.favoriteBtn.addEventListener("click", () => {
    toggleFavorite();
  });
  els.bookmarkBtn.addEventListener("click", () => {
    toggleBookmark();
  });
  els.settingsBtn.addEventListener("click", () => {
    showSettings();
  });
  els.closeSettings.addEventListener("click", () => {
    if (isDataManagerSettingsEmbedMode() && window.parent !== window) {
      emitViewerSettingsSnapshot();
      window.parent.postMessage({ type: "closeViewerSettings" }, "*");
      return;
    }
    hideSettings();
  });
  if (els.tabButtons) {
    els.tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setActiveTab(button.dataset.tab);
      });
    });
  }
  if (els.themeToggleBtn) {
    els.themeToggleBtn.addEventListener("click", () => {
      settings.theme = settings.theme === "dark" ? "light" : "dark";
      saveThemeToHomepage(settings.theme); // Sync to homepage
      applySettings();
      saveSettings();
    });
  }

  if (els.fontUpBtn) {
    els.fontUpBtn.addEventListener("click", () => {
      settings.fontSize = Math.min(26, settings.fontSize + 1);
      applySettings();
      saveSettings();
    });
  }

  if (els.fontDownBtn) {
    els.fontDownBtn.addEventListener("click", () => {
      settings.fontSize = Math.max(14, settings.fontSize - 1);
      applySettings();
      saveSettings();
    });
  }

  if (els.prevStoryBtn) {
    els.prevStoryBtn.addEventListener("click", () => {
      // Use filtered sequence if available, otherwise use full catalog
      const hasFilteredSequence = filteredStorySequence.length > 0;
      if (hasFilteredSequence && filteredStoryIndex >= 0) {
        goToStory(filteredStoryIndex - 1);
      } else {
        goToStory(storyIndex - 1);
      }
    });
  }

  if (els.nextStoryBtn) {
    els.nextStoryBtn.addEventListener("click", () => {
      // Use filtered sequence if available, otherwise use full catalog
      const hasFilteredSequence = filteredStorySequence.length > 0;
      if (hasFilteredSequence && filteredStoryIndex >= 0) {
        goToStory(filteredStoryIndex + 1);
      } else {
        goToStory(storyIndex + 1);
      }
    });
  }

  // Note: Settings panel no longer closes on background click
  // Users should use the X button or Escape key to close

  els.themeSelect.addEventListener("change", () => {
    settings.theme = els.themeSelect.value;
    applySettings();
    saveSettings();
  });

  if (els.fontFamily) {
    els.fontFamily.addEventListener("change", () => {
      settings.fontFamily = els.fontFamily.value;
      applySettings();
      saveSettings();
    });
  }

  if (els.customFont) {
    els.customFont.addEventListener("change", () => {
      settings.customFont = els.customFont.value;
      applySettings();
      saveSettings();
    });
  }

  els.fontSize.addEventListener("input", () => {
    settings.fontSize = parseInt(els.fontSize.value, 10);
    applySettings();
    saveSettings();
  });

  els.lineSpacing.addEventListener("input", () => {
    settings.lineSpacing = parseFloat(els.lineSpacing.value);
    applySettings();
    saveSettings();
  });

  els.scrollStep.addEventListener("input", () => {
    settings.scrollStep = parseInt(els.scrollStep.value, 10);
    const scrollStepValue = document.getElementById('scroll-step-value');
    if (scrollStepValue) scrollStepValue.textContent = `${settings.scrollStep} px`;
    saveSettings();
  });

  els.zoomStep.addEventListener("input", () => {
    settings.zoomStep = parseFloat(els.zoomStep.value);
    const zoomStepValue = document.getElementById('zoom-step-value');
    if (zoomStepValue) zoomStepValue.textContent = settings.zoomStep;
    saveSettings();
  });

  els.keyboardMode.addEventListener("change", () => {
    settings.keyboardMode = els.keyboardMode.value;
    applySettings();
    saveSettings();
  });

  els.panKeys.addEventListener("change", () => {
    settings.panKeys = els.panKeys.checked;
    saveSettings();
  });

  els.rememberZoom.addEventListener("change", () => {
    settings.rememberZoom = els.rememberZoom.checked;
    saveSettings();
  });

  if (els.rememberViewAll) {
    els.rememberViewAll.addEventListener("change", () => {
      settings.rememberViewAll = els.rememberViewAll.checked;
      if (settings.rememberZoom) {
        saveZoomState();
      }
      saveSettings();
    });
  }

  if (els.smoothScroll) {
    els.smoothScroll.addEventListener("change", () => {
      settings.smoothScroll = els.smoothScroll.checked;
      if (els.storyContent) {
        els.storyContent.style.scrollBehavior = settings.smoothScroll ? 'smooth' : 'auto';
      }
      saveSettings();
    });
  }

  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", buildCodeField);
  window.addEventListener("mousemove", handleCursorMove);
  window.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches && event.touches[0]) {
        handleCursorMove(event.touches[0]);
      }
    },
    { passive: true },
  );

  function handleMediaLoadSuccess() {
    failedLoads = 0;
    els.imageFallback.hidden = true;
    localStorage.setItem(getStorageKey("currentPhotoIndex"), currentPhotoIndex);
  }

  function handleMediaLoadError() {
    if (photos.length > 0) {
      failedLoads += 1;
      if (failedLoads >= photos.length) {
        showCorrupted("Media missing.");
        return;
      }
      currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
      els.imageFallback.hidden = false;
      updatePhoto();
    } else {
      els.imageFallback.hidden = false;
    }
  }

  els.photo.onload = () => {
    if (activeMediaType !== "image") {
      return;
    }
    handleMediaLoadSuccess();
  };

  els.photo.onerror = () => {
    if (activeMediaType !== "image") {
      return;
    }
    handleMediaLoadError();
  };

  els.video.addEventListener("loadeddata", () => {
    if (activeMediaType !== "video") {
      return;
    }
    handleMediaLoadSuccess();
    playVideoIfPossible();
    updateVideoAudioButton();
  });

  els.video.addEventListener("error", () => {
    if (activeMediaType !== "video") {
      return;
    }
    handleMediaLoadError();
  });

  async function initialize() {
    if (isDataManagerSettingsEmbedMode()) {
      await loadDefaultSettings();
      hydrateSettingsFromStorage();
      applySettings();
      showSettings();
      applyDataManagerEmbedLayout();
      emitViewerSettingsSnapshot();
      return;
    }

    storyId = getStoryId();
    setupBackLink();
    currentPhotoIndex = normalizePhotoIndex(
      parseInt(localStorage.getItem(getStorageKey("currentPhotoIndex")), 10),
      9999,
    );

    await loadDefaultSettings();
    hydrateSettingsFromStorage();
    
    applySettings();
    updateBlackoutResumeText(); // Update blackout key text with current keybind
    buildCodeField();
    refreshHudMarks();
    initBlackoutSearch(); // Initialize blackout search functionality

    if (!storyId) {
      showCorrupted("Missing story id.");
      return;
    }

    try {
      catalog = await loadCatalog();
      storyIndex = catalog.findIndex((entry) => entry.id === storyId);
      storyEntry = catalog.find((entry) => entry.id === storyId);
      if (!storyEntry) {
        showCorrupted("Story not found in catalog.");
        return;
      }

      // Load filtered sequence from localStorage
      filteredStorySequence = loadFilteredSequence();
      updateFilteredStoryIndex();
      releaseProtectedMediaUrls();

      if (!storyEntry.story && !storyEntry.storyText) {
        showCorrupted("Story file missing.");
        return;
      }

      let resolvedMediaItems = null;
      let markdown = "";
      if (isEntryProtected(storyEntry)) {
        const unlock = resolveProtectedStoryPassword(storyEntry.id);
        if (!unlock.password) {
          showLocked("Unlock this report from homepage first.");
          return;
        }
        try {
          markdown = await loadStoryMarkdown(
            storyEntry.story,
            storyEntry,
            unlock.password,
          );
          resolvedMediaItems = await loadProtectedMediaItems(
            storyEntry,
            unlock.password,
          );
          rememberSessionStoryPassword(storyEntry.id, unlock.password);
        } catch (error) {
          const message =
            error && typeof error.message === "string" ? error.message : "";
          if (
            (unlock.source === "local" || unlock.source === "session") &&
            /password/i.test(message)
          ) {
            clearStoredStoryPasswords(storyEntry.id, {
              clearLocal: true,
              clearSession: true,
            });
          }
          showLocked("Unable to unlock. Return to homepage and enter password again.");
          return;
        }
      } else {
        try {
          markdown = await loadStoryMarkdown(storyEntry.story, storyEntry);
        } catch (error) {
          showCorrupted("Story file missing.");
          return;
        }
      }

      applyStoryEntry(storyEntry, resolvedMediaItems);
      els.storyContent.innerHTML = `<div class="story-inner">${marked(markdown)}</div>`;
    } catch (error) {
      showCorrupted("Catalog missing.");
      return;
    }

    restoreScrollPosition();
    updateFavoriteButton();
    updateBookmarkButton();
    setStoryNavState();
    updateRecentViewTimestamp(); // Update timestamp for recent sorting
  }

  // Reset Data Functionality
  const resetButtons = document.querySelectorAll('.reset-btn');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmCancel = document.getElementById('confirm-cancel');
  let pendingResetAction = null;

  // Reset configuration
  const resetConfig = {
    'pin-favorite': {
      title: 'Reset Pin + Favorite',
      message: 'This will remove all pinned and favorited stories. Recent timestamps will remain intact. Are you sure?',
      isDanger: false
    },
    'pin': {
      title: 'Reset Pin Only',
      message: 'This will remove all pinned stories. Favorites and timestamps will be preserved. Are you sure?',
      isDanger: false
    },
    'favorite': {
      title: 'Reset Favorite Only',
      message: 'This will remove all favorited stories. Pins and timestamps will be preserved. Are you sure?',
      isDanger: false
    },
    'reading': {
      title: 'Reset Reading Status',
      message: 'This will remove ALL pins, favorites, and timestamps. All posts will become new/unread. This action cannot be undone.',
      isDanger: true
    },
    'settings': {
      title: 'Reset All Settings',
      message: 'This will reset all colors, fonts, sizes, and per-report settings to default. This action cannot be undone.',
      isDanger: true
    }
  };

  // Show custom confirmation popup
  function showConfirmPopup(action) {
    const config = resetConfig[action];
    if (!config) return;

    pendingResetAction = action;
    confirmTitle.textContent = config.title;
    confirmMessage.textContent = config.message;
    
    // Update button styling based on danger level
    if (config.isDanger) {
      confirmOk.classList.add('confirm-btn-danger');
      confirmOk.classList.remove('confirm-btn-secondary');
    } else {
      confirmOk.classList.remove('confirm-btn-danger');
      confirmOk.classList.add('confirm-btn-secondary');
    }
    
    confirmOverlay.hidden = false;
  }

  // Hide confirmation popup
  function hideConfirmPopup() {
    confirmOverlay.hidden = true;
    pendingResetAction = null;
  }

  // Execute reset action
  function executeReset(action) {
    switch (action) {
      case 'pin-favorite':
        resetPinAndFavorite();
        break;
      case 'pin':
        resetPinOnly();
        break;
      case 'favorite':
        resetFavoriteOnly();
        break;
      case 'reading':
        resetReadingStatus();
        break;
      case 'settings':
        resetAllSettings();
        break;
    }
    
    // Show success notification
    showNotification(`✅ ${resetConfig[action].title} completed successfully`);
  }

  // Reset functions
  function resetPinAndFavorite() {
    localStorage.removeItem('pinned');
    localStorage.removeItem('favorites');
    
    // Update UI
    updateBookmarkButton();
    updateFavoriteButton();
  }

  function resetPinOnly() {
    localStorage.removeItem('pinned');
    
    // Update UI
    updateBookmarkButton();
  }

  function resetFavoriteOnly() {
    // Remove all favorites only
    localStorage.removeItem('favorites');
    
    // Update UI
    updateFavoriteButton();
  }

  function resetReadingStatus() {
    // Remove all bookmarks (including timestamps)
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('bookmark:')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove all favorites
    localStorage.removeItem('favorites');
    
    // Remove all scroll positions
    keys.forEach(key => {
      if (key.includes(':scrollPosition')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove all photo indices
    keys.forEach(key => {
      if (key.includes(':currentPhotoIndex')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remove zoom states
    keys.forEach(key => {
      if (key.includes('zoomLevel') || key.includes('translateX') || key.includes('translateY')) {
        localStorage.removeItem(key);
      }
    });
    
    // Update UI
    updateBookmarkButton();
    updateFavoriteButton();
  }

  function resetAllSettings() {
    // Reset viewer settings to default
    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    applySettings();
    
    // Remove custom colors from homepage
    localStorage.removeItem('customColors');
    
    // Remove homepage theme
    localStorage.removeItem('homepageTheme');
    
    // Remove viewer panel settings
    localStorage.removeItem('viewerPanelSettings');
    
    // Remove all per-report settings
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      // Remove scroll positions
      if (key.includes(':scrollPosition')) {
        localStorage.removeItem(key);
      }
      // Remove photo indices
      if (key.includes(':currentPhotoIndex')) {
        localStorage.removeItem(key);
      }
      // Remove zoom states
      if (key.includes(':zoomLevel') || key.includes(':translateX') || key.includes(':translateY')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reset zoom view
    resetView();
    
    // Update UI
    updateBookmarkButton();
    updateFavoriteButton();
  }

  // Notification system
  function showNotification(message) {
    // Remove existing notification if any
    const existing = document.querySelector('.reset-notification');
    if (existing) {
      existing.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'reset-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--panel);
      color: var(--accent);
      padding: 12px 24px;
      border-radius: 999px;
      border: 1px solid var(--accent);
      font-size: 14px;
      font-weight: 600;
      z-index: 3000;
      box-shadow: 0 8px 24px rgba(98, 247, 255, 0.25);
      animation: slide-down 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Event listeners for reset buttons
  resetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.reset;
      showConfirmPopup(action);
    });
  });

  // Confirmation popup event listeners
  if (confirmCancel) {
    confirmCancel.addEventListener('click', hideConfirmPopup);
  }

  if (confirmOk) {
    confirmOk.addEventListener('click', () => {
      if (pendingResetAction) {
        executeReset(pendingResetAction);
        hideConfirmPopup();
      }
    });
  }

  // Close confirmation on overlay click
  if (confirmOverlay) {
    confirmOverlay.addEventListener('click', (event) => {
      if (event.target === confirmOverlay) {
        hideConfirmPopup();
      }
    });
  }

  // Close confirmation on Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && confirmOverlay && !confirmOverlay.hidden) {
      hideConfirmPopup();
    }
  });

  window.addEventListener("beforeunload", () => {
    releaseProtectedMediaUrls();
  });

  initialize();
});

let markdownRenderer = null;

function escapeHtmlForFallback(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createMarkdownRenderer() {
  if (markdownRenderer) {
    return markdownRenderer;
  }

  if (typeof window.markdownit !== "function") {
    throw new Error("markdown-it is not loaded.");
  }

  const md = window.markdownit({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
  });

  if (typeof window.markdownitFootnote === "function") {
    md.use(window.markdownitFootnote);
  }

  if (typeof window.markdownitTaskLists === "function") {
    md.use(window.markdownitTaskLists, {
      enabled: false,
      label: true,
      labelAfter: true,
    });
  }

  if (typeof window.markdownitKatex === "function") {
    md.use(window.markdownitKatex, {
      throwOnError: false,
      strict: "ignore",
      errorColor: "#ff6b6b",
      trust: false,
      output: "html",
    });
  }

  const defaultValidateLink = md.validateLink.bind(md);
  md.validateLink = function validateMarkdownLink(url) {
    const normalized = String(url || "").trim().toLowerCase();
    if (
      normalized.startsWith("javascript:") ||
      normalized.startsWith("vbscript:") ||
      normalized.startsWith("data:")
    ) {
      return false;
    }
    return defaultValidateLink(url);
  };

  const defaultLinkOpen =
    md.renderer.rules.link_open ||
    function renderLinkToken(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.link_open = function renderExternalLinks(
    tokens,
    idx,
    options,
    env,
    self,
  ) {
    const hrefIndex = tokens[idx].attrIndex("href");
    if (hrefIndex >= 0) {
      const href = String(tokens[idx].attrs[hrefIndex][1] || "");
      if (/^(https?:)?\/\//i.test(href)) {
        tokens[idx].attrSet("target", "_blank");
        tokens[idx].attrSet("rel", "noopener noreferrer");
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self);
  };

  markdownRenderer = md;
  return markdownRenderer;
}

function marked(text) {
  const source = String(text || "");
  if (!source.trim()) {
    return "";
  }
  try {
    return createMarkdownRenderer().render(source);
  } catch (error) {
    console.error("Markdown render failed:", error);
    return `<pre class="markdown-render-fallback">${escapeHtmlForFallback(source)}</pre>`;
  }
}
