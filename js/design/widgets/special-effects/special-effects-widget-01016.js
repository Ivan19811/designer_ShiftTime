// js/design/widgets/special-effects/special-effects-widget.js
import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
// 00158 + 00992 — Акордеон "Спецефекти".
// 00992 + 01004: editor Pause/Play is one runtime slideshow state. 01004 exposes a diagnostic-only pause API for COLOR PICKER PERFORMANCE PROBE.
// A widget card click always resolves the current LIVE slider host, switches its real background + bound content
// immediately, and keeps the manual pause state. Resume continues autoplay from the currently previewed slide.
// Перший стабільний ефект: фоновий слайдер для секції / контейнера / блока
// з індивідуальними посиланнями, навігацією, анімаціями та привʼязкою дочірніх блоків до слайдів.

const SEC_ID = 'st-special-effects-section';
const CSS_ID = 'st-special-effects-widget-css';
const RUNTIME_ATTR = 'data-st-fx-runtime';
const RESTORE_ATTR = 'data-st-fx-fill-restore';
const RESTORE_VERSION = 1;
const timers = new WeakMap();
const carouselTimers = new WeakMap();
const carouselWheelState = new WeakMap();
const carouselDesignSessions = new WeakMap();
const sliderResumeCleanups00990 = new WeakMap();
const sliderRuntimeControllers00992 = new WeakMap();
const sliderManualPauseByElement00992 = new WeakMap();
const sliderManualPauseByNode00992 = new Map();
let carouselDesignRestoring = false;
const EMPTY_HINTS_KEY = 'st_empty_section_hints_enabled_v1';
const FX_ANIMATIONS = ['instant','slide-right','slide-left','slide-up','slide-down','slide-up-right','slide-up-left','slide-down-right','slide-down-left','shift-right','shift-left','shift-up','shift-down','fade','zoom','zoom-out','blur'];
const FX_ANIM_CLASSES = FX_ANIMATIONS.map(name => `st-fx-anim-${name}`);
const SLIDE_BG_FITS = ['cover','contain','auto','custom'];
const SLIDE_BG_POSITIONS = ['center center','top center','bottom center','center left','center right','custom'];
const SLIDE_FILTER_MODES = ['off','color','gradient'];

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeJsonParse(raw, fallback = null) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; }
}

function sliderNodeKey00992(el) {
  if (!(el instanceof HTMLElement)) return '';
  return String(el.dataset?.sfId || el.dataset?.stNodeId || el.dataset?.nodeId || el.id || '').trim();
}

function setSliderManualPaused00992(el, paused) {
  if (!(el instanceof HTMLElement)) return false;
  const value = !!paused;
  sliderManualPauseByElement00992.set(el, value);
  const key = sliderNodeKey00992(el);
  if (key) sliderManualPauseByNode00992.set(key, value);
  return value;
}

function isSliderManualPaused00992(el) {
  if (!(el instanceof HTMLElement)) return false;
  const key = sliderNodeKey00992(el);
  if (key && sliderManualPauseByNode00992.has(key)) return sliderManualPauseByNode00992.get(key) === true;
  return sliderManualPauseByElement00992.get(el) === true;
}

function resolveLiveSiteElement00992(el) {
  if (!(el instanceof HTMLElement)) return null;
  if (el.isConnected) return el;
  const key = sliderNodeKey00992(el);
  if (!key) return el;
  const escaped = globalThis.CSS?.escape ? CSS.escape(key) : key.replace(/["\\]/g, '\\$&');
  try {
    return document.querySelector(`[data-sf-id="${escaped}"],[data-st-node-id="${escaped}"],[data-node-id="${escaped}"]`) || el;
  } catch (_) {
    return el;
  }
}

function clampNumber(value, min, max, fallback = min) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeHexColor(value, fallback = '#000000') {
  let h = String(value || '').trim();
  if (!h) return fallback;
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return fallback;
  return `#${h.toLowerCase()}`;
}

function hexToRgba(hex, alpha = 1) {
  const h = normalizeHexColor(hex, '#000000').slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, Number(alpha) || 0));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function readEmptyHintsEnabled() {
  try { return window.localStorage.getItem(EMPTY_HINTS_KEY) === '1'; } catch (_) { return false; }
}

function setEmptyHintsEnabled(enabled) {
  const on = !!enabled;
  try {
    if (on) window.localStorage.setItem(EMPTY_HINTS_KEY, '1');
    else window.localStorage.removeItem(EMPTY_HINTS_KEY);
  } catch (_) {}
  try { document.body?.classList.toggle('st-show-empty-section-hints', on); } catch (_) {}
}

function bootEmptyHintsState() {
  setEmptyHintsEnabled(readEmptyHintsEnabled());
}


function ensureCssOnce() {
  if (document.getElementById(CSS_ID)) return;
  const style = document.createElement('style');
  style.id = CSS_ID;
  style.textContent = `
    #${SEC_ID} .stfx-wrap{display:flex;flex-direction:column;gap:10px;color:#e5e7eb;}
    #${SEC_ID} .stfx-card{display:flex;flex-direction:column;gap:10px;padding:10px;border-radius:16px;background:linear-gradient(180deg,rgba(15,23,42,.74),rgba(2,6,23,.62));border:1px solid rgba(148,163,184,.18);box-shadow:0 12px 32px rgba(0,0,0,.14);}
    #${SEC_ID} .stfx-title{font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;color:#bae6fd;}
    #${SEC_ID} .stfx-note{font-size:11px;line-height:1.45;color:rgba(226,232,240,.74);padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(148,163,184,.12);}
    #${SEC_ID} .stfx-row{display:flex;align-items:center;gap:8px;min-width:0;}
    #${SEC_ID} .stfx-row--wrap{flex-wrap:wrap;}
    #${SEC_ID} .stfx-row label{font-size:12px;color:#e5e7eb;white-space:nowrap;}
    #${SEC_ID} .stfx-input,#${SEC_ID} .stfx-select{height:34px;min-width:0;border-radius:11px;border:1px solid rgba(148,163,184,.34);background:#ffffff;color:#0f172a;padding:0 9px;font-size:12px;font-weight:800;outline:none;}
    #${SEC_ID} .stfx-input:focus,#${SEC_ID} .stfx-select:focus{box-shadow:0 0 0 3px rgba(56,189,248,.22);border-color:rgba(56,189,248,.68);}
    #${SEC_ID} .stfx-input[type="number"]{width:84px;}
    #${SEC_ID} .stfx-input[type="range"]{padding:0;width:100%;accent-color:#22c55e;background:transparent;border:0;}
    #${SEC_ID} .stfx-select{flex:1;}
    #${SEC_ID} .stfx-btn{height:34px;border:0;border-radius:11px;padding:0 11px;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:white;font-size:12px;font-weight:950;cursor:pointer;box-shadow:0 10px 24px rgba(37,99,235,.18);white-space:nowrap;}
    #${SEC_ID} .stfx-btn:hover{filter:brightness(1.08);}
    #${SEC_ID} .stfx-btn--ghost{background:rgba(148,163,184,.15);border:1px solid rgba(148,163,184,.24);box-shadow:none;color:#e5e7eb;}
    #${SEC_ID} .stfx-btn--green{background:linear-gradient(135deg,#22c55e,#16a34a);color:#052e16;}
    #${SEC_ID} .stfx-btn--danger{background:linear-gradient(135deg,#ef4444,#b91c1c);}
    #${SEC_ID} .stfx-check{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(148,163,184,.14);font-size:12px;font-weight:850;color:#f8fafc;transition:background .18s ease,border-color .18s ease,box-shadow .18s ease,color .18s ease;}
    #${SEC_ID} .stfx-check input{accent-color:#22c55e;transform:scale(1.05);}
    #${SEC_ID} .stfx-check[data-enabled-row].is-dirty{background:linear-gradient(135deg,rgba(239,68,68,.35),rgba(127,29,29,.48));border-color:rgba(254,202,202,.82);box-shadow:0 0 0 3px rgba(239,68,68,.18),0 14px 34px rgba(127,29,29,.18);color:#fff;}
    #${SEC_ID} .stfx-check[data-enabled-row].is-dirty input{accent-color:#ef4444;}
    #${SEC_ID} .stfx-grid2{display:grid;grid-template-columns:1fr;gap:8px;}
    #${SEC_ID} .stfx-field{display:flex;flex-direction:column;gap:5px;min-width:0;}
    #${SEC_ID} .stfx-field label{font-size:11px;font-weight:950;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;}
    #${SEC_ID} .stfx-field .stfx-select{width:100%;flex:none;min-height:36px;line-height:1.25;white-space:normal;}
    #${SEC_ID} .stfx-slider-value{min-width:48px;text-align:right;font-size:12px;font-weight:950;color:#bbf7d0;}
    #${SEC_ID} .stfx-setting-row{display:grid;grid-template-columns:24px minmax(0,1fr) 32px 32px;gap:8px;align-items:center;padding:8px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(148,163,184,.12);}
    #${SEC_ID} .stfx-setting-main{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap;}
    #${SEC_ID} .stfx-setting-main label{font-size:11px;font-weight:950;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;}
    #${SEC_ID} .stfx-live-dot{width:15px;height:15px;border-radius:999px;appearance:none;-webkit-appearance:none;background:#0f172a;border:2px solid rgba(148,163,184,.72);box-shadow:inset 0 0 0 3px #020617;cursor:pointer;flex:0 0 auto;}
    #${SEC_ID} .stfx-live-dot:checked{background:#38bdf8;border-color:#bae6fd;box-shadow:inset 0 0 0 3px #082f49,0 0 0 3px rgba(56,189,248,.18);}
    #${SEC_ID} .stfx-radio{width:18px;height:18px;border-radius:999px;appearance:none;-webkit-appearance:none;background:#1e293b;border:2px solid rgba(148,163,184,.72);box-shadow:inset 0 0 0 3px rgba(15,23,42,.9);cursor:pointer;display:inline-block;flex:0 0 auto;}
    #${SEC_ID} .stfx-radio:checked{background:#22c55e;border-color:#bbf7d0;box-shadow:inset 0 0 0 4px #052e16,0 0 0 3px rgba(34,197,94,.18);}
    #${SEC_ID} .stfx-action-dot{width:30px;height:30px;border-radius:999px;border:1px solid rgba(148,163,184,.36);background:#64748b;color:#fff;font-size:14px;font-weight:950;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 18px rgba(0,0,0,.18);}
    #${SEC_ID} .stfx-action-dot[data-state=ok]{background:#22c55e;color:#052e16;border-color:#bbf7d0;}
    #${SEC_ID} .stfx-action-dot[data-state=dirty]{background:#ef4444;color:#fff;border-color:#fecaca;}
    #${SEC_ID} .stfx-action-dot[data-state=warn]{background:#f59e0b;color:#111827;border-color:#fde68a;}
    #${SEC_ID} .stfx-action-dot[data-state=idle]{background:#64748b;color:#fff;}
    #${SEC_ID} .stfx-select--wide{width:100%;min-height:36px;}
    #${SEC_ID} .stfx-slide-list{display:flex;flex-direction:column;gap:10px;}
    #${SEC_ID} .stfx-slide{display:grid;grid-template-columns:38px minmax(112px,1fr) 76px;grid-template-areas:"meta thumb actions" "extra extra extra";gap:8px;align-items:stretch;padding:9px;border-radius:16px;background:rgba(15,23,42,.44);border:1px solid rgba(148,163,184,.16);position:relative;min-height:108px;cursor:pointer;}
    #${SEC_ID} .stfx-slide.is-active{border-color:rgba(56,189,248,.78);box-shadow:0 0 0 3px rgba(56,189,248,.16),0 18px 44px rgba(14,165,233,.12);}
    #${SEC_ID} .stfx-slide.is-selected{border-color:rgba(34,197,94,.76);box-shadow:0 0 0 3px rgba(34,197,94,.16),0 18px 44px rgba(34,197,94,.10);}
    #${SEC_ID} .stfx-slide[data-slide-paused="1"]{opacity:.72;border-color:rgba(239,68,68,.42);background:rgba(69,10,10,.28);}
    #${SEC_ID} .stfx-slide.is-unapplied{background:linear-gradient(135deg,rgba(127,29,29,.62),rgba(15,23,42,.50));border-color:rgba(248,113,113,.78);box-shadow:0 0 0 3px rgba(239,68,68,.18),0 18px 46px rgba(127,29,29,.16);}
    #${SEC_ID} .stfx-slide.is-unapplied .stfx-slide-num{background:rgba(239,68,68,.22);border-color:rgba(254,202,202,.55);color:#fecaca;}
    #${SEC_ID} .stfx-slide.is-dragging{opacity:.42;filter:saturate(.65);}
    #${SEC_ID} .stfx-slide.is-drop-before::before,#${SEC_ID} .stfx-slide.is-drop-after::after{content:"";position:absolute;left:8px;right:8px;height:4px;border-radius:999px;background:linear-gradient(90deg,#22c55e,#38bdf8);box-shadow:0 0 0 4px rgba(34,197,94,.12),0 0 18px rgba(56,189,248,.55);}
    #${SEC_ID} .stfx-slide.is-drop-before::before{top:-6px;}
    #${SEC_ID} .stfx-slide.is-drop-after::after{bottom:-6px;}
    #${SEC_ID} .stfx-slide-meta{grid-area:meta;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:7px;}
    #${SEC_ID} .stfx-slide-grip{width:31px;height:40px;border-radius:12px;border:1px solid rgba(148,163,184,.24);background:rgba(255,255,255,.06);color:#c4b5fd;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:950;cursor:grab;user-select:none;}
    #${SEC_ID} .stfx-slide-grip:active{cursor:grabbing;background:rgba(139,92,246,.22);}
    #${SEC_ID} .stfx-slide-num{width:29px;height:29px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(56,189,248,.14);border:1px solid rgba(56,189,248,.25);color:#bae6fd;font-weight:950;font-size:12px;}
    #${SEC_ID} .stfx-slide-select{width:20px;height:20px;border-radius:999px;border:2px solid rgba(148,163,184,.72);background:#111827;box-shadow:inset 0 0 0 4px #020617;cursor:pointer;}
    #${SEC_ID} .stfx-slide-select[aria-pressed="true"]{background:#22c55e;border-color:#bbf7d0;box-shadow:inset 0 0 0 4px #052e16,0 0 0 3px rgba(34,197,94,.18);}
    #${SEC_ID} .stfx-slide-thumb{grid-area:thumb;width:100%;min-height:86px;border-radius:14px;background:rgba(15,23,42,.68);background-size:cover;background-position:center;border:1px solid rgba(148,163,184,.28);box-shadow:inset 0 0 0 1px rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center;color:rgba(226,232,240,.55);font-size:12px;font-weight:950;overflow:hidden;}
    #${SEC_ID} .stfx-slide-thumb.has-image{color:transparent;}
    #${SEC_ID} .stfx-slide-actions{grid-area:actions;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:36px;gap:6px;align-content:start;}
    #${SEC_ID} .stfx-slide-indicators{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:2px;padding-top:4px;border-top:1px solid rgba(148,163,184,.16);}
    #${SEC_ID} .stfx-slide-indicator{width:100%;height:24px;min-width:0;border-radius:999px;border:1px solid rgba(148,163,184,.34);background:rgba(15,23,42,.78);color:#e0f2fe;font-size:9px;font-weight:1000;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.035),0 4px 10px rgba(0,0,0,.16);}
    #${SEC_ID} .stfx-slide-indicator:hover{border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.16),0 8px 16px rgba(0,0,0,.2);}
    #${SEC_ID} .stfx-slide-indicator[data-indicator-kind=interval]{background:linear-gradient(135deg,rgba(14,165,233,.32),rgba(37,99,235,.22));}
    #${SEC_ID} .stfx-slide-indicator[data-indicator-kind=duration]{background:linear-gradient(135deg,rgba(34,197,94,.32),rgba(22,163,74,.20));color:#dcfce7;}
    #${SEC_ID} .stfx-slide-indicator[data-indicator-kind=animation]{background:linear-gradient(135deg,rgba(168,85,247,.34),rgba(79,70,229,.22));}
    #${SEC_ID} .stfx-slide-indicator[data-indicator-kind=overlay]{background:linear-gradient(135deg,rgba(15,23,42,.9),rgba(75,85,99,.42));color:#fef3c7;}
    #${SEC_ID} .stfx-slide-extra{grid-area:extra;display:none;margin-top:2px;padding:10px;border-radius:14px;background:rgba(2,6,23,.48);border:1px solid rgba(148,163,184,.14);}
    #${SEC_ID} .stfx-slide.is-extra-open .stfx-slide-extra{display:block;}
    #${SEC_ID} .stfx-slide-fields{display:flex;flex-direction:column;gap:7px;min-width:0;}
    #${SEC_ID} .stfx-slide-fields input{width:100%;height:36px;}
    #${SEC_ID} .stfx-slide-advanced{margin-top:9px;border-radius:14px;border:1px solid rgba(56,189,248,.18);background:rgba(15,23,42,.46);overflow:hidden;}
    #${SEC_ID} .stfx-slide-advanced>summary{list-style:none;cursor:pointer;padding:10px 12px;font-size:12px;font-weight:1000;color:#e0f2fe;display:flex;align-items:center;justify-content:space-between;gap:8px;background:linear-gradient(135deg,rgba(14,165,233,.18),rgba(37,99,235,.08));}
    #${SEC_ID} .stfx-slide-advanced>summary::-webkit-details-marker{display:none;}
    #${SEC_ID} .stfx-slide-advanced>summary::after{content:'▼';font-size:11px;color:#93c5fd;}
    #${SEC_ID} .stfx-slide-advanced[open]>summary::after{content:'▲';}
    #${SEC_ID} .stfx-slide-bg-panel{display:flex;flex-direction:column;gap:12px;padding:12px;}
    #${SEC_ID} .stfx-slide-bg-group{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(148,163,184,.13);}
    #${SEC_ID} .stfx-slide-bg-title{font-size:11px;font-weight:1000;color:#fde68a;text-transform:uppercase;letter-spacing:.055em;}
    #${SEC_ID} .stfx-slide-bg-title-row{display:flex;align-items:center;justify-content:space-between;gap:8px;}
    #${SEC_ID} .stfx-slide-bg-title-row .stfx-slide-bg-title{min-width:0;}
    #${SEC_ID} .stfx-bg-title-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto;}
    #${SEC_ID} .stfx-bg-star,#${SEC_ID} .stfx-bg-cancel{width:28px;height:28px;border-radius:999px;border:1px solid rgba(148,163,184,.38);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;font-weight:1000;box-shadow:0 8px 18px rgba(0,0,0,.18);transition:transform .14s ease,filter .14s ease,background .14s ease,border-color .14s ease;}
    #${SEC_ID} .stfx-bg-star:hover,#${SEC_ID} .stfx-bg-cancel:hover{transform:translateY(-1px);filter:brightness(1.08);}
    #${SEC_ID} .stfx-bg-star[data-live-state=default]{background:linear-gradient(135deg,#facc15,#f59e0b);border-color:#fde68a;color:#111827;}
    #${SEC_ID} .stfx-bg-star[data-live-state=on]{background:linear-gradient(135deg,#22c55e,#16a34a);border-color:#bbf7d0;color:#052e16;}
    #${SEC_ID} .stfx-bg-star[data-live-state=off]{background:linear-gradient(135deg,#64748b,#334155);border-color:rgba(203,213,225,.62);color:#e5e7eb;}
    #${SEC_ID} .stfx-bg-cancel{background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#fde68a;color:#111827;}
    #${SEC_ID} .stfx-bg-row{display:grid;grid-template-columns:92px minmax(0,1fr) 44px;gap:8px;align-items:center;}
    #${SEC_ID} .stfx-bg-row--select{grid-template-columns:92px minmax(0,1fr);}
    #${SEC_ID} .stfx-bg-row--color{grid-template-columns:92px 42px minmax(0,1fr);}
    #${SEC_ID} .stfx-bg-row label{font-size:11px;font-weight:900;color:#cbd5e1;}
    #${SEC_ID} .stfx-bg-row input[type=range]{width:100%;height:28px;accent-color:#38bdf8;}
    #${SEC_ID} .stfx-bg-row input[type=color]{width:42px;height:34px;border-radius:10px;border:1px solid rgba(148,163,184,.35);background:transparent;padding:2px;}
    #${SEC_ID} .stfx-bg-value{font-size:11px;font-weight:1000;color:#bbf7d0;text-align:right;}
    #${SEC_ID} .stfx-bg-sub{font-size:10px;line-height:1.35;color:rgba(203,213,225,.72);}
    #${SEC_ID} .stfx-btn--icon{width:100%;height:36px;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:16px;}
    #${SEC_ID} .stfx-btn--play{background:linear-gradient(135deg,#22c55e,#16a34a);color:#052e16;}
    #${SEC_ID} .stfx-btn--pause{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;}
    #${SEC_ID} .stfx-carousel-runtime-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:2px;}
    #${SEC_ID} .stfx-carousel-runtime-btn{min-width:44px;height:36px;border-radius:12px;padding:0 12px;display:inline-flex;align-items:center;justify-content:center;font-size:17px;font-weight:1000;}
    #${SEC_ID} .stfx-carousel-wheel-btn{height:36px;border-radius:12px;padding:0 12px;background:rgba(148,163,184,.15);border:1px solid rgba(148,163,184,.28);box-shadow:none;color:#e5e7eb;}
    #${SEC_ID} .stfx-carousel-wheel-btn.is-active{background:linear-gradient(135deg,#38bdf8,#2563eb);border-color:rgba(186,230,253,.82);box-shadow:0 0 0 3px rgba(56,189,248,.18);color:#eff6ff;}
    #${SEC_ID} .stfx-carousel-wheel-btn.is-waiting{background:linear-gradient(135deg,#f59e0b,#d97706);border-color:#fde68a;color:#111827;}
    #${SEC_ID} .stfx-btn--extra.is-open{background:linear-gradient(135deg,#f59e0b,#d97706);color:#111827;}
    #${SEC_ID} .stfx-mini{font-size:10px;color:rgba(203,213,225,.7);line-height:1.35;}
    #${SEC_ID} .stfx-status{min-height:18px;font-size:12px;font-weight:850;color:#a7f3d0;}
    #${SEC_ID} .stfx-btn--apply.is-dirty{background:linear-gradient(135deg,#ef4444,#991b1b)!important;color:#fff!important;box-shadow:0 0 0 3px rgba(239,68,68,.20),0 14px 34px rgba(127,29,29,.24);}
    #${SEC_ID} .stfx-btn--apply.is-clean{background:linear-gradient(135deg,#22c55e,#16a34a)!important;color:#052e16!important;}
    #${SEC_ID} .stfx-btn--design-save.is-dirty{background:linear-gradient(135deg,#ef4444,#991b1b)!important;color:#fff!important;box-shadow:0 0 0 3px rgba(239,68,68,.20),0 14px 34px rgba(127,29,29,.22);}
    #${SEC_ID} .stfx-btn--design-save.is-clean{background:linear-gradient(135deg,#22c55e,#16a34a)!important;color:#052e16!important;}
    #${SEC_ID} .stfx-design-actions{display:grid;grid-template-columns:minmax(0,1fr) 38px 38px;gap:7px;align-items:center;}
    #${SEC_ID} .stfx-design-actions .stfx-btn{height:38px;}
    #${SEC_ID} .stfx-design-icon{width:38px!important;padding:0!important;display:inline-flex!important;align-items:center;justify-content:center;font-size:17px;font-weight:1000;}
    #${SEC_ID} .stfx-design-icon[disabled]{opacity:.45;cursor:not-allowed;filter:grayscale(.45);}
    #${SEC_ID} .stfx-design-star[data-preview-state=off]{background:linear-gradient(135deg,#64748b,#334155)!important;color:#e5e7eb!important;border-color:rgba(203,213,225,.52)!important;}
    #${SEC_ID} .stfx-design-star[data-preview-state=on]{background:linear-gradient(135deg,#facc15,#f59e0b)!important;color:#111827!important;border-color:#fde68a!important;}
    #${SEC_ID} .stfx-carousel-tree{display:flex;flex-direction:column;gap:4px;margin-top:10px;padding:9px;border-radius:14px;background:rgba(2,6,23,.44);border:1px solid rgba(148,163,184,.14);}
    #${SEC_ID} .stfx-carousel-tree-empty{font-size:11px;color:rgba(203,213,225,.72);line-height:1.35;}
    #${SEC_ID} .stfx-carousel-tree-row{display:grid!important;grid-template-columns:minmax(0,1fr) 30px 30px;gap:6px;align-items:center;padding:5px 6px;border-radius:10px;background:rgba(255,255,255,.035);border:1px solid rgba(148,163,184,.08);}
    #${SEC_ID} .stfx-carousel-tree-row:hover{border-color:rgba(56,189,248,.45);background:rgba(14,165,233,.10);}
    #${SEC_ID} .stfx-carousel-tree-row.is-tree-paused{display:grid!important;background:rgba(127,29,29,.24);border-color:rgba(248,113,113,.42);}
    #${SEC_ID} .stfx-carousel-tree-row.is-tree-paused:hover{display:grid!important;background:rgba(153,27,27,.30);border-color:rgba(248,113,113,.66);}
    #${SEC_ID} .stfx-carousel-tree-name{min-width:0;border:0;background:transparent;color:#e2e8f0;text-align:left;font-size:11px;font-weight:900;line-height:1.25;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    #${SEC_ID} .stfx-carousel-tree-name.is-tree-paused{display:block!important;color:#fca5a5;opacity:1;text-decoration:none;}
    #${SEC_ID} .stfx-carousel-tree-small{width:28px!important;height:28px!important;padding:0!important;border-radius:9px;font-size:14px;font-weight:1000;display:inline-flex!important;align-items:center;justify-content:center;line-height:1;}
    #${SEC_ID} .stfx-carousel-tree-action--hide{background:linear-gradient(135deg,#22c55e,#16a34a)!important;color:#052e16!important;border-color:rgba(187,247,208,.92)!important;}
    #${SEC_ID} .stfx-carousel-tree-action--show{background:linear-gradient(135deg,#ef4444,#991b1b)!important;color:#fff!important;border-color:rgba(248,113,113,.82)!important;}
    #${SEC_ID} .stfx-carousel-tree-action--delete{background:linear-gradient(135deg,#ef4444,#7f1d1d)!important;color:#fff!important;border-color:rgba(248,113,113,.82)!important;}
    #${SEC_ID} .stfx-disabled{opacity:.52;pointer-events:none;filter:grayscale(.28);}
    [data-st-fx-bg-slider]:not([data-st-fx-active-slide]) [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="1"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="1"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="1"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="2"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="2"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="3"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="3"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="4"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="4"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="5"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="5"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="6"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="6"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="7"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="7"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="8"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="8"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="9"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="9"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="10"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="10"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="11"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="11"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="12"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="12"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="13"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="13"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="14"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="14"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="15"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="15"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="16"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="16"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="17"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="17"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="18"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="18"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="19"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="19"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="20"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="20"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="21"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="21"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="22"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="22"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="23"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="23"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="24"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="24"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="25"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="25"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="26"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="26"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="27"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="27"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="28"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="28"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="29"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="29"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="30"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="30"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="31"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="31"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="32"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="32"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="33"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="33"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="34"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="34"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="35"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="35"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="36"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="36"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="37"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="37"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="38"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="38"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="39"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="39"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="40"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="40"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="41"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="41"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="42"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="42"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="43"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="43"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="44"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="44"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="45"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="45"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="46"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="46"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="47"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="47"]){display:none!important;}
    [data-st-fx-bg-slider][data-st-fx-active-slide="48"] [data-st-fx-bind-slide]:not([data-st-fx-bind-slide="48"]){display:none!important;}

    #${SEC_ID} .stfx-inner-accordion{border-radius:18px;border:1px solid rgba(148,163,184,.20);background:rgba(2,6,23,.34);overflow:hidden;box-shadow:0 12px 34px rgba(0,0,0,.16);}
    #${SEC_ID} .stfx-inner-accordion + .stfx-inner-accordion{margin-top:10px;}
    #${SEC_ID} .stfx-inner-accordion > summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px;background:linear-gradient(135deg,rgba(14,165,233,.26),rgba(37,99,235,.18));border-bottom:1px solid rgba(148,163,184,.16);font-size:13px;font-weight:1000;letter-spacing:.04em;text-transform:uppercase;color:#f8fafc;}
    #${SEC_ID} .stfx-inner-accordion > summary::-webkit-details-marker{display:none;}
    #${SEC_ID} .stfx-inner-accordion > summary::after{content:'▶';font-size:11px;color:#bae6fd;transition:transform .16s ease;}
    #${SEC_ID} .stfx-inner-accordion[open] > summary::after{transform:rotate(90deg);}
    #${SEC_ID} .stfx-accordion-body{display:flex;flex-direction:column;gap:10px;padding:10px;}
    #${SEC_ID} .stfx-carousel-state{font-size:11px;font-weight:900;color:#bfdbfe;padding:8px 10px;border-radius:12px;background:rgba(59,130,246,.10);border:1px solid rgba(96,165,250,.18);}
    #${SEC_ID} .stfx-carousel-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
    #${SEC_ID} .stfx-carousel-row .stfx-field{min-width:0;}
    #${SEC_ID} .stfx-carousel-row .stfx-input,#${SEC_ID} .stfx-carousel-row .stfx-select{width:100%;}
    #${SEC_ID} .stfx-carousel-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    #${SEC_ID} .stfx-carousel-actions .stfx-btn{width:100%;}
    #${SEC_ID} .stfx-size-grid{display:grid;grid-template-columns:1fr;gap:9px;}
    #${SEC_ID} .stfx-size-slider-row{display:grid;grid-template-columns:92px minmax(0,1fr) 68px;gap:9px;align-items:center;padding:8px 9px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(148,163,184,.12);}
    #${SEC_ID} .stfx-size-slider-row label{font-size:11px;font-weight:950;color:#cbd5e1;text-transform:uppercase;letter-spacing:.04em;}
    #${SEC_ID} .stfx-size-slider-row input[type=range]{width:100%;accent-color:#22c55e;}
    #${SEC_ID} .stfx-size-slider-row.is-disabled{opacity:.50;filter:grayscale(.35);}
    #${SEC_ID} .stfx-size-value{font-size:12px;font-weight:1000;color:#bbf7d0;text-align:right;white-space:nowrap;}
    #${SEC_ID} .stfx-carousel-item-list{display:flex;flex-direction:column;gap:10px;margin-top:4px;}
    #${SEC_ID} .stfx-carousel-item-note{font-size:12px;font-weight:850;color:#bfdbfe;padding:10px;border-radius:14px;background:rgba(59,130,246,.08);border:1px solid rgba(96,165,250,.16);line-height:1.45;}
    #${SEC_ID} .stfx-carousel-item{cursor:pointer;}
    #${SEC_ID} .stfx-carousel-item.is-paused{opacity:.72;border-color:rgba(239,68,68,.45);background:rgba(69,10,10,.26);}
    #${SEC_ID} .stfx-carousel-item.is-unapplied{background:linear-gradient(135deg,rgba(127,29,29,.62),rgba(15,23,42,.50));border-color:rgba(248,113,113,.78);box-shadow:0 0 0 3px rgba(239,68,68,.18),0 18px 46px rgba(127,29,29,.16);}
    #${SEC_ID} .stfx-carousel-item.is-unapplied .stfx-carousel-item-thumb{border-color:rgba(248,113,113,.92);box-shadow:inset 0 0 0 999px rgba(127,29,29,.16),0 0 0 3px rgba(239,68,68,.14);}
    #${SEC_ID} .stfx-carousel-item-thumb{position:relative;}
    #${SEC_ID} .stfx-carousel-item-thumb.has-image{color:transparent;}
    #${SEC_ID} .stfx-carousel-item-thumb__label{position:absolute;left:8px;right:8px;bottom:8px;padding:5px 7px;border-radius:10px;background:rgba(15,23,42,.68);color:#e0f2fe;font-size:10px;font-weight:950;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(8px);}
    #${SEC_ID} .stfx-carousel-item-extra{grid-area:extra;display:none;margin-top:2px;padding:10px;border-radius:14px;background:rgba(2,6,23,.48);border:1px solid rgba(148,163,184,.14);}
    #${SEC_ID} .stfx-carousel-item.is-extra-open .stfx-carousel-item-extra{display:block;}
    #${SEC_ID} .stfx-carousel-item.is-dragging{opacity:.42;filter:saturate(.65);}
    #${SEC_ID} .stfx-carousel-item.is-drop-before::before,#${SEC_ID} .stfx-carousel-item.is-drop-after::after{content:"";position:absolute;left:8px;right:8px;height:4px;border-radius:999px;background:linear-gradient(90deg,#facc15,#22c55e,#38bdf8);box-shadow:0 0 0 4px rgba(34,197,94,.12),0 0 18px rgba(56,189,248,.55);}
    #${SEC_ID} .stfx-carousel-item.is-drop-before::before{top:-6px;}
    #${SEC_ID} .stfx-carousel-item.is-drop-after::after{bottom:-6px;}
    .site-root .st-block-carousel,#st-site-header-slot .st-block-carousel,#st-site-footer-slot .st-block-carousel{position:relative;overflow:hidden;isolation:isolate;--st-carousel-visible:var(--st-carousel-visible-desktop,4);--st-carousel-duration:.8s;}
    .site-root .st-block-carousel-shell,#st-site-header-slot .st-block-carousel-shell,#st-site-footer-slot .st-block-carousel-shell{width:100%;min-height:220px;border-radius:24px;background:rgba(15,23,42,.04);border:1px solid rgba(148,163,184,.18);padding:14px;box-sizing:border-box;}
    .site-root [data-st-carousel-hidden-by-shell="1"],#st-site-header-slot [data-st-carousel-hidden-by-shell="1"],#st-site-footer-slot [data-st-carousel-hidden-by-shell="1"]{display:none!important;}
    .site-root .st-block-carousel-track,#st-site-header-slot .st-block-carousel-track,#st-site-footer-slot .st-block-carousel-track{display:flex!important;flex-wrap:nowrap!important;transition:transform var(--st-carousel-duration,.8s) ease;will-change:transform;}
    .site-root .st-block-carousel[data-axis="vertical"] .st-block-carousel-track,#st-site-header-slot .st-block-carousel[data-axis="vertical"] .st-block-carousel-track,#st-site-footer-slot .st-block-carousel[data-axis="vertical"] .st-block-carousel-track{flex-direction:column!important;}
    .site-root .st-block-carousel-track > .st-block,#st-site-header-slot .st-block-carousel-track > .st-block,#st-site-footer-slot .st-block-carousel-track > .st-block{flex:0 0 calc(100% / var(--st-carousel-visible,4))!important;min-width:calc(100% / var(--st-carousel-visible,4));max-width:calc(100% / var(--st-carousel-visible,4));}
    .site-root .st-block-carousel-track > .st-block[data-st-carousel-item-pending="1"],#st-site-header-slot .st-block-carousel-track > .st-block[data-st-carousel-item-pending="1"],#st-site-footer-slot .st-block-carousel-track > .st-block[data-st-carousel-item-pending="1"]{outline:3px solid rgba(239,68,68,.88)!important;outline-offset:-3px;box-shadow:0 0 0 4px rgba(239,68,68,.18),0 18px 44px rgba(127,29,29,.18)!important;}
    .site-root .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"],#st-site-header-slot .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"],#st-site-footer-slot .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"]{position:relative;isolation:isolate;background-image:none!important;overflow:hidden;}
    .site-root .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"]::before,#st-site-header-slot .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"]::before,#st-site-footer-slot .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"]::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;border-radius:inherit;background-image:var(--st-carousel-item-bg-image,none);background-size:var(--st-carousel-item-bg-size,cover);background-position:var(--st-carousel-item-bg-position,center center);background-repeat:no-repeat;opacity:var(--st-carousel-item-bg-opacity,1);filter:var(--st-carousel-item-bg-filter,none);transform:translateZ(0);}
    .site-root .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"] > :not(.st-insert-line):not(.st-sec-insert-line):not(.st-dnd-placeholder),#st-site-header-slot .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"] > :not(.st-insert-line):not(.st-sec-insert-line):not(.st-dnd-placeholder),#st-site-footer-slot .st-block-carousel-track > .st-block[data-st-carousel-item-bg-layer="1"] > :not(.st-insert-line):not(.st-sec-insert-line):not(.st-dnd-placeholder){position:relative;z-index:1;}
    .site-root .st-block-carousel[data-st-carousel-design-editing="1"],#st-site-header-slot .st-block-carousel[data-st-carousel-design-editing="1"],#st-site-footer-slot .st-block-carousel[data-st-carousel-design-editing="1"]{outline:3px dashed rgba(250,204,21,.92)!important;outline-offset:5px;overflow:visible!important;}
    .site-root .st-block-carousel-track > .st-block[data-st-carousel-design-active="1"],#st-site-header-slot .st-block-carousel-track > .st-block[data-st-carousel-design-active="1"],#st-site-footer-slot .st-block-carousel-track > .st-block[data-st-carousel-design-active="1"]{outline:4px solid rgba(34,197,94,.96)!important;outline-offset:4px;box-shadow:0 0 0 7px rgba(34,197,94,.18),0 22px 58px rgba(22,163,74,.22)!important;z-index:20;position:relative;overflow:visible!important;}
    .site-root [data-st-carousel-tree-hidden="1"],#st-site-header-slot [data-st-carousel-tree-hidden="1"],#st-site-footer-slot [data-st-carousel-tree-hidden="1"]{display:none!important;}
    .site-root .st-block-carousel[data-st-carousel-size-mode="fixed"] .st-block-carousel-track > .st-block,#st-site-header-slot .st-block-carousel[data-st-carousel-size-mode="fixed"] .st-block-carousel-track > .st-block,#st-site-footer-slot .st-block-carousel[data-st-carousel-size-mode="fixed"] .st-block-carousel-track > .st-block{flex:0 0 var(--st-carousel-item-width,320px)!important;min-width:var(--st-carousel-item-width,320px)!important;max-width:var(--st-carousel-item-width,320px)!important;width:var(--st-carousel-item-width,320px)!important;min-height:var(--st-carousel-item-height,220px)!important;height:var(--st-carousel-item-height,220px)!important;box-sizing:border-box;overflow:hidden;}
    .site-root .st-block-carousel[data-axis="vertical"] .st-block-carousel-track > .st-block,#st-site-header-slot .st-block-carousel[data-axis="vertical"] .st-block-carousel-track > .st-block,#st-site-footer-slot .st-block-carousel[data-axis="vertical"] .st-block-carousel-track > .st-block{min-width:0!important;max-width:none!important;min-height:calc(100% / var(--st-carousel-visible,4));}
    .site-root .st-block-carousel[data-axis="vertical"][data-st-carousel-size-mode="fixed"] .st-block-carousel-track > .st-block,#st-site-header-slot .st-block-carousel[data-axis="vertical"][data-st-carousel-size-mode="fixed"] .st-block-carousel-track > .st-block,#st-site-footer-slot .st-block-carousel[data-axis="vertical"][data-st-carousel-size-mode="fixed"] .st-block-carousel-track > .st-block{flex:0 0 var(--st-carousel-item-height,220px)!important;min-height:var(--st-carousel-item-height,220px)!important;height:var(--st-carousel-item-height,220px)!important;min-width:min(100%,var(--st-carousel-item-width,320px))!important;max-width:min(100%,var(--st-carousel-item-width,320px))!important;width:min(100%,var(--st-carousel-item-width,320px))!important;}
    @media (max-width:991px){.site-root .st-block-carousel,#st-site-header-slot .st-block-carousel,#st-site-footer-slot .st-block-carousel{--st-carousel-visible:var(--st-carousel-visible-tablet,2);}}
    @media (max-width:640px){.site-root .st-block-carousel,#st-site-header-slot .st-block-carousel,#st-site-footer-slot .st-block-carousel{--st-carousel-visible:var(--st-carousel-visible-mobile,1);}}
    .st-carousel-nav{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:10;display:flex;gap:7px;align-items:center;justify-content:center;padding:7px 9px;border-radius:999px;background:rgba(15,23,42,.55);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.16);}
    .st-carousel-dot{width:9px;height:9px;border-radius:999px;border:0;background:rgba(255,255,255,.45);cursor:pointer;padding:0;}
    .st-carousel-dot.is-active{background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.18);}
    .st-carousel-arrow{position:absolute;top:50%;z-index:11;transform:translateY(-50%);width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(15,23,42,.62);color:#fff;font-size:22px;font-weight:1000;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);}
    .st-carousel-arrow:hover{background:rgba(37,99,235,.78);}
    .st-carousel-arrow--prev{left:12px;}.st-carousel-arrow--next{right:12px;}
    .st-carousel-nav[data-mode*="hover"],.st-carousel-arrow[data-mode*="hover"]{opacity:0;transition:opacity .16s ease;}
    .st-block-carousel:hover > .st-carousel-nav[data-mode*="hover"],.st-block-carousel:hover > .st-carousel-arrow[data-mode*="hover"]{opacity:1;}

    .stfx-tooltip{position:fixed;z-index:2147482500;max-width:min(440px,calc(100vw - 28px));padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,#020617,#111827);color:#f8fafc;border:2px solid rgba(56,189,248,.42);box-shadow:0 28px 90px rgba(0,0,0,.42),0 0 0 4px rgba(56,189,248,.12);font-size:15px;line-height:1.45;font-weight:800;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .16s ease,transform .16s ease;}
    .stfx-tooltip.is-visible{opacity:1;transform:translateY(0);}
    .stfx-tooltip b{display:block;margin-bottom:7px;color:#fde68a;font-size:18px;letter-spacing:.02em;}
    .stfx-tooltip__circle{width:76px;height:76px;border-radius:999px;margin:8px auto 12px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 25%,#f8fafc,#38bdf8 52%,#1d4ed8);color:#020617;border:3px solid rgba(255,255,255,.9);box-shadow:0 0 0 5px rgba(56,189,248,.18),0 16px 40px rgba(0,0,0,.35);font-size:24px;font-weight:1000;}
    .stfx-notice{position:fixed;z-index:2147482600;left:50%;top:22px;transform:translateX(-50%);max-width:min(760px,calc(100vw - 32px));padding:18px 22px;border-radius:20px;background:linear-gradient(135deg,#7f1d1d,#111827);color:#fff;border:3px solid #fecaca;box-shadow:0 24px 80px rgba(0,0,0,.48);font-size:20px;font-weight:1000;letter-spacing:.02em;text-align:center;}

    .site-root .st-fx-slider,#st-site-header-slot .st-fx-slider,#st-site-footer-slot .st-fx-slider{position:relative;isolation:isolate;background-size:cover;background-position:center;background-repeat:no-repeat;}
    .site-root .st-fx-bg-stage,#st-site-header-slot .st-fx-bg-stage,#st-site-footer-slot .st-fx-bg-stage{position:absolute;inset:0;z-index:0;border-radius:inherit;overflow:hidden;pointer-events:none;}
    .site-root .st-fx-fill-underlay,#st-site-header-slot .st-fx-fill-underlay,#st-site-footer-slot .st-fx-fill-underlay{position:absolute;inset:0;z-index:0;border-radius:inherit;background-repeat:no-repeat;background-size:cover;background-position:center;pointer-events:none;}
    .site-root .st-fx-bg-layer,#st-site-header-slot .st-fx-bg-layer,#st-site-footer-slot .st-fx-bg-layer{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;opacity:1;transform:translate3d(0,0,0) scale(1);filter:none;transition:opacity var(--st-fx-duration,.72s) ease,transform var(--st-fx-duration,.72s) ease,filter var(--st-fx-duration,.72s) ease;}
    .site-root .st-fx-bg-overlay,#st-site-header-slot .st-fx-bg-overlay,#st-site-footer-slot .st-fx-bg-overlay{position:absolute;inset:0;z-index:4;background:rgba(0,0,0,var(--st-fx-overlay,.0));pointer-events:none;}
    .site-root .st-fx-slider > :not(.st-fx-bg-stage):not(.st-fx-nav):not(.st-fx-arrow),#st-site-header-slot .st-fx-slider > :not(.st-fx-bg-stage):not(.st-fx-nav):not(.st-fx-arrow),#st-site-footer-slot .st-fx-slider > :not(.st-fx-bg-stage):not(.st-fx-nav):not(.st-fx-arrow){position:relative;z-index:1;}
    .st-fx-anim-instant .st-fx-bg-layer{transition:none!important;}
    .st-fx-anim-fade .st-fx-bg-layer.is-enter{opacity:.001;}
    .st-fx-anim-slide-left .st-fx-bg-layer.is-enter{transform:translateX(18px);opacity:.01;}
    .st-fx-anim-slide-right .st-fx-bg-layer.is-enter{transform:translateX(-18px);opacity:.01;}
    .st-fx-anim-slide-up .st-fx-bg-layer.is-enter{transform:translateY(18px);opacity:.01;}
    .st-fx-anim-slide-down .st-fx-bg-layer.is-enter{transform:translateY(-18px);opacity:.01;}
    .st-fx-anim-slide-up-right .st-fx-bg-layer.is-enter{transform:translate(-18px,18px);opacity:.01;}
    .st-fx-anim-slide-up-left .st-fx-bg-layer.is-enter{transform:translate(18px,18px);opacity:.01;}
    .st-fx-anim-slide-down-right .st-fx-bg-layer.is-enter{transform:translate(-18px,-18px);opacity:.01;}
    .st-fx-anim-slide-down-left .st-fx-bg-layer.is-enter{transform:translate(18px,-18px);opacity:.01;}
    .st-fx-anim-shift-right .st-fx-bg-layer.is-enter{transform:translateX(-100%);opacity:1;}
    .st-fx-anim-shift-left .st-fx-bg-layer.is-enter{transform:translateX(100%);opacity:1;}
    .st-fx-anim-shift-up .st-fx-bg-layer.is-enter{transform:translateY(100%);opacity:1;}
    .st-fx-anim-shift-down .st-fx-bg-layer.is-enter{transform:translateY(-100%);opacity:1;}
    .st-fx-anim-zoom .st-fx-bg-layer.is-enter{transform:scale(.92);opacity:.01;}
    .st-fx-anim-zoom-out .st-fx-bg-layer.is-enter{transform:scale(1.12);opacity:.01;}
    .st-fx-anim-blur .st-fx-bg-layer.is-enter{filter:blur(10px);opacity:.01;}
    .st-fx-nav{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;display:flex;gap:7px;align-items:center;justify-content:center;padding:7px 9px;border-radius:999px;background:rgba(15,23,42,.52);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.16);}
    .st-fx-nav[data-mode*="hover"],.st-fx-arrow[data-mode*="hover"]{opacity:0;transition:opacity .16s ease;}
    .st-fx-slider:hover > .st-fx-nav[data-mode*="hover"],.st-fx-slider:hover > .st-fx-arrow[data-mode*="hover"]{opacity:1;}
    .st-fx-dot{width:9px;height:9px;border-radius:999px;border:0;background:rgba(255,255,255,.46);cursor:pointer;padding:0;}
    .st-fx-dot.is-active{background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.18);}
    .st-fx-arrow{position:absolute;top:50%;z-index:6;transform:translateY(-50%);width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(15,23,42,.58);color:white;font-size:22px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(12px);}
    .st-fx-arrow:hover{background:rgba(37,99,235,.76);}
    .st-fx-arrow--prev{left:14px;}.st-fx-arrow--next{right:14px;}
  `;
  document.head.appendChild(style);
}

function normalizeSlide(slide = {}) {
  const interval = Math.max(1000, Math.min(60000, Number(slide.interval) || 0));
  const duration = Math.max(1000, Math.min(20000, Number(slide.duration) || 0));
  const animation = FX_ANIMATIONS.includes(String(slide.animation || '')) ? String(slide.animation) : '';
  const hasOverlay = slide.overlay !== undefined && slide.overlay !== null && String(slide.overlay) !== '';
  const overlay = hasOverlay ? Math.max(0, Math.min(90, Number(slide.overlay) || 0)) : null;
  const bg = normalizeSlideBg(slide.bg || slide);
  const out = {
    src: String(slide.src || '').trim(),
    link: String(slide.link || '').trim(),
    alt: String(slide.alt || '').trim(),
    // 00992: pause/play is a runtime state of the whole slider, never a per-slide persisted flag.
    paused: false,
    bg,
  };
  if (interval) out.interval = interval;
  if (duration) out.duration = duration;
  if (animation) out.animation = animation;
  if (hasOverlay) out.overlay = overlay;
  return out;
}

function defaultSlideBg() {
  return {
    fit: 'cover',
    scale: 100,
    scaleX: 100,
    scaleY: 100,
    position: 'center center',
    posX: 50,
    posY: 50,
    opacity: 100,
    gray: 0,
    filterMode: 'off',
    filterColor: '#000000',
    filterGrad1: '#000000',
    filterGrad2: '#000000',
    filterGrad3: '#000000',
    filterAngle: 90,
    filterOpacity: 0,
  };
}

function normalizeSlideBg(raw = {}) {
  const d = defaultSlideBg();
  const fit = String(raw.fit || raw.imageSize || d.fit);
  const position = String(raw.position || raw.imagePosition || d.position);
  const filterMode = String(raw.filterMode || d.filterMode);
  return {
    fit: SLIDE_BG_FITS.includes(fit) ? fit : d.fit,
    scale: clampNumber(raw.scale ?? raw.imageScale, 0, 200, d.scale),
    scaleX: clampNumber(raw.scaleX ?? raw.imageScaleX, 0, 200, d.scaleX),
    scaleY: clampNumber(raw.scaleY ?? raw.imageScaleY, 0, 200, d.scaleY),
    position: SLIDE_BG_POSITIONS.includes(position) ? position : d.position,
    posX: clampNumber(raw.posX ?? raw.imagePosX, 1, 100, d.posX),
    posY: clampNumber(raw.posY ?? raw.imagePosY, 1, 100, d.posY),
    opacity: clampNumber(raw.opacity ?? raw.overallOpacity ?? raw.totalOpacity ?? raw.globalOpacity, 0, 100, d.opacity),
    gray: clampNumber(raw.gray, 0, 100, d.gray),
    filterMode: SLIDE_FILTER_MODES.includes(filterMode) ? filterMode : d.filterMode,
    filterColor: normalizeHexColor(raw.filterColor || raw.filterColorRaw, d.filterColor),
    filterGrad1: normalizeHexColor(raw.filterGrad1 || raw.filterG1Raw, d.filterGrad1),
    filterGrad2: normalizeHexColor(raw.filterGrad2 || raw.filterG2Raw, d.filterGrad2),
    filterGrad3: normalizeHexColor(raw.filterGrad3 || raw.filterG3Raw, d.filterGrad3),
    filterAngle: clampNumber(raw.filterAngle, 0, 360, d.filterAngle),
    filterOpacity: clampNumber(raw.filterOpacity, 0, 100, d.filterOpacity),
  };
}

function defaultFxConfig() {
  return {
    enabled: false,
    interval: 4000,
    duration: 5000,
    animation: 'fade',
    globalInterval: true,
    globalDuration: true,
    globalAnimation: true,
    globalOverlay: true,
    overlayPreview: false,
    nav: 'dots-hover',
    pauseOnHover: true,
    loop: true,
    random: false,
    overlay: 0,
    slides: [],
    current: 0,
  };
}

const SHIFTTIME02_DEFAULT_SLIDES_01012 = Object.freeze([
  { src:'assets/collections/shifttime-marketplace-02/banner-slider/banner-01-skovoridky.webp', alt:'Сковорідки ShiftTime', bg:{ fit:'cover', position:'center center' } },
  { src:'assets/collections/shifttime-marketplace-02/banner-slider/banner-02-kazany.webp', alt:'Казани ShiftTime', bg:{ fit:'cover', position:'center center' } },
  { src:'assets/collections/shifttime-marketplace-02/banner-slider/banner-03-mangaly.webp', alt:'Мангали ShiftTime', bg:{ fit:'cover', position:'center center' } },
  { src:'assets/collections/shifttime-marketplace-02/banner-slider/banner-04-shampury.webp', alt:'Шампура ShiftTime', bg:{ fit:'cover', position:'center center' } },
  { src:'assets/collections/shifttime-marketplace-02/banner-slider/banner-05-nalyvatory.webp', alt:'Наливатори ShiftTime', bg:{ fit:'cover', position:'center center' } },
  { src:'assets/collections/shifttime-marketplace-02/banner-slider/banner-06-aksesuary.webp', alt:'Аксесуари ShiftTime', bg:{ fit:'cover', position:'center center' } },
]);

function getAuthoredDefaultSlidesForSlider(el) {
  const rawAttr = String(el?.getAttribute?.('data-st-fx-default-slides') || '').trim();
  if (rawAttr) {
    const parsed = safeJsonParse(rawAttr, []);
    if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeSlide).filter(slide => slide.src);
  }
  const hostSection = el?.closest?.('[data-template-id="shifttime-marketplace-02-main"]');
  const isShiftTimeHero = hostSection && el?.classList?.contains('shifttime02-hero');
  return isShiftTimeHero ? SHIFTTIME02_DEFAULT_SLIDES_01012.map(normalizeSlide) : [];
}

