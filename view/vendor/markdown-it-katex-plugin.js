/*!
 * markdown-it-katex-plugin (browser UMD wrapper)
 * Based on markdown-it-katex (MIT): https://github.com/waylonflinn/markdown-it-katex
 */
(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define([], factory);
  } else {
    root.markdownitKatex = factory();
  }
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function isValidDelim(state, pos) {
    var prevChar = pos > 0 ? state.src.charCodeAt(pos - 1) : -1;
    var nextChar = pos + 1 <= state.posMax ? state.src.charCodeAt(pos + 1) : -1;
    var canOpen = true;
    var canClose = true;

    if (
      prevChar === 0x20 ||
      prevChar === 0x09 ||
      (nextChar >= 0x30 && nextChar <= 0x39)
    ) {
      canClose = false;
    }
    if (nextChar === 0x20 || nextChar === 0x09) {
      canOpen = false;
    }

    return { can_open: canOpen, can_close: canClose };
  }

  function mathInline(state, silent) {
    if (state.src[state.pos] !== "$") {
      return false;
    }

    var res = isValidDelim(state, state.pos);
    if (!res.can_open) {
      if (!silent) {
        state.pending += "$";
      }
      state.pos += 1;
      return true;
    }

    var start = state.pos + 1;
    var match = start;
    var pos;
    while ((match = state.src.indexOf("$", match)) !== -1) {
      pos = match - 1;
      while (state.src[pos] === "\\") {
        pos -= 1;
      }
      if (((match - pos) % 2) === 1) {
        break;
      }
      match += 1;
    }

    if (match === -1) {
      if (!silent) {
        state.pending += "$";
      }
      state.pos = start;
      return true;
    }

    if (match - start === 0) {
      if (!silent) {
        state.pending += "$$";
      }
      state.pos = start + 1;
      return true;
    }

    res = isValidDelim(state, match);
    if (!res.can_close) {
      if (!silent) {
        state.pending += "$";
      }
      state.pos = start;
      return true;
    }

    if (!silent) {
      var token = state.push("math_inline", "math", 0);
      token.markup = "$";
      token.content = state.src.slice(start, match);
    }

    state.pos = match + 1;
    return true;
  }

  function mathBlock(state, start, end, silent) {
    var pos = state.bMarks[start] + state.tShift[start];
    var max = state.eMarks[start];
    if (pos + 2 > max) {
      return false;
    }
    if (state.src.slice(pos, pos + 2) !== "$$") {
      return false;
    }

    pos += 2;
    var firstLine = state.src.slice(pos, max);
    var found = false;
    var lastLine = "";
    var next = start;
    var lastPos = 0;

    if (silent) {
      return true;
    }

    if (firstLine.trim().slice(-2) === "$$") {
      firstLine = firstLine.trim().slice(0, -2);
      found = true;
    }

    while (!found) {
      next += 1;
      if (next >= end) {
        break;
      }
      pos = state.bMarks[next] + state.tShift[next];
      max = state.eMarks[next];

      if (pos < max && state.tShift[next] < state.blkIndent) {
        break;
      }

      if (state.src.slice(pos, max).trim().slice(-2) === "$$") {
        lastPos = state.src.slice(0, max).lastIndexOf("$$");
        lastLine = state.src.slice(pos, lastPos);
        found = true;
      }
    }

    state.line = next + 1;

    var token = state.push("math_block", "math", 0);
    token.block = true;
    token.content =
      (firstLine && firstLine.trim() ? firstLine + "\n" : "") +
      state.getLines(start + 1, next, state.tShift[start], true) +
      (lastLine && lastLine.trim() ? lastLine : "");
    token.map = [start, state.line];
    token.markup = "$$";
    return true;
  }

  return function mathPlugin(md, options) {
    options = options || {};

    function renderKatex(latex, displayMode) {
      var katexEngine = (typeof window !== "undefined" ? window.katex : null) ||
        (typeof globalThis !== "undefined" ? globalThis.katex : null);
      if (!katexEngine || typeof katexEngine.renderToString !== "function") {
        return displayMode
          ? '<div class="math-render-error">' + escapeHtml(latex) + "</div>"
          : '<span class="math-render-error">' + escapeHtml(latex) + "</span>";
      }
      var katexOptions = Object.assign({}, options, {
        displayMode: !!displayMode,
      });
      try {
        return katexEngine.renderToString(latex, katexOptions);
      } catch (error) {
        return displayMode
          ? '<div class="math-render-error">' + escapeHtml(latex) + "</div>"
          : '<span class="math-render-error">' + escapeHtml(latex) + "</span>";
      }
    }

    md.inline.ruler.after("escape", "math_inline", mathInline);
    md.block.ruler.after("blockquote", "math_block", mathBlock, {
      alt: ["paragraph", "reference", "blockquote", "list"],
    });

    md.renderer.rules.math_inline = function (tokens, idx) {
      return renderKatex(tokens[idx].content, false);
    };

    md.renderer.rules.math_block = function (tokens, idx) {
      return '<div class="math-block">' + renderKatex(tokens[idx].content, true) + "</div>\n";
    };
  };
}));
