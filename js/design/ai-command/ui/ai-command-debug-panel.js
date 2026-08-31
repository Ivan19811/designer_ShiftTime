import { parseAiCommand } from '../core/command-parser.js';
import { appendAuditEntry } from '../runtime/ai-command-audit-store.js';
import {
  appendAiRuntimeDebugReport,
  isAiRuntimeDebugEnabled,
  setAiRuntimeDebugEnabled,
} from '../runtime/ai-command-debug-store.js';
import { executeParsedAiCommand } from '../runtime/ai-command-runtime-executor.js';
import { createBuilderRuntimeContext, getSelectionSnapshot } from '../runtime/ai-command-runtime-context.js';

function makeEl(tag, className, text){
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function safeStringify(value){
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
}

function safeClone(value){
  try { return JSON.parse(JSON.stringify(value ?? null)); } catch (_) { return value ?? null; }
}

function copyTextFallback(text){
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const ok = document.execCommand('copy');
  textarea.remove();
  if (!ok) throw new Error('copy_failed');
  return true;
}

async function copyText(text){
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return copyTextFallback(text);
}

function evaluateManualParse(result){
  const issues = [];
  if (!result || typeof result !== 'object') {
    issues.push('empty_result');
    return { pass: false, issues };
  }

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
    if (!cmd.property) issues.push('missing_property');
    if ((cmd.confidence ?? 0) < 0.6) issues.push('low_confidence');
  }

  return { pass: issues.length === 0, issues: Array.from(new Set(issues)) };
}

