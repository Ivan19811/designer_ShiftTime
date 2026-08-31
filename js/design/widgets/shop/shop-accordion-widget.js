import {
  PRODUCT_CARD_CONTRACT_VERSION_01038,
  CATEGORY_CARD_CONTRACT_VERSION_01050,
  PRODUCT_CARD_ROLE_DEFS_01038,
  CATEGORY_CARD_ROLE_DEFS_01050,
  COMMERCE_CARD_ROLE_DEFS_01050,
  getCommerceCardRoleDefs01050,
  getCommerceCardType01050,
  resolveCommerceCardRoot01050,
  resolveCommerceCardRole01050,
  validateCommerceCardContract01050,
  resolveProductCardRoot01038,
  resolveProductCardRole01038,
  validateProductCardContract01038
} from './product-card-contract-01038.js?v=01050';
import { productCardImageWidgetHtml01039, bindProductCardImageWidget01039 } from './product-card-image-widget-01039.js?v=01050';
import { productCardTextContentWidgetHtml01042, bindProductCardTextContentWidget01042 } from './product-card-text-content-widget-01042.js?v=01050';
import { productCardPriceWidgetHtml01043, bindProductCardPriceWidget01043 } from './product-card-price-widget-01043.js?v=01050';
import { productCardBadgeWidgetHtml01044, bindProductCardBadgeWidget01044 } from './product-card-badge-widget-01044.js?v=01050';
import { productCardActionsWidgetHtml01045, bindProductCardActionsWidget01045 } from './product-card-actions-widget-01045.js?v=01050';
import { productCardLayoutWidgetHtml01046, bindProductCardLayoutWidget01046 } from './product-card-layout-widget-01046.js?v=01050';
import { bindProductCardFloatingPanel01049 } from './product-card-floating-panel-01049.js?v=01064';
import { categoryCardDataWidgetHtml01050, bindCategoryCardDataWidget01050 } from './category-card-data-widget-01050.js?v=01050';
import { commerceCardBindingWidgetHtml01067, bindCommerceCardBindingWidget01067 } from './commerce-card-binding-widget-01067.js?v=01067';
import './commerce-card-data-binding-01050.js?v=01050';


// [00374][TEMPLATE GALLERY][AUTO OPEN BRIDGE]
// Відкриття галереї йде через bridge, який сам чекає lazy-import і дорендерює перше відкриття.
function openTemplatesGalleryManager(tab, options = {}) {
  import('../templates/templates-gallery-open-bridge.js?v=01050')
    .then((mod) => {
      const fn = mod.openTemplatesGalleryManager || mod.openTemplatesGalleryWithBridge;
      if (typeof fn === 'function') fn(tab || 'site', options || {});
    })
    .catch((err) => console.warn('[00374][gallery bridge] lazy templates gallery failed:', err));
}

// js/design/widgets/shop/shop-accordion-widget.js
// Акордеон "Магазин".
// 01049: Product Card Inspector + role toggles + draggable/resizable floating presentation shell.
// - Product Card є Store-owned компонентом усередині Main, а не окремим Main-шаблоном;
// - Category/Product Page legacy actions залишаються окремими майбутніми міграціями;
// - Product Card add/replace йде тільки через SiteFrameStore authority;
// - інструкції винесені у велике hover-вікно з затримкою 3 секунди;
// - дизайн карточок відкривається через папку "Магазин" у галереї шаблонів.


const SEC_ID = 'st-shop-accordion-section';
const STATE_KEY = 'st_shop_accordion_sub_state_v2_01038';
const PRODUCT_ROLE_STATE_KEY = 'st_shop_product_card_role_v1_01038';
const PRODUCT_WIDGET_FONT_SCALE_KEY_01048 = 'st_shop_product_card_widget_font_scale_v1_01048';
const COMMERCE_CARD_MODE_KEY_01050 = 'st_shop_commerce_card_inspector_mode_v1_01050';
const PRODUCT_ROLE_TOGGLE_BINDINGS_01048 = Object.freeze({
  media: '[data-pimg="visible"]',
  image: '[data-pimg="visible"]',
  'image-secondary': '[data-pimg="hover2"]',
  badge: '[data-pbadge="visible"]',
  body: '[data-ptext="body-visible"]',
  brand: '[data-ptext="brand-visible"]',
  title: '[data-ptext="title-visible"]',
  rating: '[data-ptext="rating-visible"]',
  'reviews-count': '[data-ptext="reviews-visible"]',
  description: '[data-ptext="description-visible"]',
  'price-group': '[data-pprice="group-visible"]',
  'price-current': '[data-pprice="current-visible"]',
  'price-old': '[data-pprice="old-visible"]',
  discount: '[data-pprice="discount-visible"]',
  stock: '[data-ptext="stock-visible"]',
  actions: '[data-paction-block-visible]',
  'add-to-cart': '[data-paction-role="add-to-cart"][data-paction="visible"]',
  'buy-now': '[data-paction-role="buy-now"][data-paction="visible"]',
  wishlist: '[data-paction-role="wishlist"][data-paction="visible"]',
  compare: '[data-paction-role="compare"][data-paction="visible"]',
  'quick-view': '[data-paction-role="quick-view"][data-paction="visible"]'
});

const CATEGORY_ROLE_TOGGLE_BINDINGS_01050 = Object.freeze({
  media: '[data-pimg="visible"]',
  image: '[data-pimg="visible"]',
  'image-secondary': '[data-pimg="hover2"]',
  badge: '[data-pbadge="visible"]',
  body: '[data-ptext="body-visible"]',
  title: '[data-ptext="title-visible"]',
  description: '[data-ptext="description-visible"]',
  'category-products-count': '[data-pcat="count-visible"]',
  'category-price': '[data-pcat="price-visible"]',
  'category-feature': '[data-pcat="feature-visible"]',
  'category-extra': '[data-pcat="extras-visible"]',
  'category-subcategories': '[data-pcat="subcategories-visible"]',
  'category-icon': '[data-pcat="icon-visible"]',
  actions: '[data-pcat="cta-visible"]',
  'category-open': '[data-pcat="cta-visible"]'
});

const TOOLTIP_ID = 'st-shop-help-tooltip-00322';
const HELP_DELAY_MS = 3000;

const SHOP_HELP_TEXT = `Магазин

Commerce Card Inspector тепер спільний для двох типів:
• Карточка товару;
• Карточка категорії.

Перемикач не створює другу копію налаштувань. Фото, текст, Badge, Layout, floating-вікно та Store-persistence спільні. Product-only і Category-only блоки просто показуються відповідно до активного режиму.

Якщо вибрати готову карточку на Canvas, режим перемикається автоматично. Якщо вручну перейти на інший тип, рамка стає нейтральною — це означає, що режим Inspector не відповідає вибраному componentType. Через галерею можна замінити одну commerce-карточку на інший тип однією Store-транзакцією.

Category Card має ключі даних для XML/таблиці, ціну категорії, кількість товарів, характеристику, підкатегорії та до 10 додаткових інформаційних блоків.`;

const CATEGORY_HELP_TEXT = `Карточка категорії

Додає секцію з одним спеціалізованим блоком категорії.

У карточці є:
• фото категорії;
• назва категорії;
• короткий опис;
• кнопка переходу.

Дизайн карточки можна буде змінювати через стандартні віджети конструктора: текст, колір, тінь, радіус, відступи, розмір фото, вирівнювання.`;

const PRODUCT_HELP_TEXT = `Commerce Card

Один Inspector керує карточкою товару або карточкою категорії.

Спільні віджети:
• Фото;
• Назва й короткий опис;
• Badge;
• Layout;
• великий floating Inspector.

Для товару додатково доступні ціна, рейтинг, наявність та action-кнопки. Для категорії — кількість товарів, діапазон ціни, характеристики, ключі XML/таблиці, підкатегорії та універсальні інформаційні блоки.

Шаблони застосовуються як Store-owned commerce components усередині Main. «Замінити» змінює лише активну карточку, у тому числі product-card ↔ category-card.`;

const PRODUCT_PAGE_HELP_TEXT = `Сторінка товару

Додає повну спеціалізовану секцію товару для звичайної сторінки конструктора.

У секції є:
• велике фото товару;
• маленькі фото-прев’ю;
• іконки/мітки;
• заголовок товару;
• рейтинг;
• артикул/SKU;
• ціна і стара ціна;
• короткий опис;
• варіанти/фільтри товару;
• кількість;
• кнопка “Купити”;
• кнопка “Замовити дзвінок”;
• доставка, гарантія, повний опис і характеристики.

Це звичайні секції, рівні й блоки, тому дизайн можна редагувати стандартними віджетами: текст, фото, тіні, радіуси, відступи, кольори й розміри.`;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function uid(prefix = 'st') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function writeState(state) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state || {})); } catch (_) {}
}

function ensureOpen(sectionEl, open) {
  if (!sectionEl) return;
  const body = sectionEl.querySelector('.design-section__body');
  sectionEl.classList.toggle('is-open', !!open);
  if (body) body.hidden = !open;
}

function getSiteRoot() {
  return document.getElementById('site-root') || document.querySelector('.site-root') || null;
}

function getFooterSlot(root) {
  return root?.querySelector?.('#st-site-footer-slot') || null;
}

function insertBeforeFooter(root, node) {
  if (!root || !node) return;
  const footer = getFooterSlot(root);
  if (footer && footer.parentElement === root) root.insertBefore(node, footer);
  else root.appendChild(node);
}

function setDataset(el, map) {
  Object.entries(map || {}).forEach(([key, value]) => {
    try { el.dataset[key] = String(value); } catch (_) {}
  });
}

function selectElement(el, type = '') {
  if (!el) return;
  try {
    const root = getSiteRoot();
    if (root) {
      root.querySelectorAll('.is-active, .is-selected').forEach((n) => n.classList.remove('is-active', 'is-selected'));
    }
    el.classList.add('is-active', 'is-selected');
    const finalType = type || (el.classList.contains('st-section') ? 'section' : (el.classList.contains('st-row') ? 'row' : 'block'));
    if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
      window.ST_SELECTION.setSingle(el, { type: finalType });
    }
    document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { type: finalType, elements: [el] } }));
  } catch (_) {}
}

function notifyChanged(reason = 'shop-widget-change') {
  try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}
  try { window.ST_SAVE_ROOT_DOM_HTML?.(); } catch (_) {}
  try { window.SiteCanvas?.refreshEnhancers?.(getSiteRoot()); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason } })); } catch (_) {}
  try { window.dispatchEvent(new CustomEvent('st:shop-accordion:changed', { detail: { reason } })); } catch (_) {}
}

function bindShopEditablePersistenceOnce() {
  if (window.__ST_SHOP_EDITABLE_PERSISTENCE_00322__) return;
  window.__ST_SHOP_EDITABLE_PERSISTENCE_00322__ = true;

  let timer = null;
  document.addEventListener('input', (ev) => {
    const target = ev.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.closest?.('.st-shop-card-block')) return;
    // 01042: Store-owned Product Card is persisted by SiteFrame authority on the
    // actual editable/component commit. Do not run the legacy delayed DOM-save path.
    if (target.closest?.('[data-commerce-component="product-card"],[data-commerce-component="category-card"]')) return;
    if (!target.matches?.('[contenteditable="true"], [contenteditable=true]')) return;

    clearTimeout(timer);
    timer = window.setTimeout(() => {
      notifyChanged('shop-card-edit');
    }, 350);
  }, true);
}

