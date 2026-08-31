// js/site-frame/site-frame-runtime-authority.js
// 00961: Main authored templates are isolated from legacy site-only geometry/containment defaults while Store stays JSON authority.
// Header/Footer authored blocks are opaque leaves in the DOM→JSON contract, so their
// internal implementation markup can never become structural SiteFrame children.
// Main supports edge-to-edge sections, selection, template add/replace, deletion, shared Store drag and the shared resize contract.

import { KIND, defaultNode } from './site-frame-contract.js';
import { SITE_FRAME_DOM_STRUCTURE_VERSION, directFrameChildren, inferFrameKind } from './site-frame-dom-structure.js';
import { SiteFrameDomRenderer } from './site-frame-renderer-00991.js?v=00991';
import { getEffectiveResponsiveNode00991, getResponsiveEditScope00991, scopeVisualPatch00991, responsiveProfileDescription00991 } from '../responsive-viewport/responsive-edit-scope-00991.js?v=00991';
import { SiteFrameStore } from './site-frame-store.js';
import {
  resolveImmediateMainTemplateTarget00952,
  resolveMainTemplateOperation00948
} from './site-frame-main-template-operation.js';
import { publishSiteFrameSelection } from './site-frame-explicit-selection-00989.js?v=00989';

const VERSION = '00991-site-frame-responsive-edit-scope-authority';
const STORAGE_KEY = 'st_site_frame_store_v1';
const HISTORY_STORAGE_KEY = 'st_site_frame_history_v1';
const AREA_ROOTS = Object.freeze({
  header: '#st-site-header-slot',
  main: '#st-site-main-slot',
  footer: '#st-site-footer-slot',
});

let idSeq = 1;
let activeContext = null;
let legacySinkCommit = false;

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_PERF_DIAG__?.push?.(`site-frame-store:${event}`, payload, level); } catch {}
  try { window.__ST_AI_DESIGN_DEBUG__?.push?.(`site-frame-store:${event}`, payload, level); } catch {}
  try { window.__ST_ALL_LOG__?.push?.(`site-frame-store:${event}`, payload, level); } catch {}
}

function isElement(value) {
  return value instanceof HTMLElement;
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function pxNumber(value) {
  const number = parseFloat(String(value || ''));
  return Number.isFinite(number) ? number : 0;
}

function ensureNodeId(element) {
  if (!isElement(element)) return '';
  let id = String(element.dataset.sfId || element.dataset.stNodeId || element.dataset.uid || element.id || '').trim();
  if (!id) id = `sf_dom_${Date.now().toString(36)}_${(idSeq++).toString(36)}`;
  element.dataset.sfId = id;
  element.dataset.stNodeId = id;
  return id;
}

function areaOf(element) {
  if (!isElement(element)) return '';
  if (element.closest('#st-site-header-slot')) return 'header';
  if (element.closest('#st-site-main-slot')) return 'main';
  if (element.closest('#st-site-footer-slot')) return 'footer';
  return '';
}

function directStructureChildren(element) {
  return directFrameChildren(element);
}

function kindOf(element) {
  return inferFrameKind(element);
}

function componentTypeOf(element, kind) {
  const explicit = String(element.dataset.sfComponent || element.dataset.componentType || element.dataset.type || '').trim();
  if (explicit) return explicit;
  if (element.classList.contains('st-block--menu')) return 'menu';
  if (element.classList.contains('st-block--text')) return 'text';
  if (element.classList.contains('st-block--image')) return 'image';
  if (element.classList.contains('st-block--icon')) return 'icon';
  if (kind === KIND.LEVEL) return 'level';
  if (kind === KIND.SECTION) return 'section';
  if (kind === KIND.CONTAINER) return 'container';
  return 'block';
}

function layoutOf(element) {
  const style = getComputedStyle(element);
  const display = String(style.display || '');
  let mode = 'none';
  if (display.includes('flex')) mode = String(style.flexDirection || '').includes('column') ? 'column' : 'row';
  else if (display.includes('grid')) mode = 'row';
  else if (directStructureChildren(element).length) mode = 'column';
  return {
    mode,
    gap: Math.max(0, pxNumber(style.gap || style.columnGap || style.rowGap)),
    padding: {
      top: pxNumber(style.paddingTop),
      right: pxNumber(style.paddingRight),
      bottom: pxNumber(style.paddingBottom),
      left: pxNumber(style.paddingLeft),
    },
    alignX: String(style.justifyContent || 'start'),
    alignY: String(style.alignItems || 'start'),
    wrap: String(style.flexWrap || '') === 'wrap',
  };
}

function sanitizedLeafContent(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('.st-resize,.st-selection-ui,.st-drag-marker,.st-drop-marker,.hb-resize-handle').forEach(node => node.remove());
  return {
    text: String(clone.textContent || ''),
    html: String(clone.innerHTML || ''),
  };
}

function nodeFromElement(element, parentId, area, previousNode = null) {
  const id = ensureNodeId(element);
  const kind = kindOf(element);
  const rect = element.getBoundingClientRect();
  const responsiveRendered00991 = !!previousNode && String(element.dataset.sfResponsiveProfile || '') && String(element.dataset.sfResponsiveProfile || '') !== 'base';
  const manualWidth = responsiveRendered00991 ? 0 : pxNumber(element.dataset.sfManualW);
  const manualHeight = responsiveRendered00991 ? 0 : pxNumber(element.dataset.sfManualH);
  const previousGeometry = previousNode?.meta?.geometry || {};
  const widthOwned = responsiveRendered00991 ? previousGeometry.widthOwned === true : (manualWidth > 0 || previousGeometry.widthOwned === true);
  const heightOwned = responsiveRendered00991 ? previousGeometry.heightOwned === true : (manualHeight > 0 || previousGeometry.heightOwned === true);
  const node = defaultNode({ id, area, kind, componentType: componentTypeOf(element, kind), parentId });
  node.children = [];
  node.layout = layoutOf(element);
  node.box = responsiveRendered00991 && previousNode?.box
    ? JSON.parse(JSON.stringify(previousNode.box))
    : {
      width: widthOwned ? Math.round(manualWidth || finite(previousNode?.box?.width, rect.width)) : Math.round(rect.width || 0),
      height: heightOwned ? Math.round(manualHeight || finite(previousNode?.box?.height, rect.height)) : Math.round(rect.height || 0),
    };
  node.constraints = {
    minWidth: 0,
    minHeight: 0,
    maxWidth: null,
    maxHeight: null,
  };
  node.style = {};
  node.responsive = previousNode?.responsive && typeof previousNode.responsive === 'object'
    ? JSON.parse(JSON.stringify(previousNode.responsive))
    : {};
  const inlineGrid = element.style.getPropertyValue('grid-template-columns');
  if (inlineGrid) node.style['grid-template-columns'] = inlineGrid;
  if (previousNode?.style && previousNode.meta?.geometry?.gridOwned === true) {
    node.style['grid-template-columns'] = previousNode.style['grid-template-columns'] || inlineGrid;
  }
  node.content = kind === KIND.BLOCK ? sanitizedLeafContent(element) : null;
  node.meta = {
    ...(node.meta || {}),
    dom: {
      tag: element.tagName.toLowerCase(),
      className: String(element.className || ''),
    },
    geometry: {
      widthOwned,
      heightOwned,
      gridOwned: previousGeometry.gridOwned === true || element.dataset.sfGridOwned === '1',
    },
  };
  return node;
}

function readStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.nodes ? parsed : null;
  } catch {
    return null;
  }
}


function readStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function persistHistory(reason = 'history-write') {
  if (!store?.exportHistory) return null;
  const history = store.exportHistory();
  const write = (payload) => {
    const text = JSON.stringify(payload);
    localStorage.setItem(HISTORY_STORAGE_KEY, text);
    log('history-written-00899', {
      reason,
      undoCount: payload?.status?.undoCount ?? payload?.undo?.length ?? 0,
      redoCount: payload?.status?.redoCount ?? payload?.redo?.length ?? 0,
      chars: text.length,
      jsonPrimary: true,
      htmlSnapshots: false,
    });
    return payload;
  };

  const compactHistory = (maxEntries) => {
    const keep00987 = Math.max(0, Number(maxEntries) || 0);
    const compact = {
      ...history,
      undo: Array.isArray(history.undo) ? (keep00987 > 0 ? history.undo.slice(-keep00987) : []) : [],
      redo: Array.isArray(history.redo) ? (keep00987 > 0 ? history.redo.slice(-keep00987) : []) : [],
    };
    compact.status = {
      ...(history.status || {}),
      undoCount: compact.undo.length,
      redoCount: compact.redo.length,
      canUndo: compact.undo.length > 0,
      canRedo: compact.redo.length > 0,
    };
    return compact;
  };

  let lastError = null;
  const candidates = [
    history,
    compactHistory(6),
    compactHistory(4),
    compactHistory(2),
    compactHistory(1),
    compactHistory(0),
  ];
  const seenSizes = new Set();
  for (const candidate of candidates) {
    const signature = `${candidate.undo?.length || 0}:${candidate.redo?.length || 0}`;
    if (seenSizes.has(signature)) continue;
    seenSizes.add(signature);
    try {
      return write(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  // 00987: if an older large persisted history already consumes the quota,
  // remove only that history key. Runtime Undo/Redo remains in memory; the
  // authoritative SiteFrameStore can then be persisted instead of leaving a
  // half-applied Main transaction on canvas.
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    const compact = compactHistory(0);
    const written = write(compact);
    log('history-storage-compacted-00987', {
      reason,
      runtimeUndoCount: history?.status?.undoCount ?? history?.undo?.length ?? 0,
      persistedUndoCount: 0,
      storePersistenceProtected: true,
    }, 'warn');
    return written;
  } catch (finalError) {
    lastError = finalError;
  }

  log('history-write-error-00940', {
    reason,
    message: String(lastError?.message || lastError || ''),
    runtimeUndoCount: history?.status?.undoCount ?? history?.undo?.length ?? 0,
    runtimeRedoCount: history?.status?.redoCount ?? history?.redo?.length ?? 0,
    preservedInMemory: true,
  }, 'warn');
  return null;
}

function restoreHistoryFromStorage() {
  const history = readStoredHistory();
  if (!history || !store?.importHistory) return null;
  const status = store.importHistory(history);
  log('history-restored-00899', {
    undoCount: status.undoCount,
    redoCount: status.redoCount,
    max: status.max,
    jsonPrimary: true,
    htmlSnapshots: false,
  });
  return status;
}

const storedState = readStoredState();
const store = new SiteFrameStore(storedState || null);
const renderer = new SiteFrameDomRenderer(store, document);
restoreHistoryFromStorage();


const MAIN_SELECTION_IDS = Object.freeze({
  section: 'sf_main_00887_section_001',
  level: 'sf_main_00887_level_001',
  left: 'sf_main_00887_container_001',
  leftHeading: 'sf_main_00887_block_heading_001',
  leftText: 'sf_main_00887_block_text_001',
  right: 'sf_main_00887_container_002',
  rightHeading: 'sf_main_00887_block_heading_002',
  rightText: 'sf_main_00887_block_text_002',
});

function mainNode(input) {
  const node = defaultNode(input);
  node.meta = {
    ...(node.meta || {}),
    stage: '00888-main-selection-base',
    geometry: { widthOwned: false, heightOwned: false, gridOwned: false },
  };
  return node;
}

function resetMainSelectionState(reason = 'main-selection-state') {
  const area = store.findArea('main') || store.createArea('main');
  for (const childId of [...(area.children || [])]) {
    if (store.maybeGet(childId)) store.removeNode(childId);
  }

  const section = mainNode({
    id: MAIN_SELECTION_IDS.section,
    area: 'main',
    kind: KIND.SECTION,
    componentType: 'selection-demo-section',
    parentId: area.id,
  });
  section.box = { width: '100%', height: 'auto' };
  section.layout = { mode: 'column', gap: 0, padding: { top: 32, right: 32, bottom: 32, left: 32 }, alignX: 'stretch', alignY: 'start', wrap: false };
  section.style = {
    background: 'linear-gradient(135deg,#f8fafc,#eef2ff)',
    border: '1px solid rgba(99,102,241,.18)',
    'border-radius': '18px',
    color: '#0f172a',
  };
  store.addNode(area.id, section);

  const level = mainNode({
    id: MAIN_SELECTION_IDS.level,
    area: 'main',
    kind: KIND.LEVEL,
    componentType: 'selection-demo-level',
    parentId: section.id,
  });
  level.box = { width: '100%', height: 'auto' };
  level.layout = { mode: 'row', gap: 20, padding: { top: 0, right: 0, bottom: 0, left: 0 }, alignX: 'start', alignY: 'stretch', wrap: false };
  level.style = { display: 'flex', 'flex-direction': 'row', width: '100%', 'align-items': 'stretch' };
  store.addNode(section.id, level);

  const addContainer = (id, parentId) => {
    const container = mainNode({ id, area: 'main', kind: KIND.CONTAINER, componentType: 'selection-demo-container', parentId });
    container.box = { width: 'auto', height: 'auto' };
    container.layout = { mode: 'column', gap: 10, padding: { top: 24, right: 24, bottom: 24, left: 24 }, alignX: 'stretch', alignY: 'start', wrap: false };
    container.style = {
      display: 'flex',
      'flex-direction': 'column',
      flex: '1 1 0',
      width: 'auto',
      'min-width': '0',
      background: '#ffffff',
      border: '1px solid rgba(148,163,184,.35)',
      'border-radius': '14px',
      overflow: 'visible',
      color: '#0f172a',
    };
    store.addNode(parentId, container);
    return container;
  };

  const addBlock = (id, parentId, componentType, text, style = {}) => {
    const blockNode = mainNode({ id, area: 'main', kind: KIND.BLOCK, componentType, parentId });
    blockNode.box = { width: 'auto', height: 'auto' };
    blockNode.constraints = { minWidth: 32, minHeight: 24, maxWidth: null, maxHeight: null };
    blockNode.content = { text };
    blockNode.style = {
      width: 'auto',
      height: 'auto',
      'min-height': '0',
      background: 'transparent',
      border: '0',
      'border-radius': '0',
      overflow: 'visible',
      color: '#0f172a',
      ...style,
    };
    store.addNode(parentId, blockNode);
    return blockNode;
  };

  const left = addContainer(MAIN_SELECTION_IDS.left, level.id);
  addBlock(MAIN_SELECTION_IDS.leftHeading, left.id, 'heading', 'MAIN · ТЕСТ ВИДІЛЕННЯ', {
    'font-size': '22px', 'font-weight': '800', 'line-height': '1.2', color: '#312e81'
  });
  addBlock(MAIN_SELECTION_IDS.leftText, left.id, 'text', 'Лівий текстовий блок. Клікни по ньому, контейнеру, рівню або секції.', {
    'font-size': '14px', 'line-height': '1.55', color: '#475569'
  });

  const right = addContainer(MAIN_SELECTION_IDS.right, level.id);
  addBlock(MAIN_SELECTION_IDS.rightHeading, right.id, 'heading', 'SELECTION ONLY', {
    'font-size': '22px', 'font-weight': '800', 'line-height': '1.2', color: '#0f766e'
  });
  addBlock(MAIN_SELECTION_IDS.rightText, right.id, 'text', 'У цьому етапі Маїн виділяється і приймає шаблони. Drag та resize ще вимкнені.', {
    'font-size': '14px', 'line-height': '1.55', color: '#475569'
  });

  store.rebuildTreeMeta();
  log('main-selection-state-created', {
    reason,
    areaChildren: area.children.length,
    nodeIds: Object.values(MAIN_SELECTION_IDS),
    jsonPrimary: true,
  });
  return area;
}

function mainSelectionStateValid() {
  const area = store.findArea('main');
  if (!area || !Array.isArray(area.children)) return false;
  // [00892] An empty Main area is a valid committed state. Deleting the last
  // section must not silently recreate the demo/template section on render.
  return area.children.every((id) => {
    const node = store.maybeGet(id);
    return !!node && node.kind === KIND.SECTION && node.area === 'main';
  });
}

function applyMainNodeStyle(element, node) {
  // [00891] A SiteFrame block is an authored content node, not a visual builder card.
  // The shared canvas class `.st-block` supplies editor defaults (background/border/radius),
  // while raw template HTML has transparent DIV semantics. Neutralise only those editor
  // defaults first; any explicit authored node.style below remains the final authority.
  if (node.kind === KIND.BLOCK) {
    element.style.background = 'transparent';
    element.style.border = '0';
    element.style.borderRadius = '0';
    element.style.boxShadow = 'none';
  }

  const layout = node.layout || {};
  const padding = layout.padding || {};
  element.style.boxSizing = 'border-box';
  element.style.padding = `${Number(padding.top || 0)}px ${Number(padding.right || 0)}px ${Number(padding.bottom || 0)}px ${Number(padding.left || 0)}px`;
  element.style.gap = `${Number(layout.gap || 0)}px`;
  if (layout.mode === 'row') {
    element.style.display = 'flex';
    element.style.flexDirection = 'row';
    element.style.flexWrap = layout.wrap ? 'wrap' : 'nowrap';
  } else if (layout.mode === 'column') {
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
  }
  const authoredStyle00987 = node.meta?.authoredStyle00960 && typeof node.meta.authoredStyle00960 === 'object'
    ? node.meta.authoredStyle00960
    : null;
  const authoredPriority00987 = node.meta?.authoredStylePriority00987 && typeof node.meta.authoredStylePriority00987 === 'object'
    ? node.meta.authoredStylePriority00987
    : null;
  for (const [property, value] of Object.entries(node.style || {})) {
    if (value == null || value === '') continue;
    const sameAsAuthored00987 = authoredStyle00987 && Object.prototype.hasOwnProperty.call(authoredStyle00987, property)
      && String(authoredStyle00987[property] ?? '') === String(value ?? '');
    const priority00987 = sameAsAuthored00987 ? String(authoredPriority00987?.[property] || '') : '';
    element.style.setProperty(property, String(value), priority00987);
  }
}

function mainTextEditableHtml00901(node) {
  const raw = String(node?.content?.html ?? node?.content?.text ?? '');
  const host = document.createElement('div');
  host.innerHTML = raw;
  const existing = host.querySelector?.('.st-text-edit,[data-st-text-target="1"],[contenteditable="true"],[contenteditable="plaintext-only"]');
  if (existing instanceof HTMLElement) return existing.innerHTML;
  return raw;
}

function renderMainTextBlock00901(element, node) {
  const component = String(node?.componentType || 'text').toLowerCase();
  const grip = document.createElement('span');
  grip.className = 'st-text-drag-grip';
  grip.dataset.siteFrameTextDragGrip = '00904';
  grip.setAttribute('aria-hidden', 'true');
  grip.setAttribute('role', 'presentation');
  grip.removeAttribute('title');
  const editable = document.createElement('div');
  editable.className = `st-text-edit${component === 'heading' ? ' st-text-edit--heading' : ''}`;
  editable.setAttribute('contenteditable', 'true');
  editable.setAttribute('data-st-text-target', '1');
  editable.setAttribute('spellcheck', 'false');
  editable.dataset.stTextLocalHistory = '00904';
  editable.innerHTML = mainTextEditableHtml00901(node);
  const editableStyle00921 = String(node?.meta?.textEditableStyle || '').trim();
  if (editableStyle00921) editable.style.cssText = editableStyle00921;
  element.replaceChildren(grip, editable);
  element.dataset.blockKind = component;
  element.dataset.blockRole = component;
  element.dataset.mainTextEditable = '00904';
  element.dataset.mainTextBlockDragRestore = '00904';
}

function isMainEditableTextBlock00901(node) {
  if (!node || node.kind !== KIND.BLOCK) return false;
  const component = String(node.componentType || '').toLowerCase();
  return component === 'text' || component === 'heading' || component === 'button' || component === 'phone' || component === 'logo';
}

function mainElementForNode(node) {
  const visualNode00991 = getEffectiveResponsiveNode00991(node) || node;
  const element = document.createElement(node.kind === KIND.SECTION ? 'section' : 'div');
  const classes = String(node.meta?.dom?.className || '').split(/\s+/).filter(Boolean);
  if (node.kind === KIND.SECTION) classes.push('st-section', 'sf-main-selection-section');
  if (node.kind === KIND.LEVEL) classes.push('st-row', 'sf-main-selection-level');
  if (node.kind === KIND.CONTAINER) classes.push('st-block', 'sf-main-selection-container');
  if (node.kind === KIND.BLOCK) classes.push('hb-elem', 'st-block', 'sf-main-selection-block', `st-block--${node.componentType || 'text'}`);
  element.className = [...new Set(classes)].join(' ');
  element.dataset.sfId = node.id;
  element.dataset.stNodeId = node.id;
  element.dataset.nodeId = node.id;
  element.dataset.sfArea = 'main';
  element.dataset.sfKind = node.kind;
  if (node.kind === KIND.SECTION) element.dataset.secRole = 'main';
  if (node.meta?.treeName) element.dataset.stTreeName = String(node.meta.treeName);
  element.dataset.hfNodeType = node.kind;
  element.dataset.sfComponent = node.componentType || '';
  if (node.meta?.templateId) element.dataset.templateId = String(node.meta.templateId);
  // [00961] This marker is a CSS ownership boundary, not a rescue rule. It tells
  // legacy builder canvas defaults to leave imported authored layout alone.
  if (node.meta?.authoredStyle00960 && typeof node.meta.authoredStyle00960 === 'object') {
    element.dataset.sfAuthoredTemplate = '00961';
  }
  if (node.meta?.styleSource) element.dataset.stStyleSource = String(node.meta.styleSource);
  if (node.meta?.semanticStyle) element.dataset.stSemanticStyle = String(node.meta.semanticStyle);
  if (node.meta?.semanticRole) element.dataset.stSemanticRole = String(node.meta.semanticRole);
  const fillDataset00907 = node.meta?.fill?.dataset && typeof node.meta.fill.dataset === 'object' ? node.meta.fill.dataset : null;
  if (fillDataset00907) {
    for (const [key, value] of Object.entries(fillDataset00907)) {
      if (!key || value == null || value === '') continue;
      try { element.dataset[key] = String(value); } catch {}
    }
  }
  const authoredDataset00918 = node.meta?.dom?.dataset && typeof node.meta.dom.dataset === 'object'
    ? node.meta.dom.dataset
    : null;
  if (authoredDataset00918) {
    for (const [key, value] of Object.entries(authoredDataset00918)) {
      if (!key || value == null || value === '') continue;
      try { element.dataset[key] = String(value); } catch {}
    }
  }
  element.dataset.sfDepth = String(node.tree?.depth ?? 0);
  element.dataset.sfPath = (node.tree?.path || []).join('/');
  element.dataset.sfAncestorIds = (node.tree?.ancestorIds || []).join(',');
  element.dataset.mainSelectionStage = '00918';
  applyMainNodeStyle(element, visualNode00991);
  if (node.kind === KIND.BLOCK) {
    if (isMainEditableTextBlock00901(node)) renderMainTextBlock00901(element, visualNode00991);
    else if (node.content?.html) element.innerHTML = String(node.content.html);
    else element.textContent = String(node.content?.text || '');
  }
  else for (const childId of node.children || []) {
    const child = store.maybeGet(childId);
    if (child) element.appendChild(mainElementForNode(child));
  }
  return element;
}

function renderMainSelectionArea(reason = 'main-selection-render') {
  const slot = document.getElementById('st-site-main-slot');
  if (!(slot instanceof HTMLElement)) return false;
  if (!mainSelectionStateValid()) resetMainSelectionState(reason);
  const area = store.findArea('main');
  const fragment = document.createDocumentFragment();
  for (const childId of area?.children || []) {
    const node = store.maybeGet(childId);
    if (node) fragment.appendChild(mainElementForNode(node));
  }
  slot.replaceChildren(fragment);
  slot.dataset.siteFrameMainStage = '00918-main-layers-boundaries-parity';
  slot.removeAttribute('data-site-frame-empty-frame');
  const geometryRendered = renderer.renderArea('main');
  log('main-selection-rendered', {
    reason,
    rootCount: area?.children?.length || 0,
    nodeCount: Object.values(MAIN_SELECTION_IDS).filter((id) => !!store.maybeGet(id)).length,
    domNodes: slot.querySelectorAll('[data-sf-area="main"][data-sf-kind]').length,
    resizeHandles: slot.querySelectorAll('.st-resize').length,
    geometryRendered,
  });
  return true;
}


function styleObjectFromElement00888(element) {
  const out = {};
  for (let i = 0; i < element.style.length; i += 1) {
    const name = element.style.item(i);
    if (name) out[name] = element.style.getPropertyValue(name);
  }
  return out;
}

function stylePriorityObjectFromElement00987(element) {
  const out = {};
  for (let i = 0; i < element.style.length; i += 1) {
    const name = element.style.item(i);
    if (!name) continue;
    const priority = String(element.style.getPropertyPriority(name) || '').trim();
    if (priority) out[name] = priority;
  }
  return out;
}

function authoredDatasetFromElement00987(element) {
  const out = {};
  for (const [key, value] of Object.entries(element?.dataset || {})) {
    if (!key) continue;
    // Runtime/editor identity is regenerated by SiteFrameStore. Authored data-* is not.
    if (['sfId','sfArea','sfKind','sfComponent','sfDepth','sfPath','sfAncestorIds','stNodeId','nodeId','mainSelectionStage','hfNodeType'].includes(key)) continue;
    out[key] = String(value ?? '');
  }
  return out;
}

function directTemplateStructureChildren00888(element) {
  return Array.from(element.children || []).filter((child) => {
    if (!(child instanceof HTMLElement)) return false;
    return child.matches('.st-row,[data-st-node="level"],.st-block,[data-st-node="container"]');
  });
}

function inferTemplateKind00888(element) {
  if (element.matches('section,.st-section')) return KIND.SECTION;
  if (element.matches('.st-row,[data-st-node="level"]')) return KIND.LEVEL;
  if (element.matches('[data-st-node="container"]')) return KIND.CONTAINER;
  if (element.matches('.st-block')) {
    return directTemplateStructureChildren00888(element).length ? KIND.CONTAINER : KIND.BLOCK;
  }
  return KIND.BLOCK;
}

function componentTypeFromTemplate00888(element, kind) {
  if (kind !== KIND.BLOCK) return kind;
  const explicitRole = String(element.dataset.blockRole || '').trim().toLowerCase();
  if (explicitRole) return explicitRole;
  const authored = new Set(Array.from(element.classList || [])
    .filter((name) => name.startsWith('st-block--'))
    .map((name) => name.slice('st-block--'.length).toLowerCase()));
  const semanticPriority = ['heading', 'button', 'logo', 'phone', 'menu-item', 'menu', 'icon', 'link', 'image', 'text'];
  return semanticPriority.find((component) => authored.has(component))
    || String(element.dataset.blockKind || 'text').trim().toLowerCase()
    || 'text';
}

function templateNodeInput00888(element, kind, id, parentId, templateId) {
  const style = styleObjectFromElement00888(element);
  const display = String(style.display || element.dataset.layoutMode || '').toLowerCase();
  const orient = String(style['flex-direction'] || element.dataset.layoutOrient || '').toLowerCase();
  const node = defaultNode({ id, area: 'main', kind, componentType: componentTypeFromTemplate00888(element, kind), parentId });
  node.children = [];
  node.layout = {
    mode: kind === KIND.LEVEL || kind === KIND.CONTAINER ? ((display.includes('grid') || orient === 'row') ? 'row' : 'column') : 'none',
    gap: parseFloat(style.gap || '0') || 0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    alignX: 'stretch', alignY: 'start', wrap: String(style['flex-wrap'] || '') === 'wrap'
  };
  node.box = { width: 'auto', height: 'auto' };
  node.style = style;
  node.content = kind === KIND.BLOCK ? { html: element.innerHTML, text: element.textContent || '' } : null;
  node.meta = {
    ...(node.meta || {}),
    stage: '00961-main-template-residual-preview-parity',
    templateId,
    dom: {
      tag: element.tagName.toLowerCase(),
      className: String(element.className || ''),
      dataset: authoredDatasetFromElement00987(element),
    },
    authoredStylePriority00987: stylePriorityObjectFromElement00987(element),
    // [00960] Keep an immutable authored-style baseline. SiteFrameDomRenderer
    // uses normal CSS priority while a property still equals this baseline, so
    // the applied DOM participates in the exact same cascade as fullscreen
    // preview (including :hover and @container !important rules). Once a user
    // control changes a property, its value differs from this snapshot and the
    // renderer promotes only that edited property to Store-owned !important.
    authoredStyle00960: { ...style },
    styleCascade00960: 'template-authored-until-edited',
    geometry: { widthOwned: false, heightOwned: false, gridOwned: false }
  };
  return node;
}

function importMainTemplateSection00888(html, parentId, templateId) {
  const host = document.createElement('div');
  host.innerHTML = String(html || '').trim();
  const source = host.querySelector('.st-section,section');
  if (!(source instanceof HTMLElement)) throw new Error('Main template must contain .st-section');
  let seq = 0;
  const createdIds = [];
  const stamp = Date.now().toString(36);
  const visit = (element, targetParentId) => {
    const kind = inferTemplateKind00888(element);
    seq += 1;
    const id = `sf_main_tpl_${stamp}_${seq.toString(36)}`;
    const node = templateNodeInput00888(element, kind, id, targetParentId, templateId);
    store.addNode(targetParentId, node);
    createdIds.push(id);
    if (kind !== KIND.BLOCK) {
      for (const child of directTemplateStructureChildren00888(element)) visit(child, id);
    }
    return id;
  };
  const rootId = visit(source, parentId);
  return Object.freeze({ rootId, createdIds: Object.freeze([...createdIds]) });
}

function selectedMainSectionId00888() {
  const selected = window.__ST_SITE_FRAME_EXPLICIT_SELECTION_00887__?.getActive?.('main') || null;
  return resolveImmediateMainTemplateTarget00952(store, selected?.nodeId || '').sectionId;
}

function resolveMainTemplateTarget00952() {
  const selected = window.__ST_SITE_FRAME_EXPLICIT_SELECTION_00887__?.getActive?.('main') || null;
  return resolveImmediateMainTemplateTarget00952(store, selected?.nodeId || '');
}

function diagnoseMainTemplateParity00961(createdIds = [], templateId = '') {
  const ids = Array.isArray(createdIds) ? createdIds : [];
  let geometryOwned = 0;
  let authoredBaselineNodes = 0;
  let structuralNodes = 0;
  let legacyMinHeight140 = 0;
  let legacyRowMinHeight40 = 0;
  let legacyContainPaint = 0;
  let legacyIsolationIsolate = 0;

  for (const id of ids) {
    const node = store.maybeGet(id);
    if (!node) continue;
    const authored = node.meta?.authoredStyle00960 && typeof node.meta.authoredStyle00960 === 'object'
      ? node.meta.authoredStyle00960
      : null;
    if (authored) authoredBaselineNodes += 1;
    if (node.meta?.geometry?.widthOwned === true || node.meta?.geometry?.heightOwned === true) geometryOwned += 1;
    if (node.kind === KIND.SECTION || node.kind === KIND.LEVEL || node.kind === KIND.CONTAINER) structuralNodes += 1;

    const element = document.querySelector(`#st-site-main-slot [data-sf-id="${cssEscape00892(id)}"]`);
    if (!(element instanceof HTMLElement)) continue;
    const computed = getComputedStyle(element);
    const authoredMin = String(authored?.['min-height'] || '').trim();
    if (!authoredMin && (node.kind === KIND.CONTAINER || node.kind === KIND.BLOCK) && String(computed.minHeight || '').trim() === '140px') {
      legacyMinHeight140 += 1;
    }
    if (!authoredMin && node.kind === KIND.LEVEL && String(computed.minHeight || '').trim() === '40px') {
      legacyRowMinHeight40 += 1;
    }
    if (!String(authored?.contain || '').trim() && String(computed.contain || '').trim() === 'paint') legacyContainPaint += 1;
    if (!String(authored?.isolation || '').trim() && String(computed.isolation || '').trim() === 'isolate') legacyIsolationIsolate += 1;
  }

  const slot = document.getElementById('st-site-main-slot');
  const buttonProbe = [];
  const quickCardProbe = [];
  let badgeProbe = null;
  if (slot instanceof HTMLElement && String(templateId || '') === 'school-01-main') {
    for (const button of slot.querySelectorAll('.school01-main-button')) {
      if (!(button instanceof HTMLElement) || button.dataset.sfManualH) continue;
      const rect = button.getBoundingClientRect();
      if (rect.height > 62) buttonProbe.push({ text: String(button.textContent || '').trim().slice(0, 60), height: Math.round(rect.height * 10) / 10 });
    }
    for (const card of slot.querySelectorAll('.school01-main-quick-card')) {
      if (!(card instanceof HTMLElement)) continue;
      const rect = card.getBoundingClientRect();
      if (rect.height > 130) quickCardProbe.push({ text: String(card.textContent || '').trim().slice(0, 60), height: Math.round(rect.height * 10) / 10 });
    }
    const media = slot.querySelector('.school01-main-about__media');
    const badge = slot.querySelector('.school01-main-about__badge');
    if (media instanceof HTMLElement && badge instanceof HTMLElement) {
      const mr = media.getBoundingClientRect();
      const br = badge.getBoundingClientRect();
      const cs = getComputedStyle(media);
      badgeProbe = {
        mediaOverflowX: String(cs.overflowX || ''),
        mediaOverflowY: String(cs.overflowY || ''),
        extendsRightPx: Math.round(Math.max(0, br.right - mr.right) * 10) / 10,
        extendsBottomPx: Math.round(Math.max(0, br.bottom - mr.bottom) * 10) / 10,
        clippedByMedia: (cs.overflowX !== 'visible' && br.right > mr.right + 0.5) || (cs.overflowY !== 'visible' && br.bottom > mr.bottom + 0.5)
      };
    }
  }

  const legacyCanvasDefaultsNeutral = legacyMinHeight140 === 0 && legacyRowMinHeight40 === 0 && legacyContainPaint === 0 && legacyIsolationIsolate === 0;
  const schoolVisualProbesOk = buttonProbe.length === 0 && quickCardProbe.length === 0 && (!badgeProbe || badgeProbe.clippedByMedia === false);
  return Object.freeze({
    templateId: String(templateId || ''),
    createdNodes: ids.length,
    structuralNodes,
    authoredBaselineNodes,
    geometryOwned,
    legacyMinHeight140,
    legacyRowMinHeight40,
    legacyContainPaint,
    legacyIsolationIsolate,
    buttonOversizeCount: buttonProbe.length,
    buttonOversizeSamples: Object.freeze(buttonProbe.slice(0, 6)),
    quickCardOversizeCount: quickCardProbe.length,
    quickCardOversizeSamples: Object.freeze(quickCardProbe.slice(0, 6)),
    badgeProbe,
    previewCascadePreserved: authoredBaselineNodes === ids.length,
    legacyCanvasDefaultsNeutral,
    schoolVisualProbesOk,
    cleanApplyGeometry: geometryOwned === 0,
    ok: authoredBaselineNodes === ids.length && geometryOwned === 0 && legacyCanvasDefaultsNeutral && schoolVisualProbesOk
  });
}

function applyMainTemplate00888({ html = '', templateId = '', mode = 'add', targetSectionId = '', templateSelection00946 = null, replaceScope = 'section' } = {}) {
  const area = store.findArea('main') || store.createArea('main');
  const normalizedReplaceScope00987 = mode === 'replace' && String(replaceScope || '').toLowerCase() === 'main-area'
    ? 'main-area'
    : 'section';
  const targetResolution00952 = mode === 'replace' && normalizedReplaceScope00987 !== 'main-area'
    ? (targetSectionId
        ? resolveImmediateMainTemplateTarget00952(store, targetSectionId)
        : resolveMainTemplateTarget00952())
    : normalizedReplaceScope00987 === 'main-area'
      ? { sectionId: '', replaceIndex: 0, source: 'main-area', reason: '' }
      : { sectionId: '', replaceIndex: -1, source: 'add', reason: '' };
  const operation = resolveMainTemplateOperation00948(store, {
    mode,
    targetNodeId: targetResolution00952.sectionId,
    replaceScope: normalizedReplaceScope00987
  });
  const { requestedMode, effectiveMode, selectedId, replaceIndex } = operation;
  const replacedRootIds00987 = Array.isArray(operation.replacedRootIds) ? [...operation.replacedRootIds] : (selectedId ? [selectedId] : []);
  if (!operation.ok) {
    log('main-template-apply-rejected-00949', {
      requestedMode,
      effectiveMode,
      selectedId,
      targetSectionId: String(targetSectionId || ''),
      targetSource: String(targetResolution00952.source || ''),
      replaceScope: normalizedReplaceScope00987,
      reason: operation.reason,
      templateId,
      noTransaction: true,
      noStoreWrite: true
    }, 'warn');
    return Object.freeze({
      ok: false,
      requestedMode,
      effectiveMode,
      selectedId,
      reason: operation.reason,
      error: operation.reason
    });
  }
  const beforeApplyState00987 = store.toJSON();
  store.beginTransaction('main-template-apply', { mode: requestedMode, templateId, selectedId, replaceScope: normalizedReplaceScope00987, replacedRootIds: replacedRootIds00987 });
  let transactionCommitted00987 = false;
  try {
    for (const rootId00987 of replacedRootIds00987) {
      if (store.maybeGet(rootId00987)) store.removeNode(rootId00987);
    }
    const imported = importMainTemplateSection00888(html, area.id, templateId);
    const newId = imported.rootId;
    if (replaceIndex >= 0) store.moveNode(newId, area.id, replaceIndex);
    let activeTemplateDescriptor00946 = null;
    if (templateSelection00946 && String(templateSelection00946.templateId || '') === String(templateId || '')) {
      activeTemplateDescriptor00946 = {
        area: 'main',
        templateId: String(templateId || ''),
        templateName: String(templateSelection00946.templateName || templateId || ''),
        profileId: String(templateSelection00946.profileId || ''),
        collectionId: String(templateSelection00946.collectionId || ''),
        recordedAt: Number(templateSelection00946.recordedAt || Date.now())
      };
    }
    const currentArea = store.get(area.id);
    const previousSelection = currentArea.meta?.templateSelection00946;
    const nextAreaMeta00952 = {
      ...(currentArea.meta || {}),
      mainTemplateTarget00952: {
        version: '00952-main-template-immediate-target',
        sectionId: newId,
        templateId: String(templateId || ''),
        updatedAt: Date.now()
      }
    };
    if (activeTemplateDescriptor00946) {
      nextAreaMeta00952.templateSelection00946 = {
        version: 'st-template-style-sync-state-v1-00946',
        ...(previousSelection && typeof previousSelection === 'object' ? previousSelection : {}),
        current: activeTemplateDescriptor00946
      };
    }
    store.updateNode(area.id, { meta: nextAreaMeta00952 });
    store.markTransactionChanges([...imported.createdIds, area.id]);
    const result = store.commitTransaction({ mode: requestedMode, effectiveMode, templateId, newId, replaceScope: normalizedReplaceScope00987, replacedRootIds: replacedRootIds00987 });
    transactionCommitted00987 = true;
    renderMainSelectionArea('main-template-apply-00888');
    const parity00961 = diagnoseMainTemplateParity00961(imported.createdIds, templateId);
    log('main-template-preview-parity-00961', parity00961, parity00961.ok ? 'info' : 'warn');
    persistStore('main-template-apply-00888');
    const mainSlot00952 = document.getElementById('st-site-main-slot');
    const renderedTarget00952 = mainSlot00952?.querySelector?.(
      `[data-node-id="${newId}"],[data-hb-ref="${newId}"],[data-sf-id="${newId}"]`
    ) || null;
    if (renderedTarget00952 instanceof HTMLElement) {
      publishSiteFrameSelection({
        area: 'main',
        slot: mainSlot00952,
        target: renderedTarget00952,
        kind: 'section',
        reason: 'main-template-immediate-target-00952'
      });
    }
    try { window.dispatchEvent(new CustomEvent('st:templates-applied', { detail: { area: 'main', mode: requestedMode, effectiveMode, templateId, newId, replaceScope: normalizedReplaceScope00987 } })); } catch {}
    if (activeTemplateDescriptor00946) {
      try { window.dispatchEvent(new CustomEvent('st:active-template-changed-00946', { detail: { area: 'main', descriptor: activeTemplateDescriptor00946 } })); } catch {}
    }
    log('main-template-applied-00888', {
      requestedMode,
      effectiveMode,
      selectedId,
      targetSectionId: String(targetResolution00952.sectionId || ''),
      targetSource: String(targetResolution00952.source || ''),
      replaceScope: normalizedReplaceScope00987,
      replacedRootIds: replacedRootIds00987,
      newId,
      createdIds: imported.createdIds,
      templateId,
      sectionCount: area.children.length,
    });
    return Object.freeze({ ok: true, requestedMode, effectiveMode, selectedId, newId, replaceScope: normalizedReplaceScope00987, replacedRootIds: Object.freeze([...replacedRootIds00987]), targetSource: String(targetResolution00952.source || '') });
  } catch (error) {
    const message00987 = String(error?.message || error || '');
    if (store.hasActiveTransaction()) {
      store.rollbackTransaction({ message: message00987 });
    } else if (transactionCommitted00987) {
      // 00987: persistence is part of the apply contract. If storage fails after
      // commit, restore the exact pre-apply JSON in memory so Replace never leaves
      // an extra/half-applied Main visible on canvas.
      store.load(beforeApplyState00987, { emit: false });
      renderMainSelectionArea('main-template-apply-storage-rollback-00987');
    }
    log('main-template-apply-error-00888', { message: message00987, templateId, replaceScope: normalizedReplaceScope00987, atomicRollback00987: transactionCommitted00987 }, 'error');
    return Object.freeze({ ok: false, error: message00987 });
  }
}

function ensureMainSelectionFrame(reason = 'main-selection-ensure') {
  if (!mainSelectionStateValid()) resetMainSelectionState(reason);
  const rendered = renderMainSelectionArea(reason);
  persistStore(reason);
  return Object.freeze({ rendered, ids: { ...MAIN_SELECTION_IDS }, nodeCount: Object.values(MAIN_SELECTION_IDS).length });
}

function renameMainNode00891(id, treeName = '') {
  const nodeId = String(id || '').trim();
  const node = nodeId ? store.maybeGet(nodeId) : null;
  if (!node || node.area !== 'main' || node.kind === KIND.AREA || node.kind === KIND.SITE) {
    return Object.freeze({ ok: false, reason: 'invalid-main-node', id: nodeId });
  }
  const nextName = String(treeName || '').trim();
  store.beginTransaction('main-tree-rename', { id: nodeId, treeName: nextName });
  try {
    store.updateNode(nodeId, { meta: { ...(node.meta || {}), treeName: nextName } });
    store.markTransactionChanges([nodeId]);
    store.commitTransaction({ id: nodeId, treeName: nextName });
    renderMainSelectionArea('main-tree-rename-00891');
    persistStore('main-tree-rename-00891');
    try { window.dispatchEvent(new CustomEvent('st:site-frame-main-tree-changed', { detail: { action: 'rename', id: nodeId, treeName: nextName } })); } catch {}
    return Object.freeze({ ok: true, id: nodeId, treeName: nextName });
  } catch (error) {
    store.rollbackTransaction({ message: String(error?.message || error || '') });
    return Object.freeze({ ok: false, reason: String(error?.message || error || ''), id: nodeId });
  }
}

function removeMainNode00891(id) {
  const nodeId = String(id || '').trim();
  const node = nodeId ? store.maybeGet(nodeId) : null;
  if (!node || node.area !== 'main' || node.kind === KIND.AREA || node.kind === KIND.SITE) {
    return Object.freeze({ ok: false, reason: 'invalid-main-node', id: nodeId });
  }
  const area = store.findArea('main');
  const parentId = String(node.parentId || '');
  store.beginTransaction('main-tree-remove', { id: nodeId, parentId, kind: node.kind });
  try {
    store.removeNode(nodeId);
    store.markTransactionChanges([parentId, area?.id].filter(Boolean));
    store.commitTransaction({ id: nodeId, parentId, kind: node.kind });
    renderMainSelectionArea('main-tree-remove-00891');
    persistStore('main-tree-remove-00891');
    try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: null })); } catch {}
    try { window.dispatchEvent(new CustomEvent('st:site-frame-main-tree-changed', { detail: { action: 'remove', id: nodeId, parentId } })); } catch {}
    try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: 'main-tree-remove-00892', area: 'main', id: nodeId } })); } catch {}
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false }); } catch {}
    return Object.freeze({ ok: true, area: 'main', id: nodeId, parentId, kind: node.kind });
  } catch (error) {
    store.rollbackTransaction({ message: String(error?.message || error || '') });
    return Object.freeze({ ok: false, reason: String(error?.message || error || ''), id: nodeId });
  }
}

