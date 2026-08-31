// js/global-design/explicit-theme-apply.js
// =======================================================
// [00935] Explicit theme apply + atomic H/M/F theme history.
//
// HARD RULES:
// - no boot repaint;
// - no runtime CSS overwrite layer;
// - no !important global repaint;
// - no observer / normalizer / rescue / fallback repair;
// - template-authored inline styles stay authority until the user explicitly
//   clicks a ready theme or changes Global Design controls.
//
// A ready theme is converted once into inline visual styles on H/M/F nodes,
// then committed into the same JSON/HTML stores used by Header/Footer.
// =======================================================

import { GlobalStyleStore } from './style-store.js';
import { commitAreaFromSlotToJsonState, getEntry, setEntry } from '../site-hf/hf-json-engine.js';

const VERSION = '00954';
const TEMPLATE_STYLE_SYNC_BUILD_00954 = '00954-template-style-live-link';
// [00780][Stage 4] Final Global Design control/color changes are explicit user actions too.
// They must repaint and commit Header/Footer. Live samples are still blocked by LIVE_REASON_RE_.
const EXPLICIT_REASON_RE_ = /global-design-(?:preset-click|reset-site-active-theme|color-|control-|manual-color-|manual-path-|typography-preset-|spacing-preset-)/i;
const LIVE_REASON_RE_ = /(?:^|[-:])live(?:[-:]|$)/i;

function log_(event, detail = {}, level = 'info') {
  const payload = Object.assign({ v: VERSION, contract: 'explicit-theme-stage4-visible-containers-hmf-00780' }, detail || {});
  try { window.__ST_PERF_DIAG__?.push?.(event, payload, level); } catch (_) {}
  try { window.__ST_AI_DEBUG_LOG__?.perf?.(event, Object.assign({ v: VERSION }, detail || {}), level); } catch (_) {}
  try { window.__ST_ALL_LOG__?.push?.(event, payload, level); } catch (_) {}
}

