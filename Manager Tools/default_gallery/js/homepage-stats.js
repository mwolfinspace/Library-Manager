// ===== SECRET STATISTICS SYSTEM =====
// Tracks user engagement metrics: time, clicks, keypresses, etc.

window.SecretStats = {
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
                e.target.closest('#confirm-overlay') ||
                e.target.closest('#unlock-overlay')) {
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

                runIdleTask(() => {
                    this.stats.reportsOpened[storyId] = (this.stats.reportsOpened[storyId] || 0) + 1;
                    this.updateTopReports();
                    this.saveStats();
                });
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

