// js/global-design/style-store.js
// [00687] Єдине сховище стилів: Global / AI / Design -> Resolver -> CSS variables + runtime hover tokens.
// Жоден віджет не має напряму конфліктно фарбувати DOM: він пише patch у цей store.

import { ST_GLOBAL_DESIGN_PRESETS, getGlobalDesignPresetById, getGlobalTypographyPresetById, getGlobalSpacingPresetById } from './style-presets.js';

const LS_KEY = 'st_global_style_store_v1';
const VERSION = 'st-global-style-store-v1-00684';
const SOURCES = ['global', 'ai', 'design'];

// [00702] Color/performance guard.
// Live dragging of color/range controls must update CSS tokens, but it must not write
// localStorage, dispatch heavy global events, or resync the whole Global Design panel
// on every browser input tick. Final change still saves normally.
const LIVE_APPLY_MIN_INTERVAL_MS_00702 = 34;
const LIVE_SAVE_DEBOUNCE_MS_00702 = 420;
let runtimeStoreCache00702_ = null;
let liveApplyTimer00702_ = 0;
let liveSaveTimer00702_ = 0;
let livePendingPatch00702_ = null;
let liveLastApplyAt00702_ = 0;
let liveLastDiagAt00702_ = 0;
let liveBurstCount00702_ = 0;

function perfNow00702_() {
  try { return performance.now(); } catch (_) { return Date.now(); }
}
function isLiveReason00702_(reason) {
  return /(?:^|[-:])live(?:[-:]|$)/i.test(String(reason || ''));
}
function logPerf00702_(event, detail = {}, level = 'info') {
  try { window.__ST_PERF_DIAG__?.push?.(event, Object.assign({ widget: 'global-style-store', fix: '00702' }, detail || {}), level); } catch (_) {}
  try {
    if (level === 'warn') console.warn('[00702][global-style-store]', event, detail || {});
    else if (level === 'error') console.error('[00702][global-style-store]', event, detail || {});
    else console.info('[00702][global-style-store]', event, detail || {});
  } catch (_) {}
}

