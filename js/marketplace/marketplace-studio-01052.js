// 01052 · Marketplace Studio Data Core binding.
// Extends the stable 01051 shell with storage-agnostic MarketplaceStore + repository contract.
import { initMarketplaceStudio01051 } from './marketplace-studio-01051.js?v=01052';
import { getMarketplaceStore01052 } from './data/marketplace-runtime-01052.js?v=01052';
import { createMarketplaceDemoSeed01052 } from './data/marketplace-schema-01052.js?v=01052';

const STAGE='01052';
const store=getMarketplaceStore01052();

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function money(v,currency='UAH'){
  const n=Number(v)||0;
  try{return new Intl.NumberFormat('uk-UA',{style:'currency',currency,maximumFractionDigits:0}).format(n);}catch{return `${n} грн`;}
}
function mediaMap(state){return new Map((state.media||[]).map(m=>[m.id,m]));}
function categoryMap(state){return new Map((state.categories||[]).map(c=>[c.id,c]));}
function imageUrl(product,state){const m=mediaMap(state).get(product.primaryMediaId)||(state.media||[]).find(x=>(product.mediaIds||[]).includes(x.id));return m?.url||'';}
function productCategoryNames(product,state){const map=categoryMap(state);return (product.categoryIds||[]).map(id=>map.get(id)?.name).filter(Boolean).join(', ')||'—';}
function categoryProducts(category,state){return (state.products||[]).filter(p=>(p.categoryIds||[]).includes(category.id));}
function categoryMeta(category,state){
  const products=categoryProducts(category,state), prices=products.map(p=>Number(p.price)).filter(n=>n>0);
  const min=prices.length?Math.min(...prices):0,max=prices.length?Math.max(...prices):0;
  const feature=category.featureKey && category.attributes?.[category.featureKey];
  const featureText=feature && typeof feature==='object' && Number.isFinite(Number(feature.min)) && Number.isFinite(Number(feature.max))
    ? `${feature.min}–${feature.max}${feature.unit?` ${feature.unit}`:''}` : '';
  const priceText=min? (min===max?money(min):`${money(min).replace(/\s*₴/,'')}–${money(max)}`) : 'без цін';
  return `${products.length} ${products.length===1?'товар':'товарів'} · ${priceText}${featureText?` · ${featureText}`:''}`;
}

function ensureDataCoreInspector(panel){
  if(panel.querySelector('[data-mp-accordion="data-core"]')) return;
  const hero=panel.querySelector('.mp-inspector__hero');
  if(hero){
    const eyebrow=hero.querySelector('.mp-inspector__eyebrow'); if(eyebrow) eyebrow.textContent=`MARKETPLACE STUDIO · ${STAGE}`;
    const mode=hero.querySelector('.mp-inspector__mode'); if(mode) mode.innerHTML=`<span>MarketplaceStore</span><b class="mp-live-dot">${esc(store.getRepositoryInfo().name)} READY</b>`;
    const sub=hero.querySelector('.mp-inspector__subtitle'); if(sub) sub.textContent='Окремий commerce state з repository adapter. UI не знає, яка фізична база активна; адаптер вибирається у data composition root.';
  }
  const quick=panel.querySelector('.mp-inspector__quick');
  if(quick && !quick.querySelector('[data-mp-page="data-core"]')) quick.insertAdjacentHTML('beforeend','<button type="button" data-mp-page="data-core">◉ Data Core</button>');
  const firstGroup=panel.querySelector('.mp-side-group');
  if(firstGroup){
    firstGroup.insertAdjacentHTML('afterend',`<section class="mp-accordion" data-mp-accordion="data-core">
      <button class="mp-accordion__head" type="button" data-mp-accordion-head="data-core">
        <span class="mp-accordion__icon">◉</span><span><span class="mp-accordion__name">Data Core</span><span class="mp-accordion__meta">Store, Repository, schema, persistence</span></span><span class="mp-accordion__chev">⌄</span>
      </button>
      <div class="mp-accordion__body"><div class="mp-accordion__grid">
        <button type="button" class="mp-side-action" data-mp-page="data-core">Стан схеми</button>
        <button type="button" class="mp-side-action" data-mp-core-action="demo">DEMO data</button>
        <button type="button" class="mp-side-action is-wide" data-mp-core-action="export">Експорт JSON</button>
      </div><div class="mp-side-status"><span>Repository</span><b data-mp-repository-side>contract v1</b></div></div>
    </section>`);
  }
}

