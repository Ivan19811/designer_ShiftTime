// js/site-frame/site-frame-explicit-selection-00989.js
// 00989: explicit Header/Main/Footer selection remains visual-only; Main preserves authored overflow/stacking geometry and text/heading blocks use larger invisible mouse hit-zones.
// Header/Main/Footer use the same invisible resize hit-zones and one thin selection frame.
// Main keeps the shared reorder/block-transfer drag; no observer, whole-slot scan, timer, retry, fallback or duplicated palette.

import { setActiveNode } from '../site-hf/hf-json-engine.js';
import { inferFrameKind, resolveFrameNodeTarget } from './site-frame-dom-structure.js';

const VERSION = '00989-site-frame-explicit-selection-text-resize-hit-zones';
const INSTALLED = new WeakMap();
const ACTIVE = new WeakMap();
const HANDLE_ATTR = 'data-site-frame-selection-handle';
const HANDLE_VALUE = '00887';
const FRAME_ATTR = 'data-site-frame-selection-frame';
const FRAME_VALUE = '00887';
const CURRENT_CLASS = 'sf-selection-current';
const FRONT_CLASS = 'sf-selection-front-path';
const STATIC_CLASS = 'sf-selection-static-position';
const HANDLE_DIRS = Object.freeze(['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']);

function areaOf(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'main' || normalized === 'footer') return normalized;
  return 'header';
}

function slotOf(area) {
  const normalized = areaOf(area);
  if (normalized === 'main') return document.getElementById('st-site-main-slot');
  if (normalized === 'footer') return document.getElementById('st-site-footer-slot');
  return document.getElementById('st-site-header-slot');
}

function managedTarget(raw, slot) {
  if (!(raw instanceof Element) || !(slot instanceof HTMLElement) || !slot.contains(raw)) return null;

  const handle = raw.closest('.st-resize,.st-resize-handle,[data-resize-handle]');
  if (handle && slot.contains(handle)) {
    const owner = resolveFrameNodeTarget(handle.parentElement, slot);
    if (owner instanceof HTMLElement) return owner;
  }

  const target = resolveFrameNodeTarget(raw, slot);
  return target instanceof HTMLElement ? target : null;
}

function kindOf(target) {
  return target instanceof HTMLElement ? inferFrameKind(target) : '';
}

function inspectorModeForKind(kind) {
  const normalized = String(kind || '').toLowerCase();
  if (normalized === 'section') return 'sections';
  if (normalized === 'level' || normalized === 'row') return 'levels';
  if (normalized === 'container') return 'containers';
  if (normalized === 'heading' || normalized === 'headings') return 'headings';
  if (normalized === 'text' || normalized === 'texts') return 'texts';
  if (normalized === 'icon' || normalized === 'icons') return 'icons';
  return 'blocks';
}

function inspectorColorForKind(kind) {
  const mode = inspectorModeForKind(kind);
  const button = document.querySelector(`[data-design-mode="${mode}"]`);
  if (!(button instanceof HTMLElement)) return { mode, color: '' };
  let color = '';
  try { color = String(getComputedStyle(button).getPropertyValue('--st-inspector-selection-line') || '').trim(); } catch {}
  return { mode, color };
}

function isNavigationTarget(raw, slot) {
  if (!(raw instanceof Element) || !(slot instanceof HTMLElement) || !slot.contains(raw)) return false;
  return !!raw.closest('a[href],area[href],[data-button-link-active="1"],[role="link"]');
}

function log(event, detail = {}, level = 'info') {
  const payload = { v: VERSION, ...detail };
  try { window.__ST_ALL_LOG__?.push?.(`site-frame-selection:${event}`, payload, level); } catch {}
  try { window.__ST_PERF_DIAG__?.push?.(`site-frame-selection:${event}`, payload, level); } catch {}
}

