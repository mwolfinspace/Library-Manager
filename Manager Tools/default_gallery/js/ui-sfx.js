(function () {
  const STORAGE_KEY = "xedrykUiSfxEnabled";
  const VOLUME_KEY = "xedrykUiSfxVolume";
  const DEFAULT_VOLUME = 0.32;
  const HOVER_COOLDOWN_MS = 70;
  const TYPE_COOLDOWN_MS = 45;
  const SHORTCUT_COOLDOWN_MS = 70;

  let audioCtx = null;
  let masterGain = null;
  let lastHoverAt = 0;
  let lastTypeAt = 0;
  let lastShortcutAt = 0;

  function readEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function writeEnabled(enabled) {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch (error) {
      // Ignore storage failures; sound remains session-local.
    }
  }

  function readVolume() {
    try {
      const value = parseFloat(localStorage.getItem(VOLUME_KEY) || "");
      return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : DEFAULT_VOLUME;
    } catch (error) {
      return DEFAULT_VOLUME;
    }
  }

  function ensureAudio() {
    if (!readEnabled()) {
      return null;
    }
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = readVolume();
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playTone(frequency, duration, type, gainValue, slideTo, delay = 0) {
    const ctx = ensureAudio();
    if (!ctx || !masterGain) {
      return;
    }

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type || "sine";
    osc.frequency.setValueAtTime(frequency, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(Math.max(0.0001, gainValue || 0.08), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  function canHover() {
    const now = performance.now();
    if (now - lastHoverAt < HOVER_COOLDOWN_MS) {
      return false;
    }
    lastHoverAt = now;
    return true;
  }

  function playCardHover() {
    if (!canHover()) {
      return;
    }
    playTone(220, 0.045, "square", 0.09, 330);
    playTone(660, 0.035, "square", 0.045, null, 0.018);
  }

  function playButtonHover() {
    if (!canHover()) {
      return;
    }
    playTone(980, 0.026, "square", 0.075, 1320);
  }

  function playControlHover() {
    if (!canHover()) {
      return;
    }
    playTone(520, 0.032, "triangle", 0.08, 1040);
  }

  function playTagHover() {
    if (!canHover()) {
      return;
    }
    playTone(1460, 0.022, "square", 0.06);
    playTone(1720, 0.018, "square", 0.04, null, 0.018);
  }

  function playLinkHover() {
    if (!canHover()) {
      return;
    }
    playTone(720, 0.03, "sine", 0.055, 960);
  }

  function playHover(kind) {
    if (kind === "card") {
      playCardHover();
      return;
    }
    if (kind === "control") {
      playControlHover();
      return;
    }
    if (kind === "tag") {
      playTagHover();
      return;
    }
    if (kind === "link") {
      playLinkHover();
      return;
    }
    playButtonHover();
  }

  function playClick() {
    playTone(360, 0.04, "square", 0.12, 180);
    playTone(720, 0.025, "square", 0.055, null, 0.028);
  }

  function playType() {
    const now = performance.now();
    if (now - lastTypeAt < TYPE_COOLDOWN_MS) {
      return;
    }
    lastTypeAt = now;
    const freq = Math.random() > 0.5 ? 1240 : 940;
    playTone(freq, 0.016, "square", 0.045);
  }

  function playShortcut() {
    const now = performance.now();
    if (now - lastShortcutAt < SHORTCUT_COOLDOWN_MS) {
      return;
    }
    lastShortcutAt = now;
    playTone(640, 0.026, "square", 0.07, 900);
  }

  function playEnable() {
    playTone(520, 0.055, "sine", 0.07, 780);
    window.setTimeout(() => playTone(880, 0.05, "sine", 0.055), 45);
  }

  function isTypingTarget(target) {
    if (!target) {
      return false;
    }
    const tagName = String(target.tagName || "").toLowerCase();
    return (
      tagName === "input" ||
      tagName === "textarea" ||
      target.isContentEditable === true
    );
  }

  function isModifierKey(key) {
    return [
      "Shift",
      "Control",
      "Alt",
      "Meta",
      "CapsLock",
      "NumLock",
      "ScrollLock",
    ].includes(key);
  }

  function getHoverKind(target) {
    if (!target) {
      return "";
    }
    if (target.closest(".story-card")) {
      return "card";
    }
    if (target.closest(".control-btn, .icon-btn, .layout-btn, .sort-btn, .filter-btn")) {
      return "control";
    }
    if (target.closest(".tag, .tag-link")) {
      return "tag";
    }
    if (target.closest("button, input[type='checkbox'], select")) {
      return "button";
    }
    if (target.closest("a")) {
      return "link";
    }
    return "";
  }

  function syncToggle(toggle) {
    if (toggle) {
      toggle.checked = readEnabled();
    }
  }

  function setupToggle(toggle) {
    if (!toggle || toggle.dataset.sfxReady === "1") {
      return;
    }
    toggle.dataset.sfxReady = "1";
    syncToggle(toggle);
    toggle.addEventListener("change", () => {
      writeEnabled(toggle.checked);
      if (toggle.checked) {
        ensureAudio();
        playEnable();
      }
      window.dispatchEvent(
        new CustomEvent("xedryk-ui-sfx-change", {
          detail: { enabled: toggle.checked },
        }),
      );
    });
  }

  function setup() {
    setupToggle(document.getElementById("ui-sfx-enabled"));

    document.addEventListener(
      "pointerover",
      (event) => {
        const kind = getHoverKind(event.target);
        if (readEnabled() && kind) {
          playHover(kind);
        }
      },
      { passive: true },
    );

    document.addEventListener(
      "click",
      (event) => {
        if (
          readEnabled() &&
          event.target &&
          event.target.closest("button, .icon-btn, .control-btn, .story-card, a")
        ) {
          playClick();
        }
      },
      true,
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (!readEnabled() || !event.key) {
          return;
        }
        if (isTypingTarget(event.target)) {
          if (event.key.length === 1) {
            playType();
          }
          return;
        }
        if (!isModifierKey(event.key)) {
          playShortcut();
        }
      },
      true,
    );

    window.addEventListener("storage", (event) => {
      if (event.key === STORAGE_KEY) {
        syncToggle(document.getElementById("ui-sfx-enabled"));
      }
    });
  }

  window.XedrykUiSfx = {
    isEnabled: readEnabled,
    setEnabled(enabled) {
      writeEnabled(Boolean(enabled));
      syncToggle(document.getElementById("ui-sfx-enabled"));
    },
    setVolume(value) {
      const volume = Math.max(0, Math.min(1, Number(value) || DEFAULT_VOLUME));
      try {
        localStorage.setItem(VOLUME_KEY, String(volume));
      } catch (error) {
        // Ignore storage failures.
      }
      if (masterGain) {
        masterGain.gain.value = volume;
      }
    },
    playHover,
    playCardHover,
    playButtonHover,
    playControlHover,
    playTagHover,
    playLinkHover,
    playClick,
    playType,
    playShortcut,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once: true });
  } else {
    setup();
  }
})();
