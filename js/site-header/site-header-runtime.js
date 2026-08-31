// js/site-header/site-header-runtime.js
// 00878: clean Header state renderer.
// One explicit state -> SiteHeader slot path. No DOM observer, timer, DnD,
// geometry normalization, repair loop, compatibility alias or fallback renderer.

import { createHeaderState } from './header-state.js';

const VERSION = '00878-site-header-state-renderer';
const LS_MODE_GLOBAL = 'st_header_mode_global_v1';
const LS_MODE_PAGES = 'st_header_mode_pages_v1';
const LS_HIDDEN = 'st_header_hidden_v1';
const LS_POS = 'st_header_position_v1';

let initialized = false;
let headerState = null;

const HEADER_STATE_KEY = 'st_header_state_v1';

function patchSearchMenuModelNode00878(node) {
  if (!node || typeof node !== 'object') return false;
  let changed = false;
  const attrs = node.attrs && typeof node.attrs === 'object' ? node.attrs : null;
  const nodeId = String(node.id || attrs?.['data-node-id'] || '');
  if (nodeId === 'header_00_container_006') {
    attrs['data-layout-mode'] = 'flex';
    attrs['data-layout-orient'] = 'row';
    node.style = { ...(node.style || {}),
      display: 'flex',
      'flex-direction': 'row',
      'flex-wrap': 'nowrap',
      'align-items': 'center',
      'justify-content': 'center',
      gap: '10px',
    };
    const style = node.style;
    node.styleText = Object.entries(style).map(([key, value]) => `${key}:${value};`).join('');
    changed = true;
  }
  if (nodeId === 'header_00_block_006') {
    node.style = { ...(node.style || {}), width: 'auto', flex: '1 1 280px' };
    const style = node.style;
    node.styleText = Object.entries(style).map(([key, value]) => `${key}:${value};`).join('');
    changed = true;
  }
  for (const child of Array.isArray(node.children) ? node.children : []) {
    if (patchSearchMenuModelNode00878(child)) changed = true;
  }
  return changed;
}

function patchSearchMenuHtml00878(html) {
  const raw = String(html || '');
  if (!raw || !raw.includes('header_00_container_006')) return { html: raw, changed: false };
  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    const container = doc.querySelector('[data-node-id="header_00_container_006"]');
    if (!(container instanceof HTMLElement)) return { html: raw, changed: false };
    const search = container.querySelector(':scope > [data-node-id="header_00_block_006"]');
    const menu = container.querySelector(':scope > .st-block--menu, :scope > [data-block-kind="menu"]');
    if (!(search instanceof HTMLElement) || !(menu instanceof HTMLElement)) return { html: raw, changed: false };

    const alreadyHorizontal = container.dataset.layoutOrient === 'row'
      && container.style.flexDirection === 'row'
      && search.style.flex === '1 1 280px';
    if (alreadyHorizontal) return { html: raw, changed: false };

    container.dataset.layoutMode = 'flex';
    container.dataset.layoutOrient = 'row';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.flexWrap = 'nowrap';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '10px';

    search.style.width = 'auto';
    search.style.minWidth = '0';
    search.style.maxWidth = '100%';
    search.style.flex = '1 1 280px';
    menu.style.flex = menu.style.flex || '0 0 auto';

    return { html: doc.body.innerHTML, changed: true };
  } catch {
    return { html: raw, changed: false };
  }
}

function migrateHeaderSearchMenuContract00878() {
  let state = null;
  try { state = JSON.parse(localStorage.getItem(HEADER_STATE_KEY) || 'null'); } catch {}
  if (!state || typeof state !== 'object') return false;
  let changed = false;
  const entries = [state.global, ...Object.values(state.pages || {})].filter((entry) => entry && typeof entry === 'object');
  for (const entry of entries) {
    const patched = patchSearchMenuHtml00878(entry.html);
    if (patched.changed) {
      entry.html = patched.html;
      entry.savedAt = Date.now();
      entry.migration = '00878-horizontal-search-menu-contract';
      changed = true;
    }
    if (entry.model && patchSearchMenuModelNode00878(entry.model?.root || entry.model)) changed = true;
  }
  if (!changed) return false;
  try { localStorage.setItem(HEADER_STATE_KEY, JSON.stringify(state)); } catch { return false; }
  log('search-menu-contract-migrated', { entries: entries.length });
  return true;
}

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`site-header-runtime:${event}`, payload, level); } catch {}
  try { window.__ST_PERF_DIAG__?.push?.(`site-header-runtime:${event}`, payload, level); } catch {}
}

