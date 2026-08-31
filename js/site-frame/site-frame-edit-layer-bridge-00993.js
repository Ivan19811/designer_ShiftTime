// js/site-frame/site-frame-edit-layer-bridge-00993.js
import { SITE_FRAME_DOM_STRUCTURE_VERSION, directFrameChildren, inferFrameKind, resolveFrameNodeTarget } from './site-frame-dom-structure.js';
import { SITE_FRAME_RESIZE_EQUATIONS_VERSION, normalizeMeasuredWidths, solveAdjacentPair } from './site-frame-resize-equations.js';
import { publishSiteFrameSelection } from './site-frame-explicit-selection-00989.js?v=00989';
// 00989: shared SiteFrame edit-layer. Header/Main/Footer keep one strict-axis resize contract.
// Main Hero parity fixes the geometry source itself: hidden slider children never participate in intrinsic envelopes,
// pointermove is coalesced through RAF, and pointerup never performs a whole-subtree repair/growth pass.
// Main restores text-block drag after real contenteditable fields were added.
// Vertical growth is propagated live through the exact ancestor path while the
// pointer moves. Horizontal container resize uses one adjacent-pair equation:
// active + neighbour stays constant and non-adjacent widths remain untouched.
// No whole-tree scan mutation, no post-resize repair, and no area-specific engine.