function ensureResizeHandleStyle() {
  if (document.getElementById('site-frame-selection-style-00887')) return;
  document.getElementById('site-frame-selection-style-00880')?.remove?.();
  document.getElementById('site-frame-selection-style-00881')?.remove?.();
  const style = document.createElement('style');
  style.id = 'site-frame-selection-style-00887';
  style.textContent = `
    #st-site-header-slot .${STATIC_CLASS},
    #st-site-footer-slot .${STATIC_CLASS} { position: relative !important; }

    #st-site-header-slot .${FRONT_CLASS},
    #st-site-footer-slot .${FRONT_CLASS} {
      z-index: 2147481000 !important;
      overflow: visible !important;
    }

    #st-site-header-slot .${CURRENT_CLASS}.${CURRENT_CLASS}.is-active.is-selected.hb-dom-active.hb-dom-selected,
    #st-site-footer-slot .${CURRENT_CLASS}.${CURRENT_CLASS}.is-active.is-selected.hb-dom-active.hb-dom-selected {
      z-index: 2147482000 !important;
      overflow: visible !important;
      outline: none !important;
      outline-offset: 0 !important;
      box-shadow: var(--sf-selection-authored-shadow, none) !important;
      background: var(--sf-selection-authored-background, transparent) !important;
      border-radius: var(--sf-selection-authored-radius, 0px) !important;
    }

    #st-site-header-slot .${CURRENT_CLASS}.${CURRENT_CLASS}.is-active.is-selected.hb-dom-active.hb-dom-selected::after,
    #st-site-footer-slot .${CURRENT_CLASS}.${CURRENT_CLASS}.is-active.is-selected.hb-dom-active.hb-dom-selected::after {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }

    #st-site-header-slot .st-selection-ui[${FRAME_ATTR}="${FRAME_VALUE}"],
    #st-site-footer-slot .st-selection-ui[${FRAME_ATTR}="${FRAME_VALUE}"] {
      position: absolute !important;
      inset: 0 !important;
      display: block !important;
      pointer-events: none !important;
      box-sizing: border-box !important;
      border: 1px solid var(--sf-selection-color) !important;
      border-radius: inherit !important;
      background: transparent !important;
      box-shadow: none !important;
      outline: none !important;
      z-index: 2147482998 !important;
    }

    #st-site-header-slot .${CURRENT_CLASS} > .st-resize[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      position: absolute !important;
      display: block !important;
      pointer-events: auto !important;
      touch-action: none !important;
      box-sizing: border-box !important;
      opacity: 0 !important;
      visibility: visible !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      outline: none !important;
      z-index: 2147483000 !important;
    }

    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--n[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--n[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      top: -5px !important; left: 12px !important; right: 12px !important; bottom: auto !important;
      width: auto !important; height: 10px !important; cursor: ns-resize !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--s[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--s[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      bottom: -5px !important; left: 12px !important; right: 12px !important; top: auto !important;
      width: auto !important; height: 10px !important; cursor: ns-resize !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--w[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--w[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -5px !important; top: 12px !important; bottom: 12px !important; right: auto !important;
      width: 10px !important; height: auto !important; cursor: ew-resize !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--e[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--e[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -5px !important; top: 12px !important; bottom: 12px !important; left: auto !important;
      width: 10px !important; height: auto !important; cursor: ew-resize !important;
    }

    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      width: 12px !important; height: 12px !important;
      z-index: 2147483001 !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -6px !important; top: -6px !important; right: auto !important; bottom: auto !important;
      cursor: nwse-resize !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -6px !important; top: -6px !important; left: auto !important; bottom: auto !important;
      cursor: nesw-resize !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -6px !important; bottom: -6px !important; right: auto !important; top: auto !important;
      cursor: nesw-resize !important;
    }
    #st-site-header-slot .${CURRENT_CLASS} > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-footer-slot .${CURRENT_CLASS} > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -6px !important; bottom: -6px !important; left: auto !important; top: auto !important;
      cursor: nwse-resize !important;
    }

    #st-site-main-slot .${STATIC_CLASS} { position: relative !important; }
    #st-site-main-slot .${FRONT_CLASS} {
      z-index: 2147481000 !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.${CURRENT_CLASS}.is-active.is-selected.hb-dom-active.hb-dom-selected {
      z-index: 2147482000 !important;
      overflow: var(--sf-selection-authored-overflow, visible) !important;
      overflow-x: var(--sf-selection-authored-overflow-x, var(--sf-selection-authored-overflow, visible)) !important;
      overflow-y: var(--sf-selection-authored-overflow-y, var(--sf-selection-authored-overflow, visible)) !important;
      outline: none !important;
      outline-offset: 0 !important;
      box-shadow: var(--sf-selection-authored-shadow, none) !important;
      background: var(--sf-selection-authored-background, transparent) !important;
      border-radius: var(--sf-selection-authored-radius, 0px) !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.${CURRENT_CLASS}.is-active.is-selected.hb-dom-active.hb-dom-selected::after {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }
    #st-site-main-slot .st-selection-ui[${FRAME_ATTR}="${FRAME_VALUE}"] {
      position: absolute !important;
      inset: 0 !important;
      display: block !important;
      pointer-events: none !important;
      box-sizing: border-box !important;
      border: 1px solid var(--sf-selection-color) !important;
      border-radius: inherit !important;
      background: transparent !important;
      box-shadow: none !important;
      z-index: 2147483000 !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      position: absolute !important;
      display: block !important;
      pointer-events: auto !important;
      touch-action: none !important;
      box-sizing: border-box !important;
      opacity: 0 !important;
      visibility: visible !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      outline: none !important;
      z-index: 2147483001 !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--n[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      top: -5px !important; left: 12px !important; right: 12px !important; bottom: auto !important;
      width: auto !important; height: 10px !important; cursor: ns-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--s[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      bottom: -5px !important; left: 12px !important; right: 12px !important; top: auto !important;
      width: auto !important; height: 10px !important; cursor: ns-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--w[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -5px !important; top: 12px !important; bottom: 12px !important; right: auto !important;
      width: 10px !important; height: auto !important; cursor: ew-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--e[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -5px !important; top: 12px !important; bottom: 12px !important; left: auto !important;
      width: 10px !important; height: auto !important; cursor: ew-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      width: 12px !important; height: 12px !important;
      z-index: 2147483002 !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -6px !important; top: -6px !important; right: auto !important; bottom: auto !important;
      cursor: nwse-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -6px !important; top: -6px !important; left: auto !important; bottom: auto !important;
      cursor: nesw-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -6px !important; bottom: -6px !important; right: auto !important; top: auto !important;
      cursor: nesw-resize !important;
    }
    #st-site-main-slot .${CURRENT_CLASS} > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -6px !important; bottom: -6px !important; left: auto !important; top: auto !important;
      cursor: nwse-resize !important;
    }

    /* 00989: Main leaf text/heading blocks are frequently only 30–70px tall.
       Keep the center editable, but make the eight invisible resize hit-zones
       large enough to acquire reliably with a mouse, matching Header/Footer feel. */
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--n[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      top: -9px !important; left: 10px !important; right: 10px !important; height: 18px !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--s[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      bottom: -9px !important; left: 10px !important; right: 10px !important; height: 18px !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--w[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      left: -9px !important; top: 10px !important; bottom: 10px !important; width: 18px !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--e[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      right: -9px !important; top: 10px !important; bottom: 10px !important; width: 18px !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"],
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"] {
      width: 18px !important; height: 18px !important;
    }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--nw[${HANDLE_ATTR}="${HANDLE_VALUE}"] { left: -9px !important; top: -9px !important; }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--ne[${HANDLE_ATTR}="${HANDLE_VALUE}"] { right: -9px !important; top: -9px !important; }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--sw[${HANDLE_ATTR}="${HANDLE_VALUE}"] { left: -9px !important; bottom: -9px !important; }
    #st-site-main-slot .${CURRENT_CLASS}.sf-main-selection-block > .st-resize--se[${HANDLE_ATTR}="${HANDLE_VALUE}"] { right: -9px !important; bottom: -9px !important; }
  `;
  document.head.appendChild(style);
}

