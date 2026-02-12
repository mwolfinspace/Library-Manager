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
let titleSortDirection = "asc"; // 'asc' for A-Z, 'desc' for Z-A
let codeRefreshTimer = null;
let cursorRaf = null;
let cursorX = 0.5;
let cursorY = 0.45;
let settingsCurrentTheme = "dark";

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
      fontSelect.value = loadFont();
    }
  } catch (error) {
    console.error("Error loading fonts:", error);
  }
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

function loadFont() {
  try {
    const raw = localStorage.getItem("fontFamily");
    return raw ? raw : "'Share Tech Mono', monospace";
  } catch (error) {
    return "'Share Tech Mono', monospace";
  }
}

function saveFont(font) {
  localStorage.setItem("fontFamily", font);
  applyFont(font);
}

function applyFont(font) {
  document.body.style.fontFamily = font;
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

function loadSortPreference() {
  try {
    const raw = localStorage.getItem("homepageSort");
    const sortData = raw
      ? JSON.parse(raw)
      : { type: "default", direction: "asc" };
    return sortData;
  } catch (error) {
    return { type: "default", direction: "asc" };
  }
}

function saveSortPreference(sortType, direction = "asc") {
  const sortData = { type: sortType, direction: direction };
  localStorage.setItem("homepageSort", JSON.stringify(sortData));
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
    const direction = titleSortDirection === "asc" ? 1 : -1;
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
    // Sort by priority: Favorite > Pinned > Normal, then by recent activity
    sorted.sort((a, b) => {
      const favorites = loadFavorites();
      const aBookmark = getBookmark(a.id);
      const bBookmark = getBookmark(b.id);

      const aIsFavorite = favorites.has(a.id);
      const bIsFavorite = favorites.has(b.id);
      // Use pinned status for priority grouping (separate from reading progress bookmarks)
      const aIsPinned = isPinned(a.id);
      const bIsPinned = isPinned(b.id);

      // Priority: Favorite > Pinned > Normal
      if (aIsFavorite !== bIsFavorite) {
        return aIsFavorite ? -1 : 1;
      }
      if (aIsPinned !== bIsPinned) {
        return aIsPinned ? -1 : 1;
      }

      // If same priority, sort by recent activity
      // For favorites, we want them to stay at the top regardless of normal story views
      // So we use a special timestamp logic:
      // - Favorites: use a very high timestamp to keep them at top of their group
      // - Pinned: use bookmark timestamp or updatedAt
      // - Normal: use bookmark timestamp or updatedAt
      let aTime, bTime;

      if (aIsFavorite) {
        // Favorites get a high priority timestamp to stay at top
        aTime =
          9999999999999 -
          (aBookmark?.timestamp
            ? new Date(aBookmark.timestamp).getTime()
            : new Date(a.updatedAt || a.createdAt).getTime());
      } else {
        aTime = aBookmark?.timestamp
          ? new Date(aBookmark.timestamp).getTime()
          : new Date(a.updatedAt || a.createdAt).getTime();
      }

      if (bIsFavorite) {
        // Favorites get a high priority timestamp to stay at top
        bTime =
          9999999999999 -
          (bBookmark?.timestamp
            ? new Date(bBookmark.timestamp).getTime()
            : new Date(b.updatedAt || b.createdAt).getTime());
      } else {
        bTime = bBookmark?.timestamp
          ? new Date(bBookmark.timestamp).getTime()
          : new Date(b.updatedAt || b.createdAt).getTime();
      }

      return bTime - aTime;
    });
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

function toggleBlackout() {
  if (!blackout) {
    return;
  }
  const willShow = blackout.hidden;
  blackout.hidden = !willShow;
  document.body.classList.toggle("blackout-active", willShow);

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
  const finalStories = sortByBookmark(sorted);

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
      if (isPinned(story.id)) {
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
      if (favorites.has(story.id)) {
        favorites.delete(story.id);
      } else {
        favorites.add(story.id);
      }
      saveFavorites(favorites);
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
    sortDirection: titleSortDirection,
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
    titleSortDirection = state.sortDirection || "asc";
    applySortPreference({ type: activeSort, direction: titleSortDirection });
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
  titleSortDirection = sortData.direction || "asc";

  sortButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === activeSort);
    if (button.dataset.sort === "title" && activeSort === "title") {
      button.textContent =
        titleSortDirection === "asc" ? "Title A-Z" : "Title Z-A";
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

    if (sortType === "title" && activeSort === "title") {
      // Toggle title sort direction
      titleSortDirection = titleSortDirection === "asc" ? "desc" : "asc";
      button.textContent =
        titleSortDirection === "asc" ? "Title A-Z" : "Title Z-A";
    } else {
      // Reset title sort direction for new sort type
      titleSortDirection = "asc";
      sortButtons.forEach((btn) => {
        if (btn.dataset.sort === "title") {
          btn.textContent = "Title";
        }
      });
    }

    sortButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    activeSort = sortType;
    saveSortPreference(activeSort, titleSortDirection);
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

async function init() {
  const loader = {
    overlay: document.getElementById("loader-overlay"),
    progressBar: document.getElementById("progress-bar"),
    status: document.getElementById("loading-status"),
    logo: document.querySelector(".loader-logo"),
  };

  const page = document.querySelector(".page");
  if (page) page.style.opacity = "0";

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
      savedState?.sort || loadSortPreference()?.type || "default";
    const sortDirection =
      savedState?.sortDirection || loadSortPreference()?.direction || "asc";

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
        if (page) page.style.opacity = "1";
        loader.overlay.addEventListener("transitionend", () => {
          if (loader.overlay) loader.overlay.hidden = true;
        });
      }
    }, 250);
  } catch (error) {
    if (loader.status) setLoadingStatus(`Fatal error: ${error.message}.`);
    console.error(error);
    if (loader.overlay) loader.overlay.style.backgroundColor = "red"; // Indicate error
  }
}