(() => {
  'use strict';

  const VERSION = '00993-site-frame-live-content-shrink-floor-parity';
  const MIN_CONTAINER_W = 40;
  const MIN_BLOCK_W = 32;
  const MIN_H = 24;
  const MAX_SIZE = 8000;

  const state = {
    active: null,
    selectedId: '',
    selectedEl: null,
    idSeq: 1,
    dragCandidate: null,
    drag: null,
    suppressClickUntil: 0,
  };

  function getAuthority() {
    const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876 || null;
    if (!authority?.contract?.storeAuthority) throw new Error('SiteFrameStore authority 00876 is not available');
    return authority;
  }

  function log(event, detail = {}, level = 'info') {
    const payload = { v: VERSION, ...detail };
    try { window.__ST_PERF_DIAG__?.push?.(`site-frame-edit:${event}`, payload, level); } catch {}
    try { window.__ST_AI_DESIGN_DEBUG__?.push?.(`site-frame-edit:${event}`, payload, level); } catch {}
    try { window.__ST_ALL_LOG__?.push?.(`site-frame-edit:${event}`, payload, level); } catch {}
  }

  function publishEditGestureEnd(type, element, cancelled = false) {
    try {
      window.dispatchEvent(new CustomEvent('st:site-frame-edit-gesture-end', {
        detail: Object.freeze({
          version: VERSION,
          type: String(type || ''),
          area: getArea(element),
          id: String(element?.dataset?.sfId || ''),
          cancelled: !!cancelled,
        }),
      }));
    } catch {}
  }

  function isEl(value) {
    return value instanceof HTMLElement;
  }

  function clamp(value, min, max = MAX_SIZE) {
    const number = Number(value);
    const safe = Number.isFinite(number) ? number : Number(min) || 0;
    return Math.max(Number(min) || 0, Math.min(Number(max) || MAX_SIZE, safe));
  }

  function px(value) {
    return `${Math.round(Number(value) || 0)}px`;
  }

  function numPx(value) {
    const number = parseFloat(String(value || ''));
    return Number.isFinite(number) ? number : 0;
  }

  function getCanvasScroller() {
    const node = document.querySelector('#builder-root .canvas__scroll, .canvas__scroll');
    return isEl(node) ? node : null;
  }

  function getCanvasClientWidth() {
    return Math.max(0, Math.round(getCanvasScroller()?.clientWidth || 0));
  }

  function getCanvasScrollbarGutter() {
    const scroller = getCanvasScroller();
    if (!scroller) return '';
    try { return String(getComputedStyle(scroller).scrollbarGutter || ''); }
    catch { return ''; }
  }

  function directChildren(element, selector) {
    try {
      return Array.from(element?.children || []).filter((child) => isEl(child) && child.matches(selector));
    } catch {
      return [];
    }
  }

  function getArea(element) {
    if (!isEl(element)) return '';
    if (element.closest('#st-site-header-slot,.st-site-header-slot,[data-sec-role="header"]')) return 'header';
    if (element.closest('#st-site-main-slot,.st-site-main-slot')) return 'main';
    if (element.closest('#st-site-footer-slot,.st-site-footer-slot,[data-sec-role="footer"]')) return 'footer';
    return '';
  }

  function getKind(element) {
    return inferFrameKind(element);
  }

  function ensureNodeId(element) {
    if (!isEl(element)) return '';
    let id = String(element.dataset.sfId || element.dataset.stNodeId || element.dataset.uid || element.id || '').trim();
    if (!id) id = `sf_dom_${Date.now().toString(36)}_${(state.idSeq++).toString(36)}`;
    element.dataset.sfId = id;
    element.dataset.stNodeId = id;
    return id;
  }

  function buildTreeMeta(element) {
    const path = [];
    let current = element;
    while (isEl(current) && !current.matches('body,html')) {
      if (current.matches('#st-site-header-slot,#st-site-main-slot,#st-site-footer-slot,.st-section,.st-row,.st-block,.hb-elem')) {
        path.unshift(ensureNodeId(current));
      }
      current = current.parentElement;
    }
    const parent = element?.parentElement;
    const siblings = Array.from(parent?.children || []).filter((node) => isEl(node) && !node.classList.contains('st-resize'));
    return {
      depth: path.length,
      path,
      ancestorIds: path.slice(0, -1),
      indexInParent: Math.max(0, siblings.indexOf(element)),
    };
  }

  function markNode(element) {
    if (!isEl(element)) return null;
    const meta = {
      id: ensureNodeId(element),
      area: getArea(element),
      kind: getKind(element),
      tree: buildTreeMeta(element),
      el: element,
    };
    element.dataset.sfArea = meta.area;
    element.dataset.sfKind = meta.kind;
    element.dataset.sfDepth = String(meta.tree.depth || 0);
    return meta;
  }

  function rectOf(element) {
    try {
      const rect = element.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    } catch {
      return null;
    }
  }

  function getHandle(event) {
    const target = event?.target?.nodeType === 1 ? event.target : event?.target?.parentElement;
    const handle = target?.closest?.('.st-resize');
    return isEl(handle) ? handle : null;
  }

  function getOwnerFromHandle(handle) {
    if (!isEl(handle)) return null;

    const explicitId = String(handle.dataset.sfOwnerId || handle.dataset.ownerId || '').trim();
    if (explicitId) {
      try {
        const escaped = window.CSS?.escape ? window.CSS.escape(explicitId) : explicitId.replace(/"/g, '\\"');
        const explicitOwner = document.querySelector(`[data-sf-id="${escaped}"],[data-st-node-id="${escaped}"],#${escaped}`);
        if (isEl(explicitOwner) && explicitOwner.contains(handle)) return explicitOwner;
      } catch {}
    }

    const directOwner = handle.parentElement;
    const areaRoot = handle.closest('#st-site-header-slot,#st-site-main-slot,#st-site-footer-slot');
    const frameOwner = resolveFrameNodeTarget(directOwner, areaRoot);
    if (isEl(frameOwner) && frameOwner.contains(handle)) return frameOwner;

    // A handle without an owner in the canonical SiteFrame tree is invalid.
    return null;
  }

  function cssEscape(value) {
    const raw = String(value || '');
    try { return globalThis.CSS?.escape ? globalThis.CSS.escape(raw) : raw.replace(/(["\\])/g, '\\$1'); }
    catch { return raw.replace(/(["\\])/g, '\\$1'); }
  }

  function isTextLikeBlock00989(owner) {
    if (!isEl(owner) || getKind(owner) !== 'block') return false;
    const component = String(owner.dataset.sfComponent || owner.dataset.blockKind || owner.dataset.blockRole || '').toLowerCase();
    return component === 'text'
      || component === 'heading'
      || owner.classList?.contains('st-block--text')
      || owner.classList?.contains('st-block--heading')
      || String(owner.dataset.mainTextEditable || '').trim() !== '';
  }

  function isMainTextBlockDragOrigin00904(raw, owner) {
    if (!(raw instanceof Element) || !isEl(owner)) return false;
    if (getArea(owner) !== 'main') return false;
    if (getKind(owner) !== 'block') return false;
    if (!isTextLikeBlock00989(owner)) return false;
    const grip = raw.closest?.('[data-site-frame-text-drag-grip="00904"]');
    return !!(grip && owner.contains(grip));
  }

  function isInteractiveDragOrigin(raw, owner) {
    if (!(raw instanceof Element) || !isEl(owner)) return true;
    const interactive = raw.closest('input,textarea,select,option,button,a[href],area[href],[contenteditable="true"],[data-no-drag="1"],.st-resize,.st-selection-ui');
    if (!(interactive && owner.contains(interactive))) return false;
    // 00923: a gesture that starts on the real Main contenteditable always
    // belongs to native caret/range selection. Moving the owning text block is
    // available only from its dedicated drag grip, so block DnD can no longer
    // cancel a partial text selection after the pointer crosses a threshold.
    if (isMainTextBlockDragOrigin00904(raw, owner) && interactive.matches?.('[contenteditable="true"],[contenteditable="plaintext-only"],.st-text-edit,[data-st-text-target="1"]')) return false;
    return true;
  }

  function mainDraggableTarget(raw) {
    const slot = document.getElementById('st-site-main-slot');
    if (!(slot instanceof HTMLElement) || !(raw instanceof Element) || !slot.contains(raw)) return null;
    const target = resolveFrameNodeTarget(raw, slot);
    if (!isEl(target) || target === slot) return null;
    const kind = getKind(target);
    if (!['section', 'level', 'container', 'block'].includes(kind)) return null;
    if (!target.dataset.sfId || !isEl(target.parentElement)) return null;
    return target;
  }

  function primeMainDrag(event) {
    if (event.button !== 0 || state.active || state.drag) return false;
    const raw = event.target instanceof Element ? event.target : null;
    const owner = mainDraggableTarget(raw);
    if (!owner || isInteractiveDragOrigin(raw, owner)) return false;
    const parent = owner.parentElement;
    if (!isEl(parent)) return false;
    const authority = getAuthority();
    const parentId = parent.id === 'st-site-main-slot'
      ? String(authority.store?.findArea?.('main')?.id || '')
      : ensureNodeId(parent);
    if (!parentId) return false;
    const textEditableDrag = isMainTextBlockDragOrigin00904(raw, owner);
    state.dragCandidate = {
      pointerId: event.pointerId,
      source: owner,
      sourceId: ensureNodeId(owner),
      parent,
      parentId,
      startX: event.clientX,
      startY: event.clientY,
      kind: getKind(owner),
      originalIndex: directFrameChildren(parent).indexOf(owner),
      textEditableDrag,
      textEditableNode: textEditableDrag ? raw.closest?.('.st-text-edit,[data-st-text-target="1"],[contenteditable="true"],[contenteditable="plaintext-only"]') : null,
    };
    return true;
  }

  function parentDragAxis(parent) {
    if (!isEl(parent)) return 'column';
    try {
      const style = getComputedStyle(parent);
      if (String(style.display || '').includes('grid')) return 'row';
      if (String(style.display || '').includes('flex') && !String(style.flexDirection || '').includes('column')) return 'row';
    } catch {}
    return 'column';
  }

  function createDropMarker(parent) {
    const marker = document.createElement('span');
    marker.className = 'st-drop-marker sf-main-drag-drop-marker';
    marker.dataset.siteFrameDragMarker = '00895';
    marker.setAttribute('aria-hidden', 'true');
    marker.setAttribute('role', 'presentation');
    marker.dataset.axis = parentDragAxis(parent);
    return marker;
  }

  function compatibleBlockDropParent(event, drag) {
    if (!drag || drag.kind !== 'block') return drag?.parent || null;
    const slot = document.getElementById('st-site-main-slot');
    if (!(slot instanceof HTMLElement)) return drag.parent;
    let hit = null;
    try { hit = document.elementFromPoint(event.clientX, event.clientY); } catch {}
    if (!(hit instanceof Element) || !slot.contains(hit)) return drag.parent;
    const frame = resolveFrameNodeTarget(hit, slot);
    if (!isEl(frame)) return drag.parent;
    if (getKind(frame) === 'container') return frame;
    if (getKind(frame) === 'block' && isEl(frame.parentElement) && getKind(frame.parentElement) === 'container') return frame.parentElement;
    return drag.parent;
  }

  function setDragTargetParent(drag, parent) {
    if (!drag || !isEl(parent) || !isEl(drag.marker)) return false;
    const parentId = parent.id === 'st-site-main-slot'
      ? String(getAuthority().store?.findArea?.('main')?.id || '')
      : ensureNodeId(parent);
    if (!parentId) return false;
    if (drag.targetParent !== parent) {
      try { drag.targetParent?.classList?.remove?.('sf-main-drag-target'); } catch {}
      drag.targetParent = parent;
      drag.targetParentId = parentId;
      drag.axis = parentDragAxis(parent);
      drag.marker.dataset.axis = drag.axis;
      parent.classList.add('sf-main-drag-target');
      parent.appendChild(drag.marker);
      log('drag-target-parent', {
        area: 'main',
        id: drag.sourceId,
        kind: drag.kind,
        oldParentId: drag.parentId,
        targetParentId: parentId,
        crossContainer: parentId !== drag.parentId,
      });
    }
    return true;
  }

  function beginMainDrag(event) {
    const candidate = state.dragCandidate;
    if (!candidate || candidate.pointerId !== event.pointerId || !isEl(candidate.source) || !isEl(candidate.parent)) return false;
    const marker = createDropMarker(candidate.parent);
    if (candidate.textEditableDrag) {
      try { event.preventDefault?.(); } catch {}
      try { window.ST_TEXT_LOCAL_HISTORY_00900?.commit?.(); } catch {}
      try {
        const active = document.activeElement;
        if (active instanceof HTMLElement && candidate.source.contains(active) && active.matches?.('[contenteditable="true"],[contenteditable="plaintext-only"],.st-text-edit,[data-st-text-target="1"]')) active.blur();
      } catch {}
      try { window.getSelection?.()?.removeAllRanges?.(); } catch {}
      try { candidate.source.dataset.mainTextBlockDragging = '00904'; } catch {}
    }
    candidate.parent.insertBefore(marker, candidate.source.nextSibling);
    candidate.source.classList.add('sf-main-drag-source');
    candidate.parent.classList.add('sf-main-drag-target');
    document.documentElement.classList.add('sf-edit-dragging');
    try { candidate.source.setPointerCapture?.(event.pointerId); } catch {}
    state.drag = {
      ...candidate,
      marker,
      targetParent: candidate.parent,
      targetParentId: candidate.parentId,
      axis: marker.dataset.axis || 'column',
      lastIndex: candidate.originalIndex,
    };
    state.dragCandidate = null;
    log('drag-start', {
      area: 'main',
      id: candidate.sourceId,
      parentId: candidate.parentId,
      kind: candidate.kind,
      oldIndex: candidate.originalIndex,
      mode: candidate.kind === 'block' ? 'same-parent-plus-block-reparent' : 'same-parent-reorder',
      storeAuthority: true,
      textEditableDrag: !!candidate.textEditableDrag,
      textBlockDragRestored: true,
      clickStillEditsText: true,
    });
    return true;
  }

  function updateMainDropMarker(event) {
    const drag = state.drag;
    if (!drag || drag.pointerId !== event.pointerId || !isEl(drag.marker)) return;
    const targetParent = compatibleBlockDropParent(event, drag);
    if (!setDragTargetParent(drag, targetParent)) return;

    const parent = drag.targetParent;
    const siblings = directFrameChildren(parent).filter((node) => node !== drag.source);
    const coordinate = drag.axis === 'row' ? event.clientX : event.clientY;
    let before = null;
    for (const sibling of siblings) {
      const rect = sibling.getBoundingClientRect();
      const center = drag.axis === 'row' ? rect.left + rect.width / 2 : rect.top + rect.height / 2;
      if (coordinate < center) { before = sibling; break; }
    }
    if (before) parent.insertBefore(drag.marker, before);
    else parent.appendChild(drag.marker);

    const frameSiblings = new Set(siblings);
    let index = 0;
    for (const child of Array.from(parent.children)) {
      if (child === drag.marker) break;
      if (frameSiblings.has(child)) index += 1;
    }
    drag.lastIndex = index;
  }

  function cleanupMainDrag(drag) {
    if (!drag) return;
    try { drag.source?.classList?.remove?.('sf-main-drag-source'); } catch {}
    try { delete drag.source?.dataset?.mainTextBlockDragging; } catch {}
    try { drag.parent?.classList?.remove?.('sf-main-drag-target'); } catch {}
    try { drag.targetParent?.classList?.remove?.('sf-main-drag-target'); } catch {}
    try { drag.marker?.remove?.(); } catch {}
    try { drag.source?.releasePointerCapture?.(drag.pointerId); } catch {}
    document.documentElement.classList.remove('sf-edit-dragging');
  }

  function finishMainDrag(event, cancelled = false) {
    const drag = state.drag;
    const candidate = state.dragCandidate;
    state.dragCandidate = null;
    if (!drag || drag.pointerId !== event.pointerId) return false;
    state.drag = null;

    const targetIndex = Number.isInteger(drag.lastIndex) ? drag.lastIndex : drag.originalIndex;
    const targetParentId = String(drag.targetParentId || drag.parentId || '');
    cleanupMainDrag(drag);
    if (cancelled) {
      publishEditGestureEnd('drag', drag.source, true);
      log('drag-cancel', { area: 'main', id: drag.sourceId, parentId: drag.parentId, targetParentId });
      return true;
    }

    const result = getAuthority().moveNode?.(drag.sourceId, targetParentId, targetIndex) || { ok: false, moved: false, reason: 'move-api-unavailable' };
    state.suppressClickUntil = Date.now() + 350;
    const moved = document.querySelector(`[data-sf-id="${cssEscape(drag.sourceId)}"]`);
    const slot = document.getElementById('st-site-main-slot');
    if (isEl(moved) && slot instanceof HTMLElement) {
      publishSiteFrameSelection({ area: 'main', slot, target: moved, kind: getKind(moved), reason: `${VERSION}:drag-end` });
    }
    log('drag-end', {
      area: 'main',
      id: drag.sourceId,
      parentId: targetParentId,
      oldParentId: drag.parentId,
      targetParentId,
      crossParent: targetParentId !== drag.parentId,
      kind: drag.kind,
      oldIndex: drag.originalIndex,
      newIndex: targetIndex,
      moved: result.moved === true,
      ok: result.ok === true,
      reason: String(result.reason || ''),
      transactionId: String(result.transactionId || ''),
      resizeEnabled: true,
    }, result.ok === false ? 'warn' : 'info');
    publishEditGestureEnd('drag', isEl(moved) ? moved : drag.source, false);
    return true;
  }

  function suppressPostDragClick(event) {
    if (Date.now() > state.suppressClickUntil) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest?.('#st-site-main-slot')) return;
    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation?.(); } catch {}
  }

  function selectNode(element) {
    if (!isEl(element)) return;
    if (isEl(state.selectedEl) && state.selectedEl !== element) state.selectedEl.classList.remove('sf-edit-selected');
    element.classList.add('sf-edit-selected');
    state.selectedEl = element;
    const meta = markNode(element);
    state.selectedId = meta?.id || '';
    try { window.ST_SELECTION?.select?.(element); } catch {}
    try {
      document.dispatchEvent(new CustomEvent('st:selection-changed', {
        detail: {
          source: VERSION,
          id: state.selectedId,
          area: meta?.area || '',
          kind: meta?.kind || '',
          tree: meta?.tree || null,
        },
      }));
    } catch {}
  }

  function measureIntrinsicMinContentWidth(element) {
    if (!isEl(element)) return MIN_BLOCK_W;
    let clone = null;
    try {
      clone = element.cloneNode(true);
      if (!isEl(clone)) return MIN_BLOCK_W;

      clone.querySelectorAll('.st-resize,.st-selection-ui,.st-drag-marker,.st-drop-marker,.hb-resize-handle').forEach((node) => node.remove());
      clone.removeAttribute('id');
      clone.removeAttribute('data-sf-manual-w');
      clone.removeAttribute('data-sf-manual-h');
      clone.classList.remove('sf-edit-selected', 'is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active');

      clone.style.setProperty('position', 'absolute', 'important');
      clone.style.setProperty('left', '-100000px', 'important');
      clone.style.setProperty('top', '0', 'important');
      clone.style.setProperty('visibility', 'hidden', 'important');
      clone.style.setProperty('pointer-events', 'none', 'important');
      clone.style.setProperty('width', 'min-content', 'important');
      clone.style.setProperty('min-width', '0px', 'important');
      clone.style.setProperty('max-width', 'none', 'important');
      clone.style.setProperty('height', 'auto', 'important');
      clone.style.setProperty('min-height', '0px', 'important');
      clone.style.setProperty('max-height', 'none', 'important');
      clone.style.setProperty('flex', '0 0 auto', 'important');
      clone.style.setProperty('flex-basis', 'auto', 'important');
      clone.style.setProperty('transform', 'none', 'important');

      document.body.appendChild(clone);
      const rectWidth = Math.ceil(clone.getBoundingClientRect().width || 0);
      const scrollWidth = Math.ceil(clone.scrollWidth || 0);
      return clamp(Math.max(rectWidth, scrollWidth, MIN_BLOCK_W), MIN_BLOCK_W, 1400);
    } catch {
      return MIN_BLOCK_W;
    } finally {
      try { clone?.remove(); } catch {}
    }
  }

  function measureLeafMinWidth(element) {
    return measureIntrinsicMinContentWidth(element);
  }

  function getBoxMetrics(element) {
    try {
      const style = getComputedStyle(element);
      return {
        paddingX: numPx(style.paddingLeft) + numPx(style.paddingRight),
        paddingY: numPx(style.paddingTop) + numPx(style.paddingBottom),
        borderX: numPx(style.borderLeftWidth) + numPx(style.borderRightWidth),
        borderY: numPx(style.borderTopWidth) + numPx(style.borderBottomWidth),
        marginX: numPx(style.marginLeft) + numPx(style.marginRight),
        marginY: numPx(style.marginTop) + numPx(style.marginBottom),
        gapX: Math.max(0, numPx(style.columnGap || style.gap)),
        gapY: Math.max(0, numPx(style.rowGap || style.gap)),
        display: String(style.display || ''),
        flexDirection: String(style.flexDirection || ''),
        flexWrap: String(style.flexWrap || ''),
        gridColumns: String(style.gridTemplateColumns || ''),
      };
    } catch {
      return {
        paddingX: 0, paddingY: 0, borderX: 0, borderY: 0,
        marginX: 0, marginY: 0, gapX: 0, gapY: 0,
        display: '', flexDirection: '', flexWrap: '', gridColumns: '',
      };
    }
  }

  function boundSlideParticipates00989(element) {
    if (!isEl(element) || !element.hasAttribute('data-st-fx-bind-slide')) return true;
    const host = element.closest('[data-st-fx-bg-slider]');
    if (!isEl(host)) return true;
    const bindIndex = Number(element.getAttribute('data-st-fx-bind-slide'));
    if (!Number.isFinite(bindIndex) || bindIndex < 1) return true;
    let current = 0;
    try {
      const cfg = JSON.parse(String(host.getAttribute('data-st-fx-bg-slider') || '{}'));
      current = Number(cfg?.current) || 0;
    } catch {}
    return bindIndex === current + 1;
  }

  function participatesInLayout(element) {
    if (!isEl(element) || element.hidden) return false;
    // 00989: runtime-bound slide children are a conditional-layout contract.
    // Their participation is derived from the slider's canonical current index,
    // not from a transient CSS/display value that can briefly be recreated by Store render.
    if (!boundSlideParticipates00989(element)) return false;
    try {
      const style = getComputedStyle(element);
      return String(style.display || '').toLowerCase() !== 'none'
        && String(style.visibility || '').toLowerCase() !== 'collapse';
    } catch {
      return true;
    }
  }

  function getDirectContentChildren(element) {
    return directChildren(element, '.st-section,.st-row,.st-block,.hb-elem')
      .filter((child) => !child.classList.contains('st-resize') && participatesInLayout(child));
  }

  function isHorizontalChildFlow(element, children = getDirectContentChildren(element)) {
    if (!isEl(element) || children.length < 2) return false;
    const kind = getKind(element);
    if (kind === 'section') return false;
    const box = getBoxMetrics(element);
    if (box.display.includes('flex')) return !box.flexDirection.includes('column');
    if (box.display.includes('grid')) {
      const tracks = box.gridColumns.match(/(?:minmax\([^)]*\)|[^\s]+)/g) || [];
      return tracks.length > 1 || kind === 'level';
    }
    return kind === 'level';
  }

  function sanitizeMeasurementClone(clone) {
    if (!isEl(clone)) return;
    clone.querySelectorAll('.st-resize,.st-selection-ui,.st-drag-marker,.st-drop-marker,.hb-resize-handle').forEach((node) => node.remove());
    const all = [clone, ...clone.querySelectorAll('*')];
    for (const node of all) {
      if (!isEl(node)) continue;
      node.removeAttribute('id');
      node.removeAttribute('data-sf-id');
      node.removeAttribute('data-st-node-id');
      node.removeAttribute('data-sf-manual-h');
      node.classList.remove(
        'sf-edit-selected', 'sf-selection-current', 'sf-selection-front-path', 'sf-selection-static-position',
        'is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active'
      );
    }
  }

  function measureIntrinsicLeafHeight(element) {
    if (!isEl(element)) return MIN_H;
    let clone = null;
    try {
      const rect = element.getBoundingClientRect();
      const currentWidth = Math.max(1, Math.ceil(rect.width || 1));
      const computed = getComputedStyle(element);
      const authoredMin = element.dataset.sfManualH ? 0 : numPx(computed.minHeight);

      clone = element.cloneNode(true);
      if (!isEl(clone)) return Math.max(MIN_H, authoredMin);
      sanitizeMeasurementClone(clone);

      clone.style.setProperty('position', 'absolute', 'important');
      clone.style.setProperty('left', '-100000px', 'important');
      clone.style.setProperty('top', '0', 'important');
      clone.style.setProperty('visibility', 'hidden', 'important');
      clone.style.setProperty('pointer-events', 'none', 'important');
      clone.style.setProperty('contain', 'layout style', 'important');
      clone.style.setProperty('box-sizing', 'border-box', 'important');
      clone.style.setProperty('width', `${currentWidth}px`, 'important');
      clone.style.setProperty('min-width', `${currentWidth}px`, 'important');
      clone.style.setProperty('max-width', `${currentWidth}px`, 'important');
      clone.style.setProperty('height', 'auto', 'important');
      clone.style.setProperty('min-height', '0px', 'important');
      clone.style.setProperty('max-height', 'none', 'important');
      clone.style.setProperty('flex', '0 0 auto', 'important');
      clone.style.setProperty('flex-basis', 'auto', 'important');
      clone.style.setProperty('align-self', 'flex-start', 'important');
      clone.style.setProperty('transform', 'none', 'important');

      for (const inner of clone.querySelectorAll('.st-text-edit,.st-menu,.st-menu__list')) {
        if (!(inner instanceof HTMLElement)) continue;
        inner.style.setProperty('height', 'auto', 'important');
        inner.style.setProperty('min-height', '0px', 'important');
        inner.style.setProperty('max-height', 'none', 'important');
      }

      const host = isEl(element.parentElement) ? element.parentElement : document.body;
      host.appendChild(clone);
      const measuredRect = Math.ceil(clone.getBoundingClientRect().height || 0);
      const measuredScroll = Math.ceil(clone.scrollHeight || 0);
      return clamp(Math.max(MIN_H, authoredMin, measuredRect, measuredScroll), MIN_H, MAX_SIZE);
    } catch {
      return MIN_H;
    } finally {
      try { clone?.remove(); } catch {}
    }
  }

  function getLeafContentHeight(element) {
    return measureIntrinsicLeafHeight(element);
  }

  function getManualWidthFloor(element) {
    if (!isEl(element)) return 0;
    const saved = numPx(element.dataset.sfManualW);
    if (saved > 0) return Math.max(saved, Math.ceil(element.getBoundingClientRect().width || 0));
    return 0;
  }

  function getManualHeightFloor(element) {
    if (!isEl(element)) return 0;
    const saved = numPx(element.dataset.sfManualH);
    return saved > 0 ? saved : 0;
  }

  function getMinWidth(element, seen = new WeakSet()) {
    if (!isEl(element) || seen.has(element)) return MIN_BLOCK_W;
    seen.add(element);
    const kind = getKind(element);
    if (kind === 'section' || kind === 'level') return 80;

    const children = getDirectContentChildren(element);
    const box = getBoxMetrics(element);
    if (!children.length || kind === 'block') {
      // 00989: editable text/heading blocks wrap by design. Their mouse-resize
      // floor is structural, not CSS min-content, so a long word/sentence can
      // never force the block back to 500–700px. Content reflows and height is
      // handled independently by the same canonical box transaction.
      if (isTextLikeBlock00989(element)) return MIN_BLOCK_W;
      return Math.max(
        kind === 'container' ? MIN_CONTAINER_W : MIN_BLOCK_W,
        measureLeafMinWidth(element),
      );
    }

    const widths = children.map((child) => {
      const childBox = getBoxMetrics(child);
      return Math.max(getMinWidth(child, seen), getManualWidthFloor(child)) + childBox.marginX;
    });
    const horizontal = isHorizontalChildFlow(element, children);
    const inner = horizontal
      ? widths.reduce((sum, width) => sum + width, 0) + box.gapX * Math.max(0, widths.length - 1)
      : Math.max(...widths);
    return clamp(Math.ceil(inner + box.paddingX + box.borderX), MIN_CONTAINER_W, 3200);
  }

  function getRequiredHeight(element, seen = new WeakSet()) {
    if (!isEl(element) || seen.has(element)) return MIN_H;
    seen.add(element);
    const children = getDirectContentChildren(element);
    const box = getBoxMetrics(element);
    const kind = getKind(element);

    if (!children.length || kind === 'block') {
      return getLeafContentHeight(element);
    }

    const heights = children.map((child) => {
      const childBox = getBoxMetrics(child);
      const required = getRequiredHeight(child, seen);
      // A child may look taller only because its parent currently stretches it.
      // That rendered stretch is not authored child geometry and must never
      // become the parent's next minimum height.
      return Math.max(required, getManualHeightFloor(child)) + childBox.marginY;
    });
    const horizontal = isHorizontalChildFlow(element, children);
    const inner = horizontal
      ? Math.max(...heights)
      : heights.reduce((sum, height) => sum + height, 0) + box.gapY * Math.max(0, heights.length - 1);
    return clamp(Math.ceil(inner + box.paddingY + box.borderY), MIN_H, MAX_SIZE);
  }

  function getResizeMinHeight(element) {
    return getRequiredHeight(element);
  }

  // 00993 — A manually enlarged container must still be shrinkable back to the
  // real bottom edge of its visible content. The previous session floor could
  // lock the current rendered height when clone-based intrinsic measurement was
  // larger than an already-valid box. That preserved dx/dy=0 identity, but it
  // also made blank space below the last child impossible to remove with the
  // mouse. Measure the live participating children instead: their current bottom
  // boundaries already include normal flex/grid flow and gaps, while resize UI
  // and inactive slider copies are excluded by getDirectContentChildren().
  function getLiveContentHeightFloor00993(element) {
    if (!isEl(element)) return MIN_H;
    const children = getDirectContentChildren(element);
    if (!children.length || getKind(element) === 'block') return 0;
    try {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const borderBottom = numPx(style.borderBottomWidth);
      const paddingBottom = numPx(style.paddingBottom);
      let bottom = rect.top + numPx(style.borderTopWidth) + numPx(style.paddingTop);
      for (const child of children) {
        if (!isEl(child)) continue;
        const childRect = child.getBoundingClientRect();
        const childStyle = getComputedStyle(child);
        bottom = Math.max(bottom, childRect.bottom + numPx(childStyle.marginBottom));
      }
      return clamp(Math.ceil(bottom - rect.top + paddingBottom + borderBottom), MIN_H, MAX_SIZE);
    } catch {
      return 0;
    }
  }

  function resolveSessionMinHeight00993(element, measuredFloor, renderedSize, absoluteFloor) {
    const current = Math.max(Number(absoluteFloor) || 0, Math.round(Number(renderedSize) || 0));
    const liveFloor = getLiveContentHeightFloor00993(element);
    if (liveFloor > 0) {
      // Never jump on pointerdown: if content is already overflowing, current
      // remains the floor for this gesture. Otherwise the user may shrink all
      // the way to the last visible child + normal bottom padding.
      return Math.max(Number(absoluteFloor) || 0, Math.min(current, Math.round(liveFloor)));
    }
    return resolveSessionFloor00989(measuredFloor, renderedSize, absoluteFloor);
  }

  function resolveSessionFloor00989(measuredFloor, renderedSize, absoluteFloor) {
    const current = Math.max(Number(absoluteFloor) || 0, Math.round(Number(renderedSize) || 0));
    const measured = Math.max(Number(absoluteFloor) || 0, Math.round(Number(measuredFloor) || 0));
    // A resize session must be identity-preserving at dx=dy=0. If intrinsic
    // measurement says the minimum is larger than the already-valid rendered
    // box, the rendered start size is the session floor. This is the same
    // "current-if-already-undersized" rule used by adjacent Header/Footer pairs.
    return measured > current ? current : measured;
  }

  function getParentInnerRect(element) {
    try {
      const parent = element?.parentElement;
      if (!isEl(parent)) return null;
      const rect = parent.getBoundingClientRect();
      const style = getComputedStyle(parent);
      const left = rect.left + numPx(style.paddingLeft) + numPx(style.borderLeftWidth);
      const right = rect.right - numPx(style.paddingRight) - numPx(style.borderRightWidth);
      return { parent, left, right, width: Math.max(1, right - left) };
    } catch {
      return null;
    }
  }

  function getMaxWidthInsideParent(element, dir) {
    const inner = getParentInnerRect(element);
    if (!inner) return MAX_SIZE;

    const parent = inner.parent;
    const siblings = getDirectContentChildren(parent);
    const index = siblings.indexOf(element);
    if (index >= 0 && siblings.length > 1 && isHorizontalChildFlow(parent, siblings)) {
      const parentBox = getBoxMetrics(parent);
      const reserved = siblings.reduce((sum, sibling, siblingIndex) => {
        const siblingBox = getBoxMetrics(sibling);
        if (siblingIndex === index) return sum + siblingBox.marginX;
        return sum + Math.max(getMinWidth(sibling), getManualWidthFloor(sibling)) + siblingBox.marginX;
      }, parentBox.gapX * Math.max(0, siblings.length - 1));
      return Math.max(getMinWidth(element), inner.width - reserved);
    }

    const rect = element.getBoundingClientRect();
    if (String(dir).includes('w')) return Math.max(getMinWidth(element), rect.right - inner.left);
    return Math.max(getMinWidth(element), inner.right - rect.left);
  }

  function getExpandableMaxWidth(element, dir) {
    let maxWidth = getMaxWidthInsideParent(element, dir);
    let child = element;
    let parent = child?.parentElement;
    let guard = 0;

    while (isEl(parent) && guard++ < 12) {
      if (parent.id === 'site-root' || parent.id === 'st-site-header-slot' || parent.id === 'st-site-main-slot' || parent.id === 'st-site-footer-slot') break;
      if (!parent.matches('.st-block,.st-row,.st-section')) {
        child = parent;
        parent = parent.parentElement;
        continue;
      }

      const parentBox = getBoxMetrics(parent);
      const parentOuterMax = getMaxWidthInsideParent(parent, dir);
      const childInnerMax = Math.max(
        getMinWidth(element),
        parentOuterMax - parentBox.paddingX - parentBox.borderX,
      );
      maxWidth = Math.max(maxWidth, childInnerMax);

      const parentRect = parent.getBoundingClientRect();
      if (parentOuterMax > parentRect.width + 1) break;
      child = parent;
      parent = parent.parentElement;
    }
    return maxWidth;
  }

  function setElementWidth(element, width, minOverride = null, flexWidthOverride = null) {
    if (!isEl(element)) return false;
    const minWidth = Number.isFinite(Number(minOverride)) ? Number(minOverride) : getMinWidth(element);
    const safeWidth = Math.round(clamp(width, minWidth));
    const current = Math.round(element.getBoundingClientRect().width || 0);
    if (Math.abs(safeWidth - current) <= 1) return false;
    const parent = element.parentElement;
    const flexWidth = typeof flexWidthOverride === 'boolean'
      ? flexWidthOverride
      : (isEl(parent)
        && String(getComputedStyle(parent).display).includes('flex')
        && !String(getComputedStyle(parent).flexDirection).includes('column'));
    getAuthority().previewBox(element, { width: safeWidth, flexWidth });
    return true;
  }

  function setElementHeight(element, height, minOverride = null) {
    if (!isEl(element)) return false;
    const minHeight = Number.isFinite(Number(minOverride)) ? Number(minOverride) : getResizeMinHeight(element);
    const safeHeight = Math.round(clamp(height, minHeight));
    const current = Math.round(element.getBoundingClientRect().height || 0);
    if (Math.abs(safeHeight - current) <= 1) return false;
    getAuthority().previewBox(element, { height: safeHeight });
    return true;
  }

  function ensureOwnedContentHeightAfterWidthChange(element, transaction = null) {
    if (!isEl(element) || !element.dataset.sfManualH) return false;
    const required = getRequiredHeight(element);
    const current = Math.round(element.getBoundingClientRect().height || 0);
    if (required <= current + 1) return false;
    if (!setElementHeight(element, required, required)) return false;
    try { transaction?.changedIds?.add?.(ensureNodeId(element)); } catch {}
    return true;
  }

  // Live growth uses only the active child and its exact ancestor chain.
  // It does not scan siblings or clone/measure the whole tree on pointermove.
  function growAncestorEnvelopeLive(element, transaction = null) {
    let child = element;
    let parent = child?.parentElement;
    let changed = 0;
    let guard = 0;

    while (isEl(child) && isEl(parent) && guard++ < 12) {
      if (parent.id === 'site-root' || parent.id === 'st-site-header-slot' || parent.id === 'st-site-main-slot' || parent.id === 'st-site-footer-slot') break;
      if (!parent.matches('.st-block,.st-row,.st-section')) {
        child = parent;
        parent = parent.parentElement;
        continue;
      }

      const childRect = child.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const childStyle = getComputedStyle(child);
      const parentStyle = getComputedStyle(parent);
      const required = Math.ceil(
        childRect.bottom - parentRect.top
        + numPx(childStyle.marginBottom)
        + numPx(parentStyle.paddingBottom)
        + numPx(parentStyle.borderBottomWidth)
      );
      const current = Math.round(parentRect.height || 0);

      if (required > current + 1) {
        // Growth-only preview: no expensive intrinsic subtree measurement is
        // needed because required is derived from the live child boundary.
        setElementHeight(parent, required, MIN_H);
        changed += 1;
        const id = ensureNodeId(parent);
        try { transaction?.changedIds?.add?.(id); } catch {}
        try { transaction?.liveParentGrowIds?.add?.(id); } catch {}
      }

      child = parent;
      parent = parent.parentElement;
    }

    if (transaction) transaction.liveParentGrowSteps = Number(transaction.liveParentGrowSteps || 0) + changed;
    return changed;
  }

  function growAncestorWidthLive(element, transaction = null) {
    let child = element;
    let parent = child?.parentElement;
    let changed = 0;
    let guard = 0;

    while (isEl(child) && isEl(parent) && guard++ < 12) {
      if (parent.id === 'site-root' || parent.id === 'st-site-header-slot' || parent.id === 'st-site-main-slot' || parent.id === 'st-site-footer-slot') break;
      if (!parent.matches('.st-block,.st-row,.st-section')) {
        child = parent;
        parent = parent.parentElement;
        continue;
      }

      const childRect = child.getBoundingClientRect();
      const childBox = getBoxMetrics(child);
      const parentRect = parent.getBoundingClientRect();
      const parentBox = getBoxMetrics(parent);
      const required = Math.ceil(
        childRect.width + childBox.marginX + parentBox.paddingX + parentBox.borderX,
      );
      const allowed = Math.round(getMaxWidthInsideParent(parent, 'e'));

      if (required > parentRect.width + 1) {
        setElementWidth(parent, Math.min(required, allowed), getMinWidth(parent));
        changed += 1;
        try { transaction?.changedIds?.add?.(ensureNodeId(parent)); } catch {}
        try { transaction?.liveParentGrowIds?.add?.(ensureNodeId(parent)); } catch {}
        if (transaction) transaction.liveParentGrowSteps = Number(transaction.liveParentGrowSteps || 0) + 1;
      }

      child = parent;
      parent = parent.parentElement;
    }
    return changed;
  }

  function parseGridTracks(row, expectedCount) {
    try {
      const raw = String(getComputedStyle(row).gridTemplateColumns || '').trim();
      if (!raw || raw === 'none') return null;
      const tracks = raw.match(/-?\d*\.?\d+px/g)?.map((value) => numPx(value)) || [];
      if (tracks.length !== expectedCount || tracks.some((value) => value <= 0)) return null;
      return tracks;
    } catch {
      return null;
    }
  }

  function normalizedSideValue00991(value) {
    return String(value || '').trim().toLowerCase();
  }

  function resolveHorizontalAnchor00991(element) {
    if (!isEl(element)) return 'left';
    const style = getComputedStyle(element);
    const parent = element.parentElement;
    const parentStyle = isEl(parent) ? getComputedStyle(parent) : null;
    const position = normalizedSideValue00991(style.position);
    const left = normalizedSideValue00991(style.left);
    const right = normalizedSideValue00991(style.right);
    if ((position === 'absolute' || position === 'fixed' || position === 'sticky')) {
      if (right && right !== 'auto' && (!left || left === 'auto')) return 'right';
      if (left && left !== 'auto' && (!right || right === 'auto')) return 'left';
      const leftPx00991 = parseFloat(left);
      const rightPx00991 = parseFloat(right);
      if (Number.isFinite(leftPx00991) && Number.isFinite(rightPx00991)) return rightPx00991 < leftPx00991 ? 'right' : 'left';
    }
    const marginLeft = normalizedSideValue00991(style.marginLeft);
    const marginRight = normalizedSideValue00991(style.marginRight);
    // getComputedStyle may resolve auto margins to pixels, so authored class and
    // alignment are checked too.
    if (element.classList.contains('is-right')) return 'right';
    if (element.classList.contains('is-left')) return 'left';
    if (marginLeft === 'auto' && marginRight !== 'auto') return 'right';
    if (marginRight === 'auto' && marginLeft !== 'auto') return 'left';
    const alignSelf = normalizedSideValue00991(style.alignSelf);
    if (['flex-end','end'].includes(alignSelf)) return 'right';
    if (['flex-start','start'].includes(alignSelf)) return 'left';
    if (parentStyle && normalizedSideValue00991(parentStyle.display).includes('flex') && normalizedSideValue00991(parentStyle.flexDirection).includes('column')) {
      const align = alignSelf && alignSelf !== 'auto' ? alignSelf : normalizedSideValue00991(parentStyle.alignItems);
      if (['flex-end','end'].includes(align)) return 'right';
      if (['flex-start','start'].includes(align)) return 'left';
    }
    if (parentStyle && normalizedSideValue00991(parentStyle.display).includes('grid')) {
      const justifySelf = normalizedSideValue00991(style.justifySelf);
      const justify = justifySelf && justifySelf !== 'auto' ? justifySelf : normalizedSideValue00991(parentStyle.justifyItems);
      if (['end','flex-end','right'].includes(justify)) return 'right';
    }
    return 'left';
  }

  function resolveVerticalAnchor00991(element) {
    if (!isEl(element)) return 'top';
    const style = getComputedStyle(element);
    const parent = element.parentElement;
    const parentStyle = isEl(parent) ? getComputedStyle(parent) : null;
    const position = normalizedSideValue00991(style.position);
    const top = normalizedSideValue00991(style.top);
    const bottom = normalizedSideValue00991(style.bottom);
    if ((position === 'absolute' || position === 'fixed' || position === 'sticky')) {
      if (bottom && bottom !== 'auto' && (!top || top === 'auto')) return 'bottom';
      if (top && top !== 'auto' && (!bottom || bottom === 'auto')) return 'top';
      const topPx00991 = parseFloat(top);
      const bottomPx00991 = parseFloat(bottom);
      if (Number.isFinite(topPx00991) && Number.isFinite(bottomPx00991)) return bottomPx00991 < topPx00991 ? 'bottom' : 'top';
    }
    const marginTop = normalizedSideValue00991(style.marginTop);
    const marginBottom = normalizedSideValue00991(style.marginBottom);
    if (marginTop === 'auto' && marginBottom !== 'auto') return 'bottom';
    if (marginBottom === 'auto' && marginTop !== 'auto') return 'top';
    if (parentStyle && normalizedSideValue00991(parentStyle.display).includes('flex') && !normalizedSideValue00991(parentStyle.flexDirection).includes('column')) {
      const alignSelf = normalizedSideValue00991(style.alignSelf);
      const align = alignSelf && alignSelf !== 'auto' ? alignSelf : normalizedSideValue00991(parentStyle.alignItems);
      if (['flex-end','end'].includes(align)) return 'bottom';
      if (['flex-start','start'].includes(align)) return 'top';
    }
    return 'top';
  }

  function resizeAxisModes00991(element, dir) {
    const anchorX = resolveHorizontalAnchor00991(element);
    const anchorY = resolveVerticalAnchor00991(element);
    const horizontalSide = dir.includes('e') ? 'right' : (dir.includes('w') ? 'left' : '');
    const verticalSide = dir.includes('s') ? 'bottom' : (dir.includes('n') ? 'top' : '');
    return Object.freeze({
      anchorX,
      anchorY,
      horizontalSide,
      verticalSide,
      horizontalMode: horizontalSide ? (horizontalSide === anchorX ? 'offset' : 'size') : 'none',
      verticalMode: verticalSide ? (verticalSide === anchorY ? 'offset' : 'size') : 'none',
    });
  }

  function setElementOffset00991(element, property, value) {
    if (!isEl(element) || !property) return false;
    const safe = Math.max(0, Math.round(Number(value) || 0));
    const current = Math.round(numPx(getComputedStyle(element).getPropertyValue(property)) || 0);
    if (Math.abs(safe - current) <= 1) return false;
    getAuthority().previewStyle(element, { [property]: `${safe}px` });
    return true;
  }

  function startContainerPair(event, owner, dir) {
    const row = owner.parentElement;
    if (!isEl(row) || !row.classList.contains('st-row') || !/[ew]/.test(dir)) return false;

    const items = directChildren(row, '.st-block').filter((child) => !child.classList.contains('st-resize'));
    const index = items.indexOf(owner);
    if (index < 0) return false;

    const side = dir.includes('w') ? 'w' : 'e';
    const adjacentIndex = side === 'e' ? index + 1 : index - 1;
    const adjacent = items[adjacentIndex] || null;
    if (!adjacent) return false;

    const style = getComputedStyle(row);
    const display = String(style.display || '');
    const flexDirection = String(style.flexDirection || '').toLowerCase();
    // A vertical flex level stacks siblings top-to-bottom. Pairing their widths
    // on an east/west drag corrupts an unrelated sibling (Hero copy vs category
    // strip was the concrete failure). Fall through to startBoxResize instead.
    if (display.includes('flex') && flexDirection.includes('column')) return false;
    const measuredWidths = items.map((item) => Number(item.getBoundingClientRect().width || 0));
    const gridTracks = display.includes('grid') ? parseGridTracks(row, items.length) : null;
    const sourceWidths = gridTracks || measuredWidths;
    if (sourceWidths.some((width) => !Number.isFinite(width) || width <= 0)) return false;
    if (!gridTracks && !display.includes('flex')) return false;

    // Integerize all measured tracks once while preserving their rounded total.
    // Only the active pair is written during resize; all other widths are a
    // read-only invariant snapshot.
    const widths = Array.from(normalizeMeasuredWidths(sourceWidths));
    const mins = items.map((item, itemIndex) => resolveSessionFloor00989(getMinWidth(item), widths[itemIndex], MIN_BLOCK_W));
    const startActiveW = widths[index];
    const startAdjacentW = widths[adjacentIndex];
    const initialEquation = solveAdjacentPair({
      startActiveWidth: startActiveW,
      startAdjacentWidth: startAdjacentW,
      rawDelta: 0,
      minActiveWidth: mins[index],
      minAdjacentWidth: mins[adjacentIndex],
    });

    getAuthority().beginTransaction({
      owner,
      area: getArea(owner),
      type: gridTracks ? 'grid-pair' : 'flex-pair',
      dir,
    });

    const axisModes00991 = resizeAxisModes00991(owner, dir);
    const ownerStyle00991 = getComputedStyle(owner);
    state.active = {
      type: gridTracks ? 'grid-pair' : 'flex-pair',
      pointerId: event.pointerId,
      owner,
      row,
      dir,
      side,
      ...axisModes00991,
      startMarginLeft: numPx(ownerStyle00991.marginLeft),
      startMarginRight: numPx(ownerStyle00991.marginRight),
      startMarginTop: numPx(ownerStyle00991.marginTop),
      startMarginBottom: numPx(ownerStyle00991.marginBottom),
      items,
      widths,
      mins,
      index,
      adjacentIndex,
      pairIndexes: [index, adjacentIndex],
      startX: event.clientX,
      startY: event.clientY,
      startActiveW,
      startAdjacentW,
      pairTotal: initialEquation.pairTotal,
      initialEquation,
      lastEquation: initialEquation,
      nonAdjacentStartWidths: widths.map((width, itemIndex) => (itemIndex === index || itemIndex === adjacentIndex ? null : width)),
      rowTrackTotal: widths.reduce((sum, width) => sum + width, 0),
      canvasClientWidthStart: getCanvasClientWidth(),
      canvasScrollbarGutter: getCanvasScrollbarGutter(),
      startH: Math.max(1, Math.round(owner.getBoundingClientRect().height || 1)),
      measuredMinH: Math.round(getResizeMinHeight(owner)),
      minH: resolveSessionMinHeight00993(owner, getResizeMinHeight(owner), Math.max(1, Math.round(owner.getBoundingClientRect().height || 1)), MIN_H),
      directChildHeights: getDirectContentChildren(owner).map((child) => ({
        id: ensureNodeId(child),
        height: Math.round(child.getBoundingClientRect().height || 0),
      })),
      changedIds: new Set(),
      liveParentGrowIds: new Set(),
      liveParentGrowSteps: 0,
      rafId: 0,
      pendingX: event.clientX,
      pendingY: event.clientY,
      horizontalChanged: false,
      verticalChanged: false,
    };
    return true;
  }

  function applyPairWidths(active) {
    return getAuthority().previewPair({
      type: active.type,
      row: active.row,
      items: active.items,
      widths: active.widths,
      pairIndexes: active.pairIndexes,
    });
  }

  function startBoxResize(event, owner, dir) {
    const rect = owner.getBoundingClientRect();
    getAuthority().beginTransaction({ owner, area: getArea(owner), type: 'box', dir });
    const startW = Math.max(1, Math.round(rect.width || 1));
    const startH = Math.max(1, Math.round(rect.height || 1));
    const measuredMinW = Math.round(getMinWidth(owner));
    const measuredMinH = Math.round(getResizeMinHeight(owner));
    const axisModes00991 = resizeAxisModes00991(owner, dir);
    const ownerStyle00991 = getComputedStyle(owner);
    state.active = {
      type: 'box',
      pointerId: event.pointerId,
      owner,
      dir,
      startX: event.clientX,
      startY: event.clientY,
      startW,
      startH,
      measuredMinW,
      measuredMinH,
      ...axisModes00991,
      startMarginLeft: numPx(ownerStyle00991.marginLeft),
      startMarginRight: numPx(ownerStyle00991.marginRight),
      startMarginTop: numPx(ownerStyle00991.marginTop),
      startMarginBottom: numPx(ownerStyle00991.marginBottom),
      minW: resolveSessionFloor00989(measuredMinW, startW, getKind(owner) === 'block' ? MIN_BLOCK_W : MIN_CONTAINER_W),
      minH: resolveSessionMinHeight00993(owner, measuredMinH, startH, MIN_H),
      directChildHeights: getDirectContentChildren(owner).map((child) => ({
        id: ensureNodeId(child),
        height: Math.round(child.getBoundingClientRect().height || 0),
      })),
      maxW: Math.round(getExpandableMaxWidth(owner, dir)),
      flexWidth: isEl(owner.parentElement)
        && String(getComputedStyle(owner.parentElement).display).includes('flex')
        && !String(getComputedStyle(owner.parentElement).flexDirection).includes('column'),
      changedIds: new Set(),
      liveParentGrowIds: new Set(),
      liveParentGrowSteps: 0,
      rafId: 0,
      pendingX: event.clientX,
      pendingY: event.clientY,
      horizontalChanged: false,
      verticalChanged: false,
    };
    return true;
  }


  function onPointerDown(event) {
    const handle = getHandle(event);
    if (!handle) {
      primeMainDrag(event);
      return;
    }
    const owner = getOwnerFromHandle(handle);
    if (!isEl(owner)) {
      log('invalid-handle-owner', { handle: rectOf(handle), className: String(handle.className || '') }, 'warn');
      return;
    }

    const area = getArea(owner);
    if (!area) return;
    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation?.(); } catch {}

    const meta = markNode(owner);
    selectNode(owner);
    const dir = String(handle.dataset.dir || handle.dataset.stDir || 'se').toLowerCase();

    let started = false;
    const axisModes00991 = resizeAxisModes00991(owner, dir);
    if (meta.kind === 'container' && owner.parentElement?.classList?.contains('st-row') && /[ew]/.test(dir) && axisModes00991.horizontalMode === 'size') {
      started = startContainerPair(event, owner, dir);
    }
    if (!started) started = startBoxResize(event, owner, dir);
    if (!started) return;

    try { owner.setPointerCapture?.(event.pointerId); } catch {}
    document.documentElement.classList.add('sf-edit-resizing');
    log('resize-start', {
      area,
      kind: meta.kind,
      id: meta.id,
      dir,
      tree: meta.tree,
      rect: rectOf(owner),
      transaction: state.active.type,
      mutationScope: state.active.type === 'box' ? 1 : 2,
      pairIndexes: state.active.pairIndexes ? [...state.active.pairIndexes] : null,
      pairEquationStart: state.active.initialEquation || null,
      rowItemCount: Array.isArray(state.active.items) ? state.active.items.length : null,
      intrinsicMinHeight: state.active.measuredMinH ?? state.active.minH,
      sessionMinHeight: state.active.minH,
      intrinsicMinWidth: state.active.measuredMinW ?? null,
      sessionMinWidth: state.active.minW ?? null,
      conditionalSlideChildren: getDirectContentChildren(owner).filter((child) => child.hasAttribute('data-st-fx-bind-slide')).length,
      directChildCount: state.active.directChildHeights?.length || 0,
      anchorX: state.active.anchorX || axisModes00991.anchorX,
      anchorY: state.active.anchorY || axisModes00991.anchorY,
      horizontalMode: state.active.horizontalMode || axisModes00991.horizontalMode,
      verticalMode: state.active.verticalMode || axisModes00991.verticalMode,
    });
  }

  function onPointerMove(event) {
    if (state.dragCandidate && state.dragCandidate.pointerId === event.pointerId && !state.drag) {
      const dx = Number(event.clientX - state.dragCandidate.startX) || 0;
      const dy = Number(event.clientY - state.dragCandidate.startY) || 0;
      if (Math.hypot(dx, dy) >= 6) beginMainDrag(event);
    }
    if (state.drag && state.drag.pointerId === event.pointerId) {
      event.preventDefault();
      event.stopPropagation();
      try { event.stopImmediatePropagation?.(); } catch {}
      updateMainDropMarker(event);
      return;
    }

    const active = state.active;
    if (!active || event.pointerId !== active.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation?.(); } catch {}

    active.pendingX = event.clientX;
    active.pendingY = event.clientY;
    if (!active.rafId) {
      active.rafId = requestAnimationFrame(() => {
        active.rafId = 0;
        applyResizeFrame(active, active.pendingX, active.pendingY);
      });
    }
  }

  function applyResizeFrame(active, clientX, clientY) {
    if (!active || state.active !== active) return;
    const dx = Number(clientX - active.startX) || 0;
    const dy = Number(clientY - active.startY) || 0;
    const horizontal = /[ew]/.test(active.dir);
    const vertical = /[ns]/.test(active.dir);

    if (active.type === 'grid-pair' || active.type === 'flex-pair') {
      const rawDelta = active.side === 'e' ? dx : -dx;
      const equation = solveAdjacentPair({
        startActiveWidth: active.startActiveW,
        startAdjacentWidth: active.startAdjacentW,
        rawDelta,
        minActiveWidth: active.mins[active.index],
        minAdjacentWidth: active.mins[active.adjacentIndex],
      });
      if (!active.lastEquation || equation.activeWidth !== active.lastEquation.activeWidth || equation.adjacentWidth !== active.lastEquation.adjacentWidth) {
        active.lastEquation = equation;
        active.widths[active.index] = equation.activeWidth;
        active.widths[active.adjacentIndex] = equation.adjacentWidth;
        applyPairWidths(active);
        active.changedIds.add(ensureNodeId(active.owner));
        active.changedIds.add(ensureNodeId(active.items[active.adjacentIndex]));
        active.horizontalChanged = active.horizontalChanged || equation.appliedDelta !== 0;
      }

      if (vertical) {
        if (active.verticalMode === 'offset') {
          const property = active.anchorY === 'bottom' ? 'margin-bottom' : 'margin-top';
          const rawOffset = active.anchorY === 'bottom' ? active.startMarginBottom - dy : active.startMarginTop + dy;
          if (setElementOffset00991(active.owner, property, rawOffset)) {
            active.changedIds.add(ensureNodeId(active.owner));
            active.verticalChanged = true;
          }
        } else {
          const rawHeight = active.dir.includes('s') ? active.startH + dy : active.startH - dy;
          if (setElementHeight(active.owner, rawHeight, active.minH)) {
            active.changedIds.add(ensureNodeId(active.owner));
            active.verticalChanged = true;
            growAncestorEnvelopeLive(active.owner, active);
          }
        }
      }
      return;
    }

    const owner = active.owner;
    if (horizontal) {
      if (active.horizontalMode === 'offset') {
        const property = active.anchorX === 'right' ? 'margin-right' : 'margin-left';
        const rawOffset = active.anchorX === 'right'
          ? active.startMarginRight - dx
          : active.startMarginLeft + dx;
        if (setElementOffset00991(owner, property, rawOffset)) {
          active.changedIds.add(ensureNodeId(owner));
          active.horizontalChanged = true;
        }
      } else {
        const rawWidth = active.dir.includes('e') ? active.startW + dx : active.startW - dx;
        if (setElementWidth(owner, clamp(rawWidth, active.minW, active.maxW), active.minW, active.flexWidth)) {
          active.changedIds.add(ensureNodeId(owner));
          active.horizontalChanged = true;
          growAncestorWidthLive(owner, active);
          if (ensureOwnedContentHeightAfterWidthChange(owner, active)) active.verticalChanged = true;
          // Width changes can legitimately reflow text and increase the owner's
          // natural height. Propagate only that live rendered boundary through
          // the exact ancestor path; never remeasure hidden siblings/subtrees.
          growAncestorEnvelopeLive(owner, active);
        }
      }
    }

    if (vertical) {
      if (active.verticalMode === 'offset') {
        const property = active.anchorY === 'bottom' ? 'margin-bottom' : 'margin-top';
        const rawOffset = active.anchorY === 'bottom'
          ? active.startMarginBottom - dy
          : active.startMarginTop + dy;
        if (setElementOffset00991(owner, property, rawOffset)) {
          active.changedIds.add(ensureNodeId(owner));
          active.verticalChanged = true;
        }
      } else {
        const rawHeight = active.dir.includes('s') ? active.startH + dy : active.startH - dy;
        if (setElementHeight(owner, rawHeight, active.minH)) {
          active.changedIds.add(ensureNodeId(owner));
          active.verticalChanged = true;
          growAncestorEnvelopeLive(owner, active);
        }
      }
    }
  }

  function directChildrenHeightInvariant(active) {
    const before = Array.isArray(active?.directChildHeights) ? active.directChildHeights : [];
    if (!before.length || !isEl(active?.owner)) return { stable: true, changed: [] };
    const byId = new Map(getDirectContentChildren(active.owner).map((child) => [ensureNodeId(child), child]));
    const changed = [];
    for (const item of before) {
      const child = byId.get(item.id);
      if (!isEl(child)) continue;
      const after = Math.round(child.getBoundingClientRect().height || 0);
      if (Math.abs(after - item.height) > 1) changed.push({ id: item.id, before: item.height, after });
    }
    return { stable: changed.length === 0, changed };
  }

  function onPointerUp(event) {
    if (state.drag && state.drag.pointerId === event.pointerId) {
      event.preventDefault();
      event.stopPropagation();
      try { event.stopImmediatePropagation?.(); } catch {}
      finishMainDrag(event, event.type === 'pointercancel');
      return;
    }
    if (state.dragCandidate?.pointerId === event.pointerId) state.dragCandidate = null;

    const active = state.active;
    if (!active || event.pointerId !== active.pointerId) return;

    event.preventDefault();
    event.stopPropagation();
    try { event.stopImmediatePropagation?.(); } catch {}

    if (active.rafId) {
      cancelAnimationFrame(active.rafId);
      active.rafId = 0;
      applyResizeFrame(active, active.pendingX, active.pendingY);
    }
    const childInvariant = directChildrenHeightInvariant(active);
    let pairInvariant = null;
    if (active.type === 'grid-pair' || active.type === 'flex-pair') {
      const equation = active.lastEquation || active.initialEquation || null;
      const nonAdjacentWidthChanges = [];
      for (let itemIndex = 0; itemIndex < active.items.length; itemIndex += 1) {
        if (itemIndex === active.index || itemIndex === active.adjacentIndex) continue;
        const before = active.nonAdjacentStartWidths?.[itemIndex];
        if (!Number.isFinite(Number(before))) continue;
        const after = Math.round(active.items[itemIndex].getBoundingClientRect().width || 0);
        if (Math.abs(after - Number(before)) > 1) {
          nonAdjacentWidthChanges.push({
            id: ensureNodeId(active.items[itemIndex]),
            index: itemIndex,
            before: Number(before),
            after,
          });
        }
      }
      pairInvariant = {
        equationVersion: SITE_FRAME_RESIZE_EQUATIONS_VERSION,
        pairIndexes: [...active.pairIndexes],
        pairTotal: Number(equation?.pairTotal || active.pairTotal || 0),
        activeWidth: Number(equation?.activeWidth || active.startActiveW || 0),
        adjacentWidth: Number(equation?.adjacentWidth || active.startAdjacentW || 0),
        appliedDelta: Number(equation?.appliedDelta || 0),
        conservationError: Number(equation?.conservationError || 0),
        conserved: equation?.conserved === true,
        activeMinimum: Number(equation?.activeMinimum || 0),
        adjacentMinimum: Number(equation?.adjacentMinimum || 0),
        canvasClientWidthStart: Number(active.canvasClientWidthStart || 0),
        canvasClientWidthEnd: getCanvasClientWidth(),
        canvasClientWidthStable: Number(active.canvasClientWidthStart || 0) === getCanvasClientWidth(),
        scrollbarGutter: String(active.canvasScrollbarGutter || getCanvasScrollbarGutter()),
        nonAdjacentWidthsStable: nonAdjacentWidthChanges.length === 0,
        nonAdjacentWidthChanges,
      };
    }

    state.active = null;
    document.documentElement.classList.remove('sf-edit-resizing');
    try { active.owner?.releasePointerCapture?.(event.pointerId); } catch {}
    try { markNode(active.owner); } catch {}

    const localEnvelopeChanges = active.changedIds?.size || 0;
    const liveParentGrowChanges = active.liveParentGrowIds?.size || 0;
    if (liveParentGrowChanges > 0) {
      log('live-parent-grow-committed', {
        sourceId: active.owner?.dataset?.sfId || '',
        changed: liveParentGrowChanges,
        steps: Number(active.liveParentGrowSteps || 0),
        ids: Array.from(active.liveParentGrowIds || []).slice(0, 16),
        sharedAreas: ['header', 'main', 'footer'],
      });
    }
    if (localEnvelopeChanges > 0) {
      log('local-envelope-committed', {
        sourceId: active.owner?.dataset?.sfId || '',
        changed: localEnvelopeChanges,
        ids: Array.from(active.changedIds || []).slice(0, 16),
      });
    }

    const transactionResult = getAuthority().commitTransaction(active.owner, 'resize-end');
    log('resize-end', {
      id: active.owner?.dataset?.sfId || '',
      area: getArea(active.owner),
      kind: getKind(active.owner),
      rect: rectOf(active.owner),
      transaction: active.type,
      mutationScope: active.type === 'box' ? 1 : 2,
      globalTreeMutation: false,
      rowRedistribution: false,
      pairEquation: pairInvariant,
      pairConserved: pairInvariant ? pairInvariant.conserved : null,
      nonAdjacentWidthsStable: pairInvariant ? pairInvariant.nonAdjacentWidthsStable : null,
      frameEnvelopeCommit: false,
      localEnvelopeChanges,
      liveParentGrow: true,
      liveParentGrowChanges,
      liveParentGrowSteps: Number(active.liveParentGrowSteps || 0),
      liveParentGrowMeasurement: 'active-child-bottom-only',
      hiddenChildrenExcludedFromEnvelope: true,
      sliderBoundChildrenUseCanonicalCurrentIndex: true,
      resizeSessionIdentityFloor: true,
      liveContentShrinkFloor00993: true,
      pointerupSubtreeEnvelopePass: false,
      rafCoalescedPreview: true,
      horizontalChanged: !!active.horizontalChanged,
      verticalChanged: !!active.verticalChanged,
      storeTransactionId: transactionResult?.id || '',
      storeAuthority: true,
      directDomGeometryWrites: false,
      diagonalResize: true,
      diagonalPairResize: true,
      strictAxis: true,
      anchorAwareEdges00991: true,
      anchorX: active.anchorX || '',
      anchorY: active.anchorY || '',
      horizontalMode: active.horizontalMode || '',
      verticalMode: active.verticalMode || '',
      liveTreeMeasurement: false,
      reversibleVerticalShrink: true,
      directChildrenHeightStable: childInvariant.stable,
      directChildrenHeightChanges: childInvariant.changed,
    });
    publishEditGestureEnd('resize', active.owner, event.type === 'pointercancel');
  }

  function scanTree() {
    const roots = ['#st-site-header-slot', '#st-site-main-slot', '#st-site-footer-slot'];
    let marked = 0;
    const visit = (node) => {
      if (!isEl(node)) return;
      markNode(node);
      marked += 1;
      for (const child of directFrameChildren(node)) visit(child);
    };
    for (const selector of roots) visit(document.querySelector(selector));
    log('scan-tree-metadata-only', { marked, geometryWrites: 0, canonicalTree: true });
    return marked;
  }

  function installStyle() {
    if (document.getElementById('sf-edit-layer-style-00882')) return;
    const style = document.createElement('style');
    style.id = 'sf-edit-layer-style-00882';
    style.textContent = `
      html.sf-edit-resizing, html.sf-edit-resizing * { user-select: none !important; }
      html.sf-edit-dragging, html.sf-edit-dragging * { user-select: none !important; cursor: grabbing !important; }
      #st-site-main-slot .sf-main-drag-source { opacity: .45 !important; }
      #st-site-main-slot .sf-main-drag-target { outline: 2px solid rgba(37,99,235,.55) !important; outline-offset: -2px !important; }
      #st-site-main-slot .sf-main-drag-drop-marker { display: block !important; box-sizing: border-box !important; pointer-events: none !important; background: #2563eb !important; border: 0 !important; border-radius: 999px !important; z-index: 2147483200 !important; }
      #st-site-main-slot .sf-main-drag-drop-marker[data-axis="row"] { width: 4px !important; min-width: 4px !important; height: auto !important; min-height: 28px !important; align-self: stretch !important; flex: 0 0 4px !important; margin: 0 3px !important; }
      #st-site-main-slot .sf-main-drag-drop-marker[data-axis="column"] { height: 4px !important; min-height: 4px !important; width: 100% !important; flex: 0 0 4px !important; margin: 3px 0 !important; }
    `;
    document.head.appendChild(style);
  }

  function boot() {
    installStyle();
    scanTree();
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('click', suppressPostDragClick, true);
    document.addEventListener('st:templates-applied', () => queueMicrotask(scanTree), true);
    window.addEventListener('st:canvas-apply-snapshot', () => queueMicrotask(scanTree), true);
    window.addEventListener('load', () => queueMicrotask(scanTree), { once: true });

    window.ST_SITE_FRAME_EDIT_LAYER_00882 = Object.freeze({
      version: VERSION,
      contract: Object.freeze({
        exactHandleOwner: true,
        mutationScope: 'active-node-adjacent-pair-and-exact-ancestor-path',
        globalTreeMutations: false,
        rowRedistribution: false,
        frameEnvelopeCommit: false,
        menuSpecialCases: false,
        versionAliases: false,
        directParentEnvelope: true,
        liveAncestorGrowDuringPointer: true,
        liveParentGrowAreas: Object.freeze(['header', 'main', 'footer']),
        liveParentGrowMeasurement: 'active-child-bottom-only',
        hiddenChildrenExcludedFromEnvelope: true,
        sliderBoundChildrenUseCanonicalCurrentIndex: true,
        resizeSessionIdentityFloor: true,
      liveContentShrinkFloor00993: true,
        pointerupSubtreeEnvelopePass: false,
        rafCoalescedPreview: true,
        editGestureLifecycleEvent: 'st:site-frame-edit-gesture-end',
        resizeEquationsVersion: SITE_FRAME_RESIZE_EQUATIONS_VERSION,
        adjacentPairEquation: 'active-plus-adjacent-constant',
        integerPixelConservation: true,
        pairOnlyStorePatches: true,
        nonAdjacentWidthsInvariant: true,
        pairMinimumRule: 'intrinsic-or-current-if-already-undersized',
        pairCanvasWidthInvariant: true,
        canvasScrollbarGutter: 'stable',
        centeredChildFeedbackLoop: false,
        intrinsicMinContentWidth: true,
        textBlockIntrinsicMinWidth: false,
        textBlockWrapFloor: 'structural-min-only',
        concatenatedTextMinWidth: false,
        storeTransactionAuthority: true,
        rendererOwnedGeometryWrites: true,
        directDomGeometryWrites: false,
        diagonalResize: true,
        diagonalPairResize: true,
        strictAxisResize: true,
      anchorAwareEdges00991: true,
      anchoredSideChangesOffset: true,
      oppositeSideChangesSize: true,
        anchorAwareEdges00991: true,
        anchoredSideChangesOffset: true,
        oppositeSideChangesSize: true,
        offsetProperties: Object.freeze(['margin-left','margin-right','margin-top','margin-bottom']),
        pureHorizontalChangesHeight: false,
        horizontalReflowMayGrowAncestors: true,
        livePointerTreeMeasurement: false,
        previousSelectionOnlyCleanup: true,
        reversibleVerticalShrink: true,
        intrinsicHeightIgnoresOwnedHeight: true,
        parentFloorIgnoresRenderedChildStretch: true,
        parentResizeMutatesChildren: false,
        directChildrenHeightInvariant: true,
        domStructureContract: SITE_FRAME_DOM_STRUCTURE_VERSION,
        canonicalFrameTargetResolution: true,
        canonicalTreeScan: true,
        sharedDragContract: true,
        mainDrag: true,
        mainResize: true,
        resizeAreas: Object.freeze(['header', 'main', 'footer']),
        dragAreas: Object.freeze(['main']),
        dragMode: 'same-parent-plus-block-reparent',
        textEditableBlockDrag: true,
        textEditableDragThresholdPx: 6,
        textEditClickStillFocuses: true,
        blockCrossContainer: true,
        dragStoreAuthority: true,
        dragDirectDomCommit: false,
      }),
      scanTree,
      markNode,
      getMinWidth,
      solveAdjacentPair,
    });

    log('boot', {
      ok: true,
      exactHandleOwner: true,
      globalTreeMutations: false,
      rowRedistribution: false,
      frameEnvelopeCommit: false,
      menuSpecialCases: false,
      versionAliases: false,
      directParentEnvelope: true,
      liveAncestorGrowDuringPointer: true,
      liveParentGrowAreas: ['header', 'main', 'footer'],
      liveParentGrowMeasurement: 'active-child-bottom-only',
      hiddenChildrenExcludedFromEnvelope: true,
      sliderBoundChildrenUseCanonicalCurrentIndex: true,
      resizeSessionIdentityFloor: true,
      liveContentShrinkFloor00993: true,
      textBlockIntrinsicMinWidth: false,
      textBlockWrapFloor: 'structural-min-only',
      pointerupSubtreeEnvelopePass: false,
      rafCoalescedPreview: true,
      editGestureLifecycleEvent: 'st:site-frame-edit-gesture-end',
      resizeEquationsVersion: SITE_FRAME_RESIZE_EQUATIONS_VERSION,
      adjacentPairEquation: 'active-plus-adjacent-constant',
      integerPixelConservation: true,
      pairOnlyStorePatches: true,
      nonAdjacentWidthsInvariant: true,
      pairMinimumRule: 'intrinsic-or-current-if-already-undersized',
      pairCanvasWidthInvariant: true,
      canvasScrollbarGutter: 'stable',
      centeredChildFeedbackLoop: false,
      intrinsicMinContentWidth: true,
      concatenatedTextMinWidth: false,
      storeTransactionAuthority: true,
      rendererOwnedGeometryWrites: true,
      directDomGeometryWrites: false,
      diagonalResize: true,
      diagonalPairResize: true,
      strictAxisResize: true,
      pureHorizontalChangesHeight: false,
      livePointerTreeMeasurement: false,
      reversibleVerticalShrink: true,
      intrinsicHeightIgnoresOwnedHeight: true,
      parentFloorIgnoresRenderedChildStretch: true,
      parentResizeMutatesChildren: false,
      directChildrenHeightInvariant: true,
      domStructureContract: SITE_FRAME_DOM_STRUCTURE_VERSION,
      canonicalFrameTargetResolution: true,
      canonicalTreeScan: true,
      textEditableBlockDrag: true,
      textEditableDragThresholdPx: 6,
      textEditClickStillFocuses: true,
      mainResize: true,
      resizeAreas: ['header', 'main', 'footer'],
    });
  }

  try {
    boot();
  } catch (error) {
    log('boot-error', { message: String(error?.message || error || '') }, 'error');
  }
})();