function isObj_(v) { return !!(v && typeof v === 'object' && !Array.isArray(v)); }
function str_(v, fallback = '') {
  const s = String(v ?? '').trim();
  return s || fallback;
}
function pxNumber_(value, fallback = 0) {
  const n = Number.parseFloat(String(value ?? '').trim());
  return Number.isFinite(n) ? Math.max(0, n) : Math.max(0, Number(fallback) || 0);
}
function readTheme_() {
  try { return GlobalStyleStore.resolve(GlobalStyleStore.read()) || {}; } catch (_) { return {}; }
}
function rgba_(hex, a) {
  const fallback = '#000000';
  let s = String(hex || fallback).trim();
  if (!/^#[0-9a-f]{3,6}$/i.test(s)) s = fallback;
  if (s.length === 4) s = '#' + s.slice(1).split('').map((c) => c + c).join('');
  const r = parseInt(s.slice(1, 3), 16) || 0;
  const g = parseInt(s.slice(3, 5), 16) || 0;
  const b = parseInt(s.slice(5, 7), 16) || 0;
  const alpha = Math.max(0, Math.min(1, Number(a) || 0));
  return `rgba(${r},${g},${b},${alpha})`;
}
function border_(width, color, fallback = 'transparent') {
  const w = str_(width, '0px');
  const c = str_(color, fallback);
  return `${w} solid ${w === '0px' ? 'transparent' : c}`;
}
function borderCss_(value, fallbackWidth = '1px', fallbackColor = '#e2e8f0') {
  const raw = String(value || '').trim();
  if (raw) return raw;
  return border_(fallbackWidth, fallbackColor, fallbackColor);
}
function firstHex_(value) {
  const m = String(value || '').match(/#[0-9a-f]{3,6}/i);
  if (!m) return '';
  let h = m[0];
  if (h.length === 4) h = '#' + h.slice(1).split('').map((c) => c + c).join('');
  return h.toLowerCase();
}
function rgbFromHex_(hex) {
  const h = firstHex_(hex);
  if (!h) return null;
  return [parseInt(h.slice(1, 3), 16) || 0, parseInt(h.slice(3, 5), 16) || 0, parseInt(h.slice(5, 7), 16) || 0];
}
function luminance_(hex) {
  const rgb = rgbFromHex_(hex);
  if (!rgb) return null;
  const v = rgb.map((n) => {
    const c = n / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function contrast_(a, b) {
  const la = luminance_(a);
  const lb = luminance_(b);
  if (la == null || lb == null) return 99;
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}
function readableText_(bg, preferred = '#111827') {
  const h = firstHex_(bg);
  if (!h) return preferred;
  const pref = firstHex_(preferred) || preferred;
  if (contrast_(h, pref) >= 4.5) return preferred;
  const dark = '#111827';
  const light = '#f8fafc';
  return contrast_(h, light) >= contrast_(h, dark) ? light : dark;
}
function isDarkColor_(bg) {
  const l = luminance_(bg);
  return l != null && l < 0.42;
}
function isTransparentBg_(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s || s === 'transparent') return true;
  const rgba = s.match(/^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([0-9.]+)\s*\)$/);
  if (rgba && Number(rgba[1]) <= 0.01) return true;
  return false;
}

const GEOMETRY_STYLE_PROPERTIES_00946 = new Set(['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'gap', 'row-gap', 'column-gap']);

function visualStylePatch00946_(style = {}, preserveGeometry = false) {
  if (!preserveGeometry) return style || {};
  return Object.fromEntries(Object.entries(style || {}).filter(([property]) => !GEOMETRY_STYLE_PROPERTIES_00946.has(property)));
}

function styleEl_(el, style = {}, opts = {}) {
  if (!(el instanceof HTMLElement)) return 0;
  const source = String(el.dataset?.stStyleSource || '').toLowerCase();
  // Manual element styles must stay higher priority than ready theme.
  if (opts?.force !== true && (source === 'design' || source === 'ai')) return 0;
  let changed = 0;
  Object.entries(style || {}).forEach(([k, v]) => {
    if (!k || v == null || String(v).trim() === '') return;
    if (opts?.preserveGeometry === true && GEOMETRY_STYLE_PROPERTIES_00946.has(k)) return;
    try {
      const next = String(v);
      if (el.style.getPropertyValue(k) !== next) {
        el.style.setProperty(k, next);
        changed += 1;
      }
    } catch (_) {}
  });
  if (opts?.semanticRole) {
    try {
      el.dataset.stSemanticStyle = '00946';
      el.dataset.stSemanticRole = String(opts.semanticRole);
    } catch (_) {}
  }
  if (!opts?.preview) {
    try {
      el.dataset.stStyleSource = 'global';
      el.dataset.stGlobalExplicitTheme00780 = '1';
    } catch (_) {}
  }
  return changed;
}

function applyToMany_(nodes, style, opts = {}) {
  let matched = 0;
  let nodesCount = 0;
  let propCount = 0;
  Array.from(nodes || []).forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    matched += 1;
    const changed = styleEl_(el, style, opts);
    if (changed) {
      nodesCount += 1;
      propCount += changed;
    }
  });
  return { matched, nodes: nodesCount, skipped: Math.max(0, matched - nodesCount), props: propCount };
}
function addStats_(a, b) {
  a.nodes += Number(b?.nodes || 0);
  a.props += Number(b?.props || 0);
  return a;
}

function themeStyles_(theme = {}) {
  const c = theme.colors || {};
  const r = theme.radius || {};
  const sh = theme.shadow || {};
  const b = theme.buttons || {};
  const sec = theme.sections || {};
  const cont = theme.containers || {};
  const blk = theme.blocks || {};
  const typo = theme.typography || {};
  const menu = theme.menu || {};
  const links = theme.links || {};
  const icons = theme.icons || {};
  const media = theme.media || {};
  const spacing = theme.spacing || {};

  const primary = str_(c.primary, '#2563eb');
  const accent = str_(c.accent, '#0ea5e9');
  const surface = str_(c.surface, '#ffffff');
  const surface2 = str_(c.surface2, '#f8fafc');
  const text = str_(c.text, '#111827');
  const muted = str_(c.muted, '#64748b');
  const border = str_(c.border, '#e2e8f0');
  const font = str_(typo.textFont || typo.font, 'Inter, Manrope, Arial, sans-serif');
  const headingFont = str_(typo.headingFont || typo.font, font);
  const headingWeight = str_(typo.headingWeight, '900');
  const textWeight = str_(typo.textWeight, '650');
  const bodySize = str_(typo.bodySize, '16px');
  const textLineHeight = str_(typo.textLineHeight || typo.lineHeight, '1.55');
  const headingLineHeight = str_(typo.headingLineHeight, '1.15');
  const textLetterSpacing = str_(typo.letterSpacing, '0px');

  // 00946 root-cause rule: explicit semantic tokens are authoritative.
  // In particular, transparent stays transparent and 0px stays 0px.
  const sectionBg = str_(sec.bg, surface);
  const sectionAltBg = str_(sec.altBg, surface2);
  const containerBg = str_(cont.bg || cont.background, surface2);
  const containerAltBg = str_(cont.altBg, surface);
  const blockBg = str_(blk.bg || blk.background, surface);
  const blockAltBg = str_(blk.altBg, surface2);
  const sectionBorder = borderCss_(sec.border || '', sec.borderWidth || '0px', sec.borderColor || border);
  const containerBorder = borderCss_(cont.border || '', cont.borderWidth || '0px', cont.borderColor || border);
  const blockBorder = borderCss_(blk.border || '', blk.borderWidth || '0px', blk.borderColor || border);
  const sectionText = str_(sec.text || typo.textColor, text);
  const sectionAltText = str_(sec.altText, c.onPrimary || '#f8fafc');
  const containerText = str_(cont.text, isTransparentBg_(containerBg) ? 'inherit' : (c.onSurface2 || text));
  const containerAltText = str_(cont.altText, isTransparentBg_(containerAltBg) ? 'inherit' : (c.onSurface || text));
  const blockText = str_(blk.text, isTransparentBg_(blockBg) ? 'inherit' : (c.onSurface || text));
  const blockAltText = str_(blk.altText, isTransparentBg_(blockAltBg) ? 'inherit' : (c.onSurface2 || text));
  const headingColor = str_(typo.headingColor, text);
  const menuFallbackBg = rgba_(accent || primary, isDarkColor_(sectionBg) ? .22 : .14);
  const menuBg = str_(menu.itemBg || menu.bg, menuFallbackBg);
  const menuTextSafe = str_(menu.text || menu.color, text);
  const sectionPaddingY = str_(spacing.sectionPaddingY, '24px');
  const sectionPaddingX = str_(spacing.sectionPaddingX, '24px');
  const containerPadding = str_(spacing.containerPadding, '0px');
  const blockPaddingY = str_(spacing.blockPaddingY, '10px');
  const blockPaddingX = str_(spacing.blockPaddingX, '14px');
  const levelGap = str_(spacing.levelGap, '14px');
  const containerGap = str_(spacing.containerGap, '12px');
  const blockGap = str_(spacing.blockGap, '8px');
  const menuGap = str_(spacing.menuGap, '8px');

  return {
    section: {
      'background': sectionBg,
      'color': sectionText,
      'border': sectionBorder,
      'border-radius': str_(sec.radius, '0px'),
      'box-shadow': str_(sec.shadow, 'none'),
      'padding': `${sectionPaddingY} ${sectionPaddingX}`,
      'font-family': font
    },
    sectionAlt: {
      'background': sectionAltBg,
      'color': sectionAltText,
      'border': sectionBorder,
      'border-radius': str_(sec.radius, '0px'),
      'box-shadow': str_(sec.shadow, 'none'),
      'padding': `${sectionPaddingY} ${sectionPaddingX}`,
      'font-family': font
    },
    row: {
      'color': sectionText,
      'gap': levelGap,
      'font-family': font
    },
    rowAlt: {
      'color': sectionAltText,
      'gap': levelGap,
      'font-family': font
    },
    container: {
      'background': containerBg,
      'color': containerText,
      'border': containerBorder,
      'border-radius': str_(cont.radius, r.lg || r.md || '18px'),
      'box-shadow': str_(cont.shadow || sh.soft, 'none'),
      'padding': containerPadding,
      'gap': containerGap,
      'font-family': font
    },
    containerAlt: {
      'background': containerAltBg,
      'color': containerAltText,
      'border': containerBorder,
      'border-radius': str_(cont.radius, r.lg || r.md || '18px'),
      'box-shadow': str_(cont.shadow || sh.soft, 'none'),
      'padding': containerPadding,
      'gap': containerGap,
      'font-family': font
    },
    block: {
      'background': blockBg,
      'color': blockText,
      'border': blockBorder,
      'border-radius': str_(blk.radius, r.md || '16px'),
      'box-shadow': str_(blk.shadow || sh.soft, 'none'),
      'padding': `${blockPaddingY} ${blockPaddingX}`,
      'gap': blockGap,
      'font-family': font
    },
    blockAlt: {
      'background': blockAltBg,
      'color': blockAltText,
      'border': blockBorder,
      'border-radius': str_(blk.radius, r.md || '16px'),
      'box-shadow': str_(blk.shadow || sh.soft, 'none'),
      'padding': `${blockPaddingY} ${blockPaddingX}`,
      'gap': blockGap,
      'font-family': font
    },
    headingBlock: {
      'background': str_(blk.headingBg, blockAltBg),
      'color': str_(blk.headingText, headingColor),
      'border-width': str_(blk.headingBorderWidth, blk.borderWidth || '0px'),
      'border-color': str_(blk.headingBorderColor, blk.borderColor || border),
      'border-style': 'solid',
      'border-radius': str_(blk.headingRadius, blk.radius || r.md || '16px'),
      'box-shadow': str_(blk.headingShadow, blk.shadow || 'none'),
      'padding': `${str_(blk.headingPaddingY, blockPaddingY)} ${str_(blk.headingPaddingX, blockPaddingX)}`,
      'font-family': headingFont,
      'font-size': str_(blk.headingFontSize, typo.h3Size || '28px'),
      'font-weight': str_(blk.headingFontWeight, headingWeight),
      'line-height': str_(blk.headingLineHeight, headingLineHeight),
      'letter-spacing': str_(blk.headingLetterSpacing, typo.headingLetterSpacing || '0px'),
      'text-transform': str_(blk.headingTextTransform, 'none')
    },
    contactBlock: {
      'background': str_(blk.contactBg, blockAltBg),
      'color': str_(blk.contactText, text),
      'border-width': str_(blk.contactBorderWidth, '0px'),
      'border-color': str_(blk.contactBorderColor, border),
      'border-style': 'solid',
      'border-radius': str_(blk.contactRadius, r.pill || '999px'),
      'box-shadow': str_(blk.contactShadow, 'none'),
      'padding': `${str_(blk.contactPaddingY, blockPaddingY)} ${str_(blk.contactPaddingX, blockPaddingX)}`,
      'gap': str_(blk.contactGap, blockGap),
      'font-family': font
    },
    blockSpacing: {
      'padding': `${blockPaddingY} ${blockPaddingX}`,
      'gap': blockGap
    },
    menuSpacing: {
      'gap': menuGap
    },
    transparentBlock: {
      'background': 'transparent',
      'color': sectionText,
      'border-color': 'transparent',
      'box-shadow': 'none',
      'font-family': font
    },
    transparentBlockAlt: {
      'background': 'transparent',
      'color': sectionAltText,
      'border-color': 'transparent',
      'box-shadow': 'none',
      'font-family': font
    },
    text: {
      'color': 'inherit',
      'font-family': font,
      'font-weight': textWeight,
      'font-size': bodySize,
      'line-height': textLineHeight,
      'letter-spacing': textLetterSpacing
    },
    mutedText: {
      'color': muted,
      'font-family': font
    },
    heading: {
      'color': headingColor,
      'font-family': headingFont,
      'font-weight': headingWeight,
      'line-height': headingLineHeight,
      'letter-spacing': str_(typo.headingLetterSpacing, typo.letterSpacing || '0px')
    },
    headingBlockText: {
      'color': 'inherit',
      'font-family': 'inherit',
      'font-size': str_(blk.headingFontSize, typo.h3Size || '28px'),
      'font-weight': str_(blk.headingFontWeight, headingWeight),
      'line-height': str_(blk.headingLineHeight, headingLineHeight),
      'letter-spacing': str_(blk.headingLetterSpacing, typo.headingLetterSpacing || '0px'),
      'text-transform': str_(blk.headingTextTransform, 'none')
    },
    h1: { 'font-size': str_(typo.h1Size, '56px') },
    h2: { 'font-size': str_(typo.h2Size, '42px') },
    h3: { 'font-size': str_(typo.h3Size, '28px') },
    h4: { 'font-size': str_(typo.h4Size, '24px') },
    h5: { 'font-size': str_(typo.h5Size, '20px') },
    h6: { 'font-size': str_(typo.h6Size, '18px') },
    logoTitle: {
      'color': str_(typo.logoTitleColor, sectionText),
      'font-family': headingFont,
      'font-size': str_(typo.logoTitleSize, typo.h5Size || '20px'),
      'font-weight': str_(typo.logoTitleWeight, headingWeight),
      'line-height': str_(typo.logoTitleLineHeight, headingLineHeight),
      'letter-spacing': str_(typo.logoTitleLetterSpacing, typo.headingLetterSpacing || '0px')
    },
    logoSubtitle: {
      'color': str_(typo.logoSubtitleColor, accent),
      'font-family': font,
      'font-size': str_(typo.logoSubtitleSize, bodySize),
      'font-weight': str_(typo.logoSubtitleWeight, textWeight),
      'line-height': str_(typo.logoSubtitleLineHeight, textLineHeight),
      'letter-spacing': str_(typo.logoSubtitleLetterSpacing, typo.letterSpacing || '0px')
    },
    contactText: {
      'color': 'inherit',
      'font-family': font,
      'font-size': str_(blk.contactFontSize, bodySize),
      'font-weight': str_(blk.contactFontWeight, textWeight),
      'line-height': str_(blk.contactLineHeight, textLineHeight),
      'letter-spacing': str_(blk.contactLetterSpacing, typo.letterSpacing || '0px')
    },
    button: {
      '--st-sem-button-normal-bg': str_(b.primaryBg || b.fill, primary),
      '--st-sem-button-normal-text': str_(b.primaryText || b.text, readableText_(primary, '#ffffff')),
      '--st-sem-button-normal-border-width': str_(b.primaryBorderWidth || b.borderWidth, '1px'),
      '--st-sem-button-normal-border-color': str_(b.primaryBorderColor || b.borderColor, accent),
      '--st-sem-button-hover-bg': str_(b.primaryHoverBg || b.hoverFill, accent),
      '--st-sem-button-hover-text': str_(b.primaryHoverText || b.hoverText, c.onAccent || '#ffffff'),
      '--st-sem-button-hover-border-color': str_(b.primaryHoverBorderColor || b.hoverBorder, accent),
      '--st-sem-button-active-bg': str_(b.primaryActiveBg, primary),
      '--st-sem-button-active-text': str_(b.primaryActiveText, c.onPrimary || '#ffffff'),
      '--st-sem-button-disabled-bg': str_(b.primaryDisabledBg, '#cbd5e1'),
      '--st-sem-button-disabled-text': str_(b.primaryDisabledText, '#64748b'),
      '--st-sem-button-disabled-opacity': str_(b.disabledOpacity, '.55'),
      '--st-sem-button-normal-shadow': str_(b.shadow, sh.soft || 'none'),
      '--st-sem-button-hover-shadow': str_(b.hoverShadow, sh.md || sh.soft || 'none'),
      '--st-sem-button-active-shadow': str_(b.activeShadow, 'inset 0 2px 8px rgba(15,23,42,.18)'),
      '--st-sem-focus-color': str_(b.focusRingColor, accent),
      '--st-sem-focus-width': str_(b.focusRingWidth, '2px'),
      '--st-sem-focus-offset': str_(b.focusRingOffset, '2px'),
      'background': 'var(--st-sem-button-state-bg, var(--st-sem-button-normal-bg))',
      'color': 'var(--st-sem-button-state-text, var(--st-sem-button-normal-text))',
      'border-width': 'var(--st-sem-button-normal-border-width)',
      'border-color': 'var(--st-sem-button-state-border-color, var(--st-sem-button-normal-border-color))',
      'border-style': 'solid',
      'border-radius': str_(b.radius, r.pill || '999px'),
      'box-shadow': 'var(--st-sem-button-state-shadow, var(--st-sem-button-normal-shadow))',
      'font-family': font,
      'font-size': str_(b.fontSize, bodySize),
      'font-weight': str_(b.fontWeight, '850'),
      'line-height': str_(b.lineHeight, '1.1'),
      'letter-spacing': str_(b.letterSpacing, '0px'),
      'padding': `${str_(b.paddingY, blockPaddingY)} ${str_(b.paddingX, blockPaddingX)}`,
      'gap': str_(b.gap, blockGap)
    },
    buttonSecondary: {
      '--st-sem-button-normal-bg': str_(b.secondaryBg, surface),
      '--st-sem-button-normal-text': str_(b.secondaryText, primary),
      '--st-sem-button-normal-border-width': str_(b.secondaryBorderWidth, '1px'),
      '--st-sem-button-normal-border-color': str_(b.secondaryBorderColor, border),
      '--st-sem-button-hover-bg': str_(b.secondaryHoverBg, surface2),
      '--st-sem-button-hover-text': str_(b.secondaryHoverText, primary),
      '--st-sem-button-hover-border-color': str_(b.secondaryHoverBorderColor, accent),
      '--st-sem-button-active-bg': str_(b.secondaryActiveBg, surface2),
      '--st-sem-button-active-text': str_(b.secondaryActiveText, primary),
      '--st-sem-button-disabled-bg': str_(b.primaryDisabledBg, '#cbd5e1'),
      '--st-sem-button-disabled-text': str_(b.primaryDisabledText, '#64748b'),
      '--st-sem-button-disabled-opacity': str_(b.disabledOpacity, '.55'),
      '--st-sem-button-normal-shadow': str_(b.shadow, sh.soft || 'none'),
      '--st-sem-button-hover-shadow': str_(b.hoverShadow, sh.md || sh.soft || 'none'),
      '--st-sem-button-active-shadow': str_(b.activeShadow, 'inset 0 2px 8px rgba(15,23,42,.18)'),
      '--st-sem-focus-color': str_(b.focusRingColor, accent),
      '--st-sem-focus-width': str_(b.focusRingWidth, '2px'),
      '--st-sem-focus-offset': str_(b.focusRingOffset, '2px'),
      'background': 'var(--st-sem-button-state-bg, var(--st-sem-button-normal-bg))',
      'color': 'var(--st-sem-button-state-text, var(--st-sem-button-normal-text))',
      'border-width': 'var(--st-sem-button-normal-border-width)',
      'border-color': 'var(--st-sem-button-state-border-color, var(--st-sem-button-normal-border-color))',
      'border-style': 'solid',
      'border-radius': str_(b.radius, r.pill || '999px'),
      'box-shadow': 'var(--st-sem-button-state-shadow, var(--st-sem-button-normal-shadow))',
      'font-family': font,
      'font-size': str_(b.fontSize, bodySize),
      'font-weight': str_(b.fontWeight, '850'),
      'line-height': str_(b.lineHeight, '1.1'),
      'letter-spacing': str_(b.letterSpacing, '0px'),
      'padding': `${str_(b.paddingY, blockPaddingY)} ${str_(b.paddingX, blockPaddingX)}`,
      'gap': str_(b.gap, blockGap)
    },
    buttonGhost: {
      '--st-sem-button-normal-bg': str_(b.ghostBg, 'transparent'),
      '--st-sem-button-normal-text': str_(b.ghostText, text),
      '--st-sem-button-normal-border-width': str_(b.ghostBorderWidth, '0px'),
      '--st-sem-button-normal-border-color': str_(b.ghostBorderColor, 'transparent'),
      '--st-sem-button-hover-bg': str_(b.ghostHoverBg, rgba_(accent, .12)),
      '--st-sem-button-hover-text': str_(b.ghostHoverText, accent),
      '--st-sem-button-hover-border-color': str_(b.ghostBorderColor, 'transparent'),
      '--st-sem-button-active-bg': str_(b.ghostActiveBg, rgba_(primary, .16)),
      '--st-sem-button-active-text': str_(b.ghostActiveText, primary),
      '--st-sem-button-disabled-bg': 'transparent',
      '--st-sem-button-disabled-text': str_(b.primaryDisabledText, '#64748b'),
      '--st-sem-button-disabled-opacity': str_(b.disabledOpacity, '.55'),
      '--st-sem-button-normal-shadow': 'none',
      '--st-sem-button-hover-shadow': 'none',
      '--st-sem-button-active-shadow': 'none',
      '--st-sem-focus-color': str_(b.focusRingColor, accent),
      '--st-sem-focus-width': str_(b.focusRingWidth, '2px'),
      '--st-sem-focus-offset': str_(b.focusRingOffset, '2px'),
      'background': 'var(--st-sem-button-state-bg, var(--st-sem-button-normal-bg))',
      'color': 'var(--st-sem-button-state-text, var(--st-sem-button-normal-text))',
      'border-width': 'var(--st-sem-button-normal-border-width)',
      'border-color': 'var(--st-sem-button-state-border-color, var(--st-sem-button-normal-border-color))',
      'border-style': 'solid',
      'border-radius': str_(b.radius, r.pill || '999px'),
      'box-shadow': 'var(--st-sem-button-state-shadow, var(--st-sem-button-normal-shadow))',
      'font-family': font,
      'font-size': str_(b.fontSize, bodySize),
      'font-weight': str_(b.fontWeight, '850'),
      'line-height': str_(b.lineHeight, '1.1'),
      'letter-spacing': str_(b.letterSpacing, '0px'),
      'padding': `${str_(b.paddingY, blockPaddingY)} ${str_(b.paddingX, blockPaddingX)}`,
      'gap': str_(b.gap, blockGap)
    },
    buttonLabel: {
      'color': 'inherit',
      'font-family': font,
      'font-size': str_(b.fontSize, bodySize),
      'font-weight': str_(b.fontWeight, '850'),
      'line-height': str_(b.lineHeight, '1.1'),
      'letter-spacing': str_(b.letterSpacing, '0px')
    },
    buttonIcon: {
      'background': 'transparent',
      'color': 'inherit',
      'border': '0',
      'box-shadow': 'none',
      'padding': '0'
    },
    logoIcon: {
      'background': str_(icons.logoBg, rgba_(accent, .09)),
      'color': str_(icons.logoColor, accent),
      'border-width': str_(icons.logoBorderWidth, '1px'),
      'border-color': str_(icons.logoBorderColor, rgba_(muted, .22)),
      'border-style': 'solid',
      'border-radius': str_(icons.logoRadius, r.md || '16px')
    },
    contactIcon: {
      'background': 'transparent',
      'color': accent,
      'border': '0',
      'box-shadow': 'none',
      'padding': '0'
    },
    icon: {
      '--st-sem-icon-normal-bg': str_(icons.bg || b.iconBg, rgba_(accent, .14)),
      '--st-sem-icon-normal-color': str_(icons.color || b.iconText, accent),
      '--st-sem-icon-hover-bg': str_(icons.hoverBg || b.iconHoverBg, accent),
      '--st-sem-icon-hover-color': str_(icons.hoverColor || b.iconHoverText, c.onAccent || '#ffffff'),
      '--st-sem-icon-active-bg': str_(icons.activeBg || b.iconActiveBg, primary),
      '--st-sem-icon-active-color': str_(icons.activeColor || b.iconActiveText, c.onPrimary || '#ffffff'),
      '--st-sem-focus-color': str_(icons.focusRingColor || b.focusRingColor, accent),
      '--st-sem-focus-width': str_(icons.focusRingWidth || b.focusRingWidth, '2px'),
      '--st-sem-focus-offset': str_(icons.focusRingOffset || b.focusRingOffset, '2px'),
      'background': 'var(--st-sem-icon-state-bg, var(--st-sem-icon-normal-bg))',
      'color': 'var(--st-sem-icon-state-color, var(--st-sem-icon-normal-color))',
      'border-width': str_(icons.borderWidth || b.iconBorderWidth, '1px'),
      'border-color': str_(icons.borderColor || b.iconBorderColor, rgba_(accent, .34)),
      'border-style': 'solid',
      'border-radius': str_(icons.radius || b.iconRadius, r.md || '16px'),
      'font-size': str_(icons.size, '1em')
    },
    menu: {
      '--st-sem-menu-normal-bg': menuBg,
      '--st-sem-menu-normal-text': menuTextSafe,
      '--st-sem-menu-normal-border-color': str_(menu.itemBorderColor, rgba_(accent, .34)),
      '--st-sem-menu-hover-bg': str_(menu.hoverBg, rgba_(accent, .14)),
      '--st-sem-menu-hover-text': str_(menu.hoverText, accent),
      '--st-sem-menu-hover-border-color': str_(menu.hoverBorderColor, accent),
      '--st-sem-menu-active-bg': str_(menu.activeBg, rgba_(primary, .16)),
      '--st-sem-menu-active-text': str_(menu.activeText, primary),
      '--st-sem-menu-active-border-color': str_(menu.activeBorderColor, primary),
      '--st-sem-focus-color': str_(menu.focusRingColor, accent),
      '--st-sem-focus-width': str_(menu.focusRingWidth, '2px'),
      '--st-sem-focus-offset': str_(menu.focusRingOffset, '2px'),
      'color': 'var(--st-sem-menu-state-text, var(--st-sem-menu-normal-text))',
      'background': 'var(--st-sem-menu-state-bg, var(--st-sem-menu-normal-bg))',
      'border-color': 'var(--st-sem-menu-state-border-color, var(--st-sem-menu-normal-border-color))',
      'border-width': str_(menu.itemBorderWidth, '1px'),
      'border-style': 'solid',
      'border-radius': str_(menu.radius, r.pill || '999px'),
      'gap': menuGap,
      'font-family': font,
      'font-size': str_(menu.fontSize, bodySize),
      'font-weight': str_(menu.fontWeight, textWeight),
      'line-height': str_(menu.lineHeight, textLineHeight),
      'letter-spacing': str_(menu.letterSpacing, typo.letterSpacing || '0px'),
      'padding': `${str_(menu.paddingY, blockPaddingY)} ${str_(menu.paddingX, blockPaddingX)}`
    },
    menuAlt: {
      '--st-sem-menu-normal-bg': str_(menu.altItemBg, menuBg),
      '--st-sem-menu-normal-text': str_(menu.altText, sectionAltText),
      '--st-sem-menu-normal-border-color': str_(menu.altItemBorderColor, menu.itemBorderColor || border),
      '--st-sem-menu-hover-bg': str_(menu.altHoverBg, menu.hoverBg || menuBg),
      '--st-sem-menu-hover-text': str_(menu.altHoverText, menu.hoverText || sectionAltText),
      '--st-sem-menu-hover-border-color': str_(menu.altHoverBorderColor, menu.hoverBorderColor || accent),
      '--st-sem-menu-active-bg': str_(menu.altActiveBg, menu.activeBg || primary),
      '--st-sem-menu-active-text': str_(menu.altActiveText, menu.activeText || sectionAltText),
      '--st-sem-menu-active-border-color': str_(menu.altActiveBorderColor, menu.activeBorderColor || accent),
      'color': 'var(--st-sem-menu-state-text, var(--st-sem-menu-normal-text))',
      'background': 'var(--st-sem-menu-state-bg, var(--st-sem-menu-normal-bg))',
      'border-color': 'var(--st-sem-menu-state-border-color, var(--st-sem-menu-normal-border-color))',
      'border-width': str_(menu.itemBorderWidth, '1px'),
      'border-style': 'solid',
      'border-radius': str_(menu.radius, r.pill || '999px'),
      'gap': menuGap,
      'font-family': font,
      'font-size': str_(menu.fontSize, bodySize),
      'font-weight': str_(menu.fontWeight, textWeight),
      'line-height': str_(menu.lineHeight, textLineHeight),
      'letter-spacing': str_(menu.letterSpacing, typo.letterSpacing || '0px'),
      'padding': `${str_(menu.paddingY, blockPaddingY)} ${str_(menu.paddingX, blockPaddingX)}`
    },
    menuText: {
      'color': 'inherit',
      'font-family': font,
      'font-size': str_(menu.fontSize, bodySize),
      'font-weight': str_(menu.fontWeight, '800'),
      'line-height': str_(menu.lineHeight, textLineHeight),
      'letter-spacing': str_(menu.letterSpacing, typo.letterSpacing || '0px')
    },
    menuAltText: {
      'color': 'inherit',
      'font-family': font,
      'font-size': str_(menu.fontSize, bodySize),
      'font-weight': str_(menu.fontWeight, '800'),
      'line-height': str_(menu.lineHeight, textLineHeight),
      'letter-spacing': str_(menu.letterSpacing, typo.letterSpacing || '0px')
    },
    link: {
      '--st-sem-link-normal-color': str_(links.color, accent || primary),
      '--st-sem-link-hover-color': str_(links.hoverColor, accent),
      '--st-sem-link-active-color': str_(links.activeColor, primary),
      '--st-sem-link-visited-color': str_(links.visitedColor, primary),
      '--st-sem-link-normal-decoration': str_(links.underline, 'none'),
      '--st-sem-link-hover-decoration': str_(links.underlineHover, 'underline'),
      '--st-sem-link-active-decoration': str_(links.underlineActive, links.underlineHover || 'underline'),
      '--st-sem-focus-color': str_(links.focusRingColor, accent),
      '--st-sem-focus-width': str_(links.focusRingWidth, '2px'),
      '--st-sem-focus-offset': str_(links.focusRingOffset, '2px'),
      'color': 'var(--st-sem-link-state-color, var(--st-sem-link-normal-color))',
      'text-decoration': 'var(--st-sem-link-state-decoration, var(--st-sem-link-normal-decoration))',
      'text-underline-offset': str_(links.underlineOffset, '3px'),
      'text-decoration-thickness': str_(links.underlineThickness, '1px'),
      'font-family': font,
      'font-size': str_(links.fontSize, bodySize),
      'font-weight': str_(links.fontWeight, textWeight),
      'line-height': str_(links.lineHeight, textLineHeight),
      'letter-spacing': str_(links.letterSpacing, typo.letterSpacing || '0px')
    },
    mediaOverlay: {
      '--st-sem-media-normal-overlay': str_(media.overlay, 'transparent'),
      '--st-sem-media-hover-overlay': str_(media.hoverOverlay, media.overlay || 'transparent'),
      'background': 'var(--st-sem-media-state-overlay, var(--st-sem-media-normal-overlay))',
      'border-width': str_(media.borderWidth, '0px'),
      'border-color': str_(media.borderColor, 'transparent'),
      'border-style': 'solid',
      'border-radius': str_(media.radius, r.md || '16px'),
      'box-shadow': str_(media.shadow, 'none')
    },
    debugTokens: {
      primary, accent, surface, surface2, text, muted, border,
      sectionBg, sectionAltBg, containerBg, containerAltBg, blockBg, blockAltBg,
      menuBg, menuText: menuTextSafe,
      sectionText, sectionAltText, containerText, containerAltText, blockText, blockAltText,
      densityPresetId: str_(spacing.densityPresetId, 'density-standard'),
      sectionPaddingY, sectionPaddingX, containerPadding,
      blockPaddingY, blockPaddingX, levelGap, containerGap, blockGap, menuGap
    }
  };
}

export function resolveTemplateStyleMap00946(theme = {}) {
  return cloneJson_(themeStyles_(isObj_(theme) ? theme : {}));
}
function getSiteRoot_() {
  return document.querySelector('#canvasView #site-canvas #site-root') || document.getElementById('site-root') || null;
}
function getRemovedContentSections_() {
  return [];
}

function getHeaderSlot_() { return document.getElementById('st-site-header-slot'); }
function getFooterSlot_() { return document.getElementById('st-site-footer-slot'); }

function areaRoots_(area) {
  if (area === 'header') return Array.from(getHeaderSlot_()?.querySelectorAll?.(':scope > .st-section') || []);
  if (area === 'main') return Array.from(document.getElementById('st-site-main-slot')?.querySelectorAll?.(':scope > .st-section') || []);
  if (area === 'footer') return Array.from(getFooterSlot_()?.querySelectorAll?.(':scope > .st-section') || []);
  return [];
}

function semanticOpts00946_(opts, semanticRole) {
  return { ...(opts || {}), semanticRole };
}

function applyThemeToArea_(area, theme, opts = {}) {
  const roots = areaRoots_(area);
  const s = themeStyles_(theme);
  const stat = { area, sections: roots.length, nodes: 0, props: 0, roles: {} };
  const applyRole00946_ = (role, nodes, style, semanticRole = '') => {
    const result = applyToMany_(nodes, style, semanticRole ? semanticOpts00946_(opts, semanticRole) : opts);
    const previous = stat.roles[role] || { matched: 0, nodes: 0, skipped: 0, props: 0 };
    stat.roles[role] = {
      matched: previous.matched + Number(result?.matched || 0),
      nodes: previous.nodes + Number(result?.nodes || 0),
      skipped: previous.skipped + Number(result?.skipped || 0),
      props: previous.props + Number(result?.props || 0)
    };
    addStats_(stat, result);
    return result;
  };
  roots.forEach((section) => {
    const isAltSection = !!section.matches?.('[data-st-surface="alternate"],[data-section-variant="alt"],.st-section--alt,.st-section--dark,.st-section--header-menu-strip');
    applyRole00946_('section', [section], s.section);
    applyRole00946_('section-alt', isAltSection ? [section] : [], s.sectionAlt);
    applyRole00946_('level', section.querySelectorAll('.st-row,[data-hf-node-type="level"]'), s.row);
    applyRole00946_('level-alt', isAltSection ? section.querySelectorAll('.st-row,[data-hf-node-type="level"]') : [], s.rowAlt);
    applyRole00946_('container', section.querySelectorAll('.st-row > .st-block,[data-hf-node-type="container"]'), s.container);
    applyRole00946_('container-alt', section.querySelectorAll('[data-st-surface="alternate"][data-hf-node-type="container"],[data-container-variant="alt"]'), s.containerAlt);
    applyRole00946_('block-spacing', section.querySelectorAll('.st-block:not(.st-row > .st-block)'), s.blockSpacing);
    applyRole00946_('block', section.querySelectorAll('.st-block:not(.st-row > .st-block):not(.st-block--heading):not([data-block-role="heading"]):not(.st-block--button):not(.st-block--icon):not(.st-block--menu):not(.st-block--menu-item):not(.st-block--logo):not(.st-block--phone)'), s.block);
    applyRole00946_('block-alt', section.querySelectorAll('[data-st-surface="alternate"].st-block,[data-block-variant="alt"]'), s.blockAlt);
    applyRole00946_('heading-block', section.querySelectorAll('.st-block--heading,[data-block-role="heading"]'), s.headingBlock, 'heading-block');
    applyRole00946_('logo-block', section.querySelectorAll('.st-block--logo,[data-block-role="logo"]'), s.transparentBlock, 'logo');
    applyRole00946_('contact-block', section.querySelectorAll('.st-block--phone,[data-block-role="phone"],[data-block-kind="phone"]'), s.contactBlock, 'contact');
    applyRole00946_('menu-block', section.querySelectorAll('.st-block--menu,[data-block-role="menu"],[data-st-menu="1"]'), s.transparentBlock);
    applyRole00946_('menu-block-alt', isAltSection ? section.querySelectorAll('.st-block--menu,[data-block-role="menu"],[data-st-menu="1"]') : [], s.transparentBlockAlt);
    applyRole00946_('icon-block', section.querySelectorAll('.st-block--icon,[data-block-role="icon"],[data-block-kind="icon"]'), s.transparentBlock, 'icon-block');
    applyRole00946_('body-text', section.querySelectorAll('.st-text-edit,[data-st-text-target="1"],p,li,.st-menu__text,.st-phone__text'), s.text);
    applyRole00946_('heading-text', section.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"],[data-st-heading="1"],.st-text-edit--heading,.st-heading__text'), s.heading, 'heading');
    applyRole00946_('heading-default', section.querySelectorAll('[role="heading"]:not([aria-level]),[data-st-heading="1"]:not([aria-level]),.st-text-edit--heading:not([aria-level])'), s.h2);
    applyRole00946_('heading-h1', section.querySelectorAll('h1,[aria-level="1"],[data-heading-level="1"] [role="heading"],[data-heading-level="1"] [data-st-heading="1"]'), s.h1);
    applyRole00946_('heading-h2', section.querySelectorAll('h2,[aria-level="2"],[data-heading-level="2"] [role="heading"],[data-heading-level="2"] [data-st-heading="1"]'), s.h2);
    applyRole00946_('heading-h3', section.querySelectorAll('h3,[aria-level="3"],[data-heading-level="3"] [role="heading"],[data-heading-level="3"] [data-st-heading="1"]'), s.h3);
    applyRole00946_('heading-h4', section.querySelectorAll('h4,[aria-level="4"],[data-heading-level="4"] [role="heading"],[data-heading-level="4"] [data-st-heading="1"]'), s.h4);
    applyRole00946_('heading-h5', section.querySelectorAll('h5,[aria-level="5"],[data-heading-level="5"] [role="heading"],[data-heading-level="5"] [data-st-heading="1"]'), s.h5);
    applyRole00946_('heading-h6', section.querySelectorAll('h6,[aria-level="6"],[data-heading-level="6"] [role="heading"],[data-heading-level="6"] [data-st-heading="1"]'), s.h6);
    applyRole00946_('heading-block-text', section.querySelectorAll('.st-block--heading .st-text-edit,.st-block--heading .st-heading__text,[data-block-role="heading"] .st-text-edit'), s.headingBlockText, 'heading-text');
    applyRole00946_('logo-title', section.querySelectorAll('.st-logo__title,[data-logo-title="1"]'), s.logoTitle, 'logo-title');
    applyRole00946_('logo-subtitle', section.querySelectorAll('.st-logo__subtitle,[data-logo-subtitle="1"]'), s.logoSubtitle, 'logo-subtitle');
    applyRole00946_('contact-text', section.querySelectorAll('.st-phone__text,[data-phone-text="1"]'), s.contactText, 'contact-text');
    applyRole00946_('button-primary', section.querySelectorAll('.st-block--button,button.st-button,.st-button,.st-btn,.st-cta'), s.button, 'button-primary');
    applyRole00946_('button-secondary', section.querySelectorAll('.st-button--secondary,.st-btn--secondary,[data-button-variant="secondary"],[data-variant="secondary"]'), s.buttonSecondary, 'button-secondary');
    applyRole00946_('button-ghost', section.querySelectorAll('.st-button--ghost,.st-btn--ghost,[data-button-variant="ghost"],[data-variant="ghost"]'), s.buttonGhost, 'button-ghost');
    applyRole00946_('button-label', section.querySelectorAll('.st-block--button .st-button__label,.st-button__label,.st-btn__label'), s.buttonLabel, 'button-label');
    applyRole00946_('button-icon', section.querySelectorAll('.st-button__iconbtn,.st-block--button .st-icon-btn'), s.buttonIcon, 'button-icon');
    applyRole00946_('icon', section.querySelectorAll('.st-icon-btn:not(.st-button__iconbtn):not(.st-logo__iconbtn):not(.st-phone__iconbtn),.st-icon-wrap'), s.icon, 'icon');
    applyRole00946_('logo-icon', section.querySelectorAll('.st-logo__iconbtn,.st-logo__mark'), s.logoIcon, 'logo-icon');
    applyRole00946_('contact-icon', section.querySelectorAll('.st-phone__iconbtn,.st-phone__icon'), s.contactIcon, 'contact-icon');
    applyRole00946_('navigation', section.querySelectorAll('.st-menu__link,.st-menu a,.st-block--menu-item,[data-st-menu-item="1"]'), s.menu, 'navigation');
    applyRole00946_('navigation-alt', isAltSection ? section.querySelectorAll('.st-menu__link,.st-menu a,.st-block--menu-item,[data-st-menu-item="1"]') : [], s.menuAlt, 'navigation-alt');
    applyRole00946_('menu-spacing', section.querySelectorAll('.st-block--menu,.st-menu,[data-st-menu="1"]'), s.menuSpacing);
    applyRole00946_('menu-text', section.querySelectorAll('.st-menu__text,.st-menu__link span,.st-block--menu-item span,[data-st-menu-item="1"] span'), s.menuText, 'navigation-text');
    applyRole00946_('menu-text-alt', isAltSection ? section.querySelectorAll('.st-menu__text,.st-menu__link span,.st-block--menu-item span,[data-st-menu-item="1"] span') : [], s.menuAltText, 'navigation-text-alt');
    applyRole00946_('link', section.querySelectorAll('a:not(.st-menu__link)'), s.link, 'link');
    applyRole00946_('media-overlay', section.querySelectorAll('.st-bgfx__overlay,[data-st-media-overlay],.st-media-overlay'), s.mediaOverlay, 'media-overlay');
  });
  return stat;
}


let previewSnapshot00780_ = null;
let previewActive00780_ = false;
let previewOwner00946_ = '';

function collectPreviewNodes_(areas = ['header', 'main', 'footer']) {
  const out = [];
  areas.forEach((area) => {
    areaRoots_(area).forEach((root) => {
      if (root instanceof HTMLElement) out.push(root);
      root?.querySelectorAll?.('*')?.forEach?.((el) => { if (el instanceof HTMLElement) out.push(el); });
    });
  });
  return out;
}

function takePreviewSnapshot_(owner = 'global-design', areas = ['header', 'main', 'footer']) {
  if (previewSnapshot00780_) return previewSnapshot00780_;
  const snapshot = [];
  collectPreviewNodes_(areas).forEach((el) => {
    snapshot.push({
      el,
      style: el.getAttribute('style'),
      styleSource: el.getAttribute('data-st-style-source'),
      semanticStyle: el.getAttribute('data-st-semantic-style'),
      semanticRole: el.getAttribute('data-st-semantic-role')
    });
  });
  previewSnapshot00780_ = snapshot;
  previewOwner00946_ = String(owner || 'global-design');
  return snapshot;
}

function restorePreviewSnapshot_(reason = 'preview-restore', owner = '') {
  if (!previewSnapshot00780_) return { restored: 0, reason: 'no-preview' };
  if (owner && previewOwner00946_ !== owner) return { restored: 0, reason: 'preview-owner-mismatch', owner: previewOwner00946_ };
  let restored = 0;
  previewSnapshot00780_.forEach((item) => {
    const el = item?.el;
    if (!(el instanceof HTMLElement) || !el.isConnected) return;
    try {
      if (item.style == null) el.removeAttribute('style');
      else el.setAttribute('style', item.style);
      if (item.styleSource == null) el.removeAttribute('data-st-style-source');
      else el.setAttribute('data-st-style-source', item.styleSource);
      if (item.semanticStyle == null) el.removeAttribute('data-st-semantic-style');
      else el.setAttribute('data-st-semantic-style', item.semanticStyle);
      if (item.semanticRole == null) el.removeAttribute('data-st-semantic-role');
      else el.setAttribute('data-st-semantic-role', item.semanticRole);
      restored += 1;
    } catch (_) {}
  });
  previewSnapshot00780_ = null;
  previewActive00780_ = false;
  const restoredOwner = previewOwner00946_;
  previewOwner00946_ = '';
  log_('explicit-theme-preview-restored-00780', { reason, owner: restoredOwner, restored, noCommit: true, noStorage: true }, 'info');
  return { restored, reason, owner: restoredOwner };
}

function applyPreviewTheme_(detail = {}) {
  const reason = String(detail.reason || '');
  const presetId = String(detail.presetId || '');
  if (!presetId || !/preset-hover|preset-preview/i.test(reason)) return null;
  const theme = detail.resolved && isObj_(detail.resolved) ? detail.resolved : readTheme_();
  const started = performance?.now?.() || Date.now();
  if (previewSnapshot00780_ && previewOwner00946_ !== 'global-design') {
    restorePreviewSnapshot_('before-global-design-preview-00946');
  }
  takePreviewSnapshot_('global-design', ['header', 'main', 'footer']);
  previewActive00780_ = true;
  const header = applyThemeToArea_('header', theme, { preview: true });
  const main = applyThemeToArea_('main', theme, { preview: true });
  const footer = applyThemeToArea_('footer', theme, { preview: true });
  const durationMs = Math.round(((performance?.now?.() || Date.now()) - started) * 10) / 10;
  const summary = { reason, presetId, header, main, footer, durationMs, noCommit: true, noStorage: true, paletteTokens: themeStyles_(theme).debugTokens || null };
  log_('explicit-theme-preview-hmf-00780', summary, durationMs > 60 ? 'warn' : 'info');
  return summary;
}

function mergeCssText_(cssText, patch = {}) {
  const probe = document.createElement('div');
  probe.style.cssText = String(cssText || '');
  Object.entries(patch || {}).forEach(([property, value]) => {
    if (!property || value == null || String(value).trim() === '') return;
    probe.style.setProperty(property, String(value));
  });
  return probe.style.cssText;
}

function mainSemanticComponent00946_(node) {
  const className = String(node?.meta?.dom?.className || '').toLowerCase();
  const authored = new Set((className.match(/(?:^|\s)st-block--[^\s]+/g) || [])
    .map((value) => value.trim().slice('st-block--'.length)));
  const semanticPriority = ['heading', 'button', 'logo', 'phone', 'menu-item', 'menu', 'icon', 'link', 'image', 'text'];
  return semanticPriority.find((component) => authored.has(component))
    || String(node?.componentType || 'text').toLowerCase();
}

function mainNodeThemePatch_(node, styles, opts = {}) {
  if (!node || node.area !== 'main') return null;
  const source = String(node.meta?.dom?.dataset?.stStyleSource || node.meta?.styleSource || '').toLowerCase();
  if (opts?.force !== true && (source === 'design' || source === 'ai')) return null;
  const tokens = styles.debugTokens || {};
  const preserveGeometry = opts?.preserveGeometry === true;
  const layout = { ...(node.layout || {}) };
  const padding = { ...(layout.padding || {}) };
  const mergeVisualStyle00946_ = (base, patch) => ({
    ...(base || {}),
    ...visualStylePatch00946_(patch, preserveGeometry)
  });
  const className = String(node.meta?.dom?.className || '').toLowerCase();
  const isAlt = opts?.altContext === true || /(?:^|\s)st-(?:section|container|block)--(?:alt|dark)(?:\s|$)|(?:^|\s)st-section--header-menu-strip(?:\s|$)/.test(className);
  if (node.kind === 'section') {
    if (!preserveGeometry) {
      const y = pxNumber_(tokens.sectionPaddingY, 24);
      const x = pxNumber_(tokens.sectionPaddingX, 24);
      layout.padding = { ...padding, top: y, right: x, bottom: y, left: x };
    }
    return { style: mergeVisualStyle00946_(node.style, isAlt ? styles.sectionAlt : styles.section), layout };
  }
  if (node.kind === 'level') {
    if (!preserveGeometry) layout.gap = pxNumber_(tokens.levelGap, 14);
    return { style: mergeVisualStyle00946_(node.style, styles.row), layout };
  }
  if (node.kind === 'container') {
    if (!preserveGeometry) {
      const p = pxNumber_(tokens.containerPadding, 0);
      layout.padding = { ...padding, top: p, right: p, bottom: p, left: p };
      layout.gap = pxNumber_(tokens.containerGap, 12);
    }
    return { style: mergeVisualStyle00946_(node.style, isAlt ? styles.containerAlt : styles.container), layout };
  }
  if (node.kind !== 'block') return null;

  const component = mainSemanticComponent00946_(node);
  const buttonVariant = String(node.meta?.dom?.dataset?.buttonVariant || node.meta?.dom?.dataset?.variant || '').toLowerCase();
  let outer = isAlt ? styles.blockAlt : styles.block;
  let inner = null;
  let semanticRole = 'block';
  if (component === 'heading') {
    outer = styles.headingBlock;
    const headingLevel = String(
      node.content?.headingLevel
      || node.meta?.dom?.dataset?.headingLevel
      || node.meta?.dom?.attributes?.['aria-level']
      || String(node.content?.html || '').match(/aria-level\s*=\s*["']([1-6])["']/i)?.[1]
      || '2'
    ).replace(/\D/g, '') || '2';
    const headingTag = `h${Math.min(6, Math.max(1, Number(headingLevel) || 2))}`;
    inner = { ...styles.heading, ...(styles[headingTag] || styles.h2), ...styles.headingBlockText };
    semanticRole = 'heading-block';
  }
  else if (component === 'text') { inner = styles.text; semanticRole = 'body-text'; }
  else if (component === 'button') {
    const secondary = buttonVariant === 'secondary' || /(?:^|\s)st-(?:button|btn)--secondary(?:\s|$)/.test(className);
    const ghost = buttonVariant === 'ghost' || /(?:^|\s)st-(?:button|btn)--ghost(?:\s|$)/.test(className);
    outer = ghost ? styles.buttonGhost : (secondary ? styles.buttonSecondary : styles.button);
    inner = styles.buttonLabel;
    semanticRole = ghost ? 'button-ghost' : (secondary ? 'button-secondary' : 'button-primary');
  }
  else if (component === 'menu' || component === 'menu-item') {
    outer = isAlt ? styles.menuAlt : styles.menu;
    inner = isAlt ? styles.menuAltText : styles.menuText;
    semanticRole = isAlt ? 'navigation-alt' : 'navigation';
  }
  else if (component === 'logo') { outer = styles.transparentBlock; inner = styles.logoTitle; semanticRole = 'logo'; }
  else if (component === 'phone') { outer = styles.contactBlock; inner = styles.contactText; semanticRole = 'contact'; }
  else if (component === 'icon') { outer = styles.icon; semanticRole = 'icon'; }
  else if (component === 'link') { outer = styles.transparentBlock; inner = styles.link; semanticRole = 'link'; }

  const meta = { ...(node.meta || {}), styleSource: 'global' };
  if (semanticRole) {
    meta.semanticStyle = '00946';
    meta.semanticRole = semanticRole;
  }
  if (inner) meta.textEditableStyle = mergeCssText_(meta.textEditableStyle, inner);
  if (!preserveGeometry) {
    const y = pxNumber_(tokens.blockPaddingY, 10);
    const x = pxNumber_(tokens.blockPaddingX, 14);
    layout.padding = { ...padding, top: y, right: x, bottom: y, left: x };
    layout.gap = pxNumber_(component === 'menu' || component === 'menu-item' ? tokens.menuGap : tokens.blockGap, 8);
  }
  return { style: mergeVisualStyle00946_(node.style, outer), layout, meta };
}

function sameJsonValue_(a, b) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch (_) { return false; }
}

function nodeNeedsPatch_(node, patch) {
  if (!node || !patch) return false;
  return Object.entries(patch).some(([key, value]) => !sameJsonValue_(node[key], value));
}

function cloneJson_(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function mainNodeHasAltContext00946_(node, store) {
  let current = node;
  const visited = new Set();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    const className = String(current.meta?.dom?.className || '').toLowerCase();
    if (/(?:^|\s)st-(?:section|container|block)--(?:alt|dark)(?:\s|$)|(?:^|\s)st-section--header-menu-strip(?:\s|$)/.test(className)) return true;
    current = current.parentId ? store?.maybeGet?.(current.parentId) : null;
  }
  return false;
}

function commitMainTheme_(theme, reason, hmfHistory = null, externalStateChanged = false, options = {}) {
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  const store = authority?.store;
  if (!store || store.hasActiveTransaction?.()) return { ok: false, reason: 'store-unavailable-or-busy' };
  const styles = themeStyles_(theme);
  const patches = {};
  const mainPatchIds = [];
  const mainRoles = {};
  let mainMatched = 0;
  if (options.applyMain !== false) {
    store.all().forEach((node) => {
      if (node?.area !== 'main' || !['section', 'level', 'container', 'block'].includes(node.kind)) return;
      mainMatched += 1;
      const patch = mainNodeThemePatch_(node, styles, {
        force: options.force === true,
        preserveGeometry: options.preserveGeometry === true,
        altContext: mainNodeHasAltContext00946_(node, store)
      });
      if (patch && nodeNeedsPatch_(node, patch)) {
        patches[node.id] = patch;
        mainPatchIds.push(node.id);
        const role = String(patch.meta?.semanticRole || node.kind || 'unassigned');
        mainRoles[role] = Number(mainRoles[role] || 0) + 1;
      }
    });
  }
  if (options.siteMeta && isObj_(options.siteMeta)) {
    const root = store.maybeGet?.(store.rootId || 'sf_site_root');
    if (root) {
      const patch = { meta: { ...(root.meta || {}), ...cloneJson_(options.siteMeta) } };
      if (nodeNeedsPatch_(root, patch)) patches[root.id] = patch;
    }
  }
  const pendingIds = Object.keys(patches);
  if (!pendingIds.length && !externalStateChanged) {
    log_('explicit-theme-main-noop-00934', { reason, noCommit: true, noStorage: true, noRender: true }, 'info');
    return { ok: true, nodes: 0, matched: mainMatched, skipped: mainMatched, roles: mainRoles, noChange: true, historyRecorded: false };
  }
  const transactionLabel = String(options.transactionLabel || 'ready-theme-hmf-00935');
  const transactionDetail = isObj_(options.transactionDetail) ? cloneJson_(options.transactionDetail) : {};
  store.beginTransaction(transactionLabel, {
    area: 'header-main-footer',
    reason,
    externalStateChanged,
    hmfThemeHistory: hmfHistory,
    ...transactionDetail
  });
  try {
    const changedIds = store.updateNodes(patches, { emit: false, rebuildTreeMeta: false });
    store.markTransactionChanges(changedIds);
    const result = store.commitTransaction({
      area: 'header-main-footer',
      reason,
      externalStateChanged,
      hmfThemeHistory: hmfHistory,
      ...transactionDetail
    });
    authority.persistStore?.(`${transactionLabel}:${reason}`);
    if (mainPatchIds.length) authority.renderMainSelectionArea?.(`${transactionLabel}:${reason}`);
    return {
      ok: true,
      nodes: changedIds.length,
      mainNodes: mainPatchIds.length,
      matched: mainMatched,
      skipped: Math.max(0, mainMatched - mainPatchIds.length),
      roles: mainRoles,
      transactionId: result.id,
      historyRecorded: result.historyRecorded
    };
  } catch (error) {
    store.rollbackTransaction?.({ message: String(error?.message || error || '') });
    return { ok: false, reason: String(error?.message || error || 'main-theme-commit-failed') };
  }
}

function captureHeaderFooterState_(area) {
  const runtime = area === 'header' ? window.SiteHeaderRuntime : window.SiteFooterRuntime;
  const state = area === 'header' ? window.ST_HEADER_STATE : window.ST_FOOTER_STATE;
  const mode = runtime?.getMode?.(runtime?.getPageId?.()) === 'page' ? 'page' : 'global';
  const pageId = runtime?.getPageId?.() || '';
  const stateValue = state?.getState?.() || null;
  const stateEntry = mode === 'page' && pageId
    ? stateValue?.pages?.[String(pageId)] || null
    : stateValue?.global || null;
  const slot = area === 'header' ? getHeaderSlot_() : getFooterSlot_();
  const jsonEntry = getEntry({ area, mode, pageId });
  const currentEntry = stateEntry || jsonEntry || {
    html: slot instanceof HTMLElement ? String(slot.innerHTML || '') : ''
  };
  return {
    area,
    mode,
    pageId,
    entry: cloneJson_(currentEntry),
    source: stateEntry ? 'area-state' : (jsonEntry ? 'hf-json-state' : 'slot-html')
  };
}

function restoreHeaderFooterState_(snapshot, reason) {
  const area = snapshot?.area === 'footer' ? 'footer' : 'header';
  const mode = snapshot?.mode === 'page' ? 'page' : 'global';
  const pageId = String(snapshot?.pageId || '');
  const entry = cloneJson_(snapshot?.entry || null);
  const slot = area === 'header' ? getHeaderSlot_() : getFooterSlot_();
  const state = area === 'header' ? window.ST_HEADER_STATE : window.ST_FOOTER_STATE;
  const runtime = area === 'header' ? window.SiteHeaderRuntime : window.SiteFooterRuntime;
  if (entry?.model) setEntry({ area, mode, pageId, entry });
  if (slot instanceof HTMLElement) slot.innerHTML = String(entry?.html || '');
  if (entry && state) {
    const data = Object.assign({}, entry, { source: `ready-theme-history-${reason}-00935` });
    if (entry.model && mode === 'page' && pageId && typeof state.setPageTemplateData === 'function') {
      state.setPageTemplateData(pageId, data);
    } else if (entry.model && typeof state.setGlobalTemplateData === 'function') {
      state.setGlobalTemplateData(data);
    } else if (mode === 'page' && pageId && typeof state.setPageHTML === 'function') {
      state.setPageHTML(pageId, String(entry.html || ''));
    } else if (typeof state.setGlobalHTML === 'function') {
      state.setGlobalHTML(String(entry.html || ''));
    }
  }
  try { runtime?.setMode?.(mode, pageId); } catch (_) {}
  try { runtime?.sync?.(); } catch (_) {}
  return { area, mode, pageId, restored: !!entry, htmlLength: String(entry?.html || '').length };
}

function restoreThemeHistoryAreas_(detail = {}) {
  const history = detail?.detail?.hmfThemeHistory;
  const action = String(detail?.action || '');
  if (!history || !['undo', 'redo'].includes(action)) return null;
  const target = action === 'undo' ? history.before : history.after;
  if (!target) return null;
  const header = target.header ? restoreHeaderFooterState_(target.header, action) : null;
  const footer = target.footer ? restoreHeaderFooterState_(target.footer, action) : null;
  log_('explicit-theme-history-restored-hmf-00935', {
    action,
    transactionId: detail?.id || '',
    header,
    footer,
    mainRestoredBySiteFrameStore: true
  });
  return { header, footer };
}

function commitHeaderFooter_(area, reason, options = {}) {
  try {
    const slot = area === 'header' ? getHeaderSlot_() : getFooterSlot_();
    if (!(slot instanceof HTMLElement)) return { ok: false, reason: 'slot-not-found' };
    const runtime = area === 'header' ? window.SiteHeaderRuntime : window.SiteFooterRuntime;
    const state = area === 'header' ? window.ST_HEADER_STATE : window.ST_FOOTER_STATE;
    const mode = runtime?.getMode?.(runtime?.getPageId?.()) || 'global';
    const pageId = runtime?.getPageId?.() || '';
    const existingEntry = getEntry({ area, mode: mode === 'page' ? 'page' : 'global', pageId });
    const templateId = String(options.templateId || existingEntry?.templateId || `${area}_explicit_theme_00780`);
    const res = commitAreaFromSlotToJsonState({
      area,
      mode: mode === 'page' ? 'page' : 'global',
      pageId,
      slot,
      templateId,
      reason
    });
    let entry = res?.entry || null;
    if (entry && state) {
      const data = Object.assign({}, entry, { source: 'explicit-theme-apply-00780' });
      if (mode === 'page' && pageId && typeof state.setPageTemplateData === 'function') state.setPageTemplateData(String(pageId), data);
      else if (typeof state.setGlobalTemplateData === 'function') state.setGlobalTemplateData(data);
    } else if (state) {
      const html = String(slot.innerHTML || '');
      if (mode === 'page' && pageId && typeof state.setPageHTML === 'function') state.setPageHTML(String(pageId), html);
      else if (typeof state.setGlobalHTML === 'function') state.setGlobalHTML(html);
      const stateValue = state.getState?.() || null;
      entry = mode === 'page' && pageId ? stateValue?.pages?.[String(pageId)] || { html } : stateValue?.global || { html };
    }
    return {
      ok: !!entry,
      reason: entry ? (res?.entry ? 'hf-json-state' : 'area-state-html') : (res?.reason || 'state-entry-not-created'),
      mode,
      pageId,
      htmlLength: String(entry?.html || '').length
    };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e || 'commit-failed') };
  }
}

function applyExplicitTheme_(detail = {}) {
  const reason = String(detail.reason || '');
  const isLive = LIVE_REASON_RE_.test(reason);
  const isExplicit = EXPLICIT_REASON_RE_.test(reason);
  if (!reason || isLive || !isExplicit) {
    if (reason && (isLive || /global-design-/i.test(reason))) {
      log_('explicit-theme-stage4-skip-00780', { reason, isLive, isExplicit, noCommit: true }, 'info');
    }
    return null;
  }
  const theme = readTheme_();
  const presetId = String(detail.presetId || theme.presetId || theme.id || '');
  const started = performance?.now?.() || Date.now();
  const before = {
    header: captureHeaderFooterState_('header'),
    footer: captureHeaderFooterState_('footer')
  };
  const header = applyThemeToArea_('header', theme);
  const footer = applyThemeToArea_('footer', theme);
  const commits = {
    header: commitHeaderFooter_('header', `explicit-theme-${reason}-00780`),
    footer: commitHeaderFooter_('footer', `explicit-theme-${reason}-00780`)
  };
  const after = {
    header: captureHeaderFooterState_('header'),
    footer: captureHeaderFooterState_('footer')
  };
  const externalStateChanged = Number(header?.props || 0) > 0 || Number(footer?.props || 0) > 0;
  const main = commitMainTheme_(
    theme,
    `explicit-theme-${reason}-00935`,
    { version: '00935-hmf-theme-history', before, after },
    externalStateChanged
  );
  const durationMs = Math.round(((performance?.now?.() || Date.now()) - started) * 10) / 10;
  const summary = { reason, presetId, header, main, footer, commits, durationMs, paletteTokens: themeStyles_(theme).debugTokens || null };
  log_('explicit-theme-apply-hmf-stage4-00780', summary, durationMs > 60 ? 'warn' : 'info');
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: `explicit-theme-apply-stage4-00780:${reason}` } })); } catch (_) {}
  return summary;
}

