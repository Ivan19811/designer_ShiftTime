// js/design/widgets/menu-builder/menu-builder-runtime.js
// 00877: Menu Builder is a thin scope view over the clean SiteFrame Header mode.
// No MutationObserver, frame retry loop, geometry freeze, cloned DOM or repair code.

import { openHeaderBuilderMode, closeHeaderBuilderMode } from '../../../site-frame/site-frame-builder-mode-00989.js';

const VERSION = '00877-menu-builder-scope';
const TOOLBAR_ID = 'st-header-builder-toolbar';
const LS_SCOPE = 'st_menu_builder_scope_v1';
const ALLOWED = new Set(['menu', 'level', 'section', 'header']);

let activeMenu = null;
let currentMode = '';
let originalToolbarHtml = '';
let originalToolbarClick = null;

function log(event, detail = {}) {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`menu-builder:${event}`, payload, 'info'); } catch {}
}

function ensureStyle() {
  if (document.getElementById('st-menu-builder-scope-style-00877')) return;
  const style = document.createElement('style');
  style.id = 'st-menu-builder-scope-style-00877';
  style.textContent = `
    body.st-menu-builder-on #st-site-header-slot [data-mb-hide="1"] { display: none !important; }
    body.st-menu-builder-on #st-site-header-slot [data-mb-hide-space="1"] {
      visibility: hidden !important;
      pointer-events: none !important;
    }
    body.st-menu-builder-on #st-site-header-slot[data-mb-scope="menu"] [data-mb-keep="1"] { visibility: visible !important; }
  `;
  document.head.appendChild(style);
}

function slot() {
  return document.getElementById('st-site-header-slot');
}

function toolbar() {
  return document.getElementById(TOOLBAR_ID);
}

function clearScope() {
  const host = slot();
  if (!host) return;
  host.removeAttribute('data-mb-scope');
  host.querySelectorAll('[data-mb-hide],[data-mb-hide-space],[data-mb-keep]').forEach((node) => {
    node.removeAttribute('data-mb-hide');
    node.removeAttribute('data-mb-hide-space');
    node.removeAttribute('data-mb-keep');
  });
}

function selectedMenuFallback() {
  try {
    const state = window.ST_SELECTION?.get?.() || {};
    const candidate = state.element || state.el || state.elements?.[0] || null;
    if (candidate instanceof HTMLElement && candidate.closest('#st-site-header-slot')) return candidate;
  } catch {}
  return slot()?.querySelector?.('.st-block--menu,.st-menu,[data-block-role="menu"],[data-block-kind="menu"]') || null;
}

function hideSiblingSections(host, keepSection) {
  Array.from(host?.children || []).forEach((section) => {
    if (!(section instanceof HTMLElement) || !section.matches('.st-section,section')) return;
    if (section === keepSection) section.setAttribute('data-mb-keep', '1');
    else section.setAttribute('data-mb-hide', '1');
  });
}

function hideSiblingRows(section, keepRow) {
  Array.from(section?.children || []).forEach((row) => {
    if (!(row instanceof HTMLElement) || !row.matches('.st-row')) return;
    if (row === keepRow) row.setAttribute('data-mb-keep', '1');
    else row.setAttribute('data-mb-hide', '1');
  });
}

function isolateMenuPath(menu, section) {
  const keep = menu.closest('.st-block') || menu;
  let node = keep;
  while (node instanceof HTMLElement && node !== section) {
    const parent = node.parentElement;
    if (!(parent instanceof HTMLElement)) break;
    Array.from(parent.children).forEach((sibling) => {
      if (!(sibling instanceof HTMLElement) || sibling === node || sibling.classList.contains('st-resize')) return;
      sibling.setAttribute('data-mb-hide-space', '1');
    });
    node.setAttribute('data-mb-keep', '1');
    node = parent;
  }
  keep.setAttribute('data-mb-keep', '1');
}

function normalizedMode(mode) {
  const value = String(mode || '').toLowerCase();
  return ALLOWED.has(value) ? value : 'section';
}

