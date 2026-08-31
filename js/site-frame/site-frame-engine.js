import { KIND, createStableId, defaultNode } from './site-frame-contract.js';
import { SiteFrameLayoutEngine } from './site-frame-layout-engine.js';
import { SiteFrameRenderer } from './site-frame-renderer.js';
import { SiteFrameResizeEngine } from './site-frame-resize-engine.js';
import { SiteFrameStore } from './site-frame-store.js';

export class SiteFrameEngine {
  constructor(options = {}) {
    this.store = new SiteFrameStore(options.initialState || null);
    this.layout = new SiteFrameLayoutEngine(this.store);
    this.resizeEngine = new SiteFrameResizeEngine(this.store, this.layout);
    this.renderer = null;
    this.activeResize = null;
  }

  mount(rootElement) {
    this.renderer = new SiteFrameRenderer(this.store, rootElement, {
      onSelect: nodeId => this.select(nodeId),
      onResizeStart: (nodeId, dir, event) => this.startResize(nodeId, dir, event)
    });
    this.renderer.render();
    return this;
  }

  render() {
    if (this.renderer) this.renderer.render();
  }

  select(nodeId) {
    this.selectedId = nodeId;
    if (this.renderer) this.renderer.selectedId = nodeId;
    this.store.emit('select', { nodeId });
  }

  insert(parentId, nodeInput, index = null) {
    const node = this.store.addNode(parentId, nodeInput, index);
    this.render();
    return node;
  }

  convertToContainer(nodeId, componentType = 'default') {
    const node = this.store.convertToContainer(nodeId, componentType);
    this.render();
    return node;
  }

  resize(nodeId, dir, dx, dy) {
    this.resizeEngine.resize(nodeId, dir, dx, dy);
    this.render();
  }

  startResize(nodeId, dir, event) {
    const startX = event.clientX;
    const startY = event.clientY;
    const startState = this.store.toJSON();
    this.activeResize = { nodeId, dir, startX, startY, startState };
    const move = moveEvent => {
      this.store.load(startState);
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      this.resizeEngine.resize(nodeId, dir, dx, dy);
      this.render();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      this.activeResize = null;
      this.store.emit('resize:end', { nodeId, dir });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  addSection(areaName, componentType = 'default') {
    const area = this.store.findArea(areaName) || this.store.createArea(areaName);
    return this.insert(area.id, defaultNode({ kind: KIND.SECTION, area: areaName, componentType, parentId: area.id }));
  }

  addLevel(sectionId, layoutMode = 'row') {
    const section = this.store.get(sectionId);
    const level = defaultNode({ kind: KIND.LEVEL, area: section.area, componentType: 'level', parentId: sectionId });
    level.layout.mode = layoutMode;
    return this.insert(sectionId, level);
  }

  addContainer(parentId, componentType = 'default', width = 240) {
    const parent = this.store.get(parentId);
    const container = defaultNode({ kind: KIND.CONTAINER, area: parent.area, componentType, parentId });
    container.box.width = width;
    return this.insert(parentId, container);
  }

  addBlock(parentId, componentType = 'text', content = {}) {
    const parent = this.store.get(parentId);
    const block = defaultNode({ id: createStableId(`sf_${componentType}`), kind: KIND.BLOCK, area: parent.area, componentType, parentId });
    block.content = content;
    if (componentType === 'icon') block.box = { width: 28, height: 28 };
    if (componentType === 'text') block.box = { width: 120, height: 32 };
    return this.insert(parentId, block);
  }

  createPhone(parentId, text = '+38 000 000 00 00') {
    const phone = this.addContainer(parentId, 'phone', 210);
    phone.layout.mode = 'row';
    phone.layout.alignY = 'center';
    phone.layout.gap = 8;
    this.addBlock(phone.id, 'icon', { text: '☎' });
    this.addBlock(phone.id, 'text', { text });
    this.render();
    return phone;
  }

  createMenu(parentId, items = []) {
    const menu = this.addContainer(parentId, 'menu', Math.max(160, items.length * 92));
    menu.layout.mode = 'row';
    menu.layout.gap = 10;
    menu.layout.alignY = 'center';
    for (const item of items) this.addBlock(menu.id, 'text', { text: item });
    this.render();
    return menu;
  }

  toJSON() {
    return this.store.toJSON();
  }
}

export { KIND } from './site-frame-contract.js';
