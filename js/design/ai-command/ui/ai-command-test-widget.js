import { initAiCommandDebugPanel } from './ai-command-debug-panel.js';
import { runParserExpectedCases } from '../tests/parser-test-runner.js';

function el(tag, className, text){
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function ensureStyles(){
  if (document.getElementById('st-ai-command-test-widget-style')) return;
  const style = document.createElement('style');
  style.id = 'st-ai-command-test-widget-style';
  style.textContent = `
    .st-ai-test{display:grid;gap:14px;padding:14px;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#0f172a;color:#e5e7eb}
    .st-ai-test__head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .st-ai-test__title{font-weight:800;font-size:18px}
    .st-ai-test__sub{font-size:12px;opacity:.7}
    .st-ai-test__actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .st-ai-test__btn{padding:10px 14px;border:0;border-radius:10px;background:#2563eb;color:#fff;cursor:pointer;font-weight:700;transition:background-color .18s ease, opacity .18s ease}
    .st-ai-test__btn:disabled{opacity:.7;cursor:default}
    .st-ai-test__btn--report{background:#16a34a}
    .st-ai-test__btn--report.is-copied{background:#dc2626}
    .st-ai-test__checkbox{display:inline-flex;gap:8px;align-items:center;font-size:12px;opacity:.9}
    .st-ai-test__stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    .st-ai-test__card{padding:10px 12px;border-radius:12px;background:#111827;border:1px solid rgba(255,255,255,.08)}
    .st-ai-test__k{font-size:12px;opacity:.7}
    .st-ai-test__v{font-size:20px;font-weight:800;margin-top:4px}
    .st-ai-test__status-pass{color:#86efac}
    .st-ai-test__status-fail{color:#fca5a5}
    .st-ai-test__grid{display:grid;grid-template-columns:minmax(320px,1fr) minmax(360px,1.1fr);gap:14px}
    .st-ai-test__panel{min-width:0}
    .st-ai-test__list{display:grid;gap:10px;max-height:640px;overflow:auto}
    .st-ai-test__row{padding:10px 12px;border-radius:12px;background:#111827;border:1px solid rgba(255,255,255,.08)}
    .st-ai-test__row-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:6px}
    .st-ai-test__row-id{font-weight:700;font-size:12px;opacity:.8}
    .st-ai-test__row-badge{font-size:11px;padding:4px 8px;border-radius:999px;background:#1f2937}
    .st-ai-test__row-badge.pass{color:#86efac}
    .st-ai-test__row-badge.fail{color:#fca5a5}
    .st-ai-test__row-text{font-size:13px;line-height:1.35;word-break:break-word;margin-bottom:8px}
    .st-ai-test__diff{font-size:12px;line-height:1.45;color:#cbd5e1;word-break:break-word}
    .st-ai-test__empty{padding:12px;border-radius:12px;background:#111827;border:1px dashed rgba(255,255,255,.12);font-size:13px;opacity:.8}
    @media (max-width: 1100px){.st-ai-test__grid{grid-template-columns:1fr}.st-ai-test__stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);
}

function renderStats(statsHost, report){
  statsHost.innerHTML = '';
  const items = [
    ['Total', report ? report.total : 0, ''],
    ['Passed', report ? report.passed : 0, 'st-ai-test__status-pass'],
    ['Failed', report ? report.failed : 0, report && report.failed ? 'st-ai-test__status-fail' : ''],
    ['Status', report ? (report.ok ? 'PASS' : 'FAIL') : 'idle', report ? (report.ok ? 'st-ai-test__status-pass' : 'st-ai-test__status-fail') : ''],
  ];
  for (const [k,v,cls] of items){
    const card = el('div','st-ai-test__card');
    const key = el('div','st-ai-test__k',k);
    const val = el('div',`st-ai-test__v ${cls}`.trim(),String(v));
    card.append(key,val);
    statsHost.appendChild(card);
  }
}


function stringifyValue(value){
  if (value == null) return 'null';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (_) {
    return String(value);
  }
}

function buildReportText(report){
  const lines = [];
  lines.push('=== RUN PARSE TESTS REPORT START ===');
  lines.push(`Generated: ${new Date().toLocaleString('uk-UA')}`);
  lines.push(`Status: ${report?.ok ? 'PASS' : 'FAIL'}`);
  lines.push(`Total: ${report?.total ?? 0}`);
  lines.push(`Passed: ${report?.passed ?? 0}`);
  lines.push(`Failed: ${report?.failed ?? 0}`);
  lines.push('');
  lines.push('By group:');
  const byGroup = report?.byGroup || {};
  const groupKeys = Object.keys(byGroup);
  if (!groupKeys.length) {
    lines.push('- none');
  } else {
    for (const key of groupKeys) {
      const item = byGroup[key] || {};
      lines.push(`- ${key}: total=${item.total ?? 0}, passed=${item.passed ?? 0}, failed=${item.failed ?? 0}`);
    }
  }
  lines.push('');
  lines.push('Cases:');
  const rows = Array.isArray(report?.results) ? report.results : [];
  if (!rows.length) {
    lines.push('- none');
  } else {
    for (const row of rows) {
      lines.push(`--- ${row.id} [${row.pass ? 'PASS' : 'FAIL'}] ---`);
      lines.push(`text: ${row.text || ''}`);
      lines.push(`group: ${row.group || 'ungrouped'}`);
      lines.push(`expected: ${stringifyValue(row.expected)}`);
      lines.push(`actual: ${stringifyValue(row.actual)}`);
      if (Array.isArray(row.diffs) && row.diffs.length) {
        lines.push(`diffs: ${stringifyValue(row.diffs)}`);
      }
      if (Array.isArray(row.warnings) && row.warnings.length) {
        lines.push(`warnings: ${stringifyValue(row.warnings)}`);
      }
      lines.push('');
    }
  }
  lines.push('=== RUN PARSE TESTS REPORT END ===');
  return lines.join('\n');
}

async function copyReportText(text){
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

function renderList(listHost, report){
  listHost.innerHTML = '';
  if (!report) {
    listHost.appendChild(el('div','st-ai-test__empty','Ще не запускали тестовий пакет. Натисни “Run parser tests”.'));
    return;
  }
  const failures = report.results.filter(r => !r.pass);
  const rows = failures.length ? failures : report.results.slice(0, Math.min(report.results.length, 8));
  if (!rows.length) {
    listHost.appendChild(el('div','st-ai-test__empty','Немає рядків для відображення.'));
    return;
  }
  for (const row of rows){
    const wrap = el('div','st-ai-test__row');
    const head = el('div','st-ai-test__row-head');
    const id = el('div','st-ai-test__row-id', row.id);
    const badge = el('div',`st-ai-test__row-badge ${row.pass ? 'pass' : 'fail'}`.trim(), row.pass ? 'PASS' : 'FAIL');
    head.append(id,badge);
    const text = el('div','st-ai-test__row-text', row.text);
    const diff = el('div','st-ai-test__diff');
    if (row.pass) {
      diff.textContent = `action=${row.actual?.action || '—'} • target=${row.actual?.target || '—'} • property=${row.actual?.property || '—'}`;
    } else {
      diff.textContent = (row.diffs || []).map(d => `${d.field}: expected ${JSON.stringify(d.expected)} / actual ${JSON.stringify(d.actual)}`).join(' | ');
    }
    wrap.append(head,text,diff);
    listHost.appendChild(wrap);
  }
}

export function initAiCommandTestWidget(host, options = {}){
  const root = typeof host === 'string' ? document.querySelector(host) : host;
  if (!root) return null;
  ensureStyles();
  root.innerHTML = '';

  const wrap = el('div','st-ai-test');
  const head = el('div','st-ai-test__head');
  const headText = el('div');
  headText.append(el('div','st-ai-test__title','AI Command Test Widget'), el('div','st-ai-test__sub','Візуальний тест parser-only шару. Консоль — допоміжна, основна перевірка тут.'));
  const actions = el('div','st-ai-test__actions');
  const runBtn = el('button','st-ai-test__btn','Run parser tests');
  const reportBtn = el('button','st-ai-test__btn st-ai-test__btn--report','Звіт');
  const consoleLabel = el('label','st-ai-test__checkbox');
  const consoleCheckbox = document.createElement('input');
  consoleCheckbox.type = 'checkbox';
  consoleCheckbox.checked = !!options.logToConsole;
  consoleLabel.append(consoleCheckbox, document.createTextNode('Log to console'));
  actions.append(runBtn, reportBtn, consoleLabel);
  head.append(headText, actions);

  const stats = el('div','st-ai-test__stats');
  renderStats(stats, null);

  const grid = el('div','st-ai-test__grid');
  const left = el('div','st-ai-test__panel');
  const right = el('div','st-ai-test__panel');
  const listTitle = el('div','st-ai-test__title','Test results');
  listTitle.style.fontSize = '15px';
  listTitle.style.marginBottom = '8px';
  const list = el('div','st-ai-test__list');
  renderList(list, null);
  right.append(listTitle, list);

  const debugHost = el('div');
  left.appendChild(debugHost);
  const debugPanel = initAiCommandDebugPanel(debugHost, options.debugOptions || {});

  let lastReport = null;

  function resetReportButton(){
    reportBtn.disabled = false;
    reportBtn.classList.remove('is-copied');
    reportBtn.textContent = 'Звіт';
  }

  function markReportCopied(){
    reportBtn.disabled = true;
    reportBtn.classList.add('is-copied');
    reportBtn.textContent = 'Звіт скопійований';
  }

  async function handleCopyReport(){
    if (!lastReport) {
      window.alert?.('Спочатку запусти Run parser tests, щоб сформувати звіт.');
      return;
    }
    try {
      await copyReportText(buildReportText(lastReport));
      markReportCopied();
    } catch (err) {
      if (consoleCheckbox.checked) console.error('[AI command test widget] copy failed', err);
      window.alert?.('Не вдалося скопіювати звіт.');
    }
  }

  async function runTests(){
    resetReportButton();
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    try {
      lastReport = await runParserExpectedCases({ logToConsole: consoleCheckbox.checked, parserOptions: options.parserOptions || {} });
      renderStats(stats, lastReport);
      renderList(list, lastReport);
    } catch (err) {
      lastReport = { ok:false, total:0, passed:0, failed:0, results:[{ id:'runtime', text:String(err?.message || err), pass:false, diffs:[{ field:'runner', expected:'no error', actual:String(err?.message || err) }], actual:{} }] };
      renderStats(stats, lastReport);
      renderList(list, lastReport);
      if (consoleCheckbox.checked) console.error('[AI command test widget] run failed', err);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Run parser tests';
    }
  }

  runBtn.addEventListener('click', runTests);
  reportBtn.addEventListener('click', handleCopyReport);
  resetReportButton();
  grid.append(left, right);
  wrap.append(head, stats, grid);
  root.appendChild(wrap);
  return { root: wrap, debugPanel, runTests, getReport: () => lastReport, copyReport: handleCopyReport };
}