function backfillMissingSlidesFromAuthoredDefaults(el, cfgRaw) {
  const defaults = getAuthoredDefaultSlidesForSlider(el);
  if (!defaults.length) return cfgRaw;
  const rawSlides = Array.isArray(cfgRaw?.slides) ? cfgRaw.slides.map(normalizeSlide).filter(slide => slide.src) : [];
  const rawBySrc = new Map(rawSlides.filter(slide => slide.src).map(slide => [slide.src, slide]));
  const merged = defaults.map(def => rawBySrc.get(def.src) || def);
  const extras = rawSlides.filter(slide => slide.src && !defaults.some(def => def.src === slide.src));
  return { ...(cfgRaw || {}), slides: extras.length ? [...merged, ...extras] : merged };
}

function readConfig(el) {
  const cfg = backfillMissingSlidesFromAuthoredDefaults(el, Object.assign(defaultFxConfig(), safeJsonParse(el?.getAttribute?.('data-st-fx-bg-slider'), {}) || {}));
  cfg.slides = Array.isArray(cfg.slides) ? cfg.slides.map(normalizeSlide).filter(s => s.src) : [];
  cfg.globalInterval = cfg.globalInterval !== false;
  cfg.globalDuration = cfg.globalDuration !== false;
  cfg.globalAnimation = cfg.globalAnimation !== false;
  cfg.globalOverlay = cfg.globalOverlay !== false;
  cfg.overlayPreview = cfg.overlayPreview === true;
  cfg.interval = Math.max(700, Math.min(60000, Number(cfg.interval) || 4000));
  cfg.duration = Math.max(1000, Math.min(20000, Number(cfg.duration) || 5000));
  cfg.animation = FX_ANIMATIONS.includes(String(cfg.animation || '')) ? String(cfg.animation) : 'fade';
  cfg.overlay = Math.max(0, Math.min(90, Number(cfg.overlay) || 0));
  cfg.current = Math.max(0, Math.min(Math.max(0, cfg.slides.length - 1), Number(cfg.current) || 0));
  return cfg;
}

function writeConfig(el, cfg) {
  if (!el) return;
  const clean = backfillMissingSlidesFromAuthoredDefaults(el, Object.assign(defaultFxConfig(), cfg || {}));
  clean.slides = Array.isArray(clean.slides) ? clean.slides.map(normalizeSlide).filter(s => s.src) : [];
  clean.globalInterval = clean.globalInterval !== false;
  clean.globalDuration = clean.globalDuration !== false;
  clean.globalAnimation = clean.globalAnimation !== false;
  clean.globalOverlay = clean.globalOverlay !== false;
  clean.overlayPreview = clean.overlayPreview === true;
  clean.interval = Math.max(700, Math.min(60000, Number(clean.interval) || 4000));
  clean.duration = Math.max(1000, Math.min(20000, Number(clean.duration) || 5000));
  clean.animation = FX_ANIMATIONS.includes(String(clean.animation || '')) ? String(clean.animation) : 'fade';
  clean.overlay = Math.max(0, Math.min(90, Number(clean.overlay) || 0));
  clean.current = Math.max(0, Math.min(Math.max(0, clean.slides.length - 1), Number(clean.current) || 0));
  el.setAttribute('data-st-fx-bg-slider', JSON.stringify(clean));
}



function compactSlideBg(bg = {}) {
  const v = normalizeSlideBg(bg);
  const d = defaultSlideBg();
  const out = {};
  Object.keys(d).forEach(key => {
    if (String(v[key]) !== String(d[key])) out[key] = v[key];
  });
  return out;
}

function getSlideBg(slide = {}) {
  return normalizeSlideBg(slide.bg || slide);
}

function getSlideBgSize(slide = {}) {
  const bg = getSlideBg(slide);
  if (bg.fit === 'custom') {
    const effX = Math.max(0, Math.min(400, Math.round(bg.scale * bg.scaleX / 100)));
    const effY = Math.max(0, Math.min(400, Math.round(bg.scale * bg.scaleY / 100)));
    return `${effX}% ${effY}%`;
  }
  return bg.fit || 'cover';
}

function getSlideBgPosition(slide = {}) {
  const bg = getSlideBg(slide);
  if (bg.position === 'custom') return `${Math.round(bg.posX)}% ${Math.round(bg.posY)}%`;
  return bg.position || 'center center';
}

function getSlideLayerOpacity(slide = {}) {
  const bg = getSlideBg(slide);
  return Math.max(0, Math.min(1, bg.opacity / 100));
}

function getSlideBaseFilter(slide = {}) {
  const gray = Math.max(0, Math.min(1, getSlideBg(slide).gray / 100));
  return gray > 0 ? `grayscale(${gray})` : 'none';
}

function mergeLayerFilter(baseFilter = 'none', extraFilter = '') {
  const parts = [];
  if (baseFilter && baseFilter !== 'none') parts.push(baseFilter);
  if (extraFilter && extraFilter !== 'none') parts.push(extraFilter);
  return parts.length ? parts.join(' ') : 'none';
}

function buildSlideBackgroundImage(slide = {}) {
  const safeUrl = String(slide.src || '').replace(/"/g, '%22');
  const image = `url("${safeUrl}")`;
  const bg = getSlideBg(slide);
  const fOp = Math.max(0, Math.min(1, bg.filterOpacity / 100));
  if (fOp <= 0 || bg.filterMode === 'off') return image;
  if (bg.filterMode === 'color') {
    const color = hexToRgba(bg.filterColor, fOp);
    return `linear-gradient(${color}, ${color}), ${image}`;
  }
  if (bg.filterMode === 'gradient') {
    const c1 = hexToRgba(bg.filterGrad1, fOp);
    const c2 = hexToRgba(bg.filterGrad2, fOp);
    const c3 = hexToRgba(bg.filterGrad3, fOp);
    return `linear-gradient(${Math.round(bg.filterAngle)}deg, ${c1}, ${c2}, ${c3}), ${image}`;
  }
  return image;
}

function getSlideInterval(cfg, index) {
  const slide = cfg?.slides?.[index] || {};
  return cfg?.globalInterval === false
    ? Math.max(700, Math.min(60000, Number(slide.interval) || Number(cfg.interval) || 4000))
    : Math.max(700, Math.min(60000, Number(cfg?.interval) || 4000));
}

function getSlideDuration(cfg, index) {
  const slide = cfg?.slides?.[index] || {};
  return cfg?.globalDuration === false
    ? Math.max(1000, Math.min(20000, Number(slide.duration) || Number(cfg.duration) || 5000))
    : Math.max(1000, Math.min(20000, Number(cfg?.duration) || 5000));
}

function getSlideAnimation(cfg, index) {
  const slide = cfg?.slides?.[index] || {};
  const value = cfg?.globalAnimation === false ? (slide.animation || cfg.animation || 'fade') : (cfg?.animation || 'fade');
  return FX_ANIMATIONS.includes(String(value)) ? String(value) : 'fade';
}

function getSlideOverlay(cfg, index) {
  const slide = cfg?.slides?.[index] || {};
  const base = Math.max(0, Math.min(90, Number(cfg?.overlay) || 0));
  if (cfg?.globalOverlay === false && slide.overlay !== undefined && slide.overlay !== null && String(slide.overlay) !== '') {
    return Math.max(0, Math.min(90, Number(slide.overlay) || 0));
  }
  return base;
}


function isShiftAnimation(animation) {
  return ['shift-right','shift-left','shift-up','shift-down'].includes(String(animation || ''));
}

function getShiftEnterTransform(animation) {
  const value = String(animation || '');
  if (value === 'shift-right') return 'translate3d(-100%,0,0) scale(1)';
  if (value === 'shift-left') return 'translate3d(100%,0,0) scale(1)';
  if (value === 'shift-up') return 'translate3d(0,100%,0) scale(1)';
  if (value === 'shift-down') return 'translate3d(0,-100%,0) scale(1)';
  return 'translate3d(0,0,0) scale(1)';
}

function getShiftOldExitTransform(animation) {
  const value = String(animation || '');
  if (value === 'shift-right') return 'translate3d(100%,0,0) scale(1)';
  if (value === 'shift-left') return 'translate3d(-100%,0,0) scale(1)';
  if (value === 'shift-up') return 'translate3d(0,-100%,0) scale(1)';
  if (value === 'shift-down') return 'translate3d(0,100%,0) scale(1)';
  return 'translate3d(0,0,0) scale(1)';
}

function applyAnimationClass(el, animation) {
  if (!el) return;
  FX_ANIM_CLASSES.forEach(cls => el.classList.remove(cls));
  el.classList.add(`st-fx-anim-${FX_ANIMATIONS.includes(String(animation)) ? animation : 'fade'}`);
}

function getActiveSlideIndexes(cfg) {
  const slides = Array.isArray(cfg?.slides) ? cfg.slides : [];
  // 00992: legacy slide.paused used to mean "remove this slide from rotation".
  // The editor Pause/Play button now controls the slideshow runtime as a whole,
  // so old persisted per-slide paused flags must not silently disable slides.
  return slides
    .map((slide, index) => (slide && slide.src ? index : -1))
    .filter(index => index >= 0);
}

function resolveActiveSlideIndex(cfg, desiredIndex, direction = 1) {
  const active = getActiveSlideIndexes(cfg);
  if (!active.length) return -1;
  const slides = Array.isArray(cfg?.slides) ? cfg.slides : [];
  const total = Math.max(1, slides.length);
  let index = Number.isFinite(Number(desiredIndex)) ? Math.round(Number(desiredIndex)) : active[0];
  const step = direction < 0 ? -1 : 1;
  for (let attempt = 0; attempt < total + 1; attempt += 1) {
    const normalized = ((index % total) + total) % total;
    if (active.includes(normalized)) return normalized;
    index += step;
  }
  return active[0];
}

function hasActiveSlides(cfg) {
  return getActiveSlideIndexes(cfg).length > 0;
}

function clearSliderResume00990(el) {
  const cleanup = sliderResumeCleanups00990.get(el);
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (_) {}
  }
  sliderResumeCleanups00990.delete(el);
}

function armSliderResume00990(el, canResume, resume) {
  if (!el || sliderResumeCleanups00990.has(el)) return;
  let frame = 0;
  const maybeResume = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      let ready = false;
      try { ready = !!canResume(); } catch (_) {}
      if (!ready) return;
      clearSliderResume00990(el);
      try { resume(); } catch (_) {}
    });
  };
  const onSelection = () => maybeResume();
  const onGestureEnd = () => maybeResume();
  const onFocus = () => maybeResume();
  document.addEventListener('st:selection-changed', onSelection);
  document.addEventListener('st:site-frame-edit-gesture-end', onGestureEnd);
  document.addEventListener('focusin', onFocus, true);
  document.addEventListener('focusout', onFocus, true);
  el.addEventListener('mouseleave', onFocus, { passive: true });
  sliderResumeCleanups00990.set(el, () => {
    if (frame) window.cancelAnimationFrame(frame);
    document.removeEventListener('st:selection-changed', onSelection);
    document.removeEventListener('st:site-frame-edit-gesture-end', onGestureEnd);
    document.removeEventListener('focusin', onFocus, true);
    document.removeEventListener('focusout', onFocus, true);
    el.removeEventListener('mouseleave', onFocus);
  });
}

function stopFx(el) {
  const t = timers.get(el);
  if (t) window.clearTimeout(t);
  timers.delete(el);
  clearSliderResume00990(el);
  sliderRuntimeControllers00992.delete(el);
}

function cleanupRuntime(el) {
  if (!el) return;
  stopFx(el);
  el.querySelectorAll(`:scope > [${RUNTIME_ATTR}]`).forEach(n => n.remove());
  el.classList.remove('st-fx-slider', ...FX_ANIM_CLASSES);
}


const FX_RESTORE_STYLE_PROPS = [
  'background', 'background-color', 'background-image', 'background-size', 'background-position',
  'background-repeat', 'background-attachment', 'background-origin', 'background-clip',
  'opacity', 'filter', 'position', 'overflow',
  '--st-bgfx-bg', '--st-bgfx-bg-opacity', '--st-bgfx-bg-size', '--st-bgfx-bg-pos',
  '--st-bgfx-bg-pos-x', '--st-bgfx-bg-pos-y', '--st-bgfx-gray', '--st-bgfx-filter',
  '--st-bgfx-filter-opacity', '--st-bgfx-canvas-fixed',
  '--st-fx-overlay', '--st-fx-duration'
];

function resolveFillLayerForFx(el) {
  if (!el || el.nodeType !== 1) return null;
  try {
    return el.querySelector?.(':scope > .st-section-inner, :scope > .st-block-inner') || el;
  } catch (_) {
    return el;
  }
}

function getFxManagedLayers(el) {
  const list = [];
  const push = (node, role) => {
    if (!node || node.nodeType !== 1 || list.some(item => item.node === node)) return;
    list.push({ node, role });
  };
  push(el, 'host');
  const fillLayer = resolveFillLayerForFx(el);
  if (fillLayer && fillLayer !== el) push(fillLayer, 'fill');
  return list;
}

function captureFxLayerState(node, role) {
  const style = {};
  FX_RESTORE_STYLE_PROPS.forEach(prop => {
    try { style[prop] = node.style.getPropertyValue(prop) || ''; } catch (_) { style[prop] = ''; }
  });
  return {
    role,
    selector: role,
    stBgfx: node.classList?.contains('st-bgfx') || false,
    stBgfxCanvasFixed: node.classList?.contains('st-bgfx--canvasfixed') || false,
    style,
  };
}

function saveFillBeforeFx(el) {
  if (!el || el.nodeType !== 1) return;
  if (el.hasAttribute(RESTORE_ATTR)) return;
  const payload = {
    v: RESTORE_VERSION,
    savedAt: Date.now(),
    layers: getFxManagedLayers(el).map(item => captureFxLayerState(item.node, item.role)),
  };
  try { el.setAttribute(RESTORE_ATTR, JSON.stringify(payload)); } catch (_) {}
}

function clearFillLayerForFx(node) {
  if (!node || node.nodeType !== 1) return;
  try {
    node.classList.remove('st-bgfx', 'st-bgfx--canvasfixed');
    FX_RESTORE_STYLE_PROPS.forEach(prop => {
      try { node.style.removeProperty(prop); } catch (_) {}
    });
    node.style.background = 'none';
    node.style.backgroundImage = '';
    node.style.backgroundColor = 'transparent';
  } catch (_) {}
}

function suspendFillForFx(el) {
  if (!el || el.nodeType !== 1) return;
  getFxManagedLayers(el).forEach(item => clearFillLayerForFx(item.node));
}

function restoreFxLayerState(node, state) {
  if (!node || node.nodeType !== 1 || !state) return;
  try {
    node.classList.toggle('st-bgfx', !!state.stBgfx);
    node.classList.toggle('st-bgfx--canvasfixed', !!state.stBgfxCanvasFixed);
    FX_RESTORE_STYLE_PROPS.forEach(prop => {
      const value = state.style && Object.prototype.hasOwnProperty.call(state.style, prop) ? state.style[prop] : '';
      try {
        if (value) node.style.setProperty(prop, value);
        else node.style.removeProperty(prop);
      } catch (_) {}
    });
  } catch (_) {}
}

function restoreFillAfterFx(el) {
  if (!el || el.nodeType !== 1) return;
  const payload = safeJsonParse(el.getAttribute(RESTORE_ATTR), null);
  cleanupRuntime(el);
  el.style.removeProperty('--st-fx-overlay');
  el.style.removeProperty('--st-fx-duration');
  delete el.dataset.stFxCurrentLink;
  if (payload && Array.isArray(payload.layers)) {
    const map = new Map(getFxManagedLayers(el).map(item => [item.role, item.node]));
    payload.layers.forEach(state => restoreFxLayerState(map.get(state.role), state));
  }
  try { el.removeAttribute(RESTORE_ATTR); } catch (_) {}
}

function captureUnderlayStyleForFx(el) {
  const fill = resolveFillLayerForFx(el) || el;
  try {
    const cs = window.getComputedStyle(fill);
    return {
      backgroundColor: cs.backgroundColor || 'transparent',
      backgroundImage: cs.backgroundImage || 'none',
      backgroundSize: cs.backgroundSize || 'cover',
      backgroundPosition: cs.backgroundPosition || 'center center',
      backgroundRepeat: cs.backgroundRepeat || 'no-repeat',
      backgroundAttachment: cs.backgroundAttachment || 'scroll',
      backgroundOrigin: cs.backgroundOrigin || 'padding-box',
      backgroundClip: cs.backgroundClip || 'border-box',
      filter: cs.filter || 'none',
      opacity: cs.opacity || '1',
    };
  } catch (_) {
    return null;
  }
}

function appendUnderlayForFx(stage, underlayStyle) {
  if (!stage || !underlayStyle) return;
  const underlay = document.createElement('div');
  underlay.className = 'st-fx-fill-underlay';
  underlay.setAttribute('data-st-fx-runtime', '1');
  try {
    underlay.style.backgroundColor = underlayStyle.backgroundColor || 'transparent';
    underlay.style.backgroundImage = underlayStyle.backgroundImage || 'none';
    underlay.style.backgroundSize = underlayStyle.backgroundSize || 'cover';
    underlay.style.backgroundPosition = underlayStyle.backgroundPosition || 'center center';
    underlay.style.backgroundRepeat = underlayStyle.backgroundRepeat || 'no-repeat';
    underlay.style.backgroundAttachment = underlayStyle.backgroundAttachment || 'scroll';
    underlay.style.backgroundOrigin = underlayStyle.backgroundOrigin || 'padding-box';
    underlay.style.backgroundClip = underlayStyle.backgroundClip || 'border-box';
    underlay.style.filter = underlayStyle.filter || 'none';
    underlay.style.opacity = underlayStyle.opacity || '1';
  } catch (_) {}
  stage.appendChild(underlay);
}

function disableFxButKeepConfig(el) {
  if (!el || el.nodeType !== 1) return;
  const cfg = readConfig(el);
  cfg.enabled = false;
  writeConfig(el, cfg);
  restoreFillAfterFx(el);
}

function updateBoundChildren(el, index) {
  if (!el) return;
  try {
    const children = Array.from(el.querySelectorAll('[data-st-fx-bind-slide]'))
      .filter(child => !child.closest?.(`[${RUNTIME_ATTR}]`));
    if (!children.length) {
      el.removeAttribute('data-st-fx-active-slide');
      return;
    }
    // 00990: the active slide is a runtime property of the slider host.
    // Child style.display is never touched, so SiteFrameStore geometry commits cannot
    // accidentally restore a persisted display:none on the block being resized.
    const requested = Number(index);
    const activeNumber = Number.isFinite(requested) && requested >= 0 ? Math.round(requested) + 1 : 1;
    el.setAttribute('data-st-fx-active-slide', String(activeNumber));
    children.forEach(child => {
      const n = Number(child.getAttribute('data-st-fx-bind-slide'));
      child.setAttribute('aria-hidden', Number.isFinite(n) && n === activeNumber ? 'false' : 'true');
    });
  } catch (_) {}
}

function setSlide(el, cfg, nextIndex, immediate = false) {
  if (!el || !cfg.slides.length) return -1;
  const current = Number(cfg.current) || 0;
  const direction = Number(nextIndex) < current ? -1 : 1;
  const index = resolveActiveSlideIndex(cfg, nextIndex, direction);
  if (index < 0) {
    updateBoundChildren(el, -1);
    return -1;
  }
  cfg.current = index;
  writeConfig(el, cfg);

  const slide = cfg.slides[index];
  const animation = getSlideAnimation(cfg, index);
  const durationMs = (animation === 'instant') ? 0 : Math.max(1000, Math.min(20000, getSlideDuration(cfg, index)));
  const bg = buildSlideBackgroundImage(slide);
  const bgSize = getSlideBgSize(slide);
  const bgPosition = getSlideBgPosition(slide);
  const targetOpacity = getSlideLayerOpacity(slide);
  const baseFilter = getSlideBaseFilter(slide);
  applyAnimationClass(el, animation);

  el.style.backgroundSize = bgSize;
  el.style.backgroundPosition = bgPosition;
  el.style.backgroundRepeat = 'no-repeat';
  el.style.setProperty('--st-fx-overlay', String(getSlideOverlay(cfg, index) / 100));
  el.style.setProperty('--st-fx-duration', `${durationMs}ms`);
  el.dataset.stFxCurrentLink = slide.link || '';

  const stage = el.querySelector(':scope > .st-fx-bg-stage');

  // ВАЖЛИВО: не міняємо backgroundImage самого елемента ДО переходу.
  // Інакше браузер миттєво показує новий фон під шарами, і анімація здається відсутньою.
  // Тепер перехід відбувається тільки через два runtime-шари: старий шар + новий шар.
  if (stage) {
    const layers = Array.from(stage.querySelectorAll(':scope > .st-fx-bg-layer'));
    let oldLayer = layers.length ? layers[layers.length - 1] : null;
    layers.slice(0, -1).forEach(layer => layer.remove());

    const transition = `opacity ${durationMs}ms ease, transform ${durationMs}ms ease, filter ${durationMs}ms ease`;
    const shiftMode = isShiftAnimation(animation);
    const finishInstantly = immediate || animation === 'instant' || durationMs <= 0 || !oldLayer;

    const nextLayer = document.createElement('div');
    nextLayer.className = 'st-fx-bg-layer is-enter';
    nextLayer.style.backgroundImage = bg;
    nextLayer.style.backgroundSize = bgSize;
    nextLayer.style.backgroundPosition = bgPosition;
    nextLayer.style.backgroundRepeat = 'no-repeat';
    nextLayer.style.zIndex = '2';
    nextLayer.style.opacity = (finishInstantly || shiftMode) ? String(targetOpacity) : '0.001';
    nextLayer.style.transform = shiftMode ? getShiftEnterTransform(animation) : 'translate3d(0,0,0) scale(1)';
    nextLayer.style.filter = baseFilter;
    nextLayer.style.transition = 'none';

    if (animation === 'slide-left') nextLayer.style.transform = 'translate3d(34px,0,0) scale(1)';
    if (animation === 'slide-right') nextLayer.style.transform = 'translate3d(-34px,0,0) scale(1)';
    if (animation === 'slide-up') nextLayer.style.transform = 'translate3d(0,34px,0) scale(1)';
    if (animation === 'slide-down') nextLayer.style.transform = 'translate3d(0,-34px,0) scale(1)';
    if (animation === 'slide-up-right') nextLayer.style.transform = 'translate3d(-34px,34px,0) scale(1)';
    if (animation === 'slide-up-left') nextLayer.style.transform = 'translate3d(34px,34px,0) scale(1)';
    if (animation === 'slide-down-right') nextLayer.style.transform = 'translate3d(-34px,-34px,0) scale(1)';
    if (animation === 'slide-down-left') nextLayer.style.transform = 'translate3d(34px,-34px,0) scale(1)';
    if (animation === 'zoom') nextLayer.style.transform = 'translate3d(0,0,0) scale(.92)';
    if (animation === 'zoom-out') nextLayer.style.transform = 'translate3d(0,0,0) scale(1.12)';
    if (animation === 'blur') nextLayer.style.filter = mergeLayerFilter(baseFilter, 'blur(12px)');

    if (oldLayer) {
      oldLayer.classList.remove('is-enter');
      oldLayer.classList.add('is-current');
      oldLayer.style.zIndex = '1';
      oldLayer.style.opacity = oldLayer.style.opacity || '1';
      oldLayer.style.transform = oldLayer.style.transform || 'translate3d(0,0,0) scale(1)';
      oldLayer.style.filter = oldLayer.style.filter || 'none';
      oldLayer.style.transition = 'none';
    }

    stage.appendChild(nextLayer);

    const finish = () => {
      if (oldLayer && oldLayer !== nextLayer) oldLayer.remove();
      nextLayer.classList.remove('is-enter');
      nextLayer.classList.add('is-current');
      nextLayer.style.zIndex = '1';
      nextLayer.style.opacity = String(targetOpacity);
      nextLayer.style.transform = 'translate3d(0,0,0) scale(1)';
      nextLayer.style.filter = baseFilter;
      nextLayer.style.backgroundSize = bgSize;
      nextLayer.style.backgroundPosition = bgPosition;
      // 00174: не кладемо картинку слайда у background самого елемента.
      // Інакше загальна прозорість слайда показуватиме під ним ту саму картинку,
      // а не фон, який реально лежить нижче. Уся картинка живе у runtime-шарах.
      el.style.backgroundSize = bgSize;
      el.style.backgroundPosition = bgPosition;
    };

    if (finishInstantly) {
      finish();
    } else {
      // Подвійний RAF потрібен, щоб браузер гарантовано зафіксував стартовий стан
      // opacity/transform/filter, а вже потім побачив кінцевий стан і виконав transition.
      nextLayer.getBoundingClientRect();
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          nextLayer.style.transition = transition;
          if (oldLayer) oldLayer.style.transition = transition;
          nextLayer.style.opacity = String(targetOpacity);
          nextLayer.style.transform = 'translate3d(0,0,0) scale(1)';
          nextLayer.style.filter = baseFilter;
          if (oldLayer) {
            if (shiftMode) {
              oldLayer.style.opacity = '1';
              oldLayer.style.transform = getShiftOldExitTransform(animation);
            } else {
              oldLayer.style.opacity = '0';
            }
          }
        });
      });
      window.setTimeout(finish, durationMs + 180);
    }
  } else {
    el.style.backgroundImage = bg;
    el.style.backgroundSize = bgSize;
    el.style.backgroundPosition = bgPosition;
  }

  el.querySelectorAll(':scope > .st-fx-nav .st-fx-dot').forEach((dot) => {
    const slideIndex = Number(dot.dataset.slideIndex);
    dot.classList.toggle('is-active', slideIndex === index);
  });
  updateBoundChildren(el, index);
  return index;
}
function buildNav(el, cfg) {
  const wantsDots = cfg.nav === 'dots' || cfg.nav === 'dots-hover' || cfg.nav === 'both' || cfg.nav === 'both-hover';
  const wantsArrows = cfg.nav === 'arrows' || cfg.nav === 'arrows-hover' || cfg.nav === 'both' || cfg.nav === 'both-hover';
  const hover = cfg.nav.includes('hover') ? cfg.nav : '';

  const activeSlideIndexes = getActiveSlideIndexes(cfg);

  if (wantsDots && activeSlideIndexes.length > 1) {
    const nav = document.createElement('div');
    nav.className = 'st-fx-nav';
    nav.setAttribute('data-st-fx-runtime', '1');
    nav.dataset.mode = hover;
    activeSlideIndexes.forEach((slideIndex, dotIndex) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'st-fx-dot' + (slideIndex === cfg.current ? ' is-active' : '');
      dot.dataset.slideIndex = String(slideIndex);
      dot.setAttribute('aria-label', `Слайд ${dotIndex + 1}`);
      dot.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        setSlide(el, readConfig(el), slideIndex);
      });
      nav.appendChild(dot);
    });
    el.appendChild(nav);
  }

  if (wantsArrows && activeSlideIndexes.length > 1) {
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'st-fx-arrow st-fx-arrow--prev';
    prev.dataset.mode = hover;
    prev.setAttribute('data-st-fx-runtime', '1');
    prev.innerHTML = '‹';
    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'st-fx-arrow st-fx-arrow--next';
    next.dataset.mode = hover;
    next.setAttribute('data-st-fx-runtime', '1');
    next.innerHTML = '›';
    prev.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); const c = readConfig(el); setSlide(el, c, (Number(c.current) || 0) - 1); });
    next.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); const c = readConfig(el); setSlide(el, c, (Number(c.current) || 0) + 1); });
    el.appendChild(prev);
    el.appendChild(next);
  }
}

