// 01041 · Commerce component templates · Product Card
// System templates are component payloads, not Main sections.
// Apply is owned by SiteFrameStore through applyMainComponentTemplate01041().

const CONTRACT = 'st-commerce-product-card-v1-01038';
const PRIMARY = 'assets/collections/shifttime-marketplace-02/real-products/06-pan-stainless-lid-gift.webp';
const SECONDARY = 'assets/collections/shifttime-marketplace-02/real-products/07-pan-lid-bag.webp';

const PRODUCT_CARD_01_HTML_01041 = `
<div class="st-block st-shop-card-block st-shop-product-card-block st-commerce-product-card-template st-commerce-product-card-template--classic"
  data-commerce-component="product-card"
  data-shop-type="product-card"
  data-shop-card="product"
  data-commerce-contract="${CONTRACT}"
  data-commerce-template="product-card-classic-01-01041"
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
  data-commerce-badge-visible="1"
  data-commerce-badge-mode="hit"
  data-commerce-badge-custom=""
  data-commerce-badge-position="top-left"
  data-commerce-badge-offset-x="14"
  data-commerce-badge-offset-y="14"
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
  data-commerce-layout-mode="vertical"
  data-commerce-layout-density="standard"
  data-commerce-layout-width-mode="max"
  data-commerce-layout-max-width="380"
  data-commerce-layout-height-mode="auto"
  data-commerce-layout-height="420"
  data-commerce-layout-media-share="44"
  data-commerce-layout-content-min="170"
  data-commerce-layout-wrap="1"
  data-commerce-layout-body-padding="20"
  data-commerce-layout-body-gap="10"
  data-commerce-layout-section-gap="0"
  data-commerce-layout-align="left"
  style="width:min(100%,380px);max-width:380px;min-width:0;margin:0 auto;padding:0;background:#ffffff;color:#171a18;border:1px solid #e4ded5;border-radius:26px;box-shadow:0 22px 58px rgba(31,26,20,.12);overflow:hidden;box-sizing:border-box;">
  <article class="st-shop-card st-shop-product-card" data-shop-card-inner="product" data-commerce-role="surface" style="display:flex;flex-direction:column;width:100%;height:100%;background:#fff;color:#171a18;box-sizing:border-box;">
    <div class="st-shop-card__media" data-shop-field="product_image" data-commerce-role="media" style="position:relative;height:270px;background:#f2ede4;display:block;overflow:hidden;border-radius:24px 24px 0 0;box-sizing:border-box;">
      <img class="st-shop-card__image-primary-01039" data-commerce-role="image" data-commerce-bind="product.image" src="${PRIMARY}" alt="Сковорода з диска борони" style="display:block;width:100%;height:100%;object-fit:cover;object-position:center center;transition:opacity 280ms ease,transform 160ms ease;">
      <img class="st-shop-card__image-secondary-01039" data-commerce-role="image-secondary" data-commerce-bind="product.imageSecondary" src="${SECONDARY}" alt="Сковорода у комплекті" style="position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center center;opacity:0;transition:opacity 280ms ease,transform 160ms ease;pointer-events:none;">
      <span data-shop-field="product_badge" data-commerce-role="badge" data-commerce-bind="product.badge" style="position:absolute;top:14px;left:14px;padding:7px 11px;border-radius:999px;background:#9a4308;color:#fff;font-size:11px;font-weight:950;letter-spacing:.05em;box-shadow:0 10px 24px rgba(154,67,8,.24);z-index:3;">ХІТ</span>
      <button type="button" data-commerce-role="wishlist" data-commerce-action="wishlist" data-commerce-action-label="У вибране" data-commerce-action-icon="♡" data-commerce-action-mode="icon" aria-label="У вибране" style="position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.72);background:rgba(255,255,255,.88);color:#171a18;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;"><span data-commerce-action-icon-slot="1" aria-hidden="true">♡</span></button>
    </div>
    <div class="st-shop-card__body" data-commerce-role="body" style="display:grid;gap:10px;padding:20px;box-sizing:border-box;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <span data-commerce-role="brand" data-commerce-bind="product.brand" style="font-size:10px;font-weight:900;letter-spacing:.12em;color:#9a4308;text-transform:uppercase;">SHIFTIME</span>
        <span data-commerce-role="stock" data-commerce-bind="product.stock" style="font-size:11px;font-weight:850;color:#215f44;">● В наявності</span>
      </div>
      <h3 class="st-shop-card__title st-text-edit st-text-edit--heading" data-st-text-target="1" data-shop-field="product_name" data-commerce-role="title" data-commerce-bind="product.name" contenteditable="true" spellcheck="false" style="margin:0;font-size:21px;line-height:1.16;font-weight:950;color:#171a18;">Сковорода з диска борони 50 см</h3>
      <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
        <span data-commerce-role="rating" data-commerce-bind="product.rating" style="color:#b45309;font-weight:900;letter-spacing:.04em;">★★★★★</span>
        <span data-commerce-role="reviews-count" data-commerce-bind="product.reviewsCount" style="color:#737d76;font-weight:750;">128 відгуків</span>
      </div>
      <p class="st-shop-card__description st-text-edit" data-st-text-target="1" data-shop-field="product_short_description" data-commerce-role="description" data-commerce-bind="product.shortDescription" contenteditable="true" spellcheck="false" style="margin:0;color:#667069;font-size:13px;line-height:1.55;">Для живого вогню, великої компанії та домашньої кухні. Міцний метал і зручна комплектація.</p>
      <div class="st-shop-card__price-row" data-commerce-role="price-group" style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding-top:2px;">
        <strong class="st-shop-card__price st-text-edit" data-st-text-target="1" data-shop-field="product_price" data-commerce-role="price-current" data-commerce-bind="product.price" contenteditable="true" spellcheck="false" style="font-size:25px;color:#171a18;font-weight:1000;">1 450 грн</strong>
        <span class="st-shop-card__old-price st-text-edit" data-st-text-target="1" data-shop-field="product_old_price" data-commerce-role="price-old" data-commerce-bind="product.oldPrice" contenteditable="true" spellcheck="false" style="font-size:13px;color:#9aa19c;text-decoration:line-through;font-weight:800;">1 650 грн</span>
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
</div>`;

export const PRODUCT_CARD_TEMPLATES_01041 = Object.freeze([
  Object.freeze({
    id: 'product-card-classic-01-01041',
    type: 'shop',
    templateKind: 'component',
    componentType: 'product-card',
    name: '01 · ShiftTime · Класична карточка товару',
    folderId: 'fld_shop_product_cards',
    html: PRODUCT_CARD_01_HTML_01041,
    previewHtml: PRODUCT_CARD_01_HTML_01041,
    meta: Object.freeze({
      source: 'system',
      stage: '01041',
      commerceComponentTemplate01041: true,
      commerceComponentType: 'product-card',
      commerceContract: CONTRACT,
      applyModes: Object.freeze(['add', 'replace']),
      storeAuthority: 'SiteFrameStore',
      insertScope: 'selected-main-container-or-level',
      replaceScope: 'selected-product-card-only',
      templateDataSeparated: true,
      textContentWidget01042: true,
      semanticTextState01042: true,
      priceWidget01043: true,
      semanticPriceState01043: true,
      badgeWidget01044: true,
      semanticBadgeState01044: true,
      actionsWidget01045: true,
      semanticActionsState01045: true,
      layoutWidget01046: true,
      semanticLayoutState01046: true
    })
  })
]);

export function getProductCardTemplates01041() {
  return PRODUCT_CARD_TEMPLATES_01041;
}
