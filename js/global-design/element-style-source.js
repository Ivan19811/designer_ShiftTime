// js/global-design/element-style-source.js
// 00914: live border/radius/shadow inputs are not style-source commits; final change still marks Design.
// [00694] Єдине джерело правди для стилю вибраного елемента:
// Глобально / AI / Дизайн. Працює однаково у Дизайн, AI Дизайн і Глобальний дизайн.

import { GlobalStyleStore } from './style-store.js';

const SOURCES = ['global', 'ai', 'design'];
const SOURCE_LABELS = { global: 'Глобально', ai: 'AI', design: 'Дизайн' };
const SOURCE_NOTES = {
  global: 'Елемент бере стиль з активної глобальної теми. Повторний вибір готової теми знову змінить цей елемент.',
  ai: 'Елемент бере останній збережений AI-стиль.',
  design: 'Елемент має ручний стиль з інспектора Дизайн і не перефарбовується готовою темою, поки не повернути Глобально.'
};
const PANEL_IDS = ['design-panel-root', 'ai-design-panel-root', 'global-design-panel-root'];
const CLEAN_PROPS = [
  'background', 'background-color', 'background-image', 'background-size', 'background-position', 'background-repeat',
  'opacity', 'filter', 'box-shadow', 'color',
  'border', 'border-color', 'border-width', 'border-style',
  'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'
];
const CLEAN_VARS = [
  '--st-bgfx-bg', '--st-bgfx-bg-opacity', '--st-bgfx-bg-size', '--st-bgfx-bg-pos', '--st-bgfx-bg-pos-x', '--st-bgfx-bg-pos-y',
  '--st-bgfx-gray', '--st-bgfx-filter', '--st-bgfx-filter-opacity',
  '--st-menu-block-bg', '--st-menu-block-border-color', '--st-menu-item-bg', '--st-menu-item-bc', '--st-menu-item-bw', '--st-menu-link-color',
  '--st-icon-bg', '--st-icon-bc', '--st-icon-radius', '--st-icon-shadow',
  '--site-block-brd'
];

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function normalizeSource_(source) {
  const s = String(source || '').trim();
  return SOURCES.includes(s) ? s : 'global';
}
function log00694_(event, detail = {}, level = 'info') {
  try { window.__ST_PERF_DIAG__?.push?.(event, Object.assign({ widget: 'element-style-source' }, detail || {}), level); } catch (_) {}
  try { console.info('[00694][element-style-source]', event, detail || {}); } catch (_) {}
}
function selectedElements_() {
  try {
    const sel = window.ST_SELECTION?.get?.();
    const arr = Array.isArray(sel?.elements) ? sel.elements : (sel?.element ? [sel.element] : []);
    return arr.filter((el) => el instanceof HTMLElement && el.isConnected && !el.closest?.('.hb-panel,.fb-panel,.builder__settings-sidebar'));
  } catch (_) {}
  try {
    return Array.from(document.querySelectorAll('#st-site-header-slot .hb-dom-active,#st-site-header-slot .is-active,#st-site-footer-slot .hb-dom-active,#st-site-footer-slot .is-active,#site-root .is-active,#site-root .is-selected'))
      .filter((el) => el instanceof HTMLElement && el.isConnected && !el.closest?.('.hb-panel,.fb-panel,.builder__settings-sidebar'));
  } catch (_) {}
  return [];
}
function primarySelectedElement_() {
  return selectedElements_()[0] || null;
}
function nodeType_(el) {
  if (!el) return '';
  const t = String(el.getAttribute?.('data-hf-node-type') || el.getAttribute?.('data-st-node') || '').toLowerCase();
  if (t) return t;
  if (el.classList?.contains('st-section')) return 'section';
  if (el.classList?.contains('st-row')) return 'level';
  if (el.classList?.contains('st-block')) return 'block';
  return String(el.tagName || '').toLowerCase();
}
function nodeLabel_(el) {
  const t = nodeType_(el);
  if (t === 'section') return 'Секція';
  if (t === 'level' || t === 'row') return 'Рівень';
  if (t === 'container') return 'Контейнер';
  if (t === 'block') {
    if (el.classList?.contains('st-block--menu')) return 'Блок меню';
    if (el.classList?.contains('st-block--button')) return 'Кнопка';
    if (el.classList?.contains('st-block--text')) return 'Текст';
    if (el.classList?.contains('st-block--logo')) return 'Лого';
    return 'Блок';
  }
  return t || 'Елемент';
}
function scopeOf_(el) {
  if (el?.closest?.('#st-site-footer-slot,.st-site-footer-slot')) return 'footer';
  if (el?.closest?.('#st-site-header-slot,.st-site-header-slot')) return 'header';
  if (el?.closest?.('#site-root')) return 'main';
  return '';
}
function readElementSource_(el) {
  const explicit = normalizeSource_(el?.dataset?.stStyleSource || el?.getAttribute?.('data-st-style-source') || '');
  if (el && (el.dataset?.stStyleSource || el.getAttribute?.('data-st-style-source'))) return explicit;
  const style = el?.getAttribute?.('style') || '';
  // [00696] Tokenized JSON Header/Footer templates have inline styles with CSS variables.
  // They are still GLOBAL, not manual Design overrides. Otherwise the source switcher
  // would show every fresh JSON node as "Дизайн" before the user changes anything.
  if (/var\(--st-gd-|var\(--st-color-|var\(--st-button-/i.test(style)
    || el?.hasAttribute?.('data-st-global-style-test')
    || el?.closest?.('[data-st-global-style-root="1"],[data-st-global-style-test="1"]')) return 'global';
  // Якщо елемент уже має явні inline-стилі від старого Дизайну — показуємо Дизайн,
  // щоб було видно, чому готова тема його не міняє.
  if (/background|--st-bgfx|border|box-shadow|color/i.test(style) || el?.classList?.contains('st-bgfx')) return 'design';
  return 'global';
}
function clearLocalVisualStyles_(el) {
  if (!(el instanceof HTMLElement)) return;
  try { el.classList.remove('st-bgfx', 'st-bgfx--canvasfixed'); } catch (_) {}
  CLEAN_PROPS.forEach((prop) => { try { el.style.removeProperty(prop); } catch (_) {} });
  CLEAN_VARS.forEach((prop) => { try { el.style.removeProperty(prop); } catch (_) {} });
  try { delete el.dataset.stFillMode; } catch (_) {}
  try { delete el.dataset.stGalleryItemId; delete el.dataset.stGalleryFolderId; delete el.dataset.stGalleryCategory; } catch (_) {}
}
function applyLocalVarsForSource_(el, source) {
  if (!(el instanceof HTMLElement)) return;
  const src = normalizeSource_(source);
  if (src === 'global') {
    // Global не тримає локальних змінних, щоб повторний вибір теми одразу керував елементом.
    Object.keys(GlobalStyleStore.varsForSource('global') || {}).forEach((key) => {
      try { el.style.removeProperty(key); } catch (_) {}
    });
    return;
  }
  const vars = GlobalStyleStore.varsForSource(src) || {};
  Object.entries(vars).forEach(([key, value]) => {
    try { el.style.setProperty(key, String(value)); } catch (_) {}
  });
}
function applyTokenStyleToElement_(el, source) {
  if (!(el instanceof HTMLElement)) return;
  const src = normalizeSource_(source);
  const type = nodeType_(el);
  const scope = scopeOf_(el);
  const isFooter = scope === 'footer';
  const sectionBg = isFooter ? 'var(--st-gd-footer-bg,var(--st-gd-header-bg,var(--st-gd-color-surface,#ffffff)))' : 'var(--st-gd-header-bg,var(--st-gd-color-surface,#ffffff))';
  const sectionAlt = isFooter ? 'var(--st-gd-footer-alt-bg,var(--st-gd-header-alt-bg,var(--st-gd-color-surface-2,#f8fafc)))' : 'var(--st-gd-header-alt-bg,var(--st-gd-color-surface-2,#f8fafc))';
  const text = isFooter ? 'var(--st-gd-footer-text,var(--st-gd-color-text,#111827))' : 'var(--st-gd-color-text,#111827)';

  applyLocalVarsForSource_(el, src);

  if (type === 'section') {
    el.style.background = sectionBg;
    el.style.color = text;
    el.style.border = isFooter ? 'var(--st-gd-footer-border,var(--st-gd-block-border,1px solid var(--st-gd-color-border,#e2e8f0)))' : '0';
    el.style.borderRadius = isFooter ? 'var(--st-gd-footer-radius,var(--st-gd-radius-lg,24px))' : '0px';
    el.style.boxShadow = isFooter ? 'var(--st-gd-footer-shadow,var(--st-gd-shadow-soft,none))' : 'var(--st-gd-shadow-soft,none)';
  } else if (type === 'level' || type === 'row') {
    el.style.background = sectionAlt;
    el.style.color = text;
    el.style.borderColor = 'var(--st-gd-color-border,#e2e8f0)';
  } else if (type === 'container') {
    el.style.background = 'transparent';
    el.style.color = 'inherit';
    el.style.border = '0';
    el.style.boxShadow = 'none';
  } else if (type === 'block') {
    if (el.classList?.contains('st-block--button')) {
      el.style.background = 'var(--st-gd-button-bg,var(--st-button-fill,#2563eb))';
      el.style.color = 'var(--st-gd-button-text,var(--st-button-fg,#ffffff))';
      el.style.border = 'var(--st-gd-button-border,var(--st-button-border,1px solid rgba(255,255,255,.18)))';
      el.style.borderRadius = 'var(--st-gd-radius-pill,var(--st-button-radius,999px))';
      el.style.boxShadow = 'var(--st-gd-button-shadow,var(--st-gd-shadow-soft,none))';
    } else if (el.classList?.contains('st-block--menu') || el.matches?.('[data-st-menu="1"]')) {
      el.style.color = text;
      el.style.background = 'transparent';
      el.style.setProperty('--st-menu-link-color', text);
      el.style.setProperty('--st-menu-item-bg', 'var(--st-gd-accent-soft,rgba(14,165,233,.10))');
      el.style.setProperty('--st-menu-item-bc', 'var(--st-gd-accent-border,rgba(14,165,233,.24))');
      el.style.setProperty('--st-menu-radius', isFooter ? 'var(--st-gd-radius-md,16px)' : 'var(--st-gd-radius-pill,999px)');
    } else {
      el.style.background = 'var(--st-gd-block-bg,var(--st-gd-color-surface,#ffffff))';
      el.style.color = text;
      el.style.border = 'var(--st-gd-block-border,1px solid var(--st-gd-color-border,#e2e8f0))';
      el.style.borderRadius = 'var(--st-gd-radius-md,16px)';
      el.style.boxShadow = 'var(--st-gd-shadow-soft,none)';
    }
  }
  try { el.style.overflow = 'visible'; } catch (_) {}
}
function setSourceForElements_(elements, source, reason = 'manual') {
  const src = normalizeSource_(source);
  const safe = (elements || []).filter((el) => el instanceof HTMLElement && el.isConnected);
  safe.forEach((el) => {
    el.dataset.stStyleSource = src;
    el.setAttribute('data-st-style-source', src);
    if (src === 'global') {
      clearLocalVisualStyles_(el);
      // Якщо старий віджет фарбував внутрішній шар — чистимо і його, але не чіпаємо текст/фото.
      const inner = el.querySelector?.(':scope > .st-section-inner, :scope > .st-block-inner');
      if (inner) clearLocalVisualStyles_(inner);
    }
    applyTokenStyleToElement_(el, src);
  });
  try { window.ST_HISTORY?.capture?.(`element-style-source-${src}`); } catch (_) {}
  try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: `element-style-source:${src}:${reason}`, draft: false, forceContent: false }); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('st:element-style-source-changed', { detail: { source: src, elements: safe, reason } })); } catch (_) {}
  log00694_('element-style-source-set-00694', { source: src, count: safe.length, reason });
  refreshAllBars_();
}
function markDesignForElements_(elements, reason = 'design-edit') {
  const safe = (elements || []).filter((el) => el instanceof HTMLElement && el.isConnected);
  if (!safe.length) return;
  safe.forEach((el) => {
    if (readElementSource_(el) !== 'design') {
      el.dataset.stStyleSource = 'design';
      el.setAttribute('data-st-style-source', 'design');
    }
  });
  try { document.dispatchEvent(new CustomEvent('st:element-style-source-changed', { detail: { source: 'design', elements: safe, reason } })); } catch (_) {}
  log00694_('element-style-source-auto-design-00694', { count: safe.length, reason });
  refreshAllBars_();
}
function injectCss_() {
  if (document.getElementById('st-element-style-source-css-00694')) return;
  const style = document.createElement('style');
  style.id = 'st-element-style-source-css-00694';
  style.textContent = `
    .st-element-source-bar{margin:0 0 12px;border:1px solid rgba(34,211,238,.24);border-radius:18px;background:linear-gradient(135deg,rgba(15,23,42,.82),rgba(8,47,73,.42));box-shadow:0 18px 44px rgba(14,165,233,.10);overflow:hidden;color:#e5edf7;font-family:Inter,Manrope,Arial,sans-serif;}
    .st-element-source-bar__top{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(148,163,184,.16);}
    .st-element-source-bar__title{display:flex;align-items:center;gap:8px;font-weight:1000;font-size:13px;letter-spacing:.02em;}
    .st-element-source-bar__tab{border:1px solid rgba(56,189,248,.36);border-radius:999px;background:rgba(56,189,248,.13);color:#e0f2fe;font-size:11px;font-weight:1000;padding:5px 10px;}
    .st-element-source-bar__body{padding:10px 12px;display:flex;flex-direction:column;gap:8px;}
    .st-element-source-selected{font-size:11px;color:#aebbd0;font-weight:750;line-height:1.35;}
    .st-element-source-selected b{color:#f8fafc;font-weight:1000;}
    .st-element-source-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
    .st-element-source-btn{border:1px solid rgba(148,163,184,.22);border-radius:13px;background:rgba(2,6,23,.42);color:#cbd5e1;font-size:11px;font-weight:1000;padding:9px 7px;cursor:pointer;}
    .st-element-source-btn:hover{border-color:rgba(56,189,248,.55);background:rgba(56,189,248,.12);color:#f8fafc;}
    .st-element-source-btn.is-active[data-st-source="global"]{background:rgba(14,165,233,.22);border-color:rgba(56,189,248,.68);color:#bae6fd;box-shadow:0 0 0 3px rgba(56,189,248,.10);}
    .st-element-source-btn.is-active[data-st-source="ai"]{background:rgba(168,85,247,.20);border-color:rgba(192,132,252,.68);color:#e9d5ff;box-shadow:0 0 0 3px rgba(168,85,247,.10);}
    .st-element-source-btn.is-active[data-st-source="design"]{background:rgba(249,115,22,.22);border-color:rgba(251,146,60,.70);color:#fed7aa;box-shadow:0 0 0 3px rgba(249,115,22,.10);}
    .st-element-source-btn:disabled{opacity:.42;cursor:not-allowed;}
    .st-element-source-note{font-size:10.5px;color:#8ea0b8;line-height:1.35;font-weight:700;min-height:28px;}
    .st-element-source-separator{height:1px;background:linear-gradient(90deg,transparent,rgba(56,189,248,.50),transparent);margin:1px 0;}
  `;
  document.head.appendChild(style);
}
function barHtml_(panelId) {
  return `
    <div class="st-element-source-bar" data-st-element-source-bar="${esc(panelId)}">
      <div class="st-element-source-bar__top">
        <div class="st-element-source-bar__title"><span>Стилі</span></div>
        <button class="st-element-source-bar__tab" type="button" disabled>Налаштування</button>
      </div>
      <div class="st-element-source-bar__body">
        <div class="st-element-source-selected" data-st-source-selected>Виберіть елемент у шапці, футері .</div>
        <div class="st-element-source-separator"></div>
        <div class="st-element-source-buttons">
          ${SOURCES.map((src) => `<button class="st-element-source-btn" type="button" data-st-source="${src}">${esc(SOURCE_LABELS[src])}</button>`).join('')}
        </div>
        <div class="st-element-source-note" data-st-source-note>${esc(SOURCE_NOTES.global)}</div>
      </div>
    </div>`;
}
function ensureBarForPanel_(panelId) {
  const root = document.getElementById(panelId);
  if (!root) return null;
  let bar = root.querySelector(':scope > [data-st-element-source-bar]');
  if (bar) return bar;
  const title = root.querySelector(':scope > .builder__panel-title, :scope > h2');
  const tpl = document.createElement('div');
  tpl.innerHTML = barHtml_(panelId).trim();
  bar = tpl.firstElementChild;
  if (title && title.nextSibling) root.insertBefore(bar, title.nextSibling);
  else root.insertBefore(bar, root.firstChild);
  return bar;
}
function ensureBars_() {
  injectCss_();
  PANEL_IDS.forEach(ensureBarForPanel_);
  refreshAllBars_();
}
function refreshBar_(bar) {
  if (!bar) return;
  const el = primarySelectedElement_();
  const src = el ? readElementSource_(el) : 'global';
  const selected = bar.querySelector('[data-st-source-selected]');
  const note = bar.querySelector('[data-st-source-note]');
  if (selected) {
    if (el) selected.innerHTML = `Вибраний елемент: <b>${esc(nodeLabel_(el))}</b> · джерело: <b>${esc(SOURCE_LABELS[src])}</b>`;
    else selected.textContent = 'Виберіть елемент у шапці, футері .';
  }
  if (note) note.textContent = SOURCE_NOTES[src] || SOURCE_NOTES.global;
  bar.querySelectorAll('[data-st-source]').forEach((btn) => {
    const bs = normalizeSource_(btn.getAttribute('data-st-source'));
    btn.classList.toggle('is-active', !!el && bs === src);
    btn.disabled = !el;
  });
}
function refreshAllBars_() {
  ensureBarsNoRefresh_();
  document.querySelectorAll('[data-st-element-source-bar]').forEach(refreshBar_);
}
function ensureBarsNoRefresh_() {
  injectCss_();
  PANEL_IDS.forEach(ensureBarForPanel_);
}
function onBarClick_(ev) {
  const btn = ev.target?.closest?.('[data-st-source]');
  if (!btn) return;
  const bar = btn.closest?.('[data-st-element-source-bar]');
  if (!bar) return;
  ev.preventDefault?.();
  ev.stopPropagation?.();
  const src = normalizeSource_(btn.getAttribute('data-st-source'));
  const els = selectedElements_();
  if (!els.length) return;
  setSourceForElements_(els, src, 'source-button-00694');
}
function installAutoDesignMarkers_() {
  document.addEventListener('st:fill-widget:applied', (ev) => {
    const targets = Array.isArray(ev?.detail?.targets) ? ev.detail.targets : (ev?.detail?.target ? [ev.detail.target] : selectedElements_());
    markDesignForElements_(targets, 'fill-widget');
  });
  window.addEventListener('st:borderColorChange', (ev) => {
    // 00914: color picker/range live input is visual preview only.
    // Mark source on final commit/change, not on every animation-frame input.
    if (ev?.detail?.live === true) return;
    markDesignForElements_(selectedElements_(), 'border-widget');
  });
  window.addEventListener('st:shadows-widget:applied', (ev) => {
    if (ev?.detail?.live === true) return;
    const targets = Array.isArray(ev?.detail?.targets) ? ev.detail.targets : (ev?.detail?.target ? [ev.detail.target] : selectedElements_());
    markDesignForElements_(targets, 'shadows-widget');
  });
  document.addEventListener('input', (ev) => {
    const panel = ev.target?.closest?.('#design-panel-root');
    if (!panel || ev.target?.closest?.('[data-st-element-source-bar]')) return;
    const t = ev.target;
    const liveBorderControl = t?.matches?.('[data-radius-slider],[data-radius-input],[data-color-solid-picker],[data-color-solid-input],[data-color-grad1],[data-color-grad2],[data-color-grad-split],[data-color-grad-blend],[data-color-opacity],[data-color-desaturate],[data-shadow-geom],[data-shadow-color],[data-shadow-opacity]')
      || t?.closest?.('[data-border-color-root],[data-border-radius-root],.design-border-subsection[data-shadows-subsection-id]');
    if (liveBorderControl) return;
    if (t?.matches?.('input,select,textarea')) markDesignForElements_(selectedElements_(), 'design-panel-input');
  }, true);
  document.addEventListener('change', (ev) => {
    const panel = ev.target?.closest?.('#design-panel-root');
    if (!panel || ev.target?.closest?.('[data-st-element-source-bar]')) return;
    const t = ev.target;
    if (t?.matches?.('input,select,textarea')) markDesignForElements_(selectedElements_(), 'design-panel-change');
  }, true);
}
function reapplyLocalSourceVarsOnGlobalChange_() {
  // Коли глобальна тема змінилась, елементи з AI/Design джерелом зберігають свої локальні CSS vars.
  try {
    document.querySelectorAll('[data-st-style-source="ai"],[data-st-style-source="design"]').forEach((el) => {
      applyTokenStyleToElement_(el, el.getAttribute('data-st-style-source') || 'design');
    });
  } catch (_) {}
}


