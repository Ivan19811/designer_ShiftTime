// 01057 · Marketplace Category Editor.
// UI talks only to MarketplaceStore. No physical repository/storage adapter is imported here.

import {
  getMarketplaceCategoryTree01057,
  getMarketplaceCategoryDescendantIds01057,
  getMarketplaceCategoryStats01057,
  getMarketplaceCategoryBindingData01057
} from './data/marketplace-category-selectors-01057.js?v=01057';
import {SHIFTTIME_BUILD_STAGE} from '../core/build-stage.js?v=01091';

const STAGE='01057';
const OWNED_MEDIA_SOURCE='category-editor-01057';

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function slugify(value){
  const map={а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ы:'y',э:'e',ъ:'',ё:'io'};
  return String(value??'').trim().toLowerCase().split('').map(ch=>map[ch]??ch).join('')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,120);
}
function money(v,currency='UAH'){
  const n=Number(v)||0;
  try{return new Intl.NumberFormat('uk-UA',{style:'currency',currency,maximumFractionDigits:0}).format(n);}catch{return `${n} грн`;}
}
function statusLabel(v){return v==='draft'?'Чернетка':v==='archived'?'Архів':'Активна';}
function statusClass(v){return v==='draft'?'is-warn':v==='archived'?'is-gray':'';}
function cleanUrl(value){
  const url=String(value??'').trim();
  if(/^data:|^blob:/i.test(url))throw new Error('Для категорій не зберігаємо data:/blob: зображення. Використай URL або шлях до asset.');
  return url;
}
function mediaMap(state){return new Map((state.media||[]).map(m=>[m.id,m]));}
function categoryMedia(category,state){
  const media=mediaMap(state);
  return {
    primary:media.get(category?.imageMediaId)||null,
    secondary:media.get(category?.imageSecondaryMediaId)||null
  };
}
function ownedByCategory(media,categoryId){return media?.metadata?.source===OWNED_MEDIA_SOURCE&&media?.metadata?.ownerCategoryId===categoryId;}

function breadcrumb(category,state){
  if(!category)return '—';
  const map=new Map((state.categories||[]).map(c=>[c.id,c]));
  const names=[],seen=new Set();let cur=category;
  while(cur&&!seen.has(cur.id)){seen.add(cur.id);names.unshift(cur.name||'Без назви');cur=cur.parentId?map.get(cur.parentId):null;}
  return names.join(' → ');
}
function featureRangeText(category,state){
  const s=getMarketplaceCategoryStats01057(category,state);
  if(s.featureMin==null&&s.featureMax==null)return '';
  const range=s.featureMin===s.featureMax?`${s.featureMin}`:`${s.featureMin??'—'}–${s.featureMax??'—'}`;
  return `${range}${s.featureUnit?` ${s.featureUnit}`:''}`;
}


export class MarketplaceCategoryEditor01057{
  constructor({store,studio,activatePage}={}){
    if(!store)throw new Error('MarketplaceCategoryEditor01057 requires MarketplaceStore');
    this.store=store;this.studio=studio;this.activatePage=typeof activatePage==='function'?activatePage:()=>{};
    this.editor={open:false,mode:'create',categoryId:null,dirty:false,error:'',saving:false};
    this.filters={query:'',status:'',scope:''};
    this._bound=false;
  }

  init(){if(!this.studio)return this;this.installCategoryPage();this.bind();this.renderAll();return this;}

