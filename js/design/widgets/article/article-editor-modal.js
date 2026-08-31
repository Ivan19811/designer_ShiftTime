//
function getEditEl_(){ return modalEl ? modalEl.querySelector('[data-edit]') : null; }
function refreshDraftUi_(){
  const pill = q('[data-draft-pill]');
  if (!pill) return;
  if (__st_dirty) {
    pill.textContent = 'Чернетка';
    pill.classList.add('is-draft');
  } else {
    pill.textContent = 'Опубліковано';
    pill.classList.remove('is-draft');
  }
}

let __st_activeTab = 'editor'; // 'editor' | 'ai'
let __st_ai_lastHtml = '';

function setTab_(name){
  __st_activeTab = (name === 'ai') ? 'ai' : 'editor';

  const paneEditor = q('[data-pane="editor"]');
  const paneAi = q('[data-pane="ai"]');
  if (paneEditor) paneEditor.hidden = (__st_activeTab !== 'editor');
  if (paneAi) paneAi.hidden = (__st_activeTab !== 'ai');

  const tabs = qa('[data-tabs] [data-tab]');
  for (const b of tabs) {
    const t = b.getAttribute('data-tab');
    if (t === __st_activeTab) b.classList.add('is-active');
    else b.classList.remove('is-active');
  }
}

function bindTabs_(){
  const head = q('[data-head]');
  if (!head) return;

  // remove previous handler if any
  if (head.__st_tabs_handler__) {
    try { head.removeEventListener('click', head.__st_tabs_handler__); } catch(e){}
  }

  head.__st_tabs_handler__ = (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-tab]') : null;
    if (!btn) return;
    const tab = btn.getAttribute('data-tab') || 'editor';
    setTab_(tab);
  };
  head.addEventListener('click', head.__st_tabs_handler__);
}

function getSelectionText_(){
  const sel = window.getSelection ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return '';
  return String(sel.toString() || '');
}

function replaceSelectionWithHtml_(html){
  const sel = window.getSelection ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const temp = document.createElement('div');
  temp.innerHTML = String(html || '');
  const frag = document.createDocumentFragment();
  while (temp.firstChild) frag.appendChild(temp.firstChild);
  range.insertNode(frag);
  sel.collapseToEnd();
  return true;
}

function insertHtmlAtEndOrCaret_(html){
  const ed = getEditEl_();
  if (!ed) return;

  // try insert at caret if inside editor
  const sel = window.getSelection ? window.getSelection() : null;
  const hasSel = sel && sel.rangeCount > 0;
  if (hasSel) {
    const range = sel.getRangeAt(0);
    if (ed.contains(range.commonAncestorContainer)) {
      replaceSelectionWithHtml_(html);
      return;
    }
  }

  // else append to end
  ed.insertAdjacentHTML('beforeend', String(html || ''));
}

async function runAiAction_(act){
  const promptEl = q('[data-ai-prompt]');
  const outEl = q('[data-ai-result]');
  const ed = getEditEl_();

  const prompt = String(promptEl ? promptEl.value : '').trim();
  const selection = getSelectionText_();
  const currentHtml = String(ed ? ed.innerHTML : '');

  if (outEl) outEl.innerHTML = '<div class="stae__aiBusy">AI працює…</div>';

  try {
    const res = await runAI({
      action: act,
      prompt,
      selection,
      html: currentHtml,
      articleId: currentId,
      title: currentTitle,
    });

    __st_ai_lastHtml = (res && typeof res.html === 'string') ? res.html : '';
    const safe = __st_ai_lastHtml || (res && res.text) || '';
    if (outEl) outEl.innerHTML = `<div class="stae__aiOut">${safe}</div>`;
  } catch (e) {
    if (outEl) outEl.innerHTML = `<div class="stae__aiErr">AI error: ${String(e && e.message ? e.message : e)}</div>`;
  }
}

function bindAi_(){
  const pane = q('[data-pane="ai"]');
  if (!pane) return;

  if (pane.__st_ai_click__) {
    try { pane.removeEventListener('click', pane.__st_ai_click__); } catch(e){}
  }
  pane.__st_ai_click__ = (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-ai-act],[data-ai-apply]') : null;
    if (!btn) return;

    if (btn.hasAttribute('data-ai-act')) {
      const act = btn.getAttribute('data-ai-act') || '';
      runAiAction_(act);
      return;
    }

    if (btn.hasAttribute('data-ai-apply')) {
      const how = btn.getAttribute('data-ai-apply') || 'insert';
      const html = __st_ai_lastHtml || '';
      if (!html) return;

      if (how === 'replace') {
        const ok = replaceSelectionWithHtml_(html);
        if (!ok) insertHtmlAtEndOrCaret_(html);
      } else {
        insertHtmlAtEndOrCaret_(html);
      }
    }
  };
  pane.addEventListener('click', pane.__st_ai_click__);
}

// js/design/widgets/article/article-editor-modal.js
import { runAI } from './ai-provider.js';
// Модалка-редактор для блоку "Стаття".
// MVP:
//  - якщо стаття не вибрана → показує "Виберіть статтю."
//  - якщо вибрано кілька → показує список для вибору
//  - якщо вибрано одну → показує редактор контенту

import { saveStateNow } from '../../../site-state.js';
import { PageContext } from '../../../state/page-context.js';
import { libSetDraftHtml, libGetDraftHtml, libClearDraftHtml, libSaveArticleHtml, libGetArticleHtml, libGetArticleMeta, libGetStateSync, libCreateFolder, libCreateArticle } from '../library/library-store.js';

const MODAL_ID = 'stArticleEditorModal';
const STYLE_ID = 'stArticleEditorModalStyles';

let modalEl = null;
let currentId = '';
let currentTitle = '';

let currentSource = 'canvas'; // 'canvas' | 'library'

