const ENCRYPTION_PREFIX = "XEDRYK_ENC_V1:";
const ENCRYPTION_ITERATIONS_FALLBACK = 210000;

function parseEncryptedPayload(rawText) {
  if (typeof rawText !== "string" || !rawText.startsWith(ENCRYPTION_PREFIX)) {
    return null;
  }
  const jsonText = rawText.slice(ENCRYPTION_PREFIX.length);
  if (!jsonText.trim()) {
    return null;
  }
  try {
    const payload = JSON.parse(jsonText);
    if (
      !payload ||
      typeof payload !== "object" ||
      typeof payload.salt !== "string" ||
      typeof payload.iv !== "string" ||
      typeof payload.data !== "string"
    ) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

function fromBase64(base64Text) {
  const binary = atob(String(base64Text || ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function ensureWebCryptoReady() {
  if (!(window.crypto && window.crypto.subtle)) {
    throw new Error("Web Crypto API is unavailable.");
  }
}

async function deriveEncryptionKey(password, saltBytes, iterations) {
  ensureWebCryptoReady();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password || "")),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

async function decryptPayloadToBytes(rawText, password) {
  const payload = parseEncryptedPayload(rawText);
  if (!payload) {
    throw new Error("Encrypted payload format is invalid.");
  }
  const iterations = Number.isFinite(payload.iter)
    ? payload.iter
    : parseInt(payload.iter, 10) || ENCRYPTION_ITERATIONS_FALLBACK;
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const encryptedBytes = fromBase64(payload.data);
  const key = await deriveEncryptionKey(password, salt, iterations);
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encryptedBytes,
    );
    return {
      bytes: new Uint8Array(decrypted),
      mime: typeof payload.mime === "string" ? payload.mime : "",
    };
  } catch (error) {
    throw new Error("Incorrect password.");
  }
}
