// js/site-frame/site-frame-workspace-runtime.js
// 00914: Main fill/radius/border color stay RAF quiet; Main shadow uses live preview with final JSON commit.
// Main supports selection, template add/replace, same-parent reorder, block transfer and shared natural-flow growth through SiteFrameStore.
// No observer, timer, retry, geometry repair or legacy runtime.

import { initSelectionManager } from '../selection/selection-manager.js';
import { initSiteHeaderRuntime } from '../site-header/site-header-runtime.js';
import { initSiteFooterRuntime } from '../site-footer/site-footer-runtime.js';
import { installSiteFrameSlotSelection, installAllSiteFrameSlotSelection } from './site-frame-explicit-selection-00989.js?v=00989';

const VERSION = '00931-main-text-south-live-parent-grow-parity-workspace';
const ROOT_STORAGE_KEY = 'st_site_root_dom_v1';
const ROOT_DRAFT_STORAGE_KEY = 'st_site_root_dom_draft_v1';
const MAIN_STAGE_MARKER = '00914-main-shadow-preset-inner-parity';

const SLOT_CONFIG = Object.freeze({
  header: Object.freeze({ id: 'st-site-header-slot', className: 'st-site-header-slot', tagName: 'div', selectable: true }),
  main: Object.freeze({ id: 'st-site-main-slot', className: 'st-site-main-slot', tagName: 'main', selectable: true }),
  footer: Object.freeze({ id: 'st-site-footer-slot', className: 'st-site-footer-slot', tagName: 'div', selectable: true }),
});

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`site-frame-workspace:${event}`, payload, level); } catch {}
  try { window.__ST_PERF_DIAG__?.push?.(`site-frame-workspace:${event}`, payload, level); } catch {}
}

function getRoot() {
  let root = document.getElementById('site-root');
  if (root instanceof HTMLElement) return root;
  const canvas = document.getElementById('site-canvas') || document.getElementById('canvasView') || document.body;
  root = document.createElement('div');
  root.id = 'site-root';
  root.className = 'site-root';
  canvas.appendChild(root);
  return root;
}

