// ===== DEFAULT COLOR SCHEMES =====
// These define the dark and light theme color palettes
// Can be overridden by user custom colors in localStorage

window.DEFAULT_COLORS = {
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
    "card-overlay":
      "linear-gradient(180deg, rgba(3, 5, 10, 0.08) 0%, rgba(3, 5, 10, 0.9) 100%)",
    "card-overlay-list":
      "linear-gradient(90deg, rgba(5, 7, 13, 0.88) 0%, rgba(5, 7, 13, 0.5) 55%, rgba(5, 7, 13, 0.12) 100%)",
    "cursor-glow": "rgba(98, 247, 255, 0.2)",
    "tag-bg": "rgba(98, 247, 255, 0.15)",
    "tag-bg-hover": "rgba(98, 247, 255, 0.3)",
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
    "card-overlay":
      "linear-gradient(180deg, rgba(239, 243, 249, 0.1) 0%, rgba(239, 243, 249, 0.4) 100%)",
    "card-overlay-list":
      "linear-gradient(90deg, rgba(238, 243, 249, 0.5) 0%, rgba(238, 243, 249, 0.25) 55%, rgba(238, 243, 249, 0.05) 100%)",
    "cursor-glow": "rgba(59, 91, 255, 0.18)",
    "tag-bg": "rgba(10, 166, 199, 0.15)",
    "tag-bg-hover": "rgba(10, 166, 199, 0.25)",
  },
};

window.COLOR_DESCRIPTIONS = {
  ink: { desc: "Text color", icon: "A" },
  muted: { desc: "Muted text", icon: "a" },
  bg: { desc: "Main background", icon: "bg" },
  "bg-2": { desc: "Secondary bg", icon: "2bg" },
  panel: { desc: "Panel bg", icon: "p" },
  accent: { desc: "Primary accent", icon: "ac1" },
  "accent-2": { desc: "Secondary accent", icon: "ac2" },
  card: { desc: "Card background", icon: "c" },
  shadow: { desc: "Shadow color", icon: "shd" },
  grid: { desc: "Grid pattern", icon: "gr" },
  code: { desc: "Code color", icon: "cd" },
  "code-glow": { desc: "Code glow", icon: "cg" },
  btn: { desc: "Button bg", icon: "btn" },
  "btn-border": { desc: "Button border", icon: "bb" },
  "card-overlay": { desc: "Card overlay gradient", icon: "co" },
  "card-overlay-list": { desc: "Card overlay list gradient", icon: "cl" },
  "cursor-glow": { desc: "Cursor glow", icon: "cg2" },
  "tag-bg": { desc: "Tag background", icon: "tg" },
  "tag-bg-hover": { desc: "Tag hover background", icon: "tgh" },
};
