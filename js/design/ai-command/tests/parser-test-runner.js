import { parseAiCommand } from '../core/command-parser.js';

async function loadJson(name){
  const url = new URL(`./${name}`, import.meta.url);
  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    const raw = await readFile(url, 'utf-8');
    return JSON.parse(raw);
  }
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`AI command tests: cannot load ${name} (${res.status})`);
  return res.json();
}

function normalizeText(s){
  return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function findCaseCommand(testCommands, text){
  const norm = normalizeText(text);
  for (const group of (testCommands.groups || [])) {
    for (const item of (group.commands || [])) {
      if (normalizeText(item.text) === norm) return item;
    }
  }
  return null;
}

function valueLooksLike(resultValue, hint){
  if (!hint) return true;
  const hintNorm = normalizeText(String(hint || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim());
  if (resultValue == null) return false;
  if (typeof resultValue === 'string') {
    return normalizeText(resultValue).includes(hintNorm);
  }
  const str = normalizeText(JSON.stringify(resultValue));
  if (hintNorm === 'blue') return str.includes('#2563eb') || str.includes('blue');
  if (hintNorm === 'green') return str.includes('#22c55e') || str.includes('green');
  if (hintNorm === 'yellow') return str.includes('#facc15') || str.includes('yellow');
  if (hintNorm === 'white') return str.includes('#ffffff') || str.includes('white');
  if (hintNorm === 'black') return str.includes('#000000') || str.includes('black');
  if (hintNorm === 'dashed') return str.includes('dashed');
  if (hintNorm === 'solid') return str.includes('solid');
  if (hintNorm === 'dotted') return str.includes('dotted');
  if (hintNorm === 'softer shadow') return str.includes('softer shadow') || str.includes('soft_shadow') || str.includes('softness":"soft');
  if (hintNorm === 'stronger shadow') return str.includes('stronger shadow') || str.includes('adjustment":"stronger');
  if (hintNorm === 'element 10px') return str.includes('element 10px') || (str.includes('"mode":"element"') && str.includes('10') && str.includes('px'));
  if (hintNorm === 'backdrop 20px') return str.includes('backdrop 20px') || (str.includes('"mode":"backdrop"') && str.includes('20') && str.includes('px'));
  if (hintNorm === 'hidden') return str.includes('hidden') || str.includes('"visible":false');
  if (hintNorm === 'top 12px') return str.includes('top 12px') || (str.includes('"side":"top"') && str.includes('12') && str.includes('px'));
  if (hintNorm === 'left 18px') return str.includes('left 18px') || (str.includes('"side":"left"') && str.includes('18') && str.includes('px'));
  if (hintNorm === '24px') return str.includes('24px') || (str.includes('24') && str.includes('px'));
  if (hintNorm === '2') return str.includes('"value":2') || str.endswith('2}') || str.includes('"raw":"2"');
  if (hintNorm === 'vertical') return str.includes('180') || str.includes('vertical');
  if (hintNorm === 'horizontal') return str.includes('90') || str.includes('horizontal');
  if (hintNorm === 'positional_gradient') return str.includes('50%') && (str.includes('0%') || str.includes('100%'));
  if (hintNorm === 'yellow +10% default') return str.includes('yellow') || str.includes('#facc15') || str.includes('+10%') || str.includes('10%');
  if (hintNorm === '20px') return str.includes('20px') || (str.includes('20') && str.includes('px'));
  if (hintNorm === 'semi-transparent') return str.includes('semi-transparent') || str.includes('50');
  if (hintNorm === 'darker current bg') return str.includes('darker current bg');
  if (hintNorm === 'mail/envelope') return str.includes('mail/envelope') || str.includes('"mail"') || str.includes('envelope');
  if (/^-?\d+(?:\.\d+)?deg$/.test(hintNorm)) {
    const deg = hintNorm.replace('deg', '');
    return str.includes(hintNorm) || str.includes(`\"degrees\":${deg}`);
  }
  if (hintNorm === 'horizontal') return str.includes('horizontal') || str.includes('\"axis\":\"x\"');
  if (hintNorm === 'vertical') return str.includes('vertical') || str.includes('\"axis\":\"y\"');
  if (hintNorm === 'right') return str.includes('right');
  if (hintNorm === 'left') return str.includes('left');
  if (hintNorm === 'up') return str.includes('up');
  if (hintNorm === 'down') return str.includes('down');
  if (hintNorm === 'center') return str.includes('center');
  return str.includes(hintNorm);
}

function compareSingleExpectation(expect, command, result, index = 0){
  const diffs = [];
  if (expect.action && command.action !== expect.action) diffs.push({ field: `commands[${index}].action`, expected: expect.action, actual: command.action || null });
  if (expect.target && command.target !== expect.target) diffs.push({ field: `commands[${index}].target`, expected: expect.target, actual: command.target || null });
  if (expect.property && command.property !== expect.property) diffs.push({ field: `commands[${index}].property`, expected: expect.property, actual: command.property || null });
  if (expect.scope && command.scope !== expect.scope) diffs.push({ field: `commands[${index}].scope`, expected: expect.scope, actual: command.scope || null });
  if (expect.state && command.state !== expect.state) diffs.push({ field: `commands[${index}].state`, expected: expect.state, actual: command.state || null });
  if (expect.responsive && command.responsive !== expect.responsive) diffs.push({ field: `commands[${index}].responsive`, expected: expect.responsive, actual: command.responsive || null });
  if (typeof expect.needsClarify === 'boolean' && !!command.needsClarify !== expect.needsClarify) diffs.push({ field: `commands[${index}].needsClarify`, expected: expect.needsClarify, actual: !!command.needsClarify });
  if (expect.value_hint && !valueLooksLike(command.value, expect.value_hint)) diffs.push({ field: `commands[${index}].value_hint`, expected: expect.value_hint, actual: command.value ?? null });
  if (expect.clarify_rule && command?.clarify?.ruleId !== expect.clarify_rule) diffs.push({ field: `commands[${index}].clarify_rule`, expected: expect.clarify_rule, actual: command?.clarify?.ruleId ?? null });
  if (expect.executor_kind && command?.executorPrep?.kind !== expect.executor_kind) diffs.push({ field: `commands[${index}].executor_kind`, expected: expect.executor_kind, actual: command?.executorPrep?.kind ?? null });
  if (expect.executor_preset) {
    const presetCandidate = command?.executorPrep?.preset || command?.executorPrep?.nextPreset || command?.executorPrep || null;
    if (!valueLooksLike(presetCandidate, expect.executor_preset)) diffs.push({ field: `commands[${index}].executor_preset`, expected: expect.executor_preset, actual: command?.executorPrep ?? null });
  }
  if (expect.executor_axis) {
    const plan = Array.isArray(command?.executorPrep?.applyPlan) ? command.executorPrep.applyPlan : Array.isArray(command?.executorPrep?.mutateAxes) ? command.executorPrep.mutateAxes : [];
    const str = normalizeText(JSON.stringify(plan));
    if (!str.includes(normalizeText(expect.executor_axis))) diffs.push({ field: `commands[${index}].executor_axis`, expected: expect.executor_axis, actual: plan });
  }
  if (expect.executor_atomic_action) {
    const atomic = Array.isArray(command?.executorPrep?.atomicActions) ? command.executorPrep.atomicActions : [];
    const str = normalizeText(JSON.stringify(atomic));
    if (!str.includes(normalizeText(expect.executor_atomic_action))) diffs.push({ field: `commands[${index}].executor_atomic_action`, expected: expect.executor_atomic_action, actual: atomic });
  }
  if (expect.selection_apply && command?.selectionSemantics?.applyTo !== expect.selection_apply) diffs.push({ field: `commands[${index}].selection_apply`, expected: expect.selection_apply, actual: command?.selectionSemantics?.applyTo ?? null });
  if (expect.selection_mode && command?.selectionSemantics?.mode !== expect.selection_mode) diffs.push({ field: `commands[${index}].selection_mode`, expected: expect.selection_mode, actual: command?.selectionSemantics?.mode ?? null });
  if (expect.apply_contract_kind && command?.applyContract?.kind !== expect.apply_contract_kind) diffs.push({ field: `commands[${index}].apply_contract_kind`, expected: expect.apply_contract_kind, actual: command?.applyContract?.kind ?? null });
  if (expect.apply_runtime) {
    const ops = Array.isArray(command?.applyContract?.operations) ? command.applyContract.operations : [];
    const str = normalizeText(JSON.stringify(ops));
    if (!str.includes(normalizeText(expect.apply_runtime))) diffs.push({ field: `commands[${index}].apply_runtime`, expected: expect.apply_runtime, actual: ops });
  }
  return diffs;
}

function compareCase(expect, result){
  const commands = Array.isArray(result?.commands) ? result.commands : [];
  const diffs = [];
  const expects = Array.isArray(expect?.commands) ? expect.commands : [expect];
  if (Array.isArray(expect?.commands) && commands.length !== expect.commands.length) {
    diffs.push({ field: 'commands.length', expected: expect.commands.length, actual: commands.length });
  }
  expects.forEach((item, index) => {
    diffs.push(...compareSingleExpectation(item, commands[index] || {}, result, index));
  });
  const command = commands[0] || {};
  if (!Array.isArray(expect?.commands)) {
    if (expect.warning_hint) {
      const allWarnings = Array.isArray(result?.warnings) ? result.warnings.join(' | ') : '';
      if (!normalizeText(allWarnings).includes(normalizeText(expect.warning_hint))) diffs.push({ field: 'warning_hint', expected: expect.warning_hint, actual: result?.warnings ?? [] });
    }
  } else if (expect.warning_hint) {
    const allWarnings = Array.isArray(result?.warnings) ? result.warnings.join(' | ') : '';
    if (!normalizeText(allWarnings).includes(normalizeText(expect.warning_hint))) diffs.push({ field: 'warning_hint', expected: expect.warning_hint, actual: result?.warnings ?? [] });
  }
  return { pass: diffs.length === 0, diffs, command, commands };
}

export async function loadParserTestPack(){
  const [commands, expected] = await Promise.all([
    loadJson('parser-test-commands.json'),
    loadJson('parser-expected-results.json'),
  ]);
  return { commands, expected };
}

export async function runParserExpectedCases(options = {}){
  const { logToConsole = false, parserOptions = {} } = options;
  const pack = await loadParserTestPack();
  const cases = pack.expected.cases || [];
  const results = [];
  for (const testCase of cases) {
    const commandMeta = findCaseCommand(pack.commands, testCase.text);
    const parsed = await parseAiCommand(testCase.text, parserOptions);
    const cmp = compareCase(testCase.expect, parsed);
    const row = {
      id: testCase.id,
      text: testCase.text,
      group: commandMeta?.group || commandMeta?.bucket || null,
      pass: cmp.pass,
      diffs: cmp.diffs,
      expected: testCase.expect,
      actual: Array.isArray(cmp.commands) && cmp.commands.length > 1 ? cmp.commands : cmp.command,
      parserOk: !!parsed.ok,
      warnings: parsed.warnings || [],
    };
    results.push(row);
    if (logToConsole) {
      const fn = row.pass ? console.log : console.warn;
      fn('[AI command test]', row.id, row.pass ? 'PASS' : 'FAIL', row);
    }
  }
  const passed = results.filter(r => r.pass).length;
  const failed = results.length - passed;
  const byGroup = {};
  for (const row of results) {
    const key = row.group || 'ungrouped';
    byGroup[key] ||= { total: 0, passed: 0, failed: 0 };
    byGroup[key].total += 1;
    if (row.pass) byGroup[key].passed += 1;
    else byGroup[key].failed += 1;
  }
  return {
    ok: failed === 0,
    total: results.length,
    passed,
    failed,
    byGroup,
    results,
  };
}
