const LS_KEY = 'st_ai_command_audit_v1';
const REGRESSION_DRAFT_LS_KEY = 'st_ai_command_regression_draft_v1';

function nowIso(){
  return new Date().toISOString();
}

function normalizeText(value){
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function safeClone(value){
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

function safeJsonParse(raw, fallback){
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function loadState(){
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { version: 1, items: [] };
    const parsed = safeJsonParse(raw, { version: 1, items: [] });
    if (!Array.isArray(parsed.items)) parsed.items = [];
    if (!parsed.version) parsed.version = 1;
    return parsed;
  } catch (_) {
    return { version: 1, items: [] };
  }
}

function saveState(state){
  const safe = state && typeof state === 'object' ? state : { version: 1, items: [] };
  if (!Array.isArray(safe.items)) safe.items = [];
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(safe));
  } catch (err) {
    console.warn('[ai-audit-store] save failed', err);
  }
  return safe;
}

export function evaluateAuditResult(result){
  const issues = [];
  if (!result || typeof result !== 'object') {
    issues.push('empty_result');
    return { pass: false, issues };
  }
  if (!result.ok) issues.push('result_not_ok');
  if (Array.isArray(result.errors) && result.errors.length) issues.push('errors_present');
  if (Array.isArray(result.warnings) && result.warnings.length) issues.push('warnings_present');
  const commands = Array.isArray(result.commands) ? result.commands : [];
  if (!commands.length) issues.push('no_commands');
  for (const cmd of commands) {
    if (!cmd || typeof cmd !== 'object') {
      issues.push('invalid_command');
      continue;
    }
    if (cmd.needsClarify) issues.push('needs_clarify');
    if (!cmd.action || cmd.action === 'generic_set') issues.push('unclear_action');
    if (!cmd.property && !['retry_variant', 'set_design_policy'].includes(String(cmd.action || ''))) issues.push('missing_property');
    if ((cmd.confidence ?? 0) < 0.6) issues.push('low_confidence');
  }
  return { pass: issues.length === 0, issues: Array.from(new Set(issues)) };
}

export function shouldAuditResult(result, evaluation = evaluateAuditResult(result)){
  if (!evaluation?.pass) return true;
  if (!result?.ok) return true;
  if (Array.isArray(result?.warnings) && result.warnings.length) return true;
  return false;
}

function buildFingerprint(payload){
  const input = normalizeText(payload?.input || payload?.sourceText || '');
  const normalizedText = normalizeText(payload?.normalizedText || '');
  const ruleId = String(payload?.ruleId || '').toLowerCase();
  const action = String(payload?.action || '').toLowerCase();
  const target = String(payload?.target || '').toLowerCase();
  const property = String(payload?.property || '').toLowerCase();
  return [input, normalizedText, ruleId, action, target, property].join('::');
}

function summarizeResult(input, result, meta = {}){
  const evaluation = meta.evaluation || evaluateAuditResult(result);
  const primary = Array.isArray(result?.commands) && result.commands.length ? result.commands[0] : {};
  const diagnostics = Array.isArray(result?.diagnostics) && result.diagnostics.length ? result.diagnostics[0] : {};
  const normalizeMeta = diagnostics?.normalizeMeta || {};
  const clarify = primary?.clarify || {};
  const selectionContext = meta.selectionContext || {};
  const payload = {
    input: String(input || result?.sourceText || ''),
    normalizedText: String(result?.normalizedText || ''),
    source: String(meta.source || 'live_ai_input'),
    page: String(meta.page || (typeof window !== 'undefined' ? window.location.pathname : '')),
    ok: !!result?.ok,
    assistantMessage: String(result?.assistantMessage || result?.warnings?.[0] || ''),
    ruleId: String(clarify?.ruleId || ''),
    issues: evaluation.issues || [],
    action: String(primary?.action || ''),
    target: String(primary?.target || ''),
    property: primary?.property || null,
    scope: String(primary?.scope || ''),
    state: String(primary?.state || ''),
    responsive: String(primary?.responsive || ''),
    selectionContext: {
      selectedCount: Number(selectionContext?.selectedCount || 0),
      selectedType: selectionContext?.selectedType || null,
    },
    unknownTokens: Array.isArray(normalizeMeta?.unknownTokens) ? normalizeMeta.unknownTokens : [],
    unknownPhrases: Array.isArray(normalizeMeta?.unknownPhrases) ? normalizeMeta.unknownPhrases : [],
    warnings: Array.isArray(result?.warnings) ? result.warnings : [],
    result: safeClone(result),
    evaluation: safeClone(evaluation),
  };
  payload.fingerprint = buildFingerprint(payload);
  return payload;
}