function applyLiveGlobalControls_(detail = {}) {
  const reason = String(detail.reason || '');
  if (!LIVE_REASON_RE_.test(reason) || !EXPLICIT_REASON_RE_.test(reason)) return null;
  const theme = readTheme_();
  const started = performance?.now?.() || Date.now();
  const header = applyThemeToArea_('header', theme, { preview: true });
  const main = applyThemeToArea_('main', theme, { preview: true });
  const footer = applyThemeToArea_('footer', theme, { preview: true });
  const durationMs = Math.round(((performance?.now?.() || Date.now()) - started) * 10) / 10;
  const summary = {
    reason, header, main, footer, durationMs,
    noCommit: true, noSiteFrameStore: true, noRootSave: true, noHistory: true
  };
  log_('explicit-global-controls-live-hmf-00936', summary, durationMs > 60 ? 'warn' : 'info');
  return summary;
}

const TEMPLATE_STYLE_SYNC_PREVIEW_OWNER_00946 = 'template-style-sync-00946';
const TEMPLATE_STYLE_SYNC_TRANSACTION_00946 = 'template-style-sync-once-00946';
const TEMPLATE_STYLE_SYNC_TRANSACTION_00953 = 'template-style-sync-save-00953';
const TEMPLATE_STYLE_SYNC_TRANSACTION_00954 = 'template-style-sync-save-00954';
let templateStyleSyncLast00946_ = null;