function captureAuthoredVisual(target) {
  if (!(target instanceof HTMLElement)) return;
  try {
    const style = getComputedStyle(target);
    target.style.setProperty('--sf-selection-authored-shadow', String(style.boxShadow || 'none'));
    target.style.setProperty('--sf-selection-authored-background', String(style.background || 'transparent'));
    target.style.setProperty('--sf-selection-authored-radius', String(style.borderRadius || '0px'));
    target.style.setProperty('--sf-selection-authored-overflow', String(style.overflow || 'visible'));
    target.style.setProperty('--sf-selection-authored-overflow-x', String(style.overflowX || style.overflow || 'visible'));
    target.style.setProperty('--sf-selection-authored-overflow-y', String(style.overflowY || style.overflow || 'visible'));
  } catch {}
}

function clearVisualState(node) {
  if (!(node instanceof HTMLElement)) return;
  node.classList.remove(CURRENT_CLASS, FRONT_CLASS, STATIC_CLASS);
  node.style.removeProperty('--sf-selection-authored-shadow');
  node.style.removeProperty('--sf-selection-authored-background');
  node.style.removeProperty('--sf-selection-authored-radius');
  node.style.removeProperty('--sf-selection-authored-overflow');
  node.style.removeProperty('--sf-selection-authored-overflow-x');
  node.style.removeProperty('--sf-selection-authored-overflow-y');
}

