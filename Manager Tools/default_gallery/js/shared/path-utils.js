function stripQueryAndHash(path) {
  return String(path || "").split("#")[0].split("?")[0];
}

function isLikelyWindowsAbsolutePath(path) {
  return /^[a-zA-Z]:\//.test(path) || /^\/[a-zA-Z]:\//.test(path);
}

function canonicalizeProjectRelativePath(path) {
  const relative = String(path || "").replace(/^\/+/, "").trim();
  if (!relative) {
    return "";
  }
  const separatorIndex = relative.indexOf("/");
  const head =
    separatorIndex >= 0
      ? relative.slice(0, separatorIndex).toLowerCase()
      : relative.toLowerCase();
  const tail = separatorIndex >= 0 ? relative.slice(separatorIndex + 1) : "";
  if (head === "media-scr" || head === "story" || head === "database") {
    return tail ? `${head}/${tail}` : head;
  }
  return relative;
}

function extractProjectRelativePath(rawPath) {
  const normalized = String(rawPath || "").replace(/\\/g, "/").trim();
  if (!normalized) {
    return "";
  }

  const cleanPath = stripQueryAndHash(normalized);
  const lowerPath = cleanPath.toLowerCase();
  const markers = [
    "/media-scr/",
    "/story/",
    "/database/",
    "media-scr/",
    "story/",
    "database/",
  ];
  for (const marker of markers) {
    const markerIndex = lowerPath.lastIndexOf(marker);
    if (markerIndex >= 0) {
      const offset = marker.startsWith("/") ? markerIndex + 1 : markerIndex;
      return canonicalizeProjectRelativePath(cleanPath.slice(offset));
    }
  }

  const relativePath = canonicalizeProjectRelativePath(
    cleanPath.replace(/^\/+/, ""),
  );
  if (
    relativePath.startsWith("media-scr/") ||
    relativePath.startsWith("story/") ||
    relativePath.startsWith("database/")
  ) {
    return relativePath;
  }

  return "";
}

function normalizeCatalogPath(rawPath) {
  if (typeof rawPath !== "string") {
    return "";
  }
  const trimmed = rawPath.trim();
  if (!trimmed) {
    return "";
  }
  if (/^(?:https?:|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^file:/i.test(trimmed)) {
    try {
      const fileUrl = new URL(trimmed);
      const fromUrl = extractProjectRelativePath(
        decodeURIComponent(fileUrl.pathname || ""),
      );
      if (fromUrl) {
        return fromUrl;
      }
    } catch (error) {
      // Ignore malformed file URLs and continue with string normalization.
    }
    return "";
  }

  const slashPath = trimmed.replace(/\\/g, "/");
  const extracted = extractProjectRelativePath(slashPath);
  if (extracted) {
    return extracted;
  }

  if (isLikelyWindowsAbsolutePath(stripQueryAndHash(slashPath))) {
    return "";
  }

  if (slashPath.startsWith("/")) {
    return stripQueryAndHash(slashPath).replace(/^\/+/, "");
  }

  return slashPath;
}

function normalizeCatalogEntryPaths(entry) {
  if (!entry || typeof entry !== "object") {
    return entry;
  }

  const normalized = { ...entry };
  if (typeof normalized.story === "string") {
    normalized.story = normalizeCatalogPath(normalized.story);
  }
  if (typeof normalized.cover === "string") {
    normalized.cover = normalizeCatalogPath(normalized.cover);
  }
  if (typeof normalized.video === "string") {
    normalized.video = normalizeCatalogPath(normalized.video);
  }
  if (Array.isArray(normalized.images)) {
    normalized.images = normalized.images
      .map((path) => (typeof path === "string" ? normalizeCatalogPath(path) : path))
      .filter(Boolean);
  }
  if (Array.isArray(normalized.videos)) {
    normalized.videos = normalized.videos
      .map((path) => (typeof path === "string" ? normalizeCatalogPath(path) : path))
      .filter(Boolean);
  }
  if (
    normalized.coverMedia &&
    typeof normalized.coverMedia === "object" &&
    typeof normalized.coverMedia.path === "string"
  ) {
    normalized.coverMedia = {
      ...normalized.coverMedia,
      path: normalizeCatalogPath(normalized.coverMedia.path),
    };
  }
  if (Array.isArray(normalized.media)) {
    normalized.media = normalized.media
      .map((item) => {
        if (typeof item === "string") {
          const nextPath = normalizeCatalogPath(item);
          return nextPath || null;
        }
        if (!item || typeof item !== "object") {
          return null;
        }
        const rawSrc = item.src || item.path || item.url || "";
        const nextPath = normalizeCatalogPath(rawSrc);
        if (!nextPath) {
          return null;
        }
        return {
          ...item,
          src: nextPath,
        };
      })
      .filter(Boolean);
  }
  return normalized;
}

function normalizeCatalogEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.map((entry) => normalizeCatalogEntryPaths(entry));
}