function dataCorePageHtml(state){
  const s=store.getSummary(),repo=store.getRepositoryInfo();
  const entities=[['Товари','products',s.products],['Категорії','categories',s.categories],['Характеристики','attributes',s.attributes],['Значення','attributeValues',s.attributeValues],['Варіації','variants',s.variants],['Медіа','media',s.media],['Колекції','collections',s.collections],['Фільтри','filters',s.filters],['Рекомендації','recommendations',s.recommendations],['Feeds','feeds',s.feeds],['SEO','seo',1]];
  return `<section class="mp-page" data-mp-page-view="data-core">
    <div class="mp-page-head"><div><h1>Data Core · MarketplaceStore</h1><p>Єдиний storage-agnostic state маркетплейсу. Фізичне сховище приховане за MarketplaceRepository contract. Заміна adapter не змінює Marketplace Studio.</p></div><div class="mp-page-actions"><button type="button" class="mp-btn" data-mp-core-action="export">Експорт JSON</button><button type="button" class="mp-btn mp-btn--primary" data-mp-core-action="demo">Завантажити DEMO</button></div></div>
    <div class="mp-stat-grid">
      <div class="mp-stat"><div class="mp-stat__icon">DB</div><div class="mp-stat__value">v${s.schemaVersion}</div><div class="mp-stat__label">Schema version</div><div class="mp-stat__trend">${esc(state.schemaId)}</div></div>
      <div class="mp-stat"><div class="mp-stat__icon">↻</div><div class="mp-stat__value">${s.revision}</div><div class="mp-stat__label">Revision</div><div class="mp-stat__trend">Зростає при кожному commit</div></div>
      <div class="mp-stat"><div class="mp-stat__icon">◉</div><div class="mp-stat__value" style="font-size:18px">${esc(repo.type)}</div><div class="mp-stat__label">Active repository</div><div class="mp-stat__trend">${esc(repo.storageKey||'API/custom')}</div></div>
      <div class="mp-stat"><div class="mp-stat__icon">✓</div><div class="mp-stat__value">1</div><div class="mp-stat__label">Repository contract</div><div class="mp-stat__trend">Local ↔ API without UI rewrite</div></div>
    </div>
    <div class="mp-grid-2">
      <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Canonical collections</div><div class="mp-card__hint">Усі сутності одного snapshot</div></div><span class="mp-badge">LIVE</span></div><div class="mp-card__body"><div class="mp-data-entity-grid">${entities.map(r=>`<div class="mp-data-entity"><span>${esc(r[0])}</span><b>${r[2]}</b><code>${esc(r[1])}[]</code></div>`).join('')}</div></div></section>
      <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Repository switch point</div><div class="mp-card__hint">UI та Store не знають про конкретну базу</div></div></div><div class="mp-card__body"><div class="mp-repo-flow"><div>Marketplace Studio</div><i>↓</i><div>MarketplaceStore</div><i>↓</i><div>MarketplaceRepository</div><i>↓</i><div class="is-active">${esc(repo.name)} · active adapter</div><div>Інші adapter-и під тим самим contract</div></div></div></section>
    </div>
    <section class="mp-card" style="margin-top:12px"><div class="mp-card__head"><div><div class="mp-card__title">Тестування persistence</div><div class="mp-card__hint">Фотографії binary/base64 сюди не записуються — лише media URL/metadata.</div></div><span class="mp-badge is-warn">DEV ONLY</span></div><div class="mp-card__body"><div class="mp-core-actions"><button type="button" class="mp-btn mp-btn--primary" data-mp-core-action="demo">Завантажити DEMO-дані</button><button type="button" class="mp-btn" data-mp-core-action="export">Експорт snapshot JSON</button><button type="button" class="mp-btn mp-btn--danger" data-mp-core-action="reset">Очистити тестові дані</button></div><div class="mp-context__notice" style="margin-top:12px">DEMO потрібне лише для перевірки Store/F5. На етапі Product Editor нові товари підуть через ті самі <b>createProduct/updateProduct</b>, а при переході на сервер зміниться тільки repository adapter.</div></div></section>
  </section>`;
}

function ensureDataCorePage(studio,state){
  const content=studio.querySelector('.mp-content'); if(!content)return;
  const old=content.querySelector('[data-mp-page-view="data-core"]');
  if(old) old.outerHTML=dataCorePageHtml(state); else content.insertAdjacentHTML('beforeend',dataCorePageHtml(state));
}