function initBackgroundFx(el) {
  if (!el || el.nodeType !== 1) return;
  const cfg = readConfig(el);
  cleanupRuntime(el);
  if (!cfg.enabled || !cfg.slides.length || !hasActiveSlides(cfg)) {
    if (!cfg.enabled) setSliderManualPaused00992(el, false);
    if (!cfg.enabled && el.hasAttribute(RESTORE_ATTR)) restoreFillAfterFx(el);
    updateBoundChildren(el, -1);
    return;
  }

  // Якщо спецефекти увімкнені, цей елемент тимчасово переходить під керування
  // віджета Спецефекти. Звичайну заливку зберігаємо і ховаємо, щоб вона не
  // перекривала слайди. Після вимкнення чекбокса повертаємо її 1:1.
  const underlayStyle = captureUnderlayStyleForFx(el);
  saveFillBeforeFx(el);
  suspendFillForFx(el);

  const pos = getComputedStyle(el).position;
  if (pos === 'static') el.style.position = 'relative';
  el.classList.add('st-fx-slider');
  applyAnimationClass(el, getSlideAnimation(cfg, cfg.current || 0));
  el.style.overflow = el.style.overflow || 'hidden';

  const stage = document.createElement('div');
  stage.className = 'st-fx-bg-stage';
  stage.setAttribute('data-st-fx-runtime', '1');
  appendUnderlayForFx(stage, underlayStyle);
  const layer = document.createElement('div');
  layer.className = 'st-fx-bg-layer';
  stage.appendChild(layer);
  const overlay = document.createElement('div');
  overlay.className = 'st-fx-bg-overlay';
  overlay.setAttribute('data-st-fx-runtime', '1');
  stage.appendChild(overlay);
  el.insertBefore(stage, el.firstChild);

  buildNav(el, cfg);
  setSlide(el, cfg, cfg.current || 0, true);

  if (getActiveSlideIndexes(cfg).length > 1) {
    let hoverPaused = false;
    const schedule = (delay) => {
      if (isSliderManualPaused00992(el)) return;
      const id = window.setTimeout(tick, Math.max(250, Number(delay) || 250));
      timers.set(el, id);
    };
    const isAuthoringFrozen00992 = () => {
      const editGestureActive = document.documentElement.classList.contains('sf-edit-resizing')
        || document.documentElement.classList.contains('sf-edit-dragging');
      const activeElement = document.activeElement;
      const textFocusInsideThisSlider = activeElement instanceof HTMLElement
        && el.contains(activeElement)
        && !!activeElement.closest?.('[contenteditable="true"],[contenteditable="plaintext-only"],.st-text-edit,[data-st-text-target="1"]');
      return isSliderManualPaused00992(el) || hoverPaused || editGestureActive || textFocusInsideThisSlider;
    };
    const tick = () => {
      timers.delete(el);
      const c = readConfig(el);
      if (!c.enabled || !c.slides.length) return stopFx(el);
      if (isSliderManualPaused00992(el)) return;
      if (isAuthoringFrozen00992()) {
        armSliderResume00990(
          el,
          () => !isAuthoringFrozen00992(),
          () => {
            const resumed = readConfig(el);
            if (resumed.enabled && resumed.slides.length && !isSliderManualPaused00992(el)) {
              schedule(getSlideInterval(resumed, resumed.current || 0));
            }
          }
        );
        return;
      }
      const cur = Number(c.current) || 0;
      const next = c.random ? Math.floor(Math.random() * c.slides.length) : cur + 1;
      if (!c.loop && next >= c.slides.length) return stopFx(el);
      const appliedIndex = setSlide(el, c, next);
      const safeIndex = appliedIndex >= 0 ? appliedIndex : resolveActiveSlideIndex(c, next);
      schedule(getSlideInterval(c, safeIndex));
    };
    if (cfg.pauseOnHover) {
      el.addEventListener('mouseenter', () => { hoverPaused = true; }, { passive: true });
      el.addEventListener('mouseleave', () => {
        hoverPaused = false;
        if (!isSliderManualPaused00992(el) && !timers.has(el) && !sliderResumeCleanups00990.has(el)) {
          const c = readConfig(el);
          if (c.enabled && c.slides.length) schedule(getSlideInterval(c, c.current || 0));
        }
      }, { passive: true });
    }
    sliderRuntimeControllers00992.set(el, Object.freeze({
      restart() {
        const old = timers.get(el);
        if (old) window.clearTimeout(old);
        timers.delete(el);
        clearSliderResume00990(el);
        const c = readConfig(el);
        if (!isSliderManualPaused00992(el) && c.enabled && getActiveSlideIndexes(c).length > 1) {
          schedule(getSlideInterval(c, c.current || 0));
        }
      },
      setManualPaused(paused) {
        const next = setSliderManualPaused00992(el, paused);
        const old = timers.get(el);
        if (old) window.clearTimeout(old);
        timers.delete(el);
        clearSliderResume00990(el);
        if (!next) {
          const c = readConfig(el);
          if (c.enabled && getActiveSlideIndexes(c).length > 1) schedule(getSlideInterval(c, c.current || 0));
        }
        return next;
      },
      isManualPaused() {
        return isSliderManualPaused00992(el);
      },
    }));
    if (!isSliderManualPaused00992(el)) schedule(getSlideInterval(cfg, cfg.current || 0));
  }

}

function rehydrateBackgroundFx00992() {
  try {
    document.querySelectorAll('[data-st-fx-bg-slider]').forEach((host) => initBackgroundFx(host));
  } catch (_) {}
}

function rehydrateMainRuntimeFx01016(reason = 'main-dom-rendered') {
  let hosts = 0;
  let hydrated = 0;
  try {
    const main = document.getElementById('st-site-main-slot');
    if (!(main instanceof HTMLElement)) return { hosts, hydrated };
    const list = Array.from(main.querySelectorAll('[data-st-fx-bg-slider]'));
    hosts = list.length;
    for (const host of list) {
      initBackgroundFx(host);
      if (host.classList.contains('st-fx-slider')) hydrated += 1;
    }
    try { bootAllBlockCarousels(); } catch (_) {}
    try {
      window.__ST_ALL_LOG__?.push?.('special-effects:main-runtime-rehydrated-01016', {
        version: '01016-main-runtime-rehydrate-contract',
        reason: String(reason || ''),
        hosts,
        hydrated,
        exact: hosts === hydrated,
      }, hosts === hydrated ? 'info' : 'warn');
    } catch (_) {}
  } catch (_) {}
  return { hosts, hydrated };
}

function persist(reason = 'special-effects') {
  // SiteFrame root save renders Main from canonical JSON synchronously. Any runtime
  // slider layers on the old DOM disappear with that render, so rehydrate the new
  // live hosts immediately as part of this explicit save action (no observer/polling).
  try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason }); } catch (_) {}
  rehydrateBackgroundFx00992();
  try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason } })); } catch (_) {}
}

function collectTargets(getSelection) {
  const sel = getSelection?.() || window.ST_SELECTION?.get?.() || null;
  const arr = Array.isArray(sel?.elements) ? sel.elements : [];
  const live = arr.map(resolveLiveSiteElement00992).filter(Boolean);
  return [...new Set(live.filter(el => {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest?.('#design-panel-root,.builder__settings,.hb-panel,.fb-panel')) return false;
    return el.classList?.contains('st-section') || el.classList?.contains('st-block') || el.classList?.contains('st-row') || el.id === 'st-site-header-slot' || el.id === 'st-site-footer-slot';
  }))];
}

function findSliderHost(el) {
  const live = resolveLiveSiteElement00992(el);
  try { return live?.closest?.('[data-st-fx-bg-slider]') || null; } catch (_) { return null; }
}

function collectFxTargets(getSelection) {
  return [...new Set(collectTargets(getSelection).map(el => findSliderHost(el) || el).filter(Boolean))];
}

function getDirectSelectedTarget00990(event, getSelection) {
  const detail = event?.detail || null;
  const candidates = [detail?.element, detail?.el, ...(Array.isArray(detail?.elements) ? detail.elements : [])];
  const direct = candidates.find(el => el && el.nodeType === 1);
  return resolveLiveSiteElement00992(direct) || collectTargets(getSelection)[0] || null;
}

function openBackgroundSliderEditor00990(section, selected) {
  if (!section || !selected) return false;
  const sliderHost = findSliderHost(selected);
  if (!sliderHost) return false;
  section.classList.add('is-open');
  const body = section.querySelector('.design-section__body');
  if (body) body.hidden = false;
  const accordion = section.querySelector('.stfx-bg-accordion');
  if (accordion) accordion.open = true;
  return true;
}

function readSlideBgFromCard(card) {
  const defaults = defaultSlideBg();
  const pick = (name) => card?.querySelector?.(`[data-slide-bg="${name}"]`)?.value;
  const colorValue = (name, textName, fallback) => normalizeHexColor(pick(textName) || pick(name), fallback);
  return normalizeSlideBg({
    fit: pick('fit') || defaults.fit,
    scale: pick('scale') || defaults.scale,
    scaleX: pick('scaleX') || defaults.scaleX,
    scaleY: pick('scaleY') || defaults.scaleY,
    position: pick('position') || defaults.position,
    posX: pick('posX') || defaults.posX,
    posY: pick('posY') || defaults.posY,
    opacity: pick('opacity') || defaults.opacity,
    gray: pick('gray') || defaults.gray,
    filterMode: pick('filterMode') || defaults.filterMode,
    filterColor: colorValue('filterColor', 'filterColorText', defaults.filterColor),
    filterGrad1: colorValue('filterGrad1', 'filterGrad1Text', defaults.filterGrad1),
    filterGrad2: colorValue('filterGrad2', 'filterGrad2Text', defaults.filterGrad2),
    filterGrad3: colorValue('filterGrad3', 'filterGrad3Text', defaults.filterGrad3),
    filterAngle: pick('filterAngle') || defaults.filterAngle,
    filterOpacity: pick('filterOpacity') || defaults.filterOpacity,
  });
}

function getUiDraftSlides(section) {
  const slides = [];
  section?.querySelectorAll?.('[data-slide-src]')?.forEach(srcInput => {
    const i = Number(srcInput.dataset.slideSrc);
    const linkInput = section.querySelector(`[data-slide-link="${i}"]`);
    const card = srcInput.closest?.('.stfx-slide');
    const slide = {
      src: String(srcInput.value || '').trim(),
      link: String(linkInput?.value || '').trim(),
      alt: '',
      paused: false,
      bg: readSlideBgFromCard(card)
    };
    const interval = Number(card?.dataset?.slideInterval || 0);
    const duration = Number(card?.dataset?.slideDuration || 0);
    const animation = String(card?.dataset?.slideAnimation || '').trim();
    const overlayRaw = card?.dataset?.slideOverlay;
    if (interval) slide.interval = interval;
    if (duration) slide.duration = duration;
    if (FX_ANIMATIONS.includes(animation)) slide.animation = animation;
    if (overlayRaw !== undefined && overlayRaw !== null && String(overlayRaw) !== '') slide.overlay = Math.max(0, Math.min(90, Number(overlayRaw) || 0));
    slides.push(slide);
  });
  return slides;
}


function slideCompareObject(slide = {}) {
  const src = String(slide.src || '').trim();
  const link = String(slide.link || '').trim();
  // 00992: legacy per-slide pause is intentionally excluded from draft/apply equality.
  const out = { src, link };
  const interval = Number(slide.interval || 0);
  const duration = Number(slide.duration || 0);
  const animation = String(slide.animation || '').trim();
  const overlayRaw = slide.overlay;
  if (interval) out.interval = Math.max(1000, Math.min(60000, interval));
  if (duration) out.duration = Math.max(1000, Math.min(20000, duration));
  if (FX_ANIMATIONS.includes(animation)) out.animation = animation;
  if (overlayRaw !== undefined && overlayRaw !== null && String(overlayRaw) !== '') out.overlay = Math.max(0, Math.min(90, Number(overlayRaw) || 0));
  const bg = compactSlideBg(slide.bg || slide);
  if (Object.keys(bg).length) out.bg = bg;
  return out;
}

function sameSlideData(a, b) {
  return JSON.stringify(slideCompareObject(a)) === JSON.stringify(slideCompareObject(b));
}

function hasSlideDraftChanges(section, getSelection) {
  const targets = collectFxTargets(getSelection);
  const first = targets[0] || null;
  if (!first) return false;
  const applied = readConfig(first).slides.map(slideCompareObject);
  const draft = getUiDraftSlides(section).map(slideCompareObject);
  if (applied.length !== draft.length) return true;
  return draft.some((slide, index) => JSON.stringify(slide) !== JSON.stringify(applied[index] || {}));
}

function hasEnabledDraftChange(section, el) {
  if (!section || !el) return false;
  const enabledInput = section.querySelector('[data-enabled]');
  if (!enabledInput) return false;
  const appliedEnabled = !!readConfig(el).enabled;
  const draftEnabled = !!enabledInput.checked;
  return appliedEnabled !== draftEnabled;
}

function updateSlideDirtyState(section, getSelection) {
  const targets = collectFxTargets(getSelection);
  const first = targets[0] || null;
  const applyBtn = section?.querySelector?.('[data-apply-fx]');
  if (!section || !applyBtn) return false;
  const appliedCfg = first ? readConfig(first) : defaultFxConfig();
  const applied = first ? appliedCfg.slides.map(slideCompareObject) : [];
  const draft = getUiDraftSlides(section).map(slideCompareObject);
  let hasDirty = false;
  let hasSlideDirty = false;
  section.querySelectorAll('.stfx-slide').forEach(card => {
    const index = Number(card.dataset.slideIndex);
    const dirty = !first || !sameSlideData(draft[index] || {}, applied[index] || {});
    card.classList.toggle('is-unapplied', dirty);
    if (dirty) {
      hasDirty = true;
      hasSlideDirty = true;
    }
  });
  if (first && applied.length !== draft.length) {
    hasDirty = true;
    hasSlideDirty = true;
  }

  // 00170: головна кнопка «Застосувати» має реагувати не тільки на слайди,
  // а й на перемикання власника фону: Спецефекти ON/OFF.
  // Порівнюємо фактично застосований стан з тим, що зараз вибрано в UI.
  const enabledDirty = hasEnabledDraftChange(section, first);
  if (enabledDirty) hasDirty = true;

  applyBtn.classList.add('stfx-btn--apply');
  applyBtn.classList.toggle('is-dirty', hasDirty);
  applyBtn.classList.toggle('is-clean', !hasDirty);
  applyBtn.dataset.enabledDirty = enabledDirty ? '1' : '0';
  const enabledRow = section.querySelector('[data-enabled-row]');
  if (enabledRow) {
    enabledRow.classList.toggle('is-dirty', enabledDirty);
    enabledRow.dataset.enabledDirty = enabledDirty ? '1' : '0';
    // 00171: прибираємо стандартну browser-підказку title.
    // Для цього блока має залишатися тільки наше велике custom-вікно через data-stfx-help.
    enabledRow.removeAttribute('title');
  }
  applyBtn.title = hasDirty
    ? (enabledDirty && !hasSlideDirty
      ? 'Є незастосована зміна: Увімкнути/вимкнути спецефект для активного елемента.'
      : 'Є незастосовані слайди або зміни. Натисни, щоб застосувати всі слайди.')
    : 'Усі зміни застосовані.';
  return hasDirty;
}

function markSlidesDirtySoon(section, getSelection) {
  try { window.requestAnimationFrame(() => updateSlideDirtyState(section, getSelection)); }
  catch (_) { updateSlideDirtyState(section, getSelection); }
}

function getSelectedSlideIndexes(section) {
  return [...(section?.querySelectorAll?.('.stfx-slide-select[aria-pressed="true"]') || [])]
    .map(btn => Number(btn.dataset.toggleSlideSelect))
    .filter(n => Number.isFinite(n) && n >= 0);
}

function getActiveSlideIndex(section) {
  const card = section?.querySelector?.('.stfx-slide.is-active');
  const n = Number(card?.dataset?.slideIndex);
  return Number.isFinite(n) ? n : -1;
}

function setActiveSlide(section, index) {
  section?.querySelectorAll?.('.stfx-slide.is-active')?.forEach(card => card.classList.remove('is-active'));
  const card = section?.querySelector?.(`.stfx-slide[data-slide-index="${index}"]`);
  if (card) card.classList.add('is-active');
  const globalOverlay = section?.querySelector?.('[data-global-overlay]');
  if (card && globalOverlay && globalOverlay.checked === false) {
    const overlayRaw = card.dataset.slideOverlay;
    if (overlayRaw !== undefined && overlayRaw !== null && overlayRaw !== '') {
      const input = section.querySelector('[data-overlay]');
      const out = section.querySelector('[data-overlay-out]');
      if (input) input.value = String(Math.max(0, Math.min(90, Number(overlayRaw) || 0)));
      if (out) out.textContent = `${input?.value || 0}%`;
      setSettingState(section, 'overlay', 'ok');
    }
  }
}

function setSliderPauseUi00992(section, paused) {
  if (!section) return;
  const value = !!paused;
  section.dataset.stfxSliderManualPaused = value ? '1' : '0';
  section.querySelectorAll('[data-toggle-slide-paused]').forEach((btn) => {
    btn.classList.toggle('stfx-btn--pause', value);
    btn.classList.toggle('stfx-btn--play', !value);
    btn.textContent = value ? 'Ⅱ' : '▶';
    btn.title = value
      ? 'Показ на паузі — натисни, щоб продовжити з цього слайда'
      : 'Показ працює — натисни, щоб поставити слайдер на паузу для редагування';
    btn.setAttribute('aria-pressed', value ? 'true' : 'false');
  });
}

function ensureSliderRuntime00992(host) {
  const liveHost = resolveLiveSiteElement00992(host);
  if (!(liveHost instanceof HTMLElement)) return null;
  const cfg = readConfig(liveHost);
  if (!cfg.enabled || !cfg.slides.length) return liveHost;
  const hasStage = !!liveHost.querySelector(':scope > .st-fx-bg-stage');
  const hasController = !!sliderRuntimeControllers00992.get(liveHost);
  if (!liveHost.classList.contains('st-fx-slider') || !hasStage || (getActiveSlideIndexes(cfg).length > 1 && !hasController)) {
    initBackgroundFx(liveHost);
  }
  return liveHost;
}

function activateWidgetSlide00992(section, getSelection, index, options = {}) {
  const numericIndex = Math.max(0, Math.round(Number(index) || 0));
  setActiveSlide(section, numericIndex);
  const targets = collectFxTargets(getSelection);
  let applied = 0;
  for (const rawHost of targets) {
    const host = ensureSliderRuntime00992(rawHost);
    if (!(host instanceof HTMLElement)) continue;
    const cfg = readConfig(host);
    if (!cfg.enabled || !cfg.slides.length) continue;
    const actual = setSlide(host, cfg, numericIndex, options.immediate !== false);
    if (actual >= 0) applied += 1;
    if (!isSliderManualPaused00992(host)) sliderRuntimeControllers00992.get(host)?.restart?.();
  }
  const firstHost = targets.length ? resolveLiveSiteElement00992(targets[0]) : null;
  setSliderPauseUi00992(section, isSliderManualPaused00992(firstHost));
  return Object.freeze({ index: numericIndex, applied, targets: targets.length });
}

function getTargetSlideIndexes(section) {
  const selected = getSelectedSlideIndexes(section);
  if (selected.length) return selected;
  const active = getActiveSlideIndex(section);
  return active >= 0 ? [active] : [];
}

function slideThumbStyle(src) {
  const value = String(src || '').trim();
  if (!value) return '';
  return ` style="background-image:url('${value.replace(/'/g, '%27')}')"`;
}

function secondsLabel(ms, fallbackSec = 0) {
  const sec = Math.max(0, Math.round((Number(ms) || Number(fallbackSec) * 1000 || 0) / 1000));
  return String(sec);
}

function animationLabel(value) {
  const map = {
    instant: 'Просто зміна',
    'slide-right': 'Рух вправо',
    'slide-left': 'Рух вліво',
    'slide-up': 'Рух вгору',
    'slide-down': 'Рух вниз',
    'slide-up-right': 'Рух вгору вправо',
    'slide-up-left': 'Рух вгору вліво',
    'slide-down-right': 'Рух вниз вправо',
    'slide-down-left': 'Рух вниз вліво',
    'shift-right': 'Зсув вправо',
    'shift-left': 'Зсув вліво',
    'shift-up': 'Зсув вгору',
    'shift-down': 'Зсув вниз',
    fade: 'Плавний перехід',
    zoom: 'Zoom / наближення',
    'zoom-out': 'Віддалення',
    blur: 'Blur / розмиття',
  };
  return map[String(value || '')] || 'Плавний перехід';
}

function renderSlideIndicators(cfg, index) {
  const wait = secondsLabel(getSlideInterval(cfg, index), 4);
  const duration = secondsLabel(getSlideDuration(cfg, index), 5);
  const animation = getSlideAnimation(cfg, index);
  const animationText = animationLabel(animation);
  const overlay = String(Math.max(0, Math.min(90, Math.round(getSlideOverlay(cfg, index) || 0))));
  return `
        <div class="stfx-slide-indicators" data-slide-indicators="${index}">
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="interval" data-stfx-help-delay="1000" data-stfx-help-circle="${esc(wait)}" data-stfx-help-title="ЧАС ОЧІКУВАННЯ" data-stfx-help="Час очікування для цього слайда. Зараз застосовано ${esc(wait)} секунд. Це значення реально виконується для даного слайда з урахуванням режиму: для всіх або окремо для слайда.">${esc(wait)}</button>
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="duration" data-stfx-help-delay="1000" data-stfx-help-circle="${esc(duration)}" data-stfx-help-title="ЧАС АНІМАЦІЇ" data-stfx-help="Час анімації переходу для цього слайда. Зараз застосовано ${esc(duration)} секунд. Це тривалість самого переходу між фонами.">${esc(duration)}</button>
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="animation" data-focus-animation-slide="${index}" data-animation-value="${esc(animation)}" data-stfx-help-delay="1000" data-stfx-help-circle="↔" data-stfx-help-title="Тип переходу - &quot;${esc(animationText)}&quot;" data-stfx-help="До даного слайда застосований перехід типу — &quot;${esc(animationText)}&quot;. Натисніть на цей кружечок, щоб зробити слайд активним, перейти до меню Тип переходу і одразу вибрати для нього інший перехід."></button>
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="overlay" data-stfx-help-delay="1000" data-stfx-help-circle="${esc(overlay)}" data-stfx-help-title="ЗАТЕМНЕННЯ" data-stfx-help="Затемнення для цього слайда. Зараз застосовано ${esc(overlay)}%. Це значення реально виконується для даного слайда з урахуванням режиму: для всіх або окремо для слайда.">${esc(overlay)}</button>
        </div>`;
}

function clearSlideDropMarkers(section, opts = {}) {
  section?.querySelectorAll?.('.stfx-slide.is-drop-before,.stfx-slide.is-drop-after')?.forEach(card => {
    card.classList.remove('is-drop-before', 'is-drop-after');
  });
  if (!opts.keepDragging) {
    section?.querySelectorAll?.('.stfx-slide.is-dragging')?.forEach(card => card.classList.remove('is-dragging'));
  }
}

function moveItem(list, from, to) {
  const arr = Array.isArray(list) ? list.slice() : [];
  if (from < 0 || from >= arr.length) return arr;
  const target = Math.max(0, Math.min(arr.length, Number(to) || 0));
  const [item] = arr.splice(from, 1);
  const adjusted = from < target ? target - 1 : target;
  arr.splice(Math.max(0, Math.min(arr.length, adjusted)), 0, item);
  return arr;
}

function updateSlideThumbs(section) {
  section?.querySelectorAll?.('.stfx-slide')?.forEach(card => {
    const i = Number(card.dataset.slideIndex);
    const input = section.querySelector(`[data-slide-src="${i}"]`);
    const src = String(input?.value || '').trim();
    const thumb = card.querySelector('[data-slide-thumb]');
    if (!thumb) return;
    thumb.style.backgroundImage = src ? `url("${src.replace(/"/g, '%22')}")` : '';
    thumb.classList.toggle('has-image', !!src);
    thumb.textContent = src ? '' : 'IMG';
  });
}

function slideBgValue(slide, key) {
  const bg = getSlideBg(slide);
  return bg[key];
}

function updateSlideBgPanelState(card) {
  if (!card) return;
  const index = card.dataset.slideIndex;
  const fit = card.querySelector('[data-slide-bg="fit"]')?.value || 'cover';
  const position = card.querySelector('[data-slide-bg="position"]')?.value || 'center center';
  const filterMode = card.querySelector('[data-slide-bg="filterMode"]')?.value || 'off';
  const customSize = card.querySelector(`[data-slide-bg-customsize="${index}"]`);
  const customPos = card.querySelector(`[data-slide-bg-custompos="${index}"]`);
  const color = card.querySelector(`[data-slide-bg-filter-color="${index}"]`);
  const gradient = card.querySelector(`[data-slide-bg-filter-gradient="${index}"]`);
  if (customSize) customSize.hidden = fit !== 'custom';
  if (customPos) customPos.hidden = position !== 'custom';
  if (color) color.hidden = filterMode !== 'color';
  if (gradient) gradient.hidden = filterMode !== 'gradient';
}

function updateSlideBgLabels(section) {
  section?.querySelectorAll?.('.stfx-slide').forEach(card => {
    card.querySelectorAll('[data-slide-bg]').forEach(input => {
      const name = input.getAttribute('data-slide-bg');
      const label = card.querySelector(`[data-slide-bg-label="${name}"]`);
      if (!label) return;
      const value = input.value || '0';
      label.textContent = name === 'filterAngle' ? `${value}°` : `${value}%`;
    });
    ['filterColor','filterGrad1','filterGrad2','filterGrad3'].forEach(name => {
      const color = card.querySelector(`[data-slide-bg="${name}"]`);
      const text = card.querySelector(`[data-slide-bg="${name}Text"]`);
      if (color && text && document.activeElement === color) text.value = color.value;
      if (color && text && document.activeElement === text) color.value = normalizeHexColor(text.value, color.value || '#000000');
    });
    updateSlideBgPanelState(card);
  });
}

function setSlideBgLiveState(btn, state = 'default') {
  if (!btn) return;
  const safe = state === 'off' ? 'off' : state === 'on' ? 'on' : 'default';
  btn.dataset.liveState = safe;
  btn.setAttribute('aria-pressed', safe === 'off' ? 'false' : 'true');
  btn.textContent = '★';
}

function isSlideBgLive(card) {
  const btn = card?.querySelector?.('[data-slide-bg-live-toggle]');
  return btn?.dataset?.liveState !== 'off';
}

function getAppliedSlideForCard(section, getSelection, card) {
  const targets = collectFxTargets(getSelection);
  const first = targets[0] || null;
  const index = Number(card?.dataset?.slideIndex);
  const cfg = first ? readConfig(first) : defaultFxConfig();
  const slide = cfg.slides?.[index] ? normalizeSlide(cfg.slides[index]) : normalizeSlide({ src: card?.querySelector?.(`[data-slide-src="${index}"]`)?.value || '', link: card?.querySelector?.(`[data-slide-link="${index}"]`)?.value || '' });
  return { cfg, slide, index };
}

function writeSlideBgToCard(card, bgRaw) {
  if (!card) return;
  const bg = normalizeSlideBg(bgRaw || {});
  const values = {
    fit: bg.fit,
    scale: Math.round(bg.scale),
    scaleX: Math.round(bg.scaleX),
    scaleY: Math.round(bg.scaleY),
    position: bg.position,
    posX: Math.round(bg.posX),
    posY: Math.round(bg.posY),
    opacity: Math.round(bg.opacity),
    gray: Math.round(bg.gray),
    filterMode: bg.filterMode,
    filterColor: bg.filterColor,
    filterColorText: bg.filterColor,
    filterGrad1: bg.filterGrad1,
    filterGrad1Text: bg.filterGrad1,
    filterGrad2: bg.filterGrad2,
    filterGrad2Text: bg.filterGrad2,
    filterGrad3: bg.filterGrad3,
    filterGrad3Text: bg.filterGrad3,
    filterAngle: Math.round(bg.filterAngle),
    filterOpacity: Math.round(bg.filterOpacity),
  };
  Object.entries(values).forEach(([name, value]) => {
    const el = card.querySelector(`[data-slide-bg="${name}"]`);
    if (el) el.value = String(value);
  });
  const section = card.closest?.(`#${SEC_ID}`) || document.getElementById(SEC_ID);
  updateSlideBgLabels(section);
}

function applySlideVisualToElement(el, slide) {
  if (!el || !slide?.src) return;
  const normalized = normalizeSlide(slide);
  const bg = buildSlideBackgroundImage(normalized);
  const bgSize = getSlideBgSize(normalized);
  const bgPosition = getSlideBgPosition(normalized);
  const opacity = String(getSlideLayerOpacity(normalized));
  const baseFilter = getSlideBaseFilter(normalized);
  let stage = el.querySelector?.(':scope > .st-fx-bg-stage');
  let layer = stage?.querySelector?.(':scope > .st-fx-bg-layer.is-current') || stage?.querySelector?.(':scope > .st-fx-bg-layer');
  if (layer) {
    layer.style.transition = 'none';
    layer.style.backgroundImage = bg;
    layer.style.backgroundSize = bgSize;
    layer.style.backgroundPosition = bgPosition;
    layer.style.backgroundRepeat = 'no-repeat';
    layer.style.opacity = opacity;
    layer.style.filter = baseFilter;
    layer.style.transform = 'translate3d(0,0,0) scale(1)';
  } else {
    el.style.backgroundImage = bg;
  }
  el.style.backgroundSize = bgSize;
  el.style.backgroundPosition = bgPosition;
  el.style.backgroundRepeat = 'no-repeat';
}

function previewSlideBgForCard(section, getSelection, card, mode = 'draft') {
  if (!section || !card) return;
  const index = Number(card.dataset.slideIndex);
  if (!Number.isFinite(index) || index < 0) return;
  const targets = collectFxTargets(getSelection);
  const draftSlides = getUiDraftSlides(section);
  targets.forEach(el => {
    const appliedCfg = readConfig(el);
    const appliedSlide = appliedCfg.slides?.[index] ? normalizeSlide(appliedCfg.slides[index]) : null;
    const draftSlide = draftSlides[index] ? normalizeSlide(draftSlides[index]) : appliedSlide;
    const slide = mode === 'applied' ? appliedSlide : draftSlide;
    if (!slide?.src) return;
    applySlideVisualToElement(el, slide);
  });
}

function resetSlideBgToApplied(section, getSelection, card) {
  const { slide } = getAppliedSlideForCard(section, getSelection, card);
  writeSlideBgToCard(card, slide.bg || slide);
  previewSlideBgForCard(section, getSelection, card, 'applied');
}

function renderSlideAdvancedSettings(slide, index) {
  const bg = getSlideBg(slide);
  const customSizeHidden = bg.fit === 'custom' ? '' : ' hidden';
  const customPosHidden = bg.position === 'custom' ? '' : ' hidden';
  const colorHidden = bg.filterMode === 'color' ? '' : ' hidden';
  const gradientHidden = bg.filterMode === 'gradient' ? '' : ' hidden';
  return `
          <details class="stfx-slide-advanced" data-slide-advanced="${index}">
            <summary>Додаткові налаштування фону слайда</summary>
            <div class="stfx-slide-bg-panel">
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title-row">
                  <div class="stfx-slide-bg-title">Розмір і позиція картинки</div>
                  <div class="stfx-bg-title-actions">
                    <button class="stfx-bg-star" type="button" data-slide-bg-live-toggle="${index}" data-live-state="default" aria-pressed="true" data-stfx-help-delay="1000" data-stfx-help-title="ЖИВИЙ ПЕРЕГЛЯД ФОНУ СЛАЙДА" data-stfx-help="Жовта зірка означає, що зміни розміру, позиції, прозорості та фільтрів цього слайда одразу видно у редагованому слайді. Натисніть зірку — вона стане сірою, і на полотні буде показаний останній застосований стан без чернеткових змін. Натисніть ще раз — зірка стане зеленою, і живий перегляд знову ввімкнеться.">★</button>
                    <button class="stfx-bg-cancel" type="button" data-slide-bg-reset="${index}" data-stfx-help-delay="1000" data-stfx-help-title="СКАСУВАТИ ЗМІНИ ФОНУ СЛАЙДА" data-stfx-help="Ця стрілочка скидає розмір, позицію, прозорість і фільтри картинки цього слайда до останнього застосованого стану. Використовуйте її, якщо зміни не підійшли і потрібно повернути збережений варіант.">↶</button>
                  </div>
                </div>
                <div class="stfx-bg-row stfx-bg-row--select">
                  <label>Розмір</label>
                  <select class="stfx-select" data-slide-bg="fit" data-slide-bg-index="${index}">
                    <option value="cover" ${bg.fit === 'cover' ? 'selected' : ''}>Розтягнути за елементом</option>
                    <option value="contain" ${bg.fit === 'contain' ? 'selected' : ''}>Вмістити</option>
                    <option value="auto" ${bg.fit === 'auto' ? 'selected' : ''}>Оригінал</option>
                    <option value="custom" ${bg.fit === 'custom' ? 'selected' : ''}>Довільний</option>
                  </select>
                </div>
                <div class="stfx-slide-bg-group" data-slide-bg-customsize="${index}"${customSizeHidden}>
                  <div class="stfx-bg-row"><label>Масштаб</label><input type="range" min="0" max="200" step="1" data-slide-bg="scale" data-slide-bg-index="${index}" value="${Math.round(bg.scale)}"><span class="stfx-bg-value" data-slide-bg-label="scale">${Math.round(bg.scale)}%</span></div>
                  <div class="stfx-bg-row"><label>Ширина</label><input type="range" min="0" max="200" step="1" data-slide-bg="scaleX" data-slide-bg-index="${index}" value="${Math.round(bg.scaleX)}"><span class="stfx-bg-value" data-slide-bg-label="scaleX">${Math.round(bg.scaleX)}%</span></div>
                  <div class="stfx-bg-row"><label>Висота</label><input type="range" min="0" max="200" step="1" data-slide-bg="scaleY" data-slide-bg-index="${index}" value="${Math.round(bg.scaleY)}"><span class="stfx-bg-value" data-slide-bg-label="scaleY">${Math.round(bg.scaleY)}%</span></div>
                  <div class="stfx-bg-sub">Довільний розмір працює тільки для цього слайда. 100% = стандартний розмір.</div>
                </div>
                <div class="stfx-bg-row stfx-bg-row--select">
                  <label>Позиція</label>
                  <select class="stfx-select" data-slide-bg="position" data-slide-bg-index="${index}">
                    <option value="center center" ${bg.position === 'center center' ? 'selected' : ''}>Центр</option>
                    <option value="top center" ${bg.position === 'top center' ? 'selected' : ''}>Верх</option>
                    <option value="bottom center" ${bg.position === 'bottom center' ? 'selected' : ''}>Низ</option>
                    <option value="center left" ${bg.position === 'center left' ? 'selected' : ''}>Ліво</option>
                    <option value="center right" ${bg.position === 'center right' ? 'selected' : ''}>Право</option>
                    <option value="custom" ${bg.position === 'custom' ? 'selected' : ''}>Довільна</option>
                  </select>
                </div>
                <div class="stfx-slide-bg-group" data-slide-bg-custompos="${index}"${customPosHidden}>
                  <div class="stfx-bg-row"><label>Горизонт</label><input type="range" min="1" max="100" step="1" data-slide-bg="posX" data-slide-bg-index="${index}" value="${Math.round(bg.posX)}"><span class="stfx-bg-value" data-slide-bg-label="posX">${Math.round(bg.posX)}%</span></div>
                  <div class="stfx-bg-row"><label>Вертикаль</label><input type="range" min="1" max="100" step="1" data-slide-bg="posY" data-slide-bg-index="${index}" value="${Math.round(bg.posY)}"><span class="stfx-bg-value" data-slide-bg-label="posY">${Math.round(bg.posY)}%</span></div>
                </div>
              </div>
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title">Прозорість і чорно-білий фон</div>
                <div class="stfx-bg-row"><label>Прозорість картинки</label><input type="range" min="0" max="100" step="1" data-slide-bg="opacity" data-slide-bg-index="${index}" value="${Math.round(bg.opacity)}"><span class="stfx-bg-value" data-slide-bg-label="opacity">${Math.round(bg.opacity)}%</span></div>
                <div class="stfx-bg-sub">Прозорість картинки робить прозорим саме фонове зображення слайда, щоб під ним було видно фон, який знаходиться нижче.</div>
                <div class="stfx-bg-row"><label>Ч/Б фон</label><input type="range" min="0" max="100" step="1" data-slide-bg="gray" data-slide-bg-index="${index}" value="${Math.round(bg.gray)}"><span class="stfx-bg-value" data-slide-bg-label="gray">${Math.round(bg.gray)}%</span></div>
              </div>
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title">Фільтр поверх картинки</div>
                <div class="stfx-bg-row stfx-bg-row--select"><label>Фільтр</label><select class="stfx-select" data-slide-bg="filterMode" data-slide-bg-index="${index}">
                  <option value="off" ${bg.filterMode === 'off' ? 'selected' : ''}>Вимкнено</option>
                  <option value="color" ${bg.filterMode === 'color' ? 'selected' : ''}>Колір</option>
                  <option value="gradient" ${bg.filterMode === 'gradient' ? 'selected' : ''}>Градієнт</option>
                </select></div>
                <div class="stfx-slide-bg-group" data-slide-bg-filter-color="${index}"${colorHidden}>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір</label><input type="color" data-slide-bg="filterColor" data-slide-bg-index="${index}" value="${esc(bg.filterColor)}"><input class="stfx-input" data-slide-bg="filterColorText" data-slide-bg-index="${index}" value="${esc(bg.filterColor)}"></div>
                </div>
                <div class="stfx-slide-bg-group" data-slide-bg-filter-gradient="${index}"${gradientHidden}>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір 1</label><input type="color" data-slide-bg="filterGrad1" data-slide-bg-index="${index}" value="${esc(bg.filterGrad1)}"><input class="stfx-input" data-slide-bg="filterGrad1Text" data-slide-bg-index="${index}" value="${esc(bg.filterGrad1)}"></div>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір 2</label><input type="color" data-slide-bg="filterGrad2" data-slide-bg-index="${index}" value="${esc(bg.filterGrad2)}"><input class="stfx-input" data-slide-bg="filterGrad2Text" data-slide-bg-index="${index}" value="${esc(bg.filterGrad2)}"></div>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір 3</label><input type="color" data-slide-bg="filterGrad3" data-slide-bg-index="${index}" value="${esc(bg.filterGrad3)}"><input class="stfx-input" data-slide-bg="filterGrad3Text" data-slide-bg-index="${index}" value="${esc(bg.filterGrad3)}"></div>
                  <div class="stfx-bg-row"><label>Кут</label><input type="range" min="0" max="360" step="1" data-slide-bg="filterAngle" data-slide-bg-index="${index}" value="${Math.round(bg.filterAngle)}"><span class="stfx-bg-value" data-slide-bg-label="filterAngle">${Math.round(bg.filterAngle)}°</span></div>
                </div>
                <div class="stfx-bg-row"><label>Прозорість</label><input type="range" min="0" max="100" step="1" data-slide-bg="filterOpacity" data-slide-bg-index="${index}" value="${Math.round(bg.filterOpacity)}"><span class="stfx-bg-value" data-slide-bg-label="filterOpacity">${Math.round(bg.filterOpacity)}%</span></div>
              </div>
            </div>
          </details>`;
}

