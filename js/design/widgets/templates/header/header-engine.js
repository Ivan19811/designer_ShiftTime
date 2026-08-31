// js/design/widgets/templates/header/header-engine.js
// =========================================================
// ДВИЖОК ШАПКИ (Global + Page) + Render в Canvas
// - Зберігає глобальну шапку (site) і сторінкову (per-page) у localStorage
// - Тільки ОДНА шапка в DOM одночасно
// - Якщо активної шапки немає -> контент притиснутий вгору (без пустого місця)
// - Інтеграція з Галереєю через CustomEvent "st:header:apply-template"
// =========================================================

// [ПОШУК: TEMPLATES_IMPORT]
// [TEMPLATES][HEADER] demo templates import
import { getHeaderTemplatesDemo } from "./header-templates.js?v=00984";

const LS_KEY = "st_header_state_v1";

// DOM hooks (не перейменовуємо нічого)
function qs(sel) { return document.querySelector(sel); }
function getSiteRoot() { return document.getElementById("site-root"); }

function safeJsonParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

// [ПОШУК: STATE_LOAD_SAVE]
function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  const st = raw ? safeJsonParse(raw, null) : null;
  return st && typeof st === "object" ? st : {
    globalHeader: null,     // { templateId, name, html }
    defaultMode: "global",  // default for new pages
    pages: {}               // pages[pageId] = { mode: "global"|"page", pageHeader: {templateId,name,html}|null }
  };
}

function saveState(st) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch {}
}

// =========================================================
// [ПОШУК: PAGE_ID_RESOLVE]
// ВАЖЛИВО: PageId беремо ПЕРШИМ з #site-root.dataset.pageId
// бо саме туди ти вже пишеш pageId у builder-init.js.
// =========================================================
function getCurrentPageId() {
  // 0) Найнадійніше: dataset.pageId на #site-root (твій актуальний механізм)
  const root = getSiteRoot();
  const dsId = root?.dataset?.pageId;
  if (dsId) return String(dsId);

  // 1) якщо PageManager дає id/slug
  if (window.PageManager) {
    if (typeof window.PageManager.getCurrentPageId === "function") {
      const id = window.PageManager.getCurrentPageId();
      if (id) return String(id);
    }
    if (typeof window.PageManager.getCurrentPageSlug === "function") {
      const slug = window.PageManager.getCurrentPageSlug();
      if (slug) return String(slug);
    }
  }

  // 2) якщо десь тримаєш у localStorage (fallback)
  const lsId =
    localStorage.getItem("st_current_page_id") ||
    localStorage.getItem("st_current_page_slug");
  if (lsId) return String(lsId);

  // 3) fallback (але це вже крайній випадок)
  return "page_default";
}


// =========================================================
// [HEADER][RUNTIME TOKENS] Підстановка токенів у HTML шаблону
// Підтримує: {{PAGE_ID}}, {{PAGE_TITLE}}
// =========================================================
function getCurrentPageTitle() {
  // 1) якщо PageManager має назву
  try {
    if (window.PageManager) {
      if (typeof window.PageManager.getCurrentPageTitle === "function") {
        const t = window.PageManager.getCurrentPageTitle();
        if (t) return String(t);
      }
      if (typeof window.PageManager.getCurrentPageName === "function") {
        const t = window.PageManager.getCurrentPageName();
        if (t) return String(t);
      }
    }
  } catch {}

  // 2) fallback: часто назву тримають у localStorage
  const lsTitle =
    localStorage.getItem("st_current_page_title") ||
    localStorage.getItem("st_current_page_name") ||
    localStorage.getItem("st_current_page_label");

  if (lsTitle) return String(lsTitle);

  // 3) якщо не знайшли — повертаємо порожньо
  return "";
}

function applyRuntimeTokens(html, ctx) {
  const src = String(html || "");
  const pageId = ctx?.pageId ? String(ctx.pageId) : "";
  const pageTitle = ctx?.pageTitle ? String(ctx.pageTitle) : "";

  return src
    .replaceAll("{{PAGE_ID}}", escapeHtml(pageId))
    .replaceAll("{{PAGE_TITLE}}", escapeHtml(pageTitle));
}





// [ПОШУК: PAGE_STATE_HELPERS]
function ensurePageState(st, pageId) {
  st.pages = st.pages && typeof st.pages === "object" ? st.pages : {};
  if (!st.pages[pageId]) {
    st.pages[pageId] = { mode: st.defaultMode || "global", pageHeader: null };
  }
  return st.pages[pageId];
}

function getActiveMode(st, pageId) {
  const p = ensurePageState(st, pageId);
  return p.mode || "global";
}

function getActiveHeaderPayload(st, pageId) {
  const mode = getActiveMode(st, pageId);
  const p = ensurePageState(st, pageId);

  if (mode === "page") return p.pageHeader || null;
  return st.globalHeader || null;
}

// [ПОШУК: DOM_HEADER_REMOVE]
function removeExistingHeaderDom(root) {
  if (!root) return;
  const existing = root.querySelector('[data-st-role="site-header"]');
  if (existing) existing.remove();
}

