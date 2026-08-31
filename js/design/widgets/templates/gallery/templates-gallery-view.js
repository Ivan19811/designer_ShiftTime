import {
  enterTemplatesGalleryWorkspace,
  exitTemplatesGalleryWorkspace,
  getOrCreateTemplateGalleryView
} from '../templates-gallery-workspace-mode.js';

// js/design/widgets/templates/gallery/templates-gallery-view.js
// 00950: section-style registry folder + style picker return contract.

// =========================================================
// Scroll lock (щоб під галереєю не скролився сайт/канвас)
// =========================================================
let __stTplGalleryScrollLocked = false;
let __stTplGalleryPrevOverflow = null;
let __stTplGalleryPrevCanvasScroll = null;

function lockPageScroll_() {
  if (__stTplGalleryScrollLocked) return;
  const html = document.documentElement;
  const body = document.body;
  __stTplGalleryPrevOverflow = {
    html: html ? html.style.overflow : "",
    body: body ? body.style.overflow : "",
  };
  if (html) html.style.overflow = "hidden";
  if (body) body.style.overflow = "hidden";

  // ✅ Важливо: у Builder основний скрол не на body, а на .canvas__scroll.
  // Тому блокуємо і його, інакше колесо мишки буде прокручувати "підкладку" під галереєю.
  const canvases = Array.from(document.querySelectorAll('.canvas__scroll'));
  __stTplGalleryPrevCanvasScroll = canvases.map((el) => ({
    el,
    overflow: el.style.overflow,
  }));
  for (const c of canvases) c.style.overflow = 'hidden';

  __stTplGalleryScrollLocked = true;
}

function unlockPageScroll_() {
  if (!__stTplGalleryScrollLocked) return;
  const html = document.documentElement;
  const body = document.body;
  if (__stTplGalleryPrevOverflow) {
    if (html) html.style.overflow = __stTplGalleryPrevOverflow.html || "";
    if (body) body.style.overflow = __stTplGalleryPrevOverflow.body || "";
  } else {
    if (html) html.style.overflow = "";
    if (body) body.style.overflow = "";
  }
  __stTplGalleryPrevOverflow = null;

  // ✅ Повертаємо overflow для .canvas__scroll
  if (Array.isArray(__stTplGalleryPrevCanvasScroll)) {
    for (const item of __stTplGalleryPrevCanvasScroll) {
      try {
        if (item?.el) item.el.style.overflow = item.overflow || '';
      } catch {}
    }
  }
  __stTplGalleryPrevCanvasScroll = null;

  __stTplGalleryScrollLocked = false;
}
// View: Галерея Шаблонів (Tabs + Folder tree + Grid)
// =========================================================
// ✅ ВЕРСІЯ: Мінімальні карточки для ШАПОК:
//  - Карточка: Назва + ID + (i) Інфо
//  - Статуси:
//      * Шапка, що застосована як GLOBAL -> зелена рамка
//      * Шапка, що застосована як PAGE   -> червона рамка
//      * Обрана в галереї (selected)     -> синя рамка (як було)
//  - У шапці галереї 2 кружечки:
//      * 🟢 Global Focus (сивий якщо не задано)
//      * 🔴 Page Focus   (сивий якщо не задано)
//    Клік -> фокус/скрол до відповідної шапки + виділення її в галереї
//  - (i) на карточці -> показує інфо про шапку (назва, id, статус)
// =========================================================

import {
  getFoldersRoot,
  findFolderById,
  createFolder,
  loadTemplatesStore,
  saveTemplatesStore,
  getTemplatesByFolderId,
  getTemplatesSummary,
  createTemplate,
  updateTemplateById,
  deleteTemplateById,
  upsertSystemTemplatesOnce,
  renameFolderById,
  deleteFolderById
} from "../store/templates-store.js?v=01050";

import { getHeaderTemplatesDemo } from "../header/header-templates.js?v=01029";
import { getFooterTemplatesDemo } from "../footer/footer-templates.js?v=01029";
import { getMainTemplatesDemo } from "../main/main-templates.js?v=01039";
import { getPageTemplatesDemo01032 } from "../page/page-templates-01032.js?v=01039";
import { getProductCardTemplates01047 } from "../shop/product-card-templates-01047.js?v=01050";
import { getCategoryCardTemplates01050 } from "../shop/category-card-templates-01050.js?v=01050";
import { getMenuTemplatesDemo } from "../menu/menu-templates.js";
import { assertTemplateStyleProfile00945 } from "../style-profile/template-style-profile-contract.js";
import {
  getSectionStyleRegistry00953,
  SECTION_STYLE_TAB_ID_00953
} from "../style-registry/section-style-registry.js?v=01033";
import {
  clearActiveTemplate00946,
  readActiveTemplate00946,
  recordActiveTemplate00946,
  createSectionStyleReference00953
} from "../style-sync/template-style-sync-state.js";
import {
  isJsonModelTemplate,
  renderModelToHtml,
  setTemplateModelEntry,
  commitAreaFromSlotToJsonState
} from '../../../../site-hf/hf-json-engine.js';

// [TEMPLATES][PREVIEW] overlay (якщо у тебе вже є preview, лишаємо імпорт)
import {
  open as openTemplatePreview,
  close as closeTemplatePreview,
  isOpen as isTemplatePreviewOpen,
  getCurrentId as getTemplatePreviewCurrentId
} from "../template-preview.js?v=01029";

const THEME_LS_KEY = "st_tpl_gallery_theme_v1";

function isAdmin_() {
  try { return (localStorage.getItem('st_user_role') || '').toLowerCase() === 'admin'; } catch (e) { return false; }
}

const DEFAULT_THEME = {
  bg: "rgba(5, 8, 14, 0.72)",
  border: "rgba(120, 160, 255, 0.18)",
  text: "rgba(243, 246, 255, 0.95)",
  headerBg: "rgba(0, 0, 0, 0.22)",
  tabBg: "rgba(255,255,255,0.03)",
  tabActive: "linear-gradient(90deg, rgba(26, 86, 170, 0.95), rgba(22, 60, 125, 0.95))",
  btnBg: "rgba(255,255,255,0.03)",
  btnBorder: "rgba(123, 155, 255, 0.18)",
  btnHover: "rgba(26, 86, 170, 0.22)"
};


// =========================================================
// [TEMPLATES][DELETE CONFIRM]
// Власна контрастна модалка для видалення шаблонів.
// Не залежить від window.stConfirm, бо він не завжди експортований у window.
// Додатковий захист: checkbox + введення слова ВИДАЛИТИ.
// =========================================================
function escapeTplConfirmHtml_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function ensureTemplateDeleteConfirmModal_() {
  let overlay = document.getElementById('stTplDeleteConfirmOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'stTplDeleteConfirmOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483000',
      'display:none',
      'align-items:center',
      'justify-content:center',
      'padding:24px',
      'background:rgba(0,0,0,.78)',
      'backdrop-filter:blur(8px)'
    ].join(';');
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showTemplateDeleteNotice_(title, message) {
  return new Promise((resolve) => {
    const overlay = ensureTemplateDeleteConfirmModal_();
    overlay.innerHTML = `
      <div role="dialog" aria-modal="true" style="width:min(640px,calc(100vw - 36px));border:2px solid rgba(95,165,255,.8);border-radius:22px;background:linear-gradient(180deg,#0b1222,#050812);box-shadow:0 34px 110px rgba(0,0,0,.72),0 0 0 1px rgba(255,255,255,.06) inset;color:#fff;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;">
        <div style="padding:22px 24px;border-bottom:1px solid rgba(255,255,255,.12);background:rgba(59,130,246,.16);">
          <div style="font-size:26px;font-weight:950;letter-spacing:.04em;text-transform:uppercase;color:#dbeafe;">${escapeTplConfirmHtml_(title)}</div>
        </div>
        <div style="padding:22px 24px;font-size:16px;line-height:1.55;color:rgba(255,255,255,.9);white-space:pre-wrap;">${escapeTplConfirmHtml_(message)}</div>
        <div style="display:flex;justify-content:flex-end;gap:12px;padding:18px 24px;border-top:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);">
          <button type="button" data-sttpl-delete-notice-ok style="border:0;border-radius:14px;padding:13px 22px;background:#2563eb;color:#fff;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 12px 30px rgba(37,99,235,.35);">Зрозуміло</button>
        </div>
      </div>
    `;
    const close = () => {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      document.removeEventListener('keydown', onKey, true);
      resolve(true);
    };
    const onKey = (ev) => {
      if (ev.key === 'Escape' || ev.key === 'Enter') {
        ev.preventDefault();
        close();
      }
    };
    overlay.querySelector('[data-sttpl-delete-notice-ok]')?.addEventListener('click', close, { once: true });
    document.addEventListener('keydown', onKey, true);
    overlay.style.display = 'flex';
    try { overlay.querySelector('[data-sttpl-delete-notice-ok]')?.focus(); } catch {}
  });
}

function showTemplateDeleteConfirm_(tpl) {
  return new Promise((resolve) => {
    const overlay = ensureTemplateDeleteConfirmModal_();
    const name = tpl?.name || 'Без назви';
    const id = tpl?.id || '';
    const isSystem = tpl?.meta?.source === 'system' || tpl?.folder?.system === true;

    overlay.innerHTML = `
      <div role="dialog" aria-modal="true" aria-labelledby="stTplDeleteTitle" style="width:min(760px,calc(100vw - 36px));border:3px solid #ff2d2d;border-radius:24px;background:linear-gradient(180deg,#1a0507,#07080d);box-shadow:0 36px 120px rgba(0,0,0,.78),0 0 0 1px rgba(255,255,255,.08) inset;color:#fff;overflow:hidden;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;">
        <div style="padding:24px 28px 20px;border-bottom:1px solid rgba(255,255,255,.14);background:linear-gradient(90deg,rgba(220,38,38,.95),rgba(127,29,29,.96));">
          <div id="stTplDeleteTitle" style="font-size:34px;line-height:1.05;font-weight:1000;letter-spacing:.055em;text-transform:uppercase;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.38);">УВАГА! ВИДАЛЕННЯ ШАБЛОНУ</div>
          <div style="margin-top:10px;font-size:15px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#fff7ed;">Цю дію не можна скасувати</div>
        </div>

        <div style="padding:24px 28px 20px;display:grid;gap:16px;">
          <div style="padding:16px 18px;border:1px solid rgba(255,255,255,.14);border-radius:18px;background:rgba(255,255,255,.045);">
            <div style="font-size:13px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#fca5a5;">Буде видалено</div>
            <div style="margin-top:8px;font-size:24px;font-weight:950;color:#fff;word-break:break-word;">${escapeTplConfirmHtml_(name)}</div>
            <div style="margin-top:6px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;color:rgba(255,255,255,.62);word-break:break-all;">id: ${escapeTplConfirmHtml_(id)}</div>
            ${isSystem ? `<div style="margin-top:12px;display:inline-flex;align-items:center;gap:8px;padding:8px 11px;border-radius:999px;background:rgba(251,191,36,.13);border:1px solid rgba(251,191,36,.34);color:#fde68a;font-size:13px;font-weight:900;">⚠ Системний шаблон буде приховано й не відновиться автоматично</div>` : ``}
          </div>

          <label style="display:flex;gap:12px;align-items:flex-start;padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.14);cursor:pointer;">
            <input data-sttpl-delete-check type="checkbox" style="width:22px;height:22px;margin-top:2px;accent-color:#dc2626;">
            <span style="font-size:17px;line-height:1.45;font-weight:850;color:#fff;">Я розумію, що шаблон буде видалено з галереї.</span>
          </label>

          <div style="display:grid;gap:8px;">
            <div style="font-size:16px;font-weight:900;color:#fecaca;">Для підтвердження введи великими буквами:</div>
            <div style="font-size:30px;font-weight:1000;letter-spacing:.14em;color:#fff;background:#7f1d1d;border:2px solid #ef4444;border-radius:16px;padding:10px 14px;text-align:center;">ВИДАЛИТИ</div>
            <input data-sttpl-delete-input type="text" autocomplete="off" spellcheck="false" placeholder="Введи тут: ВИДАЛИТИ" style="width:100%;box-sizing:border-box;border:2px solid rgba(248,113,113,.62);border-radius:16px;background:#fff;color:#111827;padding:15px 16px;font-size:21px;font-weight:950;outline:none;letter-spacing:.06em;">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:12px;padding:20px 28px 24px;border-top:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);">
          <button type="button" data-sttpl-delete-cancel style="border:1px solid rgba(255,255,255,.22);border-radius:16px;padding:14px 22px;background:rgba(255,255,255,.08);color:#fff;font-size:16px;font-weight:950;cursor:pointer;">Скасувати</button>
          <button type="button" data-sttpl-delete-ok disabled style="border:0;border-radius:16px;padding:14px 24px;background:#5b1111;color:rgba(255,255,255,.48);font-size:16px;font-weight:1000;letter-spacing:.04em;cursor:not-allowed;box-shadow:none;">ТАК, ВИДАЛИТИ</button>
        </div>
      </div>
    `;

    const check = overlay.querySelector('[data-sttpl-delete-check]');
    const input = overlay.querySelector('[data-sttpl-delete-input]');
    const okBtn = overlay.querySelector('[data-sttpl-delete-ok]');
    const cancelBtn = overlay.querySelector('[data-sttpl-delete-cancel]');

    const update = () => {
      const valid = !!check?.checked && String(input?.value || '').trim().toUpperCase() === 'ВИДАЛИТИ';
      if (okBtn) {
        okBtn.disabled = !valid;
        okBtn.style.background = valid ? 'linear-gradient(90deg,#dc2626,#991b1b)' : '#5b1111';
        okBtn.style.color = valid ? '#fff' : 'rgba(255,255,255,.48)';
        okBtn.style.cursor = valid ? 'pointer' : 'not-allowed';
        okBtn.style.boxShadow = valid ? '0 16px 42px rgba(220,38,38,.42)' : 'none';
      }
    };

    const close = (val) => {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
      document.removeEventListener('keydown', onKey, true);
      resolve(!!val);
    };

    const onKey = (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        close(false);
      }
      if (ev.key === 'Enter' && okBtn && !okBtn.disabled) {
        ev.preventDefault();
        close(true);
      }
    };

    check?.addEventListener('change', update);
    input?.addEventListener('input', update);
    cancelBtn?.addEventListener('click', () => close(false), { once: true });
    okBtn?.addEventListener('click', () => {
      if (!okBtn.disabled) close(true);
    });
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) close(false);
    }, { once: true });
    document.addEventListener('keydown', onKey, true);

    overlay.style.display = 'flex';
    update();
    try { input?.focus(); } catch {}
  });
}


// --- Single Source of Truth: apply Header template via SiteHeaderRuntime + ST_HEADER_STATE ---
// --- Single Source of Truth: apply Header template via SiteHeaderRuntime + ST_HEADER_STATE ---
function logTemplateAuthoredStyle00772_(area, tpl, html, phase = 'apply') {
  try {
    const text = String(html || '');
    const styleCount = (text.match(/\sstyle=/gi) || []).length;
    const importantCount = (text.match(/!important/gi) || []).length;
    const hasOverwriteCss = !!document.getElementById('st-global-style-runtime-css-00687')
      || !!document.getElementById('st-global-ready-theme-hmf-contract-00770');
    const firstStyle = (text.match(/style=["']([^"']{1,220})/i) || [])[1] || '';
    window.__ST_PERF_DIAG__?.push?.('template-authored-style-authority-00772', {
      area,
      phase,
      templateId: tpl?.id || tpl?.model?.templateId || '',
      isJson: !!(tpl && isJsonModelTemplate(tpl)),
      htmlLength: text.length,
      inlineStyleCount: styleCount,
      importantCount,
      globalOverwriteCssPresent: hasOverwriteCss,
      firstStyle
    }, hasOverwriteCss ? 'warn' : 'info');
  } catch (_) {}
}

function applyHeaderTemplateViaRuntime({ html, mode, pageId, tpl = null }) {
  const isJson = isJsonModelTemplate(tpl);
  const safeHTML = isJson && tpl?.model ? renderModelToHtml(tpl.model) : (html || "");
  logTemplateAuthoredStyle00772_('header', tpl, safeHTML, 'apply');

  const State = window.ST_HEADER_STATE || null;
  const Runtime = window.SiteHeaderRuntime || null;

  // 🔧 Адаптер під різні назви методів, щоб "точно спрацювало"
  const setGlobal = State?.setGlobalHTML || State?.setGlobal || State?.setGlobalHeaderHTML || null;
  const setPage   = State?.setPageHTML   || State?.setPage   || State?.setPageHeaderHTML   || null;

  const setMode = Runtime?.setMode || null;
  const sync = Runtime?.sync || null;

  if (!State || !Runtime || !sync || (!setGlobal && !setPage)) {
    console.warn("[Templates] Header runtime/state not ready:", {
      hasState: !!State,
      hasRuntime: !!Runtime,
      hasSync: !!sync,
      hasSetGlobal: !!setGlobal,
      hasSetPage: !!setPage
    });

    // ✅ fallback: запамʼятати запит і застосувати після закриття галереї
    try {
      localStorage.setItem("st_header_pending_apply_v1", JSON.stringify({
        html: safeHTML,
        mode: mode === "page" ? "page" : "global",
        pageId: pageId || null
      }));
    } catch {}
    return;
  }


  // 1) записуємо у state. Для тестових 00 шаблонів зберігаємо model + html.
  if (isJson && tpl?.model && typeof State?.setGlobalTemplateData === 'function' && typeof State?.setPageTemplateData === 'function') {
    const entry = setTemplateModelEntry({
      area: 'header',
      mode: mode === 'page' ? 'page' : 'global',
      pageId: pageId || '',
      templateId: tpl.id || tpl?.model?.templateId || '',
      model: tpl.model,
      html: safeHTML,
      reason: 'template-gallery-apply-00547'
    });
    const data = { ...entry, source: 'template-gallery-json-apply-00547' };
    if (mode === "page" && pageId) State.setPageTemplateData(String(pageId), data);
    else State.setGlobalTemplateData(data);
  } else if (mode === "page" && pageId && setPage) {
    setPage.call(State, String(pageId), safeHTML);
  } else if (setGlobal) {
    setGlobal.call(State, safeHTML);
  }

  // 2) ставимо режим (якщо API підтримує)
  if (setMode) {
    if (mode === "page" && pageId) setMode.call(Runtime, "page", String(pageId));
    else setMode.call(Runtime, "global");
  }

  // 3) синхронізуємо рендер
  sync.call(Runtime);
}




function footerTemplateHtmlAsAuthored00544_(html) {
  // 00544: футер-шаблони фізично виправлені в footer-templates.js.
  // Повертаємо HTML як є — без auto-wrap і без окремого компілятора.
  return String(html || '');
}

function applyFooterTemplateViaRuntime({ html, mode, pageId, tpl = null }) {
  const isJson = isJsonModelTemplate(tpl);
  const safeHTML = isJson && tpl?.model ? renderModelToHtml(tpl.model) : footerTemplateHtmlAsAuthored00544_(html || "");
  logTemplateAuthoredStyle00772_('footer', tpl, safeHTML, 'apply');

  if (window.__ST_TPL_DEBUG__) {
    console.log("[TPL][footer] applyFooterTemplateViaRuntime", {
      mode,
      pageId,
      htmlLen: safeHTML.length,
      hasFooterState: !!window.ST_FOOTER_STATE,
      hasFooterRuntime: !!window.SiteFooterRuntime,
    });
  }

  const State = window.ST_FOOTER_STATE || null;
  const Runtime = window.SiteFooterRuntime || null;

  const setGlobal = State?.setGlobalHTML || State?.setGlobal || State?.setGlobalFooterHTML || null;
  const setPage   = State?.setPageHTML   || State?.setPage   || State?.setPageFooterHTML   || null;
  const setMode = Runtime?.setMode || null;
  const sync = Runtime?.sync || null;

  if (!State || !Runtime || !sync || (!setGlobal && !setPage)) {
    console.warn("[Templates] Footer runtime/state not ready:", {
      hasState: !!State,
      hasRuntime: !!Runtime,
      hasSync: !!sync,
      hasSetGlobal: !!setGlobal,
      hasSetPage: !!setPage,
    });
    return false;
  }

  const m = (mode === "page") ? "page" : "global";
  const pid = pageId || getCurrentPageIdFromDomOrLs();

  try {
    if (isJson && tpl?.model && typeof State?.setGlobalTemplateData === 'function' && typeof State?.setPageTemplateData === 'function') {
      const entry = setTemplateModelEntry({
        area: 'footer',
        mode: m,
        pageId: pid || '',
        templateId: tpl.id || tpl?.model?.templateId || '',
        model: tpl.model,
        html: safeHTML,
        reason: 'template-gallery-apply-00547'
      });
      const data = { ...entry, source: 'template-gallery-json-apply-00547' };
      if (m === "page" && pid) State.setPageTemplateData(String(pid), data);
      else State.setGlobalTemplateData(data);
    } else if (m === "page" && pid && setPage) setPage.call(State, String(pid), safeHTML);
    else if (setGlobal) setGlobal.call(State, safeHTML);
  } catch (e) {
    console.warn("[Templates] Footer apply failed:", e);
    return false;
  }

  try { setMode?.call(Runtime, m, pid); } catch (e) {}
  try { sync?.call(Runtime); } catch (e) {}

  return true;
}


















function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_LS_KEY);
    if (!raw) return { ...DEFAULT_THEME };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_THEME, ...(parsed || {}) };
  } catch {
    return { ...DEFAULT_THEME };
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_LS_KEY, JSON.stringify(theme));
  } catch {}
}

function debounce(fn, wait = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function applyThemeToView(view, theme) {
  if (!view) return;
  view.style.setProperty("--sttpl-bg", theme.bg);
  view.style.setProperty("--sttpl-border", theme.border);
  view.style.setProperty("--sttpl-text", theme.text);

  view.style.setProperty("--sttpl-header-bg", theme.headerBg);
  view.style.setProperty("--sttpl-tab-bg", theme.tabBg);
  view.style.setProperty("--sttpl-tab-active", theme.tabActive);

  view.style.setProperty("--sttpl-btn-bg", theme.btnBg);
  view.style.setProperty("--sttpl-btn-border", theme.btnBorder);
  view.style.setProperty("--sttpl-btn-hover", theme.btnHover);
}

function qs(sel) { return document.querySelector(sel); }
function getSiteRoot() {
  return document.querySelector('#canvasView > #site-canvas > #site-root')
    || document.querySelector('#canvasView #site-canvas #site-root')
    || null;
}
function getCanvasScroll() { return qs(".canvas__scroll"); }

// 00946: active template identity is SiteFrameStore metadata.
// The old UI-only Header/Footer localStorage markers are no longer written or read.

function getCurrentPageIdFromDomOrLs() {
  // 0) найточніше — з runtime
  const rtId = window?.SiteHeaderRuntime?.getPageId?.();
  if (rtId) return String(rtId);

  // 1) pageId на site-root
  const root = getSiteRoot();
  const domId = root?.dataset?.pageId;
  if (domId) return String(domId);

  // 2) PageManager, якщо є
  const pm = window.PageManager || window.pageManager;
  const pmId = pm?.getActivePageId?.() || pm?.getCurrentPageId?.() || pm?.activePageId || pm?.currentPageId;
  if (pmId) return String(pmId);

  // 3) fallback LS
  const lsId = localStorage.getItem("st_current_page_id") || localStorage.getItem("st_current_page_slug");
  if (lsId) return String(lsId);

  // 4) дефолт (під твою header-state.js)
  return "page:default";
}

// Безпечний pageId (залишили як wrapper, бо в коді інколи використовується getPageIdSafe_)
function getPageIdSafe_() {
  try {
    return getCurrentPageIdFromDomOrLs();
  } catch (e) {
    console.warn('[templates-gallery] getPageIdSafe_ fallback', e);
    return 'page:default';
  }
}



function readHeaderAppliedState() {
  const pageId = getCurrentPageIdFromDomOrLs();
  const globalTemplate = readActiveTemplate00946('header', { mode: 'global', pageId });
  const pageTemplate = readActiveTemplate00946('header', { mode: 'page', pageId });
  return {
    pageId,
    globalTplId: globalTemplate?.templateId || null,
    pageTplId: pageTemplate?.templateId || null
  };
}

function writeHeaderAppliedState({ pageId, globalTplId, pageTplId, template = null }) {
  if (typeof globalTplId !== 'undefined') {
    if (globalTplId && template?.id === globalTplId) recordActiveTemplate00946({ area: 'header', mode: 'global', pageId, template });
    else if (!globalTplId) clearActiveTemplate00946({ area: 'header', mode: 'global', pageId });
  }
  if (typeof pageTplId !== 'undefined') {
    if (pageTplId && template?.id === pageTplId) recordActiveTemplate00946({ area: 'header', mode: 'page', pageId, template });
    else if (!pageTplId) clearActiveTemplate00946({ area: 'header', mode: 'page', pageId });
  }
  return readHeaderAppliedState();
}

function readFooterAppliedState() {
  const pageId = getCurrentPageIdFromDomOrLs();
  const globalTemplate = readActiveTemplate00946('footer', { mode: 'global', pageId });
  const pageTemplate = readActiveTemplate00946('footer', { mode: 'page', pageId });
  return {
    globalTplId: globalTemplate?.templateId || null,
    pages: { [pageId]: pageTemplate?.templateId || null }
  };
}

function writeFooterAppliedState({ pageId, globalTplId, pageTplId, template = null }) {
  if (typeof globalTplId !== 'undefined') {
    if (globalTplId && template?.id === globalTplId) recordActiveTemplate00946({ area: 'footer', mode: 'global', pageId, template });
    else if (!globalTplId) clearActiveTemplate00946({ area: 'footer', mode: 'global', pageId });
  }
  if (typeof pageTplId !== 'undefined') {
    if (pageTplId && template?.id === pageTplId) recordActiveTemplate00946({ area: 'footer', mode: 'page', pageId, template });
    else if (!pageTplId) clearActiveTemplate00946({ area: 'footer', mode: 'page', pageId });
  }
  return readFooterAppliedState();
}

// =========================================================
// ✅ Стилі для “мінімальних карточок” + рамок статусу
// (інжектимо один раз, щоб не шукати CSS-файли)
// =========================================================
let stylesInjected = false;
function ensureGalleryMiniCardStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const css = `
    /* [TEMPLATES][HEADER][MINI-CARD] стилі карточок */
    .sttpl-card--mini{
      display:block;
      width:100%;
      text-align:left;
      padding:12px 12px;
      border-radius:14px;
      border:1px solid rgba(120,160,255,0.18);
      background:rgba(255,255,255,0.03);
      color:var(--sttpl-text);
      cursor:pointer;
      transition:transform .06s ease, border-color .12s ease, box-shadow .12s ease;
      position:relative;
    }
    .sttpl-card--mini:hover{
      transform:translateY(-1px);
      box-shadow:0 8px 18px rgba(0,0,0,0.22);
    }

    /* ✅ СИНЯ рамка: обрано в галереї */
    .sttpl-card--mini.is-selected{
      border-color: rgba(64, 150, 255, 0.75);
      box-shadow: 0 0 0 2px rgba(64,150,255,0.22);
    }

    /* ✅ ЗЕЛЕНА рамка: застосовано як GLOBAL */
    .sttpl-card--mini.is-global-applied{
      border-color: rgba(34, 197, 94, 0.85);
      box-shadow: 0 0 0 2px rgba(34,197,94,0.22);
    }

    /* ✅ ЧЕРВОНА рамка: застосовано як PAGE */
    .sttpl-card--mini.is-page-applied{
      border-color: rgba(239, 68, 68, 0.85);
      box-shadow: 0 0 0 2px rgba(239,68,68,0.22);
    }

    .sttpl-mini__row{
      display:flex;
      align-items:flex-start;
      justify-content:space-between;
      gap:10px;
    }
    .sttpl-mini__name{
      font-weight:800;
      font-size:13px;
      line-height:1.2;
      margin-bottom:6px;
      opacity:.95;
    }
    .sttpl-mini__id{
      font-size:11px;
      opacity:.75;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      word-break:break-all;
    }

    /* (i) кнопка інфо */
    .sttpl-mini__info{
      flex:0 0 auto;
      width:28px; height:28px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.14);
      background:rgba(255,255,255,0.04);
      color:rgba(243,246,255,0.92);
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
    }
    .sttpl-mini__info:hover{
      background:rgba(255,255,255,0.07);
    }

    /* Кружечки-фокус у шапці галереї */
    .sttpl-focusDot{
      width:14px;height:14px;border-radius:999px;
      border:1px solid rgba(255,255,255,0.18);
      background:rgba(148,163,184,0.35); /* сірий */
      cursor:pointer;
      display:inline-block;
      vertical-align:middle;
      margin-left:8px;
    }
    .sttpl-focusDot.is-global{ background: rgba(34,197,94,0.85); }
    .sttpl-focusDot.is-page  { background: rgba(239,68,68,0.85); }
    .sttpl-focusDot:focus{ outline:none; box-shadow:0 0 0 3px rgba(64,150,255,0.22); }

    /* Модалка інфо */
    .sttpl-infoModal{
      position:fixed; inset:0;
      background:rgba(0,0,0,0.78);
backdrop-filter: blur(3px);
      display:none;
      z-index:99999;
      align-items:center;
      justify-content:center;
      padding:18px;
    }
    .sttpl-infoModal__card{
      width:min(560px, 92vw);
      border-radius:16px;
      border:1px solid rgba(255,255,255,0.16);
      background:rgba(10, 16, 26, 0.96);
      box-shadow:0 20px 60px rgba(0,0,0,0.45);
      padding:14px 14px;
      color:rgba(243,246,255,0.95);
    }
    .sttpl-infoModal__top{
      display:flex; align-items:center; justify-content:space-between; gap:10px;
      margin-bottom:10px;
    }
    .sttpl-infoModal__title{ font-weight:900; font-size:14px; }
    .sttpl-infoModal__close{
      border-radius:12px;
      border:1px solid rgba(255,255,255,0.16);
      background:rgba(255,255,255,0.04);
      color:inherit;
      cursor:pointer;
      padding:6px 10px;
    }
    .sttpl-infoModal__body{
      font-size:12px;
      opacity:.92;
      line-height:1.45;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      white-space:pre-wrap;
      word-break:break-word;
      border-radius:12px;
      padding:10px 10px;
      background:rgba(255,255,255,0.03);
      border:1px solid rgba(255,255,255,0.10);
    }
  `;

  const style = document.createElement("style");
  style.setAttribute("data-sttpl-mini", "1");
  style.textContent = css;
  document.head.appendChild(style);
}

// =========================================================
// UI режим галереї належить єдиному workspace authority 00885.
// =========================================================
function esc(s) {
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

const TAB_ORDER = [
  { id: "page",     title: "Сторінка" },
  { id: "header",   title: "Шапка" },
  { id: "main",     title: "Маїн" },
  { id: "shop",     title: "Магазин" },
  { id: "footer",   title: "Футер" },
  { id: "section-styles", title: "Стилі Секцій" },
  { id: "menu",     title: "Меню" },
  { id: "sidebar",  title: "Сайтбар" }
];

const TEMPLATE_GALLERY_MODE_LS_KEY = "st_tpl_gallery_mode_v1";
const TEMPLATE_GALLERY_MODE_TEMPLATES = "templates";
const TEMPLATE_GALLERY_MODE_AI = "ai-templates";

let activeTab = "header";
let activeFolderId = "fld_header";
let activeTemplateGalleryMode = TEMPLATE_GALLERY_MODE_TEMPLATES;
let mainReplaceTargetId00952 = '';
let commerceComponentInsertParentId01041 = '';
let commerceComponentReplaceTargetId01041 = '';
let commerceComponentType01041 = '';
let commerceAllowTypeChange01050 = false;
let sectionStyleSelectionArea00950 = '';
const SECTION_STYLE_AREA_LABELS_00950 = Object.freeze({ header: 'Шапка', main: 'Main', footer: 'Footer' });

// ✅ Обраний шаблон у галереї (синя рамка)

const LS_SITE_FILTER_CATS = 'st_site_tpl_filter_cats_v1';

const SITE_CATEGORIES = [
  { id: 'shop',      title: 'Магазин' },
  { id: 'blog',      title: 'Блог' },
  { id: 'education', title: 'Навчання' },
  { id: 'medicine',  title: 'Медицина' },
  { id: 'games',     title: 'Ігри' },
  { id: 'society',   title: 'Суспільство' },
  { id: 'fishing',   title: 'Рибалка' },
  { id: 'other',     title: 'Інше' }
];

function loadSiteFilterCats_() {
  try {
    const raw = localStorage.getItem(LS_SITE_FILTER_CATS) || '[]';
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch (e) {
    return [];
  }
}

function saveSiteFilterCats_(arr) {
  try { localStorage.setItem(LS_SITE_FILTER_CATS, JSON.stringify(Array.isArray(arr)?arr:[])); } catch(e){}
}

let selectedTemplateId = null;

// ✅ UI: фільтр категорій для вкладки "Сайт"
let __siteFilterOpen = false;


// =========================================================
// [TEMPLATES][MULTI SELECT + IMPORT/EXPORT]
// Активний тип = поточна вкладка: site/page/header/main/footer/sections/menu/sidebar.
// Експорт: якщо є круглі checkbox-вибори — експортує їх; інакше експортує поточний selected; якщо нема — всі видимі у вкладці/папці.
// Імпорт: бере тільки шаблони поточної вкладки, не перетирає існуючі ID, а створює безпечні копії при збігах.
// =========================================================
let selectedTemplateIds = new Set();
let __lastVisibleTemplateIds = [];

function normalizeTemplateGalleryMode_(value) {
  return String(value || '').trim() === TEMPLATE_GALLERY_MODE_AI
    ? TEMPLATE_GALLERY_MODE_AI
    : TEMPLATE_GALLERY_MODE_TEMPLATES;
}

function isAiTemplatesGalleryMode_() {
  return activeTemplateGalleryMode === TEMPLATE_GALLERY_MODE_AI || activeTab === 'ai-templates';
}

function saveTemplateGalleryMode_(mode) {
  activeTemplateGalleryMode = normalizeTemplateGalleryMode_(mode);
  try { localStorage.setItem(TEMPLATE_GALLERY_MODE_LS_KEY, activeTemplateGalleryMode); } catch {}
  return activeTemplateGalleryMode;
}

function readTemplateGalleryMode_() {
  try { return normalizeTemplateGalleryMode_(localStorage.getItem(TEMPLATE_GALLERY_MODE_LS_KEY)); } catch {
    return TEMPLATE_GALLERY_MODE_TEMPLATES;
  }
}

function getAiTemplatesRootFolder_(rootFolders) {
  const children = Array.isArray(rootFolders?.children) ? rootFolders.children : [];
  return children.find(x => x && (x.id === 'fld_ai_templates' || x.type === 'ai-templates')) || null;
}

function getAiTemplateTabs_(rootFolders) {
  const root = getAiTemplatesRootFolder_(rootFolders);
  const children = Array.isArray(root?.children) ? root.children.filter(Boolean) : [];
  if (children.length) return children;
  return [
    { id: 'fld_ai_site', name: 'Сайт-АІ', type: 'ai-templates' },
    { id: 'fld_ai_page', name: 'Сторінка-АІ', type: 'ai-templates' },
    { id: 'fld_ai_header', name: 'Шапка-АІ', type: 'ai-templates' },
    { id: 'fld_ai_footer', name: 'Футер-АІ', type: 'ai-templates' },
    { id: 'fld_ai_sections', name: 'Секції-АІ', type: 'ai-templates' },
    { id: 'fld_ai_shop', name: 'Магазин-АІ', type: 'ai-templates' },
    { id: 'fld_ai_photo_gallery', name: 'Фото-галерея-АІ', type: 'ai-templates' },
    { id: 'fld_ai_menu', name: 'Меню-АІ', type: 'ai-templates' },
    { id: 'fld_ai_sidebar', name: 'Сайтбар-АІ', type: 'ai-templates' }
  ];
}

function getDefaultAiTemplatesFolderId_(rootFolders) {
  const tabs = getAiTemplateTabs_(rootFolders);
  return tabs[0]?.id || 'fld_ai_templates';
}

function findFolderPathInTree_(node, folderId, path = []) {
  if (!node || !folderId) return null;
  const nextPath = [...path, node];
  if (String(node.id || '') === String(folderId || '')) return nextPath;
  const kids = Array.isArray(node.children) ? node.children : [];
  for (const ch of kids) {
    const found = findFolderPathInTree_(ch, folderId, nextPath);
    if (found) return found;
  }
  return null;
}

function getActiveAiTopFolderId_(rootFolders) {
  const aiRoot = getAiTemplatesRootFolder_(rootFolders);
  if (!aiRoot) return getDefaultAiTemplatesFolderId_(rootFolders);
  const path = findFolderPathInTree_(aiRoot, activeFolderId);
  if (path && path.length >= 2) return path[1]?.id || getDefaultAiTemplatesFolderId_(rootFolders);
  return getDefaultAiTemplatesFolderId_(rootFolders);
}

function getActiveAiSidebarRootFolder_(rootFolders) {
  const aiRoot = getAiTemplatesRootFolder_(rootFolders);
  if (!aiRoot) return null;
  const topId = getActiveAiTopFolderId_(rootFolders);
  return findFolderById(topId) || getAiTemplateTabs_(rootFolders).find(x => x.id === topId) || aiRoot;
}

function isFolderInsideAiTemplates_(rootFolders, folderId) {
  const aiRoot = getAiTemplatesRootFolder_(rootFolders);
  return !!(aiRoot && findFolderPathInTree_(aiRoot, folderId));
}

function getRegularTabFromAiFolderId_(folderId) {
  const id = String(folderId || '');
  if (id.includes('_page')) return 'page';
  if (id.includes('_header')) return 'header';
  if (id.includes('_main')) return 'main';
  if (id.includes('_footer')) return 'footer';
  if (id.includes('_sections')) return 'sections';
  if (id.includes('_shop')) return 'shop';
  if (id.includes('_photo_gallery')) return 'photo-gallery';
  if (id.includes('_menu')) return 'menu';
  if (id.includes('_sidebar')) return 'sidebar';
  return 'site';
}

function getAiFolderIdFromRegularTab_(rootFolders, tab) {
  const wanted = String(tab || 'site');
  const map = {
    site: 'site',
    page: 'page',
    header: 'header',
    main: 'main',
    footer: 'footer',
    sections: 'sections',
    shop: 'shop',
    'photo-gallery': 'photo-gallery',
    menu: 'menu',
    sidebar: 'sidebar'
  };
  const key = map[wanted] || 'site';
  const tabs = getAiTemplateTabs_(rootFolders);
  const found = tabs.find(x => String(x?.aiTemplateType || '').toLowerCase() === key)
    || tabs.find(x => String(x?.id || '').toLowerCase().includes(`_${key.replace('-', '_')}`));
  return found?.id || getDefaultAiTemplatesFolderId_(rootFolders);
}

function getRootFolderByType_(rootFolders, type) {
  const children = Array.isArray(rootFolders?.children) ? rootFolders.children : [];
  return children.find(f => f && f.type === type) || null;
}

function switchTemplateGalleryMode_(rootFolders, mode) {
  const nextMode = saveTemplateGalleryMode_(mode);

  selectedTemplateId = null;
  try { selectedTemplateIds.clear(); } catch {}

  if (nextMode === TEMPLATE_GALLERY_MODE_AI) {
    const prevRegularTab = activeTab && activeTab !== 'ai-templates' ? activeTab : getRegularTabFromAiFolderId_(activeFolderId);
    activeTab = 'ai-templates';
    activeFolderId = getAiFolderIdFromRegularTab_(rootFolders, prevRegularTab);
    return;
  }

  const nextRegularTab = activeTab === 'ai-templates' ? getRegularTabFromAiFolderId_(activeFolderId) : (activeTab || 'site');
  activeTab = TAB_ORDER.some(x => x.id === nextRegularTab) ? nextRegularTab : 'site';
  const rootFolder = getRootFolderByType_(rootFolders, activeTab);
  activeFolderId = rootFolder?.id || null;
}

function getActiveTabTitle_() {
  if (activeTab === 'ai-templates') return 'АІ шаблони';
  const found = TAB_ORDER.find(x => x.id === activeTab);
  return found ? found.title : (activeTab || 'Шаблони');
}

function sanitizeExportName_(value) {
  return String(value || 'templates')
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїє_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'templates';
}

function downloadJson_(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { try { URL.revokeObjectURL(a.href); } catch {} try { a.remove(); } catch {} }, 0);
}

function getVisibleIdsSet_() {
  return new Set((__lastVisibleTemplateIds || []).filter(Boolean));
}

function getExportTemplateIdsForActiveTab_() {
  const st = loadTemplatesStore();
  const visible = getVisibleIdsSet_();
  const checked = Array.from(selectedTemplateIds || []).filter((id) => {
    const t = (st.items || []).find(x => x && x.id === id);
    return !!(t && t.type === activeTab && (!visible.size || visible.has(id)));
  });

  // ВАЖЛИВО: експорт працює ТІЛЬКИ по круглих checkbox-виборах.
  // Звичайний одинарний клік по картці робить її активною для "Застосувати/Перегляд/Видалити",
  // але НЕ додає її в список експорту.
  return checked;
}

function ensureUniqueTemplateId_(items, baseId, type) {
  const used = new Set((items || []).map(x => x && x.id).filter(Boolean));
  let safe = String(baseId || '').trim();
  if (!safe) safe = `${type || 'tpl'}_import_${Date.now()}`;
  safe = safe.replace(/[^a-z0-9_:-]+/gi, '_').slice(0, 80) || `${type || 'tpl'}_import_${Date.now()}`;
  if (!used.has(safe)) return safe;
  let n = 1;
  let id = '';
  do {
    id = `${safe}_imp_${Date.now()}_${n++}`;
  } while (used.has(id));
  return id;
}

function folderExistsForType_(store, folderId, type) {
  if (!folderId) return false;
  try {
    const walk = (node) => {
      if (!node) return false;
      if (node.id === folderId && (!type || node.type === type || node.type == null)) return true;
      const kids = Array.isArray(node.children) ? node.children : [];
      return kids.some(walk);
    };
    return walk(store?.folders);
  } catch { return false; }
}

function getDefaultFolderForActiveTab_() {
  try {
    if (activeFolderId) return activeFolderId;
    const root = getFoldersRoot();
    const rootFolder = (root.children || []).find(f => f.type === activeTab) || null;
    return rootFolder ? rootFolder.id : null;
  } catch { return null; }
}

function extractImportItems_(parsed) {
  if (!parsed || typeof parsed !== 'object') return [];
  if (Array.isArray(parsed.items)) return parsed.items;
  if (Array.isArray(parsed.templates)) return parsed.templates;
  if (parsed.store && Array.isArray(parsed.store.items)) return parsed.store.items;
  return [];
}

function exportTemplatesForActiveTab_() {
  const st = loadTemplatesStore();
  const ids = getExportTemplateIdsForActiveTab_();
  const set = new Set(ids);
  const items = (st.items || []).filter(t => t && t.type === activeTab && set.has(t.id));

  if (!items.length) {
    showTemplateDeleteNotice_(
      'У ВАС НЕ ВИБРАНО ЖОДНОГО ШАБЛОНА ДЛЯ ЕКСПОРТУ',
      `Постав круглу галочку біля одного або кількох шаблонів у вкладці “${getActiveTabTitle_()}”, а потім натисни “Експорт”.

Звичайний одинарний клік тільки робить шаблон активним для перегляду/вставки/видалення, але не додає його до експорту.`
    );
    return;
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const payload = {
    exportVersion: 2,
    app: 'ShiftTime Builder',
    scope: activeTab,
    scopeTitle: getActiveTabTitle_(),
    exportedAt: new Date().toISOString(),
    count: items.length,
    items,
  };
  const fname = `shifttime-${sanitizeExportName_(activeTab)}-templates-${stamp}.json`;
  downloadJson_(fname, payload);
}

function importTemplatesForActiveTabFromText_(text) {
  const parsed = JSON.parse(String(text || ''));
  const incoming = extractImportItems_(parsed)
    .filter(t => t && String(t.type || '') === String(activeTab));

  if (!incoming.length) {
    alert(`У файлі немає шаблонів для вкладки “${getActiveTabTitle_()}”.`);
    return { ok: false, count: 0 };
  }

  const st = loadTemplatesStore();
  const items = Array.isArray(st.items) ? st.items : [];
  const fallbackFolderId = getDefaultFolderForActiveTab_();
  const importedIds = [];

  for (const raw of incoming) {
    const clone = JSON.parse(JSON.stringify(raw));
    const oldId = clone.id;
    clone.id = ensureUniqueTemplateId_(items, clone.id, activeTab);
    clone.type = activeTab;
    clone.name = String(clone.name || 'Імпортований шаблон');
    if (clone.id !== oldId && !/\(import\)/i.test(clone.name)) clone.name += ' (import)';

    if (!folderExistsForType_(st, clone.folderId, activeTab)) {
      clone.folderId = fallbackFolderId;
    }

    clone.meta = {
      ...(clone.meta || {}),
      source: 'user',
      importedAt: new Date().toISOString(),
      importedFromId: oldId || null,
      updatedAt: new Date().toISOString(),
    };

    items.unshift(clone);
    importedIds.push(clone.id);
  }

  st.items = items;
  saveTemplatesStore(st);
  selectedTemplateIds = new Set(importedIds);
  selectedTemplateId = importedIds[0] || null;
  return { ok: true, count: importedIds.length };
}

function pickAndImportTemplatesForActiveTab_() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    try { input.remove(); } catch {}
    if (!file) return;
    try {
      const txt = await file.text();
      const res = importTemplatesForActiveTabFromText_(txt);
      const view = document.getElementById('templatesGalleryManagerView');
      if (view) render(view);
      if (res && res.ok) alert(`Імпортовано: ${res.count} шаблон(ів) у “${getActiveTabTitle_()}”.`);
    } catch (err) {
      console.warn('[TPL] scoped import failed', err);
      alert('Помилка імпорту. Перевір JSON-файл.');
    }
  }, { once: true });
  document.body.appendChild(input);
  input.click();
}