function cssEscape00892(value) {
  const raw = String(value || '');
  try { return globalThis.CSS?.escape ? globalThis.CSS.escape(raw) : raw.replace(/(["\\])/g, '\\$1'); }
  catch { return raw.replace(/(["\\])/g, '\\$1'); }
}

function moveSiteFrameNode00895(id, newParentId, index = null) {
  const nodeId = String(id || '').trim();
  const parentId = String(newParentId || '').trim();
  const node = nodeId ? store.maybeGet(nodeId) : null;
  const parent = parentId ? store.maybeGet(parentId) : null;
  const oldParentId = String(node?.parentId || '');
  const oldParent = oldParentId ? store.maybeGet(oldParentId) : null;

  if (!node || !parent || !oldParent) return Object.freeze({ ok: false, moved: false, reason: 'missing-node-or-parent', id: nodeId, parentId, oldParentId });
  if (node.area !== 'main' || parent.area !== 'main' || oldParent.area !== 'main') {
    return Object.freeze({ ok: false, moved: false, reason: '00895-main-only', id: nodeId, parentId, oldParentId, area: node.area || '' });
  }
  if (node.kind === KIND.SITE || node.kind === KIND.AREA || parent.kind === KIND.BLOCK) {
    return Object.freeze({ ok: false, moved: false, reason: 'invalid-move-contract', id: nodeId, parentId, oldParentId });
  }

  const crossParent = oldParentId !== parentId;
  if (crossParent && !(node.kind === KIND.BLOCK && oldParent.kind === KIND.CONTAINER && parent.kind === KIND.CONTAINER)) {
    return Object.freeze({
      ok: false,
      moved: false,
      reason: '00895-cross-parent-block-container-only',
      id: nodeId,
      parentId,
      oldParentId,
      kind: node.kind,
      oldParentKind: oldParent.kind,
      parentKind: parent.kind,
    });
  }

  const oldSiblings = Array.isArray(oldParent.children) ? [...oldParent.children] : [];
  const oldIndex = oldSiblings.indexOf(nodeId);
  if (oldIndex < 0) return Object.freeze({ ok: false, moved: false, reason: 'node-not-in-parent', id: nodeId, parentId, oldParentId });

  const targetSiblings = Array.isArray(parent.children) ? [...parent.children] : [];
  const targetWithoutNode = crossParent ? targetSiblings : targetSiblings.filter((childId) => childId !== nodeId);
  const requested = Number.isInteger(index) ? index : targetWithoutNode.length;
  const nextIndex = Math.max(0, Math.min(requested, targetWithoutNode.length));
  if (!crossParent && nextIndex === oldIndex) {
    return Object.freeze({ ok: true, moved: false, reason: 'same-index', id: nodeId, parentId, oldParentId, oldIndex, newIndex: nextIndex });
  }

  store.beginTransaction(crossParent ? 'site-frame-drag-reparent-block' : 'site-frame-drag-reorder', {
    id: nodeId,
    area: 'main',
    oldParentId,
    parentId,
    oldIndex,
    newIndex: nextIndex,
    kind: node.kind,
    crossParent,
  });
  try {
    store.moveNode(nodeId, parentId, nextIndex);
    store.markTransactionChanges([...new Set([nodeId, oldParentId, parentId])]);
    const transaction = store.commitTransaction({
      id: nodeId,
      area: 'main',
      oldParentId,
      parentId,
      oldIndex,
      newIndex: nextIndex,
      kind: node.kind,
      crossParent,
    });
    renderMainSelectionArea(crossParent ? 'main-drag-reparent-00895' : 'main-drag-reorder-00895');
    persistStore(crossParent ? 'main-drag-reparent-00895' : 'main-drag-reorder-00895');
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason: crossParent ? 'main-drag-reparent-00895' : 'main-drag-reorder-00895' }); } catch {}
    try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: crossParent ? 'main-drag-reparent-00895' : 'main-drag-reorder-00895', area: 'main', id: nodeId, oldParentId, parentId } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('st:site-frame-main-tree-changed', { detail: { action: crossParent ? 'reparent' : 'move', id: nodeId, oldParentId, parentId, oldIndex, newIndex: nextIndex } })); } catch {}
    log(crossParent ? 'main-block-reparented-00895' : 'main-node-moved-00895', {
      id: nodeId,
      oldParentId,
      parentId,
      oldIndex,
      newIndex: nextIndex,
      kind: node.kind,
      crossParent,
      transactionId: transaction.id,
    });
    return Object.freeze({ ok: true, moved: true, id: nodeId, oldParentId, parentId, oldIndex, newIndex: nextIndex, kind: node.kind, crossParent, transactionId: transaction.id });
  } catch (error) {
    store.rollbackTransaction({ message: String(error?.message || error || '') });
    log('main-node-move-error-00895', { id: nodeId, oldParentId, parentId, message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, moved: false, reason: String(error?.message || error || ''), id: nodeId, oldParentId, parentId });
  }
}

function removeSiteFrameNode00892(id) {
  const nodeId = String(id || '').trim();
  if (!nodeId) return Object.freeze({ ok: false, reason: 'missing-node-id', id: '' });

  // Main is already JSON-primary. Header/Footer are hydrated immediately before
  // deletion so the store removes the exact current authored node.
  let node = store.maybeGet(nodeId);
  if (!node || node.area !== 'main') {
    try { hydrateAll({ reason: 'toolbar-delete-hydrate-00892', preserveCommitted: true }); }
    catch (error) { return Object.freeze({ ok: false, reason: String(error?.message || error || ''), id: nodeId }); }
    node = store.maybeGet(nodeId);
  }
  if (!node || node.kind === KIND.SITE || node.kind === KIND.AREA) {
    return Object.freeze({ ok: false, reason: 'invalid-site-frame-node', id: nodeId });
  }
  if (node.area === 'main') return removeMainNode00891(nodeId);

  const area = String(node.area || '');
  if (area !== 'header' && area !== 'footer') {
    return Object.freeze({ ok: false, reason: 'unsupported-area', id: nodeId, area });
  }

  const element = document.querySelector(`[data-sf-id="${cssEscape00892(nodeId)}"], [data-st-node-id="${cssEscape00892(nodeId)}"]`);
  if (!(element instanceof HTMLElement)) {
    return Object.freeze({ ok: false, reason: 'dom-node-not-found', id: nodeId, area });
  }

  const parentId = String(node.parentId || '');
  const kind = node.kind;
  store.beginTransaction('site-frame-toolbar-remove', { id: nodeId, area, parentId, kind });
  try {
    store.removeNode(nodeId);
    store.markTransactionChanges([parentId, store.findArea(area)?.id].filter(Boolean));
    store.commitTransaction({ id: nodeId, area, parentId, kind });

    element.remove();
    const slot = document.querySelector(AREA_ROOTS[area]);
    if (slot instanceof HTMLElement) {
      const hasContent = directStructureChildren(slot).length > 0;
      slot.classList.toggle('is-present', hasContent);
      slot.style.display = hasContent ? 'block' : 'none';
    }

    persistStore('site-frame-toolbar-remove-00892');
    let legacySink = null;
    try {
      legacySink = window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.(
        area,
        'site-frame-toolbar-remove-00892',
        { skipStoreCapture: true }
      ) || null;
    } catch {}
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false }); } catch {}
    try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: null })); } catch {}
    try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: 'site-frame-toolbar-remove-00892', area, id: nodeId } })); } catch {}
    try { window.dispatchEvent(new CustomEvent('st:site-frame-node-removed', { detail: { area, id: nodeId, parentId, kind } })); } catch {}
    log('toolbar-node-removed-00892', { area, id: nodeId, parentId, kind, legacySink: legacySink?.committed === true });
    return Object.freeze({ ok: true, area, id: nodeId, parentId, kind, legacySink: legacySink?.committed === true });
  } catch (error) {
    store.rollbackTransaction({ message: String(error?.message || error || '') });
    log('toolbar-node-remove-error-00892', { area, id: nodeId, message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, reason: String(error?.message || error || ''), area, id: nodeId });
  }
}

function restorePreviousMainArea00888(next, previous) {
  if (!previous?.nodes) return false;
  const previousArea = Object.values(previous.nodes).find((node) => node?.kind === KIND.AREA && node?.area === 'main');
  const nextArea = next.findArea('main');
  if (!previousArea || !nextArea || !Array.isArray(previousArea.children)) return false;

  const copyNode = (id, parentId) => {
    const source = previous.nodes[id];
    if (!source || source.area !== 'main') return false;
    const clone = JSON.parse(JSON.stringify(source));
    clone.parentId = parentId;
    clone.children = Array.isArray(source.children) ? [...source.children] : [];
    next.nodes.set(id, clone);
    clone.children = clone.children.filter((childId) => copyNode(childId, id));
    return true;
  };

  nextArea.children = previousArea.children.filter((childId) => copyNode(childId, nextArea.id));
  // [00892] Even zero children is an authoritative committed Main state.
  return true;
}

