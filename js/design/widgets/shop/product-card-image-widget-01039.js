// 01039 · Product Card image widget
// Commerce-specific controls only. Generic border/shadow/fill stay in the main Inspector.
import {
  resolveProductCardRoot01038,
  resolveProductCardRole01038
} from './product-card-contract-01038.js?v=01050';

const STATE_KEY = 'st_shop_product_image_widget_v1_01039';
const POSITIONS = [
  ['center center','Центр'],['center top','Верх'],['center bottom','Низ'],
  ['left center','Ліво'],['right center','Право'],['left top','Ліво / верх'],['right top','Право / верх'],
  ['left bottom','Ліво / низ'],['right bottom','Право / низ']
];
const ASPECTS = [
  ['auto','Авто / висота'],['1 / 1','1:1'],['4 / 5','4:5'],['3 / 4','3:4'],['4 / 3','4:3'],['16 / 9','16:9']
];

function esc(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function readLocal(){ try { return JSON.parse(localStorage.getItem(STATE_KEY)||'{}') || {}; } catch { return {}; } }
function writeLocal(v){ try { localStorage.setItem(STATE_KEY, JSON.stringify(v||{})); } catch {} }

function selectedElement(getSelection){
  try {
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    return Array.isArray(sel?.elements) ? (sel.elements[0] || null) : null;
  } catch { return null; }
}
function selectedCard(getSelection){ return resolveProductCardRoot01038(selectedElement(getSelection)); }
function media(card){ return card ? resolveProductCardRole01038(card,'media') : null; }
function primary(card){ return card ? resolveProductCardRole01038(card,'image') : null; }
function secondary(card){ return card?.querySelector?.('[data-commerce-role="image-secondary"]') || null; }
function imgUrl(el){
  if (!el) return '';
  if (el instanceof HTMLImageElement) return String(el.getAttribute('src') || el.src || '');
  return String(el.querySelector?.('img')?.getAttribute?.('src') || '');
}
function setImgUrl(el,url){
  if (!el) return;
  const img = el instanceof HTMLImageElement ? el : el.querySelector?.('img');
  if (img) { const next=String(url||'').trim(); if(next) img.setAttribute('src', next); else img.removeAttribute('src'); }
}
function num(v,min,max,fallback){ const n=Number(v); return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback; }

export function productCardImageWidgetHtml01039(){
  const posOptions=POSITIONS.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
  const aspectOptions=ASPECTS.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
  return `
  <div class="st-shop-component-widget st-product-image-widget-01039" data-product-image-widget-01039="1">
    <div class="st-shop-widget-head-01039">
      <div><b>Фото карточки</b><span>Commerce Card → media / image</span></div>
      <label class="st-shop-switch-01039"><input type="checkbox" data-pimg="visible" checked><span>Показувати</span></label>
    </div>
    <div class="st-product-image-preview-01039" data-pimg-preview><span>Вибери commerce-карточку</span></div>

    <div class="design-field">
      <div class="design-field__label">Основне фото</div>
      <input class="design-input" type="text" data-pimg="src" placeholder="assets/... або URL">
    </div>
    <div class="design-field">
      <div class="design-field__label">Друге фото</div>
      <input class="design-input" type="text" data-pimg="src2" placeholder="assets/... або URL">
    </div>

    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Вписування</div><select class="design-input" data-pimg="fit"><option value="cover">Cover</option><option value="contain">Contain</option><option value="fill">Fill</option></select></div>
      <div class="design-field"><div class="design-field__label">Пропорції</div><select class="design-input" data-pimg="aspect">${aspectOptions}</select></div>
    </div>
    <div class="st-shop-two-col-01039">
      <div class="design-field"><div class="design-field__label">Позиція</div><select class="design-input" data-pimg="position">${posOptions}</select></div>
      <div class="design-field"><div class="design-field__label">Фон області</div><input class="design-input" type="color" data-pimg="bg" value="#f3f4f6"></div>
    </div>

    <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Висота</span><b data-pimg-out="height">260 px</b></div><input class="design-slider" type="range" min="120" max="720" step="1" data-pimg="height" value="260"></div>
    <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Масштаб фото</span><b data-pimg-out="scale">100%</b></div><input class="design-slider" type="range" min="60" max="180" step="1" data-pimg="scale" value="100"></div>
    <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Радіус області</span><b data-pimg-out="radius">18 px</b></div><input class="design-slider" type="range" min="0" max="80" step="1" data-pimg="radius" value="18"></div>
    <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Внутрішній відступ</span><b data-pimg-out="padding">0 px</b></div><input class="design-slider" type="range" min="0" max="80" step="1" data-pimg="padding" value="0"></div>

    <label class="st-shop-check-row-01039"><input type="checkbox" data-pimg="hover2"><span><b>Друге фото при наведенні</b><small>Плавно міняє основне фото на друге.</small></span></label>
    <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Швидкість переходу</span><b data-pimg-out="duration">280 ms</b></div><input class="design-slider" type="range" min="80" max="1200" step="20" data-pimg="duration" value="280"></div>
    <div class="st-shop-contract-status" data-pimg-status><b>Фото карточки</b><span>Вибери commerce-карточку на Canvas.</span></div>
  </div>`;
}

function hydrate(panel, getSelection){
  if (!panel) return;
  const card=selectedCard(getSelection), m=media(card), p=primary(card), s=secondary(card);
  const status=panel.querySelector('[data-pimg-status]'), preview=panel.querySelector('[data-pimg-preview]');
  if (!card || !m || !p) {
    panel.querySelectorAll('input,select').forEach(x=>x.disabled=true);
    if(status) status.innerHTML='<b>Фото карточки</b><span>Вибери commerce-карточку з ролями media та image.</span>';
    if(preview) preview.innerHTML='<span>Вибери commerce-карточку</span>';
    return;
  }
  panel.querySelectorAll('input,select').forEach(x=>x.disabled=false);
  const cs=getComputedStyle(m), pcs=getComputedStyle(p);
  const get=(k)=>panel.querySelector(`[data-pimg="${k}"]`);
  const h=Math.round(m.getBoundingClientRect().height || parseFloat(cs.height) || 260);
  const radius=Math.round(parseFloat(cs.borderRadius)||0);
  const pad=Math.round(parseFloat(cs.paddingTop)||0);
  const scale=Math.round(num(card.dataset.commerceImageScale,60,180,100));
  const duration=Math.round(num(card.dataset.commerceImageDuration,80,1200,280));
  const aspect=String(m.style.aspectRatio || 'auto').trim() || 'auto';
  get('visible').checked = card.dataset.commerceImageVisible !== '0';
  get('src').value=imgUrl(p);
  get('src2').value=imgUrl(s);
  get('fit').value=String(pcs.objectFit || p.style.objectFit || 'cover');
  get('position').value=String(pcs.objectPosition || p.style.objectPosition || 'center center');
  get('aspect').value=[...get('aspect').options].some(o=>o.value===aspect)?aspect:'auto';
  get('bg').value=rgbToHex(cs.backgroundColor) || '#f3f4f6';
  get('height').value=String(h);
  get('scale').value=String(scale);
  get('radius').value=String(radius);
  get('padding').value=String(pad);
  get('hover2').checked=card.dataset.commerceHoverSecond==='1';
  get('duration').value=String(duration);
  updateOutputs(panel);
  if(preview){ const u=imgUrl(p); preview.innerHTML=u?`<img src="${esc(u)}" alt="">`:'<span>Фото не задано</span>'; }
  if(status) status.innerHTML=`<b>Фото карточки · готово</b><span>${esc(imgUrl(p)||'Фото не задано')}</span>`;
}

function rgbToHex(v){
  const m=String(v||'').match(/rgba?\((\d+)[, ]+(\d+)[, ]+(\d+)/i); if(!m)return '';
  return '#'+[m[1],m[2],m[3]].map(x=>Number(x).toString(16).padStart(2,'0')).join('');
}
function updateOutputs(panel){
  for(const k of ['height','scale','radius','padding','duration']){
    const el=panel.querySelector(`[data-pimg="${k}"]`), out=panel.querySelector(`[data-pimg-out="${k}"]`); if(!el||!out)continue;
    out.textContent = k==='scale' ? `${el.value}%` : k==='duration' ? `${el.value} ms` : `${el.value} px`;
  }
}
function ensureSecondary(card, src){
  let s=secondary(card); if(s) return s;
  const m=media(card); if(!m) return null;
  s=document.createElement('img');
  s.setAttribute('data-commerce-role','image-secondary');
  s.setAttribute('data-commerce-bind','product.imageSecondary');
  s.setAttribute('alt','Друге фото товару');
  s.className='st-shop-card__image-secondary-01039';
  s.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;opacity:0;transition:opacity 280ms ease;pointer-events:none;';
  s.src=String(src||'');
  m.appendChild(s); return s;
}
function apply(panel,getSelection,notify,{live=false}={}){
  const card=selectedCard(getSelection), m=media(card), p=primary(card); if(!card||!m||!p)return;
  const get=(k)=>panel.querySelector(`[data-pimg="${k}"]`);
  const src=String(get('src')?.value||'').trim(); const src2=String(get('src2')?.value||'').trim();
  const visible=!!get('visible')?.checked; const hover2=!!get('hover2')?.checked;
  const fit=String(get('fit')?.value||'cover'); const position=String(get('position')?.value||'center center');
  const aspect=String(get('aspect')?.value||'auto'); const bg=String(get('bg')?.value||'#f3f4f6');
  const height=num(get('height')?.value,120,720,260); const scale=num(get('scale')?.value,60,180,100);
  const radius=num(get('radius')?.value,0,80,18); const padding=num(get('padding')?.value,0,80,0); const duration=num(get('duration')?.value,80,1200,280);
  card.dataset.commerceImageVisible=visible?'1':'0'; card.dataset.commerceHoverSecond=hover2?'1':'0'; card.dataset.commerceImageScale=String(scale); card.dataset.commerceImageDuration=String(duration);
  m.hidden=!visible;
  m.style.position='relative'; m.style.overflow='hidden'; m.style.background=bg; m.style.borderRadius=`${radius}px`; m.style.padding=`${padding}px`;
  if(aspect==='auto'){ m.style.removeProperty('aspect-ratio'); m.style.height=`${height}px`; } else { m.style.aspectRatio=aspect; m.style.height='auto'; }
  setImgUrl(p,src);
  const primaryImg = p instanceof HTMLImageElement ? p : p.querySelector?.('img');
  if(primaryImg){ primaryImg.style.display=visible?'block':'none'; primaryImg.style.width='100%'; primaryImg.style.height='100%'; primaryImg.style.objectFit=fit; primaryImg.style.objectPosition=position; primaryImg.style.transform=`scale(${scale/100})`; primaryImg.style.transformOrigin=position; primaryImg.style.transition=`opacity ${duration}ms ease, transform 160ms ease`; }
  let s=secondary(card); if(src2 || hover2) s=ensureSecondary(card,src2);
  if(s){ setImgUrl(s,src2); s.style.inset=`${padding}px`; s.style.display=(visible&&src2)?'block':'none'; s.style.objectFit=fit; s.style.objectPosition=position; s.style.transform=`scale(${scale/100})`; s.style.transformOrigin=position; s.style.transition=`opacity ${duration}ms ease, transform 160ms ease`; }
  if(!src2) card.dataset.commerceHoverSecond='0';
  updateOutputs(panel);
  const preview=panel.querySelector('[data-pimg-preview]'); if(preview) preview.innerHTML=src?`<img src="${esc(src)}" alt="">`:'<span>Фото не задано</span>';
  const snapshot={src,src2,visible,fit,position,aspect,bg,height,scale,radius,padding,hover2:card.dataset.commerceHoverSecond==='1',duration};
  if(!live){
    writeLocal(snapshot);
    const committed01041 = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card, 'shop-product-card-image-01041') || null;
    try { window.__ST_ALL_LOG__?.push?.('commerce-product-card-image-commit-01042', { ok: !!committed01041?.ok, nodeId: String(committed01041?.nodeId || ''), storeAuthority: !!committed01041?.ok, domFallback: false }); } catch {}
  }
}

export function bindProductCardImageWidget01039(sectionEl,getSelection,notify){
  const panel=sectionEl?.querySelector?.('[data-product-image-widget-01039]'); if(!panel || panel.dataset.bound==='1') return;
  panel.dataset.bound='1'; let raf=0;
  const live=()=>{ cancelAnimationFrame(raf); raf=requestAnimationFrame(()=>apply(panel,getSelection,notify,{live:true})); };
  panel.addEventListener('input',(ev)=>{ if(ev.target?.matches?.('[data-pimg]')) live(); });
  panel.addEventListener('change',(ev)=>{ if(ev.target?.matches?.('[data-pimg]')) apply(panel,getSelection,notify,{live:false}); });
  const refresh=()=>hydrate(panel,getSelection);
  document.addEventListener('st:selection-changed',refresh,true);
  window.addEventListener('st-page-selected',refresh);
  window.addEventListener('st:canvas-snapshot-applied',refresh);
  window.addEventListener('builder:structureChanged',refresh);
  refresh();
}
