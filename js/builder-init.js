// js/builder-init.js
// Єдина ініціалізація конструктора + інтеграція віджетів "Сайт" і "Сторінки"

import { initBuilderLayout } from './builder.js?v=01051';
import { initMarketplaceStudio01087 } from './marketplace/marketplace-studio-01087.js?v=01087';
import { initAccountStudio01085 } from './account/account-studio-01085.js?v=01085';
import { initAdminStudio01087 } from './admin/admin-studio-01087.js?v=01087';
import { initBuilderUiAppearance01056 } from './ui/builder-ui-appearance-01056.js?v=01056';
import { initThemeControls } from './builder-theme.js';
import { initBackgroundPanel } from './panel-background.js';
import { initConstructorPanel } from './panel-constructor.js';
// Стара окрема панель "Сайт" більше не використовується
// import { initSitePanel } from './panel-site.js';
// Дерево сторінки тепер живе в панелі "Дизайн"
// import { initPageTreePanel } from './panel-page-tree.js';
import { initRoleSwitch } from './core/role-switch.js';
import { openTemplatesGalleryManager as openTemplatesGallerySingleOwner00886 } from './design/widgets/templates/templates-gallery-open-bridge.js?v=01050';
import { initPageAssembly01028 } from './page-assembly/page-assembly-01028.js?v=01033';

// [00388] Resize diagnostics must load before canvas resize/reflow bindings.
import './resize-diagnostics.js';

// [00876] Explicit Header/Footer output sink behind SiteFrameStore authority.
import './site-frame/site-frame-explicit-persistence.js';
// [00903] Text local Undo/Redo buttons use delegated pointerdown and stable local action history.
import './site-frame/site-frame-runtime-authority-01025.js?v=01064';
// [00892] The top Delete button removes the exact selected SiteFrame node.
import './site-frame/site-frame-delete-controller.js';

// [00848] Єдиний чистий edit-layer має реєструвати capture-listeners ДО старих canvas/HF модулів.
// Інакше старі pointerdown-перехоплювачі встигають спрацювати раніше за clean resize.
import './site-frame/site-frame-edit-layer-bridge-01027.js?v=01027';
// [00877] One clean Header/Footer authoring shell; no legacy builder modes.
import './site-frame/site-frame-builder-mode-00989.js?v=00989';
// [00877] Clean root/slot/snapshot runtime replacing legacy site-canvas-init.
import './site-frame/site-frame-workspace-runtime-01016.js?v=01040';
// [00865] Diagnostics only: proves Footer Builder UI no longer owns boot/session/live canvas DnD.
import './site-frame/site-frame-clean-engine-audit.js';

// [00544/00546] прибираємо сліди експериментальних конструкторів шапки/футера зі сховища.
// Вони не є джерелом правди для поточної гілки і тільки плутають діагностику/займають localStorage.
try { localStorage.removeItem('st_hf_frame_state_v1'); } catch {}
try { localStorage.removeItem('st_hf_engine_state_v1'); } catch {}
try { localStorage.removeItem('st_templates_store_backup_v1'); } catch {}
// js/builder-init.js
import { initDesignModeBar } from './design/design-mode-bar.js';
import { initBuilderPreview } from './builder-preview.js';
import { initBuilderHeaderToggle } from './builder-header-toggle.js';
import { initAnimatorBridge } from './animator/animator-bridge.js';
import { initAiRuntimeRehydrationIntegration } from './design/ai-command/runtime/ai-command-runtime-rehydration.js';
import { initGlobalDesignPanel } from './global-design/global-design-panel.js';
import { initElementStyleSourceControl } from './global-design/element-style-source.js';
import { initExplicitThemeApply00776 } from './global-design/explicit-theme-apply.js?v=00956';

// [КРОК 7][PAGE CONTEXT]
import { PageContext } from './state/page-context.js';

// [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
import { bootDraftMode } from './state/page-draft-mode.js';

// [START-FRESH-PAGE-TEMPLATE-2026]
// Пер-сторінкова персистенція полотна (контент сторінки)
import { siteState, saveStateNow } from './site-state.js';
import {
  getCurrentSiteIdFromStorage,
  savePageCanvasSnapshot,
  loadPageCanvasSnapshot,
  makeEmptyCanvasSnapshot,
} from './state/page-canvas-store.js';

// ✅ Глобальний міст до Галереї шаблонів.
// Факт: запит на відкриття Галереї може приходити, коли панель "Дизайн" ще не ініціалізована.
// Тому слухаємо подію 1 раз глобально і відкриваємо Галерею через динамічний import.
function cleanRootHtmlForPageSnapshot_(html) {
  try {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    doc.querySelectorAll('.st-resize, .st-resize-handle, .st-section-handle, .st-block-handle, .st-drag-handle, .st-drag-marker, .st-drop-marker, .st-col-resizer, .st-sec-resizer, .hb-panel, .fb-panel').forEach((n) => {
      try { n.remove(); } catch {}
    });
    return doc.body ? doc.body.innerHTML : String(html || '');
  } catch {
    return String(html || '');
  }
}

function attachRootHtmlToPageSnapshot_(snapshot) {
  try {
    if (!snapshot || typeof snapshot !== 'object') return snapshot;
    const root = document.querySelector('#canvasView #site-canvas #site-root') || document.getElementById('site-root');
    const html = root ? cleanRootHtmlForPageSnapshot_(root.innerHTML || '') : '';
    if (html && html.trim()) {
      snapshot.pageHTML = html;
      snapshot.rootHTML = html;
      snapshot.previewHtml = html;
    }
    const mainSnapshot01040 = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.exportMainAreaSnapshot01040?.();
    if (mainSnapshot01040 && typeof mainSnapshot01040 === 'object') {
      snapshot.siteFrameMain01040 = mainSnapshot01040;
    }
  } catch {}
  return snapshot;
}

function saveCurrentRootDomWorkspace_() {
  try {
    if (window.ST_SAVE_ROOT_DOM_HTML && typeof window.ST_SAVE_ROOT_DOM_HTML === 'function') {
      window.ST_SAVE_ROOT_DOM_HTML({ draft: false });
    }
  } catch {}
}

