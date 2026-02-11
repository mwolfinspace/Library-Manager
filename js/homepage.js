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

let stories = [];
let activeFilter = 'all';
let activeLayout = 'grid';
let codeRefreshTimer = null;
let cursorRaf = null;
let cursorX = 0.5;
let cursorY = 0.45;
const HELP_TEXT = 'Recovered lab logs, breached files, and field notes. Search, filter, and resume the reports you want to revisit.';

async function loadCatalog() {
    try {
        const response = await fetch('database/catalog.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Catalog not found');
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        if (Array.isArray(window.REPORT_CATALOG)) {
            return window.REPORT_CATALOG;
        }
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
    const haystack = [story.title, story.description, story.reportNumber, ...(story.tags || [])]
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

function toggleBlackout() {
    if (!blackout) {
        return;
    }
    const willShow = blackout.hidden;
    blackout.hidden = !willShow;
    document.body.classList.toggle('blackout-active', willShow);
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

    const filtered = sortByBookmark(filterStories(stories, favorites, query));

    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    filtered.forEach((story, index) => {
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

window.addEventListener('storage', event => {
    if (!event.key) {
        return;
    }
    if (event.key === 'favorites' || event.key.startsWith('bookmark:')) {
        render();
    }
});

async function init() {
    stories = sortByDisplayOrder(await loadCatalog());
    applyLayout(localStorage.getItem('homepageLayout') || 'grid');
    initTheme();
    buildCodeField();
    render();
}

init();

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