function clearSlot(slot) {
  if (!(slot instanceof HTMLElement)) return 0;
  const active = ACTIVE.get(slot);
  if (!active) return 0;

  for (const node of active.uiNodes || []) {
    try { node?.remove?.(); } catch {}
  }
  for (const node of active.path || []) clearVisualState(node);
  if (active.target instanceof HTMLElement) {
    active.target.classList.remove('is-active', 'is-selected', 'hb-dom-active', 'hb-dom-selected', 'sf-edit-selected');
    clearVisualState(active.target);
  }
  ACTIVE.delete(slot);
  return 1;
}

function markFrontPath(target, slot) {
  const path = [];
  if (!(target instanceof HTMLElement) || !(slot instanceof HTMLElement)) return path;
  let current = target;
  while (current instanceof HTMLElement && current !== slot) {
    current.classList.add(current === target ? CURRENT_CLASS : FRONT_CLASS);
    try {
      if (getComputedStyle(current).position === 'static') current.classList.add(STATIC_CLASS);
    } catch {}
    path.push(current);
    current = current.parentElement;
  }
  return path;
}

function createSelectionUi(target, kind, area) {
  if (!(target instanceof HTMLElement)) return { handles: 0, frame: false, nodes: [], inspectorMode: '', color: '' };
  const ownerId = String(target.dataset?.sfId || target.dataset?.stNodeId || target.dataset?.nodeId || target.id || '');
  const { mode, color } = inspectorColorForKind(kind);
  const fragment = document.createDocumentFragment();
  const nodes = [];

  const frame = document.createElement('span');
  frame.className = 'st-selection-ui sf-selection-frame';
  frame.setAttribute(FRAME_ATTR, FRAME_VALUE);
  frame.setAttribute('data-inspector-mode', mode);
  if (color) frame.style.setProperty('--sf-selection-color', color);
  frame.setAttribute('aria-hidden', 'true');
  frame.setAttribute('role', 'presentation');
  fragment.appendChild(frame);
  nodes.push(frame);

  const handlesEnabled = true;
  if (handlesEnabled) {
    for (const dir of HANDLE_DIRS) {
      const handle = document.createElement('span');
      handle.className = `st-resize st-resize--${dir}`;
      handle.dataset.dir = dir;
      handle.dataset.stDir = dir;
      if (ownerId) handle.dataset.sfOwnerId = ownerId;
      handle.setAttribute(HANDLE_ATTR, HANDLE_VALUE);
      handle.setAttribute('aria-hidden', 'true');
      handle.setAttribute('role', 'presentation');
      fragment.appendChild(handle);
      nodes.push(handle);
    }
  }
  target.appendChild(fragment);
  return { handles: handlesEnabled ? HANDLE_DIRS.length : 0, frame: true, nodes, inspectorMode: mode, color };
}

export function publishSiteFrameSelection(options = {}) {
  const area = areaOf(options.area);
  const slot = options.slot instanceof HTMLElement ? options.slot : slotOf(area);
  const target = options.target instanceof HTMLElement ? options.target : null;
  if (!slot || !target || !slot.contains(target)) return null;

  ensureResizeHandleStyle();
  for (const otherArea of ['header', 'main', 'footer']) {
    const otherSlot = slotOf(otherArea);
    if (otherSlot && otherSlot !== slot) clearSlot(otherSlot);
  }
  clearSlot(slot);

  const kind = String(options.kind || kindOf(target));
  captureAuthoredVisual(target);
  target.classList.add('is-active', 'is-selected', 'hb-dom-active', 'hb-dom-selected');
  const path = markFrontPath(target, slot);
  const ui = createSelectionUi(target, kind, area);
  ACTIVE.set(slot, { target, path, uiNodes: ui.nodes, kind, inspectorMode: ui.inspectorMode });

  const nodeId = String(target.dataset?.nodeId || target.dataset?.hbRef || target.dataset?.sfId || '');
  window.__ST_LAYOUT_ACTIVE_SCOPE_00451 = area;
  window.__ST_DESIGN_ACTIVE_SCOPE_00453 = area;
  window.__ST_LAYOUT_ACTIVE_EL_00453 = target;
  window.__ST_DESIGN_ACTIVE_EL_00453 = target;

  const slotKey = area === 'footer' ? 'footerSlot' : area === 'main' ? 'mainSlot' : 'headerSlot';
  const detail = {
    type: `${area}-inner`,
    area,
    kind,
    element: target,
    el: target,
    elements: [target],
    [slotKey]: slot,
  };
  document.dispatchEvent(new CustomEvent('st:selection-changed', { detail }));

  const reason = String(options.reason || VERSION);
  if (area === 'main') {
    window.__ST_SITE_FRAME_MAIN_ACTIVE_00887 = Object.freeze({
      area,
      nodeId,
      nodeType: kind,
      reason,
      at: Date.now(),
    });
  } else {
    try {
      setActiveNode({
        area,
        nodeId,
        nodeType: kind,
        element: target,
        reason,
      });
    } catch {}
  }

  log('explicit-commit', {
    area,
    nodeId,
    kind,
    tag: target.tagName,
    cls: target.className || '',
    handleCount: ui.handles,
    singleFrame: ui.frame,
    inspectorMode: ui.inspectorMode,
    inspectorColorAuthority: !!ui.color,
    handlesVisible: false,
    resizeEnabled: true,
    dragEnabled: area === 'main',
    frontDepth: path.length,
    exactHandleOwner: true,
    cleanupScope: 'previous-selection-only',
  });
  return target;
}

