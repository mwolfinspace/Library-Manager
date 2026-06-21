
// ===== DATABASE INITIALIZATION =====
let databaseInitialized = false;

async function initDatabase() {
  if (databaseInitialized && window.DATABASE_SETTINGS?.db) return;
  
  await window.DATABASE_SETTINGS.init();
  databaseInitialized = true;
  
  // Sync VIEWER_SETTINGS with database for viewer compatibility
  const vs = window.DATABASE_SETTINGS.getViewerSettings();
  window.VIEWER_SETTINGS = { ...window.VIEWER_SETTINGS, ...vs };
}

// ===== SETTINGS WRAPPER FUNCTIONS =====
// ALL settings use DATABASE_SETTINGS (file-based) - NO localStorage!
// Works across all browsers when you export/import

// Colors
function loadSettings() {
  if (window.DATABASE_SETTINGS?.db?.colors) {
    return window.DATABASE_SETTINGS.db.colors;
  }
  return { dark: {}, light: {} };
}

function saveSettings(settings) {
  if (window.DATABASE_SETTINGS?.db) {
    window.DATABASE_SETTINGS.db.colors = settings;
  }
}

// Font
function loadFont() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.fontFamily || "'Share Tech Mono', monospace";
}

function saveFont(font) {
  window.DATABASE_SETTINGS?.setSettings({ fontFamily: font });
}

// Panel settings
function loadPanelSettings() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  if (dbSettings?.panelPosition) {
    return {
      left: dbSettings.panelPosition.left,
      top: dbSettings.panelPosition.top,
      width: dbSettings.panelPosition.width,
      height: dbSettings.panelPosition.height
    };
  }
  return null;
}

function savePanelSettings(settings) {
  window.DATABASE_SETTINGS?.setSettings({ panelPosition: settings });
}

// Favorites - use DATABASE directly
function loadFavorites() {
  const favs = window.DATABASE_SETTINGS?.getFavorites() || [];
  return new Set(favs);
}

function saveFavorites(favorites) {
  const arr = Array.from(favorites);
  // Clear all and re-add
  const current = window.DATABASE_SETTINGS?.getData() || {};
  window.DATABASE_SETTINGS?.setData({ favorites: arr });
}

// Pins - use DATABASE directly
function loadPins() {
  const pins = window.DATABASE_SETTINGS?.getPins() || [];
  return new Set(pins);
}

function savePins(pins) {
  const arr = Array.from(pins);
  window.DATABASE_SETTINGS?.setData({ pinned: arr });
}

// Bookmarks - use DATABASE directly
function saveBookmark(id, payload) {
  window.DATABASE_SETTINGS?.saveBookmark(id, payload);
}

function removeBookmark(id) {
  window.DATABASE_SETTINGS?.removeBookmark(id);
}

function getBookmark(id) {
  return window.DATABASE_SETTINGS?.getBookmark(id) || null;
}

// Filter state
function loadFilterState() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.filterState || null;
}

function saveFilterState(state) {
  window.DATABASE_SETTINGS?.setSettings({ filterState: state });
}

// Font sizes
function loadFontSizes() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.fontSizes || {
    base: 14,
    header: 26,
    button: 12,
    card: 13,
  };
}

function saveFontSize(key, value) {
  const sizes = loadFontSizes();
  sizes[key] = parseInt(value, 10);
  window.DATABASE_SETTINGS?.setSettings({ fontSizes: sizes });
}

// Theme
function loadTheme() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.theme || "dark";
}

function saveTheme(theme) {
  window.DATABASE_SETTINGS?.setSettings({ theme });
}

// Skip preferences
function loadSkipPreferences() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.skipPreferences || { skipAgeVerify: false, skipWelcome: false };
}

function saveSkipPreferences(prefs) {
  window.DATABASE_SETTINGS?.setSettings({ skipPreferences: prefs });
}

// Keybinds
function loadKeybinds() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.keybinds || {};
}

function saveKeybinds(keybinds) {
  window.DATABASE_SETTINGS?.setSettings({ keybinds });
}

// Layout
function loadLayout() {
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  return dbSettings?.filterState?.layout || "grid";
}

function saveLayout(layout) {
  const fs = window.DATABASE_SETTINGS?.getSettings().filterState || {};
  window.DATABASE_SETTINGS?.setSettings({ filterState: { ...fs, layout } });
}

// ===== OLD FUNCTIONS KEPT FOR REFERENCE BUT USING DATABASE NOW =====

const grid = document.getElementById("story-grid");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-input");
const themeToggle = document.getElementById("theme-toggle");
const codeField = document.querySelector(".code-field");
const helpBtn = document.getElementById("help-btn");
const helpModal = document.getElementById("help-modal");
const helpClose = document.getElementById("help-close");
const blackout = document.getElementById("blackout");
const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));
const layoutButtons = Array.from(document.querySelectorAll(".layout-btn"));
const sortButtons = Array.from(document.querySelectorAll(".sort-btn"));
const settingsBtn = document.getElementById("settings-btn");
const settingsPanel = document.getElementById("settings-panel");
const settingsClose = document.getElementById("settings-close");
const colorGridDark = document.getElementById("color-grid-dark");
const colorGridLight = document.getElementById("color-grid-light");
const resetColorsBtn = document.getElementById("reset-colors");

let stories = [];
let activeFilter = "all";
let activeLayout = "grid";
let activeSort = "default";
let sortDirection = "asc"; // 'asc' for A-Z, 'desc' for Z-A
let titleSortDirection = "asc"; // For title sort toggle
let codeRefreshTimer = null;
let cursorRaf = null;
let cursorX = 0.5;
let cursorY = 0.45;
let settingsCurrentTheme = "dark";
let settingsTabsInitialized = false;
let fontSizeControlsInitialized = false;
let customFontInputInitialized = false;
let inputSettingsInitialized = false;
const staticCoverThumbCache = new Map();
const staticCoverThumbJobs = new Map();
const viewerMediaWarmCache = new Map();
const DM_SETTINGS_EMBED = (() => {
  try {
    if (window.__DM_SETTINGS_EMBED__ === true) {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get("dm_settings") === "1";
  } catch (error) {
    return false;
  }
})();

function isDataManagerSettingsEmbedMode() {
  return DM_SETTINGS_EMBED;
}

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
  const fromPath = sanitizeHomeEntryFileName(
    window.location.pathname.split("/").pop(),
  );
  if (fromPath) {
    return fromPath;
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
  return "homepage.html";
}

const HOME_ENTRY_FILE = resolveHomeEntryFileName();

try {
  localStorage.setItem("homeEntryFile", HOME_ENTRY_FILE);
} catch (error) {
  // Ignore localStorage failures.
}

// ENCRYPTION_PREFIX and ENCRYPTION_ITERATIONS_FALLBACK are now in shared/crypto-utils.js
const PROTECTED_POST_SETTINGS_KEY = "protectedPostSettings";
const PROTECTED_LOCAL_PASSWORDS_KEY = "protectedStorySavedPasswords";
const PROTECTED_SESSION_PASSWORDS_KEY = "protectedStorySessionPasswords";
const PROTECTED_UNLOCK_TICKETS_KEY = "protectedStoryUnlockTickets";
const PROTECTED_UNLOCK_TICKET_PARAM = "unlock_token";
const PROTECTED_UNLOCK_TICKET_TTL_MS = 10 * 60 * 1000;
const PROTECTED_CARD_LOCKED_BACKGROUND =
  "radial-gradient(circle at 16% 18%, rgba(98,247,255,0.22), transparent 45%), linear-gradient(145deg, rgba(8,14,24,0.96), rgba(4,8,14,0.98))";
const PROTECTED_CARD_UNLOCKED_BACKGROUND =
  "radial-gradient(circle at 14% 16%, rgba(141,255,123,0.18), transparent 42%), linear-gradient(145deg, rgba(8,18,22,0.93), rgba(6,12,17,0.95))";
let protectedPostSettingsCache = null;
const protectedStoryRawTextCache = new Map();
const protectedStoryUnlockCache = new Map();
const protectedStoryUnlockJobs = new Map();
const protectedCoverAssetCache = new Map();
const protectedCoverAssetJobs = new Map();
const coverThumbQueue = [];
const coverThumbPending = new Set();
let coverThumbActive = 0;
const COVER_THUMB_MAX_ACTIVE = 1;
const COVER_THUMB_QUEUE_LIMIT = 40;
const HOMEPAGE_WARM_CACHE_KEY = "homepageWarmCache";
const HOMEPAGE_WARM_SCROLL_KEY = "homepageWarmScrollY";
const HOMEPAGE_WARM_FOCUS_KEY = "homepageWarmFocus";
const HOMEPAGE_WARM_FOCUS_SOURCE_KEY = "homepageWarmFocusSource";
const HOMEPAGE_WARM_THUMB_KEY = "homepageWarmThumbs";
const HOMEPAGE_WARM_THUMB_LIMIT = 80;
const HOMEPAGE_WARM_THUMB_MAX_LEN = 180000;
let lastPointerStoryId = "";
let lastFocusSource = "";

window.addEventListener(
  "wheel",
  () => {
    lastPointerStoryId = "";
    lastFocusSource = "pointer";
  },
  { passive: true },
);

window.addEventListener(
  "touchstart",
  () => {
    lastPointerStoryId = "";
    lastFocusSource = "pointer";
  },
  { passive: true },
);

function runIdleTask(task) {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => task(), { timeout: 1200 });
    return;
  }
  window.setTimeout(task, 30);
}

function applyCardBackground(card, resolvedPath, coverToken = "") {
  if (!card || !resolvedPath) {
    return;
  }
  if (!card.isConnected) {
    return;
  }
  if (coverToken && card.dataset.coverToken !== coverToken) {
    return;
  }
  card.style.backgroundImage = toCssUrl(resolvedPath);
  card.classList.remove("thumb-loading");
  card.classList.add("thumb-loaded");
}

function loadCardBackground(card, resolvedPath, coverToken = "") {
  const normalizedPath = String(resolvedPath || "").trim();
  if (!normalizedPath || !card) {
    return;
  }
  if (/^data:/i.test(normalizedPath)) {
    applyCardBackground(card, normalizedPath, coverToken);
    return;
  }
  const img = new Image();
  img.decoding = "async";
  img.onload = async () => {
    if (typeof img.decode === "function") {
      try {
        await img.decode();
      } catch (error) {
        // The image is already loaded; decode failures should not block display.
      }
    }
    applyCardBackground(card, normalizedPath, coverToken);
  };
  img.onerror = () => {
    if (card.isConnected && (!coverToken || card.dataset.coverToken === coverToken)) {
      card.classList.remove("thumb-loading");
    }
  };
  img.src = normalizedPath;
}

function warmInitialCardCovers(limit = 8) {
  const cards = Array.from(document.querySelectorAll(".story-card")).slice(0, limit);
  cards.forEach((card) => {
    const pendingBg = card.dataset.pendingBg;
    if (pendingBg) {
      loadCardBackground(card, pendingBg, card.dataset.coverToken || "");
      delete card.dataset.pendingBg;
    }

    const pendingThumb = card.dataset.pendingThumb;
    if (!pendingThumb) {
      return;
    }

    let parsedThumb = null;
    try {
      parsedThumb = JSON.parse(pendingThumb);
    } catch (error) {
      parsedThumb = null;
    }
    if (parsedThumb && parsedThumb.path) {
      enqueueCoverThumbnail(
        card,
        parsedThumb.path,
        parsedThumb.type,
        card.dataset.coverToken || "",
      );
    }
    delete card.dataset.pendingThumb;
  });
}

function resolveStoryFirstViewerMedia(story) {
  if (!story || typeof story !== "object" || story.storyProtected === true) {
    return null;
  }

  if (Array.isArray(story.media) && story.media.length > 0) {
    const item = story.media.find((entry) => entry && (entry.src || entry.path || entry.url));
    if (item) {
      const path = normalizeCatalogPath(item.src || item.path || item.url || "");
      if (path) {
        return {
          path,
          type: detectCoverAssetType(path, item.type || ""),
        };
      }
    }
  }

  if (Array.isArray(story.images) && story.images.length > 0) {
    const path = normalizeCatalogPath(story.images[0]);
    if (path) {
      return {
        path,
        type: detectCoverAssetType(path),
      };
    }
  }

  const coverAsset = resolveStoryCoverAsset(story);
  return coverAsset && coverAsset.path ? coverAsset : null;
}

function warmViewerMediaForStory(story) {
  const media = resolveStoryFirstViewerMedia(story);
  if (!media || !media.path || viewerMediaWarmCache.has(media.path)) {
    return;
  }

  viewerMediaWarmCache.set(media.path, "pending");

  if (media.type === "video") {
    const video = document.createElement("video");
    const finish = (state) => {
      viewerMediaWarmCache.set(media.path, state);
    };
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => finish("ready");
    video.onerror = () => finish("error");
    video.src = media.path;
    return;
  }

  const img = new Image();
  img.decoding = "async";
  img.onload = async () => {
    if (typeof img.decode === "function") {
      try {
        await img.decode();
      } catch (error) {
        // Loading is still useful even when decode is deferred by the browser.
      }
    }
    viewerMediaWarmCache.set(media.path, "ready");
  };
  img.onerror = () => {
    viewerMediaWarmCache.set(media.path, "error");
  };
  img.src = media.path;
}

function getNavigationType() {
  const entries =
    typeof performance !== "undefined" && performance.getEntriesByType
      ? performance.getEntriesByType("navigation")
      : [];
  if (entries && entries.length > 0) {
    return entries[0].type || "navigate";
  }
  if (performance && performance.navigation) {
    if (performance.navigation.type === 2) {
      return "back_forward";
    }
    if (performance.navigation.type === 1) {
      return "reload";
    }
  }
  return "navigate";
}

function shouldUseWarmStart() {
  try {
    const navType = getNavigationType();
    if (navType === "reload") {
      return false;
    }
    const params = new URLSearchParams(window.location.search || "");
    const fromViewer = params.get("from") === "viewer";
    return (
      (navType === "back_forward" || fromViewer) &&
      sessionStorage.getItem(HOMEPAGE_WARM_CACHE_KEY) === "1"
    );
  } catch (error) {
    return false;
  }
}

function serializeWarmThumbCache() {
  const serialized = [];
  staticCoverThumbCache.forEach((value, key) => {
    if (serialized.length >= HOMEPAGE_WARM_THUMB_LIMIT) {
      return;
    }
    if (typeof value !== "string" || !value) {
      return;
    }
    if (value.length > HOMEPAGE_WARM_THUMB_MAX_LEN) {
      return;
    }
    serialized.push([key, value]);
  });
  return serialized;
}

function restoreWarmThumbCache() {
  let raw = "";
  try {
    raw = sessionStorage.getItem(HOMEPAGE_WARM_THUMB_KEY) || "";
  } catch (error) {
    raw = "";
  }
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }
    parsed.forEach((entry) => {
      if (!Array.isArray(entry) || entry.length < 2) {
        return;
      }
      const [key, value] = entry;
      if (typeof key === "string" && typeof value === "string" && value) {
        staticCoverThumbCache.set(key, value);
      }
    });
  } catch (error) {
    // Ignore bad cache payloads.
  }
}

function storeWarmCacheState() {
  try {
    sessionStorage.setItem(HOMEPAGE_WARM_CACHE_KEY, "1");
    sessionStorage.setItem(
      HOMEPAGE_WARM_SCROLL_KEY,
      String(window.scrollY || 0),
    );
    const focusedId =
      typeof KeyboardNavigation !== "undefined" &&
      KeyboardNavigation &&
      typeof KeyboardNavigation.getFocusedStoryId === "function"
        ? KeyboardNavigation.getFocusedStoryId()
        : "";
    const preferredId = lastPointerStoryId || focusedId || "";
    if (preferredId) {
      sessionStorage.setItem(HOMEPAGE_WARM_FOCUS_KEY, preferredId);
      const source =
        lastPointerStoryId
          ? "pointer"
          : (lastFocusSource || (focusedId ? "keyboard" : ""));
      if (source) {
        sessionStorage.setItem(HOMEPAGE_WARM_FOCUS_SOURCE_KEY, source);
      } else {
        sessionStorage.removeItem(HOMEPAGE_WARM_FOCUS_SOURCE_KEY);
      }
    } else {
      sessionStorage.removeItem(HOMEPAGE_WARM_FOCUS_KEY);
      sessionStorage.removeItem(HOMEPAGE_WARM_FOCUS_SOURCE_KEY);
    }
    const serialized = serializeWarmThumbCache();
    sessionStorage.setItem(HOMEPAGE_WARM_THUMB_KEY, JSON.stringify(serialized));
  } catch (error) {
    // Ignore storage failures.
  }
}

function markWarmCacheReady() {
  try {
    sessionStorage.setItem(HOMEPAGE_WARM_CACHE_KEY, "1");
  } catch (error) {
    // Ignore storage failures.
  }
}

function enqueueCoverThumbnail(card, path, type, coverToken = "", fallbackBackground = "") {
  const normalizedPath = String(path || "").trim();
  if (!card || !normalizedPath) {
    return;
  }
  const token = coverToken || card.dataset.coverToken || "";
  const jobId = `${token}|${normalizedPath}|${type || ""}`;
  if (coverThumbPending.has(jobId)) {
    return;
  }
  if (coverThumbQueue.length >= COVER_THUMB_QUEUE_LIMIT) {
    const dropped = coverThumbQueue.shift();
    if (dropped) {
      coverThumbPending.delete(dropped.id);
    }
  }
  coverThumbPending.add(jobId);
  coverThumbQueue.push({
    id: jobId,
    card,
    path: normalizedPath,
    type: type || "",
    coverToken: token,
    fallbackBackground,
  });
  drainCoverThumbQueue();
}

