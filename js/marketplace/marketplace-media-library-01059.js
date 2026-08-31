// 01059 · Marketplace Media Library UI.
// UI -> MarketplaceMediaService -> MarketplaceStore / MediaAssetRepository contracts.
import {
  getMarketplaceMediaUsage01059,
  getMarketplaceMediaStats01059,
  getMarketplaceMediaBindingData01059
} from './data/marketplace-media-selectors-01059.js?v=01059';

const STAGE='01059';
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function str(v){return String(v??'').trim();}
function arr(v){return Array.isArray(v)?v:[];}
function normalizedUrl(v){return str(v).replace(/\\/g,'/');}
function kindLabel(v){return v==='video'?'Відео':v==='document'?'Документ':'Зображення';}
function kindIcon(v){return v==='video'?'▶':v==='document'?'DOC':'IMG';}
function usageLabel(u){return u.type==='product'?'Товар':u.type==='category'?'Категорія':u.type==='variant'?'Варіація':u.type==='collection'?'Колекція':u.type==='attributeValue'?'Значення':'SEO';}

export class MarketplaceMediaLibrary01059{
  constructor({store,studio,service,activatePage}={}){
    if(!store||!service)throw new Error('MarketplaceMediaLibrary01059 requires Store and MediaService');
    this.store=store;this.studio=studio;this.service=service;this.activatePage=typeof activatePage==='function'?activatePage:()=>{};
    this.filters={query:'',kind:'',state:''};
    this.editor={open:false,id:null,dirty:false,saving:false,error:''};
    this.picker=null;this._bound=false;
  }
  init(){if(!this.studio)return this;this.installPage();this.bind();this.renderAll();return this;}

  installPage(){
    const page=this.studio.querySelector('[data-mp-page-view="media"]');if(!page)return;
    page.dataset.mpMediaLibraryStage=STAGE;
    page.innerHTML=`<div class="mp-page-head"><div><h1>▧ Медіатека</h1><p>Єдина бібліотека Media ID для товарів, категорій, варіацій та майбутніх frontend-компонентів. Фізичне сховище ізольоване MediaAssetRepository contract.</p></div><div class="mp-page-actions"><button type="button" class="mp-btn" data-mp-media-action="fill-alt">ALT · автозаповнення</button><button type="button" class="mp-btn mp-btn--primary" data-mp-media-action="new">＋ Додати медіа</button></div></div>
      <div data-mp-media-editor-host></div>
      <div class="mp-media-stats" data-mp-media-stats></div>
      <div class="mp-toolbar mp-media-toolbar">
        <label class="mp-search">⌕<input data-mp-media-filter="query" placeholder="Пошук за файлом, URL, ALT, тегом…"></label>
        <select class="mp-select" data-mp-media-filter="kind"><option value="">Усі типи</option><option value="image">Зображення</option><option value="video">Відео</option><option value="document">Документи</option></select>
        <select class="mp-select" data-mp-media-filter="state"><option value="">Будь-який стан</option><option value="used">Використовуються</option><option value="unused">Не використовуються</option><option value="missing-alt">Без ALT</option><option value="duplicates">Дублікати URL</option></select>
        <button type="button" class="mp-btn mp-btn--small" data-mp-media-action="clear-filters">Скинути фільтри</button>
      </div>
      <div class="mp-media-grid" data-mp-media-grid></div>`;
    this.installInspectorEntries();
  }

  installInspectorEntries(){
    const panel=document.getElementById('marketplace-panel-root');if(!panel)return;
    panel.querySelectorAll('[data-mp-action]').forEach(b=>{
      const a=b.getAttribute('data-mp-action')||'';
      if(/Медіатека\s*·\s*Завантажити медіа/i.test(a)){b.removeAttribute('data-mp-action');b.setAttribute('data-mp-media-action','new');b.innerHTML='Додати медіа';}
      if(/Медіатека\s*·\s*Перевірити ALT/i.test(a)){b.removeAttribute('data-mp-action');b.setAttribute('data-mp-media-action','missing-alt');b.innerHTML='Перевірити ALT';}
      if(/Медіатека\s*·\s*Дублікати/i.test(a)){b.removeAttribute('data-mp-action');b.setAttribute('data-mp-media-action','duplicates');b.innerHTML='Дублікати';}
    });
    const status=panel.querySelector('[data-mp-accordion="media"] .mp-side-status');if(status)status.innerHTML='<span>Media Library</span><b>LIVE · 01059</b>';
  }

