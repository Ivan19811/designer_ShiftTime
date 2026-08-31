// 01049 · Product Card floating inspector shell.
// IMPORTANT: this module does NOT clone Product Card controls.
// It temporarily reparents the exact same Product Card accordion body into
// a draggable/resizable floating window and restores it on close.

const GEOMETRY_KEY = 'st_shop_product_card_floating_geometry_v1_01049';
const OPEN_CLASS = 'is-product-card-floating-01049';

const QUICK_NAV = Object.freeze([
  ['binding', 'Дані', '[data-commerce-binding-widget-01064]'],
  ['contract', 'Огляд', '[data-product-card-contract-widget]'],
  ['image', 'Фото', '[data-product-image-widget-01039]'],
  ['text', 'Контент', '[data-product-text-widget-01042]'],
  ['category', 'Дані категорії', '[data-category-card-data-widget-01050]'],
  ['price', 'Ціна', '[data-product-price-widget-01043]'],
  ['badge', 'Badge', '[data-product-badge-widget-01044]'],
  ['actions', 'Кнопки', '[data-product-actions-widget-01045]'],
  ['layout', 'Layout', '[data-product-layout-widget-01046]']
]);

function clamp(n, min, max){ return Math.max(min, Math.min(max, Number(n) || min)); }

function readGeometry(){
  try {
    const raw = localStorage.getItem(GEOMETRY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (_) { return null; }
}

function writeGeometry(panel){
  if (!panel?.isConnected) return;
  const r = panel.getBoundingClientRect();
  try {
    localStorage.setItem(GEOMETRY_KEY, JSON.stringify({
      left: Math.round(r.left), top: Math.round(r.top),
      width: Math.round(r.width), height: Math.round(r.height)
    }));
  } catch (_) {}
}

function applyGeometry(panel){
  const saved = readGeometry();
  const vw = Math.max(420, window.innerWidth || 1280);
  const vh = Math.max(360, window.innerHeight || 800);
  const width = clamp(saved?.width || Math.min(1120, vw - 64), 620, Math.max(620, vw - 24));
  const height = clamp(saved?.height || Math.min(820, vh - 64), 420, Math.max(420, vh - 24));
  const left = clamp(saved?.left ?? Math.round((vw - width) / 2), 12, Math.max(12, vw - width - 12));
  const top = clamp(saved?.top ?? Math.round((vh - height) / 2), 12, Math.max(12, vh - height - 12));
  panel.style.width = `${Math.round(width)}px`;
  panel.style.height = `${Math.round(height)}px`;
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function clampPanelToViewport(panel){
  if (!panel?.isConnected) return;
  const r = panel.getBoundingClientRect();
  const vw = window.innerWidth || 1280;
  const vh = window.innerHeight || 800;
  const width = Math.min(r.width, Math.max(620, vw - 24));
  const height = Math.min(r.height, Math.max(420, vh - 24));
  const left = clamp(r.left, 12, Math.max(12, vw - width - 12));
  const top = clamp(r.top, 12, Math.max(12, vh - height - 12));
  panel.style.width = `${Math.round(width)}px`;
  panel.style.height = `${Math.round(height)}px`;
  panel.style.left = `${Math.round(left)}px`;
  panel.style.top = `${Math.round(top)}px`;
}

function buildPanel(){
  const panel = document.createElement('div');
  panel.className = 'st-product-card-floating-01049';
  panel.dataset.productCardFloating01049 = '1';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-label', 'Розширені налаштування commerce-карточки');
  panel.innerHTML = `
    <div class="st-product-card-floating-01049__chrome">
      <div class="st-product-card-floating-01049__drag" data-product-floating-drag-01049>
        <span class="st-product-card-floating-01049__icon">▦</span>
        <div>
          <strong data-commerce-floating-title-01050>Карточка товару</strong>
          <small>Розширений режим · ті самі налаштування Inspector</small>
        </div>
      </div>
      <div class="st-product-card-floating-01049__window-actions">
        <button type="button" data-product-floating-reset-01049 title="Повернути стандартний розмір і позицію">↺</button>
        <button type="button" data-product-floating-close-01049 title="Повернути віджет у сайдбар">✕</button>
      </div>
    </div>
    <div class="st-product-card-floating-01049__nav" data-product-floating-nav-01049>
      ${QUICK_NAV.map(([id,label])=>`<button type="button" data-product-floating-jump-01049="${id}">${label}</button>`).join('')}
    </div>
    <div class="st-product-card-floating-01049__mount" data-product-floating-mount-01049></div>
    <div class="st-product-card-floating-01049__resize-hint">↘ Потягни за кут, щоб змінити розмір</div>
  `;
  return panel;
}

function installDrag(panel){
  const handle = panel.querySelector('[data-product-floating-drag-01049]');
  if (!handle) return;
  let active = false;
  let pointerId = null;
  let startX = 0, startY = 0, startLeft = 0, startTop = 0;

  handle.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    active = true;
    pointerId = ev.pointerId;
    const r = panel.getBoundingClientRect();
    startX = ev.clientX; startY = ev.clientY;
    startLeft = r.left; startTop = r.top;
    try { handle.setPointerCapture(pointerId); } catch (_) {}
    handle.classList.add('is-dragging');
    ev.preventDefault();
  });

  handle.addEventListener('pointermove', (ev) => {
    if (!active || ev.pointerId !== pointerId) return;
    const r = panel.getBoundingClientRect();
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const left = clamp(startLeft + (ev.clientX - startX), 8, Math.max(8, vw - r.width - 8));
    const top = clamp(startTop + (ev.clientY - startY), 8, Math.max(8, vh - 62));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  });

  const finish = (ev) => {
    if (!active || (ev?.pointerId != null && ev.pointerId !== pointerId)) return;
    active = false;
    try { handle.releasePointerCapture(pointerId); } catch (_) {}
    pointerId = null;
    handle.classList.remove('is-dragging');
    clampPanelToViewport(panel);
    writeGeometry(panel);
  };
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
}

export function bindProductCardFloatingPanel01049(sectionEl){
  if (!sectionEl || sectionEl.dataset.productFloatingBound01049 === '1') return;
  sectionEl.dataset.productFloatingBound01049 = '1';

  const acc = sectionEl.querySelector('[data-shop-sub="product-card"]');
  const body = acc?.querySelector?.('[data-shop-sub-body="product-card"]');
  const head = acc?.querySelector?.('[data-shop-sub-head="product-card"]');
  const openButton = body?.querySelector?.('[data-product-card-floating-open-01049]');
  if (!acc || !body || !openButton) return;

  const originMarker = document.createComment('product-card-body-origin-01049');
  body.parentNode?.insertBefore(originMarker, body);

  const placeholder = document.createElement('div');
  placeholder.className = 'st-product-card-floating-placeholder-01049';
  placeholder.hidden = true;
  placeholder.innerHTML = '<b>Розширений віджет відкрито</b><span>Налаштування зараз у плаваючому вікні. Закрий його, щоб повернути контролі у сайдбар.</span>';

  let panel = null;

  function ensurePanel(){
    if (panel?.isConnected) return panel;
    panel = buildPanel();
    acc.appendChild(panel); // remains under product-card accordion: same CSS vars and same event authority.
    installDrag(panel);

    panel.querySelector('[data-product-floating-close-01049]')?.addEventListener('click', () => closeFloating(true));
    panel.querySelector('[data-product-floating-reset-01049]')?.addEventListener('click', () => {
      try { localStorage.removeItem(GEOMETRY_KEY); } catch (_) {}
      panel.style.width = '';
      panel.style.height = '';
      panel.style.left = '';
      panel.style.top = '';
      applyGeometry(panel);
      writeGeometry(panel);
    });
    panel.querySelector('[data-product-floating-nav-01049]')?.addEventListener('click', (ev) => {
      const btn = ev.target?.closest?.('[data-product-floating-jump-01049]');
      if (!btn) return;
      const id = btn.getAttribute('data-product-floating-jump-01049') || '';
      const def = QUICK_NAV.find(([key]) => key === id);
      const target = def ? body.querySelector(def[2]) : null;
      target?.scrollIntoView?.({ behavior:'smooth', block:'start', inline:'nearest' });
    });
    panel.addEventListener('pointerup', () => { clampPanelToViewport(panel); writeGeometry(panel); }, true);
    return panel;
  }

  function updateMode01050(mode){
    const p=panel; if(!p) return;
    const isCategory=String(mode||'')==='category-card';
    const title=p.querySelector('[data-commerce-floating-title-01050]'); if(title) title.textContent=isCategory?'Карточка категорії':'Карточка товару';
    const categoryNav=p.querySelector('[data-product-floating-jump-01049="category"]'); if(categoryNav) categoryNav.hidden=!isCategory;
    const priceNav=p.querySelector('[data-product-floating-jump-01049="price"]'); if(priceNav) priceNav.hidden=isCategory;
    const actionsNav=p.querySelector('[data-product-floating-jump-01049="actions"]'); if(actionsNav) actionsNav.hidden=isCategory;
  }

  function openFloating(){
    const p = ensurePanel();
    updateMode01050(sectionEl.dataset.commerceCardMode01050 || 'product-card');
    const mount = p.querySelector('[data-product-floating-mount-01049]');
    if (!mount) return;
    body.hidden = false;
    if (!placeholder.isConnected) originMarker.parentNode?.insertBefore(placeholder, originMarker.nextSibling);
    placeholder.hidden = false;
    mount.appendChild(body); // exact same controls; no clone, no duplicated state.
    body.classList.add('is-floating-01049');
    acc.classList.add(OPEN_CLASS);
    acc.style.overflow = 'visible';
    p.classList.add('is-open');
    p.hidden = false;
    applyGeometry(p);
    requestAnimationFrame(() => {
      clampPanelToViewport(p);
      p.querySelector('input,select,textarea,button')?.focus?.({ preventScroll:true });
    });
  }

  function closeFloating(focusGear){
    if (!panel || !body.classList.contains('is-floating-01049')) return;
    originMarker.parentNode?.insertBefore(body, originMarker.nextSibling);
    body.classList.remove('is-floating-01049');
    placeholder.hidden = true;
    acc.classList.remove(OPEN_CLASS);
    acc.style.removeProperty('overflow');
    panel.classList.remove('is-open');
    panel.hidden = true;
    writeGeometry(panel);
    if (focusGear) requestAnimationFrame(() => openButton.focus?.({ preventScroll:true }));
  }

  openButton.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openFloating();
  });

  // If the user collapses Product Card or the whole Shop accordion, restore the same controls first.
  head?.addEventListener('click', () => {
    if (body.classList.contains('is-floating-01049')) closeFloating(false);
  }, true);
  const shopHead = sectionEl.querySelector(':scope > .design-section__header');
  shopHead?.addEventListener('click', () => {
    if (body.classList.contains('is-floating-01049')) closeFloating(false);
  }, true);

  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || !body.classList.contains('is-floating-01049')) return;
    ev.preventDefault();
    closeFloating(true);
  }, true);

  window.addEventListener('resize', () => {
    if (!panel || panel.hidden) return;
    clampPanelToViewport(panel);
  });
  window.addEventListener('st:commerce-card-mode-changed-01050',(ev)=>updateMode01050(ev?.detail?.mode || sectionEl.dataset.commerceCardMode01050 || 'product-card'));

}
