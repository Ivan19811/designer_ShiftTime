// 01029-PAGE-RECIPE-APPLY-GALLERY-PARITY
// Page composition authority: lightweight Header/Main/Footer references + workspace tabs.

import {
  readActiveTemplates00946,
  readSelectedSectionStyles00954,
  recordActiveTemplate00946
} from '../design/widgets/templates/style-sync/template-style-sync-state.js?v=01029';

const VERSION = '01029-page-recipe-apply-gallery-parity';
const RECIPE_VERSION = 'st-page-recipe-v1-01028';
const LS_SITES = 'st_sites';
const LS_CURRENT_SITE = 'st_sites_current';
const LS_TABS = 'st_open_page_tabs_v1_01028';
let catalogPromise = null;
let storeModulePromise = null;
let refreshToken = 0;

function log(event, detail = {}, level = 'info') {
  try { window.__ST_ALL_LOG__?.push?.(`page-assembly:${event}`, { v: VERSION, ...detail }, level); } catch {}
}
function parse(raw, fallback = null) { try { return JSON.parse(raw); } catch { return fallback; } }
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
function esc(s) { return String(s ?? '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function loadSites() {
  const v = parse(localStorage.getItem(LS_SITES) || '[]', []);
  return Array.isArray(v) ? v : [];
}
function saveSites(sites) { localStorage.setItem(LS_SITES, JSON.stringify(Array.isArray(sites) ? sites : [])); }
function getCurrentSiteId() {
  const raw = String(localStorage.getItem(LS_CURRENT_SITE) || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('{') && !raw.startsWith('[') && !raw.startsWith('"')) return raw;
  const v = parse(raw, raw);
  if (typeof v === 'string') return v;
  return String(v?.id || v?.siteId || '');
}
function getCurrentSite(sites = loadSites()) {
  const id = getCurrentSiteId();
  return sites.find(s => s && (String(s.id) === id || String(s.slug) === id)) || null;
}
function getCurrentPage(sites = loadSites()) {
  const site = getCurrentSite(sites);
  if (!site) return { site: null, page: null };
  const pages = Array.isArray(site.pages) ? site.pages : [];
  return { site, page: pages.find(p => p && p.id === site.currentPageId) || pages[0] || null };
}

function loadTabsMap() {
  const map = parse(localStorage.getItem(LS_TABS) || '{}', {});
  return map && typeof map === 'object' ? map : {};
}
function saveTabsMap(map) { try { localStorage.setItem(LS_TABS, JSON.stringify(map || {})); } catch {} }
function getOpenTabIds(siteId) {
  const map = loadTabsMap();
  return Array.isArray(map[siteId]) ? map[siteId].map(String) : [];
}
function setOpenTabIds(siteId, ids) {
  if (!siteId) return;
  const map = loadTabsMap();
  map[siteId] = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  saveTabsMap(map);
}
function openTab(pageId, { activate = false } = {}) {
  const sites = loadSites();
  const site = getCurrentSite(sites);
  if (!site || !pageId) return false;
  const ids = getOpenTabIds(site.id);
  if (!ids.includes(String(pageId))) ids.push(String(pageId));
  setOpenTabIds(site.id, ids);
  if (activate) switchPage(pageId);
  renderTabs();
  return true;
}
function switchPage(pageId) {
  const sites = loadSites();
  const site = getCurrentSite(sites);
  if (!site) return false;
  const page = (site.pages || []).find(p => p && String(p.id) === String(pageId));
  if (!page) return false;
  site.currentPageId = page.id;
  saveSites(sites);
  openTab(page.id, { activate: false });
  try {
    window.dispatchEvent(new CustomEvent('st-page-selected', {
      detail: { site, page, silent: false, source: 'page-tabs-01029' }
    }));
  } catch {}
  renderTabs();
  refreshWidget();
  return true;
}
function closeTab(pageId) {
  const sites = loadSites();
  const site = getCurrentSite(sites);
  if (!site) return;
  const before = getOpenTabIds(site.id);
  const index = before.indexOf(String(pageId));
  const after = before.filter(id => id !== String(pageId));
  setOpenTabIds(site.id, after);
  const wasActive = String(site.currentPageId || '') === String(pageId);
  if (wasActive && after.length) {
    switchPage(after[Math.min(index, after.length - 1)]);
    return;
  }
  renderTabs();
  if (wasActive && !after.length) {
    // Closing the final workspace tab does not delete the real page; it returns
    // to the Pages overview. Selecting/opening a page will create its tab again.
    try { document.getElementById('navPages')?.click?.(); } catch {}
  }
}

function renderTabs() {
  const host = document.getElementById('st-page-tabs-01028');
  if (!host) return;
  const sites = loadSites();
  const site = getCurrentSite(sites);
  if (!site) { host.innerHTML = ''; host.hidden = true; return; }
  const pages = Array.isArray(site.pages) ? site.pages : [];
  let ids = getOpenTabIds(site.id).filter(id => pages.some(p => String(p.id) === id));
  const currentId = String(site.currentPageId || '');
  setOpenTabIds(site.id, ids);
  host.hidden = !ids.length;
  host.innerHTML = ids.map(id => {
    const page = pages.find(p => String(p.id) === id);
    if (!page) return '';
    const active = id === currentId;
    return `<button type="button" class="st-page-tab-01028 ${active ? 'is-active' : ''}" data-pa28-tab="${esc(id)}" title="${esc(page.name || page.title || 'Сторінка')}">
      <span class="st-page-tab-01028__name">${esc(page.name || page.title || 'Сторінка')}</span>
      <span class="st-page-tab-01028__close" data-pa28-close="${esc(id)}" aria-label="Закрити вкладку">×</span>
    </button>`;
  }).join('');
}

async function getStoreModule() {
  if (!storeModulePromise) storeModulePromise = import('../design/widgets/templates/store/templates-store.js?v=01050');
  return storeModulePromise;
}
async function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = Promise.all([
      import('../design/widgets/templates/header/header-templates.js?v=01029'),
      import('../design/widgets/templates/main/main-templates.js?v=01039'),
      import('../design/widgets/templates/footer/footer-templates.js?v=01029'),
      getStoreModule()
    ]).then(([h,m,f,store]) => {
      const user = store.loadTemplatesStore()?.items || [];
      const all = [
        ...(h.getHeaderTemplatesDemo?.() || []),
        ...(m.getMainTemplatesDemo?.() || []),
        ...(f.getFooterTemplatesDemo?.() || []),
        ...user
      ];
      const map = new Map();
      for (const t of all) if (t?.id) map.set(String(t.id), t);
      return map;
    });
  }
  return catalogPromise;
}
function invalidateCatalog() { catalogPromise = null; }