function drainCoverThumbQueue() {
  if (coverThumbActive >= COVER_THUMB_MAX_ACTIVE) {
    return;
  }
  const job = coverThumbQueue.shift();
  if (!job) {
    return;
  }
  coverThumbActive += 1;

  const finish = () => {
    coverThumbActive = Math.max(0, coverThumbActive - 1);
    coverThumbPending.delete(job.id);
    drainCoverThumbQueue();
  };

  runIdleTask(() => {
    if (!job.card.isConnected) {
      finish();
      return;
    }
    if (job.coverToken && job.card.dataset.coverToken !== job.coverToken) {
      finish();
      return;
    }
    getStaticCoverThumbnail(job.path, job.type)
      .then((thumbPath) => {
        if (!job.card.isConnected) {
          finish();
          return;
        }
        if (job.coverToken && job.card.dataset.coverToken !== job.coverToken) {
          finish();
          return;
        }
        if (thumbPath) {
          applyCardBackground(job.card, thumbPath, job.coverToken);
        } else if (job.fallbackBackground) {
          job.card.style.backgroundImage = job.fallbackBackground;
          job.card.classList.remove("thumb-loading");
        }
        finish();
      })
      .catch(() => {
        if (job.card.isConnected && job.fallbackBackground) {
          job.card.style.backgroundImage = job.fallbackBackground;
        }
        if (job.card.isConnected) {
          job.card.classList.remove("thumb-loading");
        }
        finish();
      });
  });
}

const cardBackgroundObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const card = entry.target;
        const pendingBg = card.dataset.pendingBg;
        if (pendingBg) {
          loadCardBackground(card, pendingBg, card.dataset.coverToken || "");
          delete card.dataset.pendingBg;
        }
        const pendingThumb = card.dataset.pendingThumb;
        if (pendingThumb) {
          let parsedThumb = null;
          try {
            parsedThumb = JSON.parse(pendingThumb);
          } catch (error) {
            parsedThumb = null;
          }
          if (parsedThumb && parsedThumb.path) {
            enqueueCoverThumbnail(
              card,
              parsedThumb.path,
              parsedThumb.type,
              card.dataset.coverToken || "",
            );
          }
          delete card.dataset.pendingThumb;
        }
        observer.unobserve(card);
      }
    });
  },
  {
    rootMargin: "200px 0px",
    threshold: 0.01,
  },
);
const protectedCoverObjectUrls = new Set();

const unlockModalState = {
  initialized: false,
  busy: false,
  story: null,
  overlay: null,
  modal: null,
  message: null,
  password: null,
  savePassword: null,
  hint: null,
  feedback: null,
  cancelBtn: null,
  submitBtn: null,
};

// stripQueryAndHash, isLikelyWindowsAbsolutePath, canonicalizeProjectRelativePath,
// extractProjectRelativePath, normalizeCatalogPath, normalizeCatalogEntryPaths,
// normalizeCatalogEntries are now in shared/path-utils.js

function buildViewerStoryUrl(storyId, unlockToken = "") {
  const encodedStoryId = encodeURIComponent(storyId);
  const encodedHomeFile = encodeURIComponent(HOME_ENTRY_FILE);
  const unlockPart = unlockToken
    ? `&${PROTECTED_UNLOCK_TICKET_PARAM}=${encodeURIComponent(unlockToken)}`
    : "";
  return `view/viewer.html?story=${encodedStoryId}&from=${encodedHomeFile}&home=${encodedHomeFile}${unlockPart}`;
}

function normalizeProtectedPostSettings(input) {
  const base = {
    showProtectedPosts: false,
    autoSavePasswords: false,
  };
  if (!input || typeof input !== "object") {
    return base;
  }
  return {
    showProtectedPosts: input.showProtectedPosts === true,
    autoSavePasswords: input.autoSavePasswords === true,
  };
}

function loadProtectedPostSettings() {
  try {
    const raw = localStorage.getItem(PROTECTED_POST_SETTINGS_KEY);
    if (!raw) {
      return normalizeProtectedPostSettings(null);
    }
    return normalizeProtectedPostSettings(JSON.parse(raw));
  } catch (error) {
    localStorage.removeItem(PROTECTED_POST_SETTINGS_KEY);
    return normalizeProtectedPostSettings(null);
  }
}

function saveProtectedPostSettings(settings) {
  const normalized = normalizeProtectedPostSettings(settings);
  protectedPostSettingsCache = normalized;
  localStorage.setItem(PROTECTED_POST_SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

function getProtectedPostSettings() {
  if (!protectedPostSettingsCache) {
    protectedPostSettingsCache = loadProtectedPostSettings();
  }
  return { ...protectedPostSettingsCache };
}

function updateProtectedPostSettings(partial = {}) {
  const current = getProtectedPostSettings();
  const next = {
    ...current,
    ...(partial && typeof partial === "object" ? partial : {}),
  };
  return saveProtectedPostSettings(next);
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
    Object.entries(parsed).forEach(([storyId, password]) => {
      if (typeof storyId !== "string" || !storyId.trim()) {
        return;
      }
      if (typeof password !== "string") {
        return;
      }
      const trimmed = password.trim();
      if (!trimmed) {
        return;
      }
      normalized[storyId] = trimmed;
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
  const next = {};
  Object.entries(safeStore).forEach(([storyId, password]) => {
    if (typeof storyId !== "string" || !storyId.trim()) {
      return;
    }
    if (typeof password !== "string") {
      return;
    }
    const trimmed = password.trim();
    if (!trimmed) {
      return;
    }
    next[storyId] = trimmed;
  });

  if (Object.keys(next).length === 0) {
    storage.removeItem(key);
    return;
  }
  storage.setItem(key, JSON.stringify(next));
}

function getLocalSavedStoryPassword(storyId) {
  if (!storyId) {
    return "";
  }
  const store = loadPasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY);
  return typeof store[storyId] === "string" ? store[storyId] : "";
}

function getSessionSavedStoryPassword(storyId) {
  if (!storyId) {
    return "";
  }
  const store = loadPasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY);
  return typeof store[storyId] === "string" ? store[storyId] : "";
}

function getRememberedStoryPassword(storyId) {
  const fromSession = getSessionSavedStoryPassword(storyId);
  if (fromSession) {
    return fromSession;
  }
  return getLocalSavedStoryPassword(storyId);
}

function rememberStoryPasswordInSession(storyId, password) {
  if (!storyId || !password) {
    return;
  }
  const store = loadPasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY);
  store[storyId] = String(password).trim();
  savePasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY, store);
}

function rememberStoryPasswordInLocal(storyId, password) {
  if (!storyId || !password) {
    return;
  }
  const store = loadPasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY);
  store[storyId] = String(password).trim();
  savePasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY, store);
}

function forgetSavedStoryPassword(
  storyId,
  { local = true, session = true } = {},
) {
  if (!storyId) {
    return;
  }
  if (local) {
    const localStore = loadPasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY);
    if (Object.prototype.hasOwnProperty.call(localStore, storyId)) {
      delete localStore[storyId];
      savePasswordStore(localStorage, PROTECTED_LOCAL_PASSWORDS_KEY, localStore);
    }
  }
  if (session) {
    const sessionStore = loadPasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY);
    if (Object.prototype.hasOwnProperty.call(sessionStore, storyId)) {
      delete sessionStore[storyId];
      savePasswordStore(sessionStorage, PROTECTED_SESSION_PASSWORDS_KEY, sessionStore);
    }
  }
  clearProtectedStoryCaches(storyId);
}

function revokeProtectedCoverUrl(url) {
  if (!url || typeof url !== "string" || !url.startsWith("blob:")) {
    return;
  }
  try {
    URL.revokeObjectURL(url);
  } catch (error) {
    // Ignore stale object URLs.
  }
  protectedCoverObjectUrls.delete(url);
}

function clearProtectedStoryCaches(storyId = "") {
  if (!storyId) {
    protectedStoryUnlockCache.clear();
    protectedStoryUnlockJobs.clear();
    protectedCoverAssetJobs.clear();
    protectedCoverAssetCache.forEach((cachedPath) => {
      revokeProtectedCoverUrl(cachedPath);
    });
    protectedCoverAssetCache.clear();
    return;
  }

  protectedStoryUnlockCache.delete(storyId);
  protectedStoryUnlockJobs.delete(storyId);

  const prefix = `${storyId}|`;
  Array.from(protectedCoverAssetCache.entries()).forEach(([cacheKey, cachedPath]) => {
    if (!cacheKey.startsWith(prefix)) {
      return;
    }
    revokeProtectedCoverUrl(cachedPath);
    protectedCoverAssetCache.delete(cacheKey);
  });
  Array.from(protectedCoverAssetJobs.keys()).forEach((cacheKey) => {
    if (cacheKey.startsWith(prefix)) {
      protectedCoverAssetJobs.delete(cacheKey);
    }
  });
}

function releaseProtectedCoverObjectUrls() {
  protectedCoverObjectUrls.forEach((url) => {
    revokeProtectedCoverUrl(url);
  });
  protectedCoverObjectUrls.clear();
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

function randomToken(size = 16) {
  try {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  }
}

function createProtectedUnlockTicket(storyId, password) {
  const safeStoryId = String(storyId || "").trim();
  const safePassword = String(password || "").trim();
  if (!safeStoryId || !safePassword) {
    return "";
  }

  const now = Date.now();
  const store = loadUnlockTicketStore();
  Object.entries(store).forEach(([token, payload]) => {
    const expiresAt =
      payload && Number.isFinite(payload.expiresAt)
        ? payload.expiresAt
        : parseInt(payload?.expiresAt, 10) || 0;
    if (!expiresAt || expiresAt < now) {
      delete store[token];
    }
  });

  const token = randomToken(20);
  store[token] = {
    storyId: safeStoryId,
    password: safePassword,
    expiresAt: now + PROTECTED_UNLOCK_TICKET_TTL_MS,
  };
  saveUnlockTicketStore(store);
  return token;
}

// parseEncryptedPayload, fromBase64, ensureWebCryptoReady, deriveEncryptionKey,
// decryptPayloadToBytes are now in shared/crypto-utils.js

async function fetchTextWithFallback(resolvedPath, missingMessage) {
  const rawPath = String(resolvedPath || "").trim();
  const normalizedPath = normalizeCatalogPath(rawPath);
  const fallbackPath =
    /^file:/i.test(rawPath) ||
    isLikelyWindowsAbsolutePath(stripQueryAndHash(rawPath.replace(/\\/g, "/")))
      ? ""
      : rawPath;
  const requestPath = normalizedPath || fallbackPath;
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

async function getProtectedStoryRawText(story) {
  if (!story || typeof story !== "object") {
    throw new Error("Protected story is missing.");
  }
  if (story.id && protectedStoryRawTextCache.has(story.id)) {
    return protectedStoryRawTextCache.get(story.id);
  }

  let rawStoryText = "";
  if (typeof story.storyText === "string" && story.storyText.trim()) {
    rawStoryText = story.storyText;
  } else if (typeof story.story === "string" && story.story.trim()) {
    const storyPath = normalizeCatalogPath(story.story);
    if (!storyPath) {
      throw new Error("Story file missing.");
    }
    rawStoryText = await fetchTextWithFallback(storyPath, "Story file missing.");
  }

  if (!rawStoryText) {
    throw new Error("Story file missing.");
  }
  if (story.id) {
    protectedStoryRawTextCache.set(story.id, rawStoryText);
  }
  return rawStoryText;
}

async function verifyProtectedStoryPassword(story, candidatePassword) {
  const password = String(candidatePassword || "").trim();
  if (!password) {
    throw new Error("Password is required.");
  }
  const rawStoryText = await getProtectedStoryRawText(story);
  if (!parseEncryptedPayload(rawStoryText)) {
    throw new Error("Protected story data is invalid.");
  }
  await decryptPayloadToBytes(rawStoryText, password);
  return password;
}

function updateProtectedBadge(lockBadge, state = "locked") {
  if (!lockBadge) {
    return;
  }
  lockBadge.classList.remove("locked-badge", "unlocked-badge", "checking-badge");
  if (state === "unlocked") {
    lockBadge.classList.add("unlocked-badge");
    lockBadge.textContent = "Unlocked";
    return;
  }
  if (state === "checking") {
    lockBadge.classList.add("checking-badge");
    lockBadge.textContent = "Checking";
    return;
  }
  lockBadge.classList.add("locked-badge");
  lockBadge.textContent = "Locked";
}

function setProtectedCardLockedVisual(card, lockBadge) {
  if (!card) {
    return;
  }
  card.classList.add("story-protected", "story-locked");
  card.classList.remove("story-unlocked");
  card.style.backgroundImage = PROTECTED_CARD_LOCKED_BACKGROUND;
  updateProtectedBadge(lockBadge, "locked");
}

function setProtectedCardUnlockedVisual(card, lockBadge) {
  if (!card) {
    return;
  }
  card.classList.add("story-protected", "story-unlocked");
  card.classList.remove("story-locked");
  card.style.backgroundImage = PROTECTED_CARD_UNLOCKED_BACKGROUND;
  updateProtectedBadge(lockBadge, "unlocked");
}

function getCachedProtectedStoryUnlock(storyId, password) {
  if (!storyId || !password) {
    return null;
  }
  const cached = protectedStoryUnlockCache.get(storyId);
  if (!cached || cached.password !== password) {
    return null;
  }
  return cached.valid === true;
}

function setCachedProtectedStoryUnlock(storyId, password, valid) {
  if (!storyId || !password) {
    return;
  }
  protectedStoryUnlockCache.set(storyId, {
    password,
    valid: valid === true,
  });
}

function queueProtectedStoryUnlockValidation(story, password) {
  if (!story || !story.id || !password) {
    return Promise.resolve(false);
  }
  const existing = protectedStoryUnlockJobs.get(story.id);
  if (existing && existing.password === password) {
    return existing.promise;
  }

  const jobPromise = verifyProtectedStoryPassword(story, password)
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      const current = protectedStoryUnlockJobs.get(story.id);
      if (current && current.password === password) {
        protectedStoryUnlockJobs.delete(story.id);
      }
    });

  protectedStoryUnlockJobs.set(story.id, {
    password,
    promise: jobPromise,
  });

  return jobPromise;
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

async function resolveProtectedCoverAssetPath(story, coverAsset, password) {
  if (!story || !story.id || !coverAsset || !coverAsset.path || !password) {
    return "";
  }
  const cacheKey = `${story.id}|${coverAsset.path}|${password}`;
  if (protectedCoverAssetCache.has(cacheKey)) {
    return protectedCoverAssetCache.get(cacheKey);
  }
  if (protectedCoverAssetJobs.has(cacheKey)) {
    return protectedCoverAssetJobs.get(cacheKey);
  }

  const task = (async () => {
    const inlinePayload = readInlineProtectedMediaPayload(story, coverAsset.path);
    let rawCoverText = inlinePayload;
    if (!rawCoverText) {
      if (window.location.protocol === "file:") {
        protectedCoverAssetCache.set(cacheKey, coverAsset.path);
        return coverAsset.path;
      }
      rawCoverText = await fetchTextWithFallback(
        coverAsset.path,
        "Protected cover media is missing.",
      );
    }
    const payload = parseEncryptedPayload(rawCoverText);
    if (!payload) {
      protectedCoverAssetCache.set(cacheKey, coverAsset.path);
      return coverAsset.path;
    }

    const decrypted = await decryptPayloadToBytes(rawCoverText, password);
    const mediaKind = coverAsset.type === "video" ? "video" : "image";
    const mimeType =
      decrypted.mime || inferMimeTypeFromPath(coverAsset.path, mediaKind);
    const blob = new Blob([decrypted.bytes], {
      type: mimeType || inferMimeTypeFromPath(coverAsset.path, mediaKind),
    });
    const objectUrl = URL.createObjectURL(blob);
    protectedCoverObjectUrls.add(objectUrl);
    protectedCoverAssetCache.set(cacheKey, objectUrl);
    return objectUrl;
  })()
    .catch(() => "")
    .finally(() => {
      protectedCoverAssetJobs.delete(cacheKey);
    });

  protectedCoverAssetJobs.set(cacheKey, task);
  return task;
}

function applyProtectedCoverToCard(card, coverAsset, coverToken, resolvedPath) {
  if (!card || !coverAsset || !resolvedPath) {
    return;
  }
  if (!card.isConnected || card.dataset.coverToken !== coverToken) {
    return;
  }
  if (coverAsset.type === "image") {
    loadCardBackground(card, resolvedPath, coverToken);
    return;
  }
  enqueueCoverThumbnail(
    card,
    resolvedPath,
    coverAsset.type,
    coverToken,
    PROTECTED_CARD_UNLOCKED_BACKGROUND,
  );
}

function hydrateProtectedCardUnlockState(
  card,
  story,
  coverAsset,
  coverToken,
  lockBadge,
  handlers = {},
) {
  if (!card || !story || !story.id) {
    return;
  }
  const onLocked =
    handlers && typeof handlers.onLocked === "function"
      ? handlers.onLocked
      : () => {};
  const onUnlocked =
    handlers && typeof handlers.onUnlocked === "function"
      ? handlers.onUnlocked
      : () => {};
  const onChecking =
    handlers && typeof handlers.onChecking === "function"
      ? handlers.onChecking
      : onLocked;

  setProtectedCardLockedVisual(card, lockBadge);
  onLocked();

  const rememberedPassword = String(getRememberedStoryPassword(story.id) || "").trim();
  if (!rememberedPassword) {
    return;
  }

  const cachedState = getCachedProtectedStoryUnlock(story.id, rememberedPassword);
  if (cachedState === true) {
    setProtectedCardUnlockedVisual(card, lockBadge);
    onUnlocked();
    if (coverAsset) {
      void resolveProtectedCoverAssetPath(story, coverAsset, rememberedPassword).then((resolvedPath) => {
        if (!resolvedPath) {
          return;
        }
        applyProtectedCoverToCard(card, coverAsset, coverToken, resolvedPath);
      });
    } else {
      card.style.backgroundImage = PROTECTED_CARD_UNLOCKED_BACKGROUND;
    }
    return;
  }
  if (cachedState === false) {
    forgetSavedStoryPassword(story.id, { local: true, session: true });
    onLocked();
    return;
  }

  updateProtectedBadge(lockBadge, "checking");
  onChecking();
  void queueProtectedStoryUnlockValidation(story, rememberedPassword).then((valid) => {
    if (!card.isConnected || card.dataset.coverToken !== coverToken) {
      return;
    }
    setCachedProtectedStoryUnlock(story.id, rememberedPassword, valid);
    if (!valid) {
      forgetSavedStoryPassword(story.id, { local: true, session: true });
      setProtectedCardLockedVisual(card, lockBadge);
      onLocked();
      return;
    }

    rememberStoryPasswordInSession(story.id, rememberedPassword);
    setProtectedCardUnlockedVisual(card, lockBadge);
    onUnlocked();
    if (!coverAsset) {
      card.style.backgroundImage = PROTECTED_CARD_UNLOCKED_BACKGROUND;
      return;
    }
    void resolveProtectedCoverAssetPath(story, coverAsset, rememberedPassword).then((resolvedPath) => {
      if (!card.isConnected || card.dataset.coverToken !== coverToken) {
        return;
      }
      if (!resolvedPath) {
        card.style.backgroundImage = PROTECTED_CARD_UNLOCKED_BACKGROUND;
        return;
      }
      applyProtectedCoverToCard(card, coverAsset, coverToken, resolvedPath);
    });
  });
}

function resetUnlockModalVisualState() {
  if (!unlockModalState.feedback || !unlockModalState.modal || !unlockModalState.password) {
    return;
  }
  unlockModalState.feedback.textContent = "";
  unlockModalState.feedback.classList.remove("is-error");
  unlockModalState.modal.classList.remove("unlock-invalid");
  unlockModalState.password.classList.remove("unlock-invalid");
}

function showUnlockFailure(message) {
  if (!unlockModalState.feedback || !unlockModalState.modal || !unlockModalState.password) {
    return;
  }
  unlockModalState.feedback.textContent = message || "Unlock failed. Please try again.";
  unlockModalState.feedback.classList.add("is-error");
  unlockModalState.password.value = "";
  unlockModalState.password.classList.remove("unlock-invalid");
  unlockModalState.modal.classList.remove("unlock-invalid");
  void unlockModalState.modal.offsetWidth;
  unlockModalState.modal.classList.add("unlock-invalid");
  unlockModalState.password.classList.add("unlock-invalid");
  if (unlockModalState.password) {
    unlockModalState.password.focus();
  }
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate([70, 50, 70]);
  }
}

