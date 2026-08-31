// js/site-frame/site-frame-builder-mode-00989.js
// 00878: one small Header/Footer authoring shell over the live SiteFrame DOM.
// No cloned constructor tree, MutationObserver, retry loop, global drag runtime,
// legacy state, or geometry writes. Selection/resize/persistence remain owned by
// the clean SiteFrame selection, edit-layer, Store and renderer modules.

import { installSiteFrameSlotSelection } from './site-frame-explicit-selection-00989.js?v=00989';

const VERSION = '00878-site-frame-builder-mode';
const AREAS = Object.freeze({
  header: Object.freeze({
    slotId: 'st-site-header-slot',
    otherSlotId: 'st-site-footer-slot',
    bodyClass: 'st-header-builder-on',
    toolbarId: 'st-header-builder-toolbar',
    title: 'Конструктор шапки',
  }),
  footer: Object.freeze({
    slotId: 'st-site-footer-slot',
    otherSlotId: 'st-site-header-slot',
    bodyClass: 'st-footer-builder-on',
    toolbarId: 'st-footer-builder-toolbar',
    title: 'Конструктор футера',
  }),
});

const state = {
  area: '',
  otherSlotSnapshot: null,
};

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`site-frame-builder:${event}`, payload, level); } catch {}
  try { window.__ST_PERF_DIAG__?.push?.(`site-frame-builder:${event}`, payload, level); } catch {}
}

function normalizeArea(area) {
  return String(area || '').toLowerCase() === 'footer' ? 'footer' : 'header';
}

function configOf(area) {
  return AREAS[normalizeArea(area)];
}

function slotOf(area) {
  return document.getElementById(configOf(area).slotId);
}

function ensureStyle() {
  if (document.getElementById('st-site-frame-builder-style-00878')) return;
  const style = document.createElement('style');
  style.id = 'st-site-frame-builder-style-00878';
  style.textContent = `
    .st-site-frame-builder-toolbar {
      position: sticky;
      top: 0;
      z-index: 10040;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: 48px;
      padding: 8px 12px;
      box-sizing: border-box;
      background: rgba(15, 23, 42, .96);
      color: #fff;
      border-bottom: 1px solid rgba(255,255,255,.14);
      box-shadow: 0 8px 22px rgba(15,23,42,.16);
    }
    .st-site-frame-builder-toolbar .st-hb__title { font-weight: 750; }
    .st-site-frame-builder-toolbar .st-hb__hint { opacity: .72; font-size: 12px; }
    .st-site-frame-builder-toolbar .st-hb__spacer { flex: 1 1 auto; }
    .st-site-frame-builder-toolbar .st-hb__menu { display: flex; gap: 6px; align-items: center; }
    .st-site-frame-builder-toolbar .st-hb__btn {
      appearance: none;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px;
      background: rgba(255,255,255,.09);
      color: inherit;
      padding: 7px 10px;
      cursor: pointer;
      font: inherit;
      line-height: 1;
    }
    .st-site-frame-builder-toolbar .st-hb__btn:hover,
    .st-site-frame-builder-toolbar .st-hb__btn.is-active { background: rgba(59,130,246,.72); }
    body.st-header-builder-on #st-site-header-slot,
    body.st-footer-builder-on #st-site-footer-slot { position: relative; }
    body.st-header-builder-on #st-site-header-slot > .hb-panel,
    body.st-header-builder-on #st-site-header-slot > .fb-panel,
    body.st-footer-builder-on #st-site-footer-slot > .hb-panel,
    body.st-footer-builder-on #st-site-footer-slot > .fb-panel { display: none !important; }
  `;
  document.head.appendChild(style);
}

function clearBuilderPanels(slot) {
  if (!(slot instanceof HTMLElement)) return;
  slot.querySelectorAll(':scope > .hb-panel, :scope > .fb-panel').forEach((panel) => panel.remove());
}

function installSlotSelection(area) {
  const slot = slotOf(area);
  return installSiteFrameSlotSelection(area, slot);
}

function removeAllToolbars() {
  Object.values(AREAS).forEach(({ toolbarId }) => document.getElementById(toolbarId)?.remove());
}

function makeToolbar(area) {
  const cfg = configOf(area);
  const toolbar = document.createElement('div');
  toolbar.id = cfg.toolbarId;
  toolbar.className = 'st-site-frame-builder-toolbar';
  toolbar.dataset.siteFrameArea = normalizeArea(area);
  toolbar.innerHTML = `
    <button type="button" class="st-hb__btn" data-sf-builder-close>← Назад</button>
    <div class="st-hb__title">${cfg.title}</div>
    <div class="st-hb__hint">Живий SiteFrame · JSON Store</div>
    <div class="st-hb__spacer"></div>
    <button type="button" class="st-hb__btn" data-sf-builder-close>Готово</button>
  `;
  toolbar.addEventListener('click', (event) => {
    const close = event.target instanceof Element ? event.target.closest('[data-sf-builder-close]') : null;
    if (!close) return;
    event.preventDefault();
    event.stopPropagation();
    closeBuilderMode(area);
  });
  return toolbar;
}

