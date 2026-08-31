// js/resize-diagnostics.js
// [00389][RESIZE DIAGNOSTICS + LIGHT VIEWPORT REFLOW MODE]
// Легкий діагностичний модуль для перевірки затримок при maximize/restore
// та перетягуванні браузера між моніторами. Не змінює розміри примусово,
// не диспатчить додаткові resize-події і не читає layout на кожен піксель руху.

const ST_RESIZE_DIAG_STAGE = '00389';
const root = document.documentElement;
const MAX_LOG = 80;
const log = [];

let enabled = false;
try { enabled = localStorage.getItem('ST_RESIZE_DIAG_ENABLED') === '1'; } catch (_) { enabled = false; }
let hud = null;
let latestLine = '';
let resizeLiveTimer = 0;
let burstTimer = 0;
let burstActive = false;
let burstEvents = 0;
let burstStartedAt = 0;
let lastSampleAt = 0;
let sampleTimer = 0;
let updateHudTimer = 0;

function now_() {
  try { return performance.now(); } catch (_) { return Date.now(); }
}

function round_(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v * 10) / 10 : null;
}

function rectOf_(selector) {
  try {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el || typeof el.getBoundingClientRect !== 'function') return null;
    const r = el.getBoundingClientRect();
    return {
      w: round_(r.width),
      h: round_(r.height),
      x: round_(r.x),
      y: round_(r.y),
    };
  } catch (_) {
    return null;
  }
}

function counts_() {
  try {
    const siteRoot = document.querySelector('#canvasView #site-root') || document.getElementById('site-root');
    return {
      sections: siteRoot ? siteRoot.querySelectorAll('.st-section').length : 0,
      rows: siteRoot ? siteRoot.querySelectorAll('.st-row').length : 0,
      blocks: siteRoot ? siteRoot.querySelectorAll('.st-block').length : 0,
      menus: siteRoot ? siteRoot.querySelectorAll('.st-block--menu').length : 0,
    };
  } catch (_) {
    return {};
  }
}

function metrics_(sampleLayout = false) {
  const vv = window.visualViewport || null;
  const doc = document.documentElement || null;
  const m = {
    t: round_(now_()),
    stage: ST_RESIZE_DIAG_STAGE,
    dpr: round_(window.devicePixelRatio || 1),
    inner: { w: window.innerWidth || 0, h: window.innerHeight || 0 },
    outer: { w: window.outerWidth || 0, h: window.outerHeight || 0 },
    screen: {
      x: round_(window.screenX ?? window.screenLeft ?? 0),
      y: round_(window.screenY ?? window.screenTop ?? 0),
      aw: window.screen?.availWidth || null,
      ah: window.screen?.availHeight || null,
    },
    doc: {
      cw: doc?.clientWidth || null,
      ch: doc?.clientHeight || null,
    },
    vv: vv ? {
      w: round_(vv.width),
      h: round_(vv.height),
      scale: round_(vv.scale || 1),
      offsetLeft: round_(vv.offsetLeft || 0),
      offsetTop: round_(vv.offsetTop || 0),
    } : null,
  };

  if (sampleLayout) {
    m.rects = {
      builder: rectOf_('#builder-root'),
      main: rectOf_('#builder-root .builder__main'),
      canvas: rectOf_('#builder-root .builder__canvas'),
      canvasScroll: rectOf_('#builder-root .canvas__scroll'),
      siteCanvas: rectOf_('#site-canvas'),
      settings: rectOf_('#builder-settings-sidebar'),
      sidebar: rectOf_('#builder-main-sidebar'),
    };
    m.counts = counts_();
  }

  return m;
}

function push_(type, detail = {}, opts = {}) {
  if (!enabled) return null;
  const entry = {
    seq: log.length ? (log[log.length - 1].seq + 1) : 1,
    type,
    detail: detail || {},
    metrics: metrics_(!!opts.sampleLayout),
  };
  log.push(entry);
  while (log.length > MAX_LOG) log.shift();
  latestLine = `${entry.seq}. ${type}`;
  scheduleHudUpdate_();
  try {
    if (type === 'longtask' || type === 'canvas-reflow-slow' || type === 'resize-burst-end') {
      console.info('[ST_RESIZE_DIAG]', entry);
    } else {
      console.debug?.('[ST_RESIZE_DIAG]', entry);
    }
  } catch (_) {}
  return entry;
}

