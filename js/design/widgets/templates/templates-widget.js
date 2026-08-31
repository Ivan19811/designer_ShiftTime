// js/design/widgets/templates/templates-widget.js
// Віджет "Шаблони" (MVP / КРОК 1):
// - Додає акордеон "Шаблони" у панель Дизайн
// - Усередині: під-акордеони (Сайт/Сторінка/Шапка/Футер/Секції/Меню/Сайтбар)
// - Поки без застосування/редагування — тільки UI-скелет (щоб нічого не ламати)

// NOTE: старий "site/templates-view.js" (canvas mode) лишаємо як демо, але в 2026 MVP
// конструктор шаблону сайту працює як окремий віджет у "Шаблони → Сайт".

// [00338][PERF] Галерею шаблонів більше не тягнемо статично разом із віджетом "Шаблони".
// Вона містить великі системні бібліотеки (шапки/футери/секції/магазин), тому підвантажуємо її
// тільки при реальному відкритті галереї або коли потрібно обробити клік всередині вже відкритої галереї.
// [00374][TEMPLATE GALLERY][AUTO OPEN BRIDGE]
// Усі відкриття Галереї шаблонів проходять через легкий bridge:
// він показує loading-shell, чекає lazy-import і сам дорендерює галерею без другого кліку.
function openTemplatesGalleryManager(tab, options = {}) {
  import('./templates-gallery-open-bridge.js?v=01050')
    .then((mod) => {
      const fn = mod.openTemplatesGalleryManager || mod.openTemplatesGalleryWithBridge;
      if (typeof fn === 'function') fn(tab || 'site', options || {});
    })
    .catch((err) => console.warn('[00374][templates-widget] gallery bridge failed:', err));
}
function handleTemplatesGalleryManagerClick(e) {
  import('./templates-gallery-open-bridge.js?v=01050')
    .then((mod) => {
      if (mod && typeof mod.handleTemplatesGalleryManagerClick === 'function') {
        return mod.handleTemplatesGalleryManagerClick(e);
      }
      return false;
    })
    .catch((err) => console.warn('[01015][templates-widget] gallery click bridge failed:', err));
}

import {
  canUseFsAccessApi,
  pickTemplatesBackupFolder,
  writeTemplatesBackupToFolder,
  importTemplatesFromBackupFileMerge,
  addTemplate,
  createFolder,
  getMyTemplatesFolderId01013,
  listFoldersForArea01013,
  ensureMyTemplatesFolders01013
} from './store/templates-store.js?v=01050';


import { saveStateNow } from '../../../site-state.js';




const TEMPLATES_STATE_KEY = 'st_templates_groups_state_v1';

const ST_MENU_TEMPLATE_TARGET_LS = 'st_menu_template_target_v1';
const ST_MENU_TEMPLATE_TARGET_HINT_LS = 'st_menu_selected_hint_v1';

let __stTplMenuLastSelectionSeen = false;
let __stTplMenuLastSelectionElements = [];

function stTplMenuRememberSelectionEvent_(ev) {
  try {
    __stTplMenuLastSelectionSeen = true;
    const d = ev && ev.detail ? ev.detail : null;
    const els = Array.isArray(d?.elements) ? d.elements : (d?.element ? [d.element] : []);
    __stTplMenuLastSelectionElements = els.filter(Boolean);
  } catch {
    __stTplMenuLastSelectionSeen = true;
    __stTplMenuLastSelectionElements = [];
  }
}

try { document.addEventListener('st:selection-changed', stTplMenuRememberSelectionEvent_, true); } catch {}
try { window.addEventListener('st:selection-changed', stTplMenuRememberSelectionEvent_, true); } catch {}

function stTplMenuWidgetSelector_() {
  return '.st-block--menu,[data-st-menu="1"],[data-block-kind="menu"],.hb-elem[data-block-kind="menu"]';
}

function stTplMenuWidgetFromEl_(el) {
  if (!(el instanceof HTMLElement)) return null;
  if (el.matches(stTplMenuWidgetSelector_())) return el;
  return el.closest?.(stTplMenuWidgetSelector_()) || null;
}

function stTplMenuWidgetSelected_() {
  // [00382] Для кнопки "Змінити" потрібен саме активний БЛОК меню.
  // Не підхоплюємо дочірні тексти/кнопки меню через closest(), бо тоді кнопка
  // могла бути активною навіть коли користувач вибрав не сам блок меню.
  try {
    const sel = window.ST_SELECTION?.get?.() || null;
    const els = Array.isArray(sel?.elements) ? sel.elements : [];
    for (const el of els) {
      if (el instanceof HTMLElement && el.matches(stTplMenuWidgetSelector_())) return el;
    }
  } catch {}

  if (__stTplMenuLastSelectionSeen) {
    for (const el of __stTplMenuLastSelectionElements) {
      if (el instanceof HTMLElement && el.matches(stTplMenuWidgetSelector_())) return el;
    }
    return null;
  }

  const roots = [
    document.getElementById('st-site-header-slot'),
    document.getElementById('st-site-footer-slot'),
    document.getElementById('site-root'),
    document.querySelector('.canvas__scroll'),
    document.body
  ].filter(Boolean);

  for (const root of roots) {
    try {
      const selected = root.querySelector(`${stTplMenuWidgetSelector_()}.is-active, ${stTplMenuWidgetSelector_()}.is-selected, ${stTplMenuWidgetSelector_()}.hb-dom-active, ${stTplMenuWidgetSelector_()}.hb-dom-selected`);
      if (selected instanceof HTMLElement) return selected;
    } catch {}
  }
  return null;
}

function stTplMenuWidgetTarget_(menu) {
  if (!(menu instanceof HTMLElement)) return 'header';
  const variant = String(menu.getAttribute('data-menu-variant') || menu.dataset?.menuVariant || '').toLowerCase();
  if (variant.includes('sidebar') || variant.includes('side')) return 'sidebar';
  if (menu.closest?.('#st-site-sidebar-slot, [data-sidebar], .st-sidebar, .site-sidebar, .builder-sidebar')) return 'sidebar';
  return 'header';
}

