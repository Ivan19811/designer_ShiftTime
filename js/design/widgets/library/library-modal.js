// js/design/widgets/library/library-modal.js
// =======================================================
// Модалка "Бібліотека статей":
// - дерево папок (ліва колонка)
// - список статей (права колонка)
// - створення папок/статей (MVP: localStorage provider)
// - відкриття статті у Article Editor Modal (source='library')
// =======================================================

import {
  libBoot,
  libGetStateSync,
  libGetFolderChildren,
  libGetArticlesInFolder,
  libCreateFolder,
  libCreateArticle,
  libGetArticleHtml,
  libRenameFolder,
  libRenameArticle,
  libDeleteFolder,
  libDeleteArticle,
  libDuplicateArticle,
  libMoveArticle,
  libMoveFolder,
} from './library-store.js';

import { openArticleEditorModal } from '../article/article-editor-modal.js';

// ===== Delete-guard: don't allow deleting folder if it contains articles used on canvas =====
function stLib_getUsageCountForArticleRef_(articleRefId){
  const ref = String(articleRefId || '');
  if (!ref) return 0;
  const ss = window.siteState;
  const blocks = ss && ss.blocks ? ss.blocks : null;
  if (!blocks) return 0;
  let n = 0;
  for (const b of Object.values(blocks)) {
    if (!b || typeof b !== 'object') continue;
    if (String(b.kind || '') !== 'article') continue;
    if (String(b.articleRefId || '') !== ref) continue;
    n++;
  }
  return n;
}

function stLib_collectFolderSubtreeIds_(st, rootFolderId){
  const rootId = String(rootFolderId || '');
  if (!rootId) return [];
  const folders = st && st.folders ? st.folders : [];
  const out = [];
  const q = [rootId];
  const seen = new Set();
  while (q.length){
    const id = String(q.shift());
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    for (const f of folders){
      if (!f) continue;
      if (String(f.parentId || '') !== id) continue;
      q.push(String(f.id));
    }
  }
  return out;
}

function stLib_folderHasUsedArticles_(folderId){
  const st = libGetStateSync();
  const folderIds = stLib_collectFolderSubtreeIds_(st, folderId);
  if (!folderIds.length) return { usedCount: 0, usedArticleIds: [] };

  const usedArticleIds = [];
  for (const a of (st.articles || [])){
    if (!a) continue;
    if (!folderIds.includes(String(a.folderId))) continue;
    const cnt = stLib_getUsageCountForArticleRef_(a.id);
    if (cnt > 0){
      usedArticleIds.push(String(a.id));
    }
  }
  return { usedCount: usedArticleIds.length, usedArticleIds };
}

const MODAL_ID = 'stLibraryModal';
const STYLE_ID = 'stLibraryModalStyles';

let modalEl = null;
let selectedFolderId = null;
let searchQ = '';

function q(sel, host = document) { return host.querySelector(sel); }

function getUsageCountForArticle_(articleRefId){
  const ref = String(articleRefId || '');
  if (!ref) return 0;
  const ss = window.siteState;
  const blocks = ss && ss.blocks ? ss.blocks : null;
  if (!blocks) return 0;

  let n = 0;
  for (const b of Object.values(blocks)) {
    if (!b || typeof b !== 'object') continue;
    if (String(b.kind || '') !== 'article') continue;
    if (String(b.articleRefId || '') !== ref) continue;
    n++;
  }
  return n;
}

