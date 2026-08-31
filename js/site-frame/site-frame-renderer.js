import { KIND, isNumericSize, normalizeEdges } from './site-frame-contract.js';
import { getEffectiveResponsiveNode00991, getResponsiveEditScope00991 } from '../responsive-viewport/responsive-edit-scope-00991.js?v=00991';

export class SiteFrameRenderer {
  constructor(store, rootElement, options = {}) {
    this.store = store;
    this.rootElement = rootElement;
    this.options = options;
    this.selectedId = null;
    this.onSelect = options.onSelect || (() => {});
    this.onResizeStart = options.onResizeStart || (() => {});
  }

  render() {
    if (!this.rootElement) throw new Error('SiteFrameRenderer requires rootElement');
    this.rootElement.innerHTML = '';
    this.rootElement.classList.add('sf-root');
    const root = this.store.get(this.store.rootId);
    for (const areaId of root.children) {
      this.rootElement.appendChild(this.renderNode(areaId));
    }
  }

  renderNode(nodeId) {
    const node = this.store.get(nodeId);
    const el = document.createElement(this.tagFor(node));
    el.className = this.classFor(node);
    el.dataset.sfId = node.id;
    el.dataset.sfArea = node.area || '';
    el.dataset.sfKind = node.kind;
    el.dataset.sfComponent = node.componentType || '';
    el.dataset.sfDepth = String(node.tree?.depth ?? 0);
    el.dataset.sfContainerDepth = String(node.tree?.containerDepth ?? 0);
    if (node.id === this.selectedId) el.classList.add('is-selected');
    this.applyBox(el, node);
    this.applyLayout(el, node);
    this.applyStyle(el, node);

    el.addEventListener('pointerdown', event => {
      if (event.target?.classList?.contains('sf-resize')) return;
      event.stopPropagation();
      this.selectedId = node.id;
      this.onSelect(node.id);
      this.render();
    });

    if (node.kind === KIND.BLOCK) this.renderBlockContent(el, node);
    else for (const childId of node.children) el.appendChild(this.renderNode(childId));

    if (node.kind !== KIND.SITE && node.kind !== KIND.AREA) this.appendResizeHandles(el, node);
    return el;
  }

  tagFor(node) {
    if (node.kind === KIND.AREA && node.area === 'header') return 'header';
    if (node.kind === KIND.AREA && node.area === 'main') return 'main';
    if (node.kind === KIND.AREA && node.area === 'footer') return 'footer';
    if (node.kind === KIND.SECTION) return 'section';
    return 'div';
  }

  classFor(node) {
    return [
      'sf-node',
      `sf-kind-${node.kind}`,
      node.area ? `sf-area-${node.area}` : '',
      node.componentType ? `sf-component-${node.componentType}` : ''
    ].filter(Boolean).join(' ');
  }

  applyBox(el, node) {
    const { width, height } = node.box || {};
    if (isNumericSize(width)) el.style.width = `${width}px`;
    else if (width === '100%') el.style.width = '100%';
    else el.style.width = '';
    if (isNumericSize(height)) el.style.height = `${height}px`;
    else el.style.height = '';
  }

  applyLayout(el, node) {
    const layout = node.layout || {};
    const padding = normalizeEdges(layout.padding, 0);
    el.style.padding = `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`;
    el.style.gap = `${Number(layout.gap || 0)}px`;
    if (layout.mode === 'row') {
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.flexWrap = layout.wrap ? 'wrap' : 'nowrap';
    } else if (layout.mode === 'column') {
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.flexWrap = 'nowrap';
    } else {
      el.style.display = 'block';
    }
    el.style.alignItems = alignCss(layout.alignY || 'start');
    el.style.justifyContent = justifyCss(layout.alignX || 'start');
  }

  applyStyle(el, node) {
    const style = node.style || {};
    for (const [key, value] of Object.entries(style)) {
      if (value == null) continue;
      el.style[key] = String(value);
    }
  }