function stTplMenuWidgetEnsureTargetId_(menu) {
  if (!(menu instanceof HTMLElement)) return '';
  let id = menu.getAttribute('data-menu-design-target-id') || '';
  if (!id) {
    id = `menu_target_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    try { menu.setAttribute('data-menu-design-target-id', id); } catch {}
  }
  return id;
}

function stTplMenuWidgetRememberTarget_(menu) {
  const target = stTplMenuWidgetTarget_(menu);
  const designTargetId = stTplMenuWidgetEnsureTargetId_(menu);
  try { localStorage.setItem(ST_MENU_TEMPLATE_TARGET_LS, target); } catch {}
  try {
    localStorage.setItem(ST_MENU_TEMPLATE_TARGET_HINT_LS, JSON.stringify({
      designTargetId,
      id: menu?.id || '',
      target,
      ts: Date.now()
    }));
  } catch {}
  return target;
}

function stTplMenuWidgetSyncButton_(btn) {
  if (!btn) return;
  const menu = stTplMenuWidgetSelected_();
  const ok = !!menu;
  btn.disabled = !ok;
  btn.textContent = ok ? 'Змінити' : 'Виберіть меню';
  btn.classList.toggle('is-ready', ok);
  btn.classList.toggle('is-disabled', !ok);
  if (ok) {
    const target = stTplMenuWidgetTarget_(menu) === 'sidebar' ? 'сайтбар' : 'шапка';
    btn.title = `Змінити дизайн вибраного меню (${target}), зберігши тексти та посилання.`;
  } else {
    btn.title = 'Спочатку виберіть блок меню на полотні.';
  }
}


// =========================================================
// ШАБЛОНИ → САЙТ: список сторінок активного сайту
// =========================================================

const LS_KEY_SITES = 'st_sites';
const LS_KEY_CURRENT_SITE = 'st_sites_current';
const LS_KEY_SHOW_ALL_SITE_PAGES = 'sttpl_show_all_site_pages';

function readShowAllSitePages_() {
  try {
    const raw = window.localStorage.getItem(LS_KEY_SHOW_ALL_SITE_PAGES);
    return raw === '1';
  } catch { return false; }
}

function writeShowAllSitePages_(val) {
  try {
    window.localStorage.setItem(LS_KEY_SHOW_ALL_SITE_PAGES, val ? '1' : '0');
  } catch {}
}


function safeParseJson_(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function readCurrentSiteId_() {
  const raw = window.localStorage.getItem(LS_KEY_CURRENT_SITE);
  if (!raw) return '';

  // підтримка формату: string або JSON
  const trimmed = String(raw).trim();
  if (!trimmed) return '';

  if (trimmed[0] === '{' || trimmed[0] === '[') {
    const obj = safeParseJson_(trimmed, null);
    if (!obj) return '';
    if (typeof obj === 'string') return String(obj);
    if (typeof obj === 'object') {
      if (obj.siteId) return String(obj.siteId);
      if (obj.id) return String(obj.id);
    }
    return '';
  }

  return trimmed;
}

function readSites_() {
  const raw = window.localStorage.getItem(LS_KEY_SITES);
  const parsed = safeParseJson_(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function findSiteById_(sites, id) {
  const sid = String(id || '');
  if (!sid) return null;
  return sites.find((s) => s && String(s.id) === sid) || null;
}

function renderSitePagesList_(listEl) {
  if (!listEl) return;
  const sites = readSites_();
  const currentSiteId = readCurrentSiteId_();
  const site = findSiteById_(sites, currentSiteId);

  listEl.innerHTML = '';

  if (!site) {
    const empty = document.createElement('div');
    empty.className = 'sttpl-tree__item';
    empty.textContent = 'Активний сайт не вибрано. Натисни «Відкрити сайт» у віджеті «Сайт». '; 
    listEl.appendChild(empty);
    return;
  }

  const pages = Array.isArray(site.pages) ? site.pages : [];
  const showAllPages = readShowAllSitePages_();
  const visiblePages = showAllPages ? pages : pages.filter(p => ((p && p.status) ? String(p.status) : 'published') === 'published');
  if (!visiblePages.length) {
    const empty = document.createElement('div');
    empty.className = 'sttpl-tree__item';
    empty.textContent = 'У цього сайту ще немає сторінок.';
    listEl.appendChild(empty);
    return;
  }

  for (const p of visiblePages) {
    const item = document.createElement('div');
    item.className = 'sttpl-tree__item';
    const __status = (p && p.status) ? String(p.status) : 'published';
    if (showAllPages && __status !== 'published') item.classList.add('is-inactive');
    // ✅ Клік по сторінці має перемикати сторінку в конструкторі
    try { item.dataset.pageId = (p && p.id != null) ? String(p.id) : ''; } catch {}
    item.style.cursor = 'pointer';
    if (site.currentPageId && p && String(p.id) === String(site.currentPageId)) {
      item.classList.add('is-active');
    }

    const name = document.createElement('div');
    name.style.fontWeight = '800';
    name.style.fontSize = '12px';
    name.textContent = (p && p.name) ? String(p.name) : 'Без назви';

    
    // path (URL) ховаємо з UI, але показуємо у tooltip (delay 3s через data-tip)
    const __path = (p && p.path) ? String(p.path) : '/';
    const __url = (typeof location !== 'undefined' && location.origin) ? (location.origin + __path) : __path;
    item.setAttribute('data-tip',
      'Шлях сторінки: ' + __path + '\n' +
      'Повна адреса: ' + __url + '\n\n' +
      'Шлях (path) — це частина URL після домену.'
    );

item.appendChild(name);
    listEl.appendChild(item);
  }
}

function initActiveSitePagesListWidget_(hostEl) {
  if (!hostEl) return;
  const listEl = hostEl.querySelector('[data-site-pages-list]');
  if (!listEl) return;

  const toggleEl = hostEl.querySelector('[data-site-pages-toggle]');
  if (toggleEl && !toggleEl.__stBound) {
    toggleEl.__stBound = true;
    try { toggleEl.checked = readShowAllSitePages_(); } catch {}
    toggleEl.addEventListener('change', () => {
      writeShowAllSitePages_(!!toggleEl.checked);
      renderSitePagesList_(listEl);
    });
  }

  // первинний рендер
  try {
    const __t = hostEl.querySelector('[data-site-pages-toggle]');
    if (__t) __t.checked = readShowAllSitePages_();
  } catch {}
  renderSitePagesList_(listEl);

  // ✅ Делегований клік по елементах списку (стійкий до перерендеру)
  if (!listEl.__stSitePagesClickBound) {
    listEl.__stSitePagesClickBound = true;
    listEl.addEventListener('click', (ev) => {
      const row = ev?.target?.closest?.('.sttpl-tree__item');
      if (!row || !listEl.contains(row)) return;
      const pageId = row.dataset ? row.dataset.pageId : '';
      if (!pageId) return;

      // ✅ Миттєва підсвітка (без очікування перерендеру)
      try {
        listEl.querySelectorAll('.sttpl-tree__item.is-active').forEach((el) => el.classList.remove('is-active'));
        row.classList.add('is-active');
      } catch {}

      const sites = readSites_();
      const currentSiteId = readCurrentSiteId_();
      const site = findSiteById_(sites, currentSiteId);
      if (!site) return;

      // 1) Запам'ятовуємо поточну сторінку всередині сайту
      try { site.currentPageId = String(pageId); } catch {}
      try { window.localStorage.setItem(LS_KEY_SITES, JSON.stringify(sites)); } catch {}

      // 2) Перемикаємо сторінку в конструкторі
      // IMPORTANT: у проекті є два слухачі st-page-selected:
      // - document.addEventListener(...) робить реальне перемикання полотна (snapshot apply)
      // - window.addEventListener(...) оновлює UI/віджети
      // Тому емiтимо подію в ОБИДВА місця.
      try {
        const page = (site.pages || []).find(p => p && String(p.id) === String(pageId)) || null;
        const pageTitle = page?.title || page?.name || page?.slug || '';
        const pagePath  = page?.path  || page?.url  || '';

        // 1) document-listener: реальне перемикання полотна (потрібен pageId)
        const evtDoc = new CustomEvent('st-page-selected', {
          detail: { pageId: String(pageId), page: page ? { id: String(pageId), title: pageTitle, path: pagePath } : null, title: pageTitle }
        });
        document.dispatchEvent(evtDoc);

        // 2) window-listener: UI-оновлення / дизайн-панель (очікує detail.page)
        const evtWin = new CustomEvent('st-page-selected', {
          detail: { site, page: page ? { id: String(pageId), title: pageTitle, path: pagePath } : { id: String(pageId), title: pageTitle } },
          bubbles: false
        });
        window.dispatchEvent(evtWin);
      } catch {}

      // 3) Оновлюємо підсвітку списку
      try { renderSitePagesList_(listEl); } catch {}
    });
  }


  // оновлення при виборі/відкритті сайту
  window.addEventListener('st-site-selected', () => renderSitePagesList_(listEl));
  window.addEventListener('st-page-selected', () => renderSitePagesList_(listEl));

  // якщо localStorage змінюється в іншій вкладці
  window.addEventListener('storage', (e) => {
    if (!e) return;
    if (e.key === LS_KEY_SITES || e.key === LS_KEY_CURRENT_SITE) {
      renderSitePagesList_(listEl);
    }
  });
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(TEMPLATES_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.warn('[templates-widget] Не вдалося прочитати стан', e);
    return {};
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(TEMPLATES_STATE_KEY, JSON.stringify(state || {}));
  } catch (e) {
    console.warn('[templates-widget] Не вдалося зберегти стан', e);
  }
}

function createGroup(id, title, subtitle, bodyHtml) {
  const wrap = document.createElement('div');
  wrap.className = 'st-templates-group';
  wrap.dataset.groupId = id;

  const body = bodyHtml || `
    <div class="st-templates-empty">
      <div class="st-templates-empty__title">Поки що порожньо</div>
      <div class="st-templates-empty__note">На Кроці 2 додамо галерею шаблонів, Apply та Edit.</div>
    </div>
  `;

  wrap.innerHTML = `
    <button class="st-templates-group__header" type="button">
      <div class="st-templates-group__title">
        <span class="st-templates-group__name">${title}</span>
        ${subtitle ? `<span class="st-templates-group__sub">${subtitle}</span>` : ''}
      </div>
      <span class="st-templates-group__chev">▶</span>
    </button>
    <div class="st-templates-group__body">
      ${body}
    </div>
  `;

  return wrap;
}

// =========================================================
// ШАПКА → ЗБЕРЕГТИ ЯК СИСТЕМНИЙ ШАБЛОН
// =========================================================
function stripHeaderTransientState_(root) {
  if (!root) return;
  const transientClasses = [
    'is-active', 'is-selected', 'is-hover', 'is-dragging', 'is-resizing',
    'is-drop-target', 'st-drop-target', 'st-selected', 'st-active',
    'st-outline', 'st-hover-outline', 'st-sec-drop-target'
  ];
  const transientAttrs = [
    'data-st-selected', 'data-st-active', 'data-st-hover', 'data-st-dragging',
    'data-st-resizing', 'data-drop-target', 'data-st-drop-target',
    'aria-selected'
  ];

  root.querySelectorAll('*').forEach((el) => {
    try { el.classList.remove(...transientClasses); } catch {}
    transientAttrs.forEach((attr) => {
      try { el.removeAttribute(attr); } catch {}
    });
  });
}

function normalizeHeaderTemplateHtml_(html) {
  const src = String(html || '').trim();
  if (!src) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = src;

  // Якщо випадково зберігся runtime-wrapper site-header — у шаблон кладемо тільки його вміст.
  const runtimeWrap = tmp.querySelector('[data-st-role="site-header"]');
  const host = runtimeWrap || tmp;
  stripHeaderTransientState_(host);

  return (runtimeWrap ? runtimeWrap.innerHTML : tmp.innerHTML).trim();
}

function getCurrentHeaderHtmlForTemplate_() {
  // 1) Найточніше — те, що реально зараз стоїть у слоті шапки.
  const slot = document.getElementById('st-site-header-slot');
  let html = slot?.innerHTML ? String(slot.innerHTML).trim() : '';
  if (html) return normalizeHeaderTemplateHtml_(html);

  // 2) Fallback: читаємо активний режим із runtime/state.
  try {
    const state = window.ST_HEADER_STATE?.getState?.();
    const pageId = window.SiteHeaderRuntime?.getPageId?.();
    const mode = window.SiteHeaderRuntime?.getMode?.(pageId) || 'global';
    if (mode === 'page' && pageId && state?.pages?.[String(pageId)]?.html) {
      html = String(state.pages[String(pageId)].html || '').trim();
    }
    if (!html && state?.global?.html) html = String(state.global.html || '').trim();
  } catch {}

  return normalizeHeaderTemplateHtml_(html);
}

function defaultHeaderTemplateName_() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `Моя шапка ${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


// =========================================================
async function saveCurrentHeaderAsSystemTemplate_() {
  const html = getCurrentHeaderHtmlForTemplate_();
  if (!html) {
    try { alert('Не знайдено активну шапку для збереження. Спочатку застосуй або створи шапку.'); } catch {}
    return { ok: false, reason: 'empty-header' };
  }

  const defaultName = defaultHeaderTemplateName_();
  let name = defaultName;
  try {
    const entered = window.prompt('Назва нового системного шаблону шапки:', defaultName);
    if (entered === null) return { ok: false, reason: 'cancelled' };
    name = String(entered || '').trim() || defaultName;
  } catch {}

  const id = `header_saved_system_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const item = addTemplate({
    id,
    type: 'header',
    folderId: 'fld_header',
    name,
    html,
    previewHtml: html,
    description: 'Збережено з поточної відредагованої шапки через віджет Шаблони → Шапка.',
    meta: {
      source: 'system',
      userSavedSystem: true,
      savedFrom: 'current-header',
      tools: ['header', 'section', 'row', 'container', 'menu', 'text', 'button'],
      portableNote: 'Для перенесення між конструкторами експортуй/імпортуй backup шаблонів або збережи backup поруч із проєктом.'
    }
  });

  // Якщо користувач уже вибрав backup-папку — робимо додатковий portable backup.
  let backupInfo = '';
  try {
    const res = await writeTemplatesBackupToFolder();
    if (res?.ok) backupInfo = `\n\nBackup також записано: ${res.filename || ''}`;
  } catch {}

  try {
    alert(`Шапку збережено як системний шаблон ✅\n\nНазва: ${item.name}${backupInfo}\n\nЩоб перенести на інший компʼютер/конструктор, використовуй кнопки 📁/💾/⬆ backup у верхній частині віджета «Шаблони».`);
  } catch {}

  try { window.dispatchEvent(new CustomEvent('st:templates-store-updated', { detail: { type: 'header', templateId: item.id } })); } catch {}
  return { ok: true, item };
}



// =========================================================
// 01013 · КОРИСТУВАЦЬКІ / СИСТЕМНІ H/M/F ШАБЛОНИ
// =========================================================
function stTplEsc01013_(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function stTplAreaLabel01013_(area) {
  return ({ header:'Шапка', main:'Маїн', footer:'Футер' })[String(area || '').toLowerCase()] || 'Шаблон';
}

function stTplDefaultName01013_(area) {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `Мій шаблон ${stTplAreaLabel01013_(area)} ${pad(d.getDate())}.${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function stTplStripRuntime01013_(root) {
  if (!(root instanceof HTMLElement)) return root;
  const all = [root, ...root.querySelectorAll('*')];
  const transientClasses = [
    'is-active','is-selected','is-hover','is-dragging','is-resizing','is-drop-target',
    'st-drop-target','st-selected','st-active','st-outline','st-hover-outline','st-sec-drop-target',
    'sf-selection-current','sf-selection-front-path','hb-dom-active','hb-dom-selected'
  ];
  const transientAttrs = [
    'data-st-selected','data-st-active','data-st-hover','data-st-dragging','data-st-resizing',
    'data-drop-target','data-st-drop-target','aria-selected','data-st-fx-active-slide',
    'data-st-fx-current-link','data-st-fx-runtime','data-st-fx-paused-by-editor'
  ];
  for (const el of all) {
    try { el.classList.remove(...transientClasses); } catch {}
    for (const attr of transientAttrs) { try { el.removeAttribute(attr); } catch {} }
  }
  root.querySelectorAll('.st-resize,[data-st-resize-handle],.st-fx-bg-stage,.st-fx-nav,.st-fx-arrow,[data-st-runtime-only="1"]').forEach((el) => el.remove());
  return root;
}

function stTplCloneHtml01013_(element, { inner = false } = {}) {
  if (!(element instanceof HTMLElement)) return '';
  const clone = element.cloneNode(true);
  stTplStripRuntime01013_(clone);
  return String(inner ? clone.innerHTML : clone.outerHTML).trim();
}

function stTplMainSection01013_() {
  const slot = document.getElementById('st-site-main-slot');
  if (!(slot instanceof HTMLElement)) return null;
  let sectionId = '';
  try { sectionId = String(window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.resolveMainTemplateTarget?.()?.sectionId || ''); } catch {}
  if (sectionId) {
    try {
      const safe = window.CSS?.escape ? CSS.escape(sectionId) : sectionId.replace(/(["\\])/g, '\\$1');
      const byId = slot.querySelector(`[data-sf-id="${safe}"],[data-st-node-id="${safe}"],[data-node-id="${safe}"]`);
      const section = byId?.matches?.('.st-section,section') ? byId : byId?.closest?.('.st-section,section');
      if (section instanceof HTMLElement) return section;
    } catch {}
  }
  const selected = slot.querySelector('.st-section.is-selected,section.is-selected,.sf-selection-current.st-section,.sf-selection-current[data-sf-kind="section"]');
  if (selected instanceof HTMLElement) return selected;
  const direct = Array.from(slot.children).find((el) => el instanceof HTMLElement && el.matches('.st-section,section'));
  return direct instanceof HTMLElement ? direct : (slot.querySelector('.st-section,section') || null);
}

function getCurrentTemplateHtml01013_(area) {
  const safe = String(area || '').toLowerCase();
  if (safe === 'header') return getCurrentHeaderHtmlForTemplate_();
  if (safe === 'main') return stTplCloneHtml01013_(stTplMainSection01013_());
  if (safe === 'footer') {
    const slot = document.getElementById('st-site-footer-slot');
    if (!(slot instanceof HTMLElement)) return '';
    const root = Array.from(slot.children).find((el) => el instanceof HTMLElement && el.matches('.st-section,footer,section'))
      || slot.querySelector('.st-section,footer,section');
    return root instanceof HTMLElement ? stTplCloneHtml01013_(root) : stTplCloneHtml01013_(slot, { inner: true });
  }
  return '';
}

function stTplFolderOptions01013_(area, mode) {
  const myOnly = mode === 'user';
  let rows = listFoldersForArea01013(area, { myTemplatesOnly: myOnly });
  if (mode === 'system') {
    rows = rows.filter((row) => !row.path?.some?.((name) => String(name).toUpperCase() === 'МОЇ ШАБЛОНИ'));
  }
  return rows;
}

function stTplSaveDialog01013_(area, mode = 'user') {
  ensureMyTemplatesFolders01013();
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'sttpl-save-template-overlay-01013';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:1000000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.76);backdrop-filter:blur(7px);';
    const label = stTplAreaLabel01013_(area);
    const isSystem = mode === 'system';
    overlay.innerHTML = `
      <div role="dialog" aria-modal="true" style="width:min(720px,calc(100vw - 32px));max-height:min(820px,calc(100vh - 36px));overflow:auto;border:1px solid ${isSystem ? 'rgba(251,191,36,.55)' : 'rgba(56,189,248,.48)'};border-radius:22px;background:linear-gradient(180deg,#0c1628,#07101d);box-shadow:0 34px 110px rgba(0,0,0,.72);color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial,sans-serif;">
        <div style="padding:20px 22px;border-bottom:1px solid rgba(255,255,255,.12);">
          <div style="font-size:22px;font-weight:950;">${isSystem ? 'Зберегти як системний шаблон' : 'Зберегти у МОЇ ШАБЛОНИ'}</div>
          <div style="margin-top:6px;color:rgba(255,255,255,.68);font-size:13px;">${stTplEsc01013_(label)} · ${isSystem ? 'можна обрати системну папку. Пізніше ця дія буде доступна лише адміністратору.' : 'користувацький шаблон не змішується із заводськими.'}</div>
        </div>
        <div style="padding:20px 22px;display:grid;gap:16px;">
          <label style="display:grid;gap:7px;font-weight:800;">Назва шаблону
            <input data-sttpl-save-name value="${stTplEsc01013_(stTplDefaultName01013_(area))}" style="width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;color:#0f172a;padding:12px 13px;font-size:15px;font-weight:750;">
          </label>
          <label style="display:grid;gap:7px;font-weight:800;">Папка
            <select data-sttpl-save-folder style="width:100%;box-sizing:border-box;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;color:#0f172a;padding:12px 13px;font-size:14px;font-weight:750;"></select>
          </label>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <button type="button" data-sttpl-new-folder style="border:1px solid rgba(56,189,248,.45);border-radius:12px;background:rgba(56,189,248,.12);color:#e0f2fe;padding:10px 13px;font-weight:850;cursor:pointer;">+ Нова папка всередині вибраної</button>
            <span style="font-size:12px;color:rgba(255,255,255,.58);">Наприклад: МОЇ ШАБЛОНИ / Освіта / Школа</span>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding:18px 22px;border-top:1px solid rgba(255,255,255,.12);">
          <button type="button" data-sttpl-save-cancel style="border:1px solid rgba(255,255,255,.20);border-radius:12px;background:rgba(255,255,255,.06);color:#fff;padding:11px 17px;font-weight:850;cursor:pointer;">Скасувати</button>
          <button type="button" data-sttpl-save-ok style="border:0;border-radius:12px;background:${isSystem ? '#d97706' : '#0284c7'};color:#fff;padding:11px 18px;font-weight:950;cursor:pointer;">Зберегти</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const nameEl = overlay.querySelector('[data-sttpl-save-name]');
    const folderEl = overlay.querySelector('[data-sttpl-save-folder]');
    const refreshFolders = (preferId = '') => {
      const rows = stTplFolderOptions01013_(area, mode);
      folderEl.innerHTML = rows.map((row) => {
        const indent = '— '.repeat(Math.max(0, Number(row.depth || 0)));
        const labelText = `${indent}${row.name}${row.userTemplatesRoot ? ' ★' : ''}`;
        return `<option value="${stTplEsc01013_(row.id)}">${stTplEsc01013_(labelText)}</option>`;
      }).join('');
      const fallback = mode === 'user' ? getMyTemplatesFolderId01013(area) : `fld_${area}`;
      const target = preferId || fallback;
      if (target && Array.from(folderEl.options).some((o) => o.value === target)) folderEl.value = target;
    };
    refreshFolders();
    const close = (value) => { overlay.remove(); resolve(value); };
    overlay.querySelector('[data-sttpl-save-cancel]')?.addEventListener('click', () => close(null));
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) close(null); });
    overlay.querySelector('[data-sttpl-new-folder]')?.addEventListener('click', () => {
      const parentId = String(folderEl.value || (mode === 'user' ? getMyTemplatesFolderId01013(area) : `fld_${area}`));
      const entered = prompt('Назва нової папки:', 'Нова папка');
      const name = String(entered || '').trim();
      if (!name) return;
      const folder = createFolder({ parentId, type: area, name, system: false });
      if (!folder) { alert('Не вдалося створити папку.'); return; }
      refreshFolders(folder.id);
    });
    overlay.querySelector('[data-sttpl-save-ok]')?.addEventListener('click', () => {
      const name = String(nameEl?.value || '').trim();
      const folderId = String(folderEl?.value || '').trim();
      if (!name || !folderId) { alert('Вкажи назву та папку.'); return; }
      close({ name, folderId });
    });
    setTimeout(() => { try { nameEl?.select(); nameEl?.focus(); } catch {} }, 0);
  });
}

async function saveCurrentAreaTemplate01013_(area, mode = 'user') {
  const html = getCurrentTemplateHtml01013_(area);
  if (!html) {
    alert(`Не знайдено активний ${stTplAreaLabel01013_(area)} для збереження.`);
    return { ok:false, reason:'empty' };
  }
  const dialog = await stTplSaveDialog01013_(area, mode);
  if (!dialog) return { ok:false, reason:'cancelled' };
  const isSystem = mode === 'system';
  const id = `${area}_${isSystem ? 'saved_system' : 'my'}_${Date.now()}_${Math.random().toString(16).slice(2,8)}`;
  const item = addTemplate({
    id,
    type: area,
    folderId: dialog.folderId,
    name: dialog.name,
    html,
    previewHtml: html,
    description: isSystem
      ? `Збережено з поточного відредагованого ${stTplAreaLabel01013_(area)} як системний шаблон.`
      : `Власний шаблон ${stTplAreaLabel01013_(area)}.`,
    meta: {
      source: 'user',
      userSaved: true,
      userSavedSystem: isSystem,
      saveClass: isSystem ? 'system-library' : 'my-templates',
      savedFrom: `current-${area}`,
      savedAt01013: Date.now(),
      savedAt01018: Date.now(),
      adminOnlyLater: isSystem === true,
      portableViaTemplatesBackup: true,
      packedPersistence01018: true
    }
  });
  const persisted01018 = item?.__persisted01018 === true;
  if (!persisted01018) {
    try {
      window.dispatchEvent(new CustomEvent('st:user-template-save-result-01018', {
        detail: { ok:false, type:area, templateId:id, folderId:dialog.folderId, reason:'local-storage-persist-failed' }
      }));
    } catch {}
    alert('Шаблон не вдалося записати у сховище браузера. У 01018 збереження перевіряється після запису, тому помилкового повідомлення про успіх більше не буде.');
    return { ok:false, reason:'persist-failed' };
  }
  try {
    window.dispatchEvent(new CustomEvent('st:user-template-save-result-01018', {
      detail: { ok:true, type:area, templateId:item.id, folderId:dialog.folderId, packedPersistence:true }
    }));
  } catch {}
  try { window.dispatchEvent(new CustomEvent('st:templates-store-updated', { detail: { type: area, templateId: item.id, folderId: dialog.folderId } })); } catch {}
  try { openTemplatesGalleryManager(area, { folderId: dialog.folderId, templateId: item.id }); } catch {}
  return { ok:true, item };
}

export function initTemplatesWidget(host) {
  if (!host) return;

  // DEBUG (тимчасово): детальні логи для діагностики APPLY (Footer)
  // Вимкнути в консолі: window.__ST_TPL_DEBUG__ = false;
  if (window.__ST_TPL_DEBUG__ === undefined) window.__ST_TPL_DEBUG__ = true;

  // Захист від подвійної ініціалізації
  if (host.querySelector('[data-widget="templates"]')) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.dataset.widget = 'templates';

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title">
        <span>Шаблони</span>
        <span class="design-section__header-subtitle"></span>
      </div>
      <span class="design-section__chevron">▶</span>
    </button>

    <div class="design-section__body">
      <div class="sttpl-backupbar" data-backupbar>
        <button class="sttpl-btn sttpl-backupbtn" type="button" data-act="tpl-backup-pick"
          aria-label="Папка backup"
          data-tip="Папка backup

1) Натисни і вибери папку на диску (наприклад Desktop/ShiftTime_Backups).
2) Це потрібно зробити один раз у Chrome/Edge — браузер попросить доступ.

Після цього можна зберігати backup в цю папку.">📁</button>

        <button class="sttpl-btn sttpl-backupbtn" type="button" data-act="tpl-backup-write"
          aria-label="Зберегти backup"
          data-tip="Зберегти backup

Створює JSON-файл у вибраній папці з усіма шаблонами (Сайт/Сторінка/Шапка/Футер/Секції…).

Порада: натискай після великих змін — це твій швидкий бекап.">💾</button>

        <button class="sttpl-btn sttpl-backupbtn" type="button" data-act="tpl-backup-import"
          aria-label="Імпорт (MERGE)"
          data-tip="Імпорт (MERGE)

Вибери JSON-файл backup і система:
• додасть нові шаблони
• оновить існуючі по ID
• нічого не видалить

Використовуй, щоб переносити шаблони між різними ZIP/версіями.">⬆</button>
      </div>

      <!-- Пояснення перенесені у tooltip на заголовок "Шаблони" (delay 3s) -->

      <div class="st-templates-groups" data-templates-groups></div>

      

     <button class="sttpl-btn sttpl-btn--gallery st-templates-gallery-btn"
        type="button"
              data-open-templates-gallery>
        Галерея шаблонів
      </button>


    </div>
  `;

  // Tooltip (delay 3s) для заголовка "Шаблони" — перенесені пояснення, щоб не захаращувати інтерфейс.
  const __tplHeaderBtn = sectionEl.querySelector('.design-section__header');
  if (__tplHeaderBtn) {
    __tplHeaderBtn.setAttribute('data-tip',
`Готові рішення для сайту

Тут будуть шаблони Сайту, Сторінки, Шапки, Футера, Секцій, Меню та Сайтбара.`);
  }

// ---------- Backupbar tooltips (delay 3s) ----------
const _tip = (() => {
  let el = null;
  let t = null;
  let lastTarget = null;

  const ensure = () => {
    if (el) return el;
    el = document.createElement('div');
    el.className = 'sttpl-tooltip sttpl-tooltip--hidden';
    el.setAttribute('role', 'tooltip');
    document.body.appendChild(el);
    return el;
  };

  const hide = () => {
    if (t) { clearTimeout(t); t = null; }
    lastTarget = null;
    if (el) el.classList.add('sttpl-tooltip--hidden');
  };

  const showFor = (target) => {
    const tip = target?.getAttribute?.('data-tip');
    if (!tip) return;
    const box = target.getBoundingClientRect();
    const tooltip = ensure();
    tooltip.textContent = tip;
    tooltip.classList.remove('sttpl-tooltip--hidden');

    // Position: bottom-center of target (with viewport clamps)
    const pad = 10;
    const ttRect = tooltip.getBoundingClientRect();
    let x = box.left + (box.width / 2) - (ttRect.width / 2);
    let y = box.bottom + 10;

    x = Math.max(pad, Math.min(x, window.innerWidth - ttRect.width - pad));
    y = Math.max(pad, Math.min(y, window.innerHeight - ttRect.height - pad));

    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  };

  const arm = (target) => {
    hide();
    lastTarget = target;
    t = setTimeout(() => {
      if (!lastTarget) return;
      showFor(lastTarget);
    }, 3000);
  };

  // Public API
  return { arm, hide };
})();

// Hover handlers for tooltip (works even if buttons re-render)
sectionEl.addEventListener('mouseover', (ev) => {
  const btn = ev.target?.closest?.('[data-tip]');
  if (!btn || !sectionEl.contains(btn)) return;
  _tip.arm(btn);
});

sectionEl.addEventListener('mouseout', (ev) => {
  const from = ev.target?.closest?.('[data-tip]');
  if (!from) return;
  const to = ev.relatedTarget?.closest?.('[data-tip]');
  if (from && from === to) return; // moving внутри той же кнопки
  _tip.hide();
});

// Hide tooltip on any click / scroll
sectionEl.addEventListener('click', () => _tip.hide(), true);
window.addEventListener('scroll', () => _tip.hide(), true);



    // Кнопка "Галерея шаблонів"  ==========================================================================
const openBtn = sectionEl.querySelector('[data-open-templates-gallery]');
if (openBtn) {
  openBtn.addEventListener('click', () => {
    openTemplatesGalleryManager();
  });
}

// Делегування кліків (1 раз на документ)
if (!window.__stTplGalleryMgrBound) {
  window.__stTplGalleryMgrBound = true;




  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // ESC закриває менеджер, якщо він відкритий
      const v = document.getElementById('templatesGalleryManagerView');
      if (v && v.style.display !== 'none') {
        e.preventDefault();
        // close зсередини view по кнопці back
        const back = v.querySelector('[data-act="back"]');
        if (back) back.click();
      }
    }
  });

  document.addEventListener('click', (e) => {
    handleTemplatesGalleryManagerClick(e);
  });
}


//---------------------------------------------------------------------------------------------













  // toggle основного акордеона
  const headerBtn = sectionEl.querySelector('.design-section__header');
  if (headerBtn) {
    headerBtn.addEventListener('click', () => {
      sectionEl.classList.toggle('is-open');
    });
  }

  // рендер груп
  const groupsHost = sectionEl.querySelector('[data-templates-groups]');
  if (!groupsHost) {
  
  // Backup bar handlers (FS Access API)
  sectionEl.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.getAttribute('data-act');

    if (act === 'tpl-backup-pick') {
      if (!canUseFsAccessApi()) {
        alert('Цей браузер не підтримує вибір папки (потрібен Chrome/Edge).');
        return;
      }
      const res = await pickTemplatesBackupFolder();
      if (res.ok) alert('Папку для backup вибрано ✅');
      else if (res.reason !== 'aborted') alert('Не вдалося вибрати папку ❌');
      return;
    }

    if (act === 'tpl-backup-write') {
      if (!canUseFsAccessApi()) {
        alert('Цей браузер не підтримує запис у папку (потрібен Chrome/Edge).');
        return;
      }
      const res = await writeTemplatesBackupToFolder();
      if (res.ok) alert('Backup збережено ✅\n' + (res.filename || ''));
      else if (res.reason === 'no-folder') alert('Спочатку натисни “Папка backup” і вибери папку.');
      else if (res.reason !== 'aborted') alert('Помилка збереження backup ❌');
      return;
    }

    if (act === 'tpl-backup-import') {
      if (!canUseFsAccessApi()) {
        alert('Цей браузер не підтримує імпорт з файлу через picker (потрібен Chrome/Edge).');
        return;
      }
      const res = await importTemplatesFromBackupFileMerge();
      if (res.ok) alert('Імпорт (MERGE) виконано ✅\n' + (res.filename || ''));
      else if (res.reason !== 'aborted') alert('Помилка імпорту ❌');
      return;
    }
  });

  host.appendChild(sectionEl);
    return;
  }

  const groups = [
    { id: 'header',       title: 'Шапка',               sub: 'Header-секції' },
    { id: 'main',         title: 'Маїн',                sub: 'Main-секції' },
    { id: 'footer',       title: 'Футер',               sub: 'Footer-секції' },
    { id: 'style-sync',   title: 'Синхронізація стилів шаблонів', sub: 'Header · Main · Footer' },
    { id: 'menu',         title: 'Меню',                sub: 'Навігація та посилання' },
  ];

  const state = loadState();

  groups.forEach((g) => {
   const headerBody = `
  <div class="st-header-widget">
    <button class="st-btn st-btn--primary st-header-templates-btn sttpl-action-btn sttpl-action-btn--open" type="button" data-open-header-templates data-tip="ШАБЛОНИ ШАПКИ

Відкриває галерею готових шаблонів шапки. Тут можна вибрати системний шаблон або власний шаблон з папки МОЇ ШАБЛОНИ та застосувати його до сайту.">Шаблони Шапки</button>
    <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px;">
      <button class="st-btn sttpl-action-btn sttpl-action-btn--user" type="button" data-save-user-template="header" data-tip="ЗБЕРЕГТИ ШАБЛОН ШАПКИ

Зберігає поточну відредаговану шапку у МОЇ ШАБЛОНИ. Під час збереження можна вибрати або створити вкладену папку, наприклад МОЇ ШАБЛОНИ / Освіта / Школа.">Зберегти шаблон</button>
      <button class="st-btn sttpl-action-btn sttpl-action-btn--system" type="button" data-save-system-template="header" data-tip="ЗБЕРЕГТИ ЯК СИСТЕМНИЙ ШАБЛОН ШАПКИ

Зберігає поточну шапку у вибрану системну папку бібліотеки, а не у МОЇ ШАБЛОНИ. Пізніше ця дія буде доступна тільки адміністратору конструктора.">Зберегти як системний шаблон</button>
    </div>
    <div class="st-header-hint">
      «Зберегти шаблон» записує у МОЇ ШАБЛОНИ. Усередині можна створювати свої папки. Системне збереження поки доступне всім; пізніше залишимо його тільки адміністратору.
    </div>
  </div>
`;



const mainBody = `
  <div class="st-header-widget">
    <button class="st-btn st-btn--primary st-header-templates-btn sttpl-action-btn sttpl-action-btn--open" type="button" data-open-main-templates data-tip="ШАБЛОНИ МАЇН

Відкриває галерею готових Main-шаблонів. Тут можна вибрати системний шаблон або власний шаблон з папки МОЇ ШАБЛОНИ та додати чи замінити Main-секцію.">Шаблони Маїн</button>
    <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px;">
      <button class="st-btn sttpl-action-btn sttpl-action-btn--user" type="button" data-save-user-template="main" data-tip="ЗБЕРЕГТИ ШАБЛОН МАЇН

Зберігає активну відредаговану Main-секцію з поточними текстами, стилями, геометрією і налаштуваннями слайдера у МОЇ ШАБЛОНИ. Можна вибрати або створити власну вкладену папку.">Зберегти шаблон</button>
      <button class="st-btn sttpl-action-btn sttpl-action-btn--system" type="button" data-save-system-template="main" data-tip="ЗБЕРЕГТИ ЯК СИСТЕМНИЙ ШАБЛОН МАЇН

Зберігає активну Main-секцію у вибрану системну папку бібліотеки, наприклад Головна або Магазин / каталог. Пізніше ця дія буде доступна тільки адміністратору конструктора.">Зберегти як системний шаблон</button>
    </div>
    <div class="st-header-hint">
      Зберігається активна Main-секція з поточними текстами, стилями, геометрією та налаштуваннями слайдера.
    </div>
  </div>
`;

const footerBody = `
  <div class="st-header-widget">
    <button class="st-btn st-btn--primary st-footer-templates-btn sttpl-action-btn sttpl-action-btn--open" type="button" data-open-footer-templates data-tip="ШАБЛОНИ ФУТЕРА

Відкриває галерею готових шаблонів футера. Тут можна вибрати системний або власний шаблон з папки МОЇ ШАБЛОНИ та застосувати його до сайту.">Шаблони Футера</button>
    <div style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px;">
      <button class="st-btn sttpl-action-btn sttpl-action-btn--user" type="button" data-save-user-template="footer" data-tip="ЗБЕРЕГТИ ШАБЛОН ФУТЕРА

Зберігає поточний відредагований футер у МОЇ ШАБЛОНИ. Під час збереження можна вибрати або створити власну вкладену папку.">Зберегти шаблон</button>
      <button class="st-btn sttpl-action-btn sttpl-action-btn--system" type="button" data-save-system-template="footer" data-tip="ЗБЕРЕГТИ ЯК СИСТЕМНИЙ ШАБЛОН ФУТЕРА

Зберігає поточний футер у вибрану системну папку бібліотеки. Пізніше ця дія буде доступна тільки адміністратору конструктора.">Зберегти як системний шаблон</button>
    </div>
    <div class="st-header-hint">
      Власні футери зберігаються окремо від заводської бібліотеки у папці МОЇ ШАБЛОНИ.
    </div>
  </div>
`;

const styleSyncBody = `
  <div class="st-style-sync-host" data-template-style-sync-host>
    <div class="st-header-hint">Відкрийте акордеон, щоб застосувати стиль один раз або створити постійний Live Link між Header, Main і Footer.</div>
  </div>
`;

const menuBody = `
  <div class="st-header-widget st-menu-template-tools">
    <button
      class="st-btn st-btn--primary st-menu-design-change-btn"
      type="button"
      data-open-menu-design-templates
      disabled
    >
      Виберіть меню
    </button>
    <div class="st-header-hint">
      Виберіть блок меню на полотні. Кнопка «Змінити» відкриє галерею дизайнів меню та застосує стиль без втрати назв пунктів і посилань.
    </div>
  </div>
`;



const groupEl = createGroup(
  g.id,
  g.title,
  g.sub,
  (g.id === 'header') ? headerBody : (g.id === 'main') ? mainBody : (g.id === 'footer') ? footerBody : (g.id === 'style-sync') ? styleSyncBody : (g.id === 'menu') ? menuBody : null
);

const initStyleSync00954_ = () => {
  if (g.id !== 'style-sync') return;
  const syncHost = groupEl.querySelector('[data-template-style-sync-host]');
  if (!syncHost || syncHost.dataset.styleSyncLoading === '1' || syncHost.dataset.styleSyncReady === '00954') return;
  syncHost.dataset.styleSyncLoading = '1';
  import('./style-sync/template-style-sync-widget.js?v=01033')
    .then((mod) => mod.initTemplateStyleSyncWidget00954?.(syncHost))
    .catch((error) => {
      syncHost.innerHTML = '<div class="st-header-hint">Не вдалося відкрити синхронізацію стилів.</div>';
      console.error('[templates-widget][00946] style sync load failed', error);
    })
    .finally(() => { delete syncHost.dataset.styleSyncLoading; });
};

// Tooltip (delay 3s) для акордеона "Сайт" — пояснення прибрані з основного виду.
if (g.id === 'site') {
  const __siteHdr = groupEl.querySelector('.st-templates-group__header');
  if (__siteHdr) {
    __siteHdr.setAttribute('data-tip',
`Сторінки поточного сайту.

Натисни «Відкрити сайт» у віджеті «Сайт», щоб активувати потрібний сайт.`);
  }
}

// ✅ Клік по кнопці "Шаблони Шапки" (тільки для групи header)
const openHeaderBtn = groupEl.querySelector('[data-open-header-templates]');
if (openHeaderBtn) {
  openHeaderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();



     // ✅ КРОК 3: контекст = "ask"
  localStorage.setItem("st_header_pick_target", "ask");
    // відкриваємо менеджер галереї
     openTemplatesGalleryManager("header");

    // переключаємо вкладку на "Шапка" (tab = header)
    // ⚠️ цей виклик має бути в твоєму openTemplatesGalleryManager
    // якщо зараз він не приймає параметр — скажеш, я дам точний патч у templates-gallery-view.js
    if (typeof window.stTplGalleryManagerSetTab === 'function') {
      window.stTplGalleryManagerSetTab('header');
    } else {
      // fallback: подія для менеджера (підхопимо у templates-gallery-view.js)
      document.dispatchEvent(new CustomEvent('st:tplGallery:setTab', {
        detail: { tab: 'header' }
      }));
    }
  });
}

// ✅ Клік по кнопці "Зберегти шапку як Системний шаблон"
const saveHeaderSystemBtn = groupEl.querySelector('[data-save-header-system-template]');
if (saveHeaderSystemBtn) {
  saveHeaderSystemBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveHeaderSystemBtn.disabled = true;
    const oldText = saveHeaderSystemBtn.textContent;
    saveHeaderSystemBtn.textContent = 'Зберігаю шапку…';
    try {
      await saveCurrentHeaderAsSystemTemplate_();
    } finally {
      saveHeaderSystemBtn.disabled = false;
      saveHeaderSystemBtn.textContent = oldText || 'Зберегти шапку як Системний шаблон';
    }
  });
}






    // відновлення стану
    const open = !!state[g.id];
    groupEl.classList.toggle('is-open', open);

    const btn = groupEl.querySelector('.st-templates-group__header');
    if (btn) {
  btn.addEventListener('click', () => {
    groupEl.classList.toggle('is-open');

    const next = loadState();
    next[g.id] = groupEl.classList.contains('is-open');
    saveState(next);
    if (groupEl.classList.contains('is-open')) initStyleSync00954_();

    // ✅ КРОК 2 (2026): "Конструктор Шаблонів" (Сайт) — окремий віджет у тілі акордеону.
    // Ніяких режимів у canvas тут не відкриваємо.
  });
}


    

// 00888: Main uses the same gallery owner and the same button classes as Header/Footer.
const openMainBtn = groupEl.querySelector('[data-open-main-templates]');
if (openMainBtn) {
  openMainBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const mainTarget00952 = window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.resolveMainTemplateTarget?.() || null;
    const mainReplaceTargetId = String(mainTarget00952?.sectionId || '');
    try {
      window.__ST_ALL_LOG__?.push?.('main-template-replace-target-captured-00952', {
        targetSectionId: mainReplaceTargetId,
        replaceAvailable: !!mainReplaceTargetId,
        source: String(mainTarget00952?.source || 'none'),
        reason: String(mainTarget00952?.reason || '')
      }, 'info');
    } catch {}
    openTemplatesGalleryManager('main', { mainReplaceTargetId });
  });
}