function makeShopSection(kind) {
  const isProduct = kind === 'product';
  const sec = document.createElement('section');
  sec.className = 'st-section st-shop-section';
  setDataset(sec, {
    secId: uid('s'),
    stArea: 'removed-content',
    secRole: isProduct ? 'shop-product-card-section' : 'shop-category-card-section',
    shopSection: isProduct ? 'product-card' : 'category-card',
    shopVersion: '00330'
  });

  sec.setAttribute('style', isProduct
    ? 'padding:56px 32px;background:linear-gradient(135deg,#f8fafc,#eef2ff);box-sizing:border-box;'
    : 'padding:56px 32px;background:linear-gradient(135deg,#f0fdf4,#ecfeff);box-sizing:border-box;');

  const row = document.createElement('div');
  row.className = 'st-row st-shop-card-row';
  setDataset(row, {
    uid: uid('r'),
    stNode: 'level',
    stArea: 'removed-content',
    layoutMode: 'fr',
    layoutOrient: 'row',
    frs: '1',
    shopRow: isProduct ? 'product-card' : 'category-card'
  });
  row.setAttribute('style', 'display:grid;width:100%;max-width:1180px;margin:0 auto;grid-template-columns:1fr;gap:24px;align-items:start;box-sizing:border-box;');

  const block = document.createElement('div');
  block.className = isProduct
    ? 'st-block st-shop-card-block st-shop-product-card-block'
    : 'st-block st-shop-card-block st-shop-category-card-block';
  setDataset(block, {
    uid: uid('b'),
    fr: '1',
    blockKind: isProduct ? 'shop-product-card' : 'shop-category-card',
    shopType: isProduct ? 'product-card' : 'category-card',
    shopCard: isProduct ? 'product' : 'category',
    shopTemplate: isProduct ? 'product-card-01-01039' : 'category-card-default-00330',
    shopDataMode: 'static-placeholder',
    shopVersion: isProduct ? '01039' : '00330'
  });
  block.setAttribute('draggable', 'true');
  block.setAttribute('style', 'width:100%;max-width:380px;min-height:320px;margin:0 auto;padding:0;border-radius:28px;background:#ffffff;border:1px solid rgba(15,23,42,.10);box-shadow:0 24px 70px rgba(15,23,42,.12);overflow:hidden;box-sizing:border-box;');
  block.innerHTML = isProduct ? productCardHtml() : categoryCardHtml();

  row.appendChild(block);
  sec.appendChild(row);
  return { sec, row, block };
}

function categoryCardHtml() {
  return `
    <article class="st-shop-card st-shop-category-card" data-shop-card-inner="category" style="display:flex;flex-direction:column;height:100%;background:#fff;color:#0f172a;">
      <div class="st-shop-card__media" data-shop-field="category_image" style="height:190px;background:radial-gradient(circle at 28% 22%,rgba(34,197,94,.55),transparent 28%),linear-gradient(135deg,#16a34a,#0891b2);display:flex;align-items:center;justify-content:center;color:white;font-weight:1000;font-size:42px;letter-spacing:.02em;">
        CAT
      </div>
      <div class="st-shop-card__body" style="display:grid;gap:10px;padding:22px;">
        <div class="st-shop-card__badge" data-shop-field="category_badge" style="display:inline-flex;width:max-content;padding:6px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;font-weight:950;">Категорія</div>
        <h3 class="st-shop-card__title" data-shop-field="category_name" contenteditable="true" spellcheck="false" style="margin:0;font-size:24px;line-height:1.12;font-weight:1000;color:#0f172a;">Назва категорії</h3>
        <p class="st-shop-card__description" data-shop-field="category_description" contenteditable="true" spellcheck="false" style="margin:0;color:#475569;font-size:14px;line-height:1.55;">Короткий опис категорії, який пізніше буде підтягуватись із таблиці або бази.</p>
        <a class="st-shop-card__button" data-shop-field="category_url" href="#" style="margin-top:8px;display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:999px;background:linear-gradient(135deg,#16a34a,#0891b2);color:white;text-decoration:none;font-weight:950;">Перейти</a>
      </div>
    </article>
  `;
}

function productCardHtml() {
  const primary = 'assets/collections/shifttime-marketplace-02/real-products/06-pan-stainless-lid-gift.webp';
  const secondary = 'assets/collections/shifttime-marketplace-02/real-products/07-pan-lid-bag.webp';
  return `
    <article class="st-shop-card st-shop-product-card"
      data-shop-card-inner="product"
      data-commerce-component="product-card"
      data-commerce-contract="${PRODUCT_CARD_CONTRACT_VERSION_01038}"
      data-commerce-template="product-card-01-01039"
      data-commerce-image-visible="1"
      data-commerce-hover-second="1"
      data-commerce-image-scale="100"
      data-commerce-image-duration="280"
  data-commerce-brand-visible="1"
  data-commerce-brand-lines="0"
  data-commerce-title-visible="1"
  data-commerce-title-lines="0"
  data-commerce-title-min-height="0"
  data-commerce-description-visible="1"
  data-commerce-description-lines="0"
  data-commerce-stock-visible="1"
  data-commerce-stock-state="in-stock"
  data-commerce-stock-custom=""
  data-commerce-rating-visible="1"
  data-commerce-rating-value="4.9"
  data-commerce-rating-mode="stars"
  data-commerce-reviews-visible="1"
  data-commerce-reviews-count="128"
  data-commerce-reviews-label="відгуків"
  data-commerce-price-current="1450"
  data-commerce-price-old="1650"
  data-commerce-price-current-visible="1"
  data-commerce-price-old-visible="1"
  data-commerce-discount-visible="1"
  data-commerce-currency-mode="uah-text"
  data-commerce-currency-custom=""
  data-commerce-currency-position="after"
  data-commerce-currency-space="1"
  data-commerce-price-format="space"
  data-commerce-price-decimals="0"
  data-commerce-discount-mode="auto-percent"
  data-commerce-discount-custom=""
  data-commerce-price-order="current-old-discount"
  data-commerce-price-gap="10"
  data-commerce-action-add-to-cart-visible="1"
  data-commerce-action-add-to-cart-label="У кошик"
  data-commerce-action-add-to-cart-icon="🛒"
  data-commerce-action-add-to-cart-mode="text"
  data-commerce-action-add-to-cart-icon-position="before"
  data-commerce-action-add-to-cart-width="full"
  data-commerce-action-add-to-cart-order="10"
  data-commerce-action-buy-now-visible="0"
  data-commerce-action-buy-now-label="Купити зараз"
  data-commerce-action-buy-now-icon="⚡"
  data-commerce-action-buy-now-mode="text"
  data-commerce-action-buy-now-icon-position="before"
  data-commerce-action-buy-now-width="full"
  data-commerce-action-buy-now-order="20"
  data-commerce-action-wishlist-visible="1"
  data-commerce-action-wishlist-label="У вибране"
  data-commerce-action-wishlist-icon="♡"
  data-commerce-action-wishlist-mode="icon"
  data-commerce-action-wishlist-icon-position="before"
  data-commerce-action-wishlist-width="auto"
  data-commerce-action-compare-visible="1"
  data-commerce-action-compare-label="Порівняти"
  data-commerce-action-compare-icon="⇄"
  data-commerce-action-compare-mode="icon"
  data-commerce-action-compare-icon-position="before"
  data-commerce-action-compare-width="auto"
  data-commerce-action-compare-order="30"
  data-commerce-action-quick-view-visible="0"
  data-commerce-action-quick-view-label="Швидкий перегляд"
  data-commerce-action-quick-view-icon="◉"
  data-commerce-action-quick-view-mode="icon"
  data-commerce-action-quick-view-icon-position="before"
  data-commerce-action-quick-view-width="auto"
  data-commerce-action-quick-view-order="40"
      style="display:flex;flex-direction:column;height:100%;background:#fff;color:#171a18;">
      <div class="st-shop-card__media"
        data-shop-field="product_image"
        data-commerce-role="media"
        style="position:relative;height:270px;background:#f2ede4;display:block;overflow:hidden;border-radius:24px 24px 0 0;">
        <img class="st-shop-card__image-primary-01039" data-commerce-role="image" data-commerce-bind="product.image" src="${primary}" alt="Сковорода з диска борони" style="display:block;width:100%;height:100%;object-fit:cover;object-position:center center;transition:opacity 280ms ease,transform 160ms ease;">
        <img class="st-shop-card__image-secondary-01039" data-commerce-role="image-secondary" data-commerce-bind="product.imageSecondary" src="${secondary}" alt="Сковорода у комплекті" style="position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center center;opacity:0;transition:opacity 280ms ease,transform 160ms ease;pointer-events:none;">
        <span class="st-shop-card__sale"
          data-shop-field="product_badge"
          data-commerce-role="badge"
          data-commerce-bind="product.badge"
          style="position:absolute;top:14px;left:14px;padding:7px 11px;border-radius:999px;background:#9a4308;color:#fff;font-size:11px;font-weight:950;letter-spacing:.05em;box-shadow:0 10px 24px rgba(154,67,8,.24);z-index:3;">ХІТ</span>
        <button type="button" data-commerce-role="wishlist" data-commerce-action="wishlist" data-commerce-action-label="У вибране" data-commerce-action-icon="♡" data-commerce-action-mode="icon" aria-label="У вибране" style="position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.72);background:rgba(255,255,255,.88);color:#171a18;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;"><span data-commerce-action-icon-slot="1" aria-hidden="true">♡</span></button>
      </div>
      <div class="st-shop-card__body" data-commerce-role="body" style="display:grid;gap:10px;padding:20px 20px 22px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <span data-commerce-role="brand" data-commerce-bind="product.brand" style="font-size:10px;font-weight:900;letter-spacing:.12em;color:#9a4308;text-transform:uppercase;">SHIFTIME</span>
          <span data-commerce-role="stock" data-commerce-bind="product.stock" style="font-size:11px;font-weight:850;color:#215f44;">● В наявності</span>
        </div>
        <h3 class="st-shop-card__title"
          data-shop-field="product_name"
          data-commerce-role="title"
          data-commerce-bind="product.name"
          contenteditable="true" spellcheck="false"
          style="margin:0;font-size:21px;line-height:1.16;font-weight:950;color:#171a18;">Сковорода з диска борони 50 см</h3>
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
          <span data-commerce-role="rating" data-commerce-bind="product.rating" style="color:#b45309;font-weight:900;letter-spacing:.04em;">★★★★★</span>
          <span data-commerce-role="reviews-count" data-commerce-bind="product.reviewsCount" style="color:#737d76;font-weight:750;">128 відгуків</span>
        </div>
        <p class="st-shop-card__description"
          data-shop-field="product_short_description"
          data-commerce-role="description"
          data-commerce-bind="product.shortDescription"
          contenteditable="true" spellcheck="false"
          style="margin:0;color:#667069;font-size:13px;line-height:1.55;">Для живого вогню, великої компанії та домашньої кухні. Міцний метал і зручна комплектація.</p>
        <div class="st-shop-card__price-row" data-commerce-role="price-group" style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding-top:2px;">
          <strong class="st-shop-card__price" data-shop-field="product_price" data-commerce-role="price-current" data-commerce-bind="product.price" contenteditable="true" spellcheck="false" style="font-size:25px;color:#171a18;font-weight:1000;">1 450 грн</strong>
          <span class="st-shop-card__old-price" data-shop-field="product_old_price" data-commerce-role="price-old" data-commerce-bind="product.oldPrice" contenteditable="true" spellcheck="false" style="font-size:13px;color:#9aa19c;text-decoration:line-through;font-weight:800;">1 650 грн</span>
          <span data-commerce-role="discount" data-commerce-bind="product.discount" style="font-size:11px;font-weight:900;color:#9a4308;">−12%</span>
        </div>
        <div data-commerce-role="actions" style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:5px;">
          <a class="st-shop-card__button" data-shop-field="product_url" data-commerce-role="add-to-cart" data-commerce-action="add-to-cart" data-commerce-action-label="У кошик" data-commerce-action-icon="🛒" data-commerce-action-mode="text" data-commerce-bind="product.url" href="#" aria-label="У кошик" style="display:inline-flex;align-items:center;justify-content:center;min-height:45px;width:100%;padding:11px 16px;border-radius:14px;background:linear-gradient(180deg,#c96a23,#8f3b08);color:white;text-decoration:none;font-weight:950;box-shadow:0 14px 30px rgba(154,67,8,.20);order:10;"><span data-commerce-action-label-slot="1">У кошик</span></a>
          <button type="button" data-commerce-role="buy-now" data-commerce-action="buy-now" data-commerce-action-label="Купити зараз" data-commerce-action-icon="⚡" data-commerce-action-mode="text" aria-label="Купити зараз" hidden style="display:inline-flex;align-items:center;justify-content:center;min-height:45px;width:100%;padding:11px 14px;border-radius:14px;border:1px solid #9a4308;background:#fffaf3;color:#9a4308;font-weight:900;cursor:pointer;order:20;"><span data-commerce-action-label-slot="1">Купити зараз</span></button>
          <button type="button" data-commerce-role="compare" data-commerce-action="compare" data-commerce-action-label="Порівняти" data-commerce-action-icon="⇄" data-commerce-action-mode="icon" aria-label="Порівняти" style="display:inline-flex;align-items:center;justify-content:center;width:45px;height:45px;border-radius:14px;border:1px solid #d8d0c4;background:#fffaf3;color:#171a18;font-size:17px;cursor:pointer;order:30;"><span data-commerce-action-icon-slot="1" aria-hidden="true">⇄</span></button>
          <button type="button" data-commerce-role="quick-view" data-commerce-action="quick-view" data-commerce-action-label="Швидкий перегляд" data-commerce-action-icon="◉" data-commerce-action-mode="icon" aria-label="Швидкий перегляд" hidden style="display:inline-flex;align-items:center;justify-content:center;width:45px;height:45px;border-radius:14px;border:1px solid #d8d0c4;background:#fff;color:#171a18;font-size:17px;cursor:pointer;order:40;"><span data-commerce-action-icon-slot="1" aria-hidden="true">◉</span></button>
        </div>
      </div>
    </article>
  `;
}
function addShopCardSection(kind) {
  const root = getSiteRoot();
  if (!root) return null;
  const made = makeShopSection(kind);
  insertBeforeFooter(root, made.sec);
  notifyChanged(kind === 'product' ? 'shop-add-product-card-section' : 'shop-add-category-card-section');
  selectElement(made.block, 'block');
  return made;
}

