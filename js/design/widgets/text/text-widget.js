
// js/design/widgets/text/text-widget.js
// Віджет "Текст" — працює ТІЛЬКИ по виділенню всередині Text-block (kind="text").
// 00904: локальні стрілки Text Undo/Redo працюють, а Main text block можна знову перетягувати.

export function initTextWidget(host, getSelection) {
  if (!host) return;

  // ---------- Menu-aware targets (Header/Footer Menu buttons) ----------
  // ЄДИНЕ канонічне місце для текстових стилів пунктів меню:
  // Рівень 1 у відповідній мапі меню:
  // - normal  -> menuLevelStyles[1]
  // - hover   -> menuLevelHoverStyles[1]
  // - open    -> menuLevelOpenStyles[1]
  // - current -> menuLevelCurrentStyles[1]
  // Старі CSS-varʼи --st-menu-link-* більше не є джерелом правди для меню.
  let activeTextState_ = 'normal';
  const TEXT_LOCAL_HISTORY_VERSION_00900 = '00904-main-text-block-drag-restore';
  const TEXT_LOCAL_HISTORY_MAX_00900 = 40;
  const TEXT_LOCAL_ACTION_IDLE_MS_00902 = 1200;

  const MENU_TEXT_STATE_MAP = {
    normal: 'menuLevelStyles',
    hover: 'menuLevelHoverStyles',
    open: 'menuLevelOpenStyles',
    current: 'menuLevelCurrentStyles',
  };

  const MENU_TEXT_STATE_SUFFIX = {
    normal: '',
    hover: '-h',
    open: '-o',
    current: '-c',
  };

  const MENU_TEXT_VAR_TO_PROP = {
    '--st-menu-link-color': 'color',
    '--st-menu-link-fs': 'fs',
    '--st-menu-link-fw': 'fw',
    '--st-menu-link-fst': 'fst',
    '--st-menu-link-ts': 'ts',
    '--st-menu-link-sw': 'sw',
    '--st-menu-link-sc': 'sc',
  };

  const MENU_TEXT_PROPS = ['color', 'fs', 'fw', 'fst', 'ts', 'sw', 'sc'];

  function isEl_(el) {
    return !!(el && el.nodeType === 1 && el instanceof HTMLElement);
  }

  // 00499: phone/button/logo labels are real text fields too. They can be
  // selected directly by the canvas selection manager and must be editable by
  // the Text inspector, even though their owner blockKind is phone/button/logo.
  function isSpecialTextField00499_(el) {
    try {
      return !!(el instanceof HTMLElement && el.matches?.(
        '.st-phone__text, .st-button__label, .st-logo__title, .st-logo__subtitle, ' +
        '[data-phone-text="1"], [data-st-text-target="1"], .st-text-edit'
      ));
    } catch { return false; }
  }

  function isTextOwnerBlock00499_(block) {
    try {
      if (!(block instanceof HTMLElement)) return false;
      const role = String(block.dataset?.blockRole || '').toLowerCase();
      const kind = String(block.dataset?.blockKind || '').toLowerCase();
      return !!(
        kind === 'text' || role === 'text' ||
        kind === 'heading' || role === 'heading' || block.classList?.contains('st-block--heading') ||
        kind === 'phone' || role === 'phone' || block.classList?.contains('st-block--phone') ||
        kind === 'button' || role === 'button' || block.classList?.contains('st-block--button') ||
        kind === 'logo' || role === 'logo' || block.classList?.contains('st-block--logo') ||
        block.classList?.contains('st-block--text')
      );
    } catch { return false; }
  }

  function findPrimaryTextEditable00499_(block, preferred = null) {
    try {
      if (preferred instanceof HTMLElement && block?.contains?.(preferred) && isSpecialTextField00499_(preferred)) return preferred;
      return block?.querySelector?.(
        ':scope > .st-text-edit[data-st-text-target="1"], :scope > .st-phone__text, :scope > [data-phone-text="1"], ' +
        ':scope > .st-button__label, :scope > .st-logo__title, :scope > .st-logo__subtitle, :scope > .st-text-edit'
      ) || null;
    } catch { return null; }
  }

  function persistTextEditableChange00499_(ed, reason = 'text-widget-change-00499') {
    try {
      if (!(ed instanceof HTMLElement)) return;
      const inHeader = !!ed.closest?.('#st-site-header-slot');
      const inMain = !!ed.closest?.('#st-site-main-slot');
      const inFooter = !!ed.closest?.('#st-site-footer-slot');
      if (inMain) {
        const result = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainTypography?.(ed, reason);
        if (!result?.ok) window.ST_SAVE_ROOT_DOM_HTML?.({ reason, preserveLiveMain: true });
      } else if (inHeader || inFooter) window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitNode?.(ed, reason);
      else window.ST_SAVE_ROOT_DOM_HTML?.({ reason });
    } catch {}
  }

  function getSelectedElements_() {
    try {
      if (typeof getSelection === 'function') {
        const sel = getSelection();
        if (Array.isArray(sel?.elements) && sel.elements.length) return sel.elements.filter(isEl_);
        if (isEl_(sel?.el)) return [sel.el];
        if (isEl_(sel)) return [sel];
      }
    } catch {}
    try {
      const active = document.querySelector(
        '.st-phone__text.is-active, .st-phone__text.is-selected, .st-button__label.is-active, .st-button__label.is-selected, ' +
        '.st-logo__title.is-active, .st-logo__title.is-selected, .st-logo__subtitle.is-active, .st-logo__subtitle.is-selected, ' +
        '.st-text-edit.is-active, .st-text-edit.is-selected, .st-block.is-active, .st-section.is-active, .st-block.is-selected, .st-section.is-selected'
      );
      return active ? [active] : [];
    } catch {}
    return [];
  }

  function findMenuBlockFromSelection_() {
    const els = getSelectedElements_();
    for (const el of els) {
      if (!isEl_(el)) continue;
      const direct = el.classList?.contains('st-block--menu') ? el : null;
      const closest = el.closest?.('.st-block--menu') || null;
      const marked = el.matches?.('[data-st-menu="1"]') ? el : null;
      const menu = direct || closest || marked;
      if (menu instanceof HTMLElement) return menu;
    }
    return null;
  }

  function getMenuTextTargets_() {
    const menu = findMenuBlockFromSelection_();
    if (!menu) return null;
    const items = Array.from(menu.querySelectorAll('[data-st-menu-item="1"]')).filter(isEl_);
    return { scope: 'menu-level-1', menu, items };
  }

  // 00211 — для звичайного текстового блока стани Open/Current не активні,
  // але Normal/Hover мають нормально перемикати toolbar. Поки окремий CSS
  // hover-текст для звичайних текстових блоків не вводимо, кнопки форматування
  // повинні працювати по виділенню і відразу оновлювати свій активний стан.
  function isRegularTextHoverState_() {
    return !getMenuTextTargets_() && normalizeTextState_(activeTextState_) === 'hover';
  }

  function getMenuStateResolvedTextProp_(menu, prop, state = activeTextState_) {
    if (!(menu instanceof HTMLElement)) return '';
    const st = normalizeTextState_(state);
    const { row } = readMenuLevel1TextRow_(menu, st);
    if (row && String(row[prop] ?? '').trim()) return String(row[prop]).trim();
    if (st !== 'normal') {
      const normal = readMenuLevel1TextRow_(menu, 'normal').row || {};
      if (String(normal[prop] ?? '').trim()) return String(normal[prop]).trim();
    }
    return '';
  }

  function normalizeTextState_(state) {
    const raw = String(state || '').trim().toLowerCase();
    return MENU_TEXT_STATE_MAP[raw] ? raw : 'normal';
  }

  function getActiveMenuTextState_() {
    activeTextState_ = normalizeTextState_(activeTextState_);
    return activeTextState_;
  }

  function getMenuStyleDatasetName_(state = activeTextState_) {
    return MENU_TEXT_STATE_MAP[normalizeTextState_(state)] || 'menuLevelStyles';
  }

  function parseMenuStyleMap_(menu, datasetName) {
    try {
      const raw = String(menu?.dataset?.[datasetName] || '').trim();
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch {
      return {};
    }
  }

  function serializeMenuStyleMap_(map) {
    const out = {};
    const src = (map && typeof map === 'object') ? map : {};
    Object.keys(src).forEach((key) => {
      const row = src[key];
      if (!row || typeof row !== 'object') return;
      const clean = {};
      Object.keys(row).forEach((prop) => {
        const v = row[prop];
        if (v === null || v === undefined) return;
        const s = String(v).trim();
        if (s !== '') clean[prop] = s;
      });
      if (Object.keys(clean).length) out[String(key)] = clean;
    });
    return JSON.stringify(out);
  }

  function readMenuLevel1TextRow_(menu, state = activeTextState_) {
    const datasetName = getMenuStyleDatasetName_(state);
    const map = parseMenuStyleMap_(menu, datasetName);
    const row = (map['1'] && typeof map['1'] === 'object') ? map['1'] : {};
    return { datasetName, map, row: { ...row } };
  }

  function normalizeMenuTextPropValue_(prop, value) {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (prop === 'fs') {
      const n = Number(String(raw).replace('px', '').trim());
      if (!Number.isFinite(n)) return '';
      return String(Math.max(8, Math.min(96, Math.round(n))));
    }
    if (prop === 'fw') {
      const n = Number(raw);
      if (Number.isFinite(n)) return String(Math.max(100, Math.min(1000, Math.round(n))));
      return (/bold/i.test(raw) ? '700' : (/normal/i.test(raw) ? '400' : raw));
    }
    if (prop === 'fst') return (/italic|oblique/i.test(raw) ? 'italic' : 'normal');
    if (prop === 'sw') {
      const n = Number(String(raw).replace('px', '').trim());
      if (!Number.isFinite(n)) return '';
      return `${Math.max(0, Math.min(12, Math.round(n)))}px`;
    }
    return raw;
  }

  function setMenuStylePropIfChanged00438_(menu, name, value) {
    try {
      if (!(menu instanceof HTMLElement)) return;
      const prop = String(name || '');
      const next = String(value ?? '');
      if (menu.style.getPropertyValue(prop) === next) return;
      menu.style.setProperty(prop, next);
    } catch {}
  }

  function removeMenuStylePropIfChanged00438_(menu, name) {
    try {
      if (!(menu instanceof HTMLElement)) return;
      const prop = String(name || '');
      if (!menu.style.getPropertyValue(prop)) return;
      menu.style.removeProperty(prop);
    } catch {}
  }

  function applyMenuLevel1TextCssVars_(menu, state, row) {
    if (!(menu instanceof HTMLElement)) return;
    const normalizedState = normalizeTextState_(state);
    const suffix = MENU_TEXT_STATE_SUFFIX[normalizedState] || '';
    const set = (prop, cssValue) => {
      const name = `--st-menu-l1${suffix}-${prop}`;
      if (cssValue === '' || cssValue == null) removeMenuStylePropIfChanged00438_(menu, name);
      else setMenuStylePropIfChanged00438_(menu, name, cssValue);
    };
    set('color', row.color || '');
    set('fs', row.fs ? `${row.fs}px` : '');
    set('fw', row.fw || '');
    set('fst', row.fst || '');
    set('ts', row.ts || '');
    set('sw', row.sw || '');
    set('sc', row.sc || '');

    // 00437: live compatibility for older header/menu templates.
    // Many template links still have inline styles like color:var(--st-menu-link-color)
    // and font-size:var(--st-menu-link-fs). Mirroring the canonical level-1 values
    // keeps the menu responsive immediately, before any later layout widget refresh.
    const setLegacy = (name, cssValue) => {
      if (cssValue === '' || cssValue == null) removeMenuStylePropIfChanged00438_(menu, name);
      else setMenuStylePropIfChanged00438_(menu, name, cssValue);
    };
    if (normalizedState === 'normal') {
      setLegacy('--st-menu-link-color', row.color || '');
      setLegacy('--st-menu-link-fs', row.fs ? `${row.fs}px` : '');
      setLegacy('--st-menu-link-fw', row.fw || '');
      setLegacy('--st-menu-link-fst', row.fst || '');
      setLegacy('--st-menu-link-ts', row.ts || '');
      setLegacy('--st-menu-link-sw', row.sw || '');
      setLegacy('--st-menu-link-sc', row.sc || '');
    } else if (normalizedState === 'hover') {
      setLegacy('--st-menu-link-color-h', row.color || '');
    }
  }

  function clearLegacyMenuTextVars_(menu) {
    if (!(menu instanceof HTMLElement)) return;
    ['--st-menu-link-color','--st-menu-link-fs','--st-menu-link-fw','--st-menu-link-fst','--st-menu-link-ts','--st-menu-link-sw','--st-menu-link-sc'].forEach((name) => {
      try { menu.style.removeProperty(name); } catch {}
    });
    try {
      menu.querySelectorAll('[data-st-menu-item="1"]').forEach((item) => {
        ['--st-menu-link-color','--st-menu-link-fs','--st-menu-link-fw','--st-menu-link-fst','--st-menu-link-ts','--st-menu-link-sw','--st-menu-link-sc'].forEach((name) => {
          try { item.style.removeProperty(name); } catch {}
        });
      });
    } catch {}
  }

  function persistMenuTextChange_(reason = 'menu-text-style-level1') {
    const t = getMenuTextTargets_();
    const menu = t?.menu || null;
    const inHeader = !!menu?.closest?.('#st-site-header-slot');
    const inFooter = !!menu?.closest?.('#st-site-footer-slot');

    // [00438][PERFORMANCE]
    // Під час live color/slider input не робимо повний history snapshot.
    // Для Header/Footer це особливо важко після AI Education Content.
    try {
      if (!(inHeader || inFooter)) window.ST_HISTORY?.capture?.(reason);
    } catch {}
    if (inHeader || inFooter) {
      try { window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitNode?.(menu, reason); } catch {}
    } else {
      try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason }); } catch {}
    }

    // Keep inspector UI in sync, but collapse the refresh to one frame so color picker
    // dragging does not fire a full inspector resync for every native input tick.
    if (!persistMenuTextChange_._raf) {
      persistMenuTextChange_._raf = requestAnimationFrame(() => {
        persistMenuTextChange_._raf = 0;
        try { window.dispatchEvent(new CustomEvent('st:selection:changed', { detail: { source: 'text-widget-menu-level1' } })); } catch {}
        try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { source: 'text-widget-menu-level1' } })); } catch {}
      });
    }
  }

  function writeMenuLevel1TextPatch_(patch, reason = 'menu-text-style-level1') {
    const t = getMenuTextTargets_();
    if (!t || !t.menu) return false;
    const state = getActiveMenuTextState_();
    const { datasetName, map, row } = readMenuLevel1TextRow_(t.menu, state);
    Object.entries(patch || {}).forEach(([prop, value]) => {
      if (!MENU_TEXT_PROPS.includes(prop)) return;
      const normalized = normalizeMenuTextPropValue_(prop, value);
      if (normalized === '') delete row[prop];
      else row[prop] = normalized;
    });
    map['1'] = row;
    t.menu.dataset[datasetName] = serializeMenuStyleMap_(map);
    clearLegacyMenuTextVars_(t.menu);
    applyMenuLevel1TextCssVars_(t.menu, state, row);
    persistMenuTextChange_(reason);
    return true;
  }

  function applyMenuVar_(varName, value) {
    const prop = MENU_TEXT_VAR_TO_PROP[varName];
    if (!prop) return false;
    return writeMenuLevel1TextPatch_({ [prop]: value }, 'menu-text-style-level1');
  }

  function resetMenuTextStyles_() {
    const t = getMenuTextTargets_();
    if (!t || !t.menu) return false;
    const state = getActiveMenuTextState_();
    const { datasetName, map, row } = readMenuLevel1TextRow_(t.menu, state);
    MENU_TEXT_PROPS.forEach((prop) => { delete row[prop]; });
    if (Object.keys(row).length) map['1'] = row;
    else delete map['1'];
    t.menu.dataset[datasetName] = serializeMenuStyleMap_(map);
    clearLegacyMenuTextVars_(t.menu);
    applyMenuLevel1TextCssVars_(t.menu, state, {});
    persistMenuTextChange_('menu-text-reset-level1');
    return true;
  }

  function menuCssColorToHexAlpha_(css) {
    const raw = String(css || '').trim();
    let m = raw.match(/rgba?\(([^)]+)\)/i);
    if (m) {
      const parts = m[1].split(',').map((x) => x.trim());
      const r = Math.max(0, Math.min(255, Math.round(Number(parts[0]) || 0)));
      const g = Math.max(0, Math.min(255, Math.round(Number(parts[1]) || 0)));
      const b = Math.max(0, Math.min(255, Math.round(Number(parts[2]) || 0)));
      const a = parts.length >= 4 ? Math.max(0, Math.min(1, Number(parts[3]))) : 1;
      const hex = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
      return { hex, alpha: Math.round(a * 100) };
    }
    m = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      let hex = raw.toLowerCase();
      if (hex.length === 4) hex = '#' + hex.slice(1).split('').map((c) => c + c).join('');
      return { hex, alpha: 100 };
    }
    return null;
  }

  function syncMenuToolbarFromLevel1State_() {
    const t = getMenuTextTargets_();
    syncTextStateToolbar_();
    if (!t || !t.menu) return false;

    const state = getActiveMenuTextState_();
    const { row } = readMenuLevel1TextRow_(t.menu, state);
    const ref = t.menu.querySelector('.st-menu__item[data-menu-depth="1"] > .st-menu__link') || t.items?.[0] || t.menu;
    const cs = ref instanceof HTMLElement ? getComputedStyle(ref) : null;

    const fs = row.fs || (cs ? String(Math.round(parseFloat(cs.fontSize || '16') || 16)) : '16');
    if (ui?.size) ui.size.value = String(Math.max(8, Math.min(96, Number(fs) || 16)));
    if (ui?.sizeNum) ui.sizeNum.value = String(Math.max(8, Math.min(96, Number(fs) || 16)));

    const fw = row.fw || (cs?.fontWeight || '400');
    const fst = row.fst || (cs?.fontStyle || 'normal');
    const fwNum = parseInt(fw, 10);
    ui?.bold?.classList.toggle('is-active', String(fw).toLowerCase() === 'bold' || (!Number.isNaN(fwNum) && fwNum >= 600));
    ui?.italic?.classList.toggle('is-active', /italic|oblique/i.test(String(fst || '')));

    const color = row.color || cs?.color || '';
    const parsed = menuCssColorToHexAlpha_(color);
    if (parsed) {
      if (ui?.color) ui.color.value = parsed.hex;
      if (ui?.alpha) ui.alpha.value = String(parsed.alpha);
      if (ui?.alphaVal) ui.alphaVal.textContent = `${parsed.alpha}%`;
      try {
        const rgb = hexToRgb_(parsed.hex);
        if (rgb) applySwatch_(rgb, parsed.alpha / 100);
      } catch {}
    }
    return true;
  }

  function syncTextStateToolbar_() {
    const isMenu = !!getMenuTextTargets_();
    if (!isMenu && (activeTextState_ === 'open' || activeTextState_ === 'current')) {
      activeTextState_ = 'normal';
    }
    const state = getActiveMenuTextState_();
    try {
      sectionEl?.querySelectorAll?.('[data-text-state]').forEach((btn) => {
        const val = normalizeTextState_(btn.getAttribute('data-text-state'));
        const disabled = !isMenu && (val === 'open' || val === 'current');
        btn.toggleAttribute('disabled', disabled);
        btn.classList.toggle('is-active', val === state);
        btn.setAttribute('aria-pressed', val === state ? 'true' : 'false');
        btn.title = disabled ? 'Цей стан доступний тільки для меню' : '';
      });
    } catch {}
  }

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Текст</span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <div class="design-field st-text-state-field">
        <div class="st-text-state-head" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <div class="design-field__label" style="margin:0;">Стилі пунктів</div>
          <div class="st-text-local-history" data-text-local-history="1" style="display:flex;align-items:center;gap:4px;">
            <button id="st-text-local-undo" class="design-pill st-icon-pill" type="button" title="Назад по тексту" aria-label="Назад по тексту" disabled>←</button>
            <button id="st-text-local-redo" class="design-pill st-icon-pill" type="button" title="Вперед по тексту" aria-label="Вперед по тексту" disabled>→</button>
          </div>
        </div>
        <div class="design-field__row">
          <div class="design-pill-group st-text-state-toolbar" data-text-state-toolbar style="width:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;">
            <button class="design-pill is-active" type="button" data-text-state="normal" aria-pressed="true">Нормал</button>
            <button class="design-pill" type="button" data-text-state="hover" aria-pressed="false">Ховер</button>
            <button class="design-pill" type="button" data-text-state="open" aria-pressed="false">Open</button>
            <button class="design-pill" type="button" data-text-state="current" aria-pressed="false">Current</button>
          </div>
        </div>
        <div class="st-text-hint" style="margin-top:6px;line-height:1.35;">Для меню стилі пишуться тільки в Рівень 1. Для звичайного тексту Open/Current вимкнені.</div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Форматування (виділення)</div>
        <div class="design-field__row" style="align-items:stretch; flex-direction:column;">
          <div class="st-text-toolbar">
            <button id="st-text-color-btn" class="design-pill st-icon-pill" type="button" title="Колір тексту">
              <span class="st-icon-letter" aria-hidden="true">A</span>
              <span class="st-swatch" aria-hidden="true"></span>
            </button>

            <button id="st-text-italic" class="design-pill st-icon-pill" type="button" title="Курсив">
              <span class="st-icon-italic" aria-hidden="true">I</span>
            </button>

            <button id="st-text-bold" class="design-pill st-icon-pill" type="button" title="Жирний">
              <span class="st-icon-bold" aria-hidden="true">B</span>
            </button>

            
            <button id="st-text-border-color-btn" class="design-pill st-icon-pill" type="button" title="Колір бордера">
              <span class="st-icon-border" aria-hidden="true">▢</span>
              <span class="st-swatch st-swatch--border" aria-hidden="true"></span>
            </button>

            <button id="st-text-border-w-minus" class="design-pill st-icon-pill" type="button" title="Товщина бордера -">
              <span aria-hidden="true">−</span>
            </button>

            <button id="st-text-border-w-plus" class="design-pill st-icon-pill" type="button" title="Товщина бордера +">
              <span aria-hidden="true">+</span>
            </button>


            <button id="st-text-stroke-color-btn" class="design-pill st-icon-pill" type="button" title="Колір обводки тексту">
              <span class="st-icon-stroke" aria-hidden="true"><u>A</u></span>
              <span class="st-swatch st-swatch--stroke" aria-hidden="true"></span>
            </button>

            <button id="st-text-stroke-w-minus" class="design-pill st-icon-pill" type="button" title="Товщина обводки -">
              <span aria-hidden="true">−</span>
            </button>

            <button id="st-text-stroke-w-plus" class="design-pill st-icon-pill" type="button" title="Товщина обводки +">
              <span aria-hidden="true">+</span>
            </button><button id="st-text-align-left" class="design-pill st-icon-pill st-align-pill" type="button" title="Зліва" aria-pressed="false">
              <span class="st-icon-align" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                  <path d="M4 6h16v2H4V6zm0 5h12v2H4v-2zm0 5h16v2H4v-2z"></path>
                </svg>
              </span>
            </button>

            <button id="st-text-align-center" class="design-pill st-icon-pill st-align-pill" type="button" title="По центру" aria-pressed="false">
              <span class="st-icon-align" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                  <path d="M4 6h16v2H4V6zm2 5h12v2H6v-2zm-2 5h16v2H4v-2z"></path>
                </svg>
              </span>
            </button>

            <button id="st-text-align-right" class="design-pill st-icon-pill st-align-pill" type="button" title="Справа" aria-pressed="false">
              <span class="st-icon-align" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                  <path d="M4 6h16v2H4V6zm4 5h12v2H8v-2zM4 16h16v2H4v-2z"></path>
                </svg>
              </span>
            </button>

            <button id="st-text-valign-top" class="design-pill st-icon-pill st-align-pill" type="button" title="Верх" aria-pressed="false">
              <span class="st-icon-align" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                  <path d="M4 5h16v2H4V5zm8 3l-4 4h3v7h2v-7h3l-4-4z"></path>
                </svg>
              </span>
            </button>

            <button id="st-text-valign-center" class="design-pill st-icon-pill st-align-pill" type="button" title="Центр" aria-pressed="false">
              <span class="st-icon-align" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                  <path d="M7 4h10v2H7V4zm0 16h10v2H7v-2zM12 8l-4 4h3v0h2v0h3l-4-4z"></path>
                </svg>
              </span>
            </button>

            <button id="st-text-valign-bottom" class="design-pill st-icon-pill st-align-pill" type="button" title="Низ" aria-pressed="false">
              <span class="st-icon-align" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" focusable="false" aria-hidden="true">
                  <path d="M4 17h16v2H4v-2zm8-12v7H9l3 4 3-4h-3V5h-2z"></path>
                </svg>
              </span>
            </button>


            <button id="st-text-shadow-color-btn" class="design-pill st-icon-pill" type="button" title="Тінь тексту">
              <span class="st-icon-shadow" aria-hidden="true">☁</span>
              <span class="st-swatch st-swatch--shadow" aria-hidden="true"></span>
            </button>