function setUnlockModalBusy(nextBusy) {
  unlockModalState.busy = nextBusy === true;
  if (unlockModalState.submitBtn) {
    unlockModalState.submitBtn.disabled = unlockModalState.busy;
    unlockModalState.submitBtn.textContent = unlockModalState.busy
      ? "Checking..."
      : "Unlock";
  }
  if (unlockModalState.cancelBtn) {
    unlockModalState.cancelBtn.disabled = unlockModalState.busy;
  }
  if (unlockModalState.password) {
    unlockModalState.password.disabled = unlockModalState.busy;
  }
  if (unlockModalState.savePassword) {
    const settings = getProtectedPostSettings();
    unlockModalState.savePassword.disabled =
      unlockModalState.busy || settings.autoSavePasswords;
  }
}

function closeProtectedUnlockModal() {
  if (!unlockModalState.overlay) {
    return;
  }
  unlockModalState.overlay.hidden = true;
  unlockModalState.story = null;
  setUnlockModalBusy(false);
  resetUnlockModalVisualState();
}

async function submitProtectedUnlockModal() {
  if (unlockModalState.busy || !unlockModalState.story || !unlockModalState.password) {
    return;
  }

  const story = unlockModalState.story;
  const enteredPassword = String(unlockModalState.password.value || "").trim();
  if (!enteredPassword) {
    showUnlockFailure("Password is required.");
    return;
  }

  const previouslyRemembered = getRememberedStoryPassword(story.id);

  setUnlockModalBusy(true);
  resetUnlockModalVisualState();

  try {
    const verifiedPassword = await verifyProtectedStoryPassword(story, enteredPassword);
    if (previouslyRemembered && previouslyRemembered !== verifiedPassword) {
      clearProtectedStoryCaches(story.id);
    }
    setCachedProtectedStoryUnlock(story.id, verifiedPassword, true);
    rememberStoryPasswordInSession(story.id, verifiedPassword);

    const protectedSettings = getProtectedPostSettings();
    const shouldPersist =
      protectedSettings.autoSavePasswords ||
      (unlockModalState.savePassword && unlockModalState.savePassword.checked);

    if (shouldPersist) {
      rememberStoryPasswordInLocal(story.id, verifiedPassword);
    } else {
      forgetSavedStoryPassword(story.id, { local: true, session: false });
    }

    const unlockToken = createProtectedUnlockTicket(story.id, verifiedPassword);
    closeProtectedUnlockModal();
    window.location.href = buildViewerStoryUrl(story.id, unlockToken);
  } catch (error) {
    if (previouslyRemembered && previouslyRemembered === enteredPassword) {
      forgetSavedStoryPassword(story.id, { local: true, session: true });
    }
    const failureMessage =
      error && typeof error.message === "string" && error.message.includes("missing")
        ? "Protected data missing."
        : "Wrong password. Try again.";
    showUnlockFailure(failureMessage);
  } finally {
    setUnlockModalBusy(false);
  }
}

function isUnlockModalOpen() {
  return !!(unlockModalState.overlay && unlockModalState.overlay.hidden === false);
}

function openProtectedUnlockModal(story) {
  if (!story || typeof story !== "object") {
    return;
  }
  if (!unlockModalState.initialized) {
    initProtectedUnlockModal();
  }
  if (!unlockModalState.overlay || !unlockModalState.password) {
    return;
  }

  unlockModalState.story = story;
  const storyReportId = String(story.id || story.reportNumber || "").trim();
  const reportLabel = storyReportId ? `report #${storyReportId}` : "this report";

  if (unlockModalState.message) {
    unlockModalState.message.textContent = `Enter password to open ${reportLabel}.`;
  }

  const protectedSettings = getProtectedPostSettings();
  const rememberedPassword = getRememberedStoryPassword(story.id);
  const hasLocalSavedPassword = !!getLocalSavedStoryPassword(story.id);
  const hasSessionPassword = !!getSessionSavedStoryPassword(story.id);

  unlockModalState.password.value = rememberedPassword || "";
  if (unlockModalState.savePassword) {
    const isAutoSave = protectedSettings.autoSavePasswords;
    unlockModalState.savePassword.checked = isAutoSave || hasLocalSavedPassword;
    unlockModalState.savePassword.disabled = isAutoSave;
  }
  if (unlockModalState.hint) {
    if (protectedSettings.autoSavePasswords) {
      unlockModalState.hint.textContent =
        "Auto-save is enabled in settings. Correct password will be saved.";
    } else if (hasLocalSavedPassword) {
      unlockModalState.hint.textContent =
        "A saved password was found for this post. Click Unlock to continue.";
    } else if (hasSessionPassword) {
      unlockModalState.hint.textContent =
        "This post is already unlocked for the current session.";
    } else {
      unlockModalState.hint.textContent =
        "Password is only saved when Remember is checked.";
    }
  }

  resetUnlockModalVisualState();
  setUnlockModalBusy(false);
  unlockModalState.overlay.hidden = false;

  requestAnimationFrame(() => {
    if (!unlockModalState.password) {
      return;
    }
    unlockModalState.password.focus();
    unlockModalState.password.setSelectionRange(
      unlockModalState.password.value.length,
      unlockModalState.password.value.length,
    );
  });
}

function initProtectedUnlockModal() {
  if (unlockModalState.initialized) {
    return;
  }

  unlockModalState.overlay = document.getElementById("unlock-overlay");
  unlockModalState.modal = document.getElementById("unlock-modal");
  unlockModalState.message = document.getElementById("unlock-message");
  unlockModalState.password = document.getElementById("unlock-password");
  unlockModalState.savePassword = document.getElementById("unlock-save-password");
  unlockModalState.hint = document.getElementById("unlock-hint");
  unlockModalState.feedback = document.getElementById("unlock-feedback");
  unlockModalState.cancelBtn = document.getElementById("unlock-cancel");
  unlockModalState.submitBtn = document.getElementById("unlock-submit");

  if (
    !unlockModalState.overlay ||
    !unlockModalState.password ||
    !unlockModalState.submitBtn ||
    !unlockModalState.cancelBtn
  ) {
    return;
  }

  unlockModalState.submitBtn.addEventListener("click", () => {
    void submitProtectedUnlockModal();
  });

  unlockModalState.cancelBtn.addEventListener("click", () => {
    if (unlockModalState.busy) {
      return;
    }
    closeProtectedUnlockModal();
  });

  unlockModalState.overlay.addEventListener("click", (event) => {
    if (unlockModalState.busy) {
      return;
    }
    if (event.target === unlockModalState.overlay) {
      closeProtectedUnlockModal();
    }
  });

  unlockModalState.password.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void submitProtectedUnlockModal();
      return;
    }
    if (event.key === "Escape" && !unlockModalState.busy) {
      event.preventDefault();
      closeProtectedUnlockModal();
    }
  });

  unlockModalState.password.addEventListener("input", () => {
    if (unlockModalState.feedback && unlockModalState.feedback.classList.contains("is-error")) {
      resetUnlockModalVisualState();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isUnlockModalOpen() || unlockModalState.busy) {
      return;
    }
    event.preventDefault();
    closeProtectedUnlockModal();
  });

  unlockModalState.initialized = true;
}

function normalizeSnapshotKey(key) {
  if (
    typeof KeybindManager !== "undefined" &&
    KeybindManager &&
    typeof KeybindManager.normalizeKey === "function"
  ) {
    return KeybindManager.normalizeKey(key);
  }
  if (key === null || key === undefined) {
    return "";
  }
  if (key === " ") {
    return "space";
  }
  const raw = String(key).trim();
  if (!raw) {
    return "";
  }
  if (raw === "+") {
    return "plus";
  }
  if (raw.includes("+")) {
    const parts = raw
      .toLowerCase()
      .split("+")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return "";
    }
    const aliases = {
      "+": "plus",
      spacebar: "space",
      esc: "escape",
      return: "enter",
      del: "delete",
      control: "ctrl",
      cmd: "meta",
      command: "meta",
      option: "alt",
    };
    const modifiers = [];
    let base = "";
    parts.forEach((part) => {
      const normalized = aliases[part] || part;
      if (
        normalized === "ctrl" ||
        normalized === "shift" ||
        normalized === "alt" ||
        normalized === "meta"
      ) {
        modifiers.push(normalized);
      } else {
        base = normalized;
      }
    });
    const orderedMods = ["ctrl", "shift", "alt", "meta"].filter((mod) =>
      modifiers.includes(mod),
    );
    return base ? [...orderedMods, base].join("+") : orderedMods.join("+");
  }
  const normalized = raw.toLowerCase();
  const aliases = {
    "+": "plus",
    spacebar: "space",
    esc: "escape",
    return: "enter",
    del: "delete",
    control: "ctrl",
    cmd: "meta",
    command: "meta",
    option: "alt",
  };
  return aliases[normalized] || normalized;
}

function getHomepageSettingsSnapshotForDataManager() {
  const sizes = loadFontSizes() || {};
  const skipPrefs = loadSkipPreferences() || {};
  const protectedPrefs = getProtectedPostSettings();
  const fontSelect = document.getElementById("font-select");
  const customFontInput = document.getElementById("custom-font");
  const colorSettings = loadSettings();

  let keybinds = {};
  if (
    typeof KeybindManager !== "undefined" &&
    KeybindManager &&
    KeybindManager.customKeybinds
  ) {
    keybinds = { ...KeybindManager.customKeybinds };
  } else {
    try {
      const raw = localStorage.getItem("homepageKeybinds");
      keybinds = raw ? JSON.parse(raw) : {};
    } catch (error) {
      keybinds = {};
    }
  }

  const normalizedKeybinds = {};
  Object.entries(keybinds || {}).forEach(([action, key]) => {
    const normalized = normalizeSnapshotKey(key);
    if (normalized) {
      normalizedKeybinds[action] = normalized;
    }
  });

  return {
    theme: document.body.dataset.theme === "light" ? "light" : "dark",
    fontFamily:
      fontSelect && fontSelect.value ? fontSelect.value : getCurrentFontFamily(),
    customFont: customFontInput ? customFontInput.value.trim() : "",
    fontSize: Number(sizes.base) || 14,
    headerSize: Number(sizes.header) || 26,
    buttonFontSize: Number(sizes.button) || 12,
    cardFontSize: Number(sizes.card) || 13,
    skipAgeVerify: skipPrefs.skipAgeVerify === true,
    skipWelcome: skipPrefs.skipWelcome === true,
    showProtectedPosts: protectedPrefs.showProtectedPosts === true,
    autoSaveProtectedPasswords: protectedPrefs.autoSavePasswords === true,
    keybinds: normalizedKeybinds,
    customColors:
      colorSettings && typeof colorSettings === "object"
        ? colorSettings
        : { dark: {}, light: {} },
  };
}

function emitHomepageSettingsSnapshot(token = null) {
  if (!isDataManagerSettingsEmbedMode() || window.parent === window) {
    return;
  }
  const payload = {
    type: "homepageSettingsSnapshot",
    settings: getHomepageSettingsSnapshotForDataManager(),
  };
  if (typeof token === "string" && token) {
    payload.token = token;
  }
  window.parent.postMessage(payload, "*");
}

function applyDataManagerSettingsPanelLayout() {
  if (!settingsPanel) return;
  settingsPanel.hidden = false;
  settingsPanel.style.left = "0px";
  settingsPanel.style.top = "0px";
  settingsPanel.style.width = "100%";
  settingsPanel.style.height = "100%";
  settingsPanel.style.maxWidth = "none";
  settingsPanel.style.maxHeight = "none";
  settingsPanel.style.minWidth = "0";
  settingsPanel.style.minHeight = "0";
  settingsPanel.style.borderRadius = "0";
  settingsPanel.style.resize = "none";
}

function initDataManagerSettingsEmbedMode() {
  if (!isDataManagerSettingsEmbedMode()) {
    return;
  }

  document.body.classList.add("dm-settings-embed");
  document.body.classList.remove("no-scroll");

  const overlaysToHide = [
    "age-verify-overlay",
    "loader-overlay",
    "help-modal",
    "confirm-overlay",
    "unlock-overlay",
    "blackout",
    "welcome-overlay",
    "custom-popup-overlay",
  ];
  overlaysToHide.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.hidden = true;
    element.style.display = "none";
  });

  const page = document.querySelector(".page");
  if (page) {
    page.hidden = true;
  }

  if (settingsPanel) {
    settingsPanel.hidden = false;
  }
  applyDataManagerSettingsPanelLayout();
}

window.addEventListener("message", (event) => {
  if (!isDataManagerSettingsEmbedMode() || window.parent === window) {
    return;
  }
  const payload = event && event.data ? event.data : null;
  if (!payload || typeof payload !== "object" || !payload.type) {
    return;
  }

  if (payload.type === "requestHomepageSettingsSnapshot") {
    emitHomepageSettingsSnapshot(payload.token);
  }
});

