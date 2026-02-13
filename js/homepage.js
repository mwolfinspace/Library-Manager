
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
const colorGrid = document.getElementById("color-grid");
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
const DEFAULT_COLORS = {
  dark: {
    ink: "#e8f1ff",
    muted: "rgba(232, 241, 255, 0.68)",
    bg: "#03050b",
    "bg-2": "#0a1220",
    panel: "rgba(12, 20, 34, 0.92)",
    accent: "#62f7ff",
    "accent-2": "#8dff7b",
    card: "rgba(12, 20, 34, 0.88)",
    shadow: "rgba(2, 6, 12, 0.75)",
    grid: "rgba(98, 247, 255, 0.12)",
    code: "rgba(98, 247, 200, 0.32)",
    "code-glow": "rgba(98, 247, 200, 0.7)",
    btn: "rgba(10, 16, 28, 0.86)",
    "btn-border": "rgba(98, 247, 255, 0.35)",
    "card-overlay":
      "linear-gradient(180deg, rgba(3, 5, 10, 0.08) 0%, rgba(3, 5, 10, 0.9) 100%)",
    "card-overlay-list":
      "linear-gradient(90deg, rgba(5, 7, 13, 0.88) 0%, rgba(5, 7, 13, 0.5) 55%, rgba(5, 7, 13, 0.12) 100%)",
    "cursor-glow": "rgba(98, 247, 255, 0.2)",
    "tag-bg": "rgba(98, 247, 255, 0.15)",
    "tag-bg-hover": "rgba(98, 247, 255, 0.3)",
  },
  light: {
    ink: "#0b1220",
    muted: "rgba(11, 18, 32, 0.65)",
    bg: "#eef3f9",
    "bg-2": "#f8fbff",
    panel: "rgba(255, 255, 255, 0.88)",
    accent: "#0aa6c7",
    "accent-2": "#3b5bff",
    card: "rgba(255, 255, 255, 0.92)",
    shadow: "rgba(12, 22, 38, 0.2)",
    grid: "rgba(10, 166, 199, 0.15)",
    code: "rgba(10, 166, 199, 0.24)",
    "code-glow": "rgba(59, 91, 255, 0.45)",
    btn: "rgba(255, 255, 255, 0.9)",
    "btn-border": "rgba(11, 18, 32, 0.2)",
    "card-overlay":
      "linear-gradient(180deg, rgba(239, 243, 249, 0.1) 0%, rgba(239, 243, 249, 0.4) 100%)",
    "card-overlay-list":
      "linear-gradient(90deg, rgba(238, 243, 249, 0.5) 0%, rgba(238, 243, 249, 0.25) 55%, rgba(238, 243, 249, 0.05) 100%)",
    "cursor-glow": "rgba(59, 91, 255, 0.18)",
    "tag-bg": "rgba(10, 166, 199, 0.15)",
    "tag-bg-hover": "rgba(10, 166, 199, 0.25)",
  },
};

const COLOR_DESCRIPTIONS = {
  ink: { desc: "Text color", icon: "A" },
  muted: { desc: "Muted text", icon: "a" },
  bg: { desc: "Main background", icon: "bg" },
  "bg-2": { desc: "Secondary bg", icon: "2bg" },
  panel: { desc: "Panel bg", icon: "p" },
  accent: { desc: "Primary accent", icon: "ac1" },
  "accent-2": { desc: "Secondary accent", icon: "ac2" },
  card: { desc: "Card background", icon: "c" },
  shadow: { desc: "Shadow color", icon: "shd" },
  grid: { desc: "Grid pattern", icon: "gr" },
  code: { desc: "Code color", icon: "cd" },
  "code-glow": { desc: "Code glow", icon: "cg" },
  btn: { desc: "Button bg", icon: "btn" },
  "btn-border": { desc: "Button border", icon: "bb" },
  "card-overlay": { desc: "Card overlay gradient", icon: "co" },
  "card-overlay-list": { desc: "Card overlay list gradient", icon: "cl" },
  "cursor-glow": { desc: "Cursor glow", icon: "cg2" },
  "tag-bg": { desc: "Tag background", icon: "tg" },
  "tag-bg-hover": { desc: "Tag hover background", icon: "tgh" },
};

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
      fontSelect.value = currentFont;
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

