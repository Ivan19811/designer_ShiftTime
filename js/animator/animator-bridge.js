// js/animator/animator-bridge.js
// Minimal integration bridge: Preview Orion dock + sync with Builder "Text".
// PREVIEW-GRID-ORION-2026

import { initPreviewOrion } from '../../widgets/preview-orion/preview-orion.js';
import { renderTracks } from '../../widgets/animator-orion/timeline/render-tracks.js';
import { createStore } from '../../widgets/animator-orion/core/store.js';
import { reducer, initialState } from '../../widgets/animator-orion/core/reducer.js';

let _previewApi = null;
let _syncingFromPreview = false;
let _syncingFromBuilder = false;

let _timelineStore = null;
let _timelineMounted = false;

function buildTimelineRuler_(){
  // Keep name for compatibility: this now mounts the ORIGINAL Animator timeline UI.
  if (_timelineMounted) return;
  const mount = document.getElementById('st-animator-timelineMount');
  if (!mount) return;

  // Clean mount to avoid duplicates on hot-reload.
  mount.innerHTML = '';

  if (!_timelineStore){
    _timelineStore = createStore(reducer, initialState);
  }

  // renderTracks expects an object payload.
  renderTracks({
    mountEl: mount,
    store: _timelineStore,
    t: (k) => k,
  });
  _timelineMounted = true;
}
let _installed = false;
let _dockTimelineReady = false;

function initDockTimelineResizer_(){
  if (_dockTimelineReady) return;
  const dock = document.getElementById('st-animator-dock');
  const resizer = document.getElementById('st-animator-timeline-resizer');
  const timeline = document.getElementById('st-animator-timeline');
  if (!dock || !resizer || !timeline) return;

  _dockTimelineReady = true;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const getTimelineH = () => {
    const raw = getComputedStyle(dock).getPropertyValue('--st-animator-timeline-h').trim();
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 260;
  };

  const setTimelineH = (h) => {
    dock.style.setProperty('--st-animator-timeline-h', `${Math.round(h)}px`);
  };

  // default
  setTimelineH(getTimelineH());

  let startY = 0;
  let startH = 0;
  let dragging = false;

  const onMove = (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    // dragging down => taller timeline
    // UX: dragging divider UP should increase timeline height.
    // So height grows when dy is negative.
    const next = startH - dy;
    const dockH = dock.getBoundingClientRect().height || 0;
    const minH = 140;
    const maxH = Math.max(minH, dockH - 160);
    setTimelineH(clamp(next, minH, maxH));
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('st-animator-resizing');
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
  };

  resizer.addEventListener('pointerdown', (e) => {
    // only left click / primary pointer
    if (e.button !== 0) return;
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startH = getTimelineH();
    document.body.classList.add('st-animator-resizing');
    try { resizer.setPointerCapture(e.pointerId); } catch {}
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  });
}

function getActiveTextBlock_(){
  const root = document.getElementById('site-root');
  if (!root) return null;
  const active = root.querySelector('.st-block.is-active');
  if (!active) return null;
  // detect text block
  if (active.classList?.contains('st-block--text') || active.dataset?.blockKind === 'text') return active;
  return null;
}

function getTextFromBlock_(blockEl){
  const ed = blockEl?.querySelector?.(':scope > .st-text-edit');
  const raw = ed ? (ed.innerText || ed.textContent || '') : (blockEl.innerText || '');
  return String(raw || '').trim();
}

function ensureGrid_(){
  if (!_previewApi) return;
  try { _previewApi.createGrid(); } catch {}
}

function ensureTextObjFromBlock_(blockEl){
  if (!_previewApi || !blockEl) return;
  const id = blockEl.dataset.uid;
  if (!id) return;
  ensureGrid_();
  const text = getTextFromBlock_(blockEl) || 'Текст';
  try { _previewApi.createTextObject({ id, text, u: 0.35, v: 0.55 }); } catch {}
  try { _previewApi.layObjectOnGrid(id); } catch {}
  try { _previewApi.selectObject?.(id); } catch {}
}

function hookAddText_(){
  if (window.__ST_ANIMATOR_ADD_TEXT_HOOKED__) return;
  window.__ST_ANIMATOR_ADD_TEXT_HOOKED__ = true;

  const orig = window.ST_ADD_TEXT;
  if (typeof orig !== 'function') return;

  window.ST_ADD_TEXT = function(...args){
    const res = orig.apply(this, args);
    // after DOM sync and selection updates
    setTimeout(() => {
      const b = getActiveTextBlock_();
      if (!b) return;
      ensureTextObjFromBlock_(b);
    }, 0);
    return res;
  };
}

