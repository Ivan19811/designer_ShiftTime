// 01047 · Commerce component templates · Product Card Collection
// Ten diverse system templates for the same canonical product-card contract.

const CONTRACT = 'st-commerce-product-card-v1-01038';
const IMG = Object.freeze({
  panMain: 'assets/collections/shifttime-marketplace-02/real-products/06-pan-stainless-lid-gift.webp',
  panAlt: 'assets/collections/shifttime-marketplace-02/real-products/07-pan-lid-bag.webp',
  panFire: 'assets/collections/shifttime-marketplace-02/real-products/09-pan-fire-cooking.webp',
  panCover: 'assets/collections/shifttime-marketplace-02/real-products/04-disc-pan-cover-bag.webp',
  panPersonal: 'assets/collections/shifttime-marketplace-02/real-products/05-disc-pan-personal-cover.webp',
  kazans: 'assets/collections/shifttime-marketplace-02/real-products/01-kazany-lineup.webp',
  kazanTripod: 'assets/collections/shifttime-marketplace-02/real-products/02-kazan-tripod.webp',
  skewers: 'assets/collections/shifttime-marketplace-02/real-products/03-engraved-skewers.webp',
  mangal: 'assets/collections/shifttime-marketplace-02/real-products/10-mangal-custom.webp',
  family: 'assets/collections/shifttime-marketplace-02/real-products/08-pan-family.webp'
});