function createRipple(event) {
    const button = event.currentTarget;

    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");

    const ripple = button.getElementsByClassName("ripple")[0];

    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

// Default color definitions for both themes
// [defaults extracted to js/homepage-defaults.js]

async function loadFonts() {
  try {
    // Use window.FONTS from fonts.js (loaded as script tag - no CORS issues)
    const fonts = window.FONTS || [];
    const fontSelect = document.getElementById("font-select");
    if (fontSelect) {
      fontSelect.innerHTML = "";
      fonts.forEach((font) => {
        const option = document.createElement("option");
        option.value = font.family;
        option.textContent = font.name;
        fontSelect.appendChild(option);
      });
      // Get the font family string (not object) and set it as selected
      const currentFont = getCurrentFontFamily();
      const selectedOption = Array.from(fontSelect.options).find(
        (option) =>
          option.value === currentFont ||
          option.textContent === currentFont,
      );
      if (selectedOption) {
        fontSelect.value = selectedOption.value;
      }
    }
  } catch (error) {
    console.error("Error loading fonts:", error);
  }
}

// Helper function to get the current font family as a string (for dropdown)
function getCurrentFontFamily() {
  // First try DATABASE_SETTINGS (for export/import support)
  const dbSettings = window.DATABASE_SETTINGS?.getSettings();
  if (dbSettings?.fontFamily) {
    return dbSettings.fontFamily;
  }
  
  // Fallback to localStorage (legacy)
  try {
    const raw = localStorage.getItem("homepageFont");
    if (raw) {
      const fontSetting = JSON.parse(raw);
      return fontSetting.family || "'Share Tech Mono', monospace";
    }
  } catch (error) {
    // Fallback to default
  }
  return "'Share Tech Mono', monospace";
}

function loadSettings() {
  try {
    const raw = localStorage.getItem("customColors");
    return raw ? JSON.parse(raw) : { dark: {}, light: {} };
  } catch (error) {
    return { dark: {}, light: {} };
  }
}

function saveSettings(settings) {
  localStorage.setItem("customColors", JSON.stringify(settings));
}

function getColor(colorName, theme) {
  const customColors = loadSettings();
  const themeCustom = customColors[theme] || {};

  if (themeCustom[colorName]) {
    return themeCustom[colorName];
  }

  return DEFAULT_COLORS[theme][colorName];
}

function setColor(colorName, value, theme) {
  const settings = loadSettings();
  if (!settings[theme]) {
    settings[theme] = {};
  }
  settings[theme][colorName] = value;
  saveSettings(settings);
  applyColors();
}

let _applyColorsRaf = null;
function applyColors() {
  if (_applyColorsRaf) return;
  _applyColorsRaf = requestAnimationFrame(() => {
    _applyColorsRaf = null;
    const currentTheme = document.body.dataset.theme || "dark";
    const target = document.body;
    Object.keys(DEFAULT_COLORS.dark).forEach((colorName) => {
      const value = getColor(colorName, currentTheme);
      target.style.setProperty(`--${colorName}`, value);
    });
  });
}

function applyFont(fontFamily, fallback) {
  const root = document.documentElement;
  if (root) {
    // First try to find the font in our FONTS array by name to get the proper family value
    let fontValue = null;
    
    if (window.FONTS) {
      const fontObj = window.FONTS.find(f => f.name === fontFamily || f.family === fontFamily);
      if (fontObj) {
        fontValue = fontObj.family;
      }
    }
    
    // If not found in FONTS, use the provided value with fallback
    if (!fontValue) {
      // Check if it's already a complete font-family string
      if (fontFamily && fontFamily.includes(',')) {
        fontValue = fontFamily;
      } else {
        // It's just a font name, add quotes and fallback
        fontValue = `'${fontFamily}', ${fallback || 'sans-serif'}`;
      }
    }
    
    root.style.setProperty('--font-family-main', fontValue);
    
    // Also update body font for immediate effect
    document.body.style.fontFamily = fontValue;
  }
}

// Save font to both localStorage (for immediate use) and DATABASE_SETTINGS (for export)
function saveFont(fontFamily, fallback) {
  // Save to localStorage for immediate use
  const fontSetting = { family: fontFamily, fallback: fallback };
  localStorage.setItem("homepageFont", JSON.stringify(fontSetting));
  
  // Also save to DATABASE_SETTINGS for export/import functionality
  window.DATABASE_SETTINGS?.setSettings({ fontFamily: fontFamily });
  
  // Apply the font
  applyFont(fontFamily, fallback);
}

// Load font - returns string for dropdown, applies to page
function loadFont() {
  // Try localStorage first (legacy)
  try {
    const raw = localStorage.getItem("homepageFont");
    if (raw) {
      const fontSetting = JSON.parse(raw);
      applyFont(fontSetting.family, fontSetting.fallback);
      return fontSetting.family;
    }
  } catch (error) {
    // Fallback to default
  }
  applyFont('Share Tech Mono', 'monospace');
  return "'Share Tech Mono', monospace";
}

function loadPanelSettings() {
  if (!settingsPanel) return;

  const saved = localStorage.getItem("panelSettings");
  if (saved) {
    const settings = JSON.parse(saved);
    settingsPanel.style.left = settings.left;
    settingsPanel.style.top = settings.top;
    settingsPanel.style.width = settings.width;
    settingsPanel.style.height = settings.height;
  }
}

function savePanelSettings() {
  if (!settingsPanel) return;

  const settings = {
    left: settingsPanel.style.left,
    top: settingsPanel.style.top,
    width: settingsPanel.style.width,
    height: settingsPanel.style.height,
  };
  localStorage.setItem("panelSettings", JSON.stringify(settings));
}

async function loadCatalog() {
  if (Array.isArray(window.REPORT_CATALOG)) {
    const normalizedCache = normalizeCatalogEntries(window.REPORT_CATALOG);
    window.REPORT_CATALOG = normalizedCache;
    return normalizedCache;
  }
  try {
    const response = await fetch("database/catalog.json", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Catalog not found");
    }
    const data = await response.json();
    return normalizeCatalogEntries(Array.isArray(data) ? data : []);
  } catch (error) {
    return [];
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



function saveBookmark(id, payload) {
  localStorage.setItem(`bookmark:${id}`, JSON.stringify(payload));
}

function removeBookmark(id) {
  localStorage.removeItem(`bookmark:${id}`);
}

function getBookmark(id) {
  try {
    const raw = localStorage.getItem(`bookmark:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function isBookmarked(id) {
  return !!getBookmark(id);
}

// Pinned posts functionality (separate from reading progress bookmarks)
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

function isPinned(id) {
  const pins = loadPins();
  return pins.has(id);
}

function matchesSearch(story, query) {
  if (!query) {
    return true;
  }

  // Normalize query: remove commas and extra spaces
  const normalizedQuery = query.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalizedQuery) return true;

  const storyTags = story.tags || [];
  const storyText = [story.title, story.description, ...storyTags].join(" ").toLowerCase();

  // Parse OR groups (| operator)
  const orGroups = normalizedQuery.split('|').map(g => g.trim()).filter(g => g);

  // Must match at least one OR group
  return orGroups.some(orGroup => {
    const terms = orGroup.split(' ').filter(t => t);

    let hasRequired = false;  // Has any +term
    let hasExcluded = false;  // Has any -term
    let requiredMet = true;   // All +terms match
    let excludedMet = true;   // No -terms match
    let optionalMet = false;  // At least one optional term matches

    for (const term of terms) {
      if (term.startsWith('+')) {
        // Required term (AND)
        hasRequired = true;
        const requiredTag = term.slice(1);
        if (!storyTags.some(tag => tag.toLowerCase() === requiredTag)) {
          requiredMet = false;
        }
      } else if (term.startsWith('-')) {
        // Excluded term (NOT)
        hasExcluded = true;
        const excludedTag = term.slice(1);
        if (storyTags.some(tag => tag.toLowerCase() === excludedTag) ||
            storyText.includes(excludedTag)) {
          excludedMet = false;
        }
      } else {
        // Optional term (OR within the group)
        const termInTags = storyTags.some(tag => tag.toLowerCase() === term);
        const termInText = storyText.includes(term);
        if (termInTags || termInText) {
          optionalMet = true;
        }
      }
    }

    // If only optional terms, at least one must match
    // If has required terms, all must match
    // If has excluded terms, none must match
    const onlyOptional = !hasRequired && !hasExcluded;

    if (onlyOptional) {
      return optionalMet || terms.length === 0;
    } else {
      return requiredMet && excludedMet && (optionalMet || !terms.some(t => !t.startsWith('+') && !t.startsWith('-')));
    }
  });
}

function isEditableTarget(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function filterStories(list, favorites, query) {
  const protectedSettings = getProtectedPostSettings();
  return list.filter((story) => {
    if (
      story &&
      story.storyProtected === true &&
      protectedSettings.showProtectedPosts !== true
    ) {
      return false;
    }

    if (!matchesSearch(story, query)) {
      return false;
    }

    if (activeFilter === "favorites") {
      return favorites.has(story.id);
    }

    if (activeFilter === "bookmarks") {
      return isPinned(story.id);
    }

    const mediaProfile = resolveStoryMediaProfile(story);
    if (activeFilter === "gif") {
      return mediaProfile.hasGif;
    }

    if (activeFilter === "video") {
      return mediaProfile.hasVideo;
    }

    return true;
  });
}

function sortByBookmark(list) {
  return list
    .map((story, index) => ({
      story,
      index,
      bookmarked: isBookmarked(story.id),
    }))
    .sort((a, b) => {
      if (a.bookmarked !== b.bookmarked) {
        return a.bookmarked ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map((item) => item.story);
}

function sortByDisplayOrder(list) {
  return list
    .map((story, index) => ({
      story,
      index,
      order: Number.isFinite(story.displayOrder) ? story.displayOrder : null,
    }))
    .sort((a, b) => {
      const aHas = a.order !== null;
      const bHas = b.order !== null;
      if (aHas && bHas) {
        return a.order - b.order;
      }
      if (aHas) {
        return -1;
      }
      if (bHas) {
        return 1;
      }
      return a.index - b.index;
    })
    .map((item) => item.story);
}

function sortStories(list) {
  const sorted = [...list];
  if (activeSort === "title") {
    const direction = sortDirection === "asc" ? 1 : -1;
    sorted.sort(
      (a, b) => storyTitle(a).localeCompare(storyTitle(b)) * direction,
    );
  } else if (activeSort === "createdAt") {
    sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (activeSort === "updatedAt") {
    sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (activeSort === "recent") {
    // Sort by most recent viewer activity (bookmark timestamps)
    sorted.sort((a, b) => {
      const aBookmark = getBookmark(a.id);
      const bBookmark = getBookmark(b.id);

      // Use timestamp from bookmark, or fallback to updatedAt if no bookmark
      const aTime = aBookmark?.timestamp
        ? new Date(aBookmark.timestamp).getTime()
        : new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = bBookmark?.timestamp
        ? new Date(bBookmark.timestamp).getTime()
        : new Date(b.updatedAt || b.createdAt).getTime();

      return bTime - aTime; // Most recent first
    });
  } else if (activeSort === "priority") {
    const favorites = loadFavorites();
    const pins = loadPins();

    const getStoryRank = (story) => {
      const isFavorite = favorites.has(story.id);
      const isPinned = pins.has(story.id);

      if (isPinned && isFavorite) return 0; // Pinned and Favorited
      if (isFavorite) return 1;             // Favorited only
      if (isPinned) return 2;                // Pinned only
      return 3;                              // Normal (neither)
    };

    sorted.sort((a, b) => {
      const rankA = getStoryRank(a);
      const rankB = getStoryRank(b);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Secondary sort: Read > New, then by timestamp
      const aBookmark = getBookmark(a.id);
      const bBookmark = getBookmark(b.id);

      // Group "Read" (has bookmark) before "New" (no bookmark)
      if (!!aBookmark !== !!bBookmark) {
        return !!aBookmark ? -1 : 1;
      }

      // If same status (both read or both new), sort by time
      const aTime = aBookmark ? new Date(aBookmark.timestamp).getTime() : new Date(a.createdAt || 0).getTime();
      const bTime = bBookmark ? new Date(bBookmark.timestamp).getTime() : new Date(b.createdAt || 0).getTime();
      
      return bTime - aTime; // most recent first
    });

    if (sortDirection === 'desc') {
        sorted.reverse();
    }

  } else {
    // Default sort is handled by sortByDisplayOrder
  }
  return sorted;
}

function storyTitle(story, index) {
  if (story.title) {
    return story.title;
  }
  if (story.reportNumber) {
    return `The Report #${story.reportNumber}`;
  }
  return `The Report #${index + 1}`;
}

function storyIdentifierLabel(story, index) {
  const storyObj = story && typeof story === "object" ? story : {};
  const rawNumber = storyObj.reportNumber;
  if (rawNumber !== null && rawNumber !== undefined && `${rawNumber}`.trim()) {
    return `${rawNumber}`.trim();
  }
  if (typeof storyObj.id === "string" && storyObj.id.trim()) {
    const matchedDigits = storyObj.id.match(/(\d+)/);
    if (matchedDigits && matchedDigits[1]) {
      return matchedDigits[1];
    }
    return storyObj.id.trim();
  }
  return String(index + 1);
}

function lockedStoryTitle(story, index) {
  return `🔒 Report #${storyIdentifierLabel(story, index)} Encrypted`;
}

function lockedStoryDescription() {
  return "Message is encrypted, need password to unlock";
}

function applyTheme(theme) {
  if (!themeToggle) {
    return;
  }
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  const isLight = theme === "light";
  themeToggle.textContent = isLight ? "🌙" : "☀️";
  themeToggle.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  localStorage.setItem("homepageTheme", theme);
  applyColors(); // Reapply colors when theme changes
}

function initTheme() {
  const bootTheme = window.__XEDRYK_BOOT_THEME__;
  const stored = localStorage.getItem("homepageTheme");
  if (stored) {
    applyTheme(stored);
    return;
  }
  if (bootTheme === "light" || bootTheme === "dark") {
    applyTheme(bootTheme);
    return;
  }
  const defaultTheme = document.body.dataset.theme;
  if (defaultTheme) {
    applyTheme(defaultTheme);
    return;
  }
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(prefersLight ? "light" : "dark");
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
  if (!codeField) {
    return;
  }
  codeField.innerHTML = "";
  const count = Math.min(36, Math.max(18, Math.floor(window.innerWidth / 40)));
  for (let i = 0; i < count; i += 1) {
    const line = document.createElement("div");
    line.className = "code-line";
    seedCodeLine(line);
    codeField.appendChild(line);
  }
  if (codeRefreshTimer) {
    clearInterval(codeRefreshTimer);
  }
  codeRefreshTimer = setInterval(() => {
    codeField.querySelectorAll(".code-line").forEach(updateCodeLine);
  }, 4200);
  updateCursorGlow(cursorX, cursorY);
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
    const blackoutKey = KeybindManager.getKeyFor('blackout');
    const formatted = KeybindManager.formatKeyDisplay(blackoutKey);
    resumeKeyEl.textContent = formatted === 'SPACEBAR' ? 'spacebar' : formatted;
  }
}

function toggleBlackout() {
  if (!blackout) {
    return;
  }
  const willShow = blackout.hidden;
  blackout.hidden = !willShow;
  document.body.classList.toggle("blackout-active", willShow);
  document.body.classList.toggle("no-scroll", willShow);

  if (willShow) {
    startBlackoutTimer();
  } else {
    stopBlackoutTimer();
  }
}

function updateCursorGlow(xRatio, yRatio) {
  if (!codeField) {
    return;
  }
  codeField.style.setProperty("--cursor-x", `${(xRatio * 100).toFixed(2)}%`);
  codeField.style.setProperty("--cursor-y", `${(yRatio * 100).toFixed(2)}%`);
}

function handleCursorMove(event) {
  if (!codeField) {
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

function detectCoverAssetType(path = "", hint = "") {
  const hintType = String(hint || "").toLowerCase();
  if (hintType === "video" || hintType === "gif" || hintType === "image") {
    return hintType;
  }
  const extMatch = String(path).toLowerCase().match(/\.([a-z0-9]+)(?:[?#].*)?$/);
  const ext = extMatch ? extMatch[1] : "";
  if (["mp4", "webm", "mov", "m4v", "ogg", "ogv", "avi"].includes(ext)) {
    return "video";
  }
  if (ext === "gif") {
    return "gif";
  }
  return "image";
}

function getPathExtension(path = "") {
  const extMatch = String(path)
    .trim()
    .toLowerCase()
    .match(/\.([a-z0-9]+)(?:[?#].*)?$/);
  return extMatch ? extMatch[1] : "";
}

function inferMimeTypeFromPath(path, fallbackType = "image") {
  const ext = getPathExtension(path);
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

function toCssUrl(path = "") {
  const safePath = String(path || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `url('${safePath}')`;
}

function drawElementThumbnail(element, width, height, mimeType, quality) {
  const safeWidth = Number.isFinite(width) ? Math.max(1, Math.floor(width)) : 1;
  const safeHeight = Number.isFinite(height) ? Math.max(1, Math.floor(height)) : 1;
  const maxEdge = 640;
  const scale = Math.min(1, maxEdge / Math.max(safeWidth, safeHeight));
  const targetWidth = Math.max(1, Math.floor(safeWidth * scale));
  const targetHeight = Math.max(1, Math.floor(safeHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }
  ctx.drawImage(element, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL(mimeType, quality);
}

function captureVideoFirstFrame(path) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    let finished = false;
    const timeout = window.setTimeout(() => finish(""), 6000);

    function cleanup() {
      window.clearTimeout(timeout);
      video.onloadeddata = null;
      video.onerror = null;
      video.onseeked = null;
      video.removeAttribute("src");
      video.load();
    }

    function finish(value) {
      if (finished) {
        return;
      }
      finished = true;
      cleanup();
      resolve(value || "");
    }

    function renderFrame() {
      try {
        const frame = drawElementThumbnail(
          video,
          video.videoWidth,
          video.videoHeight,
          "image/jpeg",
          0.85,
        );
        finish(frame);
      } catch (error) {
        finish("");
      }
    }

    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => {
      if (!video.videoWidth || !video.videoHeight) {
        finish("");
        return;
      }
      video.onseeked = renderFrame;
      try {
        video.currentTime = 0;
      } catch (error) {
        renderFrame();
      }
      window.setTimeout(() => {
        if (!finished) {
          renderFrame();
        }
      }, 220);
    };
    video.onerror = () => finish("");
    video.src = path;
    video.load();
  });
}

function captureGifFirstFrame(path) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      try {
        const frame = drawElementThumbnail(
          image,
          image.naturalWidth,
          image.naturalHeight,
          "image/png",
        );
        resolve(frame || "");
      } catch (error) {
        resolve("");
      }
    };
    image.onerror = () => resolve("");
    image.src = path;
  });
}

function getStaticCoverThumbnail(path, type) {
  const normalizedPath = String(path || "").trim();
  if (!normalizedPath || (type !== "video" && type !== "gif")) {
    return Promise.resolve(normalizedPath);
  }
  if (staticCoverThumbCache.has(normalizedPath)) {
    return Promise.resolve(staticCoverThumbCache.get(normalizedPath));
  }
  if (staticCoverThumbJobs.has(normalizedPath)) {
    return staticCoverThumbJobs.get(normalizedPath);
  }

  const task = (type === "video"
    ? captureVideoFirstFrame(normalizedPath)
    : captureGifFirstFrame(normalizedPath))
    .then((thumb) => {
      const resolved = thumb || normalizedPath;
      staticCoverThumbCache.set(normalizedPath, resolved);
      staticCoverThumbJobs.delete(normalizedPath);
      return resolved;
    })
    .catch(() => {
      staticCoverThumbJobs.delete(normalizedPath);
      staticCoverThumbCache.set(normalizedPath, normalizedPath);
      return normalizedPath;
    });

  staticCoverThumbJobs.set(normalizedPath, task);
  return task;
}

function resolveStoryMediaProfile(story) {
  const profile = {
    hasGif: false,
    hasVideo: false,
    videoExt: "",
  };
  if (!story || typeof story !== "object") {
    return profile;
  }

  const collectPath = (path, hint = "") => {
    if (typeof path !== "string") {
      return;
    }
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return;
    }
    const type = detectCoverAssetType(trimmedPath, hint);
    if (type === "video") {
      profile.hasVideo = true;
      if (!profile.videoExt) {
        const ext = getPathExtension(trimmedPath);
        profile.videoExt = ext ? ext.toUpperCase() : "VIDEO";
      }
      return;
    }
    if (type === "gif") {
      profile.hasGif = true;
    }
  };

  if (Array.isArray(story.images)) {
    story.images.forEach((mediaPath) => {
      collectPath(mediaPath);
    });
  }

  if (story.coverMedia && typeof story.coverMedia === "object") {
    collectPath(story.coverMedia.path, story.coverMedia.type || "");
  } else {
    collectPath(story.cover);
  }

  return profile;
}

function getMediaBadgeLabel(mediaProfile) {
  if (!mediaProfile) {
    return "";
  }
  if (mediaProfile.hasVideo) {
    return mediaProfile.videoExt || "VIDEO";
  }
  if (mediaProfile.hasGif) {
    return "GIF";
  }
  return "";
}

function resolveStoryCoverAsset(story) {
  const coverMedia =
    story && story.coverMedia && typeof story.coverMedia === "object"
      ? story.coverMedia
      : null;
  const mediaPath =
    coverMedia && typeof coverMedia.path === "string"
      ? normalizeCatalogPath(coverMedia.path)
      : "";
  const fallbackPath =
    story && typeof story.cover === "string"
      ? normalizeCatalogPath(story.cover)
      : "";
  const path =
    mediaPath && (!fallbackPath || fallbackPath === mediaPath)
      ? mediaPath
      : (fallbackPath || mediaPath);
  if (!path) {
    return null;
  }
  return {
    path,
    type: detectCoverAssetType(path, coverMedia ? coverMedia.type : ""),
  };
}

function normalizeLayoutKey(value) {
  const key = String(value || "").trim().toLowerCase();
  if (key === "list" || key === "compact" || key === "spotlight") {
    return key;
  }
  return "grid";
}

function resolveStoryCoverPosition(story, layout) {
  if (!story || typeof story !== "object") {
    return "";
  }
  const mode = normalizeLayoutKey(layout);
  if (story.coverPositions && typeof story.coverPositions === "object") {
    const modeValue =
      typeof story.coverPositions[mode] === "string"
        ? story.coverPositions[mode].trim()
        : "";
    if (modeValue) {
      return modeValue;
    }
    const gridValue =
      typeof story.coverPositions.grid === "string"
        ? story.coverPositions.grid.trim()
        : "";
    if (gridValue) {
      return gridValue;
    }
  }
  return typeof story.coverPosition === "string" ? story.coverPosition.trim() : "";
}

let renderSequence = 0;

function getStoryCardById(storyId) {
  return Array.from(document.querySelectorAll(".story-card")).find(
    (card) => card.dataset && card.dataset.storyId === storyId,
  );
}

function syncVisibleStorySequence() {
  const visibleStoryIds = Array.from(document.querySelectorAll(".story-card"))
    .map((card) => card.dataset.storyId)
    .filter(Boolean);
  try {
    localStorage.setItem("filteredStorySequence", JSON.stringify(visibleStoryIds));
  } catch (error) {
    // Ignore storage failures.
  }
}

function refreshEmptyStateFromCards() {
  const hasCards = Boolean(document.querySelector(".story-card"));
  emptyState.style.display = hasCards ? "none" : "block";
}

function updateStoryCardActionState(storyId, state = {}) {
  const card = getStoryCardById(storyId);
  if (!card) {
    return;
  }
  let removed = false;

  if (Object.prototype.hasOwnProperty.call(state, "pinned")) {
    const pinned = Boolean(state.pinned);
    const pinButton = card.querySelector(".pin-btn");
    card.dataset.pinned = pinned ? "1" : "0";
    if (pinButton) {
      pinButton.classList.toggle("active", pinned);
      pinButton.title = pinned ? "Unpin this report" : "Pin this report";
    }
    if (activeFilter === "bookmarks" && !pinned) {
      card.remove();
      removed = true;
    }
  }

  if (!removed && Object.prototype.hasOwnProperty.call(state, "favorite")) {
    const favorite = Boolean(state.favorite);
    const favoriteButton = card.querySelector(".favorite-btn");
    card.dataset.favorite = favorite ? "1" : "0";
    if (favoriteButton) {
      favoriteButton.classList.toggle("active", favorite);
    }
    if (activeFilter === "favorites" && !favorite) {
      card.remove();
      removed = true;
    }
  }

  if (!removed) {
    reorderRenderedCards();
  }
  if (typeof KeyboardNavigation !== "undefined" && KeyboardNavigation) {
    KeyboardNavigation.updateElements();
  }
  syncVisibleStorySequence();
  refreshEmptyStateFromCards();
}

function reorderRenderedCards() {
  const cardsByStoryId = new Map(
    Array.from(document.querySelectorAll(".story-card")).map((card) => [
      card.dataset.storyId,
      card,
    ]),
  );
  if (cardsByStoryId.size < 2) {
    return;
  }

  const favorites = loadFavorites();
  const query = searchInput.value.trim();
  const orderedStories = sortStories(filterStories(stories, favorites, query));
  const fragment = document.createDocumentFragment();
  let moved = false;

  orderedStories.forEach((story) => {
    const card = cardsByStoryId.get(story.id);
    if (!card) {
      return;
    }
    if (card.parentElement === grid && card !== grid.children[fragment.childNodes.length]) {
      moved = true;
    }
    fragment.appendChild(card);
  });

  if (moved || fragment.childNodes.length > 0) {
    grid.appendChild(fragment);
  }
}

function createStoryCard(story, index, favorites) {
  const card = document.createElement("a");
  card.className = "story-card";
  card.href = buildViewerStoryUrl(story.id);
  const isProtectedStory = story.storyProtected === true;
  card.dataset.storyId = story.id;
  card.dataset.protected = isProtectedStory ? "1" : "0";
  const coverAsset = resolveStoryCoverAsset(story);
  const mediaProfile = resolveStoryMediaProfile(story);
  const coverToken = `${story.id}:${index}:${Date.now()}`;
  card.dataset.coverToken = coverToken;
  card.dataset.pinned = isPinned(story.id) ? "1" : "0";
  card.dataset.favorite = favorites.has(story.id) ? "1" : "0";

  card.addEventListener("click", (event) => {
    if (event.target && event.target.closest("button")) {
      return;
    }
    lastPointerStoryId = story.id;
    lastFocusSource = "pointer";
  });
  card.addEventListener("pointerenter", () => warmViewerMediaForStory(story), {
    passive: true,
  });
  card.addEventListener("focus", () => warmViewerMediaForStory(story));
  card.addEventListener("pointerdown", () => warmViewerMediaForStory(story), {
    passive: true,
  });

  if (isProtectedStory) {
    setProtectedCardLockedVisual(card, null);
  } else if (coverAsset) {
    card.classList.add("thumb-loading");
    if (coverAsset.type === "image") {
      card.dataset.pendingBg = coverAsset.path;
    } else {
      card.dataset.pendingThumb = JSON.stringify({
        path: coverAsset.path,
        type: coverAsset.type,
      });
    }
    cardBackgroundObserver.observe(card);
  }

  const coverPosition = resolveStoryCoverPosition(story, activeLayout);
  if (coverPosition) {
    card.style.backgroundPosition = coverPosition;
  }

  const pinBtn = document.createElement("button");
  pinBtn.className = "bookmark-btn pin-btn";
  pinBtn.type = "button";
  pinBtn.textContent = "📌";
  pinBtn.title = isPinned(story.id) ? "Unpin this report" : "Pin this report";
  if (isPinned(story.id)) {
    pinBtn.classList.add("active");
  }
  pinBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const pins = loadPins();
    if (pins.has(story.id)) {
      pins.delete(story.id);
    } else {
      pins.add(story.id);
    }
    savePins(pins);
    updateStoryCardActionState(story.id, { pinned: pins.has(story.id) });
  });

  const favoriteBtn = document.createElement("button");
  favoriteBtn.className = "favorite-btn";
  favoriteBtn.type = "button";
  favoriteBtn.textContent = "⭐";
  if (favorites.has(story.id)) {
    favoriteBtn.classList.add("active");
  }
  favoriteBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const currentFavorites = loadFavorites();
    if (currentFavorites.has(story.id)) {
      currentFavorites.delete(story.id);
    } else {
      currentFavorites.add(story.id);
    }
    saveFavorites(currentFavorites);
    updateStoryCardActionState(story.id, {
      favorite: currentFavorites.has(story.id),
    });
  });

  const content = document.createElement("div");
  content.className = "card-content";

  let lockStateBadge = null;
  if (isProtectedStory) {
    lockStateBadge = document.createElement("div");
    lockStateBadge.className = "badge lock-state-badge locked-badge";
    lockStateBadge.textContent = "Locked";
    content.appendChild(lockStateBadge);
  }

  // Show "New" badge for stories that haven't been opened yet (no bookmark)
  const bookmark = getBookmark(story.id);
  if (!bookmark) {
    const badge = document.createElement("div");
    badge.className = "badge new-badge";
    badge.textContent = "New";
    badge.addEventListener("click", createRipple);
    content.appendChild(badge);
  }

  const mediaBadgeLabel = getMediaBadgeLabel(mediaProfile);
  if (mediaBadgeLabel) {
    const mediaBadge = document.createElement("div");
    mediaBadge.className = `badge media-badge ${
      mediaProfile.hasVideo ? "video-badge" : "gif-badge"
    }`;
    mediaBadge.textContent = mediaBadgeLabel;
    content.appendChild(mediaBadge);
  }

  const title = document.createElement("h2");
  title.className = "card-title";

  const desc = document.createElement("p");
  desc.className = "card-desc";

  content.appendChild(title);
  content.appendChild(desc);

  const tagRow = document.createElement("div");
  tagRow.className = "tag-row";
  content.appendChild(tagRow);

  const storyTags = Array.isArray(story.tags) ? story.tags : [];
  const unlockedTitleText = storyTitle(story, index);
  const unlockedDescText = story.description || story.id;

  function renderUnlockedTags() {
    tagRow.innerHTML = "";
    if (storyTags.length === 0) {
      tagRow.hidden = true;
      return;
    }
    tagRow.hidden = false;
    storyTags.forEach((tag) => {
      const pill = document.createElement("button");
      pill.className = "tag";
      pill.type = "button";
      pill.textContent = tag;
      pill.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        createRipple(event);
        const currentSearch = searchInput.value.trim();
        // Check if tag already exists in search
        const existingTags = currentSearch.split(",").map((t) => t.trim()).filter((t) => t);
        if (!existingTags.includes(tag)) {
          if (currentSearch) {
            searchInput.value = `${currentSearch}, ${tag}`;
          } else {
            searchInput.value = tag;
          }
          saveFilterState();
          render();
        }
      });
      tagRow.appendChild(pill);
    });
  }

  function renderLockedTags() {
    tagRow.innerHTML = "";
    const lockCount = Math.max(1, storyTags.length);
    tagRow.hidden = false;
    for (let tagIndex = 0; tagIndex < lockCount; tagIndex += 1) {
      const lockPill = document.createElement("span");
      lockPill.className = "tag locked-tag";
      lockPill.textContent = "🔒";
      lockPill.setAttribute("aria-hidden", "true");
      tagRow.appendChild(lockPill);
    }
  }

  function applyUnlockedStoryContent() {
    title.textContent = unlockedTitleText;
    desc.textContent = unlockedDescText;
    renderUnlockedTags();
  }

  function applyLockedStoryContent() {
    title.textContent = lockedStoryTitle(story, index);
    desc.textContent = lockedStoryDescription();
    renderLockedTags();
  }

  if (isProtectedStory) {
    applyLockedStoryContent();
  } else {
    applyUnlockedStoryContent();
  }

  // Add cursor tracking for card shine effect
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--card-cursor-x", `${x}%`);
    card.style.setProperty("--card-cursor-y", `${y}%`);
  });

  if (isProtectedStory) {
    card.addEventListener("click", (event) => {
      if (event.target && event.target.closest("button")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openProtectedUnlockModal(story);
    });
    hydrateProtectedCardUnlockState(
      card,
      story,
      coverAsset,
      coverToken,
      lockStateBadge,
      {
        onLocked: applyLockedStoryContent,
        onUnlocked: applyUnlockedStoryContent,
        onChecking: applyLockedStoryContent,
      },
    );
  }

  // Append buttons: favorite (star) on the right, pin beside it
  card.appendChild(favoriteBtn);
  card.appendChild(pinBtn);
  card.appendChild(content);
  return card;
}

