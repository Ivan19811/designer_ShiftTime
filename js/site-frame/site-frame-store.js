import { DEFAULT_AREAS, KIND, assertValidNode, canHaveChildren, cloneNode, createStableId, defaultNode } from './site-frame-contract.js';

export class SiteFrameStore {
  constructor(initialState = null) {
    this.version = '00899-site-frame-store-history-authority';
    this.nodes = new Map();
    this.rootId = 'sf_site_root';
    this.activeAreas = [...DEFAULT_AREAS];
    this.listeners = new Set();
    this.activeTransaction = null;
    this.transactionSeq = 0;
    this.history = { undo: [], redo: [], max: 14 };
    this.historyPaused = false;
    if (initialState) this.load(initialState);
    else this.createEmptySite();
  }

  createEmptySite(areas = DEFAULT_AREAS) {
    this.nodes.clear();
    this.activeAreas = [...areas];
    const root = defaultNode({ id: this.rootId, kind: KIND.SITE, componentType: 'site', parentId: null });
    root.children = [];
    this.nodes.set(root.id, root);
    for (const areaName of areas) {
      this.createArea(areaName);
    }
    this.rebuildTreeMeta();
    this.emit('reset', { areas });
  }

  createArea(areaName) {
    const existing = this.findArea(areaName);
    if (existing) return existing;
    const id = `sf_area_${areaName}`;
    const areaNode = defaultNode({ id, area: areaName, kind: KIND.AREA, componentType: areaName, parentId: this.rootId });
    areaNode.children = [];
    this.nodes.set(id, areaNode);
    this.get(this.rootId).children.push(id);
    if (!this.activeAreas.includes(areaName)) this.activeAreas.push(areaName);
    this.rebuildTreeMeta();
    this.emit('area:create', { id, area: areaName });
    return areaNode;
  }

  findArea(areaName) {
    for (const node of this.nodes.values()) {
      if (node.kind === KIND.AREA && node.area === areaName) return node;
    }
    return null;
  }

