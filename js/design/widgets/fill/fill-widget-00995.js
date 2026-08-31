// ================================
// Тимчасовий state для guides (FIX)
// ================================
const guidesState = {
  enabled: false,
  items: []
};



// js/design/widgets/fill/fill-widget.js
// 00995: Fill adds independent block-surface transparency + backdrop blur, alongside element opacity/blur, while preserving text and outer border.
// Main live preview remains visual-only; final/selection-loss commit is JSON-primary.
// Віджет "Заливка" — фон / градієнт / картинка для блоків, секцій і текстових контейнерів.

import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
import { galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';

// ✅ Last selection bridge (canvas -> design widgets)
let __stLastSelection = { type: null, element: null };

document.addEventListener("st:selection-changed", (e) => {
  const d = e && e.detail ? e.detail : null;
  if (!d) return;

  // type: "header" | "block" | "section" ...
  __stLastSelection = {
    type: d.type || null,
    element: d.element || null
  };
});


// ================================
// Canvas scroll sync for "fixed" bg
// ================================
function ensureCanvasScrollSync() {
  if (window.__ST_CANVAS_BG_FIXED_SYNC__) return;
  window.__ST_CANVAS_BG_FIXED_SYNC__ = true;

  const scroller = document.querySelector('.canvas__scroll');
  if (!scroller) return;

  const update = () => {
    const y = scroller.scrollTop || 0;
    const x = scroller.scrollLeft || 0;
    scroller.style.setProperty('--st-canvas-scroll-y', `${y}px`);
    scroller.style.setProperty('--st-canvas-scroll-x', `${x}px`);
  };

  scroller.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}







export function initFillWidget(host, getSelection) {
  if (!host) return;

  // 🔥 Внутрішній мультивибір (Ctrl+клік по canvas)
  let manualTargets = [];
  // ✅ Останні реальні canvas/header/footer-таргети. Потрібно для Галереї:
  // під час кліків у модальному вікні активний стан інколи може бути вже нечитабельним,
  // тому ручне застосування фону має стабільний fallback.
  let lastStableFillTargets = [];
  // [00779][FILL TARGET SESSION]
  // Native color inputs fire the final `change` on blur. If the user clicks another
  // canvas element to close the picker, selection may already point to that new element.
  // The fill edit session freezes the original target for the current color edit, so
  // clicking a section after editing a container only selects the section and does not
  // repaint it with the container color.
  let activeFillEditSessionTargets00779_ = [];
  let activeFillEditSessionStartedAt00779_ = 0;
  
  // ⚠️ Тримаємо objectURL для фону, щоб не відвалювався backgroundImage.
  // Ревокаємо тільки коли вибираємо іншу картинку.
  let _bgObjectUrl = null;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Заливка</span>
        <span class="design-section__header-subtitle">

        </span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <div class="design-field">
        <div class="design-field__label">Режим заливки</div>
        <div class="design-fill-modes" data-fill-modes>
          <button type="button" class="design-pill is-active" data-fill-mode="color">Колір</button>
          <button type="button" class="design-pill" data-fill-mode="gradient">Градієнт</button>
          <button type="button" class="design-pill" data-fill-mode="image">Картинка</button>
        </div>
      </div>

      <!-- КОЛІР -->
      <div class="design-field" data-fill-group="color">
        <div class="design-field__label">Суцільний колір</div>
        <div class="design-fill-row">
          <input type="color" data-fill="color" value="#0f172a" />
          <input type="text" class="design-input" data-fill="colorText" value="#0f172a" placeholder="#0f172a" />
        </div>
      </div>

      <!-- ГРАДІЄНТ -->
      <div class="design-field" data-fill-group="gradient" hidden>
        <div class="design-field__label">Градієнт</div>
        <div class="design-fill-row">
          <label class="design-fill-label">1-й колір</label>
          <input type="color" data-fill="gradColor1" value="#0f172a" />
          <input type="text" class="design-input" data-fill="gradColor1Text" value="#0f172a" />
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">2-й колір</label>
          <input type="color" data-fill="gradColor2" value="#1e293b" />
          <input type="text" class="design-input" data-fill="gradColor2Text" value="#1e293b" />
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">3-й колір</label>
          <input type="color" data-fill="gradColor3" value="#334155" />
          <input type="text" class="design-input" data-fill="gradColor3Text" value="#334155" />
        </div>


        <div class="design-fill-row">
          <label class="design-fill-label">Напрямок (0–360°)</label>
          <div class="design-fill-extra-controls">
            <input type="range" min="0" max="360" step="1" value="90" class="design-slider" data-fill="gradAngleRange" />
            <input type="number" min="0" max="360" step="1" value="90" class="design-number" data-fill="gradAngleNumber" />
          </div>
        </div>
      </div>

      <!-- КАРТИНКА -->
      <div class="design-field" data-fill-group="image" hidden>
        <div class="design-field__label">Фонова картинка</div>

        <!-- ✅ Превʼю-кнопка + адресний рядок -->


        <div class="design-fill-row" style="align-items:center; gap:10px;">
          <button
            type="button"
            class="design-icon-btn"
            data-fill="imagePick"
            title="Відкрити галерею"
            style="
              width:34px;height:34px;flex:0 0 34px;
              border-radius:10px;
              border:1px solid rgba(255,255,255,0.10);
              background: rgba(255,255,255,0.04);
              background-size: cover;
              background-position: center;
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;
            "
          >
            📁
          </button>

          <input type="text" class="design-input" data-fill="imageUrl" placeholder="https://..." />
        </div>

        <div class="design-fill-row">
          <label class="design-fill-label">Розмір</label>
          <select class="design-select" data-fill="imageSize">
            <option value="cover" selected>Розтягнути за елементом</option>
            <option value="contain">Вмістити</option>
            <option value="auto">Оригінал</option>
            <option value="custom">Довільний</option>
          </select>
        </div>

        <div class="design-fill-row" data-fill-customsize hidden>
          <label class="design-fill-label">Довільний розмір</label>
          <div class="design-fill-customsize">
            <div class="design-fill-row">
              <label class="design-fill-label" style="min-width:54px;">Масш.</label>
              <input type="range" min="0" max="200" step="1" value="100" class="design-slider" data-fill="imageScale" />
              <span class="design-range__val" data-fill-label="imageScale">100%</span>
            </div>
            <div class="design-fill-row">
              <label class="design-fill-label" style="min-width:54px;">Шир.</label>
              <input type="range" min="0" max="200" step="1" value="100" class="design-slider" data-fill="imageScaleX" />
              <span class="design-range__val" data-fill-label="imageScaleX">100%</span>
            </div>
            <div class="design-fill-row">
              <label class="design-fill-label" style="min-width:54px;">Вис.</label>
              <input type="range" min="0" max="200" step="1" value="100" class="design-slider" data-fill="imageScaleY" />
              <span class="design-range__val" data-fill-label="imageScaleY">100%</span>
            </div>
          </div>
          <div class="design-subnote" style="margin-top:6px;">
            100% = оригінал. Масштаб множиться на ширину/висоту: X=scale·width, Y=scale·height.
          </div>
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">Позиція</label>
          <select class="design-select" data-fill="imagePosition">
            <option value="center center" selected>По центру</option>
            <option value="top center">Зверху</option>
            <option value="bottom center">Знизу</option>
            <option value="center left">Зліва</option>
            <option value="center right">Справа</option>
            <option value="custom">Довільна</option>
          </select>
        </div>

        <div class="design-fill-row" data-fill-custompos hidden>
          <label class="design-fill-label">Довільна позиція</label>
          <div class="design-fill-custompos">
            <div class="design-fill-row">
              <label class="design-fill-label" style="min-width:54px;">Гор.</label>
              <input type="range" min="1" max="100" step="1" value="50" class="design-slider" data-fill="imagePosX" />
              <span class="design-range__val" data-fill-label="imagePosX">50%</span>
            </div>
            <div class="design-fill-row">
              <label class="design-fill-label" style="min-width:54px;">Вер.</label>
              <input type="range" min="1" max="100" step="1" value="50" class="design-slider" data-fill="imagePosY" />
              <span class="design-range__val" data-fill-label="imagePosY">50%</span>
            </div>
          </div>
        </div>
      </div>

      
        <div class="design-fill-row">
          <label class="design-fill-label">Фон при скролі</label>
          <label style="display:flex; align-items:center; gap:8px;">
            <input type="checkbox" data-fill="imageCanvasFixed" />
            <span style="font-size:12px; color:var(--clr-text-mute);">Фіксувати відносно canvas</span>
          </label>
        </div>

<!-- Прозорість + чорно-білий -->
      <div class="design-field">
        <div class="design-field__label">Додатково</div>
        <div class="design-field__row design-fill-extra">
          <div class="design-fill-extra-group">
            <span class="design-fill-extra-label">Прозорість фону</span>
            <div class="design-fill-extra-controls">
              <input type="range" min="0" max="100" step="1" value="100" class="design-slider" data-fill="opacityRange" />
              <input type="number" min="0" max="100" step="1" value="100" class="design-number" data-fill="opacityNumber" />
            </div>
          </div>
          <div class="design-fill-extra-group design-fill-block-surface-fx-group">
            <span class="design-fill-extra-label">Прозорість блока</span>
            <div class="design-fill-extra-controls">
              <input type="range" min="0" max="100" step="1" value="0" class="design-slider" data-fill="blockTransparencyRange" />
              <input type="number" min="0" max="100" step="1" value="0" class="design-number" data-fill="blockTransparencyNumber" />
            </div>
          </div>
          <div class="design-fill-extra-group design-fill-block-surface-fx-group">
            <span class="design-fill-extra-label">Розмитість блока</span>
            <div class="design-fill-extra-controls">
              <input type="range" min="0" max="100" step="1" value="0" class="design-slider" data-fill="blockBlurRange" />
              <input type="number" min="0" max="100" step="1" value="0" class="design-number" data-fill="blockBlurNumber" />
            </div>
          </div>
          <div class="design-fill-extra-group design-fill-element-fx-group">
            <span class="design-fill-extra-label">Прозорість елемента</span>
            <div class="design-fill-extra-controls">
              <input type="range" min="0" max="100" step="1" value="100" class="design-slider" data-fill="elementOpacityRange" />
              <input type="number" min="0" max="100" step="1" value="100" class="design-number" data-fill="elementOpacityNumber" />
            </div>
          </div>
          <div class="design-fill-extra-group design-fill-element-fx-group">
            <span class="design-fill-extra-label">Розмитість елемента</span>
            <div class="design-fill-extra-controls">
              <input type="range" min="0" max="100" step="1" value="0" class="design-slider" data-fill="elementBlurRange" />
              <input type="number" min="0" max="100" step="1" value="0" class="design-number" data-fill="elementBlurNumber" />
            </div>
          </div>
          <div class="design-fill-extra-group">
            <span class="design-fill-extra-label">Ч/Б фону</span>
            <div class="design-fill-extra-controls">
              <input type="range" min="0" max="100" step="1" value="0" class="design-slider" data-fill="grayRange" />
              <input type="number" min="0" max="100" step="1" value="0" class="design-number" data-fill="grayNumber" />
            </div>
          </div>
        </div>
        <div class="design-subnote">
          «Прозорість фону» керує заливкою. «Прозорість блока»: 0% — фон блока видимий, 100% — фон блока повністю прозорий, але текст і рамка не змінюються. «Розмитість блока» розмиває банер/фон позаду контейнера, не розмиваючи текст. «Прозорість елемента» та «Розмитість елемента» окремо керують усім вмістом елемента. Для розмиття 5% = легкий ефект.
        </div>
      </div>


      
      <!-- Кольоровий фільтр (як у фоні сторінки) -->
      <div class="design-field">
        <div class="design-field__label">Фільтр (колір / градієнт)</div>

        <div class="design-pillbar" style="margin-bottom:10px;">
          <button type="button" class="design-pill is-active" data-filter-mode="off">Вимк.</button>
          <button type="button" class="design-pill" data-filter-mode="color">Колір</button>
          <button type="button" class="design-pill" data-filter-mode="gradient">Градієнт</button>
        </div>

        <!-- Фільтр: Колір -->
        <div class="design-bg-filter-group" data-filter-group="color" style="display:none;">
          <div class="design-bg-row">
            <label>Колір</label>
            <input type="color" class="design-color" data-fill="filterColor" value="#000000">
            <input type="text" class="design-input" data-fill="filterColorText" value="#000000">
          </div>
        </div>

        <!-- Фільтр: Градієнт (3 кольори) -->
        <div class="design-bg-filter-group" data-filter-group="gradient" style="display:none;">
          <div class="design-bg-row">
            <label>Колір 1</label>
            <input type="color" class="design-color" data-fill="filterGradColor1" value="#000000">
            <input type="text" class="design-input" data-fill="filterGradColor1Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 2</label>
            <input type="color" class="design-color" data-fill="filterGradColor2" value="#000000">
            <input type="text" class="design-input" data-fill="filterGradColor2Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 3</label>
            <input type="color" class="design-color" data-fill="filterGradColor3" value="#000000">
            <input type="text" class="design-input" data-fill="filterGradColor3Text" value="#000000">
          </div>

          <div class="design-bg-row">
            <label>Кут (0–360°)</label>
            <input type="range" class="design-range" data-fill="filterAngleRange" min="0" max="360" step="1" value="90">
            <span class="design-range-val" data-fill-label="filterAngle">90°</span>
          </div>
        </div>

        <div class="design-bg-row">
          <label>Прозорість фільтра</label>
          <input type="range" class="design-range" data-fill="filterOpacityRange" min="0" max="100" step="1" value="0">
          <span class="design-range-val" data-fill-label="filterOpacity">0%</span>
          <input type="number" class="design-number" data-fill="filterOpacityNumber" min="0" max="100" step="1" value="0" style="width:70px;">
        </div>
      </div>
<div class="design-field">
        <div class="design-field__row design-fill-apply-row">
          <button type="button" class="design-button" data-fill="apply">
            Застосувати до вибраних
          </button>
          <button type="button" class="design-pill" data-fill="resetStyles" title="Скинути стилі заливки">Скинути стилі</button>
          <span class="design-fill-target" data-fill="targetSummary">Немає вибраних елементів</span>
        </div>
      </div>
    </div>
  `;

  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }
  host.appendChild(sectionEl);

  // ---------- helpers ----------
  function normalizeHex(hex) {
    if (!hex) return '#000000';
    let h = String(hex).trim();
    if (h[0] === '#') h = h.slice(1);
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    if (h.length !== 6) return '#000000';
    return '#' + h.toLowerCase();
  }

  function hexToRgba(hex, alpha) {
    const a = typeof alpha === 'number' ? Math.max(0, Math.min(1, alpha)) : 1;
    const norm = normalizeHex(hex).slice(1);
    const r = parseInt(norm.slice(0, 2), 16) || 0;
    const g = parseInt(norm.slice(2, 4), 16) || 0;
    const b = parseInt(norm.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function rgbaToHexAlpha(str) {
    if (!str) return { hex: '#000000', alpha: 1 };
    const m = str.replace(/\s+/g, '').match(/^rgba?\((\d+),(\d+),(\d+)(?:,(\d*\.?\d+))?\)$/i);
    if (!m) return { hex: '#000000', alpha: 1 };
    const r = parseInt(m[1], 10) || 0;
    const g = parseInt(m[2], 10) || 0;
    const b = parseInt(m[3], 10) || 0;
    const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
    const toHex = (v) => v.toString(16).padStart(2, '0');
    return {
      hex: '#' + toHex(r) + toHex(g) + toHex(b),
      alpha: Math.max(0, Math.min(1, isNaN(a) ? 1 : a))
    };
  }

  // ---------- UI refs ----------
  const modeButtons   = Array.from(sectionEl.querySelectorAll('[data-fill-mode]'));
  const groups        = Array.from(sectionEl.querySelectorAll('[data-fill-group]'));
  const modeContainer = sectionEl.querySelector('[data-fill-modes]');
  const targetSummary = sectionEl.querySelector('[data-fill="targetSummary"]');
  const applyBtn      = sectionEl.querySelector('[data-fill="apply"]');
  const resetBtn     = sectionEl.querySelector("[data-fill=\"resetStyles\"]");

  const opacityRange  = sectionEl.querySelector('[data-fill="opacityRange"]');
  const opacityNumber = sectionEl.querySelector('[data-fill="opacityNumber"]');
  const blockTransparencyRange  = sectionEl.querySelector('[data-fill="blockTransparencyRange"]');
  const blockTransparencyNumber = sectionEl.querySelector('[data-fill="blockTransparencyNumber"]');
  const blockBlurRange          = sectionEl.querySelector('[data-fill="blockBlurRange"]');
  const blockBlurNumber         = sectionEl.querySelector('[data-fill="blockBlurNumber"]');
  const elementOpacityRange  = sectionEl.querySelector('[data-fill="elementOpacityRange"]');
  const elementOpacityNumber = sectionEl.querySelector('[data-fill="elementOpacityNumber"]');
  const elementBlurRange     = sectionEl.querySelector('[data-fill="elementBlurRange"]');
  const elementBlurNumber    = sectionEl.querySelector('[data-fill="elementBlurNumber"]');
  const grayRange     = sectionEl.querySelector('[data-fill="grayRange"]');
  const grayNumber    = sectionEl.querySelector('[data-fill="grayNumber"]');

  const colorInput    = sectionEl.querySelector('[data-fill="color"]');
  const colorText     = sectionEl.querySelector('[data-fill="colorText"]');
  const grad1Input    = sectionEl.querySelector('[data-fill="gradColor1"]');
  const grad1Text     = sectionEl.querySelector('[data-fill="gradColor1Text"]');
  const grad2Input    = sectionEl.querySelector('[data-fill="gradColor2"]');
  const grad2Text     = sectionEl.querySelector('[data-fill="gradColor2Text"]');
  const grad3Input    = sectionEl.querySelector('[data-fill="gradColor3"]');
  const grad3Text     = sectionEl.querySelector('[data-fill="gradColor3Text"]');
  const gradAngleRange  = sectionEl.querySelector('[data-fill="gradAngleRange"]');
  const gradAngleNumber = sectionEl.querySelector('[data-fill="gradAngleNumber"]');
  const imageUrlInput = sectionEl.querySelector('[data-fill="imageUrl"]');
  const imageSizeSelect = sectionEl.querySelector('[data-fill="imageSize"]');
  const imagePosSelect  = sectionEl.querySelector('[data-fill="imagePosition"]');

  const imageCanvasFixedInput = sectionEl.querySelector('[data-fill="imageCanvasFixed"]');

  const customPosWrap = sectionEl.querySelector('[data-fill-custompos]');
  const customSizeWrap = sectionEl.querySelector('[data-fill-customsize]');

  const imageScaleRange  = sectionEl.querySelector('[data-fill="imageScale"]');
  const imageScaleXRange = sectionEl.querySelector('[data-fill="imageScaleX"]');
  const imageScaleYRange = sectionEl.querySelector('[data-fill="imageScaleY"]');
  const imageScaleVal  = sectionEl.querySelector('[data-fill-label="imageScale"]');
  const imageScaleXVal = sectionEl.querySelector('[data-fill-label="imageScaleX"]');
  const imageScaleYVal = sectionEl.querySelector('[data-fill-label="imageScaleY"]');
  const imagePosXRange = sectionEl.querySelector('[data-fill="imagePosX"]');
  const imagePosYRange = sectionEl.querySelector('[data-fill="imagePosY"]');
  const imagePosXVal   = sectionEl.querySelector('[data-fill-label="imagePosX"]');
  const imagePosYVal   = sectionEl.querySelector('[data-fill-label="imagePosY"]');

  // Фільтр (як у "Фон сторінки")
  const filterModeBtns = Array.from(sectionEl.querySelectorAll('[data-filter-mode]'));
  const filterGroupColor = sectionEl.querySelector('[data-filter-group="color"]');
  const filterGroupGrad  = sectionEl.querySelector('[data-filter-group="gradient"]');

  // 🔒 FIX: гарантуємо 3 кольори для "Фільтр → Градієнт" (UI 1:1 як у "Фон сторінки")
  // Якщо з якоїсь причини в DOM залишився лише 1 color-picker (через попередні правки/злиття),
  // добудовуємо 2-й і 3-й, не змінюючи існуючі ключі/логіку.
  if (filterGroupGrad) {
    const has2 = !!filterGroupGrad.querySelector('[data-fill="filterGradColor2"]');
    const has3 = !!filterGroupGrad.querySelector('[data-fill="filterGradColor3"]');
    if (!has2 || !has3) {
      const rows = [];
      if (!has2) rows.push(`
        <div class="design-fill-row">
          <label class="design-fill-label">2-й колір</label>
          <input type="color" data-fill="filterGradColor2" value="#000000" />
          <input type="text" class="design-input" data-fill="filterGradColor2Text" value="#000000" />
        </div>
      `);
      if (!has3) rows.push(`
        <div class="design-fill-row">
          <label class="design-fill-label">3-й колір</label>
          <input type="color" data-fill="filterGradColor3" value="#000000" />
          <input type="text" class="design-input" data-fill="filterGradColor3Text" value="#000000" />
        </div>
      `);
      // вставляємо перед блоком "Напрямок", якщо він існує
      const angleRow = filterGroupGrad.querySelector('[data-fill="filterAngleRange"]')?.closest('.design-fill-row');
      if (angleRow) angleRow.insertAdjacentHTML('beforebegin', rows.join(''));
      else filterGroupGrad.insertAdjacentHTML('beforeend', rows.join(''));
    }
  }


  const filterColorInput = sectionEl.querySelector('[data-fill="filterColor"]');
  const filterColorText  = sectionEl.querySelector('[data-fill="filterColorText"]');
  const fGrad1Input = sectionEl.querySelector('[data-fill="filterGradColor1"]');
  const fGrad1Text  = sectionEl.querySelector('[data-fill="filterGradColor1Text"]');
  const fGrad2Input = sectionEl.querySelector('[data-fill="filterGradColor2"]');
  const fGrad2Text  = sectionEl.querySelector('[data-fill="filterGradColor2Text"]');
  const fGrad3Input = sectionEl.querySelector('[data-fill="filterGradColor3"]');
  const fGrad3Text  = sectionEl.querySelector('[data-fill="filterGradColor3Text"]');

  const filterAngleRange  = sectionEl.querySelector('[data-fill="filterAngleRange"]');
  const filterAngleNumber = sectionEl.querySelector('[data-fill="filterAngleNumber"]');
  const filterAngleVal    = sectionEl.querySelector('[data-fill-label="filterAngle"]');

  const filterOpacityRange  = sectionEl.querySelector('[data-fill="filterOpacityRange"]');
  const filterOpacityNumber = sectionEl.querySelector('[data-fill="filterOpacityNumber"]');

  // ✅ кнопка превʼю/відкриття галереї
  const imagePickBtn  = sectionEl.querySelector('[data-fill="imagePick"]');

  // ---------- режими ----------
  function getMode() {
    const active = modeButtons.find(btn => btn.classList.contains('is-active'));
    return active ? active.dataset.fillMode : 'color';
  }

  function setMode(mode) {
    modeButtons.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.fillMode === mode);
    });
    groups.forEach(g => {
      g.hidden = g.getAttribute('data-fill-group') !== mode;
    });
  }

  if (modeContainer) {
    modeContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-fill-mode]');
      if (!btn) return;
      const mode = btn.dataset.fillMode;
      if (!mode) return;
      setMode(mode);
      applyFill();
    });
  }

  // ---------- стан з UI ----------
  function getOpacity() {
    let v = Number(opacityRange?.value ?? 100);
    if (!Number.isFinite(v)) v = 100;
    v = Math.max(0, Math.min(100, v));
    return v;
  }

  const ELEMENT_BLUR_MAX_PX_00994 = 20;
  const clampPct00994 = (value, fallback = 0) => {
    let v = Number(value);
    if (!Number.isFinite(v)) v = fallback;
    return Math.max(0, Math.min(100, v));
  };

  const BLOCK_SURFACE_BLUR_MAX_PX_00995 = 20;

  function getBlockTransparencyPct00995() {
    return clampPct00994(blockTransparencyRange?.value ?? blockTransparencyNumber?.value ?? 0, 0);
  }

  function getBlockBlurPct00995() {
    return clampPct00994(blockBlurRange?.value ?? blockBlurNumber?.value ?? 0, 0);
  }

  function getElementOpacityPct00994() {
    return clampPct00994(elementOpacityRange?.value ?? elementOpacityNumber?.value ?? 100, 100);
  }

  function getElementBlurPct00994() {
    return clampPct00994(elementBlurRange?.value ?? elementBlurNumber?.value ?? 0, 0);
  }

  function getFillStateFromUI() {
    const mode = getMode();
    const pickVal = (name) => {
      const el = sectionEl.querySelector(`[data-fill="${name}"]`);
      return el ? el.value : '';
    };

    const colorRaw = pickVal('color') || pickVal('colorText') || '#0f172a';
    const grad1Raw = pickVal('gradColor1') || pickVal('gradColor1Text') || '#0f172a';
    const grad2Raw = pickVal('gradColor2') || pickVal('gradColor2Text') || '#1e293b';
    const grad3Raw = pickVal('gradColor3') || pickVal('gradColor3Text') || '#334155';
    const angleRaw = pickVal('gradAngleRange') || pickVal('gradAngleNumber') || '90';
    const angle = Math.max(0, Math.min(360, parseInt(angleRaw, 10) || 0));
    const imageUrl = pickVal('imageUrl') || '';
    const imageSizeRaw = pickVal('imageSize') || 'cover';
    const imageSize = (['cover','contain','auto','custom'].includes(imageSizeRaw) ? imageSizeRaw : 'cover');
    const imagePosition = pickVal('imagePosition') || 'center center';

    const imageScaleRaw  = pickVal('imageScale')  || '100';
    const imageScaleXRaw = pickVal('imageScaleX') || '100';
    const imageScaleYRaw = pickVal('imageScaleY') || '100';
    const imageScale  = Math.max(0, Math.min(200, parseInt(imageScaleRaw, 10)  || 100));
    const imageScaleX = Math.max(0, Math.min(200, parseInt(imageScaleXRaw, 10) || 100));
    const imageScaleY = Math.max(0, Math.min(200, parseInt(imageScaleYRaw, 10) || 100));

    const imagePosXRaw = pickVal('imagePosX') || '50';
    const imagePosYRaw = pickVal('imagePosY') || '50';
    const imagePosX = Math.max(1, Math.min(100, parseInt(imagePosXRaw, 10) || 50));
    const imagePosY = Math.max(1, Math.min(100, parseInt(imagePosYRaw, 10) || 50));

    const imageCanvasFixedEl = sectionEl.querySelector('[data-fill="imageCanvasFixed"]');
    const imageCanvasFixed = !!(imageCanvasFixedEl && imageCanvasFixedEl.checked);


    // фільтр поверх фону
    const filterMode = getFilterMode ? (getFilterMode() || 'off') : 'off';
    const filterColorRaw = pickVal('filterColor') || '#000000';
    const filterG1Raw = pickVal('filterGradColor1') || '#000000';
    const filterG2Raw = pickVal('filterGradColor2') || '#000000';
    const filterG3Raw = pickVal('filterGradColor3') || '#000000';
    const filterAngleRaw = pickVal('filterAngleRange') || pickVal('filterAngleNumber') || '90';
    const filterAngle = Math.max(0, Math.min(360, parseInt(filterAngleRaw, 10) || 0));
    const filterOpacityRaw = pickVal('filterOpacityRange') || pickVal('filterOpacityNumber') || '0';
    const filterOpacityPct = Math.max(0, Math.min(100, parseInt(filterOpacityRaw, 10) || 0));
    const filterOpacity = filterOpacityPct / 100;

    // sync custom size labels
    if (imageScaleRange)  imageScaleRange.value  = String(imageScale);
    if (imageScaleXRange) imageScaleXRange.value = String(imageScaleX);
    if (imageScaleYRange) imageScaleYRange.value = String(imageScaleY);
    if (imageScaleVal)  imageScaleVal.textContent  = `${imageScale}%`;
    if (imageScaleXVal) imageScaleXVal.textContent = `${imageScaleX}%`;
    if (imageScaleYVal) imageScaleYVal.textContent = `${imageScaleY}%`;

    // sync custom pos labels
    if (imagePosXRange) imagePosXRange.value = String(imagePosX);
    if (imagePosYRange) imagePosYRange.value = String(imagePosY);
    if (imagePosXVal) imagePosXVal.textContent = `${imagePosX}%`;
    if (imagePosYVal) imagePosYVal.textContent = `${imagePosY}%`;

    // sync filter angle/opacity
    if (filterAngleRange) filterAngleRange.value = String(filterAngle);
    if (filterAngleNumber) filterAngleNumber.value = String(filterAngle);
    if (filterAngleVal) filterAngleVal.textContent = String(filterAngle) + "°";
    if (filterOpacityRange) filterOpacityRange.value = String(filterOpacityPct);
    if (filterOpacityNumber) filterOpacityNumber.value = String(filterOpacityPct);

    const alpha = getOpacity() / 100;
    const grayPctRaw = pickVal('grayRange') || pickVal('grayNumber') || '0';
    const grayPct = Math.max(0, Math.min(100, parseInt(grayPctRaw, 10) || 0));
    const gray = grayPct / 100;

    // sync UI numbers if elements exist
    if (grayRange) grayRange.value = String(grayPct);
    if (grayNumber) grayNumber.value = String(grayPct);
    if (mode === 'gradient') {
      if (gradAngleRange) gradAngleRange.value = String(angle);
      if (gradAngleNumber) gradAngleNumber.value = String(angle);
    }
return {
      mode,
      colorRaw: normalizeHex(colorRaw),
      grad1Raw: normalizeHex(grad1Raw),
      grad2Raw: normalizeHex(grad2Raw),
      grad3Raw: normalizeHex(grad3Raw),
      angle,
      imageUrl,
      imageSize,
      imagePosition,
      imageScale,
      imageScaleX,
      imageScaleY,
      imagePosX,
      imagePosY,
      imageCanvasFixed,
      alpha,
      gray,
      filterMode,
      filterColorRaw: normalizeHex(filterColorRaw),
      filterG1Raw: normalizeHex(filterG1Raw),
      filterG2Raw: normalizeHex(filterG2Raw),
      filterG3Raw: normalizeHex(filterG3Raw),
      filterAngle,
      filterOpacity
    };
  }

  // ---------- таргети ----------
  function cleanManualTargets() {
    manualTargets = manualTargets.filter(el => el && el.isConnected);
  }

  function isRealFillElement(el) {
    return !!(
      el instanceof HTMLElement &&
      el.isConnected &&
      !el.closest('.hb-panel') &&
      !el.closest('.fb-panel')
    );
  }

  function normalizeSelectionElements(sel) {
    if (!sel || typeof sel !== 'object') return [];
    const raw = Array.isArray(sel.elements) && sel.elements.length
      ? sel.elements
      : (sel.element ? [sel.element] : []);
    return raw.filter(isRealFillElement);
  }

  function rememberFillTargets_(targets) {
    const clean = (targets || []).filter(isRealFillElement);
    if (clean.length) {
      lastStableFillTargets = clean;
      try { window.__ST_LAST_FILL_TARGETS__ = clean; } catch(e) {}
    }
    return clean;
  }

  function getRememberedFillTargets_() {
    const local = (lastStableFillTargets || []).filter(isRealFillElement);
    if (local.length) return local;
    try {
      const global = Array.isArray(window.__ST_LAST_FILL_TARGETS__) ? window.__ST_LAST_FILL_TARGETS__.filter(isRealFillElement) : [];
      if (global.length) return global;
    } catch(e) {}
    return [];
  }

  // [00447][FOOTER/HEADER SAFE FILL]
  // Легка діагностика без console-spam. Потрібна, щоб у AI LOG було видно,
  // що випадковий drag фону заблоковано і що Header/Footer не запускають сторонні autosave-процеси.
  const fillPerfLogLast_ = new Map();
  function logFillPerf_(event, detail = {}, level = 'info', throttleMs = 650) {
    try {
      const now = (window.performance && typeof window.performance.now === 'function') ? window.performance.now() : Date.now();
      const key = String(event || 'fill-log');
      const last = Number(fillPerfLogLast_.get(key) || 0);
      if (throttleMs > 0 && (now - last) < throttleMs) return;
      fillPerfLogLast_.set(key, now);
      window.ST_AI_DEBUG_LOG?.perf?.(event, detail, level);
    } catch(e) {}
  }

  function cleanSessionFillTargets00779_(targets) {
    return (targets || []).filter(el => isRealFillElement(el) && el.isConnected);
  }

  function beginFillEditSession00779_(reason = 'fill-edit-session') {
    const targets = cleanSessionFillTargets00779_(getTargets());
    activeFillEditSessionTargets00779_ = targets;
    activeFillEditSessionStartedAt00779_ = Date.now();
    if (targets.length) {
      logFillPerf_('perf:fill-target-session-start-00779', {
        reason,
        targetCount: targets.length,
        firstTag: String(targets[0]?.tagName || ''),
        firstClass: String(targets[0]?.className || '').slice(0, 120)
      }, 'info', 0);
    }
    return targets;
  }

  function getFillEditSessionTargets00779_(reason = 'fill-edit-session') {
    const targets = cleanSessionFillTargets00779_(activeFillEditSessionTargets00779_);
    if (targets.length) return targets;
    return beginFillEditSession00779_(reason);
  }

  function endFillEditSession00779_(reason = 'fill-edit-session-end') {
    const targets = cleanSessionFillTargets00779_(activeFillEditSessionTargets00779_);
    if (targets.length) {
      logFillPerf_('perf:fill-target-session-end-00779', {
        reason,
        targetCount: targets.length,
        ageMs: Date.now() - Number(activeFillEditSessionStartedAt00779_ || Date.now())
      }, 'info', 0);
    }
    activeFillEditSessionTargets00779_ = [];
    activeFillEditSessionStartedAt00779_ = 0;
  }

  function getComponentScope_(targets) {
    const list = (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
    if (!list.length) return 'none';
    if (list.some(el => !!el.closest?.('#st-site-header-slot'))) return 'header';
    if (list.some(el => !!el.closest?.('#st-site-footer-slot'))) return 'footer';
    if (list.some(el => !!el.closest?.('#site-root'))) return 'canvas';
    return 'unknown';
  }

  function isFillBgDragBlockedTarget_(ev) {
    try {
      const t = ev?.target;
      if (!(t instanceof Element)) return false;
      return !!t.closest(
        '.st-resize,.st-resize-handle,[data-resize-handle],' +
        '.st-drag-handle,.st-block-handle,.st-section-handle,.st-row-handle,' +
        '.st-col-resizer,.st-sec-resizer,.hb-panel,.fb-panel,' +
        '.templates-gallery-modal,.gallery-modal,input,textarea,select,button,[contenteditable="true"]'
      );
    } catch(e) { return false; }
  }

  function normalizeFillAssetUrl_(url) {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^(blob:|data:|https?:|file:)/i.test(raw)) return raw;
    try { return new URL(raw.replace(/^\.\//, ''), window.location.href).href; }
    catch(e) { return raw; }
  }

  function getHeaderNavRowFillTarget(el) {
    if (!(el instanceof HTMLElement)) return null;
    // 00313: для вставки "Навігаційний рядок меню" віджет "Заливка"
    // має фарбувати саме чорну/кольорову полоску рядка, а не кнопки меню.
    const navSection = el.matches('.st-section.st-header-nav-row')
      ? el
      : el.closest?.('.st-section.st-header-nav-row');
    return (navSection instanceof HTMLElement && navSection.isConnected) ? navSection : null;
  }

  function uniqElements(list) {
    const out = [];
    const seen = new Set();
    (list || []).forEach((el) => {
      if (!(el instanceof HTMLElement) || seen.has(el)) return;
      seen.add(el);
      out.push(el);
    });
    return out;
  }

  function domDepth_(el) {
    let n = 0;
    try { for (let p = el; p; p = p.parentElement) n += 1; } catch(e) {}
    return n;
  }

  function deepestFirst_(list) {
    return (list || []).slice().sort((a, b) => domDepth_(b) - domDepth_(a));
  }

  function preferEditableFillTarget_(list) {
    const items = deepestFirst_(list || []).filter(isRealFillElement);
    if (!items.length) return null;
    // У звичайному canvas, коли одночасно лишились active/selected на секції і блоці,
    // заливка майже завжди має йти в конкретний блок. Інакше при виборі фото для блока
    // випадково очищався фон першої AI-секції.
    const block = items.find(el => el.classList.contains('st-block') && !el.classList.contains('st-block--button'));
    if (block) return block;
    const row = items.find(el => el.classList.contains('st-row'));
    if (row) return row;
    const section = items.find(el => el.classList.contains('st-section'));
    if (section) return section;
    return items[0];
  }

  function prioritizeFillTargets(els) {
    const list = (els || []).filter(isRealFillElement);
    if (!list.length) return [];

    // 00313: якщо виділення всередині спеціального header nav-row,
    // завжди керуємо фоном самого рядка. Пункти/кнопки меню лишаються
    // під керуванням віджета "Меню".
    const navRowTargets = uniqElements(list.map(getHeaderNavRowFillTarget).filter(Boolean));
    if (navRowTargets.length) return navRowTargets;

    // Menu cascade rule для звичайних меню:
    // - If any menu items selected -> only them
    // - Else if menu block selected -> menu block (global)
    const menuItems = list.filter(el => el.matches('[data-st-menu-item="1"]'));
    if (menuItems.length) return menuItems;
    const menuBlocks = list.filter(el => el.matches('[data-st-menu="1"]'));
    if (menuBlocks.length) return [menuBlocks[0]];

    // ✅ Якщо одночасно випадково лишились батько + діти (.is-selected),
    //    для віджета заливки беремо саме АКТИВНИЙ елемент.
    //    Це критично для блока/row, всередині якого є кнопки: фон має йти на вибраний блок,
    //    а не на всі дочірні кнопки або випадковий stale-selection.
    const active = list.filter(el => el.classList.contains('is-active'));
    if (active.length) {
      const preferred = preferEditableFillTarget_(active);
      return preferred ? [preferred] : [active[0]];
    }

    // Якщо активного немає, але є кілька selected (часто після кліків/модалки),
    // беремо найглибший редагований елемент, а не першу секцію в DOM.
    const selected = list.filter(el => el.classList.contains('is-selected'));
    if (selected.length) {
      const preferred = preferEditableFillTarget_(selected);
      return preferred ? [preferred] : [selected[0]];
    }

    const preferred = preferEditableFillTarget_(list);
    return preferred ? [preferred] : list;
  }

  function getActiveFromSlot(slot) {
    if (!slot) return null;
    const candidates = Array.from(slot.querySelectorAll(
      '.st-row.is-active, .st-block.is-active, .st-section.is-active, [data-st-menu="1"].is-active, [data-st-menu-item="1"].is-active'
    )).filter(isRealFillElement);

    if (candidates.length) {
      // 00313: активний елемент усередині "Навігаційного рядка меню"
      // для заливки означає сам рядок, не пункти меню.
      const navRowTargets = uniqElements(candidates.map(getHeaderNavRowFillTarget).filter(Boolean));
      if (navRowTargets.length) return navRowTargets[0];

      const preferred = preferEditableFillTarget_(candidates);
      return preferred || candidates[0];
    }

    if (slot.classList.contains('is-active') || slot.classList.contains('is-selected')) {
      return slot.querySelector('section.st-section') || Array.from(slot.children).find(ch => ch instanceof HTMLElement && !ch.closest('.hb-panel, .fb-panel')) || null;
    }
    return null;
  }

function getTargets() {
  try {
    const headerSlot = document.getElementById('st-site-header-slot');
    const footerSlot = document.getElementById('st-site-footer-slot');
    const preferFooter = document.body?.classList?.contains('st-footer-builder-on');
    const preferHeader = document.body?.classList?.contains('st-header-builder-on');

    const filterForActiveComponent_ = (els) => {
      const list = (els || []).filter(isRealFillElement);
      if (preferFooter) {
        const footerEls = list.filter(el => footerSlot && (el === footerSlot || footerSlot.contains(el)));
        return footerEls.length ? footerEls : [];
      }
      if (preferHeader) {
        const headerEls = list.filter(el => headerSlot && (el === headerSlot || headerSlot.contains(el)));
        return headerEls.length ? headerEls : [];
      }
      return list;
    };

    // [00447][SELECTION TARGET ORDER]
    // Спочатку беремо реальний поточний selection з DesignPanel/ST_SELECTION,
    // але в режимі конструктора Footer/Header не дозволяємо stale-selection з іншого
    // компонента перебити активний компонент.
    if (typeof getSelection === 'function') {
      const sel = getSelection();
      const els = prioritizeFillTargets(filterForActiveComponent_(normalizeSelectionElements(sel)));
      if (els.length) return rememberFillTargets_(els);
    }

    // Фолбек із останньої події selection. Потрібно для Header/Footer, де подія
    // часто приходить як detail.element без detail.elements.
    const lastEls = prioritizeFillTargets(filterForActiveComponent_(normalizeSelectionElements(__stLastSelection)));
    if (lastEls.length) return rememberFillTargets_(lastEls);

    // Header/Footer ORIGINAL DOM fallback. У режимі конструктора відповідний слот
    // має пріоритет, щоб не взяти stale active з іншого компонента.
    if (preferFooter) {
      const footerActive = getActiveFromSlot(footerSlot);
      if (footerActive) return rememberFillTargets_([footerActive]);
      const headerActive = getActiveFromSlot(headerSlot);
      if (headerActive) return rememberFillTargets_([headerActive]);
    } else {
      const headerActive = getActiveFromSlot(headerSlot);
      if (headerActive) return rememberFillTargets_([headerActive]);
      const footerActive = getActiveFromSlot(footerSlot);
      if (footerActive) return rememberFillTargets_([footerActive]);
    }

    // Canvas fallback.
    const rootEl = document.getElementById('site-root');
    if (!rootEl) return [];

    const activeEls = prioritizeFillTargets(Array.from(rootEl.querySelectorAll('.st-row.is-active, .st-block.is-active, .st-section.is-active, .st-row.is-selected, .st-block.is-selected, .st-section.is-selected')).filter(isRealFillElement));
    if (activeEls.length) return rememberFillTargets_(activeEls);

    const remembered = getRememberedFillTargets_();
    if (remembered.length) return remembered;
    return [];
  } catch (e) {
    console.warn('[fill] getTargets error', e);
    return [];
  }
}




  function updateTargetSummary(targets) {
    if (!targetSummary) return;
    const count = targets.length;
    if (!count) {
      targetSummary.textContent = 'Немає вибраних елементів';
    } else if (count === 1) {
      targetSummary.textContent = '1 елемент вибрано';
    } else {
      targetSummary.textContent = `${count} елементи(ів) вибрано`;
    }
  }

  function resolveFillTarget(el) {
    if (!el) return null;
    const navRow = getHeaderNavRowFillTarget(el);
    if (navRow) return navRow;
    const inner = el.querySelector(':scope > .st-section-inner, :scope > .st-block-inner');
    return inner || el;
  }

  const ELEMENT_FX_SOURCE_VAR_00994 = '--st-element-fx-source-b64';
  const ELEMENT_FX_OWNS_BG_VAR_00994 = '--st-element-fx-owns-bgfx';
  const ELEMENT_FX_PROPS_00994 = [
    'background','background-image','background-color','background-size','background-position',
    'background-repeat','background-attachment','background-origin','background-clip','box-shadow'
  ];

  function encodeElementFxSnapshot00994(obj) {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(obj || {})))); } catch (_) { return ''; }
  }

  function decodeElementFxSnapshot00994(raw) {
    try { return JSON.parse(decodeURIComponent(escape(atob(String(raw || '').trim())))); } catch (_) { return null; }
  }

  function readInlineStyleSnapshot00994(target) {
    const inline = {};
    for (const prop of ELEMENT_FX_PROPS_00994) {
      const value = target.style.getPropertyValue(prop);
      const priority = target.style.getPropertyPriority(prop);
      inline[prop] = { present: value !== '' || priority !== '', value, priority };
    }
    const cs = getComputedStyle(target);
    return {
      inline,
      hadBgfx: target.classList.contains('st-bgfx'),
      computed: {
        backgroundImage: cs.backgroundImage || 'none',
        backgroundColor: cs.backgroundColor || 'transparent',
        backgroundSize: cs.backgroundSize || 'auto',
        backgroundPosition: cs.backgroundPosition || '0% 0%',
        backgroundRepeat: cs.backgroundRepeat || 'repeat',
        backgroundAttachment: cs.backgroundAttachment || 'scroll',
        boxShadow: cs.boxShadow || 'none'
      }
    };
  }

  function ensureElementFxSource00994(target) {
    const existing = target.style.getPropertyValue(ELEMENT_FX_SOURCE_VAR_00994).trim();
    if (existing) return decodeElementFxSnapshot00994(existing);
    const snap = readInlineStyleSnapshot00994(target);
    const encoded = encodeElementFxSnapshot00994(snap);
    if (encoded) target.style.setProperty(ELEMENT_FX_SOURCE_VAR_00994, encoded);
    return snap;
  }

  function restoreInlineProp00994(target, prop, record) {
    if (record && record.present) target.style.setProperty(prop, String(record.value || ''), String(record.priority || ''));
    else target.style.removeProperty(prop);
  }

  function scaleShadowOpacity00994(shadow, factor) {
    const source = String(shadow || 'none');
    if (!source || source === 'none') return 'none';
    const f = Math.max(0, Math.min(1, Number(factor) || 0));
    return source.replace(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/gi,
      (_m, r, g, b, a) => {
        const baseA = a == null ? 1 : Math.max(0, Math.min(1, Number(a) || 0));
        const nextA = Math.round(baseA * f * 10000) / 10000;
        return `rgba(${r}, ${g}, ${b}, ${nextA})`;
      });
  }

  function ensureElementFxBackgroundLayer00994(target, snap) {
    const alreadyOwned00994 = target.style.getPropertyValue(ELEMENT_FX_OWNS_BG_VAR_00994).trim() === '1';
    const fxBg = target.style.getPropertyValue('--st-bgfx-bg').trim() || getComputedStyle(target).getPropertyValue('--st-bgfx-bg').trim();
    if (alreadyOwned00994 && target.classList.contains('st-bgfx')) return;
    if (target.classList.contains('st-bgfx') && fxBg && fxBg !== 'none') {
      target.style.setProperty(ELEMENT_FX_OWNS_BG_VAR_00994, '0');
      return;
    }
    const c = snap?.computed || {};
    target.classList.add('st-bgfx');
    target.style.setProperty(ELEMENT_FX_OWNS_BG_VAR_00994, '1');
    target.style.setProperty('--st-bgfx-bg', String(c.backgroundImage || 'none'));
    target.style.setProperty('--st-bgfx-bg-color', String(c.backgroundColor || 'transparent'));
    target.style.setProperty('--st-bgfx-bg-opacity', '1');
    target.style.setProperty('--st-bgfx-bg-size', String(c.backgroundSize || 'auto'));
    target.style.setProperty('--st-bgfx-bg-pos', String(c.backgroundPosition || '0% 0%'));
    target.style.setProperty('--st-bgfx-bg-repeat', String(c.backgroundRepeat || 'repeat'));
    target.style.setProperty('--st-bgfx-gray', '0');
    target.style.setProperty('background', 'transparent', 'important');
    target.style.setProperty('background-image', 'none', 'important');
    target.style.setProperty('background-color', 'transparent', 'important');
  }

  function releaseOwnedFxBackgroundIfUnused00995(target) {
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('st-element-visualfx') || target.classList.contains('st-block-surfacefx')) return;
    const snap = decodeElementFxSnapshot00994(target.style.getPropertyValue(ELEMENT_FX_SOURCE_VAR_00994));
    const ownsBg = target.style.getPropertyValue(ELEMENT_FX_OWNS_BG_VAR_00994).trim() === '1';
    if (snap?.inline) {
      restoreInlineProp00994(target, 'box-shadow', snap.inline['box-shadow']);
      if (ownsBg) {
        for (const prop of ELEMENT_FX_PROPS_00994) {
          if (prop === 'box-shadow') continue;
          restoreInlineProp00994(target, prop, snap.inline[prop]);
        }
      }
    }
    if (ownsBg) {
      target.classList.remove('st-bgfx', 'st-bgfx--canvasfixed');
      for (const prop of ['--st-bgfx-bg','--st-bgfx-bg-color','--st-bgfx-bg-opacity','--st-bgfx-bg-size','--st-bgfx-bg-pos','--st-bgfx-bg-repeat','--st-bgfx-bg-pos-x','--st-bgfx-bg-pos-y','--st-bgfx-gray','--st-bgfx-filter','--st-bgfx-filter-opacity']) {
        target.style.removeProperty(prop);
      }
    }
    target.style.removeProperty(ELEMENT_FX_SOURCE_VAR_00994);
    target.style.removeProperty(ELEMENT_FX_OWNS_BG_VAR_00994);
  }

  function clearElementFx00994(target) {
    if (!(target instanceof HTMLElement)) return;
    const snap = decodeElementFxSnapshot00994(target.style.getPropertyValue(ELEMENT_FX_SOURCE_VAR_00994));
    if (snap?.inline) restoreInlineProp00994(target, 'box-shadow', snap.inline['box-shadow']);
    target.classList.remove('st-element-visualfx');
    for (const prop of ['--st-element-fx-opacity','--st-element-fx-blur','--st-element-fx-blur-pct']) {
      target.style.removeProperty(prop);
    }
    releaseOwnedFxBackgroundIfUnused00995(target);
  }

  function clearBlockSurfaceFx00995(target) {
    if (!(target instanceof HTMLElement)) return;
    target.classList.remove('st-block-surfacefx');
    for (const prop of ['--st-block-surface-alpha','--st-block-surface-transparency-pct','--st-block-surface-blur','--st-block-surface-blur-pct']) {
      target.style.removeProperty(prop);
    }
    releaseOwnedFxBackgroundIfUnused00995(target);
  }

  function applyBlockSurfaceFxToElement00995(el, transparencyPct, blurPct) {
    const target = resolveFillTarget(el);
    if (!(target instanceof HTMLElement)) return false;
    const trPct = clampPct00994(transparencyPct, 0);
    const blPct = clampPct00994(blurPct, 0);
    if (trPct <= 0 && blPct <= 0) {
      clearBlockSurfaceFx00995(target);
      return true;
    }
    const snap = ensureElementFxSource00994(target);
    ensureElementFxBackgroundLayer00994(target, snap);
    target.classList.add('st-block-surfacefx');
    const surfaceAlpha = Math.max(0, Math.min(1, 1 - (trPct / 100)));
    const blurPx = Math.round((blPct / 100) * BLOCK_SURFACE_BLUR_MAX_PX_00995 * 100) / 100;
    target.style.setProperty('--st-block-surface-alpha', String(surfaceAlpha));
    target.style.setProperty('--st-block-surface-transparency-pct', String(trPct));
    target.style.setProperty('--st-block-surface-blur-pct', String(blPct));
    target.style.setProperty('--st-block-surface-blur', `${blurPx}px`);
    return true;
  }

  function applyBlockSurfaceFx00995(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'block-surface-fx-live' : 'block-surface-fx-final')
      : getTargets();
    if (!targets.length) return false;
    const transparencyPct = getBlockTransparencyPct00995();
    const blurPct = getBlockBlurPct00995();
    targets.forEach(el => applyBlockSurfaceFxToElement00995(el, transparencyPct, blurPct));
    updateTargetSummary(targets);
    notifyFillApplied_(targets, {
      mode: 'block-surface-fx',
      blockTransparencyPct: transparencyPct,
      blockSurfaceAlpha: 1 - (transparencyPct / 100),
      blockBlurPct: blurPct,
      blockBlurPx: (blurPct / 100) * BLOCK_SURFACE_BLUR_MAX_PX_00995
    }, opts?.live ? 'block-surface-fx-live' : 'block-surface-fx', opts);
    if (opts?.endSession === true) endFillEditSession00779_('block-surface-fx-final');
    return true;
  }

  function applyElementVisualFxToElement00994(el, opacityPct, blurPct) {
    const target = resolveFillTarget(el);
    if (!(target instanceof HTMLElement)) return false;
    const opPct = clampPct00994(opacityPct, 100);
    const blPct = clampPct00994(blurPct, 0);
    if (opPct >= 100 && blPct <= 0) {
      clearElementFx00994(target);
      return true;
    }
    const snap = ensureElementFxSource00994(target);
    ensureElementFxBackgroundLayer00994(target, snap);
    target.classList.add('st-element-visualfx');
    const opacity = opPct / 100;
    const blurPx = Math.round((blPct / 100) * ELEMENT_BLUR_MAX_PX_00994 * 100) / 100;
    target.style.setProperty('--st-element-fx-opacity', String(opacity));
    target.style.setProperty('--st-element-fx-blur-pct', String(blPct));
    target.style.setProperty('--st-element-fx-blur', `${blurPx}px`);
    const sourceShadow = String(snap?.computed?.boxShadow || 'none');
    target.style.setProperty('box-shadow', scaleShadowOpacity00994(sourceShadow, opacity), 'important');
    return true;
  }

  function applyElementVisualFx00994(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'element-fx-live' : 'element-fx-final')
      : getTargets();
    if (!targets.length) return false;
    const opacityPct = getElementOpacityPct00994();
    const blurPct = getElementBlurPct00994();
    targets.forEach(el => applyElementVisualFxToElement00994(el, opacityPct, blurPct));
    updateTargetSummary(targets);
    notifyFillApplied_(targets, {
      mode: 'element-visual-fx',
      elementOpacity: opacityPct / 100,
      elementBlurPct: blurPct,
      elementBlurPx: (blurPct / 100) * ELEMENT_BLUR_MAX_PX_00994
    }, opts?.live ? 'element-visual-fx-live' : 'element-visual-fx', opts);
    if (opts?.endSession === true) endFillEditSession00779_('element-fx-final');
    return true;
  }

  function applyFillToElement(el, state) {
    const navRow = getHeaderNavRowFillTarget(el);
    if (navRow) el = navRow;
    // [00381][MENU BLOCK FILL]
    // Якщо вибраний САМ блок меню — віджет "Заливка" керує фоном і рамкою
    // кореневого блока меню. Кнопки/пункти меню залишаються під керуванням
    // віджета "Меню", щоб зміна фону блока випадково не перефарбовувала кнопки.
    if (el instanceof HTMLElement && el.matches('[data-st-menu="1"]') && !el.matches('[data-st-menu-item="1"]')) {
      const target = el;
      let bgVal = 'none';
      let borderVal = '';

      if (state.mode === 'color') {
        const hex = normalizeHex(state.colorRaw || '#0f172a');
        bgVal = hex;
        const alpha = (typeof state.alpha === 'number' && isFinite(state.alpha)) ? Math.max(0, Math.min(1, state.alpha)) : 1;
        borderVal = alpha < 1 ? hexToRgba(hex, Math.max(0.18, Math.min(1, alpha))) : hex;
      } else if (state.mode === 'gradient') {
        const c1 = normalizeHex(state.grad1Raw || '#0f172a');
        const c2 = normalizeHex(state.grad2Raw || '#1e293b');
        const c3 = normalizeHex(state.grad3Raw || '#334155');
        const ang = (typeof state.angle === 'number' && isFinite(state.angle)) ? Math.max(0, Math.min(360, state.angle)) : 90;
        bgVal = `linear-gradient(${ang}deg, ${c1}, ${c2}, ${c3})`;
        borderVal = c1;
      } else if (state.mode === 'image') {
        bgVal = state.imageUrl ? `url("${state.imageUrl}")` : 'none';
        borderVal = target.style.borderColor || 'rgba(148,163,184,.35)';
      }

      const alpha = (typeof state.alpha === 'number' && isFinite(state.alpha)) ? Math.max(0, Math.min(1, state.alpha)) : 1;
      const gray  = (typeof state.gray  === 'number' && isFinite(state.gray))  ? Math.max(0, Math.min(1, state.gray))  : 0;
      const needsFx = bgVal !== 'none' || alpha < 1 || gray > 0 || (state.filterOpacity && state.filterOpacity > 0);

      target.style.background = 'none';
      target.style.backgroundImage = '';
      target.style.backgroundColor = 'transparent';
      target.style.setProperty('--st-menu-block-bg', bgVal);
      if (borderVal) {
        target.style.borderStyle = target.style.borderStyle || 'solid';
        target.style.borderWidth = target.style.borderWidth || '1px';
        target.style.borderColor = borderVal;
        target.style.setProperty('--st-menu-block-border-color', borderVal);
      }

      if (needsFx) {
        target.classList.add('st-bgfx');
        target.style.setProperty('--st-bgfx-bg', bgVal);
        target.style.setProperty('--st-bgfx-bg-opacity', String(alpha));
        target.style.setProperty('--st-bgfx-gray', String(gray));
      } else {
        target.classList.remove('st-bgfx', 'st-bgfx--canvasfixed');
        target.style.removeProperty('--st-bgfx-bg');
        target.style.removeProperty('--st-bgfx-bg-opacity');
        target.style.removeProperty('--st-bgfx-bg-size');
        target.style.removeProperty('--st-bgfx-bg-pos');
        target.style.removeProperty('--st-bgfx-bg-pos-x');
        target.style.removeProperty('--st-bgfx-bg-pos-y');
        target.style.removeProperty('--st-bgfx-gray');
        target.style.removeProperty('--st-bgfx-filter');
        target.style.removeProperty('--st-bgfx-filter-opacity');
      }
      return;
    }

    // Пункти/кнопки меню не фарбуємо через "Заливку" — для них є віджет "Меню".
    if (el instanceof HTMLElement && el.matches('[data-st-menu-item="1"]')) {
      return;
    }

    const target = resolveFillTarget(el);
    if (!target) return;

    // Очищення базових стилів фону (старий механізм)
    target.style.backgroundImage = '';
    target.style.backgroundColor = '';
    target.style.background = 'none';
    target.style.opacity = '';
    target.style.filter = '';

    // ✅ ВАЖЛИВО: прозорість для КАРТИНКИ робимо через ::before (клас .st-bgfx),
    // інакше alpha працює лише для rgba(), тобто тільки для кольору/градієнта.
    
    // (v6) прозорість/фон/ЧБ керуються через .st-bgfx нижче

// --- УНІФІКОВАНИЙ РЕНДЕР ФОНУ ЧЕРЕЗ ::before (.st-bgfx) ---
    // Це дозволяє:
    // 1) прозорість працює і для картинки, і для кольору, і для градієнта
    // 2) Ч/Б (gray) застосовується ТІЛЬКИ до фону, не чіпаючи контент

    let bgVal = 'none';

    if (state.mode === 'color') {
      // колір без alpha (alpha керуємо opacity шару)
      bgVal = normalizeHex(state.colorRaw || '#0f172a');
    } else if (state.mode === 'gradient') {
      const c1 = normalizeHex(state.grad1Raw || '#0f172a');
      const c2 = normalizeHex(state.grad2Raw || '#1e293b');
      const c3 = normalizeHex(state.grad3Raw || '#334155');
      const ang = (typeof state.angle === 'number' && isFinite(state.angle)) ? Math.max(0, Math.min(360, state.angle)) : 90;
      bgVal = `linear-gradient(${ang}deg, ${c1}, ${c2}, ${c3})`;
    } else if (state.mode === 'image') {
      bgVal = state.imageUrl ? `url("${state.imageUrl}")` : 'none';
    }

    const alpha = (typeof state.alpha === 'number' && isFinite(state.alpha)) ? Math.max(0, Math.min(1, state.alpha)) : 1;
    const gray  = (typeof state.gray  === 'number' && isFinite(state.gray))  ? Math.max(0, Math.min(1, state.gray))  : 0;

    const needsFx = bgVal !== 'none' || alpha < 1 || gray > 0 || (state.filterOpacity && state.filterOpacity > 0);

    if (needsFx) {
      target.classList.add('st-bgfx');
      if (target.classList.contains('st-element-visualfx')) target.style.setProperty(ELEMENT_FX_OWNS_BG_VAR_00994, '0');
      target.style.setProperty('--st-bgfx-bg', bgVal);
      target.style.setProperty('--st-bgfx-bg-opacity', String(alpha));
      target.style.setProperty('--st-bgfx-gray', String(gray));

      // Фільтр поверх фону (як у фоні сторінки)
      const fMode = state.filterMode || 'off';
      const fOp = (typeof state.filterOpacity === 'number' && isFinite(state.filterOpacity)) ? Math.max(0, Math.min(1, state.filterOpacity)) : 0;
      if (fMode === 'off' || fOp <= 0) {
        target.style.setProperty('--st-bgfx-filter-opacity', '0');
        target.style.removeProperty('--st-bgfx-filter');
      } else if (fMode === 'color' && fOp > 0) {
        const fc = normalizeHex(state.filterColorRaw || '#000000');
        // ВАЖЛИВО: робимо rgba одразу, як у віджеті "Фон сторінки"
        target.style.setProperty('--st-bgfx-filter', hexToRgba(fc, fOp));
        target.style.setProperty('--st-bgfx-filter-opacity', '1');
      } else if (fMode === 'gradient' && fOp > 0) {
        const g1 = normalizeHex(state.filterG1Raw || '#000000');
        const g2 = normalizeHex(state.filterG2Raw || '#000000');
        const g3 = normalizeHex(state.filterG3Raw || '#000000');
        const fa = (typeof state.filterAngle === 'number' && isFinite(state.filterAngle)) ? Math.max(0, Math.min(360, state.filterAngle)) : 90;
        // 3 кольори + кут 0..360, прозорість застосовуємо як rgba на кожен стоп
        const c1 = hexToRgba(g1, fOp);
        const c2 = hexToRgba(g2, fOp);
        const c3 = hexToRgba(g3, fOp);
        target.style.setProperty('--st-bgfx-filter', `linear-gradient(${fa}deg, ${c1}, ${c2}, ${c3})`);
        target.style.setProperty('--st-bgfx-filter-opacity', '1');
      } else {
        target.style.setProperty('--st-bgfx-filter-opacity', '0');
        target.style.removeProperty('--st-bgfx-filter');
      }

      if (state.mode === 'image') {
        // [00424] Зберігаємо не лише тимчасовий url, а й id елемента галереї.
        // Blob URL після F5 недійсний, тому boot-bridge відновить фон з IndexedDB за itemId/folderId/cat.
        setGalleryAssetMeta_(target, state.__galleryAsset || { url: state.imageUrl || '' });
        target.dataset.stFillMode = 'image';
        // Розмір фон-картинки
        if (state.imageSize === 'custom') {
          const s  = Math.max(0, Math.min(200, parseInt(state.imageScale  ?? 100, 10) || 100));
          const sx = Math.max(0, Math.min(200, parseInt(state.imageScaleX ?? 100, 10) || 100));
          const sy = Math.max(0, Math.min(200, parseInt(state.imageScaleY ?? 100, 10) || 100));
          const effX = Math.max(0, Math.min(400, Math.round(s * sx / 100)));
          const effY = Math.max(0, Math.min(400, Math.round(s * sy / 100)));
          target.style.setProperty('--st-bgfx-bg-size', `${effX}% ${effY}%`);
        } else {
          target.style.setProperty('--st-bgfx-bg-size', String(state.imageSize || 'cover'));
        }
        const posVal = (state.imagePosition === 'custom')
          ? `${Math.max(1, Math.min(100, Math.round((state.imagePosX ?? 50))))}% ${Math.max(1, Math.min(100, Math.round((state.imagePosY ?? 50))))}%`
          : String(state.imagePosition || 'center center');
        target.style.setProperty('--st-bgfx-bg-pos', posVal);

        // --- canvas-fixed background (імітація fixed ВІДНОСНО canvas__scroll) ---
        // Потрібні X/Y у %, щоб у CSS працював calc(% + px)
        const normXY = (p) => {
          const parts = String(p).trim().split(/\s+/);
          let ax = parts[0] || 'center';
          let ay = parts[1] || 'center';

          const mapX = (v) => {
            if (/%$/.test(v)) return v;
            if (v === 'left') return '0%';
            if (v === 'right') return '100%';
            if (v === 'center') return '50%';
            // якщо прийде top/bottom у X — ставимо center
            return '50%';
          };
          const mapY = (v) => {
            if (/%$/.test(v)) return v;
            if (v === 'top') return '0%';
            if (v === 'bottom') return '100%';
            if (v === 'center') return '50%';
            // якщо прийде left/right у Y — ставимо center
            return '50%';
          };

          // для форматів типу "center left"
          if (ax === 'top' || ax === 'bottom') ax = 'center';
          if (ay === 'left' || ay === 'right') ay = 'center';

          return { x: mapX(ax), y: mapY(ay) };
        };

        const xy = normXY(posVal);
        target.style.setProperty('--st-bgfx-bg-pos-x', xy.x);
        target.style.setProperty('--st-bgfx-bg-pos-y', xy.y);

        if (state.imageCanvasFixed) {
          ensureCanvasScrollSync();
          target.classList.add('st-bgfx--canvasfixed');
          // щоб при прозорості фону не було "чорніє" — робимо базовий фон елемента прозорим
          target.style.backgroundColor = 'transparent';
        } else {
          target.classList.remove('st-bgfx--canvasfixed');
        }
      } else {
        // для кольору/градієнта не критично, але чистимо
        target.style.removeProperty('--st-bgfx-bg-size');
        target.style.removeProperty('--st-bgfx-bg-pos');
        clearGalleryAssetMeta_(target);
        target.dataset.stFillMode = state.mode || '';
      }

      // прибираємо старий background на самому елементі, щоб не було дублю
      target.style.background = 'none';
      target.style.backgroundImage = '';
      target.style.backgroundColor = '';
      // ВАЖЛИВО: робимо сам елемент прозорим, щоб при opacity фону було видно батьківський фон (секцію), а не базовий колір блока
      target.style.backgroundColor = 'transparent';
    } else {
      // якщо ефект не потрібен — чистимо
      target.classList.remove('st-bgfx');
      target.classList.remove('st-bgfx--canvasfixed');
      target.style.removeProperty('--st-bgfx-bg-pos-x');
      target.style.removeProperty('--st-bgfx-bg-pos-y');

      target.style.removeProperty('--st-bgfx-bg');
      target.style.removeProperty('--st-bgfx-bg-opacity');
      target.style.removeProperty('--st-bgfx-bg-size');
      target.style.removeProperty('--st-bgfx-bg-pos');
      target.style.removeProperty('--st-bgfx-gray');
      target.style.removeProperty('--st-bgfx-filter');
      target.style.removeProperty('--st-bgfx-filter-opacity');
      target.style.background = 'none';
      target.style.filter = '';
      clearGalleryAssetMeta_(target);
      delete target.dataset.stFillMode;
    }
  }

  function notifyFillApplied_(targets, state, reason = 'fill-apply', opts = {}) {
    const cleanTargets = (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
        const scope = getComponentScope_(cleanTargets);
    const live = opts?.live === true;
    const detail = {
      reason,
      targetCount: cleanTargets.length,
      mode: state?.mode || '',
      scope,
      targets: cleanTargets,
      target: cleanTargets[0] || null,
      live,
      imageUrl: state?.imageUrl || '',
      galleryAsset: state?.__galleryAsset || null
    };

    const hasMainTargets00909 = cleanTargets.some(el => el instanceof HTMLElement && el.closest?.('#st-site-main-slot'));

    if (live) {
      // [00909] Native color picker emits many input ticks. For Main those ticks
      // remain DOM-visual only. The SiteFrameStore keeps a lightweight pending
      // draft and writes localStorage/root DOM only on final change or selection loss.
      try { window.__ST_DESIGN_LIVE_STYLE_UNTIL_00774__ = Date.now() + 520; } catch(e) {}
      try { window.dispatchEvent(new CustomEvent('st:fill-widget:live-applied', { detail })); } catch(e) {}
      if (!hasMainTargets00909) {
        try { document.dispatchEvent(new CustomEvent('st:fill-widget:live-applied', { detail })); } catch(e) {}
      }
      logFillPerf_('perf:fill-live-no-root-save-00909', { scope, reason, mode: state?.mode || '', targetCount: cleanTargets.length, mainLiveRafQuiet00909: hasMainTargets00909, rootSaveSuppressed: true }, 'info', 2500);
      return;
    }

    try { window.dispatchEvent(new CustomEvent('st:fill-widget:applied', { detail })); } catch(e) {}
    if (!hasMainTargets00909) {
      try { document.dispatchEvent(new CustomEvent('st:fill-widget:applied', { detail })); } catch(e) {}
    }

    logFillPerf_('perf:fill-component-applied-00909', { scope, reason, mode: state?.mode || '', targetCount: cleanTargets.length, mainFinalCommit00909: hasMainTargets00909 }, 'info', 1800);

    if (!hasMainTargets00909) {
      try { window.ST_HISTORY?.capture?.(`fill-${reason}`); } catch(e) {}
      try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: `fill-widget:${reason}`, draft: false, forceContent: false, preserveLiveMain: true }); } catch(e) {}
    }
  }

  function applyFill(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'fill-live' : 'fill-final')
      : getTargets();
    const state = getFillStateFromUI();
    targets.forEach(el => applyFillToElement(el, state));
    updateTargetSummary(targets);
    notifyFillApplied_(targets, state, opts?.live ? 'live' : 'apply', opts);
    if (opts?.endSession === true) endFillEditSession00779_(opts?.live ? 'live-end' : 'final-change');
  }


  function resetFillStyles_() {
    const targets = getTargets();
    if (!targets.length) return false;

    // Menu cascade: selected items reset only themselves.
    const menuItems = targets.filter(el => el instanceof HTMLElement && el.matches('[data-st-menu-item="1"]'));
    if (menuItems.length) {
      menuItems.forEach(it => {
        it.style.removeProperty('--st-menu-item-bg');
        it.style.removeProperty('--st-menu-item-bg-h');
      });
      try { window.ST_HISTORY?.capture?.('menu-fill-reset-items'); } catch {}
      return true;
    }

    // If menu block selected: reset root block fill/border only.
    const menuBlock = targets.find(el => el instanceof HTMLElement && el.matches('[data-st-menu="1"]'));
    if (menuBlock) {
      menuBlock.classList.remove('st-bgfx', 'st-bgfx--canvasfixed');
      menuBlock.style.removeProperty('--st-bgfx-bg');
      menuBlock.style.removeProperty('--st-bgfx-bg-opacity');
      menuBlock.style.removeProperty('--st-bgfx-bg-size');
      menuBlock.style.removeProperty('--st-bgfx-bg-pos');
      menuBlock.style.removeProperty('--st-bgfx-bg-pos-x');
      menuBlock.style.removeProperty('--st-bgfx-bg-pos-y');
      menuBlock.style.removeProperty('--st-bgfx-gray');
      menuBlock.style.removeProperty('--st-bgfx-filter');
      menuBlock.style.removeProperty('--st-bgfx-filter-opacity');
      menuBlock.style.removeProperty('--st-menu-block-bg');
      menuBlock.style.removeProperty('--st-menu-block-border-color');
      menuBlock.style.background = 'none';
      menuBlock.style.backgroundImage = '';
      menuBlock.style.backgroundColor = 'transparent';
      menuBlock.style.removeProperty('border-color');
      try { window.ST_HISTORY?.capture?.('menu-block-fill-reset'); } catch {}
      return true;
    }

    // Regular elements: clear background fx and background styles.
    targets.forEach(el => {
      const t = resolveFillTarget(el);
      if (!t) return;
      clearElementFx00994(t);
      t.classList.remove('st-bgfx');
      t.classList.remove('st-bgfx--canvasfixed');
      t.style.removeProperty('--st-bgfx-bg');
      t.style.removeProperty('--st-bgfx-bg-opacity');
      t.style.removeProperty('--st-bgfx-bg-size');
      t.style.removeProperty('--st-bgfx-bg-pos');
      t.style.removeProperty('--st-bgfx-bg-pos-x');
      t.style.removeProperty('--st-bgfx-bg-pos-y');
      t.style.removeProperty('--st-bgfx-gray');
      t.style.removeProperty('--st-bgfx-filter');
      t.style.removeProperty('--st-bgfx-filter-opacity');
      t.style.background = 'none';
      t.style.backgroundImage = '';
      t.style.backgroundColor = '';
      t.style.filter = '';
    });

    try { window.ST_HISTORY?.capture?.('fill-reset'); } catch {}
    return true;
  }

  function resetFillStyles_() {
    const targets = getTargets();
    if (!targets.length) return false;

    // Menu cascade: items have priority; if selected -> reset only them
    const menuItems = targets.filter(el => el instanceof HTMLElement && el.matches("[data-st-menu-item=\"1\"]"));
    if (menuItems.length) {
      menuItems.forEach(it => {
        it.style.removeProperty("--st-menu-item-bg");
        it.style.removeProperty("--st-menu-item-bg-h");
      });
      try { window.ST_HISTORY?.capture?.("menu-fill-reset-items"); } catch {}
      return true;
    }

    const menuBlock = targets.find(el => el instanceof HTMLElement && el.matches("[data-st-menu=\"1\"]"));
    if (menuBlock) {
      menuBlock.style.removeProperty("--st-menu-item-bg");
      menuBlock.style.removeProperty("--st-menu-item-bg-h");
      try { window.ST_HISTORY?.capture?.("menu-fill-reset"); } catch {}
      return true;
    }

    // Regular elements
    targets.forEach(el => {
      const t = resolveFillTarget(el);
      if (!t) return;
      clearElementFx00994(t);
      t.classList.remove("st-bgfx");
      t.classList.remove("st-bgfx--canvasfixed");
      t.style.removeProperty("--st-bgfx-bg");
      t.style.removeProperty("--st-bgfx-bg-opacity");
      t.style.removeProperty("--st-bgfx-bg-size");
      t.style.removeProperty("--st-bgfx-bg-pos");
      t.style.removeProperty("--st-bgfx-bg-pos-x");
      t.style.removeProperty("--st-bgfx-bg-pos-y");
      t.style.removeProperty("--st-bgfx-gray");
      t.style.removeProperty("--st-bgfx-filter");
      t.style.removeProperty("--st-bgfx-filter-opacity");
      t.style.background = "none";
      t.style.backgroundImage = "";
      t.style.backgroundColor = "";
      t.style.filter = "";
    });
    try { window.ST_HISTORY?.capture?.("fill-reset"); } catch {}
    return true;
  }

  // ✅ Оновлення кнопки-превʼю (іконка/мініатюра)
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

  function setGalleryAssetMeta_(target, meta = {}) {
    if (!(target instanceof HTMLElement)) return;
    const id = String(meta.itemId || '').trim();
    const cat = String(meta.cat || '').trim();
    const folderId = String(meta.folderId || '').trim();
    const url = String(meta.url || '').trim();
    const path = String(meta.path || '').trim();
    if (id || url || path) {
      target.dataset.stFillGalleryItemId = id;
      target.dataset.stFillGalleryCat = cat;
      target.dataset.stFillGalleryFolderId = folderId;
      target.dataset.stFillGalleryUrl = url || path;
      target.dataset.stFillGalleryPath = path || url;
      target.dataset.stFillGalleryName = String(meta.name || meta.title || '').trim();
      target.dataset.stFillGallerySource = String(meta.source || 'gallery').trim();
    }
  }

  function clearGalleryAssetMeta_(target) {
    if (!(target instanceof HTMLElement)) return;
    delete target.dataset.stFillGalleryItemId;
    delete target.dataset.stFillGalleryCat;
    delete target.dataset.stFillGalleryFolderId;
    delete target.dataset.stFillGalleryUrl;
    delete target.dataset.stFillGalleryPath;
    delete target.dataset.stFillGalleryName;
    delete target.dataset.stFillGallerySource;
  }

  function applyGalleryAssetFillDetail_(detail = {}) {
    const rawUrl = detail.url || detail.path || '';
    const url = normalizeFillAssetUrl_(rawUrl);
    const fail = (message, extra = {}) => {
      try { window.dispatchEvent(new CustomEvent('st:fill-gallery-asset-applied', { detail: { ok: false, message, source: detail.source || 'gallery', ...extra } })); } catch(e) {}
      alert(message);
      return false;
    };
    if (!url) return fail('У вибраного файла немає URL/path для застосування.');

    const targets = getTargets();
    if (!targets.length) {
      return fail('Немає активного елемента для застосування фону. Спочатку вибери блок або секцію на полотні.', { reason: 'no_active_target' });
    }

    setMode('image');

    if (imageUrlInput) imageUrlInput.value = url;
    if (imageSizeSelect) imageSizeSelect.value = String(detail.fit || 'cover');
    if (imagePosSelect) imagePosSelect.value = String(detail.position || 'center center');
    if (opacityRange) opacityRange.value = String(Math.round(Number(detail.opacity ?? 1) * 100));
    if (opacityNumber) opacityNumber.value = String(Math.round(Number(detail.opacity ?? 1) * 100));
    if (grayRange) grayRange.value = String(Math.round(Number(detail.gray || 0) * 100));
    if (grayNumber) grayNumber.value = String(Math.round(Number(detail.gray || 0) * 100));

    try { syncCustomSizeVisibility(); } catch(e) {}
    try { syncCustomPosVisibility(); } catch(e) {}

    updateImagePickButtonPreview(url);

    // ✅ Не викликаємо applyFill(), бо він повторно шукає targets і може отримати інший/порожній selection.
    // Застосовуємо до вже знайдених стабільних targets.
    const fillState = getFillStateFromUI();
    fillState.__galleryAsset = {
      itemId: detail.itemId || '',
      cat: detail.cat || 'images',
      folderId: detail.folderId || '',
      url,
      path: detail.path || rawUrl || url,
      name: detail.name || detail.title || '',
      title: detail.title || detail.name || '',
      source: detail.source || 'gallery'
    };
    targets.forEach(el => applyFillToElement(el, fillState));
    updateTargetSummary(targets);
    notifyFillApplied_(targets, fillState, 'gallery-asset');

    const result = {
      ok: true,
      url,
      path: detail.path || url,
      itemId: detail.itemId || '',
      cat: detail.cat || 'images',
      folderId: detail.folderId || '',
      name: detail.name || detail.title || '',
      targetCount: targets.length,
      source: detail.source || 'gallery'
    };
    try { window.dispatchEvent(new CustomEvent('st:fill-gallery-asset-applied', { detail: result })); } catch(e) {}

    try { window.ST_HISTORY?.capture?.('gallery-asset-fill-apply'); } catch(e) {}
    return result;
  }

  try {
    window.ST_FILL_WIDGET = {
      ...(window.ST_FILL_WIDGET || {}),
      getTargets,
      applyGalleryAssetToActive: applyGalleryAssetFillDetail_
    };
  } catch(e) {}

  window.addEventListener('st:gallery-asset:apply-active-fill', (ev) => {
    try { applyGalleryAssetFillDetail_(ev?.detail || {}); }
    catch (err) { console.error('[FillWidget] apply gallery asset event error:', err); }
  });

  // ✅ Відкриття галереї в pickerMode і вставка URL в інпут + застосування
  async function pickBackgroundFromGallery() {
    openGalleryModal({
      cat: 'images',          // основна категорія картинок
      pickerMode: true,
      view: 'big',
      onPick: async (payload) => {
        try {
          const cat = payload?.cat || 'images';
          const folderId = payload?.folderId || '';
          const itemId = payload?.itemId || '';
          const items = await galListItems(cat, folderId);
          const it = (items || []).find(x => x && String(x.id) === String(itemId));
          if (!it && !payload?.url && !payload?.path) return;

          const pickedUrl = payload?.url || it?.url || it?.path || (it ? galMakeObjectUrl(it) : '');
          if (_bgObjectUrl && _bgObjectUrl !== pickedUrl && String(_bgObjectUrl).startsWith('blob:')) {
            try { URL.revokeObjectURL(_bgObjectUrl); } catch (e) {}
            _bgObjectUrl = null;
          }
          if (String(pickedUrl || '').startsWith('blob:')) _bgObjectUrl = pickedUrl;

          applyGalleryAssetFillDetail_({
            source: 'fill-picker-gallery',
            cat,
            folderId,
            itemId,
            name: payload?.name || it?.name || '',
            title: payload?.title || payload?.name || it?.title || it?.name || '',
            path: payload?.path || it?.path || it?.url || '',
            url: pickedUrl,
            mime: payload?.mime || it?.mime || '',
            fit: 'cover',
            position: 'center center',
            opacity: 1,
            gray: 0
          });
        } catch (err) {
          console.error('[FillWidget] pickBackgroundFromGallery error:', err);
        }
      }
    });
  }

  if (imagePickBtn) {
    imagePickBtn.addEventListener('click', () => {
      pickBackgroundFromGallery();
    });
  }

  // ---------- прозорість / ч-б ----------
  if (opacityRange && opacityNumber) {
    const sync = (fromSlider) => {
      if (fromSlider) {
        opacityNumber.value = opacityRange.value;
      } else {
        let v = Number(opacityNumber.value);
        if (!Number.isFinite(v)) v = 100;
        v = Math.max(0, Math.min(100, v));
        opacityNumber.value = String(v);
        opacityRange.value = String(v);
      }
      applyFill();
    };
    opacityRange.addEventListener('input', () => sync(true));
    opacityNumber.addEventListener('change', () => sync(false));
  }

  function bindElementFxControl00994(rangeEl, numberEl, fallback, reason) {
    if (!rangeEl || !numberEl) return;
    const start = () => beginFillEditSession00779_(`element-fx-${reason}-start`);
    const syncPair = (fromRange) => {
      const v = clampPct00994(fromRange ? rangeEl.value : numberEl.value, fallback);
      rangeEl.value = String(v);
      numberEl.value = String(v);
      return v;
    };
    rangeEl.addEventListener('pointerdown', start, true);
    rangeEl.addEventListener('focus', start, true);
    numberEl.addEventListener('pointerdown', start, true);
    numberEl.addEventListener('focus', start, true);
    let raf = 0;
    rangeEl.addEventListener('input', () => {
      syncPair(true);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        applyElementVisualFx00994({ live: true, useSessionTargets: true });
      });
    });
    rangeEl.addEventListener('change', () => {
      if (raf) { try { cancelAnimationFrame(raf); } catch (_) {} raf = 0; }
      syncPair(true);
      applyElementVisualFx00994({ live: false, useSessionTargets: true, endSession: true });
    });
    numberEl.addEventListener('change', () => {
      syncPair(false);
      applyElementVisualFx00994({ live: false, useSessionTargets: true, endSession: true });
    });
  }

  function bindBlockSurfaceFxControl00995(rangeEl, numberEl, fallback, reason) {
    if (!rangeEl || !numberEl) return;
    const start = () => beginFillEditSession00779_(`block-surface-fx-${reason}-start`);
    const syncPair = (fromRange) => {
      const v = clampPct00994(fromRange ? rangeEl.value : numberEl.value, fallback);
      rangeEl.value = String(v);
      numberEl.value = String(v);
      return v;
    };
    rangeEl.addEventListener('pointerdown', start, true);
    rangeEl.addEventListener('focus', start, true);
    numberEl.addEventListener('pointerdown', start, true);
    numberEl.addEventListener('focus', start, true);
    let raf = 0;
    rangeEl.addEventListener('input', () => {
      syncPair(true);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        applyBlockSurfaceFx00995({ live: true, useSessionTargets: true });
      });
    });
    rangeEl.addEventListener('change', () => {
      if (raf) { try { cancelAnimationFrame(raf); } catch (_) {} raf = 0; }
      syncPair(true);
      applyBlockSurfaceFx00995({ live: false, useSessionTargets: true, endSession: true });
    });
    numberEl.addEventListener('change', () => {
      syncPair(false);
      applyBlockSurfaceFx00995({ live: false, useSessionTargets: true, endSession: true });
    });
  }

  bindBlockSurfaceFxControl00995(blockTransparencyRange, blockTransparencyNumber, 0, 'transparency');
  bindBlockSurfaceFxControl00995(blockBlurRange, blockBlurNumber, 0, 'blur');
  bindElementFxControl00994(elementOpacityRange, elementOpacityNumber, 100, 'opacity');
  bindElementFxControl00994(elementBlurRange, elementBlurNumber, 0, 'blur');

  // ---------- кольори ----------
  function bindColorPair(colorEl, textEl) {
    if (!colorEl || !textEl) return;
    const start = () => beginFillEditSession00779_('color-control-focus');
    let liveRaf00909 = 0;
    const scheduleLive00909 = () => {
      const hex = normalizeHex(colorEl.value);
      textEl.value = hex;
      // 00909: coalesce native color-picker input bursts to the next paint.
      // The latest color is still shown, but the fill engine is not called
      // repeatedly inside the same frame.
      if (liveRaf00909) return;
      liveRaf00909 = requestAnimationFrame(() => {
        liveRaf00909 = 0;
        applyFill({ live: true, useSessionTargets: true });
      });
    };
    const flushLive00909 = () => {
      if (liveRaf00909) {
        try { cancelAnimationFrame(liveRaf00909); } catch(e) {}
        liveRaf00909 = 0;
      }
    };
    colorEl.addEventListener('pointerdown', start, true);
    colorEl.addEventListener('focus', start, true);
    textEl.addEventListener('pointerdown', start, true);
    textEl.addEventListener('focus', start, true);
    colorEl.addEventListener('input', scheduleLive00909);
    colorEl.addEventListener('change', () => {
      flushLive00909();
      const hex = normalizeHex(colorEl.value);
      colorEl.value = hex;
      textEl.value = hex;
      applyFill({ live: false, useSessionTargets: true, endSession: true });
    });
    textEl.addEventListener('change', () => {
      flushLive00909();
      const hex = normalizeHex(textEl.value);
      textEl.value = hex;
      colorEl.value = hex;
      applyFill({ live: false, useSessionTargets: true, endSession: true });
    });
  }

  bindColorPair(colorInput, colorText);
  bindColorPair(grad1Input, grad1Text);
  bindColorPair(grad2Input, grad2Text);
  bindColorPair(grad3Input, grad3Text);

  // кут градієнта 0..360
  if (gradAngleRange && gradAngleNumber) {
    const syncAngle = (fromRange) => {
      let v = fromRange ? Number(gradAngleRange.value) : Number(gradAngleNumber.value);
      v = Math.max(0, Math.min(360, isFinite(v) ? Math.round(v) : 0));
      gradAngleRange.value = String(v);
      gradAngleNumber.value = String(v);
      applyFill();
    };
    gradAngleRange.addEventListener('input', () => syncAngle(true));
    gradAngleNumber.addEventListener('change', () => syncAngle(false));
  }

  [imageSizeSelect, imagePosSelect].forEach(sel => {
    if (!sel) return;
    sel.addEventListener('change', () => applyFill());
  });
  // --- Ч/Б фону (0..100) ---
  if (grayRange && grayNumber) {
    const syncGray = (fromRange) => {
      let v = fromRange ? Number(grayRange.value) : Number(grayNumber.value);
      v = Math.max(0, Math.min(100, isFinite(v) ? v : 0));
      grayRange.value = String(v);
      grayNumber.value = String(v);
      applyFill();
    };
    grayRange.addEventListener('input', () => syncGray(true));
    grayNumber.addEventListener('change', () => syncGray(false));
  }



  if (imageUrlInput) {
    imageUrlInput.addEventListener('input', () => {
      // Якщо користувач руками вставив URL — оновлюємо превʼю + застосовуємо
      updateImagePickButtonPreview(imageUrlInput.value || '');
      applyFill();
    });
  }


  // ---------- налаштування картинки (size/position/custom) ----------
  function syncCustomSizeVisibility() {
    if (!customSizeWrap || !imageSizeSelect) return;
    const isCustom = (imageSizeSelect.value === 'custom');
    customSizeWrap.hidden = !isCustom;
  }

  if (imageSizeSelect) {
    imageSizeSelect.addEventListener('change', () => {
      syncCustomSizeVisibility();
      applyFill();
    });
    // первинна синхронізація
    syncCustomSizeVisibility();
  }

  // ---------- фон при скролі (canvas-fixed) ----------
  if (imageCanvasFixedInput) {
    imageCanvasFixedInput.addEventListener('change', () => {
      // ВАЖЛИВО: має працювати незалежно від того, що вибрали першим — картинку чи чекбокс
      applyFill();
    });
  }

  function syncCustomPosVisibility() {
    if (!customPosWrap || !imagePosSelect) return;
    const isCustom = (imagePosSelect.value === 'custom');
    customPosWrap.hidden = !isCustom;
  }

  if (imagePosSelect) {
    imagePosSelect.addEventListener('change', () => {
      syncCustomPosVisibility();
      applyFill();
    });
    // первинна синхронізація
    syncCustomPosVisibility();
  }

  function syncPosLabel(el, outEl) {
    if (!el || !outEl) return;
    outEl.textContent = `${el.value}%`;
  }

  if (imagePosXRange) {
    imagePosXRange.addEventListener('input', () => {
      syncPosLabel(imagePosXRange, imagePosXVal);
      applyFill();
    });
    syncPosLabel(imagePosXRange, imagePosXVal);
  }
  if (imagePosYRange) {
    imagePosYRange.addEventListener('input', () => {
      syncPosLabel(imagePosYRange, imagePosYVal);
      applyFill();
    });
    syncPosLabel(imagePosYRange, imagePosYVal);
  }

  function syncPctLabel(el, outEl) {
    if (!el || !outEl) return;
    outEl.textContent = `${el.value}%`;
  }

  if (imageScaleRange) {
    imageScaleRange.addEventListener('input', () => {
      syncPctLabel(imageScaleRange, imageScaleVal);
      applyFill();
    });
    syncPctLabel(imageScaleRange, imageScaleVal);
  }
  if (imageScaleXRange) {
    imageScaleXRange.addEventListener('input', () => {
      syncPctLabel(imageScaleXRange, imageScaleXVal);
      applyFill();
    });
    syncPctLabel(imageScaleXRange, imageScaleXVal);
  }
  if (imageScaleYRange) {
    imageScaleYRange.addEventListener('input', () => {
      syncPctLabel(imageScaleYRange, imageScaleYVal);
      applyFill();
    });
    syncPctLabel(imageScaleYRange, imageScaleYVal);
  }

  // ---------- ФІЛЬТР (поверх фону) ----------
  function getFilterMode() {
    const active = filterModeBtns.find(b => b.classList.contains('is-active'));
    return active ? active.dataset.filterMode : 'off';
  }

  function setFilterMode(mode) {
    filterModeBtns.forEach(b => b.classList.toggle('is-active', b.dataset.filterMode === mode));
    if (filterGroupColor) filterGroupColor.style.display = (mode === 'color') ? '' : 'none';
    if (filterGroupGrad)  filterGroupGrad.style.display  = (mode === 'gradient') ? '' : 'none';
  }

  if (filterModeBtns.length) {
    // початково
    setFilterMode(getFilterMode());
    filterModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setFilterMode(btn.dataset.filterMode || 'off');
        applyFill();
      });
    });
  }

  // кольорові пари для фільтра
  bindColorPair(filterColorInput, filterColorText);
  bindColorPair(fGrad1Input, fGrad1Text);
  bindColorPair(fGrad2Input, fGrad2Text);
  bindColorPair(fGrad3Input, fGrad3Text);

  // кут фільтра
  if (filterAngleRange) {
    const sync = () => {
      let v = Number(filterAngleRange.value);
      if (!Number.isFinite(v)) v = 90;
      v = Math.max(0, Math.min(360, Math.round(v)));
      filterAngleRange.value = String(v);
      if (filterAngleVal) filterAngleVal.textContent = v + "°";
      applyFill();
    };
    filterAngleRange.addEventListener('input', sync);
    // якщо є number-поле (не обовʼязково)
    if (filterAngleNumber) {
      const syncFromNumber = () => {
        let v = Number(filterAngleNumber.value);
        if (!Number.isFinite(v)) v = 90;
        v = Math.max(0, Math.min(360, Math.round(v)));
        filterAngleNumber.value = String(v);
        filterAngleRange.value = String(v);
        if (filterAngleVal) filterAngleVal.textContent = v + "°";
        applyFill();
      };
      filterAngleNumber.addEventListener('change', syncFromNumber);
    }
    // первинне оновлення лейбла
    if (filterAngleVal) filterAngleVal.textContent = String(filterAngleRange.value) + "°";
  }

  // прозорість фільтра
  if (filterOpacityRange && filterOpacityNumber) {
    const sync = (fromSlider) => {
      if (fromSlider) {
        filterOpacityNumber.value = filterOpacityRange.value;
      } else {
        let v = Number(filterOpacityNumber.value);
        if (!Number.isFinite(v)) v = 0;
        v = Math.max(0, Math.min(100, v));
        filterOpacityNumber.value = String(v);
        filterOpacityRange.value = String(v);
      }
      applyFill();
    };
    filterOpacityRange.addEventListener('input', () => sync(true));
    filterOpacityNumber.addEventListener('change', () => sync(false));
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => applyFill());
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const targets = getTargets();
      if (!targets.length) return;

      const menuItems = targets.filter(el => el instanceof HTMLElement && el.matches("[data-st-menu-item=\"1\"]"));
      if (menuItems.length) {
        menuItems.forEach(it => {
          it.style.removeProperty("--st-menu-item-bg");
          it.style.removeProperty("--st-menu-item-bg-h");
        });
        updateUIFromSelection();
        return;
      }

      const menuBlock = targets.find(el => el instanceof HTMLElement && el.matches("[data-st-menu=\"1\"]"));
      if (menuBlock) {
        menuBlock.style.removeProperty("--st-menu-item-bg");
        menuBlock.style.removeProperty("--st-menu-item-bg-h");
        updateUIFromSelection();
        return;
      }

      targets.forEach(el => {
        const t = resolveFillTarget(el);
        if (!t) return;
        clearElementFx00994(t);
        clearBlockSurfaceFx00995(t);
        t.classList.remove("st-bgfx");
        t.classList.remove("st-bgfx--canvasfixed");
        t.style.removeProperty("--st-bgfx-bg");
        t.style.removeProperty("--st-bgfx-bg-opacity");
        t.style.removeProperty("--st-bgfx-bg-size");
        t.style.removeProperty("--st-bgfx-bg-pos");
        t.style.removeProperty("--st-bgfx-bg-pos-x");
        t.style.removeProperty("--st-bgfx-bg-pos-y");
        t.style.removeProperty("--st-bgfx-gray");
        t.style.removeProperty("--st-bgfx-filter");
        t.style.removeProperty("--st-bgfx-filter-opacity");
        t.style.background = "none";
        t.style.backgroundImage = "";
        t.style.backgroundColor = "";
        t.style.filter = "";
      });

      updateUIFromSelection();
      try { notifyFillApplied_(targets, { mode: 'reset' }, 'reset'); } catch(e) {}
    });
  }


  // ---------- синхронізація UI з вибором ----------
  function updateUIFromSelection() {
    const targets = getTargets();
    updateTargetSummary(targets);
    if (!targets.length) return;
    const el = resolveFillTarget(targets[0]);
    if (!el) return;

    const cs = window.getComputedStyle(el);
    const bgImg = cs.backgroundImage;
    const bgCol = cs.backgroundColor;

    const fxBg = (cs.getPropertyValue('--st-bgfx-bg') || '').trim();
    const fxOpacityRaw = (cs.getPropertyValue('--st-bgfx-bg-opacity') || '').trim();
    const fxGrayRaw = (cs.getPropertyValue('--st-bgfx-gray') || '').trim();

    // 00995: block-surface FX are independent from text/content.
    const blockTransparencyRaw00995 = (cs.getPropertyValue('--st-block-surface-transparency-pct') || '').trim();
    const blockBlurPctRaw00995 = (cs.getPropertyValue('--st-block-surface-blur-pct') || '').trim();
    const blockTransparencyPct00995 = Math.round(clampPct00994(Number.parseFloat(blockTransparencyRaw00995), 0));
    const blockBlurPct00995 = Math.round(clampPct00994(Number.parseFloat(blockBlurPctRaw00995), 0));
    if (blockTransparencyRange) blockTransparencyRange.value = String(blockTransparencyPct00995);
    if (blockTransparencyNumber) blockTransparencyNumber.value = String(blockTransparencyPct00995);
    if (blockBlurRange) blockBlurRange.value = String(blockBlurPct00995);
    if (blockBlurNumber) blockBlurNumber.value = String(blockBlurPct00995);

    // 00994: independent element visual FX. 100% opacity / 0% blur is neutral.
    const elementOpacityRaw00994 = (cs.getPropertyValue('--st-element-fx-opacity') || '').trim();
    const elementBlurPctRaw00994 = (cs.getPropertyValue('--st-element-fx-blur-pct') || '').trim();
    const parsedElementOpacity00994 = Number.parseFloat(elementOpacityRaw00994);
    const parsedElementBlur00994 = Number.parseFloat(elementBlurPctRaw00994);
    const elementOpacityPct00994 = Math.round(Math.max(0, Math.min(1, Number.isFinite(parsedElementOpacity00994) ? parsedElementOpacity00994 : 1)) * 100);
    const elementBlurPct00994 = Math.round(clampPct00994(Number.isFinite(parsedElementBlur00994) ? parsedElementBlur00994 : 0, 0));
    if (elementOpacityRange) elementOpacityRange.value = String(elementOpacityPct00994);
    if (elementOpacityNumber) elementOpacityNumber.value = String(elementOpacityPct00994);
    if (elementBlurRange) elementBlurRange.value = String(elementBlurPct00994);
    if (elementBlurNumber) elementBlurNumber.value = String(elementBlurPct00994);

    // Якщо фон керується через .st-bgfx (v6+) — читаємо саме CSS-змінні
    if (fxBg && fxBg !== 'none') {
      // opacity
      const op = Math.max(0, Math.min(1, parseFloat(fxOpacityRaw || '1') || 1));
      const opPct = Math.round(op * 100);
      if (opacityRange) opacityRange.value = String(opPct);
      if (opacityNumber) opacityNumber.value = String(opPct);

      // gray
      const g = Math.max(0, Math.min(1, parseFloat(fxGrayRaw || '0') || 0));
      const gPct = Math.round(g * 100);
      if (grayRange) grayRange.value = String(gPct);
      if (grayNumber) grayNumber.value = String(gPct);

      if (fxBg.includes('linear-gradient')) {
        setMode('gradient');

        // кут
        const angM = fxBg.match(/linear-gradient\(\s*([0-9]+)\s*deg/i);
        const ang = angM ? Math.max(0, Math.min(360, parseInt(angM[1], 10) || 0)) : 90;
        if (gradAngleRange) gradAngleRange.value = String(ang);
        if (gradAngleNumber) gradAngleNumber.value = String(ang);

        // кольори (очікуємо hex, які ми і записуємо)
        const cols = fxBg.match(/#[0-9a-fA-F]{6}\b/g) || [];
        if (cols[0]) { if (grad1Input) grad1Input.value = cols[0]; if (grad1Text) grad1Text.value = cols[0]; }
        if (cols[1]) { if (grad2Input) grad2Input.value = cols[1]; if (grad2Text) grad2Text.value = cols[1]; }
        if (cols[2]) { if (grad3Input) grad3Input.value = cols[2]; if (grad3Text) grad3Text.value = cols[2]; }

      } else if (fxBg.includes('url(')) {
        setMode('image');
        const m = fxBg.match(/url\(["']?(.*?)["']?\)/);
        if (m && m[1] && imageUrlInput) {
          imageUrlInput.value = m[1];
          updateImagePickButtonPreview(m[1]);
        }

        // size / pos / custom sliders
        const sRaw = (cs.getPropertyValue('--st-bgfx-bg-size') || '').trim();
        const pRaw = (cs.getPropertyValue('--st-bgfx-bg-pos') || '').trim();
        const fixedRaw = (cs.getPropertyValue('--st-bgfx-canvas-fixed') || '').trim();

        if (imageSizeSelect) {
          const mSize = sRaw.match(/^\s*([0-9]{1,3})%\s+([0-9]{1,3})%\s*$/);
          if (mSize) {
            imageSizeSelect.value = 'custom';
            syncCustomSizeVisibility();
            const ex = Math.max(0, Math.min(400, parseInt(mSize[1], 10) || 100));
            const ey = Math.max(0, Math.min(400, parseInt(mSize[2], 10) || 100));
            // відновлюємо як scale=100 + шир/вис=ефективні
            if (imageScaleRange)  imageScaleRange.value  = '100';
            if (imageScaleXRange) imageScaleXRange.value = String(Math.max(0, Math.min(200, ex)));
            if (imageScaleYRange) imageScaleYRange.value = String(Math.max(0, Math.min(200, ey)));
            syncPctLabel(imageScaleRange,  imageScaleVal);
            syncPctLabel(imageScaleXRange, imageScaleXVal);
            syncPctLabel(imageScaleYRange, imageScaleYVal);
          } else if (sRaw) {
            imageSizeSelect.value = sRaw;
            syncCustomSizeVisibility();
          }
        }

        if (imagePosSelect) {
          const mPos = pRaw.match(/^\s*([0-9]{1,3})%\s+([0-9]{1,3})%\s*$/);
          if (mPos) {
            imagePosSelect.value = 'custom';
            syncCustomPosVisibility();
            const px = Math.max(1, Math.min(100, parseInt(mPos[1], 10) || 50));
            const py = Math.max(1, Math.min(100, parseInt(mPos[2], 10) || 50));
            if (imagePosXRange) imagePosXRange.value = String(px);
            if (imagePosYRange) imagePosYRange.value = String(py);
            syncPosLabel(imagePosXRange, imagePosXVal);
            syncPosLabel(imagePosYRange, imagePosYVal);
          } else if (pRaw) {
            imagePosSelect.value = pRaw;
            syncCustomPosVisibility();
          }
        }

        if (imageCanvasFixedInput) {
          imageCanvasFixedInput.checked = (fixedRaw === '1');
        }
      } else {
        setMode('color');
        updateImagePickButtonPreview('');
        // колір може бути hex
        const colM = fxBg.match(/#[0-9a-fA-F]{6}\b/);
        if (colM && colM[0]) {
          if (colorInput) colorInput.value = colM[0];
          if (colorText) colorText.value = colM[0];
        }
      }

      return;
    }


    if (bgImg && bgImg !== 'none' && bgImg.includes('gradient')) {
      setMode('gradient');
    } else if (bgImg && bgImg !== 'none' && bgImg.includes('url(')) {
      setMode('image');
      const m = bgImg.match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1] && imageUrlInput) {
        imageUrlInput.value = m[1];
        updateImagePickButtonPreview(m[1]);
      }
    } else {
      setMode('color');
      updateImagePickButtonPreview('');
      if (bgCol && bgCol !== 'rgba(0, 0, 0, 0)' && bgCol !== 'transparent') {
        const parsed = rgbaToHexAlpha(bgCol);
        const hex = parsed.hex;
        const alpha = parsed.alpha;
        if (colorInput) colorInput.value = hex;
        if (colorText) colorText.value = hex;
        const percent = Math.round(alpha * 100);
        const clamped = Math.max(0, Math.min(100, percent || 100));
        if (opacityRange)  opacityRange.value  = String(clamped);
        if (opacityNumber) opacityNumber.value = String(clamped);
      }
    }
  }

  function initSelectionSync() {
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) return;

    // Ctrl+клік: додаємо/знімаємо з manualTargets
    siteRoot.addEventListener('click', (e) => {
      const block = e.target.closest('.st-block, .st-section');
      if (!block || !siteRoot.contains(block)) {
        manualTargets = [];
        queueMicrotask(updateUIFromSelection);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        cleanManualTargets();
        const idx = manualTargets.indexOf(block);
        if (idx >= 0) {
          manualTargets.splice(idx, 1);
        } else {
          manualTargets.push(block);
        }
      } else {
        // звичайний клік — один елемент
        manualTargets = [block];
      }

      queueMicrotask(updateUIFromSelection);
    });

    // якщо інший код змінює is-active / is-selected
    const mo = new MutationObserver((mutations) => {
      let needSummary = false;
      let needKinds = false;

      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];

        if (m.type === 'attributes') {
          needSummary = true;
        }

        if (m.type === 'childList' && (guidesState.containers || guidesState.blocks)) {
          needKinds = true;
        }
      }

     if (needSummary) {
  setTimeout(() => {
    updateTargetSummary(getTargets());
  }, 0);
}

      if (needKinds) {
        markBlockGuideKinds();
      }
    });

    mo.observe(siteRoot, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class'],
      childList: true
    });

    updateUIFromSelection();
  }

  // ---------- Drag фону (позиція) для режиму "Довільна" ----------
  // Щоб не конфліктувало з виділенням/ресайзом, drag активується тільки з Alt.
  function initBgPositionDrag() {
    if (window.__ST_FILL_BG_POS_DRAG_INITED__) return;
    window.__ST_FILL_BG_POS_DRAG_INITED__ = true;

    const canvas = document.getElementById('site-canvas');
    if (!canvas) return;

    let isDown = false;
    let isDragging = false;
    let start = null;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const canDragNow = (ev) => {
      if (!ev) return false;
      if (!imagePosSelect || imagePosSelect.value !== 'custom') return false;

      // працює тільки для "Картинка"
      const modeBtn = modeButtons.find(b => b.classList.contains('is-active'));
      const mode = modeBtn ? modeBtn.dataset.fillMode : 'color';
      if (mode !== 'image') return false;

      // [00447][CRITICAL FIX]
      // Коментар нижче вже казав "тільки з Alt", але фактичної перевірки Alt не було.
      // Через це звичайне перетягування/resize блока у Footer могло запускати drag
      // позиції фону і вставляти/переставляти картинку в активний елемент.
      if (!ev.altKey) {
        logFillPerf_('perf:fill-bg-position-drag-blocked-no-alt-00447', { reason: 'no-alt', pointerType: ev.pointerType || '', target: ev.target?.className || '' }, 'info', 1400);
        return false;
      }
      if (isFillBgDragBlockedTarget_(ev)) {
        logFillPerf_('perf:fill-bg-position-drag-blocked-edit-handle-00447', { reason: 'edit-handle', target: ev.target?.className || '' }, 'info', 1400);
        return false;
      }

      // має бути хоч 1 таргет
      const targets = getTargets();
      const t = (targets && targets[0]) ? targets[0] : null;
      if (!t) return false;

      // drag дозволяємо ТІЛЬКИ якщо курсор реально над активним елементом
      const elAt = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!elAt) return false;
      if (elAt !== t && !t.contains(elAt)) return false;

      return true;
    };

    const onUp = () => {
      isDown = false;
      isDragging = false;
      start = null;
    };

    canvas.addEventListener('pointerdown', (ev) => {
      if (!canDragNow(ev)) return;
      isDown = true;
      isDragging = false;

      const targets = getTargets();
      const t = targets && targets[0];
      if (!t) return;

      const r = t.getBoundingClientRect();
      const w = Math.max(1, r.width);
      const h = Math.max(1, r.height);

      const sx = parseInt(imagePosXRange?.value || '50', 10) || 50;
      const sy = parseInt(imagePosYRange?.value || '50', 10) || 50;

      start = {
        pointerId: ev.pointerId,
        clientX: ev.clientX,
        clientY: ev.clientY,
        w,
        h,
        sx,
        sy,
      };

      canvas.setPointerCapture?.(ev.pointerId);
    }, true);

    canvas.addEventListener('pointermove', (ev) => {
      if (!isDown || !start) return;
      if (!ev.altKey) { onUp(); return; }
      if (!canDragNow(ev)) return;

      const dx = ev.clientX - start.clientX;
      const dy = ev.clientY - start.clientY;
      if (!isDragging) {
        if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
        isDragging = true;
      }

      ev.preventDefault();
      ev.stopPropagation();

      const px = clamp(Math.round(start.sx + (dx / start.w) * 100), 1, 100);
      const py = clamp(Math.round(start.sy + (dy / start.h) * 100), 1, 100);

      if (imagePosXRange) imagePosXRange.value = String(px);
      if (imagePosYRange) imagePosYRange.value = String(py);
      if (imagePosXVal) imagePosXVal.textContent = `${px}%`;
      if (imagePosYVal) imagePosYVal.textContent = `${py}%`;

      applyFill();
    }, true);

    canvas.addEventListener('pointerup', onUp, true);
    canvas.addEventListener('pointercancel', onUp, true);
  }

  initBgPositionDrag();

  // ✅ Синхронізація з реальним selection, зокрема Header/Footer,
  // де подія часто приходить як detail.element без detail.elements.
  if (!sectionEl.dataset.fillSelectionEventBound) {
    sectionEl.dataset.fillSelectionEventBound = '1';
    document.addEventListener('st:selection-changed', () => {
      setTimeout(() => {
        try { updateUIFromSelection(); } catch (e) { console.warn('[fill] selection sync failed', e); }
      }, 0);
    });
  }

  initSelectionSync();
}
