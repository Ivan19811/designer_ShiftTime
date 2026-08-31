import { getResponsiveEditScope00991, responsiveProfileDescription00991, resolveResponsiveProfile00991, RESPONSIVE_EDIT_PROFILES_00991 } from './responsive-edit-scope-00991.js?v=00991';

// 00991-RESPONSIVE-VIEWPORT-RANGE-EDIT-SCOPE
// Builder viewport simulation plus explicit adaptive width-range identity. SiteFrame
// edits use the active range as a sparse override; merely switching viewport writes no design state.

export const RESPONSIVE_VIEWPORT_STORAGE_KEY_00958 = 'st_builder_responsive_viewport_v1';
export const RESPONSIVE_VIEWPORT_LIMITS_00958 = Object.freeze({ minWidth: 280, maxWidth: 2560, minHeight: 280, maxHeight: 1600 });

export const RESPONSIVE_VIEWPORT_PRESETS_00958 = Object.freeze([
  { id: 'qhd-2560', group: 'desktop', label: 'Великий екран 32″ · 2240–2560 px', width: 2560, height: 1440 },
  { id: 'fhd-1920', group: 'desktop', label: 'Великий екран 27″ · 1920–2239 px', width: 1920, height: 1080 },
  { id: 'desktop-1680', group: 'desktop', label: 'Стандартний екран 23″ · 1600–1919 px', width: 1680, height: 1050 },
  { id: 'desktop-1600', group: 'desktop', label: 'Стандартний екран 23″ · 1600–1919 px', width: 1600, height: 900 },
  { id: 'laptop-1536', group: 'laptop', label: 'Ноутбук 17″ · 1366–1599 px', width: 1536, height: 864 },
  { id: 'laptop-1440', group: 'laptop', label: 'Ноутбук 17″ · 1366–1599 px', width: 1440, height: 900 },
  { id: 'laptop-1366', group: 'laptop', label: 'Ноутбук 17″ · 1366–1599 px', width: 1366, height: 768 },
  { id: 'laptop-1280', group: 'laptop', label: 'Компактний ноутбук · 1180–1365 px', width: 1280, height: 800 },
  { id: 'tablet-1024', group: 'tablet', label: 'Планшет широкий · 900–1179 px', width: 1024, height: 768 },
  { id: 'tablet-834', group: 'tablet', label: 'Планшет · 700–899 px', width: 834, height: 1194 },
  { id: 'tablet-820', group: 'tablet', label: 'Планшет · 700–899 px', width: 820, height: 1180 },
  { id: 'tablet-768', group: 'tablet', label: 'Планшет · 700–899 px', width: 768, height: 1024 },
  { id: 'phone-430', group: 'phone', label: 'Великий телефон · 390–699 px', width: 430, height: 932 },
  { id: 'phone-414', group: 'phone', label: 'Великий телефон · 390–699 px', width: 414, height: 896 },
  { id: 'phone-390', group: 'phone', label: 'Великий телефон · 390–699 px', width: 390, height: 844 },
  { id: 'phone-375', group: 'phone', label: 'Малий телефон · 280–389 px', width: 375, height: 812 },
  { id: 'phone-360', group: 'small-phone', label: 'Малий телефон · 280–389 px', width: 360, height: 800 },
  { id: 'phone-320', group: 'small-phone', label: 'Малий телефон · 280–389 px', width: 320, height: 568 }
]);

const QUICK_PRESET_BY_MODE_00958 = Object.freeze({
  desktop: 'fhd-1920',
  laptop: 'laptop-1440',
  tablet: 'tablet-768',
  phone: 'phone-390',
  'small-phone': 'phone-320'
});

const DEFAULT_FAVORITES_00958 = Object.freeze(['fhd-1920', 'laptop-1440', 'tablet-1024', 'tablet-768', 'phone-390', 'phone-320']);

