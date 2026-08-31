// js/design/widgets/menu-builder/menu-builder-page.js
// Menu Builder як CONTENT-вʼю (аналогічно підходу з редагуванням шапки/шаблонів сайту):
// ✅ Ми НЕ робимо окремий fixed-overlay.
// ✅ Ми просто показуємо/ховаємо #menuBuilderView всередині конструктора,
//    а центральна область (CONTENT) перемикається на цей екран.
// Поки що це UI-каркас з власною шапкою: "Конструктор меню" + "Назад".

const VIEW_ID  = 'menuBuilderView';
const MOUNT_ID = 'menuBuilderMount';
const BACK_ID  = 'menuBuilderBackBtn';

function getBuilderRoot_() {
  return document.getElementById('builder-root');
}

function getCurrentContentViewKey_() {
  const root = getBuilderRoot_();
  if (!root) return 'canvas';
  if (root.classList.contains('builder--mainview-site')) return 'site';
  if (root.classList.contains('builder--mainview-pages')) return 'pages';
  return 'canvas';
}

function showMenuBuilderView_() {
  const view = document.getElementById(VIEW_ID);
  if (view) {
    view.hidden = false;
    view.style.display = '';
  }

  // Ховаємо стандартні CONTENT-вʼю вручну (бо showContentView() не знає про menuBuilderView).
  const canvas = document.getElementById('canvasView');
  const site   = document.getElementById('siteManagerView');
  const pages  = document.getElementById('pageManagerView');

  if (canvas) canvas.style.display = 'none';
  if (site) { site.hidden = true; site.style.display = 'none'; }
  if (pages){ pages.hidden = true; pages.style.display = 'none'; }
}

function hideMenuBuilderView_() {
  const view = document.getElementById(VIEW_ID);
  if (view) {
    view.hidden = true;
    view.style.display = 'none';
  }
}

function ensureMenuBuilderStyle_() {
  const STYLE_ID = 'st-menu-builder-style';
  if (document.getElementById(STYLE_ID)) return;

  // Беремо стилі тулбара "один в один" як у Налаштування шапки (Header Builder),
  // але застосовуємо до нашого #st-menu-builder-toolbar.
  const css = `
    /* --- Menu Builder Mode --- */
    body.st-menu-builder-on .builder__canvas > .canvas__header { display: none !important; }

    /* Content view layout */
    #menuBuilderView.st-mb-view{
      height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }
    #menuBuilderView .st-mb__content{
      flex: 1 1 auto;
      min-height: 0;
      padding: 12px;
    }

    /* toolbar (same visual system as header builder) */
    #st-menu-builder-toolbar{
      position: sticky;
      top: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(2, 6, 23, 0.86);
      backdrop-filter: blur(10px);
    }
    #st-menu-builder-toolbar .st-hb__title{
      font-weight: 800;
      font-size: 14px;
      letter-spacing: .2px;
      color: rgba(248, 250, 252, 0.98);
      white-space: nowrap;
    }
    #st-menu-builder-toolbar .st-hb__hint{
      font-size: 12px;
      color: rgba(226, 232, 240, 0.9);
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(15, 23, 42, 0.35);
      white-space: nowrap;
    }
    #st-menu-builder-toolbar .st-hb__spacer{ flex: 1 1 auto; }
    #st-menu-builder-toolbar .st-hb__btn{
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.3);
      background: rgba(15, 23, 42, 0.45);
      color: rgba(248, 250, 252, 0.95);
      border-radius: 12px;
      padding: 8px 10px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }
    #st-menu-builder-toolbar .st-hb__btn:hover{
      background: rgba(15, 23, 42, 0.62);
      border-color: rgba(148, 163, 184, 0.45);
    }

    #st-menu-builder-toolbar .st-mb__modes{
      display:flex;
      gap:8px;
      align-items:center;
      margin-left: 8px;
    }
    #st-menu-builder-toolbar .st-mb__mode{
      padding: 8px 12px;
      border-radius: 12px;
    }
    #st-menu-builder-toolbar .st-mb__mode.is-active{
      border-color: rgba(56,189,248,0.55);
      background: rgba(2,132,199,0.25);
      box-shadow: 0 0 0 1px rgba(56,189,248,0.18) inset;
    }


    /* content panes (contrast in constructor style) */

    /* stage (single preview area instead of two panes) */
    #menuBuilderView .st-mb-stage{
      height: 100%;
      min-height: 0;
      display:flex;
      flex-direction:column;
    }
    #menuBuilderView .st-mb-stage__frame{
      flex: 1 1 auto;
      min-height: 0;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(2, 6, 23, 0.55);
      backdrop-filter: blur(6px);
      border-radius: 14px;
      overflow: auto;
      padding: 14px;
      color: rgba(226, 232, 240, 0.92);
    }
    #menuBuilderView .st-mb-stage__empty{
      padding: 14px;
      border: 1px dashed rgba(148,163,184,0.28);
      border-radius: 12px;
      background: rgba(15,23,42,0.28);
      color: rgba(226,232,240,0.88);
      font-size: 12px;
      font-weight: 650;
    }
    #menuBuilderView .st-mb-sandbox{
      pointer-events: none;
      user-select: none;
    }
    #menuBuilderView .st-mb-sandbox *{
      pointer-events: none !important;
    }


    #menuBuilderView .st-mb-shell{
      height: 100%;
      min-height: 0;
    }
    #menuBuilderView .st-mb-grid{
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 12px;
      height: 100%;
      min-height: 0;
    }
    #menuBuilderView .st-mb-preview,
    #menuBuilderView .st-mb-inspector{
      min-height: 0;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(2, 6, 23, 0.55);
      backdrop-filter: blur(6px);
      border-radius: 14px;
      overflow: hidden;
      color: rgba(226, 232, 240, 0.92);
    }
    #menuBuilderView .st-mb-pane-title{
      padding: 10px 12px;
      font-weight: 800;
      font-size: 12px;
      letter-spacing: .2px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 23, 42, 0.35);
      color: rgba(248, 250, 252, 0.95);
    }
    #menuBuilderView .st-mb-pane-note{
      padding: 12px;
      font-size: 12px;
      line-height: 1.35;
      color: rgba(226, 232, 240, 0.88);
    }
    /* make mount text readable even if empty */
    #menuBuilderView .st-mb-preview * , #menuBuilderView .st-mb-inspector *{
      color: inherit;
    }
    @media (max-width: 1100px){
      #menuBuilderView .st-mb-grid{ grid-template-columns: 1fr; }
    }


  `.trim();

  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = css;
  document.head.appendChild(st);
}