  installCategoryPage(){
    const page=this.studio.querySelector('[data-mp-page-view="categories"]');if(!page)return;
    page.dataset.mpCategoryEditorStage=STAGE;
    const head=page.querySelector('.mp-page-head');
    if(head){
      const p=head.querySelector('p');if(p)p.textContent='Реальний Category Editor поверх MarketplaceStore: дерево parent/child, контент, URL, зображення та автоматичні commerce-метрики.';
      const add=[...head.querySelectorAll('[data-mp-action],button')].find(b=>/додати категорію/i.test(b.textContent||''));
      if(add){add.removeAttribute('data-mp-action');add.setAttribute('data-mp-category-action','new');add.classList.add('mp-btn--primary');}
    }
    const old=page.querySelector('.mp-grid-2');if(old)old.remove();
    if(!page.querySelector('[data-mp-category-editor-host]')){
      head?.insertAdjacentHTML('afterend',`<div data-mp-category-editor-host></div>
        <div class="mp-toolbar mp-category-toolbar">
          <label class="mp-search">⌕<input data-mp-category-filter="query" placeholder="Пошук категорії за назвою, slug, URL…"></label>
          <select class="mp-select" data-mp-category-filter="status"><option value="">Усі статуси</option><option value="active">Активні</option><option value="draft">Чернетки</option><option value="archived">Архів</option></select>
          <select class="mp-select" data-mp-category-filter="scope"><option value="">Усе дерево</option><option value="root">Тільки головні</option><option value="child">Тільки дочірні</option></select>
          <button type="button" class="mp-btn mp-btn--primary mp-btn--small" data-mp-category-action="new">＋ Додати категорію</button>
        </div>
        <section class="mp-card mp-category-tree-card"><div class="mp-card__head"><div><div class="mp-card__title">Дерево категорій</div><div class="mp-card__hint">Вкладеність необмежена. Перенесення між батьківськими категоріями виконується через поле «Батьківська».</div></div><span class="mp-badge" data-mp-category-count>0</span></div><div class="mp-card__body"><div class="mp-category-tree--live" data-mp-category-tree-live></div></div></section>`);
    }
    this.installExternalEntryPoints();
  }

  installExternalEntryPoints(){
    const panel=document.getElementById('marketplace-panel-root');
    if(panel){
      const quick=panel.querySelector('.mp-inspector__quick [data-mp-page="categories"]');
      if(quick){quick.removeAttribute('data-mp-page');quick.setAttribute('data-mp-category-action','new');}
      panel.querySelectorAll('[data-mp-action]').forEach(b=>{
        if(/Категорії\s*·\s*\+ Додати категорію/i.test(b.getAttribute('data-mp-action')||'')){
          b.removeAttribute('data-mp-action');b.setAttribute('data-mp-category-action','new');const stub=b.querySelector('.mp-stub');if(stub)stub.remove();
        }
      });
      const acc=panel.querySelector('[data-mp-accordion="categories"] .mp-side-status');
      if(acc)acc.innerHTML='<span>Category Editor</span><b>CRUD LIVE · 01057</b>';
    }
  }

  bind(){
    if(this._bound)return;this._bound=true;
    document.addEventListener('click',e=>{
      const action=e.target.closest?.('[data-mp-category-action]');
      if(action){
        e.preventDefault();e.stopPropagation();const kind=action.getAttribute('data-mp-category-action');
        if(kind==='new')this.openNew();else if(kind==='edit')this.openEdit(action.getAttribute('data-mp-category-id'));else if(kind==='cancel')this.cancel();else if(kind==='save')this.save();else if(kind==='delete')this.deleteCurrent();return;
      }
      const row=e.target.closest?.('[data-mp-category-row]');
      if(row&&!e.target.closest('button,input,a,select,textarea'))this.openEdit(row.getAttribute('data-mp-category-row'));
    },true);
    this.studio.addEventListener('input',e=>{
      const filter=e.target.closest?.('[data-mp-category-filter]');if(filter){this.updateFilter(filter);return;}
      if(e.target.closest?.('[data-mp-category-form]')){
        this.editor.dirty=true;this.editor.error='';this.syncEditorStateBadge();
        if(e.target.matches('[name="slug"]'))e.target.dataset.mpSlugAuto='0';
        if(e.target.matches('[name="name"]'))this.maybeSuggestSlug(e.target);
        if(e.target.matches('[name="imageUrl"],[name="imageSecondaryUrl"]'))this.renderImagePreviewFromForm();
      }
    });
    this.studio.addEventListener('change',e=>{
      const filter=e.target.closest?.('[data-mp-category-filter]');if(filter){this.updateFilter(filter);return;}
      if(e.target.closest?.('[data-mp-category-form]')){this.editor.dirty=true;this.editor.error='';this.syncEditorStateBadge();}
    });
    this.studio.addEventListener('submit',e=>{if(e.target.closest?.('[data-mp-category-form]')){e.preventDefault();this.save();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.editor.open&&!this.editor.saving){e.preventDefault();this.cancel();}});
  }

