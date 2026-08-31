// 01064 · Commerce Binding runtime.
// Bridges SiteFrameStore-owned Product/Category Card components with MarketplaceStore canonical data.
// IMPORTANT: no repository implementation is imported here. UI/cards only see MarketplaceStore + binding contract.
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import {
  getMarketplaceCommerceBindingData01064,
  listMarketplaceBindingEntities01064,
  resolveMarketplaceCommerceBindingPath01064,
  formatMarketplaceBindingFeature01064
} from './data/marketplace-commerce-binding-selectors-01064.js?v=01064';

const STAGE='01064';
const ROOT_SELECTOR='[data-commerce-component="product-card"],[data-commerce-component="category-card"]';
const BIND_SOURCE='marketplace';
const str=v=>String(v??'').trim();
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

function cardRoot(input){if(!(input instanceof Element))return null;return input.matches(ROOT_SELECTOR)?input:input.closest(ROOT_SELECTOR);}
function typeOf(card){return str(card?.dataset?.commerceComponent).toLowerCase()==='category-card'?'category-card':'product-card';}
function entityId(card){return str(card?.dataset?.commerceEntityId01064||card?.dataset?.commerceEntityId);}
function isBound(card){return str(card?.dataset?.commerceBindingSource01064||card?.dataset?.commerceBindingSource)===BIND_SOURCE&&!!entityId(card);}
function currencySymbol(code){const c=str(code).toUpperCase();return c==='UAH'?'грн':c==='USD'?'$':c==='EUR'?'€':c||'грн';}
function money(value,currency){const n=Number(value);if(!Number.isFinite(n))return '';return `${new Intl.NumberFormat('uk-UA',{maximumFractionDigits:2}).format(n)} ${currencySymbol(currency)}`;}
function pluralReviews(n){const x=Math.abs(Math.round(num(n)));const d10=x%10,d100=x%100;return d10===1&&d100!==11?'відгук':(d10>=2&&d10<=4&&(d100<12||d100>14)?'відгуки':'відгуків');}
function stars(rating){const n=clamp(num(rating),0,5);if(!n)return '—';const full=Math.round(n);return `${'★'.repeat(full)}${'☆'.repeat(Math.max(0,5-full))}`;}
function displayFeature(value){return formatMarketplaceBindingFeature01064(value);}
function cleanText(v){if(v===null||v===undefined)return '';if(typeof v==='object')return displayFeature(v);return String(v);}
function setAutoHidden(node,hidden){
  if(!node)return;
  if(hidden){if(!node.hasAttribute('data-commerce-binding-prev-hidden-01064'))node.setAttribute('data-commerce-binding-prev-hidden-01064',node.hidden?'1':'0');node.hidden=true;node.setAttribute('data-commerce-binding-auto-hidden-01064','1');}
  else if(node.getAttribute('data-commerce-binding-auto-hidden-01064')==='1'){
    const prev=node.getAttribute('data-commerce-binding-prev-hidden-01064');node.hidden=prev==='1';node.removeAttribute('data-commerce-binding-prev-hidden-01064');node.removeAttribute('data-commerce-binding-auto-hidden-01064');
  }
}
function lockBoundText(card){
  card.querySelectorAll('[contenteditable][data-commerce-bind],[contenteditable][data-commerce-bind-key]').forEach(node=>{
    if(!node.hasAttribute('data-commerce-binding-prev-editable-01064'))node.setAttribute('data-commerce-binding-prev-editable-01064',node.getAttribute('contenteditable')??'');
    node.setAttribute('contenteditable','false');node.setAttribute('data-commerce-binding-locked-01064','1');
  });
}
function unlockBoundText(card){
  card.querySelectorAll('[data-commerce-binding-locked-01064]').forEach(node=>{
    const prev=node.getAttribute('data-commerce-binding-prev-editable-01064');if(prev===null||prev==='')node.removeAttribute('contenteditable');else node.setAttribute('contenteditable',prev);
    node.removeAttribute('data-commerce-binding-prev-editable-01064');node.removeAttribute('data-commerce-binding-locked-01064');
  });
  card.querySelectorAll('[data-commerce-binding-auto-hidden-01064]').forEach(node=>setAutoHidden(node,false));
}
function bindingFor(card,state){return getMarketplaceCommerceBindingData01064(state,typeOf(card),entityId(card));}
function resolveForCard(card,key,state){const b=bindingFor(card,state);return b?resolveMarketplaceCommerceBindingPath01064(b,key):undefined;}

