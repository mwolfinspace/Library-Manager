const KEY_PROFILES = {
  default: {
    prev: ["arrowleft"],
    next: ["arrowright"],
    scrollUp: ["arrowup"],
    scrollDown: ["arrowdown"],
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
  },
  left: {
    prev: ["a"],
    next: ["d"],
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
  },
};

const DEFAULT_SETTINGS = {
  theme: "dark",
  fontSize: 16,
  lineSpacing: 1.6,
  scrollStep: 40,
  zoomStep: 0.1,
  keyboardMode: "default",
  panKeys: true,
  rememberZoom: true,
  fontFamily: "tech",
  customFont: "",
  customBindings: {},
  rememberViewAll: false,
};

document.addEventListener("DOMContentLoaded", () => {
  const els = {
    photo: document.getElementById("photo"),
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
    fullscreenBtn: document.getElementById("fullscreen-btn"),
    fontUpBtn: document.getElementById("font-up-btn"),
    fontDownBtn: document.getElementById("font-down-btn"),
    prevStoryBtn: document.getElementById("prev-story-btn"),
    nextStoryBtn: document.getElementById("next-story-btn"),
    settingsOverlay: document.getElementById("settings-overlay"),
    closeSettings: document.getElementById("close-settings"),
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
    shortcutList: document.getElementById("shortcut-list"),
    keybindList: document.getElementById("keybind-list"),
    backLink: document.getElementById("back-link"),
    storyPanel: document.querySelector(".story-panel"),
    blackout: document.getElementById("blackout"),
    codeField: document.querySelector(".code-field"),
    hudMarks: Array.from(document.querySelectorAll(".hud-mark")),
    eyebrow: document.querySelector(".eyebrow"),
  };

  if (!els.photo || !els.storyContent) {
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
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let settings = { ...DEFAULT_SETTINGS };
  let catalog = [];
  let storyIndex = -1;
  let bindingTarget = null;
  let codeRefreshTimer = null;
  let cursorRaf = null;
  let cursorX = 0.5;
  let cursorY = 0.45;

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

  function resolvePath(path) {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/")) {
      return path;
    }
    return `../${path}`;
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
    els.photo.src = "";
    els.imageCounter.textContent = "0 / 0";
  }

  function applySettings() {
    document.body.dataset.theme = settings.theme;
    const fontChoice =
      (settings.customFont || "").trim() ||
      (window.FONTS.find((f) => f.name === settings.fontFamily) || {}).family ||
      "monospace";
    if (els.storyPanel) {
      els.storyPanel.style.fontFamily = fontChoice;
    } else {
      els.storyContent.style.fontFamily = fontChoice;
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
          els.fontFamily.appendChild(option);
        });
      }
      els.fontFamily.value = settings.fontFamily || "tech";
    }
    if (els.customFont) els.customFont.value = settings.customFont || "";
    if (els.fontSize) els.fontSize.value = settings.fontSize;
    if (els.lineSpacing) els.lineSpacing.value = settings.lineSpacing;
    if (els.scrollStep) els.scrollStep.value = settings.scrollStep;
    if (els.zoomStep) els.zoomStep.value = settings.zoomStep;
    if (els.keyboardMode) els.keyboardMode.value = settings.keyboardMode;
    if (els.panKeys) els.panKeys.checked = settings.panKeys;
    if (els.rememberZoom) els.rememberZoom.checked = settings.rememberZoom;
    if (els.rememberViewAll)
      els.rememberViewAll.checked = settings.rememberViewAll;

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

  function saveSettings() {
    localStorage.setItem("viewerSettings", JSON.stringify(settings));
  }

  async function loadDefaultSettings() {
    if (window.VIEWER_SETTINGS) {
      settings = { ...settings, ...window.VIEWER_SETTINGS };
      return;
    }
    try {
      const response = await fetch("../database/settings.json", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Settings not found");
      }
      const data = await response.json();
      settings = { ...settings, ...data };
    } catch (error) {
      // fallback to window
    }
  }

  function getStoryId() {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get("story");
    return paramId ? paramId.trim() : null;
  }

  function setupBackLink() {
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (!from || !els.backLink) {
      return;
    }
    const safe = from.replace(/[^a-zA-Z0-9._-]/g, "");
    els.backLink.href =
      safe.startsWith("http") || safe.startsWith("/") ? safe : `../${safe}`;
    els.backLink.hidden = false;
  }

  function getStorageKey(key, options = {}) {
    if (options.global && settings.rememberViewAll) {
      return `${key}:global`;
    }
    return storyId ? `${key}:${storyId}` : key;
  }

  async function loadCatalog() {
    if (Array.isArray(window.REPORT_CATALOG)) {
      return window.REPORT_CATALOG;
    }
    try {
      const response = await fetch("../database/catalog.json", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Catalog not found.");
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      const catalogCache = Array.isArray(window.REPORT_CATALOG)
        ? window.REPORT_CATALOG
        : [];
      if (catalogCache.length === 0) {
        return list;
      }
      const cacheMap = new Map(
        catalogCache.map((item) => [item.id, item.storyText]),
      );
      return list.map((entry) => {
        const cachedText = cacheMap.get(entry.id);
        return cachedText ? { ...entry, storyText: cachedText } : entry;
      });
    } catch (error) {
      throw error;
    }
  }

  async function loadStoryMarkdown(path, entry) {
    if (entry && entry.storyText) {
      return entry.storyText;
    }
    if (entry && !entry.storyText && Array.isArray(window.REPORT_CATALOG)) {
      const cached = window.REPORT_CATALOG.find((item) => item.id === entry.id);
      if (cached && cached.storyText) {
        return cached.storyText;
      }
    }
    if (!path) {
      throw new Error("Story file missing.");
    }
    const resolved = resolvePath(path);
    try {
      const response = await fetch(resolved, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Story file missing.");
      }
      return response.text();
    } catch (error) {
      if (window.location.protocol === "file:") {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", resolved, true);
          xhr.onload = () => {
            const ok =
              (xhr.status >= 200 && xhr.status < 300) ||
              (xhr.status === 0 && xhr.responseText);
            if (ok) {
              resolve(xhr.responseText);
            } else {
              reject(new Error("Story file missing."));
            }
          };
          xhr.onerror = () => reject(new Error("Story file missing."));
          xhr.send();
        });
      }
      throw error;
    }
  }

  function applyStoryEntry(entry) {
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
        tagLink.href = `../homepage.html?tag=${encodeURIComponent(tag)}`;
        tagsWrapper.appendChild(tagLink);
      });
      els.storyMeta.appendChild(tagsWrapper);
    }

    photos = Array.isArray(entry.images)
      ? sortPhotos(entry.images).map(resolvePath)
      : [];
    failedLoads = 0;
    currentPhotoIndex = normalizePhotoIndex(currentPhotoIndex, photos.length);
    if (photos.length > 0) {
      updatePhoto();
    }
  }

  function updatePhoto() {
    if (photos.length === 0) {
      els.photo.src = "";
      els.imageCounter.textContent = "0 / 0";
      els.imageFallback.hidden = false;
      return;
    }

    if (currentPhotoIndex >= photos.length) {
      currentPhotoIndex = 0;
    }

    els.imageFallback.hidden = true;
    els.photo.src = photos[currentPhotoIndex];
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

  function updateTransform() {
    els.photo.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
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

  function updateFavoriteButton() {
    const favorites = loadFavorites();
    if (storyId && favorites.has(storyId)) {
      els.favoriteBtn.textContent = "★";
      els.favoriteBtn.classList.add("active");
    } else {
      els.favoriteBtn.textContent = "☆";
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
    const bookmark = getBookmark();
    if (bookmark) {
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

  function updateFullscreenButton() {
    if (!els.fullscreenBtn) return;
    const active = !!document.fullscreenElement;
    els.fullscreenBtn.textContent = active ? "🡽" : "⛶";
    els.fullscreenBtn.title = active ? "Exit fullscreen" : "Fullscreen";
  }

  function setStoryNavState() {
    if (!els.prevStoryBtn || !els.nextStoryBtn) return;
    const hasPrev = storyIndex > 0;
    const hasNext = storyIndex >= 0 && storyIndex < catalog.length - 1;
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
    if (!catalog.length || index < 0 || index >= catalog.length) {
      return;
    }
    saveScrollPosition();
    saveZoomState();
    localStorage.setItem(getStorageKey("currentPhotoIndex"), currentPhotoIndex);
    window.location.href = buildStoryUrl(catalog[index].id);
  }

  function toggleBookmark() {
    if (!storyId) {
      return;
    }
    if (getBookmark()) {
      localStorage.removeItem(`bookmark:${storyId}`);
    } else {
      const payload = {
        photoIndex: currentPhotoIndex,
        scrollPosition: els.storyContent.scrollTop,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(`bookmark:${storyId}`, JSON.stringify(payload));
    }
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

  function showSettings() {
    els.settingsOverlay.hidden = false;
    setActiveTab("appearance");
  }

  function hideSettings() {
    els.settingsOverlay.hidden = true;
  }

  function renderShortcutList() {
    const profile = KEY_PROFILES[settings.keyboardMode] || KEY_PROFILES.default;
    const list = (keys) => keys.map(prettyKeyLabel).join(", ");
    const lines = [
      "Pan Image: W A S D / Arrow keys",
      "Scroll Story: Shift + W/S or Shift + ↑/↓",
      `Zoom: ${list(profile.zoomOut)} / ${list(profile.zoomIn)}`,
      `Fit: ${list(profile.fit)}`,
      `Font: ${list(profile.fontDown)} / ${list(profile.fontUp)}`,
      `Line: ${list(profile.lineDown)} / ${list(profile.lineUp)}`,
      `Favorite: ${list(profile.favorite)}`,
      `Bookmark: ${list(profile.bookmark)}`,
      `Theme: ${list(profile.toggleTheme)}`,
      `Settings: ${list(profile.toggleSettings)}`,
      `Blackout: ${list(profile.blackout)}`,
      `View Memory: ${settings.rememberViewAll ? "Global" : "Per Story"}`,
    ];

    els.shortcutList.innerHTML = `<strong>Shortcuts</strong><br>${lines.join("<br>")}`;
  }

  function isEditableTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
  }

  function normalizeKey(key) {
    if (key === " ") {
      return "space";
    }
    return key.toLowerCase();
  }

  function getCustomBinding(action) {
    return settings.customBindings && settings.customBindings[action]
      ? settings.customBindings[action]
      : null;
  }

  function keyMatches(list, key, action) {
    const normalized = normalizeKey(key);
    const custom = action ? getCustomBinding(action) : null;
    if (custom) {
      return custom === normalized;
    }
    return list.includes(normalized);
  }

  function prettyKeyLabel(key) {
    const map = {
      arrowup: "↑",
      arrowdown: "↓",
      arrowleft: "←",
      arrowright: "→",
      space: "Space",
      escape: "Esc",
    };
    return map[key] || key;
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
    const rows = [
      { action: "prev", label: "Prev image", keys: profile.prev },
      { action: "next", label: "Next image", keys: profile.next },
      { action: "zoomOut", label: "Zoom out", keys: profile.zoomOut },
      { action: "zoomIn", label: "Zoom in", keys: profile.zoomIn },
      { action: "fit", label: "Fit view", keys: profile.fit },
      { action: "favorite", label: "Favorite", keys: profile.favorite },
      { action: "bookmark", label: "Bookmark", keys: profile.bookmark },
      {
        action: "toggleTheme",
        label: "Toggle theme",
        keys: profile.toggleTheme,
      },
      {
        action: "toggleSettings",
        label: "Toggle settings",
        keys: profile.toggleSettings,
      },
      { action: "blackout", label: "Blackout screen", keys: profile.blackout },
    ];

    const content = rows
      .map((row) => {
        const currentKey = formatBinding(row.action, row.keys) || "—";
        const active = bindingTarget === row.action;
        const activeLabel = active ? " (press key)" : "";
        return `
                <div class="keybind-row${active ? " active" : ""}" data-action="${row.action}">
                    <span>${row.label}</span>
                    <span class="keybind-key">${currentKey}${activeLabel}</span>
                    <button type="button" data-bind="${row.action}">Assign</button>
                </div>
            `;
      })
      .join("");

    els.keybindList.innerHTML = `<strong>Key Bindings</strong><div style="opacity:0.8;margin-bottom:6px;">Click Assign then press a key. Backspace to clear.</div>${content}`;

    els.keybindList.querySelectorAll("button[data-bind]").forEach((button) => {
      button.addEventListener("click", () => {
        bindingTarget = button.dataset.bind;
        renderKeybindList();
      });
    });
  }

  function handleKeydown(event) {
    if (els.settingsOverlay && !els.settingsOverlay.hidden) {
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
        return;
      }

      if (event.key === "Escape") {
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

    if (
      settings.panKeys &&
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ].includes(key)
    ) {
      event.preventDefault();
      const panStep = 24;
      if (key === "w" || key === "arrowup") {
        translateY -= panStep;
      } else if (key === "s" || key === "arrowdown") {
        translateY += panStep;
      } else if (key === "a" || key === "arrowleft") {
        translateX -= panStep;
      } else if (key === "d" || key === "arrowright") {
        translateX += panStep;
      }
      updateTransform();
      saveZoomState();
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

  els.photo.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    isDragging = true;
    els.photo.classList.add("dragging");
    startX = event.pageX - translateX;
    startY = event.pageY - translateY;
  });

  window.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      els.photo.classList.remove("dragging");
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
      if (
        (els.storyPanel && els.storyPanel.contains(event.target)) ||
        (els.settingsOverlay && !els.settingsOverlay.hidden)
      ) {
        return;
      }

      event.preventDefault();

      const rect = els.photo.getBoundingClientRect();
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

  els.photo.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  els.storyContent.addEventListener("scroll", saveScrollPosition);

  els.favoriteBtn.addEventListener("click", toggleFavorite);
  els.bookmarkBtn.addEventListener("click", toggleBookmark);
  els.settingsBtn.addEventListener("click", showSettings);
  els.closeSettings.addEventListener("click", hideSettings);
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
      applySettings();
      saveSettings();
    });
  }

  if (els.fullscreenBtn) {
    els.fullscreenBtn.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await document.documentElement.requestFullscreen();
        }
      } catch (error) {
        // ignore
      }
      updateFullscreenButton();
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
    els.prevStoryBtn.addEventListener("click", () => goToStory(storyIndex - 1));
  }

  if (els.nextStoryBtn) {
    els.nextStoryBtn.addEventListener("click", () => goToStory(storyIndex + 1));
  }

  els.settingsOverlay.addEventListener("click", (event) => {
    if (event.target === els.settingsOverlay) {
      hideSettings();
    }
  });

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

  els.scrollStep.addEventListener("change", () => {
    settings.scrollStep = parseInt(els.scrollStep.value, 10);
    saveSettings();
  });

  els.zoomStep.addEventListener("change", () => {
    settings.zoomStep = parseFloat(els.zoomStep.value);
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

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("fullscreenchange", updateFullscreenButton);
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

  els.photo.onload = () => {
    failedLoads = 0;
    els.imageFallback.hidden = true;
    localStorage.setItem(getStorageKey("currentPhotoIndex"), currentPhotoIndex);
  };

  els.photo.onerror = () => {
    if (photos.length > 0) {
      failedLoads += 1;
      if (failedLoads >= photos.length) {
        showCorrupted("Images missing.");
        return;
      }
      currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
      els.imageFallback.hidden = false;
      updatePhoto();
    } else {
      els.imageFallback.hidden = false;
    }
  };

  async function initialize() {
    storyId = getStoryId();
    setupBackLink();
    currentPhotoIndex = normalizePhotoIndex(
      parseInt(localStorage.getItem(getStorageKey("currentPhotoIndex")), 10),
      9999,
    );

    await loadDefaultSettings();
    const storedSettings = loadSettingsFromStorage();
    if (storedSettings) {
      settings = { ...settings, ...storedSettings };
    }
    if (!settings.fontFamily) {
      settings.fontFamily = "tech";
    }
    if (!settings.customBindings) {
      settings.customBindings = {};
    }
    if (typeof settings.rememberViewAll !== "boolean") {
      settings.rememberViewAll = false;
    }
    applySettings();
    buildCodeField();
    refreshHudMarks();

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

      applyStoryEntry(storyEntry);

      if (!storyEntry.story && !storyEntry.storyText) {
        showCorrupted("Story file missing.");
        return;
      }

      try {
        const markdown = await loadStoryMarkdown(storyEntry.story, storyEntry);
        els.storyContent.innerHTML = marked(markdown);
      } catch (error) {
        showCorrupted("Story file missing.");
        return;
      }
    } catch (error) {
      showCorrupted("Catalog missing.");
      return;
    }

    restoreScrollPosition();
    updateFavoriteButton();
    updateBookmarkButton();
    setStoryNavState();
    updateFullscreenButton();
    updateRecentViewTimestamp(); // Update timestamp for recent sorting
  }

  initialize();
});

function marked(text) {
  let output = text;
  output = output.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  output = output.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  output = output.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  output = output.replace(/\*\*(.*)\*\*/gim, "<b>$1</b>");
  output = output.replace(/\*(.*)\*/gim, "<i>$1</i>");
  output = output.replace(/`(.*?)`/gim, "<code>$1</code>");
  output = output.replace(/\n$/gim, "<br>");
  return output;
}