</div>

          <div class="design-field__row" style="margin-top:8px; gap:8px;">
            <button id="st-text-reset-styles" class="design-pill" type="button" title="Скинути стилі (для меню: знімає пріоритетні стилі з вибраного)">Скинути стилі</button>
          </div>

          <div id="st-text-color-pop" class="st-text-pop" hidden>
            <div class="st-text-pop__head">
              <div class="st-text-pop__title">Колір тексту</div>
              <button id="st-text-color-close" class="design-pill st-icon-pill" type="button" title="Закрити">
                ✕
              </button>
            </div>

            <div class="st-text-pop__row">
              <input id="st-text-color" type="color" value="#ffffff" />
              <div class="st-text-hint">Виділи текст у блоці “Текст” і вибери колір</div>
            </div>

            <div class="st-text-pop__row">
              <div class="st-text-pop__sub">Стандартні</div>
            </div>
            <div id="st-text-palette" class="st-text-palette" aria-label="Стандартні кольори"></div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Мої (клік: застосувати / додати)</div>
            </div>
            <div id="st-text-custom" class="st-text-palette" aria-label="Мої кольори"></div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Прозорість</div>
              <div class="st-text-alpha-val" id="st-text-alpha-val">100%</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-alpha" class="design-slider" type="range" min="0" max="100" step="1" value="100" />
            </div>
          </div>
        </div>
      </div>

      
      
          <div id="st-text-border-pop" class="st-text-pop" hidden>
            <div class="st-text-pop__head">
              <div class="st-text-pop__title">Колір бордера</div>
              <button id="st-text-border-close" class="design-pill st-icon-pill" type="button" title="Закрити">✕</button>
            </div>

            <div class="st-text-pop__row">
              <input id="st-text-border-color" type="color" value="#ffffff" />
              <div class="st-text-hint">Вибери текстовий блок і задай бордер</div>
            </div>
          

          </div>

          <div id="st-text-stroke-pop" class="st-text-pop" hidden>
            <div class="st-text-pop__head">
              <div class="st-text-pop__title">Обводка тексту</div>
              <button id="st-text-stroke-close" class="design-pill st-icon-pill" type="button" title="Закрити">✕</button>
            </div>

            <div class="st-text-pop__row">
              <input id="st-text-stroke-color" type="color" value="#000000" />
              <div class="st-text-hint">Вибери текстовий блок і задай обводку</div>
            </div>

            <div class="st-text-pop__row">
              <div class="st-text-pop__sub">Стандартні</div>
            </div>
            <div id="st-text-stroke-palette" class="st-text-palette" aria-label="Стандартні кольори обводки"></div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Мої (клік: застосувати / додати)</div>
            </div>
            <div id="st-text-stroke-custom" class="st-text-palette" aria-label="Мої кольори обводки"></div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Прозорість</div>
              <div class="st-text-alpha-val" id="st-text-stroke-alpha-val">100%</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-stroke-alpha" class="design-slider" type="range" min="0" max="100" step="1" value="100" />
          </div>

</div>

          <div id="st-text-shadow-pop" class="st-text-pop" hidden>
            <div class="st-text-pop__head">
              <div class="st-text-pop__title">Тінь тексту</div>
              <button id="st-text-shadow-close" class="design-pill st-icon-pill" type="button" title="Закрити">✕</button>
            </div>

            <div class="st-text-pop__row">
              <input id="st-text-shadow-color" type="color" value="#000000" />
              <div class="st-text-hint">Вибери текстовий блок і задай тінь</div>
            </div>

            <div class="st-text-pop__row">
              <div class="st-text-pop__sub">Стандартні</div>
            </div>
            <div id="st-text-shadow-palette" class="st-text-palette" aria-label="Стандартні кольори тіні"></div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Мої (клік: застосувати / додати)</div>
            </div>
            <div id="st-text-shadow-custom" class="st-text-palette" aria-label="Мої кольори тіні"></div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Прозорість</div>
              <div class="st-text-alpha-val" id="st-text-shadow-alpha-val">100%</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-shadow-alpha" class="design-slider" type="range" min="0" max="100" step="1" value="100" />
            </div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Зміщення X (ліво/право)</div>
              <div class="st-text-alpha-val" id="st-text-shadow-x-val">0</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-shadow-x" class="design-slider" type="range" min="-50" max="50" step="1" value="0" />
            </div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Зміщення Y (верх/низ)</div>
              <div class="st-text-alpha-val" id="st-text-shadow-y-val">0</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-shadow-y" class="design-slider" type="range" min="-50" max="50" step="1" value="0" />
            </div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Розмитість</div>
              <div class="st-text-alpha-val" id="st-text-shadow-blur-val">8</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-shadow-blur" class="design-slider" type="range" min="0" max="60" step="1" value="8" />
            </div>

            <div class="st-text-pop__row" style="margin-top:10px;">
              <div class="st-text-pop__sub">Чіткість</div>
              <div class="st-text-alpha-val" id="st-text-shadow-sharp-val">0</div>
            </div>
            <div class="st-text-pop__row">
              <input id="st-text-shadow-sharp" class="design-slider" type="range" min="0" max="6" step="1" value="0" />
            </div>
          </div>


<div class="design-field">
        <div class="design-field__label">Заголовок</div>
        <div class="design-field__row" style="align-items:stretch; flex-direction:column;">
          <button id="st-text-heading-btn" class="design-pill st-heading-pill" type="button" title="Заголовок">
            <span id="st-text-heading-label" class="st-heading-label">Звичайний текст</span>
            <span class="st-heading-caret" aria-hidden="true">▾</span>
          </button>

          <div id="st-text-heading-pop" class="st-text-pop st-heading-pop" hidden>
            <div class="st-text-pop__head">
              <div class="st-text-pop__title">Заголовок</div>
              <button id="st-text-heading-close" class="design-pill st-icon-pill" type="button" title="Закрити">✕</button>
            </div>

            <div class="st-heading-list" role="listbox" aria-label="Рівні заголовків">
              <button type="button" class="st-heading-item" data-h="0"><span class="st-heading-preview st-normal">Звичайний текст</span></button>
              <button type="button" class="st-heading-item" data-h="1"><span class="st-heading-preview st-h1">Заголовок 1</span></button>
              <button type="button" class="st-heading-item" data-h="2"><span class="st-heading-preview st-h2">Заголовок 2</span></button>
              <button type="button" class="st-heading-item" data-h="3"><span class="st-heading-preview st-h3">Заголовок 3</span></button>
              <button type="button" class="st-heading-item" data-h="4"><span class="st-heading-preview st-h4">Заголовок 4</span></button>
              <button type="button" class="st-heading-item" data-h="5"><span class="st-heading-preview st-h5">Заголовок 5</span></button>
              <button type="button" class="st-heading-item" data-h="6"><span class="st-heading-preview st-h6">Заголовок 6</span></button>
            </div>
          </div>
        </div>
      </div>