function render(options = {}) {
  const {
    chunked = false,
    chunkSize = 24,
    onChunk = null,
    onComplete = null,
  } = options;
  const renderId = ++renderSequence;
  grid.innerHTML = "";
  const favorites = loadFavorites();
  const query = searchInput.value.trim();

  const filtered = filterStories(stories, favorites, query);
  const sorted = sortStories(filtered);
  const finalStories = sorted;

  if (finalStories.length === 0) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // Store the filtered story IDs for viewer navigation
  const filteredStoryIds = finalStories.map((story) => story.id);
  localStorage.setItem(
    "filteredStorySequence",
    JSON.stringify(filteredStoryIds),
  );

  if (!chunked || finalStories.length <= chunkSize) {
    finalStories.forEach((story, index) => {
      grid.appendChild(createStoryCard(story, index, favorites));
    });
    if (typeof onChunk === "function") {
      onChunk();
    }
    if (typeof onComplete === "function") {
      onComplete();
    }
    return;
  }

  let cursor = 0;
  const scheduleChunk =
    typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
      ? window.requestAnimationFrame
      : (callback) => window.setTimeout(callback, 16);

  const appendChunk = () => {
    if (renderId !== renderSequence) {
      return;
    }
    const fragment = document.createDocumentFragment();
    const end = Math.min(cursor + chunkSize, finalStories.length);
    for (; cursor < end; cursor += 1) {
      fragment.appendChild(createStoryCard(finalStories[cursor], cursor, favorites));
    }
    grid.appendChild(fragment);
    if (typeof onChunk === "function") {
      onChunk();
    }
    if (cursor < finalStories.length) {
      scheduleChunk(appendChunk);
    } else if (typeof onComplete === "function") {
      onComplete();
    }
  };

  appendChunk();
}

function saveFilterState() {
  const state = {
    filter: activeFilter,
    search: searchInput.value.trim(),
    layout: activeLayout,
    sort: activeSort,
    sortDirection: sortDirection,
  };
  localStorage.setItem("homepageState", JSON.stringify(state));
}

function loadFilterState() {
  try {
    const raw = localStorage.getItem("homepageState");
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function applyFilterState(state) {
  if (!state) return;

  // Apply filter
  if (state.filter) {
    activeFilter = state.filter;
    filterButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === activeFilter);
    });
  }

  // Apply search
  if (state.search) {
    searchInput.value = state.search;
  }

  // Apply layout
  if (state.layout) {
    applyLayout(state.layout);
  }

  // Apply sort
  if (state.sort) {
    activeSort = state.sort;
    sortDirection = state.sortDirection || "asc";
    applySortPreference({ type: activeSort, direction: sortDirection });
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    saveFilterState();
    render();
  });
});

searchInput.addEventListener("input", () => {
  saveFilterState();
  render();
});

function applyLayout(layout) {
  activeLayout = layout || "grid";
  grid.dataset.layout = activeLayout;
  layoutButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.layout === activeLayout);
  });
  localStorage.setItem("homepageLayout", activeLayout);
  if (Array.isArray(stories) && stories.length > 0) {
    render();
  }
}

function applySortPreference(sortData) {
  if (!sortData) {
    sortData = { type: "default", direction: "asc" };
  }

  activeSort = sortData.type || "default";
  sortDirection = sortData.direction || "asc";

  sortButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === activeSort);
    if (button.dataset.sort === "title") {
      if (activeSort === 'title') {
        button.textContent = sortDirection === "asc" ? "Title A-Z" : "Title Z-A";
      } else {
        button.textContent = "Title";
      }
    }
    if (button.dataset.sort === "priority") {
      if (activeSort === 'priority') {
        button.textContent = sortDirection === "asc" ? "Priority ↓" : "Priority ↑";
      } else {
        button.textContent = "Priority";
      }
    }
  });
}

  layoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLayout(button.dataset.layout);
    saveFilterState();
  });
});

sortButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const sortType = button.dataset.sort;

    if (activeSort === sortType && (sortType === 'title' || sortType === 'priority')) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortDirection = 'asc';
    }
    
    activeSort = sortType;

    if (window.VIEWER_SETTINGS && window.VIEWER_SETTINGS.homepageSort) {
      window.VIEWER_SETTINGS.homepageSort.type = activeSort;
      window.VIEWER_SETTINGS.homepageSort.direction = sortDirection;
    }
    
    applySortPreference({ type: activeSort, direction: sortDirection });
    saveFilterState();
    render();
  });
});

window.addEventListener("storage", (event) => {
  if (!event.key) {
    return;
  }
  if (event.key === PROTECTED_POST_SETTINGS_KEY) {
    protectedPostSettingsCache = null;
    clearProtectedStoryCaches();
    render();
    return;
  }
  if (event.key === PROTECTED_LOCAL_PASSWORDS_KEY) {
    clearProtectedStoryCaches();
    render();
    return;
  }
  if (
    event.key === "favorites" ||
    event.key === "pinned" ||
    event.key.startsWith("bookmark:")
  ) {
    render();
  }
});

// ===== NEW LOADING FLOW =====
// Age verification → Loading screen (heavy) → Welcome → Homepage

// Initialize theme early - before showing age verification
// This ensures the age verification uses the correct theme (saved or system)
function initThemeEarly() {
  const bootTheme = window.__XEDRYK_BOOT_THEME__;
  const stored = localStorage.getItem("homepageTheme");
  if (stored) {
    applyTheme(stored);
    return;
  }
  if (bootTheme === "light" || bootTheme === "dark") {
    applyTheme(bootTheme);
    return;
  }
  // Check system preference
  const prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(prefersLight ? "light" : "dark");
}

// Start the application - check age verification FIRST
async function startApp() {
  // Initialize theme FIRST so age verification has correct theme
  initThemeEarly();

  if (isDataManagerSettingsEmbedMode()) {
    await openSettings();
    initDataManagerSettingsEmbedMode();
    emitHomepageSettingsSnapshot();
    return;
  }

  if (shouldUseWarmStart()) {
    await startWarmLoad();
    return;
  }
  
  // Check age verification first
  if (!shouldSkipAgeVerify()) {
    // Show age verification immediately (no loading yet)
    showAgeVerificationForStartup();
    return;
  }

  // Age verified, now start loading heavy resources
  startLoadingScreen();
}

// Age verification for startup (shows immediately, no loading)
function showAgeVerificationForStartup() {
  const overlay = document.getElementById('age-verify-overlay');
  if (!overlay) {
    console.error('Age verify overlay not found!');
    return;
  }
  
  overlay.hidden = false;
  
  // Handle Yes button - start loading after verification
  // Note: We do NOT save to localStorage here
  // The skip preference is ONLY controlled by the Settings toggle
  // Clicking Yes works for this session only (F5 will show popup again)
  const yesBtn = document.getElementById('age-yes');
  if (yesBtn) {
    // Clone and replace to remove any existing handlers
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    newYesBtn.addEventListener('click', handleYesClick);
  } else {
    console.error('Yes button not found!');
  }
  
  // Handle No button
  const noBtn = document.getElementById('age-no');
  if (noBtn) {
    const newNoBtn = noBtn.cloneNode(true);
    noBtn.parentNode.replaceChild(newNoBtn, noBtn);
    newNoBtn.addEventListener('click', handleNoClick);
  } else {
    console.error('No button not found!');
  }
  
  const ageKeyHandler = (event) => {
    if (overlay.hidden || overlay.style.display === "none") {
      return;
    }
    const key = String(event.key || "").toLowerCase();
    if (key === "enter" || key === " " || key === "y") {
      event.preventDefault();
      handleYesClick();
      return;
    }
    if (key === "escape" || key === "n") {
      event.preventDefault();
      handleNoClick();
    }
  };
  document.addEventListener("keydown", ageKeyHandler);

  // Emergency keyboard bypass - press 'Y' to bypass
  const bypassHandler = (e) => {
    if (e.key.toLowerCase() === 'y') {
      console.log('Age verify bypassed via keyboard');
      overlay.hidden = true;
      startLoadingScreen();
      document.removeEventListener('keydown', bypassHandler);
    }
  };
  document.addEventListener('keydown', bypassHandler, { once: true });
  
  // Also remove handler when overlay is hidden
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.hidden === true) {
        document.removeEventListener('keydown', bypassHandler);
        document.removeEventListener('keydown', ageKeyHandler);
        observer.disconnect();
      }
    });
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ['hidden'] });
}

// Register global function for inline onclick handler
window.startAgeVerifiedLoading = function() {
  startLoadingScreen();
};

function handleYesClick() {
  // Save age verified state in sessionStorage (persists until F5/tab close)
  sessionStorage.setItem('ageVerified', 'true');
  const overlay = document.getElementById('age-verify-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('data-age-verify', 'false');
  }
  startLoadingScreen();
}

function handleNoClick() {
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#03050b;color:#e8f1ff;font-family:sans-serif;text-align:center;padding:20px;"><div><h1>Access Denied</h1><p>You must be 18 or older to access this archive.</p><p style="margin-top:20px;font-size:12px;color:#e8f1ff66;">If this is a mistake, <button onclick="localStorage.removeItem(\'skipPreferences\');location.reload();" style="background:transparent;border:1px solid #e8f1ff;color:#e8f1ff;padding:8px 16px;cursor:pointer;">Reset & Reload</button></p></div></div>';
}

// Start the loading screen and load all heavy resources
async function startLoadingScreen() {
  // Hide scrollbar during loading
  document.body.classList.add("no-scroll");
  
  const loader = {
    overlay: document.getElementById("loader-overlay"),
    progressBar: document.getElementById("progress-bar"),
    status: document.getElementById("loading-status"),
    logo: document.querySelector(".loader-logo"),
  };

  // Show loader
  if (loader.overlay) loader.overlay.hidden = false;

  function updateProgress(percent) {
    if (loader.progressBar) loader.progressBar.style.width = `${percent}%`;
  }

  function setLoadingStatus(message) {
    if (loader.status) loader.status.textContent = message;
  }

  try {
    setLoadingStatus("Loading report catalog...");
    updateProgress(10);
    const catalog = await loadCatalog();

    setLoadingStatus("Preparing interface...");
    updateProgress(35);

    if (document.fonts) {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => window.setTimeout(resolve, 800)),
        ]);
        setLoadingStatus("Fonts synchronized");
      } catch (error) {
        setLoadingStatus("Fonts queued");
      }
    }

    setLoadingStatus("Building gallery...");
    updateProgress(70);

    await applyHomepageState(catalog);
    markWarmCacheReady();

    updateProgress(100);
    setLoadingStatus("Archive loaded.");

    // Fade out loader
    setTimeout(() => {
      if (loader.overlay) {
        loader.overlay.style.opacity = "0";
        loader.overlay.addEventListener("transitionend", () => {
          if (loader.overlay) loader.overlay.hidden = true;
          // Remove no-scroll class to restore scrolling on homepage
          document.body.classList.remove("no-scroll");
          // Show the page content
          const page = document.querySelector(".page");
          if (page) page.hidden = false;
          warmInitialCardCovers();
          // Show startup screens (welcome) after loader fades out
          initStartupScreens();
        });
      }
    }, 250);
  } catch (error) {
    if (loader.status) setLoadingStatus(`Fatal error: ${error.message}.`);
    console.error(error);
    if (loader.overlay) loader.overlay.style.backgroundColor = "red"; // Indicate error
  }
}

async function applyHomepageState(catalog, options = {}) {
  stories = sortByDisplayOrder(catalog);
  const fontSelect = document.getElementById("font-select");
  if (fontSelect) {
    fontSelect.addEventListener("change", () => {
      saveFont(fontSelect.value);
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const tagQuery = urlParams.get("tag");
  const fromViewer = urlParams.get("from") === "viewer";

  // Load saved state or use defaults
  const savedState = loadFilterState();

  if (tagQuery) {
    // If coming from a tag link, use that search
    searchInput.value = tagQuery;
    saveFilterState();
  } else if (fromViewer && savedState) {
    // If returning from viewer, restore saved state
    applyFilterState(savedState);
  } else if (savedState) {
    // Normal page load with saved state
    applyFilterState(savedState);
  }

  // Apply layout and sort (will use saved values or defaults)
  const layoutToApply =
    savedState?.layout || localStorage.getItem("homepageLayout") || "grid";
  const sortToApply =
    savedState?.sort || window.VIEWER_SETTINGS.homepageSort?.type || "default";
  const sortDirection =
    savedState?.sortDirection ||
    window.VIEWER_SETTINGS.homepageSort?.direction ||
    "asc";

  applyLayout(layoutToApply);
  applySortPreference({ type: sortToApply, direction: sortDirection });
  initTheme();
  await loadFonts(); // Load fonts for the dropdown
  applyColors(); // Load and apply custom colors
  applyFont(loadFont()); // Load and apply custom font
  buildCodeField();
  initDragging(); // Initialize dragging for settings panel
  render({
    chunked: options.chunked === true,
    onChunk: options.onRenderChunk,
    onComplete: options.onRenderComplete,
  });
}

async function startWarmLoad() {
  restoreWarmThumbCache();

  const loaderOverlay = document.getElementById("loader-overlay");
  if (loaderOverlay) {
    loaderOverlay.hidden = true;
    loaderOverlay.style.opacity = "";
  }
  document.body.classList.remove("no-scroll");
  const page = document.querySelector(".page");
  if (page) page.hidden = false;

  const catalog = await loadCatalog();
  const focusId = sessionStorage.getItem(HOMEPAGE_WARM_FOCUS_KEY) || "";
  const focusSource =
    sessionStorage.getItem(HOMEPAGE_WARM_FOCUS_SOURCE_KEY) || "";
  const scrollValue = parseInt(
    sessionStorage.getItem(HOMEPAGE_WARM_SCROLL_KEY) || "0",
    10,
  );
  let restored = false;

  const attemptRestore = (force = false) => {
    if (restored) {
      return;
    }
    if (focusSource === "keyboard") {
      let focused = false;
      if (
        focusId &&
        typeof KeyboardNavigation !== "undefined" &&
        KeyboardNavigation &&
        typeof KeyboardNavigation.focusCardByStoryId === "function"
      ) {
        focused = KeyboardNavigation.focusCardByStoryId(focusId);
      }
      if (focused) {
        restored = true;
        return;
      }
    }
    if (!Number.isFinite(scrollValue) || scrollValue <= 0) {
      return;
    }
    if (force) {
      window.scrollTo(0, scrollValue);
      restored = true;
      return;
    }
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    );
    if (maxScroll >= scrollValue) {
      window.scrollTo(0, scrollValue);
      restored = true;
    }
  };

  await applyHomepageState(catalog, {
    chunked: true,
    onRenderChunk: () => attemptRestore(false),
    onRenderComplete: () => attemptRestore(true),
  });
  warmInitialCardCovers();
  markWarmCacheReady();

  initStartupScreens();
}

let warmScrollRaf = null;
function scheduleWarmScrollSave() {
  if (warmScrollRaf) {
    return;
  }
  warmScrollRaf = window.requestAnimationFrame(() => {
    warmScrollRaf = null;
    try {
      sessionStorage.setItem(
        HOMEPAGE_WARM_SCROLL_KEY,
        String(window.scrollY || 0),
      );
    } catch (error) {
      // Ignore storage failures.
    }
  });
}

// Keep init as the entry point but change flow
async function init() {
  initProtectedUnlockModal();
  startApp();
  
  // Modal tabs initialization (was inside DOMContentLoaded)
  const modalTabs = document.querySelectorAll("#help-modal .modal-tab");
  const modalTabContents = document.querySelectorAll(
    "#help-modal .modal-tab-content",
  );

  modalTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      modalTabs.forEach((t) => t.classList.remove("active"));
      modalTabContents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      
      // Fix scrollbar flickering - temporarily fix modal body height
      const modalBody = document.getElementById('help-body');
      if (modalBody) {
        const currentHeight = modalBody.clientHeight;
        modalBody.style.height = currentHeight + 'px';
      }
      
      const content = document.querySelector(
        `#help-modal .modal-tab-content[data-content="${tab.dataset.tab}"]`,
      );
      if (content) {
        content.classList.add("active");
      }
      
      // Restore auto height after content renders
      requestAnimationFrame(() => {
        if (modalBody) {
          modalBody.style.height = '';
        }
      });
    });
  });
}

// Call init immediately since script is at end of body
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', init);
} else {
  // DOM already ready, call init now
  init();
}

window.addEventListener("pagehide", (event) => {
  storeWarmCacheState();
  if (event && event.persisted) {
    return;
  }
  releaseProtectedCoverObjectUrls();
});

window.addEventListener("scroll", scheduleWarmScrollSave, { passive: true });

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.body.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
  });
}

if (helpBtn) {
  helpBtn.addEventListener("click", () => {
    if (!helpModal) {
      return;
    }
    helpModal.classList.add("is-open");
    helpModal.setAttribute("aria-hidden", "false");

    // Reset to default tab
    const helpTab = document.querySelector('.modal-tab[data-tab="help"]');
    const aboutTab = document.querySelector('.modal-tab[data-tab="about"]');
    const helpContent = document.querySelector(
      '.modal-tab-content[data-content="help"]',
    );
    const aboutContent = document.querySelector(
      '.modal-tab-content[data-content="about"]',
    );

    if (helpTab && aboutTab && helpContent && aboutContent) {
      helpTab.classList.add("active");
      aboutTab.classList.remove("active");
      helpContent.classList.add("active");
      aboutContent.classList.remove("active");
    }

    // Render dynamic keyboard shortcuts in help modal
    if (typeof KeybindManager !== 'undefined' && KeybindManager.renderHelpShortcuts) {
      KeybindManager.renderHelpShortcuts();
    }
  });
}

window.addEventListener("resize", () => {
  buildCodeField();
});

function closeHelpModal() {
  if (!helpModal) {
    return;
  }
  helpModal.classList.remove("is-open");
  helpModal.setAttribute("aria-hidden", "true");
}

if (helpClose) {
  helpClose.addEventListener("click", closeHelpModal);
}

if (helpModal) {
  helpModal.addEventListener("click", (event) => {
    if (event.target === helpModal) {
      closeHelpModal();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeHelpModal();
  }
});

// Blackout search functionality
let isSearchFocused = false;

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
    isSearchFocused = true;
  });

  searchInput.addEventListener("blur", () => {
    isSearchFocused = false;
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

// Handle keyboard shortcuts - check blackout keybind first
window.addEventListener("keydown", (event) => {
  // If search is focused, only handle Escape to unfocus
  if (isSearchFocused) {
    if (event.key === "Escape") {
      const searchInput = document.getElementById("blackout-search-input");
      if (searchInput) searchInput.blur();
    }
    // Allow all other keys including spacebar for typing
    return;
  }

  if (isEditableTarget(event.target)) {
    return;
  }

  // Check if the pressed key matches the blackout keybind
  const blackoutKey = KeybindManager.getKeyFor('blackout');
  const pressedCombo = KeybindManager.eventToKeybind(event);
  if (pressedCombo && pressedCombo === KeybindManager.normalizeKey(blackoutKey)) {
    event.preventDefault();
    toggleBlackout();
  }
});

// Initialize blackout search on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initBlackoutSearch();
});

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
// Settings Panel Functions
function setSettingsPreviewTheme(theme) {
  if (theme !== "dark" && theme !== "light") return;
  settingsCurrentTheme = theme;
  if (document.body.dataset.theme !== theme) {
    applyTheme(theme);
  }
}

function positionColorPickerInput(input, anchor, event) {
  if (!input || !anchor) return;

  const anchorRect = anchor.getBoundingClientRect();
  const pickerSize = 18;
  const margin = 8;
  const minEdge = 4;

  let x = anchorRect.right + margin;
  let y = anchorRect.top + anchorRect.height / 2 - pickerSize / 2;

  const hasPointerPosition =
    event &&
    Number.isFinite(event.clientX) &&
    Number.isFinite(event.clientY) &&
    !(event.clientX === 0 && event.clientY === 0);

  if (hasPointerPosition) {
    x = event.clientX + margin;
    y = event.clientY - pickerSize / 2;
  }

  const maxX = Math.max(minEdge, window.innerWidth - pickerSize - minEdge);
  const maxY = Math.max(minEdge, window.innerHeight - pickerSize - minEdge);

  const clampedX = Math.min(Math.max(minEdge, x), maxX);
  const clampedY = Math.min(Math.max(minEdge, y), maxY);

  input.style.left = `${Math.round(clampedX)}px`;
  input.style.top = `${Math.round(clampedY)}px`;
}

function openColorPickerInput(input, anchor, event) {
  if (!input || !anchor) return;

  positionColorPickerInput(input, anchor, event);

  // Temporarily make the control active so native pickers anchor correctly.
  input.style.opacity = "0.001";
  input.style.pointerEvents = "auto";
  input.style.zIndex = "9999";
  input.focus({ preventScroll: true });

  // Force layout before opening picker to ensure position is applied.
  void input.offsetWidth;

  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  } catch (error) {
    input.click();
  }
}