function isPageDraftActiveFromStorage_() {
  try {
    if (window.ST_PAGE_DRAFT_MODE && typeof window.ST_PAGE_DRAFT_MODE.isActive === 'function') {
      return !!window.ST_PAGE_DRAFT_MODE.isActive();
    }
  } catch {}
  try {
    const raw = localStorage.getItem('st_page_draft_mode_v1') || '';
    if (!raw) return false;
    const obj = JSON.parse(raw);
    return !!(obj && typeof obj === 'object' && obj.active === true);
  } catch {
    return false;
  }
}

function hasVisualWorkspaceHtml_(snapshot) {
  try {
    if (!snapshot || typeof snapshot !== 'object') return false;
    return !!String(snapshot.pageHTML || snapshot.rootHTML || snapshot.previewHtml || '').trim();
  } catch { return false; }
}

function restoreCurrentPageCanvasOnBoot_(bootState) {
  // Після F5 PageContext.boot() тільки ставить pageId і розсилає pageChanged,
  // але НЕ емiтить st-page-selected. Тому per-page snapshot міг не застосуватись,
  // і Workspace відновлювався зі старого st_site_state_v1 без стилів. Тут явно
  // підтягуємо snapshot активної сторінки, але не чіпаємо активну draft-чернетку.
  try {
    if (isPageDraftActiveFromStorage_()) return false;
    const siteId = getCurrentSiteIdFromStorage();
    const pageId = bootState?.pageId ? String(bootState.pageId) : (PageContext.get()?.pageId ? String(PageContext.get().pageId) : '');
    if (!siteId || !pageId) return false;
    const stored = loadPageCanvasSnapshot({ siteId, pageId });
    if (!stored || typeof stored !== 'object') return false;
    // На boot застосовуємо тільки snapshot із візуальним pageHTML/rootHTML/previewHtml.
    // Structural-only snapshot може бути старим і саме він затирав inline-стилі Workspace після F5.
    if (!hasVisualWorkspaceHtml_(stored)) return false;
    window.dispatchEvent(new CustomEvent('st:canvas-apply-snapshot', {
      detail: { snapshot: stored, options: { persist: true, boot: true } }
    }));
    return true;
  } catch (err) {
    console.warn('[builder-init] restoreCurrentPageCanvasOnBoot_ failed', err);
    return false;
  }
}

async function openTemplatesGalleryGlobal_(tab, options = {}) {
  try {
    try { window.ST_SHOW_workspace_VIEW && window.ST_SHOW_workspace_VIEW('canvas'); } catch (e) {}
    await openTemplatesGallerySingleOwner00886(tab || 'site', options || {});
  } catch (e) {
    console.warn('[00886][builder-init] openTemplatesGalleryGlobal_ error', e);
  }
}


// [00314][PERF] Важкі віджети дизайну більше не блокують перший запуск сторінки.
// Раніше builder-init статично імпортував panel-design.js, а він одразу тягнув десятки
// великих віджетів (меню, AI-шаблони, спецефекти, шаблони, галерею). На Live Server це
// давало довге відкриття через сотню окремих module-запитів. Тепер панель дизайну
// ініціалізується один раз: при першому відкритті "Дизайн" або тихо після першого paint.
let __stDesignPanelReadyPromise = null;
function ensureDesignPanelReady_() {
  try {
    if (window.__ST_DESIGN_PANEL_READY__ === true) return Promise.resolve(true);
  } catch {}
  if (!__stDesignPanelReadyPromise) {
    __stDesignPanelReadyPromise = import('./design/panel-design.js?v=01050')
      .then((mod) => {
        try {
          if (typeof mod.initDesignPanel === 'function') mod.initDesignPanel();
          window.__ST_DESIGN_PANEL_READY__ = true;
          document.dispatchEvent(new CustomEvent('st:design-panel-ready', { detail: { source: 'lazy-boot' } }));
          return true;
        } catch (err) {
          console.warn('[builder-init] lazy initDesignPanel failed', err);
          window.__ST_DESIGN_PANEL_READY__ = false;
          throw err;
        }
      })
      .catch((err) => {
        console.warn('[builder-init] lazy import panel-design failed', err);
        __stDesignPanelReadyPromise = null;
        return false;
      });
  }
  return __stDesignPanelReadyPromise;
}

function installLazyDesignPanelBoot_() {
  const trigger = () => { ensureDesignPanelReady_(); };

  // Клік по головному пункту "Дизайн" повинен одразу підвантажити реальні віджети.
  document.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-open-panel="design"], #navDesign');
    if (btn) trigger();
  }, true);

  // Якщо інші модулі хочуть примусово підняти дизайн-панель.
  window.addEventListener('st:ensure-design-panel-ready', trigger);

  // Якщо останньою відкритою панеллю був "Дизайн" — стартуємо після першого кадру,
  // щоб інтерфейс не висів білим/порожнім до завершення всіх import-ів.
  let shouldWarmFast = false;
  try { shouldWarmFast = localStorage.getItem('st_builder_last_settings_panel_v1') === 'design'; } catch {}
  try { shouldWarmFast = shouldWarmFast || !!document.querySelector('#navDesign.is-active'); } catch {}

  const startWarmup = () => {
    if (shouldWarmFast) {
      try { requestAnimationFrame(() => setTimeout(trigger, 0)); return; } catch {}
      setTimeout(trigger, 0);
      return;
    }
    // Інакше прогріваємо тихо трохи пізніше, щоб перше відкриття дизайну теж було швидшим.
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 900));
    try { idle(() => trigger(), { timeout: 1800 }); } catch { setTimeout(trigger, 900); }
  };

  startWarmup();
}


// [AI-SITE-GENERATOR-2026][Етап 1]
// Окремий lazy-boot для нового інспектора "AI Дизайн".
// Не підмішуємо AI-віджети в panel-design.js, щоб ручний "Дизайн" лишався стабільним.
let __stAiDesignPanelReadyPromise = null;
function ensureAiDesignPanelReady_() {
  try {
    if (window.__ST_AI_DESIGN_PANEL_READY__ === true) return Promise.resolve(true);
  } catch {}
  if (!__stAiDesignPanelReadyPromise) {
    __stAiDesignPanelReadyPromise = import('./design/ai-design/panel-ai-design.js')
      .then((mod) => {
        try {
          if (typeof mod.initAiDesignPanel === 'function') mod.initAiDesignPanel();
          window.__ST_AI_DESIGN_PANEL_READY__ = true;
          document.dispatchEvent(new CustomEvent('st:ai-design-panel-ready', { detail: { source: 'lazy-boot' } }));
          return true;
        } catch (err) {
          console.warn('[builder-init] lazy initAiDesignPanel failed', err);
          window.__ST_AI_DESIGN_PANEL_READY__ = false;
          throw err;
        }
      })
      .catch((err) => {
        console.warn('[builder-init] lazy import panel-ai-design failed', err);
        __stAiDesignPanelReadyPromise = null;
        return false;
      });
  }
  return __stAiDesignPanelReadyPromise;
}