function applyColors() {
  const currentTheme = document.body.dataset.theme || "dark";
  const target = document.body;

  Object.keys(DEFAULT_COLORS.dark).forEach((colorName) => {
    const value = getColor(colorName, currentTheme);
    target.style.setProperty(`--${colorName}`, value);
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
    return window.REPORT_CATALOG;
  }
  try {
    const response = await fetch("database/catalog.json", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Catalog not found");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
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
  return list.filter((story) => {
    if (!matchesSearch(story, query)) {
      return false;
    }

    if (activeFilter === "favorites") {
      return favorites.has(story.id);
    }

    if (activeFilter === "bookmarks") {
      return isPinned(story.id);
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

function applyTheme(theme) {
  if (!themeToggle) {
    return;
  }
  document.body.dataset.theme = theme;
  const isLight = theme === "light";
  themeToggle.textContent = isLight ? "🌙" : "☀️";
  themeToggle.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  themeToggle.setAttribute("aria-pressed", String(isLight));
  localStorage.setItem("homepageTheme", theme);
  applyColors(); // Reapply colors when theme changes
}

function initTheme() {
  const stored = localStorage.getItem("homepageTheme");
  if (stored) {
    applyTheme(stored);
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
    const keyDisplay = blackoutKey === ' ' ? 'spacebar' : blackoutKey.toUpperCase();
    resumeKeyEl.textContent = keyDisplay;
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

function render() {
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

  finalStories.forEach((story, index) => {
    const card = document.createElement("a");
    card.className = "story-card";
    card.href = `view/viewer.html?story=${story.id}&from=homepage.html`;

    if (story.cover) {
      card.style.backgroundImage = `url('${story.cover}')`;
    }

    if (story.coverPosition) {
      card.style.backgroundPosition = story.coverPosition;
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
      render();
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
      render();
    });

    const content = document.createElement("div");
    content.className = "card-content";

    // Show "New" badge for stories that haven't been opened yet (no bookmark)
    const bookmark = getBookmark(story.id);
    if (!bookmark) {
      const badge = document.createElement("div");
      badge.className = "badge new-badge";
      badge.textContent = "New";
      badge.addEventListener("click", createRipple);
      content.appendChild(badge);
    }

    const title = document.createElement("h2");
    title.className = "card-title";
    title.textContent = storyTitle(story, index);

    const desc = document.createElement("p");
    desc.className = "card-desc";
    desc.textContent = story.description || story.id;

    content.appendChild(title);
    content.appendChild(desc);

    if (story.tags && story.tags.length > 0) {
      const tagRow = document.createElement("div");
      tagRow.className = "tag-row";
      story.tags.forEach((tag) => {
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
          const existingTags = currentSearch.split(",").map(t => t.trim()).filter(t => t);
          if (!existingTags.includes(tag)) {
            if (currentSearch) {
              searchInput.value = currentSearch + ", " + tag;
            } else {
              searchInput.value = tag;
            }
            saveFilterState();
            render();
          }
        });
        tagRow.appendChild(pill);
      });
      content.appendChild(tagRow);
    }

    // Add cursor tracking for card shine effect
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--card-cursor-x", `${x}%`);
      card.style.setProperty("--card-cursor-y", `${y}%`);
    });

    // Append buttons: favorite (star) on the right, pin beside it
    card.appendChild(favoriteBtn);
    card.appendChild(pinBtn);
    card.appendChild(content);
    grid.appendChild(card);
  });
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
  const stored = localStorage.getItem("homepageTheme");
  if (stored) {
    applyTheme(stored);
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

    setLoadingStatus("Preloading assets...");
    updateProgress(20);
    const imageCovers = catalog.map((s) => s.cover).filter(Boolean);

    const assets = [...imageCovers];
    const totalAssets = assets.length + 1; // +1 for fonts
    let loadedAssets = 0;

    const assetPromises = [];

    // Font loading promise
    if (document.fonts) {
      const fontPromise = document.fonts.ready.then(() => {
        loadedAssets++;
        const progress = 20 + (loadedAssets / totalAssets) * 70;
        updateProgress(progress);
        setLoadingStatus("Fonts synchronized");
      });
      assetPromises.push(fontPromise);
    } else {
      // fallback for browsers that don't support document.fonts
      loadedAssets++;
    }

    // Image loading promises
    imageCovers.forEach((src) => {
      const imgPromise = new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedAssets++;
          const progress = 20 + (loadedAssets / totalAssets) * 70;
          updateProgress(progress);
          setLoadingStatus(`Verifying asset: ${src.split("/").pop()}`);
          resolve();
        };
        img.onerror = () => {
          loadedAssets++;
          const progress = 20 + (loadedAssets / totalAssets) * 70;
          updateProgress(progress);
          setLoadingStatus(`Asset corrupted: ${src.split("/").pop()}`);
          resolve(); // Resolve even on error to not block the page
        };
        img.src = src;
      });
      assetPromises.push(imgPromise);
    });

    await Promise.all(assetPromises);

    setLoadingStatus("Finalizing interface...");
    updateProgress(95);

    // All original init logic goes here
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
      savedState?.sortDirection || window.VIEWER_SETTINGS.homepageSort?.direction || "asc";

    applyLayout(layoutToApply);
    applySortPreference({ type: sortToApply, direction: sortDirection });
    initTheme();
    await loadFonts(); // Load fonts for the dropdown
    applyColors(); // Load and apply custom colors
    applyFont(loadFont()); // Load and apply custom font
    buildCodeField();
    initDragging(); // Initialize dragging for settings panel
    render();

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

// Keep init as the entry point but change flow
async function init() {
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
  // Normalize space key: "space" (keybind) vs " " (actual keypress)
  const normalizedKey = event.key === ' ' ? 'space' : event.key.toLowerCase();
  const normalizedBind = blackoutKey === ' ' ? 'space' : blackoutKey.toLowerCase();
  if (normalizedKey === normalizedBind) {
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
function renderColorGrid(theme) {
  if (!colorGrid) return;
  colorGrid.innerHTML = "";

  const colors = DEFAULT_COLORS[theme];
  Object.entries(colors).forEach(([colorName, defaultValue]) => {
    const currentValue = getColor(colorName, theme);
    const desc = COLOR_DESCRIPTIONS[colorName];

    const item = document.createElement("div");
    item.className = "color-item";

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
        gradientPreview.style.background = newValue;
        setColor(colorName, newValue, theme);
      };

      textInput.addEventListener("blur", (e) => {
        updateGradientDisplay(e.target.value);
      });

      textInput.addEventListener("input", (e) => {
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

      const valueDisplay = document.createElement("div");
      valueDisplay.className = "color-value";
      valueDisplay.textContent = currentValue;

      const updateColorDisplay = (newValue) => {
        pickerBtn.style.backgroundColor = newValue;
        valueDisplay.textContent = newValue;
        setColor(colorName, newValue, theme);
      };

      pickerBtn.addEventListener("click", () => hiddenInput.click());

      hiddenInput.addEventListener("change", (e) => {
        const hexValue = e.target.value;
        updateColorDisplay(hexValue);
      });

      hiddenInput.addEventListener("input", (e) => {
        const hexValue = e.target.value;
        pickerBtn.style.backgroundColor = hexValue;
        valueDisplay.textContent = hexValue;
      });

      inputWrapper.appendChild(pickerBtn);
      inputWrapper.appendChild(valueDisplay);
      inputWrapper.appendChild(hiddenInput);
    }

    item.appendChild(label);
    item.appendChild(labelDesc);
    item.appendChild(inputWrapper);
    colorGrid.appendChild(item);
  });
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

async function openSettings() {
  if (!settingsPanel) return;
  
  // Reload fonts - window.FONTS is set by fonts.js loaded via script tag
  await loadFonts();
  
  loadPanelSettings();
  settingsPanel.hidden = false;
  settingsCurrentTheme = document.body.dataset.theme || "dark";
  renderColorGrid(settingsCurrentTheme);
  updateThemeTabs();
}

function closeSettings() {
  if (!settingsPanel) return;
  settingsPanel.hidden = true;
}

function updateThemeTabs() {
  const tabs = Array.from(document.querySelectorAll(".theme-tab"));
  tabs.forEach((tab) => {
    const tabTheme = tab.dataset.theme;
    if (tabTheme === settingsCurrentTheme) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });
}

function initDragging() {
  if (!settingsPanel) return;

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
  if (customFontInput) {
    customFontInput.addEventListener("change", () => {
      const font = customFontInput.value.trim();
      if (font) {
        saveFont(font);
        applyFont(font);
      }
    });
  }
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
    initSettingsTabs();
    initFontSizeControls();
    initCustomFontInput();
    initInputSettings();
  });
}

if (settingsClose) {
  settingsClose.addEventListener("click", closeSettings);
}

if (settingsPanel) {
  settingsPanel.addEventListener("click", (e) => {
    // Don't close if we're currently resizing
    if (settingsPanel.isResizing && settingsPanel.isResizing()) {
      return;
    }
    if (e.target === settingsPanel) {
      closeSettings();
    }
  });

  // Theme tab switching
  const themeTabs = Array.from(settingsPanel.querySelectorAll(".theme-tab"));
  themeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      settingsCurrentTheme = tab.dataset.theme;
      updateThemeTabs();
      renderColorGrid(settingsCurrentTheme);
    });
  });
}

