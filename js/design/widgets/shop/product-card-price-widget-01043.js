// 01043 · Product Card price widget
// Commerce-specific price semantics only. Typography/colors remain generic Inspector responsibilities.
import {
  resolveProductCardRoot01038,
  resolveProductCardRole01038
} from './product-card-contract-01038.js?v=01050';

const CURRENCY_LABELS_01043 = Object.freeze({
  'uah-text': 'грн',
  'uah-symbol': '₴',
  'usd': '$',
  'eur': '€'
});

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
function field(panel,key){ return panel?.querySelector?.(`[data-pprice="${key}"]`) || null; }
function out(panel,key){ return panel?.querySelector?.(`[data-pprice-out="${key}"]`) || null; }

function parsePriceText01043(text,fallback=0){
  const raw=String(text || '').replace(/[^0-9,.-]/g,'').replace(/,/g,'.');
  const parts=raw.match(/-?\d+(?:\.\d+)?/);
  return parts ? num(parts[0],0,999999999,fallback) : fallback;
}
function inferCurrencyMode01043(text){
  const t=String(text || '');
  if (t.includes('₴')) return 'uah-symbol';
  if (/грн/i.test(t)) return 'uah-text';
  if (t.includes('$')) return 'usd';
  if (t.includes('€')) return 'eur';
  return 'uah-text';
}
function inferCurrencyPosition01043(text){
  const t=String(text || '').trim();
  return /^[₴$€]/.test(t) ? 'before' : 'after';
}
function isVisible01043(card,el,key,defaultVisible=true){
  const stored=card?.dataset?.[key];
  if (stored === '0') return false;
  if (stored === '1') return true;
  if (!el) return false;
  return defaultVisible && !el.hidden;
}
function setVisible01043(card,el,key,visible){
  if (!card || !el) return;
  card.dataset[key]=visible ? '1' : '0';
  el.hidden=!visible;
}
function currencyLabel01043(card){
  const mode=String(card?.dataset?.commerceCurrencyMode || 'uah-text');
  if (mode === 'custom') return String(card?.dataset?.commerceCurrencyCustom || '').trim();
  return CURRENCY_LABELS_01043[mode] || 'грн';
}
function groupThousands01043(integer,sep){
  const s=String(integer || '0');
  if (!sep) return s;
  return s.replace(/\B(?=(\d{3})+(?!\d))/g,sep);
}
function formatNumber01043(value,format='space',decimals=0){
  const n=num(value,0,999999999,0);
  const d=Math.round(num(decimals,0,2,0));
  const fixed=n.toFixed(d);
  const [whole,fraction='']=fixed.split('.');
  let groupSep=' ';
  let decimalSep=',';
  if (format === 'comma') { groupSep=','; decimalSep='.'; }
  else if (format === 'dot') { groupSep='.'; decimalSep=','; }
  else if (format === 'plain') { groupSep=''; decimalSep='.'; }
  const grouped=groupThousands01043(whole,groupSep);
  return d > 0 ? `${grouped}${decimalSep}${fraction}` : grouped;
}
function formatMoney01043(card,value){
  const format=String(card?.dataset?.commercePriceFormat || 'space');
  const decimals=Math.round(num(card?.dataset?.commercePriceDecimals,0,2,0));
  const position=String(card?.dataset?.commerceCurrencyPosition || 'after');
  const spaced=String(card?.dataset?.commerceCurrencySpace ?? '1') !== '0';
  const amount=formatNumber01043(value,format,decimals);
  const currency=currencyLabel01043(card);
  if (!currency) return amount;
  const gap=spaced ? ' ' : '';
  return position === 'before' ? `${currency}${gap}${amount}` : `${amount}${gap}${currency}`;
}
function discountValues01043(current,old){
  const saving=Math.max(0,old-current);
  const percent=old > 0 && saving > 0 ? Math.max(0,Math.round((saving / old) * 100)) : 0;
  return {saving,percent};
}
function renderDiscount01043(card,discountEl){
  if (!card || !discountEl) return;
  const current=num(card.dataset.commercePriceCurrent,0,999999999,0);
  const old=num(card.dataset.commercePriceOld,0,999999999,0);
  const mode=String(card.dataset.commerceDiscountMode || 'auto-percent');
  const {saving,percent}=discountValues01043(current,old);
  let text='';
  if (mode === 'auto-saving') text=saving > 0 ? `Економія ${formatMoney01043(card,saving)}` : 'Економія 0';
  else if (mode === 'auto-both') text=saving > 0 ? `−${percent}% · економія ${formatMoney01043(card,saving)}` : '0%';
  else if (mode === 'custom') text=String(card.dataset.commerceDiscountCustom || '').trim();
  else text=`−${percent}%`;
  discountEl.textContent=text || '−0%';
}
function applyOrder01043(group,currentEl,oldEl,discountEl,order){
  if (!group) return;
  const maps={
    'current-old-discount': [currentEl,oldEl,discountEl],
    'current-discount-old': [currentEl,discountEl,oldEl],
    'discount-current-old': [discountEl,currentEl,oldEl],
    'old-current-discount': [oldEl,currentEl,discountEl]
  };
  const list=maps[order] || maps['current-old-discount'];
  list.forEach((el,index)=>{ if (el) el.style.order=String(index+1); });
}
function renderPrice01043(card){
  if (!card) return;
  const group=role(card,'price-group');
  const currentEl=role(card,'price-current');
  const oldEl=role(card,'price-old');
  const discountEl=role(card,'discount');
  if (currentEl) currentEl.textContent=formatMoney01043(card,card.dataset.commercePriceCurrent);
  if (oldEl) oldEl.textContent=formatMoney01043(card,card.dataset.commercePriceOld);
  renderDiscount01043(card,discountEl);
  applyOrder01043(group,currentEl,oldEl,discountEl,String(card.dataset.commercePriceOrder || 'current-old-discount'));
  if (group) group.style.gap=`${Math.round(num(card.dataset.commercePriceGap,0,40,10))}px`;
}