function makeShopProductPageSection() {
  const sec = document.createElement('section');
  sec.className = 'st-section st-shop-section st-shop-product-page-section';
  setDataset(sec, {
    secId: uid('s'),
    stArea: 'removed-content',
    secRole: 'shop-product-page-section',
    shopSection: 'product-page',
    shopType: 'product-page',
    shopVersion: '00330'
  });
  sec.setAttribute('style', 'padding:72px 32px;background:linear-gradient(135deg,#f8fafc,#eef2ff);box-sizing:border-box;');

  const topRow = document.createElement('div');
  topRow.className = 'st-row st-shop-product-page-row';
  setDataset(topRow, {
    uid: uid('r'),
    stNode: 'level',
    stArea: 'removed-content',
    layoutMode: 'fr',
    layoutOrient: 'row',
    frs: '1,1',
    shopRow: 'product-page-hero'
  });
  topRow.setAttribute('style', 'display:grid;width:100%;max-width:1240px;margin:0 auto;grid-template-columns:minmax(320px,1fr) minmax(320px,1fr);gap:34px;align-items:start;box-sizing:border-box;');

  const galleryBlock = document.createElement('div');
  galleryBlock.className = 'st-block st-shop-product-page-block st-shop-product-gallery-block';
  setDataset(galleryBlock, {
    uid: uid('b'),
    fr: '1',
    stArea: 'removed-content',
    blockKind: 'shop-product-gallery',
    shopType: 'product-page-gallery',
    shopFieldGroup: 'product-gallery',
    shopVersion: '00330'
  });
  galleryBlock.setAttribute('draggable', 'true');
  galleryBlock.setAttribute('style', 'width:100%;padding:18px;border-radius:32px;background:rgba(255,255,255,.82);border:1px solid rgba(15,23,42,.10);box-shadow:0 28px 80px rgba(15,23,42,.12);box-sizing:border-box;');
  galleryBlock.innerHTML = productPageGalleryHtml();

  const infoBlock = document.createElement('div');
  infoBlock.className = 'st-block st-shop-product-page-block st-shop-product-info-block';
  setDataset(infoBlock, {
    uid: uid('b'),
    fr: '1',
    stArea: 'removed-content',
    blockKind: 'shop-product-info',
    shopType: 'product-page-info',
    shopFieldGroup: 'product-info',
    shopVersion: '00330'
  });
  infoBlock.setAttribute('draggable', 'true');
  infoBlock.setAttribute('style', 'width:100%;padding:30px;border-radius:32px;background:#ffffff;border:1px solid rgba(15,23,42,.10);box-shadow:0 28px 80px rgba(15,23,42,.10);box-sizing:border-box;color:#0f172a;');
  infoBlock.innerHTML = productPageInfoHtml();

  topRow.appendChild(galleryBlock);
  topRow.appendChild(infoBlock);

  const detailsRow = document.createElement('div');
  detailsRow.className = 'st-row st-shop-product-details-row';
  setDataset(detailsRow, {
    uid: uid('r'),
    stNode: 'level',
    stArea: 'removed-content',
    layoutMode: 'fr',
    layoutOrient: 'row',
    frs: '1',
    shopRow: 'product-page-details'
  });
  detailsRow.setAttribute('style', 'display:grid;width:100%;max-width:1240px;margin:34px auto 0;grid-template-columns:1fr;gap:24px;align-items:start;box-sizing:border-box;');

  const detailsBlock = document.createElement('div');
  detailsBlock.className = 'st-block st-shop-product-page-block st-shop-product-details-block';
  setDataset(detailsBlock, {
    uid: uid('b'),
    fr: '1',
    stArea: 'removed-content',
    blockKind: 'shop-product-details',
    shopType: 'product-page-details',
    shopFieldGroup: 'product-details',
    shopVersion: '00330'
  });
  detailsBlock.setAttribute('draggable', 'true');
  detailsBlock.setAttribute('style', 'width:100%;padding:30px;border-radius:32px;background:#ffffff;border:1px solid rgba(15,23,42,.10);box-shadow:0 24px 70px rgba(15,23,42,.08);box-sizing:border-box;color:#0f172a;');
  detailsBlock.innerHTML = productPageDetailsHtml();

  detailsRow.appendChild(detailsBlock);
  sec.appendChild(topRow);
  sec.appendChild(detailsRow);
  return { sec, row: topRow, block: infoBlock, galleryBlock, detailsBlock };
}

function productPageGalleryHtml() {
  return `
    <article class="st-shop-product-gallery" data-shop-card-inner="product-page-gallery" style="display:grid;gap:14px;color:#0f172a;">
      <div class="st-shop-product-gallery__main" data-shop-field="product_main_image" style="position:relative;min-height:520px;border-radius:28px;background:radial-gradient(circle at 70% 25%,rgba(96,165,250,.42),transparent 28%),linear-gradient(135deg,#dbeafe,#eff6ff);display:flex;align-items:center;justify-content:center;color:#1e3a8a;font-size:72px;font-weight:1000;letter-spacing:.04em;box-shadow:inset 0 0 0 1px rgba(255,255,255,.62),0 22px 60px rgba(37,99,235,.12);overflow:hidden;">
        PHOTO
        <span data-shop-field="product_badge" style="position:absolute;top:18px;left:18px;padding:9px 13px;border-radius:999px;background:#ef4444;color:#fff;font-size:13px;font-weight:1000;box-shadow:0 14px 34px rgba(239,68,68,.28);">Акція</span>
        <span style="position:absolute;right:18px;bottom:18px;width:48px;height:48px;border-radius:999px;background:rgba(255,255,255,.92);display:grid;place-items:center;color:#0f172a;font-size:22px;font-weight:1000;box-shadow:0 14px 34px rgba(15,23,42,.16);">⌕</span>
      </div>
      <div class="st-shop-product-gallery__thumbs" data-shop-field="product_gallery" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
        <button type="button" style="min-height:86px;border:2px solid #2563eb;border-radius:18px;background:linear-gradient(135deg,#dbeafe,#eff6ff);color:#1d4ed8;font-weight:1000;box-shadow:0 12px 28px rgba(37,99,235,.14);">01</button>
        <button type="button" style="min-height:86px;border:1px solid rgba(15,23,42,.10);border-radius:18px;background:linear-gradient(135deg,#f8fafc,#e2e8f0);color:#475569;font-weight:1000;">02</button>
        <button type="button" style="min-height:86px;border:1px solid rgba(15,23,42,.10);border-radius:18px;background:linear-gradient(135deg,#fef3c7,#ffedd5);color:#92400e;font-weight:1000;">03</button>
        <button type="button" style="min-height:86px;border:1px solid rgba(15,23,42,.10);border-radius:18px;background:linear-gradient(135deg,#dcfce7,#ccfbf1);color:#166534;font-weight:1000;">04</button>
      </div>
      <div class="st-shop-product-gallery__icons" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
        <div style="padding:12px;border-radius:16px;background:#f8fafc;border:1px solid rgba(15,23,42,.08);font-size:12px;font-weight:900;text-align:center;">🚚 Швидка доставка</div>
        <div style="padding:12px;border-radius:16px;background:#f8fafc;border:1px solid rgba(15,23,42,.08);font-size:12px;font-weight:900;text-align:center;">↩ Повернення</div>
        <div style="padding:12px;border-radius:16px;background:#f8fafc;border:1px solid rgba(15,23,42,.08);font-size:12px;font-weight:900;text-align:center;">🛡 Гарантія</div>
      </div>
    </article>
  `;
}

