// 00829-ALL-LOG-RIGHT-PANEL
// Safe diagnostic drawer for the clean base. It records diagnostics only and does not create runtime layout logic.

const LOG_KEY = 'st_all_log_clean_base_v1';
const MAX_ROWS = 700;
let rows_ = [];
let booted_ = false;
let lastCopiedHash_ = '';
let suppressNextCopyReset_ = false;

function nowIso_(){
  try { return new Date().toISOString(); } catch (_) { return String(Date.now()); }
}

function hashText_(text){
  try {
    let h = 2166136261;
    const s = String(text || '');
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return String(h >>> 0) + ':' + String(s.length);
  } catch (_) { return String(Date.now()); }
}

function compact_(value, limit = 1800){
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value, safeReplacer_(), 2);
    return String(text || '').slice(0, limit);
  } catch (_) {
    return String(value || '').slice(0, limit);
  }
}

function safeReplacer_(){
  const seen = new WeakSet();
  return function replacer(_key, value){
    if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
    if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
    if (value && typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
      if (value instanceof Element) {
        return {
          tag: value.tagName,
          id: value.id || '',
          className: String(value.className || ''),
          text: String(value.textContent || '').trim().slice(0, 160)
        };
      }
    }
    return value;
  };
}

function readRows_(){
  try {
    const parsed = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    rows_ = Array.isArray(parsed) ? parsed.slice(-MAX_ROWS) : [];
  } catch (_) {
    rows_ = [];
  }
}

function saveRows_(){
  try { localStorage.setItem(LOG_KEY, JSON.stringify(rows_.slice(-MAX_ROWS))); } catch (_) {}
}

function pushLog_(event, detail = {}, level = 'info'){
  const row = {
    at: nowIso_(),
    level: String(level || 'info'),
    event: String(event || 'event'),
    detail: compact_(detail, 3000)
  };
  rows_.push(row);
  if (rows_.length > MAX_ROWS) rows_ = rows_.slice(-MAX_ROWS);
  saveRows_();
  try { window.dispatchEvent(new CustomEvent('st:all-log-updated', { detail: row })); } catch (_) {}
  return row;
}

function storageSnapshot_(){
  const ls = [];
  const ss = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) || '';
      ls.push({ key, length: value.length });
    }
  } catch (err) {
    ls.push({ error: err?.message || String(err) });
  }
  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      const value = sessionStorage.getItem(key) || '';
      ss.push({ key, length: value.length });
    }
  } catch (err) {
    ss.push({ error: err?.message || String(err) });
  }
  return { localStorage: ls, sessionStorage: ss };
}

function viewportSnapshot_(){
  try {
    const rect = (el) => {
      if (!(el instanceof Element)) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) };
    };
    const sc = document.querySelector('.canvas__scroll');
    const vv = window.visualViewport || null;
    const scTop = sc ? Math.round(sc.scrollTop || 0) : 0;
    const scMax = sc ? Math.round(Math.max(0, (sc.scrollHeight || 0) - (sc.clientHeight || 0))) : 0;
    return {
      window: {
        innerW: Math.round(window.innerWidth || 0),
        innerH: Math.round(window.innerHeight || 0),
        visualW: Math.round(vv?.width || 0),
        visualH: Math.round(vv?.height || 0),
        visualTop: Math.round(vv?.offsetTop || 0),
        htmlScrollTop: Math.round(document.documentElement?.scrollTop || 0),
        bodyScrollTop: Math.round(document.body?.scrollTop || 0)
      },
      scroller: sc ? {
        scrollTop: scTop,
        maxTop: scMax,
        clientH: Math.round(sc.clientHeight || 0),
        scrollH: Math.round(sc.scrollHeight || 0),
        rect: rect(sc),
        canScroll: scMax > 0,
        atBottom: scTop >= scMax - 2
      } : null,
      rects: {
        builderRoot: rect(document.getElementById('builder-root')),
        main: rect(document.querySelector('.builder__main')),
        canvas: rect(document.querySelector('.builder__canvas')),
        canvasHeader: rect(document.querySelector('.canvas__header')),
        canvasView: rect(document.getElementById('canvasView')),
        siteCanvas: rect(document.getElementById('site-canvas')),
        siteRoot: rect(document.getElementById('site-root')),
        headerSlot: rect(document.getElementById('st-site-header-slot')),
        footerSlot: rect(document.getElementById('st-site-footer-slot'))
      }
    };
  } catch (err) {
    return { error: err?.message || String(err) };
  }
}

