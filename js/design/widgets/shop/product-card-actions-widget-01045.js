// 01045 · Product Card actions widget
// Semantic action configuration for Store-owned Product Card components.
// Visual fill/border/typography remain generic Inspector responsibilities.
import {
  resolveProductCardRoot01038,
  resolveProductCardRole01038
} from './product-card-contract-01038.js?v=01050';

const ACTIONS_01045 = Object.freeze([
  Object.freeze({ role:'add-to-cart', key:'AddToCart', label:'У кошик', icon:'🛒', mode:'text', width:'full', order:10, required:true,  canOrder:true }),
  Object.freeze({ role:'buy-now',     key:'BuyNow',     label:'Купити зараз', icon:'⚡', mode:'text', width:'full', order:20, required:false, canOrder:true }),
  Object.freeze({ role:'wishlist',    key:'Wishlist',   label:'У вибране', icon:'♡', mode:'icon', width:'auto', order:0, required:false, canOrder:false }),
  Object.freeze({ role:'compare',     key:'Compare',    label:'Порівняти', icon:'⇄', mode:'icon', width:'auto', order:30, required:false, canOrder:true }),
  Object.freeze({ role:'quick-view',  key:'QuickView',  label:'Швидкий перегляд', icon:'◉', mode:'icon', width:'auto', order:40, required:false, canOrder:true })
]);

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
function field(panel,roleId,key){ return panel?.querySelector?.(`[data-paction-role="${roleId}"][data-paction="${key}"]`) || null; }
function group(panel,roleId){ return panel?.querySelector?.(`[data-paction-group="${roleId}"]`) || null; }
function dataKey(def,suffix){ return `commerceAction${def.key}${suffix}`; }
function read(card,def,suffix,fallback){
  const v=card?.dataset?.[dataKey(def,suffix)];
  return v == null || v === '' ? String(fallback ?? '') : String(v);
}
function write(card,def,suffix,value){ if (card) card.dataset[dataKey(def,suffix)]=String(value ?? ''); }

function actionGroupHtml01045(def){
  const label=esc(def.label);
  const roleId=esc(def.role);
  return `
    <div class="st-shop-content-group-01042 st-shop-action-group-01045" data-paction-group="${roleId}">
      <div class="st-shop-content-group__title-01042">
        <b>${label}</b>
        <label class="st-shop-switch-01039"><input type="checkbox" data-paction-role="${roleId}" data-paction="visible"><span>Показувати</span></label>
      </div>
      <div class="st-shop-action-missing-01045" data-paction-missing hidden>Цієї optional-ролі немає у вибраному шаблоні.</div>
      <div class="design-field"><div class="design-field__label">Текст</div><input class="design-input" type="text" maxlength="48" data-paction-role="${roleId}" data-paction="label" value="${label}"></div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Іконка</div><input class="design-input" type="text" maxlength="12" data-paction-role="${roleId}" data-paction="icon" value="${esc(def.icon)}"></div>
        <div class="design-field"><div class="design-field__label">Вигляд</div><select class="design-input" data-paction-role="${roleId}" data-paction="mode"><option value="text">Текст</option><option value="icon">Іконка</option><option value="icon-text">Іконка + текст</option></select></div>
      </div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Іконка</div><select class="design-input" data-paction-role="${roleId}" data-paction="icon-position"><option value="before">Перед текстом</option><option value="after">Після тексту</option></select></div>
        <div class="design-field"><div class="design-field__label">Ширина</div><select class="design-input" data-paction-role="${roleId}" data-paction="width"><option value="auto">Авто</option><option value="full">100%</option></select></div>
      </div>
      ${def.canOrder ? `<div class="design-field"><div class="design-field__label">Порядок у блоці кнопок</div><input class="design-input" type="number" min="1" max="99" step="1" data-paction-role="${roleId}" data-paction="order" value="${def.order}"></div>` : ''}
    </div>`;
}

export function productCardActionsWidgetHtml01045(){
  return `
  <div class="st-shop-component-widget st-product-actions-widget-01045" data-product-actions-widget-01045="1">
    <div class="st-shop-widget-head-01039">
      <div><b>Кнопки та дії</b><span>commerce actions · semantic state</span></div>
      <label class="st-shop-switch-01039"><input type="checkbox" data-paction-block-visible><span>Блок кнопок</span></label>
    </div>
    <div class="st-shop-contract-status" data-paction-status>
      <b>Дії</b><span>Виберіть Product Card.</span>
    </div>
    <div class="st-shop-actions-note-01045">Функція дії задається стабільним <b>data-commerce-action</b>. Тут ми налаштовуємо представлення; реальний Cart / Wishlist / Compare підключатиметься до цих action IDs окремим commerce-engine.</div>
    ${ACTIONS_01045.map(actionGroupHtml01045).join('')}
  </div>`;
}

