// js/design/widgets/site-header/header-insert-widget.js

import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
// Заглушка-інспектор для вставки СТАНДАРТНИХ блоків у ШАПКУ.
//
// Важливо:
// - Нічого не вставляє і не змінює DOM шапки (поки що).
// - Лише показує UI з 8 базовими типами блоків.
// - Відкривається з Header Builder Mode по події: window.dispatchEvent(new CustomEvent('st:header-insert:open'))

const SEC_ATTR = 'data-st-header-insert';
const SEC_ID = 'st-header-insert-section';

const ICON_PICK_KEY = 'st_header_insert_icon_pick_v1';
const PHONE_ICON_POS_KEY = 'st_header_insert_phone_icon_pos_v1';
const LOGO_MODE_KEY = 'st_header_insert_logo_mode_v1';
const LOGO_SOURCE_KEY = 'st_header_insert_logo_source_v1';
const LOGO_POS_KEY = 'st_header_insert_logo_pos_v1';
const LOGO_IMAGE_PICK_KEY = 'st_header_insert_logo_image_pick_v1';
const LOGO_MARK_WIDTH_KEY = 'st_header_insert_logo_mark_width_v1';
const LOGO_MARK_HEIGHT_KEY = 'st_header_insert_logo_mark_height_v1';
const LOGO_GAP_KEY = 'st_header_insert_logo_gap_v1';
const LOGO_FIT_KEY = 'st_header_insert_logo_fit_v1';
const LOGO_ALIGN_KEY = 'st_header_insert_logo_align_v1';
const LOGO_TEXT_TARGET_KEY = 'st_header_insert_logo_text_target_v1';
const LOGO_TITLE_SIZE_KEY = 'st_header_insert_logo_title_size_v1';
const LOGO_SUBTITLE_SIZE_KEY = 'st_header_insert_logo_subtitle_size_v1';
const LOGO_TITLE_OFFSET_X_KEY = 'st_header_insert_logo_title_offset_x_v1';
const LOGO_TITLE_OFFSET_Y_KEY = 'st_header_insert_logo_title_offset_y_v1';
const LOGO_SUBTITLE_OFFSET_X_KEY = 'st_header_insert_logo_subtitle_offset_x_v1';
const LOGO_SUBTITLE_OFFSET_Y_KEY = 'st_header_insert_logo_subtitle_offset_y_v1';
const LOGO_LINK_MODE_KEY = 'st_header_insert_logo_link_mode_v1';
const LOGO_LINK_URL_KEY = 'st_header_insert_logo_link_url_v1';
const LOGO_LINK_NEWTAB_KEY = 'st_header_insert_logo_link_newtab_v1';
const LOGO_CLICK_AREA_KEY = 'st_header_insert_logo_click_area_v1';
const LOGO_MOBILE_MODE_KEY = 'st_header_insert_logo_mobile_mode_v1';
const LOGO_MOBILE_MARK_WIDTH_KEY = 'st_header_insert_logo_mobile_mark_width_v1';
const LOGO_MOBILE_TITLE_SIZE_KEY = 'st_header_insert_logo_mobile_title_size_v1';
const LOGO_MOBILE_SUBTITLE_SIZE_KEY = 'st_header_insert_logo_mobile_subtitle_size_v1';
const LOGO_MOBILE_GAP_KEY = 'st_header_insert_logo_mobile_gap_v1';
const LOGO_HOVER_TARGET_KEY = 'st_header_insert_logo_hover_target_v1';
const LOGO_HOVER_METRIC_PREFIX = 'st_header_insert_logo_hover_metric_v1';
const PNG_IMAGE_PICK_KEY = 'st_header_insert_png_image_pick_v1';
const PNG_LINK_MODE_KEY = 'st_header_insert_png_link_mode_v1';
const PNG_LINK_URL_KEY = 'st_header_insert_png_link_url_v1';
const PNG_LINK_NEWTAB_KEY = 'st_header_insert_png_link_newtab_v1';
const PNG_CLICK_AREA_KEY = 'st_header_insert_png_click_area_v1';
const PNG_MOBILE_MODE_KEY = 'st_header_insert_png_mobile_mode_v1';
const PNG_MOBILE_WIDTH_KEY = 'st_header_insert_png_mobile_width_v1';
const PNG_MOBILE_HEIGHT_KEY = 'st_header_insert_png_mobile_height_v1';
const PNG_MOBILE_IMAGE_PICK_KEY = 'st_header_insert_png_mobile_image_pick_v1';
const PNG_HOVER_TARGET_KEY = 'st_header_insert_png_hover_target_v1';
const PNG_HOVER_METRIC_PREFIX = 'st_header_insert_png_hover_metric_v1';
const PNG_EXTRA_PRESET_KEY = 'st_header_insert_png_extra_preset_v1';
const PNG_GLOW_TARGET_KEY = 'st_header_insert_png_glow_target_v1';
const PNG_GLOW_COLOR_KEY = 'st_header_insert_png_glow_color_v1';
const PNG_GLOW_OPACITY_KEY = 'st_header_insert_png_glow_opacity_v1';
const PNG_GLOW_BLUR_KEY = 'st_header_insert_png_glow_blur_v1';
const PNG_GLOW_SPREAD_KEY = 'st_header_insert_png_glow_spread_v1';
const BUTTON_TEXT_KEY = 'st_header_insert_button_text_v1';
const BUTTON_MODE_KEY = 'st_header_insert_button_mode_v1';
const BUTTON_ICON_POS_KEY = 'st_header_insert_button_icon_pos_v1';
const BUTTON_ICON_PICK_KEY = 'st_header_insert_button_icon_pick_v1';
const BUTTON_LINK_MODE_KEY = 'st_header_insert_button_link_mode_v1';
const BUTTON_LINK_URL_KEY = 'st_header_insert_button_link_url_v1';
const BUTTON_LINK_NEWTAB_KEY = 'st_header_insert_button_link_newtab_v1';
const BUTTON_CLICK_AREA_KEY = 'st_header_insert_button_click_area_v1';
const BUTTON_MOBILE_MODE_KEY = 'st_header_insert_button_mobile_mode_v1';
const BUTTON_MOBILE_LABEL_KEY = 'st_header_insert_button_mobile_label_v1';
const BUTTON_MOBILE_WIDTH_KEY = 'st_header_insert_button_mobile_width_v1';
const BUTTON_MOBILE_LABEL_SIZE_KEY = 'st_header_insert_button_mobile_label_size_v1';
const BUTTON_MOBILE_ICON_SIZE_KEY = 'st_header_insert_button_mobile_icon_size_v1';
const BUTTON_MOBILE_GAP_KEY = 'st_header_insert_button_mobile_gap_v1';
const BUTTON_HOVER_TARGET_KEY = 'st_header_insert_button_hover_target_v1';
const BUTTON_HOVER_METRIC_PREFIX = 'st_header_insert_button_hover_metric_v1';
const BUTTON_EXTRA_PRESET_KEY = 'st_header_insert_button_extra_preset_v1';
const BUTTON_SHAPE_KEY = 'st_header_insert_button_shape_v1';
const BUTTON_FILL_MODE_KEY = 'st_header_insert_button_fill_mode_v1';
const BUTTON_COLOR1_KEY = 'st_header_insert_button_color1_v1';
const BUTTON_COLOR2_KEY = 'st_header_insert_button_color2_v1';
const BUTTON_GRADIENT_ANGLE_KEY = 'st_header_insert_button_gradient_angle_v1';
const DEFAULT_PHONE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.29a2 2 0 0 1 2.11-.45c.83.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z"/></svg>`;
let _pickedIcon = null; // {name,url,svg,defaultColor,iconTheme}
let _pickedLogoImage = null; // {name,url,mime,cat}
let _pickedPngImage = null; // {name,url,mime,cat}
let _pickedPngMobileImage = null; // {name,url,mime,cat}
let _pickedButtonIcon = null; // {name,url,svg,defaultColor,iconTheme}


function ensureOpen(sectionEl, open) {
  if (!sectionEl) return;
  const body = sectionEl.querySelector('.design-section__body');
  sectionEl.classList.toggle('is-open', !!open);
  if (body) body.hidden = !open;
}

function makeSubAccordion(title, note, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'st-hb-subacc';
  const extra = (opts && opts.extraHtml) ? String(opts.extraHtml) : '';

  wrap.innerHTML = `
    <button class="st-hb-subacc__head" type="button" aria-expanded="false">
      <span class="st-hb-subacc__title">${title}</span>
      <span class="st-hb-subacc__chev">▶</span>
    </button>
    <div class="st-hb-subacc__body" hidden>
      <div class="st-hb-subacc__note">${note}</div>
      ${extra || `<div class="st-hb-subacc__stub">Налаштування та вставка — <b>скоро</b>.</div>`}
    </div>
  `.trim();

  const head = wrap.querySelector('.st-hb-subacc__head');
  const body = wrap.querySelector('.st-hb-subacc__body');

  if (head && body) {
    head.addEventListener('click', () => {
      const isOpen = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', String(!isOpen));
      body.hidden = isOpen;
    });
  }

  // Delayed tooltip (3s) on hover — big clear letters
  if (opts && opts.tipText && head) {
    bindDelayedTip(head, String(opts.tipText));
  }


  return wrap;
}

function makeLogoInnerAccordion_(title, note, extraHtml) {
  return makeSubAccordion(title, note, { extraHtml });
}

function makePngInnerAccordion_(title, note, extraHtml) {
  return makeSubAccordion(title, note, { extraHtml });
}

function makeButtonInnerAccordion_(title, note, extraHtml) {
  return makeSubAccordion(title, note, { extraHtml });
}

function buildButtonInnerAccordions_(holder){
  if (!holder || holder.__st_button_inner_ready) return;
  holder.__st_button_inner_ready = true;
  holder.classList.add('st-hb-logo-groups');

  const general = makeButtonInnerAccordion_('Загальні налаштування', 'Створи кнопку, задай її текст і режим відображення.', `
<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-add>Додати кнопку</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-button-tune>Налаштувати кнопку</button>
</div>
<div class="st-hb-subacc__actions" style="margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-text-tune>Налаштувати текст</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-icon-tune>Налаштувати іконку</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Текст кнопки</span></span>
    <input type="text" maxlength="120" data-st-hb-button-text placeholder="Кнопка">
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-mode="text">Тільки текст</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-mode="text-icon">Текст + іконка</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-mode="icon">Тільки іконка</button>
</div>
<div class="st-hb-subacc__actions" style="margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-icon-choose>Вибрати іконку</button>
</div>
<div class="st-hb-subacc__preview">
  <div class="st-hb-subacc__previewbox" data-st-hb-button-previewbox></div>
</div>
<div class="st-hb-subacc__hint">
  Спочатку вибери режим і текст, потім натисни <b>Додати кнопку</b>.
  <br><b>Налаштувати кнопку</b> відкриє головний інспектор, а текст та іконка редагуються вже існуючими віджетами.
</div>
`);

  const position = makeButtonInnerAccordion_('Позиція', 'Позиція іконки всередині кнопки. Розміри, фон, тіні та відступи — у головному інспекторі.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-icon-pos="left">Іконка зліва</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-icon-pos="right">Іконка справа</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-icon-pos="none">Без іконки</button>
</div>
<div class="st-hb-subacc__hint">
  Форму кнопки, ширину, висоту, фон, бордер, тіні та відступи змінюй головним інспектором — без дублювання UI.
</div>
`);

  const behavior = makeButtonInnerAccordion_('Посилання / Поведінка', 'Куди веде кнопка і яка саме її частина є клікабельною.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-link-mode="none">Без дії</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-link-mode="home">На головну</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-link-mode="custom">Власне посилання</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-link-mode="tel">Телефон</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-link-mode="email">Email</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>URL / Телефон / Email</span></span>
    <input type="text" placeholder="/ або https://example.com або +380... або mail@example.com" data-st-hb-button-link-url>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;">
  <label class="st-hb-insbtn" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
    <input type="checkbox" data-st-hb-button-link-newtab>
    <span>Нова вкладка</span>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-click-area="all">Клікабельна вся кнопка</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-click-area="icon">Клікабельна тільки іконка</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-click-area="label">Клікабельний тільки текст</button>
</div>
`);
  const adaptive = makeButtonInnerAccordion_('Адаптивність', 'Mobile-версія кнопки: окремий текст, ширина та icon-only режим без дублювання стилів.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-mobile-mode="inherit">Як на desktop</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-mobile-mode="hide">Сховати на mobile</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-mobile-mode="icon-only">Тільки іконка</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Текст кнопки — mobile</span></span>
    <input type="text" maxlength="80" placeholder="Кнопка" data-st-hb-button-mobile-label>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Ширина кнопки — mobile</span><b data-st-hb-button-mobile-width-out>140 px</b></span>
    <span class="st-hb-range">
      <input type="range" min="42" max="360" step="1" data-st-hb-button-mobile-width>
      <input type="number" min="42" max="360" step="1" data-st-hb-button-mobile-width-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Розмір тексту — mobile</span><b data-st-hb-button-mobile-label-size-out>14 px</b></span>
    <span class="st-hb-range">
      <input type="range" min="8" max="48" step="1" data-st-hb-button-mobile-label-size>
      <input type="number" min="8" max="48" step="1" data-st-hb-button-mobile-label-size-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Розмір іконки — mobile</span><b data-st-hb-button-mobile-icon-size-out>18 px</b></span>
    <span class="st-hb-range">
      <input type="range" min="12" max="64" step="1" data-st-hb-button-mobile-icon-size>
      <input type="number" min="12" max="64" step="1" data-st-hb-button-mobile-icon-size-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Відступ текст / іконка — mobile</span><b data-st-hb-button-mobile-gap-out>8 px</b></span>
    <span class="st-hb-range">
      <input type="range" min="0" max="32" step="1" data-st-hb-button-mobile-gap>
      <input type="number" min="0" max="32" step="1" data-st-hb-button-mobile-gap-num>
    </span>
  </label>
</div>
<div class="st-hb-subacc__preview">
  <div class="st-hb-subacc__previewbox" data-st-hb-button-mobile-previewbox></div>
</div>
`);
  const hover = makeButtonInnerAccordion_('Hover', 'Hover-ефекти для всієї кнопки, тексту або іконки.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-hover-target="block">Вся кнопка</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-hover-target="label">Текст</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-hover-target="icon">Іконка</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Прозорість hover — <span data-st-hb-button-hover-target-label>Вся кнопка</span></span><b data-st-hb-button-hover-opacity-out>100%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="20" max="100" step="1" data-st-hb-button-hover-opacity>
      <input type="number" min="20" max="100" step="1" data-st-hb-button-hover-opacity-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Масштаб hover — <span data-st-hb-button-hover-target-label>Вся кнопка</span></span><b data-st-hb-button-hover-scale-out>100%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="80" max="130" step="1" data-st-hb-button-hover-scale>
      <input type="number" min="80" max="130" step="1" data-st-hb-button-hover-scale-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Зсув Y hover — <span data-st-hb-button-hover-target-label>Вся кнопка</span></span><b data-st-hb-button-hover-offset-y-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="-30" max="30" step="1" data-st-hb-button-hover-offset-y>
      <input type="number" min="-30" max="30" step="1" data-st-hb-button-hover-offset-y-num>
    </span>
  </label>
</div>
`);
  const extras = makeButtonInnerAccordion_('Додаткові фішки', 'Готові шаблони кнопки з швидкою зміною форми, кольору та градієнта. Тонкі стилі — через головний інспектор.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-extra-preset="primary">Primary</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-extra-preset="secondary">Secondary</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-extra-preset="outline">Outline</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-extra-preset="ghost">Ghost</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-extra-preset="cta">Header CTA</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-shape="square">Форма: Square</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-shape="rounded">Форма: Rounded</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-shape="pill">Форма: Pill</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-button-fill-mode="solid">Колір</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-button-fill-mode="gradient">Градієнт</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Основний колір</span></span>
    <input type="color" value="#2563eb" data-st-hb-button-color1>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Другий колір</span></span>
    <input type="color" value="#60a5fa" data-st-hb-button-color2>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Кут градієнта</span><b data-st-hb-button-gradient-angle-out>135°</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="0" max="360" step="1" data-st-hb-button-gradient-angle>
      <input type="number" min="0" max="360" step="1" data-st-hb-button-gradient-angle-num>
    </span>
  </label>
</div>
<div class="st-hb-subacc__hint">
  Ці шаблони швидко задають базову форму, колір і градієнт кнопки. Точні тіні, бордери, падінги та інші дрібні стилі змінюй стандартними інструментами інспектора.
</div>`);

  [general, position, behavior, adaptive, hover, extras].forEach((acc, idx) => {
    holder.appendChild(acc);
    if (idx === 0) {
      const head = acc.querySelector('.st-hb-subacc__head');
      const body = acc.querySelector('.st-hb-subacc__body');
      if (head && body) {
        head.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        acc.classList.add('is-open');
      }
    }
  });
}

function buildPngInnerAccordions_(holder){
  if (!holder || holder.__st_png_inner_ready) return;
  holder.__st_png_inner_ready = true;
  holder.classList.add('st-hb-logo-groups');

  const behavior = makePngInnerAccordion_('Посилання / Поведінка', 'Куди веде PNG і яка саме його частина є клікабельною.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-link-mode="home">На головну</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-link-mode="custom">Власне посилання</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-link-mode="none">Без посилання</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>URL PNG</span></span>
    <input type="text" placeholder="/ або https://example.com" data-st-hb-png-link-url>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;">
  <label class="st-hb-insbtn" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
    <input type="checkbox" data-st-hb-png-link-newtab>
    <span>Нова вкладка</span>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-click-area="all">Клікабельний весь блок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-click-area="media">Клікабельний тільки PNG</button>
</div>
`);

  const adaptive = makePngInnerAccordion_('Адаптивність', 'Окремі мобільні параметри для PNG на вузьких екранах.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-mobile-mode="inherit">Як на desktop</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-mobile-mode="hide">Сховати на mobile</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Ширина PNG — mobile</span><b data-st-hb-png-mobile-width-out>96 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="16" max="480" step="1" data-st-hb-png-mobile-width>
      <input type="number" min="16" max="480" step="1" data-st-hb-png-mobile-width-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Висота PNG — mobile</span><b data-st-hb-png-mobile-height-out>64 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="16" max="320" step="1" data-st-hb-png-mobile-height>
      <input type="number" min="16" max="320" step="1" data-st-hb-png-mobile-height-num>
    </span>
  </label>
</div>
<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-mobile-choose="images">Mobile PNG</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-mobile-use-desktop>Використати desktop PNG</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-mobile-clear>Очистити mobile PNG</button>
</div>
<div class="st-hb-subacc__preview" style="padding-top:10px;">
  <div class="st-hb-subacc__previewbox" data-st-hb-png-mobile-previewbox></div>
</div>
`);

  const hover = makePngInnerAccordion_('Hover', 'Hover-ефекти для всього блока або самого PNG.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-hover-target="block">Весь блок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-hover-target="media">Сам PNG</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Прозорість hover — <span data-st-hb-png-hover-target-label>Весь блок</span></span><b data-st-hb-png-hover-opacity-out>100%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="20" max="100" step="1" data-st-hb-png-hover-opacity>
      <input type="number" min="20" max="100" step="1" data-st-hb-png-hover-opacity-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Масштаб hover — <span data-st-hb-png-hover-target-label>Весь блок</span></span><b data-st-hb-png-hover-scale-out>100%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="80" max="130" step="1" data-st-hb-png-hover-scale>
      <input type="number" min="80" max="130" step="1" data-st-hb-png-hover-scale-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Зсув Y hover — <span data-st-hb-png-hover-target-label>Весь блок</span></span><b data-st-hb-png-hover-offset-y-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="-30" max="30" step="1" data-st-hb-png-hover-offset-y>
      <input type="number" min="-30" max="30" step="1" data-st-hb-png-hover-offset-y-num>
    </span>
  </label>
</div>
`);

  const extras = makePngInnerAccordion_('Додаткові фішки', 'Швидкі пресети та glow для PNG або всього блока.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-extra-preset="none">Без ефекту</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-extra-preset="soft">М'який glow</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-extra-preset="neon">Неон PNG</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-extra-preset="halo">Halo блока</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-glow-target="media">Glow PNG</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-glow-target="block">Glow блока</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Колір glow</span></span>
    <input type="color" value="#60a5fa" data-st-hb-png-glow-color>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Сила glow</span><b data-st-hb-png-glow-opacity-out>0%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="0" max="100" step="1" data-st-hb-png-glow-opacity>
      <input type="number" min="0" max="100" step="1" data-st-hb-png-glow-opacity-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Blur glow</span><b data-st-hb-png-glow-blur-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="0" max="48" step="1" data-st-hb-png-glow-blur>
      <input type="number" min="0" max="48" step="1" data-st-hb-png-glow-blur-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Розліт glow</span><b data-st-hb-png-glow-spread-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="0" max="36" step="1" data-st-hb-png-glow-spread>
      <input type="number" min="0" max="36" step="1" data-st-hb-png-glow-spread-num>
    </span>
  </label>
</div>
`);

  [behavior, adaptive, hover, extras].forEach((acc, idx) => {
    holder.appendChild(acc);
    if (idx === 0) {
      const head = acc.querySelector('.st-hb-subacc__head');
      const body = acc.querySelector('.st-hb-subacc__body');
      if (head && body) {
        head.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        acc.classList.add('is-open');
      }
    }
  });
}

function buildLogoInnerAccordions_(holder){
  if (!holder || holder.__st_logo_inner_ready) return;
  holder.__st_logo_inner_ready = true;
  holder.classList.add('st-hb-logo-groups');

  const general = makeLogoInnerAccordion_('Загальні налаштування', 'Режим логотипа, джерело знака та швидкий перехід до потрібного віджета інспектора.', `
<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-text-tune>Налаштувати текст</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-subtitle-tune>Налаштувати підзаголовок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-sign-tune>Налаштувати знак</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mode="logo">Лого</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mode="logo-text">Лого + текст</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mode="logo-text-subtitle">Лого + текст + підзаголовок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mode="text-only">Текстове лого</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-source="image">Картинка</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-source="icon">Іконка</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-image-choose="logos">Вибрати лого</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-image-choose="images">Картинки</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-icon-choose>Вибрати іконку</button>
</div>
`);

  const position = makeLogoInnerAccordion_('Позиція', 'Розміри знака, позиція, відступи та посадка картинки.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-pos="left">Знак зліва</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-pos="right">Знак справа</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-pos="top">Знак зверху</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-pos="bottom">Знак знизу</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-pos="none">Виключити знак</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-preset="compact">Компакт</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-preset="medium">Середній</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-preset="wide">Широкий</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Ширина знака</span><b data-st-hb-logo-mark-width-out>96 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="20" max="320" step="1" data-st-hb-logo-mark-width>
      <input type="number" min="20" max="320" step="1" data-st-hb-logo-mark-width-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Висота знака</span><b data-st-hb-logo-mark-height-out>44 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="20" max="220" step="1" data-st-hb-logo-mark-height>
      <input type="number" min="20" max="220" step="1" data-st-hb-logo-mark-height-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Відступ знак / текст</span><b data-st-hb-logo-gap-out>12 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="0" max="48" step="1" data-st-hb-logo-gap>
      <input type="number" min="0" max="48" step="1" data-st-hb-logo-gap-num>
    </span>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-text-target="title">Бренд</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-text-target="subtitle">Підзаголовок</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Розмір тексту — <span data-st-hb-logo-text-target-label>Бренд</span></span><b data-st-hb-logo-text-size-out>24 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="8" max="120" step="1" data-st-hb-logo-text-size>
      <input type="number" min="8" max="120" step="1" data-st-hb-logo-text-size-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Відступ X — <span data-st-hb-logo-text-target-label>Бренд</span></span><b data-st-hb-logo-text-offset-x-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="-60" max="120" step="1" data-st-hb-logo-text-offset-x>
      <input type="number" min="-60" max="120" step="1" data-st-hb-logo-text-offset-x-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Відступ Y — <span data-st-hb-logo-text-target-label>Бренд</span></span><b data-st-hb-logo-text-offset-y-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="-60" max="120" step="1" data-st-hb-logo-text-offset-y>
      <input type="number" min="-60" max="120" step="1" data-st-hb-logo-text-offset-y-num>
    </span>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-fit="contain">Вмістити</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-fit="cover">Заповнити</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-fit="fill">Розтягнути</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-align="start">Верх</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-align="center">Центр</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-align="end">Низ</button>
</div>
`);

  const behavior = makeLogoInnerAccordion_('Посилання / Поведінка', 'Куди веде логотип і яка саме його частина є клікабельною.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-link-mode="home">На головну</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-link-mode="custom">Власне посилання</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-link-mode="none">Без посилання</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>URL логотипа</span></span>
    <input type="text" placeholder="/ або https://example.com" data-st-hb-logo-link-url>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center;">
  <label class="st-hb-insbtn" style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;">
    <input type="checkbox" data-st-hb-logo-link-newtab>
    <span>Нова вкладка</span>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-click-area="all">Клікабельний весь блок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-click-area="mark">Клікабельний знак</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-click-area="title">Клікабельний бренд</button>
</div>
`);

  const adaptive = makeLogoInnerAccordion_('Адаптивність', 'Окремі мобільні параметри для логотипа. Працюють на вузьких екранах.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mobile-mode="inherit">Як на desktop</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mobile-mode="hide-subtitle">Сховати підзаголовок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-mobile-mode="icon-only">Тільки знак</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Ширина знака — mobile</span><b data-st-hb-logo-mobile-mark-width-out>72 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="20" max="220" step="1" data-st-hb-logo-mobile-mark-width>
      <input type="number" min="20" max="220" step="1" data-st-hb-logo-mobile-mark-width-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Розмір бренду — mobile</span><b data-st-hb-logo-mobile-title-size-out>18 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="8" max="80" step="1" data-st-hb-logo-mobile-title-size>
      <input type="number" min="8" max="80" step="1" data-st-hb-logo-mobile-title-size-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Розмір підзаголовка — mobile</span><b data-st-hb-logo-mobile-subtitle-size-out>11 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="8" max="48" step="1" data-st-hb-logo-mobile-subtitle-size>
      <input type="number" min="8" max="48" step="1" data-st-hb-logo-mobile-subtitle-size-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Відступ знак / текст — mobile</span><b data-st-hb-logo-mobile-gap-out>10 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="0" max="40" step="1" data-st-hb-logo-mobile-gap>
      <input type="number" min="0" max="40" step="1" data-st-hb-logo-mobile-gap-num>
    </span>
  </label>
</div>
<div class="st-hb-subacc__preview" style="padding-top:10px;">
  <div class="st-hb-subacc__previewbox" data-st-hb-logo-adaptive-previewbox></div>
</div>
`);

  const hover = makeLogoInnerAccordion_('Hover', 'Окремі hover-налаштування для всього логотипа, знака, бренду та підзаголовка.', `
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-hover-target="block">Весь блок</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-hover-target="mark">Знак</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-hover-target="title">Бренд</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-hover-target="subtitle">Підзаголовок</button>
</div>
<div class="st-hb-subacc__grid">
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Прозорість hover — <span data-st-hb-logo-hover-target-label>Весь блок</span></span><b data-st-hb-logo-hover-opacity-out>100%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="20" max="100" step="1" data-st-hb-logo-hover-opacity>
      <input type="number" min="20" max="100" step="1" data-st-hb-logo-hover-opacity-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Масштаб hover — <span data-st-hb-logo-hover-target-label>Весь блок</span></span><b data-st-hb-logo-hover-scale-out>100%</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="80" max="130" step="1" data-st-hb-logo-hover-scale>
      <input type="number" min="80" max="130" step="1" data-st-hb-logo-hover-scale-num>
    </span>
  </label>
  <label class="st-hb-field">
    <span class="st-hb-field__label"><span>Зсув Y hover — <span data-st-hb-logo-hover-target-label>Весь блок</span></span><b data-st-hb-logo-hover-offset-y-out>0 px</b></span>
    <span class="st-hb-field__row">
      <input type="range" min="-30" max="30" step="1" data-st-hb-logo-hover-offset-y>
      <input type="number" min="-30" max="30" step="1" data-st-hb-logo-hover-offset-y-num>
    </span>
  </label>
</div>
`);

  [general, position, behavior, adaptive, hover].forEach((acc, idx) => {
    holder.appendChild(acc);
    if (idx === 0) {
      const head = acc.querySelector('.st-hb-subacc__head');
      const body = acc.querySelector('.st-hb-subacc__body');
      if (head && body) {
        head.setAttribute('aria-expanded', 'true');
        body.hidden = false;
        acc.classList.add('is-open');
      }
    }
  });
}

