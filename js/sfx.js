/**
 * Retro Sound Effects System
 * Uses Web Audio API to generate 8-bit style SFX
 * No external audio files required
 */

const SFX = (function() {
    // Audio context (lazy initialization)
    let audioCtx = null;
    let masterGain = null;
    let soundEnabled = true;

    // Initialize audio context on first user interaction
    function initAudio() {
        if (audioCtx) return;

        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Create master gain node for volume control
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.3; // Default volume 30%
        masterGain.connect(audioCtx.destination);

        // Resume audio context if suspended (browser autoplay policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    // Ensure audio is initialized and ready
    function ensureAudio() {
        if (!soundEnabled) return false;
        initAudio();
        return audioCtx && audioCtx.state === 'running';
    }

    // Create a simple oscillator-based sound
    function playTone(frequency, duration, type = 'square', volume = 1, slideTo = null) {
        if (!ensureAudio()) return;

        const now = audioCtx.currentTime;

        // Create oscillator
        const osc = audioCtx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, now);

        // Handle frequency slide
        if (slideTo !== null) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
        }

        // Create gain envelope
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(volume * masterGain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Connect nodes
        osc.connect(gain);
        gain.connect(masterGain);

        // Play
        osc.start(now);
        osc.stop(now + duration);
    }

    // Create noise-based sound (for retro impact sounds)
    function playNoise(duration, volume = 0.5) {
        if (!ensureAudio()) return;

        const now = audioCtx.currentTime;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        // Create noise source
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        // Create gain envelope
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(volume * masterGain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Apply filter for more retro sound
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        // Connect
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(now);
    }

    // Create a "coin/collect" style sound (rising pitch)
    function playRising(frequencies, duration, type = 'square') {
        if (!ensureAudio()) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        osc.type = type;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(masterGain.gain.value * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        // Set up frequency automation
        const stepTime = duration / frequencies.length;
        osc.frequency.setValueAtTime(frequencies[0], now);
        frequencies.forEach((freq, i) => {
            if (i > 0) {
                osc.frequency.setValueAtTime(freq, now + stepTime * i);
            }
        });

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + duration);
    }

    // Play multiple tones in sequence (arpeggio)
    function playArpeggio(frequencies, noteDuration, type = 'square') {
        if (!ensureAudio()) return;

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        osc.type = type;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(masterGain.gain.value * 0.3, now);
        gain.gain.setValueAtTime(0, now + frequencies.length * noteDuration);

        frequencies.forEach((freq, i) => {
            const startTime = now + i * noteDuration;
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(masterGain.gain.value * 0.3, startTime);
            gain.gain.setValueAtTime(0.01, startTime + noteDuration * 0.8);
        });

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + frequencies.length * noteDuration);
    }

    // ===== SOUND EFFECTS =====

    /**
     * Card hover/select sound - soft blip
     */
    function cardHover() {
        playTone(800, 0.05, 'square', 0.15);
    }

    /**
     * Card click/select sound - more prominent
     */
    function cardClick() {
        playTone(600, 0.08, 'square', 0.25);
        setTimeout(() => playTone(900, 0.06, 'square', 0.2), 50);
    }

    /**
     * Button hover/round sound - gentle tick
     */
    function buttonHover() {
        playTone(1200, 0.03, 'sine', 0.1);
    }

    /**
     * Button click sound - satisfying press
     */
    function buttonClick() {
        playTone(400, 0.06, 'square', 0.3);
        setTimeout(() => playTone(200, 0.08, 'square', 0.2), 30);
    }

    /**
     * Switch tab sound - quick upward blip
     */
    function tabSwitch() {
        playRising([400, 600, 800], 0.1, 'square');
    }

    /**
     * Enter/confirm sound - positive confirmation
     */
    function enter() {
        // Successive rising tones
        playArpeggio([523, 659, 784], 0.08, 'square'); // C5, E5, G5
    }

    /**
     * Cancel/back sound - descending tone
     */
    function cancel() {
        playTone(400, 0.1, 'triangle', 0.3);
        setTimeout(() => {
            playTone(200, 0.15, 'triangle', 0.25);
        }, 50);
    }

    /**
     * Toggle switch sound - two-state click
     */
    function toggle() {
        playTone(600, 0.04, 'square', 0.25);
        setTimeout(() => playTone(800, 0.06, 'square', 0.2), 40);
    }

    /**
     * Error/alert sound - harsh buzz
     */
    function error() {
        playTone(150, 0.15, 'sawtooth', 0.3);
        setTimeout(() => playTone(100, 0.2, 'sawtooth', 0.25), 100);
    }

    /**
     * Success/achievement sound - fanfare
     */
    function success() {
        const now = audioCtx.currentTime;

        // Main fanfare
        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6
        frequencies.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = freq;

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.2, now + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.2);
        });
    }

    /**
     * Notification/popup sound
     */
    function notification() {
        playRising([600, 900, 1200], 0.15, 'sine');
    }

    /**
     * Delete/remove sound - trash effect
     */
    function deleteSound() {
        playNoise(0.15, 0.2);
    }

    /**
     * Save/bookmark sound
     */
    function save() {
        playRising([500, 700, 900, 1100], 0.12, 'square');
    }

    /**
     * Favorite/star sound
     */
    function favorite() {
        // Sparkle effect
        const now = audioCtx.currentTime;

        [880, 1100, 1320, 1760].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = audioCtx.createGain();
            gain.gain.setValueAtTime(0.15, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    }

    /**
     * Copy/duplicate sound
     */
    function copy() {
        playTone(800, 0.06, 'square', 0.2);
        setTimeout(() => playTone(1000, 0.08, 'square', 0.2), 60);
    }

    /**
     * Open modal/panel sound
     */
    function modalOpen() {
        playTone(300, 0.1, 'triangle', 0.25);
        setTimeout(() => {
            playTone(500, 0.1, 'triangle', 0.2);
        }, 80);
    }

    /**
     * Close modal/panel sound
     */
    function modalClose() {
        playTone(500, 0.08, 'triangle', 0.2);
        setTimeout(() => {
            playTone(300, 0.12, 'triangle', 0.15);
        }, 60);
    }

    /**
     * Scroll/wheel sound (subtle)
     */
    function scroll() {
        playTone(2000, 0.02, 'sine', 0.05);
    }

    /**
     * Focus gained sound
     */
    function focusGain() {
        playTone(1000, 0.04, 'square', 0.1);
    }

    /**
     * Drag start sound
     */
    function dragStart() {
        playTone(600, 0.06, 'square', 0.15);
    }

    /**
     * Drag drop sound
     */
    function dragDrop() {
        playTone(400, 0.05, 'square', 0.2);
        setTimeout(() => playTone(600, 0.05, 'square', 0.15), 30);
    }

    /**
     * Volume change sound
     */
    function volumeChange() {
        playTone(1000, 0.03, 'sine', 0.15);
    }

    /**
     * Theme switch sound
     */
    function themeSwitch() {
        // Dramatic swoosh effect
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Hover tick for list items
     */
    function listHover() {
        playTone(1500, 0.02, 'sine', 0.08);
    }

    /**
     * Selection change sound
     */
    function selectionChange() {
        playTone(700, 0.04, 'triangle', 0.15);
    }

    /**
     * Blackout mode toggle
     */
    function blackoutOn() {
        // Deep ominous tone
        playTone(80, 0.5, 'sine', 0.3);
    }

    function blackoutOff() {
        // Rising reveal
        playTone(80, 0.3, 'sine', 0.2);
        setTimeout(() => {
            playTone(200, 0.2, 'sine', 0.15);
        }, 200);
    }

    /**
     * Settings panel open/close
     */
    function settingsOpen() {
        modalOpen();
    }

    function settingsClose() {
        modalClose();
    }

    /**
     * Filter change sound
     */
    function filterChange() {
        playRising([400, 550, 700], 0.08, 'square');
    }

    /**
     * Sort change sound
     */
    function sortChange() {
        playArpeggio([350, 440, 550], 0.06, 'triangle');
    }

    /**
     * Search focus sound
     */
    function searchFocus() {
        playTone(1500, 0.05, 'square', 0.1);
    }

    /**
     * Keyboard shortcut invoked
     */
    function shortcut() {
        playTone(2000, 0.03, 'square', 0.1);
    }

    // ===== PUBLIC API =====

    return {
        // Enable/disable sounds
        enable() {
            soundEnabled = true;
            initAudio();
        },

        disable() {
            soundEnabled = false;
        },

        isEnabled() {
            return soundEnabled;
        },

        // Volume control
        setVolume(value) {
            if (masterGain) {
                masterGain.gain.value = Math.max(0, Math.min(1, value));
            }
        },

        // Main sound effects
        cardHover,
        cardClick,
        buttonHover,
        buttonClick,
        tabSwitch,
        enter,
        cancel,
        toggle,
        error,
        success,
        notification,
        delete: deleteSound,
        save,
        favorite,
        copy,
        modalOpen,
        modalClose,
        scroll,
        focusGain,
        dragStart,
        dragDrop,
        volumeChange,
        themeSwitch,
        listHover,
        selectionChange,
        blackoutOn,
        blackoutOff,
        settingsOpen,
        settingsClose,
        filterChange,
        sortChange,
        searchFocus,
        shortcut,

        // Aliases for convenience
        click: buttonClick,
        hover: buttonHover,
        switch: tabSwitch,
        confirm: enter
    };
})();

// Auto-initialize on first user interaction
document.addEventListener('click', function initOnClick() {
    SFX.initAudio?.();
    document.removeEventListener('click', initOnClick);
}, { once: true });

document.addEventListener('keydown', function initOnKey() {
    SFX.initAudio?.();
    document.removeEventListener('keydown', initOnKey);
}, { once: true });
