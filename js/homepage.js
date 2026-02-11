const grid = document.getElementById('story-grid');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const themeToggle = document.getElementById('theme-toggle');
const codeField = document.querySelector('.code-field');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const helpClose = document.getElementById('help-close');
const helpOk = document.getElementById('help-ok');
const helpBody = document.getElementById('help-body');
const blackout = document.getElementById('blackout');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
const layoutButtons = Array.from(document.querySelectorAll('.layout-btn'));
const sortButtons = Array.from(document.querySelectorAll('.sort-btn'));
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsClose = document.getElementById('settings-close');
const colorGrid = document.getElementById('color-grid');
const resetColorsBtn = document.getElementById('reset-colors');

let stories = [];
let activeFilter = 'all';
let activeLayout = 'grid';
let activeSort = 'default';
let codeRefreshTimer = null;
let cursorRaf = null;
let cursorX = 0.5;
let cursorY = 0.45;
let settingsCurrentTheme = 'dark';
const HELP_TEXT = 'Recovered lab logs, breached files, and field notes. Search, filter, and resume the reports you want to revisit.';

// Default color definitions for both themes
const DEFAULT_COLORS = {
    dark: {
        ink: '#e8f1ff',
        muted: 'rgba(232, 241, 255, 0.68)',
        bg: '#03050b',
        'bg-2': '#0a1220',
        panel: 'rgba(12, 20, 34, 0.92)',
        accent: '#62f7ff',
        'accent-2': '#8dff7b',
        card: 'rgba(12, 20, 34, 0.88)',
        shadow: 'rgba(2, 6, 12, 0.75)',
        grid: 'rgba(98, 247, 255, 0.12)',
        code: 'rgba(98, 247, 200, 0.32)',
        'code-glow': 'rgba(98, 247, 200, 0.7)',
        btn: 'rgba(10, 16, 28, 0.86)',
        'btn-border': 'rgba(98, 247, 255, 0.35)',
        'card-overlay': 'linear-gradient(180deg, rgba(3, 5, 10, 0.08) 0%, rgba(3, 5, 10, 0.9) 100%)',
        'card-overlay-list': 'linear-gradient(90deg, rgba(5, 7, 13, 0.88) 0%, rgba(5, 7, 13, 0.5) 55%, rgba(5, 7, 13, 0.12) 100%)',
        'cursor-glow': 'rgba(98, 247, 255, 0.2)',
    },
    light: {
        ink: '#0b1220',
        muted: 'rgba(11, 18, 32, 0.65)',
        bg: '#eef3f9',
        'bg-2': '#f8fbff',
        panel: 'rgba(255, 255, 255, 0.88)',
        accent: '#0aa6c7',
        'accent-2': '#3b5bff',
        card: 'rgba(255, 255, 255, 0.92)',
        shadow: 'rgba(12, 22, 38, 0.2)',
        grid: 'rgba(10, 166, 199, 0.15)',
        code: 'rgba(10, 166, 199, 0.24)',
        'code-glow': 'rgba(59, 91, 255, 0.45)',
        btn: 'rgba(255, 255, 255, 0.9)',
        'btn-border': 'rgba(11, 18, 32, 0.2)',
        'card-overlay': 'linear-gradient(180deg, rgba(239, 243, 249, 0.1) 0%, rgba(239, 243, 249, 0.4) 100%)',
        'card-overlay-list': 'linear-gradient(90deg, rgba(238, 243, 249, 0.5) 0%, rgba(238, 243, 249, 0.25) 55%, rgba(238, 243, 249, 0.05) 100%)',
        'cursor-glow': 'rgba(59, 91, 255, 0.18)',
    }
};

const COLOR_DESCRIPTIONS = {
    ink: { desc: 'Text color', icon: 'A' },
    muted: { desc: 'Muted text', icon: 'a' },
    bg: { desc: 'Main background', icon: 'bg' },
    'bg-2': { desc: 'Secondary bg', icon: '2bg' },
    panel: { desc: 'Panel bg', icon: 'p' },
    accent: { desc: 'Primary accent', icon: 'ac1' },
    'accent-2': { desc: 'Secondary accent', icon: 'ac2' },
    card: { desc: 'Card background', icon: 'c' },
    shadow: { desc: 'Shadow color', icon: 'shd' },
    grid: { desc: 'Grid pattern', icon: 'gr' },
    code: { desc: 'Code color', icon: 'cd' },
    'code-glow': { desc: 'Code glow', icon: 'cg' },
    btn: { desc: 'Button bg', icon: 'btn' },
    'btn-border': { desc: 'Button border', icon: 'bb' },
    'card-overlay': { desc: 'Card overlay gradient', icon: 'co' },
    'card-overlay-list': { desc: 'Card overlay list gradient', icon: 'cl' },
    'cursor-glow': { desc: 'Cursor glow', icon: 'cg2' },
};