function renderThemeColorGrid(theme, targetGrid) {
  if (!targetGrid) return;
  targetGrid.innerHTML = "";

  const parentGroup = targetGrid.closest("[data-theme-group]");
  if (parentGroup && parentGroup.dataset.previewBound !== "true") {
    const previewGroupTheme = () => setSettingsPreviewTheme(theme);
    parentGroup.addEventListener("pointerdown", previewGroupTheme);
    parentGroup.addEventListener("focusin", previewGroupTheme);
    parentGroup.dataset.previewBound = "true";
  }

  const colors = DEFAULT_COLORS[theme];
  Object.entries(colors).forEach(([colorName]) => {
    const currentValue = getColor(colorName, theme);
    const desc = COLOR_DESCRIPTIONS[colorName];

    const item = document.createElement("div");
    item.className = "color-item";
    item.dataset.theme = theme;

    const previewTheme = () => setSettingsPreviewTheme(theme);
    item.addEventListener("pointerdown", previewTheme);
    item.addEventListener("focusin", previewTheme);

    const label = document.createElement("div");
    label.className = "color-label";
    label.textContent = colorName.replace("-", " ").toUpperCase();

    const labelDesc = document.createElement("div");
    labelDesc.className = "color-label-desc";
    labelDesc.textContent = desc.desc;

    const inputWrapper = document.createElement("div");
    inputWrapper.className = "color-input-wrapper";

    const isGradient = currentValue.includes("linear-gradient");

    if (isGradient) {
      // For gradients, use a text input with preview
      const gradientPreview = document.createElement("div");
      gradientPreview.className = "gradient-preview";
      gradientPreview.style.background = currentValue;

      const textInput = document.createElement("input");
      textInput.className = "gradient-text-input";
      textInput.type = "text";
      textInput.value = currentValue;

      const updateGradientDisplay = (newValue) => {
        previewTheme();
        gradientPreview.style.background = newValue;
        setColor(colorName, newValue, theme);
      };

      textInput.addEventListener("focus", previewTheme);
      textInput.addEventListener("click", previewTheme);
      textInput.addEventListener("blur", (e) => {
        updateGradientDisplay(e.target.value);
      });

      textInput.addEventListener("input", (e) => {
        previewTheme();
        try {
          gradientPreview.style.background = e.target.value;
        } catch (error) {
          // Invalid gradient, don't update preview
        }
      });

      inputWrapper.appendChild(gradientPreview);
      inputWrapper.appendChild(textInput);
    } else {
      // For solid colors, use color picker
      const pickerBtn = document.createElement("button");
      pickerBtn.className = "color-picker-btn";
      pickerBtn.type = "button";
      pickerBtn.style.backgroundColor = currentValue;

      const hiddenInput = document.createElement("input");
      hiddenInput.className = "color-picker-input";
      hiddenInput.type = "color";
      hiddenInput.value = rgbToHex(currentValue);

      const resetPickerInputState = () => {
        hiddenInput.style.opacity = "0";
        hiddenInput.style.pointerEvents = "none";
        hiddenInput.style.zIndex = "";
      };

      const valueDisplay = document.createElement("div");
      valueDisplay.className = "color-value";
      valueDisplay.textContent = currentValue;

      const updateColorDisplay = (newValue) => {
        previewTheme();
        pickerBtn.style.backgroundColor = newValue;
        valueDisplay.textContent = newValue;
        setColor(colorName, newValue, theme);
      };

      pickerBtn.addEventListener("click", (event) => {
        previewTheme();
        openColorPickerInput(hiddenInput, pickerBtn, event);
      });

      hiddenInput.addEventListener("change", (e) => {
        const hexValue = e.target.value;
        updateColorDisplay(hexValue);
        resetPickerInputState();
      });

      hiddenInput.addEventListener("input", (e) => {
        previewTheme();
        const hexValue = e.target.value;
        pickerBtn.style.backgroundColor = hexValue;
        valueDisplay.textContent = hexValue;
      });

      hiddenInput.addEventListener("blur", resetPickerInputState);

      inputWrapper.appendChild(pickerBtn);
      inputWrapper.appendChild(valueDisplay);
      inputWrapper.appendChild(hiddenInput);
    }

    item.appendChild(label);
    item.appendChild(labelDesc);
    item.appendChild(inputWrapper);
    targetGrid.appendChild(item);
  });
}

function renderColorGrid() {
  renderThemeColorGrid("dark", colorGridDark);
  renderThemeColorGrid("light", colorGridLight);
}

function rgbToHex(color) {
  // If already hex, return it (handle both 6-digit and 8-digit hex)
  if (color.startsWith("#")) {
    // If it's already an 8-digit hex with alpha, return as-is
    if (color.length === 9) {
      return color;
    }
    // If it's a 6-digit hex, return as-is
    if (color.length === 7) {
      return color;
    }
    // If it's a 3-digit hex, expand it
    if (color.length === 4) {
      const r = color[1];
      const g = color[2];
      const b = color[3];
      return `#${r}${r}${g}${g}${b}${b}`;
    }
    return color;
  }

  // Parse rgba/rgb with optional alpha
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, "0");
    
    // Handle alpha if present
    if (rgbaMatch[4] !== undefined) {
      const alpha = parseFloat(rgbaMatch[4]);
      const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
      return `#${r}${g}${b}${a}`.toLowerCase();
    }
    
    return `#${r}${g}${b}`.toLowerCase();
  }

  return "#000000";
}

// Convert hex to rgba for CSS variables (for gradients and complex values)
function hexToRgba(hex, defaultAlpha = 1) {
  // Remove # if present
  hex = hex.replace("#", "");
  
  // Handle 8-digit hex (with alpha)
  if (hex.length === 8) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = parseInt(hex.substring(6, 8), 16) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }
  
  // Handle 6-digit hex
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${defaultAlpha})`;
  }
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${defaultAlpha})`;
  }
  
  return hex;
}

// Convert gradient with rgba values to use hex values
function convertGradientToHex(gradient) {
  if (!gradient || !gradient.includes("rgba")) {
    return gradient;
  }
  
  // Replace all rgba values in the gradient with hex
  return gradient.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g, (match, r, g, b, a) => {
    const red = parseInt(r).toString(16).padStart(2, "0");
    const green = parseInt(g).toString(16).padStart(2, "0");
    const blue = parseInt(b).toString(16).padStart(2, "0");
    
    if (a !== undefined) {
      const alpha = Math.round(parseFloat(a) * 255).toString(16).padStart(2, "0");
      return `#${red}${green}${blue}${alpha}`.toLowerCase();
    }
    
    return `#${red}${green}${blue}`.toLowerCase();
  });
}

function readHomepageFontSetting() {
  try {
    const raw = localStorage.getItem("homepageFont");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function refreshSettingsPanelFromStorage() {
  const storedTheme = localStorage.getItem("homepageTheme");
  if (storedTheme === "light" || storedTheme === "dark") {
    applyTheme(storedTheme);
  }

  applyFont(loadFont());
  applyFontSizes();

  settingsCurrentTheme = document.body.dataset.theme || "dark";
  renderColorGrid();

  initSettingsTabs();
  initFontSizeControls();
  initCustomFontInput();
  initInputSettings();

  if (typeof KeybindManager !== "undefined") {
    KeybindManager.loadKeybinds();
    KeybindManager.renderKeybindList();
  }
  updateBlackoutResumeText();
}

async function openSettings() {
  if (!settingsPanel) return;

  // Reload fonts - window.FONTS is set by fonts.js loaded via script tag
  await loadFonts();

  loadPanelSettings();
  settingsPanel.hidden = false;
  refreshSettingsPanelFromStorage();
}

function closeSettings() {
  if (!settingsPanel) return;
  settingsPanel.hidden = true;
}

function initDragging() {
  if (!settingsPanel) return;
  if (isDataManagerSettingsEmbedMode()) return;

  const header = settingsPanel.querySelector(".settings-header");
  let isDragging = false;
  let isResizing = false;
  let startX = 0;
  let startY = 0;
  let startPanelX = 0;
  let startPanelY = 0;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = settingsPanel.getBoundingClientRect();
    startPanelX = rect.left;
    startPanelY = rect.top;
    settingsPanel.classList.add("dragging");
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    const newX = startPanelX + deltaX;
    const newY = startPanelY + deltaY;

    settingsPanel.style.left =
      Math.max(
        0,
        Math.min(newX, window.innerWidth - settingsPanel.offsetWidth),
      ) + "px";
    settingsPanel.style.top =
      Math.max(
        0,
        Math.min(newY, window.innerHeight - settingsPanel.offsetHeight),
      ) + "px";
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      settingsPanel.classList.remove("dragging");
      savePanelSettings();
    }
  });


  document.addEventListener(
    "touchmove",
    (e) => {
      if (!isDragging || !e.touches[0]) return;

      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;

      const newX = startPanelX + deltaX;
      const newY = startPanelY + deltaY;

      settingsPanel.style.left =
        Math.max(
          0,
          Math.min(newX, window.innerWidth - settingsPanel.offsetWidth),
        ) + "px";
      settingsPanel.style.top =
        Math.max(
          0,
          Math.min(newY, window.innerHeight - settingsPanel.offsetHeight),
        ) + "px";
    },
    { passive: true },
  );

  document.addEventListener("touchend", () => {
    if (isDragging) {
      isDragging = false;
      settingsPanel.classList.remove("dragging");
      savePanelSettings();
    }
  });

  // Track resize operations to prevent accidental closing
  settingsPanel.addEventListener("mousedown", (e) => {
    // Check if clicking on the resize handle area (bottom-right corner)
    const rect = settingsPanel.getBoundingClientRect();
    const isResizeHandle = 
      e.clientX > rect.right - 20 && 
      e.clientY > rect.bottom - 20;
    
    if (isResizeHandle) {
      isResizing = true;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      // Delay clearing the flag to prevent the click event from firing
      setTimeout(() => {
        isResizing = false;
      }, 100);
    }
  });

  // Save size when panel is resized via resize handle
  const resizeObserver = new ResizeObserver(() => {
    // Debounce the save to avoid excessive writes
    clearTimeout(settingsPanel.resizeTimeout);
    settingsPanel.resizeTimeout = setTimeout(() => {
      savePanelSettings();
    }, 100);
  });
  resizeObserver.observe(settingsPanel);

  // Also save on window resize to ensure position stays valid
  window.addEventListener("resize", () => {
    // Ensure panel stays within bounds after window resize
    const rect = settingsPanel.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    if (rect.left > maxX) {
      settingsPanel.style.left = Math.max(0, maxX) + "px";
    }
    if (rect.top > maxY) {
      settingsPanel.style.top = Math.max(0, maxY) + "px";
    }
    savePanelSettings();
  });

  // Store the flag on the panel element so the click handler can access it
  settingsPanel.isResizing = () => isResizing;
}

// Tab switching functionality
function initSettingsTabs() {
  if (settingsTabsInitialized || !settingsPanel) {
    return;
  }
  settingsTabsInitialized = true;

  const tabButtons = Array.from(settingsPanel.querySelectorAll(".tab-btn"));
  const tabPanels = Array.from(settingsPanel.querySelectorAll(".tab-panel"));

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;

      // Update button states
      tabButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabId);
        btn.setAttribute("aria-selected", btn.dataset.tab === tabId ? "true" : "false");
      });

      // Update panel visibility
      tabPanels.forEach((panel) => {
        const isActive = panel.dataset.tabPanel === tabId;
        panel.classList.toggle("active", isActive);
        panel.hidden = !isActive;
      });
    });
  });
}


// Font size controls
function initFontSizeControls() {
  const fontSizeInputs = {
    base: document.getElementById("base-font-size"),
    header: document.getElementById("header-font-size"),
    button: document.getElementById("button-font-size"),
    card: document.getElementById("card-font-size"),
  };

  // Load saved font sizes
  const savedSizes = loadFontSizes();
  Object.keys(fontSizeInputs).forEach((key) => {
    const input = fontSizeInputs[key];
    if (input && savedSizes[key]) {
      input.value = savedSizes[key];
      updateRangeValue(input);
    }
  });

  if (fontSizeControlsInitialized) {
    return;
  }
  fontSizeControlsInitialized = true;

  // Add event listeners
  Object.keys(fontSizeInputs).forEach((key) => {
    const input = fontSizeInputs[key];
    if (input) {
      input.addEventListener("input", () => {
        updateRangeValue(input);
        saveFontSize(key, input.value);
        applyFontSizes();
      });
    }
  });
}

function updateRangeValue(input) {
  const valueSpan = input.parentElement.querySelector(".range-value");
  if (valueSpan) {
    valueSpan.textContent = input.value + "px";
  }
}

function loadFontSizes() {
  try {
    const raw = localStorage.getItem("homepageFontSizes");
    return raw ? JSON.parse(raw) : {
      base: 14,
      header: 26,
      button: 12,
      card: 13,
    };
  } catch (error) {
    return {
      base: 14,
      header: 26,
      button: 12,
      card: 13,
    };
  }
}

function saveFontSize(key, value) {
  const sizes = loadFontSizes();
  sizes[key] = parseInt(value, 10);
  localStorage.setItem("homepageFontSizes", JSON.stringify(sizes));
}

function applyFontSizes() {
  const sizes = loadFontSizes();
  const root = document.documentElement;

  // Apply CSS variables for font sizes
  root.style.setProperty("--font-size-base", sizes.base + "px");
  root.style.setProperty("--font-size-header", sizes.header + "px");
  root.style.setProperty("--font-size-button", sizes.button + "px");
  root.style.setProperty("--font-size-card", sizes.card + "px");

  // Apply to elements
  document.body.style.fontSize = sizes.base + "px";

  // Update hero header
  const heroHeader = document.querySelector(".hero h1");
  if (heroHeader) {
    heroHeader.style.fontSize = sizes.header + "px";
  }

  // Update buttons
  const buttons = document.querySelectorAll(".filter-btn, .layout-btn, .sort-btn, .theme-toggle, .help-btn");
  buttons.forEach((btn) => {
    btn.style.fontSize = sizes.button + "px";
  });

  // Update cards
  const cards = document.querySelectorAll(".card-title, .card-desc");
  cards.forEach((card) => {
    card.style.fontSize = sizes.card + "px";
  });
}

// Custom font input
function initCustomFontInput() {
  const customFontInput = document.getElementById("custom-font");
  const fontSelect = document.getElementById("font-select");
  const storedFont = readHomepageFontSetting();

  if (customFontInput) {
    const storedFamily =
      storedFont && typeof storedFont.family === "string"
        ? storedFont.family.trim()
        : "";
    const selectedValue = fontSelect ? String(fontSelect.value || "").trim() : "";
    customFontInput.value =
      storedFamily && selectedValue !== storedFamily ? storedFamily : "";
  }

  if (!customFontInput || customFontInputInitialized) {
    return;
  }
  customFontInputInitialized = true;

  customFontInput.addEventListener("change", () => {
    const font = customFontInput.value.trim();
    if (font) {
      saveFont(font);
      applyFont(font);
    }
  });
}

// Reset fonts
function resetFonts() {
  localStorage.removeItem("fontFamily");
  localStorage.removeItem("homepageFontSizes");

  // Reset inputs to defaults
  const baseInput = document.getElementById("base-font-size");
  const headerInput = document.getElementById("header-font-size");
  const buttonInput = document.getElementById("button-font-size");
  const cardInput = document.getElementById("card-font-size");
  const customFontInput = document.getElementById("custom-font");

  if (baseInput) {
    baseInput.value = 14;
    updateRangeValue(baseInput);
  }
  if (headerInput) {
    headerInput.value = 26;
    updateRangeValue(headerInput);
  }
  if (buttonInput) {
    buttonInput.value = 12;
    updateRangeValue(buttonInput);
  }
  if (cardInput) {
    cardInput.value = 13;
    updateRangeValue(cardInput);
  }
  if (customFontInput) {
    customFontInput.value = "";
  }

  // Reset to default font
  const defaultFont = "'Share Tech Mono', monospace";
  const fontSelect = document.getElementById("font-select");
  if (fontSelect) {
    fontSelect.value = defaultFont;
  }
  saveFont(defaultFont);
  applyFont(defaultFont);
  applyFontSizes();
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", () => {
    openSettings();
  });
}

if (settingsClose) {
  settingsClose.addEventListener("click", (event) => {
    if (isDataManagerSettingsEmbedMode() && window.parent !== window) {
      event.preventDefault();
      emitHomepageSettingsSnapshot();
      window.parent.postMessage({ type: "closeHomepageSettings" }, "*");
      return;
    }
    closeSettings();
  });
}

if (settingsPanel) {
  settingsPanel.addEventListener("click", (e) => {
    // Don't close if we're currently resizing
    if (settingsPanel.isResizing && settingsPanel.isResizing()) {
      return;
    }
    if (isDataManagerSettingsEmbedMode()) {
      return;
    }
    if (e.target === settingsPanel) {
      closeSettings();
    }
  });

}

if (resetColorsBtn) {
  resetColorsBtn.addEventListener("click", () => {
    localStorage.removeItem("customColors");
    applyColors();
    renderColorGrid();
  });
}

// Reset fonts button
const resetFontsBtn = document.getElementById("reset-fonts");
if (resetFontsBtn) {
  resetFontsBtn.addEventListener("click", resetFonts);
}

// Close settings with Escape key
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsPanel && !settingsPanel.hidden) {
    if (isDataManagerSettingsEmbedMode() && window.parent !== window) {
      emitHomepageSettingsSnapshot();
      window.parent.postMessage({ type: "closeHomepageSettings" }, "*");
      return;
    }
    closeSettings();
  }
});