  renderBlockContent(el, node) {
    if (node.componentType === 'icon') {
      el.textContent = node.content?.text || '●';
      return;
    }
    if (node.componentType === 'image') {
      const img = document.createElement('img');
      img.src = node.content?.src || '';
      img.alt = node.content?.alt || '';
      el.appendChild(img);
      return;
    }
    el.textContent = node.content?.text || node.componentType || 'block';
  }

  appendResizeHandles(el, node) {
    for (const dir of ['n', 'e', 's', 'w', 'se']) {
      const handle = document.createElement('div');
      handle.className = `sf-resize sf-resize-${dir}`;
      handle.dataset.dir = dir;
      handle.dataset.sfId = node.id;
      handle.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        this.onResizeStart(node.id, dir, event);
      });
      el.appendChild(handle);
    }
  }
}

function alignCss(value) {
  if (value === 'center') return 'center';
  if (value === 'end') return 'flex-end';
  if (value === 'stretch') return 'stretch';
  return 'flex-start';
}

function justifyCss(value) {
  if (value === 'center') return 'center';
  if (value === 'end') return 'flex-end';
  if (value === 'space-between') return 'space-between';
  return 'flex-start';
}

// 00876: renderer for the existing authored Header/Main/Footer DOM.
// It never rebuilds template markup. It renders store-owned geometry/style state
// onto the exact node identified by data-sf-id.

function stylePriority00960(node, property, rawValue) {
  const authored = node?.meta?.authoredStyle00960;
  if (authored && typeof authored === 'object' && Object.prototype.hasOwnProperty.call(authored, property)) {
    const original = String(authored[property] ?? '');
    const current = String(rawValue ?? '');
    if (original === current) {
      const authoredPriority00987 = node?.meta?.authoredStylePriority00987;
      return String(authoredPriority00987 && typeof authoredPriority00987 === 'object' ? authoredPriority00987[property] || '' : '');
    }
  }
  return 'important';
}

export class SiteFrameDomRenderer {
  constructor(store, documentRef = document) {
    this.store = store;
    this.document = documentRef;
  }

