import {
  buildAiRuntimeDebugReport,
  buildAiRuntimeDebugReportsBundle,
  clearAiRuntimeDebugReports,
  getAiRuntimeDebugStats,
  listAiRuntimeDebugReports,
  removeAiRuntimeDebugReport,
  removeAiRuntimeDebugReports,
} from '../runtime/ai-command-debug-store.js';

function el(tag, className, text){
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
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
  if (document.getElementById('st-ai-runtime-debug-widget-style')) return;
  const style = document.createElement('style');
  style.id = 'st-ai-runtime-debug-widget-style';
  style.textContent = `
    .st-ai-runtime-debug{display:grid;gap:14px;color:#e5e7eb}
    .st-ai-runtime-debug__head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
    .st-ai-runtime-debug__title{font-size:22px;font-weight:900}
    .st-ai-runtime-debug__sub{font-size:13px;opacity:.82;max-width:980px;line-height:1.45}
    .st-ai-runtime-debug__actions,.st-ai-runtime-debug__bulk-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
    .st-ai-runtime-debug__btn{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:0;border-radius:12px;background:#1d4ed8;color:#fff;cursor:pointer;font-weight:800;transition:background-color .18s ease,opacity .18s ease}
    .st-ai-runtime-debug__btn:disabled{opacity:.6;cursor:default}
    .st-ai-runtime-debug__btn--copy{background:#16a34a}
    .st-ai-runtime-debug__btn--delete{background:#dc2626}
    .st-ai-runtime-debug__btn--ghost{background:#0f172a;border:1px solid rgba(255,255,255,.12);color:#e2e8f0}
    .st-ai-runtime-debug__btn--copied{background:#b91c1c !important}
    .st-ai-runtime-debug__stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .st-ai-runtime-debug__card{padding:12px 14px;border-radius:14px;background:#0b1220;border:1px solid rgba(255,255,255,.08)}
    .st-ai-runtime-debug__k{font-size:12px;opacity:.72}
    .st-ai-runtime-debug__v{font-size:22px;font-weight:900;margin-top:4px}
    .st-ai-runtime-debug__v.pass{color:#86efac}
    .st-ai-runtime-debug__v.fail{color:#fca5a5}
    .st-ai-runtime-debug__bulk-bar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px;border-radius:14px;background:#0b1220;border:1px solid rgba(255,255,255,.08)}
    .st-ai-runtime-debug__bulk-left{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    .st-ai-runtime-debug__selection-label{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700}
    .st-ai-runtime-debug__list{display:grid;gap:12px}
    .st-ai-runtime-debug__empty{padding:16px;border-radius:14px;background:#0b1220;border:1px dashed rgba(255,255,255,.12);opacity:.82}
    .st-ai-runtime-debug__row{padding:14px;border-radius:16px;background:#0f172a;border:1px solid rgba(255,255,255,.08);display:grid;gap:12px}
    .st-ai-runtime-debug__row-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
    .st-ai-runtime-debug__row-left{display:flex;gap:10px;align-items:flex-start;min-width:0}
    .st-ai-runtime-debug__checkbox{margin-top:3px}
    .st-ai-runtime-debug__meta{display:grid;gap:4px;min-width:0}
    .st-ai-runtime-debug__command{font-size:16px;font-weight:800;line-height:1.35;word-break:break-word}
    .st-ai-runtime-debug__submeta{font-size:12px;opacity:.74;display:flex;gap:10px;flex-wrap:wrap}
    .st-ai-runtime-debug__badge{display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;font-size:11px;font-weight:900;background:#1f2937;color:#cbd5e1}
    .st-ai-runtime-debug__badge.pass{color:#86efac}
    .st-ai-runtime-debug__badge.fail{color:#fca5a5}
    .st-ai-runtime-debug__chips{display:flex;gap:8px;flex-wrap:wrap}
    .st-ai-runtime-debug__chip{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#111827;border:1px solid rgba(255,255,255,.08);font-size:12px;color:#dbeafe}
    .st-ai-runtime-debug__row-actions{display:flex;gap:8px;flex-wrap:wrap}
    .st-ai-runtime-debug__details{border-radius:14px;background:#0b1220;border:1px solid rgba(255,255,255,.08);overflow:hidden}
    .st-ai-runtime-debug__details > summary{cursor:pointer;list-style:none;padding:12px 14px;font-weight:800}
    .st-ai-runtime-debug__details > summary::-webkit-details-marker{display:none}
    .st-ai-runtime-debug__details-body{display:grid;gap:12px;padding:0 14px 14px}
    .st-ai-runtime-debug__section-title{font-size:12px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;opacity:.72}
    .st-ai-runtime-debug pre{margin:0;padding:12px;border-radius:12px;background:#020617;border:1px solid rgba(255,255,255,.06);overflow:auto;max-height:360px;color:#cbd5e1;white-space:pre-wrap;word-break:break-word}
    .st-ai-runtime-debug__notice{display:none;padding:10px 12px;border-radius:12px;font-size:13px;line-height:1.45}
    .st-ai-runtime-debug__notice.is-visible{display:block}
    .st-ai-runtime-debug__notice.pass{background:rgba(22,163,74,.14);color:#bbf7d0;border:1px solid rgba(34,197,94,.3)}
    .st-ai-runtime-debug__notice.fail{background:rgba(220,38,38,.14);color:#fecaca;border:1px solid rgba(248,113,113,.3)}
    @media (max-width: 1100px){.st-ai-runtime-debug__stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media (max-width: 760px){.st-ai-runtime-debug__stats{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function formatDate(value){
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('uk-UA');
  } catch (_) {
    return String(value);
  }
}

function stringify(value){
  try {
    return JSON.stringify(value, null, 2);
  } catch (_) {
    return String(value ?? '');
  }
}

function summarizeChip(value, fallback = '—'){
  if (value == null) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value.raw === 'string' && value.raw.trim()) return value.raw.trim();
    if (typeof value.label === 'string' && value.label.trim()) return value.label.trim();
    if (typeof value.colorId === 'string' && value.colorId.trim()) return value.colorId.trim();
    if (typeof value.value === 'number') return `${value.value}${value.unit || ''}`.trim();
  }
  return fallback;
}

function buildSummaryForRow(report){
  const voice = report?.voiceDetails || null;
  if (report?.reportKind === 'voice_command') {
    return {
      action: voice?.uiCommand?.type || voice?.flow || 'voice',
      target: voice?.button?.label || voice?.target || 'voice_widget',
      property: voice?.button?.selector || voice?.controlType || 'speech',
      value: voice?.normalizedText || voice?.rawText || summarizeChip(voice?.result),
    };
  }
  const first = Array.isArray(report?.parsedSummary?.commands) ? report.parsedSummary.commands[0] : null;
  return {
    action: first?.action || (voice ? 'ai+voice' : '—'),
    target: first?.target || '—',
    property: first?.property || '—',
    value: summarizeChip(first?.value),
  };
}

export function initAiCommandDebugReportWidget(host){
  const root = typeof host === 'string' ? document.querySelector(host) : host;
  if (!root) return null;
  ensureStyles();
  root.innerHTML = '';

  const state = { selectedIds: new Set() };

  const wrap = el('div', 'st-ai-runtime-debug');
  const head = el('div', 'st-ai-runtime-debug__head');
  const headText = el('div');
  headText.append(
    el('div', 'st-ai-runtime-debug__title', 'AI / Voice Debug Reports'),
    el('div', 'st-ai-runtime-debug__sub', 'Тут зберігаються живі звіти AI Runtime і голосових команд: що система почула, як нормалізувала текст, які кнопки натиснула, як зрозуміла команду і що виконала.'),
  );
  const actions = el('div', 'st-ai-runtime-debug__actions');
  const copyAllBtn = el('button', 'st-ai-runtime-debug__btn st-ai-runtime-debug__btn--copy', 'Копіювати всі');
  const clearAllBtn = el('button', 'st-ai-runtime-debug__btn st-ai-runtime-debug__btn--delete', 'Очистити все');
  actions.append(copyAllBtn, clearAllBtn);
  head.append(headText, actions);

  const notice = el('div', 'st-ai-runtime-debug__notice');
  const stats = el('div', 'st-ai-runtime-debug__stats');
  const bulkBar = el('div', 'st-ai-runtime-debug__bulk-bar');
  const bulkLeft = el('div', 'st-ai-runtime-debug__bulk-left');
  const selectAllLabel = el('label', 'st-ai-runtime-debug__selection-label');
  const selectAllCheckbox = document.createElement('input');
  selectAllCheckbox.type = 'checkbox';
  selectAllCheckbox.className = 'st-ai-runtime-debug__checkbox';
  const selectionText = el('span', '', 'Вибрано: 0');
  selectAllLabel.append(selectAllCheckbox, selectionText);
  const bulkActions = el('div', 'st-ai-runtime-debug__bulk-actions');
  const copySelectedBtn = el('button', 'st-ai-runtime-debug__btn st-ai-runtime-debug__btn--copy', 'Копіювати вибрані');
  const deleteSelectedBtn = el('button', 'st-ai-runtime-debug__btn st-ai-runtime-debug__btn--delete', 'Видалити вибрані');
  bulkActions.append(copySelectedBtn, deleteSelectedBtn);
  bulkLeft.append(selectAllLabel);
  bulkBar.append(bulkLeft, bulkActions);

  const list = el('div', 'st-ai-runtime-debug__list');

  function setNotice(kind, text){
    notice.className = 'st-ai-runtime-debug__notice';
    notice.textContent = String(text || '').trim();
    if (!notice.textContent) return;
    notice.classList.add('is-visible');
    if (kind === 'pass') notice.classList.add('pass');
    if (kind === 'fail') notice.classList.add('fail');
  }

  function clearNotice(){
    notice.className = 'st-ai-runtime-debug__notice';
    notice.textContent = '';
  }

  function renderStats(reports){
    stats.innerHTML = '';
    const summary = getAiRuntimeDebugStats(reports);
    const cards = [
      ['Усього', summary.total, ''],
      ['PASS', summary.passed, 'pass'],
      ['FAIL', summary.failed, summary.failed ? 'fail' : ''],
      ['Dry run', summary.dryRun, ''],
    ];
    for (const [key, value, cls] of cards) {
      const card = el('div', 'st-ai-runtime-debug__card');
      card.append(el('div', 'st-ai-runtime-debug__k', key), el('div', `st-ai-runtime-debug__v ${cls}`.trim(), String(value)));
      stats.appendChild(card);
    }
  }

  function getReports(){
    return listAiRuntimeDebugReports();
  }

  function getSelectedReports(reports){
    return reports.filter((item) => state.selectedIds.has(String(item.id || '')));
  }

  function updateBulkState(reports){
    const total = reports.length;
    const selectedCount = getSelectedReports(reports).length;
    selectionText.textContent = `Вибрано: ${selectedCount}`;
    selectAllCheckbox.checked = !!total && selectedCount === total;
    selectAllCheckbox.indeterminate = selectedCount > 0 && selectedCount < total;
    copySelectedBtn.disabled = selectedCount === 0;
    deleteSelectedBtn.disabled = selectedCount === 0;
    copyAllBtn.disabled = total === 0;
    clearAllBtn.disabled = total === 0;
  }

  async function handleCopyReports(reports, targetBtn = null){
    if (!reports.length) {
      setNotice('fail', 'Немає звітів для копіювання.');
      return;
    }
    try {
      await copyText(buildAiRuntimeDebugReportsBundle(reports));
      setNotice('pass', `Скопійовано звітів: ${reports.length}. Тепер можеш вставити їх у чат.`);
      if (targetBtn) {
        const prev = targetBtn.textContent;
        targetBtn.classList.add('st-ai-runtime-debug__btn--copied');
        targetBtn.textContent = 'Скопійовано';
        setTimeout(() => {
          targetBtn.classList.remove('st-ai-runtime-debug__btn--copied');
          targetBtn.textContent = prev;
        }, 1400);
      }
    } catch (_) {
      setNotice('fail', 'Не вдалося скопіювати звіт.');
    }
  }

  function renderList(){
    const reports = getReports();
    renderStats(reports);
    updateBulkState(reports);
    list.innerHTML = '';

    if (!reports.length) {
      list.appendChild(el('div', 'st-ai-runtime-debug__empty', 'Ще немає жодного debug-звіту. Увімкни відлагодження в AI-шаблонах або скористайся голосовою командою.'));
      return;
    }

    for (const report of reports) {
      const summary = buildSummaryForRow(report);
      const row = el('div', 'st-ai-runtime-debug__row');
      const headRow = el('div', 'st-ai-runtime-debug__row-head');
      const left = el('div', 'st-ai-runtime-debug__row-left');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'st-ai-runtime-debug__checkbox';
      checkbox.checked = state.selectedIds.has(String(report.id || ''));
      checkbox.addEventListener('change', () => {
        const id = String(report.id || '');
        if (checkbox.checked) state.selectedIds.add(id);
        else state.selectedIds.delete(id);
        updateBulkState(getReports());
        clearNotice();
      });

      const meta = el('div', 'st-ai-runtime-debug__meta');
      meta.append(el('div', 'st-ai-runtime-debug__command', report.inputText || '—'));
      const submeta = el('div', 'st-ai-runtime-debug__submeta');
      submeta.append(
        el('span', '', `ID: ${report.id}`),
        el('span', '', `Створено: ${formatDate(report.createdAt)}`),
        el('span', '', `Режим: ${report.dryRun ? 'dry-run' : 'apply'}`),
        el('span', '', `Джерело: ${report.source || 'ai_runtime_overlay'}`),
      );
      meta.appendChild(submeta);
      left.append(checkbox, meta);

      const right = el('div', 'st-ai-runtime-debug__row-actions');
      const badge = el('div', `st-ai-runtime-debug__badge ${String(report.status || '') === 'FAIL' ? 'fail' : 'pass'}`.trim(), report.status || 'PASS');
      const copyBtn = el('button', 'st-ai-runtime-debug__btn st-ai-runtime-debug__btn--copy', 'Копіювати звіт');
      const deleteBtn = el('button', 'st-ai-runtime-debug__btn st-ai-runtime-debug__btn--delete', 'Видалити');
      copyBtn.addEventListener('click', async () => {
        try {
          await copyText(buildAiRuntimeDebugReport(report));
          setNotice('pass', `Звіт ${report.id} скопійовано.`);
        } catch (_) {
          setNotice('fail', `Не вдалося скопіювати звіт ${report.id}.`);
        }
      });
      deleteBtn.addEventListener('click', () => {
        state.selectedIds.delete(String(report.id || ''));
        removeAiRuntimeDebugReport(report.id);
        renderList();
        setNotice('pass', `Звіт ${report.id} видалено.`);
      });
      right.append(badge, copyBtn, deleteBtn);
      headRow.append(left, right);

      const chips = el('div', 'st-ai-runtime-debug__chips');
      chips.append(
        el('div', 'st-ai-runtime-debug__chip', `action: ${summary.action}`),
        el('div', 'st-ai-runtime-debug__chip', `target: ${summary.target}`),
        el('div', 'st-ai-runtime-debug__chip', `property: ${summary.property}`),
        el('div', 'st-ai-runtime-debug__chip', `value: ${summary.value}`),
        el('div', 'st-ai-runtime-debug__chip', `source: ${report.source || 'ai_runtime_overlay'}`),
      );

      const details = el('details', 'st-ai-runtime-debug__details');
      const detailsSummary = document.createElement('summary');
      detailsSummary.textContent = 'Показати деталі';
      const detailsBody = el('div', 'st-ai-runtime-debug__details-body');
      const detailBlocks = [];
      if (report.reportKind === 'voice_command' || report.voiceDetails) {
        detailBlocks.push(
          el('div', 'st-ai-runtime-debug__section-title', 'Voice Command Details'),
          (() => { const pre = document.createElement('pre'); pre.textContent = stringify(report.voiceDetails || null); return pre; })(),
        );
      }
      detailBlocks.push(
        el('div', 'st-ai-runtime-debug__section-title', 'Як система зрозуміла команду'),
        (() => { const pre = document.createElement('pre'); pre.textContent = stringify({ parseEvaluation: report.parseEvaluation, parsedSummary: report.parsedSummary, selectionBefore: report.selectionBefore }); return pre; })(),
        el('div', 'st-ai-runtime-debug__section-title', 'Як система виконала команду'),
        (() => { const pre = document.createElement('pre'); pre.textContent = stringify({ executionSummary: report.executionSummary, selectionAfter: report.selectionAfter, mutationLog: report.mutationLog, executionResult: report.executionResult }); return pre; })(),
      );
      detailsBody.append(...detailBlocks);
      details.append(detailsSummary, detailsBody);

      row.append(headRow, chips, details);
      list.appendChild(row);
    }
  }

  selectAllCheckbox.addEventListener('change', () => {
    const reports = getReports();
    state.selectedIds.clear();
    if (selectAllCheckbox.checked) {
      for (const report of reports) state.selectedIds.add(String(report.id || ''));
    }
    renderList();
    clearNotice();
  });

  copyAllBtn.addEventListener('click', () => handleCopyReports(getReports(), copyAllBtn));
  copySelectedBtn.addEventListener('click', () => handleCopyReports(getSelectedReports(getReports()), copySelectedBtn));
  deleteSelectedBtn.addEventListener('click', () => {
    const selected = Array.from(state.selectedIds);
    if (!selected.length) {
      setNotice('fail', 'Спочатку вибери звіти галочками.');
      return;
    }
    removeAiRuntimeDebugReports(selected);
    state.selectedIds.clear();
    renderList();
    setNotice('pass', `Видалено звітів: ${selected.length}.`);
  });
  clearAllBtn.addEventListener('click', () => {
    clearAiRuntimeDebugReports();
    state.selectedIds.clear();
    renderList();
    setNotice('pass', 'Усі debug-звіти очищено.');
  });

  window.addEventListener('storage', (event) => {
    if (event.key && !/st_ai_runtime_debug_reports_v1/i.test(event.key)) return;
    renderList();
  });

  wrap.append(head, notice, stats, bulkBar, list);
  root.appendChild(wrap);
  renderList();
  return {
    root: wrap,
    refresh: renderList,
    getReports,
  };
}