function rememberTemplateStyleSync00946_(event, detail, level = 'info') {
  templateStyleSyncLast00946_ = {
    at: new Date().toISOString(),
    event: String(event || ''),
    level: String(level || 'info'),
    detail: cloneJson_(detail || {})
  };
  log_(event, detail, level);
  return detail;
}

function templateStyleSyncFailure00946_(event, reason, detail = {}) {
  return rememberTemplateStyleSync00946_(event, {
    ok: false,
    reason: String(reason || 'unknown'),
    ...cloneJson_(detail || {})
  }, 'error');
}

function templateStyleSyncAreas00946_(areas) {
  const allowed = new Set(['header', 'main', 'footer']);
  return [...new Set(Array.isArray(areas) ? areas.map((area) => String(area || '').trim()).filter((area) => allowed.has(area)) : [])];
}

export function previewTemplateStyleSync00946(detail = {}) {
  const theme = detail.theme;
  const areas = templateStyleSyncAreas00946_(detail.areas);
  if (!isObj_(theme)) return templateStyleSyncFailure00946_('template-style-sync-preview-rejected-00946', 'style-profile-theme-required');
  if (!areas.length) return templateStyleSyncFailure00946_('template-style-sync-preview-rejected-00946', 'no-master-style-targets');
  if (previewSnapshot00780_) restorePreviewSnapshot_('before-template-style-sync-preview-00946');
  takePreviewSnapshot_(TEMPLATE_STYLE_SYNC_PREVIEW_OWNER_00946, ['header', 'main', 'footer']);
  previewActive00780_ = true;
  const result = {};
  areas.forEach((area) => {
    result[area] = applyThemeToArea_(area, theme, { preview: true, force: true, preserveGeometry: true });
  });
  const summary = {
    ok: true,
    mode: 'preview',
    masterArea: String(detail.masterArea || ''),
    areas,
    result,
    profile: {
      templateId: String(detail.sourceTemplateId || ''),
      profileId: String(detail.profileId || ''),
      collectionId: String(detail.collectionId || '')
    },
    geometryPreserved: true,
    noCommit: true,
    noStorage: true,
    noHistory: true
  };
  return rememberTemplateStyleSync00946_('template-style-sync-preview-00946', summary, 'info');
}