export function installSiteFrameSlotSelection(area, slot = slotOf(area)) {
  const normalized = areaOf(area);
  if (!(slot instanceof HTMLElement)) return false;
  if (INSTALLED.get(slot) === normalized) return true;

  ensureResizeHandleStyle();

  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const raw = event.target instanceof Element ? event.target : null;
    const target = managedTarget(raw, slot);
    if (!target) return;
    if (isNavigationTarget(raw, slot)) event.preventDefault();

    publishSiteFrameSelection({
      area: normalized,
      slot,
      target,
      kind: kindOf(target),
      reason: `${VERSION}:pointerdown`,
    });
  };

  const onClick = (event) => {
    const raw = event.target instanceof Element ? event.target : null;
    if (!isNavigationTarget(raw, slot)) return;
    const target = managedTarget(raw, slot);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation?.(); } catch {}
    log('navigation-suppressed', {
      area: normalized,
      href: String(raw.closest('a[href],area[href]')?.getAttribute('href') || ''),
      nodeId: String(target.dataset?.nodeId || target.dataset?.sfId || ''),
    });
  };

  slot.addEventListener('pointerdown', onPointerDown, true);
  slot.addEventListener('click', onClick, true);
  INSTALLED.set(slot, normalized);
  slot.dataset.siteFrameSelection00887 = '1';
  if (normalized === 'main') {
    delete slot.dataset.siteFrameMainSelectionOnly;
    slot.dataset.siteFrameMainDrag = '1';
    slot.dataset.siteFrameMainResize = '1';
  }
  log('slot-installed', { area: normalized, slotId: slot.id, resizeHandles: 'invisible-selection-owned', mainDrag: normalized === 'main' });
  return true;
}

export function installAllSiteFrameSlotSelection() {
  const header = installSiteFrameSlotSelection('header');
  const main = installSiteFrameSlotSelection('main');
  const footer = installSiteFrameSlotSelection('footer');
  return { header, main, footer };
}

export function readSiteFrameSelection00948(area = 'main') {
  const normalized = areaOf(area);
  const slot = slotOf(normalized);
  const active = slot instanceof HTMLElement ? ACTIVE.get(slot) : null;
  const target = active?.target instanceof HTMLElement ? active.target : null;
  if (!target || !slot?.contains?.(target)) return null;
  return Object.freeze({
    area: normalized,
    nodeId: String(target.dataset?.nodeId || target.dataset?.hbRef || target.dataset?.sfId || ''),
    kind: String(active?.kind || kindOf(target)),
    target
  });
}

export const SITE_FRAME_EXPLICIT_SELECTION_00887 = Object.freeze({
  version: VERSION,
  observers: 0,
  globalPointerListeners: 0,
  slotPointerListeners: 3,
  navigationSuppressedInCanvas: true,
  resizeHandlesOwnedBySelection: true,
  resizeHandleCountPerSelection: HANDLE_DIRS.length,
  mainResizeHandleCount: HANDLE_DIRS.length,
  mainSelectionOnly: false,
  mainDragEnabled: true,
  mainResizeEnabled: true,
  resizeHandlesVisible: false,
  diagonalHitZones: true,
  singleThinSelectionFrame: true,
  inspectorColorAuthority: true,
  duplicatedSelectionPalette: false,
  selectedFrontLayer: true,
  ancestorFrontPath: true,
  exactHandleOwner: true,
  previousSelectionOnlyCleanup: true,
  fullSlotSelectionScan: false,
  overlayRuntime: false,
  dragRuntime: false,
  getActive: readSiteFrameSelection00948,
});

try {
  window.__ST_SITE_FRAME_EXPLICIT_SELECTION_00887__ = SITE_FRAME_EXPLICIT_SELECTION_00887;
} catch {}