  updateFilter(el){const key=el.getAttribute('data-mp-category-filter');this.filters[key]=String(el.value||'');this.renderTree();}
  confirmDiscard(){if(!this.editor.open||!this.editor.dirty||this.editor.saving)return true;return confirm('Є незбережені зміни категорії. Закрити редактор без збереження?');}

  openNew(){if(!this.confirmDiscard())return;this.activatePage('categories');this.editor={open:true,mode:'create',categoryId:null,dirty:false,error:'',saving:false};this.renderEditor();this.focusName();}
  openEdit(id){if(!id||!this.store.getCategory(id))return;if(this.editor.open&&this.editor.categoryId===id)return;if(!this.confirmDiscard())return;this.activatePage('categories');this.editor={open:true,mode:'edit',categoryId:id,dirty:false,error:'',saving:false};this.renderEditor();this.focusName();}
  cancel(){if(!this.confirmDiscard())return;this.editor={open:false,mode:'create',categoryId:null,dirty:false,error:'',saving:false};this.renderEditor();}
  focusName(){setTimeout(()=>this.studio.querySelector('[data-mp-category-form] [name="name"]')?.focus(),0);}

  formCategory(){
    if(this.editor.mode==='edit')return this.store.getCategory(this.editor.categoryId);
    return {id:'',parentId:null,status:'active',name:'',slug:'',shortDescription:'',description:'',imageMediaId:'',imageSecondaryMediaId:'',icon:'',attributes:{},featureKey:'',url:'',seo:{}};
  }

  renderAll(){this.installExternalEntryPoints();this.renderTree();if(!this.editor.saving)this.renderEditor();this.refreshFilterOptions();this.renderStageStatus();}

  renderStageStatus(){
    const panel=document.getElementById('marketplace-panel-root');
    const hero=panel?.querySelector('.mp-inspector__hero');
    if(hero){
      const eyebrow=hero.querySelector('.mp-inspector__eyebrow');if(eyebrow)eyebrow.textContent=`MARKETPLACE STUDIO · ${SHIFTTIME_BUILD_STAGE}`;
      const mode=hero.querySelector('.mp-inspector__mode');if(mode)mode.innerHTML='<span>MarketplaceStore → Repository</span><b class="mp-live-dot">PRODUCT + CATEGORY CRUD</b>';
      const sub=hero.querySelector('.mp-inspector__subtitle');if(sub)sub.textContent='Товари й категорії вже працюють через MarketplaceStore. Фізичне сховище лишається повністю ізольованим за Repository contract.';
    }
    const ctx=this.studio.querySelector('.mp-context');
    const stageMetric=ctx?.querySelector('[data-mp-system-metric="stage"]');
    const productMetric=ctx?.querySelector('[data-mp-system-metric="product-editor"]');
    const categoryMetric=ctx?.querySelector('[data-mp-system-metric="category-editor"]');
    const repositoryMetric=ctx?.querySelector('[data-mp-system-metric="repository"]');
    if(stageMetric)stageMetric.innerHTML=`<span>Studio stage</span><b>${SHIFTTIME_BUILD_STAGE}</b>`;
    if(productMetric)productMetric.innerHTML='<span>Product Editor</span><b>CRUD LIVE</b>';
    if(categoryMetric)categoryMetric.innerHTML='<span>Category Editor</span><b>CRUD LIVE</b>';
    if(repositoryMetric)repositoryMetric.innerHTML=`<span>Repository</span><b>${esc(this.store.getRepositoryInfo().type)}</b>`;
    const warn=ctx?.querySelector('.mp-context__notice.is-warn');
    if(warn)warn.innerHTML='Product + Category CRUD активні через <b>MarketplaceStore</b>. Наступний великий data-етап — Attributes / Variants / Filters.';
  }