function productPageInfoHtml() {
  return `
    <article class="st-shop-product-info" data-shop-card-inner="product-page-info" style="display:grid;gap:18px;color:#0f172a;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <div data-shop-field="product_rating" style="display:inline-flex;gap:6px;align-items:center;padding:8px 11px;border-radius:999px;background:#fffbeb;color:#d97706;font-size:13px;font-weight:1000;">★★★★★ <span style="color:#92400e;">4.9</span></div>
        <div data-shop-field="product_sku" contenteditable="true" spellcheck="false" style="font-size:13px;color:#64748b;font-weight:850;">SKU: ST-0001</div>
      </div>
      <h1 data-shop-field="product_name" contenteditable="true" spellcheck="false" style="margin:0;font-size:46px;line-height:1.03;font-weight:1000;letter-spacing:-.04em;color:#0f172a;">Назва товару</h1>
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;">
        <strong data-shop-field="product_price" contenteditable="true" spellcheck="false" style="font-size:38px;font-weight:1000;color:#0f172a;">2490 грн</strong>
        <span data-shop-field="product_old_price" contenteditable="true" spellcheck="false" style="font-size:18px;color:#94a3b8;text-decoration:line-through;font-weight:900;">2990 грн</span>
        <span data-shop-field="product_discount" contenteditable="true" spellcheck="false" style="padding:7px 11px;border-radius:999px;background:#fee2e2;color:#b91c1c;font-size:13px;font-weight:1000;">-17%</span>
      </div>
      <p data-shop-field="product_short_description" contenteditable="true" spellcheck="false" style="margin:0;color:#475569;font-size:16px;line-height:1.65;">Короткий опис товару: головні переваги, для кого підходить, чому варто купити саме цей товар.</p>
      <div data-shop-field="product_variants" style="display:grid;gap:10px;">
        <div style="font-size:13px;font-weight:1000;color:#334155;text-transform:uppercase;letter-spacing:.08em;">Фільтр / варіанти</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" style="padding:10px 14px;border-radius:14px;border:2px solid #2563eb;background:#eff6ff;color:#1d4ed8;font-weight:1000;">S</button>
          <button type="button" style="padding:10px 14px;border-radius:14px;border:1px solid rgba(15,23,42,.12);background:#fff;color:#334155;font-weight:1000;">M</button>
          <button type="button" style="padding:10px 14px;border-radius:14px;border:1px solid rgba(15,23,42,.12);background:#fff;color:#334155;font-weight:1000;">L</button>
          <button type="button" style="padding:10px 14px;border-radius:14px;border:1px solid rgba(15,23,42,.12);background:#fff;color:#334155;font-weight:1000;">XL</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:118px 1fr 1fr;gap:12px;align-items:center;">
        <div data-shop-field="product_quantity" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 14px;border-radius:16px;border:1px solid rgba(15,23,42,.12);background:#f8fafc;font-weight:1000;"><span>−</span><span>1</span><span>+</span></div>
        <a data-shop-field="product_buy_button" href="#" style="display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:16px;background:linear-gradient(135deg,#2563eb,#06b6d4);color:white;text-decoration:none;font-weight:1000;box-shadow:0 18px 42px rgba(37,99,235,.24);">Купити</a>
        <a data-shop-field="product_call_button" href="#" style="display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:16px;background:#0f172a;color:white;text-decoration:none;font-weight:1000;box-shadow:0 18px 42px rgba(15,23,42,.18);">Замовити дзвінок</a>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div data-shop-field="product_stock_status" contenteditable="true" spellcheck="false" style="padding:14px;border-radius:18px;background:#f0fdf4;color:#166534;font-size:14px;font-weight:900;">✓ В наявності</div>
        <div data-shop-field="product_delivery_info" contenteditable="true" spellcheck="false" style="padding:14px;border-radius:18px;background:#eff6ff;color:#1d4ed8;font-size:14px;font-weight:900;">🚚 Доставка 1–2 дні</div>
      </div>
    </article>
  `;
}

function productPageDetailsHtml() {
  return `
    <article class="st-shop-product-details" data-shop-card-inner="product-page-details" style="display:grid;gap:24px;color:#0f172a;">
      <div style="display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:start;">
        <div style="display:grid;gap:12px;">
          <h2 data-shop-field="product_full_description_title" contenteditable="true" spellcheck="false" style="margin:0;font-size:32px;line-height:1.12;font-weight:1000;color:#0f172a;">Повний опис товару</h2>
          <p data-shop-field="product_full_description" contenteditable="true" spellcheck="false" style="margin:0;color:#475569;font-size:16px;line-height:1.75;">Тут буде повний опис товару: матеріали, особливості, переваги, сценарії використання, комплектація та важлива інформація для клієнта. Пізніше це поле можна буде підтягувати з таблиці або бази даних.</p>
        </div>
        <div data-shop-field="product_specs" style="display:grid;gap:10px;padding:18px;border-radius:24px;background:#f8fafc;border:1px solid rgba(15,23,42,.08);">
          <div style="font-size:13px;font-weight:1000;color:#334155;text-transform:uppercase;letter-spacing:.08em;">Характеристики</div>
          <div style="display:grid;gap:8px;font-size:14px;color:#334155;">
            <div style="display:flex;justify-content:space-between;gap:12px;"><b>Матеріал</b><span contenteditable="true" spellcheck="false">Преміум</span></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><b>Гарантія</b><span contenteditable="true" spellcheck="false">12 міс.</span></div>
            <div style="display:flex;justify-content:space-between;gap:12px;"><b>Бренд</b><span contenteditable="true" spellcheck="false">ShiftTime</span></div>
          </div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
        <div style="padding:18px;border-radius:22px;background:#fff7ed;border:1px solid rgba(251,146,60,.22);"><b>Оплата</b><p contenteditable="true" spellcheck="false" style="margin:8px 0 0;color:#9a3412;line-height:1.55;">Онлайн, післяплата або рахунок.</p></div>
        <div style="padding:18px;border-radius:22px;background:#ecfeff;border:1px solid rgba(6,182,212,.22);"><b>Доставка</b><p contenteditable="true" spellcheck="false" style="margin:8px 0 0;color:#155e75;line-height:1.55;">Нова Пошта / кур’єр / самовивіз.</p></div>
        <div style="padding:18px;border-radius:22px;background:#f0fdf4;border:1px solid rgba(34,197,94,.22);"><b>Відгуки</b><p contenteditable="true" spellcheck="false" style="margin:8px 0 0;color:#166534;line-height:1.55;">Блок рейтингу та відгуків додамо наступним етапом.</p></div>
      </div>
    </article>
  `;
}

function addShopProductPageSection() {
  const root = getSiteRoot();
  if (!root) return null;
  const made = makeShopProductPageSection();
  insertBeforeFooter(root, made.sec);
  notifyChanged('shop-add-product-page-section');
  selectElement(made.block, 'block');
  return made;
}

function countSummaryHtml() {
  const root = getSiteRoot();
  if (!root) return '<b>0</b> кат. · <b>0</b> тов.';
  const categories = root.querySelectorAll('.st-shop-category-card-block,[data-shop-type="category-card"]').length;
  const products = root.querySelectorAll('.st-shop-product-card-block,[data-shop-type="product-card"],[data-commerce-component="product-card"]').length;
  const productPages = root.querySelectorAll('.st-shop-product-page-section,[data-shop-section="product-page"]').length;
  return `<b>${categories}</b> кат. · <b>${products}</b> тов. · <b>${productPages}</b> стор.`;
}