function domSnapshot_(){
  const q = (selector) => document.querySelectorAll(selector).length;
  return {
    href: location.href,
    title: document.title,
    readyState: document.readyState,
    panels: q('.builder__settings-panel'),
    activePanels: q('.builder__settings-panel.is-active'),
    headerSlots: q('#st-site-header-slot, [data-site-header-slot]'),
    footerSlots: q('#st-site-footer-slot, [data-site-footer-slot]'),
    selected: q('.is-selected, .st-is-selected, [aria-selected="true"]'),
    buttons: q('button'),
    scripts: q('script'),
    viewport: viewportSnapshot_()
  };
}

function parseStoredLogTail_(key, limit = 60){
  try {
    const raw = localStorage.getItem(key) || '';
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.rows) ? parsed.rows : []);
    return arr.slice(-limit).map((item) => {
      try {
        if (typeof item === 'string') return item.slice(0, 1200);
        return JSON.parse(JSON.stringify(item, safeReplacer_()));
      } catch (_) { return compact_(item, 1200); }
    });
  } catch (err) {
    return [{ error: err?.message || String(err), key }];
  }
}

function staleLegacyContentMarker_(item){
  try {
    const text = typeof item === 'string' ? item : JSON.stringify(item, safeReplacer_());
    const parts = [
      ['main','natural','flow'], ['hmf','main'], ['main','contract'],
      ['main','selection'], ['main','drag'], ['main','resize'], ['main','frame'],
      ['ai','main','edit'], ['template','gallery','main'],
      ['st','main','section'], ['st','main','container'], ['st','main','row']
    ];
    return parts.some((tokens) => String(text || '').toLowerCase().includes(tokens.join('-')));
  } catch (_) { return false; }
}

function extraDiagnostics_(){
  const debugTail = parseStoredLogTail_('st_ai_design_debug_log_v1', 80).filter((item) => !staleLegacyContentMarker_(item));
  const perfTail = parseStoredLogTail_('st_ai_design_performance_log_v1', 80).filter((item) => !staleLegacyContentMarker_(item));
  return {
    aiDesignDebugTail: debugTail.slice(-40),
    performanceTail: perfTail.slice(-40),
    staleLegacyTailFiltered: true
  };
}

function templateStyleSyncSnapshot00954_(){
  try {
    const api = window.ST_TEMPLATE_STYLE_SYNC_00954;
    if (typeof api?.diagnostics !== 'function') {
      return { available: false, reason: 'template-style-sync-diagnostics-api-unavailable' };
    }
    return api.diagnostics();
  } catch (err) {
    return { available: false, error: err?.message || String(err) };
  }
}

function colorPickerProbeSnapshot01004_(){
  try {
    if (typeof window.ST_COLOR_PICKER_PROBE_01004?.runs === 'function') {
      return { available: true, runs: window.ST_COLOR_PICKER_PROBE_01004.runs() };
    }
    const parsed = JSON.parse(localStorage.getItem('st_color_picker_perf_probe_01004_v1') || '[]');
    return { available: Array.isArray(parsed), runs: Array.isArray(parsed) ? parsed : [] };
  } catch (err) {
    return { available: false, error: err?.message || String(err) };
  }
}