function renderOverview(studio,state){
  const page=studio.querySelector('[data-mp-page-view="overview"]'); if(!page)return;
  const s=store.getSummary(); const grid=page.querySelector(':scope > .mp-stat-grid');const stats=grid?.querySelectorAll(':scope > .mp-stat')||[];
  const set=(i,value,label,trend)=>{const el=stats[i];if(!el)return;const valueEl=el.querySelector('.mp-stat__value'),labelEl=el.querySelector('.mp-stat__label'),trendEl=el.querySelector('.mp-stat__trend');if(valueEl)valueEl.textContent=String(value);if(labelEl)labelEl.textContent=label;if(trendEl)trendEl.textContent=trend;};
  set(0,s.products,'Товарів у MarketplaceStore',`${s.activeProducts} активні · ${s.draftProducts} чернетки`);
  set(1,s.categories,'Категорій',`${s.rootCategories} головних · ${s.childCategories} дочірніх`);
  set(2,s.attributes,'Характеристик',`${s.variants} варіацій · ${s.media} media records`);
  set(3,s.attention,'Потребують уваги',`SKU ${s.missingSku} · ціна ${s.missingPrice} · stock ${s.outOfStock}`);
  const p=page.querySelector('.mp-page-head p'); if(p)p.textContent='Живий стан MarketplaceStore. Дані нижче вже читаються з активного repository adapter, а не з демонстраційних чисел UI.';
  const badge=page.querySelector('.mp-card .mp-card__head .mp-btn');
  if(badge) badge.dataset.mpAction='Повний аудит · наступний етап';
}

function renderProducts(studio,state){
  const page=studio.querySelector('[data-mp-page-view="products"]'); if(!page)return;
  const body=page.querySelector('.mp-table tbody'); if(!body)return;
  const products=state.products||[];
  body.innerHTML=products.length?products.map(p=>{
    const img=imageUrl(p,state); const status=p.status==='active'?'Активний':p.status==='archived'?'Архів':'Чернетка';
    return `<tr data-mp-product-id="${esc(p.id)}"><td>☐</td><td><div class="mp-product-cell">${img?`<img class="mp-product-thumb" src="${esc(img)}" alt="">`:'<div class="mp-product-thumb mp-thumb-empty">IMG</div>'}<div><div class="mp-product-name">${esc(p.name||'Без назви')}</div><div class="mp-product-sub">${(p.mediaIds||[]).length} фото · ${Object.keys(p.attributes||{}).length} характеристики</div></div></div></td><td>${esc(p.sku||'—')}</td><td>${esc(productCategoryNames(p,state))}</td><td><b>${money(p.price,p.currency||'UAH')}</b></td><td>${Number(p.stock)||0}</td><td><span class="mp-badge ${status==='Чернетка'?'is-warn':status==='Архів'?'is-gray':''}">${status}</span></td><td><span class="mp-badge is-blue">—</span></td><td><button type="button" class="mp-btn mp-btn--small" data-mp-action="Редагувати товар · 01053" data-mp-product-id="${esc(p.id)}">Редагувати</button></td></tr>`;
  }).join(''):`<tr><td colspan="9"><div class="mp-data-empty"><b>MarketplaceStore порожній</b><span>Завантаж DEMO у Data Core або дочекайся 01053, де «+ Додати товар» стане реальним Product Editor.</span></div></td></tr>`;
  const p=page.querySelector('.mp-page-head p');if(p)p.textContent='Таблиця вже читає реальні записи MarketplaceStore. Редактор створення/редагування товару підключимо наступним етапом 01053.';
}

function renderCategories(studio,state){
  const page=studio.querySelector('[data-mp-page-view="categories"]'); if(!page)return;
  const tree=page.querySelector('.mp-category-tree'); if(!tree)return;
  const cats=state.categories||[]; const media=mediaMap(state);
  const renderRow=c=>{const m=media.get(c.imageMediaId);return `<div class="mp-tree-row ${c.parentId?'is-child':''}" data-mp-category-id="${esc(c.id)}"><span>⋮⋮</span>${m?.url?`<img class="mp-tree-thumb" src="${esc(m.url)}" alt="">`:'<div class="mp-tree-thumb mp-thumb-empty">CAT</div>'}<div><div class="mp-tree-name">${esc(c.name||'Без назви')}</div><div class="mp-tree-meta">${esc(categoryMeta(c,state))}</div></div><button type="button" class="mp-btn mp-btn--small" data-mp-action="Редагувати категорію · 01054">Редагувати</button></div>`;};
  const roots=cats.filter(c=>!c.parentId); let html='';
  roots.forEach(r=>{html+=renderRow(r);cats.filter(c=>c.parentId===r.id).forEach(c=>html+=renderRow(c));});
  cats.filter(c=>c.parentId&&!cats.some(p=>p.id===c.parentId)).forEach(c=>html+=renderRow(c));
  tree.innerHTML=html||'<div class="mp-data-empty"><b>Категорій ще немає</b><span>У 01054 тут буде реальний Category Editor і дерево.</span></div>';
  const p=page.querySelector('.mp-page-head p');if(p)p.textContent='Дерево вже читає MarketplaceStore. Кількість товарів і діапазон цін обчислюються з product.categoryIds та product.price.';
}