function buildManualFailReport(inputText, result, evaluation){
  const lines = [];
  lines.push('=== MANUAL PARSE REPORT START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Status: ${evaluation?.pass ? 'PASS' : 'FAIL'}`);
  lines.push('');
  lines.push('Input:');
  lines.push(String(inputText || ''));
  lines.push('');
  lines.push('Heuristic:');
  lines.push(`pass=${evaluation?.pass ? 'true' : 'false'}`);
  lines.push(`issues=${safeStringify(evaluation?.issues || [])}`);
  if (result?.assistantMessage) {
    lines.push(`assistantMessage=${String(result.assistantMessage)}`);
  }
  lines.push('');
  lines.push('Result:');
  lines.push(safeStringify(result));
  lines.push('=== MANUAL PARSE REPORT END ===');
  return lines.join('\n');
}

function summarizeSelection(snapshot){
  const count = Number(snapshot?.selectedCount || 0);
  const type = String(snapshot?.type || 'unknown');
  const items = Array.isArray(snapshot?.selectedElements) ? snapshot.selectedElements : [];
  if (!count) return 'Виділення не знайдено';
  if (count === 1) {
    const first = items[0] || {};
    const label = String(first.label || first.type || type || 'element').trim();
    const id = String(first.id || '').trim();
    return id ? `Виділено: ${label} (${id})` : `Виділено: ${label}`;
  }
  const types = Array.from(new Set(items.map((item) => String(item?.type || '').trim()).filter(Boolean)));
  const suffix = types.length === 1 ? ` · type: ${types[0]}` : '';
  return `Виділено елементів: ${count}${suffix}`;
}

function hasRuntimeContracts(result){
  const commands = Array.isArray(result?.commands) ? result.commands : [];
  return commands.some((cmd) => cmd?.applyContract && Array.isArray(cmd.applyContract.operations) && cmd.applyContract.operations.length);
}

function summarizeFirstCommand(result){
  const first = Array.isArray(result?.commands) ? result.commands[0] : null;
  if (!first || typeof first !== 'object') return null;
  return {
    action: first.action || null,
    target: first.target || null,
    property: first.property || null,
    value: safeClone(first.value || null),
    scope: first.scope || null,
    state: first.state || null,
    responsive: first.responsive || null,
    confidence: Number(first.confidence || 0),
    needsClarify: !!first.needsClarify,
    clarifyRuleId: first?.clarify?.ruleId || null,
  };
}

function ensureStyles(){
  if (document.getElementById('st-ai-command-debug-panel-style')) return;
  const style = document.createElement('style');
  style.id = 'st-ai-command-debug-panel-style';
  style.textContent = `
    .st-ai-command-debug{display:grid;gap:12px;padding:12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#111827;color:#f9fafb}
    .st-ai-command-debug textarea{width:100%;min-height:88px;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:#fff;color:#111827;resize:vertical}
    .st-ai-command-debug__row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .st-ai-command-debug__row--main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) auto;align-items:center}
    .st-ai-command-debug__row--debug{display:block}
    .st-ai-command-debug__row--debug .st-ai-command-debug__debug-btn{width:100%}
    .st-ai-command-debug__row--links{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:stretch}
    .st-ai-command-debug__row--journal{display:block}
    .st-ai-command-debug button{min-width:0;padding:10px 14px;border:0;border-radius:10px;background:#2563eb;color:#fff;cursor:pointer;font-weight:700;transition:background-color .18s ease, opacity .18s ease, box-shadow .16s ease, transform .16s ease, filter .16s ease}
    .st-ai-command-debug button:disabled{opacity:.7;cursor:default}
    .st-ai-command-debug button:active,.st-ai-command-debug button.is-click-flash,.st-ai-command-debug button.is-busy{transform:translateY(1px);box-shadow:0 0 0 3px rgba(59,130,246,.28),0 0 18px rgba(59,130,246,.45);filter:brightness(1.08)}
    .st-ai-command-debug__apply-btn{background:#7c3aed}
    .st-ai-command-debug__copy-btn{background:#16a34a;display:none}
    .st-ai-command-debug__copy-btn.is-visible{display:inline-flex}
    .st-ai-command-debug__copy-btn.is-copied{display:inline-flex;background:#dc2626}
    .st-ai-command-debug__debug-btn{background:#0f172a;border:1px solid rgba(255,255,255,.12);color:#cbd5e1}
    .st-ai-command-debug__debug-btn.is-active{background:#dc2626;color:#fff;border-color:rgba(248,113,113,.45)}
    .st-ai-command-debug__status{display:inline-flex;align-items:center;padding:7px 10px;border-radius:999px;font-size:12px;font-weight:800;background:#1f2937;color:#cbd5e1}
    .st-ai-command-debug__status.pass{color:#86efac}
    .st-ai-command-debug__status.fail{color:#fca5a5}
    .st-ai-command-debug__status.apply{color:#c4b5fd}
    .st-ai-command-debug pre{margin:0;padding:12px;border-radius:10px;background:#0b1220;color:#d1fae5;overflow:auto;max-height:360px}
    .st-ai-command-debug__hint{font-size:12px;opacity:.75;flex:1 1 320px}
    .st-ai-command-debug__message{display:none;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.45}
    .st-ai-command-debug__message.is-visible{display:block}
    .st-ai-command-debug__message.pass{background:rgba(22,163,74,.14);color:#bbf7d0;border:1px solid rgba(34,197,94,.3)}
    .st-ai-command-debug__message.fail{background:rgba(220,38,38,.14);color:#fecaca;border:1px solid rgba(248,113,113,.3)}
    .st-ai-command-debug__message.apply{background:rgba(124,58,237,.14);color:#ddd6fe;border:1px solid rgba(167,139,250,.35)}
    .st-ai-command-debug__link{display:inline-flex;align-items:center;justify-content:center;width:100%;min-width:0;padding:10px 14px;border-radius:10px;background:#0f172a;color:#e2e8f0;text-decoration:none;font-weight:700;border:1px solid rgba(255,255,255,.12);white-space:nowrap}
    .st-ai-command-debug__audit-note{font-size:12px;opacity:.8}
    .st-ai-command-debug__selection{font-size:12px;padding:7px 10px;border-radius:999px;background:#0f172a;border:1px solid rgba(255,255,255,.12);color:#cbd5e1}
    .st-ai-command-debug__toggle{display:inline-flex;gap:8px;align-items:center;font-size:12px;opacity:.9}
    .st-ai-command-debug__section-title{font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;opacity:.75}
    .st-ai-command-debug__debug-note{font-size:12px;padding:9px 10px;border-radius:10px;background:#0f172a;border:1px solid rgba(255,255,255,.08);color:#cbd5e1}
  `;
  document.head.appendChild(style);
}

export function initAiCommandDebugPanel(host, options = {}){
  const root = typeof host === 'string' ? document.querySelector(host) : host;
  if (!root) return null;
  ensureStyles();
  root.innerHTML = '';

  const wrap = makeEl('div', 'st-ai-command-debug');
  const title = makeEl('div', '', 'AI Command Parser Debug');
  title.style.fontWeight = '800';
  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Наприклад: зроби це меню красивіше і акуратніше';
  textarea.value = String(options.initialText || '');
  const row = makeEl('div', 'st-ai-command-debug__row');
  const btn = makeEl('button', '', 'Згенерувати');
  const applyBtn = makeEl('button', 'st-ai-command-debug__apply-btn', 'Застосувати');
  const debugToggleBtn = makeEl('button', 'st-ai-command-debug__debug-btn', 'Відлагодження: ВИКЛ');
  const status = makeEl('div', 'st-ai-command-debug__status', 'idle');
  const copyBtn = makeEl('button', 'st-ai-command-debug__copy-btn', 'Звіт');
  const selectionBadge = makeEl('div', 'st-ai-command-debug__selection', 'Виділення не знайдено');
  const dryRunLabel = makeEl('label', 'st-ai-command-debug__toggle');
  const dryRunCheckbox = document.createElement('input');
  dryRunCheckbox.type = 'checkbox';
  dryRunCheckbox.checked = !!options.dryRun;
  dryRunLabel.append(dryRunCheckbox, document.createTextNode('Dry run'));
  const auditLink = document.createElement('a');
  auditLink.className = 'st-ai-command-debug__link';
  auditLink.href = './ai-command-audit.html';
  auditLink.textContent = 'Аудит AI';
  const testLink = document.createElement('a');
  testLink.className = 'st-ai-command-debug__link';
  testLink.href = './ai-command-test.html';
  testLink.textContent = 'AI Тест';
  const reportsLink = document.createElement('a');
  reportsLink.className = 'st-ai-command-debug__link';
  reportsLink.href = './ai-command-debug.html';
  reportsLink.textContent = 'Журнал відлагодження';
  const hint = makeEl('div', 'st-ai-command-debug__hint', 'Runtime-enabled: “Згенерувати” показує JSON-розбір команди, а “Застосувати” запускає executor по поточному виділенню в конструкторі. Реальне застосування вже підтримує design-policy команди, retry-variants і прямі atomic style commands: фон, текст, відступи, radius, border, shadow, opacity, blur, visibility.');
  const auditNote = makeEl('div', 'st-ai-command-debug__audit-note', 'Незрозумілі або проблемні фрази автоматично записуються в Аудит AI.');
  const debugNote = makeEl('div', 'st-ai-command-debug__debug-note', 'Режим відлагодження вимкнений. Увімкни його, щоб після “Застосувати” автоматично зберігати команду, розуміння команди і runtime-виконання в окремий журнал.');
  const message = makeEl('div', 'st-ai-command-debug__message', '');
  const parseTitle = makeEl('div', 'st-ai-command-debug__section-title', 'Parse result');
  const pre = document.createElement('pre');
  pre.textContent = '{\n  "status": "idle"\n}';
  const runtimeTitle = makeEl('div', 'st-ai-command-debug__section-title', 'Runtime result');
  const runtimePre = document.createElement('pre');
  runtimePre.textContent = '{\n  "status": "idle"\n}';

  let lastManualResult = null;
  let lastManualEvaluation = { pass: false, issues: ['idle'] };
  let lastExecutionResult = null;
  let lastSelectionSnapshot = getSelectionSnapshot();
  let lastMutationLog = [];
  let uiTrace = [];

  function refreshSelectionBadge(){
    try {
      lastSelectionSnapshot = getSelectionSnapshot();
      selectionBadge.textContent = summarizeSelection(lastSelectionSnapshot);
    } catch (err) {
      console.warn('[ai-command-debug-panel] refreshSelectionBadge failed', err);
      try { selectionBadge.textContent = 'Виділення недоступне'; } catch {}
    }
  }

  function refreshDebugUi(){
    const enabled = isAiRuntimeDebugEnabled();
    debugToggleBtn.classList.toggle('is-active', enabled);
    debugToggleBtn.textContent = enabled ? 'Відлагодження: ВКЛ' : 'Відлагодження: ВИКЛ';
    debugNote.textContent = enabled
      ? 'Режим відлагодження увімкнений. Після кожного “Застосувати” система автоматично збереже команду, як вона її зрозуміла, і як саме виконала runtime-операції. Потім можеш відкрити журнал і скопіювати потрібні звіти.'
      : 'Режим відлагодження вимкнений. Увімкни його, щоб після “Застосувати” автоматично зберігати команду, розуміння команди і runtime-виконання в окремий журнал.';
  }

  function resetCopyButton(){
    copyBtn.disabled = false;
    copyBtn.textContent = 'Звіт';
    copyBtn.classList.remove('is-copied');
    copyBtn.classList.remove('is-visible');
  }

  function markCopied(){
    copyBtn.disabled = true;
    copyBtn.textContent = 'Звіт скопійований';
    copyBtn.classList.add('is-copied');
    copyBtn.classList.add('is-visible');
  }

  function setStatus(label){
    status.classList.remove('pass', 'fail', 'apply');
    status.textContent = label;
    if (label === 'PASS') status.classList.add('pass');
    if (label === 'FAIL') status.classList.add('fail');
    if (label === 'APPLY') status.classList.add('apply');
  }

  function setMessage(kind, textValue){
    message.classList.remove('pass', 'fail', 'apply', 'is-visible');
    message.textContent = String(textValue || '').trim();
    if (!message.textContent) return;
    message.classList.add('is-visible');
    if (kind === 'pass') message.classList.add('pass');
    if (kind === 'fail') message.classList.add('fail');
    if (kind === 'apply') message.classList.add('apply');
  }

  function updateParseView(inputText, assistantMessage){
    pre.textContent = JSON.stringify({
      manualStatus: lastManualEvaluation.pass ? 'PASS' : 'FAIL',
      issues: lastManualEvaluation.issues,
      inputText,
      selection: {
        type: lastSelectionSnapshot?.type || null,
        selectedCount: lastSelectionSnapshot?.selectedCount || 0,
        selectedElements: (lastSelectionSnapshot?.selectedElements || []).map((item) => ({ id: item.id, type: item.type, label: item.label })),
      },
      assistantMessage,
      result: lastManualResult,
    }, null, 2);
  }

  function updateRuntimeView(execution, mutationLog){
    runtimePre.textContent = JSON.stringify({
      selection: {
        type: lastSelectionSnapshot?.type || null,
        selectedCount: lastSelectionSnapshot?.selectedCount || 0,
        selectedElements: (lastSelectionSnapshot?.selectedElements || []).map((item) => ({ id: item.id, type: item.type, label: item.label })),
      },
      sync: execution?.results?.map((item) => item?.execution?.sync || null).filter(Boolean) || execution?.sync || null,
      persistence: execution?.results?.map((item) => item?.execution?.sync?.persistence || null).filter(Boolean) || execution?.persistence || null,
      execution,
      mutations: mutationLog,
    }, null, 2);
  }

  function uiSnapshot(){
    return {
      status: status.textContent || null,
      message: message.textContent || null,
      generateDisabled: !!btn.disabled,
      applyDisabled: !!applyBtn.disabled,
      debugEnabled: isAiRuntimeDebugEnabled(),
      hasParsedResult: !!lastManualResult,
      hasExecutionResult: !!lastExecutionResult,
      selection: {
        type: lastSelectionSnapshot?.type || null,
        selectedCount: lastSelectionSnapshot?.selectedCount || 0,
      },
    };
  }

  function pushUiTrace(event){
    const item = {
      at: new Date().toISOString(),
      ...(event && typeof event === "object" ? event : { event: String(event || "unknown") }),
      ui: uiSnapshot(),
    };
    uiTrace.push(item);
    if (uiTrace.length > 80) uiTrace = uiTrace.slice(-80);
    return item;
  }

  function flashActionButton(button){
    if (!button) return;
    button.classList.add("is-click-flash");
    window.setTimeout(() => button.classList.remove("is-click-flash"), 420);
  }

  function buildRuntimeContext(){
    lastMutationLog = [];
    if (typeof options.runtimeContextFactory === 'function') {
      return options.runtimeContextFactory({
        selectionSnapshot: lastSelectionSnapshot,
        mutationLog: lastMutationLog,
        defaultFactory: () => createBuilderRuntimeContext({ selectionSnapshot: lastSelectionSnapshot, mutationLog: lastMutationLog }),
      }) || createBuilderRuntimeContext({ selectionSnapshot: lastSelectionSnapshot, mutationLog: lastMutationLog });
    }
    return createBuilderRuntimeContext({ selectionSnapshot: lastSelectionSnapshot, mutationLog: lastMutationLog });
  }

  async function handleCopyFailReport(){
    if (lastManualEvaluation?.pass) {
      window.alert?.('Кнопка звіту активна тільки для FAIL-випадків.');
      return;
    }
    if (!lastManualResult) {
      window.alert?.('Спочатку виконай “Згенерувати”.');
      return;
    }
    try {
      const reportText = buildManualFailReport(textarea.value, lastManualResult, lastManualEvaluation);
      await copyText(reportText);
      markCopied();
    } catch (_) {
      window.alert?.('Не вдалося скопіювати звіт.');
    }
  }

  function persistDebugReport(extra = {}){
    if (!isAiRuntimeDebugEnabled()) return null;
    try {
      const saved = appendAiRuntimeDebugReport({
        inputText: textarea.value,
        assistantMessage: lastManualResult?.assistantMessage || lastManualResult?.warnings?.[0] || '',
        parsedResult: safeClone(lastManualResult),
        parseEvaluation: safeClone(lastManualEvaluation),
        executionResult: safeClone(lastExecutionResult),
        selectionBefore: safeClone(extra.selectionBefore || lastSelectionSnapshot),
        selectionAfter: safeClone(extra.selectionAfter || getSelectionSnapshot()),
        mutationLog: safeClone(lastMutationLog),
        uiTrace: safeClone(uiTrace),
        dryRun: !!dryRunCheckbox.checked,
        debugMode: true,
        source: 'ai_runtime_overlay',
        notes: {
          firstCommand: summarizeFirstCommand(lastManualResult),
          savedFrom: 'ai-command-debug-panel',
          ...(safeClone(extra.notes || {}) || {}),
        },
      });
      return saved;
    } catch (err) {
      console.warn('[ai-command-debug-panel] persistDebugReport failed', err);
      return null;
    }
  }

  async function run(trigger = "generate_button"){
    pushUiTrace({ event: "generate_click", button: "Згенерувати", phase: "start", trigger });
    flashActionButton(btn);
    btn.classList.add("is-busy");
    refreshSelectionBadge();
    resetCopyButton();
    setStatus('Parsing...');
    pre.textContent = 'Parsing...';
    setMessage('', '');
    try {
      const result = await parseAiCommand(textarea.value, options.parserOptions || {});
      lastManualResult = result;
      lastManualEvaluation = evaluateManualParse(result);
      lastExecutionResult = null;
      runtimePre.textContent = '{\n  "status": "idle"\n}';
      setStatus(lastManualEvaluation.pass ? 'PASS' : 'FAIL');
      if (!lastManualEvaluation.pass) copyBtn.classList.add('is-visible');
      const assistantMessage = result?.assistantMessage || result?.warnings?.[0] || (lastManualEvaluation.pass ? 'Команду зрозуміло.' : 'Команду розібрано не повністю.');
      setMessage(lastManualEvaluation.pass ? 'pass' : 'fail', assistantMessage);
      updateParseView(textarea.value, assistantMessage);
      applyBtn.disabled = !hasRuntimeContracts(result);
      if (!lastManualEvaluation.pass && options.audit !== false) {
        try {
          appendAuditEntry(
            textarea.value,
            result,
            {
              evaluation: lastManualEvaluation,
              source: 'manual_parse_debug',
              selectionContext: {
                selectedCount: lastSelectionSnapshot?.selectedCount || 0,
                selectedType: lastSelectionSnapshot?.type || null,
              },
            },
          );
          auditNote.textContent = 'FAIL-кейс автоматично записано в Аудит AI.';
        } catch {
          auditNote.textContent = 'Не вдалося записати кейс в Аудит AI.';
        }
      } else {
        auditNote.textContent = 'Кейс не записувався в аудит, бо parse успішний.';
      }
      pushUiTrace({ event: "generate_click", button: "Згенерувати", phase: "end", trigger, ok: true, parsePass: !!lastManualEvaluation.pass, applyEnabled: !applyBtn.disabled });
      btn.classList.remove("is-busy");
    } catch (err) {
      lastManualResult = { ok: false, error: String(err?.message || err) };
      lastManualEvaluation = { pass: false, issues: ['runtime_error'] };
      lastExecutionResult = null;
      setStatus('FAIL');
      copyBtn.classList.add('is-visible');
      setMessage('fail', 'Сталася помилка під час парсингу. Скопіюй звіт і надішли його для аналізу.');
      updateParseView(textarea.value, 'Сталася помилка під час парсингу.');
      applyBtn.disabled = true;
      pushUiTrace({ event: "generate_click", button: "Згенерувати", phase: "error", trigger, ok: false, error: String(err?.message || err), applyEnabled: false });
      btn.classList.remove("is-busy");
    }
  }
  async function applyParsed(){
    pushUiTrace({ event: "apply_click", button: "Застосувати", phase: "start", enabled: !applyBtn.disabled });
    flashActionButton(applyBtn);
    applyBtn.classList.add("is-busy");
    refreshSelectionBadge();
    if (!lastManualResult) {
      await run("auto_before_apply");
    }
    if (!lastManualResult) {
      pushUiTrace({ event: "apply_click", button: "Застосувати", phase: "cancelled", reason: "no_parse_result" });
      applyBtn.classList.remove("is-busy");
      return;
    }

    const selectionBefore = safeClone(lastSelectionSnapshot);

    if (!hasRuntimeContracts(lastManualResult)) {
      lastExecutionResult = { ok: false, reason: 'missing_apply_contract' };
      setStatus('FAIL');
      setMessage('fail', 'Для цієї команди поки немає runtime apply contract. Зараз “Застосувати” працює для design-policy та retry-variant сценаріїв.');
      updateRuntimeView({ ok: false, reason: 'missing_apply_contract' }, []);
      pushUiTrace({ event: "apply_click", button: "Застосувати", phase: "no_contract", ok: false, reason: "missing_apply_contract" });
      const saved = persistDebugReport({
        selectionBefore,
        selectionAfter: safeClone(getSelectionSnapshot()),
        notes: { reason: 'missing_apply_contract' },
      });
      if (saved) {
        setMessage('fail', `Для цієї команди поки немає runtime apply contract. Debug-звіт збережено (${saved.id}).`);
      }
      applyBtn.classList.remove("is-busy");
      return;
    }

    setStatus('APPLY');
    setMessage('apply', 'Виконую “Застосувати” через runtime executor...');
    const context = buildRuntimeContext();
    try {
      const execution = await executeParsedAiCommand(lastManualResult, {
        context,
        dryRun: !!dryRunCheckbox.checked,
      });
      lastExecutionResult = execution;
      updateRuntimeView(execution, lastMutationLog);
      refreshSelectionBadge();
      const selectionAfter = safeClone(lastSelectionSnapshot);
      pushUiTrace({ event: "apply_click", button: "Застосувати", phase: "execution_result", ok: !!execution?.ok, executedCommands: Number(execution?.executedCommands || 0), totalCommands: Number(execution?.totalCommands || 0), mutationCount: lastMutationLog.length });
      const saved = persistDebugReport({ selectionBefore, selectionAfter });
      if (execution?.ok) {
        setStatus('PASS');
        const applied = execution?.results?.reduce((sum, item) => sum + (item?.execution?.summary?.applied || 0), 0) || 0;
        const synced = execution?.results?.some((item) => item?.execution?.sync?.synced) ? ' Інспектор синхронізовано.' : '';
        const persistedCount = execution?.results?.reduce((sum, item) => sum + (item?.execution?.sync?.persistence?.patchCount || 0), 0) || 0;
        const persisted = dryRunCheckbox.checked ? '' : ` Persisted patches: ${persistedCount}.`;
        const mode = dryRunCheckbox.checked ? 'Dry run виконано успішно.' : 'Застосувати виконано успішно.';
        const debugSuffix = saved ? ` Debug-звіт збережено (${saved.id}).` : '';
        setMessage('pass', `${mode} Застосовано операцій: ${applied}.${synced}${persisted}${debugSuffix}`);
      } else {
        setStatus('FAIL');
        const debugSuffix = saved ? ` Debug-звіт збережено (${saved.id}).` : '';
        setMessage('fail', `Під час “Застосувати” частина операцій не виконалась. Переглянь runtime result нижче.${debugSuffix}`);
      }
      applyBtn.classList.remove("is-busy");
    } catch (err) {
      lastExecutionResult = { ok: false, error: String(err?.message || err) };
      updateRuntimeView(lastExecutionResult, lastMutationLog);
      setStatus('FAIL');
      const selectionAfter = safeClone(getSelectionSnapshot());
      pushUiTrace({ event: "apply_click", button: "Застосувати", phase: "error", ok: false, error: String(err?.message || err), mutationCount: lastMutationLog.length });
      const saved = persistDebugReport({
        selectionBefore,
        selectionAfter,
        notes: { error: String(err?.message || err) },
      });
      const debugSuffix = saved ? ` Debug-звіт збережено (${saved.id}).` : '';
      setMessage('fail', `Помилка “Застосувати”: ${String(err?.message || err)}.${debugSuffix}`);
      applyBtn.classList.remove("is-busy");
    }
  }

  btn.addEventListener('click', () => run("generate_button"));
  applyBtn.addEventListener('click', applyParsed);
  copyBtn.addEventListener('click', handleCopyFailReport);
  debugToggleBtn.addEventListener('click', () => {
    const next = !isAiRuntimeDebugEnabled();
    setAiRuntimeDebugEnabled(next);
    refreshDebugUi();
  });
  textarea.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      run("keyboard_ctrl_enter");
    }
  });
  document.addEventListener('st:selection-changed', refreshSelectionBadge);
  refreshSelectionBadge();
  refreshDebugUi();
  applyBtn.disabled = true;

  const mainRow = makeEl('div', 'st-ai-command-debug__row st-ai-command-debug__row--main');
  const debugRow = makeEl('div', 'st-ai-command-debug__row st-ai-command-debug__row--debug');
  const controlsRow = makeEl('div', 'st-ai-command-debug__row st-ai-command-debug__row--controls');
  const linksRow = makeEl('div', 'st-ai-command-debug__row st-ai-command-debug__row--links');
  const journalRow = makeEl('div', 'st-ai-command-debug__row st-ai-command-debug__row--journal');

  mainRow.appendChild(btn);
  mainRow.appendChild(applyBtn);
  mainRow.appendChild(status);
  debugRow.appendChild(debugToggleBtn);
  controlsRow.appendChild(selectionBadge);
  controlsRow.appendChild(dryRunLabel);
  controlsRow.appendChild(copyBtn);
  linksRow.appendChild(auditLink);
  linksRow.appendChild(testLink);
  journalRow.appendChild(reportsLink);
  wrap.appendChild(title);
  wrap.appendChild(textarea);
  wrap.appendChild(mainRow);
  wrap.appendChild(debugRow);
  wrap.appendChild(controlsRow);
  wrap.appendChild(linksRow);
  wrap.appendChild(journalRow);
  wrap.appendChild(hint);
  wrap.appendChild(debugNote);
  wrap.appendChild(auditNote);
  wrap.appendChild(message);
  wrap.appendChild(parseTitle);
  wrap.appendChild(pre);
  wrap.appendChild(runtimeTitle);
  wrap.appendChild(runtimePre);
  root.appendChild(wrap);
  return {
    root: wrap,
    parse: run,
    apply: applyParsed,
    getLastResult: () => lastManualResult,
    getLastEvaluation: () => lastManualEvaluation,
    getLastExecution: () => lastExecutionResult,
    copyFailReport: handleCopyFailReport,
    isDebugEnabled: () => isAiRuntimeDebugEnabled(),
    setDebugEnabled: (enabled) => { setAiRuntimeDebugEnabled(!!enabled); refreshDebugUi(); },
  };
}