function buildReport_(){
  readRows_();
  const lines = [];
  lines.push('SHIFT TIME BUILDER · ALL LOG CLEAN BASE REPORT');
  lines.push(`Generated: ${nowIso_()}`);
  lines.push(`User agent: ${navigator.userAgent}`);
  lines.push('');
  lines.push('DOM SNAPSHOT');
  lines.push(JSON.stringify(domSnapshot_(), safeReplacer_(), 2));
  lines.push('');
  lines.push('STORAGE SNAPSHOT');
  lines.push(JSON.stringify(storageSnapshot_(), safeReplacer_(), 2));
  lines.push('');
  lines.push('TEMPLATE STYLE SYNC 00951 SNAPSHOT');
  lines.push(JSON.stringify(templateStyleSyncSnapshot00954_(), safeReplacer_(), 2));
  lines.push('');
  lines.push('EXTRA DIAGNOSTICS TAIL');
  lines.push(JSON.stringify(extraDiagnostics_(), safeReplacer_(), 2));
  lines.push('');
  lines.push('COLOR PICKER PERFORMANCE PROBE 01004');
  lines.push(JSON.stringify(colorPickerProbeSnapshot01004_(), safeReplacer_(), 2));
  lines.push('');
  lines.push(`LOG ROWS (${rows_.length})`);
  rows_.forEach((row, index) => {
    lines.push('');
    lines.push(`#${index + 1} [${row.level}] ${row.at} · ${row.event}`);
    lines.push(row.detail || '{}');
  });
  return lines.join('\n');
}

async function copyText_(text){
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {}
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', 'readonly');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  area.style.top = '0';
  document.body.appendChild(area);
  area.focus();
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
  area.remove();
  return ok;
}

function reportFileName_(){
  try {
    const iso = nowIso_().replace(/[:.]/g, '-');
    return `SHIFT_TIME_BUILDER_ALL_LOG_${iso}.txt`;
  } catch (_) { return 'SHIFT_TIME_BUILDER_ALL_LOG.txt'; }
}

function downloadReport_(text){
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = reportFileName_();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch (_) { return false; }
}

async function copyReportBlob_(text){
  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
    const blob = new Blob([text], { type: 'text/plain' });
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
    return true;
  } catch (_) { return false; }
}

function setCopyUi_(modal, report, copied){
  try {
    const btn = modal?.querySelector?.('[data-all-log-copy]');
    const fileBtn = modal?.querySelector?.('[data-all-log-file]');
    const status = modal?.querySelector?.('[data-all-log-status]');
    const hash = hashText_(report || buildReport_());
    const isFreshCopied = copied || (lastCopiedHash_ && hash === lastCopiedHash_);
    if (btn) btn.textContent = isFreshCopied ? 'Звіт скопійовано' : 'Скопіювати звіт';
    if (btn) btn.classList.toggle('is-copied', !!isFreshCopied);
    if (fileBtn) fileBtn.textContent = 'Зберегти звіт TXT';
    if (status && !isFreshCopied && lastCopiedHash_) status.textContent = 'Звіт оновився — можна копіювати знову.';
  } catch (_) {}
}