  refreshFilterOptions(){
    const page=this.studio.querySelector('[data-mp-page-view="categories"]');if(!page)return;
    ['query','status','scope'].forEach(k=>{const el=page.querySelector(`[data-mp-category-filter="${k}"]`);if(el&&el.value!==this.filters[k])el.value=this.filters[k];});
  }

  filteredTree(){
    const state=this.store.getState(),q=this.filters.query.trim().toLocaleLowerCase('uk');
    let rows=getMarketplaceCategoryTree01057(state.categories||[]);
    if(this.filters.status)rows=rows.filter(x=>x.category.status===this.filters.status);
    if(this.filters.scope==='root')rows=rows.filter(x=>!x.category.parentId);
    if(this.filters.scope==='child')rows=rows.filter(x=>!!x.category.parentId);
    if(q)rows=rows.filter(x=>[x.category.name,x.category.slug,x.category.url,x.category.icon].some(v=>String(v||'').toLocaleLowerCase('uk').includes(q)));
    return {state,rows};
  }

  renderTree(){
    const page=this.studio.querySelector('[data-mp-page-view="categories"]');const host=page?.querySelector('[data-mp-category-tree-live]');if(!host)return;
    const {state,rows}=this.filteredTree();
    const media=mediaMap(state);const selected=this.editor.open&&this.editor.mode==='edit'?this.editor.categoryId:'';
    const count=page.querySelector('[data-mp-category-count]');if(count)count.textContent=`${rows.length} / ${(state.categories||[]).length}`;
    host.innerHTML=rows.length?rows.map(({category:c,depth,orphan})=>{
      const s=getMarketplaceCategoryStats01057(c,state),m=media.get(c.imageMediaId),range=featureRangeText(c,state),price=s.productsCount?(s.priceMin===s.priceMax?money(s.priceMin):`${money(s.priceMin)} – ${money(s.priceMax)}`):'без цін';
      return `<div class="mp-category-live-row ${selected===c.id?'is-selected':''} ${orphan?'is-orphan':''}" style="--mp-category-depth:${Math.min(depth,8)}" data-mp-category-row="${esc(c.id)}">
        <div class="mp-category-live-row__branch"><span class="mp-category-branch-line"></span><span class="mp-category-depth-dot"></span></div>
        <div class="mp-category-live-row__visual">${m?.url?`<img src="${esc(m.url)}" alt="">`:`<span>${esc(c.icon||'◫')}</span>`}</div>
        <div class="mp-category-live-row__main"><div class="mp-category-live-row__title">${esc(c.name||'Без назви')} <span class="mp-badge ${statusClass(c.status)}">${statusLabel(c.status)}</span></div><div class="mp-category-live-row__path">${esc(breadcrumb(c,state))}</div><div class="mp-category-live-row__meta">${s.productsCount} товарів · ${esc(price)}${range?` · ${esc(range)}`:''}</div></div>
        <div class="mp-category-live-row__stats"><b>${s.productsCount}</b><span>товарів</span><b>${s.childrenCount}</b><span>дочірніх</span></div>
        <button type="button" class="mp-btn mp-btn--small" data-mp-category-action="edit" data-mp-category-id="${esc(c.id)}">Редагувати</button>
      </div>`;
    }).join(''):`<div class="mp-data-empty"><b>${(state.categories||[]).length?'Нічого не знайдено':'Категорій ще немає'}</b><span>${(state.categories||[]).length?'Зміни пошук або фільтри.':'Створи першу категорію — вона одразу потрапить у MarketplaceStore.'}</span>${(state.categories||[]).length?'':'<button type="button" class="mp-btn mp-btn--primary" data-mp-category-action="new">＋ Додати категорію</button>'}</div>`;
  }