let __dragInited = false;

// Draft/Publish state inside editor
let __st_publishedHtml = '';
let __st_loadedVariant = 'published'; // 'published' | 'draft'
let __st_editorReady = false;
let __st_hasDraft = false;
let __st_dirty = false;

let __st_blockUid = "";
let __st_isTempArticle = false;

// Ensure folder exists under parent by exact (case-insensitive) title, return folderId
function ensureFolderByTitle_(parentId, title) {
  const st = libGetStateSync();
  const pid = parentId || st.rootId;
  const t = String(title || '').trim();
  if (!t) return pid;

  const exist = (st.folders || []).find(f =>
    f && f.parentId === pid && String(f.title || '').trim().toLowerCase() === t.toLowerCase()
  );
  if (exist) return exist.id;

  const created = libCreateFolder({ parentId: pid, title: t });
  return created ? created.id : pid;
}

function ensureDefaultArticleFolder_() {
  // Default folder: "СТАТТЯ" under root
  const st = libGetStateSync();
  return ensureFolderByTitle_(st.rootId, 'СТАТТЯ');
}

function getBlockState_(blockUid) {
  try {
    const st = window.siteState;
    if (!st || !st.blocks) return null;
    return st.blocks[String(blockUid || '')] || null;
  } catch (e) {
    return null;
  }
}

function linkBlockToArticle_(blockUid, articleId, html) {
  const b = getBlockState_(blockUid);
  if (!b) return false;
  b.kind = 'article';
  b.articleRefId = String(articleId || '');
  if (typeof html === 'string' && html.length) b.articleHtml = html;
  try { saveStateNow(); } catch (e) {}
  // sync DOM attribute for live-update pipeline
  try {
    const el = document.querySelector(`.st-block[data-uid="${String(blockUid||'')}"]`);
    if (el) {
      if (articleId) el.setAttribute('data-article-ref', String(articleId));
      else el.removeAttribute('data-article-ref');
    }
  } catch (e) {}
  return true;
}