function readCommerceCardMode01050(){
  try { const v=String(localStorage.getItem(COMMERCE_CARD_MODE_KEY_01050)||'').trim(); return v==='category-card'?'category-card':'product-card'; } catch { return 'product-card'; }
}
function writeCommerceCardMode01050(mode){
  const v=mode==='category-card'?'category-card':'product-card';
  try { localStorage.setItem(COMMERCE_CARD_MODE_KEY_01050,v); } catch {}
  return v;
}
function commerceCardModeLabel01050(mode){ return mode==='category-card'?'Карточка категорії':'Карточка товару'; }
function getSelectedCommerceCard01050(getSelection){
  const selected=getSelectionElement01038(getSelection);
  return resolveCommerceCardRoot01050(selected);
}
function roleToggleBindingsForMode01050(mode){ return mode==='category-card'?CATEGORY_ROLE_TOGGLE_BINDINGS_01050:PRODUCT_ROLE_TOGGLE_BINDINGS_01048; }
function renderCommerceRoleControls01050(panel,mode){
  if(!panel) return;
  const defs=getCommerceCardRoleDefs01050(mode);
  const select=panel.querySelector('[data-product-card-role-select]');
  const roles=panel.querySelector('[data-product-card-contract-roles]');
  let current=readProductRoleState();
  if(!defs.some(x=>x.id===current)) current='root';
  if(select){select.innerHTML=defs.map(item=>`<option value="${esc(item.id)}">${esc(item.label)}${item.required?' · обов’язково':''}</option>`).join('');select.value=current;}
  if(roles){roles.innerHTML=defs.filter(item=>item.id!=='root'&&item.id!=='surface').map(item=>`<button type="button" class="st-shop-contract-role${item.required?' is-required':''}" data-commerce-contract-role-chip="${esc(item.id)}" title="Увімкнути / вимкнути ${esc(item.label)}">${esc(item.label)}</button>`).join('');}
}
function updateCommerceCardModeUi01050(sectionEl,getSelection,{autoFromSelection=false}={}){
  if(!sectionEl) return 'product-card';
  const selectedCard=getSelectedCommerceCard01050(getSelection);
  const selectedType=getCommerceCardType01050(selectedCard);
  let mode=readCommerceCardMode01050();
  if(autoFromSelection && selectedType) mode=writeCommerceCardMode01050(selectedType);
  const previous=sectionEl.dataset.commerceCardMode01050||'';
  sectionEl.dataset.commerceCardMode01050=mode;
  const acc=sectionEl.querySelector('[data-shop-sub="product-card"]');
  const title=sectionEl.querySelector('[data-commerce-card-accordion-title-01050]'); if(title) title.textContent=commerceCardModeLabel01050(mode);
  sectionEl.querySelectorAll('[data-commerce-card-mode-switch-01050]').forEach(btn=>{const active=btn.getAttribute('data-commerce-card-mode-switch-01050')===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',active?'true':'false');});
  const isCategory=mode==='category-card';
  sectionEl.querySelectorAll('[data-commerce-product-only-01050]').forEach(el=>{el.hidden=isCategory;});
  sectionEl.querySelectorAll('[data-commerce-category-only-01050]').forEach(el=>{el.hidden=!isCategory;});
  const priceWidget=sectionEl.querySelector('[data-product-price-widget-01043]'); if(priceWidget) priceWidget.hidden=isCategory;
  const actionsWidget=sectionEl.querySelector('[data-product-actions-widget-01045]'); if(actionsWidget) actionsWidget.hidden=isCategory;
  const categoryWidget=sectionEl.querySelector('[data-category-card-data-widget-01050]'); if(categoryWidget) categoryWidget.hidden=!isCategory;
  const titleLabel=sectionEl.querySelector('[data-commerce-card-title-label-01050]'); if(titleLabel) titleLabel.textContent=isCategory?'Назва категорії':'Назва товару';
  const galleryButton=sectionEl.querySelector('[data-commerce-card-gallery-button-01050]'); if(galleryButton) galleryButton.textContent=isCategory?'Шаблони карточки категорії':'Шаблони карточки товару';
  const match=!!selectedType && selectedType===mode;
  const mismatch=!!selectedType&&!match;
  sectionEl.querySelectorAll('[data-product-image-widget-01039],[data-product-text-widget-01042],[data-product-price-widget-01043],[data-product-badge-widget-01044],[data-product-actions-widget-01045],[data-product-layout-widget-01046],[data-category-card-data-widget-01050]').forEach(el=>{ try { el.inert=mismatch; } catch {} });
  acc?.classList.toggle('is-target-match-01050',match);
  acc?.classList.toggle('is-target-mismatch-01050',!!selectedType&&!match);
  const matchOut=sectionEl.querySelector('[data-commerce-card-mode-match-01050]');
  if(matchOut){matchOut.className=`st-commerce-card-mode-match-01050 ${match?'is-match':(selectedType?'is-mismatch':'')}`;matchOut.textContent=match?`Активна ${commerceCardModeLabel01050(mode).toLowerCase()}`:(selectedType?`На Canvas: ${commerceCardModeLabel01050(selectedType)} · режим Inspector не змінює її автоматично`:'Вибери commerce-карточку на Canvas');}
  renderCommerceRoleControls01050(sectionEl.querySelector('[data-product-card-contract-widget]'),mode);
  if(previous!==mode){try{window.dispatchEvent(new CustomEvent('st:commerce-card-mode-changed-01050',{detail:{mode,selectedType,match}}));}catch{}}
  return mode;
}

function readProductRoleState() {
  try {
    const raw = String(localStorage.getItem(PRODUCT_ROLE_STATE_KEY) || '').trim();
    return COMMERCE_CARD_ROLE_DEFS_01050.some((item) => item.id === raw) ? raw : 'root';
  } catch (_) {
    return 'root';
  }
}

function writeProductRoleState(roleId) {
  try { localStorage.setItem(PRODUCT_ROLE_STATE_KEY, String(roleId || 'root')); } catch (_) {}
}

function getSelectionElement01038(getSelection) {
  try {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    return Array.isArray(sel?.elements) ? (sel.elements[0] || null) : null;
  } catch (_) {
    return null;
  }
}

function getSelectedProductCard01038(getSelection) {
  const selected = getSelectionElement01038(getSelection);
  return resolveProductCardRoot01038(selected);
}

function readProductWidgetFontScale01048() {
  try {
    const n = Number(localStorage.getItem(PRODUCT_WIDGET_FONT_SCALE_KEY_01048) || 115);
    return Number.isFinite(n) ? Math.max(90, Math.min(160, Math.round(n))) : 115;
  } catch (_) { return 115; }
}

function writeProductWidgetFontScale01048(value) {
  const n = Math.max(90, Math.min(160, Math.round(Number(value) || 115)));
  try { localStorage.setItem(PRODUCT_WIDGET_FONT_SCALE_KEY_01048, String(n)); } catch (_) {}
  return n;
}

function applyProductWidgetFontScale01048(sectionEl, value) {
  const n = Math.max(90, Math.min(160, Math.round(Number(value) || 115)));
  const acc = sectionEl?.querySelector?.('[data-shop-sub="product-card"]') || null;
  if (acc) {
    const scale=n/100;
    [9,10,11,12,13].forEach((base)=>acc.style.setProperty(`--st-shop-font-${base}-01048`, `${(base*scale).toFixed(2)}px`));
  }
  const out = sectionEl?.querySelector?.('[data-product-widget-font-scale-out]') || null;
  if (out) out.textContent = `${n}%`;
  const input = sectionEl?.querySelector?.('[data-product-widget-font-scale]') || null;
  if (input && String(input.value) !== String(n)) input.value = String(n);
}

function toggleControlForRole01048(sectionEl, roleId) {
  const mode=sectionEl?.dataset?.commerceCardMode01050 || readCommerceCardMode01050();
  const selector = roleToggleBindingsForMode01050(mode)[roleId];
  if (!selector) return false;
  const control = sectionEl?.querySelector?.(selector) || null;
  if (!(control instanceof HTMLInputElement) || control.type !== 'checkbox' || control.disabled) return false;
  control.checked = !control.checked;
  control.dispatchEvent(new Event('input', { bubbles:true }));
  control.dispatchEvent(new Event('change', { bubbles:true }));
  return true;
}

function roleEnabledFromControl01048(sectionEl, roleId, exists) {
  if (!exists) return false;
  const mode=sectionEl?.dataset?.commerceCardMode01050 || readCommerceCardMode01050();
  const selector = roleToggleBindingsForMode01050(mode)[roleId];
  if (!selector) return true;
  const control = sectionEl?.querySelector?.(selector) || null;
  return control instanceof HTMLInputElement && control.type === 'checkbox' ? !!control.checked : true;
}

function productCardContractInspectorHtml01038() {
  const options = PRODUCT_CARD_ROLE_DEFS_01038.map((item) =>
    `<option value="${esc(item.id)}">${esc(item.label)}${item.required ? ' · обов’язково' : ''}</option>`
  ).join('');
  const roleChips = PRODUCT_CARD_ROLE_DEFS_01038
    .filter((item) => item.id !== 'root' && item.id !== 'surface')
    .map((item) => `<button type="button" class="st-shop-contract-role${item.required ? ' is-required' : ''}" data-commerce-contract-role-chip="${esc(item.id)}" title="Увімкнути / вимкнути ${esc(item.label)}">${esc(item.label)}</button>`)
    .join('');

  return `
    <div class="st-shop-component-widget" data-product-card-contract-widget="1">
      <div class="design-field st-shop-font-scale-01048">
        <div class="design-field__label st-pimg-label-row st-shop-font-scale-head-01049"><span>Розмір тексту віджета</span><span class="st-shop-font-scale-actions-01049"><b data-product-widget-font-scale-out>115%</b><button type="button" class="st-shop-floating-open-01049" data-product-card-floating-open-01049 title="Відкрити великі налаштування commerce-карточки" aria-label="Відкрити великі налаштування commerce-карточки">⚙</button></span></div>
        <input class="design-slider" type="range" min="90" max="160" step="5" value="115" data-product-widget-font-scale>
        <div class="design-subnote">Змінює тільки розмір тексту цього Commerce Card Inspector, а не текст карточки на сайті.</div>
      </div>
      <div class="st-commerce-card-mode-switch-01050" role="group" aria-label="Тип commerce-карточки">
        <button type="button" data-commerce-card-mode-switch-01050="product-card" aria-pressed="true">Карточка товару</button>
        <button type="button" data-commerce-card-mode-switch-01050="category-card" aria-pressed="false">Карточка категорії</button>
      </div>
      <div class="st-commerce-card-mode-match-01050" data-commerce-card-mode-match-01050>Вибери commerce-карточку на Canvas</div>
      <div class="design-field">
        <div class="design-field__label">Елемент карточки</div>
        <select class="design-input" data-product-card-role-select>
          ${options}
        </select>
        <div class="design-subnote" style="margin-top:6px;">
          Це стандартний semantic-selector. <b>Зелена кнопка = опція увімкнена, червона = вимкнена.</b> Клік по кнопці перемикає той самий checkbox у налаштуваннях нижче. CSS-класи шаблонів можуть бути різні, але <b>data-commerce-role</b> залишається стабільним.
        </div>
      </div>
      <div class="st-shop-contract-status" data-product-card-contract-status>
        Вибери commerce-карточку на Canvas.
      </div>
      <div class="st-shop-contract-roles" data-product-card-contract-roles>
        ${roleChips}
      </div>
    </div>
  `;
}

function updateProductCardContractPanel01038(sectionEl, getSelection) {
  const panel = sectionEl?.querySelector?.('[data-product-card-contract-widget]');
  if (!panel) return;
  const mode=sectionEl.dataset.commerceCardMode01050 || readCommerceCardMode01050();
  renderCommerceRoleControls01050(panel,mode);
  const defs=getCommerceCardRoleDefs01050(mode);
  const select = panel.querySelector('[data-product-card-role-select]');
  const status = panel.querySelector('[data-product-card-contract-status]');
  let roleId = readProductRoleState();
  if(!defs.some(x=>x.id===roleId)){ roleId='root'; writeProductRoleState('root'); }
  if (select && select.value !== roleId) select.value = roleId;

  const card = getSelectedCommerceCard01050(getSelection);
  const cardType=getCommerceCardType01050(card);
  const match=!!card && cardType===mode;
  const validation = card ? validateCommerceCardContract01050(card) : null;
  const selectedRoleEl = match ? resolveCommerceCardRole01050(card, roleId) : null;
  const bindings=roleToggleBindingsForMode01050(mode);

  panel.querySelectorAll('[data-commerce-contract-role-chip]').forEach((chip) => {
    const id = chip.getAttribute('data-commerce-contract-role-chip') || '';
    const exists = !!(match && resolveCommerceCardRole01050(card, id));
    const enabled = roleEnabledFromControl01048(sectionEl, id, exists);
    chip.classList.toggle('is-present', exists);
    chip.classList.toggle('is-missing', !!match && !exists);
    chip.classList.toggle('is-enabled', !!match && exists && enabled);
    chip.classList.toggle('is-disabled', !!match && exists && !enabled);
    chip.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    chip.disabled = !match || !exists || !bindings[id];
  });

  if (!status) return;
  if (!card) {
    status.className = 'st-shop-contract-status';
    status.innerHTML = `<b>${commerceCardModeLabel01050(mode)} Contract</b><span>Вибери commerce-карточку на Canvas.</span>`;
    return;
  }
  if(!match){
    status.className='st-shop-contract-status';
    status.innerHTML=`<b>${commerceCardModeLabel01050(mode)} · режим Inspector</b><span>На Canvas вибрано: ${esc(commerceCardModeLabel01050(cardType))}. Перемкни режим назад або відкрий шаблони ${mode==='category-card'?'категорій':'товарів'} і заміни активну карточку.</span>`;
    return;
  }

  const requiredCount = defs.filter((item) => item.required).length;
  const presentRequired = requiredCount - (validation?.missingRequired?.length || 0);
  const selectedDef = defs.find((item) => item.id === roleId);
  const ok = !!validation?.ok;
  status.className = `st-shop-contract-status ${ok ? 'is-ok' : 'is-warning'}`;
  status.innerHTML = `
    <b>${ok ? 'Контракт готовий' : 'Контракт неповний'} · ${presentRequired}/${requiredCount}</b>
    <span>${commerceCardModeLabel01050(mode)} · ціль: ${esc(selectedDef?.label || roleId)} · ${selectedRoleEl ? 'знайдено' : 'у цьому шаблоні немає'}</span>
    ${validation?.missingRequired?.length ? `<small>Немає обов’язкових ролей: ${esc(validation.missingRequired.join(', '))}</small>` : ''}
  `;
}

function bindProductCardContractPanel01038(sectionEl, getSelection) {
  const panel = sectionEl?.querySelector?.('[data-product-card-contract-widget]');
  if (!panel || panel.dataset.bound01038 === '1') return;
  panel.dataset.bound01038 = '1';
  const select = panel.querySelector('[data-product-card-role-select]');
  if (select) {
    select.value = readProductRoleState();
    select.addEventListener('change', () => {
      writeProductRoleState(select.value || 'root');
      updateProductCardContractPanel01038(sectionEl, getSelection);
    });
  }
  const fontScale = panel.querySelector('[data-product-widget-font-scale]');
  const initialScale = readProductWidgetFontScale01048();
  applyProductWidgetFontScale01048(sectionEl, initialScale);
  if (fontScale) {
    fontScale.value = String(initialScale);
    fontScale.addEventListener('input', () => applyProductWidgetFontScale01048(sectionEl, fontScale.value));
    fontScale.addEventListener('change', () => applyProductWidgetFontScale01048(sectionEl, writeProductWidgetFontScale01048(fontScale.value)));
  }
  panel.addEventListener('click', (ev) => {
    const modeBtn=ev.target?.closest?.('[data-commerce-card-mode-switch-01050]');
    if(modeBtn){
      ev.preventDefault();ev.stopPropagation();
      const mode=writeCommerceCardMode01050(modeBtn.getAttribute('data-commerce-card-mode-switch-01050'));
      sectionEl.dataset.commerceCardMode01050=mode;
      updateCommerceCardModeUi01050(sectionEl,getSelection,{autoFromSelection:false});
      updateProductCardContractPanel01038(sectionEl,getSelection);
      return;
    }
    const chip = ev.target?.closest?.('[data-commerce-contract-role-chip]');
    if (!chip) return;
    ev.preventDefault();
    ev.stopPropagation();
    const roleId = String(chip.getAttribute('data-commerce-contract-role-chip') || '');
    if (toggleControlForRole01048(sectionEl, roleId)) {
      requestAnimationFrame(() => updateProductCardContractPanel01038(sectionEl, getSelection));
    }
  });
  let refreshRaf01048 = 0;
  const refresh = () => {
    cancelAnimationFrame(refreshRaf01048);
    refreshRaf01048 = requestAnimationFrame(() => updateProductCardContractPanel01038(sectionEl, getSelection));
  };
  const selectionRefresh=()=>{
    cancelAnimationFrame(refreshRaf01048);
    refreshRaf01048=requestAnimationFrame(()=>{
      updateCommerceCardModeUi01050(sectionEl,getSelection,{autoFromSelection:true});
      updateProductCardContractPanel01038(sectionEl,getSelection);
    });
  };
  sectionEl.addEventListener('change', (ev) => {
    if (!ev.target?.matches?.('[data-pimg],[data-ptext],[data-pprice],[data-pbadge],[data-paction],[data-paction-block-visible],[data-pcat],[data-pcat-extra]')) return;
    requestAnimationFrame(refresh);
  }, true);
  document.addEventListener('st:selection-changed', selectionRefresh, true);
  window.addEventListener('st-page-selected', selectionRefresh);
  window.addEventListener('st:canvas-snapshot-applied', selectionRefresh);
  window.addEventListener('builder:structureChanged', refresh);
  window.addEventListener('st:commerce-component-template-applied-01041',selectionRefresh);
  updateCommerceCardModeUi01050(sectionEl,getSelection,{autoFromSelection:true});
  refresh();
}

function subAccordion(id, title, note, bodyHtml) {
  return `
    <div class="st-shop-subacc" data-shop-sub="${esc(id)}">
      <button type="button" class="design-section__header st-shop-subacc__head" data-shop-sub-head="${esc(id)}" data-shop-help-tip="${esc(note)}" aria-expanded="false">
        <div class="design-section__header-title"><span${id === 'product-card' ? ' data-commerce-card-accordion-title-01050' : ''}>${esc(title)}</span></div>
        <span class="design-section__chevron">▶</span>
      </button>
      <div class="design-section__body st-shop-subacc__body" data-shop-sub-body="${esc(id)}" hidden>
        ${bodyHtml}
      </div>
    </div>
  `;
}

function buildSectionHtml() {
  return `
    <button class="design-section__header" type="button" data-shop-help-tip="${esc(SHOP_HELP_TEXT)}">
      <div class="design-section__header-title">
        <span>Магазин</span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <style>
        #${SEC_ID} .st-shop-card-ui{display:grid;gap:10px;padding:10px;border:1px solid rgba(148,163,184,.18);border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,.74),rgba(2,6,23,.64));color:rgba(226,232,240,.95)}
        #${SEC_ID} .st-shop-top{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:2px 2px 8px;border-bottom:1px solid rgba(148,163,184,.14)}
        #${SEC_ID} .st-shop-help-chip{appearance:none;border:1px solid rgba(56,189,248,.32);border-radius:999px;background:rgba(14,165,233,.12);color:#e0f2fe;padding:7px 10px;font-size:12px;font-weight:950;cursor:help;box-shadow:0 8px 20px rgba(14,165,233,.10)}
        #${SEC_ID} .st-shop-help-chip:hover{border-color:rgba(125,211,252,.58);background:rgba(14,165,233,.20)}
        #${SEC_ID} .st-shop-badge{font-size:11px;font-weight:900;padding:6px 8px;border-radius:999px;background:rgba(14,165,233,.12);border:1px solid rgba(14,165,233,.25);color:#bae6fd;white-space:nowrap}
        #${SEC_ID} .st-shop-subacc{border-radius:18px;background:radial-gradient(circle at top left,#273559 0,#151a26 40%,#0b0f18 100%);box-shadow:0 10px 30px rgba(0,0,0,.35);overflow:hidden;border:1px solid rgba(123,155,255,.22)}
        #${SEC_ID} .st-shop-subacc > .st-shop-subacc__head{width:100%;font-size:13px;font-weight:600;letter-spacing:.02em}
        #${SEC_ID} .st-shop-subacc > .st-shop-subacc__body{display:grid;gap:10px;padding:10px 12px 12px}
        #${SEC_ID} .st-shop-subacc > .st-shop-subacc__body[hidden]{display:none!important}
        #${SEC_ID} .st-shop-subacc > .st-shop-subacc__head .design-section__chevron{transform:none}
        #${SEC_ID} .st-shop-subacc.is-open > .st-shop-subacc__head .design-section__chevron{transform:rotate(90deg)}
        #${SEC_ID} .st-shop-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        #${SEC_ID} .st-shop-component-widget{display:grid;gap:10px;padding:10px;border:1px solid rgba(148,163,184,.16);border-radius:14px;background:rgba(2,6,23,.28)}
        #${SEC_ID} .st-shop-contract-status{display:grid;gap:3px;padding:10px;border-radius:12px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.58);font-size:11px;line-height:1.4;color:#cbd5e1}
        #${SEC_ID} .st-shop-contract-status b{font-size:12px;color:#f8fafc}
        #${SEC_ID} .st-shop-contract-status span{color:#cbd5e1}
        #${SEC_ID} .st-shop-contract-status small{color:#fbbf24}
        #${SEC_ID} .st-shop-contract-status.is-ok{border-color:rgba(34,197,94,.34);background:rgba(20,83,45,.20)}
        #${SEC_ID} .st-shop-contract-status.is-warning{border-color:rgba(245,158,11,.34);background:rgba(120,53,15,.18)}
        #${SEC_ID} .st-shop-contract-roles{display:flex;flex-wrap:wrap;gap:5px}
        #${SEC_ID} .st-shop-contract-role{appearance:none;padding:5px 8px;border-radius:999px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.48);font-size:var(--st-shop-font-9-01048,10.35px);font-weight:850;color:#94a3b8;cursor:pointer;transition:background .12s ease,border-color .12s ease,color .12s ease,transform .08s ease}
        #${SEC_ID} .st-shop-contract-role:active:not(:disabled){transform:translateY(1px)}
        #${SEC_ID} .st-shop-contract-role:disabled{cursor:not-allowed;opacity:.62}
        #${SEC_ID} .st-shop-contract-role.is-required{border-style:dashed}
        #${SEC_ID} .st-shop-contract-role.is-present.is-enabled{border-color:rgba(34,197,94,.55);background:rgba(22,163,74,.24);color:#dcfce7;box-shadow:inset 0 0 0 1px rgba(34,197,94,.08)}
        #${SEC_ID} .st-shop-contract-role.is-present.is-disabled{border-color:rgba(248,113,113,.56);background:rgba(153,27,27,.26);color:#fee2e2;box-shadow:inset 0 0 0 1px rgba(248,113,113,.07)}
        #${SEC_ID} .st-shop-contract-role.is-missing{border-color:rgba(244,63,94,.28);background:rgba(127,29,29,.14);color:#fecdd3}
        #${SEC_ID} [data-shop-sub="product-card"]{--st-shop-font-9-01048:10.35px;--st-shop-font-10-01048:11.5px;--st-shop-font-11-01048:12.65px;--st-shop-font-12-01048:13.8px;--st-shop-font-13-01048:14.95px}
        #${SEC_ID} [data-shop-sub="product-card"] > .st-shop-subacc__head{font-size:var(--st-shop-font-13-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .design-field__label{font-size:var(--st-shop-font-10-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .design-input{font-size:var(--st-shop-font-11-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .design-subnote{font-size:var(--st-shop-font-9-01048)!important;line-height:1.45}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-contract-status{font-size:var(--st-shop-font-11-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-contract-status b{font-size:var(--st-shop-font-12-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-widget-head-01039 b{font-size:var(--st-shop-font-12-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-widget-head-01039 span{font-size:var(--st-shop-font-9-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-switch-01039,#${SEC_ID} [data-shop-sub="product-card"] .st-shop-check-row-01039{font-size:var(--st-shop-font-10-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-content-group__title-01042>b{font-size:var(--st-shop-font-11-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-check-row-01039 b{font-size:var(--st-shop-font-11-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-check-row-01039 small{font-size:var(--st-shop-font-9-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-price-calculation-01043,#${SEC_ID} [data-shop-sub="product-card"] .st-shop-badge-preview-01044,#${SEC_ID} [data-shop-sub="product-card"] .st-shop-actions-note-01045,#${SEC_ID} [data-shop-sub="product-card"] .st-shop-layout-note-01046{font-size:var(--st-shop-font-10-01048)!important}
        #${SEC_ID} [data-shop-sub="product-card"] .st-shop-btn{font-size:var(--st-shop-font-12-01048)!important}
        #${SEC_ID} .st-shop-widget-head-01039{display:flex;align-items:center;justify-content:space-between;gap:10px}#${SEC_ID} .st-shop-widget-head-01039>div{display:grid;gap:2px}#${SEC_ID} .st-shop-widget-head-01039 b{font-size:12px;color:#f8fafc}#${SEC_ID} .st-shop-widget-head-01039 span{font-size:9px;color:#94a3b8}#${SEC_ID} .st-shop-switch-01039,#${SEC_ID} .st-shop-check-row-01039{display:flex;align-items:center;gap:7px;font-size:10px;color:#cbd5e1}#${SEC_ID} .st-shop-check-row-01039{align-items:flex-start;padding:9px;border-radius:12px;border:1px solid rgba(148,163,184,.15);background:rgba(15,23,42,.42)}#${SEC_ID} .st-shop-check-row-01039>span{display:grid;gap:2px}#${SEC_ID} .st-shop-check-row-01039 b{font-size:11px;color:#f8fafc}#${SEC_ID} .st-shop-check-row-01039 small{font-size:9px;color:#94a3b8}#${SEC_ID} .st-shop-two-col-01039{display:grid;grid-template-columns:1fr 1fr;gap:8px}#${SEC_ID} .st-pimg-label-row{display:flex;align-items:center;justify-content:space-between;gap:8px}#${SEC_ID} .st-pimg-label-row b{font-size:10px;color:#bae6fd}#${SEC_ID} .st-product-image-preview-01039{width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.62);display:grid;place-items:center;color:#94a3b8;font-size:10px}#${SEC_ID} .st-product-image-preview-01039 img{display:block;width:100%;height:100%;object-fit:cover}
        #${SEC_ID} .st-product-text-widget-01042{gap:12px}#${SEC_ID} .st-shop-content-group-01042{display:grid;gap:8px;padding:10px;border-radius:12px;border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.36)}#${SEC_ID} .st-shop-content-group__title-01042{display:flex;align-items:center;justify-content:space-between;gap:10px}#${SEC_ID} .st-shop-content-group__title-01042>b{font-size:11px;color:#f8fafc}#${SEC_ID} .st-shop-textarea-01042{min-height:58px;resize:vertical;line-height:1.35}#${SEC_ID} .st-shop-check-split-01042{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0}#${SEC_ID} [data-ptext-custom-stock-wrap][hidden]{display:none!important}
        #${SEC_ID} .st-product-price-widget-01043{gap:12px}#${SEC_ID} [data-pprice-custom-wrap][hidden],#${SEC_ID} [data-pprice-currency-custom-wrap][hidden]{display:none!important}#${SEC_ID} .st-shop-price-calculation-01043{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid rgba(56,189,248,.16);background:rgba(8,47,73,.22);font-size:10px;color:#94a3b8}#${SEC_ID} .st-shop-price-calculation-01043 b{font-size:10px;color:#bae6fd;text-align:right}
        #${SEC_ID} .st-product-badge-widget-01044{gap:12px}#${SEC_ID} [data-pbadge-custom-wrap][hidden]{display:none!important}#${SEC_ID} .st-shop-badge-preview-01044{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid rgba(56,189,248,.16);background:rgba(8,47,73,.22);font-size:10px;color:#94a3b8}#${SEC_ID} .st-shop-badge-preview-01044 b{display:inline-flex;padding:5px 8px;border-radius:999px;background:#9a4308;color:#fff;font-size:10px;font-weight:950;letter-spacing:.04em}#${SEC_ID} .st-shop-badge-note-01044{padding:8px 10px;border-radius:10px;border:1px dashed rgba(148,163,184,.18);color:#94a3b8;font-size:9px;line-height:1.45;background:rgba(15,23,42,.30)}
        #${SEC_ID} .st-product-actions-widget-01045{gap:12px}#${SEC_ID} .st-shop-actions-note-01045{padding:9px 10px;border-radius:10px;border:1px dashed rgba(56,189,248,.22);background:rgba(8,47,73,.18);color:#94a3b8;font-size:9px;line-height:1.45}#${SEC_ID} .st-shop-actions-note-01045 b{color:#bae6fd}#${SEC_ID} .st-shop-action-group-01045.is-missing{opacity:.62}#${SEC_ID} .st-shop-action-missing-01045{padding:7px 9px;border-radius:9px;background:rgba(127,29,29,.20);border:1px solid rgba(248,113,113,.20);color:#fecaca;font-size:9px;line-height:1.35}#${SEC_ID} .st-shop-action-missing-01045[hidden]{display:none!important}
        #${SEC_ID} .st-product-layout-widget-01046{gap:12px}#${SEC_ID} .st-shop-layout-horizontal-01046{display:grid;gap:10px;padding:10px;border-radius:12px;border:1px solid rgba(56,189,248,.14);background:rgba(8,47,73,.14)}#${SEC_ID} .st-shop-layout-horizontal-01046[hidden]{display:none!important}#${SEC_ID} .st-shop-layout-note-01046{padding:8px 10px;border-radius:10px;border:1px dashed rgba(148,163,184,.18);color:#94a3b8;font-size:9px;line-height:1.45;background:rgba(15,23,42,.30)}
        #${SEC_ID} .st-shop-btn{appearance:none;border:1px solid rgba(148,163,184,.20);background:linear-gradient(180deg,rgba(30,41,59,.82),rgba(15,23,42,.82));color:rgba(241,245,249,.96);border-radius:12px;padding:9px 10px;font-size:12px;font-weight:850;cursor:pointer;text-align:left;box-shadow:0 8px 18px rgba(0,0,0,.16);transition:transform .08s ease,border-color .12s ease,background .12s ease}
        #${SEC_ID} .st-shop-btn:hover{border-color:rgba(56,189,248,.42);background:linear-gradient(180deg,rgba(30,64,175,.58),rgba(15,23,42,.9))}
        #${SEC_ID} .st-shop-btn:active{transform:translateY(1px)}
        #${SEC_ID} .st-shop-btn.is-primary{background:linear-gradient(135deg,#2563eb,#0891b2);border-color:rgba(125,211,252,.42);color:#fff;text-align:center}
        #${SEC_ID} .st-shop-btn.is-green{background:linear-gradient(135deg,#16a34a,#0f766e);border-color:rgba(134,239,172,.34);color:#fff;text-align:center}
        #${SEC_ID} .st-shop-btn.is-disabled{opacity:.55;cursor:not-allowed;background:rgba(15,23,42,.64)}
        #${SEC_ID} [data-commerce-product-only-01050][hidden],#${SEC_ID} [data-commerce-category-only-01050][hidden],#${SEC_ID} [data-product-price-widget-01043][hidden],#${SEC_ID} [data-product-actions-widget-01045][hidden],#${SEC_ID} [data-category-card-data-widget-01050][hidden]{display:none!important}
        #${SEC_ID} [data-shop-sub="product-card"].is-target-match-01050{border-color:rgba(34,197,94,.72);box-shadow:0 10px 32px rgba(0,0,0,.34),0 0 0 1px rgba(34,197,94,.13) inset}
        #${SEC_ID} [data-shop-sub="product-card"].is-target-match-01050>.st-shop-subacc__head{background:linear-gradient(90deg,rgba(22,101,52,.30),rgba(15,23,42,.18))}
        #${SEC_ID} .st-commerce-card-mode-switch-01050{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:5px;border-radius:13px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.52)}
        #${SEC_ID} .st-commerce-card-mode-switch-01050 button{appearance:none;border:1px solid transparent;border-radius:10px;padding:9px 8px;background:transparent;color:#94a3b8;font-size:var(--st-shop-font-10-01048,11.5px);font-weight:900;cursor:pointer}
        #${SEC_ID} .st-commerce-card-mode-switch-01050 button.is-active{border-color:rgba(56,189,248,.38);background:linear-gradient(135deg,rgba(37,99,235,.55),rgba(8,145,178,.45));color:#f8fafc;box-shadow:0 8px 18px rgba(14,116,144,.16)}
        #${SEC_ID} .st-commerce-card-mode-match-01050{padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.44);color:#94a3b8;font-size:var(--st-shop-font-9-01048,10.35px);font-weight:800;line-height:1.4}
        #${SEC_ID} .st-commerce-card-mode-match-01050.is-match{border-color:rgba(34,197,94,.34);background:rgba(20,83,45,.20);color:#dcfce7}
        #${SEC_ID} .st-commerce-card-mode-match-01050.is-mismatch{border-color:rgba(148,163,184,.22);background:rgba(30,41,59,.40);color:#cbd5e1}
        #${SEC_ID} .st-category-card-data-widget-01050{gap:12px}
        #${SEC_ID} .st-category-extra-list-01050{display:grid;gap:9px}
        #${SEC_ID} .st-category-extra-editor-01050{display:grid;gap:8px;padding:10px;border-radius:12px;border:1px solid rgba(56,189,248,.14);background:rgba(8,47,73,.14)}
        #${SEC_ID} .st-category-extra-editor-01050__head{display:flex;align-items:center;justify-content:space-between;gap:8px}
        #${SEC_ID} .st-category-extra-editor-01050__head b{font-size:var(--st-shop-font-11-01048,12.65px);color:#e0f2fe}
        #${SEC_ID} .st-category-extra-editor-01050__head button{appearance:none;width:28px;height:28px;border-radius:8px;border:1px solid rgba(248,113,113,.22);background:rgba(127,29,29,.16);color:#fecaca;font-weight:900;cursor:pointer}
        #${SEC_ID} .st-shop-component-widget[inert]{opacity:.48;filter:saturate(.55)}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-subacc__body.is-floating-01049>[data-category-card-data-widget-01050]{grid-column:1/-1}

        #${SEC_ID} .st-shop-font-scale-actions-01049{display:inline-flex;align-items:center;gap:7px}
        #${SEC_ID} .st-shop-floating-open-01049{appearance:none;width:30px;height:30px;display:grid;place-items:center;padding:0;border-radius:9px;border:1px solid rgba(125,211,252,.34);background:linear-gradient(180deg,rgba(14,165,233,.20),rgba(37,99,235,.16));color:#dff6ff;font-size:16px;line-height:1;cursor:pointer;box-shadow:0 7px 18px rgba(2,132,199,.13);transition:transform .1s ease,border-color .12s ease,background .12s ease}
        #${SEC_ID} .st-shop-floating-open-01049:hover{border-color:rgba(125,211,252,.72);background:linear-gradient(180deg,rgba(14,165,233,.34),rgba(37,99,235,.26));transform:translateY(-1px)}
        #${SEC_ID} .st-shop-floating-open-01049:active{transform:translateY(0)}
        #${SEC_ID} .st-product-card-floating-placeholder-01049{margin:10px 12px 12px;padding:11px 12px;border:1px solid rgba(56,189,248,.24);border-radius:12px;background:rgba(8,47,73,.24);display:grid;gap:3px;color:#bae6fd}
        #${SEC_ID} .st-product-card-floating-placeholder-01049[hidden]{display:none!important}
        #${SEC_ID} .st-product-card-floating-placeholder-01049 b{font-size:12px;color:#f0f9ff}
        #${SEC_ID} .st-product-card-floating-placeholder-01049 span{font-size:10px;line-height:1.4;color:#93c5fd}
        #${SEC_ID} .st-product-card-floating-01049{position:fixed;z-index:2147482800;display:none;min-width:620px;min-height:420px;max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);resize:both;overflow:hidden;border:1px solid rgba(125,211,252,.32);border-radius:24px;background:linear-gradient(145deg,rgba(7,12,25,.985),rgba(15,23,42,.985) 48%,rgba(10,18,36,.985));box-shadow:0 34px 100px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.05) inset;color:#e5eef9;isolation:isolate}
        #${SEC_ID} .st-product-card-floating-01049.is-open{display:grid;grid-template-rows:auto auto minmax(0,1fr)}
        #${SEC_ID} .st-product-card-floating-01049__chrome{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:58px;padding:10px 12px 10px 16px;border-bottom:1px solid rgba(148,163,184,.15);background:linear-gradient(180deg,rgba(30,41,59,.96),rgba(15,23,42,.90));box-shadow:0 10px 30px rgba(0,0,0,.20);user-select:none}
        #${SEC_ID} .st-product-card-floating-01049__drag{display:flex;align-items:center;gap:11px;min-width:0;flex:1;cursor:grab;touch-action:none}
        #${SEC_ID} .st-product-card-floating-01049__drag.is-dragging{cursor:grabbing}
        #${SEC_ID} .st-product-card-floating-01049__drag>div{display:grid;gap:2px;min-width:0}
        #${SEC_ID} .st-product-card-floating-01049__drag strong{font-size:15px;line-height:1.15;color:#f8fafc;font-weight:950;letter-spacing:.01em}
        #${SEC_ID} .st-product-card-floating-01049__drag small{font-size:10px;line-height:1.2;color:#94a3b8;font-weight:750}
        #${SEC_ID} .st-product-card-floating-01049__icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:linear-gradient(135deg,#0284c7,#4f46e5);color:#fff;font-size:17px;font-weight:900;box-shadow:0 8px 20px rgba(37,99,235,.26)}
        #${SEC_ID} .st-product-card-floating-01049__window-actions{display:flex;align-items:center;gap:7px}
        #${SEC_ID} .st-product-card-floating-01049__window-actions button{appearance:none;width:34px;height:34px;border-radius:10px;border:1px solid rgba(148,163,184,.20);background:rgba(15,23,42,.76);color:#dbeafe;display:grid;place-items:center;font-size:15px;font-weight:900;cursor:pointer}
        #${SEC_ID} .st-product-card-floating-01049__window-actions button:hover{border-color:rgba(125,211,252,.48);background:rgba(30,64,175,.28);color:#fff}
        #${SEC_ID} .st-product-card-floating-01049__nav{display:flex;align-items:center;gap:7px;padding:9px 14px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(2,6,23,.52);overflow-x:auto;scrollbar-width:thin}
        #${SEC_ID} .st-product-card-floating-01049__nav button{appearance:none;flex:0 0 auto;padding:7px 11px;border-radius:999px;border:1px solid rgba(56,189,248,.18);background:rgba(8,47,73,.18);color:#bae6fd;font-size:11px;font-weight:850;cursor:pointer}
        #${SEC_ID} .st-product-card-floating-01049__nav button:hover{border-color:rgba(125,211,252,.46);background:rgba(14,116,144,.24);color:#f0f9ff}
        #${SEC_ID} .st-product-card-floating-01049__mount{min-height:0;overflow:hidden}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-subacc__body.is-floating-01049{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px;height:100%;padding:18px;overflow:auto;align-items:start;align-content:start;background:radial-gradient(circle at 15% 0%,rgba(14,165,233,.08),transparent 30%),radial-gradient(circle at 90% 15%,rgba(99,102,241,.08),transparent 28%),rgba(2,6,23,.28);box-sizing:border-box;scrollbar-width:thin;scrollbar-color:rgba(125,211,252,.28) rgba(15,23,42,.34)}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-subacc__body.is-floating-01049>.st-shop-component-widget{align-self:start;padding:14px;border-radius:17px;border:1px solid rgba(148,163,184,.16);background:linear-gradient(180deg,rgba(15,23,42,.74),rgba(2,6,23,.48));box-shadow:0 16px 34px rgba(0,0,0,.16),0 1px 0 rgba(255,255,255,.035) inset}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-subacc__body.is-floating-01049>[data-product-card-contract-widget]{grid-column:1/-1;background:linear-gradient(135deg,rgba(8,47,73,.42),rgba(30,41,59,.68))}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-subacc__body.is-floating-01049>[data-product-layout-widget-01046]{grid-column:1/-1}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-subacc__body.is-floating-01049>.st-shop-grid{grid-column:1/-1;padding:12px;border-radius:15px;border:1px solid rgba(148,163,184,.14);background:rgba(15,23,42,.44)}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-widget-head-01039{padding-bottom:9px;border-bottom:1px solid rgba(148,163,184,.11)}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-widget-head-01039 b{color:#f8fafc}
        #${SEC_ID} .st-product-card-floating-01049 .st-shop-floating-open-01049{display:none}
        #${SEC_ID} .st-product-card-floating-01049 .design-field{min-width:0}
        #${SEC_ID} .st-product-card-floating-01049__resize-hint{position:absolute;right:15px;bottom:6px;z-index:3;pointer-events:none;font-size:9px;font-weight:800;color:rgba(148,163,184,.68);letter-spacing:.02em;background:rgba(2,6,23,.72);padding:3px 7px;border-radius:999px}
        #${TOOLTIP_ID}{position:fixed;z-index:2147483600;display:none;width:min(640px,calc(100vw - 32px));max-height:min(70vh,620px);overflow:auto;padding:24px 26px;border-radius:24px;background:linear-gradient(135deg,rgba(2,6,23,.98),rgba(15,23,42,.98));border:2px solid rgba(125,211,252,.62);box-shadow:0 30px 90px rgba(0,0,0,.48),0 0 0 1px rgba(255,255,255,.08) inset;color:#fff;font-size:21px;line-height:1.45;font-weight:850;letter-spacing:.01em;white-space:pre-wrap;text-align:left;pointer-events:none}
        #${TOOLTIP_ID}.is-visible{display:block}
      </style>
      <div class="st-shop-card-ui">
        <div class="st-shop-top">
          <button type="button" class="st-shop-help-chip" data-shop-help-tip="${esc(SHOP_HELP_TEXT)}">ℹ Інструкція</button>
          <div class="st-shop-badge" data-shop-summary>${countSummaryHtml()}</div>
        </div>

        ${subAccordion('product-card', 'Карточка товару', PRODUCT_HELP_TEXT, `
          ${commerceCardBindingWidgetHtml01067()}
          ${productCardContractInspectorHtml01038()}
          ${productCardImageWidgetHtml01039()}
          ${productCardTextContentWidgetHtml01042()}
          ${productCardPriceWidgetHtml01043()}
          ${categoryCardDataWidgetHtml01050()}
          ${productCardBadgeWidgetHtml01044()}
          ${productCardActionsWidgetHtml01045()}
          ${productCardLayoutWidgetHtml01046()}
          <div class="st-shop-grid">
            <button type="button" class="st-shop-btn is-primary" data-shop-act="open-commerce-card-gallery" data-commerce-card-gallery-button-01050>Шаблони карточки товару</button>
            <button type="button" class="st-shop-btn is-disabled" disabled>Зберегти шаблон</button>
            <button type="button" class="st-shop-btn is-disabled" data-commerce-product-only-01050 disabled>Product Grid</button>
          </div>
        `)}

        ${subAccordion('product-page', 'Сторінка товару', PRODUCT_PAGE_HELP_TEXT, `
          <div class="st-shop-grid">
            <button type="button" class="st-shop-btn is-primary" data-shop-act="add-product-page">+ Додати секцію товару</button>
            <button type="button" class="st-shop-btn" data-shop-act="open-shop-gallery">Вибрати дизайн</button>
            <button type="button" class="st-shop-btn is-disabled" disabled>Підв’язати до товару</button>
            <button type="button" class="st-shop-btn is-disabled" disabled>Зберегти шаблон</button>
            <button type="button" class="st-shop-btn is-disabled" disabled>Галерея фото</button>
            <button type="button" class="st-shop-btn is-disabled" disabled>Показати / приховати блоки</button>
          </div>
        `)}
      </div>
    </div>
  `;
}

function updateSummary(sectionEl) {
  const summary = sectionEl?.querySelector?.('[data-shop-summary]');
  if (summary) summary.innerHTML = countSummaryHtml();
}

function bindSubAccordions(sectionEl) {
  const state = readState();
  sectionEl.querySelectorAll('[data-shop-sub]').forEach((acc) => {
    const id = acc.dataset.shopSub || '';
    const head = acc.querySelector('[data-shop-sub-head]');
    const body = acc.querySelector('[data-shop-sub-body]');
    const isOpen = !!state[id];
    acc.classList.toggle('is-open', isOpen);
    if (head) head.setAttribute('aria-expanded', String(isOpen));
    if (body) body.hidden = !isOpen;
    if (head && !head.__stShopSubBound) {
      head.__stShopSubBound = true;
      head.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const nextOpen = !acc.classList.contains('is-open');
        acc.classList.toggle('is-open', nextOpen);
        head.setAttribute('aria-expanded', String(nextOpen));
        if (body) body.hidden = !nextOpen;
        const next = readState();
        next[id] = nextOpen;
        writeState(next);
      });
    }
  });
}