function ensureStyles_(){
  if (document.getElementById('st-all-log-style')) return;
  const style = document.createElement('style');
  style.id = 'st-all-log-style';
  style.textContent = `
    .st-all-log-btn{border:1px solid rgba(125,211,252,.65);background:rgba(14,165,233,.14);color:#e0f2fe;border-radius:14px;padding:8px 12px;font-weight:800;letter-spacing:.03em;box-shadow:0 0 0 1px rgba(15,23,42,.35),0 8px 24px rgba(14,165,233,.16);cursor:pointer;white-space:nowrap}
    .st-all-log-btn:hover{background:rgba(14,165,233,.24)}
    .st-all-log-btn.has-warn{border-color:rgba(248,113,113,.9);background:rgba(127,29,29,.34);color:#fee2e2}
    .st-all-log-modal{position:fixed;top:14px;right:14px;bottom:14px;width:min(560px,calc(100vw - 28px));z-index:999999;display:none;flex-direction:column;border:1px solid rgba(125,211,252,.35);border-radius:22px;background:linear-gradient(180deg,rgba(7,18,38,.98),rgba(2,8,23,.98));box-shadow:0 28px 80px rgba(0,0,0,.55);color:#e5f3ff;overflow:hidden}
    .st-all-log-modal.is-open{display:flex}
    .st-all-log-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 14px;border-bottom:1px solid rgba(148,163,184,.22);background:rgba(15,23,42,.72)}
    .st-all-log-title b{display:block;font-size:15px}.st-all-log-title span{display:block;margin-top:3px;font-size:12px;color:#9fb3c8;line-height:1.35}
    .st-all-log-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.st-all-log-actions button{border:1px solid rgba(148,163,184,.38);background:rgba(15,23,42,.7);color:#e5f3ff;border-radius:12px;padding:8px 10px;font-weight:700;cursor:pointer}.st-all-log-actions button:hover{border-color:rgba(125,211,252,.8)}.st-all-log-actions button.is-copied{border-color:rgba(34,197,94,.75);background:rgba(22,101,52,.35);color:#dcfce7}
    .st-all-log-body{display:flex;flex-direction:column;gap:10px;min-height:0;flex:1;padding:12px}.st-all-log-info{display:flex;gap:8px;flex-wrap:wrap}.st-all-log-chip{border:1px solid rgba(148,163,184,.25);border-radius:999px;padding:6px 10px;background:rgba(15,23,42,.55);font-size:12px;color:#cbd5e1}.st-all-log-chip b{color:#fff}
    .st-all-log-text{flex:1;min-height:250px;width:100%;box-sizing:border-box;resize:none;border:1px solid rgba(125,211,252,.25);border-radius:16px;background:rgba(2,6,23,.9);color:#dbeafe;padding:12px;font:12px/1.45 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;outline:none}.st-all-log-status{min-height:18px;font-size:12px;color:#bae6fd;line-height:1.35}
    @media (max-width:680px){.st-all-log-modal{left:10px;right:10px;top:10px;bottom:10px;width:auto}.st-all-log-head{flex-direction:column}.st-all-log-actions{justify-content:flex-start}}
  `;
  document.head.appendChild(style);
}