function hookSelectionSync_(){
  if (window.__ST_ANIMATOR_SELECTION_SYNC__) return;
  window.__ST_ANIMATOR_SELECTION_SYNC__ = true;

  // 1) When builder selection changes -> select corresponding preview object (if exists)
  document.addEventListener('st:selection-changed', (ev) => {
    if (!_previewApi) return;
    if (_syncingFromPreview) return;
    const sel = ev?.detail;
    const el = sel?.elements?.[0];
    if (!el) return;
    const isText = el.classList?.contains('st-block--text') || el.dataset?.blockKind === 'text';
    if (!isText) return;
    const id = el.dataset?.uid;
    if (!id) return;
    try {
      _syncingFromBuilder = true;
      _previewApi.selectObject?.(id);
    } catch {}
    finally {
      queueMicrotask(() => { _syncingFromBuilder = false; });
    }
  });

  // 2) When preview selects object -> set builder selection
  window.addEventListener('st:animator-object-selected', (ev) => {
    if (_syncingFromBuilder) return;
    const id = ev?.detail?.objectId;
    if (!id) return;
    const root = document.getElementById('site-root');
    const block = root?.querySelector?.(`.st-block[data-uid="${CSS.escape(id)}"]`);
    if (!block) return;
    if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
      try {
        _syncingFromPreview = true;
        window.ST_SELECTION.setSingle(block, { type: 'block' });
      } catch {}
      finally {
        queueMicrotask(() => { _syncingFromPreview = false; });
      }
    }
  });

  // 3) When text is edited in builder -> update preview text (best-effort)
  const root = document.getElementById('site-root');
  if (root){
    root.addEventListener('input', (ev) => {
      if (!_previewApi) return;
      const t = ev.target;
      if (!t || !t.classList?.contains('st-text-edit')) return;
      const block = t.closest('.st-block');
      if (!block) return;
      const id = block.dataset?.uid;
      if (!id) return;
      const text = String(t.innerText || t.textContent || '').trim();
      try { _previewApi.setObjectText?.(id, text); } catch {}
    }, true);
  }
}

function hookDockUi_(){
  const dock = document.getElementById('st-animator-dock');
  const btn = document.getElementById('st-animator-dock-toggle');
  if (!dock || !btn) return;
  if (btn.__st_bound__) return;
  btn.__st_bound__ = true;

  btn.addEventListener('click', () => {
    dock.classList.toggle('is-collapsed');
    btn.textContent = dock.classList.contains('is-collapsed') ? 'Розгорнути' : 'Згорнути';
  });
}

function hookOpenAnimatorEvent_(){
  if (window.__ST_ANIMATOR_OPEN_EVENT__) return;
  window.__ST_ANIMATOR_OPEN_EVENT__ = true;

  window.addEventListener('st:open-animator', () => {
    // 1) Enable "Animator mode" in Builder: hide sidebars/canvas, keep only top header.
    try {
      document.body.classList.add('st-animator-mode');
      const hdr = document.querySelector('.builder__header');
      if (hdr) {
        const h = Math.round(hdr.getBoundingClientRect().height || 0);
        if (h > 0) document.documentElement.style.setProperty('--st-builder-header-h', `${h}px`);
      }
    } catch {}

    const dock = document.getElementById('st-animator-dock');
    const btn = document.getElementById('st-animator-dock-toggle');
    if (dock) {
      dock.classList.remove('is-collapsed');
      // мʼяко підсвітимо/піднімемо вгору
      try { dock.scrollIntoView({ block: 'end', inline: 'end', behavior: 'smooth' }); } catch {}
    }
    if (btn) btn.textContent = 'Згорнути';

    // 2) Timeline (bottom) + resizer: має бути доступний у full Animator mode.
    try { initDockTimelineResizer_(); } catch {}
    try { buildTimelineRuler_(); } catch {}

    // Другий прохід після того як браузер вставить/переміряє DOM.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try { initDockTimelineResizer_(); } catch {}
        try { buildTimelineRuler_(); } catch {}
      });
    });

    // Якщо зараз вибраний текст-блок — одразу синхронізуємо.
    try { window.ST_ANIMATOR?.ensureFromActiveText?.(); } catch {}
  });

  // Optional: allow exiting Animator mode with Esc
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!document.body.classList.contains('st-animator-mode')) return;
    document.body.classList.remove('st-animator-mode');
  });
}

export function initAnimatorBridge(){
  if (_installed) return;
  _installed = true;

  const mountEl = document.getElementById('st-animator-mount');
  if (!mountEl) {
    console.warn('[animator-bridge] mount not found');
    return;
  }

  // init Preview Orion
  try {
    _previewApi = initPreviewOrion({ mountEl });
  } catch (e) {
    console.warn('[animator-bridge] initPreviewOrion error', e);
    return;
  }

  // expose minimal global api (optional)
  window.ST_ANIMATOR = {
    get api(){ return _previewApi; },
    ensureFromActiveText(){
      const b = getActiveTextBlock_();
      if (b) ensureTextObjFromBlock_(b);
    },
  };

  hookDockUi_();
  // IMPORTANT: timeline UI is separate from preview.
  // We must init the ORIGINAL timeline once the dock markup exists.
  try {
    if (typeof initAnimatorTimelineOriginal === 'function') initAnimatorTimelineOriginal();
    else console.warn('[animator-bridge] timeline init skipped: initAnimatorTimelineOriginal is not available');
  } catch (e) { console.warn('[animator-bridge] timeline init error', e); }
  hookOpenAnimatorEvent_();
  hookAddText_();
  hookSelectionSync_();
}