function ensureShopHelpTooltip() {
  let tip = document.getElementById(TOOLTIP_ID);
  if (tip) return tip;
  tip = document.createElement('div');
  tip.id = TOOLTIP_ID;
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  return tip;
}

function positionShopHelpTooltip(tip, anchor) {
  if (!tip || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const margin = 16;
  const width = Math.min(640, Math.max(280, window.innerWidth - margin * 2));
  tip.style.width = `${width}px`;
  let left = rect.left;
  if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
  if (left < margin) left = margin;
  let top = rect.bottom + 12;
  const tipHeight = Math.min(tip.scrollHeight || 280, window.innerHeight * 0.7);
  if (top + tipHeight > window.innerHeight - margin) top = Math.max(margin, rect.top - tipHeight - 12);
  tip.style.left = `${Math.round(left)}px`;
  tip.style.top = `${Math.round(top)}px`;
}

function bindShopHelpTooltip(sectionEl) {
  if (!sectionEl || sectionEl.__stShopHelpBound) return;
  sectionEl.__stShopHelpBound = true;

  let timer = null;
  let activeAnchor = null;

  const hide = () => {
    clearTimeout(timer);
    timer = null;
    activeAnchor = null;
    const tip = document.getElementById(TOOLTIP_ID);
    if (tip) {
      tip.classList.remove('is-visible');
      tip.textContent = '';
    }
  };

  const schedule = (anchor) => {
    clearTimeout(timer);
    activeAnchor = anchor;
    timer = window.setTimeout(() => {
      if (!activeAnchor || !document.body.contains(activeAnchor)) return;
      const text = activeAnchor.getAttribute('data-shop-help-tip') || '';
      if (!text.trim()) return;
      const tip = ensureShopHelpTooltip();
      tip.textContent = text;
      tip.classList.add('is-visible');
      positionShopHelpTooltip(tip, activeAnchor);
    }, HELP_DELAY_MS);
  };

  sectionEl.addEventListener('pointerover', (ev) => {
    const anchor = ev.target?.closest?.('[data-shop-help-tip]');
    if (!anchor || !sectionEl.contains(anchor)) return;
    schedule(anchor);
  }, true);

  sectionEl.addEventListener('pointerout', (ev) => {
    const anchor = ev.target?.closest?.('[data-shop-help-tip]');
    if (!anchor || !sectionEl.contains(anchor)) return;
    const next = ev.relatedTarget;
    if (next && anchor.contains(next)) return;
    hide();
  }, true);

  sectionEl.addEventListener('click', hide, true);
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide, true);
}