function ensureStyles_() {
  // LiveServer / HMR may keep this <style> node between reloads.
  // Always overwrite textContent so design updates are applied.
  let st = document.getElementById(STYLE_ID);
  if (!st) {
    st = document.createElement('style');
    st.id = STYLE_ID;
    document.head.appendChild(st);
  }
  st.textContent = `
    #${MODAL_ID}{
      position:fixed; inset:0; z-index:99998;
      display:none; align-items:center; justify-content:center;
      background: radial-gradient(1200px 800px at 50% 20%, rgba(56,189,248,.16), transparent 55%),
                  rgba(2,6,23,.72);
      backdrop-filter: blur(6px);
    }
    #${MODAL_ID}.is-open{ display:flex; }
    #${MODAL_ID} .stae__panel{
      position:fixed;
      left:50%;
      top:50%;
      transform: translate(-50%, -50%);
      width:min(980px, calc(100vw - 28px));
      height:min(720px, calc(100vh - 28px));
      border-radius:16px;
      border:1px solid rgba(148,163,184,.28);
      background: linear-gradient(180deg, rgba(30,41,59,.92), rgba(15,23,42,.92));
      box-shadow:0 28px 100px rgba(0,0,0,.55);
      overflow:hidden;
      display:flex; flex-direction:column;
      box-sizing:border-box;
    }
    #${MODAL_ID} .stae__head{
      border-bottom:1px solid rgba(148,163,184,.22);
      background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03));
      cursor:grab;
      user-select:none;
    }
    #${MODAL_ID} .stae__head:active{ cursor:grabbing; }
    #${MODAL_ID} .stae__row{
      padding:10px 12px;
      display:flex; align-items:center; gap:10px;
    }
    #${MODAL_ID} .stae__row + .stae__row{ border-top:1px solid rgba(148,163,184,.10); }
    #${MODAL_ID} .stae__title{ font-size:15px; font-weight:900; color:#f8fafc; letter-spacing:.2px; }
    #${MODAL_ID} .stae__spacer{ flex:1 1 auto; }
    #${MODAL_ID} .stae__close{
      border:1px solid rgba(148,163,184,.28);
      background: rgba(255,255,255,.06);
      color:#f8fafc;
      border-radius:12px;
      padding:8px 12px;
      cursor:pointer;
      font-weight:900;
      transition: transform .12s ease, background .12s ease, border-color .12s ease;
    }
    #${MODAL_ID} .stae__close:hover{ border-color:rgba(56,189,248,.45); background: rgba(56,189,248,.12); }
    #${MODAL_ID} .stae__close:active{ transform: translateY(1px); }

    #${MODAL_ID} .stae__body{
      flex:1 1 auto;
      min-height:0;
      padding:12px;
      overflow:auto;
      overflow-x:hidden;
      box-sizing:border-box;
    }

    #${MODAL_ID} .stae__body::-webkit-scrollbar{ width:10px; }
    #${MODAL_ID} .stae__body::-webkit-scrollbar-thumb{ background: rgba(148,163,184,.35); border-radius:999px; }
    #${MODAL_ID} .stae__body::-webkit-scrollbar-thumb:hover{ background: rgba(148,163,184,.50); }

    #${MODAL_ID} .stae__msg{
      padding:18px 16px;
      border-radius:14px;
      border:1px dashed rgba(148,163,184,.45);
      background: rgba(255,255,255,.06);
      color:#f8fafc;
      font-size:20px;
      font-weight:900;
      letter-spacing:.3px;
      text-align:center;
    }

    #${MODAL_ID} .stae__list{
      display:flex;
      flex-direction:column;
      gap:10px;
    }
    #${MODAL_ID} .stae__pick{
      width:100%;
      text-align:left;
      border-radius:14px;
      border:1px solid rgba(148,163,184,.30);
      background: rgba(255,255,255,.06);
      color:#f8fafc;
      padding:10px 12px;
      font-size:13px;
      font-weight:900;
      cursor:pointer;
      transition: background .12s ease, border-color .12s ease, transform .12s ease;
    }
    #${MODAL_ID} .stae__pick:hover{ background: rgba(56,189,248,.12); border-color: rgba(56,189,248,.40); }
    #${MODAL_ID} .stae__pick:active{ transform: translateY(1px); }

    #${MODAL_ID} .stae__edit{
      width:100%;
      min-height:420px;
      border-radius:14px;
      border:1px solid rgba(148,163,184,.32);
      background: rgba(255,255,255,.07);
      padding:12px;
      color:#f8fafc;
      outline:none;
      line-height:1.55;
      font-size:14px;
      font-weight:600;
      box-sizing:border-box;
      max-width:100%;
      overflow-wrap:anywhere;
      word-break:break-word;
    }
    #${MODAL_ID} .stae__edit:focus{ border-color:rgba(56,189,248,.55); box-shadow: 0 0 0 3px rgba(56,189,248,.16); }

    #${MODAL_ID} .stae__resize{
      position:absolute;
      right:6px;
      bottom:6px;
      width:18px;
      height:18px;
      cursor:nwse-resize;
      border-radius:6px;
      border:1px solid rgba(148,163,184,.28);
      background: rgba(255,255,255,.10);
    }
    #${MODAL_ID} .stae__resize:hover{ border-color:rgba(56,189,248,.45); background: rgba(56,189,248,.14); }

    /* usage indicator (де використовується стаття) */
    #${MODAL_ID} .stae__usage{ display:flex; gap:10px; align-items:center; width:100%; flex-wrap:wrap; }
    #${MODAL_ID} .stae__usageTitle{ font-size:12px; font-weight:900; color:#e2e8f0; opacity:.95; }
    #${MODAL_ID} .stae__usagePill{
      border:1px solid rgba(56,189,248,.35);
      background: rgba(56,189,248,.12);
      color:#f8fafc;
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:900;
    }
    #${MODAL_ID} .stae__usageBtn{
      border:1px solid rgba(148,163,184,.28);
      background: rgba(255,255,255,.06);
      color:#f8fafc;
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:900;
      cursor:pointer;
      transition: background .12s ease, border-color .12s ease, transform .12s ease;
    }
    #${MODAL_ID} .stae__usageBtn:hover{ border-color:rgba(56,189,248,.45); background: rgba(56,189,248,.12); }

    /* draft/publish pill */
    #${MODAL_ID} .stae__draftPill{
      border:1px solid rgba(148,163,184,.28);
      background: rgba(255,255,255,.06);
      color:#e2e8f0;
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:900;
      user-select:none;
    }
    #${MODAL_ID} .stae__draftPill.is-draft{
      border-color:rgba(251,191,36,.45);
      background: rgba(251,191,36,.14);
      color:#fff;
    }

    /* flash для блока на полотні, коли клікаємо по "де використовується" */
    .st-article-usage-flash{
      outline: 3px solid rgba(56,189,248,.75) !important;
      outline-offset: 4px !important;
      box-shadow: 0 0 0 6px rgba(56,189,248,.18) !important;
      border-radius: 14px;
    }
    #${MODAL_ID} .stae__usageBtn:active{ transform: translateY(1px); }
    #${MODAL_ID} .stae__usageHint{ opacity:.75; font-size:12px; font-weight:800; }

  

    /* Tabs */
    .stae__tabs{
      display:inline-flex;
      gap:8px;
      padding:6px;
      border:1px solid rgba(255,255,255,0.10);
      border-radius:12px;
      background: rgba(0,0,0,0.15);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .stae__tab{
      appearance:none;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color: rgba(255,255,255,0.88);
      padding:8px 12px;
      border-radius:10px;
      font-size:12px;
      line-height:1;
      cursor:pointer;
      user-select:none;
      transition: transform .12s ease, background .12s ease, border-color .12s ease;
    }
    .stae__tab:hover{ transform: translateY(-1px); background: rgba(255,255,255,0.10); }
    .stae__tab.is-active{
      background: rgba(80,160,255,0.22);
      border-color: rgba(80,160,255,0.45);
      box-shadow: 0 0 0 2px rgba(80,160,255,0.14) inset;
    }

    /* Panes */
    .stae__pane{ height:100%; }
    .stae__pane--ai{
      height:100%;
      padding:14px;
      overflow:auto;
    }

    /* AI UI */
    .stae__ai{ display:flex; flex-direction:column; gap:12px; height:100%; }
    .stae__aiPrompt{
      width:100%;
      resize:vertical;
      min-height:72px;
      border-radius:12px;
      padding:10px 12px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.20);
      color: rgba(255,255,255,0.92);
      outline:none;
    }
    .stae__aiPrompt:focus{
      border-color: rgba(80,160,255,0.55);
      box-shadow: 0 0 0 3px rgba(80,160,255,0.14);
    }
    .stae__aiBtns{ flex-wrap:wrap; }
    .stae__aiResult{
      border-radius:12px;
      border:1px solid rgba(255,255,255,0.10);
      background: rgba(0,0,0,0.18);
      padding:12px;
      min-height:140px;
      overflow:auto;
    }
    .stae__aiResultPh{ color: rgba(255,255,255,0.55); font-size:12px; }
    .stae__aiBusy{ color: rgba(255,255,255,0.75); font-size:12px; }
    .stae__aiErr{ color: rgba(255,90,90,0.95); font-size:12px; white-space:pre-wrap; }
    .stae__aiOut{ color: rgba(255,255,255,0.90); font-size:13px; white-space:pre-wrap; }
    .stae__aiApply{ align-items:center; gap:10px; }
    .stae__aiNote{ color: rgba(255,255,255,0.55); font-size:12px; }
`;
}