function buildStateFromDOM(preserveCommitted = true) {
  const previous = preserveCommitted ? store.toJSON() : null;
  const next = new SiteFrameStore();
  next.version = VERSION;
  // 00950: root metadata is persistent site state too. Previously hydration
  // copied area metadata but silently discarded root-owned contracts such as
  // applied style sync and section-style catalog selections.
  const previousRoot = previous?.nodes?.[previous?.rootId || store.rootId || 'sf_site_root'] || null;
  const nextRoot = next.maybeGet?.(next.rootId || 'sf_site_root') || null;
  if (previousRoot?.meta && nextRoot) {
    nextRoot.meta = JSON.parse(JSON.stringify(previousRoot.meta));
  }

  for (const areaName of Object.keys(AREA_ROOTS)) {
    const areaNode = next.findArea(areaName);
    if (!areaNode) continue;
    const previousAreaNode = previous?.nodes
      ? Object.values(previous.nodes).find((node) => node?.kind === KIND.AREA && node?.area === areaName)
      : null;
    if (previousAreaNode?.meta && typeof previousAreaNode.meta === 'object') {
      areaNode.meta = JSON.parse(JSON.stringify(previousAreaNode.meta));
    }
    areaNode.children = [];

    // Main is JSON-primary. Never recapture it from renderer output when a
    // committed Main tree already exists, otherwise inline template styles and
    // stable IDs would be erased by a DOM hydration pass.
    if (areaName === 'main' && preserveCommitted && restorePreviousMainArea00888(next, previous)) continue;

    const root = document.querySelector(AREA_ROOTS[areaName]);
    if (!isElement(root)) continue;

    let roots = directStructureChildren(root);

    const visit = (element, parentId) => {
      const id = ensureNodeId(element);
      const previousNode = previous?.nodes?.[id] || null;
      const node = nodeFromElement(element, parentId, areaName, previousNode);
      next.nodes.set(node.id, node);
      next.get(parentId).children.push(node.id);
      for (const child of directStructureChildren(element)) visit(child, node.id);
    };

    for (const element of roots) visit(element, areaNode.id);
  }

  next.rebuildTreeMeta();
  return next.toJSON();
}

function ownedNodeIds() {
  return store.all()
    .filter(node => node.meta?.geometry?.widthOwned === true
      || node.meta?.geometry?.heightOwned === true
      || node.meta?.geometry?.gridOwned === true
      || (node.responsive && typeof node.responsive === 'object' && Object.keys(node.responsive).length > 0))
    .map(node => node.id);
}

function currentResponsiveScope00991() {
  return activeContext?.responsiveScope || getResponsiveEditScope00991();
}

function scopeVisualPatches00991(patches = {}, scopeInput = null) {
  const scope = scopeInput || currentResponsiveScope00991();
  if (!scope.scoped) return patches;
  const out = {};
  for (const [id, patch] of Object.entries(patches || {})) {
    const node = store.maybeGet(id);
    if (!node || !patch || typeof patch !== 'object') continue;
    out[id] = scopeVisualPatch00991(node, patch, scope);
  }
  return out;
}

function applyResponsiveTextEditableStyles00991(scopeInput = null) {
  const scope = scopeInput || getResponsiveEditScope00991();
  let applied = 0;
  const area = store.findArea('main');
  if (!area) return applied;
  const visit = (id) => {
    const baseNode = store.maybeGet(id);
    if (!baseNode) return;
    const node = getEffectiveResponsiveNode00991(baseNode, scope) || baseNode;
    if (baseNode.kind === KIND.BLOCK) {
      const owner = document.querySelector(`#st-site-main-slot [data-sf-id="${cssEscape00892(id)}"]`);
      const editable = owner?.querySelector?.('.st-text-edit,[data-st-text-target="1"],[contenteditable="true"],[contenteditable="plaintext-only"]');
      if (editable instanceof HTMLElement) {
        editable.style.cssText = String(node.meta?.textEditableStyle || '');
        applied += 1;
      }
    }
    for (const childId of baseNode.children || []) visit(childId);
  };
  for (const childId of area.children || []) visit(childId);
  return applied;
}

function hydrateAll(options = {}) {
  if (store.hasActiveTransaction()) throw new Error('Cannot hydrate SiteFrameStore during active transaction');
  const state = buildStateFromDOM(options.preserveCommitted !== false);
  store.load(state, { emit: false });
  const ids = ownedNodeIds();
  const rendered = renderer.renderNodes(ids);
  log('hydrated', { nodes: store.all().length, ownedNodes: ids.length, rendered, reason: options.reason || 'explicit' });
  return store.toJSON();
}

function persistStore(reason = 'transaction-commit') {
  const state = store.toJSON();
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {
    log('store-write-error', { reason, message: String(error?.message || error || '') }, 'error');
    throw error;
  }
  log('store-written', { reason, nodes: Object.keys(state.nodes || {}).length, chars: JSON.stringify(state).length });
  return state;
}

function ensureNode(element) {
  const id = ensureNodeId(element);
  if (!store.maybeGet(id)) hydrateAll({ reason: 'ensure-node', preserveCommitted: true });
  const node = store.maybeGet(id);
  if (!node) throw new Error(`SiteFrameStore could not hydrate node: ${id}`);
  return node;
}

function beginTransaction(config = {}) {
  if (store.hasActiveTransaction()) throw new Error('SiteFrame resize transaction already active');
  hydrateAll({ reason: 'transaction-begin', preserveCommitted: true });
  const owner = config.owner;
  const ownerNode = ensureNode(owner);
  const responsiveScope = getResponsiveEditScope00991();
  const transaction = store.beginTransaction(config.type || 'box', {
    area: config.area || areaOf(owner),
    ownerId: ownerNode.id,
    dir: config.dir || '',
    responsiveProfileId: responsiveScope.scoped ? responsiveScope.profileId : '',
    responsiveScoped: responsiveScope.scoped,
  });
  activeContext = {
    id: transaction.id,
    ownerId: ownerNode.id,
    area: config.area || areaOf(owner),
    type: config.type || 'box',
    responsiveScope,
  };
  log('transaction-begin', { id: transaction.id, ownerId: ownerNode.id, area: activeContext.area, type: activeContext.type, responsiveScope: responsiveProfileDescription00991(responsiveScope) });
  return transaction;
}

function previewBox(element, patch = {}) {
  if (!store.hasActiveTransaction()) throw new Error('previewBox requires active SiteFrame transaction');
  const baseNode = ensureNode(element);
  const scope = currentResponsiveScope00991();
  const node = getEffectiveResponsiveNode00991(baseNode, scope) || baseNode;
  const nextBox = { ...(node.box || {}) };
  const geometry = { ...(node.meta?.geometry || {}) };
  const style = { ...(node.style || {}) };

  if (Number.isFinite(Number(patch.width))) {
    nextBox.width = Math.round(Number(patch.width));
    geometry.widthOwned = true;
    if (patch.flexWidth === true) {
      style.flex = `0 0 ${nextBox.width}px`;
      style['flex-basis'] = `${nextBox.width}px`;
    }
  }
  if (Number.isFinite(Number(patch.height))) {
    nextBox.height = Math.round(Number(patch.height));
    geometry.heightOwned = true;
  }

  const desired = {
    box: nextBox,
    style,
    meta: { ...(baseNode.meta || {}), geometry },
  };
  const scopedPatch = scopeVisualPatch00991(baseNode, desired, scope);
  const changedIds = store.updateNodes({ [baseNode.id]: scopedPatch }, { emit: false, rebuildTreeMeta: false });
  store.markTransactionChanges(changedIds);
  renderer.renderNode(baseNode.id, element);
  return changedIds;
}

function previewStyle00991(element, stylePatch = {}) {
  if (!store.hasActiveTransaction()) throw new Error('previewStyle requires active SiteFrame transaction');
  const baseNode = ensureNode(element);
  const scope = currentResponsiveScope00991();
  const node = getEffectiveResponsiveNode00991(baseNode, scope) || baseNode;
  const style = { ...(node.style || {}), ...(stylePatch || {}) };
  const scopedPatch = scopeVisualPatch00991(baseNode, { style }, scope);
  const changedIds = store.updateNodes({ [baseNode.id]: scopedPatch }, { emit: false, rebuildTreeMeta: false });
  store.markTransactionChanges(changedIds);
  renderer.renderNode(baseNode.id, element);
  return changedIds;
}

function previewPair(config = {}) {
  if (!store.hasActiveTransaction()) throw new Error('previewPair requires active SiteFrame transaction');
  const items = Array.isArray(config.items) ? config.items : [];
  const widths = Array.isArray(config.widths) ? config.widths : [];
  const pairIndexes = Array.isArray(config.pairIndexes)
    ? [...new Set(config.pairIndexes.map(Number).filter(index => Number.isInteger(index) && index >= 0 && index < items.length))]
    : [];
  if (pairIndexes.length !== 2) throw new Error('previewPair requires exactly two adjacent pair indexes');
  const [firstIndex, secondIndex] = pairIndexes;
  if (Math.abs(firstIndex - secondIndex) !== 1) throw new Error('previewPair indexes must be adjacent');
  if (widths.length !== items.length || widths.some(width => !Number.isFinite(Number(width)) || Number(width) <= 0)) {
    throw new Error('previewPair requires one positive width for every row item');
  }

  const patches = {};
  const renderTargets = [];
  const scope = currentResponsiveScope00991();

  if (config.type === 'grid-pair') {
    const rowBaseNode = ensureNode(config.row);
    const rowNode = getEffectiveResponsiveNode00991(rowBaseNode, scope) || rowBaseNode;
    patches[rowBaseNode.id] = {
      style: { ...(rowNode.style || {}), 'grid-template-columns': widths.map(width => `${Math.round(width)}px`).join(' ') },
      meta: { ...(rowNode.meta || {}), geometry: { ...(rowNode.meta?.geometry || {}), gridOwned: true } },
    };
    config.row.dataset.sfGridOwned = '1';
    renderTargets.push([rowBaseNode.id, config.row]);
    pairIndexes.forEach((index) => {
      const baseNode = ensureNode(items[index]);
      const node = getEffectiveResponsiveNode00991(baseNode, scope) || baseNode;
      patches[baseNode.id] = { box: { ...(node.box || {}), width: Math.round(widths[index]) } };
    });
  } else if (config.type === 'flex-pair') {
    pairIndexes.forEach((index) => {
      const baseNode = ensureNode(items[index]);
      const node = getEffectiveResponsiveNode00991(baseNode, scope) || baseNode;
      const width = Math.round(widths[index]);
      patches[baseNode.id] = {
        box: { ...(node.box || {}), width },
        style: { ...(node.style || {}), flex: `0 0 ${width}px`, 'flex-basis': `${width}px` },
        meta: { ...(node.meta || {}), geometry: { ...(node.meta?.geometry || {}), widthOwned: true } },
      };
      renderTargets.push([baseNode.id, items[index]]);
    });
  } else {
    throw new Error(`Unsupported SiteFrame pair transaction: ${String(config.type || '')}`);
  }

  const changedIds = store.updateNodes(scopeVisualPatches00991(patches, scope), { emit: false, rebuildTreeMeta: false });
  store.markTransactionChanges(changedIds);
  for (const [nodeId, element] of renderTargets) renderer.renderNode(nodeId, element);
  return changedIds;
}

function commitTransaction(owner, reason = 'resize-end') {
  if (!store.hasActiveTransaction()) throw new Error('No active SiteFrame transaction to commit');
  const area = activeContext?.area || areaOf(owner);
  const result = store.commitTransaction({ reason, area });
  activeContext = null;
  persistStore(reason);

  legacySinkCommit = true;
  let legacyResult = null;
  try {
    legacyResult = window.ST_SITE_FRAME_EXPLICIT_PERSISTENCE_00876?.commitArea?.(area, `site-frame-store:${reason}`, { skipStoreCapture: true }) || null;
  } finally {
    legacySinkCommit = false;
  }

  const detail = Object.freeze({ ...result, area, reason, legacySink: legacyResult?.committed === true });
  try { window.dispatchEvent(new CustomEvent('st:site-frame-transaction-committed', { detail })); } catch {}
  log('transaction-commit', { id: result.id, area, reason, changedIds: result.changedIds, legacySink: detail.legacySink });
  return detail;
}

function captureAreaFromDOM(area, reason = 'external-explicit-action') {
  if (legacySinkCommit || store.hasActiveTransaction()) return Object.freeze({ captured: false, area, reason, cause: 'transaction-or-sink-active' });
  hydrateAll({ reason: `external:${reason}`, preserveCommitted: true });
  persistStore(reason);
  const result = Object.freeze({ captured: true, area, reason, nodes: store.all().filter(node => node.area === area).length });
  log('external-area-captured', result);
  return result;
}
function updateMainTextContent00903(element, reason = 'main-text-content-00904') {
  if (!(element instanceof HTMLElement)) return Object.freeze({ ok: false, reason: 'not-element' });
  const owner = element.closest?.('#st-site-main-slot [data-sf-kind="block"][data-sf-id],#st-site-main-slot .st-block[data-sf-id]');
  if (!(owner instanceof HTMLElement)) return Object.freeze({ ok: false, reason: 'main-owner-not-found' });
  const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
  const node = id ? store.maybeGet(id) : null;
  if (!node || node.area !== 'main' || node.kind !== KIND.BLOCK) return Object.freeze({ ok: false, reason: 'main-store-node-not-found', id });
  const html = String(element.innerHTML ?? '');
  const text = String(element.textContent ?? '');
  const changedIds = store.updateNodes({
    [id]: {
      content: { ...(node.content || {}), html, text },
      meta: { ...(node.meta || {}), textEditable: '00904-main-text-json-primary' },
    },
  }, { emit: false, rebuildTreeMeta: false });
  if (changedIds.length) {
    persistStore(reason);
    // 00903: save the current live root snapshot without rebuilding Main; text local Undo remains delegated.
    // Re-rendering here destroyed the active contenteditable after Space/idle
    // and also replaced the DOM target used by the local text Undo button.
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
  }
  const result = Object.freeze({ ok: true, id, reason, changedIds, area: 'main', jsonPrimary: true, preserveLiveMain: true, textFocusStable: true });
  log('main-text-content-updated-00904', result);
  return result;
}

function commitMainTypography00921(element, reason = 'main-typography-controls-00921') {
  if (!(element instanceof HTMLElement)) return Object.freeze({ ok: false, reason: 'not-element' });
  const editable = element.matches?.('.st-text-edit,[data-st-text-target="1"],[contenteditable="true"],[contenteditable="plaintext-only"]')
    ? element
    : element.querySelector?.('.st-text-edit,[data-st-text-target="1"],[contenteditable="true"],[contenteditable="plaintext-only"]');
  if (!(editable instanceof HTMLElement)) return Object.freeze({ ok: false, reason: 'main-editable-not-found' });
  const owner = editable.closest?.('#st-site-main-slot [data-sf-kind="block"][data-sf-id],#st-site-main-slot .st-block[data-sf-id]');
  if (!(owner instanceof HTMLElement)) return Object.freeze({ ok: false, reason: 'main-owner-not-found' });
  const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
  const node = id ? store.maybeGet(id) : null;
  if (!node || node.area !== 'main' || node.kind !== KIND.BLOCK) return Object.freeze({ ok: false, reason: 'main-store-node-not-found', id });
  const responsiveScope00991 = getResponsiveEditScope00991();
  const effectiveNode00991 = getEffectiveResponsiveNode00991(node, responsiveScope00991) || node;

  const html = String(editable.innerHTML ?? '');
  const text = String(editable.textContent ?? '');
  const textEditableStyle = String(editable.style?.cssText || '').trim();
  const nextContent = { ...(node.content || {}), html, text };
  const nextMeta = {
    ...(node.meta || {}),
    textEditable: '00921-main-typography-json-primary',
    textEditableStyle,
    typographyControls: { stage: '00921-main-typography-controls-json-primary', persisted: true },
  };
  const same = String(node.content?.html ?? '') === html
    && String(node.content?.text ?? '') === text
    && String(effectiveNode00991.meta?.textEditableStyle || '').trim() === textEditableStyle;
  if (same) return Object.freeze({ ok: true, id, reason, changedIds: [], area: 'main', unchanged: true });

  store.beginTransaction('main-typography-controls', { reason, targetIds: [id], stage: '00921' });
  const desiredTypographyPatch00991 = { content: nextContent, meta: nextMeta };
  const changedIds = store.updateNodes({
    [id]: scopeVisualPatch00991(node, desiredTypographyPatch00991, responsiveScope00991),
  }, { emit: false, rebuildTreeMeta: false });
  store.markTransactionChanges(changedIds);
  const transaction = store.commitTransaction({ reason, area: 'main' });
  persistStore(reason);
  try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
  const result = Object.freeze({
    ok: true,
    id,
    reason,
    changedIds,
    area: 'main',
    transactionId: transaction?.id || '',
    jsonPrimary: true,
    preserveLiveMain: true,
    oneCommit: true,
  });
  log('main-typography-controls-committed-00921', result);
  return result;
}



function sanitizeMainClassName00907(className = '') {
  const transient = new Set([
    'is-active','is-selected','hb-dom-active','hb-dom-selected','sf-selection-current','sf-edit-selected',
    'sf-main-drag-source','sf-main-drag-over','sf-main-drag-target','sf-main-drag-placeholder'
  ]);
  return String(className || '').split(/\s+/).filter(Boolean).filter(name => !transient.has(name)).join(' ');
}

function fillDatasetFromElement00907(element) {
  if (!(element instanceof HTMLElement)) return {};
  const out = {};
  const keys = [
    'stFillMode','stFillGalleryItemId','stFillGalleryCat','stFillGalleryFolderId',
    'stFillGalleryUrl','stFillGalleryPath','stFillGalleryName','stFillGallerySource'
  ];
  for (const key of keys) {
    const value = element.dataset?.[key];
    if (value != null && value !== '') out[key] = String(value);
  }
  return out;
}


function mainFrameOwnerForFillTarget00909(target) {
  if (!(target instanceof HTMLElement)) return null;
  const direct = target.matches?.('#st-site-main-slot [data-sf-area="main"][data-sf-kind][data-sf-id],#st-site-main-slot [data-sf-area="main"][data-sf-kind][data-st-node-id]') ? target : null;
  if (direct) return direct;
  return target.closest?.('#st-site-main-slot [data-sf-area="main"][data-sf-kind][data-sf-id],#st-site-main-slot [data-sf-area="main"][data-sf-kind][data-st-node-id]') || null;
}