const ICONS_00958 = Object.freeze({
  responsive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  desktop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="3" width="19" height="13" rx="2"/><path d="M8 21h8M12 16v5"/></svg>',
  laptop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="4" width="14" height="11" rx="1.5"/><path d="M2.5 18h19l-1 2h-17z"/></svg>',
  tablet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2.5"/><path d="M10 18.5h4"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M10.5 18.5h3"/></svg>',
  'small-phone': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M11 17.5h2"/></svg>',
  manual: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M8 12h8M8 12l2-2M8 12l2 2M16 12l-2-2M16 12l-2 2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.35a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.07 14H3v-4h.09A1.7 1.7 0 0 0 4.65 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63h.02A1.7 1.7 0 0 0 10 3.07V3h4v.09A1.7 1.7 0 0 0 15 4.65a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9v.02A1.7 1.7 0 0 0 20.93 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></svg>'
});

function numberInRange00958_(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

export function createDefaultResponsiveViewportState00958() {
  return {
    version: 1,
    enabled: false,
    width: 1440,
    height: 900,
    mode: 'laptop',
    presetId: 'laptop-1440',
    favorites: [...DEFAULT_FAVORITES_00958]
  };
}

export function normalizeResponsiveViewportState00958(value) {
  const defaults = createDefaultResponsiveViewportState00958();
  const source = value && typeof value === 'object' ? value : {};
  const knownModes = new Set(['desktop', 'laptop', 'tablet', 'phone', 'small-phone', 'manual']);
  const knownIds = new Set(RESPONSIVE_VIEWPORT_PRESETS_00958.map((preset) => preset.id));
  const favorites = Array.isArray(source.favorites)
    ? [...new Set(source.favorites.filter((id) => knownIds.has(id)))]
    : defaults.favorites;
  return {
    version: 1,
    enabled: source.enabled === true,
    width: numberInRange00958_(source.width, RESPONSIVE_VIEWPORT_LIMITS_00958.minWidth, RESPONSIVE_VIEWPORT_LIMITS_00958.maxWidth, defaults.width),
    height: numberInRange00958_(source.height, RESPONSIVE_VIEWPORT_LIMITS_00958.minHeight, RESPONSIVE_VIEWPORT_LIMITS_00958.maxHeight, defaults.height),
    mode: knownModes.has(source.mode) ? source.mode : defaults.mode,
    presetId: knownIds.has(source.presetId) ? source.presetId : '',
    favorites
  };
}

function readState00958_() {
  try {
    return normalizeResponsiveViewportState00958(JSON.parse(localStorage.getItem(RESPONSIVE_VIEWPORT_STORAGE_KEY_00958) || 'null'));
  } catch (_) {
    return createDefaultResponsiveViewportState00958();
  }
}

function writeState00958_(state) {
  try { localStorage.setItem(RESPONSIVE_VIEWPORT_STORAGE_KEY_00958, JSON.stringify(state)); } catch (_) {}
}

function findPreset00958_(id) {
  return RESPONSIVE_VIEWPORT_PRESETS_00958.find((preset) => preset.id === id) || null;
}

function escapeHtml00958_(value) {
  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
}

function renderQuickButton00958_(mode, title) {
  return `<button class="st-rvp__quick-btn" type="button" data-rvp-mode="${mode}" title="${title}" aria-label="${title}">${ICONS_00958[mode]}</button>`;
}

function renderWidget00958_(host) {
  host.innerHTML = `
    <section class="st-rvp" aria-label="Керування адаптивністю сайту">
      <div class="st-rvp__head">
        <button class="st-rvp__label" type="button" data-rvp-help-target aria-describedby="st-rvp-help">
          ${ICONS_00958.responsive}<span>Адаптивність</span>
        </button>
        <button class="st-rvp__gear" type="button" data-rvp-settings aria-expanded="false" aria-controls="st-rvp-panel" title="Налаштування адаптивності" aria-label="Налаштування адаптивності">${ICONS_00958.gear}</button>
      </div>
      <div class="st-rvp__quick" role="toolbar" aria-label="Швидкі розміри екрана">
        ${renderQuickButton00958_('desktop', 'Екран — 1920 × 1080')}
        ${renderQuickButton00958_('laptop', 'Ноутбук — 1440 × 900')}
        ${renderQuickButton00958_('tablet', 'Планшет — 768 × 1024')}
        ${renderQuickButton00958_('phone', 'Телефон — 390 × 844')}
        ${renderQuickButton00958_('small-phone', 'Малий телефон — 320 × 568')}
        ${renderQuickButton00958_('manual', 'Ручне налаштування ширини')}
      </div>
      <select class="st-rvp__favorite-select" data-rvp-favorite-select aria-label="Обрані стандартні розміри"></select>
      <div class="st-rvp__readout"><span><i class="st-rvp__live-dot" aria-hidden="true"></i></span><strong data-rvp-readout>Повна ширина</strong></div>

      <div class="st-rvp__panel" id="st-rvp-panel" role="dialog" aria-modal="false" aria-labelledby="st-rvp-panel-title" hidden>
        <div class="st-rvp__panel-head">
          <div><h2 class="st-rvp__panel-title" id="st-rvp-panel-title">Налаштування адаптивності</h2><p class="st-rvp__panel-subtitle">Кожна ширина входить у плаваючий адаптивний діапазон. Редагування в активному режимі зберігається тільки для цього діапазону.</p></div>
          <button class="st-rvp__panel-close" type="button" data-rvp-close aria-label="Закрити">×</button>
        </div>
        <div class="st-rvp__status-row">
          <div class="st-rvp__status">Поточний режим<strong data-rvp-panel-status>Вимкнено · повна ширина</strong><small data-rvp-profile-status style="display:block;margin-top:6px;color:#fde68a;font-weight:850"></small></div>
          <div class="st-rvp__panel-actions"><button class="st-rvp__danger" type="button" data-rvp-disable>Вимкнути адаптивність</button></div>
        </div>

        <section class="st-rvp__section" aria-labelledby="st-rvp-manual-title">
          <h3 id="st-rvp-manual-title">Ручний точний розмір</h3>
          <p class="st-rvp__section-note">Введіть будь-яку ширину. Вона автоматично належить одному адаптивному діапазону; ручні ширини всередині нього використовують ті самі налаштування.</p>
          <div class="st-rvp__manual-grid">
            <label class="st-rvp__field"><span>Ширина, px</span><input type="number" min="280" max="2560" step="1" inputmode="numeric" data-rvp-width><div class="st-rvp__step-row">${[-100,-10,-1,1,10,100].map((step) => `<button class="st-rvp__step" type="button" data-rvp-dimension="width" data-rvp-step="${step}">${step > 0 ? '+' : ''}${step}</button>`).join('')}</div></label>
            <label class="st-rvp__field"><span>Висота, px</span><input type="number" min="280" max="1600" step="1" inputmode="numeric" data-rvp-height><div class="st-rvp__step-row">${[-100,-10,-1,1,10,100].map((step) => `<button class="st-rvp__step" type="button" data-rvp-dimension="height" data-rvp-step="${step}">${step > 0 ? '+' : ''}${step}</button>`).join('')}</div></label>
          </div>
          <div class="st-rvp__manual-actions"><button class="st-rvp__primary" type="button" data-rvp-apply-manual>Застосувати точний розмір</button><button class="st-rvp__secondary" type="button" data-rvp-swap>Поміняти орієнтацію</button></div>
        </section>

        <section class="st-rvp__section" aria-labelledby="st-rvp-standards-title">
          <h3 id="st-rvp-standards-title">Стандартні екрани</h3>
          <p class="st-rvp__section-note">Прапорець додає точку перевірки у швидкий список. Налаштування дизайну зберігаються не для однієї точки, а для її діапазону ширин.</p>
          <div class="st-rvp__matrix" data-rvp-matrix></div>
          <div class="st-rvp__tour-actions"><button class="st-rvp__secondary" type="button" data-rvp-prev>← Попередній вибраний</button><span data-rvp-favorite-count></span><button class="st-rvp__secondary" type="button" data-rvp-next>Наступний вибраний →</button></div>
        </section>
      </div>

      <aside class="st-rvp__help" id="st-rvp-help" role="tooltip" hidden>
        <strong>Як користуватися адаптивністю</strong>
        <p>Оберіть екран — усі зміни розміру, рамки, типографіки та інших стилів записуються тільки в активний діапазон ширини.</p>
        <ol><li>32″, 27″, 23″, ноутбук, планшет і телефони мають неперервні діапазони ширини.</li><li>Ручна ширина автоматично потрапляє у відповідний діапазон.</li><li>Зміни одного діапазону не переписують базовий стиль або інші екрани.</li><li>«Вимкнути адаптивність» показує та редагує базовий стиль.</li></ol>
      </aside>
    </section>`;
}

export function initResponsiveViewportController00958() {
  const host = document.getElementById('st-responsive-viewport-widget');
  const builderRoot = document.getElementById('builder-root');
  const siteCanvas = document.getElementById('site-canvas');
  if (!host || !builderRoot || !siteCanvas || host.dataset.rvpReady === '1') return null;

  host.dataset.rvpReady = '1';
  renderWidget00958_(host);

  const widget = host.querySelector('.st-rvp');
  const panel = host.querySelector('[data-rvp-settings]');
  const settingsPanel = host.querySelector('#st-rvp-panel');
  const helpTarget = host.querySelector('[data-rvp-help-target]');
  const help = host.querySelector('#st-rvp-help');
  const readout = host.querySelector('[data-rvp-readout]');
  const status = host.querySelector('[data-rvp-panel-status]');
  const profileStatus = host.querySelector('[data-rvp-profile-status]');
  const favoriteSelect = host.querySelector('[data-rvp-favorite-select]');
  const matrix = host.querySelector('[data-rvp-matrix]');
  const favoriteCount = host.querySelector('[data-rvp-favorite-count]');
  const widthInput = host.querySelector('[data-rvp-width]');
  const heightInput = host.querySelector('[data-rvp-height]');
  let state = readState00958_();
  let helpTimer = 0;
  let dragFrame = 0;
  let pendingDragWidth = state.width;

  const dragHandle = document.createElement('button');
  dragHandle.type = 'button';
  dragHandle.className = 'st-rvp__drag-handle';
  dragHandle.setAttribute('aria-label', 'Змінити ширину полотна мишкою');
  dragHandle.title = 'Перетягніть ліворуч або праворуч для зміни ширини';
  siteCanvas.appendChild(dragHandle);

  function announceChange00958_() {
    { const editScope = getResponsiveEditScope00991(state); window.dispatchEvent(new CustomEvent('st:responsive-viewport-change', { detail: { ...state, editScope } })); }
  }

  function renderFavorites00958_() {
    const favorites = RESPONSIVE_VIEWPORT_PRESETS_00958.filter((preset) => state.favorites.includes(preset.id));
    favoriteSelect.innerHTML = '<option value="">Обрані стандартні розміри…</option>' + favorites.map((preset) => (
      `<option value="${preset.id}">${preset.width} × ${preset.height} · ${escapeHtml00958_(preset.label)}</option>`
    )).join('');
    favoriteSelect.value = state.presetId && state.favorites.includes(state.presetId) ? state.presetId : '';
    favoriteCount.textContent = `Вибрано: ${favorites.length}`;
  }

  function renderMatrix00958_() {
    matrix.innerHTML = RESPONSIVE_VIEWPORT_PRESETS_00958.map((preset) => `
      <div class="st-rvp__matrix-row${state.presetId === preset.id && state.enabled ? ' is-current' : ''}" data-rvp-matrix-row="${preset.id}">
        <label class="st-rvp__matrix-main"><input type="checkbox" data-rvp-favorite="${preset.id}" ${state.favorites.includes(preset.id) ? 'checked' : ''}><span class="st-rvp__matrix-copy"><strong>${preset.width} × ${preset.height}</strong><span>${escapeHtml00958_(preset.label)}</span></span></label>
        <button class="st-rvp__matrix-apply" type="button" data-rvp-preset="${preset.id}">Відкрити</button>
      </div>`).join('');
  }

  function renderState00958_({ matrixToo = true } = {}) {
    builderRoot.classList.toggle('st-rvp-enabled', state.enabled);
    widget.classList.toggle('is-enabled', state.enabled);
    // 01014: desktop workspace follows the full width currently available in the
    // builder. Shrinking the inspector widens the site; widening the inspector
    // narrows it. Tablet/phone/laptop/manual presets keep their exact target width.
    if (state.enabled && state.mode === 'desktop') builderRoot.setAttribute('data-st-rvp-fill-available', '1');
    else builderRoot.removeAttribute('data-st-rvp-fill-available');
    if (state.enabled) {
      builderRoot.style.setProperty('--st-rvp-width', `${state.width}px`);
      builderRoot.style.setProperty('--st-rvp-height', `${state.height}px`);
      readout.textContent = `${state.width} × ${state.height}`;
      status.textContent = `${state.width} × ${state.height} · ${state.mode === 'manual' ? 'ручний режим' : 'стандартний екран'}`;
      if (profileStatus) profileStatus.textContent = `Редагування: ${responsiveProfileDescription00991(getResponsiveEditScope00991(state))}`;
    } else {
      builderRoot.style.removeProperty('--st-rvp-width');
      builderRoot.style.removeProperty('--st-rvp-height');
      readout.textContent = 'Повна ширина';
      status.textContent = 'Вимкнено · повна ширина';
      if (profileStatus) profileStatus.textContent = 'Редагування: базовий стиль для всіх екранів';
    }
    widthInput.value = String(state.width);
    heightInput.value = String(state.height);
    host.querySelectorAll('[data-rvp-mode]').forEach((button) => {
      const isActive = state.enabled && button.dataset.rvpMode === state.mode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    if (matrixToo) renderMatrix00958_();
    renderFavorites00958_();
    announceChange00958_();
  }

  function commitState00958_(next, options = {}) {
    state = normalizeResponsiveViewportState00958({ ...state, ...next });
    writeState00958_(state);
    renderState00958_(options);
  }

  function applyPreset00958_(presetId) {
    const preset = findPreset00958_(presetId);
    if (!preset) return;
    commitState00958_({ enabled: true, width: preset.width, height: preset.height, mode: preset.group, presetId: preset.id });
  }

  function applyManual00958_() {
    commitState00958_({
      enabled: true,
      width: numberInRange00958_(widthInput.value, RESPONSIVE_VIEWPORT_LIMITS_00958.minWidth, RESPONSIVE_VIEWPORT_LIMITS_00958.maxWidth, state.width),
      height: numberInRange00958_(heightInput.value, RESPONSIVE_VIEWPORT_LIMITS_00958.minHeight, RESPONSIVE_VIEWPORT_LIMITS_00958.maxHeight, state.height),
      mode: 'manual',
      presetId: ''
    });
  }

  function placePanel00958_() {
    if (settingsPanel.hidden) return;
    const anchor = panel.getBoundingClientRect();
    const panelWidth = Math.min(790, window.innerWidth - 28);
    const panelHeight = Math.min(settingsPanel.scrollHeight || 650, window.innerHeight - 28);
    const sideRight = builderRoot.classList.contains('builder--side-right');
    const left = sideRight
      ? Math.max(14, anchor.left - panelWidth - 12)
      : Math.min(window.innerWidth - panelWidth - 14, anchor.right + 12);
    const top = Math.max(14, Math.min(window.innerHeight - panelHeight - 14, anchor.bottom - panelHeight));
    settingsPanel.style.setProperty('--st-rvp-panel-left', `${Math.round(left)}px`);
    settingsPanel.style.setProperty('--st-rvp-panel-top', `${Math.round(top)}px`);
  }

  function showHelp00958_() {
    const rect = helpTarget.getBoundingClientRect();
    const helpWidth = Math.min(390, window.innerWidth - 28);
    const sideRight = builderRoot.classList.contains('builder--side-right');
    const left = sideRight ? Math.max(14, rect.left - helpWidth - 12) : Math.min(window.innerWidth - helpWidth - 14, rect.right + 12);
    const top = Math.max(14, Math.min(window.innerHeight - 310, rect.top - 30));
    help.style.setProperty('--st-rvp-help-left', `${Math.round(left)}px`);
    help.style.setProperty('--st-rvp-help-top', `${Math.round(top)}px`);
    help.hidden = false;
  }

  function hideHelp00958_() {
    window.clearTimeout(helpTimer);
    helpTimer = 0;
    help.hidden = true;
  }

  function tourFavorite00958_(direction) {
    const favorites = RESPONSIVE_VIEWPORT_PRESETS_00958.filter((preset) => state.favorites.includes(preset.id));
    if (!favorites.length) return;
    let index = favorites.findIndex((preset) => preset.id === state.presetId);
    index = index < 0 ? 0 : (index + direction + favorites.length) % favorites.length;
    applyPreset00958_(favorites[index].id);
  }

  host.addEventListener('click', (event) => {
    const modeButton = event.target.closest('[data-rvp-mode]');
    if (modeButton) {
      const mode = modeButton.dataset.rvpMode;
      if (mode === 'manual') commitState00958_({ enabled: true, mode: 'manual', presetId: '' });
      else applyPreset00958_(QUICK_PRESET_BY_MODE_00958[mode]);
      return;
    }
    const presetButton = event.target.closest('[data-rvp-preset]');
    if (presetButton) { applyPreset00958_(presetButton.dataset.rvpPreset); return; }
    if (event.target.closest('[data-rvp-settings]')) {
      settingsPanel.hidden = !settingsPanel.hidden;
      panel.setAttribute('aria-expanded', String(!settingsPanel.hidden));
      if (!settingsPanel.hidden) { renderMatrix00958_(); renderFavorites00958_(); requestAnimationFrame(placePanel00958_); }
      return;
    }
    if (event.target.closest('[data-rvp-close]')) {
      settingsPanel.hidden = true;
      panel.setAttribute('aria-expanded', 'false');
      panel.focus();
      return;
    }
    if (event.target.closest('[data-rvp-disable]')) {
      commitState00958_({ enabled: false });
      return;
    }
    if (event.target.closest('[data-rvp-apply-manual]')) { applyManual00958_(); return; }
    if (event.target.closest('[data-rvp-swap]')) {
      const width = numberInRange00958_(heightInput.value, RESPONSIVE_VIEWPORT_LIMITS_00958.minWidth, RESPONSIVE_VIEWPORT_LIMITS_00958.maxWidth, state.width);
      const height = numberInRange00958_(widthInput.value, RESPONSIVE_VIEWPORT_LIMITS_00958.minHeight, RESPONSIVE_VIEWPORT_LIMITS_00958.maxHeight, state.height);
      widthInput.value = String(width);
      heightInput.value = String(height);
      applyManual00958_();
      return;
    }
    const stepButton = event.target.closest('[data-rvp-step]');
    if (stepButton) {
      const input = stepButton.dataset.rvpDimension === 'height' ? heightInput : widthInput;
      input.value = String(Number(input.value || 0) + Number(stepButton.dataset.rvpStep || 0));
      applyManual00958_();
      return;
    }
    if (event.target.closest('[data-rvp-prev]')) { tourFavorite00958_(-1); return; }
    if (event.target.closest('[data-rvp-next]')) { tourFavorite00958_(1); }
  });

  host.addEventListener('change', (event) => {
    const favoriteToggle = event.target.closest('[data-rvp-favorite]');
    if (favoriteToggle) {
      const id = favoriteToggle.dataset.rvpFavorite;
      const next = new Set(state.favorites);
      if (favoriteToggle.checked) next.add(id); else next.delete(id);
      commitState00958_({ favorites: RESPONSIVE_VIEWPORT_PRESETS_00958.map((preset) => preset.id).filter((presetId) => next.has(presetId)) }, { matrixToo: false });
      return;
    }
    if (event.target === favoriteSelect && favoriteSelect.value) applyPreset00958_(favoriteSelect.value);
  });

  helpTarget.addEventListener('pointerenter', () => {
    hideHelp00958_();
    helpTimer = window.setTimeout(showHelp00958_, 3000);
  });
  helpTarget.addEventListener('pointerleave', hideHelp00958_);
  helpTarget.addEventListener('focus', showHelp00958_);
  helpTarget.addEventListener('blur', hideHelp00958_);

  dragHandle.addEventListener('pointerdown', (event) => {
    if (!state.enabled) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = state.width;
    const canvasRect = siteCanvas.getBoundingClientRect();
    const viewRect = document.getElementById('canvasView')?.getBoundingClientRect();
    const centeredMultiplier = viewRect && canvasRect.left > viewRect.left + 32 ? 2 : 1;
    pendingDragWidth = startWidth;
    dragHandle.classList.add('is-dragging');
    document.body.classList.add('st-rvp-is-dragging');
    dragHandle.setPointerCapture?.(event.pointerId);

    const applyLiveWidth = () => {
      dragFrame = 0;
      builderRoot.style.setProperty('--st-rvp-width', `${pendingDragWidth}px`);
      readout.textContent = `${pendingDragWidth} × ${state.height}`;
      widthInput.value = String(pendingDragWidth);
    };
    const onMove = (moveEvent) => {
      pendingDragWidth = numberInRange00958_(startWidth + (moveEvent.clientX - startX) * centeredMultiplier, RESPONSIVE_VIEWPORT_LIMITS_00958.minWidth, RESPONSIVE_VIEWPORT_LIMITS_00958.maxWidth, startWidth);
      if (!dragFrame) dragFrame = requestAnimationFrame(applyLiveWidth);
    };
    const onEnd = () => {
      dragHandle.removeEventListener('pointermove', onMove);
      dragHandle.removeEventListener('pointerup', onEnd);
      dragHandle.removeEventListener('pointercancel', onEnd);
      if (dragFrame) cancelAnimationFrame(dragFrame);
      dragFrame = 0;
      dragHandle.classList.remove('is-dragging');
      document.body.classList.remove('st-rvp-is-dragging');
      commitState00958_({ enabled: true, width: pendingDragWidth, mode: 'manual', presetId: '' });
    };
    dragHandle.addEventListener('pointermove', onMove);
    dragHandle.addEventListener('pointerup', onEnd);
    dragHandle.addEventListener('pointercancel', onEnd);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!settingsPanel.hidden && !settingsPanel.contains(event.target) && !panel.contains(event.target)) {
      settingsPanel.hidden = true;
      panel.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    hideHelp00958_();
    if (!settingsPanel.hidden) {
      settingsPanel.hidden = true;
      panel.setAttribute('aria-expanded', 'false');
      panel.focus();
    }
  });
  window.addEventListener('resize', () => { placePanel00958_(); if (!help.hidden) showHelp00958_(); });
  builderRoot.querySelector('[data-action="toggle-side"]')?.addEventListener('click', () => requestAnimationFrame(placePanel00958_));

  renderMatrix00958_();
  renderState00958_({ matrixToo: false });
  window.ST_RESPONSIVE_VIEWPORT_00991 = Object.freeze({
    version: '00991-responsive-viewport-range-edit-scope',
    getState: () => ({ ...state, favorites: [...state.favorites], editScope: getResponsiveEditScope00991(state) }),
    getEditScope: () => getResponsiveEditScope00991(state),
    getProfiles: () => RESPONSIVE_EDIT_PROFILES_00991.map(profile => ({ ...profile })),
    resolveProfile: (width) => ({ ...resolveResponsiveProfile00991(width) }),
    applyPreset: applyPreset00958_,
    disable: () => commitState00958_({ enabled: false })
  });
  window.ST_RESPONSIVE_VIEWPORT_00958 = window.ST_RESPONSIVE_VIEWPORT_00991;
  return window.ST_RESPONSIVE_VIEWPORT_00991;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveViewportController00958, { once: true });
  } else {
    initResponsiveViewportController00958();
  }
}