// =========================================================
// [PAGE PREVIEW SIZE] 1440×900 / 1280×800 (як Wix)
// =========================================================
const LS_PAGE_PREVIEW_SIZE = 'st_page_preview_size_v1'; // '1440x900' | '1280x800'

function getPagePreviewSizeKey_() {
  try {
    const v = String(localStorage.getItem(LS_PAGE_PREVIEW_SIZE) || '').trim();
    return (v === '1440x900') ? '1440x900' : '1280x800';
  } catch {
    return '1280x800';
  }
}

function setPagePreviewSizeKey_(v) {
  try {
    localStorage.setItem(LS_PAGE_PREVIEW_SIZE, (v === '1440x900') ? '1440x900' : '1280x800');
  } catch {}
}

function getPagePreviewSize_() {
  const key = getPagePreviewSizeKey_();
  return (key === '1440x900') ? { key, w: 1440, h: 900 } : { key, w: 1280, h: 800 };
}

// =========================================================
// [PAGE THUMB RENDER] live preview (iframe + scale) — tiles like Wix
// =========================================================
function buildPageThumbSrcdoc_(innerHtml) {
  const safeHtml = String(innerHtml || '');
  let baseHref = '';
  try { baseHref = new URL('.', document.baseURI).href; } catch { baseHref = String(document.baseURI || ''); }
  const safeBaseHref = String(baseHref || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8"/>
<base href="${safeBaseHref}"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="css/builder-themes.css"/>
<link rel="stylesheet" href="css/site-canvas.css"/>
<link rel="stylesheet" href="css/school-01-main-00959.css"/>
<link rel="stylesheet" href="css/school-01-footer-00962.css"/>
<link rel="stylesheet" href="css/shifttime-marketplace-01-00981.css"/>
<link rel="stylesheet" href="css/shifttime-marketplace-02-01026.css"/>
<link rel="stylesheet" href="css/paired-header-premium-00980.css"/>
<link rel="stylesheet" href="css/paired-footer-universal-00973.css"/>
<style>
  html,body{margin:0;padding:0;background:#0b0f18;overflow:hidden;}
  .site-root{min-height:100%;box-sizing:border-box;}
</style>
</head>
<body>
  <div id="site-root" class="site-root">${safeHtml}</div>
</body>
</html>`;
}

function normalizePageThumbViewport01036_(viewport, w, h) {
  if (!viewport) return;
  // 01036: kill the legacy virtual-viewport transform before measuring.
  // The card itself owns the visible geometry; only the iframe may be scaled.
  viewport.style.setProperty('width', '100%', 'important');
  viewport.style.setProperty('height', 'auto', 'important');
  viewport.style.setProperty('min-height', '0', 'important');
  viewport.style.setProperty('aspect-ratio', `${Math.max(1, w)} / ${Math.max(1, h)}`, 'important');
  viewport.style.setProperty('transform', 'none', 'important');
  viewport.style.setProperty('transform-origin', 'top left', 'important');
}

function applyThumbScale_(iframe, viewport, w, h) {
  try {
    normalizePageThumbViewport01036_(viewport, w, h);
    const vw = Math.max(1, viewport.clientWidth);
    const expectedH = Math.max(1, Math.round(vw * (h / w)));
    const vh = Math.max(1, viewport.clientHeight || expectedH);

    // 01036 PAGE PREVIEW FIT: cover the complete thumbnail surface.
    // Ratios are normally identical (1440x900 / 1280x800 = 16:10), but max()
    // also prevents letterboxing if the card is resized by the gallery layout.
    const scale = Math.max(vw / w, vh / h);
    const renderedW = w * scale;
    const renderedH = h * scale;
    const offsetX = (vw - renderedW) / 2;
    const offsetY = (vh - renderedH) / 2;

    iframe.style.setProperty('position', 'absolute');
    iframe.style.setProperty('left', '0');
    iframe.style.setProperty('top', '0');
    iframe.style.setProperty('transform-origin', 'top left');
    iframe.style.setProperty('transform', `translate(${offsetX}px, ${offsetY}px) scale(${scale})`);
    iframe.dataset.stPageThumbFit01036 = 'cover';
  } catch {}
}

let __pageThumbObserver01035_ = null;
let __pageThumbGeneration01035_ = 0;

function mountSinglePageThumb01035_(node, generation, w, h) {
  const startedAt01035 = globalThis.performance?.now?.() ?? Date.now();
  if (!node || !node.isConnected) return;
  if (Number(node.dataset.pageThumbGeneration01035 || 0) !== generation) return;
  if (node.dataset.pageThumbMounted01035 === '1') return;

  const tplId = node.getAttribute('data-tpl-id') || '';
  const vp = node.querySelector('.sttpl-pageThumb__viewport');
  const doc = node.querySelector('.sttpl-pageThumb__doc');
  if (!tplId || !vp || !doc) return;

  node.dataset.pageThumbMounted01035 = '1';
  node.dataset.pageThumbQueued01035 = '0';

  // Use the runtime fallback so system Page recipes never depend on LS seeding.
  const tpl = getTemplateByIdRuntimeFallback_(tplId) || getTemplateById(tplId);
  const html = getPagePreviewHtmlFromTemplate_(tpl);
  if (!html.trim()) {
    doc.innerHTML = `<div class="sttpl-pageThumb__empty">Немає превʼю</div>`;
    return;
  }

  doc.innerHTML = '';
  const iframe = document.createElement('iframe');
  iframe.setAttribute('data-st-page-thumb', '1');
  iframe.setAttribute('tabindex', '-1');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('loading', 'lazy');
  iframe.style.border = '0';
  iframe.style.width = w + 'px';
  iframe.style.height = h + 'px';
  iframe.style.display = 'block';
  iframe.style.pointerEvents = 'none';
  iframe.srcdoc = buildPageThumbSrcdoc_(html);
  doc.appendChild(iframe);
  applyThumbScale_(iframe, vp, w, h);
  iframe.addEventListener('load', () => applyThumbScale_(iframe, vp, w, h), { once: true });
  try {
    window.__ST_ALL_LOG__?.push?.('page-gallery-lazy-preview-mounted-01037', {
      templateId: tplId,
      htmlLength: html.length,
      buildMs: Math.round(((globalThis.performance?.now?.() ?? Date.now()) - startedAt01035) * 10) / 10,
      lazyVisibleOnly: true,
      fitMode01036: 'cover',
      authoredBoundary01037: true,
      authoredBoundaryCount01037: (html.match(/data-sf-authored-template=\"00961\"/g) || []).length,
      viewportWidth: Math.round(vp.clientWidth || 0),
      viewportHeight: Math.round(vp.clientHeight || 0)
    });
  } catch {}
}

function schedulePageThumbMount01035_(node, generation, w, h) {
  if (!node || node.dataset.pageThumbMounted01035 === '1' || node.dataset.pageThumbQueued01035 === '1') return;
  node.dataset.pageThumbQueued01035 = '1';
  const run = () => {
    if (!node?.isConnected || Number(node.dataset.pageThumbGeneration01035 || 0) !== generation) return;
    try { mountSinglePageThumb01035_(node, generation, w, h); }
    catch (error) {
      node.dataset.pageThumbMounted01035 = '0';
      node.dataset.pageThumbQueued01035 = '0';
      console.warn('[templates-gallery][01035] page thumb mount failed', { tplId: node.getAttribute('data-tpl-id') || '', error });
    }
  };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 240 });
  else setTimeout(run, 0);
}

function mountPageThumbs_(rootEl) {
  if (!rootEl) return;
  const { w, h } = getPagePreviewSize_();
  const generation = ++__pageThumbGeneration01035_;

  try { __pageThumbObserver01035_?.disconnect?.(); } catch {}
  __pageThumbObserver01035_ = null;

  const nodes = Array.from(rootEl.querySelectorAll('.sttpl-pageThumb'));
  for (const node of nodes) {
    node.dataset.pageThumbGeneration01035 = String(generation);
    node.dataset.pageThumbMounted01035 = '0';
    node.dataset.pageThumbQueued01035 = '0';
  }
  if (!nodes.length) return;
  try {
    window.__ST_ALL_LOG__?.push?.('page-gallery-lazy-preview-plan-01037', {
      totalCards: nodes.length,
      strategy: typeof IntersectionObserver === 'function' ? 'intersection-idle' : 'first-two-idle',
      previewSize: `${w}x${h}`
    });
  } catch {}

  // Only near-visible cards get a real Header+Main+Footer iframe. The previous
  // implementation synchronously assembled every recipe (and inserted the huge
  // HTML into the Gallery) before the user could interact with the folder tree.
  if (typeof IntersectionObserver === 'function') {
    const scrollRoot = rootEl.querySelector('.sttpl-mgr__rightPane') || null;
    __pageThumbObserver01035_ = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        schedulePageThumbMount01035_(entry.target, generation, w, h);
      }
    }, { root: scrollRoot, rootMargin: '360px 0px', threshold: 0.01 });
    for (const node of nodes) __pageThumbObserver01035_.observe(node);
    return;
  }

  // Conservative fallback for browsers without IntersectionObserver.
  nodes.slice(0, 2).forEach(node => schedulePageThumbMount01035_(node, generation, w, h));
}

// =========================================================
// [00361][UNIVERSAL TEMPLATE THUMBNAILS]
// Єдине превʼю для всіх вкладок шаблонів:
// header/footer/sections/main/menu/sidebar/shop/photo-gallery.
// Ідея: рендеримо реальний HTML у "віртуальному полотні" 1200px,
// міряємо фактичну висоту і зменшуємо так, щоб у карточці було видно весь шаблон,
// а не тільки верхню частину. Це прибирає накладання кнопок/блоків у превʼю,
// бо шаблон спершу розкладається в нормальній ширині, а вже потім масштабується.
// =========================================================
function getUniversalThumbVirtualWidth_(kind) {
  const k = String(kind || '').toLowerCase();
  if (k === 'section-styles') return 1200;
  if (k === 'shop') return 980;
  if (k === 'footer') return 1320; // [00968] preview footers at authored desktop canvas width
  if (k === 'menu' || k === 'header') return 1200;
  // [00383] Sidebar menu preview uses a narrower virtual canvas so the vertical menu
  // appears larger and does not sit as a small strip with empty sides.
  if (k === 'sidebar') return 360;
  return 1200;
}

function getUniversalThumbMaxScale_(kind) {
  const k = String(kind || '').toLowerCase();
  if (k === 'section-styles') return 1;
  // [00444][HEADER TEMPLATE PREVIEW]
  // Header previews must fill the gallery card width. The old 0.72 cap made
  // full-row header cards look like tiny strips on wide screens.
  if (k === 'header') return 1.65;
  // [00445] Footer preview cards use the same width-first logic as headers.
  // The old default cap (0.46) made footers look like small strips in a large card.
  if (k === 'footer') return 1.35;
  if (k === 'sections') return 0.72; // [00393] section templates are now full-row previews, so they may be shown larger.
  if (k === 'main') return 0.68;
  if (k === 'photo-gallery') return 0.68;
  if (k === 'menu') return 1.08; // [00383] wide menu previews can scale up on large monitors
  if (k === 'shop') return 0.58;
  if (k === 'sidebar') return 1.04; // [00383] sidebar-menu previews should look wider/larger
  return 0.46;
}

function measureUniversalThumbContent_(canvas, doc, virtualW) {
  if (!canvas || !doc) return { w: virtualW || 1200, h: 1 };
  // На час заміру вимикаємо scale, інакше getBoundingClientRect дає вже зменшений розмір.
  const prevTransform = canvas.style.transform;
  const prevWidth = canvas.style.width;
  canvas.style.transform = 'none';
  canvas.style.width = `${virtualW || 1200}px`;
  let h = 1;
  let w = virtualW || 1200;
  try {
    const rect = doc.getBoundingClientRect ? doc.getBoundingClientRect() : null;
    h = Math.max(
      1,
      doc.scrollHeight || 0,
      canvas.scrollHeight || 0,
      rect ? rect.height : 0
    );
    w = Math.max(
      virtualW || 1200,
      doc.scrollWidth || 0,
      canvas.scrollWidth || 0,
      rect ? rect.width : 0
    );
  } catch {}
  canvas.style.width = prevWidth || `${virtualW || 1200}px`;
  canvas.style.transform = prevTransform || '';
  return { w, h };
}

function fitUniversalThumb_(thumb) {
  if (!thumb) return;
  const canvas = thumb.querySelector('.sttpl-templateThumb__canvas');
  const doc = thumb.querySelector('.sttpl-templateThumb__doc');
  if (!canvas || !doc) return;

  const kind = thumb.dataset ? (thumb.dataset.kind || '') : '';
  const virtualW = getUniversalThumbVirtualWidth_(kind);
  canvas.style.width = `${virtualW}px`;
  doc.style.width = '100%';

  const vw = Math.max(1, thumb.clientWidth || 1);
  const vh = Math.max(1, thumb.clientHeight || 1);
  const measured = measureUniversalThumbContent_(canvas, doc, virtualW);
  const maxScale = getUniversalThumbMaxScale_(kind);
  const k = String(kind || '').toLowerCase();

  let scale;
  let x;
  let y;

  if (k === 'header' || k === 'footer') {
    // [00445][HEADER/FOOTER TEMPLATE PREVIEW AUTO HEIGHT]
    // Header/Footer cards are not page previews. The card must fit the real
    // template height with standard inner spacing, not keep a large fixed empty
    // area under short headers/footers. Scale by width, then resize the thumb
    // height to the scaled content height and center the content both ways.
    const padY = k === 'header' ? 12 : 14;
    const minH = k === 'header' ? 96 : 150;
    scale = Math.max(0.12, Math.min(vw / Math.max(1, measured.w), maxScale));
    const usedW = measured.w * scale;
    const usedH = Math.max(1, measured.h * scale);
    const autoH = Math.max(minH, Math.ceil(usedH + padY * 2));
    thumb.style.height = `${autoH}px`;
    x = Math.max(0, (vw - usedW) / 2);
    y = Math.max(padY, (autoH - usedH) / 2);
  } else {
    scale = Math.max(0.035, Math.min(vw / measured.w, vh / measured.h, maxScale));
    const usedW = measured.w * scale;
    const usedH = measured.h * scale;
    x = Math.max(0, (vw - usedW) / 2);
    y = Math.max(0, (vh - usedH) / 2);
  }

  thumb.style.setProperty('--sttpl-thumb-scale', String(scale));
  thumb.style.setProperty('--sttpl-thumb-x', `${Math.round(x)}px`);
  thumb.style.setProperty('--sttpl-thumb-y', `${Math.round(y)}px`);
  thumb.style.setProperty('--sttpl-thumb-virtual-w', `${virtualW}px`);
  canvas.style.transformOrigin = 'top left';
  canvas.style.transform = `translate(var(--sttpl-thumb-x,0px), var(--sttpl-thumb-y,0px)) scale(var(--sttpl-thumb-scale, .1))`;
}

function mountUniversalTemplateThumbs_(rootEl) {
  if (!rootEl) return;
  const thumbs = Array.from(rootEl.querySelectorAll('.sttpl-templateThumb[data-template-thumb="1"]'));
  if (!thumbs.length) return;
  const fitAll = () => thumbs.forEach((th) => { try { fitUniversalThumb_(th); } catch (e) { console.warn('[templates-gallery] thumb fit failed:', e); } });
  requestAnimationFrame(() => {
    fitAll();
    // Деякі стилі/шрифти застосовуються після першого кадру, тому робимо один тихий повторний замір.
    setTimeout(fitAll, 80);
  });

  if (!window.__stTplUniversalThumbResizeBound) {
    window.__stTplUniversalThumbResizeBound = true;
    window.addEventListener('resize', () => {
      const view = document.getElementById('templatesGalleryManagerView');
      if (view && view.style.display !== 'none') mountUniversalTemplateThumbs_(view);
    }, { passive: true });
  }
}

// ✅ helper: знайти шаблон по id в store (items)
function getTemplateById(id) {
  if (!id) return null;
  try {
    return getTemplateByIdRuntimeFallback_(id);
  } catch (e) {
    console.warn("[templates-gallery][00379] getTemplateById failed:", e);
    return null;
  }
}


function isPageTemplate_(tpl) {
  return !!(tpl && (tpl.type === 'page' || tpl.kind === 'page' || activeTab === 'page'));
}

function getPageRecipe01028_(tpl) {
  if (!tpl) return null;
  if (tpl.pageRecipe && tpl.pageRecipe.version === 'st-page-recipe-v1-01028') return tpl.pageRecipe;
  try {
    const raw = JSON.parse(String(tpl.html || ''));
    const recipe = raw?.pageRecipe || raw?.recipe || null;
    if (raw?.__st_page_recipe_v1 === true && recipe?.version === 'st-page-recipe-v1-01028') return recipe;
  } catch {}
  return null;
}

function getAreaTemplateForPageRecipe01028_(area, templateId) {
  const id = String(templateId || '');
  if (!id) return null;
  let user = null;
  try { user = (loadTemplatesStore()?.items || []).find(x => x && x.id === id && x.type === area) || null; } catch {}
  if (user && !templateLooksSystem_(user)) return user;
  let system = null;
  try {
    if (area === 'header') system = (getHeaderTemplatesDemo() || []).find(x => x?.id === id) || null;
    if (area === 'main') system = (getMainTemplatesDemo() || []).find(x => x?.id === id) || null;
    if (area === 'footer') system = (getFooterTemplatesDemo() || []).find(x => x?.id === id) || null;
  } catch {}
  return system || user;
}

function normalizePageAreaPreview01029_(html, area) {
  const raw = String(html || '').trim();
  if (!raw) return '';
  try {
    const t = document.createElement('template');
    t.innerHTML = raw;

    // Page Preview is static. Runtime sliders are intentionally not started inside
    // Gallery thumbnails/Preview: show exactly the authored first slide instead of
    // stacking all conditional slide copies on top of each other.
    const bound = Array.from(t.content.querySelectorAll('[data-st-fx-bind-slide]'));
    bound.forEach((el, index) => {
      const no = Number(el.getAttribute('data-st-fx-bind-slide') || (index + 1));
      if (no !== 1) el.style.setProperty('display', 'none', 'important');
    });

    // If an authored background slider does not already expose a background-image,
    // materialize its first image for a deterministic static preview only.
    t.content.querySelectorAll('[data-st-fx-bg-slider]').forEach((el) => {
      const current = String(el.style.backgroundImage || el.style.background || '').trim();
      if (current && current !== 'none') return;
      try {
        const rawSlides = el.getAttribute('data-st-fx-bg-slider') || '';
        const parsed = JSON.parse(rawSlides);
        const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.slides) ? parsed.slides : []);
        const first = list[0];
        const url = String(first?.url || first?.src || first?.image || first || '').trim();
        if (url) {
          el.style.backgroundImage = `url("${url.replace(/"/g, '\\"')}")`;
          el.style.backgroundSize = el.style.backgroundSize || 'cover';
          el.style.backgroundPosition = el.style.backgroundPosition || 'center center';
          el.style.backgroundRepeat = el.style.backgroundRepeat || 'no-repeat';
        }
      } catch {}
    });

    // 01037: Main preview must participate in the same authored-style ownership
    // boundary as the canonical SiteFrame importer/renderer. Without this marker
    // site-canvas.css treats raw preview markup as legacy canvas DOM and injects
    // builder defaults (3-column rows, 140px block minimums, generic surfaces).
    // The real Apply path marks every imported Main node with
    // data-sf-authored-template="00961", so the preview must mirror that contract.
    if (String(area || '').toLowerCase() === 'main') {
      const authoredNodes01037 = Array.from(t.content.querySelectorAll('.st-section,.st-row,.st-block'));
      authoredNodes01037.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        el.setAttribute('data-sf-authored-template', '00961');
        el.setAttribute('data-sf-area', 'main');
        if (el.classList.contains('st-section')) {
          el.setAttribute('data-sf-kind', 'section');
          el.setAttribute('data-sec-role', 'main');
        } else if (el.classList.contains('st-row')) {
          el.setAttribute('data-sf-kind', 'level');
        } else {
          el.setAttribute('data-sf-kind', el.matches('[data-block-kind],.hb-elem') ? 'block' : 'container');
        }
      });
    }

    // Preview must never carry editor UI/state from a saved user template.
    t.content.querySelectorAll('.st-resize,[data-st-resize-handle]').forEach((el) => el.remove());
    t.content.querySelectorAll('.is-active,.is-selected,.hb-dom-active,.hb-dom-selected,.sf-selection-current,.sf-edit-selected,.sf-selection-front-path').forEach((el) => {
      el.classList.remove('is-active','is-selected','hb-dom-active','hb-dom-selected','sf-selection-current','sf-edit-selected','sf-selection-front-path');
    });
    t.content.querySelectorAll('[contenteditable]').forEach((el) => el.setAttribute('contenteditable', 'false'));

    const wrapper = document.createElement('div');
    wrapper.className = `st-page-preview-area-01029 st-page-preview-area-01029--${String(area || '').replace(/[^a-z0-9_-]/gi,'')}`;
    wrapper.appendChild(t.content.cloneNode(true));
    return wrapper.outerHTML;
  } catch {
    return raw;
  }
}

function renderPageRecipePreview01028_(recipe) {
  if (!recipe || recipe.version !== 'st-page-recipe-v1-01028') return '';
  const h = getAreaTemplateForPageRecipe01028_('header', recipe.header?.templateId);
  const m = getAreaTemplateForPageRecipe01028_('main', recipe.main?.templateId);
  const f = getAreaTemplateForPageRecipe01028_('footer', recipe.footer?.templateId);
  const missing = [];
  if (!h) missing.push(`Шапка: ${String(recipe.header?.templateId || '—')}`);
  if (!m) missing.push(`Маїн: ${String(recipe.main?.templateId || '—')}`);
  if (!f) missing.push(`Футер: ${String(recipe.footer?.templateId || '—')}`);
  if (missing.length) {
    return `<div class="st-page-recipe-preview-01029 st-page-recipe-preview-01029--missing" style="min-height:560px;box-sizing:border-box;padding:48px;background:linear-gradient(145deg,#101827,#08101d);color:#fff;font:700 20px/1.5 Inter,system-ui,sans-serif;"><div style="font-size:13px;letter-spacing:.14em;color:#60a5fa;margin-bottom:12px;">PAGE RECIPE · 01029</div><div style="font-size:30px;font-weight:950;margin-bottom:18px;">Превʼю не може зібрати всі частини</div><div style="opacity:.85;font-size:16px;font-weight:650;">${missing.map(x=>esc(x)).join('<br>')}</div></div>`;
  }
  const hh = normalizePageAreaPreview01029_(h.previewHtml || h.html || '', 'header');
  const mm = normalizePageAreaPreview01029_(m.previewHtml || m.html || '', 'main');
  const ff = normalizePageAreaPreview01029_(f.previewHtml || f.html || '', 'footer');
  return `<div class="st-page-recipe-preview-01029" data-page-recipe-preview="01029" style="display:block;width:100%;min-height:100%;box-sizing:border-box;background:#fff;overflow:visible;">${hh}${mm}${ff}</div>`;
}

function getPagePreviewHtmlFromTemplate_(tpl) {
  if (!tpl) return '';

  // 01028: reference-only Page Recipe. Preview is assembled live from the current
  // Header/Main/Footer template sources; their HTML is never copied into the page record.
  const recipe01028 = getPageRecipe01028_(tpl);
  if (recipe01028) {
    const assembled01028 = renderPageRecipePreview01028_(recipe01028);
    if (assembled01028) return assembled01028;
  }

  // 1) Новий правильний канал: previewHtml/pageHTML у store або bundle.
  const directPreview = String(tpl.previewHtml || '').trim();
  if (directPreview) return String(tpl.previewHtml || '');

  const raw = String(tpl.html || '');
  if (!raw.trim()) return '';

  // 2) Якщо html — це JSON bundle, витягуємо реальний DOM HTML, а не показуємо JSON.
  try {
    const snap = JSON.parse(raw);
    if (snap && typeof snap === 'object') {
      const html = String(snap.pageHTML || snap.rootHTML || snap.previewHtml || '').trim();
      if (html) return String(snap.pageHTML || snap.rootHTML || snap.previewHtml || '');
    }
  } catch {}

  // 3) Старі шаблони могли зберігати HTML напряму.
  if (/^\s*</.test(raw)) return raw;

  return '';
}

function stTplMaterializeAiPreviewHtml_(html) {
  const raw = String(html || '').trim();
  if (!raw || !(raw.includes('st-ai-generated-section') || raw.includes('data-ai-generated-section') || raw.includes('st-bgfx') || raw.includes('data-st-fill-gallery'))) return raw;

  const collectVars = (styleText, base = {}) => {
    const vars = { ...(base || {}) };
    String(styleText || '').replace(/(--[a-z0-9_-]+)\s*:\s*([^;]+);?/gi, (_, key, val) => {
      vars[String(key || '').trim()] = String(val || '').trim();
      return _;
    });
    return vars;
  };

  // [00431] Robust CSS var resolver for preview.
  // Previous regex resolver broke when fallback contained functions such as
  // var(--st-theme-section-bg, linear-gradient(...)) or nested vars like
  // var(--st-theme-section-bg, var(--st-site-section-bg, #fff)).
  // Canvas could resolve those through the real site root, but gallery preview
  // is isolated, so we materialize a concrete value before rendering.
  const splitTopLevelComma = (value) => {
    const text = String(value || '');
    let depth = 0;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text[i];
      if (ch === '(') depth += 1;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        return [text.slice(0, i), text.slice(i + 1)];
      }
    }
    return [text, ''];
  };

  const resolveVars = (value, vars = {}, depth = 0) => {
    let text = String(value || '');
    if (!text || depth > 8 || !/var\(/i.test(text)) return text;

    let out = '';
    let i = 0;
    while (i < text.length) {
      const idx = text.toLowerCase().indexOf('var(', i);
      if (idx < 0) {
        out += text.slice(i);
        break;
      }
      out += text.slice(i, idx);
      let j = idx + 4;
      let parenDepth = 1;
      while (j < text.length && parenDepth > 0) {
        const ch = text[j];
        if (ch === '(') parenDepth += 1;
        else if (ch === ')') parenDepth -= 1;
        j += 1;
      }
      if (parenDepth !== 0) {
        out += text.slice(idx);
        break;
      }

      const inside = text.slice(idx + 4, j - 1);
      const [nameRaw, fallbackRaw] = splitTopLevelComma(inside);
      const key = String(nameRaw || '').trim();
      const mapped = String(vars[key] || '').trim();
      const fallback = String(fallbackRaw || '').trim();
      if (mapped) out += resolveVars(mapped, vars, depth + 1);
      else if (fallback) out += resolveVars(fallback, vars, depth + 1);
      else out += text.slice(idx, j);
      i = j;
    }

    return /var\(/i.test(out) && out !== text ? resolveVars(out, vars, depth + 1) : out;
  };

  const cssUrl = (url) => {
    const rawUrl = String(url || '').trim();
    if (!rawUrl) return '';
    if (/^url\(/i.test(rawUrl) || /gradient\(/i.test(rawUrl)) return rawUrl;
    return `url("${rawUrl.replace(/"/g, '\"')}")`;
  };

  const dataUrl = (el) => String(
    el?.dataset?.stFillGalleryUrl
    || el?.dataset?.stFillGalleryPath
    || el?.dataset?.aiImagePath
    || el?.getAttribute?.('data-st-fill-gallery-url')
    || el?.getAttribute?.('data-st-fill-gallery-path')
    || el?.getAttribute?.('data-ai-image-path')
    || ''
  ).trim();

  const materializeBgfx = (el, vars = {}) => {
    if (!(el instanceof HTMLElement)) return;
    const style = el.style;
    let fx = String(style.getPropertyValue('--st-bgfx-bg') || '').trim();
    fx = resolveVars(fx, vars).trim();
    const fallbackUrl = dataUrl(el);
    if ((!fx || fx === 'none') && fallbackUrl) fx = cssUrl(fallbackUrl);
    if (!fx || fx === 'none') return;

    el.classList.add('st-bgfx');
    style.setProperty('--st-bgfx-bg', fx);
    if (!String(style.getPropertyValue('--st-bgfx-bg-opacity') || '').trim()) style.setProperty('--st-bgfx-bg-opacity', '1');
    if (!String(style.getPropertyValue('--st-bgfx-bg-size') || '').trim()) style.setProperty('--st-bgfx-bg-size', 'cover');
    if (!String(style.getPropertyValue('--st-bgfx-bg-pos') || '').trim()) style.setProperty('--st-bgfx-bg-pos', 'center center');

    // [00430] Preview/apply parity: every AI image block must have the same
    // physical visual layer as the canvas.  Inline background alone was not
    // enough in some real canvas states, while preview could still show it.
    style.backgroundImage = fx;
    style.backgroundSize = String(style.getPropertyValue('--st-bgfx-bg-size') || 'cover');
    style.backgroundPosition = String(style.getPropertyValue('--st-bgfx-bg-pos') || 'center center');
    style.backgroundRepeat = 'no-repeat';

    if (fallbackUrl && (el.matches?.('[data-ai-generated-visual="1"],.st-block--image,[data-block-kind="image"]') || el.dataset?.aiImagePath)) {
      let img = el.querySelector?.(':scope > img[data-ai-visual-img="1"]');
      if (!img) {
        img = document.createElement('img');
        img.setAttribute('data-ai-visual-img', '1');
        img.setAttribute('draggable', 'false');
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
        el.insertBefore(img, el.firstChild || null);
      }
      img.setAttribute('src', fallbackUrl);
      img.setAttribute('alt', el.dataset?.aiImageTitle || el.getAttribute?.('data-ai-image-title') || 'AI зображення');
      el.style.position = el.style.position || 'relative';
      el.style.overflow = el.style.overflow || 'hidden';
      el.querySelectorAll?.(':scope > .st-text-edit,:scope > [contenteditable="true"]').forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        child.style.zIndex = child.style.zIndex || '2';
        child.style.position = child.style.position || 'relative';
      });
    }
  };

  try {
    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    const sections = Array.from(tmp.querySelectorAll('.st-section,.st-ai-generated-section,[data-ai-generated-section="1"],[data-ai-theme-source]'))
      .filter((el) => el instanceof HTMLElement);
    sections.forEach((section) => {
      const sectionVars = collectVars(section.getAttribute('style') || '');

      // [00431] Materialize the real section background for thumbnails and
      // fullscreen preview.  AI sections often store background through
      // data-ai-section-bg / CSS vars.  The live canvas has site/theme vars,
      // but preview cards do not, so we must convert it to an inline value.
      const rawSavedBg = String(section.dataset.aiSectionOriginalBg || section.dataset.aiSectionBg || '').trim();
      const rawInlineBg = String(section.style.background || section.style.backgroundImage || '').trim();
      const savedBg = resolveVars(rawSavedBg, sectionVars).trim();
      const currentBg = resolveVars(rawInlineBg, sectionVars).trim();
      const hasImageFill = !!(section.classList.contains('st-bgfx') || section.dataset.stFillMode === 'image' || dataUrl(section));
      const concreteBg = savedBg || currentBg;

      if (concreteBg && concreteBg !== 'none' && !/var\(/i.test(concreteBg)) {
        section.style.setProperty('--st-preview-section-bg', concreteBg);
        if (!hasImageFill || !String(section.style.backgroundImage || '').trim()) {
          section.style.background = concreteBg;
          section.style.backgroundSize = section.style.backgroundSize || 'cover';
          section.style.backgroundPosition = section.style.backgroundPosition || 'center center';
          section.style.backgroundRepeat = section.style.backgroundRepeat || 'no-repeat';
        }
        section.setAttribute('data-st-preview-section-bg-materialized', '1');
      } else if (rawSavedBg && currentBg && currentBg !== 'none') {
        section.style.background = currentBg;
        section.setAttribute('data-st-preview-section-bg-materialized', 'fallback-current');
      }

      if (hasImageFill) {
        materializeBgfx(section, sectionVars);
      }

      section.querySelectorAll('[style],.st-bgfx,[data-st-fill-gallery-item-id],[data-st-fill-gallery-url],[data-st-fill-gallery-path],[data-ai-image-path]').forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        const localVars = collectVars(el.getAttribute('style') || '', sectionVars);
        let st = String(el.getAttribute('style') || '');
        st = resolveVars(st, localVars);
        el.setAttribute('style', st);

        if (el.classList.contains('st-bgfx') || el.dataset.stFillMode === 'image' || dataUrl(el)) {
          materializeBgfx(el, localVars);
        }

        const aiUrl = dataUrl(el);
        const bg = String(el.style.background || el.style.backgroundImage || '').trim();
        if (aiUrl && (!bg || bg === 'none')) {
          const val = cssUrl(aiUrl);
          el.style.backgroundImage = val;
          el.style.backgroundSize = el.style.backgroundSize || 'cover';
          el.style.backgroundPosition = el.style.backgroundPosition || 'center center';
          el.style.backgroundRepeat = 'no-repeat';
        }
      });
    });
    return tmp.innerHTML;
  } catch (_) {
    return raw;
  }
}

function getTemplateVisualHtml_(tpl) {
  if (!tpl) return '';
  if (isPageTemplate_(tpl)) return getPagePreviewHtmlFromTemplate_(tpl);
  if (tpl.type === 'site') return String(tpl.previewHtml || '');
  const html = String(tpl.html || tpl.previewHtml || '');
  return tpl.type === 'ai-templates' ? stTplMaterializeAiPreviewHtml_(html) : html;
}

