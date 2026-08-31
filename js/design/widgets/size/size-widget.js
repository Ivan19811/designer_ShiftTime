// js/design/widgets/size/size-widget.js
// Віджет "Розміри" — W/H в px, режими Auto/Fill/Hug/Custom, Min/Max (advanced).
// Не конфліктує з padding/margin: батько завжди обмежує, дитина стискається.

import {
  readRectPx,
  getAvailableInnerPx,
  parseValueToPx,
  detectSizeModeFromEl,
  applySizeModeToEl
} from './size-contract.js';

async function ensureCssOnce() {
  if (document.getElementById('st-size-widget-css')) return;
  const style = document.createElement('style');
  style.id = 'st-size-widget-css';
  document.head.appendChild(style);

  try {
    const res = await fetch('./js/design/widgets/size/size-widget.css', { cache: 'no-cache' });
    if (res.ok) {
      style.textContent = await res.text();
      return;
    }
  } catch (e) {
    // ignore
  }

  // Fallback (мінімум)
  style.textContent = `.st-size-warning{margin-top:10px;padding:10px 12px;border-radius:12px;border:1px solid rgba(239,68,68,.35);background:rgba(239,68,68,.08);font-size:13px}`;
}

async function loadHtmlTemplate() {
  const res = await fetch('./js/design/widgets/size/size-widget.html', { cache: 'no-cache' });
  if (!res.ok) throw new Error('template load failed');
  return await res.text();
}