function formatNodeValue(node,value,binding,card){
  const role=str(node.getAttribute('data-commerce-role'));const entity=binding?.entity||{};
  if(role==='price-current')return money(value,entity.currency);
  if(role==='price-old')return money(value,entity.currency);
  if(role==='discount')return str(value);
  if(role==='stock')return str(binding?.product?.stockLabel||value);
  if(role==='rating')return stars(value);
  if(role==='reviews-count'){const n=Math.max(0,Math.round(num(value)));return `${n} ${pluralReviews(n)}`;}
  if(role==='category-products-count'){const suffix=str(card.dataset.commerceCategoryProductsSuffix)||'товарів';return `${Math.max(0,Math.round(num(value)))} ${suffix}`;}
  if(role==='category-feature'){
    const label=str(card.dataset.commerceCategoryFeatureLabel);const text=displayFeature(value);const mode=str(card.dataset.commerceCategoryFeatureDisplay)||'label-value';
    if(mode==='value')return text;if(mode==='label')return label;return [label,text].filter(Boolean).join(': ');
  }
  if(role==='category-extra'){
    const label=str(node.dataset.commerceExtraLabel);const text=displayFeature(value);return label&&text?`${label}: ${text}`:text;
  }
  if(role==='category-subcategories')return str(value);
  return cleanText(value);
}

function applySimpleNode(node,key,binding,card){
  const value=resolveMarketplaceCommerceBindingPath01064(binding,key);const role=str(node.getAttribute('data-commerce-role'));
  if(role==='image'||role==='image-secondary'){
    const url=str(value);setAutoHidden(node,!url);if(url)node.setAttribute('src',url);
    const alt=role==='image'?binding?.entity?.imageAlt:binding?.entity?.imageSecondaryAlt;if(str(alt))node.setAttribute('alt',str(alt));return;
  }
  if(node instanceof HTMLAnchorElement){const href=str(value);if(href)node.setAttribute('href',href);else node.setAttribute('href','#');return;}
  const text=formatNodeValue(node,value,binding,card);
  const missingFeature=role==='category-feature'&&!str(displayFeature(value));
  const autoHide=(['badge','discount','price-old','category-extra','category-subcategories'].includes(role)&&!str(text))||missingFeature;
  setAutoHidden(node,autoHide);if(!autoHide)node.textContent=text;
  if(role==='rating'&&binding?.product?.rating)node.setAttribute('title',`${binding.product.rating.toFixed?.(1)||binding.product.rating} / 5`);
}

function applyCategoryPrice(card,binding){
  const node=card.querySelector('[data-commerce-role="category-price"]');if(!node)return;
  const minKey=str(node.getAttribute('data-commerce-bind-min-key')||card.dataset.commerceCategoryPriceMinKey||'category.priceMin');
  const maxKey=str(node.getAttribute('data-commerce-bind-max-key')||card.dataset.commerceCategoryPriceMaxKey||'category.priceMax');
  const min=num(resolveMarketplaceCommerceBindingPath01064(binding,minKey)),max=num(resolveMarketplaceCommerceBindingPath01064(binding,maxKey));
  const mode=str(card.dataset.commerceCategoryPriceMode)||'range-short',currency=str(card.dataset.commerceCategoryPriceCurrency)||currencySymbol(binding?.category?.currency);
  let text='';if(min>0||max>0){if(mode==='from')text=`від ${new Intl.NumberFormat('uk-UA').format(min||max)} ${currency}`;else if(mode==='to')text=`до ${new Intl.NumberFormat('uk-UA').format(max||min)} ${currency}`;else if(min&&max&&min!==max)text=`${new Intl.NumberFormat('uk-UA').format(min)}–${new Intl.NumberFormat('uk-UA').format(max)} ${currency}`;else text=`${new Intl.NumberFormat('uk-UA').format(min||max)} ${currency}`;}
  setAutoHidden(node,!text);if(text)node.textContent=text;
}