function loadPickedIcon_(){
  if (_pickedIcon) return;
  try {
    const raw = localStorage.getItem(ICON_PICK_KEY);
    if (raw) _pickedIcon = JSON.parse(raw);
  } catch(e) {}
}

function savePickedIcon_(){
  try { localStorage.setItem(ICON_PICK_KEY, JSON.stringify(_pickedIcon || null)); } catch(e) {}
}

function renderIconPreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-icon-previewbox]');
  if (!box) return;
  if (!_pickedIcon || !_pickedIcon.svg) {
    box.innerHTML = `<div class="st-hb-subacc__previewph">Нічого не вибрано</div>`;
    return;
  }
  box.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'st-hb-subacc__iconwrap';
  wrap.style.color = _pickedIcon.defaultColor || '#ffffff';
  wrap.innerHTML = (_pickedIcon.svg || '').trim();
  const s = wrap.querySelector('svg');
  if (s) {
    s.setAttribute('width','28');
    s.setAttribute('height','28');
  }
  box.appendChild(wrap);
}

async function pickIconViaGallery_(sectionEl, opts = {}){
  loadPickedIcon_();
  const onPicked = (opts && typeof opts.onPicked === 'function') ? opts.onPicked : null;
  try {
    await openGalleryModal({
      pickerMode: true,
      cat: 'icons',
      view: 'icons',
      onPick: async (payload) => {
        if (!payload) return;
        try {
          const url = payload.url || payload.src || '';
          const name = payload.name || payload.title || payload.fileName || '';
          const defaultColor = payload.defaultColor || (payload.iconTheme === 'dark' ? '#ffffff' : '#000000') || '#ffffff';
          let svg = payload.svg || '';
          if (!svg && url) {
            const r = await fetch(url);
            svg = await r.text();
          }
          if (svg && !svg.trim().startsWith('<svg')) {
            const m = svg.match(/<svg[\s\S]*?<\/svg>/i);
            if (m) svg = m[0];
          }
          if (!svg) return;
          _pickedIcon = { name: name || 'icon', url, svg, defaultColor, iconTheme: payload.iconTheme || (defaultColor === '#000000' ? 'light' : 'dark') };
          savePickedIcon_();
          renderIconPreview_(sectionEl);
          if (onPicked) {
            try { onPicked(getPickedIconPayload_()); } catch(e) {}
          }
        } catch(e) {}
      }
    });
  } catch(e) {}
}

function getPickedIconPayload_(){
  loadPickedIcon_();
  if (!_pickedIcon || !_pickedIcon.svg) return null;
  return {
    name: _pickedIcon.name || 'icon',
    svg: _pickedIcon.svg,
    defaultColor: _pickedIcon.defaultColor || '#ffffff',
    iconTheme: _pickedIcon.iconTheme || 'dark',
    url: _pickedIcon.url || ''
  };
}

function getPickedOrDefaultPhoneIconPayload_(){
  const payload = getPickedIconPayload_();
  if (payload && payload.svg) return payload;
  return {
    name: 'phone',
    svg: DEFAULT_PHONE_SVG,
    defaultColor: '#ffffff',
    iconTheme: 'dark',
    url: ''
  };
}

function loadPhoneIconPos_(){
  try {
    const raw = localStorage.getItem(PHONE_ICON_POS_KEY) || 'left';
    if (raw === 'left' || raw === 'right' || raw === 'none') return raw;
  } catch(e) {}
  return 'left';
}

function savePhoneIconPos_(pos){
  const safe = (pos === 'right' || pos === 'none') ? pos : 'left';
  try { localStorage.setItem(PHONE_ICON_POS_KEY, safe); } catch(e) {}
}

function syncPhonePosUI_(sectionEl, pos){
  const safe = (pos === 'right' || pos === 'none') ? pos : 'left';
  sectionEl.querySelectorAll('[data-st-hb-phone-icon-pos]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-phone-icon-pos')) === safe);
  });
}

function renderPhonePreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-phone-previewbox]');
  if (!box) return;
  const payload = getPickedOrDefaultPhoneIconPayload_();
  const pos = loadPhoneIconPos_();
  const iconSvg = (payload && payload.svg) ? payload.svg : DEFAULT_PHONE_SVG;
  const iconColor = (payload && payload.defaultColor) ? payload.defaultColor : '#ffffff';
  const phone = '098-000-00-00';
  const iconHtml = pos === 'none' ? '' : `<span class="st-hb-subacc__iconwrap" style="color:${iconColor}">${iconSvg}</span>`;
  box.innerHTML = `<div style="display:flex;align-items:center;gap:10px;justify-content:flex-start;">${pos === 'right' ? `<span style="font-weight:700;">${phone}</span>${iconHtml}` : `${iconHtml}<span style="font-weight:700;">${phone}</span>`}</div>`;
}

function loadPickedLogoImage_(){
  if (_pickedLogoImage) return;
  try {
    const raw = localStorage.getItem(LOGO_IMAGE_PICK_KEY);
    if (raw) _pickedLogoImage = JSON.parse(raw);
  } catch(e) {}
}

function savePickedLogoImage_(){
  try { localStorage.setItem(LOGO_IMAGE_PICK_KEY, JSON.stringify(_pickedLogoImage || null)); } catch(e) {}
}

function getPickedLogoImagePayload_(){
  loadPickedLogoImage_();
  if (!_pickedLogoImage || !_pickedLogoImage.url) return null;
  return {
    name: _pickedLogoImage.name || 'logo',
    url: _pickedLogoImage.url || '',
    mime: _pickedLogoImage.mime || '',
    cat: _pickedLogoImage.cat || 'logos'
  };
}

async function makeStableImageUrl_(url){
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^data:image\//i.test(raw)) return raw;
  if (!/^blob:/i.test(raw)) return raw;
  try {
    const res = await fetch(raw);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : raw);
      reader.onerror = () => resolve(raw);
      reader.readAsDataURL(blob);
    });
  } catch(e) {
    return raw;
  }
}

async function pickLogoImageViaGallery_(sectionEl, cat = 'logos', opts = {}){
  loadPickedLogoImage_();
  const onPicked = (opts && typeof opts.onPicked === 'function') ? opts.onPicked : null;
  try {
    await openGalleryModal({
      pickerMode: true,
      cat: cat || 'logos',
      view: 'big',
      onPick: async (payload) => {
        if (!payload) return;
        try {
          const rawUrl = payload.url || payload.src || '';
          if (!rawUrl) return;
          const url = await makeStableImageUrl_(rawUrl);
          _pickedLogoImage = {
            name: payload.name || payload.title || payload.fileName || 'logo',
            url,
            mime: payload.mime || '',
            cat: payload.cat || cat || 'logos'
          };
          savePickedLogoImage_();
          renderLogoPreview_(sectionEl);
          const picked = getPickedLogoImagePayload_();
          try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:image:apply', { detail: picked })); } catch (e) {}
          if (onPicked) {
            try { onPicked(picked); } catch(e) {}
          }
        } catch(e) {}
      }
    });
  } catch(e) {}
}


function loadPickedPngImage_(){
  if (_pickedPngImage) return;
  try {
    const raw = localStorage.getItem(PNG_IMAGE_PICK_KEY);
    if (raw) _pickedPngImage = JSON.parse(raw);
  } catch(e) {}
}

function savePickedPngImage_(){
  try { localStorage.setItem(PNG_IMAGE_PICK_KEY, JSON.stringify(_pickedPngImage || null)); } catch(e) {}
}

function getPickedPngImagePayload_(){
  loadPickedPngImage_();
  if (!_pickedPngImage || !_pickedPngImage.url) return null;
  return {
    name: _pickedPngImage.name || 'png',
    url: _pickedPngImage.url || '',
    mime: _pickedPngImage.mime || '',
    cat: _pickedPngImage.cat || 'images'
  };
}

async function pickPngImageViaGallery_(sectionEl, cat = 'images', opts = {}){
  loadPickedPngImage_();
  const onPicked = (opts && typeof opts.onPicked === 'function') ? opts.onPicked : null;
  try {
    await openGalleryModal({
      pickerMode: true,
      cat: cat || 'images',
      view: 'big',
      onPick: async (payload) => {
        if (!payload) return;
        try {
          const rawUrl = payload.url || payload.src || '';
          if (!rawUrl) return;
          const url = await makeStableImageUrl_(rawUrl);
          _pickedPngImage = {
            name: payload.name || payload.title || payload.fileName || 'png',
            url,
            mime: payload.mime || '',
            cat: payload.cat || cat || 'images'
          };
          savePickedPngImage_();
          renderPngPreview_(sectionEl);
          const picked = getPickedPngImagePayload_();
          try { window.dispatchEvent(new CustomEvent('st:header-insert:png:image:apply', { detail: picked })); } catch (e) {}
          if (onPicked) {
            try { onPicked(picked); } catch(e) {}
          }
        } catch(e) {}
      }
    });
  } catch(e) {}
}

function renderPngPreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-png-previewbox]');
  if (!box) return;
  const payload = getPickedPngImagePayload_();
  if (!payload || !payload.url) {
    box.innerHTML = '<div class="st-hb-subacc__previewph">PNG не вибрано</div>';
    return;
  }
  const safeUrl = String(payload.url || '').replace(/'/g, '&#39;');
  box.innerHTML = `
    <div style="width:100%; display:flex; align-items:center; justify-content:center; padding:10px;">
      <span style="display:block; width:100%; max-width:180px; height:72px; border-radius:12px; border:1px solid rgba(148,163,184,0.22); background:rgba(15,23,42,0.34) url('${safeUrl}') center / contain no-repeat;"></span>
    </div>
  `;
}

function loadPngLinkMode_(){
  try {
    const raw = String(localStorage.getItem(PNG_LINK_MODE_KEY) || 'none');
    if (['home','custom','none'].includes(raw)) return raw;
  } catch(e) {}
  return 'none';
}
function savePngLinkMode_(value){
  const safe = ['home','custom','none'].includes(String(value || '')) ? String(value) : 'none';
  try { localStorage.setItem(PNG_LINK_MODE_KEY, safe); } catch(e) {}
}
function loadPngLinkUrl_(){
  try { return String(localStorage.getItem(PNG_LINK_URL_KEY) || ''); } catch(e) {}
  return '';
}
function savePngLinkUrl_(value){
  try { localStorage.setItem(PNG_LINK_URL_KEY, String(value || '')); } catch(e) {}
}
function loadPngLinkNewTab_(){
  try { return String(localStorage.getItem(PNG_LINK_NEWTAB_KEY) || '0') === '1'; } catch(e) {}
  return false;
}
function savePngLinkNewTab_(value){
  try { localStorage.setItem(PNG_LINK_NEWTAB_KEY, value ? '1' : '0'); } catch(e) {}
}
function loadPngClickArea_(){
  try {
    const raw = String(localStorage.getItem(PNG_CLICK_AREA_KEY) || 'all');
    if (['all','media'].includes(raw)) return raw;
  } catch(e) {}
  return 'all';
}
function savePngClickArea_(value){
  const safe = ['all','media'].includes(String(value || '')) ? String(value) : 'all';
  try { localStorage.setItem(PNG_CLICK_AREA_KEY, safe); } catch(e) {}
}
function syncPngLinkUi_(sectionEl){
  const mode = loadPngLinkMode_();
  const clickArea = loadPngClickArea_();
  const url = loadPngLinkUrl_();
  const newTab = loadPngLinkNewTab_();
  sectionEl.querySelectorAll('[data-st-hb-png-link-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-png-link-mode')) === mode);
  });
  sectionEl.querySelectorAll('[data-st-hb-png-click-area]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-png-click-area')) === clickArea);
  });
  sectionEl.querySelectorAll('[data-st-hb-png-link-url]').forEach((el) => {
    try { el.value = url; } catch(e) {}
    try { el.disabled = (mode !== 'custom'); } catch(e) {}
  });
  sectionEl.querySelectorAll('[data-st-hb-png-link-newtab]').forEach((el) => {
    try { el.checked = !!newTab; } catch(e) {}
    try { el.disabled = (mode === 'none'); } catch(e) {}
  });
}
function collectPngLinkDetail_(){
  return {
    mode: loadPngLinkMode_(),
    href: loadPngLinkUrl_(),
    newTab: loadPngLinkNewTab_(),
    clickArea: loadPngClickArea_(),
  };
}

function loadPickedPngMobileImage_(){
  if (_pickedPngMobileImage) return;
  try {
    const raw = localStorage.getItem(PNG_MOBILE_IMAGE_PICK_KEY);
    if (raw) _pickedPngMobileImage = JSON.parse(raw);
  } catch(e) {}
}

function savePickedPngMobileImage_(){
  try { localStorage.setItem(PNG_MOBILE_IMAGE_PICK_KEY, JSON.stringify(_pickedPngMobileImage || null)); } catch(e) {}
}

function getPickedPngMobileImagePayload_(){
  loadPickedPngMobileImage_();
  if (!_pickedPngMobileImage || !_pickedPngMobileImage.url) return null;
  return {
    name: _pickedPngMobileImage.name || 'png-mobile',
    url: _pickedPngMobileImage.url || '',
    mime: _pickedPngMobileImage.mime || '',
    cat: _pickedPngMobileImage.cat || 'images'
  };
}

async function pickPngMobileImageViaGallery_(sectionEl, cat = 'images', opts = {}){
  loadPickedPngMobileImage_();
  const onPicked = (opts && typeof opts.onPicked === 'function') ? opts.onPicked : null;
  try {
    await openGalleryModal({
      pickerMode: true,
      cat: cat || 'images',
      view: 'big',
      onPick: async (payload) => {
        if (!payload) return;
        try {
          const rawUrl = payload.url || payload.src || '';
          if (!rawUrl) return;
          const url = await makeStableImageUrl_(rawUrl);
          _pickedPngMobileImage = {
            name: payload.name || payload.title || payload.fileName || 'png-mobile',
            url,
            mime: payload.mime || '',
            cat: payload.cat || cat || 'images'
          };
          savePickedPngMobileImage_();
          syncPngAdaptiveUi_(sectionEl);
          if (onPicked) {
            try { onPicked(getPickedPngMobileImagePayload_()); } catch(e) {}
          }
        } catch(e) {}
      }
    });
  } catch(e) {}
}