  bind(){
    if(this._bound)return;this._bound=true;
    const handleClick=e=>{
      const btn=e.target.closest?.('[data-mp-media-action]');if(!btn)return;
      e.preventDefault();e.stopPropagation();const action=btn.dataset.mpMediaAction;
      if(action==='new')return this.openNew();
      if(action==='edit')return this.openEdit(btn.dataset.id);
      if(action==='cancel')return this.closeEditor();
      if(action==='delete')return this.deleteCurrent();
      if(action==='fill-alt')return this.fillAlt();
      if(action==='missing-alt'){this.activatePage('media');this.filters.state='missing-alt';return this.renderAll();}
      if(action==='duplicates'){this.activatePage('media');this.filters.state='duplicates';return this.renderAll();}
      if(action==='clear-filters'||action==='filter-all'){this.filters={query:'',kind:'',state:''};return this.renderAll();}
      if(action==='filter-image'){this.filters.kind='image';this.filters.state='';return this.renderAll();}
      if(action==='filter-used'){this.filters.state='used';return this.renderAll();}
      if(action==='pick-product')return this.pickForProduct();
      if(action==='pick-category-primary')return this.pickForCategory('imageUrl');
      if(action==='pick-category-secondary')return this.pickForCategory('imageSecondaryUrl');
      if(action==='picker-toggle')return this.togglePicker(btn.dataset.id);
      if(action==='picker-cancel')return this.closePicker();
      if(action==='picker-confirm')return this.confirmPicker();
    };
    this.studio.addEventListener('click',handleClick);
    document.getElementById('marketplace-panel-root')?.addEventListener('click',handleClick);
    document.addEventListener('click',e=>{if(e.target.closest?.('[data-mp-media-picker]'))handleClick(e);});
    this.studio.addEventListener('input',e=>{
      const f=e.target.closest?.('[data-mp-media-filter]');if(f){this.filters[f.dataset.mpMediaFilter]=f.value;this.renderLibrary();return;}
      if(e.target.closest?.('[data-mp-media-form]')){this.editor.dirty=true;this.editor.error='';this.syncEditorBadge();this.renderEditorPreview();}
    });
    this.studio.addEventListener('change',e=>{
      const f=e.target.closest?.('[data-mp-media-filter]');if(f){this.filters[f.dataset.mpMediaFilter]=f.value;this.renderLibrary();}
      if(e.target.closest?.('[data-mp-media-form]')){this.editor.dirty=true;this.syncEditorBadge();this.renderEditorPreview();}
    });
    this.studio.addEventListener('submit',e=>{if(e.target.matches?.('[data-mp-media-form]')){e.preventDefault();this.save();}});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&this.picker){e.preventDefault();this.closePicker();}else if(e.key==='Escape'&&this.editor.open){e.preventDefault();this.closeEditor();}});
  }

  renderAll(){this.renderStats();this.renderLibrary();if(this.editor.open&&!this.editor.dirty)this.renderEditor();}
  renderStats(){
    const host=this.studio.querySelector('[data-mp-media-stats]');if(!host)return;const s=getMarketplaceMediaStats01059(this.store.getState()),repo=this.service.getAssetRepositoryInfo();
    host.innerHTML=`<button type="button" class="mp-media-stat" data-mp-media-action="filter-all"><b>${s.total}</b><span>Усього Media</span></button><button type="button" class="mp-media-stat" data-mp-media-action="filter-image"><b>${s.images}</b><span>Зображень</span></button><button type="button" class="mp-media-stat ${s.missingAlt?'is-warn':''}" data-mp-media-action="missing-alt"><b>${s.missingAlt}</b><span>Без ALT</span></button><button type="button" class="mp-media-stat" data-mp-media-action="filter-used"><b>${s.used}</b><span>Використовуються</span></button><button type="button" class="mp-media-stat ${s.duplicateRecords?'is-warn':''}" data-mp-media-action="duplicates"><b>${s.duplicateRecords}</b><span>Дублікатів</span></button><div class="mp-media-adapter"><span>MediaAssetRepository</span><b>${esc(repo.name||repo.type)}</b><small>${repo.upload?'Upload ready':'URL / assets зараз · R2/S3 потім'}</small></div>`;
  }

  filteredItems(){
    const state=this.store.getState(),media=arr(state.media),usage=new Map(media.map(m=>[m.id,getMarketplaceMediaUsage01059(m.id,state)])),counts=new Map();
    media.forEach(m=>{const u=normalizedUrl(m.url);if(u)counts.set(u,(counts.get(u)||0)+1);});
    const q=str(this.filters.query).toLowerCase();
    return media.filter(m=>{
      if(this.filters.kind&&m.kind!==this.filters.kind)return false;
      const u=usage.get(m.id)||[];
      if(this.filters.state==='used'&&!u.length)return false;
      if(this.filters.state==='unused'&&u.length)return false;
      if(this.filters.state==='missing-alt'&&(m.kind!=='image'||str(m.alt)))return false;
      if(this.filters.state==='duplicates'&&(counts.get(normalizedUrl(m.url))||0)<2)return false;
      if(q){const hay=[m.fileName,m.url,m.alt,m.mime,m.metadata?.folder,...arr(m.metadata?.tags),...u.map(x=>x.label)].join(' ').toLowerCase();if(!hay.includes(q))return false;}
      return true;
    }).sort((a,b)=>(Number(a.sortOrder)||0)-(Number(b.sortOrder)||0)||String(a.fileName||a.url).localeCompare(String(b.fileName||b.url),'uk'));
  }

  renderLibrary(){
    const host=this.studio.querySelector('[data-mp-media-grid]');if(!host)return;
    const q=this.studio.querySelector('[data-mp-media-filter="query"]'),k=this.studio.querySelector('[data-mp-media-filter="kind"]'),s=this.studio.querySelector('[data-mp-media-filter="state"]');if(q)q.value=this.filters.query;if(k)k.value=this.filters.kind;if(s)s.value=this.filters.state;
    const state=this.store.getState(),items=this.filteredItems();
    host.innerHTML=items.length?items.map(m=>this.cardHtml(m,state)).join(''):`<div class="mp-data-empty mp-media-empty"><b>${state.media?.length?'Нічого не знайдено':'Медіатека поки порожня'}</b><span>${state.media?.length?'Зміни фільтри або пошук.':'Перетягни файли у drop-зону, вибери їх з комп’ютера або додай URL/assets вручну. Product/Category Editor використовують Media ID.'}</span>${state.media?.length?'':'<button type="button" class="mp-btn mp-btn--primary" data-mp-media-action="new">＋ Додати перше медіа</button>'}</div>`;
  }

  cardHtml(m,state){
    const usage=getMarketplaceMediaUsage01059(m.id,state),tags=arr(m.metadata?.tags);const dims=Number(m.width)&&Number(m.height)?`${m.width}×${m.height}`:'Розмір —';
    return `<article class="mp-media-card" data-media-id="${esc(m.id)}"><div class="mp-media-card__preview">${m.kind==='image'?`<img src="${esc(m.url)}" alt="${esc(m.alt||'')}" loading="lazy">`:`<div class="mp-media-kind-icon">${kindIcon(m.kind)}</div>`}<span class="mp-media-kind">${kindLabel(m.kind)}</span></div><div class="mp-media-card__body"><div class="mp-media-card__name" title="${esc(m.fileName||m.url)}">${esc(m.fileName||m.url||'Без назви')}</div><div class="mp-media-card__meta"><span>${esc(dims)}</span><span>${usage.length} використань</span></div><div class="mp-media-alt ${m.kind==='image'&&!str(m.alt)?'is-missing':''}">${m.kind==='image'?(str(m.alt)?`ALT: ${esc(m.alt)}`:'ALT відсутній'):`${esc(m.mime||kindLabel(m.kind))}`}</div>${tags.length?`<div class="mp-media-tags">${tags.slice(0,4).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}<div class="mp-media-usage">${usage.slice(0,2).map(u=>`<span>${usageLabel(u)} · ${esc(u.label)}</span>`).join('')}${usage.length>2?`<small>+${usage.length-2} ще</small>`:''}</div><div class="mp-media-card__actions"><button type="button" class="mp-btn mp-btn--small" data-mp-media-action="edit" data-id="${esc(m.id)}">Редагувати</button></div></div></article>`;
  }

  openNew(){this.activatePage('media');this.editor={open:true,id:null,dirty:false,saving:false,error:''};this.renderEditor();setTimeout(()=>this.studio.querySelector('[data-mp-media-form] [name="url"]')?.focus(),0);}
  openEdit(id){if(!this.store.getMediaItem(id))return;this.activatePage('media');this.editor={open:true,id,dirty:false,saving:false,error:''};this.renderEditor();}
  closeEditor(){if(this.editor.dirty&&!confirm('Закрити Media Editor і відкинути незбережені зміни?'))return;this.editor={open:false,id:null,dirty:false,saving:false,error:''};const h=this.studio.querySelector('[data-mp-media-editor-host]');if(h)h.innerHTML='';}

  renderEditor(){
    const host=this.studio.querySelector('[data-mp-media-editor-host]');if(!host||!this.editor.open)return;const m=this.editor.id?this.store.getMediaItem(this.editor.id):null;if(this.editor.id&&!m){this.editor={open:false,id:null,dirty:false,saving:false,error:'',};host.innerHTML='';return;}
    const x=m||{kind:'image',url:'',alt:'',width:0,height:0,mime:'',fileName:'',sortOrder:0,metadata:{}};const repo=this.service.getAssetRepositoryInfo();
    host.innerHTML=`<section class="mp-media-editor"><div class="mp-media-editor__head"><div><div class="mp-media-eyebrow">MEDIA EDITOR · ${STAGE}</div><h2>${m?'Редагування медіа':'Нове медіа'}</h2><p>Commerce state зберігає тільки Media metadata та URL/path. Binary-файл не потрапляє в MarketplaceStore.</p></div><span class="mp-media-editor-state ${this.editor.dirty?'is-dirty':''}" data-mp-media-editor-state>${this.editor.dirty?'Є незбережені зміни':m?'Збережено':'Новий запис'}</span></div><form data-mp-media-form novalidate><div class="mp-media-editor__layout"><div class="mp-card"><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--media"><div class="mp-field"><label>Тип</label><select name="kind"><option value="image" ${x.kind==='image'?'selected':''}>Зображення</option><option value="video" ${x.kind==='video'?'selected':''}>Відео</option><option value="document" ${x.kind==='document'?'selected':''}>Документ</option></select></div><div class="mp-field is-wide"><label>URL або asset path *</label><input name="url" value="${esc(x.url)}" placeholder="assets/products/photo.webp або https://cdn.example.com/photo.webp"></div><div class="mp-field"><label>Назва файлу</label><input name="fileName" value="${esc(x.fileName)}" placeholder="photo.webp"></div><div class="mp-field"><label>MIME</label><input name="mime" value="${esc(x.mime)}" placeholder="image/webp"></div><div class="mp-field is-wide"><label>ALT</label><input name="alt" value="${esc(x.alt)}" placeholder="Опис зображення для SEO та accessibility"></div><div class="mp-field"><label>Ширина, px</label><input type="number" min="0" name="width" value="${Number(x.width)||0}"></div><div class="mp-field"><label>Висота, px</label><input type="number" min="0" name="height" value="${Number(x.height)||0}"></div><div class="mp-field"><label>Порядок</label><input type="number" name="sortOrder" value="${Number(x.sortOrder)||0}"></div><div class="mp-field"><label>Папка / група</label><input name="folder" value="${esc(x.metadata?.folder||'')}" placeholder="products / categories"></div><div class="mp-field is-wide"><label>Теги через кому</label><input name="tags" value="${esc(arr(x.metadata?.tags).join(', '))}" placeholder="сковорідки, lifestyle, hero"></div></div><div class="mp-media-adapter-note"><b>${esc(repo.name)}</b><span>${repo.upload?'Підтримує upload':'Поточний adapter реєструє існуючі URL/assets. R2/S3 потім підключиться через той самий contract.'}</span></div></div></div><aside class="mp-card mp-media-editor-preview-card"><div class="mp-card__head"><div class="mp-card__title">Preview</div></div><div class="mp-card__body"><div data-mp-media-editor-preview></div>${m?this.usageHtml(m):'<div class="mp-card__hint">Після створення тут з’явиться інформація про використання Media ID.</div>'}</div></aside></div>${this.editor.error?`<div class="mp-editor-error">${esc(this.editor.error)}</div>`:''}<div class="mp-avf-savebar">${m?'<button type="button" class="mp-btn mp-btn--danger" data-mp-media-action="delete">Видалити</button>':''}<span></span><button type="button" class="mp-btn" data-mp-media-action="cancel">Скасувати</button><button type="submit" class="mp-btn mp-btn--primary">${this.editor.saving?'Збереження…':m?'Зберегти':'Створити'}</button></div></form></section>`;
    this.renderEditorPreview();
  }

  usageHtml(m){const usage=getMarketplaceMediaUsage01059(m.id,this.store.getState());return `<div class="mp-media-editor-usage"><b>Використання · ${usage.length}</b>${usage.length?usage.map(u=>`<div><span>${usageLabel(u)}</span><strong>${esc(u.label)}</strong><small>${esc(u.role||'')}</small></div>`).join(''):'<p>Media ID ніде не використовується — запис можна безпечно видалити.</p>'}</div>`;}
  syncEditorBadge(){const b=this.studio.querySelector('[data-mp-media-editor-state]');if(b){b.classList.toggle('is-dirty',this.editor.dirty);b.textContent=this.editor.dirty?'Є незбережені зміни':this.editor.id?'Збережено':'Новий запис';}}
  renderEditorPreview(){const form=this.studio.querySelector('[data-mp-media-form]'),host=form?.querySelector('[data-mp-media-editor-preview]');if(!host)return;const url=str(form.elements.url?.value),kind=str(form.elements.kind?.value)||'image';host.innerHTML=url?(kind==='image'?`<div class="mp-media-editor-preview"><img src="${esc(url)}" alt=""></div>`:`<div class="mp-media-editor-preview is-file"><b>${kindIcon(kind)}</b><span>${esc(url)}</span></div>`):'<div class="mp-photo-empty">Вкажи URL/path для preview.</div>';}
  readForm(){const form=this.studio.querySelector('[data-mp-media-form]');if(!form)throw new Error('Media form not found');const fd=new FormData(form),url=str(fd.get('url'));if(!url)throw new Error('Вкажи URL або шлях до asset.');return {kind:str(fd.get('kind'))||'image',url,fileName:str(fd.get('fileName')),mime:str(fd.get('mime')),alt:str(fd.get('alt')),width:Number(fd.get('width'))||0,height:Number(fd.get('height'))||0,sortOrder:Number(fd.get('sortOrder'))||0,folder:str(fd.get('folder')),tags:str(fd.get('tags'))};}
  async save(){if(this.editor.saving)return;let values;try{values=this.readForm();}catch(err){this.editor.error=err.message;this.renderEditor();return;}this.editor.saving=true;this.editor.error='';this.renderEditor();try{if(this.editor.id){await this.service.updateMedia(this.editor.id,values);this.toast('Медіа збережено');}else{await this.service.createMedia(values);this.toast('Медіа додано в бібліотеку');}this.editor={open:false,id:null,dirty:false,saving:false,error:''};this.studio.querySelector('[data-mp-media-editor-host]').innerHTML='';this.renderAll();}catch(err){this.editor.saving=false;this.editor.error=err?.message||String(err);this.renderEditor();}}
  async deleteCurrent(){if(!this.editor.id)return;const m=this.store.getMediaItem(this.editor.id);if(!m)return;if(!confirm(`Видалити «${m.fileName||m.url}» з Media Library?`))return;try{await this.service.deleteMediaSafe(m.id);this.editor={open:false,id:null,dirty:false,saving:false,error:''};this.studio.querySelector('[data-mp-media-editor-host]').innerHTML='';this.toast('Медіа видалено');this.renderAll();}catch(err){this.editor.error=err?.message||String(err);this.renderEditor();}}
  async fillAlt(){try{const n=await this.service.fillObviousMissingAlt();this.toast(n?`Заповнено ALT: ${n}`:'Немає очевидних ALT для автозаповнення');this.renderAll();}catch(err){this.toast(`Помилка: ${err?.message||err}`);}}

  pickForProduct(){
    const form=this.studio.querySelector('[data-mp-product-form]');if(!form)return;const textarea=form.elements.photoUrls;if(!textarea)return;
    const urls=str(textarea.value).split(/\r?\n/).map(str).filter(Boolean),byUrl=new Map(this.store.getMedia().map(m=>[m.url,m.id]));
    this.openPicker({kind:'image',multiple:true,selectedIds:urls.map(u=>byUrl.get(u)).filter(Boolean),onSelect:items=>{textarea.value=items.map(m=>m.url).join('\n');textarea.dispatchEvent(new Event('input',{bubbles:true}));}});
  }
  pickForCategory(field){
    const form=this.studio.querySelector('[data-mp-category-form]');if(!form)return;const input=form.elements[field];if(!input)return;const current=this.store.getMedia().find(m=>m.url===str(input.value));
    this.openPicker({kind:'image',multiple:false,selectedIds:current?[current.id]:[],onSelect:items=>{input.value=items[0]?.url||'';input.dispatchEvent(new Event('input',{bubbles:true}));}});
  }
  openPicker({kind='image',multiple=false,selectedIds=[],onSelect}={}){this.picker={kind,multiple,selected:new Set(selectedIds),onSelect:typeof onSelect==='function'?onSelect:()=>{}};this.renderPicker();}
  renderPicker(){
    document.querySelector('[data-mp-media-picker]')?.remove();if(!this.picker)return;const items=this.store.getMedia().filter(m=>!this.picker.kind||m.kind===this.picker.kind);
    const el=document.createElement('div');el.className='mp-media-picker-backdrop';el.dataset.mpMediaPicker='01059';el.innerHTML=`<div class="mp-media-picker"><div class="mp-media-picker__head"><div><div class="mp-media-eyebrow">MEDIA PICKER · ${STAGE}</div><h2>Вибрати з медіатеки</h2><p>${this.picker.multiple?'Можна вибрати кілька зображень. Порядок береться з Media Library.':'Вибери одне зображення.'}</p></div><div class="mp-media-picker__head-actions-01066"><button type="button" class="mp-btn mp-btn--small mp-btn--upload-01066" data-mp-media-upload-action="picker-files">⬆ З комп’ютера</button></div><button type="button" class="mp-icon-btn" data-mp-media-action="picker-cancel">×</button></div><div class="mp-media-picker__grid">${items.length?items.map(m=>`<button type="button" class="mp-media-picker-item ${this.picker.selected.has(m.id)?'is-selected':''}" data-mp-media-action="picker-toggle" data-id="${esc(m.id)}">${m.kind==='image'?`<img src="${esc(m.url)}" alt="${esc(m.alt||'')}">`:`<b>${kindIcon(m.kind)}</b>`}<span>${esc(m.fileName||m.url)}</span><i>${this.picker.selected.has(m.id)?'✓':'+'}</i></button>`).join(''):'<div class="mp-data-empty"><b>Немає зображень</b><span>Додай їх у Media Library або завантаж прямо з комп’ютера.</span></div>'}</div><div class="mp-media-picker__foot"><span>Вибрано: <b>${this.picker.selected.size}</b></span><button type="button" class="mp-btn" data-mp-media-action="picker-cancel">Скасувати</button><button type="button" class="mp-btn mp-btn--primary" data-mp-media-action="picker-confirm" ${this.picker.selected.size?'':'disabled'}>Використати</button></div></div>`;document.body.appendChild(el);
  }
  togglePicker(id){if(!this.picker||!id)return;if(this.picker.multiple){if(this.picker.selected.has(id))this.picker.selected.delete(id);else this.picker.selected.add(id);}else{this.picker.selected.clear();this.picker.selected.add(id);}this.renderPicker();}
  confirmPicker(){if(!this.picker)return;const selected=[...this.picker.selected],map=new Map(this.store.getMedia().map(m=>[m.id,m])),items=selected.map(id=>map.get(id)).filter(Boolean);const cb=this.picker.onSelect;this.closePicker();cb(items);}
  closePicker(){this.picker=null;document.querySelector('[data-mp-media-picker]')?.remove();}

  getBindingData(id){return getMarketplaceMediaBindingData01059(this.store.getMediaItem(id),this.store.getState());}
  toast(message){let el=document.getElementById('mp-media-toast-01059');if(!el){el=document.createElement('div');el.id='mp-media-toast-01059';el.className='mp-toast mp-media-toast';document.body.appendChild(el);}el.innerHTML=`<b>Media Library 01059</b>${esc(message)}`;el.classList.add('is-show');clearTimeout(this.toast._t);this.toast._t=setTimeout(()=>el.classList.remove('is-show'),2600);}
}

export function initMarketplaceMediaLibrary01059(options){return new MarketplaceMediaLibrary01059(options).init();}