function installLazyAiDesignPanelBoot_() {
  const trigger = () => { ensureAiDesignPanelReady_(); };

  document.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('[data-open-panel="ai-design"], #navAiDesign');
    if (btn) trigger();
  }, true);

  window.addEventListener('st:ensure-ai-design-panel-ready', trigger);

  let shouldWarmFast = false;
  try { shouldWarmFast = localStorage.getItem('st_builder_last_settings_panel_v1') === 'ai-design'; } catch {}
  try { shouldWarmFast = shouldWarmFast || !!document.querySelector('#navAiDesign.is-active'); } catch {}

  if (shouldWarmFast) {
    try { requestAnimationFrame(() => setTimeout(trigger, 0)); return; } catch {}
    setTimeout(trigger, 0);
  }
}

// [00314][PERF] AI Runtime overlay важкий, тому створюємо його тільки при відкритті.
// Rehydration лишається ранньою, щоб збережені AI-стилі не губилися після F5.
let __stAiRuntimeOverlayPromise = null;
function ensureAiRuntimeOverlayReady_() {
  if (window.__ST_AI_RUNTIME_OVERLAY_API__) return Promise.resolve(window.__ST_AI_RUNTIME_OVERLAY_API__);
  if (!__stAiRuntimeOverlayPromise) {
    __stAiRuntimeOverlayPromise = import('./design/ai-command/ui/ai-command-runtime-overlay.js')
      .then((mod) => {
        const api = (typeof mod.initAiCommandRuntimeOverlay === 'function') ? mod.initAiCommandRuntimeOverlay() : null;
        window.__ST_AI_RUNTIME_OVERLAY_API__ = api || { open: () => {} };
        return window.__ST_AI_RUNTIME_OVERLAY_API__;
      })
      .catch((err) => {
        console.warn('[builder-init] lazy AI Runtime overlay import failed', err);
        __stAiRuntimeOverlayPromise = null;
        return null;
      });
  }
  return __stAiRuntimeOverlayPromise;
}

function installLazyAiRuntimeOverlayBoot_() {
  const open = async (ev) => {
    if (ev) {
      ev.preventDefault?.();
      ev.stopPropagation?.();
    }
    const api = await ensureAiRuntimeOverlayReady_();
    try { api?.open?.(); } catch {}
  };

  const navBtn = document.getElementById('navAiRuntime');
  if (navBtn && navBtn.dataset.lazyAiRuntimeBound !== '1') {
    navBtn.dataset.lazyAiRuntimeBound = '1';
    navBtn.addEventListener('click', open, true);
  }

  window.addEventListener('st:open-ai-runtime', open);
}


function stBootMark_(key, pct, desc) {
  try { window.ST_BOOT_LOADER?.setStage?.(key, pct, desc); } catch (_) {}
  try {
    const detail = { key, pct, desc, source: 'builder-init', at: Math.round(performance.now()) };
    window.dispatchEvent(new CustomEvent('st:boot-progress', { detail }));
    document.dispatchEvent(new CustomEvent('st:boot-progress', { detail }));
  } catch (_) {}
}

function stBootResourceUpdate_() {
  try { window.ST_BOOT_LOADER?.resourceUpdate?.(); } catch (_) {}
  try {
    const detail = { resourceUpdate: true, source: 'builder-init', at: Math.round(performance.now()) };
    window.dispatchEvent(new CustomEvent('st:boot-progress', { detail }));
    document.dispatchEvent(new CustomEvent('st:boot-progress', { detail }));
  } catch (_) {}
}