export function productCardPriceWidgetHtml01043(){
  return `
  <div class="st-shop-component-widget st-product-price-widget-01043" data-product-price-widget-01043="1">
    <div class="st-shop-widget-head-01039">
      <div><b>Ціна</b><span>price-current / price-old / discount</span></div>
      <label class="st-shop-switch-01039"><input type="checkbox" data-pprice="group-visible"><span>Блок ціни</span></label>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Поточна ціна</b><label class="st-shop-switch-01039"><input type="checkbox" data-pprice="current-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Значення</div><input class="design-input" type="number" min="0" max="999999999" step="0.01" data-pprice="current-value" value="1450"></div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Стара ціна</b><label class="st-shop-switch-01039"><input type="checkbox" data-pprice="old-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Значення</div><input class="design-input" type="number" min="0" max="999999999" step="0.01" data-pprice="old-value" value="1650"></div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Знижка / економія</b><label class="st-shop-switch-01039"><input type="checkbox" data-pprice="discount-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Відображення</div><select class="design-input" data-pprice="discount-mode"><option value="auto-percent">Авто · −12%</option><option value="auto-saving">Авто · Економія 200 грн</option><option value="auto-both">Авто · −12% + економія</option><option value="custom">Власний напис</option></select></div>
      <div class="design-field" data-pprice-custom-wrap><div class="design-field__label">Власний напис</div><input class="design-input" type="text" data-pprice="discount-custom" placeholder="Наприклад: Вигода 300 грн"></div>
      <div class="st-shop-price-calculation-01043"><span>Розрахована знижка</span><b data-pprice-out="discount-calculation">−12% · 200 грн</b></div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Валюта і формат</b></div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Валюта</div><select class="design-input" data-pprice="currency-mode"><option value="uah-text">грн</option><option value="uah-symbol">₴</option><option value="usd">$</option><option value="eur">€</option><option value="custom">Власна</option></select></div>
        <div class="design-field"><div class="design-field__label">Позиція</div><select class="design-input" data-pprice="currency-position"><option value="after">Після числа</option><option value="before">Перед числом</option></select></div>
      </div>
      <div class="design-field" data-pprice-currency-custom-wrap><div class="design-field__label">Власна валюта</div><input class="design-input" type="text" data-pprice="currency-custom" placeholder="Наприклад: zł"></div>
      <label class="st-shop-check-row-01039"><input type="checkbox" data-pprice="currency-space"><span><b>Пробіл між ціною і валютою</b><small>Наприклад 1 450 грн замість 1 450грн</small></span></label>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Розділення тисяч</div><select class="design-input" data-pprice="number-format"><option value="space">1 450</option><option value="comma">1,450</option><option value="dot">1.450</option><option value="plain">1450</option></select></div>
        <div class="design-field"><div class="design-field__label">Десяткові</div><select class="design-input" data-pprice="decimals"><option value="0">Без копійок</option><option value="2">2 знаки</option></select></div>
      </div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Розміщення блоку ціни</b></div>
      <div class="design-field"><div class="design-field__label">Порядок</div><select class="design-input" data-pprice="order"><option value="current-old-discount">Ціна → стара → знижка</option><option value="current-discount-old">Ціна → знижка → стара</option><option value="discount-current-old">Знижка → ціна → стара</option><option value="old-current-discount">Стара → ціна → знижка</option></select></div>
      <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Відстань</span><b data-pprice-out="gap">10 px</b></div><input class="design-slider" type="range" min="0" max="40" step="1" value="10" data-pprice="gap"></div>
      <div class="design-subnote">Колір, шрифт, жирність, підкреслення старої ціни та інші декоративні стилі залишаються у стандартному Inspector.</div>
    </div>

    <div class="st-shop-contract-status" data-pprice-status><b>Ціна</b><span>Вибери Product Card на Canvas.</span></div>
  </div>`;
}

