import { loadPersistedAiRuntimeState, savePersistedAiRuntimeState, rehydrateAiRuntimeState } from './ai-command-runtime-persistence.js';

function safeNow() {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function getDoc(context = {}) {
  return context.document || (typeof document !== 'undefined' ? document : null);
}

function getWin(context = {}) {
  if (context.window) return context.window;
  const doc = getDoc(context);
  return doc?.defaultView || (typeof window !== 'undefined' ? window : null);
}

function hasPersistedElements(context = {}) {
  try {
    const state = loadPersistedAiRuntimeState(context);
    return Object.keys(state?.elements || {}).length > 0;
  } catch {
    return false;
  }
}


const DIMENSION_INLINE_STYLE_PROPS_FOR_SYNC = new Set(['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight', 'boxSizing']);

function parsePxNumberForSync(value) {
  const m = String(value || '').trim().match(/^(-?\d+(?:\.\d+)?)px$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.max(1, Math.round(n * 100) / 100) : null;
}

function findDimensionBlockForSync(el) {
  if (!el || typeof el.closest !== 'function') return el || null;
  try { return el.matches?.('.st-block') ? el : (el.closest('.st-block') || el); } catch { return el || null; }
}

function parseJsonForSync(raw, fallback = null) {
  try { return raw ? JSON.parse(String(raw)) : fallback; } catch { return fallback; }
}

function updateGeomDimensionForSync(geom, property, numeric) {
  if (!geom || typeof geom !== 'object') geom = { w: null, h: null, r: { tl: null, tr: null, br: null, bl: null } };
  if (!geom.r || typeof geom.r !== 'object') geom.r = { tl: null, tr: null, br: null, bl: null };
  if (property === 'width') geom.w = numeric;
  if (property === 'height') geom.h = numeric;
  return geom;
}

function cleanHeaderHtmlForDimensionSync(slot) {
  if (!slot || typeof slot.cloneNode !== 'function') return '';
  try {
    const clone = slot.cloneNode(true);
    clone.querySelectorAll?.('.hb-panel')?.forEach?.((node) => node.remove());
    clone.querySelectorAll?.('.is-active, .is-selected, .hb-dom-active, .hb-dom-hover, .hb-dom-soft, .hb-ctor-hover')?.forEach?.((node) => {
      try { node.classList.remove('is-active', 'is-selected', 'hb-dom-active', 'hb-dom-hover', 'hb-dom-soft', 'hb-ctor-hover'); } catch {}
    });
    clone.querySelectorAll?.('[data-hb-ref], [data-hb-geom]')?.forEach?.((node) => {
      try { node.removeAttribute('data-hb-ref'); } catch {}
      try { node.removeAttribute('data-hb-geom'); } catch {}
    });
    return String(clone.innerHTML || '');
  } catch {
    return '';
  }
}

function getHeaderModeForDimensionSync(win) {
  try {
    const pageId = win?.ST_HEADER_STATE?.getCurrentPageIdFallback?.() || 'page:default';
    const gRaw = win?.localStorage?.getItem?.('st_header_mode_global_v1');
    const globalMode = (gRaw === 'page' || gRaw === 'global') ? gRaw : 'global';
    const map = parseJsonForSync(win?.localStorage?.getItem?.('st_header_mode_pages_v1') || '', {}) || {};
    const p = map?.[String(pageId)];
    const mode = (p === 'page' || p === 'global') ? p : globalMode;
    return { pageId, mode };
  } catch {
    return { pageId: 'page:default', mode: 'global' };
  }
}

function saveHeaderHtmlForDimensionSync(win, html) {
  if (!win || !html) return false;
  const { pageId, mode } = getHeaderModeForDimensionSync(win);
  try {
    const HS = win.ST_HEADER_STATE;
    if (HS && typeof HS.setGlobalHTML === 'function' && typeof HS.setPageHTML === 'function') {
      if (mode === 'page') HS.setPageHTML(pageId, html);
      else HS.setGlobalHTML(html);
      return true;
    }
  } catch {}
  try {
    const st = parseJsonForSync(win.localStorage?.getItem?.('st_header_state_v1') || '', null) || { v: 1, global: { html: '' }, pages: {} };
    if (!st.global || typeof st.global !== 'object') st.global = { html: '' };
    if (!st.pages || typeof st.pages !== 'object') st.pages = {};
    if (mode === 'page') {
      const pid = String(pageId || 'page:default');
      st.pages[pid] = st.pages[pid] || { html: '' };
      st.pages[pid].html = html;
    } else {
      st.global.html = html;
    }
    st.v = 1;
    win.localStorage?.setItem?.('st_header_state_v1', JSON.stringify(st));
    return true;
  } catch {
    return false;
  }
}

function persistHeaderStructureDimensionForSync(el, dims = {}) {
  const block = findDimensionBlockForSync(el);
  const hbRef = String(block?.dataset?.hbRef || el?.dataset?.hbRef || '').trim();
  if (!hbRef) return false;
  const width = dims.width ? parsePxNumberForSync(dims.width) : null;
  const height = dims.height ? parsePxNumberForSync(dims.height) : null;
  try {
    const win = getWin({ document: el?.ownerDocument }) || globalThis.window || null;
    const raw = win?.localStorage?.getItem?.('ST_HEADER_STRUCTURE') || '';
    const state = parseJsonForSync(raw, null);
    if (!state || !Array.isArray(state.sections)) return false;
    let changed = false;
    const touch = (obj) => {
      if (!obj || String(obj.id || '') !== hbRef) return;
      let geom = obj.geometry;
      if (width != null) geom = updateGeomDimensionForSync(geom, 'width', width);
      if (height != null) geom = updateGeomDimensionForSync(geom, 'height', height);
      obj.geometry = geom;
      changed = true;
    };
    for (const sec of state.sections || []) {
      touch(sec);
      for (const lvl of sec.levels || []) {
        touch(lvl);
        for (const c of lvl.containers || []) {
          touch(c);
          for (const b of c.blocks || []) touch(b);
        }
      }
    }
    if (!changed) return false;
    win.localStorage?.setItem?.('ST_HEADER_STRUCTURE', JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function persistCanonicalDimensionSourceForSync(el, dims = {}) {
  const block = findDimensionBlockForSync(el);
  if (!block) return false;
  let saved = false;
  try {
    const w = dims.width ? parsePxNumberForSync(dims.width) : null;
    const h = dims.height ? parsePxNumberForSync(dims.height) : null;
    if (w != null) {
      block.dataset.stCustomW = `${w}px`;
      block.dataset.aiWidthApplied = `${w}px`;
    }
    if (h != null) {
      block.dataset.stCustomH = `${h}px`;
      block.dataset.aiHeightApplied = `${h}px`;
    }
    block.dataset.stSizeMode = 'custom';
    block.dataset.sizeMode = 'custom';
    block.dataset.aiRuntimeUnlockedSize = '1';
    if (w != null || h != null) {
      const current = parseJsonForSync(block.dataset?.hbGeom || '', null);
      let geom = current;
      if (w != null) geom = updateGeomDimensionForSync(geom, 'width', w);
      if (h != null) geom = updateGeomDimensionForSync(geom, 'height', h);
      block.dataset.hbGeom = JSON.stringify(geom);
    }
  } catch {}
  try { if (persistHeaderStructureDimensionForSync(block, dims)) saved = true; } catch {}
  try {
    const doc = block.ownerDocument || getDoc({}) || null;
    const win = doc?.defaultView || getWin({ document: doc }) || null;
    const slot = block.closest?.('#st-site-header-slot') || null;
    if (slot && win) {
      const html = cleanHeaderHtmlForDimensionSync(slot);
      if (html && saveHeaderHtmlForDimensionSync(win, html)) saved = true;
    }
  } catch {}
  return saved;
}


function findPersistedTargetIdForElement(el, persistedState = {}) {
  if (!el || !persistedState?.elements) return null;
  const ds = el.dataset || {};
  const candidates = [
    ds.uid,
    ds.hbRef,
    ds.elementId,
    ds.nodeId,
    ds.stId,
    ds.id,
    el.id,
  ].map((item) => String(item || '').trim()).filter(Boolean);
  for (const id of candidates) {
    if (persistedState.elements[id]) return id;
  }
  return null;
}

function syncManualDimensionStylesToRuntimeState(el, context = {}) {
  const win = getWin(context);
  if (!el || win?.__ST_AI_RUNTIME_REHYDRATING__) return false;
  let persistedState = null;
  try { persistedState = loadPersistedAiRuntimeState(context); } catch { return false; }
  const targetId = findPersistedTargetIdForElement(el, persistedState);
  if (!targetId) return false;
  const record = persistedState.elements[targetId];
  if (!record || typeof record !== 'object') return false;

  const width = String(el.style?.width || '').trim();
  const height = String(el.style?.height || '').trim();
  const dims = {};
  if (width) dims.width = width;
  if (height) dims.height = height;
  const savedCanonical = persistCanonicalDimensionSourceForSync(el, dims);

  // Do NOT write width/height/min/max into the AI rehydration state. Size now
  // has one source of truth: main builder/header/footer state + saved HTML.
  const inlineStyles = { ...(record.inlineStyles || {}) };
  let changed = false;
  for (const prop of DIMENSION_INLINE_STYLE_PROPS_FOR_SYNC) {
    if (Object.prototype.hasOwnProperty.call(inlineStyles, prop)) {
      delete inlineStyles[prop];
      changed = true;
    }
  }

  record.inlineStyles = inlineStyles;
  record.dataset = {
    ...(record.dataset || {}),
    ...(el.dataset?.stSizeMode ? { stSizeMode: el.dataset.stSizeMode } : {}),
    ...(el.dataset?.sizeMode ? { sizeMode: el.dataset.sizeMode } : {}),
    ...(el.dataset?.aiRuntimeUnlockedSize ? { aiRuntimeUnlockedSize: el.dataset.aiRuntimeUnlockedSize } : {}),
  };
  record.meta = {
    ...(record.meta || {}),
    manualDimensionSyncedAt: safeNow(),
    manualDimensionSyncSource: 'style_mutation_canonical_dimension_source',
    manualDimensionCanonicalSaved: !!savedCanonical,
    manualDimensionWidth: width || null,
    manualDimensionHeight: height || null,
  };
  persistedState.elements[targetId] = record;
  persistedState.meta = {
    ...(persistedState.meta || {}),
    lastManualDimensionSyncAt: safeNow(),
    lastManualDimensionSyncTargetId: targetId,
  };
  try { savePersistedAiRuntimeState(persistedState, context); } catch { return false; }
  return true;
}

function createDebounced(fn, delay = 90) {
  let timer = null;
  return (...args) => {
    try { if (timer) clearTimeout(timer); } catch {}
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
}

function emit(name, detail = {}, context = {}) {
  const win = getWin(context);
  const doc = getDoc(context);
  try { doc?.dispatchEvent?.(new CustomEvent(name, { detail })); } catch {}
  try { win?.dispatchEvent?.(new CustomEvent(name, { detail })); } catch {}
}

function findObservedRoots(doc) {
  if (!doc) return [];
  const out = [];
  const selectors = ['#site-canvas', '#site-root', '.canvas__scroll', '#main-content'];
  for (const sel of selectors) {
    try {
      const el = doc.querySelector(sel);
      if (el && !out.includes(el)) out.push(el);
    } catch {}
  }
  return out;
}

export function initAiRuntimeRehydrationIntegration(context = {}) {
  const doc = getDoc(context);
  const win = getWin(context);
  if (!doc || !win) {
    return {
      ok: false,
      reason: 'missing_dom',
      scheduleRehydrate: () => ({ ok: false, reason: 'missing_dom' }),
      dispose: () => {},
    };
  }

  if (win.__ST_AI_RUNTIME_REHYDRATION__?.dispose) {
    return win.__ST_AI_RUNTIME_REHYDRATION__;
  }

  const state = {
    initializedAt: safeNow(),
    lastReason: null,
    lastResult: null,
    totalRuns: 0,
    observers: [],
    disposers: [],
  };

  const persistenceContext = {
    document: doc,
    window: win,
    storage: context.storage,
    localStorage: context.localStorage,
  };

  const runRehydrate = (reason = 'manual') => {
    if (!hasPersistedElements(persistenceContext)) {
      const result = {
        ok: true,
        restored: 0,
        skipped: true,
        reason,
        at: safeNow(),
      };
      state.lastReason = reason;
      state.lastResult = result;
      emit('st:ai-runtime-rehydrated', {
        source: 'ai-runtime-rehydration',
        reason,
        restored: 0,
        skipped: true,
      }, persistenceContext);
      return result;
    }

    let result;
    try {
      win.__ST_AI_RUNTIME_REHYDRATING__ = true;
      result = rehydrateAiRuntimeState(persistenceContext);
    } finally {
      try { win.__ST_AI_RUNTIME_REHYDRATING__ = false; } catch {}
    }
    const enriched = {
      ...result,
      reason,
      at: safeNow(),
    };
    state.totalRuns += 1;
    state.lastReason = reason;
    state.lastResult = enriched;
    emit('st:ai-runtime-rehydrated', {
      source: 'ai-runtime-rehydration',
      reason,
      restored: enriched.restored || 0,
      elementCount: enriched.elementCount || 0,
      ok: !!enriched.ok,
    }, persistenceContext);
    return enriched;
  };

  const scheduleRehydrate = createDebounced((reason = 'debounced') => {
    runRehydrate(reason);
  }, Number(context.debounceMs) > 0 ? Number(context.debounceMs) : 90);

  const bind = (target, eventName, reason) => {
    if (!target?.addEventListener) return;
    const handler = () => scheduleRehydrate(reason || eventName);
    target.addEventListener(eventName, handler);
    state.disposers.push(() => {
      try { target.removeEventListener(eventName, handler); } catch {}
    });
  };

  // Не ре-гідруємо AI-стилі при простому виборі елемента.
  // Інакше після AI-зміни старий persisted width/height перебиває ручний ресайз мишкою.
  bind(doc, 'st-page-selected', 'page_selected_document');
  bind(win, 'st-page-selected', 'page_selected_window');
  bind(doc, 'st:page-changed', 'page_changed_document');
  bind(win, 'st:page-changed', 'page_changed_window');
  bind(win, 'st:canvas-apply-snapshot', 'canvas_snapshot_applied');
  bind(doc, 'builder:pageChanged', 'builder_page_changed');
  bind(doc, 'st:ai-runtime-applied', 'runtime_applied');
  bind(doc, 'st:ai-runtime-state-persisted', 'runtime_state_persisted');
  bind(win, 'st:ai-runtime-state-persisted', 'runtime_state_persisted_window');

  if (typeof MutationObserver !== 'undefined') {
    for (const root of findObservedRoots(doc)) {
      try {
        const observer = new MutationObserver((mutations) => {
          const hasStructural = mutations.some((m) => m.type === 'childList' || (m.type === 'attributes' && (m.attributeName === 'id' || String(m.attributeName || '').startsWith('data-'))));
          if (hasStructural) scheduleRehydrate('dom_mutation');
        });
        observer.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['id', 'data-element-id', 'data-node-id', 'data-st-id'],
        });
        state.observers.push(observer);
      } catch {}
    }

    for (const root of findObservedRoots(doc)) {
      try {
        const styleObserver = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type !== 'attributes' || m.attributeName !== 'style') continue;
            const el = m.target && m.target.nodeType === 1 ? m.target : null;
            if (!el) continue;
            syncManualDimensionStylesToRuntimeState(el, persistenceContext);
          }
        });
        styleObserver.observe(root, {
          subtree: true,
          attributes: true,
          attributeFilter: ['style'],
        });
        state.observers.push(styleObserver);
      } catch {}
    }
  }

  const api = {
    ok: true,
    kind: 'ai_runtime_rehydration_integration',
    getState: () => ({
      initializedAt: state.initializedAt,
      lastReason: state.lastReason,
      lastResult: state.lastResult,
      totalRuns: state.totalRuns,
      observerCount: state.observers.length,
    }),
    runNow: (reason = 'manual') => runRehydrate(reason),
    scheduleRehydrate: (reason = 'manual_schedule') => {
      scheduleRehydrate(reason);
      return { ok: true, scheduled: true, reason };
    },
    dispose: () => {
      for (const dispose of state.disposers.splice(0)) {
        try { dispose(); } catch {}
      }
      for (const observer of state.observers.splice(0)) {
        try { observer.disconnect(); } catch {}
      }
      try { delete win.__ST_AI_RUNTIME_REHYDRATION__; } catch {}
    },
  };

  win.__ST_AI_RUNTIME_REHYDRATION__ = api;

  scheduleRehydrate('init');
  try { win.requestAnimationFrame?.(() => scheduleRehydrate('post_raf_init')); } catch {}
  try { setTimeout(() => scheduleRehydrate('post_timeout_init'), 180); } catch {}

  return api;
}