function renderSlides(listEl, cfg, selectedIndexes = [], activeIndex = -1) {
  if (!listEl) return;
  const selected = new Set((Array.isArray(selectedIndexes) ? selectedIndexes : []).map(Number));
  const rawSlides = Array.isArray(cfg?.slides) ? cfg.slides : [];
  const slides = rawSlides.length ? rawSlides.map(normalizeSlide) : [{ src: '', link: '', alt: '', paused: false }];
  const widgetSection = listEl.closest?.(`#${SEC_ID}`) || document.getElementById(SEC_ID);
  const manualPaused = widgetSection?.dataset?.stfxSliderManualPaused === '1';
  listEl.innerHTML = slides.map((sl, i) => {
    const hasImage = !!String(sl.src || '').trim();
    const checked = selected.has(i);
    const active = i === Number(activeIndex);
    return `
    <div class="stfx-slide${checked ? ' is-selected' : ''}${active ? ' is-active' : ''}" data-slide-index="${i}" data-slide-paused="0" data-slide-interval="${Number(sl.interval) || ''}" data-slide-duration="${Number(sl.duration) || ''}" data-slide-animation="${esc(sl.animation || '')}" data-slide-overlay="${sl.overlay !== undefined && sl.overlay !== null ? Number(sl.overlay) : ''}">
      <div class="stfx-slide-meta">
        <button class="stfx-slide-grip" type="button" draggable="true" data-slide-drag-handle="${i}" title="Перетягни слайд вгору або вниз">↕</button>
        <div class="stfx-slide-num">${i + 1}</div>
        <button class="stfx-slide-select" type="button" data-toggle-slide-select="${i}" aria-pressed="${checked ? 'true' : 'false'}" title="Вибрати цей слайд для групового застосування"></button>
      </div>
      <div class="stfx-slide-thumb${hasImage ? ' has-image' : ''}" data-slide-thumb="${i}"${slideThumbStyle(sl.src)}>${hasImage ? '' : 'IMG'}</div>
      <div class="stfx-slide-actions">
        <button class="stfx-btn stfx-btn--green stfx-btn--icon" type="button" data-pick-slide="${i}" title="Вибрати картинку з галереї">📁</button>
        <button class="stfx-btn stfx-btn--danger stfx-btn--icon" type="button" data-remove-slide="${i}" title="Видалити">×</button>
        <button class="stfx-btn stfx-btn--ghost stfx-btn--icon stfx-btn--extra" type="button" data-toggle-slide-extra="${i}" title="Додатково: шлях і посилання">▼</button>
        <button class="stfx-btn stfx-btn--icon ${manualPaused ? 'stfx-btn--pause' : 'stfx-btn--play'}" type="button" data-toggle-slide-paused="${i}" aria-pressed="${manualPaused ? 'true' : 'false'}" title="${manualPaused ? 'Показ на паузі — натисни, щоб продовжити з цього слайда' : 'Показ працює — натисни, щоб поставити слайдер на паузу для редагування'}">${manualPaused ? 'Ⅱ' : '▶'}</button>
        ${renderSlideIndicators(cfg, i)}
      </div>
      <div class="stfx-slide-extra" data-slide-extra="${i}">
        <div class="stfx-slide-fields">
          <input class="stfx-input" data-slide-src="${i}" placeholder="Шлях або URL картинки" value="${esc(sl.src)}">
          <input class="stfx-input" data-slide-link="${i}" placeholder="Посилання для цього слайда" value="${esc(sl.link)}">
          ${renderSlideAdvancedSettings(sl, i)}
        </div>
      </div>
    </div>
  `;
  }).join('');
  updateSlideBgLabels(listEl.closest?.(`#${SEC_ID}`) || document.getElementById(SEC_ID));
}

function showBigNotice(text) {
  let box = document.getElementById('stfx-big-notice');
  if (!box) {
    box = document.createElement('div');
    box.id = 'stfx-big-notice';
    box.className = 'stfx-notice';
    document.body.appendChild(box);
  }
  box.textContent = String(text || '');
  window.clearTimeout(showBigNotice._timer);
  showBigNotice._timer = window.setTimeout(() => box.remove(), 3600);
}

function setSettingState(section, name, state) {
  section?.querySelectorAll?.(`[data-setting-state="${name}"]`)?.forEach(btn => {
    btn.dataset.state = state || 'idle';
  });
  const cancel = section?.querySelector?.(`[data-cancel-setting="${name}"]`);
  if (cancel) cancel.dataset.state = state === 'dirty' ? 'warn' : 'idle';
}

function snapshotSetting(section, name) {
  const cfg = section._stfxAppliedUi || {};
  const global = section.querySelector(`[data-global-${name}]`)?.checked !== false;
  let value = '';
  if (name === 'interval') value = section.querySelector('[data-interval]')?.value || '4';
  if (name === 'duration') value = section.querySelector('[data-duration]')?.value || '5';
  if (name === 'animation') value = section.querySelector('[data-animation]')?.value || 'fade';
  if (name === 'overlay') value = section.querySelector('[data-overlay]')?.value || '0';
  cfg[name] = { global, value };
  section._stfxAppliedUi = cfg;
  setSettingState(section, name, 'ok');
}

function restoreSetting(section, name) {
  const item = section._stfxAppliedUi?.[name];
  if (!item) return;
  const globalInput = section.querySelector(`[data-global-${name}]`);
  if (globalInput) globalInput.checked = item.global !== false;
  if (name === 'interval') section.querySelector('[data-interval]').value = item.value || '4';
  if (name === 'duration') {
    const input = section.querySelector('[data-duration]');
    if (input) input.value = item.value || '5';
    const out = section.querySelector('[data-duration-out]');
    if (out) out.textContent = `${input?.value || item.value || 5} c`;
  }
  if (name === 'animation') section.querySelector('[data-animation]').value = item.value || 'fade';
  if (name === 'overlay') {
    const input = section.querySelector('[data-overlay]');
    if (input) input.value = item.value || '0';
    const out = section.querySelector('[data-overlay-out]');
    if (out) out.textContent = `${input?.value || item.value || 0}%`;
  }
  setSettingState(section, name, 'ok');
}

function attachHoverHelp(root) {
  let timer = 0;
  let tip = document.getElementById('stfx-control-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'stfx-control-tooltip';
    tip.className = 'stfx-tooltip';
    document.body.appendChild(tip);
  }
  const show = (target) => {
    const raw = target?.getAttribute?.('data-stfx-help');
    if (!raw) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const title = target.getAttribute('data-stfx-help-title') || 'ПІДКАЗКА';
      const circle = target.getAttribute('data-stfx-help-circle');
      const circleHtml = circle !== null ? `<div class="stfx-tooltip__circle">${esc(circle)}</div>` : '';
      tip.innerHTML = `<b>${esc(title)}</b>${circleHtml}<div>${esc(raw)}</div>`;
      const r = target.getBoundingClientRect();
      const m = 14;
      tip.style.left = `${Math.max(m, Math.min(window.innerWidth - 460, r.left))}px`;
      tip.style.top = `${Math.min(window.innerHeight - 220, r.bottom + 10)}px`;
      tip.classList.add('is-visible');
    }, Math.max(250, Number(target.getAttribute('data-stfx-help-delay')) || 3000));
  };
  const hide = () => { window.clearTimeout(timer); tip.classList.remove('is-visible'); };
  root.addEventListener('mouseover', (ev) => {
    const target = ev.target?.closest?.('[data-stfx-help]');
    if (target && root.contains(target)) show(target);
  });
  root.addEventListener('mouseout', (ev) => {
    if (ev.target?.closest?.('[data-stfx-help]')) hide();
  });
}

function ensureTooltip(header) {
  let tip = document.getElementById('stfx-header-tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'stfx-header-tooltip';
    tip.className = 'stfx-tooltip';
    tip.innerHTML = `<b>СПЕЦЕФЕКТИ</b>Тут налаштовується фоновий слайдер для активної секції, контейнера або блока: кілька картинок, час зміни, тип анімації, крапки/стрілки, pause on hover, затемнення, посилання для кожного слайда та привʼязка окремих блоків до конкретного слайда.`;
    document.body.appendChild(tip);
  }
  let timer = 0;
  const position = () => {
    const r = header.getBoundingClientRect();
    const m = 14;
    tip.style.left = `${Math.max(m, Math.min(window.innerWidth - 460, r.left))}px`;
    tip.style.top = `${Math.min(window.innerHeight - 220, r.bottom + 10)}px`;
  };
  const show = () => { clearTimeout(timer); timer = window.setTimeout(() => { position(); tip.classList.add('is-visible'); }, 3000); };
  const hide = () => { clearTimeout(timer); tip.classList.remove('is-visible'); };
  header.addEventListener('mouseenter', show);
  header.addEventListener('mouseleave', hide);
  header.addEventListener('focus', show);
  header.addEventListener('blur', hide);
}


function previewOverlay(section, getSelection, value) {
  const overlay = Math.max(0, Math.min(90, Number(value) || 0));
  collectFxTargets(getSelection).forEach(el => {
    try { el.style.setProperty('--st-fx-overlay', String(overlay / 100)); } catch (_) {}
  });
}


function parseCssUrl(value) {
  const raw = String(value || '').trim();
  const m = raw.match(/url\((['"]?)(.*?)\1\)/i);
  return m ? m[2] : '';
}

function getBlockBgUrl(block) {
  if (!block) return '';
  const stored = safeJsonParse(block.getAttribute?.(CAROUSEL_ITEM_BG_ATTR), null);
  if (stored?.src) return String(stored.src || '').trim();
  const attrSrc = String(block.getAttribute?.('data-st-carousel-item-bg-src') || '').trim();
  if (attrSrc) return attrSrc;
  const direct = parseCssUrl(block.style?.backgroundImage || '');
  if (direct) return direct;
  const cssVar = String(block.style?.getPropertyValue?.('--st-carousel-item-bg-image') || '').trim();
  const cssVarUrl = parseCssUrl(cssVar);
  if (cssVarUrl) return cssVarUrl;
  try { return parseCssUrl(getComputedStyle(block).backgroundImage || ''); } catch (_) { return ''; }
}

function readCarouselItemBgStored(block) {
  return safeJsonParse(block?.getAttribute?.(CAROUSEL_ITEM_BG_ATTR), null) || null;
}

function readCarouselItemBgApplied(block) {
  return safeJsonParse(block?.getAttribute?.(CAROUSEL_ITEM_BG_APPLIED_ATTR), null) || null;
}

function carouselItemBgStateFromBlock(block) {
  const stored = readCarouselItemBgStored(block);
  const src = String(stored?.src || getBlockBgUrl(block) || '').trim();
  return normalizeSlide({ src, bg: normalizeSlideBg(stored?.bg || stored || {
    fit: shortBgSizeLabel(String(block?.style?.backgroundSize || '')),
    position: String(block?.style?.backgroundPosition || '') || 'center center'
  }) });
}

function compactCarouselItemBgState(state = {}) {
  const normalized = normalizeSlide(state || {});
  const out = { src: String(normalized.src || '').trim() };
  const bg = compactSlideBg(normalized.bg || normalized);
  if (Object.keys(bg).length) out.bg = bg;
  return out;
}

function applyCarouselItemBgVisual(block, state = {}) {
  if (!block || block.nodeType !== 1) return false;
  const normalized = normalizeSlide(state || {});
  const src = String(normalized.src || '').trim();
  if (!src) {
    const hadManagedBg = block.hasAttribute(CAROUSEL_ITEM_BG_LAYER_ATTR) || block.hasAttribute(CAROUSEL_ITEM_BG_ATTR) || block.hasAttribute('data-st-carousel-item-bg-src');
    block.removeAttribute(CAROUSEL_ITEM_BG_LAYER_ATTR);
    block.removeAttribute('data-st-carousel-item-bg-src');
    block.style.removeProperty('--st-carousel-item-bg-image');
    block.style.removeProperty('--st-carousel-item-bg-size');
    block.style.removeProperty('--st-carousel-item-bg-position');
    block.style.removeProperty('--st-carousel-item-bg-opacity');
    block.style.removeProperty('--st-carousel-item-bg-filter');
    if (hadManagedBg) block.style.removeProperty('background-image');
    return true;
  }
  const bgImage = buildSlideBackgroundImage(normalized);
  block.setAttribute(CAROUSEL_ITEM_BG_LAYER_ATTR, '1');
  block.setAttribute('data-st-carousel-item-bg-src', src);
  block.style.setProperty('--st-carousel-item-bg-image', bgImage);
  block.style.setProperty('--st-carousel-item-bg-size', getSlideBgSize(normalized));
  block.style.setProperty('--st-carousel-item-bg-position', getSlideBgPosition(normalized));
  block.style.setProperty('--st-carousel-item-bg-opacity', String(getSlideLayerOpacity(normalized)));
  block.style.setProperty('--st-carousel-item-bg-filter', getSlideBaseFilter(normalized));
  block.style.backgroundImage = 'none';
  block.style.backgroundRepeat = 'no-repeat';
  return true;
}

function writeCarouselItemBgState(block, state = {}, { pending = true, applied = false, visual = true } = {}) {
  if (!block || block.nodeType !== 1) return false;
  const compact = compactCarouselItemBgState(state || {});
  if (compact.src) block.setAttribute(CAROUSEL_ITEM_BG_ATTR, JSON.stringify(compact));
  else block.removeAttribute(CAROUSEL_ITEM_BG_ATTR);
  if (visual) applyCarouselItemBgVisual(block, compact);
  if (applied) {
    if (compact.src) block.setAttribute(CAROUSEL_ITEM_BG_APPLIED_ATTR, JSON.stringify(compact));
    else block.removeAttribute(CAROUSEL_ITEM_BG_APPLIED_ATTR);
  }
  if (pending) markCarouselItemPending(block, true);
  return true;
}

function ensureCarouselItemBgAppliedSnapshot(block) {
  if (!block || block.hasAttribute?.(CAROUSEL_ITEM_BG_APPLIED_ATTR)) return;
  const state = compactCarouselItemBgState(carouselItemBgStateFromBlock(block));
  if (state.src) block.setAttribute(CAROUSEL_ITEM_BG_APPLIED_ATTR, JSON.stringify(state));
}

function saveCarouselItemBgAppliedSnapshot(block) {
  if (!block || block.nodeType !== 1) return;
  const state = compactCarouselItemBgState(carouselItemBgStateFromBlock(block));
  if (state.src) block.setAttribute(CAROUSEL_ITEM_BG_APPLIED_ATTR, JSON.stringify(state));
  else block.removeAttribute(CAROUSEL_ITEM_BG_APPLIED_ATTR);
}

function getCarouselItemBgAppliedState(block) {
  return normalizeSlide(readCarouselItemBgApplied(block) || carouselItemBgStateFromBlock(block));
}

function getBlockTitle(block, index = 0) {
  const data = block?.dataset || {};
  const label = data.title || data.name || block?.getAttribute?.('aria-label') || '';
  if (label) return label;
  const text = String(block?.innerText || '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 42) : `Блок ${Number(index) + 1}`;
}

function getBlockBgSize(block) {
  const stored = readCarouselItemBgStored(block);
  if (stored?.src || stored?.bg) return getSlideBgSize(normalizeSlide(stored));
  const cssVar = String(block?.style?.getPropertyValue?.('--st-carousel-item-bg-size') || '').trim();
  if (cssVar) return cssVar;
  return String(block?.style?.backgroundSize || '').trim() || (() => { try { return getComputedStyle(block).backgroundSize || 'cover'; } catch (_) { return 'cover'; } })();
}

function getBlockBgPosition(block) {
  const stored = readCarouselItemBgStored(block);
  if (stored?.src || stored?.bg) return getSlideBgPosition(normalizeSlide(stored));
  const cssVar = String(block?.style?.getPropertyValue?.('--st-carousel-item-bg-position') || '').trim();
  if (cssVar) return cssVar;
  return String(block?.style?.backgroundPosition || '').trim() || (() => { try { return getComputedStyle(block).backgroundPosition || 'center center'; } catch (_) { return 'center center'; } })();
}

function shortBgSizeLabel(value) {
  const v = String(value || '').toLowerCase();
  if (v.includes('contain')) return 'contain';
  if (v.includes('auto')) return 'auto';
  if (v.includes('cover')) return 'cover';
  return 'custom';
}

function shortBgPositionLabel(value) {
  const v = String(value || '').toLowerCase();
  if (v.includes('left')) return 'L';
  if (v.includes('right')) return 'R';
  if (v.includes('top')) return 'T';
  if (v.includes('bottom')) return 'B';
  return 'C';
}

function carouselItemIndicators(block, index) {
  const paused = isCarouselItemPaused(block);
  const bg = getBlockBgUrl(block);
  const size = shortBgSizeLabel(getBlockBgSize(block));
  const pos = shortBgPositionLabel(getBlockBgPosition(block));
  const link = String(block?.getAttribute?.('data-st-carousel-item-link') || '').trim();
  return `
        <div class="stfx-slide-indicators" data-carousel-item-indicators="${index}">
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="interval" data-stfx-help-delay="1000" data-stfx-help-circle="${paused ? 'Ⅱ' : '▶'}" data-stfx-help-title="СТАН БЛОКА" data-stfx-help="${paused ? 'Цей блок тимчасово вимкнений у каруселі.' : 'Цей блок бере участь у каруселі.'}">${paused ? 'Ⅱ' : '▶'}</button>
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="duration" data-focus-carousel-block-bg="${index}" data-stfx-help-delay="1000" data-stfx-help-circle="${bg ? 'IMG' : '—'}" data-stfx-help-title="КАРТИНКА БЛОКА" data-stfx-help="${bg ? 'У цьому блоці є фонова картинка. Натисніть кружечок, щоб відкрити додаткові налаштування блока.' : 'У цьому блоці ще немає фонової картинки. Натисніть папку, щоб вибрати її з галереї.'}">${bg ? 'IMG' : '—'}</button>
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="animation" data-focus-carousel-block-bg="${index}" data-stfx-help-delay="1000" data-stfx-help-circle="${esc(pos)}" data-stfx-help-title="ПОЗИЦІЯ КАРТИНКИ" data-stfx-help="Поточна позиція фонової картинки цього блока: ${esc(getBlockBgPosition(block))}. Натисніть, щоб відкрити додаткові налаштування.">${esc(pos)}</button>
          <button class="stfx-slide-indicator" type="button" data-indicator-kind="overlay" data-focus-carousel-block-bg="${index}" data-stfx-help-delay="1000" data-stfx-help-circle="${esc(size)}" data-stfx-help-title="РОЗМІР КАРТИНКИ" data-stfx-help="Поточний розмір картинки блока: ${esc(getBlockBgSize(block))}. Натисніть, щоб відкрити додаткові налаштування.">${esc(size)}</button>
        </div>`;
}


function captureCarouselDesignSnapshot(block) {
  if (!block || block.nodeType !== 1) return null;
  return {
    attrs: Array.from(block.attributes || []).map(attr => ({ name: attr.name, value: attr.value })),
    innerHTML: block.innerHTML,
    scrollLeft: block.scrollLeft || 0,
    scrollTop: block.scrollTop || 0
  };
}

function restoreCarouselDesignSnapshot(block, snapshot) {
  if (!block || block.nodeType !== 1 || !snapshot) return false;
  carouselDesignRestoring = true;
  try {
    const keepUid = block.getAttribute('data-uid') || '';
    Array.from(block.attributes || []).forEach(attr => block.removeAttribute(attr.name));
    (snapshot.attrs || []).forEach(attr => {
      if (attr && attr.name) block.setAttribute(attr.name, attr.value ?? '');
    });
    if (keepUid && !block.getAttribute('data-uid')) block.setAttribute('data-uid', keepUid);
    block.innerHTML = snapshot.innerHTML || '';
    try { block.scrollLeft = snapshot.scrollLeft || 0; block.scrollTop = snapshot.scrollTop || 0; } catch (_) {}
  } finally {
    window.setTimeout(() => { carouselDesignRestoring = false; }, 0);
  }
  return true;
}

function getCarouselDesignSession(block) {
  return block ? carouselDesignSessions.get(block) || null : null;
}

function getCarouselDesignButton(section, index) {
  return section?.querySelector?.(`[data-carousel-item-design="${index}"]`) || null;
}

function runCarouselDesignSilent(fn, releaseDelay = 80) {
  carouselDesignRestoring = true;
  try {
    return typeof fn === 'function' ? fn() : undefined;
  } finally {
    window.setTimeout(() => { carouselDesignRestoring = false; }, Math.max(0, Number(releaseDelay) || 0));
  }
}

function prepareCarouselDesignSnapshot(block, index = 0) {
  if (!block || block.nodeType !== 1) return;
  // Перед знімком гарантуємо службові uid/структуру, щоб рендер дерева після save
  // не створював нові атрибути і не робив кнопку знову червоною.
  ensureCarouselItemEditableStructure(block);
  try { collectCarouselTreeNodes(block, index); } catch (_) {}
}

function updateCarouselDesignControls(section, host, index) {
  const block = getCarouselItemByIndex(host, index);
  const session = getCarouselDesignSession(block);
  const btn = getCarouselDesignButton(section, index);
  const cancel = section?.querySelector?.(`[data-carousel-item-design-cancel="${index}"]`);
  const star = section?.querySelector?.(`[data-carousel-item-design-preview="${index}"]`);
  const dirty = !!session?.dirty;
  const previewOff = !!session?.previewOff;
  if (btn) {
    btn.textContent = dirty ? 'Зберегти налаштування' : 'Налаштувати дизайн';
    btn.classList.add('stfx-btn--design-save');
    btn.classList.toggle('is-dirty', dirty);
    btn.classList.toggle('is-clean', !dirty);
    btn.title = dirty ? 'Є незбережені зміни дизайну цього блока. Натисни, щоб зберегти.' : 'Перейти до редагування дизайну цього блока.';
  }
  if (cancel) {
    cancel.disabled = !session || !dirty;
    cancel.title = dirty ? 'Скасувати незбережені зміни і повернути останній збережений стан' : 'Немає незбережених змін';
  }
  if (star) {
    star.disabled = !session || !dirty;
    star.dataset.previewState = previewOff ? 'off' : 'on';
    star.textContent = previewOff ? '☆' : '★';
    star.title = dirty
      ? (previewOff ? 'Повернути незбережені зміни на екран' : 'Тимчасово показати останній збережений вигляд без редагування')
      : 'Немає незбережених змін для перегляду';
  }
}

function updateAllCarouselDesignControls(section, host) {
  const items = getCarouselAllItems(getCarouselTrack(host));
  items.forEach((_, i) => updateCarouselDesignControls(section, host, i));
}

function markCarouselDesignDirty(block, dirty = true) {
  const session = getCarouselDesignSession(block);
  if (!session || carouselDesignRestoring || session.previewOff) return;
  session.dirty = !!dirty;
  block.toggleAttribute('data-st-carousel-design-dirty', !!dirty);
  if (session.section && session.host) updateCarouselDesignControls(session.section, session.host, session.index);
}

function ensureCarouselDesignSession(section, host, index, block) {
  if (!block) return null;
  let session = carouselDesignSessions.get(block);
  if (!session) {
    session = {
      section,
      host,
      index,
      original: captureCarouselDesignSnapshot(block),
      draft: null,
      dirty: false,
      previewOff: false,
      observer: null
    };
    try {
      session.observer = new MutationObserver((mutations = []) => {
        if (carouselDesignRestoring || session.previewOff) return;
        const onlyEditorSelection = mutations.length && mutations.every(m => {
          if (m.type !== 'attributes') return false;
          const name = String(m.attributeName || '');
          return name === 'class'
            || name === 'tabindex'
            || name === 'data-uid'
            || name === 'draggable'
            || name === 'contenteditable'
            || name === 'spellcheck'
            || name === CAROUSEL_ITEM_DESIGN_ATTR
            || name === 'data-st-carousel-design-dirty'
            || name === 'aria-selected';
        });
        if (onlyEditorSelection) return;
        markCarouselDesignDirty(block, true);
      });
      session.observer.observe(block, { attributes: true, childList: true, subtree: true, characterData: true });
    } catch (_) {}
    carouselDesignSessions.set(block, session);
  } else {
    session.section = section;
    session.host = host;
    session.index = index;
  }
  updateCarouselDesignControls(section, host, index);
  return session;
}

function commitCarouselDesignSession(section, host, index, block, setStatus = null) {
  if (!block || block.nodeType !== 1) return false;
  let session = getCarouselDesignSession(block);
  if (!session) {
    // Fallback: якщо DOM/панель перемалювались і WeakMap-сесія загубилась,
    // все одно зберігаємо поточний стан як застосований.
    session = ensureCarouselDesignSession(section, host, index, block);
  }
  if (!session) return false;

  runCarouselDesignSilent(() => {
    if (session.previewOff && session.draft) {
      restoreCarouselDesignSnapshot(block, session.draft);
      session.previewOff = false;
    }

    prepareCarouselDesignSnapshot(block, index);
    block.setAttribute(CAROUSEL_ITEM_DESIGN_ATTR, '1');
    block.classList.add('is-carousel-design-active');

    // Поточний DOM стає новим "останнім збереженим" станом.
    session.original = captureCarouselDesignSnapshot(block);
    session.draft = null;
    session.dirty = false;
    block.removeAttribute('data-st-carousel-design-dirty');

    // Спочатку синхронізуємо state, потім зберігаємо DOM. Так нові внутрішні
    // блоки/ряди, додані через кнопки шапки, не губляться після оновлення.
    try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}
    try { window.ST_SAVE_ROOT_DOM_HTML?.({ reason: 'block-carousel-item-design-save' }); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: 'block-carousel-item-design-save' } })); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('st:block-carousel:item-design-save', { detail: { host, block, index } })); } catch (_) {}
  }, 140);

  updateCarouselDesignControls(section, host, index);
  setStatus?.(`Дизайн блока каруселі №${index + 1} збережено.`);
  return true;
}

function cancelCarouselDesignSession(section, host, index, block, setStatus = null) {
  const session = getCarouselDesignSession(block);
  if (!session) return false;
  restoreCarouselDesignSnapshot(block, session.original);
  ensureCarouselItemEditableStructure(block);
  block.setAttribute(CAROUSEL_ITEM_DESIGN_ATTR, '1');
  block.classList.add('is-carousel-design-active');
  session.draft = null;
  session.previewOff = false;
  session.dirty = false;
  block.removeAttribute('data-st-carousel-design-dirty');
  try {
    if (window.ST_SELECTION?.setSingle) window.ST_SELECTION.setSingle(block, { type: 'block' });
  } catch (_) {}
  updateCarouselDesignControls(section, host, index);
  setStatus?.(`Зміни дизайну блока каруселі №${index + 1} скасовано.`);
  return true;
}

function toggleCarouselDesignPreview(section, host, index, block, setStatus = null) {
  const session = getCarouselDesignSession(block);
  if (!session || !session.dirty) return false;
  if (!session.previewOff) {
    session.draft = captureCarouselDesignSnapshot(block);
    restoreCarouselDesignSnapshot(block, session.original);
    ensureCarouselItemEditableStructure(block);
    block.setAttribute(CAROUSEL_ITEM_DESIGN_ATTR, '1');
    block.classList.add('is-carousel-design-active');
    session.previewOff = true;
    setStatus?.('Показано останній збережений вигляд без незбережених змін.');
  } else {
    restoreCarouselDesignSnapshot(block, session.draft || session.original);
    ensureCarouselItemEditableStructure(block);
    block.setAttribute(CAROUSEL_ITEM_DESIGN_ATTR, '1');
    block.classList.add('is-carousel-design-active');
    session.previewOff = false;
    setStatus?.('Незбережені зміни знову показано.');
  }
  try {
    if (window.ST_SELECTION?.setSingle) window.ST_SELECTION.setSingle(block, { type: 'block' });
  } catch (_) {}
  updateCarouselDesignControls(section, host, index);
  return true;
}

function getCarouselTreeLabel(el, rootIndex = 0, fallbackIndex = 0) {
  if (!el || el.nodeType !== 1) return `Елемент ${fallbackIndex + 1}`;
  if (el.getAttribute(CAROUSEL_ITEM_DESIGN_ATTR) === '1' || el.getAttribute('data-block-kind') === 'carousel-item') return `Блок каруселі ${rootIndex + 1}`;
  const kind = String(el.getAttribute('data-block-kind') || '').toLowerCase();
  if (el.classList?.contains('st-block--text') || kind === 'text') return 'Текстовий блок';
  if (el.classList?.contains('st-block--article') || kind === 'article') return 'Стаття';
  if (el.classList?.contains('st-row')) return 'Ряд / контейнер';
  if (el.classList?.contains('st-section')) return 'Секція';
  if (el.classList?.contains('st-block')) {
    const hasRow = !!el.querySelector?.(':scope > .st-row');
    if (hasRow || kind === 'container') return `Блок контейнер ${fallbackIndex + 1}`;
    if (kind) return `Блок ${kind}`;
    return `Блок ${fallbackIndex + 1}`;
  }
  const txt = String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24);
  return txt || `Елемент ${fallbackIndex + 1}`;
}


function isCarouselTreeNodeHidden(el) {
  if (!el || el.nodeType !== 1) return false;
  return el.getAttribute('data-st-carousel-tree-hidden') === '1'
    || el.getAttribute('data-st-carousel-item-paused') === '1'
    || el.style.display === 'none'
    || el.hidden === true;
}

function getCarouselTreeToggleMeta(hidden) {
  return hidden ? {
    icon: 'Ⅱ',
    cls: 'stfx-carousel-tree-action--show',
    title: 'ЕЛЕМЕНТ НА ПАУЗІ',
    help: 'Червона пауза означає, що цей елемент зараз прихований у блоці каруселі. Натисніть, щоб знову показати його.'
  } : {
    icon: '▶',
    cls: 'stfx-carousel-tree-action--hide',
    title: 'ЕЛЕМЕНТ ПОКАЗУЄТЬСЯ',
    help: 'Зелений плей означає, що цей елемент зараз показується у блоці каруселі. Натисніть, щоб приховати його без видалення.'
  };
}

function updateCarouselTreeRowVisual(row, hidden) {
  if (!row) return;
  row.classList.toggle('is-tree-paused', !!hidden);
  const name = row.querySelector?.('.stfx-carousel-tree-name');
  if (name) name.classList.toggle('is-tree-paused', !!hidden);
  const btn = row.querySelector?.('[data-carousel-tree-toggle-visibility],[data-carousel-tree-hide]');
  if (!btn) return;
  const meta = getCarouselTreeToggleMeta(!!hidden);
  btn.classList.remove('stfx-carousel-tree-action--hide', 'stfx-carousel-tree-action--show');
  btn.classList.add(meta.cls);
  btn.textContent = meta.icon;
  btn.setAttribute('data-stfx-help-title', meta.title);
  btn.setAttribute('data-stfx-help', meta.help);
  btn.setAttribute('aria-label', meta.title);
}

function isDirectCarouselBlockItem(host, el) {
  const track = getCarouselTrack(host);
  if (!track || !el) return false;
  try { return Array.from(track.querySelectorAll(':scope > .st-block')).includes(el); } catch (_) { return false; }
}

function collectCarouselTreeNodes(root, rootIndex = 0) {
  const rows = [];
  const walk = (el, depth, siblingIndex) => {
    if (!el || el.nodeType !== 1) return;
    if (el.classList?.contains('st-carousel-nav') || el.classList?.contains('st-carousel-arrow')) return;
    const uid = ensureCarouselDesignUid(el, el.classList?.contains('st-row') ? 'r' : 'b');
    rows.push({ el, uid, depth, label: getCarouselTreeLabel(el, rootIndex, siblingIndex), hidden: isCarouselTreeNodeHidden(el) });
    let kids = [];
    try { kids = Array.from(el.querySelectorAll(':scope > .st-row, :scope > .st-block')); } catch (_) { kids = []; }
    if (el.classList?.contains('st-row')) {
      try { kids = Array.from(el.querySelectorAll(':scope > .st-block')); } catch (_) { kids = []; }
    }
    kids.forEach((child, i) => walk(child, depth + 1, i));
  };
  walk(root, 0, rootIndex);
  return rows;
}

function renderCarouselBlockTree(block, index) {
  if (!block) return '<div class="stfx-carousel-tree-empty">Блок не знайдено.</div>';
  ensureCarouselDesignUid(block, 'b');
  const nodes = collectCarouselTreeNodes(block, index);
  if (!nodes.length) return '<div class="stfx-carousel-tree-empty">У цьому блоці поки немає вкладених елементів.</div>';
  return nodes.map((node, i) => {
    const toggleMeta = getCarouselTreeToggleMeta(node.hidden);
    const hideIcon = toggleMeta.icon;
    const hideClass = toggleMeta.cls;
    const hideTitle = toggleMeta.title;
    const hideHelp = toggleMeta.help;
    const deleteHelp = i === 0
      ? 'Червоний хрестик видаляє весь цей блок каруселі. Використовуйте обережно, якщо потрібно прибрати цілий слайд.'
      : 'Червоний хрестик повністю видаляє цей елемент з блока каруселі. Якщо потрібно лише сховати елемент, використовуйте кнопку паузи.';
    return `
    <div class="stfx-carousel-tree-row${node.hidden ? ' is-tree-paused' : ''}" data-carousel-tree-row="${esc(node.uid)}" style="margin-left:${Math.min(42, node.depth * 14)}px">
      <button class="stfx-carousel-tree-name${node.hidden ? ' is-tree-paused' : ''}" type="button" data-carousel-tree-select="${esc(node.uid)}" title="Виділити елемент у блоці">${esc(node.label)}</button>
      <button class="stfx-btn stfx-carousel-tree-small ${hideClass}" type="button" data-carousel-tree-toggle-visibility="${esc(node.uid)}" data-stfx-help-delay="3000" data-stfx-help-title="${hideTitle}" data-stfx-help="${esc(hideHelp)}" aria-label="${hideTitle}">${hideIcon}</button>
      <button class="stfx-btn stfx-carousel-tree-small stfx-carousel-tree-action--delete" type="button" data-carousel-tree-delete="${esc(node.uid)}" data-stfx-help-delay="3000" data-stfx-help-title="ВИДАЛИТИ ЕЛЕМЕНТ" data-stfx-help="${esc(deleteHelp)}" aria-label="ВИДАЛИТИ ЕЛЕМЕНТ">✕</button>
    </div>`;
  }).join('');
}

function findCarouselTreeElement(host, uid) {
  const safe = String(uid || '').trim();
  if (!host || !safe) return null;
  try { return host.querySelector?.(`[data-uid="${CSS.escape(safe)}"]`) || null; } catch (_) {
    return Array.from(host.querySelectorAll?.('[data-uid]') || []).find(el => el.dataset.uid === safe) || null;
  }
}

function findCarouselTreeElementScoped(host, itemBlock, uid) {
  const scoped = findCarouselTreeElement(itemBlock, uid);
  if (scoped) return scoped;
  return findCarouselTreeElement(host, uid);
}

function selectCarouselTreeElement(el) {
  if (!el) return false;
  try {
    const type = el.classList?.contains('st-row') ? 'row' : el.classList?.contains('st-section') ? 'section' : 'block';
    if (window.ST_SELECTION?.setSingle) window.ST_SELECTION.setSingle(el, { type });
    else {
      document.querySelectorAll?.('.st-block.is-selected,.st-block.is-active,.st-section.is-selected,.st-section.is-active,.st-row.is-selected,.st-row.is-active')?.forEach(node => node.classList.remove('is-selected', 'is-active'));
      el.classList.add('is-selected', 'is-active');
      document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { type, elements: [el] } }));
    }
  } catch (_) {}
  try { el.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch (_) {}
  try { el.focus?.({ preventScroll: true }); } catch (_) {}
  return true;
}


