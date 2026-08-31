// 01042 · Product Card text/content widget
// Commerce-specific content/visibility/line behavior only.
// Typography (font, color, weight, line-height, letter-spacing) stays in the generic Inspector.
import {
  resolveProductCardRoot01038,
  resolveProductCardRole01038,
  getCommerceCardType01050
} from './product-card-contract-01038.js?v=01050';

const STOCK_LABELS_01042 = Object.freeze({
  'in-stock': '● В наявності',
  'out-of-stock': '● Немає в наявності',
  'preorder': '● Під замовлення'
});

const LINE_OPTIONS_01042 = Object.freeze({
  brand: [['0','Авто'],['1','1 рядок'],['2','2 рядки']],
  title: [['0','Авто'],['1','1 рядок'],['2','2 рядки'],['3','3 рядки'],['4','4 рядки']],
  description: [['0','Авто'],['1','1 рядок'],['2','2 рядки'],['3','3 рядки'],['4','4 рядки'],['5','5 рядків']]
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
    const sel = typeof getSelection === 'function' ? getSelection() : null;
    return Array.isArray(sel?.elements) ? (sel.elements[0] || null) : null;
  } catch { return null; }
}
function selectedCard(getSelection){ return resolveProductCardRoot01038(selectedElement(getSelection)); }
function role(card,id){ return card ? resolveProductCardRole01038(card,id) : null; }
function field(panel,key){ return panel?.querySelector?.(`[data-ptext="${key}"]`) || null; }
function out(panel,key){ return panel?.querySelector?.(`[data-ptext-out="${key}"]`) || null; }
function optionsHtml(list){ return list.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join(''); }

function inferVisible(card, el, key){
  const stored = card?.dataset?.[key];
  if (stored === '0') return false;
  if (stored === '1') return true;
  return !!el && !el.hidden;
}
function setVisible(card, el, key, visible){
  if (!card || !el) return;
  card.dataset[key] = visible ? '1' : '0';
  el.hidden = !visible;
}

function ensureClampBackup01042(el){
  if (!el || el.hasAttribute('data-commerce-clamp-display-01042')) return;
  el.setAttribute('data-commerce-clamp-display-01042', String(el.style.display || ''));
  el.setAttribute('data-commerce-clamp-overflow-01042', String(el.style.overflow || ''));
}
function setLineClamp01042(el, lines){
  if (!el) return;
  const n=Math.round(num(lines,0,8,0));
  if (n > 0) {
    ensureClampBackup01042(el);
    el.style.setProperty('display','-webkit-box');
    el.style.setProperty('-webkit-box-orient','vertical');
    el.style.setProperty('-webkit-line-clamp',String(n));
    el.style.setProperty('overflow','hidden');
    return;
  }
  if (el.hasAttribute('data-commerce-clamp-display-01042')) {
    const display=el.getAttribute('data-commerce-clamp-display-01042') || '';
    const overflow=el.getAttribute('data-commerce-clamp-overflow-01042') || '';
    if (display) el.style.display=display; else el.style.removeProperty('display');
    if (overflow) el.style.overflow=overflow; else el.style.removeProperty('overflow');
    el.removeAttribute('data-commerce-clamp-display-01042');
    el.removeAttribute('data-commerce-clamp-overflow-01042');
  }
  el.style.removeProperty('-webkit-box-orient');
  el.style.removeProperty('-webkit-line-clamp');
}

function stars01042(value){
  const rounded=Math.round(num(value,0,5,0));
  return `${'★'.repeat(rounded)}${'☆'.repeat(Math.max(0,5-rounded))}`;
}
function renderRating01042(card, ratingEl){
  if (!card || !ratingEl) return;
  const value=num(card.dataset.commerceRatingValue,0,5,5);
  const mode=String(card.dataset.commerceRatingMode || 'stars').trim();
  const text = mode === 'number'
    ? value.toFixed(1)
    : mode === 'stars-number'
      ? `${stars01042(value)} ${value.toFixed(1)}`
      : stars01042(value);
  ratingEl.textContent=text;
}
function renderReviews01042(card, reviewsEl){
  if (!card || !reviewsEl) return;
  const count=Math.round(num(card.dataset.commerceReviewsCount,0,999999,0));
  const label=String(card.dataset.commerceReviewsLabel || 'відгуків').trim();
  reviewsEl.textContent = label ? `${count} ${label}` : String(count);
}
function renderStock01042(card, stockEl, customInputValue=''){
  if (!card || !stockEl) return;
  const state=String(card.dataset.commerceStockState || 'in-stock').trim();
  const custom=String(customInputValue || card.dataset.commerceStockCustom || '').trim();
  if (state === 'custom') {
    card.dataset.commerceStockCustom=custom;
    stockEl.textContent=custom || 'Статус товару';
  } else {
    stockEl.textContent=STOCK_LABELS_01042[state] || STOCK_LABELS_01042['in-stock'];
  }
}

