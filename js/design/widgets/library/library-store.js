// js/design/widgets/library/library-store.js
// =======================================================
// Сховище "Бібліотека статей" (v1):
// - Працює як провайдер: UI не знає де дані лежать.
// - MVP запису: localStorage (бо статичні файли у браузері не перезаписуються).
// - Перший запуск: може підвантажити seed з /library/articles/index.json (якщо файл існує).
// - Статті можуть бути "static" (file) або "local" (html в localStorage).
//
// AI-ready: тут у майбутньому можна замінити провайдера (Google Sheets / DB) без змін UI.
// =======================================================

const LIB_KEY = 'st_article_library_v1';
const DRAFT_PREFIX = 'st_article_library_draft::';
const INDEX_URL = 'library/articles/index.json';

let bootPromise = null;

// ---------- utils ----------
function uid(prefix) {
  return String(prefix || 'id_') + Math.random().toString(36).slice(2, 9) + '_' + Date.now();
}

function nowISO() {
  try { return new Date().toISOString(); } catch (e) { return String(Date.now()); }
}

function safeJsonParse(str, fallback) {
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

function saveState_(st) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(st || null)); } catch (e) {}
}

function loadState_() {
  const raw = localStorage.getItem(LIB_KEY);
  if (!raw) return null;
  return safeJsonParse(raw, null);
}

function emptyState_() {
  const rootId = 'fld_root';
  return {
    version: 1,
    rootId,
    folders: [
      { id: rootId, title: 'Бібліотека', parentId: null, createdAt: nowISO(), updatedAt: nowISO() }
    ],
    articles: []
  };
}

function ensureFolder_(st, id) {
  return (st && Array.isArray(st.folders)) ? st.folders.find(f => f && f.id === id) : null;
}

function ensureArticle_(st, id) {
  return (st && Array.isArray(st.articles)) ? st.articles.find(a => a && a.id === id) : null;
}

// ---------- seed from static index.json ----------
async function trySeedFromIndex_(st) {
  // Seed only when library is empty (no articles and only root folder)
  const hasAnyArticles = Array.isArray(st.articles) && st.articles.length > 0;
  const hasAnyFolders = Array.isArray(st.folders) && st.folders.length > 1;
  if (hasAnyArticles || hasAnyFolders) return st;

  let res;
  try {
    res = await fetch(INDEX_URL, { cache: 'no-store' });
  } catch (e) {
    return st;
  }
  if (!res || !res.ok) return st;

  let indexData = null;
  try { indexData = await res.json(); } catch (e) { return st; }
  if (!indexData || !Array.isArray(indexData.root)) return st;

  // Build folders/articles from index tree
  const rootId = st.rootId;
  const walk = (nodes, parentId) => {
    (nodes || []).forEach((node) => {
      const type = String(node?.type || '').toLowerCase();
      if (type === 'folder') {
        const fid = String(node.id || uid('fld_'));
        st.folders.push({
          id: fid,
          title: String(node.title || 'Папка'),
          parentId: parentId || rootId,
          createdAt: nowISO(),
          updatedAt: nowISO()
        });
        walk(node.children || [], fid);
      }
      if (type === 'article') {
        const aid = String(node.id || uid('art_'));
        st.articles.push({
          id: aid,
          title: String(node.title || 'Стаття'),
          folderId: parentId || rootId,
          // static source
          source: 'static',
          file: String(node.file || ''),
          html: '',
          createdAt: nowISO(),
          updatedAt: nowISO()
        });
      }
    });
  };

  walk(indexData.root, rootId);
  return st;
}

// ---------- public boot ----------
export async function libBoot() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    let st = loadState_();
    if (!st || !st.version) {
      st = emptyState_();
      saveState_(st);
    }

    // ensure minimal fields
    st.version = 1;
    st.rootId = st.rootId || 'fld_root';
    st.folders = Array.isArray(st.folders) ? st.folders : [];
    st.articles = Array.isArray(st.articles) ? st.articles : [];

    // ensure root exists
    if (!ensureFolder_(st, st.rootId)) {
      st.folders.unshift({ id: st.rootId, title: 'Бібліотека', parentId: null, createdAt: nowISO(), updatedAt: nowISO() });
    }

    // optional seed
    try { st = await trySeedFromIndex_(st); } catch (e) {}
    saveState_(st);
    return st;
  })();
  return bootPromise;
}

export function libGetStateSync() {
  return loadState_() || emptyState_();
}

export function libSaveStateSync(next) {
  saveState_(next);
}

// ---------- folders tree ----------
export function libGetFolders() {
  const st = libGetStateSync();
  return Array.isArray(st.folders) ? st.folders.slice() : [];
}