// [00428][AI TEMPLATES APPLY/PREVIEW PARITY]
// Preview already materializes AI/gallery backgrounds so thumbnails can show
// .st-bgfx layers, data-ai-image-path and gallery URLs even when the original
// saved HTML contains only dataset metadata.  Applying the template must use
// the same materialized HTML; otherwise preview shows images that disappear on
// the real canvas after insert/replace.
function stTplGetTemplateApplyHtml_(tpl) {
  if (!tpl) return '';
  if (isJsonModelTemplate(tpl) && tpl?.model) {
    try { return renderModelToHtml(tpl.model); } catch (_) {}
  }
  const html = String(tpl.html || tpl.previewHtml || '');
  if (!html.trim()) return '';
  if (tpl.type === 'ai-templates') return stTplMaterializeAiPreviewHtml_(html);
  return html;
}


// =========================================================
// [00379][SYSTEM TEMPLATES RUNTIME FALLBACK]
// Причина фіксу: системні шаблони інколи не встигають/не можуть записатись
// у localStorage на першому відкритті (великий store / quota / старий cache).
// Галерея не повинна залежати тільки від LS: системні шаблони беремо прямо
// з JS-модулів і мержимо з user/store-шаблонами під час render().
// Це прибирає порожню вкладку Header/Footer без другого кліку
// і без пересування дерева/меню у центр порожнього екрана.
// =========================================================
function normalizeSystemTemplateForGallery_(it, forcedType = '') {
  if (!it || !it.id) return null;
  const type = String(forcedType || it.type || '').trim();
  const meta = (it.meta && typeof it.meta === 'object') ? it.meta : {};
  let styleProfile = null;
  if (it.styleProfile != null) {
    try {
      styleProfile = assertTemplateStyleProfile00945(it.styleProfile, {
        templateId: String(it.id),
        area: type
      });
    } catch (error) {
      console.error('[templates-gallery][00945] invalid Style Profile rejected', {
        templateId: String(it.id),
        area: type,
        issues: Array.isArray(error?.issues) ? error.issues : [String(error?.message || error || '')]
      });
      return null;
    }
  }
  const rawHtml = String(it.html || '');
  const rawPreviewHtml = String(it.previewHtml || it.html || '');
  // [00546] ВАЖЛИВО: тут більше НЕ викликаємо жодних footer/header normalizer-ів.
  // Системний шаблон повинен приходити вже готовим із template-файлу.
  // У 00545 тут залишився виклик footerTemplateHtmlAsAuthored00541_(), якого вже не існує після rollback,
  // тому вкладка футера падала й показувала порожню/маленьку галерею.
  const html = rawHtml;
  const previewHtml = rawPreviewHtml;
  return {
    ...it,
    type: type || it.type || '',
    html,
    previewHtml,
    ...(styleProfile ? { styleProfile } : {}),
    folderId: it.folderId || null,
    meta: {
      ...meta,
      source: 'system',
      runtimeFallback: true,
      fixedBy: '00546-no-runtime-normalize'
    }
  };
}

function getSystemTemplatesForTab_(tab) {
  const t = String(tab || '').trim();
  try {
    if (t === SECTION_STYLE_TAB_ID_00953) return getSectionStyleRegistry00953();
    if (t === 'header') return (getHeaderTemplatesDemo() || []).map(x => normalizeSystemTemplateForGallery_(x, 'header')).filter(Boolean);
    if (t === 'main') return (getMainTemplatesDemo() || []).map(x => normalizeSystemTemplateForGallery_(x, 'main')).filter(Boolean);
    if (t === 'footer') return (getFooterTemplatesDemo() || []).map(x => normalizeSystemTemplateForGallery_(x, 'footer')).filter(Boolean);
    if (t === 'page') return (getPageTemplatesDemo01032() || []).map(x => normalizeSystemTemplateForGallery_(x, 'page')).filter(Boolean);
    if (t === 'shop') return ([...(getCategoryCardTemplates01050() || []), ...(getProductCardTemplates01047() || [])]).map(x => normalizeSystemTemplateForGallery_(x, 'shop')).filter(Boolean);
    if (t === 'menu') return (getMenuTemplatesDemo() || [])
      .filter(x => String(x?.meta?.menuTarget || x?.menuTarget || '').toLowerCase() !== 'sidebar' && !String(x?.id || '').startsWith('menu_sidebar_'))
      .map(x => normalizeSystemTemplateForGallery_(x, 'menu')).filter(Boolean);
    if (t === 'sidebar') return (getMenuTemplatesDemo() || [])
      .filter(x => String(x?.meta?.menuTarget || x?.menuTarget || '').toLowerCase() === 'sidebar' || String(x?.id || '').startsWith('menu_sidebar_'))
      .map(x => normalizeSystemTemplateForGallery_(x, 'sidebar')).filter(Boolean);
  } catch (err) {
    console.warn('[templates-gallery][00379] getSystemTemplatesForTab_ failed:', t, err);
  }
  return [];
}

function getAllSystemTemplatesForFallback_() {
  const tabs = ['header', 'main', 'footer', 'section-styles', 'sections', 'page', 'shop', 'photo-gallery', 'menu', 'sidebar'];
  const out = [];
  for (const t of tabs) out.push(...getSystemTemplatesForTab_(t));
  return out;
}

function isDeletedSystemTemplateId_(store, id) {
  try {
    const deleted = Array.isArray(store?.meta?.deletedSystemTemplateIds) ? store.meta.deletedSystemTemplateIds : [];
    return deleted.includes(id);
  } catch { return false; }
}

function templateLooksSystem_(tpl) {
  const src = String(tpl?.meta?.source || tpl?.source || '').toLowerCase();
  return src === 'system' || tpl?.system === true || String(tpl?.folderId || '').startsWith('fld_');
}


function isSidebarMenuDesignTemplate_(tpl) {
  const id = String(tpl?.id || '');
  const fid = String(tpl?.folderId || '');
  const target = String(tpl?.meta?.menuTarget || tpl?.menuTarget || tpl?.dataset?.menuTarget || '').toLowerCase();
  return target === 'sidebar' || id.startsWith('menu_sidebar_') || fid === 'fld_menu_sidebar' || fid === 'fld_sidebar_menu';
}

function normalizeSidebarMenuTemplateForSidebarTab_(tpl) {
  if (!tpl) return tpl;
  if (!isSidebarMenuDesignTemplate_(tpl)) return tpl;
  return {
    ...tpl,
    type: 'sidebar',
    folderId: 'fld_sidebar_menu',
    meta: {
      ...(tpl.meta || {}),
      source: tpl?.meta?.source || tpl?.source || 'system',
      menuDesignTemplate: true,
      menuTarget: 'sidebar',
      fixedBy: '00382'
    }
  };
}

function getTemplatesForTabIncludingSystem_(store, tab) {
  const t = String(tab || '').trim();
  let storeItems = Array.isArray(store?.items) ? store.items.filter(x => x && x.type === t) : [];
  // [00382] Sidebar-menu дизайни фізично перенесені у вкладку "Сайтбар".
  // Старі cached записи могли лишитися як type:'menu' / folderId:'fld_menu_sidebar'.
  // Для вкладки "Меню" ми їх ховаємо, а для "Сайтбар" підхоплюємо й нормалізуємо.
  if (t === 'menu') {
    storeItems = storeItems.filter(x => !isSidebarMenuDesignTemplate_(x));
  } else if (t === 'sidebar') {
    const legacySidebarMenus = Array.isArray(store?.items)
      ? store.items.filter(x => x && isSidebarMenuDesignTemplate_(x)).map(normalizeSidebarMenuTemplateForSidebarTab_)
      : [];
    storeItems = [...storeItems, ...legacySidebarMenus];
  }
  const byId = new Map();

  for (const item of storeItems) {
    if (!item || !item.id) continue;
    byId.set(item.id, item);
  }

  for (const sys of getSystemTemplatesForTab_(t)) {
    if (!sys || !sys.id) continue;
    if (isDeletedSystemTemplateId_(store, sys.id)) continue;
    const cached = byId.get(sys.id);
    if (!cached) {
      byId.set(sys.id, sys);
      continue;
    }
    // Якщо в LS лежить стара системна копія — показуємо свіжий HTML з файлу.
    // Якщо це user-шаблон з таким самим id — не перетираємо його.
    if (templateLooksSystem_(cached)) {
      byId.set(sys.id, {
        ...cached,
        ...sys,
        meta: {
          ...(cached.meta || {}),
          ...(sys.meta || {}),
          source: 'system',
          runtimeFallback: true,
          fixedBy: '00382'
        }
      });
    }
  }

  return Array.from(byId.values());
}

function getTemplateByIdRuntimeFallback_(id) {
  if (!id) return null;
  let st = null;
  try { st = (typeof loadTemplatesStore === 'function') ? loadTemplatesStore() : null; } catch { st = null; }

  const arr = (st && Array.isArray(st.items)) ? st.items : [];
  const cached = arr.find(x => x && x.id === id) || null;
  if (cached && !templateLooksSystem_(cached)) return cached;

  const system = getAllSystemTemplatesForFallback_().find(x => x && x.id === id) || null;
  if (system && st && isDeletedSystemTemplateId_(st, system.id)) return null;

  if (system) {
    if (cached && templateLooksSystem_(cached)) {
      return {
        ...cached,
        ...system,
        meta: {
          ...(cached.meta || {}),
          ...(system.meta || {}),
          source: 'system',
          runtimeFallback: true,
          fixedBy: '00382'
        }
      };
    }
    return system;
  }

  return cached;
}

async function applyPageRecipeWithFeedback01028_(tpl) {
  const recipe = getPageRecipe01028_(tpl);
  if (!recipe) return false;

  const startedAt = (performance && performance.now) ? performance.now() : Date.now();
  let overlay = null;
  let applied01029 = false;
  try {
    overlay = showTemplateApplyLoading00675_('PAGE · NEW TAB');
    try {
      window.__ST_ALL_LOG__?.push?.('page-template-apply-feedback-01029', {
        templateId: String(tpl?.id || ''),
        sameOpeningShell: true,
        opensNewPageTab: true
      }, 'info');
    } catch {}

    // Give the existing gallery opening-shell two paint frames before assembling the page.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    const api = window.ST_PAGE_ASSEMBLY_01029 || window.ST_PAGE_ASSEMBLY_01028;
    let ok = false;
    if (api && typeof api.applyRecipeToNewPage === 'function') {
      ok = !!(await api.applyRecipeToNewPage(tpl));
    } else {
      console.warn('[01029][page] Page Assembly API unavailable for reference recipe');
      try { alert('Модуль «Сторінка» ще не готовий. Закрий Галерею, відкрий Дизайн і повтори застосування.'); } catch {}
      ok = false;
    }

    const now = (performance && performance.now) ? performance.now() : Date.now();
    const minVisibleMs = 520;
    const rest = Math.max(0, minVisibleMs - (now - startedAt));
    if (rest) await new Promise(resolve => setTimeout(resolve, rest));
    applied01029 = ok;
    return ok;
  } catch (err) {
    console.warn('[01029][page] apply with feedback failed', err);
    return false;
  } finally {
    // 01029: the loading shell is always removed, even when a reference fails.
    // The gallery itself closes only after a successful atomic page assembly;
    // on failure the user stays in the Page library and can choose another recipe.
    try { hideTemplateApplyLoading00675_(); } catch {}
    if (applied01029) {
      try { closeTemplatesGalleryManager(); } catch {}
      try { focusTemplatesPageAccordion(); } catch {}
    } else {
      try { render(document.getElementById('templatesGalleryManagerView')); } catch {}
    }
  }
}

function openPageTemplateInDesign_(tpl) {
  if (!tpl) return false;

  // 01028: reference recipe opens as a NEW real page tab. The currently opened page
  // remains in the workspace and is not replaced/closed. Legacy snapshot templates
  // continue using the old draft path below.
  const recipe01028 = getPageRecipe01028_(tpl);
  if (recipe01028) {
    try { window.dispatchEvent(new CustomEvent('st:page-template-open-01028', { detail: { template: tpl, recipe: recipe01028 } })); } catch {}
    return true;
  }

  // Page-template відкривається як чернетка: не перетираємо активну сторінку сайту.
  try {
    window.ST_PAGE_DRAFT_MODE?.enterFromTemplate?.({ templateId: tpl.id, templateName: tpl.name || '' });
  } catch {}

  let snap = null;
  try { snap = tpl.html ? JSON.parse(tpl.html) : null; } catch { snap = null; }

  if (snap) {
    // Старі збережені page-шаблони могли мати previewHtml у store,
    // але не мали pageHTML всередині JSON bundle. Додаємо fallback перед відкриттям.
    try {
      if (snap && typeof snap === 'object' && snap.__st_bundle_v1 === true) {
        const visual = getPagePreviewHtmlFromTemplate_(tpl);
        if (visual && !String(snap.pageHTML || snap.rootHTML || snap.previewHtml || '').trim()) {
          snap.pageHTML = visual;
          snap.rootHTML = visual;
          snap.previewHtml = visual;
        }
      }
    } catch {}
    window.dispatchEvent(new CustomEvent('st:canvas-apply-snapshot', {
      detail: { snapshot: snap, options: { persist: false, draft: true } }
    }));
    return true;
  }

  console.warn('[templates-gallery] openPageTemplateInDesign_: snapshot empty', {
    id: tpl.id,
    name: tpl.name,
    type: tpl.type,
    hasHtml: !!tpl.html,
    htmlLen: (tpl.html && String(tpl.html).length) || 0,
    htmlHead: (tpl.html && String(tpl.html).slice(0, 120)) || '',
  });
  return false;
}


// =========================================================
// ✅ ДЕМО-ШАБЛОНИ ДЛЯ "Шапка" (зелені/червоні як ти просив)
// =========================================================
let __headerDemoSeeded = false;

function ensureHeaderTemplates() {
  if (__headerDemoSeeded) return;
  __headerDemoSeeded = true;

  // 5 нових стандартних canvas-native шаблонів шапки.
  // Старі demo/template IDs прибирає міграція у templates-store.js.
  upsertSystemTemplatesOnce(getHeaderTemplatesDemo());
}

let __footerDemoSeeded = false;

function ensureFooterTemplates() {
  if (__footerDemoSeeded) return;      // ✅ не додаємо повторно в цій сесії
  __footerDemoSeeded = true;

  // 00544: footer system templates enter the store as-authored.
  // Structure is already fixed directly inside template files.
  upsertSystemTemplatesOnce((getFooterTemplatesDemo() || []).map(x => normalizeSystemTemplateForGallery_(x, 'footer')).filter(Boolean));
}





let __menuDemoSeeded = false;

function ensureMenuTemplates() {
  if (__menuDemoSeeded) return;
  __menuDemoSeeded = true;

  // [00380] Системні шаблони дизайну меню: header + sidebar variants.
  upsertSystemTemplatesOnce(getMenuTemplatesDemo());
}



// =========================================================
// Tabs / Tree / Grid
// =========================================================
function renderTabs(rootFolders) {
  const tabs = Array.isArray(rootFolders.children) ? rootFolders.children : [];

  if (isAiTemplatesGalleryMode_()) {
    const aiTabs = getAiTemplateTabs_(rootFolders);
    const activeAiTopFolderId = getActiveAiTopFolderId_(rootFolders);
    return `
      <div class="sttpl-mgr__tabs sttpl-mgr__tabs--ai" data-template-gallery-tabs="ai">
        ${aiTabs.map(t => `
          <button class="sttpl-tab sttpl-tab--ai ${t.id === activeAiTopFolderId ? "is-active" : ""}"
            data-act="ai-template-folder" data-tab="ai-templates" data-folder="${t.id || ""}">
            ${esc(t.name || "АІ шаблон")}
          </button>
        `).join("")}
      </div>
    `;
  }

  const sysOrder = TAB_ORDER
    .map(o => tabs.find(t => t.type === o.id))
    .filter(Boolean);

  const custom = tabs.filter(t => !t.system && t.type !== 'ai-templates');

  const all = [...sysOrder, ...custom];

  return `
    <div class="sttpl-mgr__tabs" data-template-gallery-tabs="regular">
      ${all.map(t => `
        <button class="sttpl-tab ${t.type === activeTab ? "is-active" : ""}"
          data-act="tab" data-tab="${t.type || ""}" data-folder="${t.id}">
          ${esc(t.name)}
        </button>
      `).join("")}

      <button class="sttpl-tab sttpl-tab--add" data-act="add-category">+ Категорія</button>
    </div>
  `;
}

const LS_PAGE_TREE_EXPANDED_01029 = 'st_page_gallery_tree_expanded_v1_01029';
function loadPageTreeExpanded01029_() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_PAGE_TREE_EXPANDED_01029) || '[]');
    if (Array.isArray(raw) && raw.length) return new Set(raw.map(String));
  } catch {}
  return new Set(['fld_page_my_templates','fld_page_system','fld_page_system_home']);
}
function savePageTreeExpanded01029_(set) {
  try { localStorage.setItem(LS_PAGE_TREE_EXPANDED_01029, JSON.stringify(Array.from(set || []))); } catch {}
}

function renderTreeChildren01013_(children, level = 1, pageExpanded01029 = null) {
  const kids = Array.isArray(children) ? children : [];
  const pageTree = activeTab === 'page' && pageExpanded01029 instanceof Set;
  return kids.map((ch) => {
    if (ch && ch.divider) {
      return `<div class="sttpl-tree__divider" style="margin-left:${Math.min(level,7)*10}px"></div>`;
    }
    if (!ch) return '';
    const canEdit = !ch.system || (activeTab === 'site' && ch.id !== 'root');
    const hasChildren = Array.isArray(ch.children) && ch.children.length > 0;
    const isMyRoot = ch.userTemplatesRoot === true || /_my_templates$/.test(String(ch.id || ''));
    const isExpanded = !pageTree || !hasChildren || pageExpanded01029.has(String(ch.id || ''));
    const toggle = pageTree && hasChildren
      ? `<button type="button" data-act="page-tree-toggle" data-folder="${esc(ch.id || '')}" aria-label="${isExpanded ? 'Згорнути' : 'Розгорнути'} ${esc(ch.name || 'папку')}" style="flex:0 0 22px;width:22px;height:24px;border:0;background:transparent;color:rgba(225,235,255,.8);font-size:13px;font-weight:900;cursor:pointer;padding:0;">${isExpanded ? '▼' : '▶'}</button>`
      : `<span aria-hidden="true" style="flex:0 0 22px;width:22px;"></span>`;
    return `
      <div class="sttpl-tree__branch${isMyRoot ? ' is-my-templates-root' : ''}" data-tree-folder-id="${esc(ch.id || '')}">
        <div class="sttpl-tree__child" style="padding-left:${Math.min(level,7)*10}px">
          ${toggle}
          <button class="sttpl-tree__item ${ch.id === activeFolderId ? 'is-active' : ''}${isMyRoot ? ' is-my-templates' : ''}"
            data-act="folder" data-folder="${esc(ch.id || '')}" title="${esc((ch.name || '') + (isMyRoot ? ' · ваші власні шаблони' : ''))}">
            ${isMyRoot ? '<span aria-hidden="true">★ </span>' : ''}${esc(ch.name || 'Папка')}
          </button>
          ${canEdit ? `
            <button class="sttpl-tree__icon" data-act="rename-folder" data-folder="${esc(ch.id || '')}" title="Редагувати підкатегорію">✎</button>
            <button class="sttpl-tree__icon" data-act="delete-folder" data-folder-id="${esc(ch.id || '')}" title="Видалити підкатегорію">🗑</button>
          ` : ``}
        </div>
        ${hasChildren && isExpanded ? `<div class="sttpl-tree__nested">${renderTreeChildren01013_(ch.children, level + 1, pageExpanded01029)}</div>` : ''}
      </div>
    `;
  }).join('');
}

function folderPathIds01029_(node, targetId, path = []) {
  if (!node) return null;
  const next = [...path, String(node.id || '')];
  if (String(node.id || '') === String(targetId || '')) return next;
  for (const child of (Array.isArray(node.children) ? node.children : [])) {
    const found = folderPathIds01029_(child, targetId, next);
    if (found) return found;
  }
  return null;
}


// 01030: selecting a Page parent folder is an inherited view. It shows recipes
// from that folder AND every nested child folder recursively. The tree remains
// the storage taxonomy; no recipe/HTML is duplicated for parent views.
function findFolderNode01030_(node, targetId) {
  if (!node) return null;
  if (String(node.id || '') === String(targetId || '')) return node;
  for (const child of (Array.isArray(node.children) ? node.children : [])) {
    const found = findFolderNode01030_(child, targetId);
    if (found) return found;
  }
  return null;
}

function collectFolderSubtreeIds01030_(node, out = new Set()) {
  if (!node) return out;
  const id = String(node.id || '').trim();
  if (id) out.add(id);
  for (const child of (Array.isArray(node.children) ? node.children : [])) {
    collectFolderSubtreeIds01030_(child, out);
  }
  return out;
}

function getActivePageFolderSubtreeIds01030_(foldersRoot01030 = null) {
  try {
    const root = foldersRoot01030 || getFoldersRoot();
    const pageRoot = (root?.children || []).find(x => x && (x.id === 'fld_page' || x.type === 'page')) || null;
    if (!pageRoot) return new Set();
    const active = findFolderNode01030_(pageRoot, activeFolderId) || (activeFolderId === pageRoot.id ? pageRoot : null);
    return active ? collectFolderSubtreeIds01030_(active) : new Set();
  } catch (_) {
    return new Set();
  }
}

function renderTree(node, level = 0) {
  const kids = Array.isArray(node.children) ? node.children : [];
  const pagePath01029 = activeTab === 'page' ? (folderPathIds01029_(node, activeFolderId) || []) : [];
  const canAddSubfolder01029 = activeTab !== 'page' || pagePath01029.includes('fld_page_my_templates');
  const pageExpanded01029 = activeTab === 'page' ? loadPageTreeExpanded01029_() : null;
  if (pageExpanded01029) {
    for (const id of pagePath01029.slice(0, -1)) if (id) pageExpanded01029.add(String(id));
  }

  return `
    <div class="sttpl-tree">
      <div class="sttpl-tree__title">Папки</div>

      <div class="sttpl-tree__items">
        <button class="sttpl-tree__item ${node.id === activeFolderId ? 'is-active' : ''}"
          data-act="folder" data-folder="${esc(node.id || '')}">
          ${esc(node.name || 'Папки')}
        </button>

        ${renderTreeChildren01013_(kids, Math.max(1, level + 1), pageExpanded01029)}
      </div>

      ${canAddSubfolder01029 ? `<div class="sttpl-tree__actions">
        <button class="sttpl-btn" data-act="add-subfolder">${activeTab === 'page' ? '+ Папка / підпапка' : '+ Підкатегорія'}</button>
      </div>` : ''}
    </div>
  `;
}

// =========================================================
// ✅ GRID: мінімальні карточки для HEADER (назва + id + (i))
// =========================================================
// =========================================================
// [TEMPLATES][GRID] Вертикальний список + Реальний HTML-превʼю
// - Карточки: одна під одною (НЕ в ряд)
// - Превʼю: вставляємо tpl.html всередину (pointer-events: none)
// - Знизу: Назва + ID + кнопка ℹ (інфо)
// =========================================================
// =========================================================
// [TEMPLATES][GRID] Вертикальний список шаблонів
// - Wide preview (реальний HTML)
// - Знизу: Назва + ID + ℹ
// =========================================================
function renderGrid() {
  const preparedAt01035 = globalThis.performance?.now?.() ?? Date.now();
  const st = loadTemplatesStore();

  // [00379] Беремо не лише LS-store, а й системні шаблони напряму з JS-модулів.
  // Це особливо важливо для Header/Footer на холодному старті або коли LS переповнений.
  const allItems = getTemplatesForTabIncludingSystem_(st, activeTab);

// =========================================================
// [PAGES ROOT] Клік по папці "Сторінки" (root: fld_page)
// Показуємо ВСІ шаблони сторінок з усіх підкатегорій + "Мої Шаблони",
// але БЕЗ "Чернетки" (fld_page_my_drafts).
// =========================================================
let items = [];
if (activeTab === 'page') {
  const subtreeIds01030 = getActivePageFolderSubtreeIds01030_(st?.folders || null);
  // Parent folder = union of all descendant folders. Leaf folder = itself only.
  // Page root therefore shows My pages + System pages; System shows every system
  // recipe; Home shows all Home themes; a theme shows only its own recipes.
  items = allItems.filter(x => {
    const folderId = String(x?.folderId || '').trim();
    if (!folderId) return String(activeFolderId || '') === 'fld_page';
    if (folderId === 'fld_page_my_drafts') return false;
    return subtreeIds01030.has(folderId);
  });
} else if (activeTab === 'main') {
  // 01034: Main uses the same inherited-folder view as Page.
  // Selecting `Маїн` shows every Main template in all nested categories;
  // selecting `Про нас`, `Контакти`, etc. shows only that category subtree.
  const root01034 = st?.folders || null;
  const mainRoot01034 = root01034 ? findFolderNode01030_(root01034, 'fld_main') : null;
  const activeMain01034 = mainRoot01034
    ? (findFolderNode01030_(mainRoot01034, activeFolderId) || (activeFolderId === 'fld_main' ? mainRoot01034 : null))
    : null;
  const subtree01034 = activeMain01034 ? collectFolderSubtreeIds01030_(activeMain01034) : new Set(['fld_main']);
  items = allItems.filter(x => {
    const folderId = String(x?.folderId || 'fld_main').trim() || 'fld_main';
    return subtree01034.has(folderId);
  });
} else if (false) {
  items = [];
} else if (activeTab === 'shop' && activeFolderId === 'fld_shop') {
  // SHOP root показує всі карточки з двох папок: категорії товарів + карточки товарів.
  items = allItems.slice();
} else if (activeTab === 'photo-gallery' && activeFolderId === 'fld_photo_gallery') {
  // PHOTO-GALLERY root показує всі майбутні шаблони секцій галереї.
  items = allItems.slice();
} else if (activeTab === 'ai-templates' && activeFolderId === 'fld_ai_templates') {
  // AI-TEMPLATES root показує всі AI-заготовки з підпапок: Сайт-АІ, Сторінка-АІ, Шапка-АІ, AI тощо.
  items = allItems.slice();
} else if (activeTab === 'menu' && activeFolderId === 'fld_menu') {
  // MENU root показує тільки горизонтальні дизайни меню. Вертикальні sidebar-дизайни перенесені у вкладку "Сайтбар".
  items = allItems.filter(x => !isSidebarMenuDesignTemplate_(x));
} else if (activeTab === 'sidebar' && activeFolderId === 'fld_sidebar') {
  // SIDEBAR root показує вертикальні дизайни меню сайтбара.
  items = allItems.filter(x => isSidebarMenuDesignTemplate_(x));
} else {
  items = allItems.filter(x =>
    !activeFolderId ||
    x.folderId === activeFolderId ||
    x.folderId == null
  );
}



  // =========================================================
  // [SITE FILTER] Фільтр по категоріях (мультивибір)
  // - працює тільки на вкладці "Сайт"
  // - MERGE логіка: якщо вибрано 0 категорій -> показуємо всі
  // - категорія береться з meta.category або з folderId (fld_site_*)
  // =========================================================
  if (false) {
    const cats = loadSiteFilterCats_();
    if (cats && cats.length) {
      const set = new Set(cats);
      const catFrom = (t) => {
        const mc = (t && t.meta && (t.meta.category || t.meta.cat)) ? String(t.meta.category || t.meta.cat) : '';
        if (mc) return mc;
        const fid = String(t.folderId || '');
        if (fid.startsWith('fld_site_')) return fid.replace('fld_site_', '');
        return '';
      };
      // eslint-disable-next-line no-inner-declarations
      const filtered = items.filter(t => set.has(catFrom(t)));
      // якщо у поточній папці нема збігів — показуємо порожньо (це ок)
      // (не підмішуємо інші, щоб папки/дерево залишались чесними)
      // заміна items локально:
      items.length = 0;
      items.push(...filtered);
    }
  }
  // --- Augment previewHtml for Page/Site cards ---
  const itemsForUI = items.map((t) => {
    // Clone to avoid mutating store items
    const out = { ...t };

    // 01035 PERF: Page cards must stay lightweight during the synchronous Gallery render.
    // Full Header+Main+Footer composition is expensive and used to be assembled for
    // every card before the Gallery could paint. Leave a placeholder here; the
    // real authored preview is mounted lazily only for cards that enter the viewport.
    if (activeTab === 'page') {
      out.previewHtml = '';
      out._lazyPagePreview01035 = true;
      return out;
    }

    // Site templates: save payload in html, preview based on Home page template (if chosen)
    if (false) {
      try {
        const payload = JSON.parse(String(out.html || '{}'));
        const pages = (payload && payload.pages) ? payload.pages : {};
        const homeId = pages && pages.home ? String(pages.home) : '';
        out._homeTemplateId = homeId;

        if (homeId) {
          const homeTpl = getTemplateById(homeId);
          out.previewHtml = homeTpl ? getPagePreviewHtmlFromTemplate_(homeTpl) : '';
        } else {
          out.previewHtml = '';
        }
      } catch (e) {
        out.previewHtml = '';
      }
      return out;
    }

    if (activeTab === 'ai-templates') {
      out.previewHtml = stTplMaterializeAiPreviewHtml_(String(out.previewHtml || out.html || ''));
      return out;
    }

    return out;
  });

  __lastVisibleTemplateIds = itemsForUI.map(t => t && t.id).filter(Boolean);
  try {
    const visible = new Set(__lastVisibleTemplateIds);
    selectedTemplateIds = new Set(Array.from(selectedTemplateIds || []).filter(id => visible.has(id)));
  } catch {}

  if (activeTab === 'main' || activeTab === 'page') {
    try {
      window.__ST_ALL_LOG__?.push?.('template-gallery-folder-catalog-01035', {
        tab: activeTab,
        folderId: String(activeFolderId || ''),
        catalogCount: allItems.length,
        visibleCount: itemsForUI.length,
        visibleIds: __lastVisibleTemplateIds.slice(0, 24),
        prepareMs: Math.round(((globalThis.performance?.now?.() ?? Date.now()) - preparedAt01035) * 10) / 10,
        pagePreviewMode: activeTab === 'page' ? 'lazy-visible-only' : 'universal-thumb'
      });
    } catch {}
  }

  return `
    <div class="sttpl-grid">
      <div class="sttpl-grid__title">${activeTab === SECTION_STYLE_TAB_ID_00953
        ? `Зареєстровані стилі секцій${sectionStyleSelectionArea00950 ? ` · вибір для ${SECTION_STYLE_AREA_LABELS_00950[sectionStyleSelectionArea00950] || sectionStyleSelectionArea00950}` : ''}`
        : (isAiTemplatesGalleryMode_() ? "Вміст AI-папки" : "Шаблони")}</div>

      ${
        itemsForUI.length
          ? `
        <div class="sttpl-grid__cards sttpl-grid__cards--tiles ${activeTab === "header" ? "sttpl-grid__cards--header-column" : (activeTab === "footer" ? "sttpl-grid__cards--footer-column" : ((activeTab === "sections" || activeTab === SECTION_STYLE_TAB_ID_00953) ? "sttpl-grid__cards--sections-column" : ((activeTab === "menu" || activeTab === "sidebar") ? "sttpl-grid__cards--menu-column" : "")))}">
          ${itemsForUI.map(t => {
            const isSel = (t.id === selectedTemplateId);
            const pairNo00965 = String(t?.meta?.pairNo || '').trim();
            const isPair00965 = String(t?.meta?.pairContract || '') === 'header-footer-style-pair-v1-00965';
            const isChecked = selectedTemplateIds.has(t.id);
            const menuTarget = (activeTab === 'menu' || activeTab === 'sidebar') ? String(t?.meta?.menuTarget || t?.menuTarget || (activeTab === 'sidebar' ? 'sidebar' : '')).toLowerCase() : '';
            const cardExtraClass = (activeTab === 'menu' || activeTab === 'sidebar')
              ? (menuTarget === 'sidebar' ? 'sttpl-card--menu-sidebar' : 'sttpl-card--menu-header')
              : '';

// ✅ Статуси застосування (1-в-1 як у вкладці "Шапка")
// - для "header": зелений = Global, червоний = Page
// - для "footer": зелений = Global, червоний = Page
let isGlobalApplied = false;
let isPageApplied   = false;

if (activeTab === "header") {
  const { globalTplId, pageTplId } = readHeaderAppliedState();
  isGlobalApplied = !!(globalTplId && (t.id === globalTplId));
  isPageApplied   = !!(pageTplId   && (t.id === pageTplId));
}

if (activeTab === "footer") {
  const norm = readFooterAppliedState(); // { globalTplId, pages:{} }
  const pid  = getPageIdSafe_();
  const gId  = norm?.globalTplId || null;
  const pId  = (norm?.pages && norm.pages[pid]) ? norm.pages[pid] : null;

  isGlobalApplied = !!(gId && (t.id === gId));
  isPageApplied   = !!(pId && (t.id === pId));
}

            return `
              <div
               class="sttpl-card ${activeTab === "shop" ? "sttpl-card--shop" : ((activeTab === "page" || activeTab === "site") ? "sttpl-card--page" : "sttpl-card--wide")}
                  ${cardExtraClass}
                  ${isSel ? "is-selected" : ""}
                  ${isChecked ? "is-multi-selected" : ""}
                  ${isGlobalApplied ? "is-global-applied" : ""}
                  ${isPageApplied ? "is-page-applied" : ""}"
                data-act="select-template"
                data-tpl-id="${esc(t.id)}"
                data-menu-target="${esc(menuTarget)}"
              >

                <!-- ================= PREVIEW ================= -->
                <div class="sttpl-card__preview ${activeTab === "shop" ? "sttpl-card__preview--shop" : ((activeTab === "page" || activeTab === "site") ? "sttpl-card__preview--page" : "sttpl-card__preview--wide")}"
                     data-sttpl-help-target="template-preview"
                     data-sttpl-help-kind="${esc(activeTab)}"
                     data-sttpl-help-place="gallery-card">
                  ${(activeTab === "page" || activeTab === "site") ? `
                    <div class="sttpl-pageThumb" data-act="page-thumb" data-tpl-id="${esc(t.id)}" aria-hidden="true">
                      <div class="sttpl-pageThumb__viewport">
                        <div class="sttpl-pageThumb__doc">${t.previewHtml || `<div class=\"sttpl-pageThumb__empty sttpl-pageThumb__empty--loading\">Підготовка превʼю…</div>`}</div>

                        <div class="sttpl-pageThumb__hover">
                          <button type="button" class="sttpl-thumbBtn sttpl-thumbBtn--primary" data-act="open-design-template" data-tpl-id="${esc(t.id)}">Відкрити</button>
                          <button type="button" class="sttpl-thumbBtn" data-act="preview-template" data-tpl-id="${esc(t.id)}">Перегляд</button>
                        </div>
                      </div>
                    </div>
                  ` : `
                    <div
                      class="sttpl-templateThumb sttpl-templateThumb--${esc(activeTab)} ${(activeTab === 'menu' || activeTab === 'sidebar') && menuTarget ? `sttpl-templateThumb--menu-${esc(menuTarget)}` : ''}"
                      data-template-thumb="1"
                      data-kind="${esc(activeTab)}"
                      data-tpl-id="${esc(t.id)}"
                      aria-hidden="true"
                    >
                      <div class="sttpl-templateThumb__canvas">
                        <div class="sttpl-templateThumb__doc">
                          ${t.previewHtml || t.html || `<div class="sttpl-templateThumb__empty">Немає HTML</div>`}
                        </div>
                      </div>
                    </div>
                  `}
                </div>

                <!-- ================= META ================= -->
                <div class="sttpl-card__meta sttpl-card__meta--stack">
                  <div class="sttpl-card__nameLine">
                    ${isPair00965 && pairNo00965 ? `<span class="sttpl-pairBadge00965">ПАРА ${esc(pairNo00965)}</span>` : ''}
                    <div class="sttpl-card__name sttpl-card__name--only">
                      ${esc(t.name || "Без назви")}
                    </div>

                    <button
                      type="button"
                      class="sttpl-cardApplyBtn"
                      data-act="apply-card-template"
                      data-tpl-id="${esc(t.id)}"
                      title="Застосувати цей шаблон. Те саме, що Enter у великому перегляді."
                    >${activeTab === SECTION_STYLE_TAB_ID_00953
                      ? `Вибрати${sectionStyleSelectionArea00950 ? ` для ${SECTION_STYLE_AREA_LABELS_00950[sectionStyleSelectionArea00950] || sectionStyleSelectionArea00950}` : ' стиль'}`
                      : 'Застосувати'}</button>

                    <label
                      class="sttpl-roundCheck"
                      data-act="toggle-template-check"
                      data-tpl-id="${esc(t.id)}"
                      title="Виділити для імпорту / експорту"
                    >
                      <input
                        type="checkbox"
                        tabindex="-1"
                        ${isChecked ? 'checked' : ''}
                      />
                      <span></span>
                    </label>
                  </div>
                </div>

              </div>
            `;
          }).join("")}
        </div>
      `
          : `
        <div class="sttpl-empty">
          <div class="sttpl-empty__title">Порожньо</div>
          <div class="sttpl-empty__note">
            Додай шаблони або створи підкатегорії
          </div>
        </div>
      `
      }
    </div>
  `;
}