function setResizeLive_() {
  try {
    root.classList.add('st-resize-live');
    document.body?.classList?.add('st-resize-live');
  } catch (_) {}
  clearTimeout(resizeLiveTimer);
  resizeLiveTimer = window.setTimeout(() => {
    try {
      root.classList.remove('st-resize-live');
      document.body?.classList?.remove('st-resize-live');
    } catch (_) {}
  }, 220);
}

function finishBurst_() {
  if (!burstActive) return;
  const duration = now_() - burstStartedAt;
  push_('resize-burst-end', { events: burstEvents, durationMs: round_(duration) }, { sampleLayout: true });
  burstActive = false;
  burstEvents = 0;
}

function scheduleBurstSample_(reason) {
  if (!enabled) return;
  const t = now_();
  if (t - lastSampleAt < 110) return;
  lastSampleAt = t;
  clearTimeout(sampleTimer);
  requestAnimationFrame(() => push_('resize-sample-raf', { reason }, { sampleLayout: true }));
  [90, 220, 520].forEach((ms) => {
    window.setTimeout(() => push_(`resize-sample-${ms}ms`, { reason }, { sampleLayout: true }), ms);
  });
}

function onResizeSignal_(reason) {
  if (!enabled) return;
  setResizeLive_();
  if (!burstActive) {
    burstActive = true;
    burstStartedAt = now_();
    burstEvents = 0;
    push_('resize-burst-start', { reason }, { sampleLayout: true });
  }
  burstEvents += 1;
  push_('resize-event', { reason, burstEvents }, { sampleLayout: false });
  scheduleBurstSample_(reason);
  clearTimeout(burstTimer);
  burstTimer = window.setTimeout(finishBurst_, 650);
}

function css_() {
  if (document.getElementById('st-resize-diag-style')) return;
  const style = document.createElement('style');
  style.id = 'st-resize-diag-style';
  style.textContent = `
    html.st-resize-live #builder-root.builder,
    html.st-resize-live #builder-root.builder .builder__main,
    html.st-resize-live #builder-root.builder .builder__canvas,
    html.st-resize-live #builder-root.builder .canvas__scroll,
    html.st-resize-live #builder-root.builder #builder-main-sidebar,
    html.st-resize-live #builder-root.builder #builder-settings-sidebar,
    html.st-resize-live #builder-root.builder #builder-settings-resizer{
      transition: none !important;
    }
    .st-resize-diag-hud{
      position: fixed;
      right: 14px;
      bottom: 14px;
      z-index: 2147483000;
      width: min(420px, calc(100vw - 28px));
      border-radius: 18px;
      border: 1px solid rgba(56,189,248,.45);
      background: linear-gradient(145deg, rgba(2,6,23,.95), rgba(15,23,42,.93));
      color: #e5f4ff;
      box-shadow: 0 24px 70px rgba(0,0,0,.46), 0 0 0 1px rgba(255,255,255,.06) inset;
      font: 12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      backdrop-filter: blur(18px);
      overflow: hidden;
    }
    .st-resize-diag-hud.is-hidden{ display:none !important; }
    .st-resize-diag-head{
      display:flex;
      align-items:center;
      gap:8px;
      padding:10px 12px;
      border-bottom:1px solid rgba(148,163,184,.22);
      background: radial-gradient(circle at top left, rgba(56,189,248,.18), transparent 65%);
    }
    .st-resize-diag-dot{
      width:10px;height:10px;border-radius:999px;
      background:#22c55e; box-shadow:0 0 18px rgba(34,197,94,.75);
      flex:0 0 auto;
    }
    .st-resize-diag-title{ font-weight:800; letter-spacing:.04em; text-transform:uppercase; flex:1 1 auto; }
    .st-resize-diag-body{ padding:10px 12px 12px; display:grid; gap:8px; }
    .st-resize-diag-line{ color:#cbd5e1; word-break:break-word; }
    .st-resize-diag-line b{ color:#f8fafc; }
    .st-resize-diag-grid{ display:grid; grid-template-columns:1fr 1fr; gap:6px; }
    .st-resize-diag-pill{
      padding:6px 8px; border-radius:12px; background:rgba(15,23,42,.86);
      border:1px solid rgba(148,163,184,.22); color:#dbeafe;
    }
    .st-resize-diag-actions{ display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }
    .st-resize-diag-actions button{
      appearance:none; border:1px solid rgba(56,189,248,.42); border-radius:999px;
      background:rgba(14,165,233,.12); color:#e0f2fe; padding:7px 10px;
      cursor:pointer; font-weight:700; font-size:12px;
    }
    .st-resize-diag-actions button:hover{ background:rgba(14,165,233,.22); }
    .st-resize-diag-actions button[data-kind="off"]{ border-color:rgba(248,113,113,.45); background:rgba(127,29,29,.18); color:#fecaca; }
  `;
  document.head.appendChild(style);
}

