// 01064 · Commerce Card ↔ MarketplaceStore binding Inspector.
// This widget never imports a repository or storage adapter. It talks only to the 01064 binding runtime API.
import { resolveCommerceCardRoot01050, getCommerceCardType01050 } from './product-card-contract-01038.js?v=01050';

const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function selectedCard(getSelection){try{const s=typeof getSelection==='function'?getSelection():null;const el=Array.isArray(s?.elements)?s.elements[0]:null;return resolveCommerceCardRoot01050(el);}catch{return null;}}
function api(){return window.ST_COMMERCE_BINDING_01064||null;}
function typeLabel(type){return type==='category-card'?'Category Card':'Product Card';}
function entityLabel(type){return type==='category-card'?'категорію':'товар';}

export function commerceCardBindingWidgetHtml01064(){return `
<style>
[data-commerce-binding-widget-01064]{display:grid;gap:10px;padding:13px;border:1px solid rgba(56,189,248,.26);border-radius:15px;background:linear-gradient(135deg,rgba(8,47,73,.38),rgba(15,23,42,.68));box-shadow:0 14px 34px rgba(0,0,0,.12)}
[data-commerce-binding-widget-01064] .st-cbind-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.st-cbind-head>div{display:grid;gap:2px}.st-cbind-head b{font-size:12px;color:#f8fafc}.st-cbind-head span{font-size:9px;color:#94a3b8;line-height:1.3}.st-cbind-pill{flex:0 0 auto;padding:5px 8px;border-radius:999px;border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.64);color:#cbd5e1!important;font-size:9px!important;font-weight:900}.st-cbind-pill.is-live{border-color:rgba(74,222,128,.32);background:rgba(22,101,52,.20);color:#86efac!important}.st-cbind-pill.is-missing{border-color:rgba(248,113,113,.34);background:rgba(127,29,29,.20);color:#fca5a5!important}
[data-commerce-binding-widget-01064] .st-cbind-row{display:grid;grid-template-columns:1fr;gap:6px}.st-cbind-row label{font-size:9px;font-weight:850;color:#94a3b8;letter-spacing:.04em;text-transform:uppercase}.st-cbind-row select{width:100%;min-width:0;border:1px solid rgba(148,163,184,.22);border-radius:10px;background:#0f172a;color:#e2e8f0;padding:8px 9px;font-size:11px;font-weight:750}
[data-commerce-binding-widget-01064] .st-cbind-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.st-cbind-actions button{appearance:none;min-height:34px;border-radius:10px;border:1px solid rgba(148,163,184,.18);background:rgba(30,41,59,.76);color:#dbeafe;font-size:10px;font-weight:900;cursor:pointer}.st-cbind-actions button:hover{border-color:rgba(125,211,252,.45);background:rgba(14,116,144,.22)}.st-cbind-actions .is-primary{background:linear-gradient(135deg,#0284c7,#4f46e5);border-color:transparent;color:#fff}.st-cbind-actions .is-danger{color:#fecaca;border-color:rgba(248,113,113,.24)}.st-cbind-actions button:disabled{opacity:.42;cursor:not-allowed}
[data-commerce-binding-widget-01064] .st-cbind-preview{display:grid;grid-template-columns:auto 1fr;gap:5px 8px;padding:8px 9px;border-radius:10px;background:rgba(2,6,23,.42);border:1px solid rgba(148,163,184,.10);font-size:9px}.st-cbind-preview code{color:#7dd3fc;white-space:nowrap}.st-cbind-preview b{color:#e2e8f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.st-cbind-note{font-size:9px!important;color:#94a3b8!important;line-height:1.45!important;margin:0}
</style>
<div class="st-shop-component-widget" data-commerce-binding-widget-01064="1">
  <div class="st-cbind-head"><div><b>Дані Marketplace · 01064</b><span>Card → canonical binding → MarketplaceStore</span></div><span class="st-cbind-pill" data-cbind="status">НЕ ВИБРАНО</span></div>
  <div class="st-cbind-row"><label data-cbind="entity-label">Товар Marketplace</label><select data-cbind="entity"><option value="">— Виберіть карточку на Canvas —</option></select></div>
  <div class="st-cbind-preview" data-cbind="preview"><code>component</code><b>—</b><code>entity</code><b>—</b><code>source</code><b>MarketplaceStore</b></div>
  <div class="st-cbind-actions"><button type="button" class="is-primary" data-cbind-act="bind">Підв’язати</button><button type="button" data-cbind-act="refresh">↻ Оновити дані</button><button type="button" data-cbind-act="edit">Відкрити у Studio</button><button type="button" class="is-danger" data-cbind-act="unbind">Відв’язати</button></div>
  <p class="st-cbind-note">Після підв’язки назва, ціна, фото, stock та інші semantic поля стають live-даними MarketplaceStore. Дизайн карточки лишається у SiteFrameStore. Для зміни контенту відкрийте товар/категорію у Marketplace Studio.</p>
</div>`;}

