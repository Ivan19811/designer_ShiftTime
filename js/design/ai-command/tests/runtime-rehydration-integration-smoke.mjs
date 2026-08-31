import {
  savePersistedAiRuntimeState,
} from '../runtime/ai-command-runtime-persistence.js';
import {
  initAiRuntimeRehydrationIntegration,
} from '../runtime/ai-command-runtime-rehydration.js';

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  };
}

function createEventHub() {
  const map = new Map();
  return {
    addEventListener(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      map.get(type)?.delete(fn);
    },
    dispatchEvent(ev) {
      const set = map.get(ev.type);
      if (!set) return true;
      for (const fn of [...set]) fn(ev);
      return true;
    },
  };
}

function createStyle() {
  return {
    _map: {},
    setProperty(name, value) { this._map[name] = String(value); },
  };
}

const storageMap = new Map();
const storage = {
  getItem(key) { return storageMap.has(key) ? storageMap.get(key) : null; },
  setItem(key, value) { storageMap.set(key, String(value)); },
  removeItem(key) { storageMap.delete(key); },
};

const element = {
  id: 'node-rt-1',
  dataset: { elementId: 'node-rt-1' },
  style: new Proxy(createStyle(), {
    set(target, prop, value) {
      target._map[prop] = value;
      target[prop] = value;
      return true;
    },
    get(target, prop) {
      if (prop in target) return target[prop];
      return target._map[prop];
    },
  }),
};

const docHub = createEventHub();
const winHub = createEventHub();
const fakeDocument = {
  ...docHub,
  defaultView: null,
  querySelector(selector) {
    if (String(selector).includes('node-rt-1')) return element;
    if (['#site-canvas', '#site-root', '.canvas__scroll', '#main-content'].includes(selector)) return this;
    return null;
  },
};
const fakeWindow = {
  ...winHub,
  requestAnimationFrame(fn) { return setTimeout(fn, 0); },
};
fakeDocument.defaultView = fakeWindow;

class FakeMutationObserver {
  constructor(cb) { this.cb = cb; }
  observe() {}
  disconnect() {}
}

globalThis.document = fakeDocument;
globalThis.window = fakeWindow;
globalThis.MutationObserver = FakeMutationObserver;

autoSeed();
function autoSeed() {
  savePersistedAiRuntimeState({
    version: 1,
    elements: {
      'node-rt-1': {
        targetId: 'node-rt-1',
        targetType: 'button_block',
        inlineStyles: { backgroundColor: '#2563eb', borderRadius: '14px' },
        cssVars: {},
        dataset: { aiPalettePolicy: 'harmonize_with_site_theme' },
      },
    },
    history: [],
    meta: {},
  }, { storage });
}

const api = initAiRuntimeRehydrationIntegration({ document: fakeDocument, window: fakeWindow, storage, debounceMs: 5 });
await new Promise((r) => setTimeout(r, 30));
if (element.style.backgroundColor !== '#2563eb') throw new Error(`init rehydrate failed: ${JSON.stringify(element.style._map)}`);

// wipe and test event-based rehydrate
const cleared = { ...element.style._map };
element.style._map = {};

fakeDocument.dispatchEvent(new CustomEvent('st-page-selected', { detail: { pageId: 'p1' } }));
await new Promise((r) => setTimeout(r, 30));
if (element.style.backgroundColor !== '#2563eb') throw new Error(`page-selected rehydrate failed: ${JSON.stringify({ before: cleared, after: element.style._map })}`);

const state = api.getState();
if (!state.lastResult?.ok) throw new Error(`integration state invalid: ${JSON.stringify(state)}`);
if (state.totalRuns < 1) throw new Error(`integration did not run: ${JSON.stringify(state)}`);

api.dispose();
console.log(JSON.stringify({ ok: true, state, styles: element.style._map }, null, 2));
