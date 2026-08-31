// ================================
// Тимчасовий state для guides (FIX)
// ================================
const guidesState = {
  enabled: false,
  items: []
};



// js/design/widgets/fill/fill-widget.js
// 01007: Every selection fully hydrates Fill UI from the active SiteFrameStore node.
// 01005: Fill no longer opens the native Chrome/Windows <input type="color"> picker.
// 01006: picker open is read-only. A color edit session starts only after the user actually changes the active color; every session re-reads the selected control value, so no previous element color can bleed into a newly selected element.
// 01008: grabbing the existing HSV/Hue thumb keeps the exact current value under the pointer. Pointerdown on the thumb is a strict no-op; color changes begin only after the thumb is actually moved.
// 01009: gradient migration preserves authored per-stop alpha and 2-stop geometry; explicit Fill suppresses the authored base background so first movement cannot double-layer/jump.
// 01011: Fill and Filter gradients own explicit 2/3-stop enable masks; circular toggles switch stops without inventing a third stop. Filter color also has an independent visual enable toggle.
// 01012 / stage 01030: selection hydration gives a real image layer priority over a co-authored gradient, reads the active background-slider slide, and renders a full-width aspect-aware image preview without writing to Store.
// 01013 / stage 01031: visual hydration also recognizes authored content <img> blocks/containers and the common preview renders the actual visible fill for every selection: image, gradient, solid color, or transparency.
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

      <!-- 01031 · УНІВЕРСАЛЬНЕ ПРЕВʼЮ ФОНУ -->
      <div class="design-field st-fill-visual-preview-01031" data-fill-preview-field>
        <div class="design-field__label" data-fill-preview-label>Фон вибраного елемента</div>
        <button
          type="button"
          data-fill="imagePreview"
          title="Фон вибраного елемента"
          style="
            width:100%;height:auto;min-height:54px;
            aspect-ratio:16 / 9;
            margin:0;padding:0;display:block;
            border:1px solid rgba(255,255,255,.14);border-radius:12px;
            background-color:rgba(255,255,255,.045);
            background-size:cover;background-position:center;background-repeat:no-repeat;
            box-shadow:inset 0 0 0 1px rgba(0,0,0,.10);
            overflow:hidden;cursor:default;
          "
          aria-label="Превʼю фону вибраного елемента"
        ></button>
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
          <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="gradEnabled1" checked aria-label="Увімкнути або вимкнути 1-й колір градієнта" />
          <button type="button" class="design-color st-color-trigger-01005" data-fill="gradColor1" value="#0f172a" aria-label="Вибрати перший колір градієнта"></button>
          <input type="text" class="design-input" data-fill="gradColor1Text" value="#0f172a" />
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">2-й колір</label>
          <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="gradEnabled2" checked aria-label="Увімкнути або вимкнути 2-й колір градієнта" />
          <button type="button" class="design-color st-color-trigger-01005" data-fill="gradColor2" value="#1e293b" aria-label="Вибрати другий колір градієнта"></button>
          <input type="text" class="design-input" data-fill="gradColor2Text" value="#1e293b" />
        </div>
        <div class="design-fill-row">
          <label class="design-fill-label">3-й колір</label>
          <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="gradEnabled3" checked aria-label="Увімкнути або вимкнути 3-й колір градієнта" />
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
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;
            "
          >📁</button>

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
            <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="filterColorEnabled" checked aria-label="Увімкнути або вимкнути кольоровий фільтр" />
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterColor" value="#000000" aria-label="Вибрати колір фільтра"></button>
            <input type="text" class="design-input" data-fill="filterColorText" value="#000000">
          </div>
        </div>

        <!-- Фільтр: Градієнт (3 кольори) -->
        <div class="design-bg-filter-group" data-filter-group="gradient" style="display:none;">
          <div class="design-bg-row">
            <label>Колір 1</label>
            <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="filterGradEnabled1" checked aria-label="Увімкнути або вимкнути 1-й колір градієнта фільтра" />
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor1" value="#000000" aria-label="Вибрати перший колір градієнта фільтра"></button>
            <input type="text" class="design-input" data-fill="filterGradColor1Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 2</label>
            <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="filterGradEnabled2" checked aria-label="Увімкнути або вимкнути 2-й колір градієнта фільтра" />
            <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor2" value="#000000" aria-label="Вибрати другий колір градієнта фільтра"></button>
            <input type="text" class="design-input" data-fill="filterGradColor2Text" value="#000000">
          </div>
          <div class="design-bg-row">
            <label>Колір 3</label>
            <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="filterGradEnabled3" checked aria-label="Увімкнути або вимкнути 3-й колір градієнта фільтра" />
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
  const gradEnabledInputs01011 = [1,2,3].map(i => sectionEl.querySelector(`[data-fill="gradEnabled${i}"]`));
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
          <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="filterGradEnabled2" checked aria-label="Увімкнути або вимкнути 2-й колір градієнта фільтра" />
          <button type="button" class="design-color st-color-trigger-01005" data-fill="filterGradColor2" value="#000000" aria-label="Вибрати другий колір градієнта фільтра"></button>
          <input type="text" class="design-input" data-fill="filterGradColor2Text" value="#000000" />
        </div>
      `);
      if (!has3) rows.push(`
        <div class="design-fill-row">
          <label class="design-fill-label">3-й колір</label>
          <input type="checkbox" class="design-fill-stop-toggle-01011" data-fill="filterGradEnabled3" checked aria-label="Увімкнути або вимкнути 3-й колір градієнта фільтра" />
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
  const filterColorEnabledInput01011 = sectionEl.querySelector('[data-fill="filterColorEnabled"]');
  const filterGradEnabledInputs01011 = [1,2,3].map(i => sectionEl.querySelector(`[data-fill="filterGradEnabled${i}"]`));
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

  // ✅ Кнопка папки + велике proportional preview активного background image.
  const imagePickBtn  = sectionEl.querySelector('[data-fill="imagePick"]');
  const imagePreviewBtn01030 = sectionEl.querySelector('[data-fill="imagePreview"]');

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
  const FILL_GRADIENT_P1_VAR_01009 = '--st-bgfx-gradient-p1';
  const FILL_GRADIENT_P2_VAR_01009 = '--st-bgfx-gradient-p2';
  const FILL_GRADIENT_P3_VAR_01009 = '--st-bgfx-gradient-p3';
  const FILL_GRADIENT_MASK_VAR_01011 = '--st-bgfx-gradient-mask';
  const FILTER_GRADIENT_MASK_VAR_01011 = '--st-bgfx-filter-gradient-mask';
  const FILTER_ENABLED_VAR_01011 = '--st-bgfx-filter-enabled';
  const FILTER_COLOR_ENABLED_VAR_01011 = '--st-bgfx-filter-color-enabled';
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


  function normalizeStopMask01011(value, fallback = [true,true,false], minimum = 2) {
    let mask = null;
    if (Array.isArray(value)) mask = value.slice(0,3).map(Boolean);
    else {
      const raw = String(value ?? '').trim();
      if (/^[01]{3}$/.test(raw)) mask = raw.split('').map(ch => ch === '1');
      else if (raw) mask = raw.split(/[\s,;|]+/).filter(Boolean).slice(0,3).map(v => /^(?:1|true|on|yes)$/i.test(v));
    }
    if (!mask || mask.length < 3) mask = Array.isArray(fallback) ? fallback.slice(0,3).map(Boolean) : [true,true,false];
    while (mask.length < 3) mask.push(false);
    let count = mask.filter(Boolean).length;
    for (let i = 0; count < Math.max(1, minimum) && i < 3; i += 1) {
      if (!mask[i]) { mask[i] = true; count += 1; }
    }
    return mask.slice(0,3);
  }

  function stopMaskString01011(mask, fallback = [true,true,false], minimum = 2) {
    return normalizeStopMask01011(mask, fallback, minimum).map(Boolean).map(v => v ? '1' : '0').join('');
  }

  function stopMaskFromInputs01011(inputs, fallback = [true,true,false], minimum = 2) {
    const raw = (inputs || []).slice(0,3).map(input => !!input?.checked);
    return normalizeStopMask01011(raw, fallback, minimum);
  }

  function setStopMaskInputs01011(inputs, mask, fallback = [true,true,false], minimum = 2) {
    const next = normalizeStopMask01011(mask, fallback, minimum);
    (inputs || []).slice(0,3).forEach((input, i) => { if (input) input.checked = !!next[i]; });
    return next;
  }

  function evenlySpaceEnabledGradientStops01011(mask, positions = [0,50,100]) {
    const next = Array.isArray(positions) ? positions.slice(0,3) : [0,50,100];
    while (next.length < 3) next.push([0,50,100][next.length]);
    const enabled = normalizeStopMask01011(mask, [true,true,false], 2).map((v,i) => v ? i : -1).filter(i => i >= 0);
    enabled.forEach((index, order) => { next[index] = enabled.length <= 1 ? 0 : (order * 100 / (enabled.length - 1)); });
    return next.map((v,i) => gradientPosition01009(v,[0,50,100][i]));
  }

  function fillGradientImage01011(mask = null) {
    const enabled = normalizeStopMask01011(mask, [true,true,false], 2);
    const colorVars = [FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999];
    const posVars = [FILL_GRADIENT_P1_VAR_01009,FILL_GRADIENT_P2_VAR_01009,FILL_GRADIENT_P3_VAR_01009];
    const fallbacks = ['#0f172a','#1e293b','#334155'];
    const posFallbacks = ['0%','50%','100%'];
    const stops = enabled.map((on,i) => on ? `var(${colorVars[i]},${fallbacks[i]}) var(${posVars[i]},${posFallbacks[i]})` : '').filter(Boolean);
    return `linear-gradient(var(${FILL_GRADIENT_ANGLE_VAR_00999},90deg), ${stops.join(', ')})`;
  }

  function filterGradientImage01011(mask = null) {
    const enabled = normalizeStopMask01011(mask, [true,true,false], 2);
    const colorVars = [FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999];
    const stops = enabled.map((on,i) => on ? `var(${colorVars[i]},#000000)` : '').filter(Boolean);
    return `linear-gradient(var(${FILTER_ANGLE_VAR_00999},90deg), ${stops.join(', ')})`;
  }

  // Compatibility name retained for existing hot paths; 01011 now reads the live UI mask.
  function fillGradientImage00999(mask = null) {
    const effective = mask || stopMaskFromInputs01011(gradEnabledInputs01011, [true,true,false], 2);
    return fillGradientImage01011(effective);
  }

  function gradientCssColor01009(hex, alpha = 1) {
    const color = normalizeHex(hex || '#000000');
    const a = Math.max(0, Math.min(1, Number.isFinite(Number(alpha)) ? Number(alpha) : 1));
    return a >= 0.999 ? color : hexToRgba(color, +a.toFixed(4));
  }

  function gradientPosition01009(value, fallback) {
    const n = Number.parseFloat(String(value ?? ''));
    return Math.max(0, Math.min(100, Number.isFinite(n) ? n : fallback));
  }

  function splitCssArgs01009(source) {
    const out = [];
    let buf = '', depth = 0;
    for (const ch of String(source || '')) {
      if (ch === '(') depth += 1;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if (ch === ',' && depth === 0) { out.push(buf.trim()); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function parseGradientStops01009(source) {
    const raw = String(source || '').trim();
    const open = raw.indexOf('('), close = raw.lastIndexOf(')');
    if (!/gradient\(/i.test(raw) || open < 0 || close <= open) return [];
    const parts = splitCssArgs01009(raw.slice(open + 1, close));
    const stops = [];
    for (const part of parts) {
      const colorMatch = part.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/i);
      if (!colorMatch) continue;
      const parsed = cssColorToken00999(colorMatch[0]);
      if (!parsed) continue;
      const after = part.slice((colorMatch.index || 0) + colorMatch[0].length);
      const posMatch = after.match(/(-?\d+(?:\.\d+)?)%/);
      stops.push({ hex: parsed.hex, alpha: parsed.alpha, position: posMatch ? gradientPosition01009(posMatch[1], 0) : null });
    }
    const n = stops.length;
    if (!n) return [];
    for (let i = 0; i < n; i += 1) {
      if (stops[i].position == null) stops[i].position = n === 1 ? 0 : (i * 100 / (n - 1));
    }
    return stops;
  }

  function normalizeGradientTriplet01009(stops, fallbacks = ['#0f172a','#1e293b','#334155']) {
    const src = Array.isArray(stops) ? stops.filter(Boolean) : [];
    if (!src.length) return {
      colors: [...fallbacks], alphas: [1,1,1], positions: [0,50,100], sourceCount: 0
    };
    if (src.length === 1) {
      const one = src[0];
      return { colors:[one.hex,one.hex,one.hex], alphas:[one.alpha,one.alpha,one.alpha], positions:[0,100,100], sourceCount:1 };
    }
    if (src.length === 2) {
      const [a,b] = src;
      return { colors:[a.hex,b.hex,b.hex], alphas:[a.alpha,b.alpha,b.alpha], positions:[a.position ?? 0,b.position ?? 100,b.position ?? 100], sourceCount:2 };
    }
    const first = src.slice(0,3);
    return {
      colors:first.map((x,i)=>x.hex || fallbacks[i]),
      alphas:first.map(x=>Number.isFinite(x.alpha) ? x.alpha : 1),
      positions:first.map((x,i)=>gradientPosition01009(x.position,[0,50,100][i])),
      sourceCount:src.length
    };
  }

  function writeGradientState01009(target, state = {}) {
    if (!(target instanceof HTMLElement)) return;
    const colors = [state.grad1Raw || '#0f172a', state.grad2Raw || '#1e293b', state.grad3Raw || '#334155'];
    const alphas = Array.isArray(state.gradientAlphas) ? state.gradientAlphas : [1,1,1];
    const enabled = normalizeStopMask01011(state.gradientEnabled, [true,true,false], 2);
    const positions = evenlySpaceEnabledGradientStops01011(enabled, Array.isArray(state.gradientPositions) ? state.gradientPositions : [0,50,100]);
    const cVars = [FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999];
    const pVars = [FILL_GRADIENT_P1_VAR_01009,FILL_GRADIENT_P2_VAR_01009,FILL_GRADIENT_P3_VAR_01009];
    for (let i=0;i<3;i+=1) {
      target.style.setProperty(cVars[i], gradientCssColor01009(colors[i], alphas[i]));
      target.style.setProperty(pVars[i], `${gradientPosition01009(positions[i],[0,50,100][i])}%`);
    }
    target.style.setProperty(FILL_GRADIENT_MASK_VAR_01011, stopMaskString01011(enabled, [true,true,false], 2));
    target.style.setProperty('--st-bgfx-bg', fillGradientImage01011(enabled));
  }

  function preserveStopAlpha01009(target, index, nextHex) {
    const vars = [FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999];
    const prop = vars[index - 1];
    if (!prop || !(target instanceof HTMLElement)) return normalizeHex(nextHex || '#000000');
    let raw = String(target.style.getPropertyValue(prop) || '').trim();
    if (!raw) { try { raw = String(getComputedStyle(target).getPropertyValue(prop) || '').trim(); } catch (_) {} }
    const parsed = cssColorToken00999(raw);
    return gradientCssColor01009(nextHex, parsed?.alpha ?? 1);
  }

  function imageCustomSizeExpression00999() {
    return `calc(var(${IMAGE_SCALE_VAR_00999},100) * var(${IMAGE_SCALE_X_VAR_00999},100) / 100 * 1%) calc(var(${IMAGE_SCALE_VAR_00999},100) * var(${IMAGE_SCALE_Y_VAR_00999},100) / 100 * 1%)`;
  }

  function imageCustomPositionExpression00999() {
    return `var(--st-bgfx-bg-pos-x,50%) var(--st-bgfx-bg-pos-y,50%)`;
  }

  function markFillAuthority00999(target) {
    if (target instanceof HTMLElement) target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01011');
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
    const gradientEnabled01011 = stopMaskFromInputs01011(gradEnabledInputs01011, [true,true,false], 2);
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
    const filterEnabled01011 = filterColorEnabledInput01011 ? !!filterColorEnabledInput01011.checked : true;
    const filterGradientEnabled01011 = stopMaskFromInputs01011(filterGradEnabledInputs01011, [true,true,false], 2);
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
      gradientEnabled: gradientEnabled01011,
      gradientAlphas: (() => { try { const a = JSON.parse(sectionEl.dataset.stFillGradientAlphas01009 || ''); return Array.isArray(a) && a.length >= 3 ? a.slice(0,3) : [1,1,1]; } catch (_) { return [1,1,1]; } })(),
      gradientPositions: (() => { try { const a = JSON.parse(sectionEl.dataset.stFillGradientPositions01009 || ''); return Array.isArray(a) && a.length >= 3 ? a.slice(0,3) : [0,50,100]; } catch (_) { return [0,50,100]; } })(),
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
      filterEnabled: filterEnabled01011,
      filterGradientEnabled: filterGradientEnabled01011,
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
      for (const prop of ['--st-bgfx-bg','--st-bgfx-bg-color','--st-bgfx-bg-opacity','--st-bgfx-bg-size','--st-bgfx-bg-pos','--st-bgfx-bg-repeat','--st-bgfx-bg-pos-x','--st-bgfx-bg-pos-y','--st-bgfx-gray','--st-bgfx-filter','--st-bgfx-filter-opacity',FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILL_GRADIENT_P1_VAR_01009,FILL_GRADIENT_P2_VAR_01009,FILL_GRADIENT_P3_VAR_01009,FILL_GRADIENT_MASK_VAR_01011,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,FILTER_GRADIENT_MASK_VAR_01011,FILTER_ENABLED_VAR_01011,FILTER_COLOR_ENABLED_VAR_01011,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999,FILL_LAYER_IMAGE_VAR_00998,FILL_FILTER_IMAGE_VAR_00998,FILL_AUTHORITY_VERSION_VAR_00999]) {
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

  function filterImageFromCanonical00999(mode = 'off', mask = null) {
    if (mode === 'color') {
      return `linear-gradient(var(${FILTER_COLOR_VAR_01001},#000000), var(${FILTER_COLOR_VAR_01001},#000000))`;
    }
    if (mode === 'gradient') {
      const effective = mask || stopMaskFromInputs01011(filterGradEnabledInputs01011, [true,true,false], 2);
      return filterGradientImage01011(effective);
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
      const existingMask01011 = cssVarTrim00999(target, style, FILTER_GRADIENT_MASK_VAR_01011);
      const parsedStopCount01011 = parseGradientStops01009(parsed.image || '').length;
      const parsedMask01011 = parsed.mode === 'gradient'
        ? normalizeStopMask01011(existingMask01011 || (parsedStopCount01011 >= 3 ? '111' : '110'), [true,true,false], 2)
        : null;
      if (parsedMask01011) target.style.setProperty(FILTER_GRADIENT_MASK_VAR_01011, stopMaskString01011(parsedMask01011, [true,true,false], 2));
      if (!target.style.getPropertyValue(FILTER_ENABLED_VAR_01011).trim()) target.style.setProperty(FILTER_ENABLED_VAR_01011, '1');
      if (parsed.mode === 'color' && !target.style.getPropertyValue(FILTER_COLOR_ENABLED_VAR_01011).trim()) target.style.setProperty(FILTER_COLOR_ENABLED_VAR_01011, '1');
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999(parsed.mode, parsedMask01011));
      target.style.setProperty('--st-bgfx-filter-opacity', String(parsed.opacity));
    } else if (!target.style.getPropertyValue('--st-bgfx-filter-opacity').trim()) {
      target.style.setProperty('--st-bgfx-filter-opacity', '0');
    }
    // Migration aliases are never authorities in 00999.
    target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
    target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01011');
    ensureFilterLayer00999(target);
    return parsed;
  }

  function filterImageFromState00999(state) {
    const mode = state?.filterMode || 'off';
    if (mode === 'color') return filterImageFromCanonical00999('color');
    if (mode === 'gradient') return filterImageFromCanonical00999('gradient', state?.filterGradientEnabled);
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
      target.style.removeProperty(FILTER_GRADIENT_MASK_VAR_01011);
      target.style.removeProperty(FILTER_ENABLED_VAR_01011);
      target.style.removeProperty(FILTER_COLOR_ENABLED_VAR_01011);
      target.style.removeProperty(FILL_FILTER_IMAGE_VAR_00998);
      return 'none';
    }
    const c1 = normalizeHex(mode === 'color' ? (state?.filterColorRaw || '#000000') : (state?.filterG1Raw || '#000000'));
    const c2 = normalizeHex(mode === 'color' ? c1 : (state?.filterG2Raw || c1));
    const c3 = normalizeHex(mode === 'color' ? c1 : (state?.filterG3Raw || c2));
    const angle = Number.isFinite(Number(state?.filterAngle)) ? Math.max(0, Math.min(360, Number(state.filterAngle))) : 90;
    const filterColorEnabled01011 = state?.filterEnabled !== false;
    const filterEnabled01011 = mode === 'color' ? filterColorEnabled01011 : true;
    target.style.setProperty(FILTER_ENABLED_VAR_01011, filterEnabled01011 ? '1' : '0');
    let filterMask01011 = null;
    if (mode === 'color') {
      target.style.setProperty(FILTER_COLOR_ENABLED_VAR_01011, filterColorEnabled01011 ? '1' : '0');
      target.style.setProperty(FILTER_COLOR_VAR_01001, c1);
      target.style.removeProperty(FILTER_C1_VAR_00999);
      target.style.removeProperty(FILTER_C2_VAR_00999);
      target.style.removeProperty(FILTER_C3_VAR_00999);
      target.style.removeProperty(FILTER_ANGLE_VAR_00999);
      target.style.removeProperty(FILTER_GRADIENT_MASK_VAR_01011);
    } else {
      filterMask01011 = normalizeStopMask01011(state?.filterGradientEnabled, [true,true,false], 2);
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.setProperty(FILTER_C1_VAR_00999, c1);
      target.style.setProperty(FILTER_C2_VAR_00999, c2);
      target.style.setProperty(FILTER_C3_VAR_00999, c3);
      target.style.setProperty(FILTER_ANGLE_VAR_00999, `${angle}deg`);
      target.style.setProperty(FILTER_GRADIENT_MASK_VAR_01011, stopMaskString01011(filterMask01011, [true,true,false], 2));
    }
    const image = filterImageFromCanonical00999(mode, filterMask01011);
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
        bgVal = fillGradientImage01011(state.gradientEnabled);
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
      bgVal = fillGradientImage01011(state.gradientEnabled);
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
        writeGradientState01009(target, state);
      } else {
        target.style.removeProperty(FILL_GRADIENT_ANGLE_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_C1_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_C2_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_C3_VAR_00999);
        target.style.removeProperty(FILL_GRADIENT_P1_VAR_01009);
        target.style.removeProperty(FILL_GRADIENT_P2_VAR_01009);
        target.style.removeProperty(FILL_GRADIENT_P3_VAR_01009);
        target.style.removeProperty(FILL_GRADIENT_MASK_VAR_01011);
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

      // 01009: explicit Fill must suppress authored template backgrounds even when
      // the template declared background:...!important. Otherwise the copied Fill layer
      // stacks over the original and the first 1px color move looks like a huge jump.
      target.style.setProperty('background', 'transparent', 'important');
      target.style.setProperty('background-image', 'none', 'important');
      target.style.setProperty('background-color', 'transparent', 'important');
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
        target.style.removeProperty(FILL_GRADIENT_P1_VAR_01009);
        target.style.removeProperty(FILL_GRADIENT_P2_VAR_01009);
        target.style.removeProperty(FILL_GRADIENT_P3_VAR_01009);
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
      for (const prop of [FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILL_GRADIENT_P1_VAR_01009,FILL_GRADIENT_P2_VAR_01009,FILL_GRADIENT_P3_VAR_01009,FILL_GRADIENT_MASK_VAR_01011,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,FILTER_GRADIENT_MASK_VAR_01011,FILTER_ENABLED_VAR_01011,FILTER_COLOR_ENABLED_VAR_01011,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999]) t.style.removeProperty(prop);
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
      for (const prop of [FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILL_GRADIENT_P1_VAR_01009,FILL_GRADIENT_P2_VAR_01009,FILL_GRADIENT_P3_VAR_01009,FILL_GRADIENT_MASK_VAR_01011,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,FILTER_GRADIENT_MASK_VAR_01011,FILTER_ENABLED_VAR_01011,FILTER_COLOR_ENABLED_VAR_01011,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999]) t.style.removeProperty(prop);
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

  // 01030: the folder button stays a folder. The image itself gets a separate,
  // full-width thumbnail whose geometry follows the selected element.
  function updateImagePickButtonPreview(url, visual = {}) {
    if (imagePickBtn) {
      imagePickBtn.style.backgroundImage = '';
      imagePickBtn.textContent = '📁';
      imagePickBtn.title = url ? 'Змінити картинку (галерея)' : 'Відкрити галерею';
    }
    if (!imagePreviewBtn01030) return;

    const cleanUrl = String(url || '').trim();
    const kind = String(visual.kind || (cleanUrl ? 'image' : 'color')).trim();
    const exactBgImage = String(visual.backgroundImage || '').trim();
    const exactBgColor = String(visual.backgroundColor || 'transparent').trim() || 'transparent';

    if (kind === 'image' && cleanUrl) {
      imagePreviewBtn01030.style.backgroundImage = exactBgImage && exactBgImage !== 'none'
        ? exactBgImage
        : `url("${cleanUrl.replace(/([\\"])/g, '\\$1')}")`;
      imagePreviewBtn01030.style.backgroundColor = exactBgColor;
      imagePreviewBtn01030.style.backgroundSize = String(visual.size || 'cover');
      imagePreviewBtn01030.style.backgroundPosition = String(visual.position || 'center center');
      imagePreviewBtn01030.style.cursor = 'pointer';
      imagePreviewBtn01030.title = 'Фонова картинка вибраного елемента · клік — відкрити галерею';
    } else if (kind === 'gradient') {
      imagePreviewBtn01030.style.backgroundImage = exactBgImage && exactBgImage !== 'none' ? exactBgImage : 'none';
      imagePreviewBtn01030.style.backgroundColor = exactBgColor;
      imagePreviewBtn01030.style.backgroundSize = 'cover';
      imagePreviewBtn01030.style.backgroundPosition = 'center';
      imagePreviewBtn01030.style.cursor = 'default';
      imagePreviewBtn01030.title = 'Градієнт вибраного елемента';
    } else {
      imagePreviewBtn01030.style.backgroundImage = 'none';
      imagePreviewBtn01030.style.backgroundColor = exactBgColor;
      imagePreviewBtn01030.style.backgroundSize = 'cover';
      imagePreviewBtn01030.style.backgroundPosition = 'center';
      imagePreviewBtn01030.style.cursor = 'default';
      imagePreviewBtn01030.title = 'Колір вибраного елемента';
    }

    const aspect = Number(visual.aspect);
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? Math.max(.5, Math.min(6, aspect)) : (16/9);
    imagePreviewBtn01030.style.aspectRatio = `${safeAspect}`;
    const radius = Number(visual.radiusPx);
    imagePreviewBtn01030.style.borderRadius = `${Number.isFinite(radius) ? Math.max(0, Math.min(28, radius)) : 12}px`;
    imagePreviewBtn01030.hidden = false;
    sectionEl.dataset.stFillPreviewKind01031 = kind;

    const label = sectionEl.querySelector('[data-fill-preview-label]');
    if (label) label.textContent = kind === 'image' ? 'Фонова картинка' : (kind === 'gradient' ? 'Градієнт' : 'Колір фону');
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

    updateImagePickButtonPreview(url, { kind: 'image' });

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
  if (imagePreviewBtn01030) {
    imagePreviewBtn01030.addEventListener('click', () => {
      if (sectionEl.dataset.stFillPreviewKind01031 !== 'image') return;
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
      target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01011');
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
      const mask01011 = normalizeStopMask01011(target.style.getPropertyValue(FILTER_GRADIENT_MASK_VAR_01011) || stopMaskFromInputs01011(filterGradEnabledInputs01011, [true,true,false], 2), [true,true,false], 2);
      target.style.setProperty(FILTER_GRADIENT_MASK_VAR_01011, stopMaskString01011(mask01011, [true,true,false], 2));
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('gradient', mask01011));
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
      target.style.setProperty(FILL_AUTHORITY_VERSION_VAR_00999, '01011');
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
    if (!target.classList.contains('st-bgfx')) {
      const own = readActiveFillState01007(target);
      applyFillToElement(target, {
        mode: own.mode,
        colorRaw: own.color,
        grad1Raw: own.gradientColors?.[0], grad2Raw: own.gradientColors?.[1], grad3Raw: own.gradientColors?.[2],
        gradientAlphas: own.gradientAlphas, gradientPositions: own.gradientPositions, gradientEnabled: own.gradientEnabled,
        angle: own.gradientAngle,
        imageUrl: own.imageUrl, imageSize: own.imageSize, imagePosition: own.imagePosition,
        imageScale: own.imageScale, imageScaleX: own.imageScaleX, imageScaleY: own.imageScaleY,
        imagePosX: own.imagePosX, imagePosY: own.imagePosY, imageCanvasFixed: own.imageCanvasFixed,
        alpha: (own.opacityPct ?? 100) / 100, gray: (own.grayPct ?? 0) / 100,
        filterMode: own.filterMode, filterEnabled: own.filterEnabled, filterColorRaw: own.filterColor,
        filterG1Raw: own.filterGradientColors?.[0], filterG2Raw: own.filterGradientColors?.[1], filterG3Raw: own.filterGradientColors?.[2],
        filterGradientEnabled: own.filterGradientEnabled, filterAngle: own.filterAngle, filterOpacity: (own.filterOpacityPct ?? 0) / 100
      });
    }
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
      const mask01011 = normalizeStopMask01011(target.style.getPropertyValue(FILL_GRADIENT_MASK_VAR_01011) || stopMaskFromInputs01011(gradEnabledInputs01011, [true,true,false], 2), [true,true,false], 2);
      target.style.setProperty(FILL_GRADIENT_MASK_VAR_01011, stopMaskString01011(mask01011, [true,true,false], 2));
      target.style.setProperty('--st-bgfx-bg', fillGradientImage01011(mask01011));
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
      const mask01011 = stopMaskFromInputs01011(gradEnabledInputs01011, [true,true,false], 2);
      target.style.setProperty(vars[index - 1], preserveStopAlpha01009(target, index, hex));
      target.style.setProperty(FILL_GRADIENT_MASK_VAR_01011, stopMaskString01011(mask01011, [true,true,false], 2));
      target.style.setProperty('--st-bgfx-bg', fillGradientImage01011(mask01011));
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
      target.style.setProperty(FILTER_ENABLED_VAR_01011, filterColorEnabledInput01011?.checked === false ? '0' : '1');
      target.style.setProperty(FILTER_COLOR_ENABLED_VAR_01011, filterColorEnabledInput01011?.checked === false ? '0' : '1');
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
      const mask01011 = stopMaskFromInputs01011(filterGradEnabledInputs01011, [true,true,false], 2);
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.setProperty(vars[index - 1], hex);
      target.style.setProperty(FILTER_GRADIENT_MASK_VAR_01011, stopMaskString01011(mask01011, [true,true,false], 2));
      target.style.setProperty(FILTER_ENABLED_VAR_01011, '1');
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('gradient', mask01011));
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
      const mask01011 = stopMaskFromInputs01011(gradEnabledInputs01011, [true,true,false], 2);
      target.style.setProperty(FILL_GRADIENT_MASK_VAR_01011, stopMaskString01011(mask01011, [true,true,false], 2));
      target.style.setProperty('--st-bgfx-bg', fillGradientImage01011(mask01011));
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
      target.style.setProperty(FILTER_ENABLED_VAR_01011, filterColorEnabledInput01011?.checked === false ? '0' : '1');
      target.style.setProperty(FILTER_COLOR_ENABLED_VAR_01011, filterColorEnabledInput01011?.checked === false ? '0' : '1');
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
      const mask01011 = stopMaskFromInputs01011(filterGradEnabledInputs01011, [true,true,false], 2);
      target.style.removeProperty(FILTER_COLOR_VAR_01001);
      target.style.setProperty(FILTER_GRADIENT_MASK_VAR_01011, stopMaskString01011(mask01011, [true,true,false], 2));
      target.style.setProperty(FILTER_ENABLED_VAR_01011, '1');
      target.style.setProperty('--st-bgfx-filter', filterImageFromCanonical00999('gradient', mask01011));
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
      if (target instanceof HTMLElement && target.isConnected) target.style.setProperty(prop, preserveStopAlpha01009(target, index, hex));
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
    const filterEnabled01011 = kind === 'filter' ? Math.max(0, Math.min(1, numberCssVar01003(target, FILTER_ENABLED_VAR_01011, 1))) : 1;
    const blur = stringCssVar01003(target, '--st-element-fx-blur', '0px');
    const gray = kind === 'fill' ? Math.max(0, Math.min(1, numberCssVar01003(target, '--st-bgfx-gray', 0))) : 0;

    layer.style.setProperty('opacity', String(ownOpacity * elementOpacity * filterEnabled01011), 'important');
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
      dragOffsetX: 0,
      dragOffsetY: 0,
      dragStartedOnThumb: false,
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

    const applyDragPoint01008 = (p, { forceEmit = false } = {}) => {
      if (!p || !api.dragRect) return false;
      const r = api.dragRect;
      const adjustedX = p.x - (api.dragOffsetX || 0);
      const adjustedY = p.y - (api.dragOffsetY || 0);
      const nx = Math.max(0, Math.min(1, (adjustedX - r.left) / Math.max(1, r.width)));
      const ny = Math.max(0, Math.min(1, (adjustedY - r.top) / Math.max(1, r.height)));
      const beforeHex = api.hex;
      if (p.kind === 'sv') {
        api.s = nx;
        api.v = 1 - ny;
      } else {
        api.h = Math.max(0, Math.min(359.999, nx * 360));
      }
      const afterHex = hsvToHex01005(api.h, api.s, api.v);
      const changed = afterHex !== beforeHex;
      if (changed) api.dirty = true;
      render({ hueChanged: p.kind === 'hue', emit: changed, forceEmit: changed && forceEmit });
      return changed;
    };

    const scheduleDrag = (e) => {
      if (!api.dragKind || e.pointerId !== api.dragPointerId || !api.dragRect) return;
      api.pendingPoint = { x: e.clientX, y: e.clientY, kind: api.dragKind };
      if (api.raf) return;
      api.raf = requestAnimationFrame(() => {
        api.raf = 0;
        const p = api.pendingPoint;
        api.pendingPoint = null;
        applyDragPoint01008(p);
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
      api.dragOffsetX = 0;
      api.dragOffsetY = 0;
      api.dragStartedOnThumb = false;

      // 01008: A thumb behaves like a real draggable handle. If pointerdown lands on
      // the existing thumb, preserve the grab offset instead of converting that
      // exact mouse coordinate into a new HSV value. This prevents the container
      // from jumping simply because the user grabbed the current color marker.
      const r = api.dragRect;
      if (kind === 'sv') {
        const cx = r.left + api.s * r.width;
        const cy = r.top + (1 - api.v) * r.height;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (Math.hypot(dx, dy) <= 12) {
          api.dragOffsetX = dx;
          api.dragOffsetY = dy;
          api.dragStartedOnThumb = true;
        }
      } else {
        const cx = r.left + (api.h / 360) * r.width;
        const dx = e.clientX - cx;
        if (Math.abs(dx) <= 10) {
          api.dragOffsetX = dx;
          api.dragStartedOnThumb = true;
        }
      }

      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      // Grabbing the current thumb is read-only until pointermove. Clicking elsewhere
      // in the palette remains an intentional jump-to-point action.
      if (!api.dragStartedOnThumb) scheduleDrag(e);
    };

    const endDrag = (e) => {
      if (!api.dragKind || e.pointerId !== api.dragPointerId) return;
      if (!api.dragStartedOnThumb || api.pendingPoint) scheduleDrag(e);
      if (api.raf) {
        cancelAnimationFrame(api.raf);
        api.raf = 0;
        const p = api.pendingPoint;
        api.pendingPoint = null;
        if (p) applyDragPoint01008(p, { forceEmit: true });
      }
      api.dragKind = '';
      api.dragPointerId = null;
      api.dragRect = null;
      api.dragOffsetX = 0;
      api.dragOffsetY = 0;
      api.dragStartedOnThumb = false;
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
      api.dragOffsetX = 0;
      api.dragOffsetY = 0;
      api.dragStartedOnThumb = false;

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

    api.close = close;

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
      api.dragOffsetX = 0;
      api.dragOffsetY = 0;
      api.dragStartedOnThumb = false;
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
        // 01007: selecting another canvas node must never commit a half-finished
        // preview from the previous node. Canvas selection cancels the picker;
        // clicks elsewhere in the inspector still preserve the normal commit behavior.
        const siteRoot01007 = document.getElementById('site-root');
        if (t instanceof Node && siteRoot01007?.contains(t)) close('cancel');
        else close('commit');
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

  function commitGradientToggle01011(inputs, kind = 'fill') {
    const raw = (inputs || []).slice(0,3).map(input => !!input?.checked);
    if (raw.filter(Boolean).length < 2) {
      // A CSS linear-gradient needs at least two stops. Keep the last attempted
      // toggle on so the user can freely choose any 2 of the 3 circles.
      const last = (inputs || []).find(input => input && input.dataset.stLastToggle01011 === '1');
      if (last) last.checked = true;
    }
    const mask = stopMaskFromInputs01011(inputs, [true,true,false], 2);
    setStopMaskInputs01011(inputs, mask, [true,true,false], 2);
    if (kind === 'fill') {
      let positions = [0,50,100];
      try {
        const parsed = JSON.parse(sectionEl.dataset.stFillGradientPositions01009 || '');
        if (Array.isArray(parsed)) positions = parsed.slice(0,3);
      } catch (_) {}
      sectionEl.dataset.stFillGradientPositions01009 = JSON.stringify(evenlySpaceEnabledGradientStops01011(mask, positions));
    }
    applyFill();
  }

  gradEnabledInputs01011.forEach(input => {
    if (!input) return;
    input.addEventListener('change', () => {
      gradEnabledInputs01011.forEach(x => { if (x) delete x.dataset.stLastToggle01011; });
      input.dataset.stLastToggle01011 = '1';
      commitGradientToggle01011(gradEnabledInputs01011, 'fill');
    });
  });

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
      updateImagePickButtonPreview(imageUrlInput.value || '', { kind: 'image', aspect: parseFloat(imagePreviewBtn01030?.style.aspectRatio) || (16/9), position: imagePosSelect?.value || 'center center', size: imageSizeSelect?.value || 'cover' });
      if (urlRaf00997) return;
      urlRaf00997 = requestAnimationFrame(() => {
        urlRaf00997 = 0;
        applyFill({ live: true, useSessionTargets: true });
      });
    });
    imageUrlInput.addEventListener('change', () => {
      if (urlRaf00997) { try { cancelAnimationFrame(urlRaf00997); } catch (_) {} urlRaf00997 = 0; }
      updateImagePickButtonPreview(imageUrlInput.value || '', { kind: 'image', aspect: parseFloat(imagePreviewBtn01030?.style.aspectRatio) || (16/9), position: imagePosSelect?.value || 'center center', size: imageSizeSelect?.value || 'cover' });
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

  if (filterColorEnabledInput01011) {
    filterColorEnabledInput01011.addEventListener('change', () => applyFill());
  }
  filterGradEnabledInputs01011.forEach(input => {
    if (!input) return;
    input.addEventListener('change', () => {
      filterGradEnabledInputs01011.forEach(x => { if (x) delete x.dataset.stLastToggle01011; });
      input.dataset.stLastToggle01011 = '1';
      commitGradientToggle01011(filterGradEnabledInputs01011, 'filter');
    });
  });

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
        for (const prop of [FILL_GRADIENT_ANGLE_VAR_00999,FILL_GRADIENT_C1_VAR_00999,FILL_GRADIENT_C2_VAR_00999,FILL_GRADIENT_C3_VAR_00999,FILL_GRADIENT_P1_VAR_01009,FILL_GRADIENT_P2_VAR_01009,FILL_GRADIENT_P3_VAR_01009,FILL_GRADIENT_MASK_VAR_01011,FILTER_ANGLE_VAR_00999,FILTER_COLOR_VAR_01001,FILTER_C1_VAR_00999,FILTER_C2_VAR_00999,FILTER_C3_VAR_00999,FILTER_GRADIENT_MASK_VAR_01011,FILTER_ENABLED_VAR_01011,FILTER_COLOR_ENABLED_VAR_01011,IMAGE_SCALE_VAR_00999,IMAGE_SCALE_X_VAR_00999,IMAGE_SCALE_Y_VAR_00999]) t.style.removeProperty(prop);
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


  // ---------- 01007 · full active-node hydration from SiteFrameStore ----------
  // The widget is a view/editor, never the source of truth. On selection we read the
  // active node's persisted style from SiteFrameStore and overwrite EVERY Fill control.
  // Computed style is used only as a read-only authored-CSS fallback for legacy/template
  // nodes that do not yet have an editor-owned Fill state in the Store.
  function fillStoreNodeSnapshot01007(element) {
    if (!(element instanceof HTMLElement)) return null;
    const owner = element.matches?.('[data-sf-id],[data-st-node-id],[data-node-id]')
      ? element
      : element.closest?.('[data-sf-id],[data-st-node-id],[data-node-id]');
    if (!(owner instanceof HTMLElement)) return null;
    const nodeId = String(owner.dataset?.sfId || owner.dataset?.stNodeId || owner.dataset?.nodeId || '').trim();
    if (!nodeId) return null;
    const api = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
    if (!api || typeof api.getState !== 'function') return null;
    let state = null;
    try { state = api.getState(); } catch (_) { return null; }
    const node = state?.nodes?.[nodeId] || null;
    if (!node) return null;
    const style = (node.style && typeof node.style === 'object') ? node.style : {};
    const fillMeta = (node.meta?.fill && typeof node.meta.fill === 'object') ? node.meta.fill : {};
    const domDataset = (node.meta?.dom?.dataset && typeof node.meta.dom.dataset === 'object') ? node.meta.dom.dataset : {};
    const fillDataset = (fillMeta.dataset && typeof fillMeta.dataset === 'object') ? fillMeta.dataset : {};
    return {
      nodeId,
      node,
      style,
      dataset: { ...domDataset, ...fillDataset },
      persistedFill: fillMeta.persisted === true,
      source: 'site-frame-store-json-primary-01007'
    };
  }

  function ownStyleValue01007(style, name) {
    if (!style || typeof style !== 'object') return '';
    if (!Object.prototype.hasOwnProperty.call(style, name)) return '';
    const value = style[name];
    return value == null ? '' : String(value).trim();
  }

  function clampNumber01007(value, min, max, fallback) {
    const n = Number.parseFloat(String(value ?? ''));
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function colorTokens01007(source, fallbacks = []) {
    const tokens = String(source || '').match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) || [];
    const parsed = tokens.map((token) => cssColorToken00999(token)).filter(Boolean).map((item) => item.hex);
    const out = [];
    for (let i = 0; i < Math.max(parsed.length, fallbacks.length); i += 1) {
      const raw = parsed[i] || fallbacks[i] || fallbacks[i - 1] || '#000000';
      out.push(normalizeHex(raw));
    }
    return out;
  }

  function setColorControl01007(trigger, text, value, fallback = '#000000') {
    const hex = normalizeHex(value || fallback);
    if (trigger) trigger.value = hex;
    if (text) text.value = hex;
    return hex;
  }

  function setPair01007(range, number, value) {
    const v = String(value);
    if (range) range.value = v;
    if (number) number.value = v;
  }

  function extractUrlLayer01030_(source) {
    const m = String(source || '').match(/url\(\s*["']?(.*?)["']?\s*\)/i);
    return m?.[1] ? String(m[1]).trim() : '';
  }

  function readActiveSliderImage01030_(element) {
    if (!(element instanceof HTMLElement) || !element.hasAttribute('data-st-fx-bg-slider')) return null;
    try {
      const cfg = JSON.parse(String(element.getAttribute('data-st-fx-bg-slider') || '{}')) || {};
      const slides = Array.isArray(cfg.slides) ? cfg.slides : [];
      if (!slides.length) return null;
      const activeAttr = Number(element.getAttribute('data-st-fx-active-slide'));
      let index = Number.isFinite(activeAttr) && activeAttr > 0 ? activeAttr - 1 : Number(cfg.current || 0);
      if (!Number.isFinite(index)) index = 0;
      index = Math.max(0, Math.min(slides.length - 1, Math.round(index)));
      const slide = slides[index] || {};
      const bg = (slide.bg && typeof slide.bg === 'object') ? slide.bg : slide;
      const src = String(slide.src || bg.src || '').trim();
      if (!src) return null;
      const fit = String(bg.fit || 'cover').trim();
      const position = String(bg.position || 'center center').trim();
      return { src, fit, position, index, overlay: Number(cfg.overlay || 0) };
    } catch (_) {
      return null;
    }
  }

  function readContentImage01031_(element) {
    if (!(element instanceof HTMLElement)) return null;
    const usable = (img) => {
      if (!(img instanceof HTMLImageElement)) return null;
      const src = String(img.currentSrc || img.getAttribute('src') || '').trim();
      if (!src) return null;
      try {
        const cs = window.getComputedStyle(img);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity || 1) <= 0) return null;
      } catch (_) {}
      return {
        src,
        fit: String(img.style.objectFit || window.getComputedStyle(img).objectFit || 'cover').trim() || 'cover',
        position: String(img.style.objectPosition || window.getComputedStyle(img).objectPosition || 'center center').trim() || 'center center',
        sourceKind: 'content-img-01031'
      };
    };

    // A selected image block should always expose its own image.
    if (element instanceof HTMLImageElement) return usable(element);
    const direct = Array.from(element.children || []).filter(ch => ch instanceof HTMLImageElement);
    if (direct.length === 1) return usable(direct[0]);
    if (element.matches?.('.st-block--image,[data-block-kind="image"]')) {
      const img = element.querySelector('img');
      return usable(img);
    }

    // A selected block/container that visually contains images exposes its first visible
    // image as the preview source. This covers media groups such as a main photo + minis
    // without pretending that a whole section's first descendant image is its background.
    const descendants = Array.from(element.querySelectorAll('img')).map(usable).filter(Boolean);
    if (element.classList.contains('st-block') && descendants.length) return descendants[0];
    if (element.classList.contains('st-row') && descendants.length === 1) return descendants[0];
    return null;
  }

  function readFillPreviewGeometry01030_(element) {
    try {
      const rect = element.getBoundingClientRect();
      const cs = window.getComputedStyle(element);
      const radiusRaw = parseFloat(String(cs.borderTopLeftRadius || '0')) || 0;
      return {
        aspect: rect.width > 0 && rect.height > 0 ? rect.width / rect.height : (16/9),
        radiusPx: radiusRaw
      };
    } catch (_) {
      return { aspect: 16/9, radiusPx: 12 };
    }
  }

  function readActiveFillState01007(element) {
    const snapshot = fillStoreNodeSnapshot01007(element);
    const live = window.getComputedStyle(element);
    const style = snapshot?.style || null;
    const persisted = !!snapshot?.persistedFill;

    // Store values always win. For unedited/template-authored properties only, the
    // computed fallback lets the inspector display the visible baseline without writing it.
    const prop = (name, fallbackComputed = true) => {
      const fromStore = ownStyleValue01007(style, name);
      if (fromStore !== '') return fromStore;
      if (!fallbackComputed) return '';
      try { return String(live.getPropertyValue(name) || '').trim(); } catch (_) { return ''; }
    };
    const cssField = (camel, kebab) => {
      const fromStore = ownStyleValue01007(style, kebab);
      if (fromStore !== '') return fromStore;
      try { return String(live?.[camel] || live.getPropertyValue(kebab) || '').trim(); } catch (_) { return ''; }
    };

    const fxBg = prop('--st-bgfx-bg', false);
    const authoredBgImage = cssField('backgroundImage', 'background-image');
    const authoredBgColor = cssField('backgroundColor', 'background-color');
    const authoredBackground = ownStyleValue01007(style, 'background');
    const visualBg = fxBg || authoredBackground || authoredBgImage || authoredBgColor;
    const datasetMode = String(snapshot?.dataset?.stFillMode || snapshot?.node?.meta?.fill?.mode || '').trim();
    const activeSliderImage01030 = readActiveSliderImage01030_(element);
    const contentImage01031 = readContentImage01031_(element);
    const literalImageUrl01030 = extractUrlLayer01030_(fxBg)
      || extractUrlLayer01030_(authoredBackground)
      || extractUrlLayer01030_(authoredBgImage)
      || extractUrlLayer01030_(visualBg);
    const hasRealImageLayer01030 = !!(activeSliderImage01030?.src || literalImageUrl01030 || contentImage01031?.src);

    let mode = ['color','gradient','image'].includes(datasetMode) ? datasetMode : '';
    // 01030: a composed `linear-gradient(...), url(...)` is an IMAGE fill with a
    // visual overlay, not a pure gradient fill. Image presence therefore wins.
    if (hasRealImageLayer01030) mode = 'image';
    else if (fxBg) {
      if (/gradient\(/i.test(fxBg)) mode = 'gradient';
      else mode = 'color';
    }
    if (!mode) {
      if (/gradient\(/i.test(visualBg)) mode = 'gradient';
      else mode = 'color';
    }

    const fillColorFallback = (() => {
      const token = colorTokens01007(fxBg || authoredBgColor || authoredBackground, ['#0f172a'])[0];
      return token || '#0f172a';
    })();

    const gradVarTokens01009 = [
      prop(FILL_GRADIENT_C1_VAR_00999, false),
      prop(FILL_GRADIENT_C2_VAR_00999, false),
      prop(FILL_GRADIENT_C3_VAR_00999, false),
    ].map((v) => cssColorToken00999(v));
    const literalTriplet01009 = normalizeGradientTriplet01009(parseGradientStops01009(visualBg));
    const hasCanonicalGrad01009 = gradVarTokens01009.some(Boolean);
    const gradientColors = hasCanonicalGrad01009
      ? gradVarTokens01009.map((item,i) => item?.hex || literalTriplet01009.colors[i] || ['#0f172a','#1e293b','#334155'][i])
      : literalTriplet01009.colors;
    const gradientAlphas = hasCanonicalGrad01009
      ? gradVarTokens01009.map((item,i) => item?.alpha ?? literalTriplet01009.alphas[i] ?? 1)
      : literalTriplet01009.alphas;
    const gradientPositions = [
      prop(FILL_GRADIENT_P1_VAR_01009, false), prop(FILL_GRADIENT_P2_VAR_01009, false), prop(FILL_GRADIENT_P3_VAR_01009, false)
    ].map((v,i) => v !== '' ? gradientPosition01009(v, [0,50,100][i]) : literalTriplet01009.positions[i]);
    const gradientMaskRaw01011 = prop(FILL_GRADIENT_MASK_VAR_01011, false);
    const inferredTwoStop01011 = !gradientMaskRaw01011 && (
      literalTriplet01009.sourceCount === 2
      || (hasCanonicalGrad01009
        && Math.abs(Number(gradientPositions[1]) - Number(gradientPositions[2])) < 0.01
        && gradientColors[1] === gradientColors[2]
        && Math.abs(Number(gradientAlphas[1]) - Number(gradientAlphas[2])) < 0.001)
    );
    const gradientEnabled = normalizeStopMask01011(
      gradientMaskRaw01011 || (inferredTwoStop01011 ? '110' : (literalTriplet01009.sourceCount >= 3 ? '111' : '110')),
      [true,true,false],
      2
    );
    const gradAngleVar = prop(FILL_GRADIENT_ANGLE_VAR_00999, false);
    const gradAngleLiteral = String(visualBg || '').match(/linear-gradient\(\s*(-?[\d.]+)deg/i)?.[1] || '';
    const gradientAngle = Math.round(clampNumber01007(gradAngleVar || gradAngleLiteral, 0, 360, 90));

    let fillOpacity = clampNumber01007(prop('--st-bgfx-bg-opacity', false), 0, 1, NaN);
    if (!Number.isFinite(fillOpacity)) {
      // An authored gradient/image normally sits over a transparent background-color;
      // that transparent base is NOT the Fill opacity. Only solid authored colors may
      // derive opacity from background-color alpha.
      if (mode === 'color') {
        const parsed = rgbaToHexAlpha(authoredBgColor || '');
        fillOpacity = Number.isFinite(parsed?.alpha) ? parsed.alpha : 1;
      } else fillOpacity = 1;
    }

    const gray = clampNumber01007(prop('--st-bgfx-gray', false), 0, 1, 0);
    const blockAlpha = clampNumber01007(prop('--st-block-surface-alpha', false), 0, 1, 1);
    const blockBlurCanonical = parseBlurPx00999(prop('--st-block-surface-blur', false));
    const blockBlurAuthored = parseBlurPx00999(cssField('backdropFilter', 'backdrop-filter') || cssField('webkitBackdropFilter', '-webkit-backdrop-filter'));
    const blockBlurPx = blockBlurCanonical != null ? blockBlurCanonical : (blockBlurAuthored != null ? blockBlurAuthored : 0);
    const elementOpacity = clampNumber01007(prop('--st-element-fx-opacity', false), 0, 1, 1);
    const elementBlurPx = parseBlurPx00999(prop('--st-element-fx-blur', false)) ?? 0;

    const imageSource = fxBg || authoredBackground || authoredBgImage;
    const imageUrl = String(activeSliderImage01030?.src || literalImageUrl01030 || contentImage01031?.src || '').trim();
    const sizeRaw = activeSliderImage01030?.fit || contentImage01031?.fit || prop('--st-bgfx-bg-size', false) || ownStyleValue01007(style, 'background-size') || cssField('backgroundSize', 'background-size') || 'cover';
    const scale = clampNumber01007(prop(IMAGE_SCALE_VAR_00999, false), 0, 200, 100);
    const scaleX = clampNumber01007(prop(IMAGE_SCALE_X_VAR_00999, false), 0, 200, 100);
    const scaleY = clampNumber01007(prop(IMAGE_SCALE_Y_VAR_00999, false), 0, 200, 100);
    const hasCanonicalScale = prop(IMAGE_SCALE_VAR_00999, false) !== '' || prop(IMAGE_SCALE_X_VAR_00999, false) !== '' || prop(IMAGE_SCALE_Y_VAR_00999, false) !== '' || /--st-bgfx-image-scale/.test(sizeRaw);
    let imageSize = hasCanonicalScale ? 'custom' : String(sizeRaw || 'cover').trim();
    if (!['cover','contain','auto','custom'].includes(imageSize)) imageSize = /^\s*\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%\s*$/.test(imageSize) ? 'custom' : 'cover';

    const posRaw = activeSliderImage01030?.position || contentImage01031?.position || prop('--st-bgfx-bg-pos', false) || ownStyleValue01007(style, 'background-position') || cssField('backgroundPosition', 'background-position') || 'center center';
    const posXRaw = prop('--st-bgfx-bg-pos-x', false);
    const posYRaw = prop('--st-bgfx-bg-pos-y', false);
    const posLiteral = String(posRaw).match(/^\s*([\d.]+)%\s+([\d.]+)%\s*$/);
    const posX = Math.round(clampNumber01007(posXRaw || posLiteral?.[1], 1, 100, 50));
    const posY = Math.round(clampNumber01007(posYRaw || posLiteral?.[2], 1, 100, 50));
    const hasCanonicalPos = posXRaw !== '' || posYRaw !== '' || /--st-bgfx-bg-pos-[xy]/.test(posRaw) || !!posLiteral;
    let imagePosition = hasCanonicalPos ? 'custom' : String(posRaw || 'center center').trim();
    if (!['center center','top center','bottom center','center left','center right','custom'].includes(imagePosition)) imagePosition = 'center center';
    const imageCanvasFixed = prop('--st-bgfx-canvas-fixed', false) === '1';

    // Filter is parsed strictly from the same Store style object. No prior widget state participates.
    const filterSource = prop('--st-bgfx-filter', false) || prop(FILL_FILTER_IMAGE_VAR_00998, false) || 'none';
    const filterOpacity = clampNumber01007(prop('--st-bgfx-filter-opacity', false), 0, 1, 0);
    const filterColorVar = prop(FILTER_COLOR_VAR_01001, false);
    const filterGradVars = [
      prop(FILTER_C1_VAR_00999, false), prop(FILTER_C2_VAR_00999, false), prop(FILTER_C3_VAR_00999, false)
    ].map((v) => /^#[0-9a-f]{3,8}$/i.test(v) ? normalizeHex(v) : '');
    const filterLiteralColors = colorTokens01007(filterSource, ['#000000','#000000','#000000']);
    let filterMode = 'off';
    if (filterSource && filterSource !== 'none') {
      if (/var\(--st-bgfx-filter-color/i.test(filterSource) || (filterColorVar && !/var\(--st-bgfx-filter-c1/i.test(filterSource))) filterMode = 'color';
      else if (/gradient\(/i.test(filterSource) || filterGradVars.some(Boolean)) filterMode = 'gradient';
      else filterMode = 'color';
    }
    const filterColor = normalizeHex(filterColorVar || filterLiteralColors[0] || '#000000');
    const filterGradientColors = filterGradVars.map((v, i) => v || filterLiteralColors[i] || '#000000');
    const filterMaskRaw01011 = prop(FILTER_GRADIENT_MASK_VAR_01011, false);
    const filterStopCount01011 = parseGradientStops01009(filterSource).length;
    const filterGradientEnabled = normalizeStopMask01011(
      filterMaskRaw01011 || (filterStopCount01011 >= 3 ? '111' : '110'),
      [true,true,false],
      2
    );
    const filterEnabled = (prop(FILTER_COLOR_ENABLED_VAR_01011, false) || prop(FILTER_ENABLED_VAR_01011, false)) !== '0';
    const filterAngleRaw = prop(FILTER_ANGLE_VAR_00999, false) || String(filterSource).match(/linear-gradient\(\s*(-?[\d.]+)deg/i)?.[1] || '';
    const filterAngle = Math.round(clampNumber01007(filterAngleRaw, 0, 360, 90));
    const previewGeometry01030 = readFillPreviewGeometry01030_(element);
    const previewKind01031 = imageUrl ? 'image' : (/gradient\(/i.test(visualBg) ? 'gradient' : 'color');
    const previewBackgroundImage01031 = imageUrl
      ? `url("${String(imageUrl).replace(/([\\"])/g, '\\$1')}")`
      : (/gradient\(/i.test(visualBg)
          ? String((/gradient\(/i.test(fxBg) ? fxBg : '') || authoredBgImage || authoredBackground || visualBg || 'none')
          : 'none');
    const previewBackgroundColor01031 = previewKind01031 === 'color'
      ? String(fillColorFallback || authoredBgColor || 'transparent')
      : String(authoredBgColor || 'transparent');

    return {
      source: snapshot?.source || 'authored-css-fallback-01007',
      nodeId: snapshot?.nodeId || '',
      persistedFill: persisted,
      mode,
      color: fillColorFallback,
      gradientColors,
      gradientAlphas,
      gradientPositions,
      gradientEnabled,
      gradientAngle,
      imageUrl,
      imageSourceKind01031: activeSliderImage01030?.src ? 'slider' : (literalImageUrl01030 ? 'background' : (contentImage01031?.sourceKind || '')),
      previewKind01031,
      previewBackgroundImage01031,
      previewBackgroundColor01031,
      imageSize,
      imageScale: Math.round(scale),
      imageScaleX: Math.round(scaleX),
      imageScaleY: Math.round(scaleY),
      imagePosition,
      imagePosX: posX,
      imagePosY: posY,
      imageCanvasFixed,
      previewAspect01030: previewGeometry01030.aspect,
      previewRadiusPx01030: previewGeometry01030.radiusPx,
      opacityPct: Math.round(fillOpacity * 100),
      grayPct: Math.round(gray * 100),
      blockTransparencyPct: Math.round((1 - blockAlpha) * 100),
      blockBlurPct: Math.round(clampPct00994((blockBlurPx / BLOCK_SURFACE_BLUR_MAX_PX_00995) * 100, 0)),
      elementOpacityPct: Math.round(elementOpacity * 100),
      elementBlurPct: Math.round(clampPct00994((elementBlurPx / ELEMENT_BLUR_MAX_PX_00994) * 100, 0)),
      filterMode,
      filterEnabled,
      filterColor,
      filterGradientColors,
      filterGradientEnabled,
      filterAngle,
      filterOpacityPct: Math.round(filterOpacity * 100),
    };
  }

  function hydrateFillControls01007(state) {
    if (!state) return;

    // Every control is assigned on every selection. Hidden controls are hydrated too,
    // so switching mode afterwards never exposes values left by the previous element.
    setColorControl01007(colorInput, colorText, state.color, '#0f172a');
    setColorControl01007(grad1Input, grad1Text, state.gradientColors?.[0], '#0f172a');
    setColorControl01007(grad2Input, grad2Text, state.gradientColors?.[1], '#1e293b');
    setColorControl01007(grad3Input, grad3Text, state.gradientColors?.[2], '#334155');
    setStopMaskInputs01011(gradEnabledInputs01011, state.gradientEnabled, [true,true,false], 2);
    setPair01007(gradAngleRange, gradAngleNumber, state.gradientAngle ?? 90);
    sectionEl.dataset.stFillGradientAlphas01009 = JSON.stringify(Array.isArray(state.gradientAlphas) ? state.gradientAlphas.slice(0,3) : [1,1,1]);
    sectionEl.dataset.stFillGradientPositions01009 = JSON.stringify(Array.isArray(state.gradientPositions) ? state.gradientPositions.slice(0,3) : [0,50,100]);

    if (imageUrlInput) imageUrlInput.value = state.imageUrl || '';
    updateImagePickButtonPreview(state.imageUrl || '', {
      kind: state.previewKind01031 || state.mode || 'color',
      backgroundImage: state.previewBackgroundImage01031 || 'none',
      backgroundColor: state.previewBackgroundColor01031 || 'transparent',
      aspect: state.previewAspect01030,
      radiusPx: state.previewRadiusPx01030,
      size: state.imageSize === 'custom' ? 'cover' : (state.imageSize || 'cover'),
      position: state.imagePosition || 'center center'
    });
    if (imageSizeSelect) imageSizeSelect.value = state.imageSize || 'cover';
    if (imageScaleRange) imageScaleRange.value = String(state.imageScale ?? 100);
    if (imageScaleXRange) imageScaleXRange.value = String(state.imageScaleX ?? 100);
    if (imageScaleYRange) imageScaleYRange.value = String(state.imageScaleY ?? 100);
    if (imagePosSelect) imagePosSelect.value = state.imagePosition || 'center center';
    if (imagePosXRange) imagePosXRange.value = String(state.imagePosX ?? 50);
    if (imagePosYRange) imagePosYRange.value = String(state.imagePosY ?? 50);
    if (imageCanvasFixedInput) imageCanvasFixedInput.checked = !!state.imageCanvasFixed;

    setPair01007(opacityRange, opacityNumber, state.opacityPct ?? 100);
    setPair01007(blockTransparencyRange, blockTransparencyNumber, state.blockTransparencyPct ?? 0);
    setPair01007(blockBlurRange, blockBlurNumber, state.blockBlurPct ?? 0);
    setPair01007(elementOpacityRange, elementOpacityNumber, state.elementOpacityPct ?? 100);
    setPair01007(elementBlurRange, elementBlurNumber, state.elementBlurPct ?? 0);
    setPair01007(grayRange, grayNumber, state.grayPct ?? 0);

    setColorControl01007(filterColorInput, filterColorText, state.filterColor, '#000000');
    if (filterColorEnabledInput01011) filterColorEnabledInput01011.checked = state.filterEnabled !== false;
    setStopMaskInputs01011(filterGradEnabledInputs01011, state.filterGradientEnabled, [true,true,false], 2);
    setColorControl01007(fGrad1Input, fGrad1Text, state.filterGradientColors?.[0], '#000000');
    setColorControl01007(fGrad2Input, fGrad2Text, state.filterGradientColors?.[1], '#000000');
    setColorControl01007(fGrad3Input, fGrad3Text, state.filterGradientColors?.[2], '#000000');
    if (filterAngleRange) filterAngleRange.value = String(state.filterAngle ?? 90);
    if (filterAngleNumber) filterAngleNumber.value = String(state.filterAngle ?? 90);
    if (filterAngleVal) filterAngleVal.textContent = `${state.filterAngle ?? 90}°`;
    if (filterOpacityRange) filterOpacityRange.value = String(state.filterOpacityPct ?? 0);
    if (filterOpacityNumber) filterOpacityNumber.value = String(state.filterOpacityPct ?? 0);
    if (filterOpacityVal) filterOpacityVal.textContent = `${state.filterOpacityPct ?? 0}%`;

    syncPctLabel(imageScaleRange, imageScaleVal);
    syncPctLabel(imageScaleXRange, imageScaleXVal);
    syncPctLabel(imageScaleYRange, imageScaleYVal);
    syncPosLabel(imagePosXRange, imagePosXVal);
    syncPosLabel(imagePosYRange, imagePosYVal);

    setMode(state.mode || 'color');
    setFilterMode(state.filterMode || 'off');
    syncCustomSizeVisibility();
    syncCustomPosVisibility();
    syncAllColorTriggers01005();

    sectionEl.dataset.stFillHydratedNode01007 = String(state.nodeId || '');
    sectionEl.dataset.stFillHydrationSource01007 = String(state.source || '');
  }

  function cancelOpenColorPickerForSelection01007() {
    if (!customPicker01005?.root || customPicker01005.root.hidden || !customPicker01005.trigger) return;
    try { customPicker01005.close?.('cancel'); } catch (_) {}
  }

  // ---------- синхронізація UI з вибором ----------
  function updateUIFromSelection() {
    const targets = getTargets();
    updateTargetSummary(targets);
    if (!targets.length) return;
    const el = resolveFillTarget(targets[0]);
    if (!el) return;
    const state = readActiveFillState01007(el);
    hydrateFillControls01007(state);
  }

  function initSelectionSync() {
    const siteRoot = document.getElementById('site-root');
    if (!siteRoot) return;

    // Ctrl+клік: додаємо/знімаємо з manualTargets
    siteRoot.addEventListener('click', (e) => {
      cancelOpenColorPickerForSelection01007();
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
      cancelOpenColorPickerForSelection01007();
      setTimeout(() => {
        try { updateUIFromSelection(); } catch (e) { console.warn('[fill] selection sync failed', e); }
      }, 0);
    });
  }

  initSelectionSync();
}
