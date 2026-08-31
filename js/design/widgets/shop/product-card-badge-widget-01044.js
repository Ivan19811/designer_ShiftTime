// 01044 · Product Card badge/status widget
// Commerce badge semantics only. Visual typography/fill/border remain generic Inspector responsibilities.
import {
  resolveProductCardRoot01038,
  resolveProductCardRole01038
} from './product-card-contract-01038.js?v=01050';

function esc(v){
  return String(v ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
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
function field(panel,key){ return panel?.querySelector?.(`[data-pbadge="${key}"]`) || null; }
function out(panel,key){ return panel?.querySelector?.(`[data-pbadge-out="${key}"]`) || null; }

function discountPercent01044(card){
  const current=num(card?.dataset?.commercePriceCurrent,0,999999999,0);
  const old=num(card?.dataset?.commercePriceOld,0,999999999,0);
  if (!(old > current && old > 0)) return 0;
  return Math.max(0,Math.min(100,Math.round(((old-current)/old)*100)));
}
function badgeText01044(card){
  const mode=String(card?.dataset?.commerceBadgeMode || 'hit');
  if (mode === 'new') return 'NEW';
  if (mode === 'sale') return 'SALE';
  if (mode === 'discount') return `−${discountPercent01044(card)}%`;
  if (mode === 'custom') return String(card?.dataset?.commerceBadgeCustom || '').trim() || 'МІТКА';
  return 'ХІТ';
}
function setBadgePosition01044(card,badge){
  if (!card || !badge) return;
  const position=String(card.dataset.commerceBadgePosition || 'top-left');
  const x=Math.round(num(card.dataset.commerceBadgeOffsetX,0,100,14));
  const y=Math.round(num(card.dataset.commerceBadgeOffsetY,0,100,14));
  badge.style.left='auto';
  badge.style.right='auto';
  badge.style.top='auto';
  badge.style.bottom='auto';
  if (position.includes('top')) badge.style.top=`${y}px`;
  else badge.style.bottom=`${y}px`;
  if (position.includes('left')) badge.style.left=`${x}px`;
  else badge.style.right=`${x}px`;
}
function renderBadge01044(card){
  if (!card) return;
  const badge=role(card,'badge');
  if (!badge) return;
  const visible=String(card.dataset.commerceBadgeVisible ?? '1') !== '0';
  badge.hidden=!visible;
  badge.textContent=badgeText01044(card);
  setBadgePosition01044(card,badge);
}
function setDisabled01044(panel,disabled){
  panel?.querySelectorAll?.('[data-pbadge]')?.forEach?.((el)=>{ el.disabled=!!disabled; });
}
function updateConditionalUi01044(panel){
  const wrap=panel?.querySelector?.('[data-pbadge-custom-wrap]');
  if (wrap) wrap.hidden=String(field(panel,'mode')?.value || 'hit') !== 'custom';
}
function updateOutput01044(panel,card){
  const target=out(panel,'preview');
  if (!target) return;
  target.textContent=card ? badgeText01044(card) : '—';
}

export function productCardBadgeWidgetHtml01044(){
  return `
  <div class="st-shop-component-widget st-product-badge-widget-01044" data-product-badge-widget-01044="1">
    <div class="st-shop-widget-head-01039">
      <div><b>Badge / статуси</b><span>badge · semantic state</span></div>
    </div>

    <div class="st-shop-contract-status" data-pbadge-status>
      <b>Badge</b><span>Виберіть commerce-карточку.</span>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Мітка карточки</b><label class="st-shop-switch-01039"><input type="checkbox" data-pbadge="visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Тип</div><select class="design-input" data-pbadge="mode"><option value="hit">ХІТ</option><option value="new">NEW</option><option value="sale">SALE</option><option value="discount">Авто · −% від ціни</option><option value="custom">Власний текст</option></select></div>
      <div class="design-field" data-pbadge-custom-wrap><div class="design-field__label">Власний текст</div><input class="design-input" type="text" maxlength="40" data-pbadge="custom" placeholder="Наприклад: TOP продажів"></div>
      <div class="st-shop-badge-preview-01044"><span>Текст мітки</span><b data-pbadge-out="preview">ХІТ</b></div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Позиція</b></div>
      <div class="design-field"><div class="design-field__label">Кут</div><select class="design-input" data-pbadge="position"><option value="top-left">Зверху · зліва</option><option value="top-right">Зверху · справа</option><option value="bottom-left">Знизу · зліва</option><option value="bottom-right">Знизу · справа</option></select></div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Відступ X</div><input class="design-input" type="number" min="0" max="100" step="1" data-pbadge="offset-x" value="14"></div>
        <div class="design-field"><div class="design-field__label">Відступ Y</div><input class="design-input" type="number" min="0" max="100" step="1" data-pbadge="offset-y" value="14"></div>
      </div>
      <div class="st-shop-badge-note-01044">Колір, шрифт, радіус, рамка й тінь залишаються у стандартних віджетах Inspector. Цей віджет керує лише змістом і розташуванням badge.</div>
    </div>
  </div>`;
}

function hydrate01044(panel,getSelection){
  const card=selectedCard(getSelection);
  const status=panel?.querySelector?.('[data-pbadge-status]');
  if (!card) {
    setDisabled01044(panel,true);
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Badge</b><span>Виберіть commerce-карточку на Canvas.</span>'; }
    updateOutput01044(panel,null);
    return;
  }
  const badge=role(card,'badge');
  if (!badge) {
    setDisabled01044(panel,true);
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Badge недоступний</b><span>У цьому шаблоні немає необов’язкової ролі badge.</span>'; }
    updateOutput01044(panel,null);
    return;
  }
  setDisabled01044(panel,false);
  if (!card.dataset.commerceBadgeVisible) card.dataset.commerceBadgeVisible=badge.hidden ? '0' : '1';
  if (!card.dataset.commerceBadgeMode) {
    const text=String(badge.textContent || '').trim().toUpperCase();
    card.dataset.commerceBadgeMode=text === 'NEW' ? 'new' : text === 'SALE' ? 'sale' : /^[-−]?\d+%$/.test(text) ? 'discount' : text === 'ХІТ' ? 'hit' : 'custom';
    if (card.dataset.commerceBadgeMode === 'custom') card.dataset.commerceBadgeCustom=String(badge.textContent || '').trim();
  }
  if (card.dataset.commerceBadgeCustom == null) card.dataset.commerceBadgeCustom='';
  if (!card.dataset.commerceBadgePosition) card.dataset.commerceBadgePosition='top-left';
  if (!card.dataset.commerceBadgeOffsetX) card.dataset.commerceBadgeOffsetX='14';
  if (!card.dataset.commerceBadgeOffsetY) card.dataset.commerceBadgeOffsetY='14';

  field(panel,'visible').checked=String(card.dataset.commerceBadgeVisible || '1') !== '0';
  field(panel,'mode').value=String(card.dataset.commerceBadgeMode || 'hit');
  field(panel,'custom').value=String(card.dataset.commerceBadgeCustom || '');
  field(panel,'position').value=String(card.dataset.commerceBadgePosition || 'top-left');
  field(panel,'offset-x').value=String(Math.round(num(card.dataset.commerceBadgeOffsetX,0,100,14)));
  field(panel,'offset-y').value=String(Math.round(num(card.dataset.commerceBadgeOffsetY,0,100,14)));
  renderBadge01044(card);
  updateConditionalUi01044(panel);
  updateOutput01044(panel,card);
  if (status) {
    status.className='st-shop-contract-status is-ok';
    status.innerHTML='<b>Badge готовий</b><span>Мітка підключена до semantic state commerce-карточки.</span>';
  }
}

function apply01044(panel,getSelection,{live=false}={}){
  const card=selectedCard(getSelection);
  if (!card) return;
  const badge=role(card,'badge');
  if (!badge) return;

  card.dataset.commerceBadgeVisible=field(panel,'visible')?.checked ? '1' : '0';
  card.dataset.commerceBadgeMode=String(field(panel,'mode')?.value || 'hit');
  card.dataset.commerceBadgeCustom=String(field(panel,'custom')?.value || '').trim();
  card.dataset.commerceBadgePosition=String(field(panel,'position')?.value || 'top-left');
  card.dataset.commerceBadgeOffsetX=String(Math.round(num(field(panel,'offset-x')?.value,0,100,14)));
  card.dataset.commerceBadgeOffsetY=String(Math.round(num(field(panel,'offset-y')?.value,0,100,14)));

  renderBadge01044(card);
  updateConditionalUi01044(panel);
  updateOutput01044(panel,card);

  if (!live) {
    const result=window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card,'shop-product-card-badge-01044') || null;
    try {
      window.__ST_ALL_LOG__?.push?.('commerce-product-card-badge-committed-01044',{
        ok:!!result?.ok,
        nodeId:String(result?.nodeId || ''),
        visible:String(card.dataset.commerceBadgeVisible || '1') !== '0',
        mode:String(card.dataset.commerceBadgeMode || ''),
        position:String(card.dataset.commerceBadgePosition || ''),
        text:badgeText01044(card),
        storeAuthority:!!result?.ok,
        directDomFinalCommit:false
      });
    } catch {}
  }
}

export function bindProductCardBadgeWidget01044(sectionEl,getSelection,notify){
  const panel=sectionEl?.querySelector?.('[data-product-badge-widget-01044]');
  if (!panel || panel.dataset.bound01044 === '1') return;
  panel.dataset.bound01044='1';
  let raf=0;
  const live=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>apply01044(panel,getSelection,{live:true}));
  };
  panel.addEventListener('input',(ev)=>{
    if (!ev.target?.matches?.('[data-pbadge]')) return;
    live();
    updateConditionalUi01044(panel);
  });
  panel.addEventListener('change',(ev)=>{
    if (!ev.target?.matches?.('[data-pbadge]')) return;
    cancelAnimationFrame(raf);
    apply01044(panel,getSelection,{live:false});
  });

  const refresh=()=>hydrate01044(panel,getSelection);
  const priceSync=(ev)=>{
    const card=selectedCard(getSelection);
    if (!card) return;
    if (ev?.detail?.card && ev.detail.card !== card) return;
    if (String(card.dataset.commerceBadgeMode || '') !== 'discount') return;
    renderBadge01044(card);
    updateOutput01044(panel,card);
  };
  document.addEventListener('st:selection-changed',refresh,true);
  window.addEventListener('st-page-selected',refresh);
  window.addEventListener('st:canvas-snapshot-applied',refresh);
  window.addEventListener('builder:structureChanged',refresh);
  window.addEventListener('st:commerce-component-template-applied-01041',refresh);
  window.addEventListener('st:commerce-product-card-price-updated-01044',priceSync);
  refresh();
}

export function refreshProductCardBadge01044(card){
  const root=resolveProductCardRoot01038(card);
  if (!root) return false;
  renderBadge01044(root);
  return true;
}
