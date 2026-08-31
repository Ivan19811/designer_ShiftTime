// js/design/widgets/help/help-modal.js
// Універсальна Help-модалка для пояснень (відкривається по іконці "?" у віджетах)
// ВАЖЛИВО: модалка НЕ прив'язана до конкретного віджета (Header/Footer/Section/Block)

const MODAL_ID = 'stHelpModal';
const STYLE_ID = 'stHelpModalStyles';
const LS_ZOOM = 'st_help_modal_zoom_v1';
const LS_TEXT_COLOR = 'st_help_modal_text_color_v1';
const LS_BG_COLOR = 'st_help_modal_bg_color_v1';
const LS_BG_ALPHA = 'st_help_modal_bg_alpha_v1';
const LS_GEOM = 'st_help_modal_geom_v1';

const DEFAULT_TEXT_COLOR = '#ffffff';
const DEFAULT_BG_COLOR = '#0b1220';
const DEFAULT_BG_ALPHA = 0.96;

function hexToRgb(hex){
  const h = String(hex || '').trim().replace('#','');
  if (h.length !== 6) return { r: 11, g: 18, b: 32 };
  const n = parseInt(h, 16);
  if (!Number.isFinite(n)) return { r: 11, g: 18, b: 32 };
  return { r: (n>>16)&255, g: (n>>8)&255, b: n&255 };
}

function rgbaFromHex(hex, a){
  const {r,g,b} = hexToRgb(hex);
  const aa = Math.max(0, Math.min(1, Number(a)));
  return `rgba(${r},${g},${b},${aa})`;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
    #${MODAL_ID}{
      position:fixed; inset:0; z-index:99999;
      --sthmTextSize: 15px;
      --sthmIntroSize: 14px;
      --sthmTitleSize: 18px;

      /* Theme (можна міняти у UI) */
      --sthmTextColor: ${DEFAULT_TEXT_COLOR};
      --sthmTextMuted: rgba(226,232,240,.92);
      --sthmPanelBg: ${DEFAULT_BG_COLOR};
      --sthmPanelBgRGBA: rgba(11,18,32,${DEFAULT_BG_ALPHA});
      --sthmOverlayBgRGBA: rgba(2,6,23,.86);

      display:none; align-items:center; justify-content:center;
      /* CRISP MODE: прибираємо blur/backdrop-filter, бо він робить текст \"мильним\" у Chromium/Windows */
      background:var(--sthmOverlayBgRGBA);
      backdrop-filter: none;
    }
    #${MODAL_ID} .sthm__panel{
      width: var(--sthmW, min(1040px, calc(100vw - 32px)));
      height: var(--sthmH, min(680px, calc(100vh - 32px)));
      position:fixed;
      left: var(--sthmX, 50%);
      top: var(--sthmY, 50%);
      transform: var(--sthmT, translate(-50%, -50%));
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
      max-height: min(78vh, 760px);
      /* CRISP MODE: суцільний фон панелі для чіткого тексту */
      background:var(--sthmPanelBgRGBA);
      border:1px solid rgba(148,163,184,.22);
      border-radius:16px;
      box-shadow:0 24px 80px rgba(0,0,0,.55);
      overflow:hidden;
      display:flex; flex-direction:column;
    }
    #${MODAL_ID} .sthm__head{
      cursor:move;
      user-select:none;
      -webkit-user-select:none;

      padding:14px 16px;
      display:flex; align-items:center; justify-content:space-between;
      border-bottom:1px solid rgba(148,163,184,.18);
    }
    #${MODAL_ID} .sthm__title{
      font-size:16px; font-weight:800; letter-spacing:.2px;
      color:var(--sthmTextColor);
    }
    
    #${MODAL_ID} .sthm__tools{
      display:flex;
      align-items:center;
      gap:10px;
      margin-left:auto;
      margin-right:10px;
    }
    #${MODAL_ID} .sthm__zoomLabel{
      font-size:12px;
      font-weight:800;
      letter-spacing:.4px;
      color:rgba(148,163,184,.95);
      padding:4px 8px;
      border-radius:999px;
      border:1px solid rgba(148,163,184,.18);
      background:var(--sthmPanelBg);
      user-select:none;
      white-space:nowrap;
    }
    #${MODAL_ID} .sthm__zoom{
      width:180px;
      max-width:22vw;
      accent-color:#38bdf8;
    }
    #${MODAL_ID} .sthm__zoomVal{
      min-width:38px;
      text-align:center;
      font-size:12px;
      font-weight:900;
      color:var(--sthmTextColor);
      padding:4px 8px;
      border-radius:999px;
      border:1px solid rgba(148,163,184,.18);
      background:var(--sthmPanelBg);
    }
    #${MODAL_ID} .sthm__tools input[type="color"]{
      width:32px;
      height:26px;
      padding:0;
      border:none;
      background:transparent;
      cursor:pointer;
    }
    #${MODAL_ID} .sthm__tools input[type="color"]::-webkit-color-swatch{
      border-radius:10px;
      border:1px solid rgba(148,163,184,.28);
    }
    #${MODAL_ID} .sthm__tools input[type="color"]::-webkit-color-swatch-wrapper{
      padding:0;
    }
    @media (max-width: 560px){
      #${MODAL_ID} .sthm__zoom{ width:120px; }
      #${MODAL_ID} .sthm__tools{ gap:8px; margin-right:6px; }
    }