function renderAttributes(studio,state){
  const page=studio.querySelector('[data-mp-page-view="attributes"]'); if(!page)return;
  const body=page.querySelector('.mp-table tbody');if(!body)return;
  body.innerHTML=(state.attributes||[]).length?(state.attributes||[]).map(a=>`<tr><td><b>${esc(a.name||'Без назви')}</b></td><td>product.attributes.${esc(a.key)}</td><td>${esc(a.type)}</td><td>${esc(a.unit||'—')}</td><td><span class="mp-chip ${a.filterable?'is-green':''}">${a.filterable?'Так':'Ні'}</span></td><td><span class="mp-chip ${a.variantOption?'is-purple':''}">${a.variantOption?'Так':'Ні'}</span></td><td><button class="mp-btn mp-btn--small" data-mp-action="Налаштувати характеристику · 01055">Налаштувати</button></td></tr>`).join(''):'<tr><td colspan="7"><div class="mp-data-empty"><b>Словник характеристик порожній</b><span>01055 додасть редактор attributes/variants/filters.</span></div></td></tr>';
}

function renderContext(studio,state){
  const ctx=studio.querySelector('.mp-context');if(!ctx)return;
  const repo=store.getRepositoryInfo(),s=store.getSummary();
  const metrics=ctx.querySelectorAll('.mp-context__metric');
  if(metrics[0])metrics[0].innerHTML=`<span>Studio shell</span><b>${STAGE}</b>`;
  if(metrics[1])metrics[1].innerHTML=`<span>MarketplaceStore</span><b>LIVE · schema v${s.schemaVersion}</b>`;
  if(metrics[2])metrics[2].innerHTML=`<span>Repository</span><b>${esc(repo.type)}</b>`;
  if(metrics[3])metrics[3].innerHTML=`<span>Revision</span><b>${s.revision}</b>`;
  const stub=ctx.querySelector('.mp-context__notice.is-warn');if(stub)stub.innerHTML='CRUD редактори товарів і категорій ще не активні. <b>Data Core persistence уже реальний</b>: snapshot проходить тільки через Repository contract.';
}

function renderStoreViews(){
  const studio=document.querySelector('[data-mp-studio="01051"]');if(!studio)return;
  const activeId=studio.querySelector('.mp-page.is-active')?.getAttribute('data-mp-page-view')||'overview';
  const state=store.getState();
  studio.dataset.mpDataStage=STAGE;
  ensureDataCorePage(studio,state); renderOverview(studio,state); renderProducts(studio,state); renderCategories(studio,state); renderAttributes(studio,state); renderContext(studio,state);
  const side=document.querySelector('[data-mp-repository-side]');if(side)side.textContent=`${store.getRepositoryInfo().type} · schema v${state.schemaVersion}`;
  try{window.ST_MARKETPLACE_STUDIO_01051?.activatePage?.(activeId);}catch{}
}

function downloadJson(snapshot){
  const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`marketplace-snapshot-v${snapshot.schemaVersion}-r${snapshot.revision}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}
function toast(msg){try{window.ST_MARKETPLACE_STUDIO_01051?.showToast?.(msg);}catch{}}

async function handleCoreAction(action){
  if(action==='demo'){
    const current=store.getSummary();
    if((current.products||current.categories) && !confirm('Замінити поточні тестові дані DEMO-набором через активний Repository?')) return;
    await store.replaceSnapshot(createMarketplaceDemoSeed01052(),'load-demo'); toast('DEMO MarketplaceStore завантажено через активний Repository contract');
  } else if(action==='reset'){
    if(!confirm('Очистити тестові Marketplace дані через активний Repository? Дизайн Builder не буде змінено.'))return;
    await store.reset();toast('MarketplaceStore очищено через Repository contract');
  } else if(action==='export'){
    downloadJson(await store.exportSnapshot());toast('Marketplace snapshot JSON підготовлено');
  }
}

function bindDataCoreActions(panel,studio){
  const handler=e=>{const b=e.target.closest('[data-mp-core-action]');if(!b)return;e.preventDefault();e.stopPropagation();handleCoreAction(b.getAttribute('data-mp-core-action')).catch(err=>{console.error('[Marketplace01052] core action failed',err);toast(`Помилка Data Core: ${err?.message||err}`);});};
  panel.addEventListener('click',handler,true);studio.addEventListener('click',handler,true);
}

export async function initMarketplaceStudio01052(){
  await store.init();
  initMarketplaceStudio01051();
  const panel=document.getElementById('marketplace-panel-root');
  const view=document.getElementById('marketplaceStudioView');
  const studio=view?.querySelector('[data-mp-studio="01051"]');
  if(!panel||!studio)return;
  ensureDataCoreInspector(panel); ensureDataCorePage(studio,store.getState()); bindDataCoreActions(panel,studio); renderStoreViews();
  store.subscribe(()=>renderStoreViews());
  try{window.ST_MARKETPLACE_STORE_01052=store;window.ST_MARKETPLACE_DATA_CORE_01052=Object.freeze({stage:STAGE,store,render:renderStoreViews});}catch{}
}