// ✅ Клік по кнопці "Шаблони Футера" (тільки для групи footer)
const openFooterBtn = groupEl.querySelector('[data-open-footer-templates]');
if (openFooterBtn) {
  openFooterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // ✅ Через кнопку 'Шаблони Футера' — завжди питаємо куди застосувати
    try { localStorage.setItem('st_footer_pick_target', 'ask'); } catch {}
    try { localStorage.removeItem('st_footer_apply_quick_target'); } catch {}
    // Відкриваємо менеджер галереї одразу на вкладці "Футер"
    openTemplatesGalleryManager("footer");
  });
}


// 01013: однакове збереження поточного Header / Main / Footer.
const saveUserTemplateBtn01013 = groupEl.querySelector('[data-save-user-template]');
if (saveUserTemplateBtn01013) {
  saveUserTemplateBtn01013.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const area = String(saveUserTemplateBtn01013.getAttribute('data-save-user-template') || '');
    const old = saveUserTemplateBtn01013.textContent;
    saveUserTemplateBtn01013.disabled = true;
    saveUserTemplateBtn01013.textContent = 'Збереження…';
    try { await saveCurrentAreaTemplate01013_(area, 'user'); }
    catch (error) { console.warn('[01013] save user template failed', error); alert('Не вдалося зберегти шаблон.'); }
    finally { saveUserTemplateBtn01013.disabled = false; saveUserTemplateBtn01013.textContent = old || 'Зберегти шаблон'; }
  });
}