function currentPageId() {
  const rootId = String(document.getElementById('site-root')?.dataset?.pageId || '').trim();
  if (rootId) return rootId;
  const active = window.ST_PAGES?.getActiveId?.();
  if (typeof active === 'string' && active) return active;
  const hash = String(location.hash || '').replace(/^#/, '').trim();
  return hash ? `page:${hash}` : 'page:default';
}

function getModeMap() {
  const value = safeParse(localStorage.getItem(LS_MODE_PAGES), {});
  return value && typeof value === 'object' ? value : {};
}

function setModeMap(value) {
  try { localStorage.setItem(LS_MODE_PAGES, JSON.stringify(value || {})); } catch {}
}

export function getHeaderMode(pageId = '') {
  const stored = localStorage.getItem(LS_MODE_GLOBAL);
  const globalMode = stored === 'page' ? 'page' : 'global';
  if (!pageId) return globalMode;
  const mode = getModeMap()[String(pageId)];
  return mode === 'page' || mode === 'global' ? mode : globalMode;
}

export function setHeaderMode(mode, pageId = null) {
  const normalized = mode === 'page' ? 'page' : 'global';
  if (!pageId) {
    try { localStorage.setItem(LS_MODE_GLOBAL, normalized); } catch {}
    return normalized;
  }
  const map = getModeMap();
  map[String(pageId)] = normalized;
  setModeMap(map);
  return normalized;
}

export function getHeaderHidden() {
  try { return localStorage.getItem(LS_HIDDEN) === '1'; } catch { return false; }
}

export function setHeaderHidden(hidden) {
  try { localStorage.setItem(LS_HIDDEN, hidden ? '1' : '0'); } catch {}
  return !!hidden;
}

function normalizePosition(position = {}) {
  const value = position && typeof position === 'object' ? position : {};
  const mode = value.mode === 'sticky' || value.mode === 'fixed' ? value.mode : 'normal';
  const top = Number.isFinite(Number(value.top)) ? Math.max(0, Math.min(400, Number(value.top))) : 0;
  const z = Number.isFinite(Number(value.z)) ? Math.max(1, Math.min(5000, Number(value.z))) : 200;
  return { mode, top, z };
}

export function getHeaderPosition() {
  return normalizePosition(safeParse(localStorage.getItem(LS_POS), {}));
}

export function setHeaderPosition(position) {
  const normalized = normalizePosition(position || {});
  try { localStorage.setItem(LS_POS, JSON.stringify(normalized)); } catch {}
  return normalized;
}

function applyPosition(slot) {
  const position = getHeaderPosition();
  slot.style.removeProperty('left');
  slot.style.removeProperty('right');
  slot.style.zIndex = String(position.z);
  if (position.mode === 'sticky' || position.mode === 'fixed') {
    slot.style.position = 'sticky';
    slot.style.top = `${position.top}px`;
  } else {
    slot.style.position = 'relative';
    slot.style.removeProperty('top');
  }
}

function resolveHtml(pageId, mode) {
  const state = headerState?.getState?.() || {};
  const globalHtml = String(state?.global?.html || '');
  if (mode === 'global') return globalHtml;
  const pageHtml = String(state?.pages?.[String(pageId)]?.html || '');
  return pageHtml.trim() ? pageHtml : globalHtml;
}

function sync(reason = 'explicit') {
  const api = window.SiteHeader;
  if (!api || typeof api.ensure !== 'function' || typeof api.setHTML !== 'function' || typeof api.clear !== 'function') {
    log('api-missing', { reason }, 'error');
    return false;
  }
  const slot = api.ensure();
  if (!(slot instanceof HTMLElement)) return false;

  // The live builder edits the same DOM. Do not replace it mid-session.
  if (document.body?.classList?.contains('st-header-builder-on')) {
    applyPosition(slot);
    return true;
  }

  const pageId = currentPageId();
  const mode = getHeaderMode(pageId);
  const hidden = getHeaderHidden();
  const html = hidden ? '' : resolveHtml(pageId, mode);
  if (html.trim()) api.setHTML(html);
  else api.clear();
  applyPosition(slot);
  log('sync', { reason, pageId, mode, hidden, htmlLength: html.length });
  return true;
}

export function initSiteHeaderRuntime() {
  if (initialized && window.SiteHeaderRuntime) return window.SiteHeaderRuntime;
  initialized = true;
  migrateHeaderSearchMenuContract00878();
  headerState = createHeaderState();

  const runtime = Object.freeze({
    version: VERSION,
    sync: (reason = 'api') => sync(reason),
    setMode: (mode, pageId = currentPageId()) => { setHeaderMode(mode, pageId); return sync('set-mode'); },
    getPageId: currentPageId,
    getMode: (pageId = currentPageId()) => getHeaderMode(pageId),
    getHidden: getHeaderHidden,
    setHidden: (hidden) => { setHeaderHidden(hidden); return sync('set-hidden'); },
    getPosition: getHeaderPosition,
    setPosition: (position) => { setHeaderPosition(position); return sync('set-position'); },
    contract: Object.freeze({ observers: 0, timers: 0, retryLoops: 0, dragRuntimes: 0, geometryNormalizers: 0, hashNavigationAuthority: false, authoredLayoutMigration: '00878-horizontal-search-menu-contract' }),
  });
  window.SiteHeaderRuntime = runtime;
  window.ST_SITE_HEADER_RUNTIME_00878 = runtime.contract;

  document.addEventListener('st:page-changed', () => sync('st-page-changed'));
  document.addEventListener('builder:page-changed', () => sync('builder-page-changed'));
  document.addEventListener('st-page-selected', () => sync('st-page-selected'));
  document.addEventListener('st:header-state-changed', () => sync('header-state-changed'));

  sync('boot');
  log('boot', runtime.contract);
  return runtime;
}