export function cancelTemplateStyleSyncPreview00946(reason = 'template-style-sync-cancel-00946') {
  const result = restorePreviewSnapshot_(String(reason || 'template-style-sync-cancel-00946'), TEMPLATE_STYLE_SYNC_PREVIEW_OWNER_00946);
  const summary = { ok: result.reason !== 'preview-owner-mismatch', geometryPreserved: true, ...result };
  return rememberTemplateStyleSync00946_('template-style-sync-preview-cancelled-00946', summary, summary.ok ? 'info' : 'warn');
}

export function applyTemplateStyleSyncOnce00946(detail = {}) {
  const theme = detail.theme;
  const areas = templateStyleSyncAreas00946_(detail.areas);
  const masterArea = String(detail.masterArea || '');
  if (!isObj_(theme)) return templateStyleSyncFailure00946_('template-style-sync-apply-rejected-00946', 'style-profile-theme-required');
  if (!areas.length) return templateStyleSyncFailure00946_('template-style-sync-apply-rejected-00946', 'no-master-style-targets');
  if (!['header', 'main', 'footer'].includes(masterArea)) return templateStyleSyncFailure00946_('template-style-sync-apply-rejected-00946', 'invalid-master-area', { masterArea });
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  if (!authority?.store || authority.store.hasActiveTransaction?.()) {
    return templateStyleSyncFailure00946_('template-style-sync-apply-rejected-00946', 'site-frame-store-unavailable-or-busy', { masterArea, areas });
  }
  if (previewSnapshot00780_) restorePreviewSnapshot_('before-template-style-sync-commit-00946');

  const activeTemplates = isObj_(detail.activeTemplates) ? detail.activeTemplates : {};
  const before = {};
  if (areas.includes('header')) before.header = captureHeaderFooterState_('header');
  if (areas.includes('footer')) before.footer = captureHeaderFooterState_('footer');

  const painted = {};
  const commits = {};
  if (areas.includes('header')) {
    painted.header = applyThemeToArea_('header', theme, { force: true, preserveGeometry: true });
    commits.header = commitHeaderFooter_('header', 'template-style-sync-once-00946', {
      templateId: activeTemplates.header?.templateId || ''
    });
  }
  if (areas.includes('footer')) {
    painted.footer = applyThemeToArea_('footer', theme, { force: true, preserveGeometry: true });
    commits.footer = commitHeaderFooter_('footer', 'template-style-sync-once-00946', {
      templateId: activeTemplates.footer?.templateId || ''
    });
  }

  const after = {};
  if (areas.includes('header')) after.header = captureHeaderFooterState_('header');
  if (areas.includes('footer')) after.footer = captureHeaderFooterState_('footer');
  const externalStateChanged = ['header', 'footer'].some((area) => areas.includes(area) && Number(painted[area]?.props || 0) > 0);
  const appliedAt = Date.now();
  const syncState = {
    version: 'st-template-style-sync-once-v1-00946',
    mode: 'once',
    masterArea,
    sourceTemplateId: String(detail.sourceTemplateId || ''),
    profileId: String(detail.profileId || ''),
    collectionId: String(detail.collectionId || ''),
    areaModes: cloneJson_(detail.areaModes || {}),
    appliedAreas: [...areas],
    geometryPreserved: true,
    appliedAt
  };
  const main = commitMainTheme_(
    theme,
    'template-style-sync-once-00946',
    { version: '00946-template-style-sync-history', before, after },
    externalStateChanged,
    {
      applyMain: areas.includes('main'),
      force: true,
      preserveGeometry: true,
      transactionLabel: TEMPLATE_STYLE_SYNC_TRANSACTION_00946,
      transactionDetail: { templateStyleSync00946: cloneJson_(syncState) },
      siteMeta: { templateStyleSync00946: cloneJson_(syncState) }
    }
  );
  if (!main?.ok) {
    if (before.header) restoreHeaderFooterState_(before.header, 'commit-failed');
    if (before.footer) restoreHeaderFooterState_(before.footer, 'commit-failed');
    return templateStyleSyncFailure00946_('template-style-sync-apply-failed-00946', main?.reason || 'site-frame-commit-failed', { areas, commits });
  }
  const summary = { ok: true, mode: 'once', masterArea, areas, painted, commits, main, syncState, geometryPreserved: true };
  rememberTemplateStyleSync00946_('template-style-sync-applied-00946', summary, 'info');
  try { window.dispatchEvent(new CustomEvent('st:template-style-sync-applied-00946', { detail: cloneJson_(summary) })); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: 'template-style-sync-once-00946', areas } })); } catch (_) {}
  return summary;
}