export function productCardTextContentWidgetHtml01042(){
  return `
  <div class="st-shop-component-widget st-product-text-widget-01042" data-product-text-widget-01042="1">
    <div class="st-shop-widget-head-01039">
      <div><b>Текст і контент</b><span>brand / title / description / stock / rating</span></div>
      <label class="st-shop-switch-01039"><input type="checkbox" data-ptext="body-visible"><span>Контент</span></label>
    </div>

    <div class="st-shop-content-group-01042" data-commerce-product-only-01050>
      <div class="st-shop-content-group__title-01042"><b>Бренд</b><label class="st-shop-switch-01039"><input type="checkbox" data-ptext="brand-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Текст бренду</div><input class="design-input" type="text" data-ptext="brand-text" placeholder="SHIFTIME"></div>
      <div class="design-field"><div class="design-field__label">Максимум рядків</div><select class="design-input" data-ptext="brand-lines">${optionsHtml(LINE_OPTIONS_01042.brand)}</select></div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b data-commerce-card-title-label-01050>Назва</b><label class="st-shop-switch-01039"><input type="checkbox" data-ptext="title-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Назва</div><textarea class="design-input st-shop-textarea-01042" rows="2" data-ptext="title-text" placeholder="Назва"></textarea></div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Максимум рядків</div><select class="design-input" data-ptext="title-lines">${optionsHtml(LINE_OPTIONS_01042.title)}</select></div>
        <div class="design-field"><div class="design-field__label st-pimg-label-row"><span>Мін. висота</span><b data-ptext-out="title-min-height">0 px</b></div><input class="design-slider" type="range" min="0" max="180" step="1" value="0" data-ptext="title-min-height"></div>
      </div>
      <div class="design-subnote">Мінімальна висота допомагає вирівняти карточки в Product Grid, коли назви мають різну довжину.</div>
    </div>

    <div class="st-shop-content-group-01042">
      <div class="st-shop-content-group__title-01042"><b>Короткий опис</b><label class="st-shop-switch-01039"><input type="checkbox" data-ptext="description-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Опис</div><textarea class="design-input st-shop-textarea-01042" rows="3" data-ptext="description-text" placeholder="Короткий опис товару"></textarea></div>
      <div class="design-field"><div class="design-field__label">Максимум рядків</div><select class="design-input" data-ptext="description-lines">${optionsHtml(LINE_OPTIONS_01042.description)}</select></div>
    </div>

    <div class="st-shop-content-group-01042" data-commerce-product-only-01050>
      <div class="st-shop-content-group__title-01042"><b>Наявність</b><label class="st-shop-switch-01039"><input type="checkbox" data-ptext="stock-visible"><span>Показувати</span></label></div>
      <div class="design-field"><div class="design-field__label">Статус</div><select class="design-input" data-ptext="stock-state"><option value="in-stock">В наявності</option><option value="out-of-stock">Немає в наявності</option><option value="preorder">Під замовлення</option><option value="custom">Власний текст</option></select></div>
      <div class="design-field" data-ptext-custom-stock-wrap><div class="design-field__label">Власний напис</div><input class="design-input" type="text" data-ptext="stock-custom" placeholder="Наприклад: Очікується 3 дні"></div>
    </div>

    <div class="st-shop-content-group-01042" data-commerce-product-only-01050>
      <div class="st-shop-content-group__title-01042"><b>Рейтинг і відгуки</b></div>
      <div class="st-shop-check-split-01042">
        <label class="st-shop-switch-01039"><input type="checkbox" data-ptext="rating-visible"><span>Рейтинг</span></label>
        <label class="st-shop-switch-01039"><input type="checkbox" data-ptext="reviews-visible"><span>Відгуки</span></label>
      </div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Рейтинг 0–5</div><input class="design-input" type="number" min="0" max="5" step="0.1" data-ptext="rating-value" value="4.9"></div>
        <div class="design-field"><div class="design-field__label">Вигляд</div><select class="design-input" data-ptext="rating-mode"><option value="stars">Тільки зірки</option><option value="stars-number">Зірки + число</option><option value="number">Тільки число</option></select></div>
      </div>
      <div class="st-shop-two-col-01039">
        <div class="design-field"><div class="design-field__label">Кількість відгуків</div><input class="design-input" type="number" min="0" max="999999" step="1" data-ptext="reviews-count" value="128"></div>
        <div class="design-field"><div class="design-field__label">Підпис</div><input class="design-input" type="text" data-ptext="reviews-label" value="відгуків"></div>
      </div>
    </div>

    <div class="st-shop-contract-status" data-ptext-status><b>Текст і контент</b><span>Вибери commerce-карточку на Canvas.</span></div>
  </div>`;
}

