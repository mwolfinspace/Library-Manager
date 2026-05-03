        const MODE = window.parent === window ? 'viewer' : 'datamanager';
        const STORAGE_KEY = 'viewerSettings';

        class SettingsManager {
            constructor(defaults, storageKey) {
                this.DEFAULTS = defaults;
                this.STORAGE_KEY = storageKey;
                this.currentSettings = { ...this.DEFAULTS };
            }

            getSettings() {
                if (MODE === 'datamanager') {
                    const stored = localStorage.getItem('vFromParent');
                    if (stored) {
                        try {
                            return { ...this.DEFAULTS, ...JSON.parse(stored) };
                        } catch (e) {
                            return this.DEFAULTS;
                        }
                    }
                    return this.DEFAULTS;
                } else {
                    const stored = localStorage.getItem(this.STORAGE_KEY);
                    if (stored) {
                        try {
                            return { ...this.DEFAULTS, ...JSON.parse(stored) };
                        } catch (e) {
                            return this.DEFAULTS;
                        }
                    }
                    return this.DEFAULTS;
                }
            }

            saveSettings(settings) {
                // Always save to localStorage first (works in both modes)
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
                
                if (MODE === 'datamanager') {
                    // Also tell parent to save to hardcode file
                    window.parent.postMessage({ type: 'saveViewerSettings', settings: settings }, '*');
                }
            }

            showStatus(message, isError = false) {
                const statusEl = document.getElementById('status-msg');
                statusEl.textContent = message;
                statusEl.className = 'status-msg ' + (isError ? 'error' : 'success');
                setTimeout(() => {
                    statusEl.className = 'status-msg';
                }, 3000);
            }
        }
        
        // Also create global save/close functions for Data Manager to call
        window.saveAndClose = function() {
            const settings = window.getCurrentSettings ? window.getCurrentSettings() : {};
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            if (MODE === 'datamanager') {
                window.parent.postMessage({ type: 'saveViewerSettings', settings: settings }, '*');
            }
            window.parent.postMessage({ type: 'closeViewerSettings' }, '*');
        };
        
        window.closeSettings = function() {
            if (MODE === 'datamanager') {
                window.parent.postMessage({ type: 'closeViewerSettings' }, '*');
            }
        };
        
        window.getCurrentSettings = function() {
            // Gather all current settings from the form
            const settings = {};
            
            // Appearance settings
            const themeSelect = document.getElementById('v-theme-select');
            const fontSelect = document.getElementById('v-font-family');
            const customFont = document.getElementById('v-custom-font');
            
            if (themeSelect) settings.theme = themeSelect.value;
            if (fontSelect) settings.fontFamily = fontSelect.value;
            if (customFont) settings.customFont = customFont.value;
            
            // Reading settings
            const fontSize = document.getElementById('v-font-size');
            const lineSpacing = document.getElementById('v-line-spacing');
            const scrollStep = document.getElementById('v-scroll-step');
            const zoomStep = document.getElementById('v-zoom-step');
            
            if (fontSize) settings.fontSize = parseInt(fontSize.value, 10);
            if (lineSpacing) settings.lineSpacing = parseFloat(lineSpacing.value);
            if (scrollStep) settings.scrollStep = parseInt(scrollStep.value, 10);
            if (zoomStep) settings.zoomStep = parseFloat(zoomStep.value);
            
            // Input settings
            const keyboardMode = document.getElementById('v-keyboard-mode');
            const panKeys = document.getElementById('v-pan-keys');
            const rememberZoom = document.getElementById('v-remember-zoom');
            const rememberViewAll = document.getElementById('v-remember-view-all');
            
            if (keyboardMode) settings.keyboardMode = keyboardMode.value;
            if (panKeys) settings.panKeys = panKeys.checked;
            if (rememberZoom) settings.rememberZoom = rememberZoom.checked;
            if (rememberViewAll) settings.rememberViewAll = rememberViewAll.checked;
            
            return settings;
        };

        function initTabSwitching() {
            const tabButtons = document.querySelectorAll('.settings-tabs .tab-btn');
            const tabPanels = document.querySelectorAll('.tab-panel');

            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.dataset.tab;

                    tabButtons.forEach(item => item.classList.remove('active'));
                    btn.classList.add('active');

                    tabPanels.forEach(panel => {
                        if (panel.dataset.tabPanel === tabId) {
                            panel.removeAttribute('hidden');
                            panel.classList.add('active');
                        } else {
                            panel.setAttribute('hidden', '');
                            panel.classList.remove('active');
                        }
                    });
                });
            });
        }

        function applySettingsToForm(settings) {
            if (!settings || typeof settings !== 'object') return;

            const themeSelect = document.getElementById('v-theme-select');
            const fontSelect = document.getElementById('v-font-family');
            const customFont = document.getElementById('v-custom-font');
            const fontSize = document.getElementById('v-font-size');
            const lineSpacing = document.getElementById('v-line-spacing');
            const scrollStep = document.getElementById('v-scroll-step');
            const zoomStep = document.getElementById('v-zoom-step');
            const keyboardMode = document.getElementById('v-keyboard-mode');
            const panKeys = document.getElementById('v-pan-keys');
            const rememberZoom = document.getElementById('v-remember-zoom');
            const rememberViewAll = document.getElementById('v-remember-view-all');

            if (themeSelect && settings.theme) themeSelect.value = settings.theme;
            if (fontSelect && settings.fontFamily) {
                const option = Array.from(fontSelect.options).find(item =>
                    item.value === settings.fontFamily ||
                    item.dataset.family === settings.fontFamily ||
                    item.textContent === settings.fontFamily
                );
                fontSelect.value = option ? option.value : settings.fontFamily;
            }
            if (customFont) customFont.value = settings.customFont || '';

            if (fontSize && Number.isFinite(Number(settings.fontSize))) {
                fontSize.value = Number(settings.fontSize);
                const label = document.getElementById('v-font-size-value');
                if (label) label.textContent = `${fontSize.value}px`;
            }
            if (lineSpacing && Number.isFinite(Number(settings.lineSpacing))) {
                lineSpacing.value = Number(settings.lineSpacing);
                const label = document.getElementById('v-line-spacing-value');
                if (label) label.textContent = `${lineSpacing.value}`;
            }
            if (scrollStep && Number.isFinite(Number(settings.scrollStep))) {
                scrollStep.value = Number(settings.scrollStep);
            }
            if (zoomStep && Number.isFinite(Number(settings.zoomStep))) {
                zoomStep.value = Number(settings.zoomStep);
            }
            if (keyboardMode && settings.keyboardMode) keyboardMode.value = settings.keyboardMode;
            if (panKeys) panKeys.checked = settings.panKeys === true;
            if (rememberZoom) rememberZoom.checked = settings.rememberZoom !== false;
            if (rememberViewAll) rememberViewAll.checked = settings.rememberViewAll === true;
        }

        class FontManager {
            constructor(settingsManager) {
                this.settingsManager = settingsManager;
                this.fontSelect = document.getElementById('v-font-family');
            }

            async loadFonts() {
                const defaultFonts = `
                    <option value="Share Tech Mono" data-fallback="monospace">🖥️ Share Tech Mono</option>
                    <option value="Orbitron" data-fallback="sans-serif">🚀 Orbitron</option>
                    <option value="VT323" data-fallback="monospace">⌨️ VT323</option>
                    <option value="Space Mono" data-fallback="monospace">🌌 Space Mono</option>
                    <option value="Roboto Mono" data-fallback="monospace">🔤 Roboto Mono</option>
                    <option value="IBM Plex Mono" data-fallback="monospace">💻 IBM Plex Mono</option>
                    <option value="tech" data-fallback="monospace">⚙️ Tech (Default)</option>
                `;

                if (MODE === 'datamanager') {
                    window.parent.postMessage({ type: 'getVFonts' }, '*');
                    window.addEventListener('message', (event) => {
                        if (event.data && event.data.type === 'vFonts' && event.data.fonts) {
                            this.fontSelect.innerHTML = event.data.fonts.map(f =>
                                `<option value="${f.name}" data-family="${f.family || ''}" data-fallback="${f.fallback || 'sans-serif'}">${f.name}</option>`
                            ).join('');
                        }
                    }, { once: true });
                    setTimeout(() => {
                        if (!this.fontSelect.options.length) {
                            this.fontSelect.innerHTML = defaultFonts;
                        }
                    }, 1000);
                } else {
                    if (typeof window.FONTS !== 'undefined') {
                        this.fontSelect.innerHTML = window.FONTS.map(f =>
                            `<option value="${f.name}" data-family="${f.family || ''}" data-fallback="${f.fallback || 'sans-serif'}">${f.name}</option>`
                        ).join('');
                    } else {
                        this.fontSelect.innerHTML = defaultFonts;
                    }
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const settingsManager = new SettingsManager({}, 'viewerSettings');
            const fontManager = new FontManager(settingsManager);
            const currentSettings = settingsManager.getSettings();

            initTabSwitching();

            const fontSize = document.getElementById('v-font-size');
            const lineSpacing = document.getElementById('v-line-spacing');
            if (fontSize) {
                fontSize.addEventListener('input', () => {
                    const label = document.getElementById('v-font-size-value');
                    if (label) label.textContent = `${fontSize.value}px`;
                });
            }
            if (lineSpacing) {
                lineSpacing.addEventListener('input', () => {
                    const label = document.getElementById('v-line-spacing-value');
                    if (label) label.textContent = `${lineSpacing.value}`;
                });
            }

            fontManager.loadFonts().then(() => {
                applySettingsToForm(currentSettings);
            });
            applySettingsToForm(currentSettings);

            // Attach button handlers
            const saveBtn = document.getElementById('save-btn');
            const closeBtn = document.getElementById('close-btn');
            
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    if (window.saveAndClose) {
                        window.saveAndClose();
                    }
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    if (window.closeSettings) {
                        window.closeSettings();
                    }
                });
            }
        });