function loadPngMobileMode_(){
  try {
    const raw = String(localStorage.getItem(PNG_MOBILE_MODE_KEY) || 'inherit');
    if (['inherit','hide'].includes(raw)) return raw;
  } catch(e) {}
  return 'inherit';
}
function savePngMobileMode_(value){
  const safe = ['inherit','hide'].includes(String(value || '')) ? String(value) : 'inherit';
  try { localStorage.setItem(PNG_MOBILE_MODE_KEY, safe); } catch(e) {}
}
function loadPngMobileWidth_(){
  try { return clampLogoNum_(localStorage.getItem(PNG_MOBILE_WIDTH_KEY), 96, 16, 480); } catch(e) {}
  return 96;
}
function savePngMobileWidth_(value){
  try { localStorage.setItem(PNG_MOBILE_WIDTH_KEY, String(clampLogoNum_(value, 96, 16, 480))); } catch(e) {}
}
function loadPngMobileHeight_(){
  try { return clampLogoNum_(localStorage.getItem(PNG_MOBILE_HEIGHT_KEY), 64, 16, 320); } catch(e) {}
  return 64;
}
function savePngMobileHeight_(value){
  try { localStorage.setItem(PNG_MOBILE_HEIGHT_KEY, String(clampLogoNum_(value, 64, 16, 320))); } catch(e) {}
}
function renderPngMobilePreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-png-mobile-previewbox]');
  if (!box) return;
  const mobile = getPickedPngMobileImagePayload_();
  const desktop = getPickedPngImagePayload_();
  const payload = mobile || desktop;
  if (!payload || !payload.url) {
    box.innerHTML = '<div class="st-hb-subacc__previewph">Mobile PNG не вибрано</div>';
    return;
  }
  const safeUrl = String(payload.url || '').replace(/'/g, '&#39;');
  const width = loadPngMobileWidth_();
  const height = loadPngMobileHeight_();
  const note = mobile ? 'Окремий mobile PNG' : 'Використовується desktop PNG';
  box.innerHTML = `
    <div style="width:100%; display:flex; align-items:center; justify-content:center; padding:10px;">
      <span style="display:block; width:min(${width}px, 100%); height:${height}px; border-radius:12px; border:1px solid rgba(148,163,184,0.22); background:rgba(15,23,42,0.34) url('${safeUrl}') center / contain no-repeat;"></span>
    </div>
    <div class="st-hb-subacc__hint" style="padding:0 10px 10px;">${note}</div>
  `;
}
function syncPngAdaptiveUi_(sectionEl){
  const mode = loadPngMobileMode_();
  sectionEl.querySelectorAll('[data-st-hb-png-mobile-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-png-mobile-mode')) === mode);
  });
  const pairs = [
    ['[data-st-hb-png-mobile-width]', loadPngMobileWidth_()],
    ['[data-st-hb-png-mobile-width-num]', loadPngMobileWidth_()],
    ['[data-st-hb-png-mobile-height]', loadPngMobileHeight_()],
    ['[data-st-hb-png-mobile-height-num]', loadPngMobileHeight_()],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => {
      try { el.value = String(value); } catch(e) {}
    });
  });
  const outMap = {
    '[data-st-hb-png-mobile-width-out]': loadPngMobileWidth_() + ' px',
    '[data-st-hb-png-mobile-height-out]': loadPngMobileHeight_() + ' px',
  };
  Object.entries(outMap).forEach(([sel, value]) => {
    const el = sectionEl.querySelector(sel);
    if (el) el.textContent = value;
  });
  renderPngMobilePreview_(sectionEl);
}
function collectPngAdaptiveDetail_(){
  return {
    mode: loadPngMobileMode_(),
    width: loadPngMobileWidth_(),
    height: loadPngMobileHeight_(),
    mobileImage: getPickedPngMobileImagePayload_(),
  };
}

function loadPngHoverTarget_(){
  try {
    const raw = String(localStorage.getItem(PNG_HOVER_TARGET_KEY) || 'block');
    if (['block','media'].includes(raw)) return raw;
  } catch(e) {}
  return 'block';
}
function savePngHoverTarget_(value){
  const safe = ['block','media'].includes(String(value || '')) ? String(value) : 'block';
  try { localStorage.setItem(PNG_HOVER_TARGET_KEY, safe); } catch(e) {}
}
function getPngHoverMetricKey_(target, metric){
  const safeTarget = ['block','media'].includes(String(target || '')) ? String(target) : 'block';
  const safeMetric = ['opacity','scale','offsetY'].includes(String(metric || '')) ? String(metric) : 'opacity';
  return `${PNG_HOVER_METRIC_PREFIX}:${safeTarget}:${safeMetric}`;
}
function clampPngHoverMetric_(metric, value){
  if (metric === 'opacity') return clampLogoNum_(value, 100, 20, 100);
  if (metric === 'scale') return clampLogoNum_(value, 100, 80, 130);
  return clampLogoNum_(value, 0, -30, 30);
}
function loadPngHoverMetric_(target, metric){
  try { return clampPngHoverMetric_(metric, localStorage.getItem(getPngHoverMetricKey_(target, metric))); } catch(e) {}
  return clampPngHoverMetric_(metric, null);
}
function savePngHoverMetric_(target, metric, value){
  try { localStorage.setItem(getPngHoverMetricKey_(target, metric), String(clampPngHoverMetric_(metric, value))); } catch(e) {}
}
function getPngHoverState_(){
  const target = loadPngHoverTarget_();
  return {
    target,
    opacity: loadPngHoverMetric_(target, 'opacity'),
    scale: loadPngHoverMetric_(target, 'scale'),
    offsetY: loadPngHoverMetric_(target, 'offsetY'),
  };
}
function syncPngHoverUi_(sectionEl){
  const state = getPngHoverState_();
  const labels = { block:'Весь блок', media:'Сам PNG' };
  sectionEl.querySelectorAll('[data-st-hb-png-hover-target]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-png-hover-target')) === state.target);
  });
  sectionEl.querySelectorAll('[data-st-hb-png-hover-target-label]').forEach((el) => {
    el.textContent = labels[state.target] || 'Весь блок';
  });
  const pairs = [
    ['[data-st-hb-png-hover-opacity]', state.opacity],
    ['[data-st-hb-png-hover-opacity-num]', state.opacity],
    ['[data-st-hb-png-hover-scale]', state.scale],
    ['[data-st-hb-png-hover-scale-num]', state.scale],
    ['[data-st-hb-png-hover-offset-y]', state.offsetY],
    ['[data-st-hb-png-hover-offset-y-num]', state.offsetY],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => { try { el.value = String(value); } catch(e) {} });
  });
  const opacityOut = sectionEl.querySelector('[data-st-hb-png-hover-opacity-out]');
  const scaleOut = sectionEl.querySelector('[data-st-hb-png-hover-scale-out]');
  const offsetYOut = sectionEl.querySelector('[data-st-hb-png-hover-offset-y-out]');
  if (opacityOut) opacityOut.textContent = state.opacity + '%';
  if (scaleOut) scaleOut.textContent = state.scale + '%';
  if (offsetYOut) offsetYOut.textContent = state.offsetY + ' px';
}
function collectPngHoverDetail_(){
  const targets = ['block','media'];
  const metrics = {};
  targets.forEach((target) => {
    metrics[target] = {
      opacity: loadPngHoverMetric_(target, 'opacity'),
      scale: loadPngHoverMetric_(target, 'scale'),
      offsetY: loadPngHoverMetric_(target, 'offsetY'),
    };
  });
  return { target: loadPngHoverTarget_(), metrics };
}
function applyPngHoverInputChange_(sectionEl, metric, value){
  const target = loadPngHoverTarget_();
  savePngHoverMetric_(target, metric, value);
  syncPngHoverUi_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:png:hover:apply', { detail: collectPngHoverDetail_() })); } catch (e) {}
}

function loadPngExtraPreset_(){
  try {
    const raw = String(localStorage.getItem(PNG_EXTRA_PRESET_KEY) || 'none');
    if (['none','soft','neon','halo'].includes(raw)) return raw;
  } catch(e) {}
  return 'none';
}
function savePngExtraPreset_(value){
  const safe = ['none','soft','neon','halo'].includes(String(value || '')) ? String(value) : 'none';
  try { localStorage.setItem(PNG_EXTRA_PRESET_KEY, safe); } catch(e) {}
}
function loadPngGlowTarget_(){
  try {
    const raw = String(localStorage.getItem(PNG_GLOW_TARGET_KEY) || 'media');
    if (['media','block'].includes(raw)) return raw;
  } catch(e) {}
  return 'media';
}
function savePngGlowTarget_(value){
  const safe = ['media','block'].includes(String(value || '')) ? String(value) : 'media';
  try { localStorage.setItem(PNG_GLOW_TARGET_KEY, safe); } catch(e) {}
}
function normalizeHexColor_(value, fallback = '#60a5fa'){
  const raw = String(value || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) return '#' + raw.slice(1).split('').map((ch) => ch + ch).join('').toLowerCase();
  return fallback;
}
function loadPngGlowColor_(){
  try { return normalizeHexColor_(localStorage.getItem(PNG_GLOW_COLOR_KEY), '#60a5fa'); } catch(e) {}
  return '#60a5fa';
}
function savePngGlowColor_(value){
  try { localStorage.setItem(PNG_GLOW_COLOR_KEY, normalizeHexColor_(value, '#60a5fa')); } catch(e) {}
}
function loadPngGlowOpacity_(){
  try { return clampLogoNum_(localStorage.getItem(PNG_GLOW_OPACITY_KEY), 0, 0, 100); } catch(e) {}
  return 0;
}
function savePngGlowOpacity_(value){
  try { localStorage.setItem(PNG_GLOW_OPACITY_KEY, String(clampLogoNum_(value, 0, 0, 100))); } catch(e) {}
}
function loadPngGlowBlur_(){
  try { return clampLogoNum_(localStorage.getItem(PNG_GLOW_BLUR_KEY), 0, 0, 48); } catch(e) {}
  return 0;
}
function savePngGlowBlur_(value){
  try { localStorage.setItem(PNG_GLOW_BLUR_KEY, String(clampLogoNum_(value, 0, 0, 48))); } catch(e) {}
}
function loadPngGlowSpread_(){
  try { return clampLogoNum_(localStorage.getItem(PNG_GLOW_SPREAD_KEY), 0, 0, 36); } catch(e) {}
  return 0;
}
function savePngGlowSpread_(value){
  try { localStorage.setItem(PNG_GLOW_SPREAD_KEY, String(clampLogoNum_(value, 0, 0, 36))); } catch(e) {}
}
function applyPngExtraPreset_(preset){
  const safe = ['none','soft','neon','halo'].includes(String(preset || '')) ? String(preset) : 'none';
  savePngExtraPreset_(safe);
  if (safe === 'none') {
    savePngGlowTarget_('media');
    savePngGlowColor_('#60a5fa');
    savePngGlowOpacity_(0);
    savePngGlowBlur_(0);
    savePngGlowSpread_(0);
    return;
  }
  if (safe === 'soft') {
    savePngGlowTarget_('media');
    savePngGlowColor_('#60a5fa');
    savePngGlowOpacity_(36);
    savePngGlowBlur_(18);
    savePngGlowSpread_(8);
    return;
  }
  if (safe === 'neon') {
    savePngGlowTarget_('media');
    savePngGlowColor_('#22d3ee');
    savePngGlowOpacity_(68);
    savePngGlowBlur_(26);
    savePngGlowSpread_(12);
    return;
  }
  savePngGlowTarget_('block');
  savePngGlowColor_('#818cf8');
  savePngGlowOpacity_(28);
  savePngGlowBlur_(28);
  savePngGlowSpread_(16);
}
function syncPngExtrasUi_(sectionEl){
  const preset = loadPngExtraPreset_();
  const target = loadPngGlowTarget_();
  const color = loadPngGlowColor_();
  const opacity = loadPngGlowOpacity_();
  const blur = loadPngGlowBlur_();
  const spread = loadPngGlowSpread_();
  sectionEl.querySelectorAll('[data-st-hb-png-extra-preset]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-png-extra-preset')) === preset);
  });
  sectionEl.querySelectorAll('[data-st-hb-png-glow-target]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-png-glow-target')) === target);
  });
  sectionEl.querySelectorAll('[data-st-hb-png-glow-color]').forEach((el) => { try { el.value = color; } catch(e) {} });
  [
    ['[data-st-hb-png-glow-opacity]', opacity],
    ['[data-st-hb-png-glow-opacity-num]', opacity],
    ['[data-st-hb-png-glow-blur]', blur],
    ['[data-st-hb-png-glow-blur-num]', blur],
    ['[data-st-hb-png-glow-spread]', spread],
    ['[data-st-hb-png-glow-spread-num]', spread],
  ].forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => { try { el.value = String(value); } catch(e) {} });
  });
  const opacityOut = sectionEl.querySelector('[data-st-hb-png-glow-opacity-out]');
  const blurOut = sectionEl.querySelector('[data-st-hb-png-glow-blur-out]');
  const spreadOut = sectionEl.querySelector('[data-st-hb-png-glow-spread-out]');
  if (opacityOut) opacityOut.textContent = opacity + '%';
  if (blurOut) blurOut.textContent = blur + ' px';
  if (spreadOut) spreadOut.textContent = spread + ' px';
}
function collectPngExtrasDetail_(){
  return {
    preset: loadPngExtraPreset_(),
    glowTarget: loadPngGlowTarget_(),
    glowColor: loadPngGlowColor_(),
    glowOpacity: loadPngGlowOpacity_(),
    glowBlur: loadPngGlowBlur_(),
    glowSpread: loadPngGlowSpread_(),
  };
}
function applyPngExtrasInputChange_(sectionEl, metric, value){
  if (metric === 'color') savePngGlowColor_(value);
  else if (metric === 'opacity') savePngGlowOpacity_(value);
  else if (metric === 'blur') savePngGlowBlur_(value);
  else if (metric === 'spread') savePngGlowSpread_(value);
  syncPngExtrasUi_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:png:extras:apply', { detail: collectPngExtrasDetail_() })); } catch (e) {}
}