function ensureStyles_() {
  if (document.getElementById(STYLE_ID)) return;
  const st = document.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
    #${MODAL_ID}{ position:fixed; inset:0; display:none; z-index:99991; }
    #${MODAL_ID}.is-open{ display:block; }
    #${MODAL_ID} .stl__backdrop{ position:absolute; inset:0; background:rgba(0,0,0,.45); }
    #${MODAL_ID} .stl__panel{
      position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);
      width:min(1040px, calc(100vw - 28px));
      height:min(760px, calc(100vh - 28px));
      border-radius:16px;
      border:1px solid rgba(123,155,255,.22);
      background: rgba(10,14,24,.92);
      box-shadow: 0 18px 60px rgba(0,0,0,.45);
      overflow:hidden;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
      color:#e8ecff;
    }
    #${MODAL_ID} .stl__head{
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 16px; border-bottom:1px solid rgba(255,255,255,.08);
      background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,0));
    }
    #${MODAL_ID} .stl__title{ font-size:14px; font-weight:900; letter-spacing:.3px; }
    #${MODAL_ID} .stl__close{
      border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06);
      color:#fff; font-weight:900; border-radius:10px; padding:8px 10px; cursor:pointer;
    }
    #${MODAL_ID} .stl__body{ display:grid; grid-template-columns: 280px 1fr; height:calc(100% - 56px); }
    #${MODAL_ID} .stl__left{ border-right:1px solid rgba(255,255,255,.08); padding:12px; overflow:auto; }
    #${MODAL_ID} .stl__right{ padding:12px; overflow:auto; }
    #${MODAL_ID} .stl__toolbar{ display:flex; gap:8px; align-items:center; margin-bottom:10px; }
    #${MODAL_ID} .stl__btn{
      border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06);
      color:#fff; font-weight:800; border-radius:10px; padding:8px 10px; cursor:pointer;
      font-size:12px;
    }
    #${MODAL_ID} .stl__btn--mini{ padding:6px 8px; border-radius:9px; font-size:11px; }
    #${MODAL_ID} .stl__btn--danger{ border-color: rgba(255,90,90,.35); background: rgba(255,90,90,.10); }
    #${MODAL_ID} .stl__btn--ghost{ border-color: rgba(255,255,255,.10); background: rgba(255,255,255,.03); }
    #${MODAL_ID} .stl__search{
      flex:1;
      border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06);
      color:#fff; border-radius:10px; padding:9px 10px; font-weight:800; font-size:12px;
      outline:none;
    }
    #${MODAL_ID} .stl__tree{ display:flex; flex-direction:column; gap:4px; }
    #${MODAL_ID} .stl__node{
      display:flex; align-items:center; gap:8px;
      padding:8px 10px; border-radius:10px;
      border:1px solid transparent;
      cursor:pointer; user-select:none;
      background:rgba(255,255,255,.03);
    }
    #${MODAL_ID} .stl__node:hover{ background:rgba(255,255,255,.06); }

    #${MODAL_ID} .stl__node.is-drop{ outline:2px dashed rgba(123,155,255,.6); background:rgba(123,155,255,.10); }
    #${MODAL_ID} .stl__node.is-active{
      border-color: rgba(123,155,255,.35);
      background: rgba(123,155,255,.12);
    }
    #${MODAL_ID} .stl__indent{ width: 1px; height: 1px; }
    #${MODAL_ID} .stl__nodeTitle{ font-weight:900; font-size:12px; }
    #${MODAL_ID} .stl__list{ display:flex; flex-direction:column; gap:8px; }
    #${MODAL_ID} .stl__card{
      border:1px solid rgba(255,255,255,.10); background:rgba(255,255,255,.05);
      border-radius:12px; padding:10px 12px;
      display:flex; align-items:center; justify-content:space-between; gap:12px;
    }
    #${MODAL_ID} .stl__cardActions{ display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:flex-end; }
    #${MODAL_ID} .stl__cardTitle{ font-weight:900; font-size:13px; }
    #${MODAL_ID} .stl__cardMeta{ opacity:.8; font-size:12px; font-weight:700; }
    #${MODAL_ID} .stl__open{
      border:1px solid rgba(123,155,255,.32); background:rgba(123,155,255,.12);
      color:#fff; font-weight:900; border-radius:10px; padding:8px 10px; cursor:pointer;
      font-size:12px;
    }
    #${MODAL_ID} .stl__empty{ opacity:.85; font-weight:800; font-size:13px; padding:12px; }
  `;
  document.head.appendChild(st);
}

function ensureModal_() {
  if (modalEl) return modalEl;
  ensureStyles_();
  const el = document.createElement('div');
  el.id = MODAL_ID;
  el.innerHTML = `
    <div class="stl__backdrop" data-act="close"></div>
    <div class="stl__panel">
      <div class="stl__head">
        <div class="stl__title">Бібліотека статей</div>
        <button class="stl__close" type="button" data-act="close">Закрити</button>
      </div>
      <div class="stl__body">
        <div class="stl__left">
          <div class="stl__toolbar">
            <button class="stl__btn" type="button" data-act="new-folder">+ Папка</button>
            <button class="stl__btn stl__btn--ghost stl__btn--mini" type="button" data-act="rename-folder">Rename</button>
            <button class="stl__btn stl__btn--danger stl__btn--mini" type="button" data-act="delete-folder">Delete</button>
          </div>
          <div class="stl__tree" data-tree data-rootdrop="1"></div>
        </div>
        <div class="stl__right">
          <div class="stl__toolbar">
            <button class="stl__btn" type="button" data-act="new-article">+ Стаття</button>
            <input class="stl__search" placeholder="Пошук статті..." data-search />
          </div>
          <div class="stl__list" data-list></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  // focus article from editor (after Publish)
  if (!window.__ST_LIB_FOCUS_LISTENER__) {
    window.__ST_LIB_FOCUS_LISTENER__ = true;
    window.addEventListener('st:library-focus-article', (ev) => {
      try {
        const id = ev?.detail?.id || '';
        if (!modalEl) return;
        focusArticleInLibrary_(id);
      } catch (e) {}
    });
  }

  modalEl = el;

  el.addEventListener('click', (ev) => {
    const a = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (!a) return;
    const act = a.getAttribute('data-act');

    const st = libGetStateSync();
    const rootId = st.rootId;
    const currentFolderId = selectedFolderId || rootId;
    const aid = a.getAttribute('data-aid');

    if (act === 'close') closeLibraryModal();

    if (act === 'new-folder') {
      const title = prompt('Назва папки:', 'Нова папка');
      if (!title) return;
      const st = libGetStateSync();
      const parentId = selectedFolderId || st.rootId;
      libCreateFolder({ parentId, title });
      renderAll_();
    }

    if (act === 'rename-folder') {
      if (!currentFolderId || currentFolderId === rootId) {
        alert('Кореневу папку перейменовувати не потрібно.');
        return;
      }
      const cur = (st.folders || []).find(f => f && f.id === currentFolderId);
      const next = prompt('Нова назва папки:', String(cur?.title || ''));
      if (!next) return;
      libRenameFolder(currentFolderId, next);
      renderAll_();
    }

    if (act === 'delete-folder') {
      if (!currentFolderId || currentFolderId === rootId) {
        alert('Кореневу папку видаляти не можна.');
        return;
      }
      const cur = (st.folders || []).find(f => f && f.id === currentFolderId);
      const guard = stLib_folderHasUsedArticles_(currentFolderId);
      if (guard.usedCount > 0) {
        alert(`Неможливо видалити цю папку: всередині є ${guard.usedCount} статт(я/і), яка використовується на сторінці. Спочатку приберіть ці статті з блоків.`);
        return;
      }
      const ok = confirm(`Видалити папку "${String(cur?.title || '')}" та всі вкладені папки/статті?`);
      if (!ok) return;
      libDeleteFolder(currentFolderId);
      selectedFolderId = rootId;
      renderAll_();
    }

    if (act === 'new-article') {
      const title = prompt('Назва статті:', 'Нова стаття');
      if (!title) return;
      const st = libGetStateSync();
      const folderId = selectedFolderId || st.rootId;
      const art = libCreateArticle({
        folderId,
        title,
        html: `<h1>${escapeHtml_(title)}</h1><p>Напишіть статтю...</p>`
      });
      // одразу відкриваємо редактор
      openArticleEditorModal({
        mode: 'edit',
        id: art.id,
        title: art.title,
        source: 'library',
        html: art.html
      });
      renderAll_();
    }

    if (act === 'open-article') {
      if (!aid) return;
      (async () => {
        const meta = (libGetStateSync().articles || []).find(x => x && x.id === aid);
        const html = await libGetArticleHtml(aid);
        openArticleEditorModal({
          mode: 'edit',
          id: aid,
          title: meta?.title || 'Стаття',
          source: 'library',
          html
        });
      })();
    }

    if (act === 'rename-article') {
      if (!aid) return;
      const meta = (st.articles || []).find(x => x && x.id === aid);
      const next = prompt('Нова назва статті:', String(meta?.title || ''));
      if (!next) return;
      libRenameArticle(aid, next);
      renderList_();
    }

    if (act === 'duplicate-article') {
      if (!aid) return;
      const copy = libDuplicateArticle(aid, { targetFolderId: currentFolderId });
      if (copy) {
        renderList_();
      }
    }

    if (act === 'delete-article') {
      if (!aid) return;
      const meta = (st.articles || []).find(x => x && x.id === aid);
      const usageN = getUsageCountForArticle_(aid);
      const title = String(meta?.title || '');
      const msg = usageN > 0
        ? `УВАГА! Стаття "${title}" використовується у ${usageN} блок(ах) на цій сторінці.\n\nВидалити все одно?`
        : `Видалити статтю "${title}"?`;
      const ok = confirm(msg);
      if (!ok) return;
      libDeleteArticle(aid);
      renderList_();
    }

  // ---------------- Drag & Drop (Articles + Folders) ----------------
  const clearDropMarks_ = () => {
    try {
      el.querySelectorAll('.stl__node.is-drop').forEach(n => n.classList.remove('is-drop'));
    } catch (e) {}
  };

  const parseDrag_ = (ev) => {
    try {
      const raw = ev.dataTransfer?.getData('text/plain') || '';
      if (!raw) return null;
      const obj = JSON.parse(raw);
      const type = String(obj?.type || '');
      const id = String(obj?.id || '');
      if (!type || !id) return null;
      if (type !== 'article' && type !== 'folder') return null;
      return { type, id };
    } catch (e) {
      return null;
    }
  };

  const canDropFolder_ = (movingFolderId, targetFolderId) => {
    const st = libGetStateSync();
    const rootId = st.rootId;
    const movingId = String(movingFolderId || '');
    const targetId = String(targetFolderId || '');
    if (!movingId || !targetId) return false;
    if (movingId === rootId) return false; // root is immutable
    if (movingId === targetId) return false;

    // Disallow dropping into own subtree
    const subtree = (function collect(fid){
      const ids = [fid];
      const stack = [fid];
      while (stack.length) {
        const cur = stack.pop();
        const kids = libGetFolderChildren(cur);
        (kids || []).forEach(k => { ids.push(k.id); stack.push(k.id); });
      }
      return ids;
    })(movingId);

    if (subtree.includes(targetId)) return false;
    return true;
  };

  const canDropArticle_ = (articleId, targetFolderId) => {
    const st = libGetStateSync();
    const aid = String(articleId || '');
    const fid = String(targetFolderId || '');
    if (!aid || !fid) return false;
    const f = (st.folders || []).find(x => x && String(x.id) === fid);
    if (!f) return false;
    return true;
  };

  el.addEventListener('dragstart', (ev) => {
    const t = ev.target;
    const folderNode = t?.closest ? t.closest('.stl__node[data-fid]') : null;
    const articleCard = t?.closest ? t.closest('.stl__card[data-aid]') : null;

    if (articleCard) {
      const aid = String(articleCard.dataset.aid || '');
      if (!aid) return;
      ev.dataTransfer?.setData('text/plain', JSON.stringify({ type: 'article', id: aid }));
      ev.dataTransfer && (ev.dataTransfer.effectAllowed = 'move');
      clearDropMarks_();
      return;
    }

    if (folderNode) {
      const fid = String(folderNode.dataset.fid || '');
      const st = libGetStateSync();
      if (!fid || fid === st.rootId) {
        ev.preventDefault();
        return;
      }
      ev.dataTransfer?.setData('text/plain', JSON.stringify({ type: 'folder', id: fid }));
      ev.dataTransfer && (ev.dataTransfer.effectAllowed = 'move');
      clearDropMarks_();
      return;
    }
  });

  el.addEventListener('dragover', (ev) => {
    const drag = parseDrag_(ev);
    if (!drag) return;

    const folderNode = ev.target?.closest ? ev.target.closest('.stl__node[data-fid]') : null;
    const treeRoot = ev.target?.closest ? ev.target.closest('[data-rootdrop]') : null;
    const st = libGetStateSync();
    const rootId = st.rootId;

    clearDropMarks_();

    // Determine target folder id
    let targetId = '';
    if (folderNode) targetId = String(folderNode.dataset.fid || '');
    else if (treeRoot) targetId = String(rootId || '');

    if (!targetId) return;

    let ok = false;
    if (drag.type === 'article') ok = canDropArticle_(drag.id, targetId);
    if (drag.type === 'folder') ok = canDropFolder_(drag.id, targetId);

    if (!ok) return;

    ev.preventDefault(); // allow drop
    if (folderNode) folderNode.classList.add('is-drop');
  });

  el.addEventListener('drop', (ev) => {
    const drag = parseDrag_(ev);
    if (!drag) return;

    const folderNode = ev.target?.closest ? ev.target.closest('.stl__node[data-fid]') : null;
    const treeRoot = ev.target?.closest ? ev.target.closest('[data-rootdrop]') : null;
    const st = libGetStateSync();
    const rootId = st.rootId;

    let targetId = '';
    if (folderNode) targetId = String(folderNode.dataset.fid || '');
    else if (treeRoot) targetId = String(rootId || '');

    clearDropMarks_();
    if (!targetId) return;

    let moved = false;
    if (drag.type === 'article') {
      if (!canDropArticle_(drag.id, targetId)) return;
      moved = !!libMoveArticle(drag.id, targetId);
    } else if (drag.type === 'folder') {
      if (!canDropFolder_(drag.id, targetId)) return;
      moved = !!libMoveFolder(drag.id, targetId);
    }

    if (!moved) return;

    // Keep selection: if moved folder was selected, keep it.
    renderAll_();
  });

  el.addEventListener('dragleave', () => {
    clearDropMarks_();
  });

  });

  const search = q('[data-search]', el);
  if (search) {
    search.addEventListener('input', () => {
      searchQ = String(search.value || '').trim().toLowerCase();
      renderList_();
    });
  }

  return modalEl;
}

