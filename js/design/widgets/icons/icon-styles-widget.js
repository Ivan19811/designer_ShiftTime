// js/design/widgets/icons/icon-styles-widget.js
// "Іконка — Стилі": 100% налаштування саме іконки (не блока) через CSS vars.
// Працює для:
// - CONTENT: .st-block--icon > .st-icon-wrap (persist у siteState)
// - HEADER/FOOTER: .st-block--icon .st-icon-btn (inline vars, збережеться при "Зберегти" у HB)

import { ensureBlock, saveStateNow } from '../../../site-state.js';

function el_(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (typeof html === 'string') e.innerHTML = html;
  return e;
}

function clamp(n, a, b) {
  const x = Number(n);
  if (Number.isNaN(x)) return a;
  return Math.max(a, Math.min(b, x));
}

function readVar(el, name, fallback = '') {
  try {
    const cs = getComputedStyle(el);
    const v = cs.getPropertyValue(name);
    const t = (v || '').trim();
    return t || fallback;
  } catch {
    return fallback;
  }
}

function setVar(el, name, value) {
  try {
    if (value === '' || value == null) {
      el.style.removeProperty(name);
    } else {
      el.style.setProperty(name, String(value));
    }
  } catch {}
}

// Робить поточний SVG "керованим" через currentColor.
// Багато SVG мають захардкожені fill/stroke (або style="fill:#000").
// Не чіпаємо fill="none" та fill="url(...)" (градієнти/патерни).
function ensureSvgColorizable(el) {
  try {
    if (!el) return;
    const svg = el.querySelector('svg');
    if (!svg) return;

    // width/height у svg прибираємо, щоб керувалось CSS-ом
    svg.removeAttribute('width');
    svg.removeAttribute('height');

    // Also normalize color attributes on the <svg> root itself.
    // Some icon packs define fill/stroke only on the root element.
    const svgFill = svg.getAttribute('fill');
    if (svgFill && svgFill !== 'none' && !/^url\(/i.test(svgFill)) svg.setAttribute('fill', 'currentColor');
    const svgStroke = svg.getAttribute('stroke');
    if (svgStroke && svgStroke !== 'none' && !/^url\(/i.test(svgStroke)) svg.setAttribute('stroke', 'currentColor');
    const svgStyle = svg.getAttribute('style');
    if (svgStyle) {
      let css = String(svgStyle);
      css = css.replace(/fill\s*:\s*(?!none)(?!url\()[^;\"]+/ig, 'fill:currentColor');
      css = css.replace(/stroke\s*:\s*(?!none)(?!url\()[^;\"]+/ig, 'stroke:currentColor');
      svg.setAttribute('style', css);
    }

    // Internal <style> blocks can override our attrs (e.g. .cls-1{fill...}).
    // Remove only those styles that mention fill/stroke to avoid breaking non-color styles.
    try {
      svg.querySelectorAll('style').forEach((stEl) => {
        const txt = (stEl.textContent || '').toLowerCase();
        if (txt.includes('fill') || txt.includes('stroke')) stEl.remove();
      });
    } catch(_e) {}

    const nodes = svg.querySelectorAll('*');
    nodes.forEach((n) => {
      if (!(n instanceof Element)) return;

      // attrs
      const f = n.getAttribute('fill');
      if (f && f !== 'none' && !/^url\(/i.test(f)) n.setAttribute('fill', 'currentColor');
      const s = n.getAttribute('stroke');
      if (s && s !== 'none' && !/^url\(/i.test(s)) n.setAttribute('stroke', 'currentColor');

      // inline style
      const st = n.getAttribute('style');
      if (st) {
        let css = String(st);
        css = css.replace(/fill\s*:\s*(?!none)(?!url\()[^;\"]+/ig, 'fill:currentColor');
        css = css.replace(/stroke\s*:\s*(?!none)(?!url\()[^;\"]+/ig, 'stroke:currentColor');
        n.setAttribute('style', css);
      }
    });
  } catch {}
}

function ensurePx(v, defPx) {
  const s = String(v || '').trim();
  if (!s) return defPx;
  if (/^[-\d.]+px$/.test(s)) return s;
  const n = Number(s);
  if (Number.isNaN(n)) return defPx;
  return `${Math.round(n)}px`;
}

function isIconBlock(el) {
  return !!(el && el.classList && (el.classList.contains('st-block--icon') || el.classList.contains('st-block--phone') || el.classList.contains('st-block--button') || (el.classList.contains('st-block--logo') && String(el.dataset.logoSource || '') === 'icon')));
}

function getIconTargetFromSelection(sel) {
  if (!sel || !sel.elements || !sel.elements.length) return null;
  const raw = sel.elements[0];
  if (!(raw instanceof HTMLElement)) return null;
  const icon = isIconBlock(raw) ? raw : raw.closest?.('.st-block--icon, .st-block--phone, .st-block--logo, .st-block--button');
  if (!icon) return null;

  const inHeader = !!icon.closest('#st-site-header-slot');
  const inFooter = !!icon.closest('#st-site-footer-slot');

  return {
    el: icon,
    scope: inHeader ? 'header' : (inFooter ? 'footer' : 'main')
  };
}

function buildSection() {
  const sec = el_('section', 'design-section');
  sec.dataset.section = 'icon-styles';
  sec.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <span class="design-section__header-title">Іконка — Стилі</span>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <div class="design-field" style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="st-iconstyles-pill st-iconstyles-pill--icon is-on">Іконка</span>
          <span class="st-iconstyles-pill st-iconstyles-pill--block">Блок</span>
        </div>
        <div class="st-iconstyles-context" style="opacity:.75; font-size:12px;">—</div>
      </div>

      <div class="design-field" style="margin-top:6px;">
        <div class="design-field__label">Колір іконки</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-color" type="color" value="#ffffff" />
          <input class="st-iconstyles-color-hex" type="text" value="#ffffff" style="flex:1;" />
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Розмір (px)</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-size" type="range" min="8" max="160" value="32" style="flex:1;" />
          <input class="st-iconstyles-size-num" type="number" min="8" max="160" value="32" style="width:84px;" />
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Заливка (фон)</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-bg" type="color" value="#000000" />
          <input class="st-iconstyles-bg-alpha" type="range" min="0" max="100" value="0" style="flex:1;" />
          <span class="st-iconstyles-bg-alpha-val" style="opacity:.75; font-size:12px; width:44px; text-align:right;">0%</span>
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Бордер</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-bw" type="range" min="0" max="12" value="0" style="flex:1;" />
          <input class="st-iconstyles-bw-num" type="number" min="0" max="12" value="0" style="width:84px;" />
          <input class="st-iconstyles-bc" type="color" value="#ffffff" />
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Радіус</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-radius" type="range" min="0" max="64" value="0" style="flex:1;" />
          <input class="st-iconstyles-radius-num" type="number" min="0" max="64" value="0" style="width:84px;" />
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Падінги</div>
        <div class="design-field__row" style="gap:10px;">
          <span style="opacity:.75; font-size:12px; width:24px;">X</span>
          <input class="st-iconstyles-padx" type="range" min="0" max="32" value="0" style="flex:1;" />
          <input class="st-iconstyles-padx-num" type="number" min="0" max="32" value="0" style="width:74px;" />
        </div>
        <div class="design-field__row" style="gap:10px; margin-top:6px;">
          <span style="opacity:.75; font-size:12px; width:24px;">Y</span>
          <input class="st-iconstyles-pady" type="range" min="0" max="32" value="0" style="flex:1;" />
          <input class="st-iconstyles-pady-num" type="number" min="0" max="32" value="0" style="width:74px;" />
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Тінь</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-shadow" type="text" placeholder="наприклад: 0 8px 24px rgba(0,0,0,0.25)" style="flex:1;" />
        </div>
        <div style="margin-top:6px; opacity:.7; font-size:12px;">
          Підказка: можна вставити готовий box-shadow.
        </div>
      </div>

      <div class="design-field" style="margin-top:10px; padding-top:10px; border-top:1px solid rgba(148,163,184,0.16);">
        <div class="design-field__label" style="display:flex; align-items:center; justify-content:space-between;">
          <span>Hover</span>
          <span style="opacity:.7; font-size:12px;">наведення</span>
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Hover: колір іконки</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-h-color" type="color" value="#ffffff" />
          <input class="st-iconstyles-h-color-hex" type="text" value="" style="flex:1;" placeholder="(не задано)" />
          <button class="design-pill st-iconstyles-h-color-clear" type="button">✕</button>
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Hover: фон</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-h-bg" type="color" value="#000000" />
          <input class="st-iconstyles-h-bg-alpha" type="range" min="0" max="100" value="0" style="flex:1;" />
          <span class="st-iconstyles-h-bg-alpha-val" style="opacity:.75; font-size:12px; width:44px; text-align:right;">0%</span>
          <button class="design-pill st-iconstyles-h-bg-clear" type="button">✕</button>
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Hover: бордер</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-h-bc" type="color" value="#ffffff" />
          <input class="st-iconstyles-h-bc-hex" type="text" value="" style="flex:1;" placeholder="(не задано)" />
          <button class="design-pill st-iconstyles-h-bc-clear" type="button">✕</button>
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Hover: тінь</div>
        <div class="design-field__row" style="gap:10px;">
          <input class="st-iconstyles-h-shadow" type="text" value="" placeholder="(не задано)" style="flex:1;" />
          <button class="design-pill st-iconstyles-h-shadow-clear" type="button">✕</button>
        </div>
      </div>

      <div class="design-field" style="margin-top:8px;">
        <button class="design-pill st-iconstyles-reset" type="button" title="Скинути стилі іконки">Скинути стилі іконки</button>
      </div>

      <div class="st-iconstyles-empty" style="margin-top:8px; opacity:.72; font-size:12px; display:none;">
        Вибери іконку на полотні або в шапці.
      </div>
    </div>
  `;
  return sec;
}

function rgbaFromHex(hex, alphaPct) {
  let h = String(hex || '').trim();
  if (!h) return 'transparent';
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  if (h.length !== 6) return 'transparent';
  const r = parseInt(h.slice(0,2), 16) || 0;
  const g = parseInt(h.slice(2,4), 16) || 0;
  const b = parseInt(h.slice(4,6), 16) || 0;
  const a = clamp(alphaPct, 0, 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

function extractAlphaPctFromRgba(rgba) {
  const s = String(rgba || '').trim();
  const m = s.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/i);
  if (!m) return 0;
  const a = Number(m[1]);
  if (Number.isNaN(a)) return 0;
  return clamp(Math.round(a * 100), 0, 100);
}

function toHex6(hex) {
  let h = String(hex || '').trim();
  if (!h) return '#ffffff';
  if (h[0] !== '#') h = `#${h}`;
  if (/^#[0-9a-f]{3}$/i.test(h)) {
    const x = h.slice(1);
    return `#${x[0]}${x[0]}${x[1]}${x[1]}${x[2]}${x[2]}`.toLowerCase();
  }
  if (/^#[0-9a-f]{6}$/i.test(h)) return h.toLowerCase();
  return '#ffffff';
}

export function initIconStylesWidget(host, getSelection) {
  if (!host) return;

  const sec = buildSection();
  host.appendChild(sec);

  const headerBtn = sec.querySelector('.design-section__header');
  const body = sec.querySelector('.design-section__body');
  const ctxEl = sec.querySelector('.st-iconstyles-context');
  const emptyEl = sec.querySelector('.st-iconstyles-empty');

  const q = (s) => sec.querySelector(s);

  const ui = {
    color: q('.st-iconstyles-color'),
    colorHex: q('.st-iconstyles-color-hex'),
    size: q('.st-iconstyles-size'),
    sizeNum: q('.st-iconstyles-size-num'),
    bg: q('.st-iconstyles-bg'),
    bgAlpha: q('.st-iconstyles-bg-alpha'),
    bgAlphaVal: q('.st-iconstyles-bg-alpha-val'),
    bw: q('.st-iconstyles-bw'),
    bwNum: q('.st-iconstyles-bw-num'),
    bc: q('.st-iconstyles-bc'),
    radius: q('.st-iconstyles-radius'),
    radiusNum: q('.st-iconstyles-radius-num'),
    padX: q('.st-iconstyles-padx'),
    padXNum: q('.st-iconstyles-padx-num'),
    padY: q('.st-iconstyles-pady'),
    padYNum: q('.st-iconstyles-pady-num'),
    shadow: q('.st-iconstyles-shadow'),

    hColor: q('.st-iconstyles-h-color'),
    hColorHex: q('.st-iconstyles-h-color-hex'),
    hColorClear: q('.st-iconstyles-h-color-clear'),
    hBg: q('.st-iconstyles-h-bg'),
    hBgAlpha: q('.st-iconstyles-h-bg-alpha'),
    hBgAlphaVal: q('.st-iconstyles-h-bg-alpha-val'),
    hBgClear: q('.st-iconstyles-h-bg-clear'),
    hBc: q('.st-iconstyles-h-bc'),
    hBcHex: q('.st-iconstyles-h-bc-hex'),
    hBcClear: q('.st-iconstyles-h-bc-clear'),
    hShadow: q('.st-iconstyles-h-shadow'),
    hShadowClear: q('.st-iconstyles-h-shadow-clear'),

    reset: q('.st-iconstyles-reset')
  };

  function toggleOpen() {
    const isOpen = sec.classList.toggle('is-open');
    if (headerBtn) headerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (body) body.hidden = !isOpen;
  }
  if (headerBtn) headerBtn.addEventListener('click', (ev) => { ev.preventDefault(); toggleOpen(); });

  function readCurrent(target) {
    if (!target || !target.el) return null;
    const el = target.el;

    // IMPORTANT: in header/footer icons, the actual rendered color is usually set on the inner
    // button (.st-icon-btn) (it may have an inline style="color:..." from insertion).
    // Reading from the block wrapper would show inherited/default, not the real visible value.
    let colorEl = el;
    if (target.scope === 'header' || target.scope === 'footer') {
      const btn = el.querySelector('.st-icon-btn, .st-phone__iconbtn, .st-logo__iconbtn, .st-button__iconbtn');
      if (btn) colorEl = btn;
    }

    const color = (getComputedStyle(colorEl).color || '').trim();
    const size = readVar(el, '--st-icon-size', '32px');
    const padX = readVar(el, '--st-icon-pad-x', target.scope === 'main' ? '0px' : '8px');
    const padY = readVar(el, '--st-icon-pad-y', target.scope === 'main' ? '0px' : '6px');
    const bg = readVar(el, '--st-icon-bg', 'transparent');
    const bw = readVar(el, '--st-icon-bw', '0px');
    const bc = readVar(el, '--st-icon-bc', 'transparent');
    const radius = readVar(el, '--st-icon-radius', '0px');
    const shadow = readVar(el, '--st-icon-shadow', 'none');

    const hColor = readVar(el, '--st-icon-color-h', 'unset');
    const hBg = readVar(el, '--st-icon-bg-h', 'unset');
    const hBc = readVar(el, '--st-icon-bc-h', 'unset');
    const hShadow = readVar(el, '--st-icon-shadow-h', 'unset');

    return { color, size, padX, padY, bg, bw, bc, radius, shadow, hColor, hBg, hBc, hShadow };
  }

  function setEmpty(isEmpty) {
    if (emptyEl) emptyEl.style.display = isEmpty ? 'block' : 'none';
  }

  function syncUIFromTarget() {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    const target = getIconTargetFromSelection(sel);

    if (!target) {
      if (ctxEl) ctxEl.textContent = '—';
      setEmpty(true);
      return;
    }
    setEmpty(false);
    if (ctxEl) ctxEl.textContent = target.scope === 'header' ? 'Шапка' : (target.scope === 'footer' ? 'Футер' : 'Content');

    const s = readCurrent(target);
    if (!s) return;

    // icon color: we only show HEX editor; if it's not hex, keep picker as #fff
    const hexGuess = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.color.trim()) ? toHex6(s.color.trim()) : '#ffffff';
    ui.color.value = hexGuess;
    ui.colorHex.value = hexGuess;

    const sizePx = parseInt(String(s.size).replace('px',''), 10);
    ui.size.value = String(clamp(sizePx || 32, 8, 160));
    ui.sizeNum.value = ui.size.value;

    // BG alpha slider from rgba(...) else 0 for transparent
    ui.bg.value = '#000000';
    ui.bgAlpha.value = String(extractAlphaPctFromRgba(s.bg));
    ui.bgAlphaVal.textContent = `${ui.bgAlpha.value}%`;

    const bwPx = parseInt(String(s.bw).replace('px',''), 10);
    ui.bw.value = String(clamp(bwPx || 0, 0, 12));
    ui.bwNum.value = ui.bw.value;
    ui.bc.value = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.bc.trim()) ? toHex6(s.bc.trim()) : '#ffffff';

    const radPx = parseInt(String(s.radius).replace('px',''), 10);
    ui.radius.value = String(clamp(radPx || 0, 0, 64));
    ui.radiusNum.value = ui.radius.value;

    const padXPx = parseInt(String(s.padX).replace('px',''), 10);
    ui.padX.value = String(clamp(padXPx || 0, 0, 32));
    ui.padXNum.value = ui.padX.value;
    const padYPx = parseInt(String(s.padY).replace('px',''), 10);
    ui.padY.value = String(clamp(padYPx || 0, 0, 32));
    ui.padYNum.value = ui.padY.value;

    ui.shadow.value = (s.shadow && s.shadow !== 'none') ? s.shadow : '';

    // Hover fields
    ui.hColorHex.value = (s.hColor && s.hColor !== 'unset') ? s.hColor : '';
    ui.hBgAlpha.value = String(extractAlphaPctFromRgba(s.hBg));
    ui.hBgAlphaVal.textContent = `${ui.hBgAlpha.value}%`;
    ui.hBcHex.value = (s.hBc && s.hBc !== 'unset') ? s.hBc : '';
    ui.hShadow.value = (s.hShadow && s.hShadow !== 'unset' && s.hShadow !== 'none') ? s.hShadow : '';
  }

  function commitToStateIfContent(target, patch) {
    if (!target || target.scope !== 'main') return;
    const id = target.el?.getAttribute('data-uid') || target.el?.dataset?.uid;
    if (!id) return;
    const b = ensureBlock(String(id));
    if (!b) return;

    if (patch.iconColor != null) {
      b.iconColor = String(patch.iconColor);
    }

    b.iconStyle = (b.iconStyle && typeof b.iconStyle === 'object') ? b.iconStyle : {};
    Object.keys(patch.iconStyle || {}).forEach((k) => {
      const v = patch.iconStyle[k];
      if (v == null || v === '') delete b.iconStyle[k];
      else b.iconStyle[k] = v;
    });

    try { saveStateNow(); } catch {}
  }

  function applyAllToTarget(target, next) {
    if (!target || !target.el) return;
    const el = target.el;

    if (next.iconColor != null) {
      const col = String(next.iconColor);

      // Content icons: color lives on the block wrapper.
      // Header/Footer icons: insertion may set inline color on the inner button, which overrides
      // inheritance. So we set color on BOTH wrapper and button, and also remove legacy inline
      // styles when possible.
      el.style.color = col;

      if (target.scope === 'header' || target.scope === 'footer') {
        const btn = el.querySelector('.st-icon-btn, .st-phone__iconbtn, .st-logo__iconbtn, .st-button__iconbtn');
        if (btn) {
          btn.style.color = col;
          // If button had legacy inline color, keep it consistent but allow inheritance later.
          // Removing the whole style could drop other future inline styles; so only drop color.
          try {
            const s = btn.getAttribute('style') || '';
            if (s && /(^|;)\s*color\s*:/i.test(s)) {
              const cleaned = s
                .split(';')
                .map(x => x.trim())
                .filter(x => x && !/^color\s*:/i.test(x))
                .join('; ');
              if (cleaned) btn.setAttribute('style', cleaned);
              else btn.removeAttribute('style');
              // After stripping, ensure computed color still matches by re-applying via style.color
              btn.style.color = col;
            }
          } catch(_e) {}
          ensureSvgColorizable(btn);
        } else {
          ensureSvgColorizable(el);
        }
      } else {
        // на випадок, якщо svg був вставлений з фіксованими fill/stroke
        ensureSvgColorizable(el);
      }
    }

    const st = next.iconStyle || {};
    if (st.size != null) setVar(el, '--st-icon-size', st.size);
    if (st.padX != null) setVar(el, '--st-icon-pad-x', st.padX);
    if (st.padY != null) setVar(el, '--st-icon-pad-y', st.padY);
    if (st.bg != null) setVar(el, '--st-icon-bg', st.bg);
    if (st.bw != null) setVar(el, '--st-icon-bw', st.bw);
    if (st.bc != null) setVar(el, '--st-icon-bc', st.bc);
    if (st.radius != null) setVar(el, '--st-icon-radius', st.radius);
    if (st.shadow != null) setVar(el, '--st-icon-shadow', st.shadow);

    if (st.hoverColor != null) setVar(el, '--st-icon-color-h', st.hoverColor);
    if (st.hoverBg != null) setVar(el, '--st-icon-bg-h', st.hoverBg);
    if (st.hoverBc != null) setVar(el, '--st-icon-bc-h', st.hoverBc);
    if (st.hoverShadow != null) setVar(el, '--st-icon-shadow-h', st.hoverShadow);

    commitToStateIfContent(target, next);
  }

  function getTargetNow() {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    return getIconTargetFromSelection(sel);
  }

  // --- Bind inputs ---
  function bindPair(rangeEl, numEl, onVal) {
    if (rangeEl && !rangeEl.__b) {
      rangeEl.__b = true;
      rangeEl.addEventListener('input', () => {
        if (numEl) numEl.value = rangeEl.value;
        onVal(rangeEl.value);
      });
    }
    if (numEl && !numEl.__b) {
      numEl.__b = true;
      numEl.addEventListener('input', () => {
        if (rangeEl) rangeEl.value = numEl.value;
        onVal(numEl.value);
      });
    }
  }

  function bindColorPair(colorEl, hexEl, onHex) {
    if (colorEl && !colorEl.__b) {
      colorEl.__b = true;
      colorEl.addEventListener('input', () => {
        const v = toHex6(colorEl.value);
        if (hexEl) hexEl.value = v;
        onHex(v);
      });
    }
    if (hexEl && !hexEl.__b) {
      hexEl.__b = true;
      hexEl.addEventListener('change', () => {
        const v = toHex6(hexEl.value);
        if (hexEl) hexEl.value = v;
        if (colorEl) colorEl.value = v;
        onHex(v);
      });
    }
  }

  bindColorPair(ui.color, ui.colorHex, (hex) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconColor: hex, iconStyle: {} });
  });

  bindPair(ui.size, ui.sizeNum, (v) => {
    const t = getTargetNow();
    if (!t) return;
    const px = ensurePx(v, '32px');
    applyAllToTarget(t, { iconStyle: { size: px } });
  });

  // BG: hex + alpha => rgba
  if (ui.bg && !ui.bg.__b) {
    ui.bg.__b = true;
    ui.bg.addEventListener('input', () => {
      const t = getTargetNow();
      if (!t) return;
      const a = Number(ui.bgAlpha?.value || 0);
      const rgba = rgbaFromHex(ui.bg.value, a);
      applyAllToTarget(t, { iconStyle: { bg: rgba } });
    });
  }
  if (ui.bgAlpha && !ui.bgAlpha.__b) {
    ui.bgAlpha.__b = true;
    ui.bgAlpha.addEventListener('input', () => {
      if (ui.bgAlphaVal) ui.bgAlphaVal.textContent = `${ui.bgAlpha.value}%`;
      const t = getTargetNow();
      if (!t) return;
      const rgba = rgbaFromHex(ui.bg?.value || '#000000', Number(ui.bgAlpha.value));
      applyAllToTarget(t, { iconStyle: { bg: rgba } });
    });
  }

  bindPair(ui.bw, ui.bwNum, (v) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { bw: ensurePx(v, '0px') } });
  });

  if (ui.bc && !ui.bc.__b) {
    ui.bc.__b = true;
    ui.bc.addEventListener('input', () => {
      const t = getTargetNow();
      if (!t) return;
      applyAllToTarget(t, { iconStyle: { bc: toHex6(ui.bc.value) } });
    });
  }

  bindPair(ui.radius, ui.radiusNum, (v) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { radius: ensurePx(v, '0px') } });
  });

  bindPair(ui.padX, ui.padXNum, (v) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { padX: ensurePx(v, '0px') } });
  });
  bindPair(ui.padY, ui.padYNum, (v) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { padY: ensurePx(v, '0px') } });
  });

  if (ui.shadow && !ui.shadow.__b) {
    ui.shadow.__b = true;
    ui.shadow.addEventListener('change', () => {
      const t = getTargetNow();
      if (!t) return;
      const v = String(ui.shadow.value || '').trim();
      applyAllToTarget(t, { iconStyle: { shadow: v || 'none' } });
    });
  }

  // Hover controls
  bindColorPair(ui.hColor, ui.hColorHex, (hex) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { hoverColor: hex } });
  });
  if (ui.hColorClear) ui.hColorClear.addEventListener('click', () => {
    const t = getTargetNow();
    if (!t) return;
    if (ui.hColorHex) ui.hColorHex.value = '';
    applyAllToTarget(t, { iconStyle: { hoverColor: 'unset' } });
  });

  if (ui.hBg && !ui.hBg.__b) {
    ui.hBg.__b = true;
    ui.hBg.addEventListener('input', () => {
      const t = getTargetNow();
      if (!t) return;
      const a = Number(ui.hBgAlpha?.value || 0);
      const rgba = rgbaFromHex(ui.hBg.value, a);
      applyAllToTarget(t, { iconStyle: { hoverBg: rgba } });
    });
  }
  if (ui.hBgAlpha && !ui.hBgAlpha.__b) {
    ui.hBgAlpha.__b = true;
    ui.hBgAlpha.addEventListener('input', () => {
      if (ui.hBgAlphaVal) ui.hBgAlphaVal.textContent = `${ui.hBgAlpha.value}%`;
      const t = getTargetNow();
      if (!t) return;
      const rgba = rgbaFromHex(ui.hBg?.value || '#000000', Number(ui.hBgAlpha.value));
      applyAllToTarget(t, { iconStyle: { hoverBg: rgba } });
    });
  }
  if (ui.hBgClear) ui.hBgClear.addEventListener('click', () => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { hoverBg: 'unset' } });
  });

  bindColorPair(ui.hBc, ui.hBcHex, (hex) => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { hoverBc: hex } });
  });
  if (ui.hBcClear) ui.hBcClear.addEventListener('click', () => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { hoverBc: 'unset' } });
  });

  if (ui.hShadow && !ui.hShadow.__b) {
    ui.hShadow.__b = true;
    ui.hShadow.addEventListener('change', () => {
      const t = getTargetNow();
      if (!t) return;
      const v = String(ui.hShadow.value || '').trim();
      applyAllToTarget(t, { iconStyle: { hoverShadow: v || 'unset' } });
    });
  }
  if (ui.hShadowClear) ui.hShadowClear.addEventListener('click', () => {
    const t = getTargetNow();
    if (!t) return;
    applyAllToTarget(t, { iconStyle: { hoverShadow: 'unset' } });
  });

  if (ui.reset) ui.reset.addEventListener('click', () => {
    const t = getTargetNow();
    if (!t) return;
    // remove vars + reset to safe defaults
    applyAllToTarget(t, {
      iconColor: '#ffffff',
      iconStyle: {
        size: t.scope === 'main' ? '32px' : '22px',
        padX: t.scope === 'main' ? '0px' : '8px',
        padY: t.scope === 'main' ? '0px' : '6px',
        bg: 'transparent',
        bw: '0px',
        bc: 'transparent',
        radius: '0px',
        shadow: 'none',
        hoverColor: 'unset',
        hoverBg: 'unset',
        hoverBc: 'unset',
        hoverShadow: 'unset'
      }
    });
    syncUIFromTarget();
  });

  // Re-sync when selection changes (cheap polling)
  let lastKey = '';
  setInterval(() => {
    try {
      const sel = typeof getSelection === 'function' ? getSelection() : null;
      const t = getIconTargetFromSelection(sel);
      const key = t ? `${t.scope}:${t.el?.getAttribute('data-uid') || t.el?.dataset?.uid || ''}:${t.el?.className || ''}` : 'none';
      if (key !== lastKey) {
        lastKey = key;
        syncUIFromTarget();
      }
    } catch {}
  }, 220);

  // initial
  syncUIFromTarget();
}