  editorHtml(category){
    const state=this.store.getState(),isEdit=this.editor.mode==='edit',stats=getMarketplaceCategoryStats01057(category,state),media=categoryMedia(category,state);
    const descendants=isEdit?getMarketplaceCategoryDescendantIds01057(state.categories||[],category.id):new Set();
    const parents=getMarketplaceCategoryTree01057(state.categories||[]).filter(({category:c})=>!isEdit||(c.id!==category.id&&!descendants.has(c.id)));
    const title=isEdit?`Редагування · ${category.name||'Без назви'}`:'Нова категорія';
    const featureRange=featureRangeText(category,state)||'—';
    return `<section class="mp-category-editor" data-mp-category-editor="${STAGE}">
      <div class="mp-category-editor__head"><div><div class="mp-category-editor__eyebrow">CATEGORY EDITOR · ${STAGE}</div><h2>${esc(title)}</h2><p>Category Editor → MarketplaceStore → MarketplaceRepository. Метрики товарів і цін обчислюються з реального каталогу, а не дублюються в сховищі.</p></div><div class="mp-category-editor__head-actions"><span class="mp-category-editor__state ${this.editor.dirty?'is-dirty':''}" data-mp-category-editor-state>${this.editor.dirty?'Є незбережені зміни':isEdit?'Збережена категорія':'Новий запис'}</span><button type="button" class="mp-icon-btn" data-mp-category-action="cancel" title="Закрити">×</button></div></div>
      ${this.editor.error?`<div class="mp-editor-error">${esc(this.editor.error)}</div>`:''}
      <form data-mp-category-form novalidate><div class="mp-category-editor__layout"><div class="mp-category-editor__main">
        <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Основні дані</div><div class="mp-card__hint">Назва, ієрархія, статус, slug, URL та іконка</div></div></div><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--category">
          <div class="mp-field is-wide"><label>Назва категорії *</label><input name="name" value="${esc(category.name||'')}" placeholder="Наприклад: Сковорідки" autocomplete="off"></div>
          <div class="mp-field"><label>Статус</label><select name="status"><option value="active" ${category.status==='active'?'selected':''}>Активна</option><option value="draft" ${category.status==='draft'?'selected':''}>Чернетка</option><option value="archived" ${category.status==='archived'?'selected':''}>Архів</option></select></div>
          <div class="mp-field"><label>Батьківська</label><select name="parentId"><option value="">— Коренева категорія —</option>${parents.map(({category:c,depth})=>`<option value="${esc(c.id)}" ${category.parentId===c.id?'selected':''}>${'— '.repeat(Math.min(depth,5))}${esc(c.name||'Без назви')}</option>`).join('')}</select></div>
          <div class="mp-field"><label>Slug *</label><input name="slug" value="${esc(category.slug||'')}" placeholder="skovoridky" data-mp-slug-auto="${(!category.slug||category.slug===slugify(category.name||''))?'1':'0'}"></div>
          <div class="mp-field"><label>URL</label><input name="url" value="${esc(category.url||'')}" placeholder="/catalog/skovoridky"></div>
          <div class="mp-field"><label>Іконка</label><input name="icon" value="${esc(category.icon||'')}" placeholder="◫ або назва/icon token"></div>
          <div class="mp-field"><label>Ключ основної характеристики</label><input name="featureKey" value="${esc(category.featureKey||'')}" placeholder="diameter"></div>
        </div></div></section>

        <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Опис категорії</div><div class="mp-card__hint">Контент зберігається в Category model і не залежить від конкретного шаблона Category Card</div></div></div><div class="mp-card__body"><div class="mp-form-grid"><div class="mp-field is-wide"><label>Короткий опис</label><textarea name="shortDescription" placeholder="Коротко для меню, карток і прев’ю…">${esc(category.shortDescription||'')}</textarea></div><div class="mp-field is-wide"><label>Повний опис</label><textarea class="mp-category-description" name="description" placeholder="Повний опис категорії…">${esc(category.description||'')}</textarea></div></div></div></section>

        <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Зображення категорії</div><div class="mp-card__hint">Категорія зберігає Media ID. Вибирай готове з Media Library або вкажи URL/asset path.</div></div><span class="mp-badge is-green">Media Library · 01059</span></div><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--category-media"><div class="mp-field"><label>Основне фото · URL / asset path</label><div class="mp-media-input-row"><input name="imageUrl" value="${esc(media.primary?.url||'')}" placeholder="assets/categories/pans.webp"><button type="button" class="mp-btn mp-btn--small" data-mp-media-action="pick-category-primary">▧ Вибрати</button></div></div><div class="mp-field"><label>Друге фото · URL / asset path</label><div class="mp-media-input-row"><input name="imageSecondaryUrl" value="${esc(media.secondary?.url||'')}" placeholder="assets/categories/pans-2.webp"><button type="button" class="mp-btn mp-btn--small" data-mp-media-action="pick-category-secondary">▧ Вибрати</button></div></div></div><div class="mp-category-image-preview" data-mp-category-image-preview></div></div></section>
      </div>

      <aside class="mp-category-editor__side">
        <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Автоматичні дані</div><div class="mp-card__hint">Живий розрахунок із Products</div></div><span class="mp-badge is-blue">COMPUTED</span></div><div class="mp-card__body"><div class="mp-category-metrics">
          <div><span>Товарів у гілці</span><b>${stats.productsCount}</b></div><div><span>Прямо в категорії</span><b>${stats.directProductsCount}</b></div><div><span>Дочірніх</span><b>${stats.childrenCount}</b></div><div><span>Ціна від</span><b>${stats.productsCount?money(stats.priceMin):'—'}</b></div><div><span>Ціна до</span><b>${stats.productsCount?money(stats.priceMax):'—'}</b></div><div><span>${esc(category.featureKey||'Характеристика')}</span><b>${esc(featureRange)}</b></div>
        </div><div class="mp-field-note">productsCount / priceMin / priceMax не записуються окремо. Вони завжди розраховуються з актуальних товарів цієї категорії та її дочірніх категорій.</div></div></section>

        <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Дані для Category Card</div><div class="mp-card__hint">Майбутній Commerce Binding Layer отримає ці значення без прив’язки до БД</div></div></div><div class="mp-card__body"><div class="mp-binding-preview"><code>category.name</code><b>${esc(category.name||'—')}</b><code>category.productsCount</code><b>${stats.productsCount}</b><code>category.priceMin</code><b>${stats.productsCount?money(stats.priceMin):'—'}</b><code>category.priceMax</code><b>${stats.productsCount?money(stats.priceMax):'—'}</b><code>category.attributes.${esc(category.featureKey||'feature')}</code><b>${esc(featureRange)}</b></div></div></section>

        <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Ієрархія</div><div class="mp-card__hint">Перевірка parent/child</div></div></div><div class="mp-card__body"><div class="mp-category-hierarchy"><span>Шлях</span><b>${esc(isEdit?breadcrumb(category,state):(category.parentId?breadcrumb(this.store.getCategory(category.parentId),state):'Нова коренева категорія'))}</b>${isEdit?`<span>ID</span><code>${esc(category.id)}</code>`:''}</div></div></section>

        <section class="mp-category-savebar"><div><b>${isEdit?'Зберегти категорію':'Створити категорію'}</b><span>${isEdit?'CRUD через store.updateCategory().':'Новий Category буде створений через store.createCategory().'}</span></div><div class="mp-category-savebar__actions">${isEdit?'<button type="button" class="mp-btn mp-btn--danger" data-mp-category-action="delete">Видалити</button>':''}<button type="button" class="mp-btn" data-mp-category-action="cancel">Скасувати</button><button type="button" class="mp-btn mp-btn--primary" data-mp-category-action="save">${this.editor.saving?'Збереження…':isEdit?'Зберегти':'Створити категорію'}</button></div></section>
      </aside></div></form>
    </section>`;
  }

