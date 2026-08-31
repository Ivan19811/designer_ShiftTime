import { KIND, isAtomicBlock, isNumericSize, normalizeEdges, toFiniteNumber } from './site-frame-contract.js';

export class SiteFrameLayoutEngine {
  constructor(store) {
    this.store = store;
  }

  getNodeFloor(nodeId) {
    const node = this.store.get(nodeId);
    if (isAtomicBlock(node)) return this.getBlockFloor(node);
    const padding = normalizeEdges(node.layout?.padding, 0);
    const gap = toFiniteNumber(node.layout?.gap, 0);
    const children = node.children.map(id => this.store.get(id));
    let minWidth = this.constraintMin(node.constraints?.minWidth, 0);
    let minHeight = this.constraintMin(node.constraints?.minHeight, 0);

    if (children.length) {
      const childFloors = children.map(child => this.getNodeFloor(child.id));
      if (node.layout?.mode === 'row') {
        const widthSum = childFloors.reduce((sum, floor) => sum + floor.width, 0) + gap * Math.max(0, childFloors.length - 1);
        const heightMax = childFloors.reduce((max, floor) => Math.max(max, floor.height), 0);
        minWidth = Math.max(minWidth, padding.left + padding.right + widthSum);
        minHeight = Math.max(minHeight, padding.top + padding.bottom + heightMax);
      } else {
        const widthMax = childFloors.reduce((max, floor) => Math.max(max, floor.width), 0);
        const heightSum = childFloors.reduce((sum, floor) => sum + floor.height, 0) + gap * Math.max(0, childFloors.length - 1);
        minWidth = Math.max(minWidth, padding.left + padding.right + widthMax);
        minHeight = Math.max(minHeight, padding.top + padding.bottom + heightSum);
      }
    }

    if (isNumericSize(node.box?.width)) minWidth = Math.min(Math.max(minWidth, 0), Math.max(node.box.width, minWidth));
    return {
      width: Math.ceil(minWidth),
      height: Math.ceil(minHeight)
    };
  }

  getBlockFloor(node) {
    const minWidth = this.constraintMin(node.constraints?.minWidth, 32);
    const minHeight = this.constraintMin(node.constraints?.minHeight, 24);
    const text = String(node.content?.text || '').trim();
    const chars = text.length;
    const estimatedTextWidth = chars ? Math.min(Math.max(chars * 7 + 16, minWidth), 420) : minWidth;
    const estimatedTextHeight = chars > 28 ? Math.ceil(chars / 28) * 20 + 12 : minHeight;
    return {
      width: Math.ceil(Math.max(minWidth, estimatedTextWidth)),
      height: Math.ceil(Math.max(minHeight, estimatedTextHeight))
    };
  }

  constraintMin(value, fallback) {
    if (value === 'content') return fallback;
    return toFiniteNumber(value, fallback);
  }

  clampNodeBox(nodeId, nextBox) {
    const node = this.store.get(nodeId);
    const floor = this.getNodeFloor(nodeId);
    const maxW = node.constraints?.maxWidth == null ? Infinity : toFiniteNumber(node.constraints.maxWidth, Infinity);
    const maxH = node.constraints?.maxHeight == null ? Infinity : toFiniteNumber(node.constraints.maxHeight, Infinity);
    const requestedW = nextBox.width === 'auto' || nextBox.width === '100%' ? nextBox.width : toFiniteNumber(nextBox.width, floor.width);
    const requestedH = nextBox.height === 'auto' || nextBox.height === '100%' ? nextBox.height : toFiniteNumber(nextBox.height, floor.height);
    return {
      ...node.box,
      ...nextBox,
      width: isNumericSize(requestedW) ? Math.min(Math.max(requestedW, floor.width), maxW) : requestedW,
      height: isNumericSize(requestedH) ? Math.min(Math.max(requestedH, floor.height), maxH) : requestedH
    };
  }

  growAncestorsToFit(nodeId) {
    let child = this.store.get(nodeId);
    let parent = this.store.maybeGet(child.parentId);
    while (parent && parent.kind !== KIND.SITE) {
      const floor = this.getNodeFloor(parent.id);
      const box = { ...parent.box };
      let changed = false;
      if (isNumericSize(box.width) && box.width < floor.width) {
        box.width = floor.width;
        changed = true;
      }
      if (isNumericSize(box.height) && box.height < floor.height) {
        box.height = floor.height;
        changed = true;
      }
      if (changed) parent.box = box;
      child = parent;
      parent = this.store.maybeGet(child.parentId);
    }
    this.store.rebuildTreeMeta();
  }

  getSiblings(nodeId) {
    const node = this.store.get(nodeId);
    const parent = this.store.maybeGet(node.parentId);
    if (!parent) return { node, parent: null, siblings: [], index: -1 };
    const siblings = parent.children.map(id => this.store.get(id));
    return { node, parent, siblings, index: siblings.findIndex(sibling => sibling.id === nodeId) };
  }

  getAreaNodes(areaName) {
    const area = this.store.findArea(areaName);
    return area ? area.children.map(id => this.store.get(id)) : [];
  }
}