document.addEventListener('DOMContentLoaded', () => {
  console.log('[builder-init] ');
  stBootMark_('dom', 14, 'DOM готовий. Запускаємо ядро конструктора.');
  stBootResourceUpdate_();

  // -----------------------------
  //   Базова ініціалізація конструктора
  // -----------------------------
  initBuilderLayout();
  try { initBuilderUiAppearance01056(); } catch (e) { console.warn('[builder-init] Builder UI Appearance 01056 init failed', e); }
  try { initMarketplaceStudio01087().catch(e => console.warn('[builder-init] Marketplace Studio 01087 async init failed', e)); } catch (e) { console.warn('[builder-init] Marketplace Studio 01087 init failed', e); }
  try { initAccountStudio01085().catch(e => console.warn('[builder-init] Account Studio 01085 async init failed', e)); } catch (e) { console.warn('[builder-init] Account Studio 01085 init failed', e); }
  try { initAdminStudio01087().catch(e => console.warn('[builder-init] Admin Studio 01087 async init failed', e)); } catch (e) { console.warn('[builder-init] Admin Studio 01087 init failed', e); }
  stBootMark_('shell', 30, 'Оболонка конструктора змонтована. Ініціалізуємо базові системи.');
  initRoleSwitch();
  initThemeControls();
  initBackgroundPanel();
  initConstructorPanel();
  try { initGlobalDesignPanel(); } catch (e) { console.warn('[builder-init] Global Design init failed', e); }
  try { initElementStyleSourceControl(); } catch (e) { console.warn('[builder-init] Element Style Source init failed', e); }
  try { initExplicitThemeApply00776(); } catch (e) { console.warn('[builder-init] Explicit Theme Apply init failed', e); }
  stBootMark_('core', 44, 'Ролі, тема, фон, глобальний дизайн і панель конструктора ініціалізовані.');
  // initSitePanel();     // не викликаємо стару панель "Сайт"
  // initPageTreePanel(); // дерево сторінки тепер окремим віджетом
   installLazyDesignPanelBoot_();
   installLazyAiDesignPanelBoot_();
   stBootMark_('widgets', 56, 'Готуємо інспектор, панелі дизайну та lazy-модулі.');

  // ✅ Глобальний слухач: інші віджети можуть просити відкрити Галерею шаблонів (Site/Page/...).
  // Працює незалежно від того, чи зараз активна панель "Дизайн".
  if (!window.__ST_TEMPLATES_GALLERY_BRIDGE_GLOBAL__) {
    window.__ST_TEMPLATES_GALLERY_BRIDGE_GLOBAL__ = true;
    window.addEventListener('st:open-templates-gallery', (ev) => {
      const detail = (ev && ev.detail && typeof ev.detail === 'object') ? ev.detail : {};
      const tab = detail.tab ? String(detail.tab) : 'site';
      openTemplatesGalleryGlobal_(tab, detail);
    });
  }
   initDesignModeBar();
   initBuilderPreview();
   initBuilderHeaderToggle();
   initAnimatorBridge();
   stBootMark_('canvas', 68, 'Підключено canvas, шапку, футер і аніматор.');
   stBootMark_('templates', 74, 'Галерея та великі бібліотеки шаблонів у lazy-режимі, старт не блокують.');
   stBootResourceUpdate_();
   installLazyAiRuntimeOverlayBoot_();
   try { initAiRuntimeRehydrationIntegration(); } catch (e) { console.warn('[builder-init] AI runtime rehydration init failed', e); }
   

   // [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
  // ВАЖЛИВО: bootDraftMode має бути ДО PageContext.boot(), щоб усі обробники,
  // які реагують на pageChanged під час старту, вже бачили активний draft-mode.
  bootDraftMode();

  // [КРОК 7][PAGE CONTEXT] старт — підхопити pageId після перезавантаження (F5)
  const __stBootPageState = PageContext.boot();
  try { initPageAssembly01028(); } catch (e) { console.warn('[builder-init] Page Assembly 01029 init failed', e); }
  stBootMark_('workspace', 84, 'Відновлюємо активну сторінку та стан робочої області.');

  // [FIX][PAGE SNAPSHOT RELOAD]
  // На F5 явно підтягуємо per-page canvas snapshot активної сторінки.
  // Без цього полотно могло відновитися зі старого st_site_state_v1 і втратити inline-стилі.
  try { restoreCurrentPageCanvasOnBoot_(__stBootPageState); } catch {}
  stBootMark_('state', 92, 'Полотно сторінки відновлено. Синхронізуємо стан і події.');

  // [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
  // Ctrl+S / Cmd+S = "Зберегти сторінку" (коміт чернетки, якщо активна)
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;
    if (String(e.key || '').toLowerCase() !== 's') return;
    try {
      if (window.ST_PAGE_DRAFT_MODE?.isActive?.()) {
        e.preventDefault();
        const ok = window.ST_PAGE_DRAFT_MODE.commitToPage?.();
        if (ok) {
          try { window.alert('Сторінку збережено (чернетка застосована).'); } catch {}
        }
      }
    } catch {}
  });

  // [START-FRESH-PAGE-TEMPLATE-2026]
  // Мінімальний запобіжник: при F5/закритті вкладки зберігаємо полотно
  // поточної сторінки в pages-state, щоб не залежати тільки від st_site_state_v1.
  window.addEventListener('beforeunload', () => {
    // Draft Mode: якщо активний draft — НЕ комітимо автоматично.
    // Див. guards у page-draft-mode.js (browser prompt).
    try {
      if (window.ST_PAGE_DRAFT_MODE?.isActive?.()) return;
    } catch {}
    try {
      const siteId = getCurrentSiteIdFromStorage();
      const cur = PageContext.get();
      const curPageId = cur?.pageId;
      if (!siteId || !curPageId) return;
      const snap = attachRootHtmlToPageSnapshot_(JSON.parse(JSON.stringify(siteState)));
      savePageCanvasSnapshot({ siteId, pageId: curPageId, snapshot: snap });
      saveCurrentRootDomWorkspace_();
    } catch {}
  });

  // [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
  // Явний "Зберегти сторінку" з PageManager.
  // - Якщо є чернетка з шаблону — комітимо.
  // - Якщо чернетки немає — просто записуємо поточне полотно в pages-state.
  window.addEventListener('st:page-save-request', (e) => {
    const reqPageId = e?.detail?.pageId ? String(e.detail.pageId) : null;
    const silentSave = e?.detail?.silent === true;
    const cur = PageContext.get();
    const curPageId = cur?.pageId ? String(cur.pageId) : null;
    if (!curPageId || (reqPageId && reqPageId !== curPageId)) return;

    // 1) Draft commit
    try {
      if (window.ST_PAGE_DRAFT_MODE?.isActive?.()) {
        const ok = window.ST_PAGE_DRAFT_MODE.commitToPage?.();
        if (ok) {
          if (!silentSave) { try { window.alert('Сторінку збережено (чернетка застосована).'); } catch {} }
          return;
        }
      }
    } catch {}

    // 2) Normal manual save
    try {
      const siteId = getCurrentSiteIdFromStorage();
      if (!siteId) return;
      const snap = attachRootHtmlToPageSnapshot_(JSON.parse(JSON.stringify(siteState)));
      savePageCanvasSnapshot({ siteId, pageId: curPageId, snapshot: snap });
      saveCurrentRootDomWorkspace_();
      try { saveStateNow(); } catch {}
      if (!silentSave) { try { window.alert('Сторінку збережено.'); } catch {} }
    } catch {}
  });




   
   // --- PageManager -> Builder: вибір сторінки і перехід у Дизайн ---
// --- PageManager -> Builder: вибір сторінки і перехід у Дизайн ---

// =======================================================
// [КРОК 7][PAGE CONTEXT] PageManager -> Builder (обрали сторінку)
// =======================================================