function render(view) {
  // SAFETY: render() може викликатись з різних місць без передачі view.
  // У такому випадку беремо актуальний контейнер галереї з DOM.
  // Це прибирає падіння виду: Cannot set properties of undefined (setting 'innerHTML')
  // і не змінює стару поведінку викликів render().
  if (!view) view = document.getElementById("templatesGalleryManagerView");
  if (!view) {
    if (window.__ST_TPL_DEBUG__) {
      console.warn('[templates-gallery] render(): view not found, skip render');
    }
    return;
  }

  const root = getFoldersRoot();
  if (activeTab === 'ai-templates') {
    activeTemplateGalleryMode = TEMPLATE_GALLERY_MODE_AI;
  } else if (!isAiTemplatesGalleryMode_()) {
    activeTemplateGalleryMode = TEMPLATE_GALLERY_MODE_TEMPLATES;
  }

  let activeRootFolder = (root.children || []).find(f => f.type === activeTab) || null;
  if (isAiTemplatesGalleryMode_()) {
    activeTab = 'ai-templates';
    if (!activeFolderId || !isFolderInsideAiTemplates_(root, activeFolderId)) {
      activeFolderId = getDefaultAiTemplatesFolderId_(root);
    }
    // Верхній рядок показує AI-папки. Лівий інспектор показує вже вміст
    // активної AI-папки, а не дублює весь список Сайт-АІ / Сторінка-АІ / ...
    activeRootFolder = getActiveAiSidebarRootFolder_(root);
  }
  if (activeRootFolder && !activeFolderId) activeFolderId = activeRootFolder.id;

  // =========================================================
  // PICK MODE (2026): Конструктор "Шаблон Сайта" відкрив галерею
  // щоб обрати шаблон сторінки. У цьому режимі кнопка "Застосувати"
  // має бути по сенсу "Додати в шаблон" і НЕ застосовувати до canvas.
  // =========================================================
  let pickCtx = null;
  let isPickForSiteBuilder = false;
  let pickSiteTemplateName = '';
  if (false) {
    try { pickCtx = JSON.parse(localStorage.getItem('st_tpl_pick_ctx_v1') || 'null'); } catch { pickCtx = null; }
    isPickForSiteBuilder = !!(pickCtx && pickCtx.mode === 'site-template-builder');
    if (isPickForSiteBuilder) {
      try {
        const d = JSON.parse(localStorage.getItem('st_site_template_builder_draft_v1') || 'null');
        pickSiteTemplateName = (d && d.name) ? String(d.name) : '';
      } catch {
        pickSiteTemplateName = '';
      }
    }
  }

  // ✅ кружечки-фокус: працюють 1-в-1 для вкладок "Шапка" і "Футер"
  const isHeaderTab = (activeTab === "header");
  const isFooterTab = (activeTab === "footer");

  // Header applied
  const headerSt = readHeaderAppliedState(); // { pageId, globalTplId, pageTplId }

  // Footer applied
  const footerNorm = readFooterAppliedState(); // { globalTplId, pages:{} }
  const footerPageId = getCurrentPageIdFromDomOrLs();
  const footerGlobalTplId = footerNorm?.globalTplId || null;
  const footerPageTplId = (footerNorm?.pages && footerNorm.pages[footerPageId]) ? footerNorm.pages[footerPageId] : null;

  const activeGlobalTplId = isHeaderTab ? headerSt.globalTplId : (isFooterTab ? footerGlobalTplId : null);
  const activePageTplId   = isHeaderTab ? headerSt.pageTplId   : (isFooterTab ? footerPageTplId   : null);

  // 🟢 якщо є GLOBAL -> зелений, інакше сірий
  const dotGlobalCls = [
    "sttpl-focusDot",
    ((isHeaderTab || isFooterTab) && activeGlobalTplId) ? "is-global" : ""
  ].join(" ");

  // 🔴 якщо є PAGE -> червоний, інакше сірий
  const dotPageCls = [
    "sttpl-focusDot",
    ((isHeaderTab || isFooterTab) && activePageTplId) ? "is-page" : ""
  ].join(" ");

  const dotTitleGlobal = isFooterTab ? "Фокус на GLOBAL футер" : "Фокус на GLOBAL шапку";
  const dotTitlePage   = isFooterTab ? "Фокус на PAGE футер"   : "Фокус на PAGE шапку";


  view.innerHTML = `

     
    <style>
      /* =========================================================
         [TEMPLATES][GRID CSS] Вертикальні карточки + Wide preview
         Можна знайти через пошук: [TEMPLATES][GRID CSS]
      ========================================================= */

      .sttpl-grid__cards--column{
        display:flex;
        flex-direction:column;
        gap:12px;
      }

      .sttpl-grid__cards--tiles{
        display:grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap:16px;
        align-items:start;
      }

      /* [00364][HEADER TEMPLATES ONE COLUMN]
         Тільки для вкладки "Шапка": один шаблон = один повний рядок.
         На широкому екрані більше не буде 2-3 карточки в ряд, а на вузькому
         не буде горизонтального скролу. Так превʼю шапки стає крупнішим,
         але HTML шаблону все ще рендериться у віртуальному полотні і
         масштабується без накладання кнопок/блоків. */
      .sttpl-grid__cards--header-column{
        display:flex !important;
        flex-direction:column !important;
        flex-wrap:nowrap !important;
        grid-template-columns:none !important;
        gap:18px !important;
        align-items:stretch !important;
        overflow-x:hidden !important;
        overflow-y:visible !important;
        padding:2px 2px 14px !important;
      }
      .sttpl-grid__cards--header-column .sttpl-card--wide{
        flex:0 0 auto !important;
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
      }
      .sttpl-grid__cards--header-column .sttpl-card__preview--wide{
        padding:14px !important;
      }
      .sttpl-grid__cards--header-column .sttpl-templateThumb--header{
        /* [00445] Height is calculated from the real scaled header content. */
        height:auto;
        min-height:96px !important;
      }
      .sttpl-grid__cards--header-column .sttpl-card__name--only{
        font-size:16px;
      }

      /* [00365][FOOTER TEMPLATES ONE COLUMN]
         Тільки для вкладки "Футер": один шаблон = один повний рядок.
         Логіка така сама як для шапки у 00364, але окремим класом,
         щоб не зачепити інші вкладки шаблонів. */
      .sttpl-grid__cards--footer-column{
        display:flex !important;
        flex-direction:column !important;
        flex-wrap:nowrap !important;
        grid-template-columns:none !important;
        gap:18px !important;
        align-items:stretch !important;
        overflow-x:hidden !important;
        overflow-y:visible !important;
        padding:2px 2px 14px !important;
      }
      .sttpl-grid__cards--footer-column .sttpl-card--wide{
        flex:0 0 auto !important;
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
      }
      .sttpl-grid__cards--footer-column .sttpl-card__preview--wide{
        padding:14px !important;
      }
      .sttpl-grid__cards--footer-column .sttpl-templateThumb--footer{
        /* [00445] Height is calculated from the real scaled footer content. */
        height:auto;
        min-height:150px !important;
      }
      .sttpl-grid__cards--footer-column .sttpl-card__name--only{
        font-size:16px;
      }

      /* [00393][SECTION TEMPLATES ONE COLUMN + LARGE PREVIEW]
         Секції мають поводитись як шапка/Content/меню: один шаблон = один рядок
         на всю ширину галереї. Міні-превʼю рендериться у нормальній ширині
         1200px і масштабується так, щоб секція була видна повністю, а не
         обрізалась маленькою плиткою. */
      .sttpl-grid__cards--sections-column{
        display:flex !important;
        flex-direction:column !important;
        flex-wrap:nowrap !important;
        grid-template-columns:none !important;
        gap:16px !important;
        align-items:stretch !important;
        overflow-x:hidden !important;
        overflow-y:visible !important;
        padding:2px 2px 16px !important;
      }
      .sttpl-grid__cards--sections-column .sttpl-card--wide{
        flex:0 0 auto !important;
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
      }
      .sttpl-grid__cards--sections-column .sttpl-card__preview--wide{
        padding:14px !important;
      }
      .sttpl-grid__cards--sections-column .sttpl-templateThumb--sections{
        height:420px !important;
      }
      .sttpl-grid__cards--sections-column .sttpl-templateThumb--section-styles{
        height:420px !important;
      }
      .sttpl-grid__cards--sections-column .sttpl-card__name--only{
        font-size:16px;
      }
      @media (min-width: 1800px){
        .sttpl-grid__cards--sections-column{
          gap:20px !important;
        }
        .sttpl-grid__cards--sections-column .sttpl-card__preview--wide{
          padding:16px !important;
        }
        .sttpl-grid__cards--sections-column .sttpl-templateThumb--sections{
          height:560px !important;
        }
        .sttpl-grid__cards--sections-column .sttpl-templateThumb--section-styles{
          height:560px !important;
        }
      }
      @media (max-width: 900px){
        .sttpl-grid__cards--sections-column .sttpl-templateThumb--sections{
          height:360px !important;
        }
        .sttpl-grid__cards--sections-column .sttpl-templateThumb--section-styles{
          height:360px !important;
        }
      }

      /* [00381][MENU TEMPLATES ONE COLUMN]
         Для вкладки "Меню": один дизайн = один великий рядок на всю ширину,
         так само як у шапки/футера. Це дає нормальне читабельне превʼю
         горизонтальних меню та вертикальних sidebar-меню без стиснення у плитку. */
      .sttpl-grid__cards--menu-column{
        display:flex !important;
        flex-direction:column !important;
        flex-wrap:nowrap !important;
        grid-template-columns:none !important;
        gap:14px !important;
        align-items:stretch !important;
        overflow-x:hidden !important;
        overflow-y:visible !important;
        padding:2px 2px 14px !important;
      }
      .sttpl-grid__cards--menu-column .sttpl-card--wide{
        flex:0 0 auto !important;
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
      }
      .sttpl-grid__cards--menu-column .sttpl-card__preview--wide{
        padding:10px !important;
      }
      /* [00383][MENU PREVIEW COMPACT + RESPONSIVE]
         Горизонтальні меню у галереї були занадто низькими всередині
         високого preview-блока. Тепер блок нижчий: зверху/знизу лишається
         орієнтовно 10-18px повітря, а на великих моніторах preview
         автоматично стає більшим і ширшим. */
      .sttpl-grid__cards--menu-column .sttpl-templateThumb--menu{
        height:112px !important;
      }
      .sttpl-grid__cards--menu-column .sttpl-templateThumb--menu-sidebar{
        height:330px !important;
      }
      .sttpl-grid__cards--menu-column .sttpl-card__name--only{
        font-size:16px;
      }
      .sttpl-templateThumb--menu-header .st-menu-design-template--header{
        width:100% !important;
        min-width:0 !important;
        max-width:100% !important;
      }
      .sttpl-templateThumb--menu-header .st-menu-design-template--header .st-menu,
      .sttpl-templateThumb--menu-header .st-menu-design-template--header .st-menu__list{
        width:100% !important;
        max-width:100% !important;
      }
      .sttpl-templateThumb--menu-sidebar .st-menu-design-template--sidebar{
        width:100% !important;
        min-width:0 !important;
        max-width:100% !important;
        padding:8px 10px !important;
      }
      .sttpl-templateThumb--menu-sidebar .st-menu-design-template--sidebar .st-menu__link{
        width:100% !important;
      }
      @media (min-width: 1800px){
        .sttpl-grid__cards--menu-column{
          gap:18px !important;
        }
        .sttpl-grid__cards--menu-column .sttpl-card__preview--wide{
          padding:12px !important;
        }
        .sttpl-grid__cards--menu-column .sttpl-templateThumb--menu{
          height:148px !important;
        }
        .sttpl-grid__cards--menu-column .sttpl-templateThumb--menu-sidebar{
          height:430px !important;
        }
      }

      .sttpl-card--page{
        width:100%;
        text-align:left;
      }

      .sttpl-card__preview--page{
        padding:12px;
      }
      .sttpl-card--page .sttpl-card__preview{height:auto;}

      .sttpl-card--page .sttpl-card__meta{
        padding:10px 12px 12px;
      }

      .sttpl-card--shop{
        width:100%;
        text-align:left;
        border:1px solid rgba(120,160,255,0.18);
        background:rgba(255,255,255,0.03);
        border-radius:16px;
        padding:12px;
        cursor:pointer;
        transition:transform .10s ease, box-shadow .14s ease, border-color .14s ease;
      }
      .sttpl-card--shop:hover{
        transform:translateY(-1px);
        box-shadow:0 16px 34px rgba(0,0,0,.28);
      }
      .sttpl-card--shop.is-selected{
        border-color:rgba(64,150,255,.75) !important;
        box-shadow:0 0 0 2px rgba(64,150,255,.22) !important;
      }
      .sttpl-card__preview--shop{
        width:100%;
        height:auto;
        overflow:hidden;
        border-radius:14px;
        border:1px solid rgba(255,255,255,.10);
        background:rgba(0,0,0,.12);
      }

      /* [00361] Універсальна мініатюра реального шаблону */
      .sttpl-templateThumb{
        position:relative;
        width:100%;
        height:240px;
        overflow:hidden;
        border-radius:14px;
        border:1px solid rgba(255,255,255,.10);
        background:
          radial-gradient(circle at 20% 0%, rgba(120,160,255,.10), transparent 35%),
          linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018));
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.035);
      }
      .sttpl-templateThumb--header,
      .sttpl-templateThumb--menu{
        height:170px;
      }
      .sttpl-templateThumb--footer{
        height:235px;
      }
      .sttpl-templateThumb--sections,
      .sttpl-templateThumb--main,
      .sttpl-templateThumb--photo-gallery{
        height:270px;
      }
      .sttpl-templateThumb--shop{
        height:330px;
      }
      .sttpl-templateThumb--sidebar{
        height:300px;
      }
      .sttpl-templateThumb::before{
        content:"";
        position:absolute;
        inset:8px;
        border-radius:11px;
        border:1px dashed rgba(255,255,255,.09);
        pointer-events:none;
        z-index:2;
      }
      .sttpl-templateThumb__canvas{
        position:absolute;
        top:0;
        left:0;
        width:var(--sttpl-thumb-virtual-w, 1200px);
        min-height:1px;
        transform-origin:top left;
        pointer-events:none;
      }
      .sttpl-templateThumb__doc{
        width:100%;
        min-height:1px;
        pointer-events:none;
      }
      .sttpl-templateThumb__doc,
      .sttpl-templateThumb__doc *{
        box-sizing:border-box !important;
        animation:none !important;
        transition:none !important;
        scroll-behavior:auto !important;
      }


      /* [00460][SOCIAL ICONS IN TEMPLATE PREVIEW]
         Header/footer cards are rendered outside #st-site-header-slot/#st-site-footer-slot,
         so the real canvas icon sizing rules from css/site-canvas.css do not apply here.
         Without these local rules, SVG brand icons can collapse/overflow and look like empty boxes. */
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--icon,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-block--icon{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        overflow:visible !important;
        color:inherit;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-btn,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-btn{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        overflow:hidden !important;
        color:inherit;
        line-height:0 !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-btn__glyph,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-btn__glyph,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-phone__iconsvg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-phone__iconsvg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-button__iconsvg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-button__iconsvg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-logo__iconsvg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-logo__iconsvg{
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        width:var(--st-icon-size, 20px) !important;
        height:var(--st-icon-size, 20px) !important;
        min-width:var(--st-icon-size, 20px) !important;
        min-height:var(--st-icon-size, 20px) !important;
        line-height:0 !important;
        color:inherit !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-svg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-svg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-btn__glyph svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-btn__glyph svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-phone__iconsvg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-phone__iconsvg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-button__iconsvg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-button__iconsvg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-logo__iconsvg svg,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-logo__iconsvg svg{
        width:100% !important;
        height:100% !important;
        display:block !important;
        flex:0 0 auto !important;
        fill:currentColor;
        overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-svg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-svg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-icon-btn__glyph svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-icon-btn__glyph svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-phone__iconsvg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-phone__iconsvg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-button__iconsvg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-button__iconsvg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-logo__iconsvg svg[fill="none"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-logo__iconsvg svg[fill="none"]{
        fill:none !important;
      }

      /* [00431] AI section background parity in thumbnail cards.
         Some AI templates store section background via theme vars.
         The materializer writes --st-preview-section-bg + data marker so the
         card preview keeps the same section backgrounds as the canvas. */
      .sttpl-templateThumb__doc .st-section[data-st-preview-section-bg-materialized="1"]{
        background:var(--st-preview-section-bg) !important;
        background-size:cover !important;
        background-position:center center !important;
        background-repeat:no-repeat !important;
      }

      /* [00426] Preview must render Fill-widget backgrounds saved through .st-bgfx.
         Without these pseudo-layers, some saved AI blocks looked black/empty in the card preview. */
      .sttpl-templateThumb__doc .st-bgfx{
        position:relative !important;
        overflow:hidden;
      }
      .sttpl-templateThumb__doc .st-bgfx::before{
        content:"";
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
        background:var(--st-bgfx-bg, none);
        background-position:var(--st-bgfx-bg-pos, center center);
        background-size:var(--st-bgfx-bg-size, cover);
        background-repeat:var(--st-bgfx-bg-repeat,no-repeat);
        opacity:calc(var(--st-bgfx-bg-opacity, 1) * var(--st-element-fx-opacity,1) * var(--st-block-surface-alpha,1));
        filter:grayscale(var(--st-bgfx-gray, 0)) blur(var(--st-element-fx-blur,0px));
      }
      .sttpl-templateThumb__doc .st-bgfx::after{
        content:"";
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
        background:var(--st-bgfx-filter, none);
        opacity:calc(var(--st-bgfx-filter-opacity, 0) * var(--st-element-fx-opacity,1) * var(--st-block-surface-alpha,1));
        filter:blur(var(--st-element-fx-blur,0px));
      }
      .sttpl-templateThumb__doc .st-bgfx > *{
        position:relative;
        z-index:1;
      }
      .sttpl-templateThumb__doc .st-element-visualfx > :not(.st-resize):not(.st-resize-handle):not([data-resize-handle]){
        opacity:var(--st-element-fx-opacity,1)!important;
        filter:blur(var(--st-element-fx-blur,0px))!important;
      }
      .sttpl-templateThumb__doc .st-block-surfacefx{
        -webkit-backdrop-filter:blur(var(--st-block-surface-blur,0px))!important;
        backdrop-filter:blur(var(--st-block-surface-blur,0px))!important;
      }
      .sttpl-templateThumb__doc .st-block-surfacefx.st-bgfx::before{
        background:var(--st-block-surface-bg,none)!important;
        background-color:var(--st-block-surface-bg-color,transparent)!important;
        background-position:var(--st-block-surface-bg-pos,0% 0%)!important;
        background-size:var(--st-block-surface-bg-size,auto)!important;
        background-repeat:var(--st-block-surface-bg-repeat,repeat)!important;
        opacity:calc(var(--st-block-surface-alpha,1) * var(--st-element-fx-opacity,1))!important;
        filter:blur(var(--st-element-fx-blur,0px))!important;
      }
      .sttpl-templateThumb__doc .st-block-surfacefx.st-bgfx::after{
        background-image:var(--st-bgfx-filter-image,none),var(--st-bgfx-layer-image,none)!important;
        background-position:center center,var(--st-bgfx-bg-pos,center center)!important;
        background-size:100% 100%,var(--st-bgfx-bg-size,cover)!important;
        background-repeat:no-repeat,var(--st-bgfx-bg-repeat,no-repeat)!important;
        opacity:calc(var(--st-bgfx-bg-opacity,1) * var(--st-element-fx-opacity,1))!important;
        filter:grayscale(var(--st-bgfx-gray,0)) blur(var(--st-element-fx-blur,0px))!important;
      }

      /* [00369] Safe mini-preview rules for header/footer templates */
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"],
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"]{
        width:100%;max-width:100%;box-sizing:border-box;overflow:visible;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-row,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-row{
        box-sizing:border-box;overflow:visible;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-row[data-st-footer-no-wrap-resize00458="1"]{
        flex-wrap:nowrap !important;width:100% !important;max-width:100% !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-row[data-st-footer-no-wrap-resize00458="1"] > .st-block{
        min-width:0 !important;box-sizing:border-box !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-logo__title,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-logo__subtitle,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-phone__text,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-button__label,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-menu__text,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-menu__link,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--heading > .st-text-edit,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-logo__title,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-logo__subtitle,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-phone__text,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-button__label,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-menu__text,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-menu__link,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-block--heading > .st-text-edit{
        white-space:nowrap !important;word-break:normal !important;overflow-wrap:normal !important;
        writing-mode:horizontal-tb !important;text-orientation:mixed !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--heading,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-block--heading{
        width:auto !important;min-width:max-content !important;max-width:none !important;flex:0 0 auto !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--heading > .st-text-edit,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"] .st-block--heading > .st-text-edit{
        display:inline-block !important;width:max-content !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;text-overflow:clip !important;
      }

      /* [00968][AUTHORED FOOTER THUMB PARITY]
         Canonical Footer templates already define their own responsive tracks.
         Legacy thumbnail max-content/nowrap rules must not widen CTA headings
         across the action column or force modern cards into false layouts. */
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-block--heading{
        width:100% !important;min-width:0 !important;max-width:100% !important;flex:0 1 auto !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-block--heading > .st-text-edit,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-logo__title,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-logo__subtitle,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-phone__text,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-menu__text,
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-menu__link{
        display:block !important;width:100% !important;min-width:0 !important;max-width:100% !important;
        white-space:normal !important;word-break:normal !important;overflow-wrap:break-word !important;
        writing-mode:horizontal-tb !important;text-orientation:mixed !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="footer"][data-hf-authored-template] .st-button__label{
        display:inline-block !important;width:auto !important;min-width:0 !important;max-width:none !important;
        white-space:nowrap !important;word-break:normal !important;overflow-wrap:normal !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--menu-narrow,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--menu-narrow .st-menu,
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--menu-narrow .st-menu__list{
        width:100% !important;min-width:0 !important;max-width:100% !important;flex-wrap:wrap !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"] .st-block--menu-narrow .st-menu__link{
        min-width:max-content !important;white-space:nowrap !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] > .st-row[data-st-header-row-kind="top-menu"]{
        display:grid !important;grid-auto-flow:unset !important;grid-template-columns:max-content minmax(max-content,1fr) max-content !important;align-items:center !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] > .st-row[data-st-header-row-kind="main"]{
        display:grid !important;grid-auto-flow:unset !important;grid-template-columns:max-content minmax(360px,1fr) max-content !important;align-items:center !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] > .st-row[data-st-header-row-kind="narrow-nav"]{
        display:grid !important;grid-auto-flow:unset !important;grid-template-columns:minmax(0,1fr) !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] [data-st-header-narrow-center="top"]{
        justify-self:center !important;width:auto !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] [data-st-header-narrow-center="main"]{
        justify-self:stretch !important;width:100% !important;min-width:0 !important;max-width:100% !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] [data-st-header-narrow-side]{
        width:auto !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] .st-block--text:not([data-name="Пошук"]),
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] .st-block--text:not([data-name="Пошук"]) > .st-text-edit{
        width:auto !important;min-width:max-content !important;max-width:none !important;overflow:visible !important;white-space:nowrap !important;word-break:normal !important;overflow-wrap:normal !important;writing-mode:horizontal-tb !important;text-orientation:mixed !important;
      }
      .sttpl-templateThumb__doc .st-section[data-sec-role="header"][data-st-template-family="narrow-menu"] .st-block--text[data-name="Пошук"]{
        width:100% !important;min-width:220px !important;max-width:100% !important;overflow:hidden !important;
      }

      /* [00393] Section thumbnail safety: regular section templates must keep their
         internal rows/blocks readable inside the scaled thumbnail. This does not
         rewrite template layout; it only prevents thumbnail-only clipping/vertical text. */
      .sttpl-templateThumb__doc .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section){
        width:100% !important;
        max-width:100% !important;
        box-sizing:border-box !important;
        overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-row{
        box-sizing:border-box !important;
        max-width:100% !important;
      }
      .sttpl-templateThumb__doc .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-button__label,
      .sttpl-templateThumb__doc .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-menu__link,
      .sttpl-templateThumb__doc .st-section:not([data-sec-role="header"]):not([data-sec-role="footer"]):not([data-gallery-section="photo-gallery"]):not(.st-photo-gallery-section) .st-menu__text{
        white-space:nowrap !important;
        word-break:normal !important;
        overflow-wrap:normal !important;
        writing-mode:horizontal-tb !important;
        text-orientation:mixed !important;
      }

      /* [00377] Photo-gallery thumbnail safety: grid cells must be controlled by grid rows, not by the global .st-block min-height. */
      .sttpl-templateThumb__doc .st-photo-gallery-section,
      .sttpl-templateThumb__doc .st-section[data-gallery-section="photo-gallery"]{
        width:100% !important;
        max-width:100% !important;
        box-sizing:border-box !important;
        overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-photo-gallery-section .st-photo-gallery-grid-row,
      .sttpl-templateThumb__doc .st-section[data-gallery-section="photo-gallery"] .st-row[data-gallery-row="grid"]{
        display:grid !important;
        grid-auto-flow:dense !important;
        align-items:stretch !important;
        overflow:visible !important;
      }
      .sttpl-templateThumb__doc .st-photo-gallery-section .st-photo-gallery-image-block,
      .sttpl-templateThumb__doc .st-section[data-gallery-section="photo-gallery"] .st-block[data-gallery-block="image"]{
        min-height:0 !important;
        height:100% !important;
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        overflow:hidden !important;
        align-self:stretch !important;
        justify-self:stretch !important;
      }
      .sttpl-templateThumb__doc .st-photo-gallery-photo{
        width:100% !important;
        height:100% !important;
        min-height:0 !important;
        box-sizing:border-box !important;
      }
      .sttpl-templateThumb__doc .st-photo-gallery-caption,
      .sttpl-templateThumb__doc .st-photo-gallery-preview-caption{
        white-space:normal !important;
        word-break:normal !important;
        overflow-wrap:break-word !important;
      }

      .sttpl-templateThumb__doc [draggable="true"]{
        -webkit-user-drag:none;
      }
      .sttpl-templateThumb__empty{
        min-height:180px;
        display:flex;
        align-items:center;
        justify-content:center;
        color:rgba(255,255,255,.62);
        font-size:13px;
      }

      .sttpl-pageThumb__viewport{
        position:relative;
        width:100%;
        aspect-ratio: 3 / 4;
        border-radius:12px;
        overflow:hidden;
        background: rgba(0,0,0,0.28);
        border: 1px solid rgba(120,160,255,0.18);
      }

      .sttpl-pageThumb__doc{
        position:absolute;
        inset:0;
        display:flex;
        align-items:flex-start;
        justify-content:flex-start;
        pointer-events:none;
      }

      .sttpl-pageThumb__empty{
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        opacity:.65;
        font-size:12px;
      }

      .sttpl-pageThumb__hover{
        position:absolute;
        inset:0;
        display:flex;
        align-items:center;
        justify-content:center;
        gap:10px;
        background: radial-gradient(circle at 50% 40%, rgba(0,0,0,0.08), rgba(0,0,0,0.55));
        opacity:0;
        transition: opacity .14s ease;
        pointer-events:none;
      }

      .sttpl-card--page:hover .sttpl-pageThumb__hover{
        opacity:1;
        pointer-events:auto;
      }

      .sttpl-thumbBtn{
        border-radius:10px;
        padding:10px 14px;
        border: 1px solid rgba(120,160,255,0.22);
        background: rgba(0,0,0,0.28);
        color:#eaf0ff;
        font-weight:700;
        font-size:12px;
        cursor:pointer;
      }
      .sttpl-thumbBtn:hover{
        border-color: rgba(120,160,255,0.55);
        background: rgba(0,0,0,0.36);
      }
      .sttpl-thumbBtn--primary{
        background: linear-gradient(90deg, rgba(26, 86, 170, 0.95), rgba(22, 60, 125, 0.95));
        border-color: rgba(90,170,255,0.55);
      }
}

      .sttpl-card--wide{
        width:100%;
        text-align:left;
      }






     .sttpl-card--wide{
  transition: transform .10s ease, box-shadow .14s ease, border-color .14s ease;
  will-change: transform;
}
.sttpl-card--wide:hover{
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(0,0,0,0.25);
}















      .sttpl-card__preview--wide{
        width:100%;
        height:auto;
        overflow:hidden;
        border-radius:14px;
      }

      /* Реальний HTML всередині: трохи зменшуємо і блокуємо кліки */
      .sttpl-card__preview-inner--html{
        pointer-events:none;
        transform:scale(.92);
        transform-origin:top left;
        width:110%;
      }

      .sttpl-card__meta--row{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding-top:10px;
      }

      .sttpl-card__id{
        opacity:.75;
        font-size:12px;
        margin-top:2px;
      }

      .sttpl-infoBtn{
        width:28px;
        height:28px;
        border-radius:999px;
        border:1px solid rgba(123,155,255,0.22);
        background:rgba(255,255,255,0.03);
        color:inherit;
        cursor:pointer;
      }

    .sttpl-openDesignBtn{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:6px;
      padding:8px 10px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,0.14);
      background:rgba(255,255,255,0.06);
      color:#eaf2ff;
      font-size:12px;
      line-height:1;
      cursor:pointer;
      user-select:none;
      transition:transform .12s ease, background .12s ease, border-color .12s ease;
      margin-left:8px;
      white-space:nowrap;
    }
    .sttpl-openDesignBtn:hover{
      transform:translateY(-1px);
      background:rgba(255,255,255,0.09);
      border-color:rgba(255,255,255,0.22);
    }
      .sttpl-infoBtn:hover{
        background:rgba(26,86,170,0.18);
      }
     

      /* ✅ рамки статусу для wide-карточок (використовує твої класи з mini-card стилів) */
.sttpl-card--wide.is-selected{
  border-color: rgba(64, 150, 255, 0.75) !important;
  box-shadow: 0 0 0 2px rgba(64,150,255,0.22) !important;
}
.sttpl-card--wide.is-global-applied{
  border-color: rgba(34, 197, 94, 0.85) !important;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.22) !important;
}
.sttpl-card--wide.is-page-applied{
  border-color: rgba(239, 68, 68, 0.85) !important;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.22) !important;
}

/* ✅ рамки статусу для PAGE-карточок (щоб вибір було ВИДНО) */
.sttpl-card--page.is-selected{
  border-color: rgba(64, 150, 255, 0.75) !important;
  box-shadow: 0 0 0 2px rgba(64,150,255,0.22) !important;
}
.sttpl-card--page.is-global-applied{
  border-color: rgba(34, 197, 94, 0.85) !important;
  box-shadow: 0 0 0 2px rgba(34,197,94,0.22) !important;
}
.sttpl-card--page.is-page-applied{
  border-color: rgba(239, 68, 68, 0.85) !important;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.22) !important;
}

/* ✅ щоб карточка сторінки була реально клікабельна */
.sttpl-card--page{
  border: 1px solid rgba(120,160,255,0.18);
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  cursor: pointer;
}

/* ✅ щоб карточка була реально "карточкою" */
.sttpl-card--wide{
  border: 1px solid rgba(120,160,255,0.18);
  background: rgba(255,255,255,0.03);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
}

/* ✅ [00361] wide-превʼю більше не обрізає шаблон: висоту тримає .sttpl-templateThumb */
.sttpl-card__preview--wide{
  height: auto;
  border: 0;
  background: transparent;
}

/* Legacy fallback: якщо старий HTML ще десь існує */
.sttpl-card__preview-inner--html{
  transform: none;
  width: 100%;
}

	/* =========================
	   [TEMPLATES][PAGE THUMBNAIL]
	   Превʼю сторінки як у "крутих" конструкторах
	========================= */
	.sttpl-pageThumb{
	  width:100%;
	  height:100%;
	  overflow:hidden;
	  border-radius: 10px;
	  background: rgba(0,0,0,0.12);
	  position:relative;
	}
	.sttpl-pageThumb__viewport{
	  /* "віртуальний" viewport сторінки */
	  width: var(--st-page-preview-w, 1280px);
	  height: var(--st-page-preview-h, 800px);
	  transform-origin: top left;
	  transform: scale(var(--st-page-thumb-scale, 0.08));
	}
	.sttpl-pageThumb__doc{
	  width: 100%;
	  height: 100%;
	  overflow:hidden;
	  pointer-events:none; /* ✅ превʼю не клікабельне */
	}
		.sttpl-pageThumb__empty{
		  display:flex;
		  align-items:center;
		  justify-content:center;
		  width:100%;
		  height:100%;
		  color: rgba(255,255,255,0.55);
		  font-size: 12px;
		}
	.sttpl-pageThumb__empty{
	  height:100%;
	  display:flex;
	  align-items:center;
	  justify-content:center;
	  opacity:.6;
	  font-size:12px;
	}

	.sttpl-previewSize{
	  display:flex;
	  gap:6px;
	  align-items:center;
	  margin-right: 8px;
	}
	.sttpl-previewSize__btn{
	  height:36px;
	  padding: 0 10px;
	  border-radius: 12px;
	  border:1px solid rgba(123,155,255,0.18);
	  background:rgba(255,255,255,0.03);
	  color:inherit;
	  cursor:pointer;
	  font-size:12px;
	  opacity:.85;
	}
	.sttpl-previewSize__btn.is-active{
	  opacity: 1;
	  border-color: rgba(64,150,255,0.55);
	  box-shadow: 0 0 0 2px rgba(64,150,255,0.14);
	}

/* =========================
   [TEMPLATES][HEADER TARGET] dropdown
========================= */
.sttpl-dd{ position:relative; display:inline-block; }
.sttpl-dd__btn{
  display:flex; align-items:center; gap:8px;
  padding:8px 10px;
  border-radius:12px;
  border:1px solid rgba(123,155,255,0.18);
  background:rgba(255,255,255,0.03);
  color:inherit;
  cursor:pointer;
  height:36px;
}
.sttpl-dd__chev{ opacity:.75; font-size:12px; margin-top:1px; }

.sttpl-dd__menu{
  position:absolute;
  top:calc(100% + 8px);
  right:0;
  width:160px;
  border-radius:14px;
  border:1px solid rgba(255,255,255,0.14);
  background:rgba(10, 16, 26, 0.98);
  box-shadow:0 18px 60px rgba(0,0,0,0.45);
  padding:6px;
  display:none;
  z-index:100001;
}
.sttpl-dd.is-open .sttpl-dd__menu{ display:block; }

.sttpl-dd__item{
  width:100%;
  text-align:left;
  padding:10px 10px;
  border-radius:12px;
  border:1px solid transparent;
  background:transparent;
  color:inherit;
  cursor:pointer;
  font-weight:800;
  font-size:12px;
  opacity:.95;
}
.sttpl-dd__item:hover{
  background:rgba(26,86,170,0.18);
  border-color:rgba(123,155,255,0.18);
}
.sttpl-dd__item.is-active{
  background:rgba(26,86,170,0.22);
  border:1px solid rgba(64,150,255,0.45);
}



    
      /* [SITE FILTER ICONS] */
      .sttpl-icon{
        width:34px; height:34px;
        display:inline-flex; align-items:center; justify-content:center;
        border-radius:10px;
        border:1px solid rgba(120,160,255,0.18);
        background: rgba(0,0,0,0.18);
        cursor:pointer;
        user-select:none;
      }
      .sttpl-icon:hover{ background: rgba(26, 86, 170, 0.18); }
      .sttpl-icon--preview{
        color:#fff;
      }
      .sttpl-icon--preview svg{
        width:18px;
        height:18px;
        display:block;
        stroke:#fff;
        fill:none;
        stroke-width:2.25;
        stroke-linecap:round;
        stroke-linejoin:round;
      }
      .sttpl-icon:disabled,
      .sttpl-icon.is-disabled{
        opacity:.45;
        cursor:not-allowed;
        filter:saturate(.55);
      }
      .sttpl-icon--info{
        color:#fef3c7;
        border-color:rgba(250,204,21,.30);
        font-weight:1000;
        font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;
        font-style:normal;
      }
      .sttpl-icon--danger{
        color:#fecaca;
        border-color:rgba(248,113,113,.38);
        background:rgba(127,29,29,.16);
        font-size:20px;
        line-height:1;
        font-weight:1000;
      }
      .sttpl-icon--danger:hover{
        background:rgba(220,38,38,.24);
        border-color:rgba(248,113,113,.62);
      }

      .sttpl-siteFilter{ position: relative; display:inline-flex; gap:8px; align-items:center; }

      .sttpl-siteFilter__drop{
        position:absolute;
        top: calc(100% + 8px);
        left: 0;
        min-width: 240px;
        max-width: 320px;
        padding: 10px;
        border-radius: 12px;
        border:1px solid rgba(120,160,255,0.22);
        background: rgba(10,14,22,0.96);
        box-shadow: 0 14px 40px rgba(0,0,0,0.35);
        display:none;
        z-index: 9999;
      }
      .sttpl-siteFilter__drop.is-open{ display:block; }
      .sttpl-siteFilter__title{ font-weight:700; margin-bottom:8px; }
      .sttpl-siteFilter__list{ display:flex; flex-direction:column; gap:6px; max-height: 240px; overflow:auto; padding-right:4px; }
      .sttpl-siteFilter__row{ display:flex; gap:10px; align-items:center; font-size: 13px; cursor:pointer; }
      .sttpl-siteFilter__row input{ transform: translateY(1px); }
      .sttpl-siteFilter__hint{ margin-top:8px; font-size:12px; opacity:0.8; }

      /* =========================
         [TEMPLATES][IMPORT EXPORT + BIG CARDS]
      ========================= */
      .sttpl-grid__cards--tiles{
        grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)) !important;
        gap:20px !important;
      }
      .sttpl-card--page{
        padding:12px;
        border-radius:18px !important;
        overflow:hidden;
      }
      .sttpl-card--page.is-multi-selected,
      .sttpl-card--wide.is-multi-selected{
        border-color: rgba(250, 204, 21, 0.92) !important;
        box-shadow: 0 0 0 3px rgba(250,204,21,0.22), 0 18px 38px rgba(0,0,0,0.24) !important;
      }
      .sttpl-card--page .sttpl-card__preview--page{
        padding:0;
        border-radius:15px;
        overflow:hidden;
      }
      /* 01029: one scale authority only. Legacy Page CSS scaled the whole
         viewport to ~0.08 while JS also scaled the iframe, producing the
         tiny top-left preview seen in 01028. The card viewport now stays at
         real card size; only the inner iframe is scaled by applyThumbScale_. */
      .sttpl-pageThumb{
        width:100% !important;
        height:auto !important;
        min-height:0 !important;
        transform:none !important;
      }
      .sttpl-pageThumb__viewport{
        position:relative !important;
        width:100% !important;
        height:auto !important;
        aspect-ratio:16 / 10 !important;
        /* 01036: do not make a tall empty frame around a 16:10 page preview. */
        min-height:0 !important;
        transform:none !important;
        transform-origin:top left !important;
        border-radius:16px !important;
        overflow:hidden !important;
        background:#0b0f18 !important;
      }
      .sttpl-pageThumb__doc{
        position:absolute !important;
        inset:0 !important;
        width:100% !important;
        height:100% !important;
        overflow:hidden !important;
        transform:none !important;
      }
      .sttpl-card__meta--stack{
        display:flex;
        flex-direction:column;
        align-items:stretch;
        gap:8px;
        padding:12px 2px 2px;
        min-width:0;
      }
      .sttpl-card__nameLine{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        width:100%;
        min-width:0;
      }
      .sttpl-pairBadge00965{
        flex:0 0 auto;
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-height:24px;
        padding:4px 8px;
        border-radius:999px;
        background:rgba(59,130,246,.14);
        border:1px solid rgba(96,165,250,.36);
        color:#bfdbfe;
        font-size:10px;
        font-weight:950;
        line-height:1;
        letter-spacing:.08em;
        white-space:nowrap;
      }
      .sttpl-card__name--only{
        flex:1 1 auto;
        font-size:15px;
        line-height:1.25;
        font-weight:900;
        color:rgba(243,246,255,.96);
        word-break:break-word;
        min-width:0;
        padding-right:2px;
      }
      .sttpl-cardApplyBtn{
        flex:0 0 auto;
        height:34px;
        min-width:96px;
        padding:0 12px;
        border-radius:999px;
        border:1px solid rgba(96,165,250,.48);
        background:linear-gradient(90deg, rgba(37,99,235,.94), rgba(29,78,216,.94));
        color:#fff;
        font-size:12px;
        font-weight:950;
        cursor:pointer;
        box-shadow:0 10px 24px rgba(37,99,235,.20);
        white-space:nowrap;
      }
      .sttpl-cardApplyBtn:hover{
        transform:translateY(-1px);
        border-color:rgba(147,197,253,.82);
        background:linear-gradient(90deg, rgba(59,130,246,.98), rgba(37,99,235,.98));
        box-shadow:0 14px 30px rgba(37,99,235,.30);
      }
      .sttpl-cardApplyBtn:active{ transform:translateY(1px); }
      .sttpl-card__actionsRow{
        display:none;
      }
      .sttpl-infoBtn--text,
      .sttpl-insertBtn{
        min-width:0;
        height:34px;
        border-radius:12px;
        padding:0 10px;
        border:1px solid rgba(123,155,255,0.22);
        background:rgba(255,255,255,0.045);
        color:#eaf2ff;
        font-size:12px;
        font-weight:850;
        cursor:pointer;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
      }
      .sttpl-infoBtn--text{
        width:auto;
        justify-content:center;
      }
      .sttpl-insertBtn{
        background:linear-gradient(90deg, rgba(26,86,170,.96), rgba(22,60,125,.96));
        border-color:rgba(90,170,255,.55);
      }
      .sttpl-infoBtn--text:hover,
      .sttpl-insertBtn:hover{
        transform:translateY(-1px);
        border-color:rgba(120,180,255,.58);
        background:rgba(26,86,170,.18);
      }
      .sttpl-insertBtn:hover{
        background:linear-gradient(90deg, rgba(37,99,235,.98), rgba(30,64,175,.98));
      }
      .sttpl-roundCheck{
        width:34px;
        height:34px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:999px;
        border:1px solid rgba(255,255,255,.18);
        background:rgba(255,255,255,.04);
        cursor:pointer;
        box-sizing:border-box;
      }
      .sttpl-roundCheck input{
        position:absolute;
        opacity:0;
        pointer-events:none;
      }
      .sttpl-roundCheck span{
        width:18px;
        height:18px;
        border-radius:999px;
        border:2px solid rgba(226,232,240,.72);
        background:rgba(15,23,42,.75);
        box-shadow:0 0 0 2px rgba(0,0,0,.15) inset;
      }
      .sttpl-roundCheck input:checked + span{
        border-color:#facc15;
        background:radial-gradient(circle at center, #facc15 0 42%, rgba(15,23,42,.9) 45% 100%);
        box-shadow:0 0 0 3px rgba(250,204,21,.18);
      }
      .sttpl-btn--soft{
        background:rgba(255,255,255,.045);
        border-color:rgba(123,155,255,.18);
      }
      .sttpl-btn--import{
        border-color:rgba(34,197,94,.34);
      }
      .sttpl-btn--export{
        border-color:rgba(59,130,246,.38);
      }
      .sttpl-btn--replace{
        border-color:rgba(248,113,113,.42);
        color:#fecaca;
        background:rgba(127,29,29,.20);
      }
      .sttpl-btn--replace:hover{
        border-color:rgba(248,113,113,.72);
        background:rgba(185,28,28,.26);
        color:#fff;
      }
      .sttpl-btn--info{
        border-color:rgba(250,204,21,.30);
        color:#fef3c7;
      }
      .sttpl-btn--info:disabled{
        opacity:.45;
        cursor:not-allowed;
      }
      .sttpl-selectedCounter{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:28px;
        height:28px;
        padding:0 8px;
        border-radius:999px;
        border:1px solid rgba(250,204,21,.28);
        background:rgba(250,204,21,.10);
        color:#fde68a;
        font-size:12px;
        font-weight:900;
      }
      .sttpl-mgr__modeSwitch{
        display:inline-flex;
        align-items:center;
        gap:7px;
        margin-left:14px;
        padding-left:14px;
        border-left:1px solid rgba(255,255,255,.13);
        vertical-align:middle;
      }
      .sttpl-modeBtn{
        height:30px;
        padding:0 12px;
        border-radius:999px;
        border:1px solid rgba(123,155,255,.24);
        background:rgba(255,255,255,.045);
        color:rgba(235,242,255,.78);
        font-size:12px;
        line-height:1;
        font-weight:950;
        letter-spacing:.01em;
        cursor:pointer;
        white-space:nowrap;
        transition:background .16s ease,border-color .16s ease,transform .16s ease,color .16s ease,box-shadow .16s ease;
      }
      .sttpl-modeBtn:hover{
        transform:translateY(-1px);
        border-color:rgba(120,180,255,.55);
        background:rgba(26,86,170,.18);
        color:#fff;
      }
      .sttpl-modeBtn.is-active{
        border-color:rgba(96,165,250,.72);
        background:linear-gradient(90deg, rgba(26,86,170,.96), rgba(22,60,125,.96));
        color:#fff;
        box-shadow:0 10px 28px rgba(37,99,235,.28);
      }
      .sttpl-modeBtn--ai.is-active{
        border-color:rgba(168,85,247,.72);
        background:linear-gradient(90deg, rgba(126,34,206,.96), rgba(37,99,235,.96));
        box-shadow:0 10px 28px rgba(126,34,206,.28);
      }
      .sttpl-mgr__tabs--ai{
        border-color:rgba(168,85,247,.22);
      }
      .sttpl-tab--ai.is-active{
        border-color:rgba(168,85,247,.62);
        background:linear-gradient(90deg, rgba(126,34,206,.96), rgba(37,99,235,.96));
        color:#fff;
      }
      #templatesGalleryManagerView .sttpl-mgr__title{
        display:flex;
        align-items:center;
        gap:7px;
        flex-wrap:nowrap;
        min-width:0;
        white-space:nowrap;
      }
      #templatesGalleryManagerView .sttpl-mgr__right{
        display:flex;
        align-items:center;
        justify-content:flex-end;
        gap:7px;
        flex-wrap:wrap;
        min-width:0;
      }
      @media (max-width: 760px){
        #templatesGalleryManagerView .sttpl-mgr__bar{
          gap:8px;
          padding:8px;
        }
        #templatesGalleryManagerView .sttpl-mgr__title{
          font-size:12px;
          gap:5px;
        }
        #templatesGalleryManagerView .sttpl-focusDot{
          width:10px;
          height:10px;
          flex:0 0 auto;
        }
        #templatesGalleryManagerView .sttpl-mgr__modeSwitch{
          margin-left:6px;
          padding-left:6px;
          gap:4px;
          flex:0 0 auto;
        }
        #templatesGalleryManagerView .sttpl-modeBtn{
          height:28px;
          padding:0 8px;
          font-size:11px;
          letter-spacing:0;
        }
        #templatesGalleryManagerView .sttpl-mgr__right{
          gap:5px;
        }
        #templatesGalleryManagerView .sttpl-gear,
        #templatesGalleryManagerView .sttpl-icon{
          width:30px;
          height:30px;
          min-width:30px;
          border-radius:10px;
        }
      }
      @media (max-width: 560px){
        #templatesGalleryManagerView .sttpl-mgr__bar{
          align-items:flex-start;
        }
        #templatesGalleryManagerView .sttpl-mgr__title{
          flex:1 1 auto;
        }
        #templatesGalleryManagerView .sttpl-modeBtn{
          padding:0 7px;
          font-size:10.5px;
        }
        #templatesGalleryManagerView .sttpl-mgr__right .sttpl-btn:not(.sttpl-btn--primary){
          padding-left:8px;
          padding-right:8px;
        }
      }
      /* [00367][TEMPLATE HOVER HELP]
         Велика контрастна підказка через 1 секунду наведення.
         Поки увімкнено для header/footer; тексти для інших типів додаються
         через getTemplateHelpContent_ без зміни preview-механіки. */
      .sttpl-helpPopup{
        position:fixed;
        z-index:2147482400;
        display:none;
        width:min(760px, calc(100vw - 32px));
        max-height:min(72vh, 680px);
        overflow:auto;
        border:3px solid rgba(96,165,250,.98);
        border-radius:24px;
        background:linear-gradient(180deg, rgba(7,12,24,.99), rgba(2,6,23,.99));
        box-shadow:0 30px 110px rgba(0,0,0,.72), 0 0 0 1px rgba(255,255,255,.10) inset;
        color:#ffffff;
        padding:22px 24px 24px;
        pointer-events:none;
        font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;
      }
      .sttpl-helpPopup.is-open{display:block;}
      .sttpl-helpPopup__badge{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:7px 11px;
        border-radius:999px;
        background:rgba(96,165,250,.16);
        border:1px solid rgba(147,197,253,.42);
        color:#bfdbfe;
        font-size:13px;
        font-weight:1000;
        letter-spacing:.09em;
        text-transform:uppercase;
      }
      .sttpl-helpPopup__title{
        margin-top:12px;
        font-size:30px;
        line-height:1.08;
        font-weight:1000;
        color:#ffffff;
        letter-spacing:.01em;
      }
      .sttpl-helpPopup__text{
        margin-top:16px;
        display:grid;
        gap:12px;
        font-size:20px;
        line-height:1.45;
        font-weight:850;
        color:rgba(255,255,255,.94);
      }
      .sttpl-helpPopup__text b{color:#fde68a;font-weight:1000;}
      .sttpl-helpPopup__keys{
        margin-top:18px;
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }
      .sttpl-helpPopup__key{
        padding:12px 13px;
        border-radius:16px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(255,255,255,.06);
        font-size:16px;
        line-height:1.35;
        font-weight:900;
        color:#eff6ff;
      }
      .sttpl-helpPopup__key strong{display:block;color:#93c5fd;font-size:17px;margin-bottom:3px;}
      @media (max-width: 760px){
        .sttpl-helpPopup{padding:18px;width:calc(100vw - 24px);}
        .sttpl-helpPopup__title{font-size:24px;}
        .sttpl-helpPopup__text{font-size:17px;}
        .sttpl-helpPopup__keys{grid-template-columns:1fr;}
      }

      @media (max-width: 980px){
        .sttpl-grid__cards--tiles{ grid-template-columns: 1fr !important; }
        .sttpl-pageThumb__viewport{ min-height:340px; }
        .sttpl-grid__cards--header-column{
          display:flex !important;
          flex-direction:column !important;
          grid-template-columns:none !important;
          overflow-x:hidden !important;
        }
        .sttpl-grid__cards--header-column .sttpl-card--wide{
          flex:0 0 auto !important;
          width:100% !important;
          max-width:100% !important;
          min-width:0 !important;
        }
        .sttpl-grid__cards--header-column .sttpl-templateThumb--header{
          height:260px !important;
        }
        .sttpl-grid__cards--footer-column{
          display:flex !important;
          flex-direction:column !important;
          grid-template-columns:none !important;
          overflow-x:hidden !important;
        }
        .sttpl-grid__cards--footer-column .sttpl-card--wide{
          flex:0 0 auto !important;
          width:100% !important;
          max-width:100% !important;
          min-width:0 !important;
        }
        .sttpl-grid__cards--footer-column .sttpl-templateThumb--footer{
          height:260px !important;
        }
      }


</style>









    <div class="sttpl-mgr__bar">
      <div class="sttpl-mgr__title">
        Галерея шаблонів

        <!-- ✅ Кружечки-фокус (показуємо завжди, але працюють по суті для вкладки "Шапка") -->
        <button class="${dotGlobalCls}" data-act="focus-global" title="${dotTitleGlobal}"></button>
        <button class="${dotPageCls}"   data-act="focus-page"   title="${dotTitlePage}"></button>

        <span class="sttpl-mgr__modeSwitch" role="group" aria-label="Режим галереї шаблонів">
          <button type="button" class="sttpl-modeBtn ${!isAiTemplatesGalleryMode_() ? 'is-active' : ''}" data-act="template-gallery-mode" data-mode="templates">Шаблони</button>
          <button type="button" class="sttpl-modeBtn sttpl-modeBtn--ai ${isAiTemplatesGalleryMode_() ? 'is-active' : ''}" data-act="template-gallery-mode" data-mode="ai-templates">АІ - Шаблони</button>
        </span>
      </div>

      <div class="sttpl-mgr__right">
	        ${activeTab === "page" ? (() => {
	          const s = getPagePreviewSize_();
	          const a = s.key === '1440x900';
	          return `
	            <div class="sttpl-previewSize" title="Розмір превʼю сторінок">
	              <button type="button" class="sttpl-previewSize__btn ${a ? 'is-active' : ''}" data-act="page-preview-size" data-size="1440x900">1440×900</button>
	              <button type="button" class="sttpl-previewSize__btn ${!a ? 'is-active' : ''}" data-act="page-preview-size" data-size="1280x800">1280×800</button>
	            </div>
	          `;

	        })() : ``}
        <button class="sttpl-gear" title="Налаштування" aria-label="Налаштування" data-action="settings" data-act="settings">⚙</button>

        <button type="button" class="sttpl-icon sttpl-icon--preview"
          data-action="preview-template" data-tip="Перегляд" aria-label="Перегляд" ${selectedTemplateId ? "" : "disabled"}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M2.2 12s3.6-6.2 9.8-6.2S21.8 12 21.8 12 18.2 18.2 12 18.2 2.2 12 2.2 12Z"></path>
            <circle cx="12" cy="12" r="2.7"></circle>
          </svg>
        </button>

        <button type="button" class="sttpl-icon sttpl-icon--info"
          data-act="info-template" data-tip="Інформація" aria-label="Інформація" ${selectedTemplateId ? "" : "disabled"}>
          i
        </button>

        ${(() => {
          const t = getTemplateById(selectedTemplateId);
          const canDel = activeTab !== SECTION_STYLE_TAB_ID_00953 && !!(selectedTemplateId && t);
          return `
            <button type="button" class="sttpl-icon sttpl-icon--danger"
              data-action="delete-selected" data-act="delete-selected" data-tip="Видалити" aria-label="Видалити" ${canDel ? "" : "disabled"}>×</button>
          `;
        })()}

        ${activeTab === 'site' ? `
          <div class="sttpl-siteFilter">
            <button type="button" class="sttpl-icon" data-action="site-filter-toggle" data-tip="🏷️ Фільтр категорій\n\n• Натисни і вибери 1 або кілька категорій\n• Показує тільки шаблони сайту з цими категоріями\n• Щоб повернути всі — очисти фільтр 🧹">
              🏷️
            </button>
            <button type="button" class="sttpl-icon" data-action="site-filter-clear" data-tip="🧹 Очистити фільтр\n\nСкидає список вибраних категорій і показує всі шаблони.">
              🧹
            </button>

            <div class="sttpl-siteFilter__drop ${__siteFilterOpen ? 'is-open' : ''}" data-site-filter-drop>
              <div class="sttpl-siteFilter__title">Категорії (можна кілька)</div>
              <div class="sttpl-siteFilter__list">
                ${SITE_CATEGORIES.map(c => {
                  const checked = (loadSiteFilterCats_() || []).includes(c.id);
                  return `
                    <label class="sttpl-siteFilter__row">
                      <input type="checkbox" data-site-filter-cat value="${esc(c.id)}" ${checked ? 'checked' : ''}/>
                      <span>${esc(c.title)}</span>
                    </label>
                  `;
                }).join('')}
              </div>
              <div class="sttpl-siteFilter__hint">Порада: щоб показати всі — натисни 🧹</div>
            </div>
          </div>
        ` : ``}







        ${(() => {
          const selectedTplForApply = getTemplateById(selectedTemplateId);
          const aiKindForApply = String(selectedTplForApply?.meta?.aiTemplateType || '').toLowerCase();
          const isAiApplyTpl = activeTab === 'ai-templates' && !!selectedTplForApply && (
            aiKindForApply === 'sections' || selectedTplForApply?.folderId === 'fld_ai_sections'
          );
          if (isAiApplyTpl) {
            return `
              <button class="sttpl-btn sttpl-btn--primary"
                data-action="apply-selected" data-act="apply-selected" ${selectedTemplateId ? "" : "disabled"}>
                Додати шаблон
              </button>
              <button class="sttpl-btn sttpl-btn--soft sttpl-btn--replace"
                data-action="replace-ai-template" data-act="replace-ai-template" ${selectedTemplateId ? "" : "disabled"}
                title="Замінити поточний AI-шаблон.">
                Замінити шаблон
              </button>
            `;
          }
          return `
            <button class="sttpl-btn sttpl-btn--primary"
              data-action="apply-selected" data-act="apply-selected" ${selectedTemplateId ? "" : "disabled"}>
              ${(() => {
                if (isPickForSiteBuilder) {
                  const nm = (pickSiteTemplateName || '').trim();
                  return nm ? `➕ Додати в шаблон “${esc(nm)}”` : '➕ Додати в шаблон';
                }
                return activeTab === SECTION_STYLE_TAB_ID_00953
                  ? `Вибрати${sectionStyleSelectionArea00950 ? ` для ${SECTION_STYLE_AREA_LABELS_00950[sectionStyleSelectionArea00950] || sectionStyleSelectionArea00950}` : ' стиль'}`
                  : 'Застосувати';
              })()}
            </button>
          `;
        })()}

        <button type="button" class="sttpl-btn sttpl-btn--soft sttpl-btn--import"
          data-act="import-templates" title="Імпорт шаблонів для поточної вкладки">
          ⬆ Імпорт
        </button>

        <button type="button" class="sttpl-btn sttpl-btn--soft sttpl-btn--export"
          data-act="export-templates" title="Експорт вибраних або видимих шаблонів поточної вкладки">
          ⬇ Експорт
        </button>

        <button type="button" class="sttpl-btn sttpl-btn--soft"
          data-act="select-all-visible" title="Виділити всі видимі шаблони">
          Виділити все
        </button>

        <button type="button" class="sttpl-btn sttpl-btn--soft"
          data-act="clear-template-selection" title="Зняти всі круглі виділення">
          Зняти виділене
        </button>

        <span class="sttpl-selectedCounter" title="Кількість виділених шаблонів">${selectedTemplateIds.size}</span>

        <button class="sttpl-btn" data-action="back" data-act="back">← Назад</button>
      </div>
    </div>

    ${renderTabs(root)}

    <div class="sttpl-mgr__layout">
      <div class="sttpl-mgr__left">
        ${activeRootFolder ? renderTree(activeRootFolder) : ""}
      </div>
      <div class="sttpl-mgr__rightPane">
        ${renderGrid()}
      </div>
    </div>
  `;

  applyThemeToView(view, loadTheme());

  // 01035 PERF: actual Page previews are mounted after the Gallery DOM has painted,
  // and only for cards that are visible/near-visible. This keeps folder navigation
  // responsive even when a page recipe references very large Header/Main/Footer HTML.
  if (activeTab === 'page' || activeTab === 'site') {
    requestAnimationFrame(() => {
      try { mountPageThumbs_(view); } catch (e) { console.warn('[templates-gallery][01035] lazy page thumb mount failed', e); }
    });
  }

	  // ✅ превʼю сторінок: виставляємо віртуальний viewport + автоскейл у карточках
	  if (activeTab === 'page' || activeTab === 'site') {
	    const s = getPagePreviewSize_();
	    view.style.setProperty('--st-page-preview-w', `${s.w}px`);
	    view.style.setProperty('--st-page-preview-h', `${s.h}px`);
	    requestAnimationFrame(() => {
	      try {
	        const thumbs = Array.from(view.querySelectorAll('.sttpl-pageThumb'));
	        for (const th of thumbs) {
	          // превʼю-бокс (всередині preview контейнера)
	          const box = th.getBoundingClientRect();
	          const scale = Math.max(0.02, Math.min(box.width / s.w, box.height / s.h));
	          th.style.setProperty('--st-page-thumb-scale', String(scale));
	        }
	      } catch {}
	    });
	  }

  // ✅ [00361] Універсальні мініатюри для всіх інших вкладок шаблонів
  try { mountUniversalTemplateThumbs_(view); } catch(e) { console.warn(e); }
}