function latestMetrics_() {
  return log.length ? log[log.length - 1].metrics : metrics_(true);
}

function createHud_() {
  if (hud || !document.body) return hud;
  css_();
  hud = document.createElement('div');
  hud.className = 'st-resize-diag-hud';
  hud.innerHTML = `
    <div class="st-resize-diag-head">
      <span class="st-resize-diag-dot"></span>
      <span class="st-resize-diag-title">Resize diagnostics ${ST_RESIZE_DIAG_STAGE}</span>
    </div>
    <div class="st-resize-diag-body">
      <div class="st-resize-diag-line" data-line>Очікування resize/maximize...</div>
      <div class="st-resize-diag-grid">
        <div class="st-resize-diag-pill" data-win>window: —</div>
        <div class="st-resize-diag-pill" data-builder>builder: —</div>
        <div class="st-resize-diag-pill" data-canvas>canvas: —</div>
        <div class="st-resize-diag-pill" data-flow>events: 0</div>
      </div>
      <div class="st-resize-diag-actions">
        <button type="button" data-action="copy">Копіювати звіт</button>
        <button type="button" data-action="clear">Очистити</button>
        <button type="button" data-action="hide">Сховати</button>
        <button type="button" data-kind="off" data-action="off">OFF</button>
      </div>
    </div>
  `;
  hud.addEventListener('click', (ev) => {
    const btn = ev.target && ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'copy') copyReport_();
    if (action === 'clear') { log.length = 0; latestLine = 'Очищено'; scheduleHudUpdate_(); }
    if (action === 'hide') hud.classList.add('is-hidden');
    if (action === 'off') {
      enabled = false;
      try { localStorage.setItem('ST_RESIZE_DIAG_ENABLED', '0'); } catch (_) {}
      hud.classList.add('is-hidden');
    }
  });
  document.body.appendChild(hud);
  return hud;
}

function scheduleHudUpdate_() {
  if (!enabled) return;
  clearTimeout(updateHudTimer);
  updateHudTimer = window.setTimeout(updateHud_, 60);
}

function updateHud_() {
  if (!enabled) return;
  const box = createHud_();
  if (!box) return;
  box.classList.remove('is-hidden');
  const m = latestMetrics_();
  const rects = m.rects || {};
  const c = m.counts || {};
  const set = (sel, text) => { const el = box.querySelector(sel); if (el) el.textContent = text; };
  set('[data-line]', latestLine || 'Очікування resize/maximize...');
  set('[data-win]', `window: ${m.inner?.w || 0}×${m.inner?.h || 0} · dpr ${m.dpr || 1}`);
  set('[data-builder]', `builder: ${rects.builder?.w || '—'}×${rects.builder?.h || '—'}`);
  set('[data-canvas]', `canvas: ${rects.canvas?.w || '—'}×${rects.canvas?.h || '—'}`);
  set('[data-flow]', `events: ${burstEvents || 0} · rows ${c.rows ?? '—'} · blocks ${c.blocks ?? '—'}`);
}

