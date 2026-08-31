// js/state/page-draft-mode.js
// [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
// Мета: "Відкрити шаблон" НЕ має одразу перетирати сторінку сайту.
// Ми застосовуємо шаблон у canvas як тимчасову чернетку.
// Лише після явної дії "Зберегти сторінку" — чернетка комітиться в pages-state.

import { siteState, saveStateToPrimaryNow, clearDraftStateStorage } from '../site-state.js';
import { getCurrentSiteIdFromStorage, savePageCanvasSnapshot } from './page-canvas-store.js';
import { PageContext } from './page-context.js';

const LS_MODE_KEY = 'st_page_draft_mode_v1';
const ST_SITE_ROOT_DOM_DISABLED_KEY = 'st_site_root_dom_disabled_v1';
const ST_SITE_ROOT_DOM_DRAFT_KEY = 'st_site_root_dom_draft_v1';

function cleanRootHtmlForSnapshot_(html) {
  try {
    const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
    doc.querySelectorAll('.st-resize, .st-resize-handle, .st-section-handle, .st-block-handle, .st-drag-handle, .st-col-resizer, .st-sec-resizer, .hb-panel, .fb-panel').forEach((n) => {
      try { n.remove(); } catch {}
    });
    return doc.body ? doc.body.innerHTML : String(html || '');
  } catch {
    return String(html || '');
  }
}

function getCurrentRootHtml_() {
  try {
    const root = document.querySelector('#canvasView #site-canvas #site-root') || document.getElementById('site-root');
    return root ? cleanRootHtmlForSnapshot_(root.innerHTML || '') : '';
  } catch {
    return '';
  }
}

function attachRootHtml_(snapshot) {
  try {
    if (!snapshot || typeof snapshot !== 'object') return snapshot;
    const html = getCurrentRootHtml_();
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

function saveRootDomDisabled_(pageId) {
  return false;
}


function clearRootDomDraft_() {
  try { localStorage.removeItem(ST_SITE_ROOT_DOM_DRAFT_KEY); } catch {}
}

function safeJsonParse_(raw, fallback = null) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function deepCopy_(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function readMode_() {
  const raw = localStorage.getItem(LS_MODE_KEY) || '';
  const m = raw ? safeJsonParse_(raw, null) : null;
  return (m && typeof m === 'object') ? m : null;
}

function writeMode_(m) {
  try { localStorage.setItem(LS_MODE_KEY, JSON.stringify(m)); } catch {}
}

function clearMode_() {
  try { localStorage.removeItem(LS_MODE_KEY); } catch {}
}

function isActive_() {
  const m = readMode_();
  return !!(m && m.active === true);
}

function get_() {
  return readMode_();
}

function enterFromTemplate_({ templateId, templateName } = {}) {
  // Якщо вже активний draft — не перезапускаємо.
  if (isActive_()) return false;

  const cur = PageContext.get();
  const pageId = cur?.pageId ? String(cur.pageId) : null;
  const siteId = getCurrentSiteIdFromStorage();
  if (!siteId || !pageId) return false;

  const original = attachRootHtml_(deepCopy_(siteState));

  const mode = {
    v: 1,
    active: true,
    siteId,
    pageId,
    templateId: templateId ? String(templateId) : null,
    templateName: templateName ? String(templateName) : '',
    startedAt: Date.now(),
    originalSnapshot: original,
  };
  writeMode_(mode);
  return true;
}

function commitToPage_() {
  const mode = readMode_();
  if (!mode || mode.active !== true) return false;

  const siteId = String(mode.siteId || '') || getCurrentSiteIdFromStorage();
  const pageId = String(mode.pageId || '') || PageContext.get()?.pageId;
  if (!siteId || !pageId) return false;

  // 1) Комітимо canvas у pages-state (це і є "Зберегти сторінку")
  try {
    const snap = attachRootHtml_(deepCopy_(siteState));
    savePageCanvasSnapshot({ siteId, pageId, snapshot: snap });
  } catch {}

  // 2) Записуємо в основний ключ (щоб після F5 відкрилось те саме)
  try { saveStateToPrimaryNow(); } catch {}
  try { saveRootDomDisabled_(pageId); } catch {}

  // 3) Чистимо draft storage
  try { clearDraftStateStorage(); } catch {}
  try { clearRootDomDraft_(); } catch {}
  clearMode_();
  return true;
}

function discard_() {
  const mode = readMode_();
  if (!mode || mode.active !== true) return false;

  const original = mode.originalSnapshot;
  // Повертаємо original у canvas (не персистимо як сторінку)
  try {
    window.dispatchEvent(new CustomEvent('st:canvas-apply-snapshot', {
      detail: { snapshot: original, options: { persist: false } }
    }));
  } catch {}

  try { clearDraftStateStorage(); } catch {}
  try { clearRootDomDraft_(); } catch {}
  clearMode_();
  return true;
}

function bindGuards_() {
  // 1) Захист від випадкового F5/закриття: якщо є draft — показуємо нативний браузерний prompt
  window.addEventListener('beforeunload', (e) => {
    if (!isActive_()) return;
    try {
      e.preventDefault();
      e.returnValue = '';
    } catch {}
  });
}

export function bootDraftMode() {
  // Публікуємо API глобально — ним користуються віджети/галерея/ініт.
  if (!window.ST_PAGE_DRAFT_MODE) {
    window.ST_PAGE_DRAFT_MODE = {
      isActive: isActive_,
      get: get_,
      enterFromTemplate: enterFromTemplate_,
      commitToPage: commitToPage_,
      discard: discard_,
    };
  }
  bindGuards_();
}