function templateStylePlan00954_(detail = {}) {
  const raw = isObj_(detail.plan) ? detail.plan : {};
  const plan = {};
  const missing = [];
  ['header', 'main', 'footer'].forEach((area) => {
    const item = isObj_(raw[area]) ? raw[area] : null;
    if (!item || !isObj_(item.theme)) {
      missing.push(area);
      return;
    }
    plan[area] = {
      area,
      sourceArea: ['header', 'main', 'footer'].includes(String(item.sourceArea || '')) ? String(item.sourceArea) : area,
      theme: cloneJson_(item.theme),
      styleId: String(item.styleId || ''),
      styleName: String(item.styleName || item.profileId || ''),
      sourceTemplateId: String(item.sourceTemplateId || ''),
      profileId: String(item.profileId || ''),
      collectionId: String(item.collectionId || '')
    };
  });
  return { ok: missing.length === 0, missing, plan };
}

function templateStyleProfilesByArea00954_(plan) {
  return Object.fromEntries(['header', 'main', 'footer'].map((area) => {
    const item = plan[area] || {};
    return [area, {
      area,
      sourceArea: String(item.sourceArea || area),
      styleId: String(item.styleId || ''),
      styleName: String(item.styleName || item.profileId || ''),
      sourceTemplateId: String(item.sourceTemplateId || ''),
      profileId: String(item.profileId || ''),
      collectionId: String(item.collectionId || '')
    }];
  }));
}