async function loadFonts() {
    try {
        const fonts = window.FONTS || [];
        const fontSelect = document.getElementById('font-select');
        if (fontSelect) {
            fontSelect.innerHTML = '';
            fonts.forEach(font => {
                const option = document.createElement('option');
                option.value = font.family;
                option.textContent = font.name;
                fontSelect.appendChild(option);
            });
            fontSelect.value = loadFont();
        }
    } catch (error) {
        console.error('Error loading fonts:', error);
    }
}

function loadSettings() {
    try {
        const raw = localStorage.getItem('customColors');
        return raw ? JSON.parse(raw) : { dark: {}, light: {} };
    } catch (error) {
        return { dark: {}, light: {} };
    }
}

function saveSettings(settings) {
    localStorage.setItem('customColors', JSON.stringify(settings));
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
    const currentTheme = document.body.dataset.theme || 'dark';
    const target = document.body;
    
    Object.keys(DEFAULT_COLORS.dark).forEach(colorName => {
        const value = getColor(colorName, currentTheme);
        target.style.setProperty(`--${colorName}`, value);
    });
}

function loadFont() {
    try {
        const raw = localStorage.getItem('fontFamily');
        return raw ? raw : "'Share Tech Mono', monospace";
    } catch (error) {
        return "'Share Tech Mono', monospace";
    }
}

function saveFont(font) {
    localStorage.setItem('fontFamily', font);
    applyFont(font);
}

function applyFont(font) {
    document.body.style.fontFamily = font;
}

function loadPanelSettings() {
    if (!settingsPanel) return;

    const saved = localStorage.getItem('panelSettings');
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
    localStorage.setItem('panelSettings', JSON.stringify(settings));
}

async function loadCatalog() {
    if (Array.isArray(window.REPORT_CATALOG)) {
        return window.REPORT_CATALOG;
    }
    try {
        const response = await fetch('database/catalog.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Catalog not found');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        return [];
    }
}

function loadFavorites() {
    try {
        const raw = localStorage.getItem('favorites');
        return new Set(raw ? JSON.parse(raw) : []);
    } catch (error) {
        return new Set();
    }
}