function siteScopeRoot_() {
  return document;
}
function styleElementsByKind_(kind = 'all') {
  const k = String(kind || 'all').trim();
  const root = siteScopeRoot_();
  const scope = '#st-site-header-slot,#st-site-footer-slot,#site-root';
  const inCanvas = (el) => el instanceof HTMLElement && !!el.closest?.(scope) && !el.closest?.('.hb-panel,.fb-panel,.builder__settings-sidebar');
  let selector = '[data-st-style-source],.st-section,.st-row,.st-block,[data-hf-node-type="section"],[data-hf-node-type="level"],[data-hf-node-type="row"],[data-hf-node-type="container"],[data-hf-node-type="block"]';
  if (k === 'button') selector = '.st-block--button,[data-hf-block-type="button"],[data-st-block-type="button"],.st-button';
  else if (k === 'block') selector = '.st-block,[data-hf-node-type="block"]';
  else if (k === 'selected') return selectedElements_();
  try {
    return Array.from(root.querySelectorAll(selector)).filter(inCanvas);
  } catch (_) {
    return [];
  }
}
function resetElementsToGlobal_(kind = 'selected', reason = 'reset-to-global') {
  const els = styleElementsByKind_(kind);
  setSourceForElements_(els, 'global', `${reason}:${kind}`);
  return els.length;
}

