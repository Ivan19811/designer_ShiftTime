// js/design/widgets/product-search/product-search-widget.js
// Product Search widget for ShiftTime Builder.
// Створює готовий блок пошуку товарів і легкий runtime-шар.

const SEC_ID = 'st-product-search-widget-section';
const STYLE_ID = 'st-product-search-widget-style';
const CATALOG_LS_KEY = 'ST_PRODUCT_CATALOG_V1';
const DEFAULT_RESULTS_PATH = 'search';

function escHtml_(value){
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cssUrl_(url){
  const raw = String(url || '').trim();
  if (!raw) return '';
  return raw.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function clampInt_(value, min, max, fallback){
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeDetail_(detail){
  const d = detail && typeof detail === 'object' ? detail : {};
  const layoutRaw = String(d.layout || d.mode || 'field-button');
  const layout = ['field-button','field-icon','icon-only','full'].includes(layoutRaw) ? layoutRaw : 'field-button';
  const behaviorRaw = String(d.behavior || 'results');
  const behavior = ['results','category-or-results','exact-or-results'].includes(behaviorRaw) ? behaviorRaw : 'results';
  const placeholder = String(d.placeholder || 'Пошук товарів...').trim() || 'Пошук товарів...';
  const buttonText = String(d.buttonText || 'Пошук').trim() || 'Пошук';
  const resultsPath = String(d.resultsPath || DEFAULT_RESULTS_PATH).trim().replace(/^#?\/?/, '') || DEFAULT_RESULTS_PATH;
  const minChars = clampInt_(d.minChars, 1, 20, 2);
  const debounce = clampInt_(d.debounce, 0, 3000, 250);
  const suggestions = d.suggestions === false ? false : true;
  const submitOnEnter = d.submitOnEnter === false ? false : true;
  const showIcon = d.showIcon === false ? false : true;
  return { layout, behavior, placeholder, buttonText, resultsPath, minChars, debounce, suggestions, submitOnEnter, showIcon };
}

export function ensureProductSearchStyles(){
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .st-block--product-search{
      --st-product-search-gap: 8px;
      --st-product-search-radius: 999px;
      --st-product-search-bg: rgba(255,255,255,.96);
      --st-product-search-text: #0f172a;
      --st-product-search-muted: #64748b;
      --st-product-search-button-bg: #2563eb;
      --st-product-search-button-text: #ffffff;
      --st-product-search-border: rgba(15,23,42,.16);
      display:flex;
      align-items:center;
      width:min(100%, 520px);
      min-width: 180px;
      max-width: 100%;
      background: transparent;
      color: var(--st-product-search-text);
      box-sizing:border-box;
    }
    .st-product-search__form{
      width:100%;
      display:flex;
      align-items:center;
      gap:var(--st-product-search-gap);
      margin:0;
      box-sizing:border-box;
    }
    .st-product-search__box{
      flex:1 1 auto;
      min-width:0;
      display:flex;
      align-items:center;
      gap:8px;
      padding:8px 12px;
      border:1px solid var(--st-product-search-border);
      border-radius:var(--st-product-search-radius);
      background:var(--st-product-search-bg);
      box-sizing:border-box;
    }
    .st-product-search__icon{
      flex:0 0 auto;
      width:18px;
      height:18px;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      color:var(--st-product-search-muted);
      line-height:0;
    }
    .st-product-search__icon svg{width:100%;height:100%;display:block;}
    .st-product-search__field{
      flex:1 1 auto;
      min-width:0;
      border:0;
      outline:0;
      background:transparent;
      color:var(--st-product-search-text);
      font:inherit;
      font-size:14px;
      line-height:1.35;
      padding:4px 0;
      box-sizing:border-box;
    }
    .st-product-search__field::placeholder{color:var(--st-product-search-muted);}
    .st-product-search__button{
      flex:0 0 auto;
      border:0;
      border-radius:var(--st-product-search-radius);
      padding:10px 16px;
      background:var(--st-product-search-button-bg);
      color:var(--st-product-search-button-text);
      font:inherit;
      font-size:14px;
      font-weight:800;
      line-height:1;
      cursor:pointer;
      white-space:nowrap;
      box-sizing:border-box;
    }
    .st-product-search__button:hover{filter:brightness(1.05);}
    .st-block--product-search[data-product-search-layout="icon-only"]{width:auto;min-width:0;}
    .st-block--product-search[data-product-search-layout="icon-only"] .st-product-search__box{display:none;}
    .st-block--product-search[data-product-search-layout="icon-only"] .st-product-search__button{width:42px;height:42px;padding:0;display:inline-flex;align-items:center;justify-content:center;}
    .st-block--product-search[data-product-search-layout="icon-only"] .st-product-search__button-text{display:none;}
    .st-block--product-search[data-product-search-layout="field-icon"] .st-product-search__button{width:42px;height:42px;padding:0;display:inline-flex;align-items:center;justify-content:center;}
    .st-block--product-search[data-product-search-layout="field-icon"] .st-product-search__button-text{display:none;}
    .st-block--product-search[data-product-search-show-icon="0"] .st-product-search__icon{display:none;}
    .st-product-search__part.is-selected,
    .st-product-search__part.is-active{
      outline:2px solid rgba(34,197,94,.95) !important;
      outline-offset:2px;
    }
    #${SEC_ID} .st-psw-note{font-size:12px;color:rgba(226,232,240,.78);line-height:1.45;padding:8px 10px;border:1px solid rgba(148,163,184,.18);border-radius:12px;background:rgba(2,6,23,.22);margin-bottom:10px;}
    #${SEC_ID} .st-psw-grid{display:flex;flex-direction:column;gap:10px;}
    #${SEC_ID} .st-psw-field{display:flex;flex-direction:column;gap:5px;font-size:12px;color:rgba(226,232,240,.86);}
    #${SEC_ID} .st-psw-field input,
    #${SEC_ID} .st-psw-field select{width:100%;border:1px solid rgba(148,163,184,.28);border-radius:10px;background:rgba(15,23,42,.86);color:#e5e7eb;padding:8px 9px;box-sizing:border-box;}
    #${SEC_ID} .st-psw-actions{display:flex;flex-wrap:wrap;gap:8px;}
    #${SEC_ID} .st-psw-btn{border:1px solid rgba(148,163,184,.26);border-radius:999px;background:rgba(15,23,42,.72);color:#e5e7eb;padding:8px 10px;font-size:12px;font-weight:800;cursor:pointer;}
    #${SEC_ID} .st-psw-btn.is-primary{background:#2563eb;border-color:#60a5fa;color:#fff;}
    #${SEC_ID} .st-psw-btn.is-ghost{background:rgba(2,6,23,.28);}
    #${SEC_ID} .st-psw-empty{font-size:12px;color:rgba(248,113,113,.95);padding:8px 10px;border:1px solid rgba(248,113,113,.25);border-radius:12px;background:rgba(127,29,29,.16);}
  `.trim();
  document.head.appendChild(style);
}

function searchIconSvg_(){
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>';
}

export function updateProductSearchBlock(block, detail){
  if (!block) return null;
  const d = normalizeDetail_(detail || block.dataset || {});
  block.classList.add('st-block', 'st-block--product-search');
  block.dataset.blockKind = 'product-search';
  block.dataset.name = 'Пошук товарів';
  block.dataset.productSearchLayout = d.layout;
  block.dataset.productSearchBehavior = d.behavior;
  block.dataset.productSearchPlaceholder = d.placeholder;
  block.dataset.productSearchButtonText = d.buttonText;
  block.dataset.productSearchResultsPath = d.resultsPath;
  block.dataset.productSearchMinChars = String(d.minChars);
  block.dataset.productSearchDebounce = String(d.debounce);
  block.dataset.productSearchSuggestions = d.suggestions ? '1' : '0';
  block.dataset.productSearchSubmitOnEnter = d.submitOnEnter ? '1' : '0';
  block.dataset.productSearchShowIcon = d.showIcon ? '1' : '0';

  let form = block.querySelector(':scope > .st-product-search__form');
  if (!form) {
    form = document.createElement('form');
    form.className = 'st-product-search__form';
    form.setAttribute('data-product-search-form', '1');
    form.setAttribute('autocomplete', 'off');
    block.innerHTML = '';
    block.appendChild(form);
  }
  form.innerHTML = `
    <div class="st-product-search__box st-product-search__part" data-st-product-search-part="field-wrap" title="Поле пошуку товарів">
      <span class="st-product-search__icon st-product-search__part" data-st-product-search-part="icon" aria-hidden="true">${searchIconSvg_()}</span>
      <input class="st-product-search__field st-product-search__part" data-st-product-search-part="field" type="search" autocomplete="off" placeholder="${escHtml_(d.placeholder)}" aria-label="${escHtml_(d.placeholder)}">
    </div>
    <button class="st-product-search__button st-product-search__part" data-st-product-search-part="button" type="submit">
      <span class="st-product-search__button-icon" aria-hidden="true">${searchIconSvg_()}</span>
      <span class="st-product-search__button-text">${escHtml_(d.buttonText)}</span>
    </button>
  `.trim();
  return block;
}

export function createProductSearchBlock(detail){
  ensureProductSearchStyles();
  const d = normalizeDetail_(detail || {});
  const el = document.createElement('div');
  el.className = 'hb-elem st-block st-block--product-search';
  el.dataset.blockKind = 'product-search';
  el.dataset.name = 'Пошук товарів';
  el.dataset.hbTip = 'Пошук товарів';
  el.style.width = d.layout === 'icon-only' ? 'auto' : 'min(100%, 520px)';
  el.style.maxWidth = '100%';
  el.style.minWidth = d.layout === 'icon-only' ? '0' : '180px';
  el.style.flex = '0 1 auto';
  updateProductSearchBlock(el, d);
  return el;
}

export function isProductSearchBlock(el){
  return !!(el && el.classList && el.classList.contains('st-block--product-search'));
}

function findProductSearchBlockFromSelection_(sel){
  const arr = sel && Array.isArray(sel.elements) ? sel.elements : [];
  for (const el of arr) {
    if (!el || !el.closest) continue;
    const block = el.classList?.contains('st-block--product-search') ? el : el.closest('.st-block--product-search');
    if (block) return block;
  }
  const active = document.querySelector('.st-block--product-search.is-selected, .st-block--product-search.is-active, .st-product-search__part.is-selected, .st-product-search__part.is-active');
  if (active) return active.classList?.contains('st-block--product-search') ? active : active.closest('.st-block--product-search');
  return null;
}

function clearLocalSelection_(scope){
  const root = scope || document;
  try {
    root.querySelectorAll('.is-selected, .is-active').forEach(el => {
      if (el.classList && (el.classList.contains('st-product-search__part') || el.classList.contains('st-block--product-search'))) {
        el.classList.remove('is-selected', 'is-active');
      }
    });
  } catch(e) {}
}

function selectProductSearchPart_(block, part){
  if (!block) return;
  const owner = block.closest('#st-site-header-slot, #st-site-footer-slot, #site-root') || document;
  try {
    owner.querySelectorAll('.is-selected, .is-active').forEach(el => el.classList.remove('is-selected', 'is-active'));
  } catch(e) { clearLocalSelection_(owner); }
  let target = block;
  if (part && part !== 'root') {
    target = block.querySelector(`[data-st-product-search-part="${CSS.escape(part)}"]`) || block;
  }
  target.classList.add('is-selected', 'is-active');
  try { target.scrollIntoView({ block:'center', inline:'center', behavior:'smooth' }); } catch(e) {}
  try { window.dispatchEvent(new CustomEvent('st:selection:changed', { detail:{ element: target, source:'product-search-widget' } })); } catch(e) {}
}

function readCatalog_(){
  try {
    if (Array.isArray(window.ST_PRODUCT_CATALOG)) return window.ST_PRODUCT_CATALOG;
  } catch(e) {}
  try {
    const raw = localStorage.getItem(CATALOG_LS_KEY) || '';
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch(e) { return []; }
}

function normalizeText_(s){
  return String(s || '').toLowerCase().replace(/[’'`ʼ]/g, '').replace(/\s+/g, ' ').trim();
}

function filterCatalog_(catalog, query){
  const q = normalizeText_(query);
  if (!q) return [];
  return (catalog || []).filter(item => {
    const hay = normalizeText_([
      item?.title, item?.name, item?.slug, item?.sku, item?.category, item?.tags && Array.isArray(item.tags) ? item.tags.join(' ') : item?.tags
    ].filter(Boolean).join(' '));
    return hay.includes(q) || q.split(' ').every(part => part && hay.includes(part));
  });
}

function navigateToResults_(block, query, matches){
  const behavior = String(block?.dataset?.productSearchBehavior || 'results');
  const path = String(block?.dataset?.productSearchResultsPath || DEFAULT_RESULTS_PATH).replace(/^#?\/?/, '') || DEFAULT_RESULTS_PATH;
  const exact = matches.length === 1 ? matches[0] : null;
  if ((behavior === 'exact-or-results' || behavior === 'category-or-results') && exact && exact.url) {
    try { window.location.href = String(exact.url); return; } catch(e) {}
  }
  const hash = `${path}?q=${encodeURIComponent(query)}`;
  try { window.location.hash = hash; } catch(e) { window.location.href = `#${hash}`; }
}

function handleProductSearchSubmit_(block){
  const field = block.querySelector('.st-product-search__field');
  const query = String(field?.value || '').trim();
  const minChars = clampInt_(block.dataset.productSearchMinChars, 1, 20, 2);
  if (query.length < minChars) {
    try { field?.focus(); } catch(e) {}
    return;
  }
  const catalog = readCatalog_();
  const matches = filterCatalog_(catalog, query);
  const detail = { query, block, catalog, matches, hasProducts: catalog.length > 0 };
  try { window.dispatchEvent(new CustomEvent('st:product-search:submit', { detail })); } catch(e) {}
  try {
    if (window.ST_PRODUCT_SEARCH && typeof window.ST_PRODUCT_SEARCH.search === 'function') {
      window.ST_PRODUCT_SEARCH.search(detail);
      return;
    }
    if (typeof window.ST_PRODUCT_SEARCH_HANDLER === 'function') {
      window.ST_PRODUCT_SEARCH_HANDLER(detail);
      return;
    }
  } catch(e) {}
  navigateToResults_(block, query, matches);
}

function installProductSearchRuntime_(){
  if (window.__ST_PRODUCT_SEARCH_RUNTIME__) return;
  window.__ST_PRODUCT_SEARCH_RUNTIME__ = true;
  document.addEventListener('submit', (ev) => {
    const form = ev.target && ev.target.closest ? ev.target.closest('.st-product-search__form') : null;
    if (!form) return;
    const block = form.closest('.st-block--product-search');
    if (!block) return;
    ev.preventDefault();
    handleProductSearchSubmit_(block);
  }, true);

  document.addEventListener('pointerdown', (ev) => {
    const part = ev.target && ev.target.closest ? ev.target.closest('[data-st-product-search-part]') : null;
    if (!part) return;
    const block = part.closest('.st-block--product-search');
    if (!block) return;
    if (!(block.closest('#st-site-header-slot, #st-site-footer-slot, #site-root'))) return;
    selectProductSearchPart_(block, part.dataset.stProductSearchPart || 'root');
  }, true);
}

function notifyChanged_(block){
  try { window.dispatchEvent(new CustomEvent('st:product-search:block-changed', { detail:{ block } })); } catch(e) {}
}

function renderPanel_(sectionEl, block){
  const body = sectionEl.querySelector('.design-section__body');
  if (!body) return;
  if (!block) {
    body.innerHTML = `<div class="st-psw-empty">Вибери блок <b>Пошук товарів</b> у шапці або футері. Після цього тут зʼявляться його налаштування.</div>`;
    return;
  }
  const d = normalizeDetail_(block.dataset || {});
  body.innerHTML = `
    <div class="st-psw-note">
      Це налаштування логіки пошуку. Стилі самого віджета, поля, кнопки та іконки можна змінювати стандартними віджетами інспектора: <b>Розмір</b>, <b>Заливка</b>, <b>Бордер</b>, <b>Тінь</b>, <b>Текст</b>.
    </div>
    <div class="st-psw-grid">
      <label class="st-psw-field"><span>Placeholder поля</span><input data-psw-input="placeholder" value="${escHtml_(d.placeholder)}"></label>
      <label class="st-psw-field"><span>Текст кнопки</span><input data-psw-input="buttonText" value="${escHtml_(d.buttonText)}"></label>
      <label class="st-psw-field"><span>Вигляд</span><select data-psw-input="layout">
        <option value="field-button" ${d.layout==='field-button'?'selected':''}>Поле + кнопка</option>
        <option value="field-icon" ${d.layout==='field-icon'?'selected':''}>Поле + іконка-кнопка</option>
        <option value="icon-only" ${d.layout==='icon-only'?'selected':''}>Тільки іконка</option>
        <option value="full" ${d.layout==='full'?'selected':''}>Повний широкий пошук</option>
      </select></label>
      <label class="st-psw-field"><span>Логіка результатів</span><select data-psw-input="behavior">
        <option value="results" ${d.behavior==='results'?'selected':''}>Завжди сторінка результатів</option>
        <option value="category-or-results" ${d.behavior==='category-or-results'?'selected':''}>Категорія, якщо знайдена, інакше результати</option>
        <option value="exact-or-results" ${d.behavior==='exact-or-results'?'selected':''}>Точний товар, якщо 1 результат, інакше результати</option>
      </select></label>
      <label class="st-psw-field"><span>Шлях сторінки результатів</span><input data-psw-input="resultsPath" value="${escHtml_(d.resultsPath)}" placeholder="search"></label>
      <label class="st-psw-field"><span>Мінімум символів</span><input type="number" min="1" max="20" data-psw-input="minChars" value="${escHtml_(d.minChars)}"></label>
      <div class="st-psw-actions">
        <button type="button" class="st-psw-btn is-primary" data-psw-select="root">Весь віджет</button>
        <button type="button" class="st-psw-btn" data-psw-select="field-wrap">Поле</button>
        <button type="button" class="st-psw-btn" data-psw-select="button">Кнопка</button>
        <button type="button" class="st-psw-btn" data-psw-select="icon">Іконка</button>
      </div>
      <div class="st-psw-note">Поки товарів немає, пошук просто відкриває <b>#${escHtml_(d.resultsPath)}?q=...</b>. Коли буде каталог, достатньо наповнити <b>window.ST_PRODUCT_CATALOG</b> або <b>${CATALOG_LS_KEY}</b>.</div>
    </div>
  `.trim();
}

function readPanelDetail_(sectionEl, block){
  const get = (name) => sectionEl.querySelector(`[data-psw-input="${name}"]`);
  return normalizeDetail_({
    ...(block?.dataset || {}),
    placeholder: get('placeholder')?.value,
    buttonText: get('buttonText')?.value,
    layout: get('layout')?.value,
    behavior: get('behavior')?.value,
    resultsPath: get('resultsPath')?.value,
    minChars: get('minChars')?.value,
  });
}

export function initProductSearchWidget(host, getSelection){
  ensureProductSearchStyles();
  installProductSearchRuntime_();
  if (!host) return;
  if (host.querySelector(`#${CSS.escape(SEC_ID)}`)) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;
  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title"><span>Пошук товарів</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden></div>
  `.trim();
  host.appendChild(sectionEl);

  const header = sectionEl.querySelector('.design-section__header');
  const body = sectionEl.querySelector('.design-section__body');
  if (header && body) {
    header.addEventListener('click', () => {
      const open = !sectionEl.classList.contains('is-open');
      sectionEl.classList.toggle('is-open', open);
      body.hidden = !open;
      renderPanel_(sectionEl, findProductSearchBlockFromSelection_(getSelection ? getSelection() : null));
    });
  }

  const refresh = () => {
    if (!sectionEl.classList.contains('is-open')) return;
    renderPanel_(sectionEl, findProductSearchBlockFromSelection_(getSelection ? getSelection() : null));
  };
  window.addEventListener('st:selection:changed', refresh);
  window.addEventListener('st:design:focus-product-search-widget', () => {
    sectionEl.classList.add('is-open');
    if (body) body.hidden = false;
    renderPanel_(sectionEl, findProductSearchBlockFromSelection_(getSelection ? getSelection() : null));
    try { sectionEl.scrollIntoView({ block:'center', behavior:'smooth' }); } catch(e) {}
  });

  sectionEl.addEventListener('input', (ev) => {
    const inp = ev.target && ev.target.closest ? ev.target.closest('[data-psw-input]') : null;
    if (!inp) return;
    const block = findProductSearchBlockFromSelection_(getSelection ? getSelection() : null);
    if (!block) return;
    updateProductSearchBlock(block, readPanelDetail_(sectionEl, block));
    notifyChanged_(block);
  });
  sectionEl.addEventListener('change', (ev) => {
    const inp = ev.target && ev.target.closest ? ev.target.closest('[data-psw-input]') : null;
    if (!inp) return;
    const block = findProductSearchBlockFromSelection_(getSelection ? getSelection() : null);
    if (!block) return;
    updateProductSearchBlock(block, readPanelDetail_(sectionEl, block));
    notifyChanged_(block);
    renderPanel_(sectionEl, block);
  });
  sectionEl.addEventListener('click', (ev) => {
    const btn = ev.target && ev.target.closest ? ev.target.closest('[data-psw-select]') : null;
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    const block = findProductSearchBlockFromSelection_(getSelection ? getSelection() : null);
    if (!block) return;
    selectProductSearchPart_(block, String(btn.dataset.pswSelect || 'root'));
  });
}

// Глобальний API для Header/Footer builder без прямого import, щоб не ламати старі залежності.
if (typeof window !== 'undefined') {
  window.STProductSearchWidget = window.STProductSearchWidget || {
    ensureProductSearchStyles,
    createProductSearchBlock,
    updateProductSearchBlock,
    isProductSearchBlock,
  };
  try { ensureProductSearchStyles(); installProductSearchRuntime_(); } catch(e) {}
}