function loadButtonText_(){
  try { return String(localStorage.getItem(BUTTON_TEXT_KEY) || 'Кнопка'); } catch(e) {}
  return 'Кнопка';
}
function saveButtonText_(value){
  const safe = String(value || '').trim().slice(0, 120) || 'Кнопка';
  try { localStorage.setItem(BUTTON_TEXT_KEY, safe); } catch(e) {}
}
function loadButtonMode_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_MODE_KEY) || 'text-icon');
    if (['text','text-icon','icon'].includes(raw)) return raw;
  } catch(e) {}
  return 'text-icon';
}
function saveButtonMode_(value){
  const safe = ['text','text-icon','icon'].includes(String(value || '')) ? String(value) : 'text-icon';
  try { localStorage.setItem(BUTTON_MODE_KEY, safe); } catch(e) {}
}
function loadButtonIconPos_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_ICON_POS_KEY) || 'left');
    if (['left','right','none'].includes(raw)) return raw;
  } catch(e) {}
  return 'left';
}
function saveButtonIconPos_(value){
  const safe = ['left','right','none'].includes(String(value || '')) ? String(value) : 'left';
  try { localStorage.setItem(BUTTON_ICON_POS_KEY, safe); } catch(e) {}
}
function loadPickedButtonIcon_(){
  try {
    const raw = localStorage.getItem(BUTTON_ICON_PICK_KEY);
    _pickedButtonIcon = raw ? JSON.parse(raw) : null;
  } catch(e) { _pickedButtonIcon = null; }
}
function savePickedButtonIcon_(){
  try { localStorage.setItem(BUTTON_ICON_PICK_KEY, JSON.stringify(_pickedButtonIcon || null)); } catch(e) {}
}
function getPickedButtonIconPayload_(){
  loadPickedButtonIcon_();
  if (!_pickedButtonIcon || !_pickedButtonIcon.svg) return null;
  return {
    name: _pickedButtonIcon.name || 'icon',
    svg: _pickedButtonIcon.svg,
    defaultColor: _pickedButtonIcon.defaultColor || '#ffffff',
    iconTheme: _pickedButtonIcon.iconTheme || 'dark',
    url: _pickedButtonIcon.url || ''
  };
}
async function pickButtonIconViaGallery_(sectionEl){
  loadPickedButtonIcon_();
  try {
    await openGalleryModal({
      pickerMode: true,
      cat: 'icons',
      view: 'icons',
      onPick: async (payload) => {
        if (!payload) return;
        try {
          const url = payload.url || payload.src || '';
          const name = payload.name || payload.title || payload.fileName || '';
          const defaultColor = payload.defaultColor || (payload.iconTheme === 'dark' ? '#ffffff' : '#000000') || '#ffffff';
          let svg = payload.svg || '';
          if (!svg && url) {
            const r = await fetch(url);
            svg = await r.text();
          }
          if (svg && !svg.trim().startsWith('<svg')) {
            const m = svg.match(/<svg[\s\S]*?<\/svg>/i);
            if (m) svg = m[0];
          }
          if (!svg) return;
          _pickedButtonIcon = { name: name || 'icon', url, svg, defaultColor, iconTheme: payload.iconTheme || (defaultColor === '#000000' ? 'light' : 'dark') };
          savePickedButtonIcon_();
          renderButtonPreview_(sectionEl);
          try { window.dispatchEvent(new CustomEvent('st:header-insert:button:icon:apply', { detail: getPickedButtonIconPayload_() })); } catch(e) {}
        } catch(e) {}
      }
    });
  } catch(e) {}
}
function syncButtonModeUI_(sectionEl, mode){
  const safe = ['text','text-icon','icon'].includes(String(mode || '')) ? String(mode) : 'text-icon';
  sectionEl.querySelectorAll('[data-st-hb-button-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-mode')) === safe);
  });
}
function syncButtonPosUI_(sectionEl, pos){
  const safe = ['left','right','none'].includes(String(pos || '')) ? String(pos) : 'left';
  sectionEl.querySelectorAll('[data-st-hb-button-icon-pos]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-icon-pos')) === safe);
  });
}
function syncButtonInputs_(sectionEl){
  const txt = loadButtonText_();
  sectionEl.querySelectorAll('[data-st-hb-button-text]').forEach((el) => {
    try { if (el.value !== txt) el.value = txt; } catch(e) {}
  });
  syncButtonModeUI_(sectionEl, loadButtonMode_());
  syncButtonPosUI_(sectionEl, loadButtonIconPos_());
  syncButtonBehaviorUI_(sectionEl);
  syncButtonAdaptiveUi_(sectionEl);
  syncButtonHoverUi_(sectionEl);
  syncButtonExtrasUi_(sectionEl);
}
function renderButtonPreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-button-previewbox]');
  if (!box) return;
  const mode = loadButtonMode_();
  const pos = loadButtonIconPos_();
  const txt = loadButtonText_();
  const icon = getPickedButtonIconPayload_();
  const visual = getButtonVisualConfig_();
  const hasIcon = mode !== 'text' && (pos !== 'none' || mode === 'icon');
  const showLabel = mode !== 'icon';
  const iconHtml = hasIcon
    ? `<span class="st-hb-button-preview__icon" aria-hidden="true" style="width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;color:inherit;">${icon && icon.svg ? icon.svg : DEFAULT_PHONE_SVG}</span>`
    : '';
  box.innerHTML = `
    <div class="st-hb-button-preview" data-pos="${pos}" data-mode="${mode}" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:10px 16px;border-radius:${visual.radius};background:${visual.background};color:${visual.color};border:${visual.border};min-height:42px;min-width:120px;box-shadow:${visual.shadow};font-weight:700;">
      ${pos === 'right' ? (showLabel ? `<span class="st-hb-button-preview__label">${txt}</span>` : '') + iconHtml : iconHtml + (showLabel ? `<span class="st-hb-button-preview__label">${txt}</span>` : '')}
    </div>`;
  const iconEl = box.querySelector('.st-hb-button-preview__icon');
  if (iconEl && !(icon && icon.svg)) iconEl.style.opacity = '0.92';
  box.querySelectorAll('svg').forEach((svg) => {
    try { svg.setAttribute('width','18'); svg.setAttribute('height','18'); } catch(e) {}
  });
  try { renderButtonAdaptivePreview_(sectionEl); } catch(e) {}
}
function loadButtonLinkMode_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_LINK_MODE_KEY) || 'none');
    if (['none','home','custom','tel','email'].includes(raw)) return raw;
  } catch(e) {}
  return 'none';
}
function saveButtonLinkMode_(value){
  const safe = ['none','home','custom','tel','email'].includes(String(value || '')) ? String(value) : 'none';
  try { localStorage.setItem(BUTTON_LINK_MODE_KEY, safe); } catch(e) {}
}
function loadButtonLinkUrl_(){
  try { return String(localStorage.getItem(BUTTON_LINK_URL_KEY) || ''); } catch(e) {}
  return '';
}
function saveButtonLinkUrl_(value){
  try { localStorage.setItem(BUTTON_LINK_URL_KEY, String(value || '').trim()); } catch(e) {}
}
function loadButtonLinkNewTab_(){
  try { return String(localStorage.getItem(BUTTON_LINK_NEWTAB_KEY) || '0') === '1'; } catch(e) {}
  return false;
}
function saveButtonLinkNewTab_(value){
  try { localStorage.setItem(BUTTON_LINK_NEWTAB_KEY, value ? '1' : '0'); } catch(e) {}
}
function loadButtonClickArea_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_CLICK_AREA_KEY) || 'all');
    if (['all','icon','label'].includes(raw)) return raw;
  } catch(e) {}
  return 'all';
}
function saveButtonClickArea_(value){
  const safe = ['all','icon','label'].includes(String(value || '')) ? String(value) : 'all';
  try { localStorage.setItem(BUTTON_CLICK_AREA_KEY, safe); } catch(e) {}
}
function syncButtonBehaviorUI_(sectionEl){
  const mode = loadButtonLinkMode_();
  const clickArea = loadButtonClickArea_();
  const url = loadButtonLinkUrl_();
  const newTab = loadButtonLinkNewTab_();
  sectionEl.querySelectorAll('[data-st-hb-button-link-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-link-mode')) === mode);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-click-area]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-click-area')) === clickArea);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-link-url]').forEach((el) => {
    try { el.value = url; } catch(e) {}
    try { el.disabled = (mode === 'none' || mode === 'home'); } catch(e) {}
  });
  sectionEl.querySelectorAll('[data-st-hb-button-link-newtab]').forEach((el) => {
    try { el.checked = !!newTab; } catch(e) {}
    try { el.disabled = (mode === 'none' || mode === 'tel' || mode === 'email'); } catch(e) {}
  });
}
function collectButtonLinkDetail_(){
  return {
    mode: loadButtonLinkMode_(),
    href: loadButtonLinkUrl_(),
    newTab: loadButtonLinkNewTab_(),
    clickArea: loadButtonClickArea_(),
  };
}
function loadButtonMobileMode_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_MOBILE_MODE_KEY) || 'inherit');
    if (['inherit','hide','icon-only'].includes(raw)) return raw;
  } catch(e) {}
  return 'inherit';
}
function saveButtonMobileMode_(value){
  const safe = ['inherit','hide','icon-only'].includes(String(value || '')) ? String(value) : 'inherit';
  try { localStorage.setItem(BUTTON_MOBILE_MODE_KEY, safe); } catch(e) {}
}
function loadButtonMobileLabel_(){
  try { return String(localStorage.getItem(BUTTON_MOBILE_LABEL_KEY) || '').slice(0, 80); } catch(e) {}
  return '';
}
function saveButtonMobileLabel_(value){
  try { localStorage.setItem(BUTTON_MOBILE_LABEL_KEY, String(value || '').slice(0, 80)); } catch(e) {}
}
function loadButtonMobileWidth_(){
  try { return clampLogoNum_(localStorage.getItem(BUTTON_MOBILE_WIDTH_KEY), 140, 42, 360); } catch(e) {}
  return 140;
}
function saveButtonMobileWidth_(value){
  try { localStorage.setItem(BUTTON_MOBILE_WIDTH_KEY, String(clampLogoNum_(value, 140, 42, 360))); } catch(e) {}
}
function loadButtonMobileLabelSize_(){
  try { return clampLogoNum_(localStorage.getItem(BUTTON_MOBILE_LABEL_SIZE_KEY), 14, 8, 48); } catch(e) {}
  return 14;
}
function saveButtonMobileLabelSize_(value){
  try { localStorage.setItem(BUTTON_MOBILE_LABEL_SIZE_KEY, String(clampLogoNum_(value, 14, 8, 48))); } catch(e) {}
}
function loadButtonMobileIconSize_(){
  try { return clampLogoNum_(localStorage.getItem(BUTTON_MOBILE_ICON_SIZE_KEY), 18, 12, 64); } catch(e) {}
  return 18;
}
function saveButtonMobileIconSize_(value){
  try { localStorage.setItem(BUTTON_MOBILE_ICON_SIZE_KEY, String(clampLogoNum_(value, 18, 12, 64))); } catch(e) {}
}
function loadButtonMobileGap_(){
  try { return clampLogoNum_(localStorage.getItem(BUTTON_MOBILE_GAP_KEY), 8, 0, 32); } catch(e) {}
  return 8;
}
function saveButtonMobileGap_(value){
  try { localStorage.setItem(BUTTON_MOBILE_GAP_KEY, String(clampLogoNum_(value, 8, 0, 32))); } catch(e) {}
}
function syncButtonAdaptiveUi_(sectionEl){
  const mode = loadButtonMobileMode_();
  const mobileLabel = loadButtonMobileLabel_();
  const width = loadButtonMobileWidth_();
  const labelSize = loadButtonMobileLabelSize_();
  const iconSize = loadButtonMobileIconSize_();
  const gap = loadButtonMobileGap_();
  sectionEl.querySelectorAll('[data-st-hb-button-mobile-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-mobile-mode')) === mode);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-mobile-label]').forEach((el) => {
    try { el.value = mobileLabel; } catch(e) {}
  });
  [
    ['[data-st-hb-button-mobile-width]', width],
    ['[data-st-hb-button-mobile-width-num]', width],
    ['[data-st-hb-button-mobile-label-size]', labelSize],
    ['[data-st-hb-button-mobile-label-size-num]', labelSize],
    ['[data-st-hb-button-mobile-icon-size]', iconSize],
    ['[data-st-hb-button-mobile-icon-size-num]', iconSize],
    ['[data-st-hb-button-mobile-gap]', gap],
    ['[data-st-hb-button-mobile-gap-num]', gap],
  ].forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => {
      try { el.value = String(value); } catch(e) {}
    });
  });
  const outMap = {
    '[data-st-hb-button-mobile-width-out]': width + ' px',
    '[data-st-hb-button-mobile-label-size-out]': labelSize + ' px',
    '[data-st-hb-button-mobile-icon-size-out]': iconSize + ' px',
    '[data-st-hb-button-mobile-gap-out]': gap + ' px',
  };
  Object.entries(outMap).forEach(([sel, value]) => {
    const el = sectionEl.querySelector(sel);
    if (el) el.textContent = value;
  });
  renderButtonAdaptivePreview_(sectionEl);
}
function collectButtonAdaptiveDetail_(){
  return {
    mode: loadButtonMobileMode_(),
    mobileLabel: loadButtonMobileLabel_(),
    width: loadButtonMobileWidth_(),
    labelSize: loadButtonMobileLabelSize_(),
    iconSize: loadButtonMobileIconSize_(),
    gap: loadButtonMobileGap_(),
  };
}

function loadButtonHoverTarget_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_HOVER_TARGET_KEY) || 'block');
    if (['block','label','icon'].includes(raw)) return raw;
  } catch(e) {}
  return 'block';
}
function saveButtonHoverTarget_(value){
  const safe = ['block','label','icon'].includes(String(value || '')) ? String(value) : 'block';
  try { localStorage.setItem(BUTTON_HOVER_TARGET_KEY, safe); } catch(e) {}
}
function getButtonHoverMetricKey_(target, metric){
  const safeTarget = ['block','label','icon'].includes(String(target || '')) ? String(target) : 'block';
  const safeMetric = ['opacity','scale','offsetY'].includes(String(metric || '')) ? String(metric) : 'opacity';
  return `${BUTTON_HOVER_METRIC_PREFIX}:${safeTarget}:${safeMetric}`;
}
function clampButtonHoverMetric_(metric, value){
  if (metric === 'opacity') return clampLogoNum_(value, 100, 20, 100);
  if (metric === 'scale') return clampLogoNum_(value, 100, 80, 130);
  return clampLogoNum_(value, 0, -30, 30);
}
function loadButtonHoverMetric_(target, metric){
  try { return clampButtonHoverMetric_(metric, localStorage.getItem(getButtonHoverMetricKey_(target, metric))); } catch(e) {}
  return clampButtonHoverMetric_(metric, null);
}
function saveButtonHoverMetric_(target, metric, value){
  try { localStorage.setItem(getButtonHoverMetricKey_(target, metric), String(clampButtonHoverMetric_(metric, value))); } catch(e) {}
}
function getButtonHoverState_(){
  const target = loadButtonHoverTarget_();
  return {
    target,
    opacity: loadButtonHoverMetric_(target, 'opacity'),
    scale: loadButtonHoverMetric_(target, 'scale'),
    offsetY: loadButtonHoverMetric_(target, 'offsetY'),
  };
}
function syncButtonHoverUi_(sectionEl){
  const state = getButtonHoverState_();
  const labels = { block:'Вся кнопка', label:'Текст', icon:'Іконка' };
  sectionEl.querySelectorAll('[data-st-hb-button-hover-target]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-hover-target')) === state.target);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-hover-target-label]').forEach((el) => {
    el.textContent = labels[state.target] || 'Вся кнопка';
  });
  const pairs = [
    ['[data-st-hb-button-hover-opacity]', state.opacity],
    ['[data-st-hb-button-hover-opacity-num]', state.opacity],
    ['[data-st-hb-button-hover-scale]', state.scale],
    ['[data-st-hb-button-hover-scale-num]', state.scale],
    ['[data-st-hb-button-hover-offset-y]', state.offsetY],
    ['[data-st-hb-button-hover-offset-y-num]', state.offsetY],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => { try { el.value = String(value); } catch(e) {} });
  });
  const opacityOut = sectionEl.querySelector('[data-st-hb-button-hover-opacity-out]');
  const scaleOut = sectionEl.querySelector('[data-st-hb-button-hover-scale-out]');
  const offsetYOut = sectionEl.querySelector('[data-st-hb-button-hover-offset-y-out]');
  if (opacityOut) opacityOut.textContent = state.opacity + '%';
  if (scaleOut) scaleOut.textContent = state.scale + '%';
  if (offsetYOut) offsetYOut.textContent = state.offsetY + ' px';
}
function collectButtonHoverDetail_(){
  const targets = ['block','label','icon'];
  const metrics = {};
  targets.forEach((target) => {
    metrics[target] = {
      opacity: loadButtonHoverMetric_(target, 'opacity'),
      scale: loadButtonHoverMetric_(target, 'scale'),
      offsetY: loadButtonHoverMetric_(target, 'offsetY'),
    };
  });
  return { target: loadButtonHoverTarget_(), metrics };
}
function applyButtonHoverInputChange_(sectionEl, metric, value){
  const target = loadButtonHoverTarget_();
  saveButtonHoverMetric_(target, metric, value);
  syncButtonHoverUi_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:button:hover:apply', { detail: collectButtonHoverDetail_() })); } catch (e) {}
}
function renderButtonAdaptivePreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-button-mobile-previewbox]');
  if (!box) return;
  const mode = loadButtonMode_();
  const pos = loadButtonIconPos_();
  const mobileMode = loadButtonMobileMode_();
  const mobileLabelRaw = loadButtonMobileLabel_();
  const label = (mobileLabelRaw || loadButtonText_() || 'Кнопка').trim() || 'Кнопка';
  const width = loadButtonMobileWidth_();
  const labelSize = loadButtonMobileLabelSize_();
  const iconSize = loadButtonMobileIconSize_();
  const gap = loadButtonMobileGap_();
  const icon = getPickedButtonIconPayload_();
  const visual = getButtonVisualConfig_();
  const iconHtml = `<span class="st-hb-button-preview__icon" aria-hidden="true" style="width:${iconSize}px;height:${iconSize}px;display:inline-flex;align-items:center;justify-content:center;color:inherit;">${icon && icon.svg ? icon.svg : DEFAULT_PHONE_SVG}</span>`;
  const showIcon = mode !== 'text' && pos !== 'none';
  const showLabel = mobileMode !== 'icon-only' && mode !== 'icon';
  if (mobileMode === 'hide') {
    box.innerHTML = `<div class="st-hb-subacc__previewph">На mobile кнопка буде прихована</div>`;
    return;
  }
  box.innerHTML = `
    <div class="st-hb-button-preview" data-pos="${pos}" data-mode="${mode}" style="display:inline-flex;align-items:center;justify-content:center;gap:${gap}px;padding:10px 14px;border-radius:${visual.radius};background:${visual.background};color:${visual.color};border:${visual.border};min-height:40px;min-width:${width}px;box-shadow:${visual.shadow};font-weight:700;">
      ${pos === 'right'
        ? `${showLabel ? `<span class="st-hb-button-preview__label" style="font-size:${labelSize}px;line-height:1.1;">${label}</span>` : ''}${showIcon ? iconHtml : ''}`
        : `${showIcon ? iconHtml : ''}${showLabel ? `<span class="st-hb-button-preview__label" style="font-size:${labelSize}px;line-height:1.1;">${label}</span>` : ''}`}
    </div>`;
  box.querySelectorAll('svg').forEach((svg) => {
    try { svg.setAttribute('width', String(iconSize)); svg.setAttribute('height', String(iconSize)); } catch(e) {}
  });
}
function collectButtonDetail_(){
  return {
    text: loadButtonText_(),
    mode: loadButtonMode_(),
    iconPosition: loadButtonIconPos_(),
    icon: getPickedButtonIconPayload_(),
    link: collectButtonLinkDetail_(),
    adaptive: collectButtonAdaptiveDetail_(),
    hover: collectButtonHoverDetail_(),
    extras: collectButtonExtrasDetail_(),
  };
}


function hexToRgbaPreview_(hex, opacity){
  const safe = String(hex || '').trim();
  const m = safe.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return `rgba(37,99,235,${Number(opacity) || 0})`;
  const n = m[1];
  const r = parseInt(n.slice(0,2), 16);
  const g = parseInt(n.slice(2,4), 16);
  const b = parseInt(n.slice(4,6), 16);
  const a = Math.min(1, Math.max(0, Number(opacity) || 0));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function loadButtonExtraPreset_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_EXTRA_PRESET_KEY) || 'primary');
    if (['primary','secondary','outline','ghost','cta'].includes(raw)) return raw;
  } catch(e) {}
  return 'primary';
}
function saveButtonExtraPreset_(value){
  const safe = ['primary','secondary','outline','ghost','cta'].includes(String(value || '')) ? String(value) : 'primary';
  try { localStorage.setItem(BUTTON_EXTRA_PRESET_KEY, safe); } catch(e) {}
}
function loadButtonShape_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_SHAPE_KEY) || 'rounded');
    if (['square','rounded','pill'].includes(raw)) return raw;
  } catch(e) {}
  return 'rounded';
}
function saveButtonShape_(value){
  const safe = ['square','rounded','pill'].includes(String(value || '')) ? String(value) : 'rounded';
  try { localStorage.setItem(BUTTON_SHAPE_KEY, safe); } catch(e) {}
}
function loadButtonFillMode_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_FILL_MODE_KEY) || 'solid');
    if (['solid','gradient'].includes(raw)) return raw;
  } catch(e) {}
  return 'solid';
}
function saveButtonFillMode_(value){
  const safe = ['solid','gradient'].includes(String(value || '')) ? String(value) : 'solid';
  try { localStorage.setItem(BUTTON_FILL_MODE_KEY, safe); } catch(e) {}
}
function loadButtonColor1_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_COLOR1_KEY) || '#2563eb').trim();
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  } catch(e) {}
  return '#2563eb';
}
function saveButtonColor1_(value){
  const raw = String(value || '').trim();
  const safe = /^#[0-9a-f]{6}$/i.test(raw) ? raw : '#2563eb';
  try { localStorage.setItem(BUTTON_COLOR1_KEY, safe); } catch(e) {}
}
function loadButtonColor2_(){
  try {
    const raw = String(localStorage.getItem(BUTTON_COLOR2_KEY) || '#60a5fa').trim();
    if (/^#[0-9a-f]{6}$/i.test(raw)) return raw;
  } catch(e) {}
  return '#60a5fa';
}
function saveButtonColor2_(value){
  const raw = String(value || '').trim();
  const safe = /^#[0-9a-f]{6}$/i.test(raw) ? raw : '#60a5fa';
  try { localStorage.setItem(BUTTON_COLOR2_KEY, safe); } catch(e) {}
}
function loadButtonGradientAngle_(){
  try { return clampLogoNum_(localStorage.getItem(BUTTON_GRADIENT_ANGLE_KEY), 135, 0, 360); } catch(e) {}
  return 135;
}
function saveButtonGradientAngle_(value){
  try { localStorage.setItem(BUTTON_GRADIENT_ANGLE_KEY, String(clampLogoNum_(value, 135, 0, 360))); } catch(e) {}
}
function applyButtonExtraPreset_(preset){
  const safe = ['primary','secondary','outline','ghost','cta'].includes(String(preset || '')) ? String(preset) : 'primary';
  saveButtonExtraPreset_(safe);
  const map = {
    primary:   { shape:'rounded', fill:'solid',    c1:'#2563eb', c2:'#60a5fa', angle:135 },
    secondary: { shape:'rounded', fill:'solid',    c1:'#0f172a', c2:'#334155', angle:135 },
    outline:   { shape:'rounded', fill:'solid',    c1:'#2563eb', c2:'#60a5fa', angle:135 },
    ghost:     { shape:'rounded', fill:'solid',    c1:'#1d4ed8', c2:'#60a5fa', angle:135 },
    cta:       { shape:'pill',    fill:'gradient', c1:'#2563eb', c2:'#7c3aed', angle:135 },
  };
  const cfg = map[safe] || map.primary;
  saveButtonShape_(cfg.shape);
  saveButtonFillMode_(cfg.fill);
  saveButtonColor1_(cfg.c1);
  saveButtonColor2_(cfg.c2);
  saveButtonGradientAngle_(cfg.angle);
}
function getButtonVisualConfig_(){
  const preset = loadButtonExtraPreset_();
  const shape = loadButtonShape_();
  const fillMode = loadButtonFillMode_();
  const color1 = loadButtonColor1_();
  const color2 = loadButtonColor2_();
  const angle = loadButtonGradientAngle_();
  const radiusMap = { square:'12px', rounded:'16px', pill:'999px' };
  const radius = radiusMap[shape] || radiusMap.rounded;
  let background = color1;
  let color = '#ffffff';
  let border = '1px solid transparent';
  let shadow = `0 14px 28px ${hexToRgbaPreview_(color1, .22)}`;
  if (preset === 'outline') {
    background = 'transparent';
    color = color1;
    border = `1px solid ${color1}`;
    shadow = 'none';
  } else if (preset === 'ghost') {
    background = hexToRgbaPreview_(color1, .12);
    color = color1;
    border = `1px solid ${hexToRgbaPreview_(color1, .18)}`;
    shadow = 'none';
  } else {
    background = (fillMode === 'gradient') ? `linear-gradient(${angle}deg, ${color1}, ${color2})` : color1;
    color = '#ffffff';
    border = '1px solid transparent';
    shadow = preset === 'cta'
      ? `0 18px 34px ${hexToRgbaPreview_(color1, .30)}`
      : preset === 'secondary'
        ? `0 14px 28px ${hexToRgbaPreview_(color1, .24)}`
        : `0 14px 28px ${hexToRgbaPreview_(color1, .22)}`;
  }
  return { preset, shape, fillMode, color1, color2, angle, radius, background, color, border, shadow };
}
function syncButtonExtrasUi_(sectionEl){
  const state = getButtonVisualConfig_();
  sectionEl.querySelectorAll('[data-st-hb-button-extra-preset]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-extra-preset')) === state.preset);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-shape]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-shape')) === state.shape);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-fill-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-button-fill-mode')) === state.fillMode);
  });
  sectionEl.querySelectorAll('[data-st-hb-button-color1]').forEach((el) => { try { el.value = state.color1; } catch(e) {} });
  sectionEl.querySelectorAll('[data-st-hb-button-color2]').forEach((el) => { try { el.value = state.color2; } catch(e) {} });
  [['[data-st-hb-button-gradient-angle]', state.angle], ['[data-st-hb-button-gradient-angle-num]', state.angle]].forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => { try { el.value = String(value); } catch(e) {} });
  });
  sectionEl.querySelectorAll('[data-st-hb-button-gradient-angle-out]').forEach((el) => { el.textContent = state.angle + '°'; });
  sectionEl.querySelectorAll('[data-st-hb-button-color2], [data-st-hb-button-gradient-angle], [data-st-hb-button-gradient-angle-num]').forEach((el) => {
    try { el.disabled = state.fillMode !== 'gradient'; } catch(e) {}
  });
}
function collectButtonExtrasDetail_(){
  return {
    preset: loadButtonExtraPreset_(),
    shape: loadButtonShape_(),
    fillMode: loadButtonFillMode_(),
    color1: loadButtonColor1_(),
    color2: loadButtonColor2_(),
    angle: loadButtonGradientAngle_(),
  };
}
function applyButtonExtrasInputChange_(sectionEl){
  syncButtonExtrasUi_(sectionEl);
  renderButtonPreview_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:button:extras:apply', { detail: collectButtonExtrasDetail_() })); } catch (e) {}
}