function templateStyleReferenceFromPlan00954_(area, item, selectedAt) {
  if (!item?.styleId || !item?.profileId) return null;
  return {
    area,
    styleId: String(item.styleId || ''),
    styleName: String(item.styleName || item.styleId || ''),
    profileId: String(item.profileId || ''),
    collectionId: String(item.collectionId || ''),
    sourceArea: String(item.sourceArea || area),
    sourceTemplateId: String(item.sourceTemplateId || ''),
    selectedAt
  };
}

function templateStyleSaveState00954_(detail, normalized, masterArea, appliedAt) {
  const requestedMode = detail.syncMode === 'live-link' ? 'live-link' : 'once';
  const requestedAreaModes = Object.fromEntries(['header', 'main', 'footer'].map((area) => [
    area,
    area === masterArea ? 'own' : (detail.areaModes?.[area] === 'master' ? 'master' : 'own')
  ]));
  const linkedAreas = requestedMode === 'live-link'
    ? ['header', 'main', 'footer'].filter((area) => area !== masterArea && requestedAreaModes[area] === 'master')
    : [];
  const liveLinkEnabled = linkedAreas.length > 0;
  const syncMode = liveLinkEnabled ? 'live-link' : 'once';
  const storedAreaModes = Object.fromEntries(['header', 'main', 'footer'].map((area) => [
    area,
    liveLinkEnabled && linkedAreas.includes(area) ? 'master' : 'own'
  ]));
  const incomingSelections = isObj_(detail.selectionState?.selectedByArea)
    ? detail.selectionState.selectedByArea
    : {};
  const selectedByArea = {};
  ['header', 'main', 'footer'].forEach((area) => {
    const preserveOwnSelection = liveLinkEnabled && linkedAreas.includes(area);
    const incoming = isObj_(incomingSelections[area]) ? cloneJson_(incomingSelections[area]) : null;
    selectedByArea[area] = preserveOwnSelection
      ? incoming
      : (templateStyleReferenceFromPlan00954_(area, normalized.plan[area], appliedAt) || incoming);
  });
  return {
    syncMode,
    requestedAreaModes,
    storedAreaModes,
    selectionState: {
      version: 'st-section-style-selection-v4-00954',
      selectedByArea
    },
    liveLinkState: {
      version: 'st-template-style-live-link-v1-00954',
      mode: syncMode,
      enabled: liveLinkEnabled,
      masterArea,
      linkedAreas,
      areaModes: storedAreaModes,
      savedAt: appliedAt
    }
  };
}

export function previewTemplateStylePlan00954(detail = {}) {
  const normalized = templateStylePlan00954_(detail);
  if (!normalized.ok) {
    return templateStyleSyncFailure00946_('template-style-plan-preview-rejected-00954', 'incomplete-three-area-style-plan', {
      missing: normalized.missing
    });
  }
  if (previewSnapshot00780_) restorePreviewSnapshot_('before-template-style-plan-preview-00954');
  takePreviewSnapshot_(TEMPLATE_STYLE_SYNC_PREVIEW_OWNER_00946, ['header', 'main', 'footer']);
  previewActive00780_ = true;
  const result = {};
  ['header', 'main', 'footer'].forEach((area) => {
    result[area] = applyThemeToArea_(area, normalized.plan[area].theme, {
      preview: true,
      force: true,
      preserveGeometry: true
    });
  });
  const summary = {
    ok: true,
    mode: 'preview-plan',
    syncMode: detail.syncMode === 'live-link' ? 'live-link' : 'once',
    masterArea: String(detail.masterArea || ''),
    areas: ['header', 'main', 'footer'],
    profilesByArea: templateStyleProfilesByArea00954_(normalized.plan),
    result,
    geometryPreserved: true,
    noCommit: true,
    noStorage: true,
    noHistory: true
  };
  return rememberTemplateStyleSync00946_('template-style-plan-preview-00954', summary, 'info');
}

