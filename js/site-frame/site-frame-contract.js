// 00832-SITE-FRAME-ENGINE-CORE
// Clean node contract for Header / Main / Footer and future site areas.

export const SITE_FRAME_VERSION = '00832-site-frame-engine-core';

export const KIND = Object.freeze({
  SITE: 'site',
  AREA: 'area',
  SECTION: 'section',
  LEVEL: 'level',
  CONTAINER: 'container',
  BLOCK: 'block'
});

export const DEFAULT_AREAS = Object.freeze(['header', 'main', 'footer']);
export const FUTURE_AREAS = Object.freeze(['sidebar', 'aside', 'modal', 'floating']);

export const ATOMIC_BLOCK_TYPES = Object.freeze([
  'text',
  'icon',
  'image',
  'button-text',
  'input',
  'shape',
  'html'
]);

export const COMPOSITE_COMPONENT_TYPES = Object.freeze([
  'default',
  'phone',
  'logo-composite',
  'menu',
  'button',
  'search',
  'socials',
  'card',
  'columns'
]);

let idCounter = 0;

export function createStableId(prefix = 'sf_node') {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${rand}`;
}

export function isContainerLikeKind(kind) {
  return kind === KIND.SITE || kind === KIND.AREA || kind === KIND.SECTION || kind === KIND.LEVEL || kind === KIND.CONTAINER;
}

export function canHaveChildren(node) {
  return !!node && isContainerLikeKind(node.kind);
}

export function isAtomicBlock(node) {
  return !!node && node.kind === KIND.BLOCK;
}

export function defaultNode({ id, area = '', kind, componentType = 'default', parentId = null, children = [] }) {
  if (!kind) throw new Error('SiteFrame node requires kind');
  const nodeId = id || createStableId(`sf_${kind}`);
  return {
    id: nodeId,
    area,
    kind,
    componentType,
    parentId,
    children: Array.isArray(children) ? [...children] : [],
    tree: {
      depth: 0,
      containerDepth: 0,
      indexInParent: 0,
      path: [],
      ancestorIds: []
    },
    layout: defaultLayoutForKind(kind),
    box: defaultBoxForKind(kind),
    constraints: defaultConstraintsForKind(kind, componentType),
    style: {},
    // 00991: sparse visual overrides keyed by responsive width-range profile.
    // Base node values remain canonical defaults; only explicit adaptive edits live here.
    responsive: {},
    content: null,
    meta: {
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  };
}

export function defaultLayoutForKind(kind) {
  if (kind === KIND.SITE) {
    return { mode: 'column', gap: 0, padding: edges(0), alignX: 'stretch', alignY: 'start', wrap: false };
  }
  if (kind === KIND.AREA || kind === KIND.SECTION) {
    return { mode: 'column', gap: 0, padding: edges(0), alignX: 'stretch', alignY: 'start', wrap: false };
  }
  if (kind === KIND.LEVEL) {
    return { mode: 'row', gap: 16, padding: edges(16), alignX: 'start', alignY: 'stretch', wrap: false };
  }
  if (kind === KIND.CONTAINER) {
    return { mode: 'column', gap: 8, padding: edges(12), alignX: 'stretch', alignY: 'start', wrap: false };
  }
  return { mode: 'none', gap: 0, padding: edges(0), alignX: 'start', alignY: 'start', wrap: false };
}

export function defaultBoxForKind(kind) {
  if (kind === KIND.SITE || kind === KIND.AREA) return { width: 'auto', height: 'auto' };
  if (kind === KIND.SECTION) return { width: '100%', height: 'auto' };
  if (kind === KIND.LEVEL) return { width: '100%', height: 'auto' };
  if (kind === KIND.CONTAINER) return { width: 240, height: 'auto' };
  return { width: 120, height: 36 };
}

export function defaultConstraintsForKind(kind, componentType = 'default') {
  if (kind === KIND.SITE || kind === KIND.AREA) {
    return { minWidth: 0, minHeight: 0, maxWidth: null, maxHeight: null };
  }
  if (kind === KIND.SECTION) return { minWidth: 240, minHeight: 'content', maxWidth: null, maxHeight: null };
  if (kind === KIND.LEVEL) return { minWidth: 240, minHeight: 'content', maxWidth: null, maxHeight: null };
  if (kind === KIND.CONTAINER) {
    return { minWidth: componentType === 'phone' ? 160 : 120, minHeight: 'content', maxWidth: null, maxHeight: null };
  }
  return { minWidth: 32, minHeight: 24, maxWidth: null, maxHeight: null };
}

export function edges(value) {
  return { top: value, right: value, bottom: value, left: value };
}

export function normalizeEdges(value, fallback = 0) {
  if (typeof value === 'number') return edges(value);
  if (!value || typeof value !== 'object') return edges(fallback);
  return {
    top: toFiniteNumber(value.top, fallback),
    right: toFiniteNumber(value.right, fallback),
    bottom: toFiniteNumber(value.bottom, fallback),
    left: toFiniteNumber(value.left, fallback)
  };
}

export function toFiniteNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function isNumericSize(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function cloneNode(node) {
  return JSON.parse(JSON.stringify(node));
}

export function assertValidNode(node) {
  if (!node || typeof node !== 'object') throw new Error('Invalid SiteFrame node');
  if (!node.id || typeof node.id !== 'string') throw new Error('SiteFrame node requires string id');
  if (!Object.values(KIND).includes(node.kind)) throw new Error(`Invalid SiteFrame kind: ${node.kind}`);
  if (!Array.isArray(node.children)) throw new Error(`SiteFrame node ${node.id} requires children array`);
  if (node.kind === KIND.BLOCK && node.children.length) throw new Error(`Block cannot have children: ${node.id}`);
}
