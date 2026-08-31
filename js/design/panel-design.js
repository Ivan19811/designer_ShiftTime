// js/design/panel-design.js
// Головна панель "Дизайн" — підтягує окремі віджети (Розмітка, Заливка, Фон сторінки, Дерево тощо)

import { initLayoutWidget } from './layout-widget.js';
import { initSizeWidget } from './widgets/size/size-widget.js';
import { initPlaceholderWidget } from './placeholder-widget.js';
import { initPageTreeWidget } from './widgets/page-tree/page-tree-widget-01021.js?v=01021';
import { initPageBackgroundWidget } from './widgets/page-background/page-background-widget.js';
import { initFillWidget } from './widgets/fill/fill-widget-01013.js?v=01031';
import { initBorderWidget } from './widgets/border-widget/border-widget.js';
import { initShadowsWidget } from './widgets/shadows/shadows-widget.js';
import { initLayersWidget } from './widgets/layers/layers-widget.js';
import { initSpecialEffectsWidget } from './widgets/special-effects/special-effects-widget-01019.js?v=01019';
import { initGalleryWidget } from './widgets/gallery-widget/gallery-widget.js?v=00956';
import { initLibraryWidget } from './widgets/library/library-widget.js';
import { initPageAssemblyInspector01029 } from '../page-assembly/page-assembly-01028.js?v=01033';
import { initTemplatesWidget } from './widgets/templates/templates-widget.js?v=01029';
import { initTextWidget } from './widgets/text/text-widget.js';
import { initArticleWidget } from './widgets/article/article-widget.js';
import { initSiteHeaderWidget } from './widgets/site-header/site-header-widget.js';
import { initSiteFooterWidget } from './widgets/site-footer/site-footer-widget.js';
import { initHeaderInsertWidget } from './widgets/site-header/header-insert-widget.js';
import { initFooterInsertWidget } from './widgets/site-footer/footer-insert-widget.js';
import { initIconsWidget } from './widgets/icons/icons-widget.js';
import { initIconStylesWidget } from './widgets/icons/icon-styles-widget.js';
import { initHeaderFooterMenuWidget } from './widgets/menu/header-footer-menu-widget.js';
import { initMenuBuilderAccordionWidget } from './widgets/menu-builder/menu-builder-accordion-widget.js';
import { initAnimatorAccordionWidget } from './widgets/animator/animator-accordion-widget.js';
import { initAiTemplatesAccordionWidget } from './widgets/ai-templates/ai-templates-accordion-widget.js';
import { initVoiceCommandWidget } from './widgets/voice-command/voice-command-widget.js';
import { initProductSearchWidget } from './widgets/product-search/product-search-widget.js';
import { initShopAccordionWidget } from './widgets/shop/shop-accordion-widget.js?v=01064';
import { initPhotoGalleryWidget } from './widgets/photo-gallery/photo-gallery-widget.js';
import { initElementInfoWidget } from './widgets/element-info/element-info-widget-01009.js?v=01009';



// 00885: template gallery open authority lives in builder-init + workspace module.

const SECTIONS_STATE_KEY = 'st_design_sections_state_v1';
const LAST_SECTION_KEY = 'st_design_last_open_section_v1';
const ACCORDION_SINGLE_MODE_KEY = 'st_design_accordion_single_mode_v1';

function isAccordionSingleMode() {
  try { return window.localStorage.getItem(ACCORDION_SINGLE_MODE_KEY) === '1'; } catch (_) { return false; }
}

function setAccordionSingleMode(enabled) {
  try {
    if (enabled) window.localStorage.setItem(ACCORDION_SINGLE_MODE_KEY, '1');
    else window.localStorage.removeItem(ACCORDION_SINGLE_MODE_KEY);
  } catch (e) {
    console.warn('[design-panel] Не вдалося зберегти режим акордеонів', e);
  }
}

