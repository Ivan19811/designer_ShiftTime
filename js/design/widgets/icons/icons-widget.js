// js/design/widgets/icons/icons-widget.js
// Віджет "Іконки": вибір іконки з Галереї → вставка IconBlock або заміна активної іконки.
// 00497: додано preview активної іконки + кнопку "Замінити" для будь-якої іконки в Header/Footer.

import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
import { galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';
import { ensureBlock, saveStateNow } from '../../../site-state.js';

const LAST_PICK_KEY = 'st_icons_widget_last_pick_v1';

const ICON_FACE_SEL_ = [
  '.st-icon-btn',
  '.st-button__iconbtn',
  '.st-phone__iconbtn',
  '.st-logo__iconbtn',
  '.st-logo__mark'
].join(',');

const ICON_INNER_SEL_ = [
  '.st-icon-wrap',
  '.st-icon-svg',
  '.st-icon-btn__glyph',
  '.st-phone__iconsvg',
  '.st-button__iconsvg',
  '.st-logo__iconsvg',
  'svg'
].join(',');

const ICON_OWNER_SEL_ = [
  '.st-block--icon',
  '[data-block-kind="icon"]',
  '[data-block-role="icon"]',
  '.st-block--phone',
  '.st-block--button',
  '.st-block--logo'
].join(',');

function dlog_(event, detail = {}, level = 'info') {
  try { window.__ST_PERF_DIAG__?.push?.(event, detail, level); } catch (_) {}
  try { window.ST_AI_DEBUG_LOG?.push?.(event, detail, level); } catch (_) {}
}

function buildSection_() {
  const wrap = document.createElement('section');
  wrap.className = 'design-section';
  wrap.dataset.section = 'icons';

  wrap.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <span class="design-section__header-title">Іконки</span>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body">
      <div class="design-field">
        <div class="design-field__label">Активна іконка на сторінці</div>
        <div class="st-icons-active-preview" style="min-height:66px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(148,163,184,.22); border-radius:12px; background:rgba(15,23,42,.18); color:#e5e7eb; overflow:hidden;">
          <span class="st-icons-active-empty" style="opacity:.65; font-size:12px; text-align:center; padding:8px;">Клікни по іконці на сторінці</span>
          <span class="st-icons-active-svg" style="display:none; width:42px; height:42px; align-items:center; justify-content:center; color:inherit;"></span>
        </div>
        <div class="st-icons-active-name" style="margin-top:6px; opacity:.72; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Активної іконки немає</div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Вибрана іконка з галереї</div>
        <div class="design-field__row" style="justify-content: space-between;">
          <div class="st-icons-picked" style="opacity:.85; font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width: 68%;">
            Нічого не вибрано
          </div>
          <button class="design-pill st-icons-pick" type="button" title="Відкрити Галерею → Іконки">📁</button>
        </div>
      </div>

      <div class="design-field">
        <div class="design-pill-group" style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="design-pill st-icons-insert" type="button" disabled>Вставити іконку</button>
          <button class="design-pill st-icons-replace" type="button" disabled title="Замінити активну іконку на сторінці">Замінити</button>
        </div>
        <div style="margin-top:6px; opacity:.72; font-size:12px;">
          <b>Вставити</b> — додає нову іконку. <b>Замінити</b> — відкриває галерею й міняє активну іконку.
        </div>
      </div>
    </div>
  `;

  return wrap;
}

function toggleOpen_(sectionEl) {
  const isOpen = sectionEl.classList.toggle('is-open');
  const header = sectionEl.querySelector('.design-section__header');
  if (header) header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

function normalizeSvgToCurrentColor_(svgText) {
  if (!svgText || typeof svgText !== 'string') return '';

  let s = svgText;
  s = s.replace(/<\?xml[^>]*>\s*/gi, '');
  s = s.replace(/<!doctype[^>]*>\s*/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>\s*/gi, '');
  s = s.replace(/\sstroke="[^"]*"/gi, ' stroke="currentColor"');
  s = s.replace(/\sfill="(?!none)(?!url\()[^"]*"/gi, ' fill="currentColor"');
  s = s.replace(/style="([\s\S]*?)"/gi, (m, css) => {
    let c = String(css);
    c = c.replace(/fill\s*:\s*(?!none)(?!url\()[^;\"]+/gi, 'fill:currentColor');
    c = c.replace(/stroke\s*:\s*[^;\"]+/gi, 'stroke:currentColor');
    return `style="${c}"`;
  });
  s = s.replace(/\s(width|height)="[^"]*"/gi, '');
  return s.trim();
}

async function loadSvgFromGalleryItem_(cat, folderId, itemId) {
  const items = await galListItems(cat, folderId);
  const item = (items || []).find(x => String(x.id) === String(itemId));
  if (!item) return { name: '', svg: '', url: '' };
  const url = galMakeObjectUrl(item);
  if (!url) return { name: item.name || '', svg: '', url: '' };

  const res = await fetch(url);
  const txt = await res.text();
  return { name: item.name || '', svg: normalizeSvgToCurrentColor_(txt), url };
}

async function loadSvgFromPayload_(payload, stateFallback = {}) {
  if (!payload || !payload.itemId) return { name: '', svg: '', url: '' };
  if (payload.url) {
    try {
      const res = await fetch(String(payload.url));
      const txt = await res.text();
      return { name: payload.name || '', svg: normalizeSvgToCurrentColor_(txt), url: String(payload.url) };
    } catch (e) {
      return { name: payload.name || '', svg: '', url: String(payload.url) };
    }
  }
  const folderId = payload.folderId || stateFallback.folderId || '';
  return loadSvgFromGalleryItem_('icons', folderId, payload.itemId);
}

function restoreLastPick_() {
  try {
    const raw = localStorage.getItem(LAST_PICK_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !p.itemId || !p.folderId) return null;
    return p;
  } catch (e) {
    return null;
  }
}

function saveLastPick_(p) {
  try { localStorage.setItem(LAST_PICK_KEY, JSON.stringify(p || {})); } catch (e) {}
}

function nodeEl_(node) {
  return node && node.nodeType === 1 ? node : node?.parentElement || null;
}

function iconScope_(el) {
  if (!el || !el.closest) return 'main';
  if (el.closest('#st-site-header-slot')) return 'header';
  if (el.closest('#st-site-footer-slot')) return 'footer';
  return 'main';
}

function isRealIconOwner_(el) {
  if (!(el instanceof HTMLElement)) return false;
  if (el.matches?.('.st-block--icon, [data-block-kind="icon"], [data-block-role="icon"]')) return true;
  // Phone/button/logo are valid icon owners only when they actually contain an icon face.
  if (el.matches?.('.st-block--phone, .st-block--button, .st-block--logo')) {
    return !!el.querySelector?.(ICON_FACE_SEL_ + ', ' + ICON_INNER_SEL_);
  }
  return false;
}

function resolveIconTargetFromElement_(raw) {
  const start = nodeEl_(raw);
  if (!(start instanceof HTMLElement)) return null;
  if (start.closest?.('#design-panel-root, #design-panel, .builder__settings, .builder__sidebar, .stg-modal, .sttpl-modal, .hb-panel, .fb-panel')) return null;

  const inner = start.matches?.(ICON_INNER_SEL_) ? start : start.closest?.(ICON_INNER_SEL_);
  const face = start.matches?.(ICON_FACE_SEL_) ? start : start.closest?.(ICON_FACE_SEL_);
  const owner = start.matches?.(ICON_OWNER_SEL_) ? start : start.closest?.(ICON_OWNER_SEL_);

  const candidate = inner || face || owner;
  if (!(candidate instanceof HTMLElement)) return null;

  const scope = iconScope_(candidate);
  const ownerEl = (owner instanceof HTMLElement && isRealIconOwner_(owner)) ? owner : (face?.closest?.(ICON_OWNER_SEL_) || inner?.closest?.(ICON_OWNER_SEL_) || null);
  const paintEl = resolvePaintElement_(candidate, ownerEl || candidate);
  if (!(paintEl instanceof HTMLElement)) return null;

  return {
    scope,
    raw: candidate,
    owner: ownerEl instanceof HTMLElement ? ownerEl : candidate,
    face: face instanceof HTMLElement ? face : (paintEl.closest?.(ICON_FACE_SEL_) || null),
    paint: paintEl,
    name: readIconName_(ownerEl || face || paintEl),
  };
}

function resolveIconTargetFromSelection_(sel) {
  const raw = sel?.element || sel?.el || (Array.isArray(sel?.elements) ? sel.elements[0] : null);
  return resolveIconTargetFromElement_(raw);
}

function resolvePaintElement_(raw, owner) {
  const start = nodeEl_(raw);
  const own = owner instanceof HTMLElement ? owner : start;
  if (!start && !own) return null;

  // Icon block.
  const iconBlock = (own?.matches?.('.st-block--icon, [data-block-kind="icon"], [data-block-role="icon"]') ? own : start?.closest?.('.st-block--icon, [data-block-kind="icon"], [data-block-role="icon"]')) || null;
  if (iconBlock) {
    const wrap = iconBlock.querySelector(':scope > .st-icon-wrap') || iconBlock.querySelector('.st-icon-wrap, .st-icon-svg, .st-icon-btn__glyph, svg');
    if (wrap instanceof HTMLElement) return wrap;
  }

  // If user clicked exact glyph/span/svg.
  if (start?.matches?.('.st-icon-wrap, .st-icon-svg, .st-icon-btn__glyph, .st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg')) return start;
  if (start?.tagName?.toLowerCase?.() === 'svg') {
    const parentGlyph = start.closest?.('.st-icon-wrap, .st-icon-svg, .st-icon-btn__glyph, .st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg');
    return parentGlyph instanceof HTMLElement ? parentGlyph : start;
  }

  const searchRoot = own || start;
  const byOwner = searchRoot?.querySelector?.('.st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg, .st-icon-svg, .st-icon-btn__glyph, .st-icon-wrap, svg');
  if (byOwner instanceof HTMLElement) return byOwner;

  const face = start?.matches?.(ICON_FACE_SEL_) ? start : start?.closest?.(ICON_FACE_SEL_);
  const byFace = face?.querySelector?.('.st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg, .st-icon-svg, .st-icon-btn__glyph, svg');
  if (byFace instanceof HTMLElement) return byFace;

  return face instanceof HTMLElement ? face : null;
}

function readIconName_(el) {
  try {
    if (!(el instanceof HTMLElement)) return '';
    return String(el.dataset?.iconName || el.getAttribute('data-icon-name') || el.dataset?.name || el.getAttribute('aria-label') || '').trim();
  } catch (_) { return ''; }
}

function iconHtmlForPreview_(target) {
  try {
    const p = target?.paint;
    if (!(p instanceof HTMLElement)) return '';
    if (p.tagName.toLowerCase() === 'svg') return p.outerHTML || '';
    const svg = p.querySelector?.('svg');
    if (svg) return svg.outerHTML || '';
    return p.innerHTML || '';
  } catch (_) { return ''; }
}

function setIconHtml_(paintEl, svg) {
  if (!(paintEl instanceof HTMLElement)) return false;
  const next = String(svg || '').trim();
  if (!next) return false;

  if (paintEl.tagName.toLowerCase() === 'svg') {
    const tmp = document.createElement('div');
    tmp.innerHTML = next;
    const nextSvg = tmp.querySelector('svg');
    if (nextSvg && paintEl.parentElement) {
      paintEl.replaceWith(nextSvg);
      return true;
    }
  }
  paintEl.innerHTML = next;
  return true;
}

function persistReplacement_(target, payload = {}) {
  if (!target || !target.owner) return;
  const scope = target.scope || iconScope_(target.owner);
  const name = String(payload.name || '').trim();
  const color = payload.color ? String(payload.color) : '';

  try {
    if (name) {
      target.owner.dataset.iconName = name;
      target.owner.setAttribute('data-icon-name', name);
      if (!target.owner.dataset.name) target.owner.dataset.name = name;
    }
  } catch (_) {}

  if (scope === 'main') {
    try {
      const iconBlock = target.owner.closest?.('.st-block--icon, [data-block-kind="icon"], [data-block-role="icon"]') || target.owner;
      const id = iconBlock?.dataset?.uid || iconBlock?.getAttribute?.('data-uid') || '';
      if (id) {
        const b = ensureBlock(String(id));
        if (b) {
          const wrap = iconBlock.querySelector?.(':scope > .st-icon-wrap') || target.paint;
          b.kind = 'icon';
          b.iconSvg = wrap ? (wrap.innerHTML || '') : String(payload.svg || '');
          if (name) b.iconName = name;
          if (color) b.iconColor = color;
        }
      }
    } catch (_) {}
    try { saveStateNow(); } catch (_) {}
    try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: 'icons-widget-replace-00497', draft: false, forceContent: false }); } catch (_) {}
  } else if (scope === 'header') {
    try { window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('header', 'icons-widget-replace-00497'); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('st:header-icon-replaced-00497', { detail: { target: target.owner, name } })); } catch (_) {}
  } else if (scope === 'footer') {
    try { window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('footer', 'icons-widget-replace-00497'); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('st:footer-icon-replaced-00497', { detail: { target: target.owner, name } })); } catch (_) {}
  }
}

function ensureSelectedAfterReplace_(target) {
  try {
    const el = target?.owner || target?.face || target?.paint;
    if (!(el instanceof HTMLElement)) return;
    if (window.ST_SELECTION?.setActive) window.ST_SELECTION.setActive(el);
    else if (window.ST_SELECTION?.setSingle) window.ST_SELECTION.setSingle(el, { type: 'block' });
    el.classList.add('is-active', 'is-selected');
    document.dispatchEvent(new CustomEvent('st:selection-changed', {
      detail: {
        type: target.scope === 'header' ? 'header-inner' : (target.scope === 'footer' ? 'footer-inner' : 'block'),
        element: el,
        el,
        elements: [el]
      }
    }));
  } catch (_) {}
}

export function initIconsWidget(host, getSelection) {
  if (!host) return;

  const section = buildSection_();
  host.appendChild(section);

  const headerBtn = section.querySelector('.design-section__header');
  const pickBtn = section.querySelector('.st-icons-pick');
  const insertBtn = section.querySelector('.st-icons-insert');
  const replaceBtn = section.querySelector('.st-icons-replace');
  const pickedEl = section.querySelector('.st-icons-picked');
  const activeNameEl = section.querySelector('.st-icons-active-name');
  const activeEmptyEl = section.querySelector('.st-icons-active-empty');
  const activeSvgEl = section.querySelector('.st-icons-active-svg');

  const state = {
    cat: 'icons',
    folderId: null,
    itemId: null,
    name: '',
    svg: '',
    theme: 'light',
    color: '#ffffff',
    activeTarget: null,
  };

  if (headerBtn) {
    headerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleOpen_(section);
    });
  }

  function syncUi_() {
    if (pickedEl) pickedEl.textContent = state.name ? state.name : 'Нічого не вибрано';
    if (insertBtn) insertBtn.disabled = !state.svg;
    const activeOk = !!(state.activeTarget && state.activeTarget.paint && state.activeTarget.paint.isConnected);
    if (replaceBtn) replaceBtn.disabled = !activeOk;

    if (activeOk) {
      const html = iconHtmlForPreview_(state.activeTarget);
      if (activeSvgEl) {
        activeSvgEl.innerHTML = html || '';
        activeSvgEl.style.display = html ? 'flex' : 'none';
      }
      if (activeEmptyEl) activeEmptyEl.style.display = html ? 'none' : 'block';
      if (activeNameEl) {
        const scopeLabel = state.activeTarget.scope === 'header' ? 'Шапка' : (state.activeTarget.scope === 'footer' ? 'Футер' : 'Canvas');
        activeNameEl.textContent = `${scopeLabel}: ${state.activeTarget.name || 'Іконка'}`;
      }
    } else {
      if (activeSvgEl) {
        activeSvgEl.innerHTML = '';
        activeSvgEl.style.display = 'none';
      }
      if (activeEmptyEl) activeEmptyEl.style.display = 'block';
      if (activeNameEl) activeNameEl.textContent = 'Активної іконки немає';
    }
  }

  function setActiveTarget_(target, reason = '') {
    if (target && target.paint && target.paint.isConnected) {
      state.activeTarget = target;
      dlog_('icons-widget-active-icon-00497', {
        reason,
        scope: target.scope,
        ownerCls: target.owner?.className || '',
        paintCls: target.paint?.className || target.paint?.tagName || '',
        name: target.name || ''
      }, 'info');
    } else {
      state.activeTarget = null;
    }
    syncUi_();
  }

  function refreshFromSelection_(reason = 'selection') {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    const target = resolveIconTargetFromSelection_(sel);
    if (target) setActiveTarget_(target, reason);
    else syncUi_();
  }

  const last = restoreLastPick_();
  if (last) {
    state.folderId = last.folderId;
    state.itemId = last.itemId;
    state.name = last.name || '';
    (async () => {
      try {
        const loaded = await loadSvgFromGalleryItem_('icons', state.folderId, state.itemId);
        state.name = loaded.name || state.name;
        state.svg = loaded.svg || '';
        syncUi_();
      } catch (e) { syncUi_(); }
    })();
  }
  syncUi_();
  setTimeout(() => refreshFromSelection_('init'), 0);

  async function applyGalleryPayloadToState_(payload) {
    if (!payload || !payload.itemId) return false;
    state.folderId = payload.folderId;
    state.itemId = payload.itemId;
    state.theme = payload.iconTheme ? String(payload.iconTheme) : state.theme;
    state.color = payload.defaultColor ? String(payload.defaultColor) : state.color;
    const loaded = await loadSvgFromPayload_(payload, state);
    state.name = loaded.name || payload.name || '';
    state.svg = loaded.svg || '';
    saveLastPick_({ folderId: state.folderId, itemId: state.itemId, name: state.name, theme: state.theme, color: state.color });
    syncUi_();
    return !!state.svg;
  }

  async function replaceActiveWithState_(payload = null) {
    const target = state.activeTarget && state.activeTarget.paint?.isConnected
      ? state.activeTarget
      : resolveIconTargetFromSelection_(typeof getSelection === 'function' ? getSelection() : null);

    if (!target || !target.paint) {
      alert('Спочатку клікни по іконці на сторінці, яку потрібно замінити.');
      return false;
    }
    if (payload) {
      const ok = await applyGalleryPayloadToState_(payload);
      if (!ok) return false;
    }
    if (!state.svg) {
      alert('Спочатку вибери нову іконку в Галереї.');
      return false;
    }

    const ok = setIconHtml_(target.paint, state.svg);
    if (!ok) return false;

    // Re-resolve because replacing a raw <svg> can swap the node.
    const nextTarget = resolveIconTargetFromElement_(target.owner || target.paint) || target;
    persistReplacement_(nextTarget, { svg: state.svg, name: state.name, color: state.color });
    setActiveTarget_(nextTarget, 'replace');
    ensureSelectedAfterReplace_(nextTarget);
    dlog_('icons-widget-replace-00497', {
      scope: nextTarget.scope,
      name: state.name || '',
      ownerCls: nextTarget.owner?.className || '',
      paintCls: nextTarget.paint?.className || nextTarget.paint?.tagName || ''
    }, 'info');
    return true;
  }

  async function openPicker_(mode = 'pick') {
    if (mode === 'replace') refreshFromSelection_('replace-before-picker');
    if (mode === 'replace' && !(state.activeTarget && state.activeTarget.paint?.isConnected)) {
      alert('Спочатку клікни по іконці на сторінці, яку потрібно замінити.');
      return;
    }

    openGalleryModal({
      cat: 'icons',
      pickerMode: true,
      view: 'icons',
      onPick: async (payload) => {
        try {
          if (!payload || !payload.itemId) return;
          if (mode === 'replace') {
            await replaceActiveWithState_(payload);
            return;
          }
          await applyGalleryPayloadToState_(payload);
        } catch (e) {
          console.warn('[IconsWidget] pick error', e);
        }
      }
    });
  }

  if (pickBtn) {
    pickBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPicker_('pick');
    });
  }

  if (replaceBtn) {
    replaceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openPicker_('replace');
    });
  }

  if (insertBtn) {
    insertBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!state.svg) return;

      const sel = typeof getSelection === 'function' ? getSelection() : null;

      if (sel && (sel.type === 'header-inner' || sel.type === 'header') && typeof window.ST_HB_INSERT_ICON === 'function') {
        const inserted = window.ST_HB_INSERT_ICON({ svg: state.svg, name: state.name, color: state.color });
        if (inserted && window.ST_SELECTION && typeof window.ST_SELECTION.setActive === 'function') window.ST_SELECTION.setActive(inserted);
        return;
      }

      if (typeof window.ST_ADD_ICON !== 'function') {
        console.warn('[IconsWidget] window.ST_ADD_ICON не знайдено');
        return;
      }

      const inserted = window.ST_ADD_ICON({ svg: state.svg, name: state.name, color: state.color });
      if (inserted && window.ST_SELECTION && typeof window.ST_SELECTION.setActive === 'function') {
        window.ST_SELECTION.setActive(inserted);
      }
    });
  }

  document.addEventListener('st:selection-changed', (ev) => {
    const detailTarget = resolveIconTargetFromSelection_(ev?.detail || null);
    if (detailTarget) setActiveTarget_(detailTarget, 'selection-event');
    else refreshFromSelection_('selection-event-fallback');
  });

  // Прямий клік по SVG/іконці оновлює preview навіть якщо інший selection-шар ще не встиг відпрацювати.
  document.addEventListener('click', (ev) => {
    const t = nodeEl_(ev.target);
    if (!t) return;
    const target = resolveIconTargetFromElement_(t);
    if (target) setActiveTarget_(target, 'click');
  }, true);
}
