// js/site-footer/site-footer-runtime.js
// 00878: clean Footer state renderer in natural document flow.
// No DOM observer, timer, sticky/fixed engine, DnD, geometry normalization,
// cleanup loop, compatibility alias or fallback renderer.

import { createFooterState } from './footer-state.js';

const VERSION = '00878-site-footer-state-renderer';
const LS_MODE_GLOBAL = 'st_footer_mode_global_v1';
const LS_MODE_PAGES = 'st_footer_mode_pages_v1';
const LS_HIDDEN = 'st_footer_hidden_v1';
const LS_POS = 'st_footer_position_v1';

let initialized = false;
let footerState = null;

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`site-footer-runtime:${event}`, payload, level); } catch {}
  try { window.__ST_PERF_DIAG__?.push?.(`site-footer-runtime:${event}`, payload, level); } catch {}
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

export function getFooterMode(pageId = '') {
  const stored = localStorage.getItem(LS_MODE_GLOBAL);
  const globalMode = stored === 'page' ? 'page' : 'global';
  if (!pageId) return globalMode;
  const mode = getModeMap()[String(pageId)];
  return mode === 'page' || mode === 'global' ? mode : globalMode;
}

export function setFooterMode(mode, pageId = null) {
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

export function getFooterHidden() {
  try { return localStorage.getItem(LS_HIDDEN) === '1'; } catch { return false; }
}

export function setFooterHidden(hidden) {
  try { localStorage.setItem(LS_HIDDEN, hidden ? '1' : '0'); } catch {}
  return !!hidden;
}

export function getFooterPosition() {
  const stored = safeParse(localStorage.getItem(LS_POS), {});
  const z = Number.isFinite(Number(stored?.z)) ? Number(stored.z) : 10;
  return { mode: 'normal', bottom: 0, z };
}

export function setFooterPosition(position = {}) {
  const z = Number.isFinite(Number(position?.z)) ? Number(position.z) : 10;
  const normalized = { mode: 'normal', bottom: 0, z };
  try { localStorage.setItem(LS_POS, JSON.stringify(normalized)); } catch {}
  return normalized;
}

function applyNaturalFlow(slot) {
  const root = document.getElementById('site-root');
  if (root && slot.parentElement === root && root.lastElementChild !== slot) root.append(slot);
  slot.style.position = 'relative';
  slot.style.width = '100%';
  slot.style.flex = '0 0 auto';
  slot.style.removeProperty('top');
  slot.style.removeProperty('right');
  slot.style.removeProperty('bottom');
  slot.style.removeProperty('left');
  slot.style.removeProperty('transform');
  slot.style.removeProperty('will-change');
  slot.style.zIndex = String(getFooterPosition().z);
}

function resolveHtml(pageId, mode) {
  const state = footerState?.getState?.() || {};
  const globalHtml = String(state?.global?.html || '');
  if (mode === 'global') return globalHtml;
  const pageHtml = String(state?.pages?.[String(pageId)]?.html || '');
  return pageHtml.trim() ? pageHtml : globalHtml;
}

function sync(reason = 'explicit') {
  const api = window.SiteFooter;
  if (!api || typeof api.ensure !== 'function' || typeof api.setHTML !== 'function' || typeof api.clear !== 'function') {
    log('api-missing', { reason }, 'error');
    return false;
  }
  const slot = api.ensure();
  if (!(slot instanceof HTMLElement)) return false;

  if (document.body?.classList?.contains('st-footer-builder-on')) {
    applyNaturalFlow(slot);
    return true;
  }

  const pageId = currentPageId();
  const mode = getFooterMode(pageId);
  const hidden = getFooterHidden();
  const html = hidden ? '' : resolveHtml(pageId, mode);
  if (html.trim()) api.setHTML(html);
  else api.clear();
  applyNaturalFlow(slot);
  log('sync', { reason, pageId, mode, hidden, htmlLength: html.length });
  return true;
}

export function initSiteFooterRuntime() {
  if (initialized && window.SiteFooterRuntime) return window.SiteFooterRuntime;
  initialized = true;
  footerState = createFooterState();

  const runtime = Object.freeze({
    version: VERSION,
    sync: (reason = 'api') => sync(reason),
    setMode: (mode, pageId = currentPageId()) => { setFooterMode(mode, pageId); const result = sync('set-mode'); try { document.dispatchEvent(new CustomEvent('st:footer-mode-changed')); } catch {} return result; },
    getPageId: currentPageId,
    getMode: (pageId = currentPageId()) => getFooterMode(pageId),
    getHidden: getFooterHidden,
    setHidden: (hidden) => { setFooterHidden(hidden); return sync('set-hidden'); },
    getPosition: getFooterPosition,
    setPosition: (position) => { setFooterPosition(position); return sync('set-position'); },
    contract: Object.freeze({ observers: 0, timers: 0, retryLoops: 0, dragRuntimes: 0, geometryNormalizers: 0, naturalFlow: true, hashNavigationAuthority: false }),
  });
  window.SiteFooterRuntime = runtime;
  window.ST_SITE_FOOTER_RUNTIME_00878 = runtime.contract;

  document.addEventListener('st:page-changed', () => sync('st-page-changed'));
  document.addEventListener('builder:page-changed', () => sync('builder-page-changed'));
  document.addEventListener('st-page-selected', () => sync('st-page-selected'));
  document.addEventListener('st:footer-state-changed', () => sync('footer-state-changed'));

  sync('boot');
  log('boot', runtime.contract);
  return runtime;
}