function ensureDefaults01045(card,def,el){
  if (!card || !def || !el) return;
  const visibleFallback=el.hidden ? '0' : '1';
  if (card.dataset[dataKey(def,'Visible')] == null) write(card,def,'Visible',visibleFallback);
  if (card.dataset[dataKey(def,'Label')] == null) write(card,def,'Label',String(el.dataset.commerceActionLabel || el.getAttribute('aria-label') || el.textContent || def.label).trim() || def.label);
  if (card.dataset[dataKey(def,'Icon')] == null) write(card,def,'Icon',String(el.dataset.commerceActionIcon || def.icon));
  if (card.dataset[dataKey(def,'Mode')] == null) write(card,def,'Mode',def.mode);
  if (card.dataset[dataKey(def,'IconPosition')] == null) write(card,def,'IconPosition','before');
  if (card.dataset[dataKey(def,'Width')] == null) write(card,def,'Width',def.width);
  if (def.canOrder && card.dataset[dataKey(def,'Order')] == null) write(card,def,'Order',def.order);
}

function renderAction01045(card,def){
  const el=role(card,def.role);
  if (!el) return false;
  ensureDefaults01045(card,def,el);
  const visible=read(card,def,'Visible','1') !== '0';
  const label=read(card,def,'Label',def.label).trim() || def.label;
  const icon=read(card,def,'Icon',def.icon).trim() || def.icon;
  const mode=read(card,def,'Mode',def.mode);
  const iconPosition=read(card,def,'IconPosition','before');
  const width=read(card,def,'Width',def.width);
  const order=Math.round(num(read(card,def,'Order',def.order),1,99,def.order || 1));

  el.hidden=!visible;
  el.dataset.commerceAction=def.role;
  el.dataset.commerceActionLabel=label;
  el.dataset.commerceActionIcon=icon;
  el.dataset.commerceActionMode=mode;
  el.dataset.commerceActionIconPosition=iconPosition;
  el.dataset.commerceActionWidth=width;
  if (def.canOrder) el.dataset.commerceActionOrder=String(order);
  el.setAttribute('aria-label',label);

  while (el.firstChild) el.removeChild(el.firstChild);
  const iconSpan=document.createElement('span');
  iconSpan.dataset.commerceActionIconSlot='1';
  iconSpan.setAttribute('aria-hidden','true');
  iconSpan.textContent=icon;
  const labelSpan=document.createElement('span');
  labelSpan.dataset.commerceActionLabelSlot='1';
  labelSpan.textContent=label;

  if (mode === 'icon') el.appendChild(iconSpan);
  else if (mode === 'icon-text') {
    if (iconPosition === 'after') { el.appendChild(labelSpan); el.appendChild(iconSpan); }
    else { el.appendChild(iconSpan); el.appendChild(labelSpan); }
  } else el.appendChild(labelSpan);

  el.style.gap=mode === 'icon-text' ? '7px' : '0px';
  el.style.alignItems='center';
  el.style.justifyContent='center';
  if (def.role === 'wishlist') {
    el.style.display='inline-flex';
    el.style.height=el.style.height || '38px';
    if (width === 'full') {
      el.style.width='100%';
      el.style.padding='0 12px';
    } else if (mode === 'icon') {
      el.style.width='38px';
      el.style.padding='0';
    } else {
      el.style.width='auto';
      el.style.padding='0 12px';
    }
  } else {
    el.style.display='inline-flex';
    el.style.minHeight=el.style.minHeight || '45px';
    el.style.width=width === 'full' ? '100%' : (mode === 'icon' ? '45px' : 'auto');
    el.style.padding=mode === 'icon' && width !== 'full' ? '0' : (def.role === 'add-to-cart' ? '11px 16px' : '11px 14px');
    if (def.canOrder) el.style.order=String(order);
  }
  return true;
}

function renderActions01045(card){
  if (!card) return;
  ACTIONS_01045.forEach((def)=>renderAction01045(card,def));
}

function setGroupAvailable01045(panel,def,available){
  const g=group(panel,def.role);
  if (!g) return;
  g.classList.toggle('is-missing',!available);
  const note=g.querySelector('[data-paction-missing]');
  if (note) note.hidden=!!available;
  g.querySelectorAll('[data-paction]').forEach((el)=>{ el.disabled=!available; });
}