document.addEventListener("st-page-selected", (e) => {
  const pageId = e?.detail?.pageId ?? null;
  const title  = e?.detail?.page?.title ?? e?.detail?.title ?? "";

  // =======================================================
  // [FIX][SHIFT-SITES-2025] Apply per-page header bundle on page select
  // Snapshot сторінки може бути "bundle" з headerMode/headerHTML (створюється SiteManager).
  // Якщо не записати це у st_header_state_v1 + st_header_mode_pages_v1,
  // runtime буде показувати лише global header.
  // =======================================================
  try {
    const siteId = getCurrentSiteIdFromStorage();
    const pid = pageId ? String(pageId) : null;
    if (siteId && pid) {
      const raw = localStorage.getItem('st_site_pages_state_v1');
      const map = raw ? JSON.parse(raw) : {};
      const key = String(siteId) + ':' + pid;
      const snap = map ? map[key] : null;

      if (snap && typeof snap === 'object' && snap.__st_bundle_v1 === true) {
        const isHome = (pid === 'page_home');

        // RULE:
        // - Home: завжди GLOBAL (незалежно від snapshot)
        // - Усі інші сторінки: завжди PAGE (щоб не було випадкового fallback на global)
        const forcedMode = isHome ? 'global' : 'page';

        // html беремо зі snapshot, якщо є
        let html = (typeof snap.headerHTML === 'string') ? snap.headerHTML : '';

        // Якщо це НЕ home і snapshot не дав html — беремо з уже збереженого st_header_state_v1 (fallback)
        if (!isHome && !html) {
          try {
            const hsRaw0 = localStorage.getItem('st_header_state_v1');
            const hs0 = hsRaw0 ? JSON.parse(hsRaw0) : {};
            html = (hs0 && hs0.pages && hs0.pages[pid] && typeof hs0.pages[pid].html === 'string')
              ? hs0.pages[pid].html
              : '';
          } catch {}
        }

        // 1) mode map
        try {
          const mmRaw = localStorage.getItem('st_header_mode_pages_v1');
          const mm = mmRaw ? JSON.parse(mmRaw) : {};
          mm[pid] = forcedMode;
          localStorage.setItem('st_header_mode_pages_v1', JSON.stringify(mm));
        } catch {}

        // 2) header state (global + pages html)
        // Home НЕ перезаписуємо pages[home].html, щоб не псувати дані.
        if (!isHome && html) {
          try {
            const hsRaw = localStorage.getItem('st_header_state_v1');
            const hs = hsRaw ? JSON.parse(hsRaw) : {};
            if (hs && typeof hs === 'object') {
              hs.v = 1;
              hs.global = hs.global && typeof hs.global === 'object' ? hs.global : { html: '' };
              hs.pages = hs.pages && typeof hs.pages === 'object' ? hs.pages : {};
              hs.pages[pid] = hs.pages[pid] && typeof hs.pages[pid] === 'object' ? hs.pages[pid] : { html: '' };
              hs.pages[pid].html = html;
              localStorage.setItem('st_header_state_v1', JSON.stringify(hs));
            }
          } catch {}
        }

        // [DEBUG] якщо для не-home немає html навіть після fallback — це причина global в UI
        if (!isHome && !html) {
          console.warn('[HEADER][bundle] no page headerHTML for pageId -> runtime may show global', { pid, siteId });
        }
      }
    }
  } catch (err) {
    // тихо і без ломання
  }

  // =======================================================
  // [FIX][FOOTER][bundle] Apply per-page footer bundle on page select
  // Те саме, що вище для header: якщо snapshot сторінки містить footerHTML/footerLS,
  // треба оновити st_footer_state_v1 + ST_FOOTER_STATE ДО фінального runtime sync.
  // Інакше футер з'являвся тільки після першого reload.
  // =======================================================
  try {
    const siteId = getCurrentSiteIdFromStorage();
    const pid = pageId ? String(pageId) : null;
    if (siteId && pid) {
      const raw = localStorage.getItem('st_site_pages_state_v1');
      const map = raw ? JSON.parse(raw) : {};
      const key = String(siteId) + ':' + pid;
      const snap = map ? map[key] : null;

      if (snap && typeof snap === 'object' && snap.__st_bundle_v1 === true) {
        const footerMode = (snap.footerMode === 'page' || snap.footerMode === 'global') ? snap.footerMode : 'global';
        let footerHtml = (typeof snap.footerHTML === 'string') ? snap.footerHTML.trim() : '';

        if (!footerHtml && snap.footerLS && typeof snap.footerLS === 'object') {
          try {
            const stRaw = snap.footerLS['st_footer_state_v1'];
            const st = stRaw ? JSON.parse(stRaw) : null;
            if (st && typeof st === 'object') {
              const pageHtml = st.pages && st.pages[pid] && typeof st.pages[pid].html === 'string' ? st.pages[pid].html : '';
              const globalHtml = st.global && typeof st.global.html === 'string' ? st.global.html : '';
              footerHtml = String((footerMode === 'page' && pageHtml.trim()) ? pageHtml : (globalHtml || pageHtml || '')).trim();
            }
          } catch {}
        }

        if (footerHtml) {
          try {
            const mmRaw = localStorage.getItem('st_footer_mode_pages_v1');
            const mm = mmRaw ? JSON.parse(mmRaw) : {};
            mm[pid] = footerMode;
            localStorage.setItem('st_footer_mode_pages_v1', JSON.stringify(mm));
          } catch {}

          try {
            const FS_KEY = 'st_footer_state_v1';
            let fs = null;
            try { fs = JSON.parse(localStorage.getItem(FS_KEY) || 'null'); } catch {}
            if (!fs || typeof fs !== 'object') fs = { v: 1, global: { html: '' }, pages: {} };
            if (!fs.global || typeof fs.global !== 'object') fs.global = { html: '' };
            if (!fs.pages || typeof fs.pages !== 'object') fs.pages = {};
            if (footerMode === 'global') fs.global.html = footerHtml;
            else {
              fs.pages[pid] = fs.pages[pid] && typeof fs.pages[pid] === 'object' ? fs.pages[pid] : {};
              fs.pages[pid].html = footerHtml;
            }
            fs.v = 1;
            localStorage.setItem(FS_KEY, JSON.stringify(fs));
          } catch {}

          try {
            const FS = window.ST_FOOTER_STATE;
            if (FS) {
              if (footerMode === 'global' && typeof FS.setGlobalHTML === 'function') FS.setGlobalHTML(footerHtml);
              if (footerMode === 'page' && typeof FS.setPageHTML === 'function') FS.setPageHTML(pid, footerHtml);
            }
          } catch {}
        }
      }
    }
  } catch (err) {
    // тихо і без ломання
  }


  // [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
  // Якщо зараз відкрито шаблон як чернетку — не даємо тихо піти на іншу сторінку.
  // Потрібна явна дія: або застосувати (коміт), або відхилити (discard), або скасувати перехід.
  try {
    if (window.ST_PAGE_DRAFT_MODE?.isActive?.()) {
      const siteId = getCurrentSiteIdFromStorage();
      const prev = PageContext.get();
      const prevPageId = prev?.pageId ? String(prev.pageId) : null;
      const nextPageId = pageId ? String(pageId) : null;

      const revertCurrentPageId_ = () => {
        try {
          const LS_KEY_SITES = 'st_sites';
          const raw = localStorage.getItem(LS_KEY_SITES) || '';
          const sites = raw ? JSON.parse(raw) : [];
          if (!Array.isArray(sites)) return;
          const s = sites.find(x => x && (x.id === siteId || x.slug === siteId || x.code === siteId));
          if (s && prevPageId) s.currentPageId = prevPageId;
          localStorage.setItem(LS_KEY_SITES, JSON.stringify(sites));
        } catch {}
      };

      if (siteId && prevPageId && nextPageId && nextPageId !== prevPageId) {
        const apply = window.confirm('Є відкрита чернетка з шаблону.\n\nЗастосувати її до сторінки ПЕРЕД переходом?');
        if (apply) {
          const ok = window.ST_PAGE_DRAFT_MODE.commitToPage?.();
          if (!ok) {
            // якщо з якоїсь причини commit не відбувся — краще не переходити
            revertCurrentPageId_();
            return;
          }
        } else {
          const discard = window.confirm('Тоді чернетка НЕ буде застосована.\n\nВідхилити чернетку і ПЕРЕЙТИ?');
          if (discard) {
            window.ST_PAGE_DRAFT_MODE.discard?.();
          } else {
            // cancel navigation
            revertCurrentPageId_();
            return;
          }
        }
      }
    }
  } catch {}

  // [START-FRESH-PAGE-TEMPLATE-2026]
  // 0) Перед перемиканням — зберігаємо полотно поточної сторінки в мапу (siteId:pageId)
  //    Це НЕ шаблони. Це саме сторінки сайту.
  try {
    const siteId = getCurrentSiteIdFromStorage();
    const prev = PageContext.get();
    const prevPageId = prev?.pageId;

    if (siteId && prevPageId) {
      const snap = attachRootHtmlToPageSnapshot_(JSON.parse(JSON.stringify(siteState)));
      savePageCanvasSnapshot({ siteId, pageId: prevPageId, snapshot: snap });
      saveCurrentRootDomWorkspace_();
    }
  } catch (err) {
    console.warn('[builder-init] save prev page snapshot failed', err);
  }

  console.log("[builder-init] st-page-selected:", { pageId, title });

  // [SHIFT-SITES-2025] silent=true => не перемикаємо панель у 'Дизайн' (лише вибір/підсвітка)
  const __stSilentSelect = !!(e && e.detail && e.detail.silent);


  // 1) Записуємо активну сторінку централізовано
  PageContext.set({ pageId, title });

  // 1.0) Синхронізуємо назву сторінки у шапці ("Сторінка:")
  // Працює і для вибору зі "Шаблони/Сайт/Сторінки сайту", і для PageManager.
  try {
    setCurrentPageTitle(e?.detail?.page || { title });
  } catch {}

  // [START-FRESH-PAGE-TEMPLATE-2026]
  // 1.1) Після встановлення нової active page — підтягуємо canvas snapshot цієї сторінки
  //      (або створюємо пустий, якщо сторінка ще не має контенту)
  try {
    const siteId = getCurrentSiteIdFromStorage();
    const targetPageId = pageId ? String(pageId) : null;
    if (siteId && targetPageId) {
      const stored = loadPageCanvasSnapshot({ siteId, pageId: targetPageId });
      const nextSnap = stored && typeof stored === 'object'
        ? stored
        : makeEmptyCanvasSnapshot(targetPageId);

      // Застосовуємо через існуючий API полотна
      window.dispatchEvent(new CustomEvent('st:canvas-apply-snapshot', { detail: { snapshot: nextSnap } }));

      // І одразу синхронізуємо поточний ключ (st_site_state_v1), щоб автозбереження працювало прогнозовано
      try { saveStateNow(); } catch {}
    }
  } catch (err) {
    console.warn('[builder-init] load target page snapshot failed', err);
  }

  // 2) Повертаємось у конструктор і відкриваємо дизайн
  // [DEBUG][SHIFT-SITES-2025]
  // Якщо вибір сторінки прийшов з кнопки "Сайт" (SiteManager.openPanel емiтить st-page-selected),
  // НЕ перекидаємо canvas/дизайн — залишаємо користувача в "Налаштування сайту".
  try {
    const mark = window.__ST_SITE_BTN_OPEN__;
    const recent = mark && mark.at && (Date.now() - mark.at) < 1200;
    if (recent) {
      console.log('[builder-init] st-page-selected suppressed showCanvas() due to __ST_SITE_BTN_OPEN__', { pageId });
    } else {
      // ✅ silent=true: НЕ переводимо користувача у canvas/дизайн.
      // Лише оновлюємо active page + snapshot у фоні.
      if (!__stSilentSelect) {
        showCanvas();

        const btn = document.querySelector('[data-open-panel="design"]');
        if (btn) btn.click();
      }
    }
  } catch (_) {
    // fallback to previous behavior
    if (!__stSilentSelect) {
      showCanvas();

      const btn = document.querySelector('[data-open-panel="design"]');
      if (btn) btn.click();
    }
  }

  // 3) Синхронізуємо шапку + футер
  try { window.SiteHeaderRuntime?.sync?.(); } catch {}
  try { window.SiteFooterRuntime?.sync?.(); } catch {}
});


















  // -----------------------------
  //   Елементи DOM, з якими працюємо
  // -----------------------------

   
  const root = document.getElementById('builder-root');

  // -----------------------------
  //   DOM-елементи, з якими працюємо
  // -----------------------------
  const navSiteBtn  = document.getElementById('navSite');
  const navPagesBtn = document.getElementById('navPages');

  const siteManagerView = document.getElementById('siteManagerView');
  const pageManagerView = document.getElementById('pageManagerView');
  const canvasView      = document.getElementById('canvasView');
  const siteTemplateBuilderView = document.getElementById('siteTemplateBuilderView');
  const siteTplBuilderMount = document.getElementById('siteTplBuilderMount');
  const siteTplBuilderBackBtn = document.getElementById('siteTplBuilderBackBtn');
  const canvasHeader    = document.querySelector('.canvas__header');
  const canvasScroll    = document.querySelector('.canvas__scroll'); // ⬅ основний скрол полотна

  const siteTitleWrap = document.getElementById('builder-site-title');
  const siteTitleName = siteTitleWrap
    ? siteTitleWrap.querySelector('.builder-site-title__name')
    : null;

  // -----------------------------
  //   Допоміжні функції
  // -----------------------------

  function hardShow(el) {
    if (!el) return;
    el.hidden = false;
    el.style.display = '';
  }

  function hardHide(el) {
    if (!el) return;
    el.hidden = true;
    el.style.display = 'none';
  }

  // Встановити назву поточного сайту у верхній шапці
 // Встановити назву поточного сайту у верхній шапці
  function setCurrentSiteTitle(site) {
    if (!siteTitleWrap || !siteTitleName) return;

    const name =
      (site && (site.name || site.title || site.slug)) ||
      '';

    siteTitleName.textContent = name ? name : 'САЙТ НЕ ВИБРАНИЙ';
    siteTitleWrap.hidden = false;
  }

  // Скинути скрол полотна при перемиканні режимів
  function resetCanvasScroll() {
    if (canvasScroll) {
      canvasScroll.scrollTop = 0;
    }
  }

	// Встановити назву поточної сторінки у верхній шапці (best-effort)
	function setCurrentPageTitle(page) {
	  const pageName =
	    (page && (page.name || page.title || page.slug || page.id)) || '';

	  // 1) основний елемент у шапці (має label + name)
	  const wrap = document.getElementById('builder-page-title');
	  const nameEl = wrap ? wrap.querySelector('.builder-page-title__name') : null;
	  if (wrap && nameEl) {
	    nameEl.textContent = pageName || '—';
	    // Показуємо завжди: якщо сторінка не вибрана — лишається "—"
	    wrap.hidden = false;
	    return;
	  }

	  // 2) fallback: якщо з якихось причин немає wrap — додамо маленький підпис під назвою сайту
	  if (siteTitleWrap) {
	    let sub = siteTitleWrap.querySelector('.builder-site-title__page');
	    if (!sub) {
	      sub = document.createElement('div');
	      sub.className = 'builder-site-title__page';
	      sub.style.opacity = '0.85';
	      sub.style.fontSize = '12px';
	      sub.style.marginTop = '2px';
	      siteTitleWrap.appendChild(sub);
	    }
	    sub.textContent = pageName ? `Сторінка: ${pageName}` : 'Сторінка: —';
	  }
	}



  // Показати віджет "Сайт"
 function showSiteManager() {
    console.log('[builder-init] showSiteManager()');
    if (root) {
      root.classList.add('builder--mode-site');
      root.classList.remove('builder--mode-pages');
    }

    resetCanvasScroll();

    hardShow(siteManagerView);
    hardHide(pageManagerView);
    hardHide(canvasView);
    hardHide(canvasHeader); 
    hardHide(siteTemplateBuilderView);






    if (window.SiteManager && typeof window.SiteManager.openPanel === 'function') {
      try {
        window.SiteManager.openPanel();
      } catch (err) {
        console.warn('[builder-init] SiteManager.openPanel() error', err);
      }
    }
  }

  // Показати віджет "Сторінки"
    function showPageManager() {
    console.log('[builder-init] showPageManager()');
    if (root) {
      root.classList.add('builder--mode-pages');
      root.classList.remove('builder--mode-site');
    }

    resetCanvasScroll();

    hardHide(siteManagerView);
    hardShow(pageManagerView);
    hardHide(canvasView);
    hardHide(canvasHeader); 
    hardHide(siteTemplateBuilderView);




    if (window.PageManager && typeof window.PageManager.openPanel === 'function') {
      try {
        window.PageManager.openPanel();
      } catch (err) {
        console.warn('[builder-init] PageManager.openPanel() error', err);
      }
    }
  }

  // Показати звичайний конструктор (canvas)
  function showCanvas() {
    console.log('[builder-init] showCanvas()');
    if (root) {
      root.classList.remove('builder--mode-site', 'builder--mode-pages');
    }

    resetCanvasScroll();

    hardHide(siteManagerView);
    hardHide(pageManagerView);
    hardShow(canvasView);
    hardShow(canvasHeader);
    hardHide(siteTemplateBuilderView);
  }

  function showSiteTemplateBuilder() {
    console.log('[builder-init] showSiteTemplateBuilder()');
    if (root) {
      // залишаємо builder без mode-site/pages, але ховаємо canvas
      root.classList.remove('builder--mode-site', 'builder--mode-pages');
    }

    resetCanvasScroll();

    hardHide(siteManagerView);
    hardHide(pageManagerView);
    hardHide(canvasView);
    hardHide(canvasHeader);

    hardShow(siteTemplateBuilderView);

    // перемістити DOM конструктора у mount (він створюється модульним віджетом)
    try {
      if (window.STSiteTemplateBuilder && typeof window.STSiteTemplateBuilder.attachTo === 'function') {
        window.STSiteTemplateBuilder.attachTo(siteTplBuilderMount);
      }
    } catch (err) {
      console.warn('[builder-init] attach site template builder failed:', err);
    }
  }

  function hideSiteTemplateBuilder() {
    console.log('[builder-init] hideSiteTemplateBuilder()');
    hardHide(siteTemplateBuilderView);

    // повертаємось у canvas
    showCanvas();

    // повернути DOM назад у sidebar placeholder (якщо є)
    try {
      if (window.STSiteTemplateBuilder && typeof window.STSiteTemplateBuilder.detachToSidebar === 'function') {
        window.STSiteTemplateBuilder.detachToSidebar();
      }
    } catch (err) {
      console.warn('[builder-init] detach site template builder failed:', err);
    }
  }



  // --- PageManager -> Builder: вибір сторінки і перехід у Дизайн ---
