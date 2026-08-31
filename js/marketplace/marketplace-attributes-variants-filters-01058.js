// 01058 · Attributes / Variants / Filters editor.
// All writes go through MarketplaceStore and its repository contract.
import {
  getMarketplaceAttributeValues01058,
  getMarketplaceAttributeUsage01058,
  getMarketplaceFilterDerivedData01058,
  getMarketplaceFilterPreview01058,
  getMarketplaceProductVariants01058,
  getMarketplaceVariantOptionAttributes01058
} from './data/marketplace-attribute-selectors-01058.js?v=01058';
import { createMarketplaceAttributeVariantFilterService01058 } from './services/marketplace-attribute-variant-filter-service-01058.js?v=01058';

const STAGE='01058';
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function str(v){return String(v??'').trim();}
function arr(v){return Array.isArray(v)?v:[];}
function money(v,c='UAH'){const n=Number(v)||0;try{return new Intl.NumberFormat('uk-UA',{style:'currency',currency:c,maximumFractionDigits:2}).format(n);}catch{return `${n} грн`;}}
function typeLabel(t){return ({'number-unit':'Число + одиниця',number:'Число',list:'Список',color:'Колір / swatch',text:'Текст',boolean:'Так / Ні'})[t]||t||'Текст';}
function filterTypeLabel(t){return ({range:'Діапазон',options:'Варіанти',swatches:'Кольори',toggle:'Перемикач'})[t]||t;}
function statusLabel(t){return t==='draft'?'Чернетка':t==='archived'?'Архів':'Активна';}
function availabilityLabel(t){return t==='preorder'?'Передзамовлення':t==='out-of-stock'?'Немає':'В наявності';}
function controlForAttribute(a,value,values){
  const name=`attr:${a.key}`;const val=value??'';
  if(a.type==='list'||a.type==='color')return `<select class="mp-select" name="${esc(name)}"><option value="">— Не задано —</option>${values.map(v=>`<option value="${esc(v.value)}" ${String(val)===String(v.value)?'selected':''}>${a.type==='color'&&v.color?'● ':''}${esc(v.label||v.value)}</option>`).join('')}</select>`;
  if(a.type==='boolean')return `<select class="mp-select" name="${esc(name)}"><option value="">— Не задано —</option><option value="true" ${val===true||val==='true'?'selected':''}>Так</option><option value="false" ${val===false||val==='false'?'selected':''}>Ні</option></select>`;
  return `<div class="mp-avf-inline-input"><input name="${esc(name)}" type="${a.type==='number'||a.type==='number-unit'?'number':'text'}" step="any" value="${esc(val)}" placeholder="${a.type==='number-unit'?'0':''}">${a.unit?`<span>${esc(a.unit)}</span>`:''}</div>`;
}

export class MarketplaceAttributesVariantsFilters01058 {
  constructor({store,studio,activatePage}={}){
    if(!store)throw new Error('MarketplaceStore required');
    this.store=store;this.studio=studio;this.activatePage=typeof activatePage==='function'?activatePage:()=>{};
    this.service=createMarketplaceAttributeVariantFilterService01058(store);
    this.attribute={open:false,id:null,error:'',dirty:false,saving:false};
    this.attrFilters={query:'',type:'',mode:''};
    this.variants={productId:'',error:'',saving:false};
    this.filter={open:false,id:null,error:'',dirty:false,saving:false};
    this._bound=false;this._filterSyncing=false;
  }

  init(){
    if(!this.studio)return this;
    this.installPages();this.installExternalEntryPoints();this.bind();this.renderAll();
    queueMicrotask(()=>this.ensureFilters().catch(err=>console.warn('[01058] initial filter sync failed',err)));
    return this;
  }

  installPages(){
    const a=this.studio.querySelector('[data-mp-page-view="attributes"]');
    if(a){a.dataset.mpAvfStage=STAGE;const head=a.querySelector('.mp-page-head');head?.insertAdjacentHTML('afterend','<div data-mp-attributes-host></div>');[...a.children].forEach(ch=>{if(ch!==head&&!ch.matches('[data-mp-attributes-host]'))ch.remove();});}
    const v=this.studio.querySelector('[data-mp-page-view="variants"]');
    if(v){v.dataset.mpAvfStage=STAGE;const head=v.querySelector('.mp-page-head');head?.insertAdjacentHTML('afterend','<div data-mp-variants-host></div>');[...v.children].forEach(ch=>{if(ch!==head&&!ch.matches('[data-mp-variants-host]'))ch.remove();});}
    const f=this.studio.querySelector('[data-mp-page-view="filters"]');
    if(f){f.dataset.mpAvfStage=STAGE;const head=f.querySelector('.mp-page-head');head?.insertAdjacentHTML('afterend','<div data-mp-filters-host></div>');[...f.children].forEach(ch=>{if(ch!==head&&!ch.matches('[data-mp-filters-host]'))ch.remove();});}
    this.rewireHeadActions(a,'attributes');this.rewireHeadActions(v,'variants');this.rewireHeadActions(f,'filters');
  }