if (resetColorsBtn) {
  resetColorsBtn.addEventListener("click", () => {
    localStorage.removeItem("customColors");
    applyColors();
    renderColorGrid(settingsCurrentTheme);
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
  
  const prefs = loadSkipPreferences();
  
  if (skipAgeToggle) {
    skipAgeToggle.checked = prefs.skipAgeVerify;
    skipAgeToggle.addEventListener('change', () => {
      const newPrefs = loadSkipPreferences();
      newPrefs.skipAgeVerify = skipAgeToggle.checked;
      saveSkipPreferences(newPrefs);
    });
  }
  
  if (skipWelcomeToggle) {
    skipWelcomeToggle.checked = prefs.skipWelcome;
    skipWelcomeToggle.addEventListener('change', () => {
      const newPrefs = loadSkipPreferences();
      newPrefs.skipWelcome = skipWelcomeToggle.checked;
      saveSkipPreferences(newPrefs);
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

// ===== KEYBOARD NAVIGATION SYSTEM =====

const KeyboardNavigation = {
  // Navigation state
  mode: 'cards', // 'cards' or 'controls'
  focusedCardIndex: -1,
  focusedControlIndex: -1,
  isSearchFocused: false,
  cards: [],
  controls: [],
  
  // Control elements order (for shift+nav)
  controlSelectors: [
    '#search-input',
    '.filter-btn[data-filter="all"]',
    '.filter-btn[data-filter="favorites"]',
    '.filter-btn[data-filter="bookmarks"]',
    '.layout-btn[data-layout="grid"]',
    '.layout-btn[data-layout="list"]',
    '.layout-btn[data-layout="compact"]',
    '.layout-btn[data-layout="spotlight"]',
    '.sort-btn[data-sort="default"]',
    '.sort-btn[data-sort="title"]',
    '.sort-btn[data-sort="recent"]',
    '.sort-btn[data-sort="priority"]',
    '#theme-toggle',
    '#settings-btn',
    '#help-btn'
  ],

  init() {
    this.updateElements();
    this.setupEventListeners();
    this.createModeIndicator();
  },

  updateElements() {
    // Get all visible story cards
    this.cards = Array.from(document.querySelectorAll('.story-card'));
    
    // Get all control elements that exist
    this.controls = this.controlSelectors
      .map(selector => document.querySelector(selector))
      .filter(el => el && el.offsetParent !== null); // Only visible elements
  },

  createModeIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'keyboard-mode-indicator';
    indicator.id = 'keyboard-mode-indicator';
    indicator.innerHTML = '🎮 Keyboard Nav Active';
    document.body.appendChild(indicator);
  },

  showModeIndicator(text, isActive = false) {
    const indicator = document.getElementById('keyboard-mode-indicator');
    if (indicator) {
      indicator.textContent = text;
      indicator.classList.add('visible');
      if (isActive) {
        indicator.classList.add('active-nav');
      } else {
        indicator.classList.remove('active-nav');
      }
      
      // Hide after 2 seconds
      clearTimeout(this.indicatorTimeout);
      this.indicatorTimeout = setTimeout(() => {
        indicator.classList.remove('visible');
        indicator.classList.remove('active-nav');
      }, 2000);
    }
  },

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    
    // Update elements when grid changes
    const observer = new MutationObserver(() => {
      this.updateElements();
    });
    observer.observe(document.getElementById('story-grid'), { childList: true, subtree: true });
  },

  handleKeydown(event) {
    // Let settings panel handle its own keyboard navigation when open
    if (settingsPanel && !settingsPanel.hidden) {
      if (event.key === 'Escape' && !KeybindManager.bindingTarget) {
        closeSettings();
        return;
      }
      // SettingsPanelKeyboardNav will handle other keys
      return;
    }

    // Let help modal handle its own keyboard navigation when open
    if (helpModal && helpModal.classList.contains('is-open')) {
      if (event.key === 'Escape') {
        closeHelpModal();
        return;
      }
      // HelpModalKeyboardNav will handle other keys
      return;
    }

    // Don't handle if in editable field (except search which we handle specially)
    if (this.isEditableTarget(event.target) && event.target.id !== 'search-input') {
      return;
    }

    // Handle search box special case
    if (this.isSearchFocused) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.unfocusSearch();
        return;
      }
      // Allow normal typing in search
      return;
    }

    const key = event.key.toLowerCase();
    const isShift = event.shiftKey;
    
    // ESC key unfocuses everything
    if (key === 'escape') {
      event.preventDefault();
      this.clearFocus();
      this.mode = 'cards';
      this.focusedCardIndex = -1;
      this.focusedControlIndex = -1;
      document.body.classList.remove('keyboard-nav-active');
      this.showModeIndicator('✨ All unfocused');
      return;
    }
    
    // ===== DIRECT SHORTCUTS (when not in search/popups) =====

    // Card action shortcuts (Q=pin, E=favorite) - work even when card not focused
    if (key === this.getKeyForAction('pin')) {
      event.preventDefault();
      this.togglePinCurrentCard();
      return;
    }
    if (key === this.getKeyForAction('favorite')) {
      event.preventDefault();
      this.toggleFavoriteCurrentCard();
      return;
    }
    
    // Layout shortcuts using custom keybinds
    if (key === this.getKeyForAction('layoutGrid')) {
      event.preventDefault();
      applyLayout('grid');
      saveFilterState();
      this.showModeIndicator('📐 Grid Layout');
      return;
    }
    if (key === this.getKeyForAction('layoutList')) {
      event.preventDefault();
      applyLayout('list');
      saveFilterState();
      this.showModeIndicator('📐 List Layout');
      return;
    }
    if (key === this.getKeyForAction('layoutCompact')) {
      event.preventDefault();
      applyLayout('compact');
      saveFilterState();
      this.showModeIndicator('📐 Compact Layout');
      return;
    }
    if (key === this.getKeyForAction('layoutSpotlight')) {
      event.preventDefault();
      applyLayout('spotlight');
      saveFilterState();
      this.showModeIndicator('📐 Spotlight Layout');
      return;
    }
    
    // Filter shortcuts using custom keybinds
    if (key === this.getKeyForAction('filterAll')) {
      event.preventDefault();
      this.activateFilter('all');
      return;
    }
    if (key === this.getKeyForAction('filterFavorites')) {
      event.preventDefault();
      this.activateFilter('favorites');
      return;
    }
    if (key === this.getKeyForAction('filterBookmarks')) {
      event.preventDefault();
      this.activateFilter('bookmarks');
      return;
    }
    
    // Sort shortcuts using custom keybinds
    if (key === this.getKeyForAction('sortDefault')) {
      event.preventDefault();
      this.activateSort('default');
      return;
    }
    if (key === this.getKeyForAction('sortTitle')) {
      event.preventDefault();
      this.activateSort('title');
      return;
    }
    if (key === this.getKeyForAction('sortRecent')) {
      event.preventDefault();
      this.activateSort('recent');
      return;
    }
    if (key === this.getKeyForAction('sortPriority')) {
      event.preventDefault();
      this.activateSort('priority');
      return;
    }
    
    // Settings panel using custom keybind
    if (key === this.getKeyForAction('settingsTab')) {
      event.preventDefault();
    openSettings();
    initSettingsTabs();
    initFontSizeControls();
      initCustomFontInput();
      this.showModeIndicator('⚙️ Settings Opened');
      return;
    }
    
    // Help modal using custom keybind
    if (key === this.getKeyForAction('helpTab')) {
      event.preventDefault();
      if (helpBtn) helpBtn.click();
      this.showModeIndicator('❓ Help Opened');
      return;
    }
    
    // Theme toggle using custom keybind
    if (key === this.getKeyForAction('toggleTheme')) {
      event.preventDefault();
      const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      this.showModeIndicator(`🌗 ${next.charAt(0).toUpperCase() + next.slice(1)} Mode`);
      return;
    }
    
    // Focus search using custom keybind
    if (key === this.getKeyForAction('focusSearch')) {
      event.preventDefault();
      this.focusSearch();
      return;
    }
    
    // ===== END DIRECT SHORTCUTS =====
    
    // Check for WASD navigation keys
    const isWasdKey = ['w', 'a', 's', 'd'].includes(key);
    
    // Check for arrow keys (also for card navigation)
    const isArrowKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
    
    // If not a navigation key and not Enter, exit
    if (!isWasdKey && !isArrowKey && key !== 'enter') return;

    // Shift + any nav key = Control navigation mode
    if (isShift && (isWasdKey || isArrowKey)) {
      event.preventDefault();
      this.setMode('controls');
      this.navigateControls(key);
      return;
    }

    // WASD or Arrow keys = Card navigation mode (no Shift needed)
    if (isWasdKey || isArrowKey) {
      event.preventDefault();
      this.setMode('cards');
      this.navigateCards(key);
      return;
    }

    // Enter key handling
    if (key === 'enter') {
      event.preventDefault();
      this.handleEnter();
      return;
    }
  },

  activateFilter(filterName) {
    activeFilter = filterName;
    filterButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
    saveFilterState();
    render();
    const labels = { 'all': 'All Stories', 'favorites': 'Favorites', 'bookmarks': 'Bookmarks' };
    this.showModeIndicator(`🏷️ ${labels[filterName]}`);
  },

  activateSort(sortName) {
    activeSort = sortName;
    if (sortName === 'title') {
      titleSortDirection = titleSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      titleSortDirection = 'asc';
    }
    sortButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.sort === activeSort);
      if (btn.dataset.sort === 'title' && activeSort === 'title') {
        btn.textContent = titleSortDirection === 'asc' ? 'Title A-Z' : 'Title Z-A';
      } else if (btn.dataset.sort === 'title') {
        btn.textContent = 'Title';
      }
    });
    render();
    const labels = { 'default': 'Default', 'title': 'By Title', 'recent': 'Recent', 'priority': 'Priority' };
    this.showModeIndicator(`📊 ${labels[sortName]}`);
  },

  setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.clearFocus();
      
      if (mode === 'cards') {
        this.showModeIndicator('🎴 Card Navigation', true);
        document.body.classList.add('keyboard-nav-active');
      } else {
        this.showModeIndicator('⚙️ Control Navigation', true);
        document.body.classList.remove('keyboard-nav-active');
      }
    }
  },

  navigateCards(key) {
    this.updateElements();
    
    if (this.cards.length === 0) return;

    const grid = document.getElementById('story-grid');
    const layout = grid?.dataset.layout || 'grid';
    
    // Get grid dimensions
    const computedStyle = window.getComputedStyle(grid);
    const columns = layout === 'list' ? 1 : 
                    layout === 'grid' ? parseInt(computedStyle.gridTemplateColumns.split(' ').length) || 4 :
                    layout === 'compact' ? Math.floor(grid.offsetWidth / 280) || 2 :
                    layout === 'spotlight' ? Math.floor(grid.offsetWidth / 340) || 1 : 4;

    let newIndex = this.focusedCardIndex;

    if (newIndex === -1) {
      // Start at first card
      newIndex = 0;
    } else {
      switch (key) {
        case 'arrowright':
        case 'd':
          newIndex = Math.min(this.focusedCardIndex + 1, this.cards.length - 1);
          break;
        case 'arrowleft':
        case 'a':
          newIndex = Math.max(this.focusedCardIndex - 1, 0);
          break;
        case 'arrowdown':
        case 's':
          newIndex = Math.min(this.focusedCardIndex + columns, this.cards.length - 1);
          break;
        case 'arrowup':
        case 'w':
          newIndex = Math.max(this.focusedCardIndex - columns, 0);
          break;
      }
    }

    this.focusCard(newIndex);
  },

  navigateControls(key) {
    this.updateElements();
    
    if (this.controls.length === 0) return;

    let newIndex = this.focusedControlIndex;

    if (newIndex === -1) {
      // Start at first control
      newIndex = 0;
    } else {
      switch (key) {
        case 'arrowright':
        case 'd':
          newIndex = Math.min(this.focusedControlIndex + 1, this.controls.length - 1);
          break;
        case 'arrowleft':
        case 'a':
          newIndex = Math.max(this.focusedControlIndex - 1, 0);
          break;
        case 'arrowdown':
        case 's':
          // Jump to next group
          newIndex = Math.min(this.focusedControlIndex + 3, this.controls.length - 1);
          break;
        case 'arrowup':
        case 'w':
          // Jump to previous group
          newIndex = Math.max(this.focusedControlIndex - 3, 0);
          break;
      }
    }

    this.focusControl(newIndex);
  },

  focusCard(index) {
    // Remove previous focus
    this.cards.forEach(card => card.classList.remove('keyboard-focused'));
    
    this.focusedCardIndex = index;
    const card = this.cards[index];
    
    if (card) {
      card.classList.add('keyboard-focused');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  focusControl(index) {
    // Remove previous focus
    this.controls.forEach(control => control.classList.remove('keyboard-focused'));
    
    this.focusedControlIndex = index;
    const control = this.controls[index];
    
    if (control) {
      control.classList.add('keyboard-focused');
      control.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  clearFocus() {
    this.cards.forEach(card => card.classList.remove('keyboard-focused'));
    this.controls.forEach(control => control.classList.remove('keyboard-focused'));
    this.focusedCardIndex = -1;
    this.focusedControlIndex = -1;
  },

  handleEnter() {
    if (this.mode === 'cards' && this.focusedCardIndex >= 0) {
      const card = this.cards[this.focusedCardIndex];
      if (card) {
        // Navigate to the story
        window.location.href = card.href;
      }
    } else if (this.mode === 'controls' && this.focusedControlIndex >= 0) {
      const control = this.controls[this.focusedControlIndex];
      if (control) {
        // Special handling for search input
        if (control.id === 'search-input') {
          this.focusSearch();
        } else {
          // Click the control
          control.click();
        }
      }
    } else if (this.mode === 'cards' && this.focusedCardIndex === -1) {
      // If no card focused, focus the first one
      this.navigateCards('arrowdown');
    }
  },

  focusSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      this.isSearchFocused = true;
      searchInput.focus();
      searchInput.select();
      this.showModeIndicator('⌨️ Search Mode - ESC to exit');
    }
  },

  unfocusSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      this.isSearchFocused = false;
      searchInput.blur();
      this.showModeIndicator('🎴 Card Navigation');
    }
  },

  isEditableTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  },

  // Get key for action from KeybindManager
  getKeyForAction(actionName) {
    return KeybindManager.getKeyFor(actionName) || '';
  },

  // Toggle pin for current focused card (or first card if none focused)
  togglePinCurrentCard() {
    this.updateElements();
    
    // Use focused card, or first card if none
    const targetIndex = this.focusedCardIndex >= 0 ? this.focusedCardIndex : 0;
    const card = this.cards[targetIndex];
    
    if (!card) {
      this.showModeIndicator('⚠️ No cards available');
      return;
    }

    // Get the story ID from the card's href
    const href = card.href;
    const storyIdMatch = href.match(/story=([^&]+)/);
    const storyId = storyIdMatch ? decodeURIComponent(storyIdMatch[1]) : null;
    
    if (!storyId) {
      this.showModeIndicator('⚠️ Cannot identify story');
      return;
    }

    // Toggle pin
    const pins = loadPins();
    if (isPinned(storyId)) {
      pins.delete(storyId);
      savePins(pins);
      this.showModeIndicator('📌 Unpinned');
    } else {
      pins.add(storyId);
      savePins(pins);
      this.showModeIndicator('📌 Pinned!');
    }
    
    // Re-render and re-focus the same card
    render();
    
    // Re-focus the card after render
    setTimeout(() => {
      this.updateElements();
      if (this.cards[targetIndex]) {
        this.focusCard(targetIndex);
      }
    }, 50);
  },

  // Toggle favorite for current focused card (or first card if none focused)
  toggleFavoriteCurrentCard() {
    this.updateElements();
    
    // Use focused card, or first card if none
    const targetIndex = this.focusedCardIndex >= 0 ? this.focusedCardIndex : 0;
    const card = this.cards[targetIndex];
    
    if (!card) {
      this.showModeIndicator('⚠️ No cards available');
      return;
    }

    // Get the story ID from the card's href
    const href = card.href;
    const storyIdMatch = href.match(/story=([^&]+)/);
    const storyId = storyIdMatch ? decodeURIComponent(storyIdMatch[1]) : null;
    
    if (!storyId) {
      this.showModeIndicator('⚠️ Cannot identify story');
      return;
    }

    // Toggle favorite
    const favorites = loadFavorites();
    if (favorites.has(storyId)) {
      favorites.delete(storyId);
      saveFavorites(favorites);
      this.showModeIndicator('⭐ Unfavorited');
    } else {
      favorites.add(storyId);
      saveFavorites(favorites);
      this.showModeIndicator('⭐ Favorited!');
    }
    
    // Re-render and re-focus the same card
    render();
    
    // Re-focus the card after render
    setTimeout(() => {
      this.updateElements();
      if (this.cards[targetIndex]) {
        this.focusCard(targetIndex);
      }
    }, 50);
  }
};

