// ===== KEYBOARD NAVIGATION SYSTEM =====
// Handles keyboard-driven card and control navigation on the homepage

window.KeyboardNavigation = {
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
    '.filter-btn[data-filter="gif"]',
    '.filter-btn[data-filter="video"]',
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

  getFocusedStoryId() {
    if (this.focusedCardIndex < 0 || this.focusedCardIndex >= this.cards.length) {
      return "";
    }
    const card = this.cards[this.focusedCardIndex];
    return card && card.dataset ? card.dataset.storyId || "" : "";
  },

  focusCardByStoryId(storyId) {
    if (!storyId) {
      return false;
    }
    this.updateElements();
    const index = this.cards.findIndex(
      (card) => card.dataset && card.dataset.storyId === storyId,
    );
    if (index >= 0) {
      this.focusCard(index);
      return true;
    }
    return false;
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

    if (isUnlockModalOpen()) {
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

    lastPointerStoryId = "";
    lastFocusSource = "keyboard";
    const key = KeybindManager.normalizeKeyPart(event.key);
    const keyCombo = KeybindManager.eventToKeybind(event);
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
    if (keyCombo && keyCombo === this.getKeyForAction('pin')) {
      event.preventDefault();
      this.togglePinCurrentCard();
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('favorite')) {
      event.preventDefault();
      this.toggleFavoriteCurrentCard();
      return;
    }
    
    // Layout shortcuts using custom keybinds
    if (keyCombo && keyCombo === this.getKeyForAction('layoutGrid')) {
      event.preventDefault();
      applyLayout('grid');
      saveFilterState();
      this.showModeIndicator('📐 Grid Layout');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('layoutList')) {
      event.preventDefault();
      applyLayout('list');
      saveFilterState();
      this.showModeIndicator('📐 List Layout');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('layoutCompact')) {
      event.preventDefault();
      applyLayout('compact');
      saveFilterState();
      this.showModeIndicator('📐 Compact Layout');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('layoutSpotlight')) {
      event.preventDefault();
      applyLayout('spotlight');
      saveFilterState();
      this.showModeIndicator('📐 Spotlight Layout');
      return;
    }
    
    // Filter shortcuts using custom keybinds
    if (keyCombo && keyCombo === this.getKeyForAction('filterAll')) {
      event.preventDefault();
      this.activateFilter('all');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('filterFavorites')) {
      event.preventDefault();
      this.activateFilter('favorites');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('filterBookmarks')) {
      event.preventDefault();
      this.activateFilter('bookmarks');
      return;
    }
    
    // Sort shortcuts using custom keybinds
    if (keyCombo && keyCombo === this.getKeyForAction('sortDefault')) {
      event.preventDefault();
      this.activateSort('default');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('sortTitle')) {
      event.preventDefault();
      this.activateSort('title');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('sortRecent')) {
      event.preventDefault();
      this.activateSort('recent');
      return;
    }
    if (keyCombo && keyCombo === this.getKeyForAction('sortPriority')) {
      event.preventDefault();
      this.activateSort('priority');
      return;
    }
    
    // Settings panel using custom keybind
    if (keyCombo && keyCombo === this.getKeyForAction('settingsTab')) {
      event.preventDefault();
      openSettings();
      this.showModeIndicator('⚙️ Settings Opened');
      return;
    }
    
    // Help modal using custom keybind
    if (keyCombo && keyCombo === this.getKeyForAction('helpTab')) {
      event.preventDefault();
      if (helpBtn) helpBtn.click();
      this.showModeIndicator('❓ Help Opened');
      return;
    }
    
    // Theme toggle using custom keybind
    if (keyCombo && keyCombo === this.getKeyForAction('toggleTheme')) {
      event.preventDefault();
      const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      this.showModeIndicator(`🌗 ${next.charAt(0).toUpperCase() + next.slice(1)} Mode`);
      return;
    }
    
    // Focus search using custom keybind
    if (keyCombo && keyCombo === this.getKeyForAction('focusSearch')) {
      event.preventDefault();
      this.focusSearch();
      return;
    }

    // Open card using custom keybind (can be non-Enter key)
    if (keyCombo && keyCombo === this.getKeyForAction('openCard')) {
      event.preventDefault();
      this.handleEnter();
      return;
    }
    
    // ===== END DIRECT SHORTCUTS =====

    const pressedKey = keyCombo || KeybindManager.normalizeKey(key);

    const getNavCandidates = (action) => {
      const candidates = [];
      const disabled =
        KeybindManager.normalizeKey(KeybindManager.customKeybinds?.[action]) ===
        KeybindManager.disabledToken;
      if (disabled) {
        return candidates;
      }
      const primary = this.getKeyForAction(action);
      if (primary) {
        candidates.push(primary);
      }
      const fallback = KeybindManager.normalizeKey(
        KeybindManager.defaultKeybinds[action]?.fallback || "",
      );
      if (fallback) {
        candidates.push(fallback);
      }
      return candidates;
    };

    const matchesNavKey = (action) => {
      if (!pressedKey) return false;
      const candidates = getNavCandidates(action);
      return candidates.some((candidate) => candidate === pressedKey);
    };

    const navMatches = {
      up: matchesNavKey('navUp'),
      down: matchesNavKey('navDown'),
      left: matchesNavKey('navLeft'),
      right: matchesNavKey('navRight'),
    };

    let navDirection = null;
    if (navMatches.up) navDirection = 'arrowup';
    else if (navMatches.down) navDirection = 'arrowdown';
    else if (navMatches.left) navDirection = 'arrowleft';
    else if (navMatches.right) navDirection = 'arrowright';

    if (!navDirection) return;

    // Shift + any nav key = Control navigation mode
    if (isShift) {
      event.preventDefault();
      this.setMode('controls');
      this.navigateControls(navDirection);
      return;
    }

    // Nav keys = Card navigation mode
    event.preventDefault();
    this.setMode('cards');
    this.navigateCards(navDirection);
    return;
  },

  activateFilter(filterName) {
    activeFilter = filterName;
    filterButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
    saveFilterState();
    render();
    const labels = { 'all': 'All Stories', 'favorites': 'Favorites', 'bookmarks': 'Bookmarks', 'gif': 'GIF Posts', 'video': 'Video Posts' };
    this.showModeIndicator(`🏷️ ${labels[filterName] || 'Filter'}`);
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
        card.click();
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

    updateStoryCardActionState(storyId, { pinned: pins.has(storyId) });
    this.updateElements();
    const nextIndex = Math.min(targetIndex, this.cards.length - 1);
    if (nextIndex >= 0) {
      this.focusCard(nextIndex);
    }
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

    updateStoryCardActionState(storyId, { favorite: favorites.has(storyId) });
    this.updateElements();
    const nextIndex = Math.min(targetIndex, this.cards.length - 1);
    if (nextIndex >= 0) {
      this.focusCard(nextIndex);
    }
  }
};

// ===== SETTINGS PANEL KEYBOARD NAVIGATION =====

window.SettingsPanelKeyboardNav = {
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
        '.quick-font-btn, .color-picker-btn, .gradient-text-input, .color-item, .settings-reset-btn, .keybind-tag'
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

// ===== HELP MODAL KEYBOARD NAVIGATION =====

window.HelpModalKeyboardNav = {
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

window.KeybindManager = {
  bindingTarget: null,
  keybindListener: null,
  disabledToken: "__disabled__",
  
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

  normalizeKeyPart(key) {
    if (key === null || key === undefined) {
      return "";
    }
    if (key === " ") {
      return "space";
    }
    const normalized = String(key).trim().toLowerCase();
    const aliases = {
      "": "",
      [this.disabledToken]: this.disabledToken,
      "+": "plus",
      spacebar: "space",
      esc: "escape",
      return: "enter",
      del: "delete",
      control: "ctrl",
      cmd: "meta",
      command: "meta",
      option: "alt",
    };
    return aliases[normalized] || normalized;
  },

  normalizeKeyCombo(value) {
    if (value === null || value === undefined) {
      return "";
    }
    const raw = String(value).trim().toLowerCase();
    if (!raw) {
      return "";
    }
    if (raw === this.disabledToken) {
      return this.disabledToken;
    }
    if (raw === "+") {
      return "plus";
    }
    const parts = raw
      .split("+")
      .map((part) => this.normalizeKeyPart(part))
      .filter(Boolean);
    if (parts.length === 0) {
      return "";
    }
    const modifiers = [];
    let base = "";
    parts.forEach((part) => {
      if (this.isModifierKey(part)) {
        modifiers.push(part);
      } else {
        base = part;
      }
    });
    const uniqueMods = [];
    modifiers.forEach((mod) => {
      if (!uniqueMods.includes(mod)) {
        uniqueMods.push(mod);
      }
    });
    const orderedMods = ["ctrl", "shift", "alt", "meta"].filter((mod) =>
      uniqueMods.includes(mod),
    );
    if (!base) {
      return orderedMods.join("+");
    }
    return [...orderedMods, base].join("+");
  },

  normalizeKey(key) {
    if (key === null || key === undefined) {
      return "";
    }
    const raw = String(key).trim();
    if (!raw) {
      return "";
    }
    if (raw.toLowerCase() === this.disabledToken) {
      return this.disabledToken;
    }
    if (raw === "+") {
      return "plus";
    }
    if (raw.includes("+")) {
      return this.normalizeKeyCombo(raw);
    }
    return this.normalizeKeyPart(raw);
  },

  isModifierKey(key) {
    const normalized = this.normalizeKeyPart(key);
    return (
      normalized === "ctrl" ||
      normalized === "shift" ||
      normalized === "alt" ||
      normalized === "meta"
    );
  },

  eventToKeybind(event) {
    if (!event) {
      return "";
    }
    const baseKey = this.normalizeKeyPart(event.key);
    if (!baseKey || this.isModifierKey(baseKey)) {
      return "";
    }
    const includeShift =
      event.shiftKey &&
      (event.ctrlKey || event.altKey || event.metaKey || baseKey.length > 1);
    const parts = [];
    if (event.ctrlKey) parts.push("ctrl");
    if (includeShift) parts.push("shift");
    if (event.altKey) parts.push("alt");
    if (event.metaKey) parts.push("meta");
    parts.push(baseKey);
    return this.normalizeKeyCombo(parts.join("+"));
  },

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
    
    const normalized = {};
    Object.entries(keybinds || {}).forEach(([action, key]) => {
      const normalizedKey = this.normalizeKey(key);
      if (normalizedKey || normalizedKey === this.disabledToken) {
        normalized[action] = normalizedKey;
      }
    });

    this.customKeybinds = normalized;
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
    const custom = this.normalizeKey(this.customKeybinds?.[action]);
    if (custom === this.disabledToken) {
      return "";
    }
    if (custom) {
      return custom;
    }
    return this.normalizeKey(this.defaultKeybinds[action]?.key || "");
  },

  setKeybind(action, key) {
    const normalized = this.normalizeKey(key);
    if (!normalized) {
      return;
    }
    if (!this.customKeybinds) this.customKeybinds = {};
    this.disableDuplicateKeybinds(action, normalized);
    this.customKeybinds[action] = normalized;
    this.saveKeybinds();
    this.renderKeybindList();
  },

  disableDuplicateKeybinds(action, normalizedKey) {
    if (!normalizedKey) {
      return;
    }
    Object.keys(this.defaultKeybinds).forEach((otherAction) => {
      if (otherAction === action) {
        return;
      }
      const currentKey = this.getKeyFor(otherAction);
      if (!currentKey) {
        return;
      }
      if (this.normalizeKey(currentKey) === normalizedKey) {
        if (!this.customKeybinds) {
          this.customKeybinds = {};
        }
        this.customKeybinds[otherAction] = this.disabledToken;
      }
    });
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
        const disabled =
          this.normalizeKey(this.customKeybinds?.[action]) === this.disabledToken;
        if (config) {
          let desc = config.label;
          if (action === 'navUp') desc = 'Move up';
          if (action === 'navDown') desc = 'Move down';
          if (action === 'navLeft') desc = 'Move left';
          if (action === 'navRight') desc = 'Move right';
          if (action === 'openCard') desc = 'Open card';
          
          // Show fallback key in parentheses
          const fallbackKey =
            config.fallback && !disabled
              ? ` / ${this.formatKeyDisplay(config.fallback)}`
              : '';
          
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
      const navUpDisabled =
        this.normalizeKey(this.customKeybinds?.navUp) === this.disabledToken;
      const navDownDisabled =
        this.normalizeKey(this.customKeybinds?.navDown) === this.disabledToken;
      const navKey = navUpDisabled ? '' : this.getKeyFor('navUp');
      const navDownKey = navDownDisabled ? '' : this.getKeyFor('navDown');
      
      html += `
        <div class="shortcut-pill">
          <span class="shortcut-pill-key">Shift+${this.formatKeyDisplay(navKey)} / ${this.formatKeyDisplay(navDownKey)}</span>
          <span class="shortcut-pill-desc">Navigate control groups</span>
        </div>
        <div class="shortcut-pill">
          <span class="shortcut-pill-key">Shift+A/D</span>
          <span class="shortcut-pill-desc">Navigate within group</span>
        </div>
        <div class="shortcut-pill">
          <span class="shortcut-pill-key">${this.formatKeyDisplay(this.getKeyFor('openCard'))}</span>
          <span class="shortcut-pill-desc">Activate control</span>
        </div>
      `;
      html += `</div>`;
      controlNavContainer.innerHTML = html;
    }
  },

  formatKeyDisplay(key) {
    const normalized = this.normalizeKey(key);
    if (!normalized) return '-';
    const keyMap = {
      space: 'Spacebar',
      arrowup: '↑',
      arrowdown: '↓',
      arrowleft: '←',
      arrowright: '→',
      enter: 'Enter',
      escape: 'Esc',
      backspace: 'Backspace',
      delete: 'Del',
      ctrl: 'Ctrl',
      shift: 'Shift',
      alt: 'Alt',
      meta: 'Meta',
      plus: '+',
      '/': '/',
    };
    return normalized
      .split('+')
      .map((part) => keyMap[part] || part.toUpperCase())
      .join('+');
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

      const baseKey = this.normalizeKeyPart(e.key);
      if (baseKey === 'escape') {
        // Cancel binding
        this.cancelBinding();
        return;
      }

      if (baseKey === 'backspace' || baseKey === 'delete') {
        // Clear binding
        this.clearKeybind(action);
        this.cancelBinding();
        KeyboardNavigation.showModeIndicator('❌ Binding cleared');
        return;
      }

      // Set new binding (support combos like Ctrl+A)
      const keyCombo = this.eventToKeybind(e);
      if (!keyCombo) {
        return;
      }
      this.setKeybind(action, keyCombo);
      this.cancelBinding();
      updateBlackoutResumeText(); // Update blackout resume text with new keybind

      KeyboardNavigation.showModeIndicator(
        `✅ Bound "${this.formatKeyDisplay(keyCombo)}" to "${this.defaultKeybinds[action]?.label}"`,
      );
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