function applyUnboundRoles(card,binding){
  const type=typeOf(card);
  if(type==='category-card'){
    const icon=card.querySelector('[data-commerce-role="category-icon"]');if(icon){const text=str(binding?.category?.icon);setAutoHidden(icon,!text);if(text)icon.textContent=text;}
    applyCategoryPrice(card,binding);
  }
}

function renderCard(card,state,{silent=false}={}){
  const root=cardRoot(card);if(!root||!isBound(root))return {ok:false,reason:'unbound',card:root};
  const binding=bindingFor(root,state);if(!binding){root.dataset.commerceBindingState01064='missing';root.dataset.commerceBindingEntityName01064='';return {ok:false,reason:'missing-entity',card:root,id:entityId(root),type:typeOf(root)};}
  root.dataset.commerceBindingState01064='ok';root.dataset.commerceBindingEntityName01064=str(binding.entity?.name||binding.entity?.sku||binding.entity?.id);
  root.querySelectorAll('[data-commerce-bind],[data-commerce-bind-key]').forEach(node=>{
    const key=str(node.getAttribute('data-commerce-bind-key')||node.getAttribute('data-commerce-bind'));if(key)applySimpleNode(node,key,binding,root);
  });
  applyUnboundRoles(root,binding);lockBoundText(root);
  if(!silent){try{window.dispatchEvent(new CustomEvent('st:commerce-binding-card-rendered-01064',{detail:{card:root,componentType:typeOf(root),entityId:entityId(root),entityName:root.dataset.commerceBindingEntityName01064}}));}catch{}}
  return {ok:true,card:root,binding};
}

function commitCard(card,reason='commerce-binding-01064'){
  try{const a=window.ST_SITE_FRAME_STORE_AUTHORITY_00876;return a?.commitMainComponentBindingDataset01067?.(card,reason)||a?.commitMainComponentContent01041?.(card,reason)||null;}catch(err){console.warn('[01064] SiteFrameStore binding commit failed',err);return null;}
}

