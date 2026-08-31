// js/site-state.js
export const siteState = {
  version: 1,
  page: {
    id: "page_home",
    rootRows: [],      // верхні ряди (як було)
    rootSections: []   // верхні секції (ми додали)
  },
  rows: {},       // rowId -> { id, type:"row", children:[blockId], columns:[fr...] }
  blocks: {},     // blockId -> { id, type:"block"|"block-container", childrenRow:null|rowId, height:null }
  sections: {}    // secId -> { id, rowId, parentId, children:[secId] }
};

// =========================================================
// STATE PERSISTENCE (localStorage)
// - Мета: щоб зміни НЕ губились при випадковому перезавантаженні (Live Server).
// - Зберігаємо тільки siteState (структуру полотна).
// =========================================================

export const SITE_STATE_LS_KEY = 'st_site_state_v1';

// [START-FRESH-PAGE-TEMPLATE-2026][Draft Mode]
// Під час "чернеткового" режиму (коли відкрили шаблон, але ще НЕ застосували до сторінки)
// ми НЕ маємо перетирати основний ключ сторінки. Тому пишемо зміни в окремий draft-key.
export const SITE_STATE_DRAFT_LS_KEY = 'st_site_state_draft_v1';

function isDraftModeActive_() {
  // ВАЖЛИВО: site-state.js імпортується дуже рано — ДО bootDraftMode().
  // Тому на reload після відкриття page-template як чернетки глобальний
  // window.ST_PAGE_DRAFT_MODE може ще не існувати. У такому випадку читаємо
  // той самий прапорець напряму з localStorage, інакше st_site_state_draft_v1
  // не підхоплювався, а полотно відновлювалось зі старого structural state.
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

function applyLoadedState_(loaded) {
  // Важливо: не міняємо reference обʼєкта siteState (його імпортують як const).
  // Оновлюємо поля “на місці”.
  siteState.version  = loaded.version || 1;
  siteState.page     = loaded.page     || { id: 'page_home', rootRows: [], rootSections: [] };
  siteState.rows     = loaded.rows     || {};
  siteState.blocks   = loaded.blocks   || {};
  siteState.sections = loaded.sections || {};
}

export function loadStateFromLocalStorage() {
  // Якщо є активний Draft Mode — відновлюємо draft-стан, а не основний.
  if (isDraftModeActive_()) {
    let rawD = '';
    try { rawD = localStorage.getItem(SITE_STATE_DRAFT_LS_KEY) || ''; } catch { rawD = ''; }
    if (rawD) {
      try {
        const parsedD = JSON.parse(rawD);
        if (parsedD && typeof parsedD === 'object' && parsedD.page && parsedD.rows && parsedD.blocks && parsedD.sections) {
          applyLoadedState_(parsedD);
          return true;
        }
      } catch {}
    }
  }

  let raw = '';
  try { raw = localStorage.getItem(SITE_STATE_LS_KEY) || ''; } catch { raw = ''; }
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return false;
    // Мінімальна валідація структури
    if (!parsed.page || typeof parsed.page !== 'object') return false;
    if (!parsed.rows || typeof parsed.rows !== 'object') return false;
    if (!parsed.blocks || typeof parsed.blocks !== 'object') return false;
    if (!parsed.sections || typeof parsed.sections !== 'object') return false;

    applyLoadedState_(parsed);
    return true;
  } catch {
    return false;
  }
}

export function saveStateNow() {
  try {
    const key = isDraftModeActive_() ? SITE_STATE_DRAFT_LS_KEY : SITE_STATE_LS_KEY;
    localStorage.setItem(key, JSON.stringify(siteState));
  } catch (e) {
    // не ламаємо UI
    console.warn('[site-state] saveStateNow failed', e);
  }
}

// Явне збереження в ОСНОВНИЙ ключ (використовується при "Застосувати чернетку")
export function saveStateToPrimaryNow() {
  try {
    localStorage.setItem(SITE_STATE_LS_KEY, JSON.stringify(siteState));
  } catch (e) {
    console.warn('[site-state] saveStateToPrimaryNow failed', e);
  }
}

export function clearDraftStateStorage() {
  try { localStorage.removeItem(SITE_STATE_DRAFT_LS_KEY); } catch {}
}

export function ensureRow(id) {
  if (!siteState.rows[id]) {
    siteState.rows[id] = {
      id,
      type: "row",
      children: [],
      columns: [],
      // layoutMode: 'fr' | 'flex' | 'grid' | 'free'
      // null означає: використовуємо поведінку за замовчуванням (як зараз).
      layoutMode: null
    };
  }
  return siteState.rows[id];
}

export function ensureBlock(id) {
  const blocks = siteState.blocks;

  if (!blocks[id]) {
    // Базова структура блока
    blocks[id] = {
      id,
      type: "block",          // "block" або "block-container"
      childrenRow: null,      // rowId, якщо це контейнер
      height: null,           // кастомна висота (px), або null
      // 🔹 нові поля для підтримки ліній
      kind: "block",          // "block" або "line"
      lineOrientation: null,  // "horizontal" | "vertical" для kind === "line"
      // 🔹 нові поля для Text-block
      textHtml: '',         // HTML вміст редагованого тексту для kind === "text"

      // FREE-DRAG позиція (для довільного розміщення всередині ROW)
      freeX: null,
      freeY: null
    };
  } else {
    // Якщо блок уже існує зі старої версії state — гарантуємо наявність нових полів
    const b = blocks[id];
    if (!("kind" in b)) b.kind = "block";
    if (!("lineOrientation" in b)) b.lineOrientation = null;
    if (!("freeX" in b)) b.freeX = null;
    if (!("freeY" in b)) b.freeY = null;
  }

  return blocks[id];
}