function setDisabled01043(panel,disabled){ panel?.querySelectorAll?.('input,select').forEach(el=>{ el.disabled=!!disabled; }); }
function updateConditionalUi01043(panel){
  const discountCustom=panel?.querySelector?.('[data-pprice-custom-wrap]');
  const currencyCustom=panel?.querySelector?.('[data-pprice-currency-custom-wrap]');
  if (discountCustom) discountCustom.hidden=String(field(panel,'discount-mode')?.value || '') !== 'custom';
  if (currencyCustom) currencyCustom.hidden=String(field(panel,'currency-mode')?.value || '') !== 'custom';
}
function updateOutputs01043(panel){
  const gap=Math.round(num(field(panel,'gap')?.value,0,40,10));
  const gapOut=out(panel,'gap'); if (gapOut) gapOut.textContent=`${gap} px`;
  const current=num(field(panel,'current-value')?.value,0,999999999,0);
  const old=num(field(panel,'old-value')?.value,0,999999999,0);
  const {saving,percent}=discountValues01043(current,old);
  const calc=out(panel,'discount-calculation');
  if (calc) calc.textContent=`−${percent}% · економія ${formatNumber01043(saving,'space',0)}`;
}

function hydrate01043(panel,getSelection){
  const card=selectedCard(getSelection);
  const status=panel?.querySelector?.('[data-pprice-status]');
  if (!card) {
    setDisabled01043(panel,true);
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Ціна</b><span>Вибери Product Card на Canvas.</span>'; }
    return;
  }
  const group=role(card,'price-group');
  const currentEl=role(card,'price-current');
  const oldEl=role(card,'price-old');
  const discountEl=role(card,'discount');
  if (!currentEl) {
    setDisabled01043(panel,true);
    if (status) { status.className='st-shop-contract-status is-warning'; status.innerHTML='<b>Ціна</b><span>У цьому шаблоні немає обов’язкової ролі price-current.</span>'; }
    return;
  }
  setDisabled01043(panel,false);
  if (field(panel,'group-visible')) field(panel,'group-visible').checked=isVisible01043(card,group,'commercePriceGroupVisible',!!group);
  if (!card.dataset.commercePriceCurrent) card.dataset.commercePriceCurrent=String(parsePriceText01043(currentEl.textContent,0));
  if (!card.dataset.commercePriceOld) card.dataset.commercePriceOld=String(parsePriceText01043(oldEl?.textContent,0));
  if (!card.dataset.commerceCurrencyMode) card.dataset.commerceCurrencyMode=inferCurrencyMode01043(currentEl.textContent);
  if (!card.dataset.commerceCurrencyPosition) card.dataset.commerceCurrencyPosition=inferCurrencyPosition01043(currentEl.textContent);
  if (!card.dataset.commerceCurrencySpace) card.dataset.commerceCurrencySpace='1';
  if (!card.dataset.commercePriceFormat) card.dataset.commercePriceFormat='space';
  if (!card.dataset.commercePriceDecimals) card.dataset.commercePriceDecimals='0';
  if (!card.dataset.commerceDiscountMode) card.dataset.commerceDiscountMode='auto-percent';
  if (!card.dataset.commercePriceOrder) card.dataset.commercePriceOrder='current-old-discount';
  if (!card.dataset.commercePriceGap) card.dataset.commercePriceGap='10';

  field(panel,'current-visible').checked=isVisible01043(card,currentEl,'commercePriceCurrentVisible',true);
  field(panel,'current-value').value=String(num(card.dataset.commercePriceCurrent,0,999999999,0));
  if (field(panel,'old-visible')) field(panel,'old-visible').checked=isVisible01043(card,oldEl,'commercePriceOldVisible',!!oldEl);
  if (field(panel,'old-value')) field(panel,'old-value').value=String(num(card.dataset.commercePriceOld,0,999999999,0));
  if (field(panel,'discount-visible')) field(panel,'discount-visible').checked=isVisible01043(card,discountEl,'commerceDiscountVisible',!!discountEl);
  if (field(panel,'discount-mode')) field(panel,'discount-mode').value=String(card.dataset.commerceDiscountMode || 'auto-percent');
  if (field(panel,'discount-custom')) field(panel,'discount-custom').value=String(card.dataset.commerceDiscountCustom || discountEl?.textContent || '');
  if (field(panel,'currency-mode')) field(panel,'currency-mode').value=String(card.dataset.commerceCurrencyMode || 'uah-text');
  if (field(panel,'currency-custom')) field(panel,'currency-custom').value=String(card.dataset.commerceCurrencyCustom || '');
  if (field(panel,'currency-position')) field(panel,'currency-position').value=String(card.dataset.commerceCurrencyPosition || 'after');
  if (field(panel,'currency-space')) field(panel,'currency-space').checked=String(card.dataset.commerceCurrencySpace || '1') !== '0';
  if (field(panel,'number-format')) field(panel,'number-format').value=String(card.dataset.commercePriceFormat || 'space');
  if (field(panel,'decimals')) field(panel,'decimals').value=String(card.dataset.commercePriceDecimals || '0');
  if (field(panel,'order')) field(panel,'order').value=String(card.dataset.commercePriceOrder || 'current-old-discount');
  if (field(panel,'gap')) field(panel,'gap').value=String(num(card.dataset.commercePriceGap,0,40,10));
  updateConditionalUi01043(panel);
  updateOutputs01043(panel);
  if (status) {
    const optional=[];
    if (!oldEl) optional.push('price-old');
    if (!discountEl) optional.push('discount');
    status.className=`st-shop-contract-status ${optional.length ? 'is-warning' : 'is-ok'}`;
    status.innerHTML=optional.length
      ? `<b>Ціна готова частково</b><span>Поточна ціна доступна.</span><small>У шаблоні немає: ${esc(optional.join(', '))}</small>`
      : '<b>Ціна готова</b><span>Поточна, стара ціна та знижка підключені до semantic state.</span>';
  }
}