function descriptorFallback(area) {
  const root = area === 'header' ? document.getElementById('st-site-header-slot') : area === 'footer' ? document.getElementById('st-site-footer-slot') : document.getElementById('st-site-main-slot');
  if (!root) return null;
  if (area === 'main') {
    const el = root.querySelector('[data-template-id]');
    const id = String(el?.getAttribute('data-template-id') || '');
    return id ? { area, templateId: id, templateName: id, profileId: '' } : null;
  }
  const el = root.querySelector('[data-hf-template-id]');
  const id = String(el?.getAttribute('data-hf-template-id') || '');
  return id ? { area, templateId: id, templateName: id, profileId: '' } : null;
}
function getCurrentDescriptors() {
  let active = {};
  try { active = readActiveTemplates00946() || {}; } catch {}
  return {
    header: active.header || descriptorFallback('header'),
    main: active.main || descriptorFallback('main'),
    footer: active.footer || descriptorFallback('footer')
  };
}
function styleRefForArea(area) {
  try {
    const st = readSelectedSectionStyles00954();
    return clone(st?.selectedByArea?.[area] || null);
  } catch { return null; }
}
function styleLabel(template, descriptor, styleRef) {
  return String(
    styleRef?.name || styleRef?.styleName || styleRef?.label || styleRef?.styleId || styleRef?.id ||
    template?.styleProfile?.profileName || template?.styleProfile?.name || template?.styleName || descriptor?.profileId || 'Власний стиль шаблона'
  );
}

async function buildCurrentRecipe() {
  const d = getCurrentDescriptors();
  const missing = ['header','main','footer'].filter(a => !String(d[a]?.templateId || '').trim());
  if (missing.length) return { ok:false, reason:'missing-template-reference', missing, descriptors:d };
  return {
    ok:true,
    recipe: {
      version: RECIPE_VERSION,
      composition: 'header-main-footer-reference',
      header: { templateId: String(d.header.templateId), profileId: String(d.header.profileId || ''), styleRef: styleRefForArea('header') },
      main: { templateId: String(d.main.templateId), profileId: String(d.main.profileId || ''), styleRef: styleRefForArea('main') },
      footer: { templateId: String(d.footer.templateId), profileId: String(d.footer.profileId || ''), styleRef: styleRefForArea('footer') }
    }
  };
}