function openShopGallery() {
  try {
    openTemplatesGalleryManager('shop');
  } catch (err) {
    console.warn('[shop-widget] Не вдалося відкрити галерею магазину:', err);
  }
}

function openCommerceCardGallery01050(sectionEl) {
  try {
    const componentType=sectionEl?.dataset?.commerceCardMode01050 || readCommerceCardMode01050();
    const api = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
    const target = api?.resolveMainComponentTarget01041?.(componentType) || null;
    const replaceAny=String(target?.replaceCommerceTargetId01050 || target?.replaceTargetId || '').trim();
    if (!target?.insertParentId && !replaceAny) {
      try { alert(`Виберіть контейнер або рівень Main, у який потрібно додати ${commerceCardModeLabel01050(componentType)}. Для заміни виберіть існуючу карточку товару або категорії.`); } catch {}
      return;
    }
    try { window.__ST_ALL_LOG__?.push?.('commerce-card-gallery-target-01050', {
      insertParentId: String(target?.insertParentId || ''),
      replaceTargetId: replaceAny,
      selectedId: String(target?.selectedId || ''),
      selectedCommerceType: String(target?.selectedCommerceType01050 || ''),
      source: String(target?.source || ''),
      componentType,
      allowTypeChange01050:true
    }); } catch {}
    openTemplatesGalleryManager('shop', {
      folderId: componentType==='category-card' ? 'fld_shop_category_cards' : 'fld_shop_product_cards',
      componentType01041: componentType,
      componentInsertParentId01041: String(target?.insertParentId || ''),
      componentReplaceTargetId01041: replaceAny,
      allowCommerceTypeChange01050: true
    });
  } catch (err) {
    console.warn('[shop-widget][01050] Не вдалося відкрити галерею Commerce Card:', err);
  }
}

