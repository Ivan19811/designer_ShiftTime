// 01050 · Category Card specific data widget.
// Shared Product/Category Inspector keeps common Image/Text/Badge/Layout widgets;
// only category-specific semantic data lives here.
import {
  resolveCommerceCardRoot01050,
  resolveCommerceCardRole01050,
  getCommerceCardType01050
} from './product-card-contract-01038.js?v=01050';
import { resolveCommerceBindingValue01050 } from './commerce-card-data-binding-01050.js?v=01050';

const MAX_EXTRAS=10;
const CONTENT_ORDER=Object.freeze({
  'before-title':15,
  'after-title':25,
  'after-description':35,
  'before-price':45,
  'after-price':55,
  'before-action':70
});

function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function num(v,min,max,fallback){const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;}
function selectedElement(getSelection){try{const s=typeof getSelection==='function'?getSelection():null;return Array.isArray(s?.elements)?(s.elements[0]||null):null;}catch{return null;}}
function selectedCategory(getSelection){const root=resolveCommerceCardRoot01050(selectedElement(getSelection));return getCommerceCardType01050(root)==='category-card'?root:null;}
function role(card,id){return card?resolveCommerceCardRole01050(card,id):null;}
function f(panel,key){return panel?.querySelector?.(`[data-pcat="${key}"]`)||null;}
function boolFrom(card,key,node,def=true){const v=card?.dataset?.[key];if(v==='0')return false;if(v==='1')return true;return node? !node.hidden:def;}
function setVisible(card,key,node,on){if(!card||!node)return;card.dataset[key]=on?'1':'0';node.hidden=!on;}
function sourceValue(card,source,key,fallback){return source==='binding'?resolveCommerceBindingValue01050(key,{card,fallback}):fallback;}
function formatNumber(v){const n=Number(v);if(!Number.isFinite(n))return String(v??'');return new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2}).format(n);}
function priceText(card){
  const mode=String(card.dataset.commerceCategoryPriceMode||'auto');
  const min=num(card.dataset.commerceCategoryPriceMin,0,999999999,0);
  const max=num(card.dataset.commerceCategoryPriceMax,0,999999999,min);
  const currency=String(card.dataset.commerceCategoryPriceCurrency||'грн').trim();
  const custom=String(card.dataset.commerceCategoryPriceCustom||'').trim();
  const unit=(n)=>`${formatNumber(n)}${currency?` ${currency}`:''}`;
  if(mode==='custom') return custom || 'Власний текст';
  if(mode==='from-min') return `Від ${unit(min)}`;
  if(mode==='range-full') return min===max?unit(min):`Від ${unit(min)} до ${unit(max)}`;
  if(mode==='single') return unit(min);
  if(mode==='range-short') return min===max?unit(min):`${formatNumber(min)}–${formatNumber(max)}${currency?` ${currency}`:''}`;
  // auto
  if(min===max) return unit(min);
  if(max<=0 && min>0) return `Від ${unit(min)}`;
  return `${formatNumber(min)}–${formatNumber(max)}${currency?` ${currency}`:''}`;
}
function renderFeature(card,node){if(!card||!node)return;const label=String(card.dataset.commerceCategoryFeatureLabel||'').trim();const value=String(card.dataset.commerceCategoryFeatureValue||'').trim();const mode=String(card.dataset.commerceCategoryFeatureDisplay||'label-value');node.textContent=mode==='value-only'?value:(label?`${label}: ${value}`:value);}
function renderCount(card,node){if(!card||!node)return;const value=String(card.dataset.commerceCategoryProductsCount||'0').trim();const suffix=String(card.dataset.commerceCategoryProductsSuffix||'товарів').trim();node.textContent=suffix?`${value} ${suffix}`:value;}
function renderSubcategories(card,node){if(!card||!node)return;node.textContent=String(card.dataset.commerceCategorySubcategoriesText||'').trim();}
function renderCta(card,node){if(!card||!node)return;const label=String(card.dataset.commerceCategoryCtaLabel||'Переглянути категорію').trim();const slot=node.querySelector?.('[data-commerce-action-label-slot="1"]');if(slot)slot.textContent=label;else node.textContent=label;const href=String(card.dataset.commerceCategoryUrl||'#').trim()||'#';if(node instanceof HTMLAnchorElement)node.setAttribute('href',href);node.setAttribute('data-commerce-bind',String(card.dataset.commerceCategoryUrlKey||'category.url'));}