// [ПОШУК: HTML_WRAP]
function wrapHeaderHtml(payload) {
  // Обгортка, щоб:
  // 1) легко знайти/видалити
  // 2) не мішати з секціями
  const name = payload?.name ? String(payload.name) : "Header";
  return `
    <div data-st-role="site-header" data-st-header-name="${escapeHtml(name)}">
      ${payload?.html || ""}
    </div>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// =========================================================
// [ПОШУК: PUBLIC_API]
// ПУБЛІЧНЕ API
// =========================================================

export function setHeaderModeForCurrentPage(mode) {
  const st = loadState();
  const pageId = getCurrentPageId();
  const p = ensurePageState(st, pageId);
  p.mode = (mode === "page") ? "page" : "global";
  saveState(st);
  renderHeaderForCurrentPage();
}

export function setGlobalHeader(payload) {
  const st = loadState();
  st.globalHeader = payload ? { ...payload } : null;
  saveState(st);
  renderHeaderForCurrentPage();
}

export function setPageHeaderForCurrentPage(payload) {
  const st = loadState();
  const pageId = getCurrentPageId();
  const p = ensurePageState(st, pageId);
  p.pageHeader = payload ? { ...payload } : null;
  saveState(st);
  renderHeaderForCurrentPage();
}

export function getHeaderUiStateForCurrentPage() {
  const st = loadState();
  const pageId = getCurrentPageId();
  const p = ensurePageState(st, pageId);

  return {
    pageId,
    mode: p.mode || st.defaultMode || "global",
    globalHeader: st.globalHeader || null,
    pageHeader: p.pageHeader || null,
  };
}

// =========================================================
// [ПОШУК: RENDER_HEADER]
// Render в Canvas
// =========================================================
export function renderHeaderForCurrentPage() {
  const root = getSiteRoot();
  if (!root) return;

  const st = loadState();
  const pageId = getCurrentPageId();
  const payload = getActiveHeaderPayload(st, pageId);

  // 1) прибрати стару шапку (якщо була)
  removeExistingHeaderDom(root);

    // 2) якщо немає payload -> нічого не вставляємо (контент притискається вгору)
  if (!payload || !payload.html) return;

  // =========================================================
  // [HEADER][RUNTIME TOKENS] тут підставляємо токени в HTML
  // =========================================================
  const pageTitle = getCurrentPageTitle();
  const htmlWithTokens = applyRuntimeTokens(payload.html, { pageId, pageTitle });
  const payloadRuntime = { ...payload, html: htmlWithTokens };

  // 3) вставити шапку на самий верх site-root
  const tmp = document.createElement("div");
  tmp.innerHTML = wrapHeaderHtml(payloadRuntime);





  const el = tmp.firstElementChild;
  if (!el) return;

  root.prepend(el);
}

// =========================================================
// [ПОШУК: GALLERY_EVENT_INTEGRATION]
// ІНТЕГРАЦІЯ З ГАЛЕРЕЄЮ
// CustomEvent: "st:header:apply-template"
// detail: { target: "global"|"page"|"ask", template: {templateId,name,html} }
// =========================================================

function onApplyTemplate(e) {
  const d = e?.detail || {};
  const tpl = d.template || null;
  if (!tpl || !tpl.html) return;

  const target = d.target || "ask";

  if (target === "global") {
    setGlobalHeader(tpl);
    // логічно: якщо вибрали глобальну — активуємо global
    setHeaderModeForCurrentPage("global");
    return;
  }

  if (target === "page") {
    setPageHeaderForCurrentPage(tpl);
    setHeaderModeForCurrentPage("page");
    return;
  }

  // ask -> MVP: prompt (ти потім заміниш на нормальний UI)
  const choice = prompt("Як застосувати шапку?\n1 = Глобальна\n2 = Для сторінки", "1");
  if (choice === "2") {
    setPageHeaderForCurrentPage(tpl);
    setHeaderModeForCurrentPage("page");
  } else {
    setGlobalHeader(tpl);
    setHeaderModeForCurrentPage("global");
  }
}

let bound = false;

export function initHeaderEngine() {
  if (bound) return;
  bound = true;

  // [ПОШУК: INIT_RENDER] стартовий рендер
  renderHeaderForCurrentPage();

  // [ПОШУК: INIT_LISTEN_GALLERY] слухаємо застосування з галереї
  document.addEventListener("st:header:apply-template", onApplyTemplate);

  // [ПОШУК: INIT_PAGE_CHANGED] якщо сторінка змінилась — перемалювати
  // Підтримуємо обидва варіанти назв подій (щоб не ламалось)
  document.addEventListener("st:page:changed", () => renderHeaderForCurrentPage());
  document.addEventListener("st:page-changed", () => renderHeaderForCurrentPage());
  document.addEventListener("builder:pageChanged", () => renderHeaderForCurrentPage());
}

// =========================================================
// [ПОШУК: TEMPLATES_API]
// [TEMPLATES][HEADER] API для галереї шаблонів шапки
// =========================================================

function getTemplates() {
  // Поки що демо. Далі тут підключимо “збережені/користувацькі”
  return getHeaderTemplatesDemo();
}

function getTemplateById(id) {
  if (!id) return null;
  return getTemplates().find(t => t.id === id) || null;
}

// =========================================================
// [ПОШУК: EXPOSE_WINDOW]
// [TEMPLATES][HEADER] expose для галереї (не ламає існуюче)
// =========================================================
window.HeaderEngine = window.HeaderEngine || {};
window.HeaderEngine.listTemplates = getTemplates;
window.HeaderEngine.getTemplateById = getTemplateById;
window.HeaderEngine.renderHeaderForCurrentPage = renderHeaderForCurrentPage;
window.HeaderEngine.getHeaderUiStateForCurrentPage = getHeaderUiStateForCurrentPage;