function loadLogoMode_(){
  try {
    const raw = localStorage.getItem(LOGO_MODE_KEY) || 'logo-text';
    if (['logo','logo-text','logo-text-subtitle','text-only'].includes(raw)) return raw;
  } catch(e) {}
  return 'logo-text';
}

function saveLogoMode_(mode){
  const safe = ['logo','logo-text','logo-text-subtitle','text-only'].includes(mode) ? mode : 'logo-text';
  try { localStorage.setItem(LOGO_MODE_KEY, safe); } catch(e) {}
}

function loadLogoSource_(){
  try {
    const raw = localStorage.getItem(LOGO_SOURCE_KEY) || 'image';
    if (raw === 'image' || raw === 'icon') return raw;
  } catch(e) {}
  return 'image';
}

function saveLogoSource_(source){
  const safe = source === 'icon' ? 'icon' : 'image';
  try { localStorage.setItem(LOGO_SOURCE_KEY, safe); } catch(e) {}
}

function loadLogoPos_(){
  try {
    const raw = localStorage.getItem(LOGO_POS_KEY) || 'left';
    if (['left','right','top','bottom','none'].includes(raw)) return raw;
  } catch(e) {}
  return 'left';
}

function saveLogoPos_(pos){
  const safe = ['left','right','top','bottom','none'].includes(pos) ? pos : 'left';
  try { localStorage.setItem(LOGO_POS_KEY, safe); } catch(e) {}
}

function syncLogoModeUI_(sectionEl, mode){
  const safe = ['logo','logo-text','logo-text-subtitle','text-only'].includes(mode) ? mode : 'logo-text';
  sectionEl.querySelectorAll('[data-st-hb-logo-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-mode')) === safe);
  });
}

function syncLogoSourceUI_(sectionEl, source){
  const safe = source === 'icon' ? 'icon' : 'image';
  sectionEl.querySelectorAll('[data-st-hb-logo-source]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-source')) === safe);
  });
}

function syncLogoPosUI_(sectionEl, pos){
  const safe = ['left','right','top','bottom','none'].includes(pos) ? pos : 'left';
  sectionEl.querySelectorAll('[data-st-hb-logo-pos]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-pos')) === safe);
  });
}


function clampLogoNum_(value, fallback, min, max){
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Math.round(num)));
}

function loadLogoMarkWidth_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_MARK_WIDTH_KEY), 96, 20, 320); } catch(e) {}
  return 96;
}

function saveLogoMarkWidth_(value){
  try { localStorage.setItem(LOGO_MARK_WIDTH_KEY, String(clampLogoNum_(value, 96, 20, 320))); } catch(e) {}
}

function loadLogoMarkHeight_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_MARK_HEIGHT_KEY), 44, 20, 220); } catch(e) {}
  return 44;
}

function saveLogoMarkHeight_(value){
  try { localStorage.setItem(LOGO_MARK_HEIGHT_KEY, String(clampLogoNum_(value, 44, 20, 220))); } catch(e) {}
}

function loadLogoGap_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_GAP_KEY), 12, 0, 48); } catch(e) {}
  return 12;
}

function saveLogoGap_(value){
  try { localStorage.setItem(LOGO_GAP_KEY, String(clampLogoNum_(value, 12, 0, 48))); } catch(e) {}
}

function loadLogoFit_(){
  try {
    const raw = String(localStorage.getItem(LOGO_FIT_KEY) || 'contain');
    if (['contain','cover','fill'].includes(raw)) return raw;
  } catch(e) {}
  return 'contain';
}

function saveLogoFit_(value){
  const safe = ['contain','cover','fill'].includes(String(value || '')) ? String(value) : 'contain';
  try { localStorage.setItem(LOGO_FIT_KEY, safe); } catch(e) {}
}

function loadLogoAlign_(){
  try {
    const raw = String(localStorage.getItem(LOGO_ALIGN_KEY) || 'center');
    if (['start','center','end'].includes(raw)) return raw;
  } catch(e) {}
  return 'center';
}

function saveLogoAlign_(value){
  const safe = ['start','center','end'].includes(String(value || '')) ? String(value) : 'center';
  try { localStorage.setItem(LOGO_ALIGN_KEY, safe); } catch(e) {}
}

function syncLogoFitUI_(sectionEl, fit){
  const safe = ['contain','cover','fill'].includes(String(fit || '')) ? String(fit) : 'contain';
  sectionEl.querySelectorAll('[data-st-hb-logo-fit]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-fit')) === safe);
  });
}

function syncLogoAlignUI_(sectionEl, align){
  const safe = ['start','center','end'].includes(String(align || '')) ? String(align) : 'center';
  sectionEl.querySelectorAll('[data-st-hb-logo-align]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-align')) === safe);
  });
}

function syncLogoMetricInputs_(sectionEl){
  const width = loadLogoMarkWidth_();
  const height = loadLogoMarkHeight_();
  const gap = loadLogoGap_();
  const pairs = [
    ['[data-st-hb-logo-mark-width]', width],
    ['[data-st-hb-logo-mark-width-num]', width],
    ['[data-st-hb-logo-mark-height]', height],
    ['[data-st-hb-logo-mark-height-num]', height],
    ['[data-st-hb-logo-gap]', gap],
    ['[data-st-hb-logo-gap-num]', gap],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => {
      try { el.value = String(value); } catch(e) {}
    });
  });
  const widthOut = sectionEl.querySelector('[data-st-hb-logo-mark-width-out]');
  const heightOut = sectionEl.querySelector('[data-st-hb-logo-mark-height-out]');
  const gapOut = sectionEl.querySelector('[data-st-hb-logo-gap-out]');
  if (widthOut) widthOut.textContent = width + ' px';
  if (heightOut) heightOut.textContent = height + ' px';
  if (gapOut) gapOut.textContent = gap + ' px';
}

function loadLogoTextTarget_(){
  try {
    const raw = String(localStorage.getItem(LOGO_TEXT_TARGET_KEY) || 'title');
    if (raw === 'title' || raw === 'subtitle') return raw;
  } catch(e) {}
  return 'title';
}

function saveLogoTextTarget_(value){
  const safe = String(value || '') === 'subtitle' ? 'subtitle' : 'title';
  try { localStorage.setItem(LOGO_TEXT_TARGET_KEY, safe); } catch(e) {}
}

function syncLogoTextTargetUI_(sectionEl, target){
  const safe = String(target || '') === 'subtitle' ? 'subtitle' : 'title';
  sectionEl.querySelectorAll('[data-st-hb-logo-text-target]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-text-target')) === safe);
  });
  sectionEl.querySelectorAll('[data-st-hb-logo-text-target-label]').forEach((el) => {
    el.textContent = safe === 'subtitle' ? 'Підзаголовок' : 'Бренд';
  });
}

function loadLogoTitleSize_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_TITLE_SIZE_KEY), 24, 8, 120); } catch(e) {}
  return 24;
}
function saveLogoTitleSize_(value){
  try { localStorage.setItem(LOGO_TITLE_SIZE_KEY, String(clampLogoNum_(value, 24, 8, 120))); } catch(e) {}
}
function loadLogoSubtitleSize_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_SUBTITLE_SIZE_KEY), 12, 8, 72); } catch(e) {}
  return 12;
}
function saveLogoSubtitleSize_(value){
  try { localStorage.setItem(LOGO_SUBTITLE_SIZE_KEY, String(clampLogoNum_(value, 12, 8, 72))); } catch(e) {}
}
function loadLogoTitleOffsetX_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_TITLE_OFFSET_X_KEY), 0, -60, 120); } catch(e) {}
  return 0;
}
function saveLogoTitleOffsetX_(value){
  try { localStorage.setItem(LOGO_TITLE_OFFSET_X_KEY, String(clampLogoNum_(value, 0, -60, 120))); } catch(e) {}
}
function loadLogoTitleOffsetY_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_TITLE_OFFSET_Y_KEY), 0, -60, 120); } catch(e) {}
  return 0;
}
function saveLogoTitleOffsetY_(value){
  try { localStorage.setItem(LOGO_TITLE_OFFSET_Y_KEY, String(clampLogoNum_(value, 0, -60, 120))); } catch(e) {}
}
function loadLogoSubtitleOffsetX_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_SUBTITLE_OFFSET_X_KEY), 0, -60, 120); } catch(e) {}
  return 0;
}
function saveLogoSubtitleOffsetX_(value){
  try { localStorage.setItem(LOGO_SUBTITLE_OFFSET_X_KEY, String(clampLogoNum_(value, 0, -60, 120))); } catch(e) {}
}
function loadLogoSubtitleOffsetY_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_SUBTITLE_OFFSET_Y_KEY), 0, -60, 120); } catch(e) {}
  return 0;
}
function saveLogoSubtitleOffsetY_(value){
  try { localStorage.setItem(LOGO_SUBTITLE_OFFSET_Y_KEY, String(clampLogoNum_(value, 0, -60, 120))); } catch(e) {}
}


function loadLogoHoverTarget_(){
  try {
    const raw = String(localStorage.getItem(LOGO_HOVER_TARGET_KEY) || 'block');
    if (['block','mark','title','subtitle'].includes(raw)) return raw;
  } catch(e) {}
  return 'block';
}
function saveLogoHoverTarget_(value){
  const safe = ['block','mark','title','subtitle'].includes(String(value || '')) ? String(value) : 'block';
  try { localStorage.setItem(LOGO_HOVER_TARGET_KEY, safe); } catch(e) {}
}
function getLogoHoverMetricKey_(target, metric){
  return `${LOGO_HOVER_METRIC_PREFIX}_${target}_${metric}`;
}
function clampLogoHoverMetric_(metric, value){
  if (metric === 'opacity') return clampLogoNum_(value, 100, 20, 100);
  if (metric === 'scale') return clampLogoNum_(value, 100, 80, 130);
  return clampLogoNum_(value, 0, -30, 30);
}
function loadLogoHoverMetric_(target, metric){
  try { return clampLogoHoverMetric_(metric, localStorage.getItem(getLogoHoverMetricKey_(target, metric))); } catch(e) {}
  return clampLogoHoverMetric_(metric, null);
}
function saveLogoHoverMetric_(target, metric, value){
  try { localStorage.setItem(getLogoHoverMetricKey_(target, metric), String(clampLogoHoverMetric_(metric, value))); } catch(e) {}
}
function getLogoHoverState_(){
  const target = loadLogoHoverTarget_();
  return {
    target,
    opacity: loadLogoHoverMetric_(target, 'opacity'),
    scale: loadLogoHoverMetric_(target, 'scale'),
    offsetY: loadLogoHoverMetric_(target, 'offsetY'),
  };
}
function syncLogoHoverUi_(sectionEl){
  const state = getLogoHoverState_();
  const labels = { block:'Весь блок', mark:'Знак', title:'Бренд', subtitle:'Підзаголовок' };
  sectionEl.querySelectorAll('[data-st-hb-logo-hover-target]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-hover-target')) === state.target);
  });
  sectionEl.querySelectorAll('[data-st-hb-logo-hover-target-label]').forEach((el) => {
    el.textContent = labels[state.target] || 'Весь блок';
  });
  const pairs = [
    ['[data-st-hb-logo-hover-opacity]', state.opacity],
    ['[data-st-hb-logo-hover-opacity-num]', state.opacity],
    ['[data-st-hb-logo-hover-scale]', state.scale],
    ['[data-st-hb-logo-hover-scale-num]', state.scale],
    ['[data-st-hb-logo-hover-offset-y]', state.offsetY],
    ['[data-st-hb-logo-hover-offset-y-num]', state.offsetY],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => { try { el.value = String(value); } catch(e) {} });
  });
  const opacityOut = sectionEl.querySelector('[data-st-hb-logo-hover-opacity-out]');
  const scaleOut = sectionEl.querySelector('[data-st-hb-logo-hover-scale-out]');
  const offsetYOut = sectionEl.querySelector('[data-st-hb-logo-hover-offset-y-out]');
  if (opacityOut) opacityOut.textContent = state.opacity + '%';
  if (scaleOut) scaleOut.textContent = state.scale + '%';
  if (offsetYOut) offsetYOut.textContent = state.offsetY + ' px';
}
function collectLogoHoverDetail_(){
  const targets = ['block','mark','title','subtitle'];
  const metrics = {};
  targets.forEach((target) => {
    metrics[target] = {
      opacity: loadLogoHoverMetric_(target, 'opacity'),
      scale: loadLogoHoverMetric_(target, 'scale'),
      offsetY: loadLogoHoverMetric_(target, 'offsetY'),
    };
  });
  return { target: loadLogoHoverTarget_(), metrics };
}
function applyLogoHoverInputChange_(sectionEl, metric, value){
  const target = loadLogoHoverTarget_();
  saveLogoHoverMetric_(target, metric, value);
  syncLogoHoverUi_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:hover:apply', { detail: collectLogoHoverDetail_() })); } catch (e) {}
}

function loadLogoLinkMode_(){
  try {
    const raw = String(localStorage.getItem(LOGO_LINK_MODE_KEY) || 'home');
    if (['home','custom','none'].includes(raw)) return raw;
  } catch(e) {}
  return 'home';
}
function saveLogoLinkMode_(value){
  const safe = ['home','custom','none'].includes(String(value || '')) ? String(value) : 'home';
  try { localStorage.setItem(LOGO_LINK_MODE_KEY, safe); } catch(e) {}
}
function loadLogoLinkUrl_(){
  try { return String(localStorage.getItem(LOGO_LINK_URL_KEY) || ''); } catch(e) {}
  return '';
}
function saveLogoLinkUrl_(value){
  try { localStorage.setItem(LOGO_LINK_URL_KEY, String(value || '')); } catch(e) {}
}
function loadLogoLinkNewTab_(){
  try { return String(localStorage.getItem(LOGO_LINK_NEWTAB_KEY) || '0') === '1'; } catch(e) {}
  return false;
}
function saveLogoLinkNewTab_(value){
  try { localStorage.setItem(LOGO_LINK_NEWTAB_KEY, value ? '1' : '0'); } catch(e) {}
}
function loadLogoClickArea_(){
  try {
    const raw = String(localStorage.getItem(LOGO_CLICK_AREA_KEY) || 'all');
    if (['all','mark','title'].includes(raw)) return raw;
  } catch(e) {}
  return 'all';
}
function saveLogoClickArea_(value){
  const safe = ['all','mark','title'].includes(String(value || '')) ? String(value) : 'all';
  try { localStorage.setItem(LOGO_CLICK_AREA_KEY, safe); } catch(e) {}
}
function syncLogoLinkUi_(sectionEl){
  const mode = loadLogoLinkMode_();
  const clickArea = loadLogoClickArea_();
  const url = loadLogoLinkUrl_();
  const newTab = loadLogoLinkNewTab_();
  sectionEl.querySelectorAll('[data-st-hb-logo-link-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-link-mode')) === mode);
  });
  sectionEl.querySelectorAll('[data-st-hb-logo-click-area]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-click-area')) === clickArea);
  });
  sectionEl.querySelectorAll('[data-st-hb-logo-link-url]').forEach((el) => {
    try { el.value = url; } catch(e) {}
    try { el.disabled = (mode !== 'custom'); } catch(e) {}
  });
  sectionEl.querySelectorAll('[data-st-hb-logo-link-newtab]').forEach((el) => {
    try { el.checked = !!newTab; } catch(e) {}
    try { el.disabled = (mode === 'none'); } catch(e) {}
  });
}
function collectLogoLinkDetail_(){
  return {
    mode: loadLogoLinkMode_(),
    href: loadLogoLinkUrl_(),
    newTab: loadLogoLinkNewTab_(),
    clickArea: loadLogoClickArea_(),
  };
}

function loadLogoMobileMode_(){
  try {
    const raw = String(localStorage.getItem(LOGO_MOBILE_MODE_KEY) || 'inherit');
    if (['inherit','hide-subtitle','icon-only'].includes(raw)) return raw;
  } catch(e) {}
  return 'inherit';
}
function saveLogoMobileMode_(value){
  const safe = ['inherit','hide-subtitle','icon-only'].includes(String(value || '')) ? String(value) : 'inherit';
  try { localStorage.setItem(LOGO_MOBILE_MODE_KEY, safe); } catch(e) {}
}
function loadLogoMobileMarkWidth_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_MOBILE_MARK_WIDTH_KEY), 72, 20, 220); } catch(e) {}
  return 72;
}
function saveLogoMobileMarkWidth_(value){
  try { localStorage.setItem(LOGO_MOBILE_MARK_WIDTH_KEY, String(clampLogoNum_(value, 72, 20, 220))); } catch(e) {}
}
function loadLogoMobileTitleSize_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_MOBILE_TITLE_SIZE_KEY), 18, 8, 80); } catch(e) {}
  return 18;
}
function saveLogoMobileTitleSize_(value){
  try { localStorage.setItem(LOGO_MOBILE_TITLE_SIZE_KEY, String(clampLogoNum_(value, 18, 8, 80))); } catch(e) {}
}
function loadLogoMobileSubtitleSize_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_MOBILE_SUBTITLE_SIZE_KEY), 11, 8, 48); } catch(e) {}
  return 11;
}
function saveLogoMobileSubtitleSize_(value){
  try { localStorage.setItem(LOGO_MOBILE_SUBTITLE_SIZE_KEY, String(clampLogoNum_(value, 11, 8, 48))); } catch(e) {}
}
function loadLogoMobileGap_(){
  try { return clampLogoNum_(localStorage.getItem(LOGO_MOBILE_GAP_KEY), 10, 0, 40); } catch(e) {}
  return 10;
}
function saveLogoMobileGap_(value){
  try { localStorage.setItem(LOGO_MOBILE_GAP_KEY, String(clampLogoNum_(value, 10, 0, 40))); } catch(e) {}
}
function syncLogoAdaptiveUi_(sectionEl){
  const mode = loadLogoMobileMode_();
  sectionEl.querySelectorAll('[data-st-hb-logo-mobile-mode]').forEach((el) => {
    el.classList.toggle('is-active', String(el.getAttribute('data-st-hb-logo-mobile-mode')) === mode);
  });
  const pairs = [
    ['[data-st-hb-logo-mobile-mark-width]', loadLogoMobileMarkWidth_()],
    ['[data-st-hb-logo-mobile-mark-width-num]', loadLogoMobileMarkWidth_()],
    ['[data-st-hb-logo-mobile-title-size]', loadLogoMobileTitleSize_()],
    ['[data-st-hb-logo-mobile-title-size-num]', loadLogoMobileTitleSize_()],
    ['[data-st-hb-logo-mobile-subtitle-size]', loadLogoMobileSubtitleSize_()],
    ['[data-st-hb-logo-mobile-subtitle-size-num]', loadLogoMobileSubtitleSize_()],
    ['[data-st-hb-logo-mobile-gap]', loadLogoMobileGap_()],
    ['[data-st-hb-logo-mobile-gap-num]', loadLogoMobileGap_()],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => {
      try { el.value = String(value); } catch(e) {}
    });
  });
  const outMap = {
    '[data-st-hb-logo-mobile-mark-width-out]': loadLogoMobileMarkWidth_() + ' px',
    '[data-st-hb-logo-mobile-title-size-out]': loadLogoMobileTitleSize_() + ' px',
    '[data-st-hb-logo-mobile-subtitle-size-out]': loadLogoMobileSubtitleSize_() + ' px',
    '[data-st-hb-logo-mobile-gap-out]': loadLogoMobileGap_() + ' px',
  };
  Object.entries(outMap).forEach(([sel, value]) => {
    const el = sectionEl.querySelector(sel);
    if (el) el.textContent = value;
  });
}
function collectLogoAdaptiveDetail_(){
  return {
    mode: loadLogoMobileMode_(),
    markWidth: loadLogoMobileMarkWidth_(),
    titleSize: loadLogoMobileTitleSize_(),
    subtitleSize: loadLogoMobileSubtitleSize_(),
    gap: loadLogoMobileGap_(),
  };
}

function getLogoTextMetricState_(){
  const target = loadLogoTextTarget_();
  return target === 'subtitle'
    ? { target, size: loadLogoSubtitleSize_(), offsetX: loadLogoSubtitleOffsetX_(), offsetY: loadLogoSubtitleOffsetY_() }
    : { target, size: loadLogoTitleSize_(), offsetX: loadLogoTitleOffsetX_(), offsetY: loadLogoTitleOffsetY_() };
}

function syncLogoTextMetricInputs_(sectionEl){
  const state = getLogoTextMetricState_();
  syncLogoTextTargetUI_(sectionEl, state.target);
  const pairs = [
    ['[data-st-hb-logo-text-size]', state.size],
    ['[data-st-hb-logo-text-size-num]', state.size],
    ['[data-st-hb-logo-text-offset-x]', state.offsetX],
    ['[data-st-hb-logo-text-offset-x-num]', state.offsetX],
    ['[data-st-hb-logo-text-offset-y]', state.offsetY],
    ['[data-st-hb-logo-text-offset-y-num]', state.offsetY],
  ];
  pairs.forEach(([sel, value]) => {
    sectionEl.querySelectorAll(sel).forEach((el) => {
      try { el.value = String(value); } catch(e) {}
    });
  });
  const sizeOut = sectionEl.querySelector('[data-st-hb-logo-text-size-out]');
  const offXOut = sectionEl.querySelector('[data-st-hb-logo-text-offset-x-out]');
  const offYOut = sectionEl.querySelector('[data-st-hb-logo-text-offset-y-out]');
  if (sizeOut) sizeOut.textContent = state.size + ' px';
  if (offXOut) offXOut.textContent = state.offsetX + ' px';
  if (offYOut) offYOut.textContent = state.offsetY + ' px';
}