  rewireHeadActions(page,type){
    const buttons=page?.querySelectorAll('.mp-page-head button')||[];
    buttons.forEach(b=>{
      const txt=str(b.textContent);
      if(type==='attributes'&&/\+\s*Характеристика/i.test(txt)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='new-attribute';b.classList.add('mp-btn--primary');}
      if(type==='attributes'&&/Імпорт словника/i.test(txt)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='common-attributes';b.textContent='Базовий набір';}
      if(type==='variants'&&/\+\s*Набір варіацій/i.test(txt)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='focus-variant-builder';b.classList.add('mp-btn--primary');}
      if(type==='variants'&&/Пресети варіацій/i.test(txt)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='goto-attributes';b.textContent='Option-характеристики';}
      if(type==='filters'&&/\+\s*Фільтр/i.test(txt)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='new-filter';b.classList.add('mp-btn--primary');}
      if(type==='filters'&&/Порядок/i.test(txt)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='sync-filters';b.textContent='Синхронізувати';}
    });
    const p=page?.querySelector('.mp-page-head p');
    if(type==='attributes'&&p)p.textContent='Єдиний словник характеристик і значень. Product/Variant/Filter працюють із тими самими Attribute records через MarketplaceStore.';
    if(type==='variants'&&p)p.textContent='Реальні option-комбінації для товару: кожна варіація має власні SKU, ціну, залишок і availability.';
    if(type==='filters'&&p)p.textContent='Filter records зберігають тільки конфігурацію. Значення, swatches і min/max обчислюються з Product.attributes та Variant.options.';
  }

  installExternalEntryPoints(){
    const panel=document.getElementById('marketplace-panel-root');if(!panel)return;
    const map={attributes:'Attributes LIVE · 01058',variants:'Variants LIVE · 01058',filters:'Facets LIVE · 01058'};
    for(const [key,label] of Object.entries(map)){
      const status=panel.querySelector(`[data-mp-accordion="${key}"] .mp-side-status`);if(status)status.innerHTML=`<span>${key==='filters'?'Derived filters':'MarketplaceStore CRUD'}</span><b>${label}</b>`;
    }
    panel.querySelectorAll('[data-mp-accordion="attributes"] [data-mp-action]').forEach(b=>{const t=str(b.textContent);if(/Характеристика/.test(t)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='new-attribute';b.querySelector('.mp-stub')?.remove();}});
    panel.querySelectorAll('[data-mp-accordion="variants"] [data-mp-action]').forEach(b=>{const t=str(b.textContent);if(/Набір варіацій/.test(t)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='focus-variant-builder';b.querySelector('.mp-stub')?.remove();}});
    panel.querySelectorAll('[data-mp-accordion="filters"] [data-mp-action]').forEach(b=>{const t=str(b.textContent);if(/\+ Фільтр/.test(t)){b.removeAttribute('data-mp-action');b.dataset.mpAvfAction='new-filter';b.querySelector('.mp-stub')?.remove();}});
  }