function renderShell_(meta = {}) {
  ensureMenuBuilderStyle_();

  const mount = document.getElementById(MOUNT_ID);
  if (!mount) return;

  const scopeLabel =
    meta?.scope === 'header' ? 'Меню шапки' :
    meta?.scope === 'footer' ? 'Меню футера' :
    meta?.scope === 'sidebar'? 'Меню сайтбара' :
    meta?.scope === 'main'   ? 'Меню МАІН' :
    'Меню';

  const name = meta?.name ? String(meta.name) : '';
  const title = name ? `${scopeLabel}: ${name}` : scopeLabel;

  // Показати контекст у хінті шапки (як у "Налаштування шапки")
  try {
    const hint = document.getElementById('menuBuilderHint');
    if (hint) hint.textContent = title;
  } catch {}

  mount.innerHTML = `
    <div class="st-mb-stage">
      <div class="st-mb-stage__frame" data-mb-frame>
        <div class="st-mb-stage__empty" data-mb-empty>
          Виберіть меню на полотні та натисніть “Редагувати в конструкторі”.
        </div>
      </div>
    </div>
  `.trim();

  // Локальні стилі тільки для контенту Menu Builder (не чіпаємо глобальну тему)
  const localId = 'st-menu-builder-local-style';
  if (!document.getElementById(localId)) {
    const st = document.createElement('style');
    st.id = localId;
    st.textContent = `
      #menuBuilderView .st-mb-shell{
        width: 100%;
        display:flex;
        flex-direction:column;
        gap: 12px;
      }
      #menuBuilderView .st-mb-grid{
        display:grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 12px;
      }
      @media (max-width: 980px){
        #menuBuilderView .st-mb-grid{ grid-template-columns: 1fr; }
      }
      #menuBuilderView .st-mb-preview,
      #menuBuilderView .st-mb-inspector{
        border:1px solid rgba(148,163,184,0.35);
        border-radius:16px;
        background:rgba(255,255,255,0.86);
        padding:12px;
        min-height: 340px;
      }
      #menuBuilderView .st-mb-pane-title{ font-weight:800; margin-bottom:6px; }
      #menuBuilderView .st-mb-pane-note{ font-size:12px; opacity:.85; }
    `.trim();
    document.head.appendChild(st);
  }
}

let __prevContentViewKey = 'canvas'



let __mbCtx = {
  mode: 'section',
  menuEl: null,
  levelEl: null,
  sectionEl: null,
  headerEl: null,
  meta: null,
};

function mbPickClosest_(el, selectors){
  if (!el || !el.closest) return null;
  for (const s of selectors){
    const got = el.closest(s);
    if (got) return got;
  }
  return null;
}