function collectLogoLayoutDetail_(){
  return {
    markWidth: loadLogoMarkWidth_(),
    markHeight: loadLogoMarkHeight_(),
    gap: loadLogoGap_(),
    fit: loadLogoFit_(),
    align: loadLogoAlign_(),
    titleSize: loadLogoTitleSize_(),
    subtitleSize: loadLogoSubtitleSize_(),
    titleOffsetX: loadLogoTitleOffsetX_(),
    titleOffsetY: loadLogoTitleOffsetY_(),
    subtitleOffsetX: loadLogoSubtitleOffsetX_(),
    subtitleOffsetY: loadLogoSubtitleOffsetY_(),
  };
}

function applyLogoPreset_(sectionEl, preset){
  const safe = String(preset || 'medium');
  let width = 96;
  let height = 44;
  let gap = 12;
  if (safe === 'compact') {
    width = 72; height = 36; gap = 10;
  } else if (safe === 'wide') {
    width = 144; height = 52; gap = 14;
  }
  saveLogoMarkWidth_(width);
  saveLogoMarkHeight_(height);
  saveLogoGap_(gap);
  syncLogoMetricInputs_(sectionEl);
  renderLogoPreview_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:layout:apply', { detail: collectLogoLayoutDetail_() })); } catch (e) {}
}

function buildLogoPreviewMarkup_(opts = {}){
  const mode = ['logo','logo-text','logo-text-subtitle','text-only'].includes(String(opts.mode || '')) ? String(opts.mode) : 'logo-text';
  const source = String(opts.source || 'image') === 'icon' ? 'icon' : 'image';
  const pos = ['left','right','top','bottom','none'].includes(String(opts.pos || '')) ? String(opts.pos) : 'left';
  const image = opts.image || null;
  const icon = opts.icon || null;
  const width = clampLogoNum_(opts.width, 96, 20, 320);
  const height = clampLogoNum_(opts.height, 44, 20, 220);
  const gap = clampLogoNum_(opts.gap, 12, 0, 48);
  const fit = ['contain','cover','fill'].includes(String(opts.fit || '')) ? String(opts.fit) : 'contain';
  const align = ['start','center','end'].includes(String(opts.align || '')) ? String(opts.align) : 'center';
  const titleSize = clampLogoNum_(opts.titleSize, 24, 8, 120);
  const subtitleSize = clampLogoNum_(opts.subtitleSize, 12, 8, 72);
  const titleOffsetX = clampLogoNum_(opts.titleOffsetX, 0, -60, 120);
  const titleOffsetY = clampLogoNum_(opts.titleOffsetY, 0, -60, 120);
  const subtitleOffsetX = clampLogoNum_(opts.subtitleOffsetX, 0, -60, 120);
  const subtitleOffsetY = clampLogoNum_(opts.subtitleOffsetY, 0, -60, 120);
  const iconSize = Math.max(16, Math.round(Math.min(width, height) * 0.58));
  const showMark = mode !== 'text-only' && pos !== 'none';
  const showTitle = mode !== 'logo' && !opts.iconOnly;
  const showSubtitle = mode === 'logo-text-subtitle' && !opts.hideSubtitle && !opts.iconOnly;
  let markHtml = '';
  if (showMark && source === 'image') {
    if (image && image.url) {
      const bgSize = fit === 'fill' ? '100% 100%' : fit;
      markHtml = `<span class="st-hb-logo-preview__mark st-hb-logo-preview__mark--image" style="background-image:url('${String(image.url).replace(/'/g, "&#39;")}');background-size:${bgSize};"></span>`;
    } else {
      markHtml = `<span class="st-hb-logo-preview__mark st-hb-logo-preview__mark--placeholder">LOGO</span>`;
    }
  }
  if (showMark && source === 'icon') {
    const iconSvg = (icon && icon.svg) ? icon.svg : DEFAULT_PHONE_SVG;
    const iconColor = (icon && icon.defaultColor) ? icon.defaultColor : '#ffffff';
    markHtml = `<span class="st-hb-logo-preview__mark st-hb-logo-preview__mark--icon" style="color:${iconColor}">${iconSvg}</span>`;
  }
  const titleHtml = showTitle ? `<span class="st-hb-logo-preview__title" style="font-size:${titleSize}px;margin-left:${titleOffsetX}px;margin-top:${titleOffsetY}px;">Brand</span>` : '';
  const subtitleHtml = showSubtitle ? `<span class="st-hb-logo-preview__subtitle" style="font-size:${subtitleSize}px;margin-left:${subtitleOffsetX}px;margin-top:${subtitleOffsetY}px;">Studio</span>` : '';
  return `
    <div class="st-hb-logo-preview" data-logo-pos="${pos}" data-logo-source="${source}" data-logo-mode="${mode}" data-logo-align="${align}" style="--st-hb-logo-mark-w:${width}px;--st-hb-logo-mark-h:${height}px;--st-hb-logo-gap:${gap}px;--st-hb-logo-icon-size:${iconSize}px;">
      ${markHtml}
      ${titleHtml}
      ${subtitleHtml}
    </div>
  `;
}

function renderLogoPreview_(sectionEl){
  const box = sectionEl.querySelector('[data-st-hb-logo-previewbox]');
  const adaptiveBox = sectionEl.querySelector('[data-st-hb-logo-adaptive-previewbox]');
  if (!box && !adaptiveBox) return;
  const mode = loadLogoMode_();
  const source = loadLogoSource_();
  const pos = loadLogoPos_();
  const image = getPickedLogoImagePayload_();
  const icon = getPickedIconPayload_();
  const width = loadLogoMarkWidth_();
  const height = loadLogoMarkHeight_();
  const gap = loadLogoGap_();
  const fit = loadLogoFit_();
  const align = loadLogoAlign_();
  const titleSize = loadLogoTitleSize_();
  const subtitleSize = loadLogoSubtitleSize_();
  const titleOffsetX = loadLogoTitleOffsetX_();
  const titleOffsetY = loadLogoTitleOffsetY_();
  const subtitleOffsetX = loadLogoSubtitleOffsetX_();
  const subtitleOffsetY = loadLogoSubtitleOffsetY_();
  const mobileMode = loadLogoMobileMode_();
  const mobileMarkWidth = loadLogoMobileMarkWidth_();
  const mobileTitleSize = loadLogoMobileTitleSize_();
  const mobileSubtitleSize = loadLogoMobileSubtitleSize_();
  const mobileGap = loadLogoMobileGap_();

  const desktopHtml = buildLogoPreviewMarkup_({
    mode, source, pos, image, icon, width, height, gap, fit, align,
    titleSize, subtitleSize, titleOffsetX, titleOffsetY, subtitleOffsetX, subtitleOffsetY,
  });
  const mobileHtml = buildLogoPreviewMarkup_({
    mode, source, pos, image, icon,
    width: mobileMarkWidth,
    height: mobileMarkWidth,
    gap: mobileGap,
    fit, align,
    titleSize: mobileTitleSize,
    subtitleSize: mobileSubtitleSize,
    titleOffsetX, titleOffsetY, subtitleOffsetX, subtitleOffsetY,
    hideSubtitle: mobileMode === 'hide-subtitle',
    iconOnly: mobileMode === 'icon-only',
  });

  if (box) {
    box.innerHTML = desktopHtml;
  }
  if (adaptiveBox) {
    adaptiveBox.innerHTML = `
      <div class="st-hb-logo-previewgrid">
        <div class="st-hb-logo-previewpane">
          <div class="st-hb-logo-previewcap">Desktop</div>
          ${desktopHtml}
        </div>
        <div class="st-hb-logo-previewpane st-hb-logo-previewpane--mobile">
          <div class="st-hb-logo-previewcap">Mobile</div>
          ${mobileHtml}
        </div>
      </div>
    `;
  }
}


function applyLogoTextMetricInputChange_(sectionEl, metric, value){
  const target = loadLogoTextTarget_();
  if (metric === 'size') {
    if (target === 'subtitle') saveLogoSubtitleSize_(value);
    else saveLogoTitleSize_(value);
  } else if (metric === 'offsetX') {
    if (target === 'subtitle') saveLogoSubtitleOffsetX_(value);
    else saveLogoTitleOffsetX_(value);
  } else if (metric === 'offsetY') {
    if (target === 'subtitle') saveLogoSubtitleOffsetY_(value);
    else saveLogoTitleOffsetY_(value);
  }
  syncLogoTextMetricInputs_(sectionEl);
  renderLogoPreview_(sectionEl);
  try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:layout:apply', { detail: collectLogoLayoutDetail_() })); } catch (e) {}
}

function bindDelayedTip(target, text) {
  if (!target) return;
  let t = null;
  let tip = null;

  const hide = () => {
    if (t) { clearTimeout(t); t = null; }
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    tip = null;
  };

  const show = () => {
    hide();
    t = setTimeout(() => {
      const r = target.getBoundingClientRect();
      tip = document.createElement('div');
      tip.className = 'st-hb-delayed-tip';
      tip.textContent = text;
      tip.style.left = Math.round(r.left + (r.width / 2)) + 'px';
      tip.style.top = Math.round(r.top - 10) + 'px';
      document.body.appendChild(tip);
      // move to center
      tip.style.transform = 'translate(-50%, -100%)';
    }, 3000);
  };

  target.addEventListener('pointerenter', show);
  target.addEventListener('pointerleave', hide);
  target.addEventListener('pointerdown', hide);
}



function collectProductSearchDetail_(sectionEl) {
  const root = sectionEl || document;
  const val = (sel, fallback = '') => {
    const el = root.querySelector(sel);
    return el ? String(el.value || '').trim() : fallback;
  };
  const minCharsRaw = Number(val('[data-st-hb-product-search-min-chars]', '2'));
  return {
    placeholder: val('[data-st-hb-product-search-placeholder]', 'Пошук товарів...') || 'Пошук товарів...',
    buttonText: val('[data-st-hb-product-search-button-text]', 'Пошук') || 'Пошук',
    layout: val('[data-st-hb-product-search-layout]', 'field-button') || 'field-button',
    behavior: val('[data-st-hb-product-search-behavior]', 'results') || 'results',
    resultsPath: val('[data-st-hb-product-search-results-path]', 'search') || 'search',
    minChars: Number.isFinite(minCharsRaw) ? Math.max(1, Math.min(20, Math.round(minCharsRaw))) : 2,
  };
}

function initHeaderInsertWidget(host) {
  if (!host) return;

  // не дублюємо
  if (host.querySelector(`#${CSS.escape(SEC_ID)}`)) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;
  sectionEl.setAttribute(SEC_ATTR, '1');

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title"><span>Шапка</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <div class="st-hb-insert-intro">
        Вибери стандартний блок для вставки в шапку. (Поки що — <b>заглушки</b> UI)
      </div>
      <div class="st-hb-insert-list" data-st-hb-insert-list></div>
    </div>

    <style>
      /* секція "Header Insert" існує завжди, але показується тільки в режимі вставки */
      #${SEC_ID}{ display:none; }
      body.st-header-builder-on.st-hb-insert-on #${SEC_ID}{ display:block; }

      /* у режимі вставки ховаємо всі інші секції дизайну */
      body.st-header-builder-on.st-hb-insert-on #design-panel .design-section:not(#${SEC_ID}){ display:none !important; }

      #${SEC_ID} .st-hb-insert-intro{
        font-size:12px;
        color:rgba(226,232,240,0.82);
        padding:8px 10px;
        border:1px solid rgba(148,163,184,0.18);
        border-radius:12px;
        background:rgba(2,6,23,0.25);
        margin-bottom:10px;
      }

      #${SEC_ID} .st-hb-insert-list{ display:flex; flex-direction:column; gap:10px; }

      #${SEC_ID} .st-hb-subacc{
        border:1px solid rgba(148,163,184,0.20);
        border-radius:14px;
        overflow:hidden;
        background:rgba(2,6,23,0.18);
      }
      #${SEC_ID} .st-hb-subacc__head{
        width:100%;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:12px 12px;
        background:rgba(15,23,42,0.40);
        color:rgba(226,232,240,0.96);
        font-weight:900;
        letter-spacing:0.2px;
        cursor:pointer;
        appearance:none;
        border:0;
        text-align:left;
      }
      #${SEC_ID} .st-hb-subacc__head:hover{ background:rgba(15,23,42,0.55); }
      #${SEC_ID} .st-hb-subacc__title{ font-size:14px; }
      #${SEC_ID} .st-hb-subacc__chev{ opacity:0.75; transform:rotate(90deg); }
      #${SEC_ID} .st-hb-subacc.is-open .st-hb-subacc__chev{ transform:rotate(270deg); }

      #${SEC_ID} .st-hb-subacc__body{
        padding:10px 12px 12px;
        background:rgba(2,6,23,0.12);
      }
      #${SEC_ID} .st-hb-subacc__note{
        font-size:12px;
        color:rgba(226,232,240,0.85);
        margin-bottom:8px;
        line-height:1.35;
      }
      #${SEC_ID} .st-hb-subacc__stub{
        font-size:12px;
        color:rgba(226,232,240,0.70);
        padding:10px;
        border:1px dashed rgba(148,163,184,0.28);
        border-radius:12px;
        background:rgba(15,23,42,0.28);
      }
          #${SEC_ID} .st-hb-subacc__actions{
        display:flex;
        gap:10px;
        padding:10px 12px 0 12px;
      }
      #${SEC_ID} .st-hb-insbtn{
        appearance:none;
        border:1px solid rgba(148,163,184,0.28);
        background:rgba(15,23,42,0.35);
        color:rgba(226,232,240,0.92);
        border-radius:12px;
        padding:10px 12px;
        font-weight:700;
        font-size:13px;
        cursor:pointer;
      }
      #${SEC_ID} .st-hb-insbtn:hover{ background:rgba(15,23,42,0.55); }
      #${SEC_ID} .st-hb-insbtn.is-primary{
        background:rgba(59,130,246,0.28);
        border-color:rgba(59,130,246,0.45);
      }
      #${SEC_ID} .st-hb-insbtn.is-active{
        background:rgba(59,130,246,0.22);
        border-color:rgba(96,165,250,0.60);
        color:#dbeafe;
        box-shadow:0 0 0 1px rgba(96,165,250,0.22) inset;
      }
      #${SEC_ID} .st-hb-subacc__hint{
        padding:10px 12px 12px 12px;
        font-size:12px;
        color:rgba(226,232,240,0.80);
      }


      #${SEC_ID} .st-hb-subacc__preview{ padding:0 12px 10px 12px; }
      #${SEC_ID} .st-hb-subacc__previewbox{
        width:100%;
        min-height:48px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:14px;
        border:1px dashed rgba(148,163,184,0.28);
        background:rgba(2,6,23,0.28);
      }
      #${SEC_ID} .st-hb-subacc__previewph{ color:rgba(226,232,240,0.68); font-size:12px; }
      #${SEC_ID} .st-hb-subacc__iconwrap svg{ display:block; }
      #${SEC_ID} .st-hb-logo-previewgrid{ width:100%; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; padding:10px; }
      #${SEC_ID} .st-hb-logo-previewpane{ min-width:0; display:flex; flex-direction:column; gap:8px; padding:10px; border-radius:12px; border:1px solid rgba(148,163,184,0.18); background:rgba(15,23,42,0.34); }
      #${SEC_ID} .st-hb-logo-previewpane--mobile{ max-width:240px; justify-self:end; }
      #${SEC_ID} .st-hb-logo-previewcap{ font-size:11px; font-weight:900; letter-spacing:.06em; text-transform:uppercase; color:rgba(148,163,184,.92); }
      #${SEC_ID} .st-hb-logo-preview{
        display:grid;
        align-items:var(--st-hb-logo-align, center);
        column-gap:var(--st-hb-logo-gap, 10px);
        row-gap:2px;
        min-height:62px;
      }
      #${SEC_ID} .st-hb-logo-preview[data-logo-align="start"]{ --st-hb-logo-align:start; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-align="center"]{ --st-hb-logo-align:center; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-align="end"]{ --st-hb-logo-align:end; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="left"]{ grid-template-columns:auto auto; grid-template-rows:auto auto; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="left"] .st-hb-logo-preview__mark{ grid-column:1; grid-row:1 / span 2; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="left"] .st-hb-logo-preview__title,
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="left"] .st-hb-logo-preview__subtitle{ grid-column:2; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="right"]{ grid-template-columns:auto auto; grid-template-rows:auto auto; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="right"] .st-hb-logo-preview__mark{ grid-column:2; grid-row:1 / span 2; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="right"] .st-hb-logo-preview__title,
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="right"] .st-hb-logo-preview__subtitle{ grid-column:1; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="top"]{ grid-template-columns:1fr; grid-template-rows:auto auto auto; justify-items:start; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="bottom"]{ grid-template-columns:1fr; grid-template-rows:auto auto auto; justify-items:start; }
      #${SEC_ID} .st-hb-logo-preview[data-logo-pos="bottom"] .st-hb-logo-preview__mark{ order:3; }
      #${SEC_ID} .st-hb-logo-preview__mark{
        width:var(--st-hb-logo-mark-w,44px); height:var(--st-hb-logo-mark-h,44px); display:grid; place-items:center; border-radius:12px;
        background:rgba(15,23,42,0.72); border:1px solid rgba(148,163,184,0.24); overflow:hidden;
        background-size:contain; background-position:center; background-repeat:no-repeat;
        font-size:10px; font-weight:900; letter-spacing:.08em; color:rgba(226,232,240,.92);
      }
      #${SEC_ID} .st-hb-logo-preview__mark--icon svg{ width:var(--st-hb-logo-icon-size,24px); height:var(--st-hb-logo-icon-size,24px); display:block; }
      #${SEC_ID} .st-hb-logo-groups{ display:flex; flex-direction:column; gap:10px; margin-top:10px; }
      #${SEC_ID} .st-hb-logo-groups > .st-hb-subacc{ background:rgba(2,6,23,0.12); }
      #${SEC_ID} .st-hb-subacc__row{ display:flex; gap:8px; flex-wrap:wrap; }
      #${SEC_ID} .st-hb-subacc__grid{ display:grid; grid-template-columns:1fr; gap:10px; margin-top:10px; }
      #${SEC_ID} .st-hb-field{ display:flex; flex-direction:column; gap:6px; }
      #${SEC_ID} .st-hb-field__label{ display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:12px; font-weight:800; color:rgba(226,232,240,.92); }
      #${SEC_ID} .st-hb-field__row{ display:grid; grid-template-columns:1fr 78px; gap:8px; }
      #${SEC_ID} .st-hb-field input[type="range"]{ width:100%; }
      #${SEC_ID} .st-hb-field input[type="number"],
      #${SEC_ID} .st-hb-field input[type="text"]{ width:100%; min-width:0; appearance:textfield; border-radius:10px; border:1px solid rgba(148,163,184,0.22); background:rgba(15,23,42,0.35); color:rgba(226,232,240,.96); padding:8px 10px; font-weight:800; }
      #${SEC_ID} .st-hb-field input[type="checkbox"]{ accent-color:#60a5fa; }
      #${SEC_ID} .st-hb-logo-preview__title{ font-size:16px; font-weight:900; color:rgba(226,232,240,.96); line-height:1.15; }
      #${SEC_ID} .st-hb-logo-preview__subtitle{ font-size:11px; font-weight:700; color:rgba(148,163,184,.95); line-height:1.15; }
      #${SEC_ID} .st-hb-menu-mode{
        display:grid;
        gap:8px;
        padding:10px;
        margin-bottom:10px;
        border:1px solid rgba(59,130,246,0.28);
        border-radius:12px;
        background:rgba(15,23,42,0.52);
      }
      #${SEC_ID} .st-hb-menu-mode__title{
        color:rgba(226,232,240,0.95);
        font-size:12px;
        font-weight:900;
        letter-spacing:.2px;
      }
      #${SEC_ID} .st-hb-menu-mode__opt{
        display:flex;
        align-items:center;
        gap:8px;
        color:rgba(226,232,240,0.92);
        font-size:12px;
        font-weight:800;
        line-height:1.25;
        cursor:pointer;
        user-select:none;
      }
      #${SEC_ID} .st-hb-menu-mode__opt input{
        width:15px;
        height:15px;
        accent-color:#38bdf8;
        flex:0 0 auto;
      }
      #${SEC_ID} .st-hb-menu-mode__opt span{ min-width:0; }

      /* delayed tooltip (3s) — big clear letters */
      .st-hb-delayed-tip{
        position:fixed;
        z-index:999999;
        pointer-events:none;
        padding:14px 16px;
        border-radius:16px;
        border:1px solid rgba(148,163,184,0.25);
        background:rgba(2,6,23,0.92);
        color:rgba(226,232,240,0.98);
        font-size:20px;
        font-weight:900;
        letter-spacing:0.5px;
        box-shadow:0 18px 45px rgba(0,0,0,0.45);
        white-space:nowrap;
      }
