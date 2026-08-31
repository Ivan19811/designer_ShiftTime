// js/site-hf/hf-json-engine.js
// =========================================================
// [00547] Header/Footer JSON engine bridge
// Ціль цього кроку:
// - НЕ створювати новий конструктор;
// - лишити існуючий UI шапки/футера;
// - для тестових шаблонів 00 зберігати JSON model як джерело правди;
// - DOM лишається відображенням моделі, а старий конструктор поки працює як UI-шар.
// =========================================================

const LS_KEY = 'st_hf_json_state_v1';
const VERSION = 'st-hf-json-v1';

function safeParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function clone(obj) {
  if (obj == null) return obj;
  try { return JSON.parse(JSON.stringify(obj)); } catch { return obj; }
}

function normalizeArea(area) {
  const a = String(area || '').toLowerCase().trim();
  if (a === 'footer') return 'footer';
  return 'header';
}

function normalizeMode(mode) {
  return String(mode || '').toLowerCase() === 'page' ? 'page' : 'global';
}

function defaultState() {
  return {
    v: 1,
    version: VERSION,
    header: { global: null, pages: {} },
    footer: { global: null, pages: {} }
  };
}

function readState() {
  const st = safeParse(localStorage.getItem(LS_KEY), null) || defaultState();
  if (!st.header || typeof st.header !== 'object') st.header = { global: null, pages: {} };
  try { delete st.removedDisabledContent; } catch (_) {}
  if (!st.footer || typeof st.footer !== 'object') st.footer = { global: null, pages: {} };
  if (!st.header.pages || typeof st.header.pages !== 'object') st.header.pages = {};
  if (!st.footer.pages || typeof st.footer.pages !== 'object') st.footer.pages = {};
  st.v = 1;
  st.version = VERSION;
  return st;
}

function writeState(st) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(st || defaultState())); } catch (e) {
    console.warn('[hf-json-engine][00547] save failed', e);
  }
}

function escapeAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeText(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function styleObjToText(style) {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style)
    .filter(([k, v]) => k && v != null && String(v) !== '')
    .map(([k, v]) => `${k}:${String(v)}`)
    .join(';');
}

