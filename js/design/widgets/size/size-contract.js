// js/design/widgets/size/size-contract.js
// Контракт віджета "Розміри": як ми трактуємо режими та як рахуємо обмеження.

function toNum(v) {
  const s = String(v ?? '').trim().replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function readRectPx(el) {
  const r = el.getBoundingClientRect();
  return {
    w: Math.round(r.width),
    h: Math.round(r.height),
  };
}

export function getAvailableInnerPx(el) {
  const parent = el?.parentElement;
  if (!parent) return null;

  const pr = parent.getBoundingClientRect();
  const cs = getComputedStyle(parent);
  const pl = toNum(cs.paddingLeft) || 0;
  const prt = toNum(cs.paddingRight) || 0;
  const pt = toNum(cs.paddingTop) || 0;
  const pb = toNum(cs.paddingBottom) || 0;

  const w = Math.max(0, pr.width - pl - prt);
  const h = Math.max(0, pr.height - pt - pb);

  return { w, h };
}

export function parseValueToPx(value, unit, availablePx) {
  const n = toNum(value);
  if (n === null) return null;
  if (unit === '%') {
    if (!availablePx || !Number.isFinite(availablePx)) return null;
    return (availablePx * n) / 100;
  }
  return n;
}



function normalizeTextFlowMode_(v) {
  const s = String(v || '').trim().toLowerCase();
  return (s === 'nowrap' || s === 'wrap' || s === 'clip') ? s : '';
}

function defaultTextFlowForSize_(el, ed) {
  try {
    const role = String(el?.dataset?.blockRole || '').toLowerCase();
    if (
      role === 'button' || role === 'phone' || role === 'logo' ||
      el?.classList?.contains('st-block--button') ||
      el?.classList?.contains('st-block--phone') ||
      el?.classList?.contains('st-block--logo') ||
      ed?.classList?.contains('st-button__label') ||
      ed?.classList?.contains('st-phone__text') ||
      ed?.classList?.contains('st-logo__title') ||
      ed?.classList?.contains('st-logo__subtitle')
    ) return 'nowrap';
  } catch {}
  return 'wrap';
}


function measureNoWrapNaturalWidthForSize_(ed) {
  if (!(ed instanceof HTMLElement)) return 0;
  const old = {};
  try {
    ['width','minWidth','maxWidth','whiteSpace','overflow','textOverflow','flex','flexBasis','flexGrow','flexShrink'].forEach((k) => { old[k] = ed.style[k] || ''; });
    ed.style.width = 'max-content';
    ed.style.minWidth = 'max-content';
    ed.style.maxWidth = 'none';
    ed.style.whiteSpace = 'nowrap';
    ed.style.overflow = 'visible';
    ed.style.textOverflow = 'clip';
    ed.style.flex = '0 0 auto';
    ed.style.flexBasis = 'auto';
    ed.style.flexGrow = '0';
    ed.style.flexShrink = '0';
    let w = 0;
    const r = ed.getBoundingClientRect?.();
    if (r && Number.isFinite(r.width)) w = Math.max(w, r.width);
    try {
      const range = document.createRange?.();
      if (range) {
        range.selectNodeContents(ed);
        const rr = range.getBoundingClientRect?.();
        if (rr && Number.isFinite(rr.width)) {
          const cs = getComputedStyle(ed);
          const extra = (parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0)+(parseFloat(cs.borderLeftWidth)||0)+(parseFloat(cs.borderRightWidth)||0);
          w = Math.max(w, rr.width + extra);
        }
        range.detach?.();
      }
    } catch {}
    if (!w) w = ed.scrollWidth || 0;
    return Math.max(5, Math.ceil(w + 2));
  } catch {
    return Math.max(5, Math.ceil(ed.scrollWidth || 0) + 2);
  } finally {
    try { Object.keys(old).forEach((k) => { ed.style[k] = old[k]; }); } catch {}
  }
}

function getTextFlowMinWidthForSize_(el) {
  try {
    if (!(el instanceof HTMLElement)) return 0;
    const isTextBlock = !!(el.classList?.contains('st-block--text') || el.dataset?.blockKind === 'text');
    if (!isTextBlock) return 0;
    const edits = Array.from(el.querySelectorAll(':scope > .st-text-edit, :scope .st-text-edit'))
      .filter((ed) => ed instanceof HTMLElement && !ed.hidden && getComputedStyle(ed).display !== 'none');
    if (!edits.length) return 0;

    const gap = (() => { try { const cs = getComputedStyle(el); return parseFloat(cs.columnGap) || parseFloat(cs.gap) || 0; } catch { return 0; } })();
    const extra = (() => { try { const cs = getComputedStyle(el); return (parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0)+(parseFloat(cs.borderLeftWidth)||0)+(parseFloat(cs.borderRightWidth)||0); } catch { return 0; } })();

    if (el.classList?.contains('st-block--button') || el.classList?.contains('st-block--phone')) {
      let sum = 0;
      let count = 0;
      Array.from(el.children || []).forEach((part) => {
        if (!(part instanceof HTMLElement) || part.hidden || part.classList?.contains('st-resize')) return;
        try { if (getComputedStyle(part).display === 'none') return; } catch {}
        if (part.classList?.contains('st-text-edit')) {
          const flow = normalizeTextFlowMode_(part.dataset?.stTextFlow) || normalizeTextFlowMode_(el.dataset?.stTextFlow) || defaultTextFlowForSize_(el, part);
          if (flow === 'clip') sum += 5;
          else if (flow === 'wrap') sum += 24;
          else sum += measureNoWrapNaturalWidthForSize_(part);
        } else if (part.matches?.('.st-button__iconbtn, .st-phone__iconbtn, button, .st-icon-btn')) {
          sum += Math.max(part.scrollWidth || 0, Math.ceil(part.getBoundingClientRect?.().width || 0));
        } else return;
        count++;
      });
      if (count > 1) sum += gap * (count - 1);
      return Math.max(5, Math.ceil(sum + extra + 2));
    }

    // 00251: logo = icon/mark column + text column, not just text max.
    if (el.classList?.contains('st-block--logo') || String(el.dataset?.blockRole || '').toLowerCase() === 'logo') {
      let markW = 0;
      Array.from(el.children || []).forEach((part) => {
        if (!(part instanceof HTMLElement) || part.hidden || part.classList?.contains('st-resize')) return;
        try { if (getComputedStyle(part).display === 'none') return; } catch {}
        if (!part.matches?.('.st-logo__mark, .st-logo__iconbtn, [data-logo-mark="1"], button.st-logo__iconbtn')) return;
        markW = Math.max(markW, part.scrollWidth || 0, Math.ceil(part.getBoundingClientRect?.().width || 0));
      });
      try {
        const cssMark = parseFloat(getComputedStyle(el).getPropertyValue('--st-logo-mark-w') || '') || parseFloat(el.dataset?.logoMarkWidth || '') || 0;
        markW = Math.max(markW, cssMark);
      } catch {}
      let textColW = 0;
      edits.forEach((ed) => {
        const flow = normalizeTextFlowMode_(ed.dataset?.stTextFlow) || normalizeTextFlowMode_(el.dataset?.stTextFlow) || defaultTextFlowForSize_(el, ed);
        if (flow === 'clip') textColW = Math.max(textColW, 5);
        else if (flow === 'wrap') textColW = Math.max(textColW, 24);
        else textColW = Math.max(textColW, measureNoWrapNaturalWidthForSize_(ed));
      });
      let logoGap = gap;
      try {
        const cssGap = parseFloat(getComputedStyle(el).getPropertyValue('--st-logo-gap') || '') || parseFloat(el.dataset?.logoGap || '') || 0;
        logoGap = Math.max(logoGap, cssGap);
      } catch {}
      const columns = (markW > 0 && textColW > 0) ? (markW + logoGap + textColW) : Math.max(markW, textColW);
      return Math.max(5, Math.ceil(columns + extra + 2));
    }

    let max = 0;
    edits.forEach((ed) => {
      const flow = normalizeTextFlowMode_(ed.dataset?.stTextFlow) || normalizeTextFlowMode_(el.dataset?.stTextFlow) || defaultTextFlowForSize_(el, ed);
      if (flow === 'clip') max = Math.max(max, 5);
      else if (flow === 'wrap') max = Math.max(max, 24);
      else max = Math.max(max, measureNoWrapNaturalWidthForSize_(ed));
    });
    return Math.max(5, Math.ceil(max + extra));
  } catch {}
  return 0;
}

export function detectSizeModeFromEl(el) {
  // Prefer our explicit dataset.
  const m = el?.dataset?.stSizeMode;
  if (m) return m;

  const w = (el?.style?.width || '').trim();
  const h = (el?.style?.height || '').trim();

  if (!w && !h) return 'auto';
  if (w === '100%' && h === '100%') return 'fill';
  if (w === 'fit-content' && h === 'fit-content') return 'hug';
  return 'custom';
}

export function applySizeModeToEl(el, mode, payload) {
  if (!el) return;

  // Special case: Icon blocks should keep their visual size stable.
  // Resizing parent containers/sections/levels must NOT override icon size.
  // We therefore control icon size via CSS variables (see css/site-canvas.css)
  // instead of coupling it to element height.
  const isIconBlock = !!(
    el.classList?.contains('st-block--icon') ||
    el.dataset?.blockKind === 'icon'
  );


  // If we are leaving Custom mode, remove explicit clamps that would block Fill/Hug.
  // This matches UI expectation: switching mode should take effect immediately
  // without requiring an extra Auto click.
  const prevMode = el.dataset?.stSizeMode || null;
  if (prevMode === 'custom' && mode !== 'custom') {
    // ✅ Remember last Custom size so we can restore it later.
    // This prevents losing the user's custom width/height when switching modes.
    // Store only explicit values (px/%/fit-content etc. are stored as strings).
    // IMPORTANT: do not overwrite an already-saved custom size with empty strings
    // (this can happen if another pipeline temporarily cleared inline styles).
    el.dataset.stCustomW = (el.style.width || '').trim() || (el.dataset.stCustomW || '').trim();
    el.dataset.stCustomH = (el.style.height || '').trim() || (el.dataset.stCustomH || '').trim();
    el.dataset.stCustomMinW = (el.style.minWidth || '').trim() || (el.dataset.stCustomMinW || '').trim();
    el.dataset.stCustomMaxW = (el.style.maxWidth || '').trim() || (el.dataset.stCustomMaxW || '').trim();
    el.dataset.stCustomMinH = (el.style.minHeight || '').trim() || (el.dataset.stCustomMinH || '').trim();
    el.dataset.stCustomMaxH = (el.style.maxHeight || '').trim() || (el.dataset.stCustomMaxH || '').trim();

    el.style.width = '';
    el.style.height = '';
    el.style.minWidth = '';
    el.style.maxWidth = '';
    el.style.minHeight = '';
    el.style.maxHeight = '';
    // Icon custom vars should also be cleared when leaving custom, so Fill/Hug can apply cleanly.
    if (isIconBlock) {
      el.style.removeProperty('--st-icon-size');
      el.style.removeProperty('--st-icon-pad-y');
      el.style.removeProperty('--st-icon-pad-x');
    }
  }

  // Always keep this so we can restore UI reliably.
  el.dataset.stSizeMode = mode;
  el.dataset.sizeMode = mode;
  try { el.setAttribute('data-st-size-mode', mode); } catch {}

  if (mode === 'auto') {
    el.style.width = '';
    el.style.height = '';
    el.style.minWidth = '';
    el.style.maxWidth = '';
    el.style.minHeight = '';
    el.style.maxHeight = '';

    // ✅ Requested behavior for Text blocks:
    // In Auto, text block should occupy full available space of its parent cell.
    // (User can still switch to Hug/Fill/Custom explicitly, or start resizing which
    // will move it to Custom mode.)
    const isTextBlock = !!(
      el.classList?.contains('st-block--text') ||
      el.dataset?.blockKind === 'text'
    );
    if (!isIconBlock && isTextBlock) {
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.maxWidth = '100%';
      el.style.maxHeight = '100%';
      el.style.minWidth = '0px';
      el.style.minHeight = '0px';
    }
    // Default grid behavior is stretch; in Auto we keep defaults.
    el.style.justifySelf = '';
    el.style.alignSelf = '';
    if (isIconBlock) {
      // Restore defaults (let CSS decide).
      el.style.removeProperty('--st-icon-size');
      el.style.removeProperty('--st-icon-pad-y');
      el.style.removeProperty('--st-icon-pad-x');
    }
    return;
  }

  if (mode === 'fill') {
    if (isIconBlock) {
      // "Fill" for icons means: keep icon size, do not stretch.
      // We clamp the block itself but keep the svg size constant.
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
      el.style.minWidth = '';
      el.style.minHeight = '';
      return;
    }
    el.style.width = '100%';
    el.style.height = '100%';
    // Safety clamps
    el.style.maxWidth = el.style.maxWidth || '100%';
    el.style.maxHeight = el.style.maxHeight || '100%';
    el.style.minWidth = el.style.minWidth || '0px';
    el.style.minHeight = el.style.minHeight || '0px';
    // In Fill we want to stretch inside the grid cell.
    el.style.justifySelf = 'stretch';
    el.style.alignSelf = 'stretch';
    return;
  }

  if (mode === 'hug') {
    if (isIconBlock) {
      // Hug = natural icon size.
      el.style.width = '';
      el.style.height = '';
      el.style.maxWidth = '';
      el.style.maxHeight = '';
      el.style.minWidth = '';
      el.style.minHeight = '';
      return;
    }
    el.style.width = 'fit-content';
    el.style.height = 'fit-content';
    el.style.maxWidth = el.style.maxWidth || '100%';
    el.style.maxHeight = el.style.maxHeight || '100%';
    // Grid items default to stretch; for Hug we must respect width/height.
    el.style.justifySelf = 'start';
    el.style.alignSelf = 'start';
    return;
  }

  if (mode === 'custom') {
    const {
      wVal,
      wUnit,
      hVal,
      hUnit,
      minW,
      maxW,
      minH,
      maxH
    } = payload || {};

    // ✅ If user returns to Custom and inputs are empty, restore last saved Custom size.
    // Payload is produced by the widget; but resize/other flows may call Custom with empty payload.
    const savedW = (el.dataset?.stCustomW || '').trim();
    const savedH = (el.dataset?.stCustomH || '').trim();
    const savedMinW = (el.dataset?.stCustomMinW || '').trim();
    const savedMaxW = (el.dataset?.stCustomMaxW || '').trim();
    const savedMinH = (el.dataset?.stCustomMinH || '').trim();
    const savedMaxH = (el.dataset?.stCustomMaxH || '').trim();

    const wEmpty = (wVal === '' || wVal === null || wVal === undefined);
    const hEmpty = (hVal === '' || hVal === null || hVal === undefined);

    const useSavedW = wEmpty && !!savedW;
    const useSavedH = hEmpty && !!savedH;

    if (isIconBlock) {
      // For icons we treat custom W/H as the SVG size, BUT we also keep
      // the block's own width/height in sync so the Size widget UI stays functional.
      // This guarantees that resizing parent section/row/container will NOT reset the icon size.
      const hasW = !(wEmpty);
      const hasH = !(hEmpty);

      // 1) Keep the block dimensions explicit (prevents stretch/resets).
      if (useSavedW) el.style.width = savedW;
      else if (hasW) el.style.width = `${wVal}${wUnit || 'px'}`;
      else el.style.width = '';

      if (useSavedH) el.style.height = savedH;
      else if (hasH) el.style.height = `${hVal}${hUnit || 'px'}`;
      else el.style.height = '';

      // 2) Drive the SVG size via CSS variable (prefer width; fallback to height).
      if (useSavedW) el.style.setProperty('--st-icon-size', savedW);
      else if (hasW) el.style.setProperty('--st-icon-size', `${wVal}${wUnit || 'px'}`);
      else if (useSavedH) el.style.setProperty('--st-icon-size', savedH);
      else if (hasH) el.style.setProperty('--st-icon-size', `${hVal}${hUnit || 'px'}`);

      // 3) Tight pill by default in custom.
      el.style.setProperty('--st-icon-pad-y', '0px');
      el.style.setProperty('--st-icon-pad-x', '0px');

    } else {
      if (useSavedW) el.style.width = savedW;
      else if (wEmpty) el.style.width = '';
      else el.style.width = `${wVal}${wUnit || 'px'}`;

      if (useSavedH) el.style.height = savedH;
      else if (hEmpty) el.style.height = '';
      else el.style.height = `${hVal}${hUnit || 'px'}`;
    }

    const minWEmpty = (minW === '' || minW === null || minW === undefined);
    const maxWEmpty = (maxW === '' || maxW === null || maxW === undefined);
    const minHEmpty = (minH === '' || minH === null || minH === undefined);
    const maxHEmpty = (maxH === '' || maxH === null || maxH === undefined);

    el.style.minWidth = (!minWEmpty) ? `${minW}px` : (savedMinW || '');
    try {
      const flowMinW = getTextFlowMinWidthForSize_(el);
      if (flowMinW > 0) {
        const currentMin = toNum(el.style.minWidth);
        const nextMin = Math.max(flowMinW, currentMin || 0);
        el.style.minWidth = `${Math.ceil(nextMin)}px`;
      }
    } catch {}
    el.style.maxWidth = (!maxWEmpty) ? `${maxW}px` : (savedMaxW || '');
    el.style.minHeight = (!minHEmpty) ? `${minH}px` : (savedMinH || '');
    el.style.maxHeight = (!maxHEmpty) ? `${maxH}px` : (savedMaxH || '');

    // ✅ Persist current custom values for future restores.
    el.dataset.stCustomW = (el.style.width || '').trim();
    el.dataset.stCustomH = (el.style.height || '').trim();
    el.dataset.stCustomMinW = (el.style.minWidth || '').trim();
    el.dataset.stCustomMaxW = (el.style.maxWidth || '').trim();
    el.dataset.stCustomMinH = (el.style.minHeight || '').trim();
    el.dataset.stCustomMaxH = (el.style.maxHeight || '').trim();
    // Grid items default to stretch; for Custom we must respect explicit W/H.
    if (!isIconBlock) {
      el.style.justifySelf = 'start';
      el.style.alignSelf = 'start';
    }

    // ✅ Header UX: якщо блок у шапці отримав явну width у Custom,
    // ряд-батько має перейти у FLEX (інакше FR/grid-логіка або normalize
    // можуть затирати width, і користувач бачить "0 ефект").
    // Обмежуємо тільки шапкою, щоб не ламати розкладку Content.
    try {
      const inHeader = !!(el.closest && el.closest('#st-site-header-slot, .st-site-header-slot'));
      if (inHeader) {
        const w = (el.style.width || '').trim();
        const hasPxWidth = /^-?\d+(?:\.\d+)?px$/.test(w);
        const kind = (el.dataset?.blockKind || '').toLowerCase();
        const isLeaf = el.classList?.contains('st-block--text') || el.classList?.contains('st-block--menu') || el.classList?.contains('st-block--icon') || ['text','menu','icon'].includes(kind);
        const row = el.parentElement?.closest?.('.st-row');
        if (hasPxWidth && isLeaf && row) {
          if ((row.dataset.layoutMode || 'fr') !== 'flex') row.dataset.layoutMode = 'flex';
          if (!row.dataset.layoutOrient) row.dataset.layoutOrient = 'row';
          // gridTemplateColumns більше не актуально у flex
          row.style.gridTemplateColumns = '';
        }
      }
    } catch (_) {}
    return;
  }
}
