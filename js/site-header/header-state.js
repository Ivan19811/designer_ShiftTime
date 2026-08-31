// js/site-header/header-state.js
// Header State v1: Global + Per-Page
// - Зберігає HTML шапки (global + page-specific) у localStorage
// - Вміє "apply" у твій slot через window.SiteHeader.setHTML/clear
// - НЕ вимагає UI, НЕ ламає canvas

const LS_KEY = 'st_header_state_v1';

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch (_) { return fallback; }
}

function getDefaultState() {
  return {
    v: 1,
    global: { html: '' },
    pages: {} // { [pageId]: { html: '' } }
  };
}

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  const st = raw ? safeParse(raw, null) : null;
  if (!st || typeof st !== 'object') return getDefaultState();

  // легка нормалізація
  if (!st.pages || typeof st.pages !== 'object') st.pages = {};
  if (!st.global || typeof st.global !== 'object') st.global = { html: '' };
  if (typeof st.global.html !== 'string') st.global.html = '';
  st.v = 1;
  return st;
}

function saveState(st) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(st));
  } catch (e) {
    console.warn('[header-state] save error:', e);
  }
}

// 🔎 Як дістати pageId максимально безпечно (без залежності від інших модулів)
function getCurrentPageIdFallback() {
  // 1) якщо десь у тебе вже є current/active page в siteState
  const ss = (typeof window !== 'undefined' && window.siteState) ? window.siteState : null;
  const pid =
    ss?.page?.activePageId ||
    ss?.page?.currentPageId ||
    ss?.page?.pageId ||
    null;

  if (pid && typeof pid === 'string') return pid;

  // 2) якщо у майбутньому ти зробиш window.ST_PAGES.getActiveId()
  const maybe = window?.ST_PAGES?.getActiveId?.();
  if (maybe && typeof maybe === 'string') return maybe;

  // 3) дефолт
  return 'page:default';
}

function ensureSiteHeaderAPI() {
  return (typeof window !== 'undefined' && window.SiteHeader);
}

export function createHeaderState() {
  let state = loadState();

  function getState() {
    return state;
  }

  function setGlobalHTML(html) {
    state.global = state.global || { html: '' };
    state.global.html = String(html || '');
    // Raw HTML write means no active JSON model for this entry.
    delete state.global.model;
    delete state.global.modelVersion;
    delete state.global.templateId;
    saveState(state);
  }

  function setGlobalTemplateData(data = {}) {
    state.global = state.global || { html: '' };
    state.global.html = String(data.html || '');
    if (data.model) state.global.model = data.model;
    if (data.modelVersion) state.global.modelVersion = data.modelVersion;
    if (data.templateId) state.global.templateId = data.templateId;
    state.global.source = data.source || 'hf-json-engine-00547';
    state.global.savedAt = Date.now();
    saveState(state);
  }

  function setPageHTML(pageId, html) {
    const pid = String(pageId || '');
    if (!pid) return;
    state.pages[pid] = state.pages[pid] || { html: '' };
    state.pages[pid].html = String(html || '');
    delete state.pages[pid].model;
    delete state.pages[pid].modelVersion;
    delete state.pages[pid].templateId;
    saveState(state);
  }

  function setPageTemplateData(pageId, data = {}) {
    const pid = String(pageId || '');
    if (!pid) return;
    state.pages[pid] = state.pages[pid] || { html: '' };
    state.pages[pid].html = String(data.html || '');
    if (data.model) state.pages[pid].model = data.model;
    if (data.modelVersion) state.pages[pid].modelVersion = data.modelVersion;
    if (data.templateId) state.pages[pid].templateId = data.templateId;
    state.pages[pid].source = data.source || 'hf-json-engine-00547';
    state.pages[pid].savedAt = Date.now();
    saveState(state);
  }

  function clearPage(pageId) {
    const pid = String(pageId || '');
    if (!pid) return;
    delete state.pages[pid];
    saveState(state);
  }

  function clearGlobal() {
    state.global.html = '';
    saveState(state);
  }

  function getEffectiveEntry(pageId) {
    const pid = String(pageId || '');
    const pageEntry = pid && state.pages[pid] ? state.pages[pid] : null;
    if (pageEntry && String(pageEntry.html || '').trim()) return pageEntry;
    return state.global || { html: '' };
  }

  function getEffectiveHTML(pageId) {
    const entry = getEffectiveEntry(pageId);
    return entry?.html || '';
  }

  function apply(pageId) {
    const api = ensureSiteHeaderAPI();
    if (!api || typeof api.setHTML !== 'function' || typeof api.clear !== 'function') {
      console.warn('[header-state] SiteHeader API not ready (КРОК 5 має бути підключений)');
      return;
    }

    const html = getEffectiveHTML(pageId);
    if (html && html.trim()) api.setHTML(html);
    else api.clear();
  }

  // зручний apply без аргументів
  function applyCurrent() {
    apply(getCurrentPageIdFallback());
  }

  // --- debug / global доступ ---
  if (typeof window !== 'undefined') {
    window.ST_HEADER_STATE = window.ST_HEADER_STATE || {};
    window.ST_HEADER_STATE.getState = getState;
    window.ST_HEADER_STATE.applyCurrent = applyCurrent;
    window.ST_HEADER_STATE.apply = apply;
    window.ST_HEADER_STATE.setGlobalHTML = setGlobalHTML;
    window.ST_HEADER_STATE.setGlobalTemplateData = setGlobalTemplateData;
    window.ST_HEADER_STATE.setPageHTML = setPageHTML;
    window.ST_HEADER_STATE.setPageTemplateData = setPageTemplateData;
    window.ST_HEADER_STATE.clearPage = clearPage;
    window.ST_HEADER_STATE.clearGlobal = clearGlobal;
    window.ST_HEADER_STATE.getEffectiveHTML = getEffectiveHTML;
    window.ST_HEADER_STATE.getEffectiveEntry = getEffectiveEntry;
    window.ST_HEADER_STATE.getCurrentPageIdFallback = getCurrentPageIdFallback;
  }

  return {
    getState,
    setGlobalHTML,
    setGlobalTemplateData,
    setPageHTML,
    setPageTemplateData,
    clearPage,
    clearGlobal,
    getEffectiveHTML,
    getEffectiveEntry,
    apply,
    applyCurrent
  };
}