export class MarketplaceCommerceBindingRuntime01064{
  constructor({store=getMarketplaceStore01052()}={}){this.store=store;this.unsub=null;this.bound=false;this.refreshQueued=false;}
  init(){
    if(this.bound)return this;this.bound=true;
    window.ST_COMMERCE_DATA_BINDING_RESOLVER_01050=(key,{card}={})=>{const root=cardRoot(card);if(!root||!isBound(root))return undefined;return resolveForCard(root,key,this.store.getState());};
    this.unsub=this.store.subscribe(()=>this.scheduleRefresh('marketplace-store'));
    const refresh=()=>this.scheduleRefresh('canvas-event');
    ['st:commerce-component-template-applied-01041','st:canvas-snapshot-applied','builder:structureChanged','st-page-selected','st-page-changed'].forEach(name=>window.addEventListener(name,refresh));
    window.addEventListener('st:commerce-binding-data-changed-01050',refresh);
    this.scheduleRefresh('init');
    return this;
  }
  scheduleRefresh(reason='refresh'){
    if(this.refreshQueued)return;this.refreshQueued=true;requestAnimationFrame(()=>{this.refreshQueued=false;this.refreshAll(document,{reason});});
  }
  listEntities(componentType){return listMarketplaceBindingEntities01064(this.store.getState(),componentType);}
  getBinding(card){const root=cardRoot(card);if(!root)return null;const id=entityId(root),componentType=typeOf(root),source=str(root.dataset.commerceBindingSource01064||root.dataset.commerceBindingSource);const data=id?getMarketplaceCommerceBindingData01064(this.store.getState(),componentType,id):null;return {card:root,componentType,entityId:id,source,bound:source===BIND_SOURCE&&!!id,state:str(root.dataset.commerceBindingState01064),entity:data?.entity||null};}
  refreshCard(card,options={}){return renderCard(cardRoot(card),this.store.getState(),options);}
  refreshAll(root=document,{reason='refresh'}={}){
    const scope=root instanceof Element||root instanceof Document?root:document;let ok=0,missing=0;
    scope.querySelectorAll(ROOT_SELECTOR).forEach(card=>{if(!isBound(card))return;const result=renderCard(card,this.store.getState(),{silent:true});if(result.ok)ok++;else missing++;});
    try{window.dispatchEvent(new CustomEvent('st:commerce-binding-refreshed-01064',{detail:{reason,ok,missing}}));}catch{}
    return {ok,missing};
  }
  bindCard(card,id){
    const root=cardRoot(card);if(!root)throw new Error('Виберіть Product Card або Category Card на Canvas.');
    const componentType=typeOf(root),entity=str(id);if(!entity)throw new Error('Виберіть товар або категорію з MarketplaceStore.');
    const data=getMarketplaceCommerceBindingData01064(this.store.getState(),componentType,entity);if(!data)throw new Error(componentType==='category-card'?'Категорію не знайдено в MarketplaceStore.':'Товар не знайдено в MarketplaceStore.');
    root.dataset.commerceBindingSource01064=BIND_SOURCE;root.dataset.commerceBindingSource=BIND_SOURCE;root.dataset.commerceEntityId01064=entity;root.dataset.commerceEntityId=entity;root.dataset.commerceBindingVersion01064=STAGE;
    // Persist only the binding identity into SiteFrameStore. Marketplace values stay a live projection
    // and are intentionally NOT committed into the authored design snapshot.
    commitCard(root,'commerce-binding-01064-bind');
    const rendered=renderCard(root,this.store.getState());
    requestAnimationFrame(()=>this.refreshAll(document,{reason:'bind-commit'}));
    try{window.dispatchEvent(new CustomEvent('st:commerce-card-binding-changed-01064',{detail:{action:'bind',componentType,entityId:entity,entityName:data.entity?.name||''}}));}catch{}
    return rendered;
  }
  unbindCard(card){
    const root=cardRoot(card);if(!root)throw new Error('Виберіть Commerce Card на Canvas.');const previous=this.getBinding(root);
    ['commerceBindingSource01064','commerceBindingSource','commerceEntityId01064','commerceEntityId','commerceBindingVersion01064','commerceBindingState01064','commerceBindingEntityName01064'].forEach(k=>delete root.dataset[k]);
    unlockBoundText(root);commitCard(root,'commerce-binding-01064-unbind');
    try{window.dispatchEvent(new CustomEvent('st:commerce-card-binding-changed-01064',{detail:{action:'unbind',componentType:previous?.componentType||'',entityId:previous?.entityId||''}}));}catch{}
    return previous;
  }
  openEntityEditor(card){
    const info=this.getBinding(card);if(!info?.entityId)return false;
    try{document.getElementById('navMarketplace')?.click();}catch{}
    const page=info.componentType==='category-card'?'categories':'products';try{window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(page);}catch{}
    requestAnimationFrame(()=>{try{if(info.componentType==='category-card')window.ST_MARKETPLACE_CATEGORY_EDITOR_01057?.openEdit?.(info.entityId);else window.ST_MARKETPLACE_PRODUCT_EDITOR_01053?.openEdit?.(info.entityId);}catch{}});
    return true;
  }
  diagnostics(){
    const state=this.store.getState(),cards=[...document.querySelectorAll(ROOT_SELECTOR)],bound=cards.filter(isBound),rows=bound.map(card=>{const info=this.getBinding(card);return{componentType:info.componentType,entityId:info.entityId,state:info.entity?'ok':'missing',entityName:info.entity?.name||''};});
    return {stage:STAGE,totalCards:cards.length,boundCards:bound.length,productCards:cards.filter(c=>typeOf(c)==='product-card').length,categoryCards:cards.filter(c=>typeOf(c)==='category-card').length,missingBindings:rows.filter(r=>r.state==='missing').length,products:state.products?.length||0,categories:state.categories?.length||0,rows};
  }
}

let singleton=null;
export function initMarketplaceCommerceBindingRuntime01064(options={}){if(!singleton)singleton=new MarketplaceCommerceBindingRuntime01064(options).init();return singleton;}
export function getMarketplaceCommerceBindingRuntime01064(){return singleton||initMarketplaceCommerceBindingRuntime01064();}