// Apply saved font sizes on load
document.addEventListener("DOMContentLoaded", () => {
  applyFontSizes();
});

// ===== AGE VERIFICATION & WELCOME SCREEN =====

// Skip preferences storage
function loadSkipPreferences() {
  try {
    const raw = localStorage.getItem('skipPreferences');
    if (!raw) {
      return { skipAgeVerify: false, skipWelcome: false };
    }
    
    // Try to parse the JSON
    const prefs = JSON.parse(raw);
    
    // Validate the structure - if corrupted, reset to defaults
    if (typeof prefs !== 'object' || prefs === null || 
        typeof prefs.skipAgeVerify !== 'boolean' || 
        typeof prefs.skipWelcome !== 'boolean') {
      console.warn('Corrupted skipPreferences detected, resetting to defaults');
      saveSkipPreferences({ skipAgeVerify: false, skipWelcome: false });
      return { skipAgeVerify: false, skipWelcome: false };
    }
    
    return prefs;
  } catch (error) {
    // JSON parse failed - data is corrupted
    console.warn('Failed to parse skipPreferences, resetting to defaults:', error);
    localStorage.removeItem('skipPreferences');
    return { skipAgeVerify: false, skipWelcome: false };
  }
}

function saveSkipPreferences(prefs) {
  localStorage.setItem('skipPreferences', JSON.stringify(prefs));
}

function shouldSkipAgeVerify() {
  // Check if user clicked "Yes" in this session (persists through back button navigation)
  if (sessionStorage.getItem('ageVerified') === 'true') {
    return true;
  }
  // Otherwise, check the skip preference toggle
  return loadSkipPreferences().skipAgeVerify;
}

function shouldSkipWelcome() {
  return loadSkipPreferences().skipWelcome;
}

// Age Verification Screen (called from initStartupScreens for consistency)
function showAgeVerification() {
  showAgeVerificationForStartup();
}

// Welcome Screen
function showWelcomeScreen() {
  const overlay = document.getElementById('welcome-overlay');
  if (!overlay) return;
  
  overlay.hidden = false;
  
  // Handle OK button - saves to sessionStorage (like age verify)
  // This means welcome shows once per session, not permanently
  const okBtn = document.getElementById('welcome-ok');
  
  if (okBtn) {
    okBtn.onclick = () => {
      // Save welcome seen state in sessionStorage (persists until F5/tab close)
      sessionStorage.setItem('welcomeSeen', 'true');
      overlay.hidden = true;
    };
  }

  const welcomeKeyHandler = (event) => {
    if (overlay.hidden) {
      return;
    }
    const key = String(event.key || "").toLowerCase();
    if (key === "enter" || key === " " || key === "escape") {
      event.preventDefault();
      if (okBtn) {
        okBtn.click();
      } else {
        overlay.hidden = true;
      }
    }
  };
  document.addEventListener("keydown", welcomeKeyHandler);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target.hidden === true) {
        document.removeEventListener("keydown", welcomeKeyHandler);
        observer.disconnect();
      }
    });
  });
  observer.observe(overlay, { attributes: true, attributeFilter: ["hidden"] });
}

function shouldShowWelcome() {
  // Check if welcome was already shown in this session
  const welcomeSeen = sessionStorage.getItem('welcomeSeen') === 'true';
  // Only show if not already seen this session
  return !welcomeSeen;
}

// Initialize startup screens
function initStartupScreens() {
  // Show welcome screen once per session (like age verification)
  // Use sessionStorage so it shows again after F5
  
  if (shouldShowWelcome()) {
    // Wait for stories to load before showing welcome screen
    // This ensures Top Reports has data
    const checkAndShowWelcome = () => {
      if (stories && stories.length > 0) {
        // Stories are loaded, safe to show welcome screen
        showWelcomeScreen();
      } else {
        // Stories not loaded yet, wait a bit and try again
        setTimeout(checkAndShowWelcome, 50);
      }
    };
    checkAndShowWelcome();
  }
}

// Initialize settings panel toggles
function initInputSettings() {
  const skipAgeToggle = document.getElementById('skip-age-verify');
  const skipWelcomeToggle = document.getElementById('skip-welcome');
  const showProtectedToggle = document.getElementById('show-protected-posts');
  const autoSaveProtectedPasswordsToggle = document.getElementById('auto-save-protected-passwords');
  
  const prefs = loadSkipPreferences();
  const protectedSettings = getProtectedPostSettings();
  
  if (skipAgeToggle) {
    skipAgeToggle.checked = prefs.skipAgeVerify;
  }
  
  if (skipWelcomeToggle) {
    skipWelcomeToggle.checked = prefs.skipWelcome;
  }

  if (showProtectedToggle) {
    showProtectedToggle.checked = protectedSettings.showProtectedPosts === true;
  }

  if (autoSaveProtectedPasswordsToggle) {
    autoSaveProtectedPasswordsToggle.checked =
      protectedSettings.autoSavePasswords === true;
  }

  if (inputSettingsInitialized) {
    return;
  }
  inputSettingsInitialized = true;

  if (skipAgeToggle) {
    skipAgeToggle.addEventListener('change', () => {
      const newPrefs = loadSkipPreferences();
      newPrefs.skipAgeVerify = skipAgeToggle.checked;
      saveSkipPreferences(newPrefs);
    });
  }
  
  if (skipWelcomeToggle) {
    skipWelcomeToggle.addEventListener('change', () => {
      const newPrefs = loadSkipPreferences();
      newPrefs.skipWelcome = skipWelcomeToggle.checked;
      saveSkipPreferences(newPrefs);
    });
  }

  if (showProtectedToggle) {
    showProtectedToggle.addEventListener('change', () => {
      updateProtectedPostSettings({
        showProtectedPosts: showProtectedToggle.checked,
      });
      render();
    });
  }

  if (autoSaveProtectedPasswordsToggle) {
    autoSaveProtectedPasswordsToggle.addEventListener('change', () => {
      updateProtectedPostSettings({
        autoSavePasswords: autoSaveProtectedPasswordsToggle.checked,
      });
    });
  }
}

// ===== COMPREHENSIVE RESET DATA FUNCTIONALITY =====

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
    message: 'This will reset all colors, fonts, sizes, startup screens, and all per-report settings to default. This action cannot be undone.',
    isDanger: true
  }
};

let pendingResetAction = null;

// Show custom confirmation popup
function showConfirmPopup(action) {
  const config = resetConfig[action];
  if (!config) return;

  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const confirmOk = document.getElementById('confirm-ok');

  if (!confirmOverlay || !confirmTitle || !confirmMessage || !confirmOk) return;

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
  const confirmOverlay = document.getElementById('confirm-overlay');
  if (confirmOverlay) {
    confirmOverlay.hidden = true;
  }
  pendingResetAction = null;
}

// Execute reset action
function executeReset(action) {
  // Execute the reset
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
  
  // Show reboot screen and reload
  showRebootScreen(action);
}

// Reset functions
function resetPinAndFavorite() {
  // Remove all pins
  localStorage.removeItem('pinned');
  
  // Remove all favorites
  localStorage.removeItem('favorites');
}

function resetPinOnly() {
  // Remove all pins only
  localStorage.removeItem('pinned');
}

function resetFavoriteOnly() {
  // Remove all favorites only
  localStorage.removeItem('favorites');
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
  
  // Remove all pins
  localStorage.removeItem('pinned');
}

function resetAllSettings() {
  // Remove custom colors
  localStorage.removeItem('customColors');
  
  // Remove font settings
  localStorage.removeItem('fontFamily');
  localStorage.removeItem('homepageFontSizes');
  
  // Remove theme
  localStorage.removeItem('homepageTheme');
  
  // Remove keybinds
  localStorage.removeItem('homepageKeybinds');
  
  // Remove panel settings
  localStorage.removeItem('panelSettings');
  
  // Remove filter state
  localStorage.removeItem('homepageState');
  
  // Remove layout
  localStorage.removeItem('homepageLayout');
  
  // Remove viewer settings (synced)
  localStorage.removeItem('viewerSettings');
  localStorage.removeItem('viewerPanelSettings');
  
  // Remove skip preferences (age verify and welcome screen)
  localStorage.removeItem('skipPreferences');

  // Remove protected-post settings and remembered passwords
  localStorage.removeItem(PROTECTED_POST_SETTINGS_KEY);
  localStorage.removeItem(PROTECTED_LOCAL_PASSWORDS_KEY);
  sessionStorage.removeItem(PROTECTED_SESSION_PASSWORDS_KEY);
  sessionStorage.removeItem(PROTECTED_UNLOCK_TICKETS_KEY);
  protectedPostSettingsCache = null;
  clearProtectedStoryCaches();
  releaseProtectedCoverObjectUrls();
  closeProtectedUnlockModal();
  
  // Re-apply defaults
  applyColors();
  applyFont("'Share Tech Mono', monospace");
  applyTheme('dark');
  
  // Reset font size inputs
  const baseInput = document.getElementById("base-font-size");
  const headerInput = document.getElementById("header-font-size");
  const buttonInput = document.getElementById("button-font-size");
  const cardInput = document.getElementById("card-font-size");
  const customFontInput = document.getElementById("custom-font");
  const fontSelect = document.getElementById("font-select");

  if (baseInput) {
    baseInput.value = 14;
    updateRangeValue(baseInput);
  }
  if (headerInput) {
    headerInput.value = 26;
    updateRangeValue(headerInput);
  }
  if (buttonInput) {
    buttonInput.value = 12;
    updateRangeValue(buttonInput);
  }
  if (cardInput) {
    cardInput.value = 13;
    updateRangeValue(cardInput);
  }
  if (customFontInput) {
    customFontInput.value = "";
  }
  if (fontSelect) {
    fontSelect.value = "'Share Tech Mono', monospace";
  }
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

// ===== SYSTEM REBOOT SCREEN =====

function showRebootScreen(resetType) {
  // Hide scrollbar during reboot
  document.body.classList.add("no-scroll");
  
  // Create reboot overlay
  const rebootOverlay = document.createElement('div');
  rebootOverlay.id = 'reboot-overlay';
  rebootOverlay.className = 'reboot-overlay';
  
  const resetTitles = {
    'pin-favorite': 'Resetting Pins & Favorites',
    'pin': 'Resetting Pins',
    'favorite': 'Resetting Favorites',
    'reading': 'Resetting Reading Status',
    'settings': 'Resetting All Settings'
  };
  
  rebootOverlay.innerHTML = `
    <div class="reboot-content">
      <div class="reboot-icon">🔄</div>
      <div class="reboot-title">${resetTitles[resetType] || 'System Reset'}</div>
      <div class="reboot-subtitle">Please wait while the system restarts...</div>
      <div class="reboot-progress-container">
        <div class="reboot-progress-bar" id="reboot-progress-bar"></div>
      </div>
      <div class="reboot-status" id="reboot-status">Initializing...</div>
      <div class="reboot-binary" id="reboot-binary">0101010101010101</div>
    </div>
  `;
  
  document.body.appendChild(rebootOverlay);
  
  // Animate progress bar
  const progressBar = document.getElementById('reboot-progress-bar');
  const statusText = document.getElementById('reboot-status');
  const binaryText = document.getElementById('reboot-binary');
  
  const statusMessages = [
    'Clearing local storage...',
    'Resetting user preferences...',
    'Reinitializing system...',
    'Loading fresh state...',
    'Restarting interface...'
  ];
  
  let progress = 0;
  const totalDuration = 3000; // 3 seconds
  const updateInterval = 50; // Update every 50ms
  const increment = 100 / (totalDuration / updateInterval);
  
  const progressInterval = setInterval(() => {
    progress += increment;
    
    // Update progress bar
    if (progressBar) {
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }
    
    // Update status message based on progress
    const messageIndex = Math.floor((progress / 100) * statusMessages.length);
    if (statusText && messageIndex < statusMessages.length) {
      statusText.textContent = statusMessages[messageIndex];
    }
    
    // Update binary text randomly
    if (binaryText && Math.random() > 0.3) {
      binaryText.textContent = Array(16).fill(0).map(() => Math.random() > 0.5 ? '1' : '0').join('');
    }
    
    if (progress >= 100) {
      clearInterval(progressInterval);
      
      // Final status
      if (statusText) {
        statusText.textContent = 'System ready. Reloading...';
      }
      
      // Reload the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, updateInterval);
}

// Initialize reset buttons and confirmation popup
document.addEventListener('DOMContentLoaded', () => {
  // Reset buttons
  const resetButtons = document.querySelectorAll('.reset-btn');
  resetButtons.forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.reset;
      showConfirmPopup(action);
    });
  });

  // Confirmation popup event listeners
  const confirmCancel = document.getElementById('confirm-cancel');
  const confirmOk = document.getElementById('confirm-ok');
  const confirmOverlay = document.getElementById('confirm-overlay');

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
});

// Function to save current color values as new defaults
// Call this once to update DEFAULT_COLORS with current custom colors
function saveCurrentColorsAsDefaults() {
  const customColors = loadSettings();
  const newDefaults = { ...DEFAULT_COLORS };

  // Merge custom colors into defaults for both themes
  if (customColors.dark) {
    Object.keys(customColors.dark).forEach((key) => {
      if (customColors.dark[key]) {
        newDefaults.dark[key] = customColors.dark[key];
      }
    });
  }
  if (customColors.light) {
    Object.keys(customColors.light).forEach((key) => {
      if (customColors.light[key]) {
        newDefaults.light[key] = customColors.light[key];
      }
    });
  }

  // Log the new defaults so they can be copied to update DEFAULT_COLORS
  console.log("New DEFAULT_COLORS:", JSON.stringify(newDefaults, null, 2));

  // Also save to a special key in localStorage for reference
  localStorage.setItem("savedDefaults", JSON.stringify(newDefaults));

  return newDefaults;
}

// Auto-save current colors as defaults on first load (only this time)
(function autoSaveDefaultsOnce() {
  const hasSavedDefaults = localStorage.getItem("defaultsSavedOnce");
  if (!hasSavedDefaults) {
    const customColors = loadSettings();
    const hasCustomColors =
      Object.keys(customColors.dark || {}).length > 0 ||
      Object.keys(customColors.light || {}).length > 0;

    if (hasCustomColors) {
      saveCurrentColorsAsDefaults();
      localStorage.setItem("defaultsSavedOnce", "true");
      console.log("Current colors saved as defaults (one-time operation)");
    }
  }
})();

// Keyboard nav, settings nav, help nav, keybind manager extracted to homepage-keyboard.js

// ===== MAIN INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize all systems
  KeyboardNavigation.init();
  SettingsPanelKeyboardNav.init();
  HelpModalKeyboardNav.init();
  
  // Initialize database system FIRST (needed for keybinds)
  await initDatabase();
  
  // Now initialize keybinds (database is ready)
  KeybindManager.init();
  
  // Update blackout resume text with current keybind
  updateBlackoutResumeText();
  
  // Initialize import/export functionality
  setupImportExport();

  // Handle search input focus for keyboard shortcuts
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      if (KeyboardNavigation) {
        KeyboardNavigation.isSearchFocused = true;
        KeyboardNavigation.showModeIndicator('⌨️ Search Mode - ESC to exit');
      }
    });
    searchInput.addEventListener('blur', () => {
      if (KeyboardNavigation) {
        KeyboardNavigation.isSearchFocused = false;
      }
    });
  }
  
  // Initialize secret stats
  SecretStats.init();
});

function exportLocalStorageData() {
  const exportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    type: 'xedryk-archive-backup',
    data: getAllLocalStorageData()
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `xedryk-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  return true;
}

// Import localStorage data from a JSON string
function importLocalStorageData(jsonString) {
  try {
    const importData = JSON.parse(jsonString);
    
    // Validate backup format
    if (!importData.type || importData.type !== 'xedryk-archive-backup') {
      throw new Error('Invalid backup file format');
    }
    
    if (!importData.data || typeof importData.data !== 'object') {
      throw new Error('Invalid backup data structure');
    }
    
    // Clear existing localStorage
    localStorage.clear();
    
    // Import all data
    const data = importData.data;
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        if (typeof value === 'object') {
          localStorage.setItem(key, JSON.stringify(value));
        } else {
          localStorage.setItem(key, String(value));
        }
      }
    }
    
    return { success: true, message: 'Import successful! Reloading...' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Setup export/import buttons (using existing HTML IDs)
function setupImportExport() {
  const exportBtn = document.getElementById('db-export-btn');
  const importInput = document.getElementById('db-import-input');
  const statusEl = document.getElementById('db-import-status');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportLocalStorageData();
      if (statusEl) {
        statusEl.textContent = '✅ Exported successfully!';
        statusEl.style.color = 'var(--accent-2)';
        setTimeout(() => { statusEl.textContent = ''; }, 3000);
      }
    });
  }
  
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importLocalStorageData(event.target.result);
        if (result.success) {
          if (statusEl) {
            statusEl.textContent = '✅ ' + result.message;
            statusEl.style.color = 'var(--accent-2)';
          }
          // Reload after short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          if (statusEl) {
            statusEl.textContent = '❌ ' + result.message;
            statusEl.style.color = '#ff6b6b';
          }
        }
        // Reset input
        importInput.value = '';
      };
      reader.onerror = () => {
        if (statusEl) {
          statusEl.textContent = '❌ Error reading file';
          statusEl.style.color = '#ff6b6b';
        }
        importInput.value = '';
      };
      reader.readAsText(file);
    });
  }
}

// Initialize export/import when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupImportExport();
});