function esc(v){
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function rootAttrs(cfg){
  const attrs = {
    'data-commerce-component': 'product-card',
    'data-shop-type': 'product-card',
    'data-shop-card': 'product',
    'data-commerce-contract': CONTRACT,
    'data-commerce-template': cfg.id,
    'data-commerce-image-visible': '1',
    'data-commerce-hover-second': cfg.hoverSecond ? '1' : '0',
    'data-commerce-image-scale': String(cfg.imageScale || 100),
    'data-commerce-image-duration': String(cfg.imageDuration || 280),
    'data-commerce-brand-visible': cfg.brandVisible !== false ? '1' : '0',
    'data-commerce-brand-lines': '0',
    'data-commerce-title-visible': '1',
    'data-commerce-title-lines': String(cfg.titleLines || 0),
    'data-commerce-title-min-height': String(cfg.titleMinHeight || 0),
    'data-commerce-description-visible': cfg.descriptionVisible !== false ? '1' : '0',
    'data-commerce-description-lines': String(cfg.descriptionLines || 0),
    'data-commerce-stock-visible': cfg.stockVisible !== false ? '1' : '0',
    'data-commerce-stock-state': cfg.stockState || 'in-stock',
    'data-commerce-stock-custom': cfg.stockCustom || '',
    'data-commerce-rating-visible': cfg.ratingVisible !== false ? '1' : '0',
    'data-commerce-rating-value': String(cfg.ratingValue || '4.9'),
    'data-commerce-rating-mode': cfg.ratingMode || 'stars',
    'data-commerce-reviews-visible': cfg.reviewsVisible !== false ? '1' : '0',
    'data-commerce-reviews-count': String(cfg.reviewsCount || 128),
    'data-commerce-reviews-label': cfg.reviewsLabel || 'відгуків',
    'data-commerce-price-current': String(cfg.priceCurrent || 1450),
    'data-commerce-price-old': String(cfg.priceOld || 1650),
    'data-commerce-price-current-visible': '1',
    'data-commerce-price-old-visible': cfg.priceOldVisible !== false ? '1' : '0',
    'data-commerce-discount-visible': cfg.discountVisible !== false ? '1' : '0',
    'data-commerce-currency-mode': cfg.currencyMode || 'uah-text',
    'data-commerce-currency-custom': cfg.currencyCustom || '',
    'data-commerce-currency-position': cfg.currencyPosition || 'after',
    'data-commerce-currency-space': cfg.currencySpace === false ? '0' : '1',
    'data-commerce-price-format': cfg.priceFormat || 'space',
    'data-commerce-price-decimals': String(cfg.priceDecimals || 0),
    'data-commerce-discount-mode': cfg.discountMode || 'auto-percent',
    'data-commerce-discount-custom': cfg.discountCustom || '',
    'data-commerce-price-order': cfg.priceOrder || 'current-old-discount',
    'data-commerce-price-gap': String(cfg.priceGap || 10),
    'data-commerce-badge-visible': cfg.badgeVisible !== false ? '1' : '0',
    'data-commerce-badge-mode': cfg.badgeMode || 'hit',
    'data-commerce-badge-custom': cfg.badgeCustom || '',
    'data-commerce-badge-position': cfg.badgePosition || 'top-left',
    'data-commerce-badge-offset-x': String(cfg.badgeOffsetX || 14),
    'data-commerce-badge-offset-y': String(cfg.badgeOffsetY || 14),
    'data-commerce-action-add-to-cart-visible': cfg.showAddToCart === false ? '0' : '1',
    'data-commerce-action-add-to-cart-label': cfg.addToCartLabel || 'У кошик',
    'data-commerce-action-add-to-cart-icon': cfg.addToCartIcon || '🛒',
    'data-commerce-action-add-to-cart-mode': cfg.addToCartMode || 'text',
    'data-commerce-action-add-to-cart-icon-position': cfg.addToCartIconPosition || 'before',
    'data-commerce-action-add-to-cart-width': cfg.addToCartWidth || 'full',
    'data-commerce-action-add-to-cart-order': String(cfg.addToCartOrder || 10),
    'data-commerce-action-buy-now-visible': cfg.showBuyNow ? '1' : '0',
    'data-commerce-action-buy-now-label': cfg.buyNowLabel || 'Купити зараз',
    'data-commerce-action-buy-now-icon': cfg.buyNowIcon || '⚡',
    'data-commerce-action-buy-now-mode': cfg.buyNowMode || 'text',
    'data-commerce-action-buy-now-icon-position': cfg.buyNowIconPosition || 'before',
    'data-commerce-action-buy-now-width': cfg.buyNowWidth || 'full',
    'data-commerce-action-buy-now-order': String(cfg.buyNowOrder || 20),
    'data-commerce-action-wishlist-visible': cfg.showWishlist === false ? '0' : '1',
    'data-commerce-action-wishlist-label': cfg.wishlistLabel || 'У вибране',
    'data-commerce-action-wishlist-icon': cfg.wishlistIcon || '♡',
    'data-commerce-action-wishlist-mode': cfg.wishlistMode || 'icon',
    'data-commerce-action-wishlist-icon-position': 'before',
    'data-commerce-action-wishlist-width': 'auto',
    'data-commerce-action-compare-visible': cfg.showCompare === false ? '0' : '1',
    'data-commerce-action-compare-label': cfg.compareLabel || 'Порівняти',
    'data-commerce-action-compare-icon': cfg.compareIcon || '⇄',
    'data-commerce-action-compare-mode': cfg.compareMode || 'icon',
    'data-commerce-action-compare-icon-position': 'before',
    'data-commerce-action-compare-width': 'auto',
    'data-commerce-action-compare-order': String(cfg.compareOrder || 30),
    'data-commerce-action-quick-view-visible': cfg.showQuickView ? '1' : '0',
    'data-commerce-action-quick-view-label': cfg.quickViewLabel || 'Швидкий перегляд',
    'data-commerce-action-quick-view-icon': cfg.quickViewIcon || '◉',
    'data-commerce-action-quick-view-mode': cfg.quickViewMode || 'icon',
    'data-commerce-action-quick-view-icon-position': 'before',
    'data-commerce-action-quick-view-width': 'auto',
    'data-commerce-action-quick-view-order': String(cfg.quickViewOrder || 40),
    'data-commerce-layout-mode': cfg.layoutMode || 'vertical',
    'data-commerce-layout-density': cfg.layoutDensity || 'standard',
    'data-commerce-layout-width-mode': cfg.widthMode || 'max',
    'data-commerce-layout-max-width': String(cfg.maxWidth || 380),
    'data-commerce-layout-height-mode': cfg.heightMode || 'auto',
    'data-commerce-layout-height': String(cfg.height || 420),
    'data-commerce-layout-media-share': String(cfg.mediaShare || 44),
    'data-commerce-layout-content-min': String(cfg.contentMin || 170),
    'data-commerce-layout-wrap': cfg.wrap === false ? '0' : '1',
    'data-commerce-layout-body-padding': String(cfg.bodyPadding || 20),
    'data-commerce-layout-body-gap': String(cfg.bodyGap || 10),
    'data-commerce-layout-section-gap': String(cfg.sectionGap || 0),
    'data-commerce-layout-align': cfg.align || 'left',
    'style': cfg.rootStyle
  };
  return Object.entries(attrs).map(([k,v])=>`${k}="${esc(v)}"`).join('\n  ');
}

function actionContent(mode, icon, label, iconPosition='before'){
  if(mode === 'icon') return `<span data-commerce-action-icon-slot="1" aria-hidden="true">${esc(icon)}</span>`;
  if(mode === 'icon-text'){
    return iconPosition === 'after'
      ? `<span data-commerce-action-label-slot="1">${esc(label)}</span><span data-commerce-action-icon-slot="1" aria-hidden="true">${esc(icon)}</span>`
      : `<span data-commerce-action-icon-slot="1" aria-hidden="true">${esc(icon)}</span><span data-commerce-action-label-slot="1">${esc(label)}</span>`;
  }
  return `<span data-commerce-action-label-slot="1">${esc(label)}</span>`;
}

function buildTemplateHtml(cfg){
  const layoutDir = cfg.layoutMode === 'horizontal-right' ? 'row-reverse' : (cfg.layoutMode === 'horizontal-left' ? 'row' : 'column');
  const mediaBorder = cfg.layoutMode === 'vertical' ? (cfg.mediaBorderRadius || '24px 24px 0 0') : (cfg.mediaBorderRadius || '24px 0 0 24px');
  const bodyWrapStyle = cfg.bodyWrapStyle || '';
  const mediaExtra = cfg.mediaExtraStyle || '';
  const articleStyle = cfg.articleStyle || `display:flex;flex-direction:${layoutDir};width:100%;height:100%;background:${cfg.articleBg || '#fff'};color:${cfg.textColor || '#171a18'};box-sizing:border-box;`;
  const titleTag = cfg.titleTag || 'h3';
  return `
<div class="st-block st-shop-card-block st-shop-product-card-block st-commerce-product-card-template ${esc(cfg.rootClass || '')}"
  ${rootAttrs(cfg)}>
  <article class="st-shop-card st-shop-product-card" data-shop-card-inner="product" data-commerce-role="surface" style="${esc(articleStyle)}">
    <div class="st-shop-card__media" data-shop-field="product_image" data-commerce-role="media" style="${esc(cfg.mediaStyle || `position:relative;${cfg.layoutMode === 'vertical' ? 'height:270px;' : `flex:0 0 ${cfg.mediaShare || 44}%;min-height:100%;`}background:${cfg.mediaBg || '#f2ede4'};display:block;overflow:hidden;border-radius:${mediaBorder};box-sizing:border-box;`)}${esc(mediaExtra)}">
      <img class="st-shop-card__image-primary-01047" data-commerce-role="image" data-commerce-bind="product.image" src="${esc(cfg.primary)}" alt="${esc(cfg.title)}" style="${esc(cfg.primaryImageStyle || 'display:block;width:100%;height:100%;object-fit:cover;object-position:center center;transition:opacity 280ms ease,transform 160ms ease;')}">
      <img class="st-shop-card__image-secondary-01047" data-commerce-role="image-secondary" data-commerce-bind="product.imageSecondary" src="${esc(cfg.secondary || cfg.primary)}" alt="${esc(cfg.title)}" style="${esc(cfg.secondaryImageStyle || 'position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:center center;opacity:0;transition:opacity 280ms ease,transform 160ms ease;pointer-events:none;')}">
      <span data-shop-field="product_badge" data-commerce-role="badge" data-commerce-bind="product.badge" style="${esc(cfg.badgeStyle || 'position:absolute;top:14px;left:14px;padding:7px 11px;border-radius:999px;background:#9a4308;color:#fff;font-size:11px;font-weight:950;letter-spacing:.05em;box-shadow:0 10px 24px rgba(154,67,8,.24);z-index:3;')}">${esc(cfg.badgeText || 'ХІТ')}</span>
      <button type="button" data-commerce-role="wishlist" data-commerce-action="wishlist" data-commerce-action-label="${esc(cfg.wishlistLabel || 'У вибране')}" data-commerce-action-icon="${esc(cfg.wishlistIcon || '♡')}" data-commerce-action-mode="${esc(cfg.wishlistMode || 'icon')}" aria-label="${esc(cfg.wishlistLabel || 'У вибране')}" style="${esc(cfg.wishlistStyle || 'position:absolute;top:14px;right:14px;width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.72);background:rgba(255,255,255,.88);color:#171a18;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;')}">${actionContent(cfg.wishlistMode || 'icon', cfg.wishlistIcon || '♡', cfg.wishlistLabel || 'У вибране')}</button>
    </div>
    <div class="st-shop-card__body" data-commerce-role="body" style="${esc(cfg.bodyStyle || `display:grid;gap:${cfg.bodyGap || 10}px;padding:${cfg.bodyPadding || 20}px;box-sizing:border-box;`)}${esc(bodyWrapStyle)}">
      <div style="${esc(cfg.topMetaRowStyle || 'display:flex;align-items:center;justify-content:space-between;gap:10px;')}">
        <span data-commerce-role="brand" data-commerce-bind="product.brand" style="${esc(cfg.brandStyle || 'font-size:10px;font-weight:900;letter-spacing:.12em;color:#9a4308;text-transform:uppercase;')}">${esc(cfg.brand || 'SHIFTIME')}</span>
        <span data-commerce-role="stock" data-commerce-bind="product.stock" style="${esc(cfg.stockStyle || 'font-size:11px;font-weight:850;color:#215f44;')}">${esc(cfg.stockText || '● В наявності')}</span>
      </div>
      <${titleTag} class="st-shop-card__title st-text-edit st-text-edit--heading" data-st-text-target="1" data-shop-field="product_name" data-commerce-role="title" data-commerce-bind="product.name" contenteditable="true" spellcheck="false" style="${esc(cfg.titleStyle || 'margin:0;font-size:21px;line-height:1.16;font-weight:950;color:#171a18;')}">${esc(cfg.title)}</${titleTag}>
      <div style="${esc(cfg.ratingRowStyle || 'display:flex;align-items:center;gap:8px;font-size:12px;')}">
        <span data-commerce-role="rating" data-commerce-bind="product.rating" style="${esc(cfg.ratingStyle || 'color:#b45309;font-weight:900;letter-spacing:.04em;')}">${esc(cfg.ratingText || '★★★★★')}</span>
        <span data-commerce-role="reviews-count" data-commerce-bind="product.reviewsCount" style="${esc(cfg.reviewsStyle || 'color:#737d76;font-weight:750;')}">${esc(cfg.reviewsCount || 128)} ${esc(cfg.reviewsLabel || 'відгуків')}</span>
      </div>
      <p class="st-shop-card__description st-text-edit" data-st-text-target="1" data-shop-field="product_short_description" data-commerce-role="description" data-commerce-bind="product.shortDescription" contenteditable="true" spellcheck="false" style="${esc(cfg.descriptionStyle || 'margin:0;color:#667069;font-size:13px;line-height:1.55;')}">${esc(cfg.description)}</p>
      <div class="st-shop-card__price-row" data-commerce-role="price-group" style="${esc(cfg.priceRowStyle || 'display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;padding-top:2px;')}">
        <strong class="st-shop-card__price st-text-edit" data-st-text-target="1" data-shop-field="product_price" data-commerce-role="price-current" data-commerce-bind="product.price" contenteditable="true" spellcheck="false" style="${esc(cfg.currentPriceStyle || 'font-size:25px;color:#171a18;font-weight:1000;')}">${esc(cfg.currentPriceText || '1 450 грн')}</strong>
        <span class="st-shop-card__old-price st-text-edit" data-st-text-target="1" data-shop-field="product_old_price" data-commerce-role="price-old" data-commerce-bind="product.oldPrice" contenteditable="true" spellcheck="false" style="${esc(cfg.oldPriceStyle || 'font-size:13px;color:#9aa19c;text-decoration:line-through;font-weight:800;')}">${esc(cfg.oldPriceText || '1 650 грн')}</span>
        <span data-commerce-role="discount" data-commerce-bind="product.discount" style="${esc(cfg.discountStyle || 'font-size:11px;font-weight:900;color:#9a4308;')}">${esc(cfg.discountText || '−12%')}</span>
      </div>
      <div data-commerce-role="actions" style="${esc(cfg.actionsStyle || 'display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:5px;')}">
        <a class="st-shop-card__button" data-shop-field="product_url" data-commerce-role="add-to-cart" data-commerce-action="add-to-cart" data-commerce-action-label="${esc(cfg.addToCartLabel || 'У кошик')}" data-commerce-action-icon="${esc(cfg.addToCartIcon || '🛒')}" data-commerce-action-mode="${esc(cfg.addToCartMode || 'text')}" data-commerce-bind="product.url" href="#" aria-label="${esc(cfg.addToCartLabel || 'У кошик')}" style="${esc(cfg.addToCartStyle || 'display:inline-flex;align-items:center;justify-content:center;min-height:45px;width:100%;padding:11px 16px;border-radius:14px;background:linear-gradient(180deg,#c96a23,#8f3b08);color:white;text-decoration:none;font-weight:950;box-shadow:0 14px 30px rgba(154,67,8,.20);order:10;')}">${actionContent(cfg.addToCartMode || 'text', cfg.addToCartIcon || '🛒', cfg.addToCartLabel || 'У кошик', cfg.addToCartIconPosition || 'before')}</a>
        <button type="button" data-commerce-role="buy-now" data-commerce-action="buy-now" data-commerce-action-label="${esc(cfg.buyNowLabel || 'Купити зараз')}" data-commerce-action-icon="${esc(cfg.buyNowIcon || '⚡')}" data-commerce-action-mode="${esc(cfg.buyNowMode || 'text')}" aria-label="${esc(cfg.buyNowLabel || 'Купити зараз')}" ${cfg.showBuyNow ? '' : 'hidden'} style="${esc(cfg.buyNowStyle || 'display:inline-flex;align-items:center;justify-content:center;min-height:45px;width:100%;padding:11px 14px;border-radius:14px;border:1px solid #9a4308;background:#fffaf3;color:#9a4308;font-weight:900;cursor:pointer;order:20;')}">${actionContent(cfg.buyNowMode || 'text', cfg.buyNowIcon || '⚡', cfg.buyNowLabel || 'Купити зараз', cfg.buyNowIconPosition || 'before')}</button>
        <button type="button" data-commerce-role="compare" data-commerce-action="compare" data-commerce-action-label="${esc(cfg.compareLabel || 'Порівняти')}" data-commerce-action-icon="${esc(cfg.compareIcon || '⇄')}" data-commerce-action-mode="${esc(cfg.compareMode || 'icon')}" aria-label="${esc(cfg.compareLabel || 'Порівняти')}" style="${esc(cfg.compareStyle || 'display:inline-flex;align-items:center;justify-content:center;width:45px;height:45px;border-radius:14px;border:1px solid #d8d0c4;background:#fffaf3;color:#171a18;font-size:17px;cursor:pointer;order:30;')}">${actionContent(cfg.compareMode || 'icon', cfg.compareIcon || '⇄', cfg.compareLabel || 'Порівняти')}</button>
        <button type="button" data-commerce-role="quick-view" data-commerce-action="quick-view" data-commerce-action-label="${esc(cfg.quickViewLabel || 'Швидкий перегляд')}" data-commerce-action-icon="${esc(cfg.quickViewIcon || '◉')}" data-commerce-action-mode="${esc(cfg.quickViewMode || 'icon')}" aria-label="${esc(cfg.quickViewLabel || 'Швидкий перегляд')}" ${cfg.showQuickView ? '' : 'hidden'} style="${esc(cfg.quickViewStyle || 'display:inline-flex;align-items:center;justify-content:center;width:45px;height:45px;border-radius:14px;border:1px solid #d8d0c4;background:#fff;color:#171a18;font-size:17px;cursor:pointer;order:40;')}">${actionContent(cfg.quickViewMode || 'icon', cfg.quickViewIcon || '◉', cfg.quickViewLabel || 'Швидкий перегляд')}</button>
      </div>
    </div>
  </article>
</div>`;
}

function makeTemplate(cfg){
  const html = buildTemplateHtml(cfg);
  return Object.freeze({
    id: cfg.id,
    type: 'shop',
    templateKind: 'component',
    componentType: 'product-card',
    name: cfg.name,
    folderId: 'fld_shop_product_cards',
    html,
    previewHtml: html,
    meta: Object.freeze({
      source: 'system',
      stage: '01047',
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
      semanticLayoutState01046: true,
      productCardTemplatePack01047: true,
      previewCategory: cfg.previewCategory || 'marketplace'
    })
  });
}

const CARD_CONFIGS = [
  {
    id:'product-card-classic-01-01047', name:'01 · ShiftTime · Classic Market', rootClass:'st-commerce-product-card-template--classic-market',
    primary:IMG.panMain, secondary:IMG.panAlt, title:'Сковорода з диска борони 50 см', description:'Для живого вогню, великої компанії та домашньої кухні. Міцний метал і зручна комплектація.',
    brand:'SHIFTIME', reviewsCount:128, currentPriceText:'1 450 грн', oldPriceText:'1 650 грн', badgeText:'ХІТ',
    rootStyle:'width:min(100%,380px);max-width:380px;min-width:0;margin:0 auto;padding:0;background:#ffffff;color:#171a18;border:1px solid #e4ded5;border-radius:26px;box-shadow:0 22px 58px rgba(31,26,20,.12);overflow:hidden;box-sizing:border-box;',
    mediaBg:'#f2ede4',
    badgeStyle:'position:absolute;top:14px;left:14px;padding:7px 11px;border-radius:999px;background:linear-gradient(180deg,#c96a23,#8f3b08);color:#fff;font-size:11px;font-weight:950;letter-spacing:.05em;box-shadow:0 10px 24px rgba(154,67,8,.24);z-index:3;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:45px;width:100%;padding:11px 16px;border-radius:14px;background:linear-gradient(180deg,#c96a23,#8f3b08);color:white;text-decoration:none;font-weight:950;box-shadow:0 14px 30px rgba(154,67,8,.20);order:10;'
  },
  {
    id:'product-card-minimal-02-01047', name:'02 · ShiftTime · Minimal Light', rootClass:'st-commerce-product-card-template--minimal-light',
    primary:IMG.kazans, secondary:IMG.kazanTripod, title:'Казан чавунний 8 л з кришкою', description:'Лаконічна мінімалістична картка з акцентом на фото, назву та чесну ціну.',
    brand:'CAST LINE', reviewsCount:64, currentPriceText:'2 690 грн', oldPriceText:'2 980 грн', badgeText:'NEW', badgeMode:'new',
    rootStyle:'width:min(100%,360px);max-width:360px;min-width:0;margin:0 auto;padding:14px;background:#ffffff;color:#121518;border:1px solid #edf1f4;border-radius:28px;box-shadow:0 14px 36px rgba(17,24,39,.08);overflow:hidden;box-sizing:border-box;',
    articleBg:'#fff', mediaBg:'#f5f7fa', mediaStyle:'position:relative;height:248px;background:#f5f7fa;display:block;overflow:hidden;border-radius:20px;box-sizing:border-box;',
    bodyStyle:'display:grid;gap:9px;padding:16px 4px 2px;box-sizing:border-box;',
    brandStyle:'font-size:10px;font-weight:900;letter-spacing:.12em;color:#6b7280;text-transform:uppercase;',
    stockStyle:'font-size:11px;font-weight:850;color:#256d4e;background:#eef8f2;border-radius:999px;padding:4px 8px;',
    titleStyle:'margin:0;font-size:20px;line-height:1.22;font-weight:900;color:#101828;',
    descriptionStyle:'margin:0;color:#667085;font-size:13px;line-height:1.5;',
    currentPriceStyle:'font-size:24px;color:#101828;font-weight:1000;', oldPriceStyle:'font-size:13px;color:#98a2b3;text-decoration:line-through;font-weight:800;', discountStyle:'font-size:11px;font-weight:900;color:#344054;background:#f2f4f7;padding:4px 8px;border-radius:999px;',
    badgeStyle:'position:absolute;top:12px;left:12px;padding:6px 10px;border-radius:999px;background:#ffffff;color:#111827;font-size:11px;font-weight:950;letter-spacing:.04em;border:1px solid #e5e7eb;z-index:3;',
    wishlistStyle:'position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:999px;border:1px solid #e5e7eb;background:#fff;color:#111827;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:44px;width:100%;padding:11px 15px;border-radius:14px;background:#111827;color:#fff;text-decoration:none;font-weight:900;order:10;',
    compareStyle:'display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:14px;border:1px solid #e5e7eb;background:#fff;color:#111827;font-size:17px;cursor:pointer;order:30;'
  },
  {
    id:'product-card-marketplace-03-01047', name:'03 · ShiftTime · Marketplace Dense', rootClass:'st-commerce-product-card-template--marketplace-dense',
    primary:IMG.mangal, secondary:IMG.family, title:'Мангал розбірний 80×32×16', description:'Щільний маркетплейсний формат: більше контенту, чіткий рейтинг і помітна кнопка покупки.',
    brand:'OUTDOOR PRO', reviewsCount:311, currentPriceText:'3 590 грн', oldPriceText:'4 190 грн', badgeText:'SALE', badgeMode:'sale',
    rootStyle:'width:min(100%,392px);max-width:392px;min-width:0;margin:0 auto;padding:0;background:#ffffff;color:#141414;border:1px solid #ece6db;border-radius:22px;box-shadow:0 16px 40px rgba(59,39,12,.10);overflow:hidden;box-sizing:border-box;',
    mediaBg:'#efe8dc', bodyStyle:'display:grid;gap:8px;padding:18px;box-sizing:border-box;', brandStyle:'font-size:10px;font-weight:900;letter-spacing:.14em;color:#a16207;text-transform:uppercase;',
    stockStyle:'font-size:11px;font-weight:800;color:#7c2d12;background:#fff1e6;border-radius:999px;padding:4px 8px;',
    titleStyle:'margin:0;font-size:20px;line-height:1.18;font-weight:950;color:#111827;',
    ratingStyle:'color:#d97706;font-weight:900;letter-spacing:.06em;', reviewsStyle:'color:#6b7280;font-weight:800;',
    priceRowStyle:'display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:2px;', currentPriceStyle:'font-size:26px;color:#111827;font-weight:1000;', oldPriceStyle:'font-size:13px;color:#9ca3af;text-decoration:line-through;font-weight:800;', discountStyle:'font-size:11px;font-weight:950;color:#fff;background:#b45309;border-radius:999px;padding:4px 8px;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 14px;border-radius:14px;background:linear-gradient(180deg,#f59e0b,#b45309);color:#fff;text-decoration:none;font-weight:950;box-shadow:0 12px 26px rgba(180,83,9,.20);order:10;',
    compareStyle:'display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:14px;border:1px solid #eadfcd;background:#fffaf0;color:#111827;font-size:17px;cursor:pointer;order:30;',
    showBuyNow:true, buyNowStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 14px;border-radius:14px;border:1px solid #f59e0b;background:#fffaf0;color:#b45309;font-weight:900;cursor:pointer;order:20;'
  },
  {
    id:'product-card-premium-dark-04-01047', name:'04 · ShiftTime · Premium Dark', rootClass:'st-commerce-product-card-template--premium-dark',
    primary:IMG.skewers, secondary:IMG.panPersonal, title:'Подарункові шампури з гравіюванням', description:'Преміальна темна картка з глибокими тінями, золотими акцентами та виразною ціною.',
    brand:'PREMIUM GIFT', reviewsCount:42, currentPriceText:'2 250 грн', oldPriceText:'2 700 грн', badgeText:'PREMIUM', badgeMode:'custom', badgeCustom:'PREMIUM', currentPriceStyle:'font-size:26px;color:#f8e7b2;font-weight:1000;',
    rootStyle:'width:min(100%,384px);max-width:384px;min-width:0;margin:0 auto;padding:0;background:linear-gradient(180deg,#14110f,#1d1814);color:#f7f3ee;border:1px solid rgba(244,220,163,.16);border-radius:28px;box-shadow:0 28px 60px rgba(0,0,0,.34);overflow:hidden;box-sizing:border-box;',
    articleBg:'linear-gradient(180deg,#181410,#211a14)', mediaBg:'#26201a', bodyStyle:'display:grid;gap:10px;padding:22px;box-sizing:border-box;', mediaStyle:'position:relative;height:260px;background:#26201a;display:block;overflow:hidden;border-radius:28px 28px 0 0;box-sizing:border-box;',
    badgeStyle:'position:absolute;top:14px;left:14px;padding:7px 12px;border-radius:999px;background:linear-gradient(180deg,#f5d98d,#c98b2e);color:#17120f;font-size:11px;font-weight:950;letter-spacing:.08em;box-shadow:0 12px 24px rgba(0,0,0,.22);z-index:3;',
    wishlistStyle:'position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(21,17,14,.72);backdrop-filter:blur(10px);color:#f8e7b2;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;',
    brandStyle:'font-size:10px;font-weight:900;letter-spacing:.16em;color:#e1c276;text-transform:uppercase;', stockStyle:'font-size:11px;font-weight:850;color:#9be3b7;',
    titleStyle:'margin:0;font-size:22px;line-height:1.16;font-weight:950;color:#fff9ed;', ratingStyle:'color:#f5d98d;font-weight:900;letter-spacing:.06em;', reviewsStyle:'color:#c8c0b8;font-weight:750;',
    descriptionStyle:'margin:0;color:#d5cec6;font-size:13px;line-height:1.56;', oldPriceStyle:'font-size:13px;color:#9e968f;text-decoration:line-through;font-weight:800;', discountStyle:'font-size:11px;font-weight:950;color:#17120f;background:#f5d98d;border-radius:999px;padding:4px 8px;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 16px;border-radius:16px;background:linear-gradient(180deg,#f5d98d,#bf7e21);color:#16120f;text-decoration:none;font-weight:950;box-shadow:0 14px 32px rgba(0,0,0,.28);order:10;',
    compareStyle:'display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:#211a14;color:#f5d98d;font-size:17px;cursor:pointer;order:30;'
  },
  {
    id:'product-card-editorial-05-01047', name:'05 · ShiftTime · Editorial Beige', rootClass:'st-commerce-product-card-template--editorial-beige',
    primary:IMG.panFire, secondary:IMG.family, title:'Сковорода 60 см для великої компанії', description:'Editorial-стиль: багато повітря, м’які відтінки та спокійна, преміальна презентація товару.',
    brand:'COLLECTION 2026', reviewsCount:19, currentPriceText:'1 990 грн', oldPriceText:'2 250 грн', badgeText:'EDITORIAL', badgeMode:'custom', badgeCustom:'EDITORIAL',
    rootStyle:'width:min(100%,400px);max-width:400px;min-width:0;margin:0 auto;padding:18px;background:linear-gradient(180deg,#fbf7f0,#f1e7d9);color:#2a1f18;border:1px solid rgba(155,119,71,.12);border-radius:30px;box-shadow:0 18px 44px rgba(132,104,71,.12);overflow:hidden;box-sizing:border-box;',
    articleBg:'transparent', mediaBg:'#e8dbc8', mediaStyle:'position:relative;height:250px;background:#e8dbc8;display:block;overflow:hidden;border-radius:22px;box-sizing:border-box;',
    bodyStyle:'display:grid;gap:10px;padding:18px 4px 4px;box-sizing:border-box;', topMetaRowStyle:'display:flex;align-items:flex-start;justify-content:space-between;gap:10px;', brandStyle:'font-size:10px;font-weight:900;letter-spacing:.18em;color:#8a6745;text-transform:uppercase;', stockStyle:'font-size:11px;font-weight:800;color:#5c7159;',
    titleStyle:'margin:0;font-size:24px;line-height:1.1;font-weight:900;color:#2a1f18;', ratingStyle:'color:#9b7747;font-weight:900;letter-spacing:.04em;', reviewsStyle:'color:#7c6a5a;font-weight:800;',
    descriptionStyle:'margin:0;color:#6c5a4c;font-size:13px;line-height:1.65;', currentPriceStyle:'font-size:28px;color:#2a1f18;font-weight:1000;', oldPriceStyle:'font-size:14px;color:#9f8f80;text-decoration:line-through;font-weight:800;',
    discountStyle:'font-size:11px;font-weight:900;color:#fff;background:#9b7747;border-radius:999px;padding:4px 8px;',
    badgeStyle:'position:absolute;top:14px;left:14px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.86);backdrop-filter:blur(8px);color:#6c4b2f;font-size:10px;font-weight:950;letter-spacing:.16em;border:1px solid rgba(108,75,47,.10);z-index:3;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:47px;width:100%;padding:11px 16px;border-radius:999px;background:#2a1f18;color:#fff;text-decoration:none;font-weight:950;order:10;',
    compareStyle:'display:inline-flex;align-items:center;justify-content:center;width:47px;height:47px;border-radius:999px;border:1px solid rgba(108,75,47,.16);background:rgba(255,255,255,.82);color:#2a1f18;font-size:17px;cursor:pointer;order:30;'
  },
  {
    id:'product-card-glass-06-01047', name:'06 · ShiftTime · Glass Gradient', rootClass:'st-commerce-product-card-template--glass-gradient',
    primary:IMG.panPersonal, secondary:IMG.skewers, title:'Чохол з гравіюванням для сковороди', description:'Сучасна скляна карточка з blur-панелями, неоновим градієнтом і виразним акцентом на фото.',
    brand:'LIMITED DROP', reviewsCount:53, currentPriceText:'890 грн', oldPriceText:'1 090 грн', badgeText:'-18%', badgeMode:'auto-percent',
    rootStyle:'width:min(100%,388px);max-width:388px;min-width:0;margin:0 auto;padding:0;background:linear-gradient(135deg,#fff7ef 0%,#ffe7d6 38%,#f3ecff 100%);color:#18181b;border:1px solid rgba(255,255,255,.55);border-radius:28px;box-shadow:0 24px 56px rgba(76,29,149,.14);overflow:hidden;box-sizing:border-box;',
    articleBg:'transparent', mediaBg:'rgba(255,255,255,.52)', mediaStyle:'position:relative;height:258px;background:rgba(255,255,255,.40);display:block;overflow:hidden;border-radius:28px 28px 0 0;box-sizing:border-box;',
    badgeStyle:'position:absolute;top:14px;left:14px;padding:7px 12px;border-radius:999px;background:linear-gradient(135deg,#ff7b54,#7c3aed);color:#fff;font-size:11px;font-weight:950;letter-spacing:.04em;box-shadow:0 14px 28px rgba(124,58,237,.24);z-index:3;',
    wishlistStyle:'position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.52);background:rgba(255,255,255,.38);backdrop-filter:blur(14px);color:#1f2937;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;',
    bodyStyle:'display:grid;gap:9px;padding:20px;box-sizing:border-box;background:rgba(255,255,255,.42);backdrop-filter:blur(14px);', brandStyle:'font-size:10px;font-weight:950;letter-spacing:.18em;color:#7c3aed;text-transform:uppercase;', stockStyle:'font-size:11px;font-weight:850;color:#166534;',
    titleStyle:'margin:0;font-size:22px;line-height:1.16;font-weight:950;color:#111827;', ratingStyle:'color:#7c3aed;font-weight:900;letter-spacing:.04em;', reviewsStyle:'color:#4b5563;font-weight:800;',
    descriptionStyle:'margin:0;color:#4b5563;font-size:13px;line-height:1.58;', currentPriceStyle:'font-size:27px;color:#111827;font-weight:1000;', oldPriceStyle:'font-size:13px;color:#6b7280;text-decoration:line-through;font-weight:800;', discountStyle:'font-size:11px;font-weight:950;color:#7c3aed;background:#f3e8ff;border-radius:999px;padding:4px 8px;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 16px;border-radius:16px;background:linear-gradient(135deg,#111827,#7c3aed);color:#fff;text-decoration:none;font-weight:950;box-shadow:0 16px 34px rgba(124,58,237,.18);order:10;'
  },
  {
    id:'product-card-compact-sale-07-01047', name:'07 · ShiftTime · Compact Sale', rootClass:'st-commerce-product-card-template--compact-sale',
    primary:IMG.kazanTripod, secondary:IMG.kazans, title:'Казан з триногою 6 л', description:'Компактна картка для густих грідів і великих каталогів зі швидким скануванням акції.',
    brand:'SMART BUY', reviewsCount:89, currentPriceText:'1 790 грн', oldPriceText:'2 050 грн', badgeText:'SALE', badgeMode:'sale',
    rootStyle:'width:min(100%,332px);max-width:332px;min-width:0;margin:0 auto;padding:10px;background:#ffffff;color:#101828;border:1px solid #e7ebef;border-radius:20px;box-shadow:0 10px 24px rgba(15,23,42,.08);overflow:hidden;box-sizing:border-box;',
    mediaStyle:'position:relative;height:212px;background:#f3f4f6;display:block;overflow:hidden;border-radius:16px;box-sizing:border-box;',
    bodyStyle:'display:grid;gap:7px;padding:14px 2px 2px;box-sizing:border-box;', titleStyle:'margin:0;font-size:18px;line-height:1.18;font-weight:950;color:#101828;', descriptionStyle:'margin:0;color:#6b7280;font-size:12px;line-height:1.48;',
    currentPriceStyle:'font-size:24px;color:#101828;font-weight:1000;', oldPriceStyle:'font-size:12px;color:#98a2b3;text-decoration:line-through;font-weight:800;', discountStyle:'font-size:10px;font-weight:950;color:#fff;background:#ef4444;border-radius:999px;padding:4px 7px;',
    badgeStyle:'position:absolute;top:10px;left:10px;padding:6px 10px;border-radius:999px;background:#ef4444;color:#fff;font-size:10px;font-weight:950;letter-spacing:.08em;z-index:3;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:42px;width:100%;padding:10px 14px;border-radius:12px;background:#ef4444;color:#fff;text-decoration:none;font-weight:950;order:10;',
    compareStyle:'display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;color:#111827;font-size:16px;cursor:pointer;order:30;'
  },
  {
    id:'product-card-horizontal-08-01047', name:'08 · ShiftTime · Horizontal Pro', rootClass:'st-commerce-product-card-template--horizontal-pro',
    primary:IMG.family, secondary:IMG.panFire, title:'Сімейний набір для відпочинку на природі', description:'Горизонтальний формат для спецблоків, рекомендацій або секцій з широкими картками.',
    brand:'OUTDOOR SET', reviewsCount:71, currentPriceText:'4 490 грн', oldPriceText:'5 150 грн', badgeText:'SET', badgeMode:'custom', badgeCustom:'SET',
    layoutMode:'horizontal-left', mediaShare:45, maxWidth:720, contentMin:220, rootStyle:'width:min(100%,720px);max-width:720px;min-width:0;margin:0 auto;padding:0;background:#ffffff;color:#111827;border:1px solid #e5e7eb;border-radius:28px;box-shadow:0 22px 48px rgba(15,23,42,.10);overflow:hidden;box-sizing:border-box;',
    mediaStyle:'position:relative;flex:0 0 45%;min-height:100%;background:#f5efe8;display:block;overflow:hidden;border-radius:28px 0 0 28px;box-sizing:border-box;',
    articleStyle:'display:flex;flex-direction:row;width:100%;height:100%;background:#fff;color:#111827;box-sizing:border-box;', bodyStyle:'display:grid;gap:10px;padding:24px;box-sizing:border-box;align-content:center;',
    titleStyle:'margin:0;font-size:25px;line-height:1.12;font-weight:950;color:#111827;', descriptionStyle:'margin:0;color:#667085;font-size:14px;line-height:1.62;', currentPriceStyle:'font-size:29px;color:#111827;font-weight:1000;',
    badgeStyle:'position:absolute;top:16px;left:16px;padding:7px 11px;border-radius:999px;background:#111827;color:#fff;font-size:11px;font-weight:950;letter-spacing:.08em;z-index:3;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 16px;border-radius:14px;background:linear-gradient(180deg,#0f172a,#334155);color:#fff;text-decoration:none;font-weight:950;order:10;',
    showBuyNow:true, buyNowStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 14px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:900;cursor:pointer;order:20;'
  },
  {
    id:'product-card-soft-premium-09-01047', name:'09 · ShiftTime · Soft Premium', rootClass:'st-commerce-product-card-template--soft-premium',
    primary:IMG.panAlt, secondary:IMG.panMain, title:'Сковорода з нержавіючою кришкою', description:'М’який преміальний стиль зі світлим золотистим градієнтом, делікатними тінями і rounded-дизайном.',
    brand:'SIGNATURE', reviewsCount:96, currentPriceText:'1 850 грн', oldPriceText:'2 150 грн', badgeText:'TOP', badgeMode:'custom', badgeCustom:'TOP',
    rootStyle:'width:min(100%,372px);max-width:372px;min-width:0;margin:0 auto;padding:12px;background:linear-gradient(180deg,#fffdf8,#faf3e6);color:#1f2937;border:1px solid rgba(217,170,86,.16);border-radius:32px;box-shadow:0 20px 42px rgba(166,124,54,.12);overflow:hidden;box-sizing:border-box;',
    mediaStyle:'position:relative;height:238px;background:#f8f2e7;display:block;overflow:hidden;border-radius:24px;box-sizing:border-box;',
    bodyStyle:'display:grid;gap:8px;padding:16px 4px 4px;box-sizing:border-box;', brandStyle:'font-size:10px;font-weight:950;letter-spacing:.18em;color:#b98a2c;text-transform:uppercase;', stockStyle:'font-size:11px;font-weight:850;color:#2b7a53;background:#eef8f2;border-radius:999px;padding:4px 8px;',
    titleStyle:'margin:0;font-size:21px;line-height:1.18;font-weight:950;color:#1f2937;', currentPriceStyle:'font-size:27px;color:#1f2937;font-weight:1000;',
    badgeStyle:'position:absolute;top:14px;left:14px;padding:7px 11px;border-radius:999px;background:#fff;color:#b98a2c;font-size:10px;font-weight:950;letter-spacing:.14em;border:1px solid rgba(185,138,44,.18);z-index:3;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:45px;width:100%;padding:11px 16px;border-radius:999px;background:linear-gradient(180deg,#d6a74d,#b87f1d);color:#fff;text-decoration:none;font-weight:950;box-shadow:0 14px 30px rgba(184,127,29,.18);order:10;'
  },
  {
    id:'product-card-bold-gradient-10-01047', name:'10 · ShiftTime · Bold Gradient', rootClass:'st-commerce-product-card-template--bold-gradient',
    primary:IMG.panCover, secondary:IMG.mangal, title:'Подарунковий комплект для гриля та відпочинку', description:'Яскравий сучасний градієнтний стиль з подвійними кнопками та сміливим візуальним акцентом.',
    brand:'TREND DROP', reviewsCount:147, currentPriceText:'2 990 грн', oldPriceText:'3 450 грн', badgeText:'LIMITED', badgeMode:'custom', badgeCustom:'LIMITED',
    rootStyle:'width:min(100%,388px);max-width:388px;min-width:0;margin:0 auto;padding:0;background:linear-gradient(160deg,#121826 0%,#231f4d 58%,#3f2b96 100%);color:#fff;border:1px solid rgba(255,255,255,.08);border-radius:30px;box-shadow:0 28px 66px rgba(22,17,58,.28);overflow:hidden;box-sizing:border-box;',
    articleBg:'transparent', mediaStyle:'position:relative;height:248px;background:rgba(255,255,255,.08);display:block;overflow:hidden;border-radius:30px 30px 0 0;box-sizing:border-box;', bodyStyle:'display:grid;gap:9px;padding:20px;box-sizing:border-box;', brandStyle:'font-size:10px;font-weight:950;letter-spacing:.18em;color:#a5b4fc;text-transform:uppercase;', stockStyle:'font-size:11px;font-weight:850;color:#93c5fd;',
    titleStyle:'margin:0;font-size:23px;line-height:1.14;font-weight:950;color:#ffffff;', ratingStyle:'color:#fbbf24;font-weight:900;letter-spacing:.06em;', reviewsStyle:'color:#dbeafe;font-weight:800;', descriptionStyle:'margin:0;color:#dbe4f6;font-size:13px;line-height:1.58;',
    currentPriceStyle:'font-size:28px;color:#fff;font-weight:1000;', oldPriceStyle:'font-size:13px;color:#cbd5e1;text-decoration:line-through;font-weight:800;', discountStyle:'font-size:11px;font-weight:950;color:#111827;background:#fbbf24;border-radius:999px;padding:4px 8px;',
    badgeStyle:'position:absolute;top:14px;left:14px;padding:7px 12px;border-radius:999px;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#fff;font-size:10px;font-weight:950;letter-spacing:.14em;box-shadow:0 14px 28px rgba(99,102,241,.32);z-index:3;',
    wishlistStyle:'position:absolute;top:14px;right:14px;width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(16,24,40,.42);backdrop-filter:blur(10px);color:#fff;font-size:18px;display:inline-flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;',
    addToCartStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 16px;border-radius:16px;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#fff;text-decoration:none;font-weight:950;box-shadow:0 16px 32px rgba(99,102,241,.28);order:10;',
    showBuyNow:true, buyNowStyle:'display:inline-flex;align-items:center;justify-content:center;min-height:46px;width:100%;padding:11px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);backdrop-filter:blur(10px);color:#fff;font-weight:900;cursor:pointer;order:20;',
    compareStyle:'display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:16px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#fff;font-size:17px;cursor:pointer;order:30;'
  }
];

export const PRODUCT_CARD_TEMPLATES_01047 = Object.freeze(CARD_CONFIGS.map(makeTemplate));

export function getProductCardTemplates01047(){
  return PRODUCT_CARD_TEMPLATES_01047;
}