export function bindCommerceCardBindingWidget01064(sectionEl,getSelection,notifyChanged){
  const panel=sectionEl?.querySelector?.('[data-commerce-binding-widget-01064]');if(!panel||panel.__bound01064)return;panel.__bound01064=true;
  const select=panel.querySelector('[data-cbind="entity"]'),status=panel.querySelector('[data-cbind="status"]'),label=panel.querySelector('[data-cbind="entity-label"]'),preview=panel.querySelector('[data-cbind="preview"]');
  const btnBind=panel.querySelector('[data-cbind-act="bind"]'),btnRefresh=panel.querySelector('[data-cbind-act="refresh"]'),btnEdit=panel.querySelector('[data-cbind-act="edit"]'),btnUnbind=panel.querySelector('[data-cbind-act="unbind"]');
  let lastType='',lastCard=null;
  const hydrate=()=>{
    const card=selectedCard(getSelection),runtime=api();lastCard=card;
    if(!card){lastType='';if(label)label.textContent='Товар / категорія Marketplace';if(select){select.innerHTML='<option value="">— Виберіть Product Card або Category Card —</option>';select.disabled=true;}if(status){status.className='st-cbind-pill';status.textContent='НЕ ВИБРАНО';}if(preview)preview.innerHTML='<code>component</code><b>—</b><code>entity</code><b>—</b><code>source</code><b>MarketplaceStore</b>';[btnBind,btnRefresh,btnEdit,btnUnbind].forEach(b=>{if(b)b.disabled=true;});return;}
    const type=getCommerceCardType01050(card)||'product-card';lastType=type;const info=runtime?.getBinding?.(card)||{bound:false,entityId:'',entity:null,state:''};const rows=runtime?.listEntities?.(type)||[];
    if(label)label.textContent=type==='category-card'?'Категорія Marketplace':'Товар Marketplace';
    if(select){select.disabled=!runtime;select.innerHTML=`<option value="">— Виберіть ${entityLabel(type)} —</option>${rows.map(x=>`<option value="${esc(x.id)}" ${x.id===info.entityId?'selected':''}>${esc(x.name)}${x.sku?` · ${esc(x.sku)}`:''}${x.status==='draft'?' · Чернетка':''}</option>`).join('')}`;}
    if(status){status.className=`st-cbind-pill ${info.bound?(info.entity?'is-live':'is-missing'):''}`;status.textContent=info.bound?(info.entity?'LIVE':'НЕ ЗНАЙДЕНО'):'MANUAL';}
    if(preview)preview.innerHTML=`<code>component</code><b>${esc(typeLabel(type))}</b><code>entity</code><b>${esc(info.entity?.name||info.entityId||'—')}</b><code>source</code><b>${info.bound?'MarketplaceStore · LIVE':'Шаблон / ручні дані'}</b>`;
    if(btnBind)btnBind.disabled=!runtime||!select?.value;if(btnRefresh)btnRefresh.disabled=!runtime||!info.bound;if(btnEdit)btnEdit.disabled=!runtime||!info.bound||!info.entity;if(btnUnbind)btnUnbind.disabled=!runtime||!info.bound;
  };
  select?.addEventListener('change',()=>{if(btnBind)btnBind.disabled=!select.value;});
  panel.addEventListener('click',e=>{
    const act=e.target.closest('[data-cbind-act]')?.getAttribute('data-cbind-act');if(!act)return;e.preventDefault();e.stopPropagation();const runtime=api(),card=lastCard||selectedCard(getSelection);if(!runtime||!card){hydrate();return;}
    try{
      if(act==='bind'){runtime.bindCard(card,select?.value||'');}
      else if(act==='refresh')runtime.refreshCard(card);
      else if(act==='unbind'){runtime.unbindCard(card);}
      else if(act==='edit')runtime.openEntityEditor(card);
    }catch(err){try{alert(err?.message||String(err));}catch{}console.warn('[01064 binding widget]',err);}
    requestAnimationFrame(hydrate);
  });
  const refresh=()=>requestAnimationFrame(hydrate);
  document.addEventListener('st:selection-changed',refresh,true);window.addEventListener('st-page-selected',refresh);window.addEventListener('st:canvas-snapshot-applied',refresh);window.addEventListener('builder:structureChanged',refresh);window.addEventListener('st:commerce-component-template-applied-01041',refresh);window.addEventListener('st:commerce-card-binding-changed-01064',refresh);window.addEventListener('st:commerce-binding-refreshed-01064',refresh);window.addEventListener('st:marketplace-store-changed',refresh);
  hydrate();
}