window.addEventListener("DOMContentLoaded", (event) => {
  init();

  const modalTabs = document.querySelectorAll("#help-modal .modal-tab");
  const modalTabContents = document.querySelectorAll(
    "#help-modal .modal-tab-content",
  );

  modalTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      modalTabs.forEach((t) => t.classList.remove("active"));
      modalTabContents.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const content = document.querySelector(
        `#help-modal .modal-tab-content[data-content="${tab.dataset.tab}"]`,
      );
      if (content) {
        content.classList.add("active");
      }
    });
  });
});

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
  if (event.code === "Space" || event.key === " ") {
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
  // If already hex, return it
  if (color.startsWith("#")) {
    return color;
  }

  // If rgba/rgb, convert to hex
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1]).toString(16).padStart(2, "0");
    const g = parseInt(match[2]).toString(16).padStart(2, "0");
    const b = parseInt(match[3]).toString(16).padStart(2, "0");
    return "#" + r + g + b;
  }

  return "#000000";
}

function openSettings() {
  if (!settingsPanel) return;
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

  // Touch support
  header.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      isDragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      const rect = settingsPanel.getBoundingClientRect();
      startPanelX = rect.left;
      startPanelY = rect.top;
      settingsPanel.classList.add("dragging");
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
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", openSettings);
}

if (settingsClose) {
  settingsClose.addEventListener("click", closeSettings);
}

if (settingsPanel) {
  settingsPanel.addEventListener("click", (e) => {
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

// Close settings with Escape key
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && settingsPanel && !settingsPanel.hidden) {
    closeSettings();
  }
});

// Reset all bookmarks functionality with confirmation dialog
function resetAllBookmarks() {
  // Count bookmarks before clearing
  let bookmarkCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("bookmark:")) {
      bookmarkCount++;
    }
  }

  if (bookmarkCount === 0) {
    alert("No bookmarks to reset. All reports are already marked as 'New'.");
    return;
  }

  // Show confirmation dialog
  const confirmed = confirm(
    `⚠️ WARNING: Reset Reading Progress\n\n` +
    `You are about to clear ${bookmarkCount} bookmark(s).\n\n` +
    `This will:\n` +
    `• Remove all reading progress timestamps\n` +
    `• Mark all reports as "New" and unread\n` +
    `• This action CANNOT be undone\n\n` +
    `Are you sure you want to continue?\n\n` +
    `Click "OK" to reset all bookmarks, or "Cancel" to keep your progress.`
  );

  if (confirmed) {
    // Clear all bookmark entries
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("bookmark:")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Re-render to show "New" badges
    render();

    // Show success message
    alert(`✅ Success!\n\n${bookmarkCount} bookmark(s) have been cleared.\nAll reports are now marked as "New".`);

    console.log(`Reset ${bookmarkCount} bookmarks`);
  } else {
    console.log("Bookmark reset cancelled by user");
  }
}

// Attach reset button listener
const resetBookmarksBtn = document.getElementById("reset-bookmarks-btn");
if (resetBookmarksBtn) {
  resetBookmarksBtn.addEventListener("click", resetAllBookmarks);
}

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
