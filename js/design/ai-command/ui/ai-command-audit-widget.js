import { parseAiCommand } from '../core/command-parser.js';
import {
  buildAuditReport,
  buildRegressionDraftReport,
  buildRegressionPackPatchReport,
  clearAuditEntries,
  clearRegressionDraft,
  evaluateAuditResult,
  getAuditStats,
  listAuditEntries,
  loadRegressionDraft,
  removeAuditEntry,
  removeAuditEntries,
  removeResolvedAuditEntries,
  saveRegressionDraft,
  updateAuditReplay,
} from '../runtime/ai-command-audit-store.js';

function el(tag, className, text){
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function stringify(value){
  try { return JSON.stringify(value, null, 2); } catch (_) { return String(value ?? ''); }
}

async function copyText(text){
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }
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

function ensureStyles(){
  if (document.getElementById('st-ai-audit-widget-style')) return;
  const style = document.createElement('style');
  style.id = 'st-ai-audit-widget-style';
  style.textContent = `
    .st-ai-audit{display:grid;gap:14px;color:#e5e7eb}
    .st-ai-audit__head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
    .st-ai-audit__title{font-size:22px;font-weight:900}
    .st-ai-audit__sub{font-size:13px;opacity:.82;max-width:960px;line-height:1.45}
    .st-ai-audit__actions,.st-ai-audit__bulk-actions{display:flex;gap:10px;flex-wrap:wrap}
    .st-ai-audit__bulk-bar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px;border-radius:14px;background:#0b1220;border:1px solid rgba(255,255,255,.08)}
    .st-ai-audit__bulk-left{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
    .st-ai-audit__selection-label{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700}
    .st-ai-audit__btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:0;border-radius:12px;background:#1d4ed8;color:#fff;font-weight:800;cursor:pointer}
    .st-ai-audit__btn.secondary{background:#0f172a;border:1px solid rgba(255,255,255,.12)}
    .st-ai-audit__btn.warn{background:#92400e}
    .st-ai-audit__btn.danger{background:#b91c1c}
    .st-ai-audit__btn:disabled,.st-ai-audit__mini-btn:disabled{opacity:.5;cursor:not-allowed}
    .st-ai-audit__stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
    .st-ai-audit__card{padding:12px;border-radius:14px;background:#111827;border:1px solid rgba(255,255,255,.08)}
    .st-ai-audit__k{font-size:12px;opacity:.72}
    .st-ai-audit__v{font-size:20px;font-weight:900;margin-top:4px}
    .st-ai-audit__status-open{color:#fca5a5}
    .st-ai-audit__status-resolved{color:#86efac}
    .st-ai-audit__status-dup{color:#fde68a}
    .st-ai-audit__note{padding:10px 12px;border-radius:12px;background:#0f172a;border:1px solid rgba(255,255,255,.08);display:none;font-size:13px;line-height:1.45}
    .st-ai-audit__note.is-visible{display:block}
    .st-ai-audit__list{display:grid;gap:12px}
    .st-ai-audit__empty{padding:16px;border-radius:14px;background:#111827;border:1px dashed rgba(255,255,255,.14);opacity:.82}
    .st-ai-audit__row{padding:14px;border-radius:16px;background:#111827;border:1px solid rgba(255,255,255,.08)}
    .st-ai-audit__row-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:8px}
    .st-ai-audit__row-head-left{display:flex;gap:10px;align-items:flex-start}
    .st-ai-audit__check{margin-top:2px;accent-color:#2563eb;width:16px;height:16px}
    .st-ai-audit__row-title{font-weight:800;font-size:13px;opacity:.88}
    .st-ai-audit__row-meta{font-size:12px;opacity:.72}
    .st-ai-audit__badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:900;background:#1f2937}
    .st-ai-audit__badge.open{color:#fecaca}
    .st-ai-audit__badge.resolved{color:#bbf7d0}
    .st-ai-audit__input{font-size:14px;line-height:1.45;margin-bottom:8px;word-break:break-word}
    .st-ai-audit__msg{font-size:13px;line-height:1.45;color:#cbd5e1;margin-bottom:8px;word-break:break-word}
    .st-ai-audit__chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
    .st-ai-audit__chip{padding:4px 8px;border-radius:999px;background:#0f172a;border:1px solid rgba(255,255,255,.08);font-size:11px;opacity:.9}
    .st-ai-audit__row-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
    .st-ai-audit__mini-btn{padding:8px 10px;border-radius:10px;border:0;background:#1d4ed8;color:#fff;font-weight:800;cursor:pointer;font-size:12px}
    .st-ai-audit__mini-btn.secondary{background:#0f172a;border:1px solid rgba(255,255,255,.12)}
    .st-ai-audit details{margin-top:10px}
    .st-ai-audit pre{margin:8px 0 0;padding:12px;border-radius:12px;background:#020617;color:#d1fae5;overflow:auto;max-height:300px;white-space:pre-wrap;word-break:break-word}
    .st-ai-audit__draft{padding:14px;border-radius:16px;background:#0b1220;border:1px solid rgba(255,255,255,.08)}
    .st-ai-audit__draft-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap;margin-bottom:8px}
    .st-ai-audit__draft-title{font-size:16px;font-weight:900}
    .st-ai-audit__draft-meta{font-size:12px;opacity:.74}
    .st-ai-audit__draft pre{margin:0;max-height:280px;background:#07101c;color:#dbeafe}
    @media (max-width:1100px){.st-ai-audit__stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
}

function setNote(noteEl, text){
  noteEl.textContent = String(text || '').trim();
  noteEl.classList.toggle('is-visible', !!noteEl.textContent);
}

function renderStats(host, entries){
  host.innerHTML = '';
  const stats = getAuditStats(entries);
  const items = [
    ['Унікальні кейси', stats.totalEntries, ''],
    ['Усі спрацювання', stats.totalOccurrences, ''],
    ['Відкриті', stats.openEntries, 'st-ai-audit__status-open'],
    ['Виправлені', stats.resolvedEntries, 'st-ai-audit__status-resolved'],
    ['Дублікати', stats.duplicateOccurrences, 'st-ai-audit__status-dup'],
  ];
  for (const [k, v, cls] of items) {
    const card = el('div', 'st-ai-audit__card');
    card.append(el('div', 'st-ai-audit__k', k), el('div', `st-ai-audit__v ${cls}`.trim(), String(v)));
    host.appendChild(card);
  }
}

function caseReport(entry){
  const lines = [];
  lines.push('=== AI AUDIT CASE START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`EntryId: ${entry.id}`);
  lines.push(`Status: ${entry.resolved ? 'RESOLVED' : 'OPEN'}`);
  lines.push(`Count: ${Number(entry.count || 1)}`);
  lines.push(`Input: ${String(entry.input || '')}`);
  if (entry.assistantMessage) lines.push(`assistantMessage: ${String(entry.assistantMessage)}`);
  if (entry.ruleId) lines.push(`ruleId: ${String(entry.ruleId)}`);
  if (Array.isArray(entry.issues) && entry.issues.length) lines.push(`issues: ${stringify(entry.issues)}`);
  lines.push('Result:');
  lines.push(stringify(entry.lastResult || entry.result || null));
  lines.push('=== AI AUDIT CASE END ===');
  return lines.join('\n');
}

function detailsPayload(item){
  return {
    evaluation: item.lastEvaluation || item.evaluation || null,
    lastReplayEvaluation: item.lastReplayEvaluation || null,
    unknownTokens: item.unknownTokens || [],
    unknownPhrases: item.unknownPhrases || [],
    lastResult: item.lastResult || item.result || null,
    lastReplayResult: item.lastReplayResult || null,
  };
}

function renderList(host, entries, selectedIds){
  host.innerHTML = '';
  if (!entries.length) {
    host.appendChild(el('div', 'st-ai-audit__empty', 'Журнал аудиту порожній. Після незрозумілих команд нові кейси з’являться тут автоматично.'));
    return;
  }
  for (const item of entries) {
    const row = el('div', 'st-ai-audit__row');
    row.dataset.auditId = item.id;

    const head = el('div', 'st-ai-audit__row-head');
    const leftWrap = el('div', 'st-ai-audit__row-head-left');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'st-ai-audit__check';
    checkbox.dataset.action = 'toggle-select';
    checkbox.checked = selectedIds.has(item.id);
    checkbox.setAttribute('aria-label', `Вибрати ${item.id}`);

    const left = el('div');
    left.append(
      el('div', 'st-ai-audit__row-title', item.id),
      el('div', 'st-ai-audit__row-meta', `count=${Number(item.count || 1)} • lastSeen=${String(item.lastSeenAt || '').replace('T', ' ').slice(0, 19)}`)
    );
    leftWrap.append(checkbox, left);
    const badge = el('div', `st-ai-audit__badge ${item.resolved ? 'resolved' : 'open'}`.trim(), item.resolved ? 'RESOLVED' : 'OPEN');
    head.append(leftWrap, badge);

    const input = el('div', 'st-ai-audit__input', item.input || '');
    const msg = el('div', 'st-ai-audit__msg', item.assistantMessage || '—');
    const chips = el('div', 'st-ai-audit__chips');
    [
      item.ruleId ? `rule: ${item.ruleId}` : null,
      item.action ? `action: ${item.action}` : null,
      item.target ? `target: ${item.target}` : null,
      item.property ? `property: ${item.property}` : null,
      item.selectionContext?.selectedCount ? `selected: ${item.selectionContext.selectedCount}` : null,
    ].filter(Boolean).forEach((text) => chips.appendChild(el('div', 'st-ai-audit__chip', text)));

    const actions = el('div', 'st-ai-audit__row-actions');
    const copyBtn = el('button', 'st-ai-audit__mini-btn', 'Скопіювати кейс');
    copyBtn.type = 'button';
    copyBtn.dataset.action = 'copy-case';
    const replayBtn = el('button', 'st-ai-audit__mini-btn secondary', 'Replay');
    replayBtn.type = 'button';
    replayBtn.dataset.action = 'replay-case';
    const regressionBtn = el('button', 'st-ai-audit__mini-btn secondary', 'Regression');
    regressionBtn.type = 'button';
    regressionBtn.dataset.action = 'regression-case';
    const removeBtn = el('button', 'st-ai-audit__mini-btn secondary', 'Видалити');
    removeBtn.type = 'button';
    removeBtn.dataset.action = 'remove-case';
    actions.append(copyBtn, replayBtn, regressionBtn, removeBtn);

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Деталі / JSON';
    const pre = document.createElement('pre');
    pre.textContent = stringify(detailsPayload(item));
    details.append(summary, pre);

    row.append(head, input, msg, chips, actions, details);
    host.appendChild(row);
  }
}


function renderDraftPreview(host){
  host.innerHTML = '';
  const draft = loadRegressionDraft();
  const patch = draft?.packPatch || null;
  const box = el('div', 'st-ai-audit__draft');
  const head = el('div', 'st-ai-audit__draft-head');
  const left = el('div');
  const metaText = draft?.meta?.generatedAt
    ? `generated=${String(draft.meta.generatedAt).replace('T', ' ').slice(0, 19)} • cases=${Number(draft.meta.totalCases || 0)}`
    : 'Regression patch ще не створений';
  left.append(el('div', 'st-ai-audit__draft-title', 'Regression patch preview'), el('div', 'st-ai-audit__draft-meta', metaText));
  head.append(left);
  const pre = document.createElement('pre');
  pre.textContent = patch ? stringify(patch) : 'Скопіюй regression patch з аудиту, і тут з’явиться готовий JSON-міст у parser-test-commands.json та parser-expected-results.json.';
  box.append(head, pre);
  host.append(box);
}

function getSelectedEntries(allEntries, selectedIds){
  const selected = allEntries.filter((item) => selectedIds.has(item.id));
  return selected;
}

export function initAiCommandAuditWidget(host, options = {}){
  const root = typeof host === 'string' ? document.querySelector(host) : host;
  if (!root) return null;
  ensureStyles();
  root.innerHTML = '';

  const wrap = el('div', 'st-ai-audit');
  const head = el('div', 'st-ai-audit__head');
  const headText = el('div');
  headText.append(
    el('div', 'st-ai-audit__title', 'Аудит AI'),
    el('div', 'st-ai-audit__sub', 'Тут автоматично накопичуються незрозумілі або проблемні команди. Журнал допомагає зловити живі фрази, replay-нути їх після фіксів, виділяти кейси галочками, чистити PASS-кейси і швидко перекидати живі фрази в regression draft.')
  );
  const actions = el('div', 'st-ai-audit__actions');
  const refreshBtn = el('button', 'st-ai-audit__btn secondary', 'Оновити');
  const replayBtn = el('button', 'st-ai-audit__btn', 'Прогнати повторно');
  const copyBtn = el('button', 'st-ai-audit__btn warn', 'Скопіювати звіт');
  const regressionBtn = el('button', 'st-ai-audit__btn secondary', 'Скопіювати regression');
  const regressionPatchBtn = el('button', 'st-ai-audit__btn secondary', 'Скопіювати regression patch');
  const removePassBtn = el('button', 'st-ai-audit__btn danger', 'Видалити PASS');
  const clearDraftBtn = el('button', 'st-ai-audit__btn danger', 'Очистити regression');
  const clearBtn = el('button', 'st-ai-audit__btn danger', 'Очистити журнал');
  [refreshBtn, replayBtn, copyBtn, regressionBtn, regressionPatchBtn, removePassBtn, clearDraftBtn, clearBtn].forEach((btn) => { btn.type = 'button'; });
  actions.append(refreshBtn, replayBtn, copyBtn, regressionBtn, regressionPatchBtn, removePassBtn, clearDraftBtn, clearBtn);
  head.append(headText, actions);

  const bulkBar = el('div', 'st-ai-audit__bulk-bar');
  const bulkLeft = el('div', 'st-ai-audit__bulk-left');
  const selectAllLabel = el('label', 'st-ai-audit__selection-label');
  const selectAll = document.createElement('input');
  selectAll.type = 'checkbox';
  selectAll.className = 'st-ai-audit__check';
  const selectedCountText = el('span', '', 'Вибрано: 0');
  selectAllLabel.append(selectAll, selectedCountText);
  bulkLeft.append(selectAllLabel);

  const bulkActions = el('div', 'st-ai-audit__bulk-actions');
  const copySelectedBtn = el('button', 'st-ai-audit__btn secondary', 'Скопіювати вибрані');
  const replaySelectedBtn = el('button', 'st-ai-audit__btn secondary', 'Replay вибрані');
  const regressionSelectedBtn = el('button', 'st-ai-audit__btn secondary', 'Regression з вибраних');
  const deleteSelectedBtn = el('button', 'st-ai-audit__btn danger', 'Видалити вибрані');
  [copySelectedBtn, replaySelectedBtn, regressionSelectedBtn, deleteSelectedBtn].forEach((btn) => { btn.type = 'button'; btn.disabled = true; });
  bulkActions.append(copySelectedBtn, replaySelectedBtn, regressionSelectedBtn, deleteSelectedBtn);
  bulkBar.append(bulkLeft, bulkActions);

  const note = el('div', 'st-ai-audit__note', '');
  const stats = el('div', 'st-ai-audit__stats');
  const draftPreview = el('div', 'st-ai-audit__draft-wrap');
  const list = el('div', 'st-ai-audit__list');

  let entries = [];
  const selectedIds = new Set();

  function updateBulkUi(){
    const count = selectedIds.size;
    selectedCountText.textContent = `Вибрано: ${count}`;
    const allVisibleSelected = entries.length > 0 && entries.every((item) => selectedIds.has(item.id));
    const someVisibleSelected = entries.some((item) => selectedIds.has(item.id));
    selectAll.checked = allVisibleSelected;
    selectAll.indeterminate = !allVisibleSelected && someVisibleSelected;
    [copySelectedBtn, replaySelectedBtn, regressionSelectedBtn, deleteSelectedBtn].forEach((btn) => {
      btn.disabled = count === 0;
    });
  }

  function refresh(){
    entries = listAuditEntries();
    const validIds = new Set(entries.map((item) => item.id));
    for (const id of Array.from(selectedIds)) {
      if (!validIds.has(id)) selectedIds.delete(id);
    }
    renderStats(stats, entries);
    renderDraftPreview(draftPreview);
    renderList(list, entries, selectedIds);
    updateBulkUi();
  }

  async function replayEntries(items){
    if (!items.length) {
      setNote(note, 'Немає вибраних кейсів для replay.');
      return;
    }
    let open = 0;
    for (const item of items) {
      try {
        const result = await parseAiCommand(item.input || '', options.parserOptions || {});
        const evaluation = evaluateAuditResult(result);
        updateAuditReplay(item.id, result, { evaluation, replaceLiveSnapshot: true });
        if (!evaluation.pass) open += 1;
      } catch (_) {
        open += 1;
      }
    }
    refresh();
    setNote(note, open ? `Replay завершено. Ще відкритих кейсів у вибірці: ${open}.` : 'Replay завершено. Усі вибрані кейси зараз проходять.');
  }

  async function copyAudit(entriesToCopy){
    await copyText(buildAuditReport(entriesToCopy));
  }

  async function copyRegression(entriesToCopy){
    saveRegressionDraft(entriesToCopy);
    await copyText(buildRegressionDraftReport(entriesToCopy));
  }

  async function copyRegressionPatch(entriesToCopy){
    saveRegressionDraft(entriesToCopy);
    await copyText(buildRegressionPackPatchReport(entriesToCopy));
  }

  refreshBtn.addEventListener('click', () => {
    refresh();
    setNote(note, 'Журнал аудиту оновлено.');
  });

  replayBtn.addEventListener('click', async () => {
    replayBtn.disabled = true;
    replayBtn.textContent = 'Replay...';
    try {
      await replayEntries(listAuditEntries());
    } finally {
      replayBtn.disabled = false;
      replayBtn.textContent = 'Прогнати повторно';
    }
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await copyAudit(listAuditEntries());
      setNote(note, 'Повний звіт аудиту скопійовано.');
    } catch (_) {
      setNote(note, 'Не вдалося скопіювати повний звіт аудиту.');
    }
  });

  regressionBtn.addEventListener('click', async () => {
    const rows = listAuditEntries().filter((item) => !item.resolved);
    try {
      await copyRegression(rows);
      refresh();
      setNote(note, rows.length ? `Regression draft (${rows.length} кейсів) скопійовано.` : 'Відкритих кейсів для regression draft немає.');
    } catch (_) {
      setNote(note, 'Не вдалося скопіювати regression draft.');
    }
  });

  regressionPatchBtn.addEventListener('click', async () => {
    const rows = listAuditEntries().filter((item) => !item.resolved);
    try {
      await copyRegressionPatch(rows);
      refresh();
      setNote(note, rows.length ? `Regression patch (${rows.length} кейсів) скопійовано.` : 'Відкритих кейсів для regression patch немає.');
    } catch (_) {
      setNote(note, 'Не вдалося скопіювати regression patch.');
    }
  });

  clearDraftBtn.addEventListener('click', () => {
    clearRegressionDraft();
    refresh();
    setNote(note, 'Regression draft очищено.');
  });

  removePassBtn.addEventListener('click', () => {
    const removed = removeResolvedAuditEntries();
    refresh();
    setNote(note, removed ? `Видалено PASS/RESOLVED кейсів: ${removed}.` : 'PASS/RESOLVED кейсів для видалення немає.');
  });

  clearBtn.addEventListener('click', () => {
    clearAuditEntries();
    selectedIds.clear();
    refresh();
    setNote(note, 'Журнал аудиту очищено.');
  });

  selectAll.addEventListener('change', () => {
    if (selectAll.checked) {
      entries.forEach((item) => selectedIds.add(item.id));
    } else {
      entries.forEach((item) => selectedIds.delete(item.id));
    }
    refresh();
  });

  copySelectedBtn.addEventListener('click', async () => {
    const rows = getSelectedEntries(listAuditEntries(), selectedIds);
    try {
      await copyAudit(rows);
      setNote(note, `Скопійовано вибраних кейсів: ${rows.length}.`);
    } catch (_) {
      setNote(note, 'Не вдалося скопіювати вибрані кейси.');
    }
  });

  replaySelectedBtn.addEventListener('click', async () => {
    const rows = getSelectedEntries(listAuditEntries(), selectedIds);
    await replayEntries(rows);
  });

  regressionSelectedBtn.addEventListener('click', async () => {
    const rows = getSelectedEntries(listAuditEntries(), selectedIds);
    try {
      await copyRegressionPatch(rows);
      refresh();
      setNote(note, rows.length ? `Скопійовано regression patch з вибраних кейсів: ${rows.length}.` : 'Немає вибраних кейсів для regression patch.');
    } catch (_) {
      setNote(note, 'Не вдалося скопіювати regression patch із вибраних кейсів.');
    }
  });

  deleteSelectedBtn.addEventListener('click', () => {
    const removed = removeAuditEntries(Array.from(selectedIds));
    selectedIds.clear();
    refresh();
    setNote(note, removed ? `Видалено вибраних кейсів: ${removed}.` : 'Немає вибраних кейсів для видалення.');
  });

  list.addEventListener('change', (event) => {
    const checkbox = event.target.closest('input[data-action="toggle-select"]');
    if (!checkbox) return;
    const row = checkbox.closest('[data-audit-id]');
    if (!row) return;
    const entryId = row.dataset.auditId;
    if (checkbox.checked) selectedIds.add(entryId);
    else selectedIds.delete(entryId);
    updateBulkUi();
  });

  list.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const row = btn.closest('[data-audit-id]');
    if (!row) return;
    const entryId = row.dataset.auditId;
    const entry = listAuditEntries().find((item) => item.id === entryId);
    if (!entry) return;
    const action = btn.dataset.action;

    if (action === 'copy-case') {
      try {
        await copyText(caseReport(entry));
        setNote(note, `Кейс ${entryId} скопійовано.`);
      } catch (_) {
        setNote(note, `Не вдалося скопіювати кейс ${entryId}.`);
      }
      return;
    }

    if (action === 'remove-case') {
      removeAuditEntry(entryId);
      selectedIds.delete(entryId);
      refresh();
      setNote(note, `Кейс ${entryId} видалено.`);
      return;
    }

    if (action === 'replay-case') {
      try {
        const result = await parseAiCommand(entry.input || '', options.parserOptions || {});
        const evaluation = evaluateAuditResult(result);
        updateAuditReplay(entryId, result, { evaluation, replaceLiveSnapshot: true });
        refresh();
        setNote(note, evaluation.pass ? `Кейс ${entryId} тепер проходить.` : `Кейс ${entryId} все ще відкритий.`);
      } catch (_) {
        setNote(note, `Не вдалося replay-нути кейс ${entryId}.`);
      }
      return;
    }

    if (action === 'regression-case') {
      try {
        await copyRegressionPatch([entry]);
        refresh();
        setNote(note, `Regression patch для кейса ${entryId} скопійовано.`);
      } catch (_) {
        setNote(note, `Не вдалося підготувати regression patch для кейса ${entryId}.`);
      }
    }
  });

  wrap.append(head, bulkBar, note, stats, draftPreview, list);
  root.appendChild(wrap);
  refresh();
  return {
    root: wrap,
    refresh,
    replayAll: () => replayEntries(listAuditEntries()),
    copyAudit: () => copyAudit(listAuditEntries()),
    copyRegression: () => copyRegression(listAuditEntries().filter((item) => !item.resolved)),
    clear: clearAuditEntries,
  };
}
