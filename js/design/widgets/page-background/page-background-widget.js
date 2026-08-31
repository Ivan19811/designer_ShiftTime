// js/design/widgets/page-background/page-background-widget.js
// Віджет "Фон сторінки" для панелі "Дизайн" (правий сайтбар).

import { siteState } from '../../../site-state.js';
import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
import { galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';

export function initPageBackgroundWidget(host) {
  if (!host) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section is-open';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Фон сторінки</span>
      </div>
       <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <!-- Режими -->
      <div class="design-pill-group design-bg-mode" role="tablist" aria-label="Режим фону">
        <button class="design-pill is-active" type="button" data-bg-mode="color">Колір</button>
        <button class="design-pill" type="button" data-bg-mode="gradient">Градієнт</button>
        <button class="design-pill" type="button" data-bg-mode="image">Зображення</button>
      </div>

      <!-- Режим: КОЛІР -->
      <div class="design-bg-group" data-bg-group="color">
        <div class="design-bg-row">
          <label>Колір</label>
          <input type="color" class="design-color" data-bg="color" value="#111827">
          <input type="text" class="design-input" data-bg="colorText" value="#111827">
        </div>
      </div>

      <!-- Режим: ГРАДІЄНТ -->
      <div class="design-bg-group" data-bg-group="gradient" style="display:none;">
        <div class="design-bg-row">
          <label>Колір 1</label>
          <input type="color" class="design-color" data-bg="gradColor1" value="#111827">
          <input type="text" class="design-input" data-bg="gradColor1Text" value="#111827">
        </div>
        <div class="design-bg-row">
          <label>Колір 2</label>
          <input type="color" class="design-color" data-bg="gradColor2" value="#020617">
          <input type="text" class="design-input" data-bg="gradColor2Text" value="#020617">
        </div>
        <div class="design-bg-row">
          <label>Напрям</label>
          <select class="design-select" data-bg="gradDirection">
            <option value="to bottom" selected>Зверху → вниз</option>
            <option value="to top">Знизу → вгору</option>
            <option value="to right">Зліва → вправо</option>
            <option value="to left">Справа → вліво</option>
            <option value="45deg">Діагональ ↗</option>
            <option value="135deg">Діагональ ↘</option>
            <option value="315deg">Діагональ ↖</option>
            <option value="225deg">Діагональ ↙</option>
          </select>
        </div>
      </div>

      <!-- Режим: ЗОБРАЖЕННЯ -->
      <div class="design-bg-group" data-bg-group="image" style="display:none;">
        <div class="design-bg-row design-bg-row--image">
          <label>URL зображення</label>

          <div class="design-bg-image-input">
            <button
              type="button"
              class="design-icon-btn"
              data-bg="imagePick"
              title="Відкрити галерею"
              aria-label="Відкрити галерею"
            >📁</button>

            <input type="text" class="design-input" data-bg="imageUrl" placeholder="https://...">
          </div>
        </div>

        <div class="design-bg-row">
          <label>Розмір</label>
          <select class="design-select" data-bg="imageSize">
            <option value="cover" selected>Cover (на весь екран)</option>
            <option value="contain">Contain</option>
            <option value="auto">Оригінал</option>
          </select>
        </div>

        <div class="design-bg-row">
          <label>Позиція</label>
          <select class="design-select" data-bg="imagePosition">
            <option value="center center" selected>По центру</option>
            <option value="top center">Зверху</option>
            <option value="bottom center">Знизу</option>
            <option value="center left">Зліва</option>
            <option value="center right">Справа</option>
            <option value="custom">Довільна</option>
</select>
        </div>

        <div class="design-bg-row is-hidden" data-bg-custompos>
          <label>Довільна позиція</label>
          <div class="design-bg-custompos">
            <div class="design-bg-row">
              <label style="min-width:64px;">Гор.</label>
              <input type="range" class="design-range" data-bg="imagePosX" min="1" max="100" step="1" value="50">
              <span class="design-range__val" data-bg-label="imagePosX">50%</span>
            </div>
            <div class="design-bg-row">
              <label style="min-width:64px;">Вер.</label>
              <input type="range" class="design-range" data-bg="imagePosY" min="1" max="100" step="1" value="50">
              <span class="design-range__val" data-bg-label="imagePosY">50%</span>
            </div>
            <div class="design-bg-row">
              <label>Перетягування</label>
              <button type="button" class="design-pill" data-bg="dragToggle">Вимкнено</button>
            </div>
          </div>
        </div>

      </div>

      <!-- Прозорість + ч/б (для фону сторінки, без впливу на контент) -->
      <div class="design-bg-group">
        <div class="design-label">Прозорість / чорно-біле</div>

        <div class="design-bg-row">
          <label>Прозорість</label>
          <input type="range" class="design-range" data-bg="bgOpacity" min="0" max="100" step="1" value="100">
          <span class="design-range-val" data-bg="bgOpacityVal">100%</span>
        </div>

        <div class="design-bg-row">
          <label>Ч/Б</label>
          <input type="range" class="design-range" data-bg="bgGrayscale" min="0" max="100" step="1" value="0">
          <span class="design-range-val" data-bg="bgGrayscaleVal">0%</span>
        </div>
      </div>

      <!-- Затемнення -->
      <div class="design-bg-group">
        <div class="design-label">Затемнення</div>

        <div class="design-bg-row">
          <label>Верх</label>
          <input type="range" class="design-range" data-bg="dimTop" min="0" max="100" step="1" value="0">
          <span class="design-range-val" data-bg="dimTopVal">0%</span>
        </div>

        <div class="design-bg-row">
          <label>Низ</label>
          <input type="range" class="design-range" data-bg="dimBottom" min="0" max="100" step="1" value="0">
          <span class="design-range-val" data-bg="dimBottomVal">0%</span>
        </div>
      </div>

      <!-- Фільтр: колір / градієнт (поверх фону) -->
      <div class="design-bg-group">
        <div class="design-label">Фільтр (колір / градієнт)</div>

        <div class="design-bg-mode design-bg-mode--filter">
          <button class="design-pill is-active" type="button" data-filter-mode="none">Немає</button>
          <button class="design-pill" type="button" data-filter-mode="color">Колір</button>
          <button class="design-pill" type="button" data-filter-mode="gradient">Градієнт</button>
        </div>

        <!-- Фільтр: Колір -->
        <div class="design-bg-filter-group" data-filter-group="color" style="display:none;">
          <div class="design-bg-row">
            <label>Колір</label>
            <input type="color" class="design-color" data-bg="filterColor" value="#000000">
            <input type="text" class="design-input" data-bg="filterColorText" value="#000000">
          </div>
        </div>

        <!-- Фільтр: Градієнт (3 кольори) -->
        <div class="design-bg-filter-group" data-filter-group="gradient" style="display:none;">
          <div class="design-bg-row">
            <label>Колір 1</label>
            <input type="color" class="design-color" data-bg="fGrad1" value="#000000">
            <input type="text" class="design-input" data-bg="fGrad1Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 2</label>
            <input type="color" class="design-color" data-bg="fGrad2" value="#000000">
            <input type="text" class="design-input" data-bg="fGrad2Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 3</label>
            <input type="color" class="design-color" data-bg="fGrad3" value="#000000">
            <input type="text" class="design-input" data-bg="fGrad3Text" value="#000000">
          </div>

          <div class="design-bg-row">
            <label>Кут</label>
            <input type="range" class="design-range" data-bg="filterAngle" min="0" max="360" step="1" value="180">
            <span class="design-range-val" data-bg="filterAngleVal">180°</span>
          </div>
        </div>

        <div class="design-bg-row">
          <label>Прозорість</label>
          <input type="range" class="design-range" data-bg="filterOpacity" min="0" max="100" step="1" value="0">
          <span class="design-range-val" data-bg="filterOpacityVal">0%</span>
        </div>

        <div class="design-subnote">
          Фільтр накладається тільки на фон (не на контент).
        </div>
      </div>
    </div>
  `;

  host.appendChild(sectionEl);

  // ---------- section collapse ----------
  const headerBtn = sectionEl.querySelector('.design-section__header');
  const bodyEl = sectionEl.querySelector('.design-section__body');
  headerBtn.addEventListener('click', () => {
    const isOpen = sectionEl.classList.toggle('is-open');
    bodyEl.style.display = isOpen ? '' : 'none';
  });

  // ---------- UI refs ----------
  const modeButtons = Array.from(sectionEl.querySelectorAll('[data-bg-mode]'));
  const groups = Array.from(sectionEl.querySelectorAll('[data-bg-group]'));

  const filterModeButtons = Array.from(sectionEl.querySelectorAll('[data-filter-mode]'));
  const filterGroups = Array.from(sectionEl.querySelectorAll('[data-filter-group]'));

  const imagePickBtn = sectionEl.querySelector('[data-bg="imagePick"]');

  const ui = {
    // base
    mode: 'color',
    color: sectionEl.querySelector('[data-bg="color"]'),
    colorText: sectionEl.querySelector('[data-bg="colorText"]'),

    gradColor1: sectionEl.querySelector('[data-bg="gradColor1"]'),
    gradColor1Text: sectionEl.querySelector('[data-bg="gradColor1Text"]'),
    gradColor2: sectionEl.querySelector('[data-bg="gradColor2"]'),
    gradColor2Text: sectionEl.querySelector('[data-bg="gradColor2Text"]'),
    gradDirection: sectionEl.querySelector('[data-bg="gradDirection"]'),

    imageUrl: sectionEl.querySelector('[data-bg="imageUrl"]'),
    imageSize: sectionEl.querySelector('[data-bg="imageSize"]'),
    imagePosition: sectionEl.querySelector('[data-bg="imagePosition"]'),
    imagePosX: sectionEl.querySelector('[data-bg="imagePosX"]'),
    imagePosXVal: sectionEl.querySelector('[data-bg-label="imagePosX"]'),
    imagePosY: sectionEl.querySelector('[data-bg="imagePosY"]'),
    imagePosYVal: sectionEl.querySelector('[data-bg-label="imagePosY"]'),
    customPosWrap: sectionEl.querySelector('[data-bg-custompos]'),
    dragToggle: sectionEl.querySelector('[data-bg="dragToggle"]'),


    // opacity & grayscale
    bgOpacity: sectionEl.querySelector('[data-bg="bgOpacity"]'),
    bgOpacityVal: sectionEl.querySelector('[data-bg="bgOpacityVal"]'),
    bgGrayscale: sectionEl.querySelector('[data-bg="bgGrayscale"]'),
    bgGrayscaleVal: sectionEl.querySelector('[data-bg="bgGrayscaleVal"]'),

    // dimming (top/bottom)
    dimTop: sectionEl.querySelector('[data-bg="dimTop"]'),
    dimTopVal: sectionEl.querySelector('[data-bg="dimTopVal"]'),
    dimBottom: sectionEl.querySelector('[data-bg="dimBottom"]'),
    dimBottomVal: sectionEl.querySelector('[data-bg="dimBottomVal"]'),

    // filter
    filterMode: 'none',
    filterColor: sectionEl.querySelector('[data-bg="filterColor"]'),
    filterColorText: sectionEl.querySelector('[data-bg="filterColorText"]'),
    fGrad1: sectionEl.querySelector('[data-bg="fGrad1"]'),
    fGrad1Text: sectionEl.querySelector('[data-bg="fGrad1Text"]'),
    fGrad2: sectionEl.querySelector('[data-bg="fGrad2"]'),
    fGrad2Text: sectionEl.querySelector('[data-bg="fGrad2Text"]'),
    fGrad3: sectionEl.querySelector('[data-bg="fGrad3"]'),
    fGrad3Text: sectionEl.querySelector('[data-bg="fGrad3Text"]'),
    filterAngle: sectionEl.querySelector('[data-bg="filterAngle"]'),
    filterAngleVal: sectionEl.querySelector('[data-bg="filterAngleVal"]'),
    filterOpacity: sectionEl.querySelector('[data-bg="filterOpacity"]'),
    filterOpacityVal: sectionEl.querySelector('[data-bg="filterOpacityVal"]')
  };

  // ---------- helpers ----------
  function normalizeHex(hex) {
    if (!hex) return '#000000';
    let h = String(hex).trim();
    if (h[0] === '#') h = h.slice(1);
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    if (h.length !== 6) return '#000000';
    return '#' + h.toLowerCase();
  }

  function hexToRgba(hex, alpha01) {
    const a = typeof alpha01 === 'number' ? Math.max(0, Math.min(1, alpha01)) : 1;
    const norm = normalizeHex(hex).slice(1);
    const r = parseInt(norm.slice(0, 2), 16) || 0;
    const g = parseInt(norm.slice(2, 4), 16) || 0;
    const b = parseInt(norm.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function setChipActive(list, activeEl) {
    list.forEach(btn => btn.classList.toggle('is-active', btn === activeEl));
  }

  function setMode(mode) {
    ui.mode = mode;
    const btn = modeButtons.find(b => b.getAttribute('data-bg-mode') === mode);
    if (btn) setChipActive(modeButtons, btn);
    updateGroupsVisibility(mode);
  }

  function setFilterMode(mode) {
    ui.filterMode = mode;
    const btn = filterModeButtons.find(b => b.getAttribute('data-filter-mode') === mode);
    if (btn) setChipActive(filterModeButtons, btn);
    updateFilterGroupsVisibility(mode);
  }

  function updateGroupsVisibility(mode) {
    groups.forEach(group => {
      const gMode = group.getAttribute('data-bg-group');
      if (!gMode) return;
      group.style.display = gMode === mode ? 'flex' : 'none';
    });
  }

  function updateFilterGroupsVisibility(mode) {
    filterGroups.forEach(group => {
      const gMode = group.getAttribute('data-filter-group');
      if (!gMode) return;
      group.style.display = gMode === mode ? 'flex' : 'none';
    });
  }

  function updateRangeLabels() {

    const op = parseInt(ui.bgOpacity?.value || '100', 10);
    const gs = parseInt(ui.bgGrayscale?.value || '0', 10);
    const dt = parseInt(ui.dimTop?.value || '0', 10);
    const db = parseInt(ui.dimBottom?.value || '0', 10);
    const fo = parseInt(ui.filterOpacity?.value || '0', 10);
    const fa = parseInt(ui.filterAngle?.value || '180', 10);
    const px = parseInt(ui.imagePosX?.value || '50', 10);
    const py = parseInt(ui.imagePosY?.value || '50', 10);

    if (ui.bgOpacityVal) ui.bgOpacityVal.textContent = `${op}%`;
    if (ui.bgGrayscaleVal) ui.bgGrayscaleVal.textContent = `${gs}%`;
    if (ui.dimTopVal) ui.dimTopVal.textContent = `${dt}%`;
    if (ui.dimBottomVal) ui.dimBottomVal.textContent = `${db}%`;
    if (ui.filterOpacityVal) ui.filterOpacityVal.textContent = `${fo}%`;
    if (ui.filterAngleVal) ui.filterAngleVal.textContent = `${fa}°`;
    if (ui.imagePosXVal) ui.imagePosXVal.textContent = `${px}%`;
    if (ui.imagePosYVal) ui.imagePosYVal.textContent = `${py}%`;
  }

  // ✅ превʼю (іконка/мініатюра) — як у віджеті "Заливка"
  function updateImagePickButtonPreview(url) {
    if (!imagePickBtn) return;
    if (url) {
      imagePickBtn.textContent = '';
      imagePickBtn.style.backgroundImage = `url("${url}")`;
      imagePickBtn.title = 'Змінити картинку (галерея)';
    } else {
      imagePickBtn.style.backgroundImage = '';
      imagePickBtn.textContent = '📁';
      imagePickBtn.title = 'Відкрити галерею';
    }
  }

  // ✅ Відкриття галереї в pickerMode і вставка URL в інпут + застосування
  async function pickBackgroundFromGallery() {
    openGalleryModal({
      cat: 'images',
      pickerMode: true,
      view: 'big',
      onPick: async ({ cat, folderId, itemId }) => {
        try {
          const items = await galListItems(cat, folderId);
          const it = (items || []).find(x => x && x.id === itemId);
          if (!it) return;

          const _bgObjectUrl = await galMakeObjectUrl(it);

          // 1) Режим "Зображення"
          setMode('image');

          // 2) Заповнюємо URL
          if (ui.imageUrl) ui.imageUrl.value = _bgObjectUrl;

          // 3) Превʼю
          updateImagePickButtonPreview(_bgObjectUrl);

          // 4) Застосувати
          apply();
        } catch (err) {
          console.error('[PageBackgroundWidget] pickBackgroundFromGallery error:', err);
        }
      }
    });
  }

  function getStateFromUI() {
    updateRangeLabels();

    const state = {
      mode: ui.mode,

      // base
      color: normalizeHex(ui.color?.value || ui.colorText?.value || '#111827'),
      gradColor1: normalizeHex(ui.gradColor1?.value || ui.gradColor1Text?.value || '#111827'),
      gradColor2: normalizeHex(ui.gradColor2?.value || ui.gradColor2Text?.value || '#020617'),
      gradDirection: ui.gradDirection?.value || 'to bottom',

      imageUrl: (ui.imageUrl?.value || '').trim(),
      imageSize: ui.imageSize?.value || 'cover',
      imagePosition: ui.imagePosition?.value || 'center center',

      
      imagePosX: parseInt(ui.imagePosX?.value || '50', 10),
      imagePosY: parseInt(ui.imagePosY?.value || '50', 10),
      dragEnabled: (ui.dragToggle?.getAttribute('data-on') === '1'),
// bg layer controls
      bgOpacity: parseInt(ui.bgOpacity?.value || '100', 10),
      bgGrayscale: parseInt(ui.bgGrayscale?.value || '0', 10),

      // dimming
      dimTop: parseInt(ui.dimTop?.value || '0', 10),
      dimBottom: parseInt(ui.dimBottom?.value || '0', 10),

      // filter
      filterMode: ui.filterMode || 'none',
      filterColor: normalizeHex(ui.filterColor?.value || ui.filterColorText?.value || '#000000'),
      fGrad1: normalizeHex(ui.fGrad1?.value || ui.fGrad1Text?.value || '#000000'),
      fGrad2: normalizeHex(ui.fGrad2?.value || ui.fGrad2Text?.value || '#000000'),
      fGrad3: normalizeHex(ui.fGrad3?.value || ui.fGrad3Text?.value || '#000000'),
      filterAngle: parseInt(ui.filterAngle?.value || '180', 10),
      filterOpacity: parseInt(ui.filterOpacity?.value || '0', 10)
    };

    // clamp
    state.bgOpacity = Math.max(0, Math.min(100, state.bgOpacity));
    state.bgGrayscale = Math.max(0, Math.min(100, state.bgGrayscale));
    state.filterOpacity = Math.max(0, Math.min(100, state.filterOpacity));
    state.filterAngle = Math.max(0, Math.min(360, state.filterAngle));

    
    state.imagePosX = Math.max(0, Math.min(100, parseInt(state.imagePosX||50,10)));
    state.imagePosY = Math.max(0, Math.min(100, parseInt(state.imagePosY||50,10)));
return state;
  }

  function applyToUI(state) {
    if (!state) return;

    // mode
    setMode(state.mode || 'color');

    // base values
    if (ui.color) ui.color.value = normalizeHex(state.color || '#111827');
    if (ui.colorText) ui.colorText.value = normalizeHex(state.color || '#111827');

    if (ui.gradColor1) ui.gradColor1.value = normalizeHex(state.gradColor1 || '#111827');
    if (ui.gradColor1Text) ui.gradColor1Text.value = normalizeHex(state.gradColor1 || '#111827');
    if (ui.gradColor2) ui.gradColor2.value = normalizeHex(state.gradColor2 || '#020617');
    if (ui.gradColor2Text) ui.gradColor2Text.value = normalizeHex(state.gradColor2 || '#020617');
    if (ui.gradDirection) ui.gradDirection.value = state.gradDirection || 'to bottom';

    if (ui.imageUrl) ui.imageUrl.value = state.imageUrl || '';
    if (ui.imageSize) ui.imageSize.value = state.imageSize || 'cover';
    if (ui.imagePosition) ui.imagePosition.value = state.imagePosition || 'center center';

    // custom pos
    if (ui.imagePosX) ui.imagePosX.value = String(state.imagePosX ?? 50);
    if (ui.imagePosY) ui.imagePosY.value = String(state.imagePosY ?? 50);
    if (ui.imagePosXVal) ui.imagePosXVal.textContent = `${ui.imagePosX?.value || 50}%`;
    if (ui.imagePosYVal) ui.imagePosYVal.textContent = `${ui.imagePosY?.value || 50}%`;

    const isCustom = (ui.imagePosition?.value === 'custom');
    if (ui.customPosWrap) ui.customPosWrap.classList.toggle('is-hidden', !isCustom);

    setDragEnabled(!!state.dragEnabled);


    // bg layer
    if (ui.bgOpacity) ui.bgOpacity.value = String(state.bgOpacity ?? 100);
    if (ui.bgGrayscale) ui.bgGrayscale.value = String(state.bgGrayscale ?? 0);
    // dimming
    if (ui.dimTop) ui.dimTop.value = String(state.dimTop ?? 0);
    if (ui.dimTopVal) ui.dimTopVal.textContent = `${state.dimTop ?? 0}%`;
    if (ui.dimBottom) ui.dimBottom.value = String(state.dimBottom ?? 0);
    if (ui.dimBottomVal) ui.dimBottomVal.textContent = `${state.dimBottom ?? 0}%`;

    // filter
    setFilterMode(state.filterMode || 'none');

    if (ui.filterColor) ui.filterColor.value = normalizeHex(state.filterColor || '#000000');
    if (ui.filterColorText) ui.filterColorText.value = normalizeHex(state.filterColor || '#000000');

    if (ui.fGrad1) ui.fGrad1.value = normalizeHex(state.fGrad1 || '#000000');
    if (ui.fGrad1Text) ui.fGrad1Text.value = normalizeHex(state.fGrad1 || '#000000');
    if (ui.fGrad2) ui.fGrad2.value = normalizeHex(state.fGrad2 || '#000000');
    if (ui.fGrad2Text) ui.fGrad2Text.value = normalizeHex(state.fGrad2 || '#000000');
    if (ui.fGrad3) ui.fGrad3.value = normalizeHex(state.fGrad3 || '#000000');
    if (ui.fGrad3Text) ui.fGrad3Text.value = normalizeHex(state.fGrad3 || '#000000');

    if (ui.filterAngle) ui.filterAngle.value = String(state.filterAngle ?? 180);
    if (ui.filterOpacity) ui.filterOpacity.value = String(state.filterOpacity ?? 0);

    updateRangeLabels();
    updateImagePickButtonPreview(state.imageUrl || '');
  }

  function applyToCanvas(state) {
    const siteCanvas = document.getElementById('site-canvas');
    if (!siteCanvas || !state) return;

    // прибираємо legacy inline-стилі (щоб не конфліктувало з псевдо-шарами)
    siteCanvas.style.backgroundImage = '';
    siteCanvas.style.backgroundColor = '';
    siteCanvas.style.backgroundSize = '';
    siteCanvas.style.backgroundPosition = '';
    siteCanvas.style.backgroundRepeat = '';

    // ---- base layer (колір + окремо картинка/градієнт) ----
    const baseColor = state.color || state.bgColor || '#0b1220';
    let bgImage = 'none';

    if (state.mode === 'gradient') {
      const c1 = state.gradColor1 || '#111827';
      const c2 = state.gradColor2 || '#020617';
      const dir = state.gradDirection || 'to bottom';
      bgImage = `linear-gradient(${dir}, ${c1}, ${c2})`;
    } else if (state.mode === 'image') {
      const url = state.imageUrl || '';
      bgImage = url ? `url("${url}")` : 'none';
    } else {
      bgImage = 'none';
    }

    siteCanvas.style.setProperty('--st-page-bg-color', baseColor);
    siteCanvas.style.setProperty('--st-page-bg-image', bgImage);
    siteCanvas.style.setProperty('--st-page-bg-size', state.imageSize || 'cover');
        const pos = (state.imagePosition === 'custom')
      ? `${state.imagePosX ?? 50}% ${state.imagePosY ?? 50}%`
      : (state.imagePosition || 'center center');
    siteCanvas.style.setProperty('--st-page-bg-position', pos);
    siteCanvas.style.setProperty('--st-page-bg-repeat', 'no-repeat');

    // opacity / grayscale
    const op01 = Math.max(0, Math.min(1, (state.bgOpacity ?? 100) / 100));
    const gs01 = Math.max(0, Math.min(1, (state.bgGrayscale ?? 0) / 100));
    siteCanvas.style.setProperty('--st-page-bg-img-opacity', String(op01));
    siteCanvas.style.setProperty('--st-page-bg-img-gray', String(gs01));

    // overlays
    const dimTop = Math.max(0, Math.min(1, (state.dimTop ?? 0) / 100));
    const dimBottom = Math.max(0, Math.min(1, (state.dimBottom ?? 0) / 100));
    siteCanvas.style.setProperty('--st-page-dim-top', String(dimTop));
    siteCanvas.style.setProperty('--st-page-dim-bottom', String(dimBottom));


    // filter
    const fAlpha = Math.max(0, Math.min(1, (state.filterOpacity ?? 0) / 100));
    let filterLayer = 'none';

    if (state.filterMode === 'color' && fAlpha > 0) {
      const c = state.filterColor || '#000000';
      const rgba = hexToRgba(c, fAlpha);
      filterLayer = `linear-gradient(${rgba}, ${rgba})`;
    }

    if (state.filterMode === 'gradient' && fAlpha > 0) {
      const a = state.filterAngle ?? 180;
      const c1 = hexToRgba(state.fGrad1 || '#000000', fAlpha);
      const c2 = hexToRgba(state.fGrad2 || '#000000', fAlpha);
      const c3 = hexToRgba(state.fGrad3 || '#000000', fAlpha);
      filterLayer = `linear-gradient(${a}deg, ${c1}, ${c2}, ${c3})`;
    }

    siteCanvas.style.setProperty('--st-page-filter', filterLayer);
  }

  
  // ---------- custom position dragging ----------
  let dragOn = false;
  let dragActive = false;

  function setDragEnabled(on) {
    dragOn = !!on;
    if (ui.dragToggle) {
      ui.dragToggle.setAttribute('data-on', dragOn ? '1' : '0');
      ui.dragToggle.textContent = dragOn ? 'Увімкнено' : 'Вимкнено';
      ui.dragToggle.classList.toggle('is-active', dragOn);
    }
    // When turning off, stop active drag
    if (!dragOn) dragActive = false;
  }

  function isCustomPosMode() {
    return (ui.mode === 'image') && (ui.imagePosition?.value === 'custom');
  }

  function pointerToPercents(ev, el) {
    const r = el.getBoundingClientRect();
    const x = (ev.clientX - r.left) / Math.max(1, r.width);
    const y = (ev.clientY - r.top) / Math.max(1, r.height);
    const px = Math.max(1, Math.min(100, Math.round(x * 100)));
    const py = Math.max(1, Math.min(100, Math.round(y * 100)));
    return { px, py };
  }

  function attachCanvasDrag() {
    const canvas = document.getElementById('site-canvas');
    if (!canvas) return;

    let dragStart = null;

    const end = () => {
      dragActive = false;
      dragStart = null;
    };

    canvas.addEventListener('pointerdown', (ev) => {
      if (!dragOn) return;
      if (!isCustomPosMode()) return;

      dragActive = true;
      canvas.setPointerCapture?.(ev.pointerId);

      const r = canvas.getBoundingClientRect();
      const startX = parseInt(ui.imagePosX?.value || '50', 10);
      const startY = parseInt(ui.imagePosY?.value || '50', 10);

      dragStart = {
        clientX: ev.clientX,
        clientY: ev.clientY,
        width: Math.max(1, r.width),
        height: Math.max(1, r.height),
        startX,
        startY,
      };

      ev.preventDefault();
    });

    canvas.addEventListener('pointermove', (ev) => {
      if (!dragActive) return;
      if (!dragOn) return;
      if (!isCustomPosMode()) return;
      if (!dragStart) return;

      const dx = ((ev.clientX - dragStart.clientX) / dragStart.width) * 100;
      const dy = ((ev.clientY - dragStart.clientY) / dragStart.height) * 100;

      let px = Math.round(dragStart.startX - dx);
      let py = Math.round(dragStart.startY - dy);

      // Clamp: never reach 0 (use 1..100)
      px = Math.max(1, Math.min(100, px));
      py = Math.max(1, Math.min(100, py));

      if (ui.imagePosX) ui.imagePosX.value = String(px);
      if (ui.imagePosY) ui.imagePosY.value = String(py);

      // Update labels immediately (not only via delegated input)
      if (ui.imagePosXVal) ui.imagePosXVal.textContent = `${px}%`;
      if (ui.imagePosYVal) ui.imagePosYVal.textContent = `${py}%`;

      updateRangeLabels();
      apply();
      ev.preventDefault();
    });

  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('lostpointercapture', end);
// canvas.addEventListener('pointerleave', end); // прибрати
    
  }
function saveToState(state) {
    siteState.page = siteState.page || {};
    siteState.page.background = { ...(siteState.page.background || {}), ...state };
  }

  function apply() {
    const state = getStateFromUI();
    saveToState(state);
    applyToCanvas(state);
  }

  // ---------- events ----------
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setMode(btn.getAttribute('data-bg-mode') || 'color');
      apply();
    });
  });

  filterModeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      setFilterMode(btn.getAttribute('data-filter-mode') || 'none');
      apply();
    });
  });

  
  // drag toggle
  if (ui.dragToggle) {
    ui.dragToggle.addEventListener('click', () => {
      setDragEnabled(!(ui.dragToggle.getAttribute('data-on') === '1'));
      apply();
    });
  }
// inputs (base + filter + ranges)
  sectionEl.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    // sync hex text <-> color inputs
    const syncPairs = [
      ['color', 'colorText'],
      ['gradColor1', 'gradColor1Text'],
      ['gradColor2', 'gradColor2Text'],
      ['filterColor', 'filterColorText'],
      ['fGrad1', 'fGrad1Text'],
      ['fGrad2', 'fGrad2Text'],
      ['fGrad3', 'fGrad3Text']
    ];

    for (const [a, b] of syncPairs) {
      const aEl = sectionEl.querySelector(`[data-bg="${a}"]`);
      const bEl = sectionEl.querySelector(`[data-bg="${b}"]`);
      if (!aEl || !bEl) continue;

      if (t === aEl) {
        if (bEl instanceof HTMLInputElement) bEl.value = (aEl instanceof HTMLInputElement) ? aEl.value : bEl.value;
      }
      if (t === bEl) {
        if (aEl instanceof HTMLInputElement) aEl.value = (bEl instanceof HTMLInputElement) ? bEl.value : aEl.value;
      }
    }

    updateRangeLabels();

    // preview button if url changed
    if (t === ui.imageUrl) updateImagePickButtonPreview(ui.imageUrl.value.trim());
    // custom position UI
    if (t === ui.imagePosition && ui.customPosWrap) {
      const isCustom = (ui.imagePosition.value === 'custom');
      ui.customPosWrap.classList.toggle('is-hidden', !isCustom);
    }

    // update drag toggle label state on any input, just in case
    if (t === ui.imagePosX || t === ui.imagePosY) {
      // labels already updated via updateRangeLabels()
    }


    apply();
  });

  // checkboxes
  sectionEl.addEventListener('change', (e) => {
    const t = e.target;
    if (t === ui.dimTop || t === ui.dimBottom) apply();
  });

  // gallery pick
  if (imagePickBtn) {
    imagePickBtn.addEventListener('click', () => {
      pickBackgroundFromGallery();
    });
  }

  // ---------- init ----------
  const initialState =
    (siteState?.page && siteState.page.background)
      ? siteState.page.background
      : {
          mode: 'color',
          color: '#111827',
          gradColor1: '#111827',
          gradColor2: '#020617',
          gradDirection: 'to bottom',
          imageUrl: '',
          imageSize: 'cover',
          imagePosition: 'center center',
          imagePosX: 50,
          imagePosY: 50,
          dragEnabled: false,
          bgOpacity: 100,
          bgGrayscale: 0,
          dimTop: 0,
          dimBottom: 0,
          filterMode: 'none',
          filterColor: '#000000',
          fGrad1: '#000000',
          fGrad2: '#000000',
          fGrad3: '#000000',
          filterAngle: 180,
          filterOpacity: 0
        };

  applyToUI(initialState);
  saveToState(initialState);
  applyToCanvas(initialState);
  attachCanvasDrag();
  setDragEnabled(!!initialState.dragEnabled);
}