const saveSystemTemplateBtn01013 = groupEl.querySelector('[data-save-system-template]');
if (saveSystemTemplateBtn01013) {
  saveSystemTemplateBtn01013.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const area = String(saveSystemTemplateBtn01013.getAttribute('data-save-system-template') || '');
    const old = saveSystemTemplateBtn01013.textContent;
    saveSystemTemplateBtn01013.disabled = true;
    saveSystemTemplateBtn01013.textContent = 'Збереження…';
    try { await saveCurrentAreaTemplate01013_(area, 'system'); }
    catch (error) { console.warn('[01013] save system template failed', error); alert('Не вдалося зберегти системний шаблон.'); }
    finally { saveSystemTemplateBtn01013.disabled = false; saveSystemTemplateBtn01013.textContent = old || 'Зберегти як системний шаблон'; }
  });
}

// ✅ Клік по кнопці "Змінити" у групі "Меню".
// Відкриває Галерею шаблонів меню й передає контекст header/sidebar.
const openMenuDesignBtn = groupEl.querySelector('[data-open-menu-design-templates]');
if (openMenuDesignBtn) {
  const syncMenuBtn = () => stTplMenuWidgetSyncButton_(openMenuDesignBtn);
  syncMenuBtn();
  try { document.addEventListener('st:selection-changed', syncMenuBtn); } catch {}
  try { window.addEventListener('st:selection-changed', syncMenuBtn); } catch {}
  try { window.addEventListener('st:templates-menu-design-applied', syncMenuBtn); } catch {}
  try { document.addEventListener('click', () => setTimeout(syncMenuBtn, 0), true); } catch {}
  try { document.addEventListener('mouseup', () => setTimeout(syncMenuBtn, 0), true); } catch {}
  setTimeout(syncMenuBtn, 0);

  openMenuDesignBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const menu = stTplMenuWidgetSelected_();
    if (!menu) {
      stTplMenuWidgetSyncButton_(openMenuDesignBtn);
      return;
    }
    const target = stTplMenuWidgetRememberTarget_(menu);
    openTemplatesGalleryManager(target === 'sidebar' ? 'sidebar' : 'menu');
  });
}