function handleAction(sectionEl, act) {
  if (act === 'add-category-card') {
    addShopCardSection('category');
    updateSummary(sectionEl);
    return;
  }
  if (act === 'add-product-card' || act === 'open-product-card-gallery' || act === 'open-commerce-card-gallery') {
    openCommerceCardGallery01050(sectionEl);
    return;
  }
  if (act === 'add-product-page') {
    addShopProductPageSection();
    updateSummary(sectionEl);
    return;
  }
  if (act === 'open-shop-gallery') {
    openShopGallery();
  }
}

export function initShopAccordionWidget(host, getSelection) {
  if (!host) return;
  bindShopEditablePersistenceOnce();
  if (host.querySelector(`#${SEC_ID}`)) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;
  sectionEl.dataset.widget = 'shop-accordion';
  sectionEl.innerHTML = buildSectionHtml();

  const header = sectionEl.querySelector('.design-section__header');
  if (header) {
    header.addEventListener('click', (ev) => {
      ev.preventDefault();
      const isOpen = sectionEl.classList.contains('is-open');
      ensureOpen(sectionEl, !isOpen);
    });
  }

  bindSubAccordions(sectionEl);
  bindCommerceCardBindingWidget01067(sectionEl, getSelection, notifyChanged);
  bindProductCardContractPanel01038(sectionEl, getSelection);
  bindProductCardImageWidget01039(sectionEl, getSelection, notifyChanged);
  bindProductCardTextContentWidget01042(sectionEl, getSelection, notifyChanged);
  bindProductCardPriceWidget01043(sectionEl, getSelection, notifyChanged);
  bindCategoryCardDataWidget01050(sectionEl, getSelection);
  bindProductCardBadgeWidget01044(sectionEl, getSelection, notifyChanged);
  bindProductCardActionsWidget01045(sectionEl, getSelection, notifyChanged);
  bindProductCardLayoutWidget01046(sectionEl, getSelection, notifyChanged);
  bindProductCardFloatingPanel01049(sectionEl);
  bindShopHelpTooltip(sectionEl);

  sectionEl.addEventListener('click', (ev) => {
    const actionBtn = ev.target.closest('[data-shop-act]');
    if (actionBtn && sectionEl.contains(actionBtn)) {
      ev.preventDefault();
      ev.stopPropagation();
      handleAction(sectionEl, actionBtn.dataset.shopAct);
    }
  });

  host.appendChild(sectionEl);
  updateSummary(sectionEl);

  window.addEventListener('st:shop-accordion:refresh', () => updateSummary(sectionEl));
  window.addEventListener('st:canvas-snapshot-applied', () => updateSummary(sectionEl));
  window.addEventListener('st-page-selected', () => setTimeout(() => updateSummary(sectionEl), 50));
  window.addEventListener('builder:structureChanged', () => setTimeout(() => updateSummary(sectionEl), 30));
}