#${MODAL_ID} .sthm__close{
      appearance:none;
      border:1px solid rgba(148,163,184,.22);
      background:#0f172a;
      color:var(--sthmTextColor);
      border-radius:12px;
      padding:8px 10px;
      cursor:pointer;
      font-weight:700;
      transition:transform .08s ease, border-color .12s ease, background .12s ease;
    }
    #${MODAL_ID} .sthm__close:hover{ border-color:rgba(56,189,248,.35); background:#13203a; }
    #${MODAL_ID} .sthm__close:active{ transform:translateY(1px); }

    
    #${MODAL_ID} .sthm__resize{
      position:absolute;
      right:10px;
      bottom:10px;
      width:16px;
      height:16px;
      cursor:se-resize;
      border-right:2px solid rgba(148,163,184,.55);
      border-bottom:2px solid rgba(148,163,184,.55);
      border-radius:2px;
      opacity:.9;
      user-select:none;
      touch-action:none;
    }
    #${MODAL_ID} .sthm__panel{
      box-sizing:border-box;
    }
    #${MODAL_ID} .sthm__body{
      display:grid;
      grid-template-columns: 320px 1fr;
      gap:0;
      min-height:0;
      flex:1 1 auto;
    }
    @media (max-width: 860px){
      #${MODAL_ID} .sthm__body{ grid-template-columns: 1fr; }
    }
    #${MODAL_ID} .sthm__left{
      border-right:1px solid rgba(148,163,184,.14);
      padding:12px;
      overflow:auto;
    }
    @media (max-width: 860px){
      #${MODAL_ID} .sthm__left{ border-right:0; border-bottom:1px solid rgba(148,163,184,.14); }
    }
    #${MODAL_ID} .sthm__right{
      padding:14px 16px;
      overflow:auto;
    }
    #${MODAL_ID} .sthm__intro{ color:var(--sthmTextMuted); font-size:var(--sthmIntroSize); margin:0 0 10px; line-height:1.5; }

    #${MODAL_ID} .sthm__group{
      margin:10px 0 6px;
      font-size:12px;
      font-weight:800;
      letter-spacing:.6px;
      color:rgba(148,163,184,.85);
      text-transform:uppercase;
    }
    #${MODAL_ID} .sthm__item{
      width:100%;
      display:flex; align-items:center; justify-content:space-between;
      gap:10px;
      padding:10px 10px;
      border-radius:12px;
      border:1px solid rgba(148,163,184,.16);
      background:#0f172a;
      color:var(--sthmTextColor);
      font-weight:800;
      font-size:13px;
      cursor:pointer;
      transition:transform .08s ease, border-color .12s ease, background .12s ease, opacity .12s ease;
      margin-bottom:8px;
      text-align:left;
    }
    #${MODAL_ID} .sthm__item:hover{ border-color:rgba(56,189,248,.35); background:#13203a; }
    #${MODAL_ID} .sthm__item:active{ transform:translateY(1px); }
    #${MODAL_ID} .sthm__item.is-active{
      border-color:rgba(56,189,248,.55);
      box-shadow:0 0 0 1px rgba(56,189,248,.16) inset, 0 10px 20px rgba(0,0,0,.28);
    }
    #${MODAL_ID} .sthm__badge{
      font-size:11px;
      font-weight:900;
      letter-spacing:.4px;
      padding:4px 8px;
      border-radius:999px;
      border:1px solid rgba(148,163,184,.18);
      background:var(--sthmPanelBg);
      color:var(--sthmTextColor);
      white-space:nowrap;
    }
    #${MODAL_ID} .sthm__item.is-disabled{
      opacity:.45;
      cursor:not-allowed;
    }
    #${MODAL_ID} .sthm__item.is-disabled:hover{ border-color:rgba(148,163,184,.16); background:#0f172a; }

    #${MODAL_ID} .sthm__descTitle{
      margin:0 0 8px;
      font-size:var(--sthmTitleSize);
      font-weight:900;
      letter-spacing:.2px;
      color:var(--sthmTextColor);
    }
    #${MODAL_ID} .sthm__desc{
      margin:0;
      font-size:var(--sthmTextSize);
      line-height:1.65;
      color:var(--sthmTextColor);
      white-space:pre-wrap;
    }

    #${MODAL_ID} .sthm__panel{ overscroll-behavior:contain; }
    #${MODAL_ID} .sthm__resizer{
      position:absolute;
      right:10px;
      bottom:10px;
      width:16px;
      height:16px;
      cursor:nwse-resize;
      border-radius:6px;
      border:1px solid rgba(148,163,184,.35);
      background:rgba(148,163,184,.12);
    }
    #${MODAL_ID} .sthm__resizer:hover{
      background:rgba(148,163,184,.20);
      border-color:rgba(148,163,184,.55);
    }
  `;

  document.head.appendChild(st);
}

function clamp(n, a, b){ n = Number(n); if (!Number.isFinite(n)) return a; return Math.max(a, Math.min(b, n)); }

function applyZoom(root, size){
  const s = clamp(size, 8, 22);
  root.style.setProperty('--sthmTextSize', s + 'px');
  root.style.setProperty('--sthmIntroSize', Math.max(8, s - 1) + 'px');
  root.style.setProperty('--sthmTitleSize', Math.max(12, Math.min(26, s + 3)) + 'px');
  const valEl = root.querySelector('[data-zoom-val]');
  const input = root.querySelector('[data-zoom]');
  if (valEl) valEl.textContent = String(s);
  if (input) input.value = String(s);
}

function applyTheme(root, theme){
  const textColor = (theme?.textColor || DEFAULT_TEXT_COLOR);
  const bgColor = (theme?.bgColor || DEFAULT_BG_COLOR);
  const bgAlpha = clamp(theme?.bgAlpha ?? DEFAULT_BG_ALPHA, 0, 1);

  root.style.setProperty('--sthmTextColor', textColor);
  root.style.setProperty('--sthmTextMuted', 'rgba(226,232,240,.92)');
  root.style.setProperty('--sthmPanelBg', bgColor);
  root.style.setProperty('--sthmPanelBgRGBA', rgbaFromHex(bgColor, bgAlpha));

  const tc = root.querySelector('[data-text-color]');
  const bc = root.querySelector('[data-bg-color]');
  const oa = root.querySelector('[data-bg-alpha]');
  const oval = root.querySelector('[data-bg-alpha-val]');
  if (tc) tc.value = textColor;
  if (bc) bc.value = bgColor;
  if (oa) oa.value = String(Math.round(bgAlpha*100));
  if (oval) oval.textContent = String(Math.round(bgAlpha*100)) + '%';
}


function loadGeom(){
  try {
    const raw = localStorage.getItem(LS_GEOM);
    if (!raw) return null;
    const g = JSON.parse(raw);
    if (!g || typeof g !== 'object') return null;
    const x = Number(g.x), y = Number(g.y), w = Number(g.w), h = Number(g.h);
    if (![x,y,w,h].every(n => Number.isFinite(n))) return null;
    return { x, y, w, h };
  } catch(_) { return null; }
}

function applyGeom(root, geom){
  if (!geom) return;
  const m = 0; // safe margin
  const vw = Math.max(320, window.innerWidth || 0);
  const vh = Math.max(320, window.innerHeight || 0);

  const w = clamp(geom.w, 520, vw - m*2);
  const h = clamp(geom.h, 320, vh - m*2);
  const x = clamp(geom.x, m, vw - w - m);
  const y = clamp(geom.y, m, vh - h - m);

  root.style.setProperty('--sthmW', w + 'px');
  root.style.setProperty('--sthmH', h + 'px');
  root.style.setProperty('--sthmX', x + 'px');
  root.style.setProperty('--sthmY', y + 'px');
  root.style.setProperty('--sthmT', 'translate(0,0)');
}

function readGeomFromPanel(panel){
  const r = panel.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}

function saveGeom(panel){
  try { localStorage.setItem(LS_GEOM, JSON.stringify(readGeomFromPanel(panel))); } catch(_){}
}



function ensureModal() {
  ensureStyles();

  let root = document.getElementById(MODAL_ID);
  if (root) return root;

  root = document.createElement('div');
  root.id = MODAL_ID;
  root.innerHTML = `
    <div class="sthm__panel" role="dialog" aria-modal="true">
      <div class="sthm__head" data-drag="1">
        <div class="sthm__title" data-title>Пояснення</div>
        <div class="sthm__tools" data-tools>
          <div class="sthm__zoomLabel">Розмір тексту</div>
          <input class="sthm__zoom" data-zoom type="range" min="8" max="22" step="1" value="15" />
          <div class="sthm__zoomVal" data-zoom-val>15</div>

          <div class="sthm__zoomLabel">Колір тексту</div>
          <input data-text-color type="color" value="#ffffff" />

          <div class="sthm__zoomLabel">Фон</div>
          <input data-bg-color type="color" value="#0b1220" />

          <div class="sthm__zoomLabel">Прозорість</div>
          <input class="sthm__zoom" style="width:120px" data-bg-alpha type="range" min="0" max="100" step="1" value="96" />
          <div class="sthm__zoomVal" data-bg-alpha-val>96%</div>
        </div>
        <button type="button" class="sthm__close" data-act="close">Закрити</button>
      </div>
      <div class="sthm__body">
        <div class="sthm__left" data-left></div>
        <div class="sthm__right">
          <p class="sthm__intro" data-intro></p>
          <h3 class="sthm__descTitle" data-desc-title></h3>
          <p class="sthm__desc" data-desc></p>
        </div>
      </div>
      <div class="sthm__resizer" data-resize="1" aria-hidden="true"></div>
    </div>
  `;

  root.addEventListener('click', (e) => {
    const actEl = e.target.closest('[data-act]');
    if (actEl && actEl.dataset.act === 'close') {
      closeHelpModal();
      return;
    }
    // клік по бекдропу
    if (e.target === root) closeHelpModal();
  });

  // zoom
  const zoomInput = root.querySelector('[data-zoom]');
  if (zoomInput) {
    zoomInput.addEventListener('input', () => {
      const v = clamp(zoomInput.value, 8, 22);
      try { localStorage.setItem(LS_ZOOM, String(v)); } catch(_){}
      applyZoom(root, v);
    });
  }

  // theme controls (колір тексту / фон / прозорість)
  const textColorInput = root.querySelector('[data-text-color]');
  const bgColorInput = root.querySelector('[data-bg-color]');
  const bgAlphaInput = root.querySelector('[data-bg-alpha]');

  const readTheme = () => {
    const tc = (textColorInput?.value || DEFAULT_TEXT_COLOR);
    const bc = (bgColorInput?.value || DEFAULT_BG_COLOR);
    const oa = clamp((Number(bgAlphaInput?.value) || Math.round(DEFAULT_BG_ALPHA*100)) / 100, 0, 1);
    return { textColor: tc, bgColor: bc, bgAlpha: oa };
  };

  const persistTheme = (t) => {
    try { localStorage.setItem(LS_TEXT_COLOR, t.textColor); } catch(_){ }
    try { localStorage.setItem(LS_BG_COLOR, t.bgColor); } catch(_){ }
    try { localStorage.setItem(LS_BG_ALPHA, String(t.bgAlpha)); } catch(_){ }
  };

  const onThemeChange = () => {
    const t = readTheme();
    persistTheme(t);
    applyTheme(root, t);
  };

  textColorInput?.addEventListener('input', onThemeChange);
  bgColorInput?.addEventListener('input', onThemeChange);
  bgAlphaInput?.addEventListener('input', onThemeChange);

  // ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeHelpModal();
  });

  document.body.appendChild(root);

  // drag + resize (CRISP, без transform на панелі)
  const panel = root.querySelector('.sthm__panel');
  const dragHandle = root.querySelector('[data-drag="1"]');
  const resizer = root.querySelector('[data-resize="1"]');

  const stopIfFormEl = (t) => {
    if (!t) return false;
    return !!t.closest('button, input, select, textarea, a, [data-act]');
  };

  let dragState = null;
  if (dragHandle && panel) {
    dragHandle.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      if (ev.button !== 0) return;
      if (stopIfFormEl(ev.target)) return;

      const g = readGeomFromPanel(panel);
      dragState = {
        id: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        baseX: g.x,
        baseY: g.y,
        w: g.w,
        h: g.h,
      };
      dragHandle.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
    });

    dragHandle.addEventListener('pointermove', (ev) => {
      if (!dragState || ev.pointerId !== dragState.id) return;
      const dx = ev.clientX - dragState.startX;
      const dy = ev.clientY - dragState.startY;

      const m = 0;
      const vw = Math.max(320, window.innerWidth || 0);
      const vh = Math.max(320, window.innerHeight || 0);

      const x = clamp(dragState.baseX + dx, m, vw - dragState.w);
      const y = clamp(dragState.baseY + dy, m, vh - dragState.h);

      root.style.setProperty('--sthmX', x + 'px');
      root.style.setProperty('--sthmY', y + 'px');
      root.style.setProperty('--sthmT', 'translate(0,0)');
    });

    const endDrag = (ev) => {
      if (!dragState) return;
      if (ev && ev.pointerId !== dragState.id) return;
      dragState = null;
      try { saveGeom(panel); } catch(_){}
    };

    dragHandle.addEventListener('pointerup', endDrag);
    dragHandle.addEventListener('pointercancel', endDrag);
    dragHandle.addEventListener('lostpointercapture', endDrag);
  }

  let resizeState = null;
  if (resizer && panel) {
    resizer.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      if (ev.button !== 0) return;
      const g = readGeomFromPanel(panel);
      resizeState = {
        id: ev.pointerId,
        startX: ev.clientX,
        startY: ev.clientY,
        baseW: g.w,
        baseH: g.h,
        baseX: g.x,
        baseY: g.y,
      };
      resizer.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
      ev.stopPropagation();
    });

    resizer.addEventListener('pointermove', (ev) => {
      if (!resizeState || ev.pointerId !== resizeState.id) return;
      const dx = ev.clientX - resizeState.startX;
      const dy = ev.clientY - resizeState.startY;

      const m = 0;
      const vw = Math.max(320, window.innerWidth || 0);
      const vh = Math.max(320, window.innerHeight || 0);

      let w = clamp(resizeState.baseW + dx, 520, vw - m*2);
      let h = clamp(resizeState.baseH + dy, 320, vh - m*2);

      // keep inside viewport if user resized while near edge
      const x = clamp(resizeState.baseX, m, vw - w - m);
      const y = clamp(resizeState.baseY, m, vh - h - m);

      root.style.setProperty('--sthmW', w + 'px');
      root.style.setProperty('--sthmH', h + 'px');
      root.style.setProperty('--sthmX', x + 'px');
      root.style.setProperty('--sthmY', y + 'px');
      root.style.setProperty('--sthmT', 'translate(0,0)');
    });

    const endResize = (ev) => {
      if (!resizeState) return;
      if (ev && ev.pointerId !== resizeState.id) return;
      resizeState = null;
      try { saveGeom(panel); } catch(_){}
    };
    resizer.addEventListener('pointerup', endResize);
    resizer.addEventListener('pointercancel', endResize);
    resizer.addEventListener('lostpointercapture', endResize);
  }
  return root;
}

function setActive(root, key) {
  const btns = Array.from(root.querySelectorAll('button[data-key]'));
  btns.forEach(b => b.classList.toggle('is-active', b.dataset.key === key));
}

function render(root, cfg) {
  const titleEl = root.querySelector('[data-title]');
  const introEl = root.querySelector('[data-intro]');
  const leftEl  = root.querySelector('[data-left]');
  const dtEl    = root.querySelector('[data-desc-title]');
  const dEl     = root.querySelector('[data-desc]');

  if (titleEl) titleEl.textContent = cfg?.title || 'Пояснення';
  if (introEl) introEl.textContent = cfg?.intro || '';
  if (leftEl) leftEl.innerHTML = '';

  const items = Array.isArray(cfg?.items) ? cfg.items : [];
  const defaultKey = cfg?.activeKey || (items.find(it => it && it.key && !it.disabled)?.key) || (items[0]?.key);

  const byKey = new Map();
  items.forEach(it => { if (it && it.key) byKey.set(String(it.key), it); });

  function show(key) {
    const it = byKey.get(String(key));
    if (!it) return;
    if (dtEl) dtEl.textContent = it.label || '';
    if (dEl) dEl.textContent = it.desc || '';
    setActive(root, String(it.key));
  }

  // left list
  let lastGroup = null;
  for (const it of items) {
    if (!it) continue;
    const group = it.group || null;
    if (group && group !== lastGroup) {
      const g = document.createElement('div');
      g.className = 'sthm__group';
      g.textContent = group;
      leftEl.appendChild(g);
      lastGroup = group;
    }

    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sthm__item' + (it.disabled ? ' is-disabled' : '');
    b.dataset.key = String(it.key);
    b.innerHTML = `
      <span>${it.label || ''}</span>
      ${it.tag ? `<span class="sthm__badge">${it.tag}</span>` : ''}
    `;
    b.addEventListener('click', () => {
      if (it.disabled) return;
      show(it.key);
    });
    leftEl.appendChild(b);
  }

  // initial
  show(defaultKey);
}

export function openHelpModal(cfg) {
  const root = ensureModal();
	// theme restore
	let textColor = DEFAULT_TEXT_COLOR;
	let bgColor = DEFAULT_BG_COLOR;
	let bgAlpha = DEFAULT_BG_ALPHA;
	try { textColor = localStorage.getItem(LS_TEXT_COLOR) || DEFAULT_TEXT_COLOR; } catch(_){ }
	try { bgColor = localStorage.getItem(LS_BG_COLOR) || DEFAULT_BG_COLOR; } catch(_){ }
	try { bgAlpha = parseFloat(localStorage.getItem(LS_BG_ALPHA) || String(DEFAULT_BG_ALPHA)); } catch(_){ }
	bgAlpha = clamp(bgAlpha, 0, 1);
	applyTheme(root, { textColor, bgColor, bgAlpha });
  let saved = 15;
  try { saved = parseInt(localStorage.getItem(LS_ZOOM) || '15', 10); } catch(_){}
  applyZoom(root, saved);

  // geometry restore (drag/resize)
  const storedGeom = loadGeom();
  if (storedGeom) {
    applyGeom(root, storedGeom);
  } else {
    const vw = Math.max(320, window.innerWidth || 0);
    const vh = Math.max(320, window.innerHeight || 0);
    const w = Math.min(1040, vw - 32);
    const h = Math.min(680, vh - 32);
    applyGeom(root, { x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2), w, h });
  }

  render(root, cfg || {});
  root.style.display = 'flex';
}

export function closeHelpModal() {
  const root = document.getElementById(MODAL_ID);
  if (!root) return;
  root.style.display = 'none';
}