function ensureModal_(){
  ensureStyles_();
  let modal = document.getElementById('st-all-log-modal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'st-all-log-modal';
  modal.className = 'st-all-log-modal';
  modal.innerHTML = `
    <div class="st-all-log-head">
      <div class="st-all-log-title"><b>ALL LOG / Діагностика</b><span>Права панель: помилки, кліки, resize-події, DOM, storage; старі pre-clean хвости фільтруються.</span></div>
      <div class="st-all-log-actions">
        <button type="button" data-all-log-refresh>Оновити</button>
        <button type="button" data-all-log-copy>Скопіювати звіт</button>
        <button type="button" data-all-log-file>Зберегти звіт TXT</button>
        <button type="button" data-all-log-clear>Очистити</button>
        <button type="button" data-all-log-close>×</button>
      </div>
    </div>
    <div class="st-all-log-body">
      <div class="st-all-log-info" data-all-log-info></div>
      <textarea class="st-all-log-text" data-all-log-report spellcheck="false"></textarea>
      <div class="st-all-log-status" data-all-log-status></div>
    </div>
  `;
  document.body.appendChild(modal);

  const textarea = modal.querySelector('[data-all-log-report]');
  const status = modal.querySelector('[data-all-log-status]');
  const refresh = () => {
    readRows_();
    const report = buildReport_();
    const info = modal.querySelector('[data-all-log-info]');
    const errors = rows_.filter((row) => row.level === 'error').length;
    if (info) {
      info.innerHTML = `
        <span class="st-all-log-chip">Rows: <b>${rows_.length}</b></span>
        <span class="st-all-log-chip">Errors: <b>${errors}</b></span>
        <span class="st-all-log-chip">Ready: <b>${document.readyState}</b></span>
        <span class="st-all-log-chip">URL: <b>${location.pathname || '/'}</b></span>
      `;
    }
    if (textarea) textarea.value = report;
    setCopyUi_(modal, report, false);
    return report;
  };

  modal.querySelector('[data-all-log-refresh]')?.addEventListener('click', () => { pushLog_('all-log:refresh-click'); refresh(); });
  modal.querySelector('[data-all-log-copy]')?.addEventListener('click', async () => {
    pushLog_('all-log:copy-request');
    const report = refresh();
    const okFile = await copyReportBlob_(report);
    const okText = okFile || await copyText_(report);
    if (okText) {
      lastCopiedHash_ = hashText_(report);
      suppressNextCopyReset_ = true;
      if (status) status.textContent = okFile ? 'Звіт скопійовано у clipboard. Якщо чат не приймає як файл — натисни “Зберегти звіт TXT”.' : 'Звіт скопійовано як текст. Для файлу натисни “Зберегти звіт TXT”.';
      setCopyUi_(modal, report, true);
    } else {
      if (status) status.textContent = 'Не вдалось автокопіювати. Натисни “Зберегти звіт TXT” або виділи текст і Ctrl+C.';
      setCopyUi_(modal, report, false);
    }
  });
  modal.querySelector('[data-all-log-file]')?.addEventListener('click', () => {
    pushLog_('all-log:file-request');
    const report = refresh();
    const ok = downloadReport_(report);
    if (status) status.textContent = ok ? 'TXT-файл звіту збережено. Його можна прикріпити в чат як файл.' : 'Не вдалось створити файл. Скопіюй текст вручну.';
  });
  modal.querySelector('[data-all-log-clear]')?.addEventListener('click', () => {
    rows_ = [];
    saveRows_();
    pushLog_('all-log:cleared');
    lastCopiedHash_ = '';
    refresh();
    if (status) status.textContent = 'Лог очищено.';
  });
  modal.querySelector('[data-all-log-close]')?.addEventListener('click', () => modal.classList.remove('is-open'));
  window.addEventListener('st:all-log-updated', () => { if (modal.classList.contains('is-open')) refresh(); });
  refresh();
  return modal;
}

function openModal_(){
  const modal = ensureModal_();
  modal.classList.add('is-open');
  const textarea = modal.querySelector('[data-all-log-report]');
  const report = buildReport_();
  if (textarea) textarea.value = report;
  setCopyUi_(modal, report, false);
  pushLog_('all-log:open', domSnapshot_());
}

function ensureButton_(){
  ensureStyles_();
  if (document.getElementById('st-all-log-header-btn')) return;
  const host = document.querySelector('.builder__header-right') || document.querySelector('.builder__header-center') || document.querySelector('.builder__header') || document.body;
  const btn = document.createElement('button');
  btn.id = 'st-all-log-header-btn';
  btn.className = 'st-all-log-btn';
  btn.type = 'button';
  btn.textContent = 'ALL LOG';
  btn.title = 'Відкрити ALL LOG і скопіювати діагностичний звіт';
  btn.addEventListener('click', openModal_);
  host.insertBefore(btn, host.firstElementChild || null);
}

function describeElement_(el){
  try {
    if (!(el instanceof Element)) return null;
    const r = el.getBoundingClientRect?.();
    return {
      tag: el.tagName,
      id: el.id || '',
      className: String(el.className || '').slice(0, 220),
      text: String(el.textContent || '').trim().slice(0, 120),
      dataKind: el.getAttribute?.('data-st-design-select-kind') || el.getAttribute?.('data-kind') || el.getAttribute?.('data-node-kind') || '',
      handleKind: el.getAttribute?.('data-kind') || '',
      dir: el.getAttribute?.('data-dir') || '',
      rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null
    };
  } catch (_) { return null; }
}

function attachListeners_(){
  document.addEventListener('click', (ev) => {
    if (window.__ST_COLOR_PICKER_PROBE_SUPPRESS_ALL_LOG_01004 === true) return;
    const target = ev.target?.closest?.('button, [data-open-panel], [data-panel-id], a, input, select, textarea');
    if (!target || target.id === 'st-all-log-header-btn' || target.closest?.('#st-all-log-modal')) return;
    pushLog_('ui:click', {
      tag: target.tagName,
      id: target.id || '',
      className: String(target.className || '').slice(0, 220),
      text: String(target.textContent || target.value || '').trim().slice(0, 180),
      disabled: !!target.disabled,
      dataOpenPanel: target.getAttribute?.('data-open-panel') || '',
      dataAction: target.getAttribute?.('data-action') || target.getAttribute?.('data-ai-design-action') || ''
    });
  }, true);

  document.addEventListener('change', (ev) => {
    if (window.__ST_COLOR_PICKER_PROBE_SUPPRESS_ALL_LOG_01004 === true) return;
    const target = ev.target;
    if (!target || target.closest?.('#st-all-log-modal')) return;
    pushLog_('ui:change', {
      tag: target.tagName,
      id: target.id || '',
      className: String(target.className || '').slice(0, 220),
      name: target.name || '',
      type: target.type || '',
      value: String(target.value || '').slice(0, 240)
    });
  }, true);

  document.addEventListener('pointerdown', (ev) => {
    if (window.__ST_COLOR_PICKER_PROBE_SUPPRESS_ALL_LOG_01004 === true) return;
    try {
      const raw = ev.target instanceof Element ? ev.target : ev.target?.parentElement;
      const handle = raw?.closest?.('.st-resize,.st-resize-handle,[data-resize-handle]');
      if (!handle || handle.closest?.('#st-all-log-modal')) return;
      const owner = handle.closest?.('.st-block,.st-row,.st-section');
      pushLog_('ui:resize-pointerdown', {
        handle: describeElement_(handle),
        owner: describeElement_(owner),
        x: Math.round(Number(ev.clientX) || 0),
        y: Math.round(Number(ev.clientY) || 0),
        viewport: viewportSnapshot_()
      });
    } catch (_) {}
  }, true);

  document.addEventListener('pointerup', (ev) => {
    if (window.__ST_COLOR_PICKER_PROBE_SUPPRESS_ALL_LOG_01004 === true) return;
    try {
      const raw = ev.target instanceof Element ? ev.target : ev.target?.parentElement;
      if (!raw) return;
      const selected = document.querySelector('.hb-dom-active,.is-active,.is-selected,[aria-selected="true"]');
      pushLog_('ui:pointerup', {
        target: describeElement_(raw),
        selected: describeElement_(selected),
        x: Math.round(Number(ev.clientX) || 0),
        y: Math.round(Number(ev.clientY) || 0),
        viewport: viewportSnapshot_()
      });
    } catch (_) {}
  }, true);

  document.addEventListener('copy', () => {
    try {
      if (suppressNextCopyReset_) { suppressNextCopyReset_ = false; return; }
      lastCopiedHash_ = '';
      const modal = document.getElementById('st-all-log-modal');
      if (modal) setCopyUi_(modal, buildReport_(), false);
    } catch (_) {}
  }, true);

  window.addEventListener('error', (ev) => {
    pushLog_('window:error', {
      message: ev.message || '',
      filename: ev.filename || '',
      line: ev.lineno || 0,
      column: ev.colno || 0,
      error: ev.error ? { name: ev.error.name, message: ev.error.message, stack: ev.error.stack } : null
    }, 'error');
    document.getElementById('st-all-log-header-btn')?.classList.add('has-warn');
  });

  window.addEventListener('unhandledrejection', (ev) => {
    pushLog_('window:unhandledrejection', { reason: compact_(ev.reason, 3000) }, 'error');
    document.getElementById('st-all-log-header-btn')?.classList.add('has-warn');
  });
}

function boot_(){
  if (booted_) return;
  booted_ = true;
  readRows_();
  ensureButton_();
  attachListeners_();
  pushLog_('all-log:boot', domSnapshot_());
  window.__ST_ALL_LOG__ = {
    open: openModal_,
    copy: () => copyText_(buildReport_()),
    download: () => downloadReport_(buildReport_()),
    report: buildReport_,
    push: pushLog_,
    viewport: viewportSnapshot_,
    clear(){ rows_ = []; saveRows_(); }
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot_, { once: true });
} else {
  boot_();
}