export function libGetFolderChildren(parentId) {
  const st = libGetStateSync();
  const pid = parentId || st.rootId;
  return (st.folders || []).filter(f => f && f.parentId === pid);
}

export function libGetArticlesInFolder(folderId) {
  const st = libGetStateSync();
  const fid = folderId || st.rootId;
  return (st.articles || []).filter(a => a && a.folderId === fid);
}

export function libCreateFolder({ parentId = null, title = 'Нова папка' } = {}) {
  const st = libGetStateSync();
  const pid = parentId || st.rootId;
  const folder = {
    id: uid('fld_'),
    title: String(title || 'Нова папка'),
    parentId: pid,
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  st.folders = Array.isArray(st.folders) ? st.folders : [];
  st.folders.push(folder);
  saveState_(st);
  return folder;
}

export function libCreateArticle({ folderId = null, title = 'Нова стаття', html = '' } = {}) {
  const st = libGetStateSync();
  const fid = folderId || st.rootId;
  const art = {
    id: uid('art_'),
    title: String(title || 'Нова стаття'),
    folderId: fid,
    source: 'local', // local by default for new ones
    file: '',
    html: String(html || ''),
    createdAt: nowISO(),
    updatedAt: nowISO()
  };
  st.articles = Array.isArray(st.articles) ? st.articles : [];
  st.articles.push(art);
  saveState_(st);
  return art;
}

// ---------- rename / delete / duplicate (MVP localStorage provider) ----------
export function libRenameFolder(id, nextTitle) {
  const fid = String(id || '');
  if (!fid) return false;
  const st = libGetStateSync();
  // Root folder rename is allowed? We'll allow rename except when folder not found.
  const f = ensureFolder_(st, fid);
  if (!f) return false;
  f.title = String(nextTitle || '').trim() || f.title || 'Папка';
  f.updatedAt = nowISO();
  saveState_(st);
  return true;
}

export function libRenameArticle(id, nextTitle) {
  const aid = String(id || '');
  if (!aid) return false;
  const st = libGetStateSync();
  const a = ensureArticle_(st, aid);
  if (!a) return false;
  a.title = String(nextTitle || '').trim() || a.title || 'Стаття';
  a.updatedAt = nowISO();
  saveState_(st);
  return true;
}

export function libDeleteArticle(id) {
  const aid = String(id || '');
  if (!aid) return false;
  const st = libGetStateSync();
  const before = Array.isArray(st.articles) ? st.articles.length : 0;
  st.articles = (st.articles || []).filter(a => a && a.id !== aid);
  // clear draft if any
  try { localStorage.removeItem(DRAFT_PREFIX + aid); } catch (e) {}
  saveState_(st);

  const changed = before !== (st.articles || []).length;

  if (changed) {
    // 🔔 live-update: повідомляємо, що статтю видалено
    try {
      window.dispatchEvent(new CustomEvent('st:article-deleted', {
        detail: { id: aid }
      }));
    } catch (e) {}
  }

  return changed;
}

function collectFolderSubtreeIds_(st, folderId) {
  const ids = [];
  const walk = (fid) => {
    ids.push(fid);
    (st.folders || []).forEach((f) => {
      if (f && f.parentId === fid) walk(f.id);
    });
  };
  walk(folderId);
  return ids;
}

export function libDeleteFolder(folderId) {
  const fid = String(folderId || '');
  if (!fid) return false;
  const st = libGetStateSync();
  if (fid === st.rootId) return false; // do not delete root
  if (!ensureFolder_(st, fid)) return false;

  const folderIds = collectFolderSubtreeIds_(st, fid);
  // delete articles in those folders
  const toDeleteArticleIds = (st.articles || [])
    .filter(a => a && folderIds.includes(a.folderId))
    .map(a => a.id);
  toDeleteArticleIds.forEach((aid) => {
    try { localStorage.removeItem(DRAFT_PREFIX + String(aid)); } catch (e) {}
  });
  st.articles = (st.articles || []).filter(a => a && !folderIds.includes(a.folderId));
  // 🔔 live-update: повідомляємо про видалення статей з папки
  try {
    (toDeleteArticleIds || []).forEach((aid) => {
      try {
        window.dispatchEvent(new CustomEvent('st:article-deleted', { detail: { id: String(aid || '') } }));
      } catch (e) {}
    });
  } catch (e) {}

  // delete folders in subtree
  st.folders = (st.folders || []).filter(f => f && !folderIds.includes(f.id));

  saveState_(st);
  return true;
}

export function libDuplicateArticle(id, { targetFolderId = null, titleSuffix = ' (копія)' } = {}) {
  const aid = String(id || '');
  if (!aid) return null;
  const st = libGetStateSync();
  const a = ensureArticle_(st, aid);
  if (!a) return null;

  const folderId = targetFolderId || a.folderId || st.rootId;
  const copy = {
    id: uid('art_'),
    title: String(a.title || 'Стаття') + String(titleSuffix || ''),
    folderId,
    source: 'local',
    file: '',
    html: '',
    createdAt: nowISO(),
    updatedAt: nowISO()
  };

  // Resolve html from: local html field OR draft override for static.
  // For static without draft: keep static file reference so content can be fetched.
  const draft = libGetDraftHtml(aid);
  if (typeof draft === 'string' && draft.length) {
    copy.html = draft;
  } else {
    if (a.source === 'local') {
      copy.html = String(a.html || '');
    } else {
      copy.source = 'static';
      copy.file = String(a.file || '');
      copy.html = '';
    }
  }

  st.articles = Array.isArray(st.articles) ? st.articles : [];
  st.articles.push(copy);
  saveState_(st);
  return copy;
}


// ---------- move (Drag&Drop) ----------
export function libMoveArticle(articleId, targetFolderId) {
  const aid = String(articleId || '');
  const fid = String(targetFolderId || '');
  if (!aid || !fid) return false;

  const st = libGetStateSync();
  const a = ensureArticle_(st, aid);
  if (!a) return false;
  const f = ensureFolder_(st, fid);
  if (!f) return false;

  if (String(a.folderId || '') === fid) return true; // no-op
  a.folderId = fid;
  a.updatedAt = nowISO();
  saveState_(st);
  return true;
}

export function libMoveFolder(folderId, targetParentId) {
  const movingId = String(folderId || '');
  const parentId = String(targetParentId || '');
  if (!movingId || !parentId) return false;

  const st = libGetStateSync();
  if (movingId === st.rootId) return false; // root is immutable
  const moving = ensureFolder_(st, movingId);
  if (!moving) return false;
  const parent = ensureFolder_(st, parentId);
  if (!parent) return false;

  // Can't move into itself
  if (movingId === parentId) return false;

  // Can't move into descendant (would create a cycle)
  const subtreeIds = collectFolderSubtreeIds_(st, movingId);
  if (subtreeIds.includes(parentId)) return false;

  if (String(moving.parentId || '') === parentId) return true; // no-op
  moving.parentId = parentId;
  moving.updatedAt = nowISO();
  saveState_(st);
  return true;
}

export function libGetArticleMeta(id) {
  const st = libGetStateSync();
  const a = ensureArticle_(st, id);
  if (!a) return null;
  return { id: a.id, title: a.title, folderId: a.folderId, source: a.source || 'local', file: a.file || '', updatedAt: a.updatedAt || '' };
}

export async function libGetArticleHtml(id) {
  await libBoot();
  const st = libGetStateSync();
  const a = ensureArticle_(st, id);
  if (!a) return '';
  if (a.source === 'local') return String(a.html || '');

  // fetch file
  const file = String(a.file || '');
  if (!file) return '';
  try {
    const res = await fetch(file, { cache: 'no-store' });
    if (!res.ok) return '';
    const html = await res.text();
    return String(html || '');
  } catch (e) {
    return '';
  }
}

export function libSaveArticleHtml(id, html) {
  const st = libGetStateSync();
  const a = ensureArticle_(st, id);
  if (!a) return false;
  a.source = 'local';
  a.file = '';
  a.html = String(html || '');
  a.updatedAt = nowISO();
  saveState_(st);

  // 🔔 live-update для всіх article-block, що посилаються на цей refId
  try {
    window.dispatchEvent(new CustomEvent('st:article-updated', {
      detail: { id: String(id || ''), html: String(a.html || ''), updatedAt: String(a.updatedAt || '') }
    }));
  } catch (e) {}

  return true;
}

// ---------- drafts ----------
export function libGetDraftHtml(id) {
  try {
    return localStorage.getItem(DRAFT_PREFIX + String(id || ''));
  } catch (e) {
    return '';
  }
}

export function libSetDraftHtml(id, html) {
  try {
    localStorage.setItem(DRAFT_PREFIX + String(id || ''), String(html || ''));
  } catch (e) {}
}

export function libClearDraftHtml(id) {
  try {
    localStorage.removeItem(DRAFT_PREFIX + String(id || ''));
  } catch (e) {}
}

export function libHasDraft(id) {
  const v = libGetDraftHtml(id);
  return typeof v === 'string' && v.length > 0;
}