function getCarouselOpenExtraIndex(section) {
  const raw = section?._stfxCarouselOpenExtraIndex;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function setCarouselOpenExtraIndex(section, index, open = true) {
  if (!section) return;
  if (open) section._stfxCarouselOpenExtraIndex = Math.max(0, Math.round(Number(index) || 0));
  else section._stfxCarouselOpenExtraIndex = null;
}


function readCarouselBlockBgFromCard(card) {
  const defaults = defaultSlideBg();
  const pick = (name) => card?.querySelector?.(`[data-carousel-block-bg="${name}"]`)?.value;
  const src = String(card?.querySelector?.('[data-carousel-item-bg-src]')?.value || '').trim();
  const colorValue = (name, textName, fallback) => normalizeHexColor(pick(textName) || pick(name), fallback);
  return normalizeSlide({
    src,
    bg: {
      fit: pick('fit') || defaults.fit,
      scale: pick('scale') || defaults.scale,
      scaleX: pick('scaleX') || defaults.scaleX,
      scaleY: pick('scaleY') || defaults.scaleY,
      position: pick('position') || defaults.position,
      posX: pick('posX') || defaults.posX,
      posY: pick('posY') || defaults.posY,
      opacity: pick('opacity') || defaults.opacity,
      gray: pick('gray') || defaults.gray,
      filterMode: pick('filterMode') || defaults.filterMode,
      filterColor: colorValue('filterColor', 'filterColorText', defaults.filterColor),
      filterGrad1: colorValue('filterGrad1', 'filterGrad1Text', defaults.filterGrad1),
      filterGrad2: colorValue('filterGrad2', 'filterGrad2Text', defaults.filterGrad2),
      filterGrad3: colorValue('filterGrad3', 'filterGrad3Text', defaults.filterGrad3),
      filterAngle: pick('filterAngle') || defaults.filterAngle,
      filterOpacity: pick('filterOpacity') || defaults.filterOpacity,
    }
  });
}

function updateCarouselBlockBgPanelState(card) {
  if (!card) return;
  const index = card.dataset.carouselItemIndex;
  const fit = card.querySelector('[data-carousel-block-bg="fit"]')?.value || 'cover';
  const position = card.querySelector('[data-carousel-block-bg="position"]')?.value || 'center center';
  const filterMode = card.querySelector('[data-carousel-block-bg="filterMode"]')?.value || 'off';
  const customSize = card.querySelector(`[data-carousel-block-bg-customsize="${index}"]`);
  const customPos = card.querySelector(`[data-carousel-block-bg-custompos="${index}"]`);
  const color = card.querySelector(`[data-carousel-block-bg-filter-color="${index}"]`);
  const gradient = card.querySelector(`[data-carousel-block-bg-filter-gradient="${index}"]`);
  if (customSize) customSize.hidden = fit !== 'custom';
  if (customPos) customPos.hidden = position !== 'custom';
  if (color) color.hidden = filterMode !== 'color';
  if (gradient) gradient.hidden = filterMode !== 'gradient';
}

function updateCarouselBlockBgLabels(section) {
  section?.querySelectorAll?.('.stfx-carousel-item').forEach(card => {
    card.querySelectorAll('[data-carousel-block-bg]').forEach(input => {
      const name = input.getAttribute('data-carousel-block-bg');
      const label = card.querySelector(`[data-carousel-block-bg-label="${name}"]`);
      if (!label) return;
      const value = input.value || '0';
      label.textContent = name === 'filterAngle' ? `${value}°` : `${value}%`;
    });
    ['filterColor','filterGrad1','filterGrad2','filterGrad3'].forEach(name => {
      const color = card.querySelector(`[data-carousel-block-bg="${name}"]`);
      const text = card.querySelector(`[data-carousel-block-bg="${name}Text"]`);
      if (color && text && document.activeElement === color) text.value = color.value;
      if (color && text && document.activeElement === text) color.value = normalizeHexColor(text.value, color.value || '#000000');
    });
    updateCarouselBlockBgPanelState(card);
  });
}

function setCarouselBlockBgLiveState(btn, state = 'default') {
  if (!btn) return;
  const safe = state === 'off' ? 'off' : state === 'on' ? 'on' : 'default';
  btn.dataset.liveState = safe;
  btn.setAttribute('aria-pressed', safe === 'off' ? 'false' : 'true');
  btn.textContent = '★';
}

function isCarouselBlockBgLive(card) {
  const btn = card?.querySelector?.('[data-carousel-block-bg-live-toggle]');
  return btn?.dataset?.liveState !== 'off';
}

function writeCarouselBlockBgToCard(card, stateRaw) {
  if (!card) return;
  const state = normalizeSlide(stateRaw || {});
  const bg = getSlideBg(state);
  const values = {
    fit: bg.fit,
    scale: Math.round(bg.scale),
    scaleX: Math.round(bg.scaleX),
    scaleY: Math.round(bg.scaleY),
    position: bg.position,
    posX: Math.round(bg.posX),
    posY: Math.round(bg.posY),
    opacity: Math.round(bg.opacity),
    gray: Math.round(bg.gray),
    filterMode: bg.filterMode,
    filterColor: bg.filterColor,
    filterColorText: bg.filterColor,
    filterGrad1: bg.filterGrad1,
    filterGrad1Text: bg.filterGrad1,
    filterGrad2: bg.filterGrad2,
    filterGrad2Text: bg.filterGrad2,
    filterGrad3: bg.filterGrad3,
    filterGrad3Text: bg.filterGrad3,
    filterAngle: Math.round(bg.filterAngle),
    filterOpacity: Math.round(bg.filterOpacity),
  };
  Object.entries(values).forEach(([name, value]) => {
    const el = card.querySelector(`[data-carousel-block-bg="${name}"]`);
    if (el) el.value = String(value);
  });
  updateCarouselBlockBgLabels(card.closest?.(`#${SEC_ID}`) || document.getElementById(SEC_ID));
}

function applyCarouselBlockBgFromCard(section, host, card, { pending = true, forceVisual = null } = {}) {
  if (!section || !host || !card) return false;
  const index = Number(card.dataset.carouselItemIndex);
  const block = getCarouselItemByIndex(host, index);
  if (!block) return false;
  ensureCarouselItemBgAppliedSnapshot(block);
  const state = readCarouselBlockBgFromCard(card);
  writeCarouselItemBgState(block, state, { pending, visual: forceVisual !== false });
  if (forceVisual === false || !isCarouselBlockBgLive(card)) {
    applyCarouselItemBgVisual(block, getCarouselItemBgAppliedState(block));
  }
  const thumb = card.querySelector?.(`[data-carousel-item-thumb="${index}"]`);
  const src = String(state.src || '').trim();
  if (thumb) {
    thumb.style.backgroundImage = src ? `url("${src.replace(/"/g, '%22')}")` : '';
    thumb.classList.toggle('has-image', !!src);
  }
  if (pending) markCarouselItemPending(block, true);
  updateCarouselDirtyState(section, host);
  return true;
}

function resetCarouselBlockBgToApplied(section, host, card) {
  if (!section || !host || !card) return false;
  const index = Number(card.dataset.carouselItemIndex);
  const block = getCarouselItemByIndex(host, index);
  if (!block) return false;
  const applied = getCarouselItemBgAppliedState(block);
  writeCarouselBlockBgToCard(card, applied);
  writeCarouselItemBgState(block, applied, { pending: false, visual: true, applied: false });
  markCarouselItemPending(block, false);
  updateCarouselDirtyState(section, host);
  return true;
}

function renderCarouselBlockBgAdvancedSettings(block, index) {
  const state = carouselItemBgStateFromBlock(block);
  const bg = getSlideBg(state);
  const customSizeHidden = bg.fit === 'custom' ? '' : ' hidden';
  const customPosHidden = bg.position === 'custom' ? '' : ' hidden';
  const colorHidden = bg.filterMode === 'color' ? '' : ' hidden';
  const gradientHidden = bg.filterMode === 'gradient' ? '' : ' hidden';
  return `
          <details class="stfx-slide-advanced">
            <summary><span>Додаткові налаштування фону блока каруселі</span></summary>
            <div class="stfx-slide-bg-panel">
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title-row">
                  <div class="stfx-slide-bg-title">Розмір і позиція картинки блока</div>
                  <div class="stfx-bg-title-actions">
                    <button class="stfx-bg-star" type="button" data-carousel-block-bg-live-toggle="${index}" data-live-state="default" aria-pressed="true" data-stfx-help-delay="1000" data-stfx-help-title="ЖИВИЙ ПЕРЕГЛЯД ФОНУ БЛОКА КАРУСЕЛІ" data-stfx-help="Зірка працює так само, як у фоновому слайдері. Увімкнено — зміни одразу видно на блоці каруселі. Вимкнено — на полотні тимчасово показується останній застосований вигляд без незбережених змін.">★</button>
                    <button class="stfx-bg-cancel" type="button" data-carousel-block-bg-reset="${index}" data-stfx-help-delay="1000" data-stfx-help-title="СКАСУВАТИ ЗМІНИ ФОНУ БЛОКА" data-stfx-help="Повертає розмір, позицію, прозорість, чорно-білий режим і фільтри картинки цього блока каруселі до останнього застосованого стану.">↶</button>
                  </div>
                </div>
                <div class="stfx-bg-row stfx-bg-row--select">
                  <label>Розмір</label>
                  <select class="stfx-select" data-carousel-block-bg="fit" data-carousel-block-bg-index="${index}">
                    <option value="cover" ${bg.fit === 'cover' ? 'selected' : ''}>Розтягнути за блоком</option>
                    <option value="contain" ${bg.fit === 'contain' ? 'selected' : ''}>Вмістити</option>
                    <option value="auto" ${bg.fit === 'auto' ? 'selected' : ''}>Оригінал</option>
                    <option value="custom" ${bg.fit === 'custom' ? 'selected' : ''}>Довільний</option>
                  </select>
                </div>
                <div class="stfx-slide-bg-group" data-carousel-block-bg-customsize="${index}"${customSizeHidden}>
                  <div class="stfx-bg-row"><label>Масштаб</label><input type="range" min="0" max="200" step="1" data-carousel-block-bg="scale" data-carousel-block-bg-index="${index}" value="${Math.round(bg.scale)}"><span class="stfx-bg-value" data-carousel-block-bg-label="scale">${Math.round(bg.scale)}%</span></div>
                  <div class="stfx-bg-row"><label>Ширина</label><input type="range" min="0" max="200" step="1" data-carousel-block-bg="scaleX" data-carousel-block-bg-index="${index}" value="${Math.round(bg.scaleX)}"><span class="stfx-bg-value" data-carousel-block-bg-label="scaleX">${Math.round(bg.scaleX)}%</span></div>
                  <div class="stfx-bg-row"><label>Висота</label><input type="range" min="0" max="200" step="1" data-carousel-block-bg="scaleY" data-carousel-block-bg-index="${index}" value="${Math.round(bg.scaleY)}"><span class="stfx-bg-value" data-carousel-block-bg-label="scaleY">${Math.round(bg.scaleY)}%</span></div>
                  <div class="stfx-bg-sub">Довільний розмір працює тільки для цього блока каруселі. 100% = стандартний розмір.</div>
                </div>
                <div class="stfx-bg-row stfx-bg-row--select">
                  <label>Позиція</label>
                  <select class="stfx-select" data-carousel-block-bg="position" data-carousel-block-bg-index="${index}">
                    <option value="center center" ${bg.position === 'center center' ? 'selected' : ''}>Центр</option>
                    <option value="top center" ${bg.position === 'top center' ? 'selected' : ''}>Верх</option>
                    <option value="bottom center" ${bg.position === 'bottom center' ? 'selected' : ''}>Низ</option>
                    <option value="center left" ${bg.position === 'center left' ? 'selected' : ''}>Ліво</option>
                    <option value="center right" ${bg.position === 'center right' ? 'selected' : ''}>Право</option>
                    <option value="custom" ${bg.position === 'custom' ? 'selected' : ''}>Довільна</option>
                  </select>
                </div>
                <div class="stfx-slide-bg-group" data-carousel-block-bg-custompos="${index}"${customPosHidden}>
                  <div class="stfx-bg-row"><label>Горизонт</label><input type="range" min="1" max="100" step="1" data-carousel-block-bg="posX" data-carousel-block-bg-index="${index}" value="${Math.round(bg.posX)}"><span class="stfx-bg-value" data-carousel-block-bg-label="posX">${Math.round(bg.posX)}%</span></div>
                  <div class="stfx-bg-row"><label>Вертикаль</label><input type="range" min="1" max="100" step="1" data-carousel-block-bg="posY" data-carousel-block-bg-index="${index}" value="${Math.round(bg.posY)}"><span class="stfx-bg-value" data-carousel-block-bg-label="posY">${Math.round(bg.posY)}%</span></div>
                </div>
              </div>
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title">Прозорість і чорно-білий фон</div>
                <div class="stfx-bg-row"><label>Прозорість картинки</label><input type="range" min="0" max="100" step="1" data-carousel-block-bg="opacity" data-carousel-block-bg-index="${index}" value="${Math.round(bg.opacity)}"><span class="stfx-bg-value" data-carousel-block-bg-label="opacity">${Math.round(bg.opacity)}%</span></div>
                <div class="stfx-bg-sub">Прозорість робить прозорим тільки шар картинки блока каруселі. Текст і вкладені блоки залишаються зверху.</div>
                <div class="stfx-bg-row"><label>Ч/Б фон</label><input type="range" min="0" max="100" step="1" data-carousel-block-bg="gray" data-carousel-block-bg-index="${index}" value="${Math.round(bg.gray)}"><span class="stfx-bg-value" data-carousel-block-bg-label="gray">${Math.round(bg.gray)}%</span></div>
              </div>
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title">Фільтр поверх картинки</div>
                <div class="stfx-bg-row stfx-bg-row--select"><label>Фільтр</label><select class="stfx-select" data-carousel-block-bg="filterMode" data-carousel-block-bg-index="${index}">
                  <option value="off" ${bg.filterMode === 'off' ? 'selected' : ''}>Вимкнено</option>
                  <option value="color" ${bg.filterMode === 'color' ? 'selected' : ''}>Колір</option>
                  <option value="gradient" ${bg.filterMode === 'gradient' ? 'selected' : ''}>Градієнт</option>
                </select></div>
                <div class="stfx-slide-bg-group" data-carousel-block-bg-filter-color="${index}"${colorHidden}>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір</label><input type="color" data-carousel-block-bg="filterColor" data-carousel-block-bg-index="${index}" value="${esc(bg.filterColor)}"><input class="stfx-input" data-carousel-block-bg="filterColorText" data-carousel-block-bg-index="${index}" value="${esc(bg.filterColor)}"></div>
                </div>
                <div class="stfx-slide-bg-group" data-carousel-block-bg-filter-gradient="${index}"${gradientHidden}>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір 1</label><input type="color" data-carousel-block-bg="filterGrad1" data-carousel-block-bg-index="${index}" value="${esc(bg.filterGrad1)}"><input class="stfx-input" data-carousel-block-bg="filterGrad1Text" data-carousel-block-bg-index="${index}" value="${esc(bg.filterGrad1)}"></div>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір 2</label><input type="color" data-carousel-block-bg="filterGrad2" data-carousel-block-bg-index="${index}" value="${esc(bg.filterGrad2)}"><input class="stfx-input" data-carousel-block-bg="filterGrad2Text" data-carousel-block-bg-index="${index}" value="${esc(bg.filterGrad2)}"></div>
                  <div class="stfx-bg-row stfx-bg-row--color"><label>Колір 3</label><input type="color" data-carousel-block-bg="filterGrad3" data-carousel-block-bg-index="${index}" value="${esc(bg.filterGrad3)}"><input class="stfx-input" data-carousel-block-bg="filterGrad3Text" data-carousel-block-bg-index="${index}" value="${esc(bg.filterGrad3)}"></div>
                  <div class="stfx-bg-row"><label>Кут</label><input type="range" min="0" max="360" step="1" data-carousel-block-bg="filterAngle" data-carousel-block-bg-index="${index}" value="${Math.round(bg.filterAngle)}"><span class="stfx-bg-value" data-carousel-block-bg-label="filterAngle">${Math.round(bg.filterAngle)}°</span></div>
                </div>
                <div class="stfx-bg-row"><label>Прозорість</label><input type="range" min="0" max="100" step="1" data-carousel-block-bg="filterOpacity" data-carousel-block-bg-index="${index}" value="${Math.round(bg.filterOpacity)}"><span class="stfx-bg-value" data-carousel-block-bg-label="filterOpacity">${Math.round(bg.filterOpacity)}%</span></div>
              </div>
            </div>
          </details>`;
}

function renderCarouselItemList(listEl, host, cfg = defaultCarouselConfig(), activeIndex = 0) {
  if (!listEl) return;
  const enabled = cfg?.enabled === true;
  if (!host) {
    listEl.innerHTML = '<div class="stfx-carousel-item-note">Вибери секцію, контейнер або рівень з дочірніми блоками. Після цього тут зʼявиться список блоків каруселі.</div>';
    return;
  }
  const track = getCarouselTrack(host);
  const items = getCarouselAllItems(track);
  if (!enabled) {
    listEl.innerHTML = '<div class="stfx-carousel-item-note">Карусель знайдена, але ще не активна. Натисни «Застосувати карусель», щоб показати дочірні блоки у вигляді карток.</div>';
    return;
  }
  if (!track || !items.length) {
    listEl.innerHTML = '<div class="stfx-carousel-item-note">У вибраному елементі немає дочірніх блоків. Додай блоки в контейнер або секцію, тоді вони зʼявляться тут.</div>';
    return;
  }
  const active = Math.max(0, Math.min(items.length - 1, Number(activeIndex) || 0));
  const sectionRoot = listEl.closest?.(`#${SEC_ID}`) || listEl.closest?.('.stfx-panel') || listEl.parentElement;
  const openExtraIndex = getCarouselOpenExtraIndex(sectionRoot);
  listEl.innerHTML = items.map((block, i) => {
    const bg = getBlockBgUrl(block);
    const paused = isCarouselItemPaused(block);
    const pending = block.getAttribute(CAROUSEL_ITEM_PENDING_ATTR) === '1';
    const designSession = getCarouselDesignSession(block);
    const designDirty = !!designSession?.dirty;
    const designPreviewOff = !!designSession?.previewOff;
    const link = String(block.getAttribute('data-st-carousel-item-link') || '').trim();
    const title = getBlockTitle(block, i);
    const size = shortBgSizeLabel(getBlockBgSize(block));
    const pos = getBlockBgPosition(block);
    const imageStyle = bg ? ` style="background-image:url('${bg.replace(/'/g, '%27')}')"` : '';
    const isExtraOpen = openExtraIndex === i;
    return `
    <div class="stfx-slide stfx-carousel-item${i === active ? ' is-active' : ''}${paused ? ' is-paused' : ''}${pending ? ' is-unapplied' : ''}${isExtraOpen ? ' is-extra-open' : ''}" data-carousel-item-index="${i}" data-carousel-item-card>
      <div class="stfx-slide-meta">
        <button class="stfx-slide-grip" type="button" draggable="true" data-carousel-item-drag-handle="${i}" title="Перетягни блок вгору або вниз у порядку каруселі">↕</button>
        <div class="stfx-slide-num">${i + 1}</div>
        <button class="stfx-slide-select" type="button" data-toggle-carousel-item-select="${i}" aria-pressed="${paused ? 'false' : 'true'}" title="Показувати або тимчасово вимкнути цей блок"></button>
      </div>
      <div class="stfx-slide-thumb stfx-carousel-item-thumb${bg ? ' has-image' : ''}" data-carousel-item-thumb="${i}"${imageStyle}>${bg ? '' : 'BLOCK'}<span class="stfx-carousel-item-thumb__label">${esc(title)}</span></div>
      <div class="stfx-slide-actions">
        <button class="stfx-btn stfx-btn--green stfx-btn--icon" type="button" data-pick-carousel-item="${i}" title="Вибрати картинку блока з галереї">📁</button>
        <button class="stfx-btn stfx-btn--danger stfx-btn--icon" type="button" data-remove-carousel-item="${i}" title="Видалити блок із контейнера">×</button>
        <button class="stfx-btn stfx-btn--ghost stfx-btn--icon stfx-btn--extra${isExtraOpen ? ' is-open' : ''}" type="button" data-toggle-carousel-item-extra="${i}" title="Додаткові налаштування блока">${isExtraOpen ? '▲' : '▼'}</button>
        <button class="stfx-btn stfx-btn--icon ${paused ? 'stfx-btn--pause' : 'stfx-btn--play'}" type="button" data-toggle-carousel-item-paused="${i}" title="${paused ? 'Блок вимкнений — натисни, щоб увімкнути' : 'Блок активний — натисни, щоб поставити на паузу'}">${paused ? 'Ⅱ' : '▶'}</button>
        ${carouselItemIndicators(block, i)}
      </div>
      <div class="stfx-carousel-item-extra" data-carousel-item-extra="${i}">
        <div class="stfx-slide-fields">
          <input class="stfx-input" data-carousel-item-bg-src="${i}" placeholder="Шлях або URL картинки блока" value="${esc(bg)}">
          <input class="stfx-input" data-carousel-item-link="${i}" placeholder="Посилання для цього блока" value="${esc(link)}">
          <details class="stfx-slide-advanced" open>
            <summary><span>Дизайн блока</span></summary>
            <div class="stfx-slide-bg-panel">
              <div class="stfx-slide-bg-group">
                <div class="stfx-slide-bg-title-row">
                  <div class="stfx-slide-bg-title">Редагування внутрішнього дизайну</div>
                </div>
                <div class="stfx-design-actions">
                  <button class="stfx-btn stfx-btn--green stfx-btn--design-save ${designDirty ? 'is-dirty' : 'is-clean'}" type="button" data-carousel-item-design="${i}" data-stfx-help-delay="1000" data-stfx-help-title="НАЛАШТУВАТИ ДИЗАЙН БЛОКА" data-stfx-help="Перший клік зупиняє прокрутку каруселі та виділяє цей блок на полотні. Якщо зʼявились незбережені зміни, кнопка стане червоною і збереже налаштування.">${designDirty ? 'Зберегти налаштування' : 'Налаштувати дизайн'}</button>
                  <button class="stfx-btn stfx-btn--ghost stfx-design-icon" type="button" data-carousel-item-design-cancel="${i}" title="Скасувати незбережені зміни" ${designDirty ? '' : 'disabled'}>↶</button>
                  <button class="stfx-btn stfx-design-icon stfx-design-star" type="button" data-carousel-item-design-preview="${i}" data-preview-state="${designPreviewOff ? 'off' : 'on'}" title="Показати без незбережених змін" ${designDirty ? '' : 'disabled'}>${designPreviewOff ? '☆' : '★'}</button>
                </div>
                <div class="stfx-carousel-tree" data-carousel-item-tree="${i}">
                  ${renderCarouselBlockTree(block, i)}
                </div>
              </div>
            </div>
          </details>
          ${renderCarouselBlockBgAdvancedSettings(block, i)}
        </div>
      </div>
    </div>`;
  }).join('');
  updateCarouselBlockBgLabels(sectionRoot);
}

function getCarouselItemByIndex(host, index) {
  const track = getCarouselTrack(host);
  const items = getCarouselAllItems(track);
  const i = Math.max(0, Math.min(items.length - 1, Number(index) || 0));
  return items[i] || null;
}

function applyCarouselItemDraft(section, host, index) {
  const block = getCarouselItemByIndex(host, index);
  if (!block) return false;
  const card = section?.querySelector?.(`.stfx-carousel-item[data-carousel-item-index="${index}"]`);
  const linkInput = section.querySelector(`[data-carousel-item-link="${index}"]`);
  if (card) applyCarouselBlockBgFromCard(section, host, card, { pending: true });
  else {
    const bgInput = section.querySelector(`[data-carousel-item-bg-src="${index}"]`);
    const src = String(bgInput?.value || '').trim();
    setCarouselItemBackground(block, src, { pending: true });
  }
  const link = String(linkInput?.value || '').trim();
  if (link) block.setAttribute('data-st-carousel-item-link', link);
  else block.removeAttribute('data-st-carousel-item-link');
  markCarouselItemPending(block, true);
  updateCarouselDirtyState(section, host);
  return true;
}

function clearCarouselItemDropMarkers(section, opts = {}) {
  section?.querySelectorAll?.('.stfx-carousel-item.is-drop-before,.stfx-carousel-item.is-drop-after')?.forEach(card => card.classList.remove('is-drop-before', 'is-drop-after'));
  if (!opts.keepDragging) section?.querySelectorAll?.('.stfx-carousel-item.is-dragging')?.forEach(card => card.classList.remove('is-dragging'));
}

function reorderCarouselDomItem(host, from, to) {
  const track = getCarouselTrack(host);
  const items = getCarouselAllItems(track);
  if (!track || from < 0 || from >= items.length) return false;
  const moving = items[from];
  const target = Math.max(0, Math.min(items.length, Number(to) || 0));
  const adjusted = from < target ? target - 1 : target;
  const ref = items[adjusted] || null;
  if (ref === moving) return false;
  track.insertBefore(moving, ref);
  return true;
}

function syncUi(section, getSelection) {
  const selectedTargets = collectTargets(getSelection);
  const selectedFirst = selectedTargets[0] || null;
  const targets = collectFxTargets(getSelection);
  const first = targets[0] || null;
  const cfg = first ? readConfig(first) : defaultFxConfig();
  const host = selectedFirst ? findSliderHost(selectedFirst) : null;
  const boundChild = selectedFirst && host && selectedFirst !== host ? selectedFirst : null;

  section.querySelector('[data-stfx-info]').textContent = selectedFirst
    ? `Активно: ${selectedTargets.length} елемент(и). ${host ? 'Фоновий слайдер' : selectedFirst.classList.contains('st-section') ? 'Секція' : selectedFirst.classList.contains('st-row') ? 'Рівень' : 'Блок'}`
    : 'Вибери секцію, контейнер або блок на полотні.';
  section.querySelector('[data-enabled]').checked = !!cfg.enabled;
  const emptyHints = section.querySelector('[data-empty-hints]');
  if (emptyHints) emptyHints.checked = readEmptyHintsEnabled();
  const globalInterval = section.querySelector('[data-global-interval]');
  if (globalInterval) globalInterval.checked = cfg.globalInterval !== false;
  const globalDuration = section.querySelector('[data-global-duration]');
  if (globalDuration) globalDuration.checked = cfg.globalDuration !== false;
  const globalAnimation = section.querySelector('[data-global-animation]');
  if (globalAnimation) globalAnimation.checked = cfg.globalAnimation !== false;
  const globalOverlay = section.querySelector('[data-global-overlay]');
  if (globalOverlay) globalOverlay.checked = cfg.globalOverlay !== false;
  const overlayPreview = section.querySelector('[data-overlay-live]');
  if (overlayPreview) overlayPreview.checked = cfg.overlayPreview === true;
  section.querySelector('[data-interval]').value = String(Math.round((Number(cfg.interval) || 4000) / 1000));
  const durationSec = Math.max(1, Math.min(20, Math.round((Number(cfg.duration) || 5000) / 1000)));
  const durationInput = section.querySelector('[data-duration]');
  if (durationInput) durationInput.value = String(durationSec);
  const durationOut = section.querySelector('[data-duration-out]');
  if (durationOut) durationOut.textContent = `${durationSec} c`;
  section.querySelector('[data-animation]').value = cfg.animation || 'fade';
  section.querySelector('[data-nav]').value = cfg.nav || 'dots-hover';
  let overlayValue = Number(cfg.overlay) || 0;
  if (cfg.globalOverlay === false) {
    const activeForOverlay = Math.max(0, Math.min(Math.max(0, cfg.slides.length - 1), Number(cfg.current) || 0));
    if (cfg.slides?.[activeForOverlay]?.overlay !== undefined) overlayValue = Number(cfg.slides[activeForOverlay].overlay) || 0;
  }
  section.querySelector('[data-overlay]').value = String(overlayValue);
  section.querySelector('[data-overlay-out]').textContent = `${overlayValue}%`;
  section.querySelector('[data-pause]').checked = cfg.pauseOnHover !== false;
  section.querySelector('[data-loop]').checked = cfg.loop !== false;
  section.querySelector('[data-random]').checked = !!cfg.random;
  setSliderPauseUi00992(section, isSliderManualPaused00992(first));
  renderSlides(section.querySelector('[data-slide-list]'), cfg, getSelectedSlideIndexes(section), Number(cfg.current) || 0);
  updateSlideDirtyState(section, getSelection);
  snapshotSetting(section, 'interval');
  snapshotSetting(section, 'duration');
  snapshotSetting(section, 'animation');
  snapshotSetting(section, 'overlay');

  const bindBox = section.querySelector('[data-bind-box]');
  syncCarouselUi(section, getSelection);

  if (bindBox) {
    bindBox.classList.toggle('stfx-disabled', !host);
    const currentBind = Number(boundChild?.getAttribute?.('data-st-fx-bind-slide') || '1') || 1;
    const inp = section.querySelector('[data-bind-slide]');
    if (inp) inp.value = String(currentBind);
    const txt = section.querySelector('[data-bind-info]');
    if (txt) txt.textContent = host ? 'Вибраний дочірній блок можна показувати тільки на конкретному слайді або завжди.' : 'Щоб привʼязати блок до слайда: виділи блок всередині секції/контейнера зі спецефектом.';
  }
}

function getUiConfig(section, oldCfg = defaultFxConfig()) {
  const slides = getUiDraftSlides(section).map(normalizeSlide).filter(s => s.src);
  return {
    enabled: section.querySelector('[data-enabled]')?.checked || false,
    interval: Math.max(1, Number(section.querySelector('[data-interval]')?.value || 4)) * 1000,
    duration: Math.max(1, Math.min(20, Number(section.querySelector('[data-duration]')?.value || 5))) * 1000,
    animation: section.querySelector('[data-animation]')?.value || 'fade',
    globalInterval: section.querySelector('[data-global-interval]')?.checked !== false,
    globalDuration: section.querySelector('[data-global-duration]')?.checked !== false,
    globalAnimation: section.querySelector('[data-global-animation]')?.checked !== false,
    globalOverlay: section.querySelector('[data-global-overlay]')?.checked !== false,
    overlayPreview: section.querySelector('[data-overlay-live]')?.checked === true,
    nav: section.querySelector('[data-nav]')?.value || 'dots-hover',
    overlay: Number(section.querySelector('[data-overlay]')?.value || 0),
    pauseOnHover: section.querySelector('[data-pause]')?.checked !== false,
    loop: section.querySelector('[data-loop]')?.checked !== false,
    random: section.querySelector('[data-random]')?.checked || false,
    slides,
    current: Math.min(Number(oldCfg.current) || 0, Math.max(0, slides.length - 1)),
  };
}

function applySingleSetting(section, name, getSelection, setStatus) {
  const targets = collectFxTargets(getSelection);
  if (!targets.length) {
    showBigNotice('СПОЧАТКУ ВИБЕРІТЬ СЕКЦІЮ, КОНТЕЙНЕР АБО БЛОК');
    return;
  }
  const globalOn = section.querySelector(`[data-global-${name}]`)?.checked !== false;
  const slideTargets = globalOn ? [] : getTargetSlideIndexes(section);
  if (!globalOn && !slideTargets.length) {
    showBigNotice('ВИДІЛІТЬ БУДЬ ЛАСКА СЛАЙД ДЛЯ ЗАСТОСУВАННЯ ЗМІН');
    return;
  }

  targets.forEach(el => {
    const previousCfg = readConfig(el);
    const uiCfg = getUiConfig(section, previousCfg);

    // ВАЖЛИВО: не копіюємо сюди blindly interval/duration/animation/overlay з UI.
    // Коли режим "для всіх" вимкнений, ці глобальні fallback-значення НЕ повинні мінятися,
    // інакше слайди без власного значення виглядають так, ніби зміна застосувалась до всіх.
    const cfg = Object.assign(defaultFxConfig(), previousCfg);
    cfg.enabled = uiCfg.enabled;
    cfg.nav = uiCfg.nav;
    cfg.pauseOnHover = uiCfg.pauseOnHover;
    cfg.loop = uiCfg.loop;
    cfg.random = uiCfg.random;
    cfg.current = uiCfg.current;
    cfg.slides = getUiDraftSlides(section).map(normalizeSlide).filter(s => s.src);

    if (name === 'interval') {
      const value = Math.max(1, Number(section.querySelector('[data-interval]')?.value || 4)) * 1000;
      cfg.globalInterval = globalOn;
      if (globalOn) cfg.interval = value;
      else slideTargets.forEach(i => { if (cfg.slides[i]) cfg.slides[i].interval = value; });
    }
    if (name === 'duration') {
      const value = Math.max(1, Math.min(20, Number(section.querySelector('[data-duration]')?.value || 5))) * 1000;
      cfg.globalDuration = globalOn;
      if (globalOn) cfg.duration = value;
      else slideTargets.forEach(i => { if (cfg.slides[i]) cfg.slides[i].duration = value; });
    }
    if (name === 'animation') {
      const value = section.querySelector('[data-animation]')?.value || 'fade';
      cfg.globalAnimation = globalOn;
      if (globalOn) cfg.animation = value;
      else slideTargets.forEach(i => { if (cfg.slides[i]) cfg.slides[i].animation = value; });
    }
    if (name === 'overlay') {
      const value = Math.max(0, Math.min(90, Number(section.querySelector('[data-overlay]')?.value || 0)));
      cfg.globalOverlay = globalOn;
      cfg.overlayPreview = section.querySelector('[data-overlay-live]')?.checked === true;
      if (globalOn) cfg.overlay = value;
      else slideTargets.forEach(i => { if (cfg.slides[i]) cfg.slides[i].overlay = value; });
    }
    if (cfg.slides.length) cfg.enabled = true;
    if (cfg.enabled) {
      saveFillBeforeFx(el);
      suspendFillForFx(el);
    }
    writeConfig(el, cfg);
    initBackgroundFx(el);
  });

  // Оновлюємо картки, щоб індивідуальні значення зберігались у UI і не губились при перемиканні глобального режиму.
  const firstCfg = readConfig(targets[0]);
  const selected = getSelectedSlideIndexes(section);
  const active = getActiveSlideIndex(section);
  renderSlides(section.querySelector('[data-slide-list]'), firstCfg, selected, active);
  snapshotSetting(section, name);
  persist(`special-effects-apply-${name}`);
  setStatus?.('Налаштування застосовано');
}

const CAROUSEL_ATTR = 'data-st-block-carousel';
const CAROUSEL_RUNTIME_ATTR = 'data-st-carousel-runtime';
const CAROUSEL_SHELL_ATTR = 'data-st-carousel-shell';
const CAROUSEL_HIDDEN_ATTR = 'data-st-carousel-hidden-by-shell';
const CAROUSEL_OLD_DISPLAY_ATTR = 'data-st-carousel-old-display';
const CAROUSEL_SIZE_MODE_ATTR = 'data-st-carousel-size-mode';
const CAROUSEL_ITEM_PENDING_ATTR = 'data-st-carousel-item-pending';
const CAROUSEL_ITEM_BG_ATTR = 'data-st-carousel-item-bg';
const CAROUSEL_ITEM_BG_APPLIED_ATTR = 'data-st-carousel-item-bg-applied';
const CAROUSEL_ITEM_BG_LAYER_ATTR = 'data-st-carousel-item-bg-layer';
const CAROUSEL_DESIGN_HOST_ATTR = 'data-st-carousel-design-editing';
const CAROUSEL_ITEM_DESIGN_ATTR = 'data-st-carousel-design-active';
const CAROUSEL_SIZE_MIN = 10;
const CAROUSEL_SIZE_MAX_W = 1600;
const CAROUSEL_SIZE_MAX_H = 1200;
const CAROUSEL_SIZE_PRESETS = {
  auto: { label: 'Авто — як зараз', width: 320, height: 220, fixed: false },
  'block-xs': { label: 'Блок XS — 160 × 120', width: 160, height: 120, fixed: true },
  'block-sm': { label: 'Блок S — 220 × 160', width: 220, height: 160, fixed: true },
  'block-md': { label: 'Блок M — 320 × 220', width: 320, height: 220, fixed: true },
  'block-lg': { label: 'Блок L — 460 × 300', width: 460, height: 300, fixed: true },
  'block-xl': { label: 'Блок XL — 640 × 380', width: 640, height: 380, fixed: true },
  'section-sm': { label: 'Секція S — 760 × 320', width: 760, height: 320, fixed: true },
  'section-md': { label: 'Секція M — 960 × 460', width: 960, height: 460, fixed: true },
  'section-lg': { label: 'Секція L — 1200 × 620', width: 1200, height: 620, fixed: true },
  'section-hero': { label: 'Hero — 1440 × 760', width: 1440, height: 760, fixed: true },
  custom: { label: 'Власний розмір', width: 320, height: 220, fixed: true },
};

function defaultCarouselConfig() {
  return {
    enabled: false,
    visibleDesktop: 4,
    visibleTablet: 2,
    visibleMobile: 1,
    axis: 'horizontal',
    direction: 'left',
    stepMode: 'single',
    step: 1,
    interval: 2000,
    duration: 800,
    autoplay: true,
    loop: true,
    pauseOnHover: true,
    nav: 'both-hover',
    drag: true,
    manualPaused: false,
    wheelControl: false,
    itemSizePreset: 'auto',
    itemWidth: 320,
    itemHeight: 220,
    itemSizeLive: false,
    current: 0,
  };
}


function normalizeCarouselSizePreset(value) {
  const key = String(value || 'auto').trim();
  return Object.prototype.hasOwnProperty.call(CAROUSEL_SIZE_PRESETS, key) ? key : 'auto';
}

function resolveCarouselSize(cfg) {
  const key = normalizeCarouselSizePreset(cfg?.itemSizePreset);
  if (key === 'auto') return null;
  if (key === 'custom') {
    return {
      preset: 'custom',
      width: clampNumber(cfg?.itemWidth, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320),
      height: clampNumber(cfg?.itemHeight, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220),
    };
  }
  const preset = CAROUSEL_SIZE_PRESETS[key] || CAROUSEL_SIZE_PRESETS.auto;
  if (!preset.fixed) return null;
  return {
    preset: key,
    width: clampNumber(preset.width, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320),
    height: clampNumber(preset.height, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220),
  };
}

function getCarouselSizeLabel(cfg) {
  const key = normalizeCarouselSizePreset(cfg?.itemSizePreset);
  if (key === 'auto') return 'авто';
  const size = resolveCarouselSize(cfg);
  if (!size) return 'авто';
  return `${size.width}×${size.height}px`;
}

function readCarouselConfig(el) {
  const cfg = Object.assign(defaultCarouselConfig(), safeJsonParse(el?.getAttribute?.(CAROUSEL_ATTR), {}) || {});
  cfg.enabled = cfg.enabled === true;
  cfg.visibleDesktop = clampNumber(cfg.visibleDesktop, 1, 12, 4);
  cfg.visibleTablet = clampNumber(cfg.visibleTablet, 1, 8, 2);
  cfg.visibleMobile = clampNumber(cfg.visibleMobile, 1, 4, 1);
  cfg.axis = cfg.axis === 'vertical' ? 'vertical' : 'horizontal';
  cfg.direction = ['left','right','up','down'].includes(String(cfg.direction)) ? String(cfg.direction) : 'left';
  cfg.stepMode = cfg.stepMode === 'group' ? 'group' : cfg.stepMode === 'marquee' ? 'marquee' : 'single';
  cfg.step = cfg.stepMode === 'group' ? cfg.visibleDesktop : 1;
  cfg.interval = Math.max(500, Math.min(60000, Number(cfg.interval) || 2000));
  cfg.duration = Math.max(100, Math.min(20000, Number(cfg.duration) || 800));
  cfg.autoplay = cfg.autoplay !== false;
  cfg.loop = cfg.loop !== false;
  cfg.pauseOnHover = cfg.pauseOnHover !== false;
  cfg.nav = ['off','dots','dots-hover','arrows','arrows-hover','both','both-hover'].includes(String(cfg.nav)) ? String(cfg.nav) : 'both-hover';
  cfg.drag = cfg.drag !== false;
  cfg.manualPaused = cfg.manualPaused === true;
  cfg.wheelControl = cfg.wheelControl === true;
  cfg.itemSizePreset = normalizeCarouselSizePreset(cfg.itemSizePreset);
  cfg.itemWidth = clampNumber(cfg.itemWidth, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320);
  cfg.itemHeight = clampNumber(cfg.itemHeight, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220);
  cfg.itemSizeLive = cfg.itemSizeLive === true;
  cfg.current = Math.max(0, Number(cfg.current) || 0);
  return cfg;
}

function writeCarouselConfig(el, cfg) {
  if (!el) return;
  const clean = Object.assign(defaultCarouselConfig(), cfg || {});
  clean.visibleDesktop = clampNumber(clean.visibleDesktop, 1, 12, 4);
  clean.visibleTablet = clampNumber(clean.visibleTablet, 1, 8, 2);
  clean.visibleMobile = clampNumber(clean.visibleMobile, 1, 4, 1);
  clean.axis = clean.axis === 'vertical' ? 'vertical' : 'horizontal';
  clean.direction = ['left','right','up','down'].includes(String(clean.direction)) ? String(clean.direction) : 'left';
  clean.stepMode = clean.stepMode === 'group' ? 'group' : clean.stepMode === 'marquee' ? 'marquee' : 'single';
  clean.step = clean.stepMode === 'group' ? clean.visibleDesktop : 1;
  clean.interval = Math.max(500, Math.min(60000, Number(clean.interval) || 2000));
  clean.duration = Math.max(100, Math.min(20000, Number(clean.duration) || 800));
  clean.autoplay = clean.autoplay !== false;
  clean.loop = clean.loop !== false;
  clean.pauseOnHover = clean.pauseOnHover !== false;
  clean.nav = ['off','dots','dots-hover','arrows','arrows-hover','both','both-hover'].includes(String(clean.nav)) ? String(clean.nav) : 'both-hover';
  clean.drag = clean.drag !== false;
  clean.manualPaused = clean.manualPaused === true;
  clean.wheelControl = clean.wheelControl === true;
  clean.itemSizePreset = normalizeCarouselSizePreset(clean.itemSizePreset);
  clean.itemWidth = clampNumber(clean.itemWidth, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320);
  clean.itemHeight = clampNumber(clean.itemHeight, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220);
  clean.itemSizeLive = clean.itemSizeLive === true;
  clean.current = Math.max(0, Number(clean.current) || 0);
  el.setAttribute(CAROUSEL_ATTR, JSON.stringify(clean));
}


function isCarouselShell(el) {
  return !!(el && el.nodeType === 1 && el.getAttribute?.(CAROUSEL_SHELL_ATTR) === '1');
}

function findDirectCarouselShell(host) {
  if (!host || host.nodeType !== 1) return null;
  if (isCarouselShell(host)) return host;
  try { return host.querySelector?.(`:scope > [${CAROUSEL_SHELL_ATTR}="1"]`) || null; } catch (_) { return null; }
}

function resolveCarouselHost(target) {
  if (!target || target.nodeType !== 1) return null;
  const ownShell = isCarouselShell(target) ? target : null;
  if (ownShell) return ownShell;
  const closestShell = target.closest?.(`[${CAROUSEL_SHELL_ATTR}="1"]`);
  if (closestShell) return closestShell;
  const directShell = findDirectCarouselShell(target);
  if (directShell) return directShell;
  // Backward compatibility with older projects where the selected element itself was transformed.
  if (target.hasAttribute?.(CAROUSEL_ATTR)) return target;
  return null;
}

function hideHostChildrenForCarousel(host, shell = null) {
  if (!host || host.nodeType !== 1) return;
  Array.from(host.children || []).forEach(child => {
    if (!child || child === shell) return;
    if (child.getAttribute?.(CAROUSEL_SHELL_ATTR) === '1') return;
    if (child.hasAttribute?.(CAROUSEL_RUNTIME_ATTR)) return;
    if (child.classList?.contains('st-insert-line') || child.classList?.contains('st-sec-insert-line') || child.classList?.contains('st-dnd-placeholder')) return;
    const tag = String(child.tagName || '').toLowerCase();
    if (tag === 'script' || tag === 'style') return;
    if (!child.hasAttribute(CAROUSEL_OLD_DISPLAY_ATTR)) {
      child.setAttribute(CAROUSEL_OLD_DISPLAY_ATTR, child.style.display || '');
    }
    child.setAttribute(CAROUSEL_HIDDEN_ATTR, '1');
    child.style.display = 'none';
  });
}

function restoreHostChildrenAfterCarousel(host) {
  if (!host || host.nodeType !== 1) return;
  try {
    host.querySelectorAll?.(`:scope > [${CAROUSEL_HIDDEN_ATTR}="1"]`)?.forEach(child => {
      const old = child.getAttribute(CAROUSEL_OLD_DISPLAY_ATTR);
      child.removeAttribute(CAROUSEL_HIDDEN_ATTR);
      child.removeAttribute(CAROUSEL_OLD_DISPLAY_ATTR);
      if (old) child.style.display = old;
      else child.style.removeProperty('display');
    });
  } catch (_) {}
}

function makeDefaultCarouselItem(index) {
  const colors = [
    ['#dbeafe','#60a5fa'], ['#dcfce7','#22c55e'], ['#fef9c3','#facc15'],
    ['#fae8ff','#c084fc'], ['#fee2e2','#fb7185'], ['#e0f2fe','#38bdf8']
  ];
  const pair = colors[index % colors.length];
  const n = index + 1;
  const el = document.createElement('div');
  el.className = 'st-block st-block--text';
  el.setAttribute('data-block-kind', 'carousel-item');
  el.setAttribute('data-name', `Картка каруселі ${n}`);
  el.style.cssText = `min-height:190px;padding:18px;border-radius:22px;background:linear-gradient(135deg,${pair[0]},${pair[1]});border:1px solid rgba(15,23,42,.10);box-shadow:0 18px 46px rgba(15,23,42,.12);display:flex;align-items:flex-end;box-sizing:border-box;overflow:hidden;`;
  el.innerHTML = `<div class="st-text-edit" contenteditable="true" spellcheck="false" style="width:100%;"><div style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:rgba(15,23,42,.86);color:#fff;font-weight:1000;margin-bottom:10px;">${n}</div><h3 style="margin:0 0 6px;color:#0f172a;font-size:20px;line-height:1.15;">Блок каруселі ${n}</h3><p style="margin:0;color:#334155;font-size:13px;line-height:1.45;">Замініть текст, фон або картинку цього блока.</p></div>`;
  return el;
}

function buildDefaultCarouselShell(cfg = defaultCarouselConfig()) {
  const shell = document.createElement('div');
  shell.className = 'st-block st-block-carousel-shell';
  shell.setAttribute(CAROUSEL_SHELL_ATTR, '1');
  shell.setAttribute('data-block-kind', 'carousel');
  shell.setAttribute('data-name', 'Карусель блоків');
  shell.setAttribute('draggable', 'true');
  shell.setAttribute('title', 'Перетягни всю карусель в іншу секцію або контейнер');
  shell.style.cssText = 'width:100%;min-height:260px;padding:14px;border-radius:24px;background:transparent;border:0;box-sizing:border-box;overflow:hidden;';
  const track = document.createElement('div');
  track.className = 'st-row st-block-carousel-track';
  track.style.cssText = 'display:flex;gap:16px;width:100%;min-height:220px;';
  for (let i = 0; i < 6; i += 1) track.appendChild(makeDefaultCarouselItem(i));
  shell.appendChild(track);
  const clean = Object.assign(defaultCarouselConfig(), cfg || {}, { enabled: true });
  writeCarouselConfig(shell, clean);
  return shell;
}

function ensureCarouselShellInHost(host, cfg = defaultCarouselConfig()) {
  if (!host || host.nodeType !== 1) return null;
  let shell = isCarouselShell(host) ? host : findDirectCarouselShell(host);
  if (!shell) {
    shell = buildDefaultCarouselShell(cfg);
    host.appendChild(shell);
  }
  if (shell !== host) hideHostChildrenForCarousel(host, shell);
  writeCarouselConfig(shell, Object.assign(defaultCarouselConfig(), readCarouselConfig(shell), cfg || {}, { enabled: true }));
  shell.style.removeProperty('display');
  shell.removeAttribute(CAROUSEL_HIDDEN_ATTR);
  initBlockCarousel(shell);
  return shell;
}

function removeCarouselShellFromHost(host) {
  if (!host || host.nodeType !== 1) return false;
  const shell = findDirectCarouselShell(host) || (isCarouselShell(host) ? host : null);
  if (!shell) {
    if (host.hasAttribute?.(CAROUSEL_ATTR)) {
      cleanupBlockCarousel(host);
      host.removeAttribute(CAROUSEL_ATTR);
      return true;
    }
    return false;
  }
  const parent = shell.parentElement;
  cleanupBlockCarousel(shell);
  shell.remove();
  restoreHostChildrenAfterCarousel(parent || host);
  return true;
}

function getCarouselTrack(el) {
  if (!el || el.nodeType !== 1) return null;
  try {
    const directTrack = el.querySelector?.(':scope > .st-block-carousel-track');
    if (directTrack) return directTrack;
  } catch (_) {}
  if (el.classList?.contains('st-row')) return el;
  try {
    const directRow = el.querySelector?.(':scope > .st-row');
    if (directRow) return directRow;
    const directBlocks = el.querySelectorAll?.(':scope > .st-block') || [];
    if (directBlocks.length) return el;
  } catch (_) {}
  return null;
}

function getCarouselAllItems(track) {
  try { return Array.from(track?.querySelectorAll?.(':scope > .st-block') || []).filter(el => !el.hasAttribute(CAROUSEL_RUNTIME_ATTR)); } catch (_) { return []; }
}

function isCarouselItemPaused(item) {
  return item?.getAttribute?.('data-st-carousel-item-paused') === '1';
}

function getCarouselItems(track) {
  return getCarouselAllItems(track).filter(item => !isCarouselItemPaused(item));
}

function markCarouselItemPending(block, pending = true) {
  if (!block || block.nodeType !== 1) return;
  if (pending) block.setAttribute(CAROUSEL_ITEM_PENDING_ATTR, '1');
  else block.removeAttribute(CAROUSEL_ITEM_PENDING_ATTR);
}

function hasPendingCarouselItems(host) {
  const track = getCarouselTrack(host);
  return getCarouselAllItems(track).some(block => block.getAttribute(CAROUSEL_ITEM_PENDING_ATTR) === '1');
}

function clearPendingCarouselItems(host) {
  const track = getCarouselTrack(host);
  getCarouselAllItems(track).forEach(block => {
    saveCarouselItemBgAppliedSnapshot(block);
    markCarouselItemPending(block, false);
  });
}

function updateCarouselDirtyState(section, host) {
  const applyBtn = section?.querySelector?.('[data-carousel-apply]');
  if (!section || !applyBtn) return false;
  const track = getCarouselTrack(host);
  const items = getCarouselAllItems(track);
  let hasDirty = false;
  section.querySelectorAll?.('.stfx-carousel-item[data-carousel-item-index]')?.forEach(card => {
    const idx = Number(card.dataset.carouselItemIndex);
    const item = Number.isFinite(idx) ? items[idx] : null;
    const dirty = item?.getAttribute?.(CAROUSEL_ITEM_PENDING_ATTR) === '1';
    card.classList.toggle('is-unapplied', !!dirty);
    if (dirty) hasDirty = true;
  });
  if (hasPendingCarouselItems(host)) hasDirty = true;
  applyBtn.classList.add('stfx-btn--apply');
  applyBtn.classList.toggle('is-dirty', hasDirty);
  applyBtn.classList.toggle('is-clean', !hasDirty);
  applyBtn.title = hasDirty
    ? 'Є нові фото або нові блоки каруселі. Натисни, щоб застосувати й зберегти.'
    : 'Карусель застосована.';
  return hasDirty;
}

function markCarouselDirtySoon(section, host) {
  try { window.requestAnimationFrame(() => updateCarouselDirtyState(section, host)); }
  catch (_) { updateCarouselDirtyState(section, host); }
}

function clearBuilderSelectionAndActive({ emit = true } = {}) {
  try {
    if (window.ST_SELECTION && typeof window.ST_SELECTION.clear === 'function') {
      window.ST_SELECTION.clear();
      if (emit && typeof window.ST_SELECTION.emit === 'function') window.ST_SELECTION.emit(null, []);
    } else {
      document.querySelectorAll?.('.st-block.is-selected,.st-block.is-active,.st-section.is-selected,.st-section.is-active,.st-row.is-selected,.st-row.is-active,.hb-dom-selected,.hb-dom-active')
        ?.forEach(el => el.classList.remove('is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active'));
      if (emit) document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: null }));
    }
  } catch (_) {}
}