async function renderSummary(host) {
  const token = ++refreshToken;
  const descriptors = getCurrentDescriptors();
  // 01029: the widget lives inside the Design inspector, so loading the catalog here
  // happens only when that lazy inspector is actually opened.
  const catalog = await getCatalog();
  if (token !== refreshToken || !host?.isConnected) return;
  const current = getCurrentPage();
  const part = (area, title, icon) => {
    const d = descriptors[area];
    const tpl = d?.templateId ? catalog.get(String(d.templateId)) : null;
    const templateName = tpl?.name || d?.templateName || d?.templateId || 'Не визначено';
    const style = d ? styleLabel(tpl, d, styleRefForArea(area)) : '—';
    return `<div class="pa28-part">
      <div class="pa28-part__icon">${icon}</div>
      <div><div class="pa28-part__name">${esc(title)}</div>
      <div class="pa28-part__template ${d ? '' : 'pa28-part__empty'}">Шаблон: ${esc(templateName)}</div>
      <div class="pa28-part__style">Стиль: ${esc(style)}</div></div>
    </div>`;
  };
  const wasOpen = !!host.querySelector('[data-pa28-accordion]')?.classList.contains('is-open');
  host.innerHTML = `
    <section class="design-section ${wasOpen ? 'is-open' : ''}" data-pa28-accordion data-design-section-id="page-assembly-01029">
      <button class="design-section__header" type="button" data-pa28-accordion-header data-pa29-help-anchor aria-label="Сторінка — збірка Header Main Footer">
        <div class="design-section__header-title"><span>Сторінка</span></div>
        <span class="design-section__chevron">▶</span>
      </button>
      <div class="design-section__body">
        <div class="page-assembly-01028">
          <div class="pa28-card">
            <div class="pa28-card__head"><div class="pa28-card__title">${esc(current.page?.name || 'Активна сторінка')}</div><div class="pa28-card__badge">REFERENCE RECIPE</div></div>
            ${part('header','Шапка','▰')}${part('main','Маїн','▦')}${part('footer','Футер','▱')}
          </div>
          <div class="pa28-note"><strong>Сторінка — це збірка.</strong> Вона посилається на існуючі Header/Main/Footer та їх style/profile ID, тому не створює дублікати важкого HTML.</div>
          <div class="pa28-actions">
            <button class="pa28-btn pa28-btn--primary" type="button" data-pa28-action="gallery">Галерея сторінок</button>
            <button class="pa28-btn" type="button" data-pa28-action="save-user">Зберегти у Мої сторінки</button>
            <button class="pa28-btn pa28-btn--system" type="button" data-pa28-action="save-system">Зберегти як системну</button>
            <div class="pa28-btnrow"><button class="pa28-btn" type="button" data-pa28-action="import">Імпорт сторінки</button><button class="pa28-btn" type="button" data-pa28-action="export">Експорт сторінки</button></div>
          </div>
        </div>
      </div>
    </section>`;
  host.querySelector('[data-pa28-accordion-header]')?.addEventListener('click', () => host.querySelector('[data-pa28-accordion]')?.classList.toggle('is-open'));
  bindInspectorHelp01029_(host.querySelector('[data-pa29-help-anchor]'));
}

function refreshWidget() {
  const host = document.getElementById('page-assembly-widget-root');
  if (host) renderSummary(host).catch(err => console.warn('[01028] summary failed', err));
}

function flattenFolders(node, out = [], depth = 0) {
  if (!node) return out;
  if (!node.divider) out.push({ id:node.id, name:node.name || 'Папка', depth, system:!!node.system, userTemplatesRoot:!!node.userTemplatesRoot });
  for (const c of (node.children || [])) flattenFolders(c, out, depth + 1);
  return out;
}
async function pageFolderOptions(mode) {
  const store = await getStoreModule();
  const root = store.getFoldersRoot();
  const pageRoot = store.findFolderById('fld_page') || root?.children?.find(f => f?.type === 'page');
  if (!pageRoot) return [];
  if (mode === 'user') {
    const mine = store.findFolderById('fld_page_my_templates');
    return flattenFolders(mine || pageRoot, [], 0);
  }
  const systemRoot = store.findFolderById('fld_page_system');
  // System recipes must land in System pages -> Page type -> Theme.
  // Depth 0 = System root, 1 = page role, 2 = theme.
  return flattenFolders(systemRoot || pageRoot, [], 0).filter(x => x.depth >= 2);
}

