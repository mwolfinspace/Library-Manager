// ===== LOCALSTORAGE-BASED SETTINGS SYSTEM =====
// ALL settings saved to localStorage - no file access needed!
// Works across all browsers without CORS issues

window.DATABASE_SETTINGS = {
  version: "1.0.0",
  STORAGE_KEY: 'xedryk_database',
  
  // Default settings structure
  defaults: {
    settings: {
      theme: "dark",
      fontFamily: "'Share Tech Mono', monospace",
      fontSizes: {
        base: 14,
        header: 26,
        button: 12,
        card: 13
      },
      panelPosition: {
        left: "auto",
        top: "auto",
        width: "400px",
        height: "auto"
      },
      filterState: {
        filter: "all",
        search: "",
        layout: "grid",
        sort: "default",
        sortDirection: "asc"
      },
      skipPreferences: {
        skipAgeVerify: false,
        skipWelcome: false
      },
      keybinds: {}
    },
    colors: {
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
        "card-overlay": "linear-gradient(180deg, rgba(3, 5, 10, 0.08) 0%, rgba(3, 5, 10, 0.9) 100%)",
        "card-overlay-list": "linear-gradient(90deg, rgba(5, 7, 13, 0.88) 0%, rgba(5, 7, 13, 0.5) 55%, rgba(5, 7, 13, 0.12) 100%)",
        "cursor-glow": "rgba(98, 247, 255, 0.2)",
        "tag-bg": "rgba(98, 247, 255, 0.15)",
        "tag-bg-hover": "rgba(98, 247, 255, 0.3)"
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
        "card-overlay": "linear-gradient(180deg, rgba(239, 243, 249, 0.1) 0%, rgba(239, 243, 249, 0.4) 100%)",
        "card-overlay-list": "linear-gradient(90deg, rgba(238, 243, 249, 0.5) 0%, rgba(238, 243, 249, 0.25) 55%, rgba(238, 243, 249, 0.05) 100%)",
        "cursor-glow": "rgba(59, 91, 255, 0.18)",
        "tag-bg": "rgba(10, 166, 199, 0.15)",
        "tag-bg-hover": "rgba(10, 166, 199, 0.25)"
      }
    },
    viewerSettings: {
      theme: "dark",
      fontSize: 16,
      lineSpacing: 1.6,
      scrollStep: 40,
      zoomStep: 0.1,
      keyboardMode: "left",
      panKeys: true,
      rememberZoom: true,
      fontFamily: "'Quantico', sans-serif",
      customFont: "",
      rememberViewAll: false,
      customBindings: {},
      homepageSort: {
        type: "default",
        direction: "asc"
      }
    },
    data: {
      favorites: [],
      pinned: [],
      bookmarks: {}
    }
  },
  
  // Current database state (in memory only)
  db: null,
  
  // Initialize database - load from localStorage
  async init() {
    try {
      // Try to load from localStorage first
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (this.validateStructure(parsed)) {
            this.db = parsed;
            console.log('Database loaded from localStorage');
            return;
          }
        } catch (e) {
          console.log('Corrupted localStorage data, using defaults');
        }
      }
      
      // Use defaults
      this.db = this.createDefaultDatabase();
      this.saveToStorage();
      console.log('Database initialized with defaults');
    } catch (error) {
      console.error('Error initializing database:', error);
      this.db = this.createDefaultDatabase();
    }
  },
  
  // Create a fresh database with defaults
  createDefaultDatabase() {
    const now = new Date().toISOString();
    return {
      version: this.version,
      lastUpdated: now,
      settings: JSON.parse(JSON.stringify(this.defaults.settings)),
      colors: JSON.parse(JSON.stringify(this.defaults.colors)),
      viewerSettings: JSON.parse(JSON.stringify(this.defaults.viewerSettings)),
      data: JSON.parse(JSON.stringify(this.defaults.data))
    };
  },
  
  // Validate database structure
  validateStructure(db) {
    if (!db || typeof db !== 'object') return false;
    if (!db.settings || !db.colors || !db.viewerSettings || !db.data) return false;
    return true;
  },
  
  // Save database to localStorage
  saveToStorage() {
    if (!this.db) return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  },
  
  // Export database as JSON file
  downloadExport() {
    const exportData = {
      ...this.db,
      exportDate: new Date().toISOString(),
      exportVersion: this.version
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
  },
  
  // Import from JSON string
  import(jsonString, merge = true) {
    try {
      const imported = JSON.parse(jsonString);
      
      if (!this.validateStructure(imported)) {
        throw new Error('Invalid database structure');
      }
      
      if (merge) {
        this.db = this.deepMerge(this.db || this.createDefaultDatabase(), imported);
      } else {
        this.db = imported;
      }
      
      this.saveToStorage();
      return { success: true };
    } catch (error) {
      console.error('Import error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Deep merge two objects
  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  },
  
  // Reset to defaults
  reset() {
    this.db = this.createDefaultDatabase();
    this.saveToStorage();
  },
  
  // ===== SETTINGS ACCESSORS =====
  
  getSettings() {
    return this.db?.settings || this.defaults.settings;
  },
  
  setSettings(settings) {
    if (!this.db) return;
    this.db.settings = { ...this.db.settings, ...settings };
    this.db.lastUpdated = new Date().toISOString();
    this.saveToStorage();
  },
  
  getColors(theme) {
    return this.db?.colors?.[theme] || this.defaults.colors[theme];
  },
  
  setColors(theme, colors) {
    if (!this.db) return;
    if (!this.db.colors) this.db.colors = {};
    this.db.colors[theme] = { ...this.db.colors[theme], ...colors };
    this.db.lastUpdated = new Date().toISOString();
    this.saveToStorage();
  },
  
  getData() {
    return this.db?.data || this.defaults.data;
  },
  
  setData(data) {
    if (!this.db) return;
    this.db.data = { ...this.db.data, ...data };
    this.db.lastUpdated = new Date().toISOString();
    this.saveToStorage();
  },
  
  getViewerSettings() {
    return this.db?.viewerSettings || this.defaults.viewerSettings;
  },
  
  setViewerSettings(settings) {
    if (!this.db) return;
    this.db.viewerSettings = { ...this.db.viewerSettings, ...settings };
    this.db.lastUpdated = new Date().toISOString();
    this.saveToStorage();
  },
  
  // Convenience methods for common data
  getFavorites() {
    return this.db?.data?.favorites || [];
  },
  
  addFavorite(id) {
    if (!this.db) return;
    if (!this.db.data.favorites) this.db.data.favorites = [];
    if (!this.db.data.favorites.includes(id)) {
      this.db.data.favorites.push(id);
      this.db.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }
  },
  
  removeFavorite(id) {
    if (!this.db) return;
    if (this.db.data.favorites) {
      this.db.data.favorites = this.db.data.favorites.filter(f => f !== id);
      this.db.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }
  },
  
  hasFavorite(id) {
    const favs = this.getFavorites();
    return favs.includes(id);
  },
  
  getPins() {
    return this.db?.data?.pinned || [];
  },
  
  addPin(id) {
    if (!this.db) return;
    if (!this.db.data.pinned) this.db.data.pinned = [];
    if (!this.db.data.pinned.includes(id)) {
      this.db.data.pinned.push(id);
      this.db.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }
  },
  
  removePin(id) {
    if (!this.db) return;
    if (this.db.data.pinned) {
      this.db.data.pinned = this.db.data.pinned.filter(p => p !== id);
      this.db.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }
  },
  
  hasPin(id) {
    const pins = this.getPins();
    return pins.includes(id);
  },
  
  getBookmark(id) {
    return this.db?.data?.bookmarks?.[id] || null;
  },
  
  saveBookmark(id, payload) {
    if (!this.db) return;
    if (!this.db.data.bookmarks) this.db.data.bookmarks = {};
    this.db.data.bookmarks[id] = payload;
    this.db.lastUpdated = new Date().toISOString();
    this.saveToStorage();
  },
  
  removeBookmark(id) {
    if (!this.db) return;
    if (this.db.data.bookmarks) {
      delete this.db.data.bookmarks[id];
      this.db.lastUpdated = new Date().toISOString();
      this.saveToStorage();
    }
  },
  
  // Update the global VIEWER_SETTINGS for viewer.js compatibility
  syncViewerSettings() {
    window.VIEWER_SETTINGS = { ...window.VIEWER_SETTINGS, ...this.getViewerSettings() };
  }
};

// Also keep VIEWER_SETTINGS for compatibility with viewer.js (fallback)
window.VIEWER_SETTINGS = {
  theme: "dark",
  fontSize: 16,
  lineSpacing: 1.6,
  scrollStep: 40,
  zoomStep: 0.1,
  keyboardMode: "left",
  panKeys: true,
  rememberZoom: true,
  fontFamily: "'Quantico', sans-serif",
  customFont: "",
  rememberViewAll: false,
  customBindings: {},
  homepageSort: {
    type: "default",
    direction: "asc"
  }
};
