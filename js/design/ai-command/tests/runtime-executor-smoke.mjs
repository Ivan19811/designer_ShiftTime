import { createAiRuntimeExecutor, executeParsedAiCommand } from '../runtime/ai-command-runtime-executor.js';
import { parseAiCommand } from '../core/command-parser.js';

function createStyle() {
  return {
    _map: new Map(),
    setProperty(name, value) { this._map.set(name, String(value)); },
    getPropertyValue(name) { return this._map.get(name) || ''; },
  };
}

function createFakeElement(id, type = 'menu_block') {
  const style = createStyle();
  return {
    id,
    nodeType: 1,
    style,
    dataset: {},
    querySelectorAll() { return []; },
    classList: {
      contains(name) {
        if (type === 'menu_block') return name === 'st-block--menu';
        if (type === 'text_block') return name === 'st-block--text';
        if (type === 'button_block') return name === 'st-block--button';
        return false;
      },
    },
  };
}

const menuEl = createFakeElement('menu-1', 'menu_block');
const buttonEl = createFakeElement('btn-1', 'button_block');
const textEl = createFakeElement('txt-1', 'text_block');
const executor = createAiRuntimeExecutor();

const designContract = {
  kind: 'atomic_apply_contract',
  target: 'menu_block',
  selectionMode: 'current_selection',
  applyTo: 'all_selected_if_multiple',
  operations: [
    { runtime: 'applyPalettePolicy', selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', payload: { mode: 'harmonize_with_site_theme' } },
    { runtime: 'applySpacingScale', selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', payload: { density: 'balanced' } },
    { runtime: 'applyRadiusPreset', selectionMode: 'current_selection', applyTo: 'all_selected_if_multiple', payload: { preset: 'modernize_radius' } },
  ],
};

const designResult = await executor.execute(designContract, {
  selectedElements: [{ id: 'menu-1', type: 'menu_block', element: menuEl }],
  siteTheme: { accent: '#38bdf8', text: '#e5e7eb', panel: '#111827', border: 'rgba(148,163,184,0.35)', radius: '12px' },
}, { dryRun: false });

if (!designResult.ok) throw new Error('runtime smoke: design execution not ok');
if (menuEl.style.getPropertyValue('--st-menu-radius') !== '14px') throw new Error('runtime smoke: radius not applied');
if (!menuEl.style.getPropertyValue('--st-menu-link-color')) throw new Error('runtime smoke: palette not applied');
if (menuEl.style.getPropertyValue('--st-menu-gap') !== '14px') throw new Error('runtime smoke: spacing not applied');

const parsed = await parseAiCommand('зроби кнопку синьою');
const directResult = await executeParsedAiCommand(parsed, {
  executor,
  context: {
    selectedElements: [{ id: 'btn-1', type: 'button_block', element: buttonEl }],
  },
  dryRun: false,
});
if (!directResult.ok) throw new Error('runtime smoke: direct execution not ok');
if (buttonEl.style.backgroundColor !== '#2563eb') throw new Error(`runtime smoke: button background not applied (${buttonEl.style.backgroundColor})`);

const parsedText = await parseAiCommand('зроби текст капсом');
const textResult = await executeParsedAiCommand(parsedText, {
  executor,
  context: {
    selectedElements: [{ id: 'txt-1', type: 'text_block', element: textEl }],
  },
  dryRun: false,
});
if (!textResult.ok) throw new Error('runtime smoke: text execution not ok');
if (textEl.style.textTransform !== 'uppercase') throw new Error('runtime smoke: text case not applied');

console.log(JSON.stringify({ ok: true, designApplied: designResult.summary.applied, directExecuted: directResult.executedCommands, textExecuted: textResult.executedCommands }, null, 2));
