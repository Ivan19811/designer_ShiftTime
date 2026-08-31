// js/design/layout-widget.js
// Віджет "Розмітка" — працює з активними блоками / секціями

import { siteState, ensureRow, saveStateNow } from '../site-state.js';

export function initLayoutWidget(host, getSelection) {
  // ================= DEBUG =================
  // Увімкнути логи: localStorage.setItem('ST_DEBUG_ALIGN','1'); location.reload();
  // Вимкнути:     localStorage.removeItem('ST_DEBUG_ALIGN'); location.reload();
  const DEBUG_ALIGN = (() => {
    try { return localStorage.getItem('ST_DEBUG_ALIGN') === '1'; } catch(e) { return false; }
  })();
  function dlog_(...args){
    if (!DEBUG_ALIGN) return;
    try { console.log('%c[ALIGN]', 'color:#22c55e;font-weight:700', ...args); } catch(e) {}
  }
  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section is-open';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Розмітка</span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>



    
    <div class="design-section__body">
      <!-- Орієнтація -->
      <div class="design-field">
        <div class="design-field__label">Розташування блоків</div>
        <div class="design-field__row">
          <div class="design-pill-group" data-layout-orient>
            <button class="design-pill is-active" data-val="row">Горизонтально</button>
            <button class="design-pill" data-val="column">Вертикально</button>
          </div>
        </div>
      </div>

      <!-- Область налаштування -->
      <div class="design-field">
        <div class="design-field__label">Що налаштовуємо</div>
        <div class="design-radio-row" data-layout-target-scope>
          <label class="design-radio"><input type="radio" name="stLayoutTargetScope" value="block" checked> <span>Блок</span></label>
          <label class="design-radio"><input type="radio" name="stLayoutTargetScope" value="children"> <span>Діти</span></label>
        </div>
        <div class="design-hint" style="margin-top:6px;opacity:.8;font-size:12px;line-height:1.25">
          Блок — налаштовується вибраний елемент. Діти — налаштовуються внутрішні елементи першого рівня вибраного блока/секції/меню.
        </div>
      </div>

      <!-- Вирівнювання -->
      <div class="design-field">
        <div class="design-field__label">Вирівнювання</div>
        <div class="design-field__row">
          <div class="design-pill-stack" style="display:flex;flex-direction:column;gap:8px;width:100%;">
            <!-- Горизонталь: left/center/right (justify-content або justify-items) -->
            <div class="design-pill-group" data-layout-justify>
              <button class="design-pill is-icon is-active" type="button" data-val="flex-start" aria-label="Вирівняти зліва" title="Зліва">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="14" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              <button class="design-pill is-icon" type="button" data-val="center" aria-label="Вирівняти по центру" title="По центру">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              <button class="design-pill is-icon" type="button" data-val="flex-end" aria-label="Вирівняти справа" title="Справа">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="10" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Вертикаль: top/center/bottom (align-items або align-items у grid) -->
            <div class="design-pill-group" data-layout-align-y>
              <button class="design-pill is-icon is-active" type="button" data-val="flex-start" aria-label="Вирівняти зверху" title="Зверху">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="6" y1="4" x2="6" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="14" />
                  <line x1="18" y1="4" x2="18" y2="20" />
                </svg>
              </button>
              <button class="design-pill is-icon" type="button" data-val="center" aria-label="Вирівняти по центру (вертикально)" title="По центру">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="6" y1="4" x2="6" y2="20" />
                  <line x1="12" y1="7" x2="12" y2="17" />
                  <line x1="18" y1="4" x2="18" y2="20" />
                </svg>
              </button>
              <button class="design-pill is-icon" type="button" data-val="flex-end" aria-label="Вирівняти знизу" title="Знизу">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="6" y1="4" x2="6" y2="20" />
                  <line x1="12" y1="10" x2="12" y2="20" />
                  <line x1="18" y1="4" x2="18" y2="20" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Довільне розміщення -->
      <div class="design-field">
        <div class="design-field__label">Довільне розміщення</div>
        <div class="design-field__row">
          <button type="button" class="design-pill" data-layout-free>
            Довільно
          </button>
        </div>
        <div class="design-hint" style="margin-top:6px;opacity:.8;font-size:12px;line-height:1.2">
          Увімкніть, щоб перетягувати внутрішні блоки мишкою у будь-яке місце всередині ROW.
        </div>
      </div>

      <!-- Режим розміщення -->
      <div class="design-field">
        <div class="design-field__label">Режим розміщення (для ROW/контейнера)</div>
        <div class="design-field__row" data-layout-mode-group>
          <label class="design-radio"><input type="radio" name="stLayoutMode" value="fr" checked> FR</label>
          <label class="design-radio"><input type="radio" name="stLayoutMode" value="flex"> FLEX</label>
          <label class="design-radio"><input type="radio" name="stLayoutMode" value="grid"> GRID</label>
        </div>
        <div class="design-hint" style="margin-top:6px;opacity:.8;font-size:12px;line-height:1.2">
          FR — resize ширин (fr) + gap. FLEX — потік. GRID — сітка (наприклад 3×3).
        </div>
      </div>

      <!-- FR вага (для BLOCK у FR-рядку) -->
      <div class="design-field" data-fr-weight-wrap style="display:none;">
        <div class="design-field__label">FR вага (для цього блока)</div>
        <div class="design-field__row">
          <input type="number" min="0.01" step="0.01" class="design-number" placeholder="Різні" data-fr-weight style="width:120px;max-width:100%;">
        </div>
        <div class="design-hint" style="margin-top:6px;opacity:.8;font-size:12px;line-height:1.2">
          Працює лише коли батьківський ROW у режимі FR. Значення — відносна вага (2/2/1/5 = 20/20/10/50).
        </div>
      </div>

      <!-- GRID: колонки -->
      <div class="design-field" data-grid-cols-wrap>
        <div class="design-field__label">GRID: кількість колонок</div>
        <div class="design-field__row">
          <input type="number" min="1" max="12" step="1" value="3"
                 class="design-number" data-grid-cols>
        </div>
      </div>

      <!-- Відстань між блоками (X/Y) -->
      <div class="design-field">
        <div class="design-field__label">Відстань між блоками X (px)</div>
        <div class="design-field__row">
          <input type="range" min="0" max="64" step="1" value="16"
                 class="design-slider" data-gap-x>
          <input type="number" min="0" max="64" step="1" value="16"
                 class="design-number" data-gap-x-input>
        </div>
      </div>

      <div class="design-field">
        <div class="design-field__label">Відстань між блоками Y (px)</div>
        <div class="design-field__row">
          <input type="range" min="0" max="64" step="1" value="16"
                 class="design-slider" data-gap-y>
          <input type="number" min="0" max="64" step="1" value="16"
                 class="design-number" data-gap-y-input>
        </div>
      </div>

      <!-- Зовнішні відступи --><!-- Зовнішні відступи -->
      <div class="design-field">
        <div class="design-field__label">Відступи зовнішні (margin, px)</div>
        <div class="design-quad-grid design-quad-grid--labeled" data-layout-margin>
          <div class="design-quad-cell"><span>Верх</span><input type="number" min="-200" max="1000" step="1" class="design-number" placeholder="0" data-side="t" title="Margin top: можна задати від -200px"></div>
          <div class="design-quad-cell"><span>Право</span><input type="number" min="-200" max="1000" step="1" class="design-number" placeholder="0" data-side="r" title="Margin right: можна задати від -200px"></div>
          <div class="design-quad-cell"><span>Низ</span><input type="number" min="-200" max="1000" step="1" class="design-number" placeholder="0" data-side="b" title="Margin bottom: можна задати від -200px"></div>
          <div class="design-quad-cell"><span>Ліво</span><input type="number" min="-200" max="1000" step="1" class="design-number" placeholder="0" data-side="l" title="Margin left: можна задати від -200px"></div>
        </div>
      </div>

      <!-- Внутрішні відступи -->
      <div class="design-field">
        <div class="design-field__label">Відступи внутрішні (padding, px)</div>
        <div class="design-quad-grid design-quad-grid--labeled" data-layout-padding>
          <div class="design-quad-cell"><span>Верх</span><input type="number" min="0" max="1000" step="1" class="design-number" placeholder="0" data-side="t" title="Padding top: CSS не підтримує відʼємний padding"></div>
          <div class="design-quad-cell"><span>Право</span><input type="number" min="0" max="1000" step="1" class="design-number" placeholder="0" data-side="r" title="Padding right: CSS не підтримує відʼємний padding"></div>
          <div class="design-quad-cell"><span>Низ</span><input type="number" min="0" max="1000" step="1" class="design-number" placeholder="0" data-side="b" title="Padding bottom: CSS не підтримує відʼємний padding"></div>
          <div class="design-quad-cell"><span>Ліво</span><input type="number" min="0" max="1000" step="1" class="design-number" placeholder="0" data-side="l" title="Padding left: CSS не підтримує відʼємний padding"></div>
        </div>
      </div>

      <!-- Підказки відступів на canvas -->
      <div class="design-field">
        <div class="design-field__label">Показ відступів (підказки)</div>

        <label class="design-check">
          <input type="checkbox" data-guides-padding>
          <span>Показувати внутрішні (padding)</span>
        </label>

        <label class="design-check">
          <input type="checkbox" data-guides-margin>
          <span>Показувати зовнішні (margin)</span>
        </label>

        <div class="design-field__label" style="margin-top:10px;">Контраст ліній</div>
        <div class="design-radio-row" data-guides-contrast>
          <label class="design-radio">
            <input type="radio" name="stGuidesContrast" value="color" checked>
            <span>Кольорові</span>
          </label>
          <label class="design-radio">
            <input type="radio" name="stGuidesContrast" value="white">
            <span>Усі білі</span>
          </label>
          <label class="design-radio">
            <input type="radio" name="stGuidesContrast" value="black">
            <span>Усі чорні</span>
          </label>
        </div>

        <div class="design-field__hint" style="margin-top:8px;">
          Внутрішні лінії — жовті, зовнішні — сині. У режимах «усі білі/чорні» колір вирівнюється.
        </div>
      </div>

    </div>
`;

  host.appendChild(sectionEl);

  // ✅ Керування акордеоном секцій робить panel-design.js (одне місце без конфліктів).

  // --------- ЛОГІКА ЗАСТОСУВАННЯ ДО ВИБОРУ ---------

  function getLayoutTargetMode_() {
    const checked = sectionEl.querySelector('input[type="radio"][name="stLayoutTargetScope"]:checked');
    const mode = checked && checked.value === 'children' ? 'children' : 'block';
    try { sectionEl.dataset.stLayoutTargetScope00802 = mode; } catch (_) {}
    return mode;
  }

  function getRawSelectionElements_() {
    const sel = (typeof getSelection === 'function') ? getSelection() : null;
    if (!sel) return [];
    if (Array.isArray(sel.elements) && sel.elements.length) return sel.elements.filter(Boolean);
    if (sel.el) return [sel.el].filter(Boolean);
    if (sel instanceof HTMLElement) return [sel];
    return [];
  }

  function isLayoutSelectable_(el) {
    return !!(el && el.classList && (
      el.classList.contains('st-block') ||
      el.classList.contains('st-section') ||
      el.classList.contains('st-row')
    ));
  }

  function normalizeLayoutSelectable_(el) {
    if (!el || !el.closest) return el || null;
    // Пункти меню не є окремим layout-блоком для інспектора.
    // Якщо selection потрапив у пункт меню — працюємо з кореневим блоком меню.
    const menuItem = el.matches?.('[data-st-menu-item="1"], .st-block--menu-item')
      ? el
      : el.closest?.('[data-st-menu-item="1"], .st-block--menu-item');
    if (menuItem) {
      const menuBlock = menuItem.closest?.('.st-block--menu, [data-st-menu="1"]');
      if (menuBlock) return menuBlock;
    }
    return el.closest?.('.st-row, .st-block, .st-section') || el;
  }

  // [00450] Header/Footer builders can leave many stale .is-selected classes in
  // the DOM. Layout controls must follow the real active component, otherwise
  // footer spacing sliders may accidentally edit/persist the header.
  // [00451] The previous fix still preferred Header whenever stale Header active
  // classes existed.  Footer edits (padding/margin/gap) were therefore saved to
  // scope=header.  We now remember the user's real component from pointer/selection
  // events and resolve active targets from that component first.
  const ACTIVE_COMPONENT_SEL_00451 = '.st-row.is-active, .st-block.is-active, .st-section.is-active, .st-row.hb-dom-active, .st-block.hb-dom-active, .st-section.hb-dom-active';
  const SELECTED_COMPONENT_SEL_00451 = '.st-row.is-selected, .st-block.is-selected, .st-section.is-selected, .st-row.hb-dom-selected, .st-block.hb-dom-selected, .st-section.hb-dom-selected';

  function componentScopeOfEl00451_(el) {
    if (!el || !el.closest) return '';
    if (el.closest('#st-site-footer-slot, .st-site-footer-slot')) return 'footer';
    if (el.closest('#st-site-header-slot, .st-site-header-slot')) return 'header';
    if (el.closest('#st-site-main-slot, .st-site-main-slot')) return 'main';
    if (el.closest('#site-root')) return 'canvas';
    return '';
  }

  function rememberLayoutComponentScope00451_(scope) {
    if (!scope || !/^(header|footer|main)$/.test(String(scope))) return;
    try { window.__ST_LAYOUT_ACTIVE_SCOPE_00451 = String(scope); } catch (_) {}
  }

  function installLayoutScopeWatcher00451_() {
    try {
      if (window.__ST_LAYOUT_SCOPE_WATCHER_00451) return;
      window.__ST_LAYOUT_SCOPE_WATCHER_00451 = true;
      const markFromTarget = (target) => {
        const scope = componentScopeOfEl00451_(target);
        if (scope) rememberLayoutComponentScope00451_(scope);
        // [00558][HF active target sync]
        // У Design-панелі footer/header можуть мати застарілий active з іншої області.
        // Клік по реальному елементу футера/шапки має одразу оновити не тільки scope,
        // а й сам active element для Layout-віджета. Інакше кнопки Left/Center/Right
        // продовжують працювати по старій шапці, хоча користувач уже вибрав футер.
        try {
          if (!scope) return;
          const selectable = normalizeLayoutSelectable_(target);
          if (selectable && isLayoutSelectable_(selectable) && componentScopeOfEl00451_(selectable) === scope) {
            publishLayoutActive00453_(selectable, scope);
          }
        } catch (_) {}
      };
      document.addEventListener('pointerdown', (ev) => markFromTarget(ev.target), true);
      document.addEventListener('click', (ev) => markFromTarget(ev.target), true);
      document.addEventListener('st:selection-changed', (ev) => {
        try {
          const d = ev.detail || {};

          // [00452][00559] SiteCanvas/Header/Footer builders often emit a singular
          // `element`/`el` plus a semantic type (`footer-inner`, `footer`).
          // 00558 remembered the footer scope, but returned before publishing the
          // actual active footer element. Result: Design align buttons could keep
          // resolving a stale selected row/section, so footer containers did not
          // visibly move. 00559 always publishes the concrete active node when it
          // is present in the event payload.
          let semanticScope00559 = '';
          if (String(d.type || '').startsWith('footer') || d.footerSlot) semanticScope00559 = 'footer';
          else if (String(d.type || '').startsWith('header') || d.headerSlot) semanticScope00559 = 'header';

          const candidates = [];
          if (d.element) candidates.push(d.element);
          if (d.el) candidates.push(d.el);
          if (Array.isArray(d.elements)) candidates.push(...d.elements);

          if (semanticScope00559) {
            rememberLayoutComponentScope00451_(semanticScope00559);
            for (const el of candidates) {
              const selectable = normalizeLayoutSelectable_(el);
              const scope = componentScopeOfEl00451_(selectable);
              if (selectable && isLayoutSelectable_(selectable) && scope === semanticScope00559) {
                publishLayoutActive00453_(selectable, semanticScope00559);
                return;
              }
            }
            return;
          }

          for (const el of candidates) {
            const selectable = normalizeLayoutSelectable_(el);
            const scope = componentScopeOfEl00451_(selectable);
            if (scope) {
              rememberLayoutComponentScope00451_(scope);
              if (selectable && isLayoutSelectable_(selectable)) publishLayoutActive00453_(selectable, scope);
              return;
            }
          }
        } catch (_) {}
      });
    } catch (_) {}
  }
  installLayoutScopeWatcher00451_();

  function preferredLayoutScope00451_() {
    try {
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
      const forcedScope = componentScopeOfEl00451_(forced);
      if (/^(header|footer|main)$/.test(forcedScope)) return forcedScope;
    } catch (_) {}
    try {
      if (document.body.classList.contains('st-footer-builder-on')) return 'footer';
      if (document.body.classList.contains('st-header-builder-on')) return 'header';
    } catch (_) {}
    try {
      const s = String(window.__ST_DESIGN_ACTIVE_SCOPE_00453 || window.__ST_LAYOUT_ACTIVE_SCOPE_00451 || '');
      if (/^(header|footer|main)$/.test(s)) return s;
    } catch (_) {}
    return '';
  }

  function findComponentActiveInRoot00451_(root) {
    if (!root || !root.querySelectorAll) return null;

    // [00559] Header/Footer builders may leave several selected/active classes
    // in the same component. querySelector() returned the first node in DOM order
    // (often section/row), so Design alignment did not affect the real footer
    // container the user had clicked. Prefer the deepest active block first, then
    // rows/sections, then selected nodes.
    const depth00559 = (el) => {
      let d = 0;
      try { let n = el; while (n && n !== document.body) { d++; n = n.parentElement; } } catch (_) {}
      return d;
    };
    const pick00559 = (selector) => {
      const list = Array.from(root.querySelectorAll?.(selector) || [])
        .map(normalizeLayoutSelectable_)
        .filter(el => el instanceof HTMLElement && isLayoutSelectable_(el) && componentScopeOfEl00451_(el));
      if (!list.length) return null;
      list.sort((a, b) => depth00559(b) - depth00559(a));
      return list[0];
    };

    return pick00559('.st-block.is-active, .st-block.hb-dom-active')
      || pick00559('.st-row.is-active, .st-row.hb-dom-active')
      || pick00559('.st-section.is-active, .st-section.hb-dom-active')
      || pick00559('.st-block.is-selected, .st-block.hb-dom-selected')
      || pick00559('.st-row.is-selected, .st-row.hb-dom-selected')
      || pick00559('.st-section.is-selected, .st-section.hb-dom-selected')
      || null;
  }

  function filterElementsByScope00451_(els, scope) {
    if (!scope || !/^(header|footer|main)$/.test(String(scope))) return Array.from(els || []);
    return Array.from(els || []).filter((el) => componentScopeOfEl00451_(el) === scope);
  }


  function queryScopedActive00453_(kind) {
    const cls = kind === 'row' ? 'st-row' : (kind === 'section' ? 'st-section' : 'st-block');
    const sel = `.${cls}.is-active, .${cls}.hb-dom-active, .${cls}.is-selected, .${cls}.hb-dom-selected`;
    try {
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
      if (forced instanceof HTMLElement && forced.isConnected && forced.classList?.contains(cls)) return normalizeLayoutSelectable_(forced);
    } catch (_) {}
    for (const root of getBuilderPriorityRoots_()) {
      try {
        const el = root?.querySelector?.(sel);
        if (el) return normalizeLayoutSelectable_(el);
      } catch (_) {}
    }
    return null;
  }

  function publishLayoutActive00453_(el, scope) {
    try {
      if (!(el instanceof HTMLElement) || !el.isConnected) return;
      const s = scope || componentScopeOfEl00451_(el);
      if (!s) return;
      window.__ST_LAYOUT_ACTIVE_SCOPE_00451 = s;
      window.__ST_DESIGN_ACTIVE_SCOPE_00453 = s;
      window.__ST_LAYOUT_ACTIVE_EL_00453 = el;
      window.__ST_DESIGN_ACTIVE_EL_00453 = el;
    } catch (_) {}
  }

  function getBuilderPriorityRoots_() {
    const header = document.getElementById('st-site-header-slot');
    const footer = document.getElementById('st-site-footer-slot');
    const canvasRoot = document.getElementById('site-root');
    const preferred = preferredLayoutScope00451_();
    const roots = [];
    const push = (r) => { if (r && !roots.includes(r)) roots.push(r); };
    if (preferred === 'footer') { push(footer); push(header); }
    else if (preferred === 'header') { push(header); push(footer); }
    else if (preferred === 'main') { push(canvasRoot); }
    else if (preferred === 'canvas') { push(canvasRoot); push(footer); push(header); }
    else { push(header); push(footer); }
    push(canvasRoot);
    roots.push(document);
    return roots.filter(Boolean);
  }

  function getComponentActiveElement00450_() {
    const preferred = preferredLayoutScope00451_();

    // [00453][00558] Highest-trust active target from Header/Footer Builder or
    // ST_SELECTION.emit(), але тільки якщо він НЕ суперечить поточному scope.
    // До 00558 застарілий forced header міг перемагати footer-click, тому кнопки
    // Left/Center/Right у футері фактично редагували header.
    try {
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
      if (forced instanceof HTMLElement && forced.isConnected) {
        const forcedScope = componentScopeOfEl00451_(forced);
        if (forcedScope && (!preferred || forcedScope === preferred)) return normalizeLayoutSelectable_(forced);
        if (forcedScope && preferred && forcedScope !== preferred) {
          const preferredRoot = preferred === 'footer'
            ? document.getElementById('st-site-footer-slot')
            : (preferred === 'header' ? document.getElementById('st-site-header-slot') : document.getElementById('site-root'));
          const preferredActive = findComponentActiveInRoot00451_(preferredRoot);
          if (!preferredActive) return normalizeLayoutSelectable_(forced);
        }
      }
    } catch (_) {}
    if (preferred === 'footer') {
      const active = findComponentActiveInRoot00451_(document.getElementById('st-site-footer-slot'));
      if (active) return active;
    }
    if (preferred === 'header') {
      const active = findComponentActiveInRoot00451_(document.getElementById('st-site-header-slot'));
      if (active) return active;
    }
    if (preferred === 'canvas') {
      const active = findComponentActiveInRoot00451_(document.getElementById('site-root'));
      if (active) return active;
    }
    for (const root of getBuilderPriorityRoots_()) {
      const active = findComponentActiveInRoot00451_(root);
      if (active) return active;
    }
    return null;
  }

  function getActiveLayoutElement_() {
    // Ключовий фікс 00224:
    // у header після кількох кліків у DOM інколи лишались кілька .is-selected
    // (наприклад секція + контейнер). getSelection() повертав їх у DOM-порядку,
    // і «Розмітка» випадково редагувала секцію замість активного контейнера.
    // Тому для одноелементних дій джерело правди — саме .is-active.
    const builderActive00450 = getComponentActiveElement00450_();
    if (builderActive00450 && componentScopeOfEl00451_(builderActive00450)) {
      publishLayoutActive00453_(builderActive00450);
      return builderActive00450;
    }

    const raw = getRawSelectionElements_().map(normalizeLayoutSelectable_).filter(Boolean);
    const activeFromRaw = raw.find(el => el?.classList?.contains('is-active'));
    if (activeFromRaw) return activeFromRaw;

    const roots = getBuilderPriorityRoots_();

    for (const root of roots) {
      const active = root.querySelector?.('.st-row.is-active, .st-block.is-active, .st-section.is-active');
      if (active) return normalizeLayoutSelectable_(active);
    }

    // Якщо active немає — беремо перший нормалізований selection.
    return raw.find(isLayoutSelectable_) || null;
  }

  function getMenuRootList_(menuBlock) {
    if (!menuBlock || !menuBlock.querySelector) return null;
    return menuBlock.querySelector(':scope .st-menu--big > .st-menu__list')
      || menuBlock.querySelector(':scope .st-menu--burger > .st-menu__panel > .st-menu__list')
      || menuBlock.querySelector(':scope .st-menu > .st-menu__list')
      || menuBlock.querySelector(':scope .st-menu__list[data-menu-list-depth="1"]')
      || menuBlock.querySelector(':scope .st-menu__list');
  }




  function getLayoutFirstLevelChildren_() {
    // [00451] Do not read stale selection from Header while the user is editing
    // Footer.  Children scope must be based on the same active component that
    // the gap/padding/margin controls use.
    const active = getActiveLayoutElement_();
    const raw = active ? [active] : getRawSelectionElements_();
    const out = [];
    raw.forEach(el => {
      if (!el || !el.closest) return;
      const menuBlock = el.closest('.st-block--menu');
      if (menuBlock) {
        const list = getMenuRootList_(menuBlock);
        if (list) out.push(...Array.from(list.children).filter(ch => ch instanceof HTMLElement));
        return;
      }
      const base = el.closest('.st-block, .st-section, .st-row') || el;
      if (!base || !base.querySelectorAll) return;
      if (base.classList?.contains('st-row')) {
        out.push(...Array.from(base.querySelectorAll(':scope > .st-block')));
        return;
      }
      const rows = Array.from(base.querySelectorAll(':scope > .st-row'));
      if (rows.length) {
        rows.forEach(row => out.push(...Array.from(row.querySelectorAll(':scope > .st-block'))));
        return;
      }
      out.push(...Array.from(base.querySelectorAll(':scope > .st-block')));
    });
    return Array.from(new Set(out.filter(Boolean)));
  }

  function getTargetRowsAndBlocks() {
    const sel = getSelection();
    const componentActive00450 = getComponentActiveElement00450_();
    const componentActiveInBuilder00450 = !!(componentActive00450 && componentScopeOfEl00451_(componentActive00450));
    if ((!sel || !sel.elements?.length) && !componentActiveInBuilder00450) return { rows: [], blocks: [] };

    // ✅ Нормалізація для Header/Footer:
    // selection.type може бути 'section' | 'block' | 'header-inner' | 'footer-inner'
    // У випадку header/footer ми приводимо клік до найближчого .st-block або .st-section
    const sourceElements00450 = componentActiveInBuilder00450 ? [componentActive00450] : (sel.elements || []);
    const els = sourceElements00450
      .map(el => {
        if (!el) return null;
        if (el.closest) {
          // ✅ MENU LAYOUT CANONICAL TARGET:
          // Якщо клік/selection знаходиться всередині меню, для віджета «Розмітка»
          // джерелом правди має бути зовнішній .st-block--menu, а не внутрішній
          // пункт .st-menu__link.st-block. Інакше після mouseup selection міг
          // перейти на пункт меню, стандартний gap втрачав ціль і меню відскакувало назад.
          const menuBlock = el.closest('.st-block--menu');
          if (menuBlock) return menuBlock;
          // 00454: keep a selected Footer/Header level (.st-row) as the real
          // layout host. The previous normalization could promote it to parent
          // section/block, so Gap X on the selected level looked inactive.
          if (el.classList?.contains('st-row')) return el;
          return el.closest('.st-block, .st-section, .st-row') || el;
        }
        return el;
      })
      .filter(Boolean);

    // 0) Рівні / ROW: працюємо саме з вибраним рівнем як layout-host.
    const directRows00454 = els.filter(el => el.classList?.contains('st-row'));
    if (directRows00454.length) {
      return { rows: Array.from(new Set(directRows00454)), blocks: [] };
    }

    // [00710] Selection can be temporarily null right after Content template apply / footer reflow.
    // Do not crash layout-widget on sel.type in that transient state.
    const safeSelType00710 = String(sel?.type || '');

    // 1) Секції: працюємо з їх ROW (прямий :scope > .st-row)
    const sections = els.filter(el => el.classList?.contains('st-section'));
    if (safeSelType00710 === 'section' || sections.length) {
      const rows = sections
        .map(sec => sec.querySelector(':scope > .st-row'))
        .filter(Boolean);
      return { rows, blocks: [] };
    }

    // 2) Блоки (в т.ч. контейнери/іконки в header/footer)
    //    - якщо є внутрішній :scope > .st-row — працюємо з ним
    //    - інакше (як у Header/Footer: іконки додаються напряму в контейнер .st-block)
    //      працюємо з самим контейнером як з "row-хостом" (вирівнювання/режими/гапи)
    const blocks = els.filter(el => el.classList?.contains('st-block'));
    if (safeSelType00710 === 'block' || safeSelType00710 === 'header-inner' || safeSelType00710 === 'footer-inner' || blocks.length) {
      const rows = [];
      blocks.forEach(b => {
        const layoutTargetMode = getLayoutTargetMode_();

        // ✅ MENU bridge:
        // У режимі «Діти» пункти меню є дітьми першого рівня, тому керуємо root-list меню.
        // У режимі «Блок» саме меню лишається звичайним блоком у своєму батьківському row.
        if (b?.classList?.contains('st-block--menu') && layoutTargetMode === 'children') {
          const menuRootList = getMenuRootList_(b);
          if (menuRootList) {
            menuRootList.dataset.stLayoutProxy = 'menu-root-list';
            rows.push(menuRootList);
            return;
          }
        }

        // ✅ Режим «Блок»: налаштування розмітки має стосуватись самого вибраного блока.
        // Для вирівнювання/відступів між елементами хостом є його батьківський row/container,
        // а не внутрішній row блока. Це прибирає конфлікт «блок vs діти».
        if (layoutTargetMode === 'block') {
          const parentHost = (b.parentElement && (b.parentElement.classList?.contains('st-row') || b.parentElement.classList?.contains('st-block') || b.parentElement.classList?.contains('st-menu__list')))
            ? b.parentElement
            : (b.closest?.('.st-row') || b.closest?.('.st-block') || null);
          if (parentHost) {
            rows.push(parentHost);
            return;
          }
        }

        const inner = b.querySelector(':scope > .st-row');
        if (inner) {
          rows.push(inner);
          return;
        }
        // Header/Footer контейнер без st-row: якщо є прямі діти .st-block — це наш layout host
        const hasDirectBlocks = !!b.querySelector(':scope > .st-block');
        if (hasDirectBlocks) rows.push(b);

        // ✅ ВАЖЛИВО:
        // Якщо вибраний ЗВИЧАЙНИЙ (leaf) блок у CONTENT, то вирівнювання очікується
        // по його батьківському ROW (де він є grid-item), а не по самому блоку.
        // Інакше кнопки "Вирівнювання" виглядають як такі, що "не працюють".
        if (!inner && !hasDirectBlocks) {
          const parentRow = b.closest?.('.st-row');
          if (parentRow) rows.push(parentRow);
        }
      });
      // прибрати дублікати (коли вибрано кілька блоків з одного row)
      const uniqRows = Array.from(new Set(rows));
      return { rows: uniqRows, blocks };
    }

    return { rows: [], blocks: [] };
  }


  // --------- DIRECT-CHILD ALIGN SCOPE (ONE LEVEL DOWN) ---------
  // ПРАВИЛО (як ти описав):
  //  - якщо вибраний ROW -> вирівнюємо ЙОГО ПРЯМИХ дітей (.st-block) всередині ROW (тобто міняємо вирівнювання ХОСТА, а не дітей-дітей)
  //  - якщо вибраний BLOCK (контейнер), у якому є ROW -> вирівнюємо ПРЯМИЙ inner ROW(и) всередині цього BLOCK (не чіпаємо елементи всередині inner ROW)
  //  - якщо вибрана SECTION -> вирівнюємо її ПРЯМИЙ row(и) всередині секції
  function getDirectAlignScope_() {
    // 1) Прямо вибраний ROW
    const activeRow = (() => { const a = getComponentActiveElement00450_(); return a?.classList?.contains('st-row') ? a : queryScopedActive00453_('row'); })();
    if (activeRow) {
      const children = Array.from(activeRow.querySelectorAll(':scope > .st-block'));
      return { type: 'row-children', host: activeRow, children };
    }

    // 2) Прямо вибраний BLOCK/контейнер
    const activeBlock = (() => { const a = getComponentActiveElement00450_(); return a?.classList?.contains('st-block') ? a : queryScopedActive00453_('block'); })();
    if (activeBlock) {
      const childRows = Array.from(activeBlock.querySelectorAll(':scope > .st-row'));
      if (childRows.length) return { type: 'block-child-rows', host: activeBlock, children: childRows };

      // Header/Footer контейнер без inner row: працюємо як "row-host" по прямих блоках
      const childBlocks = Array.from(activeBlock.querySelectorAll(':scope > .st-block'));
      if (childBlocks.length) return { type: 'row-children', host: activeBlock, children: childBlocks };
    }

    // 3) Вибрана SECTION
    const activeSection = (() => { const a = getComponentActiveElement00450_(); return a?.classList?.contains('st-section') ? a : queryScopedActive00453_('section'); })();
    if (activeSection) {
      const childRows = Array.from(activeSection.querySelectorAll(':scope > .st-row'));
      if (childRows.length) return { type: 'block-child-rows', host: activeSection, children: childRows };
    }

    // 4) Fallback: старий механізм (для сумісності)
    const { rows } = getTargetRowsAndBlocks();
    return { type: 'fallback-rows', rows };
  }

  // --------- ALIGN SCOPE (ROW vs PARENT BLOCK) ---------
  // Коли вибраний контейнер .st-block, користувач очікує, що вирівнювання буде
  // в межах ЦЬОГО блока (контейнера), а не всередині його внутрішнього .st-row.
  // Тому: якщо активний елемент — .st-block і він має прямий ":scope > .st-row",
  // ми вирівнюємо цей ВНУТРІШНІЙ row як єдиний елемент всередині parent block.
  function getAlignScope_() {
    // 0) Якщо активний саме ROW — вирівнюємо РЯД як єдиний елемент у межах його батьківського контейнера
    // (блок або секція). Це ключова очікувана поведінка.
    const activeRow = (() => { const a = getComponentActiveElement00450_(); return a?.classList?.contains('st-row') ? a : queryScopedActive00453_('row'); })();
    if (activeRow) {
      const host = activeRow.closest?.('.st-block') || activeRow.closest?.('.st-section');
      if (host) return { type: 'row-in-parent', parent: host, row: activeRow };
    }

    // ✅ ВАЖЛИВО: користувач “вибирає блок” через canvas/tree,
    // і реальний вибраний контейнер позначається класом .is-active.
    // Клік може потрапити у внутрішній елемент (дитину), тому sel.elements[0]
    // не завжди дорівнює контейнеру. Беремо .st-block.is-active як джерело правди.
    const activeBlock = (() => { const a = getComponentActiveElement00450_(); return a?.classList?.contains('st-block') ? a : queryScopedActive00453_('block'); })();
    if (activeBlock) {
      const innerRow = activeBlock.querySelector(':scope > .st-row');
      if (innerRow) return { type: 'row-in-parent', parent: activeBlock, row: innerRow };
    }

    const sel = getSelection();
    const active = sel?.elements?.[0] || null;
    if (!active || !active.closest) return { type: 'rows', rows: getTargetRowsAndBlocks().rows };

    // 1) Якщо клікнули всередині row (або по row) — також вирівнюємо сам row у межах його host блока.
    const maybeRow = active.closest('.st-row');
    if (maybeRow) {
      const host = maybeRow.closest?.('.st-block') || maybeRow.closest?.('.st-section');
      if (host) return { type: 'row-in-parent', parent: host, row: maybeRow };
    }

    // 2) Якщо активний контейнер-блок має прямий innerRow — вирівнюємо цей innerRow у межах блока.
    const block = active.closest('.st-block');
    if (block) {
      const innerRow = block.querySelector(':scope > .st-row');
      if (innerRow) return { type: 'row-in-parent', parent: block, row: innerRow };
    }

    return { type: 'rows', rows: getTargetRowsAndBlocks().rows };
  }

  // --- NEW: align the ROW ITSELF inside its parent (block/section) ---
  function ensureParentFlexColumn_(parent) {
    if (!parent || !parent.style) return;
    if (!parent.dataset.stPrevAlignParent) {
      parent.dataset.stPrevAlignParent = JSON.stringify({
        display: parent.style.display || '',
        flexDirection: parent.style.flexDirection || '',
        alignItems: parent.style.alignItems || '',
        justifyContent: parent.style.justifyContent || ''
      });
    }
    parent.style.display = 'flex';
    parent.style.flexDirection = 'column';
  }

  function ensureRowFitContent_(row) {
    if (!row || !row.style) return;
    if (!row.dataset.stPrevAlignRow) {
      row.dataset.stPrevAlignRow = JSON.stringify({
        width: row.style.width || '',
        maxWidth: row.style.maxWidth || '',
        marginLeft: row.style.marginLeft || '',
        marginRight: row.style.marginRight || '',
        marginTop: row.style.marginTop || '',
        marginBottom: row.style.marginBottom || ''
      });
    }
    // ⚠️ IMPORTANT:
    // Не встановлюємо width:fit-content тут за замовчуванням.
    // Для FR/GRID це стискає сітку до min-content і виглядає як “вертикальні лінії”.
    // Цю функцію залишаємо лише як сховище попередніх стилів, але НЕ застосовуємо width.
  }



  // [00665][HF LEVEL BLOCK ALIGN]
  // The old 00650 guard returned false for Header/Footer level (.st-row) in mode
  // "Блок", so the Layout buttons were correctly clicked but never applied.
  // For HF rows we now align the selected level itself inside its section using
  // normal flex/margins only. No transform, no capture/interceptor, no children resize.
  function applyHeaderFooterLevelBlockAlign00665_(row, axis, valFlex) {
    try {
      if (!(row instanceof HTMLElement) || !row.classList?.contains('st-row') || !isHeaderFooterArea_(row)) return false;
      const parent = row.parentElement;
      if (!(parent instanceof HTMLElement)) return false;
      const before = {
        axis,
        val: valFlex,
        rowBefore: typeof hfNodeSnap00664_ === 'function' ? hfNodeSnap00664_(row) : null,
        parentBefore: typeof hfNodeSnap00664_ === 'function' ? hfNodeSnap00664_(parent) : null
      };

      // Parent becomes a vertical flex container so the selected level can be
      // aligned as one box. This does not change children inside the row.
      parent.style.setProperty('display', 'flex', 'important');
      parent.style.setProperty('flex-direction', 'column', 'important');
      parent.style.setProperty('box-sizing', 'border-box', 'important');
      parent.style.setProperty('min-width', '0px', 'important');
      parent.style.setProperty('max-width', '100%', 'important');

      // Remove previous transform-based row align leftovers. HF level align must
      // not use translate because it caused invisible offsets and stale geometry.
      row.style.removeProperty('transform');
      try { delete row.dataset.stAlignDx; delete row.dataset.stAlignDy; delete row.dataset.stPrevAlignTransform; } catch (_) {}

      row.style.setProperty('box-sizing', 'border-box', 'important');
      row.style.setProperty('min-width', '0px', 'important');
      row.style.setProperty('max-width', '100%', 'important');
      row.style.removeProperty('justify-self');

      const r = row.getBoundingClientRect?.();
      const currentW = Math.max(1, Math.round(r?.width || row.offsetWidth || 1));
      // If row has width:100%, horizontal self-align cannot be visible. Freeze the
      // current visual width in px only when aligning X, so left/center/right can
      // actually move the level without changing its inner layout.
      if (axis === 'x') {
        row.style.setProperty('width', currentW + 'px', 'important');
        row.style.setProperty('flex', '0 0 auto', 'important');
        row.style.setProperty('align-self', valFlex, 'important');
        row.style.removeProperty('margin-left');
        row.style.removeProperty('margin-right');
      } else {
        row.style.setProperty('align-self', row.style.alignSelf || 'stretch');
        row.style.removeProperty('margin-top');
        row.style.removeProperty('margin-bottom');
        if (valFlex === 'center') {
          row.style.setProperty('margin-top', 'auto', 'important');
          row.style.setProperty('margin-bottom', 'auto', 'important');
        } else if (valFlex === 'flex-end') {
          row.style.setProperty('margin-top', 'auto', 'important');
          row.style.setProperty('margin-bottom', '0px', 'important');
        } else {
          row.style.setProperty('margin-top', '0px', 'important');
          row.style.removeProperty('margin-bottom');
        }
      }

      row.dataset.stLayoutHfLevelBlockAlign00665 = axis + ':' + valFlex;
      try { delete row.dataset.stLayoutHfLevelBlockAlignGuard00650; delete row.dataset.stLayoutLevelBlockAlignGuard00647; } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-level-block-align-applied-00665', {
          scope: componentScopeOfEl00451_(row),
          axis,
          val: valFlex,
          rowW: currentW,
          cls: String(row.className || '')
        }, 'info');
      } catch (_) {}
      try {
        if (typeof hfPushAlignDiag00664_ === 'function') {
          hfPushAlignDiag00664_('level-block-align-applied-00665', Object.assign({}, before, {
            rowAfterNow: hfNodeSnap00664_(row),
            parentAfterNow: hfNodeSnap00664_(parent)
          }), 'info');
          hfScheduleAfterAlignAudit00664_('level-block-align-00665', row, parent, axis, valFlex, before);
        }
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function applyRowAlignInParent_(parent, row, axis, valFlex) {
    if (!parent || !row) return;
    ensureParentFlexColumn_(parent);

    // ✅ Вирівнюємо ROW як єдиний елемент БЕЗ зміни його ширини/розкладки.
    // Використовуємо translate() по відношенню до батька.
    // Це не стискає FR/GRID і не “збирає” блоки в вертикальні лінії.

    // Зберігаємо попередній transform лише 1 раз
    if (row.dataset.stPrevAlignTransform == null) {
      row.dataset.stPrevAlignTransform = row.style.transform || '';
    }

    // ВАЖЛИВО:
    // row може вже мати translate() від попереднього вирівнювання.
    // Якщо міряти rect у трансформованому стані, а потім записувати translate
    // на базовий (очищений) transform — отримаємо "стрибок" далеко за межі.
    // Тому міряємо у НУЛЬОВОМУ translate-стані.

    const base = row.dataset.stPrevAlignTransform || '';
    const cleaned = base
      .replace(/\s*translate3d\([^)]*\)\s*/g,'')
      .replace(/\s*translate\([^)]*\)\s*/g,'')
      .trim();

    // 1) тимчасово прибрати translate і переміряти
    const prevInline = row.style.transform || '';
    row.style.transform = cleaned;
    // force reflow
    void row.offsetWidth;

    const pr = parent.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    const curLeft = rr.left - pr.left;
    const curTop  = rr.top  - pr.top;
    const maxDx = Math.max(0, pr.width - rr.width);
    const maxDy = Math.max(0, pr.height - rr.height);

    let targetLeft = curLeft;
    let targetTop  = curTop;

    if (axis === 'x') {
      if (valFlex === 'center') targetLeft = maxDx / 2;
      else if (valFlex === 'flex-end') targetLeft = maxDx;
      else targetLeft = 0;
    } else {
      if (valFlex === 'center') targetTop = maxDy / 2;
      else if (valFlex === 'flex-end') targetTop = maxDy;
      else targetTop = 0;
    }

    // clamp
    if (axis === 'x') {
      if (!isFinite(targetLeft)) targetLeft = 0;
      targetLeft = Math.max(0, Math.min(maxDx, targetLeft));
      const dx = Math.round(targetLeft - curLeft);
      row.dataset.stAlignDx = String(dx);
    } else {
      if (!isFinite(targetTop)) targetTop = 0;
      targetTop = Math.max(0, Math.min(maxDy, targetTop));
      const dy = Math.round(targetTop - curTop);
      row.dataset.stAlignDy = String(dy);
    }

    const dx = parseInt(row.dataset.stAlignDx || '0', 10) || 0;
    const dy = parseInt(row.dataset.stAlignDy || '0', 10) || 0;

    // 2) застосувати translate поверх очищеного transform
    row.style.transform = (cleaned ? cleaned + ' ' : '') + `translate(${dx}px, ${dy}px)`;

    // 3) якщо щось пішло не так — відкотити до попереднього inline (страховка)
    if (!row.style.transform) row.style.transform = prevInline;
  }

  function ensureBlockAlignHost_(block, innerRow) {
    if (!block || !block.style || !innerRow || !innerRow.style) return;
    // Потрібно, щоб innerRow можна було візуально вирівнювати В МЕЖАХ блока,
    // не ламаючи внутрішню розмітку row.
    // Важливо: вирівнювання для "всього вмісту" блока робимо через translate (dx/dy)
    // на innerRow, а не через justify/align самого innerRow (бо це вирівнює ДІТЕЙ у row).
    if (!block.dataset.prevAlignHost) {
      // збереження мінімуму (лише те, що ми змінюємо)
      block.dataset.prevAlignHost = JSON.stringify({
        display: block.style.display || '',
        flexDirection: block.style.flexDirection || '',
        justifyContent: block.style.justifyContent || '',
        alignItems: block.style.alignItems || ''
      });
    }

    block.style.display = 'flex';
    block.style.flexDirection = 'column';
    // Щоб innerRow НЕ розтягувався на всю ширину, інакше горизонтальне вирівнювання не видно.
    if (!innerRow.dataset.prevFit) {
      innerRow.dataset.prevFit = JSON.stringify({
        width: innerRow.style.width || '',
        maxWidth: innerRow.style.maxWidth || '',
        marginLeft: innerRow.style.marginLeft || '',
        marginRight: innerRow.style.marginRight || ''
      });
    }
    innerRow.style.width = 'fit-content';
    innerRow.style.maxWidth = '100%';

    // Зберігаємо/готуємо transform (щоб зрушувати весь контент як групу)
    if (!innerRow.dataset.prevTransform) {
      innerRow.dataset.prevTransform = innerRow.style.transform || '';
    }
  }

  function getInnerRowDirectBlocks_(innerRow) {
    try {
      return Array.from(innerRow.querySelectorAll(':scope > .st-block'));
    } catch (e) {
      return Array.from(innerRow.querySelectorAll('.st-block'));
    }
  }

  function calcBBoxFromBlocks_(blocks) {
    const rects = (blocks || []).map(b => b?.getBoundingClientRect?.()).filter(Boolean);
    if (!rects.length) return null;
    let left = rects[0].left, top = rects[0].top, right = rects[0].right, bottom = rects[0].bottom;
    for (let i = 1; i < rects.length; i++) {
      const r = rects[i];
      if (r.left < left) left = r.left;
      if (r.top < top) top = r.top;
      if (r.right > right) right = r.right;
      if (r.bottom > bottom) bottom = r.bottom;
    }
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function applyBlockContentAlign_(block, innerRow, axis, valFlex) {
    if (!block || !innerRow) return;

    // 1) зчитати поточні dx/dy (зберігаємо окремо, щоб не було накопичення)
    const curDx = isFinite(parseFloat(innerRow.dataset.alignDx)) ? parseFloat(innerRow.dataset.alignDx) : 0;
    const curDy = isFinite(parseFloat(innerRow.dataset.alignDy)) ? parseFloat(innerRow.dataset.alignDy) : 0;

    // 2) прибрати translate перед заміром (замір робимо у "нульовому" стані)
    innerRow.style.transform = 'translate(0px, 0px)';

    // 2) bbox контенту (по прямих дітях innerRow), а не bbox самого innerRow (він може бути 100%)
    const blocks = getInnerRowDirectBlocks_(innerRow);
    const bbox = calcBBoxFromBlocks_(blocks) || innerRow.getBoundingClientRect();
    const host = block.getBoundingClientRect();

    // 3) цільова точка
    let dx = 0, dy = 0;
    if (axis === 'x') {
      if (valFlex === 'center') {
        dx = (host.left + host.width / 2) - (bbox.left + bbox.width / 2);
      } else if (valFlex === 'flex-end') {
        dx = (host.right) - (bbox.right);
      } else {
        // flex-start
        dx = (host.left) - (bbox.left);
      }
    } else {
      if (valFlex === 'center') {
        dy = (host.top + host.height / 2) - (bbox.top + bbox.height / 2);
      } else if (valFlex === 'flex-end') {
        dy = (host.bottom) - (bbox.bottom);
      } else {
        dy = (host.top) - (bbox.top);
      }
    }

    // 4) зберігаємо і застосовуємо dx/dy (без накопичення)
    const nextDx = (axis === 'x') ? dx : curDx;
    const nextDy = (axis === 'y') ? dy : curDy;
    innerRow.dataset.alignDx = String(nextDx);
    innerRow.dataset.alignDy = String(nextDy);
    innerRow.style.transform = `translate(${nextDx}px, ${nextDy}px)`;
  }

  function restoreBlockAlignHost_(block, innerRow) {
    if (!block || !innerRow) return;
    try {
      const prev = block.dataset.prevAlignHost ? JSON.parse(block.dataset.prevAlignHost) : null;
      if (prev) {
        block.style.display = prev.display;
        block.style.flexDirection = prev.flexDirection;
        block.style.justifyContent = prev.justifyContent;
        block.style.alignItems = prev.alignItems;
      }
      delete block.dataset.prevAlignHost;
    } catch(e) {}
    try {
      const prevFit = innerRow.dataset.prevFit ? JSON.parse(innerRow.dataset.prevFit) : null;
      if (prevFit) {
        innerRow.style.width = prevFit.width;
        innerRow.style.maxWidth = prevFit.maxWidth;
        innerRow.style.marginLeft = prevFit.marginLeft;
        innerRow.style.marginRight = prevFit.marginRight;
      }
      delete innerRow.dataset.prevFit;
    } catch(e) {}

    // restore transform used for "align content in block"
    try {
      if (innerRow.dataset.prevTransform != null) {
        innerRow.style.transform = innerRow.dataset.prevTransform;
      } else {
        innerRow.style.transform = '';
      }
      delete innerRow.dataset.prevTransform;
      delete innerRow.dataset.alignDx;
      delete innerRow.dataset.alignDy;
    } catch(e) {}
  }

  function isRowEl_(el){
    return !!(el && el.classList && el.classList.contains('st-row'));
  }

  function ensureFlexHost_(el){
    if (!el || !el.style) return;
    // Для контейнерів у Header/Footer, де немає .st-row, вирівнювання має працювати по flex
    if (!isRowEl_(el)) {
      el.dataset.layoutMode = 'flex';
      const isHF00467 = isHeaderFooterArea_(el);
      const social00467 = isHF00467 && isHeaderFooterSocialGroup00467_(el);
      if (isHF00467) stSetImportant00467_(el, 'display', social00467 ? 'inline-flex' : 'flex');
      else el.style.display = 'flex';

      // IMPORTANT:
      // Default flex align-items is "stretch".
      // When the container height changes, flex-children with auto height get stretched,
      // which looks like the icon size "resets".
      // We set a safe default to preserve explicit icon heights while still allowing
      // the user to change vertical alignment via the alignment buttons.
      if (!el.style.alignItems) el.style.alignItems = el.dataset.stLayoutChildrenAlignY || 'center';
      if (!el.style.justifyContent) {
        const keepJ = String(el.dataset.stLayoutChildrenAlignX || '').trim();
        if (keepJ) el.style.justifyContent = keepJ;
        else el.style.justifyContent = 'flex-start';
      }

      const o = el.dataset.layoutOrient || el.style.flexDirection || 'row';
      const dir = (o === 'column') ? 'column' : 'row';
      if (isHF00467) {
        stSetImportant00467_(el, 'flex-direction', dir);
        stSetImportant00467_(el, 'flex-wrap', 'nowrap');
        containHeaderFooterLayoutHost00467_(el);
        try { growHeaderFooterHostToFitChildren00468_(el, dir, 'ensure-flex-host'); } catch (_) {}
        if (social00467) {
          el.dataset.stSocialGroup = '1';
          el.style.setProperty('--st-social-layout-orient', dir);
        }
      } else if (!el.style.flexDirection) {
        el.style.flexDirection = dir;
      }
    }
  }

  // ✅ IMPORTANT:
  // For nested containers (a .st-row inside a parent .st-block), vertical alignment via
  // align-items is only visible when the ROW has extra vertical space.
  // In CONTENT, containers are typically: .st-block (has min-height) > .st-row (auto height).
  // So even when user clicks Top/Center/Bottom, the row collapses to its content height
  // and nothing moves. We force the inner row to fill the parent block height.
  function ensureRowFillParent_(row){
    if (!row || !isRowEl_(row)) return;
    const p = row.parentElement;
    if (!p || !p.classList || !p.classList.contains('st-block')) return;

    // ✅ We only need extra "free height" so vertical alignment can show.
    // IMPORTANT: do NOT break horizontal alignment — keep row's own justify logic intact.

    // Make parent a flex column ONLY if it isn't already explicitly styled inline.
    // (CSS stays the source of truth; we avoid overriding user-set inline display.)
    if (!p.style.display) p.style.display = 'flex';
    if (!p.style.flexDirection) p.style.flexDirection = 'column';
    if (!p.style.alignItems) p.style.alignItems = 'stretch';

    // Let the row consume available height, but keep it shrinkable in width.
    row.style.flex = '1 1 0%';
    row.style.minHeight = '0';
    row.style.height = '100%';
    row.style.minWidth = '0';
  }


  // [00466][HEADER/FOOTER ORIENTATION OVERRIDE]
  // Header/Footer builder CSS contains several row defaults with
  // flex-direction: row !important. The Layout widget must be stronger when
  // the user selects a container/level and presses Horizontal/Vertical.
  function isHeaderFooterLayoutHost00466_(el) {
    try {
      const s = componentScopeOfEl00451_(el);
      return s === 'header' || s === 'footer';
    } catch (_) { return false; }
  }

  function stSetImportant00467_(el, prop, value) {
    try { if (el?.style) el.style.setProperty(prop, value, 'important'); } catch (_) {}
  }

  function isHeaderFooterSocialGroup00467_(el) {
    try {
      if (!(el instanceof HTMLElement)) return false;
      if (el.dataset?.stSocialGroup === '1' || el.getAttribute?.('data-st-social-group') === '1') return true;
      const kids = Array.from(el.children || []).filter(ch => ch instanceof HTMLElement && ch.classList?.contains('st-block'));
      if (kids.length < 2) return false;
      const icons = kids.filter(ch => ch.classList?.contains('st-block--icon') || String(ch.dataset?.blockKind || ch.dataset?.blockRole || '').toLowerCase() === 'icon');
      return icons.length >= 2 && icons.length === kids.length;
    } catch (_) { return false; }
  }

  function getHeaderFooterFlexDir00467_(hostEl) {
    try {
      const raw = String(hostEl?.dataset?.layoutOrient || hostEl?.style?.flexDirection || getComputedStyle(hostEl).flexDirection || 'row').trim();
      return raw === 'column' ? 'column' : 'row';
    } catch (_) { return 'row'; }
  }

  function getHeaderFooterEffectiveChildrenDir00660_(hostEl, children = null) {
    try {
      const kids = Array.isArray(children) ? children : getHeaderFooterDirectChildren_(hostEl);
      const visible = (kids || []).filter((el) => el instanceof HTMLElement).map((el) => el.getBoundingClientRect?.()).filter((r) => r && r.width > 0 && r.height > 0);
      if (visible.length >= 2) {
        const lefts = visible.map(r => r.left);
        const tops = visible.map(r => r.top);
        const xRange = Math.max(...lefts) - Math.min(...lefts);
        const yRange = Math.max(...tops) - Math.min(...tops);
        if (yRange > Math.max(10, xRange * 0.55)) return 'column';
        if (xRange > Math.max(10, yRange * 0.55)) return 'row';
      }
    } catch (_) {}
    return getHeaderFooterFlexDir00467_(hostEl);
  }

  function applyHeaderFooterAxisAlign00467_(hostEl, axis, val) {
    try {
      if (!(hostEl instanceof HTMLElement) || !isHeaderFooterArea_(hostEl)) return false;
      const dir = getHeaderFooterFlexDir00467_(hostEl);
      hostEl.dataset.layoutMode = 'flex';
      hostEl.dataset.layoutOrient = dir;
      if (axis === 'x') hostEl.dataset.stLayoutChildrenAlignX = String(val || '');
      else hostEl.dataset.stLayoutChildrenAlignY = String(val || '');
      stSetImportant00467_(hostEl, 'display', isHeaderFooterSocialGroup00467_(hostEl) ? 'inline-flex' : 'flex');
      stSetImportant00467_(hostEl, 'flex-direction', dir);
      stSetImportant00467_(hostEl, 'flex-wrap', 'nowrap');

      const prop = axis === 'x'
        ? (dir === 'column' ? 'align-items' : 'justify-content')
        : (dir === 'column' ? 'justify-content' : 'align-items');
      stSetImportant00467_(hostEl, prop, val);
      // [00660] HARD CUT: align must not grow Header/Footer host.
      if (isHeaderFooterSocialGroup00467_(hostEl)) {
        try { hostEl.dataset.stSocialGroup = '1'; } catch (_) {}
        hostEl.style.setProperty('--st-social-layout-orient', dir);
        if (prop === 'justify-content') hostEl.style.setProperty('--st-social-justify-content', val);
        if (prop === 'align-items') hostEl.style.setProperty('--st-social-align-items', val);
      }
      try { window.__ST_PERF_DIAG__?.push?.('layout-hf-axis-align-00467', { scope: componentScopeOfEl00451_(hostEl), axis, val, dir, cls: String(hostEl.className || '') }, 'info'); } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function containHeaderFooterLayoutHost00467_(host) {
    try {
      if (!(host instanceof HTMLElement) || !isHeaderFooterArea_(host)) return false;
      // [00468] Containment must not clip children. The previous 00467 used
      // overflow:hidden + preserved max-height, so when a Header/Footer
      // container was switched to vertical, its children were simply cut off.
      // Real rule: keep width inside parent, but let height grow upward through
      // host -> row -> section if content needs more space.
      host.dataset.stLayoutContained00467 = '1';
      stSetImportant00467_(host, 'max-width', '100%');
      stSetImportant00467_(host, 'min-width', '0px');
      stSetImportant00467_(host, 'box-sizing', 'border-box');
      stSetImportant00467_(host, 'overflow', 'visible');
      Array.from(host.children || []).forEach((ch) => {
        try {
          if (!(ch instanceof HTMLElement) || !ch.classList?.contains('st-block')) return;
          stSetImportant00467_(ch, 'max-width', '100%');
          stSetImportant00467_(ch, 'min-width', '0px');
          stSetImportant00467_(ch, 'box-sizing', 'border-box');
          stSetImportant00467_(ch, 'flex-shrink', '1');
          stSetImportant00467_(ch, 'aspect-ratio', 'auto');
          ch.style.removeProperty('max-height');
        } catch (_) {}
      });
      try { growHeaderFooterHostToFitChildren00468_(host, getHeaderFooterFlexDir00467_(host), 'contain'); } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function headerFooterDirectVisualChildren00468_(host) {
    try {
      return Array.from(host?.children || []).filter((ch) => ch instanceof HTMLElement && ch.classList?.contains('st-block') && !ch.classList?.contains('st-resize'));
    } catch (_) { return []; }
  }


  // [00469][HEADER/FOOTER ORIENTATION SIZE LOCK]
  // Changing Horizontal/Vertical is a layout-direction operation only. It must
  // not resize the direct children of the selected Header/Footer container.
  // Older generic CSS for FLEX column forced direct children to width:100%, and
  // some builder passes let flex-stretch make phone/menu/social blocks huge.
  // We snapshot the visible child boxes before the direction change and restore
  // those boxes right after the host switches axis.
  function headerFooterDirectLayoutChildren00469_(host) {
    try {
      return Array.from(host?.children || []).filter((ch) => {
        return ch instanceof HTMLElement
          && ch.classList?.contains('st-block')
          && !ch.classList?.contains('st-resize')
          && !ch.classList?.contains('st-drop-hint')
          && !ch.matches?.('[data-st-builder-ui], .hb-panel, .hb-ctor, .hb-p');
      });
    } catch (_) { return []; }
  }

  function snapshotHeaderFooterChildSizes00469_(host) {
    try {
      if (!(host instanceof HTMLElement) || !isHeaderFooterArea_(host)) return [];
      const hostBox = host.getBoundingClientRect?.();
      const hostW = Math.max(1, Math.floor(hostBox?.width || host.clientWidth || 1));
      return headerFooterDirectLayoutChildren00469_(host).map((ch) => {
        const r = ch.getBoundingClientRect?.();
        const cs = getComputedStyle(ch);
        const w = Math.max(1, Math.min(hostW, Math.ceil(r?.width || ch.offsetWidth || ch.scrollWidth || parseFloat(cs.width) || 1)));
        const h = Math.max(1, Math.ceil(r?.height || ch.offsetHeight || ch.scrollHeight || parseFloat(cs.height) || 1));
        return {
          el: ch,
          w,
          h,
          flex: ch.style.flex || '',
          flexBasis: ch.style.flexBasis || '',
          flexGrow: ch.style.flexGrow || '',
          flexShrink: ch.style.flexShrink || '',
          alignSelf: ch.style.alignSelf || '',
          width: ch.style.width || '',
          minWidth: ch.style.minWidth || '',
          maxWidth: ch.style.maxWidth || '',
          height: ch.style.height || '',
          minHeight: ch.style.minHeight || '',
          maxHeight: ch.style.maxHeight || '',
          aspectRatio: ch.style.aspectRatio || ''
        };
      });
    } catch (_) { return []; }
  }

  function applyHeaderFooterChildSizeLock00469_(host, snaps, dir, reason = '') {
    try {
      if (!(host instanceof HTMLElement) || !isHeaderFooterArea_(host) || !snaps?.length) return false;
      const column = dir === 'column';
      let count = 0;
      snaps.forEach((snap) => {
        try {
          const ch = snap?.el;
          if (!(ch instanceof HTMLElement) || ch.parentElement !== host) return;
          const w = Math.max(1, Math.round(Number(snap.w) || ch.getBoundingClientRect?.().width || 1));
          const h = Math.max(1, Math.round(Number(snap.h) || ch.getBoundingClientRect?.().height || 1));

          ch.dataset.stLayoutSizeLocked00469 = '1';
          ch.dataset.stLayoutSizeLockReason00469 = String(reason || 'orientation');
          ch.style.setProperty('--st-layout-child-w-00469', w + 'px');
          ch.style.setProperty('--st-layout-child-h-00469', h + 'px');

          // Width must not jump to 100% when the selected host becomes column.
          // Clamp with max-width:100% so it cannot escape the selected parent.
          ch.style.setProperty('width', w + 'px', 'important');
          ch.style.setProperty('max-width', '100%', 'important');
          ch.style.setProperty('min-width', '0px', 'important');

          // Height stays the previous visual height. Parent expansion is handled
          // by growHeaderFooterHostToFitChildren00468_, not by stretching children.
          ch.style.setProperty('height', h + 'px', 'important');
          ch.style.setProperty('min-height', h + 'px', 'important');
          ch.style.setProperty('max-height', 'none', 'important');

          ch.style.setProperty('flex', '0 0 auto', 'important');
          ch.style.setProperty('flex-basis', 'auto', 'important');
          ch.style.setProperty('flex-grow', '0', 'important');
          ch.style.setProperty('flex-shrink', '1', 'important');
          ch.style.setProperty('aspect-ratio', 'auto', 'important');
          // In a column host, align-items:stretch would stretch child width.
          // A direct child may still be centered by explicit alignment buttons.
          if (column) ch.style.setProperty('align-self', snap.alignSelf || 'flex-start', 'important');
          count++;
        } catch (_) {}
      });
      try { window.__ST_PERF_DIAG__?.push?.('layout-hf-child-size-lock-00469', { scope: componentScopeOfEl00451_(host), dir, count, reason }, 'info'); } catch (_) {}
      return count > 0;
    } catch (_) { return false; }
  }

  function headerFooterOuterGap00468_(host, count, dir) {
    try {
      if (!host || count <= 1) return 0;
      const cs = getComputedStyle(host);
      const raw = dir === 'column' ? (cs.rowGap || cs.gap || '0') : (cs.columnGap || cs.gap || '0');
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n * Math.max(0, count - 1) : 0;
    } catch (_) { return 0; }
  }

  function measureHeaderFooterHostContentMin00468_(host, dir) {
    try {
      if (!(host instanceof HTMLElement)) return 1;
      const kids = headerFooterDirectVisualChildren00468_(host);
      const cs = getComputedStyle(host);
      const padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      if (!kids.length) return Math.max(1, Math.ceil(host.scrollHeight || host.getBoundingClientRect?.().height || 1));
      const sizes = kids.map((ch) => {
        try {
          const r = ch.getBoundingClientRect?.();
          const sh = ch.scrollHeight || 0;
          const mh = parseFloat(getComputedStyle(ch).minHeight || '') || 0;
          return Math.max(1, Math.ceil(r?.height || 0), Math.ceil(sh || 0), Math.ceil(mh || 0));
        } catch (_) { return 1; }
      });
      const gap = headerFooterOuterGap00468_(host, kids.length, dir);
      const need = dir === 'column'
        ? sizes.reduce((a, b) => a + b, 0) + gap + padY
        : Math.max(...sizes) + padY;
      return Math.max(1, Math.ceil(need));
    } catch (_) { return 1; }
  }

  function growHeaderFooterHostToFitChildren00468_(host, dir, reason = '') {
    try {
      if (!(host instanceof HTMLElement) || !isHeaderFooterArea_(host)) return false;
      const scope00494 = componentScopeOfEl00451_(host);
      const isFooter00494 = scope00494 === 'footer' || !!host.closest?.('#st-site-footer-slot, .st-site-footer-slot, .st-section[data-sec-role="footer"]');
      if (isFooter00494) return false; // [00592] no footer grow/repair from layout widget
      const dir00494 = dir || getHeaderFooterFlexDir00467_(host);
      const needed = measureHeaderFooterHostContentMin00468_(host, dir00494);
      const current = Math.ceil(host.getBoundingClientRect?.().height || 0);
      // [00494] Footer orientation must never use the already stretched current
      // height as the new minimum. That was the source of 900–1400px footer
      // ghosts and "footer in the air" after Horizontal/Vertical toggles.
      // Header keeps the previous behaviour; footer uses content need only.
      const min = isFooter00494 ? Math.max(needed, 1) : Math.max(needed, current || 0, 1);
      host.style.removeProperty('max-height');
      // A fixed height from older fixes is what caused clipping. Keep user width,
      // but convert height into min-height so the element may grow to children.
      host.style.removeProperty('height');
      stSetImportant00467_(host, 'min-height', min + 'px');
      stSetImportant00467_(host, 'overflow', 'visible');

      let cur = host.parentElement;
      let guard = 0;
      while (cur instanceof HTMLElement && guard++ < 6 && isHeaderFooterArea_(cur)) {
        if (cur.id === 'st-site-footer-slot') {
          // [00494] The footer slot is a positioning shell, not a resizable part.
          // Never lock min-height on it; section/rows define the actual footer.
          cur.style.removeProperty('height');
          cur.style.removeProperty('min-height');
          cur.style.removeProperty('max-height');
          cur.style.setProperty('overflow', 'visible', 'important');
          cur = cur.parentElement;
          continue;
        }
        if (cur.classList?.contains('st-row') || cur.classList?.contains('st-section') || cur.id === 'st-site-header-slot') {
          const cr = cur.getBoundingClientRect?.();
          const existing = Math.ceil(cr?.height || 0);
          const ch = Math.ceil(cur.scrollHeight || 0);
          const h = isFooter00494 ? Math.max(ch, min, 1) : Math.max(existing, ch, min);
          cur.style.removeProperty('max-height');
          cur.style.removeProperty('height');
          stSetImportant00467_(cur, 'min-height', h + 'px');
          stSetImportant00467_(cur, 'overflow', 'visible');
        }
        cur = cur.parentElement;
      }
      try { window.__ST_PERF_DIAG__?.push?.('layout-hf-grow-to-fit-00468', { scope: scope00494, dir: dir00494, min, needed, current, reason, cls: String(host.className || ''), footerSlotUnlock00494: isFooter00494 }, 'info'); } catch (_) {}
      return true;
    } catch (_) { return false; }
  }


  // [00478][FOOTER ORIENTATION SHRINK BACK]
  // Коли footer-рівень перемикається в column, він законно росте по висоті,
  // щоб вміст не обрізався. Але при поверненні в row цей старий min-height
  // не можна брати як новий мінімум. Саме це залишало рівень високим після
  // Vertical -> Horizontal. Для footer row у горизонталі мінімум рахуємо заново
  // від дітей, а не від поточної розтягнутої висоти.
  function isFooterLevelRow00478_(el) {
    try {
      return !!(el instanceof HTMLElement
        && el.classList?.contains('st-row')
        && el.closest?.('#st-site-footer-slot, .st-site-footer-slot, .st-section[data-sec-role="footer"]'));
    } catch (_) { return false; }
  }

  function hasManualFooterHeight00478_(el) {
    try {
      if (!(el instanceof HTMLElement)) return false;
      const d = el.dataset || {};
      return d.stKeepManualHeight === '1'
        || d.stKeepManualSize === '1'
        || d.stFooterLeafManualH === '1'
        || d.stFooterLeafUserH === '1'
        || d.stFooterManualH00477 === '1'
        || el.getAttribute('data-st-keep-manual-height') === '1'
        ;
    } catch (_) { return false; }
  }

  function shrinkFooterRowBackAfterHorizontal00478_(host) {
    try {
      if (!isFooterLevelRow00478_(host)) return false;
      const dir = String(host?.dataset?.layoutOrient || host?.style?.flexDirection || '').toLowerCase();
      if (dir && dir !== 'row') return false;

      // Спочатку прибираємо застарілу висоту, яку поставив column/grow-to-fit.
      // Потім міряємо реальну висоту дітей у горизонталі.
      host.style.removeProperty('height');
      host.style.removeProperty('max-height');
      host.style.removeProperty('min-height');

      const needed = Math.max(1, Math.ceil(measureHeaderFooterHostContentMin00468_(host, 'row') || 1));
      stSetImportant00467_(host, 'min-height', needed + 'px');
      stSetImportant00467_(host, 'overflow', 'visible');
      host.dataset.stFooterOrientShrinkBack00478 = '1';

      // Предки могли отримати великий min-height під час column. Якщо це не
      // ручна висота користувача — відпускаємо їх, щоб footer знову став
      // компактним, але не чіпаємо ширини/позиції.
      let cur = host.parentElement;
      let released = 0;
      let guard = 0;
      while (cur instanceof HTMLElement && guard++ < 8 && cur.closest?.('#st-site-footer-slot, .st-site-footer-slot, .st-section[data-sec-role="footer"]')) {
        const isFooterNode = cur.id === 'st-site-footer-slot'
          || cur.classList?.contains('st-site-footer-slot')
          || cur.classList?.contains('st-section')
          || cur.classList?.contains('st-block')
          || cur.classList?.contains('st-row');
        if (!isFooterNode) { cur = cur.parentElement; continue; }
        if (!hasManualFooterHeight00478_(cur)) {
          cur.style.removeProperty('height');
          cur.style.removeProperty('max-height');
          // Не ставимо нуль: нехай DOM сам порахує висоту дітей.
          if (cur !== host) cur.style.removeProperty('min-height');
          cur.style.overflow = 'visible';
          released++;
        }
        if (cur.id === 'st-site-footer-slot') break;
        cur = cur.parentElement;
      }

      try { window.__ST_PERF_DIAG__?.push?.('footer-row-orient-shrink-back-00478', { min: needed, released, cls: String(host.className || '') }, 'info'); } catch (_) {}
      return true;
    } catch (_) { return false; }
  }


  // [00492][FOOTER COLUMN FLOW + AUDIT]
  // Footer levels must behave like a normal vertical stack when switched to
  // Vertical: children are in the document flow, full width by default, no
  // generated fixed heights, and the row grows only to the real content.  This
  // replaces the bad direction from 00489-00491 where generated min-height locks
  // made containers either huge or impossible to resize.
  function footerPx00492_(v, fallback = 0) {
    const n = parseFloat(String(v || ''));
    return Number.isFinite(n) ? n : fallback;
  }

  function footerBoxY00492_(el) {
    try {
      const cs = getComputedStyle(el);
      return footerPx00492_(cs.paddingTop) + footerPx00492_(cs.paddingBottom)
        + footerPx00492_(cs.borderTopWidth) + footerPx00492_(cs.borderBottomWidth);
    } catch (_) { return 0; }
  }

  function footerGapY00492_(el) {
    try {
      const cs = getComputedStyle(el);
      const rg = footerPx00492_(cs.rowGap, NaN);
      if (Number.isFinite(rg)) return Math.max(0, rg);
      const g = footerPx00492_(cs.gap, NaN);
      return Number.isFinite(g) ? Math.max(0, g) : 0;
    } catch (_) { return 0; }
  }

  function isFooterColumnFlowRow00492_(host) {
    try {
      if (!isFooterLevelRow00478_(host)) return false;
      const d = String(host.dataset?.layoutOrient || '').toLowerCase();
      const fd = String(host.style?.flexDirection || getComputedStyle(host).flexDirection || '').toLowerCase();
      return d === 'column' || fd.includes('column');
    } catch (_) { return false; }
  }

  function footerChildHasManualHeight00492_(ch) {
    try {
      const d = ch?.dataset || {};
      return d.stKeepManualHeight === '1'
        || d.stFooterUserManualH00492 === '1'
        || d.stFooterManualH00477 === '1'
        || d.stFooterLeafManualH === '1'
        || d.stFooterLeafUserH === '1';
    } catch (_) { return false; }
  }

  function footerMeasureColumnRowNeed00492_(host) {
    try {
      const kids = headerFooterDirectLayoutChildren00469_(host);
      if (!kids.length) return Math.max(1, Math.ceil(host.scrollHeight || host.getBoundingClientRect?.().height || 1));
      const gap = footerGapY00492_(host);
      let sum = footerBoxY00492_(host) + gap * Math.max(0, kids.length - 1);
      kids.forEach((ch) => {
        try {
          const r = ch.getBoundingClientRect?.();
          const cs = getComputedStyle(ch);
          const mt = footerPx00492_(cs.marginTop);
          const mb = footerPx00492_(cs.marginBottom);
          const h = Math.max(1, Math.ceil(r?.height || 0), Math.ceil(ch.scrollHeight || 0), Math.ceil(ch.offsetHeight || 0));
          sum += h + mt + mb;
        } catch (_) { sum += 1; }
      });
      return Math.max(1, Math.ceil(sum));
    } catch (_) { return 1; }
  }

  function footerAuditOrientation00492_(host, reason) {
    try {
      const kids = headerFooterDirectLayoutChildren00469_(host).slice(0, 10).map((ch) => {
        const r = ch.getBoundingClientRect?.();
        const cs = getComputedStyle(ch);
        return {
          cls: String(ch.className || '').slice(0, 120),
          kind: ch.dataset?.blockKind || ch.dataset?.kind || '',
          rect: { w: Math.round(r?.width || 0), h: Math.round(r?.height || 0), top: Math.round(r?.top || 0), bottom: Math.round(r?.bottom || 0) },
          style: { w: ch.style.width || '', h: ch.style.height || '', minH: ch.style.minHeight || '', flex: ch.style.flex || '', alignSelf: ch.style.alignSelf || '' },
          scrollH: Math.round(ch.scrollHeight || 0),
          manualH: footerChildHasManualHeight00492_(ch)
        };
      });
      const rr = host.getBoundingClientRect?.();
      window.__ST_PERF_DIAG__?.push?.('footer-orientation-audit-00492', {
        reason,
        dir: String(host.dataset?.layoutOrient || host.style?.flexDirection || ''),
        rowRect: { w: Math.round(rr?.width || 0), h: Math.round(rr?.height || 0), top: Math.round(rr?.top || 0), bottom: Math.round(rr?.bottom || 0) },
        need: footerMeasureColumnRowNeed00492_(host),
        children: kids.length,
        kids
      }, 'info');
    } catch (_) {}
  }

  function applyFooterColumnFlow00492_(host, reason = '') {
    // [00592] Footer column-flow repair removed. Footer resize is direct only.
    return false;
  }

  function applyHeaderFooterFlexOrientation00466_(host, val) {
    try {
      if (!(host instanceof HTMLElement)) return false;
      if (!isHeaderFooterLayoutHost00466_(host)) return false;
      const dir = (val === 'column') ? 'column' : 'row';
      const footerColumnFlow00492 = false; // [00592] removed old footer column flow branch
      const childSizeSnap00469 = footerColumnFlow00492 ? [] : snapshotHeaderFooterChildSizes00469_(host);
      host.dataset.layoutMode = 'flex';
      host.dataset.layoutOrient = dir;
      host.dataset.stLayoutOrientOverride00466 = '1';
      // [00468] Do not freeze Header/Footer host height on orientation change.
      // Vertical layout must expand the selected container and, if needed, its
      // parent row/section instead of clipping children.
      try { delete host.dataset.stLayoutPreserveH00467; } catch (_) {}
      host.style.removeProperty('height');
      host.style.removeProperty('max-height');
      stSetImportant00467_(host, 'display', isHeaderFooterSocialGroup00467_(host) ? 'inline-flex' : 'flex');
      stSetImportant00467_(host, 'flex-direction', dir);
      stSetImportant00467_(host, 'flex-wrap', 'nowrap');
      stSetImportant00467_(host, 'box-sizing', 'border-box');
      stSetImportant00467_(host, 'max-width', '100%');
      stSetImportant00467_(host, 'min-width', '0px');
      containHeaderFooterLayoutHost00467_(host);
      if (footerColumnFlow00492) {
        try { applyFooterColumnFlow00492_(host, 'orientation-before-grow-00492'); } catch (_) {}
      } else {
        applyHeaderFooterChildSizeLock00469_(host, childSizeSnap00469, dir, 'orientation-before-axis');
      }
      growHeaderFooterHostToFitChildren00468_(host, dir, 'orientation');
      if (footerColumnFlow00492) {
        try { applyFooterColumnFlow00492_(host, 'orientation-after-grow-00492'); } catch (_) {}
      }
      if (dir === 'row') { try { shrinkFooterRowBackAfterHorizontal00478_(host); } catch (_) {} }
      if (footerColumnFlow00492) {
        try { window.__ST_FOOTER_REPAIR_COLUMN_ROWS_00493?.(host, 'layout-orientation-00493'); } catch (_) {}
        // [00592] removed footer shell repair call
      }
      if (isHeaderFooterSocialGroup00467_(host)) {
        host.dataset.stSocialGroup = '1';
        host.style.setProperty('--st-social-layout-orient', dir);
      }
      try { window.__ST_PERF_DIAG__?.push?.('layout-orientation-hf-override-00468', { scope: componentScopeOfEl00451_(host), dir, cls: String(host.className || '') }, 'info'); } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  // [00465][LAYOUT ORIENTATION TARGET]
  // Orientation is a children-layout operation. When the user selects a
  // Header/Footer container and presses Vertical/Horizontal, only the direct
  // children inside that selected container must change direction. The old
  // generic getTargetRowsAndBlocks() used the selected block's parent in
  // mode="Блок", so a click on Vertical could flip the whole header/footer
  // level/section instead of the selected container.
  function getOrientationHosts00465_() {
    const active = getActiveLayoutElement_();
    const out = [];
    const push = (el) => { if (el instanceof HTMLElement && !out.includes(el)) out.push(el); };

    try {
      if (active?.classList?.contains('st-section')) {
        Array.from(active.querySelectorAll?.(':scope > .st-row') || []).forEach(push);
        return out;
      }

      if (active?.classList?.contains('st-row')) {
        push(active);
        return out;
      }

      if (active?.classList?.contains('st-block')) {
        if (active.classList.contains('st-block--menu')) {
          const menuRoot = getMenuRootList_(active);
          if (menuRoot) { push(menuRoot); return out; }
        }

        const innerRows = Array.from(active.querySelectorAll?.(':scope > .st-row') || []);
        if (innerRows.length) { innerRows.forEach(push); return out; }

        // Header/Footer containers often have direct .st-block children without
        // an inner .st-row. Use the selected container itself as the flex host.
        const directBlocks = Array.from(active.querySelectorAll?.(':scope > .st-block') || []);
        if (directBlocks.length) { push(active); return out; }

        // Leaf controls (phone/button/logo/icon) can still have visual children
        // such as text + icon. Orientation should affect those inner parts, not
        // climb to the parent level.
        if (hasHeaderFooterLeafVisualChildren_(active)) { push(active); return out; }
      }
    } catch (_) {}

    try {
      const { rows } = getTargetRowsAndBlocks();
      rows.forEach(push);
    } catch (_) {}
    return out;
  }


  // [00799][CONTENT LAYOUT CONTROLS]
  // Stage 8 starts with a clean Content route for orientation and children alignment.
  // It writes only layout intent on the selected Content host. It does not resize
  // children, does not move Content outside the H/M/F order, and does not call old
  // root DOM save for Content commits.
  function isRemovedContentLayoutArea00799_(el) {
    return false;
  }


  function mainSet00799_(el, prop, value, priority = '') {
    try {
      if (!(el instanceof HTMLElement) || !el.style) return false;
      const cur = el.style.getPropertyValue(prop);
      const pri = el.style.getPropertyPriority(prop);
      if (cur === String(value) && String(pri || '') === String(priority || '')) return false;
      el.style.setProperty(prop, String(value), priority || '');
      return true;
    } catch (_) { return false; }
  }

  function mainFlexDir00799_(host) {
    try {
      const raw = String(host?.dataset?.layoutOrient || host?.style?.flexDirection || getComputedStyle(host).flexDirection || 'row').trim();
      return raw === 'column' ? 'column' : 'row';
    } catch (_) { return 'row'; }
  }

  function mainDirectLayoutChildren00799_(host) {
    try {
      if (!(host instanceof HTMLElement)) return [];
      if (host.classList?.contains('st-section')) return Array.from(host.querySelectorAll?.(':scope > .st-row') || []).filter(el => el instanceof HTMLElement);
      if (host.classList?.contains('st-row')) return Array.from(host.querySelectorAll?.(':scope > .st-block') || []).filter(el => el instanceof HTMLElement && !el.classList?.contains('st-resize'));
      if (host.classList?.contains('st-block')) {
        const rows = Array.from(host.querySelectorAll?.(':scope > .st-row') || []).filter(el => el instanceof HTMLElement);
        if (rows.length) return rows;
        return Array.from(host.querySelectorAll?.(':scope > .st-block') || []).filter(el => el instanceof HTMLElement && !el.classList?.contains('st-resize'));
      }
    } catch (_) {}
    return [];
  }

  function clearRemovedContentChildAxisOverrides00799_(children, axis) {
    (children || []).forEach((ch) => {
      try {
        if (!(ch instanceof HTMLElement) || !ch.style) return;
        if (axis === 'x') {
          ch.style.removeProperty('margin-left');
          ch.style.removeProperty('margin-right');
          ch.style.removeProperty('justify-self');
        } else {
          ch.style.removeProperty('margin-top');
          ch.style.removeProperty('margin-bottom');
          ch.style.removeProperty('align-self');
        }
      } catch (_) {}
    });
  }

  function applyRemovedContentFlexOrientation00799_(host, val) {
    try {
      if (!(host instanceof HTMLElement) || !isRemovedContentLayoutArea00799_(host)) return false;
      if (!(host.classList?.contains('st-row') || host.classList?.contains('st-block'))) return false;
      const dir = val === 'column' ? 'column' : 'row';
      host.dataset.layoutMode = 'flex';
      host.dataset.layoutOrient = dir;
      mainSet00799_(host, 'display', 'flex');
      mainSet00799_(host, 'flex-direction', dir);
      mainSet00799_(host, 'flex-wrap', 'nowrap');
      mainSet00799_(host, 'box-sizing', 'border-box');
      mainSet00799_(host, 'min-width', '0px');
      mainSet00799_(host, 'max-width', '100%');
      mainSet00799_(host, 'overflow', 'visible');
      try { mainBoundDirectChildren00801_(host, 'orientation-00801'); } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-orientation-00799', {
          dir,
          children: mainDirectLayoutChildren00799_(host).length,
          cls: String(host.className || '')
        }, 'info');
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function applyRemovedContentChildrenAlign00799_(host, axis, val) {
    try {
      if (!(host instanceof HTMLElement) || !isRemovedContentLayoutArea00799_(host) || !host.style) return false;
      if (!(host.classList?.contains('st-row') || host.classList?.contains('st-block'))) return false;
      const kids = mainDirectLayoutChildren00799_(host);
      if (!kids.length) return false;
      const dir = mainFlexDir00799_(host);

      // [00802][POSITION-ONLY ALIGN]
      // Alignment is not a resize operation. Do not write width/height/flex-basis,
      // do not release a user-resized child to fit-content/100%, and do not run the
      // size boundary pass from children-align. Only axis-positioning properties may
      // change here.
      const sizeBefore00802 = kids.map((ch) => {
        try {
          const st = ch instanceof HTMLElement ? ch.style : null;
          return {
            ch,
            width: st?.getPropertyValue('width') || '',
            height: st?.getPropertyValue('height') || '',
            minWidth: st?.getPropertyValue('min-width') || '',
            minHeight: st?.getPropertyValue('min-height') || '',
            maxWidth: st?.getPropertyValue('max-width') || '',
            maxHeight: st?.getPropertyValue('max-height') || '',
            flex: st?.getPropertyValue('flex') || '',
            flexBasis: st?.getPropertyValue('flex-basis') || ''
          };
        } catch (_) { return { ch }; }
      });

      host.dataset.layoutMode = 'flex';
      host.dataset.layoutOrient = dir;
      if (axis === 'x') host.dataset.stLayoutChildrenAlignX = String(val || '');
      else host.dataset.stLayoutChildrenAlignY = String(val || '');
      mainSet00799_(host, 'display', 'flex');
      mainSet00799_(host, 'flex-direction', dir);
      mainSet00799_(host, 'flex-wrap', 'nowrap');
      mainSet00799_(host, 'box-sizing', 'border-box');
      mainSet00799_(host, 'overflow', 'visible');

      let childPosChanged00802 = 0;
      const isCrossAxis = (axis === 'x' && dir === 'column') || (axis === 'y' && dir === 'row');
      const isPrimaryAxis = !isCrossAxis;

      if (isCrossAxis) {
        // Cross-axis alignment is per-child align-self so host align-items cannot
        // stretch/shrink children with auto sizes.
        if ((axis === 'x' && dir === 'column') || (axis === 'y' && dir === 'row')) {
          try { host.style.removeProperty('align-items'); } catch (_) {}
          try { host.style.removeProperty('align-content'); } catch (_) {}
        }
        kids.forEach((ch) => {
          try {
            if (!(ch instanceof HTMLElement) || !ch.style) return;
            if (axis === 'x') {
              ch.style.removeProperty('margin-left');
              ch.style.removeProperty('margin-right');
              ch.style.removeProperty('justify-self');
            } else {
              ch.style.removeProperty('margin-top');
              ch.style.removeProperty('margin-bottom');
            }
            childPosChanged00802 += mainSet00799_(ch, 'align-self', val) ? 1 : 0;
            ch.style.removeProperty('left');
            ch.style.removeProperty('right');
            ch.style.removeProperty('transform');
            ch.style.removeProperty('text-align');
            ch.querySelectorAll?.('.st-text-edit,[data-st-text-target]').forEach((txt) => {
              try { if (txt instanceof HTMLElement) txt.style.removeProperty('text-align'); } catch (_) {}
            });
          } catch (_) {}
        });
      } else if (isPrimaryAxis) {
        const prop = axis === 'x' ? 'justify-content' : 'justify-content';
        childPosChanged00802 += mainSet00799_(host, prop, val) ? 1 : 0;
      }

      // Restore size-related inline declarations exactly as they were before the
      // align click. This keeps user-resized child width/height stable.
      sizeBefore00802.forEach((snap) => {
        try {
          const ch = snap?.ch;
          if (!(ch instanceof HTMLElement) || !ch.style) return;
          const restore = (prop, value) => {
            if (value) ch.style.setProperty(prop, value);
            else ch.style.removeProperty(prop);
          };
          restore('width', snap.width || '');
          restore('height', snap.height || '');
          restore('min-width', snap.minWidth || '');
          restore('min-height', snap.minHeight || '');
          restore('max-width', snap.maxWidth || '');
          restore('max-height', snap.maxHeight || '');
          restore('flex', snap.flex || '');
          restore('flex-basis', snap.flexBasis || '');
        } catch (_) {}
      });

      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-children-position-only-00802', {
          axis,
          val,
          dir,
          children: kids.length,
          changed: childPosChanged00802,
          sizeWrites: 0,
          host: String(host.className || '')
        }, 'info');
      } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-children-align-00802', {
          axis,
          val,
          dir,
          children: kids.length,
          positionOnly: true,
          cls: String(host.className || '')
        }, 'info');
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function applyRemovedContentSectionRowsAlign00799_(section, axis, val) {
    try {
      if (!(section instanceof HTMLElement) || !section.classList?.contains('st-section') || !isRemovedContentLayoutArea00799_(section)) return false;
      const rows = mainDirectLayoutChildren00799_(section).filter((row) => row.classList?.contains('st-row'));
      if (!rows.length) return false;
      section.dataset.stLayoutRemovedContentSectionRowsAlign00799 = axis + ':' + val;
      section.style.setProperty('box-sizing', 'border-box');
      section.style.setProperty('overflow', 'visible');

      if (axis === 'x') {
        rows.forEach((row) => {
          try {
            row.style.removeProperty('transform');
            if (val === 'center') { row.style.setProperty('margin-left', 'auto'); row.style.setProperty('margin-right', 'auto'); }
            else if (val === 'flex-end') { row.style.setProperty('margin-left', 'auto'); row.style.setProperty('margin-right', '0px'); }
            else { row.style.setProperty('margin-left', '0px'); row.style.setProperty('margin-right', 'auto'); }
            row.style.setProperty('max-width', row.style.maxWidth || '100%');
            row.style.setProperty('min-width', '0px');
          } catch (_) {}
        });
      } else {
        section.style.setProperty('display', 'flex');
        section.style.setProperty('flex-direction', 'column');
        section.style.setProperty('justify-content', val);
        rows.forEach((row) => {
          try {
            row.style.removeProperty('transform');
            row.style.removeProperty('margin-top');
            row.style.removeProperty('margin-bottom');
          } catch (_) {}
        });
      }
      try { rows.forEach((row) => mainBoundDirectChildren00801_(row, 'section-rows-align-00801')); } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-section-rows-align-00799', {
          axis,
          val,
          rows: rows.length,
          cls: String(section.className || '')
        }, 'info');
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }


  // [00801][CONTENT LAYOUT BOUNDARIES + FREE AREA]
  // Stage 8.2: block/container alignment inside Content must use the selected
  // element's own available slot. It must not resize siblings, must not pull
  // neighbours, and must not let a child box escape its parent bounds.
  function mainPx00801_(value, fallback = 0) {
    const n = parseFloat(String(value || '').replace('px', '').trim());
    return Number.isFinite(n) ? n : fallback;
  }

  function mainClamp00801_(value, min, max) {
    const v = Number(value);
    const lo = Number(min);
    const hi = Number(max);
    if (!Number.isFinite(v)) return Number.isFinite(lo) ? lo : 0;
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return v;
    return Math.max(lo, Math.min(hi, v));
  }

  function mainDirectBlocks00801_(host) {
    try {
      return Array.from(host?.children || []).filter((ch) => ch instanceof HTMLElement && ch.classList?.contains('st-block') && !ch.classList?.contains('st-resize') && isRemovedContentLayoutArea00799_(ch));
    } catch (_) { return []; }
  }

  function mainContentWidth00801_(host) {
    try {
      const r = host.getBoundingClientRect?.();
      const cs = getComputedStyle(host);
      const w = Math.max(1, Number(r?.width) || 1);
      return Math.max(1, Math.floor(w - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)));
    } catch (_) { return 1; }
  }

  function mainBoundDirectChildren00801_(host, reason = '') {
    try {
      if (!(host instanceof HTMLElement) || !isRemovedContentLayoutArea00799_(host)) return 0;
      const kids = mainDirectLayoutChildren00799_(host).filter((ch) => ch instanceof HTMLElement);
      if (!kids.length) return 0;
      let changed = 0;
      const maxW = mainContentWidth00801_(host);
      kids.forEach((ch) => {
        try {
          if (!(ch instanceof HTMLElement) || !ch.style) return;
          changed += mainSet00799_(ch, 'box-sizing', 'border-box') ? 1 : 0;
          changed += mainSet00799_(ch, 'min-width', '0px') ? 1 : 0;
          changed += mainSet00799_(ch, 'max-width', '100%') ? 1 : 0;
          changed += mainSet00799_(ch, 'max-height', 'none') ? 1 : 0;
          const rect = ch.getBoundingClientRect?.();
          const cw = Math.ceil(Number(rect?.width) || 0);
          if (cw > maxW + 2) {
            ch.style.setProperty('width', Math.max(1, maxW) + 'px');
            changed++;
          }
        } catch (_) {}
      });
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-bound-children-00801', {
          reason: String(reason || ''),
          host: String(host.className || ''),
          children: kids.length,
          changed
        }, 'info');
      } catch (_) {}
      return changed;
    } catch (_) { return 0; }
  }

  function applyRemovedContentContainerXSlotAlign00801_(block, host, axis, valFlex) {
    try {
      if (!(block instanceof HTMLElement) || !(host instanceof HTMLElement)) return false;
      if (axis !== 'x') return false;
      if (!isRemovedContentLayoutArea00799_(block) || !isRemovedContentLayoutArea00799_(host)) return false;
      if (block.parentElement !== host) return false;
      if (!host.classList?.contains('st-row')) return false;
      const dir = mainFlexDir00799_(host);
      if (dir !== 'row') return false;
      const kids = mainDirectBlocks00801_(host);
      const selectedIndex = kids.indexOf(block);
      if (selectedIndex < 0) return false;

      const hostRect = host.getBoundingClientRect?.();
      const hostW = Math.max(1, Number(hostRect?.width) || 1);
      const hostX = Number(hostRect?.left) || 0;
      const boxes = kids.map((kid) => {
        let r = null;
        try { r = kid.getBoundingClientRect?.(); } catch (_) { r = null; }
        const w = Math.max(1, Number(r?.width) || 1);
        const visualX = Math.max(0, (Number(r?.left) || hostX) - hostX);
        const ownLeft = mainPx00801_(kid.style?.left, 0);
        const layoutX = visualX - ownLeft;
        return { kid, visualX, layoutX, w, ownLeft };
      });

      const selected = boxes[selectedIndex];
      const prev = selectedIndex > 0 ? boxes[selectedIndex - 1] : null;
      const next = selectedIndex < boxes.length - 1 ? boxes[selectedIndex + 1] : null;
      const minGap = Math.max(0, Math.round(mainPx00801_(getComputedStyle(host).columnGap, 0)) || 0);
      const slotLeftRaw = prev ? (prev.visualX + prev.w + minGap) : 0;
      const slotRightRaw = next ? (next.visualX - minGap) : hostW;
      const minLeft = mainClamp00801_(slotLeftRaw, 0, Math.max(0, hostW - selected.w));
      const maxLeftRaw = Math.min(Math.max(0, hostW - selected.w), slotRightRaw - selected.w);
      const maxLeft = Math.max(minLeft, maxLeftRaw);
      let targetLeft = minLeft;
      if (valFlex === 'center') targetLeft = minLeft + ((maxLeft - minLeft) / 2);
      else if (valFlex === 'flex-end') targetLeft = maxLeft;
      targetLeft = mainClamp00801_(targetLeft, minLeft, maxLeft);
      const nextLeftOffset = targetLeft - selected.layoutX;

      host.dataset.layoutMode = 'flex';
      host.dataset.layoutOrient = 'row';
      host.dataset.stRemovedContentContainerXSlot00801 = String(valFlex || 'flex-start');
      mainSet00799_(host, 'display', 'flex');
      mainSet00799_(host, 'flex-direction', 'row');
      mainSet00799_(host, 'flex-wrap', 'nowrap');
      mainSet00799_(host, 'box-sizing', 'border-box');
      mainSet00799_(host, 'min-width', '0px');
      mainSet00799_(host, 'max-width', '100%');
      host.style.removeProperty('grid-template-columns');
      host.style.removeProperty('grid-auto-flow');

      kids.forEach((kid) => {
        try {
          kid.style.removeProperty('transform');
          kid.style.removeProperty('justify-self');
          kid.style.removeProperty('place-self');
          if (kid !== block && kid.dataset?.stRemovedContentContainerXSlot00801) {
            kid.style.removeProperty('position');
            kid.style.removeProperty('left');
            kid.style.removeProperty('right');
            delete kid.dataset.stRemovedContentContainerXSlot00801;
          }
        } catch (_) {}
      });

      block.style.setProperty('box-sizing', 'border-box');
      block.style.setProperty('min-width', '0px');
      block.style.setProperty('max-width', '100%');
      block.style.setProperty('position', 'relative');
      block.style.setProperty('left', (Math.round(nextLeftOffset * 100) / 100) + 'px');
      block.style.setProperty('right', 'auto');
      block.style.removeProperty('transform');
      block.style.removeProperty('justify-self');
      block.style.removeProperty('place-self');
      block.dataset.stRemovedContentContainerXSlot00801 = String(valFlex || 'flex-start');
      mainBoundDirectChildren00801_(host, 'container-x-slot-align-00801');

      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-container-x-slot-align-00801', {
          axis,
          val: valFlex,
          children: kids.length,
          selectedIndex,
          hostW: Math.round(hostW),
          slot: { left: Math.round(minLeft), right: Math.round(maxLeft), target: Math.round(targetLeft) },
          offsetLeft: Math.round(nextLeftOffset),
          cls: String(block.className || '')
        }, 'info');
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function applyRemovedContentSelectedBlockAlign00801_(target, host, axis, valFlex) {
    try {
      if (!(target instanceof HTMLElement) || !(host instanceof HTMLElement)) return false;
      if (!isRemovedContentLayoutArea00799_(target) || !isRemovedContentLayoutArea00799_(host)) return false;
      if (target.classList?.contains('st-section')) return false;
      if (target.classList?.contains('st-row')) return false;
      if (axis === 'x' && applyRemovedContentContainerXSlotAlign00801_(target, host, axis, valFlex)) return true;
      if (axis === 'y') {
        target.style.removeProperty('margin-top');
        target.style.removeProperty('margin-bottom');
        target.style.removeProperty('transform');
        target.style.setProperty('align-self', valFlex);
        target.dataset.stRemovedContentBlockYAlign00801 = String(valFlex || '');
        mainBoundDirectChildren00801_(host, 'block-y-align-00801');
        try {
          window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-block-y-align-00801', {
            axis,
            val: valFlex,
            cls: String(target.className || ''),
            host: String(host.className || '')
          }, 'info');
        } catch (_) {}
        return true;
      }
      return false;
    } catch (_) { return false; }
  }

  // Орієнтація
  const orientGroup = sectionEl.querySelector('[data-layout-orient]');
  orientGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.design-pill');
    if (!btn) return;

    orientGroup.querySelectorAll('.design-pill').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const val = btn.dataset.val; // 'row' | 'column'
    const rows = getOrientationHosts00465_();


  rows.forEach(row => {
  // 🔹 записуємо орієнтацію в dataset, щоб canvas знав, як малювати DnD-лінії
  row.dataset.layoutOrient = val; // 'row' = горизонталь, 'column' = вертикаль

  // [00799] Content layout orientation has its own clean route.
  if (applyRemovedContentFlexOrientation00799_(row, val)) return;

  // [00466] Header/Footer must obey the selected host, not old builder CSS.
  // This branch is intentionally before FR/GRID logic because H/F rows are
  // rendered by builder CSS as flex even when old saved dataset says fr.
  if (applyHeaderFooterFlexOrientation00466_(row, val)) return;

  // Для контейнерів у Header/Footer (де немає .st-row) — працюємо як FLEX-хост
  const modeNow = row.dataset.layoutMode || (isRowEl_(row) ? 'fr' : 'flex');
  if (!isRowEl_(row)) {
    ensureFlexHost_(row);
    row.style.flexDirection = (val === 'column') ? 'column' : 'row';
    return;
  }

  // ✅ діти цього row (прямі блоки)
  const childBlocks = [...row.querySelectorAll(':scope > .st-block')];

  // --- FR mode: керуємо grid/fr логікою (як було)
  if (modeNow === 'fr') {
    if (val === 'row') {
      // Горизонтальний режим
      row.style.gridAutoFlow = 'column';

      // ✅ 2) При поверненні в row НЕ можна лишати "1fr" або пустий стан.
      // Відновлюємо попередній gridTemplateColumns (який був до "column"),
      // а якщо його нема — ставимо рівномірно.
      const prevCols = row.dataset.layoutGridColsPrev;
      if (prevCols && prevCols.trim()) {
        row.style.gridTemplateColumns = prevCols;
      } else {
        const n = Math.max(1, childBlocks.length);
        row.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
      }
    } else {
      // Вертикальний режим
      // ✅ 1) Зберігаємо поточний розподіл колонок перед переходом у column
      row.dataset.layoutGridColsPrev = row.style.gridTemplateColumns || '';

      row.style.gridAutoFlow = 'row';
      row.style.gridTemplateColumns = '1fr';

      // Якщо у предків була фіксована height — заважає росту
      // (не чіпаємо ширину/режими)
      let p = row;
      while (p && p !== document.body) {
        if (p.classList?.contains('st-section') || p.classList?.contains('st-block')) {
          if (p.style && p.style.height) p.style.height = '';
        }
        p = p.parentElement;
      }
    }
    // FR не використовує flexDirection
    row.style.flexDirection = '';
    return;
  }

  // --- FLEX mode: орієнтація = flex-direction
  if (modeNow === 'flex') {
    // ✅ Зберігаємо орієнтацію в dataset, щоб CSS/інші віджети могли стабільно
    // розрізняти ROW vs STACK (без аналізу inline-style).
    row.dataset.layoutOrient = (val === 'column') ? 'column' : 'row';
    row.style.flexDirection = (val === 'column') ? 'column' : 'row';
    return;
  }

  // --- GRID mode: орієнтація не керує сіткою (щоб не ламати grid-template-columns)
  // Просто зберігаємо dataset.layoutOrient (для майбутніх гідів/логіки), без inline-стилів.
  row.style.flexDirection = '';
});

    try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
    persistLayoutChange_('layout-orient-change');
  });



  // Вирівнювання: 2 групи
  // 1) Горизонталь (left/center/right) -> justify-content (FLEX/FR) або justify-items (GRID)
  const justifyGroup = sectionEl.querySelector('[data-layout-justify]');

  function layoutFlexToGrid_(valFlex) {
    return (valFlex === 'flex-start') ? 'start' : (valFlex === 'flex-end') ? 'end' : valFlex;
  }

  function setActiveAlignBtn_(group, val) {
    if (!group) return;
    group.querySelectorAll('.design-pill').forEach(b => b.classList.remove('is-active'));
    const btn = group.querySelector(`.design-pill[data-val="${val}"]`);
    if (btn) btn.classList.add('is-active');
  }

  function menuInlineNeededWidth00654_(list) {
    try {
      if (!(list instanceof HTMLElement)) return 0;
      const items = Array.from(list.children || []).filter(ch => ch instanceof HTMLElement);
      let total = 0;
      items.forEach((item) => {
        const link = item.matches?.('.st-menu__link') ? item : item.querySelector?.(':scope > .st-menu__link');
        const r = (link instanceof HTMLElement ? link : item).getBoundingClientRect?.();
        total += Math.max(0, Math.ceil(Number(r?.width) || 0));
      });
      const cs = getComputedStyle(list);
      const gap = Math.max(0, parseFloat(cs.columnGap || cs.gap || '0') || 0);
      if (items.length > 1) total += gap * (items.length - 1);
      const pad = (parseFloat(cs.paddingLeft || '0') || 0) + (parseFloat(cs.paddingRight || '0') || 0);
      return Math.ceil(total + pad);
    } catch (_) { return 0; }
  }

  function parentInnerWidth00654_(el) {
    try {
      const parent = el?.parentElement;
      if (!(parent instanceof HTMLElement)) return 0;
      const pr = parent.getBoundingClientRect?.();
      const pcs = getComputedStyle(parent);
      const pad = (parseFloat(pcs.paddingLeft || '0') || 0) + (parseFloat(pcs.paddingRight || '0') || 0);
      return Math.max(0, Math.floor((Number(pr?.width) || 0) - pad));
    } catch (_) { return 0; }
  }

  function resetMenuNaturalHeight00655_(menuBlock, list = null) {
    try {
      if (!(menuBlock instanceof HTMLElement)) return false;
      const forcedNatural = true;
      const navs = [];
      const rootList = list instanceof HTMLElement ? list : getMenuRootList_(menuBlock);
      menuBlock.querySelectorAll?.(':scope > .st-menu, :scope > nav.st-menu, :scope .st-menu--big').forEach((nav) => {
        if (nav instanceof HTMLElement && !navs.includes(nav)) navs.push(nav);
      });
      if (forcedNatural || !hasExplicitLayoutHeight_(menuBlock)) {
        menuBlock.dataset.stLayoutMenuCompactH00655 = '1';
        menuBlock.style.removeProperty('--st-footer-manual-h');
        menuBlock.style.removeProperty('--st-header-manual-h');
        menuBlock.style.removeProperty('--st-layout-child-h-00469');
        menuBlock.style.setProperty('height', 'auto', 'important');
        menuBlock.style.setProperty('min-height', '0px', 'important');
        menuBlock.style.setProperty('max-height', 'none', 'important');
      }
      navs.forEach((nav) => {
        try {
          nav.dataset.stLayoutMenuCompactH00655 = '1';
          nav.style.setProperty('height', 'auto', 'important');
          nav.style.setProperty('min-height', '0px', 'important');
          nav.style.setProperty('max-height', 'none', 'important');
          nav.style.setProperty('align-self', 'center', 'important');
        } catch (_) {}
      });
      if (rootList instanceof HTMLElement) {
        rootList.dataset.stLayoutMenuCompactH00655 = '1';
        rootList.style.setProperty('height', 'auto', 'important');
        rootList.style.setProperty('min-height', '0px', 'important');
        rootList.style.setProperty('max-height', 'none', 'important');
        rootList.style.setProperty('align-content', 'center', 'important');
      }
      return true;
    } catch (_) { return false; }
  }


  function stripHeaderFooterAlignHeightStretch00657_(el, reason = '') {
    try {
      if (!(el instanceof HTMLElement) || !el.style || !isHeaderFooterArea_(el)) return false;
      const clearOne = (node) => {
        try {
          if (!(node instanceof HTMLElement) || !node.style) return;
          const d = node.dataset || {};
          // Old footer/menu align branches used these flags/values to make children fill
          // the whole row/container height. Alignment must never change height.
          try { delete d.stFooterManualH00477; } catch (_) {}
          try { delete d.stLayoutChildH00469; } catch (_) {}
          try { delete d.stLayoutMenuTall00479; } catch (_) {}
          try { node.removeAttribute('data-st-keep-manual-height'); } catch (_) {}
          const h = String(node.style.height || '').trim();
          const mh = String(node.style.minHeight || '').trim();
          const xh = String(node.style.maxHeight || '').trim();
          const bad = (v) => !v || v === '100%' || v === 'auto' || v === 'stretch' || /^var\(--st-(footer|header|layout).*h/i.test(v);
          if (bad(h) || h === 'inherit') node.style.removeProperty('height');
          if (bad(mh) || mh === 'inherit') node.style.removeProperty('min-height');
          if (bad(xh) || xh === 'inherit') node.style.removeProperty('max-height');
          node.style.setProperty('box-sizing', 'border-box', 'important');
          node.dataset.stLayoutNoHeightStretch00657 = '1';
        } catch (_) {}
      };
      clearOne(el);
      el.querySelectorAll?.(':scope > .st-row, :scope > .st-block, :scope .st-block--menu, :scope .st-menu, :scope .st-menu__list').forEach(clearOne);
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-height-stretch-removed-00657', {
          scope: componentScopeOfEl00451_(el), reason, cls: String(el.className || '')
        }, 'info');
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }


  function snapshotHeaderFooterAlignHeights00658_(root, reason = '') {
    try {
      if (!(root instanceof HTMLElement) || !isHeaderFooterArea_(root)) return [];
      const nodes = [];
      const add = (el) => {
        try {
          if (!(el instanceof HTMLElement) || nodes.includes(el)) return;
          if (!isHeaderFooterArea_(el)) return;
          const r = el.getBoundingClientRect?.();
          const h = Math.max(1, Math.round(Number(r?.height) || el.offsetHeight || 0));
          if (!h) return;
          nodes.push(el);
        } catch (_) {}
      };
      add(root);
      getHeaderFooterDirectChildren_(root).forEach(add);
      root.querySelectorAll?.(':scope > .st-row, :scope > .st-block, :scope .st-block--menu, :scope .st-menu, :scope .st-menu__list').forEach(add);
      const snaps = nodes.map((el) => {
        const r = el.getBoundingClientRect?.();
        return {
          el,
          h: Math.max(1, Math.round(Number(r?.height) || el.offsetHeight || 1)),
          height: el.style.height || '',
          minHeight: el.style.minHeight || '',
          maxHeight: el.style.maxHeight || '',
          alignSelf: el.style.alignSelf || '',
          flex: el.style.flex || '',
          flexBasis: el.style.flexBasis || '',
          flexGrow: el.style.flexGrow || '',
          flexShrink: el.style.flexShrink || ''
        };
      });
      try { root.dataset.stLayoutNoHeightChangeAlign00658 = '1'; } catch (_) {}
      return snaps;
    } catch (_) { return []; }
  }

  function restoreHeaderFooterAlignHeights00658_(snaps, reason = '') {
    try {
      if (!Array.isArray(snaps) || !snaps.length) return false;
      let changed = 0;
      snaps.forEach((snap) => {
        try {
          const el = snap?.el;
          if (!(el instanceof HTMLElement) || !el.style || !isHeaderFooterArea_(el)) return;
          stripHeaderFooterAlignHeightStretch00657_(el, 'restore-invariant-' + reason);
          const beforeH = Math.max(1, Math.round(Number(snap.h) || 1));
          const afterH = Math.max(1, Math.round(Number(el.getBoundingClientRect?.().height) || el.offsetHeight || beforeH));
          const isMenuPart = !!el.closest?.('.st-block--menu') || el.classList?.contains('st-block--menu') || el.classList?.contains('st-menu') || el.classList?.contains('st-menu__list');
          if (isMenuPart) {
            resetMenuNaturalHeight00655_(el.classList?.contains('st-block--menu') ? el : el.closest?.('.st-block--menu'));
          }
          // Alignment is a position operation. It must not resize Header/Footer rows,
          // containers, blocks or menu wrappers. If any older CSS/JS stretch path changes
          // height, rollback the visible height immediately.
          if (Math.abs(afterH - beforeH) > 1) {
            el.style.setProperty('height', beforeH + 'px', 'important');
            el.style.setProperty('min-height', beforeH + 'px', 'important');
            el.style.setProperty('max-height', 'none', 'important');
            el.dataset.stLayoutAlignHeightInvariant00658 = '1';
            changed++;
          }
        } catch (_) {}
      });
      if (changed) {
        try { window.__ST_PERF_DIAG__?.push?.('layout-hf-align-height-invariant-00658', { reason, changed }, 'info'); } catch (_) {}
      }
      return changed > 0;
    } catch (_) { return false; }
  }

  function withHeaderFooterNoHeightChange00658_(root, reason, fn) {
    const snaps = snapshotHeaderFooterAlignHeights00658_(root, reason);
    let res = false;
    try { res = !!fn?.(); } catch (_) { res = false; }
    try { restoreHeaderFooterAlignHeights00658_(snaps, reason); } catch (_) {}
    try { requestAnimationFrame(() => { try { restoreHeaderFooterAlignHeights00658_(snaps, reason + '-raf'); } catch (_) {} }); } catch (_) {}
    return res;
  }

  function snapshotHeaderFooterAlignBoxes00659_(root, reason = '') {
    try {
      if (!(root instanceof HTMLElement) || !isHeaderFooterArea_(root)) return [];
      const nodes = [];
      const add = (el) => {
        try {
          if (!(el instanceof HTMLElement) || !el.style || nodes.includes(el)) return;
          if (!isHeaderFooterArea_(el)) return;
          const r = el.getBoundingClientRect?.();
          const w = Math.max(1, Math.round(Number(r?.width) || el.offsetWidth || 0));
          const h = Math.max(1, Math.round(Number(r?.height) || el.offsetHeight || 0));
          if (!w || !h) return;
          nodes.push(el);
        } catch (_) {}
      };
      add(root);
      getHeaderFooterDirectChildren_(root).forEach(add);
      root.querySelectorAll?.([
        ':scope > .st-row', ':scope > .st-block', ':scope .st-block--menu',
        ':scope .st-menu', ':scope .st-menu__list', ':scope .st-text-edit',
        ':scope .st-phone__text', ':scope .st-button__label', ':scope .st-icon-btn',
        ':scope .st-icon-svg', ':scope .st-png__media'
      ].join(',')).forEach(add);
      const props = [
        'width','minWidth','maxWidth','height','minHeight','maxHeight',
        'flex','flexBasis','flexGrow','flexShrink','aspectRatio','boxSizing','overflow',
        'display','alignSelf','justifySelf','marginLeft','marginRight','marginTop','marginBottom',
        'transform'
      ];
      const vars = [
        '--st-layout-child-w-00469','--st-layout-child-h-00469',
        '--st-layout-child-dx','--st-layout-child-dy','--st-layout-block-dx','--st-layout-block-dy',
        '--st-footer-manual-w','--st-footer-manual-h','--st-footer-direct-w-00592','--st-footer-direct-h-00592',
        '--st-header-manual-w','--st-header-manual-h','--st-header-clean-w-00638','--st-header-clean-h-00638'
      ];
      return nodes.map((el) => {
        const r = el.getBoundingClientRect?.();
        const st = {};
        props.forEach((k) => { try { st[k] = el.style[k] || ''; } catch (_) {} });
        vars.forEach((k) => { try { st[k] = el.style.getPropertyValue(k) || ''; } catch (_) {} });
        return {
          el,
          w: Math.max(1, Math.round(Number(r?.width) || el.offsetWidth || 1)),
          h: Math.max(1, Math.round(Number(r?.height) || el.offsetHeight || 1)),
          st
        };
      });
    } catch (_) { return []; }
  }

  function restoreHeaderFooterAlignBoxes00659_(snaps, reason = '') {
    try {
      if (!Array.isArray(snaps) || !snaps.length) return false;
      let changedW = 0;
      let changedH = 0;
      snaps.forEach((snap) => {
        try {
          const el = snap?.el;
          if (!(el instanceof HTMLElement) || !el.style || !isHeaderFooterArea_(el)) return;
          const st = snap.st || {};
          const beforeW = Math.max(1, Math.round(Number(snap.w) || 1));
          const beforeH = Math.max(1, Math.round(Number(snap.h) || 1));
          const r = el.getBoundingClientRect?.();
          const afterW = Math.max(1, Math.round(Number(r?.width) || el.offsetWidth || beforeW));
          const afterH = Math.max(1, Math.round(Number(r?.height) || el.offsetHeight || beforeH));

          if (Math.abs(afterW - beforeW) > 1) {
            // [00659] Width invariant: align may change position/justify, never size.
            if (st.width) el.style.setProperty('width', st.width, 'important');
            else el.style.setProperty('width', beforeW + 'px', 'important');
            if (st.minWidth) el.style.setProperty('min-width', st.minWidth, 'important');
            else el.style.setProperty('min-width', '0px', 'important');
            if (st.maxWidth) el.style.setProperty('max-width', st.maxWidth, 'important');
            else el.style.setProperty('max-width', '100%', 'important');
            if (st.flex) el.style.setProperty('flex', st.flex, 'important');
            else el.style.setProperty('flex', '0 0 ' + beforeW + 'px', 'important');
            if (st.flexBasis) el.style.setProperty('flex-basis', st.flexBasis, 'important');
            else el.style.setProperty('flex-basis', beforeW + 'px', 'important');
            if (st.flexGrow) el.style.setProperty('flex-grow', st.flexGrow, 'important');
            else el.style.setProperty('flex-grow', '0', 'important');
            if (st.flexShrink) el.style.setProperty('flex-shrink', st.flexShrink, 'important');
            else el.style.setProperty('flex-shrink', '0', 'important');
            try { el.dataset.stLayoutAlignSizeInvariant00659 = '1'; } catch (_) {}
            changedW++;
          }

          if (Math.abs(afterH - beforeH) > 1) {
            stripHeaderFooterAlignHeightStretch00657_(el, 'restore-box-invariant-' + reason);
            if (st.height) el.style.setProperty('height', st.height, 'important');
            else el.style.setProperty('height', beforeH + 'px', 'important');
            if (st.minHeight) el.style.setProperty('min-height', st.minHeight, 'important');
            else el.style.setProperty('min-height', beforeH + 'px', 'important');
            if (st.maxHeight) el.style.setProperty('max-height', st.maxHeight, 'important');
            else el.style.setProperty('max-height', 'none', 'important');
            try { el.dataset.stLayoutAlignHeightInvariant00658 = '1'; } catch (_) {}
            changedH++;
          }
        } catch (_) {}
      });
      if (changedW || changedH) {
        try { window.__ST_PERF_DIAG__?.push?.('layout-hf-align-box-invariant-00659', { reason, changedW, changedH }, 'info'); } catch (_) {}
      }
      return (changedW + changedH) > 0;
    } catch (_) { return false; }
  }

  function withHeaderFooterNoBoxChange00659_(root, reason, fn) {
    const boxSnaps = snapshotHeaderFooterAlignBoxes00659_(root, reason);
    const hSnaps = snapshotHeaderFooterAlignHeights00658_(root, reason);
    let res = false;
    try { res = !!fn?.(); } catch (_) { res = false; }
    try { restoreHeaderFooterAlignHeights00658_(hSnaps, reason); } catch (_) {}
    try { restoreHeaderFooterAlignBoxes00659_(boxSnaps, reason); } catch (_) {}
    try { requestAnimationFrame(() => {
      try { restoreHeaderFooterAlignHeights00658_(hSnaps, reason + '-raf'); } catch (_) {}
      try { restoreHeaderFooterAlignBoxes00659_(boxSnaps, reason + '-raf'); } catch (_) {}
    }); } catch (_) {}
    return res;
  }

  // [00660] REMOVED: position-only children align via transform.
  // It visually overlaid Header/Footer children on top of neighbours because
  // transform does not participate in flex/grid layout. Alignment must be done
  // through the parent flex model or internal text/menu alignment only.
  function applyHeaderFooterPositionOnlyChildrenAlign00659_() {
    return false;
  }

  function applyHeaderFooterLeafVisualContentNoResize00659_(child, axis, val) {
    try {
      if (!(child instanceof HTMLElement) || !isHeaderFooterArea_(child)) return false;
      const visuals = getHeaderFooterLeafVisualChildren_(child);
      if (!visuals.length) return false;
      if (axis === 'x') {
        const textVal = val === 'flex-end' ? 'right' : (val === 'center' ? 'center' : 'left');
        child.style.setProperty('text-align', textVal, 'important');
        visuals.forEach((v) => {
          try {
            if (!(v instanceof HTMLElement) || !v.style) return;
            v.style.setProperty('max-width', '100%', 'important');
            v.style.setProperty('box-sizing', 'border-box', 'important');
            if (val === 'center') { v.style.marginLeft = 'auto'; v.style.marginRight = 'auto'; }
            else if (val === 'flex-end') { v.style.marginLeft = 'auto'; v.style.marginRight = '0px'; }
            else { v.style.marginLeft = '0px'; v.style.marginRight = 'auto'; }
          } catch (_) {}
        });
      }
      child.dataset.stLayoutLeafVisualNoResize00659 = '1';
      return true;
    } catch (_) { return false; }
  }

  function hardContainMenuBlock00654_(menuBlock, list) {
    try {
      if (!(menuBlock instanceof HTMLElement)) return false;
      // [00659] Align is not resize. The old 00654 helper enlarged the menu block
      // to the menu content width (`needed > current => width = needed`). That is
      // exactly why a footer menu/container became wider while the user only asked
      // to align children. Keep containment/height cleanup, but never write width,
      // flex or flex-basis from this path.
      menuBlock.style.setProperty('box-sizing', 'border-box', 'important');
      menuBlock.style.setProperty('min-width', '0px', 'important');
      menuBlock.style.setProperty('max-width', '100%', 'important');
      menuBlock.style.setProperty('overflow', 'visible', 'important');
      resetMenuNaturalHeight00655_(menuBlock, list);
      try { menuBlock.dataset.stLayoutMenuNoWidthGrow00659 = '1'; } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function parseMenuLevelContentLayoutMapForScope_(menuBlock) {
    try {
      const raw = String(menuBlock?.dataset?.menuLevelContentLayoutStyles || '').trim();
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function menuBlockShouldFillWidth00652_(menuBlock) {
    try {
      if (!(menuBlock instanceof HTMLElement)) return false;
      const st = menuBlock.style || {};
      const w = String(st.width || '').trim();
      const flex = String(st.flex || '').trim();
      const basis = String(st.flexBasis || '').trim();
      const growInline = String(st.flexGrow || '').trim();
      const cs = getComputedStyle(menuBlock);
      const grow = Number(growInline || cs.flexGrow || 0) || 0;
      if (w === '100%' || /calc\(|vw|%$/.test(w)) return true;
      if (basis === '100%' || /%$/.test(basis)) return true;
      if (grow > 0) return true;
      if (/^1\s+1|\s1\s+1\s/.test(flex) || /auto/.test(flex) && grow > 0) return true;
      return false;
    } catch (_) { return false; }
  }

  function repairMenuRootListNoCollapse00652_(menuBlock, patch = {}) {
    try {
      if (!(menuBlock instanceof HTMLElement)) return false;
      const list = getMenuRootList_(menuBlock);
      if (!(list instanceof HTMLElement)) return false;
      const nav = list.closest?.('.st-menu');
      // [00654] Alignment is not allowed to rediscover an old computed "column"
      // from a previous broken pass. The direction source of truth is explicit
      // menu dataset; otherwise the currently selected Layout orientation.
      // [00655] Children-align must never read the global Layout orientation UI.
      // Aligning menu children changes justify/align only; direction is preserved
      // from explicit menu state, otherwise defaults to horizontal row.
      const dirRaw = String(menuBlock.dataset?.menuLevel1Direction || menuBlock.getAttribute?.('data-menu-level1-direction') || 'row').trim();
      const dir = dirRaw === 'column' ? 'column' : 'row';
      const fill = menuBlockShouldFillWidth00652_(menuBlock);
      try {
        menuBlock.dataset.menuLevel1Direction = dir;
        menuBlock.setAttribute('data-menu-level1-direction', dir);
        list.dataset.layoutOrient = dir;
      } catch (_) {}

      menuBlock.dataset.stLayoutMenuNoWrap00654 = '1';
      list.dataset.stLayoutMenuNoWrap00654 = '1';
      list.dataset.stLayoutProxy = 'menu-root-list';
      list.dataset.menuListDepth = '1';
      list.style.setProperty('display', 'flex');
      list.style.setProperty('flex-direction', dir);
      list.style.setProperty('box-sizing', 'border-box');
      list.style.setProperty('max-width', '100%');
      list.style.setProperty('min-width', '0px');
      if (dir === 'row') {
        // [00654] Never wrap a horizontal HF menu during children-align. Wrapping is
        // exactly what turned Work/About/Contact into a narrow vertical line.
        list.style.setProperty('flex-wrap', 'nowrap', 'important');
        list.style.setProperty('width', fill ? '100%' : 'max-content', 'important');
      } else {
        list.style.setProperty('flex-wrap', 'nowrap', 'important');
        list.style.setProperty('width', fill ? '100%' : 'auto', 'important');
      }
      if (nav instanceof HTMLElement) {
        nav.style.setProperty('box-sizing', 'border-box');
        nav.style.setProperty('max-width', '100%');
        nav.style.setProperty('min-width', '0px');
        nav.style.setProperty('width', fill ? '100%' : (dir === 'row' ? 'max-content' : 'auto'), 'important');
      }
      Array.from(list.children || []).forEach((item) => {
        try {
          if (!(item instanceof HTMLElement)) return;
          item.style.setProperty('flex', '0 0 auto', 'important');
          item.style.setProperty('width', 'auto', 'important');
          item.style.setProperty('max-width', 'none', 'important');
          const link = item.matches?.('.st-menu__link') ? item : item.querySelector?.(':scope > .st-menu__link');
          if (link instanceof HTMLElement) {
            link.style.setProperty('display', 'inline-flex', 'important');
            link.style.setProperty('width', 'auto', 'important');
            link.style.setProperty('min-width', 'max-content', 'important');
            link.style.setProperty('max-width', 'none', 'important');
            link.style.setProperty('white-space', 'nowrap', 'important');
          }
        } catch (_) {}
      });
      hardContainMenuBlock00654_(menuBlock, list);
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-menu-children-compact-no-collapse-00655', {
          scope: componentScopeOfEl00451_(menuBlock),
          dir,
          fill,
          axis: patch.justify != null ? 'x' : (patch.align != null ? 'y' : ''),
          justify: patch.justify || '',
          align: patch.align || '',
          cls: String(menuBlock.className || '')
        }, 'info');
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function writeMenuLevel1LayoutPatch_(menuBlock, patch = {}) {
    if (!menuBlock || !menuBlock.dataset) return;
    const map = parseMenuLevelContentLayoutMapForScope_(menuBlock);
    const l1 = (map['1'] && typeof map['1'] === 'object') ? { ...map['1'] } : {};
    Object.entries(patch || {}).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') delete l1[key];
      else l1[key] = String(value);
    });
    map['1'] = l1;
    menuBlock.dataset.menuLevelContentLayoutStyles = JSON.stringify(map);

    // Дзеркала для старого runtime/попередніх частин віджета меню.
    if (patch.justify != null) menuBlock.dataset.menuRootJustify = String(patch.justify);
    if (patch.align != null) menuBlock.dataset.menuRootAlign = String(patch.align);
    if (patch.gap != null) menuBlock.dataset.menuRootGap = String(patch.gap);
    if (patch.px != null) menuBlock.dataset.menuRootPadX = String(patch.px);
    if (patch.py != null) menuBlock.dataset.menuRootPadY = String(patch.py);

    const list = getMenuRootList_(menuBlock);
    if (list) {
      // [00652] Prepare the root list without forcing width:100% on auto-sized
      // footer/header menu blocks. width:100% inside an auto flex item collapses
      // the menu to min-content, so buttons become a narrow vertical stack.
      repairMenuRootListNoCollapse00652_(menuBlock, patch);
      const nav = list.closest?.('.st-menu');

      if (patch.justify != null) {
        menuBlock.style.setProperty('--st-menu-root-justify', String(patch.justify));
        list.style.justifyContent = String(patch.justify);
      }
      if (patch.align != null) {
        menuBlock.style.setProperty('--st-menu-root-align', String(patch.align));
        list.style.alignItems = String(patch.align);
        // [00655] Removed the old vertical-fill branch permanently. Children-align
        // must not write height/min-height:100% into a menu; that made the footer
        // menu block grow taller than its parent after center/left/right align.
        list.style.setProperty('min-height', '0px', 'important');
        list.style.setProperty('height', 'auto', 'important');
        list.style.setProperty('max-height', 'none', 'important');
        if (nav instanceof HTMLElement) {
          nav.style.setProperty('min-height', '0px', 'important');
          nav.style.setProperty('height', 'auto', 'important');
          nav.style.setProperty('max-height', 'none', 'important');
        }
        resetMenuNaturalHeight00655_(menuBlock, list);
      }
      if (patch.gap != null) {
        const px = Math.max(0, Math.min(64, Math.round(Number(patch.gap) || 0)));
        menuBlock.style.setProperty('--st-menu-root-gap', px + 'px');
        menuBlock.style.setProperty('--st-menu-gap', px + 'px');
        list.style.gap = px + 'px';
      }
      if (patch.px != null || patch.py != null) {
        const curPx = Number(menuBlock.dataset.menuRootPadX || 0) || 0;
        const curPy = Number(menuBlock.dataset.menuRootPadY || 0) || 0;
        menuBlock.style.setProperty('--st-menu-root-pad-x', curPx + 'px');
        menuBlock.style.setProperty('--st-menu-root-pad-y', curPy + 'px');
        list.style.padding = `${curPy}px ${curPx}px`;
      }
    }
  }

  function getMenuItemTargetFromRaw_() {
    const raw = getRawSelectionElements_();
    for (const el of raw) {
      if (!el || !el.closest) continue;
      const item = el.closest('.st-menu__item');
      if (item) return item;
    }
    return null;
  }

  function getPrimarySelectedBlock_() {
    const active = getActiveLayoutElement_();
    if (active) return active;

    const raw = getRawSelectionElements_();
    for (const el of raw) {
      const n = normalizeLayoutSelectable_(el);
      if (n && isLayoutSelectable_(n)) return n;
    }
    return null;
  }

  function hasDirectLayoutChildren_(el) {
    try {
      if (!el || !el.querySelector) return false;

      // 00244: MENU BLOCK + "Діти" must target menu buttons/items, not the parent container.
      // Before this fix .st-block--menu was considered a leaf because it has no direct
      // .st-block children. getPrimaryChildrenHost_ then climbed to the header container,
      // so horizontal align moved the whole menu block instead of the menu buttons.
      if (el.classList?.contains('st-block--menu')) {
        const list = getMenuRootList_(el);
        return !!(list && Array.from(list.children || []).some(ch => ch instanceof HTMLElement));
      }

      if (hasHeaderFooterLeafVisualChildren_(el)) return true;

      if (el.classList?.contains('st-section')) return !!el.querySelector(':scope > .st-row');
      if (el.classList?.contains('st-row')) return !!el.querySelector(':scope > .st-block');
      if (el.classList?.contains('st-block')) return !!el.querySelector(':scope > .st-row, :scope > .st-block');
    } catch (_) {}
    return false;
  }

  function getPrimaryChildrenHost_() {
    // 00243: окремо для режиму «Діти».
    // Не повторюємо помилку 00242, де глобально брали найглибший active і через це
    // інспектор міг редагувати меню/текст замість контейнера. Тут обираємо саме ХОСТ,
    // який має дітей першого рівня. Якщо active = leaf, піднімаємось до найближчого
    // батьківського .st-block/.st-row з прямими дітьми.
    // 00274: якщо користувач реально активував top-container шапки/футера, режим
    // «Діти» має редагувати його прямі блоки (лого/меню/телефон/кнопку), а не
    // випадково провалюватись у меню/текст через залишкові selected-класи.
    const preferredHeaderHost = getPreferredActiveHeaderFooterChildrenHost_();
    if (preferredHeaderHost) return preferredHeaderHost;

    const primary = getPrimarySelectedBlock_();
    if (primary && hasDirectLayoutChildren_(primary)) return primary;

    let n = primary?.parentElement || null;
    while (n && n !== document.body) {
      if (isLayoutSelectable_(n) && hasDirectLayoutChildren_(n)) return n;
      n = n.parentElement;
    }

    const raw = getRawSelectionElements_().map(normalizeLayoutSelectable_).filter(Boolean);
    const candidates = [];
    raw.forEach(el => {
      if (isLayoutSelectable_(el)) candidates.push(el);
      let p = el?.parentElement || null;
      while (p && p !== document.body) {
        if (isLayoutSelectable_(p)) candidates.push(p);
        p = p.parentElement;
      }
    });
    return candidates.find(hasDirectLayoutChildren_) || primary || null;
  }

  function getDirectLayoutChildren_(hostEl) {
    if (!hostEl || !hostEl.querySelectorAll) return [];
    if (hostEl.classList?.contains('st-block--menu')) {
      const list = getMenuRootList_(hostEl);
      return list ? Array.from(list.children).filter(ch => ch instanceof HTMLElement) : [];
    }
    if (hasHeaderFooterLeafVisualChildren_(hostEl)) {
      return getHeaderFooterLeafVisualChildren_(hostEl);
    }
    if (hostEl.classList?.contains('st-section')) {
      return Array.from(hostEl.querySelectorAll(':scope > .st-row')).filter(Boolean);
    }
    if (hostEl.classList?.contains('st-row')) {
      return Array.from(hostEl.querySelectorAll(':scope > .st-block')).filter(Boolean);
    }
    if (hostEl.classList?.contains('st-block')) {
      const innerRow = hostEl.querySelector(':scope > .st-row');
      if (innerRow) return Array.from(innerRow.querySelectorAll(':scope > .st-block')).filter(Boolean);
      return Array.from(hostEl.querySelectorAll(':scope > .st-block')).filter(Boolean);
    }
    return [];
  }

  function clearDirectChildrenAxisOverrides_(children, axis) {
    (children || []).forEach(ch => {
      if (!ch || !ch.style) return;
      if (axis === 'x') {
        ch.style.marginLeft = '';
        ch.style.marginRight = '';
        ch.style.justifySelf = '';
      } else {
        ch.style.marginTop = '';
        ch.style.marginBottom = '';
        ch.style.alignSelf = '';
      }
    });
  }


  function isHeaderFooterArea_(el) {
    try {
      return !!(el && el.closest && el.closest('#st-site-header-slot, #st-site-footer-slot, .st-site-header-slot, .st-site-footer-slot'));
    } catch (_) {
      return false;
    }
  }

  function isFooterTopLevelRow00456_(row) {
    try {
      return !!(row instanceof HTMLElement
        && row.classList?.contains('st-row')
        && row.closest?.('#st-site-footer-slot, .st-site-footer-slot')
        && row.parentElement?.classList?.contains('st-section'));
    } catch (_) { return false; }
  }

  function stretchFooterTopLevelRowChildren00456_(row) {
    try {
      if (!isFooterTopLevelRow00456_(row)) return false;
      const children = Array.from(row.querySelectorAll?.(':scope > .st-block') || [])
        .filter(ch => ch instanceof HTMLElement);
      if (!children.length) return false;

      // [00456][FOOTER TOP LEVEL STRETCH]
      // A previous horizontal resize stores pixel bases on footer columns via
      // data-st-footer-manual-w + inline !important flex-grow:0. After that the
      // top level can stay compressed on the left and new containers do not fill
      // the footer width. For the SECTION > ROW > CONTAINER level, keep the manual
      // basis as a starting point but allow all columns to grow/shrink so the level
      // always occupies the full available row width.
      row.style.width = '100%';
      row.style.maxWidth = '100%';
      row.style.minWidth = '0';
      row.style.flexWrap = 'nowrap';
      row.style.boxSizing = 'border-box';

      children.forEach(ch => {
        if (!ch || !ch.style) return;
        ch.style.minWidth = '0';
        ch.style.maxWidth = 'none';
        ch.style.boxSizing = 'border-box';
        if (ch.dataset?.stFooterManualW === '1' || ch.style.getPropertyValue('--st-footer-manual-w')) {
          // [00458] Do not re-stretch manually split footer containers.
          // The splitter model keeps the total row width stable by normalizing
          // all direct container bases. Re-enabling flex-grow here makes columns
          // over-expand and can push neighbours out of the canvas.
          ch.style.setProperty('flex', '0 0 var(--st-footer-manual-w, 0px)', 'important');
          ch.style.setProperty('flex-basis', 'var(--st-footer-manual-w, 0px)', 'important');
          ch.style.setProperty('flex-grow', '0', 'important');
          ch.style.setProperty('flex-shrink', '0', 'important');
        }
      });
      return true;
    } catch (_) { return false; }
  }


  function isHeaderTopContainer_(el) {
    try {
      return !!(el instanceof HTMLElement && el.closest?.('#st-site-header-slot') && el.parentElement?.classList?.contains('st-row') && el.parentElement?.parentElement?.classList?.contains('st-section'));
    } catch (_) { return false; }
  }

  function isFooterTopContainer00473_(el) {
    try {
      return !!(el instanceof HTMLElement
        && el.closest?.('#st-site-footer-slot, .st-site-footer-slot')
        && el.parentElement?.classList?.contains('st-row')
        && el.parentElement?.parentElement?.classList?.contains('st-section'));
    } catch (_) { return false; }
  }


  function hasActiveLayoutMarker_(el) {
    try {
      return !!(el && el.classList && (
        el.classList.contains('is-active') ||
        el.classList.contains('hb-dom-active') ||
        el.classList.contains('st-active')
      ));
    } catch (_) { return false; }
  }

  function isHeaderFooterDirectBlockChildrenHost_(el) {
    try {
      if (!(el instanceof HTMLElement)) return false;
      if (!isHeaderFooterArea_(el)) return false;
      if (!el.classList?.contains('st-block')) return false;
      if (el.classList?.contains('st-block--menu')) return false;
      return !!el.querySelector?.(':scope > .st-block');
    } catch (_) { return false; }
  }

  // [00652][HF MENU CHILDREN HOST]
  // A selected Header/Footer menu block is also a valid "Діти" host: its
  // children are the level-1 menu buttons. Without this, the children-align
  // resolver can climb to the row/container and later generic alignment may
  // shrink the menu into a narrow wrapped column.
  function isHeaderFooterMenuChildrenHost00652_(el) {
    try {
      if (!(el instanceof HTMLElement)) return false;
      if (!isHeaderFooterArea_(el)) return false;
      if (!el.classList?.contains('st-block--menu') && !el.matches?.('[data-st-menu="1"]')) return false;
      const list = getMenuRootList_(el);
      return !!(list instanceof HTMLElement && Array.from(list.children || []).some(ch => ch instanceof HTMLElement));
    } catch (_) { return false; }
  }

  function getHeaderFooterLeafVisualChildren_(el) {
    try {
      if (!(el instanceof HTMLElement)) return [];
      if (!isHeaderFooterArea_(el)) return [];
      if (!el.classList?.contains('st-block')) return [];
      if (el.classList?.contains('st-block--menu')) return [];
      if (el.querySelector?.(':scope > .st-row, :scope > .st-block')) return [];
      const selectors = [
        ':scope > .st-text-edit',
        ':scope > .st-button__label',
        ':scope > .st-button__iconbtn',
        ':scope > .st-button__iconsvg',
        ':scope > .st-phone__text',
        ':scope > .st-phone__icon',
        ':scope > .st-phone__iconbtn',
        ':scope > .st-logo__title',
        ':scope > .st-logo__subtitle',
        ':scope > .st-logo__mark',
        ':scope > .st-logo__markimg',
        ':scope > .st-logo__iconbtn',
        ':scope > .st-icon-btn',
        ':scope > .st-icon-svg',
        ':scope > .st-png__media',
        ':scope > .st-icon-btn__glyph',
        ':scope > svg',
        ':scope > span',
        ':scope > strong',
        ':scope > em'
      ];
      return Array.from(el.querySelectorAll?.(selectors.join(',')) || [])
        .filter(ch => ch instanceof HTMLElement);
    } catch (_) { return []; }
  }

  function hasHeaderFooterLeafVisualChildren_(el) {
    return getHeaderFooterLeafVisualChildren_(el).length > 0;
  }

  function getPreferredActiveHeaderFooterChildrenHost_() {
    try {
      const forcedScope = componentScopeOfEl00451_(
        window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453
      );
      if (forcedScope === 'main' || preferredLayoutScope00451_() === 'main') return null;

      const isRowChildrenHost = (el) => {
        try {
          return !!(el instanceof HTMLElement
            && isHeaderFooterArea_(el)
            && el.classList?.contains('st-row')
            && el.querySelector?.(':scope > .st-block'));
        } catch (_) { return false; }
      };

      // [00456][FOOTER ROW CHILDREN HOST]
      // In Footer/Header builder mode a real selected LEVEL is a .st-row. The old
      // helper looked only for active .st-block containers first, so stale active
      // classes from a middle container could steal the “Діти” alignment. Result:
      // selecting the top footer level and pressing center aligned children inside
      // the middle block instead of the row's direct containers.
      // Highest trust order: explicit builder selection -> raw selection event ->
      // active rows in the preferred component -> only then active block hosts.
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
      const forcedNorm = normalizeLayoutSelectable_(forced);
      // 00473: If the user explicitly selected a real Header/Footer container,
      // “Діти” must target that container first. A stale selected row must not steal it.
      if (isHeaderFooterMenuChildrenHost00652_(forcedNorm)) return forcedNorm;
      if (isHeaderFooterDirectBlockChildrenHost_(forcedNorm)) return forcedNorm;
      if (isRowChildrenHost(forcedNorm)) return forcedNorm;

      const raw = getRawSelectionElements_()
        .map(normalizeLayoutSelectable_)
        .filter(Boolean);
      for (const el of raw) {
        if (isHeaderFooterMenuChildrenHost00652_(el)) return el;
      }
      for (const el of raw) {
        if (isHeaderFooterDirectBlockChildrenHost_(el)) return el;
      }
      for (const el of raw) {
        if (isRowChildrenHost(el)) return el;
      }

      const preferred = preferredLayoutScope00451_();
      const roots = [];
      const footer = document.getElementById('st-site-footer-slot');
      const header = document.getElementById('st-site-header-slot');
      if (preferred === 'footer') { if (footer) roots.push(footer); if (header) roots.push(header); }
      else if (preferred === 'header') { if (header) roots.push(header); if (footer) roots.push(footer); }
      else { if (footer) roots.push(footer); if (header) roots.push(header); }

      // [00618][HF CHILDREN ALIGN TARGET GUARD]
      // If a real Header/Footer container is selected, mode “Діти” must align
      // that container's direct children. After 00617 a stale/inner selected text
      // leaf could still win this fallback pass because activeHosts were sorted
      // deepest-first and the condition accepted leaf blocks before containers.
      // Result: the visible text block was aligned/released as the host and the
      // whole first footer container looked squeezed into the centre. Prefer
      // real children-host containers first, then leaf controls only when no
      // container host is active.
      const depth00618 = (el) => { let d = 0, n = el; while (n && n !== document.body) { d++; n = n.parentElement; } return d; };
      for (const root of roots) {
        const activeHosts = Array.from(root.querySelectorAll?.('.st-block.hb-dom-active, .st-block.is-active') || []);
        activeHosts.sort((a, b) => {
          try { return depth00618(a) - depth00618(b); } catch (_) { return 0; }
        });
        for (const el of activeHosts) {
          if (isHeaderFooterDirectBlockChildrenHost_(el)) {
            try { el.dataset.stLayoutTargetGuard00618 = 'container-first'; } catch (_) {}
            return el;
          }
        }
        activeHosts.sort((a, b) => {
          try { return depth00618(b) - depth00618(a); } catch (_) { return 0; }
        });
        for (const el of activeHosts) {
          if (hasHeaderFooterLeafVisualChildren_(el)) {
            try { el.dataset.stLayoutTargetGuard00618 = 'leaf-fallback'; } catch (_) {}
            return el;
          }
        }
      }

      for (const root of roots) {
        const activeRows = Array.from(root.querySelectorAll?.('.st-row.hb-dom-active, .st-row.is-active, .st-row.hb-dom-selected, .st-row.is-selected') || []);
        for (const el of activeRows) {
          if (isRowChildrenHost(el)) return el;
        }
      }
    } catch (_) {}
    return null;
  }

  function flexAlignToGridAlign_(valFlex) {
    return (valFlex === 'flex-start') ? 'start' : (valFlex === 'flex-end') ? 'end' : 'center';
  }

  function repairAutoHeightForVerticalAlign_(el) {
    if (!el || !el.style) return;
    // Do not erase a real manual height. Width-resize sets custom flags too, so height
    // is the only safe source of truth here.
    if (hasExplicitLayoutHeight_(el)) return;

    const h = String(el.style.height || '').trim();
    if (!h || h === '100%' || h === 'auto') el.style.height = 'auto';

    // Old hidden/zero-layout passes could leave maxHeight smaller than minHeight.
    // That made vertical align look broken and could freeze later resize handles.
    const mh = parseFloat(el.style.maxHeight || '');
    const minH = parseFloat(el.style.minHeight || '');
    if (Number.isFinite(mh) && Number.isFinite(minH) && mh < minH) el.style.maxHeight = '';

    if (el.classList?.contains('st-block--menu')) {
      el.querySelectorAll?.(':scope > .st-menu, :scope > nav.st-menu, :scope .st-menu--big').forEach(nav => {
        if (!(nav instanceof HTMLElement)) return;
        if (!hasExplicitLayoutHeight_(nav)) {
          nav.style.height = 'auto';
          nav.style.minHeight = '0px';
        }
      });
      el.querySelectorAll?.(':scope .st-menu__list').forEach(list => {
        if (!(list instanceof HTMLElement)) return;
        list.style.minHeight = '0px';
      });
    }
  }

  function markHeaderVerticalAlign_(el, valFlex) {
    if (!el || !el.style) return;
    const gridVal = flexAlignToGridAlign_(valFlex);
    el.dataset.stLayoutYAlign = '1';
    el.style.setProperty('--st-layout-y-align', gridVal);
    // [00657] Alignment is not a resize operation. The old auto-height repair could
    // reactivate 100%/fill-height artifacts in Header/Footer, especially around menu
    // containers. For HF we only remove stretch locks; Content keeps the old behavior.
    if (isHeaderFooterArea_(el)) stripHeaderFooterAlignHeightStretch00657_(el, 'mark-y-align-no-resize');
    else repairAutoHeightForVerticalAlign_(el);
  }

  function releaseHeaderFooterAlignArtifacts00656_(el, axis = '') {
    try {
      if (!(el instanceof HTMLElement) || !el.style) return false;
      clearLayoutChildTranslate_(el);
      clearLayoutBlockTranslate_(el);
      el.style.marginLeft = '';
      el.style.marginRight = '';
      el.style.marginTop = '';
      el.style.marginBottom = '';
      el.style.justifySelf = '';
      el.style.alignSelf = '';
      el.style.removeProperty('place-self');
      el.style.removeProperty('--st-layout-block-dx');
      el.style.removeProperty('--st-layout-block-dy');
      el.style.removeProperty('--st-layout-child-dx');
      el.style.removeProperty('--st-layout-child-dy');
      try { delete el.dataset.stLayoutBlockBaseTransform; } catch (_) {}
      try { delete el.dataset.stFooterDesignAlign00559; } catch (_) {}
      try { delete el.dataset.stFooterDesignAlignX00559; } catch (_) {}
      try { delete el.dataset.stFooterDesignAlignY00559; } catch (_) {}
      el.style.setProperty('box-sizing', 'border-box', 'important');
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('min-width', '0px', 'important');
      if (axis === 'y') stripHeaderFooterAlignHeightStretch00657_(el, 'release-artifacts-axis-y');
      el.querySelectorAll?.(':scope .st-block--menu').forEach((menu) => {
        try { resetMenuNaturalHeight00655_(menu); repairMenuRootListNoCollapse00652_(menu); } catch (_) {}
      });
      if (el.classList?.contains('st-block--menu')) {
        try { resetMenuNaturalHeight00655_(el); repairMenuRootListNoCollapse00652_(el); } catch (_) {}
      }
      return true;
    } catch (_) { return false; }
  }

  function applyHeaderFooterRowChildrenAlign00656_(row, axis, valFlex) {
    // 00663 HARD DISABLED: old stacked Header/Footer children-align branch.
    // Clean active path is applyHeaderFooterChildrenAlignClean00661_ / applyHeaderFooterRowChildrenAlignClean00661_.
    return false;
  }

  function applyHeaderFooterRowChildrenVerticalAlign_(row, valFlex) {
    // 00663 HARD DISABLED: legacy vertical wrapper must not route into old child/text align.
    return false;
  }

  function getSiblingClampBounds00473_(block, host, axis) {
    try {
      const br = block.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      const siblings = Array.from(host.children || [])
        .filter(el => el instanceof HTMLElement && el !== block && el.classList?.contains('st-block') && !el.matches('[data-st-menu-item="1"], .st-block--menu-item'))
        .map(el => ({ el, r: el.getBoundingClientRect() }))
        .filter(x => x.r && x.r.width > 0 && x.r.height > 0);

      if (axis === 'x') {
        let minLeft = hr.left;
        let maxRight = hr.right;
        siblings.forEach(({ r }) => {
          if (r.right <= br.left + 0.5) minLeft = Math.max(minLeft, r.right);
          if (r.left >= br.right - 0.5) maxRight = Math.min(maxRight, r.left);
        });
        return { start: minLeft, end: maxRight, size: br.width, currentStart: br.left, currentEnd: br.right };
      }

      let minTop = hr.top;
      let maxBottom = hr.bottom;
      siblings.forEach(({ r }) => {
        if (r.bottom <= br.top + 0.5) minTop = Math.max(minTop, r.bottom);
        if (r.top >= br.bottom - 0.5) maxBottom = Math.min(maxBottom, r.top);
      });
      return { start: minTop, end: maxBottom, size: br.height, currentStart: br.top, currentEnd: br.bottom };
    } catch (_) { return null; }
  }

function getHeaderFooterDirectChildren_(hostEl) {
    if (!hostEl || !hostEl.querySelectorAll) return [];
    // Для header/footer контейнерів діти можуть лежати прямо в .st-block,
    // або в його прямому .st-row. Беремо тільки перший рівень, без пунктів меню.
    const innerRow = hostEl.querySelector?.(':scope > .st-row') || null;
    const source = innerRow || hostEl;
    return Array.from(source.querySelectorAll(':scope > .st-block'))
      .filter(ch => ch instanceof HTMLElement && !ch.matches('[data-st-menu-item="1"], .st-block--menu-item'));
  }

  function getVisualRectForLayoutChild_(child) {
    if (!child || !child.querySelector) return child?.getBoundingClientRect?.() || null;
    // Для меню реальний видимий контент — root-list / links, а не службова оболонка,
    // яка може мати майже ту саму висоту, що і контейнер. Через це align-items давав рух ~1px.
    const menuList = child.classList?.contains('st-block--menu') ? getMenuRootList_(child) : null;
    if (menuList) {
      const links = Array.from(menuList.querySelectorAll(':scope > .st-menu__item > .st-menu__link'))
        .filter(el => el instanceof HTMLElement);
      const rects = links.length ? links.map(el => el.getBoundingClientRect()) : [menuList.getBoundingClientRect()];
      let left = rects[0].left, top = rects[0].top, right = rects[0].right, bottom = rects[0].bottom;
      rects.forEach(r => {
        left = Math.min(left, r.left); top = Math.min(top, r.top);
        right = Math.max(right, r.right); bottom = Math.max(bottom, r.bottom);
      });
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }
    const text = child.querySelector?.(':scope > .st-text-edit, :scope .st-text-edit');
    const icon = child.querySelector?.(':scope > .st-icon-btn, :scope .st-icon-btn, :scope > .st-png__media, :scope .st-png__media');
    const visual = text || icon || child;
    return visual.getBoundingClientRect?.() || child.getBoundingClientRect?.() || null;
  }

  function stripLayoutVisualTranslate_(transform) {
    return String(transform || '')
      .replace(/\s*translate3d\(var\(--st-layout-child-dx,[^)]+\)\s*,\s*var\(--st-layout-child-dy,[^)]+\)\s*,\s*0px\)\s*/g, ' ')
      .replace(/\s*translate\(var\(--st-layout-child-dx,[^)]+\)\s*,\s*var\(--st-layout-child-dy,[^)]+\)\s*\)\s*/g, ' ')
      .replace(/\s*translate3d\(var\(--st-layout-block-dx,[^)]+\)\s*,\s*var\(--st-layout-block-dy,[^)]+\)\s*,\s*0px\)\s*/g, ' ')
      .replace(/\s*translate\(var\(--st-layout-block-dx,[^)]+\)\s*,\s*var\(--st-layout-block-dy,[^)]+\)\s*\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function clearLayoutChildTranslate_(el) {
    if (!el || !el.style) return;
    const cleaned = stripLayoutVisualTranslate_(el.style.transform || '');
    if ((el.style.transform || '') !== cleaned) el.style.transform = cleaned;
    el.style.removeProperty('--st-layout-child-dx');
    el.style.removeProperty('--st-layout-child-dy');
    try { delete el.dataset.stLayoutVisualBaseTransform; } catch(e) {}
  }

  function clearLayoutBlockTranslate_(el) {
    if (!el || !el.style) return;
    const cleaned = stripLayoutVisualTranslate_(el.style.transform || '');
    if ((el.style.transform || '') !== cleaned) el.style.transform = cleaned;
    el.style.removeProperty('--st-layout-block-dx');
    el.style.removeProperty('--st-layout-block-dy');
    try { delete el.dataset.stLayoutBlockBaseTransform; } catch(e) {}
  }

  function clampNumber_(n, min, max) {
    if (!Number.isFinite(n)) return 0;
    if (!Number.isFinite(min)) min = n;
    if (!Number.isFinite(max)) max = n;
    if (min > max) return 0;
    return Math.max(min, Math.min(max, n));
  }

  function isHeaderFooterTopContainer00660_(el) {
    try {
      return !!(el instanceof HTMLElement
        && isHeaderFooterArea_(el)
        && el.classList?.contains('st-block')
        && el.parentElement?.classList?.contains('st-row'));
    } catch (_) { return false; }
  }

  function headerFooterSiblingBlocks00660_(host, target = null) {
    try {
      if (!(host instanceof HTMLElement)) return [];
      return Array.from(host.children || []).filter((ch) => {
        return ch instanceof HTMLElement
          && ch.classList?.contains('st-block')
          && !ch.classList?.contains('st-resize')
          && !ch.matches?.('[data-st-builder-ui], .st-drop-hint, .hb-panel, .hb-ctor, .hb-p');
      });
    } catch (_) { return []; }
  }

  function cleanHeaderFooterNoOverlapAlign00660_(el, reason = '') {
    try {
      if (!(el instanceof HTMLElement) || !el.style || !isHeaderFooterArea_(el)) return false;
      clearLayoutChildTranslate_(el);
      clearLayoutBlockTranslate_(el);
      el.style.removeProperty('--st-layout-child-dx');
      el.style.removeProperty('--st-layout-child-dy');
      el.style.removeProperty('--st-layout-block-dx');
      el.style.removeProperty('--st-layout-block-dy');
      try { delete el.dataset.stLayoutChildBaseTransform00659; } catch (_) {}
      try { delete el.dataset.stLayoutVisualBaseTransform; } catch (_) {}
      try { delete el.dataset.stLayoutBlockBaseTransform; } catch (_) {}
      try { delete el.dataset.stLayoutPositionOnlyAlign00659; } catch (_) {}
      try { el.dataset.stLayoutNoTransformAlign00660 = reason || '1'; } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function hfPx00661_(v, fallback = 0) {
    const n = parseFloat(String(v || ''));
    return Number.isFinite(n) ? n : fallback;
  }

  function hfFlexToGrid00661_(val) {
    return val === 'flex-end' ? 'end' : (val === 'center' ? 'center' : 'start');
  }

  function hfDirectBlocks00661_(host) {
    try {
      return Array.from(host?.children || []).filter((ch) => {
        return ch instanceof HTMLElement
          && ch.classList?.contains('st-block')
          && !ch.classList?.contains('st-resize')
          && !ch.matches?.('[data-st-builder-ui], .st-drop-hint, .hb-panel, .fb-panel, .hb-ctor, .hb-p');
      });
    } catch (_) { return []; }
  }

  function hfBox00661_(el) {
    try {
      const r = el?.getBoundingClientRect?.();
      const cs = getComputedStyle(el);
      return {
        w: Math.max(1, Math.round(r?.width || el.offsetWidth || el.scrollWidth || hfPx00661_(cs.width, 1) || 1)),
        h: Math.max(1, Math.round(r?.height || el.offsetHeight || el.scrollHeight || hfPx00661_(cs.height, 1) || 1))
      };
    } catch (_) { return { w: 1, h: 1 }; }
  }

  // [00664][HF ALIGN DIAGNOSTICS ONLY]
  // This layer must not change layout. It only records the exact selection/host/children
  // chain used by the Layout align buttons, so the next debug report shows why align is
  // visually dead or which old branch rewrites the style after the click.
  function hfNodeSnap00664_(el) {
    try {
      if (!(el instanceof HTMLElement)) return null;
      const r = el.getBoundingClientRect?.();
      const cs = getComputedStyle(el);
      const pe = el.parentElement;
      return {
        tag: String(el.tagName || ''),
        id: String(el.id || ''),
        ref: String(el.getAttribute?.('data-hf-ref') || el.dataset?.hfRef || el.dataset?.stNodeId || ''),
        stNode: String(el.getAttribute?.('data-st-node') || el.dataset?.stNode || ''),
        classes: String(el.className || '').slice(0, 220),
        area: componentScopeOfEl00451_(el),
        parentTag: String(pe?.tagName || ''),
        parentRef: String(pe?.getAttribute?.('data-hf-ref') || pe?.dataset?.hfRef || pe?.dataset?.stNodeId || ''),
        parentClass: String(pe?.className || '').slice(0, 160),
        rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
        css: {
          display: String(cs.display || ''),
          flexDirection: String(cs.flexDirection || ''),
          justifyContent: String(cs.justifyContent || ''),
          alignItems: String(cs.alignItems || ''),
          alignSelf: String(cs.alignSelf || ''),
          justifySelf: String(cs.justifySelf || ''),
          flex: String(cs.flex || ''),
          flexBasis: String(cs.flexBasis || ''),
          width: String(cs.width || ''),
          height: String(cs.height || ''),
          minWidth: String(cs.minWidth || ''),
          minHeight: String(cs.minHeight || ''),
          maxWidth: String(cs.maxWidth || ''),
          maxHeight: String(cs.maxHeight || ''),
          marginLeft: String(cs.marginLeft || ''),
          marginRight: String(cs.marginRight || ''),
          marginTop: String(cs.marginTop || ''),
          marginBottom: String(cs.marginBottom || '')
        },
        inline: {
          display: String(el.style.display || ''),
          flexDirection: String(el.style.flexDirection || ''),
          justifyContent: String(el.style.justifyContent || ''),
          alignItems: String(el.style.alignItems || ''),
          alignSelf: String(el.style.alignSelf || ''),
          justifySelf: String(el.style.justifySelf || ''),
          flex: String(el.style.flex || ''),
          flexBasis: String(el.style.flexBasis || ''),
          width: String(el.style.width || ''),
          height: String(el.style.height || ''),
          minWidth: String(el.style.minWidth || ''),
          minHeight: String(el.style.minHeight || ''),
          maxWidth: String(el.style.maxWidth || ''),
          maxHeight: String(el.style.maxHeight || ''),
          marginLeft: String(el.style.marginLeft || ''),
          marginRight: String(el.style.marginRight || ''),
          marginTop: String(el.style.marginTop || ''),
          marginBottom: String(el.style.marginBottom || '')
        },
        dataset: {
          layoutMode: String(el.dataset?.layoutMode || ''),
          layoutOrient: String(el.dataset?.layoutOrient || ''),
          stLayoutChildrenAlignX: String(el.dataset?.stLayoutChildrenAlignX || ''),
          stLayoutChildrenAlignY: String(el.dataset?.stLayoutChildrenAlignY || ''),
          stLayoutHfChildrenAlign00661: String(el.dataset?.stLayoutHfChildrenAlign00661 || ''),
          stLayoutHfRowChildrenAlign00661: String(el.dataset?.stLayoutHfRowChildrenAlign00661 || ''),
          stLayoutHfBlockFillFlex00662: String(el.dataset?.stLayoutHfBlockFillFlex00662 || ''),
          stLayoutHfDirectChildBoxOnly00663: String(el.dataset?.stLayoutHfDirectChildBoxOnly00663 || '')
        },
        childCounts: {
          directElements: el.children ? el.children.length : 0,
          directBlocks: hfDirectBlocks00661_(el).length,
          hfDirectChildren: getHeaderFooterDirectChildren_(el).length,
          leafVisualChildren: getHeaderFooterLeafVisualChildren_(el).length
        },
        text: String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
      };
    } catch (e) { return { error: String(e?.message || e) }; }
  }

  function hfChildrenSnap00664_(host, mode = 'all') {
    try {
      if (!(host instanceof HTMLElement)) return [];
      let arr = [];
      if (mode === 'hfDirect') arr = getHeaderFooterDirectChildren_(host);
      else if (mode === 'directBlocks') arr = hfDirectBlocks00661_(host);
      else arr = Array.from(host.children || []).filter((el) => el instanceof HTMLElement);
      return arr.slice(0, 16).map((el, index) => ({ index, node: hfNodeSnap00664_(el) }));
    } catch (e) { return [{ error: String(e?.message || e) }]; }
  }

  function hfRawSelectionSnap00664_() {
    try {
      return getRawSelectionElements_().map((el, index) => ({ index, node: hfNodeSnap00664_(normalizeLayoutSelectable_(el)) })).slice(0, 12);
    } catch (e) { return [{ error: String(e?.message || e) }]; }
  }

  function hfPushAlignDiag00664_(event, detail = {}, level = 'info') {
    try {
      const payload = Object.assign({ v: '00664', ts: Date.now() }, detail || {});
      window.__ST_HF_ALIGN_LAST_00664 = payload;
      window.__ST_PERF_DIAG__?.push?.('hf-align-00664:' + String(event || 'event'), payload, level);
    } catch (_) {}
  }

  function hfScheduleAfterAlignAudit00664_(event, target, host, axis, val, before = null) {
    try {
      const run = (delay) => setTimeout(() => {
        try {
          hfPushAlignDiag00664_(event + ':after-' + delay + 'ms', {
            axis, val,
            before,
            targetAfter: hfNodeSnap00664_(target),
            hostAfter: hfNodeSnap00664_(host),
            hostChildrenAfter: hfChildrenSnap00664_(host, 'hfDirect')
          }, 'info');
        } catch (_) {}
      }, delay);
      run(0);
      run(80);
    } catch (_) {}
  }

  function clearHeaderFooterAlignGarbage00661_(el, reason = '') {
    try {
      if (!(el instanceof HTMLElement) || !el.style || !isHeaderFooterArea_(el)) return false;
      cleanHeaderFooterNoOverlapAlign00660_(el, reason || '00661');
      el.style.marginLeft = '';
      el.style.marginRight = '';
      el.style.marginTop = '';
      el.style.marginBottom = '';
      el.style.justifySelf = '';
      el.style.alignSelf = '';
      el.style.removeProperty('place-self');
      el.style.removeProperty('--st-layout-child-dx');
      el.style.removeProperty('--st-layout-child-dy');
      el.style.removeProperty('--st-layout-block-dx');
      el.style.removeProperty('--st-layout-block-dy');
      try { delete el.dataset.stLayoutPositionOnlyAlign00659; } catch (_) {}
      try { delete el.dataset.stFooterDesignAlign00559; } catch (_) {}
      try { delete el.dataset.stFooterDesignAlignX00559; } catch (_) {}
      try { delete el.dataset.stFooterDesignAlignY00559; } catch (_) {}
      try { el.dataset.stLayoutCleanAlign00661 = reason || '1'; } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  function clearHeaderFooterAlignTree00661_(root, reason = '') {
    try {
      if (!(root instanceof HTMLElement)) return false;
      clearHeaderFooterAlignGarbage00661_(root, reason || 'tree');
      root.querySelectorAll?.('.st-row,.st-block,.st-menu,.st-menu__list,.st-text-edit,.st-button__label,.st-phone__text,.st-logo__title,.st-logo__subtitle,.st-icon-btn,.st-png__media').forEach((el) => {
        try { if (el instanceof HTMLElement) clearHeaderFooterAlignGarbage00661_(el, reason || 'tree-child'); } catch (_) {}
      });
      return true;
    } catch (_) { return false; }
  }

  function lockHeaderFooterVisualChildSize00661_(child, box = null) {
    try {
      if (!(child instanceof HTMLElement) || !child.style || !isHeaderFooterArea_(child)) return false;
      // 00662: this function used to be the main bug. It locked every child to
      // measured px width/flex-basis and disabled flex grow/shrink during align.
      // That made containers shrink, overlap and push text outside.
      // Clean rule: alignment must not write child width/flex at all.
      child.style.setProperty('box-sizing', 'border-box', 'important');
      child.style.setProperty('min-width', '0px', 'important');
      child.style.setProperty('max-width', '100%', 'important');
      child.style.setProperty('overflow', 'visible', 'important');
      stripHeaderFooterAlignHeightStretch00657_(child, 'align-no-child-size-lock-00662');
      try { child.dataset.stLayoutHfNoChildSizeLock00662 = '1'; } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  // [00668][HF DIRECT CHILD CROSS-AXIS ALIGN]
  // 00667 correctly stopped horizontal fill/resize, but direct children still had
  // computed align-self:flex-start. That overrides the parent host align-items, so
  // Layout → Діти → X-center/right looked unchanged. Align only the DIRECT child
  // boxes here; never drill into grandchildren/menu text/content.
  function applyHeaderFooterDirectChildSelfAlign00668_(hostEl, child, axis, val, dir, reason = '') {
    try {
      if (!(hostEl instanceof HTMLElement) || !(child instanceof HTMLElement) || !child.style) return false;
      if (!isHeaderFooterArea_(hostEl) || !isHeaderFooterArea_(child)) return false;
      const hostDir = String(dir || getHeaderFooterFlexDir00467_(hostEl) || 'row');
      const isCrossAxis = (axis === 'x' && hostDir === 'column') || (axis === 'y' && hostDir !== 'column');
      child.style.removeProperty('justify-self');
      child.style.removeProperty('place-self');
      if (!isCrossAxis) return false;
      stSetImportant00467_(child, 'align-self', val || 'flex-start');
      try {
        child.dataset.stLayoutHfDirectChildSelfAlign00668 = String(axis || '') + ':' + String(val || '') + (reason ? ':' + String(reason) : '');
        delete child.dataset.stLayoutHfDirectChildBoxOnly00663Blocked;
      } catch (_) {}
      return true;
    } catch (_) { return false; }
  }


  function hfApplyMenuAlignOnly00661_(menuBlock, axis, val) {
    // [00674] Legacy menu-align body hard-disabled.
    // The active path is applyHeaderFooterMenuChildrenAlignClean00674_ only.
    return applyHeaderFooterMenuChildrenAlignClean00674_(menuBlock, axis, val);
  }


  function hfMenuNodeSnap00674_(el) {
    try {
      if (!(el instanceof HTMLElement)) return null;
      const r = el.getBoundingClientRect?.();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        cls: String(el.className || ''),
        text: String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
        rect: {
          x: Math.round(Number(r?.x) || 0),
          y: Math.round(Number(r?.y) || 0),
          w: Math.round(Number(r?.width) || 0),
          h: Math.round(Number(r?.height) || 0)
        },
        css: {
          display: cs.display,
          flexDirection: cs.flexDirection,
          justifyContent: cs.justifyContent,
          alignItems: cs.alignItems,
          alignSelf: cs.alignSelf,
          width: cs.width,
          height: cs.height,
          minHeight: cs.minHeight,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom
        },
        inline: {
          display: el.style.display || '',
          flexDirection: el.style.flexDirection || '',
          justifyContent: el.style.justifyContent || '',
          alignItems: el.style.alignItems || '',
          alignSelf: el.style.alignSelf || '',
          width: el.style.width || '',
          height: el.style.height || '',
          minHeight: el.style.minHeight || '',
          marginTop: el.style.marginTop || '',
          marginBottom: el.style.marginBottom || ''
        }
      };
    } catch (_) { return null; }
  }

  function hfPushMenuAlign00674_(event, detail = {}, level = 'warn') {
    try {
      const payload = Object.assign({ v: '00674', ts: Date.now() }, detail || {});
      window.__ST_HF_MENU_ALIGN_LAST_00674 = payload;
      window.__ST_PERF_DIAG__?.push?.('hf-menu-align-00674:' + String(event || 'event'), payload, level);
      try { console.warn('[00674][HF MENU ALIGN]', event, payload); } catch (_) {}
    } catch (_) {}
  }

  function hfScheduleMenuAlignAudit00674_(event, menuBlock, axis, val, before = null) {
    [0, 80, 250].forEach((delay) => {
      try {
        setTimeout(() => {
          try {
            const list = getMenuRootList_(menuBlock);
            const nav = list?.closest?.('.st-menu') || null;
            hfPushMenuAlign00674_(event + ':after-' + delay + 'ms', {
              axis,
              val,
              before,
              menuAfter: hfMenuNodeSnap00674_(menuBlock),
              navAfter: hfMenuNodeSnap00674_(nav),
              listAfter: hfMenuNodeSnap00674_(list),
              itemsAfter: Array.from(list?.children || []).slice(0, 12).map((item, index) => ({ index, node: hfMenuNodeSnap00674_(item) }))
            }, 'warn');
          } catch (_) {}
        }, delay);
      } catch (_) {}
    });
  }

  // [00674][HF MENU CHILDREN ALIGN CLEAN ROUTE]
  // Pure route for selected .st-block--menu + Layout → Діти.
  // No selection normalizer, no old repair/rollback/interceptor path, no parent/container align.
  // It writes only the selected menu block, its direct nav, the root list and first-level items.
  function applyHeaderFooterMenuChildrenAlignClean00674_(menuBlock, axis, val) {
    try {
      if (!(menuBlock instanceof HTMLElement) || !menuBlock.classList?.contains('st-block--menu')) return false;
      if (!isHeaderFooterArea_(menuBlock)) return false;

      const list = getMenuRootList_(menuBlock);
      if (!(list instanceof HTMLElement)) {
        hfPushMenuAlign00674_('reject-no-root-list', { axis, val, menu: hfMenuNodeSnap00674_(menuBlock) }, 'warn');
        return false;
      }
      const nav = list.closest?.('.st-menu') || null;
      const dirRaw = String(menuBlock.dataset?.menuLevel1Direction || menuBlock.getAttribute?.('data-menu-level1-direction') || list.dataset?.layoutOrient || getComputedStyle(list).flexDirection || 'row').trim();
      const dir = dirRaw === 'column' ? 'column' : 'row';
      const before = {
        axis,
        val,
        menuBefore: hfMenuNodeSnap00674_(menuBlock),
        navBefore: hfMenuNodeSnap00674_(nav),
        listBefore: hfMenuNodeSnap00674_(list),
        itemsBefore: Array.from(list.children || []).slice(0, 12).map((item, index) => ({ index, node: hfMenuNodeSnap00674_(item) }))
      };
      hfPushMenuAlign00674_('start-clean-menu-children', before, 'warn');

      // Data mirrors only. No runtime normalizer/repair function is called here.
      try {
        const raw = String(menuBlock.dataset.menuLevelContentLayoutStyles || '').trim();
        const map = raw ? JSON.parse(raw) : {};
        const l1 = (map['1'] && typeof map['1'] === 'object') ? Object.assign({}, map['1']) : {};
        if (axis === 'x') {
          l1.justify = String(val || 'flex-start');
          menuBlock.dataset.menuRootJustify = String(val || 'flex-start');
        } else {
          l1.align = String(val || 'flex-start');
          menuBlock.dataset.menuRootAlign = String(val || 'flex-start');
        }
        map['1'] = l1;
        menuBlock.dataset.menuLevelContentLayoutStyles = JSON.stringify(map);
      } catch (_) {}
      try {
        menuBlock.dataset.menuLevel1Direction = dir;
        menuBlock.setAttribute('data-menu-level1-direction', dir);
        menuBlock.dataset.stLayoutMenuChildrenClean00674 = String(axis || '') + ':' + String(val || '');
        list.dataset.layoutOrient = dir;
        list.dataset.stLayoutMenuChildrenClean00674 = String(axis || '') + ':' + String(val || '');
      } catch (_) {}

      // Keep the menu block in its parent slot. These deletes are intentional: Layout → Діти
      // must not move the selected menu block itself.
      menuBlock.style.removeProperty('align-self');
      menuBlock.style.removeProperty('justify-self');
      menuBlock.style.removeProperty('margin-top');
      menuBlock.style.removeProperty('margin-bottom');

      menuBlock.style.setProperty('display', 'flex', 'important');
      menuBlock.style.setProperty('flex-direction', 'column', 'important');
      menuBlock.style.setProperty('align-items', 'stretch', 'important');
      menuBlock.style.setProperty('box-sizing', 'border-box', 'important');
      menuBlock.style.setProperty('overflow', 'visible', 'important');
      // Y align means: move the nav/list vertically INSIDE the selected menu block.
      if (axis === 'y') menuBlock.style.setProperty('justify-content', String(val || 'flex-start'), 'important');

      if (nav instanceof HTMLElement) {
        nav.style.removeProperty('align-self');
        nav.style.removeProperty('justify-self');
        nav.style.setProperty('display', 'flex', 'important');
        nav.style.setProperty('flex-direction', 'column', 'important');
        nav.style.setProperty('justify-content', String(axis === 'y' ? (val || 'flex-start') : 'flex-start'), 'important');
        nav.style.setProperty('align-items', 'stretch', 'important');
        nav.style.setProperty('width', '100%', 'important');
        nav.style.setProperty('height', 'auto', 'important');
        nav.style.setProperty('min-height', '0px', 'important');
        nav.style.setProperty('max-height', 'none', 'important');
        nav.style.setProperty('box-sizing', 'border-box', 'important');
        nav.style.setProperty('margin-top', '0px', 'important');
        nav.style.setProperty('margin-bottom', '0px', 'important');
      }

      list.style.setProperty('display', 'flex', 'important');
      list.style.setProperty('flex-direction', dir, 'important');
      list.style.setProperty('flex-wrap', 'nowrap', 'important');
      list.style.setProperty('width', '100%', 'important');
      list.style.setProperty('height', 'auto', 'important');
      list.style.setProperty('min-height', '0px', 'important');
      list.style.setProperty('max-height', 'none', 'important');
      list.style.setProperty('box-sizing', 'border-box', 'important');
      if (axis === 'x') list.style.setProperty('justify-content', String(val || 'flex-start'), 'important');
      if (axis === 'y') list.style.setProperty('align-items', String(val || 'flex-start'), 'important');

      Array.from(list.children || []).forEach((item) => {
        try {
          if (!(item instanceof HTMLElement)) return;
          item.style.removeProperty('align-self');
          item.style.setProperty('flex', '0 0 auto', 'important');
          item.style.setProperty('width', 'auto', 'important');
          item.style.setProperty('max-width', 'none', 'important');
          const link = item.matches?.('.st-menu__link') ? item : item.querySelector?.(':scope > .st-menu__link');
          if (link instanceof HTMLElement) {
            link.style.setProperty('display', 'inline-flex', 'important');
            link.style.setProperty('width', 'auto', 'important');
            link.style.setProperty('max-width', 'none', 'important');
            link.style.setProperty('white-space', 'nowrap', 'important');
          }
        } catch (_) {}
      });

      hfPushMenuAlign00674_('write-done-clean-menu-children', {
        axis,
        val,
        dir,
        menuAfterNow: hfMenuNodeSnap00674_(menuBlock),
        navAfterNow: hfMenuNodeSnap00674_(nav),
        listAfterNow: hfMenuNodeSnap00674_(list)
      }, 'warn');
      hfScheduleMenuAlignAudit00674_('clean-menu-children', menuBlock, axis, val, before);
      return true;
    } catch (err) {
      hfPushMenuAlign00674_('exception-clean-menu-children', { axis, val, error: String(err && (err.stack || err.message) || err) }, 'warn');
      return false;
    }
  }

  function applyHeaderFooterChildrenAlignClean00661_(hostEl, axis, val) {
    try {
      if (!(hostEl instanceof HTMLElement) || !hostEl.style || !isHeaderFooterArea_(hostEl)) return false;

      const diagBefore00664 = {
        axis,
        val,
        hostBefore: hfNodeSnap00664_(hostEl),
        rawSelection: hfRawSelectionSnap00664_(),
        directElementsBefore: hfChildrenSnap00664_(hostEl, 'all'),
        hfDirectBefore: hfChildrenSnap00664_(hostEl, 'hfDirect')
      };
      hfPushAlignDiag00664_('children-clean-entry', diagBefore00664, 'info');

      const ownMenu = (hostEl.classList?.contains('st-block--menu') || hostEl.matches?.('[data-st-menu="1"]')) ? hostEl : null;
      if (ownMenu) {
        hfPushAlignDiag00664_('children-clean-own-menu-clean-00674', { axis, val, host: hfNodeSnap00664_(ownMenu) }, 'warn');
        return applyHeaderFooterMenuChildrenAlignClean00674_(ownMenu, axis, val);
      }

      const children = getHeaderFooterDirectChildren_(hostEl).filter((ch) => ch instanceof HTMLElement);
      if (!children.length) {
        hfPushAlignDiag00664_('children-clean-no-direct-children', diagBefore00664, 'warn');
        return false;
      }

      const boxes = new Map(children.map((ch) => [ch, hfBox00661_(ch)]));
      clearHeaderFooterAlignTree00661_(hostEl, 'children-align-00661');

      const dir = getHeaderFooterFlexDir00467_(hostEl);
      hostEl.dataset.layoutMode = 'flex';
      hostEl.dataset.layoutOrient = dir;
      hostEl.dataset.stLayoutChildrenAlignHost = '1';
      hostEl.dataset.stLayoutHfChildrenAlign00661 = '1';
      if (axis === 'x') hostEl.dataset.stLayoutChildrenAlignX = String(val || '');
      else hostEl.dataset.stLayoutChildrenAlignY = String(val || '');

      stSetImportant00467_(hostEl, 'display', isHeaderFooterSocialGroup00467_(hostEl) ? 'inline-flex' : 'flex');
      stSetImportant00467_(hostEl, 'flex-direction', dir);
      stSetImportant00467_(hostEl, 'flex-wrap', 'nowrap');
      stSetImportant00467_(hostEl, 'box-sizing', 'border-box');
      stSetImportant00467_(hostEl, 'max-width', '100%');
      stSetImportant00467_(hostEl, 'min-width', '0px');
      stSetImportant00467_(hostEl, 'overflow', 'visible');

      const prop = axis === 'x'
        ? (dir === 'column' ? 'align-items' : 'justify-content')
        : (dir === 'column' ? 'justify-content' : 'align-items');
      stSetImportant00467_(hostEl, prop, val);
      if (axis === 'y') stSetImportant00467_(hostEl, 'align-content', val);

      children.forEach((child) => {
        try {
          clearHeaderFooterAlignGarbage00661_(child, 'children-align-direct-child-00661');
          lockHeaderFooterVisualChildSize00661_(child, boxes.get(child));
          child.dataset.stLayoutHfChildAlign00661 = '1';
          // 00663: container + "Діти" means align ONLY the direct child boxes
          // inside the selected container. Do not drill into grandchildren/text/menu
          // content here; that was the root cause of text moving instead of blocks.
          child.dataset.stLayoutHfDirectChildBoxOnly00663 = '1';
          applyHeaderFooterDirectChildSelfAlign00668_(hostEl, child, axis, val, dir, 'container-children');
        } catch (_) {}
      });

      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-direct-child-self-align-00668', {
          scope: componentScopeOfEl00451_(hostEl), axis, val, dir, reason: 'container-children', children: children.length, cls: String(hostEl.className || '')
        }, 'info');
      } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-children-align-clean-00661', {
          scope: componentScopeOfEl00451_(hostEl), axis, val, dir, children: children.length, cls: String(hostEl.className || '')
        }, 'info');
      } catch (_) {}
      hfPushAlignDiag00664_('children-clean-write-done', {
        axis, val, dir,
        hostBefore: diagBefore00664.hostBefore,
        hostAfterNow: hfNodeSnap00664_(hostEl),
        childrenBefore: diagBefore00664.hfDirectBefore,
        childrenAfterNow: hfChildrenSnap00664_(hostEl, 'hfDirect')
      }, 'info');
      hfScheduleAfterAlignAudit00664_('children-clean', hostEl, hostEl, axis, val, diagBefore00664);
      return true;
    } catch (_) { return false; }
  }

  function applyHeaderFooterRowChildrenAlignClean00661_(row, axis, val) {
    try {
      if (!(row instanceof HTMLElement) || !row.style || !isRowEl_(row) || !isHeaderFooterArea_(row)) return false;
      const rowDiagBefore00664 = {
        axis,
        val,
        rowBefore: hfNodeSnap00664_(row),
        rawSelection: hfRawSelectionSnap00664_(),
        directBlocksBefore: hfChildrenSnap00664_(row, 'directBlocks'),
        directElementsBefore: hfChildrenSnap00664_(row, 'all')
      };
      hfPushAlignDiag00664_('row-children-entry', rowDiagBefore00664, 'info');
      const kids = hfDirectBlocks00661_(row);
      if (!kids.length) {
        hfPushAlignDiag00664_('row-children-no-direct-blocks', rowDiagBefore00664, 'warn');
        return false;
      }
      const boxes = new Map(kids.map((ch) => [ch, hfBox00661_(ch)]));
      clearHeaderFooterAlignTree00661_(row, 'row-children-align-00661');

      const dir = getHeaderFooterFlexDir00467_(row);
      row.dataset.layoutMode = 'flex';
      row.dataset.layoutOrient = dir;
      row.dataset.stLayoutHfRowChildrenAlign00661 = '1';
      if (axis === 'x') row.dataset.stLayoutChildrenAlignX = String(val || '');
      else row.dataset.stLayoutChildrenAlignY = String(val || '');

      stSetImportant00467_(row, 'display', 'flex');
      stSetImportant00467_(row, 'flex-direction', dir);
      stSetImportant00467_(row, 'flex-wrap', 'nowrap');
      stSetImportant00467_(row, 'box-sizing', 'border-box');
      stSetImportant00467_(row, 'max-width', '100%');
      stSetImportant00467_(row, 'min-width', '0px');
      stSetImportant00467_(row, 'overflow', 'visible');

      const prop = axis === 'x'
        ? (dir === 'column' ? 'align-items' : 'justify-content')
        : (dir === 'column' ? 'justify-content' : 'align-items');
      stSetImportant00467_(row, prop, val);
      if (axis === 'y') stSetImportant00467_(row, 'align-content', val);

      kids.forEach((kid) => {
        try {
          clearHeaderFooterAlignGarbage00661_(kid, 'row-child-align-00661');
          lockHeaderFooterVisualChildSize00661_(kid, boxes.get(kid));
          kid.dataset.stLayoutHfChildAlign00661 = '1';
          // 00663: level/row + "Діти" aligns direct containers/blocks only.
          // Menu/text internals are not touched from a parent row/container align.
          kid.dataset.stLayoutHfDirectChildBoxOnly00663 = '1';
          applyHeaderFooterDirectChildSelfAlign00668_(row, kid, axis, val, dir, 'row-children');
        } catch (_) {}
      });
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-direct-child-self-align-00668', {
          scope: componentScopeOfEl00451_(row), axis, val, dir, reason: 'row-children', children: kids.length, cls: String(row.className || '')
        }, 'info');
      } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-row-children-align-clean-00661', {
          scope: componentScopeOfEl00451_(row), axis, val, dir, children: kids.length, cls: String(row.className || '')
        }, 'info');
      } catch (_) {}
      hfPushAlignDiag00664_('row-children-write-done', {
        axis, val, dir,
        rowBefore: rowDiagBefore00664.rowBefore,
        rowAfterNow: hfNodeSnap00664_(row),
        kidsBefore: rowDiagBefore00664.directBlocksBefore,
        kidsAfterNow: hfChildrenSnap00664_(row, 'directBlocks')
      }, 'info');
      hfScheduleAfterAlignAudit00664_('row-children', row, row, axis, val, rowDiagBefore00664);
      return true;
    } catch (_) { return false; }
  }

  function hfInnerPrimarySize00662_(host, axis) {
    try {
      const r = host.getBoundingClientRect?.();
      const cs = getComputedStyle(host);
      const raw = axis === 'x' ? (r?.width || host.clientWidth || 0) : (r?.height || host.clientHeight || 0);
      const a = axis === 'x'
        ? hfPx00661_(cs.paddingLeft) + hfPx00661_(cs.paddingRight) + hfPx00661_(cs.borderLeftWidth) + hfPx00661_(cs.borderRightWidth)
        : hfPx00661_(cs.paddingTop) + hfPx00661_(cs.paddingBottom) + hfPx00661_(cs.borderTopWidth) + hfPx00661_(cs.borderBottomWidth);
      return Math.max(1, Math.floor(raw - a));
    } catch (_) { return 1; }
  }

  function hfPrimaryGap00662_(host, axis) {
    try {
      const cs = getComputedStyle(host);
      const raw = axis === 'x' ? (cs.columnGap || cs.gap) : (cs.rowGap || cs.gap);
      return Math.max(0, hfPx00661_(raw, 0));
    } catch (_) { return 0; }
  }


  function hfEnsureHostFullPrimary00663_(host, axis) {
    try {
      if (!(host instanceof HTMLElement) || !host.style || !isHeaderFooterArea_(host)) return false;
      const parent = host.parentElement;
      if (!(parent instanceof HTMLElement)) return false;
      if (axis === 'x') {
        host.style.setProperty('width', '100%', 'important');
        host.style.setProperty('max-width', '100%', 'important');
        host.style.setProperty('min-width', '0px', 'important');
      } else {
        // Do not force height unless the row/host already has a visible parent height.
        host.style.setProperty('min-height', '0px', 'important');
        host.style.setProperty('max-height', 'none', 'important');
      }
      host.style.setProperty('box-sizing', 'border-box', 'important');
      host.dataset.stLayoutHfFullPrimaryHost00663 = axis;
      return true;
    } catch (_) { return false; }
  }

  function hfNaturalPrimarySize00662_(el, axis, fallbackBox = null) {
    try {
      const b = fallbackBox || hfBox00661_(el);
      if (axis === 'x') return Math.max(1, Math.ceil(b.w || el.offsetWidth || el.scrollWidth || 1));
      return Math.max(1, Math.ceil(b.h || el.offsetHeight || el.scrollHeight || 1));
    } catch (_) { return 1; }
  }

  // [00666][HF BLOCK X BASE SIZE]
  // Horizontal block-align previously used the current rendered widths of all
  // siblings as fixed widths. In a flex row those current widths already include
  // the distributed free space, so selectedNext often became exactly the old
  // width and X-align looked dead. For X/primary-axis we freeze neighbours to their
  // authored/base flex-basis when possible and give the real free space to the
  // selected block.
  function hfPreferredBasePrimarySize00666_(el, axis, fallbackBox = null) {
    try {
      if (!(el instanceof HTMLElement)) return 1;
      const box = fallbackBox || hfBox00661_(el);
      const current = hfNaturalPrimarySize00662_(el, axis, box);
      const cs = getComputedStyle(el);
      const nums = [];
      const pushPx = (raw) => {
        const v = hfPx00661_(raw, NaN);
        if (Number.isFinite(v) && v > 0) nums.push(v);
      };
      pushPx(el.style?.flexBasis || '');
      pushPx(cs.flexBasis || '');
      pushPx(axis === 'x' ? (el.style?.width || '') : (el.style?.height || ''));
      const best = nums.find(v => v > 0 && v <= Math.max(current * 1.05, current + 2));
      if (Number.isFinite(best) && best > 0) return Math.max(1, Math.round(best));
      return current;
    } catch (_) { return hfNaturalPrimarySize00662_(el, axis, fallbackBox); }
  }

  function hfSetPrimarySize00662_(el, axis, sizePx, grow = false) {
    try {
      if (!(el instanceof HTMLElement) || !el.style) return false;
      const size = Math.max(1, Math.round(sizePx || 1));
      el.style.setProperty('box-sizing', 'border-box', 'important');
      el.style.setProperty('min-width', '0px', 'important');
      el.style.setProperty('max-width', axis === 'x' ? '100%' : 'none', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('flex', (grow ? '1 1 ' : '0 0 ') + size + 'px', 'important');
      el.style.setProperty('flex-basis', size + 'px', 'important');
      el.style.setProperty(axis === 'x' ? 'width' : 'height', size + 'px', 'important');
      return true;
    } catch (_) { return false; }
  }

  function applyHeaderFooterBlockPrimaryAxisFill00661_(block, host, axis, valFlex) {
    try {
      if (!(block instanceof HTMLElement) || !(host instanceof HTMLElement)) return false;
      const blockDiagStart00664 = {
        axis,
        val: valFlex,
        blockBefore: hfNodeSnap00664_(block),
        hostBefore: hfNodeSnap00664_(host),
        rawSelection: hfRawSelectionSnap00664_(),
        hostDirectBlocksBefore: hfChildrenSnap00664_(host, 'directBlocks')
      };
      hfPushAlignDiag00664_('block-primary-fill-entry', blockDiagStart00664, 'info');
      if (!isHeaderFooterArea_(block) || !isHeaderFooterArea_(host)) {
        hfPushAlignDiag00664_('block-primary-fill-reject-not-hf', blockDiagStart00664, 'warn');
        return false;
      }
      if (block.parentElement !== host) {
        hfPushAlignDiag00664_('block-primary-fill-reject-not-direct-child', blockDiagStart00664, 'warn');
        return false;
      }
      const dir = getHeaderFooterFlexDir00467_(host);
      const mainAxis = (axis === 'x' && dir === 'row') || (axis === 'y' && dir === 'column');
      if (!mainAxis) {
        hfPushAlignDiag00664_('block-primary-fill-reject-cross-axis', Object.assign({ dir, mainAxis }, blockDiagStart00664), 'info');
        return false;
      }

      const kids = hfDirectBlocks00661_(host);
      if (!kids.includes(block)) {
        hfPushAlignDiag00664_('block-primary-fill-reject-block-not-in-kids', Object.assign({ dir, kids: kids.length }, blockDiagStart00664), 'warn');
        return false;
      }

      // 00663 root cause: the row/host was often measured at its content width,
      // so selectedNext became equal to the old width and horizontal align looked dead.
      // The real source of truth is the parent row/section width; make the host fill it
      // before calculating the free primary-axis space.
      hfEnsureHostFullPrimary00663_(host, axis);

      const boxes = new Map(kids.map((ch) => [ch, hfBox00661_(ch)]));
      const current = new Map(kids.map((ch) => [ch, hfNaturalPrimarySize00662_(ch, axis, boxes.get(ch))]));
      const dirForBase00666 = getHeaderFooterFlexDir00467_(host);
      const useBaseForX00666 = axis === 'x' && dirForBase00666 === 'row';
      const base00666 = new Map(kids.map((ch) => [ch, useBaseForX00666 ? hfPreferredBasePrimarySize00666_(ch, axis, boxes.get(ch)) : (current.get(ch) || 1)]));
      const hostPrimary = hfInnerPrimarySize00662_(host, axis);
      const gap = hfPrimaryGap00662_(host, axis);
      const gaps = gap * Math.max(0, kids.length - 1);
      const fixedOthers = kids.reduce((sum, kid) => sum + (kid === block ? 0 : (base00666.get(kid) || current.get(kid) || 1)), 0);
      const selectedCurrent = current.get(block) || 1;
      const selectedBase00666 = base00666.get(block) || selectedCurrent;
      const availableForSelected = Math.max(selectedCurrent, selectedBase00666, hostPrimary - fixedOthers - gaps);

      clearHeaderFooterAlignTree00661_(host, 'block-primary-axis-fill-00662');

      host.dataset.layoutMode = 'flex';
      host.dataset.layoutOrient = dir;
      host.dataset.stLayoutHfBlockFillFlex00662 = '1';
      try { delete host.dataset.stLayoutHfBlockFillRow00661; } catch (_) {}
      try { delete host.dataset.stLayoutHfBlockFillFlex00661; } catch (_) {}
      stSetImportant00467_(host, 'display', 'flex');
      stSetImportant00467_(host, 'flex-direction', dir);
      stSetImportant00467_(host, 'flex-wrap', 'nowrap');
      stSetImportant00467_(host, 'box-sizing', 'border-box');
      stSetImportant00467_(host, 'max-width', '100%');
      stSetImportant00467_(host, 'min-width', '0px');
      stSetImportant00467_(host, 'overflow', 'visible');
      host.style.removeProperty('grid-template-columns');
      host.style.removeProperty('grid-auto-flow');
      host.style.removeProperty('justify-items');

      kids.forEach((kid) => {
        try {
          clearHeaderFooterAlignGarbage00661_(kid, 'block-fill-flex-child-00662');
          const base = useBaseForX00666
            ? (base00666.get(kid) || current.get(kid) || hfNaturalPrimarySize00662_(kid, axis, boxes.get(kid)))
            : (current.get(kid) || hfNaturalPrimarySize00662_(kid, axis, boxes.get(kid)));
          if (kid === block) {
            hfSetPrimarySize00662_(kid, axis, availableForSelected, true);
            kid.dataset.stLayoutHfBlockFilled00662 = String(valFlex || '1');
            kid.dataset.stLayoutHfBlockBaseCalc00666 = useBaseForX00666 ? 'x-base-neighbours' : 'current-size';
            try { delete kid.dataset.stLayoutHfBlockFilled00661; } catch (_) {}
          } else {
            hfSetPrimarySize00662_(kid, axis, base, false);
            if (useBaseForX00666) kid.dataset.stLayoutHfNeighbourBase00666 = String(Math.round(base));
          }
        } catch (_) {}
      });

      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-block-primary-axis-fill-flex-00662', {
          scope: componentScopeOfEl00451_(block), axis, val: valFlex, dir, children: kids.length,
          hostPrimary, fixedOthers, selectedCurrent, selectedBase00666, selectedNext: availableForSelected, gap,
          useBaseForX00666, baseOthers00666: kids.filter(k => k !== block).map(k => Math.round(base00666.get(k) || 0)),
          cls: String(block.className || '')
        }, 'info');
        if (useBaseForX00666) {
          window.__ST_PERF_DIAG__?.push?.('layout-hf-block-primary-axis-x-base-fill-00666', {
            scope: componentScopeOfEl00451_(block), axis, val: valFlex, dir, children: kids.length,
            hostPrimary, fixedOthers, selectedCurrent, selectedBase00666, selectedNext: availableForSelected, gap,
            baseAll00666: kids.map(k => Math.round(base00666.get(k) || 0)),
            currentAll00666: kids.map(k => Math.round(current.get(k) || 0)),
            cls: String(block.className || '')
          }, 'info');
        }
      } catch (_) {}
      hfPushAlignDiag00664_('block-primary-fill-write-done', {
        axis, val: valFlex, dir, hostPrimary, fixedOthers, selectedCurrent, selectedBase00666, selectedNext: availableForSelected, gap,
        useBaseForX00666,
        baseAll00666: kids.map(k => Math.round(base00666.get(k) || 0)),
        currentAll00666: kids.map(k => Math.round(current.get(k) || 0)),
        blockBefore: blockDiagStart00664.blockBefore,
        blockAfterNow: hfNodeSnap00664_(block),
        hostBefore: blockDiagStart00664.hostBefore,
        hostAfterNow: hfNodeSnap00664_(host),
        kidsBefore: blockDiagStart00664.hostDirectBlocksBefore,
        kidsAfterNow: hfChildrenSnap00664_(host, 'directBlocks')
      }, 'info');
      hfScheduleAfterAlignAudit00664_('block-primary-fill', block, host, axis, valFlex, blockDiagStart00664);
      return true;
    } catch (_) { return false; }
  }


  // [00667][HF BLOCK X ALIGN - NO FILL / NO SIBLING MUTATION]
  // Important separation:
  // - Align button must not resize the selected container.
  // - Align button must not recalculate/freeze sibling widths.
  // The previous 00662/00666 primary-axis fill path treated horizontal align as
  // "give free row space to the selected child". That made the selected footer
  // container grow from 245px to 484px and also rewrote neighbour bases. For a
  // normal Layout → Блок → X-align click we now keep every direct child size as-is.
  // When the selected HF container is in a row, X-align is applied safely to the
  // selected container's own internal horizontal content, because moving one flex
  // item on the primary axis without moving siblings is not a real flex operation.
  function applyHeaderFooterBlockXNoResize00667_(block, host, axis, valFlex) {
    try {
      if (!(block instanceof HTMLElement) || !(host instanceof HTMLElement)) return false;
      if (!isHeaderFooterArea_(block) || !isHeaderFooterArea_(host)) return false;
      if (axis !== 'x') return false;
      if (block.parentElement !== host) return false;
      const dir = getHeaderFooterFlexDir00467_(host);
      if (dir !== 'row') return false;
      const kids = hfDirectBlocks00661_(host);
      if (!kids.includes(block)) return false;

      const before00667 = {
        axis,
        val: valFlex,
        dir,
        blockBefore: hfNodeSnap00664_(block),
        hostBefore: hfNodeSnap00664_(host),
        kidsBefore: hfChildrenSnap00664_(host, 'directBlocks'),
        rawSelection: hfRawSelectionSnap00664_()
      };

      // Kill only the dangerous fill markers. Do not touch width/flex/flex-basis.
      try { delete host.dataset.stLayoutHfBlockFillFlex00662; } catch (_) {}
      try { delete host.dataset.stLayoutHfBlockFillFlex00661; } catch (_) {}
      try { delete host.dataset.stLayoutHfBlockFillRow00661; } catch (_) {}
      try { delete host.dataset.stLayoutHfFullPrimaryHost00663; } catch (_) {}
      kids.forEach((kid) => {
        try { delete kid.dataset.stLayoutHfBlockFilled00662; } catch (_) {}
        try { delete kid.dataset.stLayoutHfBlockFilled00661; } catch (_) {}
        try { delete kid.dataset.stLayoutHfBlockBaseCalc00666; } catch (_) {}
        try { delete kid.dataset.stLayoutHfNeighbourBase00666; } catch (_) {}
      });

      // Preserve the external box. Only align the visible content inside the selected
      // container so the click has an effect without stretching the container or
      // pushing neighbours. Respect the selected container orientation.
      const blockDir = getHeaderFooterFlexDir00467_(block);
      stSetImportant00467_(block, 'display', 'flex');
      stSetImportant00467_(block, 'flex-direction', blockDir || 'column');
      stSetImportant00467_(block, 'box-sizing', 'border-box');
      stSetImportant00467_(block, 'min-width', '0px');
      stSetImportant00467_(block, 'max-width', '100%');
      // Ensure old auto-margin align does not start moving/pushing flex siblings.
      block.style.removeProperty('margin-left');
      block.style.removeProperty('margin-right');
      block.style.removeProperty('justify-self');
      block.style.removeProperty('transform');
      try { delete block.dataset.stAlignDx; delete block.dataset.stAlignDy; delete block.dataset.stPrevAlignTransform; } catch (_) {}

      if (blockDir === 'row') {
        stSetImportant00467_(block, 'justify-content', valFlex);
      } else {
        stSetImportant00467_(block, 'align-items', valFlex);
      }
      const directInside00668 = getHeaderFooterDirectChildren_(block).filter((ch) => ch instanceof HTMLElement);
      directInside00668.forEach((ch) => {
        try {
          // Important: this moves only direct child boxes inside the selected container.
          // It does not resize the selected container and does not touch grandchildren.
          applyHeaderFooterDirectChildSelfAlign00668_(block, ch, axis, valFlex, blockDir, 'block-x-no-resize');
        } catch (_) {}
      });
      block.dataset.stLayoutHfBlockXNoResize00667 = String(valFlex || '');
      block.dataset.stLayoutChildrenAlignX = String(valFlex || '');

      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-direct-child-self-align-00668', {
          scope: componentScopeOfEl00451_(block), axis, val: valFlex, dir: blockDir, reason: 'block-x-no-resize', children: directInside00668.length, cls: String(block.className || '')
        }, 'info');
      } catch (_) {}
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-block-x-no-resize-align-00667', {
          scope: componentScopeOfEl00451_(block),
          axis,
          val: valFlex,
          dir,
          blockDir,
          children: kids.length,
          cls: String(block.className || '')
        }, 'info');
      } catch (_) {}
      hfPushAlignDiag00664_('block-x-no-resize-align-00667', Object.assign({}, before00667, {
        blockDir,
        blockAfterNow: hfNodeSnap00664_(block),
        hostAfterNow: hfNodeSnap00664_(host),
        kidsAfterNow: hfChildrenSnap00664_(host, 'directBlocks')
      }), 'info');
      hfScheduleAfterAlignAudit00664_('block-x-no-resize-align-00667', block, host, axis, valFlex, before00667);
      return true;
    } catch (_) { return false; }
  }


  // [00672][HF CONTAINER X ISOLATED VISUAL OFFSET ALIGN]
  // 00670/00671 rebuilt the whole row through margin-left values. That fixed the
  // basic movement, but when the selected container was moved from right to left
  // the following containers could be pulled along with it. For Header/Footer
  // container X-align the correct behaviour is isolated: move ONLY the selected
  // container visually inside the free slot between its neighbours. The row flow,
  // sibling widths, sibling margins and children/grandchildren are not touched.
  function applyHeaderFooterContainerXSlotAlign00669_(block, host, axis, valFlex) {
    try {
      if (!(block instanceof HTMLElement) || !(host instanceof HTMLElement)) return false;
      if (!isHeaderFooterArea_(block) || !isHeaderFooterArea_(host)) return false;
      if (axis !== 'x') return false;
      if (block.parentElement !== host) return false;
      const dir = getHeaderFooterFlexDir00467_(host);
      if (dir !== 'row') return false;
      const kids = hfDirectBlocks00661_(host).filter((kid) => kid instanceof HTMLElement);
      const selectedIndex00672 = kids.indexOf(block);
      if (selectedIndex00672 < 0) return false;

      const parsePx00672 = (v) => {
        const n = parseFloat(String(v || '').replace('px', '').trim());
        return Number.isFinite(n) ? n : 0;
      };
      const px00672 = (n) => {
        const v = Math.round((Number(n) || 0) * 100) / 100;
        return String(v) + 'px';
      };
      const clamp00672 = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));

      const hostRect00672 = host.getBoundingClientRect ? host.getBoundingClientRect() : null;
      const hostW00672 = Math.max(1, Number(hostRect00672?.width) || Number(hfBox00661_(host)?.w) || 1);
      const hostX00672 = Number(hostRect00672?.left) || 0;

      const boxes00672 = kids.map((kid) => {
        let r = null;
        try { r = kid.getBoundingClientRect ? kid.getBoundingClientRect() : null; } catch (_) { r = null; }
        const w = Math.max(1, Number(r?.width) || Number(hfBox00661_(kid)?.w) || 1);
        const visualX = Math.max(0, (Number(r?.left) || hostX00672) - hostX00672);
        // If this item was already moved by 00672, getBoundingClientRect() includes
        // the relative left offset. The flex slot itself is visualX - left.
        const ownLeft = parsePx00672(kid.style.left);
        const layoutX = visualX - ownLeft;
        return { kid, visualX, layoutX, w, ownLeft };
      });

      const selected00672 = boxes00672[selectedIndex00672];
      const prev00672 = selectedIndex00672 > 0 ? boxes00672[selectedIndex00672 - 1] : null;
      const next00672 = selectedIndex00672 < boxes00672.length - 1 ? boxes00672[selectedIndex00672 + 1] : null;
      const minVisualGap00672 = 4;

      const before00672 = {
        axis,
        val: valFlex,
        dir,
        hostW: hostW00672,
        selectedIndex: selectedIndex00672,
        blockBefore: hfNodeSnap00664_(block),
        hostBefore: hfNodeSnap00664_(host),
        kidsBefore: hfChildrenSnap00664_(host, 'directBlocks'),
        rowGeometryBefore: boxes00672.map((b, i) => ({
          index: i,
          visualX: Math.round(b.visualX),
          layoutX: Math.round(b.layoutX),
          left: Math.round(b.ownLeft),
          w: Math.round(b.w),
          active: b.kid === block
        })),
        rawSelection: hfRawSelectionSnap00664_()
      };

      // The slot is calculated from neighbour VISUAL positions. This guarantees
      // the selected container can detach from one side without pulling that side.
      const slotLeft00672 = prev00672 ? (prev00672.visualX + prev00672.w + minVisualGap00672) : 0;
      const slotRight00672 = next00672 ? (next00672.visualX - minVisualGap00672) : hostW00672;
      const minLeft00672 = clamp00672(slotLeft00672, 0, Math.max(0, hostW00672 - selected00672.w));
      const maxLeftRaw00672 = Math.min(Math.max(0, hostW00672 - selected00672.w), slotRight00672 - selected00672.w);
      const maxLeft00672 = Math.max(minLeft00672, maxLeftRaw00672);
      let targetLeft00672 = minLeft00672;
      if (valFlex === 'center') targetLeft00672 = minLeft00672 + ((maxLeft00672 - minLeft00672) / 2);
      else if (valFlex === 'flex-end') targetLeft00672 = maxLeft00672;
      targetLeft00672 = clamp00672(targetLeft00672, minLeft00672, maxLeft00672);

      const nextLeftOffset00672 = targetLeft00672 - selected00672.layoutX;

      // Keep the row as a normal flex row. Do not rebuild the whole row and do
      // not write margin/flex/width to siblings. Only the active container gets
      // a relative offset.
      host.dataset.layoutMode = 'flex';
      host.dataset.layoutOrient = 'row';
      host.dataset.stLayoutHfContainerXIsolated00672 = String(valFlex || 'flex-start');
      try { delete host.dataset.stLayoutHfContainerXSlotHost00669; } catch (_) {}
      try { delete host.dataset.stLayoutHfContainerXGapAlign00670; } catch (_) {}
      try { delete host.dataset.stLayoutHfContainerXNoOverlap00671; } catch (_) {}
      try { delete host.dataset.stLayoutHfBlockFillFlex00662; } catch (_) {}
      try { delete host.dataset.stLayoutHfBlockFillFlex00661; } catch (_) {}
      try { delete host.dataset.stLayoutHfBlockFillRow00661; } catch (_) {}
      try { delete host.dataset.stLayoutHfFullPrimaryHost00663; } catch (_) {}
      stSetImportant00467_(host, 'display', 'flex');
      stSetImportant00467_(host, 'flex-direction', 'row');
      stSetImportant00467_(host, 'flex-wrap', 'nowrap');
      stSetImportant00467_(host, 'box-sizing', 'border-box');
      stSetImportant00467_(host, 'max-width', '100%');
      stSetImportant00467_(host, 'min-width', '0px');
      host.style.removeProperty('grid-template-columns');
      host.style.removeProperty('grid-auto-flow');
      host.style.removeProperty('justify-items');

      kids.forEach((kid) => {
        try {
          kid.style.removeProperty('transform');
          kid.style.removeProperty('justify-self');
          kid.style.removeProperty('place-self');
          if (kid !== block) {
            // Neighbours must not be moved by this operation. Also clear only
            // old 00672 visual offsets from neighbours; their normal layout
            // margins/flex values stay untouched.
            if (kid.dataset && kid.dataset.stLayoutHfContainerXIsolated00672) {
              kid.style.removeProperty('position');
              kid.style.removeProperty('left');
              kid.style.removeProperty('right');
              delete kid.dataset.stLayoutHfContainerXIsolated00672;
            }
            try { delete kid.dataset.stLayoutHfContainerXSlotAlign00669; } catch (_) {}
            try { delete kid.dataset.stLayoutHfContainerXGapAlign00670; } catch (_) {}
            try { delete kid.dataset.stLayoutHfContainerXNoOverlap00671; } catch (_) {}
          }
        } catch (_) {}
      });

      // Do not call clearHeaderFooterAlignGarbage00661_ here: it clears margins
      // and would change the row flow before/while we are trying to move only
      // the selected visual box. Container X-align must not pull siblings.
      block.style.setProperty('box-sizing', 'border-box', 'important');
      block.style.setProperty('min-width', '0px', 'important');
      block.style.setProperty('max-width', '100%', 'important');
      block.style.setProperty('position', 'relative', 'important');
      block.style.setProperty('left', px00672(nextLeftOffset00672), 'important');
      block.style.setProperty('right', 'auto', 'important');
      block.style.removeProperty('transform');
      block.style.removeProperty('justify-self');
      block.style.removeProperty('place-self');
      try {
        block.dataset.stLayoutHfContainerXIsolated00672 = String(valFlex || 'flex-start');
        delete block.dataset.stAlignDx;
        delete block.dataset.stAlignDy;
        delete block.dataset.stPrevAlignTransform;
        delete block.dataset.stLayoutHfBlockFilled00662;
        delete block.dataset.stLayoutHfBlockFilled00661;
        delete block.dataset.stLayoutHfBlockBaseCalc00666;
        delete block.dataset.stLayoutHfNeighbourBase00666;
        delete block.dataset.stLayoutHfBlockXNoResize00667;
        delete block.dataset.stLayoutHfContainerXSlotAlign00669;
        delete block.dataset.stLayoutHfContainerXGapAlign00670;
        delete block.dataset.stLayoutHfContainerXNoOverlap00671;
      } catch (_) {}

      const rowGeometryAfterPlan00672 = boxes00672.map((b, i) => ({
        index: i,
        visualX: Math.round(i === selectedIndex00672 ? targetLeft00672 : b.visualX),
        layoutX: Math.round(b.layoutX),
        left: Math.round(i === selectedIndex00672 ? nextLeftOffset00672 : b.ownLeft),
        w: Math.round(b.w),
        active: b.kid === block
      }));

      try {
        window.__ST_PERF_DIAG__?.push?.('layout-hf-container-x-isolated-00672', {
          scope: componentScopeOfEl00451_(block),
          axis,
          val: valFlex,
          dir,
          children: kids.length,
          selectedIndex: selectedIndex00672,
          hostW: Math.round(hostW00672),
          slot: { left: Math.round(slotLeft00672), right: Math.round(slotRight00672), target: Math.round(targetLeft00672) },
          offsetLeft: Math.round(nextLeftOffset00672),
          minGap: minVisualGap00672,
          row: rowGeometryAfterPlan00672,
          cls: String(block.className || '')
        }, 'info');
      } catch (_) {}
      hfPushAlignDiag00664_('container-x-isolated-00672', Object.assign({}, before00672, {
        slot: { left: slotLeft00672, right: slotRight00672, target: targetLeft00672 },
        offsetLeft: nextLeftOffset00672,
        minGap: minVisualGap00672,
        rowGeometryAfterPlan: rowGeometryAfterPlan00672,
        blockAfterNow: hfNodeSnap00664_(block),
        hostAfterNow: hfNodeSnap00664_(host),
        kidsAfterNow: hfChildrenSnap00664_(host, 'directBlocks')
      }), 'info');
      hfScheduleAfterAlignAudit00664_('container-x-isolated-00672', block, host, axis, valFlex, before00672);
      return true;
    } catch (_) { return false; }
  }

  function applyHeaderFooterSafeBlockAlign00660_(block, host, axis, valFlex) {
    try {
      if (!(block instanceof HTMLElement) || !(host instanceof HTMLElement)) return false;
      const safeDiagBefore00664 = {
        axis,
        val: valFlex,
        blockBefore: hfNodeSnap00664_(block),
        hostBefore: hfNodeSnap00664_(host),
        rawSelection: hfRawSelectionSnap00664_(),
        hostChildrenBefore: hfChildrenSnap00664_(host, 'directBlocks')
      };
      hfPushAlignDiag00664_('safe-block-entry', safeDiagBefore00664, 'info');
      if (!isHeaderFooterArea_(block) && !isHeaderFooterArea_(host)) {
        hfPushAlignDiag00664_('safe-block-reject-not-hf', safeDiagBefore00664, 'warn');
        return false;
      }

      const preDir00672 = getHeaderFooterFlexDir00467_(host);
      // 00672: for container X-align in a row, handle BEFORE clearHeaderFooterAlignTree00661_.
      // That cleaner removes margins from the whole row and was the reason the right side
      // could be dragged/recalculated during left/right alignment. This branch must be
      // isolated and must not mutate siblings.
      if (axis === 'x' && preDir00672 === 'row' && applyHeaderFooterContainerXSlotAlign00669_(block, host, axis, valFlex)) return true;

      clearHeaderFooterAlignTree00661_(host, 'safe-block-align-entry-00661');
      stripHeaderFooterAlignHeightStretch00657_(block, 'safe-block-align-entry-00661');

      const dir = getHeaderFooterFlexDir00467_(host);
      const isPrimaryAxis = (axis === 'x' && dir === 'row') || (axis === 'y' && dir === 'column');

      // Fallback only. Normal Header/Footer row X-align is handled above before
      // the row cleaner can rewrite margins.
      if (axis === 'x' && dir === 'row' && applyHeaderFooterContainerXSlotAlign00669_(block, host, axis, valFlex)) return true;

      // Keep the old primary-axis fill path only for non-X cases. In practice this
      // preserves the vertical behavior the user reported as working, while cutting
      // the dangerous horizontal resize path.
      if (!(axis === 'x' && dir === 'row') && applyHeaderFooterBlockPrimaryAxisFill00661_(block, host, axis, valFlex)) return true;

      if (!isPrimaryAxis) {
        block.style.setProperty('align-self', valFlex, 'important');
        block.style.setProperty('--st-layout-y-align', flexAlignToGridAlign_(valFlex));
        block.dataset.stLayoutHfBlockCrossAlign00662 = '1'; try { delete block.dataset.stLayoutHfBlockCrossAlign00661; } catch (_) {}
        try {
          window.__ST_PERF_DIAG__?.push?.('layout-hf-block-align-cross-axis-00662', {
            scope: componentScopeOfEl00451_(block), axis, val: valFlex, dir, cls: String(block.className || '')
          }, 'info');
        } catch (_) {}
        hfPushAlignDiag00664_('safe-block-cross-axis-write-done', {
          axis, val: valFlex, dir,
          before: safeDiagBefore00664,
          blockAfterNow: hfNodeSnap00664_(block),
          hostAfterNow: hfNodeSnap00664_(host)
        }, 'info');
        hfScheduleAfterAlignAudit00664_('safe-block-cross-axis', block, host, axis, valFlex, safeDiagBefore00664);
        return true;
      }

      // Single child or non-direct odd case: use normal CSS only, still no transform.
      // 00670: direct HF row/X block alignment belongs to the row slot. If this
      // odd fallback is still reached, try slot-align first; otherwise use generic.
      if (axis === 'x' && getHeaderFooterFlexDir00467_(host) === 'row' && isHeaderFooterArea_(block) && applyHeaderFooterContainerXSlotAlign00669_(block, host, axis, valFlex)) {
        // handled
      } else if (axis === 'x') applyAlignXToBlock_(block, host, valFlex);
      else applyAlignYToBlock_(block, host, valFlex);
      clearHeaderFooterAlignGarbage00661_(block, 'single-block-align-00661');
      hfPushAlignDiag00664_('safe-block-single-fallback-write-done', {
        axis, val: valFlex, dir,
        before: safeDiagBefore00664,
        blockAfterNow: hfNodeSnap00664_(block),
        hostAfterNow: hfNodeSnap00664_(host)
      }, 'info');
      hfScheduleAfterAlignAudit00664_('safe-block-single-fallback', block, host, axis, valFlex, safeDiagBefore00664);
      return true;
    } catch (_) { return false; }
  }


  function applyBoundedBlockAlignInParent_(block, host, axis, valFlex) {
    return applyHeaderFooterSafeBlockAlign00660_(block, host, axis, valFlex);
  }

  function hasExplicitLayoutHeight_(el) {
    try {
      const h = String(el?.style?.height || '').trim();
      return !!h && h !== 'auto';
    } catch (_) { return false; }
  }


  function hasUserManualHeaderFooterWidth00473_(el) {
    try {
      if (!(el instanceof HTMLElement)) return false;
      const ds = el.dataset || {};
      if (ds.stHeaderManualW === '1' || ds.stFooterManualW === '1' || ds.stLayoutManualW === '1') return true;
      if (el.style?.getPropertyValue?.('--st-header-manual-w') || el.style?.getPropertyValue?.('--st-footer-manual-w')) return true;
      return false;
    } catch (_) { return false; }
  }

  function releaseHeaderFooterChildSizeForAlign00473_(child, axis, hostDir) {
    try {
      if (!(child instanceof HTMLElement) || !child.style || !isHeaderFooterArea_(child)) return;
      // [00660] HARD CUT: this function used to release width/height/flex before
      // alignment. That is exactly what made children expand/shrink. It now only
      // removes stale transform offsets and impossible stretch heights; it never
      // writes width, height, flex, flex-basis, flex-grow or flex-shrink.
      cleanHeaderFooterNoOverlapAlign00660_(child, 'release-no-size-00660');
      child.style.setProperty('box-sizing', 'border-box', 'important');
      child.style.setProperty('max-width', '100%', 'important');
      if (axis === 'y') stripHeaderFooterAlignHeightStretch00657_(child, 'release-no-size-axis-y-00660');
      try { child.dataset.stLayoutWidthReleaseCut00660 = '1'; } catch (_) {}
    } catch (_) {}
  }

  function valToAlignSelf00473_(val) {
    return (val === 'flex-end' || val === 'center' || val === 'flex-start') ? val : '';
  }

  function isMenuLeafBlock_(el) {
    try { return !!(el && el.classList && el.classList.contains('st-block--menu')); } catch (_) { return false; }
  }

  function applyHeaderFooterLeafChildrenAlign_(hostEl, axis, val) {
    if (!hostEl || !hostEl.style || !isHeaderFooterArea_(hostEl)) return false;
    if (!hasHeaderFooterLeafVisualChildren_(hostEl)) return false;

    const kids = getHeaderFooterLeafVisualChildren_(hostEl);
    kids.forEach(ch => {
      if (!ch || !ch.style) return;
      ch.style.marginTop = '';
      ch.style.marginBottom = '';
      ch.style.marginLeft = '';
      ch.style.marginRight = '';
      ch.style.alignSelf = '';
      ch.style.justifySelf = '';
      // Внутрішній текст/іконка має лишатись у межах свого leaf-блока.
      ch.style.maxWidth = ch.style.maxWidth || '100%';
      ch.style.boxSizing = 'border-box';
    });

    repairAutoHeightForVerticalAlign_(hostEl);
    hostEl.dataset.stLayoutLeafChildrenAlign = '1';

    const cs = getComputedStyle(hostEl);
    const display = String(hostEl.style.display || cs.display || '').trim();
    const dir = String(hostEl.style.flexDirection || cs.flexDirection || 'row').trim();
    const gridVal = flexAlignToGridAlign_(val);

    if (display.includes('grid')) {
      if (axis === 'x') {
        hostEl.style.justifyItems = gridVal;
        hostEl.style.justifyContent = gridVal;
      } else {
        hostEl.style.alignItems = gridVal;
        hostEl.style.alignContent = gridVal;
      }
      return true;
    }

    // Телефон/кнопка/іконка — flex/inline-flex. Не міняємо display, щоб не ламати
    // resize-математику з 00272; тільки пишемо правильну axis-властивість.
    if (applyHeaderFooterAxisAlign00467_(hostEl, axis, val)) return true;
    if (axis === 'x') {
      if (dir === 'column') {
        hostEl.style.alignItems = val;
        hostEl.dataset.stLayoutChildrenAlignX = val;
      } else {
        hostEl.style.justifyContent = val;
        hostEl.dataset.stLayoutChildrenAlignX = val;
      }
    } else {
      if (dir === 'column') hostEl.style.justifyContent = val;
      else hostEl.style.alignItems = val;
    }
    return true;
  }


  // [00475][HF SAFE ALIGN - PRESERVE SIZES]
  // Legacy name kept for compatibility with the already working footer chain.
  // [00620] This guard is now shared by HEADER + FOOTER instead of duplicating the
  // 00617/00618/00619 logic. It must only change positioning inside the selected
  // container and must not resize children, convert blocks to fit-content, grow
  // the host, or trigger HF DOM normalization.
  function isFooterArea00475_(el) {
    try {
      return !!(el instanceof HTMLElement && el.closest?.(
        '#st-site-footer-slot, .st-site-footer-slot, .st-section[data-sec-role="footer"], ' +
        '#st-site-header-slot, .st-site-header-slot, .st-section[data-sec-role="header"]'
      ));
    } catch (_) { return false; }
  }

  // [00656] Removed obsolete footerAlignSnapshotStyles00475_.

  // [00656] Removed obsolete restoreFooterAlignSizes00475_.

  // [00617][HF ALIGN CHILDREN - DEEP SIZE GUARD]
  // Header/Footer “Діти” alignment must align content, not resize it. The universal
  // alignment layer (00479) intentionally enters nested text/phone/button blocks;
  // before 00617 it could convert inner blocks to width:auto / flex:0 1 auto,
  // so the block collapsed to the text minimum and then squeezed its own children.
  // This guard snapshots only geometry of nested HF content and restores it
  // after alignment, while keeping the new text-align / justify-content / align-items.
  function footerAlignDeepSizeSnapshot00617_(hostEl, directChildren) {
    try {
      if (!(hostEl instanceof HTMLElement) || !isFooterArea00475_(hostEl)) return [];
      const skip = new Set([hostEl, ...Array.from(directChildren || [])]);
      const props = [
        'width','minWidth','maxWidth','height','minHeight','maxHeight',
        'flex','flexBasis','flexGrow','flexShrink','aspectRatio','boxSizing','overflow'
      ];
      const vars = [
        '--st-layout-child-w-00469','--st-layout-child-h-00469',
        '--st-footer-manual-w','--st-footer-manual-h','--st-footer-direct-w-00592','--st-footer-direct-h-00592'
      ];
      const selector = [
        '.st-block', '.st-row', '.st-text-edit', '.st-phone__text',
        '.st-button__label', '.st-icon-btn', '.st-icon-svg', '.st-png__media'
      ].join(',');
      const out = [];
      const seen = new Set();
      Array.from(hostEl.querySelectorAll?.(selector) || []).forEach((el) => {
        try {
          if (!(el instanceof HTMLElement) || !el.style) return;
          if (skip.has(el) || seen.has(el)) return;
          if (el.closest?.('.st-resize, [data-st-menu-item="1"], .st-block--menu-item')) return;
          const r = el.getBoundingClientRect?.();
          const st = {};
          props.forEach((k) => { try { st[k] = el.style[k] || ''; } catch (_) {} });
          vars.forEach((k) => { try { st[k] = el.style.getPropertyValue(k) || ''; } catch (_) {} });
          seen.add(el);
          out.push({
            el,
            w: Math.max(1, Math.round(r?.width || el.offsetWidth || 1)),
            h: Math.max(1, Math.round(r?.height || el.offsetHeight || 1)),
            st
          });
        } catch (_) {}
      });
      return out;
    } catch (_) { return []; }
  }

  function restoreFooterAlignDeepSizes00617_(snaps) {
    try {
      Array.from(snaps || []).forEach((snap) => {
        try {
          const el = snap?.el;
          if (!(el instanceof HTMLElement) || !el.style) return;
          const st = snap.st || {};

          ['minWidth','maxWidth','minHeight','maxHeight','aspectRatio','boxSizing','overflow'].forEach((k) => {
            try { el.style[k] = st[k] || ''; } catch (_) {}
          });

          // Restore width/height/flex only. Do not restore margins, align-self,
          // justify-content, align-items or text-align, because those are the actual
          // alignment result the user asked for.
          try {
            if (st.width) el.style.width = st.width;
            else el.style.setProperty('width', Math.max(1, Math.round(snap.w || 1)) + 'px', 'important');
          } catch (_) {}
          try {
            if (st.height) el.style.height = st.height;
            else if (snap.h > 1) el.style.setProperty('height', Math.max(1, Math.round(snap.h || 1)) + 'px', 'important');
          } catch (_) {}
          try {
            if (st.flex) el.style.setProperty('flex', st.flex, 'important');
            else el.style.removeProperty('flex');
            if (st.flexBasis) el.style.setProperty('flex-basis', st.flexBasis, 'important');
            else el.style.removeProperty('flex-basis');
            if (st.flexGrow) el.style.setProperty('flex-grow', st.flexGrow, 'important');
            else el.style.removeProperty('flex-grow');
            if (st.flexShrink) el.style.setProperty('flex-shrink', st.flexShrink, 'important');
            else el.style.removeProperty('flex-shrink');
          } catch (_) {}

          ['--st-layout-child-w-00469','--st-layout-child-h-00469','--st-footer-manual-w','--st-footer-manual-h','--st-footer-direct-w-00592','--st-footer-direct-h-00592'].forEach((k) => {
            try {
              const v = st[k] || '';
              if (v) el.style.setProperty(k, v);
              else el.style.removeProperty(k);
            } catch (_) {}
          });
          try { el.dataset.stFooterAlignDeepSizeGuard00617 = '1'; } catch (_) {}
        } catch (_) {}
      });
    } catch (_) {}
  }


  // [00618][HF ALIGN HOST EXTERNAL SIZE GUARD]
  // 00617 protected nested children from width:auto/flex shrink, but the selected
  // header/footer container itself can still lose its external box when alignment is
  // accidentally routed through a leaf/text host or when generic flex rules get
  // re-applied. This guard restores only the selected container's outside geometry
  // after alignment; it intentionally keeps justify-content/align-items/text-align.
  function footerAlignHostExternalSnapshot00618_(hostEl) {
    try {
      if (!(hostEl instanceof HTMLElement) || !hostEl.style || !isFooterArea00475_(hostEl)) return null;
      if (!hostEl.classList?.contains('st-block')) return null;
      if (!(isFooterTopContainer00473_(hostEl) || isHeaderFooterDirectBlockChildrenHost_(hostEl))) return null;
      const r = hostEl.getBoundingClientRect?.();
      const props = [
        'width','minWidth','maxWidth','height','minHeight','maxHeight',
        'flex','flexBasis','flexGrow','flexShrink','aspectRatio','boxSizing','overflow'
      ];
      const vars = [
        '--st-layout-child-w-00469','--st-layout-child-h-00469',
        '--st-footer-manual-w','--st-footer-manual-h','--st-footer-direct-w-00592','--st-footer-direct-h-00592'
      ];
      const st = {};
      props.forEach((k) => { try { st[k] = hostEl.style[k] || ''; } catch (_) {} });
      vars.forEach((k) => { try { st[k] = hostEl.style.getPropertyValue(k) || ''; } catch (_) {} });
      return {
        el: hostEl,
        w: Math.max(1, Math.round(r?.width || hostEl.offsetWidth || 1)),
        h: Math.max(1, Math.round(r?.height || hostEl.offsetHeight || 1)),
        st
      };
    } catch (_) { return null; }
  }

  function restoreFooterAlignHostExternal00618_(snap) {
    try {
      const el = snap?.el;
      if (!(el instanceof HTMLElement) || !el.style) return false;
      const st = snap.st || {};

      ['minWidth','maxWidth','minHeight','maxHeight','aspectRatio','boxSizing','overflow'].forEach((k) => {
        try { el.style[k] = st[k] || ''; } catch (_) {}
      });

      // Keep the user-visible outer box. If the old state had no inline width/height,
      // write the measured box so centre-align cannot collapse the selected container.
      try {
        if (st.width) el.style.width = st.width;
        else el.style.setProperty('width', Math.max(1, Math.round(snap.w || 1)) + 'px', 'important');
      } catch (_) {}
      try {
        if (st.height) el.style.height = st.height;
        else if ((snap.h || 0) > 1) el.style.setProperty('height', Math.max(1, Math.round(snap.h || 1)) + 'px', 'important');
      } catch (_) {}

      try {
        if (st.flex) el.style.setProperty('flex', st.flex, 'important');
        else el.style.setProperty('flex', '0 0 ' + Math.max(1, Math.round(snap.w || 1)) + 'px', 'important');
        if (st.flexBasis) el.style.setProperty('flex-basis', st.flexBasis, 'important');
        else el.style.setProperty('flex-basis', Math.max(1, Math.round(snap.w || 1)) + 'px', 'important');
        if (st.flexGrow) el.style.setProperty('flex-grow', st.flexGrow, 'important');
        else el.style.setProperty('flex-grow', '0', 'important');
        if (st.flexShrink) el.style.setProperty('flex-shrink', st.flexShrink, 'important');
        else el.style.setProperty('flex-shrink', '0', 'important');
      } catch (_) {}

      ['--st-layout-child-w-00469','--st-layout-child-h-00469','--st-footer-manual-w','--st-footer-manual-h','--st-footer-direct-w-00592','--st-footer-direct-h-00592'].forEach((k) => {
        try {
          const v = st[k] || '';
          if (v) el.style.setProperty(k, v);
          // [00651] Do not create a new footer manual width during align.
          // Align must preserve the visible box for this operation only; turning that
          // box into --st-footer-manual-w makes later mouse shrink feel blocked.
          else el.style.removeProperty(k);
        } catch (_) {}
      });
      try { el.dataset.stFooterAlignHostSizeGuard00618 = '1'; } catch (_) {}
      return true;
    } catch (_) { return false; }
  }

  // [00656] Removed obsolete applyFooterChildrenVisualAlignPreserveSize00475_ from active code.

// [00476][FOOTER CHILDREN ALIGN - INNER VISUAL CONTENT]
  // Some footer contact blocks (location/email) are full-width wrappers with
  // icon/text inside. Aligning only the wrapper is visually invisible. For footer
  // container + “Діти”, align both the direct child boxes AND their inner visual
  // content, without changing the child box width/height.
  // [00656] Removed obsolete getFooterChildContentHost00476_.

  // [00656] Removed obsolete applyFooterInnerVisualAlign00476_.

// [00656] Removed obsolete applyFooterChildrenVisualAlignPreserveSize00476_ from active code.

// [00477][FOOTER CHILDREN ALIGN - REAL VISIBLE TARGETS]
  // Footer contact blocks can be nested like: Contact container -> Email wrapper ->
  // icon block + text block -> .st-text-edit. If the wrapper is full-width,
  // aligning only the wrapper is visually invisible. This aligns the real visible
  // row/content inside each child while preserving the external child box.
  // [00656] Removed obsolete getFooterVisibleParts00477_.

  // [00656] Removed obsolete isFooterContactLikeChild00477_.

  // [00656] Removed obsolete releaseFooterInnerNaturalText00477_.

// [00656] Removed obsolete applyFooterInnerVisualAlign00477_ from active code.

  // [00656] Removed obsolete applyFooterChildrenVisualAlignPreserveSize00477_ from active code.

// [00479][HF UNIVERSAL CHILD ALIGN]
  // Legacy footer function names are intentionally kept, but [00620] the working
  // footer alignment chain is now shared with header. One HF template may store a
  // visible child as a direct .st-block, another as .st-block -> .st-row ->
  // .st-block--text -> .st-text-edit. The alignment UI must work for both when
  // the user selects a header/footer container and switches to “Діти”. This layer
  // keeps the external boxes safe and aligns every real visible content target
  // inside those boxes: headings, paragraphs, buttons, phones, icons, logos, etc.
  // [00656] Removed obsolete footerAlignTextValue00479_.

// [00656] Removed obsolete isFooterManualWidth00479_.

  // [00656] Removed obsolete isFooterManualHeight00479_.

  // [00656] Removed obsolete isFooterTextLike00479_.

  // [00656] Removed obsolete footerRealTextNodes00479_.

  // [00656] Removed obsolete releaseFooterTextBoxForAlign00479_.

  // [00656] Removed obsolete footerContentHosts00479_.

  // [00656] Removed obsolete applyFooterContentHostAlign00479_.

// [00656] Removed obsolete applyFooterUniversalChildAlign00479_ from active code.

  function alignFlexValue00656_(val) {
    return (val === 'start') ? 'flex-start' : (val === 'end') ? 'flex-end' : val;
  }

// [00655] Removed old applyFooterChildrenVisualAlignUniversal00479_ branch.
  // The active Header/Footer children-align chain must not re-enter the stale
  // universal footer path after menu-specific alignment.

  function applyHeaderFooterMenuChildrenAlign00654_(hostEl, axis, val) {
    // 00663 HARD DISABLED: old stacked Header/Footer children-align branch.
    // Clean active path is applyHeaderFooterChildrenAlignClean00661_ / applyHeaderFooterRowChildrenAlignClean00661_.
    return false;
  }

  function applyHeaderFooterChildrenAlignUnified00656_(hostEl, axis, val) {
    // 00663 HARD DISABLED: old stacked Header/Footer children-align branch.
    // Clean active path is applyHeaderFooterChildrenAlignClean00661_ / applyHeaderFooterRowChildrenAlignClean00661_.
    return false;
  }

  function applyHeaderFooterChildrenVisualAlign_(hostEl, axis, val) {
    // 00661: one clean Header/Footer children-align path. The old stacked 00475-00660
    // branches are not re-entered from the active click chain.
    return applyHeaderFooterChildrenAlignClean00661_(hostEl, axis, val);
  }


  function applyFlexHostAlign_(hostEl, axis, val) {
    if (!hostEl || !hostEl.style) return false;
    if (!isRowEl_(hostEl)) ensureFlexHost_(hostEl);

    // [00799] Content + “Діти” uses a clean direct-children flex route.
    if (isRemovedContentLayoutArea00799_(hostEl)) {
      return applyRemovedContentChildrenAlign00799_(hostEl, axis, val);
    }

    // [00656] Header/Footer level + “Діти” has one direct-children align path
    // for both axes. It clears old per-container align-self/translate artifacts,
    // so the middle menu container aligns together with the side containers.
    if (isRowEl_(hostEl) && isHeaderFooterArea_(hostEl)) {
      return applyHeaderFooterRowChildrenAlignClean00661_(hostEl, axis, val);
    }

    const modeNow = hostEl.dataset?.layoutMode || (isRowEl_(hostEl) ? 'fr' : 'flex');
    const dir = (hostEl.style.flexDirection || getComputedStyle(hostEl).flexDirection || hostEl.dataset?.layoutOrient || 'row');
    const children = getDirectLayoutChildren_(hostEl);
    clearDirectChildrenAxisOverrides_(children, axis);

    // [00456][GAP-MANAGED ALIGN]
    // 00455 intentionally forced gap-managed footer/header rows to flex-start so
    // Gap X=0 was truly zero. Once the user clicks an alignment button, that click
    // must become the explicit source of truth and release the CSS fallback.
    try {
      if (axis === 'x') hostEl.dataset.stLayoutChildrenAlignX = String(val || '');
      else hostEl.dataset.stLayoutChildrenAlignY = String(val || '');
    } catch (_) {}
    try { stretchFooterTopLevelRowChildren00456_(hostEl); } catch (_) {}

    if (isHeaderFooterArea_(hostEl) && (modeNow === 'flex' || !isRowEl_(hostEl))) {
      applyHeaderFooterAxisAlign00467_(hostEl, axis, val);
    } else if (modeNow === 'flex' || !isRowEl_(hostEl)) {
      if (axis === 'x') {
        if (dir === 'column') hostEl.style.alignItems = val;
        else hostEl.style.justifyContent = val;
      } else {
        if (dir === 'column') hostEl.style.justifyContent = val;
        else hostEl.style.alignItems = val;
      }
    } else {
      const gridVal = layoutFlexToGrid_(val);
      if (axis === 'x') {
        hostEl.style.justifyItems = gridVal;
        hostEl.style.justifyContent = gridVal;
      } else {
        if (isRowEl_(hostEl)) ensureRowFillParent_(hostEl);
        hostEl.style.alignItems = gridVal;
        hostEl.style.alignContent = gridVal;
      }
    }

    // Якщо прямою дитиною контейнера є меню, даємо такий самий напрям і пунктам меню рівня 1.
    // Це прибирає ситуацію, коли сам блок меню розтягнутий на всю ширину контейнера,
    // тому align батька візуально не видно, хоча всередині меню ще є простір.
    children.forEach(ch => {
      const menu = ch?.classList?.contains('st-block--menu') ? ch : null;
      if (!menu) return;
      if (axis === 'x') writeMenuLevel1LayoutPatch_(menu, { justify: val });
      else writeMenuLevel1LayoutPatch_(menu, { align: val });
    });

    return true;
  }

  function applyAlignToHostChildren_(hostEl, axis, val) {
    const rawHost00664 = hostEl;
    // [00674] Absolute first route: selected menu block + Діти.
    // No normalizeLayoutSelectable_ and no parent fallback before menu children align.
    if (rawHost00664 instanceof HTMLElement && rawHost00664.classList?.contains('st-block--menu')) {
      hfPushMenuAlign00674_('direct-entry-before-normalize', { axis, val, host: hfMenuNodeSnap00674_(rawHost00664) }, 'warn');
      return applyHeaderFooterMenuChildrenAlignClean00674_(rawHost00664, axis, val);
    }
    // [00801] Content + “Діти” must not be normalized down to an inner text node.
    // The selected Content container/row/section is the layout host.
    if (rawHost00664 instanceof HTMLElement && isRemovedContentLayoutArea00799_(rawHost00664) && hasDirectLayoutChildren_(rawHost00664)) {
      const okContentRaw00801 = rawHost00664.classList?.contains('st-section')
        ? applyRemovedContentSectionRowsAlign00799_(rawHost00664, axis, val)
        : applyRemovedContentChildrenAlign00799_(rawHost00664, axis, val);
      try {
        window.__ST_PERF_DIAG__?.push?.('layout-content-disabled-children-direct-host-00802', {
          ok: !!okContentRaw00801,
          axis,
          val,
          cls: String(rawHost00664.className || '')
        }, okContentRaw00801 ? 'info' : 'warn');
      } catch (_) {}
      if (okContentRaw00801) return true;
    }
    hostEl = normalizeLayoutSelectable_(hostEl);
    const hostChildrenEntry00664 = {
      axis,
      val,
      rawHost: hfNodeSnap00664_(rawHost00664),
      normalizedHost: hfNodeSnap00664_(hostEl),
      rawSelection: hfRawSelectionSnap00664_(),
      preferred: preferredLayoutScope00451_()
    };
    hfPushAlignDiag00664_('apply-host-children-entry', hostChildrenEntry00664, 'info');
    if (!hostEl) {
      hfPushAlignDiag00664_('apply-host-children-no-host', hostChildrenEntry00664, 'warn');
      return false;
    }

    // HEADER/FOOTER leaf + Діти:
    // Для кнопки/телефону/лого режим «Діти» означає внутрішній текст/іконку.
    // Раніше leaf не мав .st-block дітей, тому код піднімався до батьківського контейнера
    // і кнопка/телефон у режимі «Діти» виглядали як неробочі.
    if (applyHeaderFooterLeafChildrenAlign_(hostEl, axis, val)) {
      hfPushAlignDiag00664_('apply-host-children-path-leaf', Object.assign({}, hostChildrenEntry00664, {
        leafChildren: hfChildrenSnap00664_(hostEl, 'all')
      }), 'info');
      hfScheduleAfterAlignAudit00664_('apply-host-children-leaf', hostEl, hostEl, axis, val, hostChildrenEntry00664);
      return true;
    }

    // SECTION + Діти:
    // налаштовуємо прямий рівень/row секції як об'єкт у секції,
    // а не контейнери всередині рівня.
    if (hostEl.classList?.contains('st-section')) {
      if (isRemovedContentLayoutArea00799_(hostEl)) {
        const okContentSection = applyRemovedContentSectionRowsAlign00799_(hostEl, axis, val);
        if (okContentSection) return true;
      }
      const rows = Array.from(hostEl.querySelectorAll?.(':scope > .st-row') || []);
      if (!rows.length) {
        hfPushAlignDiag00664_('apply-host-children-section-no-rows', hostChildrenEntry00664, 'warn');
        return false;
      }
      hfPushAlignDiag00664_('apply-host-children-path-section-rows', Object.assign({}, hostChildrenEntry00664, {
        rowsBefore: rows.map((row, index) => ({ index, node: hfNodeSnap00664_(row) }))
      }), 'info');
      rows.forEach(row => applyRowAlignInParent_(hostEl, row, axis, val));
      hfScheduleAfterAlignAudit00664_('apply-host-children-section-rows', hostEl, hostEl, axis, val, hostChildrenEntry00664);
      return true;
    }

    // MENU + Діти [00674 CLEAN]:
    // direct selected .st-block--menu only. No normalizer, no repair/interceptor route.
    const ownMenuBlock = (hostEl.classList?.contains('st-block--menu') || hostEl.matches?.('[data-st-menu="1"]')) ? hostEl : null;
    if (ownMenuBlock) {
      hfPushAlignDiag00664_('apply-host-children-path-menu-clean-00674', Object.assign({}, hostChildrenEntry00664, {
        menuBefore: hfNodeSnap00664_(ownMenuBlock),
        menuItemsBefore: hfChildrenSnap00664_(getMenuRootList_(ownMenuBlock), 'all')
      }), 'warn');
      return applyHeaderFooterMenuChildrenAlignClean00674_(ownMenuBlock, axis, val);
    }

    // ROW + Діти або BLOCK-контейнер + Діти:
    // керуємо прямими дітьми першого рівня.
    // Для header-контейнерів без inner .st-row це саме сам контейнер як flex-host.
    let rowHost = null;
    if (hostEl.classList?.contains('st-row')) rowHost = hostEl;
    else if (hostEl.classList?.contains('st-block')) {
      rowHost = hostEl.querySelector?.(':scope > .st-row') || null;
      if (!rowHost && hostEl.querySelector?.(':scope > .st-block')) rowHost = hostEl;
    }

    if (!rowHost) {
      hfPushAlignDiag00664_('apply-host-children-no-rowhost', Object.assign({}, hostChildrenEntry00664, {
        directElements: hfChildrenSnap00664_(hostEl, 'all'),
        directBlocks: hfChildrenSnap00664_(hostEl, 'directBlocks'),
        hfDirectChildren: hfChildrenSnap00664_(hostEl, 'hfDirect')
      }), 'warn');
      return false;
    }
    hfPushAlignDiag00664_('apply-host-children-rowhost-resolved', Object.assign({}, hostChildrenEntry00664, {
      rowHost: hfNodeSnap00664_(rowHost),
      rowHostDirectBlocks: hfChildrenSnap00664_(rowHost, 'directBlocks'),
      rowHostHfDirect: hfChildrenSnap00664_(rowHost, 'hfDirect')
    }), 'info');

    // 00225: Header/Footer container + Діти.
    // If the user selected a real container in the header/footer, vertical alignment must work
    // by the height of that container, not by the almost-collapsed menu/list wrapper.
    if (hostEl.classList?.contains('st-block') && isHeaderFooterArea_(hostEl)) {
      hfPushAlignDiag00664_('apply-host-children-path-hf-block-direct-children', Object.assign({}, hostChildrenEntry00664, {
        rowHost: hfNodeSnap00664_(rowHost),
        hfDirectChildrenBefore: hfChildrenSnap00664_(hostEl, 'hfDirect')
      }), 'info');
      return applyHeaderFooterChildrenVisualAlign_(hostEl, axis, val);
    }

    hfPushAlignDiag00664_('apply-host-children-path-flexhost', Object.assign({}, hostChildrenEntry00664, {
      rowHost: hfNodeSnap00664_(rowHost),
      directBlocksBefore: hfChildrenSnap00664_(rowHost, 'directBlocks')
    }), 'info');
    return applyFlexHostAlign_(rowHost, axis, val);
  }


  // [00476][FOOTER BLOCK ALIGN - OWN SLOT]
  // In a vertical footer container, a selected child block must align only inside
  // its own free slot between neighbouring blocks. Generic flex auto-margins align
  // against the full parent and can make one block overlap another.
function applyAlignToSelectedBlock_(axis, val) {
    const menuItem = getMenuItemTargetFromRaw_();
    if (menuItem) {
      const list = menuItem.parentElement;
      if (!list) return false;
      // Окремий пункт меню вирівнюємо відносно root-list/батьківського списку.
      menuItem.style.marginLeft = '';
      menuItem.style.marginRight = '';
      menuItem.style.marginTop = '';
      menuItem.style.marginBottom = '';
      menuItem.style.alignSelf = '';
      menuItem.style.justifySelf = '';
      if (axis === 'x') {
        if (val === 'center') { menuItem.style.marginLeft = 'auto'; menuItem.style.marginRight = 'auto'; }
        else if (val === 'flex-end') { menuItem.style.marginLeft = 'auto'; }
        else { menuItem.style.marginRight = 'auto'; }
      } else {
        menuItem.style.alignSelf = val;
      }
      return true;
    }

    const target = getPrimarySelectedBlock_();
    if (!target) return false;

    // [00665] Header/Footer level (.st-row) in mode "Блок" must be handled.
    // 00650 blocked this path and produced hf-align-00664:click-not-handled.
    if (target.classList?.contains('st-row')) {
      if (isHeaderFooterArea_(target) && applyHeaderFooterLevelBlockAlign00665_(target, axis, val)) return true;
      const parent = target.parentElement?.closest?.('.st-block, .st-section') || target.parentElement;
      if (!parent) return false;
      applyRowAlignInParent_(parent, target, axis, val);
      return true;
    }

    if (target.classList?.contains('st-section')) {
      const parent = target.parentElement;
      if (!parent) return false;
      target.style.marginLeft = '';
      target.style.marginRight = '';
      target.style.alignSelf = '';
      if (axis === 'x') {
        if (val === 'center') { target.style.marginLeft = 'auto'; target.style.marginRight = 'auto'; }
        else if (val === 'flex-end') { target.style.marginLeft = 'auto'; }
        else { target.style.marginRight = 'auto'; }
      } else {
        target.style.alignSelf = val;
      }
      return true;
    }

    const host = (target.parentElement && (target.parentElement.classList?.contains('st-row') || target.parentElement.classList?.contains('st-block') || target.parentElement.classList?.contains('st-menu__list')))
      ? target.parentElement
      : (target.closest?.('.st-row') || target.closest?.('.st-block') || null);
    if (!host) return false;

    // [00658] Old footer own-slot align path is removed from active code.
    // It could leave one child pinned while another child inflated like a bag.
    if (!isRowEl_(host) && host.classList?.contains('st-block')) ensureFlexHost_(host);

    // 00241: Header/Footer + режим «Блок».
    // Контейнер/блок має вирівнюватись відносно батька, але ніколи не вилітати за межі.
    // Для шапки старе align-self часто не давало видимого руху, бо grid/flex-обгортки
    // розтягували елемент на всю комірку. Тому додаємо bounded fallback.
    if (isRemovedContentLayoutArea00799_(target) || isRemovedContentLayoutArea00799_(host)) {
      if (applyRemovedContentSelectedBlockAlign00801_(target, host, axis, val)) return true;
    }

    if (isHeaderFooterArea_(target) || isHeaderFooterArea_(host)) {
      // 00662: no old box-invariant wrapper here. That wrapper restored the
      // selected container width immediately after the clean fill calculation,
      // so align looked like it did nothing or snapped/squeezed back.
      stripHeaderFooterAlignHeightStretch00657_(target, 'block-align-before-00662');
      const ok = applyBoundedBlockAlignInParent_(target, host, axis, val);
      stripHeaderFooterAlignHeightStretch00657_(target, 'block-align-after-00662');
      return ok;
    }

    if (axis === 'x') applyAlignXToBlock_(target, host, val);
    else applyAlignYToBlock_(target, host, val);
    return true;
  }

  function handleScopedAlignClick_(axis, group, ev) {
    const btn = ev.target.closest?.('.design-pill');
    if (!btn || !group?.contains(btn)) return;
    const val = btn.dataset.val;
    if (!val) return;

    const mode = getLayoutTargetMode_();
    const primaryBefore00664 = getPrimarySelectedBlock_();
    // [00674] Direct menu children host. Do not search/normalize through parent containers.
    const directMenuChildrenHost00674 = (mode === 'children' && primaryBefore00664?.classList?.contains('st-block--menu')) ? primaryBefore00664 : null;
    const hostForChildren = mode === 'children' ? (directMenuChildrenHost00674 || getPrimaryChildrenHost_()) : null;
    const clickDiagBefore00664 = {
      axis,
      val,
      mode,
      btnTitle: String(btn.getAttribute('title') || btn.getAttribute('aria-label') || ''),
      primaryBefore: hfNodeSnap00664_(primaryBefore00664),
      hostForChildrenBefore: hfNodeSnap00664_(hostForChildren),
      directMenuChildrenHost00674: hfNodeSnap00664_(directMenuChildrenHost00674),
      rawSelection: hfRawSelectionSnap00664_(),
      preferred: preferredLayoutScope00451_()
    };
    hfPushAlignDiag00664_('click-start', clickDiagBefore00664, 'info');
    const handled = mode === 'children'
      ? applyAlignToHostChildren_(hostForChildren, axis, val)
      : applyAlignToSelectedBlock_(axis, val);

    // 00662: no capture/interceptor logic. The old duplicate align listeners are
    // removed, so this normal button handler does not need to stop propagation.
    ev.preventDefault();

    if (!handled) {
      hfPushAlignDiag00664_('click-not-handled', Object.assign({}, clickDiagBefore00664, {
        primaryAfter: hfNodeSnap00664_(getPrimarySelectedBlock_()),
        hostForChildrenAfter: hfNodeSnap00664_(mode === 'children' ? getPrimaryChildrenHost_() : null)
      }), 'warn');
      dlog_('ALIGN NOT HANDLED', { mode, axis, val, hostForChildren, primary: getPrimarySelectedBlock_() });
      return;
    }

    hfPushAlignDiag00664_('click-handled-before-persist', Object.assign({}, clickDiagBefore00664, {
      primaryAfterNow: hfNodeSnap00664_(getPrimarySelectedBlock_()),
      hostForChildrenAfterNow: hfNodeSnap00664_(mode === 'children' ? getPrimaryChildrenHost_() : null)
    }), 'info');
    hfScheduleAfterAlignAudit00664_('click-final', getPrimarySelectedBlock_(), mode === 'children' ? getPrimaryChildrenHost_() : (getPrimarySelectedBlock_()?.parentElement || null), axis, val, clickDiagBefore00664);

    setActiveAlignBtn_(group, val);
    try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
    try { persistLayoutChange_('layout-align-' + mode); } catch(e) {}
  }


  try {
    window.ST_LAYOUT_SCOPE_AUDIT_00558 = function() {
      const active = getActiveLayoutElement_();
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453 || null;
      const preferred = preferredLayoutScope00451_();
      const out = {
        preferred,
        activeScope: componentScopeOfEl00451_(active),
        activeClass: active ? String(active.className || '') : '',
        forcedScope: componentScopeOfEl00451_(forced),
        forcedClass: forced ? String(forced.className || '') : '',
        bodyFooterBuilder: document.body.classList.contains('st-footer-builder-on'),
        bodyHeaderBuilder: document.body.classList.contains('st-header-builder-on')
      };
      console.log('[ST_LAYOUT_SCOPE_AUDIT_00558]', out);
      return out;
    };
    window.ST_LAYOUT_SCOPE_AUDIT_00559 = function() {
      const active = getActiveLayoutElement_();
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453 || null;
      const host = active?.parentElement || null;
      const out = {
        preferred: preferredLayoutScope00451_(),
        activeScope: componentScopeOfEl00451_(active),
        activeClass: active ? String(active.className || '') : '',
        activeNode: active?.dataset?.stNode || active?.dataset?.blockKind || '',
        activeRect: active?.getBoundingClientRect ? (() => { const r = active.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
        forcedScope: componentScopeOfEl00451_(forced),
        forcedClass: forced ? String(forced.className || '') : '',
        hostClass: host ? String(host.className || '') : '',
        hostRect: host?.getBoundingClientRect ? (() => { const r = host.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
        isFooterTopContainer: isFooterTopContainer00473_(active),
        footerVisualAlignX: active?.dataset?.stFooterDesignAlignX00559 || '',
        footerVisualAlignY: active?.dataset?.stFooterDesignAlignY00559 || ''
      };
      console.log('[ST_LAYOUT_SCOPE_AUDIT_00559]', out);
      return out;
    };
    window.ST_LAYOUT_SCOPE_AUDIT_00560 = function() {
      const active = getActiveLayoutElement_();
      const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453 || null;
      const host = active?.parentElement || null;
      const out = {
        preferred: preferredLayoutScope00451_(),
        activeScope: componentScopeOfEl00451_(active),
        activeClass: active ? String(active.className || '') : '',
        activeNode: active?.dataset?.stNode || active?.dataset?.blockKind || '',
        activeId: active?.dataset?.hbRef || active?.dataset?.nodeId || '',
        activeRect: active?.getBoundingClientRect ? (() => { const r = active.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
        forcedScope: componentScopeOfEl00451_(forced),
        forcedClass: forced ? String(forced.className || '') : '',
        hostScope: componentScopeOfEl00451_(host),
        hostClass: host ? String(host.className || '') : '',
        hostId: host?.dataset?.hbRef || host?.dataset?.nodeId || '',
        hostRect: host?.getBoundingClientRect ? (() => { const r = host.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
        sharedAlign: active?.dataset?.stHfDesignAlignShared00560 || '',
        sharedAlignX: active?.dataset?.stHfDesignAlignX00560 || '',
        sharedAlignY: active?.dataset?.stHfDesignAlignY00560 || ''
      };
      console.log('[ST_LAYOUT_SCOPE_AUDIT_00560]', out);
      return out;
    };
  } catch (_) {}

  try {
    window.ST_LAYOUT_ALIGN_AUDIT = function() {
      const primary = getPrimarySelectedBlock_();
      const childrenHost = getPrimaryChildrenHost_();
      const host = childrenHost || primary;
      const children = host ? getHeaderFooterDirectChildren_(host) : [];
      const report = {
        mode: getLayoutTargetMode_(),
        primary: primary ? { tag: primary.tagName, cls: String(primary.className || ''), name: primary.dataset?.name || '', uid: primary.dataset?.uid || '' } : null,
        childrenHost: childrenHost ? { tag: childrenHost.tagName, cls: String(childrenHost.className || ''), name: childrenHost.dataset?.name || '', uid: childrenHost.dataset?.uid || '', display: getComputedStyle(childrenHost).display, flexDirection: getComputedStyle(childrenHost).flexDirection, alignItems: getComputedStyle(childrenHost).alignItems, justifyContent: getComputedStyle(childrenHost).justifyContent } : null,
        children: children.map((ch, i) => {
          const r = ch.getBoundingClientRect?.();
          const cs = getComputedStyle(ch);
          return { i: i + 1, name: ch.dataset?.name || '', cls: String(ch.className || ''), w: Math.round(r?.width || 0), h: Math.round(r?.height || 0), alignSelf: cs.alignSelf, height: cs.height, styleHeight: ch.style.height || '' };
        })
      };
      console.log('[ST_LAYOUT_ALIGN_AUDIT]', report);
      try { console.table(report.children); } catch (_) {}
      return report;
    };
  } catch (_) {}

  justifyGroup?.addEventListener('click', (e) => handleScopedAlignClick_('x', justifyGroup, e), false);

  // IMPORTANT:
  // Користувач очікує, що кнопки вирівнювання працюють по ВИБРАНОМУ елементу(ах)
  // (тобто "вирівняти блок всередині батьківського контейнера"),
  // а не по самому ROW-хосту. Тому:
  // - якщо вибрані .st-block -> застосовуємо align-self / justify-self / auto-margins до блоків
  // - якщо вибір = секція/немає блоків -> працює тільки scoped-handler вище, без legacy-listeners

  function mapToGridAxis_(valFlex) {
    return (valFlex === 'flex-start') ? 'start' : (valFlex === 'flex-end') ? 'end' : valFlex;
  }

  function clearBlockAlign_(b) {
    if (!b || !b.style) return;
    b.style.alignSelf = '';
    b.style.justifySelf = '';
    b.style.marginLeft = '';
    b.style.marginRight = '';
    b.style.marginTop = '';
    b.style.marginBottom = '';
  }

  // ✅ Важливо: в CONTENT у нас .st-block зазвичай width:100%, тому вирівнювання блоків
  // через justify-self/align-self НЕ дає видимого ефекту. Натомість користувач очікує
  // керування вирівнюванням самого ROW (як було раніше).
  // Для Header/Footer (іконки/текст з width:auto) вирівнювання по блоках має сенс.
  function isHeaderFooterBlock_(b){
    try {
      return !!(b && b.closest && b.closest('#st-site-header-slot, #st-site-footer-slot, .st-site-header-slot, .st-site-footer-slot'));
    } catch(e){
      return false;
    }
  }

  function applyAlignXToBlock_(b, host, valFlex) {
    if (!b || !host) return;
    const modeNow = host.dataset.layoutMode || 'fr';
    const cs = getComputedStyle(host);
    const dir = (host.style.flexDirection || cs.flexDirection || 'row');

    // В FLEX: якщо колонка — X це cross-axis, тож це align-self.
    if (modeNow === 'flex') {
      clearBlockAlign_(b);
      if (dir === 'column') {
        b.style.alignSelf = valFlex;
      } else {
        // primary-axis: робимо через auto-margins (стабільно в цій архітектурі)
        if (valFlex === 'center') {
          b.style.marginLeft = 'auto';
          b.style.marginRight = 'auto';
        } else if (valFlex === 'flex-end') {
          b.style.marginLeft = 'auto';
          b.style.marginRight = '';
        } else {
          // flex-start
          b.style.marginLeft = '';
          b.style.marginRight = 'auto';
        }
      }
      return;
    }

    // GRID/FR: використовуємо justify-self
    clearBlockAlign_(b);
    b.style.justifySelf = mapToGridAxis_(valFlex);
  }

  function applyAlignYToBlock_(b, host, valFlex) {
    if (!b || !host) return;
    const modeNow = host.dataset.layoutMode || 'fr';
    const cs = getComputedStyle(host);
    const dir = (host.style.flexDirection || cs.flexDirection || 'row');

    if (modeNow === 'flex') {
      clearBlockAlign_(b);
      if (dir === 'column') {
        // primary-axis (вертикаль) в колонці — через auto-margins
        if (valFlex === 'center') {
          b.style.marginTop = 'auto';
          b.style.marginBottom = 'auto';
        } else if (valFlex === 'flex-end') {
          b.style.marginTop = 'auto';
          b.style.marginBottom = '';
        } else {
          b.style.marginTop = '';
          b.style.marginBottom = 'auto';
        }
      } else {
        // cross-axis (вертикаль) в рядку
        b.style.alignSelf = valFlex;
      }
      return;
    }

    clearBlockAlign_(b);
    b.style.alignSelf = mapToGridAxis_(valFlex);
  }

  // [00662] Старі дублікати вирівнювання по X видалені.
  // Єдине джерело правди: звичайний click-handler без capture/intercept.
  // 2) Вертикаль (top/center/bottom) -> align-items (FLEX/FR) або align-items (GRID)
  const alignYGroup = sectionEl.querySelector('[data-layout-align-y]');
  alignYGroup?.addEventListener('click', (e) => handleScopedAlignClick_('y', alignYGroup, e), false);
  // [00662] Старі дублікати вирівнювання по Y видалені.
  // Єдине джерело правди: звичайний click-handler без capture/intercept.


  // LAYOUT MODE + GAP X/Y + GRID COLS
  const modeGroup = sectionEl.querySelector('[data-layout-mode-group]');
  const freeBtn = sectionEl.querySelector('[data-layout-free]');
  const gridColsWrap = sectionEl.querySelector('[data-grid-cols-wrap]');
  const gridColsInput = sectionEl.querySelector('[data-grid-cols]');

  const gapXSlider = sectionEl.querySelector('[data-gap-x]');
  const gapXInput  = sectionEl.querySelector('[data-gap-x-input]');
  const gapYSlider = sectionEl.querySelector('[data-gap-y]');
  const gapYInput  = sectionEl.querySelector('[data-gap-y-input]');

  function setDisabled_(el, disabled) {
    if (!el) return;
    // disable buttons
    el.querySelectorAll('button').forEach(b => {
      b.disabled = !!disabled;
      b.classList.toggle('is-disabled', !!disabled);
    });
    // disable inputs (radio/number/range)
    el.querySelectorAll('input, select').forEach(inp => {
      inp.disabled = !!disabled;
    });
  }

  function getModeFromUI_() {
    const r = modeGroup?.querySelector('input[type="radio"][name="stLayoutMode"]:checked');
    return (r && r.value) ? r.value : 'fr';
  }

  function setModeUI_(mode) {
    if (!modeGroup) return;
    const m = mode || 'fr';
    modeGroup.querySelectorAll('input[type="radio"][name="stLayoutMode"]').forEach(inp => {
      inp.checked = (inp.value === m);
    });
    // Показати/сховати опції GRID
    if (gridColsWrap) gridColsWrap.style.display = (m === 'grid') ? '' : 'none';
  }

  function applyLayoutMode_(mode) {
    const val = mode || 'fr';
    const { rows } = getTargetRowsAndBlocks();
    rows.forEach(row => {
      // ✅ Header/Footer контейнер без st-row — це .st-block. Для нього режим застосовуємо напряму.
      if (!isRowEl_(row)) {
        row.dataset.layoutMode = val;

        if (val === 'flex') {
          row.style.display = 'flex';
          const o = row.dataset.layoutOrient || 'row';
          row.style.flexDirection = (o === 'column') ? 'column' : 'row';
          row.style.gridTemplateColumns = '';
          row.style.gridAutoFlow = '';
          row.style.gridTemplateRows = '';
          row.style.setProperty('--st-flex-wrap', 'nowrap');
          return;
        }

        if (val === 'grid') {
          const cols = Math.max(1, Math.min(12, Number(gridColsInput?.value || 3) || 3));
          row.style.display = 'grid';
          row.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
          row.style.gridAutoFlow = '';
          row.style.gridTemplateRows = '';
          row.style.flexDirection = '';
          return;
        }

        // FR: для контейнера без st-row робимо простий grid з рівними колонками (для іконок цього достатньо)
        const n = Math.max(1, row.querySelectorAll(':scope > .st-block').length || 1);
        row.style.display = 'grid';
        row.style.gridAutoFlow = 'column';
        row.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
        row.style.gridTemplateRows = '';
        row.style.flexDirection = '';
        return;
      }

      // mode зберігаємо в dataset (CSS + canvas)
      row.dataset.layoutMode = val;

      // ✅ при перемиканні режимів чистимо inline-стилі, які можуть перекривати CSS режиму
      if (val === 'grid' || val === 'flex') {
        // у GRID/FLEX не повинно залишатись inline grid-template-columns від FR/орієнтації
        row.style.gridTemplateColumns = '';
        row.style.gridAutoFlow = '';
        row.style.gridTemplateRows = '';
      }
      if (val !== 'flex') {
        // flex-direction актуальний тільки для FLEX
        row.style.flexDirection = '';
      }

      // FLEX: за замовчуванням не переносимо (можна додати чекбокс later)
      if (val === 'flex') {
        row.style.setProperty('--st-flex-wrap', 'nowrap');
      }

      // GRID: grid cols з CSS-var
      if (val === 'grid') {
        const cols = Math.max(1, Math.min(12, Number(gridColsInput?.value || 3) || 3));
        row.style.setProperty('--st-grid-cols', String(cols));
      }
    });
  }

  function setGapUIOnly_(xVal, yVal) {
    const gx = Math.max(0, Math.min(64, Number(xVal) || 0));
    const gy = Math.max(0, Math.min(64, Number(yVal) || 0));
    if (gapXSlider) gapXSlider.value = String(gx);
    if (gapXInput) gapXInput.value = String(gx);
    if (gapYSlider) gapYSlider.value = String(gy);
    if (gapYInput) gapYInput.value = String(gy);
  }

  function parseMenuLevelContentLayoutMap_(menuBlock) {
    try {
      const raw = String(menuBlock?.dataset?.menuLevelContentLayoutStyles || '').trim();
      const parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function clampMenuLevelGap_(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(64, Math.round(n)));
  }

  function getMenuLevel1Gap_(menuBlock) {
    const map = parseMenuLevelContentLayoutMap_(menuBlock);
    const l1 = (map['1'] && typeof map['1'] === 'object') ? map['1'] : {};
    const fromLevel = Number(l1.gap);
    if (Number.isFinite(fromLevel)) return clampMenuLevelGap_(fromLevel);
    const fromRoot = Number(menuBlock?.dataset?.menuRootGap);
    return Number.isFinite(fromRoot) ? clampMenuLevelGap_(fromRoot) : 14;
  }

  function writeMenuLevel1Gap_(menuBlock, gapPx) {
    if (!menuBlock || !menuBlock.dataset) return;
    const gap = clampMenuLevelGap_(gapPx);
    const map = parseMenuLevelContentLayoutMap_(menuBlock);
    const l1 = (map['1'] && typeof map['1'] === 'object') ? { ...map['1'] } : {};
    l1.gap = String(gap);
    map['1'] = l1;

    // ✅ ЄДИНЕ канонічне місце для gap пунктів меню — levelContentLayoutStyles[1].gap.
    // menuRootGap лишаємо тільки як дзеркало для старих частин runtime/попередніх версій,
    // але при рендері пріоритет має саме Рівень 1.
    menuBlock.dataset.menuLevelContentLayoutStyles = JSON.stringify(map);
    menuBlock.dataset.menuRootGap = String(gap);
    menuBlock.style.setProperty('--st-menu-root-gap', `${gap}px`);
    menuBlock.style.setProperty('--st-menu-gap', `${gap}px`);

    const lists = menuBlock.querySelectorAll('.st-menu--big > .st-menu__list, .st-menu--burger > .st-menu__panel > .st-menu__list, .st-menu > .st-menu__list, .st-menu__list[data-menu-list-depth="1"]');
    lists.forEach((listEl) => {
      if (!(listEl instanceof HTMLElement)) return;
      listEl.dataset.stLayoutProxy = 'menu-root-list';
      listEl.dataset.menuListDepth = '1';
      listEl.style.setProperty('gap', `${gap}px`);
    });
  }

  function isMenuRootListProxy_(row) {
    return !!(row && (row?.dataset?.stLayoutProxy === 'menu-root-list' || row?.classList?.contains('st-menu__list')) && row.closest?.('.st-block--menu'));
  }

  function getLayoutPersistScope00450_() {
    try {
      const active = getActiveLayoutElement_();
      if (active?.closest?.('#st-site-footer-slot')) return 'footer';
      if (active?.closest?.('#st-site-header-slot')) return 'header';
      if (active?.closest?.('#st-site-main-slot, .st-site-main-slot')) return 'main';
    } catch (_) {}
    try {
      const { rows, blocks } = getTargetRowsAndBlocks();
      const all = [...(rows || []), ...(blocks || [])];
      if (all.some(el => el?.closest?.('#st-site-footer-slot'))) return 'footer';
      if (all.some(el => el?.closest?.('#st-site-header-slot'))) return 'header';
      if (all.some(el => el?.closest?.('#st-site-main-slot, .st-site-main-slot'))) return 'main';
    } catch (_) {}
    return 'canvas';
  }

  function mainSpacingTargets00919_() {
    const out = [];
    const add = (el) => {
      if (!(el instanceof HTMLElement) || !el.isConnected) return;
      if (!el.closest?.('#st-site-main-slot, .st-site-main-slot')) return;
      if (!out.includes(el)) out.push(el);
    };
    try {
      const active = getActiveElementsForBox_({ allowCache: true });
      active?.forEach?.(add);
    } catch (_) {}
    try {
      const childTargets = getLayoutTargetMode_() === 'children' ? getLayoutFirstLevelChildren_() : [];
      childTargets?.forEach?.(add);
    } catch (_) {}
    try {
      const { rows, blocks } = getTargetRowsAndBlocks();
      rows?.forEach?.(add);
      blocks?.forEach?.(add);
    } catch (_) {}
    return out;
  }


  function persistLayoutChange_(reason = 'layout-widget-change') {
    // 00292 + 00450 + 00454: layout changes may target Header/Footer, not only Content.
    // 00454: Gap sliders are high-frequency. The old code persisted twice per
    // input event (immediate + RAF), which made Footer block spacing move in
    // visible jumps while the DOM/state bridge was resyncing every tick.
    const doSave = (persistReason = reason) => {
      const scope00450 = getLayoutPersistScope00450_();
      if (scope00450 === 'main') {
        const targets = mainSpacingTargets00919_();
        if (!targets.length) return;
        try {
          window.dispatchEvent(new CustomEvent('st:layout-spacing-widget:applied', {
            detail: { reason: persistReason, targets, scope: 'main', stage: '00919' }
          }));
        } catch (_) {}
      } else {
        try { saveStateNow(); } catch (_) {}
      }
      if (scope00450 === 'footer') {
        const skipFooterDomSync00475 = /^layout-align-(children|block)(#.*)?$/.test(String(persistReason || ''));
        if (!skipFooterDomSync00475) {
          try { window.__ST_FOOTER_BUILDER_SYNC_FROM_DOM_00453?.('layout-widget:' + persistReason); } catch (_) {}
        } else {
          try { window.__ST_PERF_DIAG__?.push?.('footer-skip-builder-sync-for-align-00475', { reason: persistReason }, 'info'); } catch (_) {}
        }
        try { window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('footer', persistReason); } catch (_) {}
      } else if (scope00450 === 'header') {
        // [00621][HEADER ALIGN = SAME DIRECT MODEL AS FOOTER]
        // Footer became stable only after layout-align stopped running the old
        // builder sync/DOM-normalize pass. 00620 shared the size guards with
        // Header, but Header still executed __ST_HEADER_BUILDER_SYNC_FROM_DOM_00453
        // and tight-to-main immediately after align. That old pass re-read the DOM,
        // rewrote active/size styles and could leave selected containers collapsed or
        // impossible to resize. For align operations Header now follows the Footer
        // contract: persist the already-correct live DOM, but do NOT re-normalize it.
        const skipHeaderDomSync00621 = /^layout-align-(children|block)(#.*)?$/.test(String(persistReason || ''));
        if (!skipHeaderDomSync00621) {
          try { window.__ST_HEADER_TIGHT_TO_CONTENT_00496?.('layout-widget:before-persist:' + persistReason); } catch (_) {}
        }
        if (!skipHeaderDomSync00621) {
          try { window.__ST_HEADER_BUILDER_SYNC_FROM_DOM_00453?.('layout-widget:' + persistReason); } catch (_) {}
          try { window.__ST_HEADER_TIGHT_TO_CONTENT_00496?.('layout-widget:after-persist:' + persistReason); } catch (_) {}
        } else {
          try { window.__ST_PERF_DIAG__?.push?.('header-skip-builder-sync-for-align-00621', { reason: persistReason }, 'info'); } catch (_) {}
        }
        try { window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.('header', persistReason); } catch (_) {}
      } else if (scope00450 !== 'main') {
        return;
      }
      try {
        const active00451 = getActiveLayoutElement_();
        window.__ST_PERF_DIAG__?.push?.('layout-widget-persist-scope-00454', {
          scope: scope00450,
          reason: persistReason,
          preferred: preferredLayoutScope00451_(),
          activeScope: componentScopeOfEl00451_(active00451),
          activeClass: active00451?.className || '',
          activeTag: active00451?.tagName || ''
        }, 'info');
      } catch (_) {}
      try { window.dispatchEvent?.(new CustomEvent('st:layout-widget-persisted', { detail: { reason: persistReason, scope: scope00450 } })); } catch (_) {}
    };

    // Range INPUT uses commit:false. Native change/pointerup calls this once,
    // so persistence is synchronous and explicit with no timer/debounce bridge.
    doSave(reason === 'layout-gap-change' ? 'layout-gap-change#final' : reason);
  }

  function applyAxisGapToHost00454_(host, gx, gy, axis) {
    if (!host || !host.style) return;
    const x = Math.max(0, Math.min(64, Number(gx) || 0));
    const y = Math.max(0, Math.min(64, Number(gy) || 0));

    // Axis-specific canonical contract. Keep vars for CSS and inline longhands
    // for builder CSS that may force display/flex at a higher selector level.
    host.style.setProperty('--site-gap-x', x + 'px');
    host.style.setProperty('--site-gap-y', y + 'px');
    host.style.setProperty('--site-gap', (x === y ? x : Math.max(x, y)) + 'px');

    // A fixed inline gap:10px may already exist on footer containers/rows.
    // Write shorthand and then longhands in the correct order so Gap X/Y do not
    // get overridden, and so computed styles match the UI while dragging.
    host.style.gap = y + 'px ' + x + 'px';
    host.style.columnGap = x + 'px';
    host.style.rowGap = y + 'px';

    // [00455][GAP-ZERO-MEANS-ZERO]
    // Some footer/header templates had their own margin-left/right on direct
    // children or justify-content:space-between/around/evenly on the row. In that
    // state a slider value of 0 still looked like ~20px, and mid values looked
    // unchanged until the end of the slider. When the user edits "distance between
    // blocks", the selected host must use CSS gap as the only source of distance.
    if (isHeaderFooterArea_(host)) {
      try { host.dataset.stGapManaged = '1'; } catch (_) {}
      try {
        const jc = String(host.style.justifyContent || getComputedStyle(host).justifyContent || '').toLowerCase();
        if (/space-between|space-around|space-evenly/.test(jc)) host.style.justifyContent = 'flex-start';
      } catch (_) {}
      try {
        const direct = host.querySelectorAll?.(':scope > .st-block, :scope > .hb-container');
        direct?.forEach?.((child) => {
          if (!(child instanceof HTMLElement) || !child.style) return;
          // Reset only the axis that is being edited, so the Margin controls
          // can still be used intentionally after the gap is set.
          if (axis !== 'y') {
            child.style.marginLeft = '0px';
            child.style.marginRight = '0px';
          }
          if (axis === 'y') {
            child.style.marginTop = '0px';
            child.style.marginBottom = '0px';
          }
        });
      } catch (_) {}
    }
  }

  function applyGapXY_(xVal, yVal, opts = {}) {
    const gx = Math.max(0, Math.min(64, Number(xVal) || 0));
    const gy = Math.max(0, Math.min(64, Number(yVal) || 0));

    setGapUIOnly_(gx, gy);

    const { rows } = getTargetRowsAndBlocks();
    rows.forEach(row => {
      if (!row) return;

      if (isMenuRootListProxy_(row)) {
        const menuBlock = row.closest?.('.st-block--menu');
        const canonicalGap = (opts.axis === 'y') ? gy : gx;
        applyAxisGapToHost00454_(row, canonicalGap, canonicalGap, opts.axis);
        writeMenuLevel1Gap_(menuBlock, canonicalGap);
        // Для меню root-gap один, тому UI синхронізуємо в обидва поля,
        // щоб після mouseup/selection-sync не було різних джерел правди.
        setGapUIOnly_(canonicalGap, canonicalGap);
        return;
      }

      // 00454: one code path for real ROW, Footer/Header container-host and
      // any flex/grid block-host. This fixes Footer level Gap X and removes
      // big visual jumps caused by stale inline gap values.
      applyAxisGapToHost00454_(row, gx, gy, opts.axis);
    });
    if (opts.commit !== false) persistLayoutChange_('layout-gap-change');
  }

  function setGroupDisabled_(rootEl, disabled) {
    if (!rootEl) return;
    const ds = !!disabled;
    rootEl.querySelectorAll('button, input').forEach(el => {
      if (ds) el.setAttribute('disabled', 'disabled');
      else el.removeAttribute('disabled');
    });
    rootEl.classList.toggle('is-disabled', ds);
  }

  function setFreeUIState_(isFree) {
    if (freeBtn) freeBtn.classList.toggle('is-active', !!isFree);
    // у FREE вирівнювання та режим розміщення вимикаємо
    setGroupDisabled_(justifyGroup, isFree);
    setGroupDisabled_(alignYGroup, isFree);
    setGroupDisabled_(modeGroup, isFree);
    // gap залишаємо активним (бо це просто відстані)
  }

  // Handlers
  freeBtn?.addEventListener('click', () => {
    const { rows } = getTargetRowsAndBlocks();
    const row = rows[0];
    if (!row || !isRowEl_(row)) return;

    const isNowFree = (row.dataset.layoutMode === 'free');
    const nextFree = !isNowFree;

    rows.forEach(r => {
      if (!r || !isRowEl_(r)) return;

      const rid = r.dataset.uid;
      // тригеримо застосування на canvas (там реальна логіка)
      try {
        document.dispatchEvent(new CustomEvent('st:free-layout-toggle', {
          detail: { rowId: rid, enabled: nextFree }
        }));
      } catch (_) {}
    });

    setFreeUIState_(nextFree);

    // ✅ При виході з FREE повертаємо UI режиму розміщення у попередній стан.
    // Canvas синхронно оновлює row.dataset.layoutMode у listener'і.
    if (!nextFree) {
      try { setModeUI_(row.dataset.layoutMode || 'fr'); } catch (_) {}
    }
    persistLayoutChange_('layout-free-mode-toggle');
  });

  modeGroup?.addEventListener('change', () => {
    const mode = getModeFromUI_();
    setModeUI_(mode);
    applyLayoutMode_(mode);

    // ⤴️ оновити підказки (якщо ввімкнено)
    try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
    persistLayoutChange_('layout-mode-change');
  });

  gridColsInput?.addEventListener('input', () => {
    const mode = getModeFromUI_();
    // якщо користувач крутить колонки — вважаємо що він у GRID
    setModeUI_('grid');
    applyLayoutMode_('grid');

    try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
    persistLayoutChange_('layout-grid-cols-change');
  });

  function onGapX_(commit = false) { applyGapXY_(gapXSlider.value, gapYSlider.value, { axis: 'x', commit }); try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {} }
  function onGapY_(commit = false) { applyGapXY_(gapXSlider.value, gapYSlider.value, { axis: 'y', commit }); try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {} }
  function onGapXCommit_() { onGapX_(true); }
  function onGapYCommit_() { onGapY_(true); }

  // [00455] Live preview without live bridge sync. Persist only on release/change.
  gapXSlider.addEventListener('input', () => onGapX_(false));
  gapXSlider.addEventListener('change', onGapXCommit_);
  gapXSlider.addEventListener('pointerup', onGapXCommit_);
  gapXInput.addEventListener('change', () => { gapXSlider.value = gapXInput.value; onGapX_(true); });

  gapYSlider.addEventListener('input', () => onGapY_(false));
  gapYSlider.addEventListener('change', onGapYCommit_);
  gapYSlider.addEventListener('pointerup', onGapYCommit_);
  gapYInput.addEventListener('change', () => { gapYSlider.value = gapYInput.value; onGapY_(true); });

  const targetScopeGroup = sectionEl.querySelector('[data-layout-target-scope]');
  targetScopeGroup?.addEventListener('change', () => {
    try { sectionEl.dataset.stLayoutTargetScope00802 = getLayoutTargetMode_(); } catch (_) {}
    try {
      window.__ST_PERF_DIAG__?.push?.('layout-target-scope-00802', { mode: getLayoutTargetMode_() }, 'info');
    } catch (_) {}
    syncLayoutControlsFromSelection_();
    syncBoxControlsFromSelection_();
    syncFrWeightFromSelection_();
  });

  // initial UI state
  setModeUI_('fr');
  setGapUIOnly_(16, 16);

  // MARGIN / PADDING// MARGIN / PADDING
  const marginGrid  = sectionEl.querySelector('[data-layout-margin]');
  const paddingGrid = sectionEl.querySelector('[data-layout-padding]');

  // -----------------------------
  // 🔹 Sync UI with active selection
  // -----------------------------
  // Потрібно, щоб при кліку на будь-який елемент одразу підтягувались його
  // поточні margin/padding значення в цей віджет.
  let __uiSyncLock = false;

  function clampPx_(n, opts = {}) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    const min = Number.isFinite(Number(opts.min)) ? Number(opts.min) : -200;
    const max = Number.isFinite(Number(opts.max)) ? Number(opts.max) : 1000;
    return Math.max(min, Math.min(max, Math.round(v)));
  }

  function isMarginProp_(cssProp) {
    return String(cssProp || '').toLowerCase().startsWith('margin');
  }

  // 00294:
  // Віджет має показувати ПОТОЧНИЙ фактичний відступ активного елемента, а не тільки inline.
  // Тому якщо inline-значення немає, читаємо computed style. Для margin дозволяємо -200px,
  // для padding мінус не записуємо, бо CSS його не підтримує.
  function readInlinePxOrNull_(el, cssProp) {
    if (!el) return null;
    const isMargin = isMarginProp_(cssProp);
    const min = isMargin ? -200 : 0;
    const max = 1000;

    const inline = el.style?.[cssProp];
    if (inline && typeof inline === 'string' && inline.trim() !== '') {
      const x = parseFloat(inline);
      if (Number.isFinite(x)) return clampPx_(x, { min, max });
      // margin:auto не є числовим px-відступом, тому показуємо "Незадано".
      if (/auto/i.test(inline)) return null;
    }

    try {
      const cs = getComputedStyle(el);
      const raw = cs?.[cssProp];
      const x = parseFloat(raw);
      if (Number.isFinite(x)) return clampPx_(x, { min, max });
      if (/auto/i.test(String(raw || ''))) return null;
    } catch (_) {}

    return 0;
  }

  // 00298: Stable target cache for spacing controls.
  // When the user clicks a number spinner in the Design panel, some global selection
  // listeners can emit a selection sync/pointerup before the DOM style is committed.
  // Previously that made the input jump back to 0 and the spacing action was lost.
  // Keep the last real canvas target and use it while the spacing inputs are focused.
  let __lastBoxTargets = [];

  function isBoxEditorFocused_() {
    const a = document.activeElement;
    return !!(a && a.closest && (
      a.closest('[data-layout-margin]') ||
      a.closest('[data-layout-padding]')
    ));
  }

  function normalizeBoxTarget_(el) {
    if (!(el instanceof HTMLElement)) return null;
    if (el.closest?.('.design-panel, #design-panel, #design-panel-root')) return null;
    const norm = normalizeLayoutSelectable_(el);
    return (norm instanceof HTMLElement) ? norm : el;
  }

  function rememberBoxTargets_(els) {
    const clean = Array.from(new Set((els || []).map(normalizeBoxTarget_).filter(Boolean)));
    if (clean.length) __lastBoxTargets = clean;
    return clean;
  }

  function getCachedBoxTargets_() {
    __lastBoxTargets = (__lastBoxTargets || []).filter(el => el && el.isConnected);
    const preferred = preferredLayoutScope00451_();
    if (preferred) {
      const scoped = filterElementsByScope00451_(__lastBoxTargets, preferred);
      if (scoped.length) return scoped.slice();
    }
    return __lastBoxTargets.slice();
  }

  function getActiveElementsForBox_(opts = {}) {
    const allowCache = opts.allowCache !== false;
    const componentActive00450 = getComponentActiveElement00450_();
    if (componentActive00450 && componentScopeOfEl00451_(componentActive00450)) {
      return rememberBoxTargets_([componentActive00450]);
    }
    const sel = getSelection?.();
    let raw = [];
    if (sel) {
      if (Array.isArray(sel.elements) && sel.elements.length) raw = sel.elements;
      else if (sel.el) raw = [sel.el];
      else if (sel instanceof HTMLElement) raw = [sel];
    }

    const preferred = preferredLayoutScope00451_();
    if (preferred) {
      const scopedRaw = filterElementsByScope00451_(raw, preferred);
      const scopedRemembered = rememberBoxTargets_(scopedRaw);
      if (scopedRemembered.length) return scopedRemembered;
    }

    const remembered = rememberBoxTargets_(raw);
    if (remembered.length) return remembered;

    // While editing the spacing widget, do not let a temporary empty selection erase
    // the target or reset controls back to computed 0.
    if (allowCache) return getCachedBoxTargets_();
    return [];
  }

  function setGridValues_(gridEl, map) {
    if (!gridEl) return;
    __uiSyncLock = true;
    try {
      gridEl.querySelectorAll('input[data-side]').forEach((inp) => {
        const side = inp.getAttribute('data-side');
        if (!side) return;
        if (Object.prototype.hasOwnProperty.call(map, side)) {
          const v = map[side];
          if (v === null || v === undefined) {
            inp.value = '';
            inp.placeholder = 'Незадано';
          } else {
            inp.value = String(v);
            inp.placeholder = '';
          }
        }
      });
    } finally {
      __uiSyncLock = false;
    }
  }

  function syncBoxControlsFromSelection_() {
    // Do not overwrite the value the user is actively editing.
    // Blur/next selection will sync the fields again.
    if (isBoxEditorFocused_()) return;
    const els = getActiveElementsForBox_({ allowCache: true });
    const el = els[0];
    if (!el) {
      // Якщо нічого не вибрано — показуємо "Незадано".
      setGridValues_(marginGrid,  { t:null, r:null, b:null, l:null });
      setGridValues_(paddingGrid, { t:null, r:null, b:null, l:null });
      return;
    }

    // margin
    setGridValues_(marginGrid, {
      t: readInlinePxOrNull_(el, 'marginTop'),
      r: readInlinePxOrNull_(el, 'marginRight'),
      b: readInlinePxOrNull_(el, 'marginBottom'),
      l: readInlinePxOrNull_(el, 'marginLeft'),
    });
    // padding
    setGridValues_(paddingGrid, {
      t: readInlinePxOrNull_(el, 'paddingTop'),
      r: readInlinePxOrNull_(el, 'paddingRight'),
      b: readInlinePxOrNull_(el, 'paddingBottom'),
      l: readInlinePxOrNull_(el, 'paddingLeft'),
    });
  }

  // 00296: right/bottom margins must resize the selected box itself.
  // CSS margins normally reserve space around the item, but in this builder many
  // blocks have explicit width/flex-basis (or are flex/grid children). In that case
  // margin-right may not visually shrink the block. We keep a stable base size from
  // the moment the user starts editing margins, then:
  //   margin-right > 0  => width = base - margin-right
  //   margin-right < 0  => width = base + abs(margin-right)
  // The same idea is kept for margin-bottom and height. Left/top keep their normal
  // offset behavior, because those already worked as expected.
  function pxNumFromStyle_(el, prop) {
    if (!el) return 0;
    const rawInline = (el.style?.[prop] || '').trim();
    if (rawInline && !/auto/i.test(rawInline)) {
      const n = parseFloat(rawInline);
      if (Number.isFinite(n)) return n;
    }
    try {
      const raw = getComputedStyle(el)?.[prop];
      if (raw && !/auto/i.test(String(raw))) {
        const n = parseFloat(raw);
        if (Number.isFinite(n)) return n;
      }
    } catch (_) {}
    return 0;
  }

  function storeOnce_(el, key, value) {
    if (!el?.dataset) return;
    if (!Object.prototype.hasOwnProperty.call(el.dataset, key)) {
      el.dataset[key] = value ?? '';
    }
  }

  function restoreStored_(el, key, styleProp) {
    if (!el?.dataset) return;
    if (!Object.prototype.hasOwnProperty.call(el.dataset, key)) return;
    el.style[styleProp] = el.dataset[key] || '';
    delete el.dataset[key];
  }

  // 00299: Mark margins edited through the Layout widget so header/footer/fit
  // normalizers do not wipe the right side back to 0 on the next enforce pass.
  // Only non-zero sides need protection; setting a side back to 0 removes it.
  function markLayoutWidgetMargin_(el, box) {
    if (!(el instanceof HTMLElement) || !el.dataset || !box) return;
    const map = { t: 'Top', r: 'Right', b: 'Bottom', l: 'Left' };
    let any = false;
    Object.keys(map).forEach((k) => {
      const dsKey = 'stLayoutWidgetMargin' + map[k];
      const v = box[k];
      const n = (v === null || v === undefined || v === '') ? 0 : Number(v);
      if (Number.isFinite(n) && Math.abs(n) > 0.0001) {
        el.dataset[dsKey] = String(Math.round(n));
        any = true;
      } else {
        delete el.dataset[dsKey];
      }
    });
    if (any) el.dataset.stLayoutWidgetMargin = '1';
    else delete el.dataset.stLayoutWidgetMargin;
  }

  function isAutoLikeSize_(raw) {
    const v = String(raw || '').trim().toLowerCase();
    return !v || v === 'auto' || v === '100%' || v === 'stretch' || v === 'unset' || v === 'initial';
  }

  function parseInlinePx_(el, prop) {
    if (!el?.style) return null;
    const raw = String(el.style[prop] || '').trim();
    if (!raw || /auto|calc|%|var\(/i.test(raw)) return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }

  function rectSizePx_(el, axis) {
    try {
      const r = el.getBoundingClientRect?.();
      const v = axis === 'w' ? r?.width : r?.height;
      if (Number.isFinite(v) && v > 0) return v;
    } catch (_) {}
    try {
      const cs = getComputedStyle(el);
      const raw = axis === 'w' ? cs.width : cs.height;
      const n = parseFloat(raw);
      if (Number.isFinite(n) && n > 0) return n;
    } catch (_) {}
    return 0;
  }

  function ensureMarginBase_(el, axis) {
    if (!el?.dataset) return 0;
    const key = axis === 'w' ? 'stLayoutMarginBaseWidthPx' : 'stLayoutMarginBaseHeightPx';
    const existing = parseFloat(el.dataset[key] || '');
    if (Number.isFinite(existing) && existing > 0) return existing;

    const prop = axis === 'w' ? 'width' : 'height';
    const inlinePx = parseInlinePx_(el, prop);
    const measured = inlinePx || rectSizePx_(el, axis);
    const base = Math.max(1, Math.round(measured || 1));
    el.dataset[key] = String(base);
    return base;
  }

  function clearMarginBase_(el, axis) {
    if (!el?.dataset) return;
    const key = axis === 'w' ? 'stLayoutMarginBaseWidthPx' : 'stLayoutMarginBaseHeightPx';
    delete el.dataset[key];
  }

  function setBoxWidthForRightMargin_(el, px) {
    const v = Math.max(1, Math.round(px));
    const val = v + 'px';
    storeOnce_(el, 'stLayoutBeforeMarginFitWidth', el.style.width || '');
    storeOnce_(el, 'stLayoutBeforeMarginFitFlex', el.style.flex || '');
    storeOnce_(el, 'stLayoutBeforeMarginFitFlexBasis', el.style.flexBasis || '');
    storeOnce_(el, 'stLayoutBeforeMarginFitMaxWidth', el.style.maxWidth || '');
    storeOnce_(el, 'stLayoutBeforeMarginFitMinWidth', el.style.minWidth || '');

    // 00300: .st-row / level is usually forced to width:100% by header/section
    // normalizers. A px width can be overwritten or can be interpreted as a fixed
    // row that no longer follows its parent. For levels, margin-right must work as
    // a boundary inside the parent: +R shrinks from the right, -R expands to the
    // right. Keep this as calc(100% +/- Npx) and mark it for the normalizers.
    if (el.classList?.contains('st-row')) {
      const mr = pxNumFromStyle_(el, 'marginRight');
      const abs = Math.round(Math.abs(mr));
      const expr = abs ? (mr > 0 ? `calc(100% - ${abs}px)` : `calc(100% + ${abs}px)`) : '100%';

      // 00301: header rows have stylesheet rules like width:100% !important.
      // A normal inline width is ignored there, so the row margin-right value
      // changes in the widget but the visual row does not shrink. Use an
      // explicit inline-important width plus a CSS variable fallback so the
      // row itself shrinks and its grid tracks/containers shrink with it.
      try { el.style.setProperty('--st-layout-widget-row-width', expr); } catch (_) {}
      try { el.style.setProperty('width', expr, 'important'); } catch (_) { el.style.width = expr; }
      try { el.style.setProperty('min-width', '0px', 'important'); } catch (_) { el.style.minWidth = '0px'; }
      try { el.style.setProperty('max-width', 'none', 'important'); } catch (_) { el.style.maxWidth = 'none'; }
      el.style.boxSizing = 'border-box';
      if (el.dataset) el.dataset.stLayoutWidgetMarginRightWidth = '1';
      return;
    }

    // 00299: right margin is a real boundary control in this builder.
    // Positive value must visually reduce the box from the right, negative value
    // must allow expansion. Do not let flex/grid min/max constraints neutralize it.
    el.style.width = val;
    el.style.minWidth = '0px';
    el.style.maxWidth = 'none';
    el.style.boxSizing = 'border-box';

    // Flex items in the builder often obey flex-basis more than width.
    // Use 0 0 basis so a parent flex/grow rule cannot expand the item back and
    // make margin-right look like it does nothing.
    try {
      const cs = getComputedStyle(el);
      if (cs.display !== 'grid') {
        el.style.flexBasis = val;
        el.style.flex = `0 0 ${val}`;
      }
    } catch (_) {
      el.style.flexBasis = val;
      el.style.flex = `0 0 ${val}`;
    }
  }

  function setBoxHeightForBottomMargin_(el, px) {
    const v = Math.max(1, Math.round(px));
    const val = v + 'px';
    storeOnce_(el, 'stLayoutBeforeMarginFitHeight', el.style.height || '');
    storeOnce_(el, 'stLayoutBeforeMarginFitMaxHeight', el.style.maxHeight || '');
    el.style.height = val;
    el.style.maxHeight = 'none';
  }

  function restoreMarginFitWidth_(el) {
    try { el?.style?.removeProperty('--st-layout-widget-row-width'); } catch (_) {}
    restoreStored_(el, 'stLayoutBeforeMarginFitFlex', 'flex');
    restoreStored_(el, 'stLayoutBeforeMarginFitFlexBasis', 'flexBasis');
    restoreStored_(el, 'stLayoutBeforeMarginFitMaxWidth', 'maxWidth');
    restoreStored_(el, 'stLayoutBeforeMarginFitMinWidth', 'minWidth');
    restoreStored_(el, 'stLayoutBeforeMarginFitWidth', 'width');
    if (el?.dataset) delete el.dataset.stLayoutWidgetMarginRightWidth;
    clearMarginBase_(el, 'w');
  }

  function restoreMarginFitHeight_(el) {
    restoreStored_(el, 'stLayoutBeforeMarginFitMaxHeight', 'maxHeight');
    restoreStored_(el, 'stLayoutBeforeMarginFitHeight', 'height');
    clearMarginBase_(el, 'h');
  }

  function applySpacingBoundaryFit_(el) {
    if (!(el instanceof HTMLElement)) return;

    const ml = pxNumFromStyle_(el, 'marginLeft');
    const mr = pxNumFromStyle_(el, 'marginRight');
    const mt = pxNumFromStyle_(el, 'marginTop');
    const mb = pxNumFromStyle_(el, 'marginBottom');

    // Padding must shrink content inside the same visual box.
    // Keep it explicit because some template blocks can override global box sizing.
    el.style.boxSizing = 'border-box';

    // Right margin is the side that was previously invisible for explicit/flex-basis blocks.
    // Positive right margin shrinks the actual box; negative right margin expands it.
    if (Math.abs(mr) > 0.0001) {
      const baseW = ensureMarginBase_(el, 'w');
      const nextW = baseW - mr;
      setBoxWidthForRightMargin_(el, nextW);
    } else {
      // If only left margin is used, keep old behavior: it offsets the element, not its width.
      restoreMarginFitWidth_(el);

      // For purely stretched sections with both horizontal margins, keep section inside the canvas.
      if (el.classList?.contains('st-section') && Math.max(0, ml) > 0) {
        const clamp = `calc(100% - ${Math.round(Math.max(0, ml))}px)`;
        storeOnce_(el, 'stLayoutBeforeMarginFitWidth', el.style.width || '');
        el.style.width = clamp;
      }
    }

    // Bottom behaves like right: positive bottom margin reduces the box height, negative expands it.
    // Top keeps normal offset behavior.
    if (Math.abs(mb) > 0.0001) {
      const baseH = ensureMarginBase_(el, 'h');
      const nextH = baseH - mb;
      setBoxHeightForBottomMargin_(el, nextH);
    } else {
      restoreMarginFitHeight_(el);
    }
  }


  // -----------------------------
  // 🔹 Layout Guides Overlay (padding/margin)
  // -----------------------------
  const guidesPaddingChk = sectionEl.querySelector('[data-guides-padding]');
  const guidesMarginChk  = sectionEl.querySelector('[data-guides-margin]');
  const guidesContrast   = sectionEl.querySelector('[data-guides-contrast]');

  const GUIDES = (() => {
    const api = {};
    let overlayRoot = null;
    let raf = 0;
    let dirty = false;

    const state = {
      showPadding: false,
      showMargin: false,
      contrast: 'color', // 'color' | 'white' | 'black'
    };

    function ensureOverlay_() {
      if (overlayRoot && overlayRoot.isConnected) return overlayRoot;
      overlayRoot = document.createElement('div');
      overlayRoot.className = 'st-layout-guides-overlay';
      document.body.appendChild(overlayRoot);
      return overlayRoot;
    }

    function clear_() {
      if (!overlayRoot) return;
      overlayRoot.innerHTML = '';
    }

    function px_(v) {
      return (Number.isFinite(v) ? v : 0) + 'px';
    }

    function n_(raw) {
      const v = parseFloat(raw);
      return Number.isFinite(v) ? v : 0;
    }

    function addRect_(rect, kind) {
      const root = ensureOverlay_();
      const el = document.createElement('div');
      el.className = 'st-layout-guide st-layout-guide--' + kind;

      if (state.contrast === 'white') el.classList.add('st-layout-guide--white');
      if (state.contrast === 'black') el.classList.add('st-layout-guide--black');

      el.style.left = px_(rect.left);
      el.style.top  = px_(rect.top);
      el.style.width  = px_(Math.max(0, rect.width));
      el.style.height = px_(Math.max(0, rect.height));
      root.appendChild(el);
    }

    function drawForEl_(targetEl) {
      if (!targetEl || !targetEl.getBoundingClientRect) return;
      const r = targetEl.getBoundingClientRect();
      const cs = getComputedStyle(targetEl);

      if (state.showMargin) {
        const mt = n_(cs.marginTop);
        const mr = n_(cs.marginRight);
        const mb = n_(cs.marginBottom);
        const ml = n_(cs.marginLeft);

        addRect_({
          left: r.left - ml,
          top:  r.top  - mt,
          width:  r.width + ml + mr,
          height: r.height + mt + mb
        }, 'margin');
      }

      if (state.showPadding) {
        const pt = n_(cs.paddingTop);
        const pr = n_(cs.paddingRight);
        const pb = n_(cs.paddingBottom);
        const pl = n_(cs.paddingLeft);

        addRect_({
          left: r.left + pl,
          top:  r.top  + pt,
          width:  r.width - pl - pr,
          height: r.height - pt - pb
        }, 'padding');
      }
    }

    function redraw_() {
      dirty = false;
      raf = 0;

      if (!state.showMargin && !state.showPadding) {
        clear_();
        return;
      }

      clear_();

      const sel = (typeof getSelection === 'function') ? getSelection() : null;
      const els = (sel && Array.isArray(sel.elements)) ? sel.elements : [];

      els.forEach(drawForEl_);
    }

    function schedule_() {
      if (dirty) return;
      dirty = true;
      if (raf) return;
      raf = requestAnimationFrame(redraw_);
    }

    api.state = state;
    api.schedule = schedule_;
    api.clear = clear_;
    return api;
  })();

  function syncGuidesControls_() {
    if (!guidesPaddingChk || !guidesMarginChk || !guidesContrast) return;
    GUIDES.state.showPadding = !!guidesPaddingChk.checked;
    GUIDES.state.showMargin  = !!guidesMarginChk.checked;

    const active = guidesContrast.querySelector('input[type="radio"]:checked');
    GUIDES.state.contrast = (active && active.value) ? active.value : 'color';

    GUIDES.schedule();
  }

  if (guidesPaddingChk) guidesPaddingChk.addEventListener('change', syncGuidesControls_);
  if (guidesMarginChk)  guidesMarginChk.addEventListener('change', syncGuidesControls_);
  if (guidesContrast)   guidesContrast.addEventListener('change', syncGuidesControls_);

  // redraw on selection change / scroll / resize / pointer move during drags
  document.addEventListener('st:selection-changed', () => GUIDES.schedule());

  window.addEventListener('resize', () => GUIDES.schedule());

  const canvasScrollEl = document.querySelector('.canvas__scroll');
  if (canvasScrollEl) canvasScrollEl.addEventListener('scroll', () => GUIDES.schedule(), { passive: true });

  document.addEventListener('pointermove', (e) => {
    // if user is dragging/resizing something — keep guides in sync
    if (!GUIDES.state.showMargin && !GUIDES.state.showPadding) return;
    if (e.buttons) GUIDES.schedule();
  }, { passive: true });

  function readBoxGridValues_(gridEl, mode) {
    const isMargin = mode === 'margin';
    const out = { t: null, r: null, b: null, l: null };
    gridEl?.querySelectorAll('input[data-side]').forEach((inp) => {
      const side = inp.getAttribute('data-side');
      if (!Object.prototype.hasOwnProperty.call(out, side)) return;
      const raw = String(inp.value ?? '').trim();
      if (raw === '') { out[side] = null; return; }
      const v = Number(raw);
      out[side] = Number.isFinite(v) ? clampPx_(v, { min: isMargin ? -200 : 0, max: 1000 }) : null;
    });
    return out;
  }

  function resetMarginFitBaseForEditedSides_(el, box, mode) {
    if (!el || mode !== 'margin') return;
    // When the user edits right/bottom from the widget, the base must be re-read from
    // the element before the new margin-fit is applied. Otherwise an old base from a
    // previous edit can make the controls look like they do nothing.
    if (box.r === null || Math.abs(Number(box.r) || 0) < 0.0001) clearMarginBase_(el, 'w');
    if (box.b === null || Math.abs(Number(box.b) || 0) < 0.0001) clearMarginBase_(el, 'h');
  }

  function applyBoxValues(gridEl, mode, opts = {}) {
    if (__uiSyncLock || !gridEl) return;
    const box = readBoxGridValues_(gridEl, mode);
    const { t, r, b, l } = box;

    // Пріоритет: активний(і) елемент(и)
    // Якщо нічого не вибрано — залишаємо стару поведінку (для сумісності)
    const activeTargets = getActiveElementsForBox_({ allowCache: true });
    const childTargets = (getLayoutTargetMode_() === 'children') ? getLayoutFirstLevelChildren_() : [];
    const { rows, blocks } = getTargetRowsAndBlocks();
    const targets = (childTargets && childTargets.length)
      ? childTargets
      : ((activeTargets && activeTargets.length) ? activeTargets : rows.concat(blocks));

    targets.forEach(el => {
      if (!(el instanceof HTMLElement)) return;

      if (mode === 'margin') {
        resetMarginFitBaseForEditedSides_(el, box, mode);
        el.style.marginTop    = (t === null ? '' : (t + 'px'));
        el.style.marginRight  = (r === null ? '' : (r + 'px'));
        el.style.marginBottom = (b === null ? '' : (b + 'px'));
        el.style.marginLeft   = (l === null ? '' : (l + 'px'));
        markLayoutWidgetMargin_(el, box);

        // Якщо секція була на всю ширину, а ми дали лівий/правий margin —
        // треба "стиснути" секцію всередину, а не зсувати її.
        if (el.classList && el.classList.contains('st-section')) {
          const ml = (l === null ? 0 : l);
          const mr = (r === null ? 0 : r);
          if (ml > 0 || mr > 0) {
            el.style.width = `calc(100% - ${ml}px - ${mr}px)`;
          } else if (el.dataset?.stLayoutBeforeMarginFitWidth === undefined) {
            // Do not erase a width restored/managed by the generic fit helper.
            el.style.width = '';
          }
        }
      } else {
        el.style.paddingTop    = (t === null ? '' : (t + 'px'));
        el.style.paddingRight  = (r === null ? '' : (r + 'px'));
        el.style.paddingBottom = (b === null ? '' : (b + 'px'));
        el.style.paddingLeft   = (l === null ? '' : (l + 'px'));
      }

      // 00297: keep the spacing action alive for labeled controls and number-spinner clicks.
      applySpacingBoundaryFit_(el);
    });

    // Do not immediately overwrite the edited input while the user is clicking the
    // number arrows. This was the exact cause of the visible 1 -> 0 rollback.
    window.setTimeout?.(() => {
      if (!isBoxEditorFocused_()) {
        syncBoxControlsFromSelection_();
        syncLayoutControlsFromSelection_();
      }
      try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
    }, 30);

    try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
    if (opts.commit !== false) persistLayoutChange_('layout-box-' + mode + '-change');
  }

  function bindBoxGrid_(gridEl, mode) {
    if (!gridEl) return;
    // Live input changes only the DOM preview. The native final `change`
    // event creates the single Store transaction.
    gridEl.addEventListener('input', () => applyBoxValues(gridEl, mode, { commit: false }));
    gridEl.addEventListener('change', () => applyBoxValues(gridEl, mode, { commit: true }));

    // After leaving the spacing input, refresh from the actual element style once.
    gridEl.addEventListener('focusout', () => {
      window.setTimeout?.(() => {
        if (!isBoxEditorFocused_()) syncBoxControlsFromSelection_();
      }, 60);
    });
  }

  bindBoxGrid_(marginGrid, 'margin');
  bindBoxGrid_(paddingGrid, 'padding');

  // --------- FR вага (для вибраних блоків у FR-рядку) ---------
  const frWeightWrap = sectionEl.querySelector('[data-fr-weight-wrap]');
  const frWeightInput = sectionEl.querySelector('[data-fr-weight]');

  function getSelectedBlocks_() {
    const sel = getSelection();
    if (!sel || !sel.elements?.length) return [];

    // Підтримка HEADER-INNER: там type може бути 'header-inner', а elements — будь-які ноди.
    // Нам потрібні саме .st-block (якщо клікнули всередині блока — піднімаємось closest).
    const raw = sel.elements
      .map(el => {
        if (!el) return null;
        if (el.classList && el.classList.contains('st-block')) return el;
        return el.closest ? el.closest('.st-block') : null;
      })
      .filter(Boolean);

    // Якщо вибір не по блоках — FR вага не має сенсу
    return Array.from(new Set(raw));
  }

  function isFrRow_(row) {
    if (!row) return false;
    const mode = row.dataset.layoutMode || 'fr';
    return mode === 'fr';
  }

  function normalizeFrs_(vals) {
    const arr = vals.map(v => (Number.isFinite(v) && v > 0 ? v : 1));
    const sum = arr.reduce((s, v) => s + v, 0) || 1;
    return arr.map(v => v / sum);
  }

  function applyRowFrFromData_(row) {
    if (!row || !isFrRow_(row)) return;
    const orient = row.dataset.layoutOrient || 'row';
    if (orient === 'column') {
      row.style.gridTemplateColumns = '1fr';
      return;
    }
    const kids = [...row.querySelectorAll(':scope > .st-block')];
    if (!kids.length) return;
    const raw = kids.map(k => parseFloat(k.dataset.fr || ''));
    // Важливо: НЕ нормалізуємо ваги автоматично (2,2,1,5 мають лишатися 2,2,1,5).
    // Нормалізуємо лише некоректні значення.
    const frs = raw.map(v => (Number.isFinite(v) && v > 0 ? v : 1));
    // Якщо значення некоректне — записати 1. Якщо коректне — НЕ чіпати точність користувача.
    kids.forEach((k, i) => {
      const cur = parseFloat(k.dataset.fr || '');
      if (!(Number.isFinite(cur) && cur > 0)) k.dataset.fr = String(frs[i]);
      k.style.width = '';
    });
    row.style.gridTemplateColumns = frs.map(f => `${Number(f).toFixed(4)}fr`).join(' ');
    // щоб переключення орієнтації могло відновити колонки
    row.dataset.layoutGridColsPrev = row.style.gridTemplateColumns;
  }

  function syncFrWeightFromSelection_() {
    if (!frWeightWrap || !frWeightInput) return;
    const blocks = getSelectedBlocks_();
    if (!blocks.length) {
      frWeightWrap.style.display = 'none';
      frWeightInput.value = '';
      return;
    }
    // Показувати поле лише якщо всі вибрані блоки лежать у FR-рядках
    const rows = blocks.map(b => b?.parentElement?.classList?.contains('st-row') ? b.parentElement : b.closest('.st-row'));
    if (!rows.length || rows.some(r => !isFrRow_(r))) {
      frWeightWrap.style.display = 'none';
      frWeightInput.value = '';
      return;
    }
    frWeightWrap.style.display = '';

    const vals = blocks.map(b => parseFloat(b.dataset.fr || ''));
    const ok = vals.every(v => Number.isFinite(v) && v > 0);
    if (!ok) {
      frWeightInput.value = '';
      return;
    }
    const first = vals[0];
    const same = vals.every(v => Math.abs(v - first) < 1e-6);
    frWeightInput.value = same ? String(Number(first.toFixed(4))) : '';
  }

  // live-apply
  if (frWeightInput) {
    frWeightInput.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      commitFrWeight_();
    });
    frWeightInput.addEventListener('blur', () => {
      // На blur теж комітимо, щоб значення не "гуляло"
      commitFrWeight_();
    });

    function commitFrWeight_() {
      const rawStr = String(frWeightInput.value || '').trim();
      const v = parseFloat(rawStr);
      if (!Number.isFinite(v) || v <= 0) return;

      const blocks = getSelectedBlocks_();
      if (!blocks.length) return;

      // Запам'ятовуємо ТОЧНЕ введене значення (як рядок), без авто-нормалізації.
      // Далі applyRowFrFromData_ будує grid-template-columns з цих значень.
      blocks.forEach(b => {
        b.dataset.fr = rawStr;
        b.style.width = '';
      });

      const rows = new Set(
        blocks
          .map(b => b?.parentElement?.classList?.contains('st-row') ? b.parentElement : b.closest('.st-row'))
          .filter(Boolean)
      );
      rows.forEach(r => applyRowFrFromData_(r));

      // Оновити UI одразу, щоб поле показувало зафіксоване значення
      syncFrWeightFromSelection_();

      try { if (typeof GUIDES !== 'undefined') GUIDES.schedule(); } catch(e) {}
      persistLayoutChange_('layout-fr-weight-change');
    }

  }

  
  function syncLayoutControlsFromSelection_() {
    const { rows } = getTargetRowsAndBlocks();
    const row = rows[0];
    if (!row) return;

    const modeRaw = row.dataset.layoutMode || 'fr';
    const isFree = (modeRaw === 'free');
    // У FREE показуємо радіо попереднього режиму, але робимо їх неактивними.
    const modeForUI = isFree ? (row.dataset.layoutModePrev || 'fr') : modeRaw;
    setModeUI_(modeForUI);
    setFreeUIState_(isFree);

    // GRID cols (if present)
    if (gridColsInput) {
      const v = (row.style.getPropertyValue('--st-grid-cols') || '').trim();
      const n = Math.max(1, Math.min(12, Number(v || 3) || 3));
      gridColsInput.value = String(n);
    }

    // Gap X/Y (prefer explicit vars, fallback to computed)
    const cs = getComputedStyle(row);
    let gx = parseInt((row.style.getPropertyValue('--site-gap-x') || cs.columnGap || '16'), 10);
    let gy = parseInt((row.style.getPropertyValue('--site-gap-y') || cs.rowGap || '16'), 10);
    if (isMenuRootListProxy_(row)) {
      const menuBlock = row.closest?.('.st-block--menu');
      const menuGap = getMenuLevel1Gap_(menuBlock);
      gx = menuGap;
      gy = menuGap;
    }
    // ✅ sync UI only. Не пишемо назад у DOM під час зміни selection/mouseup,
    // інакше старі computed/dataset значення можуть відкотити live-зміну повзунка.
    setGapUIOnly_(isFinite(gx) ? gx : 16, isFinite(gy) ? gy : 16);

    // Вирівнювання: якщо вибрані блоки — показуємо стан вирівнювання БЛОКА,
    // інакше — стан ROW-хосту (як було раніше).
    const blocksSel = (typeof getSelectedBlocks_ === 'function') ? getSelectedBlocks_() : [];
    const modeNow = row.dataset.layoutMode || 'fr';

    function inferBlockAlignX_(b) {
      if (!b) return '';
      const js = (b.style.justifySelf || '').trim();
      if (js) return js;
      const ml = (b.style.marginLeft || '').trim();
      const mr = (b.style.marginRight || '').trim();
      if (ml === 'auto' && mr === 'auto') return 'center';
      if (ml === 'auto') return 'end';
      if (mr === 'auto') return 'start';
      return '';
    }

    function inferBlockAlignY_(b) {
      if (!b) return '';
      const as = (b.style.alignSelf || '').trim();
      if (as) return as;
      const mt = (b.style.marginTop || '').trim();
      const mb = (b.style.marginBottom || '').trim();
      if (mt === 'auto' && mb === 'auto') return 'center';
      if (mt === 'auto') return 'end';
      if (mb === 'auto') return 'start';
      return '';
    }

    const j = (blocksSel && blocksSel.length)
      ? inferBlockAlignX_(blocksSel[0])
      : ((modeNow === 'grid') ? (row.style.justifyItems || cs.justifyItems || '') : (row.style.justifyContent || cs.justifyContent || ''));

    const a = (blocksSel && blocksSel.length)
      ? inferBlockAlignY_(blocksSel[0])
      : (row.style.alignItems || cs.alignItems || '');

    const norm = (v) => {
      const x = String(v || '').trim();
      if (!x) return '';
      // у computed може бути 'start/end' замість flex-start/flex-end
      if (x === 'start') return 'flex-start';
      if (x === 'end') return 'flex-end';
      return x;
    };

    const jv = norm(j);
    const av = norm(a);

    if (justifyGroup) {
      const btn = justifyGroup.querySelector(`.design-pill[data-val="${jv}"]`) || justifyGroup.querySelector('.design-pill[data-val="flex-start"]');
      justifyGroup.querySelectorAll('.design-pill').forEach(b => b.classList.remove('is-active'));
      if (btn) btn.classList.add('is-active');
    }

    if (alignYGroup) {
      const btn = alignYGroup.querySelector(`.design-pill[data-val="${av}"]`) || alignYGroup.querySelector('.design-pill[data-val="flex-start"]');
      alignYGroup.querySelectorAll('.design-pill').forEach(b => b.classList.remove('is-active'));
      if (btn) btn.classList.add('is-active');
    }
  }
// Підтягувати значення в UI при зміні вибору
  // selection-manager диспатчить цю подію на document
  document.addEventListener('st:selection-changed', () => {
    if (!isBoxEditorFocused_()) syncBoxControlsFromSelection_();
    syncLayoutControlsFromSelection_();
    syncFrWeightFromSelection_();
  });
  // і одразу при ініціалізації
  syncBoxControlsFromSelection_();
  syncFrWeightFromSelection_();
}