function extraNodes(card){return card?Array.from(card.querySelectorAll('[data-commerce-role="category-extra"]')):[];}
function extraId(){return `cex_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;}
function extraText(node){const label=String(node.dataset.commerceExtraLabel||'').trim();const value=String(node.dataset.commerceExtraValue||'').trim();return label?`${label}: ${value}`:value;}
function styleExtra(node){
  const zone=String(node.dataset.commerceExtraZone||'content');
  const pos=String(node.dataset.commerceExtraPosition|| (zone==='media'?'bottom-left':'after-description'));
  node.style.display=node.hidden?'none':'inline-flex';
  node.style.alignItems='center';node.style.gap='4px';node.style.boxSizing='border-box';
  if(zone==='media'){
    node.style.position='absolute';node.style.zIndex='4';node.style.order='';
    node.style.top='';node.style.right='';node.style.bottom='';node.style.left='';
    if(pos==='top-left'){node.style.top='14px';node.style.left='14px';}
    else if(pos==='top-right'){node.style.top='14px';node.style.right='14px';}
    else if(pos==='bottom-right'){node.style.bottom='14px';node.style.right='14px';}
    else {node.style.bottom='14px';node.style.left='14px';}
  } else {
    node.style.position='relative';node.style.zIndex='';node.style.top='';node.style.right='';node.style.bottom='';node.style.left='';
    node.style.order=String(CONTENT_ORDER[pos]||35);
  }
}
function placeExtra(card,node){
  if(!card||!node)return;
  const zone=String(node.dataset.commerceExtraZone||'content');
  const host=zone==='media'?role(card,'media'):role(card,'body');
  if(host && node.parentElement!==host)host.appendChild(node);
  styleExtra(node);node.textContent=extraText(node);
  const source=String(node.dataset.commerceExtraSource||'binding');
  if(source==='binding') node.setAttribute('data-commerce-bind-key',String(node.dataset.commerceExtraKey||'')); else node.removeAttribute('data-commerce-bind-key');
}
function resolveExtraBinding(card,node){
  const source=String(node.dataset.commerceExtraSource||'binding');
  if(source!=='binding')return;
  const fallback=String(node.dataset.commerceExtraFallback||node.dataset.commerceExtraValue||'');
  const v=resolveCommerceBindingValue01050(node.dataset.commerceExtraKey||'',{card,fallback});
  node.dataset.commerceExtraValue=String(v??fallback);
}

export function categoryCardDataWidgetHtml01050(){return `
<div class="st-shop-component-widget st-category-card-data-widget-01050" data-category-card-data-widget-01050="1" data-commerce-category-only-01050>
  <div class="st-shop-widget-head-01039"><div><b>Дані категорії</b><span>кількість / ціна / характеристики / ключі XML-таблиці</span></div></div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Кількість товарів</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="count-visible"><span>Показувати</span></label></div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Джерело</div><select class="design-input" data-pcat="count-source"><option value="binding">Ключ даних</option><option value="custom">Власне значення</option></select></div>
      <div class="design-field"><div class="design-field__label">Значення / fallback</div><input class="design-input" type="text" data-pcat="count-value" value="38"></div>
    </div>
    <div class="design-field"><div class="design-field__label">Ключ XML / таблиці</div><input class="design-input" type="text" data-pcat="count-key" value="category.productsCount"></div>
    <div class="design-field"><div class="design-field__label">Підпис</div><input class="design-input" type="text" data-pcat="count-suffix" value="товарів"></div>
  </div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Ціна категорії</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="price-visible"><span>Показувати</span></label></div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Джерело</div><select class="design-input" data-pcat="price-source"><option value="binding">Ключі даних</option><option value="custom">Власні числа</option></select></div>
      <div class="design-field"><div class="design-field__label">Формат</div><select class="design-input" data-pcat="price-mode"><option value="auto">Автоматично</option><option value="from-min">Від 800 грн</option><option value="range-short">800–1700 грн</option><option value="range-full">Від 800 грн до 1700 грн</option><option value="single">800 грн</option><option value="custom">Власний текст</option></select></div>
    </div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Мінімальна / fallback</div><input class="design-input" type="number" min="0" step="0.01" data-pcat="price-min" value="800"></div>
      <div class="design-field"><div class="design-field__label">Максимальна / fallback</div><input class="design-input" type="number" min="0" step="0.01" data-pcat="price-max" value="1700"></div>
    </div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Ключ min</div><input class="design-input" type="text" data-pcat="price-min-key" value="category.priceMin"></div>
      <div class="design-field"><div class="design-field__label">Ключ max</div><input class="design-input" type="text" data-pcat="price-max-key" value="category.priceMax"></div>
    </div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Валюта</div><input class="design-input" type="text" data-pcat="price-currency" value="грн"></div>
      <div class="design-field" data-pcat-price-custom-wrap><div class="design-field__label">Власний текст</div><input class="design-input" type="text" data-pcat="price-custom" placeholder="Наприклад: Ціни від виробника"></div>
    </div>
    <div class="st-shop-price-calculation-01043"><span>Результат</span><b data-pcat-out="price">800–1700 грн</b></div>
  </div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Основна характеристика</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="feature-visible"><span>Показувати</span></label></div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Джерело</div><select class="design-input" data-pcat="feature-source"><option value="binding">Ключ даних</option><option value="custom">Власний текст</option></select></div>
      <div class="design-field"><div class="design-field__label">Вигляд</div><select class="design-input" data-pcat="feature-display"><option value="label-value">Назва: значення</option><option value="value-only">Тільки значення</option></select></div>
    </div>
    <div class="design-field"><div class="design-field__label">Ключ XML / таблиці</div><input class="design-input" type="text" data-pcat="feature-key" value="category.attributes.diameter"></div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Назва</div><input class="design-input" type="text" data-pcat="feature-label" value="Діаметр"></div>
      <div class="design-field"><div class="design-field__label">Значення / fallback</div><input class="design-input" type="text" data-pcat="feature-value" value="30–80 см"></div>
    </div>
  </div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Підкатегорії</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="subcategories-visible"><span>Показувати</span></label></div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Джерело</div><select class="design-input" data-pcat="subcategories-source"><option value="binding">Ключ даних</option><option value="custom">Власний текст</option></select></div>
      <div class="design-field"><div class="design-field__label">Ключ</div><input class="design-input" type="text" data-pcat="subcategories-key" value="category.childrenLabels"></div>
    </div>
    <div class="design-field"><div class="design-field__label">Текст / fallback</div><input class="design-input" type="text" data-pcat="subcategories-text" value="30 см · 40 см · 50 см · 60 см"></div>
  </div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Додаткові дані</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="extras-visible"><span>Показувати</span></label></div>
    <div class="design-subnote">До 10 універсальних блоків. Джерело — власний текст або ключ з XML/таблиці. Блок можна розмістити поверх фото або в контенті.</div>
    <div class="st-category-extra-list-01050" data-pcat-extra-list></div>
    <button type="button" class="st-shop-btn is-green" data-pcat-add-extra>+ Додати інформаційний блок</button>
  </div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Іконка категорії</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="icon-visible"><span>Показувати</span></label></div>
    <div class="design-field"><div class="design-field__label">Іконка / символ</div><input class="design-input" type="text" maxlength="12" data-pcat="icon-text" value="↗" placeholder="↗"></div>
    <div class="design-subnote">Спільний semantic-блок <b>category-icon</b>. Стиль і позиція задаються шаблоном; тут керуємо видимістю та символом.</div>
  </div>

  <div class="st-shop-content-group-01042">
    <div class="st-shop-content-group__title-01042"><b>Перехід у категорію</b><label class="st-shop-switch-01039"><input type="checkbox" data-pcat="cta-visible"><span>Показувати</span></label></div>
    <div class="design-field"><div class="design-field__label">Текст кнопки</div><input class="design-input" type="text" data-pcat="cta-label" value="Переглянути категорію"></div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">URL / fallback</div><input class="design-input" type="text" data-pcat="cta-url" value="#"></div>
      <div class="design-field"><div class="design-field__label">Ключ URL</div><input class="design-input" type="text" data-pcat="cta-url-key" value="category.url"></div>
    </div>
  </div>

  <button type="button" class="st-shop-btn is-primary" data-pcat-refresh-bindings>↻ Оновити з ключів даних</button>
  <div class="design-subnote">Ключі вже є частиною контракту Category Card. Майбутній XML/табличний loader подає дані в єдиний <b>ST_COMMERCE_CARD_DATA_01050</b>, без зміни шаблонів.</div>
  <div class="st-shop-contract-status" data-pcat-status><b>Дані категорії</b><span>Вибери Category Card на Canvas.</span></div>
</div>`;}

function extraEditorHtml(node,index){
  const id=String(node.dataset.commerceExtraId||'');const source=String(node.dataset.commerceExtraSource||'binding');const zone=String(node.dataset.commerceExtraZone||'content');const pos=String(node.dataset.commerceExtraPosition|| (zone==='media'?'bottom-left':'after-description'));
  return `<div class="st-category-extra-editor-01050" data-pcat-extra-editor="${esc(id)}">
    <div class="st-category-extra-editor-01050__head"><b>Блок ${index+1}</b><button type="button" data-pcat-remove-extra="${esc(id)}" title="Видалити">✕</button></div>
    <label class="st-shop-switch-01039"><input type="checkbox" data-pcat-extra="visible" ${node.hidden?'':'checked'}><span>Показувати</span></label>
    <div class="st-shop-two-col-01039"><div class="design-field"><div class="design-field__label">Джерело</div><select class="design-input" data-pcat-extra="source"><option value="binding" ${source==='binding'?'selected':''}>Ключ даних</option><option value="custom" ${source==='custom'?'selected':''}>Власний текст</option></select></div><div class="design-field"><div class="design-field__label">Зона</div><select class="design-input" data-pcat-extra="zone"><option value="content" ${zone==='content'?'selected':''}>Контент</option><option value="media" ${zone==='media'?'selected':''}>Фото</option></select></div></div>
    <div class="design-field"><div class="design-field__label">Ключ XML / таблиці</div><input class="design-input" data-pcat-extra="key" value="${esc(node.dataset.commerceExtraKey||'')}"></div>
    <div class="st-shop-two-col-01039"><div class="design-field"><div class="design-field__label">Назва / префікс</div><input class="design-input" data-pcat-extra="label" value="${esc(node.dataset.commerceExtraLabel||'')}"></div><div class="design-field"><div class="design-field__label">Текст / fallback</div><input class="design-input" data-pcat-extra="value" value="${esc(node.dataset.commerceExtraValue||'')}"></div></div>
    <div class="design-field"><div class="design-field__label">Розміщення</div><select class="design-input" data-pcat-extra="position">
      ${zone==='media'?`<option value="top-left" ${pos==='top-left'?'selected':''}>Зверху зліва</option><option value="top-right" ${pos==='top-right'?'selected':''}>Зверху справа</option><option value="bottom-left" ${pos==='bottom-left'?'selected':''}>Знизу зліва</option><option value="bottom-right" ${pos==='bottom-right'?'selected':''}>Знизу справа</option>`:`<option value="before-title" ${pos==='before-title'?'selected':''}>Перед назвою</option><option value="after-title" ${pos==='after-title'?'selected':''}>Після назви</option><option value="after-description" ${pos==='after-description'?'selected':''}>Після опису</option><option value="before-price" ${pos==='before-price'?'selected':''}>Перед ціною</option><option value="after-price" ${pos==='after-price'?'selected':''}>Після ціни</option><option value="before-action" ${pos==='before-action'?'selected':''}>Перед кнопкою</option>`}
    </select></div>
  </div>`;
}

function renderExtraEditors(panel,card){const list=panel?.querySelector?.('[data-pcat-extra-list]');if(!list)return;const nodes=extraNodes(card);list.innerHTML=nodes.map(extraEditorHtml).join('')||'<div class="design-subnote">Додаткових блоків ще немає.</div>';const add=panel.querySelector('[data-pcat-add-extra]');if(add)add.disabled=!card||nodes.length>=MAX_EXTRAS;}
function toggleCustomPrice(panel){const w=panel?.querySelector?.('[data-pcat-price-custom-wrap]');if(w)w.hidden=String(f(panel,'price-mode')?.value||'auto')!=='custom';}
function setDisabled(panel,on){panel?.querySelectorAll?.('input,select,textarea,button').forEach(el=>{if(!el.matches('[data-pcat-refresh-bindings]'))el.disabled=!!on;});}

function hydrate(panel,getSelection){
  const card=selectedCategory(getSelection);const status=panel?.querySelector?.('[data-pcat-status]');
  if(!card){setDisabled(panel,true);renderExtraEditors(panel,null);if(status)status.innerHTML='<b>Дані категорії</b><span>Вибери Category Card на Canvas.</span>';return;}
  setDisabled(panel,false);
  const count=role(card,'category-products-count'),price=role(card,'category-price'),feature=role(card,'category-feature'),subs=role(card,'category-subcategories'),icon=role(card,'category-icon'),cta=role(card,'category-open');
  f(panel,'count-visible').checked=boolFrom(card,'commerceCategoryProductsCountVisible',count,true);f(panel,'count-source').value=card.dataset.commerceCategoryProductsCountSource||'binding';f(panel,'count-key').value=card.dataset.commerceCategoryProductsCountKey||'category.productsCount';f(panel,'count-value').value=card.dataset.commerceCategoryProductsCount||String(count?.textContent||'').match(/\d+/)?.[0]||'38';f(panel,'count-suffix').value=card.dataset.commerceCategoryProductsSuffix||'товарів';
  f(panel,'price-visible').checked=boolFrom(card,'commerceCategoryPriceVisible',price,true);f(panel,'price-source').value=card.dataset.commerceCategoryPriceSource||'binding';f(panel,'price-mode').value=card.dataset.commerceCategoryPriceMode||'auto';f(panel,'price-min').value=card.dataset.commerceCategoryPriceMin||'800';f(panel,'price-max').value=card.dataset.commerceCategoryPriceMax||'1700';f(panel,'price-min-key').value=card.dataset.commerceCategoryPriceMinKey||'category.priceMin';f(panel,'price-max-key').value=card.dataset.commerceCategoryPriceMaxKey||'category.priceMax';f(panel,'price-currency').value=card.dataset.commerceCategoryPriceCurrency||'грн';f(panel,'price-custom').value=card.dataset.commerceCategoryPriceCustom||'';
  f(panel,'feature-visible').checked=boolFrom(card,'commerceCategoryFeatureVisible',feature,true);f(panel,'feature-source').value=card.dataset.commerceCategoryFeatureSource||'binding';f(panel,'feature-display').value=card.dataset.commerceCategoryFeatureDisplay||'label-value';f(panel,'feature-key').value=card.dataset.commerceCategoryFeatureKey||'category.attributes.diameter';f(panel,'feature-label').value=card.dataset.commerceCategoryFeatureLabel||'Діаметр';f(panel,'feature-value').value=card.dataset.commerceCategoryFeatureValue||String(feature?.textContent||'30–80 см').replace(/^.*?:\s*/, '');
  f(panel,'subcategories-visible').checked=boolFrom(card,'commerceCategorySubcategoriesVisible',subs,true);f(panel,'subcategories-source').value=card.dataset.commerceCategorySubcategoriesSource||'binding';f(panel,'subcategories-key').value=card.dataset.commerceCategorySubcategoriesKey||'category.childrenLabels';f(panel,'subcategories-text').value=card.dataset.commerceCategorySubcategoriesText||String(subs?.textContent||'');
  f(panel,'extras-visible').checked=card.dataset.commerceCategoryExtrasVisible!=='0';
  f(panel,'icon-visible').checked=boolFrom(card,'commerceCategoryIconVisible',icon,true);f(panel,'icon-text').value=card.dataset.commerceCategoryIconText||String(icon?.textContent||'↗').trim()||'↗';
  f(panel,'cta-visible').checked=boolFrom(card,'commerceCategoryCtaVisible',cta,true);f(panel,'cta-label').value=card.dataset.commerceCategoryCtaLabel||String(cta?.textContent||'Переглянути категорію').trim();f(panel,'cta-url').value=card.dataset.commerceCategoryUrl||cta?.getAttribute?.('href')||'#';f(panel,'cta-url-key').value=card.dataset.commerceCategoryUrlKey||'category.url';
  toggleCustomPrice(panel);const po=panel.querySelector('[data-pcat-out="price"]');if(po)po.textContent=priceText(card);renderExtraEditors(panel,card);
  if(status){status.className='st-shop-contract-status is-ok';status.innerHTML=`<b>Category Card · ${extraNodes(card).length} дод. блоків</b><span>Ключі даних і semantic state зберігаються всередині компонента.</span>`;}
}

function applyBindings(card,panel){
  const countSource=String(f(panel,'count-source')?.value||'binding');const countKey=String(f(panel,'count-key')?.value||'category.productsCount');let countVal=String(f(panel,'count-value')?.value||'0');if(countSource==='binding')countVal=String(sourceValue(card,'binding',countKey,countVal));f(panel,'count-value').value=countVal;
  const priceSource=String(f(panel,'price-source')?.value||'binding');let min=String(f(panel,'price-min')?.value||'0'),max=String(f(panel,'price-max')?.value||min);if(priceSource==='binding'){min=String(sourceValue(card,'binding',f(panel,'price-min-key')?.value||'category.priceMin',min));max=String(sourceValue(card,'binding',f(panel,'price-max-key')?.value||'category.priceMax',max));f(panel,'price-min').value=min;f(panel,'price-max').value=max;}
  const featSource=String(f(panel,'feature-source')?.value||'binding');let feat=String(f(panel,'feature-value')?.value||'');if(featSource==='binding'){feat=String(sourceValue(card,'binding',f(panel,'feature-key')?.value||'',feat));f(panel,'feature-value').value=feat;}
  const subSource=String(f(panel,'subcategories-source')?.value||'binding');let subt=String(f(panel,'subcategories-text')?.value||'');if(subSource==='binding'){const raw=sourceValue(card,'binding',f(panel,'subcategories-key')?.value||'',subt);subt=Array.isArray(raw)?raw.join(' · '):String(raw??subt);f(panel,'subcategories-text').value=subt;}
  let url=String(f(panel,'cta-url')?.value||'#');url=String(sourceValue(card,'binding',f(panel,'cta-url-key')?.value||'category.url',url));f(panel,'cta-url').value=url;
  extraNodes(card).forEach(n=>{resolveExtraBinding(card,n);placeExtra(card,n);});
}

function apply(panel,getSelection,{live=false,refreshBindings=false}={}){
  const card=selectedCategory(getSelection);if(!card)return;
  if(refreshBindings)applyBindings(card,panel);
  const count=role(card,'category-products-count'),price=role(card,'category-price'),feature=role(card,'category-feature'),subs=role(card,'category-subcategories'),icon=role(card,'category-icon'),actions=role(card,'actions'),cta=role(card,'category-open');
  card.dataset.commerceCategoryProductsCountSource=String(f(panel,'count-source')?.value||'binding');card.dataset.commerceCategoryProductsCountKey=String(f(panel,'count-key')?.value||'');card.dataset.commerceCategoryProductsCount=String(f(panel,'count-value')?.value||'0');card.dataset.commerceCategoryProductsSuffix=String(f(panel,'count-suffix')?.value||'');setVisible(card,'commerceCategoryProductsCountVisible',count,!!f(panel,'count-visible')?.checked);if(count){count.setAttribute('data-commerce-bind-key',card.dataset.commerceCategoryProductsCountKey||'');}renderCount(card,count);
  card.dataset.commerceCategoryPriceSource=String(f(panel,'price-source')?.value||'binding');card.dataset.commerceCategoryPriceMode=String(f(panel,'price-mode')?.value||'auto');card.dataset.commerceCategoryPriceMin=String(f(panel,'price-min')?.value||'0');card.dataset.commerceCategoryPriceMax=String(f(panel,'price-max')?.value||'0');card.dataset.commerceCategoryPriceMinKey=String(f(panel,'price-min-key')?.value||'');card.dataset.commerceCategoryPriceMaxKey=String(f(panel,'price-max-key')?.value||'');card.dataset.commerceCategoryPriceCurrency=String(f(panel,'price-currency')?.value||'грн');card.dataset.commerceCategoryPriceCustom=String(f(panel,'price-custom')?.value||'');setVisible(card,'commerceCategoryPriceVisible',price,!!f(panel,'price-visible')?.checked);if(price){price.setAttribute('data-commerce-bind-min-key',card.dataset.commerceCategoryPriceMinKey||'');price.setAttribute('data-commerce-bind-max-key',card.dataset.commerceCategoryPriceMaxKey||'');price.textContent=priceText(card);}
  card.dataset.commerceCategoryFeatureSource=String(f(panel,'feature-source')?.value||'binding');card.dataset.commerceCategoryFeatureDisplay=String(f(panel,'feature-display')?.value||'label-value');card.dataset.commerceCategoryFeatureKey=String(f(panel,'feature-key')?.value||'');card.dataset.commerceCategoryFeatureLabel=String(f(panel,'feature-label')?.value||'');card.dataset.commerceCategoryFeatureValue=String(f(panel,'feature-value')?.value||'');setVisible(card,'commerceCategoryFeatureVisible',feature,!!f(panel,'feature-visible')?.checked);if(feature)feature.setAttribute('data-commerce-bind-key',card.dataset.commerceCategoryFeatureKey||'');renderFeature(card,feature);
  card.dataset.commerceCategorySubcategoriesSource=String(f(panel,'subcategories-source')?.value||'binding');card.dataset.commerceCategorySubcategoriesKey=String(f(panel,'subcategories-key')?.value||'');card.dataset.commerceCategorySubcategoriesText=String(f(panel,'subcategories-text')?.value||'');setVisible(card,'commerceCategorySubcategoriesVisible',subs,!!f(panel,'subcategories-visible')?.checked);if(subs)subs.setAttribute('data-commerce-bind-key',card.dataset.commerceCategorySubcategoriesKey||'');renderSubcategories(card,subs);
  card.dataset.commerceCategoryExtrasVisible=!!f(panel,'extras-visible')?.checked?'1':'0';extraNodes(card).forEach(n=>{n.hidden=card.dataset.commerceCategoryExtrasVisible==='0'||n.dataset.commerceExtraVisible==='0';placeExtra(card,n);});
  card.dataset.commerceCategoryIconVisible=!!f(panel,'icon-visible')?.checked?'1':'0';card.dataset.commerceCategoryIconText=String(f(panel,'icon-text')?.value||'↗');if(icon){icon.hidden=card.dataset.commerceCategoryIconVisible==='0';icon.textContent=card.dataset.commerceCategoryIconText||'↗';}
  card.dataset.commerceCategoryCtaVisible=!!f(panel,'cta-visible')?.checked?'1':'0';card.dataset.commerceCategoryCtaLabel=String(f(panel,'cta-label')?.value||'Переглянути категорію');card.dataset.commerceCategoryUrl=String(f(panel,'cta-url')?.value||'#');card.dataset.commerceCategoryUrlKey=String(f(panel,'cta-url-key')?.value||'category.url');const ctaVisible=!!f(panel,'cta-visible')?.checked;if(actions)actions.hidden=!ctaVisible;setVisible(card,'commerceCategoryCtaVisible',cta,ctaVisible);if(cta)cta.setAttribute('data-commerce-bind-key',card.dataset.commerceCategoryUrlKey||'');renderCta(card,cta);
  toggleCustomPrice(panel);const po=panel.querySelector('[data-pcat-out="price"]');if(po)po.textContent=priceText(card);
  if(!live){const result=window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card,'shop-category-card-data-01050')||null;try{window.__ST_ALL_LOG__?.push?.('commerce-category-card-data-committed-01050',{ok:!!result?.ok,nodeId:String(result?.nodeId||''),extras:extraNodes(card).length,storeAuthority:!!result?.ok});}catch{}}
}

function syncEditorToNode(panel,card,editor){
  const id=String(editor?.dataset?.pcatExtraEditor||'');const node=extraNodes(card).find(n=>String(n.dataset.commerceExtraId||'')===id);if(!node)return;
  const ef=(k)=>editor.querySelector(`[data-pcat-extra="${k}"]`);
  node.dataset.commerceExtraVisible=ef('visible')?.checked?'1':'0';node.hidden=card.dataset.commerceCategoryExtrasVisible==='0'||node.dataset.commerceExtraVisible==='0';node.dataset.commerceExtraSource=String(ef('source')?.value||'binding');node.dataset.commerceExtraKey=String(ef('key')?.value||'');node.dataset.commerceExtraLabel=String(ef('label')?.value||'');node.dataset.commerceExtraFallback=String(ef('value')?.value||'');node.dataset.commerceExtraValue=String(ef('value')?.value||'');node.dataset.commerceExtraZone=String(ef('zone')?.value||'content');let pos=String(ef('position')?.value||'');const mediaPositions=['top-left','top-right','bottom-left','bottom-right'];const contentPositions=Object.keys(CONTENT_ORDER);if(node.dataset.commerceExtraZone==='media'&&!mediaPositions.includes(pos))pos='bottom-left';if(node.dataset.commerceExtraZone==='content'&&!contentPositions.includes(pos))pos='after-description';node.dataset.commerceExtraPosition=pos;if(node.dataset.commerceExtraSource==='binding')resolveExtraBinding(card,node);placeExtra(card,node);
}

function addExtra(card){const nodes=extraNodes(card);if(!card||nodes.length>=MAX_EXTRAS)return null;const n=document.createElement('span');n.dataset.commerceRole='category-extra';n.dataset.commerceExtraId=extraId();n.dataset.commerceExtraVisible='1';n.dataset.commerceExtraSource='binding';n.dataset.commerceExtraKey='category.attributes.thickness';n.dataset.commerceExtraLabel='';n.dataset.commerceExtraFallback='6–8 мм';n.dataset.commerceExtraValue='6–8 мм';n.dataset.commerceExtraZone=nodes.length%2===0?'media':'content';n.dataset.commerceExtraPosition=n.dataset.commerceExtraZone==='media'?'bottom-left':'after-description';n.style.padding='6px 9px';n.style.borderRadius='999px';n.style.background='rgba(255,255,255,.90)';n.style.color='#172033';n.style.fontSize='11px';n.style.fontWeight='900';n.style.boxShadow='0 8px 20px rgba(15,23,42,.12)';placeExtra(card,n);return n;}

export function bindCategoryCardDataWidget01050(sectionEl,getSelection){
  const panel=sectionEl?.querySelector?.('[data-category-card-data-widget-01050]');if(!panel||panel.dataset.bound01050==='1')return;panel.dataset.bound01050='1';let raf=0;
  const live=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>apply(panel,getSelection,{live:true}));};
  panel.addEventListener('input',ev=>{if(ev.target?.matches?.('[data-pcat]')){live();toggleCustomPrice(panel);return;}const editor=ev.target?.closest?.('[data-pcat-extra-editor]');if(editor&&ev.target?.matches?.('[data-pcat-extra]')){const card=selectedCategory(getSelection);if(card){syncEditorToNode(panel,card,editor);live();}}});
  panel.addEventListener('change',ev=>{if(ev.target?.matches?.('[data-pcat]')){apply(panel,getSelection,{live:false});return;}const editor=ev.target?.closest?.('[data-pcat-extra-editor]');if(editor&&ev.target?.matches?.('[data-pcat-extra]')){const card=selectedCategory(getSelection);if(card){syncEditorToNode(panel,card,editor);renderExtraEditors(panel,card);apply(panel,getSelection,{live:false});}}});
  panel.addEventListener('click',ev=>{
    const card=selectedCategory(getSelection);if(!card)return;
    if(ev.target?.closest?.('[data-pcat-add-extra]')){ev.preventDefault();const node=addExtra(card);if(node){renderExtraEditors(panel,card);apply(panel,getSelection,{live:false});}return;}
    const rm=ev.target?.closest?.('[data-pcat-remove-extra]');if(rm){ev.preventDefault();const id=String(rm.getAttribute('data-pcat-remove-extra')||'');const node=extraNodes(card).find(n=>String(n.dataset.commerceExtraId||'')===id);node?.remove();renderExtraEditors(panel,card);apply(panel,getSelection,{live:false});return;}
    if(ev.target?.closest?.('[data-pcat-refresh-bindings]')){ev.preventDefault();apply(panel,getSelection,{live:false,refreshBindings:true});hydrate(panel,getSelection);}
  });
  const refresh=()=>hydrate(panel,getSelection);document.addEventListener('st:selection-changed',refresh,true);window.addEventListener('st-page-selected',refresh);window.addEventListener('st:canvas-snapshot-applied',refresh);window.addEventListener('builder:structureChanged',refresh);window.addEventListener('st:commerce-component-template-applied-01041',refresh);window.addEventListener('st:commerce-binding-data-changed-01050',()=>{const card=selectedCategory(getSelection);if(card){apply(panel,getSelection,{live:false,refreshBindings:true});hydrate(panel,getSelection);}});refresh();
}