// =========================================================
// Відкриття/закриття
// =========================================================
let __mainDemoSeeded00888 = false;
function ensureMainTemplates00888_() {
  if (__mainDemoSeeded00888) return;
  __mainDemoSeeded00888 = true;

  // Keep only the lightweight folder/meta state in localStorage. The system
  // template payload is supplied by main-templates.js exactly like Header/Footer.
  const st = loadTemplatesStore();
  const root = st?.folders;
  if (root && Array.isArray(root.children) && !root.children.some((folder) => folder?.type === 'main')) {
    root.children.splice(1, 0, { id: 'fld_main', type: 'main', name: 'Маїн', system: true, children: [] });
    saveTemplatesStore(st);
  }
  upsertSystemTemplatesOnce(getMainTemplatesDemo());
}

function ensureTemplatesForActiveTab_(tab) {
  const t = String(tab || 'site');
  try {
    if (t === 'header') ensureHeaderTemplates();
    else if (t === 'main') ensureMainTemplates00888_();
    else if (t === 'footer') ensureFooterTemplates();
    else if (t === 'shop') { loadTemplatesStore(); }
    else if (t === 'menu' || t === 'sidebar') ensureMenuTemplates();
  } catch (err) {
    // [00379] Не зупиняємо відкриття галереї, якщо LS не прийняв великий system-store.
    // renderGrid() нижче все одно покаже системні шаблони через runtime fallback.
    console.warn('[templates-gallery][00379] LS seed failed; using runtime system templates:', t, err);
  }
}

export function openTemplatesGalleryManager(tab = "site", options = {}) {
  const view = getOrCreateTemplateGalleryView();
  if (!view) return;

  // [00338][PERF] Не засіваємо всі бібліотеки при кожному відкритті галереї.
  // Завантажуємо тільки ті системні шаблони, які потрібні активній вкладці.
  ensureGalleryMiniCardStyles();

  activeTab = tab || "site";
  const openOptions = (options && typeof options === 'object') ? options : {};
  const resolvedMainTarget00952 = activeTab === 'main'
    ? window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.resolveMainTemplateTarget?.()
    : null;
  mainReplaceTargetId00952 = activeTab === 'main'
    ? String(openOptions.mainReplaceTargetId || resolvedMainTarget00952?.sectionId || '').trim()
    : '';
  commerceComponentInsertParentId01041 = activeTab === 'shop' ? String(openOptions.componentInsertParentId01041 || '').trim() : '';
  commerceComponentReplaceTargetId01041 = activeTab === 'shop' ? String(openOptions.componentReplaceTargetId01041 || '').trim() : '';
  commerceComponentType01041 = activeTab === 'shop' ? String(openOptions.componentType01041 || '').trim().toLowerCase() : '';
  commerceAllowTypeChange01050 = activeTab === 'shop' && openOptions.allowCommerceTypeChange01050 === true;
  sectionStyleSelectionArea00950 = activeTab === SECTION_STYLE_TAB_ID_00953
    ? String(openOptions.styleSelectionArea || '').trim()
    : '';
  const requestedFolderId = openOptions.folderId ? String(openOptions.folderId) : '';
  const requestedTemplateId = openOptions.templateId ? String(openOptions.templateId) : '';
  selectedTemplateId = requestedTemplateId || null;

  const root = getFoldersRoot();
  if (activeTab === 'ai-templates') {
    saveTemplateGalleryMode_(TEMPLATE_GALLERY_MODE_AI);
    activeFolderId = getDefaultAiTemplatesFolderId_(root);
    if (requestedFolderId && isFolderInsideAiTemplates_(root, requestedFolderId)) {
      activeFolderId = requestedFolderId;
    }
    if (requestedTemplateId) selectedTemplateId = requestedTemplateId;
  } else {
    saveTemplateGalleryMode_(TEMPLATE_GALLERY_MODE_TEMPLATES);
    ensureTemplatesForActiveTab_(activeTab);
    const refreshedRoot00888 = getFoldersRoot();
    const rootFolder = (refreshedRoot00888.children || []).find(f => f.type === activeTab) || null;
    activeFolderId = requestedFolderId || (rootFolder ? rootFolder.id : null);
  }

  // [00380][MENU TEMPLATE DESIGN] Якщо галерея відкрита з кнопки "Змінити" для активного меню,
  // одразу показуємо правильну папку: меню шапки або вертикальні меню сайтбара.
  if (String(activeTab || '') === 'menu') {
    try {
      const target = String(localStorage.getItem('st_menu_template_target_v1') || 'header').toLowerCase();
      if (target === 'sidebar') {
        activeTab = 'sidebar';
        ensureTemplatesForActiveTab_(activeTab);
        activeFolderId = 'fld_sidebar_menu';
      } else {
        activeFolderId = 'fld_menu_header';
      }
    } catch {}
  } else if (String(activeTab || '') === 'sidebar') {
    activeFolderId = 'fld_sidebar_menu';
  }

  enterTemplatesGalleryWorkspace();
  lockPageScroll_();

  view.className = "sttpl-mgr";
  view.dataset.activeTemplateTab = String(activeTab || '');
  view.style.display = "";

  // 00886: the gallery lives in a dedicated absolute layer.
  // It must never scroll the Canvas or call scrollIntoView on the page hierarchy.


  // bind import input once
  try {
    if (!window.__stTplImportBound) {
      const inp = document.getElementById('stTplImportFile');
      if (inp) {
        inp.addEventListener('change', async () => {
          const file = inp.files && inp.files[0];
          inp.value = '';
          if (!file) return;
          try {
            const txt = await file.text();
            const parsed = JSON.parse(txt);
            const st = parsed && parsed.store ? parsed.store : parsed;
            if (!st || typeof st !== 'object' || !Array.isArray(st.items) || !st.folders) {
              alert('Невірний файл імпорту ❌');
              return;
            }
            // backup current before import
            const cur = localStorage.getItem('st_templates_store_v1');
            if (cur) localStorage.setItem('st_templates_store_backup_v1', cur);
            saveTemplatesStore(st);
            alert('Імпорт виконано ✅');
            // rerender
            renderTemplatesGalleryManager();
          } catch (err) {
            console.warn('[TPL] import failed', err);
            alert('Помилка імпорту ❌');
          }
        });
      }
      window.__stTplImportBound = true;
    }
  } catch (e) {}
  render(view);

  // 00886: render(view) above is the single synchronous mount.
  // Old RAF/timeout rerender guards were removed because they recreated the gallery
  // after close and returned Canvas to the same document flow.
  bindTemplateHoverHelpOnce_();

  // ✅ ВАЖЛИВО:
  // Галерею можуть відкривати різні віджети (не лише Templates Widget).
  // Тому хендлери кліків/ESC мають бути гарантовано підключені незалежно від того,
  // чи завантажений `templates-widget.js` на поточній сторінці.
  // Використовуємо той самий guard-flag, що й templates-widget.js, щоб не було подвійної обробки.
  if (!window.__stTplGalleryMgrBound) {
    window.__stTplGalleryMgrBound = true;

    // ESC закриває менеджер, якщо він відкритий
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const v = document.getElementById('templatesGalleryManagerView');
        if (v && v.style.display !== 'none') {
          e.preventDefault();
          const back = v.querySelector('[data-act="back"]');
          if (back) back.click();
        }
      }
    });

    // Делегування кліків по всій сторінці (галерея рендериться як overlay)
    document.addEventListener('click', (e) => {
      try { handleTemplatesGalleryManagerClick(e); } catch (err) {
        console.warn('[templates-gallery] click handler error:', err);
      }
    });

    document.addEventListener('dblclick', (e) => {
      try { handleTemplatesGalleryManagerDblClick(e); } catch (err) {
        console.warn('[templates-gallery] dblclick handler error:', err);
      }
    });
  }
  
    // ✅ delayed tooltip (1s) for [data-tip] icons in gallery
    if (!window.__stTplGalleryTipBound) {
      window.__stTplGalleryTipBound = true;

      const tipEl = document.createElement('div');
      tipEl.id = 'stTplGalleryTooltip';
      tipEl.style.position = 'fixed';
      tipEl.style.zIndex = '100000';
      tipEl.style.maxWidth = '320px';
      tipEl.style.padding = '10px 12px';
      tipEl.style.borderRadius = '12px';
      tipEl.style.border = '1px solid rgba(120,160,255,0.22)';
      tipEl.style.background = 'rgba(10,14,22,0.96)';
      tipEl.style.boxShadow = '0 14px 40px rgba(0,0,0,0.35)';
      tipEl.style.color = '#fff';
      tipEl.style.fontSize = '12px';
      tipEl.style.lineHeight = '1.35';
      tipEl.style.whiteSpace = 'pre-wrap';
      tipEl.style.display = 'none';
      document.body.appendChild(tipEl);

      let timer = null;
      let last = null;

      const hide = () => {
        if (timer) { clearTimeout(timer); timer = null; }
        last = null;
        tipEl.style.display = 'none';
      };

      const showFor = (el) => {
        if (!el) return;
        const txt = String(el.getAttribute('data-tip') || '').trim();
        if (!txt) return;

        tipEl.textContent = txt;
        tipEl.style.display = 'block';

        const r = el.getBoundingClientRect();
        const pad = 10;
        let x = r.left;
        let y = r.bottom + 10;

        // keep inside viewport
        const tr = tipEl.getBoundingClientRect();
        x = Math.max(pad, Math.min(x, window.innerWidth - tr.width - pad));
        y = Math.max(pad, Math.min(y, window.innerHeight - tr.height - pad));

        tipEl.style.left = x + 'px';
        tipEl.style.top = y + 'px';
      };

      document.addEventListener('mouseover', (ev) => {
        const v = document.getElementById('templatesGalleryManagerView');
        if (!v || v.style.display === 'none') return;

        const el = ev.target?.closest?.('[data-tip]');
        if (!el || !v.contains(el)) return;

        hide();
        last = el;
        timer = setTimeout(() => {
          if (last !== el) return;
          showFor(el);
        }, 1000);
      }, true);

      document.addEventListener('mouseout', (ev) => {
        const v = document.getElementById('templatesGalleryManagerView');
        if (!v || v.style.display === 'none') return;

        const el = ev.target?.closest?.('[data-tip]');
        if (!el) return;
        if (last === el) hide();
      }, true);

      // hide on scroll/click
      document.addEventListener('scroll', hide, true);
      document.addEventListener('click', hide, true);
    }

// ✅ auto-close dropdown on outside click (one-time)
  if (!view.__ddOutsideBound) {
    view.__ddOutsideBound = true;
    document.addEventListener("click", (ev) => {
      const v = document.getElementById("templatesGalleryManagerView");
      if (!v || v.style.display === "none") return;
      if (ev.target.closest(".sttpl-dd") || ev.target.closest(".sttpl-siteFilter")) return;
      const openDd = v.querySelector(".sttpl-dd.is-open");
      if (openDd) openDd.classList.remove("is-open");
    }, true);
  }





  applyThemeToView(view, loadTheme());

  console.log("[templates-gallery] openTemplatesGalleryManager -> tab:", activeTab, "folder:", activeFolderId);
}

export function closeTemplatesGalleryManager() {
  try { hideTemplateApplyLoading00675_(); } catch (_) {}
  try { window.ST_CANCEL_TEMPLATES_GALLERY_OPEN_00886?.(); } catch {}
  const view = document.getElementById("templatesGalleryManagerView");
  if (view) {
    view.hidden = true;
    view.style.display = "none";
  }
  unlockPageScroll_();

  // ✅ якщо apply робився до готовності runtime — застосуємо зараз
  try {
    const raw = localStorage.getItem("st_header_pending_apply_v1");
    if (raw) {
      const pending = JSON.parse(raw);
      localStorage.removeItem("st_header_pending_apply_v1");

      // невелика затримка, щоб #site-root повернувся і runtime точно бачив slot
      setTimeout(() => {
        applyHeaderTemplateViaRuntime({
          html: pending?.html || "",
          mode: pending?.mode === "page" ? "page" : "global",
          pageId: pending?.pageId || getCurrentPageIdFromDomOrLs()
        });
      }, 30);
    }
  } catch {}


  exitTemplatesGalleryWorkspace();
}

// =========================================================
// ✅ Фокус на шаблон (скрол + виділення)
// =========================================================

function applySectionTemplateToCanvas_(tplOrHtml) { return false; }

function replaceCanvasWithTemplate_(tplOrHtml, options = {}) {
  return { ok: false, sections: 0, removed: 0, transfer: { movedText: 0, movedImages: 0, matchedSections: 0 }, reason: 'content-disabled' };
}

function focusTemplateById(tplId, tab = activeTab) {
  const view = document.getElementById("templatesGalleryManagerView");
  if (!view || view.style.display === "none") return;
  if (!tplId) return;

  const targetTab = (tab === "footer") ? "footer" : "header"; // dots працюють лише для цих вкладок

  if (activeTab !== targetTab) {
    activeTab = targetTab;
    const root = getFoldersRoot();
    const rootFolder = (root.children || []).find(f => f.type === activeTab) || null;
    activeFolderId = rootFolder ? rootFolder.id : null;
  }

  selectedTemplateId = tplId;
  render(view);

  requestAnimationFrame(() => {
    const card = view.querySelector(`[data-act="select-template"][data-tpl-id="${CSS.escape(tplId)}"]`);
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });

    // ✅ close Site Filter dropdown
    if (__siteFilterOpen) {
      __siteFilterOpen = false;
      render(view);
    }
  });
}

// =========================================================
// ✅ Модалка (i) Інфо
// =========================================================
function getOrCreateInfoModal() {
  let m = document.getElementById("sttplInfoModal");
  if (m) return m;

  m = document.createElement("div");
  m.id = "sttplInfoModal";
  m.className = "sttpl-infoModal";
  m.innerHTML = `
    <div class="sttpl-infoModal__card">
      <div class="sttpl-infoModal__top">
        <div class="sttpl-infoModal__title">Інформація про шаблон</div>
        <button class="sttpl-infoModal__close" type="button" data-act="close-info">Закрити</button>
      </div>
      <div class="sttpl-infoModal__body" id="sttplInfoModalBody"></div>
    </div>
  `;

  m.addEventListener("click", (e) => {
    if (e.target === m) m.style.display = "none";
    if (e.target.closest('[data-act="close-info"]')) m.style.display = "none";
  });

  document.body.appendChild(m);
  return m;
}

function showTemplateInfo(tplId) {
  const tpl = getTemplateById(tplId);
  if (!tpl) return;

  const { pageId, globalTplId, pageTplId } = readHeaderAppliedState();
const mode = "—"; // mode зараз керується SiteHeaderRuntime; статуси тут по templateId

  const where = [];
  if (tplId === globalTplId) where.push("✅ Використовується як GLOBAL (зелена рамка)");
  if (tplId === pageTplId)   where.push("✅ Використовується як PAGE (червона рамка)");
  if (!where.length) where.push("— Не застосовано (без статусу)");

  const txt =
`name: ${tpl.name || "—"}
id:   ${tpl.id}
type: ${tpl.type || "—"}
folderId: ${tpl.folderId || "—"}

pageId (current): ${pageId}
mode (current):   ${mode}

status:
${where.join("\n")}`;

  const modal = getOrCreateInfoModal();
  const body = modal.querySelector("#sttplInfoModalBody");
  if (body) body.textContent = txt;

  modal.style.display = "flex";
}



function getScrollParent(el) {
  let p = el;
  while (p && p !== document.body) {
    const s = getComputedStyle(p);
    const oy = s.overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
    p = p.parentElement;
  }
  return null;
}

function isInView(el, scroller) {
  const r = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  return r.top >= sr.top && r.bottom <= sr.bottom;
}




function ensureApplyTargetModalStyles00577_() {
  if (document.getElementById('st-apply-target-modal-styles-00577')) return;
  const style = document.createElement('style');
  style.id = 'st-apply-target-modal-styles-00577';
  style.textContent = `
    #stHeaderApplyModal .st-apply-mode-btn{
      flex:1 !important;
      padding:13px 12px !important;
      border-radius:14px !important;
      color:rgba(255,255,255,.92) !important;
      cursor:pointer !important;
      font-weight:1000 !important;
      letter-spacing:.02em !important;
      transition:transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease !important;
    }
    #stHeaderApplyModal .st-apply-mode-btn[data-mode="page"],
    #stHeaderApplyModal .st-apply-mode-btn[data-mode="replace"]{
      border:1px solid rgba(239,68,68,.35) !important;
      background:rgba(239,68,68,.12) !important;
    }
    #stHeaderApplyModal .st-apply-mode-btn[data-mode="global"],
    #stHeaderApplyModal .st-apply-mode-btn[data-mode="add"]{
      border:1px solid rgba(34,197,94,.38) !important;
      background:rgba(34,197,94,.14) !important;
    }
    #stHeaderApplyModal .st-apply-mode-btn:hover,
    #stHeaderApplyModal .st-apply-mode-btn.is-active{
      transform:translateY(-1px) !important;
    }
    #stHeaderApplyModal .st-apply-mode-btn.is-active[data-mode="global"],
    #stHeaderApplyModal .st-apply-mode-btn.is-active[data-mode="add"]{
      border-color:rgba(34,197,94,.72) !important;
      background:rgba(34,197,94,.20) !important;
      color:#fff !important;
      box-shadow:0 0 0 2px rgba(34,197,94,.24), 0 14px 34px rgba(22,163,74,.20) !important;
    }
    #stHeaderApplyModal .st-apply-mode-btn.is-active[data-mode="page"],
    #stHeaderApplyModal .st-apply-mode-btn.is-active[data-mode="replace"]{
      border-color:rgba(239,68,68,.72) !important;
      background:rgba(239,68,68,.18) !important;
      color:#fff !important;
      box-shadow:0 0 0 2px rgba(239,68,68,.22), 0 14px 34px rgba(220,38,38,.18) !important;
    }
    #stHeaderApplyModal .st-apply-mode-btn.is-clicked-00675,
    #stHeaderApplyModal .st-apply-mode-btn.is-clicked-00678,
    #stHeaderApplyModal .st-apply-mode-btn.is-clicked-00679,
    #stHeaderApplyModal .st-apply-mode-btn.is-active.is-clicked-00675[data-mode],
    #stHeaderApplyModal .st-apply-mode-btn.is-active.is-clicked-00678[data-mode],
    #stHeaderApplyModal .st-apply-mode-btn.is-active.is-clicked-00679[data-mode]{
      transform:translateY(-1px) scale(.992) !important;
      box-shadow:
        0 0 22px rgba(239,68,68,.34),
        0 10px 32px rgba(239,68,68,.24),
        0 18px 46px rgba(15,23,42,.38) !important;
      filter:drop-shadow(0 0 12px rgba(239,68,68,.30)) !important;
    }
    #stHeaderApplyModal.is-loading-00675 .st-apply-mode-btn.is-clicked-00675::after,
    #stHeaderApplyModal.is-loading-00675 .st-apply-mode-btn.is-clicked-00678::after,
    #stHeaderApplyModal.is-loading-00675 .st-apply-mode-btn.is-clicked-00679::after{
      content:'  • застосування' !important;
      font-size:10px !important;
      letter-spacing:.06em !important;
      opacity:.78 !important;
      text-transform:none !important;
    }
    #templatesGalleryManagerView .sttpl-applyOpeningOverlay00679{
      position:fixed !important;
      inset:0 !important;
      z-index:100020 !important;
      display:flex !important;
      align-items:center !important;
      justify-content:center !important;
      padding:18px !important;
      background:rgba(2,6,23,.76) !important;
      backdrop-filter:blur(8px) !important;
    }
    #templatesGalleryManagerView .sttpl-applyOpeningOverlay00679 .sttpl-openingShell{
      width:min(980px,96vw) !important;
      max-height:calc(100vh - 36px) !important;
    }
    #templatesGalleryManagerView .sttpl-applyOpeningOverlay00679 .sttpl-openingShell__card{
      min-height:min(560px,calc(100vh - 64px)) !important;
    }
    /* [00683] Keep the original first-open gallery animation speed.
       Do not override animation-duration here: the apply loader must feel the same
       for Header and Footer, only the visible timing is controlled in JS. */
    #stHeaderApplyModal .st-apply-key-hint{
      padding:0 14px 14px;
      opacity:.86;
      font-size:12px;
      line-height:1.45;
      color:rgba(226,232,240,.92);
    }
    #stHeaderApplyModal .st-apply-key-hint b{color:#fde68a;}
  `;
  document.head.appendChild(style);
}


function getTemplateApplyLoadingTitle00675_() {
  try {
    const titleEl = document.querySelector('#stHeaderApplyModal [data-role="st-apply-title"]');
    const txt = String(titleEl?.textContent || '').toLowerCase();
    if (txt.includes('фут')) return 'Застосовую футер';
    if (txt.includes('шап')) return 'Застосовую шапку';
    if (txt.includes('main') || txt.includes('маїн')) return 'Застосовую Маїн';
    if (String(activeTab || '').toLowerCase() === 'page') return 'Збираю сторінку';
  } catch (_) {}
  if (String(activeTab || '').toLowerCase() === 'page') return 'Збираю сторінку';
  return 'Застосовую шаблон';
}