async function saveDialog(mode = 'user') {
  const folders = await pageFolderOptions(mode);
  if (!folders.length) { alert('Не знайдено папки «Сторінки».'); return null; }
  return new Promise(resolve => {
    const overlay = document.createElement('div'); overlay.className = 'pa28-modal';
    const current = getCurrentPage().page;
    overlay.innerHTML = `<div class="pa28-modal__box" role="dialog" aria-modal="true">
      <div class="pa28-modal__head"><div class="pa28-modal__title">${mode === 'system' ? 'Зберегти як системну сторінку' : 'Зберегти у Мої сторінки'}</div><div class="pa28-modal__sub">Зберігається тільки рецепт посилань Header/Main/Footer — без дублювання їх HTML.</div></div>
      <div class="pa28-modal__body">
        <label class="pa28-field">Назва<input class="pa28-input" data-pa28-name value="${esc(current?.name || 'Нова сторінка')}"></label>
        <label class="pa28-field">Папка<select class="pa28-select" data-pa28-folder>${folders.map(f => `<option value="${esc(f.id)}">${'— '.repeat(f.depth)}${esc(f.name)}</option>`).join('')}</select></label>
        ${mode === 'user' ? '<button class="pa28-btn" type="button" data-pa28-new-folder>+ Нова папка / підпапка</button>' : '<div class="pa28-note">Системна сторінка зберігається у готову структуру: тип сторінки → тематика.</div>'}
      </div>
      <div class="pa28-modal__foot"><button class="pa28-btn" style="width:auto" data-pa28-cancel>Скасувати</button><button class="pa28-btn ${mode==='system'?'pa28-btn--system':'pa28-btn--primary'}" style="width:auto" data-pa28-ok>Зберегти</button></div>
    </div>`;
    document.body.appendChild(overlay);
    const name = overlay.querySelector('[data-pa28-name]'); const folder = overlay.querySelector('[data-pa28-folder]');
    const done = v => { overlay.remove(); resolve(v); };
    overlay.querySelector('[data-pa28-cancel]')?.addEventListener('click', () => done(null));
    overlay.addEventListener('click', e => { if (e.target === overlay) done(null); });
    overlay.querySelector('[data-pa28-new-folder]')?.addEventListener('click', async () => {
      const entered = String(prompt('Назва нової папки:', 'Нова папка') || '').trim(); if (!entered) return;
      const store = await getStoreModule(); const created = store.createFolder({ parentId:String(folder.value || 'fld_page_my_templates'), type:'page', name:entered, system:false });
      if (!created) { alert('Не вдалося створити папку.'); return; }
      const opts = await pageFolderOptions(mode); folder.innerHTML = opts.map(f => `<option value="${esc(f.id)}">${'— '.repeat(f.depth)}${esc(f.name)}</option>`).join(''); folder.value = created.id;
    });
    overlay.querySelector('[data-pa28-ok]')?.addEventListener('click', () => {
      const n = String(name.value || '').trim(), fid = String(folder.value || '').trim(); if (!n || !fid) return;
      done({ name:n, folderId:fid });
    });
    try { name.select(); name.focus(); } catch {}
  });
}

async function saveCurrentPageTemplate(mode) {
  const built = await buildCurrentRecipe();
  if (!built.ok) { alert(`Не можу зберегти збірку: не визначено ${built.missing.join(', ')}. Спочатку застосуй або збережи відповідні шаблони.`); return false; }
  const dialog = await saveDialog(mode); if (!dialog) return false;
  const store = await getStoreModule();
  const id = `page_${mode === 'system' ? 'saved_system' : 'my'}_${Date.now()}_${Math.random().toString(16).slice(2,8)}`;
  const payload = { __st_page_recipe_v1:true, version:RECIPE_VERSION, pageRecipe:built.recipe };
  const item = store.addTemplate({
    id, type:'page', folderId:dialog.folderId, name:dialog.name, html:JSON.stringify(payload),
    description:'Збірка сторінки з посилань на Header/Main/Footer.',
    meta:{ source:'user', pageRecipe:true, referenceOnly:true, noAreaHtmlDuplication:true, userSaved:true, userSavedSystem:mode==='system', saveClass:mode==='system'?'system-library':'my-pages', savedAt01028:Date.now() }
  });
  if (item?.__persisted01018 !== true) { alert('Сторінку не вдалося записати у сховище.'); return false; }
  invalidateCatalog();
  try { window.dispatchEvent(new CustomEvent('st:templates-store-updated', { detail:{ type:'page', templateId:id, folderId:dialog.folderId } })); } catch {}
  alert('Збірку сторінки збережено.');
  refreshWidget();
  return true;
}