function apply01043(panel,getSelection,{live=false}={}){
  const card=selectedCard(getSelection);
  if (!card) return;
  const group=role(card,'price-group');
  const currentEl=role(card,'price-current');
  const oldEl=role(card,'price-old');
  const discountEl=role(card,'discount');
  if (!currentEl) return;

  card.dataset.commercePriceCurrent=String(num(field(panel,'current-value')?.value,0,999999999,0));
  card.dataset.commercePriceOld=String(num(field(panel,'old-value')?.value,0,999999999,0));
  card.dataset.commerceCurrencyMode=String(field(panel,'currency-mode')?.value || 'uah-text');
  card.dataset.commerceCurrencyCustom=String(field(panel,'currency-custom')?.value || '').trim();
  card.dataset.commerceCurrencyPosition=String(field(panel,'currency-position')?.value || 'after');
  card.dataset.commerceCurrencySpace=field(panel,'currency-space')?.checked ? '1' : '0';
  card.dataset.commercePriceFormat=String(field(panel,'number-format')?.value || 'space');
  card.dataset.commercePriceDecimals=String(Math.round(num(field(panel,'decimals')?.value,0,2,0)));
  card.dataset.commerceDiscountMode=String(field(panel,'discount-mode')?.value || 'auto-percent');
  card.dataset.commerceDiscountCustom=String(field(panel,'discount-custom')?.value || '').trim();
  card.dataset.commercePriceOrder=String(field(panel,'order')?.value || 'current-old-discount');
  card.dataset.commercePriceGap=String(Math.round(num(field(panel,'gap')?.value,0,40,10)));

  if (group) setVisible01043(card,group,'commercePriceGroupVisible',!!field(panel,'group-visible')?.checked);
  setVisible01043(card,currentEl,'commercePriceCurrentVisible',!!field(panel,'current-visible')?.checked);
  if (oldEl) setVisible01043(card,oldEl,'commercePriceOldVisible',!!field(panel,'old-visible')?.checked);
  if (discountEl) setVisible01043(card,discountEl,'commerceDiscountVisible',!!field(panel,'discount-visible')?.checked);
  renderPrice01043(card);
  updateConditionalUi01043(panel);
  updateOutputs01043(panel);
  try {
    window.dispatchEvent(new CustomEvent('st:commerce-product-card-price-updated-01044',{ detail:{ card, live:!!live } }));
  } catch {}

  if (!live) {
    const result=window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card,'shop-product-card-price-01043') || null;
    try {
      window.__ST_ALL_LOG__?.push?.('commerce-product-card-price-committed-01043',{
        ok:!!result?.ok,
        nodeId:String(result?.nodeId || ''),
        current:Number(card.dataset.commercePriceCurrent || 0),
        old:Number(card.dataset.commercePriceOld || 0),
        currencyMode:String(card.dataset.commerceCurrencyMode || ''),
        discountMode:String(card.dataset.commerceDiscountMode || ''),
        order:String(card.dataset.commercePriceOrder || ''),
        storeAuthority:!!result?.ok,
        directDomFinalCommit:false
      });
    } catch {}
  }
}

export function bindProductCardPriceWidget01043(sectionEl,getSelection,notify){
  const panel=sectionEl?.querySelector?.('[data-product-price-widget-01043]');
  if (!panel || panel.dataset.bound01043 === '1') return;
  panel.dataset.bound01043='1';
  let raf=0;
  const live=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>apply01043(panel,getSelection,{live:true}));
  };
  panel.addEventListener('input',(ev)=>{
    if (!ev.target?.matches?.('[data-pprice]')) return;
    live();
    updateConditionalUi01043(panel);
    updateOutputs01043(panel);
  });
  panel.addEventListener('change',(ev)=>{
    if (!ev.target?.matches?.('[data-pprice]')) return;
    cancelAnimationFrame(raf);
    apply01043(panel,getSelection,{live:false});
  });
  const refresh=()=>hydrate01043(panel,getSelection);
  document.addEventListener('st:selection-changed',refresh,true);
  window.addEventListener('st-page-selected',refresh);
  window.addEventListener('st:canvas-snapshot-applied',refresh);
  window.addEventListener('builder:structureChanged',refresh);
  window.addEventListener('st:commerce-component-template-applied-01041',refresh);
  refresh();
}