function clearCarouselDesignFocus(scope = document) {
  try {
    const root = scope || document;
    const hosts = [];
    if (root.nodeType === 1 && root.getAttribute?.(CAROUSEL_DESIGN_HOST_ATTR) === '1') hosts.push(root);
    root.querySelectorAll?.(`[${CAROUSEL_DESIGN_HOST_ATTR}="1"]`).forEach(el => hosts.push(el));
    hosts.forEach(el => el.removeAttribute(CAROUSEL_DESIGN_HOST_ATTR));

    const activeItems = [];
    if (root.nodeType === 1 && (root.getAttribute?.(CAROUSEL_ITEM_DESIGN_ATTR) === '1' || root.classList?.contains('is-carousel-design-active'))) activeItems.push(root);
    root.querySelectorAll?.(`[${CAROUSEL_ITEM_DESIGN_ATTR}="1"],.is-carousel-design-active`).forEach(el => activeItems.push(el));
    activeItems.forEach(el => {
      el.removeAttribute(CAROUSEL_ITEM_DESIGN_ATTR);
      el.classList?.remove('is-carousel-design-active');
    });
  } catch (_) {}
}

function selectCarouselDesignBlock(host, block, { repeat = false } = {}) {
  if (!host || !block || block.nodeType !== 1) return false;
  const apply = () => {
    if (!document.documentElement.contains(block)) return;
    if (host.getAttribute?.(CAROUSEL_DESIGN_HOST_ATTR) !== '1') return;
    try {
      if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
        window.ST_SELECTION.setSingle(block, { type: 'block' });
      } else {
        clearBuilderSelectionAndActive({ emit: false });
        block.classList.add('is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active');
        document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { type: 'block', elements: [block] } }));
      }
      let parent = block.parentElement;
      while (parent) {
        if (parent.classList?.contains('st-section') || parent.classList?.contains('st-row') || (parent.classList?.contains('st-block') && parent !== block)) {
          parent.classList.remove('is-selected', 'is-active', 'hb-dom-selected', 'hb-dom-active');
        }
        parent = parent.parentElement;
      }
    } catch (_) {}
  };
  apply();
  if (repeat) {
    window.setTimeout(apply, 0);
    window.setTimeout(apply, 120);
    window.setTimeout(apply, 360);
  }
  return true;
}

function exitCarouselDesignMode(host, { restart = true, clearSelection = true } = {}) {
  if (host) {
    clearCarouselDesignFocus(host);
    if (restart) {
      try { initBlockCarousel(host); } catch (_) {}
    }
  } else {
    clearCarouselDesignFocus(document);
    if (restart) {
      try { bootAllBlockCarousels(); } catch (_) {}
    }
  }
  if (clearSelection) clearBuilderSelectionAndActive();
}

function focusEditableAtEnd(el) {
  if (!el) return;
  try { el.focus?.({ preventScroll: true }); } catch (_) { try { el.focus?.(); } catch (__) {} }
  if (!el.isContentEditable) return;
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection?.();
    sel?.removeAllRanges?.();
    sel?.addRange?.(range);
  } catch (_) {}
}

function ensureCarouselDesignUid(el, prefix = 'b') {
  if (!el || !el.dataset) return '';
  if (!el.dataset.uid) el.dataset.uid = `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  return el.dataset.uid;
}

function ensureCarouselItemEditableStructure(block) {
  if (!block || block.nodeType !== 1) return null;
  ensureCarouselDesignUid(block, 'b');
  block.setAttribute('data-block-kind', block.getAttribute('data-block-kind') || 'carousel-item');
  block.setAttribute('draggable', 'true');

  let row = null;
  try { row = block.querySelector(':scope > .st-row'); } catch (_) { row = null; }
  if (!row) {
    row = document.createElement('div');
    row.className = 'st-row';
    row.dataset.type = 'container';
    row.dataset.layoutOrient = 'row';
    row.style.cssText = 'display:flex;gap:12px;width:100%;min-height:80px;align-items:stretch;box-sizing:border-box;';

    const directText = block.querySelector(':scope > .st-text-edit');
    if (directText) {
      const textBlock = document.createElement('div');
      textBlock.className = 'st-block st-block--text';
      textBlock.setAttribute('data-block-kind', 'text');
      textBlock.setAttribute('draggable', 'true');
      textBlock.dataset.fr = '1';
      ensureCarouselDesignUid(textBlock, 'b');
      directText.setAttribute('contenteditable', 'true');
      directText.setAttribute('spellcheck', 'false');
      directText.setAttribute('draggable', 'true');
      textBlock.appendChild(directText);
      row.appendChild(textBlock);
    }
    block.appendChild(row);
  }

  ensureCarouselDesignUid(row, 'r');

  const children = Array.from(row.querySelectorAll(':scope > .st-block'));
  if (!children.length) {
    const textBlock = document.createElement('div');
    textBlock.className = 'st-block st-block--text';
    textBlock.setAttribute('data-block-kind', 'text');
    textBlock.setAttribute('draggable', 'true');
    textBlock.dataset.fr = '1';
    ensureCarouselDesignUid(textBlock, 'b');
    const ed = document.createElement('div');
    ed.className = 'st-text-edit';
    ed.setAttribute('contenteditable', 'true');
    ed.setAttribute('spellcheck', 'false');
    ed.setAttribute('draggable', 'true');
    ed.innerHTML = 'Введіть текст...';
    textBlock.appendChild(ed);
    row.appendChild(textBlock);
  } else {
    children.forEach((child, index) => {
      ensureCarouselDesignUid(child, 'b');
      child.setAttribute('draggable', 'true');
      if (!child.dataset.fr) child.dataset.fr = String(1 / Math.max(1, children.length));
      const ed = child.querySelector?.(':scope > .st-text-edit, :scope > .st-article-edit');
      if (ed) {
        ed.setAttribute('contenteditable', 'true');
        ed.setAttribute('draggable', 'true');
      }
    });
  }

  try {
    document.dispatchEvent(new CustomEvent('st:carousel-item-design-ready', { detail: { block, row } }));
  } catch (_) {}
  return row;
}

function enterCarouselItemDesignMode(section, host, index, setStatus = null) {
  if (!host || host.nodeType !== 1) {
    showBigNotice('СПОЧАТКУ ВИБЕРІТЬ КАРУСЕЛЬ АБО БЛОК КАРУСЕЛІ');
    return false;
  }
  const track = getCarouselTrack(host);
  const items = getCarouselAllItems(track);
  if (!track || !items.length) {
    showBigNotice('У ЦІЙ КАРУСЕЛІ НЕ ЗНАЙДЕНО БЛОКІВ ДЛЯ РЕДАГУВАННЯ');
    return false;
  }
  const idx = Math.max(0, Math.min(items.length - 1, Math.round(Number(index) || 0)));
  const block = items[idx];
  if (!block) return false;

  ensureCarouselItemEditableStructure(block);
  try { window.ST_RESCAN_SITE_STATE?.(); } catch (_) {}

  const cfg = readCarouselConfig(host);
  clearCarouselDesignFocus(document);
  host.setAttribute(CAROUSEL_DESIGN_HOST_ATTR, '1');
  // Показуємо потрібний блок у видимій зоні і повністю зупиняємо runtime, поки відкритий дизайн слайда.
  setCarouselIndex(host, cfg, idx, true);
  stopBlockCarousel(host);

  block.setAttribute(CAROUSEL_ITEM_DESIGN_ATTR, '1');
  block.classList.add('is-carousel-design-active');
  if (!block.hasAttribute('tabindex')) block.setAttribute('tabindex', '-1');
  ensureCarouselDesignSession(section, host, idx, block);
  selectCarouselDesignBlock(host, block, { repeat: true });

  section._stfxCarouselActiveIndex = idx;
  setCarouselOpenExtraIndex(section, idx, true);
  renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), host, readCarouselConfig(host), idx);
  const card = section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`);
  card?.classList.add('is-extra-open');
  updateCarouselDesignControls(section, host, idx);
  selectCarouselDesignBlock(host, block, { repeat: true });

  try { block.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch (_) {}
  window.setTimeout(() => {
    selectCarouselDesignBlock(host, block);
    const editable = block.querySelector?.(':scope > .st-text-edit, :scope [contenteditable="true"]') || block;
    focusEditableAtEnd(editable);
    selectCarouselDesignBlock(host, block);
  }, 220);

  try {
    document.dispatchEvent(new CustomEvent('st:block-carousel:item-design', { detail: { host, block, index: idx } }));
  } catch (_) {}
  setStatus?.(`Прокрутку зупинено. Блок каруселі №${idx + 1} виділено для редагування.`);
  return true;
}

function setCarouselItemBackground(block, url, { pending = true } = {}) {
  if (!block || block.nodeType !== 1) return false;
  ensureCarouselItemBgAppliedSnapshot(block);
  const src = String(url || '').trim();
  const prev = carouselItemBgStateFromBlock(block);
  const state = normalizeSlide({ src, bg: prev.bg || defaultSlideBg() });
  writeCarouselItemBgState(block, state, { pending, visual: true });
  if (pending) markCarouselItemPending(block, true);
  return true;
}

function ensureCarouselItemCount(host, count) {
  const track = getCarouselTrack(host);
  if (!track) return [];
  let items = getCarouselAllItems(track);
  const target = Math.max(0, Math.round(Number(count) || 0));
  while (items.length < target) {
    const item = makeDefaultCarouselItem(items.length);
    markCarouselItemPending(item, true);
    track.appendChild(item);
    items = getCarouselAllItems(track);
  }
  return items;
}

function applyCarouselPickedUrls(section, host, startIndex, urls, setStatus = null) {
  if (!host) { setStatus?.('Спочатку додайте або виберіть карусель.'); return false; }
  const cleanUrls = (Array.isArray(urls) ? urls : [urls]).map(url => String(url || '').trim()).filter(Boolean);
  if (!cleanUrls.length) { setStatus?.('Галерея не повернула шлях картинки'); return false; }
  const start = Math.max(0, Math.round(Number(startIndex) || 0));
  const beforeCount = getCarouselAllItems(getCarouselTrack(host)).length;
  const items = ensureCarouselItemCount(host, start + cleanUrls.length);
  if (!items.length) { setStatus?.('Не знайдено контейнер блоків каруселі'); return false; }
  cleanUrls.forEach((url, offset) => {
    const block = items[start + offset];
    if (block) setCarouselItemBackground(block, url, { pending: true });
  });
  section._stfxCarouselActiveIndex = start;
  initBlockCarousel(host);
  const cfg = readCarouselConfig(host);
  renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), host, cfg, start);
  updateCarouselDirtyState(section, host);
  const added = Math.max(0, getCarouselAllItems(getCarouselTrack(host)).length - beforeCount);
  const count = cleanUrls.length;
  setStatus?.(count > 1
    ? `Додано ${count} фото у блоки каруселі${added ? `, створено нових блоків: ${added}` : ''}. Натисни «Застосувати карусель».`
    : 'Фото блока каруселі вибрано. Натисни «Застосувати карусель».');
  return true;
}

function getCarouselVisible(cfg) {
  return Math.max(1, Math.round(Number(cfg.visibleDesktop) || 4));
}

function getCarouselMaxIndex(cfg, items) {
  const visible = getCarouselVisible(cfg);
  return Math.max(0, items.length - visible);
}

function stopBlockCarousel(el) {
  const t = carouselTimers.get(el);
  if (t) window.clearTimeout(t);
  carouselTimers.delete(el);
}

function cleanupBlockCarousel(el) {
  if (!el) return;
  stopBlockCarousel(el);
  try { el.querySelectorAll(`:scope > [${CAROUSEL_RUNTIME_ATTR}]`).forEach(n => n.remove()); } catch (_) {}
  const track = getCarouselTrack(el);
  try {
    el.classList.remove('st-block-carousel');
    el.removeAttribute('data-axis');
    el.style.removeProperty('--st-carousel-visible-desktop');
    el.style.removeProperty('--st-carousel-visible-tablet');
    el.style.removeProperty('--st-carousel-visible-mobile');
    el.style.removeProperty('--st-carousel-duration');
    el.style.removeProperty('--st-carousel-item-width');
    el.style.removeProperty('--st-carousel-item-height');
    el.removeAttribute(CAROUSEL_SIZE_MODE_ATTR);
    if (track) {
      track.classList.remove('st-block-carousel-track');
      track.style.removeProperty('transform');
      track.style.removeProperty('transitionDuration');
      getCarouselAllItems(track).forEach(item => {
        item.style.removeProperty('display');
        item.style.removeProperty('flex-basis');
        item.style.removeProperty('min-width');
        item.style.removeProperty('max-width');
        item.style.removeProperty('width');
        item.style.removeProperty('height');
        item.style.removeProperty('min-height');
      });
    }
  } catch (_) {}
}


function applyCarouselSizeToElement(el, cfg) {
  if (!el || el.nodeType !== 1) return;
  const size = resolveCarouselSize(cfg);
  if (!size) {
    el.removeAttribute(CAROUSEL_SIZE_MODE_ATTR);
    el.style.removeProperty('--st-carousel-item-width');
    el.style.removeProperty('--st-carousel-item-height');
    return;
  }
  el.setAttribute(CAROUSEL_SIZE_MODE_ATTR, 'fixed');
  el.style.setProperty('--st-carousel-item-width', `${size.width}px`);
  el.style.setProperty('--st-carousel-item-height', `${size.height}px`);
}

function getCarouselMoveSpanPx(track, item, axis) {
  try {
    const rect = item?.getBoundingClientRect?.();
    if (!rect) return 0;
    const cs = getComputedStyle(track);
    const rawGap = axis === 'vertical' ? (cs.rowGap || cs.gap) : (cs.columnGap || cs.gap);
    const gap = Number.parseFloat(rawGap) || 0;
    const base = axis === 'vertical' ? rect.height : rect.width;
    return Math.max(0, base + gap);
  } catch (_) { return 0; }
}

function setCarouselIndex(el, cfg, nextIndex, immediate = false) {
  const track = getCarouselTrack(el);
  const items = getCarouselItems(track);
  if (!track || !items.length) return 0;
  const max = getCarouselMaxIndex(cfg, items);
  let index = Math.round(Number(nextIndex) || 0);
  if (cfg.loop) index = max > 0 ? ((index % (max + 1)) + (max + 1)) % (max + 1) : 0;
  else index = Math.max(0, Math.min(max, index));
  cfg.current = index;
  const writeCfg = Object.assign({}, cfg || {});
  delete writeCfg._transitionDurationOverride;
  writeCarouselConfig(el, writeCfg);
  const visible = getCarouselVisible(cfg);
  const fixedSize = resolveCarouselSize(cfg);
  const overrideDuration = Number(cfg?._transitionDurationOverride);
  const moveDuration = Number.isFinite(overrideDuration) && overrideDuration >= 0 ? overrideDuration : cfg.duration;
  track.style.transitionDuration = immediate ? '0ms' : `${moveDuration}ms`;
  if (fixedSize) {
    const span = getCarouselMoveSpanPx(track, items[0], cfg.axis);
    const amountPx = Math.round(index * span);
    track.style.transform = cfg.axis === 'vertical' ? `translate3d(0,-${amountPx}px,0)` : `translate3d(-${amountPx}px,0,0)`;
  } else {
    const amount = index * (100 / visible);
    track.style.transform = cfg.axis === 'vertical' ? `translate3d(0,-${amount}%,0)` : `translate3d(-${amount}%,0,0)`;
  }
  try {
    el.querySelectorAll(':scope > .st-carousel-nav .st-carousel-dot').forEach(dot => {
      const n = Number(dot.dataset.carouselIndex);
      dot.classList.toggle('is-active', n === index);
    });
  } catch (_) {}
  return index;
}

function setCarouselIndexByWheel(el, cfg, delta) {
  const track = getCarouselTrack(el);
  const items = getCarouselItems(track);
  if (!track || !items.length) return Number(cfg?.current) || 0;
  const max = getCarouselMaxIndex(cfg, items);
  const current = Math.max(0, Math.min(max, Math.round(Number(cfg?.current) || 0)));
  const next = Math.max(0, Math.min(max, current + (delta > 0 ? 1 : -1)));
  if (next === current) {
    cfg.current = current;
    writeCarouselConfig(el, cfg);
    return current;
  }
  stopBlockCarousel(el);
  const manualCfg = Object.assign({}, cfg, {
    loop: false,
    current,
    manualPaused: true,
    wheelControl: true,
    _transitionDurationOverride: Math.max(120, Math.min(320, Number(cfg?.duration) || 220)),
  });
  const applied = setCarouselIndex(el, manualCfg, next, false);
  const saved = Object.assign({}, readCarouselConfig(el), {
    loop: cfg.loop !== false,
    manualPaused: true,
    wheelControl: true,
    current: applied,
  });
  writeCarouselConfig(el, saved);
  return applied;
}

function buildCarouselNav(el, cfg, items) {
  const max = getCarouselMaxIndex(cfg, items);
  const wantsDots = cfg.nav === 'dots' || cfg.nav === 'dots-hover' || cfg.nav === 'both' || cfg.nav === 'both-hover';
  const wantsArrows = cfg.nav === 'arrows' || cfg.nav === 'arrows-hover' || cfg.nav === 'both' || cfg.nav === 'both-hover';
  const hover = String(cfg.nav || '').includes('hover') ? cfg.nav : '';
  if (wantsDots && max > 0) {
    const nav = document.createElement('div');
    nav.className = 'st-carousel-nav';
    nav.setAttribute(CAROUSEL_RUNTIME_ATTR, '1');
    nav.dataset.mode = hover;
    for (let i = 0; i <= max; i += 1) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'st-carousel-dot' + (i === cfg.current ? ' is-active' : '');
      dot.dataset.carouselIndex = String(i);
      dot.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); setCarouselIndex(el, readCarouselConfig(el), i); });
      nav.appendChild(dot);
    }
    el.appendChild(nav);
  }
  if (wantsArrows && max > 0) {
    const prev = document.createElement('button');
    const next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.className = 'st-carousel-arrow st-carousel-arrow--prev';
    next.className = 'st-carousel-arrow st-carousel-arrow--next';
    prev.setAttribute(CAROUSEL_RUNTIME_ATTR, '1');
    next.setAttribute(CAROUSEL_RUNTIME_ATTR, '1');
    prev.dataset.mode = next.dataset.mode = hover;
    prev.innerHTML = '‹';
    next.innerHTML = '›';
    prev.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); const c = readCarouselConfig(el); setCarouselIndex(el, c, c.current - (c.stepMode === 'group' ? getCarouselVisible(c) : 1)); });
    next.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); const c = readCarouselConfig(el); setCarouselIndex(el, c, c.current + (c.stepMode === 'group' ? getCarouselVisible(c) : 1)); });
    el.appendChild(prev); el.appendChild(next);
  }
}

function initBlockCarousel(el) {
  if (!el || el.nodeType !== 1) return;
  const cfg = readCarouselConfig(el);
  cleanupBlockCarousel(el);
  if (!cfg.enabled) return;
  const track = getCarouselTrack(el);
  const allItems = getCarouselAllItems(track);
  allItems.forEach(item => { item.style.display = isCarouselItemPaused(item) ? 'none' : ''; });
  const items = getCarouselItems(track);
  if (!track || items.length <= 1) return;
  const pos = getComputedStyle(el).position;
  if (pos === 'static') el.style.position = 'relative';
  el.classList.add('st-block-carousel');
  el.dataset.axis = cfg.axis;
  el.style.setProperty('--st-carousel-visible-desktop', String(cfg.visibleDesktop));
  el.style.setProperty('--st-carousel-visible-tablet', String(cfg.visibleTablet));
  el.style.setProperty('--st-carousel-visible-mobile', String(cfg.visibleMobile));
  el.style.setProperty('--st-carousel-duration', `${cfg.duration}ms`);
  applyCarouselSizeToElement(el, cfg);
  track.classList.add('st-block-carousel-track');
  buildCarouselNav(el, cfg, items);
  setCarouselIndex(el, cfg, cfg.current, true);
  attachCarouselManualControls(el);

  if (el.getAttribute(CAROUSEL_DESIGN_HOST_ATTR) === '1') {
    stopBlockCarousel(el);
    return;
  }

  if (cfg.manualPaused) {
    stopBlockCarousel(el);
    return;
  }

  let paused = false;
  if (cfg.pauseOnHover) {
    el.addEventListener('mouseenter', () => { paused = true; }, { passive: true });
    el.addEventListener('mouseleave', () => { paused = false; }, { passive: true });
  }
  if (cfg.drag) attachCarouselDrag(el);
  if (cfg.autoplay && getCarouselMaxIndex(cfg, items) > 0) {
    const schedule = (delay) => {
      const id = window.setTimeout(tick, Math.max(250, Number(delay) || 250));
      carouselTimers.set(el, id);
    };
    const tick = () => {
      if (el.getAttribute(CAROUSEL_DESIGN_HOST_ATTR) === '1') return stopBlockCarousel(el);
      const c = readCarouselConfig(el);
      if (!c.enabled) return stopBlockCarousel(el);
      if (paused) { schedule(250); return; }
      const step = c.stepMode === 'group' ? getCarouselVisible(c) : 1;
      const delta = ['right','down'].includes(c.direction) ? -step : step;
      setCarouselIndex(el, c, (Number(c.current) || 0) + delta);
      schedule(c.interval + c.duration);
    };
    schedule(cfg.interval);
  }
}

function attachCarouselDrag(el) {
  const track = getCarouselTrack(el);
  if (!track || track.dataset.carouselDragBound === '1') return;
  track.dataset.carouselDragBound = '1';
  let startX = 0, startY = 0, active = false;
  track.addEventListener('pointerdown', ev => {
    if (el.getAttribute(CAROUSEL_DESIGN_HOST_ATTR) === '1') return;
    if (ev.button !== undefined && ev.button !== 0) return;
    active = true; startX = ev.clientX; startY = ev.clientY;
  }, { passive: true });
  window.addEventListener('pointerup', ev => {
    if (!active) return;
    active = false;
    if (el.getAttribute(CAROUSEL_DESIGN_HOST_ATTR) === '1') return;
    const cfg = readCarouselConfig(el);
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    const main = cfg.axis === 'vertical' ? dy : dx;
    if (Math.abs(main) < 36) return;
    const delta = main < 0 ? 1 : -1;
    setCarouselIndex(el, cfg, (Number(cfg.current) || 0) + delta);
  }, { passive: true });
}

function attachCarouselManualControls(el) {
  if (!el || el.nodeType !== 1 || el.dataset.carouselManualControlsBound === '1') return;
  el.dataset.carouselManualControlsBound = '1';

  const manualModeReady = () => {
    const cfg = readCarouselConfig(el);
    return cfg.enabled && cfg.manualPaused && cfg.wheelControl && el.getAttribute(CAROUSEL_DESIGN_HOST_ATTR) !== '1' ? cfg : null;
  };

  const consume = (ev) => {
    try { ev.preventDefault(); } catch (_) {}
    try { ev.stopPropagation(); } catch (_) {}
    try { ev.stopImmediatePropagation?.(); } catch (_) {}
  };

  el.addEventListener('wheel', ev => {
    const cfg = manualModeReady();
    if (!cfg) return;
    const track = getCarouselTrack(el);
    const items = getCarouselItems(track);
    if (!track || items.length <= 1 || getCarouselMaxIndex(cfg, items) <= 0) return;

    // У ручному режимі нативний скрол сторінки блокуємо одразу, а не тільки після порога.
    // Інакше браузер встигає посунути сторінку, а карусель паралельно рухається transform-ом —
    // через це з'являлось "смикання" і візуальне повернення назад.
    consume(ev);
    stopBlockCarousel(el);

    const main = cfg.axis === 'vertical'
      ? ev.deltaY
      : (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY);
    if (Math.abs(main) < 1) return;

    const now = Date.now();
    const state = carouselWheelState.get(el) || { at: 0, carry: 0, lastSign: 0, reverseGuardUntil: 0, lastOpenAt: 0, lastOpenIndex: -1 };
    state.carry += main;

    const threshold = 48;
    if (Math.abs(state.carry) < threshold) {
      carouselWheelState.set(el, state);
      return;
    }

    const sign = state.carry > 0 ? 1 : -1;
    // Блокуємо короткі інерційні імпульси у протилежний бік після одного прокручування.
    // Це прибирає ситуацію: вперед -> дрібний bounce назад -> знову вперед.
    if (state.lastSign && sign !== state.lastSign && now < state.reverseGuardUntil) {
      state.carry = 0;
      carouselWheelState.set(el, state);
      return;
    }

    if (now - state.at < 150) {
      carouselWheelState.set(el, state);
      return;
    }

    state.carry = 0;
    state.at = now;
    state.lastSign = sign;
    state.reverseGuardUntil = now + 380;
    carouselWheelState.set(el, state);

    setCarouselIndexByWheel(el, cfg, sign);
  }, { passive: false, capture: true });

  const openFromCanvasEvent = (ev) => {
    const cfg = manualModeReady();
    if (!cfg) return false;
    const index = getCarouselItemIndexFromCanvasEvent(el, ev);
    if (index < 0) return false;

    const now = Date.now();
    const state = carouselWheelState.get(el) || { at: 0, carry: 0, lastSign: 0, reverseGuardUntil: 0, lastOpenAt: 0, lastOpenIndex: -1 };
    if (state.lastOpenIndex === index && now - state.lastOpenAt < 420) {
      consume(ev);
      return true;
    }
    state.lastOpenAt = now;
    state.lastOpenIndex = index;
    carouselWheelState.set(el, state);

    consume(ev);
    stopBlockCarousel(el);
    openCarouselItemSettingsFromCanvas(el, index, { focusBlock: true });
    return true;
  };

  el.addEventListener('dblclick', ev => {
    openFromCanvasEvent(ev);
  }, true);

  // Деякі вкладені contenteditable/drag-зони не завжди віддають dblclick стабільно.
  // Тому ловимо другий click у capture-фазі як дублюючий, але захищений від повторного відкриття.
  el.addEventListener('click', ev => {
    if (Number(ev.detail) >= 2) openFromCanvasEvent(ev);
  }, true);
}

function bootAllBlockCarousels() {
  document.querySelectorAll(`[${CAROUSEL_ATTR}]`).forEach(initBlockCarousel);
}