export function setScopeMode(mode, silent = false) {
  const next = normalizedMode(mode);
  if (currentMode === next && !silent) return next;
  clearScope();
  currentMode = next;
  try { localStorage.setItem(LS_SCOPE, next); } catch {}

  const host = slot();
  const menu = activeMenu instanceof HTMLElement && document.contains(activeMenu) ? activeMenu : selectedMenuFallback();
  if (!host || !menu || !host.contains(menu)) {
    host?.setAttribute?.('data-mb-scope', 'header');
    updateToolbar('header');
    return 'header';
  }

  host.setAttribute('data-mb-scope', next);
  const section = menu.closest('.st-section,section');
  const row = menu.closest('.st-row');

  if (next !== 'header' && section) hideSiblingSections(host, section);
  if ((next === 'level' || next === 'menu') && section && row) hideSiblingRows(section, row);
  if (next === 'menu' && section) isolateMenuPath(menu, section);

  updateToolbar(next);
  log('scope', { mode: next });
  return next;
}

function updateToolbar(mode) {
  const tb = toolbar();
  if (!tb) return;
  const labels = { menu: 'Режим: меню', level: 'Режим: рівень', section: 'Режим: секція', header: 'Режим: шапка' };
  const hint = tb.querySelector('[data-mb-hint]');
  if (hint) hint.textContent = labels[mode] || labels.section;
  tb.querySelectorAll('[data-mb-mode]').forEach((button) => {
    button.classList.toggle('is-active', button.getAttribute('data-mb-mode') === mode);
  });
}

function skinToolbar() {
  const tb = toolbar();
  if (!tb) return false;
  originalToolbarHtml = tb.innerHTML;
  originalToolbarClick = tb.onclick;
  tb.innerHTML = `
    <button type="button" class="st-hb__btn" data-mb-back>← Назад</button>
    <div class="st-hb__title">Конструктор меню</div>
    <div class="st-hb__hint" data-mb-hint>Режим: секція</div>
    <div class="st-hb__spacer"></div>
    <div class="st-hb__menu">
      <button type="button" class="st-hb__btn" data-mb-mode="menu">Меню</button>
      <button type="button" class="st-hb__btn" data-mb-mode="level">Рівень</button>
      <button type="button" class="st-hb__btn is-active" data-mb-mode="section">Секція</button>
      <button type="button" class="st-hb__btn" data-mb-mode="header">Шапка</button>
    </div>
  `;
  tb.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const back = event.target instanceof Element ? event.target.closest('[data-mb-back]') : null;
    if (back) return closeMenuBuilder();
    const button = event.target instanceof Element ? event.target.closest('[data-mb-mode]') : null;
    if (button) setScopeMode(button.getAttribute('data-mb-mode'));
  };
  return true;
}

function restoreToolbar() {
  const tb = toolbar();
  if (!tb) return;
  if (originalToolbarHtml) tb.innerHTML = originalToolbarHtml;
  tb.onclick = originalToolbarClick;
  originalToolbarHtml = '';
  originalToolbarClick = null;
}

export function openMenuBuilderForMenuElement(menuEl) {
  ensureStyle();
  activeMenu = menuEl instanceof HTMLElement ? menuEl : selectedMenuFallback();
  openHeaderBuilderMode();
  document.body.classList.add('st-menu-builder-on');
  skinToolbar();
  let initial = 'section';
  try { initial = normalizedMode(localStorage.getItem(LS_SCOPE) || 'section'); } catch {}
  setScopeMode(initial, true);
  log('open', { hasMenu: !!activeMenu, mode: initial });
  return activeMenu;
}

export function closeMenuBuilder() {
  clearScope();
  restoreToolbar();
  document.body.classList.remove('st-menu-builder-on');
  closeHeaderBuilderMode({ reason: 'menu-builder-close-00877' });
  activeMenu = null;
  currentMode = '';
  log('close');
  return true;
}

export const MENU_BUILDER_RUNTIME_00877 = Object.freeze({
  version: VERSION,
  observers: 0,
  timers: 0,
  retryLoops: 0,
  geometryFreeze: false,
  clonedDom: false,
});

window.ST_MENU_BUILDER_RUNTIME_00877 = MENU_BUILDER_RUNTIME_00877;