  renderEditor(){
    const host=this.studio.querySelector('[data-mp-page-view="categories"] [data-mp-category-editor-host]');if(!host)return;
    if(!this.editor.open){host.innerHTML='';this.renderTree();return;}
    const category=this.formCategory();
    if(this.editor.mode==='edit'&&!category){this.editor={open:false,mode:'create',categoryId:null,dirty:false,error:'Категорія більше не існує',saving:false};host.innerHTML='';this.renderTree();return;}
    host.innerHTML=this.editorHtml(category);this.renderImagePreviewFromForm();this.renderTree();
  }

  syncEditorStateBadge(){const el=this.studio.querySelector('[data-mp-category-editor-state]');if(!el)return;el.classList.toggle('is-dirty',!!this.editor.dirty);el.textContent=this.editor.dirty?'Є незбережені зміни':this.editor.mode==='edit'?'Збережена категорія':'Новий запис';}
  maybeSuggestSlug(nameInput){const form=nameInput.closest('[data-mp-category-form]'),slug=form?.querySelector('[name="slug"]');if(!slug)return;if(slug.dataset.mpSlugAuto==='1'||!slug.value.trim()){slug.value=slugify(nameInput.value);slug.dataset.mpSlugAuto='1';}}

  renderImagePreviewFromForm(){
    const form=this.studio.querySelector('[data-mp-category-form]'),host=form?.querySelector('[data-mp-category-image-preview]');if(!host)return;
    const values=[['Основне',String(form.elements.imageUrl?.value||'').trim()],['Друге',String(form.elements.imageSecondaryUrl?.value||'').trim()]].filter(x=>x[1]&&!/^data:|^blob:/i.test(x[1]));
    host.innerHTML=values.length?values.map(([label,url])=>`<div class="mp-category-image-tile"><img src="${esc(url)}" alt=""><span>${label}</span></div>`).join(''):'<div class="mp-photo-empty">Додай URL або asset path — тут з’явиться прев’ю.</div>';
  }