export function saveTemplateStylePlan00954(detail = {}) {
  const normalized = templateStylePlan00954_(detail);
  const masterArea = String(detail.masterArea || '');
  if (!normalized.ok) {
    return templateStyleSyncFailure00946_('template-style-plan-save-rejected-00954', 'incomplete-three-area-style-plan', {
      missing: normalized.missing
    });
  }
  if (!['header', 'main', 'footer'].includes(masterArea)) {
    return templateStyleSyncFailure00946_('template-style-plan-save-rejected-00954', 'invalid-master-area', { masterArea });
  }
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  if (!authority?.store || authority.store.hasActiveTransaction?.()) {
    return templateStyleSyncFailure00946_('template-style-plan-save-rejected-00954', 'site-frame-store-unavailable-or-busy', { masterArea });
  }
  if (previewSnapshot00780_) restorePreviewSnapshot_('before-template-style-plan-save-00954');

  const before = {
    header: captureHeaderFooterState_('header'),
    footer: captureHeaderFooterState_('footer')
  };
  const painted = {
    header: applyThemeToArea_('header', normalized.plan.header.theme, { force: true, preserveGeometry: true }),
    footer: applyThemeToArea_('footer', normalized.plan.footer.theme, { force: true, preserveGeometry: true })
  };
  const activeTemplates = isObj_(detail.activeTemplates) ? detail.activeTemplates : {};
  const commits = {
    header: commitHeaderFooter_('header', 'template-style-sync-save-00954', {
      templateId: activeTemplates.header?.templateId || ''
    }),
    footer: commitHeaderFooter_('footer', 'template-style-sync-save-00954', {
      templateId: activeTemplates.footer?.templateId || ''
    })
  };
  const after = {
    header: captureHeaderFooterState_('header'),
    footer: captureHeaderFooterState_('footer')
  };
  const externalStateChanged = Number(painted.header?.props || 0) > 0 || Number(painted.footer?.props || 0) > 0;
  const appliedAt = Date.now();
  const profilesByArea = templateStyleProfilesByArea00954_(normalized.plan);
  const saveState = templateStyleSaveState00954_(detail, normalized, masterArea, appliedAt);
  const selectionState = saveState.selectionState;
  const liveLinkState = saveState.liveLinkState;
  const syncState = {
    version: 'st-template-style-sync-plan-v4-00954',
    mode: saveState.syncMode,
    masterArea,
    areaModes: cloneJson_(saveState.storedAreaModes),
    requestedAreaModes: cloneJson_(saveState.requestedAreaModes),
    linkedAreas: cloneJson_(liveLinkState.linkedAreas),
    appliedAreas: ['header', 'main', 'footer'],
    profilesByArea,
    geometryPreserved: true,
    appliedAt
  };
  const main = commitMainTheme_(
    normalized.plan.main.theme,
    'template-style-sync-save-00954',
    { version: '00954-template-style-live-link-history', before, after },
    externalStateChanged,
    {
      applyMain: true,
      force: true,
      preserveGeometry: true,
      transactionLabel: TEMPLATE_STYLE_SYNC_TRANSACTION_00954,
      transactionDetail: {
        templateStyleSync00954: cloneJson_(syncState),
        sectionStyleSelections00954: cloneJson_(selectionState),
        templateStyleLiveLink00954: cloneJson_(liveLinkState)
      },
      siteMeta: {
        templateStyleSync00954: cloneJson_(syncState),
        sectionStyleSelections00954: cloneJson_(selectionState),
        templateStyleLiveLink00954: cloneJson_(liveLinkState)
      }
    }
  );
  if (!main?.ok) {
    restoreHeaderFooterState_(before.header, 'template-style-plan-save-failed-00954');
    restoreHeaderFooterState_(before.footer, 'template-style-plan-save-failed-00954');
    return templateStyleSyncFailure00946_('template-style-plan-save-failed-00954', main?.reason || 'site-frame-commit-failed', { commits });
  }
  const summary = {
    ok: true,
    mode: saveState.syncMode,
    masterArea,
    areas: ['header', 'main', 'footer'],
    painted,
    commits,
    main,
    syncState,
    selectionState,
    liveLinkState,
    geometryPreserved: true,
    oneStoreTransaction: true
  };
  rememberTemplateStyleSync00946_('template-style-plan-saved-00954', summary, 'info');
  try { window.dispatchEvent(new CustomEvent('st:template-style-sync-applied-00954', { detail: cloneJson_(summary) })); } catch (_) {}
  try { document.dispatchEvent(new CustomEvent('builder:structureChanged', { detail: { reason: 'template-style-sync-save-00954', areas: ['header', 'main', 'footer'] } })); } catch (_) {}
  return summary;
}

export function restoreOwnTemplateStyles00946() {
  if (previewOwner00946_ === TEMPLATE_STYLE_SYNC_PREVIEW_OWNER_00946) {
    cancelTemplateStyleSyncPreview00946('template-style-sync-return-own-preview-00946');
  }
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  const status = authority?.historyStatus?.();
  if (![TEMPLATE_STYLE_SYNC_TRANSACTION_00954, TEMPLATE_STYLE_SYNC_TRANSACTION_00953, 'template-style-sync-save-00951', TEMPLATE_STYLE_SYNC_TRANSACTION_00946].includes(status?.lastUndoLabel)) {
    return templateStyleSyncFailure00946_('template-style-sync-restore-own-rejected-00946', 'latest-action-is-not-template-style-sync', { historyStatus: status || null });
  }
  const result = authority.undo?.() || { ok: false, reason: 'undo-unavailable' };
  return rememberTemplateStyleSync00946_('template-style-sync-restore-own-00946', result, result?.ok === false ? 'warn' : 'info');
}

function templateStyleLiveSamples00946_() {
  const computedProperties = [
    'background-color', 'background-image', 'color', 'font-family', 'font-size',
    'font-weight', 'line-height', 'letter-spacing', 'border-top-width',
    'border-top-color', 'border-radius', 'box-shadow', 'padding', 'gap'
  ];
  const result = {};
  ['header', 'main', 'footer'].forEach((area) => {
    const roots = areaRoots_(area);
    const roles = {};
    const candidates = [];
    const seen = new Set();
    const add = (el) => {
      if (!(el instanceof HTMLElement) || seen.has(el)) return;
      seen.add(el);
      candidates.push(el);
    };
    roots.forEach((root) => {
      add(root);
      root.querySelectorAll?.('[data-st-semantic-style="00946"],.st-row,[data-hf-node-type="container"]')?.forEach?.(add);
      root.querySelectorAll?.('[data-st-semantic-role]')?.forEach?.((el) => {
        const role = String(el.dataset?.stSemanticRole || 'unassigned');
        roles[role] = Number(roles[role] || 0) + 1;
      });
    });
    result[area] = {
      roots: roots.length,
      semanticRoles: roles,
      samples: candidates.slice(0, 36).map((el) => {
        let computed = null;
        try {
          const style = window.getComputedStyle?.(el);
          computed = style ? Object.fromEntries(computedProperties.map((property) => [property, style.getPropertyValue(property)])) : null;
        } catch (_) {}
        return {
          tag: String(el.tagName || '').toLowerCase(),
          id: String(el.id || ''),
          className: String(el.className || '').slice(0, 240),
          semanticRole: String(el.dataset?.stSemanticRole || ''),
          styleSource: String(el.dataset?.stStyleSource || ''),
          text: String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
          inlineStyle: String(el.getAttribute?.('style') || '').slice(0, 1200),
          computed
        };
      })
    };
  });
  return result;
}

export function getTemplateStyleSyncDiagnostics00946() {
  const authority = window.ST_SITE_FRAME_STORE_AUTHORITY_00876;
  const store = authority?.store;
  const root = store?.maybeGet?.(store.rootId || 'sf_site_root');
  const selections = {};
  ['header', 'main', 'footer'].forEach((area) => {
    const areaNode = store?.findArea?.(area);
    selections[area] = cloneJson_(areaNode?.meta?.templateSelection00946 || null);
  });
  return {
    version: TEMPLATE_STYLE_SYNC_BUILD_00954,
    generatedAt: new Date().toISOString(),
    preview: {
      active: previewActive00780_,
      owner: previewOwner00946_,
      snapshotNodes: Array.isArray(previewSnapshot00780_) ? previewSnapshot00780_.length : 0
    },
    widget: cloneJson_(window.ST_TEMPLATE_STYLE_SYNC_WIDGET_00954?.snapshot?.() || null),
    lastOperation: cloneJson_(templateStyleSyncLast00946_),
    store: {
      available: !!store,
      nodeCount: store?.all?.()?.length || 0,
      activeTransaction: !!store?.hasActiveTransaction?.(),
      historyStatus: cloneJson_(authority?.historyStatus?.() || null),
      appliedSync: cloneJson_(root?.meta?.templateStyleSync00954 || root?.meta?.templateStyleSync00953 || root?.meta?.templateStyleSync00951 || root?.meta?.templateStyleSync00946 || null),
      selectedSectionStyles: cloneJson_(root?.meta?.sectionStyleSelections00954 || root?.meta?.sectionStyleSelections00953 || root?.meta?.sectionStyleSelections00951 || root?.meta?.sectionStyleSelections00950 || null),
      liveLink: cloneJson_(root?.meta?.templateStyleLiveLink00954 || null),
      activeTemplateSelections: selections
    },
    live: templateStyleLiveSamples00946_()
  };
}

export function initExplicitThemeApply00780() {
  if (typeof window === 'undefined') return;
  if (window.__ST_EXPLICIT_THEME_APPLY_00780__) return;
  window.__ST_EXPLICIT_THEME_APPLY_00780__ = true;
  window.__ST_EXPLICIT_THEME_APPLY_00779__ = true;
  window.__ST_EXPLICIT_THEME_APPLY_00776__ = true;
  window.ST_APPLY_EXPLICIT_THEME_00780 = applyExplicitTheme_;
  window.ST_APPLY_EXPLICIT_THEME_00779 = applyExplicitTheme_;
  // Backward-compatible diagnostic hook only; no second listener / no second engine.
  window.ST_APPLY_EXPLICIT_THEME_00776 = applyExplicitTheme_;
  const templateStyleSyncApi00954_ = Object.freeze({
    version: TEMPLATE_STYLE_SYNC_BUILD_00954,
    preview: previewTemplateStyleSync00946,
    previewPlan: previewTemplateStylePlan00954,
    cancel: cancelTemplateStyleSyncPreview00946,
    applyOnce: applyTemplateStyleSyncOnce00946,
    savePlan: saveTemplateStylePlan00954,
    restoreOwn: restoreOwnTemplateStyles00946,
    diagnostics: getTemplateStyleSyncDiagnostics00946,
    resolveStyleMap: resolveTemplateStyleMap00946
  });
  window.ST_TEMPLATE_STYLE_SYNC_00954 = templateStyleSyncApi00954_;
  window.addEventListener('st:global-style-preview-applied', (ev) => applyPreviewTheme_(ev?.detail || {}));
  window.addEventListener('st:global-style-live-applied', (ev) => applyLiveGlobalControls_(ev?.detail || {}));
  window.addEventListener('st:global-style-applied', (ev) => {
    const detail = ev?.detail || {};
    const reason = String(detail.reason || '');
    if (/preset-preview-restore/i.test(reason)) { restorePreviewSnapshot_(reason); return; }
    if (previewActive00780_) restorePreviewSnapshot_(`before-explicit-${reason || 'apply'}`);
    if (LIVE_REASON_RE_.test(reason)) { applyLiveGlobalControls_(detail); return; }
    applyExplicitTheme_(detail);
  });
  window.addEventListener('st:site-frame-history-restored', (ev) => restoreThemeHistoryAreas_(ev?.detail || {}));
  log_('explicit-theme-apply-installed-stage4-00780', { ok: true, previewHmf: true, liveControlsHmf00936: true, spacingJsonPrimary00936: true, mainJsonPrimary: true, hmfOneTransaction: true, hmfUndoRedo: true, hoverAfterClick: true, stage4ContentGdSync: true, finalControlCommit: true, noBootOverwrite: true, noRuntimeCss: true }, 'info');
}

export const initExplicitThemeApply00779 = initExplicitThemeApply00780;
export const initExplicitThemeApply00778 = initExplicitThemeApply00780;
export const initExplicitThemeApply00777 = initExplicitThemeApply00780;
export const initExplicitThemeApply00776 = initExplicitThemeApply00780;
export const initExplicitThemeApply00775 = initExplicitThemeApply00780;
export const initExplicitThemeApply00774 = initExplicitThemeApply00780;
export const initExplicitThemeApply00773 = initExplicitThemeApply00780;

try { initExplicitThemeApply00780(); } catch (_) {}
