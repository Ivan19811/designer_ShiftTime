// js/site-footer/footer-state.js
// Footer State v1: Global + Per-Page
// - Зберігає HTML футера (global + page-specific) у localStorage
// - Вміє "apply" у твій slot через window.SiteFooter.setHTML/clear
// - НЕ вимагає UI, НЕ ламає canvas

const LS_KEY = 'st_footer_state_v1';

function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch (_) { return fallback; }
}

function getDefaultState() {
  return {
    v: 1,
    global: { html: '' },
    pages: {} // { [pageId]: { html:'' } }
  };
}

function loadState() {
  const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem(LS_KEY) : null;
  const st = safeParse(raw, null);
  if (!st || typeof st !== 'object') return getDefaultState();
  if (st.v !== 1) return getDefaultState();
  st.global = st.global || { html: '' };
  st.pages = st.pages || {};
  return st;
}

function saveState(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state || getDefaultState())); } catch {}
}

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

function ensureSiteFooterAPI() {
  return (typeof window !== 'undefined' && window.SiteFooter);
}

export function createFooterState() {
  let state = loadState();

  function getState() {
    return state;
  }

  function setGlobalHTML(html) {
    state.global = state.global || { html: '' };
    state.global.html = String(html || '');
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
    const pageEntry = pid && state?.pages?.[pid] ? state.pages[pid] : null;
    if (pageEntry && String(pageEntry.html || '').trim()) return pageEntry;
    return state.global || { html: '' };
  }

  function getEffectiveHTML(pageId) {
    const entry = getEffectiveEntry(pageId);
    return entry?.html || '';
  }

  function apply({ mode = "global", pageId = "" } = {}) {
    const api = ensureSiteFooterAPI();
    if (!api) return;

    if (mode === "global") {
      const html = state?.global?.html || '';
      if (html && html.trim()) api.setHTML(html);
      else api.clear();
      return;
    }

    // mode === "page"
    const pid = String(pageId || getCurrentPageIdFallback());
    const html = getEffectiveHTML(pid);
    if (html && html.trim()) api.setHTML(html);
    else api.clear();
  }

  function applyCurrent(mode = "global") {
    const pid = getCurrentPageIdFallback();
    apply({ mode, pageId: pid });
  }

  // Expose global (як для Header)
  if (typeof window !== 'undefined') {
    window.ST_FOOTER_STATE = window.ST_FOOTER_STATE || {};
    window.ST_FOOTER_STATE.getState = getState;
    window.ST_FOOTER_STATE.applyCurrent = applyCurrent;
    window.ST_FOOTER_STATE.apply = apply;
    window.ST_FOOTER_STATE.setGlobalHTML = setGlobalHTML;
    window.ST_FOOTER_STATE.setGlobalTemplateData = setGlobalTemplateData;
    window.ST_FOOTER_STATE.setPageHTML = setPageHTML;
    window.ST_FOOTER_STATE.setPageTemplateData = setPageTemplateData;
    window.ST_FOOTER_STATE.clearPage = clearPage;
    window.ST_FOOTER_STATE.clearGlobal = clearGlobal;
    window.ST_FOOTER_STATE.getEffectiveHTML = getEffectiveHTML;
    window.ST_FOOTER_STATE.getEffectiveEntry = getEffectiveEntry;
    window.ST_FOOTER_STATE.getCurrentPageIdFallback = getCurrentPageIdFallback;
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