function saveFavorites(favorites) {
    localStorage.setItem('favorites', JSON.stringify(Array.from(favorites)));
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

function matchesSearch(story, query) {
    if (!query) {
        return true;
    }
    const haystack = [story.title, story.description, ...(story.tags || [])]
        .join(' ')
        .toLowerCase();
    return haystack.includes(query.toLowerCase());
}

function isEditableTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

function filterStories(list, favorites, query) {
    return list.filter(story => {
        if (!matchesSearch(story, query)) {
            return false;
        }

        if (activeFilter === 'favorites') {
            return favorites.has(story.id);
        }

        if (activeFilter === 'bookmarks') {
            return !!getBookmark(story.id);
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
        .map(item => item.story);
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
        .map(item => item.story);
}

function sortStories(list) {
    const sorted = [...list];
    if (activeSort === 'title') {
        sorted.sort((a, b) => storyTitle(a).localeCompare(storyTitle(b)));
    } else if (activeSort === 'createdAt') {
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (activeSort === 'updatedAt') {
        sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
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
    const isLight = theme === 'light';
    themeToggle.textContent = isLight ? '🌙' : '☀️';
    themeToggle.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
    themeToggle.setAttribute('aria-pressed', String(isLight));
    localStorage.setItem('homepageTheme', theme);
    applyColors();  // Reapply colors when theme changes
}

function initTheme() {
    const stored = localStorage.getItem('homepageTheme');
    if (stored) {
        applyTheme(stored);
        return;
    }
    const defaultTheme = document.body.dataset.theme;
    if (defaultTheme) {
        applyTheme(defaultTheme);
        return;
    }
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
}

function randomBinary(length) {
    let output = '';
    for (let i = 0; i < length; i += 1) {
        output += Math.random() > 0.5 ? '1' : '0';
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
    codeField.innerHTML = '';
    const count = Math.min(36, Math.max(18, Math.floor(window.innerWidth / 40)));
    for (let i = 0; i < count; i += 1) {
        const line = document.createElement('div');
        line.className = 'code-line';
        seedCodeLine(line);
        codeField.appendChild(line);
    }
    if (codeRefreshTimer) {
        clearInterval(codeRefreshTimer);
    }
    codeRefreshTimer = setInterval(() => {
        codeField.querySelectorAll('.code-line').forEach(updateCodeLine);
    }, 4200);
    updateCursorGlow(cursorX, cursorY);
}

let blackoutTimeInterval = null;

function updateBlackoutTime() {
    const timeElement = document.getElementById('blackout-time');
    if (!timeElement) return;
    
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    timeElement.textContent = `${hours}:${minutes}:${seconds}`;
}

function startBlackoutTimer() {
    updateBlackoutTime();  // Update immediately
    if (blackoutTimeInterval) {
        clearInterval(blackoutTimeInterval);
    }
    blackoutTimeInterval = setInterval(updateBlackoutTime, 100);  // Update 10 times per second for smooth display
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
    document.body.classList.toggle('blackout-active', willShow);
    
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
    codeField.style.setProperty('--cursor-x', `${(xRatio * 100).toFixed(2)}%`);
    codeField.style.setProperty('--cursor-y', `${(yRatio * 100).toFixed(2)}%`);
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
    grid.innerHTML = '';
    const favorites = loadFavorites();
    const query = searchInput.value.trim();

    const filtered = filterStories(stories, favorites, query);
    const sorted = sortStories(filtered);
    const finalStories = sortByBookmark(sorted);

    if (finalStories.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    finalStories.forEach((story, index) => {
        const card = document.createElement('a');
        card.className = 'story-card';
        card.href = `view/viewer.html?story=${story.id}&from=homepage.html`;

        if (story.cover) {
            card.style.backgroundImage = `url('${story.cover}')`;
        }

        if (story.coverPosition) {
            card.style.backgroundPosition = story.coverPosition;
        }

        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = 'bookmark-btn';
        bookmarkBtn.type = 'button';
        bookmarkBtn.textContent = '🔖';
        if (isBookmarked(story.id)) {
            bookmarkBtn.classList.add('active');
        }
        bookmarkBtn.addEventListener('click', event => {
            event.preventDefault();
            if (isBookmarked(story.id)) {
                removeBookmark(story.id);
            } else {
                saveBookmark(story.id, {
                    photoIndex: 0,
                    scrollPosition: 0,
                    timestamp: new Date().toISOString(),
                    source: 'homepage',
                });
            }
            render();
        });

        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-btn';
        favoriteBtn.type = 'button';
        favoriteBtn.textContent = favorites.has(story.id) ? '★' : '☆';
        if (favorites.has(story.id)) {
            favoriteBtn.classList.add('active');
        }
        favoriteBtn.addEventListener('click', event => {
            event.preventDefault();
            if (favorites.has(story.id)) {
                favorites.delete(story.id);
            } else {
                favorites.add(story.id);
            }
            saveFavorites(favorites);
            render();
        });

        const content = document.createElement('div');
        content.className = 'card-content';

        const bookmark = getBookmark(story.id);
        if (bookmark) {
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = 'Resume available';
            content.appendChild(badge);
        }

        const title = document.createElement('h2');
        title.className = 'card-title';
        title.textContent = storyTitle(story, index);

        const desc = document.createElement('p');
        desc.className = 'card-desc';
        desc.textContent = story.description || story.id;

        content.appendChild(title);
        content.appendChild(desc);

        if (story.tags && story.tags.length > 0) {
            const tagRow = document.createElement('div');
            tagRow.className = 'tag-row';
            story.tags.forEach(tag => {
                const pill = document.createElement('span');
                pill.className = 'tag';
                pill.textContent = tag;
                tagRow.appendChild(pill);
            });
            content.appendChild(tagRow);
        }

        card.appendChild(bookmarkBtn);
        card.appendChild(favoriteBtn);
        card.appendChild(content);
        grid.appendChild(card);
    });
}

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeFilter = button.dataset.filter;
        render();
    });
});

searchInput.addEventListener('input', render);
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    render();
});

function applyLayout(layout) {
    activeLayout = layout || 'grid';
    grid.dataset.layout = activeLayout;
    layoutButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.layout === activeLayout);
    });
    localStorage.setItem('homepageLayout', activeLayout);
}

