import { createAiRuntimeExecutor } from '../runtime/ai-command-runtime-executor.js';
import { createBuilderRuntimeContext } from '../runtime/ai-command-runtime-context.js';

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  };
}
if (typeof globalThis.Event === 'undefined') {
  globalThis.Event = class Event {
    constructor(type) { this.type = type; }
  };
}

const dispatched = [];
const fakeDocument = {
  dispatchEvent(ev) { dispatched.push(ev.type || 'unknown'); return true; },
  querySelector() { return null; },
  documentElement: null,
};
globalThis.document = fakeDocument;
globalThis.window = {
  dispatchEvent(ev) { dispatched.push(`window:${ev.type || 'unknown'}`); return true; },
  ST_SELECTION: {
    emit() {
      const sel = { type: 'block', elements: [fakeEl] };
      fakeDocument.dispatchEvent(new CustomEvent('st:selection-changed', { detail: sel }));
      return sel;
    },
  },
};

function createStyle() {
  return {
    _map: new Map(),
    setProperty(name, value) { this._map.set(name, String(value)); },
    getPropertyValue(name) { return this._map.get(name) || ''; },
  };
}

const fakeEl = {
  id: 'block-1',
  nodeType: 1,
  style: createStyle(),
  dataset: {},
  querySelectorAll() { return []; },
  classList: {
    contains(name) { return name === 'st-block'; },
  },
};

const mutationLog = [];
const context = createBuilderRuntimeContext({
  mutationLog,
  selectionSnapshot: {
    type: 'block',
    selectedCount: 1,
    selectedElements: [{ id: 'block-1', type: 'container', label: 'Block 1', element: fakeEl, raw: { element: fakeEl } }],
  },
});

const executor = createAiRuntimeExecutor();
const contract = {
  kind: 'atomic_apply_contract',
  target: 'selected_element',
  selectionMode: 'current_selection',
  applyTo: 'all_selected_if_multiple',
  operations: [
    {
      runtime: 'applyRadiusValue',
      selectionMode: 'current_selection',
      applyTo: 'all_selected_if_multiple',
      payload: { value: { raw: '16px' }, state: 'default', responsive: 'all' },
    },
  ],
};

const result = await executor.execute(contract, context, { dryRun: false });
if (!result.ok) throw new Error('selection sync smoke: execution not ok');
if (!result.sync?.synced) throw new Error('selection sync smoke: sync flag missing');
if (fakeEl.style.borderRadius !== '16px') throw new Error('selection sync smoke: mutation missing');
if (!mutationLog.length) throw new Error('selection sync smoke: mutation log empty');
if (!dispatched.includes('st:selection-changed')) throw new Error('selection sync smoke: selection change not dispatched');
if (!dispatched.includes('st:ai-runtime-applied')) throw new Error('selection sync smoke: ai runtime applied event missing');
console.log(JSON.stringify({ ok: true, sync: result.sync, dispatched, mutationCount: mutationLog.length }, null, 2));
