// js/panel-page-tree.js
// "Дерево сторінки" в інспекторі (панель Блоки).
// Показує поточні секції/ряди/блоки з siteState.
// Вибір:
//   - один блок або одна секція за замовчуванням;
//   - кілька блоків / кілька секцій тільки з Ctrl;
//   - не можна міксувати блоки та секції в одній вибірці.

import { siteState, saveStateNow } from './site-state.js';

export function initPageTreePanel() {
  const toggleBtn = document.getElementById('toggle-page-tree'); // optional legacy button; tree is always visible from 00281
  const wrap      = document.getElementById('page-tree-wrap');
  const treeRoot  = document.getElementById('page-tree-root');
  const siteRoot  = document.getElementById('site-root');

  if (!wrap || !treeRoot || !siteRoot) return;

  if (treeRoot.dataset.stPageTreePanelInit === '1') {
    wrap.style.display = 'block';
    return;
  }
  treeRoot.dataset.stPageTreePanelInit = '1';

  let treeVisible = true;

  // --- стан вибору ---
  const selectedBlockIds = new Set();
  const selectedRowIds   = new Set();
  let selectionMode      = null; // "block" | "row" | null

  // Спеціальна вибірка для шапки/маїна/футера у режимах конструктора
  let specialSelectedEl  = null; // HTMLElement | null
  let specialSelectedKey = null; // "header" | "main" | "footer" | "header-sec" | "main-sec" | ...
  let specialSelectedUid = null; // string | null

  // 00284: the same DOM element can appear twice in the tree: e.g. "Блок Іконка"
  // and its inner "Іконка меню". A single data-st-tree-uid on the element made
  // both tree rows share one uid, so the wrong row was highlighted. Keep uid per
  // element + tree role key.
  const specialUidByEl = new WeakMap();

  function cssIdent_(v) {
    const raw = String(v || '');
    try { return (window.CSS && typeof window.CSS.escape === 'function') ? window.CSS.escape(raw) : raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); } catch (_) { return raw.replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }
  }

  function findSpecialTreeNode_(uid, key) {
    if (!uid) return null;
    try {
      if (key) {
        const exact = treeRoot.querySelector(`[data-special-uid="${cssIdent_(uid)}"][data-special-key="${cssIdent_(key)}"]`);
        if (exact) return exact;
      }
      return treeRoot.querySelector(`[data-special-uid="${cssIdent_(uid)}"]`);
    } catch (_) {
      return null;
    }
  }

  // --- стан згортання дерева ---
  // тримаємо між renderTree(), щоб згортання не скидалося при оновленні
  const collapsedKeys = new Set();

  // --- нумерація спеціальних типів блоків у дереві ---
  // перераховується щоразу у renderTree(), щоб відповідати фактичному порядку дерева
  let articleIndexById = new Map();
  let textIndexById    = new Map();
  let articleCounter   = 0;
  let textCounter      = 0;

  function getOrAssignTypeIndex(kind, blockId) {
    if (!blockId) return 1;
    if (kind === 'text') {
      if (!textIndexById.has(blockId)) {
        textCounter += 1;
        textIndexById.set(blockId, textCounter);
      }
      return textIndexById.get(blockId) || 1;
    }
    if (kind === 'article') {
      if (!articleIndexById.has(blockId)) {
        articleCounter += 1;
        articleIndexById.set(blockId, articleCounter);
      }
      return articleIndexById.get(blockId) || 1;
    }
    return 1;
  }

  // ---------- helpers: очистка / оновлення відображення ----------

  function resetSelection() {
    selectedBlockIds.clear();
    selectedRowIds.clear();
    selectionMode = null;
    specialSelectedEl  = null;
    specialSelectedKey = null;
    specialSelectedUid = null;
  }

  const TREE_CANVAS_CLASSES = [
    'st-tree-selected-container',
    'st-tree-selected-block',
    'st-tree-selected-icon',
    'st-tree-selected-icon-inner',
    'st-tree-selected-text',
    'st-tree-selected-heading',
  ];

  function clearTreeCanvasHighlights() {
    const selector = [
      '.st-block.is-active', '.st-section.is-active', '.st-row.is-active',
      '.st-block.is-selected', '.st-section.is-selected', '.st-row.is-selected',
      '#st-site-header-slot .is-active', '#st-site-header-slot .is-selected',
      '#st-site-footer-slot .is-active', '#st-site-footer-slot .is-selected',
      '#st-site-header-slot .hb-dom-active', '#st-site-header-slot .hb-dom-selected',
      '#st-site-footer-slot .hb-dom-active', '#st-site-footer-slot .hb-dom-selected',
      '.st-tree-selected-container', '.st-tree-selected-block', '.st-tree-selected-icon', '.st-tree-selected-icon-inner', '.st-tree-selected-text', '.st-tree-selected-heading',
    ].join(', ');

    siteRoot.querySelectorAll(selector).forEach((el) => {
      el.classList.remove('is-active', 'is-selected', 'hb-dom-active', 'hb-dom-selected', ...TREE_CANVAS_CLASSES);
    });
  }

  function getSpecialVisualRole(key, el) {
    const k = String(key || '').toLowerCase();
    if (k.includes('__container')) return 'container';
    if (k.includes('__menuitem')) return 'menuitem';
    if (k.includes('__text')) return 'text';
    // 00283/00284: distinguish a block that contains an icon from the real icon/glyph inside it.
    // Parent .st-block--icon remains a normal blue block; only child icon/glyph is dark-blue dashed.
    if (k.includes('__icon-inner') || k.includes('__glyph')) return 'icon-inner';
    if (k.includes('__icon')) return 'icon-inner';
    if (k.includes('__elem')) {
      if (el?.classList?.contains('st-block--heading') || String(el?.dataset?.blockRole || '').toLowerCase() === 'heading') return 'heading';
      if (el?.classList?.contains('st-block--icon')) return 'block';
      if (el?.classList?.contains('st-block--text') || el?.classList?.contains('st-block--logo') || el?.classList?.contains('st-block--menu')) return 'block';
      return 'block';
    }
    if (k.includes('__row') || k.includes('__sec') || k === 'header' || k === 'footer') return 'block';
    return 'block';
  }

  function getTreeIconHighlightTarget(el, role = '') {
    if (!(el instanceof HTMLElement)) return el;
    const r = String(role || '').toLowerCase();
    const FACE_SEL = '.st-icon-btn, .st-button__iconbtn, .st-phone__iconbtn, .st-logo__iconbtn, .st-logo__mark';
    const INNER_SEL = '.st-icon-svg, .st-icon-btn__glyph, .st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg, svg';

    // 00286: inner icon/glyph highlight must be the icon contour/wrapper.
    // Never outline the inner SVG path/dot itself, and never climb all the way
    // to the blue owner .st-block--icon.
    if (r === 'icon-inner') {
      if (el.matches?.(FACE_SEL)) return el;
      if (el.matches?.(INNER_SEL)) {
        const face = el.closest?.(FACE_SEL);
        return (face instanceof HTMLElement) ? face : el;
      }
      const face = el.querySelector?.(':scope > .st-icon-btn, :scope > .st-button__iconbtn, :scope > .st-phone__iconbtn, :scope > .st-logo__iconbtn, :scope > .st-logo__mark')
        || el.querySelector?.(':scope .st-icon-btn, :scope .st-button__iconbtn, :scope .st-phone__iconbtn, :scope .st-logo__iconbtn, :scope .st-logo__mark');
      if (face instanceof HTMLElement) return face;
      const closestFace = el.closest?.(FACE_SEL);
      return closestFace || el;
    }

    // For the icon owner block, keep the blue block selection on the owner.
    // The child "Іконка меню" node uses role=icon-inner and gets the dashed
    // dark-blue contour around the icon face only.
    if (el.matches?.('.st-block--icon')) return el;
    const selfMatch = el.matches?.(FACE_SEL);
    if (selfMatch) return el;
    const closest = el.closest?.(FACE_SEL + ', .st-block--icon');
    if (closest) return closest;
    const inner = el.querySelector?.(':scope > .st-icon-btn, :scope > .st-button__iconbtn, :scope > .st-phone__iconbtn, :scope > .st-logo__iconbtn, :scope > .st-logo__mark, :scope .st-icon-btn');
    return inner || el;
  }

  function applyTreeCanvasHighlight(el, key) {
    if (!el) return;
    const role = getSpecialVisualRole(key, el);
    const visualEl = (role === 'icon' || role === 'icon-inner') ? getTreeIconHighlightTarget(el, role) : el;

    // 00286: for real inner icons, highlight ONLY the visual icon face.
    // Do not also put a class on the inner SVG/path or the owner block, because
    // that made logo dots/icons look selected together with their block.
    const targets = (role === 'icon-inner')
      ? [visualEl || el]
      : [el, ...(visualEl && visualEl !== el ? [visualEl] : [])];

    targets.forEach((target) => {
      if (!target || !target.classList) return;
      // Real canvas blocks/containers may become active. Internal parts (text, glyphs,
      // menu item links) get only tree-highlight classes, so they cannot trigger layout/resize
      // side effects or receive block resize handles.
      if (!['text', 'icon-inner', 'menuitem'].includes(role)) {
        target.classList.add('is-active', 'is-selected');
      }
      if (role === 'container') target.classList.add('st-tree-selected-container');
      else if (role === 'text') target.classList.add('st-tree-selected-text');
      else if (role === 'icon-inner') target.classList.add('st-tree-selected-icon-inner');
      else if (role === 'icon') target.classList.add('st-tree-selected-icon');
      else if (role === 'heading') target.classList.add('st-tree-selected-heading');
      else target.classList.add('st-tree-selected-block');
    });
  }

  function textBrief(el, fallback = 'Текстове поле') {
    const raw = String(el?.textContent || '').replace(/\s+/g, ' ').trim();
    if (!raw) return fallback;
    return raw.split(' ').slice(0, 2).join(' ');
  }

  function iconBrief(el, fallback = 'Іконка') {
    const raw = String(
      el?.getAttribute?.('aria-label') ||
      el?.getAttribute?.('title') ||
      el?.dataset?.name ||
      el?.dataset?.stTreeName ||
      fallback
    ).replace(/\s+/g, ' ').trim();
    return (raw || fallback).split(' ').slice(0, 2).join(' ');
  }

  function makeUl(margin = '4px 0 0 12px', gap = '2px') {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.margin = margin;
    ul.style.padding = '0';
    ul.style.display = 'flex';
    ul.style.flexDirection = 'column';
    ul.style.gap = gap;
    return ul;
  }

  function toggleCollapseOnDblClick(head, key, childUl = null) {
    if (!head || !key) return;
    if (head.__stTreeDblClickBound) return;
    head.__stTreeDblClickBound = true;
    head.addEventListener('dblclick', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!head.__stApplyCollapse && !childUl) return;
      setCollapsed(key, !isCollapsed(key));
      head.__stApplyCollapse?.();
    });
  }

  function escapeTreeConfirmHtml_(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function ensureTreeDeleteConfirmModal_() {
    let overlay = document.getElementById('stPageTreeDeleteConfirmOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'stPageTreeDeleteConfirmOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:999999',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'padding:18px',
      'background:rgba(2,6,23,.78)',
      'backdrop-filter:blur(8px)'
    ].join(';');
    document.body.appendChild(overlay);
    return overlay;
  }

  function showTreeDeleteConfirm_(labelText, kindText = 'елемент дерева') {
    return new Promise((resolve) => {
      const overlay = ensureTreeDeleteConfirmModal_();
      const label = String(labelText || 'Елемент');
      const kind = String(kindText || 'елемент дерева');
      overlay.innerHTML = `
        <div role="dialog" aria-modal="true" aria-labelledby="stTreeDeleteTitle" style="width:min(760px,calc(100vw - 36px));border:3px solid #ff2d2d;border-radius:24px;background:linear-gradient(180deg,#1a0507,#07080d);box-shadow:0 36px 120px rgba(0,0,0,.78),0 0 0 1px rgba(255,255,255,.08) inset;color:#fff;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;">
          <div style="padding:24px 28px 20px;border-bottom:1px solid rgba(255,255,255,.14);background:linear-gradient(90deg,rgba(220,38,38,.98),rgba(127,29,29,.98));">
            <div id="stTreeDeleteTitle" style="font-size:34px;line-height:1.05;font-weight:1000;letter-spacing:.055em;text-transform:uppercase;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.38);">УВАГА! ВИДАЛЕННЯ</div>
            <div style="margin-top:10px;font-size:15px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#fff7ed;">Елемент буде видалено разом з усіма дочірніми елементами</div>
          </div>

          <div style="padding:24px 28px 20px;display:grid;gap:16px;">
            <div style="padding:16px 18px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(255,255,255,.045);">
              <div style="font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#fca5a5;">Буде видалено</div>
              <div style="margin-top:8px;font-size:24px;font-weight:950;color:#fff;word-break:break-word;">${escapeTreeConfirmHtml_(label)}</div>
              <div style="margin-top:6px;font-size:13px;color:rgba(255,255,255,.70);word-break:break-word;">Тип: ${escapeTreeConfirmHtml_(kind)}</div>
            </div>

            <label style="display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);cursor:pointer;">
              <input data-st-tree-delete-check type="checkbox" style="width:22px;height:22px;margin-top:2px;accent-color:#dc2626;">
              <span style="font-size:17px;line-height:1.45;font-weight:850;color:#fff;">Я розумію, що цей елемент і всі його діти будуть видалені.</span>
            </label>

            <div style="display:grid;gap:8px;">
              <div style="font-size:16px;font-weight:900;color:#fecaca;">Для підтвердження введи великими буквами:</div>
              <div style="font-size:30px;font-weight:1000;letter-spacing:.14em;color:#fff;background:#7f1d1d;border:2px solid #ef4444;border-radius:16px;padding:10px 14px;text-align:center;">ВИДАЛИТИ</div>
              <input data-st-tree-delete-input type="text" autocomplete="off" spellcheck="false" placeholder="Введи тут: ВИДАЛИТИ" style="width:100%;box-sizing:border-box;border:2px solid rgba(248,113,113,.62);border-radius:16px;background:#fff;color:#111827;padding:15px 16px;font-size:21px;font-weight:950;outline:none;letter-spacing:.06em;">
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px;padding:20px 28px 24px;border-top:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);">
            <button type="button" data-st-tree-delete-cancel style="border:1px solid rgba(255,255,255,.22);border-radius:16px;padding:14px 22px;background:rgba(255,255,255,.08);color:#fff;font-size:16px;font-weight:950;cursor:pointer;">Скасувати</button>
            <button type="button" data-st-tree-delete-ok disabled style="border:0;border-radius:16px;padding:14px 24px;background:#5b1111;color:rgba(255,255,255,.48);font-size:16px;font-weight:1000;letter-spacing:.04em;cursor:not-allowed;box-shadow:none;">ТАК, ВИДАЛИТИ</button>
          </div>
        </div>
      `;

      const check = overlay.querySelector('[data-st-tree-delete-check]');
      const input = overlay.querySelector('[data-st-tree-delete-input]');
      const okBtn = overlay.querySelector('[data-st-tree-delete-ok]');
      const cancelBtn = overlay.querySelector('[data-st-tree-delete-cancel]');

      const update = () => {
        const valid = !!check?.checked && String(input?.value || '').trim().toUpperCase() === 'ВИДАЛИТИ';
        if (!okBtn) return;
        okBtn.disabled = !valid;
        okBtn.style.background = valid ? 'linear-gradient(90deg,#dc2626,#991b1b)' : '#5b1111';
        okBtn.style.color = valid ? '#fff' : 'rgba(255,255,255,.48)';
        okBtn.style.cursor = valid ? 'pointer' : 'not-allowed';
        okBtn.style.boxShadow = valid ? '0 16px 42px rgba(220,38,38,.42)' : 'none';
      };

      const close = (val) => {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
        document.removeEventListener('keydown', onKey, true);
        resolve(!!val);
      };

      const onKey = (ev) => {
        if (ev.key === 'Escape') {
          ev.preventDefault();
          close(false);
        }
        if (ev.key === 'Enter' && okBtn && !okBtn.disabled) {
          ev.preventDefault();
          close(true);
        }
      };

      check?.addEventListener('change', update);
      input?.addEventListener('input', update);
      cancelBtn?.addEventListener('click', () => close(false), { once: true });
      okBtn?.addEventListener('click', () => { if (!okBtn.disabled) close(true); });
      document.addEventListener('keydown', onKey, true);
      overlay.style.display = 'flex';
      update();
      setTimeout(() => { try { input?.focus(); } catch (_) {} }, 0);
    });
  }

  function removeFromArray_(arr, id) {
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => String(x) !== String(id));
  }

  function deleteStateBlockDeep_(blockId) {
    const id = String(blockId || '');
    if (!id || !siteState.blocks?.[id]) return;
    const block = siteState.blocks[id];
    if (block?.childrenRow && siteState.rows?.[block.childrenRow]) {
      deleteStateRowDeep_(block.childrenRow);
    }
    try {
      Object.values(siteState.rows || {}).forEach((row) => {
        if (row && Array.isArray(row.children)) row.children = removeFromArray_(row.children, id);
        if (row && Array.isArray(row.columns) && row.children && row.columns.length !== row.children.length) {
          const n = Math.max(1, row.children.length);
          row.columns = row.children.map(() => 1 / n);
        }
      });
    } catch (_) {}
    try { delete siteState.blocks[id]; } catch (_) {}
  }

  function deleteStateRowDeep_(rowId) {
    const id = String(rowId || '');
    if (!id || !siteState.rows?.[id]) return;
    const row = siteState.rows[id];
    (Array.isArray(row.children) ? row.children.slice() : []).forEach((bid) => deleteStateBlockDeep_(bid));
    try {
      if (siteState.page) {
        siteState.page.rootRows = removeFromArray_(siteState.page.rootRows, id);
      }
    } catch (_) {}
    try { delete siteState.rows[id]; } catch (_) {}
  }

  function pruneEmptySectionAfterRowDelete_(rowEl, parentSec = null) {
    try {
      const sec = parentSec || (rowEl?.parentElement?.classList?.contains('st-section') ? rowEl.parentElement : null);
      if (!sec) return;
      const directRows = Array.from(sec.querySelectorAll(':scope > .st-row'));
      if (!directRows.length && sec.parentElement) sec.remove();
    } catch (_) {}
  }

  function getDeleteKindLabel_(target) {
    const k = String(target?.kind || '');
    const key = String(target?.specialKey || '');
    if (k === 'row') return 'рівень / секція';
    if (k === 'block') return 'блок';
    if (key.includes('__sec')) return 'секція';
    if (key.includes('__row')) return 'рівень';
    if (key.includes('__container')) return 'контейнер';
    if (key.includes('__elem')) return 'блок';
    if (key.includes('__menuitem')) return 'пункт меню';
    if (key.includes('__text')) return 'текст';
    if (key.includes('__icon')) return 'іконка';
    return 'елемент дерева';
  }

  function afterTreeDelete_(reason = 'page-tree-delete') {
    try { window.ST_SELECTION?.clear?.(); } catch (_) {}
    try { window.ST_SELECTION?.emit?.(null, []); } catch (_) {}
    try { resetSelection(); } catch (_) {}
    try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}
    try { window.SiteCanvas?.refreshEnhancers?.(siteRoot); } catch (_) {}
    try { saveStateNow(); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason } })); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: null })); } catch (_) {}
    try { renderTree(); } catch (_) {}
  }

  function deleteTreeTargetNow_(target) {
    if (!target) return false;
    const kind = String(target.kind || '');

    if (kind === 'block') {
      const id = String(target.id || '');
      const el = id ? siteRoot.querySelector(`.st-block[data-uid="${cssIdent_(id)}"]`) : null;
      if (el && el.parentElement) el.remove();
      deleteStateBlockDeep_(id);
      afterTreeDelete_('page-tree-delete-block');
      return true;
    }

    if (kind === 'row') {
      const id = String(target.id || '');
      const rowEl = id ? siteRoot.querySelector(`.st-row[data-uid="${cssIdent_(id)}"]`) : null;
      if (rowEl && rowEl.parentElement) {
        const parentSec = rowEl.parentElement?.classList?.contains('st-section') ? rowEl.parentElement : null;
        rowEl.remove();
        pruneEmptySectionAfterRowDelete_(rowEl, parentSec);
      }
      deleteStateRowDeep_(id);
      afterTreeDelete_('page-tree-delete-row');
      return true;
    }

    if (kind === 'special') {
      const el = target.el;
      const specialKey = String(target.specialKey || '');
      if (!el || !(el instanceof HTMLElement)) return false;
      if (specialKey === 'header' || specialKey === 'main' || specialKey === 'footer' || specialKey === 'removed-content') return false;
      if (specialKey.startsWith('main__')) return removeMainSpecialNode_(el, specialKey);
      const oldParent = el.parentElement;
      const wasRow = el.classList?.contains('st-row');
      const parentSec = wasRow && oldParent?.classList?.contains('st-section') ? oldParent : null;
      if (oldParent) el.remove();
      if (wasRow) pruneEmptySectionAfterRowDelete_(el, parentSec);
      afterTreeDelete_('page-tree-delete-special');
      return true;
    }

    return false;
  }

  async function requestDeleteTreeTarget_(target, labelText) {
    const ok = await showTreeDeleteConfirm_(labelText, getDeleteKindLabel_(target));
    if (!ok) return;
    deleteTreeTargetNow_(target);
  }

  function getRemovedContentSections_() {
    try {
      return Array.from(siteRoot.querySelectorAll(':scope > .st-section')).filter((sec) => {
        const role = String(sec?.dataset?.secRole || '').toLowerCase();
        if (role === 'header' || role === 'footer') return false;
        if (sec.closest?.('#st-site-header-slot, #st-site-footer-slot')) return false;
        return true;
      });
    } catch (_) {
      return [];
    }
  }

