        const MODE = window.parent === window ? 'homepage' : 'datamanager';
        const STORAGE_KEY = 'homepageSettings';

        class SettingsManager {
            constructor(defaults, storageKey) {
                this.DEFAULTS = defaults;
                this.STORAGE_KEY = storageKey;
                this.currentSettings = { ...this.DEFAULTS };
            }

            getSettings() {
                if (MODE === 'datamanager') {
                    const stored = localStorage.getItem('hpFromParent');
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
                    window.parent.postMessage({ type: 'saveHomepageSettings', settings: settings }, '*');
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
        
        // Helper function to save settings to localStorage in the format homepage.js expects
        function saveToLocalStorage(settings) {
            // Save theme
            if (settings.theme) {
                localStorage.setItem('homepageTheme', settings.theme);
            }
            
            // Save font settings (as homepage.js expects)
            if (settings.fontFamily || settings.customFont) {
                const fontFamily = settings.customFont || settings.fontFamily || "'Share Tech Mono', monospace";
                localStorage.setItem('homepageFont', JSON.stringify({
                    family: fontFamily,
                    fallback: 'monospace'
                }));
            }
            
            // Save font sizes
            if (settings.fontSize || settings.headerSize || settings.buttonFontSize || settings.cardFontSize) {
                localStorage.setItem('homepageFontSizes', JSON.stringify({
                    base: settings.fontSize || 14,
                    header: settings.headerSize || 26,
                    button: settings.buttonFontSize || 12,
                    card: settings.cardFontSize || 13
                }));
            }
            
            // Save skip preferences
            const skipPrefs = {
                skipAgeVerify: settings.skipAgeVerify || false,
                skipWelcome: settings.skipWelcome || false
            };
            localStorage.setItem('skipPreferences', JSON.stringify(skipPrefs));
            
            // Also save the full settings for reference
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        }
        
        // Also create global save/close functions for Data Manager to call
        window.saveAndClose = function() {
            const settings = window.getCurrentSettings ? window.getCurrentSettings() : {};
            
            // Save to localStorage in the format homepage.js expects
            saveToLocalStorage(settings);
            
            if (MODE === 'datamanager') {
                // Send to parent (Data_Manager) to save to file system
                window.parent.postMessage({ type: 'saveHomepageSettings', settings: settings }, '*');
            }
            window.parent.postMessage({ type: 'closeHomepageSettings' }, '*');
        };
        
        window.closeSettings = function() {
            if (MODE === 'datamanager') {
                window.parent.postMessage({ type: 'closeHomepageSettings' }, '*');
            }
        };
        

        class FontManager {
            constructor(settingsManager) {
                this.settingsManager = settingsManager;
                this.fontSelect = document.getElementById('hp-font-select');
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
                    window.parent.postMessage({ type: 'getHpFonts' }, '*');
                    window.addEventListener('message', (event) => {
                        if (event.data && event.data.type === 'hpFonts' && event.data.fonts) {
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

        // Tab switching functionality
        function initTabSwitching() {
            const tabButtons = document.querySelectorAll('.settings-tabs .tab-btn');
            const tabPanels = document.querySelectorAll('.tab-panel');
            
            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabId = btn.dataset.tab;
                    
                    // Update tab buttons
                    tabButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    // Update tab panels
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

        // Get current color settings
        function getColorSettings() {
            const colors = {
                dark: {},
                light: {}
            };
            
            // Get dark theme colors
            document.querySelectorAll('#dark-colors .color-picker').forEach(picker => {
                const colorKey = picker.dataset.color;
                const key = colorKey.replace('dark.', '');
                colors.dark[key] = picker.value;
            });
            
            // Get light theme colors
            document.querySelectorAll('#light-colors .color-picker').forEach(picker => {
                const colorKey = picker.dataset.color;
                const key = colorKey.replace('light.', '');
                colors.light[key] = picker.value;
            });
            
            return colors;
        }

        function normalizeKeyInput(value) {
            if (value === null || value === undefined) return '';
            if (value === ' ') return 'space';
            const normalized = String(value).trim().toLowerCase();
            const aliases = {
                spacebar: 'space',
                esc: 'escape',
                return: 'enter',
                del: 'delete'
            };
            return aliases[normalized] || normalized;
        }

        function formatKeyInput(value) {
            const normalized = normalizeKeyInput(value);
            const map = {
                space: 'Spacebar',
                enter: 'Enter',
                escape: 'Esc',
                backspace: 'Backspace',
                delete: 'Delete',
                arrowup: '↑',
                arrowdown: '↓',
                arrowleft: '←',
                arrowright: '→'
            };
            return map[normalized] || normalized.toUpperCase();
        }

        function initKeybindInputs() {
            document.querySelectorAll('.keybind-key').forEach(input => {
                input.addEventListener('keydown', event => {
                    event.preventDefault();
                    if (event.key === 'Escape') {
                        input.blur();
                        return;
                    }
                    if (event.key === 'Backspace' || event.key === 'Delete') {
                        input.value = '';
                        return;
                    }
                    input.value = formatKeyInput(event.key);
                });
                input.addEventListener('blur', () => {
                    input.value = formatKeyInput(input.value || '');
                });
            });
        }

        // Get current keybind settings
        function getKeybindSettings() {
            const keybinds = {};
            document.querySelectorAll('.keybind-key').forEach(input => {
                const key = input.dataset.keybind;
                const normalized = normalizeKeyInput(input.value);
                if (key && normalized) {
                    keybinds[key] = normalized;
                }
            });
            return keybinds;
        }

        function applySettingsToForm(settings) {
            if (!settings || typeof settings !== 'object') return;

            const fontSelect = document.getElementById('hp-font-select');
            const customFont = document.getElementById('hp-custom-font');
            const baseFontSize = document.getElementById('hp-base-font-size');
            const headerFontSize = document.getElementById('hp-header-font-size');
            const buttonFontSize = document.getElementById('hp-button-font-size');
            const cardFontSize = document.getElementById('hp-card-font-size');
            const skipAgeVerify = document.getElementById('hp-skip-age-verify');
            const skipWelcome = document.getElementById('hp-skip-welcome');

            if (fontSelect && settings.fontFamily) {
                const option = Array.from(fontSelect.options).find(item =>
                    item.value === settings.fontFamily ||
                    item.dataset.family === settings.fontFamily ||
                    item.textContent === settings.fontFamily
                );
                fontSelect.value = option ? option.value : settings.fontFamily;
            }
            if (customFont) customFont.value = settings.customFont || '';
            if (baseFontSize && Number.isFinite(Number(settings.fontSize))) {
                baseFontSize.value = Number(settings.fontSize);
                const span = baseFontSize.nextElementSibling;
                if (span && span.classList.contains('range-value')) span.textContent = `${baseFontSize.value}px`;
            }
            if (headerFontSize && Number.isFinite(Number(settings.headerSize))) {
                headerFontSize.value = Number(settings.headerSize);
                const span = headerFontSize.nextElementSibling;
                if (span && span.classList.contains('range-value')) span.textContent = `${headerFontSize.value}px`;
            }
            if (buttonFontSize && Number.isFinite(Number(settings.buttonFontSize))) {
                buttonFontSize.value = Number(settings.buttonFontSize);
                const span = buttonFontSize.nextElementSibling;
                if (span && span.classList.contains('range-value')) span.textContent = `${buttonFontSize.value}px`;
            }
            if (cardFontSize && Number.isFinite(Number(settings.cardFontSize))) {
                cardFontSize.value = Number(settings.cardFontSize);
                const span = cardFontSize.nextElementSibling;
                if (span && span.classList.contains('range-value')) span.textContent = `${cardFontSize.value}px`;
            }

            const targetTheme = settings.theme === 'light' ? 'light' : 'dark';
            document.querySelectorAll('.theme-tab').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === targetTheme);
            });

            if (skipAgeVerify) skipAgeVerify.checked = settings.skipAgeVerify === true;
            if (skipWelcome) skipWelcome.checked = settings.skipWelcome === true;

            if (settings.customColors && typeof settings.customColors === 'object') {
                document.querySelectorAll('.color-picker').forEach(picker => {
                    const [theme, colorName] = (picker.dataset.color || '').split('.');
                    const colorValue = settings.customColors?.[theme]?.[colorName];
                    if (typeof colorValue === 'string' && colorValue.trim()) {
                        picker.value = colorValue;
                    }
                });
            }

            const keybinds = settings.keybinds && typeof settings.keybinds === 'object' ? settings.keybinds : {};
            document.querySelectorAll('.keybind-key').forEach(input => {
                const action = input.dataset.keybind;
                const value = keybinds[action] || input.value;
                input.value = formatKeyInput(value);
            });
        }

        // Update getCurrentSettings to include colors and keybinds
        window.getCurrentSettings = function() {
            // Gather all current settings from the form
            const settings = {};
            
            // Font settings
            const fontSelect = document.getElementById('hp-font-select');
            const customFont = document.getElementById('hp-custom-font');
            const baseFontSize = document.getElementById('hp-base-font-size');
            const headerFontSize = document.getElementById('hp-header-font-size');
            const buttonFontSize = document.getElementById('hp-button-font-size');
            const cardFontSize = document.getElementById('hp-card-font-size');
            
            if (fontSelect) settings.fontFamily = fontSelect.value;
            if (customFont) settings.customFont = customFont.value;
            if (baseFontSize) settings.fontSize = parseInt(baseFontSize.value, 10);
            if (headerFontSize) settings.headerSize = parseInt(headerFontSize.value, 10);
            if (buttonFontSize) settings.buttonFontSize = parseInt(buttonFontSize.value, 10);
            if (cardFontSize) settings.cardFontSize = parseInt(cardFontSize.value, 10);
            
            // Theme
            const activeTheme = document.querySelector('.theme-tab.active');
            if (activeTheme) settings.theme = activeTheme.dataset.theme;
            
            // Color settings
            settings.customColors = getColorSettings();
            
            // Keybind settings
            settings.keybinds = getKeybindSettings();
            
            // Data settings
            const skipAgeVerify = document.getElementById('hp-skip-age-verify');
            const skipWelcome = document.getElementById('hp-skip-welcome');
            if (skipAgeVerify) settings.skipAgeVerify = skipAgeVerify.checked;
            if (skipWelcome) settings.skipWelcome = skipWelcome.checked;
            
            return settings;
        };

        // Initialize range sliders to show current values
        function initRangeSliders() {
            const ranges = ['hp-base-font-size', 'hp-header-font-size', 'hp-button-font-size', 'hp-card-font-size'];
            ranges.forEach(id => {
                const input = document.getElementById(id);
                if (input) {
                    const valueSpan = input.nextElementSibling;
                    if (valueSpan && valueSpan.classList.contains('range-value')) {
                        input.addEventListener('input', () => {
                            valueSpan.textContent = input.value + 'px';
                        });
                    }
                }
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            const settingsManager = new SettingsManager({}, 'homepageSettings');
            const fontManager = new FontManager(settingsManager);
            const currentSettings = settingsManager.getSettings();

            // Initialize tab switching
            initTabSwitching();
            
            // Initialize range sliders
            initRangeSliders();
            initKeybindInputs();

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
            
            // Theme tab switching (inside iframe)
            document.querySelectorAll('.theme-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.theme-tab').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
            
            // Reset colors button
            const resetColorsBtn = document.getElementById('hp-reset-colors');
            if (resetColorsBtn) {
                resetColorsBtn.addEventListener('click', () => {
                    // Reset dark colors
                    const darkDefaults = {
                        'dark.ink': '#e8f1ff',
                        'dark.muted': '#e8f1ff',
                        'dark.bg': '#03050b',
                        'dark.bg-2': '#0a1220',
                        'dark.panel': '#0c1422',
                        'dark.accent': '#62f7ff',
                        'dark.accent-2': '#8dff7b',
                        'dark.card': '#0c1422',
                        'dark.shadow': '#02060c',
                        'dark.grid': '#62f7ff'
                    };
                    // Reset light colors
                    const lightDefaults = {
                        'light.ink': '#0b1220',
                        'light.muted': '#0b1220',
                        'light.bg': '#eef3f9',
                        'light.bg-2': '#f8fbff',
                        'light.panel': '#ffffff',
                        'light.accent': '#0aa6c7',
                        'light.accent-2': '#3b5bff',
                        'light.card': '#ffffff',
                        'light.shadow': '#0c1626',
                        'light.grid': '#0aa6c7'
                    };
                    // Apply defaults
                    document.querySelectorAll('.color-picker').forEach(picker => {
                        const colorKey = picker.dataset.color;
                        if (darkDefaults[colorKey]) picker.value = darkDefaults[colorKey];
                        if (lightDefaults[colorKey]) picker.value = lightDefaults[colorKey];
                    });
                });
            }
            
            // Reset keybinds button
            const resetKeybindsBtn = document.getElementById('hp-reset-keybinds');
            if (resetKeybindsBtn) {
                resetKeybindsBtn.addEventListener('click', () => {
                    const defaults = {
                        'navUp': 'W',
                        'navDown': 'S',
                        'navLeft': 'A',
                        'navRight': 'D',
                        'openCard': 'Enter',
                        'pin': 'Q',
                        'favorite': 'E',
                        'layoutGrid': '1',
                        'layoutList': '2',
                        'layoutCompact': '3',
                        'layoutSpotlight': '4',
                        'settingsTab': 'U',
                        'helpTab': 'H',
                        'toggleTheme': 'L',
                        'blackout': 'space',
                        'focusSearch': '/'
                    };
                    document.querySelectorAll('.keybind-key').forEach(input => {
                        const key = input.dataset.keybind;
                        if (defaults[key]) input.value = formatKeyInput(defaults[key]);
                    });
                });
            }
        });
