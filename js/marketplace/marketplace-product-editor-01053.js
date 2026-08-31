// 01053 · Marketplace Product Editor.
// UI talks only to MarketplaceStore. No persistence adapter is imported or referenced here.

const STAGE='01053';
const OWNED_MEDIA_SOURCE='product-editor-01053';

function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function numberOrZero(v){const n=Number(v);return Number.isFinite(n)?Math.max(0,n):0;}
function integerOrZero(v){return Math.max(0,Math.round(numberOrZero(v)));}
function splitLines(v){return String(v??'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);}
function unique(values){return [...new Set(values)];}
function slugify(value){
  const map={а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ы:'y',э:'e',ъ:'',ё:'io'};
  return String(value??'').trim().toLowerCase().split('').map(ch=>map[ch]??ch).join('')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-{2,}/g,'-').slice(0,120);
}
function statusLabel(v){return v==='active'?'Активний':v==='archived'?'Архів':'Чернетка';}
function availabilityLabel(v){return v==='out-of-stock'?'Немає':v==='preorder'?'Передзамовлення':'В наявності';}
function money(v,currency='UAH'){
  const n=Number(v)||0;
  try{return new Intl.NumberFormat('uk-UA',{style:'currency',currency,maximumFractionDigits:0}).format(n);}catch{return `${n} грн`;}
}
function imageUrl(product,state){
  const media=new Map((state.media||[]).map(m=>[m.id,m]));
  return media.get(product.primaryMediaId)?.url || (product.mediaIds||[]).map(id=>media.get(id)?.url).find(Boolean) || '';
}
function categoryNames(product,state){
  const cats=new Map((state.categories||[]).map(c=>[c.id,c.name]));
  return (product.categoryIds||[]).map(id=>cats.get(id)).filter(Boolean).join(', ')||'—';
}
function productMedia(product,state){
  const map=new Map((state.media||[]).map(m=>[m.id,m]));
  return (product?.mediaIds||[]).map(id=>map.get(id)).filter(Boolean);
}
function orderedCategories(categories){
  const all=Array.isArray(categories)?categories:[];
  const byParent=new Map();
  all.forEach(c=>{const k=c.parentId||'';if(!byParent.has(k))byParent.set(k,[]);byParent.get(k).push(c);});
  byParent.forEach(arr=>arr.sort((a,b)=>String(a.name).localeCompare(String(b.name),'uk')));
  const out=[], seen=new Set();
  const walk=(parentId,depth)=>{(byParent.get(parentId)||[]).forEach(c=>{if(seen.has(c.id))return;seen.add(c.id);out.push({category:c,depth});walk(c.id,depth+1);});};
  walk('',0); all.forEach(c=>{if(!seen.has(c.id))out.push({category:c,depth:0});});
  return out;
}
function normalizeUrlLines(lines){
  const urls=unique(lines.map(x=>String(x||'').trim()).filter(Boolean));
  const invalid=urls.find(url=>/^data:|^blob:/i.test(url));
  if(invalid) throw new Error('Фото у форматі data:/blob: не зберігаємо. Використай URL або шлях до asset.');
  if(urls.length>24) throw new Error('Для базового редактора 01053 дозволено до 24 фото-посилань на товар.');
  return urls;
}
function ownedByProduct(media,productId){return media?.metadata?.source===OWNED_MEDIA_SOURCE && media?.metadata?.ownerProductId===productId;}

export class MarketplaceProductEditor01053 {
  constructor({store,studio,activatePage}={}){
    if(!store)throw new Error('MarketplaceProductEditor01053 requires MarketplaceStore');
    this.store=store;
    this.studio=studio;
    this.activatePage=typeof activatePage==='function'?activatePage:()=>{};
    this.editor={open:false,mode:'create',productId:null,dirty:false,error:'',saving:false};
    this.filters={query:'',categoryId:'',status:'',availability:''};
    this._bound=false;
  }

  init(){
    if(!this.studio)return this;
    this.installProductPage();
    this.bind();
    this.renderAll();
    return this;
  }

  installProductPage(){
    const page=this.studio.querySelector('[data-mp-page-view="products"]');
    if(!page)return;
    page.dataset.mpProductEditorStage=STAGE;
    const head=page.querySelector('.mp-page-head');
    if(head){
      const p=head.querySelector('p');
      if(p)p.textContent='Реальний Product Editor поверх MarketplaceStore. Створення, редагування й видалення товарів проходять тільки через Repository contract.';
      const add=[...head.querySelectorAll('[data-mp-action],button')].find(b=>/додати товар/i.test(b.textContent||''));
      if(add){add.removeAttribute('data-mp-action');add.setAttribute('data-mp-product-action','new');add.classList.add('mp-btn--primary');}
    }

    const mock=page.querySelector('.mp-grid-equal[style*="margin-top:12px"]');
    if(mock)mock.remove();
    if(!page.querySelector('[data-mp-product-editor-host]')){
      const toolbar=page.querySelector('.mp-toolbar');
      if(toolbar) toolbar.insertAdjacentHTML('beforebegin','<div data-mp-product-editor-host></div>');
    }
    this.installToolbar(page);
    this.installExternalEntryPoints();
  }

  installToolbar(page){
    let toolbar=page.querySelector('.mp-toolbar');
    if(!toolbar){
      const host=page.querySelector('[data-mp-product-editor-host]');
      host?.insertAdjacentHTML('afterend','<div class="mp-toolbar"></div>');
      toolbar=page.querySelector('.mp-toolbar');
    }
    if(!toolbar)return;
    toolbar.innerHTML=`
      <label class="mp-search">⌕<input data-mp-product-filter="query" placeholder="Пошук за назвою, SKU, брендом…"></label>
      <select class="mp-select" data-mp-product-filter="category"><option value="">Усі категорії</option></select>
      <select class="mp-select" data-mp-product-filter="status"><option value="">Усі статуси</option><option value="active">Активні</option><option value="draft">Чернетки</option><option value="archived">Архів</option></select>
      <select class="mp-select" data-mp-product-filter="availability"><option value="">Будь-яка наявність</option><option value="in-stock">В наявності</option><option value="out-of-stock">Немає</option><option value="preorder">Передзамовлення</option></select>
      <button type="button" class="mp-btn mp-btn--primary mp-btn--small" data-mp-product-action="new">＋ Додати товар</button>`;
  }

  installExternalEntryPoints(){
    const panel=document.getElementById('marketplace-panel-root');
    if(panel){
      const quick=panel.querySelector('.mp-inspector__quick [data-mp-page="products"].is-primary');
      if(quick){quick.removeAttribute('data-mp-page');quick.setAttribute('data-mp-product-action','new');}
      panel.querySelectorAll('[data-mp-action]').forEach(b=>{if(/Товари\s*·\s*\+ Додати товар/i.test(b.getAttribute('data-mp-action')||'')){b.removeAttribute('data-mp-action');b.setAttribute('data-mp-product-action','new');const stub=b.querySelector('.mp-stub');if(stub)stub.remove();}});
      const productsAcc=panel.querySelector('[data-mp-accordion="products"] .mp-side-status');
      if(productsAcc)productsAcc.innerHTML='<span>Product Editor</span><b>CRUD LIVE · 01053</b>';
    }
    const overview=this.studio.querySelector('[data-mp-page-view="overview"]');
    overview?.querySelectorAll('[data-mp-action]').forEach(b=>{if(/^\+ Новий товар$/i.test((b.getAttribute('data-mp-action')||'').trim())){b.removeAttribute('data-mp-action');b.setAttribute('data-mp-product-action','new');}});
  }

  bind(){
    if(this._bound)return;this._bound=true;
    const handler=e=>{
      const action=e.target.closest?.('[data-mp-product-action]');
      if(action){
        e.preventDefault();e.stopPropagation();
        const kind=action.getAttribute('data-mp-product-action');
        if(kind==='new')this.openNew();
        else if(kind==='edit')this.openEdit(action.getAttribute('data-mp-product-id'));
        else if(kind==='cancel')this.cancel();
        else if(kind==='delete')this.deleteCurrent();
        else if(kind==='save')this.save();
        return;
      }
      const row=e.target.closest?.('tr[data-mp-product-row]');
      if(row && !e.target.closest('button,input,a,select,textarea'))this.openEdit(row.getAttribute('data-mp-product-row'));
    };
    document.addEventListener('click',handler,true);

    this.studio.addEventListener('input',e=>{
      const filter=e.target.closest?.('[data-mp-product-filter]');
      if(filter){this.updateFilter(filter);return;}
      if(e.target.closest?.('[data-mp-product-form]')){
        this.editor.dirty=true;this.editor.error='';this.syncEditorStateBadge();
        if(e.target.matches('[name="slug"]'))e.target.dataset.mpSlugAuto='0';
        if(e.target.matches('[name="name"]'))this.maybeSuggestSlug(e.target);
        if(e.target.matches('[name="photoUrls"]'))this.renderPhotoPreviewFromForm();
      }
    });
    this.studio.addEventListener('change',e=>{
      const filter=e.target.closest?.('[data-mp-product-filter]');
      if(filter){this.updateFilter(filter);return;}
      if(e.target.closest?.('[data-mp-product-form]')){this.editor.dirty=true;this.editor.error='';this.syncEditorStateBadge();}
    });
    this.studio.addEventListener('submit',e=>{
      if(!e.target.closest?.('[data-mp-product-form]'))return;
      e.preventDefault();this.save();
    });
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'&&this.editor.open&&!this.editor.saving){e.preventDefault();this.cancel();}
    });
  }

  updateFilter(el){
    const key=el.getAttribute('data-mp-product-filter');
    if(key==='query')this.filters.query=String(el.value||'');
    if(key==='category')this.filters.categoryId=String(el.value||'');
    if(key==='status')this.filters.status=String(el.value||'');
    if(key==='availability')this.filters.availability=String(el.value||'');
    this.renderTable();
  }

  confirmDiscard(){
    if(!this.editor.open||!this.editor.dirty||this.editor.saving)return true;
    return confirm('Є незбережені зміни товару. Закрити редактор без збереження?');
  }

  openNew(){
    if(!this.confirmDiscard())return;
    this.activatePage('products');
    this.editor={open:true,mode:'create',productId:null,dirty:false,error:'',saving:false};
    this.renderEditor();this.scrollToEditor();
  }
  openEdit(id){
    if(!id||!this.store.getProduct(id))return;
    if(this.editor.open&&this.editor.mode==='edit'&&this.editor.productId===id){this.scrollToEditor();return;}
    if(!this.confirmDiscard())return;
    this.activatePage('products');
    this.editor={open:true,mode:'edit',productId:id,dirty:false,error:'',saving:false};
    this.renderEditor();this.scrollToEditor();
  }
  cancel(){
    if(!this.confirmDiscard())return;
    this.editor={open:false,mode:'create',productId:null,dirty:false,error:'',saving:false};
    this.renderEditor();
  }

  scrollToEditor(){
    requestAnimationFrame(()=>{try{this.studio.querySelector('[data-mp-product-editor]')?.scrollIntoView({behavior:'smooth',block:'start'});}catch{}});
  }

  formProduct(){
    if(this.editor.mode==='edit')return this.store.getProduct(this.editor.productId)||null;
    return {status:'draft',availability:'in-stock',currency:'UAH',categoryIds:[],name:'',sku:'',slug:'',brand:'',shortDescription:'',description:'',price:0,oldPrice:0,stock:0,mediaIds:[],primaryMediaId:''};
  }

  renderAll(){
    this.installExternalEntryPoints();
    this.renderToolbarOptions();
    this.renderTable();
    if(!this.editor.saving)this.renderEditor();
    this.renderStageStatus();
  }

  renderStageStatus(){
    const panel=document.getElementById('marketplace-panel-root');
    const hero=panel?.querySelector('.mp-inspector__hero');
    if(hero){
      const eyebrow=hero.querySelector('.mp-inspector__eyebrow');if(eyebrow)eyebrow.textContent=`MARKETPLACE STUDIO · ${STAGE}`;
      const mode=hero.querySelector('.mp-inspector__mode');if(mode)mode.innerHTML='<span>MarketplaceStore → Repository</span><b class="mp-live-dot">PRODUCT CRUD READY</b>';
      const sub=hero.querySelector('.mp-inspector__subtitle');if(sub)sub.textContent='Товари вже створюються й редагуються через MarketplaceStore. Конкретне фізичне сховище лишається поза UI.';
    }
    const ctx=this.studio.querySelector('.mp-context');
    const metrics=ctx?.querySelectorAll('.mp-context__metric');
    if(metrics?.[0])metrics[0].innerHTML='<span>Studio shell</span><b>01053</b>';
    if(metrics?.[1])metrics[1].innerHTML='<span>Product Editor</span><b>CRUD LIVE</b>';
    const warn=ctx?.querySelector('.mp-context__notice.is-warn');
    if(warn)warn.innerHTML='Product CRUD активний через <b>MarketplaceStore</b>. Category Editor, Variants, Media Library та Importer залишаються окремими наступними етапами.';
  }

  renderToolbarOptions(){
    const page=this.studio.querySelector('[data-mp-page-view="products"]');if(!page)return;
    const select=page.querySelector('[data-mp-product-filter="category"]');if(!select)return;
    const previous=this.filters.categoryId;
    select.innerHTML='<option value="">Усі категорії</option>'+orderedCategories(this.store.getCategories()).map(({category,depth})=>`<option value="${esc(category.id)}">${'— '.repeat(depth)}${esc(category.name||'Без назви')}</option>`).join('');
    select.value=previous;
    const q=page.querySelector('[data-mp-product-filter="query"]');if(q&&q.value!==this.filters.query)q.value=this.filters.query;
    const s=page.querySelector('[data-mp-product-filter="status"]');if(s)s.value=this.filters.status;
    const a=page.querySelector('[data-mp-product-filter="availability"]');if(a)a.value=this.filters.availability;
  }

  filteredProducts(state){
    const q=this.filters.query.trim().toLowerCase();
    return (state.products||[]).filter(p=>{
      if(q&&!`${p.name} ${p.sku} ${p.brand}`.toLowerCase().includes(q))return false;
      if(this.filters.categoryId&&!(p.categoryIds||[]).includes(this.filters.categoryId))return false;
      if(this.filters.status&&p.status!==this.filters.status)return false;
      if(this.filters.availability&&p.availability!==this.filters.availability)return false;
      return true;
    });
  }

  renderTable(){
    const page=this.studio.querySelector('[data-mp-page-view="products"]');if(!page)return;
    const tbody=page.querySelector('.mp-table tbody');if(!tbody)return;
    const state=this.store.getState();
    const products=this.filteredProducts(state);
    if(!products.length){
      const hasAny=(state.products||[]).length>0;
      tbody.innerHTML=`<tr><td colspan="9"><div class="mp-data-empty"><b>${hasAny?'За цими фільтрами товарів немає':'Каталог порожній'}</b><span>${hasAny?'Зміни пошук або фільтри.':'Натисни «+ Додати товар», щоб створити перший запис через MarketplaceStore.'}</span>${!hasAny?'<button type="button" class="mp-btn mp-btn--primary mp-btn--small" data-mp-product-action="new">＋ Додати товар</button>':''}</div></td></tr>`;
      return;
    }
    tbody.innerHTML=products.map(p=>{
      const img=imageUrl(p,state),selected=this.editor.open&&this.editor.productId===p.id;
      return `<tr data-mp-product-row="${esc(p.id)}" class="${selected?'is-selected':''}">
        <td><span class="mp-row-dot ${p.status==='active'?'is-live':''}"></span></td>
        <td><div class="mp-product-cell">${img?`<img class="mp-product-thumb" src="${esc(img)}" alt="">`:'<div class="mp-product-thumb mp-thumb-empty">IMG</div>'}<div><div class="mp-product-name">${esc(p.name||'Без назви')}</div><div class="mp-product-sub">${(p.mediaIds||[]).length} фото · ${esc(p.brand||'Без бренду')}</div></div></div></td>
        <td>${esc(p.sku||'—')}</td><td>${esc(categoryNames(p,state))}</td><td><b>${money(p.price,p.currency||'UAH')}</b>${Number(p.oldPrice)>Number(p.price)?`<div class="mp-product-oldprice">${money(p.oldPrice,p.currency||'UAH')}</div>`:''}</td><td>${integerOrZero(p.stock)}</td>
        <td><span class="mp-badge ${p.status==='draft'?'is-warn':p.status==='archived'?'is-gray':''}">${statusLabel(p.status)}</span><div class="mp-product-availability">${availabilityLabel(p.availability)}</div></td>
        <td><span class="mp-badge is-blue">${p.slug?'URL':'—'}</span></td>
        <td><button type="button" class="mp-btn mp-btn--small" data-mp-product-action="edit" data-mp-product-id="${esc(p.id)}">Редагувати</button></td></tr>`;
    }).join('');
  }

  editorHtml(product){
    const state=this.store.getState();
    const isEdit=this.editor.mode==='edit';
    const media=productMedia(product,state);
    const photoUrls=media.map(m=>m.url).filter(Boolean).join('\n');
    const cats=orderedCategories(state.categories||[]);
    const selected=new Set(product.categoryIds||[]);
    const title=isEdit?`Редагування · ${product.name||'Без назви'}`:'Новий товар';
    return `<section class="mp-product-editor" data-mp-product-editor="${STAGE}">
      <div class="mp-product-editor__head"><div><div class="mp-product-editor__eyebrow">PRODUCT EDITOR · ${STAGE}</div><h2>${esc(title)}</h2><p>Збереження: Product Editor → MarketplaceStore → MarketplaceRepository. UI не знає, де фізично зберігаються дані.</p></div><div class="mp-product-editor__head-actions"><span class="mp-product-editor__state ${this.editor.dirty?'is-dirty':''}" data-mp-product-editor-state>${this.editor.dirty?'Є незбережені зміни':isEdit?'Збережений товар':'Новий запис'}</span><button type="button" class="mp-icon-btn" data-mp-product-action="cancel" title="Закрити">×</button></div></div>
      ${this.editor.error?`<div class="mp-editor-error">${esc(this.editor.error)}</div>`:''}
      <form data-mp-product-form novalidate>
        <div class="mp-product-editor__layout">
          <div class="mp-product-editor__main">
            <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Основні дані</div><div class="mp-card__hint">Назва, SKU, статус, бренд і URL</div></div></div><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--product">
              <div class="mp-field is-wide"><label>Назва товару *</label><input name="name" value="${esc(product.name||'')}" placeholder="Наприклад: Сковорода з диска борони 50 см" autocomplete="off"></div>
              <div class="mp-field"><label>SKU *</label><input name="sku" value="${esc(product.sku||'')}" placeholder="SK-50" autocomplete="off"></div>
              <div class="mp-field"><label>Статус</label><select name="status"><option value="draft" ${product.status==='draft'?'selected':''}>Чернетка</option><option value="active" ${product.status==='active'?'selected':''}>Активний</option><option value="archived" ${product.status==='archived'?'selected':''}>Архів</option></select></div>
              <div class="mp-field"><label>Бренд</label><input name="brand" value="${esc(product.brand||'')}" placeholder="SHIFTIME"></div>
              <div class="mp-field"><label>Slug</label><input name="slug" value="${esc(product.slug||'')}" placeholder="skovoroda-50" data-mp-slug-field data-mp-slug-auto="${(!product.slug||product.slug===slugify(product.name||''))?'1':'0'}"></div>
            </div></div></section>

            <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Опис</div><div class="mp-card__hint">Контент товару без прив'язки до конкретної Product Card</div></div></div><div class="mp-card__body"><div class="mp-form-grid"><div class="mp-field is-wide"><label>Короткий опис</label><textarea name="shortDescription" placeholder="Коротко для карток і прев'ю…">${esc(product.shortDescription||'')}</textarea></div><div class="mp-field is-wide"><label>Повний опис</label><textarea class="mp-product-description" name="description" placeholder="Повний опис товару…">${esc(product.description||'')}</textarea></div></div></div></section>

            <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Фото товару</div><div class="mp-card__hint">Product зберігає тільки mediaId. Можна вибрати готові записи з Media Library або вставити URL/asset path вручну.</div></div><div class="mp-card__head-actions"><button type="button" class="mp-btn mp-btn--small" data-mp-media-action="pick-product">▧ Вибрати з медіатеки</button><button type="button" class="mp-btn mp-btn--small mp-btn--upload-01066" data-mp-media-upload-action="product-files">⬆ З комп’ютера</button><span class="mp-badge is-green">Media Library · 01066</span></div></div><div class="mp-card__body"><div class="mp-field"><label>URL або asset path · один рядок = одне фото</label><textarea class="mp-product-photo-urls" name="photoUrls" placeholder="assets/products/pan-50.webp&#10;https://cdn.example.com/pan-50-2.webp">${esc(photoUrls)}</textarea></div><div class="mp-product-photo-preview" data-mp-photo-preview></div><div class="mp-field-note">Файл з комп’ютера автоматично додається у Media Library; у Product зберігається тільки Media ID. data:/blob: у commerce state не зберігаються.</div><div class="mp-product-upload-status-01066" data-mp-product-upload-status-01066></div></div></section>
          </div>

          <aside class="mp-product-editor__side">
            <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Ціна і наявність</div><div class="mp-card__hint">Базові поля товару</div></div></div><div class="mp-card__body"><div class="mp-form-grid mp-form-grid--stack">
              <div class="mp-field"><label>Ціна, грн</label><input name="price" type="number" min="0" step="1" value="${esc(product.price??0)}"></div>
              <div class="mp-field"><label>Стара ціна, грн</label><input name="oldPrice" type="number" min="0" step="1" value="${esc(product.oldPrice??0)}"></div>
              <div class="mp-field"><label>Залишок</label><input name="stock" type="number" min="0" step="1" value="${esc(product.stock??0)}"></div>
              <div class="mp-field"><label>Наявність</label><select name="availability"><option value="in-stock" ${product.availability==='in-stock'?'selected':''}>В наявності</option><option value="out-of-stock" ${product.availability==='out-of-stock'?'selected':''}>Немає</option><option value="preorder" ${product.availability==='preorder'?'selected':''}>Передзамовлення</option></select></div>
            </div></div></section>

            <section class="mp-card"><div class="mp-card__head"><div><div class="mp-card__title">Категорії</div><div class="mp-card__hint">Можна обрати кілька категорій</div></div><span class="mp-badge">${selected.size}</span></div><div class="mp-card__body"><div class="mp-category-picker">${cats.length?cats.map(({category,depth})=>`<label class="mp-category-option" style="--depth:${Math.min(depth,4)}"><input type="checkbox" name="categoryIds" value="${esc(category.id)}" ${selected.has(category.id)?'checked':''}><span>${esc(category.name||'Без назви')}</span></label>`).join(''):'<div class="mp-data-empty mp-data-empty--compact"><b>Категорій ще немає</b><span>Товар можна зберегти без категорії. Реальний Category Editor підключено у 01057.</span></div>'}</div></div></section>

            <section class="mp-product-savebar"><div><b>${isEdit?'Зберегти зміни':'Створити товар'}</b><span>${isEdit?`ID: ${esc(product.id)}`:'Новий Product буде створений через store.createProduct().'}</span></div><div class="mp-product-savebar__actions">${isEdit?'<button type="button" class="mp-btn mp-btn--danger" data-mp-product-action="delete">Видалити</button>':''}<button type="button" class="mp-btn" data-mp-product-action="cancel">Скасувати</button><button type="button" class="mp-btn mp-btn--primary" data-mp-product-action="save">${this.editor.saving?'Збереження…':isEdit?'Зберегти':'Створити товар'}</button></div></section>
          </aside>
        </div>
      </form>
    </section>`;
  }

  renderEditor(){
    const host=this.studio.querySelector('[data-mp-page-view="products"] [data-mp-product-editor-host]');if(!host)return;
    if(!this.editor.open){host.innerHTML='';this.renderTable();return;}
    const product=this.formProduct();
    if(this.editor.mode==='edit'&&!product){this.editor={open:false,mode:'create',productId:null,dirty:false,error:'Товар більше не існує',saving:false};host.innerHTML='';this.renderTable();return;}
    host.innerHTML=this.editorHtml(product);
    this.renderPhotoPreviewFromForm();
    this.renderTable();
  }

  syncEditorStateBadge(){
    const el=this.studio.querySelector('[data-mp-product-editor-state]');if(!el)return;
    el.classList.toggle('is-dirty',!!this.editor.dirty);
    el.textContent=this.editor.dirty?'Є незбережені зміни':this.editor.mode==='edit'?'Збережений товар':'Новий запис';
  }

  maybeSuggestSlug(nameInput){
    const form=nameInput.closest('[data-mp-product-form]');const slug=form?.querySelector('[name="slug"]');if(!slug)return;
    if(slug.dataset.mpSlugAuto==='1'||!slug.value.trim()){slug.value=slugify(nameInput.value);slug.dataset.mpSlugAuto='1';}
  }

  renderPhotoPreviewFromForm(){
    const form=this.studio.querySelector('[data-mp-product-form]');const host=form?.querySelector('[data-mp-photo-preview]');if(!host)return;
    const urls=splitLines(form.elements.photoUrls?.value||'').slice(0,24).filter(url=>!/^data:|^blob:/i.test(url));
    host.innerHTML=urls.length?urls.map((url,i)=>`<div class="mp-photo-tile"><img src="${esc(url)}" alt=""><span>${i===0?'Головне':`Фото ${i+1}`}</span></div>`).join(''):'<div class="mp-photo-empty">Додай URL або asset path — тут одразу з’явиться прев’ю.</div>';
  }

  readForm(){
    const form=this.studio.querySelector('[data-mp-product-form]');if(!form)throw new Error('Product Editor form not found');
    const fd=new FormData(form);
    const name=String(fd.get('name')||'').trim();
    const sku=String(fd.get('sku')||'').trim();
    if(!name)throw new Error('Вкажи назву товару.');
    if(!sku)throw new Error('Вкажи SKU. SKU повинен бути унікальним.');
    const price=numberOrZero(fd.get('price'));
    const oldPrice=numberOrZero(fd.get('oldPrice'));
    const stock=integerOrZero(fd.get('stock'));
    const urls=normalizeUrlLines(splitLines(fd.get('photoUrls')));
    return {
      payload:{
        name,sku,
        slug:String(fd.get('slug')||'').trim()||slugify(name),
        status:String(fd.get('status')||'draft'),
        brand:String(fd.get('brand')||'').trim(),
        shortDescription:String(fd.get('shortDescription')||'').trim(),
        description:String(fd.get('description')||'').trim(),
        categoryIds:fd.getAll('categoryIds').map(String).filter(Boolean),
        price,oldPrice,currency:'UAH',stock,
        availability:String(fd.get('availability')||'in-stock')
      },
      urls
    };
  }

  async reconcileMedia(productId,urls,currentProduct=null,altName=''){
    const state=this.store.getState();
    const current=productMedia(currentProduct,state);
    const byUrl=new Map(current.filter(m=>m.url).map(m=>[m.url,m]));
    const libraryByUrl=new Map((state.media||[]).filter(m=>m.url).map(m=>[m.url,m]));
    const nextIds=[],created=[];
    try{
      for(let i=0;i<urls.length;i++){
        const url=urls[i];
        const existing=byUrl.get(url)||libraryByUrl.get(url);
        if(existing){nextIds.push(existing.id);continue;}
        const media=await this.store.createMedia({kind:'image',url,alt:altName||currentProduct?.name||'',sortOrder:i,metadata:{source:OWNED_MEDIA_SOURCE,ownerProductId:productId}});
        created.push(media.id);nextIds.push(media.id);
      }
      return {nextIds,created,removed:current.filter(m=>!urls.includes(m.url)&&ownedByProduct(m,productId)).map(m=>m.id)};
    }catch(err){
      for(const id of created){try{await this.store.deleteMedia(id);}catch{}}
      throw err;
    }
  }

  async save(){
    if(this.editor.saving)return;
    this.editor.error='';
    let values;
    try{values=this.readForm();}catch(err){this.editor.error=err?.message||String(err);this.renderEditor();return;}
    this.editor.saving=true;this.renderEditor();
    let createdProductId=null;
    let newlyCreatedMediaIds=[];
    try{
      if(this.editor.mode==='create'){
        const created=await this.store.createProduct({...values.payload,mediaIds:[],primaryMediaId:''});
        createdProductId=created.id;
        const media=await this.reconcileMedia(created.id,values.urls,{...created,mediaIds:[]},values.payload.name);
        newlyCreatedMediaIds=media.created.slice();
        if(media.nextIds.length)await this.store.updateProduct(created.id,{mediaIds:media.nextIds,primaryMediaId:media.nextIds[0]||''});
        this.toast(`Товар «${values.payload.name}» створено через MarketplaceStore`);
      }else{
        const current=this.store.getProduct(this.editor.productId);
        if(!current)throw new Error('Товар більше не існує.');
        const media=await this.reconcileMedia(current.id,values.urls,current,values.payload.name);
        newlyCreatedMediaIds=media.created.slice();
        await this.store.updateProduct(current.id,{...values.payload,mediaIds:media.nextIds,primaryMediaId:media.nextIds[0]||''});
        // 01059: do not auto-delete detached Media IDs. They may be shared; Media Library owns safe orphan cleanup.
        this.toast(`Товар «${values.payload.name}» збережено`);
      }
      this.editor={open:false,mode:'create',productId:null,dirty:false,error:'',saving:false};
      this.renderAll();
    }catch(err){
      for(const id of newlyCreatedMediaIds){try{await this.store.deleteMedia(id);}catch{}}
      if(createdProductId){try{await this.store.deleteProduct(createdProductId);}catch{}}
      this.editor.saving=false;this.editor.error=err?.message||String(err);this.renderEditor();
      console.error('[MarketplaceProductEditor01053] save failed',err);
    }
  }

  async deleteCurrent(){
    if(this.editor.mode!=='edit'||!this.editor.productId||this.editor.saving)return;
    const product=this.store.getProduct(this.editor.productId);if(!product)return;
    if(!confirm(`Видалити товар «${product.name||product.sku||product.id}»? Цю дію буде виконано через MarketplaceRepository.`))return;
    this.editor.saving=true;this.renderEditor();
    try{
      await this.store.deleteProduct(product.id);
      // 01059: product deletion detaches Media IDs but never destroys shared library records automatically.
      this.editor={open:false,mode:'create',productId:null,dirty:false,error:'',saving:false};
      this.toast(`Товар «${product.name||product.sku}» видалено`);this.renderAll();
    }catch(err){this.editor.saving=false;this.editor.error=err?.message||String(err);this.renderEditor();}
  }

  toast(message){
    let el=document.getElementById('mp-product-toast-01053');
    if(!el){el=document.createElement('div');el.id='mp-product-toast-01053';el.className='mp-toast mp-product-toast';document.body.appendChild(el);}
    el.innerHTML=`<b>Marketplace Product Editor</b>${esc(message)}`;el.classList.add('is-show');
    clearTimeout(this.toast._t);this.toast._t=setTimeout(()=>el.classList.remove('is-show'),2600);
  }
}

export function initMarketplaceProductEditor01053(options){return new MarketplaceProductEditor01053(options).init();}
