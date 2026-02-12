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
    goToGallery: ["2", "/"],
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
    shortcutList: document.getElementById("shortcut-list"),
    keybindList: document.getElementById("keybind-list"),
    backLink: document.getElementById("back-link"),
    storyPanel: document.querySelector(".story-panel"),
    storyHeader: document.querySelector(".story-header"),
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
  let filteredStorySequence = [];
  let filteredStoryIndex = -1;
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

  function saveSettings() {
    // Save to localStorage for immediate access
    localStorage.setItem("viewerSettings", JSON.stringify(settings));
    
    // Also attempt to save to database for persistence across sessions
    saveSettingsToDatabase();
  }

  async function saveSettingsToDatabase() {
    try {
      // Create a settings object to save (exclude transient data)
      const settingsToSave = {
        theme: settings.theme,
        fontSize: settings.fontSize,
        lineSpacing: settings.lineSpacing,
        scrollStep: settings.scrollStep,
        zoomStep: settings.zoomStep,
        keyboardMode: settings.keyboardMode,
        panKeys: settings.panKeys,
        rememberZoom: settings.rememberZoom,
        fontFamily: settings.fontFamily,
        customFont: settings.customFont,
        customBindings: settings.customBindings,
        rememberViewAll: settings.rememberViewAll,
      };

      // Try to save via API endpoint if available
      const response = await fetch("../api/save-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsToSave),
      });

      if (!response.ok) {
        // API not available, settings remain in localStorage only
        console.log("Settings saved to localStorage (API not available)");
      }
    } catch (error) {
      // API not available, localStorage is the fallback
      console.log("Settings saved to localStorage");
    }
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
    const params = new URLSearchParams(window.location.search);
    const from = params.get("from");
    if (!from || !els.backLink) {
      return;
    }
    const safe = from.replace(/[^a-zA-Z0-9._-]/g, "");
    // Add from=viewer parameter when returning to homepage so it knows to restore state
    const backUrl =
      safe.startsWith("http") || safe.startsWith("/") ? safe : `../${safe}`;
    const separator = backUrl.includes("?") ? "&" : "?";
    els.backLink.href = `${backUrl}${separator}from=viewer`;
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
  // --- Feature: Collapse Panel ---
  if (els.storyHeader) {
    els.storyHeader.addEventListener("click", (e) => {
      // Prevent collapse if user clicks tags/buttons inside header
      if (e.target.closest("button") || e.target.closest("a")) return;

      els.storyPanel.classList.toggle("collapsed");
    });
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
      const keyDisplay = blackoutKey === 'space' ? 'spacebar' : blackoutKey.toUpperCase();
      resumeKeyEl.textContent = keyDisplay;
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
    els.settingsPanel.hidden = false;
    setActiveTab("appearance");
    // Initialize dragging if not already done
    if (!els.settingsPanel.dataset.draggingInitialized) {
      initPanelDragging();
      els.settingsPanel.dataset.draggingInitialized = "true";
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

    // All bindings sorted by category but rendered as tag-like pills
    const allBindings = [
      // Image Navigation
      { action: "prev", label: "Previous image", keys: profile.prev, category: "nav" },
      { action: "next", label: "Next image", keys: profile.next, category: "nav" },
      // Pan Image
      { action: "panUp", label: "Pan image up", keys: ["w", "arrowup"], category: "pan" },
      { action: "panDown", label: "Pan image down", keys: ["s", "arrowdown"], category: "pan" },
      { action: "panLeft", label: "Pan image left", keys: ["a", "arrowleft"], category: "pan" },
      { action: "panRight", label: "Pan image right", keys: ["d", "arrowright"], category: "pan" },
      // Story Navigation
      { action: "prevStory", label: "Previous story", keys: ["ctrl+arrowleft", "pageup"], category: "story" },
      { action: "nextStory", label: "Next story", keys: ["ctrl+arrowright", "pagedown"], category: "story" },
      { action: "scrollUp", label: "Scroll story up", keys: profile.scrollUp, category: "story" },
      { action: "scrollDown", label: "Scroll story down", keys: profile.scrollDown, category: "story" },
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

    let content = '<div class="keybind-tags-container">';

    allBindings.forEach((binding) => {
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

    els.keybindList.innerHTML = `<div class="keybind-instructions">Click <strong>Assign</strong> then press a key. <strong>Backspace</strong> to clear. <strong>Esc</strong> to cancel.</div>${content}`;

    els.keybindList.querySelectorAll("button[data-bind]").forEach((button) => {
      button.addEventListener("click", () => {
        bindingTarget = button.dataset.bind;
        renderKeybindList();
      });
    });
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
      // Navigate back to gallery/homepage
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      if (from) {
        const safe = from.replace(/[^a-zA-Z0-9._-]/g, "");
        const backUrl = safe.startsWith("http") || safe.startsWith("/") ? safe : `../${safe}`;
        const separator = backUrl.includes("?") ? "&" : "?";
        window.location.href = `${backUrl}${separator}from=viewer`;
      } else {
        window.location.href = "../homepage.html?from=viewer";
      }
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

    // Check for customizable pan keys (only if Ctrl is NOT pressed)
    if (settings.panKeys && !event.ctrlKey) {
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
    
    // Sync theme with homepage (viewer follows homepage theme)
    syncThemeWithHomepage();
    
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

      applyStoryEntry(storyEntry);

      if (!storyEntry.story && !storyEntry.storyText) {
        showCorrupted("Story file missing.");
        return;
      }

      try {
        const markdown = await loadStoryMarkdown(storyEntry.story, storyEntry);
        els.storyContent.innerHTML = `<div class="story-inner">${marked(markdown)}</div>`;
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
    // Remove all bookmarks (pins) but keep timestamps
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('bookmark:')) {
        // Keep the key but remove pin status, preserve timestamp
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Only remove if it has photoIndex (meaning it's a real bookmark, not just timestamp)
            if (parsed.photoIndex !== undefined) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    });
    
    // Remove all favorites
    localStorage.removeItem('favorites');
    
    // Update UI
    updateBookmarkButton();
    updateFavoriteButton();
  }

  function resetPinOnly() {
    // Remove all bookmarks (pins) only
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('bookmark:')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            // Only remove if it has photoIndex (meaning it's a real bookmark)
            if (parsed.photoIndex !== undefined) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    });
    
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
