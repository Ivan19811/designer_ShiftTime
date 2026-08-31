import { KIND, isNumericSize, toFiniteNumber } from './site-frame-contract.js';

export class SiteFrameResizeEngine {
  constructor(store, layout) {
    this.store = store;
    this.layout = layout;
  }

  resize(nodeId, dir, dx = 0, dy = 0) {
    const node = this.store.get(nodeId);
    if (dir.includes('e') || dir.includes('w')) this.resizeHorizontal(node, dir, dx);
    if (dir.includes('s') || dir.includes('n')) this.resizeVertical(node, dir, dy);
    this.layout.growAncestorsToFit(nodeId);
    this.store.emit('resize', { nodeId, dir, dx, dy });
  }

  resizeHorizontal(node, dir, dx) {
    const parent = this.store.maybeGet(node.parentId);
    const currentWidth = this.numericWidth(node);
    if (!parent || parent.layout?.mode !== 'row' || node.kind !== KIND.CONTAINER) {
      const delta = dir.includes('w') ? -dx : dx;
      const next = this.layout.clampNodeBox(node.id, { width: currentWidth + delta });
      node.box = next;
      return;
    }

    const siblings = parent.children.map(id => this.store.get(id));
    const index = siblings.findIndex(sibling => sibling.id === node.id);
    const neighbour = dir.includes('e') ? siblings[index + 1] : siblings[index - 1];
    if (!neighbour || neighbour.kind !== KIND.CONTAINER) return;

    const targetDelta = dir.includes('e') ? dx : -dx;
    const targetW = this.numericWidth(node);
    const neighbourW = this.numericWidth(neighbour);
    const targetFloor = this.layout.getNodeFloor(node.id).width;
    const neighbourFloor = this.layout.getNodeFloor(neighbour.id).width;

    let applied = targetDelta;
    if (targetW + applied < targetFloor) applied = targetFloor - targetW;
    if (neighbourW - applied < neighbourFloor) applied = neighbourW - neighbourFloor;

    node.box = this.layout.clampNodeBox(node.id, { width: targetW + applied });
    neighbour.box = this.layout.clampNodeBox(neighbour.id, { width: neighbourW - applied });
  }

  resizeVertical(node, dir, dy) {
    const currentHeight = this.numericHeight(node);
    const delta = dir.includes('n') ? -dy : dy;
    node.box = this.layout.clampNodeBox(node.id, { height: currentHeight + delta });
  }

  numericWidth(node) {
    if (isNumericSize(node.box?.width)) return node.box.width;
    const floor = this.layout.getNodeFloor(node.id);
    return Math.max(floor.width, 1);
  }

  numericHeight(node) {
    if (isNumericSize(node.box?.height)) return node.box.height;
    const floor = this.layout.getNodeFloor(node.id);
    return Math.max(floor.height, 1);
  }

  setContainerPairWidths(leftId, rightId, leftWidth) {
    const left = this.store.get(leftId);
    const right = this.store.get(rightId);
    const total = this.numericWidth(left) + this.numericWidth(right);
    const leftFloor = this.layout.getNodeFloor(leftId).width;
    const rightFloor = this.layout.getNodeFloor(rightId).width;
    const nextLeft = Math.min(Math.max(leftWidth, leftFloor), total - rightFloor);
    left.box = this.layout.clampNodeBox(leftId, { width: nextLeft });
    right.box = this.layout.clampNodeBox(rightId, { width: total - nextLeft });
    this.layout.growAncestorsToFit(leftId);
    this.store.emit('resize:pair', { leftId, rightId, leftWidth: nextLeft, rightWidth: total - nextLeft });
  }
}