function setDisabled01042(panel, disabled){
  panel?.querySelectorAll?.('input,select,textarea').forEach((el)=>{ el.disabled=!!disabled; });
}
function updateCustomStockUi01042(panel){
  const state=String(field(panel,'stock-state')?.value || 'in-stock');
  const wrap=panel?.querySelector?.('[data-ptext-custom-stock-wrap]') || null;
  if (wrap) wrap.hidden = state !== 'custom';
}
function updateOutputs01042(panel){
  const slider=field(panel,'title-min-height');
  const label=out(panel,'title-min-height');
  if (slider && label) label.textContent=`${slider.value || 0} px`;
}

function hydrate01042(panel,getSelection){
  if (!panel) return;
  const card=selectedCard(getSelection);
  const body=role(card,'body');
  const brand=role(card,'brand');
  const title=role(card,'title');
  const description=role(card,'description');
  const stock=role(card,'stock');
  const rating=role(card,'rating');
  const reviews=role(card,'reviews-count');
  const status=panel.querySelector('[data-ptext-status]');

  if (!card) {
    setDisabled01042(panel,true);
    if (status) status.innerHTML='<b>Текст і контент</b><span>Вибери commerce-карточку на Canvas.</span>';
    return;
  }
  setDisabled01042(panel,false);

  field(panel,'body-visible').checked=inferVisible(card,body,'commerceBodyVisible');
  field(panel,'brand-visible').checked=inferVisible(card,brand,'commerceBrandVisible');
  field(panel,'brand-text').value=String(brand?.textContent || '');
  field(panel,'brand-lines').value=String(card.dataset.commerceBrandLines || '1');

  field(panel,'title-visible').checked=inferVisible(card,title,'commerceTitleVisible');
  field(panel,'title-text').value=String(title?.textContent || '');
  field(panel,'title-lines').value=String(card.dataset.commerceTitleLines || '2');
  field(panel,'title-min-height').value=String(Math.round(num(card.dataset.commerceTitleMinHeight,0,180,0)));

  field(panel,'description-visible').checked=inferVisible(card,description,'commerceDescriptionVisible');
  field(panel,'description-text').value=String(description?.textContent || '');
  field(panel,'description-lines').value=String(card.dataset.commerceDescriptionLines || '3');

  field(panel,'stock-visible').checked=inferVisible(card,stock,'commerceStockVisible');
  field(panel,'stock-state').value=['in-stock','out-of-stock','preorder','custom'].includes(String(card.dataset.commerceStockState || '')) ? card.dataset.commerceStockState : 'in-stock';
  field(panel,'stock-custom').value=String(card.dataset.commerceStockCustom || (field(panel,'stock-state').value==='custom' ? stock?.textContent || '' : ''));

  field(panel,'rating-visible').checked=inferVisible(card,rating,'commerceRatingVisible');
  field(panel,'rating-value').value=String(num(card.dataset.commerceRatingValue,0,5,4.9));
  field(panel,'rating-mode').value=['stars','stars-number','number'].includes(String(card.dataset.commerceRatingMode || '')) ? card.dataset.commerceRatingMode : 'stars';
  field(panel,'reviews-visible').checked=inferVisible(card,reviews,'commerceReviewsVisible');
  const parsedReviews=String(reviews?.textContent || '').match(/\d+/)?.[0] || '128';
  field(panel,'reviews-count').value=String(Math.round(num(card.dataset.commerceReviewsCount,0,999999,Number(parsedReviews)||0)));
  field(panel,'reviews-label').value=String(card.dataset.commerceReviewsLabel || 'відгуків');

  updateCustomStockUi01042(panel);
  updateOutputs01042(panel);

  const cardType=getCommerceCardType01050(card);
  const candidates=cardType==='category-card' ? [['title',title],['description',description]] : [['brand',brand],['title',title],['description',description],['stock',stock],['rating',rating],['reviews-count',reviews]];
  const present=candidates.filter(([,el])=>!!el).map(([id])=>id);
  if (status) {
    status.className=`st-shop-contract-status ${title ? 'is-ok' : 'is-warning'}`;
    status.innerHTML=`<b>Текст і контент · ${present.length}/${candidates.length} ролей</b><span>${esc(present.join(' · ') || 'У шаблоні немає текстових ролей')}</span>${title ? '' : '<small>Для commerce-карточки обов’язкова роль title.</small>'}`;
  }
}