function mbDeriveContext_(menuEl){
  const levelEl = mbPickClosest_(menuEl, ['[data-hb-kind="level"]','[data-level]','.st-level','.level']);
  const sectionEl = mbPickClosest_(menuEl, ['[data-hb-kind="section"]','[data-section]','.st-section','.section']);
  // "Шапка" — беремо найближчий preview wrap або слот шапки
  const headerEl =
    mbPickClosest_(menuEl, ['.hb-preview-wrap','#st-site-header-slot','[data-sec-role="header"]']) ||
    sectionEl ||
    (menuEl ? menuEl.parentElement : null);

  return { levelEl, sectionEl, headerEl };
}

function mbSetActiveModeBtn_(mode){
  const tb = document.getElementById('st-menu-builder-toolbar');
  if (!tb) return;
  const btns = Array.from(tb.querySelectorAll('[data-mb-mode]'));
  btns.forEach(b=>{
    const isOn = (b.getAttribute('data-mb-mode') === mode);
    b.classList.toggle('is-active', isOn);
  });
}

function mbRenderMode_(){
  const mount = document.getElementById(MOUNT_ID);
  if (!mount) return;
  const frame = mount.querySelector('[data-mb-frame]');
  const empty = mount.querySelector('[data-mb-empty]');
  if (!frame) return;

  // Clear previous sandbox
  frame.innerHTML = '';
  const mode = __mbCtx.mode;
  let src = null;

  if (mode === 'menu') src = __mbCtx.menuEl;
  else if (mode === 'level') src = __mbCtx.levelEl || __mbCtx.menuEl;
  else if (mode === 'section') src = __mbCtx.sectionEl || __mbCtx.levelEl || __mbCtx.menuEl;
  else if (mode === 'header') src = __mbCtx.headerEl || __mbCtx.sectionEl || __mbCtx.menuEl;

  if (!src) {
    frame.appendChild(empty || document.createElement('div'));
    return;
  }

  const sandbox = document.createElement('div');
  sandbox.className = 'st-mb-sandbox';
  // Глибокий клон: показуємо тільки превʼю, без взаємодій
  const clone = src.cloneNode(true);
  sandbox.appendChild(clone);
  frame.appendChild(sandbox);
}

function mbBindModeButtons_(){
  const tb = document.getElementById('st-menu-builder-toolbar');
  if (!tb || tb.__mbBound) return;
  tb.__mbBound = true;

  tb.addEventListener('click', (e)=>{
    const btn = e.target?.closest?.('[data-mb-mode]');
    if (!btn) return;
    const mode = btn.getAttribute('data-mb-mode');
    if (!mode) return;
    __mbCtx.mode = mode;
    mbSetActiveModeBtn_(mode);
    mbRenderMode_();
  });
}

export function openMenuBuilderPage(meta = {}) {
  // Запамʼятати, звідки прийшли
  __prevContentViewKey = getCurrentContentViewKey_();

  // Привести CONTENT у чистий стан (сховати галереї/оверлеї, якщо були)
  try { window.ST_SHOW_CONTENT_VIEW && window.ST_SHOW_CONTENT_VIEW(__prevContentViewKey); } catch (e) {}
  try { window.ST_SHOW_CONTENT_VIEW && window.ST_SHOW_CONTENT_VIEW('canvas'); } catch (e) {}

  // Показати наше CONTENT-вʼю
  showMenuBuilderView_();
  document.body.classList.add('st-menu-builder-on');
  renderShell_(meta);
  // ---- context + default mode (секція) ----
  __mbCtx.meta = meta || {};
  __mbCtx.menuEl = meta?.element || null;
  const derived = mbDeriveContext_(__mbCtx.menuEl);
  __mbCtx.levelEl = derived.levelEl;
  __mbCtx.sectionEl = derived.sectionEl;
  __mbCtx.headerEl = derived.headerEl;

  __mbCtx.mode = 'section';
  mbBindModeButtons_();
  mbSetActiveModeBtn_('section');
  mbRenderMode_();


  // back button
  const back = document.getElementById(BACK_ID);
  if (back && !back.__st_bound) {
    back.__st_bound = true;
    back.addEventListener('click', () => closeMenuBuilderPage());
  }
}

export function closeMenuBuilderPage() {
  hideMenuBuilderView_();
  document.body.classList.remove('st-menu-builder-on');
  try { window.ST_SHOW_CONTENT_VIEW && window.ST_SHOW_CONTENT_VIEW(__prevContentViewKey || 'canvas'); } catch (e) {}
}

// Auto-bind: якщо відкривають через event-міст
try {
  if (!window.__ST_MENU_BUILDER_PAGE_LISTENER__) {
    window.__ST_MENU_BUILDER_PAGE_LISTENER__ = true;
    window.addEventListener('st:open-menu-builder', (e) => {
      const d = e?.detail || {};
      openMenuBuilderPage(d);
    });
  }
} catch {}
