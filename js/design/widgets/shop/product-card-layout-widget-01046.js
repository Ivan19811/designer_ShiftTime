// 01046 · Product Card layout widget
// Structural layout state for Store-owned Product Card components.
// No template-specific selectors: semantic commerce roles + authored component root only.
import {
  resolveProductCardRoot01038,
  resolveProductCardRole01038
} from './product-card-contract-01038.js?v=01050';

const MODES_01046 = Object.freeze([
  Object.freeze({ value:'vertical', label:'Вертикальна · фото зверху' }),
  Object.freeze({ value:'horizontal-left', label:'Горизонтальна · фото зліва' }),
  Object.freeze({ value:'horizontal-right', label:'Горизонтальна · фото справа' })
]);

const DENSITY_01046 = Object.freeze({
  compact: Object.freeze({ bodyPadding:14, bodyGap:7, sectionGap:0 }),
  standard: Object.freeze({ bodyPadding:20, bodyGap:10, sectionGap:0 }),
  spacious: Object.freeze({ bodyPadding:28, bodyGap:14, sectionGap:0 })
});

function esc(v){
  return String(v ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function num(v,min,max,fallback){
  const n=Number(v);
  return Number.isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
}
function selectedElement(getSelection){
  try {
    const sel=typeof getSelection === 'function' ? getSelection() : null;
    return Array.isArray(sel?.elements) ? (sel.elements[0] || null) : null;
  } catch { return null; }
}
function selectedCard(getSelection){ return resolveProductCardRoot01038(selectedElement(getSelection)); }
function role(card,id){ return card ? resolveProductCardRole01038(card,id) : null; }
function surface(card){
  if (!card) return null;
  return role(card,'surface') || card.querySelector?.('[data-shop-card-inner="product"]') || card;
}
function field(panel,key){ return panel?.querySelector?.(`[data-playout="${key}"]`) || null; }
function out(panel,key){ return panel?.querySelector?.(`[data-playout-out="${key}"]`) || null; }
function b(v,fallback=false){
  if (v == null || v === '') return !!fallback;
  return String(v) !== '0' && String(v).toLowerCase() !== 'false';
}

export function productCardLayoutWidgetHtml01046(){
  const modeOptions=MODES_01046.map((x)=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('');
  return `
  <div class="st-shop-component-widget st-product-layout-widget-01046" data-product-layout-widget-01046="1">
    <div class="st-shop-widget-head-01039">
      <div><b>Layout карточки</b><span>Commerce Card → surface / media / body</span></div>
    </div>

    <div class="st-shop-contract-status" data-playout-status>
      <b>Layout</b><span>Виберіть commerce-карточку на Canvas.</span>
    </div>

    <div class="design-field">
      <div class="design-field__label">Композиція</div>
      <select class="design-input" data-playout="mode">${modeOptions}</select>
    </div>

    <div class="design-field">
      <div class="design-field__label">Щільність</div>
      <select class="design-input" data-playout="density">
        <option value="compact">Компактна</option>
        <option value="standard">Стандартна</option>
        <option value="spacious">Простора</option>
        <option value="custom">Власна</option>
      </select>
    </div>

    <div class="st-shop-two-col-01039">
      <div class="design-field">
        <div class="design-field__label">Ширина карточки</div>
        <select class="design-input" data-playout="width-mode">
          <option value="max">До максимальної</option>
          <option value="full">100% контейнера</option>
        </select>
      </div>
      <div class="design-field">
        <div class="design-field__label">Висота</div>
        <select class="design-input" data-playout="height-mode">
          <option value="auto">Авто</option>
          <option value="min">Мінімальна</option>
          <option value="fixed">Фіксована</option>
        </select>
      </div>
    </div>

    <div class="design-field">
      <div class="design-field__label st-pimg-label-row"><span>Макс. ширина</span><b data-playout-out="max-width">380 px</b></div>
      <input class="design-slider" type="range" min="220" max="1200" step="10" value="380" data-playout="max-width">
    </div>

    <div class="design-field">
      <div class="design-field__label st-pimg-label-row"><span>Висота карточки</span><b data-playout-out="height">420 px</b></div>
      <input class="design-slider" type="range" min="240" max="1000" step="10" value="420" data-playout="height">
    </div>

    <div class="st-shop-layout-horizontal-01046" data-playout-horizontal>
      <div class="design-field">
        <div class="design-field__label st-pimg-label-row"><span>Частка фото</span><b data-playout-out="media-share">44%</b></div>
        <input class="design-slider" type="range" min="25" max="70" step="1" value="44" data-playout="media-share">
      </div>
      <div class="design-field">
        <div class="design-field__label st-pimg-label-row"><span>Мін. ширина контенту для переносу</span><b data-playout-out="content-min">170 px</b></div>
        <input class="design-slider" type="range" min="120" max="420" step="10" value="170" data-playout="content-min">
      </div>
      <label class="st-shop-check-row-01039"><input type="checkbox" data-playout="wrap" checked><span><b>Автоматично переносити</b><small>Коли місця мало, media та content переходять у два рядки без media-query.</small></span></label>
    </div>

    <div class="design-field">
      <div class="design-field__label st-pimg-label-row"><span>Відступ контенту</span><b data-playout-out="body-padding">20 px</b></div>
      <input class="design-slider" type="range" min="0" max="64" step="1" value="20" data-playout="body-padding">
    </div>
    <div class="design-field">
      <div class="design-field__label st-pimg-label-row"><span>Відстань між блоками контенту</span><b data-playout-out="body-gap">10 px</b></div>
      <input class="design-slider" type="range" min="0" max="40" step="1" value="10" data-playout="body-gap">
    </div>
    <div class="design-field">
      <div class="design-field__label st-pimg-label-row"><span>Відстань між фото і контентом</span><b data-playout-out="section-gap">0 px</b></div>
      <input class="design-slider" type="range" min="0" max="48" step="1" value="0" data-playout="section-gap">
    </div>

    <div class="design-field">
      <div class="design-field__label">Вирівнювання контенту</div>
      <select class="design-input" data-playout="align">
        <option value="left">Ліворуч</option>
        <option value="center">По центру</option>
        <option value="right">Праворуч</option>
      </select>
    </div>

    <div class="st-shop-layout-note-01046">Рамка, фон, радіус, тінь і типографіка залишаються у стандартному Inspector. Layout-віджет змінює тільки структуру Commerce Card.</div>
  </div>`;
}

function ensureDefaults01046(card){
  if (!card) return;
  const s=surface(card), body=role(card,'body');
  const computed=getComputedStyle(card);
  if (!card.dataset.commerceLayoutMode) card.dataset.commerceLayoutMode='vertical';
  if (!card.dataset.commerceLayoutDensity) card.dataset.commerceLayoutDensity='standard';
  if (!card.dataset.commerceLayoutWidthMode) card.dataset.commerceLayoutWidthMode='max';
  if (!card.dataset.commerceLayoutMaxWidth) {
    const mw=parseFloat(computed.maxWidth);
    card.dataset.commerceLayoutMaxWidth=String(Number.isFinite(mw) && mw > 0 ? Math.round(mw) : 380);
  }
  if (!card.dataset.commerceLayoutHeightMode) card.dataset.commerceLayoutHeightMode='auto';
  if (!card.dataset.commerceLayoutHeight) {
    const h=Math.round(card.getBoundingClientRect().height || 420);
    card.dataset.commerceLayoutHeight=String(Math.max(240,h));
  }
  if (!card.dataset.commerceLayoutMediaShare) card.dataset.commerceLayoutMediaShare='44';
  if (!card.dataset.commerceLayoutContentMin) card.dataset.commerceLayoutContentMin='170';
  if (card.dataset.commerceLayoutWrap == null) card.dataset.commerceLayoutWrap='1';
  if (!card.dataset.commerceLayoutBodyPadding) {
    const pad=parseFloat(getComputedStyle(body || s || card).paddingTop);
    card.dataset.commerceLayoutBodyPadding=String(Number.isFinite(pad) ? Math.round(pad) : 20);
  }
  if (!card.dataset.commerceLayoutBodyGap) {
    const gap=parseFloat(getComputedStyle(body || s || card).gap);
    card.dataset.commerceLayoutBodyGap=String(Number.isFinite(gap) ? Math.round(gap) : 10);
  }
  if (!card.dataset.commerceLayoutSectionGap) card.dataset.commerceLayoutSectionGap='0';
  if (!card.dataset.commerceLayoutAlign) card.dataset.commerceLayoutAlign='left';
}

function modeIsHorizontal(mode){ return String(mode || '').startsWith('horizontal-'); }
function justifyForAlign(align){ return align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'; }

function renderLayout01046(card){
  if (!card) return false;
  ensureDefaults01046(card);
  const s=surface(card), media=role(card,'media'), body=role(card,'body');
  if (!s || !media || !body) return false;

  const mode=String(card.dataset.commerceLayoutMode || 'vertical');
  const widthMode=String(card.dataset.commerceLayoutWidthMode || 'max');
  const maxWidth=Math.round(num(card.dataset.commerceLayoutMaxWidth,220,1200,380));
  const heightMode=String(card.dataset.commerceLayoutHeightMode || 'auto');
  const height=Math.round(num(card.dataset.commerceLayoutHeight,240,1000,420));
  const mediaShare=Math.round(num(card.dataset.commerceLayoutMediaShare,25,70,44));
  const contentMin=Math.round(num(card.dataset.commerceLayoutContentMin,120,420,170));
  const wrap=b(card.dataset.commerceLayoutWrap,true);
  const bodyPadding=Math.round(num(card.dataset.commerceLayoutBodyPadding,0,64,20));
  const bodyGap=Math.round(num(card.dataset.commerceLayoutBodyGap,0,40,10));
  const sectionGap=Math.round(num(card.dataset.commerceLayoutSectionGap,0,48,0));
  const align=String(card.dataset.commerceLayoutAlign || 'left');
  const horizontal=modeIsHorizontal(mode);

  card.style.boxSizing='border-box';
  card.style.minWidth='0';
  card.style.marginLeft='auto';
  card.style.marginRight='auto';
  if (widthMode === 'full') {
    card.style.width='100%';
    card.style.maxWidth='none';
  } else {
    card.style.width=`min(100%, ${maxWidth}px)`;
    card.style.maxWidth=`${maxWidth}px`;
  }
  if (heightMode === 'fixed') {
    card.style.height=`${height}px`;
    card.style.minHeight='0';
  } else if (heightMode === 'min') {
    card.style.height='auto';
    card.style.minHeight=`${height}px`;
  } else {
    card.style.height='auto';
    card.style.minHeight='0';
  }

  s.dataset.commerceRole=s.dataset.commerceRole || 'surface';
  s.style.boxSizing='border-box';
  s.style.width='100%';
  s.style.height=heightMode === 'fixed' ? '100%' : 'auto';
  s.style.gap=`${sectionGap}px`;
  s.style.alignItems='stretch';
  s.style.alignContent='stretch';

  if (!horizontal) {
    s.style.display='flex';
    s.style.flexDirection='column';
    s.style.flexWrap='nowrap';
    media.style.order='1';
    media.style.width='100%';
    media.style.flex='0 0 auto';
    media.style.alignSelf='stretch';
    body.style.order='2';
    body.style.width='100%';
    body.style.flex='1 1 auto';
    body.style.minWidth='0';
  } else {
    s.style.display='flex';
    s.style.flexDirection='row';
    s.style.flexWrap=wrap ? 'wrap' : 'nowrap';
    const mediaOrder=mode === 'horizontal-right' ? 2 : 1;
    const bodyOrder=mode === 'horizontal-right' ? 1 : 2;
    media.style.order=String(mediaOrder);
    media.style.width='auto';
    media.style.flex=`1 1 ${mediaShare}%`;
    media.style.minWidth='120px';
    media.style.alignSelf='stretch';
    body.style.order=String(bodyOrder);
    body.style.width='auto';
    body.style.flex=`999 1 ${contentMin}px`;
    body.style.minWidth=`min(100%, ${contentMin}px)`;
  }

  body.style.boxSizing='border-box';
  body.style.padding=`${bodyPadding}px`;
  body.style.gap=`${bodyGap}px`;
  body.style.textAlign=align;
  body.style.alignContent='start';

  const price=role(card,'price-group');
  if (price) price.style.justifyContent=justifyForAlign(align);
  const actions=role(card,'actions');
  if (actions) actions.style.justifyContent=justifyForAlign(align);

  return true;
}

function updateConditionalUi01046(panel){
  const mode=String(field(panel,'mode')?.value || 'vertical');
  const horizontal=panel?.querySelector?.('[data-playout-horizontal]');
  if (horizontal) horizontal.hidden=!modeIsHorizontal(mode);
  const heightMode=String(field(panel,'height-mode')?.value || 'auto');
  const heightInput=field(panel,'height');
  if (heightInput) heightInput.disabled=heightMode === 'auto';
  const maxWidth=field(panel,'max-width');
  if (maxWidth) maxWidth.disabled=String(field(panel,'width-mode')?.value || 'max') === 'full';
}

function updateOutputs01046(panel){
  const vals=[
    ['max-width','px'],['height','px'],['media-share','%'],['content-min','px'],
    ['body-padding','px'],['body-gap','px'],['section-gap','px']
  ];
  vals.forEach(([key,unit])=>{
    const o=out(panel,key), f=field(panel,key);
    if (o && f) o.textContent=`${f.value} ${unit}`;
  });
}

function hydrate01046(panel,getSelection){
  const card=selectedCard(getSelection);
  const status=panel?.querySelector?.('[data-playout-status]');
  if (!card) {
    panel?.querySelectorAll?.('input,select').forEach((el)=>{ el.disabled=true; });
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Layout</b><span>Виберіть commerce-карточку на Canvas.</span>'; }
    return;
  }
  ensureDefaults01046(card);
  const s=surface(card), media=role(card,'media'), body=role(card,'body');
  if (!s || !media || !body) {
    panel?.querySelectorAll?.('input,select').forEach((el)=>{ el.disabled=true; });
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Layout недоступний</b><span>Шаблон повинен мати surface, media та body.</span>'; }
    return;
  }
  panel?.querySelectorAll?.('input,select').forEach((el)=>{ el.disabled=false; });
  field(panel,'mode').value=String(card.dataset.commerceLayoutMode || 'vertical');
  field(panel,'density').value=String(card.dataset.commerceLayoutDensity || 'standard');
  field(panel,'width-mode').value=String(card.dataset.commerceLayoutWidthMode || 'max');
  field(panel,'max-width').value=String(Math.round(num(card.dataset.commerceLayoutMaxWidth,220,1200,380)));
  field(panel,'height-mode').value=String(card.dataset.commerceLayoutHeightMode || 'auto');
  field(panel,'height').value=String(Math.round(num(card.dataset.commerceLayoutHeight,240,1000,420)));
  field(panel,'media-share').value=String(Math.round(num(card.dataset.commerceLayoutMediaShare,25,70,44)));
  field(panel,'content-min').value=String(Math.round(num(card.dataset.commerceLayoutContentMin,120,420,170)));
  field(panel,'wrap').checked=b(card.dataset.commerceLayoutWrap,true);
  field(panel,'body-padding').value=String(Math.round(num(card.dataset.commerceLayoutBodyPadding,0,64,20)));
  field(panel,'body-gap').value=String(Math.round(num(card.dataset.commerceLayoutBodyGap,0,40,10)));
  field(panel,'section-gap').value=String(Math.round(num(card.dataset.commerceLayoutSectionGap,0,48,0)));
  field(panel,'align').value=String(card.dataset.commerceLayoutAlign || 'left');
  updateConditionalUi01046(panel);
  updateOutputs01046(panel);
  if (status) {
    status.className='st-shop-contract-status is-ok';
    status.innerHTML=`<b>Layout готовий</b><span>${esc(MODES_01046.find((x)=>x.value===card.dataset.commerceLayoutMode)?.label || 'Вертикальна')} · Store-owned semantic state.</span>`;
  }
}

function applyDensity01046(panel){
  const density=String(field(panel,'density')?.value || 'custom');
  const preset=DENSITY_01046[density];
  if (!preset) return;
  field(panel,'body-padding').value=String(preset.bodyPadding);
  field(panel,'body-gap').value=String(preset.bodyGap);
  field(panel,'section-gap').value=String(preset.sectionGap);
}

function markCustomDensity01046(panel,changedKey){
  if (!['body-padding','body-gap','section-gap'].includes(changedKey)) return;
  const density=field(panel,'density');
  if (density) density.value='custom';
}

function readPanelIntoCard01046(panel,card){
  card.dataset.commerceLayoutMode=String(field(panel,'mode')?.value || 'vertical');
  card.dataset.commerceLayoutDensity=String(field(panel,'density')?.value || 'custom');
  card.dataset.commerceLayoutWidthMode=String(field(panel,'width-mode')?.value || 'max');
  card.dataset.commerceLayoutMaxWidth=String(Math.round(num(field(panel,'max-width')?.value,220,1200,380)));
  card.dataset.commerceLayoutHeightMode=String(field(panel,'height-mode')?.value || 'auto');
  card.dataset.commerceLayoutHeight=String(Math.round(num(field(panel,'height')?.value,240,1000,420)));
  card.dataset.commerceLayoutMediaShare=String(Math.round(num(field(panel,'media-share')?.value,25,70,44)));
  card.dataset.commerceLayoutContentMin=String(Math.round(num(field(panel,'content-min')?.value,120,420,170)));
  card.dataset.commerceLayoutWrap=field(panel,'wrap')?.checked ? '1' : '0';
  card.dataset.commerceLayoutBodyPadding=String(Math.round(num(field(panel,'body-padding')?.value,0,64,20)));
  card.dataset.commerceLayoutBodyGap=String(Math.round(num(field(panel,'body-gap')?.value,0,40,10)));
  card.dataset.commerceLayoutSectionGap=String(Math.round(num(field(panel,'section-gap')?.value,0,48,0)));
  card.dataset.commerceLayoutAlign=String(field(panel,'align')?.value || 'left');
}

function apply01046(panel,getSelection,{live=false}={}){
  const card=selectedCard(getSelection);
  if (!card) return;
  readPanelIntoCard01046(panel,card);
  renderLayout01046(card);
  updateConditionalUi01046(panel);
  updateOutputs01046(panel);

  if (!live) {
    const result=window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card,'shop-product-card-layout-01046') || null;
    try {
      window.__ST_ALL_LOG__?.push?.('commerce-product-card-layout-committed-01046',{
        ok:!!result?.ok,
        nodeId:String(result?.nodeId || ''),
        mode:String(card.dataset.commerceLayoutMode || ''),
        density:String(card.dataset.commerceLayoutDensity || ''),
        widthMode:String(card.dataset.commerceLayoutWidthMode || ''),
        maxWidth:Number(card.dataset.commerceLayoutMaxWidth || 0),
        heightMode:String(card.dataset.commerceLayoutHeightMode || ''),
        mediaShare:Number(card.dataset.commerceLayoutMediaShare || 0),
        wrap:b(card.dataset.commerceLayoutWrap,true),
        storeAuthority:!!result?.ok,
        directDomFinalCommit:false
      });
    } catch {}
  }
}

export function bindProductCardLayoutWidget01046(sectionEl,getSelection,notify){
  const panel=sectionEl?.querySelector?.('[data-product-layout-widget-01046]');
  if (!panel || panel.dataset.bound01046 === '1') return;
  panel.dataset.bound01046='1';
  let raf=0;
  const live=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>apply01046(panel,getSelection,{live:true}));
  };
  const onValue=(ev,isFinal)=>{
    const target=ev.target;
    if (!target?.matches?.('[data-playout]')) return;
    const key=String(target.dataset.playout || '');
    if (key === 'density' && isFinal) applyDensity01046(panel);
    else markCustomDensity01046(panel,key);
    updateConditionalUi01046(panel);
    updateOutputs01046(panel);
    if (isFinal) {
      cancelAnimationFrame(raf);
      apply01046(panel,getSelection,{live:false});
    } else live();
  };
  panel.addEventListener('input',(ev)=>onValue(ev,false));
  panel.addEventListener('change',(ev)=>onValue(ev,true));
  const refresh=()=>hydrate01046(panel,getSelection);
  document.addEventListener('st:selection-changed',refresh,true);
  window.addEventListener('st-page-selected',refresh);
  window.addEventListener('st:canvas-snapshot-applied',refresh);
  window.addEventListener('builder:structureChanged',refresh);
  window.addEventListener('st:commerce-component-template-applied-01041',refresh);
  refresh();
}

export function refreshProductCardLayout01046(card){
  const root=resolveProductCardRoot01038(card);
  if (!root) return false;
  return renderLayout01046(root);
}