  get(id) {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`SiteFrame node not found: ${id}`);
    return node;
  }

  maybeGet(id) {
    return this.nodes.get(id) || null;
  }

  all() {
    return [...this.nodes.values()].map(cloneNode);
  }

  addNode(parentId, nodeInput, index = null) {
    const parent = this.get(parentId);
    if (!canHaveChildren(parent)) throw new Error(`Cannot add child to ${parent.kind}: ${parentId}`);
    const node = {
      ...defaultNode({
        id: nodeInput.id || createStableId(`sf_${nodeInput.kind || KIND.BLOCK}`),
        area: nodeInput.area || parent.area,
        kind: nodeInput.kind || KIND.BLOCK,
        componentType: nodeInput.componentType || 'default',
        parentId,
        children: nodeInput.children || []
      }),
      ...nodeInput,
      parentId,
      area: nodeInput.area || parent.area
    };
    assertValidNode(node);
    this.nodes.set(node.id, node);
    const insertAt = Number.isInteger(index) ? Math.max(0, Math.min(index, parent.children.length)) : parent.children.length;
    parent.children.splice(insertAt, 0, node.id);
    this.rebuildTreeMeta();
    this.emit('node:add', { parentId, nodeId: node.id });
    return node;
  }

  removeNode(id) {
    const node = this.get(id);
    if (node.kind === KIND.SITE || node.kind === KIND.AREA) throw new Error(`Cannot remove core node: ${id}`);
    const parent = this.maybeGet(node.parentId);
    if (parent) parent.children = parent.children.filter(childId => childId !== id);
    for (const childId of [...node.children]) this.removeNode(childId);
    this.nodes.delete(id);
    this.rebuildTreeMeta();
    this.emit('node:remove', { id });
  }

  updateNode(id, patch) {
    const node = this.get(id);
    const next = deepMerge(node, patch);
    next.meta = { ...(next.meta || {}), updatedAt: Date.now() };
    assertValidNode(next);
    this.nodes.set(id, next);
    this.rebuildTreeMeta();
    this.emit('node:update', { id, patch });
    return next;
  }

  moveNode(id, newParentId, index = null) {
    const node = this.get(id);
    const oldParent = this.maybeGet(node.parentId);
    const newParent = this.get(newParentId);
    if (!canHaveChildren(newParent)) throw new Error(`Cannot move into ${newParent.kind}: ${newParentId}`);
    if (id === newParentId || this.isAncestor(id, newParentId)) throw new Error('Cannot move node into itself or own descendant');
    if (oldParent) oldParent.children = oldParent.children.filter(childId => childId !== id);
    const insertAt = Number.isInteger(index) ? Math.max(0, Math.min(index, newParent.children.length)) : newParent.children.length;
    newParent.children.splice(insertAt, 0, id);
    node.parentId = newParentId;
    node.area = newParent.area;
    this.rebuildTreeMeta();
    this.emit('node:move', { id, newParentId, index: insertAt });
  }

  convertToContainer(id, componentType = 'default') {
    const node = this.get(id);
    if (node.kind === KIND.CONTAINER) return node;
    if (node.kind !== KIND.BLOCK) throw new Error(`Only block can be converted to container: ${id}`);
    node.kind = KIND.CONTAINER;
    node.componentType = componentType;
    node.children = [];
    node.layout = { mode: 'column', gap: 8, padding: { top: 12, right: 12, bottom: 12, left: 12 }, alignX: 'stretch', alignY: 'start', wrap: false };
    node.constraints = { minWidth: 120, minHeight: 'content', maxWidth: null, maxHeight: null };
    this.rebuildTreeMeta();
    this.emit('node:convert-container', { id, componentType });
    return node;
  }

  isAncestor(ancestorId, id) {
    let cur = this.maybeGet(id);
    while (cur && cur.parentId) {
      if (cur.parentId === ancestorId) return true;
      cur = this.maybeGet(cur.parentId);
    }
    return false;
  }

  rebuildTreeMeta() {
    const root = this.maybeGet(this.rootId);
    if (!root) return;
    const visit = (nodeId, depth, ancestorIds, containerDepth) => {
      const node = this.get(nodeId);
      const parent = this.maybeGet(node.parentId);
      const indexInParent = parent ? parent.children.indexOf(nodeId) : 0;
      const nextContainerDepth = node.kind === KIND.CONTAINER ? containerDepth + 1 : containerDepth;
      node.tree = {
        depth,
        containerDepth,
        indexInParent: Math.max(0, indexInParent),
        path: [...ancestorIds, nodeId],
        ancestorIds: [...ancestorIds]
      };
      for (const childId of node.children) {
        const child = this.maybeGet(childId);
        if (!child) continue;
        child.area = node.kind === KIND.AREA ? node.area : node.area || child.area;
        visit(childId, depth + 1, [...ancestorIds, nodeId], nextContainerDepth);
      }
    };
    visit(root.id, 0, [], 0);
  }

  updateNodes(patches, options = {}) {
    const entries = patches instanceof Map ? [...patches.entries()] : Object.entries(patches || {});
    const changedIds = [];
    for (const [id, patch] of entries) {
      if (!this.nodes.has(id) || !patch || typeof patch !== 'object') continue;
      const current = this.get(id);
      const next = deepMerge(current, patch);
      next.meta = { ...(next.meta || {}), updatedAt: Date.now() };
      assertValidNode(next);
      this.nodes.set(id, next);
      changedIds.push(id);
    }
    if (options.rebuildTreeMeta !== false) this.rebuildTreeMeta();
    if (changedIds.length && options.emit !== false) {
      this.emit(options.type || 'node:batch-update', { changedIds, reason: options.reason || '' });
    }
    return changedIds;
  }

  beginTransaction(label = 'transaction', detail = {}) {
    if (this.activeTransaction) throw new Error(`SiteFrame transaction already active: ${this.activeTransaction.id}`);
    this.transactionSeq += 1;
    const transaction = {
      id: `sf_tx_${Date.now().toString(36)}_${this.transactionSeq.toString(36)}`,
      label,
      detail: cloneValue(detail),
      startedAt: Date.now(),
      before: this.toJSON(),
      changedIds: new Set()
    };
    this.activeTransaction = transaction;
    this.emit('transaction:begin', { id: transaction.id, label, detail: transaction.detail });
    return Object.freeze({ id: transaction.id, label: transaction.label, detail: cloneValue(transaction.detail) });
  }

  markTransactionChanges(ids = []) {
    if (!this.activeTransaction) return;
    for (const id of ids) if (this.nodes.has(id)) this.activeTransaction.changedIds.add(id);
  }

  commitTransaction(detail = {}) {
    const transaction = this.activeTransaction;
    if (!transaction) throw new Error('No active SiteFrame transaction');
    this.activeTransaction = null;
    const changedIds = [...transaction.changedIds];
    const committedAt = Date.now();
    const detailCopy = { ...transaction.detail, ...cloneValue(detail) };
    const after = this.toJSON();
    const history = this.recordHistoryEntry(transaction, after, changedIds, committedAt, detailCopy);
    const result = {
      id: transaction.id,
      label: transaction.label,
      detail: detailCopy,
      startedAt: transaction.startedAt,
      committedAt,
      changedIds,
      historyRecorded: history.recorded,
      undoCount: history.undoCount,
      redoCount: history.redoCount
    };
    this.emit('transaction:commit', result);
    return result;
  }

  recordHistoryEntry(transaction, after, changedIds, committedAt, detail = {}) {
    const status = () => this.historyStatus();
    if (this.historyPaused) return { recorded: false, reason: 'history-paused', ...status() };
    const before = transaction.before;
    const changed = changedIds.length > 0
      || stateChanged(before, after)
      || detail?.externalStateChanged === true;
    if (!changed) return { recorded: false, reason: 'no-state-change', ...status() };
    const entry = {
      id: transaction.id,
      label: transaction.label,
      detail: cloneValue(detail),
      startedAt: transaction.startedAt,
      committedAt,
      changedIds: [...changedIds],
      before: cloneValue(before),
      after: cloneValue(after)
    };
    this.history.undo.push(entry);
    if (this.history.undo.length > this.history.max) this.history.undo.splice(0, this.history.undo.length - this.history.max);
    this.history.redo = [];
    return { recorded: true, reason: 'transaction-committed', ...status() };
  }

  historyStatus() {
    return Object.freeze({
      undoCount: this.history.undo.length,
      redoCount: this.history.redo.length,
      canUndo: this.history.undo.length > 0,
      canRedo: this.history.redo.length > 0,
      max: this.history.max,
      lastUndoLabel: this.history.undo.length ? String(this.history.undo[this.history.undo.length - 1].label || '') : '',
      lastRedoLabel: this.history.redo.length ? String(this.history.redo[this.history.redo.length - 1].label || '') : ''
    });
  }

  exportHistory() {
    return {
      version: '00899-site-frame-history-json',
      max: this.history.max,
      undo: this.history.undo.map(entry => cloneValue(entry)),
      redo: this.history.redo.map(entry => cloneValue(entry)),
      status: this.historyStatus()
    };
  }

  importHistory(history = {}) {
    const normalizeEntry = (entry) => {
      if (!entry || typeof entry !== 'object' || !entry.before?.nodes || !entry.after?.nodes) return null;
      return {
        id: String(entry.id || createStableId('sf_tx_history')),
        label: String(entry.label || 'transaction'),
        detail: cloneValue(entry.detail || {}),
        startedAt: Number(entry.startedAt || Date.now()),
        committedAt: Number(entry.committedAt || Date.now()),
        changedIds: Array.isArray(entry.changedIds) ? entry.changedIds.map(String) : [],
        before: cloneValue(entry.before),
        after: cloneValue(entry.after)
      };
    };
    const undo = Array.isArray(history.undo) ? history.undo.map(normalizeEntry).filter(Boolean) : [];
    const redo = Array.isArray(history.redo) ? history.redo.map(normalizeEntry).filter(Boolean) : [];
    const max = Math.max(1, Math.min(40, Number(history.max || this.history.max) || this.history.max));
    this.history = {
      max,
      undo: undo.slice(-max),
      redo: redo.slice(-max)
    };
    return this.historyStatus();
  }

  clearHistory() {
    this.history.undo = [];
    this.history.redo = [];
    this.emit('history:clear', this.historyStatus());
    return this.historyStatus();
  }

  undo() {
    if (this.activeTransaction) throw new Error('Cannot undo during active SiteFrame transaction');
    const entry = this.history.undo.pop();
    if (!entry) return Object.freeze({ ok: false, action: 'undo', reason: 'empty-history', ...this.historyStatus() });
    this.historyPaused = true;
    try { this.load(entry.before, { emit: false }); }
    finally { this.historyPaused = false; }
    this.history.redo.push(entry);
    if (this.history.redo.length > this.history.max) this.history.redo.splice(0, this.history.redo.length - this.history.max);
    const result = Object.freeze({
      ok: true,
      action: 'undo',
      id: entry.id,
      label: entry.label,
      detail: cloneValue(entry.detail),
      changedIds: [...entry.changedIds],
      ...this.historyStatus()
    });
    this.emit('history:undo', result);
    return result;
  }

  redo() {
    if (this.activeTransaction) throw new Error('Cannot redo during active SiteFrame transaction');
    const entry = this.history.redo.pop();
    if (!entry) return Object.freeze({ ok: false, action: 'redo', reason: 'empty-history', ...this.historyStatus() });
    this.historyPaused = true;
    try { this.load(entry.after, { emit: false }); }
    finally { this.historyPaused = false; }
    this.history.undo.push(entry);
    if (this.history.undo.length > this.history.max) this.history.undo.splice(0, this.history.undo.length - this.history.max);
    const result = Object.freeze({
      ok: true,
      action: 'redo',
      id: entry.id,
      label: entry.label,
      detail: cloneValue(entry.detail),
      changedIds: [...entry.changedIds],
      ...this.historyStatus()
    });
    this.emit('history:redo', result);
    return result;
  }

  rollbackTransaction(detail = {}) {
    const transaction = this.activeTransaction;
    if (!transaction) return null;
    this.activeTransaction = null;
    this.load(transaction.before, { emit: false });
    const result = {
      id: transaction.id,
      label: transaction.label,
      detail: { ...transaction.detail, ...cloneValue(detail) },
      startedAt: transaction.startedAt,
      rolledBackAt: Date.now(),
      changedIds: [...transaction.changedIds]
    };
    this.emit('transaction:rollback', result);
    return result;
  }

  hasActiveTransaction() {
    return !!this.activeTransaction;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type, detail = {}) {
    for (const listener of this.listeners) listener({ type, detail, state: this.toJSON() });
  }

  toJSON() {
    return {
      version: this.version,
      rootId: this.rootId,
      activeAreas: [...this.activeAreas],
      nodes: Object.fromEntries([...this.nodes.entries()].map(([id, node]) => [id, cloneNode(node)]))
    };
  }

  load(state, options = {}) {
    // 00899: runtime store version remains current even when loading older persisted snapshots.
    this.version = '00899-site-frame-store-history-authority';
    this.rootId = state.rootId || this.rootId;
    this.activeAreas = state.activeAreas || [...DEFAULT_AREAS];
    this.nodes.clear();
    for (const [id, node] of Object.entries(state.nodes || {})) {
      assertValidNode(node);
      this.nodes.set(id, cloneNode(node));
    }
    if (!this.nodes.has(this.rootId)) throw new Error('SiteFrame state missing root node');
    this.rebuildTreeMeta();
    if (options.emit !== false) this.emit('load', {});
  }
}

function deepMerge(base, patch) {
  if (!patch || typeof patch !== 'object') return base;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      out[key] = deepMerge(base[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function cloneValue(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function stateChanged(a, b) {
  try { return JSON.stringify(a) !== JSON.stringify(b); }
  catch { return true; }
}