// ===== SETTINGS PANEL KEYBOARD NAVIGATION =====

const SettingsPanelKeyboardNav = {
  focusedTabIndex: -1,
  focusedElementIndex: -1,
  tabs: [],
  focusableElements: [],

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Listen for when settings panel opens
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        setTimeout(() => this.updateElements(), 100);
      });
    }

    // Handle keyboard navigation within settings
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  },

  updateElements() {
    if (settingsPanel && !settingsPanel.hidden) {
      this.tabs = Array.from(settingsPanel.querySelectorAll('.settings-tabs .tab-btn'));
      this.focusableElements = Array.from(settingsPanel.querySelectorAll(
        '.quick-font-btn, .theme-tab, .color-picker-btn, .color-item, .settings-reset-btn, .keybind-tag'
      )).filter(el => el.offsetParent !== null);
    }
  },

  handleKeydown(event) {
    if (!settingsPanel || settingsPanel.hidden) return;
    
    // Don't interfere with keybind assignment
    if (KeybindManager.bindingTarget) return;

    const key = event.key.toLowerCase();
    const isNavKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key);
    
    if (!isNavKey && key !== 'enter' && key !== ' ') return;

    event.preventDefault();

    // Tab switching with A/D or Arrow keys
    if (['a', 'arrowleft', 'd', 'arrowright'].includes(key)) {
      const direction = ['a', 'arrowleft'].includes(key) ? -1 : 1;
      this.switchTab(direction);
      return;
    }

    // Navigate within panel content with W/S
    if (['w', 'arrowup', 's', 'arrowdown'].includes(key)) {
      const direction = ['w', 'arrowup'].includes(key) ? -1 : 1;
      this.navigateContent(direction);
      return;
    }

    // Activate focused element
    if (key === 'enter' || key === ' ') {
      this.activateFocusedElement();
    }
  },

  switchTab(direction) {
    this.updateElements();
    if (this.tabs.length === 0) return;

    let newIndex = this.focusedTabIndex;
    if (newIndex === -1) {
      // Find currently active tab
      newIndex = this.tabs.findIndex(tab => tab.classList.contains('active'));
      if (newIndex === -1) newIndex = 0;
    }

    newIndex = Math.max(0, Math.min(newIndex + direction, this.tabs.length - 1));
    this.focusedTabIndex = newIndex;
    
    // Click the tab to switch
    this.tabs[newIndex].click();
    this.tabs[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Clear content focus when switching tabs
    this.focusedElementIndex = -1;
    this.clearContentFocus();
  },

  navigateContent(direction) {
    this.updateElements();
    if (this.focusableElements.length === 0) return;

    let newIndex = this.focusedElementIndex;
    if (newIndex === -1) {
      newIndex = direction > 0 ? 0 : this.focusableElements.length - 1;
    } else {
      newIndex = Math.max(0, Math.min(newIndex + direction, this.focusableElements.length - 1));
    }

    this.focusedElementIndex = newIndex;
    this.focusContentElement(newIndex);
  },

  focusContentElement(index) {
    this.clearContentFocus();
    const element = this.focusableElements[index];
    if (element) {
      element.classList.add('keyboard-focused');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  clearContentFocus() {
    this.focusableElements.forEach(el => el.classList.remove('keyboard-focused'));
  },

  activateFocusedElement() {
    if (this.focusedElementIndex >= 0) {
      const element = this.focusableElements[this.focusedElementIndex];
      if (element) {
        element.click();
      }
    } else if (this.focusedTabIndex >= 0) {
      // If no content focused, activate current tab
      this.tabs[this.focusedTabIndex]?.click();
    }
  }
};

// ===== HELP MODAL KEYBOARD NAVIGATION =====

const HelpModalKeyboardNav = {
  focusedTabIndex: -1,
  scrollPosition: 0,
  tabs: [],
  modalBody: null,

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => {
        setTimeout(() => this.updateElements(), 100);
      });
    }

    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  },

  updateElements() {
    if (helpModal && helpModal.classList.contains('is-open')) {
      this.tabs = Array.from(helpModal.querySelectorAll('.modal-tabs .modal-tab'));
      this.modalBody = helpModal.querySelector('.modal-body');
    }
  },

  handleKeydown(event) {
    if (!helpModal || !helpModal.classList.contains('is-open')) return;

    const key = event.key.toLowerCase();
    const isNavKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key);
    
    if (!isNavKey && key !== 'enter' && key !== ' ') return;

    event.preventDefault();

    // Tab switching with A/D
    if (['a', 'arrowleft', 'd', 'arrowright'].includes(key)) {
      const direction = ['a', 'arrowleft'].includes(key) ? -1 : 1;
      this.switchTab(direction);
      return;
    }

    // Scroll content with W/S
    if (['w', 'arrowup', 's', 'arrowdown'].includes(key)) {
      const direction = ['w', 'arrowup'].includes(key) ? -1 : 1;
      this.scrollContent(direction);
    }
  },

  switchTab(direction) {
    this.updateElements();
    if (this.tabs.length === 0) return;

    let newIndex = this.focusedTabIndex;
    if (newIndex === -1) {
      newIndex = this.tabs.findIndex(tab => tab.classList.contains('active'));
      if (newIndex === -1) newIndex = 0;
    }

    newIndex = Math.max(0, Math.min(newIndex + direction, this.tabs.length - 1));
    this.focusedTabIndex = newIndex;
    
    this.tabs[newIndex].click();
    this.tabs[newIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  scrollContent(direction) {
    if (!this.modalBody) return;
    
    const scrollAmount = 100;
    this.modalBody.scrollBy({
      top: direction * scrollAmount,
      behavior: 'smooth'
    });
  }
};

// ===== KEYBIND MANAGER =====

const KeybindManager = {
  bindingTarget: null,
  keybindListener: null,
  
  // Default keybinds - All homepage keyboard shortcuts
  // IMPORTANT: WASD is reserved for card navigation (Shift+WASD = control navigation)
  defaultKeybinds: {
    // Card Navigation (WASD) - for navigating story cards
    'navUp': { key: 'w', fallback: 'arrowup', label: 'Navigate Up (WASD)' },
    'navDown': { key: 's', fallback: 'arrowdown', label: 'Navigate Down (WASD)' },
    'navLeft': { key: 'a', fallback: 'arrowleft', label: 'Navigate Left (WASD)' },
    'navRight': { key: 'd', fallback: 'arrowright', label: 'Navigate Right (WASD)' },
    
    // Card Actions
    'openCard': { key: 'enter', fallback: null, label: 'Open Card' },
    'pin': { key: 'q', fallback: null, label: 'Pin-Unpin Card' },
    'favorite': { key: 'e', fallback: null, label: 'Favorite-Unfavorite' },
    
    // Layouts
    'layoutGrid': { key: '1', fallback: null, label: 'Grid Layout' },
    'layoutList': { key: '2', fallback: null, label: 'List Layout' },
    'layoutCompact': { key: '3', fallback: null, label: 'Compact Layout' },
    'layoutSpotlight': { key: '4', fallback: null, label: 'Spotlight Layout' },
    
    // Filters (use other keys, WASD reserved for nav)
    'filterAll': { key: 'f', fallback: null, label: 'Show All Stories' },
    'filterFavorites': { key: 'v', fallback: null, label: 'Show Favorites' },
    'filterBookmarks': { key: 'b', fallback: null, label: 'Show Bookmarks' },
    
    // Sorting (use other keys, WASD reserved for nav)
    'sortDefault': { key: 'o', fallback: null, label: 'Default Sort' },
    'sortTitle': { key: 't', fallback: null, label: 'Sort by Title' },
    'sortRecent': { key: 'r', fallback: null, label: 'Sort by Recent' },
    'sortPriority': { key: 'p', fallback: null, label: 'Sort by Priority' },
    
    // Panels (use other keys, WASD reserved for nav)
    'settingsTab': { key: 'u', fallback: null, label: 'Open Settings' },
    'helpTab': { key: 'h', fallback: null, label: 'Open Help' },
    
    // Theme & Mode
    'toggleTheme': { key: 'l', fallback: null, label: 'Toggle Light/Dark' },
    'blackout': { key: 'space', fallback: null, label: 'Blackout Mode' },
    
    // Navigation Modes
    'focusSearch': { key: '/', fallback: null, label: 'Focus Search' },
  },

  customKeybinds: {},

  init() {
    this.loadKeybinds();
    this.renderKeybindList();
    this.setupResetButton();
  },

  loadKeybinds() {
    // Use DATABASE_SETTINGS if available, fallback to localStorage
    let keybinds = {};
    
    if (window.DATABASE_SETTINGS?.db?.settings?.keybinds) {
      keybinds = window.DATABASE_SETTINGS.db.settings.keybinds;
    } else {
      try {
        const saved = localStorage.getItem('homepageKeybinds');
        if (saved) {
          keybinds = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Error loading keybinds:', error);
      }
    }
    
    this.customKeybinds = keybinds || {};
  },

  saveKeybinds() {
    // Use DATABASE_SETTINGS if available, fallback to localStorage
    if (window.DATABASE_SETTINGS?.setSettings) {
      window.DATABASE_SETTINGS.setSettings({ keybinds: this.customKeybinds });
    } else {
      try {
        localStorage.setItem('homepageKeybinds', JSON.stringify(this.customKeybinds));
      } catch (error) {
        console.error('Error saving keybinds:', error);
      }
    }
  },

  getKeyFor(action) {
    return this.customKeybinds?.[action] || this.defaultKeybinds[action]?.key || '';
  },

  setKeybind(action, key) {
    if (!this.customKeybinds) this.customKeybinds = {};
    this.customKeybinds[action] = key.toLowerCase();
    this.saveKeybinds();
    this.renderKeybindList();
  },

  clearKeybind(action) {
    if (this.customKeybinds) {
      delete this.customKeybinds[action];
      this.saveKeybinds();
      this.renderKeybindList();
    }
  },

  resetToDefaults() {
    this.customKeybinds = {};
    this.saveKeybinds();
    this.renderKeybindList();
  },

  renderKeybindList() {
    const container = document.getElementById('keybind-list');
    if (!container) return;

    let html = '';
    
    Object.entries(this.defaultKeybinds).forEach(([action, config]) => {
      const currentKey = this.getKeyFor(action);
      const isActive = this.bindingTarget === action;
      
    html += `
        <div class="keybind-tag ${isActive ? 'active' : ''}" data-action="${action}">
          <span class="keybind-tag-label">${config.label}</span>
          <span class="keybind-tag-key">${this.formatKeyDisplay(currentKey) || '-'}</span>
          <button type="button" class="keybind-tag-assign" data-action="${action}">
            ${isActive ? 'Press key...' : 'Assign'}
          </button>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add click handlers
    container.querySelectorAll('.keybind-tag-assign').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        this.startBinding(action);
      });
    });

    // Also render help modal shortcuts
    this.renderHelpShortcuts();
  },

  renderHelpShortcuts() {
    // Render Direct Shortcuts (non-navigation keys)
    const directContainer = document.getElementById('help-direct-shortcuts');
    if (directContainer) {
      const directActions = [
        'layoutGrid', 'layoutList', 'layoutCompact', 'layoutSpotlight',
        'filterAll', 'filterFavorites', 'filterBookmarks',
        'sortDefault', 'sortTitle', 'sortRecent', 'sortPriority',
        'pin', 'favorite', 'settingsTab', 'helpTab', 'toggleTheme', 'focusSearch'
      ];
      
      let html = `<h4>⚡ Direct Shortcuts (No Mode Switch!)</h4><div class="shortcuts-pill-grid">`;
      directActions.forEach(action => {
        const config = this.defaultKeybinds[action];
        const key = this.getKeyFor(action);
        if (config) {
          html += `
            <div class="shortcut-pill">
              <span class="shortcut-pill-key">${this.formatKeyDisplay(key)}</span>
              <span class="shortcut-pill-desc">${config.label.replace('Show ', '').replace('Sort by ', '').replace('Open ', '').replace('Toggle ', '').replace('/', '')}</span>
            </div>
          `;
        }
      });
      html += `</div>`;
      directContainer.innerHTML = html;
    }

    // Render Card Navigation
    const cardNavContainer = document.getElementById('help-card-nav');
    if (cardNavContainer) {
      const navActions = ['navUp', 'navDown', 'navLeft', 'navRight', 'openCard'];
      
      let html = `<h4>🎴 Card Navigation (Custom Keys)</h4><div class="shortcuts-pill-grid">`;
      navActions.forEach(action => {
        const config = this.defaultKeybinds[action];
        const key = this.getKeyFor(action);
        if (config) {
          let desc = config.label;
          if (action === 'navUp') desc = 'Move up';
          if (action === 'navDown') desc = 'Move down';
          if (action === 'navLeft') desc = 'Move left';
          if (action === 'navRight') desc = 'Move right';
          if (action === 'openCard') desc = 'Open card';
          
          // Show fallback key in parentheses
          const fallbackKey = config.fallback ? ` / ${config.fallback.replace('arrow', '↑↓←→')}` : '';
          
          html += `
            <div class="shortcut-pill">
              <span class="shortcut-pill-key">${this.formatKeyDisplay(key)}${fallbackKey}</span>
              <span class="shortcut-pill-desc">${desc}</span>
            </div>
          `;
        }
      });
      html += `</div>`;
      cardNavContainer.innerHTML = html;
    }

    // Render Control Navigation
    const controlNavContainer = document.getElementById('help-control-nav');
    if (controlNavContainer) {
      let html = `<h4>⚙️ Control Navigation (Shift + Nav Keys)</h4>`;
      html += `<div class="shortcuts-pill-grid">`;
      
      // Control navigation uses nav keys with Shift
      const navKey = this.getKeyFor('navUp') || 'w';
      
      html += `
        <div class="shortcut-pill">
          <span class="shortcut-pill-key">Shift + ${navKey.toUpperCase()} / ${this.formatKeyDisplay(this.getKeyFor('navDown') || 's')}</span>
          <span class="shortcut-pill-desc">Navigate control groups</span>
        </div>
        <div class="shortcut-pill">
          <span class="shortcut-pill-key">Shift + A/D</span>
          <span class="shortcut-pill-desc">Navigate within group</span>
        </div>
        <div class="shortcut-pill">
          <span class="shortcut-pill-key">${this.formatKeyDisplay(this.getKeyFor('openCard') || 'enter')}</span>
          <span class="shortcut-pill-desc">Activate control</span>
        </div>
      `;
      html += `</div>`;
      controlNavContainer.innerHTML = html;
    }
  },

  formatKeyDisplay(key) {
    if (!key) return '-';
    const keyMap = {
      ' ': 'SPACEBAR',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'enter': 'ENTER',
      'escape': 'ESC',
      'backspace': 'BACKSPACE',
      'delete': 'DEL',
      '/': '/'
    };
    return keyMap[key] || key.toUpperCase();
  },

  startBinding(action) {
    // Cancel any existing binding
    this.cancelBinding();
    
    this.bindingTarget = action;
    this.renderKeybindList();
    
    // Show indicator
    KeyboardNavigation.showModeIndicator(`⌨️ Press key for "${this.defaultKeybinds[action]?.label}"`);

    // Set up one-time key listener
    this.keybindListener = (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent other handlers from receiving this
      
      if (e.key === 'Escape') {
        // Cancel binding
        this.cancelBinding();
        return;
      }
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        // Clear binding
        this.clearKeybind(action);
        this.cancelBinding();
        KeyboardNavigation.showModeIndicator('❌ Binding cleared');
        return;
      }

      // Set new binding
      const key = e.key.toLowerCase();
      this.setKeybind(action, key);
      this.cancelBinding();
      updateBlackoutResumeText(); // Update blackout resume text with new keybind
      
      KeyboardNavigation.showModeIndicator(`✅ Bound "${key}" to "${this.defaultKeybinds[action]?.label}"`);
    };

    document.addEventListener('keydown', this.keybindListener, { capture: true });
  },

  cancelBinding() {
    if (this.keybindListener) {
      document.removeEventListener('keydown', this.keybindListener, { capture: true });
      this.keybindListener = null;
    }
    this.bindingTarget = null;
    this.renderKeybindList();
  },

  isBinding() {
    return this.bindingTarget !== null;
  },

  setupResetButton() {
    const resetBtn = document.getElementById('reset-keybinds');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const confirmed = await PopupSystem.confirm('Reset all keybinds to default?', 'Reset Keybinds');
        if (confirmed) {
          this.resetToDefaults();
          KeyboardNavigation.showModeIndicator('🔄 Keybinds reset to default');
        }
      });
    }
  }
};

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

// ===== SECRET STATS TRACKING SYSTEM =====
// (Moved to main initialization above)
const SecretStats = {
    // Stats storage
    stats: {
        totalTime: 0,
        sessionTime: 0,
        firstVisit: null,
        lastVisit: null,
        totalClicks: 0,
        keypresses: 0,
        reportsOpened: {},
        pins: 0,
        unfPins: 0,
        favorites: 0,
        unfavorites: 0,
        searches: 0,
        darkModeUses: 0,
        lightModeUses: 0,
        layoutChanges: 0,
        sortChanges: 0,
        fastestClick: null,
        longestSession: 0,
        streak: 0,
        lastActiveDate: null
    },
    
    sessionStart: null,
    clickStart: null,
    interactionInterval: null,
    
    init() {
        this.loadStats();
        this.sessionStart = Date.now();
        this.setupTracking();
        this.setupResetButton();
        this.updateDisplay();
        
        // Track session time every second
        this.interactionInterval = setInterval(() => {
            this.stats.sessionTime += 1000;
            this.stats.totalTime += 1000;
            this.updateDisplay();
        }, 1000);
        
        // Update last active date for streak
        const today = new Date().toDateString();
        if (this.stats.lastActiveDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (this.stats.lastActiveDate === yesterday.toDateString()) {
                // Consecutive day
                this.stats.streak++;
            } else {
                // Reset streak if not consecutive
                this.stats.streak = 1;
            }
            this.stats.lastActiveDate = today;
            this.saveStats();
        }
        
        // Save stats periodically
        setInterval(() => this.saveStats(), 30000); // Every 30 seconds
    },
    
    loadStats() {
        try {
            const raw = localStorage.getItem('secretStats');
            if (raw) {
                this.stats = { ...this.stats, ...JSON.parse(raw) };
            } else {
                // First visit - set first visit date
                this.stats.firstVisit = new Date().toISOString();
            }
            this.stats.lastVisit = new Date().toISOString();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    saveStats() {
        try {
            localStorage.setItem('secretStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    },
    
    setupTracking() {
        // Track clicks
        document.addEventListener('click', (e) => {
            // Ignore clicks on modals/popups
            if (e.target.closest('.modal-panel') || 
                e.target.closest('.draggable-panel') ||
                e.target.closest('#confirm-overlay')) {
                return;
            }
            
            this.stats.totalClicks++;
            
            // Track click speed
            const now = Date.now();
            if (this.clickStart) {
                const diff = now - this.clickStart;
                if (!this.stats.fastestClick || diff < this.stats.fastestClick) {
                    this.stats.fastestClick = diff;
                }
            }
            this.clickStart = now;
            
            this.updateDisplay();
        });
        
        // Track keypresses
        document.addEventListener('keydown', (e) => {
            // Ignore modifier keys and function keys
            if (e.key.length === 1 || 
                ['Backspace', 'Delete', 'Enter', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.stats.keypresses++;
                this.updateDisplay();
            }
        });
        
        // Track report opens (cards clicked)
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.story-card');
            if (card) {
                const href = card.href;
                const storyIdMatch = href.match(/story=([^&]+)/);
                const storyId = storyIdMatch ? decodeURIComponent(storyIdMatch[1]) : 'unknown';
                
                this.stats.reportsOpened[storyId] = (this.stats.reportsOpened[storyId] || 0) + 1;
                this.updateTopReports();
                this.saveStats();
            }
        });
        
        // Track pin/favorite actions
        document.addEventListener('click', (e) => {
            const pinBtn = e.target.closest('.pin-btn');
            const favBtn = e.target.closest('.favorite-btn');
            
            if (pinBtn) {
                if (pinBtn.classList.contains('active')) {
                    this.stats.unPins++;
                } else {
                    this.stats.pins++;
                }
                this.updateDisplay();
            }
            
            if (favBtn) {
                if (favBtn.classList.contains('active')) {
                    this.stats.unfavorites++;
                } else {
                    this.stats.favorites++;
                }
                this.updateDisplay();
            }
        });
        
        // Track search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('search', () => {
                if (searchInput.value.trim()) {
                    this.stats.searches++;
                    this.updateDisplay();
                }
            });
        }
        
        // Track theme changes
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const observer = new MutationObserver(() => {
                const isDark = document.body.dataset.theme !== 'light';
                if (isDark) {
                    this.stats.darkModeUses++;
                } else {
                    this.stats.lightModeUses++;
                }
                this.updateDisplay();
            });
            observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        }
        
        // Track layout changes
        document.addEventListener('click', (e) => {
            const layoutBtn = e.target.closest('.layout-btn');
            if (layoutBtn) {
                this.stats.layoutChanges++;
                this.updateDisplay();
            }
        });
        
        // Track sort changes
        document.addEventListener('click', (e) => {
            const sortBtn = e.target.closest('.sort-btn');
            if (sortBtn) {
                this.stats.sortChanges++;
                this.updateDisplay();
            }
        });
    },
    
    setupResetButton() {
        const resetBtn = document.getElementById('reset-stats');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmed = await PopupSystem.confirm('Reset all statistics? This cannot be undone.', 'Reset Statistics');
                if (confirmed) {
                    localStorage.removeItem('secretStats');
                    location.reload();
                }
            });
        }
    },
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    },
    
    formatDuration(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    },
    
    updateDisplay() {
        // Update time displays
        const totalTimeEl = document.getElementById('stat-total-time');
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatTime(this.stats.totalTime);
        }
        
        const daysSinceEl = document.getElementById('stat-days-since');
        if (daysSinceEl && this.stats.firstVisit) {
            const first = new Date(this.stats.firstVisit);
            const now = new Date();
            const diff = Math.floor((now - first) / (1000 * 60 * 60 * 24));
            daysSinceEl.textContent = diff;
        }
        
        // Update other stats
        this.updateStat('stat-total-clicks', this.stats.totalClicks);
        this.updateStat('stat-keypresses', this.stats.keypresses);
        
        const pinTotal = this.stats.pins + this.stats.unPins;
        this.updateStat('stat-pins', pinTotal);
        
        const favTotal = this.stats.favorites + this.stats.unfavorites;
        this.updateStat('stat-favorites', favTotal);
        
        this.updateStat('stat-searches', this.stats.searches);
        this.updateStat('stat-dark-uses', this.stats.darkModeUses);
        this.updateStat('stat-light-uses', this.stats.lightModeUses);
        this.updateStat('stat-layouts', this.stats.layoutChanges);
        this.updateStat('stat-sorts', this.stats.sortChanges);
        
        // Update reports opened
        let totalReports = 0;
        Object.values(this.stats.reportsOpened).forEach(count => {
            totalReports += count;
        });
        this.updateStat('stat-reports-opened', totalReports);
        
        // Update quick pills
        const fastestClickEl = document.getElementById('stat-fastest-click');
        if (fastestClickEl && this.stats.fastestClick) {
            fastestClickEl.textContent = this.stats.fastestClick + ' ms';
        }
        
        const longestSessionEl = document.getElementById('stat-longest-session');
        if (longestSessionEl) {
            longestSessionEl.textContent = this.formatDuration(this.stats.longestSession);
        }
        
        // Calculate accuracy (clicks that led to actions vs total clicks)
        const totalActions = this.stats.reportsOpened ? Object.keys(this.stats.reportsOpened).length : 0;
        const accuracy = this.stats.totalClicks > 0 
            ? Math.round((totalActions / this.stats.totalClicks) * 100) 
            : 0;
        const accuracyEl = document.getElementById('stat-accuracy');
        if (accuracyEl) {
            accuracyEl.textContent = Math.min(accuracy, 100) + '%';
        }
        
        const streakEl = document.getElementById('stat-streak');
        if (streakEl) {
            streakEl.textContent = this.stats.streak + ' days';
        }
        
        this.updateTopReports();
    },
    
    updateStat(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value.toLocaleString();
        }
    },
    
    updateTopReports() {
        const container = document.getElementById('top-reports');
        if (!container) return;
        
        const reports = Object.entries(this.stats.reportsOpened)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (reports.length === 0) {
            container.innerHTML = '<div class="top-empty">No data yet...</div>';
            return;
        }
        
        container.innerHTML = reports.map(([id, count], index) => {
            // Try to get story title
            let title = id;
            const story = stories.find(s => s.id === id);
            if (story) {
                title = story.title || `Report #${story.reportNumber || index + 1}`;
            }
            
            return `
                <div class="top-item">
                    <span class="top-rank">#${index + 1}</span>
                    <span class="top-name" title="${title}">${title}</span>
                    <span class="top-count">${count} opens</span>
                </div>
            `;
        }).join('');
    },
    
    endSession() {
        // Check for longest session
        if (this.stats.sessionTime > this.stats.longestSession) {
            this.stats.longestSession = this.stats.sessionTime;
        }
        this.saveStats();
        
        if (this.interval) {
            clearInterval(this.interactionInterval);
        }
    }
};

// Initialize secret stats when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // ... existing code ...
    SecretStats.init();
});