function showTemplateApplyLoading00675_(note = '') {
  try {
    const view = document.getElementById('templatesGalleryManagerView');
    if (!view || view.style.display === 'none') return null;
    hideTemplateApplyLoading00675_();
    const title = getTemplateApplyLoadingTitle00675_();
    const overlay = document.createElement('div');
    overlay.id = 'stTplApplyLoadingOverlay00675';
    // [00679] IMPORTANT: this overlay lives INSIDE #templatesGalleryManagerView,
    // so it reuses the existing first-open gallery animation/styles from css/design-panel.css.
    // No separate/new apply animation is used here; only the text is changed.
    overlay.className = 'sttpl-applyOpeningOverlay00679';
    overlay.innerHTML = `
      <div class="sttpl-openingShell" role="status" aria-live="polite">
        <div class="sttpl-openingShell__card">
          <div class="sttpl-openingShell__scan" aria-hidden="true"></div>
          <div class="sttpl-openingShell__grid" aria-hidden="true"></div>

          <div class="sttpl-openingShell__top">
            <div class="sttpl-openingShell__brand">
              <span class="sttpl-openingShell__brandDot"></span>
              <span>ShiftTime Template Core</span>
            </div>
            <div class="sttpl-openingShell__phase">APPLY</div>
          </div>

          <div class="sttpl-openingShell__body">
            <div class="sttpl-openingShell__orbWrap" aria-hidden="true">
              <div class="sttpl-openingShell__orb">
                <div class="sttpl-openingShell__orbRing"></div>
                <div class="sttpl-openingShell__orbCore">
                  <strong>∞</strong>
                  <span>LOAD</span>
                </div>
                <i class="sttpl-openingShell__satellite sttpl-openingShell__satellite--a"></i>
                <i class="sttpl-openingShell__satellite sttpl-openingShell__satellite--b"></i>
                <i class="sttpl-openingShell__satellite sttpl-openingShell__satellite--c"></i>
              </div>
            </div>

            <div class="sttpl-openingShell__content">
              <div class="sttpl-openingShell__tabBadge">Режим: <b>${esc(note || 'GLOBAL / PAGE')}</b></div>
              <div class="sttpl-openingShell__title">${esc(title)}</div>
              <div class="sttpl-openingShell__text">Застосовую вибраний шаблон. Використовується та сама анімація, що й при першому відкритті галереї шаблонів.</div>

              <div class="sttpl-openingShell__pipeline" aria-label="Етапи застосування шаблону">
                <span class="is-done">Mode</span>
                <span class="is-active">Apply</span>
                <span>Runtime</span>
                <span>Persist</span>
                <span>Render</span>
              </div>

              <div class="sttpl-openingShell__chips">
                <span>Template core</span>
                <span>Header/Footer runtime</span>
                <span>DOM sync</span>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    view.appendChild(overlay);
    try { window.__ST_PERF_DIAG__?.push?.('templates-apply-opening-shell-show-00683', { note: String(note || ''), tab: activeTab || '', parent: 'templatesGalleryManagerView', reusedOpeningShell: true, originalOpeningSpeed: true, minusOneHalfSecond00683: true }, 'info'); } catch (_) {}
    return overlay;
  } catch (err) {
    try { console.warn('[00679][templates] show apply opening shell failed', err); } catch (_) {}
    return null;
  }
}

function hideTemplateApplyLoading00675_() {
  try { document.getElementById('stTplApplyLoadingOverlay00675')?.remove?.(); } catch (_) {}
  try { document.getElementById('stHeaderApplyModal')?.classList?.remove?.('is-loading-00675'); } catch (_) {}
}

function runApplyModeWithFeedback00675_(modal, pickBtn, mode, cb, closeFn) {
  // [00683][SHORTER BALANCED EXISTING OPENING-SHELL APPLY FEEDBACK]
  // User requirement:
  // 1) Do NOT invent a new apply animation. Reuse the same sttpl-openingShell animation
  //    used on the first gallery open; only the text changes.
  // 2) Click feedback must be a soft red glow, not a hard border/outline.
  // 3) The PAGE/GLOBAL modal must not blink/reappear while the heavy template apply runs.
  try {
    if (!modal) return;
    const allowed = ['page','global','add','replace'];
    const nextMode = allowed.includes(String(mode)) ? String(mode) : 'global';
    const seq = (Number(window.__ST_TPL_APPLY_LOADING_SEQ_00675__ || 0) + 1);
    window.__ST_TPL_APPLY_LOADING_SEQ_00675__ = seq;
    const startedAt00679 = (performance && performance.now) ? performance.now() : Date.now();
    // [00683] User asked to shorten the apply animation by about 1.5s for both
    // Header and Footer. The real removable delay in 00682 was the extra 900ms
    // pre-apply hold plus the 160ms show delay. Remove that hold, make the loader
    // appear faster, and keep only a short Footer minimum so it does not blink.
    const showDelayMs00683 = 80;
    const preApplyVisibleMs00683 = 0;
    const footerMinVisibleAfterApplyMs00683 = 650;
    const requestedMinusMs00683 = 1500;
    const log00679 = (event, detail = {}, level = 'info') => {
      try {
        window.__ST_PERF_DIAG__?.push?.(event, Object.assign({
          seq,
          mode: nextMode,
          tab: activeTab || '',
          modalVisible: !!(modal && modal.style && modal.style.display !== 'none'),
          modalVisibility: String(modal?.style?.visibility || ''),
          modalClass: String(modal?.className || ''),
          btnClass: String(pickBtn?.className || ''),
          btnMode: String(pickBtn?.dataset?.mode || '')
        }, detail || {}), level);
      } catch (_) {}
      try { console.warn('[00679][templates-apply]', event, Object.assign({ seq, mode: nextMode, tab: activeTab || '' }, detail || {})); } catch (_) {}
    };

    setApplyTargetModalActive00577_(modal, nextMode);
    modal.classList.remove('is-loading-00675');
    try { modal.style.visibility = ''; } catch (_) {}
    modal.querySelectorAll('.st-apply-mode-btn').forEach((b) => {
      try { b.classList.remove('is-clicked-00675', 'is-clicked-00678', 'is-clicked-00679'); } catch (_) {}
      try { b.style.removeProperty('box-shadow'); } catch (_) {}
      try { b.style.removeProperty('outline'); } catch (_) {}
      try { b.style.removeProperty('outline-offset'); } catch (_) {}
      try { b.style.removeProperty('transform'); } catch (_) {}
      try { b.style.removeProperty('filter'); } catch (_) {}
    });
    try { hideTemplateApplyLoading00675_(); } catch (_) {}

    try {
      pickBtn?.classList?.add?.('is-clicked-00675', 'is-clicked-00679');
      // Soft click glow only. No hard outline/border.
      pickBtn?.style?.setProperty?.('box-shadow', '0 0 22px rgba(239,68,68,.34), 0 10px 32px rgba(239,68,68,.24), 0 18px 46px rgba(15,23,42,.38)', 'important');
      pickBtn?.style?.setProperty?.('filter', 'drop-shadow(0 0 12px rgba(239,68,68,.30))', 'important');
      pickBtn?.style?.setProperty?.('transform', 'translateY(-1px) scale(.992)', 'important');
      pickBtn?.style?.removeProperty?.('outline');
      pickBtn?.style?.removeProperty?.('outline-offset');
      void pickBtn?.offsetHeight;
    } catch (_) {}

    let appliedStarted = false;
    let overlayShownAt = 0;
    let overlayShown = false;
    let finished = false;
    let closeDone = false;
    let loaderTimer = null;

    log00679('templates-apply-soft-click-feedback-00683', {
      hasCb: typeof cb === 'function',
      shadowInline: String(pickBtn?.style?.getPropertyValue?.('box-shadow') || ''),
      outlineInline: String(pickBtn?.style?.getPropertyValue?.('outline') || ''),
      overlayExistsBefore: !!document.getElementById('stTplApplyLoadingOverlay00675')
    });

    const clearClickFeedback = () => {
      try { pickBtn?.classList?.remove?.('is-clicked-00675', 'is-clicked-00678', 'is-clicked-00679'); } catch (_) {}
      try { pickBtn?.style?.removeProperty?.('box-shadow'); } catch (_) {}
      try { pickBtn?.style?.removeProperty?.('outline'); } catch (_) {}
      try { pickBtn?.style?.removeProperty?.('outline-offset'); } catch (_) {}
      try { pickBtn?.style?.removeProperty?.('transform'); } catch (_) {}
      try { pickBtn?.style?.removeProperty?.('filter'); } catch (_) {}
    };

    const safeClose = () => {
      if (closeDone) return;
      closeDone = true;
      log00679('templates-apply-close-modal-00679', {
        overlayExists: !!document.getElementById('stTplApplyLoadingOverlay00675'),
        elapsedMs: Math.round(((performance && performance.now) ? performance.now() : Date.now()) - startedAt00679)
      });
      try { modal.style.visibility = ''; } catch (_) {}
      try { if (typeof closeFn === 'function') closeFn(); } catch (_) {}
      clearClickFeedback();
    };

    const finish = () => {
      finished = true;
      const now = (performance && performance.now) ? performance.now() : Date.now();
      log00679('templates-apply-finish-request-00679', {
        overlayShown,
        overlayVisibleMs: overlayShown ? Math.round(now - overlayShownAt) : 0,
        applyStarted: appliedStarted,
        elapsedMs: Math.round(now - startedAt00679)
      });
      const closeThenHide = () => {
        // Close/hide the modal BEFORE removing overlay so PAGE/GLOBAL never flashes back.
        safeClose();
        try { hideTemplateApplyLoading00675_(); } catch (_) {}
        log00679('templates-apply-finished-00679', { overlayShown });
      };
      if (loaderTimer) {
        try { clearTimeout(loaderTimer); } catch (_) {}
        loaderTimer = null;
      }
      if (!overlayShown) {
        closeThenHide();
        return;
      }
      const visibleFor = ((performance && performance.now) ? performance.now() : Date.now()) - overlayShownAt;
      // [00683] Shorter timing for both Header and Footer. Header closes as soon
      // as the synchronous apply callback returns. Footer keeps only a small
      // minimum visible window so the existing openingShell does not flash.
      const isFooter00683 = String(activeTab || '').toLowerCase() === 'footer';
      const minVisible00683 = isFooter00683 ? footerMinVisibleAfterApplyMs00683 : 0;
      const rest00683 = Math.max(0, minVisible00683 - visibleFor);
      log00679('templates-apply-shorter-close-00683', {
        visibleForMs: Math.round(visibleFor),
        restMs: Math.round(rest00683),
        isFooter: isFooter00683,
        requestedMinusMs: requestedMinusMs00683,
        fromShowDelayMs00682: 160,
        toShowDelayMs: showDelayMs00683,
        fromPreApplyVisibleMs00682: 900,
        toPreApplyVisibleMs: preApplyVisibleMs00683,
        footerMinVisibleAfterApplyMs: footerMinVisibleAfterApplyMs00683
      });
      if (rest00683 > 0) {
        window.setTimeout(closeThenHide, rest00683);
      } else {
        closeThenHide();
      }
    };

    const runApply = () => {
      appliedStarted = true;
      const applyStart00679 = (performance && performance.now) ? performance.now() : Date.now();
      log00679('templates-apply-callback-start-00679', {
        overlayExists: !!document.getElementById('stTplApplyLoadingOverlay00675'),
        hasCb: typeof cb === 'function'
      });
      try {
        const result = (typeof cb === 'function') ? cb(nextMode) : null;
        const isPromise = !!(result && typeof result.then === 'function');
        log00679('templates-apply-callback-return-00679', {
          promise: isPromise,
          durationMs: Math.round((((performance && performance.now) ? performance.now() : Date.now()) - applyStart00679))
        });
        if (isPromise) {
          result.then(finish).catch((err) => {
            log00679('templates-apply-callback-async-error-00679', { message: String(err?.message || err || '') }, 'warn');
            try { console.warn('[00679][templates] async apply failed', err); } catch (_) {}
            finish();
          });
        } else {
          finish();
        }
      } catch (err) {
        log00679('templates-apply-callback-error-00679', { message: String(err?.message || err || '') }, 'warn');
        try { console.warn('[00679][templates] apply failed', err); } catch (_) {}
        finish();
      }
    };

    log00679('templates-apply-shorter-show-scheduled-00683', {
      fromDelayMs00682: 160,
      toDelayMs: showDelayMs00683,
      fromPreApplyVisibleMs00682: 900,
      toPreApplyVisibleMs: preApplyVisibleMs00683,
      requestedMinusMs: requestedMinusMs00683,
      footerMinVisibleAfterApplyMs: footerMinVisibleAfterApplyMs00683,
      sameTimingForHeaderFooter: true
    });
    loaderTimer = window.setTimeout(() => {
      if (seq !== Number(window.__ST_TPL_APPLY_LOADING_SEQ_00675__ || 0)) {
        log00679('templates-apply-loader-abort-stale-00679', { currentSeq: Number(window.__ST_TPL_APPLY_LOADING_SEQ_00675__ || 0) }, 'warn');
        return;
      }
      if (finished) {
        log00679('templates-apply-loader-abort-finished-00679', {}, 'warn');
        return;
      }
      let overlay = null;
      try {
        modal.classList.add('is-loading-00675');
        overlay = showTemplateApplyLoading00675_(nextMode.toUpperCase());
        overlayShown = !!overlay;
        overlayShownAt = (performance && performance.now) ? performance.now() : Date.now();
        // Keep layout/modal state alive, but hide it under the existing gallery opening shell.
        // This removes the PAGE/GLOBAL blink after apply.
        try { modal.style.visibility = 'hidden'; } catch (_) {}
        log00679('templates-apply-opening-shell-created-00683', {
          overlayShown,
          overlayId: String(overlay?.id || ''),
          overlayParentId: String(overlay?.parentElement?.id || ''),
          overlayClass: String(overlay?.className || ''),
          shellExists: !!overlay?.querySelector?.('.sttpl-openingShell'),
          reusedOpeningShell: true,
          originalOpeningSpeed: true, minusOneHalfSecond00683: true,
          computedDisplay: overlay ? String(getComputedStyle(overlay).display || '') : '',
          computedZ: overlay ? String(getComputedStyle(overlay).zIndex || '') : '',
          elapsedMs: Math.round((((performance && performance.now) ? performance.now() : Date.now()) - startedAt00679))
        }, overlayShown ? 'info' : 'warn');
      } catch (err) {
        log00679('templates-apply-loader-create-error-00679', { message: String(err?.message || err || '') }, 'warn');
      }
      // [00683] Do not add the 00682 medium pre-apply hold. Paint the existing
      // openingShell and start applying immediately after the paint frames.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const now00682 = (performance && performance.now) ? performance.now() : Date.now();
        const alreadyVisible00682 = overlayShown ? Math.max(0, now00682 - overlayShownAt) : 0;
        const hold00682 = overlayShown ? Math.max(0, preApplyVisibleMs00683 - alreadyVisible00682) : 0;
        log00679('templates-apply-preapply-hold-00683', {
          overlayShown,
          alreadyVisibleMs: Math.round(alreadyVisible00682),
          holdMs: Math.round(hold00682),
          targetVisibleBeforeApplyMs: preApplyVisibleMs00683
        });
        window.setTimeout(() => {
          if (seq !== Number(window.__ST_TPL_APPLY_LOADING_SEQ_00675__ || 0)) {
            log00679('templates-apply-preapply-abort-stale-00683', { currentSeq: Number(window.__ST_TPL_APPLY_LOADING_SEQ_00675__ || 0) }, 'warn');
            return;
          }
          runApply();
        }, hold00682);
      }));
    }, showDelayMs00683);
  } catch (err) {
    try { console.warn('[00679][templates] feedback apply setup failed', err); } catch (_) {}
    try { window.__ST_PERF_DIAG__?.push?.('templates-apply-setup-error-00679', { message: String(err?.message || err || '') }, 'warn'); } catch (_) {}
    try {
      const fallbackMode = ['page','global','add','replace'].includes(String(mode)) ? String(mode) : 'global';
      if (typeof cb === 'function') cb(fallbackMode);
    } catch (_) {}
    try { if (typeof closeFn === 'function') closeFn(); } catch (_) {}
  }
}

function setApplyTargetModalActive00577_(modal, mode) {
  if (!modal) return;
  const allowed = ['page','global','add','replace'];
  const next = allowed.includes(String(mode)) ? String(mode) : 'global';
  modal.__stApplyActiveMode00577 = next;
  modal.querySelectorAll('[data-act="pick-header-apply"][data-mode]').forEach((btn) => {
    const isActive = String(btn.getAttribute('data-mode') || '') === next;
    btn.classList.toggle('is-active', isActive);
    try { btn.setAttribute('aria-pressed', isActive ? 'true' : 'false'); } catch {}
    try { btn.tabIndex = isActive ? 0 : -1; } catch {}
  });
}

function triggerApplyTargetModalActive00577_(modal) {
  if (!modal || modal.style.display === 'none') return;
  const mode = ['page','global','add','replace'].includes(String(modal.__stApplyActiveMode00577)) ? String(modal.__stApplyActiveMode00577) : 'global';
  const btn = modal.querySelector(`[data-act="pick-header-apply"][data-mode="${mode}"]`);
  if (btn) btn.click();
}

function getOrCreateHeaderApplyModal() {
  ensureApplyTargetModalStyles00577_();
  let m = document.getElementById("stHeaderApplyModal");
  if (m) return m;

  m = document.createElement("div");
  m.id = "stHeaderApplyModal";
  m.style.cssText = `
    position:fixed; inset:0; z-index:100000;
    background:rgba(0,0,0,0.78);
backdrop-filter: blur(3px);
    display:none;
    align-items:center; justify-content:center;
    padding:18px;
  `;

  m.innerHTML = `
    <div style="
      width:min(420px, 92vw);
      border-radius:18px;
      border:1px solid rgba(255,255,255,0.16);
      background:rgba(10,16,26,0.96);
      box-shadow:0 20px 70px rgba(0,0,0,0.55);
      overflow:hidden;
    ">
      <div style="
        padding:14px 14px;
        border-bottom:1px solid rgba(255,255,255,0.10);
        display:flex; align-items:center; justify-content:space-between; gap:10px;
      ">
        <div style="font-weight:900; font-size:13px; opacity:.95;" data-role="st-apply-title">
          Як застосувати шапку?
        </div>
        <button data-act="close-header-apply" style="
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.16);
          background:rgba(255,255,255,0.04);
          color:inherit;
          cursor:pointer;
          padding:6px 10px;
        ">✕</button>
      </div>

      <div style="padding:14px; display:flex; gap:10px;">
        <button class="st-apply-mode-btn" data-act="pick-header-apply" data-mode="page" type="button" aria-pressed="false" style="
          flex:1;
          padding:12px 12px;
          border-radius:14px;
          border:1px solid rgba(239, 59, 59, 0.35);
          background:rgba(239,68,68,0.12);
          color:inherit;
          cursor:pointer;
          font-weight:900;
        ">PAGE</button>

        <button class="st-apply-mode-btn is-active" data-act="pick-header-apply" data-mode="global" type="button" aria-pressed="true" style="
          flex:1;
          padding:12px 12px;
          border-radius:14px;
          border:1px solid rgba(34,197,94,0.35);
          background:rgba(34,197,94,0.12);
          color:inherit;
          cursor:pointer;
          font-weight:900;
        ">GLOBAL</button>
      </div>

      <div class="st-apply-key-hint">
        <b>GLOBAL активний за замовчуванням.</b> Enter — підтвердити активну кнопку. ← / → — перемкнути PAGE / GLOBAL.
      </div>
    </div>
  `;

  m.addEventListener("click", (e) => {
    const pick = e.target.closest('[data-act="pick-header-apply"][data-mode]');
    if (pick) {
      const mode = ['page','global','add','replace'].includes(String(pick.dataset.mode))
        ? String(pick.dataset.mode)
        : 'global';
      setApplyTargetModalActive00577_(m, mode);
      return;
    }
    if (e.target === m) {
      m.style.display = "none";
      m.__onPick = null;
      return;
    }
    if (e.target.closest('[data-act="close-header-apply"]')) {
      m.style.display = "none";
      m.__onPick = null;
    }
  });

  if (!window.__stApplyTargetModalKeyBound00577) {
    window.__stApplyTargetModalKeyBound00577 = true;
    document.addEventListener('keydown', (ev) => {
      const modal = document.getElementById('stHeaderApplyModal');
      if (!modal || modal.style.display === 'none') return;
      const key = ev.key;
      if (key === 'Escape') {
        ev.preventDefault();
        ev.stopPropagation();
        modal.style.display = 'none';
        modal.__onPick = null;
        return;
      }
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        ev.preventDefault();
        ev.stopPropagation();
        const modes = Array.isArray(modal.__stApplyModes00577) ? modal.__stApplyModes00577 : ['page','global'];
        const cur = modes.includes(modal.__stApplyActiveMode00577) ? modal.__stApplyActiveMode00577 : modes[0];
        const next = modes[(modes.indexOf(cur) + 1) % modes.length];
        setApplyTargetModalActive00577_(modal, next);
        return;
      }
      if (key === 'Enter') {
        ev.preventDefault();
        ev.stopPropagation();
        triggerApplyTargetModalActive00577_(modal);
      }
    }, true);
  }

  document.body.appendChild(m);
  return m;
}

// =========================================================
// ✅ Footer Apply Modal (identical UX to Header)
// =========================================================
function openFooterApplyModal(onPickOrOpts, maybeTitle) {
  let onPick = onPickOrOpts;
  let title = maybeTitle;
  if (onPickOrOpts && typeof onPickOrOpts === 'object') {
    onPick = onPickOrOpts.onPick;
    title = onPickOrOpts.title;
  }
  openHeaderApplyModal({
    onPick,
    title: title || 'Як застосувати футер?',
  });
}


function setHeaderApplyModalTitle(title) {
  const modal = getOrCreateHeaderApplyModal();
  const el = modal?.querySelector?.('[data-role="st-apply-title"]');
  if (el) el.textContent = String(title || 'Як застосувати шапку?');
}

function closeHeaderApplyModal() {
  const modal = document.getElementById('stHeaderApplyModal');
  if (modal) modal.style.display = 'none';
  window.__ST_HEADER_APPLY_ON_PICK__ = null;
  if (modal) modal.__onPick = null;
  setHeaderApplyModalTitle('Як застосувати шапку?');
}

function openHeaderApplyModal(onPickOrOpts, maybeTitle) {
  let onPick = onPickOrOpts;
  let title = maybeTitle;
  let mainReplaceScope01000 = 'section';
  let commerceComponentApply01041 = false;
  if (onPickOrOpts && typeof onPickOrOpts === 'object') {
    onPick = onPickOrOpts.onPick;
    title = onPickOrOpts.title;
    mainReplaceScope01000 = String(onPickOrOpts.mainReplaceScope || 'section').toLowerCase() === 'main-area' ? 'main-area' : 'section';
    commerceComponentApply01041 = onPickOrOpts.commerceComponentApply01041 === true;
  }

  const modal = getOrCreateHeaderApplyModal();
  if (title) setHeaderApplyModalTitle(title);
  else setHeaderApplyModalTitle('Як застосувати шапку?');

  window.__ST_HEADER_APPLY_ON_PICK__ = (typeof onPick === 'function') ? onPick : null;
  // callback is read by click-handler via modal.__onPick
  modal.__onPick = (typeof onPick === 'function') ? onPick : null;
  const isMain = String(activeTab || '') === 'main';
  const isCommerce01041 = commerceComponentApply01041 && String(activeTab || '') === 'shop';
  const buttons = Array.from(modal.querySelectorAll('[data-act="pick-header-apply"][data-mode]'));
  if (buttons[0]) { buttons[0].dataset.mode = (isMain || isCommerce01041) ? 'replace' : 'page'; buttons[0].textContent = (isMain || isCommerce01041) ? 'ЗАМІНИТИ' : 'PAGE'; }
  if (buttons[1]) { buttons[1].dataset.mode = (isMain || isCommerce01041) ? 'add' : 'global'; buttons[1].textContent = (isMain || isCommerce01041) ? 'ДОДАТИ' : 'GLOBAL'; }
  const mainAreaReplace01000 = isMain && mainReplaceScope01000 === 'main-area';
  const mainSectionReplaceAvailable01000 = !!mainReplaceTargetId00952;
  const mainReplaceAvailable01000 = !isMain || mainAreaReplace01000 || mainSectionReplaceAvailable01000;
  const commerceReplaceAvailable01041 = !!commerceComponentReplaceTargetId01041;
  if (buttons[0]) {
    buttons[0].disabled = (isMain && !mainReplaceAvailable01000) || (isCommerce01041 && !commerceReplaceAvailable01041);
    buttons[0].title = isCommerce01041 && !commerceReplaceAvailable01041
      ? 'Щоб замінити, виберіть існуючу карточку товару перед відкриттям галереї.'
      : isMain && !mainReplaceAvailable01000
        ? 'Спочатку виберіть секцію Main на полотні, а потім відкрийте галерею.'
        : mainAreaReplace01000
          ? 'Замінити весь поточний Main цим шаблоном.'
          : '';
  }
  if (buttons[1]) buttons[1].disabled = isCommerce01041 && !commerceComponentInsertParentId01041;
  const hint = modal.querySelector('.st-apply-key-hint');
  if (hint) hint.innerHTML = isCommerce01041
    ? (commerceComponentInsertParentId01041
      ? (commerceComponentReplaceTargetId01041
        ? '<b>ДОДАТИ — вставляє карточку у вибраний контейнер. ЗАМІНИТИ — міняє тільки вибрану Product Card.</b> Enter — підтвердити.'
        : '<b>ДОДАТИ — вставляє карточку у вибраний контейнер.</b> Для ЗАМІНИТИ спочатку виберіть існуючу Product Card.')
      : '<b>ДОДАТИ недоступно:</b> закрийте галерею і виберіть контейнер або рівень Main.')
    : isMain
      ? (mainAreaReplace01000
        ? '<b>ЗАМІНИТИ — замінює весь поточний Main.</b> Enter — підтвердити. ← / → — перемкнути ДОДАТИ / ЗАМІНИТИ.'
        : mainReplaceTargetId00952
          ? '<b>ЗАМІНИТИ — замінює вибрану секцію Main.</b> Enter — підтвердити. ← / → — перемкнути ДОДАТИ / ЗАМІНИТИ.'
          : '<b>ЗАМІНИТИ недоступно:</b> закрийте галерею, виберіть секцію Main і відкрийте шаблони знову.')
      : '<b>GLOBAL активний за замовчуванням.</b> Enter — підтвердити активну кнопку. ← / → — перемкнути PAGE / GLOBAL.';
  modal.__stApplyModes00577 = (isMain || isCommerce01041) ? ['replace','add'] : ['page','global'];
  modal.style.display = 'flex';
  const defaultMode = (isMain || isCommerce01041) ? 'add' : 'global';
  setApplyTargetModalActive00577_(modal, defaultMode);
  requestAnimationFrame(() => {
    try { modal.querySelector(`[data-act="pick-header-apply"][data-mode="${defaultMode}"]`)?.focus?.({ preventScroll: true }); } catch {}
  });
}







// =========================================================
// [00890][TEMPLATE HOVER HELP CORE]
// Велика довідка через 3 секунди наведення на превʼю шаблону.
// Header, Footer і Main використовують той самий механізм підказок.
// =========================================================
const TEMPLATE_HELP_DELAY_MS = 3000;
const TEMPLATE_HELP_KINDS = new Set(['header', 'footer', 'main', 'shop', 'section-styles', 'sections', 'photo-gallery', 'menu', 'sidebar']);
let __stTplHelpTimer = null;
let __stTplHelpAnchor = null;
let __stTplHelpKind = null;
let __stTplHelpPlace = null;

function getTemplateKindLabel_(kind) {
  const k = String(kind || '').toLowerCase();
  if (k === 'header') return 'шапки';
  if (k === 'footer') return 'футера';
  if (k === 'main') return 'Content-шаблону';
  if (k === 'shop') return 'магазинного компонента';
  if (k === 'section-styles') return 'стилю секцій';
  if (k === 'sections') return 'секції';
  if (k === 'menu') return 'меню';
  if (k === 'sidebar') return 'меню сайтбара';
  return 'шаблону';
}

function getTemplateHelpContent_(kind, place) {
  const k = String(kind || '').toLowerCase();
  if (!TEMPLATE_HELP_KINDS.has(k)) return null;

  if (k === 'section-styles') {
    return {
      title: place === 'preview-window' ? 'КЕРУВАННЯ ПЕРЕГЛЯДОМ СТИЛЮ' : 'ЯК ОБРАТИ СТИЛЬ СЕКЦІЙ',
      badge: 'СТИЛІ СЕКЦІЙ · LIVE LINK 00954',
      html: `
        <div>Картка показує семантичний набір кольорів, типографіки, кнопок, меню, рамок, радіусів і тіней.</div>
        <div><b>Вибрати стиль</b> повертає його у блок Header, Main або Footer та одразу запускає Preview для всіх трьох областей.</div>
        <div>У режимі <b>Підтримувати синхронізацію</b> новий стиль головної області переходить лише на області з режимом «Головний стиль».</div>
        <div>Червона кнопка <b>Зберегти</b> виконує один Store-коміт. <b>Скасувати</b> точно повертає початковий стан.</div>
        <div><b>Текст, фотографії, структура та геометрія</b> не входять до стилю й не змінюються.</div>
      `
    };
  }

  if (k === 'header' || k === 'footer') {
    const label = getTemplateKindLabel_(k);
    const isHeader = k === 'header';
    const subject = isHeader ? 'ШАПКИ' : 'ФУТЕРА';
    const globalText = isHeader
      ? 'Глобал застосовує шапку для всього сайту. Вона буде однакова на всіх сторінках, поки для окремої сторінки не задано Page-варіант.'
      : 'Глобал застосовує футер для всього сайту. Він буде спільний для всіх сторінок, поки для окремої сторінки не задано Page-варіант.';
    const pageText = isHeader
      ? 'Page застосовує шапку тільки для поточної сторінки. Це потрібно, коли одна сторінка має відрізнятись від загальної шапки сайту.'
      : 'Page застосовує футер тільки для поточної сторінки. Це потрібно, коли одна сторінка має відрізнятись від загального футера сайту.';

    const title = place === 'preview-window'
      ? `КЕРУВАННЯ ПЕРЕГЛЯДОМ ${subject}`
      : `ЯК ПРАЦЮЄ ПРЕВʼЮ ${subject}`;

    return {
      title,
      badge: 'ПІДКАЗКА ДЛЯ КОРИСТУВАЧА',
      html: `
        <div>Наведи курсор на превʼю ${label}, щоб роздивитися шаблон. <b>Одинарний клік</b> тільки вибирає шаблон у галереї.</div>
        <div><b>Подвійний клік по превʼю</b> відкриває велике вікно перегляду. Подвійний клік у відкритому перегляді закриває його.</div>
        <div><b>Перегляд</b> у верхній панелі відкриває активний шаблон. <b>Застосувати</b> застосовує вибраний шаблон.</div>
        <div><b>Глобал:</b> ${globalText}</div>
        <div><b>Page:</b> ${pageText}</div>
        <div class="sttpl-helpPopup__keys">
          <div class="sttpl-helpPopup__key"><strong>↑ / ↓</strong>Змінити шаблон у відкритому перегляді.</div>
          <div class="sttpl-helpPopup__key"><strong>Колесо мишки</strong>Вгору — попередній, вниз — наступний шаблон.</div>
          <div class="sttpl-helpPopup__key"><strong>Enter</strong>Застосувати активний шаблон із вікна перегляду.</div>
          <div class="sttpl-helpPopup__key"><strong>ESC</strong>Закрити вікно перегляду або повернутись назад.</div>
        </div>
      `
    };
  }

  if (k === 'main' || k === 'sections') {
    const isMain = k === 'main';
    const label = isMain ? 'шаблону Маїн' : 'шаблону секції';
    const subject = isMain ? 'МАЇН' : 'СЕКЦІЙ';
    const title = place === 'preview-window'
      ? `КЕРУВАННЯ ПЕРЕГЛЯДОМ ${subject}`
      : `ЯК ПРАЦЮЄ ПРЕВʼЮ ${subject}`;

    return {
      title,
      badge: 'ПІДКАЗКА ДЛЯ КОРИСТУВАЧА',
      html: `
        <div>${isMain ? '<b>Одинарний клік по превʼю</b> одразу відкриває велике вікно перегляду — так само, як у шаблонів шапки та футера.' : 'Одинарний клік вибирає шаблон у галереї, а подвійний клік по превʼю відкриває велике вікно перегляду.'}</div>
        <div><b>Перегляд</b> у верхній панелі відкриває активний ${label} на весь екран. Вікно займає майже всю висоту браузера, щоб по можливості не було зайвого скролу.</div>
        <div><b>Стрілки ↑ / ↓ справа у шапці перегляду</b> і клавіші <b>ArrowUp / ArrowDown</b> перемикають шаблони без закриття вікна.</div>
        <div><b>Колесо мишки</b> перемикає шаблони, коли відкритий шаблон повністю поміщається у вікно. Якщо є внутрішній скрол — колесо прокручує сам шаблон.</div>
        <div><b>Для шаблону зі скролом:</b> ЛКМ відкриває наступний шаблон, ПКМ — попередній.</div>
        <div>${isMain ? '<b>Enter</b> або кнопка <b>Застосувати</b> відкриває ті самі кнопки <b>ДОДАТИ</b> і <b>ЗАМІНИТИ</b>. За замовчуванням активна дія <b>ДОДАТИ</b>.' : '<b>Enter</b> або кнопка <b>Застосувати</b> вставляє активний шаблон у робочу область конструктора.'}</div>
        <div><b>Подвійний клік</b> у відкритому перегляді закриває його. <b>ESC</b> повертає назад.</div>
        <div class="sttpl-helpPopup__keys">
          <div class="sttpl-helpPopup__key"><strong>↑ / ↓</strong>Перемкнути шаблон без закриття перегляду.</div>
          <div class="sttpl-helpPopup__key"><strong>Колесо</strong>Перемикання або внутрішня прокрутка шаблону.</div>
          <div class="sttpl-helpPopup__key"><strong>ЛКМ / ПКМ</strong>Для шаблону зі скролом: наступний / попередній.</div>
          <div class="sttpl-helpPopup__key"><strong>Enter</strong>${isMain ? 'Відкрити вибір ДОДАТИ / ЗАМІНИТИ.' : 'Застосувати відкритий шаблон.'}</div>
          <div class="sttpl-helpPopup__key"><strong>ESC</strong>Закрити підказку або вікно перегляду.</div>
        </div>
      `
    };
  }

  if (k === 'photo-gallery') {
    const title = place === 'preview-window'
      ? 'КЕРУВАННЯ ПЕРЕГЛЯДОМ ФОТОГАЛЕРЕЇ'
      : 'ЯК ПРАЦЮЄ ПРЕВʼЮ ФОТОГАЛЕРЕЇ';

    return {
      title,
      badge: 'ПІДКАЗКА ДЛЯ КОРИСТУВАЧА',
      html: `
        <div>Це шаблони секцій фотогалереї: сітка фото, Bento, Masonry, Random, меню категорій і preview-режими.</div>
        <div><b>Одинарний клік</b> вибирає шаблон у галереї. <b>Подвійний клік по превʼю</b> відкриває велике вікно перегляду.</div>
        <div><b>Перегляд</b> у верхній панелі відкриває активну фотогалерею майже на всю висоту екрана, щоб бачити її без зайвого скролу.</div>
        <div><b>Стрілки ↑ / ↓ справа у шапці перегляду</b> і клавіші <b>ArrowUp / ArrowDown</b> перемикають шаблони без закриття вікна.</div>
        <div><b>Колесо мишки</b> перемикає фотогалереї тільки коли відкрита фотогалерея повністю поміщається у вікно. Якщо зʼявився внутрішній скрол — колесо прокручує тільки її.</div>
        <div><b>Для фотогалереї зі скролом:</b> один клік лівою кнопкою миші по області шаблону відкриває наступну, правою кнопкою — попередню.</div>
        <div><b>Enter</b> або кнопка <b>Застосувати</b> вставляє відкриту фотогалерею в Content як окрему секцію.</div>
        <div><b>Скрол</b> зʼявляється тільки тоді, коли сама секція фотогалереї фізично вища за екран браузера.</div>
        <div class="sttpl-helpPopup__keys">
          <div class="sttpl-helpPopup__key"><strong>↑ / ↓</strong>Попередній або наступний шаблон фотогалереї.</div>
          <div class="sttpl-helpPopup__key"><strong>Колесо</strong>Перемикання без скролу. Якщо є скрол — прокрутка фотогалереї.</div>
          <div class="sttpl-helpPopup__key"><strong>ЛКМ / ПКМ</strong>Для фотогалереї зі скролом: наступна / попередня.</div>
          <div class="sttpl-helpPopup__key"><strong>Enter</strong>Застосувати відкриту фотогалерею.</div>
          <div class="sttpl-helpPopup__key"><strong>ESC</strong>Закрити підказку або перегляд.</div>
        </div>
      `
    };
  }

  if (k === 'menu' || k === 'sidebar') {
    const title = place === 'preview-window'
      ? 'КЕРУВАННЯ ПЕРЕГЛЯДОМ МЕНЮ'
      : 'ЯК ПРАЦЮЄ ПРЕВʼЮ МЕНЮ';
    return {
      title,
      badge: 'ПІДКАЗКА ДЛЯ КОРИСТУВАЧА',
      html: `
        <div><b>Шаблони меню</b> змінюють тільки дизайн вибраного меню. Назви пунктів, посилання та структура існуючого меню залишаються.</div>
        <div><b>Горизонтальні шаблони</b> лежать у папці меню шапки. <b>Вертикальні шаблони</b> лежать у папці сайтбара.</div>
        <div><b>Одинарний клік</b> вибирає дизайн. <b>Подвійний клік</b> відкриває велике вікно перегляду.</div>
        <div><b>Застосувати</b> переносить стиль вибраного шаблону на активне меню на полотні.</div>
        <div><b>Заливка</b> редагує фон і рамку самого блока меню. Кнопки/пункти меню редагуються окремо через віджет “Меню”, щоб дані та дизайн не змішувались.</div>
        <div class="sttpl-helpPopup__keys">
          <div class="sttpl-helpPopup__key"><strong>↑ / ↓</strong>Перемкнути дизайн меню у preview.</div>
          <div class="sttpl-helpPopup__key"><strong>Колесо</strong>Перемикання або прокрутка, якщо шаблон має скрол.</div>
          <div class="sttpl-helpPopup__key"><strong>Enter</strong>Застосувати дизайн до вибраного меню.</div>
          <div class="sttpl-helpPopup__key"><strong>ESC</strong>Закрити підказку або preview.</div>
        </div>
      `
    };
  }

  return null;
}

function ensureTemplateHelpPopup_() {
  let popup = document.getElementById('sttplHelpPopup');
  if (popup) return popup;
  popup = document.createElement('div');
  popup.id = 'sttplHelpPopup';
  popup.className = 'sttpl-helpPopup';
  popup.setAttribute('role', 'tooltip');
  document.body.appendChild(popup);
  return popup;
}

function hideTemplateHelpPopup_() {
  if (__stTplHelpTimer) {
    clearTimeout(__stTplHelpTimer);
    __stTplHelpTimer = null;
  }
  __stTplHelpAnchor = null;
  __stTplHelpKind = null;
  __stTplHelpPlace = null;
  const popup = document.getElementById('sttplHelpPopup');
  if (popup) {
    popup.classList.remove('is-open');
    popup.style.display = 'none';
  }
}

function positionTemplateHelpPopup_(popup, anchor) {
  if (!popup || !anchor || !anchor.getBoundingClientRect) return;
  const rect = anchor.getBoundingClientRect();
  const margin = 14;
  const vw = window.innerWidth || document.documentElement.clientWidth || 1200;
  const vh = window.innerHeight || document.documentElement.clientHeight || 800;
  popup.style.display = 'block';

  const width = Math.min(760, Math.max(320, vw - 32));
  popup.style.width = `${width}px`;
  const measuredH = Math.min(popup.offsetHeight || 420, Math.max(260, vh - 32));

  let left = rect.left;
  if (left + width + margin > vw) left = vw - width - margin;
  if (left < margin) left = margin;

  let top = rect.bottom + margin;
  if (top + measuredH + margin > vh) top = Math.max(margin, rect.top - measuredH - margin);
  if (top < margin) top = margin;

  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(top)}px`;
}