// [01004] Diagnostic-only runtime gate used by COLOR PICKER PERFORMANCE PROBE.
// It never writes template/store state: it only pauses in-memory autoplay timers and restores them.
function installColorPickerProbeRuntimeApi01004_() {
  try {
    window.ST_COLOR_PICKER_RUNTIME_GATE_01004 = Object.freeze({
      pauseAll(reason = 'color-picker-probe') {
        const sliders = [];
        document.querySelectorAll('[data-st-fx-bg-slider]').forEach((el) => {
          try {
            const ctl = sliderRuntimeControllers00992.get(el);
            const wasPaused = ctl?.isManualPaused?.() === true;
            sliders.push({ el, wasPaused });
            if (ctl?.setManualPaused) ctl.setManualPaused(true);
            else {
              const old = timers.get(el);
              if (old) window.clearTimeout(old);
              timers.delete(el);
              clearSliderResume00990(el);
            }
          } catch (_) {}
        });
        const carousels = [];
        document.querySelectorAll(`[${CAROUSEL_ATTR}]`).forEach((el) => {
          try {
            const hadTimer = carouselTimers.has(el);
            carousels.push({ el, hadTimer });
            stopBlockCarousel(el);
          } catch (_) {}
        });
        return { reason, sliders, carousels, sliderCount: sliders.length, carouselCount: carousels.length };
      },
      restore(snapshot) {
        try {
          (snapshot?.sliders || []).forEach((item) => {
            try {
              const el = item?.el;
              if (!(el instanceof HTMLElement) || !el.isConnected) return;
              const ctl = sliderRuntimeControllers00992.get(el);
              if (ctl?.setManualPaused) ctl.setManualPaused(item.wasPaused === true);
              else initBackgroundFx(el);
            } catch (_) {}
          });
          (snapshot?.carousels || []).forEach((item) => {
            try {
              const el = item?.el;
              if (!(el instanceof HTMLElement) || !el.isConnected) return;
              initBlockCarousel(el);
            } catch (_) {}
          });
          return true;
        } catch (_) { return false; }
      },
      snapshot() {
        let runningSliders = 0;
        let pausedSliders = 0;
        let carouselTimersCount = 0;
        document.querySelectorAll('[data-st-fx-bg-slider]').forEach((el) => {
          try {
            const ctl = sliderRuntimeControllers00992.get(el);
            if (ctl?.isManualPaused?.() === true) pausedSliders += 1;
            else if (timers.has(el)) runningSliders += 1;
          } catch (_) {}
        });
        document.querySelectorAll(`[${CAROUSEL_ATTR}]`).forEach((el) => {
          try { if (carouselTimers.has(el)) carouselTimersCount += 1; } catch (_) {}
        });
        return {
          sliderHosts: document.querySelectorAll('[data-st-fx-bg-slider]').length,
          runningSliders,
          pausedSliders,
          carouselHosts: document.querySelectorAll(`[${CAROUSEL_ATTR}]`).length,
          carouselTimers: carouselTimersCount
        };
      }
    });
  } catch (_) {}
}

function getUiCarouselConfig(section, oldCfg = defaultCarouselConfig()) {
  const axis = section.querySelector('[data-carousel-axis]')?.value || oldCfg.axis || 'horizontal';
  return {
    enabled: oldCfg.enabled === true || section.querySelector('[data-carousel-enabled]')?.checked === true,
    visibleDesktop: clampNumber(section.querySelector('[data-carousel-visible-desktop]')?.value, 1, 12, oldCfg.visibleDesktop || 4),
    visibleTablet: clampNumber(section.querySelector('[data-carousel-visible-tablet]')?.value, 1, 8, oldCfg.visibleTablet || 2),
    visibleMobile: clampNumber(section.querySelector('[data-carousel-visible-mobile]')?.value, 1, 4, oldCfg.visibleMobile || 1),
    axis,
    direction: section.querySelector('[data-carousel-direction]')?.value || (axis === 'vertical' ? 'up' : 'left'),
    stepMode: section.querySelector('[data-carousel-step-mode]')?.value || 'single',
    interval: Math.max(0.5, Number(section.querySelector('[data-carousel-interval]')?.value || 2)) * 1000,
    duration: Math.max(0.1, Number(section.querySelector('[data-carousel-duration]')?.value || .8)) * 1000,
    autoplay: section.querySelector('[data-carousel-autoplay]')?.checked !== false,
    loop: section.querySelector('[data-carousel-loop]')?.checked !== false,
    pauseOnHover: section.querySelector('[data-carousel-pause]')?.checked !== false,
    nav: section.querySelector('[data-carousel-nav]')?.value || 'both-hover',
    drag: section.querySelector('[data-carousel-drag]')?.checked !== false,
    manualPaused: section.querySelector('[data-carousel-runtime-toggle]')?.dataset.paused === '1',
    wheelControl: section.querySelector('[data-carousel-wheel-toggle]')?.dataset.active === '1',
    itemSizePreset: normalizeCarouselSizePreset(section.querySelector('[data-carousel-size-preset]')?.value || oldCfg.itemSizePreset || 'auto'),
    itemWidth: clampNumber(section.querySelector('[data-carousel-size-width]')?.value, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, oldCfg.itemWidth || 320),
    itemHeight: clampNumber(section.querySelector('[data-carousel-size-height]')?.value, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, oldCfg.itemHeight || 220),
    itemSizeLive: section.querySelector('[data-carousel-size-live]')?.checked === true,
    current: Number(oldCfg.current) || 0,
  };
}


function updateCarouselSizeOutputs(section) {
  const wInput = section?.querySelector?.('[data-carousel-size-width]');
  const hInput = section?.querySelector?.('[data-carousel-size-height]');
  const wOut = section?.querySelector?.('[data-carousel-size-width-out]');
  const hOut = section?.querySelector?.('[data-carousel-size-height-out]');
  const presetSel = section?.querySelector?.('[data-carousel-size-preset]');
  const custom = normalizeCarouselSizePreset(presetSel?.value) === 'custom';
  if (wOut) wOut.textContent = `${clampNumber(wInput?.value, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320)}px`;
  if (hOut) hOut.textContent = `${clampNumber(hInput?.value, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220)}px`;
  section?.querySelectorAll?.('[data-carousel-size-custom-only]')?.forEach(row => {
    row.classList.toggle('is-disabled', !custom);
    row.querySelectorAll?.('input[type="range"]').forEach(input => { input.disabled = !custom; });
  });
}

function syncCarouselSizeControls(section, cfg) {
  const preset = normalizeCarouselSizePreset(cfg?.itemSizePreset || 'auto');
  const presetEl = section?.querySelector?.('[data-carousel-size-preset]');
  const liveEl = section?.querySelector?.('[data-carousel-size-live]');
  const wEl = section?.querySelector?.('[data-carousel-size-width]');
  const hEl = section?.querySelector?.('[data-carousel-size-height]');
  if (presetEl) presetEl.value = preset;
  if (liveEl) liveEl.checked = cfg?.itemSizeLive === true;
  const resolved = preset === 'custom' ? { width: cfg?.itemWidth || 320, height: cfg?.itemHeight || 220 } : (CAROUSEL_SIZE_PRESETS[preset] || CAROUSEL_SIZE_PRESETS.auto);
  if (wEl) wEl.value = String(clampNumber(resolved.width, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320));
  if (hEl) hEl.value = String(clampNumber(resolved.height, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220));
  updateCarouselSizeOutputs(section);
}

function previewCarouselSizeFromUi(section, getSelection, setStatus = null) {
  if (section?.querySelector?.('[data-carousel-size-live]')?.checked !== true) return;
  const targets = collectTargets(getSelection);
  const first = targets[0] || null;
  const carouselHost = first ? resolveCarouselHost(first) : null;
  if (!carouselHost) return;
  const cfg = getUiCarouselConfig(section, readCarouselConfig(carouselHost));
  cfg.enabled = true;
  writeCarouselConfig(carouselHost, cfg);
  initBlockCarousel(carouselHost);
  setStatus?.(`Живий перегляд розміру: ${getCarouselSizeLabel(cfg)}`);
}

function syncCarouselRuntimeButtons(section, cfg = defaultCarouselConfig()) {
  const pauseBtn = section?.querySelector?.('[data-carousel-runtime-toggle]');
  const wheelBtn = section?.querySelector?.('[data-carousel-wheel-toggle]');
  const paused = cfg?.manualPaused === true;
  const wheel = cfg?.wheelControl === true;
  if (pauseBtn) {
    pauseBtn.dataset.paused = paused ? '1' : '0';
    pauseBtn.classList.toggle('stfx-btn--play', !paused);
    pauseBtn.classList.toggle('stfx-btn--pause', paused);
    pauseBtn.textContent = paused ? 'Ⅱ' : '▶';
    pauseBtn.title = paused ? 'Пауза активна — натисни, щоб знову запустити карусель' : 'Карусель працює — натисни, щоб зупинити її для ручного прокручування';
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }
  if (wheelBtn) {
    wheelBtn.dataset.active = wheel ? '1' : '0';
    wheelBtn.classList.toggle('is-active', wheel && paused);
    wheelBtn.classList.toggle('is-waiting', wheel && !paused);
    wheelBtn.setAttribute('aria-pressed', wheel ? 'true' : 'false');
    wheelBtn.title = wheel
      ? (paused ? 'Ручне прокручування активне: наведи курсор на карусель і крути колесо мишки' : 'Ручне прокручування ввімкнено, але спочатку натисни Паузу')
      : 'Увімкнути ручне прокручування колесом мишки';
  }
}

function getCarouselDirectItemFromNode(track, raw) {
  if (!track || !raw) return null;
  let node = raw.nodeType === 1 ? raw : raw.parentElement;
  while (node && node !== track && node.nodeType === 1) {
    if (node.parentElement === track && node.classList?.contains('st-block') && !node.hasAttribute(CAROUSEL_RUNTIME_ATTR)) {
      return node;
    }
    node = node.parentElement || null;
  }
  return null;
}

function getCarouselItemFromPointTarget(host, target, event = null) {
  const track = getCarouselTrack(host);
  if (!track) return null;

  // 00205: визначаємо саме прямий дочірній .st-block трека каруселі.
  // Не використовуємо closest('.st-block') як основний шлях, бо всередині слайда
  // можуть бути вкладені текстові/контейнерні .st-block, і тоді відкривалась не та картка.
  try {
    const path = typeof event?.composedPath === 'function' ? event.composedPath() : [];
    for (const raw of path) {
      const item = getCarouselDirectItemFromNode(track, raw);
      if (item) return item;
      if (raw === track || raw === host) break;
    }
  } catch (_) {}

  const direct = getCarouselDirectItemFromNode(track, target);
  if (direct) return direct;

  if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
    try {
      const stack = document.elementsFromPoint?.(event.clientX, event.clientY) || [];
      for (const raw of stack) {
        const fromStack = getCarouselDirectItemFromNode(track, raw);
        if (fromStack) return fromStack;
      }
    } catch (_) {}

    try {
      const x = Number(event.clientX);
      const y = Number(event.clientY);
      const items = getCarouselAllItems(track);
      for (const item of items) {
        if (!item || item.nodeType !== 1 || isCarouselItemPaused(item)) continue;
        const rect = item.getBoundingClientRect?.();
        if (!rect || rect.width <= 0 || rect.height <= 0) continue;
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return item;
      }
    } catch (_) {}
  }
  return null;
}

function getCarouselItemIndexFromCanvasEvent(host, event) {
  const track = getCarouselTrack(host);
  if (!track) return -1;
  const item = getCarouselItemFromPointTarget(host, event?.target, event);
  if (!item) return -1;
  const allItems = getCarouselAllItems(track);
  return allItems.indexOf(item);
}