function normalizeArea(area) {
  const value = String(area || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(SLOT_CONFIG, value) ? value : '';
}

function createSlot(config) {
  const slot = document.createElement(config.tagName);
  slot.id = config.id;
  slot.className = config.className;
  return slot;
}

function ensureSlot(area) {
  const normalized = normalizeArea(area);
  if (!normalized) throw new Error(`Unknown SiteFrame area: ${String(area || '')}`);
  const config = SLOT_CONFIG[normalized];
  const root = getRoot();
  let slot = document.getElementById(config.id);

  if (!(slot instanceof HTMLElement) || slot.tagName.toLowerCase() !== config.tagName) {
    const replacement = createSlot(config);
    if (slot instanceof HTMLElement) {
      while (slot.firstChild) replacement.appendChild(slot.firstChild);
      slot.replaceWith(replacement);
    }
    slot = replacement;
  }

  slot.classList.add(config.className);
  slot.dataset.siteFrameArea = normalized;
  if (!slot.parentElement || slot.parentElement !== root) root.appendChild(slot);

  slot.style.removeProperty('margin-top');
  slot.style.removeProperty('flex-grow');
  slot.style.removeProperty('flex-basis');

  if (normalized === 'main') {
    slot.dataset.siteFrameMainStage = MAIN_STAGE_MARKER;
    slot.removeAttribute('data-site-frame-empty-frame');
  }
  if (config.selectable) installSiteFrameSlotSelection(normalized, slot);
  return slot;
}

function ensureMainSelectionContent(main, reason = 'explicit') {
  if (!(main instanceof HTMLElement)) return false;
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  if (!authority?.ensureMainSelectionFrame) throw new Error('00914 Main SiteFrame authority is unavailable');
  const result = authority.ensureMainSelectionFrame(reason);
  main.dataset.siteFrameMainStage = MAIN_STAGE_MARKER;
  main.removeAttribute('data-site-frame-empty-frame');
  installSiteFrameSlotSelection('main', main);
  return result?.rendered === true;
}

function createMainSelectionFrame(reason = 'explicit') {
  const root = getRoot();
  const header = ensureSlot('header');
  const main = ensureSlot('main');
  const footer = ensureSlot('footer');
  const allowed = new Set([header, main, footer]);
  let removedLegacyRootNodes = 0;

  for (const child of Array.from(root.children)) {
    if (allowed.has(child)) continue;
    child.remove();
    removedLegacyRootNodes += 1;
  }

  const ordered = Array.from(root.children);
  if (ordered.length !== 3 || ordered[0] !== header || ordered[1] !== main || ordered[2] !== footer) {
    root.append(header, main, footer);
  }

  const mainRendered = ensureMainSelectionContent(main, reason);
  if (removedLegacyRootNodes) log('legacy-root-content-removed', { reason, removedLegacyRootNodes });
  return { root, header, main, footer, removedLegacyRootNodes, mainRendered };
}

function cleanHtml(html) {
  const raw = String(html || '');
  if (!raw) return '';
  try {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    doc.querySelectorAll('.st-resize,.st-resize-handle,.st-section-handle,.st-block-handle,.st-drag-handle,.st-drag-marker,.st-drop-marker,.st-col-resizer,.st-sec-resizer,.hb-panel,.fb-panel,.st-selection-ui,#st-header-builder-toolbar,#st-footer-builder-toolbar').forEach((node) => node.remove());
    return doc.body?.innerHTML || '';
  } catch {
    return raw;
  }
}

function setComponentHtml(area, html) {
  const normalized = normalizeArea(area);
  if (normalized !== 'header' && normalized !== 'footer') throw new Error('00888 allows authored HTML only in Header/Footer');
  const slot = ensureSlot(normalized);
  slot.innerHTML = cleanHtml(html);
  const has = !!slot.innerHTML.trim();
  slot.classList.toggle('is-present', has);
  slot.style.display = has ? 'block' : 'none';
  try { window.ST_SITE_FRAME_EDIT_LAYER_00882?.scanTree?.(); } catch {}
  return slot;
}

function clearComponent(area) {
  return setComponentHtml(area, '');
}

function installComponentApis() {
  window.SiteHeader = Object.freeze({
    ensure: () => ensureSlot('header'),
    setHTML: (html) => setComponentHtml('header', html),
    clear: () => clearComponent('header'),
    getHTML: () => ensureSlot('header').innerHTML,
  });
  window.SiteMain = Object.freeze({
    version: VERSION,
    ensure: () => createMainSelectionFrame('SiteMain.ensure').main,
    getHTML: () => createMainSelectionFrame('SiteMain.getHTML').main.innerHTML,
    getState: () => window.ST_SITE_FRAME_STORE_AUTHORITY_00876?.getState?.() || null,
    contract: Object.freeze({
      emptyFrameOnly: false,
      jsonPrimary: true,
      selection: true,
      drag: true,
      resize: true,
      liveParentGrow: true,
      naturalFlow: true,
      resizeEquations: true,
      adjacentPairEquation: 'active-plus-adjacent-constant',
      pairCanvasWidthInvariant: true,
      canvasScrollbarGutter: 'stable',
      persistenceUndoRedo: true,
      mainTextEditable: true,
      textLocalActionHistory: true,
      mainTextBlockDragRestore: true,
      textEditableBlockDrag: true,
      textFocusStableDuringDraftSave: true,
      mainTextSavePreservesLiveDom: true,
      mainFillStylePersistence: true,
      mainFillStyleJsonPrimary: true,
      mainFillThemeReady: true,
      mainFillLiveDraftSync: true,
      mainFillRootSaveBeforeSelectionLoss: true,
      mainRadiusStylePersistence: true,
      mainRadiusStyleJsonPrimary: true,
      mainRadiusLiveDraftSync: true,
      mainRadiusLiveRafQuiet: true,
      mainRadiusSelectionVisualVariableSync: true,
      mainBorderColorStylePersistence: true,
      mainBorderColorStyleJsonPrimary: true,
      mainBorderColorLiveDraftSync: true,
      mainBorderColorLiveRafQuiet: true,
      mainBorderColorLiveStoreWrites: false,
      mainBorderColorLiveRootSaves: false,
      mainBorderColorSelectionLossFlush: true,
      templates: true,
    }),
  });
  window.SiteFooter = Object.freeze({
    ensure: () => ensureSlot('footer'),
    setHTML: (html) => setComponentHtml('footer', html),
    clear: () => clearComponent('footer'),
    getHTML: () => ensureSlot('footer').innerHTML,
  });
}

function readPageId() {
  const root = getRoot();
  return String(root.dataset.pageId || window.ST_PAGES?.getActiveId?.() || 'page:default');
}

function snapshotPayload(html, reason = '') {
  return {
    version: 1,
    pageId: readPageId(),
    html: cleanHtml(html),
    savedAt: Date.now(),
    reason: String(reason || ''),
  };
}

function syncFrameStore(reason) {
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  if (!authority || authority.store?.hasActiveTransaction?.()) return false;
  try {
    authority.hydrateAll?.({ reason, preserveCommitted: true });
    authority.persistStore?.(reason);
    return true;
  } catch (error) {
    log('store-sync-error', { reason, message: String(error?.message || error || '') }, 'error');
    return false;
  }
}

function rootHtmlForPersistence01067(root) {
  if (!(root instanceof HTMLElement)) return '';
  const clone = root.cloneNode(true);
  clone.querySelectorAll('.st-commerce-grid-runtime-01067,[data-commerce-grid-runtime01067],[data-commerce-runtime-clone-01067]').forEach((el) => el.remove());
  clone.querySelectorAll('.st-commerce-collection-host-01067').forEach((host) => {
    host.classList.remove('st-commerce-collection-host-01067');
    ['commerceCollectionState01067','commerceCollectionRendered01067','commerceCollectionTotal01067'].forEach((key) => { delete host.dataset[key]; });
  });
  return clone.innerHTML;
}

function saveRootDom(options = {}) {
  const key = options.draft === true ? ROOT_DRAFT_STORAGE_KEY : ROOT_STORAGE_KEY;
  const preserveLiveMain = options.preserveLiveMain === true || options.noMainRender === true;
  let root = null;
  let main = null;
  let mainRendered = false;

  if (preserveLiveMain) {
    // 00903: Text typing must not call createMainSelectionFrame(), because that
    // re-renders Main from JSON and destroys the live contenteditable/caret.
    root = getRoot();
    main = document.getElementById('st-site-main-slot');
  } else {
    const frame = createMainSelectionFrame('root-save');
    root = frame.root;
    main = frame.main;
    mainRendered = frame.mainRendered === true;
  }

  const payload = snapshotPayload(rootHtmlForPersistence01067(root), options.reason || 'explicit-root-save-00914');
  try { localStorage.setItem(key, JSON.stringify(payload)); }
  catch { return false; }
  log('root-saved', {
    key,
    pageId: payload.pageId,
    htmlLength: payload.html.length,
    mainSelectionNodes: main?.querySelectorAll?.('[data-main-selection-stage="00914"]')?.length || 0,
    preserveLiveMain,
    mainRendered,
    textFocusStable: preserveLiveMain === true,
  });
  // 01016: createMainSelectionFrame() rebuilds Main from canonical SiteFrameStore JSON.
  // Runtime-only enhancers (background slider layers/classes) are intentionally not
  // stored in JSON, so announce the *final* rebuilt DOM after the explicit root-save.
  // Effects rehydrate synchronously from authored data-st-fx-* attributes; no observer,
  // polling or fallback timer is involved.
  if (mainRendered) {
    try {
      window.dispatchEvent(new CustomEvent('st:site-frame-main-dom-rendered', {
        detail: {
          version: '01016-main-runtime-rehydrate-contract',
          reason: options.reason || 'explicit-root-save-01016',
          source: 'workspace-root-save',
          mainRendered: true,
        },
      }));
    } catch {}
  }
  return true;
}

function restoreRootDom(options = {}) {
  const key = options.draft === true ? ROOT_DRAFT_STORAGE_KEY : ROOT_STORAGE_KEY;
  let payload = null;
  try { payload = JSON.parse(localStorage.getItem(key) || 'null'); } catch {}
  const html = String(payload?.html || '').trim();
  if (!html) return false;
  const root = getRoot();
  root.innerHTML = cleanHtml(html);
  const frame = createMainSelectionFrame('root-restore');
  try { window.ST_SITE_FRAME_EDIT_LAYER_00882?.scanTree?.(); } catch {}
  syncFrameStore('workspace-root-restore-00888');
  log('root-restored', { key, pageId: String(payload?.pageId || ''), htmlLength: html.length, mainSelectionNodes: frame.main.querySelectorAll('[data-main-selection-stage="00914"]').length });
  if (frame.mainRendered === true) {
    try { window.dispatchEvent(new CustomEvent('st:site-frame-main-dom-rendered', { detail: { version:'01016-main-runtime-rehydrate-contract', reason:'root-restore', source:'workspace-root-restore', mainRendered:true } })); } catch {}
  }
  return true;
}

function extractSnapshotHtml(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return '';
  return String(snapshot.pageHTML || snapshot.rootHTML || snapshot.previewHtml || '').trim();
}

function applySnapshot(snapshot, options = {}) {
  if (!snapshot || typeof snapshot !== 'object') return false;
  const root = getRoot();
  const html = extractSnapshotHtml(snapshot);
  const pageState = snapshot.__st_bundle_v1 === true && snapshot.site ? snapshot.site : snapshot;
  const pageId = String(pageState?.page?.id || snapshot?.page?.id || '').trim();
  const scopedMain01040 = snapshot.siteFrameMain01040 && typeof snapshot.siteFrameMain01040 === 'object';
  if (pageId) root.dataset.pageId = pageId;
  if (html) root.innerHTML = cleanHtml(html);

  // 01040: old page snapshots predate page-scoped SiteFrame Main JSON. Import
  // their mounted Main exactly once from the saved page HTML, then persist it
  // as canonical JSON. New snapshots arrive with siteFrameMain01040 and are
  // restored by the SiteFrame authority before this workspace listener runs.
  let legacyMainImported01040 = false;
  if (html && !scopedMain01040) {
    try {
      const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
      authority?.hydrateAll?.({ reason: 'workspace-page-main-legacy-import-01040', preserveCommitted: false });
      authority?.persistStore?.('workspace-page-main-legacy-import-01040');
      legacyMainImported01040 = true;
    } catch (error) {
      log('page-main-legacy-import-error-01040', { pageId, message: String(error?.message || error || '') }, 'error');
    }
  }

  const frame = createMainSelectionFrame('snapshot-apply');
  try { window.SiteHeaderRuntime?.sync?.(); } catch {}
  try { window.SiteFooterRuntime?.sync?.(); } catch {}
  syncFrameStore('workspace-snapshot-00888');
  try { window.ST_SITE_FRAME_EDIT_LAYER_00882?.scanTree?.(); } catch {}
  if (options.persist === true) saveRootDom({ draft: !!options.draft, reason: 'snapshot-apply-00888' });
  log('snapshot-applied', {
    pageId,
    htmlLength: html.length,
    bundle: snapshot.__st_bundle_v1 === true,
    mainSelectionNodes: frame.main.querySelectorAll('[data-main-selection-stage="00914"]').length,
    pageScopedMain01040: scopedMain01040,
    legacyMainImported01040,
  });
  if (frame.mainRendered === true) {
    try { window.dispatchEvent(new CustomEvent('st:site-frame-main-dom-rendered', { detail: { version:'01016-main-runtime-rehydrate-contract', reason:'snapshot-apply', source:'workspace-snapshot', mainRendered:true } })); } catch {}
  }
  return true;
}

function refreshEnhancers(scope) {
  const frame = createMainSelectionFrame('refresh');
  installAllSiteFrameSlotSelection();
  try { initSelectionManager(); } catch {}
  let marked = 0;
  try { marked = Number(window.ST_SITE_FRAME_EDIT_LAYER_00882?.scanTree?.() || 0); } catch {}
  log('refresh', {
    marked,
    scope: scope instanceof HTMLElement ? (scope.id || scope.className || scope.tagName) : '',
    mainSelectionNodes: frame.main.querySelectorAll('[data-main-selection-stage="00914"]').length,
  });
  return marked;
}

function installCanvasApi() {
  window.SiteCanvas = Object.freeze({
    version: VERSION,
    getRoot,
    ensureSlots: () => createMainSelectionFrame('SiteCanvas.ensureSlots'),
    refreshEnhancers,
    applySnapshot,
    getHTML: () => createMainSelectionFrame('SiteCanvas.getHTML').root.innerHTML,
    setHTML: (html) => {
      getRoot().innerHTML = cleanHtml(html);
      const frame = createMainSelectionFrame('SiteCanvas.setHTML');
      refreshEnhancers(frame.root);
      syncFrameStore('workspace-set-html-00888');
      return true;
    },
    getMeta: () => ({ pageId: readPageId(), mode: 'site-frame-store', mainFrame: 'text-south-live-parent-grow-parity-00931' }),
    getMode: () => 'site-frame-store',
  });
  window.ST_SAVE_ROOT_DOM_HTML = saveRootDom;
  window.ST_RESTORE_ROOT_DOM_HTML = restoreRootDom;
}

function boot() {
  installComponentApis();
  installCanvasApi();
  const frame = createMainSelectionFrame('boot');
  installAllSiteFrameSlotSelection();
  try { initSelectionManager(); } catch {}
  try { initSiteHeaderRuntime(); } catch (error) { log('header-runtime-error', { message: String(error?.message || error || '') }, 'error'); }
  try { initSiteFooterRuntime(); } catch (error) { log('footer-runtime-error', { message: String(error?.message || error || '') }, 'error'); }
  refreshEnhancers(frame.root);
  const storeSynced = syncFrameStore('main-selection-boot-00914');
  log('boot', {
    rootSlotAuthority: true,
    exactAreaOrder: ['header', 'main', 'footer'],
    mainSlotId: frame.main.id,
    mainSelectionNodes: frame.main.querySelectorAll('[data-main-selection-stage="00914"]').length,
    mainFrameOnly: false,
    mainSelection: true,
    mainDrag: true,
    mainResize: true,
    liveParentGrow: true,
    naturalFlow: true,
    resizeEquations: true,
    adjacentPairEquation: 'active-plus-adjacent-constant',
    pairCanvasWidthInvariant: true,
    canvasScrollbarGutter: 'stable',
    persistenceUndoRedo: true,
    mainTextEditable: true,
    textLocalActionHistory: true,
    mainTextBlockDragRestore: true,
    textEditableBlockDrag: true,
    textFocusStableDuringDraftSave: true,
    mainTextSavePreservesLiveDom: true,
    mainFillStylePersistence: true,
    mainFillStyleJsonPrimary: true,
    mainFillThemeReady: true,
    mainFillLiveDraftSync: true,
    mainFillRootSaveBeforeSelectionLoss: true,
    mainRadiusStylePersistence: true,
    mainRadiusStyleJsonPrimary: true,
    mainRadiusLiveDraftSync: true,
    mainRadiusLiveRafQuiet: true,
    mainRadiusSelectionVisualVariableSync: true,
    mainBorderColorStylePersistence: true,
    mainBorderColorStyleJsonPrimary: true,
    mainBorderColorLiveDraftSync: true,
    mainBorderColorLiveRafQuiet: true,
    mainBorderColorLiveStoreWrites: false,
    mainBorderColorLiveRootSaves: false,
    mainBorderColorSelectionLossFlush: true,
    mainTemplates: true,
    storeSynced,
    legacyCanvasRuntime: false,
    observers: 0,
    timers: 0,
    retryLoops: 0,
    geometryNormalizers: 0,
    dragRuntimes: 0,
  });
}

window.addEventListener('st:canvas-apply-snapshot', (event) => {
  applySnapshot(event?.detail?.snapshot, event?.detail?.options || {});
}, true);

document.addEventListener('st-page-selected', (event) => {
  const pageId = String(event?.detail?.pageId || event?.detail?.id || '').trim();
  if (pageId) getRoot().dataset.pageId = pageId;
}, true);

document.addEventListener('st:templates-applied', () => {
  const root = getRoot();
  refreshEnhancers(root);
  syncFrameStore('templates-applied-main-selection-00899');
}, true);

export const SITE_FRAME_WORKSPACE_RUNTIME_00888 = Object.freeze({
  version: VERSION,
  exactAreaOrder: Object.freeze(['header', 'main', 'footer']),
  mainSlotId: 'st-site-main-slot',
  mainFrameOnly: false,
  mainSelection: true,
  mainDrag: true,
  mainResize: true,
  liveParentGrow: true,
  naturalFlow: true,
  resizeEquations: true,
  adjacentPairEquation: 'active-plus-adjacent-constant',
  pairCanvasWidthInvariant: true,
  canvasScrollbarGutter: 'stable',
  persistenceUndoRedo: true,
  mainTemplates: true,
  observers: 0,
  timers: 0,
  retryLoops: 0,
  geometryNormalizers: 0,
  dragRuntimes: 0,
  legacyCanvasRuntime: false,
});

window.ST_SITE_FRAME_WORKSPACE_RUNTIME_00888 = SITE_FRAME_WORKSPACE_RUNTIME_00888;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else queueMicrotask(boot);