export function appendAuditEntry(input, result, meta = {}){
  const evaluation = meta.evaluation || evaluateAuditResult(result);
  if (!shouldAuditResult(result, evaluation)) {
    return { saved: false, reason: 'not_needed', entry: null, evaluation };
  }
  const state = loadState();
  const payload = summarizeResult(input, result, { ...meta, evaluation });
  const existing = state.items.find((item) => item.fingerprint === payload.fingerprint);
  const stamp = nowIso();
  if (existing) {
    existing.count = Number(existing.count || 1) + 1;
    existing.lastSeenAt = stamp;
    existing.lastStatus = evaluation.pass ? 'resolved' : 'open';
    existing.lastResult = payload.result;
    existing.lastEvaluation = payload.evaluation;
    existing.assistantMessage = payload.assistantMessage;
    existing.issues = payload.issues;
    existing.ruleId = payload.ruleId;
    existing.action = payload.action;
    existing.target = payload.target;
    existing.property = payload.property;
    existing.scope = payload.scope;
    existing.state = payload.state;
    existing.responsive = payload.responsive;
    existing.warnings = payload.warnings;
    existing.unknownTokens = payload.unknownTokens;
    existing.unknownPhrases = payload.unknownPhrases;
    existing.page = payload.page;
    existing.source = payload.source;
    existing.selectionContext = payload.selectionContext;
    existing.resolved = !!evaluation.pass;
    saveState(state);
    return { saved: true, deduped: true, entry: safeClone(existing), evaluation };
  }
  const entry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fingerprint: payload.fingerprint,
    createdAt: stamp,
    firstSeenAt: stamp,
    lastSeenAt: stamp,
    count: 1,
    resolved: !!evaluation.pass,
    lastStatus: evaluation.pass ? 'resolved' : 'open',
    ...payload,
    lastResult: payload.result,
    lastEvaluation: payload.evaluation,
  };
  state.items.unshift(entry);
  saveState(state);
  return { saved: true, deduped: false, entry: safeClone(entry), evaluation };
}

