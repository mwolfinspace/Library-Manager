        const chooseFolderBtn = document.getElementById('choose-folder');
        const openRecentBtn = document.getElementById('open-recent');
        const scanLibraryBtn = document.getElementById('scan-library');
        const reloadCatalogBtn = document.getElementById('reload-catalog');
        const updateFontsBtn = document.getElementById('update-fonts');
        const fixMissingBtn = document.getElementById('fix-missing');
        const openHomepageBtn = document.getElementById('open-homepage');
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const helpClose = document.getElementById('help-close');
        const helpOk = document.getElementById('help-ok');
        const helpBody = document.getElementById('help-body');
        const autoScanToggle = document.getElementById('auto-scan');
        const statusEl = document.getElementById('status');
        const recentInfoEl = document.getElementById('recent-info');
        const statusBarText = document.getElementById('status-bar-text');
        const statusBarRecent = document.getElementById('status-bar-recent');
        const storyForm = document.getElementById('story-form');
        const reportNumberInput = document.getElementById('report-number');
        const reportTitleInput = document.getElementById('report-title');
        const reportDescriptionInput = document.getElementById('report-description');
        const reportTagsInput = document.getElementById('report-tags');
        const coverPositionInput = document.getElementById('cover-position');
        const coverPickerBtn = document.getElementById('cover-picker-btn');
        const setCoverPositionBtn = document.getElementById('set-cover-position-btn');
        const coverSummary = document.getElementById('cover-summary');
        const addImagesBtn = document.getElementById('add-images-btn');
        const removeImagesBtn = document.getElementById('remove-images-btn');
        const uploadCoverMediaBtn = document.getElementById('upload-cover-media-btn');
        const clearCoverMediaBtn = document.getElementById('clear-cover-media-btn');
        const imageManagerSummary = document.getElementById('image-manager-summary');
        const imageCardGrid = document.getElementById('image-card-grid');
        const imagePanel = document.querySelector('.image-panel');
        const imageManagerInput = document.getElementById('image-manager-input');
        const replaceImageInput = document.getElementById('replace-image-input');
        const coverMediaInput = document.getElementById('cover-media-input');
        const cardHeightDecBtn = document.getElementById('card-height-dec');
        const cardHeightIncBtn = document.getElementById('card-height-inc');
        const cardHeightValue = document.getElementById('card-height-value');
        const markdownToolbar = document.getElementById('markdown-toolbar');
        const coverPositionOverlay = document.getElementById('cover-position-overlay');
        const coverPositionFrame = document.getElementById('cover-position-frame');
        const coverLayoutViewport = document.getElementById('cover-layout-viewport');
        const coverLayoutLabel = document.getElementById('cover-layout-label');
        const coverPresetModes = document.getElementById('cover-preset-modes');
        const coverPresetGrid = document.getElementById('cover-preset-grid');
        const coverPresetHint = document.getElementById('cover-preset-hint');
        const coverPosTop = document.getElementById('cover-pos-top');
        const coverPosUp = document.getElementById('cover-pos-up');
        const coverPosDown = document.getElementById('cover-pos-down');
        const coverPosBottom = document.getElementById('cover-pos-bottom');
        const coverPosLeft = document.getElementById('cover-pos-left');
        const coverPosRight = document.getElementById('cover-pos-right');
        const coverPositionClose = document.getElementById('cover-position-close');
        const coverPositionSaveLayout = document.getElementById('cover-position-save-layout');
        const coverPositionReset = document.getElementById('cover-position-reset');
        const coverPositionCancel = document.getElementById('cover-position-cancel');
        const coverPositionSave = document.getElementById('cover-position-save');
        const mediaPreviewOverlay = document.getElementById('media-preview-overlay');
        const mediaPreviewClose = document.getElementById('media-preview-close');
        const mediaPreviewImage = document.getElementById('media-preview-image');
        const mediaPreviewVideo = document.getElementById('media-preview-video');
        const storyTextInput = document.getElementById('story-text');
        const storyFileInput = document.getElementById('story-file');
        const storyListEl = document.getElementById('story-list');
        const closeAfterSaveToggle = document.getElementById('close-after-save');
        const loadStoryBtn = document.getElementById('load-story-btn');
        const clearFormBtn = document.getElementById('clear-form');
        const removeSelectedBtn = document.getElementById('remove-selected');
        const cleanupSelectedBtn = document.getElementById('cleanup-selected');
        const deleteFilesCheckbox = document.getElementById('delete-files');
        const dialogOverlay = document.getElementById('dialog-overlay');
        const dialogTitle = document.getElementById('dialog-title');
        const dialogIcon = document.getElementById('dialog-icon');
        const dialogMessage = document.getElementById('dialog-message');
        const dialogInput = document.getElementById('dialog-input');
        const dialogCancelBtn = document.getElementById('dialog-cancel');
        const dialogConfirmBtn = document.getElementById('dialog-confirm');
        const dialogCloseBtn = document.getElementById('dialog-close');

        const state = {
            rootHandle: null,
            stories: [],
            selectedId: null,
            selectedEntry: null,
        };

        const AUTO_SCAN_KEY = 'dataManagerAutoScan';
        const RECENT_FOLDER_KEY = 'dataManagerRecentFolder';
        const RECENT_STORY_KEY = 'dataManagerRecentStory';
        const RECENT_STORY_TITLE_KEY = 'dataManagerRecentStoryTitle';
        const RECENT_FOLDER_TIME_KEY = 'dataManagerRecentFolderTime';
        const IMAGE_CARD_HEIGHT_KEY = 'dataManagerImageCardHeight';
        const CLOSE_AFTER_SAVE_KEY = 'dataManagerCloseAfterSave';
        const LIBRARY_BASE_URL_MAP_KEY = 'dataManagerLibraryBaseUrlMap';
        const RECENT_HANDLE_DB = 'story1-manager';
        const RECENT_HANDLE_STORE = 'handles';
        const RECENT_HANDLE_ID = 'library';
        const RECENT_RELOCATE_HANDLE_ID = 'relocate-start';
        const HOMEPAGE_ENTRY_CANDIDATES = ['homepage.html', 'index.html'];
        const VIEWER_ENTRY_CANDIDATES = ['view/viewer.html', 'viewer.html'];
        const libraryPreviewAssetUrlCache = new Map();
        const libraryPreviewPageUrls = new Set();
        const libraryFileLookupCache = new Map();
        const LIBRARY_FILE_SEARCH_MAX_DEPTH = 6;
        const DEFAULT_SETTINGS = {
            theme: 'dark',
            fontSize: 16,
            lineSpacing: 1.6,
            scrollStep: 40,
            zoomStep: 0.1,
            keyboardMode: 'default',
            panKeys: true,
            rememberZoom: true,
            rememberViewAll: false,
            fontFamily: 'tech',
            customFont: '',
            customBindings: {},
        };
        const HELP_TEXT = [
            'Create, update, or remove reports.',
            'This manager writes the catalog, moves images into the correct folder, and rebuilds the library database.',
            'Leave Report Number empty to auto-assign the next available number.',
            'Use "Scan Files" to rebuild from disk, "Fix Missing Files" to repair links, and "Save Story" to update entries.'
        ].join('\n');
        const COVER_PRESET_POINTS = {
            grid: { x: [14, 50, 86], y: [14, 50, 86] },
            list: { x: [10, 50, 90], y: [18, 50, 82] },
            compact: { x: [12, 50, 88], y: [16, 50, 84] },
            spotlight: { x: [8, 50, 92], y: [12, 50, 88] },
        };
        const COVER_LAYOUT_KEYS = ['grid', 'list', 'compact', 'spotlight'];
        const COVER_LAYOUT_VIEWPORTS = {
            grid: { aspect: 1.12, scale: 0.84, label: 'Grid' },
            list: { aspect: 3.15, scale: 0.94, label: 'List' },
            compact: { aspect: 210 / 297, scale: 0.86, label: 'Compact' },
            spotlight: { aspect: 1.28, scale: 0.9, label: 'Spotlight' },
        };
        const DEFAULT_HOMEPAGE_COLORS = {
            dark: {
                ink: '#e8f1ff',
                muted: '#e8f1ff',
                bg: '#03050b',
                'bg-2': '#0a1220',
                panel: '#0c1422',
                accent: '#62f7ff',
                'accent-2': '#8dff7b',
                card: '#0c1422',
                shadow: '#02060c',
                grid: '#62f7ff',
            },
            light: {
                ink: '#0b1220',
                muted: '#0b1220',
                bg: '#eef3f9',
                'bg-2': '#f8fbff',
                panel: '#ffffff',
                accent: '#0aa6c7',
                'accent-2': '#3b5bff',
                card: '#ffffff',
                shadow: '#0c1626',
                grid: '#0aa6c7',
            },
        };
        const DEFAULT_HOMEPAGE_SETTINGS = {
            theme: 'dark',
            fontFamily: "'Share Tech Mono', monospace",
            customFont: '',
            fontSize: 14,
            headerSize: 26,
            buttonFontSize: 12,
            cardFontSize: 13,
            skipAgeVerify: false,
            skipWelcome: false,
            keybinds: {},
            customColors: DEFAULT_HOMEPAGE_COLORS,
        };
        const DEFAULT_DATABASE_DATA = {
            favorites: [],
            pinned: [],
            bookmarks: {},
        };

        function toFiniteNumber(value, fallback) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : fallback;
        }

        function toBoolean(value, fallback = false) {
            if (typeof value === 'boolean') {
                return value;
            }
            if (value === 'true') {
                return true;
            }
            if (value === 'false') {
                return false;
            }
            return fallback;
        }

        function normalizeBindingMap(bindings) {
            const normalized = {};
            if (!bindings || typeof bindings !== 'object') {
                return normalized;
            }
            Object.entries(bindings).forEach(([action, key]) => {
                const normalizedKey = normalizeKey(key);
                if (normalizedKey) {
                    normalized[action] = normalizedKey;
                }
            });
            return normalized;
        }

        function normalizeColorTheme(themeColors, fallbackTheme) {
            const merged = { ...fallbackTheme };
            if (!themeColors || typeof themeColors !== 'object') {
                return merged;
            }
            Object.entries(themeColors).forEach(([name, value]) => {
                if (typeof value === 'string' && value.trim()) {
                    merged[name] = value.trim();
                }
            });
            return merged;
        }

        function normalizeHomepageColors(colors) {
            const source = colors && typeof colors === 'object' ? colors : {};
            return {
                dark: normalizeColorTheme(source.dark, DEFAULT_HOMEPAGE_COLORS.dark),
                light: normalizeColorTheme(source.light, DEFAULT_HOMEPAGE_COLORS.light),
            };
        }

        function extractHomepageSettings(raw = {}) {
            const nestedSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
            const nestedSizes = nestedSettings.fontSizes && typeof nestedSettings.fontSizes === 'object'
                ? nestedSettings.fontSizes
                : {};
            const nestedSkip = nestedSettings.skipPreferences && typeof nestedSettings.skipPreferences === 'object'
                ? nestedSettings.skipPreferences
                : {};
            const nestedKeybinds = nestedSettings.keybinds && typeof nestedSettings.keybinds === 'object'
                ? nestedSettings.keybinds
                : {};

            const resolvedTheme = (nestedSettings.theme || raw.theme || DEFAULT_HOMEPAGE_SETTINGS.theme) === 'light'
                ? 'light'
                : 'dark';
            const resolvedFontFamily = nestedSettings.fontFamily || raw.fontFamily || DEFAULT_HOMEPAGE_SETTINGS.fontFamily;
            const resolvedColors = raw.customColors || raw.colors || DEFAULT_HOMEPAGE_SETTINGS.customColors;

            return {
                theme: resolvedTheme,
                fontFamily: resolvedFontFamily,
                customFont: typeof raw.customFont === 'string' ? raw.customFont : DEFAULT_HOMEPAGE_SETTINGS.customFont,
                fontSize: Math.round(toFiniteNumber(raw.fontSize, toFiniteNumber(nestedSizes.base, DEFAULT_HOMEPAGE_SETTINGS.fontSize))),
                headerSize: Math.round(toFiniteNumber(raw.headerSize, toFiniteNumber(nestedSizes.header, DEFAULT_HOMEPAGE_SETTINGS.headerSize))),
                buttonFontSize: Math.round(toFiniteNumber(raw.buttonFontSize, toFiniteNumber(raw.buttonSize, toFiniteNumber(nestedSizes.button, DEFAULT_HOMEPAGE_SETTINGS.buttonFontSize)))),
                cardFontSize: Math.round(toFiniteNumber(raw.cardFontSize, toFiniteNumber(raw.cardSize, toFiniteNumber(nestedSizes.card, DEFAULT_HOMEPAGE_SETTINGS.cardFontSize)))),
                skipAgeVerify: toBoolean(raw.skipAgeVerify, toBoolean(nestedSkip.skipAgeVerify, DEFAULT_HOMEPAGE_SETTINGS.skipAgeVerify)),
                skipWelcome: toBoolean(raw.skipWelcome, toBoolean(nestedSkip.skipWelcome, DEFAULT_HOMEPAGE_SETTINGS.skipWelcome)),
                keybinds: normalizeBindingMap(raw.keybinds || nestedKeybinds),
                customColors: normalizeHomepageColors(resolvedColors),
            };
        }

        function extractViewerSettings(raw = {}) {
            const nestedViewer = raw.viewerSettings && typeof raw.viewerSettings === 'object' ? raw.viewerSettings : {};
            return {
                theme: (nestedViewer.theme || raw.theme || DEFAULT_SETTINGS.theme) === 'light' ? 'light' : 'dark',
                fontSize: Math.round(toFiniteNumber(nestedViewer.fontSize, toFiniteNumber(raw.fontSize, DEFAULT_SETTINGS.fontSize))),
                lineSpacing: toFiniteNumber(nestedViewer.lineSpacing, toFiniteNumber(raw.lineSpacing, DEFAULT_SETTINGS.lineSpacing)),
                scrollStep: Math.round(toFiniteNumber(nestedViewer.scrollStep, toFiniteNumber(raw.scrollStep, DEFAULT_SETTINGS.scrollStep))),
                zoomStep: toFiniteNumber(nestedViewer.zoomStep, toFiniteNumber(raw.zoomStep, DEFAULT_SETTINGS.zoomStep)),
                keyboardMode: nestedViewer.keyboardMode || raw.keyboardMode || DEFAULT_SETTINGS.keyboardMode,
                panKeys: toBoolean(nestedViewer.panKeys, toBoolean(raw.panKeys, DEFAULT_SETTINGS.panKeys)),
                rememberZoom: toBoolean(nestedViewer.rememberZoom, toBoolean(raw.rememberZoom, DEFAULT_SETTINGS.rememberZoom)),
                rememberViewAll: toBoolean(nestedViewer.rememberViewAll, toBoolean(raw.rememberViewAll, DEFAULT_SETTINGS.rememberViewAll)),
                fontFamily: nestedViewer.fontFamily || raw.fontFamily || DEFAULT_SETTINGS.fontFamily,
                customFont: nestedViewer.customFont || raw.customFont || DEFAULT_SETTINGS.customFont,
                customBindings: normalizeBindingMap(nestedViewer.customBindings || raw.customBindings || {}),
            };
        }

        function composeSettingsFile(existing = {}, homepageSettings = DEFAULT_HOMEPAGE_SETTINGS, viewerSettings = DEFAULT_SETTINGS) {
            const normalizedHomepage = {
                ...DEFAULT_HOMEPAGE_SETTINGS,
                ...homepageSettings,
                keybinds: normalizeBindingMap(homepageSettings.keybinds),
                customColors: normalizeHomepageColors(homepageSettings.customColors),
            };
            const normalizedViewer = {
                ...DEFAULT_SETTINGS,
                ...viewerSettings,
                customBindings: normalizeBindingMap(viewerSettings.customBindings),
            };

            return {
                ...existing,
                version: existing.version || '1.0.0',
                lastUpdated: new Date().toISOString(),
                settings: {
                    ...(existing.settings && typeof existing.settings === 'object' ? existing.settings : {}),
                    theme: normalizedHomepage.theme,
                    fontFamily: normalizedHomepage.customFont || normalizedHomepage.fontFamily,
                    fontSizes: {
                        base: normalizedHomepage.fontSize,
                        header: normalizedHomepage.headerSize,
                        button: normalizedHomepage.buttonFontSize,
                        card: normalizedHomepage.cardFontSize,
                    },
                    skipPreferences: {
                        skipAgeVerify: normalizedHomepage.skipAgeVerify,
                        skipWelcome: normalizedHomepage.skipWelcome,
                    },
                    keybinds: normalizeBindingMap(normalizedHomepage.keybinds),
                },
                colors: normalizeHomepageColors(normalizedHomepage.customColors),
                viewerSettings: normalizedViewer,
                data: existing.data && typeof existing.data === 'object' ? existing.data : DEFAULT_DATABASE_DATA,
                theme: normalizedHomepage.theme,
                fontFamily: normalizedHomepage.fontFamily,
                customFont: normalizedHomepage.customFont,
                fontSize: normalizedHomepage.fontSize,
                headerSize: normalizedHomepage.headerSize,
                buttonSize: normalizedHomepage.buttonFontSize,
                cardSize: normalizedHomepage.cardFontSize,
                buttonFontSize: normalizedHomepage.buttonFontSize,
                cardFontSize: normalizedHomepage.cardFontSize,
                skipAgeVerify: normalizedHomepage.skipAgeVerify,
                skipWelcome: normalizedHomepage.skipWelcome,
                keybinds: normalizeBindingMap(normalizedHomepage.keybinds),
                customColors: normalizeHomepageColors(normalizedHomepage.customColors),
                lineSpacing: normalizedViewer.lineSpacing,
                scrollStep: normalizedViewer.scrollStep,
                zoomStep: normalizedViewer.zoomStep,
                keyboardMode: normalizedViewer.keyboardMode,
                panKeys: normalizedViewer.panKeys,
                rememberZoom: normalizedViewer.rememberZoom,
                rememberViewAll: normalizedViewer.rememberViewAll,
                customBindings: normalizeBindingMap(normalizedViewer.customBindings),
            };
        }

        function syncSettingsToLocalStorage(settingsData) {
            const homepageSettings = extractHomepageSettings(settingsData);
            const viewerSettings = extractViewerSettings(settingsData);

            const homepageFontFamily = homepageSettings.customFont && homepageSettings.customFont.trim()
                ? homepageSettings.customFont.trim()
                : homepageSettings.fontFamily;

            localStorage.setItem('homepageTheme', homepageSettings.theme);
            localStorage.setItem('homepageFont', JSON.stringify({
                family: homepageFontFamily,
                fallback: 'monospace',
            }));
            localStorage.setItem('homepageFontSizes', JSON.stringify({
                base: homepageSettings.fontSize,
                header: homepageSettings.headerSize,
                button: homepageSettings.buttonFontSize,
                card: homepageSettings.cardFontSize,
            }));
            localStorage.setItem('skipPreferences', JSON.stringify({
                skipAgeVerify: homepageSettings.skipAgeVerify,
                skipWelcome: homepageSettings.skipWelcome,
            }));
            localStorage.setItem('customColors', JSON.stringify(homepageSettings.customColors));
            localStorage.setItem('homepageKeybinds', JSON.stringify(homepageSettings.keybinds));
            localStorage.setItem('homepageSettings', JSON.stringify(homepageSettings));
            localStorage.setItem('viewerSettings', JSON.stringify(viewerSettings));
            localStorage.setItem('hpFromParent', JSON.stringify(homepageSettings));
            localStorage.setItem('vFromParent', JSON.stringify(viewerSettings));

            let cachedDb = {};
            try {
                cachedDb = JSON.parse(localStorage.getItem('xedryk_database') || '{}') || {};
            } catch (error) {
                cachedDb = {};
            }

            const dbSnapshot = {
                version: settingsData.version || cachedDb.version || '1.0.0',
                lastUpdated: settingsData.lastUpdated || new Date().toISOString(),
                settings: settingsData.settings || {},
                colors: settingsData.colors || homepageSettings.customColors,
                viewerSettings: settingsData.viewerSettings || viewerSettings,
                data: cachedDb.data || settingsData.data || DEFAULT_DATABASE_DATA,
            };
            localStorage.setItem('xedryk_database', JSON.stringify(dbSnapshot));
        }

        async function saveMergedSettings({ homepagePatch = null, viewerPatch = null } = {}) {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                showToast('Choose a library folder first.', 'error');
                return null;
            }

            const databaseDir = await getDatabaseDir();
            const existing = (await readJsonFile(databaseDir, 'settings.json')) || {};

            const homepageSettings = {
                ...extractHomepageSettings(existing),
                ...(homepagePatch || {}),
            };
            homepageSettings.keybinds = normalizeBindingMap(homepageSettings.keybinds);
            homepageSettings.customColors = normalizeHomepageColors(homepageSettings.customColors);

            const viewerSettings = {
                ...extractViewerSettings(existing),
                ...(viewerPatch || {}),
            };
            viewerSettings.customBindings = normalizeBindingMap(viewerSettings.customBindings);

            const merged = composeSettingsFile(existing, homepageSettings, viewerSettings);
            await writeFile(databaseDir, 'settings.json', JSON.stringify(merged, null, 2));
            syncSettingsToLocalStorage(merged);

            if (state.stories.length === 0) {
                await loadLibrary();
            }
            await writeCatalog(state.stories);
            return merged;
        }

        let workingMediaItems = [];
        let selectedMediaIds = new Set();
        let mediaDragId = null;
        let mediaDropIndex = null;
        let mediaDropPlaceholderEl = null;
        let selectedStoryIds = new Set();
        let storyDragId = null;
        let storyDropIndex = null;
        let storyDropPlaceholderEl = null;
        let coverSelection = null;
        let externalCoverMedia = null;
        let coverPosition = { x: 50, y: 50 };
        let coverViewportPosition = { x: 50, y: 50 };
        let coverPositionsByLayout = {};
        let coverPositionsByLayoutBeforeEdit = null;
        let coverPositionBeforeEdit = null;
        let coverViewportPositionBeforeEdit = null;
        let coverDragging = false;
        let coverDragStart = { x: 0, y: 0, posX: 50, posY: 50 };
        let coverPositionPreviewEl = null;
        let coverPresetMode = 'grid';
        let mediaIdCounter = 0;
        let imageCardHeight = 148;
        let pendingReplaceMediaId = null;
        const mediaObjectUrls = new Map();
        let imageManagerRefreshQueued = false;

        function setStatus(message) {
            if (statusEl) {
                statusEl.textContent = message;
            }
            if (statusBarText) {
                statusBarText.textContent = message;
            }
        }

        // Toast Notification System
        const toastContainer = document.getElementById('toast-container');

        function inferToastType(message, requestedType = 'info') {
            const normalized = String(requestedType || 'info').toLowerCase();
            const knownTypes = new Set(['success', 'error', 'warning', 'info']);
            if (normalized !== 'info' && knownTypes.has(normalized)) {
                return normalized;
            }

            const text = String(message || '').toLowerCase();
            if (/(error|failed|unable|denied|invalid|cancelled)/.test(text)) {
                return 'error';
            }
            if (/(warn|warning|missing|skip|caution)/.test(text)) {
                return 'warning';
            }
            if (/(saved|opened|loaded|updated|added|removed|fixed|done|completed|success)/.test(text)) {
                return 'success';
            }
            return 'info';
        }

        function getToastIcon(type) {
            const iconMap = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️',
            };
            return iconMap[type] || iconMap.info;
        }
        
        function showToast(message, type = 'info', duration = 3000) {
            if (!toastContainer) return;
            const resolvedType = inferToastType(message, type);
            
            const toast = document.createElement('div');
            toast.className = `toast ${resolvedType}`;

            const icon = document.createElement('span');
            icon.className = 'toast-icon';
            icon.textContent = getToastIcon(resolvedType);

            const messageEl = document.createElement('span');
            messageEl.className = 'toast-message';
            messageEl.textContent = String(message ?? '');

            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = 'toast-close';
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.textContent = '✕';
            closeBtn.addEventListener('click', () => {
                toast.remove();
            });

            toast.appendChild(icon);
            toast.appendChild(messageEl);
            toast.appendChild(closeBtn);
            
            toastContainer.appendChild(toast);
            
            // Trigger animation
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });
            
            // Auto remove
            const safeDuration = Number.isFinite(duration) ? Math.max(600, duration) : 3000;
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }, safeDuration);
        }

        let dialogOpen = false;

        function getDialogIconByType(type) {
            const map = {
                info: 'ℹ️',
                success: '✅',
                warning: '⚠️',
                error: '❌',
            };
            return map[type] || map.info;
        }

        async function showThemedDialog({
            title = 'Confirm',
            message = '',
            type = 'info',
            showInput = false,
            inputValue = '',
            inputPlaceholder = '',
            confirmText = 'OK',
            cancelText = 'Cancel',
            allowCancel = true,
            dangerConfirm = false,
        } = {}) {
            if (!dialogOverlay || !dialogTitle || !dialogIcon || !dialogMessage || !dialogInput || !dialogConfirmBtn || !dialogCancelBtn || !dialogCloseBtn) {
                return { confirmed: false, value: null };
            }
            if (dialogOpen) {
                return { confirmed: false, value: null };
            }
            dialogOpen = true;

            dialogTitle.textContent = title;
            dialogIcon.textContent = getDialogIconByType(type);
            dialogMessage.textContent = message;

            dialogInput.hidden = !showInput;
            dialogInput.value = inputValue || '';
            dialogInput.placeholder = inputPlaceholder || '';

            dialogConfirmBtn.textContent = confirmText;
            dialogConfirmBtn.classList.toggle('danger', !!dangerConfirm);
            dialogCancelBtn.textContent = cancelText;
            dialogCancelBtn.hidden = !allowCancel;
            dialogCloseBtn.hidden = !allowCancel;

            dialogOverlay.hidden = false;
            requestAnimationFrame(() => {
                dialogOverlay.classList.add('is-open');
            });

            return new Promise(resolve => {
                let settled = false;

                const finish = result => {
                    if (settled) {
                        return;
                    }
                    settled = true;
                    document.removeEventListener('keydown', onKeyDown);
                    dialogOverlay.removeEventListener('click', onOverlayClick);
                    dialogConfirmBtn.removeEventListener('click', onConfirm);
                    dialogCancelBtn.removeEventListener('click', onCancel);
                    dialogCloseBtn.removeEventListener('click', onCancel);
                    dialogInput.removeEventListener('keydown', onInputKeyDown);
                    dialogOverlay.classList.remove('is-open');
                    dialogOverlay.hidden = true;
                    dialogOpen = false;
                    resolve(result);
                };

                const onConfirm = () => {
                    finish({
                        confirmed: true,
                        value: showInput ? dialogInput.value : null,
                    });
                };

                const onCancel = () => {
                    finish({
                        confirmed: false,
                        value: showInput ? dialogInput.value : null,
                    });
                };

                const onOverlayClick = event => {
                    if (!allowCancel) {
                        return;
                    }
                    if (event.target === dialogOverlay) {
                        onCancel();
                    }
                };

                const onKeyDown = event => {
                    if (event.key === 'Escape' && allowCancel) {
                        event.preventDefault();
                        onCancel();
                        return;
                    }
                    if (event.key === 'Enter' && !showInput) {
                        event.preventDefault();
                        onConfirm();
                    }
                };

                const onInputKeyDown = event => {
                    if (!showInput) {
                        return;
                    }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        onConfirm();
                    } else if (event.key === 'Escape' && allowCancel) {
                        event.preventDefault();
                        onCancel();
                    }
                };

                document.addEventListener('keydown', onKeyDown);
                dialogOverlay.addEventListener('click', onOverlayClick);
                dialogConfirmBtn.addEventListener('click', onConfirm);
                dialogCancelBtn.addEventListener('click', onCancel);
                dialogCloseBtn.addEventListener('click', onCancel);
                dialogInput.addEventListener('keydown', onInputKeyDown);

                setTimeout(() => {
                    if (showInput) {
                        dialogInput.focus();
                        dialogInput.select();
                    } else {
                        dialogConfirmBtn.focus();
                    }
                }, 0);
            });
        }

        async function themedConfirm(message, options = {}) {
            const result = await showThemedDialog({
                title: options.title || 'Confirm',
                message,
                type: options.type || 'warning',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                allowCancel: true,
                dangerConfirm: !!options.dangerConfirm,
            });
            return !!result.confirmed;
        }

        async function themedPrompt(message, options = {}) {
            const result = await showThemedDialog({
                title: options.title || 'Input',
                message,
                type: options.type || 'info',
                showInput: true,
                inputValue: options.inputValue || '',
                inputPlaceholder: options.inputPlaceholder || '',
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'Cancel',
                allowCancel: true,
                dangerConfirm: false,
            });
            if (!result.confirmed) {
                return null;
            }
            return result.value;
        }

        function openHelpModal() {
            if (!helpModal || !helpBody) {
                return;
            }
            helpBody.textContent = HELP_TEXT;
            helpModal.classList.add('is-open');
            helpModal.setAttribute('aria-hidden', 'false');
        }

        function closeHelpModal() {
            if (!helpModal) {
                return;
            }
            helpModal.classList.remove('is-open');
            helpModal.setAttribute('aria-hidden', 'true');
        }

        function openHandleDb() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(RECENT_HANDLE_DB, 1);
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(RECENT_HANDLE_STORE)) {
                        db.createObjectStore(RECENT_HANDLE_STORE);
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }

        async function saveStoredHandle(key, handle) {
            try {
                const db = await openHandleDb();
                await new Promise((resolve, reject) => {
                    const tx = db.transaction(RECENT_HANDLE_STORE, 'readwrite');
                    tx.objectStore(RECENT_HANDLE_STORE).put(handle, key);
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => reject(tx.error);
                });
            } catch (error) {
                // ignore
            }
        }

        async function loadStoredHandle(key) {
            try {
                const db = await openHandleDb();
                return await new Promise((resolve, reject) => {
                    const tx = db.transaction(RECENT_HANDLE_STORE, 'readonly');
                    const request = tx.objectStore(RECENT_HANDLE_STORE).get(key);
                    request.onsuccess = () => resolve(request.result || null);
                    request.onerror = () => reject(request.error);
                });
            } catch (error) {
                return null;
            }
        }

        async function saveRecentHandle(handle) {
            await saveStoredHandle(RECENT_HANDLE_ID, handle);
        }

        async function loadRecentHandle() {
            return loadStoredHandle(RECENT_HANDLE_ID);
        }

        async function saveRelocateStartHandle(handle) {
            await saveStoredHandle(RECENT_RELOCATE_HANDLE_ID, handle);
        }

        async function loadRelocateStartHandle() {
            return loadStoredHandle(RECENT_RELOCATE_HANDLE_ID);
        }

        async function pickRelocationFile(pickerOptions) {
            const baseOptions = {
                multiple: false,
                id: 'data-manager-fix-missing-relocate',
                ...pickerOptions,
            };
            const startHandle = await loadRelocateStartHandle();
            try {
                const options = startHandle
                    ? { ...baseOptions, startIn: startHandle }
                    : baseOptions;
                const [handle] = await window.showOpenFilePicker(options);
                if (handle) {
                    await saveRelocateStartHandle(handle);
                }
                return handle || null;
            } catch (error) {
                if (error && error.name === 'AbortError') {
                    throw error;
                }
                if (!startHandle) {
                    throw error;
                }
                const [fallbackHandle] = await window.showOpenFilePicker(baseOptions);
                if (fallbackHandle) {
                    await saveRelocateStartHandle(fallbackHandle);
                }
                return fallbackHandle || null;
            }
        }

        function updateRecentInfo() {
            const folder = localStorage.getItem(RECENT_FOLDER_KEY);
            const storyTitle = localStorage.getItem(RECENT_STORY_TITLE_KEY);
            const folderTime = localStorage.getItem(RECENT_FOLDER_TIME_KEY);
            const timeText = folderTime ? ` • ${new Date(folderTime).toLocaleString()}` : '';

            const folderText = folder ? `Recent folder: ${folder}${timeText}` : 'Recent folder: none';
            const storyText = storyTitle ? `Recent story: ${storyTitle}` : 'Recent story: none';
            if (recentInfoEl) {
                recentInfoEl.textContent = `${folderText} • ${storyText}`;
            }
            if (statusBarRecent) {
                statusBarRecent.textContent = `${folderText} • ${storyText}`;
            }
            if (openRecentBtn) {
                openRecentBtn.disabled = !folder;
            }
        }

        async function tryUseRecentHandle(auto = false) {
            const handle = await loadRecentHandle();
            if (!handle) {
                if (!auto) {
                    setStatus('No recent folder saved yet.');
                }
                return;
            }
            let permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted' && !auto) {
                permission = await handle.requestPermission({ mode: 'readwrite' });
            }
            if (permission !== 'granted') {
                if (!auto) {
                    setStatus('Permission denied for recent folder.');
                }
                return;
            }

            state.rootHandle = handle;
            clearLibraryPreviewCaches();
            releaseAllMediaUrls();
            await ensureStructure();
            await loadLibrary();
            await loadFontsIntoSelect();
            const count = state.stories.length;
            setStatus(`Loaded ${count} stories from ${state.rootHandle.name}.`);
            showToast(`📂 Opened "${state.rootHandle.name}" with ${count} story(ies)`, 'success');
        }

        function saveRecentFolder(handle) {
            if (!handle) return;
            localStorage.setItem(RECENT_FOLDER_KEY, handle.name || 'Library');
            localStorage.setItem(RECENT_FOLDER_TIME_KEY, new Date().toISOString());
            updateRecentInfo();
            saveRecentHandle(handle);
        }

        function saveRecentStory(entry) {
            if (!entry) return;
            const title = entry.title || (entry.reportNumber ? `The Report #${entry.reportNumber}` : entry.id);
            localStorage.setItem(RECENT_STORY_KEY, entry.id);
            localStorage.setItem(RECENT_STORY_TITLE_KEY, title);
            updateRecentInfo();
        }

        function getLibraryBaseUrlStorageKey() {
            if (!state.rootHandle || !state.rootHandle.name) {
                return '';
            }
            return String(state.rootHandle.name).trim().toLowerCase();
        }

        function loadLibraryBaseUrlMap() {
            try {
                const raw = localStorage.getItem(LIBRARY_BASE_URL_MAP_KEY);
                if (!raw) {
                    return {};
                }
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                    return {};
                }
                return parsed;
            } catch (error) {
                return {};
            }
        }

        function saveLibraryBaseUrlMap(map) {
            if (!map || typeof map !== 'object' || Array.isArray(map)) {
                return;
            }
            localStorage.setItem(LIBRARY_BASE_URL_MAP_KEY, JSON.stringify(map));
        }

        function getStoredLibraryBaseUrl() {
            const key = getLibraryBaseUrlStorageKey();
            if (!key) {
                return '';
            }
            const map = loadLibraryBaseUrlMap();
            const value = map[key];
            return typeof value === 'string' ? value : '';
        }

        function saveStoredLibraryBaseUrl(baseUrl) {
            const key = getLibraryBaseUrlStorageKey();
            if (!key) {
                return;
            }
            const map = loadLibraryBaseUrlMap();
            map[key] = baseUrl;
            saveLibraryBaseUrlMap(map);
        }

        function normalizeLibraryBaseUrl(rawValue) {
            const raw = String(rawValue || '').trim();
            if (!raw) {
                return '';
            }

            let candidate = raw;
            if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
                const normalizedPath = raw.replace(/\\/g, '/');
                if (/^[a-zA-Z]:\//.test(normalizedPath)) {
                    candidate = `file:///${normalizedPath}`;
                } else if (normalizedPath.startsWith('//')) {
                    candidate = `file:${normalizedPath}`;
                } else if (normalizedPath.startsWith('/')) {
                    candidate = `file://${normalizedPath}`;
                } else {
                    return '';
                }
            }

            try {
                const url = new URL(candidate);
                if (url.protocol !== 'file:' && url.protocol !== 'http:' && url.protocol !== 'https:') {
                    return '';
                }

                const normalizedPath = url.pathname.replace(/\\/g, '/');
                if (/\.(html?)$/i.test(normalizedPath)) {
                    url.pathname = normalizedPath.replace(/[^/]*$/, '');
                } else {
                    url.pathname = normalizedPath;
                }
                if (!url.pathname.endsWith('/')) {
                    url.pathname = `${url.pathname}/`;
                }
                url.search = '';
                url.hash = '';
                return url.href;
            } catch (error) {
                return '';
            }
        }

        function buildRelativeLibraryBaseUrl() {
            if (!state.rootHandle || !state.rootHandle.name) {
                return '';
            }
            const folderName = String(state.rootHandle.name).trim();
            try {
                const pathSegments = decodeURIComponent(window.location.pathname || '')
                    .replace(/\\/g, '/')
                    .split('/')
                    .filter(Boolean);
                const target = folderName.toLowerCase();
                const selectedFolderIndex = pathSegments.reduce((match, segment, index) => (
                    segment.toLowerCase() === target ? index : match
                ), -1);

                if (selectedFolderIndex >= 0) {
                    const tailCount = pathSegments.length - (selectedFolderIndex + 1);
                    const upCount = Math.max(0, tailCount - 1);
                    const relative = upCount > 0 ? '../'.repeat(upCount) : './';
                    return new URL(relative, window.location.href).href;
                }

                const encodedName = encodeURIComponent(folderName);
                return new URL(`../${encodedName}/`, window.location.href).href;
            } catch (error) {
                return '';
            }
        }

        function isManagerInsideSelectedLibrary() {
            if (!state.rootHandle || !state.rootHandle.name) {
                return true;
            }
            try {
                const folderName = String(state.rootHandle.name).trim();
                if (!folderName) {
                    return true;
                }
                const pathname = decodeURIComponent(window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
                const needle = `/${folderName.toLowerCase()}/`;
                return pathname.includes(needle);
            } catch (error) {
                return true;
            }
        }

        async function promptForLibraryBaseUrl() {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                showToast('Choose a library folder first.', 'error');
                return '';
            }
            const suggested = getStoredLibraryBaseUrl() || buildRelativeLibraryBaseUrl();
            const input = await themedPrompt(
                [
                    'Set your library folder URL/path for Homepage/Preview links.',
                    'Use a file URL or Windows path.',
                    'Example: file:///D:/Desktop/Xedryk%27s_Report1/',
                    'Example: D:\\Desktop\\Xedryk\'s_Report1',
                ].join('\n'),
                {
                    title: 'Library URL',
                    type: 'info',
                    inputValue: suggested,
                    inputPlaceholder: 'file:///D:/path/to/library/',
                    confirmText: 'Save URL',
                },
            );
            if (input === null) {
                return '';
            }

            const normalized = normalizeLibraryBaseUrl(input);
            if (!normalized) {
                setStatus('Invalid library URL/path. URL not saved.');
                showToast('Invalid library URL/path.', 'error');
                return '';
            }

            saveStoredLibraryBaseUrl(normalized);
            setStatus(`Saved library URL for "${state.rootHandle.name}".`);
            showToast('Library URL saved for this library.', 'success');
            return normalized;
        }

        async function resolveLibraryLaunchBaseUrl() {
            const relativeBase = buildRelativeLibraryBaseUrl();
            if (isManagerInsideSelectedLibrary()) {
                return relativeBase;
            }

            const saved = normalizeLibraryBaseUrl(getStoredLibraryBaseUrl());
            if (saved) {
                if (saved !== getStoredLibraryBaseUrl()) {
                    saveStoredLibraryBaseUrl(saved);
                }
                return saved;
            }

            if (window.location.protocol !== 'file:') {
                return relativeBase;
            }

            const configuredBase = await promptForLibraryBaseUrl();
            if (configuredBase) {
                return configuredBase;
            }

            setStatus('Using relative links. Set Library URL if Homepage/Preview opens the wrong location.');
            return relativeBase;
        }

        function createMediaId() {
            mediaIdCounter += 1;
            return `media_${Date.now()}_${mediaIdCounter}`;
        }

        function getFileExtension(name = '') {
            const match = String(name).toLowerCase().match(/\.([a-z0-9]+)$/i);
            return match ? match[1] : '';
        }

        function detectCoverMediaType(name = '', mime = '') {
            const ext = getFileExtension(name);
            const lowerMime = String(mime || '').toLowerCase();
            if (lowerMime.startsWith('video/') || /^(mp4|webm|ogg|mov|m4v|avi)$/.test(ext)) {
                return 'video';
            }
            if (ext === 'gif' || lowerMime.includes('gif')) {
                return 'gif';
            }
            return 'image';
        }

        function createMediaItemFromFile(file) {
            return {
                id: createMediaId(),
                source: 'new',
                file,
                path: '',
                name: file.name,
                mediaType: detectCoverMediaType(file.name, file.type),
                previewUrl: '',
                previewMissing: false,
                previewPending: false,
            };
        }

        function createMediaItemFromPath(path = '') {
            const name = getFileName(path) || 'image';
            return {
                id: createMediaId(),
                source: 'existing',
                file: null,
                path,
                name,
                mediaType: detectCoverMediaType(name),
                previewUrl: '',
                previewMissing: false,
                previewPending: false,
            };
        }

        function getMediaItemById(itemId) {
            return workingMediaItems.find(item => item.id === itemId) || null;
        }

        function getMediaObjectUrl(key, file) {
            if (!file) return '';
            if (mediaObjectUrls.has(key)) {
                return mediaObjectUrls.get(key);
            }
            const url = URL.createObjectURL(file);
            mediaObjectUrls.set(key, url);
            return url;
        }

        function queueImageManagerRefresh() {
            if (imageManagerRefreshQueued) {
                return;
            }
            imageManagerRefreshQueued = true;
            Promise.resolve().then(() => {
                imageManagerRefreshQueued = false;
                renderImageManager();
            });
        }

        async function resolveExistingMediaPreviewUrl(item, force = false) {
            if (!item) {
                return '';
            }
            if (item.source === 'new' && item.file) {
                return getMediaObjectUrl(item.id, item.file);
            }
            if (!item.path) {
                item.previewUrl = '';
                item.previewMissing = true;
                return '';
            }
            if (item.previewUrl && !force) {
                return item.previewUrl;
            }
            if (item.previewPending) {
                return item.previewUrl || '';
            }
            if (item.previewMissing && !force) {
                return '';
            }

            item.previewPending = true;
            try {
                const resolved = await resolveLibraryPreviewAssetUrl(item.path);
                item.previewUrl = resolved || '';
                item.previewMissing = !resolved;
                return item.previewUrl;
            } finally {
                item.previewPending = false;
            }
        }

        async function resolveExternalCoverPreviewUrl(force = false) {
            if (!externalCoverMedia) {
                return '';
            }
            if (externalCoverMedia.source === 'new' && externalCoverMedia.file) {
                return getMediaObjectUrl('__external_cover__', externalCoverMedia.file);
            }
            if (!externalCoverMedia.path) {
                externalCoverMedia.previewUrl = '';
                externalCoverMedia.previewMissing = true;
                return '';
            }
            if (externalCoverMedia.previewUrl && !force) {
                return externalCoverMedia.previewUrl;
            }
            if (externalCoverMedia.previewPending) {
                return externalCoverMedia.previewUrl || '';
            }
            if (externalCoverMedia.previewMissing && !force) {
                return '';
            }

            externalCoverMedia.previewPending = true;
            try {
                const resolved = await resolveLibraryPreviewAssetUrl(externalCoverMedia.path);
                externalCoverMedia.previewUrl = resolved || '';
                externalCoverMedia.previewMissing = !resolved;
                return externalCoverMedia.previewUrl;
            } finally {
                externalCoverMedia.previewPending = false;
            }
        }

        function getMediaPreviewUrl(item) {
            if (!item) return '';
            if (item.source === 'new' && item.file) {
                return getMediaObjectUrl(item.id, item.file);
            }
            if (item.previewUrl) {
                return item.previewUrl;
            }
            if (!item.previewPending && !item.previewMissing && item.path) {
                void resolveExistingMediaPreviewUrl(item).then(() => {
                    queueImageManagerRefresh();
                }).catch(() => {
                    queueImageManagerRefresh();
                });
            }
            return '';
        }

        function getExternalCoverPreviewUrl() {
            if (!externalCoverMedia) return '';
            if (externalCoverMedia.source === 'new' && externalCoverMedia.file) {
                return getMediaObjectUrl('__external_cover__', externalCoverMedia.file);
            }
            if (externalCoverMedia.previewUrl) {
                return externalCoverMedia.previewUrl;
            }
            if (!externalCoverMedia.previewPending && !externalCoverMedia.previewMissing && externalCoverMedia.path) {
                void resolveExternalCoverPreviewUrl().then(() => {
                    queueImageManagerRefresh();
                }).catch(() => {
                    queueImageManagerRefresh();
                });
            }
            return '';
        }

        function releaseUnusedMediaUrls() {
            const keepKeys = new Set();
            workingMediaItems.forEach(item => {
                if (item.source === 'new' && item.file) {
                    keepKeys.add(item.id);
                }
            });
            if (externalCoverMedia && externalCoverMedia.source === 'new' && externalCoverMedia.file) {
                keepKeys.add('__external_cover__');
            }
            Array.from(mediaObjectUrls.keys()).forEach(key => {
                if (!keepKeys.has(key)) {
                    URL.revokeObjectURL(mediaObjectUrls.get(key));
                    mediaObjectUrls.delete(key);
                }
            });
        }

        function releaseAllMediaUrls() {
            mediaObjectUrls.forEach(url => URL.revokeObjectURL(url));
            mediaObjectUrls.clear();
        }

        function normalizeCoverPosition(value) {
            if (!value || value === 'center') {
                return { x: 50, y: 50 };
            }
            const raw = String(value).trim();
            const singleMatch = raw.match(/^(-?\d+(?:\.\d+)?)(%)?$/);
            if (singleMatch) {
                const single = parseFloat(singleMatch[1]);
                if (Number.isFinite(single)) {
                    const clamped = Math.max(0, Math.min(100, single));
                    return { x: clamped, y: clamped };
                }
            }
            const pairMatch = raw.match(/(-?\d+(?:\.\d+)?)%?\s*[ ,]\s*(-?\d+(?:\.\d+)?)%?/);
            if (pairMatch) {
                const x = parseFloat(pairMatch[1]);
                const y = parseFloat(pairMatch[2]);
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    return {
                        x: Math.max(0, Math.min(100, x)),
                        y: Math.max(0, Math.min(100, y)),
                    };
                }
            }
            return { x: 50, y: 50 };
        }

        function formatCoverPositionValue(position) {
            const x = Math.max(0, Math.min(100, position.x));
            const y = Math.max(0, Math.min(100, position.y));
            return `${x.toFixed(0)}% ${y.toFixed(0)}%`;
        }

        function getCoverPreviewMediaAspect() {
            if (coverPositionPreviewEl) {
                if (coverPositionPreviewEl.tagName === 'VIDEO') {
                    const vw = coverPositionPreviewEl.videoWidth || 0;
                    const vh = coverPositionPreviewEl.videoHeight || 0;
                    if (vw > 0 && vh > 0) {
                        return vw / vh;
                    }
                } else if (coverPositionPreviewEl.tagName === 'IMG') {
                    const iw = coverPositionPreviewEl.naturalWidth || 0;
                    const ih = coverPositionPreviewEl.naturalHeight || 0;
                    if (iw > 0 && ih > 0) {
                        return iw / ih;
                    }
                }
            }
            return 1;
        }

        function computeCoverMediaRender(width, height, mediaAspect) {
            const safeWidth = Math.max(1, Number(width) || 1);
            const safeHeight = Math.max(1, Number(height) || 1);
            const aspect = Number.isFinite(mediaAspect) && mediaAspect > 0 ? mediaAspect : 1;
            const containerAspect = safeWidth / safeHeight;
            if (containerAspect > aspect) {
                const renderWidth = safeWidth;
                const renderHeight = renderWidth / aspect;
                return { width: renderWidth, height: renderHeight };
            }
            const renderHeight = safeHeight;
            const renderWidth = renderHeight * aspect;
            return { width: renderWidth, height: renderHeight };
        }

        function estimateHomepageLayoutAspect(mode) {
            const normalizedMode = sanitizeCoverPresetMode(mode);
            const viewportWidth = Math.max(360, window.innerWidth - 44);
            if (normalizedMode === 'grid') {
                let cols = 4;
                if (window.innerWidth <= 600) cols = 1;
                else if (window.innerWidth <= 900) cols = 2;
                else if (window.innerWidth <= 1200) cols = 3;
                const gap = 20;
                const cardWidth = (viewportWidth - (gap * (cols - 1))) / cols;
                return Math.max(0.9, Math.min(2.4, cardWidth / 240));
            }
            if (normalizedMode === 'list') {
                return Math.max(4, Math.min(12, viewportWidth / 170));
            }
            if (normalizedMode === 'compact') {
                return 210 / 297;
            }
            if (normalizedMode === 'spotlight') {
                const gap = 24;
                const minCardWidth = 320;
                const cols = Math.max(1, Math.floor((viewportWidth + gap) / (minCardWidth + gap)));
                const cardWidth = (viewportWidth - (gap * (cols - 1))) / cols;
                return Math.max(1, Math.min(2.4, cardWidth / 300));
            }
            return 1.2;
        }

        function getCoverLayoutViewportSpec(mode = coverPresetMode) {
            const normalizedMode = sanitizeCoverPresetMode(mode);
            const base = COVER_LAYOUT_VIEWPORTS[normalizedMode] || COVER_LAYOUT_VIEWPORTS.grid;
            return {
                ...base,
                aspect: estimateHomepageLayoutAspect(normalizedMode),
            };
        }

        function getCoverLayoutViewportMetrics(mode = coverPresetMode, rect = null) {
            const frameRect = rect || (coverPositionFrame ? coverPositionFrame.getBoundingClientRect() : null);
            if (!frameRect || !frameRect.width || !frameRect.height) {
                return null;
            }
            const spec = getCoverLayoutViewportSpec(mode);
            const maxWidth = frameRect.width * spec.scale;
            const maxHeight = frameRect.height * spec.scale;
            let width = maxWidth;
            let height = width / spec.aspect;
            if (height > maxHeight) {
                height = maxHeight;
                width = height * spec.aspect;
            }
            const viewportWidth = Math.max(56, Math.round(width));
            const viewportHeight = Math.max(56, Math.round(height));
            const clampedX = Math.max(0, Math.min(100, coverViewportPosition.x));
            const clampedY = Math.max(0, Math.min(100, coverViewportPosition.y));
            const maxLeft = Math.max(0, frameRect.width - viewportWidth);
            const maxTop = Math.max(0, frameRect.height - viewportHeight);
            const left = maxLeft * (clampedX / 100);
            const top = maxTop * (clampedY / 100);
            return {
                spec,
                width: viewportWidth,
                height: viewportHeight,
                left,
                top,
            };
        }

        function getEffectiveCoverPosition(mode = coverPresetMode) {
            const baseX = Math.max(0, Math.min(100, coverPosition.x));
            const baseY = Math.max(0, Math.min(100, coverPosition.y));
            if (!(coverPositionOverlay && !coverPositionOverlay.hidden && coverPositionPreviewEl && coverPositionFrame)) {
                return { x: baseX, y: baseY };
            }

            const frameRect = coverPositionFrame.getBoundingClientRect();
            if (!frameRect.width || !frameRect.height) {
                return { x: baseX, y: baseY };
            }

            const viewport = getCoverLayoutViewportMetrics(mode, frameRect);
            if (!viewport) {
                return { x: baseX, y: baseY };
            }

            const mediaAspect = getCoverPreviewMediaAspect();
            const frameMedia = computeCoverMediaRender(frameRect.width, frameRect.height, mediaAspect);
            const frameLeft = (frameRect.width - frameMedia.width) * (baseX / 100);
            const frameTop = (frameRect.height - frameMedia.height) * (baseY / 100);
            const sourceX = Math.max(0, Math.min(1, ((viewport.left + (viewport.width / 2)) - frameLeft) / frameMedia.width));
            const sourceY = Math.max(0, Math.min(1, ((viewport.top + (viewport.height / 2)) - frameTop) / frameMedia.height));

            const finalAspect = viewport.spec.aspect;
            const finalWidth = finalAspect >= 1 ? finalAspect : 1;
            const finalHeight = finalAspect >= 1 ? 1 : (1 / finalAspect);
            const finalMedia = computeCoverMediaRender(finalWidth, finalHeight, mediaAspect);
            const denomX = finalWidth - finalMedia.width;
            const denomY = finalHeight - finalMedia.height;

            const solvedX = Math.abs(denomX) > 0.000001
                ? ((finalWidth * 0.5 - (sourceX * finalMedia.width)) / denomX) * 100
                : baseX;
            const solvedY = Math.abs(denomY) > 0.000001
                ? ((finalHeight * 0.5 - (sourceY * finalMedia.height)) / denomY) * 100
                : baseY;

            return {
                x: Math.max(0, Math.min(100, solvedX)),
                y: Math.max(0, Math.min(100, solvedY)),
            };
        }

        function normalizeCoverPositionMap(rawMap, fallbackValue = '50% 50%') {
            const fallback = formatCoverPositionValue(normalizeCoverPosition(fallbackValue));
            const source = rawMap && typeof rawMap === 'object' ? rawMap : {};
            const normalized = {};
            COVER_LAYOUT_KEYS.forEach(mode => {
                const candidate = typeof source[mode] === 'string' && source[mode].trim()
                    ? source[mode]
                    : fallback;
                normalized[mode] = formatCoverPositionValue(normalizeCoverPosition(candidate));
            });
            return normalized;
        }

        function loadCoverPositionForMode(mode) {
            const normalizedMode = sanitizeCoverPresetMode(mode);
            const fallback = coverPositionInput && coverPositionInput.value ? coverPositionInput.value : '50% 50%';
            const map = normalizeCoverPositionMap(coverPositionsByLayout, fallback);
            coverPositionsByLayout = map;
            return map[normalizedMode] || map.grid || fallback;
        }

        function saveCoverPositionForMode(mode) {
            const normalizedMode = sanitizeCoverPresetMode(mode);
            const value = formatCoverPositionValue(getEffectiveCoverPosition(normalizedMode));
            const fallback = coverPositionInput && coverPositionInput.value ? coverPositionInput.value : value;
            const map = normalizeCoverPositionMap(coverPositionsByLayout, fallback);
            map[normalizedMode] = value;
            coverPositionsByLayout = map;
            if (coverPositionInput) {
                coverPositionInput.value = value;
            }
            updateCoverSummary();
            return value;
        }

        function normalizeCoverSelection() {
            if (coverSelection && coverSelection.kind === 'image') {
                if (!getMediaItemById(coverSelection.itemId)) {
                    coverSelection = null;
                }
            }
            if (coverSelection && coverSelection.kind === 'external' && !externalCoverMedia) {
                coverSelection = null;
            }
            if (!coverSelection && externalCoverMedia) {
                coverSelection = { kind: 'external' };
            }
            if (!coverSelection && workingMediaItems.length > 0) {
                coverSelection = { kind: 'image', itemId: workingMediaItems[0].id };
            }
        }

        function updateCoverSummary() {
            if (!coverSummary) return;
            normalizeCoverSelection();
            const mode = sanitizeCoverPresetMode(coverPresetMode);
            const savedMap = normalizeCoverPositionMap(coverPositionsByLayout, coverPositionInput && coverPositionInput.value ? coverPositionInput.value : '50% 50%');
            coverPositionsByLayout = savedMap;
            const modePosition = savedMap[mode] || savedMap.grid || '50% 50%';
            const currentPosition = formatCoverPositionValue(getEffectiveCoverPosition(mode));
            const posLabel = currentPosition === modePosition
                ? `${mode}: ${currentPosition}`
                : `${mode}: ${currentPosition} (saved ${modePosition})`;

            if (coverSelection && coverSelection.kind === 'external' && externalCoverMedia) {
                const label = `${formatMediaTypeLabel(externalCoverMedia.mediaType)} cover`;
                const name = externalCoverMedia.name || getFileName(externalCoverMedia.path) || 'cover media';
                coverSummary.textContent = `Cover: ${label} (${name}) • Homepage only • Position: ${posLabel}`;
                return;
            }

            if (coverSelection && coverSelection.kind === 'image') {
                const item = getMediaItemById(coverSelection.itemId);
                if (item) {
                    coverSummary.textContent = `Cover: ${item.name} • Position: ${posLabel}`;
                    return;
                }
            }

            coverSummary.textContent = `Cover: none • Position: ${posLabel}`;
        }

        function updateImageManagerSummary() {
            if (!imageManagerSummary) return;
            normalizeCoverSelection();
            const total = workingMediaItems.length;
            const selected = selectedMediaIds.size;
            let coverText = 'No cover selected';
            if (coverSelection && coverSelection.kind === 'external') {
                coverText = 'Homepage cover';
            } else if (coverSelection && coverSelection.kind === 'image') {
                coverText = 'Story media cover';
            }
            imageManagerSummary.textContent = `${total} media item(s) in story • ${selected} selected • ${coverText}`;
        }

        function normalizeKey(key) {
            if (key === null || key === undefined) {
                return '';
            }
            if (key === ' ') {
                return 'space';
            }
            const normalized = String(key).trim().toLowerCase();
            const aliases = {
                spacebar: 'space',
                esc: 'escape',
                return: 'enter',
                del: 'delete',
            };
            return aliases[normalized] || normalized;
        }

        function formatMediaTypeLabel(mediaType) {
            if (mediaType === 'video') return 'Video';
            if (mediaType === 'gif') return 'GIF';
            return 'Image';
        }

        function formatMediaTypeBadge(mediaType) {
            if (mediaType === 'video') return '🎬 VIDEO';
            if (mediaType === 'gif') return 'GIF';
            return '';
        }

        function appendMediaTypeBadge(card, mediaType) {
            const badgeText = formatMediaTypeBadge(mediaType);
            if (!card || !badgeText) {
                return;
            }
            const badge = document.createElement('span');
            badge.className = 'media-type-badge';
            badge.textContent = badgeText;
            card.classList.add('has-media-type-badge');
            card.appendChild(badge);
        }

        function getCurrentCoverPreviewUrl() {
            normalizeCoverSelection();
            if (coverSelection && coverSelection.kind === 'external') {
                return getExternalCoverPreviewUrl();
            }
            if (coverSelection && coverSelection.kind === 'image') {
                const item = getMediaItemById(coverSelection.itemId);
                return getMediaPreviewUrl(item);
            }
            return '';
        }

        async function resolveCurrentCoverPreviewUrl(force = false) {
            normalizeCoverSelection();
            if (coverSelection && coverSelection.kind === 'external') {
                return resolveExternalCoverPreviewUrl(force);
            }
            if (coverSelection && coverSelection.kind === 'image') {
                const item = getMediaItemById(coverSelection.itemId);
                return resolveExistingMediaPreviewUrl(item, force);
            }
            return '';
        }

        function getCurrentCoverMediaType() {
            normalizeCoverSelection();
            if (coverSelection && coverSelection.kind === 'external' && externalCoverMedia) {
                return externalCoverMedia.mediaType || 'image';
            }
            if (coverSelection && coverSelection.kind === 'image') {
                const item = getMediaItemById(coverSelection.itemId);
                return item && item.mediaType ? item.mediaType : 'image';
            }
            return '';
        }

        function reorderMediaToIndex(dragId, targetIndex) {
            if (!dragId) {
                return false;
            }
            const fromIndex = workingMediaItems.findIndex(item => item.id === dragId);
            if (fromIndex < 0) {
                return false;
            }
            const [moved] = workingMediaItems.splice(fromIndex, 1);
            const clampedIndex = Math.max(0, Math.min(workingMediaItems.length, Number.isFinite(targetIndex) ? targetIndex : workingMediaItems.length));
            workingMediaItems.splice(clampedIndex, 0, moved);
            return clampedIndex !== fromIndex;
        }

        function clearMediaDropPlaceholder() {
            mediaDropIndex = null;
            if (imageCardGrid) {
                imageCardGrid.classList.remove('drag-active');
            }
            if (mediaDropPlaceholderEl && mediaDropPlaceholderEl.parentElement) {
                mediaDropPlaceholderEl.remove();
            }
        }

        function ensureMediaDropPlaceholder(height) {
            if (!mediaDropPlaceholderEl) {
                mediaDropPlaceholderEl = document.createElement('div');
                mediaDropPlaceholderEl.className = 'image-drop-placeholder';
            }
            if (height && Number.isFinite(height)) {
                mediaDropPlaceholderEl.style.height = `${Math.max(48, Math.round(height))}px`;
                mediaDropPlaceholderEl.style.minHeight = `${Math.max(48, Math.round(height))}px`;
            }
            return mediaDropPlaceholderEl;
        }

        function getDropIndexFromClientY(elements, clientY) {
            let index = elements.length;
            for (let i = 0; i < elements.length; i += 1) {
                const rect = elements[i].getBoundingClientRect();
                if (clientY < rect.top + rect.height / 2) {
                    index = i;
                    break;
                }
            }
            return index;
        }

        function autoScrollDuringDrag(container, clientY) {
            if (!container) {
                return;
            }
            const rect = container.getBoundingClientRect();
            const edgeSize = 42;
            if (clientY < rect.top + edgeSize) {
                const delta = Math.max(6, Math.ceil((rect.top + edgeSize - clientY) / 5));
                container.scrollTop -= delta;
            } else if (clientY > rect.bottom - edgeSize) {
                const delta = Math.max(6, Math.ceil((clientY - (rect.bottom - edgeSize)) / 5));
                container.scrollTop += delta;
            }
        }

        function updateMediaDropPlaceholder(clientY) {
            if (!imageCardGrid || !mediaDragId) {
                return;
            }
            autoScrollDuringDrag(imageCardGrid, clientY);
            const cards = Array.from(imageCardGrid.querySelectorAll('.image-card[data-id]'))
                .filter(card => card.dataset.id !== mediaDragId && !card.classList.contains('dragging'));
            const nextIndex = getDropIndexFromClientY(cards, clientY);
            mediaDropIndex = nextIndex;

            const draggingCard = imageCardGrid.querySelector('.image-card.dragging');
            const placeholder = ensureMediaDropPlaceholder(draggingCard ? draggingCard.getBoundingClientRect().height : imageCardHeight);
            const reference = cards[nextIndex] || null;
            if (reference) {
                imageCardGrid.insertBefore(placeholder, reference);
            } else {
                imageCardGrid.appendChild(placeholder);
            }
            imageCardGrid.classList.add('drag-active');
        }

        async function openMediaPreview(item) {
            if (!item || !mediaPreviewOverlay || !mediaPreviewImage || !mediaPreviewVideo) {
                return;
            }
            const mediaType = item.kind === 'external'
                ? (externalCoverMedia ? externalCoverMedia.mediaType : '')
                : (item.mediaType || 'image');
            const src = item.kind === 'external'
                ? await resolveExternalCoverPreviewUrl(true)
                : await resolveExistingMediaPreviewUrl(item, true);
            if (!src) {
                const missingName = item.kind === 'external'
                    ? (externalCoverMedia ? externalCoverMedia.name : 'cover media')
                    : (item.name || getFileName(item.path) || 'media');
                setStatus(`Media file missing: ${missingName}.`);
                showToast(`Media file missing: ${missingName}`, 'warning');
                return;
            }

            mediaPreviewImage.hidden = true;
            mediaPreviewVideo.hidden = true;
            mediaPreviewImage.removeAttribute('src');
            mediaPreviewVideo.pause();
            mediaPreviewVideo.removeAttribute('src');

            if (mediaType === 'video') {
                mediaPreviewVideo.src = src;
                mediaPreviewVideo.hidden = false;
                mediaPreviewVideo.play().catch(() => {});
            } else {
                mediaPreviewImage.src = src;
                mediaPreviewImage.hidden = false;
            }
            mediaPreviewOverlay.hidden = false;
        }

        function closeMediaPreview() {
            if (!mediaPreviewOverlay || !mediaPreviewVideo || !mediaPreviewImage) {
                return;
            }
            mediaPreviewOverlay.hidden = true;
            mediaPreviewVideo.pause();
            mediaPreviewVideo.removeAttribute('src');
            mediaPreviewImage.removeAttribute('src');
            mediaPreviewImage.hidden = true;
            mediaPreviewVideo.hidden = true;
        }

        function renderImageManager() {
            if (!imageCardGrid) {
                return;
            }
            normalizeCoverSelection();
            imageCardGrid.innerHTML = '';

            if (externalCoverMedia) {
                const card = document.createElement('div');
                card.className = 'image-card';
                card.classList.add('cover-media-highlight');
                if (coverSelection && coverSelection.kind === 'external') {
                    card.classList.add('selected');
                }

                const badge = document.createElement('span');
                badge.className = 'cover-badge';
                badge.textContent = 'Cover';
                card.appendChild(badge);
                appendMediaTypeBadge(card, externalCoverMedia.mediaType);

                const thumb = document.createElement('div');
                thumb.className = 'image-card-thumb';
                const previewUrl = getExternalCoverPreviewUrl();
                if (externalCoverMedia.mediaType === 'video') {
                    const video = document.createElement('video');
                    if (previewUrl) {
                        video.src = previewUrl;
                    }
                    video.muted = true;
                    video.loop = true;
                    video.playsInline = true;
                    video.autoplay = true;
                    video.addEventListener('click', () => openMediaPreview({ kind: 'external' }));
                    thumb.appendChild(video);
                } else {
                    const img = document.createElement('img');
                    if (previewUrl) {
                        img.src = previewUrl;
                    }
                    img.alt = externalCoverMedia.name || 'Cover media';
                    img.addEventListener('click', () => openMediaPreview({ kind: 'external' }));
                    thumb.appendChild(img);
                }
                card.appendChild(thumb);

                const meta = document.createElement('div');
                meta.className = 'image-card-meta';

                const name = document.createElement('span');
                name.className = 'image-card-name';
                name.textContent = `${formatMediaTypeLabel(externalCoverMedia.mediaType)}: ${externalCoverMedia.name || 'cover media'}`;

                const controls = document.createElement('div');
                controls.className = 'image-card-controls';

                const pinBtn = document.createElement('button');
                pinBtn.type = 'button';
                pinBtn.className = `ghost image-mini-btn ${coverSelection && coverSelection.kind === 'external' ? 'active' : ''}`;
                pinBtn.textContent = '📌';
                pinBtn.title = 'Use as cover';
                pinBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    coverSelection = { kind: 'external' };
                    renderImageManager();
                });

                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'ghost image-mini-btn';
                previewBtn.textContent = '👁';
                previewBtn.title = 'Preview';
                previewBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    openMediaPreview({ kind: 'external' });
                });

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'ghost image-mini-btn';
                removeBtn.textContent = '🗑';
                removeBtn.title = 'Remove cover media';
                removeBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    externalCoverMedia = null;
                    if (coverSelection && coverSelection.kind === 'external') {
                        coverSelection = null;
                    }
                    normalizeCoverSelection();
                    renderImageManager();
                });

                controls.appendChild(pinBtn);
                controls.appendChild(previewBtn);
                controls.appendChild(removeBtn);
                meta.appendChild(name);
                card.appendChild(meta);
                card.appendChild(controls);
                imageCardGrid.appendChild(card);
            }

            workingMediaItems.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'image-card';
                card.classList.add('has-selectbox');
                card.dataset.id = item.id;
                card.draggable = true;
                if (selectedMediaIds.has(item.id)) {
                    card.classList.add('selected');
                }
                appendMediaTypeBadge(card, item.mediaType);

                if (coverSelection && coverSelection.kind === 'image' && coverSelection.itemId === item.id) {
                    const badge = document.createElement('span');
                    badge.className = 'cover-badge';
                    badge.textContent = 'Cover';
                    card.appendChild(badge);
                    if (item.mediaType === 'gif' || item.mediaType === 'video') {
                        card.classList.add('cover-media-highlight');
                    }
                }

                const thumb = document.createElement('div');
                thumb.className = 'image-card-thumb';
                const mediaSrc = getMediaPreviewUrl(item);
                if (item.mediaType === 'video') {
                    const video = document.createElement('video');
                    if (mediaSrc) {
                        video.src = mediaSrc;
                    }
                    video.muted = true;
                    video.loop = true;
                    video.playsInline = true;
                    video.autoplay = true;
                    video.addEventListener('click', () => openMediaPreview(item));
                    thumb.appendChild(video);
                } else {
                    const img = document.createElement('img');
                    if (mediaSrc) {
                        img.src = mediaSrc;
                    }
                    img.alt = item.name || `Media ${index + 1}`;
                    img.addEventListener('click', () => openMediaPreview(item));
                    thumb.appendChild(img);
                }
                card.appendChild(thumb);

                const meta = document.createElement('div');
                meta.className = 'image-card-meta';
                const name = document.createElement('span');
                name.className = 'image-card-name';
                name.textContent = `${index + 1}. ${formatMediaTypeLabel(item.mediaType)}: ${item.name}`;

                const controls = document.createElement('div');
                controls.className = 'image-card-controls';

                const selectBox = document.createElement('input');
                selectBox.type = 'checkbox';
                selectBox.className = 'image-card-selectbox';
                selectBox.checked = selectedMediaIds.has(item.id);
                selectBox.title = 'Select media';
                selectBox.addEventListener('click', event => {
                    event.stopPropagation();
                });
                selectBox.addEventListener('change', event => {
                    event.stopPropagation();
                    if (selectBox.checked) {
                        selectedMediaIds.add(item.id);
                    } else {
                        selectedMediaIds.delete(item.id);
                    }
                    renderImageManager();
                });

                const pinBtn = document.createElement('button');
                pinBtn.type = 'button';
                pinBtn.className = `ghost image-mini-btn ${coverSelection && coverSelection.kind === 'image' && coverSelection.itemId === item.id ? 'active' : ''}`;
                pinBtn.textContent = '📌';
                pinBtn.title = 'Pin as cover';
                pinBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    coverSelection = { kind: 'image', itemId: item.id };
                    renderImageManager();
                });

                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.className = 'ghost image-mini-btn';
                previewBtn.textContent = '👁';
                previewBtn.title = 'Preview';
                previewBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    openMediaPreview(item);
                });

                const replaceBtn = document.createElement('button');
                replaceBtn.type = 'button';
                replaceBtn.className = 'ghost image-mini-btn';
                replaceBtn.textContent = '🔁';
                replaceBtn.title = 'Replace media';
                replaceBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    pendingReplaceMediaId = item.id;
                    if (replaceImageInput) {
                        replaceImageInput.value = '';
                        replaceImageInput.click();
                    }
                });

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'ghost image-mini-btn';
                removeBtn.textContent = '🗑';
                removeBtn.title = 'Remove media';
                removeBtn.addEventListener('click', event => {
                    event.stopPropagation();
                    workingMediaItems = workingMediaItems.filter(media => media.id !== item.id);
                    selectedMediaIds.delete(item.id);
                    if (coverSelection && coverSelection.kind === 'image' && coverSelection.itemId === item.id) {
                        coverSelection = null;
                    }
                    normalizeCoverSelection();
                    renderImageManager();
                });

                card.appendChild(selectBox);
                controls.appendChild(pinBtn);
                controls.appendChild(replaceBtn);
                controls.appendChild(previewBtn);
                controls.appendChild(removeBtn);
                meta.appendChild(name);
                card.appendChild(meta);
                card.appendChild(controls);

                card.addEventListener('dragstart', event => {
                    mediaDragId = item.id;
                    card.classList.add('dragging');
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', item.id);
                    updateMediaDropPlaceholder(event.clientY);
                });
                card.addEventListener('dragend', () => {
                    mediaDragId = null;
                    card.classList.remove('dragging');
                    clearMediaDropPlaceholder();
                });

                imageCardGrid.appendChild(card);
            });

            if (!externalCoverMedia && workingMediaItems.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'image-empty';
                empty.textContent = 'No media selected yet.';
                imageCardGrid.appendChild(empty);
            }

            updateCoverSummary();
            updateImageManagerSummary();
            releaseUnusedMediaUrls();
        }

        function addMediaFiles(files) {
            const list = Array.from(files || []);
            if (list.length === 0) {
                return { added: 0, skipped: 0 };
            }
            let added = 0;
            let skipped = 0;
            list.forEach(file => {
                const type = detectCoverMediaType(file.name, file.type);
                if (type !== 'image' && type !== 'gif' && type !== 'video') {
                    skipped += 1;
                    return;
                }
                workingMediaItems.push(createMediaItemFromFile(file));
                added += 1;
            });
            if (skipped > 0) {
                setStatus(`Skipped ${skipped} unsupported file(s).`);
            }
            normalizeCoverSelection();
            renderImageManager();
            return { added, skipped };
        }

        function replaceMediaItemFile(itemId, file) {
            if (!itemId || !file) {
                return false;
            }
            const fileType = detectCoverMediaType(file.name, file.type);
            if (fileType !== 'image' && fileType !== 'gif' && fileType !== 'video') {
                return false;
            }
            const index = workingMediaItems.findIndex(item => item.id === itemId);
            if (index < 0) {
                return false;
            }
            if (mediaObjectUrls.has(itemId)) {
                URL.revokeObjectURL(mediaObjectUrls.get(itemId));
                mediaObjectUrls.delete(itemId);
            }
            const current = workingMediaItems[index];
            workingMediaItems[index] = {
                ...current,
                source: 'new',
                file,
                path: '',
                name: file.name,
                mediaType: fileType,
                previewUrl: '',
                previewMissing: false,
                previewPending: false,
            };
            return true;
        }

        function removeSelectedMedia() {
            if (selectedMediaIds.size === 0) {
                setStatus('Select media to remove first.');
                return;
            }
            workingMediaItems = workingMediaItems.filter(item => !selectedMediaIds.has(item.id));
            selectedMediaIds.clear();
            normalizeCoverSelection();
            renderImageManager();
        }

        function sanitizeCoverPresetMode(mode) {
            const value = String(mode || '').trim().toLowerCase();
            return COVER_PRESET_POINTS[value] ? value : 'grid';
        }

        function getCoverPresetPoints(mode = coverPresetMode) {
            return COVER_PRESET_POINTS[sanitizeCoverPresetMode(mode)] || COVER_PRESET_POINTS.grid;
        }

        function findNearestPresetIndex(value, values) {
            let nearestIndex = 0;
            let nearestDistance = Number.POSITIVE_INFINITY;
            values.forEach((candidate, index) => {
                const distance = Math.abs(candidate - value);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestIndex = index;
                }
            });
            return nearestIndex;
        }

        function updateCoverPresetModeButtons() {
            if (!coverPresetModes) {
                return;
            }
            const activeMode = sanitizeCoverPresetMode(coverPresetMode);
            const modeButtons = coverPresetModes.querySelectorAll('.cover-preset-mode[data-cover-mode]');
            modeButtons.forEach(button => {
                const mode = sanitizeCoverPresetMode(button.dataset.coverMode || 'grid');
                button.classList.toggle('active', mode === activeMode);
            });
            if (coverPresetHint) {
                const spec = getCoverLayoutViewportSpec(activeMode);
                const label = spec.label || (activeMode.charAt(0).toUpperCase() + activeMode.slice(1));
                coverPresetHint.textContent = `${label} layout crop box shown • drag image with mouse, move crop box with arrows, then click "Save This Layout".`;
            }
            updateCoverLayoutViewport();
        }

        function updateCoverPresetGridSelection() {
            if (!coverPresetGrid) {
                return;
            }
            const points = getCoverPresetPoints(coverPresetMode);
            const activeCol = findNearestPresetIndex(coverViewportPosition.x, points.x);
            const activeRow = findNearestPresetIndex(coverViewportPosition.y, points.y);
            const cells = coverPresetGrid.querySelectorAll('.cover-preset-cell[data-row][data-col]');
            cells.forEach(cell => {
                const row = Number(cell.dataset.row);
                const col = Number(cell.dataset.col);
                cell.classList.toggle('active', row === activeRow && col === activeCol);
            });
        }

        function renderCoverPresetGrid() {
            if (!coverPresetGrid) {
                return;
            }
            const labels = [
                ['TL', 'TC', 'TR'],
                ['ML', 'C', 'MR'],
                ['BL', 'BC', 'BR'],
            ];
            const points = getCoverPresetPoints(coverPresetMode);
            coverPresetGrid.innerHTML = '';
            for (let row = 0; row < 3; row += 1) {
                for (let col = 0; col < 3; col += 1) {
                    const cell = document.createElement('button');
                    cell.type = 'button';
                    cell.className = 'cover-preset-cell';
                    cell.dataset.row = String(row);
                    cell.dataset.col = String(col);
                    const x = points.x[col];
                    const y = points.y[row];
                    cell.title = `Set cover position to ${x}% ${y}%`;
                    cell.textContent = labels[row][col];
                    cell.addEventListener('click', () => {
                        coverViewportPosition = { x, y };
                        applyCoverPosition();
                    });
                    coverPresetGrid.appendChild(cell);
                }
            }
            updateCoverPresetGridSelection();
            updateCoverLayoutViewport();
        }

        function updateCoverLayoutViewport() {
            if (!coverPositionFrame || !coverLayoutViewport) {
                return;
            }
            const metrics = getCoverLayoutViewportMetrics(coverPresetMode);
            if (!metrics) {
                return;
            }
            coverLayoutViewport.style.width = `${metrics.width}px`;
            coverLayoutViewport.style.height = `${metrics.height}px`;
            coverLayoutViewport.style.left = `${Math.round(metrics.left)}px`;
            coverLayoutViewport.style.top = `${Math.round(metrics.top)}px`;
            if (coverLayoutLabel) {
                coverLayoutLabel.textContent = `${metrics.spec.label} crop`;
            }
        }

        function applyCoverPosition() {
            const imagePosition = formatCoverPositionValue(coverPosition);
            const effectivePosition = formatCoverPositionValue(getEffectiveCoverPosition(coverPresetMode));
            if (coverPositionInput) {
                coverPositionInput.value = effectivePosition;
            }
            if (coverPositionPreviewEl) {
                coverPositionPreviewEl.style.objectPosition = imagePosition;
            }
            if (coverPositionFrame) {
                coverPositionFrame.style.backgroundPosition = imagePosition;
            }
            updateCoverLayoutViewport();
            updateCoverPresetGridSelection();
            updateCoverSummary();
        }

        function nudgeCoverPosition(deltaX, deltaY) {
            coverViewportPosition = {
                x: Math.max(0, Math.min(100, coverViewportPosition.x + deltaX)),
                y: Math.max(0, Math.min(100, coverViewportPosition.y + deltaY)),
            };
            applyCoverPosition();
        }

        async function renderCoverPositionPreview() {
            if (!coverPositionFrame) {
                return;
            }
            if (coverPositionPreviewEl && coverPositionPreviewEl.parentElement) {
                coverPositionPreviewEl.pause && coverPositionPreviewEl.pause();
                coverPositionPreviewEl.remove();
            }
            coverPositionPreviewEl = null;

            const src = await resolveCurrentCoverPreviewUrl(true);
            const mediaType = getCurrentCoverMediaType();
            if (!src) {
                coverPositionFrame.style.backgroundImage = '';
                return;
            }

            if (mediaType === 'video') {
                const video = document.createElement('video');
                video.className = 'cover-position-media';
                video.src = src;
                video.muted = true;
                video.loop = true;
                video.playsInline = true;
                video.autoplay = true;
                coverPositionPreviewEl = video;
            } else {
                const img = document.createElement('img');
                img.className = 'cover-position-media';
                img.src = src;
                img.alt = 'Cover preview';
                coverPositionPreviewEl = img;
            }
            coverPositionFrame.style.backgroundImage = '';
            coverPositionFrame.prepend(coverPositionPreviewEl);
            applyCoverPosition();
        }

        async function openCoverPositionEditor() {
            normalizeCoverSelection();
            const src = await resolveCurrentCoverPreviewUrl(true);
            if (!src) {
                setStatus('Choose a story cover or homepage cover first.');
                return;
            }
            coverPositionsByLayout = normalizeCoverPositionMap(coverPositionsByLayout, coverPositionInput && coverPositionInput.value ? coverPositionInput.value : '50% 50%');
            coverPositionsByLayoutBeforeEdit = { ...coverPositionsByLayout };
            coverPresetMode = sanitizeCoverPresetMode(localStorage.getItem('homepageLayout') || coverPresetMode);
            const modeValue = loadCoverPositionForMode(coverPresetMode);
            coverPosition = normalizeCoverPosition(modeValue);
            coverPositionBeforeEdit = { ...coverPosition };
            coverViewportPosition = { x: 50, y: 50 };
            coverViewportPositionBeforeEdit = { ...coverViewportPosition };
            updateCoverPresetModeButtons();
            renderCoverPresetGrid();
            await renderCoverPositionPreview();
            if (coverPositionOverlay) {
                coverPositionOverlay.hidden = false;
                requestAnimationFrame(() => {
                    updateCoverLayoutViewport();
                });
            }
        }

        function closeCoverPosition() {
            if (coverPositionOverlay) {
                coverPositionOverlay.hidden = true;
            }
            if (coverPositionPreviewEl && coverPositionPreviewEl.parentElement) {
                coverPositionPreviewEl.pause && coverPositionPreviewEl.pause();
                coverPositionPreviewEl.remove();
            }
            coverPositionPreviewEl = null;
            coverDragging = false;
            if (coverPositionFrame) {
                coverPositionFrame.classList.remove('dragging');
            }
        }

        function cancelCoverPositionEdit() {
            if (coverPositionsByLayoutBeforeEdit) {
                coverPositionsByLayout = { ...coverPositionsByLayoutBeforeEdit };
            }
            if (coverPositionBeforeEdit) {
                coverPosition = { ...coverPositionBeforeEdit };
            } else {
                coverPosition = normalizeCoverPosition(loadCoverPositionForMode(coverPresetMode));
            }
            if (coverViewportPositionBeforeEdit) {
                coverViewportPosition = { ...coverViewportPositionBeforeEdit };
            } else {
                coverViewportPosition = { x: 50, y: 50 };
            }
            applyCoverPosition();
            coverPositionsByLayoutBeforeEdit = null;
            coverPositionBeforeEdit = null;
            coverViewportPositionBeforeEdit = null;
            closeCoverPosition();
        }

        function saveCurrentLayoutCoverPosition() {
            const value = saveCoverPositionForMode(coverPresetMode);
            const label = sanitizeCoverPresetMode(coverPresetMode);
            setStatus(`Saved ${label} cover position: ${value}`);
            showToast(`Saved ${label} cover position.`, 'success', 1600);
        }

        function saveCoverPositionEdit() {
            saveCoverPositionForMode(coverPresetMode);
            coverPositionsByLayoutBeforeEdit = null;
            coverPositionBeforeEdit = null;
            coverViewportPositionBeforeEdit = null;
            applyCoverPosition();
            closeCoverPosition();
        }

        function resetCoverPosition() {
            coverPosition = { x: 50, y: 50 };
            coverViewportPosition = { x: 50, y: 50 };
            applyCoverPosition();
        }

        function startCoverDrag(event) {
            if (!coverPositionFrame || !coverPositionPreviewEl) return;
            event.preventDefault();
            coverDragging = true;
            coverPositionFrame.classList.add('dragging');
            coverDragStart = {
                x: event.clientX,
                y: event.clientY,
                posX: coverPosition.x,
                posY: coverPosition.y,
            };
        }

        function moveCoverDrag(event) {
            if (!coverDragging || !coverPositionFrame) return;
            const rect = coverPositionFrame.getBoundingClientRect();
            const dx = event.clientX - coverDragStart.x;
            const dy = event.clientY - coverDragStart.y;
            const nextX = coverDragStart.posX - (dx / rect.width) * 100;
            const nextY = coverDragStart.posY - (dy / rect.height) * 100;
            coverPosition = {
                x: Math.max(0, Math.min(100, nextX)),
                y: Math.max(0, Math.min(100, nextY)),
            };
            applyCoverPosition();
        }

        function endCoverDrag() {
            coverDragging = false;
            if (coverPositionFrame) {
                coverPositionFrame.classList.remove('dragging');
            }
        }

        function supportsFileSystemAccess() {
            return 'showDirectoryPicker' in window;
        }

        function normalizeCatalog(data) {
            const list = Array.isArray(data)
                ? data
                : (data && typeof data === 'object' ? [data] : []);
            return list.map((entry, index) => {
                const id = typeof entry.id === 'string' && entry.id.trim()
                    ? entry.id.trim()
                    : `story_${index + 1}`;
                const images = Array.isArray(entry.images)
                    ? entry.images.filter(path => typeof path === 'string' && path.trim())
                    : [];
                const normalizedImages = images.filter(path => {
                    const name = getFileName(path);
                    return !new RegExp(`^${escapeRegExp(id)}_cover\\.`, 'i').test(name);
                });

                let coverMedia = null;
                if (entry.coverMedia && typeof entry.coverMedia === 'object' && typeof entry.coverMedia.path === 'string') {
                    const path = entry.coverMedia.path.trim();
                    const mediaType = detectCoverMediaType(path, entry.coverMedia.type || '');
                    if (path && (mediaType === 'gif' || mediaType === 'video' || mediaType === 'image')) {
                        coverMedia = { path, type: mediaType };
                    }
                }

                if (!coverMedia && typeof entry.cover === 'string') {
                    const coverPath = entry.cover.trim();
                    const coverName = getFileName(coverPath);
                    if (new RegExp(`^${escapeRegExp(id)}_cover\\.`, 'i').test(coverName)) {
                        const mediaType = detectCoverMediaType(coverPath, '');
                        if (mediaType === 'gif' || mediaType === 'video' || mediaType === 'image') {
                            coverMedia = { path: coverPath, type: mediaType };
                        }
                    }
                }

                let cover = typeof entry.cover === 'string' ? entry.cover.trim() : '';
                if (!cover) {
                    cover = coverMedia ? coverMedia.path : (normalizedImages[0] || '');
                }
                if (!coverMedia && cover && !normalizedImages.includes(cover)) {
                    cover = normalizedImages[0] || '';
                }

                const fallbackCoverPosition = formatCoverPositionValue(normalizeCoverPosition(entry.coverPosition || '50% 50%'));
                const coverPositions = normalizeCoverPositionMap(entry.coverPositions, fallbackCoverPosition);
                const coverPosition = coverPositions.grid || fallbackCoverPosition;

                return {
                    ...entry,
                    id,
                    reportNumber: Number.isFinite(entry.reportNumber)
                        ? entry.reportNumber
                        : parseInt(entry.reportNumber, 10) || (index + 1),
                    title: typeof entry.title === 'string' ? entry.title : '',
                    description: typeof entry.description === 'string' ? entry.description : '',
                    tags: Array.isArray(entry.tags) ? entry.tags.filter(Boolean) : [],
                    cover,
                    coverMedia,
                    coverPosition,
                    coverPositions,
                    images: normalizedImages,
                    story: typeof entry.story === 'string' && entry.story.trim()
                        ? entry.story.trim()
                        : `story/${id}.md`,
                };
            });
        }

        function escapeRegExp(value) {
            return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        function loadAutoScanSetting() {
            const raw = localStorage.getItem(AUTO_SCAN_KEY);
            return raw === 'true';
        }

        function saveAutoScanSetting(value) {
            localStorage.setItem(AUTO_SCAN_KEY, value ? 'true' : 'false');
        }

        function loadCloseAfterSaveSetting() {
            const raw = localStorage.getItem(CLOSE_AFTER_SAVE_KEY);
            if (raw === null) {
                return true;
            }
            return raw === 'true';
        }

        function saveCloseAfterSaveSetting(value) {
            localStorage.setItem(CLOSE_AFTER_SAVE_KEY, value ? 'true' : 'false');
        }

        function clampImageCardHeight(value) {
            return Math.max(92, Math.min(360, Math.round(value)));
        }

        function loadImageCardHeightSetting() {
            const raw = parseInt(localStorage.getItem(IMAGE_CARD_HEIGHT_KEY), 10);
            if (Number.isFinite(raw)) {
                return clampImageCardHeight(raw);
            }
            return 148;
        }

        function applyImageCardHeightSetting() {
            const value = clampImageCardHeight(imageCardHeight);
            imageCardHeight = value;
            if (imagePanel) {
                imagePanel.style.setProperty('--image-card-height', `${value}px`);
            }
            if (cardHeightValue) {
                cardHeightValue.textContent = `${value}px`;
            }
            if (cardHeightDecBtn) {
                cardHeightDecBtn.disabled = value <= 92;
            }
            if (cardHeightIncBtn) {
                cardHeightIncBtn.disabled = value >= 360;
            }
        }

        function adjustImageCardHeight(delta) {
            imageCardHeight = clampImageCardHeight(imageCardHeight + delta);
            localStorage.setItem(IMAGE_CARD_HEIGHT_KEY, String(imageCardHeight));
            applyImageCardHeightSetting();
        }

        async function pickLibraryFolder() {
            if (!supportsFileSystemAccess()) {
                setStatus('Your browser does not support the File System Access API. Use Chrome or Edge.');
                return;
            }

            try {
                state.rootHandle = await window.showDirectoryPicker();
                clearLibraryPreviewCaches();
                releaseAllMediaUrls();
                await ensureStructure();
                saveRecentFolder(state.rootHandle);
                if (autoScanToggle && autoScanToggle.checked) {
                    await scanLibrary();
                } else {
                    await loadLibrary();
                }
            } catch (error) {
                setStatus('Folder selection cancelled.');
            }
        }

        async function getDirectory(name, create = true) {
            return state.rootHandle.getDirectoryHandle(name, { create });
        }

        async function getDatabaseDir() {
            return getDirectory('database', true);
        }

        async function getStoryDir() {
            return getDirectory('story', true);
        }

        async function getImageDir() {
            return getDirectory('media-scr', true);
        }

        async function readJsonFile(dirHandle, fileName) {
            try {
                const fileHandle = await dirHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                const text = await file.text();
                if (!text.trim()) {
                    return null;
                }
                return JSON.parse(text);
            } catch (error) {
                return null;
            }
        }

        async function readTextFile(dirHandle, fileName) {
            try {
                const fileHandle = await dirHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                return file.text();
            } catch (error) {
                return '';
            }
        }

        async function fileExists(dirHandle, fileName) {
            try {
                await dirHandle.getFileHandle(fileName);
                return true;
            } catch (error) {
                return false;
            }
        }

        function getFileName(path) {
            if (!path) return '';
            const normalized = path.replace(/\\/g, '/');
            return normalized.split('/').pop();
        }

        function normalizeRelativePath(path) {
            if (!path) return '';
            return String(path)
                .trim()
                .replace(/\\/g, '/')
                .replace(/^\.\//, '')
                .replace(/^\/+/, '')
                .replace(/\/{2,}/g, '/');
        }

        function clearLibraryPreviewAssetUrls() {
            const uniqueUrls = new Set(libraryPreviewAssetUrlCache.values());
            uniqueUrls.forEach(url => {
                try {
                    URL.revokeObjectURL(url);
                } catch (error) {
                    // ignore stale object URL errors
                }
            });
            libraryPreviewAssetUrlCache.clear();
        }

        function clearLibraryPreviewCaches() {
            clearLibraryPreviewAssetUrls();
            libraryFileLookupCache.clear();
            libraryPreviewPageUrls.clear();
        }

        function isDirectAssetUrl(path = '') {
            const raw = String(path || '').trim();
            if (!raw) {
                return false;
            }
            if (raw.startsWith('blob:') || raw.startsWith('data:')) {
                return true;
            }
            try {
                const url = new URL(raw);
                return url.protocol === 'file:' || url.protocol === 'http:' || url.protocol === 'https:';
            } catch (error) {
                return false;
            }
        }

        function buildLibraryPathCandidates(rawPath = '') {
            const normalized = normalizeRelativePath(rawPath);
            const candidates = [];
            const seen = new Set();
            const push = candidate => {
                const next = normalizeRelativePath(candidate);
                const key = next.toLowerCase();
                if (!next || seen.has(key)) {
                    return;
                }
                seen.add(key);
                candidates.push(next);
            };

            if (normalized) {
                push(normalized);
                try {
                    const decoded = decodeURIComponent(normalized);
                    if (decoded && decoded !== normalized) {
                        push(decoded);
                    }
                } catch (error) {
                    // ignore invalid encoding
                }
            }

            const fileName = getFileName(normalized);
            if (fileName) {
                if (normalized.toLowerCase() === fileName.toLowerCase()) {
                    push(`media-scr/${fileName}`);
                }
                if (!normalized.toLowerCase().startsWith('media-scr/')) {
                    push(`media-scr/${fileName}`);
                }
            }

            return candidates;
        }

        async function getLibraryFileFromRelativePath(relativePath) {
            if (!state.rootHandle) {
                return null;
            }
            const normalizedPath = normalizeRelativePath(relativePath);
            if (!normalizedPath) {
                return null;
            }

            const segments = normalizedPath.split('/').filter(Boolean);
            if (segments.length === 0) {
                return null;
            }

            let dirHandle = state.rootHandle;
            for (let index = 0; index < segments.length - 1; index += 1) {
                try {
                    dirHandle = await dirHandle.getDirectoryHandle(segments[index]);
                } catch (error) {
                    return null;
                }
            }

            try {
                const fileHandle = await dirHandle.getFileHandle(segments[segments.length - 1]);
                return fileHandle.getFile();
            } catch (error) {
                return null;
            }
        }

        async function findLibraryFilePathByName(fileName, { maxDepth = LIBRARY_FILE_SEARCH_MAX_DEPTH, preferredFolders = [] } = {}) {
            if (!state.rootHandle) {
                return '';
            }
            const targetName = String(fileName || '').trim().toLowerCase();
            if (!targetName) {
                return '';
            }

            const normalizedPreferred = preferredFolders
                .map(name => String(name || '').trim().toLowerCase())
                .filter(Boolean);
            const cacheKey = `${targetName}|${maxDepth}|${normalizedPreferred.join(',')}`;
            if (libraryFileLookupCache.has(cacheKey)) {
                return libraryFileLookupCache.get(cacheKey) || '';
            }

            const queue = [{ handle: state.rootHandle, path: '', depth: 0 }];
            let fallbackMatch = '';

            while (queue.length > 0) {
                const current = queue.shift();
                let preferredMatch = '';

                for await (const [name, handle] of current.handle.entries()) {
                    if (handle.kind === 'file') {
                        if (name.toLowerCase() !== targetName) {
                            continue;
                        }
                        const candidatePath = current.path ? `${current.path}/${name}` : name;
                        if (!fallbackMatch) {
                            fallbackMatch = candidatePath;
                        }
                        const parentDir = current.path.split('/').pop().toLowerCase();
                        if (normalizedPreferred.includes(parentDir)) {
                            preferredMatch = candidatePath;
                            break;
                        }
                    } else if (handle.kind === 'directory' && current.depth < maxDepth) {
                        const nextPath = current.path ? `${current.path}/${name}` : name;
                        queue.push({ handle, path: nextPath, depth: current.depth + 1 });
                    }
                }

                if (preferredMatch) {
                    libraryFileLookupCache.set(cacheKey, preferredMatch);
                    return preferredMatch;
                }
            }

            libraryFileLookupCache.set(cacheKey, fallbackMatch || '');
            return fallbackMatch || '';
        }

        function cacheLibraryPreviewUrl(pathKeys, objectUrl) {
            if (!objectUrl) {
                return;
            }
            (Array.isArray(pathKeys) ? pathKeys : [pathKeys]).forEach(key => {
                const normalizedKey = normalizeRelativePath(key);
                if (normalizedKey) {
                    libraryPreviewAssetUrlCache.set(normalizedKey, objectUrl);
                }
            });
        }

        async function resolveLibraryPreviewAssetUrl(path = '') {
            const rawPath = String(path || '').trim();
            if (!rawPath) {
                return '';
            }

            if (isDirectAssetUrl(rawPath)) {
                return rawPath;
            }
            if (/^[a-zA-Z]:[\\/]/.test(rawPath)) {
                try {
                    const filePath = rawPath.replace(/\\/g, '/');
                    return new URL(`file:///${filePath}`).href;
                } catch (error) {
                    // continue with relative-path resolution
                }
            }

            const candidates = buildLibraryPathCandidates(rawPath);
            for (const candidate of candidates) {
                if (libraryPreviewAssetUrlCache.has(candidate)) {
                    return libraryPreviewAssetUrlCache.get(candidate) || '';
                }
            }

            for (const candidate of candidates) {
                const file = await getLibraryFileFromRelativePath(candidate);
                if (file) {
                    const objectUrl = URL.createObjectURL(file);
                    cacheLibraryPreviewUrl(candidates, objectUrl);
                    cacheLibraryPreviewUrl(candidate, objectUrl);
                    return objectUrl;
                }
            }

            const fileName = getFileName(rawPath);
            if (!fileName) {
                return '';
            }
            const discoveredPath = await findLibraryFilePathByName(fileName, { preferredFolders: ['media-scr'] });
            if (!discoveredPath) {
                return '';
            }

            if (libraryPreviewAssetUrlCache.has(discoveredPath)) {
                const cached = libraryPreviewAssetUrlCache.get(discoveredPath) || '';
                cacheLibraryPreviewUrl(candidates, cached);
                return cached;
            }

            const discoveredFile = await getLibraryFileFromRelativePath(discoveredPath);
            if (!discoveredFile) {
                return '';
            }
            const discoveredUrl = URL.createObjectURL(discoveredFile);
            cacheLibraryPreviewUrl([discoveredPath, ...candidates], discoveredUrl);
            return discoveredUrl;
        }

        async function libraryPathExists(relativePath) {
            return Boolean(await getLibraryFileFromRelativePath(relativePath));
        }

        async function findFirstExistingLibraryPath(candidates = []) {
            for (const candidate of candidates) {
                if (await libraryPathExists(candidate)) {
                    return normalizeRelativePath(candidate);
                }
            }
            const names = candidates
                .map(candidate => getFileName(candidate))
                .filter(Boolean);
            for (const name of names) {
                const discovered = await findLibraryFilePathByName(name, {
                    preferredFolders: name.toLowerCase().startsWith('viewer')
                        ? ['view', 'viewer']
                        : ['home', 'homepage'],
                });
                if (discovered) {
                    return normalizeRelativePath(discovered);
                }
            }
            return null;
        }

        function applyQueryToUrl(url, query = null) {
            if (!url || !query) {
                return;
            }
            if (typeof query === 'string') {
                const nextSearch = query.startsWith('?') ? query.slice(1) : query;
                url.search = nextSearch;
                return;
            }

            const params = query instanceof URLSearchParams ? query : new URLSearchParams();
            if (!(query instanceof URLSearchParams)) {
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        params.set(key, String(value));
                    }
                });
            }
            url.search = params.toString();
        }

        function buildLibraryPageUrl(relativePath, query = null, baseUrl = '') {
            if (!state.rootHandle) return null;
            const normalizedPath = normalizeRelativePath(relativePath);
            if (!normalizedPath) return null;

            let url;
            if (baseUrl) {
                const normalizedBase = normalizeLibraryBaseUrl(baseUrl);
                if (!normalizedBase) {
                    return null;
                }
                url = new URL(normalizedPath, normalizedBase);
            } else {
                const encodedSegments = [
                    encodeURIComponent(state.rootHandle.name),
                    ...normalizedPath.split('/').map(segment => encodeURIComponent(segment)),
                ];
                url = new URL(`../${encodedSegments.join('/')}`, window.location.href);
            }

            applyQueryToUrl(url, query);
            return url.href;
        }

        async function openLibraryPage(relativePath, { query = null, label = 'page' } = {}) {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                showToast('Choose a library folder first.', 'error');
                return false;
            }

            const launchBaseUrl = await resolveLibraryLaunchBaseUrl();
            const url = buildLibraryPageUrl(relativePath, query, launchBaseUrl);
            if (!url) {
                setStatus(`Unable to open ${label}. Invalid path.`);
                showToast(`Unable to open ${label}.`, 'error');
                return false;
            }

            const opened = window.open(url, '_blank', 'noopener');
            if (!opened) {
                setStatus(`Popup blocked while opening ${label}.`);
                showToast(`Popup blocked while opening ${label}.`, 'warning');
                return false;
            }
            return true;
        }

        async function openHomepageFromSelectedLibrary() {
            const homepagePath = await findFirstExistingLibraryPath(HOMEPAGE_ENTRY_CANDIDATES);
            if (!homepagePath) {
                setStatus(`Homepage file not found. Expected one of: ${HOMEPAGE_ENTRY_CANDIDATES.join(', ')}.`);
                showToast('Homepage file not found in selected library.', 'error');
                return;
            }
            await openLibraryPage(homepagePath, { label: 'homepage' });
        }

        async function openStoryPreviewInSelectedLibrary(storyId) {
            if (!storyId) {
                setStatus('Story id is missing.');
                return;
            }

            const [viewerPath, homepagePath] = await Promise.all([
                findFirstExistingLibraryPath(VIEWER_ENTRY_CANDIDATES),
                findFirstExistingLibraryPath(HOMEPAGE_ENTRY_CANDIDATES),
            ]);

            if (!viewerPath) {
                setStatus(`Viewer file not found. Expected one of: ${VIEWER_ENTRY_CANDIDATES.join(', ')}.`);
                showToast('Viewer file not found in selected library.', 'error');
                return;
            }

            await openLibraryPage(viewerPath, {
                query: {
                    story: storyId,
                    from: homepagePath || HOMEPAGE_ENTRY_CANDIDATES[0],
                    home: homepagePath || HOMEPAGE_ENTRY_CANDIDATES[0],
                },
                label: 'story preview',
            });
        }

        async function writeFile(dirHandle, fileName, contents) {
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(contents);
            await writable.close();
        }

        function generateStoryId() {
            const now = new Date();
            const pad = value => String(value).padStart(2, '0');
            return `r${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        }

        function parseTags(raw) {
            return raw
                .split(',')
                .map(tag => tag.trim())
                .filter(Boolean);
        }

        function replaceTextSelection(textarea, start, end, replacement, selectionStart = null, selectionEnd = null) {
            const value = textarea.value || '';
            textarea.value = value.slice(0, start) + replacement + value.slice(end);
            const nextStart = selectionStart === null ? (start + replacement.length) : selectionStart;
            const nextEnd = selectionEnd === null ? nextStart : selectionEnd;
            textarea.focus();
            textarea.setSelectionRange(nextStart, nextEnd);
        }

        async function applyMarkdownAction(action) {
            if (!storyTextInput) {
                return;
            }
            const start = storyTextInput.selectionStart || 0;
            const end = storyTextInput.selectionEnd || 0;
            const selected = storyTextInput.value.slice(start, end);

            if (action === 'bold') {
                const content = selected || 'bold text';
                const replacement = `**${content}**`;
                const selStart = start + 2;
                const selEnd = selStart + content.length;
                replaceTextSelection(storyTextInput, start, end, replacement, selStart, selEnd);
                return;
            }

            if (action === 'heading') {
                if (selected) {
                    const replacement = selected
                        .split('\n')
                        .map(line => line.startsWith('# ') ? line : `# ${line}`)
                        .join('\n');
                    replaceTextSelection(storyTextInput, start, end, replacement, start, start + replacement.length);
                } else {
                    const replacement = '# Heading';
                    replaceTextSelection(storyTextInput, start, end, replacement, start + 2, start + replacement.length);
                }
                return;
            }

            if (action === 'list' || action === 'numbered') {
                const lines = (selected || 'List item').split('\n');
                const replacement = lines
                    .map((line, index) => {
                        const prefix = action === 'numbered' ? `${index + 1}. ` : '- ';
                        const text = line.trim() || (action === 'numbered' ? `Item ${index + 1}` : 'List item');
                        return `${prefix}${text}`;
                    })
                    .join('\n');
                replaceTextSelection(storyTextInput, start, end, replacement, start, start + replacement.length);
                return;
            }

            if (action === 'link') {
                const label = selected || await themedPrompt('Link text:', {
                    title: 'Insert Link',
                    inputValue: 'link',
                    inputPlaceholder: 'Visible label',
                    confirmText: 'Next',
                });
                if (!label) {
                    return;
                }
                const url = await themedPrompt('URL:', {
                    title: 'Insert Link',
                    inputValue: 'https://',
                    inputPlaceholder: 'https://example.com',
                    confirmText: 'Insert',
                });
                if (!url) {
                    return;
                }
                const replacement = `[${label}](${url})`;
                const startIndex = selected ? start : (storyTextInput.selectionStart || start);
                const endIndex = selected ? end : (storyTextInput.selectionEnd || end);
                replaceTextSelection(storyTextInput, startIndex, endIndex, replacement);
            }
        }

        function getNextReportNumber() {
            const max = state.stories.reduce((acc, story) => Math.max(acc, story.reportNumber || 0), 0);
            return max + 1;
        }

        function hasDisplayOrder(list = state.stories) {
            return list.some(story => Number.isFinite(story.displayOrder));
        }

        function getNextDisplayOrder(list = state.stories) {
            const max = list.reduce((acc, story) => {
                const order = Number.isFinite(story.displayOrder) ? story.displayOrder : -1;
                return Math.max(acc, order);
            }, -1);
            return max + 1;
        }

        async function ensureStructure() {
            await getDatabaseDir();
            await getStoryDir();
            await getImageDir();

            const databaseDir = await getDatabaseDir();
            const catalog = await readJsonFile(databaseDir, 'catalog.json');
            if (!catalog) {
                await writeCatalog([]);
            }

            const settings = await readJsonFile(databaseDir, 'settings.json');
            if (!settings) {
                const initialSettings = composeSettingsFile({}, DEFAULT_HOMEPAGE_SETTINGS, DEFAULT_SETTINGS);
                await writeFile(databaseDir, 'settings.json', JSON.stringify(initialSettings, null, 2));
                syncSettingsToLocalStorage(initialSettings);
            }
        }

        async function getFontsDir() {
            return getDirectory('fonts', true);
        }

        async function loadFontsIntoSelect() {
            // Font list is generated for Homepage/Viewer settings editors.
            // Data Manager does not render a font dropdown.
            return null;
        }

        async function updateFonts() {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                showToast('Choose a library folder first.', 'error');
                return;
            }

            setStatus('Scanning for fonts...');
            showToast('Scanning for fonts...', 'info');

            try {
                const fontsDir = await getFontsDir();
                const fontFileGroups = new Map();
                const validExtensions = ['.woff', '.woff2', '.ttf', '.otf'];

                const parseFontName = (fileName, folderName) => {
                    const name = fileName.split('.')[0];
                    let weight = 400;
                    let style = 'normal';
                    let family = folderName.replace(/[-_]/g, ' ');

                    const keywords = {
                        'thin': 100, 'extralight': 200, 'light': 300, 'regular': 400,
                        'medium': 500, 'semibold': 600, 'bold': 700, 'extrabold': 800,
                        'black': 900, 'heavy': 900,
                        'italic': 'italic', 'oblique': 'oblique'
                    };

                    const parts = name.replace(/[-_]/g, ' ').split(' ');
                    const familyParts = [];

                    for (const part of parts) {
                        const lowerPart = part.toLowerCase();
                        if (keywords[lowerPart]) {
                            if (typeof keywords[lowerPart] === 'number') {
                                weight = keywords[lowerPart];
                            } else {
                                style = keywords[lowerPart];
                            }
                        } else {
                            familyParts.push(part);
                        }
                    }

                    if (familyParts.length > 0) {
                        family = familyParts.join(' ');
                    }
                    
                    if (name.toLowerCase().includes('bolditalic')) {
                        weight = 700;
                        style = 'italic';
                    }

                    return { family, weight, style };
                };

                const findFonts = async (dirHandle, pathPrefix = '') => {
                    for await (const [name, handle] of dirHandle.entries()) {
                        if (handle.kind === 'directory') {
                            await findFonts(handle, `${pathPrefix}${name}/`);
                        } else if (handle.kind === 'file') {
                            const fileExtension = name.slice(name.lastIndexOf('.')).toLowerCase();
                            if (validExtensions.includes(fileExtension)) {
                                const { family, weight, style } = parseFontName(name, dirHandle.name);
                                const formatMap = { '.woff': 'woff', '.woff2': 'woff2', '.ttf': 'truetype', '.otf': 'opentype' };
                                const format = formatMap[fileExtension];
                                const src = `url(../fonts/${pathPrefix}${name}) format('${format}')`;

                                if (!fontFileGroups.has(family)) {
                                    fontFileGroups.set(family, []);
                                }
                                fontFileGroups.get(family).push({ weight, style, src });
                            }
                        }
                    }
                };

                await findFonts(fontsDir, '');

                if (fontFileGroups.size === 0) {
                    setStatus('No valid font files found.');
                    showToast('No valid font files found in the /fonts directory.', 'error');
                    return;
                }

                let fontCss = '/* Generated by Data Manager */\n\n';
                const fontsJson = [];

                for (const [family, variations] of fontFileGroups.entries()) {
                    variations.forEach(v => {
                        fontCss += `@font-face {\n`;
                        fontCss += `  font-family: '${family}';\n`;
                        fontCss += `  font-style: ${v.style};\n`;
                        fontCss += `  font-weight: ${v.weight};\n`;
                        fontCss += `  src: ${v.src};\n`;
                        fontCss += `}\n\n`;
                    });

                    if (!fontsJson.some(f => f.name === family)) {
                        fontsJson.push({
                            name: family,
                            family: `'${family}', sans-serif`,
                            source: 'local'
                        });
                    }
                }

                const cssDir = await getDirectory('css', true);
                await writeFile(cssDir, 'fonts.css', fontCss);

        const dbDir = await getDatabaseDir();
        await writeFile(dbDir, 'fonts.json', JSON.stringify(fontsJson, null, 2));

        // Also update fonts.js for homepage and viewer to use
        const fontsJsContent = 'window.FONTS = ' + JSON.stringify(fontsJson, null, 2) + ';\n';
        await writeFile(dbDir, 'fonts.js', fontsJsContent);

        await loadFontsIntoSelect();

        setStatus(`Successfully updated ${fontFileGroups.size} font families.`);
        showToast(`🔤 Updated ${fontFileGroups.size} font families.`, 'success');

            } catch (e) {
                setStatus(`Error updating fonts: ${e.message}`);
                showToast(`Error updating fonts: ${e.message}`, 'error');
                console.error(e);
            }
        }


        async function loadLibrary() {
            if (!state.rootHandle) {
                return;
            }

            clearLibraryPreviewCaches();
            const databaseDir = await getDatabaseDir();
            const catalog = await readJsonFile(databaseDir, 'catalog.json');
            state.stories = normalizeCatalog(catalog);
            selectedStoryIds.clear();

            const settingsData = await readJsonFile(databaseDir, 'settings.json');
            if (settingsData) {
                syncSettingsToLocalStorage(settingsData);
            }
            renderStoryList();
            renderImageManager();
            setStatus(`Loaded ${state.stories.length} stories from ${state.rootHandle.name}.`);
            saveRecentFolder(state.rootHandle);
        }

        async function scanLibrary() {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }

            clearLibraryPreviewCaches();
            const databaseDir = await getDatabaseDir();
            const storyDir = await getStoryDir();
            const imageDir = await getImageDir();
            const existingCatalog = normalizeCatalog(await readJsonFile(databaseDir, 'catalog.json'));
            const existingMap = new Map(existingCatalog.map(entry => [entry.id, entry]));
            const hasExistingOrder = hasDisplayOrder(existingCatalog);
            let nextDisplayOrder = hasExistingOrder ? getNextDisplayOrder(existingCatalog) : 0;

            const validExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif', '.mp4', '.webm', '.mov', '.m4v', '.ogg', '.ogv', '.avi'];
            const coverExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif', '.mp4', '.webm', '.mov', '.m4v', '.ogg', '.ogv', '.avi'];
            const imageMap = new Map();
            const coverMediaMap = new Map();

            for await (const [name, handle] of imageDir.entries()) {
                if (handle.kind !== 'file') continue;
                const lower = name.toLowerCase();
                const ext = lower.slice(lower.lastIndexOf('.'));

                const coverMatch = name.match(/^(.+?)_cover\.[a-z0-9]+$/i);
                if (coverMatch) {
                    if (!coverExt.includes(ext)) {
                        continue;
                    }
                    const id = coverMatch[1];
                    const mediaType = detectCoverMediaType(name, '');
                    if (mediaType === 'gif' || mediaType === 'video' || mediaType === 'image') {
                        coverMediaMap.set(id, {
                            path: `media-scr/${name}`,
                            type: mediaType,
                        });
                    }
                    continue;
                }
                if (!validExt.includes(ext)) continue;

                const match = name.match(/^(.+?)_(\d+)\./);
                if (!match) continue;
                const id = match[1];
                const order = parseInt(match[2], 10) || 0;
                if (!imageMap.has(id)) {
                    imageMap.set(id, []);
                }
                imageMap.get(id).push({ name, order });
            }

            let nextReportNumber = existingCatalog.reduce((acc, story) => Math.max(acc, story.reportNumber || 0), 0) + 1;
            const rebuilt = [];

            for await (const [name, handle] of storyDir.entries()) {
                if (handle.kind !== 'file' || !name.toLowerCase().endsWith('.md')) {
                    continue;
                }
                const id = name.slice(0, -3);
                const existing = existingMap.get(id);
                const reportNumber = existing?.reportNumber || nextReportNumber++;
                const title = existing?.title || `The Report #${reportNumber}`;
                const description = existing?.description || '';
                const tags = Array.isArray(existing?.tags) ? existing.tags : [];
                const fallbackCoverPosition = formatCoverPositionValue(
                    normalizeCoverPosition(existing?.coverPosition || '50% 50%')
                );
                const coverPositions = normalizeCoverPositionMap(existing?.coverPositions, fallbackCoverPosition);
                const coverPosition = coverPositions.grid || fallbackCoverPosition;

                const images = (imageMap.get(id) || [])
                    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
                    .map(item => `media-scr/${item.name}`);

                const coverMedia = coverMediaMap.get(id) || (existing && existing.coverMedia ? existing.coverMedia : null);
                let cover = images[0] || '';
                if (coverMedia && (coverMedia.type === 'gif' || coverMedia.type === 'video' || coverMedia.type === 'image')) {
                    cover = coverMedia.path;
                } else if (existing?.cover && images.includes(existing.cover)) {
                    cover = existing.cover;
                }
                const file = await handle.getFile();
                const createdAt = existing?.createdAt || new Date(file.lastModified).toISOString();
                const updatedAt = new Date().toISOString();

                const displayOrder = Number.isFinite(existing?.displayOrder)
                    ? existing.displayOrder
                    : (hasExistingOrder ? nextDisplayOrder++ : undefined);

                rebuilt.push({
                    id,
                    reportNumber,
                    title,
                    description,
                    tags,
                    cover,
                    coverMedia: coverMedia && coverMedia.path ? coverMedia : null,
                    coverPosition,
                    coverPositions,
                    images,
                    story: `story/${name}`,
                    createdAt,
                    updatedAt,
                    displayOrder,
                });
            }

            state.stories = rebuilt;
            sortStories();
            await writeCatalog(state.stories);
            renderStoryList();
            renderImageManager();
            setStatus(`Scanned library and rebuilt ${state.stories.length} stories.`);
            saveRecentFolder(state.rootHandle);
        }

        async function writeCatalog(catalog) {
            const databaseDir = await getDatabaseDir();
            const jsonCatalog = catalog.map(entry => {
                const { storyText, ...rest } = entry;
                return rest;
            });
            const catalogJson = JSON.stringify(jsonCatalog, null, 2);

            const storyDir = await getStoryDir();
            const catalogWithText = [];
            for (const entry of catalog) {
                const storyText = entry.storyText || await readTextFile(storyDir, `${entry.id}.md`);
                catalogWithText.push({ ...entry, storyText });
            }
            const rawSettings = (await readJsonFile(databaseDir, 'settings.json')) || {};
            const viewerSettings = extractViewerSettings(rawSettings);
            const catalogJs = `window.REPORT_CATALOG = ${JSON.stringify(catalogWithText, null, 2)};\n` +
                `window.VIEWER_SETTINGS = ${JSON.stringify(viewerSettings, null, 2)};\n`;

            await writeFile(databaseDir, 'catalog.json', catalogJson);
            await writeFile(databaseDir, 'catalog.js', catalogJs);
        }

        async function writeCatalogSafetyBackup() {
            if (!state.rootHandle) {
                return;
            }
            try {
                const databaseDir = await getDatabaseDir();
                const backupJson = JSON.stringify(state.stories || [], null, 2);
                await writeFile(databaseDir, 'catalog.backup.latest.json', backupJson);
            } catch (error) {
                // non-blocking safety backup
            }
        }

        function sortStories() {
            if (hasDisplayOrder()) {
                state.stories.sort((a, b) => {
                    const aOrder = Number.isFinite(a.displayOrder) ? a.displayOrder : Number.MAX_SAFE_INTEGER;
                    const bOrder = Number.isFinite(b.displayOrder) ? b.displayOrder : Number.MAX_SAFE_INTEGER;
                    if (aOrder !== bOrder) {
                        return aOrder - bOrder;
                    }
                    return (a.reportNumber || 0) - (b.reportNumber || 0);
                });
                return;
            }
            state.stories.sort((a, b) => (a.reportNumber || 0) - (b.reportNumber || 0));
        }

        function applyDisplayOrder() {
            state.stories.forEach((story, index) => {
                story.displayOrder = index;
            });
        }

        function clearStoryDropPlaceholder() {
            storyDropIndex = null;
            if (storyListEl) {
                storyListEl.classList.remove('drag-active');
            }
            if (storyDropPlaceholderEl && storyDropPlaceholderEl.parentElement) {
                storyDropPlaceholderEl.remove();
            }
        }

        function ensureStoryDropPlaceholder(height) {
            if (!storyDropPlaceholderEl) {
                storyDropPlaceholderEl = document.createElement('div');
                storyDropPlaceholderEl.className = 'story-drop-placeholder';
            }
            if (height && Number.isFinite(height)) {
                storyDropPlaceholderEl.style.height = `${Math.max(40, Math.round(height))}px`;
            }
            return storyDropPlaceholderEl;
        }

        function updateStoryDropPlaceholder(clientY) {
            if (!storyListEl || !storyDragId) {
                return;
            }
            autoScrollDuringDrag(storyListEl, clientY);
            const cards = Array.from(storyListEl.querySelectorAll('.story-card'))
                .filter(card => card.dataset.id !== storyDragId && !card.classList.contains('dragging'));
            const nextIndex = getDropIndexFromClientY(cards, clientY);
            storyDropIndex = nextIndex;

            const draggingCard = storyListEl.querySelector('.story-card.dragging');
            const placeholder = ensureStoryDropPlaceholder(draggingCard ? draggingCard.getBoundingClientRect().height : 48);
            const reference = cards[nextIndex] || null;
            if (reference) {
                storyListEl.insertBefore(placeholder, reference);
            } else {
                storyListEl.appendChild(placeholder);
            }
            storyListEl.classList.add('drag-active');
        }

        function renderStoryList() {
            storyListEl.innerHTML = '';

            if (state.stories.length === 0) {
                const empty = document.createElement('p');
                empty.textContent = 'No stories yet.';
                storyListEl.appendChild(empty);
                return;
            }

            state.stories.forEach(story => {
                const card = document.createElement('div');
                card.className = 'story-card';
                card.dataset.id = story.id;
                if (selectedStoryIds.has(story.id)) {
                    card.classList.add('selected');
                }

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'story-check';
                checkbox.checked = selectedStoryIds.has(story.id);
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        selectedStoryIds.add(story.id);
                    } else {
                        selectedStoryIds.delete(story.id);
                    }
                    renderStoryList();
                });

                const info = document.createElement('div');
                info.className = 'story-info';
                const title = document.createElement('strong');
                title.textContent = story.title || `The Report #${story.reportNumber || ''}`;
                const meta = document.createElement('div');
                meta.className = 'story-meta';
                meta.textContent = story.description || story.id;

                info.appendChild(title);
                info.appendChild(meta);

                if (story.tags && story.tags.length > 0) {
                    const tagList = document.createElement('div');
                    tagList.className = 'tag-list';
                    story.tags.forEach(tag => {
                        const pill = document.createElement('span');
                        pill.className = 'tag';
                        pill.textContent = tag;
                        tagList.appendChild(pill);
                    });
                    info.appendChild(tagList);
                }

                const actions = document.createElement('div');
                actions.className = 'story-actions';

                const editBtn = document.createElement('button');
                editBtn.type = 'button';
                editBtn.className = 'icon-btn';
                editBtn.title = 'Edit story';
                editBtn.textContent = '✏️';
                editBtn.addEventListener('click', () => editStory(story.id));

                const previewBtn = document.createElement('button');
                previewBtn.type = 'button';
                previewBtn.textContent = '👁️';
                previewBtn.className = 'ghost icon-btn';
                previewBtn.title = 'Preview story';
                previewBtn.addEventListener('click', () => {
                    void openStoryPreviewInSelectedLibrary(story.id);
                });

                actions.appendChild(editBtn);
                actions.appendChild(previewBtn);

                const dragHandle = document.createElement('button');
                dragHandle.type = 'button';
                dragHandle.className = 'drag-handle';
                dragHandle.textContent = '↕️';
                dragHandle.title = 'Drag to reorder';
                dragHandle.draggable = true;
                dragHandle.addEventListener('dragstart', event => {
                    storyDragId = story.id;
                    card.classList.add('dragging');
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', story.id);
                    updateStoryDropPlaceholder(event.clientY);
                });
                dragHandle.addEventListener('dragend', () => {
                    storyDragId = null;
                    card.classList.remove('dragging');
                    clearStoryDropPlaceholder();
                });

                card.appendChild(checkbox);
                card.appendChild(info);
                card.appendChild(actions);
                card.appendChild(dragHandle);
                storyListEl.appendChild(card);
            });
        }

        async function reorderStoryToIndex(fromId, targetIndex) {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }
            const fromIndex = state.stories.findIndex(story => story.id === fromId);
            if (fromIndex < 0) {
                return;
            }
            const [moved] = state.stories.splice(fromIndex, 1);
            const insertIndex = Math.max(0, Math.min(state.stories.length, Number.isFinite(targetIndex) ? targetIndex : state.stories.length));
            state.stories.splice(insertIndex, 0, moved);
            if (insertIndex === fromIndex) {
                return;
            }

            applyDisplayOrder();
            await writeCatalog(state.stories);
            renderStoryList();
            setStatus('Story order updated.');
        }

        async function editStory(id) {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }

            const story = state.stories.find(item => item.id === id);
            if (!story) {
                return;
            }

            state.selectedId = id;
            state.selectedEntry = story;

            reportNumberInput.value = story.reportNumber || '';
            reportTitleInput.value = story.title || '';
            reportDescriptionInput.value = story.description || '';
            reportTagsInput.value = (story.tags || []).join(', ');
            const fallbackCoverPosition = story.coverPosition || '50% 50%';
            coverPositionsByLayout = normalizeCoverPositionMap(story.coverPositions, fallbackCoverPosition);
            coverPresetMode = sanitizeCoverPresetMode(localStorage.getItem('homepageLayout') || coverPresetMode);
            coverPositionInput.value = coverPositionsByLayout[coverPresetMode] || coverPositionsByLayout.grid || fallbackCoverPosition;
            workingMediaItems = Array.isArray(story.images)
                ? story.images.map(path => createMediaItemFromPath(path))
                : [];
            selectedMediaIds.clear();

            externalCoverMedia = null;
            if (story.coverMedia && typeof story.coverMedia === 'object' && story.coverMedia.path) {
                const type = detectCoverMediaType(story.coverMedia.path, story.coverMedia.type || '');
                if (type === 'gif' || type === 'video' || type === 'image') {
                    externalCoverMedia = {
                        source: 'existing',
                        file: null,
                        path: story.coverMedia.path,
                        name: getFileName(story.coverMedia.path),
                        mediaType: type,
                        previewUrl: '',
                        previewMissing: false,
                        previewPending: false,
                    };
                }
            }

            if (!externalCoverMedia && story.cover) {
                const coverName = getFileName(story.cover);
                if (new RegExp(`^${escapeRegExp(id)}_cover\\.`, 'i').test(coverName)) {
                    const type = detectCoverMediaType(story.cover, '');
                    if (type === 'gif' || type === 'video' || type === 'image') {
                        externalCoverMedia = {
                            source: 'existing',
                            file: null,
                            path: story.cover,
                            name: coverName,
                            mediaType: type,
                            previewUrl: '',
                            previewMissing: false,
                            previewPending: false,
                        };
                    }
                }
            }

            if (externalCoverMedia && story.cover === externalCoverMedia.path) {
                coverSelection = { kind: 'external' };
            } else if (story.cover && Array.isArray(story.images)) {
                const idx = story.images.findIndex(img => img === story.cover);
                if (idx >= 0 && workingMediaItems[idx]) {
                    coverSelection = { kind: 'image', itemId: workingMediaItems[idx].id };
                } else {
                    coverSelection = null;
                }
            } else {
                coverSelection = null;
            }
            normalizeCoverSelection();
            coverPosition = normalizeCoverPosition(coverPositionInput.value);
            coverViewportPosition = { x: 50, y: 50 };
            updateCoverPresetModeButtons();
            renderCoverPresetGrid();
            applyCoverPosition();

            const storyDir = await getStoryDir();
            storyTextInput.value = await readTextFile(storyDir, `${id}.md`);

            storyFileInput.value = '';
            imageManagerInput.value = '';
            if (replaceImageInput) {
                replaceImageInput.value = '';
            }
            coverMediaInput.value = '';
            renderImageManager();

            setStatus(`Editing ${story.title || story.id}.`);
            saveRecentStory(story);
        }

        function resetForm() {
            storyForm.reset();
            reportTitleInput.value = '';
            reportDescriptionInput.value = '';
            reportTagsInput.value = '';
            coverPositionsByLayout = normalizeCoverPositionMap(null, '50% 50%');
            coverPositionInput.value = coverPositionsByLayout.grid;
            storyFileInput.value = '';
            storyTextInput.value = '';
            imageManagerInput.value = '';
            coverMediaInput.value = '';
            state.selectedId = null;
            state.selectedEntry = null;
            workingMediaItems = [];
            selectedMediaIds.clear();
            externalCoverMedia = null;
            coverSelection = null;
            coverPosition = normalizeCoverPosition(coverPositionsByLayout[sanitizeCoverPresetMode(coverPresetMode)] || coverPositionsByLayout.grid);
            coverViewportPosition = { x: 50, y: 50 };
            coverPositionsByLayoutBeforeEdit = null;
            coverPositionBeforeEdit = null;
            coverViewportPositionBeforeEdit = null;
            pendingReplaceMediaId = null;
            releaseUnusedMediaUrls();
            clearLibraryPreviewAssetUrls();
            updateCoverPresetModeButtons();
            renderCoverPresetGrid();
            applyCoverPosition();
            renderImageManager();
        }

        async function removeStoryFiles(id) {
            const storyDir = await getStoryDir();
            try {
                await storyDir.removeEntry(`${id}.md`);
            } catch (error) {
                // ignore
            }

            const imageDir = await getImageDir();
            for await (const [name] of imageDir.entries()) {
                if (name.startsWith(`${id}_`)) {
                    await imageDir.removeEntry(name);
                }
            }
        }

        async function cleanupUnusedImages() {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }

            if (!state.selectedId || !state.selectedEntry) {
                setStatus('Select a story to clean up first.');
                return;
            }

            const imageDir = await getImageDir();
            const keep = new Set((state.selectedEntry.images || []).map(path => path.split('/').pop()));
            if (state.selectedEntry.coverMedia && state.selectedEntry.coverMedia.path) {
                const coverName = getFileName(state.selectedEntry.coverMedia.path);
                if (coverName) {
                    keep.add(coverName);
                }
            }

            for await (const [name] of imageDir.entries()) {
                if (name.startsWith(`${state.selectedId}_`) && !keep.has(name)) {
                    await imageDir.removeEntry(name);
                }
            }

            setStatus('Cleaned unused images.');
        }

        async function handleSave(event) {
            event.preventDefault();

            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }

            let reportNumber = parseInt(reportNumberInput.value, 10);
            if (!reportNumber) {
                reportNumber = getNextReportNumber();
            }

            const id = state.selectedId || generateStoryId();
            const title = reportTitleInput.value.trim() || `The Report #${reportNumber}`;
            const description = reportDescriptionInput.value.trim();
            const tags = parseTags(reportTagsInput.value);
            const fallbackCoverPosition = coverPositionInput && coverPositionInput.value ? coverPositionInput.value : '50% 50%';
            coverPositionsByLayout = normalizeCoverPositionMap(coverPositionsByLayout, fallbackCoverPosition);
            const activeMode = sanitizeCoverPresetMode(coverPresetMode);
            coverPosition = normalizeCoverPosition(coverPositionsByLayout[activeMode] || coverPositionInput.value || '50% 50%');
            coverViewportPosition = { x: 50, y: 50 };
            const activeModePositionValue = formatCoverPositionValue(coverPosition);
            coverPositionsByLayout[activeMode] = activeModePositionValue;
            const coverPositionValue = coverPositionsByLayout.grid || activeModePositionValue;
            coverPositionInput.value = coverPositionValue;
            const storyMarkdown = storyTextInput.value.trim();

            if (!storyMarkdown) {
                setStatus('Story text is required.');
                return;
            }

            if (workingMediaItems.length === 0 && !externalCoverMedia) {
                setStatus('Add at least one story media item or homepage cover.');
                return;
            }
            try {
                await writeCatalogSafetyBackup();

                const persistedImages = await persistStoryImages(id, workingMediaItems);
                const imagePaths = persistedImages.paths;
                const pathByItemId = persistedImages.pathByItemId;
                const shouldUseExternalCover = !!(coverSelection && coverSelection.kind === 'external' && externalCoverMedia);
                const coverMedia = await persistCoverMedia(id, shouldUseExternalCover ? externalCoverMedia : null);

                if (imagePaths.length === 0 && !(coverMedia && coverMedia.path)) {
                    throw new Error('Story must include at least one story media item or homepage cover.');
                }

                let cover = imagePaths[0] || '';
                if (coverSelection && coverSelection.kind === 'image') {
                    const selectedCoverPath = pathByItemId.get(coverSelection.itemId);
                    if (selectedCoverPath) {
                        cover = selectedCoverPath;
                    }
                }
                if (coverSelection && coverSelection.kind === 'external' && coverMedia && coverMedia.path) {
                    cover = coverMedia.path;
                }
                if (!cover && coverMedia && coverMedia.path) {
                    cover = coverMedia.path;
                }

                const existingDisplayOrder = state.selectedEntry && Number.isFinite(state.selectedEntry.displayOrder)
                    ? state.selectedEntry.displayOrder
                    : undefined;
                const displayOrder = Number.isFinite(existingDisplayOrder)
                    ? existingDisplayOrder
                    : (hasDisplayOrder() ? getNextDisplayOrder() : undefined);
                const createdAt = (state.selectedEntry && state.selectedEntry.createdAt) || new Date().toISOString();
                const updatedAt = new Date().toISOString();

                const storyFile = `${id}.md`;
                const storyDir = await getStoryDir();
                await writeFile(storyDir, storyFile, storyMarkdown);

                const entry = {
                    id,
                    reportNumber,
                    title,
                    description,
                    tags,
                    cover,
                    coverMedia: coverMedia && coverMedia.path ? coverMedia : null,
                    coverPosition: coverPositionValue,
                    coverPositions: { ...coverPositionsByLayout },
                    images: imagePaths,
                    story: `story/${storyFile}`,
                    createdAt,
                    updatedAt,
                    displayOrder,
                };

                const existingIndex = state.stories.findIndex(item => item.id === id);
                if (existingIndex >= 0) {
                    state.stories[existingIndex] = entry;
                } else {
                    state.stories.push(entry);
                }

                sortStories();
                await writeCatalog(state.stories);

                setStatus(`Saved ${title}.`);
                await loadLibrary();
                saveRecentStory(entry);
                resetForm();
                setStatus(`Saved ${title}. Ready for next story.`);
            } catch (error) {
                console.error('Save story failed:', error);
                const message = error && error.message ? error.message : 'Unknown error';
                setStatus(`Save failed: ${message}`);
                showToast(`Save failed: ${message}`, 'error');
            }
        }

        async function persistStoryImages(id, mediaItems) {
            const imageDir = await getImageDir();
            const ordered = Array.isArray(mediaItems) ? mediaItems : [];
            const sources = [];

            for (const item of ordered) {
                if (!item) {
                    continue;
                }
                if (item.source === 'new' && item.file) {
                    sources.push({
                        itemId: item.id,
                        file: item.file,
                        extension: getFileExtension(item.file.name) || 'jpg',
                    });
                    continue;
                }
                if (item.path) {
                    const existingName = getFileName(item.path);
                    if (!existingName) {
                        throw new Error('One or more media paths are invalid. Re-add the file before saving.');
                    }
                    try {
                        const fileHandle = await imageDir.getFileHandle(existingName);
                        const file = await fileHandle.getFile();
                        sources.push({
                            itemId: item.id,
                            file,
                            extension: getFileExtension(existingName) || 'jpg',
                        });
                    } catch (error) {
                        throw new Error(`Media file is missing: ${existingName}. Run Fix Missing or re-add the file.`);
                    }
                    continue;
                }
                throw new Error('One or more media items are invalid. Re-add the file before saving.');
            }

            // Safety: if there are no resolved image sources, do not delete any existing files here.
            // Save caller can still proceed with homepage-cover-only stories.
            if (sources.length === 0) {
                return { paths: [], pathByItemId: new Map() };
            }
            const paths = [];
            const pathByItemId = new Map();
            const targetNames = [];
            const tempNames = [];
            const tempToken = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

            try {
                for (let index = 0; index < sources.length; index += 1) {
                    const source = sources[index];
                    const extension = /^[a-z0-9]+$/i.test(source.extension) ? source.extension.toLowerCase() : 'jpg';
                    const tempName = `${id}__tmp_${tempToken}_${String(index + 1).padStart(3, '0')}.${extension}`;
                    const tempHandle = await imageDir.getFileHandle(tempName, { create: true });
                    const tempWritable = await tempHandle.createWritable();
                    await tempWritable.write(await source.file.arrayBuffer());
                    await tempWritable.close();
                    tempNames.push(tempName);
                }

                for (let index = 0; index < sources.length; index += 1) {
                    const source = sources[index];
                    const extension = /^[a-z0-9]+$/i.test(source.extension) ? source.extension.toLowerCase() : 'jpg';
                    const fileName = `${id}_${String(index + 1).padStart(3, '0')}.${extension}`;
                    const tempHandle = await imageDir.getFileHandle(tempNames[index]);
                    const tempFile = await tempHandle.getFile();
                    const fileHandle = await imageDir.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(await tempFile.arrayBuffer());
                    await writable.close();
                    targetNames.push(fileName);

                    const path = `media-scr/${fileName}`;
                    paths.push(path);
                    if (source.itemId) {
                        pathByItemId.set(source.itemId, path);
                    }
                }

                const keepNames = new Set(targetNames);
                const existingPattern = new RegExp(`^${escapeRegExp(id)}_\\d+\\.[a-z0-9]+$`, 'i');
                for await (const [name] of imageDir.entries()) {
                    if (existingPattern.test(name) && !keepNames.has(name)) {
                        await imageDir.removeEntry(name);
                    }
                }
            } finally {
                for (const tempName of tempNames) {
                    try {
                        await imageDir.removeEntry(tempName);
                    } catch (error) {
                        // ignore cleanup errors
                    }
                }
            }

            return { paths, pathByItemId };
        }

        async function persistCoverMedia(id, media) {
            const imageDir = await getImageDir();
            let sourceFile = null;
            let mediaType = '';
            let extension = '';

            if (media && (media.mediaType === 'gif' || media.mediaType === 'video' || media.mediaType === 'image')) {
                mediaType = media.mediaType;
                if (media.source === 'new' && media.file) {
                    sourceFile = media.file;
                    extension = getFileExtension(media.file.name);
                } else if (media.path) {
                    const fileName = getFileName(media.path);
                    if (fileName) {
                        try {
                            const fileHandle = await imageDir.getFileHandle(fileName);
                            sourceFile = await fileHandle.getFile();
                            extension = getFileExtension(fileName);
                        } catch (error) {
                            sourceFile = null;
                        }
                    }
                }
            }
            const coverPattern = new RegExp(`^${escapeRegExp(id)}_cover\\.[a-z0-9]+$`, 'i');
            const existingCoverNames = [];
            for await (const [name] of imageDir.entries()) {
                if (coverPattern.test(name)) {
                    existingCoverNames.push(name);
                }
            }

            if (!sourceFile || !mediaType) {
                if (media) {
                    const missingName = media.path ? (getFileName(media.path) || media.path) : (media.name || 'cover media');
                    throw new Error(`Cover media is missing: ${missingName}. Re-add homepage cover before saving.`);
                }
                for (const name of existingCoverNames) {
                    await imageDir.removeEntry(name);
                }
                return null;
            }

            const safeExtension = /^[a-z0-9]+$/i.test(extension)
                ? extension.toLowerCase()
                : (mediaType === 'video' ? 'mp4' : (mediaType === 'gif' ? 'gif' : 'jpg'));
            const fileName = `${id}_cover.${safeExtension}`;
            const tempName = `${id}__tmp_cover_${Date.now()}.${safeExtension}`;

            try {
                const tempHandle = await imageDir.getFileHandle(tempName, { create: true });
                const tempWritable = await tempHandle.createWritable();
                await tempWritable.write(await sourceFile.arrayBuffer());
                await tempWritable.close();

                const tempFile = await tempHandle.getFile();
                const fileHandle = await imageDir.getFileHandle(fileName, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(await tempFile.arrayBuffer());
                await writable.close();

                for (const existingName of existingCoverNames) {
                    if (existingName !== fileName) {
                        await imageDir.removeEntry(existingName);
                    }
                }
            } finally {
                try {
                    await imageDir.removeEntry(tempName);
                } catch (error) {
                    // ignore cleanup errors
                }
            }

            return {
                path: `media-scr/${fileName}`,
                type: mediaType,
            };
        }

        async function cleanupImagesById(id, keepPaths) {
            const imageDir = await getImageDir();
            const keep = new Set((keepPaths || []).map(path => getFileName(path)).filter(Boolean));
            for await (const [name] of imageDir.entries()) {
                if (name.startsWith(`${id}_`) && !keep.has(name)) {
                    await imageDir.removeEntry(name);
                }
            }
        }

        async function handleRemove() {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }

            const idsToRemove = selectedStoryIds.size > 0
                ? Array.from(selectedStoryIds)
                : (state.selectedId ? [state.selectedId] : []);

            if (idsToRemove.length === 0) {
                setStatus('Select a story to remove.');
                return;
            }

            const confirmedRemove = await themedConfirm(
                `Remove ${idsToRemove.length} selected stor${idsToRemove.length > 1 ? 'ies' : 'y'}?`,
                {
                    title: 'Remove Stories',
                    type: 'warning',
                    confirmText: 'Remove',
                    cancelText: 'Keep',
                    dangerConfirm: true,
                },
            );
            if (!confirmedRemove) {
                return;
            }

            for (const id of idsToRemove) {
                if (deleteFilesCheckbox.checked) {
                    await removeStoryFiles(id);
                }
            }

            state.stories = state.stories.filter(item => !idsToRemove.includes(item.id));
            await writeCatalog(state.stories);

            selectedStoryIds.clear();
            resetForm();
            renderStoryList();
            setStatus(`Removed ${idsToRemove.length} stor${idsToRemove.length > 1 ? 'ies' : 'y'}.`);
        }

        async function fixMissingFiles() {
            if (!state.rootHandle) {
                setStatus('Choose a library folder first.');
                return;
            }

            if (!supportsFileSystemAccess()) {
                setStatus('File System Access API not supported.');
                return;
            }

            await loadLibrary();
            await writeCatalogSafetyBackup();
            const storyDir = await getStoryDir();
            const imageDir = await getImageDir();

            let fixedCount = 0;
            let removedCount = 0;
            let errorCount = 0;

            for (let i = state.stories.length - 1; i >= 0; i -= 1) {
                const entry = state.stories[i];
                const title = entry.title || entry.id;
                try {

                    const storyFileName = `${entry.id}.md`;
                    const storyExists = await fileExists(storyDir, storyFileName);
                    if (!storyExists) {
                        const locate = await themedConfirm(`Story file missing for "${title}". Locate a file now?`, {
                            title: 'Missing Story File',
                            type: 'warning',
                            confirmText: 'Locate File',
                            cancelText: 'Skip',
                        });
                        if (locate) {
                            try {
                                const handle = await pickRelocationFile({
                                    types: [
                                        {
                                            description: 'Markdown or Text',
                                            accept: { 'text/plain': ['.md', '.txt'] },
                                        },
                                    ],
                                });
                                if (handle) {
                                    const file = await handle.getFile();
                                    const text = await file.text();
                                    await writeFile(storyDir, storyFileName, text);
                                    entry.story = `story/${storyFileName}`;
                                    fixedCount += 1;
                                }
                            } catch (error) {
                                // user cancelled
                            }
                        } else {
                            const removeStory = await themedConfirm(`Remove "${title}" from the catalog?`, {
                                title: 'Remove From Catalog',
                                type: 'warning',
                                confirmText: 'Remove',
                                cancelText: 'Keep',
                                dangerConfirm: true,
                            });
                            if (removeStory) {
                                state.stories.splice(i, 1);
                                removedCount += 1;
                                continue;
                            }
                        }
                    }

                    if (Array.isArray(entry.images)) {
                        for (let j = entry.images.length - 1; j >= 0; j -= 1) {
                            const imagePath = entry.images[j];
                            const fileName = getFileName(imagePath);
                            if (!fileName) continue;
                            const mediaType = detectCoverMediaType(fileName, '');
                            const imageExists = await fileExists(imageDir, fileName);
                            if (!imageExists) {
                                const mediaLabel = mediaType === 'video' ? 'Video' : (mediaType === 'gif' ? 'GIF' : 'Image');
                                const locateImage = await themedConfirm(`${mediaLabel} missing (${fileName}) for "${title}". Locate a replacement?`, {
                                    title: `Missing ${mediaLabel}`,
                                    type: 'warning',
                                    confirmText: 'Locate',
                                    cancelText: 'Skip',
                                });
                                if (locateImage) {
                                    try {
                                        const handle = await pickRelocationFile({
                                            types: [
                                                {
                                                    description: mediaType === 'video' ? 'Video files' : 'Image files',
                                                    accept: mediaType === 'video'
                                                        ? { 'video/*': ['.mp4', '.webm', '.mov', '.m4v', '.ogg', '.ogv', '.avi'] }
                                                        : { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg', '.avif'] },
                                                },
                                            ],
                                        });
                                        if (handle) {
                                            const file = await handle.getFile();
                                            const buffer = await file.arrayBuffer();
                                            const outHandle = await imageDir.getFileHandle(fileName, { create: true });
                                            const writable = await outHandle.createWritable();
                                            await writable.write(buffer);
                                            await writable.close();
                                            fixedCount += 1;
                                        }
                                    } catch (error) {
                                        // user cancelled
                                    }
                                } else {
                                    const removeImage = await themedConfirm(`Remove missing ${mediaLabel.toLowerCase()} (${fileName}) from the catalog?`, {
                                        title: `Remove Missing ${mediaLabel}`,
                                        type: 'warning',
                                        confirmText: 'Remove',
                                        cancelText: 'Keep',
                                        dangerConfirm: true,
                                    });
                                    if (removeImage) {
                                        entry.images.splice(j, 1);
                                        removedCount += 1;
                                    }
                                }
                            }
                        }
                    }

                    if (entry.coverMedia && entry.coverMedia.path) {
                        const mediaName = getFileName(entry.coverMedia.path);
                        const mediaExists = mediaName ? await fileExists(imageDir, mediaName) : false;
                        if (!mediaExists) {
                            const locateCover = await themedConfirm(`Cover media missing (${mediaName || 'unknown'}) for "${title}". Locate a replacement?`, {
                                title: 'Missing Cover Media',
                                type: 'warning',
                                confirmText: 'Locate',
                                cancelText: 'Skip',
                            });
                            if (locateCover) {
                                try {
                                    const expectedCoverType = detectCoverMediaType(mediaName || '', entry.coverMedia.type || '');
                                    const handle = await pickRelocationFile({
                                        types: [
                                            {
                                                description: expectedCoverType === 'video' ? 'Video cover' : (expectedCoverType === 'gif' ? 'GIF cover' : 'Image cover'),
                                                accept: expectedCoverType === 'video'
                                                    ? { 'video/*': ['.mp4', '.webm', '.mov', '.m4v', '.ogg', '.ogv', '.avi'] }
                                                    : {
                                                        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif'],
                                                    },
                                            },
                                        ],
                                    });
                                    if (handle) {
                                        const file = await handle.getFile();
                                        const ext = getFileExtension(file.name)
                                            || (entry.coverMedia.type === 'video'
                                                ? 'mp4'
                                                : (entry.coverMedia.type === 'gif' ? 'gif' : 'jpg'));
                                        const outName = `${entry.id}_cover.${ext}`;
                                        const outHandle = await imageDir.getFileHandle(outName, { create: true });
                                        const writable = await outHandle.createWritable();
                                        await writable.write(await file.arrayBuffer());
                                        await writable.close();
                                        const mediaType = detectCoverMediaType(outName, file.type);
                                        entry.coverMedia = {
                                            path: `media-scr/${outName}`,
                                            type: mediaType,
                                        };
                                        fixedCount += 1;
                                    }
                                } catch (error) {
                                    // user cancelled
                                }
                            } else {
                                entry.coverMedia = null;
                                removedCount += 1;
                            }
                        }
                    }

                    if (entry.coverMedia && entry.coverMedia.path) {
                        entry.cover = entry.coverMedia.path;
                    } else if (entry.images && entry.images.length > 0) {
                        const coverName = getFileName(entry.cover);
                        if (!coverName || !(await fileExists(imageDir, coverName))) {
                            entry.cover = entry.images[0];
                        }
                    } else {
                        entry.cover = '';
                    }
                } catch (error) {
                    errorCount += 1;
                    console.error(`Fix Missing error for "${title}":`, error);
                }
            }

            await writeCatalog(state.stories);
            renderStoryList();
            if (errorCount > 0) {
                setStatus(`Fix completed. Repaired ${fixedCount} file(s), removed ${removedCount}, failed ${errorCount}.`);
                showToast(`Fix Missing finished with ${errorCount} error(s).`, 'warning');
            } else {
                setStatus(`Fix completed. Repaired ${fixedCount} file(s), removed ${removedCount} missing reference(s).`);
            }
        }

        if (autoScanToggle) {
            autoScanToggle.checked = loadAutoScanSetting();
            autoScanToggle.addEventListener('change', () => saveAutoScanSetting(autoScanToggle.checked));
        }
        if (closeAfterSaveToggle) {
            closeAfterSaveToggle.checked = true;
            closeAfterSaveToggle.disabled = true;
            saveCloseAfterSaveSetting(true);
        }

        chooseFolderBtn.addEventListener('click', async () => {
            await pickLibraryFolder();
            if (state.rootHandle) {
                showToast(`📂 Opened library: ${state.rootHandle.name}`, 'success');
            }
        });
        openRecentBtn.addEventListener('click', () => tryUseRecentHandle(false));
        if (openHomepageBtn) {
            openHomepageBtn.title = 'Open Homepage (Shift+Click to set library URL)';
            openHomepageBtn.addEventListener('click', event => {
                if (event.shiftKey) {
                    void promptForLibraryBaseUrl();
                    return;
                }
                void openHomepageFromSelectedLibrary();
            });
        }
        scanLibraryBtn.addEventListener('click', async () => {
            await scanLibrary();
            showToast(`🔄 Scanned library: ${state.stories.length} stories found`, 'info');
        });
        if (reloadCatalogBtn) {
            reloadCatalogBtn.addEventListener('click', loadLibrary);
        }

        if (updateFontsBtn) {
            updateFontsBtn.addEventListener('click', updateFonts);
        }

        fixMissingBtn.addEventListener('click', fixMissingFiles);
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                openHelpModal();
            });
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
        clearFormBtn.addEventListener('click', () => {
            resetForm();
            showToast('🗑️ Form cleared', 'info');
        });
        removeSelectedBtn.addEventListener('click', async () => {
            const idsToRemove = selectedStoryIds.size > 0 ? Array.from(selectedStoryIds) : (state.selectedId ? [state.selectedId] : []);
            if (idsToRemove.length > 0) {
                await handleRemove();
                showToast(`🗑️ Removed ${idsToRemove.length} story(ies)`, 'info');
            }
        });
        cleanupSelectedBtn.addEventListener('click', cleanupUnusedImages);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                closeHelpModal();
                closeMediaPreview();
                if (coverPositionOverlay && !coverPositionOverlay.hidden) {
                    cancelCoverPositionEdit();
                }
            }
        });

        storyForm.addEventListener('submit', handleSave);

        if (markdownToolbar) {
            markdownToolbar.addEventListener('click', event => {
                const button = event.target.closest('button[data-md-action]');
                if (!button) {
                    return;
                }
                event.preventDefault();
                void applyMarkdownAction(button.dataset.mdAction || '');
            });
        }

        if (loadStoryBtn) {
            loadStoryBtn.addEventListener('click', () => {
                if (storyFileInput) {
                    storyFileInput.click();
                }
            });
        }

        if (addImagesBtn) {
            addImagesBtn.addEventListener('click', () => {
                if (imageManagerInput) {
                    imageManagerInput.click();
                }
            });
        }
        if (imageManagerInput) {
            imageManagerInput.addEventListener('change', () => {
                const files = Array.from(imageManagerInput.files || []);
                const result = addMediaFiles(files);
                if (result && result.added > 0) {
                    showToast(`📷 Added ${result.added} file${result.added > 1 ? 's' : ''}.`, 'success');
                }
                imageManagerInput.value = '';
            });
        }
        if (replaceImageInput) {
            replaceImageInput.addEventListener('change', () => {
                const file = replaceImageInput.files && replaceImageInput.files[0];
                const targetId = pendingReplaceMediaId;
                pendingReplaceMediaId = null;
                if (!file || !targetId) {
                    replaceImageInput.value = '';
                    return;
                }
                const type = detectCoverMediaType(file.name, file.type);
                if (type !== 'image' && type !== 'gif' && type !== 'video') {
                    setStatus('Replacement must be an image/GIF/video file.');
                    showToast('Replacement must be an image/GIF/video file.', 'error');
                    replaceImageInput.value = '';
                    return;
                }
                const replaced = replaceMediaItemFile(targetId, file);
                if (!replaced) {
                    setStatus('Media to replace was not found.');
                    showToast('Media to replace was not found.', 'warning');
                    replaceImageInput.value = '';
                    return;
                }
                renderImageManager();
                setStatus(`Replaced media with ${file.name}.`);
                showToast(`🖼 Replaced media: ${file.name}`, 'success');
                replaceImageInput.value = '';
            });
        }
        if (removeImagesBtn) {
            removeImagesBtn.addEventListener('click', removeSelectedMedia);
        }
        if (cardHeightDecBtn) {
            cardHeightDecBtn.addEventListener('click', () => adjustImageCardHeight(-18));
        }
        if (cardHeightIncBtn) {
            cardHeightIncBtn.addEventListener('click', () => adjustImageCardHeight(18));
        }
        if (uploadCoverMediaBtn) {
            uploadCoverMediaBtn.addEventListener('click', () => {
                if (coverMediaInput) {
                    coverMediaInput.click();
                }
            });
        }
        if (coverMediaInput) {
            coverMediaInput.addEventListener('change', () => {
                const file = coverMediaInput.files && coverMediaInput.files[0];
                if (!file) {
                    return;
                }
                const mediaType = detectCoverMediaType(file.name, file.type);
                if (mediaType !== 'image' && mediaType !== 'gif' && mediaType !== 'video') {
                    setStatus('Homepage cover must be an image/GIF/video file.');
                    coverMediaInput.value = '';
                    return;
                }
                externalCoverMedia = {
                    source: 'new',
                    file,
                    path: '',
                    name: file.name,
                    mediaType,
                    previewUrl: '',
                    previewMissing: false,
                    previewPending: false,
                };
                coverSelection = { kind: 'external' };
                normalizeCoverSelection();
                renderImageManager();
                showToast(`🖼 Homepage cover set: ${file.name}`, 'success');
                coverMediaInput.value = '';
            });
        }
        if (imageCardGrid) {
            imageCardGrid.addEventListener('dragover', event => {
                if (!mediaDragId) {
                    return;
                }
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                }
                updateMediaDropPlaceholder(event.clientY);
            });
            imageCardGrid.addEventListener('drop', event => {
                if (!mediaDragId) {
                    return;
                }
                event.preventDefault();
                const dragId = mediaDragId;
                const targetIndex = Number.isFinite(mediaDropIndex) ? mediaDropIndex : workingMediaItems.length;
                mediaDragId = null;
                clearMediaDropPlaceholder();
                const changed = reorderMediaToIndex(dragId, targetIndex);
                if (changed) {
                    renderImageManager();
                    setStatus('Image order updated.');
                }
            });
        }

        if (storyListEl) {
            storyListEl.addEventListener('dragover', event => {
                if (!storyDragId) {
                    return;
                }
                event.preventDefault();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = 'move';
                }
                updateStoryDropPlaceholder(event.clientY);
            });
            storyListEl.addEventListener('drop', async event => {
                if (!storyDragId) {
                    return;
                }
                event.preventDefault();
                const dragId = storyDragId;
                const targetIndex = Number.isFinite(storyDropIndex) ? storyDropIndex : state.stories.length;
                storyDragId = null;
                clearStoryDropPlaceholder();
                await reorderStoryToIndex(dragId, targetIndex);
            });
        }
        if (clearCoverMediaBtn) {
            clearCoverMediaBtn.addEventListener('click', () => {
                externalCoverMedia = null;
                if (coverSelection && coverSelection.kind === 'external') {
                    coverSelection = null;
                }
                normalizeCoverSelection();
                renderImageManager();
            });
        }

        if (coverPickerBtn) {
            coverPickerBtn.addEventListener('click', () => {
                void openCoverPositionEditor();
            });
        }
        if (setCoverPositionBtn) {
            setCoverPositionBtn.addEventListener('click', () => {
                void openCoverPositionEditor();
            });
        }
        if (coverPresetModes) {
            coverPresetModes.addEventListener('click', event => {
                const button = event.target.closest('.cover-preset-mode[data-cover-mode]');
                if (!button) {
                    return;
                }
                const nextMode = sanitizeCoverPresetMode(button.dataset.coverMode || 'grid');
                if (nextMode === coverPresetMode) {
                    return;
                }
                coverPresetMode = nextMode;
                coverPosition = normalizeCoverPosition(loadCoverPositionForMode(coverPresetMode));
                coverViewportPosition = { x: 50, y: 50 };
                applyCoverPosition();
                updateCoverPresetModeButtons();
                renderCoverPresetGrid();
            });
        }
        if (coverPositionSaveLayout) {
            coverPositionSaveLayout.addEventListener('click', saveCurrentLayoutCoverPosition);
        }
        if (coverPosTop) {
            coverPosTop.addEventListener('click', () => {
                coverViewportPosition.y = 0;
                applyCoverPosition();
            });
        }
        if (coverPosBottom) {
            coverPosBottom.addEventListener('click', () => {
                coverViewportPosition.y = 100;
                applyCoverPosition();
            });
        }
        if (coverPosUp) {
            coverPosUp.addEventListener('click', () => nudgeCoverPosition(0, -6));
        }
        if (coverPosDown) {
            coverPosDown.addEventListener('click', () => nudgeCoverPosition(0, 6));
        }
        if (coverPosLeft) {
            coverPosLeft.addEventListener('click', () => nudgeCoverPosition(-6, 0));
        }
        if (coverPosRight) {
            coverPosRight.addEventListener('click', () => nudgeCoverPosition(6, 0));
        }
        if (coverPositionClose) {
            coverPositionClose.addEventListener('click', cancelCoverPositionEdit);
        }
        if (coverPositionCancel) {
            coverPositionCancel.addEventListener('click', cancelCoverPositionEdit);
        }
        if (coverPositionReset) {
            coverPositionReset.addEventListener('click', resetCoverPosition);
        }
        if (coverPositionSave) {
            coverPositionSave.addEventListener('click', saveCoverPositionEdit);
        }
        if (coverPositionFrame) {
            coverPositionFrame.addEventListener('mousedown', event => {
                startCoverDrag(event);
            });
        }
        document.addEventListener('mousemove', moveCoverDrag);
        document.addEventListener('mouseup', endCoverDrag);
        window.addEventListener('resize', () => {
            if (coverPositionOverlay && !coverPositionOverlay.hidden) {
                updateCoverLayoutViewport();
            }
        });
        if (mediaPreviewClose) {
            mediaPreviewClose.addEventListener('click', closeMediaPreview);
        }
        if (mediaPreviewOverlay) {
            mediaPreviewOverlay.addEventListener('click', event => {
                if (event.target === mediaPreviewOverlay) {
                    closeMediaPreview();
                }
            });
        }

        storyFileInput.addEventListener('change', async () => {
            const file = storyFileInput.files[0];
            if (file) {
                const text = await file.text();
                storyTextInput.value = text;
            }
        });

        if (!supportsFileSystemAccess()) {
            setStatus('File System Access API not supported. Use Chrome or Edge for offline management.');
            if (openRecentBtn) {
                openRecentBtn.disabled = true;
            }
            if (fixMissingBtn) {
                fixMissingBtn.disabled = true;
            }
        }

        imageCardHeight = loadImageCardHeightSetting();
        applyImageCardHeightSetting();
        coverPresetMode = sanitizeCoverPresetMode(localStorage.getItem('homepageLayout') || coverPresetMode);
        coverPositionsByLayout = normalizeCoverPositionMap(null, '50% 50%');
        coverPosition = normalizeCoverPosition(coverPositionsByLayout[coverPresetMode] || coverPositionsByLayout.grid);
        coverViewportPosition = { x: 50, y: 50 };
        coverPositionInput.value = coverPositionsByLayout.grid;
        updateCoverPresetModeButtons();
        renderCoverPresetGrid();
        applyCoverPosition();
        updateRecentInfo();
        renderImageManager();
        window.addEventListener('beforeunload', () => {
            releaseAllMediaUrls();
            clearLibraryPreviewCaches();
        });
        tryUseRecentHandle(true);