layoutButtons.forEach(button => {
    button.addEventListener('click', () => {
        applyLayout(button.dataset.layout);
    });
});

sortButtons.forEach(button => {
    button.addEventListener('click', () => {
        sortButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeSort = button.dataset.sort;
        render();
    });
});

window.addEventListener('storage', event => {
    if (!event.key) {
        return;
    }
    if (event.key === 'favorites' || event.key.startsWith('bookmark:')) {
        render();
    }
});

async function init() {
    const fontSelect = document.getElementById('font-select');
    if (fontSelect) {
        fontSelect.addEventListener('change', () => {
            saveFont(fontSelect.value);
        });
    }

    stories = sortByDisplayOrder(await loadCatalog());
    applyLayout(localStorage.getItem('homepageLayout') || 'grid');
    initTheme();
    await loadFonts(); // Load fonts for the dropdown
    applyColors();  // Load and apply custom colors
    applyFont(loadFont());  // Load and apply custom font
    buildCodeField();
    initDragging();  // Initialize dragging for settings panel
    render();
}

window.addEventListener('DOMContentLoaded', (event) => {
    init();
});

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
    });
}

if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        if (!helpModal || !helpBody) {
            return;
        }
        helpBody.textContent = HELP_TEXT;
        helpModal.classList.add('is-open');
        helpModal.setAttribute('aria-hidden', 'false');
    });
}

window.addEventListener('resize', () => {
    buildCodeField();
});

function closeHelpModal() {
    if (!helpModal) {
        return;
    }
    helpModal.classList.remove('is-open');
    helpModal.setAttribute('aria-hidden', 'true');
}

if (helpClose) {
    helpClose.addEventListener('click', closeHelpModal);
}

if (helpOk) {
    helpOk.addEventListener('click', closeHelpModal);
}

if (helpModal) {
    helpModal.addEventListener('click', event => {
        if (event.target === helpModal) {
            closeHelpModal();
        }
    });
}

window.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        closeHelpModal();
    }
});

window.addEventListener('keydown', event => {
    if (isEditableTarget(event.target)) {
        return;
    }
    if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        toggleBlackout();
    }
});