async function exportCurrentRecipe() {
  const built = await buildCurrentRecipe();
  if (!built.ok) { alert('Немає повної збірки Header/Main/Footer для експорту.'); return; }
  const { page } = getCurrentPage();
  const out = { __st_page_recipe_export_01028:true, version:RECIPE_VERSION, name:page?.name || 'Сторінка', exportedAt:new Date().toISOString(), pageRecipe:built.recipe };
  const blob = new Blob([JSON.stringify(out,null,2)], { type:'application/json' });
  const a = document.createElement('a'); const url = URL.createObjectURL(blob); a.href=url; a.download=`${String(page?.name || 'page').replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_-]+/g,'_')}-page-recipe-01028.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
async function importRecipeFile() {
  const input = document.createElement('input'); input.type='file'; input.accept='.json,application/json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; if (!file) return;
    let raw; try { raw = JSON.parse(await file.text()); } catch { alert('Некоректний JSON.'); return; }
    const recipe = raw?.pageRecipe || raw?.recipe; if (!recipe || recipe.version !== RECIPE_VERSION) { alert('Це не підтримуваний Page Recipe 01028.'); return; }
    if (!recipe.header?.templateId || !recipe.main?.templateId || !recipe.footer?.templateId) { alert('У рецепті немає Header/Main/Footer reference.'); return; }
    const store = await getStoreModule();
    let imported = store.findFolderById('fld_page_my_imported');
    if (!imported) imported = store.createFolder({ parentId:'fld_page_my_templates', type:'page', name:'Імпортовані', system:false });
    const id = `page_imported_${Date.now()}_${Math.random().toString(16).slice(2,8)}`;
    const item = store.addTemplate({ id, type:'page', folderId:imported?.id || 'fld_page_my_templates', name:String(raw.name || file.name.replace(/\.json$/i,'') || 'Імпортована сторінка'), html:JSON.stringify({__st_page_recipe_v1:true,version:RECIPE_VERSION,pageRecipe:recipe}), description:'Імпортований Page Recipe.', meta:{source:'user',pageRecipe:true,referenceOnly:true,imported01028:true} });
    if (item?.__persisted01018 !== true) { alert('Не вдалося імпортувати сторінку.'); return; }
    invalidateCatalog(); alert('Сторінку імпортовано у Мої сторінки / Імпортовані.');
    try { window.dispatchEvent(new CustomEvent('st:templates-store-updated', { detail:{type:'page',templateId:id} })); } catch {}
  }, { once:true });
  input.click();
}

function slugify(value) {
  const map = {'а':'a','б':'b','в':'v','г':'h','ґ':'g','д':'d','е':'e','є':'ye','ж':'zh','з':'z','и':'y','і':'i','ї':'yi','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ь':'','ю':'yu','я':'ya'};
  return String(value || 'page').toLowerCase().split('').map(c=>map[c]??c).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64) || 'page';
}
function uniquePath(site, baseName) {
  const base = '/' + slugify(baseName); const used = new Set((site.pages||[]).map(p=>String(p.path||''))); if (!used.has(base)) return base;
  let n=2; while(used.has(`${base}-${n}`)) n++; return `${base}-${n}`;
}
function parseRecipeFromTemplate(tpl) {
  if (tpl?.pageRecipe?.version === RECIPE_VERSION) return clone(tpl.pageRecipe);
  const raw = parse(String(tpl?.html || ''), null); const recipe = raw?.pageRecipe || raw?.recipe || null;
  return recipe?.version === RECIPE_VERSION ? clone(recipe) : null;
}
async function resolveTemplate(id) { const catalog = await getCatalog(); return catalog.get(String(id || '')) || null; }

async function rollbackNewPage01029_({ pageId, oldPageId, oldTabs }) {
  try {
    // Remove per-page Header/Footer state written before a later component failed.
    // This keeps a rejected Page Recipe truly atomic instead of leaving orphaned
    // template state for a page that no longer exists.
    try { window.ST_HEADER_STATE?.clearPage?.(String(pageId || '')); } catch {}
    try { window.ST_FOOTER_STATE?.clearPage?.(String(pageId || '')); } catch {}

    const sites = loadSites();
    const site = getCurrentSite(sites);
    if (!site) return;
    site.pages = (Array.isArray(site.pages) ? site.pages : []).filter(p => String(p?.id || '') !== String(pageId || ''));
    site.currentPageId = oldPageId && site.pages.some(p => String(p?.id || '') === String(oldPageId))
      ? oldPageId
      : String(site.pages?.[0]?.id || '');
    saveSites(sites);
    setOpenTabIds(site.id, Array.isArray(oldTabs) ? oldTabs : []);
    const restored = (site.pages || []).find(p => String(p?.id || '') === String(site.currentPageId || '')) || null;
    if (restored) {
      try { window.dispatchEvent(new CustomEvent('st-page-selected', { detail:{ site, page:restored, silent:true, source:'page-recipe-rollback-01029' } })); } catch {}
    }
    renderTabs();
    refreshWidget();
  } catch (err) {
    console.warn('[01029] page rollback failed', err);
  }
}

async function applyRecipeToNewPage(tpl) {
  const recipe = parseRecipeFromTemplate(tpl);
  if (!recipe) return false;

  // 01029 preflight: resolve all three refs BEFORE creating a real site page.
  // A broken/missing reference must never leave an empty tab or half-built page behind.
  const [h,m,f] = await Promise.all([
    resolveTemplate(recipe.header?.templateId),
    resolveTemplate(recipe.main?.templateId),
    resolveTemplate(recipe.footer?.templateId)
  ]);
  const missing = [];
  if (!h) missing.push(`Шапка: ${String(recipe.header?.templateId || '—')}`);
  if (!m) missing.push(`Маїн: ${String(recipe.main?.templateId || '—')}`);
  if (!f) missing.push(`Футер: ${String(recipe.footer?.templateId || '—')}`);
  const headerApi = window.ST_HEADER_STATE;
  const footerApi = window.ST_FOOTER_STATE;
  const mainApi = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  if (!headerApi || typeof headerApi.setPageTemplateData !== 'function') missing.push('Шапка: Header state engine ще не готовий');
  if (!footerApi || typeof footerApi.setPageTemplateData !== 'function') missing.push('Футер: Footer state engine ще не готовий');
  if (!mainApi || typeof mainApi.applyMainTemplate !== 'function') missing.push('Маїн: SiteFrame engine ще не готовий');
  if (h && !String(h.html || h.previewHtml || '').trim()) missing.push(`Шапка: ${String(h.id || '')} не має HTML`);
  if (m && !String(m.html || m.previewHtml || '').trim()) missing.push(`Маїн: ${String(m.id || '')} не має HTML`);
  if (f && !String(f.html || f.previewHtml || '').trim()) missing.push(`Футер: ${String(f.id || '')} не має HTML`);
  if (missing.length) {
    log('recipe-preflight-rejected', { templateId:String(tpl?.id || ''), missing }, 'warn');
    alert(`Не можу зібрати сторінку. Недоступні частини:\n\n${missing.join('\n')}`);
    return false;
  }

  const sites = loadSites();
  const site = getCurrentSite(sites);
  if (!site) { alert('Спочатку відкрий сайт.'); return false; }
  const oldPageId = String(site.currentPageId || '');
  const oldTabs = getOpenTabIds(site.id);
  if (oldPageId) openTab(oldPageId, {activate:false});

  const now = Date.now();
  const page = {
    id:`page_${now}_${Math.floor(Math.random()*1000)}`,
    name:String(tpl.name || 'Нова сторінка'),
    path:uniquePath(site,tpl.name || 'page'),
    seoTitle:'', seoDescription:'', indexing:'index', showInMenu:true,
    headerVariant:'custom', footerVariant:'custom', sidebarVariant:'default', status:'draft',
    pageTemplateId:String(tpl.id||''), pageRecipeVersion:RECIPE_VERSION,
    pageRecipeRefs:{ header:String(h.id||''), main:String(m.id||''), footer:String(f.id||'') }
  };
  site.pages = Array.isArray(site.pages) ? site.pages : [];
  site.pages.push(page);
  site.currentPageId = page.id;
  saveSites(sites);
  openTab(page.id,{activate:false});

  try { window.dispatchEvent(new CustomEvent('st-page-selected',{detail:{site,page,silent:true,source:'page-template-01029'}})); } catch {}

  try {
    headerApi.setPageTemplateData(page.id,{html:h.html||h.previewHtml||'',model:h.model,modelVersion:h.modelVersion,templateId:h.id,source:'page-recipe-01029'});
    window.SiteHeaderRuntime?.setMode?.('page',page.id);
    recordActiveTemplate00946({area:'header',mode:'page',pageId:page.id,template:h});
    document.dispatchEvent(new CustomEvent('st:header-state-changed',{detail:{pageId:page.id,source:'page-recipe-01029'}}));
  } catch(e) {
    console.warn('[01029] header recipe apply failed',e);
    await rollbackNewPage01029_({pageId:page.id,oldPageId,oldTabs});
    alert('Не вдалося застосувати Header. Нову сторінку не створено.');
    return false;
  }

  try {
    footerApi.setPageTemplateData(page.id,{html:f.html||f.previewHtml||'',model:f.model,modelVersion:f.modelVersion,templateId:f.id,source:'page-recipe-01029'});
    window.SiteFooterRuntime?.setMode?.('page',page.id);
    recordActiveTemplate00946({area:'footer',mode:'page',pageId:page.id,template:f});
    document.dispatchEvent(new CustomEvent('st:footer-state-changed',{detail:{pageId:page.id,source:'page-recipe-01029'}}));
  } catch(e) {
    console.warn('[01029] footer recipe apply failed',e);
    await rollbackNewPage01029_({pageId:page.id,oldPageId,oldTabs});
    alert('Не вдалося застосувати Footer. Нову сторінку не створено.');
    return false;
  }

  try {
    const result = mainApi.applyMainTemplate({
      html:m.html||m.previewHtml||'', templateId:m.id, mode:'add', replaceScope:'section', targetSectionId:'',
      templateSelection00946:{
        templateId:String(m.id||''), templateName:String(m.name||m.id||''),
        profileId:String(m.styleProfile?.profileId||''), collectionId:String(m.styleProfile?.collectionId||''), recordedAt:Date.now()
      }
    });
    if (!result?.ok) throw new Error(result?.reason||result?.error||'main apply failed');
  } catch(e) {
    console.warn('[01029] main recipe apply failed',e);
    log('recipe-main-apply-failed', { templateId:String(tpl?.id || ''), mainTemplateId:String(m?.id || ''), message:String(e?.message || e || '') }, 'error');
    await rollbackNewPage01029_({pageId:page.id,oldPageId,oldTabs});
    alert('Не вдалося застосувати Маїн. Нову сторінку скасовано, попередня сторінка відновлена.');
    return false;
  }

  // Important: this is an automatic page-template commit. It must not show the
  // legacy blocking "Сторінку збережено" alert because that keeps the gallery
  // opening-shell visible until the modal is manually dismissed.
  try { window.dispatchEvent(new CustomEvent('st:page-save-request',{detail:{pageId:page.id,source:'page-recipe-01029',silent:true}})); } catch {}

  renderTabs();
  refreshWidget();
  log('recipe-applied',{templateId:tpl.id,pageId:page.id,refs:{header:h.id,main:m.id,footer:f.id},mainMode:'add-new-empty-page',silentSave:true,atomic:true});
  return true;
}

let helpPopup01029_ = null;
function hideInspectorHelp01029_() {
  if (helpPopup01029_) helpPopup01029_.classList.remove('is-visible');
}
function bindInspectorHelp01029_(anchor) {
  if (!anchor || anchor.dataset.pa29Help === '1') return;
  anchor.dataset.pa29Help = '1';
  let timer = null;
  const hide = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    hideInspectorHelp01029_();
  };
  anchor.addEventListener('mouseenter', () => {
    hide();
    timer = setTimeout(() => {
      if (!helpPopup01029_) {
        helpPopup01029_ = document.createElement('div');
        helpPopup01029_.className = 'st-page-help-01028';
        helpPopup01029_.innerHTML = '<div class="st-page-help-01028__eyebrow">СТОРІНКА · PAGE ASSEMBLY</div><div class="st-page-help-01028__title">Збирай повні сторінки з готових частин</div><div class="st-page-help-01028__text">Цей акордеон показує, які Шапка, Маїн і Футер зараз складають відкриту сторінку. Збережена сторінка не дублює їх HTML — вона пам’ятає посилання на готові шаблони та стилі.</div><div class="st-page-help-01028__steps"><div><b>1.</b> Збери або відредагуй Header + Main + Footer.</div><div><b>2.</b> Збережи комбінацію у «Мої сторінки» або у системну категорію.</div><div><b>3.</b> У Галереї відкрий велике Preview і застосуй сторінку — вона відкриється новою вкладкою конструктора, не закриваючи поточну.</div><div><b>4.</b> Імпорт/Експорт переносить тільки легкий Page Recipe.</div></div>';
        document.body.appendChild(helpPopup01029_);
      }
      const r = anchor.getBoundingClientRect();
      helpPopup01029_.style.display = 'block';
      helpPopup01029_.style.visibility = 'hidden';
      helpPopup01029_.style.left = '0px'; helpPopup01029_.style.top = '0px';
      const w = helpPopup01029_.offsetWidth || 560, h = helpPopup01029_.offsetHeight || 430;
      const left = Math.min(window.innerWidth-w-16, Math.max(16, r.right+14));
      const top = Math.min(window.innerHeight-h-16, Math.max(16, r.top-20));
      helpPopup01029_.style.left = `${left}px`; helpPopup01029_.style.top = `${top}px`;
      helpPopup01029_.style.visibility = 'visible';
      helpPopup01029_.classList.add('is-visible');
    }, 3000);
  });
  anchor.addEventListener('mouseleave', hide);
  anchor.addEventListener('click', hide);
  window.addEventListener('blur', hide, { passive:true });
}

function bindWidgetActions() {
  const host=document.getElementById('page-assembly-widget-root'); if(!host||host.dataset.pa28Bound==='1')return; host.dataset.pa28Bound='1';
  host.addEventListener('click',async e=>{const b=e.target.closest('[data-pa28-action]');if(!b)return;const a=b.dataset.pa28Action;
    if(a==='gallery'){window.dispatchEvent(new CustomEvent('st:open-templates-gallery',{detail:{tab:'page'}}));return;}
    if(a==='save-user'){await saveCurrentPageTemplate('user');return;}
    if(a==='save-system'){await saveCurrentPageTemplate('system');return;}
    if(a==='export'){await exportCurrentRecipe();return;}
    if(a==='import'){await importRecipeFile();return;}
  });
}
function bindTabs() {
  const host=document.getElementById('st-page-tabs-01028'); if(!host||host.dataset.pa28Bound==='1')return; host.dataset.pa28Bound='1';
  host.addEventListener('click',e=>{const close=e.target.closest('[data-pa28-close]');if(close){e.preventDefault();e.stopPropagation();closeTab(close.dataset.pa28Close);return;}const tab=e.target.closest('[data-pa28-tab]');if(tab)switchPage(tab.dataset.pa28Tab);});
}

export function initPageAssemblyInspector01029(host) {
  if (!host) return null;
  let root = host.querySelector('#page-assembly-widget-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'page-assembly-widget-root';
    root.dataset.pageAssemblyInspector01029 = '1';
    host.appendChild(root);
  }
  bindWidgetActions();
  renderSummary(root).catch(err => console.warn('[01029] inspector summary failed', err));
  return root;
}

export function initPageAssembly01028() {
  bindWidgetActions(); bindTabs();
  const {site,page}=getCurrentPage(); if(site&&page)openTab(page.id,{activate:false});
  renderTabs(); refreshWidget();
  window.addEventListener('st-page-selected',e=>{const id=String(e?.detail?.page?.id||e?.detail?.pageId||'');if(id)openTab(id,{activate:false});renderTabs();refreshWidget();});
  document.addEventListener('st-page-selected',()=>{renderTabs();refreshWidget();});
  window.addEventListener('st:active-template-changed-00946',refreshWidget);
  window.addEventListener('st:templates-store-updated',()=>{invalidateCatalog();refreshWidget();});
  window.addEventListener('st:page-template-open-01028',e=>{const tpl=e?.detail?.template;if(tpl)applyRecipeToNewPage(tpl).catch(err=>{console.error(err);alert('Не вдалося зібрати сторінку.');});});
  log('boot',{referenceOnly:true,pageTabs:true,inspectorAccordion:true,tooltipDelayMs:3000,silentAutoSave:true,atomicPageApply:true});
}

window.ST_PAGE_ASSEMBLY_01029 = Object.freeze({version:VERSION,refresh:refreshWidget,renderTabs,openTab,switchPage,applyRecipeToNewPage,buildCurrentRecipe,initInspector:initPageAssemblyInspector01029});
window.ST_PAGE_ASSEMBLY_01028 = window.ST_PAGE_ASSEMBLY_01029;