function hydrate01045(panel,getSelection){
  const card=selectedCard(getSelection);
  const status=panel?.querySelector?.('[data-paction-status]');
  if (!card) {
    ACTIONS_01045.forEach((def)=>setGroupAvailable01045(panel,def,false));
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Дії</b><span>Виберіть Product Card на Canvas.</span>'; }
    return;
  }
  const actions=role(card,'actions');
  const blockToggle=panel?.querySelector?.('[data-paction-block-visible]') || null;
  if (blockToggle) {
    blockToggle.disabled=!actions;
    const stored=String(card.dataset.commerceActionsVisible ?? '');
    blockToggle.checked=stored === '0' ? false : stored === '1' ? true : !!actions && !actions.hidden;
  }
  const present=[];
  const missing=[];
  ACTIONS_01045.forEach((def)=>{
    const el=role(card,def.role);
    setGroupAvailable01045(panel,def,!!el);
    if (!el) { missing.push(def.role); return; }
    present.push(def.role);
    ensureDefaults01045(card,def,el);
    const visible=field(panel,def.role,'visible'); if (visible) visible.checked=read(card,def,'Visible','1') !== '0';
    const label=field(panel,def.role,'label'); if (label) label.value=read(card,def,'Label',def.label);
    const icon=field(panel,def.role,'icon'); if (icon) icon.value=read(card,def,'Icon',def.icon);
    const mode=field(panel,def.role,'mode'); if (mode) mode.value=read(card,def,'Mode',def.mode);
    const pos=field(panel,def.role,'icon-position'); if (pos) pos.value=read(card,def,'IconPosition','before');
    const width=field(panel,def.role,'width'); if (width) width.value=read(card,def,'Width',def.width);
    const order=field(panel,def.role,'order'); if (order) order.value=String(Math.round(num(read(card,def,'Order',def.order),1,99,def.order)));
  });
  renderActions01045(card);
  if (status) {
    const requiredMissing=ACTIONS_01045.filter((def)=>def.required && !role(card,def.role));
    status.className=`st-shop-contract-status ${requiredMissing.length ? 'is-warning' : (missing.length ? 'is-warning' : 'is-ok')}`;
    status.innerHTML=requiredMissing.length
      ? `<b>Контракт дій неповний</b><span>Відсутні обов’язкові: ${esc(requiredMissing.map((d)=>d.role).join(', '))}</span>`
      : missing.length
        ? `<b>Дії готові частково</b><span>${present.length}/${ACTIONS_01045.length} action-ролей доступно.</span><small>Необов’язкові відсутні: ${esc(missing.join(', '))}</small>`
        : `<b>Дії готові</b><span>${present.length}/${ACTIONS_01045.length} action-ролей підключено до semantic state.</span>`;
  }
  if (!actions && status) {
    status.className='st-shop-contract-status is-warning';
    status.innerHTML='<b>Блок кнопок недоступний</b><span>У шаблоні немає обов’язкової ролі actions.</span>';
  }
}

function apply01045(panel,getSelection,{live=false}={}){
  const card=selectedCard(getSelection);
  if (!card) return;
  const actions=role(card,'actions');
  const blockToggle=panel?.querySelector?.('[data-paction-block-visible]') || null;
  if (actions && blockToggle) {
    card.dataset.commerceActionsVisible=blockToggle.checked ? '1' : '0';
    actions.hidden=!blockToggle.checked;
  }
  ACTIONS_01045.forEach((def)=>{
    const el=role(card,def.role);
    if (!el) return;
    write(card,def,'Visible',field(panel,def.role,'visible')?.checked ? '1' : '0');
    write(card,def,'Label',String(field(panel,def.role,'label')?.value || '').trim() || def.label);
    write(card,def,'Icon',String(field(panel,def.role,'icon')?.value || '').trim() || def.icon);
    write(card,def,'Mode',String(field(panel,def.role,'mode')?.value || def.mode));
    write(card,def,'IconPosition',String(field(panel,def.role,'icon-position')?.value || 'before'));
    write(card,def,'Width',String(field(panel,def.role,'width')?.value || def.width));
    if (def.canOrder) write(card,def,'Order',Math.round(num(field(panel,def.role,'order')?.value,1,99,def.order)));
  });
  renderActions01045(card);

  if (!live) {
    const result=window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card,'shop-product-card-actions-01045') || null;
    try {
      window.__ST_ALL_LOG__?.push?.('commerce-product-card-actions-committed-01045',{
        ok:!!result?.ok,
        nodeId:String(result?.nodeId || ''),
        present:ACTIONS_01045.filter((def)=>!!role(card,def.role)).map((def)=>def.role),
        visible:ACTIONS_01045.filter((def)=>role(card,def.role) && read(card,def,'Visible','1') !== '0').map((def)=>def.role),
        storeAuthority:!!result?.ok,
        directDomFinalCommit:false
      });
    } catch {}
  }
}

export function bindProductCardActionsWidget01045(sectionEl,getSelection,notify){
  const panel=sectionEl?.querySelector?.('[data-product-actions-widget-01045]');
  if (!panel || panel.dataset.bound01045 === '1') return;
  panel.dataset.bound01045='1';
  let raf=0;
  const live=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>apply01045(panel,getSelection,{live:true}));
  };
  panel.addEventListener('input',(ev)=>{
    if (!ev.target?.matches?.('[data-paction],[data-paction-block-visible]')) return;
    live();
  });
  panel.addEventListener('change',(ev)=>{
    if (!ev.target?.matches?.('[data-paction],[data-paction-block-visible]')) return;
    cancelAnimationFrame(raf);
    apply01045(panel,getSelection,{live:false});
  });
  const refresh=()=>hydrate01045(panel,getSelection);
  document.addEventListener('st:selection-changed',refresh,true);
  window.addEventListener('st-page-selected',refresh);
  window.addEventListener('st:canvas-snapshot-applied',refresh);
  window.addEventListener('builder:structureChanged',refresh);
  window.addEventListener('st:commerce-component-template-applied-01041',refresh);
  refresh();
}

export function refreshProductCardActions01045(card){
  const root=resolveProductCardRoot01038(card);
  if (!root) return false;
  renderActions01045(root);
  return true;
}