function escapeHtml_(s) {
  return String(s || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderTree_() {
  const st = libGetStateSync();
  const rootId = st.rootId;
  if (!selectedFolderId) selectedFolderId = rootId;

  const host = q('[data-tree]', modalEl);
  if (!host) return;
  host.innerHTML = '';

  const makeNode = (folder, depth) => {
    const row = document.createElement('div');
    row.className = 'stl__node' + (folder.id === selectedFolderId ? ' is-active' : '');
    row.dataset.fid = folder.id;
    row.dataset.dragType = 'folder';
    row.draggable = (String(folder.id) !== String(rootId));
    row.style.marginLeft = (Math.max(0, depth) * 10) + 'px';
    row.innerHTML = `
      <div class="stl__nodeTitle">${escapeHtml_(folder.title || 'Папка')}</div>
    `;

    row.addEventListener('click', () => {
      selectedFolderId = folder.id;
      renderTree_();
      renderList_();
    });

    host.appendChild(row);

    const kids = libGetFolderChildren(folder.id);
    kids.forEach(k => makeNode(k, depth + 1));
  };

  const root = (st.folders || []).find(f => f && f.id === rootId) || { id: rootId, title: 'Бібліотека' };
  makeNode(root, 0);
}

function renderList_() {
  const st = libGetStateSync();
  const list = q('[data-list]', modalEl);
  if (!list) return;

  const folderId = selectedFolderId || st.rootId;
  let items = libGetArticlesInFolder(folderId);

  if (searchQ) {
    items = items.filter(a => String(a?.title || '').toLowerCase().includes(searchQ));
  }

  if (!items.length) {
    list.innerHTML = `<div class="stl__empty">Немає статей у цій папці.</div>`;
    return;
  }

  list.innerHTML = '';
  items
    .slice()
    .sort((a,b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .forEach((a) => {
      const card = document.createElement('div');
      card.className = 'stl__card';
      card.dataset.dragType = 'article';
      card.dataset.aid = String(a.id || '');
      card.draggable = true;
      card.innerHTML = `
        <div style="min-width:0">
          <div class="stl__cardTitle">${escapeHtml_(a.title || 'Стаття')}</div>
          <div class="stl__cardMeta">${escapeHtml_(String(a.updatedAt || ''))}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-shrink:0">
          <button class="stl__btn stl__btn--ghost stl__btn--mini" type="button" data-act="rename-article" data-aid="${escapeHtml_(a.id)}">Rename</button>
          <button class="stl__btn stl__btn--ghost stl__btn--mini" type="button" data-act="duplicate-article" data-aid="${escapeHtml_(a.id)}">Copy</button>
          <button class="stl__btn stl__btn--danger stl__btn--mini" type="button" data-act="delete-article" data-aid="${escapeHtml_(a.id)}">Delete</button>
          <button class="stl__open" type="button" data-act="open-article" data-aid="${escapeHtml_(a.id)}">Відкрити</button>
        </div>
      `;
      list.appendChild(card);
    });
}

// 🔎 Focus/highlight article in library (used after Publish)
function focusArticleInLibrary_(articleId) {
  if (!articleId) return;
  const st = libGetStateSync();
  const a = (st.articles || []).find(x => x && String(x.id) === String(articleId));
  if (!a) return;

  // select its folder
  try { state.currentFolderId = String(a.folderId || st.rootId); } catch (e) {}
  renderAll_();

  // highlight row
  try {
    const row = modalEl && modalEl.querySelector ? modalEl.querySelector(`[data-aid="${CSS.escape(String(articleId))}"]`) : null;
    if (row) {
      row.classList.add('stl__card--flash');
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => row.classList.remove('stl__card--flash'), 1200);
    }
  } catch (e) {}
}

function renderAll_() {
  renderTree_();
  renderList_();
}

export async function openLibraryModal() {
  ensureModal_();
  await libBoot();
  modalEl.classList.add('is-open');
  renderAll_();
}

export function closeLibraryModal() {
  if (!modalEl) return;
  modalEl.classList.remove('is-open');
  // cleanup
  searchQ = '';
  const s = q('[data-search]', modalEl);
  if (s) s.value = '';
}