function clone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (_) { return v; } }
function isObj(v) { return !!(v && typeof v === 'object' && !Array.isArray(v)); }
function deepMerge(base, patch) {
  const out = clone(base || {}) || {};
  if (!isObj(patch)) return out;
  Object.entries(patch).forEach(([k, v]) => {
    if (isObj(v) && isObj(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = clone(v);
  });
  return out;
}
function safeParse(raw, fallback) { try { return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } }
function normalizeSource(source) { return SOURCES.includes(String(source || '').trim()) ? String(source || '').trim() : 'global'; }
function now() { return Date.now(); }

function defaultAiStyle_() {
  return {
    presetId: 'ai-generated-demo-00684',
    colors: { primary: '#312e81', accent: '#06b6d4', surface: '#eef2ff', surface2: '#e0f2fe', text: '#111827', muted: '#475569', border: '#bae6fd' },
    radius: { sm: '12px', md: '20px', lg: '32px', pill: '999px' },
    shadow: { soft: '0 18px 44px rgba(49,46,129,.16)', md: '0 30px 80px rgba(6,182,212,.20)' },
    buttons: { fill: 'linear-gradient(135deg,#312e81,#06b6d4)', text: '#ffffff', border: '1px solid rgba(6,182,212,.24)' },
    sections: { bg: '#eef2ff', altBg: '#e0f2fe' },
    blocks: { bg: '#ffffff', border: '1px solid #bae6fd' },
    typography: { font: 'Manrope, Inter, Arial, sans-serif', headingWeight: '950', textWeight: '700' }
  };
}

function defaultDesignStyle_() {
  // Ручний дизайн спочатку пустий: бере fallback із global, поки користувач не змінить конкретні поля.
  return { presetId: 'manual-design-00684' };
}

function defaultSpacing_() {
  const preset = getGlobalSpacingPresetById('density-standard');
  return clone(preset?.spacing || {
    densityPresetId: 'density-standard',
    sectionPaddingY: '24px',
    sectionPaddingX: '24px',
    containerPadding: '0px',
    blockPaddingY: '10px',
    blockPaddingX: '14px',
    levelGap: '14px',
    containerGap: '12px',
    blockGap: '8px',
    menuGap: '8px'
  });
}

function borderFromParts_(width, color, fallbackColor = '#e2e8f0') {
  const w = String(width || '0px').trim() || '0px';
  const c = String(color || fallbackColor || 'transparent').trim() || 'transparent';
  return `${w} solid ${w === '0px' ? 'transparent' : c}`;
}

function defaultSections_(theme = {}) {
  const c = theme.colors || {};
  return {
    bg: c.surface || '#ffffff',
    altBg: c.surface2 || '#f8fafc',
    borderColor: c.border || '#e2e8f0',
    borderWidth: '0px',
    border: '0px solid transparent',
    radius: '0px',
    shadow: 'none',
    overlay: 'none',
    minHeight: '0px',
    maxWidth: '100%'
  };
}

function defaultContainers_(theme = {}) {
  const c = theme.colors || {};
  const r = theme.radius || {};
  return {
    bg: 'transparent',
    altBg: c.surface2 || '#f8fafc',
    borderColor: c.border || '#e2e8f0',
    borderWidth: '0px',
    border: '0px solid transparent',
    radius: r.md || '16px',
    shadow: 'none',
    overlay: 'none',
    minHeight: '0px',
    maxWidth: '100%'
  };
}

function defaultBlocks_(theme = {}) {
  const c = theme.colors || {};
  const r = theme.radius || {};
  return {
    bg: c.surface || '#ffffff',
    altBg: c.surface2 || '#f8fafc',
    borderColor: c.border || '#e2e8f0',
    borderWidth: '1px',
    border: `1px solid ${c.border || '#e2e8f0'}`,
    radius: r.md || '16px',
    shadow: 'none',
    hoverShadow: 'none',
    hoverLift: '0px',
    overlay: 'none',
    minHeight: '0px',
    maxWidth: '100%'
  };
}


function defaultButtons_(theme = {}) {
  const c = theme.colors || {};
  const r = theme.radius || {};
  const sh = theme.shadow || {};
  const b = theme.buttons || {};
  const primaryBg = b.primaryBg || b.fill || c.primary || '#2563eb';
  const primaryText = b.primaryText || b.text || '#ffffff';
  const primaryBorderColor = b.primaryBorderColor || b.borderColor || c.accent || c.primary || '#2563eb';
  const primaryBorderWidth = b.primaryBorderWidth || b.borderWidth || '1px';
  return {
    fill: primaryBg,
    text: primaryText,
    borderWidth: primaryBorderWidth,
    borderColor: primaryBorderColor,
    border: b.primaryBorder || b.border || `${primaryBorderWidth} solid ${primaryBorderColor}`,
    primaryBg,
    primaryText,
    primaryBorderWidth,
    primaryBorderColor,
    primaryBorder: b.primaryBorder || b.border || `${primaryBorderWidth} solid ${primaryBorderColor}`,
    primaryHoverBg: b.primaryHoverBg || b.hoverFill || c.accent || primaryBg,
    primaryHoverText: b.primaryHoverText || b.hoverText || primaryText,
    primaryHoverBorderColor: b.primaryHoverBorderColor || b.hoverBorder || primaryBorderColor,
    primaryActiveBg: b.primaryActiveBg || c.primary || primaryBg,
    primaryActiveText: b.primaryActiveText || primaryText,
    primaryDisabledBg: b.primaryDisabledBg || '#cbd5e1',
    primaryDisabledText: b.primaryDisabledText || '#64748b',
    secondaryBg: b.secondaryBg || c.surface || '#ffffff',
    secondaryText: b.secondaryText || c.primary || '#2563eb',
    secondaryBorderWidth: b.secondaryBorderWidth || '1px',
    secondaryBorderColor: b.secondaryBorderColor || c.border || '#e2e8f0',
    secondaryHoverBg: b.secondaryHoverBg || c.surface2 || '#f8fafc',
    secondaryHoverText: b.secondaryHoverText || c.primary || '#2563eb',
    ghostBg: b.ghostBg || 'transparent',
    ghostText: b.ghostText || c.text || '#111827',
    ghostBorderWidth: b.ghostBorderWidth || '0px',
    ghostBorderColor: b.ghostBorderColor || 'transparent',
    ghostHoverBg: b.ghostHoverBg || (c.accent ? rgba_(c.accent, .10) : 'rgba(14,165,233,.10)'),
    ghostHoverText: b.ghostHoverText || c.accent || c.primary || '#0ea5e9',
    iconBg: b.iconBg || (c.accent ? rgba_(c.accent, .12) : 'rgba(14,165,233,.12)'),
    iconText: b.iconText || c.accent || c.primary || '#0ea5e9',
    iconBorderWidth: b.iconBorderWidth || '1px',
    iconBorderColor: b.iconBorderColor || (c.accent ? rgba_(c.accent, .30) : '#bae6fd'),
    iconHoverBg: b.iconHoverBg || c.accent || '#0ea5e9',
    iconHoverText: b.iconHoverText || '#ffffff',
    radius: b.radius || r.pill || '999px',
    iconRadius: b.iconRadius || r.md || '16px',
    shadow: b.shadow || sh.soft || '0 14px 34px rgba(15,23,42,.08)',
    hoverShadow: b.hoverShadow || sh.md || b.shadow || sh.soft || '0 22px 60px rgba(15,23,42,.14)',
    activeShadow: b.activeShadow || 'inset 0 2px 8px rgba(15,23,42,.18)',
    disabledOpacity: b.disabledOpacity || '0.55'
  };
}

function defaultMenu_(theme = {}) {
  const c = theme.colors || {};
  const r = theme.radius || {};
  const menu = theme.menu || {};
  return {
    text: menu.text || c.text || '#111827',
    hoverText: menu.hoverText || c.accent || c.primary || '#0ea5e9',
    activeText: menu.activeText || c.primary || '#2563eb',
    itemBg: menu.itemBg || 'transparent',
    hoverBg: menu.hoverBg || (c.accent ? rgba_(c.accent, .10) : 'rgba(14,165,233,.10)'),
    activeBg: menu.activeBg || (c.primary ? rgba_(c.primary, .12) : 'rgba(37,99,235,.12)'),
    itemBorderWidth: menu.itemBorderWidth || menu.borderWidth || '0px',
    itemBorderColor: menu.itemBorderColor || c.border || '#e2e8f0',
    hoverBorderColor: menu.hoverBorderColor || c.accent || c.primary || '#0ea5e9',
    activeBorderColor: menu.activeBorderColor || c.primary || '#2563eb',
    radius: menu.radius || r.pill || '999px',
    underlineHeight: menu.underlineHeight || '2px',
    underlineOffset: menu.underlineOffset || '5px',
    indicatorStyle: menu.indicatorStyle || 'background',
    burgerBg: menu.burgerBg || (c.accent ? rgba_(c.accent, .12) : 'rgba(14,165,233,.12)'),
    burgerColor: menu.burgerColor || c.text || '#111827',
    burgerRadius: menu.burgerRadius || r.md || '16px',
    mobileBg: menu.mobileBg || c.surface || '#ffffff'
  };
}

function defaultLinks_(theme = {}) {
  const c = theme.colors || {};
  const links = theme.links || {};
  return {
    color: links.color || c.primary || '#2563eb',
    hoverColor: links.hoverColor || c.accent || c.primary || '#0ea5e9',
    activeColor: links.activeColor || c.primary || '#2563eb',
    visitedColor: links.visitedColor || c.primary || '#2563eb',
    underline: links.underline || 'none',
    underlineHover: links.underlineHover || 'underline',
    underlineOffset: links.underlineOffset || '3px',
    underlineThickness: links.underlineThickness || '1px'
  };
}

function normalizeActionTokens_(theme) {
  const out = clone(theme || {}) || {};
  out.buttons = deepMerge(defaultButtons_(out), out.buttons || {});
  out.menu = deepMerge(defaultMenu_(out), out.menu || {});
  out.links = deepMerge(defaultLinks_(out), out.links || {});
  return out;
}

function normalizeStructuralTokens_(theme) {
  const out = clone(theme || {}) || {};
  out.colors = Object.assign({}, out.colors || {});
  out.radius = Object.assign({}, out.radius || {});
  out.shadow = Object.assign({}, out.shadow || {});

  out.sections = deepMerge(defaultSections_(out), out.sections || {});
  out.containers = deepMerge(defaultContainers_(out), out.containers || {});
  out.blocks = deepMerge(defaultBlocks_(out), out.blocks || {});

  out.sections.borderWidth = out.sections.borderWidth || '0px';
  out.sections.borderColor = out.sections.borderColor || out.colors.border || '#e2e8f0';
  out.sections.border = out.sections.border || borderFromParts_(out.sections.borderWidth, out.sections.borderColor);

  out.containers.borderWidth = out.containers.borderWidth || '0px';
  out.containers.borderColor = out.containers.borderColor || out.colors.border || '#e2e8f0';
  out.containers.border = out.containers.border || borderFromParts_(out.containers.borderWidth, out.containers.borderColor);

  out.blocks.borderWidth = out.blocks.borderWidth || '1px';
  out.blocks.borderColor = out.blocks.borderColor || out.colors.border || '#e2e8f0';
  out.blocks.border = out.blocks.border || borderFromParts_(out.blocks.borderWidth, out.blocks.borderColor, out.colors.border || '#e2e8f0');
  return normalizeActionTokens_(out);
}

function defaultStore() {
  let preset = clone(getGlobalDesignPresetById('light-clean')) || {};
  preset.spacing = deepMerge(defaultSpacing_(), preset.spacing || {});
  preset = normalizeStructuralTokens_(preset);
  return {
    version: VERSION,
    activeSource: 'global',
    global: preset || {},
    ai: defaultAiStyle_(),
    design: defaultDesignStyle_(),
    overrides: {},
    history: [],
    updatedAt: now()
  };
}

function normalizeStore(st) {
  const def = defaultStore();
  const out = isObj(st) ? deepMerge(def, st) : def;
  out.version = VERSION;
  out.activeSource = normalizeSource(out.activeSource);
  if (!isObj(out.global)) out.global = clone(def.global);
  if (!isObj(out.global.spacing)) out.global.spacing = defaultSpacing_();
  else out.global.spacing = deepMerge(defaultSpacing_(), out.global.spacing);
  out.global = normalizeStructuralTokens_(out.global);
  if (!isObj(out.ai)) out.ai = defaultAiStyle_();
  if (!isObj(out.design)) out.design = defaultDesignStyle_();
  if (!isObj(out.overrides)) out.overrides = {};
  if (!Array.isArray(out.history)) out.history = [];
  return out;
}

function readStore() {
  if (runtimeStoreCache00702_) return normalizeStore(runtimeStoreCache00702_);
  runtimeStoreCache00702_ = normalizeStore(safeParse(localStorage.getItem(LS_KEY), null));
  return normalizeStore(runtimeStoreCache00702_);
}

function writeStore(st, reason = 'write') {
  const started = perfNow00702_();
  const norm = normalizeStore(st);
  norm.updatedAt = now();
  norm.history = Array.isArray(norm.history) ? norm.history.slice(-40) : [];
  norm.history.push({ at: norm.updatedAt, reason: String(reason || 'write'), activeSource: norm.activeSource });
  runtimeStoreCache00702_ = norm;
  try { localStorage.setItem(LS_KEY, JSON.stringify(norm)); } catch (e) { console.warn('[GlobalDesign][00684] save failed', e); }
  const durationMs = Math.round((perfNow00702_() - started) * 10) / 10;
  try { window.__ST_PERF_DIAG__?.push?.('global-design-store-write-00684', { reason, activeSource: norm.activeSource, durationMs }, durationMs > 24 ? 'warn' : 'info'); } catch (_) {}
  return norm;
}

function scheduleLiveSave00702_(store, reason = 'live-save') {
  if (liveSaveTimer00702_) clearTimeout(liveSaveTimer00702_);
  liveSaveTimer00702_ = setTimeout(() => {
    liveSaveTimer00702_ = 0;
    try { writeStore(runtimeStoreCache00702_ || store, `${reason}-debounced-save-00702`); }
    catch (e) { logPerf00702_('global-design-live-save-failed-00702', { reason, message: String(e?.message || e) }, 'warn'); }
  }, LIVE_SAVE_DEBOUNCE_MS_00702);
}

function applyLiveStore00702_(store, reason = 'live') {
  const started = perfNow00702_();
  const result = applyResolvedStyle(store, reason, { silent: true, live: true });
  const durationMs = Math.round((perfNow00702_() - started) * 10) / 10;
  liveBurstCount00702_ += 1;
  const nowMs = perfNow00702_();
  if (durationMs > 24 || nowMs - liveLastDiagAt00702_ > 700) {
    liveLastDiagAt00702_ = nowMs;
    logPerf00702_('global-design-live-style-apply-00702', {
      reason,
      source: store?.activeSource || '',
      durationMs,
      burst: liveBurstCount00702_,
      vars: result?.vars ? Object.keys(result.vars).length : 0
    }, durationMs > 40 ? 'warn' : 'info');
    liveBurstCount00702_ = 0;
  }
  return result;
}

function patchLiveStore00702_(source, patch, reason = 'live-patch') {
  const src = normalizeSource(source);
  const st = readStore();
  st[src] = deepMerge(st[src] || {}, patch || {});
  st.updatedAt = now();
  runtimeStoreCache00702_ = normalizeStore(st);

  const run = () => {
    liveApplyTimer00702_ = 0;
    const pending = livePendingPatch00702_;
    livePendingPatch00702_ = null;
    liveLastApplyAt00702_ = perfNow00702_();
    return applyLiveStore00702_(pending?.store || runtimeStoreCache00702_, pending?.reason || reason);
  };

  const nowMs = perfNow00702_();
  const elapsed = nowMs - liveLastApplyAt00702_;
  let result = { store: runtimeStoreCache00702_, resolved: resolveStyle(runtimeStoreCache00702_), vars: cssVarsFromResolved_(resolveStyle(runtimeStoreCache00702_), runtimeStoreCache00702_.activeSource) };
  if (elapsed >= LIVE_APPLY_MIN_INTERVAL_MS_00702 && !liveApplyTimer00702_) {
    liveLastApplyAt00702_ = nowMs;
    result = applyLiveStore00702_(runtimeStoreCache00702_, reason);
  } else {
    livePendingPatch00702_ = { store: runtimeStoreCache00702_, reason };
    if (!liveApplyTimer00702_) {
      const wait = Math.max(0, LIVE_APPLY_MIN_INTERVAL_MS_00702 - elapsed);
      liveApplyTimer00702_ = setTimeout(run, wait);
    }
  }

  scheduleLiveSave00702_(runtimeStoreCache00702_, reason);
  return result;
}

function flushLiveStore00702_(reason = 'live-flush') {
  if (liveApplyTimer00702_) {
    clearTimeout(liveApplyTimer00702_);
    liveApplyTimer00702_ = 0;
  }
  if (livePendingPatch00702_) {
    const pending = livePendingPatch00702_;
    livePendingPatch00702_ = null;
    applyLiveStore00702_(pending.store || runtimeStoreCache00702_, `${pending.reason || reason}-flush-00702`);
  }
  if (liveSaveTimer00702_) {
    clearTimeout(liveSaveTimer00702_);
    liveSaveTimer00702_ = 0;
  }
  if (runtimeStoreCache00702_) writeStore(runtimeStoreCache00702_, `${reason}-save-00702`);
  return runtimeStoreCache00702_ || readStore();
}

function hexToRgb_(hex) {
  const s = String(hex || '').trim().replace('#', '');
  const h = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgba_(hex, a) {
  const rgb = hexToRgb_(hex);
  if (!rgb) return String(hex || 'transparent');
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${Math.max(0, Math.min(1, Number(a) || 0))})`;
}

function resolveStyle(store = readStore()) {
  const st = normalizeStore(store);
  const src = normalizeSource(st.activeSource);
  const global = isObj(st.global) ? st.global : {};
  const active = isObj(st[src]) ? st[src] : {};
  // global є базою. AI/design можуть мати тільки частковий patch.
  return deepMerge(global, active);
}

function cssVarsFromResolved_(theme, activeSource) {
  const c = theme.colors || {};
  const r = theme.radius || {};
  const sh = theme.shadow || {};
  const b = deepMerge(defaultButtons_(theme), theme.buttons || {});
  const sec = theme.sections || {};
  const blk = theme.blocks || {};
  const menu = deepMerge(defaultMenu_(theme), theme.menu || {});
  const links = deepMerge(defaultLinks_(theme), theme.links || {});
  const footer = theme.footer || {};
  const typo = theme.typography || {};
  const spacing = deepMerge(defaultSpacing_(), theme.spacing || {});
  const headingFont = typo.headingFont || typo.font || 'Inter, Manrope, Arial, sans-serif';
  const textFont = typo.textFont || typo.font || 'Inter, Manrope, Arial, sans-serif';
  const h1Size = typo.h1Size || '56px';
  const h2Size = typo.h2Size || '42px';
  const h3Size = typo.h3Size || '28px';
  const h4Size = typo.h4Size || '24px';
  const h5Size = typo.h5Size || '20px';
  const h6Size = typo.h6Size || '18px';
  const bodySize = typo.bodySize || '16px';
  const textLineHeight = typo.textLineHeight || typo.lineHeight || '1.55';
  const headingLineHeight = typo.headingLineHeight || '1.15';
  const letterSpacing = typo.letterSpacing || '0px';
  const headingLetterSpacing = typo.headingLetterSpacing || letterSpacing || '-0.8px';
  const headingColor = typo.headingColor || (theme.colors || {}).text || '#111827';
  const textColor = typo.textColor || (theme.colors || {}).text || '#111827';
  const primary = c.primary || '#2563eb';
  const accent = c.accent || '#0ea5e9';
  const surface = c.surface || '#ffffff';
  const surface2 = c.surface2 || '#f8fafc';
  const text = c.text || '#111827';
  const muted = c.muted || '#64748b';
  const border = c.border || '#e2e8f0';
  const buttonBorderWidth = b.borderWidth || '1px';
  const buttonBorderColor = b.borderColor || accent || border;
  const buttonBorder = b.border || `${buttonBorderWidth} solid ${buttonBorderColor}`;
  const blockBorderWidth = blk.borderWidth || '1px';
  const blockBorderColor = blk.borderColor || border;
  const blockBorder = blk.border || `${blockBorderWidth} solid ${blockBorderColor}`;
  const buttonShadow = b.shadow || sh.soft || '0 14px 34px rgba(15,23,42,.08)';
  const hoverFill = b.hoverFill || b.hover || accent || primary;
  const hoverText = b.hoverText || b.text || '#ffffff';
  const hoverBorder = b.hoverBorder || buttonBorderColor;
  const menuBorderWidth = menu.borderWidth || buttonBorderWidth;
  const footerBorderWidth = footer.borderWidth || blockBorderWidth;
  const footerBorderColor = footer.borderColor || blockBorderColor;
  const footerBorder = footer.border || `${footerBorderWidth} solid ${footerBorderColor}`;
  const cn = theme.containers || {};
  const sectionBorderWidth = sec.borderWidth || '0px';
  const sectionBorderColor = sec.borderColor || border;
  const sectionBorder = sec.border || borderFromParts_(sectionBorderWidth, sectionBorderColor);
  const sectionRadius = sec.radius || '0px';
  const sectionShadow = sec.shadow || 'none';
  const containerBorderWidth = cn.borderWidth || '0px';
  const containerBorderColor = cn.borderColor || border;
  const containerBorder = cn.border || borderFromParts_(containerBorderWidth, containerBorderColor);
  const containerRadius = cn.radius || r.md || '16px';
  const containerShadow = cn.shadow || 'none';
  const blockRadius = blk.radius || r.md || '16px';
  const blockShadow = blk.shadow || 'none';
  const blockHoverShadow = blk.hoverShadow || blockShadow || 'none';
  const blockHoverLift = blk.hoverLift || '0px';
  const vars = {
    '--st-gd-active-source': activeSource,
    '--st-gd-color-primary': primary,
    '--st-gd-color-accent': accent,
    '--st-gd-color-surface': surface,
    '--st-gd-color-surface-2': surface2,
    '--st-gd-color-text': text,
    '--st-gd-color-muted': muted,
    '--st-gd-color-border': border,
    '--st-gd-primary-soft': rgba_(primary, .12),
    '--st-gd-primary-border': rgba_(primary, .28),
    '--st-gd-accent-soft': rgba_(accent, .12),
    '--st-gd-accent-border': rgba_(accent, .30),
    '--st-gd-accent-shadow': rgba_(accent, .20),
    '--st-gd-section-bg': sec.bg || surface,
    '--st-gd-section-alt-bg': sec.altBg || surface2,
    '--st-gd-section-border-width': sectionBorderWidth,
    '--st-gd-section-border-color': sectionBorderColor,
    '--st-gd-section-border': sectionBorder,
    '--st-gd-section-radius': sectionRadius,
    '--st-gd-section-shadow': sectionShadow,
    '--st-gd-section-overlay': sec.overlay || 'none',
    '--st-gd-section-min-height': sec.minHeight || '0px',
    '--st-gd-section-max-width': sec.maxWidth || '100%',
    '--st-gd-container-bg': cn.bg || 'transparent',
    '--st-gd-container-alt-bg': cn.altBg || surface2,
    '--st-gd-container-border-width': containerBorderWidth,
    '--st-gd-container-border-color': containerBorderColor,
    '--st-gd-container-border': containerBorder,
    '--st-gd-container-radius': containerRadius,
    '--st-gd-container-shadow': containerShadow,
    '--st-gd-container-overlay': cn.overlay || 'none',
    '--st-gd-container-min-height': cn.minHeight || '0px',
    '--st-gd-container-max-width': cn.maxWidth || '100%',
    '--st-gd-header-bg': sec.bg || surface,
    '--st-gd-header-alt-bg': sec.altBg || surface2,
    '--st-gd-footer-bg': footer.bg || sec.bg || surface,
    '--st-gd-footer-alt-bg': footer.altBg || sec.altBg || surface2,
    '--st-gd-footer-text': footer.text || text,
    '--st-gd-footer-border-width': footerBorderWidth,
    '--st-gd-footer-border-color': footerBorderColor,
    '--st-gd-footer-border': footerBorder,
    '--st-gd-footer-radius': footer.radius || r.lg || '24px',
    '--st-gd-footer-shadow': footer.shadow || sh.soft || '0 14px 34px rgba(15,23,42,.08)',
    '--st-gd-block-bg': blk.bg || surface,
    '--st-gd-block-alt-bg': blk.altBg || surface2,
    '--st-gd-block-border': blockBorder,
    '--st-gd-block-border-width': blockBorderWidth,
    '--st-gd-block-border-color': blockBorderColor,
    '--st-gd-block-radius': blockRadius,
    '--st-gd-block-shadow': blockShadow,
    '--st-gd-block-hover-shadow': blockHoverShadow,
    '--st-gd-block-hover-lift': blockHoverLift,
    '--st-gd-block-overlay': blk.overlay || 'none',
    '--st-gd-block-min-height': blk.minHeight || '0px',
    '--st-gd-block-max-width': blk.maxWidth || '100%',
    '--st-gd-radius-sm': r.sm || '10px',
    '--st-gd-radius-md': r.md || '16px',
    '--st-gd-radius-lg': r.lg || '24px',
    '--st-gd-radius-pill': r.pill || '999px',
    '--st-gd-shadow-soft': sh.soft || '0 14px 34px rgba(15,23,42,.08)',
    '--st-gd-shadow-md': sh.md || '0 22px 60px rgba(15,23,42,.14)',
    '--st-gd-button-bg': b.primaryBg || b.fill || primary,
    '--st-gd-button-text': b.primaryText || b.text || '#ffffff',
    '--st-gd-button-border': b.primaryBorder || buttonBorder,
    '--st-gd-button-border-width': buttonBorderWidth,
    '--st-gd-button-border-color': buttonBorderColor,
    '--st-gd-button-hover-bg': hoverFill,
    '--st-gd-button-hover-text': hoverText,
    '--st-gd-button-hover-border': hoverBorder,
    '--st-gd-button-shadow': buttonShadow,
    '--st-gd-font': typo.font || textFont,
    '--st-gd-heading-font': headingFont,
    '--st-gd-text-font': textFont,
    '--st-gd-h1-size': h1Size,
    '--st-gd-h2-size': h2Size,
    '--st-gd-h3-size': h3Size,
    '--st-gd-h4-size': h4Size,
    '--st-gd-h5-size': h5Size,
    '--st-gd-h6-size': h6Size,
    '--st-gd-body-size': bodySize,
    '--st-gd-line-height': textLineHeight,
    '--st-gd-text-line-height': textLineHeight,
    '--st-gd-heading-line-height': headingLineHeight,
    '--st-gd-letter-spacing': letterSpacing,
    '--st-gd-heading-letter-spacing': headingLetterSpacing,
    '--st-gd-heading-weight': typo.headingWeight || '900',
    '--st-gd-text-weight': typo.textWeight || '650',
    '--st-gd-heading-color': headingColor,
    '--st-gd-text-color': textColor,
    '--st-gd-density-preset': spacing.densityPresetId || 'density-standard',
    '--st-gd-section-padding-y': spacing.sectionPaddingY || '24px',
    '--st-gd-section-padding-x': spacing.sectionPaddingX || '24px',
    '--st-gd-container-padding': spacing.containerPadding || '0px',
    '--st-gd-block-padding-y': spacing.blockPaddingY || '10px',
    '--st-gd-block-padding-x': spacing.blockPaddingX || '14px',
    '--st-gd-level-gap': spacing.levelGap || '14px',
    '--st-gd-container-gap': spacing.containerGap || '12px',
    '--st-gd-block-gap': spacing.blockGap || '8px',
    '--st-gd-menu-gap': spacing.menuGap || '8px',

    // Сумісність із майбутніми/наявними токенами конструктора.
    '--st-color-primary': primary,
    '--st-color-accent': accent,
    '--st-color-surface': surface,
    '--st-color-text': text,
    '--st-color-border': border,
    '--st-radius-md': r.md || '16px',
    '--st-shadow-md': sh.md || '0 22px 60px rgba(15,23,42,.14)',
    '--st-button-fill': b.primaryBg || b.fill || primary,
    '--st-button-fg': b.primaryText || b.text || '#ffffff',
    '--st-button-border': b.primaryBorder || buttonBorder,
    '--st-button-radius': b.radius || r.pill || '999px',
    '--st-button-shadow': buttonShadow,
    '--st-font-heading': headingFont,
    '--st-font-text': textFont,
    '--st-font-body': textFont,
    '--st-font-size-h1': h1Size,
    '--st-font-size-h2': h2Size,
    '--st-font-size-h3': h3Size,
    '--st-font-size-h4': h4Size,
    '--st-font-size-h5': h5Size,
    '--st-font-size-h6': h6Size,
    '--st-font-size-body': bodySize,
    '--st-line-height-body': textLineHeight,
    '--st-line-height-heading': headingLineHeight,
    '--st-letter-spacing-body': letterSpacing,
    '--st-letter-spacing-heading': headingLetterSpacing,
    '--st-section-padding-y': spacing.sectionPaddingY || '24px',
    '--st-section-padding-x': spacing.sectionPaddingX || '24px',
    '--st-container-padding': spacing.containerPadding || '0px',
    '--st-block-padding-y': spacing.blockPaddingY || '10px',
    '--st-block-padding-x': spacing.blockPaddingX || '14px',
    '--st-level-gap': spacing.levelGap || '14px',
    '--st-container-gap': spacing.containerGap || '12px',
    '--st-block-gap': spacing.blockGap || '8px',
    '--st-menu-gap': spacing.menuGap || '8px',
    '--st-section-bg': sec.bg || surface,
    '--st-section-alt-bg': sec.altBg || surface2,
    '--st-section-border': sectionBorder,
    '--st-section-radius': sectionRadius,
    '--st-section-shadow': sectionShadow,
    '--st-section-min-height': sec.minHeight || '0px',
    '--st-section-max-width': sec.maxWidth || '100%',
    '--st-container-bg': cn.bg || 'transparent',
    '--st-container-border': containerBorder,
    '--st-container-radius': containerRadius,
    '--st-container-shadow': containerShadow,
    '--st-container-min-height': cn.minHeight || '0px',
    '--st-container-max-width': cn.maxWidth || '100%',
    '--st-block-bg': blk.bg || surface,
    '--st-block-border': blockBorder,
    '--st-block-radius': blockRadius,
    '--st-block-shadow': blockShadow,
    '--st-block-hover-shadow': blockHoverShadow,
    '--st-block-hover-lift': blockHoverLift,
    '--st-block-min-height': blk.minHeight || '0px',
    '--st-block-max-width': blk.maxWidth || '100%',
    '--st-menu-link-color': menu.text || text,
    '--st-menu-item-bg': menu.itemBg || 'transparent',
    '--st-menu-item-bc': menu.itemBorderColor || border,
    '--st-menu-item-bw': menu.itemBorderWidth || menuBorderWidth,
    '--st-menu-radius': menu.radius || r.pill || '999px',

    // [00701] Повна глобальна система кнопок / меню / посилань.
    '--st-gd-button-primary-bg': b.primaryBg || b.fill || primary,
    '--st-gd-button-primary-text': b.primaryText || b.text || '#ffffff',
    '--st-gd-button-primary-border-width': b.primaryBorderWidth || buttonBorderWidth,
    '--st-gd-button-primary-border-color': b.primaryBorderColor || buttonBorderColor,
    '--st-gd-button-primary-border': b.primaryBorder || buttonBorder,
    '--st-gd-button-primary-hover-bg': b.primaryHoverBg || hoverFill,
    '--st-gd-button-primary-hover-text': b.primaryHoverText || hoverText,
    '--st-gd-button-primary-hover-border-color': b.primaryHoverBorderColor || hoverBorder,
    '--st-gd-button-primary-active-bg': b.primaryActiveBg || primary,
    '--st-gd-button-primary-active-text': b.primaryActiveText || b.primaryText || b.text || '#ffffff',
    '--st-gd-button-primary-disabled-bg': b.primaryDisabledBg || '#cbd5e1',
    '--st-gd-button-primary-disabled-text': b.primaryDisabledText || '#64748b',
    '--st-gd-button-secondary-bg': b.secondaryBg || surface,
    '--st-gd-button-secondary-text': b.secondaryText || primary,
    '--st-gd-button-secondary-border-width': b.secondaryBorderWidth || '1px',
    '--st-gd-button-secondary-border-color': b.secondaryBorderColor || border,
    '--st-gd-button-secondary-hover-bg': b.secondaryHoverBg || surface2,
    '--st-gd-button-secondary-hover-text': b.secondaryHoverText || primary,
    '--st-gd-button-ghost-bg': b.ghostBg || 'transparent',
    '--st-gd-button-ghost-text': b.ghostText || text,
    '--st-gd-button-ghost-border-width': b.ghostBorderWidth || '0px',
    '--st-gd-button-ghost-border-color': b.ghostBorderColor || 'transparent',
    '--st-gd-button-ghost-hover-bg': b.ghostHoverBg || rgba_(accent, .10),
    '--st-gd-button-ghost-hover-text': b.ghostHoverText || accent,
    '--st-gd-button-icon-bg': b.iconBg || rgba_(accent, .12),
    '--st-gd-button-icon-text': b.iconText || accent,
    '--st-gd-button-icon-border-width': b.iconBorderWidth || '1px',
    '--st-gd-button-icon-border-color': b.iconBorderColor || rgba_(accent, .30),
    '--st-gd-button-icon-hover-bg': b.iconHoverBg || accent,
    '--st-gd-button-icon-hover-text': b.iconHoverText || '#ffffff',
    '--st-gd-button-radius': b.radius || r.pill || '999px',
    '--st-gd-button-icon-radius': b.iconRadius || r.md || '16px',
    '--st-gd-button-hover-shadow': b.hoverShadow || sh.md || buttonShadow,
    '--st-gd-button-active-shadow': b.activeShadow || 'inset 0 2px 8px rgba(15,23,42,.18)',
    '--st-gd-button-disabled-opacity': b.disabledOpacity || '0.55',
    '--st-gd-menu-text': menu.text || text,
    '--st-gd-menu-hover-text': menu.hoverText || accent,
    '--st-gd-menu-active-text': menu.activeText || primary,
    '--st-gd-menu-item-bg': menu.itemBg || 'transparent',
    '--st-gd-menu-hover-bg': menu.hoverBg || rgba_(accent, .10),
    '--st-gd-menu-active-bg': menu.activeBg || rgba_(primary, .12),
    '--st-gd-menu-item-border-width': menu.itemBorderWidth || menuBorderWidth,
    '--st-gd-menu-item-border-color': menu.itemBorderColor || border,
    '--st-gd-menu-hover-border-color': menu.hoverBorderColor || accent,
    '--st-gd-menu-active-border-color': menu.activeBorderColor || primary,
    '--st-gd-menu-item-radius': menu.radius || r.pill || '999px',
    '--st-gd-menu-underline-height': menu.underlineHeight || '2px',
    '--st-gd-menu-underline-offset': menu.underlineOffset || '5px',
    '--st-gd-menu-indicator-style': menu.indicatorStyle || 'background',
    '--st-gd-menu-burger-bg': menu.burgerBg || rgba_(accent, .12),
    '--st-gd-menu-burger-color': menu.burgerColor || text,
    '--st-gd-menu-burger-radius': menu.burgerRadius || r.md || '16px',
    '--st-gd-menu-mobile-bg': menu.mobileBg || surface,
    '--st-gd-link-color': links.color || primary,
    '--st-gd-link-hover-color': links.hoverColor || accent,
    '--st-gd-link-active-color': links.activeColor || primary,
    '--st-gd-link-visited-color': links.visitedColor || primary,
    '--st-gd-link-underline': links.underline || 'none',
    '--st-gd-link-underline-hover': links.underlineHover || 'underline',
    '--st-gd-link-underline-offset': links.underlineOffset || '3px',
    '--st-gd-link-underline-thickness': links.underlineThickness || '1px',
    '--st-button-primary-bg': b.primaryBg || b.fill || primary,
    '--st-button-primary-text': b.primaryText || b.text || '#ffffff',
    '--st-button-secondary-bg': b.secondaryBg || surface,
    '--st-button-secondary-text': b.secondaryText || primary,
    '--st-link-color': links.color || primary,
    '--st-link-hover-color': links.hoverColor || accent
  };
  return vars;
}


function removeRuntimeCss00772_(reason = 'template-authored-style-authority-00772') {
  // [00772 ROOT CAUSE DELETE]
  // Старий global-design runtime CSS 00687 був не темою, а глобальним overwrite-layer:
  // він через !important перебивав авторські inline-стилі шаблонів у #site-root, Header та Footer.
  // Preview показував template-authored стилі, а canvas отримував інші кольори/шрифти.
  // Тому цей CSS-шар видаляється як першопричина, а не компенсується нормалізатором.
  const ids = ['st-global-style-runtime-css-00687', 'st-global-ready-theme-hmf-contract-00770'];
  let removed = 0;
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    try { el.remove(); removed += 1; } catch (_) {
      try { el.textContent = ''; removed += 1; } catch (_) {}
    }
  }
  try {
    window.__ST_PERF_DIAG__?.push?.('global-design-runtime-css-disabled-00772', {
      reason,
      removed,
      authority: 'template-inline-style',
      noNormalizer: true,
      noAdapter: true
    }, 'info');
  } catch (_) {}
}

function injectRuntimeCss00687_() {
  // [00772] Намірено НЕ інжектимо CSS, який глобально фарбує #site-root / H/F.
  // Готові теми мають бути окремим явним apply-контрактом пізніше.
  // На цьому етапі авторські стилі шаблону є єдиною істинною.
  removeRuntimeCss00772_('injectRuntimeCss00687-disabled-00772');
}

function writeCssVarsToTargets_(vars, source) {
  const targets = [document.documentElement, document.body, document.getElementById('site-root')].filter(Boolean);
  targets.forEach((el) => {
    Object.entries(vars || {}).forEach(([k, v]) => {
      try { el.style.setProperty(k, String(v)); } catch (_) {}
    });
    try { el.dataset.stGlobalStyleSource = source; } catch (_) {}
  });
}

function applyResolvedStyle(store = readStore(), reason = 'apply', opts = {}) {
  const started = perfNow00702_();
  injectRuntimeCss00687_();
  const st = normalizeStore(store);
  const resolved = resolveStyle(st);
  const vars = cssVarsFromResolved_(resolved, st.activeSource);
  writeCssVarsToTargets_(vars, st.activeSource);
  const durationMs = Math.round((perfNow00702_() - started) * 10) / 10;
  if (!opts?.silent) {
    try { window.dispatchEvent(new CustomEvent('st:global-style-applied', { detail: { source: st.activeSource, reason, presetId: resolved.presetId || '', vars } })); } catch (_) {}
    try { window.__ST_PERF_DIAG__?.push?.('global-design-style-applied-00684', { source: st.activeSource, reason, presetId: resolved.presetId || '', durationMs }, durationMs > 40 ? 'warn' : 'info'); } catch (_) {}
  } else {
    try { window.dispatchEvent(new CustomEvent('st:global-style-live-applied', { detail: { source: st.activeSource, reason, presetId: resolved.presetId || '', durationMs } })); } catch (_) {}
  }
  return { store: st, resolved, vars };
}

function previewPresetWithoutSaving_(presetId, reason = 'preset-preview') {
  injectRuntimeCss00687_();
  const preset = getGlobalDesignPresetById(presetId);
  if (!preset) return null;
  const st = readStore();
  const currentSpacing = isObj(st.global?.spacing) ? clone(st.global.spacing) : defaultSpacing_();
  const previewGlobal = deepMerge(clone(preset), { spacing: currentSpacing });
  const previewStore = normalizeStore(Object.assign({}, st, { activeSource: 'global', global: previewGlobal }));
  const resolved = resolveStyle(previewStore);
  const vars = cssVarsFromResolved_(resolved, 'global');
  writeCssVarsToTargets_(vars, 'global-preview');
  try { window.dispatchEvent(new CustomEvent('st:global-style-preview-applied', { detail: { source: 'global', reason, presetId: resolved.presetId || presetId, vars, resolved } })); } catch (_) {}
  try { window.__ST_PERF_DIAG__?.push?.('global-design-theme-preview-00695', { reason, presetId: resolved.presetId || presetId }, 'info'); } catch (_) {}
  return { store: previewStore, resolved, vars };
}

function previewTypographyPresetWithoutSaving_(presetId, reason = 'typography-preset-hover') {
  injectRuntimeCss00687_();
  const preset = getGlobalTypographyPresetById(presetId);
  if (!preset) return null;
  const st = readStore();
  const src = normalizeSource(st.activeSource);
  const previewStore = normalizeStore(clone(st));
  previewStore[src] = deepMerge(previewStore[src] || {}, {
    typographyPresetId: preset.id,
    typography: preset.typography || {}
  });
  const resolved = resolveStyle(previewStore);
  const vars = cssVarsFromResolved_(resolved, src);
  writeCssVarsToTargets_(vars, `${src}-typography-preview`);
  try {
    window.dispatchEvent(new CustomEvent('st:global-style-preview-applied', {
      detail: { source: src, reason, presetId: preset.id, vars, resolved }
    }));
  } catch (_) {}
  try {
    window.__ST_PERF_DIAG__?.push?.('global-design-typography-preview-00938', {
      reason,
      presetId: preset.id,
      source: src,
      noCommit: true,
      noStorage: true
    }, 'info');
  } catch (_) {}
  return { store: previewStore, resolved, vars };
}

export const GlobalStyleStore = {
  key: LS_KEY,
  presets: ST_GLOBAL_DESIGN_PRESETS,
  read: readStore,
  write: writeStore,
  resolve: resolveStyle,
  apply: applyResolvedStyle,
  setActiveSource(source, reason = 'source-switch') {
    const st = readStore();
    st.activeSource = normalizeSource(source);
    const saved = writeStore(st, reason);
    return applyResolvedStyle(saved, reason);
  },
  patch(source, patch, reason = 'patch') {
    if (isLiveReason00702_(reason)) return patchLiveStore00702_(source, patch, reason);
    const src = normalizeSource(source);
    const st = flushLiveStore00702_(`before-${reason}`);
    st[src] = deepMerge(st[src] || {}, patch || {});
    const saved = writeStore(st, reason);
    return applyResolvedStyle(saved, reason);
  },
  patchLive(source, patch, reason = 'live-patch') {
    return patchLiveStore00702_(source, patch, reason);
  },
  flushLive(reason = 'api') {
    const saved = flushLiveStore00702_(reason);
    return applyResolvedStyle(saved, `${reason}-applied-00702`);
  },
  applyPresetToGlobal(presetId, reason = 'preset-global') {
    const preset = getGlobalDesignPresetById(presetId);
    if (!preset) return applyResolvedStyle(readStore(), reason);
    const st = readStore();
    const currentSpacing = isObj(st.global?.spacing) ? clone(st.global.spacing) : defaultSpacing_();
    st.global = deepMerge(clone(preset), { spacing: currentSpacing });
    st.activeSource = 'global';
    const saved = writeStore(st, reason);
    return applyResolvedStyle(saved, reason);
  },
  // [00695] Preview готової теми без запису в localStorage.
  // Наведення на тему тимчасово показує її, mouseout повертає збережений StyleStore.
  previewPreset(presetId, reason = 'preset-preview') {
    return previewPresetWithoutSaving_(presetId, reason);
  },
  previewTypographyPreset(presetId, reason = 'typography-preset-hover') {
    return previewTypographyPresetWithoutSaving_(presetId, reason);
  },
  restoreAfterPreview(reason = 'preset-preview-restore') {
    return applyResolvedStyle(readStore(), reason);
  },
  // [00694] Element-level source switcher needs the same resolver and CSS variables,
  // but for a specific source (Global / AI / Design), without changing activeSource.
  resolveSource(source = 'global') {
    const st = readStore();
    const src = normalizeSource(source);
    return deepMerge(st.global || {}, st[src] || {});
  },
  varsForSource(source = 'global') {
    const src = normalizeSource(source);
    return cssVarsFromResolved_(this.resolveSource(src), src);
  },
  normalizeSource(source) {
    return normalizeSource(source);
  },
  reset(reason = 'reset') {
    const saved = writeStore(defaultStore(), reason);
    return applyResolvedStyle(saved, reason);
  }
};

export function initGlobalStyleStore() {
  const st = readStore();
  const applied = applyResolvedStyle(st, 'boot-00684');
  try { window.ST_GLOBAL_STYLE_STORE = GlobalStyleStore; } catch (_) {}
  return applied;
}

try { window.ST_GLOBAL_STYLE_STORE = GlobalStyleStore; } catch (_) {}