window.addEventListener("st-page-selected", (e) => {
  const d = e?.detail || {};

  // ✅ Якщо подія прийшла від SiteManager (має d.site) — оновимо назву відкритого сайту у шапці.
  // Це не змінює основний пайплайн перемикання сторінок (він нижче ретранслюється на document).
  try {
    const maybeSite = d.site || d.currentSite || d.siteData || null;
    if (maybeSite) setCurrentSiteTitle(maybeSite);
  } catch {}

  // pageId приходить як d.page.id (а НЕ d.pageId)
  const pageId =
    d.pageId ??
    d.page?.id ??
    d.page?.pageId ??
    null;

  const pageTitle =
    d.page?.title ??
    d.page?.name ??
    d.page?.slug ??
    "";

  console.log("[builder-init] st-page-selected:", { pageId, pageTitle, detail: d });

  // =======================================================
  // START-FRESH-PAGE-TEMPLATE-2026
  // ВАЖЛИВО: подія "st-page-selected" у проекті часто емiтиться на window
  // (наприклад, віджет SiteManager), але основний пайплайн перемикання сторінок
  // (save prev snapshot -> load next snapshot (bundle) -> apply header/footer)
  // пов'язаний з document.addEventListener("st-page-selected", ...).
  //
  // Тому тут робимо міст: ретранслюємо подію на document у нормалізованому форматі.
  // Це дає:
  // - коректне підвантаження snapshot сторінки з st_site_pages_state_v1
  // - коректне відновлення page-header з bundle.headerMode/headerHTML
  //
  // ⚠️ Щоб не робити подвійні дії (showCanvas/click design/sync),
  // після ретрансляції виходимо з цього хендлера.
  // =======================================================
  try {
    document.dispatchEvent(new CustomEvent('st-page-selected', {
      detail: {
        pageId,
        title: pageTitle,
        page: {
          id: pageId,
          title: pageTitle,
          name: pageTitle
        },
        // ✅ "Тихий" вибір сторінки (PageManager): не повинно переводити користувача у Дизайн
        silent: !!d.silent,
        source: d.source || undefined,
        // ✅ пробросимо site (якщо був), щоб downstream міг оновити title/site-context
        site: d.site || d.currentSite || d.siteData || undefined,
        // пробросимо оригінальний detail, щоб нічого не втратити
        __from_window: true,
        __raw: d
      }
    }));
  } catch {}

  // Далі логіку перемикання сторінок виконує document-listener вище.
  return;

  // 1) проставляємо активну сторінку на #site-root (для header-widget/runtime)
  const root = document.getElementById("site-root");
  if (root) {
    if (pageId != null) root.dataset.pageId = String(pageId);
    else delete root.dataset.pageId;
  }

  // 2) оновлюємо назву активної сторінки в шапці (якщо елемент існує)
  const pageTitleWrap = document.getElementById("builder-page-title");
  const pageTitleName = pageTitleWrap?.querySelector(".builder-page-title__name");
  if (pageTitleWrap && pageTitleName) {
    pageTitleName.textContent = pageTitle || "—";
    pageTitleWrap.hidden = !pageTitle;
  }

  // 3) шлемо подію всім віджетам, що сторінка змінилась
  document.dispatchEvent(new CustomEvent("builder:pageChanged", { detail: { pageId } }));
  document.dispatchEvent(new CustomEvent("st:page-changed", { detail: { pageId } }));

  // 4) точно повертаємось у canvas і відкриваємо "Дизайн"
  try { showCanvas(); } catch {}

  const btnDesign = document.querySelector('[data-open-panel="design"]');
  if (btnDesign) btnDesign.click();
  else console.warn("[builder-init] Не знайшов кнопку [data-open-panel='design']");

  // 5) sync шапки (якщо runtime є)
  try { window.SiteHeaderRuntime?.sync?.(); } catch {}
});


  // -----------------------------
  //   Обробники кліків
  // -----------------------------

  

  // --- Open/Close Site Template Builder (from Templates widgets) ---
  document.addEventListener('st:open-site-template-builder', () => {
    showSiteTemplateBuilder();
  });

  document.addEventListener('st:close-site-template-builder', () => {
    hideSiteTemplateBuilder();
  });

  if (siteTplBuilderBackBtn) {
    siteTplBuilderBackBtn.addEventListener('click', () => {
      hideSiteTemplateBuilder();
    });
  }