function showTemplateHelpPopup_(anchor, kind, place) {
  const content = getTemplateHelpContent_(kind, place);
  if (!content || !anchor) return;
  const popup = ensureTemplateHelpPopup_();
  popup.innerHTML = `
    <div class="sttpl-helpPopup__badge">${content.badge}</div>
    <div class="sttpl-helpPopup__title">${content.title}</div>
    <div class="sttpl-helpPopup__text">${content.html}</div>
  `;
  popup.classList.add('is-open');
  positionTemplateHelpPopup_(popup, anchor);
}

function scheduleTemplateHelpPopup_(anchor, kind, place) {
  const k = String(kind || '').toLowerCase();
  if (!TEMPLATE_HELP_KINDS.has(k)) return;
  if (__stTplHelpTimer) clearTimeout(__stTplHelpTimer);
  __stTplHelpAnchor = anchor;
  __stTplHelpKind = k;
  __stTplHelpPlace = place || 'gallery-card';
  __stTplHelpTimer = setTimeout(() => {
    __stTplHelpTimer = null;
    if (!__stTplHelpAnchor || !document.body.contains(__stTplHelpAnchor)) return;
    showTemplateHelpPopup_(__stTplHelpAnchor, __stTplHelpKind, __stTplHelpPlace);
  }, TEMPLATE_HELP_DELAY_MS);
}

function bindTemplateHoverHelpOnce_() {
  if (window.__stTplHoverHelpBound) return;
  window.__stTplHoverHelpBound = true;

  document.addEventListener('mouseover', (e) => {
    const target = e.target?.closest?.('[data-sttpl-help-target="template-preview"]');
    if (!target) return;
    const view = document.getElementById('templatesGalleryManagerView');
    if (!view || view.style.display === 'none' || !view.contains(target)) return;
    const kind = target.getAttribute('data-sttpl-help-kind') || activeTab;
    const place = target.getAttribute('data-sttpl-help-place') || 'gallery-card';
    scheduleTemplateHelpPopup_(target, kind, place);
  }, true);

  document.addEventListener('mouseout', (e) => {
    const target = e.target?.closest?.('[data-sttpl-help-target="template-preview"]');
    if (!target) return;
    const next = e.relatedTarget;
    if (next && target.contains(next)) return;
    hideTemplateHelpPopup_();
  }, true);

  window.addEventListener('scroll', hideTemplateHelpPopup_, true);
  window.addEventListener('resize', hideTemplateHelpPopup_);
}

// =========================================================
// [00890][TEMPLATE PREVIEW NAVIGATION CORE]
// Спільна логіка для навігації у fullscreen preview.
// Header, Footer і Main використовують один preview-контракт:
// відкриття, стрілки, колесо, підказка, Enter і застосування.
// =========================================================
const PREVIEW_NAV_TABS = new Set(['header', 'footer', 'main', 'shop', 'section-styles', 'sections', 'photo-gallery', 'menu', 'sidebar']);
const TEMPLATE_PREVIEW_DBLCLICK_FALLBACK_MS = 520;
let __stTplPreviewClickFallback = { id: null, tab: null, time: 0, openedId: null, openedAt: 0 };

function isPreviewNavigationTab_() {
  return PREVIEW_NAV_TABS.has(String(activeTab || ''));
}

function getPreviewNavigationIds_() {
  if (!isPreviewNavigationTab_()) return [];

  // [00381] Навігація preview не повинна залежати тільки від localStorage.
  // Для системних шаблонів (особливо Меню/Content/Sections) беремо той самий
  // runtime-fallback список, який реально показує галерея. Інакше у preview
  // стрілки/колесо можуть не працювати, якщо LS ще не містить шаблонів.
  let st = null;
  try { st = loadTemplatesStore(); } catch { st = { items: [] }; }
  const all = getTemplatesForTabIncludingSystem_(st || { items: [] }, activeTab);
  const byId = new Map((all || []).filter(Boolean).map((tpl) => [tpl.id, tpl]));

  const visible = Array.isArray(__lastVisibleTemplateIds) ? __lastVisibleTemplateIds : [];
  const ids = visible.filter((id) => {
    const tpl = byId.get(id);
    return !!(tpl && String(tpl.type || '') === String(activeTab || ''));
  });

  return ids.length ? ids : (all || [])
    .filter(t => t && String(t.type || '') === String(activeTab || ''))
    .map(t => t.id)
    .filter(Boolean);
}

function navigateTemplatePreview_(dir) {
  if (!isPreviewNavigationTab_()) return false;
  const ids = getPreviewNavigationIds_();
  if (!ids.length) return false;

  const currentId = selectedTemplateId || getTemplatePreviewCurrentId();
  let idx = ids.indexOf(currentId);
  if (idx < 0) idx = dir > 0 ? -1 : 0;

  const nextIdx = (idx + (dir < 0 ? -1 : 1) + ids.length) % ids.length;
  const nextId = ids[nextIdx];
  if (!nextId) return false;

  selectedTemplateId = nextId;
  const view = document.getElementById('templatesGalleryManagerView');
  if (view && view.style.display !== 'none') {
    try { render(view); } catch (err) { console.warn('[templates-gallery] preview nav render failed:', err); }
  }

  requestAnimationFrame(() => previewTemplateById_(nextId));
  return true;
}

function applySelectedTemplateFromPreview_() {
  if (!isPreviewNavigationTab_()) return false;

  // [00448][PREVIEW ENTER APPLY FIX]
  // 00446 зробив click по preview шапки/футера миттєвим і без render(view).
  // Через це верхня кнопка "Застосувати" могла лишитися disabled у старому DOM:
  // selectedTemplateId уже встановлений, preview відкритий, але proxy-click по
  // disabled button нічого не робив. Візуально Enter просто закривав preview.
  // Тому беремо id саме з preview/current state, фіксуємо selectedTemplateId,
  // примусово прибираємо stale disabled з apply-кнопки і тільки тоді запускаємо
  // той самий apply-selected path, який показує Global/Page для Header/Footer.
  const currentId = getTemplatePreviewCurrentId() || selectedTemplateId;
  if (!currentId) return false;
  selectedTemplateId = currentId;

  try {
    window.__ST_PERF_DIAG__?.push?.('templates-preview-enter-apply-00448', {
      id: currentId,
      tab: activeTab || '',
      hadPreview: true
    }, 'info');
  } catch (_e) {}

  try { closeTemplatePreview(); } catch {}

  requestAnimationFrame(() => {
    const view = document.getElementById('templatesGalleryManagerView');
    if (!view || view.style.display === 'none') return;

    const applyBtn = view.querySelector('[data-act="apply-selected"], [data-action="apply-selected"]');
    if (!applyBtn) {
      try {
        window.__ST_PERF_DIAG__?.push?.('templates-preview-enter-apply-no-button-00448', {
          id: currentId, tab: activeTab || ''
        }, 'warn');
      } catch (_e) {}
      return;
    }

    // Stale disabled після миттєвого preview-click — головна причина, чому Enter
    // не доходив до модалки Page/Global для футера/шапки.
    try { applyBtn.disabled = false; } catch (_e) {}
    try { applyBtn.removeAttribute('disabled'); } catch (_e) {}

    try {
      window.__ST_PERF_DIAG__?.push?.('templates-preview-enter-click-apply-button-00448', {
        id: currentId,
        tab: activeTab || '',
        selectedTemplateId,
        disabledAfterFix: !!applyBtn.disabled
      }, 'info');
    } catch (_e) {}

    applyBtn.click();
  });
  return true;
}

// =========================================================
// [TEMPLATES][PREVIEW BY DOUBLE CLICK]
// Одинарний клік по картці = тільки активувати/виділити.
// Подвійний клік по картці або ескізу = відкрити/закрити перегляд.
// Кнопка "Перегляд" продовжує працювати одним кліком.
// =========================================================
function previewTemplateById_(id) {
  if (!id) return false;
  selectedTemplateId = id;
  const tpl = getTemplateById(id);
  if (!tpl) return false;

  const visualHtml = getTemplateVisualHtml_(tpl);
  const enablePreviewNav = isPreviewNavigationTab_() && String(tpl.type || '') === String(activeTab || '');

  try {
    openTemplatePreview({
      id: tpl.id,
      title: tpl.name ? `Перегляд: ${tpl.name}` : 'Перегляд шаблону',
      name: tpl.name,
      html: visualHtml,
      type: tpl.type,
      kind: activeTab,
      navEnabled: enablePreviewNav,
      dblClickToClose: enablePreviewNav,
      helpKind: enablePreviewNav ? activeTab : null,
      onPrev: enablePreviewNav ? () => navigateTemplatePreview_(-1) : null,
      onNext: enablePreviewNav ? () => navigateTemplatePreview_(1) : null,
      onApply: enablePreviewNav ? () => applySelectedTemplateFromPreview_() : null,
    });
  } catch (err) {
    console.warn('[templates-gallery] preview error:', err);
    fallbackFullscreenPreview({ name: tpl.name, html: visualHtml });
  }
  return true;
}

function handleTemplatesGalleryManagerDblClick(e) {
  const view = document.getElementById('templatesGalleryManagerView');
  if (!view || view.style.display === 'none') return;

  // Не відкриваємо preview подвійним кліком по службових кнопках/checkbox-ах.
  if (e.target.closest('button,input,label,.sttpl-card__actionsRow,.sttpl-roundCheck,.sttpl-thumbBtn')) return;

  const card = e.target.closest('.sttpl-card[data-tpl-id], .sttpl-pageThumb[data-tpl-id]');
  if (!card || !view.contains(card)) return;

  const id = card.dataset.tplId || card.getAttribute('data-tpl-id') || null;
  if (!id) return;

  e.preventDefault();
  e.stopPropagation();

  // [00367] Якщо preview уже відкрив fallback із click-detail/manual timing,
  // нативний dblclick може прилетіти одразу після цього і випадково закрити вікно.
  // Тому такий дубль ігноруємо.
  const now = Date.now();
  const justOpenedByFallback = __stTplPreviewClickFallback?.openedId === id
    && (now - Number(__stTplPreviewClickFallback?.openedAt || 0)) < 450;
  if (justOpenedByFallback) return;

  // [00890] Header/Footer/Main: double click toggles preview.
  // 1-й подвійний клік = "Перегляд", наступний подвійний клік = "Закрити".
  if (isPreviewNavigationTab_() && isTemplatePreviewOpen() && getTemplatePreviewCurrentId() === id) {
    try { closeTemplatePreview(); } catch {}
    return;
  }

  selectedTemplateId = id;
  // [00445][FAST DOUBLE CLICK PREVIEW]
  // Do not re-render the whole gallery before opening preview: the first click
  // may already have re-rendered the card, and another render here makes some
  // header/footer previews feel like they need many double clicks.
  previewTemplateById_(id);
}


// =========================================================
// [00380][MENU DESIGN APPLY]
// Застосування шаблону дизайну меню до ВЖЕ вибраного меню.
// Дані користувача (назви пунктів, href, data-menu-items) зберігаються.
// =========================================================
const ST_MENU_TEMPLATE_TARGET_HINT_LS = 'st_menu_selected_hint_v1';

function stTplMenuSelector_() {
  return '.st-block--menu,[data-st-menu="1"],[data-block-kind="menu"],.hb-elem[data-block-kind="menu"]';
}

function stTplCssEscape_(value) {
  try {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
  } catch {}
  return String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function stTplHtmlEscape_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stTplMenuFromElement_(el) {
  if (!(el instanceof HTMLElement)) return null;
  if (el.matches(stTplMenuSelector_())) return el;
  return el.closest?.(stTplMenuSelector_()) || null;
}

function stTplFindSelectedMenuBlock_() {
  // 0) Hint із віджета "Шаблони → Меню" — потрібен, якщо overlay забрав focus.
  try {
    const hint = JSON.parse(localStorage.getItem(ST_MENU_TEMPLATE_TARGET_HINT_LS) || 'null');
    const did = String(hint?.designTargetId || '').trim();
    if (did) {
      const byDid = document.querySelector(`[data-menu-design-target-id="${stTplCssEscape_(did)}"]`);
      const menu = stTplMenuFromElement_(byDid);
      if (menu) return menu;
    }
    const id = String(hint?.id || '').trim();
    if (id) {
      const byId = document.getElementById(id);
      const menu = stTplMenuFromElement_(byId);
      if (menu) return menu;
    }
  } catch {}

  // 1) Єдине джерело selection.
  try {
    const sel = window.ST_SELECTION?.get?.() || null;
    const els = Array.isArray(sel?.elements) ? sel.elements : [];
    for (const el of els) {
      const menu = stTplMenuFromElement_(el);
      if (menu) return menu;
    }
  } catch {}

  // 2) Фактична підсвітка на canvas/header/footer.
  const roots = [
    document.getElementById('st-site-header-slot'),
    document.getElementById('st-site-footer-slot'),
    getSiteRoot(),
    document.querySelector('.canvas__scroll'),
    document.body
  ].filter(Boolean);

  for (const root of roots) {
    const selected = root.querySelector?.(`${stTplMenuSelector_()}.is-active, ${stTplMenuSelector_()}.is-selected, ${stTplMenuSelector_()}.hb-dom-active, ${stTplMenuSelector_()}.hb-dom-selected`);
    if (selected) return selected;
    const inner = root.querySelector?.('.is-active, .is-selected, .hb-dom-active, .hb-dom-selected');
    const menu = stTplMenuFromElement_(inner);
    if (menu) return menu;
  }
  return null;
}

function stTplParseJsonSafe_(raw, fallback = null) {
  try { return JSON.parse(String(raw || '')); } catch { return fallback; }
}

function stTplCaptureMenuItems_(menu) {
  const raw = menu?.getAttribute?.('data-menu-items') || menu?.dataset?.menuItems || '';
  const parsed = stTplParseJsonSafe_(raw, null);
  if (Array.isArray(parsed) && parsed.length) return parsed;

  const list = [];
  try {
    const links = Array.from(menu.querySelectorAll('.st-menu__link, a[href], button'))
      .filter((link) => {
        const li = link.closest('li');
        return !li || li.parentElement?.matches?.('.st-menu__list, ul, ol');
      });
    for (const link of links) {
      const text = (link.querySelector?.('.st-menu__text')?.textContent || link.textContent || '').trim();
      if (!text) continue;
      list.push({
        text,
        label: text,
        title: text,
        href: link.getAttribute?.('href') || '#'
      });
    }
  } catch {}
  return list.length ? list : [
    { text: 'Головна', href: '/' },
    { text: 'Каталог', href: '/catalog' },
    { text: 'Послуги', href: '/services' },
    { text: 'Про нас', href: '/about' },
    { text: 'Блог', href: '/blog' },
    { text: 'Контакти', href: '/contacts' }
  ];
}

function stTplNormalizeMenuItemsJson_(items) {
  const safe = Array.isArray(items) ? items : [];
  return JSON.stringify(safe.map((it, idx) => {
    if (typeof it === 'string') return { text: it, label: it, href: idx === 0 ? '/' : '#' };
    const text = String(it?.text || it?.label || it?.title || `Пункт ${idx + 1}`);
    return { ...it, text, label: it?.label || text, href: it?.href || it?.url || '#' };
  }));
}

function stTplBuildMenuItemsHtml_(items, sampleLi, sampleLink) {
  const liClass = sampleLi?.className || 'st-menu__item';
  const liStyle = sampleLi?.getAttribute?.('style') || '';
  const linkClass = sampleLink?.className || 'st-menu__link';
  const linkStyle = sampleLink?.getAttribute?.('style') || '';
  return (Array.isArray(items) ? items : []).map((it, idx) => {
    const text = String(it?.text || it?.label || it?.title || `Пункт ${idx + 1}`);
    const href = String(it?.href || it?.url || '#');
    return `<li class="${stTplHtmlEscape_(liClass)}" data-st-menu-item="1" style="${stTplHtmlEscape_(liStyle)}"><a class="${stTplHtmlEscape_(linkClass)}" href="${stTplHtmlEscape_(href)}" data-st-menu-link="1" style="${stTplHtmlEscape_(linkStyle)}"><span class="st-menu__text">${stTplHtmlEscape_(text)}</span></a></li>`;
  }).join('');
}

function stTplCopyMenuDesignAttributes_(source, target, preservedItemsJson) {
  if (!source || !target) return;

  // Прибираємо старі design data-menu-* атрибути, але не чіпаємо службовий target id.
  for (const attr of Array.from(target.attributes || [])) {
    const n = attr.name || '';
    if (n.startsWith('data-menu-') && n !== 'data-menu-design-target-id') {
      try { target.removeAttribute(n); } catch {}
    }
  }

  // Копіюємо style/design атрибути з шаблону. data-menu-items повернемо нижче.
  for (const attr of Array.from(source.attributes || [])) {
    const n = attr.name || '';
    if (n === 'id') continue;
    if (n === 'class') continue;
    if (n === 'data-menu-items') continue;
    if (n.startsWith('data-menu-') || n === 'data-st-menu' || n === 'data-block-kind' || n === 'data-name') {
      try { target.setAttribute(n, attr.value); } catch {}
    }
  }

  target.setAttribute('data-st-menu', '1');
  target.setAttribute('data-block-kind', 'menu');
  target.setAttribute('data-menu-items', preservedItemsJson);
}

function stTplApplyMenuDesignTemplateToSelected_(tpl) {
  const target = stTplFindSelectedMenuBlock_();
  if (!target) return { ok: false, reason: 'no-selected-menu' };

  const holder = document.createElement('div');
  holder.innerHTML = String(tpl?.html || tpl?.previewHtml || '');
  const source = holder.querySelector(stTplMenuSelector_()) || holder.firstElementChild;
  if (!(source instanceof HTMLElement)) return { ok: false, reason: 'bad-template' };

  const items = stTplCaptureMenuItems_(target);
  const itemsJson = stTplNormalizeMenuItemsJson_(items);
  const designTargetId = target.getAttribute('data-menu-design-target-id') || `menu_target_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const targetId = target.id || '';
  const keepSelected = target.classList.contains('is-selected') || target.classList.contains('is-active') || true;

  // Root class/style з шаблону, але службову ідентичність меню лишаємо.
  try {
    const oldExtra = Array.from(target.classList || []).filter(c => /^is-|^hb-dom-/.test(c));
    target.className = source.className || target.className || 'hb-elem st-block st-block--menu';
    target.classList.add('st-block--menu');
    oldExtra.forEach(c => target.classList.add(c));
    if (keepSelected) target.classList.add('is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active');
    target.style.cssText = source.getAttribute('style') || target.style.cssText || '';
    if (targetId) target.id = targetId;
    target.setAttribute('data-menu-design-target-id', designTargetId);
  } catch {}

  stTplCopyMenuDesignAttributes_(source, target, itemsJson);

  const srcNav = source.querySelector('.st-menu') || source.querySelector('nav') || null;
  const srcList = source.querySelector('.st-menu__list') || source.querySelector('ul,ol') || null;
  const srcLi = srcList?.querySelector?.(':scope > li') || srcList?.querySelector?.('li') || null;
  const srcLink = srcLi?.querySelector?.('.st-menu__link, a, button') || source.querySelector('.st-menu__link, a, button') || null;

  let nav = target.querySelector(':scope > .st-menu, :scope > nav.st-menu') || target.querySelector('.st-menu, nav');
  if (!nav && srcNav) {
    nav = srcNav.cloneNode(false);
    target.innerHTML = '';
    target.appendChild(nav);
  }
  if (nav && srcNav) {
    nav.className = srcNav.className || nav.className;
    nav.style.cssText = srcNav.getAttribute('style') || '';
  }

  let list = nav?.querySelector?.(':scope > .st-menu__list, :scope > ul, :scope > ol') || target.querySelector('.st-menu__list, ul, ol');
  if (!list && nav && srcList) {
    list = srcList.cloneNode(false);
    nav.appendChild(list);
  }
  if (list && srcList) {
    list.className = srcList.className || list.className || 'st-menu__list';
    list.style.cssText = srcList.getAttribute('style') || '';
  }

  if (!list) {
    target.innerHTML = source.innerHTML;
    list = target.querySelector('.st-menu__list, ul, ol');
  }

  if (list) {
    const existingTopItems = Array.from(list.children || []).filter(el => el instanceof HTMLElement && el.matches('li, .st-menu__item'));
    if (!existingTopItems.length) {
      list.innerHTML = stTplBuildMenuItemsHtml_(items, srcLi, srcLink);
    } else {
      existingTopItems.forEach((li) => {
        if (srcLi) {
          li.className = srcLi.className || li.className || 'st-menu__item';
          li.style.cssText = srcLi.getAttribute('style') || li.style.cssText || '';
          li.setAttribute('data-st-menu-item', '1');
        }
        const link = li.querySelector('.st-menu__link, a, button');
        if (link && srcLink) {
          link.className = srcLink.className || link.className || 'st-menu__link';
          link.style.cssText = srcLink.getAttribute('style') || link.style.cssText || '';
          link.setAttribute('data-st-menu-link', '1');
          link.style.whiteSpace = link.style.whiteSpace || 'nowrap';
        }
      });
    }
  }

  // Повертаємо текст/href відповідно до збережених даних, якщо кількість пунктів збігається або більша.
  try {
    const links = Array.from(target.querySelectorAll('.st-menu__link, a, button'));
    links.forEach((link, idx) => {
      const it = items[idx];
      if (!it) return;
      const text = String(it.text || it.label || it.title || '').trim();
      if (text) {
        const span = link.querySelector('.st-menu__text');
        if (span) span.textContent = text;
        else link.textContent = text;
      }
      const href = String(it.href || it.url || '').trim();
      if (href && link.tagName === 'A') link.setAttribute('href', href);
    });
  } catch {}

  try { window.ST_SELECTION?.setSingle?.(target, { type: 'block' }); } catch {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: 'menu-design-template-apply', templateId: tpl?.id || null } })); } catch {}
  try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { type: 'block', elements: [target] } })); } catch {}
  try { window.dispatchEvent(new CustomEvent('st:templates-menu-design-applied', { detail: { templateId: tpl?.id || null } })); } catch {}
  return { ok: true, target };
}

// =========================================================
// CLICK handler
// =========================================================
export function handleTemplatesGalleryManagerClick(e) {
  // =========================================================
  // [SITE FILTER] UI actions
  // =========================================================
  const filterToggle = e.target.closest('[data-action="site-filter-toggle"]');
  if (filterToggle) {
    __siteFilterOpen = !__siteFilterOpen;
    const v = document.getElementById('templatesGalleryManagerView');
    if (v) render(v);
    return;
  }

  const filterClear = e.target.closest('[data-action="site-filter-clear"]');
  if (filterClear) {
    saveSiteFilterCats_([]);
    __siteFilterOpen = false;
    const v = document.getElementById('templatesGalleryManagerView');
    if (v) render(v);
    return;
  }

  const catCb = e.target.closest('input[data-site-filter-cat]');
  if (catCb) {
    const id = String(catCb.value || '').trim();
    const cur = loadSiteFilterCats_();
    const set = new Set(cur);
    if (catCb.checked) set.add(id); else set.delete(id);
    saveSiteFilterCats_(Array.from(set));
    __siteFilterOpen = true; // лишаємо відкритим
    const v = document.getElementById('templatesGalleryManagerView');
    if (v) render(v);
    return;
  }

  const expBtn = e.target.closest('[data-act="export-templates"]');
  if (expBtn) {
    exportTemplatesForActiveTab_();
    return;
  }

  const impBtn = e.target.closest('[data-act="import-templates"]');
  if (impBtn) {
    pickAndImportTemplatesForActiveTab_();
    return;
  }


  const view = document.getElementById("templatesGalleryManagerView");
  if (!view || view.style.display === "none") return;


  // ✅ pick mode in header/footer apply modal
  const headerModal = document.getElementById("stHeaderApplyModal");
  if (headerModal && headerModal.style.display !== "none") {
    const pickBtn = e.target.closest('[data-act="pick-header-apply"]');
    if (pickBtn) {
      e.preventDefault();
      e.stopPropagation();
      const mode = ["page","global","add","replace"].includes(String(pickBtn.dataset.mode)) ? String(pickBtn.dataset.mode) : "global";
      const cb = headerModal.__onPick;
      if (window.__ST_TPL_DEBUG__) {
        console.log('[TPL][apply-modal] pick', { mode, hasCb: typeof cb === 'function', clickFeedback00679: true, reuseOpeningShell00679: true });
      }
      runApplyModeWithFeedback00675_(headerModal, pickBtn, mode, cb, closeHeaderApplyModal);
      return;
    }
  }

  // ✅ pick mode in footer apply modal
  const footerModal = document.getElementById("stFooterApplyModal");
  if (footerModal && footerModal.style.display !== "none") {
    const pickBtn = e.target.closest('[data-act="pick-footer-apply"]');
    if (pickBtn) {
      const mode = ["page","global","add","replace"].includes(String(pickBtn.dataset.mode)) ? String(pickBtn.dataset.mode) : "global";
      const cb = footerModal.__onPick;
      if (typeof cb === "function") cb(mode);
      closeFooterApplyModal();
      return;
    }
  }




  // ---------------------------------------------------------
  // ✅ 0) Круглий checkbox ловимо першим.
  // Так клік по самому кружечку/label/span не відкриває preview і не губить мультивибір.
  // ---------------------------------------------------------
  const checkWrapFirst = e.target.closest('.sttpl-roundCheck[data-tpl-id]');
  if (checkWrapFirst && view.contains(checkWrapFirst)) {
    e.preventDefault();
    e.stopPropagation();

    const id = checkWrapFirst.dataset.tplId || null;
    if (!id) return;

    if (selectedTemplateIds.has(id)) selectedTemplateIds.delete(id);
    else selectedTemplateIds.add(id);

    // checkbox-клік також робить шаблон останнім активним,
    // але не скидає інші checkbox-вибори.
    selectedTemplateId = id;
    render(view);
    return;
  }

  // ---------------------------------------------------------
  // ✅ 0.5) [00890] Клік прямо по preview шапки/футера/Main = одразу перегляд.
  // Раніше перший клік виділяв картку і робив render(), через що нативний
  // dblclick іноді губився на новому DOM і здавалось, що треба клікати 10 разів.
  // Службові кнопки/checkbox/label не чіпаємо.
  // ---------------------------------------------------------
  try {
    const previewHit = e.target.closest?.('.sttpl-card__preview');
    const previewCard = previewHit ? e.target.closest?.('.sttpl-card[data-tpl-id]') : null;
    const tab = String(activeTab || '').toLowerCase();
    const isFrameTemplatePreviewClick = !!(previewHit && previewCard && view.contains(previewCard) && (tab === 'header' || tab === 'footer' || tab === 'main'));
    if (isFrameTemplatePreviewClick && !e.target.closest('button,input,label,.sttpl-card__actionsRow,.sttpl-roundCheck,.sttpl-thumbBtn,.sttpl-infoBtn')) {
      const id = previewCard.dataset.tplId || previewCard.getAttribute('data-tpl-id') || null;
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        selectedTemplateId = id;
        try { window.__ST_PERF_DIAG__?.push?.('templates-preview-open-from-preview-click-00446', { id, tab }, 'info'); } catch(_e) {}
        previewTemplateById_(id);
        return;
      }
    }
  } catch(_e) {}

  // ---------------------------------------------------------
  // ✅ 1) Спочатку ловимо data-action (бо у тебе кнопка Перегляд з data-action)
  // ---------------------------------------------------------
  const actionBtn = e.target.closest("[data-action]");
  if (actionBtn) {
    const action = actionBtn.dataset.action;

    // [TEMPLATES][PREVIEW] Перегляд
    if (action === "preview-template") {
      // якщо нема вибору — нічого не робимо
      if (!selectedTemplateId) return;

      const tpl = getTemplateById(selectedTemplateId);
      if (!tpl) return;

      previewTemplateById_(tpl.id);
      return;
    }

    // ✅ Хедерні кнопки "Застосувати" та "Назад" у галереї мають data-action,
    // а основний хендлер працює з data-act. Мапимо, щоб логіка була 1-в-1 як у Шапки.
    if (action === "apply-selected" || action === "back") {
      actionBtn.dataset.act = action;
    }
  }

  // ---------------------------------------------------------
  // ✅ 2) Далі стандартний data-act
  // ---------------------------------------------------------
  let btn = e.target.closest("[data-action],[data-act]");

// ✅ якщо клік по info-кнопці — не даємо йому тригерити select-template
if (e.target.closest(".sttpl-infoBtn")) {
  // далі обробиться act === "info-template"
}



  if (!btn) return;


  // ✅ CLICK-SELECT FIX (Page cards): allow selecting a template by clicking ANYWHERE inside its card,
  // including preview/thumbnail/title area (not only bottom actions).
  // If click happened on page thumbnail, treat it as select-template.
  let act = (btn.dataset.action || btn.dataset.act);

  if (act === "page-thumb") {
    // Одинарний клік по великому ескізу тільки активує картку.
    // Перегляд відкривається подвійним кліком або кнопкою "Перегляд".
    act = "select-template";
  }

  const cardEl = e.target.closest('.sttpl-card[data-tpl-id]');
  const cardId = cardEl?.dataset?.tplId || null;

  // Одинарний клік по самій картці/ескізу = активувати тільки одну картку.
  // Клік по службових кнопках не робить попередній render до виконання дії,
  // щоб не ламати checkbox/insert/preview/delete.
  const isCardPlainClick = !!(cardId && !e.target.closest('button,input,label,.sttpl-card__actionsRow,.sttpl-roundCheck,.sttpl-thumbBtn'));
  if (isCardPlainClick) {
    // [00367][DBLCLICK FALLBACK]
    // Після першого кліку карточка ререндериться, тому браузерний dblclick
    // на новому DOM-елементі іноді не спрацьовує. Ловимо "подвійний клік"
    // додатково через click-detail + часовий інтервал по тому самому tpl-id.
    if (isPreviewNavigationTab_()) {
      const now = Date.now();
      const detail = Number(e.detail || 0);
      const sameFastClick = __stTplPreviewClickFallback?.id === cardId
        && __stTplPreviewClickFallback?.tab === activeTab
        && (now - Number(__stTplPreviewClickFallback?.time || 0)) <= TEMPLATE_PREVIEW_DBLCLICK_FALLBACK_MS;

      __stTplPreviewClickFallback.id = cardId;
      __stTplPreviewClickFallback.tab = activeTab;
      __stTplPreviewClickFallback.time = now;

      if (detail >= 2 || sameFastClick) {
        e.preventDefault();
        e.stopPropagation();

        if (isTemplatePreviewOpen() && getTemplatePreviewCurrentId() === cardId) {
          try { closeTemplatePreview(); } catch {}
        } else {
          selectedTemplateId = cardId;
          // [00445][FAST DOUBLE CLICK PREVIEW]
          // Open preview immediately on the second click/fallback path. Re-rendering
          // before opening replaces the DOM under the cursor and can swallow dblclicks.
          __stTplPreviewClickFallback.openedId = cardId;
          __stTplPreviewClickFallback.openedAt = Date.now();
          previewTemplateById_(cardId);
        }
        return;
      }
    }

    act = 'select-template';
    btn = cardEl;
  }

  // ✅ dropdown toggle
  if (act === "toggle-header-target") {
    const dd = btn.closest(".sttpl-dd");
    if (!dd) return;
    dd.classList.toggle("is-open");
    return;
  }

	  // ✅ переключатель розміру превʼю сторінок (1440×900 / 1280×800)
	  if (act === 'page-preview-size') {
	    const sz = String(btn.dataset.size || '').trim();
	    setPagePreviewSizeKey_(sz);
	    render(view);
	    return;
	  }


  // ✅ круглий чекбокс: мультивибір шаблонів для імпорту/експорту
  if (act === "toggle-template-check") {
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.tplId || e.target?.dataset?.tplId || null;
    if (!id) return;
    if (selectedTemplateIds.has(id)) selectedTemplateIds.delete(id);
    else selectedTemplateIds.add(id);
    selectedTemplateId = id;
    render(view);
    return;
  }

  if (act === "select-all-visible") {
    e.preventDefault();
    e.stopPropagation();
    selectedTemplateIds = new Set(__lastVisibleTemplateIds || []);
    if (!selectedTemplateId && __lastVisibleTemplateIds.length) selectedTemplateId = __lastVisibleTemplateIds[0];
    render(view);
    return;
  }

  if (act === "clear-template-selection") {
    e.preventDefault();
    e.stopPropagation();
    selectedTemplateIds.clear();
    render(view);
    return;
  }

  if (act === "insert-template") {
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.tplId || null;
    if (!id) return;
    selectedTemplateId = id;
    const tpl = getTemplateById(id);
    if (!tpl) return;

    if (activeTab === 'page') {
      applyPageRecipeWithFeedback01028_(tpl);
      return;
    }

    if (false) {
      const ok = applySectionTemplateToCanvas_(tpl);
      if (ok) {
        render(view);
        closeTemplatesGalleryManager();
      } else {
        try { alert('Не вдалося застосувати шаблон: шаблон порожній або не містить .st-section'); } catch (_) {}
      }
      return;
    }

    if (activeTab === 'ai-templates') {
      const aiKind = String(tpl?.meta?.aiTemplateType || '').toLowerCase();
      if (aiKind === 'sections' || tpl?.folderId === 'fld_ai_sections') {
        const ok = applySectionTemplateToCanvas_(tpl);
        if (ok) {
          render(view);
          closeTemplatesGalleryManager();
        } else {
          try { alert('Не вдалося застосувати AI-шаблон: шаблон порожній або не містить .st-section'); } catch (_) {}
        }
        return;
      }
      try { alert('Цей тип AI-шаблону ще не має логіки застосування. Підключено “Секції-АІ” та “AI”.'); } catch (_) {}
      return;
    }

    // Для шапки/футера/меню/сайту використовуємо основну логіку кнопки “Застосувати”.
    act = "apply-selected";
  }

  if (act === "apply-card-template") {
    const id = btn.dataset.tplId || e.target?.dataset?.tplId || null;
    if (!id) return;
    selectedTemplateId = id;
    act = "apply-selected";
  }

  // ✅ вибір target (PAGE/GLOBAL)
  if (act === "set-header-target") {
    const t = btn.dataset.target === "global" ? "global" : "page";
    localStorage.setItem("st_header_pick_target", t);

    // закрити dropdown
    const dd = btn.closest(".sttpl-dd");
    if (dd) dd.classList.remove("is-open");

    // перемалювати шапку галереї, щоб оновився label + active item
    render();
    return;
  }

  // ✅ клік поза dropdown — закрити
  if (act !== "toggle-header-target" && !e.target.closest('.sttpl-dd')) {
    const ddOpen = view.querySelector('.sttpl-dd.is-open');
    if (ddOpen) ddOpen.classList.remove('is-open');
  }



// ✅ фокус на GLOBAL/PAGE (1-в-1 для Шапки і Футера)
if (act === "focus-global") {
  if (activeTab === "footer") {
    const st = readFooterAppliedState();
    const id = st?.globalTplId || null;
    if (!id) return;
    focusTemplateById(id, "footer");
    return;
  }
  const { globalTplId } = readHeaderAppliedState();
  if (!globalTplId) return;
  focusTemplateById(globalTplId, "header");
  return;
}
if (act === "focus-page") {
  if (activeTab === "footer") {
    const st = readFooterAppliedState();
    const pageId = getCurrentPageIdFromDomOrLs();

    const id = (st?.pages && st.pages[pageId]) ? st.pages[pageId] : null;
    if (!id) return;
    focusTemplateById(id, "footer");
    return;
  }
  const { pageTplId } = readHeaderAppliedState();
  if (!pageTplId) return;
  focusTemplateById(pageTplId, "header");
  return;
}

  // ✅ Видалити активний шаблон (усі вкладки)
  // Важливо: кнопка в шапці Галереї повинна видаляти саме вибраний шаблон.
  // Для system-шаблонів deleteTemplateById запамʼятає ID у deletedSystemTemplateIds,
  // щоб шаблон не повертався автоматично після перезапуску.
  if (act === "delete-selected") {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedTemplateId) {
      showTemplateDeleteNotice_(
        'Немає вибраного шаблону',
        'Спочатку клікни по шаблону, щоб зʼявилась синя рамка, а потім натисни “Видалити”.'
      );
      return;
    }

    const tpl = getTemplateById(selectedTemplateId);
    if (!tpl) {
      showTemplateDeleteNotice_(
        'Шаблон не знайдено',
        'Вибраний шаблон уже відсутній у сховищі. Оновлюю галерею.'
      ).finally(() => render(view));
      return;
    }

    const idToDelete = selectedTemplateId;

    const ask = async () => {
      const ok = await showTemplateDeleteConfirm_(tpl);
      if (!ok) return;

      const res = deleteTemplateById(idToDelete);
      if (!res || !res.ok) {
        console.warn('[templates-gallery] delete failed', res);
        const reasonMap = {
          no_id: 'Не передано ID шаблону.',
          not_found: 'Шаблон уже не знайдено у галереї.',
          system: 'Системний шаблон заблокований старою версією сховища.',
          error: 'Внутрішня помилка під час видалення.'
        };
        showTemplateDeleteNotice_(
          'Не вдалося видалити',
          reasonMap[res?.reason] || `Причина: ${res?.reason || 'невідома'}`
        );
        return;
      }

      // Якщо видалили шаблон, який був активним GLOBAL/PAGE — прибираємо маркери застосування,
      // щоб у галереї не висів статус на неіснуючому ID. Сам HTML шапки/футера на полотні не чіпаємо.
      try {
        if (activeTab === 'header') {
          const st = readHeaderAppliedState();
          if (st.globalTplId === idToDelete) clearActiveTemplate00946({ area: 'header', mode: 'global', pageId: st.pageId, templateId: idToDelete });
          if (st.pageTplId === idToDelete) clearActiveTemplate00946({ area: 'header', mode: 'page', pageId: st.pageId, templateId: idToDelete });
        }
        if (activeTab === 'footer') {
          const fs = readFooterAppliedState();
          const pid = getPageIdSafe_();
          if (fs.globalTplId === idToDelete) clearActiveTemplate00946({ area: 'footer', mode: 'global', pageId: pid, templateId: idToDelete });
          if (fs.pages?.[pid] === idToDelete) clearActiveTemplate00946({ area: 'footer', mode: 'page', pageId: pid, templateId: idToDelete });
        }
      } catch (err) {
        console.warn('[templates-gallery] cleanup applied state after delete failed', err);
      }

      selectedTemplateId = null;
      render(view);
    };

    ask();
    return;
  }



  // =========================================================
  // [00421][AI TEMPLATES REPLACE]
  // У режимі “АІ - Шаблони”:
  // - “Додати шаблон” додає вибраний Content/Section знизу;
  // - “Замінити шаблон” очищає поточний Content і вставляє вибраний AI-шаблон.
  // Під час заміни намагаємось перенести контент із секцій однакового типу:
  // текст .st-text-edit, img src, background-image секцій/блоків.
  // =========================================================
  if (act === "replace-ai-template") {
    e.preventDefault();
    e.stopPropagation();

    if (!selectedTemplateId) {
      try { alert('Спочатку вибери AI-шаблон.'); } catch (_) {}
      return;
    }
    const tpl = getTemplateById(selectedTemplateId);
    if (!tpl) {
      try { alert('AI-шаблон не знайдено.'); } catch (_) {}
      return;
    }

    const aiKind = String(tpl?.meta?.aiTemplateType || '').toLowerCase();
    const isAiSection = false;
    if (!isAiContent && !isAiSection) {
      try { alert('Заміна зараз підключена для AI та Секції-АІ.'); } catch (_) {}
      return;
    }

    const msg = isAiContent
      ? 'Замінити поточний Content вибраним AI-шаблоном? Тексти/фото зі схожих секцій система спробує перенести автоматично.'
      : 'Замінити поточні секції Content вибраною AI-секцією?';
    let okConfirm = true;
    try { okConfirm = confirm(msg); } catch (_) { okConfirm = true; }
    if (!okConfirm) return;

    const res = replaceCanvasWithTemplate_(tpl, { preserveContent: isAiContent });
    if (res?.ok) {
      try {
        const movedText = res.transfer?.movedText || 0;
        const movedImages = res.transfer?.movedImages || 0;
        window.__ST_AI_DEBUG_LOG__?.push?.('info', 'ai-template:replace-main', {
          templateId: tpl.id,
          templateName: tpl.name,
          removed: res.removed,
          inserted: res.sections,
          movedText,
          movedImages,
          fallbackMovedImages: res.transfer?.fallbackMovedImages || 0,
          matchedSections: res.transfer?.matchedSections || 0
        });
      } catch (_) {}
      try {
        alert(`AI-шаблон замінено. Перенесено текстових блоків: ${res.transfer?.movedText || 0}, зображень/фонів: ${res.transfer?.movedImages || 0}.`);
      } catch (_) {}
      render(view);
      closeTemplatesGalleryManager();
    } else {
      try { alert('Не вдалося замінити AI-шаблон: шаблон порожній або не містить .st-section'); } catch (_) {}
    }
    return;
  }

	// ✅ Перегляд шаблону з кнопки "Перегляд" у карточці.
	// Одинарний клік по самому ескізу НЕ відкриває preview; тільки подвійний клік.
	if (act === "preview-template") {
	  const id = btn.dataset.tplId || selectedTemplateId || null;
	  if (!id) return;
	  previewTemplateById_(id);
	  return;
	}

  // ✅ Одинарний клік по ескізу сторінки = тільки вибір картки.
  if (act === "page-thumb") {
    act = "select-template";
  }

  // ✅ вибір шаблону (синя рамка)

  // ✅ Відкрити шаблон СТОРІНКИ у дизайні (застосувати snapshot + фокус на акордеон "Сторінка")
  if (act === "open-design-template") {
    const id = btn.dataset.tplId || null;
    if (!id) return;

    // ✅ якщо користувач натискає "Відкрити" прямо з карточки —
    // робимо цю карточку вибраною (щоб далі працювали Перегляд/Видалити у шапці Галереї).
    selectedTemplateId = id;

    const tpl = getTemplateById(id);
    if (!tpl) return;

    if ((activeTab === 'shop' || tpl.type === 'shop') && tpl?.meta?.commerceComponentTemplate01041 === true) {
      const applyButton01041 = view.querySelector('[data-act="apply-selected"],[data-action="apply-selected"]');
      if (applyButton01041) applyButton01041.click();
      return;
    }

    // ✅ Page-template відкриваємо єдиним helper-ом, щоб працював fallback pageHTML/previewHtml
    // і щоб поведінка кнопки "Відкрити" та верхньої "Застосувати" була однакова.
    if (isPageTemplate_(tpl)) {
      if (getPageRecipe01028_(tpl)) applyPageRecipeWithFeedback01028_(tpl);
      else {
        openPageTemplateInDesign_(tpl);
        try { closeTemplatesGalleryManager(); } catch {}
        try { focusTemplatesPageAccordion(); } catch {}
      }
      return;
    }

    // 1) Draft Mode: відкриття шаблону сторінки не повинно одразу перетирати сторінку сайту.
    //    Тому PageContext НЕ змінюємо — лишається поточна сторінка.
    //    Ми лише включаємо draft mode перед застосуванням snapshot.
    try {
      if (isPageTemplate_(tpl)) {
        window.ST_PAGE_DRAFT_MODE?.enterFromTemplate?.({ templateId: tpl.id, templateName: tpl.name });
      }
    } catch {}

    // 2) Snapshot -> полотно
    let snap = null;
    try {
      snap = tpl.html ? JSON.parse(tpl.html) : null;
    } catch {
      snap = null;
    }

    if (snap) {
      const isPageTpl = isPageTemplate_(tpl);
      window.dispatchEvent(new CustomEvent('st:canvas-apply-snapshot', {
        detail: {
          snapshot: snap,
          options: { persist: !isPageTpl, draft: isPageTpl }
        }
      }));
    } else {
      console.warn('[templates-gallery] open-design-template: snapshot empty', {
        id: tpl.id,
        name: tpl.name,
        kind: tpl.kind,
        folder: tpl.folder,
        hasHtml: !!tpl.html,
        htmlLen: (tpl.html && String(tpl.html).length) || 0,
        htmlHead: (tpl.html && String(tpl.html).slice(0, 120)) || '',
      });
      try {
        const storeRaw = localStorage.getItem('st_templates_store_v1');
        console.log('[templates-gallery] storeRaw head', storeRaw ? storeRaw.slice(0, 200) : null);
      } catch (e) { console.warn('[templates-gallery] storeRaw read fail', e); }
    }

    // 3) Закрити галерею
    try { closeTemplatesGalleryManager(); } catch {}

    // 4) Фокус на віджет "Шаблони" -> акордеон "Сторінка"
    try { focusTemplatesPageAccordion(); } catch {}

    return;
  }

  // ✅ Перегляд (кнопка всередині карточки, напр. у pageThumb hover)
  // Через previewTemplateById_ проходить єдина навігація/підказка/Enter-застосування.
  if (act === 'preview-template') {
    const id = btn.dataset.tplId || selectedTemplateId || null;
    if (!id) return;
    previewTemplateById_(id);
    return;
  }

if (act === "select-template") {
  const id = btn.dataset.tplId || null;
  if (!id) return;

  // Debug: helps зрозуміти, чи реально спрацьовує вибір картки
  if (window.__ST_TPL_DEBUG__) {
    console.log("[TPL] select-template", { activeTab, id, btnText: btn.textContent?.trim?.() });
  }

  // ✅ фіксуємо скрол саме того контейнера, який реально скролиться
  const scroller = getScrollParent(btn) || getCanvasScroll();
  const prevTop = scroller ? scroller.scrollTop : 0;

  // ✅ не даємо браузеру “підкручувати” через focus
  // (працює в сучасних браузерах; якщо не підтримується — просто ігнорується)
  try { btn.focus({ preventScroll: true }); } catch {}

  selectedTemplateId = id;

  if (window.__ST_TPL_DEBUG__) {
    console.log("[TPL] selectedTemplateId set", { activeTab, selectedTemplateId });
  }

  render(view);

  requestAnimationFrame(() => {
    if (scroller) scroller.scrollTop = prevTop;

    const card = view.querySelector(
      `[data-act="select-template"][data-tpl-id="${CSS.escape(id)}"]`
    );
    if (!card) return;

    // ✅ прокручуємо тільки якщо реально вийшло з видимої області
    const sc = getScrollParent(card) || scroller;
    if (sc && !isInView(card, sc)) {
      card.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  });

  return;
}



function fallbackFullscreenPreview({ name, html }) {
  let ov = document.getElementById("sttplFsPreview");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "sttplFsPreview";
    ov.style.cssText = `
      position:fixed; inset:0; z-index:100000;
      background:rgba(0,0,0,0.72);
      display:flex; align-items:center; justify-content:center;
      padding:18px;
    `;
    ov.innerHTML = `
      <div style="
        width:min(1200px, 96vw);
        max-height:92vh;
        border-radius:18px;
        border:1px solid rgba(255,255,255,0.16);
        background:rgba(10,16,26,0.96);
        box-shadow:0 20px 70px rgba(0,0,0,0.5);
        overflow:hidden;
        display:flex; flex-direction:column;
      ">
        <div style="
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 14px;
          border-bottom:1px solid rgba(255,255,255,0.10);
        ">
          <div style="font-weight:900;font-size:13px;opacity:.95">${name || "Preview"}</div>
          <button data-act="close-fs-preview" style="
            border-radius:12px;
            border:1px solid rgba(255,255,255,0.16);
            background:rgba(255,255,255,0.04);
            color:inherit;
            cursor:pointer;
            padding:6px 10px;
          ">Закрити</button>
        </div>
        <div style="padding:14px; overflow:auto;">
          <div style="border-radius:14px; border:1px dashed rgba(255,255,255,0.18); padding:14px;">
            ${html || ""}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);

    ov.addEventListener("click", (e) => {
      if (e.target === ov) ov.style.display = "none";
      if (e.target.closest('[data-act="close-fs-preview"]')) ov.style.display = "none";
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const el = document.getElementById("sttplFsPreview");
        if (el && el.style.display !== "none") el.style.display = "none";
      }
    });
  }

  // update content
  const title = ov.querySelector("div[style*='font-weight:900']");
  if (title) title.textContent = name || "Preview";
  const box = ov.querySelector("div[style*='border:1px dashed']");
  if (box) box.innerHTML = html || "";

  ov.style.display = "flex";
}









     // =========================================================
  // [TEMPLATES][INFO] Кнопка ℹ — показати інфо по шаблону
  // =========================================================
  if (act === "info-template") {

    e.preventDefault();
    e.stopPropagation();

    
    const id = btn.dataset.tplId || selectedTemplateId || null;
    if (!id) return;

    selectedTemplateId = id;
    const tpl = getTemplateById(id);
    if (!tpl) return;

    // MVP: просте вікно. Далі замінимо на гарне модальне.
    showTemplateInfo(id);
    return;
  }






  // ✅ застосувати (для вкладки "Шапка")
  // ✅ застосувати (для вкладки "Шапка") — ЄДИНА ІСТИНА: ST_HEADER_STATE + SiteHeaderRuntime

