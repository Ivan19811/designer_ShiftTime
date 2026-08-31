const REPORTS_KEY = 'st_ai_runtime_debug_reports_v1';
const MODE_KEY = 'st_ai_runtime_debug_mode_v1';
const PENDING_VOICE_KEY = 'st_ai_runtime_pending_voice_command_v1';

function safeClone(value){
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch (_) {
    return value ?? null;
  }
}

function nowIso(){
  return new Date().toISOString();
}

function loadReportsState(){
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return { version: 1, items: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { version: 1, items: [] };
    return {
      version: Number(parsed.version || 1),
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch (_) {
    return { version: 1, items: [] };
  }
}

function saveReportsState(state){
  const payload = {
    version: 1,
    items: Array.isArray(state?.items) ? state.items : [],
  };
  localStorage.setItem(REPORTS_KEY, JSON.stringify(payload));
  return payload;
}

function summarizeCommands(parsedResult){
  const commands = Array.isArray(parsedResult?.commands) ? parsedResult.commands : [];
  return commands.map((command, index) => ({
    index,
    action: command?.action || null,
    target: command?.target || null,
    property: command?.property || null,
    value: safeClone(command?.value || null),
    scope: command?.scope || null,
    state: command?.state || null,
    responsive: command?.responsive || null,
    confidence: Number(command?.confidence || 0),
    needsClarify: !!command?.needsClarify,
    clarifyRuleId: command?.clarify?.ruleId || null,
    applyContractOperations: Array.isArray(command?.applyContract?.operations)
      ? command.applyContract.operations.length
      : 0,
  }));
}

function summarizeExecution(executionResult){
  const bundle = executionResult && typeof executionResult === 'object' ? executionResult : null;
  const results = Array.isArray(bundle?.results) ? bundle.results : [];
  const commands = results.map((item) => ({
    commandIndex: Number(item?.commandIndex || 0),
    action: item?.action || null,
    skipped: !!item?.skipped,
    reason: item?.reason || null,
    ok: item?.execution?.ok ?? (!item?.skipped),
    summary: safeClone(item?.execution?.summary || null),
    sync: safeClone(item?.execution?.sync || null),
    contractKind: item?.execution?.contractKind || null,
    selectionMode: item?.execution?.selectionMode || null,
    operationCount: Array.isArray(item?.execution?.operations) ? item.execution.operations.length : 0,
  }));
  return {
    ok: bundle?.ok !== false,
    totalCommands: Number(bundle?.totalCommands || 0),
    executedCommands: Number(bundle?.executedCommands || 0),
    skippedCommands: Number(bundle?.skippedCommands || 0),
    commands,
  };
}

function stringify(value){
  try {
    return JSON.stringify(value, null, 2);
  } catch (_) {
    return String(value ?? '');
  }
}

function normalizeReport(payload = {}){
  const parsedResult = safeClone(payload.parsedResult || null);
  const executionResult = safeClone(payload.executionResult || null);
  const report = {
    id: payload.id || `ai_runtime_debug_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: payload.createdAt || nowIso(),
    inputText: String(payload.inputText || ''),
    source: String(payload.source || 'ai_runtime_overlay'),
    dryRun: !!payload.dryRun,
    debugMode: !!payload.debugMode,
    status: String(payload.status || (executionResult?.ok === false ? 'FAIL' : 'PASS')).toUpperCase(),
    assistantMessage: String(
      payload.assistantMessage
      || parsedResult?.assistantMessage
      || parsedResult?.warnings?.[0]
      || ''
    ),
    parseEvaluation: safeClone(payload.parseEvaluation || null),
    parsedResult,
    parsedSummary: {
      ok: parsedResult?.ok !== false,
      normalizedText: parsedResult?.normalizedText || null,
      warnings: Array.isArray(parsedResult?.warnings) ? parsedResult.warnings : [],
      errors: Array.isArray(parsedResult?.errors) ? parsedResult.errors : [],
      commands: summarizeCommands(parsedResult),
      diagnostics: safeClone(parsedResult?.diagnostics || []),
    },
    executionResult,
    executionSummary: summarizeExecution(executionResult),
    selectionBefore: safeClone(payload.selectionBefore || null),
    selectionAfter: safeClone(payload.selectionAfter || null),
    mutationLog: safeClone(payload.mutationLog || []),
    uiTrace: safeClone(payload.uiTrace || payload.clickTrace || []),
    notes: safeClone(payload.notes || null),
    reportKind: String(payload.reportKind || payload.kind || (String(payload.source || '').includes('voice') ? 'voice_command' : 'ai_runtime')),
    voiceDetails: safeClone(payload.voiceDetails || null),
  };
  report.status = report.executionSummary?.ok === false ? 'FAIL' : (report.parseEvaluation?.pass === false && !report.executionResult ? 'FAIL' : report.status);
  return report;
}

export function isAiRuntimeDebugEnabled(){
  try {
    return localStorage.getItem(MODE_KEY) === '1';
  } catch (_) {
    return false;
  }
}

export function setAiRuntimeDebugEnabled(enabled){
  try {
    localStorage.setItem(MODE_KEY, enabled ? '1' : '0');
    return true;
  } catch (_) {
    return false;
  }
}

export function appendAiRuntimeDebugReport(payload = {}){
  const state = loadReportsState();
  const report = normalizeReport(payload);
  state.items.unshift(report);
  saveReportsState(state);
  return safeClone(report);
}

export function appendVoiceCommandDebugReport(payload = {}){
  return appendAiRuntimeDebugReport({
    ...payload,
    source: payload.source || 'voice_command_widget',
    reportKind: 'voice_command',
    debugMode: payload.debugMode ?? isAiRuntimeDebugEnabled(),
    inputText: payload.inputText || payload.normalizedText || payload.rawText || '',
  });
}

export function setPendingVoiceCommandDebugDetails(payload = {}){
  const voiceDetails = safeClone(payload.voiceDetails || payload);
  if (!voiceDetails || typeof voiceDetails !== 'object') return null;
  const record = {
    version: 1,
    createdAt: nowIso(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    inputText: String(payload.inputText || voiceDetails.normalizedText || voiceDetails.rawText || ''),
    voiceDetails,
  };
  try {
    localStorage.setItem(PENDING_VOICE_KEY, JSON.stringify(record));
  } catch (_) {}
  return safeClone(record);
}

export function peekPendingVoiceCommandDebugDetails(){
  try {
    const raw = localStorage.getItem(PENDING_VOICE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Number(parsed.expiresAt || 0) && Date.now() > Number(parsed.expiresAt || 0)) {
      localStorage.removeItem(PENDING_VOICE_KEY);
      return null;
    }
    return safeClone(parsed);
  } catch (_) {
    return null;
  }
}

export function clearPendingVoiceCommandDebugDetails(){
  try { localStorage.removeItem(PENDING_VOICE_KEY); } catch (_) {}
  return true;
}

function normalizeComparableCommandText(text){
  return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function consumePendingVoiceCommandDebugDetails(inputText = ''){
  const pending = peekPendingVoiceCommandDebugDetails();
  if (!pending) return null;

  const requested = normalizeComparableCommandText(inputText);
  const pendingInput = normalizeComparableCommandText(pending.inputText || pending.voiceDetails?.normalizedText || pending.voiceDetails?.rawText || '');

  // If we know both texts and they do not match, keep the pending voice item for the next apply.
  if (requested && pendingInput && requested !== pendingInput) return null;

  clearPendingVoiceCommandDebugDetails();
  return safeClone({
    ...pending.voiceDetails,
    mergedIntoAiRuntimeReport: true,
    mergedAt: nowIso(),
  });
}

export function listAiRuntimeDebugReports(){
  const state = loadReportsState();
  return (state.items || [])
    .slice()
    .sort((a, b) => String(b?.createdAt || '').localeCompare(String(a?.createdAt || '')))
    .map((item) => safeClone(item));
}

export function removeAiRuntimeDebugReport(reportId){
  const state = loadReportsState();
  state.items = state.items.filter((item) => String(item?.id || '') !== String(reportId || ''));
  saveReportsState(state);
  return true;
}

export function removeAiRuntimeDebugReports(reportIds = []){
  const ids = new Set((Array.isArray(reportIds) ? reportIds : []).map((item) => String(item || '')));
  if (!ids.size) return 0;
  const state = loadReportsState();
  const before = state.items.length;
  state.items = state.items.filter((item) => !ids.has(String(item?.id || '')));
  saveReportsState(state);
  return Math.max(0, before - state.items.length);
}

export function clearAiRuntimeDebugReports(){
  saveReportsState({ version: 1, items: [] });
  return true;
}

export function getAiRuntimeDebugStats(reports = listAiRuntimeDebugReports()){
  const rows = Array.isArray(reports) ? reports : [];
  const total = rows.length;
  const passed = rows.filter((item) => String(item?.status || '') === 'PASS').length;
  const failed = rows.filter((item) => String(item?.status || '') === 'FAIL').length;
  const dryRun = rows.filter((item) => !!item?.dryRun).length;
  return { total, passed, failed, dryRun };
}

export function buildAiRuntimeDebugReport(report){
  const item = normalizeReport(report || {});
  const lines = [];
  lines.push('=== AI RUNTIME DEBUG REPORT START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Report ID: ${item.id}`);
  lines.push(`Created At: ${String(item.createdAt || '')}`);
  lines.push(`Status: ${item.status}`);
  lines.push(`Source: ${item.source}`);
  lines.push(`Dry Run: ${item.dryRun ? 'true' : 'false'}`);
  lines.push(`Debug Mode: ${item.debugMode ? 'true' : 'false'}`);
  lines.push('');
  lines.push('Input Command:');
  lines.push(item.inputText || '');
  lines.push('');
  lines.push('Assistant Message:');
  lines.push(item.assistantMessage || '');
  lines.push('');
  if (item.reportKind === 'voice_command' || item.voiceDetails) {
    lines.push('Voice Command Details:');
    lines.push(stringify(item.voiceDetails || null));
    lines.push('');
  }
  lines.push('How command was understood (summary):');
  lines.push(stringify({
    parseEvaluation: item.parseEvaluation,
    parsedSummary: item.parsedSummary,
    selectionBefore: item.selectionBefore,
  }));
  lines.push('');
  lines.push('How command was executed (summary):');
  lines.push(stringify({
    executionSummary: item.executionSummary,
    selectionAfter: item.selectionAfter,
    mutationLog: item.mutationLog,
  }));
  lines.push('');
  lines.push('UI / Button Click Trace:');
  lines.push(stringify(item.uiTrace || []));
  lines.push('');
  lines.push('Raw Parse Result:');
  lines.push(stringify(item.parsedResult));
  lines.push('');
  lines.push('Raw Execution Result:');
  lines.push(stringify(item.executionResult));
  lines.push('');
  lines.push('=== AI RUNTIME DEBUG REPORT END ===');
  return lines.join('\n');
}

export function buildAiRuntimeDebugReportsBundle(reports = []){
  const rows = Array.isArray(reports) ? reports : [];
  const stats = getAiRuntimeDebugStats(rows);
  const lines = [];
  lines.push('=== AI RUNTIME DEBUG REPORTS BUNDLE START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Total Reports: ${stats.total}`);
  lines.push(`Passed: ${stats.passed}`);
  lines.push(`Failed: ${stats.failed}`);
  lines.push(`Dry Run: ${stats.dryRun}`);
  lines.push('');
  if (!rows.length) {
    lines.push('No reports selected.');
  } else {
    for (const report of rows) {
      lines.push(buildAiRuntimeDebugReport(report));
      lines.push('');
    }
  }
  lines.push('=== AI RUNTIME DEBUG REPORTS BUNDLE END ===');
  return lines.join('\n');
}