  readForm(){
    const form=this.studio.querySelector('[data-mp-category-form]');if(!form)throw new Error('Category Editor form not found');
    const fd=new FormData(form),name=String(fd.get('name')||'').trim(),slug=String(fd.get('slug')||'').trim()||slugify(name),parentId=String(fd.get('parentId')||'').trim()||null;
    if(!name)throw new Error('Вкажи назву категорії.');if(!slug)throw new Error('Вкажи slug категорії.');
    const state=this.store.getState(),currentId=this.editor.mode==='edit'?this.editor.categoryId:'';
    if((state.categories||[]).some(c=>c.id!==currentId&&String(c.slug||'').toLowerCase()===slug.toLowerCase()))throw new Error(`Slug «${slug}» уже використовується іншою категорією.`);
    if(currentId&&parentId){const descendants=getMarketplaceCategoryDescendantIds01057(state.categories||[],currentId);if(parentId===currentId||descendants.has(parentId))throw new Error('Категорію не можна зробити дочірньою від самої себе або власного нащадка.');}
    return {payload:{name,slug,parentId,status:String(fd.get('status')||'active'),url:String(fd.get('url')||'').trim(),icon:String(fd.get('icon')||'').trim(),featureKey:String(fd.get('featureKey')||'').trim(),shortDescription:String(fd.get('shortDescription')||'').trim(),description:String(fd.get('description')||'').trim()},imageUrl:cleanUrl(fd.get('imageUrl')),imageSecondaryUrl:cleanUrl(fd.get('imageSecondaryUrl'))};
  }

  async ensureMedia(categoryId,url,currentMedia,role,alt){
    if(!url)return {id:'',createdId:'',removeId:ownedByCategory(currentMedia,categoryId)?currentMedia.id:''};
    if(currentMedia?.url===url)return {id:currentMedia.id,createdId:'',removeId:''};
    const library=(this.store.getState().media||[]).find(m=>m.url===url);
    if(library)return {id:library.id,createdId:'',removeId:ownedByCategory(currentMedia,categoryId)?currentMedia.id:''};
    const media=await this.store.createMedia({kind:'image',url,alt,metadata:{source:OWNED_MEDIA_SOURCE,ownerCategoryId:categoryId,role}});
    return {id:media.id,createdId:media.id,removeId:ownedByCategory(currentMedia,categoryId)?currentMedia.id:''};
  }

