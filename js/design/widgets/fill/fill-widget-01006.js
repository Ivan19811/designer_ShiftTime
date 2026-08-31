// ================================
// Тимчасовий state для guides (FIX)
// ================================
const guidesState = {
  enabled: false,
  items: []
};



// js/design/widgets/fill/fill-widget.js
// 01005: Fill no longer opens the native Chrome/Windows <input type="color"> picker.
// 01006: picker open is read-only. A color edit session starts only after the user actually changes the active color; every session re-reads the selected control value, so no previous element color can bleed into a newly selected element.
// The probe proved the native picker itself delivered only ~30Hz input while our handlers cost <=0.2ms.
// A lightweight in-app HSV picker owns the palette thumb at display RAF speed and emits canvas preview at <=30Hz.
// Solid Fill/Filter keep temporary RGB compositor preview layers; canonical color is written once on Done/outside close.
// Escape cancels without Store/history/root-save and restores the pre-open visual value.
// Surface / Fill / Filter are physically separate layers. Filter opacity is never baked into rgba colors.
// Block blur keeps one CSS-variable authority and preserves authored blur as the initial slider value.
// Continuous controls stay RAF-only with one final Store commit.
// Main live preview remains DOM-visual only; final/selection-loss commit is JSON-primary.
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
  // [00997][LIVE PREVIEW SESSION CACHE]
  // Expensive authored/computed surface discovery happens once at gesture start/first use.
  // Pointer input ticks only mutate lightweight CSS variables on the frozen target.
  let blockSurfacePreparedTargets00997_ = new Map();
  let filterPreparedTargets00999_ = new Map();
  let elementFxPreparedTargets00999_ = new Map();
  let fillVisualPreparedTargets00999_ = new Map();
  
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
          <button type="button" class="design-color st-color-trigger-01005" data-fill="color" value="#0f172a" aria-label="Вибрати колір заливки"></button>
          <input type="text" class="design-input" data-fill="colorText" value="#0f172a" placeholder="#0f172a" />
        </div>
      </div>

      <!-- ГРАДІЄНТ -->
      <div class="design-field" data-fill-group="gradient" hidden>
        <div class="design-field__label">Градієнт</div>
        <div class="design-fill-row">
          <label class="design-fill-label">1-й колір</label>
          <button type="button" class="design-color st-color-trigger-01005" data-fill="gradColor1" value="#0f172a" aria-label="Вибрати перший колір градієнта"></button>
          <input type="text" class="design-input" data-fill="gradColor1Text" value="#0f172a" />
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">2-й колір</label>
          <button type="button" class="design-color st-color-trigger-01005" data-fill="gradColor2" value="#1e293b" aria-label="Вибрати другий колір градієнта"></button>
          <input type="text" class="design-input" data-fill="gradColor2Text" value="#1e293b" />
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">3-й колір</label>
          <button type="button" class="design-color st-color-trigger-01005" data-fill="gradColor3" value="#334155" aria-label="Вибрати третій колір градієнта"></button>
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
          <div class="design-subnote design-fill-block-surface-fx-note">
            Прозорість фону керує тільки заливкою Колір/Градієнт/Картинка. Прозорість блока керує окремо початковою поверхнею контейнера й не змінює текст, кнопки та рамку. Розмитість блока розмиває тільки банер/фон позаду контейнера.
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
          «Прозорість фону» керує тільки явно заданою заливкою Колір/Градієнт/Картинка і не змінює поверхню блока. «Прозорість блока»: 0% — початкова поверхня контейнера видима, 100% — вона повністю прозора, але текст і рамка не змінюються. «Розмитість блока» розмиває банер/фон позаду контейнера, не розмиваючи текст. «Прозорість елемента» та «Розмитість елемента» окремо керують усім вмістом елемента. Для розмиття 5% = легкий ефект.
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
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterColor" value="#000000" aria-label="Вибрати колір фільтра"></button>
            <input type="text" class="design-input" data-fill="filterColorText" value="#000000">
          </div>
        </div>

        <!-- Фільтр: Градієнт (3 кольори) -->
        <div class="design-bg-filter-group" data-filter-group="gradient" style="display:none;">
          <div class="design-bg-row">
            <label>Колір 1</label>
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor1" value="#000000" aria-label="Вибрати перший колір градієнта фільтра"></button>
            <input type="text" class="design-input" data-fill="filterGradColor1Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 2</label>
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor2" value="#000000" aria-label="Вибрати другий колір градієнта фільтра"></button>
            <input type="text" class="design-input" data-fill="filterGradColor2Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 3</label>
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor3" value="#000000" aria-label="Вибрати третій колір градієнта фільтра"></button>
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
          <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor2" value="#000000" aria-label="Вибрати другий колір градієнта фільтра"></button>
          <input type="text" class="design-input" data-fill="filterGradColor2Text" value="#000000" />
        </div>
      `);
      if (!has3) rows.push(`
        <div class="design-fill-row">
          <label class="design-fill-label">3-й колір</label>
          <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor3" value="#000000" aria-label="Вибрати третій колір градієнта фільтра"></button>
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
  const filterOpacityVal    = sectionEl.querySelector('[data-fill-label="filterOpacity"]');

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
  const BLOCK_SURFACE_SOURCE_VAR_00996 = '--st-block-surface-source-b64';
  const BLOCK_SURFACE_BG_VAR_00998 = '--st-block-surface-bg';
  const BLOCK_SURFACE_BG_COLOR_VAR_00998 = '--st-block-surface-bg-color';
  const BLOCK_SURFACE_BG_SIZE_VAR_00998 = '--st-block-surface-bg-size';
  const BLOCK_SURFACE_BG_POS_VAR_00998 = '--st-block-surface-bg-pos';
  const BLOCK_SURFACE_BG_REPEAT_VAR_00998 = '--st-block-surface-bg-repeat';
  const BLOCK_SURFACE_LAYER_VERSION_VAR_00998 = '--st-block-surface-layer-v';
  // 00999 migration-only aliases. They are read once from 00998 state and then removed.
  // The canonical Fill source is --st-bgfx-bg; the canonical Filter source is --st-bgfx-filter.
  const FILL_LAYER_IMAGE_VAR_00998 = '--st-bgfx-layer-image';
  const FILL_FILTER_IMAGE_VAR_00998 = '--st-bgfx-filter-image';
  const FILL_GRADIENT_ANGLE_VAR_00999 = '--st-bgfx-gradient-angle';
  const FILL_GRADIENT_C1_VAR_00999 = '--st-bgfx-gradient-c1';
  const FILL_GRADIENT_C2_VAR_00999 = '--st-bgfx-gradient-c2';
  const FILL_GRADIENT_C3_VAR_00999 = '--st-bgfx-gradient-c3';
  const FILTER_ANGLE_VAR_00999 = '--st-bgfx-filter-angle';
  const FILTER_COLOR_VAR_01001 = '--st-bgfx-filter-color';
  const FILTER_C1_VAR_00999 = '--st-bgfx-filter-c1';
  const FILTER_C2_VAR_00999 = '--st-bgfx-filter-c2';
  const FILTER_C3_VAR_00999 = '--st-bgfx-filter-c3';
  const IMAGE_SCALE_VAR_00999 = '--st-bgfx-image-scale';
  const IMAGE_SCALE_X_VAR_00999 = '--st-bgfx-image-scale-x';
  const IMAGE_SCALE_Y_VAR_00999 = '--st-bgfx-image-scale-y';
  const FILTER_LAYER_CLASS_00999 = 'st-fill-filter-layer';
  const FILTER_LAYER_ATTR_00999 = 'data-st-fill-visual-layer';
  const FILL_AUTHORITY_VERSION_VAR_00999 = '--st-fill-authority-v';


  function fillGradientImage00999() {
    return `linear-gradient(var(${FILL_GRADIENT_ANGLE_VAR_00999},90deg), var(${FILL_GRADIENT_C1_VAR_00999},#0f172a), var(${FILL_GRADIENT_C2_VAR_00999},#1e293b), var(${FILL_GRADIENT_C3_VAR_00999},#334155))`;
  }

  function imageCustomSizeExpression00999() {
    return `calc(var(${IMAGE_SCALE_VAR_00999},100) * var(${IMAGE_SCALE_X_VAR_00999},100) / 100 * 1%) calc(var(${IMAGE_SCALE_VAR_00999},100) * var(${IMAGE_SCALE_Y_VAR_00999},100) / 100 * 1%)`;
  }

  function imageCustomPositionExpression00999() {
    return `var(--st-bgfx-bg-pos-x,50%) var(--st-bgfx-bg-pos-y,50%)`;
  }

  function markFillAuthority00999(target) {
    if (target instanceof HTMLElement) target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01006');
  }

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
    blockSurfacePreparedTargets00997_.clear();
    filterPreparedTargets00999_.clear();
    elementFxPreparedTargets00999_.clear();
    fillVisualPreparedTargets00999_.clear();
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

  function ensureFillEditSession00997_(reason = 'fill-edit-session') {
    const active = cleanSessionFillTargets00779_(activeFillEditSessionTargets00779_);
    if (active.length) return active;
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
    blockSurfacePreparedTargets00997_.clear();
    filterPreparedTargets00999_.clear();
    elementFxPreparedTargets00999_.clear();
    fillVisualPreparedTargets00999_.clear();
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
    'background-repeat','background-attachment','background-origin','background-clip','box-shadow',
    'backdrop-filter','-webkit-backdrop-filter'
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
    if (f <= 0) return 'none';
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
    if (String(target.dataset?.stFillCustomLayer || '') === '1') return;
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
      for (const prop of ['--st-bgfx-bg','--st-bgfx-bg-color','--st-bgfx-bg-opacity','--st-bgfx-bg-size','--st-bgfx-bg-pos','--st-bgfx-bg-repeat','--st-bgfx-bg-pos-x','--st-bgfx-bg-pos-y','--st-bgfx-gray','--st-bgfx-filter','--st-bgfx-filter-opacity',FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999,FILL_LAYER_IMAGE_VAR_00998,FILL_FILTER_IMAGE_VAR_00998,FILL_AUTHORITY_VERSION_VAR_00999]) {
        target.style.removeProperty(prop);
      }
    }
    target.style.removeProperty(ELEMENT_FX_SOURCE_VAR_00994);
    target.style.removeProperty(ELEMENT_FX_OWNS_BG_VAR_00994);
  }

  function clearElementFx00994(target) {
    if (!(target instanceof HTMLElement)) return;
    const snap = decodeElementFxSnapshot00994(target.style.getPropertyValue(ELEMENT_FX_SOURCE_VAR_00994));
    if (snap?.inline) {
      const surfaceAlphaRaw00996 = Number.parseFloat(target.style.getPropertyValue('--st-block-surface-alpha'));
      if (target.classList.contains('st-block-surfacefx') && Number.isFinite(surfaceAlphaRaw00996)) {
        target.style.setProperty('box-shadow', scaleShadowOpacity00994(snap?.computed?.boxShadow || 'none', Math.max(0, Math.min(1, surfaceAlphaRaw00996))), 'important');
      } else {
        restoreInlineProp00994(target, 'box-shadow', snap.inline['box-shadow']);
      }
    }
    target.classList.remove('st-element-visualfx');
    for (const prop of ['--st-element-fx-opacity','--st-element-fx-blur','--st-element-fx-blur-pct']) {
      target.style.removeProperty(prop);
    }
    releaseOwnedFxBackgroundIfUnused00995(target);
  }

  function readBlockSurfaceSource00996(target) {
    const inline = {};
    for (const prop of ELEMENT_FX_PROPS_00994) {
      const value = target.style.getPropertyValue(prop);
      const priority = target.style.getPropertyPriority(prop);
      inline[prop] = { present: value !== '' || priority !== '', value, priority };
    }
    const cs = getComputedStyle(target);
    const fxBg = (target.style.getPropertyValue('--st-bgfx-bg') || cs.getPropertyValue('--st-bgfx-bg') || '').trim();
    const fxBgColor = (target.style.getPropertyValue('--st-bgfx-bg-color') || cs.getPropertyValue('--st-bgfx-bg-color') || '').trim();
    return {
      inline,
      hadBgfx: target.classList.contains('st-bgfx'),
      ownsBgfx: target.style.getPropertyValue(ELEMENT_FX_OWNS_BG_VAR_00994).trim() === '1',
      fx: {
        bg: fxBg,
        bgColor: fxBgColor,
        bgOpacity: (target.style.getPropertyValue('--st-bgfx-bg-opacity') || cs.getPropertyValue('--st-bgfx-bg-opacity') || '').trim(),
        bgSize: (target.style.getPropertyValue('--st-bgfx-bg-size') || cs.getPropertyValue('--st-bgfx-bg-size') || '').trim(),
        bgPos: (target.style.getPropertyValue('--st-bgfx-bg-pos') || cs.getPropertyValue('--st-bgfx-bg-pos') || '').trim(),
        bgRepeat: (target.style.getPropertyValue('--st-bgfx-bg-repeat') || cs.getPropertyValue('--st-bgfx-bg-repeat') || '').trim(),
        gray: (target.style.getPropertyValue('--st-bgfx-gray') || cs.getPropertyValue('--st-bgfx-gray') || '').trim(),
        filter: (target.style.getPropertyValue('--st-bgfx-filter') || cs.getPropertyValue('--st-bgfx-filter') || '').trim(),
        filterOpacity: (target.style.getPropertyValue('--st-bgfx-filter-opacity') || cs.getPropertyValue('--st-bgfx-filter-opacity') || '').trim()
      },
      computed: {
        backgroundImage: cs.backgroundImage || 'none',
        backgroundColor: cs.backgroundColor || 'transparent',
        backgroundSize: cs.backgroundSize || 'auto',
        backgroundPosition: cs.backgroundPosition || '0% 0%',
        backgroundRepeat: cs.backgroundRepeat || 'repeat',
        boxShadow: cs.boxShadow || 'none',
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter || 'none'
      }
    };
  }

  function ensureBlockSurfaceSource00996(target) {
    const raw = target.style.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996).trim();
    if (raw) {
      const decoded = decodeElementFxSnapshot00994(raw);
      if (decoded) return decoded;
    }
    const snap = readBlockSurfaceSource00996(target);
    const encoded = encodeElementFxSnapshot00994(snap);
    if (encoded) target.style.setProperty(BLOCK_SURFACE_SOURCE_VAR_00996, encoded);
    return snap;
  }

  function normalizeCssSource00998(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function asLayerImage00998(value) {
    const raw = String(value || '').trim();
    if (!raw || raw === 'none' || raw === 'transparent' || raw === 'rgba(0, 0, 0, 0)') return 'none';
    if (/^(?:#|rgb\(|rgba\(|hsl\(|hsla\(|color\()/i.test(raw)) return `linear-gradient(${raw}, ${raw})`;
    return raw;
  }

  function parseBlurPx00999(value) {
    const raw = String(value || '').trim();
    const direct = raw.match(/^(-?[\d.]+)px$/i);
    if (direct) {
      const n = Number.parseFloat(direct[1]);
      return Number.isFinite(n) ? Math.max(0, n) : null;
    }
    const m = raw.match(/blur\(\s*(-?[\d.]+)px\s*\)/i);
    const n = m ? Number.parseFloat(m[1]) : NaN;
    return Number.isFinite(n) ? Math.max(0, n) : null;
  }

  function canonicalBlockBlurPx00999(target, snap = null) {
    if (!(target instanceof HTMLElement)) return 0;
    const direct = parseBlurPx00999(target.style.getPropertyValue('--st-block-surface-blur'));
    if (direct != null) return direct;
    const computedVar = parseBlurPx00999(getComputedStyle(target).getPropertyValue('--st-block-surface-blur'));
    if (computedVar != null) return computedVar;
    const sourceBlur = parseBlurPx00999(snap?.computed?.backdropFilter || '');
    return sourceBlur == null ? 0 : sourceBlur;
  }

  function ensureFilterLayer00999(target) {
    if (!(target instanceof HTMLElement)) return null;
    if (!target.classList.contains('st-block-surfacefx') || !target.classList.contains('st-bgfx')) return null;
    let layer = Array.from(target.children || []).find((child) => child instanceof HTMLElement && child.classList.contains(FILTER_LAYER_CLASS_00999));
    if (!(layer instanceof HTMLElement)) {
      layer = document.createElement('span');
      layer.className = FILTER_LAYER_CLASS_00999;
      layer.setAttribute(FILTER_LAYER_ATTR_00999, 'filter');
      layer.setAttribute('aria-hidden', 'true');
      target.appendChild(layer);
    }
    return layer;
  }

  function removeFilterLayer00999(target) {
    if (!(target instanceof HTMLElement)) return;
    for (const child of Array.from(target.children || [])) {
      if (child instanceof HTMLElement && child.classList.contains(FILTER_LAYER_CLASS_00999)) child.remove();
    }
  }

  function cssColorToken00999(token) {
    const raw = String(token || '').trim();
    if (!raw) return null;
    if (/^#[0-9a-f]{6}$/i.test(raw)) return { hex: normalizeHex(raw), alpha: 1 };
    if (/^#[0-9a-f]{3}$/i.test(raw)) return { hex: normalizeHex(raw), alpha: 1 };
    const comma = raw.replace(/\s+/g, '').match(/^rgba?\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d*\.?\d+))?\)$/i);
    if (comma) {
      const toHex = (v) => Math.max(0, Math.min(255, Math.round(Number(v) || 0))).toString(16).padStart(2, '0');
      return {
        hex: `#${toHex(comma[1])}${toHex(comma[2])}${toHex(comma[3])}`,
        alpha: Math.max(0, Math.min(1, comma[4] == null ? 1 : Number(comma[4]) || 0))
      };
    }
    const modern = raw.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s*\/\s*(\d*\.?\d+)%?)?\s*\)$/i);
    if (modern) {
      const toHex = (v) => Math.max(0, Math.min(255, Math.round(Number(v) || 0))).toString(16).padStart(2, '0');
      let a = modern[4] == null ? 1 : Number(modern[4]);
      if (String(raw).includes('%') && modern[4] != null) a /= 100;
      return { hex: `#${toHex(modern[1])}${toHex(modern[2])}${toHex(modern[3])}`, alpha: Math.max(0, Math.min(1, Number.isFinite(a) ? a : 1)) };
    }
    return null;
  }

  function cssVarTrim00999(target, cs, name) {
    if (!(target instanceof HTMLElement)) return '';
    return (target.style.getPropertyValue(name) || cs?.getPropertyValue?.(name) || '').trim();
  }

  function parseFilterAuthority00999(target, cs = null) {
    if (!(target instanceof HTMLElement)) return { mode: 'off', opacity: 0, image: 'none', colors: [], angle: 90, legacyEmbeddedAlpha: false };
    const style = cs || getComputedStyle(target);

    // 00999 canonical source first. 00998 layer-image is migration-only fallback.
    const canonicalSource = cssVarTrim00999(target, style, '--st-bgfx-filter');
    const legacySource = cssVarTrim00999(target, style, FILL_FILTER_IMAGE_VAR_00998);
    const source = canonicalSource || legacySource;
    const externalRaw = cssVarTrim00999(target, style, '--st-bgfx-filter-opacity');
    const externalParsed = Number.parseFloat(externalRaw);
    let opacity = Number.isFinite(externalParsed) ? Math.max(0, Math.min(1, externalParsed)) : 0;
    if (!source || source === 'none') return { mode: 'off', opacity, image: 'none', colors: [], angle: 90, legacyEmbeddedAlpha: false };

    // New 00999 variable-backed gradients keep angle/colors as their own authorities.
    const solidColorVar01001 = cssVarTrim00999(target, style, FILTER_COLOR_VAR_01001);
    const c1Var = cssVarTrim00999(target, style, FILTER_C1_VAR_00999);
    const c2Var = cssVarTrim00999(target, style, FILTER_C2_VAR_00999);
    const c3Var = cssVarTrim00999(target, style, FILTER_C3_VAR_00999);
    const angleVarRaw = cssVarTrim00999(target, style, FILTER_ANGLE_VAR_00999);
    const angleVar = Number.parseFloat(angleVarRaw);
    if (/var\(--st-bgfx-filter-color/i.test(source) && solidColorVar01001) {
      const c = normalizeHex(solidColorVar01001);
      return { mode: 'color', opacity, image: source, colors: [c, c, c], angle: 90, legacyEmbeddedAlpha: false };
    }
    if (/var\(--st-bgfx-filter-c1/i.test(source) && c1Var) {
      const colors = [normalizeHex(c1Var), normalizeHex(c2Var || c1Var), normalizeHex(c3Var || c2Var || c1Var)];
      const angle = Number.isFinite(angleVar) ? Math.max(0, Math.min(360, angleVar)) : 90;
      return { mode: 'gradient', opacity, image: source, colors, angle, legacyEmbeddedAlpha: false };
    }

    const tokens = source.match(/#[0-9a-fA-F]{3,6}\b|rgba?\([^)]*\)/g) || [];
    const parsed = tokens.map(cssColorToken00999).filter(Boolean);
    const colors = parsed.map((item) => item.hex);
    const alphas = parsed.map((item) => item.alpha);
    const angleMatch = source.match(/linear-gradient\(\s*(-?[\d.]+)deg/i);
    const angle = Number.isFinite(angleVar)
      ? Math.max(0, Math.min(360, angleVar))
      : (angleMatch ? Math.max(0, Math.min(360, Number.parseFloat(angleMatch[1]) || 0)) : 90);
    const sameColor = colors.length >= 2 && colors.every((hex) => hex === colors[0]);
    const mode = (!/linear-gradient/i.test(source) && colors.length === 1) || (sameColor && !angleMatch && colors.length <= 2) ? 'color' : 'gradient';
    const sameAlpha = alphas.length > 0 && alphas.every((a) => Math.abs(a - alphas[0]) < 0.001);
    const embeddedAlpha = sameAlpha ? alphas[0] : 1;
    const legacyEmbeddedAlpha = opacity >= 0.999 && embeddedAlpha < 0.999;
    if (legacyEmbeddedAlpha) opacity = embeddedAlpha;

    const c1 = colors[0] || '#000000';
    const c2 = colors[1] || c1;
    const c3 = colors[2] || c2;
    return { mode, opacity, image: source, colors: [c1, c2, c3], angle, legacyEmbeddedAlpha };
  }

  function filterImageFromCanonical00999(mode = 'off') {
    if (mode === 'color') {
      return `linear-gradient(var(${FILTER_COLOR_VAR_01001},#000000), var(${FILTER_COLOR_VAR_01001},#000000))`;
    }
    if (mode === 'gradient') {
      return `linear-gradient(var(${FILTER_ANGLE_VAR_00999},90deg), var(${FILTER_C1_VAR_00999},#000000), var(${FILTER_C2_VAR_00999},#000000), var(${FILTER_C3_VAR_00999},#000000))`;
    }
    return 'none';
  }

  function canonicalizeFilterAuthority00999(target, cs = null) {
    if (!(target instanceof HTMLElement)) return null;
    const parsed = parseFilterAuthority00999(target, cs);
    if (parsed.mode !== 'off') {
      const c1 = parsed.colors[0] || '#000000';
      const c2 = parsed.colors[1] || c1;
      const c3 = parsed.colors[2] || c2;
      if (parsed.mode === 'color') {
        target.style.setProperty(FILTER_COLOR_VAR_01001, c1);
        target.style.removeProperty(FILTER_C1_VAR_00999);
        target.style.removeProperty(FILTER_C2_VAR_00999);
        target.style.removeProperty(FILTER_C3_VAR_00999);
        target.style.removeProperty(FILTER_ANGLE_VAR_00999);
      } else {
        target.style.removeProperty(FILTER_COLOR_VAR_01001);
        target.style.setProperty(FILTER_C1_VAR_00999, c1);
        target.style.setProperty(FILTER_C2_VAR_00999, c2);
        target.style.setProperty(FILTER_C3_VAR_00999, c3);
        target.style.setProperty(FILTER_ANGLE_VAR_00999, `${parsed.angle}deg`);
      }
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999(parsed.mode));
      target.style.setProperty('--st-bgfx-filter-opacity', String(parsed.opacity));
    } else if (!target.style.getPropertyValue('--st-bgfx-filter-opacity').trim()) {
      target.style.setProperty('--st-bgfx-filter-opacity', '0');
    }
    // Migration aliases are never authorities in 00999.
    target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
    target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01006');
    ensureFilterLayer00999(target);
    return parsed;
  }

  function filterImageFromState00999(state) {
    const mode = state?.filterMode || 'off';
    if (mode === 'color') return filterImageFromCanonical00999('color');
    if (mode === 'gradient') return filterImageFromCanonical00999('gradient');
    return 'none';
  }

  function writeFilterSourceState00999(target, state) {
    if (!(target instanceof HTMLElement)) return 'none';
    const mode = state?.filterMode || 'off';
    if (mode === 'off') {
      target.style.removeProperty('--st-bgfx-filter');
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.removeProperty(FILTER_C1_VAR_00999);
      target.style.removeProperty(FILTER_C2_VAR_00999);
      target.style.removeProperty(FILTER_C3_VAR_00999);
      target.style.removeProperty(FILTER_ANGLE_VAR_00999);
      target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      return 'none';
    }
    const c1 = normalizeHex(mode === 'color' ? (state?.filterColorRaw || '#000000') : (state?.filterG1Raw || '#000000'));
    const c2 = normalizeHex(mode === 'color' ? c1 : (state?.filterG2Raw || c1));
    const c3 = normalizeHex(mode === 'color' ? c1 : (state?.filterG3Raw || c2));
    const angle = Number.isFinite(Number(state?.filterAngle)) ? Math.max(0, Math.min(360, Number(state.filterAngle))) : 90;
    if (mode === 'color') {
      target.style.setProperty(FILTER_COLOR_VAR_01001, c1);
      target.style.removeProperty(FILTER_C1_VAR_00999);
      target.style.removeProperty(FILTER_C2_VAR_00999);
      target.style.removeProperty(FILTER_C3_VAR_00999);
      target.style.removeProperty(FILTER_ANGLE_VAR_00999);
    } else {
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.setProperty(FILTER_C1_VAR_00999, c1);
      target.style.setProperty(FILTER_C2_VAR_00999, c2);
      target.style.setProperty(FILTER_C3_VAR_00999, c3);
      target.style.setProperty(FILTER_ANGLE_VAR_00999, `${angle}deg`);
    }
    const image = filterImageFromCanonical00999(mode);
    target.style.setProperty('--st-bgfx-filter', image);
    target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
    return image;
  }

  function ensureTrueBlockSurfaceLayer00996(target, snap) {
    const cs = getComputedStyle(target);
    const fx = snap?.fx || {};
    const authoredBg = String(snap?.computed?.backgroundImage || 'none');
    const authoredColor = String(snap?.computed?.backgroundColor || 'transparent');
    const authoredSize = String(snap?.computed?.backgroundSize || 'auto');
    const authoredPos = String(snap?.computed?.backgroundPosition || '0% 0%');
    const authoredRepeat = String(snap?.computed?.backgroundRepeat || 'repeat');

    // 00998: the authored/template surface gets its own canonical layer.
    // It is never stored in --st-bgfx-bg, which is reserved for an explicit Fill layer.
    target.style.setProperty(BLOCK_SURFACE_BG_VAR_00998, authoredBg || 'none');
    target.style.setProperty(BLOCK_SURFACE_BG_COLOR_VAR_00998, authoredColor || 'transparent');
    target.style.setProperty(BLOCK_SURFACE_BG_SIZE_VAR_00998, authoredSize || 'auto');
    target.style.setProperty(BLOCK_SURFACE_BG_POS_VAR_00998, authoredPos || '0% 0%');
    target.style.setProperty(BLOCK_SURFACE_BG_REPEAT_VAR_00998, authoredRepeat || 'repeat');
    target.style.setProperty(BLOCK_SURFACE_LAYER_VERSION_VAR_00998, '00999');

    const currentFxBg = (target.style.getPropertyValue('--st-bgfx-bg') || cs.getPropertyValue('--st-bgfx-bg') || '').trim();
    const currentFxColor = (target.style.getPropertyValue('--st-bgfx-bg-color') || cs.getPropertyValue('--st-bgfx-bg-color') || '').trim();
    const explicit00998 = String(target.dataset?.stFillCustomLayer || '') === '1';

    // 00996/00997 migrated the authored surface into --st-bgfx-bg. That made
    // "background opacity" and "block transparency" operate on the same pixels.
    // If the original snapshot says the block did not have BGFX, detach that old
    // merged copy once when the user edits the surface. Explicit 00998 fills are preserved.
    const oldMergedSurface00998 = !explicit00998 && !snap?.hadBgfx && (
      (currentFxBg && currentFxBg !== 'none') ||
      (currentFxColor && currentFxColor !== 'transparent' && currentFxColor !== 'rgba(0, 0, 0, 0)')
    );

    if (oldMergedSurface00998) {
      target.style.setProperty('--st-bgfx-bg', 'none');
      target.style.setProperty('--st-bgfx-bg-color', 'transparent');
      target.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
      target.style.setProperty('--st-bgfx-bg-opacity', '1');
      delete target.dataset.stFillMode;
      delete target.dataset.stFillCustomLayer;
    } else if (explicit00998 || snap?.hadBgfx) {
      const preserved = currentFxBg || fx.bg || target.style.getPropertyValue(FILL_LAYER_IMAGE_VAR_00998).trim() || 'none';
      target.style.setProperty('--st-bgfx-bg', preserved);
      target.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
      if (snap?.hadBgfx && !explicit00998) target.dataset.stFillCustomLayer = '1';
    } else {
      target.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
    }

    if (!target.classList.contains('st-bgfx')) target.classList.add('st-bgfx');
    if (!target.style.getPropertyValue(ELEMENT_FX_OWNS_BG_VAR_00994).trim()) {
      target.style.setProperty(ELEMENT_FX_OWNS_BG_VAR_00994, snap?.hadBgfx ? '0' : '1');
    }

    // Preserve only real pre-existing Fill state. Never synthesize defaults here:
    // a block-surface gesture must not mutate background/filter authorities.
    if (fx.bgOpacity && !target.style.getPropertyValue('--st-bgfx-bg-opacity').trim()) target.style.setProperty('--st-bgfx-bg-opacity', fx.bgOpacity);
    if (fx.bgSize && !target.style.getPropertyValue('--st-bgfx-bg-size').trim()) target.style.setProperty('--st-bgfx-bg-size', fx.bgSize);
    if (fx.bgPos && !target.style.getPropertyValue('--st-bgfx-bg-pos').trim()) target.style.setProperty('--st-bgfx-bg-pos', fx.bgPos);
    if (fx.bgRepeat && !target.style.getPropertyValue('--st-bgfx-bg-repeat').trim()) target.style.setProperty('--st-bgfx-bg-repeat', fx.bgRepeat);
    if (fx.gray && !target.style.getPropertyValue('--st-bgfx-gray').trim()) target.style.setProperty('--st-bgfx-gray', fx.gray);
    if (fx.filter && !target.style.getPropertyValue('--st-bgfx-filter').trim()) target.style.setProperty('--st-bgfx-filter', fx.filter);
    if (fx.filterOpacity && !target.style.getPropertyValue('--st-bgfx-filter-opacity').trim()) target.style.setProperty('--st-bgfx-filter-opacity', fx.filterOpacity);

    // Inline !important remains the authority that neutralizes authored template
    // background declarations on the real element. Rendering now happens in two layers.
    target.style.setProperty('background', 'transparent', 'important');
    target.style.setProperty('background-image', 'none', 'important');
    target.style.setProperty('background-color', 'transparent', 'important');
  }

  function restoreBlockSurfaceInline00996(target, snap) {
    if (!snap?.inline) return;
    for (const prop of ['background','background-image','background-color','background-size','background-position','background-repeat','background-attachment','background-origin','background-clip','backdrop-filter','-webkit-backdrop-filter']) {
      restoreInlineProp00994(target, prop, snap.inline[prop]);
    }
  }

  function effectiveElementOpacity00996(target) {
    const raw = target.style.getPropertyValue('--st-element-fx-opacity').trim();
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }

  function prepareBlockSurfaceTarget00997(el) {
    const target = resolveFillTarget(el);
    if (!(target instanceof HTMLElement) || !target.isConnected) return null;
    const cached = blockSurfacePreparedTargets00997_.get(target);
    if (cached) return cached;

    // Expensive source capture / computed-style reads happen exactly once per gesture.
    const snap = ensureBlockSurfaceSource00996(target);
    ensureElementFxSource00994(target);
    ensureTrueBlockSurfaceLayer00996(target, snap);
    target.classList.add('st-block-surfacefx');

    // 00999: one blur authority. Preserve the authored/computed blur as the initial
    // value instead of snapping an already blurred template to 0px on first pointerdown.
    if (!target.style.getPropertyValue('--st-block-surface-blur').trim()) {
      const initialBlurPx00999 = canonicalBlockBlurPx00999(target, snap);
      target.style.setProperty('--st-block-surface-blur', `${Math.round(initialBlurPx00999 * 100) / 100}px`);
    }
    target.style.removeProperty('--st-block-surface-blur-pct');

    // Template CSS can itself contain backdrop-filter:...!important. Inline !important
    // is only the consumer; --st-block-surface-blur is the single state authority.
    target.style.setProperty('-webkit-backdrop-filter', 'blur(var(--st-block-surface-blur, 0px))', 'important');
    target.style.setProperty('backdrop-filter', 'blur(var(--st-block-surface-blur, 0px))', 'important');
    target.style.setProperty('box-shadow', 'var(--st-block-surface-shadow, none)', 'important');
    ensureFilterLayer00999(target);

    const prepared = {
      target,
      snap,
      sourceShadow: String(snap?.computed?.boxShadow || 'none')
    };
    blockSurfacePreparedTargets00997_.set(target, prepared);
    return prepared;
  }

  function clearBlockSurfaceFx00995(target) {
    if (!(target instanceof HTMLElement)) return;
    const snap = decodeElementFxSnapshot00994(target.style.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996));
    target.classList.remove('st-block-surfacefx');
    for (const prop of ['--st-block-surface-alpha','--st-block-surface-transparency-pct','--st-block-surface-blur','--st-block-surface-blur-pct','--st-block-surface-shadow',BLOCK_SURFACE_BG_VAR_00998,BLOCK_SURFACE_BG_COLOR_VAR_00998,BLOCK_SURFACE_BG_SIZE_VAR_00998,BLOCK_SURFACE_BG_POS_VAR_00998,BLOCK_SURFACE_BG_REPEAT_VAR_00998,BLOCK_SURFACE_LAYER_VERSION_VAR_00998]) {
      target.style.removeProperty(prop);
    }
    if (snap) {
      const hasCustomFill00998 = String(target.dataset?.stFillCustomLayer || '') === '1';
      if (!hasCustomFill00998) restoreBlockSurfaceInline00996(target, snap);
      else {
        target.style.setProperty('background', 'transparent', 'important');
        target.style.setProperty('background-image', 'none', 'important');
        target.style.setProperty('background-color', 'transparent', 'important');
      }
      const elementOpacity = effectiveElementOpacity00996(target);
      if (target.classList.contains('st-element-visualfx')) {
        target.style.setProperty('box-shadow', scaleShadowOpacity00994(snap?.computed?.boxShadow || 'none', elementOpacity), 'important');
      } else {
        restoreInlineProp00994(target, 'box-shadow', snap.inline?.['box-shadow']);
      }
    }
    target.style.removeProperty(BLOCK_SURFACE_SOURCE_VAR_00996);
    removeFilterLayer00999(target);
    blockSurfacePreparedTargets00997_.delete(target);
    releaseOwnedFxBackgroundIfUnused00995(target);
  }

  function applyBlockTransparencyToElement00999(el, transparencyPct) {
    const prepared = prepareBlockSurfaceTarget00997(el);
    if (!prepared) return false;
    const { target, sourceShadow } = prepared;
    const trPct = clampPct00994(transparencyPct, 0);
    const surfaceAlpha = Math.max(0, Math.min(1, 1 - (trPct / 100)));

    // 00999 single authority: this slider owns only --st-block-surface-alpha.
    target.style.setProperty('--st-block-surface-alpha', String(surfaceAlpha));
    target.style.removeProperty('--st-block-surface-transparency-pct');
    const elementOpacity = effectiveElementOpacity00996(target);
    target.style.setProperty('--st-block-surface-shadow', scaleShadowOpacity00994(sourceShadow, surfaceAlpha * elementOpacity));
    return true;
  }

  function applyBlockBlurToElement00999(el, blurPct) {
    const prepared = prepareBlockSurfaceTarget00997(el);
    if (!prepared) return false;
    const { target } = prepared;
    const blPct = clampPct00994(blurPct, 0);
    const blurPx = Math.round((blPct / 100) * BLOCK_SURFACE_BLUR_MAX_PX_00995 * 100) / 100;

    // 00999 single authority: UI percent is derived from this px value, never stored separately.
    target.style.setProperty('--st-block-surface-blur', `${blurPx}px`);
    target.style.removeProperty('--st-block-surface-blur-pct');
    return true;
  }

  function applyBlockTransparency00999(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'block-transparency-live' : 'block-transparency-final')
      : getTargets();
    if (!targets.length) return false;
    const transparencyPct = getBlockTransparencyPct00995();
    targets.forEach(el => applyBlockTransparencyToElement00999(el, transparencyPct));
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, {
      mode: 'block-transparency',
      blockTransparencyPct: transparencyPct,
      blockSurfaceAlpha: 1 - (transparencyPct / 100),
      authority: '--st-block-surface-alpha'
    }, opts?.live ? 'block-transparency-live' : 'block-transparency', opts);
    if (opts?.endSession === true) endFillEditSession00779_('block-transparency-final');
    return true;
  }

  function applyBlockBlur00999(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'block-blur-live' : 'block-blur-final')
      : getTargets();
    if (!targets.length) return false;
    const blurPct = getBlockBlurPct00995();
    const blurPx = (blurPct / 100) * BLOCK_SURFACE_BLUR_MAX_PX_00995;
    targets.forEach(el => applyBlockBlurToElement00999(el, blurPct));
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, {
      mode: 'block-blur',
      blockBlurPct: blurPct,
      blockBlurPx: blurPx,
      authority: '--st-block-surface-blur'
    }, opts?.live ? 'block-blur-live' : 'block-blur', opts);
    if (opts?.endSession === true) endFillEditSession00779_('block-blur-final');
    return true;
  }

  // Compatibility path for explicit Apply: update both current UI values once.
  function applyBlockSurfaceFx00995(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'block-surface-fx-live' : 'block-surface-fx-final')
      : getTargets();
    if (!targets.length) return false;
    const transparencyPct = getBlockTransparencyPct00995();
    const blurPct = getBlockBlurPct00995();
    targets.forEach(el => {
      applyBlockTransparencyToElement00999(el, transparencyPct);
      applyBlockBlurToElement00999(el, blurPct);
    });
    updateTargetSummary(targets);
    notifyFillApplied_(targets, {
      mode: 'block-surface-fx',
      blockTransparencyPct: transparencyPct,
      blockBlurPct: blurPct,
      authority: '00999-split'
    }, opts?.live ? 'block-surface-fx-live' : 'block-surface-fx', opts);
    if (opts?.endSession === true) endFillEditSession00779_('block-surface-fx-final');
    return true;
  }

  function prepareElementVisualFx00999(el) {
    const target = resolveFillTarget(el);
    if (!(target instanceof HTMLElement)) return null;
    const cached = elementFxPreparedTargets00999_.get(target);
    if (cached) return cached;
    const snap = ensureElementFxSource00994(target);
    ensureElementFxBackgroundLayer00994(target, snap);
    target.classList.add('st-element-visualfx');
    if (!target.style.getPropertyValue('--st-element-fx-opacity').trim()) target.style.setProperty('--st-element-fx-opacity', '1');
    if (!target.style.getPropertyValue('--st-element-fx-blur').trim()) target.style.setProperty('--st-element-fx-blur', '0px');
    target.style.removeProperty('--st-element-fx-blur-pct');
    const prepared = { target, snap };
    elementFxPreparedTargets00999_.set(target, prepared);
    return prepared;
  }

  function currentElementBlurPx00999(target) {
    if (!(target instanceof HTMLElement)) return 0;
    return parseBlurPx00999(target.style.getPropertyValue('--st-element-fx-blur')) ?? 0;
  }

  function currentElementOpacity00999(target) {
    if (!(target instanceof HTMLElement)) return 1;
    const n = Number.parseFloat(target.style.getPropertyValue('--st-element-fx-opacity'));
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }

  function applyElementOpacityToElement00999(el, opacityPct) {
    const prepared = prepareElementVisualFx00999(el);
    if (!prepared) return false;
    const { target, snap } = prepared;
    const opacity = clampPct00994(opacityPct, 100) / 100;
    target.style.setProperty('--st-element-fx-opacity', String(opacity));
    const sourceShadow = String(snap?.computed?.boxShadow || 'none');
    const surfaceAlphaRaw = Number.parseFloat(target.style.getPropertyValue('--st-block-surface-alpha'));
    const surfaceAlpha = Number.isFinite(surfaceAlphaRaw) ? Math.max(0, Math.min(1, surfaceAlphaRaw)) : 1;
    target.style.setProperty('box-shadow', scaleShadowOpacity00994(sourceShadow, opacity * surfaceAlpha), 'important');
    if (opacity >= 0.999 && currentElementBlurPx00999(target) <= 0) clearElementFx00994(target);
    return true;
  }

  function applyElementBlurToElement00999(el, blurPct) {
    const prepared = prepareElementVisualFx00999(el);
    if (!prepared) return false;
    const { target } = prepared;
    const pct = clampPct00994(blurPct, 0);
    const blurPx = Math.round((pct / 100) * ELEMENT_BLUR_MAX_PX_00994 * 100) / 100;
    target.style.setProperty('--st-element-fx-blur', `${blurPx}px`);
    target.style.removeProperty('--st-element-fx-blur-pct');
    if (blurPx <= 0 && currentElementOpacity00999(target) >= 0.999) clearElementFx00994(target);
    return true;
  }

  function applyElementOpacity00999(opts = {}) {
    const targets = opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? 'element-opacity-live' : 'element-opacity-final')
      : getTargets();
    if (!targets.length) return false;
    const pct = getElementOpacityPct00994();
    targets.forEach(el => applyElementOpacityToElement00999(el, pct));
    updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'element-opacity', elementOpacity: pct / 100, authority: '--st-element-fx-opacity' }, opts?.live ? 'element-opacity-live' : 'element-opacity', opts);
    if (opts?.endSession === true) endFillEditSession00779_('element-opacity-final');
    return true;
  }

  function applyElementBlur00999(opts = {}) {
    const targets = opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? 'element-blur-live' : 'element-blur-final')
      : getTargets();
    if (!targets.length) return false;
    const pct = getElementBlurPct00994();
    targets.forEach(el => applyElementBlurToElement00999(el, pct));
    updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'element-blur', elementBlurPct: pct, elementBlurPx: (pct / 100) * ELEMENT_BLUR_MAX_PX_00994, authority: '--st-element-fx-blur' }, opts?.live ? 'element-blur-live' : 'element-blur', opts);
    if (opts?.endSession === true) endFillEditSession00779_('element-blur-final');
    return true;
  }

  // Compatibility path for explicit Apply only.
  function applyElementVisualFx00994(opts = {}) {
    const targets = opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? 'element-fx-live' : 'element-fx-final')
      : getTargets();
    if (!targets.length) return false;
    const opacityPct = getElementOpacityPct00994();
    const blurPct = getElementBlurPct00994();
    targets.forEach(el => {
      applyElementOpacityToElement00999(el, opacityPct);
      applyElementBlurToElement00999(el, blurPct);
    });
    updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'element-visual-fx', elementOpacity: opacityPct / 100, elementBlurPct: blurPct, authority: '00999-split' }, opts?.live ? 'element-visual-fx-live' : 'element-visual-fx', opts);
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
        bgVal = fillGradientImage00999();
        borderVal = c1;
      } else if (state.mode === 'image') {
        bgVal = state.imageUrl ? `url("${state.imageUrl}")` : 'none';
        borderVal = target.style.borderColor || 'rgba(148,163,184,.35)';
      }

      const alpha = (typeof state.alpha === 'number' && isFinite(state.alpha)) ? Math.max(0, Math.min(1, state.alpha)) : 1;
      const gray  = (typeof state.gray  === 'number' && isFinite(state.gray))  ? Math.max(0, Math.min(1, state.gray))  : 0;
      const needsFx = bgVal !== 'none' || alpha < 1 || gray > 0 || String(state.filterMode || 'off') !== 'off';

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

    // 00998: if this container already owns a block-surface contract, prepare the
    // two independent layers before changing the explicit Fill layer.
    if (target.classList.contains('st-block-surfacefx') || target.style.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996).trim()) {
      prepareBlockSurfaceTarget00997(target);
    }

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
      bgVal = fillGradientImage00999();
    } else if (state.mode === 'image') {
      bgVal = state.imageUrl ? `url("${state.imageUrl}")` : 'none';
    }

    const alpha = (typeof state.alpha === 'number' && isFinite(state.alpha)) ? Math.max(0, Math.min(1, state.alpha)) : 1;
    const gray  = (typeof state.gray  === 'number' && isFinite(state.gray))  ? Math.max(0, Math.min(1, state.gray))  : 0;

    const needsFx = bgVal !== 'none' || alpha < 1 || gray > 0 || String(state.filterMode || 'off') !== 'off';

    if (needsFx) {
      target.classList.add('st-bgfx');
      if (target.classList.contains('st-element-visualfx')) target.style.setProperty(ELEMENT_FX_OWNS_BG_VAR_00994, '0');
      target.style.setProperty('--st-bgfx-bg', bgVal);
      target.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
      if (state.mode === 'gradient') {
        target.style.setProperty(FILL_GRADIENT_ANGLE_VAR_00999, `${Math.max(0, Math.min(360, Number(state.angle) || 0))}deg`);
        target.style.setProperty(FILL_GRADIENT_C1_VAR_00999, normalizeHex(state.grad1Raw || '#0f172a'));
        target.style.setProperty(FILL_GRADIENT_C2_VAR_00999, normalizeHex(state.grad2Raw || '#1e293b'));
        target.style.setProperty(FILL_GRADIENT_C3_VAR_00999, normalizeHex(state.grad3Raw || '#334155'));
      } else {
        target.style.removeProperty(FILL_GRADIENT_ANGLE_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_C1_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_C2_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_C3_VAR_00999);
      }
      target.style.setProperty('--st-bgfx-bg-opacity', String(alpha));
      target.style.setProperty('--st-bgfx-gray', String(gray));
      target.dataset.stFillCustomLayer = '1';

      // 00999: filter source is always fully opaque. Opacity lives ONLY in
      // --st-bgfx-filter-opacity, so moving the opacity slider never rebuilds colors.
      const fMode = state.filterMode || 'off';
      const fOp = (typeof state.filterOpacity === 'number' && isFinite(state.filterOpacity)) ? Math.max(0, Math.min(1, state.filterOpacity)) : 0;
      const filterImage00999 = writeFilterSourceState00999(target, state);
      target.style.setProperty('--st-bgfx-filter-opacity', fMode === 'off' || filterImage00999 === 'none' ? '0' : String(fOp));
      target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      markFillAuthority00999(target);
      ensureFilterLayer00999(target);

      if (state.mode === 'image') {
        // [00424] Зберігаємо не лише тимчасовий url, а й id елемента галереї.
        // Blob URL після F5 недійсний, тому boot-bridge відновить фон з IndexedDB за itemId/folderId/cat.
        setGalleryAssetMeta_(target, state.__galleryAsset || { url: state.imageUrl || '' });
        target.dataset.stFillMode = 'image';
        // Розмір фон-картинки
        if (state.imageSize === 'custom') {
          const s  = Math.max(0, Math.min(200, Number(state.imageScale ?? 100) || 100));
          const sx = Math.max(0, Math.min(200, Number(state.imageScaleX ?? 100) || 100));
          const sy = Math.max(0, Math.min(200, Number(state.imageScaleY ?? 100) || 100));
          target.style.setProperty(IMAGE_SCALE_VAR_00999, String(s));
          target.style.setProperty(IMAGE_SCALE_X_VAR_00999, String(sx));
          target.style.setProperty(IMAGE_SCALE_Y_VAR_00999, String(sy));
          target.style.setProperty('--st-bgfx-bg-size', imageCustomSizeExpression00999());
        } else {
          target.style.removeProperty(IMAGE_SCALE_VAR_00999);
          target.style.removeProperty(IMAGE_SCALE_X_VAR_00999);
          target.style.removeProperty(IMAGE_SCALE_Y_VAR_00999);
          target.style.setProperty('--st-bgfx-bg-size', String(state.imageSize || 'cover'));
        }
        const customPos00999 = state.imagePosition === 'custom';
        const posX00999 = Math.max(1, Math.min(100, Math.round(Number(state.imagePosX ?? 50) || 50)));
        const posY00999 = Math.max(1, Math.min(100, Math.round(Number(state.imagePosY ?? 50) || 50)));
        if (customPos00999) {
          target.style.setProperty('--st-bgfx-bg-pos-x', `${posX00999}%`);
          target.style.setProperty('--st-bgfx-bg-pos-y', `${posY00999}%`);
          target.style.setProperty('--st-bgfx-bg-pos', imageCustomPositionExpression00999());
        } else {
          target.style.setProperty('--st-bgfx-bg-pos', String(state.imagePosition || 'center center'));
        }
        const posVal = customPos00999 ? `${posX00999}% ${posY00999}%` : String(state.imagePosition || 'center center');

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
        target.style.removeProperty('--st-bgfx-bg-pos-x');
        target.style.removeProperty('--st-bgfx-bg-pos-y');
        target.style.removeProperty(IMAGE_SCALE_VAR_00999);
        target.style.removeProperty(IMAGE_SCALE_X_VAR_00999);
        target.style.removeProperty(IMAGE_SCALE_Y_VAR_00999);
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
      target.style.removeProperty(FILL_GRADIENT_ANGLE_VAR_00999);
      target.style.removeProperty(FILL_GRADIENT_C1_VAR_00999);
      target.style.removeProperty(FILL_GRADIENT_C2_VAR_00999);
      target.style.removeProperty(FILL_GRADIENT_C3_VAR_00999);
      target.style.removeProperty(FILTER_ANGLE_VAR_00999);
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.removeProperty(FILTER_C1_VAR_00999);
      target.style.removeProperty(FILTER_C2_VAR_00999);
      target.style.removeProperty(FILTER_C3_VAR_00999);
      target.style.removeProperty(IMAGE_SCALE_VAR_00999);
      target.style.removeProperty(IMAGE_SCALE_X_VAR_00999);
      target.style.removeProperty(IMAGE_SCALE_Y_VAR_00999);
      target.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
      target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      target.style.removeProperty(FILL_AUTHORITY_VERSION_VAR_00999);
      removeFilterLayer00999(target);
      target.style.background = 'none';
      target.style.filter = '';
      clearGalleryAssetMeta_(target);
      delete target.dataset.stFillMode;
      delete target.dataset.stFillCustomLayer;
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
      for (const prop of [FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999]) t.style.removeProperty(prop);
      t.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
      t.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      t.style.removeProperty(FILL_AUTHORITY_VERSION_VAR_00999);
      removeFilterLayer00999(t);
      delete t.dataset.stFillCustomLayer;
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
      for (const prop of [FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999]) t.style.removeProperty(prop);
      t.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
      t.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      t.style.removeProperty(FILL_AUTHORITY_VERSION_VAR_00999);
      removeFilterLayer00999(t);
      delete t.dataset.stFillCustomLayer;
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

  // ---------- [00998] independent background-opacity layer ----------
  function applyBackgroundOpacity00998(opts = {}) {
    const useSessionTargets = opts?.useSessionTargets === true;
    const targets = useSessionTargets
      ? getFillEditSessionTargets00779_(opts?.live ? 'background-opacity-live' : 'background-opacity-final')
      : getTargets();
    if (!targets.length) return false;
    const alpha = getOpacity() / 100;

    for (const el of targets) {
      const target = resolveFillTarget(el);
      if (!(target instanceof HTMLElement)) continue;

      // If 00996/00997 surface state exists, detach it from the Fill layer first.
      // After this point opacity changes only --st-bgfx-bg-opacity; authored surface
      // variables and block transparency are untouched.
      if (target.classList.contains('st-block-surfacefx') || target.style.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996).trim()) {
        prepareBlockSurfaceTarget00997(target);
        target.style.setProperty('--st-bgfx-bg-opacity', String(alpha));
        continue;
      }

      // Non-surface elements keep legacy Fill behavior, but an already-created BGFX
      // layer is never rebuilt from UI colors just because opacity moved.
      if (!target.classList.contains('st-bgfx')) prepareFillVisualTarget00999(target);
      target.style.setProperty('--st-bgfx-bg-opacity', String(alpha));
      markFillAuthority00999(target);
    }

    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'background-opacity', alpha }, opts?.live ? 'background-opacity-live' : 'background-opacity', opts);
    if (opts?.endSession === true) endFillEditSession00779_('background-opacity-final');
    return true;
  }


  function prepareFilterTarget00999(el) {
    const target = resolveFillTarget(el);
    if (!(target instanceof HTMLElement) || !target.isConnected) return null;
    const cached = filterPreparedTargets00999_.get(target);
    if (cached) return cached;
    if (target.classList.contains('st-block-surfacefx') || target.style.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996).trim()) {
      prepareBlockSurfaceTarget00997(target);
    } else if (!target.classList.contains('st-bgfx')) {
      // One-time host creation at gesture start. RAF ticks never rebuild Fill/filter source.
      applyFillToElement(target, getFillStateFromUI());
    }
    canonicalizeFilterAuthority00999(target);
    if (target.classList.contains('st-block-surfacefx')) ensureFilterLayer00999(target);
    filterPreparedTargets00999_.set(target, target);
    return target;
  }

  function applyFilterOpacity00999(opts = {}) {
    const targets = opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? 'filter-opacity-live' : 'filter-opacity-final')
      : getTargets();
    if (!targets.length) return false;
    const opacity = Math.max(0, Math.min(1, Number(filterOpacityRange?.value ?? filterOpacityNumber?.value ?? 0) / 100));
    for (const el of targets) {
      const target = prepareFilterTarget00999(el);
      if (!target) continue;
      // Single source: this gesture changes exactly one visual authority.
      target.style.setProperty('--st-bgfx-filter-opacity', String(opacity));
      target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01006');
    }
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'filter-opacity', filterOpacity: opacity, authority: '--st-bgfx-filter-opacity' }, opts?.live ? 'filter-opacity-live' : 'filter-opacity', opts);
    if (opts?.endSession === true) endFillEditSession00779_('filter-opacity-final');
    return true;
  }

  function applyFilterAngle00999(opts = {}) {
    const targets = opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? 'filter-angle-live' : 'filter-angle-final')
      : getTargets();
    if (!targets.length) return false;
    const angle = Math.max(0, Math.min(360, Number(filterAngleRange?.value ?? filterAngleNumber?.value ?? 90) || 0));
    let changed = false;
    for (const el of targets) {
      const target = prepareFilterTarget00999(el);
      if (!target) continue;
      const parsed = parseFilterAuthority00999(target);
      if (parsed.mode !== 'gradient') continue;
      target.style.setProperty(FILTER_ANGLE_VAR_00999, `${angle}deg`);
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('gradient'));
      target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      markFillAuthority00999(target);
      changed = true;
    }
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'filter-angle', filterAngle: angle, authority: FILTER_ANGLE_VAR_00999 }, opts?.live ? 'filter-angle-live' : 'filter-angle', opts);
    if (opts?.endSession === true) endFillEditSession00779_('filter-angle-final');
    return true;
  }

  function applyBackgroundGray00999(opts = {}) {
    const targets = opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? 'background-gray-live' : 'background-gray-final')
      : getTargets();
    if (!targets.length) return false;
    const gray = Math.max(0, Math.min(1, Number(grayRange?.value ?? grayNumber?.value ?? 0) / 100));
    for (const el of targets) {
      const target = resolveFillTarget(el);
      if (!(target instanceof HTMLElement)) continue;
      if (!target.classList.contains('st-bgfx')) prepareFillVisualTarget00999(target);
      target.style.setProperty('--st-bgfx-gray', String(gray));
      target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01006');
    }
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'background-gray', gray, authority: '--st-bgfx-gray' }, opts?.live ? 'background-gray-live' : 'background-gray', opts);
    if (opts?.endSession === true) endFillEditSession00779_('background-gray-final');
    return true;
  }


  function prepareFillVisualTarget00999(el) {
    const target = resolveFillTarget(el);
    if (!(target instanceof HTMLElement) || !target.isConnected) return null;
    const cached = fillVisualPreparedTargets00999_.get(target);
    if (cached) return cached;
    if (target.classList.contains('st-block-surfacefx') || target.style.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996).trim()) {
      prepareBlockSurfaceTarget00997(target);
    }
    if (!target.classList.contains('st-bgfx')) applyFillToElement(target, getFillStateFromUI());
    markFillAuthority00999(target);
    fillVisualPreparedTargets00999_.set(target, target);
    return target;
  }

  function applyGradientAngle00999(opts = {}) {
    const targets = opts?.useSessionTargets === true ? getFillEditSessionTargets00779_('gradient-angle') : getTargets();
    if (!targets.length) return false;
    const angle = Math.max(0, Math.min(360, Number(gradAngleRange?.value ?? gradAngleNumber?.value ?? 90) || 0));
    for (const el of targets) {
      const target = prepareFillVisualTarget00999(el);
      if (!target) continue;
      if (String(target.dataset.stFillMode || '') !== 'gradient' && !String(target.style.getPropertyValue('--st-bgfx-bg')).includes(FILL_GRADIENT_ANGLE_VAR_00999)) continue;
      target.style.setProperty(FILL_GRADIENT_ANGLE_VAR_00999, `${angle}deg`);
      target.style.setProperty('--st-bgfx-bg', fillGradientImage00999());
      markFillAuthority00999(target);
    }
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: 'gradient-angle', angle, authority: FILL_GRADIENT_ANGLE_VAR_00999 }, opts?.live ? 'gradient-angle-live' : 'gradient-angle', opts);
    if (opts?.endSession === true) endFillEditSession00779_('gradient-angle-final');
    return true;
  }

  function applyImagePositionAxis00999(axis, opts = {}) {
    const targets = opts?.useSessionTargets === true ? getFillEditSessionTargets00779_(`image-pos-${axis}`) : getTargets();
    if (!targets.length) return false;
    const range = axis === 'x' ? imagePosXRange : imagePosYRange;
    const value = Math.max(1, Math.min(100, Number(range?.value ?? 50) || 50));
    const authority = axis === 'x' ? '--st-bgfx-bg-pos-x' : '--st-bgfx-bg-pos-y';
    for (const el of targets) {
      const target = prepareFillVisualTarget00999(el);
      if (!target || String(target.dataset.stFillMode || '') !== 'image') continue;
      target.style.setProperty(authority, `${value}%`);
      target.style.setProperty('--st-bgfx-bg-pos', imageCustomPositionExpression00999());
      markFillAuthority00999(target);
    }
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: `image-pos-${axis}`, value, authority }, opts?.live ? `image-pos-${axis}-live` : `image-pos-${axis}`, opts);
    if (opts?.endSession === true) endFillEditSession00779_(`image-pos-${axis}-final`);
    return true;
  }

  function applyImageScaleAxis00999(kind, opts = {}) {
    const targets = opts?.useSessionTargets === true ? getFillEditSessionTargets00779_(`image-scale-${kind}`) : getTargets();
    if (!targets.length) return false;
    const range = kind === 'all' ? imageScaleRange : (kind === 'x' ? imageScaleXRange : imageScaleYRange);
    const value = Math.max(0, Math.min(200, Number(range?.value ?? 100) || 0));
    const authority = kind === 'all' ? IMAGE_SCALE_VAR_00999 : (kind === 'x' ? IMAGE_SCALE_X_VAR_00999 : IMAGE_SCALE_Y_VAR_00999);
    for (const el of targets) {
      const target = prepareFillVisualTarget00999(el);
      if (!target || String(target.dataset.stFillMode || '') !== 'image') continue;
      if (!target.style.getPropertyValue(IMAGE_SCALE_VAR_00999).trim()) target.style.setProperty(IMAGE_SCALE_VAR_00999, String(Number(imageScaleRange?.value || 100)));
      if (!target.style.getPropertyValue(IMAGE_SCALE_X_VAR_00999).trim()) target.style.setProperty(IMAGE_SCALE_X_VAR_00999, String(Number(imageScaleXRange?.value || 100)));
      if (!target.style.getPropertyValue(IMAGE_SCALE_Y_VAR_00999).trim()) target.style.setProperty(IMAGE_SCALE_Y_VAR_00999, String(Number(imageScaleYRange?.value || 100)));
      target.style.setProperty(authority, String(value));
      target.style.setProperty('--st-bgfx-bg-size', imageCustomSizeExpression00999());
      markFillAuthority00999(target);
    }
    if (!opts?.live) updateTargetSummary(targets);
    notifyFillApplied_(targets, { mode: `image-scale-${kind}`, value, authority }, opts?.live ? `image-scale-${kind}-live` : `image-scale-${kind}`, opts);
    if (opts?.endSession === true) endFillEditSession00779_(`image-scale-${kind}-final`);
    return true;
  }

  // ---------- [00997] shared continuous Fill control ----------
  // Range movement is DOM-only RAF preview. Store/history/root DOM are touched once,
  // on the final change. This is the same contract for every continuous Fill slider.
  function bindFillRangeLive00997(rangeEl, numberEl, cfg = {}) {
    if (!rangeEl) return;
    const min = Number.isFinite(Number(cfg.min)) ? Number(cfg.min) : Number(rangeEl.min || 0);
    const max = Number.isFinite(Number(cfg.max)) ? Number(cfg.max) : Number(rangeEl.max || 100);
    const fallback = Number.isFinite(Number(cfg.fallback)) ? Number(cfg.fallback) : min;
    const round = cfg.round !== false;
    const reason = String(cfg.reason || 'range');
    let raf = 0;

    const normalize = (raw) => {
      let v = Number(raw);
      if (!Number.isFinite(v)) v = fallback;
      v = Math.max(min, Math.min(max, v));
      if (round) v = Math.round(v);
      return v;
    };
    const sync = (fromRange) => {
      const v = normalize(fromRange ? rangeEl.value : numberEl?.value);
      rangeEl.value = String(v);
      if (numberEl) numberEl.value = String(v);
      try { cfg.onValue?.(v); } catch (_) {}
      return v;
    };
    const start = () => { const targets = ensureFillEditSession00997_(`fill-range-${reason}-start`); try { cfg.onStart?.(targets); } catch (_) {} return targets; };
    const cancelRaf = () => {
      if (!raf) return;
      try { cancelAnimationFrame(raf); } catch (_) {}
      raf = 0;
    };
    const live = () => {
      sync(true);
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (typeof cfg.applyLive === 'function') cfg.applyLive({ live: true, useSessionTargets: true });
        else applyFill({ live: true, useSessionTargets: true });
      });
    };
    const finalFromRange = () => {
      cancelRaf();
      sync(true);
      if (typeof cfg.applyFinal === 'function') cfg.applyFinal({ live: false, useSessionTargets: true, endSession: true });
      else applyFill({ live: false, useSessionTargets: true, endSession: true });
    };
    const finalFromNumber = () => {
      cancelRaf();
      sync(false);
      if (typeof cfg.applyFinal === 'function') cfg.applyFinal({ live: false, useSessionTargets: true, endSession: true });
      else applyFill({ live: false, useSessionTargets: true, endSession: true });
    };

    rangeEl.addEventListener('pointerdown', start, true);
    rangeEl.addEventListener('focus', start, true);
    rangeEl.addEventListener('input', live);
    rangeEl.addEventListener('change', finalFromRange);
    if (numberEl) {
      numberEl.addEventListener('pointerdown', start, true);
      numberEl.addEventListener('focus', start, true);
      numberEl.addEventListener('change', finalFromNumber);
    }
  }

  // ---------- прозорість / ч-б ----------
  bindFillRangeLive00997(opacityRange, opacityNumber, {
    min: 0, max: 100, fallback: 100, reason: 'background-opacity',
    onStart: (targets) => targets.forEach((el) => {
      const t = resolveFillTarget(el);
      if (t?.classList?.contains('st-block-surfacefx') || t?.style?.getPropertyValue(BLOCK_SURFACE_SOURCE_VAR_00996)?.trim()) prepareBlockSurfaceTarget00997(t);
      prepareFillVisualTarget00999(t);
    }),
    applyLive: applyBackgroundOpacity00998,
    applyFinal: applyBackgroundOpacity00998
  });

  function bindElementFxControl00994(rangeEl, numberEl, fallback, reason) {
    if (!rangeEl || !numberEl) return;
    const start = () => ensureFillEditSession00997_(`element-fx-${reason}-start`);
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
        (reason === 'opacity' ? applyElementOpacity00999 : applyElementBlur00999)({ live: true, useSessionTargets: true });
      });
    });
    rangeEl.addEventListener('change', () => {
      if (raf) { try { cancelAnimationFrame(raf); } catch (_) {} raf = 0; }
      syncPair(true);
      (reason === 'opacity' ? applyElementOpacity00999 : applyElementBlur00999)({ live: false, useSessionTargets: true, endSession: true });
    });
    numberEl.addEventListener('change', () => {
      syncPair(false);
      (reason === 'opacity' ? applyElementOpacity00999 : applyElementBlur00999)({ live: false, useSessionTargets: true, endSession: true });
    });
  }

  function bindBlockSurfaceFxControl00995(rangeEl, numberEl, fallback, reason) {
    if (!rangeEl || !numberEl) return;
    const start = () => { const targets = ensureFillEditSession00997_(`block-surface-fx-${reason}-start`); targets.forEach(prepareBlockSurfaceTarget00997); };
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
        (reason === 'transparency' ? applyBlockTransparency00999 : applyBlockBlur00999)({ live: true, useSessionTargets: true });
      });
    });
    rangeEl.addEventListener('change', () => {
      if (raf) { try { cancelAnimationFrame(raf); } catch (_) {} raf = 0; }
      syncPair(true);
      (reason === 'transparency' ? applyBlockTransparency00999 : applyBlockBlur00999)({ live: false, useSessionTargets: true, endSession: true });
    });
    numberEl.addEventListener('change', () => {
      syncPair(false);
      (reason === 'transparency' ? applyBlockTransparency00999 : applyBlockBlur00999)({ live: false, useSessionTargets: true, endSession: true });
    });
  }

  bindBlockSurfaceFxControl00995(blockTransparencyRange, blockTransparencyNumber, 0, 'transparency');
  bindBlockSurfaceFxControl00995(blockBlurRange, blockBlurNumber, 0, 'blur');
  bindElementFxControl00994(elementOpacityRange, elementOpacityNumber, 100, 'opacity');
  bindElementFxControl00994(elementBlurRange, elementBlurNumber, 0, 'blur');

  // ---------- 01001 · single-authority color hot paths ----------
  // Native color pickers can emit many input events per second. Live input only mutates
  // the one canonical CSS authority owned by that control. No Store event, full applyFill,
  // surface recapture, filter rebuild or target summary runs until the final change.
  function colorTargets01001(opts = {}, reason = 'color') {
    return opts?.useSessionTargets === true
      ? getFillEditSessionTargets00779_(opts?.live ? `${reason}-live` : `${reason}-final`)
      : getTargets();
  }

  function finalColorCommit01001(targets, detailState, reason, opts = {}) {
    if (opts?.live) return true;
    updateTargetSummary(targets);
    notifyFillApplied_(targets, detailState, reason, { ...opts, live: false });
    if (opts?.endSession === true) endFillEditSession00779_(`${reason}-final`);
    return true;
  }

  function applySolidFillColor01001(opts = {}) {
    const targets = colorTargets01001(opts, 'fill-color');
    if (!targets.length) return false;
    const hex = normalizeHex(colorInput?.value || colorText?.value || '#0f172a');
    const unsupported = targets.some(el => el instanceof HTMLElement && el.matches?.('[data-st-menu="1"],[data-st-menu-item="1"]'));
    if (unsupported) return applyFill(opts);
    for (const el of targets) {
      const target = prepareFillVisualTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      target.classList.add('st-bgfx');
      target.dataset.stFillMode = 'color';
      target.dataset.stFillCustomLayer = '1';
      // One truth for solid Fill color. Legacy --st-bgfx-bg-color is deliberately removed.
      target.style.setProperty('--st-bgfx-bg', hex);
      target.style.removeProperty('--st-bgfx-bg-color');
      markFillAuthority00999(target);
    }
    return finalColorCommit01001(targets, { mode: 'color', colorRaw: hex, authority: '--st-bgfx-bg' }, 'fill-color', opts);
  }

  function applyGradientStop01001(index, opts = {}) {
    const targets = colorTargets01001(opts, `fill-gradient-c${index}`);
    if (!targets.length) return false;
    const controls = [grad1Input, grad2Input, grad3Input];
    const vars = [FILL_GRADIENT_C1_VAR_00999, FILL_GRADIENT_C2_VAR_00999, FILL_GRADIENT_C3_VAR_00999];
    const hex = normalizeHex(controls[index - 1]?.value || '#0f172a');
    for (const el of targets) {
      const target = prepareFillVisualTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      target.classList.add('st-bgfx');
      target.dataset.stFillMode = 'gradient';
      target.dataset.stFillCustomLayer = '1';
      target.style.setProperty(vars[index - 1], hex);
      target.style.setProperty('--st-bgfx-bg', fillGradientImage00999());
      target.style.removeProperty('--st-bgfx-bg-color');
      markFillAuthority00999(target);
    }
    return finalColorCommit01001(targets, { mode: 'gradient', stop: index, colorRaw: hex, authority: vars[index - 1] }, `fill-gradient-c${index}`, opts);
  }

  function applyFilterSolidColor01001(opts = {}) {
    const targets = colorTargets01001(opts, 'filter-color');
    if (!targets.length) return false;
    const hex = normalizeHex(filterColorInput?.value || filterColorText?.value || '#000000');
    for (const el of targets) {
      const target = prepareFilterTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      target.style.setProperty(FILTER_COLOR_VAR_01001, hex);
      // The mode expression is structural; the color itself has exactly one authority.
      if (!/var\(--st-bgfx-filter-color/i.test(target.style.getPropertyValue('--st-bgfx-filter'))) {
        target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('color'));
      }
      target.style.removeProperty(FILTER_C1_VAR_00999);
      target.style.removeProperty(FILTER_C2_VAR_00999);
      target.style.removeProperty(FILTER_C3_VAR_00999);
      target.style.removeProperty(FILTER_ANGLE_VAR_00999);
      ensureFilterLayer00999(target);
      markFillAuthority00999(target);
    }
    return finalColorCommit01001(targets, { mode: 'filter-color', filterColorRaw: hex, authority: FILTER_COLOR_VAR_01001 }, 'filter-color', opts);
  }

  function applyFilterGradientStop01001(index, opts = {}) {
    const targets = colorTargets01001(opts, `filter-gradient-c${index}`);
    if (!targets.length) return false;
    const controls = [fGrad1Input, fGrad2Input, fGrad3Input];
    const vars = [FILTER_C1_VAR_00999, FILTER_C2_VAR_00999, FILTER_C3_VAR_00999];
    const hex = normalizeHex(controls[index - 1]?.value || '#000000');
    for (const el of targets) {
      const target = prepareFilterTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.setProperty(vars[index - 1], hex);
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('gradient'));
      ensureFilterLayer00999(target);
      markFillAuthority00999(target);
    }
    return finalColorCommit01001(targets, { mode: 'filter-gradient', stop: index, colorRaw: hex, authority: vars[index - 1] }, `filter-gradient-c${index}`, opts);
  }

  // ---------- кольори ----------
  // 01002: native <input type="color"> can emit a dense stream of input events.
  // Gesture setup may do the expensive structural work once. Every following live
  // frame writes ONLY the canonical authority owned by that picker.
  function prepareSolidFillColorSession01002(targets) {
    const prepared = [];
    let direct = true;
    for (const el of targets || []) {
      const target = prepareFillVisualTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      if (target.matches?.('[data-st-menu="1"],[data-st-menu-item="1"]')) direct = false;
      target.classList.add('st-bgfx');
      target.dataset.stFillMode = 'color';
      target.dataset.stFillCustomLayer = '1';
      target.style.removeProperty('--st-bgfx-bg-color');
      markFillAuthority00999(target);
      prepared.push(target);
    }
    return { targets: prepared, direct };
  }

  function prepareFillGradientColorSession01002(targets) {
    const prepared = [];
    for (const el of targets || []) {
      const target = prepareFillVisualTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      target.classList.add('st-bgfx');
      target.dataset.stFillMode = 'gradient';
      target.dataset.stFillCustomLayer = '1';
      target.style.setProperty('--st-bgfx-bg', fillGradientImage00999());
      target.style.removeProperty('--st-bgfx-bg-color');
      markFillAuthority00999(target);
      prepared.push(target);
    }
    return { targets: prepared, direct: true };
  }

  function prepareFilterSolidColorSession01002(targets) {
    const prepared = [];
    for (const el of targets || []) {
      const target = prepareFilterTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      if (!/var\(--st-bgfx-filter-color/i.test(target.style.getPropertyValue('--st-bgfx-filter'))) {
        target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('color'));
      }
      target.style.removeProperty(FILTER_C1_VAR_00999);
      target.style.removeProperty(FILTER_C2_VAR_00999);
      target.style.removeProperty(FILTER_C3_VAR_00999);
      target.style.removeProperty(FILTER_ANGLE_VAR_00999);
      ensureFilterLayer00999(target);
      markFillAuthority00999(target);
      prepared.push(target);
    }
    return { targets: prepared, direct: true };
  }

  function prepareFilterGradientColorSession01002(targets) {
    const prepared = [];
    for (const el of targets || []) {
      const target = prepareFilterTarget00999(el);
      if (!(target instanceof HTMLElement)) continue;
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('gradient'));
      ensureFilterLayer00999(target);
      markFillAuthority00999(target);
      prepared.push(target);
    }
    return { targets: prepared, direct: true };
  }

  function liveSolidFillColor01002(targets, hex) {
    for (const target of targets || []) {
      if (target instanceof HTMLElement && target.isConnected) target.style.setProperty('--st-bgfx-bg', hex);
    }
  }

  function liveFillGradientStop01002(index, targets, hex) {
    const vars = [FILL_GRADIENT_C1_VAR_00999, FILL_GRADIENT_C2_VAR_00999, FILL_GRADIENT_C3_VAR_00999];
    const prop = vars[index - 1];
    if (!prop) return;
    for (const target of targets || []) {
      if (target instanceof HTMLElement && target.isConnected) target.style.setProperty(prop, hex);
    }
  }

  function liveFilterSolidColor01002(targets, hex) {
    for (const target of targets || []) {
      if (target instanceof HTMLElement && target.isConnected) target.style.setProperty(FILTER_COLOR_VAR_01001, hex);
    }
  }

  function liveFilterGradientStop01002(index, targets, hex) {
    const vars = [FILTER_C1_VAR_00999, FILTER_C2_VAR_00999, FILTER_C3_VAR_00999];
    const prop = vars[index - 1];
    if (!prop) return;
    for (const target of targets || []) {
      if (target instanceof HTMLElement && target.isConnected) target.style.setProperty(prop, hex);
    }
  }

  // ---------- 01003 · compositor-only native solid-color preview ----------
  const LIVE_RGB_LAYER_CLASS_01003 = 'st-fill-live-rgb-layer';
  const LIVE_FILL_CLASS_01003 = 'st-fill-live-fill-color-01003';
  const LIVE_FILTER_CLASS_01003 = 'st-fill-live-filter-color-01003';

  function numberCssVar01003(target, name, fallback = 1) {
    if (!(target instanceof HTMLElement)) return fallback;
    let raw = String(target.style.getPropertyValue(name) || '').trim();
    if (!raw) {
      try { raw = String(getComputedStyle(target).getPropertyValue(name) || '').trim(); } catch (_) { raw = ''; }
    }
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  function stringCssVar01003(target, name, fallback = '') {
    if (!(target instanceof HTMLElement)) return fallback;
    let raw = String(target.style.getPropertyValue(name) || '').trim();
    if (!raw) {
      try { raw = String(getComputedStyle(target).getPropertyValue(name) || '').trim(); } catch (_) { raw = ''; }
    }
    return raw || fallback;
  }

  function rgbChannels01003(hex) {
    const h = normalizeHex(hex || '#000000').slice(1);
    return [0, 2, 4].map((i) => Math.max(0, Math.min(1, parseInt(h.slice(i, i + 2), 16) / 255)));
  }

  function removeLiveRgbLayers01003(target, kind = '') {
    if (!(target instanceof HTMLElement)) return;
    for (const child of Array.from(target.children || [])) {
      if (!(child instanceof HTMLElement) || !child.classList.contains(LIVE_RGB_LAYER_CLASS_01003)) continue;
      if (kind && child.dataset.stFillLiveRgbLayer !== kind) continue;
      child.remove();
    }
    if (!kind || kind === 'fill') target.classList.remove(LIVE_FILL_CLASS_01003);
    if (!kind || kind === 'filter') target.classList.remove(LIVE_FILTER_CLASS_01003);
  }

  function createLiveRgbLayer01003(target, kind) {
    if (!(target instanceof HTMLElement)) return null;
    removeLiveRgbLayers01003(target, kind);
    const layer = document.createElement('span');
    layer.className = LIVE_RGB_LAYER_CLASS_01003;
    layer.dataset.stFillLiveRgbLayer = kind;
    layer.setAttribute('aria-hidden', 'true');
    layer.contentEditable = 'false';
    layer.innerHTML = '<i data-rgb="base"></i><i data-rgb="r"></i><i data-rgb="g"></i><i data-rgb="b"></i>';

    const elementOpacity = Math.max(0, Math.min(1, numberCssVar01003(target, '--st-element-fx-opacity', 1)));
    const opacityVar = kind === 'filter' ? '--st-bgfx-filter-opacity' : '--st-bgfx-bg-opacity';
    const ownOpacity = Math.max(0, Math.min(1, numberCssVar01003(target, opacityVar, kind === 'filter' ? 0 : 1)));
    const blur = stringCssVar01003(target, '--st-element-fx-blur', '0px');
    const gray = kind === 'fill' ? Math.max(0, Math.min(1, numberCssVar01003(target, '--st-bgfx-gray', 0))) : 0;

    layer.style.setProperty('opacity', String(ownOpacity * elementOpacity), 'important');
    layer.style.setProperty('filter', `${gray ? `grayscale(${gray}) ` : ''}blur(${blur})`, 'important');
    const surfaceLayer = target.classList.contains('st-block-surfacefx');
    layer.style.setProperty('z-index', (kind === 'filter' && surfaceLayer) ? '1' : '0', 'important');
    target.appendChild(layer);
    target.classList.add(kind === 'filter' ? LIVE_FILTER_CLASS_01003 : LIVE_FILL_CLASS_01003);

    const nodes = {
      target,
      layer,
      r: layer.querySelector('[data-rgb="r"]'),
      g: layer.querySelector('[data-rgb="g"]'),
      b: layer.querySelector('[data-rgb="b"]')
    };
    return nodes;
  }

  function applyLiveRgbLayer01003(entry, hex) {
    if (!entry?.layer?.isConnected) return;
    const [r, g, b] = rgbChannels01003(hex);
    // Opacity-only writes are compositor-friendly and avoid repainting the actual
    // Fill/Filter source while the native palette thumb is moving.
    if (entry.r) entry.r.style.opacity = String(r);
    if (entry.g) entry.g.style.opacity = String(g);
    if (entry.b) entry.b.style.opacity = String(b);
  }

  function prepareSolidColorCompositor01003(targets, kind) {
    const entries = [];
    for (const target of targets || []) {
      if (!(target instanceof HTMLElement) || !target.isConnected) continue;
      const entry = createLiveRgbLayer01003(target, kind);
      if (entry) entries.push(entry);
    }
    return entries;
  }

  function cleanupSolidColorCompositor01003(entries, kind) {
    for (const entry of entries || []) {
      if (entry?.target instanceof HTMLElement) removeLiveRgbLayers01003(entry.target, kind);
    }
  }

  function commitSolidFillCanonical01003(targets, hex) {
    for (const target of targets || []) {
      if (!(target instanceof HTMLElement) || !target.isConnected) continue;
      target.style.setProperty('--st-bgfx-bg', normalizeHex(hex));
    }
  }

  function commitSolidFilterCanonical01003(targets, hex) {
    for (const target of targets || []) {
      if (!(target instanceof HTMLElement) || !target.isConnected) continue;
      target.style.setProperty(FILTER_COLOR_VAR_01001, normalizeHex(hex));
    }
  }

  // ---------- 01005 · custom in-app HSV color picker ----------
  // COLOR PROBE 01004 showed that the page handler itself is tiny (<=0.2ms), while
  // native Chrome/Windows color input arrived only every ~31ms and A/B canvas freeze
  // did not remove the lag. Therefore Fill stops invoking the native picker entirely.
  const CUSTOM_COLOR_LIVE_EVENT_01005 = 'st:custom-color-live-01005';
  const CUSTOM_COLOR_CANCEL_EVENT_01005 = 'st:custom-color-cancel-01005';
  const CUSTOM_COLOR_PREVIEW_INTERVAL_01005 = 32; // palette thumb stays RAF; canvas follows <= ~31fps
  let customPicker01005 = null;

  function hexToRgb01005(hex) {
    const h = normalizeHex(hex || '#000000').slice(1);
    return {
      r: parseInt(h.slice(0, 2), 16) || 0,
      g: parseInt(h.slice(2, 4), 16) || 0,
      b: parseInt(h.slice(4, 6), 16) || 0
    };
  }

  function rgbToHex01005(r, g, b) {
    const n = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${n(r)}${n(g)}${n(b)}`;
  }

  function rgbToHsv01005(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return { h, s: max ? d / max : 0, v: max };
  }

  function hsvToRgb01005(h, s, v) {
    h = ((Number(h) || 0) % 360 + 360) % 360;
    s = Math.max(0, Math.min(1, Number(s) || 0));
    v = Math.max(0, Math.min(1, Number(v) || 0));
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let rp = 0, gp = 0, bp = 0;
    if (h < 60) { rp = c; gp = x; }
    else if (h < 120) { rp = x; gp = c; }
    else if (h < 180) { gp = c; bp = x; }
    else if (h < 240) { gp = x; bp = c; }
    else if (h < 300) { rp = x; bp = c; }
    else { rp = c; bp = x; }
    return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
  }

  function hsvToHex01005(h, s, v) {
    const rgb = hsvToRgb01005(h, s, v);
    return rgbToHex01005(rgb.r, rgb.g, rgb.b);
  }

  function syncColorTrigger01005(trigger, hex = '', { commitValue = true } = {}) {
    if (!(trigger instanceof HTMLElement)) return;
    const v = normalizeHex(hex || trigger.value || trigger.getAttribute('value') || '#000000');
    // Hot-path palette motion only touches one CSS variable. Button.value/ARIA are
    // updated on open/final sync, not on every pointer frame.
    trigger.style.setProperty('--st-color-trigger-value-01005', v);
    if (commitValue) {
      trigger.value = v;
      trigger.setAttribute('value', v);
      const baseLabel = trigger.dataset.stColorBaseLabel01005 || trigger.getAttribute('aria-label')?.split(' · ')[0] || 'Вибрати колір';
      trigger.dataset.stColorBaseLabel01005 = baseLabel;
      trigger.setAttribute('aria-label', `${baseLabel} · ${v.toUpperCase()}`);
    }
  }

  function syncAllColorTriggers01005() {
    sectionEl.querySelectorAll('.st-color-trigger-01005[data-fill]').forEach((el) => syncColorTrigger01005(el));
  }

  function ensureCustomPicker01005() {
    if (customPicker01005?.root?.isConnected) return customPicker01005;
    document.querySelectorAll('[data-st-fill-color-picker-01005]').forEach((el) => el.remove());

    const root = document.createElement('div');
    root.className = 'st-fill-color-picker-01005';
    root.setAttribute('data-st-fill-color-picker-01005', '1');
    root.hidden = true;
    root.innerHTML = `
      <div class="st-fill-color-picker__head-01005">
        <strong>Колір</strong>
        <button type="button" data-cp-cancel aria-label="Скасувати">×</button>
      </div>
      <div class="st-fill-color-picker__sv-01005" data-cp-sv>
        <span class="st-fill-color-picker__sv-thumb-01005" data-cp-sv-thumb></span>
      </div>
      <div class="st-fill-color-picker__hue-01005" data-cp-hue>
        <span class="st-fill-color-picker__hue-thumb-01005" data-cp-hue-thumb></span>
      </div>
      <div class="st-fill-color-picker__bottom-01005">
        <span class="st-fill-color-picker__preview-01005" data-cp-preview></span>
        <input type="text" data-cp-hex spellcheck="false" autocomplete="off" />
        <button type="button" data-cp-done>Готово</button>
      </div>
      <div class="st-fill-color-picker__hint-01005">Палітра ShiftTime · Esc — скасувати</div>
    `;
    document.body.appendChild(root);

    const api = {
      root,
      sv: root.querySelector('[data-cp-sv]'),
      hue: root.querySelector('[data-cp-hue]'),
      svThumb: root.querySelector('[data-cp-sv-thumb]'),
      hueThumb: root.querySelector('[data-cp-hue-thumb]'),
      preview: root.querySelector('[data-cp-preview]'),
      hexInput: root.querySelector('[data-cp-hex]'),
      done: root.querySelector('[data-cp-done]'),
      cancel: root.querySelector('[data-cp-cancel]'),
      trigger: null,
      startHex: '#000000',
      hex: '#000000',
      h: 0,
      s: 0,
      v: 0,
      dragKind: '',
      dragPointerId: null,
      dragRect: null,
      raf: 0,
      pendingPoint: null,
      lastCanvasEmitAt: 0,
      dirty: false,
      outsideHandler: null,
      keyHandler: null,
      viewportHandler: null,
      svWidth: 228,
      svHeight: 158,
      hueWidth: 228
    };

    const position = () => {
      if (!api.trigger || root.hidden) return;
      const tr = api.trigger.getBoundingClientRect();
      const w = 292, h = 310, pad = 8;
      let left = tr.right + 10;
      if (left + w > window.innerWidth - pad) left = tr.left - w - 10;
      left = Math.max(pad, Math.min(window.innerWidth - w - pad, left));
      let top = Math.max(pad, Math.min(window.innerHeight - h - pad, tr.top - 8));
      root.style.transform = `translate3d(${Math.round(left)}px,${Math.round(top)}px,0)`;
    };

    const emitLive = (force = false) => {
      if (!(api.trigger instanceof HTMLElement)) return;
      const now = performance.now();
      if (!force && (now - api.lastCanvasEmitAt) < CUSTOM_COLOR_PREVIEW_INTERVAL_01005) return;
      api.lastCanvasEmitAt = now;
      api.trigger.dispatchEvent(new CustomEvent(CUSTOM_COLOR_LIVE_EVENT_01005, {
        bubbles: false,
        detail: { hex: api.hex, source: 'custom-picker-01005' }
      }));
    };

    const render = ({ hueChanged = false, emit = true, forceEmit = false } = {}) => {
      api.hex = hsvToHex01005(api.h, api.s, api.v);
      if (api.trigger) syncColorTrigger01005(api.trigger, api.hex, { commitValue: false });
      if (api.preview) api.preview.style.background = api.hex;
      if (api.hexInput && api.hexInput.value.toLowerCase() !== api.hex.toLowerCase()) api.hexInput.value = api.hex.toUpperCase();
      if (hueChanged && api.sv) api.sv.style.setProperty('--st-picker-hue-01005', `hsl(${Math.round(api.h)} 100% 50%)`);

      const sw = api.svWidth || 228;
      const sh = api.svHeight || 158;
      const hw = api.hueWidth || 228;
      if (api.svThumb) api.svThumb.style.transform = `translate3d(${api.s * sw}px,${(1 - api.v) * sh}px,0)`;
      if (api.hueThumb) api.hueThumb.style.transform = `translate3d(${(api.h / 360) * hw}px,0,0)`;
      if (emit) emitLive(forceEmit);
    };

    const scheduleDrag = (e) => {
      if (!api.dragKind || e.pointerId !== api.dragPointerId || !api.dragRect) return;
      api.pendingPoint = { x: e.clientX, y: e.clientY, kind: api.dragKind };
      if (api.raf) return;
      api.raf = requestAnimationFrame(() => {
        api.raf = 0;
        const p = api.pendingPoint;
        api.pendingPoint = null;
        if (!p || !api.dragRect) return;
        const r = api.dragRect;
        const nx = Math.max(0, Math.min(1, (p.x - r.left) / Math.max(1, r.width)));
        const ny = Math.max(0, Math.min(1, (p.y - r.top) / Math.max(1, r.height)));
        if (p.kind === 'sv') {
          api.s = nx;
          api.v = 1 - ny;
          api.dirty = true;
          render({ emit: true });
        } else {
          api.h = Math.max(0, Math.min(359.999, nx * 360));
          api.dirty = true;
          render({ hueChanged: true, emit: true });
        }
      });
    };

    const startDrag = (kind, e) => {
      if (root.hidden) return;
      e.preventDefault();
      e.stopPropagation();
      const el = kind === 'sv' ? api.sv : api.hue;
      api.dragKind = kind;
      api.dragPointerId = e.pointerId;
      api.dragRect = el.getBoundingClientRect();
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      scheduleDrag(e);
    };

    const endDrag = (e) => {
      if (!api.dragKind || e.pointerId !== api.dragPointerId) return;
      scheduleDrag(e);
      if (api.raf) {
        cancelAnimationFrame(api.raf);
        api.raf = 0;
        const p = api.pendingPoint;
        api.pendingPoint = null;
        if (p && api.dragRect) {
          const r = api.dragRect;
          const nx = Math.max(0, Math.min(1, (p.x - r.left) / Math.max(1, r.width)));
          const ny = Math.max(0, Math.min(1, (p.y - r.top) / Math.max(1, r.height)));
          if (p.kind === 'sv') { api.s = nx; api.v = 1 - ny; }
          else api.h = Math.max(0, Math.min(359.999, nx * 360));
          api.dirty = true;
        }
      }
      render({ emit: true, forceEmit: true });
      api.dragKind = '';
      api.dragPointerId = null;
      api.dragRect = null;
    };

    api.sv?.addEventListener('pointerdown', (e) => startDrag('sv', e));
    api.hue?.addEventListener('pointerdown', (e) => startDrag('hue', e));
    root.addEventListener('pointermove', scheduleDrag);
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
    root.addEventListener('pointerdown', (e) => e.stopPropagation());

    const close = (mode = 'commit') => {
      if (!api.trigger) { root.hidden = true; return; }
      const trigger = api.trigger;
      if (api.raf) { cancelAnimationFrame(api.raf); api.raf = 0; }
      api.pendingPoint = null;
      api.dragKind = '';
      api.dragPointerId = null;
      api.dragRect = null;

      const startHex01006 = normalizeHex(api.startHex || '#000000');
      const finalHex01006 = normalizeHex(api.hex || startHex01006);
      const changed01006 = finalHex01006 !== startHex01006;

      if (mode === 'cancel') {
        api.hex = startHex01006;
        syncColorTrigger01005(trigger, startHex01006);
        // Only a picker that actually emitted live edits owns a Fill edit session.
        // Opening and closing an untouched picker must be a strict no-op.
        if (api.dirty) {
          trigger.dispatchEvent(new CustomEvent(CUSTOM_COLOR_LIVE_EVENT_01005, { detail: { hex: startHex01006, source: 'custom-picker-cancel-01006' } }));
          trigger.dispatchEvent(new CustomEvent(CUSTOM_COLOR_CANCEL_EVENT_01005, { detail: { hex: startHex01006 } }));
        }
      } else if (!changed01006) {
        // 01006: clicking the palette is read-only. If the user moved around and
        // returned to the exact source color, clean the transient preview without
        // creating history/store writes.
        api.hex = startHex01006;
        syncColorTrigger01005(trigger, startHex01006);
        if (api.dirty) {
          trigger.dispatchEvent(new CustomEvent(CUSTOM_COLOR_LIVE_EVENT_01005, { detail: { hex: startHex01006, source: 'custom-picker-nochange-01006' } }));
          trigger.dispatchEvent(new CustomEvent(CUSTOM_COLOR_CANCEL_EVENT_01005, { detail: { hex: startHex01006 } }));
        }
      } else {
        api.hex = finalHex01006;
        emitLive(true);
        syncColorTrigger01005(trigger, finalHex01006);
        trigger.dispatchEvent(new Event('change', { bubbles: true }));
      }

      trigger.__stCustomColorPickerOpen01005 = false;
      root.hidden = true;
      api.trigger = null;
      api.dirty = false;
      if (api.outsideHandler) document.removeEventListener('pointerdown', api.outsideHandler, true);
      if (api.keyHandler) document.removeEventListener('keydown', api.keyHandler, true);
      if (api.viewportHandler) {
        window.removeEventListener('resize', api.viewportHandler, true);
        document.querySelector('.canvas__scroll')?.removeEventListener('scroll', api.viewportHandler, true);
      }
      api.outsideHandler = api.keyHandler = api.viewportHandler = null;
    };

    api.done?.addEventListener('click', () => close('commit'));
    api.cancel?.addEventListener('click', () => close('cancel'));
    api.hexInput?.addEventListener('input', () => {
      const raw = String(api.hexInput.value || '').trim();
      if (!/^#[0-9a-f]{6}$/i.test(raw)) return;
      const rgb = hexToRgb01005(raw);
      const hsv = rgbToHsv01005(rgb.r, rgb.g, rgb.b);
      api.h = hsv.h; api.s = hsv.s; api.v = hsv.v;
      api.dirty = true;
      render({ hueChanged: true, emit: true, forceEmit: true });
    });
    api.hexInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); close('commit'); }
      if (e.key === 'Escape') { e.preventDefault(); close('cancel'); }
    });

    api.open = (trigger) => {
      if (!(trigger instanceof HTMLElement)) return;
      if (api.trigger && api.trigger !== trigger && !root.hidden) close('commit');
      const startHex = normalizeHex(trigger.value || trigger.getAttribute('value') || '#000000');
      const rgb = hexToRgb01005(startHex);
      const hsv = rgbToHsv01005(rgb.r, rgb.g, rgb.b);
      api.trigger = trigger;
      api.startHex = startHex;
      api.hex = startHex;
      api.h = hsv.h; api.s = hsv.s; api.v = hsv.v;
      api.lastCanvasEmitAt = 0;
      api.dirty = false;
      trigger.__stCustomColorPickerOpen01005 = true;
      root.hidden = false;
      position();
      api.svWidth = api.sv?.clientWidth || 228;
      api.svHeight = api.sv?.clientHeight || 158;
      api.hueWidth = api.hue?.clientWidth || 228;
      render({ hueChanged: true, emit: false });

      api.outsideHandler = (e) => {
        if (root.hidden || !api.trigger) return;
        const t = e.target;
        if (root.contains(t) || t === api.trigger || api.trigger.contains?.(t)) return;
        close('commit');
      };
      api.keyHandler = (e) => {
        if (root.hidden) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close('cancel'); }
      };
      api.viewportHandler = () => requestAnimationFrame(() => {
        position();
        api.svWidth = api.sv?.clientWidth || api.svWidth;
        api.svHeight = api.sv?.clientHeight || api.svHeight;
        api.hueWidth = api.hue?.clientWidth || api.hueWidth;
      });
      document.addEventListener('pointerdown', api.outsideHandler, true);
      document.addEventListener('keydown', api.keyHandler, true);
      window.addEventListener('resize', api.viewportHandler, true);
      document.querySelector('.canvas__scroll')?.addEventListener('scroll', api.viewportHandler, { passive: true, capture: true });
    };

    customPicker01005 = api;
    return api;
  }

  function installCustomColorTrigger01005(trigger) {
    if (!(trigger instanceof HTMLElement) || trigger.dataset.stCustomColorPickerBound01005 === '1') return;
    trigger.dataset.stCustomColorPickerBound01005 = '1';
    syncColorTrigger01005(trigger);
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      ensureCustomPicker01005().open(trigger);
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        ensureCustomPicker01005().open(trigger);
      }
    });
  }

  function bindColorPair(colorEl, textEl, cfg = {}) {
    if (!colorEl || !textEl) return;
    installCustomColorTrigger01005(colorEl);
    let liveRaf01002 = 0;
    let latestRaw01003 = colorEl.value || textEl.value || '#000000';
    let latestHex01002 = normalizeHex(latestRaw01003);
    let liveTargets01002 = [];
    let directLive01002 = true;
    let locallyStarted01002 = false;
    let compositorEntries01003 = [];

    const resetLocal01002 = () => {
      liveTargets01002 = [];
      directLive01002 = true;
      locallyStarted01002 = false;
      compositorEntries01003 = [];
    };

    const start = (explicitHex01006 = '') => {
      // 01006 single-source contract: a new gesture always starts from the value
      // currently shown for the ACTIVE selected element. Never reuse the previous
      // gesture's closure value from another element. Custom picker live events pass
      // their exact new color explicitly because trigger.value intentionally remains
      // the committed source color until the final commit.
      const currentRaw01006 = explicitHex01006 || colorEl.value || textEl.value || '#000000';
      latestRaw01003 = currentRaw01006;
      latestHex01002 = normalizeHex(currentRaw01006);
      if (locallyStarted01002 && liveTargets01002.some(el => el instanceof HTMLElement && el.isConnected)) return liveTargets01002;
      const targets = ensureFillEditSession00997_(`color-control-${String(cfg.reason || 'color')}-01006`);
      let prepared = null;
      try { prepared = cfg.prepareTargets?.(targets) || null; } catch (_) { prepared = null; }
      if (prepared && Array.isArray(prepared.targets)) {
        liveTargets01002 = prepared.targets.filter(el => el instanceof HTMLElement && el.isConnected);
        directLive01002 = prepared.direct !== false;
      } else {
        liveTargets01002 = (targets || []).filter(el => el instanceof HTMLElement && el.isConnected);
        directLive01002 = typeof cfg.applyLiveDirect === 'function';
      }
      try { compositorEntries01003 = cfg.compositorKind ? prepareSolidColorCompositor01003(liveTargets01002, cfg.compositorKind) : []; } catch (_) { compositorEntries01003 = []; }
      if (compositorEntries01003.length) compositorEntries01003.forEach((entry) => applyLiveRgbLayer01003(entry, latestHex01002));
      locallyStarted01002 = true;
      return liveTargets01002;
    };

    const flushLive01002 = (applyPending = false) => {
      if (liveRaf01002) {
        try { cancelAnimationFrame(liveRaf01002); } catch (_) {}
        liveRaf01002 = 0;
        if (applyPending) {
          if (compositorEntries01003.length) compositorEntries01003.forEach((entry) => applyLiveRgbLayer01003(entry, latestHex01002));
          else if (directLive01002 && typeof cfg.applyLiveDirect === 'function') cfg.applyLiveDirect(liveTargets01002, latestHex01002);
        }
      }
    };

    const scheduleLive01002 = () => {
      // Raw native picker events can be much denser than the display refresh rate.
      // Keep the synchronous input handler to one value read + one RAF branch.
      latestRaw01003 = colorEl.value;
      if (!locallyStarted01002) start();
      if (liveRaf01002) return;
      liveRaf01002 = requestAnimationFrame(() => {
        liveRaf01002 = 0;
        latestHex01002 = normalizeHex(latestRaw01003);
        if (compositorEntries01003.length) {
          compositorEntries01003.forEach((entry) => applyLiveRgbLayer01003(entry, latestHex01002));
        } else if (directLive01002 && typeof cfg.applyLiveDirect === 'function') {
          cfg.applyLiveDirect(liveTargets01002, latestHex01002);
        } else if (typeof cfg.applyLive === 'function') {
          cfg.applyLive({ live: true, useSessionTargets: true });
        } else {
          applyFill({ live: true, useSessionTargets: true });
        }
      });
    };

    colorEl.addEventListener(CUSTOM_COLOR_LIVE_EVENT_01005, (e) => {
      const hex = normalizeHex(e?.detail?.hex || colorEl.value || textEl.value || '#000000');
      latestRaw01003 = hex;
      latestHex01002 = hex;
      if (!locallyStarted01002) start(hex);
      // Custom picker already coalesces pointer moves to display RAF and throttles
      // the expensive canvas preview to <=30Hz, so do not queue a second RAF here.
      if (compositorEntries01003.length) compositorEntries01003.forEach((entry) => applyLiveRgbLayer01003(entry, hex));
      else if (directLive01002 && typeof cfg.applyLiveDirect === 'function') cfg.applyLiveDirect(liveTargets01002, hex);
      else if (typeof cfg.applyLive === 'function') cfg.applyLive({ live: true, useSessionTargets: true });
      else applyFill({ live: true, useSessionTargets: true });
    });
    colorEl.addEventListener(CUSTOM_COLOR_CANCEL_EVENT_01005, () => {
      latestRaw01003 = colorEl.value || textEl.value || '#000000';
      latestHex01002 = normalizeHex(latestRaw01003);
      flushLive01002(true);
      if (compositorEntries01003.length) cleanupSolidColorCompositor01003(compositorEntries01003, cfg.compositorKind || '');
      endFillEditSession00779_('custom-color-picker-cancel-01005');
      resetLocal01002();
    });

    // 01006: merely focusing/opening a palette must not touch the canvas. The edit
    // session begins only on the first actual color mutation (custom live/input/text change).
    colorEl.addEventListener('input', scheduleLive01002);
    colorEl.addEventListener('change', () => {
      latestRaw01003 = colorEl.value;
      latestHex01002 = normalizeHex(latestRaw01003);
      if (!locallyStarted01002) start(latestHex01002);
      flushLive01002(true);
      colorEl.value = latestHex01002;
      textEl.value = latestHex01002;
      if (compositorEntries01003.length && typeof cfg.commitCanonical === 'function') cfg.commitCanonical(liveTargets01002, latestHex01002);
      if (compositorEntries01003.length) cleanupSolidColorCompositor01003(compositorEntries01003, cfg.compositorKind || '');
      if (typeof cfg.applyFinal === 'function') cfg.applyFinal({ live: false, useSessionTargets: true, endSession: true });
      else applyFill({ live: false, useSessionTargets: true, endSession: true });
      resetLocal01002();
    });
    textEl.addEventListener('change', () => {
      flushLive01002(false);
      latestRaw01003 = textEl.value;
      latestHex01002 = normalizeHex(latestRaw01003);
      start(latestHex01002);
      textEl.value = latestHex01002;
      colorEl.value = latestHex01002;
      if (compositorEntries01003.length && typeof cfg.commitCanonical === 'function') cfg.commitCanonical(liveTargets01002, latestHex01002);
      if (compositorEntries01003.length) cleanupSolidColorCompositor01003(compositorEntries01003, cfg.compositorKind || '');
      if (typeof cfg.applyFinal === 'function') cfg.applyFinal({ live: false, useSessionTargets: true, endSession: true });
      else applyFill({ live: false, useSessionTargets: true, endSession: true });
      resetLocal01002();
    });
    colorEl.addEventListener('blur', () => {
      setTimeout(() => {
        if (colorEl.__stCustomColorPickerOpen01005) return;
        if (!locallyStarted01002) return;
        flushLive01002(false);
        if (compositorEntries01003.length) cleanupSolidColorCompositor01003(compositorEntries01003, cfg.compositorKind || '');
        endFillEditSession00779_('color-picker-blur-01006');
        resetLocal01002();
      }, 0);
    });
  }

  bindColorPair(colorInput, colorText, {
    reason: 'fill-color',
    compositorKind: 'fill',
    commitCanonical: commitSolidFillCanonical01003,
    prepareTargets: prepareSolidFillColorSession01002,
    applyLiveDirect: liveSolidFillColor01002,
    applyLive: applySolidFillColor01001,
    applyFinal: applySolidFillColor01001
  });
  bindColorPair(grad1Input, grad1Text, { reason: 'fill-gradient-c1', prepareTargets: prepareFillGradientColorSession01002, applyLiveDirect: (targets, hex) => liveFillGradientStop01002(1, targets, hex), applyLive: (o) => applyGradientStop01001(1, o), applyFinal: (o) => applyGradientStop01001(1, o) });
  bindColorPair(grad2Input, grad2Text, { reason: 'fill-gradient-c2', prepareTargets: prepareFillGradientColorSession01002, applyLiveDirect: (targets, hex) => liveFillGradientStop01002(2, targets, hex), applyLive: (o) => applyGradientStop01001(2, o), applyFinal: (o) => applyGradientStop01001(2, o) });
  bindColorPair(grad3Input, grad3Text, { reason: 'fill-gradient-c3', prepareTargets: prepareFillGradientColorSession01002, applyLiveDirect: (targets, hex) => liveFillGradientStop01002(3, targets, hex), applyLive: (o) => applyGradientStop01001(3, o), applyFinal: (o) => applyGradientStop01001(3, o) });

  // кут градієнта 0..360
  bindFillRangeLive00997(gradAngleRange, gradAngleNumber, { min: 0, max: 360, fallback: 90, reason: 'gradient-angle', onStart: (targets) => targets.forEach(prepareFillVisualTarget00999), applyLive: applyGradientAngle00999, applyFinal: applyGradientAngle00999 });

  // --- Ч/Б фону (0..100) ---
  bindFillRangeLive00997(grayRange, grayNumber, {
    min: 0, max: 100, fallback: 0, reason: 'background-gray',
    onStart: (targets) => targets.forEach(prepareFillVisualTarget00999),
    applyLive: applyBackgroundGray00999,
    applyFinal: applyBackgroundGray00999
  });



  if (imageUrlInput) {
    let urlRaf00997 = 0;
    const startUrl00997 = () => ensureFillEditSession00997_('image-url-start');
    imageUrlInput.addEventListener('pointerdown', startUrl00997, true);
    imageUrlInput.addEventListener('focus', startUrl00997, true);
    imageUrlInput.addEventListener('input', () => {
      updateImagePickButtonPreview(imageUrlInput.value || '');
      if (urlRaf00997) return;
      urlRaf00997 = requestAnimationFrame(() => {
        urlRaf00997 = 0;
        applyFill({ live: true, useSessionTargets: true });
      });
    });
    imageUrlInput.addEventListener('change', () => {
      if (urlRaf00997) { try { cancelAnimationFrame(urlRaf00997); } catch (_) {} urlRaf00997 = 0; }
      updateImagePickButtonPreview(imageUrlInput.value || '');
      applyFill({ live: false, useSessionTargets: true, endSession: true });
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
    bindFillRangeLive00997(imagePosXRange, null, { min: 1, max: 100, fallback: 50, reason: 'image-pos-x', onValue: () => syncPosLabel(imagePosXRange, imagePosXVal), onStart: (targets) => targets.forEach(prepareFillVisualTarget00999), applyLive: (o) => applyImagePositionAxis00999('x', o), applyFinal: (o) => applyImagePositionAxis00999('x', o) });
    syncPosLabel(imagePosXRange, imagePosXVal);
  }
  if (imagePosYRange) {
    bindFillRangeLive00997(imagePosYRange, null, { min: 1, max: 100, fallback: 50, reason: 'image-pos-y', onValue: () => syncPosLabel(imagePosYRange, imagePosYVal), onStart: (targets) => targets.forEach(prepareFillVisualTarget00999), applyLive: (o) => applyImagePositionAxis00999('y', o), applyFinal: (o) => applyImagePositionAxis00999('y', o) });
    syncPosLabel(imagePosYRange, imagePosYVal);
  }

  function syncPctLabel(el, outEl) {
    if (!el || !outEl) return;
    outEl.textContent = `${el.value}%`;
  }

  if (imageScaleRange) {
    bindFillRangeLive00997(imageScaleRange, null, { min: 0, max: 200, fallback: 100, reason: 'image-scale', onValue: () => syncPctLabel(imageScaleRange, imageScaleVal), onStart: (targets) => targets.forEach(prepareFillVisualTarget00999), applyLive: (o) => applyImageScaleAxis00999('all', o), applyFinal: (o) => applyImageScaleAxis00999('all', o) });
    syncPctLabel(imageScaleRange, imageScaleVal);
  }
  if (imageScaleXRange) {
    bindFillRangeLive00997(imageScaleXRange, null, { min: 0, max: 200, fallback: 100, reason: 'image-scale-x', onValue: () => syncPctLabel(imageScaleXRange, imageScaleXVal), onStart: (targets) => targets.forEach(prepareFillVisualTarget00999), applyLive: (o) => applyImageScaleAxis00999('x', o), applyFinal: (o) => applyImageScaleAxis00999('x', o) });
    syncPctLabel(imageScaleXRange, imageScaleXVal);
  }
  if (imageScaleYRange) {
    bindFillRangeLive00997(imageScaleYRange, null, { min: 0, max: 200, fallback: 100, reason: 'image-scale-y', onValue: () => syncPctLabel(imageScaleYRange, imageScaleYVal), onStart: (targets) => targets.forEach(prepareFillVisualTarget00999), applyLive: (o) => applyImageScaleAxis00999('y', o), applyFinal: (o) => applyImageScaleAxis00999('y', o) });
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
  bindColorPair(filterColorInput, filterColorText, { reason: 'filter-color', compositorKind: 'filter', commitCanonical: commitSolidFilterCanonical01003, prepareTargets: prepareFilterSolidColorSession01002, applyLiveDirect: liveFilterSolidColor01002, applyLive: applyFilterSolidColor01001, applyFinal: applyFilterSolidColor01001 });
  bindColorPair(fGrad1Input, fGrad1Text, { reason: 'filter-gradient-c1', prepareTargets: prepareFilterGradientColorSession01002, applyLiveDirect: (targets, hex) => liveFilterGradientStop01002(1, targets, hex), applyLive: (o) => applyFilterGradientStop01001(1, o), applyFinal: (o) => applyFilterGradientStop01001(1, o) });
  bindColorPair(fGrad2Input, fGrad2Text, { reason: 'filter-gradient-c2', prepareTargets: prepareFilterGradientColorSession01002, applyLiveDirect: (targets, hex) => liveFilterGradientStop01002(2, targets, hex), applyLive: (o) => applyFilterGradientStop01001(2, o), applyFinal: (o) => applyFilterGradientStop01001(2, o) });
  bindColorPair(fGrad3Input, fGrad3Text, { reason: 'filter-gradient-c3', prepareTargets: prepareFilterGradientColorSession01002, applyLiveDirect: (targets, hex) => liveFilterGradientStop01002(3, targets, hex), applyLive: (o) => applyFilterGradientStop01001(3, o), applyFinal: (o) => applyFilterGradientStop01001(3, o) });

  // кут фільтра
  if (filterAngleRange) {
    bindFillRangeLive00997(filterAngleRange, filterAngleNumber, {
      min: 0, max: 360, fallback: 90, reason: 'filter-angle',
      onValue: (v) => { if (filterAngleVal) filterAngleVal.textContent = v + "°"; },
      onStart: (targets) => targets.forEach(prepareFilterTarget00999),
      applyLive: applyFilterAngle00999,
      applyFinal: applyFilterAngle00999
    });
    if (filterAngleVal) filterAngleVal.textContent = String(filterAngleRange.value) + "°";
  }

  // прозорість фільтра
  bindFillRangeLive00997(filterOpacityRange, filterOpacityNumber, {
    min: 0, max: 100, fallback: 0, reason: 'filter-opacity',
    onValue: (v) => { if (filterOpacityVal) filterOpacityVal.textContent = `${v}%`; },
    onStart: (targets) => targets.forEach(prepareFilterTarget00999),
    applyLive: applyFilterOpacity00999,
    applyFinal: applyFilterOpacity00999
  });

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
        for (const prop of [FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999]) t.style.removeProperty(prop);
        t.style.removeProperty(FILL_LAYER_IMAGE_VAR_00998);
        t.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
        t.style.removeProperty(FILL_AUTHORITY_VERSION_VAR_00999);
        removeFilterLayer00999(t);
        delete t.dataset.stFillCustomLayer;
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

    // 00999: each continuous effect is read from the same canonical value it writes.
    const blockAlphaRaw00999 = Number.parseFloat(cs.getPropertyValue('--st-block-surface-alpha'));
    const blockTransparencyPct00995 = Math.round((1 - (Number.isFinite(blockAlphaRaw00999) ? Math.max(0, Math.min(1, blockAlphaRaw00999)) : 1)) * 100);
    const canonicalBlockBlurPx = parseBlurPx00999(cs.getPropertyValue('--st-block-surface-blur'));
    const authoredBlockBlurPx = parseBlurPx00999(cs.backdropFilter || cs.webkitBackdropFilter || '');
    const blockBlurPx00999 = canonicalBlockBlurPx != null ? canonicalBlockBlurPx : (authoredBlockBlurPx != null ? authoredBlockBlurPx : 0);
    const blockBlurPct00995 = Math.round(clampPct00994((blockBlurPx00999 / BLOCK_SURFACE_BLUR_MAX_PX_00995) * 100, 0));
    if (blockTransparencyRange) blockTransparencyRange.value = String(blockTransparencyPct00995);
    if (blockTransparencyNumber) blockTransparencyNumber.value = String(blockTransparencyPct00995);
    if (blockBlurRange) blockBlurRange.value = String(blockBlurPct00995);
    if (blockBlurNumber) blockBlurNumber.value = String(blockBlurPct00995);

    // 00999: element blur UI is derived from --st-element-fx-blur (px), not a second pct state.
    const elementOpacityRaw00994 = (cs.getPropertyValue('--st-element-fx-opacity') || '').trim();
    const elementBlurPx00999 = parseBlurPx00999(cs.getPropertyValue('--st-element-fx-blur')) ?? 0;
    const parsedElementOpacity00994 = Number.parseFloat(elementOpacityRaw00994);
    const elementOpacityPct00994 = Math.round(Math.max(0, Math.min(1, Number.isFinite(parsedElementOpacity00994) ? parsedElementOpacity00994 : 1)) * 100);
    const elementBlurPct00994 = Math.round(clampPct00994((elementBlurPx00999 / ELEMENT_BLUR_MAX_PX_00994) * 100, 0));
    if (elementOpacityRange) elementOpacityRange.value = String(elementOpacityPct00994);
    if (elementOpacityNumber) elementOpacityNumber.value = String(elementOpacityPct00994);
    if (elementBlurRange) elementBlurRange.value = String(elementBlurPct00994);
    if (elementBlurNumber) elementBlurNumber.value = String(elementBlurPct00994);

    // 00999: Filter UI is synchronized before any Fill-mode early return. This prevents
    // the first opacity tick from rebuilding an existing filter with stale/default black UI.
    const filterState00999 = parseFilterAuthority00999(el, cs);
    setFilterMode(filterState00999.mode);
    const filterOpacityPct00999 = Math.round(Math.max(0, Math.min(1, filterState00999.opacity)) * 100);
    if (filterOpacityRange) filterOpacityRange.value = String(filterOpacityPct00999);
    if (filterOpacityNumber) filterOpacityNumber.value = String(filterOpacityPct00999);
    if (filterOpacityVal) filterOpacityVal.textContent = `${filterOpacityPct00999}%`;
    if (filterAngleRange) filterAngleRange.value = String(Math.round(filterState00999.angle));
    if (filterAngleNumber) filterAngleNumber.value = String(Math.round(filterState00999.angle));
    if (filterAngleVal) filterAngleVal.textContent = `${Math.round(filterState00999.angle)}°`;
    if (filterState00999.mode === 'color' && filterState00999.colors[0]) {
      const c = filterState00999.colors[0];
      if (filterColorInput) filterColorInput.value = c;
      if (filterColorText) filterColorText.value = c;
    } else if (filterState00999.mode === 'gradient') {
      const [c1, c2, c3] = filterState00999.colors;
      if (c1) { if (fGrad1Input) fGrad1Input.value = c1; if (fGrad1Text) fGrad1Text.value = c1; }
      if (c2) { if (fGrad2Input) fGrad2Input.value = c2; if (fGrad2Text) fGrad2Text.value = c2; }
      if (c3) { if (fGrad3Input) fGrad3Input.value = c3; if (fGrad3Text) fGrad3Text.value = c3; }
    }

    // Якщо фон керується через .st-bgfx (v6+) — читаємо саме CSS-змінні
    if (fxBg && fxBg !== 'none') {
      // opacity
      const opParsed00999 = Number.parseFloat(fxOpacityRaw);
      const op = Math.max(0, Math.min(1, Number.isFinite(opParsed00999) ? opParsed00999 : 1));
      const opPct = Math.round(op * 100);
      if (opacityRange) opacityRange.value = String(opPct);
      if (opacityNumber) opacityNumber.value = String(opPct);

      // gray
      const grayParsed00999 = Number.parseFloat(fxGrayRaw);
      const g = Math.max(0, Math.min(1, Number.isFinite(grayParsed00999) ? grayParsed00999 : 0));
      const gPct = Math.round(g * 100);
      if (grayRange) grayRange.value = String(gPct);
      if (grayNumber) grayNumber.value = String(gPct);

      if (fxBg.includes('linear-gradient')) {
        setMode('gradient');

        // 00999 canonical gradient UI reads the exact variables that sliders write.
        const canonicalAngleRaw00999 = (cs.getPropertyValue(FILL_GRADIENT_ANGLE_VAR_00999) || '').trim();
        const canonicalAngle00999 = Number.parseFloat(canonicalAngleRaw00999);
        const angM = fxBg.match(/linear-gradient\(\s*([0-9]+)\s*deg/i);
        const ang = Number.isFinite(canonicalAngle00999)
          ? Math.max(0, Math.min(360, canonicalAngle00999))
          : (angM ? Math.max(0, Math.min(360, parseInt(angM[1], 10) || 0)) : 90);
        if (gradAngleRange) gradAngleRange.value = String(Math.round(ang));
        if (gradAngleNumber) gradAngleNumber.value = String(Math.round(ang));

        const canonicalCols00999 = [
          (cs.getPropertyValue(FILL_GRADIENT_C1_VAR_00999) || '').trim(),
          (cs.getPropertyValue(FILL_GRADIENT_C2_VAR_00999) || '').trim(),
          (cs.getPropertyValue(FILL_GRADIENT_C3_VAR_00999) || '').trim()
        ].map((v) => /^#[0-9a-f]{3,6}$/i.test(v) ? normalizeHex(v) : '');
        const literalCols00999 = fxBg.match(/#[0-9a-fA-F]{6}\b/g) || [];
        const cols = canonicalCols00999.some(Boolean) ? canonicalCols00999 : literalCols00999;
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
          const canonicalScale00999 = Number.parseFloat(cs.getPropertyValue(IMAGE_SCALE_VAR_00999));
          const canonicalScaleX00999 = Number.parseFloat(cs.getPropertyValue(IMAGE_SCALE_X_VAR_00999));
          const canonicalScaleY00999 = Number.parseFloat(cs.getPropertyValue(IMAGE_SCALE_Y_VAR_00999));
          const hasCanonicalScale00999 = Number.isFinite(canonicalScale00999) || Number.isFinite(canonicalScaleX00999) || Number.isFinite(canonicalScaleY00999) || sRaw.includes(IMAGE_SCALE_VAR_00999);
          const mSize = sRaw.match(/^\s*([0-9]{1,3})%\s+([0-9]{1,3})%\s*$/);
          if (hasCanonicalScale00999) {
            imageSizeSelect.value = 'custom';
            syncCustomSizeVisibility();
            if (imageScaleRange) imageScaleRange.value = String(Math.max(0, Math.min(200, Number.isFinite(canonicalScale00999) ? canonicalScale00999 : 100)));
            if (imageScaleXRange) imageScaleXRange.value = String(Math.max(0, Math.min(200, Number.isFinite(canonicalScaleX00999) ? canonicalScaleX00999 : 100)));
            if (imageScaleYRange) imageScaleYRange.value = String(Math.max(0, Math.min(200, Number.isFinite(canonicalScaleY00999) ? canonicalScaleY00999 : 100)));
            syncPctLabel(imageScaleRange, imageScaleVal);
            syncPctLabel(imageScaleXRange, imageScaleXVal);
            syncPctLabel(imageScaleYRange, imageScaleYVal);
          } else if (mSize) {
            imageSizeSelect.value = 'custom';
            syncCustomSizeVisibility();
            const ex = Math.max(0, Math.min(400, parseInt(mSize[1], 10) || 100));
            const ey = Math.max(0, Math.min(400, parseInt(mSize[2], 10) || 100));
            if (imageScaleRange) imageScaleRange.value = '100';
            if (imageScaleXRange) imageScaleXRange.value = String(Math.max(0, Math.min(200, ex)));
            if (imageScaleYRange) imageScaleYRange.value = String(Math.max(0, Math.min(200, ey)));
            syncPctLabel(imageScaleRange, imageScaleVal);
            syncPctLabel(imageScaleXRange, imageScaleXVal);
            syncPctLabel(imageScaleYRange, imageScaleYVal);
          } else if (sRaw) {
            imageSizeSelect.value = sRaw;
            syncCustomSizeVisibility();
          }
        }

        if (imagePosSelect) {
          const canonicalPosX00999 = Number.parseFloat(cs.getPropertyValue('--st-bgfx-bg-pos-x'));
          const canonicalPosY00999 = Number.parseFloat(cs.getPropertyValue('--st-bgfx-bg-pos-y'));
          const hasCanonicalPos00999 = Number.isFinite(canonicalPosX00999) || Number.isFinite(canonicalPosY00999) || pRaw.includes('--st-bgfx-bg-pos-x');
          const mPos = pRaw.match(/^\s*([0-9]{1,3})%\s+([0-9]{1,3})%\s*$/);
          if (hasCanonicalPos00999) {
            imagePosSelect.value = 'custom';
            syncCustomPosVisibility();
            const px = Math.max(1, Math.min(100, Number.isFinite(canonicalPosX00999) ? canonicalPosX00999 : 50));
            const py = Math.max(1, Math.min(100, Number.isFinite(canonicalPosY00999) ? canonicalPosY00999 : 50));
            if (imagePosXRange) imagePosXRange.value = String(Math.round(px));
            if (imagePosYRange) imagePosYRange.value = String(Math.round(py));
            syncPosLabel(imagePosXRange, imagePosXVal);
            syncPosLabel(imagePosYRange, imagePosYVal);
          } else if (mPos) {
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

      syncAllColorTriggers01005();
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
    syncAllColorTriggers01005();
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
    let liveRaf00997 = 0;

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

      // має бути хоч 1 таргет; під час жесту використовуємо заморожений session target.
      const sessionTargets00997 = cleanSessionFillTargets00779_(activeFillEditSessionTargets00779_);
      const targets = sessionTargets00997.length ? sessionTargets00997 : getTargets();
      const t = (targets && targets[0]) ? targets[0] : null;
      if (!t) return false;

      // drag дозволяємо ТІЛЬКИ якщо курсор реально над активним елементом
      const elAt = document.elementFromPoint(ev.clientX, ev.clientY);
      if (!elAt) return false;
      if (elAt !== t && !t.contains(elAt)) return false;

      return true;
    };

    const onUp = () => {
      const shouldCommit = isDown && isDragging;
      if (liveRaf00997) { try { cancelAnimationFrame(liveRaf00997); } catch (_) {} liveRaf00997 = 0; }
      if (shouldCommit) applyFill({ live: false, useSessionTargets: true, endSession: true });
      else if (isDown) endFillEditSession00779_('background-position-drag-cancel');
      isDown = false;
      isDragging = false;
      start = null;
    };

    canvas.addEventListener('pointerdown', (ev) => {
      if (!canDragNow(ev)) return;
      isDown = true;
      isDragging = false;

      const targets = beginFillEditSession00779_('background-position-drag-start');
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

      if (!liveRaf00997) {
        liveRaf00997 = requestAnimationFrame(() => {
          liveRaf00997 = 0;
          applyFill({ live: true, useSessionTargets: true });
        });
      }
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