function parseStyleText(styleText) {
  const out = {};
  const s = String(styleText || '').trim();
  if (!s) return out;
  for (const part of s.split(';')) {
    const idx = part.indexOf(':');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

export function renderModelNodeToHtml(node) {
  if (!node) return '';
  if (node.type === 'text') return escapeText(node.text || '');
  // [00551] section-group — це технічний контейнер JSON для кількох root-секцій.
  // У DOM Header/DisabledContent/Footer його НЕ рендеримо, щоб не додавати зайву обгортку.
  if (node.type === 'section-group') {
    return Array.isArray(node.children) ? node.children.map(renderModelNodeToHtml).join('') : '';
  }
  const tag = String(node.tag || 'div').toLowerCase();
  const attrs = { ...(node.attrs || {}) };
  const st = String(node.styleText || '').trim() || styleObjToText(node.style);
  if (st) attrs.style = st;
  if (node.id && !attrs['data-node-id']) attrs['data-node-id'] = String(node.id);
  if (node.type && !attrs['data-hf-node-type'] && ['section','level','container','block'].includes(String(node.type))) {
    attrs['data-hf-node-type'] = String(node.type);
  }
  const attrText = Object.entries(attrs)
    .filter(([key]) => key)
    .map(([key, val]) => {
      if (val === true || val === '') return ` ${key}`;
      if (val == null || val === false) return '';
      return ` ${key}="${escapeAttr(val)}"`;
    })
    .join('');
  const children = Array.isArray(node.children) ? node.children.map(renderModelNodeToHtml).join('') : '';
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  if (voidTags.has(tag)) return `<${tag}${attrText}>`;
  return `<${tag}${attrText}>${children}</${tag}>`;
}

export function renderModelToHtml(model) {
  const root = model?.root || model;
  return renderModelNodeToHtml(root);
}

function cleanClassName(cls) {
  return String(cls || '')
    .split(/\s+/)
    .filter(Boolean)
    .filter(c => ![
      'is-active','is-selected','hb-dom-active','hb-dom-selected','hb-dom-hover',
      'fb-dom-active','fb-dom-selected'
    ].includes(c))
    .join(' ');
}

function inferNodeType(el) {
  const dt = String(el?.dataset?.hfNodeType || el?.dataset?.stNode || '').toLowerCase();
  if (['section','level','container','block'].includes(dt)) return dt;
  if (el.matches?.('.st-section')) return 'section';
  if (el.matches?.('.st-row')) return 'level';
  if (el.matches?.('.st-block') && el.parentElement?.matches?.('.st-row')) return 'container';
  if (el.matches?.('.hb-elem')) return 'block';
  return 'element';
}

function attrsFromElement(el) {
  const attrs = {};
  for (const a of Array.from(el.attributes || [])) {
    if (!a || !a.name) continue;
    const name = a.name;
    if (name === 'style') continue;
    if (name === 'data-hb-ref' || name === 'data-hb-geom') continue;
    if (name === 'class') {
      const cls = cleanClassName(a.value || '');
      if (cls) attrs.class = cls;
      continue;
    }
    attrs[name] = a.value;
  }
  return attrs;
}

function nodeFromDom(domNode) {
  if (!domNode) return null;
  if (domNode.nodeType === Node.TEXT_NODE) {
    const text = domNode.nodeValue || '';
    if (!text) return null;
    return { type: 'text', text };
  }
  if (domNode.nodeType !== Node.ELEMENT_NODE) return null;
  const el = domNode;
  if (el.closest?.('.hb-panel,.fb-panel')) return null;
  if (el.matches?.('.st-resize,.st-resize-handle,[data-resize-handle],[data-hb-resize-handle]')) return null;

  const type = inferNodeType(el);
  const attrs = attrsFromElement(el);
  const id = attrs['data-node-id'] || el.dataset?.nodeId || el.dataset?.hbRef || '';
  if (id && !attrs['data-node-id']) attrs['data-node-id'] = id;
  if (type && ['section','level','container','block'].includes(type) && !attrs['data-hf-node-type']) attrs['data-hf-node-type'] = type;

  const styleText = String(el.getAttribute('style') || '').trim();
  const children = [];
  for (const ch of Array.from(el.childNodes || [])) {
    const n = nodeFromDom(ch);
    if (!n) continue;
    if (n.type === 'text' && !String(n.text || '').trim()) continue;
    children.push(n);
  }

  return {
    type,
    tag: String(el.tagName || 'div').toLowerCase(),
    id: id || undefined,
    attrs,
    styleText,
    style: parseStyleText(styleText),
    children
  };
}

function getRealAreaRoots(slot, area) {
  if (!slot) return [];
  return Array.from(slot.children || []).filter((el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return false;
    if (el.matches?.('.hb-panel,.fb-panel')) return false;
    if (el.closest?.('.hb-panel,.fb-panel')) return false;
    if (el.id === 'st-header-builder-toolbar' || el.id === 'st-footer-builder-toolbar') return false;
    if (el.matches?.('.st-section')) return true;
    return false;
  });
}

export function isJsonModelTemplate(tpl) {
  return !!(tpl && (tpl.modelVersion === VERSION || tpl.model || tpl?.meta?.singleSourceOfTruth === 'model'));
}

export function isJsonAreaDom(slot) {
  try {
    return !!slot?.querySelector?.('[data-hf-json-template="1"],[data-node-id],[data-hf-node-type]');
  } catch { return false; }
}



// =========================================================
// [00554] JSON operations layer (перший безпечний шар команд)
// ---------------------------------------------------------
// Цей шар НЕ створює новий конструктор. Він додає до вже існуючого
// Header/Footer contract явні JSON-команди:
//   setActiveNode / updateNode / addNode / resizeNode / moveNode / deleteNode
// На цьому етапі старий UI ще редагує live DOM, але кожен commit у JSON
// отримує operation metadata. Це дає нам контрольований міст до фінальної
// схеми JSON-first без різкого переписування всього конструктора.
// =========================================================
const OPS_VERSION = 'st-hf-json-ops-v1-00554';
const MAX_OPS_LOG = 80;
const __activeByArea = { header: null, footer: null };

function nowOpId(area, type) {
  return `${normalizeArea(area)}_${String(type || 'op')}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function safeCssNumber(value) {
  const n = Number.parseFloat(String(value || ''));
  return Number.isFinite(n) ? n : null;
}

function normalizeNodeId(id) {
  return String(id || '').trim();
}

function inferNodeTypeFromElement(el) {
  try {
    const dt = String(el?.dataset?.hfNodeType || el?.dataset?.stNode || '').toLowerCase();
    if (dt) return dt;
    if (el?.matches?.('.st-section')) return 'section';
    if (el?.matches?.('.st-row')) return 'level';
    if (el?.matches?.('.hb-elem')) return 'block';
    if (el?.matches?.('.st-block') && el?.parentElement?.matches?.('.st-row')) return 'container';
    if (el?.matches?.('.st-block')) return 'block';
  } catch {}
  return '';
}

function getElementNodeId(el) {
  try { return normalizeNodeId(el?.dataset?.nodeId || el?.dataset?.hbRef || el?.getAttribute?.('data-node-id') || el?.getAttribute?.('data-hb-ref') || ''); }
  catch { return ''; }
}

function getDirectElementIndex(el) {
  try {
    if (!el?.parentElement) return -1;
    return Array.from(el.parentElement.children || []).filter((n) => !n.closest?.('.hb-panel,.fb-panel')).indexOf(el);
  } catch { return -1; }
}

function inferOperationType(reason) {
  const r = String(reason || '').toLowerCase();
  if (r.includes('delete') || r.includes('remove')) return 'deleteNode';
  if (r.includes('move')) return 'moveNode';
  if (r.includes('resize') || r.includes('geometry') || r.includes('width') || r.includes('height')) return 'resizeNode';
  if (r.includes('add-section') || r.includes('add-level') || r.includes('add-container') || r.includes('add-block') || r.includes('insert')) return 'addNode';
  if (r.includes('style') || r.includes('design') || r.includes('layout') || r.includes('color') || r.includes('bg') || r.includes('font') || r.includes('border') || r.includes('radius') || r.includes('padding')) return 'updateNode';
  if (r.includes('save') || r.includes('close') || r.includes('commit')) return 'commitSnapshot';
  return 'domCommit';
}

function compactElementSnapshot(el) {
  if (!(el instanceof HTMLElement)) return null;
  let rect = null;
  try {
    const r = el.getBoundingClientRect?.();
    if (r) rect = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  } catch {}
  return {
    nodeId: getElementNodeId(el),
    nodeType: inferNodeTypeFromElement(el),
    tag: String(el.tagName || '').toLowerCase(),
    className: String(el.className || ''),
    parentId: getElementNodeId(el.parentElement),
    index: getDirectElementIndex(el),
    rect,
    inline: {
      width: el.style?.width || '',
      height: el.style?.height || '',
      minWidth: el.style?.minWidth || '',
      minHeight: el.style?.minHeight || '',
      maxWidth: el.style?.maxWidth || '',
      maxHeight: el.style?.maxHeight || '',
      flex: el.style?.flex || '',
      flexBasis: el.style?.flexBasis || '',
      display: el.style?.display || '',
      flexDirection: el.style?.flexDirection || '',
      gridTemplateColumns: el.style?.gridTemplateColumns || '',
      padding: el.style?.padding || '',
      margin: el.style?.margin || '',
      color: el.style?.color || '',
      background: el.style?.background || '',
      backgroundColor: el.style?.backgroundColor || '',
      border: el.style?.border || '',
      borderRadius: el.style?.borderRadius || '',
      boxShadow: el.style?.boxShadow || ''
    }
  };
}

export function setActiveNode({ area = 'header', nodeId = '', nodeType = '', element = null, reason = 'selection' } = {}) {
  const a = normalizeArea(area);
  const id = normalizeNodeId(nodeId) || getElementNodeId(element);
  const type = String(nodeType || inferNodeTypeFromElement(element) || '').toLowerCase();
  const active = {
    area: a,
    nodeId: id || null,
    nodeType: type || null,
    reason: String(reason || ''),
    at: Date.now()
  };
  __activeByArea[a] = active;
  try { window.__ST_HF_JSON_ACTIVE_00554 = { ...(__activeByArea || {}) }; } catch {}
  return active;
}

export function getActiveNode(area = 'header') {
  return __activeByArea[normalizeArea(area)] || null;
}

export function buildOperationFromDom({ area = 'header', reason = '', activeEl = null, slot = null, type = '' } = {}) {
  const a = normalizeArea(area);
  let el = activeEl instanceof HTMLElement ? activeEl : null;
  try {
    if (!el || el.closest?.('.hb-panel,.fb-panel')) {
      el = slot?.querySelector?.('.hb-dom-active,.is-active,[data-node-id].is-selected,[data-hb-ref].is-selected') || null;
    }
  } catch {}
  const snapshot = compactElementSnapshot(el);
  const active = getActiveNode(a) || null;
  const nodeId = snapshot?.nodeId || active?.nodeId || null;
  const opType = String(type || inferOperationType(reason));
  const op = {
    version: OPS_VERSION,
    id: nowOpId(a, opType),
    area: a,
    type: opType,
    reason: String(reason || ''),
    nodeId,
    nodeType: snapshot?.nodeType || active?.nodeType || null,
    parentId: snapshot?.parentId || null,
    index: Number.isFinite(snapshot?.index) ? snapshot.index : -1,
    ts: Date.now(),
    source: 'existing-builder-dom-bridge-00554',
    snapshot
  };
  return op;
}

function appendOperationToEntry(entry, prevEntry, operation) {
  if (!entry || !operation) return entry;
  const prevLog = Array.isArray(prevEntry?.operationsLog) ? prevEntry.operationsLog : [];
  const log = prevLog.concat([operation]).slice(-MAX_OPS_LOG);
  entry.operationsVersion = OPS_VERSION;
  entry.operationMode = 'existing-builder-json-operations-bridge-00554';
  entry.lastOperation = operation;
  entry.operationsLog = log;
  entry.activeNodeId = operation.nodeId || null;
  entry.activeNodeType = operation.nodeType || null;
  return entry;
}

function walkModelNodes(root, visitor, parent = null) {
  if (!root || typeof root !== 'object') return false;
  const stop = visitor(root, parent);
  if (stop === true) return true;
  const children = Array.isArray(root.children) ? root.children : [];
  for (const ch of children) {
    if (walkModelNodes(ch, visitor, root)) return true;
  }
  return false;
}

function findModelNode(root, nodeId) {
  const id = normalizeNodeId(nodeId);
  if (!root || !id) return null;
  let found = null;
  walkModelNodes(root, (node, parent) => {
    const nid = normalizeNodeId(node?.id || node?.attrs?.['data-node-id']);
    if (nid === id) {
      let index = -1;
      try { index = Array.isArray(parent?.children) ? parent.children.indexOf(node) : -1; } catch {}
      found = { node, parent, index };
      return true;
    }
    return false;
  });
  return found;
}

function getEntryModelRoot(entry) {
  return entry?.model?.root || entry?.model || null;
}

function mergePlainObject(target, patch) {
  if (!target || typeof target !== 'object') target = {};
  if (!patch || typeof patch !== 'object') return target;
  for (const [k, v] of Object.entries(patch)) {
    if (!k) continue;
    if (v === undefined) continue;
    target[k] = v;
  }
  return target;
}

export function updateNodeInEntry(entry, nodeId, patch = {}) {
  const root = getEntryModelRoot(entry);
  const found = findModelNode(root, nodeId);
  if (!found?.node) return { ok: false, reason: 'node-not-found' };
  const n = found.node;
  if (patch.attrs) n.attrs = mergePlainObject(n.attrs || {}, patch.attrs);
  if (patch.style) n.style = mergePlainObject(n.style || {}, patch.style);
  if (typeof patch.styleText === 'string') {
    n.styleText = patch.styleText;
    n.style = parseStyleText(patch.styleText);
  }
  if (patch.props) n.props = mergePlainObject(n.props || {}, patch.props);
  if (typeof patch.text === 'string') {
    if (n.type === 'text') n.text = patch.text;
    else n.children = [{ type: 'text', text: patch.text }];
  }
  return { ok: true, node: n };
}

export function resizeNodeInEntry(entry, nodeId, geometry = {}) {
  const style = {};
  if (geometry.width != null) style.width = String(geometry.width);
  if (geometry.height != null) style.height = String(geometry.height);
  if (geometry.minWidth != null) style['min-width'] = String(geometry.minWidth);
  if (geometry.minHeight != null) style['min-height'] = String(geometry.minHeight);
  if (geometry.flex != null) style.flex = String(geometry.flex);
  if (geometry.flexBasis != null) style['flex-basis'] = String(geometry.flexBasis);
  return updateNodeInEntry(entry, nodeId, { style });
}

export function addNodeInEntry(entry, parentId, node, index = -1) {
  const root = getEntryModelRoot(entry);
  const found = findModelNode(root, parentId);
  const parent = found?.node;
  if (!parent || !node) return { ok: false, reason: 'parent-not-found' };
  if (!Array.isArray(parent.children)) parent.children = [];
  const pos = Number.isFinite(index) && index >= 0 ? Math.min(index, parent.children.length) : parent.children.length;
  parent.children.splice(pos, 0, clone(node));
  return { ok: true, parent, index: pos };
}

export function deleteNodeInEntry(entry, nodeId) {
  const root = getEntryModelRoot(entry);
  const found = findModelNode(root, nodeId);
  if (!found?.parent || !Array.isArray(found.parent.children) || found.index < 0) return { ok: false, reason: 'node-not-removable' };
  const removed = found.parent.children.splice(found.index, 1)[0];
  return { ok: true, removed };
}

export function moveNodeInEntry(entry, nodeId, newParentId, index = -1) {
  const root = getEntryModelRoot(entry);
  const found = findModelNode(root, nodeId);
  const target = findModelNode(root, newParentId);
  if (!found?.parent || !target?.node || !Array.isArray(found.parent.children)) return { ok: false, reason: 'move-target-not-found' };
  const [node] = found.parent.children.splice(found.index, 1);
  if (!Array.isArray(target.node.children)) target.node.children = [];
  const pos = Number.isFinite(index) && index >= 0 ? Math.min(index, target.node.children.length) : target.node.children.length;
  target.node.children.splice(pos, 0, node);
  return { ok: true, node, parent: target.node, index: pos };
}

export function makeEntry({ area, mode, pageId, templateId, model, html, reason, operation = null, previousEntry = null }) {
  const m = clone(model) || null;
  const renderedHtml = m ? renderModelToHtml(m) : String(html || '');
  const entry = {
    version: VERSION,
    area: normalizeArea(area),
    mode: normalizeMode(mode),
    pageId: pageId || null,
    templateId: templateId || m?.templateId || null,
    modelVersion: VERSION,
    model: m,
    html: renderedHtml,
    savedAt: Date.now(),
    reason: String(reason || '')
  };
  appendOperationToEntry(entry, previousEntry, operation);
  return entry;
}

export function setEntry({ area, mode = 'global', pageId = '', entry }) {
  const a = normalizeArea(area);
  const m = normalizeMode(mode);
  const st = readState();
  if (m === 'page' && pageId) st[a].pages[String(pageId)] = entry || null;
  else st[a].global = entry || null;
  writeState(st);
  return entry || null;
}

export function setTemplateModelEntry({ area, mode = 'global', pageId = '', templateId = '', model = null, html = '', reason = 'template-apply', operation = null, previousEntry = null }) {
  const entry = makeEntry({ area, mode, pageId, templateId, model, html, reason, operation, previousEntry });
  return setEntry({ area, mode, pageId, entry });
}

export function getEntry({ area, mode = 'global', pageId = '' } = {}) {
  const a = normalizeArea(area);
  const m = normalizeMode(mode);
  const st = readState();
  if (m === 'page' && pageId && st[a].pages[String(pageId)]) return st[a].pages[String(pageId)];
  return st[a].global || null;
}

export function captureModelFromSlot({ area, slot, templateId = '', reason = '' } = {}) {
  const a = normalizeArea(area);
  const roots = getRealAreaRoots(slot, a);
  if (!roots.length) return null;
  let rootNode = null;
  if (roots.length === 1) {
    rootNode = nodeFromDom(roots[0]);
  } else {
    rootNode = {
      type: 'section-group',
      tag: 'div',
      id: `${a}_group_${Date.now()}`,
      attrs: { 'data-hf-node-type': 'section-group', 'data-hf-json-template': '1' },
      styleText: '',
      style: {},
      children: roots.map(nodeFromDom).filter(Boolean)
    };
  }
  if (!rootNode) return null;
  const firstTemplateId = templateId
    || rootNode?.attrs?.['data-hf-template-id']
    || roots[0]?.dataset?.hfTemplateId
    || `${a}_dom_capture`;
  return {
    version: VERSION,
    schema: 'section-level-container-block-dom-v1',
    scope: a,
    templateId: firstTemplateId,
    sourcePolicy: 'JSON_MODEL_CAPTURED_FROM_EXISTING_BUILDER_UI_00547',
    renderPolicy: 'DOM is rendered from model; existing builder UI edits visible DOM and commits back to model on save/close.',
    savedAt: Date.now(),
    reason: String(reason || ''),
    root: rootNode
  };
}

export function commitAreaFromSlotToJsonState({ area, mode = 'global', pageId = '', slot, templateId = '', htmlFallback = '', reason = 'builder-commit', operation = null } = {}) {
  const a = normalizeArea(area);
  if (!slot || !isJsonAreaDom(slot)) {
    return { ok: false, reason: 'not-json-area', html: String(htmlFallback || '') };
  }
  const model = captureModelFromSlot({ area: a, slot, templateId, reason });
  if (!model) return { ok: false, reason: 'capture-failed', html: String(htmlFallback || '') };
  let op = operation || null;
  if (!op) {
    try { op = buildOperationFromDom({ area: a, reason, slot }); } catch {}
  }
  const previousEntry = getEntry({ area: a, mode, pageId });
  const entry = setTemplateModelEntry({ area: a, mode, pageId, templateId: model.templateId, model, html: htmlFallback, reason, operation: op, previousEntry });
  try {
    window.__ST_AI_DEBUG_LOG?.perf?.('hf-json-engine:commit-00547', {
      area: a,
      mode: normalizeMode(mode),
      pageId: pageId || null,
      templateId: entry?.templateId || null,
      htmlLength: String(entry?.html || '').length,
      operationType: entry?.lastOperation?.type || null,
      nodeId: entry?.lastOperation?.nodeId || null,
      opsLog: Array.isArray(entry?.operationsLog) ? entry.operationsLog.length : 0
    }, 'info');
  } catch {}
  return { ok: true, entry, html: entry.html, model };
}

export function assignStableIdsFromJsonAttrs(root) {
  if (!root) return;
  const nodes = root.querySelectorAll?.('[data-node-id]') || [];
  for (const el of Array.from(nodes)) {
    if (!el?.dataset) continue;
    if (!el.dataset.hbRef) el.dataset.hbRef = el.dataset.nodeId;
  }
}

if (typeof window !== 'undefined') {
  window.ST_HF_JSON_ENGINE = {
    VERSION,
    renderModelToHtml,
    renderModelNodeToHtml,
    isJsonModelTemplate,
    isJsonAreaDom,
    setTemplateModelEntry,
    commitAreaFromSlotToJsonState,
    getEntry,
    captureModelFromSlot,
    assignStableIdsFromJsonAttrs,
    OPS_VERSION,
    setActiveNode,
    getActiveNode,
    buildOperationFromDom,
    updateNodeInEntry,
    resizeNodeInEntry,
    addNodeInEntry,
    moveNodeInEntry,
    deleteNodeInEntry
  };
}