if (act === "apply-selected") {
    try {
      window.__ST_ALL_LOG__?.push?.('template-gallery-apply-route-01015', {
        activeTab: String(activeTab || ''),
        viewTab: String(view?.dataset?.activeTemplateTab || ''),
        selectedTemplateId: String(selectedTemplateId || ''),
        sameTabState: !view?.dataset?.activeTemplateTab || String(view.dataset.activeTemplateTab) === String(activeTab || '')
      }, 'info');
    } catch (_) {}
    if (window.__ST_TPL_DEBUG__) {
      console.log("[TPL] apply-selected", { activeTab, selectedTemplateId });
    }
    if (!selectedTemplateId) {
      console.warn('[templates-gallery] apply-selected: selectedTemplateId is empty');
      return;
    }
    const tpl = getTemplateById(selectedTemplateId);
    if (!tpl) {
      console.warn('[templates-gallery] no template selected');
      return;
    }
    if (!tpl) return;

    // 00954: choosing a section style creates an in-memory candidate only.
    // The widget previews it immediately; canvas + reference reach Store
    // together only after the explicit Save action.
    if (activeTab === SECTION_STYLE_TAB_ID_00953) {
      if (!['header', 'main', 'footer'].includes(sectionStyleSelectionArea00950)) {
        try { alert('Відкрийте «Стилі Секцій» через шестерню потрібної області: Шапка, Main або Footer.'); } catch (_) {}
        return;
      }
      const reference = createSectionStyleReference00953(sectionStyleSelectionArea00950, tpl);
      if (!reference) {
        console.warn('[templates-gallery][00954] invalid section style candidate', tpl);
        try { alert('Не вдалося вибрати стиль: відсутній Style Profile.'); } catch (_) {}
        return;
      }
      try {
        window.dispatchEvent(new CustomEvent('st:section-style-candidate-00954', {
          detail: {
            area: sectionStyleSelectionArea00950,
            reference,
            styleId: reference.styleId,
            profileId: reference.profileId
          }
        }));
        window.__ST_ALL_LOG__?.push?.('section-style-gallery-candidate-00954', {
          area: sectionStyleSelectionArea00950,
          styleId: reference.styleId,
          profileId: reference.profileId,
          storeChanged: false,
          previewRequested: true
        });
      } catch (_) {}
      closeTemplatesGalleryManager();
      return;
    }

    // =========================================================
    // [00407][AI TEMPLATES APPLY]
    // У режимі “АІ - Шаблони” підключено застосування Секції-АІ та AI.
    // =========================================================
    if (activeTab === 'ai-templates') {
      const aiKind = String(tpl?.meta?.aiTemplateType || '').toLowerCase();
      if (aiKind === 'sections' || tpl?.folderId === 'fld_ai_sections') {
        const ok = applySectionTemplateToCanvas_(tpl);
        if (ok) {
          render(view);
          closeTemplatesGalleryManager();
        } else {
          try { alert('Не вдалося застосувати AI-шаблон: шаблон порожній або не містить .st-section'); } catch (_) {}
        }
        return;
      }
      try { alert('Цей тип AI-шаблону ще не має логіки застосування. Підключено “Секції-АІ” та “AI”.'); } catch (_) {}
      return;
    }

    // =========================================================
    // [00380][MENU DESIGN APPLY]
    // Для вкладки "Меню" кнопка "Застосувати" не вставляє новий блок,
    // а переносить дизайн шаблону на вже вибране меню, зберігаючи пункти/посилання.
    // =========================================================
    if (String(activeTab || '') === 'menu' || String(activeTab || '') === 'sidebar' || tpl?.meta?.menuDesignTemplate) {
      const res = stTplApplyMenuDesignTemplateToSelected_(tpl);
      if (!res?.ok) {
        const msg = res?.reason === 'no-selected-menu'
          ? 'Спочатку виберіть меню на полотні, тоді відкрийте Шаблони → Меню → Змінити.'
          : 'Не вдалося застосувати дизайн меню. Перевірте шаблон або вибране меню.';
        try { alert(msg); } catch {}
        console.warn('[templates-gallery][00380] menu design apply failed:', res);
        return;
      }
      try { closeTemplatePreview(); } catch {}
      try { render(view); } catch {}
      closeTemplatesGalleryManager();
      return;
    }

    // =========================================================
    // PICK MODE (2026): вибір шаблону сторінки для інших віджетів
    // Напр.: Конструктор "Шаблон Сайта" хоче обрати page-template.
    // У цьому режимі "Застосувати" = "Вибрати" (без застосування до canvas).
    // =========================================================
    if (false) {
      let ctx = null;
      try {
        ctx = JSON.parse(localStorage.getItem('st_tpl_pick_ctx_v1') || 'null');
      } catch {
        ctx = null;
      }

      if (ctx && ctx.mode === 'site-template-builder') {
        try {
          window.dispatchEvent(new CustomEvent('st:tplPick:pageTemplate', {
            detail: {
              mode: 'site-template-builder',
              role: ctx.role || null,
              templateId: tpl.id,
              templateName: tpl.name || ''
            }
          }));
        } catch {}

        try { localStorage.removeItem('st_tpl_pick_ctx_v1'); } catch {}
        render(view);
        closeTemplatesGalleryManager();
        return;
      }
    }

    // =========================================================
    // PICK MODE (2026): вибір шаблону САЙТУ для віджета "Сайт"
    // У цьому режимі "Застосувати" = "Вибрати" (без застосування до canvas).
    // Контекст ставить віджет "Сайт" у localStorage: st_tpl_pick_ctx_v1
    // =========================================================
    if (false) {
      let ctx = null;
      try {
        ctx = JSON.parse(localStorage.getItem('st_tpl_pick_ctx_v1') || 'null');
      } catch {
        ctx = null;
      }

      if (ctx && ctx.mode === 'site-manager') {
        try {
          window.dispatchEvent(new CustomEvent('st:tplPick:siteTemplate', {
            detail: {
              mode: 'site-manager',
              siteId: ctx.siteId || null,
              templateId: tpl.id,
              templateName: tpl.name || ''
            }
          }));
        } catch {}

        try { localStorage.removeItem('st_tpl_pick_ctx_v1'); } catch {}
        render(view);
        closeTemplatesGalleryManager();
        return;
      }
    }

    // 01041 · Commerce component template apply. Product Card is a Store-owned
    // Main component, never a whole Main section and never a direct DOM insertion.
    if (activeTab === 'shop' && tpl?.meta?.commerceComponentTemplate01041 === true) {
      const appliedComponentType01041 = String(tpl?.meta?.commerceComponentType || tpl?.componentType || commerceComponentType01041 || 'product-card').trim().toLowerCase();
      openHeaderApplyModal({
        title: appliedComponentType01041 === 'category-card' ? 'Як застосувати карточку категорії?' : (appliedComponentType01041 === 'product-card' ? 'Як застосувати карточку товару?' : 'Як застосувати компонент?'),
        commerceComponentApply01041: true,
        onPick: (mode) => {
          const targetMode01041 = mode === 'replace' ? 'replace' : 'add';
          const api01041 = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
          const result01041 = api01041?.applyMainComponentTemplate01041?.({
            html: tpl.html || tpl.previewHtml || '',
            templateId: String(tpl.id || ''),
            componentType: appliedComponentType01041,
            mode: targetMode01041,
            parentNodeId: commerceComponentInsertParentId01041,
            targetNodeId: targetMode01041 === 'replace' ? commerceComponentReplaceTargetId01041 : '',
            allowTypeChange01050: commerceAllowTypeChange01050
          });
          if (!result01041?.ok) {
            const reason01041 = String(result01041?.reason || 'Commerce component apply failed');
            if (reason01041 === 'commerce-component-insert-target-required') {
              try { alert('Виберіть контейнер або рівень Main, потім відкрийте шаблони карточки ще раз.'); } catch {}
            } else if (reason01041 === 'commerce-component-replace-target-required') {
              try { alert('Для заміни спочатку виберіть існуючу карточку товару або категорії.'); } catch {}
            } else {
              try { alert(`Не вдалося застосувати commerce-карточку: ${reason01041}`); } catch {}
            }
            return result01041;
          }
          try { closeTemplatePreview(); } catch {}
          render(view);
          closeTemplatesGalleryManager();
          return result01041;
        }
      });
      return;
    }

    // 01028 Gallery / Сторінка: Apply opens a new page tab for Page Recipes.
    // It never falls through into Header/Footer apply routing.
    if (activeTab === 'page') {
      applyPageRecipeWithFeedback01028_(tpl);
      return;
    }

    if (false) {
      // [00391][PHOTO GALLERY DESIGN CHANGE]
      // Якщо галерея відкрита з віджета "Фотогалерея → Змінити дизайн",
      // не вставляємо нову секцію. Застосовуємо шаблон до вже вибраної секції,
      // зберігаючи фото/категорії, а віджет потім дає Зберегти / Відмінити.
      if (activeTab === "photo-gallery") {
        const pgApi = window.ST_PHOTO_GALLERY_WIDGET;
        if (pgApi && typeof pgApi.isDesignChangeActive === 'function' && pgApi.isDesignChangeActive()) {
          const res = pgApi.applyTemplateDesign?.(tpl.html || tpl.previewHtml || '', tpl);
          if (res?.ok) {
            try { closeTemplatePreview(); } catch {}
            render(view);
            closeTemplatesGalleryManager();
            return;
          }
          console.warn('[templates-gallery][00391] photo-gallery design apply failed:', res);
          try { alert('Не вдалося змінити дизайн фотогалереї. Перевір, що активна саме секція фотогалереї.'); } catch (_) {}
          return;
        }
      }

      const ok = applySectionTemplateToCanvas_(tpl);
      if (ok) {
        render(view);
        closeTemplatesGalleryManager();
      } else {
        try { alert('Не вдалося застосувати шаблон: шаблон порожній або не містить .st-section'); } catch (_) {}
      }
      return;
    }

    const pageId = getCurrentPageIdFromDomOrLs();
    if (activeTab === 'main') {
      const mainReplaceScope01000 = String(tpl?.meta?.replaceScope || 'section').toLowerCase() === 'main-area' ? 'main-area' : 'section';
      openHeaderApplyModal({
        title: 'Як застосувати шаблон Маїн?',
        mainReplaceScope: mainReplaceScope01000,
        onPick: (mode) => {
          const targetMode = mode === 'replace' ? 'replace' : 'add';
          const api = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
          const templateSelection00946 = {
            templateId: String(tpl.id || ''),
            templateName: String(tpl.name || tpl.id || ''),
            profileId: String(tpl.styleProfile?.profileId || ''),
            collectionId: String(tpl.styleProfile?.collectionId || ''),
            recordedAt: Date.now()
          };
          const replaceRequest00949 = {
            html: tpl.html || tpl.previewHtml || '',
            templateId: tpl.id,
            templateSelection00946
          };
          const replaceScope00987 = targetMode === 'replace' ? mainReplaceScope01000 : 'section';
          // 01000: a main-area template never requires an individual section target.
          // Section-scoped Replace still requires the exact section captured before
          // the gallery hid the canvas. Never degrade Replace into Add.
          if (targetMode === 'replace' && replaceScope00987 !== 'main-area' && !mainReplaceTargetId00952) {
            const missingTarget = { ok: false, reason: 'main-template-target-required-before-gallery' };
            try { alert('Спочатку виберіть секцію Main на полотні, потім відкрийте галерею. Замінити виконується одразу без другого кліку.'); } catch (_) {}
            return missingTarget;
          }
          try {
            window.__ST_ALL_LOG__?.push?.('main-template-apply-request-01000', {
              requestedMode: targetMode,
              replaceScope: replaceScope00987,
              capturedTargetId: String(mainReplaceTargetId00952 || ''),
              targetRequired: targetMode === 'replace' && replaceScope00987 !== 'main-area'
            }, 'info');
          } catch (_) {}
          const result = api?.applyMainTemplate?.({
            ...replaceRequest00949,
            mode: targetMode,
            targetSectionId: targetMode === 'replace' && replaceScope00987 !== 'main-area' ? mainReplaceTargetId00952 : '',
            replaceScope: replaceScope00987
          });
          if (!result?.ok) {
            throw new Error(result?.error || result?.reason || 'Main template apply failed');
          }
          render(view);
          closeTemplatesGalleryManager();
          return result;
        }
      });
      return;
    }
    // ✅ визначаємо ціль застосування: header/footer
    if (activeTab === "footer") {
      // ✅ Footer: якщо ми прийшли з кружечків (quick target) — застосовуємо одразу БЕЗ модалки.
      // Кнопка "Шаблони Футера" явно ставить st_footer_pick_target=ask.
      const pick = (localStorage.getItem('st_footer_pick_target')
        || localStorage.getItem('st_footer_apply_quick_target')
        || 'ask');

      if (pick === 'global' || pick === 'page') {
        const targetMode = pick;
        const ok = applyFooterTemplateViaRuntime({
          html: tpl.html || "",
          mode: targetMode,
          pageId,
          tpl
        });

        if (ok) {
          if (targetMode === 'page') writeFooterAppliedState({ pageId, pageTplId: tpl.id, template: tpl });
          else writeFooterAppliedState({ pageId, globalTplId: tpl.id, template: tpl });
        }

        // ✅ очистити quick-контекст, щоб наступного разу (через кнопку) модалка показувалась
        try { localStorage.removeItem('st_footer_pick_target'); } catch {}
        try { localStorage.removeItem('st_footer_apply_quick_target'); } catch {}

        render(view);
        closeTemplatesGalleryManager();
        return;
      }

      // ✅ Footer: (ask) — показуємо модалку GLOBAL/PAGE
      openFooterApplyModal({
        title: 'Як застосувати футер?',
        onPick: (mode) => {
          const targetMode = (mode === 'page') ? 'page' : 'global';
          const ok = applyFooterTemplateViaRuntime({
            html: tpl.html || "",
            mode: targetMode,
            pageId,
            tpl
          });

          if (ok) {
            if (targetMode === 'page') writeFooterAppliedState({ pageId, pageTplId: tpl.id, template: tpl });
            else writeFooterAppliedState({ pageId, globalTplId: tpl.id, template: tpl });
          }

          // ✅ в будь-якому випадку чистимо quick
          try { localStorage.removeItem('st_footer_pick_target'); } catch {}
          try { localStorage.removeItem('st_footer_apply_quick_target'); } catch {}

          render(view);
          closeTemplatesGalleryManager();
        }
      });
      return;
    }

    // ✅ Header: якщо ми прийшли з кружечків (quick target) — застосовуємо одразу БЕЗ модалки.
    // Кнопка "Шаблони Шапки" може ставити st_header_pick_target=ask.
    const pick = (localStorage.getItem('st_header_pick_target')
      || localStorage.getItem('st_header_apply_quick_target')
      || 'ask');

    if (pick === 'global' || pick === 'page') {
      const targetMode = pick;

      applyHeaderTemplateViaRuntime({
        html: tpl.html || "",
        mode: targetMode,
        pageId,
        tpl
      });

      if (targetMode === 'page') writeHeaderAppliedState({ pageId, pageTplId: tpl.id, template: tpl });
      else writeHeaderAppliedState({ pageId, globalTplId: tpl.id, template: tpl });

      // ✅ очистити quick-контекст
      try { localStorage.removeItem('st_header_pick_target'); } catch {}
      try { localStorage.removeItem('st_header_apply_quick_target'); } catch {}

      render(view);
      closeTemplatesGalleryManager();
      return;
    }

    // ✅ Header: (ask) — показуємо модалку GLOBAL/PAGE
    openHeaderApplyModal({
      title: 'Як застосувати шапку?',
      onPick: (mode) => {
        const targetMode = (mode === 'page') ? 'page' : 'global';

        applyHeaderTemplateViaRuntime({
          html: tpl.html || "",
          mode: targetMode,
          pageId,
          tpl
        });

        if (targetMode === 'page') writeHeaderAppliedState({ pageId, pageTplId: tpl.id, template: tpl });
        else writeHeaderAppliedState({ pageId, globalTplId: tpl.id, template: tpl });

        try { localStorage.removeItem('st_header_pick_target'); } catch {}
        try { localStorage.removeItem('st_header_apply_quick_target'); } catch {}

        render(view);
        closeTemplatesGalleryManager();
      }
    });
    return;
  }

  // NOTE: застосування шаблону виконується ТІЛЬКИ через кнопку "Застосувати"
  // (act === "apply-selected"). Тут нічого не робимо, щоб не ламати footer/header.









  if (act === "back") {
    closeTemplatesGalleryManager();
    return;
  }

  // ✅ settings (як було)
  if (act === "settings") {
    openSettingsModal();
    return;
  }
  if (act === "close-settings") {
    closeSettingsModal();
    return;
  }
  if (act === "reset-theme") {
    resetTheme();
    return;
  }
  if (act === "save-theme") {
    saveThemeFromModal();
    return;
  }

  // ✅ верхній перемикач: звичайні шаблони / АІ-шаблони
  if (act === "template-gallery-mode") {
    const mode = btn.dataset.mode || TEMPLATE_GALLERY_MODE_TEMPLATES;
    const root = getFoldersRoot();
    switchTemplateGalleryMode_(root, mode);
    render();
    return;
  }

  // ✅ вкладки АІ-шаблонів у другому рядку
  if (act === "ai-template-folder") {
    saveTemplateGalleryMode_(TEMPLATE_GALLERY_MODE_AI);
    activeTab = 'ai-templates';
    activeFolderId = btn.dataset.folder || getDefaultAiTemplatesFolderId_(getFoldersRoot());
    selectedTemplateId = null;
    selectedTemplateIds.clear();
    render();
    return;
  }

  // ✅ вкладки
  if (act === "tab") {
    const tab = btn.dataset.tab || "site";
    const folder = btn.dataset.folder || "";

    saveTemplateGalleryMode_(TEMPLATE_GALLERY_MODE_TEMPLATES);
    activeTab = tab;

    activeFolderId = folder || null;

    // скидаємо вибір при зміні вкладки
    selectedTemplateId = null;
    selectedTemplateIds.clear();

    render();
    return;
  }

  // ✅ папки
  if (act === "folder") {
    activeFolderId = btn.dataset.folder || null;
    selectedTemplateId = null;
    selectedTemplateIds.clear();
    render(view);
    return;
  }

  if (act === "page-tree-toggle") {
    const folderId = String(btn.getAttribute('data-folder') || '');
    if (!folderId) return;
    const set = loadPageTreeExpanded01029_();
    if (set.has(folderId)) set.delete(folderId); else set.add(folderId);
    savePageTreeExpanded01029_(set);
    render(view);
    return;
  }

  // ✅ додати категорію
  if (act === "add-category") {
    const name = prompt("Назва нової категорії:", "Моя категорія");
    if (!name) return;

    const type = (name || "custom")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9а-яіїє\-]/gi, "");

    const folder = createFolder({ parentId: "root", type, name, system: false });

    if (folder) {
      activeTab = folder.type;
      activeFolderId = folder.id;
      render(view);
    }
    return;
  }

  // ✅ додати підкатегорію
  if (act === "add-subfolder") {
    if (!activeFolderId) return;
    const name = prompt("Назва підкатегорії:", "Підкатегорія");
    if (!name) return;
    createFolder({ parentId: activeFolderId, type: activeTab, name, system: false });
    render(view);
    return;
  }

  if (act === "rename-folder") {
    const folderId = btn.getAttribute("data-folder-id") || btn.getAttribute("data-folder") || "";
    const f = findFolderById(folderId);
    if (!f) return;

    const name = prompt("Нова назва підкатегорії:", f.name || "");
    if (name == null) return;

    const res = renameFolderById(folderId, name);
    if (!res || !res.ok) {
      alert("Не вдалося перейменувати підкатегорію.");
      return;
    }

    render();
    return;
  }

  if (act === "delete-folder") {
    // Важливо: у кнопках дерева ми ставимо data-folder-id="..."
    // (а в деяких місцях історично було data-folder="...").
    // Беремо обидва, щоб не ламати сумісність.
    const folderId = btn.getAttribute("data-folder-id") || btn.getAttribute("data-folder") || "";
    const f = findFolderById(folderId);
    if (!f) return;

    if (!confirm(`Видалити підкатегорію "${f.name}"?`)) return;

    const res = deleteFolderById(folderId);
    if (!res || !res.ok) {
      if (res && res.reason === "not_empty") {
        alert("Не можна видалити підкатегорію: у ній є шаблони.");
      } else if (res && res.reason === "has_children") {
        alert("Не можна видалити підкатегорію: у ній є вкладені підкатегорії.");
      } else if (res && res.reason === "system_folder") {
        alert("Цю підкатегорію не можна видалити (системна).");
      } else {
        alert("Не вдалося видалити підкатегорію.");
      }
      return;
    }

    // якщо видалили активну — повертаємось на батьківську
    if (activeFolderId === folderId) {
      activeFolderId = f.parentId || getFoldersRoot().id;
    }

    render();
    return;
  }

}

// =========================================================
// Далі — твоя модалка налаштувань (як було у файлі)
// (я залишив повністю, щоб нічого не ламати)
// =========================================================
function getOrCreateSettingsModal() {
  let m = document.getElementById("sttplSettingsModal");
  if (m) return m;

  m = document.createElement("div");
  m.id = "sttplSettingsModal";
  m.className = "sttpl-modal";

  m.innerHTML = `
    <div class="sttpl-modal__header" data-drag-handle>
      <div class="sttpl-modal__title">Налаштування — Галерея шаблонів</div>
      <button class="sttpl-modal__close" data-act="close-settings" title="Закрити">✕</button>
    </div>

    <div class="sttpl-modal__body">
      <div class="sttpl-field">
        <label>Фон блоку</label>
        <input type="color" data-theme="bg_hex">
      </div>

      <div class="sttpl-field">
        <label>Колір рамки</label>
        <input type="color" data-theme="border_hex">
      </div>

      <div class="sttpl-field">
        <label>Колір тексту</label>
        <input type="color" data-theme="text_hex">
      </div>

      <div class="sttpl-field">
        <label>Фон шапки</label>
        <input type="color" data-theme="header_hex">
      </div>

      <div class="sttpl-field">
        <label>Фон кнопок</label>
        <input type="color" data-theme="btn_hex">
      </div>

      <div class="sttpl-field">
        <label>Hover кнопок</label>
        <input type="color" data-theme="hover_hex">
      </div>
    </div>

    <div class="sttpl-modal__footer">
      <button class="sttpl-btn" data-act="reset-theme">Скинути</button>
      <button class="sttpl-btn sttpl-btn--primary" data-act="save-theme">Зберегти</button>
    </div>
  `;

  document.body.appendChild(m);
  makeModalDraggable(m);

  const liveApply = debounce(() => {
    const view = document.getElementById("templatesGalleryManagerView");
    if (!view) return;
    const theme = readThemeFromModal();

    applyThemeToView(view, theme);
    saveTheme(theme);
  }, 250);

  m.addEventListener("input", (e) => {
    const target = e.target;
    if (!target) return;
    if (target.matches('input[type="color"], input[type="range"]')) {
      liveApply();
    }
  });

  m.addEventListener("change", (e) => {
    const target = e.target;
    if (!target) return;
    if (target.matches('input[type="color"], input[type="range"]')) {
      liveApply();
    }
  });

  return m;
}

function hexToRgba(hex, alpha = 0.72) {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length !== 6) return `rgba(5, 8, 14, ${alpha})`;
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function openSettingsModal() {
  const view = document.getElementById("templatesGalleryManagerView");
  if (!view) return;

  const modal = getOrCreateSettingsModal();
  modal.style.display = "";

  const setHex = (sel, val) => {
    const el = modal.querySelector(sel);
    if (el) el.value = val;
  };

  setHex('[data-theme="bg_hex"]', "#05080e");
  setHex('[data-theme="border_hex"]', "#7aa0ff");
  setHex('[data-theme="text_hex"]', "#f3f6ff");
  setHex('[data-theme="header_hex"]', "#000000");
  setHex('[data-theme="btn_hex"]', "#0a346e");
  setHex('[data-theme="hover_hex"]', "#1a56aa");
}

function closeSettingsModal() {
  const modal = document.getElementById("sttplSettingsModal");
  if (modal) modal.style.display = "none";
}

function readThemeFromModal() {
  const modal = document.getElementById("sttplSettingsModal");
  if (!modal) return loadTheme();

  const bgHex     = modal.querySelector('[data-theme="bg_hex"]')?.value || "#05080e";
  const borderHex = modal.querySelector('[data-theme="border_hex"]')?.value || "#7aa0ff";
  const textHex   = modal.querySelector('[data-theme="text_hex"]')?.value || "#f3f6ff";
  const headerHex = modal.querySelector('[data-theme="header_hex"]')?.value || "#000000";
  const btnHex    = modal.querySelector('[data-theme="btn_hex"]')?.value || "#0a346e";
  const hoverHex  = modal.querySelector('[data-theme="hover_hex"]')?.value || "#1a56aa";

  return {
    ...DEFAULT_THEME,
    bg: hexToRgba(bgHex, 0.72),
    border: hexToRgba(borderHex, 0.18),
    text: hexToRgba(textHex, 0.95),
    headerBg: hexToRgba(headerHex, 0.22),

    tabBg: "rgba(255,255,255,0.03)",
    tabActive: DEFAULT_THEME.tabActive,

    btnBg: hexToRgba(btnHex, 0.06),
    btnBorder: hexToRgba(borderHex, 0.18),
    btnHover: hexToRgba(hoverHex, 0.22)
  };
}

function resetTheme() {
  saveTheme({ ...DEFAULT_THEME });
  const view = document.getElementById("templatesGalleryManagerView");
  applyThemeToView(view, loadTheme());
}

function saveThemeFromModal() {
  const theme = readThemeFromModal();
  saveTheme(theme);
  const view = document.getElementById("templatesGalleryManagerView");
  applyThemeToView(view, theme);
  closeSettingsModal();
}

function makeModalDraggable(modal) {
  const handle = modal.querySelector("[data-drag-handle]");
  if (!handle) return;

  let dragging = false;
  let startX = 0, startY = 0;
  let startLeft = 0, startTop = 0;

  handle.addEventListener("mousedown", (e) => {
    if (e.target.closest('[data-act="close-settings"]')) return;

    dragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = modal.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    modal.style.left = `${Math.max(8, startLeft + dx)}px`;
    modal.style.top  = `${Math.max(8, startTop + dy)}px`;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });
}


/* === ST_TPL_DEBUG_INSTRUMENTATION_V1 === */

(() => {
  if (window.__ST_TPL_DEBUG_INSTRUMENTED__) return;
  window.__ST_TPL_DEBUG_INSTRUMENTED__ = true;

  const dbgOn = () => !!window.__ST_TPL_DEBUG__;
  const trunc = (s, n=90) => (String(s||'').trim().replace(/\s+/g,' ').slice(0,n));

  const probeActive = () => {
    const activeCard =
      document.querySelector('.tpl-card.is-active,[data-tpl-card].is-active,[data-template-card].is-active,[data-selected="1"],[aria-selected="true"]');
    const id =
      activeCard?.dataset?.id ||
      activeCard?.dataset?.tplId ||
      activeCard?.dataset?.templateId ||
      activeCard?.getAttribute?.('data-id') ||
      activeCard?.getAttribute?.('data-tpl-id') ||
      null;

    const tabActive =
      document.querySelector('[data-tpl-tab].is-active,[data-tab].is-active,.tpl-tabs .is-active,[aria-selected="true"][role="tab"]');
    const tab =
      tabActive?.dataset?.tplTab ||
      tabActive?.dataset?.tab ||
      trunc(tabActive?.textContent, 40) ||
      null;

    return { hasActiveCard: !!activeCard, selectedId: id, activeTab: tab };
  };

  // ---- helpers for folder actions (store is source of truth)
  function findFolderById(id) {
    return getFolderById(id);
  }
  function deleteFolderById(id) {
    return deleteFolder(id);
  }

  document.addEventListener('click', (ev) => {
    if (!dbgOn()) return;

    const btn = ev.target?.closest?.('button,[role="button"],[data-action],[data-tpl-action]');
    const t = trunc(ev.target?.textContent, 60);

    if (!btn) {
      // Still log clicks inside gallery area lightly
      if (ev.target?.closest?.('.templates-gallery,.tpl-gallery,[data-templates-gallery]')) {
        console.log('[TPLDBG] click (no btn)', { target: ev.target?.tagName, text: t });
      }
      return;
    }

    const action =
      btn.dataset?.action ||
      btn.dataset?.tplAction ||
      btn.getAttribute?.('data-action') ||
      btn.getAttribute?.('data-tpl-action') ||
      null;

    const isApply =
      action === 'apply' ||
      /застосувати/i.test(btn.textContent || '') ||
      /apply/i.test(action || '');

    const isPickGlobal =
      /global/i.test(action || '') ||
      /глобальн/i.test(btn.textContent || '');

    const isPickPage =
      /page/i.test(action || '') ||
      /для сторінки/i.test(btn.textContent || '');

    const insideGallery = !!btn.closest?.('.templates-gallery,.tpl-gallery,[data-templates-gallery],#templatesGalleryManager');

    // Log all button clicks inside gallery or modal
    if (insideGallery || isApply || isPickGlobal || isPickPage) {
      const probe = probeActive();
      console.log('[TPLDBG] btn', {
        insideGallery,
        action,
        btnText: trunc(btn.textContent, 80),
        targetText: t,
        ...probe,
      });
    }

    if (isApply) {
      const probe = probeActive();
      console.log('[TPLDBG] APPLY pressed', probe);
    }
    if (isPickGlobal) console.log('[TPLDBG] modal pick -> GLOBAL');
    if (isPickPage) console.log('[TPLDBG] modal pick -> PAGE');
  }, true);

  // Helpful one-shot probe
  window.__ST_TPL_DEBUG_PROBE__ = () => {
    const p = probeActive();
    console.log('[TPLDBG] PROBE', p);
    return p;
  };

  console.log('[TPLDBG] instrumentation ready. Set window.__ST_TPL_DEBUG__ = true and retry.');
})();

function focusTemplatesPageAccordion() {
  // 01029: після застосування сторінки повертаємо фокус не у стару
  // групу "Сторінка" всередині Templates, а у новий окремий акордеон
  // Page Assembly, який живе між "Бібліотека" і "Шаблони".
  const section = document.querySelector('section.design-section[data-design-section-id="page-assembly-01029"]');
  if (!section) return;
  section.classList.add('is-open');
  try { section.scrollIntoView({ behavior:'smooth', block:'nearest' }); } catch {}
}