</style>
  `.trim();

  // вставляємо на початок — щоб "Шапка" була першою
  host.prepend(sectionEl);

  // наповнюємо 8 базових блоків
  const list = sectionEl.querySelector('[data-st-hb-insert-list]');
  if (list) {
    const items = [
      { t: 'Текст',     d: 'Звичайний текстовий елемент (inline). Безпечний для шапки.' },
      { t: 'Заголовок', d: 'Заголовок (H1–H6). Для шапки зазвичай H3–H6.' },
      { t: 'Лого',      d: 'Логотип (SVG/PNG) з керуванням розмірами та відступами.' },
      { t: 'PNG',       d: 'Картинка з прозорим фоном (PNG/WebP) — як елемент у шапці.' },
      { t: 'Телефон',   d: 'Клікабельний телефон (tel:). Може відображатись як текст/іконка.' },
      { t: 'Іконка',    d: 'Окрема іконка (SVG) — наприклад соцмережі, пошук, кошик.' },
      { t: 'Меню',      d: 'Меню навігації. Для мобільного — Burger (скоро).' },
      { t: 'Кнопка',    d: 'CTA-кнопка (посилання/дія). Стандартний елемент шапки.' },
      { t: 'Пошук Товарів', d: 'Пошуковий блок інтернет-магазину: поле, кнопка, іконка, шлях результатів.' },
    ];
    items.forEach((it) => {
      if (it.t === 'Текст') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Текстовий БЛОК',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-text-add>Додати текст</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-text-tune>Налаштувати текст</button>
</div>
<div class="st-hb-subacc__hint">
  Спочатку натисни <b>Додати текст</b> (елемент зʼявиться в шапці). Потім — <b>Налаштувати</b>.
</div>`
        }));
      } else if (it.t === 'Заголовок') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Заголовок',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-heading-add>Додати заголовок</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-heading-tune>Налаштувати заголовок</button>
</div>
<div class="st-hb-subacc__hint">
  Спочатку натисни <b>Додати заголовок</b> (елемент зʼявиться у вибраному контейнері шапки).
  <br>Потім — <b>Налаштувати заголовок</b>, щоб перейти у головний інспектор до віджета <b>Текст</b>.
</div>`
        }));
      } else if (it.t === 'PNG') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'PNG',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-add>Додати PNG</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-png-tune>Налаштувати PNG</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-png-choose="images">Вибрати PNG</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-choose="logos">Логотипи</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-png-replace>Замінити PNG</button>
</div>
<div class="st-hb-subacc__preview">
  <div class="st-hb-subacc__previewbox" data-st-hb-png-previewbox>
    <div class="st-hb-subacc__previewph">PNG не вибрано</div>
  </div>
</div>
<div class="st-hb-subacc__hint">
  Спочатку вибери PNG у галереї, потім натисни <b>Додати PNG</b>.
  <br><b>Налаштувати PNG</b> відкриє головний інспектор — розміри, фон, тіні та відступи змінюються вже існуючими віджетами.
</div>
<div class="st-hb-logo-groups" data-st-hb-png-groups></div>`
        }));
      } else if (it.t === 'Телефон') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Телефон',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-phone-add>Додати номер телефону</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-phone-tune>Налаштувати номер</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-phone-icon-tune>Налаштувати Іконку</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <button type="button" class="st-hb-insbtn" data-st-hb-phone-icon-choose>Вибрати іконку</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-phone-icon-pos="left">Іконка зліва</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-phone-icon-pos="right">Іконка справа</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-phone-icon-pos="none">Виключити</button>
</div>
<div class="st-hb-subacc__preview">
  <div class="st-hb-subacc__previewbox" data-st-hb-phone-previewbox></div>
</div>
<div class="st-hb-subacc__hint">
  Спочатку вибери іконку та її позицію, потім натисни <b>Додати номер телефону</b>.
  <br><b>Налаштувати номер</b> відкриє віджет <b>Текст</b>, а <b>Налаштувати Іконку</b> — віджет <b>Іконка — Стилі</b>.
</div>`
        }));
      } else if (it.t === 'Іконка') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Іконка',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-icon-choose>Вибрати іконку</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-icon-add>Вставити іконку</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-icon-tune>Налаштувати іконку</button>
</div>
<div class="st-hb-subacc__preview">
  <div class="st-hb-subacc__previewbox" data-st-hb-icon-previewbox>
    <div class="st-hb-subacc__previewph">Нічого не вибрано</div>
  </div>
</div>
<div class="st-hb-subacc__hint">
  Натисни <b>Вибрати іконку</b>, обери в Галереї → Іконки, потім <b>Вставити іконку</b>.
  <br>Після вставки — клікни по іконці в шапці і натисни <b>Налаштувати іконку</b>.
</div>`
        }));
      } else if (it.t === 'Меню') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Меню',
          extraHtml: `<div class="st-hb-menu-mode" data-st-hb-menu-insert-mode-wrap>
  <div class="st-hb-menu-mode__title">Куди вставити меню</div>
  <label class="st-hb-menu-mode__opt">
    <input type="radio" name="st-hb-menu-insert-mode" value="block" checked>
    <span>Вставити як звичайний блок меню</span>
  </label>
  <label class="st-hb-menu-mode__opt">
    <input type="radio" name="st-hb-menu-insert-mode" value="nav-row">
    <span>Вставити у навігаційний рядок</span>
  </label>
</div>
<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-menu-add-big>Big Menu</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-menu-add-burger>Burger Menu</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-menu-tune>Налаштувати меню</button>
</div>
<div class="st-hb-subacc__hint">
  <b>Звичайний блок меню</b> — спочатку клікни по контейнеру у шапці, потім натисни <b>Big</b> або <b>Burger</b>.
  <br><b>Навігаційний рядок</b> — контейнер вибирати не треба: меню вставиться окремою компактною полоскою у шапці, яку можна переносити між секціями.
  <br>Після вставки — клікни по меню-блоку і натисни <b>Налаштувати меню</b>.
</div>`
        }));
      } else if (it.t === 'Лого') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Лого',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn" data-st-hb-logo-add>Додати лого</button>
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-logo-tune>Налаштувати лого</button>
</div>
<div class="st-hb-logo-groups" data-st-hb-logo-groups></div>
<div class="st-hb-subacc__preview">
  <div class="st-hb-subacc__previewbox" data-st-hb-logo-previewbox></div>
</div>
<div class="st-hb-subacc__hint">
  Перші 2 блоки — <b>Загальні налаштування</b> і <b>Позиція</b>. Нижче — <b>Посилання / Поведінка</b>, <b>Адаптивність</b> та <b>Hover</b>.
  <br>Стилі самих акордеонів не нові — використовується той самий стандартний акардеон, що вже є в конструкторі.
</div>`
        }));
      } else if (it.t === 'Кнопка') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Кнопка',
          extraHtml: `<div class="st-hb-logo-groups" data-st-hb-button-groups></div>`
        }));
      } else if (it.t === 'Пошук Товарів') {
        list.appendChild(makeSubAccordion(it.t, it.d, {
          tipText: 'Пошук товарів',
          extraHtml: `<div class="st-hb-subacc__actions">
  <button type="button" class="st-hb-insbtn is-primary" data-st-hb-product-search-add>Додати Пошук Товарів</button>
  <button type="button" class="st-hb-insbtn" data-st-hb-product-search-tune>Налаштувати Пошук</button>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <label class="st-hb-field" style="flex:1 1 160px;min-width:160px;">
    <span class="st-hb-field__label"><span>Placeholder</span></span>
    <input type="text" maxlength="80" value="Пошук товарів..." data-st-hb-product-search-placeholder>
  </label>
  <label class="st-hb-field" style="flex:1 1 120px;min-width:120px;">
    <span class="st-hb-field__label"><span>Кнопка</span></span>
    <input type="text" maxlength="40" value="Пошук" data-st-hb-product-search-button-text>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <label class="st-hb-field" style="flex:1 1 150px;min-width:150px;">
    <span class="st-hb-field__label"><span>Вигляд</span></span>
    <select data-st-hb-product-search-layout>
      <option value="field-button">Поле + кнопка</option>
      <option value="field-icon">Поле + іконка</option>
      <option value="icon-only">Тільки іконка</option>
      <option value="full">Повний широкий</option>
    </select>
  </label>
  <label class="st-hb-field" style="flex:1 1 150px;min-width:150px;">
    <span class="st-hb-field__label"><span>Результати</span></span>
    <select data-st-hb-product-search-behavior>
      <option value="results">Сторінка результатів</option>
      <option value="category-or-results">Категорія або результати</option>
      <option value="exact-or-results">Точний товар або результати</option>
    </select>
  </label>
</div>
<div class="st-hb-subacc__row" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
  <label class="st-hb-field" style="flex:1 1 150px;min-width:150px;">
    <span class="st-hb-field__label"><span>Шлях результатів</span></span>
    <input type="text" maxlength="80" value="search" data-st-hb-product-search-results-path>
  </label>
  <label class="st-hb-field" style="width:110px;">
    <span class="st-hb-field__label"><span>Мін. символів</span></span>
    <input type="number" min="1" max="20" value="2" data-st-hb-product-search-min-chars>
  </label>
</div>
<div class="st-hb-subacc__hint">
  Пошук товарів створюється як стандартний <b>.st-block</b>, тому фон, колір, розмір, тінь, бордер і відступи налаштовуються готовими віджетами інспектора.
  <br>Логіка товарів поки працює як каркас: якщо каталогу ще немає — відкривається сторінка <b>#search?q=...</b>. Коли зʼявиться каталог, підключимо його до цього ж віджета без переробки дизайну.