export function listAuditEntries(){
  const state = loadState();
  return (state.items || []).slice().sort((a, b) => String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')));
}

export function getAuditStats(entries = listAuditEntries()){
  const rows = Array.isArray(entries) ? entries : [];
  const totalEntries = rows.length;
  const totalOccurrences = rows.reduce((sum, item) => sum + Number(item?.count || 1), 0);
  const openEntries = rows.filter((item) => !item?.resolved).length;
  const resolvedEntries = rows.filter((item) => !!item?.resolved).length;
  const duplicateOccurrences = Math.max(0, totalOccurrences - totalEntries);
  const byRule = {};
  for (const item of rows) {
    const key = item?.ruleId || 'no_rule';
    byRule[key] = (byRule[key] || 0) + Number(item?.count || 1);
  }
  const topRule = Object.entries(byRule).sort((a, b) => b[1] - a[1])[0] || null;
  return {
    totalEntries,
    totalOccurrences,
    openEntries,
    resolvedEntries,
    duplicateOccurrences,
    topRule: topRule ? { ruleId: topRule[0], count: topRule[1] } : null,
  };
}

export function clearAuditEntries(){
  saveState({ version: 1, items: [] });
  return true;
}

export function removeAuditEntry(entryId){
  const state = loadState();
  state.items = state.items.filter((item) => item.id !== entryId);
  saveState(state);
  return true;
}

export function removeAuditEntries(entryIds = []){
  const ids = new Set((Array.isArray(entryIds) ? entryIds : []).map((item) => String(item || '')));
  if (!ids.size) return 0;
  const state = loadState();
  const before = state.items.length;
  state.items = state.items.filter((item) => !ids.has(String(item.id || '')));
  saveState(state);
  return Math.max(0, before - state.items.length);
}

export function removeResolvedAuditEntries(){
  const state = loadState();
  const before = state.items.length;
  state.items = state.items.filter((item) => !item?.resolved);
  saveState(state);
  return Math.max(0, before - state.items.length);
}

export function updateAuditReplay(entryId, replayResult, meta = {}){
  const state = loadState();
  const entry = state.items.find((item) => item.id === entryId);
  if (!entry) return null;
  const evaluation = meta.evaluation || evaluateAuditResult(replayResult);
  entry.lastReplayAt = nowIso();
  entry.lastReplayResult = safeClone(replayResult);
  entry.lastReplayEvaluation = safeClone(evaluation);
  entry.resolved = !!evaluation.pass;
  entry.lastStatus = evaluation.pass ? 'resolved' : 'open';
  if (meta.replaceLiveSnapshot) {
    entry.lastResult = safeClone(replayResult);
    entry.lastEvaluation = safeClone(evaluation);
    entry.assistantMessage = String(replayResult?.assistantMessage || replayResult?.warnings?.[0] || entry.assistantMessage || '');
    entry.ruleId = String(replayResult?.commands?.[0]?.clarify?.ruleId || entry.ruleId || '');
    entry.issues = evaluation.issues || [];
  }
  saveState(state);
  return safeClone(entry);
}

function stringify(value){
  try {
    return JSON.stringify(value, null, 2);
  } catch (_) {
    return String(value ?? '');
  }
}

export function buildAuditReport(entries = listAuditEntries()){
  const rows = Array.isArray(entries) ? entries : [];
  const stats = getAuditStats(rows);
  const lines = [];
  lines.push('=== AI AUDIT REPORT START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Total entries: ${stats.totalEntries}`);
  lines.push(`Total occurrences: ${stats.totalOccurrences}`);
  lines.push(`Open: ${stats.openEntries}`);
  lines.push(`Resolved: ${stats.resolvedEntries}`);
  lines.push(`Duplicates: ${stats.duplicateOccurrences}`);
  if (stats.topRule) lines.push(`Top rule: ${stats.topRule.ruleId} (${stats.topRule.count})`);
  lines.push('');
  if (!rows.length) {
    lines.push('No audit entries.');
  } else {
    for (const item of rows) {
      lines.push(`--- ${item.id} [${item.resolved ? 'RESOLVED' : 'OPEN'}] ---`);
      lines.push(`count: ${Number(item.count || 1)}`);
      lines.push(`firstSeenAt: ${String(item.firstSeenAt || '')}`);
      lines.push(`lastSeenAt: ${String(item.lastSeenAt || '')}`);
      lines.push(`input: ${String(item.input || '')}`);
      if (item.assistantMessage) lines.push(`assistantMessage: ${String(item.assistantMessage)}`);
      if (item.ruleId) lines.push(`ruleId: ${String(item.ruleId)}`);
      if (Array.isArray(item.issues) && item.issues.length) lines.push(`issues: ${JSON.stringify(item.issues)}`);
      lines.push(`action: ${String(item.action || '')}`);
      lines.push(`target: ${String(item.target || '')}`);
      lines.push(`property: ${String(item.property || '')}`);
      lines.push(`scope: ${String(item.scope || '')}`);
      lines.push(`state: ${String(item.state || '')}`);
      lines.push(`responsive: ${String(item.responsive || '')}`);
      if (item.selectionContext) lines.push(`selection: ${JSON.stringify(item.selectionContext)}`);
      if (Array.isArray(item.unknownTokens) && item.unknownTokens.length) lines.push(`unknownTokens: ${JSON.stringify(item.unknownTokens)}`);
      if (Array.isArray(item.unknownPhrases) && item.unknownPhrases.length) lines.push(`unknownPhrases: ${JSON.stringify(item.unknownPhrases)}`);
      lines.push('Result:');
      lines.push(stringify(item.lastResult || item.result || null));
      lines.push('');
    }
  }
  lines.push('=== AI AUDIT REPORT END ===');
  return lines.join('\n');
}

function deriveValueHint(value){
  if (!value || typeof value !== 'object') return null;
  if (typeof value.raw === 'string' && value.raw.trim()) return value.raw.trim();
  if (typeof value.keyword === 'string' && value.keyword.trim()) return value.keyword.trim();
  if (typeof value.colorId === 'string' && value.colorId.trim()) return value.colorId.trim();
  if (typeof value.iconId === 'string' && value.iconId.trim()) return value.iconId.trim();
  if (typeof value.value === 'number' && typeof value.unit === 'string') return `${value.value}${value.unit}`;
  if (typeof value.value === 'number') return String(value.value);
  return null;
}

function commandToExpect(command){
  const out = {};
  if (!command || typeof command !== 'object') return out;
  if (command.action) out.action = command.action;
  if (command.target) out.target = command.target;
  if (command.property) out.property = command.property;
  if (command.scope && command.scope !== 'selected_element') out.scope = command.scope;
  if (command.state && command.state !== 'default') out.state = command.state;
  if (command.responsive && command.responsive !== 'all') out.responsive = command.responsive;
  const valueHint = deriveValueHint(command.value);
  if (valueHint) out.value_hint = valueHint;
  if (typeof command.needsClarify === 'boolean') out.needsClarify = !!command.needsClarify;
  if (command?.clarify?.ruleId) out.clarify_rule = command.clarify.ruleId;
  return out;
}

function entryToRegressionCase(entry, index){
  const id = `audit_rg_${String(index + 1).padStart(3, '0')}`;
  const result = entry?.lastResult || entry?.result || {};
  const commands = Array.isArray(result?.commands) ? result.commands : [];
  const warningHint = Array.isArray(result?.warnings) && result.warnings.length ? String(result.warnings[0] || '') : '';
  let expect = commands.length > 1
    ? { commands: commands.map((cmd) => commandToExpect(cmd)) }
    : commandToExpect(commands[0] || {});
  if (warningHint) expect.warning_hint = warningHint;
  return {
    id,
    text: String(entry?.input || ''),
    expect,
    meta: {
      sourceAuditId: entry?.id || null,
      count: Number(entry?.count || 1),
      ruleId: entry?.ruleId || null,
      status: entry?.resolved ? 'resolved' : 'open',
    },
  };
}

export function buildRegressionDraft(entries = listAuditEntries()){
  const rows = Array.isArray(entries) ? entries : [];
  const cases = rows.map((entry, index) => entryToRegressionCase(entry, index));
  const draft = {
    meta: {
      generatedAt: nowIso(),
      source: 'ai_audit_bridge',
      totalCases: cases.length,
    },
    cases,
  };
  return draft;
}

function draftCaseToCommandItem(item){
  return {
    id: item.id,
    text: item.text,
    meta: item.meta || {},
  };
}

export function buildRegressionPackPatch(entries = listAuditEntries()){
  const draft = buildRegressionDraft(entries);
  const commandsGroup = {
    id: 'ai_audit_bridge_generated',
    label: 'AI Audit Bridge Generated',
    count: draft.cases.length,
    commands: draft.cases.map((item) => draftCaseToCommandItem(item)),
  };
  const expectedCases = draft.cases.map((item) => ({
    id: item.id,
    text: item.text,
    expect: item.expect,
    meta: item.meta || {},
  }));
  return {
    meta: {
      generatedAt: draft.meta.generatedAt,
      source: 'ai_audit_bridge',
      totalCases: draft.cases.length,
    },
    commandsGroup,
    expectedCases,
  };
}

export function saveRegressionDraft(entries = listAuditEntries()){
  const draft = buildRegressionDraft(entries);
  const packPatch = buildRegressionPackPatch(entries);
  const payload = {
    meta: draft.meta,
    cases: draft.cases,
    packPatch,
  };
  try {
    window.localStorage.setItem(REGRESSION_DRAFT_LS_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[ai-audit-store] regression draft save failed', err);
  }
  return payload;
}

export function clearRegressionDraft(){
  try {
    window.localStorage.removeItem(REGRESSION_DRAFT_LS_KEY);
  } catch (_) {}
  return true;
}

export function loadRegressionDraft(){
  try {
    const raw = window.localStorage.getItem(REGRESSION_DRAFT_LS_KEY);
    if (!raw) return { meta: { generatedAt: null, source: 'ai_audit_bridge', totalCases: 0 }, cases: [], packPatch: null };
    const parsed = safeJsonParse(raw, { meta: { generatedAt: null, source: 'ai_audit_bridge', totalCases: 0 }, cases: [], packPatch: null });
    if (!Array.isArray(parsed.cases)) parsed.cases = [];
    if (!parsed.packPatch) parsed.packPatch = {
      meta: parsed.meta || { generatedAt: null, source: 'ai_audit_bridge', totalCases: parsed.cases.length },
      commandsGroup: {
        id: 'ai_audit_bridge_generated',
        label: 'AI Audit Bridge Generated',
        count: parsed.cases.length,
        commands: parsed.cases.map((item) => ({ id: item.id, text: item.text, meta: item.meta || {} })),
      },
      expectedCases: parsed.cases.map((item) => ({ id: item.id, text: item.text, expect: item.expect, meta: item.meta || {} })),
    };
    return parsed;
  } catch (_) {
    return { meta: { generatedAt: null, source: 'ai_audit_bridge', totalCases: 0 }, cases: [], packPatch: null };
  }
}

export function buildRegressionDraftReport(entries = listAuditEntries()){
  const draft = buildRegressionDraft(entries);
  const lines = [];
  lines.push('=== AI AUDIT REGRESSION DRAFT START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Cases: ${draft.cases.length}`);
  lines.push('Draft JSON:');
  lines.push(stringify(draft));
  lines.push('=== AI AUDIT REGRESSION DRAFT END ===');
  return lines.join('\n');
}

export function buildRegressionPackPatchReport(entries = listAuditEntries()){
  const patch = buildRegressionPackPatch(entries);
  const lines = [];
  lines.push('=== AI AUDIT REGRESSION PATCH START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Cases: ${patch.expectedCases.length}`);
  lines.push('Commands group patch:');
  lines.push(stringify(patch.commandsGroup));
  lines.push('Expected cases patch:');
  lines.push(stringify(patch.expectedCases));
  lines.push('Full patch JSON:');
  lines.push(stringify(patch));
  lines.push('=== AI AUDIT REGRESSION PATCH END ===');
  return lines.join('\n');
}