  bind(){
    if(this._bound)return;this._bound=true;
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('[data-mp-avf-action]');if(!b)return;
      e.preventDefault();e.stopPropagation();this.action(b.dataset.mpAvfAction,b).catch(err=>this.fail(err));
    },true);
    this.studio.addEventListener('input',e=>{
      const f=e.target.closest?.('[data-mp-attr-filter]');if(f){this.attrFilters[f.dataset.mpAttrFilter]=str(f.value);this.applyAttributeFilters();return;}
      if(e.target.closest('[data-mp-attribute-form]')){this.attribute.dirty=true;this.syncAttributeBadge();}
      if(e.target.closest('[data-mp-filter-form]')){this.filter.dirty=true;this.syncFilterBadge();}
    });
    this.studio.addEventListener('change',e=>{
      const attrFilter=e.target.closest?.('[data-mp-attr-filter]');if(attrFilter){this.attrFilters[attrFilter.dataset.mpAttrFilter]=str(attrFilter.value);this.applyAttributeFilters();return;}
      if(e.target.matches('[data-mp-variant-product]')){this.variants.productId=str(e.target.value);this.renderVariants();return;}
      if(e.target.closest('[data-mp-attribute-form]')){this.attribute.dirty=true;this.syncAttributeBadge();}
      if(e.target.closest('[data-mp-filter-form]')){this.filter.dirty=true;this.syncFilterBadge();}
    });
    this.studio.addEventListener('submit',e=>{
      if(e.target.matches('[data-mp-attribute-form]')){e.preventDefault();this.saveAttribute();}
      if(e.target.matches('[data-mp-product-attributes-form]')){e.preventDefault();this.saveProductAttributes();}
      if(e.target.matches('[data-mp-filter-form]')){e.preventDefault();this.saveFilter();}
    });
  }

  async action(kind,b){
    if(kind==='new-attribute'){this.activatePage('attributes');this.attribute={open:true,id:null,error:'',dirty:false,saving:false};this.renderAttributes();return;}
    if(kind==='edit-attribute'){this.activatePage('attributes');this.attribute={open:true,id:b.dataset.id,error:'',dirty:false,saving:false};this.renderAttributes();return;}
    if(kind==='cancel-attribute'){this.attribute={open:false,id:null,error:'',dirty:false,saving:false};this.renderAttributes();return;}
    if(kind==='save-attribute'){await this.saveAttribute();return;}
    if(kind==='delete-attribute'){await this.deleteAttribute();return;}
    if(kind==='add-attribute-value'){this.appendAttributeValueRow();return;}
    if(kind==='remove-attribute-value'){b.closest('[data-mp-attribute-value-row]')?.remove();this.attribute.dirty=true;this.syncAttributeBadge();return;}
    if(kind==='common-attributes'){if(!confirm('Додати базовий універсальний набір: Діаметр, Товщина, Колір, Розмір, Матеріал, Об’єм? Існуючі key не дублюються.'))return;await this.service.installCommonAttributes();this.toast('Базовий набір характеристик готовий');this.renderAll();return;}
    if(kind==='goto-attributes'){this.activatePage('attributes');return;}
    if(kind==='focus-variant-builder'){this.activatePage('variants');this.renderVariants();this.studio.querySelector('[data-mp-variant-builder]')?.scrollIntoView?.({block:'start',behavior:'smooth'});return;}
    if(kind==='save-product-attributes'){await this.saveProductAttributes();return;}
    if(kind==='generate-variants'){await this.generateVariants();return;}
    if(kind==='save-variant'){await this.saveVariantRow(b.closest('[data-mp-variant-row]'));return;}
    if(kind==='delete-variant'){await this.deleteVariantRow(b.closest('[data-mp-variant-row]'));return;}
    if(kind==='sync-filters'){await this.ensureFilters(true);return;}
    if(kind==='new-filter'){this.activatePage('filters');this.filter={open:true,id:null,error:'',dirty:false,saving:false};this.renderFilters();return;}
    if(kind==='edit-filter'){this.activatePage('filters');this.filter={open:true,id:b.dataset.id,error:'',dirty:false,saving:false};this.renderFilters();return;}
    if(kind==='cancel-filter'){this.filter={open:false,id:null,error:'',dirty:false,saving:false};this.renderFilters();return;}
    if(kind==='save-filter'){await this.saveFilter();return;}
    if(kind==='delete-filter'){await this.deleteFilter();return;}
  }

  renderAll(){this.renderAttributes();this.renderVariants();this.renderFilters();this.patchContext();}

  patchContext(){
    const ctx=this.studio.querySelector('.mp-context');if(!ctx)return;
    const notices=ctx.querySelectorAll('.mp-context__notice');
    const warn=[...notices].find(n=>n.classList.contains('is-warn'));
    if(warn)warn.innerHTML='<b>01058 LIVE:</b> Attribute, AttributeValue, Variant і Filter уже проходять через MarketplaceStore. Facet values/ranges не дублюються — вони derived.';
  }

  // ---------- Attributes ----------
  filteredAttributes(state){
    const q=this.attrFilters.query.toLowerCase(),type=this.attrFilters.type,mode=this.attrFilters.mode;
    return arr(state.attributes).filter(a=>(!q||`${a.name} ${a.key} ${a.unit}`.toLowerCase().includes(q))&&(!type||a.type===type)&&(!mode||(mode==='filter'&&a.filterable)||(mode==='variant'&&a.variantOption)||(mode==='required'&&a.required))).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||str(a.name).localeCompare(str(b.name),'uk'));
  }

  renderAttributes(){
    const host=this.studio.querySelector('[data-mp-attributes-host]');if(!host)return;
    const state=this.store.getState(),list=arr(state.attributes).slice().sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||str(a.name).localeCompare(str(b.name),'uk'));
    host.innerHTML=`${this.attribute.open?this.attributeEditorHtml(state):''}
      <div class="mp-toolbar mp-avf-toolbar">
        <label class="mp-search">⌕<input data-mp-attr-filter="query" value="${esc(this.attrFilters.query)}" placeholder="Назва, key, одиниця…"></label>
        <select class="mp-select" data-mp-attr-filter="type"><option value="">Усі типи</option>${['number-unit','number','list','color','text','boolean'].map(t=>`<option value="${t}" ${this.attrFilters.type===t?'selected':''}>${typeLabel(t)}</option>`).join('')}</select>
        <select class="mp-select" data-mp-attr-filter="mode"><option value="">Усі режими</option><option value="filter" ${this.attrFilters.mode==='filter'?'selected':''}>Фільтруються</option><option value="variant" ${this.attrFilters.mode==='variant'?'selected':''}>Option варіацій</option><option value="required" ${this.attrFilters.mode==='required'?'selected':''}>Обов’язкові</option></select>
        <button class="mp-btn mp-btn--small" data-mp-avf-action="common-attributes">Базовий набір</button><button class="mp-btn mp-btn--primary mp-btn--small" data-mp-avf-action="new-attribute">＋ Характеристика</button>
      </div>
      <div class="mp-table-wrap"><table class="mp-table mp-avf-table"><thead><tr><th>Характеристика</th><th>Тип</th><th>Словник</th><th>Використання</th><th>Фільтр</th><th>Варіація</th><th>Дії</th></tr></thead><tbody>${list.length?list.map(a=>this.attributeRowHtml(a,state)).join(''):`<tr><td colspan="7"><div class="mp-data-empty"><b>Характеристик ще немає</b><span>Створи вручну або натисни «Базовий набір» для Діаметр / Товщина / Колір / Розмір / Матеріал / Об’єм.</span></div></td></tr>`}</tbody></table></div>`;
    this.applyAttributeFilters();
  }

  applyAttributeFilters(){
    const host=this.studio.querySelector('[data-mp-attributes-host]');if(!host)return;
    const q=this.attrFilters.query.toLowerCase(),type=this.attrFilters.type,mode=this.attrFilters.mode;let visible=0;
    host.querySelectorAll('[data-mp-attribute-row]').forEach(row=>{
      const ok=(!q||String(row.dataset.search||'').includes(q))&&(!type||row.dataset.type===type)&&(!mode||String(row.dataset.modes||'').split(',').includes(mode));
      row.hidden=!ok;if(ok)visible++;
    });
    let empty=host.querySelector('[data-mp-attribute-filter-empty]');
    if(!visible&&host.querySelector('[data-mp-attribute-row]')){
      if(!empty){empty=document.createElement('div');empty.dataset.mpAttributeFilterEmpty='1';empty.className='mp-data-empty mp-avf-filter-empty';empty.innerHTML='<b>Нічого не знайдено</b><span>Зміни пошук або фільтри характеристик.</span>';host.querySelector('.mp-table-wrap')?.insertAdjacentElement('afterend',empty);}
      empty.hidden=false;
    }else if(empty)empty.hidden=true;
  }

  attributeRowHtml(a,state){
    const values=getMarketplaceAttributeValues01058(state,a.id),usage=getMarketplaceAttributeUsage01058(state,a);
    const search=esc(`${a.name||''} ${a.key||''} ${a.unit||''}`.toLowerCase()),modes=[a.filterable?'filter':'',a.variantOption?'variant':'',a.required?'required':''].filter(Boolean).join(',');
    return `<tr data-mp-attribute-row data-search="${search}" data-type="${esc(a.type||'')}" data-modes="${esc(modes)}"><td><div class="mp-avf-name"><b>${esc(a.name||'Без назви')}</b><code>product.attributes.${esc(a.key)}</code>${a.unit?`<small>${esc(a.unit)}</small>`:''}</div></td><td><span class="mp-badge is-gray">${esc(typeLabel(a.type))}</span></td><td><b>${values.length}</b> знач.</td><td><span>${usage.products.length} товарів</span><br><small>${usage.variants.length} варіацій</small></td><td><span class="mp-chip ${a.filterable?'is-green':''}">${a.filterable?'Так':'Ні'}</span></td><td><span class="mp-chip ${a.variantOption?'is-purple':''}">${a.variantOption?'Так':'Ні'}</span></td><td><button class="mp-btn mp-btn--small" data-mp-avf-action="edit-attribute" data-id="${esc(a.id)}">Налаштувати</button></td></tr>`;
  }

  attributeEditorHtml(state){
    const a=this.attribute.id?this.store.getAttribute(this.attribute.id):null,values=a?getMarketplaceAttributeValues01058(state,a.id):[],isEdit=!!a;
    return `<section class="mp-avf-editor" data-mp-attribute-editor><div class="mp-avf-editor__head"><div><div class="mp-avf-eyebrow">ATTRIBUTE EDITOR · ${STAGE}</div><h2>${isEdit?'Редагування характеристики':'Нова характеристика'}</h2><p>Один Attribute використовується Product Editor, Variant generator і Filter builder. Key — стабільний commerce-контракт.</p></div><span class="mp-avf-state ${this.attribute.dirty?'is-dirty':''}" data-mp-attribute-state>${this.attribute.dirty?'Є незбережені зміни':isEdit?'Збережено':'Новий запис'}</span></div>
      <form data-mp-attribute-form><div class="mp-avf-editor__grid"><div class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Основні дані</div></div><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--avf">
        <div class="mp-field"><label>Назва *</label><input name="name" value="${esc(a?.name||'')}" placeholder="Напр. Діаметр"></div>
        <div class="mp-field"><label>Key *</label><input name="key" value="${esc(a?.key||'')}" placeholder="diameter"></div>
        <div class="mp-field"><label>Тип</label><select class="mp-select" name="type">${['number-unit','number','list','color','text','boolean'].map(t=>`<option value="${t}" ${a?.type===t||(!a&&t==='text')?'selected':''}>${typeLabel(t)}</option>`).join('')}</select></div>
        <div class="mp-field"><label>Одиниця</label><input name="unit" value="${esc(a?.unit||'')}" placeholder="см / мм / л"></div>
        <div class="mp-field"><label>Порядок</label><input type="number" name="sortOrder" value="${Number(a?.sortOrder)||0}"></div>
        <label class="mp-avf-check"><input type="checkbox" name="filterable" ${a?.filterable!==false?'checked':''}><span><b>Будувати фільтр</b><small>Facet config автоматично посилається на цей Attribute</small></span></label>
        <label class="mp-avf-check"><input type="checkbox" name="variantOption" ${a?.variantOption?'checked':''}><span><b>Option варіацій</b><small>Розмір / колір / комплектація для генератора SKU</small></span></label>
        <label class="mp-avf-check"><input type="checkbox" name="required" ${a?.required?'checked':''}><span><b>Обов’язкова</b><small>Позначка domain requirement для майбутньої validation</small></span></label>
      </div></div></div>
      <div class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Словник значень</div><div class="mp-card__hint">Для list/color/variant option. Product і Variant зберігають canonical value, а label/color живуть тут.</div></div><button type="button" class="mp-btn mp-btn--small" data-mp-avf-action="add-attribute-value">＋ Значення</button></div><div class="mp-card__body"><div data-mp-attribute-values class="mp-avf-values">${values.length?values.map((v,i)=>this.attributeValueRowHtml(v,i)).join(''):'<div class="mp-data-empty mp-avf-values-empty"><b>Словник порожній</b><span>Для числових характеристик це нормально. Для Розміру/Кольору додай значення.</span></div>'}</div></div></div></div>
      ${this.attribute.error?`<div class="mp-editor-error">${esc(this.attribute.error)}</div>`:''}
      <div class="mp-avf-savebar">${isEdit?'<button type="button" class="mp-btn mp-btn--danger" data-mp-avf-action="delete-attribute">Видалити</button>':''}<span></span><button type="button" class="mp-btn" data-mp-avf-action="cancel-attribute">Скасувати</button><button type="submit" class="mp-btn mp-btn--primary">${this.attribute.saving?'Збереження…':isEdit?'Зберегти':'Створити'}</button></div></form></section>`;
  }

  attributeValueRowHtml(v={},i=0){return `<div class="mp-avf-value-row" data-mp-attribute-value-row><input type="hidden" name="valueId" value="${esc(v.id||'')}"><span class="mp-avf-value-index">${i+1}</span><input name="valueLabel" value="${esc(v.label||'')}" placeholder="Назва: Чорний / XL"><input name="valueValue" value="${esc(v.value||'')}" placeholder="value: black / xl"><input name="valueSlug" value="${esc(v.slug||'')}" placeholder="slug"><label class="mp-avf-color"><input type="color" name="valueColor" value="${/^#[0-9a-f]{6}$/i.test(v.color||'')?v.color:'#ffffff'}"><span>Колір</span></label><button type="button" class="mp-btn mp-btn--small mp-btn--danger" data-mp-avf-action="remove-attribute-value">×</button></div>`;}

  appendAttributeValueRow(){const host=this.studio.querySelector('[data-mp-attribute-values]');if(!host)return;host.querySelector('.mp-avf-values-empty')?.remove();const wrap=document.createElement('div');wrap.innerHTML=this.attributeValueRowHtml({},host.querySelectorAll('[data-mp-attribute-value-row]').length);host.appendChild(wrap.firstElementChild);this.attribute.dirty=true;this.syncAttributeBadge();}
  syncAttributeBadge(){const b=this.studio.querySelector('[data-mp-attribute-state]');if(b){b.classList.toggle('is-dirty',this.attribute.dirty);b.textContent=this.attribute.dirty?'Є незбережені зміни':this.attribute.id?'Збережено':'Новий запис';}}

  readAttributeForm(){
    const form=this.studio.querySelector('[data-mp-attribute-form]');if(!form)throw new Error('Attribute form not found');const fd=new FormData(form);
    const input={name:str(fd.get('name')),key:str(fd.get('key')),type:str(fd.get('type'))||'text',unit:str(fd.get('unit')),sortOrder:Number(fd.get('sortOrder'))||0,filterable:fd.get('filterable')==='on',variantOption:fd.get('variantOption')==='on',required:fd.get('required')==='on'};
    const values=[...form.querySelectorAll('[data-mp-attribute-value-row]')].map(row=>({id:str(row.querySelector('[name="valueId"]')?.value),label:str(row.querySelector('[name="valueLabel"]')?.value),value:str(row.querySelector('[name="valueValue"]')?.value),slug:str(row.querySelector('[name="valueSlug"]')?.value),color:str(row.querySelector('[name="valueColor"]')?.value)})).filter(v=>v.label||v.value);
    return {input,values};
  }

  async saveAttribute(){if(this.attribute.saving)return;this.attribute.saving=true;this.attribute.error='';try{const {input,values}=this.readAttributeForm();await this.service.saveAttribute(input,{id:this.attribute.id||'',values});this.attribute={open:false,id:null,error:'',dirty:false,saving:false};this.toast('Характеристику збережено через MarketplaceStore');this.renderAll();}catch(err){this.attribute.saving=false;this.attribute.error=err?.message||String(err);this.renderAttributes();}}
  async deleteAttribute(){const id=this.attribute.id;if(!id)return;const a=this.store.getAttribute(id);if(!a)return;if(!confirm(`Видалити характеристику «${a.name}»? Використовувані характеристики система не дозволить видалити.`))return;try{await this.service.deleteAttribute(id);this.attribute={open:false,id:null,error:'',dirty:false,saving:false};this.toast('Характеристику видалено');this.renderAll();}catch(err){this.attribute.error=err?.message||String(err);this.renderAttributes();}}

  // ---------- Product attributes + variants ----------
  selectedProduct(state){
    const products=arr(state.products).filter(p=>p.status!=='archived');if(!products.length)return null;
    let p=products.find(x=>x.id===this.variants.productId);if(!p){p=products[0];this.variants.productId=p.id;}return p;
  }

  renderVariants(){
    const host=this.studio.querySelector('[data-mp-variants-host]');if(!host)return;const state=this.store.getState(),products=arr(state.products).filter(p=>p.status!=='archived'),product=this.selectedProduct(state),variants=product?getMarketplaceProductVariants01058(state,product.id):[],optionAttrs=getMarketplaceVariantOptionAttributes01058(state);
    host.innerHTML=`<div class="mp-avf-product-switch"><label><span>Товар для характеристик/варіацій</span><select class="mp-select" data-mp-variant-product>${products.length?products.map(p=>`<option value="${esc(p.id)}" ${p.id===product?.id?'selected':''}>${esc(p.name||p.sku||p.id)} · ${esc(p.sku||'без SKU')}</option>`).join(''):'<option value="">Спочатку створи товар</option>'}</select></label><div><b>${variants.length}</b><span>варіацій</span></div></div>
      ${this.variants.error?`<div class="mp-editor-error">${esc(this.variants.error)}</div>`:''}
      ${!product?`<div class="mp-data-empty mp-avf-empty-main"><b>Немає товарів</b><span>Створи товар у Product Editor 01053, після цього тут з’являться характеристики й генератор варіацій.</span></div>`:`<div class="mp-avf-variant-layout">
        <div class="mp-avf-stack">${this.productAttributesHtml(product,state)}${this.variantBuilderHtml(product,state,optionAttrs)}</div>
        <div class="mp-avf-stack">${this.variantTableHtml(product,state,variants)}</div>
      </div>`}`;
  }

  productAttributesHtml(product,state){
    const attrs=arr(state.attributes).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||str(a.name).localeCompare(str(b.name),'uk'));
    return `<section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Характеристики товару</div><div class="mp-card__hint">Записуються в product.attributes через store.updateProduct(). Саме звідси фільтри беруть фактичні значення.</div></div><span class="mp-badge">${attrs.length}</span></div><div class="mp-card__body"><form data-mp-product-attributes-form>${attrs.length?`<div class="mp-avf-attribute-assignment">${attrs.map(a=>`<label class="mp-avf-assignment-field"><span><b>${esc(a.name)}</b>${a.required?'<em>*</em>':''}<small>${esc(a.key)}${a.unit?` · ${esc(a.unit)}`:''}</small></span>${controlForAttribute(a,product.attributes?.[a.key],getMarketplaceAttributeValues01058(state,a.id))}</label>`).join('')}</div><div class="mp-avf-form-actions"><button type="submit" class="mp-btn mp-btn--primary" data-mp-avf-action="save-product-attributes">Зберегти характеристики</button></div>`:'<div class="mp-data-empty"><b>Словник порожній</b><span>Перейди в «Характеристики» та створи поля або базовий набір.</span></div>'}</form></div></section>`;
  }

  variantBuilderHtml(product,state,attrs){
    const existing=getMarketplaceProductVariants01058(state,product.id),used=new Map();existing.forEach(v=>Object.entries(v.options||{}).forEach(([k,val])=>{if(!used.has(k))used.set(k,new Set());used.get(k).add(String(val));}));
    return `<section class="mp-card" data-mp-variant-builder><div class="mp-card__head"><div><div class="mp-card__title">Генератор комбінацій</div><div class="mp-card__hint">Вибери значення option-характеристик. Генератор створить тільки відсутні комбінації та не дублює наявні.</div></div><span class="mp-badge is-purple">SKU</span></div><div class="mp-card__body">${attrs.length?`<div class="mp-avf-option-groups">${attrs.map(a=>{const values=getMarketplaceAttributeValues01058(state,a.id);return `<fieldset class="mp-avf-option-group"><legend>${esc(a.name)} <code>${esc(a.key)}</code></legend>${values.length?`<div class="mp-avf-option-values">${values.map(v=>`<label class="mp-avf-option-value"><input type="checkbox" data-mp-variant-option="${esc(a.key)}" value="${esc(v.value)}" ${used.get(a.key)?.has(String(v.value))?'checked':''}><span>${a.type==='color'&&v.color?`<i style="--sw:${esc(v.color)}"></i>`:''}${esc(v.label||v.value)}</span></label>`).join('')}</div>`:'<div class="mp-card__hint">Немає словника значень — додай його в Attribute Editor.</div>'}</fieldset>`;}).join('')}</div><div class="mp-avf-form-actions"><button type="button" class="mp-btn mp-btn--primary" data-mp-avf-action="generate-variants">Генерувати відсутні комбінації</button><span>Ліміт 160 комбінацій за один запуск</span></div>`:'<div class="mp-data-empty"><b>Немає option-характеристик</b><span>Для «Розмір» або «Колір» увімкни прапорець «Option варіацій».</span></div>'}</div></section>`;
  }

  variantTableHtml(product,state,variants){
    const attrs=new Map(arr(state.attributes).map(a=>[a.key,a]));
    return `<section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Варіації товару</div><div class="mp-card__hint">Кожен Variant — окремий repository record. Product.variantIds синхронізується після create/delete.</div></div><span class="mp-badge ${variants.length?'is-green':'is-gray'}">${variants.length} SKU</span></div><div class="mp-card__body mp-avf-variant-table-wrap">${variants.length?`<table class="mp-table mp-avf-variant-table"><thead><tr><th>Options</th><th>SKU</th><th>Ціна</th><th>Стара</th><th>Stock</th><th>Наявність</th><th>Статус</th><th>Дії</th></tr></thead><tbody>${variants.map(v=>`<tr data-mp-variant-row data-id="${esc(v.id)}"><td><div class="mp-avf-combo">${Object.entries(v.options||{}).map(([k,val])=>{const a=attrs.get(k),dict=a?getMarketplaceAttributeValues01058(state,a.id).find(x=>String(x.value)===String(val)):null;return `<span>${esc(a?.name||k)}: <b>${esc(dict?.label||val)}</b></span>`;}).join('')||'<span>Без options</span>'}</div></td><td><input data-field="sku" value="${esc(v.sku)}"></td><td><input data-field="price" type="number" min="0" step="0.01" value="${Number(v.price)||0}"></td><td><input data-field="oldPrice" type="number" min="0" step="0.01" value="${Number(v.oldPrice)||0}"></td><td><input data-field="stock" type="number" min="0" step="1" value="${Number(v.stock)||0}"></td><td><select data-field="availability" class="mp-select">${['in-stock','out-of-stock','preorder'].map(x=>`<option value="${x}" ${v.availability===x?'selected':''}>${availabilityLabel(x)}</option>`).join('')}</select></td><td><select data-field="status" class="mp-select">${['active','draft','archived'].map(x=>`<option value="${x}" ${v.status===x?'selected':''}>${statusLabel(x)}</option>`).join('')}</select></td><td><div class="mp-avf-row-actions"><button class="mp-btn mp-btn--small" data-mp-avf-action="save-variant">Зберегти</button><button class="mp-btn mp-btn--small mp-btn--danger" data-mp-avf-action="delete-variant">×</button></div></td></tr>`).join('')}</tbody></table>`:'<div class="mp-data-empty"><b>Варіацій ще немає</b><span>Вибери option-значення зліва і натисни «Генерувати».</span></div>'}</div></section>`;
  }

  async saveProductAttributes(){
    const state=this.store.getState(),product=this.selectedProduct(state);if(!product)return;const form=this.studio.querySelector('[data-mp-product-attributes-form]');if(!form)return;const values={};for(const a of arr(state.attributes)){const el=form.elements[`attr:${a.key}`];if(el)values[a.key]=el.value;}
    try{await this.service.setProductAttributes(product.id,values);this.variants.error='';this.toast('Характеристики товару збережено');this.renderAll();}catch(err){this.variants.error=err?.message||String(err);this.renderVariants();}
  }

  async generateVariants(){
    const state=this.store.getState(),product=this.selectedProduct(state);if(!product)return;const selections={};this.studio.querySelectorAll('[data-mp-variant-option]:checked').forEach(el=>{const key=el.dataset.mpVariantOption;if(!selections[key])selections[key]=[];selections[key].push(el.value);});
    this.variants.saving=true;this.variants.error='';try{const result=await this.service.generateVariants(product.id,selections);this.toast(`Створено ${result.created.length}; всього ${result.total} варіацій`);this.variants.saving=false;this.renderAll();}catch(err){this.variants.saving=false;this.variants.error=err?.message||String(err);this.renderVariants();}
  }

  async saveVariantRow(row){if(!row)return;const patch={};row.querySelectorAll('[data-field]').forEach(el=>patch[el.dataset.field]=el.value);try{await this.service.updateVariant(row.dataset.id,patch);this.variants.error='';this.toast('Варіацію збережено');this.renderAll();}catch(err){this.variants.error=err?.message||String(err);this.renderVariants();}}
  async deleteVariantRow(row){if(!row)return;const v=this.store.getVariant(row.dataset.id);if(!v)return;if(!confirm(`Видалити варіацію ${v.sku}?`))return;try{await this.service.deleteVariant(v.id);this.toast('Варіацію видалено');this.renderAll();}catch(err){this.variants.error=err?.message||String(err);this.renderVariants();}}

  // ---------- Filters ----------
  async ensureFilters(showToast=false){if(this._filterSyncing)return;this._filterSyncing=true;try{await this.service.syncAutoFilters();if(showToast)this.toast('Фільтри синхронізовано з filterable-характеристиками');}finally{this._filterSyncing=false;this.renderFilters();}}

  renderFilters(){
    const host=this.studio.querySelector('[data-mp-filters-host]');if(!host)return;const state=this.store.getState(),filters=arr(state.filters).slice().sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||str(a.name).localeCompare(str(b.name),'uk'));
    host.innerHTML=`${this.filter.open?this.filterEditorHtml(state):''}<div class="mp-avf-filter-summary"><div><b>${filters.filter(f=>f.enabled!==false).length}</b><span>активних filters</span></div><div><b>${arr(state.attributes).filter(a=>a.filterable).length}</b><span>filterable attributes</span></div><div><b>${filters.reduce((n,f)=>n+getMarketplaceFilterDerivedData01058(f,state).values.length,0)}</b><span>derived option values</span></div><button class="mp-btn" data-mp-avf-action="sync-filters">↻ Синхронізувати</button><button class="mp-btn mp-btn--primary" data-mp-avf-action="new-filter">＋ Фільтр</button></div>
      <div class="mp-table-wrap"><table class="mp-table mp-avf-filter-table"><thead><tr><th>Фільтр</th><th>Джерело</th><th>Тип</th><th>Категорії</th><th>Derived значення</th><th>Стан</th><th>Дії</th></tr></thead><tbody>${filters.length?filters.map(f=>this.filterRowHtml(f,state)).join(''):`<tr><td colspan="7"><div class="mp-data-empty"><b>Фільтрів ще немає</b><span>Познач Attribute як «Будувати фільтр» і натисни «Синхронізувати».</span></div></td></tr>`}</tbody></table></div>`;
  }

  filterRowHtml(f,state){
    const d=getMarketplaceFilterDerivedData01058(f,state),preview=getMarketplaceFilterPreview01058(f,state),cats=new Map(arr(state.categories).map(c=>[c.id,c.name]));
    return `<tr><td><div class="mp-avf-name"><b>${esc(f.name||f.key)}</b><code>${esc(f.key)}</code></div></td><td>${d.attribute?`<b>${esc(d.attribute.name)}</b><br><small>${esc(d.attribute.key)}</small>`:'<span class="mp-badge is-warn">Missing attribute</span>'}</td><td><span class="mp-badge is-gray">${esc(filterTypeLabel(f.type))}</span></td><td>${arr(f.categoryIds).length?arr(f.categoryIds).map(id=>esc(cats.get(id)||id)).join(', '):'<span class="mp-chip is-green">Усі</span>'}</td><td><div class="mp-avf-filter-preview">${esc(preview)}<small>${d.productsCount} товарів у scope</small></div></td><td><span class="mp-badge ${f.enabled!==false?'is-green':'is-gray'}">${f.enabled!==false?'ACTIVE':'OFF'}</span></td><td><button class="mp-btn mp-btn--small" data-mp-avf-action="edit-filter" data-id="${esc(f.id)}">Налаштувати</button></td></tr>`;
  }

  filterEditorHtml(state){
    const f=this.filter.id?this.store.getFilter(this.filter.id):null,isEdit=!!f,attributes=arr(state.attributes).filter(a=>a.filterable||a.id===f?.attributeId),categories=arr(state.categories).slice().sort((a,b)=>str(a.name).localeCompare(str(b.name),'uk'));
    return `<section class="mp-avf-editor mp-avf-filter-editor"><div class="mp-avf-editor__head"><div><div class="mp-avf-eyebrow">FILTER CONFIG · ${STAGE}</div><h2>${isEdit?'Налаштування фільтра':'Новий filter config'}</h2><p>Filter не копіює значення товарів. Він лише посилається на Attribute та задає UI/scope; facets обчислюються live.</p></div><span class="mp-avf-state ${this.filter.dirty?'is-dirty':''}" data-mp-filter-state>${this.filter.dirty?'Є незбережені зміни':isEdit?'Збережено':'Новий запис'}</span></div><form data-mp-filter-form><div class="mp-avf-editor__grid"><div class="mp-card"><div class="mp-card__head"><div class="mp-card__title">Конфігурація</div></div><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--avf"><div class="mp-field"><label>Характеристика *</label><select class="mp-select" name="attributeId"><option value="">— Вибери —</option>${attributes.map(a=>`<option value="${esc(a.id)}" ${a.id===f?.attributeId?'selected':''}>${esc(a.name)} · ${esc(a.key)}</option>`).join('')}</select></div><div class="mp-field"><label>Назва фільтра</label><input name="name" value="${esc(f?.name||'')}" placeholder="Напр. Діаметр"></div><div class="mp-field"><label>Тип UI</label><select class="mp-select" name="type">${['options','range','swatches','toggle'].map(t=>`<option value="${t}" ${f?.type===t?'selected':''}>${filterTypeLabel(t)}</option>`).join('')}</select></div><div class="mp-field"><label>Порядок</label><input type="number" name="sortOrder" value="${Number(f?.sortOrder)||0}"></div><label class="mp-avf-check"><input type="checkbox" name="enabled" ${f?.enabled!==false?'checked':''}><span><b>Увімкнений</b><small>Показувати facet у каталозі</small></span></label></div></div></div><div class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Scope категорій</div><div class="mp-card__hint">Якщо нічого не вибрано — фільтр глобальний. Дочірні категорії враховуються автоматично.</div></div></div><div class="mp-card__body"><div class="mp-avf-category-scope">${categories.length?categories.map(c=>`<label><input type="checkbox" name="categoryIds" value="${esc(c.id)}" ${arr(f?.categoryIds).includes(c.id)?'checked':''}><span>${esc(c.name)}</span></label>`).join(''):'<span class="mp-card__hint">Категорій ще немає.</span>'}</div></div></div></div>${this.filter.error?`<div class="mp-editor-error">${esc(this.filter.error)}</div>`:''}<div class="mp-avf-savebar">${isEdit?'<button type="button" class="mp-btn mp-btn--danger" data-mp-avf-action="delete-filter">Видалити config</button>':''}<span></span><button type="button" class="mp-btn" data-mp-avf-action="cancel-filter">Скасувати</button><button type="submit" class="mp-btn mp-btn--primary">${this.filter.saving?'Збереження…':isEdit?'Зберегти':'Створити'}</button></div></form></section>`;
  }
  syncFilterBadge(){const b=this.studio.querySelector('[data-mp-filter-state]');if(b){b.classList.toggle('is-dirty',this.filter.dirty);b.textContent=this.filter.dirty?'Є незбережені зміни':this.filter.id?'Збережено':'Новий запис';}}
  readFilterForm(){const form=this.studio.querySelector('[data-mp-filter-form]');if(!form)throw new Error('Filter form not found');const fd=new FormData(form);return {attributeId:str(fd.get('attributeId')),name:str(fd.get('name')),type:str(fd.get('type')),sortOrder:Number(fd.get('sortOrder'))||0,enabled:fd.get('enabled')==='on',categoryIds:fd.getAll('categoryIds').map(str).filter(Boolean)};}
  async saveFilter(){if(this.filter.saving)return;this.filter.saving=true;this.filter.error='';try{const patch=this.readFilterForm();await this.service.saveFilter(this.filter.id||'',patch);this.filter={open:false,id:null,error:'',dirty:false,saving:false};this.toast('Filter config збережено');this.renderFilters();}catch(err){this.filter.saving=false;this.filter.error=err?.message||String(err);this.renderFilters();}}
  async deleteFilter(){const id=this.filter.id;if(!id)return;const f=this.store.getFilter(id);if(!f)return;if(!confirm(`Видалити filter config «${f.name}»? Attribute і дані товарів залишаться.`))return;try{await this.store.deleteFilter(id);this.filter={open:false,id:null,error:'',dirty:false,saving:false};this.toast('Filter config видалено');this.renderFilters();}catch(err){this.filter.error=err?.message||String(err);this.renderFilters();}}

  fail(err){console.error('[MarketplaceAVF01058]',err);this.toast(`Помилка: ${err?.message||err}`);}
  toast(message){let el=document.getElementById('mp-avf-toast-01058');if(!el){el=document.createElement('div');el.id='mp-avf-toast-01058';el.className='mp-toast mp-avf-toast';document.body.appendChild(el);}el.innerHTML=`<b>Marketplace 01058</b>${esc(message)}`;el.classList.add('is-show');clearTimeout(this.toast._t);this.toast._t=setTimeout(()=>el.classList.remove('is-show'),2600);}
}

export function initMarketplaceAttributesVariantsFilters01058(options){return new MarketplaceAttributesVariantsFilters01058(options).init();}