function openCarouselItemSettingsFromCanvas(host, index, { focusBlock = true } = {}) {
  if (!host || host.nodeType !== 1) return false;
  const section = document.getElementById(SEC_ID);
  const idx = Math.max(0, Math.round(Number(index) || 0));
  const block = getCarouselItemByIndex(host, idx);
  if (!block) return false;
  const cfg = readCarouselConfig(host);
  setCarouselIndex(host, cfg, idx, true);
  stopBlockCarousel(host);
  if (focusBlock) selectCarouselTreeElement(block);
  try { block.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch (_) {}
  if (!section) return true;
  section.classList.add('is-open');
  const body = section.querySelector('.design-section__body');
  if (body) body.hidden = false;
  const carouselAccordion = section.querySelector('.stfx-carousel-accordion');
  if (carouselAccordion) carouselAccordion.open = true;
  section._stfxCarouselActiveIndex = idx;
  setCarouselOpenExtraIndex(section, idx, true);
  renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), host, readCarouselConfig(host), idx);
  const card = section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`);
  card?.classList.add('is-extra-open');
  const extraBtn = card?.querySelector?.('[data-toggle-carousel-item-extra]');
  if (extraBtn) { extraBtn.classList.add('is-open'); extraBtn.textContent = '▲'; }
  try { card?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); } catch (_) {}
  const status = section.querySelector('[data-status]');
  if (status) {
    status.textContent = `Відкрито налаштування блока каруселі №${idx + 1}`;
    window.setTimeout(() => { if (status.textContent.includes(`№${idx + 1}`)) status.textContent = ''; }, 2500);
  }
  return true;
}

function syncCarouselUi(section, getSelection) {
  const targets = collectTargets(getSelection);
  const firstTarget = targets[0] || null;
  const carouselHost = firstTarget ? resolveCarouselHost(firstTarget) : null;
  const cfg = carouselHost ? readCarouselConfig(carouselHost) : defaultCarouselConfig();
  const set = (sel, val) => { const el = section.querySelector(sel); if (el) el.value = String(val); };
  const check = (sel, val) => { const el = section.querySelector(sel); if (el) el.checked = !!val; };
  // 00180: checkbox "Увімкнути карусель для активного елемента" прибраний з UI.
  // Карусель вмикається кнопкою додавання/застосування, але лишаємо сумісність зі старими snapshot-ами.
  check('[data-carousel-enabled]', !!carouselHost && cfg.enabled);
  set('[data-carousel-visible-desktop]', cfg.visibleDesktop);
  set('[data-carousel-visible-tablet]', cfg.visibleTablet);
  set('[data-carousel-visible-mobile]', cfg.visibleMobile);
  set('[data-carousel-axis]', cfg.axis);
  set('[data-carousel-direction]', cfg.direction);
  set('[data-carousel-step-mode]', cfg.stepMode);
  set('[data-carousel-interval]', Math.round((Number(cfg.interval) || 2000) / 100) / 10);
  set('[data-carousel-duration]', Math.round((Number(cfg.duration) || 800) / 100) / 10);
  set('[data-carousel-nav]', cfg.nav);
  check('[data-carousel-autoplay]', cfg.autoplay);
  check('[data-carousel-loop]', cfg.loop);
  check('[data-carousel-pause]', cfg.pauseOnHover);
  check('[data-carousel-drag]', cfg.drag);
  syncCarouselRuntimeButtons(section, cfg);
  syncCarouselSizeControls(section, cfg);
  const state = section.querySelector('[data-carousel-state]');
  const itemList = section.querySelector('[data-carousel-item-list]');
  if (state) {
    const track = carouselHost ? getCarouselTrack(carouselHost) : null;
    const allItems = getCarouselAllItems(track);
    const activeItems = getCarouselItems(track);
    state.textContent = carouselHost
      ? `У вибраному елементі є окрема карусель: ${allItems.length} блоків, активних: ${activeItems.length}. Видимість: ${cfg.visibleDesktop}/${cfg.visibleTablet}/${cfg.visibleMobile}. Розмір: ${getCarouselSizeLabel(cfg)}.`
      : (firstTarget ? 'У цьому елементі ще немає окремої каруселі. Натисни «Додати карусель в активний елемент».' : 'Вибери секцію, контейнер або рівень, куди потрібно додати карусель.');
  }
  renderCarouselItemList(itemList, carouselHost, cfg, section._stfxCarouselActiveIndex ?? 0);
  updateCarouselDirtyState(section, carouselHost);
  updateAllCarouselDesignControls(section, carouselHost);
}

export function initSpecialEffectsWidget(host, getSelection) {
  installColorPickerProbeRuntimeApi01004_();
  if (!host || host.querySelector(`#${SEC_ID}`)) return;
  ensureCssOnce();
  bootEmptyHintsState();

  const section = document.createElement('section');
  section.className = 'design-section';
  section.id = SEC_ID;
  section.dataset.widget = 'special-effects';
  section.innerHTML = `
    <button class="design-section__header" type="button">
      <div class="design-section__header-title"><span>Спецефекти</span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body" hidden>
      <div class="stfx-wrap">
        <details class="stfx-inner-accordion stfx-bg-accordion" open>
          <summary><span>Фоновий слайдер</span></summary>
          <div class="stfx-accordion-body">
        <div class="stfx-note" data-stfx-info>Вибери секцію, контейнер або блок на полотні.</div>
        <div class="stfx-card">
          <div class="stfx-title">Фоновий слайдер</div>
          <label class="stfx-check" data-enabled-row data-stfx-help-delay="3000" data-stfx-help-title="УВІМКНУТИ ДЛЯ АКТИВНОГО ЕЛЕМЕНТА" data-stfx-help="Цей checkbox перемикає, хто керує фоном активного елемента. Якщо він увімкнений — фон контролює віджет Спецефекти. Якщо вимкнений — фон повертається під керування Заливки. Після зміни checkbox потрібно натиснути кнопку Застосувати. Якщо блок червоний, зміна ще не застосована. Якщо повернути checkbox у вже застосований стан, червоне підсвічування зникне."><input type="checkbox" data-enabled> Увімкнути для активного елемента</label>
          <label class="stfx-check"><input type="checkbox" data-empty-hints> Показувати підказку порожньої секції</label>
          <div class="stfx-setting-row" data-setting-row="interval">
            <input class="stfx-radio" type="checkbox" data-global-interval checked data-stfx-help-title="ОЧІКУВАННЯ ДЛЯ ВСІХ" data-stfx-help="Застосувати до усіх слайдів. Дана команда має пріоритет над індивідуальними налаштуваннями слайдів.">
            <div class="stfx-setting-main"><label>Очікування</label><input class="stfx-input" data-interval type="number" min="1" max="60" step="1"><span class="stfx-mini">секунд між переходами</span></div>
            <button class="stfx-action-dot" type="button" data-apply-setting="interval" data-setting-state="interval" data-state="ok" data-stfx-help-title="ЗАСТОСУВАТИ ОЧІКУВАННЯ" data-stfx-help="Сірий — без змін. Червоний — є незастосовані зміни. Натисніть, щоб застосувати значення до всіх слайдів або до вибраних слайдів.">✓</button>
            <button class="stfx-action-dot" type="button" data-cancel-setting="interval" data-state="idle" data-stfx-help-title="СКАСУВАТИ ОЧІКУВАННЯ" data-stfx-help="Якщо кнопка жовта — є незастосовані зміни. Натисніть, щоб повернути попередній застосований стан.">↶</button>
          </div>
          <div class="stfx-setting-row" data-setting-row="duration">
            <input class="stfx-radio" type="checkbox" data-global-duration checked data-stfx-help-title="АНІМАЦІЯ ДЛЯ ВСІХ" data-stfx-help="Застосувати час анімації до усіх слайдів. Дана команда має пріоритет над індивідуальними налаштуваннями слайдів.">
            <div class="stfx-setting-main"><label>Час анімації</label><input class="stfx-input" data-duration type="range" min="1" max="20" step="1" value="5"><span class="stfx-slider-value" data-duration-out>5 c</span></div>
            <button class="stfx-action-dot" type="button" data-apply-setting="duration" data-setting-state="duration" data-state="ok" data-stfx-help-title="ЗАСТОСУВАТИ ЧАС АНІМАЦІЇ" data-stfx-help="Червоний кружечок означає незастосовані зміни. Натисніть, щоб застосувати час до всіх або вибраних слайдів.">✓</button>
            <button class="stfx-action-dot" type="button" data-cancel-setting="duration" data-state="idle" data-stfx-help-title="СКАСУВАТИ ЧАС АНІМАЦІЇ" data-stfx-help="Повертає попередній застосований час анімації.">↶</button>
          </div>
          <div class="stfx-setting-row" data-setting-row="animation">
            <input class="stfx-radio" type="checkbox" data-global-animation checked data-stfx-help-title="ТИП ПЕРЕХОДУ ДЛЯ ВСІХ" data-stfx-help="Застосувати тип переходу до усіх слайдів. Дана команда має пріоритет над індивідуальними типами переходу окремих слайдів.">
            <div class="stfx-setting-main" style="flex-direction:column;align-items:stretch;"><label>Тип переходу</label><select class="stfx-select stfx-select--wide" data-animation>
              <option value="instant">Просто зміна</option>
              <option value="slide-right">Рух вправо</option>
              <option value="slide-left">Рух вліво</option>
              <option value="slide-up">Рух вгору</option>
              <option value="slide-down">Рух вниз</option>
              <option value="slide-up-right">Рух вгору вправо</option>
              <option value="slide-up-left">Рух вгору вліво</option>
              <option value="slide-down-right">Рух вниз вправо</option>
              <option value="slide-down-left">Рух вниз вліво</option>
              <option value="shift-right">Зсув вправо</option>
              <option value="shift-left">Зсув вліво</option>
              <option value="shift-up">Зсув вгору</option>
              <option value="shift-down">Зсув вниз</option>
              <option value="fade">Плавний перехід</option>
              <option value="zoom">Zoom / наближення</option>
              <option value="zoom-out">Віддалення</option>
              <option value="blur">Blur / розмиття</option>
            </select></div>
            <button class="stfx-action-dot" type="button" data-apply-setting="animation" data-setting-state="animation" data-state="ok" data-stfx-help-title="ЗАСТОСУВАТИ ТИП ПЕРЕХОДУ" data-stfx-help="Застосовує вибраний тип переходу до всіх слайдів або тільки до вибраних круглими чекбоксами.">✓</button>
            <button class="stfx-action-dot" type="button" data-cancel-setting="animation" data-state="idle" data-stfx-help-title="СКАСУВАТИ ТИП ПЕРЕХОДУ" data-stfx-help="Повертає попередній застосований тип переходу.">↶</button>
          </div>
          <div class="stfx-field">
            <label>Навігація</label>
            <select class="stfx-select" data-nav>
              <option value="off">Без навігації</option>
              <option value="dots">Крапки статично</option>
              <option value="dots-hover">Крапки при наведенні</option>
              <option value="arrows">Стрілки статично</option>
              <option value="arrows-hover">Стрілки при наведенні</option>
              <option value="both">Крапки + стрілки</option>
              <option value="both-hover">Крапки + стрілки при наведенні</option>
            </select>
          </div>
          <div class="stfx-setting-row" data-setting-row="overlay">
            <input class="stfx-radio" type="checkbox" data-global-overlay checked data-stfx-help-title="ЗАТЕМНЕННЯ ДЛЯ ВСІХ" data-stfx-help="Застосувати затемнення до усіх слайдів. Дана команда має пріоритет над індивідуальним затемненням окремих слайдів. Якщо зняти цей круглий чекбокс — значення застосовується тільки до вибраних слайдів або до активного слайда.">
            <div class="stfx-setting-main"><label>Затемнення</label><input class="stfx-input" type="range" min="0" max="80" step="1" data-overlay><input class="stfx-live-dot" type="checkbox" data-overlay-live data-stfx-help-title="ЖИВИЙ ПЕРЕГЛЯД ЗАТЕМНЕННЯ" data-stfx-help="Коли цей маленький круглий чекбокс активний, зміна повзунка затемнення одразу показується на активному елементі. Це тільки попередній перегляд: щоб зберегти результат, натисніть зелений/червоний кружечок застосування."><b class="stfx-slider-value" data-overlay-out>0%</b></div>
            <button class="stfx-action-dot" type="button" data-apply-setting="overlay" data-setting-state="overlay" data-state="ok" data-stfx-help-title="ЗАСТОСУВАТИ ЗАТЕМНЕННЯ" data-stfx-help="Сірий — без змін. Червоний — є незастосовані зміни. Натисніть, щоб застосувати затемнення до всіх слайдів або тільки до вибраних слайдів. Після застосування кружечок стає зеленим.">✓</button>
            <button class="stfx-action-dot" type="button" data-cancel-setting="overlay" data-state="idle" data-stfx-help-title="СКАСУВАТИ ЗАТЕМНЕННЯ" data-stfx-help="Якщо кнопка жовта — є незастосовані зміни. Натисніть, щоб повернути попередній застосований стан затемнення.">↶</button>
          </div>
          <div class="stfx-row stfx-row--wrap">
            <label class="stfx-check"><input type="checkbox" data-pause> Пауза при наведенні</label>
            <label class="stfx-check"><input type="checkbox" data-loop> Зациклення</label>
            <label class="stfx-check"><input type="checkbox" data-random> Випадково</label>
          </div>
        </div>
        <div class="stfx-card">
          <div class="stfx-title">Слайди / картинки / посилання</div>
          <div class="stfx-slide-list" data-slide-list></div>
          <div class="stfx-row stfx-row--wrap">
            <button class="stfx-btn" type="button" data-add-slide>+ Додати слайд</button>
            <button class="stfx-btn stfx-btn--green stfx-btn--apply is-clean" type="button" data-apply-fx>Застосувати</button>
            <button class="stfx-btn stfx-btn--ghost" type="button" data-refresh-fx>Оновити</button>
            <button class="stfx-btn stfx-btn--danger" type="button" data-clear-fx>Вимкнути</button>
          </div>
        </div>
        <div class="stfx-card" data-bind-box>
          <div class="stfx-title">Привʼязка блока до слайда</div>
          <div class="stfx-note" data-bind-info>Щоб привʼязати блок до слайда: виділи блок всередині секції/контейнера зі спецефектом.</div>
          <div class="stfx-row"><label>Слайд №</label><input class="stfx-input" data-bind-slide type="number" min="1" step="1" value="1"></div>
          <div class="stfx-row stfx-row--wrap">
            <button class="stfx-btn" type="button" data-bind-to-slide>Показувати тільки на цьому слайді</button>
            <button class="stfx-btn stfx-btn--ghost" type="button" data-bind-static>Показувати завжди</button>
          </div>
        </div>
        <div class="stfx-card">
          <div class="stfx-title">Професійні налаштування</div>
          <div class="stfx-note">План для наступних етапів: Ken Burns, відеофон, маска/clip-path, parallax, lazy-load, preload першого слайда, різні слайди desktop/mobile, autoplay тільки коли секція в зоні видимості, синхронізація з таймлайном аніматора.</div>
        </div>
          </div>
        </details>
        <details class="stfx-inner-accordion stfx-carousel-accordion">
          <summary><span>Карусель блоків</span></summary>
          <div class="stfx-accordion-body">
            <div class="stfx-card">
              <div class="stfx-title">Карусель реальних блоків</div>
              <div class="stfx-note">Вибери секцію, контейнер або рівень з дочірніми блоками. Віджет не змінює фон: він прокручує реальні блоки всередині вибраного елемента.</div>
              <div class="stfx-row stfx-row--wrap">
                <button class="stfx-btn stfx-btn--green" type="button" data-carousel-insert>+ Додати карусель в активний елемент</button>
                <button class="stfx-btn stfx-btn--danger" type="button" data-carousel-disable-shell>Вимкнути карусель</button>
              </div>
              <div class="stfx-carousel-state" data-carousel-state>Вибери контейнер із дочірніми блоками.</div>
              <div class="stfx-carousel-row">
                <div class="stfx-field"><label>Desktop</label><input class="stfx-input" type="number" min="1" max="12" step="1" data-carousel-visible-desktop></div>
                <div class="stfx-field"><label>Tablet</label><input class="stfx-input" type="number" min="1" max="8" step="1" data-carousel-visible-tablet></div>
                <div class="stfx-field"><label>Mobile</label><input class="stfx-input" type="number" min="1" max="4" step="1" data-carousel-visible-mobile></div>
              </div>
              <div class="stfx-grid2">
                <div class="stfx-field"><label>Напрямок каруселі</label><select class="stfx-select" data-carousel-axis><option value="horizontal">Горизонтально</option><option value="vertical">Вертикально</option></select></div>
                <div class="stfx-field"><label>Рух</label><select class="stfx-select" data-carousel-direction><option value="left">Вліво</option><option value="right">Вправо</option><option value="up">Вгору</option><option value="down">Вниз</option></select></div>
                <div class="stfx-field"><label>Режим кроку</label><select class="stfx-select" data-carousel-step-mode><option value="single">По одному блоку</option><option value="group">Групою видимих блоків</option><option value="marquee">Стрічка / marquee</option></select></div>
                <div class="stfx-field"><label>Навігація</label><select class="stfx-select" data-carousel-nav><option value="off">Без навігації</option><option value="dots">Крапки статично</option><option value="dots-hover">Крапки при наведенні</option><option value="arrows">Стрілки статично</option><option value="arrows-hover">Стрілки при наведенні</option><option value="both">Крапки + стрілки</option><option value="both-hover">Крапки + стрілки при наведенні</option></select></div>
              </div>
              <div class="stfx-setting-row">
                <div></div>
                <div class="stfx-setting-main"><label>Очікування</label><input class="stfx-input" type="number" min="0.5" max="60" step="0.5" data-carousel-interval><span class="stfx-mini">секунд</span></div>
                <div></div><div></div>
              </div>
              <div class="stfx-setting-row">
                <div></div>
                <div class="stfx-setting-main"><label>Час руху</label><input class="stfx-input" type="number" min="0.1" max="20" step="0.1" data-carousel-duration><span class="stfx-mini">секунд</span></div>
                <div></div><div></div>
              </div>
              <div class="stfx-row stfx-row--wrap">
                <label class="stfx-check"><input type="checkbox" data-carousel-autoplay> Автозапуск</label>
                <label class="stfx-check"><input type="checkbox" data-carousel-loop> Зациклення</label>
                <label class="stfx-check"><input type="checkbox" data-carousel-pause> Пауза при наведенні</label>
                <label class="stfx-check"><input type="checkbox" data-carousel-drag> Drag / Swipe</label>
                <div class="stfx-carousel-runtime-controls">
                  <button class="stfx-btn stfx-carousel-runtime-btn stfx-btn--play" type="button" data-carousel-runtime-toggle data-paused="0" aria-pressed="false" title="Карусель працює — натисни, щоб зупинити">▶</button>
                  <button class="stfx-btn stfx-carousel-wheel-btn" type="button" data-carousel-wheel-toggle data-active="0" aria-pressed="false" title="Увімкнути ручне прокручування колесом мишки">↕ колесом мишки</button>
                </div>
              </div>
              <details class="stfx-inner-accordion stfx-size-accordion">
                <summary><span>Розмір</span></summary>
                <div class="stfx-accordion-body">
                  <div class="stfx-note">Загальний розмір застосовується до всіх блоків цієї каруселі. Мінімум 10px. Максимум: 1600px по горизонталі та 1200px по вертикалі.</div>
                  <div class="stfx-size-grid">
                    <div class="stfx-field"><label>Готовий розмір</label><select class="stfx-select" data-carousel-size-preset>
                      <option value="auto">Авто — як зараз</option>
                      <option value="block-xs">Блок XS — 160 × 120</option>
                      <option value="block-sm">Блок S — 220 × 160</option>
                      <option value="block-md">Блок M — 320 × 220</option>
                      <option value="block-lg">Блок L — 460 × 300</option>
                      <option value="block-xl">Блок XL — 640 × 380</option>
                      <option value="section-sm">Секція S — 760 × 320</option>
                      <option value="section-md">Секція M — 960 × 460</option>
                      <option value="section-lg">Секція L — 1200 × 620</option>
                      <option value="section-hero">Hero — 1440 × 760</option>
                      <option value="custom">Власний розмір</option>
                    </select></div>
                    <label class="stfx-check"><input type="checkbox" data-carousel-size-live> Перегляд у режимі реального часу</label>
                    <div class="stfx-size-slider-row" data-carousel-size-custom-only>
                      <label>Горизонталь</label>
                      <input type="range" min="10" max="1600" step="10" value="320" data-carousel-size-width>
                      <span class="stfx-size-value" data-carousel-size-width-out>320px</span>
                    </div>
                    <div class="stfx-size-slider-row" data-carousel-size-custom-only>
                      <label>Вертикаль</label>
                      <input type="range" min="10" max="1200" step="10" value="220" data-carousel-size-height>
                      <span class="stfx-size-value" data-carousel-size-height-out>220px</span>
                    </div>
                  </div>
                </div>
              </details>
              <div class="stfx-carousel-item-list" data-carousel-item-list></div>
              <div class="stfx-carousel-actions">
                <button class="stfx-btn" type="button" data-carousel-pick-multiple>📁 Вставити кілька фото</button>
                <button class="stfx-btn stfx-btn--green stfx-btn--apply is-clean" type="button" data-carousel-apply>Застосувати карусель</button>
                <button class="stfx-btn stfx-btn--ghost" type="button" data-carousel-refresh>Оновити</button>
                <button class="stfx-btn stfx-btn--danger" type="button" data-carousel-clear>Вимкнути карусель</button>
                <button class="stfx-btn stfx-btn--ghost" type="button" data-carousel-reset-index>На початок</button>
              </div>
            </div>
          </div>
        </details>
        <div class="stfx-status" data-status></div>
      </div>
    </div>
  `;
  host.appendChild(section);

  const body = section.querySelector('.design-section__body');
  const header = section.querySelector('.design-section__header');
  header?.addEventListener('click', (ev) => {
    ev.preventDefault();
    const open = !section.classList.contains('is-open');
    section.classList.toggle('is-open', open);
    if (body) body.hidden = !open;
  });
  if (header) ensureTooltip(header);
  attachHoverHelp(section);

  const setStatus = (text) => {
    const el = section.querySelector('[data-status]');
    if (!el) return;
    el.textContent = text || '';
    if (text) setTimeout(() => { if (el.textContent === text) el.textContent = ''; }, 2500);
  };

  section.addEventListener('input', (ev) => {
    if (ev.target?.matches?.('[data-overlay]')) {
      section.querySelector('[data-overlay-out]').textContent = `${ev.target.value}%`;
      setSettingState(section, 'overlay', 'dirty');
      if (section.querySelector('[data-overlay-live]')?.checked) previewOverlay(section, getSelection, ev.target.value);
    }
    if (ev.target?.matches?.('[data-duration]')) {
      const out = section.querySelector('[data-duration-out]');
      if (out) out.textContent = `${ev.target.value} c`;
    }
    if (ev.target?.matches?.('[data-slide-src],[data-slide-link]')) { updateSlideThumbs(section); markSlidesDirtySoon(section, getSelection); }
    if (ev.target?.matches?.('[data-slide-bg]')) {
      updateSlideBgLabels(section);
      const card = ev.target.closest('.stfx-slide');
      if (isSlideBgLive(card)) previewSlideBgForCard(section, getSelection, card, 'draft');
      markSlidesDirtySoon(section, getSelection);
    }
    if (ev.target?.matches?.('[data-carousel-item-bg-src],[data-carousel-item-link],[data-carousel-block-bg]')) {
      const firstNow = collectTargets(getSelection)[0] || null;
      const carouselHostNow = firstNow ? resolveCarouselHost(firstNow) : null;
      const card = ev.target.closest('.stfx-carousel-item');
      const i = Number(ev.target.dataset.carouselItemBgSrc ?? ev.target.dataset.carouselItemLink ?? ev.target.dataset.carouselBlockBgIndex ?? card?.dataset?.carouselItemIndex);
      if (ev.target?.matches?.('[data-carousel-block-bg]')) updateCarouselBlockBgLabels(section);
      if (carouselHostNow && Number.isFinite(i)) {
        applyCarouselItemDraft(section, carouselHostNow, i);
        markCarouselDirtySoon(section, carouselHostNow);
      }
      const thumb = card?.querySelector?.(`[data-carousel-item-thumb="${i}"]`);
      const src = String(card?.querySelector?.(`[data-carousel-item-bg-src="${i}"]`)?.value || '').trim();
      if (thumb) {
        thumb.style.backgroundImage = src ? `url("${src.replace(/"/g, '%22')}")` : '';
        thumb.classList.toggle('has-image', !!src);
      }
    }
    if (ev.target?.matches?.('[data-carousel-size-width],[data-carousel-size-height]')) {
      updateCarouselSizeOutputs(section);
      previewCarouselSizeFromUi(section, getSelection, setStatus);
    }
    if (ev.target?.matches?.('[data-interval]')) setSettingState(section, 'interval', 'dirty');
    if (ev.target?.matches?.('[data-duration]')) setSettingState(section, 'duration', 'dirty');
  });

  section.addEventListener('change', (ev) => {
    if (ev.target?.matches?.('[data-empty-hints]')) {
      setEmptyHintsEnabled(!!ev.target.checked);
      setStatus(ev.target.checked ? 'Підказку порожньої секції увімкнено' : 'Підказку порожньої секції вимкнено');
    }
    if (ev.target?.matches?.('[data-enabled]')) {
      markSlidesDirtySoon(section, getSelection);
      const targetsNow = collectTargets(getSelection);
      const firstNow = targetsNow[0] || null;
      const dirty = hasEnabledDraftChange(section, firstNow);
      setStatus(dirty ? 'Зміна режиму спецефекту ще не застосована' : 'Режим спецефекту відповідає застосованому стану');
    }
    if (ev.target?.matches?.('[data-global-interval]')) setSettingState(section, 'interval', 'dirty');
    if (ev.target?.matches?.('[data-global-duration]')) setSettingState(section, 'duration', 'dirty');
    if (ev.target?.matches?.('[data-global-animation],[data-animation]')) setSettingState(section, 'animation', 'dirty');
    if (ev.target?.matches?.('[data-global-overlay]')) setSettingState(section, 'overlay', 'dirty');
    if (ev.target?.matches?.('[data-slide-bg]')) {
      updateSlideBgLabels(section);
      const card = ev.target.closest('.stfx-slide');
      if (isSlideBgLive(card)) previewSlideBgForCard(section, getSelection, card, 'draft');
      markSlidesDirtySoon(section, getSelection);
    }
    if (ev.target?.matches?.('[data-carousel-block-bg]')) {
      const firstNow = collectTargets(getSelection)[0] || null;
      const carouselHostNow = firstNow ? resolveCarouselHost(firstNow) : null;
      const card = ev.target.closest('.stfx-carousel-item');
      updateCarouselBlockBgLabels(section);
      if (carouselHostNow && card) {
        applyCarouselBlockBgFromCard(section, carouselHostNow, card, { pending: true });
        markCarouselDirtySoon(section, carouselHostNow);
      }
    }
    if (ev.target?.matches?.('[data-carousel-size-preset]')) {
      const key = normalizeCarouselSizePreset(ev.target.value);
      if (key !== 'custom') {
        const preset = CAROUSEL_SIZE_PRESETS[key] || CAROUSEL_SIZE_PRESETS.auto;
        const wEl = section.querySelector('[data-carousel-size-width]');
        const hEl = section.querySelector('[data-carousel-size-height]');
        if (wEl) wEl.value = String(clampNumber(preset.width, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_W, 320));
        if (hEl) hEl.value = String(clampNumber(preset.height, CAROUSEL_SIZE_MIN, CAROUSEL_SIZE_MAX_H, 220));
      }
      updateCarouselSizeOutputs(section);
      previewCarouselSizeFromUi(section, getSelection, setStatus);
      setStatus(key === 'custom' ? 'Власний розмір: налаштуйте повзунками' : `Вибрано пресет розміру: ${CAROUSEL_SIZE_PRESETS[key]?.label || 'Авто'}`);
    }
    if (ev.target?.matches?.('[data-carousel-size-live]') && ev.target.checked) {
      previewCarouselSizeFromUi(section, getSelection, setStatus);
    }
    // 00180: старий checkbox data-carousel-enabled видалений з меню.
    // Обробник більше не потрібний; data-carousel-enabled лишається тільки для сумісності зі старими DOM-снапшотами.
    if (ev.target?.matches?.('[data-overlay-live]') && ev.target.checked) {
      previewOverlay(section, getSelection, section.querySelector('[data-overlay]')?.value || 0);
    }
  });

  let dragSlideFrom = null;
  let dragCarouselFrom = null;

  section.addEventListener('dragstart', (ev) => {
    const carouselHandle = ev.target?.closest?.('[data-carousel-item-drag-handle]');
    if (carouselHandle) {
      const card = carouselHandle.closest('.stfx-carousel-item');
      const list = card?.closest?.('[data-carousel-item-list]');
      if (!card || !list) return;
      dragCarouselFrom = [...list.querySelectorAll('.stfx-carousel-item')].indexOf(card);
      card.classList.add('is-dragging');
      try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(dragCarouselFrom)); } catch (_) {}
      return;
    }
    const handle = ev.target?.closest?.('[data-slide-drag-handle]');
    const card = handle?.closest?.('.stfx-slide');
    const list = card?.closest?.('[data-slide-list]');
    if (!handle || !card || !list) return;
    dragSlideFrom = [...list.querySelectorAll('.stfx-slide')].indexOf(card);
    card.classList.add('is-dragging');
    try {
      ev.dataTransfer.effectAllowed = 'move';
      ev.dataTransfer.setData('text/plain', String(dragSlideFrom));
    } catch (_) {}
  });

  section.addEventListener('dragover', (ev) => {
    const carouselList = ev.target?.closest?.('[data-carousel-item-list]');
    if (carouselList && dragCarouselFrom !== null) {
      ev.preventDefault();
      clearCarouselItemDropMarkers(section, { keepDragging: true });
      const card = ev.target.closest('.stfx-carousel-item');
      if (!card) { carouselList.querySelector('.stfx-carousel-item:last-child')?.classList.add('is-drop-after'); return; }
      const rect = card.getBoundingClientRect();
      const after = ev.clientY > rect.top + rect.height / 2;
      card.classList.add(after ? 'is-drop-after' : 'is-drop-before');
      return;
    }
    const list = ev.target?.closest?.('[data-slide-list]');
    if (!list || dragSlideFrom === null) return;
    ev.preventDefault();
    clearSlideDropMarkers(section, { keepDragging: true });
    const card = ev.target.closest('.stfx-slide');
    if (!card) {
      const last = list.querySelector('.stfx-slide:last-child');
      last?.classList.add('is-drop-after');
      return;
    }
    const rect = card.getBoundingClientRect();
    const after = ev.clientY > rect.top + rect.height / 2;
    card.classList.add(after ? 'is-drop-after' : 'is-drop-before');
  });

  section.addEventListener('drop', (ev) => {
    const carouselList = ev.target?.closest?.('[data-carousel-item-list]');
    if (carouselList && dragCarouselFrom !== null) {
      ev.preventDefault();
      const targetsNow = collectTargets(getSelection);
      const host = targetsNow[0] ? resolveCarouselHost(targetsNow[0]) : null;
      const cards = [...carouselList.querySelectorAll('.stfx-carousel-item')];
      const card = ev.target.closest('.stfx-carousel-item');
      let to = cards.length;
      if (card) {
        const rect = card.getBoundingClientRect();
        const after = ev.clientY > rect.top + rect.height / 2;
        to = cards.indexOf(card) + (after ? 1 : 0);
      }
      if (host && reorderCarouselDomItem(host, dragCarouselFrom, to)) {
        const cfg = readCarouselConfig(host);
        writeCarouselConfig(host, cfg);
        initBlockCarousel(host);
        renderCarouselItemList(carouselList, host, cfg, Math.max(0, Math.min(cards.length - 1, to)));
        persist('block-carousel-item-order');
        setStatus('Порядок блоків каруселі змінено');
      }
      dragCarouselFrom = null;
      clearCarouselItemDropMarkers(section);
      return;
    }
    const list = ev.target?.closest?.('[data-slide-list]');
    if (!list || dragSlideFrom === null) return;
    ev.preventDefault();
    const cards = [...list.querySelectorAll('.stfx-slide')];
    const card = ev.target.closest('.stfx-slide');
    let to = cards.length;
    if (card) {
      const rect = card.getBoundingClientRect();
      const after = ev.clientY > rect.top + rect.height / 2;
      to = cards.indexOf(card) + (after ? 1 : 0);
    }
    const targets = collectFxTargets(getSelection);
    const first = targets[0] || null;
    const cfg = first ? readConfig(first) : defaultFxConfig();
    cfg.slides = moveItem(getUiDraftSlides(section), dragSlideFrom, to);
    cfg.current = Math.min(Number(cfg.current) || 0, Math.max(0, cfg.slides.length - 1));
    renderSlides(list, cfg, getSelectedSlideIndexes(section), getActiveSlideIndex(section));
    markSlidesDirtySoon(section, getSelection);
    clearSlideDropMarkers(section);
    dragSlideFrom = null;
    setStatus('Порядок слайдів змінено');
  });

  section.addEventListener('dragend', () => {
    dragSlideFrom = null;
    dragCarouselFrom = null;
    clearSlideDropMarkers(section);
    clearCarouselItemDropMarkers(section);
  });

  section.addEventListener('click', async (ev) => {
    const targets = collectTargets(getSelection);
    const first = targets[0] || null;
    const fxTargets = collectFxTargets(getSelection);
    const fxFirst = fxTargets[0] || null;
    const carouselHost = first ? resolveCarouselHost(first) : null;

    const runtimeToggleBtn = ev.target.closest('[data-carousel-runtime-toggle]');
    if (runtimeToggleBtn) {
      ev.preventDefault();
      if (!carouselHost) { showBigNotice('СПОЧАТКУ ВИБЕРІТЬ КАРУСЕЛЬ'); return; }
      const cfg = readCarouselConfig(carouselHost);
      cfg.enabled = true;
      cfg.manualPaused = !cfg.manualPaused;
      writeCarouselConfig(carouselHost, cfg);
      if (cfg.manualPaused) stopBlockCarousel(carouselHost);
      initBlockCarousel(carouselHost);
      syncCarouselUi(section, getSelection);
      persist(cfg.manualPaused ? 'block-carousel-manual-pause' : 'block-carousel-manual-play');
      setStatus(cfg.manualPaused ? 'Карусель зупинено. Можна увімкнути ручне прокручування колесом.' : 'Карусель знову запущено.');
      return;
    }

    const wheelToggleBtn = ev.target.closest('[data-carousel-wheel-toggle]');
    if (wheelToggleBtn) {
      ev.preventDefault();
      if (!carouselHost) { showBigNotice('СПОЧАТКУ ВИБЕРІТЬ КАРУСЕЛЬ'); return; }
      const cfg = readCarouselConfig(carouselHost);
      cfg.enabled = true;
      cfg.wheelControl = !cfg.wheelControl;
      writeCarouselConfig(carouselHost, cfg);
      initBlockCarousel(carouselHost);
      syncCarouselUi(section, getSelection);
      persist('block-carousel-wheel-toggle');
      setStatus(cfg.wheelControl
        ? (cfg.manualPaused ? 'Ручне прокручування колесом увімкнено.' : 'Ручне прокручування ввімкнено. Щоб воно працювало, натисни Pause.')
        : 'Ручне прокручування колесом вимкнено.');
      return;
    }

    if (ev.target.closest('[data-carousel-insert]')) {
      ev.preventDefault();
      if (!targets.length) { showBigNotice('СПОЧАТКУ ВИБЕРІТЬ СЕКЦІЮ, КОНТЕЙНЕР АБО БЛОК-КОНТЕЙНЕР, КУДИ ДОДАТИ КАРУСЕЛЬ'); return; }
      targets.forEach(el => {
        const cfg = getUiCarouselConfig(section, defaultCarouselConfig());
        cfg.enabled = true;
        ensureCarouselShellInHost(el, cfg);
      });
      persist('block-carousel-insert-shell');
      syncCarouselUi(section, getSelection);
      setStatus('Окрему карусель додано в активний елемент. Попередні блоки тимчасово сховані.');
      return;
    }

    if (ev.target.closest('[data-carousel-apply]')) {
      ev.preventDefault();
      if (!targets.length) { showBigNotice('СПОЧАТКУ ВИБЕРІТЬ СЕКЦІЮ, КОНТЕЙНЕР АБО КАРУСЕЛЬ'); return; }
      let applied = false;
      const appliedHosts = [];
      targets.forEach(el => {
        const carouselHost = resolveCarouselHost(el);
        if (!carouselHost) return;
        const cfg = getUiCarouselConfig(section, readCarouselConfig(carouselHost));
        cfg.enabled = true;
        writeCarouselConfig(carouselHost, cfg);

        // Якщо користувач був у режимі «Налаштувати дизайн», перед застосуванням
        // прибираємо edit-lock. Інакше initBlockCarousel бачить
        // data-st-carousel-design-editing="1" і залишає карусель зупиненою.
        clearCarouselDesignFocus(carouselHost);
        initBlockCarousel(carouselHost);
        clearPendingCarouselItems(carouselHost);
        updateCarouselDirtyState(section, carouselHost);
        appliedHosts.push(carouselHost);
        applied = true;
      });
      if (!applied) { showBigNotice('У ВИБРАНОМУ ЕЛЕМЕНТІ НЕМАЄ КАРУСЕЛІ. НАТИСНІТЬ «ДОДАТИ КАРУСЕЛЬ В АКТИВНИЙ ЕЛЕМЕНТ».'); return; }
      persist('block-carousel-apply');
      syncCarouselUi(section, getSelection);
      appliedHosts.forEach(hostEl => exitCarouselDesignMode(hostEl, { restart: true, clearSelection: false }));
      clearBuilderSelectionAndActive();
      setStatus('Карусель блоків застосовано. Режим редагування вимкнено, виділення знято.');
      return;
    }

    if (ev.target.closest('[data-carousel-clear],[data-carousel-disable-shell]')) {
      ev.preventDefault();
      if (!targets.length) return;
      let removed = false;
      targets.forEach(el => {
        removed = removeCarouselShellFromHost(el) || removed;
      });
      persist('block-carousel-clear');
      syncCarouselUi(section, getSelection);
      setStatus(removed ? 'Карусель вимкнено. Попередні блоки повернулись на місце.' : 'У вибраному елементі не знайдено карусель.');
      return;
    }

    if (ev.target.closest('[data-carousel-refresh]')) {
      ev.preventDefault();
      syncCarouselUi(section, getSelection);
      bootAllBlockCarousels();
      setStatus('Карусель оновлено');
      return;
    }

    if (ev.target.closest('[data-carousel-reset-index]')) {
      ev.preventDefault();
      targets.forEach(el => {
        const carouselHost = resolveCarouselHost(el);
        if (!carouselHost) return;
        const cfg = readCarouselConfig(carouselHost);
        cfg.current = 0;
        writeCarouselConfig(carouselHost, cfg);
        initBlockCarousel(carouselHost);
      });
      persist('block-carousel-reset-index');
      syncCarouselUi(section, getSelection);
      setStatus('Карусель повернуто на початок');
      return;
    }

    const carouselCard = ev.target.closest('[data-carousel-item-card]');
    if (carouselCard && !ev.target.closest('button,input,select,textarea,label,summary,details,.stfx-carousel-item-extra')) {
      section._stfxCarouselActiveIndex = Number(carouselCard.dataset.carouselItemIndex) || 0;
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, carouselHost ? readCarouselConfig(carouselHost) : defaultCarouselConfig(), section._stfxCarouselActiveIndex);
      return;
    }

    const toggleCarouselExtra = ev.target.closest('[data-toggle-carousel-item-extra]');
    if (toggleCarouselExtra) {
      ev.preventDefault();
      const card = toggleCarouselExtra.closest('.stfx-carousel-item');
      const idx = Number(toggleCarouselExtra.dataset.toggleCarouselItemExtra) || 0;
      const open = !card?.classList?.contains('is-extra-open');
      setCarouselOpenExtraIndex(section, idx, open);
      section.querySelectorAll?.('.stfx-carousel-item.is-extra-open')?.forEach(el => { if (el !== card) el.classList.remove('is-extra-open'); });
      section.querySelectorAll?.('[data-toggle-carousel-item-extra].is-open')?.forEach(btn => { if (btn !== toggleCarouselExtra) { btn.classList.remove('is-open'); btn.textContent = '▼'; } });
      card?.classList?.toggle('is-extra-open', open);
      toggleCarouselExtra.classList.toggle('is-open', open);
      toggleCarouselExtra.textContent = open ? '▲' : '▼';
      section._stfxCarouselActiveIndex = idx;
      return;
    }

    const focusCarouselBg = ev.target.closest('[data-focus-carousel-block-bg]');
    if (focusCarouselBg) {
      ev.preventDefault();
      const idx = Number(focusCarouselBg.dataset.focusCarouselBlockBg) || 0;
      section._stfxCarouselActiveIndex = idx;
      setCarouselOpenExtraIndex(section, idx, true);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, carouselHost ? readCarouselConfig(carouselHost) : defaultCarouselConfig(), idx);
      const card = section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`);
      card?.classList.add('is-extra-open');
      card?.querySelector?.('[data-toggle-carousel-item-extra]')?.classList.add('is-open');
      card?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      setStatus('Відкрито додаткові налаштування картинки блока');
      return;
    }

    const carouselBlockBgLiveBtn = ev.target.closest('[data-carousel-block-bg-live-toggle]');
    if (carouselBlockBgLiveBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) return;
      const card = carouselBlockBgLiveBtn.closest('.stfx-carousel-item');
      const idx = Number(carouselBlockBgLiveBtn.dataset.carouselBlockBgLiveToggle ?? card?.dataset?.carouselItemIndex) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      if (!block || !card) return;
      ensureCarouselItemBgAppliedSnapshot(block);
      const currentlyOn = carouselBlockBgLiveBtn.dataset.liveState !== 'off';
      if (currentlyOn) {
        setCarouselBlockBgLiveState(carouselBlockBgLiveBtn, 'off');
        applyCarouselItemBgVisual(block, getCarouselItemBgAppliedState(block));
        setStatus('Живий перегляд фону блока каруселі вимкнено. Показано останній застосований стан.');
      } else {
        setCarouselBlockBgLiveState(carouselBlockBgLiveBtn, 'on');
        applyCarouselItemBgVisual(block, readCarouselBlockBgFromCard(card));
        setStatus('Живий перегляд фону блока каруселі увімкнено. Чернеткові зміни видно одразу.');
      }
      return;
    }

    const carouselBlockBgResetBtn = ev.target.closest('[data-carousel-block-bg-reset]');
    if (carouselBlockBgResetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) return;
      const card = carouselBlockBgResetBtn.closest('.stfx-carousel-item');
      if (resetCarouselBlockBgToApplied(section, carouselHost, card)) {
        setStatus('Фон блока каруселі повернуто до останнього застосованого стану');
      }
      return;
    }

    const treeSelectBtn = ev.target.closest('[data-carousel-tree-select]');
    if (treeSelectBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) return;
      const el = findCarouselTreeElement(carouselHost, treeSelectBtn.dataset.carouselTreeSelect);
      if (selectCarouselTreeElement(el)) setStatus('Елемент дерева виділено на полотні.');
      return;
    }

    const treeToggleBtn = ev.target.closest('[data-carousel-tree-toggle-visibility],[data-carousel-tree-hide]');
    if (treeToggleBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation?.();
      if (!carouselHost) return;

      const idx = Number(treeToggleBtn.closest('[data-carousel-item-tree]')?.dataset.carouselItemTree ?? section._stfxCarouselActiveIndex ?? 0) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      const uid = treeToggleBtn.dataset.carouselTreeToggleVisibility || treeToggleBtn.dataset.carouselTreeHide || '';
      const el = findCarouselTreeElementScoped(carouselHost, block, uid);
      if (!el) return;

      const isRootCarouselItem = isDirectCarouselBlockItem(carouselHost, el);
      const wasHidden = isCarouselTreeNodeHidden(el);
      const nextHidden = !wasHidden;

      // Важливо: для самого кореневого блока каруселі НЕ ставимо data-st-carousel-tree-hidden.
      // Інакше глобальне CSS-ховання може прибрати його з видимого дерева/картки й виглядає як видалення.
      if (isRootCarouselItem) {
        el.removeAttribute('data-st-carousel-tree-hidden');
        if (nextHidden) el.setAttribute('data-st-carousel-item-paused', '1');
        else el.removeAttribute('data-st-carousel-item-paused');
      } else if (nextHidden) {
        el.setAttribute('data-st-carousel-tree-hidden', '1');
        el.style.setProperty('display', 'none', 'important');
      } else {
        el.removeAttribute('data-st-carousel-tree-hidden');
        el.hidden = false;
        el.style.removeProperty('display');
      }

      if (block) {
        ensureCarouselDesignSession(section, carouselHost, idx, block);
        markCarouselDesignDirty(block, true);
      }

      if (isRootCarouselItem) {
        try { initBlockCarousel(carouselHost); } catch (_) {}
        const card = section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`);
        card?.classList.toggle('is-paused', nextHidden);
        const cardPauseBtn = card?.querySelector?.('[data-toggle-carousel-item-paused]');
        if (cardPauseBtn) {
          cardPauseBtn.classList.toggle('stfx-btn--pause', nextHidden);
          cardPauseBtn.classList.toggle('stfx-btn--play', !nextHidden);
          cardPauseBtn.textContent = nextHidden ? 'Ⅱ' : '▶';
          cardPauseBtn.title = nextHidden ? 'Блок вимкнений — натисни, щоб увімкнути' : 'Блок активний — натисни, щоб поставити на паузу';
        }
      }

      setCarouselOpenExtraIndex(section, idx, true);
      updateCarouselTreeRowVisual(treeToggleBtn.closest('.stfx-carousel-tree-row'), nextHidden);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, readCarouselConfig(carouselHost), idx);
      section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`)?.classList.add('is-extra-open');
      updateCarouselDesignControls(section, carouselHost, idx);
      setStatus(nextHidden ? 'Елемент приховано у блоці, але він лишився в дереві.' : 'Елемент знову показано.');
      return;
    }

    const treeDeleteBtn = ev.target.closest('[data-carousel-tree-delete]');
    if (treeDeleteBtn) {
      if (ev.target.closest('[data-carousel-tree-toggle-visibility],[data-carousel-tree-hide]')) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) return;
      const el = findCarouselTreeElement(carouselHost, treeDeleteBtn.dataset.carouselTreeDelete);
      if (!el) return;
      const idx = Number(treeDeleteBtn.closest('[data-carousel-item-tree]')?.dataset.carouselItemTree ?? section._stfxCarouselActiveIndex ?? 0) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      if (block) {
        ensureCarouselDesignSession(section, carouselHost, idx, block);
        markCarouselDesignDirty(block, true);
      }
      el.remove();
      initBlockCarousel(carouselHost);
      setCarouselOpenExtraIndex(section, idx, true);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, readCarouselConfig(carouselHost), Math.max(0, Math.min(idx, getCarouselAllItems(getCarouselTrack(carouselHost)).length - 1)));
      section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`)?.classList.add('is-extra-open');
      updateCarouselDesignControls(section, carouselHost, idx);
      setStatus('Елемент видалено з дерева блока.');
      return;
    }

    const designCancelBtn = ev.target.closest('[data-carousel-item-design-cancel]');
    if (designCancelBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) return;
      const idx = Number(designCancelBtn.dataset.carouselItemDesignCancel) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      cancelCarouselDesignSession(section, carouselHost, idx, block, setStatus);
      setCarouselOpenExtraIndex(section, idx, true);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, readCarouselConfig(carouselHost), idx);
      section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`)?.classList.add('is-extra-open');
      updateCarouselDesignControls(section, carouselHost, idx);
      return;
    }

    const designPreviewBtn = ev.target.closest('[data-carousel-item-design-preview]');
    if (designPreviewBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) return;
      const idx = Number(designPreviewBtn.dataset.carouselItemDesignPreview) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      toggleCarouselDesignPreview(section, carouselHost, idx, block, setStatus);
      setCarouselOpenExtraIndex(section, idx, true);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, readCarouselConfig(carouselHost), idx);
      section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`)?.classList.add('is-extra-open');
      updateCarouselDesignControls(section, carouselHost, idx);
      return;
    }

    const designCarouselItem = ev.target.closest('[data-carousel-item-design]');
    if (designCarouselItem) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!carouselHost) { showBigNotice('СПОЧАТКУ ДОДАЙТЕ АБО ВИБЕРІТЬ КАРУСЕЛЬ'); return; }
      const idx = Number(designCarouselItem.dataset.carouselItemDesign) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      const session = getCarouselDesignSession(block);
      const buttonAsSave = designCarouselItem.classList.contains('is-dirty')
        || String(designCarouselItem.textContent || '').trim().includes('Зберегти');
      if (session?.dirty || buttonAsSave) {
        commitCarouselDesignSession(section, carouselHost, idx, block, setStatus);
        setCarouselOpenExtraIndex(section, idx, true);
        renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, readCarouselConfig(carouselHost), idx);
        section.querySelector(`.stfx-carousel-item[data-carousel-item-index="${idx}"]`)?.classList.add('is-extra-open');
        updateCarouselDesignControls(section, carouselHost, idx);
        return;
      }
      enterCarouselItemDesignMode(section, carouselHost, idx, setStatus);
      return;
    }

    const toggleCarouselPaused = ev.target.closest('[data-toggle-carousel-item-paused],[data-toggle-carousel-item-select]');
    if (toggleCarouselPaused) {
      ev.preventDefault();
      if (!carouselHost) return;
      const idx = Number(toggleCarouselPaused.dataset.toggleCarouselItemPaused ?? toggleCarouselPaused.dataset.toggleCarouselItemSelect) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      if (!block) return;
      const nextPaused = !isCarouselItemPaused(block);
      if (nextPaused) block.setAttribute('data-st-carousel-item-paused', '1');
      else block.removeAttribute('data-st-carousel-item-paused');
      section._stfxCarouselActiveIndex = idx;
      initBlockCarousel(carouselHost);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, carouselHost ? readCarouselConfig(carouselHost) : defaultCarouselConfig(), idx);
      persist('block-carousel-item-pause');
      setStatus(nextPaused ? 'Блок вимкнено у каруселі' : 'Блок знову активний у каруселі');
      return;
    }

    const removeCarouselItem = ev.target.closest('[data-remove-carousel-item]');
    if (removeCarouselItem) {
      ev.preventDefault();
      if (!carouselHost) return;
      const idx = Number(removeCarouselItem.dataset.removeCarouselItem) || 0;
      const block = getCarouselItemByIndex(carouselHost, idx);
      if (!block) return;
      block.remove();
      initBlockCarousel(carouselHost);
      setCarouselOpenExtraIndex(section, Math.max(0, idx - 1), false);
      renderCarouselItemList(section.querySelector('[data-carousel-item-list]'), carouselHost, carouselHost ? readCarouselConfig(carouselHost) : defaultCarouselConfig(), Math.max(0, idx - 1));
      updateCarouselDirtyState(section, carouselHost);
      persist('block-carousel-item-remove');
      setStatus('Блок видалено з контейнера каруселі');
      return;
    }

    const pickCarouselMultiple = ev.target.closest('[data-carousel-pick-multiple]');
    if (pickCarouselMultiple) {
      ev.preventDefault();
      if (!carouselHost) { showBigNotice('СПОЧАТКУ ДОДАЙТЕ АБО ВИБЕРІТЬ КАРУСЕЛЬ'); return; }
      try {
        await openGalleryModal({
          cat: 'images',
          folderId: 'static_sys_backgrounds',
          pickerMode: true,
          view: 'big',
          onPick: (payload) => {
            const picked = Array.isArray(payload?.items) && payload.items.length ? payload.items : [payload];
            const urls = picked.map(item => String(item?.url || '').trim()).filter(Boolean);
            applyCarouselPickedUrls(section, carouselHost, 0, urls, setStatus);
          }
        });
      } catch (e) {
        console.warn('[special-effects] carousel multi gallery pick failed:', e);
        setStatus('Не вдалося відкрити галерею');
      }
      return;
    }

    const pickCarouselItem = ev.target.closest('[data-pick-carousel-item]');
    if (pickCarouselItem) {
      ev.preventDefault();
      if (!carouselHost) { showBigNotice('СПОЧАТКУ ДОДАЙТЕ КАРУСЕЛЬ В АКТИВНИЙ ЕЛЕМЕНТ'); return; }
      const idx = Number(pickCarouselItem.dataset.pickCarouselItem) || 0;
      try {
        await openGalleryModal({
          cat: 'images',
          folderId: 'static_sys_backgrounds',
          pickerMode: true,
          view: 'big',
          onPick: (payload) => {
            const picked = Array.isArray(payload?.items) && payload.items.length ? payload.items : [payload];
            const urls = picked.map(item => String(item?.url || '').trim()).filter(Boolean);
            if (!urls.length) { setStatus('Галерея не повернула шлях картинки'); return; }
            applyCarouselPickedUrls(section, carouselHost, idx, urls, setStatus);
          }
        });
      } catch (e) {
        console.warn('[special-effects] carousel item gallery pick failed:', e);
        setStatus('Не вдалося відкрити галерею');
      }
      return;
    }

    const applySettingBtn = ev.target.closest('[data-apply-setting]');
    if (applySettingBtn) {
      ev.preventDefault();
      applySingleSetting(section, applySettingBtn.dataset.applySetting, getSelection, setStatus);
      return;
    }

    const cancelSettingBtn = ev.target.closest('[data-cancel-setting]');
    if (cancelSettingBtn) {
      ev.preventDefault();
      const settingName = cancelSettingBtn.dataset.cancelSetting;
      restoreSetting(section, settingName);
      if (settingName === 'overlay') previewOverlay(section, getSelection, section.querySelector('[data-overlay]')?.value || 0);
      setStatus('Зміни скасовано');
      return;
    }

    const focusAnimationBtn = ev.target.closest('[data-focus-animation-slide]');
    if (focusAnimationBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const index = Number(focusAnimationBtn.dataset.focusAnimationSlide);
      if (Number.isFinite(index) && index >= 0) activateWidgetSlide00992(section, getSelection, index);
      const cfg = fxFirst ? readConfig(fxFirst) : defaultFxConfig();
      const value = getSlideAnimation(cfg, index);
      const global = section.querySelector('[data-global-animation]');
      const select = section.querySelector('[data-animation]');
      if (global) global.checked = false;
      if (select) select.value = value;
      setSettingState(section, 'animation', 'dirty');
      const row = section.querySelector('[data-setting-row="animation"]');
      row?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      window.setTimeout(() => {
        try { select?.focus?.({ preventScroll: true }); } catch (_) { select?.focus?.(); }
        try { select?.showPicker?.(); } catch (_) {}
      }, 180);
      setStatus('Слайд активовано. Вибери новий тип переходу і натисни ✓');
      return;
    }

    const selectSlideBtn = ev.target.closest('[data-toggle-slide-select]');
    if (selectSlideBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const card = selectSlideBtn.closest('.stfx-slide');
      const on = selectSlideBtn.getAttribute('aria-pressed') !== 'true';
      selectSlideBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      card?.classList.toggle('is-selected', on);
      const index = Number(selectSlideBtn.dataset.toggleSlideSelect);
      activateWidgetSlide00992(section, getSelection, index);
      setStatus(`Активовано слайд ${index + 1} на банері`);
      return;
    }

    const slideCard = ev.target.closest('.stfx-slide');
    if (slideCard && !ev.target.closest('button,input,select,textarea')) {
      const index = Number(slideCard.dataset.slideIndex);
      activateWidgetSlide00992(section, getSelection, index);
      setStatus(`Активовано слайд ${index + 1} на банері`);
      return;
    }

    if (ev.target.closest('[data-add-slide]')) {
      ev.preventDefault();
      const cfg = fxFirst ? readConfig(fxFirst) : defaultFxConfig();
      const draftSlides = getUiDraftSlides(section);
      cfg.slides = draftSlides.length ? draftSlides : cfg.slides;
      cfg.slides.push({ src: '', link: '', alt: '' });
      renderSlides(section.querySelector('[data-slide-list]'), cfg, getSelectedSlideIndexes(section), cfg.slides.length - 1);
      setActiveSlide(section, cfg.slides.length - 1);
      markSlidesDirtySoon(section, getSelection);
      setStatus('Додано новий слайд');
      return;
    }

    const extraBtn = ev.target.closest('[data-toggle-slide-extra]');
    if (extraBtn) {
      ev.preventDefault();
      const card = extraBtn.closest('.stfx-slide');
      const open = !card?.classList?.contains('is-extra-open');
      card?.classList?.toggle('is-extra-open', open);
      extraBtn.classList.toggle('is-open', open);
      extraBtn.textContent = open ? '▲' : '▼';
      return;
    }

    const bgLiveBtn = ev.target.closest('[data-slide-bg-live-toggle]');
    if (bgLiveBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const card = bgLiveBtn.closest('.stfx-slide');
      const currentlyOn = bgLiveBtn.dataset.liveState !== 'off';
      if (currentlyOn) {
        setSlideBgLiveState(bgLiveBtn, 'off');
        previewSlideBgForCard(section, getSelection, card, 'applied');
        setStatus('Живий перегляд фону слайда вимкнено. Показано останній застосований стан.');
      } else {
        setSlideBgLiveState(bgLiveBtn, 'on');
        previewSlideBgForCard(section, getSelection, card, 'draft');
        setStatus('Живий перегляд фону слайда увімкнено. Чернеткові зміни видно одразу.');
      }
      return;
    }

    const bgResetBtn = ev.target.closest('[data-slide-bg-reset]');
    if (bgResetBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const card = bgResetBtn.closest('.stfx-slide');
      resetSlideBgToApplied(section, getSelection, card);
      markSlidesDirtySoon(section, getSelection);
      setStatus('Фон слайда повернуто до останнього застосованого стану');
      return;
    }

    const pauseBtn = ev.target.closest('[data-toggle-slide-paused]');
    if (pauseBtn) {
      ev.preventDefault();
      ev.stopPropagation();
      const requestedIndex = Number(pauseBtn.dataset.toggleSlidePaused);
      if (!fxTargets.length) {
        setStatus('Спочатку вибери банер зі слайдером');
        return;
      }

      // 00992 contract: this button pauses/resumes the WHOLE slideshow runtime.
      // It never disables a single slide and never persists/root-saves editor pause state.
      // First activate the card whose button was pressed, so pause locks that exact slide
      // and resume continues from the exact preview the user sees.
      if (Number.isFinite(requestedIndex) && requestedIndex >= 0) {
        activateWidgetSlide00992(section, getSelection, requestedIndex, { immediate: true });
      }

      const liveFirst = ensureSliderRuntime00992(fxTargets[0]);
      const nextPaused = !isSliderManualPaused00992(liveFirst);
      fxTargets.forEach((rawHost) => {
        const host = ensureSliderRuntime00992(rawHost);
        if (!(host instanceof HTMLElement)) return;
        const controller = sliderRuntimeControllers00992.get(host);
        if (controller) controller.setManualPaused(nextPaused);
        else setSliderManualPaused00992(host, nextPaused);
      });

      setSliderPauseUi00992(section, nextPaused);
      setStatus(nextPaused
        ? 'Показ зупинено на поточному слайді. Можна редагувати.'
        : 'Показ продовжено з поточного слайда.');
      return;
    }

    const removeBtn = ev.target.closest('[data-remove-slide]');
    if (removeBtn) {
      ev.preventDefault();
      const cfg = fxFirst ? readConfig(fxFirst) : defaultFxConfig();
      cfg.slides = getUiDraftSlides(section);
      const i = Number(removeBtn.dataset.removeSlide);
      cfg.slides.splice(i, 1);
      if (!cfg.slides.length) cfg.slides.push({ src: '', link: '', alt: '' });
      renderSlides(section.querySelector('[data-slide-list]'), cfg, getSelectedSlideIndexes(section).filter(n => n !== i), Math.min(i, cfg.slides.length - 1));
      markSlidesDirtySoon(section, getSelection);
      setStatus('Слайд видалено');
      return;
    }

    const pickBtn = ev.target.closest('[data-pick-slide]');
    if (pickBtn) {
      ev.preventDefault();
      const i = Number(pickBtn.dataset.pickSlide);
      try {
        await openGalleryModal({
          cat: 'images',
          folderId: 'static_sys_backgrounds',
          pickerMode: true,
          view: 'big',
          onPick: (payload) => {
            const picked = Array.isArray(payload?.items) && payload.items.length ? payload.items : [payload];
            const urls = picked.map(item => String(item?.url || '').trim()).filter(Boolean);
            if (!urls.length) { setStatus('Галерея не повернула шлях картинки'); return; }

            const cfg = fxFirst ? readConfig(fxFirst) : defaultFxConfig();
            const draftSlides = getUiDraftSlides(section);
            cfg.slides = draftSlides.length ? draftSlides : (cfg.slides?.length ? cfg.slides : [{ src: '', link: '', alt: '' }]);
            const index = Math.max(0, Math.min(Number(i) || 0, Math.max(0, cfg.slides.length - 1)));
            const makeSlide = (url, base = {}) => Object.assign({}, base || {}, { src: url, alt: base?.alt || '', paused: base?.paused === true });

            if (urls.length === 1) {
              cfg.slides[index] = makeSlide(urls[0], cfg.slides[index]);
            } else {
              const firstSlide = makeSlide(urls[0], cfg.slides[index]);
              const extraSlides = urls.slice(1).map(url => makeSlide(url, {}));
              cfg.slides.splice(index, 1, firstSlide, ...extraSlides);
            }

            renderSlides(section.querySelector('[data-slide-list]'), cfg, getSelectedSlideIndexes(section), index);
            setActiveSlide(section, index);
            markSlidesDirtySoon(section, getSelection);
            const count = urls.length;
            setStatus(count > 1 ? `Додано ${count} картинок у слайди. Натисни Застосувати.` : 'Картинку слайда вибрано. Натисни Застосувати.');
          }
        });
      } catch (e) {
        console.warn('[special-effects] gallery pick failed:', e);
        setStatus('Не вдалося відкрити галерею');
      }
      return;
    }

    if (ev.target.closest('[data-refresh-fx]')) {
      ev.preventDefault();
      syncUi(section, getSelection);
      setStatus('Оновлено');
      return;
    }

    if (ev.target.closest('[data-apply-fx]')) {
      ev.preventDefault();
      if (!fxTargets.length) { setStatus('Спочатку вибери секцію / контейнер / блок'); return; }
      fxTargets.forEach(el => {
        const cfg = getUiConfig(section, readConfig(el));
        if (cfg.enabled && cfg.slides.length) {
          saveFillBeforeFx(el);
          suspendFillForFx(el);
          cfg.enabled = true;
          writeConfig(el, cfg);
          initBackgroundFx(el);
        } else {
          const keepCfg = Object.assign(defaultFxConfig(), cfg);
          keepCfg.enabled = false;
          writeConfig(el, keepCfg);
          restoreFillAfterFx(el);
        }
      });
      persist('special-effects-apply');
      setStatus(section.querySelector('[data-enabled]')?.checked ? 'Спецефект застосовано' : 'Спецефект вимкнено. Повернуто фон із Заливки.');
      syncUi(section, getSelection);
      return;
    }

    if (ev.target.closest('[data-clear-fx]')) {
      ev.preventDefault();
      if (!fxTargets.length) return;
      fxTargets.forEach(el => {
        setSliderManualPaused00992(el, false);
        restoreFillAfterFx(el);
        el.removeAttribute('data-st-fx-bg-slider');
        delete el.dataset.stFxCurrentLink;
        cleanupRuntime(el);
      });
      persist('special-effects-clear');
      setStatus('Спецефект вимкнено. Повернуто фон із Заливки.');
      syncUi(section, getSelection);
      return;
    }

    if (ev.target.closest('[data-bind-to-slide]')) {
      ev.preventDefault();
      const el = first;
      if (!el) return;
      const host = findSliderHost(el.parentElement);
      if (!host) { setStatus('Вибери блок всередині елемента зі слайдером'); return; }
      const n = Math.max(1, Number(section.querySelector('[data-bind-slide]')?.value || 1));
      el.setAttribute('data-st-fx-bind-slide', String(n));
      updateBoundChildren(host, readConfig(host).current || 0);
      persist('special-effects-bind-slide');
      setStatus(`Блок привʼязано до слайда ${n}`);
      return;
    }

    if (ev.target.closest('[data-bind-static]')) {
      ev.preventDefault();
      const el = first;
      if (!el) return;
      const host = findSliderHost(el.parentElement);
      el.removeAttribute('data-st-fx-bind-slide');
      if (host) updateBoundChildren(host, readConfig(host).current || 0);
      persist('special-effects-bind-static');
      setStatus('Блок показується завжди');
      return;
    }
  });

  try {
    window.ST_BLOCK_CAROUSEL_REFRESH = bootAllBlockCarousels;
    window.removeEventListener?.('st:block-carousel:refresh', window.__ST_BLOCK_CAROUSEL_REFRESH_HANDLER__ || (() => {}));
    window.__ST_BLOCK_CAROUSEL_REFRESH_HANDLER__ = () => setTimeout(() => { bootAllBlockCarousels(); syncUi(section, getSelection); }, 30);
    window.addEventListener('st:block-carousel:refresh', window.__ST_BLOCK_CAROUSEL_REFRESH_HANDLER__);
  } catch(_) {}

  document.addEventListener('st:selection-changed', (event) => {
    const selected = getDirectSelectedTarget00990(event, getSelection);
    openBackgroundSliderEditor00990(section, selected);
    syncUi(section, getSelection);
  });
  window.addEventListener('st:canvas-snapshot-applied', () => setTimeout(() => {
    document.querySelectorAll('[data-st-fx-bg-slider]').forEach(initBackgroundFx);
    bootAllBlockCarousels();
    syncUi(section, getSelection);
  }, 50));
  // 00990: Main/Header/Footer templates are rendered from SiteFrameStore after
  // the widget has already booted. Rehydrate authored slider attributes on the
  // explicit template-apply event instead of relying on an observer/timer repair.
  const onTemplatesApplied00990 = () => {
    document.querySelectorAll('[data-st-fx-bg-slider]').forEach(initBackgroundFx);
    bootAllBlockCarousels();
    syncUi(section, getSelection);
  };
  window.addEventListener('st:templates-applied', onTemplatesApplied00990);

  // 01016: SiteFrameStore may rebuild Main after a structural edit such as deleting
  // a text child. The rebuilt DOM contains the canonical authored slider config but
  // no runtime layers/classes. Rehydrate immediately after the workspace announces
  // that final rebuild. This is an explicit event contract, not an observer/timer patch.
  try {
    if (window.__ST_MAIN_DOM_FX_REHYDRATE_HANDLER_01016__) {
      window.removeEventListener('st:site-frame-main-dom-rendered', window.__ST_MAIN_DOM_FX_REHYDRATE_HANDLER_01016__);
    }
    window.__ST_MAIN_DOM_FX_REHYDRATE_HANDLER_01016__ = (event) => {
      const reason = event?.detail?.reason || 'site-frame-main-dom-rendered';
      rehydrateMainRuntimeFx01016(reason);
      syncUi(section, getSelection);
    };
    window.addEventListener('st:site-frame-main-dom-rendered', window.__ST_MAIN_DOM_FX_REHYDRATE_HANDLER_01016__);
    window.ST_REHYDRATE_MAIN_RUNTIME_FX_01016 = rehydrateMainRuntimeFx01016;
  } catch (_) {}

  window.addEventListener('DOMContentLoaded', () => setTimeout(() => { document.querySelectorAll('[data-st-fx-bg-slider]').forEach(initBackgroundFx); bootAllBlockCarousels(); }, 100));
  setTimeout(() => { document.querySelectorAll('[data-st-fx-bg-slider]').forEach(initBackgroundFx); bootAllBlockCarousels(); }, 100);
  bootAllBlockCarousels();
  syncUi(section, getSelection);
}