function placeToolbar(area) {
  removeAllToolbars();
  const slot = slotOf(area);
  const toolbar = makeToolbar(area);
  const canvasHeader = document.querySelector('.canvas__header, .builder__canvas-header');
  if (canvasHeader instanceof HTMLElement) canvasHeader.after(toolbar);
  else if (slot?.parentElement) slot.parentElement.insertBefore(toolbar, slot);
  else document.body.prepend(toolbar);
  return toolbar;
}

function hideOpposite(area) {
  const other = document.getElementById(configOf(area).otherSlotId);
  if (!(other instanceof HTMLElement)) return;
  state.otherSlotSnapshot = {
    id: other.id,
    hidden: other.hasAttribute('hidden'),
    display: other.style.display,
  };
  other.setAttribute('hidden', '');
  other.style.display = 'none';
}

function restoreOpposite() {
  const snapshot = state.otherSlotSnapshot;
  state.otherSlotSnapshot = null;
  if (!snapshot?.id) return;
  const other = document.getElementById(snapshot.id);
  if (!(other instanceof HTMLElement)) return;
  if (snapshot.hidden) other.setAttribute('hidden', '');
  else other.removeAttribute('hidden');
  other.style.display = snapshot.display || '';
}

function clearBodyModeClasses() {
  document.body?.classList?.remove(
    'st-header-builder-on',
    'st-footer-builder-on',
    'st-header-builder-preview',
    'st-footer-builder-preview',
    'st-hb-design-on',
    'st-hb-insert-on',
    'st-hb-text-only-on',
    'st-mb-solo-menu'
  );
}

export function openBuilderMode(area) {
  const normalized = normalizeArea(area);
  if (state.area === normalized) return slotOf(normalized);
  if (state.area) closeBuilderMode(state.area, { persist: true, reason: 'switch-area' });

  ensureStyle();
  const slot = slotOf(normalized) || window[normalized === 'footer' ? 'SiteFooter' : 'SiteHeader']?.ensure?.();
  if (!(slot instanceof HTMLElement)) return null;

  clearBuilderPanels(slot);
  clearBodyModeClasses();
  document.body.classList.add(configOf(normalized).bodyClass);
  state.area = normalized;
  hideOpposite(normalized);
  placeToolbar(normalized);
  installSlotSelection(normalized);
  try { window.ST_SITE_FRAME_EDIT_LAYER_00882?.scanTree?.(); } catch {}
  try { slot.scrollIntoView?.({ block: 'start', behavior: 'auto' }); } catch {}
  log('open', { area: normalized, toolbarId: configOf(normalized).toolbarId });
  return slot;
}

export function closeBuilderMode(area = state.area, options = {}) {
  const normalized = normalizeArea(area || state.area || 'header');
  const wasOpen = state.area === normalized || document.body?.classList?.contains(configOf(normalized).bodyClass);
  if (!wasOpen) return false;

  if (options.persist !== false) {
    try {
      window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.(
        normalized,
        String(options.reason || 'site-frame-builder-close-00878')
      );
    } catch {}
  }
  clearBuilderPanels(slotOf(normalized));
  removeAllToolbars();
  restoreOpposite();
  clearBodyModeClasses();
  state.area = '';
  try { window[normalized === 'footer' ? 'SiteFooterRuntime' : 'SiteHeaderRuntime']?.sync?.(); } catch {}
  log('close', { area: normalized, persisted: options.persist !== false });
  return true;
}

export function openHeaderBuilderMode() { return openBuilderMode('header'); }
export function closeHeaderBuilderMode(options = {}) { return closeBuilderMode('header', options); }
export function openFooterBuilderMode() { return openBuilderMode('footer'); }
export function closeFooterBuilderMode(options = {}) { return closeBuilderMode('footer', options); }

export const SITE_FRAME_BUILDER_MODE_00878 = Object.freeze({
  version: VERSION,
  observers: 0,
  timers: 0,
  retryLoops: 0,
  globalPointerListeners: 0,
  clonedConstructorTree: false,
  legacyState: false,
  geometryWrites: 0,
});

try {
  window.ST_SITE_FRAME_BUILDER_MODE_00878 = Object.freeze({
    ...SITE_FRAME_BUILDER_MODE_00878,
    open: openBuilderMode,
    close: closeBuilderMode,
    getArea: () => state.area,
  });
} catch {}