</div>`
        }));
      } else {

        list.appendChild(makeSubAccordion(it.t, it.d));
      }
    });
  }

  const logoGroupsHolder = sectionEl.querySelector('[data-st-hb-logo-groups]');
  if (logoGroupsHolder) buildLogoInnerAccordions_(logoGroupsHolder);
  const pngGroupsHolder = sectionEl.querySelector('[data-st-hb-png-groups]');
  if (pngGroupsHolder) buildPngInnerAccordions_(pngGroupsHolder);
  const buttonGroupsHolder = sectionEl.querySelector('[data-st-hb-button-groups]');
  if (buttonGroupsHolder) buildButtonInnerAccordions_(buttonGroupsHolder);

  // init icon preview
  // init icon preview
  loadPickedIcon_();
  renderIconPreview_(sectionEl);
  syncPhonePosUI_(sectionEl, loadPhoneIconPos_());
  renderPhonePreview_(sectionEl);
  renderPngPreview_(sectionEl);
  syncButtonInputs_(sectionEl);
  loadPickedButtonIcon_();
  renderButtonPreview_(sectionEl);
  syncPngLinkUi_(sectionEl);
  syncPngAdaptiveUi_(sectionEl);
  syncPngHoverUi_(sectionEl);
  syncPngExtrasUi_(sectionEl);
  syncLogoModeUI_(sectionEl, loadLogoMode_());
  syncLogoSourceUI_(sectionEl, loadLogoSource_());
  syncLogoPosUI_(sectionEl, loadLogoPos_());
  syncLogoFitUI_(sectionEl, loadLogoFit_());
  syncLogoAlignUI_(sectionEl, loadLogoAlign_());
  syncLogoMetricInputs_(sectionEl);
  syncLogoTextMetricInputs_(sectionEl);
  syncLogoLinkUi_(sectionEl);
  syncLogoAdaptiveUi_(sectionEl);
  syncLogoHoverUi_(sectionEl);
  renderLogoPreview_(sectionEl);
  const getMenuInsertMode_ = () => {
    const input = sectionEl.querySelector('input[name="st-hb-menu-insert-mode"]:checked');
    const value = input ? String(input.value || 'block') : 'block';
    return value === 'nav-row' ? 'nav-row' : 'block';
  };

  // Дії для "Текст" (реальна вставка + перехід у дизайн)
  sectionEl.addEventListener('click', (ev) => {
    const addBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-text-add]');
    if (addBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:text:add')); } catch (e) {}
      return;
    }

    const tuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-text-tune]');
    if (tuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:text:tune')); } catch (e) {}
      // після перемикання в дизайн — фокус на віджет "Текст"
      try { window.dispatchEvent(new CustomEvent('st:design:focus-text-widget')); } catch (e) {}
      return;
    }

    const headingAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-heading-add]');
    if (headingAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:heading:add')); } catch (e) {}
      return;
    }

    const headingTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-heading-tune]');
    if (headingTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:heading:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-text-widget')); } catch (e) {}
      return;
    }



    const productSearchAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-product-search-add]');
    if (productSearchAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:product-search:add', { detail: collectProductSearchDetail_(sectionEl) })); } catch (e) {}
      return;
    }

    const productSearchTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-product-search-tune]');
    if (productSearchTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:product-search:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-product-search-widget')); } catch (e) {}
      return;
    }

    const buttonAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-add]');
    if (buttonAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:add', { detail: collectButtonDetail_() })); } catch (e) {}
      return;
    }

    const buttonTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-tune]');
    if (buttonTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:tune')); } catch (e) {}
      return;
    }

    const buttonTextTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-text-tune]');
    if (buttonTextTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:text:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-text-widget')); } catch (e) {}
      return;
    }

    const buttonIconTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-icon-tune]');
    if (buttonIconTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:icon:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-icon-widget')); } catch (e) {}
      return;
    }

    const buttonModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-mode]');
    if (buttonModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(buttonModeBtn.getAttribute('data-st-hb-button-mode') || 'text-icon');
      saveButtonMode_(mode);
      syncButtonModeUI_(sectionEl, mode);
      renderButtonPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:mode:apply', { detail: { mode } })); } catch (e) {}
      return;
    }

    const buttonPosBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-icon-pos]');
    if (buttonPosBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const pos = String(buttonPosBtn.getAttribute('data-st-hb-button-icon-pos') || 'left');
      saveButtonIconPos_(pos);
      syncButtonPosUI_(sectionEl, pos);
      renderButtonPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:icon-pos:apply', { detail: { iconPosition: pos } })); } catch (e) {}
      return;
    }

    const buttonLinkModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-link-mode]');
    if (buttonLinkModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(buttonLinkModeBtn.getAttribute('data-st-hb-button-link-mode') || 'none');
      saveButtonLinkMode_(mode);
      syncButtonBehaviorUI_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:link:apply', { detail: collectButtonLinkDetail_() })); } catch (e) {}
      return;
    }

    const buttonClickAreaBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-click-area]');
    if (buttonClickAreaBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const area = String(buttonClickAreaBtn.getAttribute('data-st-hb-button-click-area') || 'all');
      saveButtonClickArea_(area);
      syncButtonBehaviorUI_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:link:apply', { detail: collectButtonLinkDetail_() })); } catch (e) {}
      return;
    }

    const buttonMobileModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-mobile-mode]');
    if (buttonMobileModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(buttonMobileModeBtn.getAttribute('data-st-hb-button-mobile-mode') || 'inherit');
      saveButtonMobileMode_(mode);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }

    const buttonHoverTargetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-hover-target]');
    if (buttonHoverTargetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const target = String(buttonHoverTargetBtn.getAttribute('data-st-hb-button-hover-target') || 'block');
      saveButtonHoverTarget_(target);
      syncButtonHoverUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:hover:apply', { detail: collectButtonHoverDetail_() })); } catch (e) {}
      return;
    }

    const buttonExtraPresetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-extra-preset]');
    if (buttonExtraPresetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const preset = String(buttonExtraPresetBtn.getAttribute('data-st-hb-button-extra-preset') || 'primary');
      applyButtonExtraPreset_(preset);
      syncButtonExtrasUi_(sectionEl);
      renderButtonPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:extras:apply', { detail: collectButtonExtrasDetail_() })); } catch (e) {}
      return;
    }

    const buttonShapeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-shape]');
    if (buttonShapeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      saveButtonShape_(String(buttonShapeBtn.getAttribute('data-st-hb-button-shape') || 'rounded'));
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }

    const buttonFillModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-fill-mode]');
    if (buttonFillModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      saveButtonFillMode_(String(buttonFillModeBtn.getAttribute('data-st-hb-button-fill-mode') || 'solid'));
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }

    const buttonIconChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-button-icon-choose]');
    if (buttonIconChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      pickButtonIconViaGallery_(sectionEl).catch(() => {});
      return;
    }

    const logoModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-mode]');
    if (logoModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(logoModeBtn.getAttribute('data-st-hb-logo-mode') || 'logo-text');
      saveLogoMode_(mode);
      syncLogoModeUI_(sectionEl, mode);
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:mode:apply', { detail: { mode } })); } catch (e) {}
      return;
    }

    const logoSourceBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-source]');
    if (logoSourceBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const source = String(logoSourceBtn.getAttribute('data-st-hb-logo-source') || 'image');
      saveLogoSource_(source);
      syncLogoSourceUI_(sectionEl, source);
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:source:apply', { detail: { source } })); } catch (e) {}
      return;
    }

    const logoPosBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-pos]');
    if (logoPosBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const pos = String(logoPosBtn.getAttribute('data-st-hb-logo-pos') || 'left');
      saveLogoPos_(pos);
      syncLogoPosUI_(sectionEl, pos);
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:pos:apply', { detail: { position: pos } })); } catch (e) {}
      return;
    }

    const logoImageChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-image-choose]');
    if (logoImageChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const cat = String(logoImageChooseBtn.getAttribute('data-st-hb-logo-image-choose') || 'logos');
      saveLogoSource_('image');
      syncLogoSourceUI_(sectionEl, 'image');
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:source:apply', { detail: { source: 'image' } })); } catch (e) {}
      pickLogoImageViaGallery_(sectionEl, cat).catch(() => {});
      return;
    }

    const logoIconChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-icon-choose]');
    if (logoIconChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      saveLogoSource_('icon');
      syncLogoSourceUI_(sectionEl, 'icon');
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:source:apply', { detail: { source: 'icon' } })); } catch (e) {}
      pickIconViaGallery_(sectionEl, {
        onPicked: (payload) => {
          renderLogoPreview_(sectionEl);
          try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:icon:apply', { detail: payload })); } catch (e) {}
        }
      }).catch(() => {});
      return;
    }

    const logoAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-add]');
    if (logoAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const detail = {
        mode: loadLogoMode_(),
        source: loadLogoSource_(),
        position: loadLogoPos_(),
        image: getPickedLogoImagePayload_(),
        icon: getPickedIconPayload_(),
        layout: collectLogoLayoutDetail_(),
        link: collectLogoLinkDetail_(),
        adaptive: collectLogoAdaptiveDetail_(),
        hover: collectLogoHoverDetail_()
      };
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:add', { detail })); } catch (e) {}
      return;
    }

    const logoTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-tune]');
    if (logoTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:tune')); } catch (e) {}
      return;
    }

    const logoTextTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-text-tune]');
    if (logoTextTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:text:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-text-widget')); } catch (e) {}
      return;
    }

    const logoSubtitleTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-subtitle-tune]');
    if (logoSubtitleTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:subtitle:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-text-widget')); } catch (e) {}
      return;
    }

    const logoSignTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-sign-tune]');
    if (logoSignTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      if (loadLogoSource_() === 'image') {
        pickLogoImageViaGallery_(sectionEl, 'logos').catch(() => {});
      } else {
        try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:sign:tune')); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('st:design:focus-icon-widget')); } catch (e) {}
      }
      return;
    }

    const logoTextTargetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-text-target]');
    if (logoTextTargetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const target = String(logoTextTargetBtn.getAttribute('data-st-hb-logo-text-target') || 'title');
      saveLogoTextTarget_(target);
      syncLogoTextMetricInputs_(sectionEl);
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:layout:apply', { detail: collectLogoLayoutDetail_() })); } catch (e) {}
      return;
    }

    const logoHoverTargetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-hover-target]');
    if (logoHoverTargetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const target = String(logoHoverTargetBtn.getAttribute('data-st-hb-logo-hover-target') || 'block');
      saveLogoHoverTarget_(target);
      syncLogoHoverUi_(sectionEl);
      return;
    }

    const logoPresetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-preset]');
    if (logoPresetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      applyLogoPreset_(sectionEl, String(logoPresetBtn.getAttribute('data-st-hb-logo-preset') || 'medium'));
      return;
    }

    const logoFitBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-fit]');
    if (logoFitBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const fit = String(logoFitBtn.getAttribute('data-st-hb-logo-fit') || 'contain');
      saveLogoFit_(fit);
      syncLogoFitUI_(sectionEl, fit);
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:layout:apply', { detail: collectLogoLayoutDetail_() })); } catch (e) {}
      return;
    }

    const logoAlignBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-align]');
    if (logoAlignBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const align = String(logoAlignBtn.getAttribute('data-st-hb-logo-align') || 'center');
      saveLogoAlign_(align);
      syncLogoAlignUI_(sectionEl, align);
      renderLogoPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:layout:apply', { detail: collectLogoLayoutDetail_() })); } catch (e) {}
      return;
    }

    const logoLinkModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-link-mode]');
    if (logoLinkModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(logoLinkModeBtn.getAttribute('data-st-hb-logo-link-mode') || 'home');
      saveLogoLinkMode_(mode);
      syncLogoLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:link:apply', { detail: collectLogoLinkDetail_() })); } catch (e) {}
      return;
    }

    const logoClickAreaBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-click-area]');
    if (logoClickAreaBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const area = String(logoClickAreaBtn.getAttribute('data-st-hb-logo-click-area') || 'all');
      saveLogoClickArea_(area);
      syncLogoLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:link:apply', { detail: collectLogoLinkDetail_() })); } catch (e) {}
      return;
    }

    const logoMobileModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-logo-mobile-mode]');
    if (logoMobileModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(logoMobileModeBtn.getAttribute('data-st-hb-logo-mobile-mode') || 'inherit');
      saveLogoMobileMode_(mode);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }

    const pngChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-choose]');
    if (pngChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const cat = String(pngChooseBtn.getAttribute('data-st-hb-png-choose') || 'images');
      pickPngImageViaGallery_(sectionEl, cat).catch(() => {});
      return;
    }

    const pngReplaceBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-replace]');
    if (pngReplaceBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      pickPngImageViaGallery_(sectionEl, 'images').catch(() => {});
      return;
    }

    const pngAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-add]');
    if (pngAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const detail = { image: getPickedPngImagePayload_(), link: collectPngLinkDetail_(), adaptive: collectPngAdaptiveDetail_(), hover: collectPngHoverDetail_(), extras: collectPngExtrasDetail_() };
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:add', { detail })); } catch (e) {}
      return;
    }

    const pngTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-tune]');
    if (pngTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:tune')); } catch (e) {}
      return;
    }

    const pngLinkModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-link-mode]');
    if (pngLinkModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(pngLinkModeBtn.getAttribute('data-st-hb-png-link-mode') || 'none');
      savePngLinkMode_(mode);
      syncPngLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:link:apply', { detail: collectPngLinkDetail_() })); } catch (e) {}
      return;
    }

    const pngClickAreaBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-click-area]');
    if (pngClickAreaBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const area = String(pngClickAreaBtn.getAttribute('data-st-hb-png-click-area') || 'all');
      savePngClickArea_(area);
      syncPngLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:link:apply', { detail: collectPngLinkDetail_() })); } catch (e) {}
      return;
    }

    const pngMobileModeBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-mobile-mode]');
    if (pngMobileModeBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const mode = String(pngMobileModeBtn.getAttribute('data-st-hb-png-mobile-mode') || 'inherit');
      savePngMobileMode_(mode);
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }

    const pngMobileChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-mobile-choose]');
    if (pngMobileChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const cat = String(pngMobileChooseBtn.getAttribute('data-st-hb-png-mobile-choose') || 'images');
      pickPngMobileImageViaGallery_(sectionEl, cat, {
        onPicked: () => {
          try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
        }
      }).catch(() => {});
      return;
    }

    const pngMobileUseDesktopBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-mobile-use-desktop]');
    if (pngMobileUseDesktopBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      _pickedPngMobileImage = null;
      savePickedPngMobileImage_();
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }

    const pngMobileClearBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-mobile-clear]');
    if (pngMobileClearBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      _pickedPngMobileImage = null;
      savePickedPngMobileImage_();
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }

    const pngHoverTargetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-hover-target]');
    if (pngHoverTargetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const target = String(pngHoverTargetBtn.getAttribute('data-st-hb-png-hover-target') || 'block');
      savePngHoverTarget_(target);
      syncPngHoverUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:hover:apply', { detail: collectPngHoverDetail_() })); } catch (e) {}
      return;
    }

    const pngExtraPresetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-extra-preset]');
    if (pngExtraPresetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const preset = String(pngExtraPresetBtn.getAttribute('data-st-hb-png-extra-preset') || 'none');
      applyPngExtraPreset_(preset);
      syncPngExtrasUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:extras:apply', { detail: collectPngExtrasDetail_() })); } catch (e) {}
      return;
    }

    const pngGlowTargetBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-png-glow-target]');
    if (pngGlowTargetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const target = String(pngGlowTargetBtn.getAttribute('data-st-hb-png-glow-target') || 'media');
      savePngGlowTarget_(target);
      syncPngExtrasUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:extras:apply', { detail: collectPngExtrasDetail_() })); } catch (e) {}
      return;
    }

    const phonePosBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-phone-icon-pos]');
    if (phonePosBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const pos = String(phonePosBtn.getAttribute('data-st-hb-phone-icon-pos') || 'left');
      savePhoneIconPos_(pos);
      syncPhonePosUI_(sectionEl, pos);
      renderPhonePreview_(sectionEl);
      return;
    }

    const phoneIconChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-phone-icon-choose]');
    if (phoneIconChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      pickIconViaGallery_(sectionEl, {
        onPicked: () => {
          renderPhonePreview_(sectionEl);
        }
      }).catch(() => {});
      return;
    }

    const phoneAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-phone-add]');
    if (phoneAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const payload = getPickedOrDefaultPhoneIconPayload_();
      const position = loadPhoneIconPos_();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:phone:add', { detail: { icon: payload, position } })); } catch (e) {}
      return;
    }

    const phoneTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-phone-tune]');
    if (phoneTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:phone:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-text-widget')); } catch (e) {}
      return;
    }

    const phoneIconTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-phone-icon-tune]');
    if (phoneIconTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:phone:icon:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-icon-widget')); } catch (e) {}
      return;
    }

    const iconChooseBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-icon-choose]');
    if (iconChooseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      pickIconViaGallery_(sectionEl);
      return;
    }

    const iconAddBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-icon-add]');
    if (iconAddBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const payload = getPickedIconPayload_();
      if (!payload) return;
      try { window.dispatchEvent(new CustomEvent('st:header-insert:icon:add', { detail: payload })); } catch(e) {}
      return;
    }

    const iconTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-icon-tune]');
    if (iconTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:icon:tune')); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-icon-widget')); } catch (e) {}
      return;
    }

    const menuBigBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-menu-add-big]');
    if (menuBigBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:menu:add', { detail: { variant: 'big', insertMode: getMenuInsertMode_() } })); } catch(e) {}
      return;
    }

    const menuBurgerBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-menu-add-burger]');
    if (menuBurgerBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:menu:add', { detail: { variant: 'burger', insertMode: getMenuInsertMode_() } })); } catch(e) {}
      return;
    }

    const menuTuneBtn = ev.target && ev.target.closest && ev.target.closest('[data-st-hb-menu-tune]');
    if (menuTuneBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      try { window.dispatchEvent(new CustomEvent('st:header-insert:menu:tune')); } catch(e) {}
      try { window.dispatchEvent(new CustomEvent('st:design:focus-menu-widget')); } catch (e) {}
      return;
    }

  });

  const pushLogoLayoutFromInputs_ = () => {
    syncLogoMetricInputs_(sectionEl);
    renderLogoPreview_(sectionEl);
    try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:layout:apply', { detail: collectLogoLayoutDetail_() })); } catch (e) {}
  };

  sectionEl.addEventListener('input', (ev) => {
    const t = ev.target;
    if (t && t.matches && t.matches('[data-st-hb-button-text]')) {
      saveButtonText_(t.value || '');
      syncButtonInputs_(sectionEl);
      renderButtonPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:text:apply', { detail: { text: loadButtonText_() } })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-link-url]')) {
      saveButtonLinkUrl_(t.value || '');
      syncButtonBehaviorUI_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:link:apply', { detail: collectButtonLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-link-newtab]')) {
      saveButtonLinkNewTab_(!!t.checked);
      syncButtonBehaviorUI_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:link:apply', { detail: collectButtonLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-label]')) {
      saveButtonMobileLabel_(t.value || '');
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-width], [data-st-hb-button-mobile-width-num]')) {
      saveButtonMobileWidth_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-label-size], [data-st-hb-button-mobile-label-size-num]')) {
      saveButtonMobileLabelSize_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-icon-size], [data-st-hb-button-mobile-icon-size-num]')) {
      saveButtonMobileIconSize_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-gap], [data-st-hb-button-mobile-gap-num]')) {
      saveButtonMobileGap_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-color1]')) {
      saveButtonColor1_(t.value);
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-color2]')) {
      saveButtonColor2_(t.value);
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-gradient-angle], [data-st-hb-button-gradient-angle-num]')) {
      saveButtonGradientAngle_(t.value);
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-hover-opacity], [data-st-hb-button-hover-opacity-num]')) {
      applyButtonHoverInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-hover-scale], [data-st-hb-button-hover-scale-num]')) {
      applyButtonHoverInputChange_(sectionEl, 'scale', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-hover-offset-y], [data-st-hb-button-hover-offset-y-num]')) {
      applyButtonHoverInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-color1]')) {
      saveButtonColor1_(t.value);
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-color2]')) {
      saveButtonColor2_(t.value);
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-gradient-angle], [data-st-hb-button-gradient-angle-num]')) {
      saveButtonGradientAngle_(t.value);
      applyButtonExtrasInputChange_(sectionEl);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mark-width], [data-st-hb-logo-mark-width-num]')) {
      saveLogoMarkWidth_(t.value);
      pushLogoLayoutFromInputs_();
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mark-height], [data-st-hb-logo-mark-height-num]')) {
      saveLogoMarkHeight_(t.value);
      pushLogoLayoutFromInputs_();
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-gap], [data-st-hb-logo-gap-num]')) {
      saveLogoGap_(t.value);
      pushLogoLayoutFromInputs_();
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-text-size], [data-st-hb-logo-text-size-num]')) {
      applyLogoTextMetricInputChange_(sectionEl, 'size', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-text-offset-x], [data-st-hb-logo-text-offset-x-num]')) {
      applyLogoTextMetricInputChange_(sectionEl, 'offsetX', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-text-offset-y], [data-st-hb-logo-text-offset-y-num]')) {
      applyLogoTextMetricInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-link-url]')) {
      saveLogoLinkUrl_(t.value);
      syncLogoLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:link:apply', { detail: collectLogoLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-link-url]')) {
      savePngLinkUrl_(t.value || '');
      syncPngLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:link:apply', { detail: collectPngLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-mobile-width], [data-st-hb-png-mobile-width-num]')) {
      savePngMobileWidth_(t.value);
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-mobile-height], [data-st-hb-png-mobile-height-num]')) {
      savePngMobileHeight_(t.value);
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-hover-opacity], [data-st-hb-png-hover-opacity-num]')) {
      applyPngHoverInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-hover-scale], [data-st-hb-png-hover-scale-num]')) {
      applyPngHoverInputChange_(sectionEl, 'scale', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-hover-offset-y], [data-st-hb-png-hover-offset-y-num]')) {
      applyPngHoverInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-color]')) {
      applyPngExtrasInputChange_(sectionEl, 'color', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-opacity], [data-st-hb-png-glow-opacity-num]')) {
      applyPngExtrasInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-blur], [data-st-hb-png-glow-blur-num]')) {
      applyPngExtrasInputChange_(sectionEl, 'blur', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-spread], [data-st-hb-png-glow-spread-num]')) {
      applyPngExtrasInputChange_(sectionEl, 'spread', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-mark-width], [data-st-hb-logo-mobile-mark-width-num]')) {
      saveLogoMobileMarkWidth_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-title-size], [data-st-hb-logo-mobile-title-size-num]')) {
      saveLogoMobileTitleSize_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-subtitle-size], [data-st-hb-logo-mobile-subtitle-size-num]')) {
      saveLogoMobileSubtitleSize_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-gap], [data-st-hb-logo-mobile-gap-num]')) {
      saveLogoMobileGap_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-hover-opacity], [data-st-hb-logo-hover-opacity-num]')) {
      applyLogoHoverInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-hover-scale], [data-st-hb-logo-hover-scale-num]')) {
      applyLogoHoverInputChange_(sectionEl, 'scale', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-hover-offset-y], [data-st-hb-logo-hover-offset-y-num]')) {
      applyLogoHoverInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
  });

  sectionEl.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t && t.matches && t.matches('[data-st-hb-button-text]')) {
      saveButtonText_(t.value || '');
      syncButtonInputs_(sectionEl);
      renderButtonPreview_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:text:apply', { detail: { text: loadButtonText_() } })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-link-url]')) {
      saveButtonLinkUrl_(t.value || '');
      syncButtonBehaviorUI_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:link:apply', { detail: collectButtonLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-link-newtab]')) {
      saveButtonLinkNewTab_(!!t.checked);
      syncButtonBehaviorUI_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:link:apply', { detail: collectButtonLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-label]')) {
      saveButtonMobileLabel_(t.value || '');
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-width], [data-st-hb-button-mobile-width-num]')) {
      saveButtonMobileWidth_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-label-size], [data-st-hb-button-mobile-label-size-num]')) {
      saveButtonMobileLabelSize_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-icon-size], [data-st-hb-button-mobile-icon-size-num]')) {
      saveButtonMobileIconSize_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-button-mobile-gap], [data-st-hb-button-mobile-gap-num]')) {
      saveButtonMobileGap_(t.value);
      syncButtonAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:button:adaptive:apply', { detail: collectButtonAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mark-width], [data-st-hb-logo-mark-width-num]')) {
      saveLogoMarkWidth_(t.value);
      pushLogoLayoutFromInputs_();
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mark-height], [data-st-hb-logo-mark-height-num]')) {
      saveLogoMarkHeight_(t.value);
      pushLogoLayoutFromInputs_();
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-gap], [data-st-hb-logo-gap-num]')) {
      saveLogoGap_(t.value);
      pushLogoLayoutFromInputs_();
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-text-size], [data-st-hb-logo-text-size-num]')) {
      applyLogoTextMetricInputChange_(sectionEl, 'size', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-text-offset-x], [data-st-hb-logo-text-offset-x-num]')) {
      applyLogoTextMetricInputChange_(sectionEl, 'offsetX', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-text-offset-y], [data-st-hb-logo-text-offset-y-num]')) {
      applyLogoTextMetricInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-link-url]')) {
      saveLogoLinkUrl_(t.value);
      syncLogoLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:link:apply', { detail: collectLogoLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-link-newtab]')) {
      saveLogoLinkNewTab_(!!t.checked);
      syncLogoLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:link:apply', { detail: collectLogoLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-link-url]')) {
      savePngLinkUrl_(t.value || '');
      syncPngLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:link:apply', { detail: collectPngLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-link-newtab]')) {
      savePngLinkNewTab_(!!t.checked);
      syncPngLinkUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:link:apply', { detail: collectPngLinkDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-mobile-width], [data-st-hb-png-mobile-width-num]')) {
      savePngMobileWidth_(t.value);
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-mobile-height], [data-st-hb-png-mobile-height-num]')) {
      savePngMobileHeight_(t.value);
      syncPngAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:png:adaptive:apply', { detail: collectPngAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-hover-opacity], [data-st-hb-png-hover-opacity-num]')) {
      applyPngHoverInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-hover-scale], [data-st-hb-png-hover-scale-num]')) {
      applyPngHoverInputChange_(sectionEl, 'scale', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-hover-offset-y], [data-st-hb-png-hover-offset-y-num]')) {
      applyPngHoverInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-color]')) {
      applyPngExtrasInputChange_(sectionEl, 'color', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-opacity], [data-st-hb-png-glow-opacity-num]')) {
      applyPngExtrasInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-blur], [data-st-hb-png-glow-blur-num]')) {
      applyPngExtrasInputChange_(sectionEl, 'blur', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-png-glow-spread], [data-st-hb-png-glow-spread-num]')) {
      applyPngExtrasInputChange_(sectionEl, 'spread', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-mark-width], [data-st-hb-logo-mobile-mark-width-num]')) {
      saveLogoMobileMarkWidth_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-title-size], [data-st-hb-logo-mobile-title-size-num]')) {
      saveLogoMobileTitleSize_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-subtitle-size], [data-st-hb-logo-mobile-subtitle-size-num]')) {
      saveLogoMobileSubtitleSize_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-mobile-gap], [data-st-hb-logo-mobile-gap-num]')) {
      saveLogoMobileGap_(t.value);
      syncLogoAdaptiveUi_(sectionEl);
      try { window.dispatchEvent(new CustomEvent('st:header-insert:logo:adaptive:apply', { detail: collectLogoAdaptiveDetail_() })); } catch (e) {}
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-hover-opacity], [data-st-hb-logo-hover-opacity-num]')) {
      applyLogoHoverInputChange_(sectionEl, 'opacity', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-hover-scale], [data-st-hb-logo-hover-scale-num]')) {
      applyLogoHoverInputChange_(sectionEl, 'scale', t.value);
      return;
    }
    if (t && t.matches && t.matches('[data-st-hb-logo-hover-offset-y], [data-st-hb-logo-hover-offset-y-num]')) {
      applyLogoHoverInputChange_(sectionEl, 'offsetY', t.value);
      return;
    }
  });

  // керування відкриттям секції
  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn && !headerBtn.__st_bound) {
    headerBtn.__st_bound = true;
    headerBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      const isOpen = sectionEl.classList.contains('is-open');
      ensureOpen(sectionEl, !isOpen);
    });
  }

  // Події відкриття/закриття з Header Builder
  if (!window.__ST_HB_INSERT_WIDGET_BINDED__) {
    window.__ST_HB_INSERT_WIDGET_BINDED__ = true;

    window.addEventListener('st:header-insert:open', () => {
      try {
        // якщо користувач відкрив у вкладці не "Дизайн" — нічого не ламаємо, просто відкриваємось.
        ensureOpen(document.getElementById(SEC_ID), true);
        document.getElementById(SEC_ID)?.scrollIntoView?.({ block: 'nearest' });
      } catch (e) {}
    });

    window.addEventListener('st:header-insert:close', () => {
      try {
        ensureOpen(document.getElementById(SEC_ID), false);
      } catch (e) {}
    });

    // Фокус "тільки Текст" у режимі дизайну (для шапки)
    window.addEventListener('st:design:focus-text-widget', () => {
      try {
        if (!document.body.classList.contains('st-header-builder-on')) return;
        if (!document.body.classList.contains('st-hb-text-only-on')) return;

        const designPanel = document.getElementById('design-panel') || document.querySelector('#design-panel');
        if (!designPanel) return;

        const sections = Array.from(designPanel.querySelectorAll('.design-section'));
        // знайти секцію "Текст"
        const textSec = sections.find(sec => {
          const t = sec.querySelector('.design-section__header-title span');
          return t && (t.textContent || '').trim() === 'Текст';
        }) || null;

        // ховаємо все, крім "Текст"
        for (const sec of sections) {
          if (textSec && sec !== textSec) sec.style.display = 'none';
          else sec.style.display = '';
        }

        if (textSec) {
          // відкрити
          textSec.classList.add('is-open');
          const body = textSec.querySelector('.design-section__body');
          if (body) body.style.display = '';
          // фокус на перший контрол
          const focusEl = textSec.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusEl) focusEl.focus();
          textSec.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      } catch (e) {}
    });

    // Фокус "тільки Меню" у режимі дизайну (для шапки)
    window.addEventListener('st:design:focus-menu-widget', () => {
      try {
        if (!document.body.classList.contains('st-header-builder-on')) return;
        if (!document.body.classList.contains('st-hb-menu-only-on')) return;

        const designPanel = document.getElementById('design-panel') || document.querySelector('#design-panel');
        if (!designPanel) return;

        const sections = Array.from(designPanel.querySelectorAll('.design-section'));
        const menuSec = sections.find(sec => {
          const t = sec.querySelector('.design-section__header-title span');
          return t && (t.textContent || '').trim() === 'Меню';
        }) || null;

        for (const sec of sections) {
          if (menuSec && sec !== menuSec) sec.style.display = 'none';
          else sec.style.display = '';
        }

        if (menuSec) {
          menuSec.classList.add('is-open');
          const body = menuSec.querySelector('.design-section__body');
          if (body) body.style.display = '';

          const focusEl = menuSec.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusEl) focusEl.focus();
          menuSec.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      } catch (e) {}
    });

    // Фокус "тільки Іконка" у режимі дизайну (для шапки)
    window.addEventListener('st:design:focus-icon-widget', () => {
      try {
        if (!document.body.classList.contains('st-header-builder-on')) return;
        if (!document.body.classList.contains('st-hb-icon-only-on')) return;

        const designPanel = document.getElementById('design-panel') || document.querySelector('#design-panel');
        if (!designPanel) return;

        const sections = Array.from(designPanel.querySelectorAll('.design-section'));

        // спочатку шукаємо "Іконка — Стилі", якщо немає — "Іконки"
        const iconSec = sections.find(sec => {
          const t = sec.querySelector('.design-section__header-title span') || sec.querySelector('.design-section__header-title');
          const txt = (t && (t.textContent || '').trim()) || '';
          return txt === 'Іконка — Стилі' || txt === 'Іконки' || txt.startsWith('Іконка');
        }) || null;

        for (const sec of sections) {
          if (iconSec && sec !== iconSec) sec.style.display = 'none';
          else sec.style.display = '';
        }

        if (iconSec) {
          iconSec.classList.add('is-open');
          const body = iconSec.querySelector('.design-section__body');
          if (body) body.style.display = '';

          const focusEl = iconSec.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusEl) focusEl.focus();
          iconSec.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
      } catch (e) {}
    });

  }

  // якщо режим вставки вже активний — одразу відкрити
  if (document.body.classList.contains('st-header-builder-on') && document.body.classList.contains('st-hb-insert-on')) {
    ensureOpen(sectionEl, true);
  }
}

export { initHeaderInsertWidget };