function makeReport_() {
  const lines = [];
  lines.push(`ST_RESIZE_DIAG_REPORT ${ST_RESIZE_DIAG_STAGE}`);
  lines.push(`time=${new Date().toISOString()}`);
  lines.push(`ua=${navigator.userAgent}`);
  lines.push(`entries=${log.length}`);
  lines.push('--- SUMMARY ---');
  const slow = log.filter((e) => /slow|longtask|reflow/.test(e.type));
  slow.slice(-25).forEach((e) => lines.push(`${e.seq}. ${e.type} ${JSON.stringify(e.detail || {})}`));
  lines.push('--- LAST EVENTS JSON ---');
  lines.push(JSON.stringify(log.slice(-120), null, 2));
  return lines.join('\n');
}

async function copyReport_() {
  const report = makeReport_();
  try {
    await navigator.clipboard.writeText(report);
    latestLine = 'Звіт скопійовано в буфер';
    scheduleHudUpdate_();
  } catch (_) {
    try {
      const ta = document.createElement('textarea');
      ta.value = report;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      latestLine = 'Звіт скопійовано в буфер';
      scheduleHudUpdate_();
    } catch (err) {
      console.info('[ST_RESIZE_DIAG_REPORT]', report);
      latestLine = 'Не вдалось скопіювати — звіт у console.info';
      scheduleHudUpdate_();
    }
  }
}

function measure_(name, fn, detail = {}) {
  const t0 = now_();
  try {
    return fn();
  } finally {
    const dt = now_() - t0;
    const type = dt > 32 ? `${name}-slow` : name;
    push_(type, { ...detail, durationMs: round_(dt) }, { sampleLayout: dt > 32 });
  }
}

function bind_() {
  try { enabled = localStorage.getItem('ST_RESIZE_DIAG_ENABLED') === '1'; } catch (_) { enabled = false; }
  if (!enabled) return;

  try { root.dataset.stResizeDiagStage = ST_RESIZE_DIAG_STAGE; } catch (_) {}
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { createHud_(); push_('diag-ready', {}, { sampleLayout: true }); }, { once: true });
  } else {
    createHud_();
    push_('diag-ready', {}, { sampleLayout: true });
  }

  window.addEventListener('resize', () => onResizeSignal_('window.resize'), { passive: true });
  window.addEventListener('orientationchange', () => onResizeSignal_('orientationchange'), { passive: true });
  window.addEventListener('focus', () => onResizeSignal_('focus'), { passive: true });
  try { window.visualViewport?.addEventListener?.('resize', () => onResizeSignal_('visualViewport.resize'), { passive: true }); } catch (_) {}

  try {
    if ('PerformanceObserver' in window) {
      const po = new PerformanceObserver((list) => {
        for (const item of list.getEntries()) {
          const d = Number(item.duration || 0);
          if (d < 180) continue;
          push_('longtask', { durationMs: round_(d), name: item.name || 'task' }, { sampleLayout: d > 500 });
        }
      });
      po.observe({ entryTypes: ['longtask'] });
    }
  } catch (_) {}
}

window.ST_RESIZE_DIAG_MARK = function ST_RESIZE_DIAG_MARK(type, detail = {}, opts = {}) {
  return push_(String(type || 'mark'), detail || {}, opts || {});
};
window.ST_RESIZE_DIAG_MEASURE = measure_;
window.ST_RESIZE_DIAG_REPORT = makeReport_;
window.ST_COPY_RESIZE_DIAG_REPORT = copyReport_;
window.ST_RESIZE_DIAG_ENABLE = function ST_RESIZE_DIAG_ENABLE(value) {
  enabled = value !== false;
  try { localStorage.setItem('ST_RESIZE_DIAG_ENABLED', enabled ? '1' : '0'); } catch (_) {}
  if (enabled) { createHud_(); push_('diag-enabled', {}, { sampleLayout: true }); }
  else { hud?.classList?.add('is-hidden'); }
  return enabled;
};
window.ST_RESIZE_DIAG_LOG = log;

bind_();

export {};
