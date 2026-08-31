// 01064 · Marketplace Studio Commerce Binding Layer.
// Final local-data/frontend seam before Multi-Tenant Foundation.
import { initMarketplaceStudio01063 } from './marketplace-studio-01063.js?v=01083';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { initMarketplaceCommerceBindingRuntime01064 } from './marketplace-commerce-binding-runtime-01064.js?v=01064';
import { getMarketplaceProductBindingData01064, getMarketplaceCategoryCardBindingData01064 } from './data/marketplace-commerce-binding-selectors-01064.js?v=01064';

const esc=v=>String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
let runtime=null;

function ensureBindingStatusCard(studio){
  const page=studio.querySelector('[data-mp-page-view="overview"]');if(!page||page.querySelector('[data-mp-binding-status-01064]'))return;
  const head=page.querySelector('.mp-page-head');const html=`<section class="mp-card" data-mp-binding-status-01064="1"><div class="mp-card__head"><div><div class="mp-card__title">Commerce Binding Layer · 01064</div><div class="mp-card__hint">SiteFrameStore зберігає дизайн/прив’язку, MarketplaceStore постачає canonical commerce-дані.</div></div><span class="mp-badge is-green">LIVE</span></div><div class="mp-card__body" data-mp-binding-status-body-01064></div></section>`;
  if(head)head.insertAdjacentHTML('afterend',html);else page.insertAdjacentHTML('afterbegin',html);
}
function renderBindingStatus(studio){
  const host=studio.querySelector('[data-mp-binding-status-body-01064]');if(!host||!runtime)return;const d=runtime.diagnostics();
  host.innerHTML=`<div class="mp-stat-grid"><div class="mp-stat"><div class="mp-stat__value">${d.totalCards}</div><div class="mp-stat__label">Commerce Card на Canvas</div></div><div class="mp-stat"><div class="mp-stat__value">${d.boundCards}</div><div class="mp-stat__label">Підв’язані LIVE</div></div><div class="mp-stat"><div class="mp-stat__value">${d.productCards}</div><div class="mp-stat__label">Product Card</div></div><div class="mp-stat"><div class="mp-stat__value">${d.categoryCards}</div><div class="mp-stat__label">Category Card</div></div></div><div class="mp-check-list" style="margin-top:12px"><div class="mp-check"><span>Binding contract</span><b>Card → MarketplaceStore</b></div><div class="mp-check"><span>Missing entity bindings</span><b class="${d.missingBindings?'warn':''}">${d.missingBindings}</b></div><div class="mp-check"><span>Repository awareness у Card</span><b>0</b></div><div class="mp-check"><span>Наступна межа</span><b>01065 Multi-Tenant</b></div></div>${d.rows.length?`<div class="mp-table-wrap" style="margin-top:12px"><table class="mp-table"><thead><tr><th>Component</th><th>Entity</th><th>Стан</th></tr></thead><tbody>${d.rows.slice(0,16).map(r=>`<tr><td>${esc(r.componentType)}</td><td>${esc(r.entityName||r.entityId)}</td><td><span class="mp-badge ${r.state==='ok'?'is-green':''}">${esc(r.state)}</span></td></tr>`).join('')}</tbody></table></div>`:''}`;
}

export async function initMarketplaceStudio01064(){
  await initMarketplaceStudio01063();
  const store=getMarketplaceStore01052(),studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return null;
  studio.dataset.mpStage='01064';runtime=initMarketplaceCommerceBindingRuntime01064({store});
  try{window.ST_COMMERCE_BINDING_01064=runtime;}catch{}
  ensureBindingStatusCard(studio);renderBindingStatus(studio);
  const metrics=studio.querySelectorAll('.mp-context__metric');if(metrics[0])metrics[0].innerHTML='<span>Studio stage</span><b>01064</b>';if(metrics[2])metrics[2].innerHTML='<span>Commerce binding</span><b>LIVE</b>';if(metrics[3])metrics[3].innerHTML='<span>Card source</span><b>MarketplaceStore</b>';
  const warn=studio.querySelector('.mp-context__notice.is-warn');if(warn)warn.innerHTML='<b>Наступний етап 01065:</b> Multi-Tenant Commerce Foundation — Account → Workspace → Store → Membership/Role. Binding Layer уже не залежить від фізичної БД, тому перехід на tenant-aware API не вимагатиме переписування Product/Category Card.';
  const refresh=()=>renderBindingStatus(studio);store.subscribe(refresh);window.addEventListener('st:commerce-binding-refreshed-01064',refresh);window.addEventListener('st:commerce-card-binding-changed-01064',refresh);window.addEventListener('builder:structureChanged',refresh);
  try{
    window.ST_MARKETPLACE_BINDING_01064=Object.freeze({stage:'01064',runtime,diagnostics:()=>runtime.diagnostics(),product:(id)=>getMarketplaceProductBindingData01064(store.getState(),id),category:(id)=>getMarketplaceCategoryCardBindingData01064(store.getState(),id)});
    window.ST_MARKETPLACE_STUDIO_01064=Object.freeze({stage:'01064',store,binding:runtime,seo:window.ST_MARKETPLACE_SEO_01063?.controller||null,discovery:window.ST_MARKETPLACE_DISCOVERY_01062?.controller||null,feedManager:window.ST_MARKETPLACE_FEEDS_01061?.controller||null,importExport:window.ST_MARKETPLACE_IMPORT_EXPORT_01060?.controller||null,mediaLibrary:window.ST_MARKETPLACE_MEDIA_01059||null,attributesVariantsFilters:window.ST_MARKETPLACE_AVF_01058||null,categoryEditor:window.ST_MARKETPLACE_CATEGORY_EDITOR_01057||null,productEditor:window.ST_MARKETPLACE_PRODUCT_EDITOR_01053||null});
  }catch{}
  return runtime;
}
