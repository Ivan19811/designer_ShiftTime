import {
  persistAiRuntimeExecution,
  loadPersistedAiRuntimeState,
  rehydrateAiRuntimeState,
} from '../runtime/ai-command-runtime-persistence.js';

function createFakeStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
  };
}

function createFakeElement(id) {
  return {
    id,
    dataset: { elementId: id },
    style: {
      _map: {},
      setProperty(name, value) { this._map[name] = value; },
    },
  };
}

function setInlineProxy(element) {
  return new Proxy(element.style, {
    set(target, prop, value) {
      target._map[prop] = value;
      target[prop] = value;
      return true;
    },
    get(target, prop) {
      if (prop in target) return target[prop];
      return target._map[prop];
    },
  });
}

const storage = createFakeStorage();
const element = createFakeElement('node-1');
element.style = setInlineProxy(element);
const doc = {
  querySelector(selector) {
    if (selector.includes('node-1')) return element;
    return null;
  },
};

const executionResult = {
  contractKind: 'atomic_apply_contract',
  summary: { selectedCount: 1 },
  operations: [
    {
      runtime: 'applyBackgroundValue',
      applied: true,
      ok: true,
      targetRef: { id: 'node-1', type: 'button_block' },
      operation: { payload: { value: { hex: '#2563eb' }, state: 'default' } },
      result: { summary: 'background value applied', payload: { value: { hex: '#2563eb' }, state: 'default' } },
    },
    {
      runtime: 'applyRadiusValue',
      applied: true,
      ok: true,
      targetRef: { id: 'node-1', type: 'button_block' },
      operation: { payload: { value: { value: 14, unit: 'px', raw: '14px' } } },
      result: { summary: 'radius value applied', payload: { value: { value: 14, unit: 'px', raw: '14px' } } },
    },
  ],
};

const persisted = persistAiRuntimeExecution(executionResult, { storage, document: doc });
if (!persisted.ok || persisted.patchCount !== 2) {
  throw new Error(`Expected 2 persisted patches, got ${JSON.stringify(persisted)}`);
}

const state = loadPersistedAiRuntimeState({ storage });
if (!state.elements['node-1']) throw new Error('Persisted element record missing');
if (state.elements['node-1']?.inlineStyles?.backgroundColor !== '#2563eb') {
  throw new Error(`Background not persisted: ${JSON.stringify(state.elements['node-1'])}`);
}
if (state.elements['node-1']?.inlineStyles?.borderRadius !== '14px') {
  throw new Error(`Radius not persisted: ${JSON.stringify(state.elements['node-1'])}`);
}

const restored = rehydrateAiRuntimeState({ storage, document: doc });
if (!restored.ok || restored.restored < 1) {
  throw new Error(`Expected restored element, got ${JSON.stringify(restored)}`);
}
if (element.style._map.backgroundColor !== '#2563eb') {
  throw new Error(`Element background not rehydrated: ${JSON.stringify(element.style._map)}`);
}
if (element.style._map.borderRadius !== '14px') {
  throw new Error(`Element radius not rehydrated: ${JSON.stringify(element.style._map)}`);
}

console.log(JSON.stringify({ ok: true, persisted, restored }, null, 2));