function q(sel, root = modalEl){ return root ? root.querySelector(sel) : null; }

function ensureModal_() {
  if (modalEl) return;
  ensureStyles_();

  modalEl = document.createElement('div');
  modalEl.id = MODAL_ID;
  modalEl.innerHTML = `
    <div class="stae__panel" role="dialog" aria-modal="true">
      <div class="stae__head" data-head>
        <div class="stae__row" data-row="1">
          <div class="stae__title" data-title>Редактор статті</div>
          <div class="stae__spacer"></div>
          <button class="stae__close" type="button" data-act="close">Закрити</button>
        </div>
        <div class="stae__row" data-row="2"></div>
        <div class="stae__row" data-row="3"></div>
      </div>
      <div class="stae__body" data-body></div>
      <div class="stae__resize" data-resize title="Змінити розмір"></div>
    </div>
  `;

  // close handlers
  modalEl.addEventListener('click', (e) => {
    const act = e.target && e.target.dataset ? e.target.dataset.act : '';
    if (act === 'close') { closeArticleEditorModal(); return; }
    if (e.target === modalEl) { closeArticleEditorModal(); }
  });
  window.addEventListener('keydown', (e) => {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeArticleEditorModal();
  });

  document.body.appendChild(modalEl);

  initDrag_();
  initResize_();
}