// ===== CUSTOM POPUP SYSTEM (Alert, Confirm, Prompt) =====
// Replaces browser alert(), confirm(), prompt() with custom styled popups

const PopupSystem = {
    overlay: null,
    modal: null,
    resolveCallback: null,

    init() {
        // Create popup elements if they don't exist
        if (!document.getElementById('custom-popup-overlay')) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'custom-popup-overlay';
            this.overlay.className = 'custom-popup-overlay';
            this.overlay.hidden = true;
            this.overlay.innerHTML = `
                <div class="custom-popup-modal" id="custom-popup-modal">
                    <div class="custom-popup-header" id="custom-popup-header">
                        <span class="custom-popup-icon" id="custom-popup-icon">ℹ️</span>
                        <h3 class="custom-popup-title" id="custom-popup-title">Confirm</h3>
                    </div>
                    <p class="custom-popup-message" id="custom-popup-message"></p>
                    <input type="text" class="custom-popup-input" id="custom-popup-input" hidden>
                    <div class="custom-popup-actions" id="custom-popup-actions"></div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
        this.overlay = document.getElementById('custom-popup-overlay');
        this.modal = document.getElementById('custom-popup-modal');
    },

    show(options) {
        return new Promise((resolve) => {
            if (!this.overlay) this.init();

            const {
                title = 'Confirm',
                message = '',
                icon = 'ℹ️',
                showInput = false,
                inputPlaceholder = '',
                inputValue = '',
                buttons = [
                    { text: 'Cancel', action: 'cancel', variant: 'secondary' },
                    { text: 'OK', action: 'ok', variant: 'primary' }
                ],
                defaultAction = 'cancel',
                escapeCloses = true
            } = options;

            // Set content
            document.getElementById('custom-popup-icon').textContent = icon;
            document.getElementById('custom-popup-title').textContent = title;
            document.getElementById('custom-popup-message').textContent = message;

            // Handle input
            const input = document.getElementById('custom-popup-input');
            if (showInput) {
                input.hidden = false;
                input.placeholder = inputPlaceholder;
                input.value = inputValue;
                input.focus();
                setTimeout(() => input.select(), 10);
            } else {
                input.hidden = true;
            }

            // Create buttons
            const actionsContainer = document.getElementById('custom-popup-actions');
            actionsContainer.innerHTML = '';

            buttons.forEach((btn, index) => {
                const button = document.createElement('button');
                button.className = `custom-popup-btn custom-popup-btn-${btn.variant || 'secondary'}`;
                button.textContent = btn.text;
                if (btn.action === defaultAction) {
                    button.autofocus = true;
                }
                button.addEventListener('click', () => {
                    const inputValue = showInput ? input.value : null;
                    resolve({ action: btn.action, value: inputValue });
                    this.hide();
                });
                actionsContainer.appendChild(button);
            });

            // Store resolve callback
            this.resolveCallback = resolve;

            // Show overlay
            this.overlay.hidden = false;
            document.body.classList.add('no-scroll');

            // Focus default button after animation
            setTimeout(() => {
                const defaultBtn = actionsContainer.querySelector(`[autofocus]`) || actionsContainer.firstChild;
                if (defaultBtn) defaultBtn.focus();
            }, 50);

            // Handle escape key
            const escHandler = (e) => {
                if (e.key === 'Escape' && escapeCloses) {
                    document.removeEventListener('keydown', escHandler);
                    if (this.resolveCallback) {
                        resolve({ action: 'cancel', value: showInput ? input.value : null });
                        this.hide();
                    }
                }
            };
            document.addEventListener('keydown', escHandler, { once: true });
        });
    },

    hide() {
        if (this.overlay) {
            this.overlay.hidden = true;
            document.body.classList.remove('no-scroll');
            this.resolveCallback = null;
        }
    },

    // Convenience methods
    alert(message, title = 'Info') {
        return this.show({
            title,
            message,
            icon: 'ℹ️',
            buttons: [{ text: 'OK', action: 'ok', variant: 'primary' }],
            defaultAction: 'ok'
        });
    },

    confirm(message, title = 'Confirm') {
        return this.show({
            title,
            message,
            icon: '⚠️',
            buttons: [
                { text: 'Cancel', action: 'cancel', variant: 'secondary' },
                { text: 'OK', action: 'ok', variant: 'primary' }
            ],
            defaultAction: 'cancel'
        }).then(result => result.action === 'ok');
    },

    prompt(message, defaultValue = '', title = 'Input', placeholder = '') {
        return this.show({
            title,
            message,
            icon: '💬',
            showInput: true,
            inputPlaceholder: placeholder,
            inputValue: defaultValue,
            buttons: [
                { text: 'Cancel', action: 'cancel', variant: 'secondary' },
                { text: 'OK', action: 'ok', variant: 'primary' }
            ],
            defaultAction: 'cancel'
        }).then(result => result.action === 'ok' ? result.value : null);
    }
};

// Initialize popup system on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PopupSystem.init();
});

// ===== LOCALSTORAGE EXPORT/IMPORT SYSTEM =====
// Simple export/import using localStorage - no CORS issues!

// Get all localStorage data as an object
function getAllLocalStorageData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      data[key] = JSON.parse(localStorage.getItem(key));
    } catch (e) {
      // Store as plain string if not valid JSON
      data[key] = localStorage.getItem(key);
    }
  }
  return data;
}

// Export all localStorage data to a downloadable JSON file
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
