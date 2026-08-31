// js/design/widgets/border-widget/border-widget.js
// 00917: вибір сторін є лише областю наступної дії; сам клік нічого не переписує.
// Віджет "Бордер" для панелі "Дизайн"
// Під-акордеони (Рамка / Радіуси / Тіні / Підсвічування)
// + робота з глобальним режимом вибору (Нічого / Секції / Рівні / Контейнери / Блоки)

import { initBorderLinesWidget } from './lines/lines-widget.js';
import { initBorderRadiusWidget } from './radius/radius-widget.js';
import { initBorderShadowsWidget } from './shadows/shadows-widget.js';
import { initBorderColorWidget } from './color/color-widget.js';
import { initBorderStyleWidget } from './border-style/style-widget.js';
import { BASE_STYLES, DECOR_STYLES, USER_IMAGE_STYLES } from './border-style/presets.js';




// ключ для стану під-акордеонів
const BORDER_SUBSECTIONS_STATE_KEY = 'st_design_border_subsections_v1';

// debug-прапорець для виділення / логів
const BORDER_DEBUG_SELECTION = false; // [00439] вимкнено важкі console.log DOM-елементів у проді

function bwLog() {
  if (!BORDER_DEBUG_SELECTION) return;
  const args = Array.prototype.slice.call(arguments);
  args.unshift('[border-select]');
  console.log.apply(console, args);
}