function initDrag_(){
  if (__dragInited) return;
  __dragInited = true;

  const panel = q('.stae__panel', modalEl);
  const head = q('[data-head]', modalEl);
  if (!panel || !head) return;

  let dragging = false;
  let startClientX = 0;
  let startClientY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMove = (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - startClientX;
    const dy = ev.clientY - startClientY;

    // keep the panel reachable: clamp inside viewport with a small safe margin
    const margin = 8;
    const w = panel.offsetWidth || 0;
    const h = panel.offsetHeight || 0;

    let nextLeft = startLeft + dx;
    let nextTop = startTop + dy;

    const maxLeft = (window.innerWidth || 0) - w - margin;
    const maxTop = (window.innerHeight || 0) - h - margin;

    if (Number.isFinite(maxLeft)) nextLeft = Math.min(Math.max(margin, nextLeft), maxLeft);
    if (Number.isFinite(maxTop)) nextTop = Math.min(Math.max(margin, nextTop), maxTop);

    panel.style.left = String(nextLeft) + 'px';
    panel.style.top = String(nextTop) + 'px';
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  head.addEventListener('mousedown', (ev) => {
    // do not start drag from buttons in header
    if (ev.target && ev.target.closest && ev.target.closest('button')) return;
    if (!modalEl || !modalEl.classList.contains('is-open')) return;

    const r = panel.getBoundingClientRect();

    dragging = true;
    startClientX = ev.clientX;
    startClientY = ev.clientY;
    startLeft = r.left;
    startTop = r.top;

    // switch from centered transform to explicit coords
    panel.style.transform = 'none';
    panel.style.left = String(startLeft) + 'px';
    panel.style.top = String(startTop) + 'px';

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    ev.preventDefault();
  });
}


let __resizeInited = false;

function initResize_(){
  if (__resizeInited) return;
  __resizeInited = true;

  const panel = q('.stae__panel', modalEl);
  const handle = q('[data-resize]', modalEl);
  if (!panel || !handle) return;

  let resizing = false;
  let startClientX = 0;
  let startClientY = 0;
  let startW = 0;
  let startH = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMove = (ev) => {
    if (!resizing) return;
    const dx = ev.clientX - startClientX;
    const dy = ev.clientY - startClientY;

    const minW = 420;
    const minH = 320;

    const maxW = Math.max(minW, window.innerWidth);
    const maxH = Math.max(minH, window.innerHeight);

    const nextW = Math.max(minW, Math.min(maxW, startW + dx));
    const nextH = Math.max(minH, Math.min(maxH, startH + dy));

    panel.style.width = String(nextW) + 'px';
    panel.style.height = String(nextH) + 'px';
  };

  const onUp = () => {
    if (!resizing) return;
    resizing = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };

  handle.addEventListener('mousedown', (ev) => {
    if (!modalEl || !modalEl.classList.contains('is-open')) return;

    const r = panel.getBoundingClientRect();

    resizing = true;
    startClientX = ev.clientX;
    startClientY = ev.clientY;
    startW = Math.max(1, r.width);
    startH = Math.max(1, r.height);
    startLeft = r.left;
    startTop = r.top;

    // switch from centered transform to explicit coords so resize keeps position stable
    panel.style.transform = 'none';
    panel.style.left = String(startLeft) + 'px';
    panel.style.top = String(startTop) + 'px';
    panel.style.width = String(startW) + 'px';
    panel.style.height = String(startH) + 'px';

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    ev.preventDefault();
    ev.stopPropagation();
  });
}

function setTitle_(t){
  const el = q('[data-title]');
  if (el) el.textContent = String(t || 'Редактор статті');
}

function setHeadRow_(rowNum, html){
  const row = q(`[data-row="${rowNum}"]`, q('[data-head]'));
  if (!row) return;
  row.innerHTML = String(html || '');
}

function clearHeadActions_(){
  setHeadRow_(2, '');
  setHeadRow_(3, '');
}


function renderEmpty_(){
  currentId = '';
  setTitle_('Редактор статті');
  const body = q('[data-body]');
  if (!body) return;
  body.innerHTML = `<div class="stae__msg">Виберіть статтю.</div>`;
}

function renderPick_(items){
  currentId = '';
  currentSource = 'canvas';
  clearHeadActions_();
  setTitle_('Вибір статті');
  const body = q('[data-body]');
  if (!body) return;

  const safe = Array.isArray(items) ? items : [];
  const html = safe.map(it => {
    const id = String(it?.id || '');
    const title = String(it?.title || 'Стаття');
    return `<button class="stae__pick" type="button" data-act="pick" data-id="${id}">${title}</button>`;
  }).join('');

  body.innerHTML = `<div class="stae__list">${html}</div>`;

  body.onclick = (e) => {
    const btn = e.target && e.target.closest ? e.target.closest('[data-act="pick"]') : null;
    if (!btn) return;
    const id = btn.dataset.id || '';
    if (!id) return;
    const title = btn.textContent || 'Стаття';
    renderEdit_(id, title, opts);
  };
}

function findArticleDom_(id){
  if (!id) return null;
  return document.querySelector(`.st-block--article[data-uid="${CSS.escape(id)}"]`);
}

function findSelectedArticleBlockId_(){
  try {
    const selApi = window.ST_SELECTION;
    const sel = selApi && typeof selApi.get === 'function' ? selApi.get() : null;
    const els = sel && Array.isArray(sel.elements) ? sel.elements : [];
    for (const el of els) {
      if (!el || typeof el.closest !== 'function') continue;
      const block = el.closest('.st-block--article');
      const id = block && block.dataset ? (block.dataset.uid || '') : '';
      if (id) return id;
    }
  } catch (e) {}
  return '';
}

function getCurrentPageLabel_(){
  // Мінімально: поточна сторінка. Якщо є PageManager — беремо дружню назву.
  try {
    const pm = window.PageManager || window.pageManager;
    if (pm) {
      if (typeof pm.getCurrentPageTitle === 'function') {
        const t = pm.getCurrentPageTitle();
        if (t) return String(t);
      }
      if (typeof pm.getCurrentPageName === 'function') {
        const t = pm.getCurrentPageName();
        if (t) return String(t);
      }
      if (typeof pm.getCurrentPageSlug === 'function') {
        const s = pm.getCurrentPageSlug();
        if (s) return String(s);
      }
      if (typeof pm.getCurrentPageId === 'function') {
        const id = pm.getCurrentPageId();
        if (id) return String(id);
      }
    }
  } catch (e) {}

  try {
    const ss = window.siteState;
    const pid = ss && ss.page ? ss.page.id : '';
    if (pid) return String(pid);
  } catch (e) {}
  return 'Сторінка';
}


function getCurrentPageInfo_(){
  // pageId + title (для майбутніх переходів між сторінками)
  let pageId = null;
  let title = '';
  try {
    const cur = PageContext?.get?.() || {};
    pageId = cur.pageId ? String(cur.pageId) : null;
    title = cur.title ? String(cur.title) : '';
  } catch (e) {}
  if (!pageId) {
    try {
      const ss = window.siteState;
      const pid = ss && ss.page ? ss.page.id : '';
      if (pid) pageId = String(pid);
    } catch (e) {}
  }
  if (!title) {
    // fallback: те, що вже було (title або id)
    try { title = String(getCurrentPageLabel_() || ''); } catch (e) { title = ''; }
  }
  return { pageId: pageId || null, title };
}

function jumpToPageAndBlock_(pageId, pageTitle, blockId){
  const pid = pageId ? String(pageId) : '';
  const bid = blockId ? String(blockId) : '';
  if (!pid || !bid) return;

  // якщо сторінка вже активна — просто скрол/підсвітка
  try {
    const cur = PageContext?.get?.() || {};
    const curId = cur.pageId ? String(cur.pageId) : (window.siteState?.page?.id ? String(window.siteState.page.id) : '');
    if (curId && curId === pid) {
      const pid = btn.dataset.pageid || "";
          const ptitle = btn.dataset.pagetitle || "";
          // закриваємо редактор, щоб було видно canvas
          try { closeArticleEditorModal(); } catch (e) {}
          jumpToPageAndBlock_(pid, ptitle, bid);
      return;
    }
  } catch (e) {}

  // готуємо "pending jump" (на випадок, якщо віджет сторінок перерендерить canvas)
  window.__ST_ARTICLE_PENDING_JUMP__ = { pageId: pid, blockId: bid, ts: Date.now() };

  // одноразово: після зміни сторінки — скролимо до блока
  const onChanged = () => {
    const data = window.__ST_ARTICLE_PENDING_JUMP__;
    if (!data || data.blockId !== bid) return;
    // даємо DOM трошки часу перерендеритись
    setTimeout(() => {
      try { const pid = btn.dataset.pageid || "";
          const ptitle = btn.dataset.pagetitle || "";
          // закриваємо модалки, щоб було видно canvas
          try { closeLibraryModalDom_(); } catch (e) {}
          try { closeArticleEditorModal(); } catch (e) {}
          jumpToPageAndBlock_(pid, ptitle, bid); } catch (e) {}
      try { delete window.__ST_ARTICLE_PENDING_JUMP__; } catch (e) {}
    }, 60);
  };

  try { window.addEventListener('st:page-changed', onChanged, { once: true }); } catch (e) {}

  // тригеримо стандартний перехід на сторінку (як PageManager)
  try {
    window.dispatchEvent(new CustomEvent('st-page-selected', {
      detail: { pageId: pid, page: { id: pid, title: String(pageTitle || '') } },
      bubbles: false
    }));
  } catch (e) {
    // fallback: якщо подія не спрацювала — просто оновлюємо PageContext
    try { PageContext?.set?.({ pageId: pid, title: String(pageTitle || '') }); } catch (e2) {}
    onChanged();
  }
}

function getUsageBlockIdsForArticle_(articleRefId){
  const ref = String(articleRefId || '');
  if (!ref) return [];
  const ss = window.siteState;
  const blocks = ss && ss.blocks ? ss.blocks : null;
  if (!blocks) return [];

  const out = [];
  for (const [bid, b] of Object.entries(blocks)) {
    if (!b || typeof b !== 'object') continue;
    if (String(b.kind || '') !== 'article') continue;
    if (String(b.articleRefId || '') !== ref) continue;
    out.push(String(bid));
  }
  return out;
}

function flashAndScrollToBlock_(blockId){
  const id = String(blockId || '');
  if (!id) return;
  const el = findArticleDom_(id);
  if (!el) {
    alert('Не знайшов блок на полотні (можливо ви зараз не в Дизайн/Canvas).');
    return;
  }
  try {
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  } catch (e) {}
  el.classList.add('st-article-usage-flash');
  setTimeout(() => el.classList.remove('st-article-usage-flash'), 650);
}

// Закрити модалку бібліотеки статей без імпорту (уникаємо циклічних імпортів).
// Бібліотека імпортує цей файл, тому тут тільки DOM-дія.
function closeLibraryModalDom_(){
  try {
    const el = document.getElementById('stLibraryModal');
    if (el && el.classList && el.classList.contains('is-open')) {
      el.classList.remove('is-open');
    }
  } catch (e) {}
}


function getArticleHtmlFromState_(id){
  const ss = window.siteState;
  const b = ss && ss.blocks ? ss.blocks[id] : null;
  const html = b && typeof b.articleHtml === 'string' ? b.articleHtml : '';
  return html;
}

function setArticleHtmlToState_(id, html){
  const ss = window.siteState;
  if (!ss || !ss.blocks || !ss.blocks[id]) return;
  ss.blocks[id].articleHtml = String(html || '');
}


function renderEdit_(id, title, opts = {}){
  // NOTE:
  // - source: 'library' → id = articleId
  // - source: canvas (default) → id = blockUid (st-block data-uid)
  __st_blockUid = '';
  __st_isTempArticle = false;

  currentSource = (opts && opts.source === 'library') ? 'library' : 'canvas';
  currentId = String(id || '');
  currentTitle = String(title || '');

  // If opened from canvas by block uid, and block is already linked to library article → edit that article.
  if (currentSource === 'canvas') {
    __st_blockUid = currentId;
    const b = getBlockState_(__st_blockUid);
    const ref = b ? String(b.articleRefId || '') : '';
    if (ref) {
      currentId = ref; // switch to articleId for draft/publish
    } else {
      // temp id for drafts before first publish
      currentId = `tmp_block:${String(__st_blockUid || '')}`;
      __st_isTempArticle = true;
    }
  }
  clearHeadActions_();
  setTitle_(title || 'Редактор статті');

  // Tabs: Editor / AI
  setHeadRow_(2, `
    <div class="stae__tabs" data-tabs>
      <button class="stae__tab is-active" type="button" data-tab="editor">Редактор</button>
      <button class="stae__tab" type="button" data-tab="ai">AI</button>
    </div>
  `);


  // reset per-open state
  __st_activeTab = 'editor';
  __st_ai_lastHtml = '';
  __st_publishedHtml = '';
  __st_loadedVariant = 'published'; // "published" | "draft" (what we opened from)
  __st_hasDraft = false;
  __st_dirty = false;
  __st_editorReady = false;

  const body = q('[data-body]');
  if (!body) return;

  let initial = '';
  if (currentSource === 'canvas') {
    // For canvas edit we take cached html from the block state (fast, no async)
    initial = getArticleHtmlFromState_(__st_blockUid || currentId);
  }

  body.innerHTML = `
    <div class="stae__pane stae__pane--editor" data-pane="editor">
      <div class="stae__edit" contenteditable="true" spellcheck="false" data-edit></div>
    </div>

    <div class="stae__pane stae__pane--ai" data-pane="ai" hidden>
      <div class="stae__ai">
        <div class="stae__aiRow">
          <textarea class="stae__aiPrompt" data-ai-prompt rows="3" placeholder="Опиши, що потрібно зробити (prompt)..."></textarea>
        </div>

        <div class="stae__aiRow stae__aiBtns">
          <button class="stae__btn" type="button" data-ai-act="continue" title="Продовжити текст статті">Продовжити</button>
          <button class="stae__btn" type="button" data-ai-act="rewrite" title="Переписати виділене (якщо виділено)">Переписати виділене</button>
          <button class="stae__btn" type="button" data-ai-act="title" title="Згенерувати заголовок">Заголовок</button>
          <button class="stae__btn" type="button" data-ai-act="outline" title="Згенерувати структуру (H2/H3)">Структура</button>
        </div>

        <div class="stae__aiRow">
          <div class="stae__aiResult" data-ai-result>
            <div class="stae__aiResultPh">Результат AI зʼявиться тут.</div>
          </div>
        </div>

        <div class="stae__aiRow stae__aiApply">
          <button class="stae__pick" type="button" data-ai-apply="insert" title="Вставити в кінець / у курсор">Вставити</button>
          <button class="stae__pick" type="button" data-ai-apply="replace" title="Замінити виділене (якщо виділено)">Замінити виділене</button>
          <div class="stae__spacer"></div>
          <div class="stae__aiNote">Поки що це DEMO-заглушка. Пізніше підключимо реальний AI провайдер.</div>
        </div>
      </div>
    </div>
  `;

  const edit = q('[data-edit]');
  if (!edit) return;
  edit.innerHTML = initial || '';
  if (currentSource !== 'library') {
    edit.focus();
  }

  // Tabs + AI
  bindTabs_();
  bindAi_();
  setTab_('editor');

  // Actions for Library mode: Insert into selected Article-block on canvas
  if (currentSource === 'library') {
    setHeadRow_(2, `
      <div style="display:flex; gap:10px; align-items:center; width:100%">
        <button class="stae__pick" type="button" data-act="insert">Вставити в вибраний блок</button>

        <div class="stae__mode" data-draft-bar style="margin-left:auto; display:flex; gap:8px; align-items:center">
          <span class="stae__draftPill" data-draft-pill>Опубліковано</span>
          <button class="stae__btn" type="button" data-act="publish" title="Зберегти як опубліковану версію">
            Опублікувати
          </button>
          <button class="stae__btn" type="button" data-act="revert" title="Скасувати чернетку та повернути опубліковану версію">
            Відкат
          </button>
        </div>
      </div>
    `);

    const renderUsageRow_ = () => {
      const info = getCurrentPageInfo_();
      const pageId = info.pageId || "";
      const pageTitle = info.title || "";
      const pageLabel = pageTitle || pageId || getCurrentPageLabel_();
      const used = getUsageBlockIdsForArticle_(currentId);
      if (!used.length) {
        setHeadRow_(3, `
          <div class="stae__usage">
            <span class="stae__usageTitle">Де використовується:</span>
            <span class="stae__usagePill">0</span>
            <span class="stae__usageHint">Ще не вставлено на сторінку</span>
          </div>
        `);
        return;
      }

      const btns = used.map((bid, idx) => {
        const n = idx + 1;
        return `<button class="stae__usageBtn" type="button" data-act="usage-jump" data-bid="${bid}" data-pageid="${pageId}" data-pagetitle="${pageTitle}">${pageLabel} • блок ${n}</button>`;
      }).join('');

      setHeadRow_(3, `
        <div class="stae__usage">
          <span class="stae__usageTitle">Де використовується:</span>
          <span class="stae__usagePill">${used.length}</span>
          ${btns}
        </div>
      `);

      const row3 = q('[data-row="3"]', q('[data-head]'));
      if (row3 && !row3.__st_usage_bound__) {
        row3.__st_usage_bound__ = true;
        row3.addEventListener('click', (e) => {
          const btn = e.target && e.target.closest ? e.target.closest('[data-act="usage-jump"]') : null;
          if (!btn) return;
          const bid = btn.dataset.bid || '';
          if (!bid) return;
          const pid = btn.dataset.pageid || "";
          const ptitle = btn.dataset.pagetitle || "";
          // закриваємо модалки, щоб було видно canvas
          try { closeLibraryModalDom_(); } catch (e) {}
          try { closeArticleEditorModal(); } catch (e) {}
          jumpToPageAndBlock_(pid, ptitle, bid);
        });
      }
    };

    // первинний рендер "де використовується"
    renderUsageRow_();

    // Draft/Publish loader + choose dialog
    (async () => {
      // Published html: prefer passed opts.html, else load from library provider
      let published = '';
      if (typeof opts.html === 'string') published = String(opts.html || '');
      if (!published) {
        try { published = await libGetArticleHtml(currentId); } catch (e) { published = ''; }
      }
      __st_publishedHtml = String(published || '');

      let draft = '';
      try { draft = String(libGetDraftHtml(currentId) || ''); } catch (e) { draft = ''; }
      __st_hasDraft = draft.length > 0;
      const differs = __st_hasDraft && draft !== __st_publishedHtml;

      const applyVariant = (variant) => {
        __st_loadedVariant = variant === 'draft' ? 'draft' : 'published';
        const html = (__st_loadedVariant === 'draft') ? draft : __st_publishedHtml;
        edit.innerHTML = String(html || '');
        __st_dirty = false;
        refreshDraftUi_();
        edit.focus();
        removeChoiceUi_();
      };

      const removeChoiceUi_ = () => {
        const wrap = q('[data-draft-choice]');
        if (wrap && wrap.parentElement) wrap.parentElement.removeChild(wrap);
      };

      const updateDraftUi_ = () => {
        const pill = q('[data-draft-pill]');
        if (!pill) return;

        if (__st_dirty || libGetDraftHtml(currentId)) {
          pill.textContent = 'Чернетка';
          pill.classList.add('is-draft');
        } else {
          pill.textContent = 'Опубліковано';
          pill.classList.remove('is-draft');
        }
      };

      // bind publish/revert (rebind each open, handler uses current modal DOM)
      const row2 = q('[data-row="2"]', q('[data-head]'));
      if (row2) {
        if (row2.__st_draft_handler__) {
          try { row2.removeEventListener('click', row2.__st_draft_handler__); } catch (e) {}
        }
        row2.__st_draft_handler__ = (e) => {
          const btn = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
          const act = btn ? btn.getAttribute('data-act') : '';
          if (act === 'publish') {
            const ed = getEditEl_();
            const html = String(ed ? ed.innerHTML : '');
            const ok = confirm('Опублікувати цю версію статті?');
            if (!ok) return;

            let saved = false;
            try { saved = !!libSaveArticleHtml(currentId, html); } catch (e) { saved = false; }

            if (!saved) {
              try {
                const folderId = ensureDefaultArticleFolder_();
                const t = String(currentTitle || 'Стаття').trim() || 'Стаття';
                const created = libCreateArticle({ folderId, title: t, html: String(html || '') });
                if (created && created.id) {
                  try { libClearDraftHtml(currentId); } catch (e) {}
                  currentId = String(created.id);
                  __st_isTempArticle = false;
                  if (__st_blockUid) {
                    try { linkBlockToArticle_(__st_blockUid, currentId, html); } catch (e) {}
                  }
                  try { saved = !!libSaveArticleHtml(currentId, html); } catch (e) { saved = false; }
                }
              } catch (e) {}
            }

            try { libClearDraftHtml(currentId); } catch (e) {}
            __st_publishedHtml = html;
            __st_dirty = false;
            refreshDraftUi_();

            // update usage row
            try { renderUsageRow_(); } catch (e) {}

            // focus in library
            try {
              const st = libGetStateSync();
              const a = (st.articles || []).find(x => x && String(x.id) === String(currentId));
              window.dispatchEvent(new CustomEvent('st:library-focus-article', {
                detail: { id: String(currentId||''), folderId: String(a?.folderId || ''), title: String(a?.title || '') }
              }));
            } catch (e) {}
          }

          if (act === 'revert') {
            const ok = confirm('Скасувати чернетку і повернути опубліковану версію?');
            if (!ok) return;
            try { libClearDraftHtml(currentId); } catch (e) {}
            const ed = getEditEl_();
            if (ed) ed.innerHTML = String(__st_publishedHtml || '');
            __st_dirty = false;
            refreshDraftUi_();
            try { renderUsageRow_(); } catch (e) {}
            // revert preview on canvas without persisting
            try {
              window.dispatchEvent(new CustomEvent('st:article-preview-updated', {
                detail: { articleId: String(currentId||''), html: String(__st_publishedHtml || '') }
              }));
            } catch (e) {}
          }
        };
        row2.addEventListener('click', row2.__st_draft_handler__);
      }

      if (differs) {
        // show choice UI
        const choiceHtml = `
          <div data-draft-choice style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:5;">
            <div style="width:min(520px, 92%); padding:14px 14px 12px; border-radius:14px; background:rgba(15,23,42,.92); border:1px solid rgba(148,163,184,.28); box-shadow:0 20px 60px rgba(0,0,0,.45)">
              <div style="font-weight:900; font-size:14px; margin-bottom:6px">Знайдена чернетка</div>
              <div style="opacity:.9; font-size:12px; line-height:1.35; margin-bottom:10px">Відкрити для редагування чернетку або опубліковану версію? Під час набору тексту зберігається чернетка. Опублікування — кнопкою.</div>
              <div style="display:flex; gap:10px; justify-content:flex-end">
                <button class="stae__btn" type="button" data-act="open-published">Опублікована</button>
                <button class="stae__btn" type="button" data-act="open-draft">Чернетка</button>
              </div>
            </div>
          </div>
        `;

        // wrap editor container to position overlay
        const editWrap = body.querySelector('.stae__edit');
        if (editWrap) {
          editWrap.style.position = 'relative';
          editWrap.insertAdjacentHTML('beforeend', choiceHtml);
          editWrap.addEventListener('click', (ev) => {
            const b = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
            const a = b ? b.getAttribute('data-act') : '';
            if (a === 'open-draft') { ev.preventDefault(); applyVariant('draft'); }
            if (a === 'open-published') { ev.preventDefault(); applyVariant('published'); }
          }, { once: false });
        }

        // default: do not auto-apply, wait user's choice
        // update pill to show there is draft
        const pill = q('[data-draft-pill]');
        if (pill) { pill.textContent = 'Чернетка'; pill.classList.add('is-draft'); }
        return;
      }

      // no choice needed
      applyVariant(__st_hasDraft ? 'draft' : 'published');
    })();

    const btn = q('[data-act="insert"]');
    if (btn) {
      btn.addEventListener('click', () => {
        const targetId = findSelectedArticleBlockId_();
        if (!targetId) {
          alert('Спочатку виберіть блок "Стаття" на полотні (article block).');
          return;
        }
        const html = edit.innerHTML;
        // 1) запис у state
        try {
          const ss = window.siteState;
          if (ss && ss.blocks && ss.blocks[targetId]) {
            ss.blocks[targetId].articleRefId = String(currentId || '');
            ss.blocks[targetId].articleHtml = String(html || ''); // кеш для старих рендерів/фолбек
          }
        } catch (e) {}
        // 2) оновлення DOM блоку
        const dom = findArticleDom_(targetId);
        const inner = dom ? dom.querySelector('.st-article-edit') : null;
        if (inner) inner.innerHTML = String(html || '');
        // 3) збереження
        try { saveStateNow(); } catch (e) {}

        // оновити індикатор використання (щоб одразу було видно, що вставили)
        try { renderUsageRow_(); } catch (e) {}
      });
    }
  }

  let t = null;
  const flush = () => {
    const html = edit.innerHTML;
    if (currentSource === 'library') {
      // ✅ Draft autosave only. Publish happens explicitly via "Опублікувати".
      try { libSetDraftHtml(currentId, html); } catch (e) {}
      __st_dirty = true;
      // live preview on canvas (no state save)
      try {
        window.dispatchEvent(new CustomEvent('st:article-preview', {
          detail: { id: String(currentId||''), html: String(html||'') }
        }));
      } catch (e) {}

      const pill = q('[data-draft-pill]');
      if (pill) { pill.textContent = 'Чернетка'; pill.classList.add('is-draft'); }
      if (status) {
        status.textContent = 'Чернетка збережена (не опубліковано)';
        status.style.opacity = '1';
        clearTimeout(edit.__st_status_to__);
        edit.__st_status_to__ = setTimeout(() => { status.style.opacity = '.8'; }, 1100);
      }
      return;
    }

    setArticleHtmlToState_(currentId, html);

    const dom = findArticleDom_(currentId);
    const inner = dom ? dom.querySelector('.st-article-edit') : null;
    if (inner) inner.innerHTML = html;
    try { saveStateNow(); } catch (e) {}
  };

  edit.addEventListener('input', () => {
    if (t) clearTimeout(t);
    t = setTimeout(flush, 180);
  });
}

export function openArticleEditorModal(opts) {
  ensureModal_();
  if (!modalEl) return;

  modalEl.classList.add('is-open');

  const mode = opts && typeof opts.mode === 'string' ? opts.mode : 'empty';
  if (mode === 'pick') {
    renderPick_(opts.items);
    return;
  }
  if (mode === 'edit') {
    renderEdit_(opts.id, opts.title, opts);
    return;
  }
  renderEmpty_();
}

export function closeArticleEditorModal() {
  if (!modalEl) return;
  modalEl.classList.remove('is-open');
  const body = q('[data-body]');
  if (body) body.innerHTML = '';
  currentId = '';
}