  async save(){
    if(this.editor.saving)return;this.editor.error='';let values;
    try{values=this.readForm();}catch(err){this.editor.error=err?.message||String(err);this.renderEditor();return;}
    this.editor.saving=true;this.renderEditor();let createdCategoryId='',createdMedia=[];
    try{
      if(this.editor.mode==='create'){
        const category=await this.store.createCategory({...values.payload,imageMediaId:'',imageSecondaryMediaId:''});createdCategoryId=category.id;
        const p=await this.ensureMedia(category.id,values.imageUrl,null,'primary',values.payload.name);if(p.createdId)createdMedia.push(p.createdId);
        const s=await this.ensureMedia(category.id,values.imageSecondaryUrl,null,'secondary',values.payload.name);if(s.createdId)createdMedia.push(s.createdId);
        if(p.id||s.id)await this.store.updateCategory(category.id,{imageMediaId:p.id,imageSecondaryMediaId:s.id});
        this.toast(`Категорію «${values.payload.name}» створено через MarketplaceStore`);
      }else{
        const current=this.store.getCategory(this.editor.categoryId);if(!current)throw new Error('Категорія більше не існує.');
        const currentMedia=categoryMedia(current,this.store.getState());
        const p=await this.ensureMedia(current.id,values.imageUrl,currentMedia.primary,'primary',values.payload.name);if(p.createdId)createdMedia.push(p.createdId);
        const s=await this.ensureMedia(current.id,values.imageSecondaryUrl,currentMedia.secondary,'secondary',values.payload.name);if(s.createdId)createdMedia.push(s.createdId);
        await this.store.updateCategory(current.id,{...values.payload,imageMediaId:p.id,imageSecondaryMediaId:s.id});
        // 01059: detached Media IDs remain in Media Library; safe deletion is usage-aware there.
        this.toast(`Категорію «${values.payload.name}» збережено`);
      }
      this.editor={open:false,mode:'create',categoryId:null,dirty:false,error:'',saving:false};this.renderAll();
    }catch(err){
      for(const id of createdMedia){try{await this.store.deleteMedia(id);}catch{}}
      if(createdCategoryId){try{await this.store.deleteCategory(createdCategoryId);}catch{}}
      this.editor.saving=false;this.editor.error=err?.message||String(err);this.renderEditor();console.error('[MarketplaceCategoryEditor01057] save failed',err);
    }
  }

  async deleteCurrent(){
    if(this.editor.mode!=='edit'||!this.editor.categoryId||this.editor.saving)return;
    const category=this.store.getCategory(this.editor.categoryId);if(!category)return;
    const state=this.store.getState(),children=(state.categories||[]).filter(c=>c.parentId===category.id),directProducts=(state.products||[]).filter(p=>(p.categoryIds||[]).includes(category.id));
    if(children.length||directProducts.length){
      this.editor.error=`Безпечне видалення заблоковано: ${children.length} дочірніх категорій, ${directProducts.length} товарів напряму прив’язані до цієї категорії. Спочатку перепризнач їх, щоб не залишити «сиріт» у MarketplaceStore.`;this.renderEditor();return;
    }
    if(!confirm(`Видалити порожню категорію «${category.name||category.id}» через MarketplaceRepository?`))return;
    this.editor.saving=true;this.renderEditor();
    try{
      await this.store.deleteCategory(category.id);
      // 01059: category deletion only detaches references. Media Library performs safe usage-aware deletion.
      this.editor={open:false,mode:'create',categoryId:null,dirty:false,error:'',saving:false};this.toast(`Категорію «${category.name}» видалено`);this.renderAll();
    }catch(err){this.editor.saving=false;this.editor.error=err?.message||String(err);this.renderEditor();}
  }

  getCategoryBindingData(id){const state=this.store.getState();return getMarketplaceCategoryBindingData01057((state.categories||[]).find(c=>c.id===id)||null,state);}

  toast(message){
    let el=document.getElementById('mp-category-toast-01057');if(!el){el=document.createElement('div');el.id='mp-category-toast-01057';el.className='mp-toast mp-category-toast';document.body.appendChild(el);}
    el.innerHTML=`<b>Marketplace Category Editor</b>${esc(message)}`;el.classList.add('is-show');clearTimeout(this.toast._t);this.toast._t=setTimeout(()=>el.classList.remove('is-show'),2600);
  }
}

export function initMarketplaceCategoryEditor01057(options){return new MarketplaceCategoryEditor01057(options).init();}