export function initSizeWidget(host, getSelection) {
  if (!host) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.dataset.widget = 'size';
  host.appendChild(sectionEl);

  // Async: CSS + HTML
  (async () => {
    await ensureCssOnce();

    try {
      sectionEl.innerHTML = await loadHtmlTemplate();
    } catch (e) {
      // Якщо з якихось причин fetch не працює — мінімальна вставка
      sectionEl.innerHTML = `<button class="design-section__header" type="button"><div class="design-section__header-title"><span>Розміри</span></div><span class="design-section__chevron">▶</span></button><div class="design-section__body"><div style="opacity:.8;font-size:12px">Не вдалося завантажити шаблон size-widget.html</div></div>`;
      return;
    }

    // Accordion
    const headerBtn = sectionEl.querySelector('.design-section__header');
    headerBtn?.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });

    const ui = {
      curW: sectionEl.querySelector('[data-cur-w]'),
      curH: sectionEl.querySelector('[data-cur-h]'),

      modeWrap: sectionEl.querySelector('[data-size-mode]'),
      customWrap: sectionEl.querySelector('[data-custom-wrap]'),

      inW: sectionEl.querySelector('[data-custom-w]'),
      inH: sectionEl.querySelector('[data-custom-h]'),
      unitW: sectionEl.querySelector('[data-unit-w]'),
      unitH: sectionEl.querySelector('[data-unit-h]'),

      advToggle: sectionEl.querySelector('[data-adv-toggle]'),
      adv: sectionEl.querySelector('[data-adv]'),

      minW: sectionEl.querySelector('[data-min-w]'),
      maxW: sectionEl.querySelector('[data-max-w]'),
      minH: sectionEl.querySelector('[data-min-h]'),
      maxH: sectionEl.querySelector('[data-max-h]'),

      warn: sectionEl.querySelector('[data-warning]'),
    };

    const setWarn = (on) => {
      if (!ui.warn) return;
      ui.warn.hidden = !on;
    };

    const getTargets = () => {
      const sel = getSelection?.();
      if (!sel || !sel.elements || !sel.elements.length) return [];
      const out = [];
      sel.elements.filter(Boolean).forEach((node) => {
        const el = node.nodeType === 1 ? node : null;
        if (!el) return;

        // PNG inner-media у шапці/футері має налаштовуватись окремо від контейнера,
        // якщо користувач вибрав саме його.
        if (el.matches?.('.st-block--png > .st-png__media, .st-png__media')) {
          out.push(el);
          return;
        }

        // Якщо клікнули у внутрішній контент тексту/статті — піднімаємось на .st-block
        // щоб розміри поводились 1:1 як у звичайних блоків.
        const block = el.classList?.contains('st-block') ? el : el.closest?.('.st-block');
        out.push(block || el);
      });

      // unique
      return [...new Set(out)].filter(Boolean);
    };

    const writeUiFromEl = (el) => {
      const clearSizeInputs_ = () => {
        if (ui.inW) ui.inW.value = '';
        if (ui.inH) ui.inH.value = '';
        if (ui.unitW) ui.unitW.value = 'px';
        if (ui.unitH) ui.unitH.value = 'px';
        if (ui.minW) ui.minW.value = '';
        if (ui.maxW) ui.maxW.value = '';
        if (ui.minH) ui.minH.value = '';
        if (ui.maxH) ui.maxH.value = '';
      };

      if (!el) {
        ui.curW.textContent = '—';
        ui.curH.textContent = '—';
        clearSizeInputs_();
        setWarn(false);
        return;
      }

      const r = readRectPx(el);
      ui.curW.textContent = `${r.w}px`;
      ui.curH.textContent = `${r.h}px`;

      const mode = detectSizeModeFromEl(el);
      const radios = ui.modeWrap?.querySelectorAll('input[type="radio"][name="stSizeMode"]') || [];
      radios.forEach(radio => {
        radio.checked = radio.value === mode;
      });

      const isCustom = mode === 'custom';
      if (ui.customWrap) ui.customWrap.style.display = isCustom ? 'block' : 'none';

      const toNum = (v) => {
        const n = parseFloat(String(v || '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      };

      const parseToken_ = (raw) => {
        const s = String(raw || '').trim();
        if (!s || /^(auto|none|normal|unset|initial)$/i.test(s)) return null;
        const m = s.match(/^(-?\d+(?:\.\d+)?)(px|%)$/);
        if (m) return { value: String(Math.round(Number(m[1]) * 100) / 100), unit: m[2] };
        return null;
      };

      const readCssPx_ = (prop) => {
        try {
          const raw = getComputedStyle(el)?.[prop];
          const m = String(raw || '').trim().match(/^(-?\d+(?:\.\d+)?)px$/);
          if (m) return Math.max(0, Math.round(Number(m[1])));
        } catch (_) {}
        return null;
      };

      // 00295: the Size widget must show the real current dimensions of the selected
      // element, not only inline width/height. Prefer explicit values, then saved custom,
      // then computed/rect fallback. This keeps the UI useful after reload/templates/resize.
      const __isIcon = !!(el.classList && el.classList.contains('st-block--icon'));
      const __iconSizeVar = __isIcon ? (el.style.getPropertyValue('--st-icon-size') || '').trim() : '';

      const readSizeForUi_ = (axis) => {
        const styleProp = axis === 'w' ? 'width' : 'height';
        const customKey = axis === 'w' ? 'stCustomW' : 'stCustomH';
        const rectVal = axis === 'w' ? r.w : r.h;

        const iconVar = parseToken_(__iconSizeVar);
        if (__isIcon && iconVar) return iconVar;

        const inline = parseToken_(el.style?.[styleProp]);
        if (inline) return inline;

        const saved = parseToken_(el.dataset?.[customKey]);
        if (saved && mode === 'custom') return saved;

        const computedPx = readCssPx_(styleProp);
        if (computedPx !== null && computedPx > 0) return { value: String(computedPx), unit: 'px' };

        if (Number.isFinite(rectVal) && rectVal > 0) return { value: String(rectVal), unit: 'px' };
        return { value: '', unit: 'px' };
      };

      if (ui.inW && ui.unitW) {
        const val = readSizeForUi_('w');
        ui.inW.value = val.value;
        ui.unitW.value = val.unit || 'px';
      }
      if (ui.inH && ui.unitH) {
        const val = readSizeForUi_('h');
        ui.inH.value = val.value;
        ui.unitH.value = val.unit || 'px';
      }

      const readLimitForUi_ = (styleProp) => {
        const inline = parseToken_(el.style?.[styleProp]);
        if (inline && inline.unit === 'px') return inline.value;
        try {
          const raw = getComputedStyle(el)?.[styleProp];
          if (!raw || /none/i.test(raw)) return '';
          const m = String(raw).trim().match(/^(-?\d+(?:\.\d+)?)px$/);
          if (m) return String(Math.round(Number(m[1])));
        } catch (_) {}
        return '';
      };

      if (ui.minW) ui.minW.value = readLimitForUi_('minWidth');
      if (ui.maxW) ui.maxW.value = readLimitForUi_('maxWidth');
      if (ui.minH) ui.minH.value = readLimitForUi_('minHeight');
      if (ui.maxH) ui.maxH.value = readLimitForUi_('maxHeight');

      setWarn(false);
    };

    const checkConstraintsAndWarn = (targets, payload) => {
      // Warning only for Custom mode.
      if (!targets || !targets.length) return setWarn(false);

      const mode = targets[0].dataset?.stSizeMode || detectSizeModeFromEl(targets[0]);
      if (mode !== 'custom') return setWarn(false);

      // Compare desired px vs available inner px of parent (first target only).
      const el = targets[0];
      const avail = getAvailableInnerPx(el);
      if (!avail) return setWarn(false);

      const desiredW = parseValueToPx(payload.wVal, payload.wUnit, avail.w);
      const desiredH = parseValueToPx(payload.hVal, payload.hUnit, avail.h);

      const actual = readRectPx(el);

      let warn = false;
      if (desiredW !== null && Number.isFinite(desiredW) && desiredW > avail.w + 0.5 && actual.w <= avail.w + 1) warn = true;
      if (desiredH !== null && Number.isFinite(desiredH) && desiredH > avail.h + 0.5 && actual.h <= avail.h + 1) warn = true;

      setWarn(warn);
    };

    const applyModeToTargets = (mode) => {
      const targets = getTargets();
      if (!targets.length) return;

      // Helpers: measure "fit-to-content" width for text blocks, so first Custom
      // does not immediately wrap words into the next line.
      const measureTextFitWidthPx = (blockEl) => {
        try {
          const inner = blockEl?.querySelector?.('.st-text-edit,[contenteditable="true"],.st-article-edit') || null;
          if (!inner) return null;
          const parentAvail = getAvailableInnerPx(blockEl);

          // Add block paddings so the measured content width fits inside the block
          // without forcing a wrap on the very first Custom.
          const bcs = getComputedStyle(blockEl);
          const padL = toNum(bcs.paddingLeft) || 0;
          const padR = toNum(bcs.paddingRight) || 0;

          // Temporarily measure with no wrapping.
          // We also temporarily release block width clamps so scrollWidth is not
          // constrained by the current grid cell size.
          const prevBlock = {
            width: blockEl.style.width,
            maxWidth: blockEl.style.maxWidth,
            minWidth: blockEl.style.minWidth,
          };

          blockEl.style.width = 'auto';
          blockEl.style.maxWidth = 'none';
          blockEl.style.minWidth = '0px';
          const prev = {
            whiteSpace: inner.style.whiteSpace,
            width: inner.style.width,
            display: inner.style.display,
          };

          inner.style.whiteSpace = 'pre';
          inner.style.width = 'fit-content';
          inner.style.display = 'inline-block';

          // scrollWidth gives the natural width of the content.
          // Add a tiny safety gap to avoid rounding causing last word wrap.
          const rawInner = Math.ceil(inner.scrollWidth || inner.getBoundingClientRect().width || 0);
          const raw = Math.ceil(rawInner + padL + padR + 2);

          // Restore.
          inner.style.whiteSpace = prev.whiteSpace;
          inner.style.width = prev.width;
          inner.style.display = prev.display;

          blockEl.style.width = prevBlock.width;
          blockEl.style.maxWidth = prevBlock.maxWidth;
          blockEl.style.minWidth = prevBlock.minWidth;

          if (!raw || raw < 1) return null;
          // Clamp to available parent width to avoid overflowing the cell.
          if (parentAvail && Number.isFinite(parentAvail.w)) return Math.min(raw, Math.floor(parentAvail.w) - 1);
          return raw;
        } catch (e) {
          return null;
        }
      };

      // ✅ Default Custom size for Text blocks
      // If user switches to Custom while inputs are empty, canvas reflow falls back
      // to the global minimum (80px). Text blocks should start from 45px height.
      if (mode === 'custom' && ui.inH && ui.unitH) {
        const el0 = targets[0];
        const prevMode = (el0?.dataset?.stSizeMode || '').trim();
        const isTextBlock = !!(
          el0 && (
            (el0.classList && el0.classList.contains('st-block--text')) ||
            (el0.dataset && el0.dataset.blockKind === 'text')
          )
        );
        const savedW0 = (el0?.dataset?.stCustomW || '').trim();
        const savedH0 = (el0?.dataset?.stCustomH || '').trim();

        // ✅ When returning to Custom from another mode, ALWAYS restore the last
        // saved Custom size (even if the inputs currently show 100%/fit-content
        // from Auto/Fill/Hug).
        const returningToCustom = (prevMode && prevMode !== 'custom');

        const hEmpty = String(ui.inH.value || '').trim() === '';
        // Restore last custom height if exists, otherwise start from 45px.
        if (isTextBlock && (hEmpty || returningToCustom)) {
          const savedH = (el0.dataset?.stCustomH || '').trim();
          const m = savedH.match(/^(-?\d+(?:\.\d+)?)(px|%)$/);
          if (m) { ui.inH.value = m[1]; ui.unitH.value = m[2]; }
          else { ui.inH.value = '45'; ui.unitH.value = 'px'; }
        }

        // ✅ Default/restore Custom width for Text blocks.
        // 1) If user already had a custom size -> restore it.
        // 2) Otherwise, first Custom should use "fit-to-content" width (no wrap),
        //    not a hardcoded number.
        if (ui.inW && ui.unitW) {
          const wEmpty = String(ui.inW.value || '').trim() === '';
          if (isTextBlock && (wEmpty || returningToCustom)) {
            const savedW = (el0.dataset?.stCustomW || '').trim();
            const m = savedW.match(/^(-?\d+(?:\.\d+)?)(px|%)$/);
            if (m) {
              ui.inW.value = m[1];
              ui.unitW.value = m[2];
            } else {
              const fitW = measureTextFitWidthPx(el0);
              if (fitW && fitW > 0) {
                ui.inW.value = String(fitW);
                ui.unitW.value = 'px';
              } else {
                // Fallback (rare): keep empty so contract will not force a width.
                ui.inW.value = '';
                ui.unitW.value = 'px';
              }
            }
          }
        }
      }

      const payload = {
        wVal: ui.inW ? ui.inW.value : '',
        wUnit: ui.unitW ? ui.unitW.value : 'px',
        hVal: ui.inH ? ui.inH.value : '',
        hUnit: ui.unitH ? ui.unitH.value : 'px',
        minW: ui.minW ? ui.minW.value : '',
        maxW: ui.maxW ? ui.maxW.value : '',
        minH: ui.minH ? ui.minH.value : '',
        maxH: ui.maxH ? ui.maxH.value : '',
      };

      targets.forEach(el => {
        // 00278: mark Size Mode changes that came from the actual radio buttons.
        // Header logo/phone/button keep Hug by default during mouse/parent resize;
        // this marker is what allows an explicit radio choice to override that.
        try {
          if (el?.dataset) {
            el.dataset.stSizeModeSource = 'radio';
            el.dataset.stHeader278RadioSizeMode = mode;
          }
        } catch (_) {}
        applySizeModeToEl(el, mode, payload);
      });

      // UI: show/hide custom
      if (ui.customWrap) ui.customWrap.style.display = mode === 'custom' ? 'block' : 'none';

      // After apply, update readout + warn.
      requestAnimationFrame(() => {
        writeUiFromEl(targets[0]);
        checkConstraintsAndWarn(targets, payload);
      });
    };

    const applyCustomPayloadLive = () => {
      const targets = getTargets();
      if (!targets.length) return;

      const mode = targets[0].dataset?.stSizeMode || detectSizeModeFromEl(targets[0]);
      // If user starts editing numeric fields while not in Custom,
      // auto-promote to Custom so values take effect immediately (requested behavior).
      const shouldPromoteToCustom = mode !== 'custom';

      const payload = {
        wVal: ui.inW ? ui.inW.value : '',
        wUnit: ui.unitW ? ui.unitW.value : 'px',
        hVal: ui.inH ? ui.inH.value : '',
        hUnit: ui.unitH ? ui.unitH.value : 'px',
        minW: ui.minW ? ui.minW.value : '',
        maxW: ui.maxW ? ui.maxW.value : '',
        minH: ui.minH ? ui.minH.value : '',
        maxH: ui.maxH ? ui.maxH.value : '',
      };

      targets.forEach(el => applySizeModeToEl(el, 'custom', payload));

      if (shouldPromoteToCustom) {
        // Update radio + panel.
        const radios = ui.modeWrap?.querySelectorAll('input[type="radio"][name="stSizeMode"]') || [];
        radios.forEach(r => { r.checked = r.value === 'custom'; });
        if (ui.customWrap) ui.customWrap.style.display = 'block';
      }

      requestAnimationFrame(() => {
        writeUiFromEl(targets[0]);
        checkConstraintsAndWarn(targets, payload);
      });
    };

    // Events: mode radios
    ui.modeWrap?.addEventListener('change', (e) => {
      const radio = e.target.closest('input[type="radio"][name="stSizeMode"]');
      if (!radio) return;
      applyModeToTargets(radio.value);
    });

    // Events: custom inputs live
    // ✅ UX fix: коли режим НЕ Custom і поле порожнє, а користувач починає
    // змінювати ширину/висоту (стрілками number input або вводом),
    // стартуємо НЕ з 0, а з поточного реального розміру елемента.
    const primeCustomInputsFromRect = (axis /* 'w'|'h' */) => {
      const targets = getTargets();
      if (!targets.length) return;
      const el = targets[0];
      const mode = (el.dataset?.stSizeMode || detectSizeModeFromEl(el) || '').toLowerCase();
      if (mode === 'custom') return;
      const r = readRectPx(el);
      if (axis === 'w' && ui.inW && ui.unitW) {
        if (String(ui.inW.value || '').trim() === '') {
          ui.inW.value = String(Math.max(1, r.w));
          ui.unitW.value = 'px';
        }
      }
      if (axis === 'h' && ui.inH && ui.unitH) {
        if (String(ui.inH.value || '').trim() === '') {
          ui.inH.value = String(Math.max(1, r.h));
          ui.unitH.value = 'px';
        }
      }
    };

    ui.inW?.addEventListener('focus', () => primeCustomInputsFromRect('w'));
    ui.inH?.addEventListener('focus', () => primeCustomInputsFromRect('h'));

    [ui.inW, ui.inH, ui.unitW, ui.unitH, ui.minW, ui.maxW, ui.minH, ui.maxH].forEach(el => {
      el?.addEventListener('input', () => applyCustomPayloadLive());
      el?.addEventListener('change', () => applyCustomPayloadLive());
    });

    // Advanced toggle
    ui.advToggle?.addEventListener('click', () => {
      ui.adv?.classList.toggle('is-open');
      const open = ui.adv?.classList.contains('is-open');
      ui.advToggle.textContent = open ? 'Advanced ▴' : 'Advanced ▾';
    });

    // Selection updates
    const syncFromSelection = () => {
      const targets = getTargets();
      writeUiFromEl(targets[0] || null);
    };

    document.addEventListener('st:selection-changed', syncFromSelection);
    window.addEventListener('resize', () => requestAnimationFrame(syncFromSelection), { passive: true });

    const canvasScroller = document.querySelector('.canvas__scroll');
    if (canvasScroller) {
      canvasScroller.addEventListener('scroll', () => requestAnimationFrame(syncFromSelection), { passive: true });
    }

    // First paint
    syncFromSelection();
  })();
}