function updateCanvasSelection(scrollTargetEl = null) {
  clearTreeCanvasHighlights();

  // спеціальна підсвітка (шапка/футер/внутрішні DOM-вузли)
  if (specialSelectedEl) {
    applyTreeCanvasHighlight(specialSelectedEl, specialSelectedKey);
    if (scrollTargetEl) {
      scrollTargetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    return;
  }

  // секції (ряди) → секція стає і активною, і вибраною
  selectedRowIds.forEach(rowId => {
    const rowEl = siteRoot.querySelector(`.st-row[data-uid="${rowId}"]`);
    if (!rowEl) return;
    const secEl = rowEl.closest('.st-section') || rowEl;
    if (secEl) {
      secEl.classList.add('is-active');
      secEl.classList.add('is-selected');
    }
  });

  // блоки → теж активні + selected
  selectedBlockIds.forEach(blockId => {
    const blockEl = siteRoot.querySelector(`.st-block[data-uid="${blockId}"]`);
    if (!blockEl) return;
    blockEl.classList.add('is-active');
    blockEl.classList.add('is-selected');
  });

  if (scrollTargetEl) {
    scrollTargetEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

  function updateTreeSelection() {
    // прибираємо старі підсвітки
    treeRoot
      .querySelectorAll('.page-tree-row--active, .page-tree-block--active, .page-tree-special--active')
      .forEach(el => {
        el.classList.remove('page-tree-row--active');
        el.classList.remove('page-tree-block--active');
        el.classList.remove('page-tree-special--active');
      });

    // секції
    selectedRowIds.forEach(rowId => {
      const node = treeRoot.querySelector(`[data-row-id="${rowId}"]`);
      if (node) node.classList.add('page-tree-row--active');
    });

    // блоки
    selectedBlockIds.forEach(blockId => {
      const node = treeRoot.querySelector(`[data-block-id="${blockId}"]`);
      if (node) node.classList.add('page-tree-block--active');
    });

    // шапка/футер (спеціальні вузли)
    if (specialSelectedUid) {
      const node = findSpecialTreeNode_(specialSelectedUid, specialSelectedKey);
      if (node) node.classList.add('page-tree-special--active');
    }
  }

  // ---------- вибір блоків / секцій ----------

  function isOnlySelectedBlock_(blockId) {
    return selectionMode === 'block'
      && !specialSelectedEl
      && selectedBlockIds.size === 1
      && selectedBlockIds.has(blockId);
  }

  function isOnlySelectedRow_(rowId) {
    return selectionMode === 'row'
      && !specialSelectedEl
      && selectedRowIds.size === 1
      && selectedRowIds.has(rowId);
  }

  function clearAllTreeSelection_() {
    resetSelection();
    updateCanvasSelection(null);
    updateTreeSelection();
  }

  function selectBlock(blockId, { append = false, scroll = false } = {}) {
    if (!blockId) return;

    // 00287: ordinary repeated single click on the same tree item toggles selection OFF.
    // Ctrl/Cmd multi-select keeps its existing add/remove behavior.
    if (!append && isOnlySelectedBlock_(blockId)) {
      clearAllTreeSelection_();
      return;
    }

    // якщо зараз режим секцій або append=false → скидаємо все і починаємо режим "block"
    if (!append || selectionMode === 'row' || selectionMode === null) {
      resetSelection();
      selectionMode = 'block';
    }

    // toggle для Ctrl: якщо вже вибраний — знімаємо, якщо ні — додаємо
    if (append && selectedBlockIds.has(blockId)) {
      selectedBlockIds.delete(blockId);
      if (!selectedBlockIds.size) resetSelection();
    } else {
      selectedBlockIds.add(blockId);
    }

    const blockEl = siteRoot.querySelector(`.st-block[data-uid="${blockId}"]`);
    updateCanvasSelection(!append && scroll ? blockEl : null);
    updateTreeSelection();
  }

  function selectRow(rowId, { append = false, scroll = false } = {}) {
    if (!rowId) return;

    // 00287: ordinary repeated single click on the same tree item toggles selection OFF.
    if (!append && isOnlySelectedRow_(rowId)) {
      clearAllTreeSelection_();
      return;
    }

    // якщо зараз режим блоків або append=false → скидаємо все і починаємо режим "row"
    if (!append || selectionMode === 'block' || selectionMode === null) {
      resetSelection();
      selectionMode = 'row';
    }

    if (append && selectedRowIds.has(rowId)) {
      selectedRowIds.delete(rowId);
      if (!selectedRowIds.size) resetSelection();
    } else {
      selectedRowIds.add(rowId);
    }

    const rowEl = siteRoot.querySelector(`.st-row[data-uid="${rowId}"]`);
    const secEl = rowEl && (rowEl.closest('.st-section') || rowEl);

    updateCanvasSelection(!append && scroll ? secEl : null);
    updateTreeSelection();
  }

  function selectSpecial(el, specialKey, { scroll = false } = {}) {
    if (!el || !specialKey) return;
    const uid = ensureSpecialUid(el, specialKey);

    // 00287: repeated single click on the exact same special tree row removes
    // both the active row in the tree and the canvas highlight.
    if (specialSelectedEl === el
      && specialSelectedKey === specialKey
      && specialSelectedUid === uid
      && selectedBlockIds.size === 0
      && selectedRowIds.size === 0) {
      clearAllTreeSelection_();
      return;
    }

    resetSelection();
    selectionMode = null;
    specialSelectedEl = el;
    specialSelectedKey = specialKey;
    specialSelectedUid = uid;
    updateCanvasSelection(scroll ? el : null);
    updateTreeSelection();
  }

  // 00288: The top inspector button "Нічого" must also clear selections
  // that were created from the tree. Design modes and tree selection used to be
  // separate, so tree highlights could remain after switching to "Нічого".
  window.addEventListener('st:clearPageTreeSelection', () => {
    clearAllTreeSelection_();
  });

  // ---------- побудова дерева ----------

  function makeCollapseKey(kind, id) {
    if (!kind || !id) return null;
    return `${kind}:${id}`;
  }

  function isCollapsed(key) {
    return !!key && collapsedKeys.has(key);
  }

  function setCollapsed(key, collapsed) {
    if (!key) return;
    if (collapsed) collapsedKeys.add(key);
    else collapsedKeys.delete(key);
  }

  function decorateHeadWithControls(headEl, labelText, { key = null, childUl = null, editable = true, rename = null, deleteTarget = null } = {}) {
    // Робимо «рядок» як: [Назва] [✎] [✕] [▾/▸]
    // rename: { kind: "row"|"block"|"special", id?: string, el?: HTMLElement, get?:()=>string, set?:(v)=>void }
    headEl.innerHTML = '';
    headEl.style.display = 'flex';
    headEl.style.alignItems = 'center';
    headEl.style.justifyContent = 'space-between';
    headEl.style.gap = '8px';

    const left = document.createElement('span');
    left.textContent = labelText;
    left.style.flex = '1 1 auto';
    left.style.minWidth = '0';
    left.style.overflow = 'hidden';
    left.style.textOverflow = 'ellipsis';
    left.style.whiteSpace = 'nowrap';

    const right = document.createElement('span');
    right.style.display = 'inline-flex';
    right.style.alignItems = 'center';
    right.style.gap = '6px';
    right.style.flex = '0 0 auto';

    // ---- rename helpers ----
    function startInlineRename() {
      if (!editable) return;
      // Забороняємо редагування для службових коренів (ШАПКА/CONTENT/ФУТЕР) — контролюється через editable=false ззовні
      const current = (rename && typeof rename.get === 'function') ? String(rename.get() || '') : String(labelText || '');
      const input = document.createElement('input');
      input.type = 'text';
      input.value = current;
      input.style.width = '100%';
      input.style.maxWidth = '100%';
      input.style.fontSize = '12px';
      input.style.lineHeight = '1.2';
      input.style.padding = '2px 6px';
      input.style.borderRadius = '8px';
      input.style.border = '1px solid rgba(255,255,255,.18)';
      input.style.background = 'rgba(0,0,0,.25)';
      input.style.color = 'inherit';
      input.style.outline = 'none';

      const finalize = (commit) => {
        const raw = input.value;
        const next = String(raw ?? '').trim();
        // відновлюємо лейбл
        left.replaceWith(left); // no-op safety
      };

      const commit = () => {
        const next = String(input.value ?? '').trim();
        const safe = next.length ? next : current;
        if (rename && typeof rename.set === 'function') {
          rename.set(safe);
        }
        left.textContent = safe;
        input.replaceWith(left);
      };

      const cancel = () => {
        input.replaceWith(left);
      };

      input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault();
          commit();
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          cancel();
        }
      });
      input.addEventListener('blur', () => {
        // blur = commit, щоб було зручно
        commit();
      });

      left.replaceWith(input);
      // виділяємо текст
      input.focus();
      try { input.select(); } catch (_) {}
    }

    // 1) Редагувати (✎) — якщо дозволено
    if (editable) {
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.title = 'Змінити назву';
      editBtn.textContent = '✎';
      editBtn.style.cursor = 'pointer';
      editBtn.style.border = '0';
      editBtn.style.background = 'transparent';
      editBtn.style.color = 'inherit';
      editBtn.style.opacity = '0.75';
      editBtn.style.padding = '2px 4px';
      editBtn.style.lineHeight = '1';
      editBtn.style.borderRadius = '8px';

      // hover підсвітка
      editBtn.addEventListener('mouseenter', () => {
        editBtn.style.opacity = '1';
        editBtn.style.background = 'rgba(255,255,255,.08)';
      });
      editBtn.addEventListener('mouseleave', () => {
        editBtn.style.opacity = '0.75';
        editBtn.style.background = 'transparent';
      });

      editBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        startInlineRename();
      });

      right.appendChild(editBtn);
    }


    // 2) Видалити (✕) — тільки для реальних редагованих вузлів, не для коренів CONTENT/ШАПКА/ФУТЕР.
    if (deleteTarget) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.title = 'Видалити елемент і всі його діти';
      delBtn.textContent = '×';
      delBtn.className = 'page-tree-delete-btn';
      delBtn.style.cursor = 'pointer';
      delBtn.style.border = '0';
      delBtn.style.background = 'rgba(220,38,38,.14)';
      delBtn.style.color = '#fecaca';
      delBtn.style.opacity = '0.9';
      delBtn.style.padding = '1px 6px 2px';
      delBtn.style.lineHeight = '1';
      delBtn.style.borderRadius = '8px';
      delBtn.style.fontSize = '15px';
      delBtn.style.fontWeight = '1000';

      delBtn.addEventListener('mouseenter', () => {
        delBtn.style.opacity = '1';
        delBtn.style.background = 'rgba(220,38,38,.32)';
        delBtn.style.color = '#fff';
      });
      delBtn.addEventListener('mouseleave', () => {
        delBtn.style.opacity = '0.9';
        delBtn.style.background = 'rgba(220,38,38,.14)';
        delBtn.style.color = '#fecaca';
      });
      delBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        requestDeleteTreeTarget_(deleteTarget, labelText);
      });

      right.appendChild(delBtn);
    }

    // 3) Згорнути/розгорнути (як трикутник акардеона)
    let caretBtn = null;
    let apply = null;
    if (childUl && key) {
      caretBtn = document.createElement('button');
      caretBtn.type = 'button';
      caretBtn.title = 'Згорнути/розгорнути';
      caretBtn.style.cursor = 'pointer';
      caretBtn.style.border = '0';
      caretBtn.style.background = 'transparent';
      caretBtn.style.color = 'inherit';
      caretBtn.style.opacity = '0.9';
      caretBtn.style.padding = '2px 4px';
      caretBtn.style.lineHeight = '1';
      caretBtn.style.borderRadius = '8px';

      apply = () => {
        const collapsed = isCollapsed(key);
        caretBtn.textContent = collapsed ? '▸' : '▾';
        childUl.style.display = collapsed ? 'none' : '';
      };

      caretBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        setCollapsed(key, !isCollapsed(key));
        apply();
      });

      // початковий стан
      apply();

      right.appendChild(caretBtn);
    }

    // даємо можливість зовнішньому коду швидко оновити стан (клік по заголовку)
    if (key && childUl) {
      headEl.__stCollapseKey = key;
      headEl.__stCollapseUl  = childUl;
      headEl.__stApplyCollapse = apply;
    }

    headEl.appendChild(left);
    headEl.appendChild(right);
  }

  function renderTree() {
    treeRoot.innerHTML = '';

    // Перерахунок нумерації спеціальних типів блоків для поточного дерева.
    // ВАЖЛИВО: нумерація має йти в тому ж порядку, в якому ми реально будуємо дерево.
    // Тому НЕ робимо окремий "walk" по state, а призначаємо індекси на льоту під час
    // створення вузлів (див. getOrAssignTypeIndex()).
    articleIndexById = new Map();
    textIndexById    = new Map();
    articleCounter   = 0;
    textCounter      = 0;

    const rootRows = siteState.page?.rootRows || [];
    const headerSlot = document.getElementById('st-site-header-slot');
    const mainSlot = document.getElementById('st-site-main-slot');
    const footerSlot = document.getElementById('st-site-footer-slot');
    const removedContentSections = [];
    if (!headerSlot && !mainSlot && !footerSlot) {
      treeRoot.innerHTML =
        '<div style="font-size:12px; opacity:.7;">Немає блоків</div>';
      return;
    }

    const ul = document.createElement('ul');
    ul.style.listStyle     = 'none';
    ul.style.margin        = '0';
    ul.style.padding       = '0';
    ul.style.display       = 'flex';
    ul.style.flexDirection = 'column';
    ul.style.gap           = '4px';

    // Порядок як на сайті: Шапка -> Маїн -> Футер.
    // Усі три області будуються з реального DOM за одним деревним контрактом:
    // область → секція → рівень → контейнер → блок.
    if (headerSlot) ul.appendChild(makeSpecialRootNode('header', 'ШАПКА', headerSlot));
    if (mainSlot) ul.appendChild(makeSpecialRootNode('main', 'МАЇН', mainSlot));
    if (footerSlot) ul.appendChild(makeSpecialRootNode('footer', 'ФУТЕР', footerSlot));

    treeRoot.appendChild(ul);

    // після перебудови дерева накладаємо поточну підсвітку
    updateTreeSelection();
  }

  function ensureSpecialUid(el, key) {
    if (!el || !key) return null;
    try {
      let byKey = specialUidByEl.get(el);
      if (!byKey) {
        byKey = new Map();
        specialUidByEl.set(el, byKey);
      }
      const k = String(key || 'special');
      if (!byKey.has(k)) {
        const safe = k.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 48) || 'special';
        byKey.set(k, `${safe}__${Math.random().toString(36).slice(2, 9)}`);
      }
      return byKey.get(k);
    } catch (_) {
      // Fallback keeps old behavior only if WeakMap is unavailable for some reason.
      if (!el.dataset.stTreeUid) el.dataset.stTreeUid = `${key}__${Math.random().toString(36).slice(2, 9)}`;
      return el.dataset.stTreeUid;
    }
  }

  function setSpecialTreeName_(el, specialKey, value) {
    if (!(el instanceof HTMLElement)) return false;
    const nextName = String(value || '').trim();
    const nodeId = String(el.dataset?.sfId || el.dataset?.stNodeId || el.dataset?.nodeId || '');
    if (String(specialKey || '').startsWith('main__') && nodeId) {
      const result = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.renameMainNode?.(nodeId, nextName);
      if (result?.ok) {
        renderTree();
        return true;
      }
      return false;
    }
    el.dataset.stTreeName = nextName;
    renderTree();
    return true;
  }

  function removeMainSpecialNode_(el, specialKey) {
    if (!(el instanceof HTMLElement) || !String(specialKey || '').startsWith('main__')) return false;
    const nodeId = String(el.dataset?.sfId || el.dataset?.stNodeId || el.dataset?.nodeId || '');
    if (!nodeId) return false;
    const result = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.removeMainNode?.(nodeId);
    if (!result?.ok) return false;
    resetSelection();
    updateCanvasSelection(null);
    renderTree();
    return true;
  }

  function makeRemovedContentRootNode(rootRows = [], removedContentSections = []) {
    const li = document.createElement('li');
    const head = document.createElement('div');
    const specialKey = 'removed-content';
    head.dataset.specialKey = specialKey;
    head.dataset.specialUid = ensureSpecialUid(siteRoot, specialKey) || '';
    const collapseKey = makeCollapseKey('special', head.dataset.specialUid);
    head.className = 'page-tree-row page-tree-node--block page-tree-node--removed-content-root';
    head.style.cursor       = 'pointer';
    head.style.padding      = '4px 8px';
    head.style.borderRadius = '8px';
    head.style.fontSize     = '12px';

    let childUl = null;
    const sections = Array.isArray(removedContentSections) ? removedContentSections : [];

    if (sections.length) {
      childUl = makeUl('4px 0 0 12px', '4px');
      sections.forEach((secEl, si) => {
        childUl.appendChild(makeSpecialSectionNode('removed-content', secEl, si));
      });
    } else if (Array.isArray(rootRows) && rootRows.length) {
      childUl = makeUl('4px 0 0 12px', '4px');
      rootRows.forEach((rid, idx) => {
        childUl.appendChild(makeRowNode(rid, idx));
      });
    }

    head.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectSpecial(siteRoot, specialKey, { scroll: true });
    });
    toggleCollapseOnDblClick(head, collapseKey, childUl);

    decorateHeadWithControls(head, 'REMOVED CONTENT', { key: childUl ? collapseKey : null, childUl, editable: false });
    li.appendChild(head);
    if (childUl) li.appendChild(childUl);
    return li;
  }

  function makeSpecialRootNode(specialKey, title, slotEl) {
    const li = document.createElement('li');

    const head = document.createElement('div');
    head.dataset.specialKey = specialKey;
    head.dataset.specialUid = ensureSpecialUid(slotEl, specialKey) || '';
    const collapseKey = makeCollapseKey('special', head.dataset.specialUid);
    head.className = 'page-tree-row page-tree-node--block';
    head.style.cursor       = 'pointer';
    head.style.padding      = '4px 8px';
    head.style.borderRadius = '8px';
    head.style.fontSize     = '12px';

    // Дочірні елементи: секції → рівні (rows) → контейнери (blocks)
    const sectionSelector = specialKey === 'main'
      ? ':scope > .st-section[data-sec-role="main"]'
      : `.st-section[data-sec-role="${specialKey}"]`;
    const sections = Array.from(slotEl.querySelectorAll(sectionSelector));
    let childUl = null;

    head.addEventListener('click', (ev) => {
      ev.stopPropagation();
      // один клік — тільки вибір/підсвітка; згортання тепер лише подвійним кліком
      selectSpecial(slotEl, specialKey, { scroll: true });
    });
    toggleCollapseOnDblClick(head, collapseKey, childUl);

    if (sections.length) {
      childUl = document.createElement('ul');
      childUl.style.listStyle = 'none';
      childUl.style.margin    = '4px 0 0 12px';
      childUl.style.padding   = '0';
      childUl.style.display   = 'flex';
      childUl.style.flexDirection = 'column';
      childUl.style.gap       = '4px';

      sections.forEach((secEl, si) => {
        childUl.appendChild(makeSpecialSectionNode(specialKey, secEl, si));
      });
    }

    decorateHeadWithControls(head, title, { key: sections.length ? collapseKey : null, childUl: childUl, editable: false });

    li.appendChild(head);
    if (childUl) li.appendChild(childUl);

    return li;
  }

  function makeSpecialSectionNode(specialKey, secEl, si) {
    const li = document.createElement('li');

    const head = document.createElement('div');
    const key = `${specialKey}__sec`;
    head.dataset.specialKey = key;
    head.dataset.specialUid = ensureSpecialUid(secEl, key) || '';
    const collapseKey = makeCollapseKey('special', head.dataset.specialUid);
    head.className = 'page-tree-row';
    head.style.cursor       = 'pointer';
    head.style.padding      = '4px 8px';
    head.style.borderRadius = '8px';
    head.style.fontSize     = '12px';
    let childUl = null;
    head.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectSpecial(secEl, key, { scroll: true });
    });
    toggleCollapseOnDblClick(head, collapseKey, childUl);

    li.appendChild(head);

    // IMPORTANT:
    // У контейнерах (.st-block) може створюватися внутрішній .st-row (wrapper) при DnD.
    // Тому рівні секції беремо ТІЛЬКИ як прямі дочірні .st-row (верхній рівень),
    // і НЕ збираємо вкладені .st-row з контейнерів.
    const levels = Array.from(secEl.querySelectorAll(':scope > .st-row'));
    if (levels.length) {
      childUl = document.createElement('ul');
      childUl.style.listStyle = 'none';
      childUl.style.margin    = '4px 0 0 12px';
      childUl.style.padding   = '0';
      childUl.style.display   = 'flex';
      childUl.style.flexDirection = 'column';
      childUl.style.gap       = '4px';

      levels.forEach((rowEl, ri) => {
        childUl.appendChild(makeSpecialLevelNode(specialKey, rowEl, ri));
      });

      li.appendChild(childUl);
    }

    const secLabelDefault = `Секція ${si + 1}`;
    const secLabel = (secEl && secEl.dataset && secEl.dataset.stTreeName) ? secEl.dataset.stTreeName : secLabelDefault;
    decorateHeadWithControls(head, secLabel, {
      key: levels.length ? collapseKey : null,
      childUl,
      editable: true,
      deleteTarget: { kind: 'special', el: secEl, specialKey: key },
      rename: {
        kind: 'special',
        el: secEl,
        get: () => (secEl && secEl.dataset && secEl.dataset.stTreeName) ? secEl.dataset.stTreeName : secLabelDefault,
        set: (v) => {
          setSpecialTreeName_(secEl, key, v);
        },
      },
    });

    return li;
  }

  function getSpecialElementKind(el) {
    if (!el) return 'block';
    if (el.classList?.contains('st-block--logo')) return 'logo';
    if (el.classList?.contains('st-block--phone')) return 'phone';
    if (el.classList?.contains('st-block--button')) return 'button';
    if (el.classList?.contains('st-block--menu')) return 'menu';
    if (el.classList?.contains('st-block--icon')) return 'icon';
    if (el.classList?.contains('st-block--heading')) return 'heading';
    if (el.classList?.contains('st-block--text')) return 'text';
    return 'block';
  }

  function defaultElementLabel(el, index = 0) {
    const userName = String(el?.dataset?.stTreeName || '').trim();
    if (userName) return userName;
    const kind = getSpecialElementKind(el);
    if (kind === 'logo') return 'Блок Лого';
    if (kind === 'phone') return 'Кнопка Телефон';
    if (kind === 'button') return `Кнопка ${textBrief(el.querySelector?.(':scope > .st-button__label'), 'Запустити')}`;
    if (kind === 'menu') return 'Блок меню';
    if (kind === 'icon') return 'Блок Іконка';
    if (kind === 'heading') return `Заголовок ${index + 1}`;
    if (kind === 'text') return `Текст ${index + 1}`;
    const explicit = String(el?.dataset?.name || el?.dataset?.hbTip || '').trim();
    return explicit || `Блок ${index + 1}`;
  }

  function collectSpecialDomChildren(el) {
    if (!el) return [];
    const kind = getSpecialElementKind(el);
    const out = [];

    const push = (target, role, label) => {
      if (target && !out.some(item => item.el === target && item.role === role)) out.push({ el: target, role, label });
    };

    if (kind === 'logo') {
      const logoIconTarget = el.querySelector(':scope > .st-logo__iconbtn:not([hidden])')
        || el.querySelector(':scope > .st-logo__mark:not([hidden])')
        || el.querySelector(':scope > .st-logo__iconbtn')
        || el.querySelector(':scope > .st-logo__mark');
      push(logoIconTarget, 'icon-inner', 'Іконка');
      push(el.querySelector(':scope > .st-logo__title'), 'text', `Текст: ${textBrief(el.querySelector(':scope > .st-logo__title'))}`);
      push(el.querySelector(':scope > .st-logo__subtitle'), 'text', `Текст: ${textBrief(el.querySelector(':scope > .st-logo__subtitle'))}`);
      return out;
    }

    if (kind === 'phone') {
      push(el.querySelector(':scope > .st-phone__iconbtn'), 'icon-inner', 'Іконка');
      push(el.querySelector(':scope > .st-phone__text'), 'text', `Текст: ${textBrief(el.querySelector(':scope > .st-phone__text'))}`);
      return out;
    }

    if (kind === 'button') {
      push(el.querySelector(':scope > .st-button__label'), 'text', `Текст: ${textBrief(el.querySelector(':scope > .st-button__label'))}`);
      push(el.querySelector(':scope > .st-button__iconbtn'), 'icon-inner', 'Іконка');
      return out;
    }

    if (kind === 'menu') {
      const links = Array.from(el.querySelectorAll('.st-menu__item > .st-menu__link, .st-menu__link[data-st-menu-item="1"], .st-menu__link'));
      const uniqueLinks = links.filter((link, idx) => links.indexOf(link) === idx);
      uniqueLinks.forEach((link, idx) => {
        push(link, 'menuitem', `Кнопка ${idx + 1}: ${textBrief(link, 'Пункт меню')}`);
      });
      return out;
    }

    if (kind === 'icon') {
      const iconTarget = el.querySelector(':scope > .st-icon-btn')
        || el.querySelector(':scope > .st-button__iconbtn, :scope > .st-phone__iconbtn, :scope > .st-logo__iconbtn')
        || el.querySelector(':scope .st-icon-svg')
        || el;
      push(iconTarget, 'icon-inner', iconBrief(iconTarget, 'Іконка меню'));
      return out;
    }

    if (kind === 'text' || kind === 'heading') {
      const textEl = el.querySelector(':scope > .st-text-edit, :scope [data-st-text-target="1"]');
      push(textEl, 'text', `Текст: ${textBrief(textEl)}`);
      return out;
    }

    // generic fallback for future blocks
    Array.from(el.querySelectorAll(':scope > .st-text-edit, :scope > [data-st-text-target="1"]')).forEach((t) => push(t, 'text', `Текст: ${textBrief(t)}`));
    Array.from(el.querySelectorAll(':scope > .st-icon-btn, :scope > .st-button__iconbtn, :scope > .st-logo__iconbtn')).forEach((i) => push(i, 'icon-inner', iconBrief(i, 'Іконка')));
    return out;
  }

  function collectMenuItemChildren(linkEl) {
    const out = [];
    const push = (target, role, label) => {
      if (target && !out.some(item => item.el === target && item.role === role)) out.push({ el: target, role, label });
    };
    push(linkEl?.querySelector?.(':scope > .st-menu__text'), 'text', `Текст: ${textBrief(linkEl?.querySelector?.(':scope > .st-menu__text'), 'Пункт меню')}`);
    push(linkEl?.querySelector?.(':scope > .st-menu__icon, :scope > .st-menu__caret, :scope > .st-icon-svg, :scope > svg'), 'icon-inner', 'Іконка');
    return out;
  }

  function makeDomLeafNode(specialKey, item) {
    const li = document.createElement('li');
    const node = document.createElement('div');
    const role = item.role || 'block';
    const elKey = `${specialKey}__${role}`;
    node.dataset.specialKey = elKey;
    node.dataset.specialUid = ensureSpecialUid(item.el, elKey) || '';
    node.className = `page-tree-block page-tree-node--${role === 'menuitem' ? 'menuitem' : role}`;
    node.style.cursor = 'pointer';
    node.style.padding = '4px 8px';
    node.style.borderRadius = '8px';
    node.style.fontSize = '12px';

    let childUl = null;
    if (role === 'menuitem') {
      const kids = collectMenuItemChildren(item.el);
      if (kids.length) {
        childUl = makeUl('4px 0 0 12px', '2px');
        kids.forEach((kid) => childUl.appendChild(makeDomLeafNode(specialKey, kid)));
      }
    }

    const collapseKey = childUl ? makeCollapseKey('special', node.dataset.specialUid) : null;
    node.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectSpecial(item.el, elKey, { scroll: true });
    });
    toggleCollapseOnDblClick(node, collapseKey, childUl);

    decorateHeadWithControls(node, item.label || defaultElementLabel(item.el), {
      key: childUl ? collapseKey : null,
      childUl,
      editable: true,
      deleteTarget: { kind: 'special', el: item.el, specialKey: elKey },
      rename: {
        kind: 'special',
        el: item.el,
        get: () => (item.el?.dataset?.stTreeName && String(item.el.dataset.stTreeName).trim()) || (item.label || defaultElementLabel(item.el)),
        set: (v) => {
          setSpecialTreeName_(item.el, elKey, v);
        },
      },
    });

    li.appendChild(node);
    if (childUl) li.appendChild(childUl);
    return li;
  }

  function makeSpecialElementNode(specialKey, el, ei) {
    const elLi = document.createElement('li');
    const node = document.createElement('div');
    const elKey = `${specialKey}__elem`;
    node.dataset.specialKey = elKey;
    node.dataset.specialUid = ensureSpecialUid(el, elKey) || '';
    node.className = 'page-tree-block page-tree-node--block';
    const specialElementKind = getSpecialElementKind(el);
    if (specialElementKind === 'icon') node.classList.add('page-tree-node--icon-block');
    if (specialElementKind === 'heading') node.classList.add('page-tree-node--heading');
    node.style.cursor = 'pointer';
    node.style.padding = '4px 8px';
    node.style.borderRadius = '8px';
    node.style.fontSize = '12px';

    const kids = collectSpecialDomChildren(el);
    let childUl = null;
    if (kids.length) {
      childUl = makeUl('4px 0 0 12px', '2px');
      kids.forEach((kid) => childUl.appendChild(makeDomLeafNode(specialKey, kid)));
    }
    const collapseKey = childUl ? makeCollapseKey('special', node.dataset.specialUid) : null;

    node.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectSpecial(el, elKey, { scroll: true });
    });
    toggleCollapseOnDblClick(node, collapseKey, childUl);

    const defaultName = defaultElementLabel(el, ei);
    const displayName = (el?.dataset?.stTreeName && String(el.dataset.stTreeName).trim()) || defaultName;
    decorateHeadWithControls(node, displayName, {
      key: childUl ? collapseKey : null,
      childUl,
      editable: true,
      deleteTarget: { kind: 'special', el, specialKey: elKey },
      rename: {
        kind: 'special',
        el,
        get: () => (el?.dataset?.stTreeName && String(el.dataset.stTreeName).trim()) || defaultName,
        set: (v) => {
          setSpecialTreeName_(el, elKey, v);
        },
      },
    });

    elLi.appendChild(node);
    if (childUl) elLi.appendChild(childUl);
    return elLi;
  }

  function makeSpecialLevelNode(specialKey, rowEl, ri) {
    const li = document.createElement('li');

    const head = document.createElement('div');
    const rowKey = `${specialKey}__row`;
    head.dataset.specialKey = rowKey;
    head.dataset.specialUid = ensureSpecialUid(rowEl, rowKey) || '';
    const collapseKey = makeCollapseKey('special', head.dataset.specialUid);
    head.className = 'page-tree-row';
    head.style.cursor       = 'pointer';
    head.style.padding      = '4px 8px';
    head.style.borderRadius = '8px';
    head.style.fontSize     = '12px';
    let childUl = null;
    head.addEventListener('click', (ev) => {
      ev.stopPropagation();
      selectSpecial(rowEl, rowKey, { scroll: true });
    });
    toggleCollapseOnDblClick(head, collapseKey, childUl);

    li.appendChild(head);

    // Контейнери всередині рівня: прямі .st-block (колонки/контейнери)
    // Усередині контейнерів — реальні елементи (.hb-elem): Text/Icon/Menu тощо.
    const containers = Array.from(rowEl.querySelectorAll(':scope > .st-block'));
    if (containers.length) {
      childUl = document.createElement('ul');
      childUl.style.listStyle = 'none';
      childUl.style.margin    = '4px 0 0 12px';
      childUl.style.padding   = '0';
      childUl.style.display   = 'flex';
      childUl.style.flexDirection = 'column';
      childUl.style.gap       = '4px';

      const showIndex = containers.length > 1;

      // CONTENT: прямі .st-block у рівні — це реальні блоки секції, а не службові контейнери шапки/футера.
      // Тому показуємо їх як Блок/Текст/Заголовок з власними дочірніми текстами/іконками.
      if (String(specialKey) === 'removed-content') {
        containers.forEach((contEl, ci) => {
          childUl.appendChild(makeSpecialElementNode(specialKey, contEl, ci));
        });
        li.appendChild(childUl);
      } else {
      containers.forEach((contEl, ci) => {
        const contLi = document.createElement('li');

        const contHead = document.createElement('div');
        const contKey = `${specialKey}__container`;
        contHead.dataset.specialKey = contKey;
        contHead.dataset.specialUid = ensureSpecialUid(contEl, contKey) || '';
        const contCollapseKey = makeCollapseKey('special', contHead.dataset.specialUid);

        contHead.className = 'page-tree-row page-tree-node--container';
        contHead.style.cursor       = 'pointer';
        contHead.style.padding      = '4px 8px';
        contHead.style.borderRadius = '8px';
        contHead.style.fontSize     = '12px';

        let contChildUl = null;

        contHead.addEventListener('click', (ev) => {
          ev.stopPropagation();
          selectSpecial(contEl, contKey, { scroll: true });
        });
        toggleCollapseOnDblClick(contHead, contCollapseKey, contChildUl);

        // --- elements inside container ---
        // IMPORTANT:
        // Під час DnD код може додати wrapper ':scope > .st-row' всередині контейнера
        // і вже туди переміщати leaf-блоки (.hb-elem). Тому збираємо блоки з:
        //   1) прямих дітей контейнера
        //   2) або прямих дітей внутрішнього wrapper-row
        // Далі кожен leaf-блок отримує власне піддерево: меню -> пункти -> текст/іконка,
        // кнопка/телефон/лого -> внутрішні текстові поля та іконки.
        const innerContRow = contEl.querySelector(':scope > .st-row');
        const elems = [
          ...Array.from(contEl.querySelectorAll(':scope > .hb-elem')),
          ...Array.from(innerContRow ? innerContRow.querySelectorAll(':scope > .hb-elem') : []),
        ].filter((el, idx, arr) => el && arr.indexOf(el) === idx);

        if (elems.length) {
          contChildUl = makeUl('4px 0 0 12px', '2px');
          elems.forEach((el, ei) => {
            contChildUl.appendChild(makeSpecialElementNode(specialKey, el, ei));
          });
        }

        const contLabelDefault = showIndex ? `Контейнер ${ci + 1}` : 'Контейнер';
        const contLabel = (contEl?.dataset?.stTreeName && String(contEl.dataset.stTreeName).trim()) || contLabelDefault;

        decorateHeadWithControls(contHead, contLabel, {
          key: contChildUl ? contCollapseKey : null,
          childUl: contChildUl,
          editable: true,
          deleteTarget: { kind: 'special', el: contEl, specialKey: contKey },
          rename: {
            kind: 'special',
            el: contEl,
            get: () => (contEl?.dataset?.stTreeName && String(contEl.dataset.stTreeName).trim()) || contLabelDefault,
            set: (v) => {
              setSpecialTreeName_(contEl, contKey, v);
            },
          },
        });

        contLi.appendChild(contHead);
        if (contChildUl) contLi.appendChild(contChildUl);
        childUl.appendChild(contLi);
      });

      li.appendChild(childUl);
      }
    }

    const lvlLabelDefault = `Рівень ${ri + 1}`;
    const lvlLabel = (rowEl && rowEl.dataset && rowEl.dataset.stTreeName) ? rowEl.dataset.stTreeName : lvlLabelDefault;
    decorateHeadWithControls(head, lvlLabel, {
      key: containers.length ? collapseKey : null,
      childUl,
      editable: true,
      deleteTarget: { kind: 'special', el: rowEl, specialKey: rowKey },
      rename: {
        kind: 'special',
        el: rowEl,
        get: () => (rowEl && rowEl.dataset && rowEl.dataset.stTreeName) ? rowEl.dataset.stTreeName : lvlLabelDefault,
        set: (v) => {
          setSpecialTreeName_(rowEl, rowKey, v);
        },
      },
    });

    return li;
  }

  function makeRowNode(rowId, index) {
    const row = siteState.rows[rowId];

    const li = document.createElement('li');

    const head = document.createElement('div');
    head.dataset.rowId      = rowId;
    const labelText         = row?.name || (index === 0 ? 'CONTENT' : `Секція ${index}`);
    const collapseKey       = makeCollapseKey('row', rowId);
    head.className          = 'page-tree-row';
    head.style.cursor       = 'pointer';
    head.style.padding      = '4px 8px';
    head.style.borderRadius = '8px';
    head.style.fontSize     = '12px';

    let childUl = null;
    head.addEventListener('click', (ev) => {
      const append = ev.ctrlKey || ev.metaKey;
      ev.stopPropagation();
      selectRow(rowId, { append, scroll: !append });
    });
    toggleCollapseOnDblClick(head, collapseKey, childUl);

    if (selectedRowIds.has(rowId) && selectionMode === 'row') {
      head.classList.add('page-tree-row--active');
    }

    const children = row?.children || [];
    if (children.length) {
      childUl = document.createElement('ul');
      childUl.style.listStyle     = 'none';
      childUl.style.margin        = '4px 0 0 12px';
      childUl.style.padding       = '0';
      childUl.style.display       = 'flex';
      childUl.style.flexDirection = 'column';
      childUl.style.gap           = '2px';

      children.forEach((bid, idx) => {
        childUl.appendChild(makeBlockNode(bid, idx, 'Блок'));
      });
    }

    const isContentRoot = (index === 0);
    const displayLabel = isContentRoot ? 'CONTENT' : labelText;
    decorateHeadWithControls(head, displayLabel, {
      key: children.length ? collapseKey : null,
      childUl,
      editable: !isContentRoot,
      deleteTarget: !isContentRoot ? { kind: 'row', id: rowId } : null,
      rename: !isContentRoot ? {
        kind: 'row',
        id: rowId,
        get: () => (siteState.rows[rowId] && siteState.rows[rowId].name) ? siteState.rows[rowId].name : displayLabel,
        set: (v) => {
          if (!siteState.rows[rowId]) return;
          siteState.rows[rowId].name = v;
          renderTree();
        },
      } : null,
    });

    li.appendChild(head);
    if (childUl) li.appendChild(childUl);

    return li;
  }

 function makeBlockNode(blockId, index, prefix) {
  const b = siteState.blocks[blockId];

  const li = document.createElement('li');

  const line = document.createElement('div');
  line.dataset.blockId = blockId;

  // 🔹 Визначаємо тип блока (строго по state). Для старих/мігрованих блоків:
  // - якщо kind не заданий, але є textHtml -> це текст
  // - якщо kind не заданий, але є articleHtml -> це стаття
  const kind = b?.kind || (
    (typeof b?.articleHtml === 'string' ? 'article' : (typeof b?.textHtml === 'string' ? 'text' : 'block'))
  );

  // 🔹 Формуємо підпис для дерева
  let label = b?.name || '';

  if (!label) {
    if (kind === 'line') {
      label = 'Лінія';
    } else if (kind === 'text') {
      // Нумерація тільки серед текстових блоків (не залежить від "Блок 1/2/3").
      // Важливо: призначаємо номер у порядку побудови дерева.
      const n = getOrAssignTypeIndex('text', blockId);
      label = `Текст ${n}`;
    } else if (kind === 'article') {
      // Нумерація тільки серед блоків "Стаття".
      // Важливо: призначаємо номер у порядку побудови дерева.
      const n = getOrAssignTypeIndex('article', blockId);
      label = `Стаття ${n}`;
    } else {
      label = `${prefix} ${index + 1}`;
    }
  }

  const collapseKey = makeCollapseKey('block', blockId);
  line.className          = 'page-tree-block page-tree-node--block';
  line.style.cursor       = 'pointer';
  line.style.padding      = '3px 8px';
  line.style.borderRadius = '6px';
  line.style.fontSize     = '12px';

  let childUl = null;

  line.addEventListener('click', (ev) => {
    const append = ev.ctrlKey || ev.metaKey;
    ev.stopPropagation();
    selectBlock(blockId, { append, scroll: !append });
  });
  toggleCollapseOnDblClick(line, collapseKey, childUl);

  if (selectedBlockIds.has(blockId) && selectionMode === 'block') {
    line.classList.add('page-tree-block--active');
  }

  if (b?.childrenRow) {
    const innerRow      = siteState.rows[b.childrenRow];
    const innerChildren = innerRow?.children || [];
    if (innerChildren.length) {
      childUl = document.createElement('ul');
      childUl.style.listStyle     = 'none';
      childUl.style.margin        = '4px 0 0 12px';
      childUl.style.padding       = '0';
      childUl.style.display       = 'flex';
      childUl.style.flexDirection = 'column';
      childUl.style.gap           = '2px';

      innerChildren.forEach((cid, idx) => {
        childUl.appendChild(makeBlockNode(cid, idx, 'Вкладений блок'));
      });
    }
  }

  decorateHeadWithControls(line, label, {
    key: childUl ? collapseKey : null,
    childUl,
    editable: true,
    deleteTarget: { kind: 'block', id: blockId },
    rename: {
      kind: 'block',
      id: blockId,
      get: () => (siteState.blocks[blockId] && siteState.blocks[blockId].name) ? siteState.blocks[blockId].name : label,
      set: (v) => {
        if (!siteState.blocks[blockId]) return;
        siteState.blocks[blockId].name = v;
        renderTree();
      },
    },
  });

  li.appendChild(line);
  if (childUl) li.appendChild(childUl);

  return li;
}



  // ---------- синхронізація від полотна → дерево ----------

  // ✅ Головний зворотній міст: будь-яка зміна selection у дизайні
  // (клік по елементу, зміна режимів, вибір у Header/Footer builder тощо)
  // повинна підсвічувати відповідний вузол у дереві.
  // Джерело правди — подія `st:selection-changed` (див. js/selection/selection-manager.js).
  document.addEventListener('st:selection-changed', (ev) => {
    const sel = ev && ev.detail;
    if (!sel) return;

    // Не чіпаємо, якщо дерева ще немає (але стан збережемо) —
    // щоб при відкритті панелі підсвітка одразу наклалась.
    resetSelection();

    const els = Array.isArray(sel.elements) ? sel.elements.filter(Boolean) : [];
    const type = sel.type || null;

    // ---- CANVAS ----
    if (type === 'block') {
      selectionMode = 'block';
      els.forEach(el => {
        const id = el?.dataset?.uid;
        if (id) selectedBlockIds.add(id);
      });
      updateTreeSelection();
      // скролимо до першого активного вузла, якщо дерево відкрите
      if (treeVisible) {
        const firstId = [...selectedBlockIds][0];
        const node = firstId ? treeRoot.querySelector(`[data-block-id="${firstId}"]`) : null;
        node?.scrollIntoView?.({ block: 'nearest' });
      }
      return;
    }

    if (type === 'row') {
      const firstRow = els[0] || null;
      if (firstRow && siteRoot.contains(firstRow) && !firstRow.closest?.('#st-site-header-slot, #st-site-footer-slot')) {
        const key = 'main__row';
        specialSelectedEl = firstRow;
        specialSelectedKey = key;
        specialSelectedUid = ensureSpecialUid(firstRow, key);
        updateTreeSelection();
        if (treeVisible) {
          const node = specialSelectedUid ? findSpecialTreeNode_(specialSelectedUid, specialSelectedKey) : null;
          node?.scrollIntoView?.({ block: 'nearest' });
        }
        return;
      }

      selectionMode = 'row';
      els.forEach(el => {
        const id = el?.dataset?.uid;
        if (id) selectedRowIds.add(id);
      });
      updateTreeSelection();
      return;
    }

    // Секція Content тепер у дереві є реальним DOM-вузлом: CONTENT → Секція → Рівні.
    if (type === 'section') {
      const secEl = els[0] || null;
      if (secEl && siteRoot.contains(secEl) && !secEl.closest?.('#st-site-header-slot, #st-site-footer-slot')) {
        const key = 'main__sec';
        specialSelectedEl = secEl;
        specialSelectedKey = key;
        specialSelectedUid = ensureSpecialUid(secEl, key);
        updateTreeSelection();
        if (treeVisible) {
          const node = specialSelectedUid ? findSpecialTreeNode_(specialSelectedUid, specialSelectedKey) : null;
          node?.scrollIntoView?.({ block: 'nearest' });
        }
        return;
      }

      selectionMode = 'row';
      els.forEach(sec => {
        const rowEl = sec?.querySelector?.(':scope > .st-row');
        const rid = rowEl?.dataset?.uid;
        if (rid) selectedRowIds.add(rid);
      });
      updateTreeSelection();
      return;
    }

    // ---- HEADER / MAIN / FOOTER ----
    // У дереві всі три SiteFrame-області живуть як однакові "special" вузли
    // з data-special-uid. Джерело області — detail.area; prefix type лишається
    // сумісним для старих подій Header/Footer.

    const selectionArea = String(sel.area || '').toLowerCase();
    const typeName = String(type || '').toLowerCase();
    const isHeader = selectionArea === 'header' || typeName.startsWith('header');
    const isMain = selectionArea === 'main' || typeName.startsWith('main');
    const isFooter = selectionArea === 'footer' || typeName.startsWith('footer');
    if (isHeader || isMain || isFooter) {
      const rootKey = isHeader ? 'header' : (isMain ? 'main' : 'footer');
      const slotId = rootKey === 'header' ? 'st-site-header-slot' : rootKey === 'main' ? 'st-site-main-slot' : 'st-site-footer-slot';
      const slotEl = document.getElementById(slotId);
      if (!slotEl) {
        updateTreeSelection();
        return;
      }

      // (1) кореневий вибір (header/footer як ціле)
      if (type === rootKey) {
        specialSelectedEl = slotEl;
        specialSelectedKey = rootKey;
        specialSelectedUid = ensureSpecialUid(slotEl, rootKey);
        updateTreeSelection();
        if (treeVisible) {
          const node = specialSelectedUid ? findSpecialTreeNode_(specialSelectedUid, specialSelectedKey) : null;
          node?.scrollIntoView?.({ block: 'nearest' });
        }
        return;
      }

      // (2) inner: намагаємось підсвітити найбільш конкретний вузол, який існує в дереві
      const el = els[0] || null;
      if (!el) {
        updateTreeSelection();
        return;
      }

      // Визначаємо максимально конкретний вузол, який вже існує в дереві:
      // текстове поле / іконка / пункт меню / leaf-блок / контейнер / рівень / секція.
      let key = `${rootKey}__sec`;
      let targetEl = el.closest?.(`.st-section[data-sec-role="${rootKey}"]`) || el.closest?.('.st-section') || el;

      const textEl = el.matches?.('.st-text-edit, .st-menu__text, .st-button__label, .st-phone__text, .st-logo__title, .st-logo__subtitle')
        ? el
        : el.closest?.('.st-text-edit, .st-menu__text, .st-button__label, .st-phone__text, .st-logo__title, .st-logo__subtitle');
      if (textEl) {
        key = `${rootKey}__text`;
        targetEl = textEl;
      } else {
        const iconEl = el.matches?.('.st-icon-btn, .st-button__iconbtn, .st-phone__iconbtn, .st-logo__iconbtn, .st-logo__mark, .st-icon-svg, .st-phone__iconsvg, .st-button__iconsvg')
          ? el
          : el.closest?.('.st-icon-btn, .st-button__iconbtn, .st-phone__iconbtn, .st-logo__iconbtn, .st-logo__mark, .st-icon-svg, .st-phone__iconsvg, .st-button__iconsvg');
        if (iconEl) {
          key = `${rootKey}__icon`;
          targetEl = iconEl;
        } else {
          const menuItemEl = el.matches?.('.st-menu__link, [data-st-menu-item="1"]')
            ? el
            : el.closest?.('.st-menu__link, [data-st-menu-item="1"]');
          if (menuItemEl) {
            key = `${rootKey}__menuitem`;
            targetEl = menuItemEl;
          } else {
            const rowEl = el.classList?.contains('st-row') ? el : el.closest?.('.st-row');
            const blockEl = el.classList?.contains('st-block') ? el : el.closest?.('.st-block');

            if (blockEl && blockEl.classList?.contains('hb-elem')) {
              key = `${rootKey}__elem`;
              targetEl = blockEl;
            } else if (blockEl && rowEl && blockEl.parentElement === rowEl) {
              key = `${rootKey}__container`;
              targetEl = blockEl;
            } else if (rowEl) {
              key = `${rootKey}__row`;
              targetEl = rowEl;
            }

            if (el.classList?.contains('st-section')) {
              key = `${rootKey}__sec`;
              targetEl = el;
            }
          }
        }
      }

      specialSelectedEl = targetEl;
      specialSelectedKey = key;
      specialSelectedUid = ensureSpecialUid(targetEl, key);
      updateTreeSelection();
      if (treeVisible) {
        const node = specialSelectedUid ? findSpecialTreeNode_(specialSelectedUid, specialSelectedKey) : null;
        node?.scrollIntoView?.({ block: 'nearest' });
      }
      return;
    }

    // якщо selection очистили — просто знімемо підсвітку
    updateTreeSelection();
  });

  siteRoot.addEventListener('click', (e) => {
    // [00891] Header/Main/Footer visual selection is owned by explicit SiteFrame slot listeners.
    // The legacy page-state click path must not reinterpret the same DOM node.
    try {
      const t00580 = e.target instanceof Element ? e.target : null;
      if (t00580?.closest?.('#st-site-main-slot')) return;
      if (t00580?.closest?.('#st-site-header-slot') && document.body.classList.contains('st-header-builder-on')) return;
      if (t00580?.closest?.('#st-site-footer-slot') && document.body.classList.contains('st-footer-builder-on')) return;
    } catch (_) {}

    const append = e.ctrlKey || e.metaKey;

    // 1) якщо клік по блоку — виділяємо блок
    const blockEl = e.target.closest('.st-block');
    if (blockEl && siteRoot.contains(blockEl)) {
      const id = blockEl.dataset.uid;
      if (id) selectBlock(id, { append, scroll: false });
      return;
    }

    // 2) якщо клік по секції (карточці) — виділяємо секцію (row)
    const secEl = e.target.closest('.st-section');
    if (secEl && siteRoot.contains(secEl)) {
      const rowEl = secEl.querySelector(':scope > .st-row');
      const rid   = rowEl && rowEl.dataset.uid;
      if (rid) selectRow(rid, { append, scroll: false });
      return;
    }

    // інших випадків не чіпаємо (клік в пусте місце полотна)
  });

  // ---------- дерево завжди показане з 00281 ----------

  if (toggleBtn) {
    toggleBtn.style.display = 'none';
    toggleBtn.setAttribute('aria-hidden', 'true');
  }

  wrap.style.display = 'block';
  treeVisible = true;
  renderTree();

  // ---------- auto rebuild on DOM changes ----------

  const mo = new MutationObserver(() => {
    if (!treeVisible) return;
    renderTree();
  });
  mo.observe(siteRoot, { childList: true, subtree: true });
}