<div class="design-field">
        <div class="design-field__label">Розмір (px)</div>
        <div class="design-field__row">
          <input id="st-text-size" class="design-slider" type="range" min="8" max="96" step="1" value="16" />
          <input id="st-text-size-num" class="design-number" type="number" min="8" max="96" step="1" value="16" />
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Поведінка тексту при стисканні</div>
        <div class="design-field__row" style="gap:6px;flex-wrap:wrap;">
          <button id="st-text-flow-nowrap" class="design-pill" type="button" data-st-text-flow-btn="nowrap" aria-pressed="false" title="Не переносити — текст завжди в один рядок. Текстовий блок і кнопка не стискаються менше ширини тексту + 1–2px. Для тексту всередині кнопок це режим за замовчуванням.">Не переносити</button>
          <button id="st-text-flow-wrap" class="design-pill" type="button" data-st-text-flow-btn="wrap" aria-pressed="false" title="Перенести — при зменшенні ширини текст переноситься на новий рядок. Для звичайних текстових блоків це режим за замовчуванням.">Перенести</button>
          <button id="st-text-flow-clip" class="design-pill" type="button" data-st-text-flow-btn="clip" aria-pressed="false" title="Обрізання тексту — текст обрізається, блок можна стиснути до мінімальної ширини 5px.">Обрізання тексту</button>
        </div>
        <div class="st-text-hint" style="margin-top:6px;line-height:1.35;">Для кнопок стандарт — “Не переносити”. Для звичайного тексту стандарт — “Перенести”.</div>
      </div>
    </div>
  `;

  // ⚠️ Акордеоном секцій у панелі "Дизайн" керує ТІЛЬКИ initSectionsPersistence()
  // (js/design/panel-design.js). Тут НЕ вішаємо власні click-хендлери,
  // інакше може з'являтись ефект "не закривається".

  host.appendChild(sectionEl);

  const ui = {
    colorBtn: sectionEl.querySelector('#st-text-color-btn'),
    pop: sectionEl.querySelector('#st-text-color-pop'),
    popClose: sectionEl.querySelector('#st-text-color-close'),
    color: sectionEl.querySelector('#st-text-color'),
    palette: sectionEl.querySelector('#st-text-palette'),
    custom: sectionEl.querySelector('#st-text-custom'),
    alpha: sectionEl.querySelector('#st-text-alpha'),
    alphaVal: sectionEl.querySelector('#st-text-alpha-val'),
    headingBtn: sectionEl.querySelector('#st-text-heading-btn'),
    headingLabel: sectionEl.querySelector('#st-text-heading-label'),
    headingPop: sectionEl.querySelector('#st-text-heading-pop'),
    headingClose: sectionEl.querySelector('#st-text-heading-close'),
    size: sectionEl.querySelector('#st-text-size'),
    sizeNum: sectionEl.querySelector('#st-text-size-num'),
    flowButtons: Array.from(sectionEl.querySelectorAll('[data-st-text-flow-btn]')),
    italic: sectionEl.querySelector('#st-text-italic'),
    bold: sectionEl.querySelector('#st-text-bold'),
    alignLeft: sectionEl.querySelector('#st-text-align-left'),
    alignCenter: sectionEl.querySelector('#st-text-align-center'),
    alignRight: sectionEl.querySelector('#st-text-align-right'),
    vAlignTop: sectionEl.querySelector('#st-text-valign-top'),
    vAlignCenter: sectionEl.querySelector('#st-text-valign-center'),
    vAlignBottom: sectionEl.querySelector('#st-text-valign-bottom'),
    resetStyles: sectionEl.querySelector('#st-text-reset-styles'),
    swatch: sectionEl.querySelector('#st-text-color-btn .st-swatch'),
    borderBtn: sectionEl.querySelector('#st-text-border-color-btn'),
    borderPop: sectionEl.querySelector('#st-text-border-pop'),
    borderClose: sectionEl.querySelector('#st-text-border-close'),
    borderColor: sectionEl.querySelector('#st-text-border-color'),
    borderMinus: sectionEl.querySelector('#st-text-border-w-minus'),
    borderPlus: sectionEl.querySelector('#st-text-border-w-plus'),
    borderSwatch: sectionEl.querySelector('#st-text-border-color-btn .st-swatch--border'),

    strokeBtn: sectionEl.querySelector('#st-text-stroke-color-btn'),
    strokePop: sectionEl.querySelector('#st-text-stroke-pop'),
    strokeClose: sectionEl.querySelector('#st-text-stroke-close'),
    strokeColor: sectionEl.querySelector('#st-text-stroke-color'),
    strokePalette: sectionEl.querySelector('#st-text-stroke-palette'),
    strokeCustom: sectionEl.querySelector('#st-text-stroke-custom'),
    strokeAlpha: sectionEl.querySelector('#st-text-stroke-alpha'),
    strokeAlphaVal: sectionEl.querySelector('#st-text-stroke-alpha-val'),
    strokeMinus: sectionEl.querySelector('#st-text-stroke-w-minus'),
    strokePlus: sectionEl.querySelector('#st-text-stroke-w-plus'),
    strokeSwatch: sectionEl.querySelector('#st-text-stroke-color-btn .st-swatch--stroke'),

    shadowBtn: sectionEl.querySelector('#st-text-shadow-color-btn'),
    shadowPop: sectionEl.querySelector('#st-text-shadow-pop'),
    shadowClose: sectionEl.querySelector('#st-text-shadow-close'),
    shadowColor: sectionEl.querySelector('#st-text-shadow-color'),
    shadowPalette: sectionEl.querySelector('#st-text-shadow-palette'),
    shadowCustom: sectionEl.querySelector('#st-text-shadow-custom'),
    shadowAlpha: sectionEl.querySelector('#st-text-shadow-alpha'),
    shadowAlphaVal: sectionEl.querySelector('#st-text-shadow-alpha-val'),
    shadowX: sectionEl.querySelector('#st-text-shadow-x'),
    shadowXVal: sectionEl.querySelector('#st-text-shadow-x-val'),
    shadowY: sectionEl.querySelector('#st-text-shadow-y'),
    shadowYVal: sectionEl.querySelector('#st-text-shadow-y-val'),
    shadowBlur: sectionEl.querySelector('#st-text-shadow-blur'),
    shadowBlurVal: sectionEl.querySelector('#st-text-shadow-blur-val'),
    shadowSharp: sectionEl.querySelector('#st-text-shadow-sharp'),
    shadowSharpVal: sectionEl.querySelector('#st-text-shadow-sharp-val'),
    shadowSwatch: sectionEl.querySelector('#st-text-shadow-color-btn .st-swatch--shadow'),

    shadowBtn: sectionEl.querySelector('#st-text-shadow-color-btn'),
    shadowPop: sectionEl.querySelector('#st-text-shadow-pop'),
    shadowClose: sectionEl.querySelector('#st-text-shadow-close'),
    shadowColor: sectionEl.querySelector('#st-text-shadow-color'),
    shadowPalette: sectionEl.querySelector('#st-text-shadow-palette'),
    shadowCustom: sectionEl.querySelector('#st-text-shadow-custom'),
    shadowAlpha: sectionEl.querySelector('#st-text-shadow-alpha'),
    shadowAlphaVal: sectionEl.querySelector('#st-text-shadow-alpha-val'),
    shadowX: sectionEl.querySelector('#st-text-shadow-x'),
    shadowXVal: sectionEl.querySelector('#st-text-shadow-x-val'),
    shadowY: sectionEl.querySelector('#st-text-shadow-y'),
    shadowYVal: sectionEl.querySelector('#st-text-shadow-y-val'),
    shadowBlur: sectionEl.querySelector('#st-text-shadow-blur'),
    shadowBlurVal: sectionEl.querySelector('#st-text-shadow-blur-val'),
    shadowSharp: sectionEl.querySelector('#st-text-shadow-sharp'),
    shadowSharpVal: sectionEl.querySelector('#st-text-shadow-sharp-val'),
    shadowSwatch: sectionEl.querySelector('#st-text-shadow-color-btn .st-swatch--shadow'),
    stateToolbar: sectionEl.querySelector('[data-text-state-toolbar]'),
    stateButtons: Array.from(sectionEl.querySelectorAll('[data-text-state]')),
    textLocalUndo: sectionEl.querySelector('#st-text-local-undo'),
    textLocalRedo: sectionEl.querySelector('#st-text-local-redo'),

  };

  let lastActiveTextEdit = null;
  let strokeCustomActiveIdx = -1; // активний кружечок у 'Обводка тексту' → 'Мої'



  const LS_CUSTOM_KEY = 'st_text_custom_colors_v1';
  const LS_STROKE_CUSTOM_KEY = 'st_text_stroke_custom_colors_v1';
  const LS_SHADOW_CUSTOM_KEY = 'st_text_shadow_custom_colors_v1';
  const STD_COLORS = [
    '#ffffff',
    '#000000',
    '#ff3b30',
    '#ff453a',
    '#ff2d55',
    '#ff375f',
    '#ff9500',
    '#ff9f0a',
    '#ffcc00',
    '#ffd60a',
    '#34c759',
    '#30d158',
    '#00c7be',
    '#40c8e0',
    '#32ade6',
    '#64d2ff',
    '#007aff',
    '#0a84ff',
    '#5856d6',
    '#5e5ce6',
    '#af52de',
    '#bf5af2',
    '#8e8e93',
    '#aeaeb2',
    '#1b2233',
    '#2c2c2e',
    '#3a3a3c',
    '#48484a',
    '#636366',
    '#787880',
    '#a1a1a6',
    '#c7c7cc',
    '#b8c7ff',
    '#c6d3ff',
    '#18b0ff',
    '#2a8cff',
    '#a3ff12',
    '#d0fd3e',
    '#ff6bd6',
    '#ff9bdc',
    '#ff7a00',
    '#ffb340',
    '#00b894',
    '#00d1b2',
    '#2ecc71',
    '#27ae60',
    '#e67e22',
    '#f39c12',
    '#e74c3c',
    '#c0392b',
  ];

  
function getActiveTextEditable_() {
  // Джерело правди по виділенню на полотні:
  // 1) window.ST_SELECTION.get() (якщо є)
  // 2) fallback по DOM-класам .is-active/.is-selected
  const activeScope = (() => {
    try {
      const scope = String(window.__ST_DESIGN_ACTIVE_SCOPE_00453 || window.__ST_LAYOUT_ACTIVE_SCOPE_00451 || '');
      return scope === 'header' || scope === 'main' || scope === 'footer' ? scope : '';
    } catch { return ''; }
  })();
  const scopeRoot = activeScope === 'main'
    ? document.querySelector('#st-site-main-slot, .st-site-main-slot')
    : activeScope === 'footer'
      ? document.querySelector('#st-site-footer-slot, .st-site-footer-slot')
      : activeScope === 'header'
        ? document.querySelector('#st-site-header-slot, .st-site-header-slot')
        : null;

  // 00924: the single current marker is the canvas selection authority.
  // ST_SELECTION can briefly retain an older `elements[0]` while focus moves
  // from the canvas to an inspector control. Prefer the current node in the
  // active scope so a heading can never style the following text block.
  let sel = null;
  let el = scopeRoot?.querySelector?.('.sf-selection-current') || null;
  try {
    if (!el && window.ST_SELECTION && typeof window.ST_SELECTION.get === 'function') {
      sel = window.ST_SELECTION.get();
    }
  } catch {}

  if (!el && sel) {
    el = sel.el || (Array.isArray(sel.elements) ? sel.elements[0] : null) || null;
  }
  if (!el) {
    el = (scopeRoot || document).querySelector(
      '.st-phone__text.is-active, .st-phone__text.is-selected, .st-button__label.is-active, .st-button__label.is-selected, ' +
      '.st-logo__title.is-active, .st-logo__title.is-selected, .st-logo__subtitle.is-active, .st-logo__subtitle.is-selected, ' +
      '.st-text-edit.is-active, .st-text-edit.is-selected, .st-block.is-active, .st-section.is-active, .st-block.is-selected, .st-section.is-selected'
    );
  }
  if (!el) return null;

  const scopeOf = (node) => {
    try {
      if (node?.closest?.('#st-site-main-slot, .st-site-main-slot')) return 'main';
      if (node?.closest?.('#st-site-footer-slot, .st-site-footer-slot')) return 'footer';
      if (node?.closest?.('#st-site-header-slot, .st-site-header-slot')) return 'header';
    } catch {}
    return '';
  };

  // 00499: if the selected thing is the actual text field (phone/button/logo/text),
  // use it directly. Previously this was rejected unless owner blockKind === text.
  if (isSpecialTextField00499_(el)) {
    lastActiveTextEdit = el;
    return el;
  }

  const blockEl = el.classList?.contains('st-block') ? el : (el.closest?.('.st-block') || null);
  if (!blockEl || !isTextOwnerBlock00499_(blockEl)) {
    return lastActiveTextEdit?.isConnected && (!activeScope || scopeOf(lastActiveTextEdit) === activeScope)
      ? lastActiveTextEdit
      : null;
  }

  const ed = findPrimaryTextEditable00499_(blockEl, el);
  if (ed) lastActiveTextEdit = ed;
  return ed || (
    lastActiveTextEdit?.isConnected && (!activeScope || scopeOf(lastActiveTextEdit) === activeScope)
      ? lastActiveTextEdit
      : null
  );
}  



  const textLocalHistory_00900 = {
    target: null,
    targetNodeId: '',
    undo: [],
    redo: [],
    current: '',
    pendingBefore: null,
    pendingReason: '',
    applying: false,
    persistTimer: 0,
    actionTimer: 0,
    installed: false,
  };

  function logTextLocalHistory00900_(event, detail = {}, level = 'info') {
    const payload = { v: TEXT_LOCAL_HISTORY_VERSION_00900, ...detail };
    try { window.__ST_ALL_LOG__?.push?.(`text-widget:${event}`, payload, level); } catch {}
    try { window.__ST_AI_DESIGN_DEBUG__?.push?.(`text-widget:${event}`, payload, level); } catch {}
    try { window.__ST_PERF_DIAG__?.push?.(`text-widget:${event}`, payload, level); } catch {}
  }

  function isTextHistoryEditable00900_(target) {
    try {
      const ed = target instanceof HTMLElement
        ? (target.matches?.('[contenteditable="true"],[contenteditable="plaintext-only"]') ? target : target.closest?.('[contenteditable="true"],[contenteditable="plaintext-only"]'))
        : null;
      if (!(ed instanceof HTMLElement)) return null;
      if (!ed.closest?.('#st-site-header-slot,#st-site-main-slot,#st-site-footer-slot')) return null;
      if (ed.closest?.('.templates-gallery-modal,.gallery-modal,.st-text-pop,.stae__modal')) return null;
      if (isSpecialTextField00499_(ed) || ed.classList?.contains('st-menu__text') || ed.dataset?.stTextFlow || ed.dataset?.stTextLocalHistory === '00902' || ed.dataset?.stTextLocalHistory === '00903' || ed.dataset?.stTextLocalHistory === '00904') return ed;
      const block = ed.closest?.('.st-block,.hb-elem');
      if (isTextOwnerBlock00499_(block)) return ed;
      return null;
    } catch { return null; }
  }

  function textHistoryArea00900_(ed) {
    try {
      if (ed?.closest?.('#st-site-main-slot')) return 'main';
      if (ed?.closest?.('#st-site-header-slot')) return 'header';
      if (ed?.closest?.('#st-site-footer-slot')) return 'footer';
    } catch {}
    return '';
  }

  function textHistoryNodeId00900_(ed) {
    try {
      const owner = ed?.closest?.('[data-sf-id],[data-st-node-id],[data-node-id],.st-block,.hb-elem');
      return String(owner?.dataset?.sfId || owner?.dataset?.stNodeId || owner?.dataset?.nodeId || owner?.id || '');
    } catch { return ''; }
  }

  function cssEscapeTextHistory00902_(value) {
    const raw = String(value || '');
    try { return window.CSS?.escape ? window.CSS.escape(raw) : raw.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
    catch { return raw.replace(/[^a-zA-Z0-9_-]/g, '\\$&'); }
  }

  function findTextHistoryTargetByNodeId00902_(nodeId) {
    const id = String(nodeId || '').trim();
    if (!id) return null;
    try {
      const esc = cssEscapeTextHistory00902_(id);
      const owner = document.querySelector(`[data-sf-id="${esc}"],[data-st-node-id="${esc}"],[data-node-id="${esc}"],#${esc}`);
      if (!(owner instanceof HTMLElement)) return null;
      const ed = owner.matches?.('[contenteditable="true"],[contenteditable="plaintext-only"]')
        ? owner
        : owner.querySelector?.(':scope > .st-text-edit, :scope > [data-st-text-target="1"], :scope [contenteditable="true"], :scope [contenteditable="plaintext-only"]');
      return ed instanceof HTMLElement ? ed : null;
    } catch { return null; }
  }

  function textHistoryValue00900_(ed) {
    try { return String(ed?.innerHTML ?? ''); } catch { return ''; }
  }

  function hasPendingTextAction00902_() {
    return textLocalHistory_00900.pendingBefore !== null;
  }

  function updateTextHistoryButtons00900_() {
    try {
      const ed = resolveTextHistoryEditable00902_('buttons') || textLocalHistory_00900.target;
      const usable = ed instanceof HTMLElement && ed.isConnected && (ed.isContentEditable || ed.getAttribute('contenteditable'));
      const canUndo = !!(usable && (textLocalHistory_00900.undo.length > 0 || hasPendingTextAction00902_()));
      const canRedo = !!(usable && textLocalHistory_00900.redo.length > 0 && !hasPendingTextAction00902_());
      if (ui.textLocalUndo) {
        ui.textLocalUndo.disabled = !canUndo;
        ui.textLocalUndo.dataset.textHistoryActive = canUndo ? '1' : '0';
      }
      if (ui.textLocalRedo) {
        ui.textLocalRedo.disabled = !canRedo;
        ui.textLocalRedo.dataset.textHistoryActive = canRedo ? '1' : '0';
      }
    } catch {
      try { if (ui.textLocalUndo) { ui.textLocalUndo.disabled = true; ui.textLocalUndo.dataset.textHistoryActive = '0'; } } catch {}
      try { if (ui.textLocalRedo) { ui.textLocalRedo.disabled = true; ui.textLocalRedo.dataset.textHistoryActive = '0'; } } catch {}
    }
  }

  function clearPendingTextAction00902_() {
    try { clearTimeout(textLocalHistory_00900.actionTimer); } catch {}
    textLocalHistory_00900.pendingBefore = null;
    textLocalHistory_00900.pendingReason = '';
  }

  function resetTextHistoryFor00900_(ed, reason = 'target-change') {
    try { clearTimeout(textLocalHistory_00900.persistTimer); } catch {}
    clearPendingTextAction00902_();
    textLocalHistory_00900.target = ed instanceof HTMLElement ? ed : null;
    textLocalHistory_00900.targetNodeId = textHistoryNodeId00900_(ed);
    textLocalHistory_00900.undo = [];
    textLocalHistory_00900.redo = [];
    textLocalHistory_00900.current = textHistoryValue00900_(ed);
    updateTextHistoryButtons00900_();
    logTextLocalHistory00900_('local-history-target-00903', {
      reason,
      area: textHistoryArea00900_(ed),
      nodeId: textHistoryNodeId00900_(ed),
      undoCount: 0,
      redoCount: 0,
      actionGrouped: true,
      separateFromLayoutHistory: true,
    });
  }

  function ensureTextHistoryTarget00900_(ed, reason = 'ensure') {
    if (!(ed instanceof HTMLElement)) return false;
    const nextNodeId = textHistoryNodeId00900_(ed);
    if (textLocalHistory_00900.target !== ed) {
      if (textLocalHistory_00900.targetNodeId && nextNodeId && textLocalHistory_00900.targetNodeId === nextNodeId) {
        // 00902: If the same JSON node was re-acquired, keep undo/redo stacks.
        // This prevents the Text-widget undo button from clearing its own history.
        textLocalHistory_00900.target = ed;
      } else {
        resetTextHistoryFor00900_(ed, reason);
      }
    }
    if (!textLocalHistory_00900.targetNodeId && nextNodeId) textLocalHistory_00900.targetNodeId = nextNodeId;
    return true;
  }

  function resolveTextHistoryEditable00902_(direction = 'undo') {
    const stored = textLocalHistory_00900.target;
    if (stored instanceof HTMLElement && stored.isConnected) return stored;
    const byId = findTextHistoryTargetByNodeId00902_(textLocalHistory_00900.targetNodeId);
    if (byId instanceof HTMLElement) {
      ensureTextHistoryTarget00900_(byId, `resolve-${direction}-00902`);
      return byId;
    }
    const active = getActiveTextEditable_();
    if (active instanceof HTMLElement) {
      ensureTextHistoryTarget00900_(active, `resolve-active-${direction}-00902`);
      return active;
    }
    return null;
  }

  function pushUndoSnapshot00902_(snapshot) {
    textLocalHistory_00900.undo.push(String(snapshot ?? ''));
    if (textLocalHistory_00900.undo.length > TEXT_LOCAL_HISTORY_MAX_00900) {
      textLocalHistory_00900.undo.splice(0, textLocalHistory_00900.undo.length - TEXT_LOCAL_HISTORY_MAX_00900);
    }
  }

  function commitPendingTextAction00902_(ed, reason = 'text-local-action-commit-00902') {
    if (!(ed instanceof HTMLElement)) return false;
    if (!ensureTextHistoryTarget00900_(ed, reason)) return false;
    try { clearTimeout(textLocalHistory_00900.actionTimer); } catch {}
    const before = textLocalHistory_00900.pendingBefore;
    const after = textHistoryValue00900_(ed);
    if (before === null) {
      textLocalHistory_00900.current = after;
      commitTextContentAuthority00900_(ed, reason);
      updateTextHistoryButtons00900_();
      return false;
    }
    clearPendingTextAction00902_();
    if (String(before) === after) {
      textLocalHistory_00900.current = after;
      updateTextHistoryButtons00900_();
      return false;
    }
    pushUndoSnapshot00902_(before);
    textLocalHistory_00900.redo = [];
    textLocalHistory_00900.current = after;
    commitTextContentAuthority00900_(ed, reason);
    updateTextHistoryButtons00900_();
    logTextLocalHistory00900_('local-history-action-commit-00903', {
      reason,
      area: textHistoryArea00900_(ed),
      nodeId: textHistoryNodeId00900_(ed),
      undoCount: textLocalHistory_00900.undo.length,
      redoCount: textLocalHistory_00900.redo.length,
      localTextHistory: true,
      layoutHistory: false,
      actionGrouped: true,
      groupedBy: 'focus-session-or-idle',
    });
    return true;
  }

  function pushTextHistoryInput00900_(ed, reason = 'input') {
    if (textLocalHistory_00900.applying) return;
    if (!ensureTextHistoryTarget00900_(ed, reason)) return;
    const before = textLocalHistory_00900.current;
    const after = textHistoryValue00900_(ed);
    if (before === after && !hasPendingTextAction00902_()) { updateTextHistoryButtons00900_(); return; }
    if (!hasPendingTextAction00902_()) {
      textLocalHistory_00900.pendingBefore = before;
      textLocalHistory_00900.pendingReason = reason;
    }
    textLocalHistory_00900.current = after;
    textLocalHistory_00900.redo = [];
    updateTextHistoryButtons00900_();
    scheduleTextHistoryPersist00900_(ed, `text-local-draft-00903:${reason}`);
    try { clearTimeout(textLocalHistory_00900.actionTimer); } catch {}
    textLocalHistory_00900.actionTimer = setTimeout(() => {
      if (textLocalHistory_00900.target === ed) commitPendingTextAction00902_(ed, `text-local-idle-commit-00903:${textLocalHistory_00900.pendingReason || reason}`);
    }, TEXT_LOCAL_ACTION_IDLE_MS_00902);
    logTextLocalHistory00900_('local-history-input-draft-00903', {
      reason,
      area: textHistoryArea00900_(ed),
      nodeId: textHistoryNodeId00900_(ed),
      undoCount: textLocalHistory_00900.undo.length,
      redoCount: textLocalHistory_00900.redo.length,
      pendingAction: true,
      localTextHistory: true,
      layoutHistory: false,
      actionGrouped: true,
      delegatedPointerButtons: true,
      buttonListenersSurviveWidgetRerender: true,
    });
  }

  function commitTextContentAuthority00900_(ed, reason = 'text-local-history-00903') {
    if (!(ed instanceof HTMLElement)) return;
    const area = textHistoryArea00900_(ed);
    try {
      if (area === 'main') {
        const result = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.updateMainTextContent?.(ed, reason);
        if (!result?.ok) persistTextEditableChange00499_(ed, reason);
      } else {
        persistTextEditableChange00499_(ed, reason);
        if (area) window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.captureAreaFromDOM?.(area, reason);
      }
    } catch { try { persistTextEditableChange00499_(ed, reason); } catch {} }
    try { document.dispatchEvent(new CustomEvent('builder:contentChanged', { detail: { area, reason, nodeId: textHistoryNodeId00900_(ed), localTextHistory: true, actionGrouped: true } })); } catch {}
  }

  function scheduleTextHistoryPersist00900_(ed, reason = 'text-local-history-input-00903') {
    try { clearTimeout(textLocalHistory_00900.persistTimer); } catch {}
    textLocalHistory_00900.persistTimer = setTimeout(() => {
      commitTextContentAuthority00900_(ed, reason);
    }, 320);
  }


  function resolveTextLocalHistoryButton00903_(target) {
    try {
      const button = target instanceof HTMLElement ? target.closest?.('#st-text-local-undo,#st-text-local-redo') : null;
      if (!(button instanceof HTMLButtonElement || button instanceof HTMLElement)) return null;
      const id = String(button.id || '');
      const direction = id === 'st-text-local-undo' ? 'undo' : (id === 'st-text-local-redo' ? 'redo' : '');
      return direction ? { button, direction } : null;
    } catch { return null; }
  }

  function suppressTextLocalHistoryButtonEvent00903_(event) {
    try { event.preventDefault?.(); } catch {}
    try { event.stopPropagation?.(); } catch {}
    try { event.stopImmediatePropagation?.(); } catch {}
  }

  function handleTextLocalHistoryButtonPointer00903_(event) {
    const hit = resolveTextLocalHistoryButton00903_(event?.target);
    if (!hit) return;
    suppressTextLocalHistoryButtonEvent00903_(event);
    const ok = applyTextHistoryState00900_(hit.direction);
    updateTextHistoryButtons00900_();
    logTextLocalHistory00900_('local-history-button-pointerdown-00903', {
      direction: hit.direction,
      ok,
      disabledAttribute: !!hit.button?.disabled,
      activeDataset: String(hit.button?.dataset?.textHistoryActive || ''),
      nodeId: textLocalHistory_00900.targetNodeId || textHistoryNodeId00900_(textLocalHistory_00900.target),
      undoCount: textLocalHistory_00900.undo.length,
      redoCount: textLocalHistory_00900.redo.length,
      pointerDelegated: true,
      keepsTextFocus: true,
    });
  }

  function suppressTextLocalHistoryButtonClick00903_(event) {
    const hit = resolveTextLocalHistoryButton00903_(event?.target);
    if (!hit) return;
    suppressTextLocalHistoryButtonEvent00903_(event);
    logTextLocalHistory00900_('local-history-button-click-suppressed-00903', {
      direction: hit.direction,
      pointerDelegated: true,
      reason: 'already-handled-on-pointerdown',
    });
  }

  function applyTextHistoryState00900_(direction) {
    const ed = resolveTextHistoryEditable00902_(direction);
    if (!(ed instanceof HTMLElement)) return false;
    ensureTextHistoryTarget00900_(ed, `button-${direction}-00903`);
    const fromUndo = direction === 'undo';
    let next = null;
    const current = textHistoryValue00900_(ed);
    if (fromUndo && hasPendingTextAction00902_()) {
      next = textLocalHistory_00900.pendingBefore;
      textLocalHistory_00900.redo.push(current);
      if (textLocalHistory_00900.redo.length > TEXT_LOCAL_HISTORY_MAX_00900) textLocalHistory_00900.redo.splice(0, textLocalHistory_00900.redo.length - TEXT_LOCAL_HISTORY_MAX_00900);
      clearPendingTextAction00902_();
    } else {
      const source = fromUndo ? textLocalHistory_00900.undo : textLocalHistory_00900.redo;
      const target = fromUndo ? textLocalHistory_00900.redo : textLocalHistory_00900.undo;
      if (!source.length) { updateTextHistoryButtons00900_(); return false; }
      next = source.pop();
      target.push(current);
      if (target.length > TEXT_LOCAL_HISTORY_MAX_00900) target.splice(0, target.length - TEXT_LOCAL_HISTORY_MAX_00900);
    }
    textLocalHistory_00900.applying = true;
    try {
      ed.innerHTML = String(next ?? '');
      textLocalHistory_00900.current = textHistoryValue00900_(ed);
      try { ed.focus?.({ preventScroll: true }); } catch { try { ed.focus?.(); } catch {} }
      try {
        const range = document.createRange();
        range.selectNodeContents(ed);
        range.collapse(false);
        const sel = window.getSelection?.();
        sel?.removeAllRanges?.();
        sel?.addRange?.(range);
      } catch {}
    } finally {
      textLocalHistory_00900.applying = false;
    }
    commitTextContentAuthority00900_(ed, `text-local-${direction}-00903`);
    updateTextHistoryButtons00900_();
    logTextLocalHistory00900_(`local-history-${direction}-00903`, {
      area: textHistoryArea00900_(ed),
      nodeId: textHistoryNodeId00900_(ed),
      undoCount: textLocalHistory_00900.undo.length,
      redoCount: textLocalHistory_00900.redo.length,
      localTextHistory: true,
      layoutHistory: false,
      actionGrouped: true,
    });
    return true;
  }

  function installTextLocalHistory00900_() {
    if (textLocalHistory_00900.installed) return;
    textLocalHistory_00900.installed = true;
    document.addEventListener('focusin', (event) => {
      const ed = isTextHistoryEditable00900_(event.target);
      if (ed) ensureTextHistoryTarget00900_(ed, 'focusin');
    }, true);
    document.addEventListener('beforeinput', (event) => {
      const ed = isTextHistoryEditable00900_(event.target);
      if (ed) ensureTextHistoryTarget00900_(ed, 'beforeinput');
    }, true);
    document.addEventListener('input', (event) => {
      const ed = isTextHistoryEditable00900_(event.target);
      if (ed) pushTextHistoryInput00900_(ed, event?.inputType || 'input');
    }, true);
    document.addEventListener('blur', (event) => {
      const ed = isTextHistoryEditable00900_(event.target);
      if (ed) commitPendingTextAction00902_(ed, 'text-local-blur-commit-00903');
    }, true);
    // 00903: The Text widget can be re-rendered while the builder stays open.
    // Direct listeners on the original buttons are lost after that, so the
    // local text history controls are handled by a single delegated pointerdown.
    // Handling pointerdown also prevents the button from stealing focus and
    // turning the active contenteditable into a blur commit before Undo runs.
    document.addEventListener('pointerdown', handleTextLocalHistoryButtonPointer00903_, true);
    document.addEventListener('click', suppressTextLocalHistoryButtonClick00903_, true);
    try {
      window.ST_TEXT_LOCAL_HISTORY_00900 = Object.freeze({
        version: TEXT_LOCAL_HISTORY_VERSION_00900,
        undo: () => applyTextHistoryState00900_('undo'),
        redo: () => applyTextHistoryState00900_('redo'),
        commit: () => commitPendingTextAction00902_(textLocalHistory_00900.target, 'manual-commit-00903'),
        status: () => Object.freeze({
          undoCount: textLocalHistory_00900.undo.length,
          redoCount: textLocalHistory_00900.redo.length,
          pendingAction: hasPendingTextAction00902_(),
          targetNodeId: textHistoryNodeId00900_(textLocalHistory_00900.target) || textLocalHistory_00900.targetNodeId,
          area: textHistoryArea00900_(textLocalHistory_00900.target),
          separateFromLayoutHistory: true,
          actionGrouped: true,
        }),
      });
    } catch {}
    updateTextHistoryButtons00900_();
    logTextLocalHistory00900_('local-history-installed-00903', {
      undoButton: !!ui.textLocalUndo,
      redoButton: !!ui.textLocalRedo,
      max: TEXT_LOCAL_HISTORY_MAX_00900,
      actionIdleMs: TEXT_LOCAL_ACTION_IDLE_MS_00902,
      separateFromLayoutHistory: true,
      storeContentCapture: true,
      actionGrouped: true,
      delegatedPointerButtons: true,
      buttonListenersSurviveWidgetRerender: true,
      preventButtonBlurBeforeUndo: true,
    });
  }

  function getNativeRangeInside_(ed) {
    if (!ed) return null;

    // 1) пробуємо живе виділення
    const s = window.getSelection?.();
    if (s && s.rangeCount > 0) {
      const r = s.getRangeAt(0);
      if (r && !r.collapsed) {
        const a = r.commonAncestorContainer;
        const node = a.nodeType === 1 ? a : a.parentElement;
        if (node && ed.contains(node)) return r;
      }
    }

    // 2) fallback: останнє запамʼятоване виділення (коли фокус пішов на інпут/повзунок)
    return getRememberedRangeInside_(ed);
  }

  function normalizeSpans_(rootEl) {
    if (!rootEl) return;

    // 1) прибрати порожні
    rootEl.querySelectorAll('span').forEach(sp => {
      if (!sp.textContent) sp.remove();
    });

    // 2) розгорнути span без стилів/атрибутів
    rootEl.querySelectorAll('span').forEach(sp => {
      const hasStyle = (sp.getAttribute('style') || '').trim().length > 0;
      const hasAttrs = [...sp.attributes].some(a => a.name !== 'style');
      if (!hasStyle && !hasAttrs) {
        const frag = document.createDocumentFragment();
        while (sp.firstChild) frag.appendChild(sp.firstChild);
        sp.replaceWith(frag);
      }
    });

    // 3) зливати сусідів з однаковим style
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_ELEMENT, null);
    const toMerge = [];
    let n = walker.currentNode;
    while (n) {
      if (n.tagName === 'SPAN') {
        const next = n.nextSibling;
        if (next && next.nodeType === 1 && next.tagName === 'SPAN') {
          const a = (n.getAttribute('style') || '').trim();
          const b = (next.getAttribute('style') || '').trim();
          if (a && a === b) {
            toMerge.push([n, next]);
          }
        }
      }
      n = walker.nextNode();
    }
    toMerge.forEach(([a, b]) => {
      while (b.firstChild) a.appendChild(b.firstChild);
      b.remove();
    });
  }

  function hexToRgb_(hex) {
    const h = String(hex || '').trim();
    const m = /^#?([0-9a-f]{6})$/i.exec(h);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return { r, g, b };
  }

  function alphaTo01_(v) {
    const n = Math.max(0, Math.min(100, parseInt(v || '100', 10) || 100));
    return n / 100;
  }

  function updateSwatch_() {
    if (!ui.swatch || !ui.color || !ui.alpha) return;
    const rgb = hexToRgb_(ui.color.value);
    const a = alphaTo01_(ui.alpha.value);
    if (!rgb) return;
    ui.swatch.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }


  // applySwatch_ — синхронізує превʼю-кружечок кольору (swatch) без залежності від ui.color/ui.alpha
  function applySwatch_(rgb, a01) {
    if (!ui.swatch || !rgb) return;
    const a = (typeof a01 === 'number' && !isNaN(a01)) ? a01 : 1;
    ui.swatch.style.background = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  function getCustomColors_(key) {
    try {
      const raw = localStorage.getItem(key || LS_CUSTOM_KEY);
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function setCustomColors_(arr, key) {
    try {
      localStorage.setItem(key || LS_CUSTOM_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
    } catch {}
    scheduleToolbarSync_();
  }

  function renderPalette_(root, colors, mode) {
    if (!root) return;
    root.innerHTML = '';
    colors.forEach((c, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'st-color-chip' + (c ? '' : ' is-empty');
      b.dataset.mode = mode;
      b.dataset.index = String(idx);
      if (c) {
        b.style.background = c;
        b.title = c;
      } else {
        b.title = 'Порожній слот (клік — зберегти поточний колір)';
        b.textContent = '+';
      }
      root.appendChild(b);
    });
  }

  function rebuildPalettes_() {
    renderPalette_(ui.palette, STD_COLORS, 'std');

    const cur = getCustomColors_();
    const slots = new Array(20).fill('');
    for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
    renderPalette_(ui.custom, slots, 'custom');
  }

  
  function rebuildStrokePalettes_() {
    renderPalette_(ui.strokePalette, STD_COLORS, 'stroke-std');

    const cur = getCustomColors_(LS_STROKE_CUSTOM_KEY);
    const slots = new Array(20).fill('');
    for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
    renderPalette_(ui.strokeCustom, slots, 'stroke-custom');
  }

  function openStrokePop_(on) {
    if (!ui.strokePop) return;
    const show = (typeof on === 'boolean') ? on : ui.strokePop.hidden;
    ui.strokePop.hidden = !show;
    if (!show) { strokeCustomActiveIdx = -1; return; }

    // На відкриття — завжди перебудовуємо палітри й синхронізуємо значення
    rebuildStrokePalettes_();

    const ed = getActiveTextEditable_();
    try { lastActiveTextEdit = ed || lastActiveTextEdit; } catch {}
    if (ed) {
      const sc = getTextStrokeColor_(ed) || '#000000';
      // input може бути відсутній у майбутньому — тому guarded
      try { if (ui.strokeColor) ui.strokeColor.value = sc; } catch {}
      try {
        const a = getTextStrokeAlpha_(ed);
        if (ui.strokeAlpha) ui.strokeAlpha.value = String(Math.round(a * 100));
        if (ui.strokeAlphaVal) ui.strokeAlphaVal.textContent = String(Math.round(a * 100)) + '%';
      } catch {}

      paintStrokeSwatch_(getTextStrokeWidth_(ed) > 0 ? sc : '');
    }
  }
	function openPop_(on) {
    if (!ui.pop) return;
    const show = (typeof on === 'boolean') ? on : ui.pop.hidden;
    ui.pop.hidden = !show;
    if (show) rebuildPalettes_();
  }

  function openHeadingPop_(on) {
    if (!ui.headingPop) return;
    const show = (typeof on === 'boolean') ? on : ui.headingPop.hidden;
    ui.headingPop.hidden = !show;
  }


  
  function stripStylesInFragment_(frag, props) {
    try {
      const p = Array.isArray(props) ? props : [];
      // TreeWalker works on a Node; wrap in a temporary container to traverse reliably
      const box = document.createElement('div');
      box.appendChild(frag);
      const tw = document.createTreeWalker(box, NodeFilter.SHOW_ELEMENT);
      let n = tw.currentNode;
      while (n) {
        for (const k of p) {
          try { n.style[k] = ''; } catch {}
        }
        // cleanup empty style attr
        try {
          const st = n.getAttribute('style');
          if (st != null && String(st).trim() === '') n.removeAttribute('style');
        } catch {}
        n = tw.nextNode();
      }
      // move content back into fragment
      const out = document.createDocumentFragment();
      while (box.firstChild) out.appendChild(box.firstChild);
      return out;
    } catch {
      return frag;
    }
  }


  

  function rebuildShadowPalettes_() {
    renderPalette_(ui.shadowPalette, STD_COLORS, 'shadow-std');

    const cur = getCustomColors_(LS_SHADOW_CUSTOM_KEY);
    const slots = new Array(20).fill('');
    for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
    renderPalette_(ui.shadowCustom, slots, 'shadow-custom');
  }

  function openShadowPop_(on) {
    if (!ui.shadowPop) return;
    const show = (typeof on === 'boolean') ? on : ui.shadowPop.hidden;

    // закриваємо інші поповери, щоб не було каші
    ui.pop && (ui.pop.hidden = true);
    ui.headingPop && (ui.headingPop.hidden = true);
    ui.borderPop && (ui.borderPop.hidden = true);
    ui.strokePop && (ui.strokePop.hidden = true);

    ui.shadowPop.hidden = !show;

    if (show) {
      // синхронізуємо UI з активним елементом (якщо є)
      const ed = getActiveTextEditable_();
      const saved = ed?.dataset?.stTextShadow ? safeJsonParse_(ed.dataset.stTextShadow) : null;

      const c = saved?.c || (ui.shadowColor?.value || '#000000');
      const a = typeof saved?.a === 'number' ? saved.a : (parseInt(ui.shadowAlpha?.value || '100', 10) || 100);
      const x = typeof saved?.x === 'number' ? saved.x : 0;
      const y = typeof saved?.y === 'number' ? saved.y : 0;
      const b = typeof saved?.b === 'number' ? saved.b : 8;
      const s = typeof saved?.s === 'number' ? saved.s : 0;

      if (ui.shadowColor) ui.shadowColor.value = c;
      if (ui.shadowAlpha) ui.shadowAlpha.value = String(clamp(a, 0, 100));
      if (ui.shadowAlphaVal) ui.shadowAlphaVal.textContent = `${clamp(a, 0, 100)}%`;

      if (ui.shadowX) ui.shadowX.value = String(clamp(x, -50, 50));
      if (ui.shadowXVal) ui.shadowXVal.textContent = String(clamp(x, -50, 50));

      if (ui.shadowY) ui.shadowY.value = String(clamp(y, -50, 50));
      if (ui.shadowYVal) ui.shadowYVal.textContent = String(clamp(y, -50, 50));

      if (ui.shadowBlur) ui.shadowBlur.value = String(clamp(b, 0, 60));
      if (ui.shadowBlurVal) ui.shadowBlurVal.textContent = String(clamp(b, 0, 60));

      if (ui.shadowSharp) ui.shadowSharp.value = String(clamp(s, 0, 6));
      if (ui.shadowSharpVal) ui.shadowSharpVal.textContent = String(clamp(s, 0, 6));

      rebuildShadowPalettes_();
    }
  }

  function rgbaFromHexAlpha_(hex, a01) {
    const h = (hex || '').replace('#', '').trim();
    const hh = (h.length === 3) ? (h[0]+h[0]+h[1]+h[1]+h[2]+h[2]) : h;
    const r = parseInt(hh.slice(0,2) || '00', 16);
    const g = parseInt(hh.slice(2,4) || '00', 16);
    const b = parseInt(hh.slice(4,6) || '00', 16);
    const a = Math.max(0, Math.min(1, a01));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function buildTextShadow_(cHex, alphaPct, x, y, blur, sharp) {
    const a01 = (Math.max(0, Math.min(100, alphaPct)) / 100);
    const col = rgbaFromHexAlpha_(cHex || '#000000', a01);
    const xx = `${x || 0}px`;
    const yy = `${y || 0}px`;
    const bb = `${blur || 0}px`;
    const sharpPx = Math.max(0, sharp || 0);

    // 1) основна тінь
    const base = `${xx} ${yy} ${bb} ${col}`;

    // 2) "чіткість" — додатковий шар без blur
    if (sharpPx > 0) {
      // трохи зменшена альфа, щоб не "забивало" текст
      const col2 = rgbaFromHexAlpha_(cHex || '#000000', Math.max(0, Math.min(1, a01 * 0.75)));
      const sharpLayer = `${xx} ${yy} 0 ${col2}`;
      return `${base}, ${sharpLayer}`;
    }
    return base;
  }

  function setTextShadow_(ed, value, meta) {
    if (!ed) return;
    ed.style.setProperty('--st-text-shadow', value || 'none');
    if (meta) {
      ed.dataset.stTextShadow = JSON.stringify(meta);
    }
  }

  function applyShadowFromUI_() {
    // Menu mode: apply text-shadow to menu items or whole menu
    const mt = getMenuTextTargets_();
    if (mt && mt.menu) {
      const c = ui.shadowColor?.value || '#000000';
      const a = parseInt(ui.shadowAlpha?.value || '100', 10) || 100;
      const x = parseInt(ui.shadowX?.value || '0', 10) || 0;
      const y = parseInt(ui.shadowY?.value || '0', 10) || 0;
      const b = parseInt(ui.shadowBlur?.value || '8', 10) || 8;
      const s = parseInt(ui.shadowSharp?.value || '0', 10) || 0;
      const val = buildTextShadow_(c, a, x, y, b, s);
      applyMenuVar_('--st-menu-link-ts', val || 'none');
      if (ui.shadowSwatch) ui.shadowSwatch.style.background = rgbaFromHexAlpha_(c, a / 100);
      return;
    }

    const ed = getActiveTextEditable_();
    if (!ed) return;

    const c = ui.shadowColor?.value || '#000000';
    const a = parseInt(ui.shadowAlpha?.value || '100', 10) || 100;
    const x = parseInt(ui.shadowX?.value || '0', 10) || 0;
    const y = parseInt(ui.shadowY?.value || '0', 10) || 0;
    const b = parseInt(ui.shadowBlur?.value || '8', 10) || 8;
    const s = parseInt(ui.shadowSharp?.value || '0', 10) || 0;

    const val = buildTextShadow_(c, a, x, y, b, s);
    setTextShadow_(ed, val, { c, a, x, y, b, s });

    // свотч у кнопці
    if (ui.shadowSwatch) {
      ui.shadowSwatch.style.background = rgbaFromHexAlpha_(c, a / 100);
    }
  }

  function safeJsonParse_(s) {
    try { return JSON.parse(s); } catch { return null; }
  }
function openBorderPop_(on) {
    if (!ui.borderPop) return;
    const val = !!on;
    ui.borderPop.hidden = !val;
    if (val) {
      // закриваємо інші попапи
      openPop_(false);
      if (ui.headingPop) ui.headingPop.hidden = true;

      // підтягуємо поточний колір
      const ed = getActiveTextEditable_();
      if (ed && ui.borderColor) {
        const cur = getTextBorderColor_(ed) || '#ffffff';
        ui.borderColor.value = cur;
        paintBorderSwatch_(cur);
      }
    }
  }


  // (openStrokePop_ визначено вище — не дублюємо)



  function paintBorderSwatch_(hex) {
    try {
      if (!ui.borderSwatch) return;
      ui.borderSwatch.style.background = String(hex || 'transparent');
      ui.borderSwatch.style.opacity = hex ? '1' : '0';
    } catch {}
  }

  function getTextBorderWidth_(ed) {
    try {
      const v = ed?.style?.getPropertyValue('--st-text-bw');
      const n = parseFloat(String(v || '').replace('px',''));
      return Number.isFinite(n) ? n : 0;
    } catch {}
    return 0;
  }

  function getTextBorderColor_(ed) {
    try {
      const v = ed?.style?.getPropertyValue('--st-text-bc');
      const s = String(v || '').trim();
      if (!s) return '';
      // якщо вже hex
      if (s.startsWith('#')) return s;
      return s;
    } catch {}
    return '';
  }

  function setTextBorder_(ed, widthPx, color) {
    if (!ed) return;
    const w = Math.max(0, Math.min(24, parseFloat(widthPx) || 0));
    const c = String(color || '').trim();
    try { ed.style.setProperty('--st-text-bw', w + 'px'); } catch {}
    try { ed.style.setProperty('--st-text-bc', c || 'transparent'); } catch {}
  }

  
  function getTextStrokeWidth_(ed) {
    try {
      const v = ed?.style?.getPropertyValue('--st-text-sw');
      const n = parseFloat(String(v || '').replace('px',''));
      return Number.isFinite(n) ? n : 0;
    } catch {}
    return 0;
  }

  function getTextStrokeColor_(ed) {
    try {
      const v = ed?.style?.getPropertyValue('--st-text-sc');
      return String(v || '').trim();
    } catch {}
    return '';
  }

  function getTextStrokeAlpha_(ed) {
    try {
      const v = ed?.style?.getPropertyValue('--st-text-sa');
      const n = parseFloat(String(v || '').trim());
      if (Number.isFinite(n)) return Math.max(0, Math.min(1, n));
    } catch {}
    return 1;
  }

  function paintStrokeSwatch_(color) {
    const sw = ui.strokeSwatch;
    if (!sw) return;
    try {
      const hex = String(color || '').trim();
      sw.style.background = hex || 'transparent';
      sw.style.opacity = hex ? '1' : '0';
    } catch {}
  }

  
  function hexToRgba_(hex, alpha) {
    const h = String(hex || '').trim();
    if (!h) return '';
    let s = h;
    if (s[0] === '#') s = s.slice(1);
    if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
    if (s.length !== 6) return '';
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return '';
    const a = Math.max(0, Math.min(1, Number(alpha)));
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

function setTextStroke_(ed, widthPx, color, alpha01) {
    if (!ed) return;
    const w = Math.max(0, Math.min(12, parseFloat(widthPx) || 0));
    const c = String(color || '').trim();
    const a = Math.max(0, Math.min(1, (typeof alpha01 === 'number') ? alpha01 : parseFloat(alpha01)));
    const alpha = Number.isFinite(a) ? a : 1;

    try { ed.style.setProperty('--st-text-sw', w + 'px'); } catch {}
    try { ed.style.setProperty('--st-text-sc', c || 'transparent'); } catch {}
    try { ed.style.setProperty('--st-text-sa', String(alpha)); } catch {}

    // Chrome safety
    try {
      ed.style.webkitTextStrokeWidth = w ? (w + 'px') : '';
      if (!w || !c) {
        ed.style.webkitTextStrokeColor = '';
      } else if (alpha >= 0.999) {
        ed.style.webkitTextStrokeColor = c;
      } else {
        ed.style.webkitTextStrokeColor = hexToRgba_(c, alpha) || c;
      }
    } catch {}
  }

  function bumpTextStrokeWidth_(delta) {
    // Menu mode
    const mt = getMenuTextTargets_();
    if (mt && mt.items && mt.items.length) {
      const baseEl = mt.items[0];
      const css = getComputedStyle(baseEl);
      const cur = parseFloat(String(css.getPropertyValue('--st-menu-link-sw') || '').trim().replace('px',''));
      const curW = Number.isFinite(cur) ? cur : 0;
      const next = Math.max(0, Math.min(12, curW + delta));
      const col = String(ui.strokeColor?.value || '#000000').trim() || '#000000';
      const a = ui.strokeAlpha ? alphaTo01_(ui.strokeAlpha.value) : 1;
      const sc = hexToRgba_(col, a) || col;

      applyMenuVar_('--st-menu-link-sw', next + 'px');
      if (next <= 0) {
        applyMenuVar_('--st-menu-link-sc', 'transparent');
        paintStrokeSwatch_('');
      } else {
        applyMenuVar_('--st-menu-link-sc', sc);
        paintStrokeSwatch_(col);
      }
      scheduleToolbarSync_();
      return;
    }

    const ed = getActiveTextEditable_();
    if (!ed) return;
    const cur = getTextStrokeWidth_(ed) || 0;
    const next = Math.max(0, Math.min(12, cur + delta));
    const col = getTextStrokeColor_(ed) || String(ui.strokeColor?.value || '#000000');
    setTextStroke_(ed, next, col, getTextStrokeAlpha_(ed));
    paintStrokeSwatch_(col);
    scheduleToolbarSync_();
  }


  function bumpTextBorderWidth_(delta) {
    const ed = getActiveTextEditable_();
    if (!ed) return;
    const cur = getTextBorderWidth_(ed) || 0;
    const next = Math.max(0, Math.min(24, cur + delta));
    const col = getTextBorderColor_(ed) || '#ffffff';
    setTextBorder_(ed, next, col);
    scheduleToolbarSync_();
    try { window.ST_HISTORY?.capture?.('text-border-width'); } catch {}
  }
  const liveTextStyle00924_ = {
    key: '',
    editable: null,
    span: null,
    wholeField: false,
    range: null,
    raf: 0,
    pendingStyle: null,
  };

  function clearLiveTextStyle00924_() {
    try { if (liveTextStyle00924_.raf) cancelAnimationFrame(liveTextStyle00924_.raf); } catch {}
    liveTextStyle00924_.key = '';
    liveTextStyle00924_.editable = null;
    liveTextStyle00924_.span = null;
    liveTextStyle00924_.wholeField = false;
    liveTextStyle00924_.range = null;
    liveTextStyle00924_.raf = 0;
    liveTextStyle00924_.pendingStyle = null;
  }

  function pinTextStyleGesture00925_(gestureKey) {
    const key = String(gestureKey || '');
    const ed = getActiveTextEditable_();
    if (!(ed instanceof HTMLElement)) return false;
    const range = getNativeRangeInside_(ed);
    clearLiveTextStyle00924_();
    liveTextStyle00924_.key = key;
    liveTextStyle00924_.editable = ed;
    liveTextStyle00924_.range = range && !range.collapsed ? range.cloneRange() : null;
    liveTextStyle00924_.wholeField = !liveTextStyle00924_.range;
    lastActiveTextEdit = ed;
    return true;
  }

  function writeLiveStyle00925_(target, styleObj) {
    if (!(target instanceof HTMLElement)) return;
    liveTextStyle00924_.pendingStyle = { ...(liveTextStyle00924_.pendingStyle || {}), ...(styleObj || {}) };
    if (liveTextStyle00924_.raf) return;
    liveTextStyle00924_.raf = requestAnimationFrame(() => {
      liveTextStyle00924_.raf = 0;
      const patch = liveTextStyle00924_.pendingStyle || {};
      liveTextStyle00924_.pendingStyle = null;
      Object.entries(patch).forEach(([k, v]) => {
        try { target.style[k] = v; } catch {}
      });
    });
  }

  function flushLiveStyle00925_() {
    if (!liveTextStyle00924_.raf) return;
    try { cancelAnimationFrame(liveTextStyle00924_.raf); } catch {}
    liveTextStyle00924_.raf = 0;
    const target = liveTextStyle00924_.wholeField ? liveTextStyle00924_.editable : liveTextStyle00924_.span;
    const patch = liveTextStyle00924_.pendingStyle || {};
    liveTextStyle00924_.pendingStyle = null;
    if (!(target instanceof HTMLElement)) return;
    Object.entries(patch).forEach(([k, v]) => {
      try { target.style[k] = v; } catch {}
    });
  }

function applyInlineStyle_(styleObj, options = null) {
    const preview = !!options?.preview;
    const gestureKey = String(options?.gestureKey || '');
    const pinned = !!(
      gestureKey &&
      liveTextStyle00924_.key === gestureKey &&
      liveTextStyle00924_.editable?.isConnected
    );
    const ed = pinned ? liveTextStyle00924_.editable : getActiveTextEditable_();
    const r = pinned
      ? (liveTextStyle00924_.range ? liveTextStyle00924_.range.cloneRange() : null)
      : getNativeRangeInside_(ed);
    if (!ed) return;

    if (
      preview && gestureKey &&
      liveTextStyle00924_.key === gestureKey &&
      liveTextStyle00924_.editable === ed
    ) {
      const target = liveTextStyle00924_.wholeField ? ed : liveTextStyle00924_.span;
      if (target?.isConnected) {
        writeLiveStyle00925_(target, styleObj);
        return;
      }
      if (target) clearLiveTextStyle00924_();
    }

    // 00499: when a phone/button/logo label is selected as a whole field, there
    // may be no native text range. In that case apply the text style to the whole
    // label instead of doing nothing.
    if (!r || r.collapsed) {
      try {
        Object.entries(styleObj || {}).forEach(([k, v]) => {
          try { ed.style[k] = v; } catch {}
        });
        lastActiveTextEdit = ed;
        if (preview && gestureKey) {
          liveTextStyle00924_.key = gestureKey;
          liveTextStyle00924_.editable = ed;
          liveTextStyle00924_.span = null;
          liveTextStyle00924_.wholeField = true;
          liveTextStyle00924_.range = null;
          return;
        }
        persistTextEditableChange00499_(ed, 'text-widget-direct-style-00499');
        scheduleToolbarSync_();
        return;
      } catch {}
      return;
    }

    // створюємо span, загортаємо вміст range
    const span = document.createElement('span');
    // The formatting wrapper is always inline. This prevents broad legacy
    // heading/span rules from turning a selected fragment into a new row.
    span.style.display = 'inline';
    Object.entries(styleObj || {}).forEach(([k, v]) => {
      try { span.style[k] = v; } catch {}
    });

    let frag = r.extractContents();
    // якщо ставимо fontSize — робимо виділення однорідним, прибираючи старі fontSize всередині
    if (styleObj && Object.prototype.hasOwnProperty.call(styleObj, 'fontSize')) {
      frag = stripStylesInFragment_(frag, ['fontSize']);
    }
    span.appendChild(frag);
    r.insertNode(span);

    // відновити виділення на новий span (лише якщо користувач реально виділяє текст зараз)
    try {
      const s = window.getSelection?.();
      if (s && s.rangeCount > 0) {
        const cur = s.getRangeAt(0);
        const a = cur?.commonAncestorContainer;
        const node = a ? (a.nodeType === 1 ? a : a.parentElement) : null;
        const selectionInside = !!(node && ed.contains(node));
        if (selectionInside) {
          s.removeAllRanges();
          const nr = document.createRange();
          nr.selectNodeContents(span);
          s.addRange(nr);
        }
      }
    } catch {}

    // оновити remembered range (для випадку, коли фокус на інпуті)
    try {
      const nr = document.createRange();
      nr.selectNodeContents(span);
      lastRange_ = nr;
      lastEditable_ = ed;
    } catch {}
    if (preview && gestureKey) {
      liveTextStyle00924_.key = gestureKey;
      liveTextStyle00924_.editable = ed;
      liveTextStyle00924_.span = span;
      liveTextStyle00924_.wholeField = false;
      try {
        const pinnedRange = document.createRange();
        pinnedRange.selectNodeContents(span);
        liveTextStyle00924_.range = pinnedRange;
      } catch {
        liveTextStyle00924_.range = null;
      }
      return;
    }
normalizeSpans_(ed);
    persistTextEditableChange00499_(ed, 'text-widget-range-style-00499');

    // історія (одноразово)
    if (window.ST_HISTORY && typeof window.ST_HISTORY.capture === 'function') {
      window.ST_HISTORY.capture('text-style');
    }
    // Важливо для режиму "Ховер" у звичайному текстовому блоці:
    // після кліку по Курсив/Жирний кнопка має одразу показати активний стан.
    scheduleToolbarSync_();
  }

  function finishInlineStyle00924_(styleObj, gestureKey) {
    const key = String(gestureKey || '');
    const ed = (
      liveTextStyle00924_.key === key &&
      liveTextStyle00924_.editable?.isConnected
    ) ? liveTextStyle00924_.editable : getActiveTextEditable_();
    if (
      ed &&
      liveTextStyle00924_.key === key &&
      liveTextStyle00924_.editable === ed
    ) {
      if (!liveTextStyle00924_.wholeField && !liveTextStyle00924_.span) {
        applyInlineStyle_(styleObj, { preview: true, gestureKey: key });
      }
      flushLiveStyle00925_();
      const target = liveTextStyle00924_.wholeField ? ed : liveTextStyle00924_.span;
      if (target?.isConnected) {
        Object.entries(styleObj || {}).forEach(([k, v]) => {
          try { target.style[k] = v; } catch {}
        });
      }
      if (!liveTextStyle00924_.wholeField) normalizeSpans_(ed);
      clearLiveTextStyle00924_();
      persistTextEditableChange00499_(ed, 'text-widget-final-style-00924');
      try { window.ST_HISTORY?.capture?.('text-style'); } catch {}
      scheduleToolbarSync_();
      return;
    }
    clearLiveTextStyle00924_();
    applyInlineStyle_(styleObj);
  }


  function applyHeading_(level) {
    const ed = getActiveTextEditable_();
    const r = getNativeRangeInside_(ed);
    if (!ed || !r) return;
    if (r.collapsed) return;

    const lvlRaw = parseInt(level, 10);
    const lvl = isNaN(lvlRaw) ? 0 : Math.max(0, Math.min(6, lvlRaw));

    // helpers
    const isHeadingTag = (tn) => {
      const t = String(tn || '').toLowerCase();
      return /^h[1-6]$/.test(t);
    };



    const closestHeading = (node) => {
      let cur = (node && node.nodeType === 1) ? node : node?.parentElement;
      while (cur && cur !== ed) {
        if (isHeadingTag(cur.tagName)) return cur;
        cur = cur.parentElement;
      }
      return null;
    };



    const unwrapHeadingsInFragment_ = (frag) => {
      if (!frag) return frag;
      try {
        const headings = frag.querySelectorAll?.('h1,h2,h3,h4,h5,h6');
        if (!headings || headings.length === 0) return frag;

        headings.forEach((h) => {
          const p = h.parentNode;
          if (!p) return;
          while (h.firstChild) p.insertBefore(h.firstChild, h);
          p.removeChild(h);
        });
      } catch {}
      return frag;
    };



    const replaceTag_ = (oldEl, newTag) => {
      if (!oldEl || !newTag) return null;
      const neu = document.createElement(newTag);
      // переносимо атрибути (крім id, щоб не плодити дубль)
      try {
        for (const attr of Array.from(oldEl.attributes || [])) {
          if (attr && attr.name && attr.name.toLowerCase() !== 'id') {
            neu.setAttribute(attr.name, attr.value);
          }
        }
      } catch {}
      // переносимо дітей
      while (oldEl.firstChild) neu.appendChild(oldEl.firstChild);
      oldEl.replaceWith(neu);
      return neu;
    };



    try {
      const hStart = closestHeading(r.startContainer);
      const hEnd = closestHeading(r.endContainer);
      const sameHeading = (hStart && hEnd && hStart === hEnd) ? hStart : null;

      // CASE A: selection is fully inside one heading element → replace/unset (no nesting!)
      if (sameHeading) {
        const current = String(sameHeading.tagName || '').toLowerCase(); // h1..h6
        if (lvl === 0) {
          // make it normal text (block)
          replaceTag_(sameHeading, 'div');
        } else {
          const want = 'h' + String(lvl);
          if (current === want) return; // no-op
          replaceTag_(sameHeading, want);
        }
      } else {
        // CASE B: selection not in single heading → wrap fragment once
        if (lvl === 0) return; // already normal
        const tag = 'h' + String(lvl);
        const h = document.createElement(tag);

        const frag = unwrapHeadingsInFragment_(r.extractContents());
        h.appendChild(frag);
        r.insertNode(h);

        // put selection inside new heading
        try {
          const sel = window.getSelection?.();
          if (sel) {
            sel.removeAllRanges();
            const nr = document.createRange();
            nr.selectNodeContents(h);
            sel.addRange(nr);
          }
        } catch {}
      }

      if (window.ST_HISTORY && typeof window.ST_HISTORY.capture === 'function') {
        window.ST_HISTORY.capture('text-heading');
      }

      try { ed.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
      normalizeSpans_(ed);
    } catch {}
  }


  function applyColorFromUI_(preview = false) {
    if (!ui.color || !ui.alpha) return;
    // Menu mode: color for menu items (or whole menu)
    const mt = getMenuTextTargets_();
    if (mt && mt.menu) {
      const rgbM = hexToRgb_(ui.color.value);
      if (!rgbM) return;
      const aM = alphaTo01_(ui.alpha.value);
      const valM = `rgba(${rgbM.r}, ${rgbM.g}, ${rgbM.b}, ${aM})`;
      applyMenuVar_('--st-menu-link-color', valM);
      updateSwatch_();
      return;
    }
    const rgb = hexToRgb_(ui.color.value);
    if (!rgb) return;
    const a = alphaTo01_(ui.alpha.value);
    const style = { color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` };
    if (preview) applyInlineStyle_(style, { preview: true, gestureKey: 'color' });
    else finishInlineStyle00924_(style, 'color');
    updateSwatch_();
  }
  function applyStrokeColorFromUI_() {
    if (!ui.strokeColor) return;

    // Menu mode: stroke for menu items (or whole menu)
    const mt = getMenuTextTargets_();
    if (mt && mt.menu) {
      const col = String(ui.strokeColor.value || '').trim() || '#000000';
      const a = ui.strokeAlpha ? alphaTo01_(ui.strokeAlpha.value) : 1;
      const rgba = hexToRgba_(col, a) || col;
      // current width (from first item/menu)
      let w = 0;
      try {
        const ref = (mt.items && mt.items[0]) ? mt.items[0] : mt.menu;
        const v = getComputedStyle(ref).getPropertyValue('--st-menu-link-sw') || '';
        w = parseFloat(String(v).replace('px',''));
        if (!Number.isFinite(w)) w = 0;
      } catch {}
      if (w > 0) {
        applyMenuVar_('--st-menu-link-sc', rgba);
        paintStrokeSwatch_(col);
      } else {
        // if stroke is off, keep swatch hidden
        applyMenuVar_('--st-menu-link-sc', 'transparent');
        paintStrokeSwatch_('');
      }
      scheduleToolbarSync_();
      try { window.ST_HISTORY?.capture?.('menu-text-stroke-color'); } catch {}
      return;
    }

    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    if (!ed) return;
    const col = String(ui.strokeColor.value || '').trim() || '#000000';
    const a = ui.strokeAlpha ? alphaTo01_(ui.strokeAlpha.value) : 1;
    const w = getTextStrokeWidth_(ed) || 0;
    setTextStroke_(ed, w, col, a);
    paintStrokeSwatch_((w > 0) ? col : '');
    scheduleToolbarSync_();
    try { window.ST_HISTORY?.capture?.('text-stroke-color'); } catch {}
  }



  // --- Text Flow Mode (nowrap / wrap / clip) ---
  function normalizeTextFlowMode_(mode) {
    const v = String(mode || '').trim().toLowerCase();
    return (v === 'nowrap' || v === 'wrap' || v === 'clip') ? v : '';
  }

  function getActiveTextBlock_() {
    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    if (ed) {
      const block = ed.closest?.('.st-block--text, [data-block-kind="text"], .st-block--phone, .st-block--button, .st-block--logo, .st-block');
      if (block instanceof HTMLElement && isTextOwnerBlock00499_(block)) return block;
    }
    const els = getSelectedElements_();
    for (const el of els) {
      const block = el?.classList?.contains('st-block') ? el : el?.closest?.('.st-block--text, [data-block-kind="text"], .st-block--phone, .st-block--button, .st-block--logo, .st-block');
      if (block instanceof HTMLElement && isTextOwnerBlock00499_(block)) return block;
    }
    return null;
  }


  function isButtonLikeTextBlock_(block, ed) {
    try {
      const role = String(block?.dataset?.blockRole || '').toLowerCase();
      return !!(
        role === 'button' || role === 'phone' || role === 'logo' ||
        block?.classList?.contains('st-block--button') ||
        block?.classList?.contains('st-block--phone') ||
        block?.classList?.contains('st-block--logo') ||
        ed?.classList?.contains('st-button__label') ||
        ed?.classList?.contains('st-phone__text') ||
        ed?.classList?.contains('st-logo__title') ||
        ed?.classList?.contains('st-logo__subtitle')
      );
    } catch {}
    return false;
  }

  function getTextFlowDefault_(block, ed) {
    return isButtonLikeTextBlock_(block, ed) ? 'nowrap' : 'wrap';
  }

  function getActiveTextFlowTargets_() {
    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    const block = ed?.closest?.('.st-block--text, [data-block-kind="text"], .st-block--phone, .st-block--button, .st-block--logo, .st-block') || getActiveTextBlock_();
    if (!(block instanceof HTMLElement)) return { block: null, edits: [] };

    // Для кнопки/телефону беремо основну мітку. Для звичайного тексту — прямий editable.
    const primary = ed && block.contains(ed) ? ed : (
      block.querySelector?.(':scope > .st-text-edit[data-st-text-target="1"], :scope > .st-text-edit, .st-text-edit[data-st-text-target="1"], .st-text-edit') || null
    );
    const edits = primary instanceof HTMLElement ? [primary] : [];
    return { block, edits };
  }

  function readActiveTextFlow_() {
    const { block, edits } = getActiveTextFlowTargets_();
    const ed = edits[0] || null;
    const explicit = normalizeTextFlowMode_(ed?.dataset?.stTextFlow) || normalizeTextFlowMode_(block?.dataset?.stTextFlow);
    return explicit || getTextFlowDefault_(block, ed);
  }

  function applyTextFlowMode_(mode) {
    const next = normalizeTextFlowMode_(mode);
    if (!next) return;
    const { block, edits } = getActiveTextFlowTargets_();
    if (!(block instanceof HTMLElement) || !edits.length) return;

    try { block.dataset.stTextFlow = next; } catch {}
    edits.forEach((ed) => {
      try { ed.dataset.stTextFlow = next; } catch {}
      // прибираємо inline-артефакти, які могли залишитись від старих шаблонів;
      // сам режим задається атрибутом + CSS з !important.
      try {
        if (next === 'clip') {
          ed.style.minWidth = '5px';
        } else {
          ed.style.removeProperty('min-width');
        }
      } catch {}
    });

    try { window.SiteCanvas?.refreshEnhancers?.(document.getElementById('site-root') || document); } catch {}
    try { window.ST_HISTORY?.capture?.('text-flow-mode'); } catch {}
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: 'text-flow-mode' }); } catch {}
    try { window.dispatchEvent(new CustomEvent('st:selection:changed', { detail: { source: 'text-flow-mode' } })); } catch {}
    try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { source: 'text-flow-mode' } })); } catch {}
    syncTextFlowButtons_();
    scheduleToolbarSync_();
  }

  function syncTextFlowButtons_() {
    const hasMenu = !!getMenuTextTargets_();
    const flow = readActiveTextFlow_();
    const { block, edits } = getActiveTextFlowTargets_();
    const enabled = !hasMenu && !!block && edits.length > 0;
    try {
      (ui.flowButtons || []).forEach((btn) => {
        const v = normalizeTextFlowMode_(btn.getAttribute('data-st-text-flow-btn'));
        btn.toggleAttribute('disabled', !enabled);
        btn.classList.toggle('is-active', enabled && v === flow);
        btn.setAttribute('aria-pressed', enabled && v === flow ? 'true' : 'false');
      });
    } catch {}
  }

  // --- UI handlers ---
  ui.stateToolbar?.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-text-state]');
    if (!btn || btn.hasAttribute('disabled')) return;
    activeTextState_ = normalizeTextState_(btn.getAttribute('data-text-state'));
    syncTextStateToolbar_();
    scheduleToolbarSync_();
  });

  ui.colorBtn?.addEventListener('click', () => openPop_());

  (ui.flowButtons || []).forEach((btn) => {
    btn?.addEventListener('click', () => {
      if (btn.hasAttribute('disabled')) return;
      applyTextFlowMode_(btn.getAttribute('data-st-text-flow-btn'));
    });
  });

  ui.resetStyles?.addEventListener('click', () => {
    // Menu buttons: remove vars from current scope (menu or selected items)
    if (resetMenuTextStyles_()) {
      scheduleToolbarSync_();
      return;
    }

    // Fallback for regular text blocks: remove formatting from current selection.
    try {
      document.execCommand('removeFormat');
      scheduleToolbarSync_();
      try { window.ST_HISTORY?.capture?.('text-reset'); } catch {}
    } catch {}
  });

  ui.borderBtn?.addEventListener('click', () => openBorderPop_(true));
  ui.borderClose?.addEventListener('click', () => openBorderPop_(false));
  ui.borderPop?.addEventListener('click', (ev) => ev.stopPropagation());
  ui.borderColor?.addEventListener('input', () => {
    const ed = getActiveTextEditable_();
    if (!ed) return;
    const col = String(ui.borderColor?.value || '').trim();
    const w = getTextBorderWidth_(ed) || 1;
    setTextBorder_(ed, w, col);
    paintBorderSwatch_(col);
    scheduleToolbarSync_();
  });

  ui.borderMinus?.addEventListener('click', () => bumpTextBorderWidth_(-1));
  ui.borderPlus?.addEventListener('click', () => bumpTextBorderWidth_(+1));

  ui.strokeBtn?.addEventListener('click', (ev) => {
    // ВАЖЛИВО: клік по кнопці може тимчасово зняти active на полотні,
    // тому зупиняємо bubbling і кешуємо останній активний editable.
    ev?.stopPropagation?.();

    const ed = getActiveTextEditable_();
    lastActiveTextEdit = ed || lastActiveTextEdit;

    // Відкриваємо поповер-палітру (1:1 як "Колір тексту")
    const willOpen = !!ui.strokePop?.hidden;
    openStrokePop_(willOpen);
  });
  ui.strokeClose?.addEventListener('click', () => { strokeCustomActiveIdx = -1; openStrokePop_(false);
    openShadowPop_(false); });
  ui.strokePop?.addEventListener('click', (ev) => ev.stopPropagation());

  // --- Shadow (тінь тексту) ---
  ui.shadowBtn?.addEventListener('click', (ev) => {
    ev?.stopPropagation?.();
    const ed = getActiveTextEditable_();
    lastActiveTextEdit = ed || lastActiveTextEdit;
    openShadowPop_(); // toggle
  });

  ui.shadowClose?.addEventListener('click', () => openShadowPop_(false));
  ui.shadowPop?.addEventListener('click', (ev) => ev.stopPropagation());

  ui.shadowColor?.addEventListener('input', () => {
    applyShadowFromUI_();
    scheduleToolbarSync_();
  });

  ui.shadowAlpha?.addEventListener('input', () => {
    const v = clamp(parseInt(ui.shadowAlpha?.value || '100', 10) || 100, 0, 100);
    if (ui.shadowAlphaVal) ui.shadowAlphaVal.textContent = `${v}%`;
    applyShadowFromUI_();
    scheduleToolbarSync_();
  });

  ui.shadowX?.addEventListener('input', () => {
    const v = clamp(parseInt(ui.shadowX?.value || '0', 10) || 0, -50, 50);
    if (ui.shadowXVal) ui.shadowXVal.textContent = String(v);
    applyShadowFromUI_();
  });

  ui.shadowY?.addEventListener('input', () => {
    const v = clamp(parseInt(ui.shadowY?.value || '0', 10) || 0, -50, 50);
    if (ui.shadowYVal) ui.shadowYVal.textContent = String(v);
    applyShadowFromUI_();
  });

  ui.shadowBlur?.addEventListener('input', () => {
    const v = clamp(parseInt(ui.shadowBlur?.value || '8', 10) || 8, 0, 60);
    if (ui.shadowBlurVal) ui.shadowBlurVal.textContent = String(v);
    applyShadowFromUI_();
  });

  ui.shadowSharp?.addEventListener('input', () => {
    const v = clamp(parseInt(ui.shadowSharp?.value || '0', 10) || 0, 0, 6);
    if (ui.shadowSharpVal) ui.shadowSharpVal.textContent = String(v);
    applyShadowFromUI_();
  });


  // 1:1 як у "Колір тексту": зміна <input type="color"> тільки застосовує стиль.
  // Збереження у "Мої" відбувається лише кліком по кружечку (як зверху).
  ui.strokeColor?.addEventListener('input', () => {
    // 1:1 як у "Колір тексту": зміна через picker просто застосовує колір,
    // а збереження у "Мої" робиться КЛІКОМ по кружечку.
    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    if (ed) lastActiveTextEdit = ed;
    applyStrokeColorFromUI_();
  });

  ui.strokeMinus?.addEventListener('click', () => bumpTextStrokeWidth_(-1));
  ui.strokePlus?.addEventListener('click', () => bumpTextStrokeWidth_(+1));



  ui.popClose?.addEventListener('click', () => openPop_(false));

  // 00925: pin the exact editable + native Range before an inspector control
  // takes browser focus. Buttons keep the canvas selection alive; continuous
  // controls use the pinned target for their whole gesture.
  sectionEl.addEventListener('pointerdown', (event) => {
    const control = event.target?.closest?.(
      '#st-text-color,#st-text-alpha,#st-text-size,#st-text-size-num,' +
      '#st-text-italic,#st-text-bold,.st-color-chip'
    );
    if (!control) return;
    if (control.matches('#st-text-color,#st-text-alpha,.st-color-chip')) {
      pinTextStyleGesture00925_('color');
    } else if (control.matches('#st-text-size,#st-text-size-num')) {
      pinTextStyleGesture00925_('size');
    } else {
      const ed = getActiveTextEditable_();
      const range = getNativeRangeInside_(ed);
      if (ed && range && !range.collapsed) {
        try {
          lastEditable_ = ed;
          lastRange_ = range.cloneRange();
          event.preventDefault();
        } catch {}
      }
    }
  }, true);

  // ВАЖЛИВО: інпут type="color" має застосовувати колір одразу при зміні
  ui.color?.addEventListener('input', () => {
    applyColorFromUI_(true);
  });
  ui.color?.addEventListener('change', () => applyColorFromUI_(false));

  ui.strokeAlpha?.addEventListener('input', () => {
    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    if (ed) lastActiveTextEdit = ed;
    const v = parseInt(String(ui.strokeAlpha?.value || '100'), 10);
    const pct = isNaN(v) ? 100 : Math.max(0, Math.min(100, v));
    if (ui.strokeAlphaVal) ui.strokeAlphaVal.textContent = pct + '%';
    applyStrokeColorFromUI_();
  });



  ui.headingBtn?.addEventListener('click', () => openHeadingPop_());
  ui.headingClose?.addEventListener('click', () => openHeadingPop_(false));

  ui.headingPop?.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('.st-heading-item');
    if (!btn) return;
    ev.preventDefault();

    const lvl = parseInt(btn.dataset.h || '0', 10) || 0;
    if (lvl < 0 || lvl > 6) return;

    applyHeading_(lvl);
    openHeadingPop_(false);
    syncToolbarFromSelection_(); // оновити лейбл
  });

  // закрити поповер кліком зовні
  document.addEventListener('click', (ev) => {
    const anyOpen = (!!ui.pop && !ui.pop.hidden) || (!!ui.headingPop && !ui.headingPop.hidden) || (!!ui.borderPop && !ui.borderPop.hidden) || (!!ui.strokePop && !ui.strokePop.hidden) || (!!ui.shadowPop && !ui.shadowPop.hidden);
    if (!anyOpen) return;
    const t = ev.target;
    const node = (t && t.nodeType === 1) ? t : null;
    if (!node) return;
    if (ui.pop?.contains(node) || ui.colorBtn?.contains(node)) return;
    if (ui.borderPop?.contains(node) || ui.borderBtn?.contains(node)) return;
    if (ui.strokePop?.contains(node) || ui.strokeBtn?.contains(node)) return;
    if (ui.shadowPop?.contains(node) || ui.shadowBtn?.contains(node)) return;
    if (ui.headingPop?.contains(node) || ui.headingBtn?.contains(node)) return;
    openPop_(false);
    openBorderPop_(false);
    openStrokePop_(false);
    openHeadingPop_(false);
  }, true);

  ui.alpha?.addEventListener('input', () => {
    if (ui.alphaVal) ui.alphaVal.textContent = String(ui.alpha.value) + '%';
    applyColorFromUI_(true);
  });
  ui.alpha?.addEventListener('change', () => applyColorFromUI_(false));

  // палетки
  function onChipClick_(ev) {
    const btn = ev.target?.closest?.('.st-color-chip');
    if (!btn) return;
    const mode = btn.dataset.mode || '';
    const idx = parseInt(btn.dataset.index || '0', 10) || 0;

    // --- Text color palette ---
    if (mode === 'std') {
      const c = STD_COLORS[idx] || '#ffffff';
      if (ui.color) ui.color.value = c;
      applyColorFromUI_();
      return;
    }

    if (mode === 'custom') {
      const cur = getCustomColors_();
      const slots = new Array(20).fill('');
      for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
      const v = slots[idx];
      if (v) {
        if (ui.color) ui.color.value = v;
        applyColorFromUI_();
      } else {
        const c = ui.color?.value || '#ffffff';
        slots[idx] = c;
        setCustomColors_(slots);
        rebuildPalettes_();
      }
      scheduleToolbarSync_();
      return;
    }

    // --- Stroke (text outline) palette ---
    if (mode === 'stroke-std') {
      const c = STD_COLORS[idx] || '#000000';
      if (ui.strokeColor) ui.strokeColor.value = c;
      applyStrokeColorFromUI_();
      return;
    }

    if (mode === 'stroke-custom') {
      const cur = getCustomColors_(LS_STROKE_CUSTOM_KEY);
      const slots = new Array(20).fill('');
      for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';

      const v = slots[idx];
      if (v) {
        if (ui.strokeColor) ui.strokeColor.value = v;
        applyStrokeColorFromUI_();
      } else {
        const c = ui.strokeColor?.value || '#000000';
        slots[idx] = c;
        setCustomColors_(slots, LS_STROKE_CUSTOM_KEY);
        rebuildStrokePalettes_();
      }


      scheduleToolbarSync_();
      return;
    }

    // --- Shadow (text shadow) palette ---
    if (mode === 'shadow-std') {
      const c = STD_COLORS[idx] || '#000000';
      if (ui.shadowColor) ui.shadowColor.value = c;
      applyShadowFromUI_();
      return;
    }

    if (mode === 'shadow-custom') {
      const cur = getCustomColors_(LS_SHADOW_CUSTOM_KEY);
      const slots = new Array(20).fill('');
      for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';

      const v = slots[idx];
      if (v) {
        if (ui.shadowColor) ui.shadowColor.value = v;
        applyShadowFromUI_();
      } else {
        const c = ui.shadowColor?.value || '#000000';
        slots[idx] = c;
        setCustomColors_(slots, LS_SHADOW_CUSTOM_KEY);
        rebuildShadowPalettes_();
      }

      scheduleToolbarSync_();
      return;
    }
  }
  ui.palette?.addEventListener('click', onChipClick_);
  ui.custom?.addEventListener('click', onChipClick_);

  // очистити кастомний слот правою кнопкою
  ui.custom?.addEventListener('contextmenu', (ev) => {
    const btn = ev.target?.closest?.('.st-color-chip');
    if (!btn) return;
    ev.preventDefault();
    const idx = parseInt(btn.dataset.index || '0', 10) || 0;
    const cur = getCustomColors_();
    const slots = new Array(20).fill('');
    for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
    slots[idx] = '';
    setCustomColors_(slots);
    rebuildPalettes_();
  });

  // Stroke palettes (обводка)
  ui.strokePalette?.addEventListener('click', onChipClick_);
  ui.strokeCustom?.addEventListener('click', onChipClick_);

  // очистити кастомний слот обводки правою кнопкою
  ui.strokeCustom?.addEventListener('contextmenu', (ev) => {
    const btn = ev.target?.closest?.('.st-color-chip');
    if (!btn) return;
    ev.preventDefault();
    const idx = parseInt(btn.dataset.index || '0', 10) || 0;
    const cur = getCustomColors_(LS_STROKE_CUSTOM_KEY);
    const slots = new Array(20).fill('');
    for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
    slots[idx] = '';
    setCustomColors_(slots, LS_STROKE_CUSTOM_KEY);
    rebuildStrokePalettes_();
    scheduleToolbarSync_();
  });

  // Shadow palettes (тінь)
  ui.shadowPalette?.addEventListener('click', onChipClick_);
  ui.shadowCustom?.addEventListener('click', onChipClick_);

  // очистити кастомний слот тіні правою кнопкою
  ui.shadowCustom?.addEventListener('contextmenu', (ev) => {
    const btn = ev.target?.closest?.('.st-color-chip');
    if (!btn) return;
    ev.preventDefault();
    const idx = parseInt(btn.dataset.index || '0', 10) || 0;
    const cur = getCustomColors_(LS_SHADOW_CUSTOM_KEY);
    const slots = new Array(20).fill('');
    for (let i = 0; i < Math.min(20, cur.length); i++) slots[i] = cur[i] || '';
    slots[idx] = '';
    setCustomColors_(slots, LS_SHADOW_CUSTOM_KEY);
    rebuildShadowPalettes_();
    scheduleToolbarSync_();
  });



  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function setSize_(v, preview = false) {
    const val = clamp(parseInt(v || '16', 10) || 16, 8, 96);
    if (ui.size) ui.size.value = String(val);
    if (ui.sizeNum) ui.sizeNum.value = String(val);
    // Menu mode: font-size for menu items / menu block
    if (applyMenuVar_('--st-menu-link-fs', val + 'px')) return;
    const style = { fontSize: val + 'px' };
    if (preview) applyInlineStyle_(style, { preview: true, gestureKey: 'size' });
    else finishInlineStyle00924_(style, 'size');
  }

  ui.size?.addEventListener('input', () => setSize_(ui.size.value, true));
  ui.size?.addEventListener('change', () => setSize_(ui.size.value, false));
  ui.sizeNum?.addEventListener('change', () => setSize_(ui.sizeNum.value, false));

  
ui.italic?.addEventListener('click', () => {
  // Menu mode: toggle font-style for menu items/menu block
  {
    const mt = getMenuTextTargets_();
    if (mt && mt.menu) {
      // Єдине джерело для меню — Рівень 1 поточного стану.
      // Не читаємо старий --st-menu-link-fst, бо він не знає про Normal/Hover/Open/Current.
      const currentFst = getMenuStateResolvedTextProp_(mt.menu, 'fst', activeTextState_);
      const isItalic = /italic|oblique/i.test(String(currentFst || '')) || (!(currentFst || '').trim() && (mt.items || []).some(el => {
        try { return /italic|oblique/i.test(String(getComputedStyle(el).fontStyle || '')); } catch { return false; }
      }));
      applyMenuVar_('--st-menu-link-fst', isItalic ? 'normal' : 'italic');
      scheduleToolbarSync_();
      return;
    }
  }
  const ed = getActiveTextEditable_();
  const r = getNativeRangeInside_(ed);
  if (!ed || !r) return;

  const node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
  const cs = node ? window.getComputedStyle(node) : null;
  const isItalic = cs ? (cs.fontStyle === 'italic') : false;

  applyInlineStyle_({ fontStyle: isItalic ? 'normal' : 'italic' });
});

ui.bold?.addEventListener('click', () => {
  // Menu mode: toggle font-weight for menu items/menu block
  {
    const mt = getMenuTextTargets_();
    if (mt && mt.menu) {
      const currentFw = getMenuStateResolvedTextProp_(mt.menu, 'fw', activeTextState_);
      const fwNum = parseInt(String(currentFw || ''), 10);
      const isBold = String(currentFw || '').toLowerCase() === 'bold' || (!Number.isNaN(fwNum) && fwNum >= 600) || (!(currentFw || '').trim() && (mt.items || []).some(el => {
        try {
          const fw = String(getComputedStyle(el).fontWeight || '').trim();
          const n = parseInt(fw, 10);
          return fw === 'bold' || (!Number.isNaN(n) && n >= 600);
        } catch { return false; }
      }));
      applyMenuVar_('--st-menu-link-fw', isBold ? '400' : '700');
      scheduleToolbarSync_();
      return;
    }
  }
  const ed = getActiveTextEditable_();
  const r = getNativeRangeInside_(ed);
  if (!ed || !r) return;

  const node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
  const cs = node ? window.getComputedStyle(node) : null;
  const fw = cs ? String(cs.fontWeight || '') : '';
  const num = parseInt(fw, 10);
  const isBold = (fw === 'bold') || (!Number.isNaN(num) && num >= 600);

  applyInlineStyle_({ fontWeight: isBold ? 'normal' : '700' });
});


  // --- Align (вирівнювання по блоку) ---
  function readAlignFromEditable_(ed) {
    if (!ed) return 'left';
    try {
      const cs = window.getComputedStyle(ed);
      const v = String(cs?.textAlign || '').toLowerCase();
      if (v === 'center' || v === 'right' || v === 'left') return v;
      // start/end -> left/right (найчастіше start = left)
      if (v === 'start') return 'left';
      if (v === 'end') return 'right';
    } catch {}
    // якщо style явно заданий
    try {
      const v2 = String(ed.style?.textAlign || '').toLowerCase();
      if (v2 === 'center' || v2 === 'right' || v2 === 'left') return v2;
    } catch {}
    return 'left';
  }

  function syncAlignButtons_() {
    const ed = getActiveTextEditable_();
    const align = readAlignFromEditable_(ed);

    const setBtn = (btn, on) => {
      if (!btn) return;
      btn.classList.toggle('is-active', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    };



    setBtn(ui.alignLeft, align === 'left');
    setBtn(ui.alignCenter, align === 'center');
    setBtn(ui.alignRight, align === 'right');
  }

  function applyAlign_(mode /* 'left'|'center'|'right' */) {
    const ed = getActiveTextEditable_();
    if (!ed) return;
    try { ed.style.textAlign = mode; } catch {}

    // історія
    if (window.ST_HISTORY && typeof window.ST_HISTORY.capture === 'function') {
      window.ST_HISTORY.capture('text-align');
    }

    syncAlignButtons_();
  syncVAlignButtons_();
  }

  ui.alignLeft?.addEventListener('click', () => applyAlign_('left'));
  ui.alignCenter?.addEventListener('click', () => applyAlign_('center'));
  ui.alignRight?.addEventListener('click', () => applyAlign_('right'));


  function applyVAlign_(mode /* 'top'|'center'|'bottom' */) {
    const ed = getActiveTextEditable_();
    if (!ed) return;

    // Вертикальне вирівнювання робимо через flex по осі Y
    // (працює стабільно для одного блока, без rich-text логіки)
    try {
      ed.style.display = 'flex';
      ed.style.flexDirection = 'column';
      ed.style.justifyContent = (mode === 'top') ? 'flex-start' : (mode === 'center') ? 'center' : 'flex-end';
    } catch {}

    if (window.ST_HISTORY && typeof window.ST_HISTORY.capture === 'function') {
      window.ST_HISTORY.capture('text-vertical-align');
    }

    syncVAlignButtons_();
  }

  function syncVAlignButtons_() {
    const ed = getActiveTextEditable_();
    const jc = ed ? (getComputedStyle(ed).justifyContent || '') : '';

    const mode =
      (jc === 'center') ? 'center' :
      (jc === 'flex-start' || jc === 'start') ? 'top' :
      'bottom';

    const setPressed = (btn, on) => {
      if (!btn) return;
      btn.classList.toggle('is-active', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    };



    setPressed(ui.vAlignTop, mode === 'top');
    setPressed(ui.vAlignCenter, mode === 'center');
    setPressed(ui.vAlignBottom, mode === 'bottom');
  }

  ui.vAlignTop?.addEventListener('click', () => applyVAlign_('top'));
  ui.vAlignCenter?.addEventListener('click', () => applyVAlign_('center'));
  ui.vAlignBottom?.addEventListener('click', () => applyVAlign_('bottom'));


  // init
  if (ui.alphaVal && ui.alpha) ui.alphaVal.textContent = String(ui.alpha.value) + '%';
  updateSwatch_();
  syncAlignButtons_();
  syncVAlignButtons_();
  syncTextStateToolbar_();
  syncTextFlowButtons_();

  // --- Selection memory (щоб не губити виділення при кліках по контролах) ---
  // Зберігаємо останній валідний Range всередині активного editable, щоб
  // застосовувати форматування навіть якщо фокус перейшов на інпут/слайдер.
  let lastRange_ = null;
  let lastEditable_ = null;

  
  let toolbarSyncT_ = null;

  function scheduleToolbarSync_() {
    if (toolbarSyncT_) clearTimeout(toolbarSyncT_);
    toolbarSyncT_ = setTimeout(() => {
      syncToolbarFromSelection_();
      updateTextHistoryButtons00900_();
    }, 0);
  }

  function parseCssColorToRgba_(css) {
    // css: "rgb(r,g,b)" or "rgba(r,g,b,a)"
    const m = String(css || '').match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(',').map(s => s.trim());
    const r = parseFloat(parts[0] || '0');
    const g = parseFloat(parts[1] || '0');
    const b = parseFloat(parts[2] || '0');
    const a = parts.length >= 4 ? parseFloat(parts[3]) : 1;
    return { r: Math.max(0, Math.min(255, r)),
             g: Math.max(0, Math.min(255, g)),
             b: Math.max(0, Math.min(255, b)),
             a: Math.max(0, Math.min(1, isNaN(a) ? 1 : a)) };
  }

  function rgbToHex_(n) {
    const v = Math.max(0, Math.min(255, Math.round(Number(n) || 0)));
    return v.toString(16).padStart(2, '0');
  }

  function rgbaToHexAlpha_(rgba) {
    if (!rgba) return { hex: '#000000', alpha: 100, rgba: 'rgba(0,0,0,1)' };
    const hex = '#' + rgbToHex_(rgba.r) + rgbToHex_(rgba.g) + rgbToHex_(rgba.b);
    const alpha = Math.round((rgba.a ?? 1) * 100);
    const css = `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${Math.max(0, Math.min(1, (rgba.a ?? 1)))})`;
    return { hex, alpha, rgba: css };
  }

  function isBoldWeight_(fw) {
    const s = String(fw || '').trim();
    const n = parseInt(s, 10);
    if (!isNaN(n)) return n >= 600;
    return /bold/i.test(s);
  }

  function collectSelectionStyles_(ed, range) {
    const sets = {
      color: new Set(),
      size: new Set(),
      italic: new Set(),
      bold: new Set(),
      heading: new Set(),
    };



    const addFromEl = (el) => {
      if (!el) return;
      const cs = window.getComputedStyle?.(el);
      if (!cs) return;
      const rgba = parseCssColorToRgba_(cs.color);
      const c = rgbaToHexAlpha_(rgba);
      sets.color.add(c.hex + '@' + String(c.alpha));
      const fs = parseFloat(cs.fontSize || '0');
      if (fs) sets.size.add(String(Math.round(fs)));
      sets.italic.add((cs.fontStyle === 'italic' || cs.fontStyle === 'oblique') ? '1' : '0');
      sets.bold.add(isBoldWeight_(cs.fontWeight) ? '1' : '0');
      // heading level (h1..h6) if inside heading, else 0
      let h = '0';
      try {
        let cur = el;
        while (cur && cur !== ed) {
          const tn = String(cur.tagName || '').toLowerCase();
          if (tn && /^h[1-6]$/.test(tn)) { h = tn.slice(1); break; }
          cur = cur.parentElement;
        }
      } catch {}
      sets.heading.add(h);
    };



    if (!range) {
      // caret / no selection -> use computed style from editable itself
      addFromEl(ed);
      return sets;
    }

    // Gather text nodes intersecting the range
    let count = 0;
    try {
      const root = ed;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node || !node.nodeValue) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (typeof range.intersectsNode === 'function') {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let node;
      while ((node = walker.nextNode())) {
        if (typeof range.intersectsNode === 'function' && !range.intersectsNode(node)) continue;
        const el = node.parentElement;
        addFromEl(el);
        count++;
        if (count > 500) break; // safety
      }
    } catch {
      // ignore
    }

    if (count === 0) {
      const a = range.commonAncestorContainer;
      const el = a?.nodeType === 1 ? a : a?.parentElement;
      addFromEl(el || ed);
    }
    return sets;
  }

  function pickIfSingle_(set) {
    if (!set || set.size !== 1) return null;
    for (const v of set) return v;
    return null;
  }

  function syncToolbarFromSelection_() {
    if (syncMenuToolbarFromLevel1State_()) { syncTextFlowButtons_(); return; }
    syncTextStateToolbar_();
    syncTextFlowButtons_();

    const ed = getActiveTextEditable_();
    if (!ed) return;

    const s = window.getSelection?.();
    let range = null;
    if (s && s.rangeCount > 0) {
      const r = s.getRangeAt(0);
      const a = r.commonAncestorContainer;
      const node = a?.nodeType === 1 ? a : a?.parentElement;
      if (node && ed.contains(node)) {
        range = r.cloneRange();
      }
    }
    // If selection lost (focus in inspector), try remembered range
    if (!range) range = getRememberedRangeInside_(ed);

    const sets = collectSelectionStyles_(ed, range);


    // Heading dropdown (only if uniform)
    const headingV = pickIfSingle_(sets.heading);
    if (ui.headingLabel && ui.headingBtn) {
      if (headingV && headingV !== '0') {
        ui.headingLabel.textContent = 'Заголовок ' + headingV;
        ui.headingBtn.classList.add('is-active');
      } else if (headingV === '0') {
        ui.headingLabel.textContent = 'Звичайний текст';
        ui.headingBtn.classList.remove('is-active');
      } else {
        ui.headingLabel.textContent = '—';
        ui.headingBtn.classList.remove('is-active');
      }
    }

    // Italic/Bold highlight only if uniform
    const italicV = pickIfSingle_(sets.italic);
    const boldV = pickIfSingle_(sets.bold);
    ui.italic?.classList.toggle('is-active', italicV === '1');
    ui.bold?.classList.toggle('is-active', boldV === '1');

    // Font size slider/number only if uniform
    const sizeV = pickIfSingle_(sets.size);
    if (sizeV) {
      const n = parseInt(sizeV, 10);
      if (!isNaN(n)) {
        if (ui.size) ui.size.value = String(n);
        if (ui.sizeNum) ui.sizeNum.value = String(n);
      }
    }

    // Color + alpha only if uniform
    const colorV = pickIfSingle_(sets.color);
    if (colorV) {
      const [hex, aStr] = String(colorV).split('@');
      const alpha = parseInt(aStr || '100', 10);
      if (ui.color) ui.color.value = hex || '#000000';
      if (ui.alpha) ui.alpha.value = String(isNaN(alpha) ? 100 : alpha);
      if (ui.alphaVal) ui.alphaVal.textContent = `${isNaN(alpha) ? 100 : alpha}%`;
      const rgb = hexToRgb_(hex || '#000000');
      applySwatch_(rgb, (isNaN(alpha) ? 100 : alpha) / 100);

      // Ensure custom slot contains current color if it's not in standard/custom
      const stdHas = STD_COLORS.includes((hex || '').toLowerCase());
      const curCustom = getCustomColors_().map(x => String(x || '').toLowerCase());
      const hx = String(hex || '').toLowerCase();
      if (!stdHas && hx && !curCustom.includes(hx)) {
        // Add to first free slot
        const next = curCustom.slice(0, 20);
        while (next.length < 20) next.push('');
        const free = next.findIndex(v => !v);
        if (free !== -1) {
          next[free] = hx;
          setCustomColors_(next.filter(Boolean));
          rebuildPalettes_();
        }
      }

      markPickedColor_(hex || '#000000');
    } else {
      // mixed -> remove picked highlight
      markPickedColor_(null);
      try { if (ui.swatch) ui.swatch.style.background = 'transparent'; } catch {}
    }


    // Border swatch (по блоку)
    try {
      const bw = getTextBorderWidth_(ed) || 0;
      const bc = getTextBorderColor_(ed) || '';
      paintBorderSwatch_(bw > 0 ? bc : '');
    } catch {}

    // Stroke swatch (по тексту)
    try {
      const sw = getTextStrokeWidth_(ed) || 0;
      const sc = getTextStrokeColor_(ed) || '';
      paintStrokeSwatch_(sw > 0 ? sc : '');
    } catch {}

    
    // Shadow swatch (по тексту)
    try {
      const meta = ed?.dataset?.stTextShadow ? safeJsonParse_(ed.dataset.stTextShadow) : null;
      const c = meta?.c || '';
      const a = typeof meta?.a === 'number' ? meta.a : 0;
      if (ui.shadowSwatch) {
        ui.shadowSwatch.style.background = c ? rgbaFromHexAlpha_(c, Math.max(0, Math.min(1, a / 100))) : 'transparent';
      }
    } catch {}
// Align buttons (по блоку)
    syncAlignButtons_();
    syncTextFlowButtons_();
  }

  function markPickedColor_(hex) {
    // Highlight picked chip in std/custom palettes
    const want = hex ? String(hex).toLowerCase() : '';
    const chips = sectionEl.querySelectorAll('.st-color-chip');
    chips.forEach((b) => {
      const bg = (b.style.background || '').toLowerCase();
      const on = want && bg === want;
      b.classList.toggle('is-picked', !!on);
    });
  }
function captureSelection_() {
    const ed = getActiveTextEditable_();
    if (!ed) return;

    const s = window.getSelection?.();
    if (!s || s.rangeCount === 0) return;
    const r = s.getRangeAt(0);
    if (!r) return;

    const a = r.commonAncestorContainer;
    const node = a.nodeType === 1 ? a : a.parentElement;
    if (!node || !ed.contains(node)) return;

    try {
      lastRange_ = r.cloneRange();
      lastEditable_ = ed;
    } catch {}
  }

  // Фіксуємо виділення при зміні selection та при взаємодії з editable
  document.addEventListener('selectionchange', captureSelection_);
  document.addEventListener('pointerup', captureSelection_, true);
  document.addEventListener('keyup', captureSelection_, true);
  document.addEventListener('st:selection-changed', scheduleToolbarSync_, true);
  window.addEventListener('st:selection:changed', scheduleToolbarSync_);
  installTextLocalHistory00900_();

  function getRememberedRangeInside_(ed) {
    if (!ed || !lastRange_ || lastEditable_ !== ed) return null;
    try {
      const a = lastRange_.commonAncestorContainer;
      const node = a.nodeType === 1 ? a : a.parentElement;
      if (!node || !ed.contains(node)) return null;
      if (lastRange_.collapsed) return null;
      return lastRange_.cloneRange();
    } catch {
      return null;
    }
  }
}
