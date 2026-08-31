// js/site-header/header-store.js
// =========================================================
// STORE: ШАПКА (Header) — Global + Per-Page
// - Зберігання у localStorage
// - Без canvas / без UI (тільки дані)
// - Єдина структура даних для подальшого рендеру
// =========================================================

const LS_KEY_GLOBAL = "st_header_global_v1";
const LS_KEY_PAGES  = "st_header_pages_v1"; // map: { [pageId]: headerPayload }

// payload приклад:
// {
//   id: "hdr_456",
//   name: "Рожева - №456",
//   html: "<header>...</header>",
//   meta: { createdAt: 1730000000000, source: "template", templateId: "t_12" }
// }

function safeParse(raw, fallback) {
  try {
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return (v === null || v === undefined) ? fallback : v;
  } catch {
    return fallback;
  }
}

function safeStringify(v) {
  try { return JSON.stringify(v); } catch { return ""; }
}

function normalizeHeaderPayload(p) {
  if (!p || typeof p !== "object") return null;

  const id   = typeof p.id === "string" ? p.id : "";
  const name = typeof p.name === "string" ? p.name : (id ? id : "Шапка");
  const html = typeof p.html === "string" ? p.html : "";

  const meta = (p.meta && typeof p.meta === "object") ? p.meta : {};
  const createdAt = Number.isFinite(meta.createdAt) ? meta.createdAt : Date.now();

  return {
    id,
    name,
    html,
    meta: { ...meta, createdAt }
  };
}

// -------------------------
// GLOBAL
// -------------------------
export function getGlobalHeader() {
  const raw = localStorage.getItem(LS_KEY_GLOBAL);
  return normalizeHeaderPayload(safeParse(raw, null));
}

export function setGlobalHeader(payload) {
  const norm = normalizeHeaderPayload(payload);
  if (!norm) return false;
  localStorage.setItem(LS_KEY_GLOBAL, safeStringify(norm));
  return true;
}

export function clearGlobalHeader() {
  localStorage.removeItem(LS_KEY_GLOBAL);
}

// -------------------------
// PAGES MAP
// -------------------------
function getPagesMap() {
  const raw = localStorage.getItem(LS_KEY_PAGES);
  const map = safeParse(raw, {});
  return (map && typeof map === "object") ? map : {};
}

function setPagesMap(map) {
  localStorage.setItem(LS_KEY_PAGES, safeStringify(map || {}));
}

export function getPageHeader(pageId) {
  if (!pageId) return null;
  const map = getPagesMap();
  return normalizeHeaderPayload(map[String(pageId)] || null);
}

export function setPageHeader(pageId, payload) {
  if (!pageId) return false;
  const norm = normalizeHeaderPayload(payload);
  if (!norm) return false;

  const map = getPagesMap();
  map[String(pageId)] = norm;
  setPagesMap(map);
  return true;
}

export function clearPageHeader(pageId) {
  if (!pageId) return;
  const map = getPagesMap();
  delete map[String(pageId)];
  setPagesMap(map);
}

export function getAllPageHeaders() {
  const map = getPagesMap();
  const out = {};
  Object.keys(map).forEach((k) => {
    const v = normalizeHeaderPayload(map[k]);
    if (v) out[k] = v;
  });
  return out;
}

export function clearAllPageHeaders() {
  localStorage.removeItem(LS_KEY_PAGES);
}

// -------------------------
// UTIL
// -------------------------
export function hasAnyHeader(pageId) {
  const g = getGlobalHeader();
  if (g && g.html) return true;

  if (pageId) {
    const p = getPageHeader(pageId);
    if (p && p.html) return true;
  }
  return false;
}