function loadSectionsState() {
  try {
    const raw = window.localStorage.getItem(SECTIONS_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn('[design-panel] Не вдалося прочитати стан секцій', e);
    return {};
  }
}

function saveSectionsState(state) {
  try {
    window.localStorage.setItem(SECTIONS_STATE_KEY, JSON.stringify(state || {}));
  } catch (e) {
    console.warn('[design-panel] Не вдалося зберегти стан секцій', e);
  }
}


function normalizeSectionIdTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’'`ʼ]/g, '')
    .replace(/[^a-zа-яіїєґ0-9]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section';
}

function getSectionStableId(sec, index) {
  const headerTitle = sec?.querySelector?.('.design-section__header-title, .design-section__header, h2, h3')?.textContent || '';
  const titleId = normalizeSectionIdTitle(headerTitle);
  return titleId ? `design-sec-${titleId}` : `design-sec-${index + 1}`;
}

function loadLastOpenSectionId() {
  try { return window.localStorage.getItem(LAST_SECTION_KEY) || ''; } catch (_) { return ''; }
}

function saveLastOpenSectionId(id) {
  try {
    if (id) window.localStorage.setItem(LAST_SECTION_KEY, id);
    else window.localStorage.removeItem(LAST_SECTION_KEY);
  } catch (e) {
    console.warn('[design-panel] Не вдалося зберегти останню відкриту секцію', e);
  }
}


function initAccordionModeToggle(host) {
  const settingsHeader = document.querySelector('.builder__settings-header');
  if (!settingsHeader || settingsHeader.dataset.accordionModeBound === '1') return;
  settingsHeader.dataset.accordionModeBound = '1';

  const expandBtn = settingsHeader.querySelector('[data-action="toggle-inspector-expand"]');
  const closeBtn = settingsHeader.querySelector('[data-action="close-settings"]');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'builder__settings-accordion-mode';
  btn.setAttribute('aria-label', 'Режим акордеонів інспектора');
  btn.setAttribute('title', '');
  btn.innerHTML = '★';

  // Tooltip робимо порталом у document.body, а не дочірнім елементом кнопки.
  // Причина: правий інспектор/акордеони створюють власні stacking/overflow-контексти,
  // і звичайний tooltip всередині кнопки може потрапляти під акордеони.
  const oldTooltip = document.getElementById('st-design-accordion-mode-tip');
  if (oldTooltip) oldTooltip.remove();

  const tooltip = document.createElement('div');
  tooltip.id = 'st-design-accordion-mode-tip';
  tooltip.className = 'builder__settings-accordion-tip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.innerHTML = `
    <div class="builder__settings-accordion-tip-title">Режим акордеонів</div>
    <div><b>Сіра зірка</b> — звичайний режим: можна відкрити кілька акордеонів одночасно. Кожен пункт закривається тільки повторним кліком по ньому.</div>
    <div><b>Жовта зірка</b> — одиночний режим: коли відкриваєш новий акордеон, попередній автоматично закривається.</div>
  `;
  document.body.appendChild(tooltip);

  let tooltipTimer = null;

  const positionTooltip = () => {
    const rect = btn.getBoundingClientRect();
    const gap = 10;
    const margin = 12;

    tooltip.style.maxWidth = `${Math.max(260, window.innerWidth - margin * 2)}px`;

    // Спочатку показуємо невидимо, щоб браузер порахував реальний розмір.
    const wasVisible = tooltip.classList.contains('is-visible');
    if (!wasVisible) {
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
      tooltip.classList.add('is-measuring');
    }

    const tipRect = tooltip.getBoundingClientRect();
    const width = tipRect.width || Math.min(360, window.innerWidth - margin * 2);
    const height = tipRect.height || 160;

    let left = Math.min(window.innerWidth - width - margin, Math.max(margin, rect.right - width));
    let top = rect.bottom + gap;

    // Якщо знизу не влазить — показуємо над кнопкою.
    if (top + height + margin > window.innerHeight) {
      top = Math.max(margin, rect.top - height - gap);
    }

    tooltip.style.left = `${Math.round(left)}px`;
    tooltip.style.top = `${Math.round(top)}px`;

    if (!wasVisible) {
      tooltip.classList.remove('is-measuring');
      tooltip.style.visibility = '';
      tooltip.style.opacity = '';
    }
  };

  const showTooltip = () => {
    clearTimeout(tooltipTimer);
    tooltipTimer = window.setTimeout(() => {
      positionTooltip();
      tooltip.classList.add('is-visible');
      tooltip.setAttribute('aria-hidden', 'false');
    }, 3000);
  };

  const hideTooltip = () => {
    clearTimeout(tooltipTimer);
    tooltipTimer = null;
    tooltip.classList.remove('is-visible');
    tooltip.setAttribute('aria-hidden', 'true');
  };

  btn.addEventListener('mouseenter', showTooltip);
  btn.addEventListener('mouseleave', hideTooltip);
  btn.addEventListener('focus', showTooltip);
  btn.addEventListener('blur', hideTooltip);
  window.addEventListener('scroll', () => { if (tooltip.classList.contains('is-visible')) positionTooltip(); }, true);
  window.addEventListener('resize', () => { if (tooltip.classList.contains('is-visible')) positionTooltip(); });

  const applyState = () => {
    const single = isAccordionSingleMode();
    btn.classList.toggle('is-single', single);
    btn.setAttribute('aria-pressed', single ? 'true' : 'false');
    btn.dataset.mode = single ? 'single' : 'multi';
  };

  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    hideTooltip();
    const next = !isAccordionSingleMode();
    setAccordionSingleMode(next);
    applyState();

    // Якщо користувач увімкнув одиночний режим — залишаємо відкритою останню активну секцію,
    // або першу відкриту, а всі інші згортаємо одразу, щоб DOM і localStorage не конфліктували.
    if (next && host) {
      const sections = Array.from(host.querySelectorAll('.design-section'));
      const lastId = loadLastOpenSectionId();
      const active = sections.find(sec => sec.dataset.sectionId === lastId && sec.classList.contains('is-open'))
        || sections.find(sec => sec.classList.contains('is-open'))
        || null;
      const current = loadSectionsState();
      sections.forEach((sec) => {
        const open = sec === active;
        sec.classList.toggle('is-open', open);
        const body = sec.querySelector('.design-section__body');
        if (body) body.hidden = !open;
        if (sec.dataset.sectionId) current[sec.dataset.sectionId] = open;
      });
      saveLastOpenSectionId(active?.dataset?.sectionId || '');
      saveSectionsState(current);
    }
  });

  applyState();

  // Ставимо зірочку перед зеленою/червоною кнопкою розширення, як просив користувач.
  if (expandBtn) settingsHeader.insertBefore(btn, expandBtn);
  else if (closeBtn) settingsHeader.insertBefore(btn, closeBtn);
  else settingsHeader.appendChild(btn);
}

function initSectionsPersistence(host) {
  if (!host) return;

  const sections = Array.from(host.querySelectorAll('.design-section'));
  if (!sections.length) return;

  let state = loadSectionsState();
  const isFirstRun = !state || Object.keys(state).length === 0;

  // Якщо ще немає стану — за замовчуванням усі секції ЗАКРИВАЄМО.
  if (isFirstRun) {
    sections.forEach(sec => {
      sec.classList.remove('is-open');
    });
  }

  const lastOpenSectionId = loadLastOpenSectionId();
  const singleMode = isAccordionSingleMode();

  // Призначаємо стабільні id і відновлюємо стан (якщо є).
  sections.forEach((sec, index) => {
    const legacyId = sec.dataset.sectionId || `design-sec-${index + 1}`;
    if (!sec.dataset.sectionId || /^design-sec-\d+$/u.test(sec.dataset.sectionId)) {
      sec.dataset.sectionId = getSectionStableId(sec, index);
    }
    const id = sec.dataset.sectionId;
    const stored = state && Object.prototype.hasOwnProperty.call(state, id)
      ? !!state[id]
      : (state && Object.prototype.hasOwnProperty.call(state, legacyId) ? !!state[legacyId] : null);

    if (singleMode && lastOpenSectionId) {
      // Жовта зірка: одиночний режим. Після reload відкриваємо тільки останній пункт.
      sec.classList.toggle('is-open', id === lastOpenSectionId || legacyId === lastOpenSectionId);
    } else if (!singleMode && stored !== null) {
      // Сіра зірка: звичайний режим. Відновлюємо всі відкриті/закриті акордеони.
      sec.classList.toggle('is-open', stored);
    } else if (singleMode && stored !== null && !lastOpenSectionId) {
      sec.classList.toggle('is-open', stored);
    } else if (!isFirstRun) {
      // Якщо localStorage старий і не збігається з новими стабільними id — не даємо “Фон сторінки” відкриватись сам по default is-open.
      sec.classList.remove('is-open');
    }

    const header = sec.querySelector('.design-section__header');
    const body   = sec.querySelector('.design-section__body');

    // ✅ Завжди синхронізуємо DOM зі станом (щоб акордеон складався повністю).
    if (body) body.hidden = !sec.classList.contains('is-open');

    // ✅ ЄДИНЕ місце, де керуємо акордеоном секцій у панелі "Дизайн".
    // Причина: окремі віджети мають власні click-хендлери і інколи виникає
    // "півзакриття" або подвійне перемикання. Тут робимо стабільно.
    if (header && !header.dataset.sectionsStateBound) {
      header.dataset.sectionsStateBound = '1';

      // Використовуємо capture + stopImmediatePropagation, щоб не було подвійного toggle.
      header.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopImmediatePropagation();

        const willOpen = !sec.classList.contains('is-open');
        sec.classList.toggle('is-open', willOpen);

        if (body) body.hidden = !willOpen;

        const current = loadSectionsState();
        const singleNow = isAccordionSingleMode();

        if (singleNow) {
          // Жовта зірка: старий режим — відкритий тільки один акордеон.
          sections.forEach((item) => {
            const itemId = item.dataset.sectionId;
            const isItemOpen = item === sec ? willOpen : false;
            item.classList.toggle('is-open', isItemOpen);
            const itemBody = item.querySelector('.design-section__body');
            if (itemBody) itemBody.hidden = !isItemOpen;
            if (itemId) current[itemId] = isItemOpen;
          });
          saveLastOpenSectionId(willOpen ? id : '');
        } else {
          // Сіра зірка: нормальний режим — інші акордеони не чіпаємо.
          if (id) current[id] = willOpen;
          saveLastOpenSectionId(willOpen ? id : loadLastOpenSectionId());
        }

        saveSectionsState(current);
      }, true);
    }
  });

  // Якщо це перший запуск — фіксуємо поточний стан як базовий.
  if (isFirstRun) {
    state = {};
    sections.forEach(sec => {
      const id = sec.dataset.sectionId;
      state[id] = sec.classList.contains('is-open');
    });
    saveSectionsState(state);
  }
}

export function initDesignPanel() {
  const panelRoot = document.getElementById('design-panel-root');
  if (!panelRoot) return;

  // Основний контейнер всередині секції "Дизайн"
  const host = panelRoot.querySelector('#design-panel') || panelRoot;

  initAccordionModeToggle(host);

  // ---- Як беремо поточне виділення на полотні ----
  function getSelection() {
  if (window.ST_SELECTION && typeof window.ST_SELECTION.get === 'function') {
    return window.ST_SELECTION.get();
  }

  try {
    // ✅ 00453: HEADER/FOOTER selection must be symmetrical.
    // Раніше getSelection() завжди перевіряв Header першим. Якщо у шапці
    // залишався stale .is-active/.is-selected, усі віджети дизайну (зокрема
    // «Розмітка») продовжували редагувати Header навіть під час роботи з Footer.
    // Тепер пріоритет бере активний builder/scope, а Header/Footer мають один
    // формат повернення selection: { type, element, el, elements }.
    const preferredScope00453 = (() => {
      try {
        if (document.body.classList.contains('st-footer-builder-on')) return 'footer';
        if (document.body.classList.contains('st-header-builder-on')) return 'header';
      } catch (_) {}
      try {
        const s = String(window.__ST_DESIGN_ACTIVE_SCOPE_00453 || window.__ST_LAYOUT_ACTIVE_SCOPE_00451 || '');
        if (s === 'footer' || s === 'header') return s;
      } catch (_) {}
      return '';
    })();

    function makeScopedSelection00453_(type, el, slotKey, slot) {
      if (!el) return null;
      const out = { type, element: el, el, elements: [el] };
      if (slotKey && slot) out[slotKey] = slot;
      return out;
    }

    function resolveHeaderFooterSelection00453_(scopeName) {
      const isFooter = scopeName === 'footer';
      const slotId = isFooter ? 'st-site-footer-slot' : 'st-site-header-slot';
      const panelSel = '.hb-panel';
      const innerType = isFooter ? 'footer-inner' : 'header-inner';
      const rootType = isFooter ? 'footer' : 'header';
      const slotKey = isFooter ? 'footerSlot' : 'headerSlot';
      const slot = document.getElementById(slotId);
      if (!slot) return null;

      // Найвищий пріоритет: елемент, який Header/Footer Builder явно передав
      // у дизайн-віджети. Це прибирає залежність від stale selection у сусідньому компоненті.
      try {
        const forced = window.__ST_DESIGN_ACTIVE_EL_00453 || window.__ST_LAYOUT_ACTIVE_EL_00453;
        if (forced instanceof HTMLElement && slot.contains(forced) && !forced.closest(panelSel)) {
          return makeScopedSelection00453_(innerType, forced, slotKey, slot);
        }
      } catch (_) {}

      const innerActive = Array.from(slot.querySelectorAll('.is-active, .hb-dom-active'))
        .filter(el => !el.closest(panelSel))[0] || null;
      if (innerActive) return makeScopedSelection00453_(innerType, innerActive, slotKey, slot);

      const innerSelected = Array.from(slot.querySelectorAll('.is-selected, .hb-dom-selected'))
        .filter(el => !el.closest(panelSel));
      if (innerSelected.length) return makeScopedSelection00453_(innerType, innerSelected[0], slotKey, slot);

      if (slot.classList.contains('is-active')) {
        if (document.body.classList.contains(isFooter ? 'st-footer-builder-on' : 'st-header-builder-on')) {
          const root = Array.from(slot.children).find(ch => !(ch && ch.classList && ch.classList.contains('hb-panel')));
          if (root) return makeScopedSelection00453_(rootType, root, slotKey, slot);
        }
        return makeScopedSelection00453_(rootType, slot, slotKey, slot);
      }
      return null;
    }

    if (preferredScope00453 === 'footer') {
      const fs = resolveHeaderFooterSelection00453_('footer');
      if (fs) return fs;
      const hs = resolveHeaderFooterSelection00453_('header');
      if (hs) return hs;
    } else if (preferredScope00453 === 'header') {
      const hs = resolveHeaderFooterSelection00453_('header');
      if (hs) return hs;
      const fs = resolveHeaderFooterSelection00453_('footer');
      if (fs) return fs;
    } else {
      // Старий порядок для звичайного режиму, але через спільний resolver.
      const hs = resolveHeaderFooterSelection00453_('header');
      if (hs) return hs;
      const fs = resolveHeaderFooterSelection00453_('footer');
      if (fs) return fs;
    }

    return null;
  } catch (e) {
    console.warn('[DesignPanel] getSelection error:', e);
    return null;
  }
}

  // 1) Розмітка активних блоків / секцій
  initLayoutWidget(host, getSelection);

  // 1.1) Розміри (W/H) — Auto/Fill/Hug/Custom + Min/Max
  initSizeWidget(host, getSelection);

  // 2) Заливка (фон/градієнт/картинка) для вибраних елементів
  initFillWidget(host, getSelection);

  // 3) Бордери: рамка / радіуси / стилі / колір
  initBorderWidget(host, getSelection);

  // 4) Тінь / Глибина — глобальний віджет тіней
  initShadowsWidget(host, getSelection);

  // 4.1) Слої / межі / overflow / z-index
  try { initLayersWidget(host, getSelection); } catch(e) { console.warn('[design-panel] Layers init failed:', e); }

  // 4.2) Спецефекти: фоновий слайдер, анімації, привʼязка блоків до слайдів
  try { initSpecialEffectsWidget(host, getSelection); } catch(e) { console.warn('[design-panel] SpecialEffects init failed:', e); }

  // 5) Фон поточної сторінки (працює з #site-canvas)
  initPageBackgroundWidget(host);

  // 6) Дерево сторінки
  initPageTreeWidget(host, getSelection);

   // 7) Галерея (Картинки / Логотип / Іконки)
  initGalleryWidget(host);
  // 7.1) Бібліотека статей
  initLibraryWidget(host);

  // 7.2) Сторінка — збірка Header/Main/Footer. Стоїть саме під Бібліотекою
  // і над акордеоном Шаблони, як частина головного інспектора Дизайну.
  try { initPageAssemblyInspector01029(host); } catch(e) { console.warn('[design-panel] Page Assembly 01029 init failed:', e); }

  // 8) Шаблони
   initTemplatesWidget(host);

  // 00885: st:open-templates-gallery має єдиного глобального слухача у builder-init.


  // 9) Майбутні групи налаштувань — поки як заглушки
  initTextWidget(host, getSelection);


  




  // 10) Стаття — редактор (MVP)
  initArticleWidget(host, getSelection);

  // 10.1) Вставка стандартних блоків у ШАПКУ (поки заглушка-інспектор)
  // Показується тільки в режимі Header Builder та тільки коли користувач натискає "Додати блок".
  initHeaderInsertWidget(host);
  // 10.2) Вставка стандартних блоків у ФУТЕР.
  // Показується тільки в режимі Footer Builder та тільки коли користувач натискає "Додати блок".
  initFooterInsertWidget(host);

  // 11) Іконки — вставка IconBlock з Галереї
  initIconsWidget(host, getSelection);
  try { initIconStylesWidget(host, getSelection); } catch(e) {}

  // 12) Меню (Шапка/Футер): Big Menu + Burger Menu
  try { initHeaderFooterMenuWidget(host, getSelection); } catch(e) {}

  // 13) Акордеон "Конструктор меню" — завжди в кінці інспектора
  // (логіка відкриття Menu Builder буде підʼєднана на наступних етапах)
  try { initMenuBuilderAccordionWidget(host, getSelection); } catch(e) {}

  // 14) Акордеон "Анімація" — під "Конструктор меню"
  try { initAnimatorAccordionWidget(host, getSelection); } catch(e) {}

  // 15) Акордеон "Шаблони AI" — після Анімації
  try { initAiTemplatesAccordionWidget(host, getSelection); } catch(e) {}

  // 16) Голосові команди — окремий автономний шар: voice -> text -> AI Templates.
  try { initVoiceCommandWidget(host); } catch(e) { console.warn('[design-panel] VoiceCommand init failed:', e); }

  // 16.1) Пошук товарів — блок для header/footer + логіка майбутнього каталогу.
  try { initProductSearchWidget(host, getSelection); } catch(e) { console.warn('[design-panel] ProductSearch init failed:', e); }

  // 16.2) Магазин — спеціалізовані секції з карточками категорій і товарів.
  try { initShopAccordionWidget(host, getSelection); } catch(e) { console.warn('[design-panel] ShopAccordion init failed:', e); }

  // 16.3) Фотогалерея — секція з меню категорій і placeholder-фото.
  try { initPhotoGalleryWidget(host, getSelection); } catch(e) { console.warn('[design-panel] PhotoGallery init failed:', e); }

  // 16.4) Інформація елемента — останній акордеон. Читає точний SiteFrameStore JSON активного node.
  try { initElementInfoWidget(host, getSelection); } catch(e) { console.warn('[design-panel] ElementInfo init failed:', e); }

  // 8) Памʼять стану акордеонів "Дизайну"
  initSectionsPersistence(host);

  // 9) Віджет "Шапка сайту"
 
  initSiteHeaderWidget();
  initSiteFooterWidget();



}
