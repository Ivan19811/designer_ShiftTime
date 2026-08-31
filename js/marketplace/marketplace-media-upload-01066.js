// 01066 · Upload UI for Media Library / Product Editor / Media Picker.
const STAGE='01066';
function str(v){return String(v??'').trim();}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function unique(list){return [...new Set(list.filter(Boolean))];}

export class MarketplaceMediaUpload01066{
  constructor({store,studio,mediaController,uploadService}={}){this.store=store;this.studio=studio;this.mediaController=mediaController;this.uploadService=uploadService;this.busy=false;this._bound=false;}
  init(){if(!this.studio)return this;this.decorate();this.bind();return this;}
  decorate(){
    const page=this.studio.querySelector('[data-mp-page-view="media"]');
    if(page){
      const actions=page.querySelector('.mp-page-head .mp-page-actions');
      if(actions&&!actions.querySelector('[data-mp-media-upload-action="library-files"]'))actions.insertAdjacentHTML('afterbegin','<button type="button" class="mp-btn mp-btn--primary" data-mp-media-upload-action="library-files">⬆ З комп’ютера</button>');
      const head=page.querySelector('.mp-page-head');
      if(head&&!page.querySelector('[data-mp-media-dropzone-01066]'))head.insertAdjacentHTML('afterend',`<section class="mp-media-dropzone-01066" data-mp-media-dropzone-01066 tabindex="0"><div class="mp-media-dropzone-01066__icon">⇧</div><div><b>Перетягни фото або файли сюди</b><span>Можна вибрати одразу багато файлів — наприклад 20 фото. Вони автоматично потраплять у Media Library.</span></div><button type="button" class="mp-btn mp-btn--small" data-mp-media-upload-action="library-files">Вибрати файли</button><small data-mp-media-upload-status-01066>Computer → MediaAssetRepository → Media Library</small></section>`);
      const empty=page.querySelector('.mp-media-empty span');if(empty&&/Додай URL/i.test(empty.textContent||''))empty.textContent='Перетягни файли у зону вище, вибери їх з комп’ютера або додай URL/assets вручну.';
    }
    const side=document.getElementById('marketplace-panel-root');const sideUpload=side?.querySelector('[data-mp-accordion="media"] [data-mp-media-action="new"]');if(sideUpload){sideUpload.removeAttribute('data-mp-media-action');sideUpload.setAttribute('data-mp-media-upload-action','library-files');sideUpload.textContent='З комп’ютера';}
    const sideStatus=side?.querySelector('[data-mp-accordion="media"] .mp-side-status');if(sideStatus)sideStatus.innerHTML='<span>Media Upload</span><b>LIVE · 01066</b>';
  }
  bind(){
    if(this._bound)return;this._bound=true;
    const click=e=>{const btn=e.target.closest?.('[data-mp-media-upload-action]');if(!btn)return;e.preventDefault();e.stopPropagation();const a=btn.dataset.mpMediaUploadAction;if(a==='library-files')this.chooseFiles({target:'library'});if(a==='product-files')this.chooseFiles({target:'product',imagesOnly:true});if(a==='picker-files')this.chooseFiles({target:'picker',imagesOnly:true});};
    document.addEventListener('click',click,true);
    this.studio.addEventListener('dragenter',e=>{const z=e.target.closest?.('[data-mp-media-dropzone-01066]');if(!z)return;e.preventDefault();z.classList.add('is-dragover');});
    this.studio.addEventListener('dragover',e=>{const z=e.target.closest?.('[data-mp-media-dropzone-01066]');if(!z)return;e.preventDefault();e.dataTransfer.dropEffect='copy';z.classList.add('is-dragover');});
    this.studio.addEventListener('dragleave',e=>{const z=e.target.closest?.('[data-mp-media-dropzone-01066]');if(z&&!z.contains(e.relatedTarget))z.classList.remove('is-dragover');});
    this.studio.addEventListener('drop',e=>{const z=e.target.closest?.('[data-mp-media-dropzone-01066]');if(!z)return;e.preventDefault();z.classList.remove('is-dragover');this.upload(e.dataTransfer?.files,{target:'library'});});
    this.studio.addEventListener('keydown',e=>{const z=e.target.closest?.('[data-mp-media-dropzone-01066]');if(z&&(e.key==='Enter'||e.key===' ')){e.preventDefault();this.chooseFiles({target:'library'});}});
    document.addEventListener('st:marketplace-product-editor-rendered',()=>this.decorateProduct());
    this.studio.addEventListener('click',()=>queueMicrotask(()=>this.decorateProduct()),true);
    this.decorateProduct();
  }
  decorateProduct(){
    const form=this.studio.querySelector('[data-mp-product-form]');if(!form)return;
    const actions=form.querySelector('.mp-card__head-actions');if(!actions||actions.querySelector('[data-mp-media-upload-action="product-files"]'))return;
    const picker=actions.querySelector('[data-mp-media-action="pick-product"]');
    const html='<button type="button" class="mp-btn mp-btn--small mp-btn--upload-01066" data-mp-media-upload-action="product-files">⬆ З комп’ютера</button>';
    if(picker)picker.insertAdjacentHTML('afterend',html);else actions.insertAdjacentHTML('afterbegin',html);
    const hint=form.querySelector('.mp-product-photo-urls')?.closest('.mp-card__body')?.querySelector('.mp-field-note');if(hint)hint.textContent='Файл з комп’ютера спочатку потрапляє в Media Library, а товар отримує Media ID після збереження. Binary не записується у MarketplaceStore.';
  }
  chooseFiles({target='library',imagesOnly=false}={}){
    if(this.busy)return;const input=document.createElement('input');input.type='file';input.multiple=true;input.accept=imagesOnly?'image/*':'image/*,video/*,application/pdf';input.style.display='none';document.body.appendChild(input);
    input.addEventListener('change',()=>{const files=input.files;input.remove();if(files?.length)this.upload(files,{target,imagesOnly});},{once:true});input.click();
  }
  async upload(files,{target='library',imagesOnly=false}={}){
    if(this.busy)return;this.busy=true;this.setStatus(`Підготовка файлів…`);
    try{
      const form=this.studio.querySelector('[data-mp-product-form]');const productName=target==='product'?str(form?.elements?.name?.value):'';
      const result=await this.uploadService.uploadFiles(files,{imagesOnly,folder:target==='product'?'products':'uploads',altBase:productName,numberAlt:!!productName,onProgress:p=>this.setStatus(`${p.index}/${p.total} · ${p.file?.name||''} · ${this.progressLabel(p.state)}`)});
      if(target==='product')this.applyToProduct(result.media);
      if(target==='picker')this.applyToPicker(result.media);
      this.mediaController?.renderAll?.();
      const msg=`Завантажено: ${result.created}${result.reused?` · повторно використано: ${result.reused}`:''}${result.errors.length?` · помилок: ${result.errors.length}`:''}`;
      this.mediaController?.toast?.(msg);this.setStatus(msg,result.errors.length?'warn':'ok');
      if(result.errors.length)console.warn('[01066 media upload] errors',result.errors);
    }catch(err){const msg=err?.message||String(err);this.mediaController?.toast?.(`Помилка upload: ${msg}`);this.setStatus(`Помилка: ${msg}`,'warn');}
    finally{this.busy=false;}
  }
  applyToProduct(media){
    const form=this.studio.querySelector('[data-mp-product-form]');const textarea=form?.elements?.photoUrls;if(!textarea)return;const existing=str(textarea.value).split(/\r?\n/).map(str).filter(Boolean),added=media.filter(m=>m.kind==='image').map(m=>m.url);textarea.value=unique([...existing,...added]).join('\n');textarea.dispatchEvent(new Event('input',{bubbles:true}));textarea.scrollIntoView?.({block:'nearest'});
  }
  applyToPicker(media){
    const picker=this.mediaController?.picker;if(!picker)return;const images=media.filter(m=>!picker.kind||m.kind===picker.kind);if(!images.length)return;if(picker.multiple)images.forEach(m=>picker.selected.add(m.id));else{picker.selected.clear();picker.selected.add(images[0].id);}this.mediaController.renderPicker?.();
  }
  progressLabel(s){return s==='reading'?'аналіз':s==='uploading'?'завантаження':s==='reused'?'уже є':s==='done'?'готово':s==='error'?'помилка':s;}
  setStatus(text,state=''){for(const el of this.studio.querySelectorAll('[data-mp-media-upload-status-01066],[data-mp-product-upload-status-01066]')){el.textContent=text;el.dataset.state=state;}}
}
export function initMarketplaceMediaUpload01066(options){return new MarketplaceMediaUpload01066(options).init();}