window.addEventListener('mousemove', handleCursorMove);
window.addEventListener('touchmove', event => {
    if (event.touches && event.touches[0]) {
        handleCursorMove(event.touches[0]);
    }
}, { passive: true });
// Settings Panel Functions
function renderColorGrid(theme) {
    if (!colorGrid) return;
    colorGrid.innerHTML = '';
    
    const colors = DEFAULT_COLORS[theme];
    Object.entries(colors).forEach(([colorName, defaultValue]) => {
        const currentValue = getColor(colorName, theme);
        const desc = COLOR_DESCRIPTIONS[colorName];
        
        const item = document.createElement('div');
        item.className = 'color-item';
        
        const label = document.createElement('div');
        label.className = 'color-label';
        label.textContent = colorName.replace('-', ' ').toUpperCase();
        
        const labelDesc = document.createElement('div');
        labelDesc.className = 'color-label-desc';
        labelDesc.textContent = desc.desc;
        
        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'color-input-wrapper';
        
        const isGradient = currentValue.includes('linear-gradient');
        
        if (isGradient) {
            // For gradients, use a text input with preview
            const gradientPreview = document.createElement('div');
            gradientPreview.className = 'gradient-preview';
            gradientPreview.style.background = currentValue;
            
            const textInput = document.createElement('input');
            textInput.className = 'gradient-text-input';
            textInput.type = 'text';
            textInput.value = currentValue;
            
            const updateGradientDisplay = (newValue) => {
                gradientPreview.style.background = newValue;
                setColor(colorName, newValue, theme);
            };
            
            textInput.addEventListener('blur', (e) => {
                updateGradientDisplay(e.target.value);
            });
            
            textInput.addEventListener('input', (e) => {
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
            const pickerBtn = document.createElement('button');
            pickerBtn.className = 'color-picker-btn';
            pickerBtn.type = 'button';
            pickerBtn.style.backgroundColor = currentValue;
            
            const hiddenInput = document.createElement('input');
            hiddenInput.className = 'color-picker-input';
            hiddenInput.type = 'color';
            hiddenInput.value = rgbToHex(currentValue);
            
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'color-value';
            valueDisplay.textContent = currentValue;
            
            const updateColorDisplay = (newValue) => {
                pickerBtn.style.backgroundColor = newValue;
                valueDisplay.textContent = newValue;
                setColor(colorName, newValue, theme);
            };
            
            pickerBtn.addEventListener('click', () => hiddenInput.click());
            
            hiddenInput.addEventListener('change', (e) => {
                const hexValue = e.target.value;
                updateColorDisplay(hexValue);
            });
            
            hiddenInput.addEventListener('input', (e) => {
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
    if (color.startsWith('#')) {
        return color;
    }
    
    // If rgba/rgb, convert to hex
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
    
    return '#000000';
}

function openSettings() {
    if (!settingsPanel) return;
    loadPanelSettings();
    settingsPanel.hidden = false;
    settingsCurrentTheme = document.body.dataset.theme || 'dark';
    renderColorGrid(settingsCurrentTheme);
    updateThemeTabs();
}

function closeSettings() {
    if (!settingsPanel) return;
    settingsPanel.hidden = true;
}

function updateThemeTabs() {
    const tabs = Array.from(document.querySelectorAll('.theme-tab'));
    tabs.forEach(tab => {
        const tabTheme = tab.dataset.theme;
        if (tabTheme === settingsCurrentTheme) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function initDragging() {
    if (!settingsPanel) return;
    
    const header = settingsPanel.querySelector('.settings-header');
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startPanelX = 0;
    let startPanelY = 0;
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = settingsPanel.getBoundingClientRect();
        startPanelX = rect.left;
        startPanelY = rect.top;
        settingsPanel.classList.add('dragging');
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newX = startPanelX + deltaX;
        const newY = startPanelY + deltaY;
        
        settingsPanel.style.left = Math.max(0, Math.min(newX, window.innerWidth - settingsPanel.offsetWidth)) + 'px';
        settingsPanel.style.top = Math.max(0, Math.min(newY, window.innerHeight - settingsPanel.offsetHeight)) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            settingsPanel.classList.remove('dragging');
            savePanelSettings();
        }
    });
    
    // Touch support
    header.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            const rect = settingsPanel.getBoundingClientRect();
            startPanelX = rect.left;
            startPanelY = rect.top;
            settingsPanel.classList.add('dragging');
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging || !e.touches[0]) return;
        
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;
        
        const newX = startPanelX + deltaX;
        const newY = startPanelY + deltaY;
        
        settingsPanel.style.left = Math.max(0, Math.min(newX, window.innerWidth - settingsPanel.offsetWidth)) + 'px';
        settingsPanel.style.top = Math.max(0, Math.min(newY, window.innerHeight - settingsPanel.offsetHeight)) + 'px';
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            settingsPanel.classList.remove('dragging');
            savePanelSettings();
        }
    });

    const observer = new ResizeObserver(() => {
        savePanelSettings();
    });
    observer.observe(settingsPanel);
}

if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
}

if (settingsClose) {
    settingsClose.addEventListener('click', closeSettings);
}

if (settingsPanel) {
    settingsPanel.addEventListener('click', (e) => {
        if (e.target === settingsPanel) {
            closeSettings();
        }
    });
    
    // Theme tab switching
    const themeTabs = Array.from(settingsPanel.querySelectorAll('.theme-tab'));
    themeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            settingsCurrentTheme = tab.dataset.theme;
            updateThemeTabs();
            renderColorGrid(settingsCurrentTheme);
        });
    });
}

if (resetColorsBtn) {
    resetColorsBtn.addEventListener('click', () => {
        localStorage.removeItem('customColors');
        applyColors();
        renderColorGrid(settingsCurrentTheme);
    });
}

// Close settings with Escape key
window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && settingsPanel && !settingsPanel.hidden) {
        closeSettings();
    }
});