// ---- збереження стану під-акордеонів ("Рамка", "Радіуси" тощо) ----
function loadBorderSubsectionsState() {
  try {
    const raw = window.localStorage.getItem(BORDER_SUBSECTIONS_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('[border-widget] Failed to load subsections state', err);
    return {};
  }
}

function saveBorderSubsectionsState(state) {
  try {
    window.localStorage.setItem(
      BORDER_SUBSECTIONS_STATE_KEY,
      JSON.stringify(state || {})
    );
  } catch (err) {
    console.warn('[border-widget] Failed to save subsections state', err);
  }
}

// ---- основна ініціалізація віджета ----
export function initBorderWidget(host, getSelection) {
  if (!host) return;

  // Режим цілей: 'none' або multi-set: sections / levels / containers / blocks
  let targetMode = 'none';
  let targetModes = new Set();

  // 00263: persistence for the top selection-mode buttons.
  // When any of Sections/Levels/Containers/Blocks is enabled, the global
  // highlight must survive regular canvas clicks, outside clicks, DOM refreshes,
  // resize pointerup, etc. It can be removed only by toggling those buttons off.
  let designSelectionReapplyTimer = 0;
  let designSelectionApplying = false;
  let designSelectionLastReason = '';

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  // ---- СТАН РАМКИ (ПІДВІДЖЕТ "Рамка") ----
 let borderLinesState = {
    mode: 'none',   // 'none' | 'on'
    preset: 'none', // 'none' | 'thin' | 'medium' | 'thick' | 'custom'
    sides: { top: true, right: true, bottom: true, left: true }
  };

  // Стан радіусів для поточного вибору
  let borderRadiusState = {
    radius: 18,
    corners: {
      tl: true,
      tr: true,
      br: true,
      bl: true
    },
    preset: 'custom'
  };

  let borderLinesController = null;
  let borderRadiusController = null;

  let activeRadiusEditSessionTargets00911_ = [];
  let activeRadiusEditSessionStartedAt00911_ = 0;

  let activeBorderColorEditSessionTargets00911_ = [];
  let activeBorderColorEditSessionStartedAt00911_ = 0;
  let pendingBorderColorLiveDetail00911_ = null;
  let borderColorLiveRaf00911_ = 0;

  let borderStyleState = {
      style: 'solid'
    };

  let borderStyleController = null;
  let activeBorderEditSessionTargets00915_ = [];










  // ---- допоміжне: колір бордера за замовчуванням (як у блоків) ----
  function getSiteDefaultBorderColor() {
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) return '';
    const cs = getComputedStyle(siteRoot);
    const val = cs.getPropertyValue('--site-block-brd').trim();
    return val || '';
  }

  function ensureDefaultBorderColor(el) {
    if (!(el instanceof HTMLElement)) return;
    const clr = getSiteDefaultBorderColor();
    if (clr) {
      el.style.borderColor = clr;
    }
  }

  // Допоміжний логгер стану бордера елемента
  function dbgBorderState(label, el, idx) {
    if (!(el instanceof HTMLElement)) return;

    const cs = getComputedStyle(el);
    const cls = Array.from(el.classList).join('.');

    bwLog(
      `[border-debug] ${label} [${idx}] ${el.tagName}.${cls}`,
      {
        borderTop:    `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
        borderRight:  `${cs.borderRightWidth} ${cs.borderRightStyle} ${cs.borderRightColor}`,
        borderBottom: `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`,
        borderLeft:   `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`,
        outline:      `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
        boxShadow:    cs.boxShadow
      }
    );
  }

  // Тимчасове вимкнення hover-підсвітки, щоб було видно реальний колір рамки / лінії
  let hoverOutlineTimer = null;

  function temporarilyDisableHoverOutlines() {
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) return;

    siteRoot.classList.add('st-no-hover-outline');

    if (hoverOutlineTimer) {
      clearTimeout(hoverOutlineTimer);
    }

    hoverOutlineTimer = window.setTimeout(() => {
      siteRoot.classList.remove('st-no-hover-outline');
      hoverOutlineTimer = null;
    }, 1200); // ~1.2 секунди; можна підкрутити
  }







  // --- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ КОЛЬОРУ БОРДЕРА ---

  function hexToRgb(hex) {
    let v = (hex || '').trim();
    if (!v) return { r: 0, g: 0, b: 0 };
    if (v[0] === '#') v = v.slice(1);
    if (v.length === 3) {
      v = v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
    }
    if (v.length !== 6) return { r: 0, g: 0, b: 0 };
    const r = parseInt(v.slice(0, 2), 16) || 0;
    const g = parseInt(v.slice(2, 4), 16) || 0;
    const b = parseInt(v.slice(4, 6), 16) || 0;
    return { r, g, b };
  }

  function rgbToRgbaStr(rgb, alpha) {
    const a = Math.max(0, Math.min(1, alpha || 1));
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
  }

  function mixToGray(rgb, desat) {
    // desat: 0..1
    const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
    const k = Math.max(0, Math.min(1, desat || 0));
    return {
      r: Math.round(rgb.r * (1 - k) + gray * k),
      g: Math.round(rgb.g * (1 - k) + gray * k),
      b: Math.round(rgb.b * (1 - k) + gray * k)
    };
  }

  function colorToRgbaWithControls(hex, opacityPct, desatPct) {
    const rgbBase = hexToRgb(hex);
    const desat = (desatPct || 0) / 100;
    const rgb = mixToGray(rgbBase, desat);
    const alpha = (opacityPct || 100) / 100;
    return rgbToRgbaStr(rgb, alpha);
  }

  function buildBorderGradientCss(c1, c2, split, blend) {
    // c1, c2 — вже rgba()
    let p = Number(split);
    if (Number.isNaN(p)) p = 50;
    p = Math.max(0, Math.min(100, Math.round(p)));

    let b = Number(blend);
    if (Number.isNaN(b)) b = 0;
    b = Math.max(0, Math.min(50, Math.round(b)));

    if (b === 0) {
      return `linear-gradient(90deg, ${c1} 0%, ${c1} ${p}%, ${c2} ${p}%, ${c2} 100%)`;
    }

    const startMix = Math.max(0, p - b);
    const endMix   = Math.min(100, p + b);

    return `linear-gradient(
      90deg,
      ${c1} 0%,
      ${c1} ${startMix}%,
      ${c2} ${endMix}%,
      ${c2} 100%
    )`;
  }





  // --- ЗАСТОСУВАННЯ РАМКИ ДО ТАРГЕТІВ ---
   // --- ЗАСТОСУВАННЯ РАМКИ ДО ТАРГЕТІВ ---
    // --- ЗАСТОСУВАННЯ РАМКИ ДО ТАРГЕТІВ ---
   // --- ЗАСТОСУВАННЯ РАМКИ ДО ТАРГЕТІВ ---
    // --- ЗАСТОСУВАННЯ РАМКИ ДО ТАРГЕТІВ ---
  function cleanBorderTargets00915_(targets) {
    return (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
  }

  function normalizeBorderSides00916_(value) {
    if (value && typeof value === 'object') {
      return {
        top: value.top === true,
        right: value.right === true,
        bottom: value.bottom === true,
        left: value.left === true,
      };
    }
    const legacy = String(value || 'all');
    return {
      top: legacy === 'all' || legacy === 'top' || legacy === 'tb',
      right: legacy === 'all' || legacy === 'right' || legacy === 'lr',
      bottom: legacy === 'all' || legacy === 'bottom' || legacy === 'tb',
      left: legacy === 'all' || legacy === 'left' || legacy === 'lr',
    };
  }

  function borderTargetsForEdit00915_(live = false) {
    const held = cleanBorderTargets00915_(activeBorderEditSessionTargets00915_);
    if (held.length) return held;
    const targets = cleanBorderTargets00915_(getBorderTargets());
    if (live) activeBorderEditSessionTargets00915_ = targets;
    return targets;
  }

  function notifyBorderControlsApplied00915_(targets, options = {}) {
    const cleanTargets = cleanBorderTargets00915_(targets);
    if (!cleanTargets.length) return;
    const live = options.live === true;
    const detail = {
      reason: options.reason || (live ? 'border-controls-live-00915' : 'border-controls-applied-00915'),
      targets: cleanTargets,
      target: cleanTargets[0] || null,
      targetCount: cleanTargets.length,
      live,
      borderState: {
        lines: { ...(borderLinesState || {}) },
        style: { ...(borderStyleState || {}) },
      },
    };
    const hasMainTargets = cleanTargets.some(el => el.closest?.('#st-site-main-slot'));
    try { window.__ST_DESIGN_LIVE_STYLE_UNTIL_00774__ = Date.now() + (live ? 520 : 120); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent(live ? 'st:border-controls-widget:live-applied' : 'st:border-controls-widget:applied', { detail })); } catch (_) {}
    if (!hasMainTargets && !live) {
      try { document.dispatchEvent(new CustomEvent('st:border-controls-widget:applied', { detail })); } catch (_) {}
      try { window.ST_HISTORY?.capture?.(`border-controls-${detail.reason}`); } catch (_) {}
      try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: `border-controls-widget:${detail.reason}`, draft: false, forceContent: false, preserveLiveMain: true }); } catch (_) {}
    }
    if (!live) activeBorderEditSessionTargets00915_ = [];
  }

  function applyBorderLinesToTargets(options = {}) {
    const live = options.live === true;
    const targets = Array.isArray(options.targets) ? options.targets : borderTargetsForEdit00915_(live);

    bwLog(
      '[border-widget] applyBorderLinesToTargets:',
      'mode =', borderLinesState.mode,
      'preset =', borderLinesState.preset,
      'sides =', borderLinesState.sides,
      'targets =', targets.length
    );

    if (!targets.length) {
      bwLog('[border-widget] applyBorderLinesToTargets: немає вибраних елементів');
      return;
    }

    const { mode, preset } = borderLinesState;
    const sides = normalizeBorderSides00916_(borderLinesState.sides);

const widthMap = {
  none:   0,
  thin:   1, // тонка
  medium: 3, // середня
  thick:  5, // товста
  mixed:  3, // запасний варіант, якщо раптом десь пролізе
  custom: 3  // “власна” базово як середня
};

    // ----------------------------
    // РЕЖИМ "НЕМАЄ РАМКИ"
    // ----------------------------
    if (mode === 'none') {
      targets.forEach((el, idx) => {
        dbgBorderState('BEFORE mode=none', el, idx);

        // 00326: whole menu block is a normal block target.
        // Menu button borders are controlled only by the Menu widget level styles.
        if (el instanceof HTMLElement && el.matches('[data-st-menu-item="1"]')) {
          el.style.setProperty('--st-menu-item-bw', '0px');
          el.style.setProperty('--st-menu-item-bwt', '0px');
          el.style.setProperty('--st-menu-item-bwr', '0px');
          el.style.setProperty('--st-menu-item-bwb', '0px');
          el.style.setProperty('--st-menu-item-bwl', '0px');

          // Keep style/color untouched; widths=0 hides the selected menu item border.
          dbgBorderState('AFTER  mode=none (menu item)', el, idx);
          bwLog('[border-widget] [mode=none/menu-item] target off →', idx, el);
          return;
        }

        // ❗ тільки ставимо прапорець "рамка вимкнена"
        //    НІЯКИХ border-width = 0px тут не робимо
        el.classList.add('st-border-off');

        dbgBorderState('AFTER  mode=none', el, idx);
        bwLog('[border-widget] [mode=none] target off →', idx, el);
      });

      bwLog('[border-widget] mode=none: вимкнули рамку для', targets.length, 'елементів');
      notifyBorderControlsApplied00915_(targets, { live, reason: options.reason || 'border-lines-none-00915' });
      return;
    }

    // ----------------------------
    // РЕЖИМ "Є РАМКА"
    // ----------------------------
    const px = widthMap[preset] != null ? widthMap[preset] : 1;
    const pxStr = px + 'px';

    bwLog(
      '[border-widget] mode=on:',
      'preset =', preset,
      'px =', px,
      'sides =', sides,
      'targets =', targets.length
    );




    //---------------------------------------------------------
      targets.forEach((el, idx) => {
      dbgBorderState('BEFORE mode=' + borderLinesState.mode, el, idx);

      // при увімкненні бордера завжди знімаємо прапорець
      el.classList.remove('st-border-off');

      // 🔹 Спец-логіка для СЕКЦІЙ:
      // "тонка" рамка = базова картка (box-shadow), без додаткового border 1px
      let pxForEl = px;
      if (el.classList.contains('st-section') && preset === 'thin') {
        pxForEl = 0;
      }

      const zero = pxForEl === 0;
      const pxStrLocal = pxForEl + 'px';

      // 00917: змінюємо тільки вибрані сторони. Невибрані зберігають
      // власну товщину, стиль і колір без будь-якого скидання.
      const cs = getComputedStyle(el);
      const firstSelectedStyle =
        (sides.top && cs.borderTopStyle !== 'none' && cs.borderTopStyle) ||
        (sides.right && cs.borderRightStyle !== 'none' && cs.borderRightStyle) ||
        (sides.bottom && cs.borderBottomStyle !== 'none' && cs.borderBottomStyle) ||
        (sides.left && cs.borderLeftStyle !== 'none' && cs.borderLeftStyle) ||
        'solid';

      const setSide = (side, active) => {
        if (!active) return;
        const widthProp = 'border' + side + 'Width';
        const styleProp = 'border' + side + 'Style';

        if (zero) {
          // повертаємось до значення з CSS ('' означає "як у стилях")
          el.style[widthProp] = '';
        } else {
          el.style[widthProp] = pxStrLocal;
          if (cs[styleProp] === 'none') {
            el.style[styleProp] = firstSelectedStyle;
            ensureDefaultBorderColor(el);
          }
        }
      };










      // MENU: set per-side widths as CSS vars.
      if (el instanceof HTMLElement && el.matches('[data-st-menu-item="1"]')) {
        const setV = (k, on) => el.style.setProperty(k, on ? pxStrLocal : '0px');
        // also keep overall bw for UI consistency
        el.style.setProperty('--st-menu-item-bw', pxStrLocal);
        if (sides.top) setV('--st-menu-item-bwt', true);
        if (sides.bottom) setV('--st-menu-item-bwb', true);
        if (sides.left) setV('--st-menu-item-bwl', true);
        if (sides.right) setV('--st-menu-item-bwr', true);
        bwLog(`[border-widget] [mode=on/sides/menu] target[${idx}] widths=`, sides);
        dbgBorderState('AFTER  mode=' + borderLinesState.mode + ' (menu)', el, idx);
        return;
      }

      setSide('Top', sides.top);
      setSide('Bottom', sides.bottom);
      setSide('Left', sides.left);
      setSide('Right', sides.right);

      const csAfter = getComputedStyle(el);
      bwLog(
        `[border-widget] [mode=on/sides] target[${idx}] widths:`,
        csAfter.borderTopWidth,
        csAfter.borderRightWidth,
        csAfter.borderBottomWidth,
        csAfter.borderLeftWidth
      );

      dbgBorderState('AFTER  mode=' + borderLinesState.mode, el, idx);
    });
    notifyBorderControlsApplied00915_(targets, { live, reason: options.reason || 'border-lines-apply-00915' });
  }


  function readCornerRadii00911_(el) {
    const zero = '0px';
    if (!(el instanceof HTMLElement)) return { tl: zero, tr: zero, br: zero, bl: zero };
    try {
      const cs = getComputedStyle(el);
      return {
        tl: String(cs.borderTopLeftRadius || zero).trim() || zero,
        tr: String(cs.borderTopRightRadius || zero).trim() || zero,
        br: String(cs.borderBottomRightRadius || zero).trim() || zero,
        bl: String(cs.borderBottomLeftRadius || zero).trim() || zero,
      };
    } catch (_) {
      return {
        tl: String(el.style.borderTopLeftRadius || zero).trim() || zero,
        tr: String(el.style.borderTopRightRadius || zero).trim() || zero,
        br: String(el.style.borderBottomRightRadius || zero).trim() || zero,
        bl: String(el.style.borderBottomLeftRadius || zero).trim() || zero,
      };
    }
  }

  function syncSelectionAuthoredRadius00911_(el, radii) {
    if (!(el instanceof HTMLElement)) return;
    const current = radii || readCornerRadii00911_(el);
    const shorthand = `${current.tl || '0px'} ${current.tr || '0px'} ${current.br || '0px'} ${current.bl || '0px'}`;
    // Main/Header/Footer selection layer keeps the selected element's radius via
    // --sf-selection-authored-radius with !important. Without updating this var,
    // the real inline radius changes but the active block visually looks unchanged.
    el.style.setProperty('--sf-selection-authored-radius', shorthand);
  }

  function applyBorderRadiusToTargets(options = {}) {
    const targets = options && Array.isArray(options.targets) ? options.targets : getBorderTargets();

    bwLog(
      '[border-widget] applyBorderRadiusToTargets:',
      'radius =', borderRadiusState.radius,
      'corners =', borderRadiusState.corners,
      'targets =', targets.length
    );

    if (!targets.length) {
      bwLog('[border-widget] applyBorderRadiusToTargets: немає вибраних елементів');
      return;
    }

    const radius = Math.max(
      0,
      Math.min(999, Math.round(borderRadiusState.radius || 0))
    );
    const pxStr = radius + 'px';
    const corners = borderRadiusState.corners || {};

    // за замовчуванням true, якщо явно не false
    const tl = corners.tl !== false;
    const tr = corners.tr !== false;
    const br = corners.br !== false;
    const bl = corners.bl !== false;

    targets.forEach((el, idx) => {
      if (!(el instanceof HTMLElement)) return;

      // MENU: store radius in CSS vars so per-item overrides always win.
      if (el.matches('[data-st-menu-item="1"]')) {
        if (tl) el.style.setProperty('--st-menu-item-rtl', pxStr);
        if (tr) el.style.setProperty('--st-menu-item-rtr', pxStr);
        if (br) el.style.setProperty('--st-menu-item-rbr', pxStr);
        if (bl) el.style.setProperty('--st-menu-item-rbl', pxStr);

        bwLog('[border-widget] [radius/menu] target[' + idx + '] →', { tl: tl ? pxStr : '(skip)', tr: tr ? pxStr : '(skip)', br: br ? pxStr : '(skip)', bl: bl ? pxStr : '(skip)' });
        return;
      }

      const visualRadii00911 = readCornerRadii00911_(el);
      if (tl) { el.style.borderTopLeftRadius = pxStr; visualRadii00911.tl = pxStr; }
      if (tr) { el.style.borderTopRightRadius = pxStr; visualRadii00911.tr = pxStr; }
      if (br) { el.style.borderBottomRightRadius = pxStr; visualRadii00911.br = pxStr; }
      if (bl) { el.style.borderBottomLeftRadius = pxStr; visualRadii00911.bl = pxStr; }
      syncSelectionAuthoredRadius00911_(el, visualRadii00911);

      bwLog(
        '[border-widget] [radius] target[' + idx + '] →',
        {
          tl: tl ? pxStr : '(skip)',
          tr: tr ? pxStr : '(skip)',
          br: br ? pxStr : '(skip)',
          bl: bl ? pxStr : '(skip)'
        }
      );
    });

    notifyBorderRadiusApplied00911_(targets, {
      live: options?.live === true,
      reason: options?.reason || (options?.live ? 'radius-live' : 'radius-apply'),
    });
  }

  function notifyBorderRadiusApplied00911_(targets, options = {}) {
    const cleanTargets = (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
    if (!cleanTargets.length) return;
    const live = options?.live === true;
    const detail = {
      reason: options?.reason || (live ? 'radius-live' : 'radius-applied'),
      targetCount: cleanTargets.length,
      targets: cleanTargets,
      target: cleanTargets[0] || null,
      live,
      radiusState: {
        radius: borderRadiusState.radius,
        corners: { ...(borderRadiusState.corners || {}) },
        preset: borderRadiusState.preset || 'custom',
      },
    };
    const hasMainTargets = cleanTargets.some(el => el instanceof HTMLElement && el.closest?.('#st-site-main-slot'));
    try { window.__ST_DESIGN_LIVE_STYLE_UNTIL_00774__ = Date.now() + (live ? 520 : 120); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent(live ? 'st:border-radius-widget:live-applied' : 'st:border-radius-widget:applied', { detail })); } catch (_) {}
    // Header/Footer зберігають старий шлях; для Main достатньо window-події,
    // щоб не дублювати commit через window+document.
    if (!hasMainTargets) {
      try { document.dispatchEvent(new CustomEvent(live ? 'st:border-radius-widget:live-applied' : 'st:border-radius-widget:applied', { detail })); } catch (_) {}
      if (!live) {
        try { window.ST_HISTORY?.capture?.(`border-radius-${detail.reason}`); } catch (_) {}
        try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: `border-radius-widget:${detail.reason}`, draft: false, forceContent: false, preserveLiveMain: true }); } catch (_) {}
      }
    }
  }

  function applyBorderStyleToTargets(options = {}) {
  const targets = Array.isArray(options.targets) ? options.targets : borderTargetsForEdit00915_(false);
  if (!targets.length) {
    bwLog('[border-widget] applyBorderStyleToTargets: немає таргетів');
    return;
  }

  const style = borderStyleState.style;
  const sides = normalizeBorderSides00916_(borderLinesState.sides);

  targets.forEach(el => {
    if (!(el instanceof HTMLElement)) return;

    // MENU: map border style -> CSS var so per-item overrides can win over global.
    if (el.matches('[data-st-menu-item="1"]')) {
      const base = BASE_STYLES.find(x => x.id === style);
      el.style.setProperty('--st-menu-item-bs', base ? style : 'solid');
      return;
    }

    // Спочатку очищаємо всі декоративні класи + користувацький border-image
    el.classList.remove(
      'st-border-wavy',
      'st-border-dashdot',
      'st-border-big-dots',
      'st-border-star-line'
    );
    el.style.borderImageSource = '';
    el.style.borderImageSlice = '';
    el.style.borderImageRepeat = '';

    // БАЗОВІ СТИЛІ (solid, dashed, dotted, ...)
    const base = BASE_STYLES.find(x => x.id === style);
    if (base) {
      if (sides.top) el.style.borderTopStyle = style;
      if (sides.right) el.style.borderRightStyle = style;
      if (sides.bottom) el.style.borderBottomStyle = style;
      if (sides.left) el.style.borderLeftStyle = style;
      return;
    }

    // ДЕКОРАТИВНІ СТИЛІ (через класи)
    const decor = DECOR_STYLES.find(x => x.id === style);
    if (decor) {
      if (sides.top) el.style.borderTopStyle = 'solid';
      if (sides.right) el.style.borderRightStyle = 'solid';
      if (sides.bottom) el.style.borderBottomStyle = 'solid';
      if (sides.left) el.style.borderLeftStyle = 'solid';
      if (decor.className) {
        el.classList.add(decor.className);
      }
      return;
    }

    // КАСТОМНІ СТИЛІ КОРИСТУВАЧА (border-image)
    const user = USER_IMAGE_STYLES.find(x => x.id === style);
    if (user && user.imgUrl) {
      if (sides.top) el.style.borderTopStyle = 'solid';
      if (sides.right) el.style.borderRightStyle = 'solid';
      if (sides.bottom) el.style.borderBottomStyle = 'solid';
      if (sides.left) el.style.borderLeftStyle = 'solid';
      el.style.borderImageSource = `url('${user.imgUrl}')`;
      el.style.borderImageSlice = 30;
      el.style.borderImageRepeat = 'round';
      return;
    }

    // Якщо стиль не знайдено — дефолт
    if (sides.top) el.style.borderTopStyle = 'solid';
    if (sides.right) el.style.borderRightStyle = 'solid';
    if (sides.bottom) el.style.borderBottomStyle = 'solid';
    if (sides.left) el.style.borderLeftStyle = 'solid';
  });

  bwLog('[border-widget] applyBorderStyleToTargets: стиль =', style, 'таргетів =', targets.length);
  notifyBorderControlsApplied00915_(targets, { live: false, reason: options.reason || 'border-style-apply-00915' });
}

 function applyBorderColorToTargets(colorState, options = {}) {
    const targets = Array.isArray(options?.targets) ? options.targets : getBorderTargets();
    if (!targets.length) {
      bwLog('[border-widget] applyBorderColorToTargets: немає таргетів');
      return;
    }

    // 🔹 Вимикаємо hover-підсвітку на короткий час,
    //    щоб не перекривала реальний колір рамки / лінії
    temporarilyDisableHoverOutlines();



    const mode = colorState && colorState.mode ? colorState.mode : 'solid';
    const opacity = colorState && typeof colorState.opacity === 'number'
      ? colorState.opacity
      : 100;
    const desat = colorState && typeof colorState.desaturate === 'number'
      ? colorState.desaturate
      : 0;
    const sides = normalizeBorderSides00916_(borderLinesState.sides);






    if (mode === 'solid') {
      const hex = (colorState && colorState.solidColor) || '#38bdf8';
      const rgba = colorToRgbaWithControls(hex, opacity, desat);

            targets.forEach((el, idx) => {
        if (!(el instanceof HTMLElement)) return;

        // MENU: map border color -> CSS var.
        if (el.matches('[data-st-menu-item="1"]')) {
          el.style.setProperty('--st-menu-item-bc', rgba);
          dbgBorderState('COLOR solid/menu[' + idx + ']', el, idx);
          return;
        }

        // Для базових стилів: просто кидаємо в borderColor
        el.style.borderImageSource = '';
        if (sides.top) el.style.borderTopColor = rgba;
        if (sides.right) el.style.borderRightColor = rgba;
        if (sides.bottom) el.style.borderBottomColor = rgba;
        if (sides.left) el.style.borderLeftColor = rgba;

        // 🔹 Якщо це наша лінія – синхронізуємо основну змінну для лінії
        if (el.classList.contains('st-block--line')) {
          el.style.setProperty('--site-block-brd', rgba);
        }

        dbgBorderState('COLOR solid[' + idx + ']', el, idx);
      });


      bwLog('[border-widget] applyBorderColorToTargets: solid', hex, '→', targets.length, 'елементів');
      notifyBorderColorApplied00911_(targets, {
        live: options?.live === true,
        commit: options?.commit === true,
        reason: options?.reason || (options?.live ? 'border-color-solid-live-00911' : 'border-color-solid-apply-00911'),
        colorState
      });
      return;
    }



    

       if (mode === 'gradient') {
      const hex1 = (colorState && colorState.gradColor1) || '#38bdf8';
      const hex2 = (colorState && colorState.gradColor2) || '#facc15';
      const split = colorState && typeof colorState.gradSplit === 'number'
        ? Math.max(0, Math.min(100, Math.round(colorState.gradSplit)))
        : 50;

      const blend = colorState && typeof colorState.gradBlend === 'number'
        ? Math.max(0, Math.min(50, Math.round(colorState.gradBlend)))
        : 0;

      const c1 = colorToRgbaWithControls(hex1, opacity, desat);
      const c2 = colorToRgbaWithControls(hex2, opacity, desat);

      const grad = buildBorderGradientCss(c1, c2, split, blend);

      targets.forEach((el, idx) => {
        if (!(el instanceof HTMLElement)) return;

        // MENU: gradient borders are not supported on items yet;
        // fall back to first gradient color as border color variable.
        if (el.matches('[data-st-menu-item="1"]')) {
          el.style.setProperty('--st-menu-item-bc', c1);
          return;
        }

        if (sides.top) el.style.borderTopColor = 'transparent';
        if (sides.right) el.style.borderRightColor = 'transparent';
        if (sides.bottom) el.style.borderBottomColor = 'transparent';
        if (sides.left) el.style.borderLeftColor = 'transparent';
        el.style.borderImageSource = grad;
        el.style.borderImageSlice = 1;
        el.style.borderImageRepeat = 'stretch';

        dbgBorderState('COLOR gradient[' + idx + ']', el, idx);
      });

      bwLog(
        '[border-widget] applyBorderColorToTargets: gradient',
        hex1, '→', hex2,
        'split', split, '%',
        'blend', blend, '% для', targets.length, 'елементів'
      );
      notifyBorderColorApplied00911_(targets, {
        live: options?.live === true,
        commit: options?.commit === true,
        reason: options?.reason || (options?.live ? 'border-color-gradient-live-00911' : 'border-color-gradient-apply-00911'),
        colorState
      });
      return;
    }

  }

  function cleanBorderColorSessionTargets00911_(targets) {
    return (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
  }

  function beginBorderColorEditSession00911_(meta = {}) {
    const targets = cleanBorderColorSessionTargets00911_(getBorderTargets());
    activeBorderColorEditSessionTargets00911_ = targets;
    activeBorderColorEditSessionStartedAt00911_ = Date.now();
    try { window.__ST_ALL_LOG__?.push?.('border-widget:color-session-start-00911', { reason: meta?.reason || '', targetCount: targets.length }, 'info'); } catch (_) {}
    return targets;
  }

  function getBorderColorEditSessionTargets00911_(meta = {}) {
    const targets = cleanBorderColorSessionTargets00911_(activeBorderColorEditSessionTargets00911_);
    if (targets.length) return targets;
    return beginBorderColorEditSession00911_({ reason: meta?.reason || 'border-color-session-autostart-00911' });
  }

  function endBorderColorEditSession00911_(meta = {}) {
    const ageMs = Date.now() - Number(activeBorderColorEditSessionStartedAt00911_ || Date.now());
    try { window.__ST_ALL_LOG__?.push?.('border-widget:color-session-end-00911', { reason: meta?.reason || '', targetCount: activeBorderColorEditSessionTargets00911_.length, ageMs }, 'info'); } catch (_) {}
    activeBorderColorEditSessionTargets00911_ = [];
    activeBorderColorEditSessionStartedAt00911_ = 0;
  }

  function notifyBorderColorApplied00911_(targets, options = {}) {
    const cleanTargets = cleanBorderColorSessionTargets00911_(targets);
    if (!cleanTargets.length) return;
    const live = options?.live === true;
    const commit = options?.commit === true;
    const detail = {
      reason: options?.reason || (live ? 'border-color-live-00911' : 'border-color-applied-00911'),
      targetCount: cleanTargets.length,
      targets: cleanTargets,
      target: cleanTargets[0] || null,
      live,
      commit,
      colorState: { ...(options?.colorState || {}) },
    };
    const hasMainTargets = cleanTargets.some(el => el instanceof HTMLElement && el.closest?.('#st-site-main-slot'));
    try { window.__ST_DESIGN_LIVE_STYLE_UNTIL_00774__ = Date.now() + (live ? 520 : 120); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent(live ? 'st:border-color-widget:live-applied' : 'st:border-color-widget:applied', { detail })); } catch (_) {}
    // Header/Footer keep the existing DOM path; Main uses the window event and SiteFrameStore bridge.
    // Save non-Main only on final commit so color picker input never blocks the UI.
    if (!hasMainTargets && commit && !live) {
      try { document.dispatchEvent(new CustomEvent('st:border-color-widget:applied', { detail })); } catch (_) {}
      try { window.ST_HISTORY?.capture?.(`border-color-${detail.reason}`); } catch (_) {}
      try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: `border-color-widget:${detail.reason}`, draft: false, forceContent: false, preserveLiveMain: true }); } catch (_) {}
    }
  }

  function handleBorderColorDetail00911_(detail, options = {}) {
    if (!detail || !detail.state) return;
    const live = detail.live === true;
    const commit = detail.commit === true;
    const reason = detail.reason || (live ? 'border-color-live-00911' : 'border-color-change-00911');
    const targets = (live || commit) ? getBorderColorEditSessionTargets00911_({ reason }) : getBorderTargets();
    applyBorderColorToTargets(detail.state, { targets, live, commit, reason });
    if (commit) endBorderColorEditSession00911_({ reason });
  }





  function cleanRadiusSessionTargets00911_(targets) {
    return (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
  }

  function beginRadiusEditSession00911_(meta = {}) {
    const targets = cleanRadiusSessionTargets00911_(getBorderTargets());
    activeRadiusEditSessionTargets00911_ = targets;
    activeRadiusEditSessionStartedAt00911_ = Date.now();
    try { window.__ST_ALL_LOG__?.push?.('border-widget:radius-session-start-00911', { reason: meta?.reason || '', targetCount: targets.length }, 'info'); } catch (_) {}
    return targets;
  }

  function getRadiusEditSessionTargets00911_() {
    const targets = cleanRadiusSessionTargets00911_(activeRadiusEditSessionTargets00911_);
    if (targets.length) return targets;
    return beginRadiusEditSession00911_({ reason: 'radius-session-autostart-00911' });
  }

  function endRadiusEditSession00911_(meta = {}) {
    const ageMs = Date.now() - Number(activeRadiusEditSessionStartedAt00911_ || Date.now());
    try { window.__ST_ALL_LOG__?.push?.('border-widget:radius-session-end-00911', { reason: meta?.reason || '', targetCount: activeRadiusEditSessionTargets00911_.length, ageMs }, 'info'); } catch (_) {}
    activeRadiusEditSessionTargets00911_ = [];
    activeRadiusEditSessionStartedAt00911_ = 0;
  }


  // --- СИНХРОНІЗАЦІЯ КНОПОК "Рамка" ЗІ СТИЛЕМ ВИДІЛЕНОГО ЕЛЕМЕНТА ---
   // --- СИНХРОНІЗАЦІЯ КНОПОК "Рамка" ЗІ СТИЛЕМ ВИДІЛЕНОГО ЕЛЕМЕНТА ---
 function syncBorderLinesFromSelection() {
  if (!borderLinesController || typeof borderLinesController.setStateFromHost !== 'function') {
    return;
  }








  const targets = getBorderTargets();
  if (!targets.length) {
    const emptyState = {
      mode: 'none',
      preset: 'none',
      sides: { top: true, right: true, bottom: true, left: true }
    };
    borderLinesState = emptyState;
    borderLinesController.setStateFromHost(emptyState);
    bwLog('[border-widget] syncBorderLinesFromSelection: немає таргетів, скинули стан');
    return;
  }

  // Допоміжна функція: читаємо товщину і сторони з одного елемента
  function readBorderFromElement(el) {
    const cs = getComputedStyle(el);

    const wTop    = parseFloat(cs.borderTopWidth)    || 0;
    const wRight  = parseFloat(cs.borderRightWidth)  || 0;
    const wBottom = parseFloat(cs.borderBottomWidth) || 0;
    const wLeft   = parseFloat(cs.borderLeftWidth)   || 0;

    const maxW = Math.max(wTop, wRight, wBottom, wLeft);

    let hasAnyBorder = maxW > 0.1;
    if (el.classList.contains('st-border-off')) {
      hasAnyBorder = false;
    }

    // Якщо рамки немає — одразу повертаємо
    if (!hasAnyBorder) {
      return {
        hasAnyBorder: false,
        preset: 'none',
        sides: { top: true, right: true, bottom: true, left: true },
        maxW: 0
      };
    }

    // Пресет за товщиною (синхронно з widthMap: 1 / 3 / 5 px)
    let preset;
    if (maxW < 2) {
      preset = 'thin';
    } else if (maxW < 4) {
      preset = 'medium';
    } else if (maxW < 6) {
      preset = 'thick';
    } else {
      preset = 'custom';
    }

    // Сторони
    const t = wTop    > 0.1;
    const r = wRight  > 0.1;
    const b = wBottom > 0.1;
    const l = wLeft   > 0.1;

    const sides = { top: t, right: r, bottom: b, left: l };

    return {
      hasAnyBorder: true,
      preset,
      sides,
      maxW
    };
  }

  // Зчитуємо стани для всіх таргетів
  const readings = targets.map(readBorderFromElement);

  const anyBorder = readings.some(r => r.hasAnyBorder);
  const allNoBorder = readings.every(r => !r.hasAnyBorder);

  const next = { ...borderLinesState };

  if (!anyBorder || allNoBorder) {
    // Ніхто не має рамки → повністю вимикаємо
    next.mode = 'none';
    next.preset = 'none';
    next.sides = { top: true, right: true, bottom: true, left: true };
  } else {
    next.mode = 'on';

    // Пресет: якщо всі з однаковою товщиною → той пресет; інакше → "мішані"
    const firstPreset = readings.find(r => r.hasAnyBorder)?.preset || 'none';
    const isMixedPreset = readings.some(r => r.hasAnyBorder && r.preset !== firstPreset);

    if (isMixedPreset) {
      next.preset = 'mixed';
    } else {
      next.preset = firstPreset;
    }

    // Сторони поки беремо з першого елемента з рамкою
    const firstWithBorder = readings.find(r => r.hasAnyBorder);
    next.sides = firstWithBorder
      ? firstWithBorder.sides
      : { top: true, right: true, bottom: true, left: true };
  }

  borderLinesState = next;
  bwLog('[border-widget] syncBorderLinesFromSelection →', next);
  borderLinesController.setStateFromHost(next);
}

  function syncBorderRadiusFromSelection() {
    if (!borderRadiusController || typeof borderRadiusController.setStateFromHost !== 'function') {
      return;
    }

    const targets = getBorderTargets();
    if (!targets.length) {
      const empty = {
        radius: 0,
        corners: { tl: true, tr: true, br: true, bl: true },
        preset: 'custom'
      };
      borderRadiusState = empty;
      borderRadiusController.setStateFromHost(empty);
      bwLog('[border-widget] syncBorderRadiusFromSelection: немає таргетів, скинули стан');
      return;
    }

    const el = targets[0];
    if (!(el instanceof HTMLElement)) return;

    const cs = getComputedStyle(el);
    const tl = parseFloat(cs.borderTopLeftRadius)    || 0;
    const tr = parseFloat(cs.borderTopRightRadius)   || 0;
    const br = parseFloat(cs.borderBottomRightRadius)|| 0;
    const bl = parseFloat(cs.borderBottomLeftRadius) || 0;

    const allEqual =
      Math.abs(tl - tr) < 0.5 &&
      Math.abs(tl - br) < 0.5 &&
      Math.abs(tl - bl) < 0.5;

    const nextRadius = allEqual ? tl : tl;

    const next = {
      radius: nextRadius,
      corners: {
        tl: true,
        tr: true,
        br: true,
        bl: true
      },
      preset: 'custom'
    };

    borderRadiusState = next;
    bwLog('[border-widget] syncBorderRadiusFromSelection →', next);
    borderRadiusController.setStateFromHost(next);
  }

function syncBorderStyleFromSelection() {
  if (!borderStyleController || typeof borderStyleController.setStateFromHost !== 'function') {
    return;
  }

  const targets = getBorderTargets();
  if (!targets.length) {
    const empty = { style: 'solid' };
    borderStyleState = empty;
    borderStyleController.setStateFromHost(empty);
    bwLog('[border-widget] syncBorderStyleFromSelection: немає таргетів, скинули стиль');
    return;
  }

  const el = targets[0];
  if (!(el instanceof HTMLElement)) return;

  let nextStyle = 'solid';

  // 1) Якщо є один із декоративних класів — вважаємо, що це він
  const decorMatch = DECOR_STYLES.find(d => d.className && el.classList.contains(d.className));
  if (decorMatch) {
    nextStyle = decorMatch.id;
  } else {
    // 2) Якщо є користувацький border-image (дуже грубо)
    const cs = getComputedStyle(el);
    const borderImage = cs.borderImageSource || cs['border-image-source'];
    const hasUserImage = borderImage && borderImage !== 'none';

    if (hasUserImage) {
      const user = USER_IMAGE_STYLES[0];
      if (user) {
        nextStyle = user.id;
      } else {
        nextStyle = 'solid';
      }
    } else {
      // 3) Стандартний border-style
      const cssStyle = cs.borderStyle || cs['border-style'] || 'solid';
      const allowed = BASE_STYLES.map(x => x.id);
      if (allowed.includes(cssStyle)) {
        nextStyle = cssStyle;
      } else {
        nextStyle = 'solid';
      }
    }
  }

  const next = { style: nextStyle };
  borderStyleState = next;
  borderStyleController.setStateFromHost(next);
  bwLog('[border-widget] syncBorderStyleFromSelection →', next);
}



  // --- РОЗМІТКА ВІДЖЕТА ---
  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Лінії</span>
        <span class="design-section__header-subtitle">
         
        </span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <!-- РЕЖИМ ВИБОРУ ЕЛЕМЕНТІВ -->
      <div class="design-field">
        <div class="design-field__label">Режим вибору елементів</div>
        <div class="design-border-target-summary" data-border="summary">
          Режим "Нічого": використовуємо звичайне виділення (Canvas / Дерево, Ctrl).
        </div>
        <p class="design-subnote">
          Режим вибору задається у верхній панелі інспектора
          (Нічого / Секції / Рівні / Контейнери / Блоки). Можна ввімкнути кілька режимів одночасно.
        </p>
      </div>

      <!-- МЕЖІ (гіди) -->
      <div class="design-field">
        <div class="design-field__label">Межі елементів</div>
        <div class="design-borders-guides-row" data-border-guides>
          <label class="design-border-flag">
            <input type="checkbox" data-border-guide="sections" />
            <span>Секції</span>
          </label>
          <label class="design-border-flag">
            <input type="checkbox" data-border-guide="containers" />
            <span>Контейнери</span>
          </label>
          <label class="design-border-flag">
            <input type="checkbox" data-border-guide="blocks" />
            <span>Блоки</span>
          </label>
        </div>
        <p class="design-subnote">
          Показує пунктирні межі секцій, блоків-контейнерів та звичайних блоків.
          Це лише допоміжна сітка, вона не впливає на реальний бордер.
        </p>
      </div>

      <!-- ПІД-АКОРДЕОНИ НАЛАШТУВАНЬ БОРДЕРА -->

      <div class="design-border-subsections">

        <!-- РАМКА -->
        <div class="design-border-subsection" data-border-subsection-id="line">
          <button class="design-border-subheader" type="button">
            <span class="design-border-subheader-title">Рамка</span>
            <span class="design-border-subheader-chevron">▶</span>
          </button>
          <div class="design-border-subbody">
            <div data-border-lines-root></div>
            
            <div class="design-field">
              <div class="design-field__label">Власна товщина</div>
              
              <div class="custom-thickness-wrap">
                <input type="range" min="1" max="100" value="1" class="custom-thickness-range" data-border-thickness-range>
                <input type="number" min="1" max="100" value="1" class="custom-thickness-input" data-border-thickness-input>
              </div>

              <button type="button" class="design-pill" data-border-thickness-reset>
                Скинути до стандартних
              </button>
            </div>



          </div>
        </div>

              <!-- КОЛІР рамки -->
                      <div class="design-border-subsection" data-border-subsection-id="glow">
                        <button class="design-border-subheader" type="button">
                          <span class="design-border-subheader-title">Колір</span>
                          <span class="design-border-subheader-chevron">▶</span>
                        </button>
                        <div class="design-border-subbody">
                          <div data-border-color-root></div>
                        </div>
                      </div>


            <!-- СТИЛЬ ЛІНІЇ -->
          <div class="design-border-subsection" data-border-subsection-id="style">
            <button class="design-border-subheader" type="button">
              <span class="design-border-subheader-title">Стиль</span>
              <span class="design-border-subheader-chevron">▶</span>
            </button>
            <div class="design-border-subbody">
              <div data-border-style-root></div>
            </div>
          </div>






        <!-- РАДІУСИ -->
        <div class="design-border-subsection" data-border-subsection-id="radius">
          <button class="design-border-subheader" type="button">
            <span class="design-border-subheader-title">Радіуси</span>
            <span class="design-border-subheader-chevron">▶</span>
          </button>
          <div class="design-border-subbody">
            <div data-border-radius-root></div>
          </div>
        </div>

        

       

      </div>

      <div class="design-field">
        <div class="design-border-apply-row">
          <button type="button" class="design-button" data-border="apply">
            Застосувати бордер
          </button>
          <span class="design-border-apply-note">
            Поки що це тільки каркас. Логіку застосування додамо на наступному етапі.
          </span>
        </div>
      </div>
    </div>
  `;

  // --- ВЛАСНА ТОВЩИНА (слайдер + інпут + скидання) ---
  const thicknessRangeEl = sectionEl.querySelector('[data-border-thickness-range]');
  const thicknessInputEl = sectionEl.querySelector('[data-border-thickness-input]');
  const thicknessResetBtn = sectionEl.querySelector('[data-border-thickness-reset]');

  function applyCustomThickness(px, options = {}) {
    const live = options.live === true;
    const targets = borderTargetsForEdit00915_(live);
    if (!targets.length) return;

    const safePx = Math.max(1, Math.min(100, Math.round(px || 1)));
    const pxStr = safePx + 'px';
    const sides = normalizeBorderSides00916_(borderLinesState.sides);

    targets.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.matches('[data-st-menu-item="1"]')) {
        el.style.setProperty('--st-menu-item-bw', pxStr);
        if (sides.top) el.style.setProperty('--st-menu-item-bwt', pxStr);
        if (sides.right) el.style.setProperty('--st-menu-item-bwr', pxStr);
        if (sides.bottom) el.style.setProperty('--st-menu-item-bwb', pxStr);
        if (sides.left) el.style.setProperty('--st-menu-item-bwl', pxStr);
        return;
      }
      if (sides.top) el.style.borderTopWidth = pxStr;
      if (sides.right) el.style.borderRightWidth = pxStr;
      if (sides.bottom) el.style.borderBottomWidth = pxStr;
      if (sides.left) el.style.borderLeftWidth = pxStr;
    });

    // фіксуємо стан
    borderLinesState.mode = 'on';
    borderLinesState.preset = 'custom';
    borderLinesState.customValue = safePx;

    bwLog('[border-widget] custom thickness applied:', safePx, 'px для', targets.length, 'елементів');
    notifyBorderControlsApplied00915_(targets, { live, reason: options.reason || (live ? 'border-custom-thickness-live-00915' : 'border-custom-thickness-apply-00915') });
  }

  if (thicknessRangeEl && thicknessInputEl) {
    thicknessRangeEl.addEventListener('input', () => {
      const px = Number(thicknessRangeEl.value) || 1;
      thicknessInputEl.value = px;
      applyCustomThickness(px, { live: true });
    });

    thicknessInputEl.addEventListener('input', () => {
      let px = Number(thicknessInputEl.value) || 1;
      if (px < 1) px = 1;
      if (px > 100) px = 100;
      thicknessInputEl.value = px;
      thicknessRangeEl.value = px;
      applyCustomThickness(px, { live: true });
    });
    const commitCustomThickness = () => {
      const px = Number(thicknessInputEl.value || thicknessRangeEl.value) || 1;
      applyCustomThickness(px, { live: false, reason: 'border-custom-thickness-change-00915' });
    };
    thicknessRangeEl.addEventListener('change', commitCustomThickness);
    thicknessInputEl.addEventListener('change', commitCustomThickness);
  }

  if (thicknessResetBtn) {
    thicknessResetBtn.addEventListener('click', () => {
      // повертаємо логіку товщини до пресетів (тонка/середня/товста)
      borderLinesState.preset = 'thin';
      borderLinesState.customValue = null;

      const targets = getBorderTargets();
      targets.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        el.style.removeProperty('border-width');
      });

      // синхронізуємо UI назад з елементів
      syncBorderLinesFromSelection();

      bwLog('[border-widget] custom thickness reset');
      notifyBorderControlsApplied00915_(targets, { live: false, reason: 'border-custom-thickness-reset-00915' });
    });
  }






  // --- Акордеон секції "Бордер" (верхній) ---
  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn) {
    headerBtn.addEventListener('click', function () {
      sectionEl.classList.toggle('is-open');
    });
  }

  const summaryEl = sectionEl.querySelector('[data-border="summary"]');

  // ---- МЕЖІ (гіди) ----
  const builderRoot = document.getElementById('builder-root');
  const guidesInputs = Array.from(
    sectionEl.querySelectorAll('input[data-border-guide]')
  );

  const guidesState = {
    sections: false,
    containers: false,
    blocks: false
  };

  function markBlockGuideKinds() {
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) return;
    const blocks = Array.from(siteRoot.querySelectorAll('.st-block'));
    blocks.forEach((block) => {
      block.classList.remove('st-block--guide-container', 'st-block--guide-leaf');
      const hasInnerBlock = block.querySelector('.st-block');
      if (hasInnerBlock) {
        block.classList.add('st-block--guide-container');
      } else {
        block.classList.add('st-block--guide-leaf');
      }
    });
  }

  function applyGuidesState() {
    if (!builderRoot) return;

    builderRoot.classList.toggle(
      'builder--guides-sections',
      !!guidesState.sections
    );
    builderRoot.classList.toggle(
      'builder--guides-containers',
      !!guidesState.containers
    );
    builderRoot.classList.toggle(
      'builder--guides-blocks',
      !!guidesState.blocks
    );

    if (guidesState.containers || guidesState.blocks) {
      markBlockGuideKinds();
    }
  }

  guidesInputs.forEach((input) => {
    input.addEventListener('change', () => {
      const type = input.getAttribute('data-border-guide');
      if (!type) return;
      guidesState[type] = input.checked;
      applyGuidesState();
    });
  });

  // ---- допоміжні: отримати цілі / симулювати клік / авто-вибір ----

  function getSelectionModesArray() {
    return Array.from(targetModes || []).filter(Boolean);
  }

  function isTechnicalOrMenuItem(el) {
    return !!(el && el.matches && el.matches('[data-st-menu-item="1"], .st-block--menu-item, .st-resize, .st-resize *'));
  }

  function isContainerBlock(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (!el.classList.contains('st-block')) return false;
    if (isTechnicalOrMenuItem(el)) return false;
    try {
      if (el.querySelector(':scope > .st-row')) return true;
      if (el.querySelector(':scope > .st-block:not([data-st-menu-item="1"]):not(.st-block--menu-item)')) return true;
      const mode = String(el.dataset?.layoutMode || '').trim().toLowerCase();
      if (mode && !['button','menu','logo','phone','icon','text'].includes(String(el.dataset?.blockKind || '').trim().toLowerCase())) return true;
    } catch (_) {}
    return false;
  }


  function isHeadingElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    return !!(
      el.classList.contains('st-block--heading') ||
      String(el.dataset?.blockRole || '').trim().toLowerCase() === 'heading' ||
      el.hasAttribute('data-heading-level')
    );
  }

  function isTextFieldElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.closest('.hb-panel, .fb-panel, .builder__settings, .design-panel')) return false;
    return !!el.matches?.('.st-text-edit, [data-st-text-target="1"], .st-menu__text, .st-button__label, .st-phone__text, .st-logo__title, .st-logo__subtitle');
  }

  function isIconElement(el) {
    if (!(el instanceof HTMLElement)) return false;
    if (el.closest('.hb-panel, .fb-panel, .builder__settings, .design-panel')) return false;
    try {
      if (el.hidden || el.closest?.('[hidden]')) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    } catch (_) {}
    // 00286: "Іконка" in the global inspector means the icon face/contour
    // wrapper. Inner SVG/span nodes may be discovered, but iconVisualTarget()
    // maps them back to the visible wrapper before selection.
    return !!el.matches?.('.st-icon-svg, .st-icon-btn__glyph, .st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg, .st-icon-btn, .st-button__iconbtn, .st-phone__iconbtn, .st-logo__iconbtn, .st-logo__mark');
  }

  function iconVisualTarget(el) {
    if (!(el instanceof HTMLElement)) return el;

    // 00286: “Іконка” must mean the visible icon FACE / bounding box, not
    // the inner SVG path/dot.  The drawing inside the icon should not receive
    // the selection outline; only the icon contour/wrapper does.
    const FACE_SEL = '.st-icon-btn, .st-button__iconbtn, .st-phone__iconbtn, .st-logo__iconbtn, .st-logo__mark';
    const INNER_SEL = '.st-icon-svg, .st-icon-btn__glyph, .st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg, svg';

    if (el.matches?.(FACE_SEL)) return el;

    if (el.matches?.(INNER_SEL)) {
      const face = el.closest?.(FACE_SEL);
      return (face instanceof HTMLElement) ? face : el;
    }

    // Icon block: select the visible icon button/mark inside it, not the whole
    // blue owner block and not the SVG drawing.
    if (el.classList?.contains('st-block--icon')) {
      return el.querySelector?.(':scope > .st-icon-btn, :scope > .st-button__iconbtn, :scope > .st-phone__iconbtn, :scope > .st-logo__iconbtn, :scope > .st-logo__mark')
        || el.querySelector?.(':scope .st-icon-btn, :scope .st-button__iconbtn, :scope .st-phone__iconbtn, :scope .st-logo__iconbtn, :scope .st-logo__mark')
        || el;
    }

    const owner = el.closest?.(FACE_SEL + ', .st-block--icon');
    if (owner instanceof HTMLElement && owner !== el) return iconVisualTarget(owner);

    return el;
  }

  function collectTargetsForMode(siteRoot, mode) {
    if (!siteRoot) return [];
    if (mode === 'sections') {
      return Array.from(siteRoot.querySelectorAll('.st-section')).filter(Boolean);
    }
    if (mode === 'levels') {
      return Array.from(siteRoot.querySelectorAll('.st-row')).filter((el) => !el.closest('.hb-panel, .fb-panel'));
    }
    if (mode === 'containers') {
      return Array.from(siteRoot.querySelectorAll('.st-block')).filter(isContainerBlock);
    }
    if (mode === 'blocks') {
      return Array.from(siteRoot.querySelectorAll('.st-block')).filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        if (isTechnicalOrMenuItem(el)) return false;
        if (isHeadingElement(el) || isIconElement(el)) return false;
        return !isContainerBlock(el);
      });
    }
    if (mode === 'headings') {
      return Array.from(siteRoot.querySelectorAll('.st-block--heading, [data-block-role="heading"], [data-heading-level]')).filter(isHeadingElement);
    }
    if (mode === 'texts') {
      return Array.from(siteRoot.querySelectorAll('.st-text-edit, [data-st-text-target="1"], .st-menu__text, .st-button__label, .st-phone__text, .st-logo__title, .st-logo__subtitle')).filter(isTextFieldElement);
    }
    if (mode === 'icons') {
      const raw = Array.from(siteRoot.querySelectorAll('.st-block--icon, .st-icon-btn, .st-button__iconbtn, .st-phone__iconbtn, .st-logo__iconbtn, .st-logo__mark, .st-icon-svg, .st-icon-btn__glyph, .st-phone__iconsvg, .st-button__iconsvg, .st-logo__iconsvg'));
      return uniqueTargets(raw.map(iconVisualTarget).filter(isIconElement));
    }
    return [];
  }

  function uniqueTargets(list) {
    const out = [];
    const seen = new Set();
    (list || []).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (seen.has(el)) return;
      seen.add(el);
      out.push(el);
    });
    return out;
  }

  // 00260: окремий тип підсвітки для глобальних режимів вибору.
  // Потрібно, щоб активний перший контейнер не ставав синім тільки тому,
  // що на ньому також стоїть .is-active. Колір має визначатися типом:
  // Секція=синя, Рівень=жовтий, Контейнер=зелений, Блок=синій.
  function getDesignSelectionKind(el) {
    if (!(el instanceof HTMLElement)) return '';
    if (isHeadingElement(el)) return 'headings';
    if (isTextFieldElement(el)) return 'texts';
    if (isIconElement(el)) return 'icons';
    if (el.classList.contains('st-section')) return 'sections';
    if (el.classList.contains('st-row')) return 'levels';
    if (el.classList.contains('st-block')) return isContainerBlock(el) ? 'containers' : 'blocks';
    return '';
  }

  function clearDesignSelectionKinds(scope) {
    const root = scope || document;
    try {
      root.querySelectorAll('[data-st-design-select-kind]').forEach((el) => {
        try { el.removeAttribute('data-st-design-select-kind'); } catch (_) {}
      });
    } catch (_) {}
  }


  function clearDesignAutoSelection(scope) {
    const root = scope || document;
    try {
      root.querySelectorAll('[data-st-design-select-kind], .is-selected[data-st-design-select-kind], .is-active[data-st-design-select-kind]').forEach((el) => {
        try {
          el.classList.remove('is-selected', 'is-active');
          el.removeAttribute('data-st-design-select-kind');
        } catch (_) {}
      });
    } catch (_) {}
  }

  function markDesignSelectionKinds(targets) {
    (targets || []).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const kind = getDesignSelectionKind(el);
      if (kind) el.setAttribute('data-st-design-select-kind', kind);
      else el.removeAttribute('data-st-design-select-kind');
    });
  }


  function hasPersistentDesignSelectionModes() {
    return getSelectionModesArray().length > 0;
  }

  function needsPersistentDesignSelectionRefresh() {
    if (!hasPersistentDesignSelectionModes()) return false;
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) return false;

    const targets = getBorderTargets();
    if (!targets.length) return false;

    for (let i = 0; i < targets.length; i++) {
      const el = targets[i];
      if (!(el instanceof HTMLElement)) return true;
      const expectedKind = getDesignSelectionKind(el);
      if (!el.classList.contains('is-selected')) return true;
      if (i === 0 && !el.classList.contains('is-active')) return true;
      if (expectedKind && el.getAttribute('data-st-design-select-kind') !== expectedKind) return true;
    }

    try {
      const targetSet = new Set(targets);
      const stray = siteRoot.querySelector(
        '.st-section.is-selected, .st-row.is-selected, .st-block.is-selected, .st-text-edit.is-selected, [data-st-text-target="1"].is-selected, .st-menu__text.is-selected, .st-button__label.is-selected, .st-phone__text.is-selected, .st-logo__title.is-selected, .st-logo__subtitle.is-selected, .st-icon-btn.is-selected, .st-icon-svg.is-selected, .st-icon-btn__glyph.is-selected, .st-button__iconbtn.is-selected, .st-phone__iconbtn.is-selected, .st-logo__iconbtn.is-selected, .st-logo__mark.is-selected, .st-phone__iconsvg.is-selected, .st-button__iconsvg.is-selected, .st-logo__iconsvg.is-selected, .st-section.is-active, .st-row.is-active, .st-block.is-active, .st-text-edit.is-active, [data-st-text-target="1"].is-active, .st-menu__text.is-active, .st-button__label.is-active, .st-phone__text.is-active, .st-logo__title.is-active, .st-logo__subtitle.is-active, .st-icon-btn.is-active, .st-icon-svg.is-active, .st-icon-btn__glyph.is-active, .st-button__iconbtn.is-active, .st-phone__iconbtn.is-active, .st-logo__iconbtn.is-active, .st-logo__mark.is-active, .st-phone__iconsvg.is-active, .st-button__iconsvg.is-active, .st-logo__iconsvg.is-active'
      );
      if (stray && !targetSet.has(stray)) return true;
    } catch (_) {}

    return false;
  }

  function schedulePersistentDesignSelectionRefresh(reason, delay) {
    if (!hasPersistentDesignSelectionModes()) return;
    designSelectionLastReason = reason || 'unknown';
    clearTimeout(designSelectionReapplyTimer);
    designSelectionReapplyTimer = setTimeout(() => {
      designSelectionReapplyTimer = 0;
      if (!hasPersistentDesignSelectionModes()) return;
      if (designSelectionApplying) return;
      if (!needsPersistentDesignSelectionRefresh()) return;
      bwLog('persistent design selection refresh:', designSelectionLastReason);
      applyAutoSelectionForMode();
    }, typeof delay === 'number' ? delay : 0);
  }

  function getBorderTargets() {
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) {
      bwLog('site-root not found');
      return [];
    }

    const modes = getSelectionModesArray();

    // Multi-mode: Секції / Рівні / Контейнери / Блоки
    if (modes.length) {
      const all = [];
      modes.forEach((mode) => {
        all.push.apply(all, collectTargetsForMode(siteRoot, mode));
      });
      const targets = uniqueTargets(all);
      bwLog('getBorderTargets: multi modes =', modes.join(','), 'targets =', targets.length);
      return targets;
    }

    // режим "Нічого" – беремо те, що вже виділено конструктором
    if (typeof getSelection === 'function') {
      const sel = getSelection();
      if (sel && Array.isArray(sel.elements)) {
        const els = sel.elements.filter(Boolean);
        // Menu cascade rule:
        // - If any menu items selected -> only them
        // - Else if menu block selected -> menu block (global)
        const menuItems = els.filter(el => el instanceof HTMLElement && el.matches('[data-st-menu-item="1"]'));
        if (menuItems.length) {
          bwLog('getBorderTargets: menu-items selected =', menuItems.length);
          return menuItems;
        }
        const menuBlocks = els.filter(el => el instanceof HTMLElement && el.matches('[data-st-menu="1"]'));
        if (menuBlocks.length) {
          bwLog('getBorderTargets: menu-block selected');
          return [menuBlocks[0]];
        }

        bwLog(
          'getBorderTargets: режим none, з getSelection() елементів =',
          els.length
        );
        return els;
      }
      bwLog('getBorderTargets: режим none, getSelection() порожній або некоректний:', sel);
    }

    return [];
  }

  function updateTargetSummaryText() {
    if (!summaryEl) return;

    const targets = getBorderTargets();
    const count = targets.length;
    const modes = getSelectionModesArray();
    const labels = { sections: 'Секції', levels: 'Рівні', containers: 'Контейнери', blocks: 'Блоки', headings: 'Заголовок', texts: 'Текст', icons: 'Іконка' };

    if (!modes.length) {
      if (!count) {
        summaryEl.textContent =
          'Режим "Нічого": елементи не вибрані. Виділи блоки/рівні/секції в конструкторі або в Дереві.';
      } else if (count === 1) {
        summaryEl.textContent =
          'Режим "Нічого": 1 елемент у поточному виділенні (Canvas / Дерево).';
      } else {
        summaryEl.textContent =
          'Режим "Нічого": ' +
          count +
          ' елементи(ів) у поточному виділенні.';
      }
      return;
    }

    const label = modes.map((m) => labels[m] || m).join(' + ');
    summaryEl.textContent =
      'Режим "' + label + '": буде застосовано до ' + count + ' елемент(ів).';
  }

  // Симуляція кліку по елементу полотна
  function simulateCanvasClick(el, withCtrl) {
    if (!el) return;

    const label =
      el.getAttribute('data-block-id') ||
      el.getAttribute('data-section-id') ||
      el.id ||
      el.className;

    bwLog(
      'simulateCanvasClick:',
      'ctrl=', !!withCtrl,
      'target=',
      label
    );

    const evt = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
      ctrlKey: !!withCtrl,
      metaKey: !!withCtrl
    });
    el.dispatchEvent(evt);

    syncBorderLinesFromSelection();
  }

  // Відкрити дерево сторінки, якщо воно згорнуте
  function ensurePageTreeVisible() {
    const wrap = document.getElementById('page-tree-wrap');
    const toggleBtn = document.getElementById('toggle-page-tree');

    if (!wrap || !toggleBtn) return;

    const display = window.getComputedStyle(wrap).display;
    if (display === 'none') {
      toggleBtn.click();
    }
  }

  // Автоматичний вибір залежно від режиму
  function applyAutoSelectionForMode() {
    bwLog('applyAutoSelectionForMode: режим =', targetMode, 'modes =', getSelectionModesArray());

    const siteRoot = document.getElementById('site-root');

    if (targetMode === 'none' || !getSelectionModesArray().length) {
      clearTimeout(designSelectionReapplyTimer);
      designSelectionReapplyTimer = 0;
      if (siteRoot) clearDesignAutoSelection(siteRoot);
      updateTargetSummaryText();
      syncBorderLinesFromSelection();
      return;
    }

    if (siteRoot) clearDesignAutoSelection(siteRoot);

    ensurePageTreeVisible();

    if (!siteRoot) {
      bwLog('site-root не знайдено в applyAutoSelectionForMode');
      updateTargetSummaryText();
      syncBorderLinesFromSelection();
      return;
    }

    const targets = getBorderTargets();
    bwLog('auto-selection targets:', targets.length);

    // Не залежимо від click-handler-а, бо рівні/контейнери у header/footer можуть
    // мати іншу вкладеність. Напряму ставимо класи виділення для всіх режимів.
    designSelectionApplying = true;
    try {
      siteRoot.querySelectorAll('.st-section.is-selected, .st-row.is-selected, .st-block.is-selected, .st-text-edit.is-selected, [data-st-text-target="1"].is-selected, .st-menu__text.is-selected, .st-button__label.is-selected, .st-phone__text.is-selected, .st-logo__title.is-selected, .st-logo__subtitle.is-selected, .st-icon-btn.is-selected, .st-icon-svg.is-selected, .st-icon-btn__glyph.is-selected, .st-button__iconbtn.is-selected, .st-phone__iconbtn.is-selected, .st-logo__iconbtn.is-selected, .st-logo__mark.is-selected, .st-phone__iconsvg.is-selected, .st-button__iconsvg.is-selected, .st-logo__iconsvg.is-selected, .st-section.is-active, .st-row.is-active, .st-block.is-active, .st-text-edit.is-active, [data-st-text-target="1"].is-active, .st-menu__text.is-active, .st-button__label.is-active, .st-phone__text.is-active, .st-logo__title.is-active, .st-logo__subtitle.is-active, .st-icon-btn.is-active, .st-icon-svg.is-active, .st-icon-btn__glyph.is-active, .st-button__iconbtn.is-active, .st-phone__iconbtn.is-active, .st-logo__iconbtn.is-active, .st-logo__mark.is-active, .st-phone__iconsvg.is-active, .st-button__iconsvg.is-active, .st-logo__iconsvg.is-active')
        .forEach((el) => el.classList.remove('is-selected', 'is-active'));
      markDesignSelectionKinds(targets);
      targets.forEach((el, idx) => {
        el.classList.add('is-selected');
        if (idx === 0) el.classList.add('is-active');
      });
      if (targets[0]) {
        document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { type: 'design-mode-multi', element: targets[0], elements: targets } }));
      }
    } catch (err) {
      console.warn('[border-widget] multi auto-selection failed', err);
    } finally {
      // MutationObserver callback runs after the current call stack. Keep the guard
      // active until the browser has flushed the class mutations generated above.
      setTimeout(() => { designSelectionApplying = false; }, 0);
    }

    updateTargetSummaryText();
    syncBorderLinesFromSelection();
  }

  // --- ВНУТРІШНІ АКОРДЕОНИ (Рамка / Радіуси / Тіні / Підсвічування) ---

  const subsections = Array.from(
    sectionEl.querySelectorAll('.design-border-subsection')
  );
  let subState = loadBorderSubsectionsState();
  const hasStoredState = subState && Object.keys(subState).length > 0;

  subsections.forEach(function (sub, index) {
    const existingId = sub.getAttribute('data-border-subsection-id');
    const id = existingId || ('sec-' + (index + 1));
    sub.setAttribute('data-border-subsection-id', id);

    let isOpen;
    if (hasStoredState && Object.prototype.hasOwnProperty.call(subState, id)) {
      isOpen = !!subState[id];
    } else {
      isOpen = id === 'line';
    }

    const header = sub.querySelector('.design-border-subheader');
    const body = sub.querySelector('.design-border-subbody');
    const chevron = sub.querySelector('.design-border-subheader-chevron');

    function applyOpenState(open) {
      sub.classList.toggle('is-open', open);
      if (body) body.hidden = !open;
      if (chevron) chevron.textContent = open ? '▼' : '▶';
    }

    applyOpenState(isOpen);

    if (header && !header.dataset.borderSubBound) {
      header.dataset.borderSubBound = '1';
      header.addEventListener('click', function () {
        const currentlyOpen = sub.classList.contains('is-open');
        const nextState = !currentlyOpen;
        applyOpenState(nextState);

        subState = subState || {};
        subState[id] = nextState;
        saveBorderSubsectionsState(subState);
      });
    }
  });

  // --- СЛІДКУЄМО ЗА ЗМІНАМИ ВИДІЛЕННЯ / DOM ---
  const siteRoot = document.getElementById('site-root');
  if (siteRoot) {
    const mo = new MutationObserver(function (mutations) {
      if (designSelectionApplying) return;

      // 00263: if any top selection mode is enabled, regular clicks/manipulations
      // may remove .is-selected/.is-active. Reapply the mode-highlight instead of
      // letting it disappear. Only the top mode buttons may turn it off.
      if (hasPersistentDesignSelectionModes()) {
        let touchedSelectionOrDom = false;
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (m.type === 'childList') {
            touchedSelectionOrDom = true;
            break;
          }
          if (m.type === 'attributes' && (m.attributeName === 'class' || m.attributeName === 'data-st-design-select-kind')) {
            touchedSelectionOrDom = true;
            break;
          }
        }
        if (touchedSelectionOrDom) schedulePersistentDesignSelectionRefresh('mutation', 30);
        return;
      }

      if (targetMode !== 'none') return;
      let need = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const t = m.target;
          if (t instanceof HTMLElement) {
            if (
              t.classList.contains('is-active') ||
              t.classList.contains('is-selected')
            ) {
              need = true;
              break;
            }
          }
        }
      }
      if (need) {
        setTimeout(() => {
          updateTargetSummaryText();
          syncBorderLinesFromSelection();
          syncBorderRadiusFromSelection();
          syncBorderStyleFromSelection();
        }, 0);
      }
    });

    mo.observe(siteRoot, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'data-st-design-select-kind'],
      childList: true
    });
  }

  // 00263: clicks/resizes/outside interactions must not remove global mode highlights.
  // We re-check after the interaction completes, not during pointermove, to avoid
  // fighting resize/drag logic.
  ['click', 'mouseup', 'pointerup', 'dragend', 'keyup'].forEach((evtName) => {
    document.addEventListener(evtName, function () {
      schedulePersistentDesignSelectionRefresh(evtName, 0);
    }, true);
  });

  window.addEventListener('st:selection-changed', function () {
    schedulePersistentDesignSelectionRefresh('st:selection-changed', 0);
  });

  // --- Слухаємо глобальну подію режиму вибору ---
  window.addEventListener('st:designSelectionModeChange', function (ev) {
    const detail = ev && ev.detail ? ev.detail : {};
    const mode = detail.mode;
    const modes = Array.isArray(detail.modes)
      ? detail.modes.filter(Boolean)
      : (mode && mode !== 'none' ? [mode] : []);
    if (!mode && !modes.length) return;
    targetModes = new Set(modes);
    targetMode = modes.length === 0 ? 'none' : (modes.length === 1 ? modes[0] : 'multi');
    bwLog('подія st:designSelectionModeChange, режим =', targetMode, 'modes =', modes);
    applyAutoSelectionForMode();
  });

  // --- Слухаємо глобальну подію зміни кольору бордера ---
  // 00911: input події color/range зливаються в один RAF-кадр; final change комітиться один раз.
  window.addEventListener('st:borderColorChange', function (ev) {
    const detail = ev && ev.detail;
    if (!detail || !detail.state) return;
    if (detail.live === true) {
      pendingBorderColorLiveDetail00911_ = detail;
      if (borderColorLiveRaf00911_) return;
      borderColorLiveRaf00911_ = requestAnimationFrame(() => {
        borderColorLiveRaf00911_ = 0;
        const liveDetail = pendingBorderColorLiveDetail00911_;
        pendingBorderColorLiveDetail00911_ = null;
        handleBorderColorDetail00911_(liveDetail, { live: true });
      });
      return;
    }
    handleBorderColorDetail00911_(detail, { live: false });
  });






  // --- Кнопка "Застосувати" — поки що заглушка ---
  const applyBtn = sectionEl.querySelector('button[data-border="apply"]');
  if (applyBtn) {
    applyBtn.addEventListener('click', function () {
      const targets = getBorderTargets();
      console.log(
        '[border-widget] TODO: застосувати бордер до',
        targets.length,
        'елемент(ів)',
        { mode: targetMode, targets: targets }
      );
    });
  }

  host.appendChild(sectionEl);

  // ініціалізація підвіджетів (віджет у віджеті)
  const linesRoot = sectionEl.querySelector('[data-border-lines-root]');
  if (linesRoot) {
    borderLinesController = initBorderLinesWidget(linesRoot, {
      onSelectionChange(selectionState) {
        borderLinesState = {
          ...borderLinesState,
          sides: normalizeBorderSides00916_(selectionState?.sides)
        };
        // Спільний стан доступний іншим наявним дизайн-контролям.
        window.__ST_BORDER_SELECTED_SIDES_00917__ = {
          ...borderLinesState.sides
        };
        bwLog('[border-widget] sides selection-only →', borderLinesState.sides);
      },
      onChange(newState) {
        borderLinesState = newState;
        bwLog('[border-widget] lines onChange →', newState);
        applyBorderLinesToTargets({ live: false, reason: 'border-lines-control-00915' });
      }
    });
  }

  const radiusRoot = sectionEl.querySelector('[data-border-radius-root]');
  if (radiusRoot) {
    borderRadiusController = initBorderRadiusWidget(radiusRoot, {
      onInteractionStart(meta) {
        beginRadiusEditSession00911_(meta || {});
      },
      onInteractionEnd(meta) {
        endRadiusEditSession00911_(meta || {});
      },
      onChange(newState) {
        borderRadiusState = newState;
        bwLog('[border-widget] radius onChange →', newState);
        const live = newState?.live === true;
        const targets = (live || newState?.commit === true)
          ? getRadiusEditSessionTargets00911_()
          : getBorderTargets();
        applyBorderRadiusToTargets({
          targets,
          live,
          reason: newState?.reason || (live ? 'radius-live-00911' : 'radius-apply-00911'),
        });
      }
    });
  }

      const styleRoot = sectionEl.querySelector('[data-border-style-root]');
    if (styleRoot) {
      borderStyleController = initBorderStyleWidget(styleRoot, {
        onChange(newState) {
          borderStyleState = newState;
          applyBorderStyleToTargets({ reason: 'border-style-control-00915' });
        }
      });
    }






  const shadowsRoot = sectionEl.querySelector('[data-border-shadows-root]');
  if (shadowsRoot) {
    initBorderShadowsWidget(shadowsRoot);
  }

  const colorRoot = sectionEl.querySelector('[data-border-color-root]');
  if (colorRoot) {
    initBorderColorWidget(colorRoot);
  }

  
 // первинне оновлення тексту + синхронізація з поточним виділенням
  updateTargetSummaryText();
  syncBorderLinesFromSelection();
  syncBorderRadiusFromSelection();
  syncBorderStyleFromSelection();
}
