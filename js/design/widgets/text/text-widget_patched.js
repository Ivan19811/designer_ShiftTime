
// js/design/widgets/text/text-widget.js
// Віджет "Текст" — працює ТІЛЬКИ по виділенню всередині Text-block (kind="text").
// Мінімальний MVP: Колір (палітра + прозорість), Розмір (px), Курсив.

export function initTextWidget(host, getSelection) {
  if (!host) return;

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
            </button>

<button id="st-text-align-left" class="design-pill st-icon-pill st-align-pill" type="button" title="Зліва" aria-pressed="false">
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
          

          <div id="st-text-stroke-pop" class="st-text-pop" hidden>
            <div class="st-text-pop__head">
              <div class="st-text-pop__title">Обводка тексту</div>
              <button id="st-text-stroke-close" class="design-pill st-icon-pill" type="button" title="Закрити">✕</button>
            </div>

            <div class="st-text-pop__row">
              <input id="st-text-stroke-color" type="color" value="#000000" />
              <div class="st-text-stroke-alpha">
                <div class="st-text-hint">Прозорість обводки</div>
                <div class="st-text-alpha-row">
                  <input id="st-text-stroke-alpha" type="range" min="0" max="100" step="1" value="100" />
                  <div id="st-text-stroke-alpha-val" class="st-text-alpha-val">100%</div>
                </div>
              </div>
              <div class="st-text-hint">Вибери текстовий блок і задай обводку</div>
            </div>
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
    </div>
  `;

  const headerBtn = sectionEl.querySelector('.design-section__header');
  headerBtn?.addEventListener('click', () => sectionEl.classList.toggle('is-open'));

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
    italic: sectionEl.querySelector('#st-text-italic'),
    bold: sectionEl.querySelector('#st-text-bold'),
    alignLeft: sectionEl.querySelector('#st-text-align-left'),
    alignCenter: sectionEl.querySelector('#st-text-align-center'),
    alignRight: sectionEl.querySelector('#st-text-align-right'),
    vAlignTop: sectionEl.querySelector('#st-text-valign-top'),
    vAlignCenter: sectionEl.querySelector('#st-text-valign-center'),
    vAlignBottom: sectionEl.querySelector('#st-text-valign-bottom'),
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
    strokeAlpha: sectionEl.querySelector('#st-text-stroke-alpha'),
    strokeAlphaVal: sectionEl.querySelector('#st-text-stroke-alpha-val'),
    strokeMinus: sectionEl.querySelector('#st-text-stroke-w-minus'),
    strokePlus: sectionEl.querySelector('#st-text-stroke-w-plus'),
    strokeSwatch: sectionEl.querySelector('#st-text-stroke-color-btn .st-swatch--stroke'),

  };

  let lastActiveTextEdit = null;


  const LS_CUSTOM_KEY = 'st_text_custom_colors_v1';
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
  let sel = null;
  try {
    if (window.ST_SELECTION && typeof window.ST_SELECTION.get === 'function') {
      sel = window.ST_SELECTION.get();
    }
  } catch {}

  let el = null;
  if (sel) {
    el = sel.el || (Array.isArray(sel.elements) ? sel.elements[0] : null) || null;
  }
  if (!el) {
    el = document.querySelector('.st-block.is-active, .st-section.is-active, .st-block.is-selected, .st-section.is-selected, .st-logo__title.is-active, .st-logo__title.is-selected, .st-logo__subtitle.is-active, .st-logo__subtitle.is-selected');
  }
  if (!el) return null;

  if (el instanceof HTMLElement && el.matches('.st-logo__title, .st-logo__subtitle')) {
    lastActiveTextEdit = el;
    return el;
  }

  // Якщо клікнули прямо по editable — піднімаємось до блока
  const blockEl = el.classList?.contains('st-text-edit')
    ? el.closest('.st-block')
    : (el.closest?.('.st-block') || null);

  if (!blockEl) return lastActiveTextEdit;
  if ((blockEl.dataset.blockKind || '') !== 'text') return lastActiveTextEdit;

  if (blockEl.classList?.contains('st-block--logo')) {
    const targeted = blockEl.querySelector(':scope > .st-text-edit[data-st-text-target="1"], :scope > .st-logo__title[data-st-text-target="1"], :scope > .st-logo__subtitle[data-st-text-target="1"]');
    const edLogo = targeted || blockEl.querySelector(':scope > .st-logo__title, :scope > .st-logo__subtitle');
    if (edLogo) {
      lastActiveTextEdit = edLogo;
      return edLogo;
    }
  }

  const ed = blockEl.querySelector(':scope > .st-text-edit');
  if (ed) lastActiveTextEdit = ed;
  return ed || lastActiveTextEdit || null;
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

  function getCustomColors_() {
    try {
      const raw = localStorage.getItem(LS_CUSTOM_KEY);
      const arr = JSON.parse(raw || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function setCustomColors_(arr) {
    try {
      localStorage.setItem(LS_CUSTOM_KEY, JSON.stringify(Array.isArray(arr) ? arr : []));
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


  function openStrokePop_(on) {
    if (!ui.strokePop) return;
    const val = !!on;
    ui.strokePop.hidden = !val;
    if (val) {
      // закриваємо інші попапи
      openPop_(false);
      openBorderPop_(false);
      if (ui.headingPop) ui.headingPop.hidden = true;

      // підтягуємо поточний колір
      const ed = getActiveTextEditable_();
      try { lastActiveTextEdit = ed || lastActiveTextEdit; } catch {}
      if (ed) {
        const sc = getTextStrokeColor_(ed) || String(ui.strokeColor?.value || '#000000');
        try { if (ui.strokeColor) ui.strokeColor.value = sc; } catch {}
        try {
          const a = getTextStrokeAlpha_(ed);
          if (ui.strokeAlpha) ui.strokeAlpha.value = String(Math.round(a * 100));
          if (ui.strokeAlphaVal) ui.strokeAlphaVal.textContent = String(Math.round(a * 100)) + '%';
        } catch {}

        paintStrokeSwatch_(getTextStrokeWidth_(ed) > 0 ? sc : '');
      }
    }
  }



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
function applyInlineStyle_(styleObj) {
    const ed = getActiveTextEditable_();
    const r = getNativeRangeInside_(ed);
    if (!ed || !r) return;

    // створюємо span, загортаємо вміст range
    const span = document.createElement('span');
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
normalizeSpans_(ed);

    // історія (одноразово)
    if (window.ST_HISTORY && typeof window.ST_HISTORY.capture === 'function') {
      window.ST_HISTORY.capture('text-style');
    }
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


  function applyColorFromUI_() {
    if (!ui.color || !ui.alpha) return;
    const rgb = hexToRgb_(ui.color.value);
    if (!rgb) return;
    const a = alphaTo01_(ui.alpha.value);
    applyInlineStyle_({ color: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})` });
    updateSwatch_();
  }

  // --- UI handlers ---
  ui.colorBtn?.addEventListener('click', () => openPop_());

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

    // Відкриваємо поповер (там є повзунок прозорості)
    const willOpen = !!ui.strokePop?.hidden;
    openStrokePop_(willOpen);

    // Додатково: одразу відкриваємо системний color-picker (надійно, як у браузері)
    // навіть якщо поповер візуально обрізаний/не помітний.
    try { ui.strokeColor?.click?.(); } catch {}
  });
  ui.strokeClose?.addEventListener('click', () => openStrokePop_(false));
  ui.strokePop?.addEventListener('click', (ev) => ev.stopPropagation());

  ui.strokeColor?.addEventListener('input', () => {
    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    if (!ed) return;
    const col = String(ui.strokeColor?.value || '').trim();
    const w = getTextStrokeWidth_(ed) || 1;
    setTextStroke_(ed, w, col, (ui.strokeAlpha ? (parseFloat(ui.strokeAlpha.value||'100')/100) : getTextStrokeAlpha_(ed)));
    paintStrokeSwatch_(col);
    scheduleToolbarSync_();
  });

  ui.strokeMinus?.addEventListener('click', () => bumpTextStrokeWidth_(-1));
  ui.strokePlus?.addEventListener('click', () => bumpTextStrokeWidth_(+1));



  ui.popClose?.addEventListener('click', () => openPop_(false));

  // ВАЖЛИВО: інпут type="color" має застосовувати колір одразу при зміні
  ui.color?.addEventListener('input', () => {
    applyColorFromUI_();
  });

  ui.strokeAlpha?.addEventListener('input', () => {
    const ed = getActiveTextEditable_() || lastActiveTextEdit;
    if (!ed) return;
    const alpha = Math.max(0, Math.min(1, (parseFloat(ui.strokeAlpha.value || '100') / 100)));
    if (ui.strokeAlphaVal) ui.strokeAlphaVal.textContent = Math.round(alpha * 100) + '%';
    const w = getTextStrokeWidth_(ed) || 1;
    const col = getTextStrokeColor_(ed) || String(ui.strokeColor?.value || '#000000');
    setTextStroke_(ed, w, col, alpha);
    scheduleToolbarSync_();
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
    const anyOpen = (!!ui.pop && !ui.pop.hidden) || (!!ui.headingPop && !ui.headingPop.hidden) || (!!ui.borderPop && !ui.borderPop.hidden) || (!!ui.strokePop && !ui.strokePop.hidden);
    if (!anyOpen) return;
    const t = ev.target;
    const node = (t && t.nodeType === 1) ? t : null;
    if (!node) return;
    if (ui.pop?.contains(node) || ui.colorBtn?.contains(node)) return;
    if (ui.borderPop?.contains(node) || ui.borderBtn?.contains(node)) return;
    if (ui.strokePop?.contains(node) || ui.strokeBtn?.contains(node)) return;
    if (ui.headingPop?.contains(node) || ui.headingBtn?.contains(node)) return;
    openPop_(false);
    openBorderPop_(false);
    openStrokePop_(false);
    openHeadingPop_(false);
  }, true);

  ui.alpha?.addEventListener('input', () => {
    if (ui.alphaVal) ui.alphaVal.textContent = String(ui.alpha.value) + '%';
    applyColorFromUI_();
  });

  // палетки
  function onChipClick_(ev) {
    const btn = ev.target?.closest?.('.st-color-chip');
    if (!btn) return;
    const mode = btn.dataset.mode || '';
    const idx = parseInt(btn.dataset.index || '0', 10) || 0;

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

      const existing = slots[idx] || '';
      if (existing) {
        if (ui.color) ui.color.value = existing;
        applyColorFromUI_();
      } else {
        // порожній слот — зберегти поточний колір
        const c = ui.color?.value || '#ffffff';
        slots[idx] = c;
        setCustomColors_(slots);
        rebuildPalettes_();
  scheduleToolbarSync_();
      }
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

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function setSize_(v) {
    const val = clamp(parseInt(v || '16', 10) || 16, 8, 96);
    if (ui.size) ui.size.value = String(val);
    if (ui.sizeNum) ui.sizeNum.value = String(val);
    applyInlineStyle_({ fontSize: val + 'px' });
  }

  ui.size?.addEventListener('input', () => setSize_(ui.size.value));
  ui.sizeNum?.addEventListener('change', () => setSize_(ui.sizeNum.value));

  
ui.italic?.addEventListener('click', () => {
  const ed = getActiveTextEditable_();
  const r = getNativeRangeInside_(ed);
  if (!ed || !r) return;

  const node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement;
  const cs = node ? window.getComputedStyle(node) : null;
  const isItalic = cs ? (cs.fontStyle === 'italic') : false;

  applyInlineStyle_({ fontStyle: isItalic ? 'normal' : 'italic' });
});

ui.bold?.addEventListener('click', () => {
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
      (jc === 'flex-end' || jc === 'end') ? 'bottom' :
      'top';

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

  // --- Selection memory (щоб не губити виділення при кліках по контролах) ---
  // Зберігаємо останній валідний Range всередині активного editable, щоб
  // застосовувати форматування навіть якщо фокус перейшов на інпут/слайдер.
  let lastRange_ = null;
  let lastEditable_ = null;

  
  let toolbarSyncT_ = null;

  function scheduleToolbarSync_() {
    if (toolbarSyncT_) clearTimeout(toolbarSyncT_);
    toolbarSyncT_ = setTimeout(syncToolbarFromSelection_, 0);
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

    // Align buttons (по блоку)
    syncAlignButtons_();
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
