// js/state/page-canvas-store.js
// =======================================================
// START-FRESH-PAGE-TEMPLATE-2026
// Мінімальна персистенція полотна ДЛЯ КОЖНОЇ сторінки сайту.
//
// Проблема FIX5: siteState зберігався в одному ключі (st_site_state_v1),
// тому всі сторінки відкривались з однаковим контентом.
//
// Рішення v0:
// - Тримаємо мапу snapshot'ів полотна за ключем `${siteId}:${pageId}`.
// - При перемиканні сторінки: зберігаємо поточний snapshot, потім завантажуємо snapshot цільової сторінки
//   і застосовуємо через існуючий API `st:canvas-apply-snapshot`.
// =======================================================

const KEY = 'st_site_pages_state_v1';

export function getCurrentSiteIdFromStorage() {
  try {
    const raw = localStorage.getItem('st_sites_current');
    if (!raw) return null;

    // st_sites_current у проекті може бути:
    // 1) просто рядок з id (старий формат)
    // 2) JSON-об'єкт { id / siteId / slug } (новий формат)
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed.id || parsed.siteId || parsed.slug || null;
      if (typeof parsed === 'string') return parsed;
      return null;
    } catch {
      // fallback: старий формат (звичайний рядок)
      return raw;
    }
  } catch {
    return null;
  }
}


function k_(siteId, pageId) {
  const s = siteId ? String(siteId) : '';
  const p = pageId ? String(pageId) : '';
  return s && p ? `${s}:${p}` : '';
}

function readAll_() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll_(map) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map || {}));
  } catch {}
}

export function savePageCanvasSnapshot({ siteId, pageId, snapshot }) {
  const key = k_(siteId, pageId);
  if (!key) return false;
  if (!snapshot || typeof snapshot !== 'object') return false;

  const map = readAll_();
  map[key] = snapshot;
  writeAll_(map);
  return true;
}

export function loadPageCanvasSnapshot({ siteId, pageId }) {
  const key = k_(siteId, pageId);
  if (!key) return null;
  const map = readAll_();
  const snap = map[key];
  return snap && typeof snap === 'object' ? snap : null;
}

export function makeEmptyCanvasSnapshot(pageId) {
  return {
    version: 1,
    page: {
      id: pageId ? String(pageId) : 'page_home',
      rootRows: [],
      rootSections: [],
    },
    rows: {},
    blocks: {},
    sections: {},
    // 01040: a new page owns an explicitly empty canonical Main area.
    // This prevents the previous tab's SiteFrameStore Main from leaking into it.
    siteFrameMain01040: {
      version: 'st-main-area-snapshot-v1-01040',
      rootIds: [],
      nodes: {},
      areaMeta: {},
    },
  };
}