function apply01042(panel,getSelection,notify,{live=false}={}){
  const card=selectedCard(getSelection);
  if (!card) return;
  const body=role(card,'body');
  const brand=role(card,'brand');
  const title=role(card,'title');
  const description=role(card,'description');
  const stock=role(card,'stock');
  const rating=role(card,'rating');
  const reviews=role(card,'reviews-count');

  if (body) {
    setVisible(card,body,'commerceBodyVisible',!!field(panel,'body-visible')?.checked);
  }

  if (brand) {
    const visible=!!field(panel,'brand-visible')?.checked;
    setVisible(card,brand,'commerceBrandVisible',visible);
    brand.textContent=String(field(panel,'brand-text')?.value || '');
    const lines=Math.round(num(field(panel,'brand-lines')?.value,0,2,0));
    card.dataset.commerceBrandLines=String(lines);
    setLineClamp01042(brand,lines);
  }

  if (title) {
    const visible=!!field(panel,'title-visible')?.checked;
    setVisible(card,title,'commerceTitleVisible',visible);
    title.textContent=String(field(panel,'title-text')?.value || '');
    const lines=Math.round(num(field(panel,'title-lines')?.value,0,4,0));
    const minHeight=Math.round(num(field(panel,'title-min-height')?.value,0,180,0));
    card.dataset.commerceTitleLines=String(lines);
    card.dataset.commerceTitleMinHeight=String(minHeight);
    setLineClamp01042(title,lines);
    if (minHeight > 0) title.style.minHeight=`${minHeight}px`; else title.style.removeProperty('min-height');
  }

  if (description) {
    const visible=!!field(panel,'description-visible')?.checked;
    setVisible(card,description,'commerceDescriptionVisible',visible);
    description.textContent=String(field(panel,'description-text')?.value || '');
    const lines=Math.round(num(field(panel,'description-lines')?.value,0,5,0));
    card.dataset.commerceDescriptionLines=String(lines);
    setLineClamp01042(description,lines);
  }

  if (stock) {
    setVisible(card,stock,'commerceStockVisible',!!field(panel,'stock-visible')?.checked);
    const state=String(field(panel,'stock-state')?.value || 'in-stock');
    card.dataset.commerceStockState=state;
    const custom=String(field(panel,'stock-custom')?.value || '');
    card.dataset.commerceStockCustom=custom;
    renderStock01042(card,stock,custom);
  }

  if (rating) {
    setVisible(card,rating,'commerceRatingVisible',!!field(panel,'rating-visible')?.checked);
    card.dataset.commerceRatingValue=String(num(field(panel,'rating-value')?.value,0,5,4.9));
    card.dataset.commerceRatingMode=String(field(panel,'rating-mode')?.value || 'stars');
    renderRating01042(card,rating);
  }

  if (reviews) {
    setVisible(card,reviews,'commerceReviewsVisible',!!field(panel,'reviews-visible')?.checked);
    card.dataset.commerceReviewsCount=String(Math.round(num(field(panel,'reviews-count')?.value,0,999999,0)));
    card.dataset.commerceReviewsLabel=String(field(panel,'reviews-label')?.value || '').trim();
    renderReviews01042(card,reviews);
  }

  updateCustomStockUi01042(panel);
  updateOutputs01042(panel);

  if (!live) {
    const result=window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.commitMainComponentContent01041?.(card,'shop-product-card-text-content-01042') || null;
    try {
      window.__ST_ALL_LOG__?.push?.('commerce-product-card-text-content-committed-01042',{
        ok:!!result?.ok,
        nodeId:String(result?.nodeId || ''),
        ratingValue:String(card.dataset.commerceRatingValue || ''),
        titleLines:String(card.dataset.commerceTitleLines || ''),
        descriptionLines:String(card.dataset.commerceDescriptionLines || ''),
        stockState:String(card.dataset.commerceStockState || ''),
        storeAuthority:!!result?.ok,
        directDomFinalCommit:false
      });
    } catch {}
  }
}

export function bindProductCardTextContentWidget01042(sectionEl,getSelection,notify){
  const panel=sectionEl?.querySelector?.('[data-product-text-widget-01042]');
  if (!panel || panel.dataset.bound01042 === '1') return;
  panel.dataset.bound01042='1';
  let raf=0;
  const live=()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>apply01042(panel,getSelection,notify,{live:true}));
  };
  panel.addEventListener('input',(ev)=>{
    if (!ev.target?.matches?.('[data-ptext]')) return;
    live();
    if (ev.target?.matches?.('[data-ptext="stock-state"],[data-ptext="title-min-height"]')) {
      updateCustomStockUi01042(panel);
      updateOutputs01042(panel);
    }
  });
  panel.addEventListener('change',(ev)=>{
    if (!ev.target?.matches?.('[data-ptext]')) return;
    apply01042(panel,getSelection,notify,{live:false});
  });
  const refresh=()=>hydrate01042(panel,getSelection);
  document.addEventListener('st:selection-changed',refresh,true);
  window.addEventListener('st-page-selected',refresh);
  window.addEventListener('st:canvas-snapshot-applied',refresh);
  window.addEventListener('builder:structureChanged',refresh);
  window.addEventListener('st:commerce-component-template-applied-01041',refresh);
  refresh();
}