// Прямі кліки по кнопкам у головному сайтбарі
  if (navSiteBtn) {
    navSiteBtn.addEventListener('click', () => {
      showSiteManager();
    });
  }

  if (navPagesBtn) {
    navPagesBtn.addEventListener('click', () => {
      showPageManager();
    });
  }

  // Делегування по всіх елементах із data-open-panel
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-panel]');
    if (btn) {
      const panel = btn.dataset.openPanel;
      console.log('[builder-init] data-open-panel click:', panel);

      if (panel === 'site') {
        // Панель "Сайт"
        showSiteManager();
      } else if (panel === 'pages') {
        // Панель "Сторінки"
        showPageManager();
      } else if (panel) {
        // Усі інші панелі → повертаємось у конструктор
        showCanvas();
      }
    }

    // Перемикання через вкладки правого сайтбара (на майбутнє)
    const tab = e.target.closest('.builder__settings-tab');
    if (tab) {
      const panel = tab.dataset.panel;
      if (panel === 'site') {
        showSiteManager();
      } else if (panel === 'pages') {
        showPageManager();
      } else if (panel) {
        showCanvas();
      }
    }
  });

  // -----------------------------
  //   Події від віджета "Сайт"
  // -----------------------------
  // Коли віджет каже "цей сайт/сторінка обрана" — оновлюємо назву і повертаємось у конструктор.
  const handleSiteEvent = (e) => {
    const d = e.detail || {};
    const site = d.site || d.currentSite || d.siteData || null;

    console.log('[builder-init] site event', e.type, d);

    if (site) {
      setCurrentSiteTitle(site);
    }
    // БЕЗ showCanvas();
  };

  // ✅ Синхронізація назви відкритого сайту у шапці.
  // SiteManager емiтить ці події на window через emitEvent(...).
  try { window.addEventListener('st-site-selected', handleSiteEvent); } catch {}
  try { window.addEventListener('st-site-open', handleSiteEvent); } catch {}

  try {
    stBootResourceUpdate_();
    stBootMark_('ready', 100, 'Конструктор готовий до роботи.');
    window.dispatchEvent(new CustomEvent('st:builder-ready', { detail: { source: 'builder-init' } }));
    document.dispatchEvent(new CustomEvent('st:builder-ready', { detail: { source: 'builder-init' } }));
  } catch {}

});
