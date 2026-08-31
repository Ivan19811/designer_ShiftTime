// js/state/page-context.js
// =======================================================
// [КРОК 7][PAGE CONTEXT] Єдине джерело активної сторінки
// - Зберігає pageId + pageTitle
// - Ставитиме pageId в #site-root.dataset.pageId (для runtime/віджетів)
// - Розсилає події: builder:pageChanged, st:page-changed
// =======================================================

const KEY = "st_active_page_v1";

function getSiteRoot() {
  return document.getElementById("site-root");
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { pageId: null, title: "" };
  } catch {
    return { pageId: null, title: "" };
  }
}

function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

function applyToDOM(pageId) {
  const root = getSiteRoot();
  if (!root) return;
  if (pageId) root.dataset.pageId = String(pageId);
  else delete root.dataset.pageId;
}

function emit(pageId, title) {
  document.dispatchEvent(new CustomEvent("builder:pageChanged", { detail: { pageId, title } }));
  document.dispatchEvent(new CustomEvent("st:page-changed", { detail: { pageId, title } }));
}

export const PageContext = {
  get() {
    return read();
  },

  set({ pageId = null, title = "" } = {}) {
    const next = { pageId: pageId ? String(pageId) : null, title: String(title || "") };
    write(next);
    applyToDOM(next.pageId);
    emit(next.pageId, next.title);
    console.log("[PageContext] set:", next);
    return next;
  },

  boot() {
    const cur = read();
    applyToDOM(cur.pageId);
    emit(cur.pageId, cur.title);
    console.log("[PageContext] boot:", cur);
    return cur;
  }
};