export function initElementStyleSourceControl() {
  if (window.__ST_ELEMENT_STYLE_SOURCE_CONTROL_00694__) return;
  window.__ST_ELEMENT_STYLE_SOURCE_CONTROL_00694__ = true;
  ensureBars_();
  document.addEventListener('click', onBarClick_, true);
  document.addEventListener('st:selection-changed', () => refreshAllBars_());
  document.addEventListener('st:design-panel-ready', () => setTimeout(ensureBars_, 0));
  window.addEventListener('st:global-style-applied', () => {
    reapplyLocalSourceVarsOnGlobalChange_();
    refreshAllBars_();
  });
  installAutoDesignMarkers_();
  try {
    window.ST_ELEMENT_STYLE_SOURCE = {
      refresh: refreshAllBars_,
      selectedElements: selectedElements_,
      allElements: () => styleElementsByKind_('all'),
      sourceOf: (el) => readElementSource_(el),
      setSourceForSelected: (src) => setSourceForElements_(selectedElements_(), src, 'api'),
      setSourceForElements: (elements, src, reason = 'api') => setSourceForElements_(elements, src, reason),
      resetSelectedToGlobal: () => resetElementsToGlobal_('selected', 'api-reset-selected-00695'),
      resetButtonsToGlobal: () => resetElementsToGlobal_('button', 'api-reset-buttons-00695'),
      resetBlocksToGlobal: () => resetElementsToGlobal_('block', 'api-reset-blocks-00695'),
      resetAllToGlobal: () => resetElementsToGlobal_('all', 'api-reset-all-00695')
    };
  } catch (_) {}
  log00694_('element-style-source-init-00694', { panels: PANEL_IDS.length });
}