  findElement(nodeId) {
    if (!nodeId) return null;
    const escaped = globalThis.CSS?.escape
      ? globalThis.CSS.escape(String(nodeId))
      : String(nodeId).replace(/(["\\])/g, '\\$1');
    return this.document.querySelector(`[data-sf-id="${escaped}"]`);
  }

  renderNode(nodeId, exactElement = null) {
    const baseNode = this.store.maybeGet(nodeId);
    const element = exactElement instanceof HTMLElement
      && String(exactElement.dataset?.sfId || '') === String(nodeId || '')
      ? exactElement
      : this.findElement(nodeId);
    if (!baseNode || !(element instanceof HTMLElement)) return false;

    const scope = getResponsiveEditScope00991();
    const node = getEffectiveResponsiveNode00991(baseNode, scope) || baseNode;
    const geometry = node.meta?.geometry || {};
    const baseGeometry = baseNode.meta?.geometry || {};
    const box = node.box || {};
    const authored = baseNode.meta?.authoredStyle00960 && typeof baseNode.meta.authoredStyle00960 === 'object'
      ? baseNode.meta.authoredStyle00960
      : null;
    const authoredPriority = baseNode.meta?.authoredStylePriority00987 && typeof baseNode.meta.authoredStylePriority00987 === 'object'
      ? baseNode.meta.authoredStylePriority00987
      : null;
    const allResponsive = baseNode.responsive && typeof baseNode.responsive === 'object' ? Object.values(baseNode.responsive) : [];
    const hasResponsiveWidth = allResponsive.some(entry => entry?.meta?.geometry?.widthOwned === true || Object.prototype.hasOwnProperty.call(entry?.box || {}, 'width'));
    const hasResponsiveHeight = allResponsive.some(entry => entry?.meta?.geometry?.heightOwned === true || Object.prototype.hasOwnProperty.call(entry?.box || {}, 'height'));

    element.style.setProperty('box-sizing', 'border-box', 'important');
    element.dataset.sfResponsiveProfile = scope.scoped ? scope.profileId : 'base';

    if (geometry.widthOwned === true && typeof box.width === 'number' && Number.isFinite(box.width)) {
      element.style.setProperty('width', `${Math.round(box.width)}px`, 'important');
      element.style.setProperty('min-width', '0px', 'important');
      element.style.setProperty('max-width', 'none', 'important');
      element.dataset.sfManualW = String(Math.round(box.width));
    } else if (geometry.clearWidth === true || (hasResponsiveWidth && baseGeometry.widthOwned !== true)) {
      if (authored && Object.prototype.hasOwnProperty.call(authored, 'width')) {
        element.style.setProperty('width', String(authored.width || ''), String(authoredPriority?.width || ''));
      } else element.style.removeProperty('width');
      if (authored && Object.prototype.hasOwnProperty.call(authored, 'min-width')) element.style.setProperty('min-width', String(authored['min-width'] || ''), String(authoredPriority?.['min-width'] || ''));
      else element.style.removeProperty('min-width');
      if (authored && Object.prototype.hasOwnProperty.call(authored, 'max-width')) element.style.setProperty('max-width', String(authored['max-width'] || ''), String(authoredPriority?.['max-width'] || ''));
      else element.style.removeProperty('max-width');
      delete element.dataset.sfManualW;
    }

    if (geometry.heightOwned === true && typeof box.height === 'number' && Number.isFinite(box.height)) {
      element.style.setProperty('height', `${Math.round(box.height)}px`, 'important');
      element.style.setProperty('min-height', '0px', 'important');
      element.style.setProperty('max-height', 'none', 'important');
      element.dataset.sfManualH = String(Math.round(box.height));
    } else if (geometry.clearHeight === true || (hasResponsiveHeight && baseGeometry.heightOwned !== true)) {
      if (authored && Object.prototype.hasOwnProperty.call(authored, 'height')) {
        element.style.setProperty('height', String(authored.height || ''), String(authoredPriority?.height || ''));
      } else element.style.removeProperty('height');
      if (authored && Object.prototype.hasOwnProperty.call(authored, 'min-height')) element.style.setProperty('min-height', String(authored['min-height'] || ''), String(authoredPriority?.['min-height'] || ''));
      else element.style.removeProperty('min-height');
      if (authored && Object.prototype.hasOwnProperty.call(authored, 'max-height')) element.style.setProperty('max-height', String(authored['max-height'] || ''), String(authoredPriority?.['max-height'] || ''));
      else element.style.removeProperty('max-height');
      delete element.dataset.sfManualH;
    }

    // Properties authored only in another responsive profile must not leak into
    // the current profile. Base style is never removed.
    const effectiveStyle = node.style || {};
    const responsiveOnlyProperties = new Set();
    for (const entry of allResponsive) {
      for (const property of Object.keys(entry?.style || {})) responsiveOnlyProperties.add(property);
    }
    for (const property of responsiveOnlyProperties) {
      if (Object.prototype.hasOwnProperty.call(effectiveStyle, property)) continue;
      if (Object.prototype.hasOwnProperty.call(baseNode.style || {}, property)) continue;
      if (authored && Object.prototype.hasOwnProperty.call(authored, property)) {
        element.style.setProperty(property, String(authored[property] ?? ''), String(authoredPriority?.[property] || ''));
      } else element.style.removeProperty(property);
    }

    for (const [property, rawValue] of Object.entries(effectiveStyle)) {
      if (!property) continue;
      if (rawValue == null || rawValue === '') element.style.removeProperty(property);
      else element.style.setProperty(property, String(rawValue), stylePriority00960(baseNode, property, rawValue));
    }
    return true;
  }

  renderNodes(nodeIds = []) {
    let rendered = 0;
    for (const nodeId of nodeIds) if (this.renderNode(nodeId)) rendered += 1;
    return rendered;
  }

  renderArea(areaName) {
    const area = this.store.findArea(areaName);
    if (!area) return 0;
    const ids = [];
    const visit = id => {
      const node = this.store.maybeGet(id);
      if (!node) return;
      ids.push(id);
      for (const childId of node.children || []) visit(childId);
    };
    for (const childId of area.children || []) visit(childId);
    return this.renderNodes(ids);
  }
}
