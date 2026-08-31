// js/site-frame/site-frame-dom-structure.js
// 00889: one DOM -> SiteFrame tree contract for Header / Main / Footer.
// Authored block nodes are opaque leaves. Internal implementation markup such as
// menu links may reuse .st-block classes, but it is not a SiteFrame child tree.

import { KIND } from './site-frame-contract.js';

export const SITE_FRAME_DOM_STRUCTURE_VERSION = '00889-site-frame-dom-structure-contract';
export const SITE_FRAME_STRUCTURE_SELECTOR = '.st-section,section,.st-row,.st-block,.hb-elem';

function isElement(value) {
  return value instanceof HTMLElement;
}

function normalizeKind(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'row') return KIND.LEVEL;
  return Object.values(KIND).includes(normalized) ? normalized : '';
}

// Template-authored attributes are authoritative. data-sf-kind is runtime metadata.
export function authoredFrameKind(element) {
  if (!isElement(element)) return '';
  return normalizeKind(element.dataset?.hfNodeType)
    || normalizeKind(element.dataset?.stNode)
    || '';
}

function runtimeFrameKind(element) {
  if (!isElement(element)) return '';
  return normalizeKind(element.dataset?.sfKind);
}

// A block owns its internal HTML as content; implementation descendants are not frame children.
export function isOpaqueFrameLeaf(element) {
  if (!isElement(element)) return false;
  const authored = authoredFrameKind(element);
  if (authored === KIND.BLOCK) return true;
  if (authored && authored !== KIND.BLOCK) return false;
  return element.classList.contains('hb-elem');
}

export function directFrameChildren(element) {
  if (!isElement(element) || isOpaqueFrameLeaf(element)) return [];

  const candidates = Array.from(element.querySelectorAll(SITE_FRAME_STRUCTURE_SELECTOR));
  return candidates.filter((candidate) => {
    if (!isElement(candidate) || candidate === element || candidate.classList.contains('st-resize')) return false;
    const nearest = candidate.parentElement?.closest?.(SITE_FRAME_STRUCTURE_SELECTOR) || null;
    if (element.matches(SITE_FRAME_STRUCTURE_SELECTOR)) return nearest === element;
    return !nearest || !element.contains(nearest);
  });
}

export function resolveFrameNodeTarget(raw, boundary = null) {
  const start = isElement(raw) ? raw : (isElement(raw?.parentElement) ? raw.parentElement : null);
  if (!start) return null;
  const candidate = start.closest?.(SITE_FRAME_STRUCTURE_SELECTOR) || null;
  if (!isElement(candidate)) return null;
  if (isElement(boundary) && !boundary.contains(candidate)) return null;

  let ancestor = candidate.parentElement?.closest?.(SITE_FRAME_STRUCTURE_SELECTOR) || null;
  while (isElement(ancestor) && (!isElement(boundary) || boundary.contains(ancestor))) {
    if (isOpaqueFrameLeaf(ancestor)) return ancestor;
    ancestor = ancestor.parentElement?.closest?.(SITE_FRAME_STRUCTURE_SELECTOR) || null;
  }
  return candidate;
}

export function inferFrameKind(element) {
  if (!isElement(element)) return KIND.BLOCK;

  const authored = authoredFrameKind(element);
  if (authored) return authored;

  if (element.matches('.st-section,section')) return KIND.SECTION;
  if (element.matches('.st-row')) return KIND.LEVEL;

  if (element.matches('.st-block,.hb-elem')) {
    if (element.parentElement?.classList?.contains('st-row')) return KIND.CONTAINER;
    if (directFrameChildren(element).length > 0) return KIND.CONTAINER;
    if (runtimeFrameKind(element) === KIND.CONTAINER) return KIND.CONTAINER;
    return KIND.BLOCK;
  }

  return runtimeFrameKind(element) || KIND.BLOCK;
}