// ✅ Ініціалізація віджета сторінок у "Шаблони → Сторінка"
const ptHost = groupEl.querySelector('[data-page-templates-host]');
if (ptHost) {
  initPageTemplatesWidget(ptHost);
}

// ✅ Ініціалізація конструктора шаблонів сайту у "Шаблони → Сайт"
const stHost = groupEl.querySelector('[data-site-template-builder-host]');
if (stHost) {
  initSiteTemplateBuilderWidget(stHost);
}

// ✅ Ініціалізація списку сторінок активного сайту у "Шаблони → Сайт"
const spHost = groupEl.querySelector('[data-site-pages-host]');
if (spHost) {
  initActiveSitePagesListWidget_(spHost);
}

groupsHost.appendChild(groupEl);
  // 00954: Live Link is a persistent state owner, so its single controller
  // is initialized even while the accordion is collapsed.
  if (g.id === 'style-sync') initStyleSync00954_();
  });


  // Backup bar handlers (FS Access API)
  sectionEl.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.getAttribute('data-act');

    if (act === 'tpl-backup-pick') {
      if (!canUseFsAccessApi()) {
        alert('Цей браузер не підтримує вибір папки (потрібен Chrome/Edge).');
        return;
      }
      const res = await pickTemplatesBackupFolder();
      if (res.ok) alert('Папку для backup вибрано ✅');
      else if (res.reason !== 'aborted') alert('Не вдалося вибрати папку ❌');
      return;
    }

    if (act === 'tpl-backup-write') {
      if (!canUseFsAccessApi()) {
        alert('Цей браузер не підтримує запис у папку (потрібен Chrome/Edge).');
        return;
      }
      const res = await writeTemplatesBackupToFolder();
      if (res.ok) alert('Backup збережено ✅\n' + (res.filename || ''));
      else if (res.reason === 'no-folder') alert('Спочатку натисни “Папка backup” і вибери папку.');
      else if (res.reason !== 'aborted') alert('Помилка збереження backup ❌');
      return;
    }

    if (act === 'tpl-backup-import') {
      if (!canUseFsAccessApi()) {
        alert('Цей браузер не підтримує імпорт з файлу через picker (потрібен Chrome/Edge).');
        return;
      }
      const res = await importTemplatesFromBackupFileMerge();
      if (res.ok) alert('Імпорт (MERGE) виконано ✅\n' + (res.filename || ''));
      else if (res.reason !== 'aborted') alert('Помилка імпорту ❌');
      return;
    }
  });

  host.appendChild(sectionEl);
}


// =========================================================
// ШАПКА → КНОПКА "ШАБЛОНИ ШАПКИ"
// =========================================================