function collectMainFillPatches00909(targets = []) {
  const patches = {};
  const targetIds = [];
  for (const raw of targets || []) {
    if (!(raw instanceof HTMLElement) || !raw.isConnected || !raw.closest?.('#st-site-main-slot')) continue;
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;

    const styled = raw;
    const style = styleObjectFromElement00888(styled);
    const classNameSource = owner;
    const className = sanitizeMainClassName00907(classNameSource.className || '');
    const fillClassList = new Set(className.split(/\s+/).filter(Boolean));
    if (styled.classList?.contains('st-bgfx')) fillClassList.add('st-bgfx');
    if (styled.classList?.contains('st-bgfx--canvasfixed')) fillClassList.add('st-bgfx--canvasfixed');
    const dataset = fillDatasetFromElement00907(styled);

    patches[id] = {
      style: { ...(node.style || {}), ...style },
      meta: {
        ...(node.meta || {}),
        dom: { ...(node.meta?.dom || {}), className: [...fillClassList].join(' ') },
        fill: {
          ...(node.meta?.fill || {}),
          stage: '00909-main-fill-json-primary-live-raf-quiet',
          persisted: true,
          mode: String(styled.dataset?.stFillMode || ''),
          dataset,
          source: styled === owner ? 'owner' : 'inner-target',
        },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

function fillPatchSignature00909(patches = {}, targetIds = []) {
  const ordered = [...new Set(targetIds || [])].sort();
  return ordered.map(id => `${id}:${JSON.stringify(patches[id] || {})}`).join('|');
}

let pendingMainFillDraft00909 = null;
let lastLiveDraftLogAt00909 = 0;
let liveDraftSuppressedLogCount00909 = 0;
let lastFinalFillCommitSignature00909 = '';
let lastFinalFillCommitAt00909 = 0;
let lastFinalFillCommitTargetSignature00909 = '';

function cssEscape00909(value) {
  const raw = String(value || '');
  try { if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(raw); } catch {}
  return raw.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

function mainFillTargetId00909(target) {
  const owner = mainFrameOwnerForFillTarget00909(target);
  return String(owner?.dataset?.sfId || owner?.dataset?.stNodeId || owner?.dataset?.nodeId || '');
}

function uniqueMainFillTargets00909(targets = []) {
  const seen = new Set();
  const out = [];
  for (const target of targets || []) {
    if (!(target instanceof HTMLElement) || !target.isConnected || !target.closest?.('#st-site-main-slot')) continue;
    const owner = mainFrameOwnerForFillTarget00909(target) || target;
    if (!(owner instanceof HTMLElement) || !owner.isConnected) continue;
    const id = mainFillTargetId00909(owner) || mainFillTargetId00909(target);
    const key = id || `el:${out.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(owner);
  }
  return out;
}

function resolveMainFillTargetById00909(id) {
  const safe = cssEscape00909(id);
  try {
    return document.querySelector(`#st-site-main-slot [data-sf-id="${safe}"], #st-site-main-slot [data-st-node-id="${safe}"], #st-site-main-slot [data-node-id="${safe}"]`);
  } catch {
    return null;
  }
}

function liveTargetsFromDraft00909(draft) {
  const live = [];
  const seen = new Set();
  const add = (el) => {
    if (!(el instanceof HTMLElement) || !el.isConnected || !el.closest?.('#st-site-main-slot')) return;
    const owner = mainFrameOwnerForFillTarget00909(el) || el;
    const id = mainFillTargetId00909(owner) || mainFillTargetId00909(el);
    const key = id || `el:${live.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    live.push(owner);
  };
  for (const el of draft?.targets || []) add(el);
  for (const id of draft?.targetIds || []) add(resolveMainFillTargetById00909(id));
  return live;
}

function syncMainFillDraftStyles00909(targets = [], reason = 'main-fill-draft-style') {
  const mainTargets = uniqueMainFillTargets00909(targets);
  if (!mainTargets.length) return Object.freeze({ ok: false, reason: 'no-main-fill-targets' });
  const targetIds = [...new Set(mainTargets.map(mainFillTargetId00909).filter(Boolean))];
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-fill-targets' });

  // 00909: live ticks are preview-only. Do not collect style patches, stringify
  // JSON, write Store, save root DOM, or write a diagnostic row for every color
  // picker movement. The current DOM already contains the latest visual fill;
  // JSON patches are collected only once on final change or selection-loss flush.
  pendingMainFillDraft00909 = {
    targets: mainTargets,
    targetIds,
    reason,
    at: Date.now(),
    patchCollection: false,
    storeWritten: false,
    rootSaved: false,
  };

  const now = Date.now();
  liveDraftSuppressedLogCount00909 += 1;
  if (!lastLiveDraftLogAt00909 || now - lastLiveDraftLogAt00909 > 2500) {
    const suppressed = Math.max(0, liveDraftSuppressedLogCount00909 - 1);
    liveDraftSuppressedLogCount00909 = 0;
    lastLiveDraftLogAt00909 = now;
    log('main-fill-live-draft-held-00909', {
      ok: true,
      reason,
      targetIds,
      jsonPrimary: true,
      draft: true,
      history: false,
      storeWritten: false,
      rootSaved: false,
      patchCollection: false,
      stringify: false,
      quietLiveLogs: true,
      suppressedLiveTicks: suppressed,
      finalCommitRequired: true,
      selectionLossFlush: true,
    });
  }
  return Object.freeze({ ok: true, changedIds: [], targetIds, draft: true, reason, storeWritten: false, rootSaved: false, patchCollection: false });
}

function commitMainFillStyles00909(targets = [], reason = 'main-fill-style') {
  if (store.hasActiveTransaction()) return syncMainFillDraftStyles00909(targets, `${reason}:active-transaction-draft`);
  const mainTargets = uniqueMainFillTargets00909(targets);
  const { patches, targetIds } = collectMainFillPatches00909(mainTargets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-fill-targets' });
  const signature = fillPatchSignature00909(patches, targetIds);
  const targetSignature = [...new Set(targetIds)].sort().join(',');
  const now = Date.now();
  if ((signature === lastFinalFillCommitSignature00909 && now - lastFinalFillCommitAt00909 < 1200)
      || (targetSignature && targetSignature === lastFinalFillCommitTargetSignature00909 && now - lastFinalFillCommitAt00909 < 120)) {
    pendingMainFillDraft00909 = null;
    log('main-fill-style-duplicate-skipped-00909', { reason, targetIds, jsonPrimary: true, duplicateWindowMs: 1200, liveRafQuiet: true });
    return Object.freeze({ ok: true, changedIds: [], targetIds, duplicate: true, reason });
  }
  lastFinalFillCommitSignature00909 = signature;
  lastFinalFillCommitTargetSignature00909 = targetSignature;
  lastFinalFillCommitAt00909 = now;

  store.beginTransaction('main-fill-style', { reason, targetIds, liveRafQuiet00909: true });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({ reason, targetIds, styleJsonPrimary: true, mainFillPersistence: true, liveRafQuiet00909: true });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    pendingMainFillDraft00909 = null;
    log('main-fill-style-persisted-00909', {
      ok: true,
      reason,
      changedIds,
      targetIds,
      transactionId: result.id,
      jsonPrimary: true,
      themeReady: true,
      liveRafQuiet: true,
      draftWritesSuppressed: true,
      patchCollectionOnlyOnCommit: true,
      quietLiveLogs: true,
      rootSaveBeforeSelectionLoss: true,
      preserveLiveMain: true,
    });
    return Object.freeze({ ok: true, changedIds, targetIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    log('main-fill-style-persist-error-00909', { reason, message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function flushMainFillDraft00909(reason = 'main-fill-draft-flush') {
  const draft = pendingMainFillDraft00909;
  if (!draft || !Array.isArray(draft.targets) || !draft.targets.length) return Object.freeze({ ok: false, reason: 'no-pending-main-fill-draft' });
  const liveTargets = liveTargetsFromDraft00909(draft);
  if (!liveTargets.length) {
    pendingMainFillDraft00909 = null;
    return Object.freeze({ ok: false, reason: 'pending-main-fill-targets-disconnected' });
  }
  return commitMainFillStyles00909(liveTargets, reason);
}

function installMainFillPersistence00909() {
  if (window.__ST_MAIN_FILL_PERSISTENCE_00909__) return true;
  window.__ST_MAIN_FILL_PERSISTENCE_00909__ = true;
  let lastEventSignature = '';
  let lastEventAt = 0;
  let pendingLiveEvent = null;
  let pendingLiveRaf = 0;

  const runFillEvent00909 = (event, live = false) => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) && detail.targets.length ? detail.targets : (detail.target ? [detail.target] : []);
    const mainTargets = uniqueMainFillTargets00909(rawTargets);
    if (!mainTargets.length) return;
    const ids = mainTargets.map(mainFillTargetId00909).filter(Boolean).sort().join(',');
    const signature = `${live ? 'live' : 'final'}|${String(detail.reason || 'applied')}|${String(detail.mode || '')}|${ids}`;
    const now = Date.now();
    const duplicateWindow = live ? 140 : 280;
    if (signature === lastEventSignature && now - lastEventAt < duplicateWindow) return;
    lastEventSignature = signature;
    lastEventAt = now;
    if (live) syncMainFillDraftStyles00909(mainTargets, `fill-widget-live:${String(detail.reason || 'live')}`);
    else commitMainFillStyles00909(mainTargets, `fill-widget:${String(detail.reason || 'applied')}`);
  };

  const handleFillEvent = (event, live = false) => {
    if (!live) return runFillEvent00909(event, false);
    pendingLiveEvent = event;
    if (pendingLiveRaf) return;
    pendingLiveRaf = requestAnimationFrame(() => {
      pendingLiveRaf = 0;
      const ev = pendingLiveEvent;
      pendingLiveEvent = null;
      runFillEvent00909(ev, true);
    });
  };

  const appliedHandler = event => handleFillEvent(event, false);
  const liveHandler = event => handleFillEvent(event, true);
  window.addEventListener('st:fill-widget:applied', appliedHandler, true);
  window.addEventListener('st:fill-widget:live-applied', liveHandler, true);
  document.addEventListener('pointerdown', event => {
    if (!pendingMainFillDraft00909) return;
    const target = event?.target;
    const insideMain = target instanceof HTMLElement && target.closest?.('#st-site-main-slot');
    const insideColorControl = target instanceof HTMLElement && (target.matches?.('input[type="color"],input[data-fill],button[data-fill-mode]') || target.closest?.('.design-fill-row,.design-fill-modes,[data-fill-group]'));
    if (insideColorControl) return;
    if (!insideMain) flushMainFillDraft00909('main-fill-selection-loss-flush-00909');
  }, true);
  window.addEventListener('beforeunload', () => { try { flushMainFillDraft00909('main-fill-beforeunload-flush-00909'); } catch {} }, true);
  log('main-fill-live-raf-quiet-installed-00909', {
    events: ['st:fill-widget:live-applied', 'st:fill-widget:applied'],
    liveDraftSync: true,
    liveStoreWrites: false,
    liveRootSaves: false,
    livePatchCollection: false,
    liveJsonStringify: false,
    liveRafCoalesced: true,
    quietLiveLogs: true,
    finalCommit: true,
    selectionLossFlush: true,
    mainFillStyleJsonPrimary: true,
    themeReady: true,
    observers: 0,
    timers: 0,
    retryLoops: 0,
  });
  return true;
}


function collectMainRadiusPatches00911(targets = []) {
  const patches = {};
  const targetIds = [];
  const radiusProps = [
    'border-top-left-radius',
    'border-top-right-radius',
    'border-bottom-right-radius',
    'border-bottom-left-radius',
    'border-radius',
  ];
  for (const raw of targets || []) {
    if (!(raw instanceof HTMLElement) || !raw.isConnected || !raw.closest?.('#st-site-main-slot')) continue;
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;

    const stylePatch = {};
    for (const prop of radiusProps) {
      const inline = raw.style.getPropertyValue(prop);
      if (inline != null && inline !== '') stylePatch[prop] = String(inline).trim();
    }
    // Some paths set the camel-case property, while styleObject reads kebab-case.
    const camel = {
      'border-top-left-radius': raw.style.borderTopLeftRadius,
      'border-top-right-radius': raw.style.borderTopRightRadius,
      'border-bottom-right-radius': raw.style.borderBottomRightRadius,
      'border-bottom-left-radius': raw.style.borderBottomLeftRadius,
    };
    for (const [prop, value] of Object.entries(camel)) {
      if (value != null && String(value).trim()) stylePatch[prop] = String(value).trim();
    }
    if (!Object.keys(stylePatch).length) continue;

    patches[id] = {
      style: { ...(node.style || {}), ...stylePatch },
      meta: {
        ...(node.meta || {}),
        radius: {
          ...(node.meta?.radius || {}),
          stage: '00911-main-radius-json-primary-live-raf-quiet',
          persisted: true,
          source: raw === owner ? 'owner' : 'inner-target',
        },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

function radiusPatchSignature00911(patches = {}, targetIds = []) {
  const ordered = [...new Set(targetIds || [])].sort();
  return ordered.map(id => `${id}:${JSON.stringify(patches[id] || {})}`).join('|');
}

let pendingMainRadiusDraft00911 = null;
let lastRadiusLiveLogAt00911 = 0;
let radiusLiveSuppressedLogCount00911 = 0;
let lastFinalRadiusCommitSignature00911 = '';
let lastFinalRadiusCommitAt00911 = 0;
let lastFinalRadiusTargetSignature00911 = '';

function mainRadiusTargetId00911(target) {
  const owner = mainFrameOwnerForFillTarget00909(target);
  return String(owner?.dataset?.sfId || owner?.dataset?.stNodeId || owner?.dataset?.nodeId || '');
}

function uniqueMainRadiusTargets00911(targets = []) {
  const seen = new Set();
  const out = [];
  for (const target of targets || []) {
    if (!(target instanceof HTMLElement) || !target.isConnected || !target.closest?.('#st-site-main-slot')) continue;
    const owner = mainFrameOwnerForFillTarget00909(target) || target;
    if (!(owner instanceof HTMLElement) || !owner.isConnected) continue;
    const id = mainRadiusTargetId00911(owner) || mainRadiusTargetId00911(target);
    const key = id || `el:${out.length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(owner);
  }
  return out;
}

function resolveMainRadiusTargetById00911(id) {
  const safe = cssEscape00909(id);
  try {
    return document.querySelector(`#st-site-main-slot [data-sf-id="${safe}"], #st-site-main-slot [data-st-node-id="${safe}"], #st-site-main-slot [data-node-id="${safe}"]`);
  } catch { return null; }
}

function liveTargetsFromRadiusDraft00911(draft) {
  const out = [];
  const seen = new Set();
  const add = (el) => {
    if (!(el instanceof HTMLElement) || !el.isConnected || !el.closest?.('#st-site-main-slot')) return;
    const owner = mainFrameOwnerForFillTarget00909(el) || el;
    const id = mainRadiusTargetId00911(owner) || mainRadiusTargetId00911(el);
    const key = id || `el:${out.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(owner);
  };
  for (const id of draft?.targetIds || []) add(resolveMainRadiusTargetById00911(id));
  for (const el of draft?.targets || []) add(el);
  return out;
}

function syncMainRadiusDraftStyles00911(targets = [], reason = 'main-radius-draft-style') {
  const mainTargets = uniqueMainRadiusTargets00911(targets);
  if (!mainTargets.length) return Object.freeze({ ok: false, reason: 'no-main-radius-targets' });
  const targetIds = [...new Set(mainTargets.map(mainRadiusTargetId00911).filter(Boolean))];
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-radius-targets' });

  pendingMainRadiusDraft00911 = {
    targetIds,
    targets: mainTargets,
    reason,
    createdAt: Date.now(),
  };

  radiusLiveSuppressedLogCount00911 += 1;
  const now = Date.now();
  if (!lastRadiusLiveLogAt00911 || now - lastRadiusLiveLogAt00911 > 2500) {
    const suppressed = Math.max(0, radiusLiveSuppressedLogCount00911 - 1);
    radiusLiveSuppressedLogCount00911 = 0;
    lastRadiusLiveLogAt00911 = now;
    log('main-radius-live-draft-held-00911', {
      reason,
      targetIds,
      suppressed,
      storeWritten: false,
      rootSaved: false,
      patchCollection: false,
      liveRafCoalesced: true,
      quietLiveLogs: true,
    });
  }
  return Object.freeze({ ok: true, changedIds: [], targetIds, draft: true, reason, storeWritten: false, rootSaved: false, patchCollection: false });
}

function commitMainRadiusStyles00911(targets = [], reason = 'main-radius-style') {
  if (store.hasActiveTransaction()) return syncMainRadiusDraftStyles00911(targets, `${reason}:active-transaction-draft`);
  const mainTargets = uniqueMainRadiusTargets00911(targets);
  const { patches, targetIds } = collectMainRadiusPatches00911(mainTargets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-radius-targets' });
  const signature = radiusPatchSignature00911(patches, targetIds);
  const targetSignature = [...new Set(targetIds)].sort().join(',');
  const now = Date.now();
  if ((signature === lastFinalRadiusCommitSignature00911 && now - lastFinalRadiusCommitAt00911 < 1200)
      || (targetSignature && targetSignature === lastFinalRadiusTargetSignature00911 && now - lastFinalRadiusCommitAt00911 < 120)) {
    pendingMainRadiusDraft00911 = null;
    log('main-radius-style-duplicate-skipped-00911', { reason, targetIds, jsonPrimary: true, duplicateWindowMs: 1200, liveRafQuiet: true });
    return Object.freeze({ ok: true, changedIds: [], targetIds, duplicate: true, reason });
  }
  lastFinalRadiusCommitSignature00911 = signature;
  lastFinalRadiusTargetSignature00911 = targetSignature;
  lastFinalRadiusCommitAt00911 = now;

  store.beginTransaction('main-radius-style', { reason, targetIds, liveRafQuiet00911: true });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({ reason, targetIds, styleJsonPrimary: true, mainRadiusPersistence: true, liveRafQuiet00911: true });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    pendingMainRadiusDraft00911 = null;
    log('main-radius-style-persisted-00911', {
      ok: true,
      reason,
      changedIds,
      targetIds,
      transactionId: result.id,
      jsonPrimary: true,
      liveRafQuiet: true,
      draftWritesSuppressed: true,
      patchCollectionOnlyOnCommit: true,
      quietLiveLogs: true,
      preserveLiveMain: true,
    });
    return Object.freeze({ ok: true, changedIds, targetIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    log('main-radius-style-persist-error-00911', { reason, message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function flushMainRadiusDraft00911(reason = 'main-radius-draft-flush') {
  const draft = pendingMainRadiusDraft00911;
  if (!draft || !Array.isArray(draft.targets) || !draft.targets.length) return Object.freeze({ ok: false, reason: 'no-pending-main-radius-draft' });
  const liveTargets = liveTargetsFromRadiusDraft00911(draft);
  if (!liveTargets.length) {
    pendingMainRadiusDraft00911 = null;
    return Object.freeze({ ok: false, reason: 'pending-main-radius-targets-disconnected' });
  }
  return commitMainRadiusStyles00911(liveTargets, reason);
}

function installMainRadiusPersistence00911() {
  if (window.__ST_MAIN_RADIUS_PERSISTENCE_00911__) return true;
  window.__ST_MAIN_RADIUS_PERSISTENCE_00911__ = true;
  let lastEventSignature = '';
  let lastEventAt = 0;
  let pendingLiveEvent = null;
  let pendingLiveRaf = 0;

  const runRadiusEvent00911 = (event, live = false) => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) && detail.targets.length ? detail.targets : (detail.target ? [detail.target] : []);
    const mainTargets = uniqueMainRadiusTargets00911(rawTargets);
    if (!mainTargets.length) return;
    const ids = mainTargets.map(mainRadiusTargetId00911).filter(Boolean).sort().join(',');
    const state = detail.radiusState || {};
    const corners = state.corners || {};
    const signature = `${live ? 'live' : 'final'}|${String(detail.reason || 'applied')}|${String(state.radius || '')}|${JSON.stringify(corners)}|${ids}`;
    const now = Date.now();
    const duplicateWindow = live ? 140 : 280;
    if (signature === lastEventSignature && now - lastEventAt < duplicateWindow) return;
    lastEventSignature = signature;
    lastEventAt = now;
    if (live) syncMainRadiusDraftStyles00911(mainTargets, `border-radius-widget-live:${String(detail.reason || 'live')}`);
    else commitMainRadiusStyles00911(mainTargets, `border-radius-widget:${String(detail.reason || 'applied')}`);
  };

  const handleRadiusEvent = (event, live = false) => {
    if (!live) return runRadiusEvent00911(event, false);
    pendingLiveEvent = event;
    if (pendingLiveRaf) return;
    pendingLiveRaf = requestAnimationFrame(() => {
      pendingLiveRaf = 0;
      const ev = pendingLiveEvent;
      pendingLiveEvent = null;
      runRadiusEvent00911(ev, true);
    });
  };

  window.addEventListener('st:border-radius-widget:applied', event => handleRadiusEvent(event, false), true);
  window.addEventListener('st:border-radius-widget:live-applied', event => handleRadiusEvent(event, true), true);
  document.addEventListener('pointerdown', event => {
    if (!pendingMainRadiusDraft00911) return;
    const target = event?.target;
    const insideMain = target instanceof HTMLElement && target.closest?.('#st-site-main-slot');
    const insideRadiusControl = target instanceof HTMLElement && (target.matches?.('[data-radius-slider],[data-radius-input],[data-radius-corner],[data-radius-preset]') || target.closest?.('[data-border-radius-root],.design-radius-main-row,.design-radius-corners-grid,.design-border-subsection[data-border-subsection-id="radius"]'));
    if (insideRadiusControl) return;
    if (!insideMain) flushMainRadiusDraft00911('main-radius-selection-loss-flush-00911');
  }, true);
  window.addEventListener('beforeunload', () => { try { flushMainRadiusDraft00911('main-radius-beforeunload-flush-00911'); } catch {} }, true);
  log('main-radius-live-raf-quiet-installed-00911', {
    events: ['st:border-radius-widget:live-applied', 'st:border-radius-widget:applied'],
    liveDraftSync: true,
    liveStoreWrites: false,
    liveRootSaves: false,
    livePatchCollection: false,
    liveJsonStringify: false,
    liveRafCoalesced: true,
    quietLiveLogs: true,
    finalCommit: true,
    selectionLossFlush: true,
    mainRadiusStyleJsonPrimary: true,
    observers: 0,
    timers: 0,
    retryLoops: 0,
  });
  return true;
}

function collectMainBorderColorPatches00911(targets = []) {
  const patches = {};
  const targetIds = [];
  const colorProps = [
    'border-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'border-image-source',
    'border-image-slice',
    'border-image-repeat',
    'border-image-width',
    'border-image-outset',
    '--site-block-brd',
  ];
  for (const raw of targets || []) {
    if (!(raw instanceof HTMLElement) || !raw.isConnected || !raw.closest?.('#st-site-main-slot')) continue;
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;

    const stylePatch = {};
    for (const prop of colorProps) {
      const inline = raw.style.getPropertyValue(prop);
      if (inline != null && String(inline).trim() !== '') stylePatch[prop] = String(inline).trim();
    }
    const camel = {
      'border-color': raw.style.borderColor,
      'border-image-source': raw.style.borderImageSource,
      'border-image-slice': raw.style.borderImageSlice,
      'border-image-repeat': raw.style.borderImageRepeat,
    };
    for (const [prop, value] of Object.entries(camel)) {
      if (value != null && String(value).trim()) stylePatch[prop] = String(value).trim();
    }
    if (!Object.keys(stylePatch).length) continue;

    patches[id] = {
      style: { ...(node.style || {}), ...stylePatch },
      meta: {
        ...(node.meta || {}),
        borderColor: {
          ...(node.meta?.borderColor || {}),
          stage: '00911-main-border-color-json-primary-live-raf-quiet',
          persisted: true,
          source: raw === owner ? 'owner' : 'inner-target',
        },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

function borderColorPatchSignature00911(patches = {}, targetIds = []) {
  const ordered = [...new Set(targetIds || [])].sort();
  return ordered.map(id => `${id}:${JSON.stringify(patches[id] || {})}`).join('|');
}

let pendingMainBorderColorDraft00911 = null;
let lastBorderColorLiveLogAt00911 = 0;
let borderColorLiveSuppressedLogCount00911 = 0;
let lastFinalBorderColorCommitSignature00911 = '';
let lastFinalBorderColorCommitAt00911 = 0;

function uniqueMainBorderColorTargets00911(targets = []) {
  return uniqueMainRadiusTargets00911(targets);
}

function liveTargetsFromBorderColorDraft00911(draft) {
  const out = [];
  const seen = new Set();
  const add = (el) => {
    if (!(el instanceof HTMLElement) || !el.isConnected || !el.closest?.('#st-site-main-slot')) return;
    const owner = mainFrameOwnerForFillTarget00909(el) || el;
    const id = mainRadiusTargetId00911(owner) || mainRadiusTargetId00911(el);
    const key = id || `el:${out.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(owner);
  };
  for (const id of draft?.targetIds || []) add(resolveMainRadiusTargetById00911(id));
  for (const el of draft?.targets || []) add(el);
  return out;
}

function syncMainBorderColorDraftStyles00911(targets = [], reason = 'main-border-color-draft-style') {
  const mainTargets = uniqueMainBorderColorTargets00911(targets);
  if (!mainTargets.length) return Object.freeze({ ok: false, reason: 'no-main-border-color-targets' });
  const targetIds = [...new Set(mainTargets.map(mainRadiusTargetId00911).filter(Boolean))];
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-border-color-targets' });

  pendingMainBorderColorDraft00911 = {
    targetIds,
    targets: mainTargets,
    reason,
    createdAt: Date.now(),
  };

  borderColorLiveSuppressedLogCount00911 += 1;
  const now = Date.now();
  if (!lastBorderColorLiveLogAt00911 || now - lastBorderColorLiveLogAt00911 > 2500) {
    const suppressed = Math.max(0, borderColorLiveSuppressedLogCount00911 - 1);
    borderColorLiveSuppressedLogCount00911 = 0;
    lastBorderColorLiveLogAt00911 = now;
    log('main-border-color-live-draft-held-00911', {
      reason,
      targetIds,
      suppressed,
      storeWritten: false,
      rootSaved: false,
      patchCollection: false,
      liveRafCoalesced: true,
      quietLiveLogs: true,
    });
  }
  return Object.freeze({ ok: true, changedIds: [], targetIds, draft: true, reason, storeWritten: false, rootSaved: false, patchCollection: false });
}

function commitMainBorderColorStyles00911(targets = [], reason = 'main-border-color-style') {
  if (store.hasActiveTransaction()) return syncMainBorderColorDraftStyles00911(targets, `${reason}:active-transaction-draft`);
  const mainTargets = uniqueMainBorderColorTargets00911(targets);
  const { patches, targetIds } = collectMainBorderColorPatches00911(mainTargets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-border-color-targets' });
  const signature = borderColorPatchSignature00911(patches, targetIds);
  const now = Date.now();
  if (signature === lastFinalBorderColorCommitSignature00911 && now - lastFinalBorderColorCommitAt00911 < 900) {
    pendingMainBorderColorDraft00911 = null;
    log('main-border-color-style-duplicate-skipped-00911', { reason, targetIds, jsonPrimary: true, duplicateWindowMs: 1600, liveRafQuiet: true });
    return Object.freeze({ ok: true, changedIds: [], targetIds, duplicate: true, reason });
  }
  lastFinalBorderColorCommitSignature00911 = signature;
  lastFinalBorderColorCommitAt00911 = now;

  store.beginTransaction('main-border-color-style', { reason, targetIds, liveRafQuiet00911: true });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({ reason, targetIds, styleJsonPrimary: true, mainBorderColorPersistence: true, liveRafQuiet00911: true });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    pendingMainBorderColorDraft00911 = null;
    log('main-border-color-style-persisted-00911', {
      ok: true,
      reason,
      changedIds,
      targetIds,
      transactionId: result.id,
      jsonPrimary: true,
      liveRafQuiet: true,
      draftWritesSuppressed: true,
      patchCollectionOnlyOnCommit: true,
      quietLiveLogs: true,
      preserveLiveMain: true,
    });
    return Object.freeze({ ok: true, changedIds, targetIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    log('main-border-color-style-persist-error-00911', { reason, message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function flushMainBorderColorDraft00911(reason = 'main-border-color-draft-flush') {
  const draft = pendingMainBorderColorDraft00911;
  if (!draft || !Array.isArray(draft.targets) || !draft.targets.length) return Object.freeze({ ok: false, reason: 'no-pending-main-border-color-draft' });
  const liveTargets = liveTargetsFromBorderColorDraft00911(draft);
  if (!liveTargets.length) {
    pendingMainBorderColorDraft00911 = null;
    return Object.freeze({ ok: false, reason: 'pending-main-border-color-targets-disconnected' });
  }
  return commitMainBorderColorStyles00911(liveTargets, reason);
}

function installMainBorderColorPersistence00911() {
  if (window.__ST_MAIN_BORDER_COLOR_PERSISTENCE_00911__) return true;
  window.__ST_MAIN_BORDER_COLOR_PERSISTENCE_00911__ = true;
  let lastEventSignature = '';
  let lastEventAt = 0;
  let pendingLiveEvent = null;
  let pendingLiveRaf = 0;

  const runBorderColorEvent00911 = (event, live = false) => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) && detail.targets.length ? detail.targets : (detail.target ? [detail.target] : []);
    const mainTargets = uniqueMainBorderColorTargets00911(rawTargets);
    if (!mainTargets.length) return;
    const ids = mainTargets.map(mainRadiusTargetId00911).filter(Boolean).sort().join(',');
    const state = detail.colorState || {};
    const signature = `${live ? 'live' : 'final'}|${String(detail.reason || 'applied')}|${JSON.stringify(state)}|${ids}`;
    const now = Date.now();
    const duplicateWindow = live ? 140 : 280;
    if (signature === lastEventSignature && now - lastEventAt < duplicateWindow) return;
    lastEventSignature = signature;
    lastEventAt = now;
    if (live) syncMainBorderColorDraftStyles00911(mainTargets, `border-color-widget-live:${String(detail.reason || 'live')}`);
    else commitMainBorderColorStyles00911(mainTargets, `border-color-widget:${String(detail.reason || 'applied')}`);
  };

  const handleBorderColorEvent = (event, live = false) => {
    if (!live) return runBorderColorEvent00911(event, false);
    pendingLiveEvent = event;
    if (pendingLiveRaf) return;
    pendingLiveRaf = requestAnimationFrame(() => {
      pendingLiveRaf = 0;
      const ev = pendingLiveEvent;
      pendingLiveEvent = null;
      runBorderColorEvent00911(ev, true);
    });
  };

  window.addEventListener('st:border-color-widget:applied', event => handleBorderColorEvent(event, false), true);
  window.addEventListener('st:border-color-widget:live-applied', event => handleBorderColorEvent(event, true), true);
  document.addEventListener('pointerdown', event => {
    if (!pendingMainBorderColorDraft00911) return;
    const target = event?.target;
    const insideMain = target instanceof HTMLElement && target.closest?.('#st-site-main-slot');
    const insideColorControl = target instanceof HTMLElement && (target.matches?.('input[type="color"],[data-color-solid-picker],[data-color-solid-input],[data-color-grad1],[data-color-grad2],[data-color-grad-split],[data-color-grad-blend],[data-color-opacity],[data-color-desaturate],[data-color-mode]') || target.closest?.('[data-border-color-root],.design-border-subsection[data-border-subsection-id="glow"],.color-solid-row,.color-gradient-colors,.color-gradient-split,.color-gradient-blend,.color-sliders'));
    if (insideColorControl) return;
    if (!insideMain) flushMainBorderColorDraft00911('main-border-color-selection-loss-flush-00911');
  }, true);
  window.addEventListener('beforeunload', () => { try { flushMainBorderColorDraft00911('main-border-color-beforeunload-flush-00911'); } catch {} }, true);
  log('main-border-color-live-raf-quiet-installed-00911', {
    events: ['st:border-color-widget:live-applied', 'st:border-color-widget:applied'],
    liveDraftSync: true,
    liveStoreWrites: false,
    liveRootSaves: false,
    livePatchCollection: false,
    liveJsonStringify: false,
    liveRafCoalesced: true,
    quietLiveLogs: true,
    finalCommit: true,
    selectionLossFlush: true,
    mainBorderColorStyleJsonPrimary: true,
    observers: 0,
    timers: 0,
    retryLoops: 0,
  });
  return true;
}

const MAIN_BORDER_PROPS_00915 = Object.freeze([
  'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-style', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-image-source', 'border-image-slice', 'border-image-repeat', '--site-block-brd',
]);
const MAIN_BORDER_CLASSES_00915 = Object.freeze([
  'st-border-off', 'st-border-wavy', 'st-border-dashdot', 'st-border-big-dots', 'st-border-star-line',
]);
let pendingMainBorderDraft00915 = null;
let lastMainBorderCommit00915 = Object.seal({ signature: '', at: 0 });

function collectMainBorderPatches00915(targets = []) {
  const patches = {};
  const targetIds = [];
  for (const raw of uniqueMainRadiusTargets00911(targets)) {
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;
    const style = {};
    for (const prop of MAIN_BORDER_PROPS_00915) style[prop] = String(raw.style.getPropertyValue(prop) || '').trim();
    const classes = new Set(String(node.meta?.dom?.className || owner.className || '').split(/\s+/).filter(Boolean));
    for (const name of MAIN_BORDER_CLASSES_00915) raw.classList.contains(name) ? classes.add(name) : classes.delete(name);
    patches[id] = {
      style: { ...(node.style || {}), ...style },
      meta: {
        ...(node.meta || {}),
        dom: { ...(node.meta?.dom || {}), className: [...classes].join(' ') },
        borderControls: { stage: '00915-main-border-controls-json-primary', persisted: true },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

function syncMainBorderDraft00915(targets = [], reason = 'main-border-live-00915') {
  const mainTargets = uniqueMainRadiusTargets00911(targets);
  const targetIds = [...new Set(mainTargets.map(mainRadiusTargetId00911).filter(Boolean))];
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-border-targets' });
  pendingMainBorderDraft00915 = { targets: mainTargets, targetIds, reason };
  return Object.freeze({ ok: true, draft: true, targetIds, storeWritten: false, rootSaved: false });
}

function commitMainBorderControls00915(targets = [], reason = 'main-border-controls-00915') {
  if (store.hasActiveTransaction()) return syncMainBorderDraft00915(targets, `${reason}:active-transaction-draft`);
  const { patches, targetIds } = collectMainBorderPatches00915(targets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-border-targets' });
  const signature = [...targetIds].sort().map(id => `${id}:${JSON.stringify(patches[id] || {})}`).join('|');
  const now = Date.now();
  if (signature === lastMainBorderCommit00915.signature && now - lastMainBorderCommit00915.at < 1200) {
    pendingMainBorderDraft00915 = null;
    return Object.freeze({ ok: true, duplicate: true, targetIds, changedIds: [] });
  }
  lastMainBorderCommit00915.signature = signature;
  lastMainBorderCommit00915.at = now;
  store.beginTransaction('main-border-controls', { reason, targetIds, stage: '00915' });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({ reason, targetIds, styleJsonPrimary: true, mainBorderControlsPersistence: true });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    pendingMainBorderDraft00915 = null;
    log('main-border-controls-persisted-00915', { reason, targetIds, changedIds, transactionId: result.id, jsonPrimary: true });
    return Object.freeze({ ok: true, targetIds, changedIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function flushMainBorderDraft00915(reason = 'main-border-draft-flush-00915') {
  const targets = pendingMainBorderDraft00915?.targets?.filter(el => el instanceof HTMLElement && el.isConnected) || [];
  if (!targets.length) {
    pendingMainBorderDraft00915 = null;
    return Object.freeze({ ok: false, reason: 'no-pending-main-border-draft' });
  }
  return commitMainBorderControls00915(targets, reason);
}

function installMainBorderControlsPersistence00915() {
  if (window.__ST_MAIN_BORDER_CONTROLS_PERSISTENCE_00915__) return true;
  window.__ST_MAIN_BORDER_CONTROLS_PERSISTENCE_00915__ = true;
  let liveEvent = null;
  let liveRaf = 0;
  const run = (event, live) => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) ? detail.targets : (detail.target ? [detail.target] : []);
    const targets = uniqueMainRadiusTargets00911(rawTargets);
    if (!targets.length) return;
    if (live) syncMainBorderDraft00915(targets, `border-controls-widget-live:${String(detail.reason || 'live')}`);
    else commitMainBorderControls00915(targets, `border-controls-widget:${String(detail.reason || 'applied')}`);
  };
  window.addEventListener('st:border-controls-widget:applied', event => run(event, false), true);
  window.addEventListener('st:border-controls-widget:live-applied', event => {
    liveEvent = event;
    if (liveRaf) return;
    liveRaf = requestAnimationFrame(() => {
      liveRaf = 0;
      const eventToRun = liveEvent;
      liveEvent = null;
      run(eventToRun, true);
    });
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!pendingMainBorderDraft00915) return;
    const target = event?.target;
    const insideControl = target instanceof HTMLElement && target.closest?.('[data-border-lines-root],[data-border-style-root],[data-border-thickness-range],[data-border-thickness-input]');
    const insideMain = target instanceof HTMLElement && target.closest?.('#st-site-main-slot');
    if (!insideControl && !insideMain) flushMainBorderDraft00915('main-border-selection-loss-flush-00915');
  }, true);
  window.addEventListener('beforeunload', () => { try { flushMainBorderDraft00915('main-border-beforeunload-flush-00915'); } catch {} }, true);
  log('main-border-controls-parity-installed-00915', {
    controls: ['mode', 'preset-width', 'custom-width', 'sides', 'style'],
    liveRafCoalesced: true, liveStoreWrites: false, liveRootSaves: false,
    finalCommit: true, oneStepPerCommittedTransaction: true, jsonPrimary: true,
    observers: 0, timers: 0, retryLoops: 0,
  });
  return true;
}

const MAIN_LAYER_STYLE_PROPS_00918 = Object.freeze(['position', 'z-index', 'overflow']);
const MAIN_LAYER_DATASETS_00918 = Object.freeze([
  ['stLockToParent', 'stLockToParent'],
  ['stBorderLayerMode', 'stBorderLayerMode'],
  ['stParentAutoGrowFrozen', 'stParentAutoGrowFrozen'],
]);

function collectMainLayerPatches00918(targets = []) {
  const patches = {};
  const targetIds = [];
  for (const raw of uniqueMainRadiusTargets00911(targets)) {
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;
    const style = { ...(node.style || {}) };
    for (const prop of MAIN_LAYER_STYLE_PROPS_00918) {
      style[prop] = String(raw.style.getPropertyValue(prop) || '').trim();
    }
    const authoredDataset = { ...(node.meta?.dom?.dataset || {}) };
    for (const [domKey, jsonKey] of MAIN_LAYER_DATASETS_00918) {
      const value = String(raw.dataset?.[domKey] || '').trim();
      if (value) authoredDataset[jsonKey] = value;
      else delete authoredDataset[jsonKey];
    }
    patches[id] = {
      style,
      meta: {
        ...(node.meta || {}),
        dom: { ...(node.meta?.dom || {}), dataset: authoredDataset },
        layersBoundaries: { stage: '00918-main-layers-boundaries-json-primary', persisted: true },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

function commitMainLayers00918(targets = [], reason = 'main-layers-boundaries-00918') {
  if (store.hasActiveTransaction()) {
    return Object.freeze({ ok: false, reason: 'active-site-frame-transaction' });
  }
  const { patches, targetIds } = collectMainLayerPatches00918(targets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-layer-targets' });
  store.beginTransaction('main-layers-boundaries', { reason, targetIds, stage: '00918' });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({
      reason,
      targetIds,
      styleJsonPrimary: true,
      mainLayersBoundariesPersistence: true,
    });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    log('main-layers-boundaries-persisted-00918', {
      reason, targetIds, changedIds, transactionId: result.id, jsonPrimary: true,
    });
    return Object.freeze({ ok: true, targetIds, changedIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function installMainLayersPersistence00918() {
  if (window.__ST_MAIN_LAYERS_PERSISTENCE_00918__) return true;
  window.__ST_MAIN_LAYERS_PERSISTENCE_00918__ = true;
  window.addEventListener('st:layers-widget:applied', event => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) ? detail.targets : (detail.target ? [detail.target] : []);
    commitMainLayers00918(rawTargets, `layers-widget:${String(detail.reason || 'applied-00918')}`);
  }, true);
  log('main-layers-boundaries-parity-installed-00918', {
    event: 'st:layers-widget:applied',
    finalCommit: true,
    storeAuthority: true,
    rootSavePerAction: 1,
    observers: 0,
    timers: 0,
    retryLoops: 0,
  });
  return true;
}

const MAIN_SPACING_STYLE_PROPS_00919 = Object.freeze([
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'column-gap', 'row-gap', 'width',
  '--site-gap', '--site-gap-x', '--site-gap-y',
]);

function collectMainSpacingPatches00919(targets = []) {
  const patches = {};
  const targetIds = [];
  for (const raw of uniqueMainRadiusTargets00911(targets)) {
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;
    const style = { ...(node.style || {}) };
    for (const prop of MAIN_SPACING_STYLE_PROPS_00919) {
      style[prop] = String(raw.style.getPropertyValue(prop) || '').trim();
    }
    const authoredDataset = { ...(node.meta?.dom?.dataset || {}) };
    const gapManaged = String(raw.dataset?.stGapManaged || '').trim();
    if (gapManaged) authoredDataset.stGapManaged = gapManaged;
    else delete authoredDataset.stGapManaged;
    patches[id] = {
      style,
      meta: {
        ...(node.meta || {}),
        dom: { ...(node.meta?.dom || {}), dataset: authoredDataset },
        spacingControls: { stage: '00919-main-spacing-controls-json-primary', persisted: true },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

const lastMainSpacingCommit00919 = { signature: '', at: 0 };

function commitMainSpacing00919(targets = [], reason = 'main-spacing-controls-00919') {
  if (store.hasActiveTransaction()) {
    return Object.freeze({ ok: false, reason: 'active-site-frame-transaction' });
  }
  const { patches, targetIds } = collectMainSpacingPatches00919(targets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-spacing-targets' });
  const signature = [...targetIds].sort().map(id => `${id}:${JSON.stringify(patches[id] || {})}`).join('|');
  const now = Date.now();
  if (signature === lastMainSpacingCommit00919.signature && now - lastMainSpacingCommit00919.at < 1200) {
    return Object.freeze({ ok: true, duplicate: true, targetIds, changedIds: [] });
  }
  lastMainSpacingCommit00919.signature = signature;
  lastMainSpacingCommit00919.at = now;
  store.beginTransaction('main-spacing-controls', { reason, targetIds, stage: '00919' });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({
      reason,
      targetIds,
      styleJsonPrimary: true,
      mainSpacingControlsPersistence: true,
    });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    log('main-spacing-controls-persisted-00919', {
      reason, targetIds, changedIds, transactionId: result.id, jsonPrimary: true,
    });
    return Object.freeze({ ok: true, targetIds, changedIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function installMainSpacingPersistence00919() {
  if (window.__ST_MAIN_SPACING_PERSISTENCE_00919__) return true;
  window.__ST_MAIN_SPACING_PERSISTENCE_00919__ = true;
  window.addEventListener('st:layout-spacing-widget:applied', event => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) ? detail.targets : (detail.target ? [detail.target] : []);
    commitMainSpacing00919(rawTargets, `layout-spacing-widget:${String(detail.reason || 'applied-00919')}`);
  }, true);
  log('main-spacing-controls-parity-installed-00919', {
    event: 'st:layout-spacing-widget:applied',
    controls: ['gap-x', 'gap-y', 'margin', 'padding'],
    finalCommit: true,
    storeAuthority: true,
    rootSavePerAction: 1,
    observers: 0,
    retryLoops: 0,
  });
  return true;
}


function collectMainShadowPatches00914(targets = []) {
  const patches = {};
  const targetIds = [];
  const shadowProps = [
    'box-shadow',
    'filter',
    '-webkit-filter',
    '--st-menu-root-shadow',
    '--st-menu-item-shadow',
  ];
  for (const raw of targets || []) {
    if (!(raw instanceof HTMLElement) || !raw.isConnected || !raw.closest?.('#st-site-main-slot')) continue;
    const owner = mainFrameOwnerForFillTarget00909(raw);
    if (!(owner instanceof HTMLElement)) continue;
    const id = String(owner.dataset.sfId || owner.dataset.stNodeId || owner.dataset.nodeId || '').trim();
    const node = id ? store.maybeGet(id) : null;
    if (!node || node.area !== 'main') continue;

    const stylePatch = {};
    const sources = raw === owner ? [owner] : [raw, owner];
    for (const source of sources) {
      if (!(source instanceof HTMLElement)) continue;
      for (const prop of shadowProps) {
        const inline = source.style.getPropertyValue(prop);
        if (inline != null && String(inline).trim() !== '') stylePatch[prop] = String(inline).trim();
      }
      const camel = {
        'box-shadow': source.style.boxShadow,
        'filter': source.style.filter,
        '-webkit-filter': source.style.webkitFilter,
      };
      for (const [prop, value] of Object.entries(camel)) {
        if (value != null && String(value).trim()) stylePatch[prop] = String(value).trim();
      }
    }
    if (!Object.keys(stylePatch).length) continue;

    patches[id] = {
      style: { ...(node.style || {}), ...stylePatch },
      meta: {
        ...(node.meta || {}),
        shadow: {
          ...(node.meta?.shadow || {}),
          stage: '00914-main-shadow-json-primary-live-raf-quiet',
          persisted: true,
          source: raw === owner ? 'owner' : 'inner-target',
        },
      },
    };
    targetIds.push(id);
  }
  return { patches, targetIds: [...new Set(targetIds)] };
}

function shadowPatchSignature00914(patches = {}, targetIds = []) {
  const ordered = [...new Set(targetIds || [])].sort();
  const shadowKeys = [
    'box-shadow',
    'filter',
    '-webkit-filter',
    '--st-menu-root-shadow',
    '--st-menu-item-shadow',
  ];
  return ordered.map((id) => {
    const style = patches?.[id]?.style || {};
    return `${id}:${shadowKeys.map((key) => `${key}=${String(style[key] ?? '').trim()}`).join(';')}`;
  }).join('|');
}

let pendingMainShadowDraft00914 = null;
let lastShadowLiveLogAt00914 = 0;
let shadowLiveSuppressedLogCount00914 = 0;
let lastFinalShadowCommitSignature00914 = '';
let lastFinalShadowCommitAt00914 = 0;

function uniqueMainShadowTargets00914(targets = []) {
  return uniqueMainRadiusTargets00911(targets);
}

function liveTargetsFromShadowDraft00914(draft) {
  const out = [];
  const seen = new Set();
  const add = (el) => {
    if (!(el instanceof HTMLElement) || !el.isConnected || !el.closest?.('#st-site-main-slot')) return;
    const owner = mainFrameOwnerForFillTarget00909(el) || el;
    const id = mainRadiusTargetId00911(owner) || mainRadiusTargetId00911(el);
    const key = id || `el:${out.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(owner);
  };
  for (const id of draft?.targetIds || []) add(resolveMainRadiusTargetById00911(id));
  for (const el of draft?.targets || []) add(el);
  return out;
}

function syncMainShadowVisualVars00914(targets = [], boxShadowValue = 'none') {
  const value = String(boxShadowValue || 'none').trim() || 'none';
  const mainTargets = uniqueMainShadowTargets00914(targets);
  const touched = [];
  const seen = new Set();
  const add = (el) => {
    if (!(el instanceof HTMLElement) || !el.isConnected || seen.has(el)) return;
    if (!el.closest?.('#st-site-main-slot')) return;
    seen.add(el);
    el.style.setProperty('--sf-selection-authored-shadow', value);
    el.dataset.mainShadowVisualSync = '00914';
    touched.push(mainRadiusTargetId00911(el) || el.tagName.toLowerCase());
  };
  for (const target of mainTargets) {
    add(target);
    const owner = mainFrameOwnerForFillTarget00909(target);
    add(owner);
  }
  return Object.freeze({ ok: touched.length > 0, value, touched });
}

function syncMainShadowDraftStyles00914(targets = [], reason = 'main-shadow-draft-style') {
  const mainTargets = uniqueMainShadowTargets00914(targets);
  if (!mainTargets.length) return Object.freeze({ ok: false, reason: 'no-main-shadow-targets' });
  const targetIds = [...new Set(mainTargets.map(mainRadiusTargetId00911).filter(Boolean))];
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-shadow-targets' });

  pendingMainShadowDraft00914 = {
    targetIds,
    targets: mainTargets,
    reason,
    createdAt: Date.now(),
  };

  shadowLiveSuppressedLogCount00914 += 1;
  const now = Date.now();
  if (!lastShadowLiveLogAt00914 || now - lastShadowLiveLogAt00914 > 2500) {
    const suppressed = Math.max(0, shadowLiveSuppressedLogCount00914 - 1);
    shadowLiveSuppressedLogCount00914 = 0;
    lastShadowLiveLogAt00914 = now;
    log('main-shadow-live-draft-held-00914', {
      reason,
      targetIds,
      suppressed,
      storeWritten: false,
      rootSaved: false,
      patchCollection: false,
      liveRafCoalesced: true,
      quietLiveLogs: true,
    });
  }
  return Object.freeze({ ok: true, changedIds: [], targetIds, draft: true, reason, storeWritten: false, rootSaved: false, patchCollection: false });
}

function commitMainShadowStyles00914(targets = [], reason = 'main-shadow-style') {
  if (store.hasActiveTransaction()) return syncMainShadowDraftStyles00914(targets, `${reason}:active-transaction-draft`);
  const mainTargets = uniqueMainShadowTargets00914(targets);
  const { patches, targetIds } = collectMainShadowPatches00914(mainTargets);
  if (!targetIds.length) return Object.freeze({ ok: false, reason: 'no-main-shadow-targets' });
  const signature = shadowPatchSignature00914(patches, targetIds);
  const now = Date.now();
  if (signature === lastFinalShadowCommitSignature00914 && now - lastFinalShadowCommitAt00914 < 1600) {
    pendingMainShadowDraft00914 = null;
    log('main-shadow-style-duplicate-skipped-00914', { reason, targetIds, jsonPrimary: true, duplicateWindowMs: 1600, shadowCanonicalSignature: true, liveRafQuiet: true });
    return Object.freeze({ ok: true, changedIds: [], targetIds, duplicate: true, reason });
  }
  lastFinalShadowCommitSignature00914 = signature;
  lastFinalShadowCommitAt00914 = now;

  store.beginTransaction('main-shadow-style', { reason, targetIds, liveRafQuiet00914: true });
  try {
    const changedIds = store.updateNodes(scopeVisualPatches00991(patches), { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({ reason, targetIds, styleJsonPrimary: true, mainShadowPersistence: true, liveRafQuiet00914: true });
    persistStore(reason);
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason, preserveLiveMain: true }); } catch {}
    pendingMainShadowDraft00914 = null;
    log('main-shadow-style-persisted-00914', {
      ok: true,
      reason,
      changedIds,
      targetIds,
      transactionId: result.id,
      jsonPrimary: true,
      liveRafQuiet: true,
      draftWritesSuppressed: true,
      patchCollectionOnlyOnCommit: true,
      quietLiveLogs: true,
      preserveLiveMain: true,
    });
    return Object.freeze({ ok: true, changedIds, targetIds, transactionId: result.id });
  } catch (error) {
    try { store.rollbackTransaction({ message: String(error?.message || error || '') }); } catch {}
    log('main-shadow-style-persist-error-00914', { reason, message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, reason: String(error?.message || error || '') });
  }
}

function flushMainShadowDraft00914(reason = 'main-shadow-draft-flush') {
  const draft = pendingMainShadowDraft00914;
  if (!draft || !Array.isArray(draft.targets) || !draft.targets.length) return Object.freeze({ ok: false, reason: 'no-pending-main-shadow-draft' });
  const liveTargets = liveTargetsFromShadowDraft00914(draft);
  if (!liveTargets.length) {
    pendingMainShadowDraft00914 = null;
    return Object.freeze({ ok: false, reason: 'pending-main-shadow-targets-disconnected' });
  }
  return commitMainShadowStyles00914(liveTargets, reason);
}

function installMainShadowPersistence00914() {
  if (window.__ST_MAIN_SHADOW_PERSISTENCE_00914__) return true;
  window.__ST_MAIN_SHADOW_PERSISTENCE_00914__ = true;
  let lastEventSignature = '';
  let lastEventAt = 0;
  let pendingLiveEvent = null;
  let pendingLiveRaf = 0;

  const runShadowEvent00914 = (event, live = false) => {
    const detail = event?.detail || {};
    const rawTargets = Array.isArray(detail.targets) && detail.targets.length ? detail.targets : (detail.target ? [detail.target] : []);
    const mainTargets = uniqueMainShadowTargets00914(rawTargets);
    if (!mainTargets.length) return;
    const ids = mainTargets.map(mainRadiusTargetId00911).filter(Boolean).sort().join(',');
    const state = detail.shadowState || {};
    // 00914: selection CSS uses --sf-selection-authored-shadow with !important.
    // Sync it before Store draft/final path so live-preview and presets are visible immediately.
    syncMainShadowVisualVars00914(mainTargets, detail.boxShadowValue || 'none');
    const signature = `${live ? 'live' : 'final'}|${String(detail.reason || 'applied')}|${String(detail.boxShadowValue || '')}|${JSON.stringify(state)}|${ids}`;
    const now = Date.now();
    const duplicateWindow = live ? 140 : 280;
    if (signature === lastEventSignature && now - lastEventAt < duplicateWindow) return;
    lastEventSignature = signature;
    lastEventAt = now;
    if (live) syncMainShadowDraftStyles00914(mainTargets, `shadows-widget-live:${String(detail.reason || 'live')}`);
    else commitMainShadowStyles00914(mainTargets, `shadows-widget:${String(detail.reason || 'applied')}`);
  };

  const handleShadowEvent = (event, live = false) => {
    if (!live) return runShadowEvent00914(event, false);
    pendingLiveEvent = event;
    if (pendingLiveRaf) return;
    pendingLiveRaf = requestAnimationFrame(() => {
      pendingLiveRaf = 0;
      const ev = pendingLiveEvent;
      pendingLiveEvent = null;
      runShadowEvent00914(ev, true);
    });
  };

  window.addEventListener('st:shadows-widget:applied', event => handleShadowEvent(event, false), true);
  window.addEventListener('st:shadows-widget:live-applied', event => handleShadowEvent(event, true), true);
  document.addEventListener('pointerdown', event => {
    if (!pendingMainShadowDraft00914) return;
    const target = event?.target;
    const insideMain = target instanceof HTMLElement && target.closest?.('#st-site-main-slot');
    const insideShadowControl = target instanceof HTMLElement && (target.matches?.('[data-shadow-geom],[data-shadow-color],[data-shadow-opacity],[data-shadow-outer-none],[data-shadow-inner-none],[data-shadow-inner-toggle],[data-sh-preset],[data-shadows]') || target.closest?.('.design-border-subsection[data-shadows-subsection-id]'));
    if (insideShadowControl) return;
    if (!insideMain) flushMainShadowDraft00914('main-shadow-selection-loss-flush-00914');
  }, true);
  window.addEventListener('beforeunload', () => { try { flushMainShadowDraft00914('main-shadow-beforeunload-flush-00914'); } catch {} }, true);
  log('main-shadow-preset-inner-parity-installed-00914', {
    events: ['st:shadows-widget:live-applied', 'st:shadows-widget:applied'],
    liveDraftSync: true,
    liveStoreWrites: false,
    liveRootSaves: false,
    livePatchCollection: false,
    liveJsonStringify: false,
    liveRafCoalesced: true,
    quietLiveLogs: true,
    finalCommit: true,
    selectionLossFlush: true,
    mainShadowStyleJsonPrimary: true,
    presetButtonsBound: true,
    innerModeExclusive: true,
    canonicalDuplicateSignature: true,
    selectionVisualVariableSync: true,
    presetVisibleUnderActiveSelection: true,
    observers: 0,
    timers: 0,
    retryLoops: 0,
  });
  return true;
}


function restoreCommittedState(reason = 'boot') {
  const committedState = readStoredState();
  if (!committedState) return hydrateAll({ reason: `${reason}:no-stored-state`, preserveCommitted: false });
  const live = buildStateFromDOM(true);
  store.load(live, { emit: false });
  const mainRendered = renderMainSelectionArea(`${reason}:committed-main`);
  const ids = ownedNodeIds();
  const rendered = renderer.renderNodes(ids);
  log('store-restored', { reason, ownedNodes: ids.length, rendered, mainRendered, mainSections: store.findArea('main')?.children?.length || 0 });
  return store.toJSON();
}


function clearPublishedSelection00899() {
  try { window.__ST_LAYOUT_ACTIVE_EL_00453 = null; } catch {}
  try { window.__ST_DESIGN_ACTIVE_EL_00453 = null; } catch {}
  try { window.__ST_SITE_FRAME_MAIN_ACTIVE_00887 = null; } catch {}
  try { document.querySelectorAll('.sf-selection-current,.sf-edit-selected,.is-selected,.is-active,.hb-dom-selected,.hb-dom-active').forEach((node) => {
    if (node instanceof HTMLElement && node.closest?.('#st-site-main-slot')) {
      node.classList.remove('sf-selection-current','sf-edit-selected','is-selected','is-active','hb-dom-selected','hb-dom-active');
    }
  }); } catch {}
  try { document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: null })); } catch {}
  try { window.dispatchEvent(new CustomEvent('st:clearPageTreeSelection')); } catch {}
}

function historyStatus00899() {
  return store.historyStatus ? store.historyStatus() : Object.freeze({ undoCount: 0, redoCount: 0, canUndo: false, canRedo: false });
}

function updateHistoryButtons00899() {
  const status = historyStatus00899();
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn instanceof HTMLButtonElement) {
    undoBtn.disabled = !status.canUndo;
    undoBtn.dataset.siteFrameHistory = '00899';
    undoBtn.title = status.canUndo ? `Назад: ${status.lastUndoLabel || 'дія'} (Ctrl+Z)` : 'Назад (немає дій)';
  }
  if (redoBtn instanceof HTMLButtonElement) {
    redoBtn.disabled = !status.canRedo;
    redoBtn.dataset.siteFrameHistory = '00899';
    redoBtn.title = status.canRedo ? `Вперед: ${status.lastRedoLabel || 'дія'} (Ctrl+Y)` : 'Вперед (немає дій)';
  }
  return status;
}

function renderAfterHistoryRestore00899(result, reason) {
  renderMainSelectionArea(reason);
  const ids = ownedNodeIds();
  const rendered = renderer.renderNodes(ids);
  persistStore(reason);
  persistHistory(reason);
  clearPublishedSelection00899();
  updateHistoryButtons00899();
  try { window.ST_SAVE_ROOT_DOM_HTML?.({ draft: false, reason }); } catch {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason, area: 'main', historyAction: result.action, transactionId: result.id } })); } catch {}
  try { window.dispatchEvent(new CustomEvent('st:site-frame-history-restored', { detail: { ...result, reason, rendered } })); } catch {}
  log(`history-${result.action}-00899`, {
    id: result.id,
    label: result.label,
    changedIds: result.changedIds,
    undoCount: result.undoCount,
    redoCount: result.redoCount,
    mainRendered: true,
    geometryRendered: rendered,
    jsonPrimary: true,
    htmlSnapshots: false,
  });
  return Object.freeze({ ...result, rendered, mainRendered: true });
}

function undoSiteFrame00899() {
  try {
    const result = store.undo?.() || { ok: false, action: 'undo', reason: 'history-api-missing' };
    if (!result.ok) { updateHistoryButtons00899(); return Object.freeze(result); }
    return renderAfterHistoryRestore00899(result, 'history-undo-00899');
  } catch (error) {
    log('history-undo-error-00899', { message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, action: 'undo', reason: String(error?.message || error || '') });
  }
}

function redoSiteFrame00899() {
  try {
    const result = store.redo?.() || { ok: false, action: 'redo', reason: 'history-api-missing' };
    if (!result.ok) { updateHistoryButtons00899(); return Object.freeze(result); }
    return renderAfterHistoryRestore00899(result, 'history-redo-00899');
  } catch (error) {
    log('history-redo-error-00899', { message: String(error?.message || error || '') }, 'error');
    return Object.freeze({ ok: false, action: 'redo', reason: String(error?.message || error || '') });
  }
}

function isEditableTarget00899(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('input,textarea,select,[contenteditable="true"],[contenteditable="plaintext-only"]')) return true;
  return false;
}

let historyControlsInstalled00899 = false;
function installHistoryControls00899() {
  if (historyControlsInstalled00899) return true;
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  if (undoBtn instanceof HTMLButtonElement) {
    undoBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      undoSiteFrame00899();
    }, true);
  }
  if (redoBtn instanceof HTMLButtonElement) {
    redoBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      redoSiteFrame00899();
    }, true);
  }
  document.addEventListener('keydown', (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || isEditableTarget00899(event.target)) return;
    const key = String(event.key || '').toLowerCase();
    if (key === 'z' && event.shiftKey) {
      event.preventDefault();
      redoSiteFrame00899();
    } else if (key === 'z') {
      event.preventDefault();
      undoSiteFrame00899();
    } else if (key === 'y') {
      event.preventDefault();
      redoSiteFrame00899();
    }
  }, true);
  historyControlsInstalled00899 = true;
  updateHistoryButtons00899();
  log('history-controls-installed-00899', {
    undoButton: undoBtn instanceof HTMLButtonElement,
    redoButton: redoBtn instanceof HTMLButtonElement,
    shortcuts: ['Ctrl+Z','Ctrl+Y','Ctrl+Shift+Z'],
    oneStepPerCommittedTransaction: true,
  });
  return true;
}

store.subscribe((event) => {
  if (event?.type === 'transaction:commit') {
    persistHistory(`transaction:${event?.detail?.label || 'commit'}`);
    updateHistoryButtons00899();
  } else if (event?.type === 'history:undo' || event?.type === 'history:redo' || event?.type === 'history:clear') {
    persistHistory(event.type);
    updateHistoryButtons00899();
  }
});

const api = Object.freeze({
  version: VERSION,
  contract: Object.freeze({
    storeAuthority: true,
    jsonPrimary: true,
    rendererOwnedGeometryWrites: true,
    editLayerDirectDomGeometryWrites: false,
    transactions: true,
    observers: 0,
    timers: 0,
    retryLoops: 0,
    legacyHtmlOutputOnly: true,
    storageKey: STORAGE_KEY,
    mainAreaRoot: '#st-site-main-slot',
    mainFrameOnly: false,
    mainStructureJsonPrimary: true,
    mainSelectionOnly: false,
    mainDrag: true,
    mainResize: true,
    mainTemplates: true,
    mainTemplateModes: Object.freeze(['add','replace']),
    mainTemplateReplaceTargetSelection: 'explicit-next-main-selection-00949',
    mainTemplateReplaceFallsBackToAdd: false,
    mainEdgeToEdge: true,
    emptyMainIsValid: true,
    toolbarDelete: true,
    sharedMoveNode: true,
    resizeAreas: Object.freeze(['header', 'main', 'footer']),
    responsiveEditScope00991: true,
    responsiveRangeOverrides: true,
    responsiveBaseUnaffected: true,
    moveAreas: Object.freeze(['main']),
    moveMode: 'same-parent-plus-block-reparent',
    blockCrossContainer: true,
    liveParentGrow: true,
    naturalFlowAreas: Object.freeze(['header', 'main', 'footer']),
    liveParentGrowMeasurement: 'active-child-bottom-only',
    resizeEquations: true,
    adjacentPairEquation: 'active-plus-adjacent-constant',
    integerPixelConservation: true,
    pairOnlyStorePatches: true,
    nonAdjacentWidthsInvariant: true,
    pairMinimumRule: 'intrinsic-or-current-if-already-undersized',
    pairCanvasWidthInvariant: true,
    canvasScrollbarGutter: 'stable',
    persistenceUndoRedo: true,
    mainTextEditable: true,
    mainTextContentJsonPrimary: true,
    textLocalActionHistory: true,
    mainTextBlockDragRestore: true,
    textEditableBlockDrag: true,
    textFocusStableDuringDraftSave: true,
    mainTextSavePreservesLiveDom: true,
    mainFillStylePersistence: true,
    mainFillStyleJsonPrimary: true,
    mainFillThemeReady: true,
    mainFillLiveDraftSync: true,
    mainFillLiveRafQuiet: true,
    mainFillLiveStoreWrites: false,
    mainFillLiveRootSaves: false,
    mainFillSelectionLossFlush: true,
    mainFillRootSaveBeforeSelectionLoss: true,
    mainRadiusStylePersistence: true,
    mainRadiusStyleJsonPrimary: true,
    mainRadiusLiveDraftSync: true,
    mainRadiusLiveRafQuiet: true,
    mainRadiusLiveStoreWrites: false,
    mainRadiusLiveRootSaves: false,
    mainRadiusSelectionLossFlush: true,
    mainRadiusCornerMaskNoAutoApply: true,
    mainRadiusSelectionVisualVariableSync: true,
    mainBorderColorStylePersistence: true,
    mainBorderColorStyleJsonPrimary: true,
    mainBorderColorLiveDraftSync: true,
    mainBorderColorLiveRafQuiet: true,
    mainBorderColorLiveStoreWrites: false,
    mainBorderColorLiveRootSaves: false,
    mainBorderColorSelectionLossFlush: true,
    mainShadowStylePersistence: true,
    mainShadowStyleJsonPrimary: true,
    presetButtonsBound: true,
    innerModeExclusive: true,
    canonicalDuplicateSignature: true,
    mainShadowLiveDraftSync: true,
    mainShadowLiveRafQuiet: true,
    mainShadowLiveStoreWrites: false,
    mainShadowLiveRootSaves: false,
    mainShadowSelectionLossFlush: true,
    mainShadowSelectionVisualVariableSync: true,
    mainShadowPresetRestoresOuterDisabled: true,
    mainLayersBoundariesPersistence: true,
    mainLayersBoundariesJsonPrimary: true,
    mainLayersOneCommitPerAction: true,
    mainSpacingControlsPersistence: true,
    mainSpacingControlsJsonPrimary: true,
    mainSpacingOneCommitPerAction: true,
    mainTypographyControlsPersistence: true,
    mainTypographyControlsJsonPrimary: true,
    mainTypographyOneCommitPerAction: true,
    historyStorageKey: HISTORY_STORAGE_KEY,
    historyJsonPrimary: true,
    historyHtmlSnapshots: false,
    oneStepPerCommittedTransaction: true,
    domStructureContract: SITE_FRAME_DOM_STRUCTURE_VERSION,
    authoredBlocksOpaque: true,
    internalImplementationBlocksExcluded: true,
  }),
  store,
  renderer,
  hydrateAll,
  beginTransaction,
  previewBox,
  previewStyle: previewStyle00991,
  previewPair,
  getResponsiveEditScope: getResponsiveEditScope00991,
  commitTransaction,
  captureAreaFromDOM,
  updateMainTextContent: updateMainTextContent00903,
  commitMainTypography: commitMainTypography00921,
  commitMainFillStyles: commitMainFillStyles00909,
  syncMainFillDraftStyles: syncMainFillDraftStyles00909,
  persistStore,
  flushMainFillDraft: flushMainFillDraft00909,
  commitMainRadiusStyles: commitMainRadiusStyles00911,
  syncMainRadiusDraftStyles: syncMainRadiusDraftStyles00911,
  flushMainRadiusDraft: flushMainRadiusDraft00911,
  commitMainBorderColorStyles: commitMainBorderColorStyles00911,
  syncMainBorderColorDraftStyles: syncMainBorderColorDraftStyles00911,
  flushMainBorderColorDraft: flushMainBorderColorDraft00911,
  commitMainBorderControls: commitMainBorderControls00915,
  syncMainBorderDraft: syncMainBorderDraft00915,
  flushMainBorderDraft: flushMainBorderDraft00915,
  commitMainLayers: commitMainLayers00918,
  commitMainSpacing: commitMainSpacing00919,
  commitMainShadowStyles: commitMainShadowStyles00914,
  syncMainShadowDraftStyles: syncMainShadowDraftStyles00914,
  syncMainShadowVisualVars: syncMainShadowVisualVars00914,
  flushMainShadowDraft: flushMainShadowDraft00914,
  restoreCommittedState,
  ensureMainSelectionFrame,
  renderMainSelectionArea,
  applyMainTemplate: applyMainTemplate00888,
  selectedMainSectionId: selectedMainSectionId00888,
  resolveMainTemplateTarget: resolveMainTemplateTarget00952,
  renameMainNode: renameMainNode00891,
  removeMainNode: removeMainNode00891,
  removeNode: removeSiteFrameNode00892,
  moveNode: moveSiteFrameNode00895,
  undo: undoSiteFrame00899,
  redo: redoSiteFrame00899,
  historyStatus: historyStatus00899,
  exportHistory: () => store.exportHistory?.() || null,
  persistHistory,
  mainSelectionIds: MAIN_SELECTION_IDS,
  getState: () => store.toJSON(),
});

window.ST_SITE_FRAME_STORE_AUTHORITY_00876 = api;

function boot() {
  try { installMainFillPersistence00909(); } catch (error) { log('main-fill-live-raf-quiet-install-error-00909', { message: String(error?.message || error || '') }, 'error'); }
  try { installMainRadiusPersistence00911(); } catch (error) { log('main-radius-live-raf-quiet-install-error-00911', { message: String(error?.message || error || '') }, 'error'); }
  try { installMainBorderColorPersistence00911(); } catch (error) { log('main-border-color-live-raf-quiet-install-error-00911', { message: String(error?.message || error || '') }, 'error'); }
  try { installMainBorderControlsPersistence00915(); } catch (error) { log('main-border-controls-parity-install-error-00915', { message: String(error?.message || error || '') }, 'error'); }
  try { installMainLayersPersistence00918(); } catch (error) { log('main-layers-boundaries-parity-install-error-00918', { message: String(error?.message || error || '') }, 'error'); }
  try { installMainSpacingPersistence00919(); } catch (error) { log('main-spacing-controls-parity-install-error-00919', { message: String(error?.message || error || '') }, 'error'); }
  try { installMainShadowPersistence00914(); } catch (error) { log('main-shadow-preset-inner-parity-install-error-00914', { message: String(error?.message || error || '') }, 'error'); }
  try { restoreCommittedState('boot'); }
  catch (error) { log('boot-error', { message: String(error?.message || error || '') }, 'error'); }
  installHistoryControls00899();
  log('boot', { ...api.contract, history: historyStatus00899() });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else queueMicrotask(boot);

window.addEventListener('st:responsive-viewport-change', (event) => {
  if (store.hasActiveTransaction()) return;
  try {
    const scope = getResponsiveEditScope00991(event?.detail || null);
    const ids = store.all().filter(node => node.area && node.kind !== KIND.AREA && node.kind !== KIND.SITE).map(node => node.id);
    const rendered = renderer.renderNodes(ids);
    const textStyles = applyResponsiveTextEditableStyles00991(scope);
    log('responsive-profile-rendered-00991', {
      profileId: scope.scoped ? scope.profileId : 'base',
      scope: responsiveProfileDescription00991(scope),
      rendered,
      textStyles,
      storeWrites: 0,
      historyWrites: 0,
    });
  } catch (error) {
    log('responsive-profile-render-error-00991', { message: String(error?.message || error || '') }, 'error');
  }
}, true);

document.addEventListener('st:templates-applied', (event) => {
  if (event?.detail?.area === 'main') return;
  if (store.hasActiveTransaction()) return;
  try { hydrateAll({ reason: 'template-applied', preserveCommitted: false }); persistStore('template-applied'); } catch {}
}, true);

window.addEventListener('st:canvas-apply-snapshot', () => {
  if (store.hasActiveTransaction()) return;
  try { restoreCommittedState('canvas-snapshot'); } catch {}
}, true);
