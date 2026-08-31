// js/design/widgets/menu/header-footer-menu-widget.js
// Меню для Шапки/Футера (Header Builder / Footer Builder):
// - Вставка Big Menu / Burger Menu у вибраний КОНТЕЙНЕР.
// - Редагування списку лінків (text + href).
// - Додавання однієї іконки до пунктів (перед/після тексту).
//
// Важливо:
// - Для вставки використовуємо події, щоб не чіпати логіку інших віджетів.
// - Працює у двох режимах: st-header-builder-on / st-footer-builder-on.

import { openGalleryModal } from '../gallery-widget/gallery-widget.js';
import { galListItems, galMakeObjectUrl } from '../gallery-widget/gallery-db.js';

const SEC_ID = 'st-hf-menu-section';

const DEFAULT_ITEMS = [
  { text: 'Головна', href: '/', children: [] },
  { text: 'Про нас', href: '/about', children: [] },
  { text: 'Контакти', href: '/contacts', children: [] },
];

function safeJsonParse(raw, fallback) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function isHeaderMode() { return document.body.classList.contains('st-header-builder-on'); }
function isFooterMode() { return document.body.classList.contains('st-footer-builder-on'); }

function getModeLabel() {
  if (isHeaderMode()) return 'Шапка';
  if (isFooterMode()) return 'Футер';
  return '—';
}

function getActiveMenuBlock(getSelection) {
  const sel = typeof getSelection === 'function' ? getSelection() : null;
  const el = sel?.elements?.[0] || null;
  if (!el) return null;

  // У Header/Footer selection може бути всередині кнопки — піднімаємось до .st-block--menu
  const blk = el.closest?.('.st-block--menu') || (el.classList?.contains('st-block--menu') ? el : null);
  return blk || null;
}
function sanitizeMenuIconSvg(svg) {
  let out = String(svg || '').trim();
  if (!out) return '';
  if (!out.startsWith('<svg')) {
    const mm = out.match(/<svg[\s\S]*?<\/svg>/i);
    out = mm ? String(mm[0] || '').trim() : '';
  }
  return out;
}
function normalizeMenuItems(items, depth = 0) {
  const MAX_DEPTH = 10;
  if (!Array.isArray(items)) return [];
  if (depth >= MAX_DEPTH) {
    // якщо хтось підсунув глибше дерево — обрізаємо
    return items.map((it) => ({
      text: String(it?.text ?? ''),
      href: String(it?.href ?? ''),
      iconSvg: sanitizeMenuIconSvg(it?.iconSvg ?? ''),
      children: [],
    }));
  }
  return items
    .filter((x) => x && typeof x === 'object')
    .map((it) => ({
      text: String(it.text ?? ''),
      href: String(it.href ?? ''),
      iconSvg: sanitizeMenuIconSvg(it.iconSvg ?? ''),
      children: normalizeMenuItems(it.children || [], depth + 1),
    }));
}

function sanitizeTree(items) {
  // гарантуємо, що у кожного елемента є children
  const out = normalizeMenuItems(items, 0);
  return out.length ? out : DEFAULT_ITEMS.slice();
}

function normalizeSubmenuMode(raw) {
  return (raw === 'always' || raw === 'click' || raw === 'hidden') ? raw : 'hover';
}

function normalizeSubmenuView(raw) {
  return (raw === 'inline' || raw === 'mega') ? raw : 'dropdown';
}

function normalizeSubmenuArrow(raw) {
  return String(raw) === '0' ? '0' : '1';
}


function normalizeSubmenuAlign(raw) {
  return (raw === 'center' || raw === 'right' || raw === 'auto') ? raw : 'left';
}

function normalizeSubmenuOffsetY(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '0';
  return String(Math.max(0, Math.min(120, Math.round(num))));
}

function normalizeSubmenuMinWidth(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '220';
  return String(Math.max(120, Math.min(1200, Math.round(num))));
}

function normalizeSubmenuWidthMode(raw) {
  return (raw === 'parent' || raw === 'custom') ? raw : 'content';
}

function normalizeMegaColsMode(raw) {
  const v = String(raw || '').trim();
  if (v === 'auto' || v === 'custom') return v;
  return (/^(?:[2-9]|10)$/).test(v) ? v : 'auto';
}

const megaBgImageMemory = new WeakMap();

function rememberMegaBgImage(blockEl, raw) {
  const v = normalizeMegaBgImage(raw);
  if (!blockEl) return v;
  try {
    if (v) {
      megaBgImageMemory.set(blockEl, v);
      blockEl.__stMegaBgImage = v;
    } else {
      megaBgImageMemory.delete(blockEl);
      delete blockEl.__stMegaBgImage;
    }
  } catch (_) {}
  return v;
}

function recallMegaBgImage(blockEl, fallback = "") {
  if (!blockEl) return normalizeMegaBgImage(fallback);
  const mem = megaBgImageMemory.get(blockEl) || blockEl.__stMegaBgImage || blockEl.dataset?.menuMegaBgImage || fallback;
  return normalizeMegaBgImage(mem);
}

function normalizeMegaColsCustom(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '7';
  return String(Math.max(1, Math.min(30, Math.round(num))));
}

function normalizeMegaColGap(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '24';
  return String(Math.max(0, Math.min(120, Math.round(num))));
}

function normalizeMenuRootJustify(raw) {
  const v = String(raw || '').trim();
  return (v === 'center' || v === 'flex-end' || v === 'space-between' || v === 'space-around' || v === 'space-evenly') ? v : 'flex-start';
}

function normalizeMenuRootAlign(raw) {
  const v = String(raw || '').trim();
  return (v === 'flex-start' || v === 'flex-end' || v === 'stretch') ? v : 'center';
}

function normalizeMenuRootGap(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '14';
  return String(Math.max(0, Math.min(240, Math.round(num))));
}

function normalizeMenuRootPad(raw, fallback = '0') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(240, Math.round(Number(fallback) || 0))));
  return String(Math.max(0, Math.min(240, Math.round(num))));
}

function normalizeMegaColMinWidth(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '160';
  return String(Math.max(80, Math.min(600, Math.round(num))));
}

function normalizeMegaPosition(raw) {
  return (raw === 'center' || raw === 'right' || raw === 'auto') ? raw : 'left';
}

function normalizeMegaSideOffset(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '0';
  return String(Math.max(-500, Math.min(500, Math.round(num))));
}

function normalizeMegaBgMode(raw) {
  const v = String(raw || '').trim();
  return (v === 'image' || v === 'gradient') ? v : 'color';
}

function normalizeMegaBgColor(raw, fallback = '#020617') {
  const v = String(raw || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}

function normalizeMegaPanelColor(raw, fallback = '#020617') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaBgOpacity(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '100';
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaPanelOpacity(raw, fallback = '0') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return normalizeMegaBgOpacity(fallback);
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaPanelBlur(raw, fallback = '0') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(60, Math.round(Number(fallback) || 0))));
  return String(Math.max(0, Math.min(60, Math.round(num))));
}

function normalizeMegaPanelBlurRadius(raw, fallback = '18') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(80, Math.round(Number(fallback) || 18))));
  return String(Math.max(0, Math.min(80, Math.round(num))));
}

function normalizeMegaPanelBorderColor(raw, fallback = '#94a3b8') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaPanelBorderOpacity(raw, fallback = '22') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(100, Math.round(Number(fallback) || 22))));
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaPanelBorderWidth(raw, fallback = '1') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(20, Math.round(Number(fallback) || 1))));
  return String(Math.max(0, Math.min(20, Math.round(num))));
}

function normalizeMegaPanelBorderRadius(raw, fallback = '18') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(80, Math.round(Number(fallback) || 18))));
  return String(Math.max(0, Math.min(80, Math.round(num))));
}

function normalizeMegaPanelRadius(raw, fallback = '18') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(80, Math.round(Number(fallback) || 18))));
  return String(Math.max(0, Math.min(80, Math.round(num))));
}

function normalizeMegaRadiusCorners(raw, fallback = '1111') {
  const src = String(raw || '').trim();
  const normalized = src.replace(/[^01]/g, '');
  const base = normalized.length >= 4 ? normalized.slice(0, 4) : String(fallback || '1111').replace(/[^01]/g, '').padEnd(4, '1').slice(0, 4);
  return base.length === 4 ? base : '1111';
}

function parseMegaRadiusCorners(raw, fallback = '1111') {
  const bits = normalizeMegaRadiusCorners(raw, fallback);
  return {
    tl: bits.charAt(0) !== '0',
    tr: bits.charAt(1) !== '0',
    br: bits.charAt(2) !== '0',
    bl: bits.charAt(3) !== '0',
  };
}

function buildMegaCornerRadiusShape(radiusPx, cornersRaw, fallbackCorners = '1111') {
  const radius = Math.max(0, Math.round(Number(radiusPx) || 0));
  const corners = parseMegaRadiusCorners(cornersRaw, fallbackCorners);
  return `${corners.tl ? radius : 0}px ${corners.tr ? radius : 0}px ${corners.br ? radius : 0}px ${corners.bl ? radius : 0}px`;
}

function normalizeMegaCornerValue(raw, fallback = '0') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return Math.max(0, Math.min(80, Math.round(Number(fallback) || 0)));
  return Math.max(0, Math.min(80, Math.round(num)));
}

function serializeMegaCornerValues(values, fallback = '0,0,0,0') {
  if (!Array.isArray(values) || values.length < 4) return fallback;
  return values.slice(0, 4).map((value) => String(normalizeMegaCornerValue(value, '0'))).join(',');
}

function normalizeMegaCornerValues(raw, fallbackRadius = '18', fallbackCorners = '1111') {
  const fallbackValue = normalizeMegaCornerValue(fallbackRadius, '18');
  const fallbackState = parseMegaRadiusCorners(fallbackCorners, '1111');
  const fallbackValues = [
    fallbackState.tl ? fallbackValue : 0,
    fallbackState.tr ? fallbackValue : 0,
    fallbackState.br ? fallbackValue : 0,
    fallbackState.bl ? fallbackValue : 0,
  ];
  const src = String(raw || '').trim();
  if (!src) return serializeMegaCornerValues(fallbackValues);
  const parts = src.split(/[^0-9.-]+/).filter(Boolean).slice(0, 4);
  if (parts.length < 4) return serializeMegaCornerValues(fallbackValues);
  return serializeMegaCornerValues(parts, serializeMegaCornerValues(fallbackValues));
}

function parseMegaCornerValues(raw, fallbackRadius = '18', fallbackCorners = '1111') {
  return normalizeMegaCornerValues(raw, fallbackRadius, fallbackCorners).split(',').slice(0, 4).map((value) => normalizeMegaCornerValue(value, '0'));
}

function buildMegaCornerRadiusShapeFromValues(rawValues, fallbackRadius = '18', fallbackCorners = '1111') {
  const values = parseMegaCornerValues(rawValues, fallbackRadius, fallbackCorners);
  return `${values[0]}px ${values[1]}px ${values[2]}px ${values[3]}px`;
}

function insetMegaCornerValues(rawValues, insetPx, fallbackRadius = '18', fallbackCorners = '1111') {
  const inset = Math.max(0, Math.round(Number(insetPx) || 0));
  const values = parseMegaCornerValues(rawValues, fallbackRadius, fallbackCorners);
  return serializeMegaCornerValues(values.map((value) => Math.max(0, value - inset)));
}

function pickMegaCornerValueForSelection(rawValues, selectedCornersRaw, fallbackRadius = '18', fallbackCorners = '1111') {
  const values = parseMegaCornerValues(rawValues, fallbackRadius, fallbackCorners);
  const selected = parseMegaRadiusCorners(selectedCornersRaw, fallbackCorners);
  const picked = [];
  if (selected.tl) picked.push(values[0]);
  if (selected.tr) picked.push(values[1]);
  if (selected.br) picked.push(values[2]);
  if (selected.bl) picked.push(values[3]);
  if (!picked.length) return String(values[0] ?? normalizeMegaCornerValue(fallbackRadius, '18'));
  return String(picked[0]);
}

function applyMegaCornerValueToSelection(rawValues, selectedCornersRaw, nextValue, fallbackRadius = '18', fallbackCorners = '1111') {
  const values = parseMegaCornerValues(rawValues, fallbackRadius, fallbackCorners);
  const selected = parseMegaRadiusCorners(selectedCornersRaw, fallbackCorners);
  const safeValue = normalizeMegaCornerValue(nextValue, fallbackRadius);
  if (selected.tl) values[0] = safeValue;
  if (selected.tr) values[1] = safeValue;
  if (selected.br) values[2] = safeValue;
  if (selected.bl) values[3] = safeValue;
  return serializeMegaCornerValues(values);
}

function normalizeMegaCornerShapeForCss(shape, fallback = '18px 18px 18px 18px') {
  const v = String(shape || '').trim().replace(/\s+/g, ' ');
  return v || fallback;
}

function setMegaCornerToggleState(btn, isActive) {
  if (!(btn instanceof HTMLElement)) return;
  btn.classList.toggle('is-active', !!isActive);
  btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
}

function normalizeMegaPanelShadowColor(raw, fallback = '#000000') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaPanelShadowOpacity(raw, fallback = '42') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(100, Math.round(Number(fallback) || 42))));
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaPanelShadowAxis(raw, fallback = '0') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(-200, Math.min(200, Math.round(Number(fallback) || 0))));
  return String(Math.max(-200, Math.min(200, Math.round(num))));
}

function normalizeMegaPanelShadowBlur(raw, fallback = '48') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(300, Math.round(Number(fallback) || 48))));
  return String(Math.max(0, Math.min(300, Math.round(num))));
}

function normalizeMegaPanelShadowSpread(raw, fallback = '0') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(-100, Math.min(200, Math.round(Number(fallback) || 0))));
  return String(Math.max(-100, Math.min(200, Math.round(num))));
}

function normalizeMegaBgAngle(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '90';
  return String(Math.max(0, Math.min(360, Math.round(num))));
}

function normalizeMegaBgSizeMode(raw) {
  const v = String(raw || '').trim();
  return (v === 'contain' || v === 'auto' || v === 'custom') ? v : 'cover';
}

function normalizeMegaBgScale(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '100';
  return String(Math.max(10, Math.min(300, Math.round(num))));
}

function normalizeMegaBgRepeat(raw) {
  const v = String(raw || '').trim();
  return (v === 'repeat' || v === 'repeat-x' || v === 'repeat-y') ? v : 'no-repeat';
}

function normalizeMegaBgPosition(raw) {
  const v = String(raw || '').trim();
  const allowed = new Set([
    'center center',
    'top center',
    'bottom center',
    'center left',
    'center right',
    'top left',
    'top right',
    'bottom left',
    'bottom right',
    'custom',
  ]);
  return allowed.has(v) ? v : 'center center';
}

function normalizeMegaBgPosPercent(raw, fallback = '50') {
  const num = Number(raw);
  if (!Number.isFinite(num)) return String(Math.max(0, Math.min(100, Math.round(Number(fallback) || 50))));
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaTitleColor(raw, fallback = '#f8fafc') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaTitleSize(raw, fallback = '16') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  return String(Math.max(10, Math.min(48, Math.round(num))));
}

function normalizeMegaTitleDividerColor(raw, fallback = '#94a3b8') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaTitleDividerOpacity(raw, fallback = '16') {
  return normalizeMegaBgOpacity(raw ?? fallback);
}

function normalizeMegaTitleDividerWidth(raw, fallback = '1') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  return String(Math.max(0, Math.min(8, Math.round(num))));
}

function normalizeMegaTitleGap(raw, fallback = '12') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  return String(Math.max(0, Math.min(48, Math.round(num))));
}

function normalizeMegaLinkColor(raw, fallback = '#e2e8f0') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaLinkSize(raw, fallback = '15') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  return String(Math.max(10, Math.min(40, Math.round(num))));
}

function normalizeMegaLinkGap(raw, fallback = '8') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  // 00313: max 100px for distance between menu items.
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaLinkPadY(raw, fallback = '8') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  // 00313: max 70px for vertical padding.
  return String(Math.max(0, Math.min(70, Math.round(num))));
}

function normalizeMegaLinkPadX(raw, fallback = '10') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  // 00313: max 100px for horizontal padding.
  return String(Math.max(0, Math.min(100, Math.round(num))));
}

function normalizeMegaLinkRadius(raw, fallback = '10') {
  const num = Number(String(raw ?? '').trim());
  if (!Number.isFinite(num)) return fallback;
  return String(Math.max(0, Math.min(32, Math.round(num))));
}

function normalizeMegaLinkHoverColor(raw, fallback = '#ffffff') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaLinkHoverBgColor(raw, fallback = '#38bdf8') {
  return normalizeMegaBgColor(raw, fallback);
}

function normalizeMegaLinkHoverBgOpacity(raw, fallback = '10') {
  return normalizeMegaBgOpacity(raw ?? fallback);
}

function normalizeMegaBgImage(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (/^data:image\//i.test(v)) return v;
  return v.slice(0, 4000);
}

async function imageBlobToDataUrl(blob) {
  if (!(blob instanceof Blob)) return '';
  return await new Promise((resolve) => {
    try {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = () => resolve('');
      fr.readAsDataURL(blob);
    } catch (_) {
      resolve('');
    }
  });
}

function hexToRgbaString(hex, opacity) {
  const safeHex = normalizeMegaBgColor(hex, '#020617');
  const alpha = Math.max(0, Math.min(1, Number(opacity) / 100));
  const value = safeHex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}


function shortMegaDebugImageLabel(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (/^data:image\//i.test(v)) return '[data-image]';
  if (/^blob:/i.test(v)) return '[blob-image]';
  try {
    const clean = v.split('?')[0].split('#')[0];
    const last = clean.split('/').filter(Boolean).pop() || clean;
    return last.length > 120 ? `${last.slice(0, 117)}...` : last;
  } catch (_) {
    return v.length > 120 ? `${v.slice(0, 117)}...` : v;
  }
}

function debugMegaPanelState(blockEl, source, extra = null) {
  try {
    if (!(window && window.__ST_MEGA_DEBUG__ === true)) return;
    if (!(blockEl instanceof HTMLElement)) return;
    const megaPanels = Array.from(blockEl.querySelectorAll('.st-menu__sublist.st-menu__mega'));
    const megaEl = megaPanels[0] || null;
    const blockStyles = getComputedStyle(blockEl);
    const megaStyles = megaEl ? getComputedStyle(megaEl) : null;
    const datasetSnapshot = {
      menuSubmenuView: blockEl.dataset.menuSubmenuView,
      menuMegaBgMode: blockEl.dataset.menuMegaBgMode,
      menuMegaBgColor: blockEl.dataset.menuMegaBgColor,
      menuMegaBgImage: shortMegaDebugImageLabel(blockEl.dataset.menuMegaBgImage),
      menuMegaBgGradient1: blockEl.dataset.menuMegaBgGradient1,
      menuMegaBgGradient2: blockEl.dataset.menuMegaBgGradient2,
      menuMegaBgGradient3: blockEl.dataset.menuMegaBgGradient3,
      menuMegaBgOpacity: blockEl.dataset.menuMegaBgOpacity,
      menuMegaPanelColor: blockEl.dataset.menuMegaPanelColor,
      menuMegaPanelOpacity: blockEl.dataset.menuMegaPanelOpacity,
      menuMegaPanelSurfaceOpacity: blockEl.dataset.menuMegaPanelSurfaceOpacity,
      menuMegaPanelBlur: blockEl.dataset.menuMegaPanelBlur,
      menuMegaPanelBorderColor: blockEl.dataset.menuMegaPanelBorderColor,
      menuMegaPanelBorderOpacity: blockEl.dataset.menuMegaPanelBorderOpacity,
      menuMegaPanelBorderWidth: blockEl.dataset.menuMegaPanelBorderWidth,
      menuMegaPanelBorderRadius: blockEl.dataset.menuMegaPanelBorderRadius,
      menuMegaPanelRadius: blockEl.dataset.menuMegaPanelRadius,
    };
    const cssVars = {
      '--st-menu-mega-panel-bg': blockEl.style.getPropertyValue('--st-menu-mega-panel-bg').trim(),
      '--st-menu-mega-panel-surface-opacity': blockEl.style.getPropertyValue('--st-menu-mega-panel-surface-opacity').trim(),
      '--st-menu-mega-panel-blur': blockEl.style.getPropertyValue('--st-menu-mega-panel-blur').trim(),
      '--st-menu-mega-panel-border-color': blockEl.style.getPropertyValue('--st-menu-mega-panel-border-color').trim(),
      '--st-menu-mega-panel-border-width': blockEl.style.getPropertyValue('--st-menu-mega-panel-border-width').trim(),
      '--st-menu-mega-panel-border-radius': blockEl.style.getPropertyValue('--st-menu-mega-panel-border-radius').trim(),
      '--st-menu-mega-panel-radius': blockEl.style.getPropertyValue('--st-menu-mega-panel-radius').trim(),
      '--st-menu-mega-panel-shadow': blockEl.style.getPropertyValue('--st-menu-mega-panel-shadow').trim(),
      '--st-menu-mega-bg-layer': (() => {
        const raw = blockEl.style.getPropertyValue('--st-menu-mega-bg-layer').trim();
        return raw.length > 180 ? `${raw.slice(0, 180)}...` : raw;
      })(),
      '--st-menu-mega-bg-layer-opacity': blockEl.style.getPropertyValue('--st-menu-mega-bg-layer-opacity').trim(),
      '--st-menu-mega-bg-layer-effective-opacity': blockEl.style.getPropertyValue('--st-menu-mega-bg-layer-effective-opacity').trim(),
      '--st-menu-mega-bg-size': blockEl.style.getPropertyValue('--st-menu-mega-bg-size').trim(),
      '--st-menu-mega-bg-repeat': blockEl.style.getPropertyValue('--st-menu-mega-bg-repeat').trim(),
      '--st-menu-mega-bg-position': blockEl.style.getPropertyValue('--st-menu-mega-bg-position').trim(),
    };
    const megaComputed = megaStyles ? {
      border: megaStyles.border,
      borderColor: megaStyles.borderColor,
      borderWidth: megaStyles.borderWidth,
      borderRadius: megaStyles.borderRadius,
      background: megaStyles.background,
      boxShadow: megaStyles.boxShadow,
      backdropFilter: megaStyles.backdropFilter,
      webkitBackdropFilter: megaStyles.webkitBackdropFilter,
      overflow: megaStyles.overflow,
      position: megaStyles.position,
      zIndex: megaStyles.zIndex,
      width: megaStyles.width,
      maxWidth: megaStyles.maxWidth,
      minWidth: megaStyles.minWidth,
      display: megaStyles.display,
      visibility: megaStyles.visibility,
      opacity: megaStyles.opacity,
    } : null;
    const beforeComputed = megaEl ? getComputedStyle(megaEl, '::before') : null;
    const afterComputed = megaEl ? getComputedStyle(megaEl, '::after') : null;
    const pseudo = {
      before: beforeComputed ? {
        background: beforeComputed.background,
        borderRadius: beforeComputed.borderRadius,
        inset: beforeComputed.inset,
        opacity: beforeComputed.opacity,
        zIndex: beforeComputed.zIndex,
      } : null,
      after: afterComputed ? {
        background: afterComputed.background,
        borderRadius: afterComputed.borderRadius,
        inset: afterComputed.inset,
        opacity: afterComputed.opacity,
        zIndex: afterComputed.zIndex,
      } : null,
    };
    console.groupCollapsed(`[ST][Mega Debug] ${source}`);
    if (window.ST_MENU_DEBUG_LOGS) console.log('dataset', datasetSnapshot);
    if (window.ST_MENU_DEBUG_LOGS) console.log('cssVars', cssVars);
    if (window.ST_MENU_DEBUG_LOGS) console.log('megaPanelsCount', megaPanels.length);
    if (window.ST_MENU_DEBUG_LOGS) console.log('megaComputed', megaComputed);
    if (window.ST_MENU_DEBUG_LOGS) console.log('pseudo', pseudo);
    if (window.ST_MENU_DEBUG_LOGS && extra) console.log('extra', extra);
    if (window.ST_MENU_DEBUG_LOGS) console.log('blockEl', blockEl);
    if (window.ST_MENU_DEBUG_LOGS && megaEl) console.log('megaEl', megaEl);
    console.groupEnd();
  } catch (err) {
    console.error('[ST][Mega Debug] logger failed', err);
  }
}

function normalizeSubmenuCustomWidth(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '320';
  return String(Math.max(120, Math.min(1600, Math.round(num))));
}

function normalizeLevel3Position(raw) {
  return (raw === 'left' || raw === 'auto') ? raw : 'right';
}

function normalizeLevel3OffsetX(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '0';
  return String(Math.max(0, Math.min(240, Math.round(num))));
}

function normalizeLevel3OffsetY(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '0';
  return String(Math.max(-240, Math.min(240, Math.round(num))));
}

function normalizeLevel3MinWidth(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '220';
  return String(Math.max(120, Math.min(1200, Math.round(num))));
}

function normalizeLevel3WidthMode(raw) {
  return (raw === 'parent' || raw === 'custom') ? raw : 'content';
}

function normalizeLevel3CustomWidth(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num)) return '320';
  return String(Math.max(120, Math.min(1600, Math.round(num))));
}


function normalizeLevelDirection(raw, fallback = 'column') {
  return raw === 'row' ? 'row' : (fallback === 'row' ? 'row' : 'column');
}

function normalizeSettingsMode(raw) {
  return String(raw) === '1' ? '1' : '0';
}

// 00211 — strict numeric parsing for menu level styles.
// ВАЖЛИВО: Number('') === 0 у JavaScript. Саме це давало випадковий
// font-size 8px для меню при першому кліку/синхронізації. Порожнє
// значення має лишатися порожнім, а не перетворюватись у мінімум.
function hasMenuLevelNumberValue(raw) {
  return raw !== null && raw !== undefined && String(raw).trim() !== '';
}

function normalizeMenuLevelIntValue(raw, min, max) {
  if (!hasMenuLevelNumberValue(raw)) return '';
  const n = Number(String(raw).replace('px', '').trim());
  if (!Number.isFinite(n)) return '';
  return String(Math.max(min, Math.min(max, Math.round(n))));
}

function normalizeMenuLevelPxValue(raw, min, max) {
  const n = normalizeMenuLevelIntValue(raw, min, max);
  return n ? `${n}px` : '';
}

function isAccidentalAllLevelFs8Map(src) {
  // Міграція для локальних/шаблонних даних, які вже могли зберегтись
  // попереднім багом: всі 10 рівнів містять тільки fs:'8'. Такий набір
  // не є реальним дизайном, а результатом Number('') -> 0 -> min 8.
  if (!src || typeof src !== 'object') return false;
  let seen = 0;
  for (let i = 1; i <= 10; i += 1) {
    const row = src[String(i)];
    if (!row || typeof row !== 'object') return false;
    const keys = Object.keys(row).filter((k) => row[k] !== null && row[k] !== undefined && String(row[k]).trim() !== '');
    if (keys.length !== 1 || keys[0] !== 'fs' || String(row.fs).trim() !== '8') return false;
    seen += 1;
  }
  return seen === 10;
}


function normalizeLevelStyles(raw) {
  const parsedSrc = (raw && typeof raw === 'object')
    ? raw
    : safeJsonParse(String(raw || ''), {});
  const src = isAccidentalAllLevelFs8Map(parsedSrc) ? {} : parsedSrc;
  const out = {};
  for (let i = 1; i <= 10; i += 1) {
    const key = String(i);
    const cur = (src && typeof src === 'object' && src[key] && typeof src[key] === 'object') ? src[key] : {};
    const bg = typeof cur.bg === 'string' ? cur.bg.trim() : '';
    const color = typeof cur.color === 'string' ? cur.color.trim() : '';
    const fs = normalizeMenuLevelIntValue(cur.fs, 8, 96);
    const fwRaw = String(cur.fw || '').trim();
    const fwNum = Number(fwRaw);
    const fw = Number.isFinite(fwNum) ? String(Math.max(100, Math.min(1000, Math.round(fwNum)))) : (fwRaw ? (/bold/i.test(fwRaw) ? '700' : (/normal/i.test(fwRaw) ? '400' : fwRaw)) : '');
    const fstRaw = String(cur.fst || '').trim().toLowerCase();
    const fst = (fstRaw === 'italic' || fstRaw === 'oblique') ? 'italic' : (fstRaw === 'normal' ? 'normal' : '');
    const ts = typeof cur.ts === 'string' ? cur.ts.trim() : '';
    const sw = normalizeMenuLevelPxValue(cur.sw, 0, 12);
    const sc = typeof cur.sc === 'string' ? cur.sc.trim() : '';
    const bc = typeof cur.bc === 'string' ? cur.bc.trim() : '';
    const bsRaw = String(cur.bs || '').trim().toLowerCase();
    const bs = (bsRaw === 'dashed' || bsRaw === 'dotted' || bsRaw === 'solid') ? bsRaw : '';
    const bw = normalizeMenuLevelIntValue(cur.bw, 0, 20);
    const br = normalizeMenuLevelIntValue(cur.br, 0, 200);
    const bgo = normalizeMenuLevelIntValue(cur.bgo, 0, 100);
    const bco = normalizeMenuLevelIntValue(cur.bco, 0, 100);
    const shColor = typeof cur.shColor === 'string' ? cur.shColor.trim() : '';
    const sho = normalizeMenuLevelIntValue(cur.sho, 0, 100);
    const shtRaw = String(cur.sht || '').trim().toLowerCase();
    const sht = (shtRaw === 'inset') ? 'inset' : ((shtRaw === 'outer') ? 'outer' : '');
    const shX = normalizeMenuLevelIntValue(cur.shX, -200, 200);
    const shY = normalizeMenuLevelIntValue(cur.shY, -200, 200);
    const shBlur = normalizeMenuLevelIntValue(cur.shBlur, 0, 300);
    const shSpread = normalizeMenuLevelIntValue(cur.shSpread, -100, 200);
    out[key] = { bg, color, fs, fw, fst, ts, sw, sc, bc, bs, bw, br, bgo, bco, shColor, sho, sht, shX, shY, shBlur, shSpread };
  }
  return out;
}

function serializeLevelStyles(levelStyles) {
  const out = {};
  const src = levelStyles && typeof levelStyles === 'object' ? levelStyles : {};
  for (let i = 1; i <= 10; i += 1) {
    const key = String(i);
    const cur = (src[key] && typeof src[key] === 'object') ? src[key] : {};
    const row = {};
    if (typeof cur.bg === 'string' && cur.bg.trim()) row.bg = cur.bg.trim();
    if (typeof cur.color === 'string' && cur.color.trim()) row.color = cur.color.trim();
    const fs = normalizeMenuLevelIntValue(cur.fs, 8, 96);
    if (fs) row.fs = fs;
    const fwRaw = String(cur.fw || '').trim();
    const fwNum = Number(fwRaw);
    if (Number.isFinite(fwNum)) row.fw = String(Math.max(100, Math.min(1000, Math.round(fwNum))));
    else if (fwRaw) row.fw = /bold/i.test(fwRaw) ? '700' : (/normal/i.test(fwRaw) ? '400' : fwRaw);
    const fstRaw = String(cur.fst || '').trim().toLowerCase();
    if (fstRaw === 'italic' || fstRaw === 'oblique') row.fst = 'italic';
    else if (fstRaw === 'normal') row.fst = 'normal';
    if (typeof cur.ts === 'string' && cur.ts.trim()) row.ts = cur.ts.trim();
    const sw = normalizeMenuLevelPxValue(cur.sw, 0, 12);
    if (sw) row.sw = sw;
    if (typeof cur.sc === 'string' && cur.sc.trim()) row.sc = cur.sc.trim();
    if (typeof cur.bc === 'string' && cur.bc.trim()) row.bc = cur.bc.trim();
    if (typeof cur.bs === 'string' && cur.bs.trim()) row.bs = cur.bs.trim();
    const bw = normalizeMenuLevelIntValue(cur.bw, 0, 20);
    if (bw) row.bw = bw;
    const br = normalizeMenuLevelIntValue(cur.br, 0, 200);
    if (br) row.br = br;
    const bgo = normalizeMenuLevelIntValue(cur.bgo, 0, 100);
    if (bgo) row.bgo = bgo;
    const bco = normalizeMenuLevelIntValue(cur.bco, 0, 100);
    if (bco) row.bco = bco;
    if (typeof cur.shColor === 'string' && cur.shColor.trim()) row.shColor = cur.shColor.trim();
    const sho = normalizeMenuLevelIntValue(cur.sho, 0, 100);
    if (sho) row.sho = sho;
    if (typeof cur.sht === 'string' && cur.sht.trim()) row.sht = cur.sht.trim();
    const shX = normalizeMenuLevelIntValue(cur.shX, -200, 200);
    if (shX) row.shX = shX;
    const shY = normalizeMenuLevelIntValue(cur.shY, -200, 200);
    if (shY) row.shY = shY;
    const shBlur = normalizeMenuLevelIntValue(cur.shBlur, 0, 300);
    if (shBlur) row.shBlur = shBlur;
    const shSpread = normalizeMenuLevelIntValue(cur.shSpread, -100, 200);
    if (shSpread) row.shSpread = shSpread;
    if (Object.keys(row).length) out[key] = row;
  }
  return JSON.stringify(out);
}

function getLevelStyle(levelStyles, level) {
  const key = String(Math.max(1, Math.min(10, Number(level) || 1)));
  const src = levelStyles && typeof levelStyles === 'object' ? levelStyles : {};
  const cur = (src[key] && typeof src[key] === 'object') ? src[key] : {};
  const bsRaw = String(cur.bs || '').trim().toLowerCase();
  return {
    bg: typeof cur.bg === 'string' ? cur.bg.trim() : '',
    color: typeof cur.color === 'string' ? cur.color.trim() : '',
    fs: normalizeMenuLevelIntValue(cur.fs, 8, 96),
    fw: (() => { const raw = String(cur.fw || '').trim(); const n = Number(raw); if (Number.isFinite(n)) return String(Math.max(100, Math.min(1000, Math.round(n)))); return raw ? (/bold/i.test(raw) ? '700' : (/normal/i.test(raw) ? '400' : raw)) : ''; })(),
    fst: (() => { const raw = String(cur.fst || '').trim().toLowerCase(); return (raw === 'italic' || raw === 'oblique') ? 'italic' : (raw === 'normal' ? 'normal' : ''); })(),
    ts: typeof cur.ts === 'string' ? cur.ts.trim() : '',
    sw: normalizeMenuLevelPxValue(cur.sw, 0, 12),
    sc: typeof cur.sc === 'string' ? cur.sc.trim() : '',
    bc: typeof cur.bc === 'string' ? cur.bc.trim() : '',
    bs: (bsRaw === 'dashed' || bsRaw === 'dotted' || bsRaw === 'solid') ? bsRaw : '',
    bw: normalizeMenuLevelIntValue(cur.bw, 0, 20),
    br: normalizeMenuLevelIntValue(cur.br, 0, 200),
    bgo: normalizeMenuLevelIntValue(cur.bgo, 0, 100),
    bco: normalizeMenuLevelIntValue(cur.bco, 0, 100),
    shColor: typeof cur.shColor === 'string' ? cur.shColor.trim() : '',
    sho: normalizeMenuLevelIntValue(cur.sho, 0, 100),
    sht: ((String(cur.sht || '').trim().toLowerCase() === 'inset') ? 'inset' : ((String(cur.sht || '').trim().toLowerCase() === 'outer') ? 'outer' : '')),
    shX: normalizeMenuLevelIntValue(cur.shX, -200, 200),
    shY: normalizeMenuLevelIntValue(cur.shY, -200, 200),
    shBlur: normalizeMenuLevelIntValue(cur.shBlur, 0, 300),
    shSpread: normalizeMenuLevelIntValue(cur.shSpread, -100, 200),
  };
}

function normalizeMegaDividerMode(value, fallback = 'joined') {
  const raw = String(value || '').trim().toLowerCase();
  return (raw === 'separate' || raw === 'joined' || raw === 'split-separate') ? raw : fallback;
}

function normalizeLevelDisplayMode(value, fallback = 'all') {
  const raw = String(value || '').trim().toLowerCase();
  return raw === 'content' ? 'content' : fallback;
}

function normalizeLevelContentLayoutStyles(raw) {
  const src = (raw && typeof raw === 'object') ? raw : safeJsonParse(String(raw || ''), {});
  const out = {};
  for (let i = 1; i <= 10; i += 1) {
    const key = String(i);
    const cur = (src && typeof src === 'object' && src[key] && typeof src[key] === 'object') ? src[key] : {};
    const gapNum = Number(cur.gap);
    const gap = Number.isFinite(gapNum) ? String(Math.max(0, Math.min(100, Math.round(gapNum)))) : '';
    const pyNum = Number(cur.py);
    const py = Number.isFinite(pyNum) ? String(Math.max(0, Math.min(70, Math.round(pyNum)))) : '';
    const pxNum = Number(cur.px);
    const px = Number.isFinite(pxNum) ? String(Math.max(0, Math.min(100, Math.round(pxNum)))) : '';
    const justifyRaw = String(cur.justify || '').trim();
    const justify = justifyRaw ? normalizeMenuRootJustify(justifyRaw) : '';
    const alignRaw = String(cur.align || '').trim();
    const align = alignRaw ? normalizeMenuRootAlign(alignRaw) : '';
    const divRadiusNum = Number(cur.divRadius);
    const divRadius = Number.isFinite(divRadiusNum) ? String(Math.max(0, Math.min(40, Math.round(divRadiusNum)))) : '';
    const divColor = typeof cur.divColor === 'string' ? cur.divColor.trim() : '';
    const divOpacityNum = Number(cur.divOpacity);
    const divOpacity = Number.isFinite(divOpacityNum) ? String(Math.max(0, Math.min(100, Math.round(divOpacityNum)))) : '';
    const divWidthNum = Number(cur.divWidth);
    const divWidth = Number.isFinite(divWidthNum) ? String(Math.max(0, Math.min(12, Math.round(divWidthNum)))) : '';
    const divMode = normalizeMegaDividerMode(cur.divMode, 'joined');
    const showMode = normalizeLevelDisplayMode(cur.showMode, 'all');
    const titleGapNum = Number(cur.titleGap);
    const titleGap = Number.isFinite(titleGapNum) ? String(Math.max(0, Math.min(64, Math.round(titleGapNum)))) : '';
    out[key] = { gap, py, px, justify, align, divColor, divOpacity, divWidth, divRadius, divMode, showMode, titleGap };
  }
  return out;
}

function serializeLevelContentLayoutStyles(levelContentLayoutStyles) {
  const out = {};
  const src = levelContentLayoutStyles && typeof levelContentLayoutStyles === 'object' ? levelContentLayoutStyles : {};
  for (let i = 1; i <= 10; i += 1) {
    const key = String(i);
    const cur = (src[key] && typeof src[key] === 'object') ? src[key] : {};
    const row = {};
    const gapNum = Number(cur.gap);
    if (Number.isFinite(gapNum)) row.gap = String(Math.max(0, Math.min(100, Math.round(gapNum))));
    const pyNum = Number(cur.py);
    if (Number.isFinite(pyNum)) row.py = String(Math.max(0, Math.min(70, Math.round(pyNum))));
    const pxNum = Number(cur.px);
    if (Number.isFinite(pxNum)) row.px = String(Math.max(0, Math.min(100, Math.round(pxNum))));
    if (typeof cur.justify === 'string' && cur.justify.trim()) row.justify = normalizeMenuRootJustify(cur.justify);
    if (typeof cur.align === 'string' && cur.align.trim()) row.align = normalizeMenuRootAlign(cur.align);
    if (typeof cur.divColor === 'string' && cur.divColor.trim()) row.divColor = cur.divColor.trim();
    const divOpacityNum = Number(cur.divOpacity);
    if (Number.isFinite(divOpacityNum)) row.divOpacity = String(Math.max(0, Math.min(100, Math.round(divOpacityNum))));
    const divWidthNum = Number(cur.divWidth);
    if (Number.isFinite(divWidthNum)) row.divWidth = String(Math.max(0, Math.min(12, Math.round(divWidthNum))));
    const divRadiusNum = Number(cur.divRadius);
    if (Number.isFinite(divRadiusNum)) row.divRadius = String(Math.max(0, Math.min(40, Math.round(divRadiusNum))));
    const divMode = normalizeMegaDividerMode(cur.divMode, 'joined');
    if (divMode !== 'joined') row.divMode = divMode;
    const showMode = normalizeLevelDisplayMode(cur.showMode, 'all');
    if (showMode !== 'all') row.showMode = showMode;
    const titleGapNum = Number(cur.titleGap);
    if (Number.isFinite(titleGapNum)) row.titleGap = String(Math.max(0, Math.min(64, Math.round(titleGapNum))));
    if (Object.keys(row).length) out[key] = row;
  }
  return JSON.stringify(out);
}



// 00215 — first-click safety for menu templates.
// Старі шаблони шапок мали частину дизайну меню тільки в inline-style/CSS-vars
// самого DOM: --st-menu-link-fs, --st-menu-gap, inline padding у .st-menu__link.
// Після першого кліку віджет меню перемальовував пункти і брав дефолти з dataset,
// тому кнопки меню ставали дрібними/стиснутими. Перед нормалізацією переносимо
// фактичний DOM-дизайн у канонічні мапи Рівня 1, але тільки якщо там ще немає
// явних значень.
function readPxNumber_(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  const n = Number(raw.replace('px', '').trim());
  if (!Number.isFinite(n)) return '';
  return String(Math.max(0, Math.round(n)));
}

function readMenuCssVarPx_(el, name) {
  if (!(el instanceof HTMLElement)) return '';
  const inline = readPxNumber_(el.style?.getPropertyValue?.(name));
  if (inline) return inline;
  try {
    const computed = getComputedStyle(el).getPropertyValue(name);
    return readPxNumber_(computed);
  } catch (_) {
    return '';
  }
}

function readMenuLevel1DomSeed_(blockEl) {
  const empty = { gap: '', px: '', py: '', justify: '', align: '', fs: '', fw: '', minh: '', bg: '', bc: '', bw: '', br: '' };
  if (!(blockEl instanceof HTMLElement)) return empty;
  const list = blockEl.querySelector(':scope .st-menu--big > .st-menu__list')
    || blockEl.querySelector(':scope .st-menu--burger > .st-menu__panel > .st-menu__list')
    || blockEl.querySelector(':scope .st-menu > .st-menu__list')
    || blockEl.querySelector(':scope .st-menu__list[data-menu-list-depth="1"]')
    || blockEl.querySelector(':scope .st-menu__list');
  const link = list?.querySelector?.(':scope > .st-menu__item[data-menu-depth="1"] > .st-menu__link')
    || blockEl.querySelector(':scope .st-menu__item[data-menu-depth="1"] > .st-menu__link')
    || blockEl.querySelector(':scope .st-menu__link[data-st-menu-item="1"]')
    || blockEl.querySelector(':scope .st-menu__link');

  let listCs = null;
  let linkCs = null;
  try { if (list instanceof HTMLElement) listCs = getComputedStyle(list); } catch (_) {}
  try { if (link instanceof HTMLElement) linkCs = getComputedStyle(link); } catch (_) {}

  const gap = readPxNumber_(list?.style?.gap)
    || readPxNumber_(list?.style?.columnGap)
    || readPxNumber_(listCs?.columnGap)
    || readPxNumber_(listCs?.gap)
    || readMenuCssVarPx_(blockEl, '--st-menu-gap')
    || readMenuCssVarPx_(blockEl, '--st-menu-root-gap');

  const px = readPxNumber_(link?.style?.paddingLeft)
    || readPxNumber_(linkCs?.paddingLeft)
    || readMenuCssVarPx_(blockEl, '--st-menu-pad-x');
  const py = readPxNumber_(link?.style?.paddingTop)
    || readPxNumber_(linkCs?.paddingTop)
    || readMenuCssVarPx_(blockEl, '--st-menu-pad-y');

  const fsVar = readMenuCssVarPx_(blockEl, '--st-menu-link-fs');
  const fsComputed = readPxNumber_(link?.style?.fontSize) || readPxNumber_(linkCs?.fontSize);
  const fs = fsVar || (fsComputed && Number(fsComputed) >= 10 ? fsComputed : '');

  // 00216 — preserve template pill design before any menu re-render.
  // Header templates often keep visual details on the existing DOM/link styles
  // rather than in menuLevelStyles[1]. If the editor re-renders before these
  // are captured, menu pills visually shrink or lose spacing on the first click.
  const fwRaw = String(link?.style?.fontWeight || linkCs?.fontWeight || '').trim();
  const fwNum = Number(fwRaw);
  const fw = Number.isFinite(fwNum)
    ? String(Math.max(100, Math.min(1000, Math.round(fwNum))))
    : (/bold/i.test(fwRaw) ? '700' : (/normal/i.test(fwRaw) ? '400' : ''));
  const minh = readPxNumber_(link?.style?.minHeight) || readPxNumber_(linkCs?.minHeight);
  const bg = String(link?.style?.background || link?.style?.backgroundColor || linkCs?.backgroundColor || '').trim();
  const bc = String(link?.style?.borderColor || linkCs?.borderTopColor || linkCs?.borderColor || '').trim();
  const bw = readPxNumber_(link?.style?.borderTopWidth) || readPxNumber_(linkCs?.borderTopWidth);
  const br = readPxNumber_(link?.style?.borderTopLeftRadius) || readPxNumber_(linkCs?.borderTopLeftRadius);

  const justifyRaw = String(list?.style?.justifyContent || listCs?.justifyContent || '').trim();
  const alignRaw = String(list?.style?.alignItems || listCs?.alignItems || '').trim();

  return {
    gap: gap ? String(Math.max(0, Math.min(100, Math.round(Number(gap))))) : '',
    px: px ? String(Math.max(0, Math.min(100, Math.round(Number(px))))) : '',
    py: py ? String(Math.max(0, Math.min(70, Math.round(Number(py))))) : '',
    fs: fs ? String(Math.max(8, Math.min(96, Math.round(Number(fs))))) : '',
    fw,
    minh: minh ? String(Math.max(0, Math.min(160, Math.round(Number(minh))))) : '',
    bg: bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' ? bg : '',
    bc: bc && bc !== 'rgba(0, 0, 0, 0)' && bc !== 'transparent' ? bc : '',
    bw: bw ? String(Math.max(0, Math.min(20, Math.round(Number(bw))))) : '',
    br: br ? String(Math.max(0, Math.min(200, Math.round(Number(br))))) : '',
    justify: justifyRaw ? normalizeMenuRootJustify(justifyRaw) : '',
    align: alignRaw ? normalizeMenuRootAlign(alignRaw) : '',
  };
}

function seedMenuLevel1MapsFromExistingDom_(blockEl, levelStyles, levelContentLayoutStyles) {
  const styles = normalizeLevelStyles(levelStyles);
  const layout = normalizeLevelContentLayoutStyles(levelContentLayoutStyles);
  if (!(blockEl instanceof HTMLElement)) return { levelStyles: styles, levelContentLayoutStyles: layout };

  const seed = readMenuLevel1DomSeed_(blockEl);
  const l1Style = (styles['1'] && typeof styles['1'] === 'object') ? { ...styles['1'] } : {};
  const l1Layout = (layout['1'] && typeof layout['1'] === 'object') ? { ...layout['1'] } : {};

  // Тільки якщо Рівень 1 ще не має явного значення. Так не перетираємо ручні налаштування.
  if (!String(l1Style.fs || '').trim() && seed.fs) l1Style.fs = seed.fs;
  if (!String(l1Style.fw || '').trim() && seed.fw) l1Style.fw = seed.fw;
  if (!String(l1Style.bg || '').trim() && seed.bg) l1Style.bg = seed.bg;
  if (!String(l1Style.bc || '').trim() && seed.bc) l1Style.bc = seed.bc;
  if (!String(l1Style.bw || '').trim() && seed.bw) l1Style.bw = seed.bw;
  if (!String(l1Style.br || '').trim() && seed.br) l1Style.br = seed.br;
  if (seed.minh && !String(blockEl.style.getPropertyValue('--st-menu-link-minh') || '').trim()) {
    setBlockStyleProp00438_(blockEl, '--st-menu-link-minh', `${seed.minh}px`);
  }
  if (!String(l1Layout.gap || '').trim() && seed.gap) l1Layout.gap = seed.gap;
  if (!String(l1Layout.px || '').trim() && seed.px) l1Layout.px = seed.px;
  if (!String(l1Layout.py || '').trim() && seed.py) l1Layout.py = seed.py;
  if (!String(l1Layout.justify || '').trim() && seed.justify) l1Layout.justify = seed.justify;
  if (!String(l1Layout.align || '').trim() && seed.align) l1Layout.align = seed.align;

  styles['1'] = l1Style;
  layout['1'] = l1Layout;
  return { levelStyles: styles, levelContentLayoutStyles: layout };
}

function getLevelContentLayoutStyle(levelContentLayoutStyles, level) {
  const key = String(Math.max(1, Math.min(10, Number(level) || 1)));
  const src = levelContentLayoutStyles && typeof levelContentLayoutStyles === 'object' ? levelContentLayoutStyles : {};
  const cur = (src[key] && typeof src[key] === 'object') ? src[key] : {};
  return {
    gap: (Number.isFinite(Number(cur.gap)) ? String(Math.max(0, Math.min(100, Math.round(Number(cur.gap))))) : ''),
    py: (Number.isFinite(Number(cur.py)) ? String(Math.max(0, Math.min(70, Math.round(Number(cur.py))))) : ''),
    px: (Number.isFinite(Number(cur.px)) ? String(Math.max(0, Math.min(100, Math.round(Number(cur.px))))) : ''),
    justify: (typeof cur.justify === 'string' && cur.justify.trim() ? normalizeMenuRootJustify(cur.justify) : ''),
    align: (typeof cur.align === 'string' && cur.align.trim() ? normalizeMenuRootAlign(cur.align) : ''),
    divColor: typeof cur.divColor === 'string' ? cur.divColor.trim() : '',
    divOpacity: (Number.isFinite(Number(cur.divOpacity)) ? String(Math.max(0, Math.min(100, Math.round(Number(cur.divOpacity))))) : ''),
    divWidth: (Number.isFinite(Number(cur.divWidth)) ? String(Math.max(0, Math.min(12, Math.round(Number(cur.divWidth))))) : ''),
    divRadius: (Number.isFinite(Number(cur.divRadius)) ? String(Math.max(0, Math.min(40, Math.round(Number(cur.divRadius))))) : ''),
    divMode: normalizeMegaDividerMode(cur.divMode, 'joined'),
    showMode: normalizeLevelDisplayMode(cur.showMode, 'all'),
    titleGap: (Number.isFinite(Number(cur.titleGap)) ? String(Math.max(0, Math.min(64, Math.round(Number(cur.titleGap))))) : ''),
  };
}


function normalizeLevelArrowStyles(raw) {
  const src = (raw && typeof raw === 'object') ? raw : safeJsonParse(String(raw || ''), {});
  const out = {};
  for (let i = 1; i <= 10; i += 1) {
    const key = String(i);
    const cur = (src && typeof src === 'object' && src[key] && typeof src[key] === 'object') ? src[key] : {};
    const color = typeof cur.color === 'string' ? cur.color.trim() : '';
    const sizeNum = Number(cur.size);
    const size = Number.isFinite(sizeNum) ? String(Math.max(8, Math.min(64, Math.round(sizeNum)))) : '';
    const strokeNum = Number(cur.stroke);
    const stroke = Number.isFinite(strokeNum) ? String(Math.max(0.5, Math.min(12, Math.round(strokeNum * 10) / 10))) : '';
    const gapNum = Number(cur.gap);
    const gap = Number.isFinite(gapNum) ? String(Math.max(-20, Math.min(80, Math.round(gapNum)))) : '';
    const rotNum = Number(cur.rot);
    const rot = Number.isFinite(rotNum) ? String(Math.max(-360, Math.min(360, Math.round(rotNum)))) : '';
    out[key] = { color, size, stroke, gap, rot };
  }
  return out;
}

function serializeLevelArrowStyles(levelStyles) {
  const out = {};
  const src = levelStyles && typeof levelStyles === 'object' ? levelStyles : {};
  for (let i = 1; i <= 10; i += 1) {
    const key = String(i);
    const cur = (src[key] && typeof src[key] === 'object') ? src[key] : {};
    const row = {};
    if (typeof cur.color === 'string' && cur.color.trim()) row.color = cur.color.trim();
    const sizeNum = Number(cur.size);
    if (Number.isFinite(sizeNum)) row.size = String(Math.max(8, Math.min(64, Math.round(sizeNum))));
    const strokeNum = Number(cur.stroke);
    if (Number.isFinite(strokeNum)) row.stroke = String(Math.max(0.5, Math.min(12, Math.round(strokeNum * 10) / 10)));
    const gapNum = Number(cur.gap);
    if (Number.isFinite(gapNum)) row.gap = String(Math.max(-20, Math.min(80, Math.round(gapNum))));
    const rotNum = Number(cur.rot);
    if (Number.isFinite(rotNum)) row.rot = String(Math.max(-360, Math.min(360, Math.round(rotNum))));
    if (Object.keys(row).length) out[key] = row;
  }
  return JSON.stringify(out);
}

function getLevelArrowStyle(levelStyles, level) {
  const key = String(Math.max(1, Math.min(10, Number(level) || 1)));
  const src = levelStyles && typeof levelStyles === 'object' ? levelStyles : {};
  const cur = (src[key] && typeof src[key] === 'object') ? src[key] : {};
  return {
    color: typeof cur.color === 'string' ? cur.color.trim() : '',
    size: (Number.isFinite(Number(cur.size)) ? String(Math.max(8, Math.min(64, Math.round(Number(cur.size))))) : ''),
    stroke: (Number.isFinite(Number(cur.stroke)) ? String(Math.max(0.5, Math.min(12, Math.round(Number(cur.stroke) * 10) / 10))) : ''),
    gap: (Number.isFinite(Number(cur.gap)) ? String(Math.max(-20, Math.min(80, Math.round(Number(cur.gap))))) : ''),
    rot: (Number.isFinite(Number(cur.rot)) ? String(Math.max(-360, Math.min(360, Math.round(Number(cur.rot))))) : ''),
  };
}

function migrateLegacyMegaContentToLevelMaps(data) {
  if (!data || typeof data !== 'object') return data;
  const levelStyles = normalizeLevelStyles(data.levelStyles);
  const levelHoverStyles = normalizeLevelStyles(data.levelHoverStyles);
  const levelOpenStyles = normalizeLevelStyles(data.levelOpenStyles);
  const levelCurrentStyles = normalizeLevelStyles(data.levelCurrentStyles);
  const levelContentLayoutStyles = normalizeLevelContentLayoutStyles(data.levelContentLayoutStyles);

  const mergeMissing = (target, patch) => {
    const out = { ...(target && typeof target === 'object' ? target : {}) };
    Object.entries(patch || {}).forEach(([key, value]) => {
      if (value === '' || value == null) return;
      if (!out[key]) out[key] = value;
    });
    return out;
  };

  levelStyles['2'] = mergeMissing(getLevelStyle(levelStyles, 2), {
    color: normalizeMegaTitleColor(data.menuMegaTitleColor, '#f8fafc'),
    fs: normalizeMegaTitleSize(data.menuMegaTitleSize, '16'),
  });
  levelStyles['3'] = mergeMissing(getLevelStyle(levelStyles, 3), {
    color: normalizeMegaLinkColor(data.menuMegaLinkColor, '#e2e8f0'),
    fs: normalizeMegaLinkSize(data.menuMegaLinkSize, '15'),
    br: normalizeMegaLinkRadius(data.menuMegaLinkRadius, '10'),
  });

  const hoverPatch = {
    color: normalizeMegaLinkHoverColor(data.menuMegaLinkHoverColor, '#ffffff'),
    bg: normalizeMegaLinkHoverBgColor(data.menuMegaLinkHoverBgColor, '#38bdf8'),
    bgo: normalizeMegaLinkHoverBgOpacity(data.menuMegaLinkHoverBgOpacity, '10'),
  };
  levelHoverStyles['3'] = mergeMissing(getLevelStyle(levelHoverStyles, 3), hoverPatch);
  levelOpenStyles['3'] = mergeMissing(getLevelStyle(levelOpenStyles, 3), hoverPatch);
  levelCurrentStyles['3'] = mergeMissing(getLevelStyle(levelCurrentStyles, 3), hoverPatch);

  levelContentLayoutStyles['2'] = mergeMissing(getLevelContentLayoutStyle(levelContentLayoutStyles, 2), {
    divColor: normalizeMegaTitleDividerColor(data.menuMegaTitleDividerColor, '#94a3b8'),
    divOpacity: normalizeMegaTitleDividerOpacity(data.menuMegaTitleDividerOpacity, '16'),
    divWidth: normalizeMegaTitleDividerWidth(data.menuMegaTitleDividerWidth, '1'),
    divMode: 'joined',
    titleGap: normalizeMegaTitleGap(data.menuMegaTitleGap, '12'),
  });
  levelContentLayoutStyles['3'] = mergeMissing(getLevelContentLayoutStyle(levelContentLayoutStyles, 3), {
    gap: normalizeMegaLinkGap(data.menuMegaLinkGap, '8'),
    py: normalizeMegaLinkPadY(data.menuMegaLinkPadY, '8'),
    px: normalizeMegaLinkPadX(data.menuMegaLinkPadX, '10'),
  });

  data.levelStyles = levelStyles;
  data.levelHoverStyles = levelHoverStyles;
  data.levelOpenStyles = levelOpenStyles;
  data.levelCurrentStyles = levelCurrentStyles;
  data.levelContentLayoutStyles = levelContentLayoutStyles;
  return data;
}

function ensureMenuData(blockEl) {
  if (!blockEl) return migrateLegacyMegaContentToLevelMaps({
    items: DEFAULT_ITEMS.slice(),
    iconSvg: '',
    iconPos: 'before',
    submenuMode: 'hover',
    submenuView: 'dropdown',
    submenuArrow: '1',
    submenuAlign: 'left',
    submenuOffsetY: '0',
    submenuMinWidth: '220',
    submenuWidthMode: 'content',
    submenuCustomWidth: '320',
    menuRootJustify: 'flex-start',
    menuRootAlign: 'center',
    menuRootGap: '14',
    menuRootPadX: '0',
    menuRootPadY: '0',
    menuMegaPosition: 'left',
    menuMegaOffsetLeft: '0',
    menuMegaOffsetRight: '0',
    menuMegaBgMode: 'color',
    menuMegaBgColor: '#020617',
    menuMegaBgImage: '',
    menuMegaBgGradient1: '#020617',
    menuMegaBgGradient2: '#0f172a',
    menuMegaBgGradient3: '#1e293b',
    menuMegaBgOpacity: '100',
    menuMegaPanelColor: '#020617',
    menuMegaPanelOpacity: '0',
    menuMegaPanelSurfaceOpacity: '100',
    menuMegaPanelBlur: '0',
    menuMegaPanelBlurRadius: '18',
    menuMegaPanelBorderColor: '#94a3b8',
    menuMegaPanelBorderOpacity: '22',
    menuMegaPanelBorderWidth: '1',
    menuMegaPanelBorderRadius: '18',
    menuMegaPanelRadius: '18',
    menuMegaRadiusCorners: '1111',
    menuMegaPanelBlurCornerValues: '18,18,18,18',
    menuMegaPanelBorderCornerValues: '18,18,18,18',
    menuMegaPanelCornerValues: '18,18,18,18',
    menuMegaPanelShadowColor: '#000000',
    menuMegaPanelShadowOpacity: '42',
    menuMegaPanelShadowX: '0',
    menuMegaPanelShadowY: '22',
    menuMegaPanelShadowBlur: '48',
    menuMegaPanelShadowSpread: '0',
    menuMegaBgAngle: '90',
    menuMegaBgSize: 'cover',
    menuMegaBgScale: '100',
    menuMegaBgRepeat: 'no-repeat',
    menuMegaBgPosition: 'center center',
    menuMegaBgPosX: '50',
    menuMegaBgPosY: '50',
    menuMegaTitleColor: '#f8fafc',
    menuMegaTitleSize: '16',
    menuMegaTitleDividerColor: '#94a3b8',
    menuMegaTitleDividerOpacity: '16',
    menuMegaTitleDividerWidth: '1',
    menuMegaTitleGap: '12',
    menuMegaLinkColor: '#e2e8f0',
    menuMegaLinkSize: '15',
    menuMegaLinkGap: '8',
    menuMegaLinkPadY: '8',
    menuMegaLinkPadX: '10',
    menuMegaLinkRadius: '10',
    menuMegaLinkHoverColor: '#ffffff',
    menuMegaLinkHoverBgColor: '#38bdf8',
    menuMegaLinkHoverBgOpacity: '10',
    menuLevel1Direction: 'row',
    menuLevel2Direction: 'column',
    menuLevel3Direction: 'column',
    level3Position: 'right',
    level3OffsetX: '0',
    level3OffsetY: '0',
    level3MinWidth: '220',
    level3WidthMode: 'content',
    level3CustomWidth: '320',
    menuSettingsMode: '0',
    levelStyles: normalizeLevelStyles(''),
    levelHoverStyles: normalizeLevelStyles(''),
    levelOpenStyles: normalizeLevelStyles(''),
    levelCurrentStyles: normalizeLevelStyles(''),
    levelContainerStyles: normalizeLevelStyles(''),
    levelContainerHoverStyles: normalizeLevelStyles(''),
    levelContainerOpenStyles: normalizeLevelStyles(''),
    levelContainerCurrentStyles: normalizeLevelStyles(''),
    levelContentLayoutStyles: normalizeLevelContentLayoutStyles(''),
    levelArrowStyles: normalizeLevelArrowStyles(''),
    levelArrowHoverStyles: normalizeLevelArrowStyles(''),
    levelArrowOpenStyles: normalizeLevelArrowStyles(''),
  });
  const items = safeJsonParse(blockEl.dataset.menuItems || '', null);
  const normItems = sanitizeTree(items);
  const iconSvg = sanitizeMenuIconSvg(blockEl.dataset.menuIconSvg || '');
  const iconPos = (blockEl.dataset.menuIconPos === 'after') ? 'after' : 'before';
  const submenuMode = normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
  const submenuView = normalizeSubmenuView(blockEl.dataset.menuSubmenuView);
  const submenuArrow = normalizeSubmenuArrow(blockEl.dataset.menuSubmenuArrow);
  const submenuAlign = normalizeSubmenuAlign(blockEl.dataset.menuSubmenuAlign);
  const submenuOffsetY = normalizeSubmenuOffsetY(blockEl.dataset.menuSubmenuOffsetY);
  const submenuMinWidth = normalizeSubmenuMinWidth(blockEl.dataset.menuSubmenuMinWidth);
  const submenuWidthMode = normalizeSubmenuWidthMode(blockEl.dataset.menuSubmenuWidthMode);
  const submenuCustomWidth = normalizeSubmenuCustomWidth(blockEl.dataset.menuSubmenuCustomWidth);
  let menuRootJustify = normalizeMenuRootJustify(blockEl.dataset.menuRootJustify);
  let menuRootAlign = normalizeMenuRootAlign(blockEl.dataset.menuRootAlign);
  let menuRootGap = normalizeMenuRootGap(blockEl.dataset.menuRootGap);
  const menuRootPadX = normalizeMenuRootPad(blockEl.dataset.menuRootPadX, '0');
  const menuRootPadY = normalizeMenuRootPad(blockEl.dataset.menuRootPadY, '0');
  const menuMegaCols = normalizeMegaColsMode(blockEl.dataset.menuMegaCols);
  const menuMegaColsCustom = normalizeMegaColsCustom(blockEl.dataset.menuMegaColsCustom);
  const menuMegaGap = normalizeMegaColGap(blockEl.dataset.menuMegaGap);
  const menuMegaColMinWidth = normalizeMegaColMinWidth(blockEl.dataset.menuMegaColMinWidth);
  const menuMegaPosition = normalizeMegaPosition(blockEl.dataset.menuMegaPosition);
  const menuMegaOffsetLeft = normalizeMegaSideOffset(blockEl.dataset.menuMegaOffsetLeft);
  const menuMegaOffsetRight = normalizeMegaSideOffset(blockEl.dataset.menuMegaOffsetRight);
  const menuMegaBgMode = normalizeMegaBgMode(blockEl.dataset.menuMegaBgMode);
  const menuMegaBgColor = normalizeMegaBgColor(blockEl.dataset.menuMegaBgColor, '#020617');
  const menuMegaBgImage = recallMegaBgImage(blockEl, blockEl.dataset.menuMegaBgImage);
  const menuMegaBgGradient1 = normalizeMegaBgColor(blockEl.dataset.menuMegaBgGradient1, '#020617');
  const menuMegaBgGradient2 = normalizeMegaBgColor(blockEl.dataset.menuMegaBgGradient2, '#0f172a');
  const menuMegaBgGradient3 = normalizeMegaBgColor(blockEl.dataset.menuMegaBgGradient3, '#1e293b');
  const menuMegaBgOpacity = normalizeMegaBgOpacity(blockEl.dataset.menuMegaBgOpacity);
  const menuMegaPanelColor = normalizeMegaPanelColor(blockEl.dataset.menuMegaPanelColor, '#020617');
  const menuMegaPanelOpacity = normalizeMegaPanelOpacity(
    blockEl.dataset.menuMegaPanelOpacity,
    (menuMegaBgMode === 'image' || menuMegaBgMode === 'gradient') ? '82' : '0'
  );
  const menuMegaPanelSurfaceOpacity = normalizeMegaPanelOpacity(blockEl.dataset.menuMegaPanelSurfaceOpacity, '100');
  const menuMegaPanelBlur = normalizeMegaPanelBlur(blockEl.dataset.menuMegaPanelBlur, '0');
  const menuMegaPanelBlurRadius = normalizeMegaPanelBlurRadius(blockEl.dataset.menuMegaPanelBlurRadius, blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18');
  const menuMegaPanelBorderColor = normalizeMegaPanelBorderColor(blockEl.dataset.menuMegaPanelBorderColor, '#94a3b8');
  const menuMegaPanelBorderOpacity = normalizeMegaPanelBorderOpacity(blockEl.dataset.menuMegaPanelBorderOpacity, '22');
  const menuMegaPanelBorderWidth = normalizeMegaPanelBorderWidth(blockEl.dataset.menuMegaPanelBorderWidth, '1');
  const menuMegaPanelBorderRadius = normalizeMegaPanelBorderRadius(blockEl.dataset.menuMegaPanelBorderRadius, blockEl.dataset.menuMegaPanelRadius || '18');
  const menuMegaPanelRadius = normalizeMegaPanelRadius(blockEl.dataset.menuMegaPanelRadius, '18');
  const menuMegaRadiusCorners = normalizeMegaRadiusCorners(blockEl.dataset.menuMegaRadiusCorners, '1111');
  const menuMegaPanelBlurCornerValues = normalizeMegaCornerValues(blockEl.dataset.menuMegaPanelBlurCornerValues, blockEl.dataset.menuMegaPanelBlurRadius || blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18', menuMegaRadiusCorners);
  const menuMegaPanelBorderCornerValues = normalizeMegaCornerValues(blockEl.dataset.menuMegaPanelBorderCornerValues, blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18', menuMegaRadiusCorners);
  const menuMegaPanelCornerValues = normalizeMegaCornerValues(blockEl.dataset.menuMegaPanelCornerValues, blockEl.dataset.menuMegaPanelRadius || '18', menuMegaRadiusCorners);
  const menuMegaPanelShadowColor = normalizeMegaPanelShadowColor(blockEl.dataset.menuMegaPanelShadowColor, '#000000');
  const menuMegaPanelShadowOpacity = normalizeMegaPanelShadowOpacity(blockEl.dataset.menuMegaPanelShadowOpacity, '42');
  const menuMegaPanelShadowX = normalizeMegaPanelShadowAxis(blockEl.dataset.menuMegaPanelShadowX, '0');
  const menuMegaPanelShadowY = normalizeMegaPanelShadowAxis(blockEl.dataset.menuMegaPanelShadowY, '22');
  const menuMegaPanelShadowBlur = normalizeMegaPanelShadowBlur(blockEl.dataset.menuMegaPanelShadowBlur, '48');
  const menuMegaPanelShadowSpread = normalizeMegaPanelShadowSpread(blockEl.dataset.menuMegaPanelShadowSpread, '0');
  const menuMegaBgAngle = normalizeMegaBgAngle(blockEl.dataset.menuMegaBgAngle);
  const menuMegaBgSize = normalizeMegaBgSizeMode(blockEl.dataset.menuMegaBgSize);
  const menuMegaBgScale = normalizeMegaBgScale(blockEl.dataset.menuMegaBgScale);
  const menuMegaBgRepeat = normalizeMegaBgRepeat(blockEl.dataset.menuMegaBgRepeat);
  const menuMegaBgPosition = normalizeMegaBgPosition(blockEl.dataset.menuMegaBgPosition);
  const menuMegaBgPosX = normalizeMegaBgPosPercent(blockEl.dataset.menuMegaBgPosX, '50');
  const menuMegaBgPosY = normalizeMegaBgPosPercent(blockEl.dataset.menuMegaBgPosY, '50');
  const menuMegaTitleColor = normalizeMegaTitleColor(blockEl.dataset.menuMegaTitleColor, '#f8fafc');
  const menuMegaTitleSize = normalizeMegaTitleSize(blockEl.dataset.menuMegaTitleSize, '16');
  const menuMegaTitleDividerColor = normalizeMegaTitleDividerColor(blockEl.dataset.menuMegaTitleDividerColor, '#94a3b8');
  const menuMegaTitleDividerOpacity = normalizeMegaTitleDividerOpacity(blockEl.dataset.menuMegaTitleDividerOpacity, '16');
  const menuMegaTitleDividerWidth = normalizeMegaTitleDividerWidth(blockEl.dataset.menuMegaTitleDividerWidth, '1');
  const menuMegaTitleGap = normalizeMegaTitleGap(blockEl.dataset.menuMegaTitleGap, '12');
  const menuMegaLinkColor = normalizeMegaLinkColor(blockEl.dataset.menuMegaLinkColor, '#e2e8f0');
  const menuMegaLinkSize = normalizeMegaLinkSize(blockEl.dataset.menuMegaLinkSize, '15');
  const menuMegaLinkGap = normalizeMegaLinkGap(blockEl.dataset.menuMegaLinkGap, '8');
  const menuMegaLinkPadY = normalizeMegaLinkPadY(blockEl.dataset.menuMegaLinkPadY, '8');
  const menuMegaLinkPadX = normalizeMegaLinkPadX(blockEl.dataset.menuMegaLinkPadX, '10');
  const menuMegaLinkRadius = normalizeMegaLinkRadius(blockEl.dataset.menuMegaLinkRadius, '10');
  const menuMegaLinkHoverColor = normalizeMegaLinkHoverColor(blockEl.dataset.menuMegaLinkHoverColor, '#ffffff');
  const menuMegaLinkHoverBgColor = normalizeMegaLinkHoverBgColor(blockEl.dataset.menuMegaLinkHoverBgColor, '#38bdf8');
  const menuMegaLinkHoverBgOpacity = normalizeMegaLinkHoverBgOpacity(blockEl.dataset.menuMegaLinkHoverBgOpacity, '10');
  const menuLevel1Direction = normalizeLevelDirection(blockEl.dataset.menuLevel1Direction, 'row');
  const menuLevel2Direction = normalizeLevelDirection(blockEl.dataset.menuLevel2Direction, 'column');
  const menuLevel3Direction = normalizeLevelDirection(blockEl.dataset.menuLevel3Direction, 'column');
  const level3Position = normalizeLevel3Position(blockEl.dataset.menuLevel3Position);
  const level3OffsetX = normalizeLevel3OffsetX(blockEl.dataset.menuLevel3OffsetX);
  const level3OffsetY = normalizeLevel3OffsetY(blockEl.dataset.menuLevel3OffsetY);
  const level3MinWidth = normalizeLevel3MinWidth(blockEl.dataset.menuLevel3MinWidth);
  const level3WidthMode = normalizeLevel3WidthMode(blockEl.dataset.menuLevel3WidthMode);
  const level3CustomWidth = normalizeLevel3CustomWidth(blockEl.dataset.menuLevel3CustomWidth);
  let levelStyles = normalizeLevelStyles(blockEl.dataset.menuLevelStyles);
  const levelHoverStyles = normalizeLevelStyles(blockEl.dataset.menuLevelHoverStyles);
  const levelOpenStyles = normalizeLevelStyles(blockEl.dataset.menuLevelOpenStyles);
  const levelCurrentStyles = normalizeLevelStyles(blockEl.dataset.menuLevelCurrentStyles);
  const levelContainerStyles = normalizeLevelStyles(blockEl.dataset.menuLevelContainerStyles);
  const levelContainerHoverStyles = normalizeLevelStyles(blockEl.dataset.menuLevelContainerHoverStyles);
  const levelContainerOpenStyles = normalizeLevelStyles(blockEl.dataset.menuLevelContainerOpenStyles);
  const levelContainerCurrentStyles = normalizeLevelStyles(blockEl.dataset.menuLevelContainerCurrentStyles);
  let levelContentLayoutStyles = normalizeLevelContentLayoutStyles(blockEl.dataset.menuLevelContentLayoutStyles);
  ({ levelStyles, levelContentLayoutStyles } = seedMenuLevel1MapsFromExistingDom_(blockEl, levelStyles, levelContentLayoutStyles));
  const level1SeedLayout = getLevelContentLayoutStyle(levelContentLayoutStyles, 1);
  if (level1SeedLayout.justify) menuRootJustify = normalizeMenuRootJustify(level1SeedLayout.justify);
  if (level1SeedLayout.align) menuRootAlign = normalizeMenuRootAlign(level1SeedLayout.align);
  if (level1SeedLayout.gap) menuRootGap = normalizeMenuRootGap(level1SeedLayout.gap);
  const levelArrowStyles = normalizeLevelArrowStyles(blockEl.dataset.menuLevelArrowStyles);
  const levelArrowHoverStyles = normalizeLevelArrowStyles(blockEl.dataset.menuLevelArrowHoverStyles);
  const levelArrowOpenStyles = normalizeLevelArrowStyles(blockEl.dataset.menuLevelArrowOpenStyles);
  return migrateLegacyMegaContentToLevelMaps({ items: normItems, iconSvg, iconPos, submenuMode, submenuView, submenuArrow, submenuAlign, submenuOffsetY, submenuMinWidth, submenuWidthMode, submenuCustomWidth, menuRootJustify, menuRootAlign, menuRootGap, menuRootPadX, menuRootPadY, menuMegaCols, menuMegaColsCustom, menuMegaGap, menuMegaColMinWidth, menuMegaPosition, menuMegaOffsetLeft, menuMegaOffsetRight, menuMegaBgMode, menuMegaBgColor, menuMegaBgImage, menuMegaBgGradient1, menuMegaBgGradient2, menuMegaBgGradient3, menuMegaBgOpacity, menuMegaPanelColor, menuMegaPanelOpacity, menuMegaPanelSurfaceOpacity, menuMegaPanelBlur, menuMegaPanelBlurRadius, menuMegaPanelBlurCornerValues, menuMegaPanelBorderColor, menuMegaPanelBorderOpacity, menuMegaPanelBorderWidth, menuMegaPanelBorderRadius, menuMegaPanelBorderCornerValues, menuMegaPanelRadius, menuMegaPanelCornerValues, menuMegaRadiusCorners, menuMegaPanelShadowColor, menuMegaPanelShadowOpacity, menuMegaPanelShadowX, menuMegaPanelShadowY, menuMegaPanelShadowBlur, menuMegaPanelShadowSpread, menuMegaBgAngle, menuMegaBgSize, menuMegaBgScale, menuMegaBgRepeat, menuMegaBgPosition, menuMegaBgPosX, menuMegaBgPosY, menuMegaTitleColor, menuMegaTitleSize, menuMegaTitleDividerColor, menuMegaTitleDividerOpacity, menuMegaTitleDividerWidth, menuMegaTitleGap, menuMegaLinkColor, menuMegaLinkSize, menuMegaLinkGap, menuMegaLinkPadY, menuMegaLinkPadX, menuMegaLinkRadius, menuMegaLinkHoverColor, menuMegaLinkHoverBgColor, menuMegaLinkHoverBgOpacity, menuLevel1Direction, menuLevel2Direction, menuLevel3Direction, level3Position, level3OffsetX, level3OffsetY, level3MinWidth, level3WidthMode, level3CustomWidth, menuSettingsMode: normalizeSettingsMode(blockEl.dataset.menuSettingsMode), levelStyles, levelHoverStyles, levelOpenStyles, levelCurrentStyles, levelContainerStyles, levelContainerHoverStyles, levelContainerOpenStyles, levelContainerCurrentStyles, levelContentLayoutStyles, levelArrowStyles, levelArrowHoverStyles, levelArrowOpenStyles });
}

function writeMenuData(blockEl, data) {
  if (!blockEl) return;
  blockEl.dataset.menuItems = JSON.stringify(data.items || []);
  blockEl.dataset.menuIconSvg = sanitizeMenuIconSvg(data.iconSvg || '');
  blockEl.dataset.menuIconPos = (data.iconPos === 'after') ? 'after' : 'before';
  blockEl.dataset.menuSubmenuMode = normalizeSubmenuMode(data.submenuMode);
  blockEl.dataset.menuSubmenuView = normalizeSubmenuView(data.submenuView);
  blockEl.dataset.menuSubmenuArrow = normalizeSubmenuArrow(data.submenuArrow);
  blockEl.dataset.menuSubmenuAlign = normalizeSubmenuAlign(data.submenuAlign);
  blockEl.dataset.menuSubmenuOffsetY = normalizeSubmenuOffsetY(data.submenuOffsetY);
  blockEl.dataset.menuSubmenuMinWidth = normalizeSubmenuMinWidth(data.submenuMinWidth);
  blockEl.dataset.menuSubmenuWidthMode = normalizeSubmenuWidthMode(data.submenuWidthMode);
  blockEl.dataset.menuSubmenuCustomWidth = normalizeSubmenuCustomWidth(data.submenuCustomWidth);
  blockEl.dataset.menuRootJustify = normalizeMenuRootJustify(data.menuRootJustify);
  blockEl.dataset.menuRootAlign = normalizeMenuRootAlign(data.menuRootAlign);
  blockEl.dataset.menuRootGap = normalizeMenuRootGap(data.menuRootGap);
  blockEl.dataset.menuRootPadX = normalizeMenuRootPad(data.menuRootPadX, '0');
  blockEl.dataset.menuRootPadY = normalizeMenuRootPad(data.menuRootPadY, '0');
  blockEl.dataset.menuMegaCols = normalizeMegaColsMode(data.menuMegaCols);
  blockEl.dataset.menuMegaColsCustom = normalizeMegaColsCustom(data.menuMegaColsCustom);
  blockEl.dataset.menuMegaGap = normalizeMegaColGap(data.menuMegaGap);
  blockEl.dataset.menuMegaColMinWidth = normalizeMegaColMinWidth(data.menuMegaColMinWidth);
  blockEl.dataset.menuMegaPosition = normalizeMegaPosition(data.menuMegaPosition);
  blockEl.dataset.menuMegaOffsetLeft = normalizeMegaSideOffset(data.menuMegaOffsetLeft);
  blockEl.dataset.menuMegaOffsetRight = normalizeMegaSideOffset(data.menuMegaOffsetRight);
  blockEl.dataset.menuMegaBgMode = normalizeMegaBgMode(data.menuMegaBgMode);
  blockEl.dataset.menuMegaBgColor = normalizeMegaBgColor(data.menuMegaBgColor, '#020617');
  blockEl.dataset.menuMegaBgImage = normalizeMegaBgImage(data.menuMegaBgImage);
  rememberMegaBgImage(blockEl, blockEl.dataset.menuMegaBgImage);
  rememberMegaBgImage(blockEl, blockEl.dataset.menuMegaBgImage);
  blockEl.dataset.menuMegaBgGradient1 = normalizeMegaBgColor(data.menuMegaBgGradient1, '#020617');
  blockEl.dataset.menuMegaBgGradient2 = normalizeMegaBgColor(data.menuMegaBgGradient2, '#0f172a');
  blockEl.dataset.menuMegaBgGradient3 = normalizeMegaBgColor(data.menuMegaBgGradient3, '#1e293b');
  blockEl.dataset.menuMegaBgOpacity = normalizeMegaBgOpacity(data.menuMegaBgOpacity);
  blockEl.dataset.menuMegaPanelColor = normalizeMegaPanelColor(data.menuMegaPanelColor, '#020617');
  blockEl.dataset.menuMegaPanelOpacity = normalizeMegaPanelOpacity(
    data.menuMegaPanelOpacity,
    (blockEl.dataset.menuMegaBgMode === 'image' || blockEl.dataset.menuMegaBgMode === 'gradient') ? '82' : '0'
  );
  blockEl.dataset.menuMegaPanelSurfaceOpacity = normalizeMegaPanelOpacity(data.menuMegaPanelSurfaceOpacity, '100');
  blockEl.dataset.menuMegaPanelBlur = normalizeMegaPanelBlur(data.menuMegaPanelBlur, '0');
  blockEl.dataset.menuMegaPanelBlurRadius = normalizeMegaPanelBlurRadius(data.menuMegaPanelBlurRadius, data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18');
  blockEl.dataset.menuMegaPanelBorderColor = normalizeMegaPanelBorderColor(data.menuMegaPanelBorderColor, '#94a3b8');
  blockEl.dataset.menuMegaPanelBorderOpacity = normalizeMegaPanelBorderOpacity(data.menuMegaPanelBorderOpacity, '22');
  blockEl.dataset.menuMegaPanelBorderWidth = normalizeMegaPanelBorderWidth(data.menuMegaPanelBorderWidth, '1');
  blockEl.dataset.menuMegaPanelBorderRadius = normalizeMegaPanelBorderRadius(data.menuMegaPanelBorderRadius, data.menuMegaPanelRadius || '18');
  blockEl.dataset.menuMegaPanelRadius = normalizeMegaPanelRadius(data.menuMegaPanelRadius, '18');
  blockEl.dataset.menuMegaRadiusCorners = normalizeMegaRadiusCorners(data.menuMegaRadiusCorners, '1111');
  blockEl.dataset.menuMegaPanelBlurCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBlurCornerValues, blockEl.dataset.menuMegaPanelBlurRadius || blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18', blockEl.dataset.menuMegaRadiusCorners);
  blockEl.dataset.menuMegaPanelBorderCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBorderCornerValues, blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18', blockEl.dataset.menuMegaRadiusCorners);
  blockEl.dataset.menuMegaPanelCornerValues = normalizeMegaCornerValues(data.menuMegaPanelCornerValues, blockEl.dataset.menuMegaPanelRadius || '18', blockEl.dataset.menuMegaRadiusCorners);
  blockEl.dataset.menuMegaPanelShadowColor = normalizeMegaPanelShadowColor(data.menuMegaPanelShadowColor, '#000000');
  blockEl.dataset.menuMegaPanelShadowOpacity = normalizeMegaPanelShadowOpacity(data.menuMegaPanelShadowOpacity, '42');
  blockEl.dataset.menuMegaPanelShadowX = normalizeMegaPanelShadowAxis(data.menuMegaPanelShadowX, '0');
  blockEl.dataset.menuMegaPanelShadowY = normalizeMegaPanelShadowAxis(data.menuMegaPanelShadowY, '22');
  blockEl.dataset.menuMegaPanelShadowBlur = normalizeMegaPanelShadowBlur(data.menuMegaPanelShadowBlur, '48');
  blockEl.dataset.menuMegaPanelShadowSpread = normalizeMegaPanelShadowSpread(data.menuMegaPanelShadowSpread, '0');
  blockEl.dataset.menuMegaBgAngle = normalizeMegaBgAngle(data.menuMegaBgAngle);
  blockEl.dataset.menuMegaBgSize = normalizeMegaBgSizeMode(data.menuMegaBgSize);
  blockEl.dataset.menuMegaBgScale = normalizeMegaBgScale(data.menuMegaBgScale);
  blockEl.dataset.menuMegaBgRepeat = normalizeMegaBgRepeat(data.menuMegaBgRepeat);
  blockEl.dataset.menuMegaBgPosition = normalizeMegaBgPosition(data.menuMegaBgPosition);
  blockEl.dataset.menuMegaBgPosX = normalizeMegaBgPosPercent(data.menuMegaBgPosX, '50');
  blockEl.dataset.menuMegaBgPosY = normalizeMegaBgPosPercent(data.menuMegaBgPosY, '50');
  blockEl.dataset.menuMegaTitleColor = normalizeMegaTitleColor(data.menuMegaTitleColor, '#f8fafc');
  blockEl.dataset.menuMegaTitleSize = normalizeMegaTitleSize(data.menuMegaTitleSize, '16');
  blockEl.dataset.menuMegaTitleDividerColor = normalizeMegaTitleDividerColor(data.menuMegaTitleDividerColor, '#94a3b8');
  blockEl.dataset.menuMegaTitleDividerOpacity = normalizeMegaTitleDividerOpacity(data.menuMegaTitleDividerOpacity, '16');
  blockEl.dataset.menuMegaTitleDividerWidth = normalizeMegaTitleDividerWidth(data.menuMegaTitleDividerWidth, '1');
  blockEl.dataset.menuMegaTitleGap = normalizeMegaTitleGap(data.menuMegaTitleGap, '12');
  blockEl.dataset.menuMegaLinkColor = normalizeMegaLinkColor(data.menuMegaLinkColor, '#e2e8f0');
  blockEl.dataset.menuMegaLinkSize = normalizeMegaLinkSize(data.menuMegaLinkSize, '15');
  blockEl.dataset.menuMegaLinkGap = normalizeMegaLinkGap(data.menuMegaLinkGap, '8');
  blockEl.dataset.menuMegaLinkPadY = normalizeMegaLinkPadY(data.menuMegaLinkPadY, '8');
  blockEl.dataset.menuMegaLinkPadX = normalizeMegaLinkPadX(data.menuMegaLinkPadX, '10');
  blockEl.dataset.menuMegaLinkRadius = normalizeMegaLinkRadius(data.menuMegaLinkRadius, '10');
  blockEl.dataset.menuMegaLinkHoverColor = normalizeMegaLinkHoverColor(data.menuMegaLinkHoverColor, '#ffffff');
  blockEl.dataset.menuMegaLinkHoverBgColor = normalizeMegaLinkHoverBgColor(data.menuMegaLinkHoverBgColor, '#38bdf8');
  blockEl.dataset.menuMegaLinkHoverBgOpacity = normalizeMegaLinkHoverBgOpacity(data.menuMegaLinkHoverBgOpacity, '10');
  blockEl.dataset.menuLevel1Direction = normalizeLevelDirection(data.menuLevel1Direction, 'row');
  blockEl.dataset.menuLevel2Direction = normalizeLevelDirection(data.menuLevel2Direction, 'column');
  blockEl.dataset.menuLevel3Direction = normalizeLevelDirection(data.menuLevel3Direction, 'column');
  blockEl.dataset.menuLevel3Position = normalizeLevel3Position(data.level3Position);
  blockEl.dataset.menuLevel3OffsetX = normalizeLevel3OffsetX(data.level3OffsetX);
  blockEl.dataset.menuLevel3OffsetY = normalizeLevel3OffsetY(data.level3OffsetY);
  blockEl.dataset.menuLevel3MinWidth = normalizeLevel3MinWidth(data.level3MinWidth);
  blockEl.dataset.menuLevel3WidthMode = normalizeLevel3WidthMode(data.level3WidthMode);
  blockEl.dataset.menuLevel3CustomWidth = normalizeLevel3CustomWidth(data.level3CustomWidth);
  blockEl.dataset.menuSettingsMode = normalizeSettingsMode(data.menuSettingsMode);
  blockEl.dataset.menuLevelStyles = serializeLevelStyles(normalizeLevelStyles(data.levelStyles));
  blockEl.dataset.menuLevelHoverStyles = serializeLevelStyles(normalizeLevelStyles(data.levelHoverStyles));
  blockEl.dataset.menuLevelOpenStyles = serializeLevelStyles(normalizeLevelStyles(data.levelOpenStyles));
  blockEl.dataset.menuLevelCurrentStyles = serializeLevelStyles(normalizeLevelStyles(data.levelCurrentStyles));
  blockEl.dataset.menuLevelContainerStyles = serializeLevelStyles(normalizeLevelStyles(data.levelContainerStyles));
  blockEl.dataset.menuLevelContainerHoverStyles = serializeLevelStyles(normalizeLevelStyles(data.levelContainerHoverStyles));
  blockEl.dataset.menuLevelContainerOpenStyles = serializeLevelStyles(normalizeLevelStyles(data.levelContainerOpenStyles));
  blockEl.dataset.menuLevelContainerCurrentStyles = serializeLevelStyles(normalizeLevelStyles(data.levelContainerCurrentStyles));
  blockEl.dataset.menuLevelContentLayoutStyles = serializeLevelContentLayoutStyles(normalizeLevelContentLayoutStyles(data.levelContentLayoutStyles));
  blockEl.dataset.menuLevelArrowStyles = serializeLevelArrowStyles(normalizeLevelArrowStyles(data.levelArrowStyles));
  blockEl.dataset.menuLevelArrowHoverStyles = serializeLevelArrowStyles(normalizeLevelArrowStyles(data.levelArrowHoverStyles));
  blockEl.dataset.menuLevelArrowOpenStyles = serializeLevelArrowStyles(normalizeLevelArrowStyles(data.levelArrowOpenStyles));
}


function getPersistedOpenMenuPaths(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return [];
  try {
    const raw = String(blockEl.dataset.menuOpenPaths || '').trim();
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((v) => String(v || '')).filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function persistOpenMenuPaths(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return;
  try {
    const paths = captureOpenMenuPaths(blockEl);
    if (paths.length) blockEl.dataset.menuOpenPaths = JSON.stringify(paths);
    else delete blockEl.dataset.menuOpenPaths;
  } catch (_) {}
}

function closeMenuBranch(li, opts = null) {
  if (!(li instanceof HTMLElement)) return;
  const silent = !!(opts && opts.silent);
  if (li.closest?.('.st-menu__mega')) megaShowModeDebug('closeMenuBranch', { path: li.dataset?.menuPath || '', depth: li.dataset?.menuDepth || '', mode: li.dataset?.menuDisplayMode || '', classes: li.className || '' });
  li.querySelectorAll('.st-menu__item--has-children.is-open').forEach((node) => node.classList.remove('is-open'));
  li.classList.remove('is-open');
  li.querySelectorAll('.st-menu__item--has-children > .st-menu__link[aria-expanded]').forEach((link) => link.setAttribute('aria-expanded', 'false'));
  const ownLink = li.querySelector?.(':scope > .st-menu__link[aria-expanded]');
  if (ownLink instanceof HTMLElement) ownLink.setAttribute('aria-expanded', 'false');
  const blockEl = li.closest?.('.st-block--menu');
  if (!silent && blockEl instanceof HTMLElement) {
    persistOpenMenuPaths(blockEl);
    enforceMegaDisplayModes(blockEl);
  }
}

function closeSiblingMenuBranches(li, opts = null) {
  if (!(li instanceof HTMLElement)) return;
  const siblings = Array.from(li.parentElement?.children || []).filter((node) => node !== li && node instanceof HTMLElement);
  siblings.forEach((node) => closeMenuBranch(node, opts));
}

function rememberMegaLastWinner(li) {
  if (!(li instanceof HTMLElement)) return;
  const parent = li.parentElement;
  if (!(parent instanceof HTMLElement)) return;
  const path = String(li.dataset?.menuPath || '').trim();
  if (!path) return;
  parent.dataset.menuLastWinnerPath = path;
  Array.from(parent.children || []).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    if (node === li) node.dataset.menuLastInteracted = '1';
    else delete node.dataset.menuLastInteracted;
  });
  megaShowModeDebug('rememberMegaLastWinner', {
    parentClass: parent.className || '',
    path,
    depth: li.dataset?.menuDepth || ''
  });
}

function openMenuBranch(li) {
  if (!(li instanceof HTMLElement)) return;
  const isMega = !!li.closest?.('.st-menu__mega');
  const isMegaContent = isMega && String(li.dataset?.menuDisplayMode || '') === 'content';
  if (isMega) megaShowModeDebug('openMenuBranch', { path: li.dataset?.menuPath || '', depth: li.dataset?.menuDepth || '', mode: li.dataset?.menuDisplayMode || '', classes: li.className || '' });
  if (isMega) rememberMegaLastWinner(li);
  closeSiblingMenuBranches(li, isMegaContent ? { silent: true } : null);
  li.classList.add('is-open');
  if (isMega) rememberMegaLastWinner(li);
  const ownLink = li.querySelector?.(':scope > .st-menu__link[aria-expanded]');
  if (ownLink instanceof HTMLElement) ownLink.setAttribute('aria-expanded', 'true');
  const blockEl = li.closest?.('.st-block--menu');
  if (blockEl instanceof HTMLElement) {
    persistOpenMenuPaths(blockEl);
    enforceMegaDisplayModes(blockEl);
    try {
      requestAnimationFrame(() => applyMenuLevel3Position(li, blockEl));
    } catch (_) {
      applyMenuLevel3Position(li, blockEl);
    }
  }
}

function applyMenuLevel3Position(li, blockEl) {
  if (!(li instanceof HTMLElement) || !(blockEl instanceof HTMLElement)) return;
  li.classList.remove('st-menu__item--flyout-left', 'st-menu__item--flyout-right');

  const sub = li.querySelector?.(':scope > .st-menu__sublist');
  if (!(sub instanceof HTMLElement)) return;

  const depth = Number(li.dataset.menuDepth || '1');
  if (!Number.isFinite(depth) || depth < 2) return;

  const position = normalizeLevel3Position(blockEl.dataset.menuLevel3Position);
  if (position === 'left') {
    li.classList.add('st-menu__item--flyout-left');
    return;
  }
  if (position === 'right') {
    li.classList.add('st-menu__item--flyout-right');
    return;
  }

  li.classList.add('st-menu__item--flyout-right');
  const prevVisibility = sub.style.visibility;
  const prevDisplay = sub.style.display;
  const prevLeft = sub.style.left;
  const prevRight = sub.style.right;
  try {
    sub.style.visibility = 'hidden';
    sub.style.display = 'flex';
    sub.style.left = '';
    sub.style.right = '';
    const subRect = sub.getBoundingClientRect();
    const liRect = li.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const fitsRight = liRect.right + subRect.width <= vw - 8;
    if (!fitsRight) {
      li.classList.remove('st-menu__item--flyout-right');
      li.classList.add('st-menu__item--flyout-left');
    }
  } catch (_) {
    li.classList.add('st-menu__item--flyout-right');
  } finally {
    sub.style.visibility = prevVisibility;
    sub.style.display = prevDisplay;
    sub.style.left = prevLeft;
    sub.style.right = prevRight;
  }
}

function refreshMenuLevel3Positions(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return;
  blockEl.querySelectorAll('.st-menu--big .st-menu__item--has-children').forEach((li) => {
    if (li instanceof HTMLElement) applyMenuLevel3Position(li, blockEl);
  });
}


function isMenuSettingsModeOn(blockEl) {
  return (blockEl instanceof HTMLElement) && normalizeSettingsMode(blockEl.dataset.menuSettingsMode) === '1';
}

function captureOpenMenuPaths(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return [];
  return Array.from(blockEl.querySelectorAll('.st-menu__item--has-children.is-open[data-menu-path]'))
    .map((el) => String(el.dataset.menuPath || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.split('.').length - b.split('.').length);
}

function restoreOpenMenuPaths(blockEl, paths) {
  if (!(blockEl instanceof HTMLElement) || !Array.isArray(paths) || !paths.length) return;
  paths
    .map((path) => String(path || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.split('.').length - b.split('.').length)
    .forEach((path) => {
      const li = blockEl.querySelector(`.st-menu__item--has-children[data-menu-path="${path}"]`);
      if (!(li instanceof HTMLElement)) return;
      li.classList.add('is-open');
      const ownLink = li.querySelector?.(':scope > .st-menu__link[aria-expanded]');
      if (ownLink instanceof HTMLElement) ownLink.setAttribute('aria-expanded', 'true');
    });
}

function closeAllMenuBranches(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return;
  blockEl.querySelectorAll('.st-menu__item--has-children.is-open').forEach((node) => node.classList.remove('is-open'));
  blockEl.querySelectorAll('.st-menu__item--has-children > .st-menu__link[aria-expanded]').forEach((link) => link.setAttribute('aria-expanded', 'false'));
  persistOpenMenuPaths(blockEl);
  enforceMegaDisplayModes(blockEl);
}

function bindMenuInteractions(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return;
  if (blockEl.__stMenuSubmenuBound) return;
  blockEl.__stMenuSubmenuBound = true;

  const findToggleLink = (ev) => {
    const submenuView = normalizeSubmenuView(blockEl.dataset.menuSubmenuView);
    const selector = submenuView === 'mega'
      ? '.st-menu--big .st-menu__item--has-children > .st-menu__link'
      : '.st-menu--big .st-menu__item--has-children > .st-menu__link';
    const link = ev.target?.closest?.(selector);
    return (link instanceof HTMLElement && blockEl.contains(link)) ? link : null;
  };

  const toggleByClickMode = (ev, sourceType) => {
    const mode = isMenuSettingsModeOn(blockEl) ? 'click' : normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
    if (mode !== 'click' && mode !== 'hover') return;

    const link = findToggleLink(ev);
    if (!link) return;

    const li = link.parentElement;
    if (!(li instanceof HTMLElement)) return;
    const sub = getMegaManagedSublist(li);
    if (!(sub instanceof HTMLElement)) return;

    if (sourceType === 'click') {
      const ignoreUntil = Number(blockEl.__stMenuIgnoreClickUntil || 0);
      if (ignoreUntil && Date.now() < ignoreUntil) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
    }

    ev.preventDefault();
    ev.stopPropagation();

    const shouldOpen = !li.classList.contains('is-open');
    if (shouldOpen) openMenuBranch(li);
    else closeMenuBranch(li);

    if (sourceType === 'pointerdown') {
      blockEl.__stMenuIgnoreClickUntil = Date.now() + 450;
    }
  };

  const openByHoverMode = (ev) => {
    const mode = isMenuSettingsModeOn(blockEl) ? 'click' : normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
    if (mode !== 'hover') return;

    const submenuView = normalizeSubmenuView(blockEl.dataset.menuSubmenuView);
    const selector = submenuView === 'mega'
      ? '.st-menu--big .st-menu__link'
      : '.st-menu--big .st-menu__link';
    const link = ev.target?.closest?.(selector);
    if (!(link instanceof HTMLElement) || !blockEl.contains(link)) return;

    const li = link.parentElement;
    if (!(li instanceof HTMLElement)) return;

    const hasChildren = li.classList.contains('st-menu__item--has-children');
    if (hasChildren) {
      openMenuBranch(li);
      return;
    }

    closeSiblingMenuBranches(li);
    li.querySelectorAll('.st-menu__item--has-children.is-open').forEach((node) => closeMenuBranch(node));
  };

  blockEl.addEventListener('pointerdown', (ev) => {
    const settingsMode = isMenuSettingsModeOn(blockEl);
    const mode = settingsMode ? 'click' : normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
    if (!settingsMode && (mode === 'click' || mode === 'hover') && !ev.target?.closest?.('.st-menu--big .st-menu__link') && !ev.target?.closest?.('.st-menu--big .st-menu__sublist')) {
      closeAllMenuBranches(blockEl);
    }
    toggleByClickMode(ev, 'pointerdown');
  });

  blockEl.addEventListener('click', (ev) => {
    const settingsMode = isMenuSettingsModeOn(blockEl);
    const mode = settingsMode ? 'click' : normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
    toggleByClickMode(ev, 'click');

    const link = ev.target?.closest?.('.st-menu--big .st-menu__link');
    if (!(link instanceof HTMLElement) || !blockEl.contains(link)) return;
    const li = link.parentElement;
    if (!(li instanceof HTMLElement)) return;

    const hasChildren = li.classList.contains('st-menu__item--has-children');
    if (hasChildren) return;

    if (!settingsMode && (mode === 'click' || mode === 'hover')) {
      closeAllMenuBranches(blockEl);
    }
  });

  blockEl.addEventListener('pointerover', (ev) => {
    openByHoverMode(ev);
  });

  const onDocPointerDown = (ev) => {
    const settingsMode = isMenuSettingsModeOn(blockEl);
    const mode = settingsMode ? 'click' : normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
    if (mode !== 'click' && mode !== 'hover') return;
    if (settingsMode) return;
    if (blockEl.contains(ev.target)) return;
    closeAllMenuBranches(blockEl);
  };
  document.addEventListener('pointerdown', onDocPointerDown, true);
  blockEl.__stMenuSubmenuDocPointerDown = onDocPointerDown;

  const onDocKeydown = (ev) => {
    const mode = isMenuSettingsModeOn(blockEl) ? 'click' : normalizeSubmenuMode(blockEl.dataset.menuSubmenuMode);
    if (mode !== 'click' && mode !== 'hover') return;
    if (ev.key !== 'Escape') return;
    closeAllMenuBranches(blockEl);
  };
  document.addEventListener('keydown', onDocKeydown);
  blockEl.__stMenuSubmenuDocKeydown = onDocKeydown;
}


function applyMenuLevelStylesRuntime(blockEl, levelStyles, hoverLevelStyles, openLevelStyles, currentLevelStyles) {
  if (!(blockEl instanceof HTMLElement)) return;
  const src = normalizeLevelStyles(levelStyles);
  const hoverSrc = normalizeLevelStyles(hoverLevelStyles);
  const openSrc = normalizeLevelStyles(openLevelStyles);
  const currentSrc = normalizeLevelStyles(currentLevelStyles);
  for (let i = 1; i <= 10; i += 1) {
    const cur = getLevelStyle(src, i);
    const hov = getLevelStyle(hoverSrc, i);
    const opn = getLevelStyle(openSrc, i);
    const curState = getLevelStyle(currentSrc, i);
    const bgName = `--st-menu-l${i}-bg`;
    const colorName = `--st-menu-l${i}-color`;
    const fsName = `--st-menu-l${i}-fs`;
    const fwName = `--st-menu-l${i}-fw`;
    const fstName = `--st-menu-l${i}-fst`;
    const tsName = `--st-menu-l${i}-ts`;
    const swName = `--st-menu-l${i}-sw`;
    const scName = `--st-menu-l${i}-sc`;
    const bcName = `--st-menu-l${i}-bc`;
    const bsName = `--st-menu-l${i}-bs`;
    const bwName = `--st-menu-l${i}-bw`;
    const brName = `--st-menu-l${i}-br`;
    const shadowName = `--st-menu-l${i}-shadow`;
    const hovBgName = `--st-menu-l${i}-h-bg`;
    const hovColorName = `--st-menu-l${i}-h-color`;
    const hovFsName = `--st-menu-l${i}-h-fs`;
    const hovFwName = `--st-menu-l${i}-h-fw`;
    const hovFstName = `--st-menu-l${i}-h-fst`;
    const hovTsName = `--st-menu-l${i}-h-ts`;
    const hovSwName = `--st-menu-l${i}-h-sw`;
    const hovScName = `--st-menu-l${i}-h-sc`;
    const hovBcName = `--st-menu-l${i}-h-bc`;
    const hovBsName = `--st-menu-l${i}-h-bs`;
    const hovBwName = `--st-menu-l${i}-h-bw`;
    const hovBrName = `--st-menu-l${i}-h-br`;
    const hovShadowName = `--st-menu-l${i}-h-shadow`;
    const openBgName = `--st-menu-l${i}-o-bg`;
    const openColorName = `--st-menu-l${i}-o-color`;
    const openFsName = `--st-menu-l${i}-o-fs`;
    const openFwName = `--st-menu-l${i}-o-fw`;
    const openFstName = `--st-menu-l${i}-o-fst`;
    const openTsName = `--st-menu-l${i}-o-ts`;
    const openSwName = `--st-menu-l${i}-o-sw`;
    const openScName = `--st-menu-l${i}-o-sc`;
    const openBcName = `--st-menu-l${i}-o-bc`;
    const openBsName = `--st-menu-l${i}-o-bs`;
    const openBwName = `--st-menu-l${i}-o-bw`;
    const openBrName = `--st-menu-l${i}-o-br`;
    const openShadowName = `--st-menu-l${i}-o-shadow`;
    const currentBgName = `--st-menu-l${i}-c-bg`;
    const currentColorName = `--st-menu-l${i}-c-color`;
    const currentFsName = `--st-menu-l${i}-c-fs`;
    const currentFwName = `--st-menu-l${i}-c-fw`;
    const currentFstName = `--st-menu-l${i}-c-fst`;
    const currentTsName = `--st-menu-l${i}-c-ts`;
    const currentSwName = `--st-menu-l${i}-c-sw`;
    const currentScName = `--st-menu-l${i}-c-sc`;
    const currentBcName = `--st-menu-l${i}-c-bc`;
    const currentBsName = `--st-menu-l${i}-c-bs`;
    const currentBwName = `--st-menu-l${i}-c-bw`;
    const currentBrName = `--st-menu-l${i}-c-br`;
    const currentShadowName = `--st-menu-l${i}-c-shadow`;
    const bgValue = cur.bg ? ((cur.bgo && /^#([0-9a-fA-F]{6})$/.test(cur.bg)) ? hexToRgbaString(cur.bg, cur.bgo) : cur.bg) : '';
    const hovBgValue = hov.bg ? ((hov.bgo && /^#([0-9a-fA-F]{6})$/.test(hov.bg)) ? hexToRgbaString(hov.bg, hov.bgo) : hov.bg) : '';
    const openBgValue = opn.bg ? ((opn.bgo && /^#([0-9a-fA-F]{6})$/.test(opn.bg)) ? hexToRgbaString(opn.bg, opn.bgo) : opn.bg) : '';
    const currentBgValue = curState.bg ? ((curState.bgo && /^#([0-9a-fA-F]{6})$/.test(curState.bg)) ? hexToRgbaString(curState.bg, curState.bgo) : curState.bg) : '';
    if (bgValue) setBlockStyleProp00438_(blockEl, bgName, bgValue);
    else removeBlockStyleProp00438_(blockEl, bgName);
    if (cur.color) setBlockStyleProp00438_(blockEl, colorName, cur.color);
    else removeBlockStyleProp00438_(blockEl, colorName);
    if (cur.fs) setBlockStyleProp00438_(blockEl, fsName, `${cur.fs}px`);
    else removeBlockStyleProp00438_(blockEl, fsName);
    if (cur.fw) setBlockStyleProp00438_(blockEl, fwName, cur.fw);
    else removeBlockStyleProp00438_(blockEl, fwName);
    if (cur.fst) setBlockStyleProp00438_(blockEl, fstName, cur.fst);
    else removeBlockStyleProp00438_(blockEl, fstName);
    if (cur.ts) setBlockStyleProp00438_(blockEl, tsName, cur.ts);
    else removeBlockStyleProp00438_(blockEl, tsName);
    if (cur.sw) setBlockStyleProp00438_(blockEl, swName, cur.sw);
    else removeBlockStyleProp00438_(blockEl, swName);
    if (cur.sc) setBlockStyleProp00438_(blockEl, scName, cur.sc);
    else removeBlockStyleProp00438_(blockEl, scName);
    const borderValue = cur.bc ? ((/^#([0-9a-fA-F]{6})$/.test(cur.bc) && cur.bco) ? hexToRgbaString(cur.bc, cur.bco) : cur.bc) : '';
    if (borderValue) setBlockStyleProp00438_(blockEl, bcName, borderValue);
    else removeBlockStyleProp00438_(blockEl, bcName);
    if (cur.bs) setBlockStyleProp00438_(blockEl, bsName, cur.bs);
    else removeBlockStyleProp00438_(blockEl, bsName);
    if (cur.bw) setBlockStyleProp00438_(blockEl, bwName, `${cur.bw}px`);
    else removeBlockStyleProp00438_(blockEl, bwName);
    if (cur.br) setBlockStyleProp00438_(blockEl, brName, `${cur.br}px`);
    else removeBlockStyleProp00438_(blockEl, brName);
    if (cur.shColor) {
      const sx = cur.shX || '0';
      const sy = cur.shY || '8';
      const sb = cur.shBlur || '24';
      const ss = cur.shSpread || '0';
      const sc = (/^#([0-9a-fA-F]{6})$/.test(cur.shColor) && cur.sho) ? hexToRgbaString(cur.shColor, cur.sho) : cur.shColor;
      const prefix = cur.sht === 'inset' ? 'inset ' : '';
      setBlockStyleProp00438_(blockEl, shadowName, `${prefix}${sx}px ${sy}px ${sb}px ${ss}px ${sc}`);
    } else {
      removeBlockStyleProp00438_(blockEl, shadowName);
    }
    if (hovBgValue) setBlockStyleProp00438_(blockEl, hovBgName, hovBgValue);
    else removeBlockStyleProp00438_(blockEl, hovBgName);
    if (hov.color) setBlockStyleProp00438_(blockEl, hovColorName, hov.color);
    else removeBlockStyleProp00438_(blockEl, hovColorName);
    if (hov.fs) setBlockStyleProp00438_(blockEl, hovFsName, `${hov.fs}px`);
    else removeBlockStyleProp00438_(blockEl, hovFsName);
    if (hov.fw) setBlockStyleProp00438_(blockEl, hovFwName, hov.fw);
    else removeBlockStyleProp00438_(blockEl, hovFwName);
    if (hov.fst) setBlockStyleProp00438_(blockEl, hovFstName, hov.fst);
    else removeBlockStyleProp00438_(blockEl, hovFstName);
    if (hov.ts) setBlockStyleProp00438_(blockEl, hovTsName, hov.ts);
    else removeBlockStyleProp00438_(blockEl, hovTsName);
    if (hov.sw) setBlockStyleProp00438_(blockEl, hovSwName, hov.sw);
    else removeBlockStyleProp00438_(blockEl, hovSwName);
    if (hov.sc) setBlockStyleProp00438_(blockEl, hovScName, hov.sc);
    else removeBlockStyleProp00438_(blockEl, hovScName);
    const hovBorderValue = hov.bc ? ((/^#([0-9a-fA-F]{6})$/.test(hov.bc) && hov.bco) ? hexToRgbaString(hov.bc, hov.bco) : hov.bc) : '';
    if (hovBorderValue) setBlockStyleProp00438_(blockEl, hovBcName, hovBorderValue);
    else removeBlockStyleProp00438_(blockEl, hovBcName);
    if (hov.bs) setBlockStyleProp00438_(blockEl, hovBsName, hov.bs);
    else removeBlockStyleProp00438_(blockEl, hovBsName);
    if (hov.bw) setBlockStyleProp00438_(blockEl, hovBwName, `${hov.bw}px`);
    else removeBlockStyleProp00438_(blockEl, hovBwName);
    if (hov.br) setBlockStyleProp00438_(blockEl, hovBrName, `${hov.br}px`);
    else removeBlockStyleProp00438_(blockEl, hovBrName);
    if (hov.shColor) {
      const sx = hov.shX || '0';
      const sy = hov.shY || '8';
      const sb = hov.shBlur || '24';
      const ss = hov.shSpread || '0';
      const sc = (/^#([0-9a-fA-F]{6})$/.test(hov.shColor) && hov.sho) ? hexToRgbaString(hov.shColor, hov.sho) : hov.shColor;
      const prefix = hov.sht === 'inset' ? 'inset ' : '';
      setBlockStyleProp00438_(blockEl, hovShadowName, `${prefix}${sx}px ${sy}px ${sb}px ${ss}px ${sc}`);
    } else {
      removeBlockStyleProp00438_(blockEl, hovShadowName);
    }
    if (openBgValue) setBlockStyleProp00438_(blockEl, openBgName, openBgValue);
    else removeBlockStyleProp00438_(blockEl, openBgName);
    if (opn.color) setBlockStyleProp00438_(blockEl, openColorName, opn.color);
    else removeBlockStyleProp00438_(blockEl, openColorName);
    if (opn.fs) setBlockStyleProp00438_(blockEl, openFsName, `${opn.fs}px`);
    else removeBlockStyleProp00438_(blockEl, openFsName);
    if (opn.fw) setBlockStyleProp00438_(blockEl, openFwName, opn.fw);
    else removeBlockStyleProp00438_(blockEl, openFwName);
    if (opn.fst) setBlockStyleProp00438_(blockEl, openFstName, opn.fst);
    else removeBlockStyleProp00438_(blockEl, openFstName);
    if (opn.ts) setBlockStyleProp00438_(blockEl, openTsName, opn.ts);
    else removeBlockStyleProp00438_(blockEl, openTsName);
    if (opn.sw) setBlockStyleProp00438_(blockEl, openSwName, opn.sw);
    else removeBlockStyleProp00438_(blockEl, openSwName);
    if (opn.sc) setBlockStyleProp00438_(blockEl, openScName, opn.sc);
    else removeBlockStyleProp00438_(blockEl, openScName);
    const openBorderValue = opn.bc ? ((/^#([0-9a-fA-F]{6})$/.test(opn.bc) && opn.bco) ? hexToRgbaString(opn.bc, opn.bco) : opn.bc) : '';
    if (openBorderValue) setBlockStyleProp00438_(blockEl, openBcName, openBorderValue);
    else removeBlockStyleProp00438_(blockEl, openBcName);
    if (opn.bs) setBlockStyleProp00438_(blockEl, openBsName, opn.bs);
    else removeBlockStyleProp00438_(blockEl, openBsName);
    if (opn.bw) setBlockStyleProp00438_(blockEl, openBwName, `${opn.bw}px`);
    else removeBlockStyleProp00438_(blockEl, openBwName);
    if (opn.br) setBlockStyleProp00438_(blockEl, openBrName, `${opn.br}px`);
    else removeBlockStyleProp00438_(blockEl, openBrName);
    if (opn.shColor) {
      const sx = opn.shX || '0';
      const sy = opn.shY || '8';
      const sb = opn.shBlur || '24';
      const ss = opn.shSpread || '0';
      const sc = (/^#([0-9a-fA-F]{6})$/.test(opn.shColor) && opn.sho) ? hexToRgbaString(opn.shColor, opn.sho) : opn.shColor;
      const prefix = opn.sht === 'inset' ? 'inset ' : '';
      setBlockStyleProp00438_(blockEl, openShadowName, `${prefix}${sx}px ${sy}px ${sb}px ${ss}px ${sc}`);
    } else {
      removeBlockStyleProp00438_(blockEl, openShadowName);
    }
    if (currentBgValue) setBlockStyleProp00438_(blockEl, currentBgName, currentBgValue);
    else removeBlockStyleProp00438_(blockEl, currentBgName);
    if (curState.color) setBlockStyleProp00438_(blockEl, currentColorName, curState.color);
    else removeBlockStyleProp00438_(blockEl, currentColorName);
    if (curState.fs) setBlockStyleProp00438_(blockEl, currentFsName, `${curState.fs}px`);
    else removeBlockStyleProp00438_(blockEl, currentFsName);
    if (curState.fw) setBlockStyleProp00438_(blockEl, currentFwName, curState.fw);
    else removeBlockStyleProp00438_(blockEl, currentFwName);
    if (curState.fst) setBlockStyleProp00438_(blockEl, currentFstName, curState.fst);
    else removeBlockStyleProp00438_(blockEl, currentFstName);
    if (curState.ts) setBlockStyleProp00438_(blockEl, currentTsName, curState.ts);
    else removeBlockStyleProp00438_(blockEl, currentTsName);
    if (curState.sw) setBlockStyleProp00438_(blockEl, currentSwName, curState.sw);
    else removeBlockStyleProp00438_(blockEl, currentSwName);
    if (curState.sc) setBlockStyleProp00438_(blockEl, currentScName, curState.sc);
    else removeBlockStyleProp00438_(blockEl, currentScName);
    const currentBorderValue = curState.bc ? ((/^#([0-9a-fA-F]{6})$/.test(curState.bc) && curState.bco) ? hexToRgbaString(curState.bc, curState.bco) : curState.bc) : '';
    if (currentBorderValue) setBlockStyleProp00438_(blockEl, currentBcName, currentBorderValue);
    else removeBlockStyleProp00438_(blockEl, currentBcName);
    if (curState.bs) setBlockStyleProp00438_(blockEl, currentBsName, curState.bs);
    else removeBlockStyleProp00438_(blockEl, currentBsName);
    if (curState.bw) setBlockStyleProp00438_(blockEl, currentBwName, `${curState.bw}px`);
    else removeBlockStyleProp00438_(blockEl, currentBwName);
    if (curState.br) setBlockStyleProp00438_(blockEl, currentBrName, `${curState.br}px`);
    else removeBlockStyleProp00438_(blockEl, currentBrName);
    if (curState.shColor) {
      const sx = curState.shX || '0';
      const sy = curState.shY || '8';
      const sb = curState.shBlur || '24';
      const ss = curState.shSpread || '0';
      const sc = (/^#([0-9a-fA-F]{6})$/.test(curState.shColor) && curState.sho) ? hexToRgbaString(curState.shColor, curState.sho) : curState.shColor;
      const prefix = curState.sht === 'inset' ? 'inset ' : '';
      setBlockStyleProp00438_(blockEl, currentShadowName, `${prefix}${sx}px ${sy}px ${sb}px ${ss}px ${sc}`);
    } else {
      removeBlockStyleProp00438_(blockEl, currentShadowName);
    }
  }
}


function applyMenuLevelContainerStylesRuntime(blockEl, levelContainerStyles, levelContainerHoverStyles, levelContainerOpenStyles, levelContainerCurrentStyles) {
  if (!(blockEl instanceof HTMLElement)) return;
  blockEl.dataset.menuLevelContainerStyles = serializeLevelStyles(normalizeLevelStyles(levelContainerStyles));
  blockEl.dataset.menuLevelContainerHoverStyles = serializeLevelStyles(normalizeLevelStyles(levelContainerHoverStyles));
  blockEl.dataset.menuLevelContainerOpenStyles = serializeLevelStyles(normalizeLevelStyles(levelContainerOpenStyles));
  blockEl.dataset.menuLevelContainerCurrentStyles = serializeLevelStyles(normalizeLevelStyles(levelContainerCurrentStyles));
}


function applyMenuLevelContentLayoutRuntime(blockEl, levelContentLayoutStyles) {
  if (!(blockEl instanceof HTMLElement)) return;
  const src = normalizeLevelContentLayoutStyles(levelContentLayoutStyles);
  blockEl.dataset.menuLevelContentLayoutStyles = serializeLevelContentLayoutStyles(src);
  const setOrRemove = (el, prop, value) => {
    if (!(el instanceof HTMLElement)) return;
    if (value === '' || value == null) el.style.removeProperty(prop);
    else el.style.setProperty(prop, value);
  };
  for (let i = 1; i <= 10; i += 1) {
    const cur = getLevelContentLayoutStyle(src, i);
    const dividerColor = (cur.divColor && /^#([0-9a-fA-F]{6})$/.test(cur.divColor))
      ? hexToRgbaString(cur.divColor, cur.divOpacity || '100')
      : '';
    const dividerMode = normalizeMegaDividerMode(cur.divMode, 'joined');
    blockEl.querySelectorAll(`.st-menu__list[data-menu-list-depth="${i}"]`).forEach((listEl) => {
      setOrRemove(listEl, 'gap', cur.gap ? `${cur.gap}px` : '');
    });
    blockEl.querySelectorAll(`.st-menu__item[data-menu-depth="${i}"] > .st-menu__link`).forEach((linkEl) => {
      setOrRemove(linkEl, 'padding-top', cur.py ? `${cur.py}px` : '');
      setOrRemove(linkEl, 'padding-bottom', cur.py ? `${cur.py}px` : '');
      setOrRemove(linkEl, 'padding-left', cur.px ? `${cur.px}px` : '');
      setOrRemove(linkEl, 'padding-right', cur.px ? `${cur.px}px` : '');
      if (linkEl.classList.contains('st-menu__mega-title')) {
        setOrRemove(linkEl, 'border-bottom-width', '');
        setOrRemove(linkEl, 'border-bottom-style', '');
        setOrRemove(linkEl, 'border-bottom-color', '');
      }
    });
    blockEl.querySelectorAll(`.st-menu__item--mega-col[data-menu-depth="${i}"]`).forEach((itemEl) => {
      setOrRemove(itemEl, 'gap', cur.titleGap ? `${cur.titleGap}px` : '');
      setOrRemove(itemEl, '--st-menu-mega-divider-color', dividerColor);
      setOrRemove(itemEl, '--st-menu-mega-divider-width', cur.divWidth ? `${cur.divWidth}px` : '');
      setOrRemove(itemEl, '--st-menu-mega-divider-radius', cur.divRadius ? `${cur.divRadius}px` : '');
      setOrRemove(itemEl, '--st-menu-mega-divider-gap', cur.titleGap ? `${cur.titleGap}px` : '');
      itemEl.dataset.megaDividerMode = dividerMode;
    });
  }
}


function applyMenuArrowStylesRuntime(blockEl, levelArrowStyles, levelArrowHoverStyles, levelArrowOpenStyles) {
  if (!(blockEl instanceof HTMLElement)) return;
  const src = normalizeLevelArrowStyles(levelArrowStyles);
  const hoverSrc = normalizeLevelArrowStyles(levelArrowHoverStyles);
  const openSrc = normalizeLevelArrowStyles(levelArrowOpenStyles);
  for (let i = 1; i <= 10; i += 1) {
    const cur = getLevelArrowStyle(src, i);
    const hov = getLevelArrowStyle(hoverSrc, i);
    const opn = getLevelArrowStyle(openSrc, i);
    const setOrRemove = (name, val, suffix = '') => {
      if (val === '' || val == null) removeBlockStyleProp00438_(blockEl, name);
      else setBlockStyleProp00438_(blockEl, name, `${val}${suffix}`);
    };
    setOrRemove(`--st-menu-a${i}-color`, cur.color);
    setOrRemove(`--st-menu-a${i}-size`, cur.size, 'px');
    setOrRemove(`--st-menu-a${i}-stroke`, cur.stroke);
    setOrRemove(`--st-menu-a${i}-gap`, cur.gap, 'px');
    setOrRemove(`--st-menu-a${i}-rot`, cur.rot, 'deg');
    setOrRemove(`--st-menu-a${i}-h-color`, hov.color);
    setOrRemove(`--st-menu-a${i}-h-size`, hov.size, 'px');
    setOrRemove(`--st-menu-a${i}-h-stroke`, hov.stroke);
    setOrRemove(`--st-menu-a${i}-h-gap`, hov.gap, 'px');
    setOrRemove(`--st-menu-a${i}-h-rot`, hov.rot, 'deg');
    setOrRemove(`--st-menu-a${i}-o-color`, opn.color);
    setOrRemove(`--st-menu-a${i}-o-size`, opn.size, 'px');
    setOrRemove(`--st-menu-a${i}-o-stroke`, opn.stroke);
    setOrRemove(`--st-menu-a${i}-o-gap`, opn.gap, 'px');
    setOrRemove(`--st-menu-a${i}-o-rot`, opn.rot, 'deg');
  }
  blockEl.dataset.menuLevelArrowStyles = serializeLevelArrowStyles(src);
  blockEl.dataset.menuLevelArrowHoverStyles = serializeLevelArrowStyles(hoverSrc);
  blockEl.dataset.menuLevelArrowOpenStyles = serializeLevelArrowStyles(openSrc);
}

function buildListContainerCssValues(cur) {
  const bg = cur.bg ? ((cur.bgo && /^#([0-9a-fA-F]{6})$/.test(cur.bg)) ? hexToRgbaString(cur.bg, cur.bgo) : cur.bg) : '';
  const bc = cur.bc ? ((cur.bco && /^#([0-9a-fA-F]{6})$/.test(cur.bc)) ? hexToRgbaString(cur.bc, cur.bco) : cur.bc) : '';
  let shadow = '';
  if (cur.shColor) {
    const sx = cur.shX || '0';
    const sy = cur.shY || '8';
    const sb = cur.shBlur || '24';
    const ss = cur.shSpread || '0';
    const sc = (/^#([0-9a-fA-F]{6})$/.test(cur.shColor) && cur.sho) ? hexToRgbaString(cur.shColor, cur.sho) : cur.shColor;
    const prefix = cur.sht === 'inset' ? 'inset ' : '';
    shadow = `${prefix}${sx}px ${sy}px ${sb}px ${ss}px ${sc}`;
  }
  return { bg, bc, bs: cur.bs || '', bw: cur.bw ? `${cur.bw}px` : '', br: cur.br ? `${cur.br}px` : '', shadow };
}

function applyListContainerCssStateVars(listEl, suffix, cur) {
  if (!(listEl instanceof HTMLElement)) return;
  const css = buildListContainerCssValues(cur || {});
  const setOrRemove = (name, value) => {
    if (value === '' || value == null) listEl.style.removeProperty(name);
    else listEl.style.setProperty(name, value);
  };
  setOrRemove(`--st-menu-lc${suffix}-bg`, css.bg);
  setOrRemove(`--st-menu-lc${suffix}-bc`, css.bc);
  setOrRemove(`--st-menu-lc${suffix}-bs`, css.bs);
  setOrRemove(`--st-menu-lc${suffix}-bw`, css.bw);
  setOrRemove(`--st-menu-lc${suffix}-br`, css.br);
  setOrRemove(`--st-menu-lc${suffix}-shadow`, css.shadow);
}

function applyListContainerStyle(listEl, levelContainerStyles, level, stateMaps = null) {
  if (!(listEl instanceof HTMLElement)) return;
  listEl.dataset.menuListDepth = String(Math.max(1, Math.min(10, Number(level) || 1)));
  if (listEl.classList.contains('st-menu__mega')) {
    listEl.style.removeProperty('background');
    listEl.style.removeProperty('border-color');
    listEl.style.removeProperty('border-style');
    listEl.style.removeProperty('border-width');
    listEl.style.removeProperty('border-radius');
    listEl.style.removeProperty('box-shadow');
    applyListContainerCssStateVars(listEl, '', {});
    applyListContainerCssStateVars(listEl, '-h', {});
    applyListContainerCssStateVars(listEl, '-o', {});
    applyListContainerCssStateVars(listEl, '-c', {});
    return;
  }
  applyListContainerCssStateVars(listEl, '', getLevelStyle(levelContainerStyles, level));
  applyListContainerCssStateVars(listEl, '-h', getLevelStyle(stateMaps?.hover, level));
  applyListContainerCssStateVars(listEl, '-o', getLevelStyle(stateMaps?.open, level));
  applyListContainerCssStateVars(listEl, '-c', getLevelStyle(stateMaps?.current, level));
}

function applyMenuRootLayoutRuntime(blockEl) {
  if (!(blockEl instanceof HTMLElement)) return;
  const level1Layout = getLevelContentLayoutStyle(normalizeLevelContentLayoutStyles(blockEl.dataset.menuLevelContentLayoutStyles), 1);
  // ✅ Для рівня 1 canonical source — menuLevelContentLayoutStyles[1].
  // Старі menuRoot* лишаються дзеркалами для сумісності.
  const justify = normalizeMenuRootJustify(level1Layout.justify || blockEl.dataset.menuRootJustify);
  const align = normalizeMenuRootAlign(level1Layout.align || blockEl.dataset.menuRootAlign);
  // ✅ ЄДИНЕ канонічне місце для відстані між пунктами меню —
  // menuLevelContentLayoutStyles[1].gap. Старий menuRootGap лишається тільки
  // дзеркалом для сумісності. Це прибирає конфлікт: повзунок міг показувати 58px,
  // а render меню повертав root gap зі старого місця.
  const gap = normalizeMenuRootGap(level1Layout.gap || blockEl.dataset.menuRootGap);
  const padX = normalizeMenuRootPad(level1Layout.px || blockEl.dataset.menuRootPadX, '0');
  const padY = normalizeMenuRootPad(level1Layout.py || blockEl.dataset.menuRootPadY, '0');
  blockEl.dataset.menuRootJustify = justify;
  blockEl.dataset.menuRootAlign = align;
  blockEl.dataset.menuRootGap = gap;
  blockEl.dataset.menuRootPadX = padX;
  blockEl.dataset.menuRootPadY = padY;
  setBlockStyleProp00438_(blockEl, '--st-menu-root-justify', justify);
  setBlockStyleProp00438_(blockEl, '--st-menu-root-align', align);
  setBlockStyleProp00438_(blockEl, '--st-menu-root-gap', `${gap}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-root-pad-x', `${padX}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-root-pad-y', `${padY}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-gap', `${gap}px`);
  blockEl.querySelectorAll('.st-menu--big > .st-menu__list, .st-menu--burger > .st-menu__panel > .st-menu__list, .st-menu > .st-menu__list').forEach((listEl) => {
    if (!(listEl instanceof HTMLElement)) return;
    listEl.dataset.stLayoutProxy = 'menu-root-list';
    listEl.dataset.menuListDepth = '1';
    listEl.style.setProperty('justify-content', justify);
    listEl.style.setProperty('align-items', align);
    listEl.style.setProperty('gap', `${gap}px`);
    listEl.style.setProperty('padding', `${padY}px ${padX}px`);
    listEl.style.setProperty('width', '100%');
    listEl.style.setProperty('min-height', '100%');
    listEl.style.setProperty('box-sizing', 'border-box');
  });
}

function applyMenuRuntimeState(blockEl, data) {
  if (!(blockEl instanceof HTMLElement)) return;
  blockEl.dataset.menuSubmenuMode = normalizeSubmenuMode(data?.submenuMode);
  blockEl.dataset.menuSubmenuView = normalizeSubmenuView(data?.submenuView);
  blockEl.dataset.menuSubmenuArrow = normalizeSubmenuArrow(data?.submenuArrow);
  blockEl.dataset.menuSubmenuAlign = normalizeSubmenuAlign(data?.submenuAlign);
  blockEl.dataset.menuSubmenuOffsetY = normalizeSubmenuOffsetY(data?.submenuOffsetY);
  blockEl.dataset.menuSubmenuMinWidth = normalizeSubmenuMinWidth(data?.submenuMinWidth);
  blockEl.dataset.menuSubmenuWidthMode = normalizeSubmenuWidthMode(data?.submenuWidthMode);
  blockEl.dataset.menuSubmenuCustomWidth = normalizeSubmenuCustomWidth(data?.submenuCustomWidth);
  blockEl.dataset.menuRootJustify = normalizeMenuRootJustify(data?.menuRootJustify);
  blockEl.dataset.menuRootAlign = normalizeMenuRootAlign(data?.menuRootAlign);
  blockEl.dataset.menuRootGap = normalizeMenuRootGap(data?.menuRootGap);
  blockEl.dataset.menuRootPadX = normalizeMenuRootPad(data?.menuRootPadX, '0');
  blockEl.dataset.menuRootPadY = normalizeMenuRootPad(data?.menuRootPadY, '0');
  blockEl.dataset.menuMegaCols = normalizeMegaColsMode(data?.menuMegaCols);
  blockEl.dataset.menuMegaColsCustom = normalizeMegaColsCustom(data?.menuMegaColsCustom);
  blockEl.dataset.menuMegaGap = normalizeMegaColGap(data?.menuMegaGap);
  blockEl.dataset.menuMegaColMinWidth = normalizeMegaColMinWidth(data?.menuMegaColMinWidth);
  blockEl.dataset.menuMegaPosition = normalizeMegaPosition(data?.menuMegaPosition);
  blockEl.dataset.menuMegaOffsetLeft = normalizeMegaSideOffset(data?.menuMegaOffsetLeft);
  blockEl.dataset.menuMegaOffsetRight = normalizeMegaSideOffset(data?.menuMegaOffsetRight);
  blockEl.dataset.menuMegaBgMode = normalizeMegaBgMode(data?.menuMegaBgMode);
  blockEl.dataset.menuMegaBgColor = normalizeMegaBgColor(data?.menuMegaBgColor, '#020617');
  blockEl.dataset.menuMegaBgImage = normalizeMegaBgImage(data?.menuMegaBgImage);
  blockEl.dataset.menuMegaBgGradient1 = normalizeMegaBgColor(data?.menuMegaBgGradient1, '#020617');
  blockEl.dataset.menuMegaBgGradient2 = normalizeMegaBgColor(data?.menuMegaBgGradient2, '#0f172a');
  blockEl.dataset.menuMegaBgGradient3 = normalizeMegaBgColor(data?.menuMegaBgGradient3, '#1e293b');
  blockEl.dataset.menuMegaBgOpacity = normalizeMegaBgOpacity(data?.menuMegaBgOpacity);
  blockEl.dataset.menuMegaPanelColor = normalizeMegaPanelColor(data?.menuMegaPanelColor, '#020617');
  blockEl.dataset.menuMegaPanelOpacity = normalizeMegaPanelOpacity(
    data?.menuMegaPanelOpacity,
    (blockEl.dataset.menuMegaBgMode === 'image' || blockEl.dataset.menuMegaBgMode === 'gradient') ? '82' : '0'
  );
  blockEl.dataset.menuMegaPanelSurfaceOpacity = normalizeMegaPanelOpacity(data?.menuMegaPanelSurfaceOpacity, '100');
  blockEl.dataset.menuMegaPanelBlur = normalizeMegaPanelBlur(data?.menuMegaPanelBlur, '0');
  blockEl.dataset.menuMegaPanelBlurRadius = normalizeMegaPanelBlurRadius(data?.menuMegaPanelBlurRadius, data?.menuMegaPanelBorderRadius || data?.menuMegaPanelRadius || '18');
  blockEl.dataset.menuMegaPanelBorderColor = normalizeMegaPanelBorderColor(data?.menuMegaPanelBorderColor, '#94a3b8');
  blockEl.dataset.menuMegaPanelBorderOpacity = normalizeMegaPanelBorderOpacity(data?.menuMegaPanelBorderOpacity, '22');
  blockEl.dataset.menuMegaPanelBorderWidth = normalizeMegaPanelBorderWidth(data?.menuMegaPanelBorderWidth, '1');
  blockEl.dataset.menuMegaPanelBorderRadius = normalizeMegaPanelBorderRadius(data?.menuMegaPanelBorderRadius, data?.menuMegaPanelRadius || '18');
  blockEl.dataset.menuMegaPanelRadius = normalizeMegaPanelRadius(data?.menuMegaPanelRadius, '18');
  blockEl.dataset.menuMegaRadiusCorners = normalizeMegaRadiusCorners(data?.menuMegaRadiusCorners, '1111');
  blockEl.dataset.menuMegaPanelBlurCornerValues = normalizeMegaCornerValues(data?.menuMegaPanelBlurCornerValues, blockEl.dataset.menuMegaPanelBlurRadius || blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18', blockEl.dataset.menuMegaRadiusCorners);
  blockEl.dataset.menuMegaPanelBorderCornerValues = normalizeMegaCornerValues(data?.menuMegaPanelBorderCornerValues, blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18', blockEl.dataset.menuMegaRadiusCorners);
  blockEl.dataset.menuMegaPanelCornerValues = normalizeMegaCornerValues(data?.menuMegaPanelCornerValues, blockEl.dataset.menuMegaPanelRadius || '18', blockEl.dataset.menuMegaRadiusCorners);
  blockEl.dataset.menuMegaPanelShadowColor = normalizeMegaPanelShadowColor(data?.menuMegaPanelShadowColor, '#000000');
  blockEl.dataset.menuMegaPanelShadowOpacity = normalizeMegaPanelShadowOpacity(data?.menuMegaPanelShadowOpacity, '42');
  blockEl.dataset.menuMegaPanelShadowX = normalizeMegaPanelShadowAxis(data?.menuMegaPanelShadowX, '0');
  blockEl.dataset.menuMegaPanelShadowY = normalizeMegaPanelShadowAxis(data?.menuMegaPanelShadowY, '22');
  blockEl.dataset.menuMegaPanelShadowBlur = normalizeMegaPanelShadowBlur(data?.menuMegaPanelShadowBlur, '48');
  blockEl.dataset.menuMegaPanelShadowSpread = normalizeMegaPanelShadowSpread(data?.menuMegaPanelShadowSpread, '0');
  blockEl.dataset.menuMegaBgAngle = normalizeMegaBgAngle(data?.menuMegaBgAngle);
  blockEl.dataset.menuMegaBgSize = normalizeMegaBgSizeMode(data?.menuMegaBgSize);
  blockEl.dataset.menuMegaBgScale = normalizeMegaBgScale(data?.menuMegaBgScale);
  blockEl.dataset.menuMegaBgRepeat = normalizeMegaBgRepeat(data?.menuMegaBgRepeat);
  blockEl.dataset.menuMegaBgPosition = normalizeMegaBgPosition(data?.menuMegaBgPosition);
  blockEl.dataset.menuMegaBgPosX = normalizeMegaBgPosPercent(data?.menuMegaBgPosX, '50');
  blockEl.dataset.menuMegaBgPosY = normalizeMegaBgPosPercent(data?.menuMegaBgPosY, '50');
  blockEl.dataset.menuMegaTitleColor = normalizeMegaTitleColor(data?.menuMegaTitleColor, '#f8fafc');
  blockEl.dataset.menuMegaTitleSize = normalizeMegaTitleSize(data?.menuMegaTitleSize, '16');
  blockEl.dataset.menuMegaTitleDividerColor = normalizeMegaTitleDividerColor(data?.menuMegaTitleDividerColor, '#94a3b8');
  blockEl.dataset.menuMegaTitleDividerOpacity = normalizeMegaTitleDividerOpacity(data?.menuMegaTitleDividerOpacity, '16');
  blockEl.dataset.menuMegaTitleDividerWidth = normalizeMegaTitleDividerWidth(data?.menuMegaTitleDividerWidth, '1');
  blockEl.dataset.menuMegaTitleGap = normalizeMegaTitleGap(data?.menuMegaTitleGap, '12');
  blockEl.dataset.menuMegaLinkColor = normalizeMegaLinkColor(data?.menuMegaLinkColor, '#e2e8f0');
  blockEl.dataset.menuMegaLinkSize = normalizeMegaLinkSize(data?.menuMegaLinkSize, '15');
  blockEl.dataset.menuMegaLinkGap = normalizeMegaLinkGap(data?.menuMegaLinkGap, '8');
  blockEl.dataset.menuMegaLinkPadY = normalizeMegaLinkPadY(data?.menuMegaLinkPadY, '8');
  blockEl.dataset.menuMegaLinkPadX = normalizeMegaLinkPadX(data?.menuMegaLinkPadX, '10');
  blockEl.dataset.menuMegaLinkRadius = normalizeMegaLinkRadius(data?.menuMegaLinkRadius, '10');
  blockEl.dataset.menuMegaLinkHoverColor = normalizeMegaLinkHoverColor(data?.menuMegaLinkHoverColor, '#ffffff');
  blockEl.dataset.menuMegaLinkHoverBgColor = normalizeMegaLinkHoverBgColor(data?.menuMegaLinkHoverBgColor, '#38bdf8');
  blockEl.dataset.menuMegaLinkHoverBgOpacity = normalizeMegaLinkHoverBgOpacity(data?.menuMegaLinkHoverBgOpacity, '10');
  blockEl.dataset.menuLevel1Direction = normalizeLevelDirection(data?.menuLevel1Direction, 'row');
  blockEl.dataset.menuLevel2Direction = normalizeLevelDirection(data?.menuLevel2Direction, 'column');
  blockEl.dataset.menuLevel3Direction = normalizeLevelDirection(data?.menuLevel3Direction, 'column');
  blockEl.dataset.menuLevel3Position = normalizeLevel3Position(data?.level3Position);
  blockEl.dataset.menuLevel3OffsetX = normalizeLevel3OffsetX(data?.level3OffsetX);
  blockEl.dataset.menuLevel3OffsetY = normalizeLevel3OffsetY(data?.level3OffsetY);
  blockEl.dataset.menuLevel3MinWidth = normalizeLevel3MinWidth(data?.level3MinWidth);
  blockEl.dataset.menuLevel3WidthMode = normalizeLevel3WidthMode(data?.level3WidthMode);
  blockEl.dataset.menuLevel3CustomWidth = normalizeLevel3CustomWidth(data?.level3CustomWidth);
  blockEl.dataset.menuSettingsMode = normalizeSettingsMode(data?.menuSettingsMode);
  blockEl.dataset.menuLevelStyles = serializeLevelStyles(normalizeLevelStyles(data?.levelStyles));
  blockEl.dataset.menuLevelHoverStyles = serializeLevelStyles(normalizeLevelStyles(data?.levelHoverStyles));
  blockEl.dataset.menuLevelOpenStyles = serializeLevelStyles(normalizeLevelStyles(data?.levelOpenStyles));
  blockEl.dataset.menuLevelCurrentStyles = serializeLevelStyles(normalizeLevelStyles(data?.levelCurrentStyles));
  blockEl.dataset.menuLevelContainerStyles = serializeLevelStyles(normalizeLevelStyles(data?.levelContainerStyles));
  setBlockStyleProp00438_(blockEl, '--st-menu-submenu-offset-y', `${blockEl.dataset.menuSubmenuOffsetY}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-submenu-minw', `${blockEl.dataset.menuSubmenuMinWidth}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-submenu-customw', `${blockEl.dataset.menuSubmenuCustomWidth}px`);
  const megaColsMode = normalizeMegaColsMode(blockEl.dataset.menuMegaCols);
  const megaColsCustom = normalizeMegaColsCustom(blockEl.dataset.menuMegaColsCustom);
  const megaColMinW = normalizeMegaColMinWidth(blockEl.dataset.menuMegaColMinWidth);
  const megaPosition = normalizeMegaPosition(blockEl.dataset.menuMegaPosition);
  const megaGridTemplate = megaColsMode === 'auto'
    ? `repeat(auto-fit, minmax(${megaColMinW}px, 1fr))`
    : `repeat(${megaColsMode === 'custom' ? megaColsCustom : megaColsMode}, minmax(${megaColMinW}px, 1fr))`;
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-grid-cols', megaGridTemplate);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-gap', `${normalizeMegaColGap(blockEl.dataset.menuMegaGap)}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-col-minw', `${megaColMinW}px`);
  blockEl.dataset.menuMegaPosition = megaPosition;
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-offset-left', `${normalizeMegaSideOffset(blockEl.dataset.menuMegaOffsetLeft)}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-offset-right', `${normalizeMegaSideOffset(blockEl.dataset.menuMegaOffsetRight)}px`);
  const megaBgMode = normalizeMegaBgMode(blockEl.dataset.menuMegaBgMode);
  const megaBgColor = normalizeMegaBgColor(blockEl.dataset.menuMegaBgColor, '#020617');
  const megaBgImage = recallMegaBgImage(blockEl, blockEl.dataset.menuMegaBgImage);
  const megaBgGradient1 = normalizeMegaBgColor(blockEl.dataset.menuMegaBgGradient1, '#020617');
  const megaBgGradient2 = normalizeMegaBgColor(blockEl.dataset.menuMegaBgGradient2, '#0f172a');
  const megaBgGradient3 = normalizeMegaBgColor(blockEl.dataset.menuMegaBgGradient3, '#1e293b');
  const megaBgOpacity = normalizeMegaBgOpacity(blockEl.dataset.menuMegaBgOpacity);
  const megaPanelColor = normalizeMegaPanelColor(blockEl.dataset.menuMegaPanelColor, '#020617');
  const megaPanelOpacity = normalizeMegaPanelOpacity(
    blockEl.dataset.menuMegaPanelOpacity,
    (megaBgMode === 'image' || megaBgMode === 'gradient') ? '82' : '0'
  );
  const megaPanelSurfaceOpacity = normalizeMegaPanelOpacity(blockEl.dataset.menuMegaPanelSurfaceOpacity, '100');
  const megaBgAngle = normalizeMegaBgAngle(blockEl.dataset.menuMegaBgAngle);
  const megaPanelBlur = normalizeMegaPanelBlur(blockEl.dataset.menuMegaPanelBlur, '0');
  const megaPanelBlurRadius = normalizeMegaPanelBlurRadius(blockEl.dataset.menuMegaPanelBlurRadius, blockEl.dataset.menuMegaPanelBorderRadius || blockEl.dataset.menuMegaPanelRadius || '18');
  const megaPanelBorderColor = normalizeMegaPanelBorderColor(blockEl.dataset.menuMegaPanelBorderColor, '#94a3b8');
  const megaPanelBorderOpacity = normalizeMegaPanelBorderOpacity(blockEl.dataset.menuMegaPanelBorderOpacity, '22');
  const megaPanelBorderWidth = normalizeMegaPanelBorderWidth(blockEl.dataset.menuMegaPanelBorderWidth, '1');
  const megaPanelBorderRadius = normalizeMegaPanelBorderRadius(blockEl.dataset.menuMegaPanelBorderRadius, blockEl.dataset.menuMegaPanelRadius || '18');
  const megaPanelRadius = normalizeMegaPanelRadius(blockEl.dataset.menuMegaPanelRadius, '18');
  const megaRadiusCorners = normalizeMegaRadiusCorners(blockEl.dataset.menuMegaRadiusCorners, '1111');
  const megaPanelBlurCornerValues = normalizeMegaCornerValues(blockEl.dataset.menuMegaPanelBlurCornerValues, megaPanelBlurRadius, megaRadiusCorners);
  const megaPanelBorderCornerValues = normalizeMegaCornerValues(blockEl.dataset.menuMegaPanelBorderCornerValues, megaPanelBorderRadius, megaRadiusCorners);
  const megaPanelCornerValues = normalizeMegaCornerValues(blockEl.dataset.menuMegaPanelCornerValues, megaPanelRadius, megaRadiusCorners);
  const megaPanelBlurRadiusShape = normalizeMegaCornerShapeForCss(buildMegaCornerRadiusShapeFromValues(megaPanelBlurCornerValues, megaPanelBlurRadius, megaRadiusCorners), `${megaPanelBlurRadius}px ${megaPanelBlurRadius}px ${megaPanelBlurRadius}px ${megaPanelBlurRadius}px`);
  const megaPanelBorderRadiusShape = normalizeMegaCornerShapeForCss(buildMegaCornerRadiusShapeFromValues(megaPanelBorderCornerValues, megaPanelBorderRadius, megaRadiusCorners), `${megaPanelBorderRadius}px ${megaPanelBorderRadius}px ${megaPanelBorderRadius}px ${megaPanelBorderRadius}px`);
  const megaPanelRadiusShape = normalizeMegaCornerShapeForCss(buildMegaCornerRadiusShapeFromValues(megaPanelCornerValues, megaPanelRadius, megaRadiusCorners), `${megaPanelRadius}px ${megaPanelRadius}px ${megaPanelRadius}px ${megaPanelRadius}px`);
  const megaPanelInnerRadiusShape = normalizeMegaCornerShapeForCss(buildMegaCornerRadiusShapeFromValues(insetMegaCornerValues(megaPanelCornerValues, megaPanelBorderWidth, megaPanelRadius, megaRadiusCorners), megaPanelRadius, megaRadiusCorners), `${Math.max(0, megaPanelRadius - megaPanelBorderWidth)}px ${Math.max(0, megaPanelRadius - megaPanelBorderWidth)}px ${Math.max(0, megaPanelRadius - megaPanelBorderWidth)}px ${Math.max(0, megaPanelRadius - megaPanelBorderWidth)}px`);
  const megaPanelShadowColor = normalizeMegaPanelShadowColor(blockEl.dataset.menuMegaPanelShadowColor, '#000000');
  const megaPanelShadowOpacity = normalizeMegaPanelShadowOpacity(blockEl.dataset.menuMegaPanelShadowOpacity, '42');
  const megaPanelShadowX = normalizeMegaPanelShadowAxis(blockEl.dataset.menuMegaPanelShadowX, '0');
  const megaPanelShadowY = normalizeMegaPanelShadowAxis(blockEl.dataset.menuMegaPanelShadowY, '22');
  const megaPanelShadowBlur = normalizeMegaPanelShadowBlur(blockEl.dataset.menuMegaPanelShadowBlur, '48');
  const megaPanelShadowSpread = normalizeMegaPanelShadowSpread(blockEl.dataset.menuMegaPanelShadowSpread, '0');
  const megaBgSizeMode = normalizeMegaBgSizeMode(blockEl.dataset.menuMegaBgSize);
  const megaBgScale = normalizeMegaBgScale(blockEl.dataset.menuMegaBgScale);
  const megaBgRepeat = normalizeMegaBgRepeat(blockEl.dataset.menuMegaBgRepeat);
  const megaBgPosition = normalizeMegaBgPosition(blockEl.dataset.menuMegaBgPosition);
  const megaBgPosX = normalizeMegaBgPosPercent(blockEl.dataset.menuMegaBgPosX, '50');
  const megaBgPosY = normalizeMegaBgPosPercent(blockEl.dataset.menuMegaBgPosY, '50');
  const megaTitleColor = normalizeMegaTitleColor(blockEl.dataset.menuMegaTitleColor, '#f8fafc');
  const megaTitleSize = normalizeMegaTitleSize(blockEl.dataset.menuMegaTitleSize, '16');
  const megaTitleDividerColor = normalizeMegaTitleDividerColor(blockEl.dataset.menuMegaTitleDividerColor, '#94a3b8');
  const megaTitleDividerOpacity = normalizeMegaTitleDividerOpacity(blockEl.dataset.menuMegaTitleDividerOpacity, '16');
  const megaTitleDividerWidth = normalizeMegaTitleDividerWidth(blockEl.dataset.menuMegaTitleDividerWidth, '1');
  const megaTitleGap = normalizeMegaTitleGap(blockEl.dataset.menuMegaTitleGap, '12');
  const megaLinkColor = normalizeMegaLinkColor(blockEl.dataset.menuMegaLinkColor, '#e2e8f0');
  const megaLinkSize = normalizeMegaLinkSize(blockEl.dataset.menuMegaLinkSize, '15');
  const megaLinkGap = normalizeMegaLinkGap(blockEl.dataset.menuMegaLinkGap, '8');
  const megaLinkPadY = normalizeMegaLinkPadY(blockEl.dataset.menuMegaLinkPadY, '8');
  const megaLinkPadX = normalizeMegaLinkPadX(blockEl.dataset.menuMegaLinkPadX, '10');
  const megaLinkRadius = normalizeMegaLinkRadius(blockEl.dataset.menuMegaLinkRadius, '10');
  const megaLinkHoverColor = normalizeMegaLinkHoverColor(blockEl.dataset.menuMegaLinkHoverColor, '#ffffff');
  const megaLinkHoverBgColor = normalizeMegaLinkHoverBgColor(blockEl.dataset.menuMegaLinkHoverBgColor, '#38bdf8');
  const megaLinkHoverBgOpacity = normalizeMegaLinkHoverBgOpacity(blockEl.dataset.menuMegaLinkHoverBgOpacity, '10');
  const megaPanelBg = hexToRgbaString(megaPanelColor, megaPanelOpacity);
  const megaPanelBorder = hexToRgbaString(megaPanelBorderColor, megaPanelBorderOpacity);
  const megaPanelShadow = `${megaPanelShadowX}px ${megaPanelShadowY}px ${megaPanelShadowBlur}px ${megaPanelShadowSpread}px ${hexToRgbaString(megaPanelShadowColor, megaPanelShadowOpacity)}`;
  const megaPanelSurfaceOpacityValue = String(Math.max(0, Math.min(1, Number(megaPanelSurfaceOpacity) / 100)));
  let megaBgLayer = 'none';
  let megaBgLayerOpacity = '1';
  if (megaBgMode === 'color') {
    const colorWithAlpha = hexToRgbaString(megaBgColor, megaBgOpacity);
    megaBgLayer = `linear-gradient(0deg, ${colorWithAlpha} 0%, ${colorWithAlpha} 100%)`;
  } else if (megaBgMode === 'image') {
    const safeUrl = megaBgImage.replace(/"/g, '\"');
    megaBgLayer = megaBgImage ? `url("${safeUrl}")` : 'none';
    megaBgLayerOpacity = String(Math.max(0, Math.min(1, Number(megaBgOpacity) / 100)));
  } else if (megaBgMode === 'gradient') {
    megaBgLayer = `linear-gradient(${megaBgAngle}deg, ${hexToRgbaString(megaBgGradient1, megaBgOpacity)} 0%, ${hexToRgbaString(megaBgGradient2, megaBgOpacity)} 50%, ${hexToRgbaString(megaBgGradient3, megaBgOpacity)} 100%)`;
  }
  const megaBgSizeValue = megaBgSizeMode === 'custom' ? `${megaBgScale}%` : megaBgSizeMode;
  const megaBgPositionValue = megaBgPosition === 'custom' ? `${megaBgPosX}% ${megaBgPosY}%` : megaBgPosition;
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-bg', megaPanelBg);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-surface-opacity', megaPanelSurfaceOpacityValue);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-blur', `${megaPanelBlur}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-blur-radius', `${megaPanelBlurRadius}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-blur-radius-shape', megaPanelBlurRadiusShape);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-border-color', megaPanelBorder);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-border-width', `${megaPanelBorderWidth}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-border-radius', `${megaPanelBorderRadius}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-border-radius-shape', megaPanelBorderRadiusShape);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-radius', `${megaPanelRadius}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-radius-shape', megaPanelRadiusShape);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-inner-radius-shape', megaPanelInnerRadiusShape);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-panel-shadow', megaPanelShadow);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-base', 'transparent');
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-layer', megaBgLayer);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-layer-opacity', megaBgLayerOpacity);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-layer-effective-opacity', String(Math.max(0, Math.min(1, Number(megaBgLayerOpacity) * Number(megaPanelSurfaceOpacityValue)))));
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-size', megaBgSizeValue);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-repeat', megaBgRepeat);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-bg-position', megaBgPositionValue);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-title-color', megaTitleColor);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-title-size', `${megaTitleSize}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-title-divider-color', hexToRgbaString(megaTitleDividerColor, megaTitleDividerOpacity));
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-title-divider-width', `${megaTitleDividerWidth}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-title-gap', `${megaTitleGap}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-color', megaLinkColor);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-size', `${megaLinkSize}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-gap', `${megaLinkGap}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-py', `${megaLinkPadY}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-px', `${megaLinkPadX}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-radius', `${megaLinkRadius}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-hover-color', megaLinkHoverColor);
  setBlockStyleProp00438_(blockEl, '--st-menu-mega-link-hover-bg', hexToRgbaString(megaLinkHoverBgColor, megaLinkHoverBgOpacity));
  setBlockStyleProp00438_(blockEl, '--st-menu-level3-offset-x', `${blockEl.dataset.menuLevel3OffsetX}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-level3-offset-y', `${blockEl.dataset.menuLevel3OffsetY}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-level3-minw', `${blockEl.dataset.menuLevel3MinWidth}px`);
  setBlockStyleProp00438_(blockEl, '--st-menu-level3-customw', `${blockEl.dataset.menuLevel3CustomWidth}px`);
  setTimeout(() => debugMegaPanelState(blockEl, 'applyMenuRuntimeStyles', {
    megaBgMode,
    megaPanelBorderColor,
    megaPanelBorderOpacity,
    megaPanelBorderWidth,
    megaPanelBorderRadius,
    megaPanelRadius,
  }), 0);
  applyMenuLevelStylesRuntime(blockEl, data?.levelStyles, data?.levelHoverStyles, data?.levelOpenStyles, data?.levelCurrentStyles);
  applyMenuLevelContainerStylesRuntime(blockEl, data?.levelContainerStyles, data?.levelContainerHoverStyles, data?.levelContainerOpenStyles, data?.levelContainerCurrentStyles);
  applyMenuLevelContentLayoutRuntime(blockEl, data?.levelContentLayoutStyles);
  applyMenuRootLayoutRuntime(blockEl);
  applyMenuArrowStylesRuntime(blockEl, data?.levelArrowStyles, data?.levelArrowHoverStyles, data?.levelArrowOpenStyles);
  if (blockEl.dataset.menuSubmenuMode === 'hidden') closeAllMenuBranches(blockEl);
  bindMenuInteractions(blockEl);
  try {
    requestAnimationFrame(() => refreshMenuLevel3Positions(blockEl));
  } catch (_) {
    refreshMenuLevel3Positions(blockEl);
  }
}



// [00438][PERFORMANCE]
// Menu widgets often re-apply the same CSS variables on every live input.
// Avoid touching style attribute when the value did not actually change;
// this directly reduces MutationObserver bursts in Header/Footer slots.
function setBlockStyleProp00438_(blockEl, name, value) {
  try {
    if (!(blockEl instanceof HTMLElement)) return;
    const prop = String(name || '');
    const next = String(value ?? '');
    if (blockEl.style.getPropertyValue(prop) === next) return;
    blockEl.style.setProperty(prop, next);
  } catch (_) {}
}

function removeBlockStyleProp00438_(blockEl, name) {
  try {
    if (!(blockEl instanceof HTMLElement)) return;
    const prop = String(name || '');
    if (!blockEl.style.getPropertyValue(prop)) return;
    blockEl.style.removeProperty(prop);
  } catch (_) {}
}

function normalizeMenuCurrentToken(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '#') return '';
  try {
    const u = new URL(raw, window.location.href);
    const path = String(u.pathname || '/').replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const hash = String(u.hash || '').trim();
    const search = String(u.search || '').trim();
    return `${path}${search}${hash}`.toLowerCase();
  } catch (_) {
    const clean = raw.replace(/\/+/g, '/').replace(/\/$/, '') || raw;
    return clean.toLowerCase();
  }
}

function getMenuCurrentCandidates() {
  const out = new Set();
  const add = (v) => {
    const token = normalizeMenuCurrentToken(v);
    if (!token) return;
    out.add(token);
    if (token.startsWith('/') && token.length > 1) out.add(token.slice(1));
  };
  try {
    add(window.location.href || '');
    add(`${window.location.pathname || '/'}${window.location.search || ''}${window.location.hash || ''}`);
    add(`${window.location.pathname || '/'}${window.location.hash || ''}`);
    add(window.location.pathname || '/');
    add(window.location.hash || '');
  } catch (_) {}
  try {
    [
      'st_current_page_id',
      'st_current_page_slug',
      'st_current_page_name',
      'st_current_page_title',
      'st_current_page_label',
    ].forEach((key) => {
      const val = localStorage.getItem(key);
      if (!val) return;
      add(val);
      add(`/${val}`);
      add(`#${val}`);
    });
  } catch (_) {}
  return out;
}

function isMenuHrefCurrent(href, currentCandidates) {
  const token = normalizeMenuCurrentToken(href);
  if (!token) return false;
  const set = (currentCandidates instanceof Set) ? currentCandidates : getMenuCurrentCandidates();
  if (set.has(token)) return true;
  if (token.startsWith('/') && set.has(token.slice(1))) return true;
  return false;
}

function megaShowModeDebug(...args) {
  try { console.log('[ST][Mega ShowMode]', ...args); } catch (_) {}
}

function megaShowModeDebugGroup(label, payload) {
  try {
    console.groupCollapsed(`[ST][Mega ShowMode] ${label}`);
    if (payload !== undefined) console.log(payload);
    console.trace();
    console.groupEnd();
  } catch (_) {}
}


function getMegaSublistDisplayValue(subEl) {
  if (!(subEl instanceof HTMLElement)) return 'flex';
  if (subEl.classList.contains('st-menu__mega')) return 'grid';
  return 'flex';
}

function getMegaManagedSublist(itemEl) {
  if (!(itemEl instanceof HTMLElement)) return null;
  const direct = itemEl.querySelector(':scope > .st-menu__sublist');
  if (direct instanceof HTMLElement) return direct;

  const path = String(itemEl.dataset?.menuPath || '').trim();
  if (!path) return null;

  const parent = itemEl.parentElement;
  if (parent instanceof HTMLElement) {
    const sharedArea = Array.from(parent.children || []).find((node) => {
      if (!(node instanceof HTMLElement)) return false;
      return node.classList.contains('st-menu__item--mega-shared-area')
        || node.classList.contains('st-menu__item--mega-branch-shared-area');
    });
    if (sharedArea instanceof HTMLElement) {
      const owned = Array.from(sharedArea.querySelectorAll(':scope > .st-menu__sublist[data-menu-owner-path]'))
        .find((el) => el instanceof HTMLElement && String(el.dataset?.menuOwnerPath || '') === path);
      if (owned instanceof HTMLElement) return owned;
    }
  }

  const megaRoot = itemEl.closest?.('.st-menu__mega');
  if (!(megaRoot instanceof HTMLElement)) return null;
  return Array.from(megaRoot.querySelectorAll('.st-menu__sublist[data-menu-owner-path]'))
    .find((el) => el instanceof HTMLElement && String(el.dataset?.menuOwnerPath || '') === path) || null;
}

function isMegaContentOwnerChainOpen(itemEl) {
  if (!(itemEl instanceof HTMLElement)) return true;
  const megaRoot = itemEl.closest?.('.st-menu__mega');
  if (!(megaRoot instanceof HTMLElement)) return true;
  const path = String(itemEl.dataset?.menuPath || '').trim();
  if (!path) return true;
  const parts = path.split('.').filter(Boolean);
  if (parts.length <= 1) return true;
  for (let i = 1; i < parts.length; i += 1) {
    const ownerPath = parts.slice(0, i).join('.');
    if (!ownerPath) continue;
    const ownerItem = megaRoot.querySelector(`.st-menu__item[data-menu-path="${ownerPath}"]`);
    if (!(ownerItem instanceof HTMLElement)) continue;
    if (String(ownerItem.dataset?.menuDisplayMode || '') === 'content' && !ownerItem.classList.contains('is-open')) {
      return false;
    }
  }
  return true;
}

function setMegaSublistVisible(itemEl, visible) {
  if (!(itemEl instanceof HTMLElement)) return;
  const subEl = getMegaManagedSublist(itemEl);
  const syncSharedSurfaceState = (openOn, currentOn) => {
    const host = subEl?.parentElement;
    if (!(host instanceof HTMLElement)) return;
    if (!host.classList.contains('st-menu__item--mega-shared-area') && !host.classList.contains('st-menu__item--mega-branch-shared-area')) return;
    host.classList.toggle('st-menu__sublist--owner-open', !!openOn);
    host.classList.toggle('st-menu__sublist--owner-current', !!currentOn);
  };
  if (!(subEl instanceof HTMLElement)) {
    megaShowModeDebug('setMegaSublistVisible: no direct sublist', {
      path: itemEl.dataset?.menuPath || '',
      depth: itemEl.dataset?.menuDepth || '',
      mode: itemEl.dataset?.menuDisplayMode || '',
      classes: itemEl.className || ''
    });
    return;
  }
  const shouldShow = !!visible && isMegaContentOwnerChainOpen(itemEl);
  if (!shouldShow) {
    subEl.classList.remove('st-menu__sublist--owner-open', 'st-menu__sublist--owner-current');
    syncSharedSurfaceState(false, false);
    subEl.style.setProperty('display', 'none', 'important');
    const itemPath = String(itemEl.dataset?.menuPath || '').trim();
    const megaRoot = itemEl.closest?.('.st-menu__mega');
    if (itemPath && megaRoot instanceof HTMLElement) {
      Array.from(megaRoot.querySelectorAll('.st-menu__item[data-menu-path]')).forEach((descendant) => {
        if (!(descendant instanceof HTMLElement) || descendant === itemEl) return;
        const descendantPath = String(descendant.dataset?.menuPath || '').trim();
        if (!descendantPath || !descendantPath.startsWith(`${itemPath}.`)) return;
        const nestedSub = getMegaManagedSublist(descendant);
        if (nestedSub instanceof HTMLElement) nestedSub.style.setProperty('display', 'none', 'important');
      });
    }
    megaShowModeDebug('setMegaSublistVisible hide', {
      path: itemEl.dataset?.menuPath || '',
      depth: itemEl.dataset?.menuDepth || '',
      mode: itemEl.dataset?.menuDisplayMode || '',
      subClass: subEl.className || '',
      resultingDisplay: subEl.style.getPropertyValue('display') || '',
      requestedVisible: !!visible,
      shouldShow
    });
    return;
  }
  const displayValue = getMegaSublistDisplayValue(subEl);
  const ownerOpen = itemEl.classList.contains('is-open');
  const ownerCurrent = itemEl.classList.contains('st-menu__item--current');
  subEl.classList.toggle('st-menu__sublist--owner-open', ownerOpen);
  subEl.classList.toggle('st-menu__sublist--owner-current', ownerCurrent);
  syncSharedSurfaceState(ownerOpen, ownerCurrent);
  subEl.style.setProperty('display', displayValue, 'important');
  if (displayValue == 'flex') subEl.style.setProperty('flex-direction', 'column');
  else subEl.style.removeProperty('flex-direction');
  megaShowModeDebug('setMegaSublistVisible show', {
    path: itemEl.dataset?.menuPath || '',
    depth: itemEl.dataset?.menuDepth || '',
    mode: itemEl.dataset?.menuDisplayMode || '',
    subClass: subEl.className || '',
    displayValue
  });
}

function enforceMegaDisplayModes(blockEl, data) {
  if (!(blockEl instanceof HTMLElement)) return;
  if (normalizeSubmenuView(blockEl.dataset.menuSubmenuView || data?.submenuView) !== 'mega') return;

  megaShowModeDebugGroup('enforceMegaDisplayModes:start', {
    submenuView: blockEl.dataset.menuSubmenuView || data?.submenuView || '',
    settingsMode: blockEl.dataset.menuSettingsMode || '',
    mode: blockEl.dataset.menuSubmenuMode || '',
    allCount: blockEl.querySelectorAll(`.st-menu__item[data-menu-display-mode="all"]`).length,
    contentCount: blockEl.querySelectorAll(`.st-menu__item--has-children[data-menu-display-mode="content"]`).length
  });

  // 1) explicit all-mode: always show child content
  blockEl.querySelectorAll('.st-menu__item[data-menu-display-mode="all"]').forEach((itemEl) => {
    setMegaSublistVisible(itemEl, true);
    const ownLink = itemEl.querySelector(':scope > .st-menu__link[aria-expanded]');
    if (ownLink instanceof HTMLElement) ownLink.setAttribute('aria-expanded', 'true');
  });

  // 2) content-mode: keep one winner per siblings group
  const groups = new Map();
  blockEl.querySelectorAll('.st-menu__item--has-children[data-menu-display-mode="content"]').forEach((itemEl) => {
    const parent = itemEl.parentElement;
    if (!(parent instanceof HTMLElement)) return;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(itemEl);
  });
  groups.forEach((items, parent) => {
    if (!Array.isArray(items) || !items.length) return;
    const lastWinnerPath = String(parent?.dataset?.menuLastWinnerPath || '').trim();
    const winner = (lastWinnerPath ? items.find((item) => String(item.dataset?.menuPath || '') === lastWinnerPath) : null)
      || items.find((item) => item.dataset?.menuLastInteracted === '1')
      || items.find((item) => item.classList.contains('is-open'))
      || items.find((item) => item.classList.contains('st-menu__item--current'))
      || items[0];
    megaShowModeDebug('content-group', {
      parentClass: parent?.className || '',
      items: items.map((item) => ({
        path: item.dataset?.menuPath || '',
        depth: item.dataset?.menuDepth || '',
        isOpen: item.classList.contains('is-open'),
        isCurrent: item.classList.contains('st-menu__item--current'),
        mode: item.dataset?.menuDisplayMode || ''
      })),
      winnerPath: winner?.dataset?.menuPath || '',
      lastWinnerPath
    });
    items.forEach((item) => {
      const ownLink = item.querySelector(':scope > .st-menu__link[aria-expanded]');
      const isWinner = item === winner;
      if (isWinner) {
        item.classList.add('is-open');
        if (ownLink instanceof HTMLElement) ownLink.setAttribute('aria-expanded', 'true');
      } else {
        item.classList.remove('is-open');
        if (ownLink instanceof HTMLElement) ownLink.setAttribute('aria-expanded', 'false');
      }
      setMegaSublistVisible(item, isWinner);
    });
  });
}

function renderMenuLinks(blockEl, data) {
  if (!blockEl) return;
  const resolveMegaRootFromList = (listEl) => {
    if (!(listEl instanceof HTMLElement)) return null;
    return listEl.closest?.('.st-menu__mega') || listEl.__stMegaRoot || null;
  };
  // Ensure menu marker is present (used by Fill/Border/Shadow/Rad widgets).
  if (!blockEl.hasAttribute('data-st-menu')) blockEl.setAttribute('data-st-menu', '1');
  const preservedOpenPaths = (() => {
    const live = captureOpenMenuPaths(blockEl);
    if (live.length) return live;
    return getPersistedOpenMenuPaths(blockEl);
  })();
  applyMenuRuntimeState(blockEl, data);
  const list = blockEl.querySelector('.st-menu__list');
  if (!list) return;
  list.innerHTML = '';
  const levelContainerStyles = normalizeLevelStyles(data?.levelContainerStyles);
  const levelContainerHoverStyles = normalizeLevelStyles(data?.levelContainerHoverStyles);
  const levelContainerOpenStyles = normalizeLevelStyles(data?.levelContainerOpenStyles);
  const levelContainerCurrentStyles = normalizeLevelStyles(data?.levelContainerCurrentStyles);
  const levelContainerStateMaps = { hover: levelContainerHoverStyles, open: levelContainerOpenStyles, current: levelContainerCurrentStyles };
  const levelContentLayoutStyles = normalizeLevelContentLayoutStyles(data?.levelContentLayoutStyles);
  const getLevelDisplayMode = (level) => normalizeLevelDisplayMode(getLevelContentLayoutStyle(levelContentLayoutStyles, level).showMode, 'all');
  applyListContainerStyle(list, levelContainerStyles, 1, levelContainerStateMaps);

  const defaultIconSvg = sanitizeMenuIconSvg(data.iconSvg || '');
  const iconPos = (data.iconPos === 'after') ? 'after' : 'before';
  const caretSvg = `<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>`;

  const ensureMegaSharedArea = (megaRoot, role, level) => {
    if (!(megaRoot instanceof HTMLElement)) return null;
    const safeRole = String(role || '').trim();
    const safeLevel = Math.max(1, Number(level) || 1);
    const registry = megaRoot.__stSharedAreas && typeof megaRoot.__stSharedAreas === 'object'
      ? megaRoot.__stSharedAreas
      : null;
    let area = registry && registry[safeRole] instanceof HTMLElement
      ? registry[safeRole]
      : null;
    if (!(area instanceof HTMLElement)) {
      area = Array.from(megaRoot.children || []).find((node) => {
        if (!(node instanceof HTMLElement)) return false;
        return node.classList.contains('st-menu__item--mega-shared-area')
          && String(node.dataset?.menuSharedAreaRole || '') === safeRole;
      }) || null;
    }
    if (!(area instanceof HTMLElement)) {
      area = document.createElement('li');
      area.className = `st-menu__item st-menu__item--mega-shared-area st-menu__item--mega-shared-area-level${safeLevel}`;
      area.dataset.menuDepth = '2';
      area.dataset.menuSharedArea = '1';
      area.dataset.menuSharedAreaRole = safeRole;
      applyListContainerStyle(area, levelContainerStyles, safeLevel, levelContainerStateMaps);
      megaRoot.appendChild(area);
    }
    if (registry) registry[safeRole] = area;
    return area;
  };

  const buildLink = (it, hasChildren = false) => {
    const a = document.createElement('a');
    // Make each menu item selectable as a "block" so the global design widgets can target it.
    a.className = 'st-menu__link st-block st-block--menu-item';
    if (hasChildren) a.classList.add('st-menu__link--has-children');
    a.setAttribute('data-st-menu-item', '1');
    a.href = it.href || '#';
    a.setAttribute('data-st-menu-href', it.href || '');
    a.setAttribute('data-st-menu-text', it.text || '');
    if (hasChildren) {
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');
    }

    const textSpan = document.createElement('span');
    textSpan.className = 'st-menu__text';
    textSpan.textContent = it.text || 'Link';

    const iconSvg = sanitizeMenuIconSvg(it.iconSvg || defaultIconSvg || '');
    if (iconSvg) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'st-menu__icon';
      iconSpan.innerHTML = iconSvg;
      // Робимо SVG керованим через currentColor
      const svg = iconSpan.querySelector('svg');
      if (svg) {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('aria-hidden', 'true');
      }

      if (iconPos === 'after') {
        a.appendChild(textSpan);
        a.appendChild(iconSpan);
      } else {
        a.appendChild(iconSpan);
        a.appendChild(textSpan);
      }
    } else {
      a.appendChild(textSpan);
    }

    if (hasChildren) {
      const caret = document.createElement('span');
      caret.className = 'st-menu__caret';
      caret.innerHTML = caretSvg;
      a.appendChild(caret);
    }

    return a;
  };

  const currentCandidates = getMenuCurrentCandidates();

  const renderTree = (parentUl, items, depth = 0, prefix = '') => {
    const MAX_DEPTH = 10;
    const safeItems = normalizeMenuItems(items || [], depth);
    for (let i = 0; i < safeItems.length; i += 1) {
      const it = safeItems[i];
      const pathStr = prefix ? `${prefix}.${i}` : `${i}`;
      const li = document.createElement('li');
      li.className = 'st-menu__item';
      li.dataset.menuDepth = String(depth + 1);
      li.dataset.menuPath = pathStr;

      const kids = Array.isArray(it.children) ? it.children : [];
      const hasChildren = kids.length > 0 && depth < MAX_DEPTH - 1;
      if (hasChildren) li.classList.add('st-menu__item--has-children');
      const linkEl = buildLink(it, hasChildren);
      if (isMenuHrefCurrent(it?.href || '', currentCandidates)) {
        li.classList.add('st-menu__item--current');
        try { linkEl.setAttribute('aria-current', 'page'); } catch (_) {}
      }
      li.appendChild(linkEl);

      if (hasChildren) {
        if (normalizeSubmenuView(data?.submenuView) === 'mega' && depth === 0) {
          const mega = document.createElement('ul');
          mega.className = 'st-menu__list st-menu__sublist st-menu__mega';
          applyListContainerStyle(mega, levelContainerStyles, depth + 2, levelContainerStateMaps);

          const safeKids = normalizeMenuItems(kids, depth + 1);
          const megaColsMode = normalizeMegaColsMode(data?.menuMegaCols);
          const megaColsCustom = normalizeMegaColsCustom(data?.menuMegaColsCustom);
          const megaGap = Number(normalizeMegaColGap(data?.menuMegaGap));
          const megaColMinW = Number(normalizeMegaColMinWidth(data?.menuMegaColMinWidth));
          const colsCount = megaColsMode === 'auto'
            ? Math.max(1, safeKids.length)
            : Math.max(1, Number(megaColsMode === 'custom' ? megaColsCustom : megaColsMode));
          const level2DisplayMode = getLevelDisplayMode(depth + 2);
          const effectiveColsCount = level2DisplayMode === 'content' ? Math.max(colsCount, 3) : colsCount;
          const panelMinW = Math.max(
            640,
            (effectiveColsCount * megaColMinW) + (Math.max(0, effectiveColsCount - 1) * megaGap) + 56
          );
          mega.style.minWidth = `${panelMinW}px`;
          if (level2DisplayMode === 'content') {
            mega.style.gridTemplateColumns = `repeat(${effectiveColsCount}, minmax(${megaColMinW}px, 1fr))`;
          }
          const sharedArea = level2DisplayMode === 'content' ? document.createElement('li') : null;
          const sharedLevel4Area = level2DisplayMode === 'content' ? document.createElement('li') : null;
          const sharedLevel5Area = level2DisplayMode === 'content' ? document.createElement('li') : null;
          if (sharedArea) {
            sharedArea.className = 'st-menu__item st-menu__item--mega-shared-area st-menu__item--mega-shared-area-level3';
            sharedArea.dataset.menuDepth = String(depth + 2);
            sharedArea.dataset.menuSharedArea = '1';
            sharedArea.dataset.menuSharedAreaRole = 'level3';
            applyListContainerStyle(sharedArea, levelContainerStyles, depth + 3, levelContainerStateMaps);
          }
          if (sharedLevel4Area) {
            sharedLevel4Area.className = 'st-menu__item st-menu__item--mega-shared-area st-menu__item--mega-shared-area-level4';
            sharedLevel4Area.dataset.menuDepth = String(depth + 2);
            sharedLevel4Area.dataset.menuSharedArea = '1';
            sharedLevel4Area.dataset.menuSharedAreaRole = 'level4';
            applyListContainerStyle(sharedLevel4Area, levelContainerStyles, depth + 4, levelContainerStateMaps);
          }
          if (sharedLevel5Area) {
            sharedLevel5Area.className = 'st-menu__item st-menu__item--mega-shared-area st-menu__item--mega-shared-area-level5';
            sharedLevel5Area.dataset.menuDepth = String(depth + 2);
            sharedLevel5Area.dataset.menuSharedArea = '1';
            sharedLevel5Area.dataset.menuSharedAreaRole = 'level5';
            applyListContainerStyle(sharedLevel5Area, levelContainerStyles, depth + 5, levelContainerStateMaps);
          }
          mega.__stSharedAreas = { level3: sharedArea, level4: sharedLevel4Area, level5: sharedLevel5Area };
          for (let j = 0; j < safeKids.length; j += 1) {
            const kid = safeKids[j];
            const kidPath = `${pathStr}.${j}`;
            const col = document.createElement('li');
            col.className = 'st-menu__item st-menu__item--mega-col';
            col.dataset.menuDepth = String(depth + 2);
            col.dataset.menuPath = kidPath;

            const grandKids = Array.isArray(kid.children) ? kid.children : [];
            const colDisplayMode = getLevelDisplayMode(depth + 2);
            const colHasChildren = grandKids.length > 0;
            if (colHasChildren) {
              col.dataset.menuDisplayMode = colDisplayMode;
              if (colDisplayMode === 'content') {
                col.classList.add('st-menu__item--has-children');
              }
            }
            const titleLink = buildLink(kid, colHasChildren && colDisplayMode === 'content');
            titleLink.classList.add('st-menu__mega-title');
            if (isMenuHrefCurrent(kid?.href || '', currentCandidates)) {
              col.classList.add('st-menu__item--current');
              try { titleLink.setAttribute('aria-current', 'page'); } catch (_) {}
            }
            col.appendChild(titleLink);

            if (grandKids.length) {
              megaShowModeDebug('render mega column', {
                path: kidPath,
                depth: depth + 2,
                displayMode: colDisplayMode,
                hasChildren: colHasChildren,
                grandKids: grandKids.length
              });
              const links = document.createElement('ul');
              links.className = 'st-menu__list st-menu__sublist st-menu__mega-links';
              links.dataset.menuDepth = String(depth + 3);
              links.dataset.menuListDepth = String(depth + 3);
              links.dataset.menuBranchMode = colDisplayMode;
              links.dataset.menuOwnerPath = kidPath;
              applyListContainerStyle(links, levelContainerStyles, depth + 3, levelContainerStateMaps);
              const safeGrandKids = normalizeMenuItems(grandKids, depth + 2);
              let branchSharedArea = null;
              const useMegaLevel4SharedArea = colDisplayMode === 'content' && (sharedLevel4Area instanceof HTMLElement);
              if (useMegaLevel4SharedArea) {
                links.classList.add('st-menu__mega-links--with-external-branch');
                links.dataset.menuInMegaLevel4Shared = '1';
              } else {
                delete links.dataset.menuInMegaLevel4Shared;
              }
              const ensureBranchSharedArea = () => {
                if (branchSharedArea instanceof HTMLElement) return branchSharedArea;
                branchSharedArea = document.createElement('li');
                branchSharedArea.className = 'st-menu__item st-menu__item--mega-branch-shared-area';
                branchSharedArea.dataset.menuDepth = String(depth + 4);
                branchSharedArea.dataset.menuSharedArea = '1';
                applyListContainerStyle(branchSharedArea, levelContainerStyles, depth + 4, levelContainerStateMaps);
                links.classList.add('st-menu__mega-links--with-branch');
                return branchSharedArea;
              };
              for (let k = 0; k < safeGrandKids.length; k += 1) {
                const gk = safeGrandKids[k];
                const gkPath = `${kidPath}.${k}`;
                const linkItem = document.createElement('li');
                linkItem.className = 'st-menu__item st-menu__item--mega-link';
                linkItem.dataset.menuDepth = String(depth + 3);
                linkItem.dataset.menuPath = gkPath;
                const greatKids = Array.isArray(gk.children) ? gk.children : [];
                const deepDisplayMode = getLevelDisplayMode(depth + 3);
                const hasGreatKids = greatKids.length > 0 && (depth + 3) < MAX_DEPTH;
                if (hasGreatKids) {
                  megaShowModeDebug('render mega link branch', {
                    path: gkPath,
                    depth: depth + 3,
                    displayMode: deepDisplayMode,
                    greatKids: greatKids.length
                  });
                  linkItem.dataset.menuDisplayMode = deepDisplayMode;
                  if (deepDisplayMode === 'content') {
                    linkItem.classList.add('st-menu__item--has-children');
                  }
                }
                const megaLink = buildLink(gk, hasGreatKids && deepDisplayMode === 'content');
                if (isMenuHrefCurrent(gk?.href || '', currentCandidates)) {
                  linkItem.classList.add('st-menu__item--current');
                  try { megaLink.setAttribute('aria-current', 'page'); } catch (_) {}
                }
                linkItem.appendChild(megaLink);
                if (hasGreatKids) {
                  const deepList = document.createElement('ul');
                  deepList.className = 'st-menu__list st-menu__sublist st-menu__mega-branch';
                  deepList.dataset.menuBranchMode = deepDisplayMode;
                  deepList.dataset.menuOwnerPath = gkPath;
                  deepList.__stMegaRoot = mega;
                  if (useMegaLevel4SharedArea) {
                    deepList.dataset.menuInMegaLevel4Shared = '1';
                  } else {
                    delete deepList.dataset.menuInMegaLevel4Shared;
                  }
                  applyListContainerStyle(deepList, levelContainerStyles, depth + 4, levelContainerStateMaps);
                  renderTree(deepList, greatKids, depth + 3, gkPath);
                  if (deepDisplayMode === 'content') {
                    linkItem.dataset.menuSharedTarget = useMegaLevel4SharedArea ? 'mega-level4' : '1';
                    deepList.style.setProperty('display', 'none', 'important');
                    if (useMegaLevel4SharedArea) {
                      sharedLevel4Area.appendChild(deepList);
                    } else {
                      ensureBranchSharedArea().appendChild(deepList);
                    }
                  } else {
                    linkItem.appendChild(deepList);
                  }
                }
                links.appendChild(linkItem);
              }
              if (branchSharedArea instanceof HTMLElement && branchSharedArea.children.length) {
                links.appendChild(branchSharedArea);
              }
              if (colDisplayMode === 'content' && sharedArea instanceof HTMLElement) {
                col.dataset.menuSharedTarget = '1';
                sharedArea.appendChild(links);
              } else {
                col.appendChild(links);
              }
            }

            mega.appendChild(col);
          }
          if (sharedArea instanceof HTMLElement && sharedArea.children.length) mega.appendChild(sharedArea);
          if (sharedLevel4Area instanceof HTMLElement && sharedLevel4Area.children.length) mega.appendChild(sharedLevel4Area);
          if (sharedLevel5Area instanceof HTMLElement && sharedLevel5Area.children.length) mega.appendChild(sharedLevel5Area);

          li.appendChild(mega);
        } else {
          const megaRoot = resolveMegaRootFromList(parentUl);
          const itemLevel = depth + 1;
          const isInMegaLevel4SharedColumn = megaRoot instanceof HTMLElement
            && (parentUl.closest?.('.st-menu__item--mega-shared-area-level4') instanceof HTMLElement
              || String(parentUl.dataset?.menuInMegaLevel4Shared || '') === '1');
          const configuredChildDisplayMode = megaRoot instanceof HTMLElement ? getLevelDisplayMode(itemLevel) : 'all';
          const childDisplayMode = configuredChildDisplayMode;
          const useMegaLevel5SharedArea = megaRoot instanceof HTMLElement && itemLevel === 4 && isInMegaLevel4SharedColumn;
          if (megaRoot instanceof HTMLElement && hasChildren) {
            li.dataset.menuDisplayMode = childDisplayMode;
          }
          const sub = document.createElement('ul');
          sub.className = 'st-menu__list st-menu__sublist';
          if (megaRoot instanceof HTMLElement) sub.__stMegaRoot = megaRoot;
          applyListContainerStyle(sub, levelContainerStyles, depth + 2, levelContainerStateMaps);
          renderTree(sub, kids, depth + 1, pathStr);
          if (useMegaLevel5SharedArea) {
            sub.classList.add('st-menu__mega-branch', 'st-menu__mega-branch--level5');
            sub.dataset.menuBranchMode = childDisplayMode;
            sub.dataset.menuOwnerPath = pathStr;
            li.dataset.menuSharedTarget = 'mega-level5';
            sub.style.setProperty('display', 'none', 'important');
            const sharedLevel5Area = ensureMegaSharedArea(megaRoot, 'level5', 5);
            if (sharedLevel5Area instanceof HTMLElement) sharedLevel5Area.appendChild(sub);
            else li.appendChild(sub);
          } else {
            li.appendChild(sub);
          }
        }
      }

      parentUl.appendChild(li);
    }
  };


  renderTree(list, data.items || [], 0, '');
  applyMenuLevelContentLayoutRuntime(blockEl, data?.levelContentLayoutStyles);
  restoreOpenMenuPaths(blockEl, preservedOpenPaths);
  enforceMegaDisplayModes(blockEl, data);
  persistOpenMenuPaths(blockEl);
}


function dispatchInsertMenu(variant, insertMode = 'block') {
  const detail = {
    variant: variant === 'burger' ? 'burger' : 'big',
    insertMode: insertMode === 'nav-row' ? 'nav-row' : 'block'
  };
  try {
    if (isHeaderMode()) window.dispatchEvent(new CustomEvent('st:header-insert:menu:add', { detail }));
    else if (isFooterMode()) window.dispatchEvent(new CustomEvent('st:footer-insert:menu:add', { detail }));
  } catch (_) {}
}

function dispatchTuneMenu() {
  try { window.dispatchEvent(new CustomEvent('st:header-insert:menu:tune')); } catch (_) {}
  try { window.dispatchEvent(new CustomEvent('st:design:focus-menu-widget')); } catch (_) {}
}

function clearDesignSoloFilters() {
  try {
    document.body.classList.remove('st-hb-menu-only-on');
    document.body.classList.remove('st-hb-text-only-on');
    document.body.classList.remove('st-hb-icon-only-on');
  } catch (_) {}
}

function showAllDesignSections() {
  try {
    clearDesignSoloFilters();
    const designPanel = document.getElementById('design-panel') || document.querySelector('#design-panel');
    if (!designPanel) return [];
    const sections = Array.from(designPanel.querySelectorAll('.design-section'));
    sections.forEach((sec) => {
      try { sec.style.display = ''; } catch (_) {}
    });
    return sections;
  } catch (_) {}
  return [];
}

function openDesignSectionByTitle(title) {
  try {
    const sections = showAllDesignSections();
    if (!sections.length) return null;
    const wanted = String(title || '').trim();
    const sec = sections.find((section) => {
      const label = section.querySelector('.design-section__header-title span') || section.querySelector('.design-section__header-title');
      const txt = String(label?.textContent || '').trim();
      return txt === wanted;
    }) || null;
    if (!sec) return null;

    sec.classList.add('is-open');
    const body = sec.querySelector('.design-section__body');
    if (body) {
      body.hidden = false;
      body.style.display = '';
    }
    const header = sec.querySelector('.design-section__header');
    if (header) header.setAttribute('aria-expanded', 'true');

    const focusEl = sec.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusEl) {
      try { focusEl.focus(); } catch (_) {}
    }
    try { sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (_) {}
    return sec;
  } catch (_) {}
  return null;
}

function buildRow(label, innerHtml) {
  const row = document.createElement('div');
  row.className = 'st-hfmenu-row';
  row.innerHTML = `
    <div class="st-hfmenu-row__label">${label}</div>
    <div class="st-hfmenu-row__ctrl">${innerHtml}</div>
  `.trim();
  return row;
}

function buildStackedRangeControl({ act, min, max, step = '1', value = '', numberRole = '', valueRole = '', unit = '' }) {
  const numRole = numberRole || `${act}-num`;
  const valRole = valueRole || `${act}-val`;
  const displayValue = value === '' ? '' : `${value}${unit}`;
  return `
    <div class="st-hfmenu-stackrange">
      <input class="st-inp st-hfmenu-stackrange__num" type="number" min="${min}" max="${max}" step="${step}" value="${value}" data-role="${numRole}" />
      <input class="st-inp st-hfmenu-stackrange__range" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-act="${act}" />
      <span class="st-hfmenu-range__val st-hfmenu-range__val--ghost" data-role="${valRole}">${displayValue}</span>
    </div>
  `.trim();
}

function bindStackedRangePair(rangeInput, numberInput, normalizeValue) {
  if (!(rangeInput instanceof HTMLElement) || !(numberInput instanceof HTMLElement)) return;
  const syncFromRange = () => {
    numberInput.value = String(rangeInput.value ?? '');
  };
  syncFromRange();
  rangeInput.addEventListener('input', syncFromRange);
  numberInput.addEventListener('input', () => {
    const raw = numberInput.value;
    const next = typeof normalizeValue === 'function' ? normalizeValue(raw) : String(raw);
    if (next === '') return;
    rangeInput.value = String(next);
    numberInput.value = String(next);
    rangeInput.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function initHeaderFooterMenuWidget(host, getSelection) {
  if (!host) return;
  if (host.querySelector(`#${CSS.escape(SEC_ID)}`)) return;

  const sectionEl = document.createElement('section');
  sectionEl.className = 'design-section';
  sectionEl.id = SEC_ID;

  sectionEl.innerHTML = `
    <button class="design-section__header" type="button" aria-expanded="false">
      <div class="design-section__header-title"><span>Меню</span><span class="st-hfmenu-headnote" data-st-hfmenu-headnote></span></div>
      <span class="design-section__chevron">▶</span>
    </button>
    <div class="design-section__body">
      <div class="st-hfmenu-card" data-st-hfmenu-insert-card>
        <div class="st-hfmenu-card__head">
          <div class="st-hfmenu-title" data-st-hfmenu-insert-title>Вставка меню</div>
          <div class="st-hfmenu-badge" data-st-hfmenu-insert-badge>—</div>
        </div>

        <div class="st-hfmenu-insertmode" data-st-hfmenu-insert-actions>
          <label class="st-hfmenu-radio">
            <input type="radio" name="st-hfmenu-insert-mode" value="block" checked>
            <span>Вставити як звичайний блок меню</span>
          </label>
          <label class="st-hfmenu-radio">
            <input type="radio" name="st-hfmenu-insert-mode" value="nav-row">
            <span>Вставити у навігаційний рядок</span>
          </label>
        </div>

        <div class="st-hfmenu-actions" data-st-hfmenu-insert-actions>
          <button class="st-btn" type="button" data-act="insert" data-variant="big">Big Menu</button>
          <button class="st-btn" type="button" data-act="insert" data-variant="burger">Burger Menu</button>
        </div>
        <div class="st-hfmenu-note" data-st-hfmenu-insert-note>
          Звичайний блок — спочатку вибери <b>КОНТЕЙНЕР</b>. Навігаційний рядок — вставляється окремою компактною полоскою у шапці, яку можна переносити між секціями.
        </div>
      </div>

      <div class="st-hfmenu-card" data-st-hfmenu-editor>
        <div class="st-hfmenu-card__head">
          <div class="st-hfmenu-title st-hfmenu-title--active" data-st-hfmenu-active-title>Виберіть меню для редагування</div>
        </div>
        <div class="st-hfmenu-editor" data-st-hfmenu-editor-body></div>
      </div>
    </div>

    <style>
      /* Показуємо в режимі "Дизайн" завжди (вставка працює тільки у Header/Footer Builder) */
      #${SEC_ID}{ display:block; }

      #${SEC_ID} .st-hfmenu-card{
        border:1px solid rgba(148,163,184,0.20);
        border-radius:14px;
        background:rgba(2,6,23,0.18);
        padding:10px;
        margin-bottom:10px;
      }
      #${SEC_ID} .st-hfmenu-card__head{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
      #${SEC_ID} .st-hfmenu-title{ font-weight:900; letter-spacing:.2px; color:rgba(226,232,240,.95); font-size:13px; }
      #${SEC_ID} .st-hfmenu-title--active{ font-size:12px; font-weight:800; color:rgba(226,232,240,.88); }
      #${SEC_ID} .st-hfmenu-badge{ font-size:11px; font-weight:900; padding:6px 10px; border-radius:999px; border:1px solid rgba(148,163,184,.22); background:rgba(15,23,42,.45); color:rgba(226,232,240,.85); }

      #${SEC_ID} .st-hfmenu-headnote{ margin-left:8px; font-size:11px; font-weight:900; color:rgba(226,232,240,.72); }
      #${SEC_ID} .st-hfmenu-actions{ display:flex; gap:8px; }
      #${SEC_ID} .st-hfmenu-actions .st-btn{ flex:1 1 auto; }
      #${SEC_ID} .st-hfmenu-insertmode{
        display:flex;
        flex-direction:column;
        gap:7px;
        margin:8px 0 10px;
        padding:8px;
        border:1px solid rgba(148,163,184,0.18);
        border-radius:12px;
        background:rgba(15,23,42,0.10);
      }
      #${SEC_ID} .st-hfmenu-radio{
        display:flex;
        align-items:center;
        gap:8px;
        font-size:12px;
        font-weight:700;
        line-height:1.2;
        cursor:pointer;
        color:rgba(226,232,240,.86);
      }
      #${SEC_ID} .st-hfmenu-radio input{ margin:0; accent-color:#38bdf8; }
      #${SEC_ID} .st-hfmenu-note{ margin-top:8px; font-size:12px; color:rgba(226,232,240,.75); line-height:1.35; }
      #${SEC_ID} .st-hfmenu-quick{
        margin-top:6px;
        border:1px solid rgba(148,163,184,0.18);
        border-radius:14px;
        background:rgba(15,23,42,.28);
        padding:10px;
      }

      #${SEC_ID} .st-hfmenu-subsection{
        margin-top:6px;
        border:1px solid rgba(148,163,184,0.18);
        border-radius:14px;
        background:rgba(15,23,42,.28);
        overflow:hidden;
      }
      #${SEC_ID} .st-hfmenu-subsection__header{
        width:100%;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding:10px 12px;
        border:0;
        background:transparent;
        color:inherit;
        cursor:pointer;
      }
      #${SEC_ID} .st-hfmenu-subsection__header:hover{ background:rgba(255,255,255,.04); }
      #${SEC_ID} .st-hfmenu-subsection__title{ font-size:12px; font-weight:900; color:rgba(226,232,240,.92); }
      #${SEC_ID} .st-hfmenu-subsection__meta{ font-size:11px; font-weight:800; color:rgba(226,232,240,.58); }
      #${SEC_ID} .st-hfmenu-subsection__chevron{ transition:transform .18s ease; }
      #${SEC_ID} .st-hfmenu-subsection.is-open .st-hfmenu-subsection__chevron{ transform:rotate(90deg); }
      #${SEC_ID} .st-hfmenu-subsection__body{ display:none; padding:10px; border-top:1px solid rgba(148,163,184,.14); }
      #${SEC_ID} .st-hfmenu-subsection.is-open .st-hfmenu-subsection__body{ display:block; }
      #${SEC_ID} .st-hfmenu-subsection__body[hidden]{ display:none !important; }
      #${SEC_ID} .st-hfmenu-quick__title{ font-size:12px; font-weight:900; color:rgba(226,232,240,.92); margin-bottom:8px; }
      #${SEC_ID} .st-hfmenu-quick__sub{ font-size:11px; font-weight:800; color:rgba(226,232,240,.68); margin:8px 0 6px; }
      #${SEC_ID} .st-hfmenu-quick__grid,
      #${SEC_ID} .st-hfmenu-quick__actions{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
      #${SEC_ID} .st-hfmenu-quick__hint{ margin-top:8px; font-size:11px; line-height:1.35; color:rgba(226,232,240,.72); }

      #${SEC_ID} .st-hfmenu-editor{ display:flex; flex-direction:column; gap:10px; }
      #${SEC_ID} .st-hfmenu-row{ display:grid; grid-template-columns: 110px 1fr; gap:10px; align-items:center; }
      #${SEC_ID} .st-hfmenu-row__label{ font-size:11px; font-weight:900; color:rgba(226,232,240,.70); }
      #${SEC_ID} .st-hfmenu-row__labelbox{ display:inline-flex; align-items:center; gap:8px; }
      #${SEC_ID} .st-hfmenu-color-dot{ width:18px; height:18px; border-radius:8px; border:1px solid rgba(226,232,240,.32); box-shadow:inset 0 0 0 1px rgba(15,23,42,.45); background:#020617; flex:0 0 auto; }
      #${SEC_ID} .st-hfmenu-color-dot--gradient{ width:22px; }
      #${SEC_ID} .st-hfmenu-color-input{
        appearance:none;
        -webkit-appearance:none;
        width:100%;
        min-height:38px;
        padding:0;
        border-radius:12px;
        border:1px solid rgba(148,163,184,.22);
        background:rgba(15,23,42,.40);
        cursor:pointer;
        overflow:hidden;
      }
      #${SEC_ID} .st-hfmenu-color-input::-webkit-color-swatch-wrapper{ padding:0; }
      #${SEC_ID} .st-hfmenu-color-input::-webkit-color-swatch{ border:none; border-radius:11px; }
      #${SEC_ID} .st-hfmenu-color-input::-moz-color-swatch{ border:none; border-radius:11px; }
      #${SEC_ID} .st-hfmenu-stylegroup{ display:grid; gap:8px; margin-top:8px; padding:12px; border:1px solid rgba(148,163,184,.20); border-radius:14px; background:rgba(2,6,23,.26); }
      #${SEC_ID} .st-hfmenu-stylegroup__title{ font-size:12px; font-weight:900; color:#e2e8f0; }
      #${SEC_ID} .st-hfmenu-stylegroup__rows{ display:grid; gap:8px; }
      #${SEC_ID} .st-hfmenu-stylegroup .st-hfmenu-row{ grid-template-columns: 120px 1fr; }
      #${SEC_ID} .st-hfmenu-stylegroup .st-hfmenu-row__label{ color:rgba(226,232,240,.76); }
      #${SEC_ID} .st-hfmenu-stylegroup__sub{ font-size:11px; font-weight:800; color:rgba(226,232,240,.60); margin-top:2px; }
      #${SEC_ID} .st-hfmenu-stylegroup__inline2{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
      #${SEC_ID} .st-hfmenu-levelstyles__stacked-range{ display:grid; gap:8px; width:100%; }
      #${SEC_ID} .st-hfmenu-levelstyles__stacked-range .st-hfmenu-row__label{ font-size:11px; font-weight:900; color:rgba(226,232,240,.70); }
      #${SEC_ID} .st-hfmenu-levelstyles__field{
        display:grid !important;
        grid-template-columns:minmax(0,1fr);
        gap:8px;
        align-items:stretch;
        width:100%;
      }
      #${SEC_ID} .st-hfmenu-levelstyles__field--bg{
        display:grid !important;
        grid-template-columns:minmax(0,1fr);
        gap:8px;
        align-items:stretch;
      }
      #${SEC_ID} .st-hfmenu-levelstyles__field--bg .st-hfmenu-color-input,
      #${SEC_ID} .st-hfmenu-levelstyles__field--bg .st-hfmenu-color-input--wide,
      #${SEC_ID} .st-hfmenu-levelstyles__field--bg .st-hfmenu-levelstyles__stacked-range{
        width:100%;
      }
      #${SEC_ID} .st-hfmenu-levelstyles__field--bg .st-hfmenu-levelstyles__stacked-range{
        margin-top:2px;
      }
      #${SEC_ID} .st-hfmenu-stackrange{ display:grid; grid-template-columns:minmax(0,1fr); gap:8px; width:100%; }
      #${SEC_ID} .st-hfmenu-stackrange__num{ width:100%; text-align:right; font-weight:800; }
      #${SEC_ID} .st-hfmenu-stackrange__range{ width:100%; min-height:34px; }
      #${SEC_ID} .st-hfmenu-stackrange .st-hfmenu-range__val--ghost{ display:none; }
      #${SEC_ID} .st-hfmenu-radio-group{ display:grid; gap:8px; }
      #${SEC_ID} .st-hfmenu-radio{ display:flex; align-items:flex-start; gap:8px; padding:8px 10px; border:1px solid rgba(148,163,184,.24); border-radius:12px; background:rgba(2,6,23,.35); color:rgba(226,232,240,.92); cursor:pointer; }
      #${SEC_ID} .st-hfmenu-radio input{ margin-top:2px; accent-color:#22c55e; }
      #${SEC_ID} .st-hfmenu-radio span{ line-height:1.35; }
      #${SEC_ID} .st-hfmenu-image-preview{
        margin-top:10px;
        display:none;
        grid-template-columns:minmax(0,1fr);
        gap:10px;
        justify-items:start;
        align-items:start;
        padding:12px;
        border-radius:14px;
        border:1px solid rgba(148,163,184,.18);
        background:rgba(15,23,42,.28);
      }
      #${SEC_ID} .st-hfmenu-image-preview.is-visible{ display:grid; }
      #${SEC_ID} .st-hfmenu-image-preview__thumb{
        width:132px;
        height:132px;
        border-radius:14px;
        overflow:hidden;
        border:1px solid rgba(148,163,184,.22);
        background:rgba(2,6,23,.72);
        box-shadow:inset 0 0 0 1px rgba(15,23,42,.45);
      }
      #${SEC_ID} .st-hfmenu-image-preview__thumb img{ width:100%; height:100%; display:block; object-fit:cover; }
      #${SEC_ID} .st-hfmenu-image-preview__meta{ min-width:0; width:100%; display:grid; gap:4px; align-content:start; }
      #${SEC_ID} .st-hfmenu-image-preview__title{ font-size:11px; font-weight:900; color:rgba(226,232,240,.92); }
      #${SEC_ID} .st-hfmenu-image-preview__path{ font-size:10px; line-height:1.35; color:rgba(226,232,240,.62); word-break:break-word; overflow-wrap:anywhere; }
      #${SEC_ID} .st-hfmenu-radiusbox,
      #${SEC_ID} .st-hfmenu-contentbox{
        display:grid;
        gap:10px;
        margin-top:2px;
        padding:12px;
        border-radius:14px;
        border:1px solid rgba(148,163,184,.18);
        background:rgba(15,23,42,.24);
      }
      #${SEC_ID} .st-hfmenu-radiusbox__title,
      #${SEC_ID} .st-hfmenu-contentbox__title{ font-size:12px; font-weight:900; color:rgba(226,232,240,.92); }
      #${SEC_ID} .st-hfmenu-contentbox__sub{ font-size:11px; font-weight:900; color:rgba(226,232,240,.62); text-transform:uppercase; letter-spacing:.06em; margin-top:2px; }
      #${SEC_ID} .st-hfmenu-radius-corners{
        position:relative;
        width:84px;
        height:84px;
        display:grid;
        grid-template-columns:repeat(2,1fr);
        grid-template-rows:repeat(2,1fr);
        place-items:center;
        gap:26px;
        justify-self:start;
      }
      #${SEC_ID} .st-hfmenu-radius-corners::before{
        content:'';
        position:absolute;
        inset:18px;
        border:1px dashed rgba(148,163,184,.26);
        border-radius:12px;
        pointer-events:none;
      }
      #${SEC_ID} .st-hfmenu-radius-corner{
        position:relative;
        z-index:1;
        width:18px;
        height:18px;
        border-radius:999px;
        border:1px solid rgba(148,163,184,.38);
        background:rgba(15,23,42,.92);
        box-shadow:0 0 0 2px rgba(2,6,23,.55);
        cursor:pointer;
        transition:transform .15s ease, background .15s ease, border-color .15s ease, box-shadow .15s ease;
      }
      #${SEC_ID} .st-hfmenu-radius-corner:hover{ transform:scale(1.06); }
      #${SEC_ID} .st-hfmenu-radius-corner.is-active{
        background:rgba(34,197,94,.95);
        border-color:rgba(134,239,172,.95);
        box-shadow:0 0 0 2px rgba(34,197,94,.18);
      }
      #${SEC_ID} .st-hfmenu-mini-stack{ display:grid; gap:8px; }
      #${SEC_ID} .st-hfmenu-mini-grid{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:8px; }
      #${SEC_ID} .st-hfmenu-mini-field{ display:grid; gap:4px; min-width:0; }
      #${SEC_ID} .st-hfmenu-mini-field > span{ font-size:10px; font-weight:800; color:rgba(226,232,240,.68); }
      #${SEC_ID} input.st-inp, #${SEC_ID} select.st-inp{
        width:100%;
        padding:8px 10px;
        border-radius:12px;
        border:1px solid rgba(148,163,184,.22);
        background:rgba(15,23,42,.40);
        color:rgba(226,232,240,.95);
        outline:none;
        font-weight:700;
        font-size:12px;
      }
      #${SEC_ID} .st-mini{
        display:flex; gap:8px; align-items:center;
      }
      #${SEC_ID} .st-mini .st-btn{ padding:7px 10px; border-radius:12px; font-size:12px; font-weight:900; }
      #${SEC_ID} .st-links{ display:flex; flex-direction:column; gap:8px; }
      #${SEC_ID} .st-linkrow{ display:grid; grid-template-columns: 1fr 1fr 34px; gap:8px; }
      #${SEC_ID} .st-del{
        appearance:none; border:1px solid rgba(148,163,184,.22);
        background:rgba(15,23,42,.40);
        color:rgba(226,232,240,.9);
        border-radius:12px;
        cursor:pointer;
        font-weight:900;
      }
      #${SEC_ID} .st-del:hover{ border-color:rgba(248,113,113,.45); box-shadow:0 0 0 1px rgba(248,113,113,.14) inset; }
      #${SEC_ID} .st-hint{ font-size:11px; color:rgba(226,232,240,.68); line-height:1.35; }

      #${SEC_ID} .st-posradio{
        display:flex;
        align-items:center;
        justify-content:flex-start;
        gap:10px;
        padding:8px 10px;
        border-radius:12px;
        border:1px solid rgba(148,163,184,.22);
        background:rgba(15,23,42,.40);
      }
      #${SEC_ID} .st-posradio__text{
        font-weight:900;
        letter-spacing:.3px;
        font-size:12px;
        color:rgba(226,232,240,.92);
      }
      #${SEC_ID} .st-posradio__opt{ display:flex; align-items:center; }
      #${SEC_ID} .st-posradio input[type="radio"]{
        width:16px;
        height:16px;
        cursor:pointer;
      }
    
      /* Menu item accordion (tree) */
      #${SEC_ID} .st-mi{
        border:1px solid rgba(148,163,184,0.18);
        border-radius:12px;
        background:rgba(2,6,23,0.14);
        margin:8px 0;
        overflow:hidden;
      }
      #${SEC_ID} .st-mi__head{
        list-style:none;
        display:flex;
        align-items:center;
        gap:8px;
        padding:8px 8px;
        cursor:pointer;
        user-select:none;
      }
      #${SEC_ID} .st-mi__head::-webkit-details-marker{ display:none; }
      #${SEC_ID} .st-mi__iconbtn{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        width:28px;
        height:28px;
        border-radius:10px;
        border:1px solid rgba(148,163,184,0.18);
        background:rgba(15,23,42,0.25);
        color:rgba(226,232,240,.92);
        cursor:pointer;
        padding:0;
      }
      #${SEC_ID} .st-mi__ico{ width:16px; height:16px; display:inline-flex; }
      #${SEC_ID} .st-mi__ico svg{ width:16px; height:16px; display:block; }
      #${SEC_ID} .st-mi__ico--empty{ font-size:12px; opacity:.6; }
      #${SEC_ID} .st-mi__title{
        flex:1;
        font-size:12px;
        font-weight:700;
        color:rgba(226,232,240,.95);
        overflow:hidden;
        text-overflow:ellipsis;
        white-space:nowrap;
      }
      #${SEC_ID} .st-mi__actions{ display:flex; gap:6px; align-items:center; }
      #${SEC_ID} .st-mi__act{
        width:26px;
        height:26px;
        border-radius:10px;
        border:1px solid rgba(148,163,184,0.18);
        background:rgba(15,23,42,0.25);
        color:rgba(226,232,240,.92);
        cursor:pointer;
      }
      #${SEC_ID} .st-mi__body{
        padding:8px 8px 10px;
        border-top:1px solid rgba(148,163,184,0.12);
      }
      #${SEC_ID} .st-mi__grid{
        display:grid;
        grid-template-columns: 70px 1fr;
        gap:8px;
        align-items:center;
      }
      #${SEC_ID} .st-mi__lab{ font-size:11px; opacity:.75; }
      #${SEC_ID} .st-mi__row{ margin-top:10px; display:flex; gap:8px; }
      #${SEC_ID} .st-mi__renameinp{ height:30px; font-size:12px; }
      #${SEC_ID} .st-muted{ opacity:.6; }

      /* DnD highlight */
      #${SEC_ID} .st-mi{ position:relative; }
      #${SEC_ID} .st-mi__head{ position:relative; }
      #${SEC_ID} .st-mi.is-dnd-drop-inside > .st-mi__head{
        box-shadow: 0 0 0 2px rgba(239,68,68,0.95) inset;
        border-radius:10px;
      }
      #${SEC_ID} .st-mi.is-dnd-drop-before > .st-mi__head::before{
        content:'';
        position:absolute;
        left:0; right:0;
        top:0;
        height:2px;
        background: rgba(59,130,246,0.95);
        border-radius:2px;
      }
      #${SEC_ID} .st-mi.is-dnd-drop-after > .st-mi__head::after{
        content:'';
        position:absolute;
        left:0; right:0;
        bottom:0;
        height:2px;
        background: rgba(59,130,246,0.95);
        border-radius:2px;
      }

</style>
  `.trim();

  host.appendChild(sectionEl);

  const insertTitle = sectionEl.querySelector('[data-st-hfmenu-insert-title]');
  const insertBadge = sectionEl.querySelector('[data-st-hfmenu-insert-badge]');
  const insertActions = sectionEl.querySelector('[data-st-hfmenu-insert-actions]');
  const insertNote = sectionEl.querySelector('[data-st-hfmenu-insert-note]');
  const activeTitle = sectionEl.querySelector('[data-st-hfmenu-active-title]');
  const headNote = sectionEl.querySelector('[data-st-hfmenu-headnote]');
  const editorBody = sectionEl.querySelector('[data-st-hfmenu-editor-body]');

  // Insert buttons
  sectionEl.addEventListener('click', (ev) => {
    const btn = ev.target?.closest?.('button[data-act="insert"]');
    if (!btn) return;
    const v = btn.getAttribute('data-variant') || 'big';
    const modeInput = sectionEl.querySelector('input[name="st-hfmenu-insert-mode"]:checked');
    const insertMode = modeInput ? String(modeInput.value || 'block') : 'block';
    dispatchInsertMenu(v, insertMode);
  });

  function shouldRenderMenuOnInspectorOpen_(blk, data) {
    if (!(blk instanceof HTMLElement)) return false;
    // 00216: do not rebuild an already visible template menu just because it
    // was selected. Rebuilding destroys inline/template DOM styles and caused
    // the first-click shrink reported by the user. We only render if DOM is
    // actually missing/broken.
    const list = blk.querySelector('.st-menu__list');
    if (!(list instanceof HTMLElement)) return true;
    const hasAnyItem = !!list.querySelector('.st-menu__item, .st-menu__link');
    if (!hasAnyItem) return true;
    const hasMenuShell = !!blk.querySelector('.st-menu');
    return !hasMenuShell;
  }

  function rebuildEditor() {
    const canInsert = isHeaderMode() || isFooterMode();

    // У режимі "Дизайн" прибираємо вставку (кнопки Big/Burger), залишаємо лише інфо про активне меню.
    if (insertActions) insertActions.style.display = canInsert ? '' : 'none';
    if (insertNote) insertNote.style.display = canInsert ? '' : 'none';
    if (insertTitle) insertTitle.textContent = canInsert ? 'Вставка меню' : 'Меню';

    const blk = getActiveMenuBlock(getSelection);
    if (!editorBody || !activeTitle) return;

    if (!blk) {
      activeTitle.textContent = 'Виберіть меню для редагування';
      if (headNote) headNote.textContent = ''; 
      if (insertBadge) insertBadge.textContent = canInsert ? getModeLabel() : '—';
      editorBody.innerHTML = canInsert
        ? `<div class="st-hint">Вибери блок <b>Меню</b> у шапці або футері, щоб редагувати лінки.</div>`
        : `<div class="st-hint">Клікни по блоку <b>Меню</b> на макеті, щоб відкрити його налаштування.</div>`;
      return;
    }

    if (headNote) headNote.textContent = '';
    const activeLabel = (blk.dataset.menuVariant === 'burger') ? 'Burger Menu' : 'Big Menu';
    activeTitle.textContent = activeLabel;
    if (insertBadge) insertBadge.textContent = canInsert ? getModeLabel() : activeLabel;
    const data = ensureMenuData(blk);
    if (shouldRenderMenuOnInspectorOpen_(blk, data)) {
      renderMenuLinks(blk, data);
    }

    editorBody.innerHTML = '';

    // Icon pick + position
    const iconRow = buildRow('Іконка', `
      <div class="st-mini">
        <button class="st-btn" type="button" data-act="pick-icon">Вибрати</button>
        <button class="st-btn" type="button" data-act="clear-icon">Очистити</button>
      </div>
      <div class="st-hint" style="margin-top:6px;">Іконка за замовчуванням для пунктів без власної іконки. Колір = як текст.</div>
    `);
    editorBody.appendChild(iconRow);

    const posRow = buildRow('Позиція', `
      <div class="st-posradio" data-act="icon-pos-radio">
        <label class="st-posradio__opt" title="Іконка перед текстом">
          <input type="radio" name="st-menu-iconpos" value="before" ${data.iconPos === 'before' ? 'checked' : ''} />
        </label>
        <div class="st-posradio__text">ТЕКСТ</div>
        <label class="st-posradio__opt" title="Іконка після тексту">
          <input type="radio" name="st-menu-iconpos" value="after" ${data.iconPos === 'after' ? 'checked' : ''} />
        </label>
      </div>
    `);
    editorBody.appendChild(posRow);


    const CONTENT_SETTINGS_ACCORDION_KEY = 'st_hfmenu_main_settings_open';
    const ARROW_STYLES_ACCORDION_KEY = 'st_hfmenu_arrow_styles_open';
    const GENERAL_SETTINGS_ACCORDION_KEY = 'st_hfmenu_general_settings_open';
    const MEGA_MENU_ACCORDION_KEY = 'st_hfmenu_mega_menu_open';
    const LEVEL_STYLE_BASIC_ACCORDION_KEY = 'st_hfmenu_level_style_basic_open';
    const LEVEL_STYLE_LINE_ACCORDION_KEY = 'st_hfmenu_level_style_line_open';
    const LEVEL_STYLE_SHADOW_ACCORDION_KEY = 'st_hfmenu_level_style_shadow_open';
    const LEVEL_STYLE_DIVIDER_ACCORDION_KEY = 'st_hfmenu_level_style_divider_open';
    const LEVEL_STYLE_SPACING_ACCORDION_KEY = 'st_hfmenu_level_style_spacing_open';
    const readBoolStorage = (key, fallback = true) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw == null) return !!fallback;
        if (raw == '1' || raw == 'true') return true;
        if (raw == '0' || raw == 'false') return false;
      } catch (_) {}
      return !!fallback;
    };
    const writeBoolStorage = (key, value) => {
      try { localStorage.setItem(key, value ? '1' : '0'); } catch (_) {}
    };
    const tooltipSingleton = (() => {
      let el = null;
      let timer = null;
      let lastTarget = null;
      const ensure = () => {
        if (el) return el;
        el = document.createElement('div');
        el.className = 'sttpl-tooltip sttpl-tooltip--hidden st-hfmenu-delayed-tip';
        el.setAttribute('role', 'tooltip');
        try { document.body.appendChild(el); } catch (_) {}
        return el;
      };
      const hide = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        lastTarget = null;
        if (el) el.classList.add('sttpl-tooltip--hidden');
      };
      const position = (target) => {
        if (!target) return;
        const tooltip = ensure();
        const box = target.getBoundingClientRect();
        const ttRect = tooltip.getBoundingClientRect();
        const pad = 10;
        let x = box.left + (box.width / 2) - (ttRect.width / 2);
        let y = box.bottom + 12;
        x = Math.max(pad, Math.min(x, window.innerWidth - ttRect.width - pad));
        y = Math.max(pad, Math.min(y, window.innerHeight - ttRect.height - pad));
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
      };
      const show = (target, text) => {
        if (!target || !text) return;
        const tooltip = ensure();
        tooltip.textContent = String(text || '');
        tooltip.classList.remove('sttpl-tooltip--hidden');
        tooltip.style.fontSize = '18px';
        tooltip.style.lineHeight = '1.6';
        tooltip.style.fontWeight = '700';
        position(target);
      };
      const arm = (target, text, delayMs = 3000) => {
        hide();
        lastTarget = target;
        timer = setTimeout(() => {
          if (!lastTarget || lastTarget !== target) return;
          show(target, text);
        }, delayMs);
      };
      return { arm, hide };
    })();

    const attachDelayedTooltip = (target, text, delayMs = 3000) => {
      if (!target || !text) return;
      const arm = () => tooltipSingleton.arm(target, text, delayMs);
      const hide = () => tooltipSingleton.hide();
      target.addEventListener('mouseenter', arm);
      target.addEventListener('focus', arm);
      target.addEventListener('mouseleave', hide);
      target.addEventListener('blur', hide);
      target.addEventListener('pointerdown', hide);
      target.addEventListener('click', hide);
    };

    const createSubAccordion = ({ title, meta = '', storageKey, defaultOpen = true, variant = 'compact', tooltipText = '' }) => {
      const wrap = document.createElement('section');
      const isDesignVariant = variant === 'design-section';
      wrap.className = isDesignVariant
        ? 'design-section st-hfmenu-main-settings-acc'
        : 'st-hfmenu-subsection';
      const isOpen = readBoolStorage(storageKey, defaultOpen);
      if (isOpen) wrap.classList.add('is-open');
      wrap.innerHTML = isDesignVariant
        ? `
          <button class="design-section__header" type="button" aria-expanded="${isOpen ? 'true' : 'false'}">
            <div class="design-section__header-title">
              <span class="st-hfmenu-main-settings-acc__title">${esc(title)}</span>
            </div>
            <span class="design-section__chevron">▶</span>
          </button>
          <div class="design-section__body" ${isOpen ? '' : 'hidden'}></div>
        `.trim()
        : `
          <button class="st-hfmenu-subsection__header" type="button" aria-expanded="${isOpen ? 'true' : 'false'}">
            <div>
              <div class="st-hfmenu-subsection__title">${esc(title)}</div>
              ${meta ? `<div class="st-hfmenu-subsection__meta">${esc(meta)}</div>` : ''}
            </div>
            <span class="st-hfmenu-subsection__chevron">▶</span>
          </button>
          <div class="st-hfmenu-subsection__body" ${isOpen ? '' : 'hidden'}></div>
        `.trim();
      const header = wrap.querySelector(isDesignVariant ? '.design-section__header' : '.st-hfmenu-subsection__header');
      const body = wrap.querySelector(isDesignVariant ? '.design-section__body' : '.st-hfmenu-subsection__body');
      const titleTarget = wrap.querySelector(isDesignVariant ? '.st-hfmenu-main-settings-acc__title' : '.st-hfmenu-subsection__title');
      const setOpen = (open) => {
        wrap.classList.toggle('is-open', !!open);
        if (header) header.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (body) {
          body.hidden = !open;
          body.style.display = open ? '' : 'none';
        }
        writeBoolStorage(storageKey, !!open);
      };
      header?.addEventListener('click', () => setOpen(!wrap.classList.contains('is-open')));
      setOpen(isOpen);
      if (tooltipText && titleTarget) attachDelayedTooltip(titleTarget, tooltipText, 3000);
      return { wrap, body, setOpen };
    };

    // Links editor (TREE, без DnD)
    const linksWrap = document.createElement('div');
    linksWrap.className = 'st-links';
    linksWrap.innerHTML = `<div class="st-hfmenu-row__label" style="margin-bottom:6px;">Пункти меню</div>`;

    const list = document.createElement('div');
    list.className = 'st-links';
    list.setAttribute('data-st-menu-tree', '1');
    linksWrap.appendChild(list);


// DnD v1 (reorder within same level) state
let dndDragPath = null;
let dndDragParent = null;
let dndOverPath = null;
let dndDropAction = null; // 'before' | 'after' | 'inside'

    const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const getByPath = (rootItems, pathStr) => {
      const parts = String(pathStr || '').split('.').filter(Boolean).map(n => Number(n));
      let parent = null;
      let arr = rootItems;
      let idx = -1;
      let node = null;
      for (const p of parts) {
        idx = p;
        parent = { arr };
        node = arr?.[idx];
        if (!node) return { parentArr: null, node: null, idx: -1, level: parts.length - 1 };
        arr = node.children || [];
      }
      return { parentArr: parent?.arr || null, node, idx, level: parts.length - 1 };
    };

    const renderTreeRows = () => {
      list.innerHTML = '';

      const MAX_DEPTH = 10;

      const parseHref = (href) => {
        const h = String(href || '').trim();
        if (!h) return { path: '', anchor: '' };
        // Keep external links intact in "path"
        if (/^https?:\/\//i.test(h) || h.startsWith('mailto:') || h.startsWith('tel:')) {
          return { path: h, anchor: '' };
        }
        const parts = h.split('#');
        const path = parts[0] || '';
        const anchor = parts.length > 1 ? parts.slice(1).join('#') : '';
        return { path, anchor };
      };

      const buildHref = (path, anchor) => {
        const p = String(path || '').trim();
        let a = String(anchor || '').trim();
        if (a.startsWith('#')) a = a.slice(1);
        if (!a) return p || '';
        // If path empty -> same page anchor
        return `${p || ''}#${a}`;
      };

      const iconPreview = (it) => {
        const svg = sanitizeMenuIconSvg((it && it.iconSvg) || data.iconSvg || '');
        if (!svg) return '<span class="st-mi__ico st-mi__ico--empty">□</span>';
        return `<span class="st-mi__ico">${svg}</span>`;
      };

      const walk = (items, level, prefix) => {
        (items || []).forEach((it, i) => {
          const pathStr = prefix ? `${prefix}.${i}` : `${i}`;
          const depth = Math.min(level, MAX_DEPTH - 1);

          const { path, anchor } = parseHref(it.href);

          const details = document.createElement('details');
          details.className = 'st-mi';
          details.style.marginLeft = `${depth * 14}px`;

          const summary = document.createElement('summary');
          summary.className = 'st-mi__head';
          // DnD v1: make item draggable (reorder inside same parent level)
          summary.setAttribute('draggable', 'true');
          summary.dataset.dndPath = pathStr;
          summary.dataset.dndParent = prefix || '';
          summary.addEventListener('dragstart', (e) => {
            // Don't start drag from action buttons/inputs
            if (e.target && (e.target.closest?.('button') || e.target.closest?.('input') || e.target.closest?.('textarea') || e.target.closest?.('select'))) {
              e.preventDefault();
              return;
            }
            dndDragPath = pathStr;
            dndDragParent = prefix || '';
            dndOverPath = null;
            try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dndDragPath); } catch(_) {}
            details.classList.add('is-dnd-drag');
          });
          summary.addEventListener('dragend', () => {
            dndDragPath = null;
            dndDragParent = null;
            dndOverPath = null;
            dndDropAction = null;
            list.querySelectorAll('.is-dnd-over, .is-dnd-drop-inside, .is-dnd-drop-before, .is-dnd-drop-after').forEach(el => el.classList.remove('is-dnd-over','is-dnd-drop-inside','is-dnd-drop-before','is-dnd-drop-after'));
            details.classList.remove('is-dnd-drag');
          });
          summary.addEventListener('dragover', (e) => {
            if (!dndDragPath) return;
            if (pathStr === dndDragPath) return;

            // v2: determine drop action by vertical position: top=before, middle=inside, bottom=after
            const rect = summary.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const h = Math.max(1, rect.height);
            const third = h / 3;

            let action = 'inside';
            if (y < third) action = 'before';
            else if (y > third * 2) action = 'after';

            // disallow dropping into own descendant (inside)
            if (action === 'inside' && (pathStr === dndDragPath || pathStr.startsWith(dndDragPath + '.'))) return;

            dndDropAction = action;

            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (dndOverPath !== pathStr) {
              dndOverPath = pathStr;
              list.querySelectorAll('.is-dnd-over, .is-dnd-drop-inside, .is-dnd-drop-before, .is-dnd-drop-after').forEach(el => el.classList.remove('is-dnd-over','is-dnd-drop-inside','is-dnd-drop-before','is-dnd-drop-after'));
            }
            details.classList.remove('is-dnd-drop-inside','is-dnd-drop-before','is-dnd-drop-after');
            details.classList.add(action === 'inside' ? 'is-dnd-drop-inside' : (action === 'before' ? 'is-dnd-drop-before' : 'is-dnd-drop-after'));
          });
          summary.addEventListener('dragleave', () => {
            details.classList.remove('is-dnd-over','is-dnd-drop-inside','is-dnd-drop-before','is-dnd-drop-after');
          });
          summary.addEventListener('drop', (e) => {
            if (!dndDragPath) return;
            if (pathStr === dndDragPath) return;
            e.preventDefault();

            const action = dndDropAction || 'inside';

            // prevent moving into own subtree (inside)
            if (action === 'inside' && (pathStr === dndDragPath || pathStr.startsWith(dndDragPath + '.'))) return;

            const from = getByPath(data.items || [], dndDragPath);
            const to = getByPath(data.items || [], pathStr);
            if (!from.parentArr || !to.node) return;

            const computeMaxDepth = (node) => {
              const kids = Array.isArray(node?.children) ? node.children : [];
              if (!kids.length) return 1;
              return 1 + Math.max(...kids.map(computeMaxDepth));
            };

            const getDepthByPath = (p) => {
              const parts = String(p || '').split('.').filter(Boolean);
              // root item has depth 1
              return parts.length;
            };

            const MAX_DEPTH = 10;

            // remove subtree
            const movedNode = (() => {
              const arr = from.parentArr;
              if (!arr || from.idx < 0) return null;
              const [m] = arr.splice(from.idx, 1);
              return m || null;
            })();
            if (!movedNode) return;

            const movedSubDepth = computeMaxDepth(movedNode);

            const insertAt = (arr, idx, node) => arr.splice(Math.max(0, Math.min(arr.length, idx)), 0, node);

            if (action === 'inside') {
              const targetDepth = getDepthByPath(pathStr);
              if (targetDepth + movedSubDepth > MAX_DEPTH) {
                // revert
                from.parentArr.splice(from.idx, 0, movedNode);
                return;
              }
              if (!Array.isArray(to.node.children)) to.node.children = [];
              to.node.children.push(movedNode);
            } else {
              const targetInfo = getByPath(data.items || [], pathStr);
              const targetArr = targetInfo.parentArr || (data.items || []);
              let tIdx = targetInfo.idx;

              // If moving within same array and removed earlier index, correct target index
              if (from.parentArr === targetArr && from.idx < tIdx) tIdx -= 1;

              if (action === 'before') insertAt(targetArr, tIdx, movedNode);
              else insertAt(targetArr, tIdx + 1, movedNode);
            }

            dndDropAction = null;

            writeMenuData(blk, data);
            renderMenuLinks(blk, data);
            renderTreeRows();
          });

          summary.innerHTML = `
            <button class="st-mi__iconbtn" type="button" data-act="item-pick-icon" data-path="${pathStr}" title="Змінити іконку">${iconPreview(it)}</button>
            <span class="st-mi__title" data-path="${pathStr}">${esc(it.text || '') || '<span class="st-muted">Без назви</span>'}</span>
            <input class="st-mi__renameinp st-inp" style="display:none" data-act="node-text" data-path="${pathStr}" value="${esc(it.text || '')}" />
            <div class="st-mi__actions">
              <button class="st-mi__act" type="button" data-act="rename-node" data-path="${pathStr}" title="Перейменувати">✎</button>
              <button class="st-mi__act" type="button" data-act="dup-node" data-path="${pathStr}" title="Дублювати">⧉</button>
              <button class="st-mi__act" type="button" data-act="del-node" data-path="${pathStr}" title="Видалити">🗑</button>
              <button class="st-mi__act" type="button" data-act="toggle-more" data-path="${pathStr}" title="Додатково">⋯</button>
            </div>
          `.trim();

          const body = document.createElement('div');
          body.className = 'st-mi__body';
          body.innerHTML = `
            <div class="st-mi__grid">
              <label class="st-mi__lab">Адреса</label>
              <input class="st-inp" data-act="node-path" data-path="${pathStr}" value="${esc(path)}" placeholder="/" />
              <label class="st-mi__lab">Якір</label>
              <input class="st-inp" data-act="node-anchor" data-path="${pathStr}" value="${esc(anchor ? ('#' + anchor) : '')}" placeholder="#" />
            </div>
            <div class="st-mi__row">
              <button class="st-btn" type="button" data-act="add-child" data-path="${pathStr}" title="Додати підпункт">+ Підпункт</button>
            </div>
          `.trim();

          details.appendChild(summary);
          details.appendChild(body);
          list.appendChild(details);

          const kids = Array.isArray(it.children) ? it.children : [];
          if (kids.length && level < MAX_DEPTH - 1) walk(kids, level + 1, pathStr);
        });
      };

      walk(data.items || [], 0, '');
    };

        renderTreeRows();

    const addRootBtn = document.createElement('button');
    addRootBtn.className = 'st-btn';
    addRootBtn.type = 'button';
    addRootBtn.textContent = 'Додати пункт';
    addRootBtn.addEventListener('click', () => {
      data.items.push({ text: 'Новий пункт', href: '#', iconSvg: '', children: [] });
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      renderTreeRows();
    });

    const tuneMenuBtn = document.createElement('button');
    tuneMenuBtn.className = 'st-btn';
    tuneMenuBtn.type = 'button';
    tuneMenuBtn.textContent = 'Налаштувати меню';
    tuneMenuBtn.addEventListener('click', () => {
      dispatchTuneMenu();
    });

    const getSelectedInsideCurrentMenu = () => {
      try {
        const sel = typeof getSelection === 'function' ? getSelection() : null;
        const el = sel?.elements?.[0] || null;
        if (!el || !blk) return null;
        return (el === blk || el.closest?.('.st-block--menu') === blk) ? el : null;
      } catch (_) {}
      return null;
    };

    const getStyleItemTarget = () => {
      const selected = getSelectedInsideCurrentMenu();
      if (selected instanceof HTMLElement && selected.matches('[data-st-menu-item="1"]')) return selected;
      return blk?.querySelector?.('[data-st-menu-item="1"]') || null;
    };

    const selectStyleTarget = (kind) => {
      const target = (kind === 'item') ? getStyleItemTarget() : blk;
      if (!(target instanceof HTMLElement)) return false;
      try {
        showAllDesignSections();
        if (window.ST_SELECTION && typeof window.ST_SELECTION.setSingle === 'function') {
          window.ST_SELECTION.setSingle(target);
        }
      } catch (_) {}
      return true;
    };

    const openStyleSection = (title, fallbackKind) => {
      const selected = getSelectedInsideCurrentMenu();
      if (!(selected instanceof HTMLElement)) {
        selectStyleTarget(fallbackKind || 'menu');
      } else {
        try { showAllDesignSections(); } catch (_) {}
      }
      openDesignSectionByTitle(title);
    };

    const quickWrap = document.createElement('div');
    quickWrap.className = 'st-hfmenu-quick';
    quickWrap.innerHTML = `
      <div class="st-hfmenu-quick__title">Швидке налаштування меню</div>
      <div class="st-hfmenu-quick__sub">Що виділити</div>
      <div class="st-hfmenu-quick__grid">
        <button class="st-btn" type="button" data-act="quick-target-menu">Контейнер меню</button>
        <button class="st-btn" type="button" data-act="quick-target-item">Пункт меню</button>
      </div>
    `.trim();

    const levelsWrap = document.createElement('div');
    levelsWrap.className = 'st-hfmenu-quick';
    const settingsModeRow = buildRow('Режим налаштування', `
      <label class="st-mini" style="display:flex;align-items:center;gap:8px;justify-content:flex-start;">
        <input type="checkbox" data-act="menu-settings-mode" />
        <span>Увімкнути</span>
      </label>
    `);

    const modeRow = buildRow('Підменю', `
      <select class="st-inp" data-act="submenu-mode">
        <option value="hover">При наведенні</option>
        <option value="click">При кліку</option>
        <option value="always">Показувати завжди</option>
        <option value="hidden">Не показувати</option>
      </select>
    `);
    const viewRow = buildRow('Вигляд', `
      <select class="st-inp" data-act="submenu-view">
        <option value="dropdown">Випадаючий блок</option>
        <option value="inline">Вбудований список</option>
        <option value="mega">Mega Panel</option>
      </select>
    `);
    const arrowRow = buildRow('Стрілка', `
      <select class="st-inp" data-act="submenu-arrow">
        <option value="1">Показувати</option>
        <option value="0">Не показувати</option>
      </select>
    `);
    const alignRow = buildRow('Позиція підменю', `
      <select class="st-inp" data-act="submenu-align">
        <option value="left">Ліворуч</option>
        <option value="center">По центру</option>
        <option value="right">Праворуч</option>
        <option value="auto">Авто</option>
      </select>
    `);
    const offsetRow = buildRow('Відступ зверху', `
      <input class="st-inp" type="number" min="0" max="120" step="1" data-act="submenu-offset-y" />
    `);
    const minWidthRow = buildRow('Мінімальна ширина', `
      <input class="st-inp" type="number" min="120" max="1200" step="1" data-act="submenu-min-width" />
    `);
    const widthModeRow = buildRow('Ширина', `
      <select class="st-inp" data-act="submenu-width-mode">
        <option value="content">По контенту</option>
        <option value="parent">По батьківському пункту</option>
        <option value="custom">Власна</option>
      </select>
    `);
    const customWidthRow = buildRow('Власна ширина', `
      <input class="st-inp" type="number" min="120" max="1600" step="1" data-act="submenu-custom-width" />
    `);
    const level1DirRow = buildRow('Рівень 1', `
      <select class="st-inp" data-act="menu-level1-direction">
        <option value="row">Горизонтально</option>
        <option value="column">Вертикально</option>
      </select>
    `);
    const level2DirRow = buildRow('Рівень 2', `
      <select class="st-inp" data-act="menu-level2-direction">
        <option value="row">Горизонтально</option>
        <option value="column">Вертикально</option>
      </select>
    `);
    const level3DirRow = buildRow('Рівень 3+', `
      <select class="st-inp" data-act="menu-level3-direction">
        <option value="row">Горизонтально</option>
        <option value="column">Вертикально</option>
      </select>
    `);
    const level3PosRow = buildRow('Позиція 3+', `
      <select class="st-inp" data-act="menu-level3-position">
        <option value="right">Праворуч</option>
        <option value="left">Ліворуч</option>
        <option value="auto">Авто</option>
      </select>
    `);
    const level3OffsetXRow = buildRow('Відступ X 3+', `
      <input class="st-inp" type="number" min="0" max="240" step="1" data-act="menu-level3-offset-x" />
    `);
    const level3OffsetYRow = buildRow('Відступ Y 3+', `
      <input class="st-inp" type="number" min="-240" max="240" step="1" data-act="menu-level3-offset-y" />
    `);
    const level3MinWidthRow = buildRow('Мін. ширина 3+', `
      <input class="st-inp" type="number" min="120" max="1200" step="1" data-act="menu-level3-min-width" />
    `);
    const level3WidthModeRow = buildRow('Ширина 3+', `
      <select class="st-inp" data-act="menu-level3-width-mode">
        <option value="content">По контенту</option>
        <option value="parent">По батьківському пункту</option>
        <option value="custom">Власна</option>
      </select>
    `);
    const level3CustomWidthRow = buildRow('Власна ширина 3+', `
      <input class="st-inp" type="number" min="120" max="1600" step="1" data-act="menu-level3-custom-width" />
    `);

    const menuLayoutWrap = document.createElement('div');
    menuLayoutWrap.className = 'st-hfmenu-quick st-hfmenu-menu-layout';
    menuLayoutWrap.innerHTML = `
      <div class="st-hfmenu-quick__title">Розмітка пунктів меню</div>
      <div class="st-hfmenu-quick__hint">Налаштовує саме розміщення пунктів всередині розтягнутого блока меню: відступи між пунктами, горизонтальне/вертикальне вирівнювання і внутрішні відступи.</div>
    `.trim();
    const menuRootJustifyRow = buildRow('Горизонталь', `
      <select class="st-inp" data-act="menu-root-justify">
        <option value="flex-start">Ліво</option>
        <option value="center">Центр</option>
        <option value="flex-end">Право</option>
        <option value="space-between">По краях</option>
        <option value="space-around">Рівномірно</option>
        <option value="space-evenly">Однаково</option>
      </select>
    `);
    const menuRootAlignRow = buildRow('Вертикаль', `
      <select class="st-inp" data-act="menu-root-align">
        <option value="flex-start">Верх</option>
        <option value="center">Центр</option>
        <option value="flex-end">Низ</option>
        <option value="stretch">Розтягнути</option>
      </select>
    `);
    const menuRootGapRow = buildRow('Відступ між пунктами', `
      <input class="st-inp" type="number" min="0" max="240" step="1" data-act="menu-root-gap" />
    `);
    const menuRootPadXRow = buildRow('Внутрішній X', `
      <input class="st-inp" type="number" min="0" max="240" step="1" data-act="menu-root-pad-x" />
    `);
    const menuRootPadYRow = buildRow('Внутрішній Y', `
      <input class="st-inp" type="number" min="0" max="240" step="1" data-act="menu-root-pad-y" />
    `);
    menuLayoutWrap.appendChild(menuRootJustifyRow);
    menuLayoutWrap.appendChild(menuRootAlignRow);
    menuLayoutWrap.appendChild(menuRootGapRow);
    menuLayoutWrap.appendChild(menuRootPadXRow);
    menuLayoutWrap.appendChild(menuRootPadYRow);

    levelsWrap.appendChild(settingsModeRow);
    levelsWrap.appendChild(modeRow);
    levelsWrap.appendChild(viewRow);
    levelsWrap.appendChild(arrowRow);
    levelsWrap.appendChild(alignRow);
    levelsWrap.appendChild(offsetRow);
    levelsWrap.appendChild(minWidthRow);
    levelsWrap.appendChild(widthModeRow);
    levelsWrap.appendChild(customWidthRow);
    levelsWrap.appendChild(level1DirRow);
    levelsWrap.appendChild(level2DirRow);
    levelsWrap.appendChild(level3DirRow);
    levelsWrap.appendChild(level3PosRow);
    levelsWrap.appendChild(level3OffsetXRow);
    levelsWrap.appendChild(level3OffsetYRow);
    levelsWrap.appendChild(level3MinWidthRow);
    levelsWrap.appendChild(level3WidthModeRow);
    levelsWrap.appendChild(level3CustomWidthRow);

    const megaWrap = document.createElement('div');
    megaWrap.className = 'st-hfmenu-quick st-hfmenu-mega';
    const megaWidthModeRow = buildRow('Ширина Mega', `
      <select class="st-inp" data-act="mega-width-mode">
        <option value="content">По контенту</option>
        <option value="parent">По батьківському пункту</option>
        <option value="custom">Власна</option>
      </select>
    `);
    const megaCustomWidthRow = buildRow('Власна ширина Mega', `
      <input class="st-inp" type="number" min="120" max="1600" step="1" data-act="mega-custom-width" />
    `);
    const megaPositionRow = buildRow('Позиція Mega', `
      <select class="st-inp" data-act="mega-position">
        <option value="left">Праворуч</option>
        <option value="center">По центру</option>
        <option value="right">Ліворуч</option>
        <option value="auto">Авто</option>
      </select>
    `);
    const megaOffsetLeftRow = buildRow('Відступ справа Mega', `
      <input class="st-inp" type="number" min="-500" max="500" step="1" data-act="mega-offset-left" />
    `);
    const megaOffsetRightRow = buildRow('Відступ зліва Mega', `
      <input class="st-inp" type="number" min="-500" max="500" step="1" data-act="mega-offset-right" />
    `);
    const megaColsModeRow = buildRow('Кількість колонок Mega', `
      <select class="st-inp" data-act="mega-cols-mode">
        <option value="auto">Авто</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
        <option value="9">9</option>
        <option value="10">10</option>
        <option value="custom">Власна</option>
      </select>
    `);
    const megaColsCustomRow = buildRow('Власна кількість колонок', `
      <input class="st-inp" type="number" min="1" max="30" step="1" data-act="mega-cols-custom" />
    `);
    const megaGapRow = buildRow('Відступ між колонками', `
      <input class="st-inp" type="number" min="0" max="120" step="1" data-act="mega-gap" />
    `);
    const megaColMinWidthRow = buildRow('Мін. ширина колонки', `
      <input class="st-inp" type="number" min="80" max="600" step="1" data-act="mega-col-minw" />
    `);
    const megaBgModeRow = buildRow('Фон Mega', `
      <select class="st-inp" data-act="mega-bg-mode">
        <option value="color">Колір</option>
        <option value="image">Картинка</option>
        <option value="gradient">Градієнт</option>
      </select>
    `);
    const megaBgColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір фону Mega</span><span class="st-hfmenu-color-dot" data-role="mega-bg-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-bg-color" />
    `);
    const megaBgImageRow = buildRow('Картинка фону Mega', `
      <div class="st-hfmenu-gallery-links">
        <button class="st-btn st-btn--ghost" type="button" data-act="mega-bg-pick-image" data-cat="images">Картинки</button>
        <button class="st-btn st-btn--ghost" type="button" data-act="mega-bg-pick-image" data-cat="logos">Логотип</button>
        <button class="st-btn st-btn--ghost" type="button" data-act="mega-bg-pick-image" data-cat="icons">Іконки</button>
      </div>
      <input class="st-inp" type="text" placeholder="URL або вибір з галереї" data-act="mega-bg-image" />
      <div class="st-hfmenu-image-preview" data-role="mega-bg-image-preview">
        <div class="st-hfmenu-image-preview__thumb">
          <img data-role="mega-bg-image-preview-img" alt="Мініатюра вибраної картинки Mega" />
        </div>
        <div class="st-hfmenu-image-preview__meta">
          <div class="st-hfmenu-image-preview__title">Вибрана картинка</div>
          <div class="st-hfmenu-image-preview__path" data-role="mega-bg-image-preview-path"></div>
        </div>
      </div>
    `);
    const megaBgImageSizeRow = buildRow('Розмір картинки Mega', `
      <select class="st-inp" data-act="mega-bg-size">
        <option value="cover">Розтягнути по блоку</option>
        <option value="contain">Вмістити повністю</option>
        <option value="auto">Оригінальний розмір</option>
        <option value="custom">Власний масштаб</option>
      </select>
    `);
    const megaBgImageScaleRow = buildRow('Масштаб картинки Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="10" max="300" step="1" data-act="mega-bg-scale" />
        <span class="st-hfmenu-range__val" data-role="mega-bg-scale-val">100%</span>
      </div>
    `);
    const megaBgImageRepeatRow = buildRow('Повтор картинки Mega', `
      <select class="st-inp" data-act="mega-bg-repeat">
        <option value="no-repeat">Без повтору</option>
        <option value="repeat">Повторювати</option>
        <option value="repeat-x">Повтор по горизонталі</option>
        <option value="repeat-y">Повтор по вертикалі</option>
      </select>
    `);
    const megaBgImagePositionRow = buildRow('Позиція картинки Mega', `
      <select class="st-inp" data-act="mega-bg-position">
        <option value="center center">По центру</option>
        <option value="top center">Зверху</option>
        <option value="bottom center">Знизу</option>
        <option value="center left">Зліва</option>
        <option value="center right">Справа</option>
        <option value="top left">Верхній лівий кут</option>
        <option value="top right">Верхній правий кут</option>
        <option value="bottom left">Нижній лівий кут</option>
        <option value="bottom right">Нижній правий кут</option>
        <option value="custom">Довільна позиція</option>
      </select>
    `);
    const megaBgImageCustomPosRow = buildRow('Довільна позиція картинки', `
      <div class="st-hfmenu-mini-grid">
        <label class="st-hfmenu-mini-field">
          <span>Горизонталь %</span>
          <input class="st-inp" type="number" min="0" max="100" step="1" data-act="mega-bg-pos-x" />
        </label>
        <label class="st-hfmenu-mini-field">
          <span>Вертикаль %</span>
          <input class="st-inp" type="number" min="0" max="100" step="1" data-act="mega-bg-pos-y" />
        </label>
      </div>
    `);
    const megaBgGradient1Row = buildRow('<span class="st-hfmenu-row__labelbox"><span>Градієнт 1 Mega</span><span class="st-hfmenu-color-dot st-hfmenu-color-dot--gradient" data-role="mega-bg-gradient-1-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-bg-gradient-1" />
    `);
    const megaBgGradient2Row = buildRow('<span class="st-hfmenu-row__labelbox"><span>Градієнт 2 Mega</span><span class="st-hfmenu-color-dot st-hfmenu-color-dot--gradient" data-role="mega-bg-gradient-2-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-bg-gradient-2" />
    `);
    const megaBgGradient3Row = buildRow('<span class="st-hfmenu-row__labelbox"><span>Градієнт 3 Mega</span><span class="st-hfmenu-color-dot st-hfmenu-color-dot--gradient" data-role="mega-bg-gradient-3-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-bg-gradient-3" />
    `);
    const megaBgOpacityRow = buildRow('Прозорість фону Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="100" step="1" data-act="mega-bg-opacity" />
        <span class="st-hfmenu-range__val" data-role="mega-bg-opacity-val">100%</span>
      </div>
    `);
    const megaPanelColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір блока Mega</span><span class="st-hfmenu-color-dot" data-role="mega-panel-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-panel-color" />
    `);
    const megaPanelOpacityRow = buildRow('Прозорість блока Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="100" step="1" data-act="mega-panel-opacity" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-opacity-val">100%</span>
      </div>
    `);
    const megaPanelBlurRow = buildRow('Розмитість блока Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="60" step="1" data-act="mega-panel-blur" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-blur-val">0px</span>
      </div>
    `);
    const megaPanelBlurRadiusRow = buildRow('Скруглення blur Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="80" step="1" data-act="mega-panel-blur-radius" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-blur-radius-val">18px</span>
      </div>
    `);
    const megaPanelBorderColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір рамки Mega</span><span class="st-hfmenu-color-dot" data-role="mega-panel-border-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-panel-border-color" />
    `);
    const megaPanelBorderOpacityRow = buildRow('Прозорість рамки Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="100" step="1" data-act="mega-panel-border-opacity" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-border-opacity-val">22%</span>
      </div>
    `);
    const megaPanelBorderWidthRow = buildRow('Товщина рамки Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="20" step="1" data-act="mega-panel-border-width" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-border-width-val">1px</span>
      </div>
    `);
    const megaPanelBorderRadiusRow = buildRow('Радіус рамки Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="80" step="1" data-act="mega-panel-border-radius" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-border-radius-val">18px</span>
      </div>
    `);
    const megaPanelRadiusRow = buildRow('Радіус блока Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="80" step="1" data-act="mega-panel-radius" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-radius-val">18px</span>
      </div>
    `);
    const megaPanelShadowColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір тіні Mega</span><span class="st-hfmenu-color-dot" data-role="mega-panel-shadow-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-panel-shadow-color" />
    `);
    const megaPanelShadowOpacityRow = buildRow('Прозорість тіні Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="100" step="1" data-act="mega-panel-shadow-opacity" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-shadow-opacity-val">42%</span>
      </div>
    `);
    const megaPanelShadowXRow = buildRow('Тінь Mega · X', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="-200" max="200" step="1" data-act="mega-panel-shadow-x" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-shadow-x-val">0px</span>
      </div>
    `);
    const megaPanelShadowYRow = buildRow('Тінь Mega · Y', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="-200" max="200" step="1" data-act="mega-panel-shadow-y" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-shadow-y-val">22px</span>
      </div>
    `);
    const megaPanelShadowBlurRow = buildRow('Розмиття тіні Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="300" step="1" data-act="mega-panel-shadow-blur" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-shadow-blur-val">48px</span>
      </div>
    `);
    const megaPanelShadowSpreadRow = buildRow('Розтягнення тіні Mega', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="-100" max="200" step="1" data-act="mega-panel-shadow-spread" />
        <span class="st-hfmenu-range__val" data-role="mega-panel-shadow-spread-val">0px</span>
      </div>
    `);
    const megaRadiusBlock = document.createElement('div');
    megaRadiusBlock.className = 'st-hfmenu-radiusbox';
    const megaRadiusCornersRow = buildRow('Кути радіуса Mega', `
      <div class="st-hfmenu-radius-corners" data-role="mega-radius-corners">
        <button class="st-hfmenu-radius-corner" type="button" data-act="mega-radius-corner" data-corner="tl" aria-label="Лівий верхній кут" aria-pressed="true"></button>
        <button class="st-hfmenu-radius-corner" type="button" data-act="mega-radius-corner" data-corner="tr" aria-label="Правий верхній кут" aria-pressed="true"></button>
        <button class="st-hfmenu-radius-corner" type="button" data-act="mega-radius-corner" data-corner="bl" aria-label="Лівий нижній кут" aria-pressed="true"></button>
        <button class="st-hfmenu-radius-corner" type="button" data-act="mega-radius-corner" data-corner="br" aria-label="Правий нижній кут" aria-pressed="true"></button>
      </div>
    `);
    const megaContentBlock = document.createElement('div');
    megaContentBlock.className = 'st-hfmenu-contentbox';
    const megaTitleColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір заголовків</span><span class="st-hfmenu-color-dot" data-role="mega-title-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-title-color" />
    `);
    const megaTitleSizeRow = buildRow('Розмір заголовків', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="10" max="48" step="1" data-act="mega-title-size" />
        <span class="st-hfmenu-range__val" data-role="mega-title-size-val">16px</span>
      </div>
    `);
    const megaTitleDividerColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір лінії заголовка</span><span class="st-hfmenu-color-dot" data-role="mega-title-divider-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-title-divider-color" />
    `);
    const megaTitleDividerOpacityRow = buildRow('Прозорість лінії', buildStackedRangeControl({ act: 'mega-title-divider-opacity', min: '0', max: '100', step: '1', value: '16', numberRole: 'mega-title-divider-opacity-num', valueRole: 'mega-title-divider-opacity-val' }));
    const megaTitleDividerWidthRow = buildRow('Товщина лінії', buildStackedRangeControl({ act: 'mega-title-divider-width', min: '0', max: '8', step: '1', value: '1', numberRole: 'mega-title-divider-width-num', valueRole: 'mega-title-divider-width-val' }));
    const megaTitleDividerRadiusRow = buildRow('Радіус лінії', buildStackedRangeControl({ act: 'mega-title-divider-radius', min: '0', max: '40', step: '1', value: '0', numberRole: 'mega-title-divider-radius-num', valueRole: 'mega-title-divider-radius-val' }));
    const megaTitleDividerModeRow = buildRow('Тип розділювача', `
      <div class="st-hfmenu-radio-group" data-role="mega-title-divider-mode">
        <label class="st-hfmenu-radio"><input type="radio" name="${SEC_ID}-mega-title-divider-mode" value="separate" data-act="mega-title-divider-mode" /> <span>Окремий блок + лінія</span></label>
        <label class="st-hfmenu-radio"><input type="radio" name="${SEC_ID}-mega-title-divider-mode" value="joined" data-act="mega-title-divider-mode" /> <span>Лінія = низ рамки</span></label>
        <label class="st-hfmenu-radio"><input type="radio" name="${SEC_ID}-mega-title-divider-mode" value="split-separate" data-act="mega-title-divider-mode" /> <span>Дві частини + нижня лінія</span></label>
      </div>
    `);
    const megaTitleGapRow = buildRow('Відступ після заголовка', buildStackedRangeControl({ act: 'mega-title-gap', min: '0', max: '48', step: '1', value: '12', numberRole: 'mega-title-gap-num', valueRole: 'mega-title-gap-val' }));
    const megaLinkColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Колір пунктів</span><span class="st-hfmenu-color-dot" data-role="mega-link-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-link-color" />
    `);
    const megaLinkSizeRow = buildRow('Розмір пунктів', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="10" max="40" step="1" data-act="mega-link-size" />
        <span class="st-hfmenu-range__val" data-role="mega-link-size-val">15px</span>
      </div>
    `);
    const megaLinkGapRow = buildRow('Відступ між пунктами', buildStackedRangeControl({ act: 'mega-link-gap', min: '0', max: '100', step: '1', value: '8', numberRole: 'mega-link-gap-num', valueRole: 'mega-link-gap-val' }));
    const megaLinkPadYRow = buildRow('Внутр. відступ Y', buildStackedRangeControl({ act: 'mega-link-pad-y', min: '0', max: '70', step: '1', value: '8', numberRole: 'mega-link-pad-y-num', valueRole: 'mega-link-pad-y-val' }));
    const megaLinkPadXRow = buildRow('Внутр. відступ X', buildStackedRangeControl({ act: 'mega-link-pad-x', min: '0', max: '100', step: '1', value: '10', numberRole: 'mega-link-pad-x-num', valueRole: 'mega-link-pad-x-val' }));
    const megaLinkRadiusRow = buildRow('Скруглення пунктів', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="32" step="1" data-act="mega-link-radius" />
        <span class="st-hfmenu-range__val" data-role="mega-link-radius-val">10px</span>
      </div>
    `);
    const megaLinkHoverColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Hover колір тексту</span><span class="st-hfmenu-color-dot" data-role="mega-link-hover-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-link-hover-color" />
    `);
    const megaLinkHoverBgColorRow = buildRow('<span class="st-hfmenu-row__labelbox"><span>Hover фон пунктів</span><span class="st-hfmenu-color-dot" data-role="mega-link-hover-bg-color-dot" aria-hidden="true"></span></span>', `
      <input class="st-hfmenu-color-input" type="color" data-act="mega-link-hover-bg-color" />
    `);
    const megaLinkHoverBgOpacityRow = buildRow('Прозорість hover фону', `
      <div class="st-hfmenu-range">
        <input class="st-inp" type="range" min="0" max="100" step="1" data-act="mega-link-hover-bg-opacity" />
        <span class="st-hfmenu-range__val" data-role="mega-link-hover-bg-opacity-val">10%</span>
      </div>
    `);
    const megaBgAngleRow = buildRow('Кут градієнта Mega', `
      <div class="st-hfmenu-angle-control">
        <div class="st-hfmenu-range">
          <input class="st-inp" type="range" min="0" max="360" step="1" data-act="mega-bg-angle" />
          <span class="st-hfmenu-range__val" data-role="mega-bg-angle-val">90°</span>
        </div>
        <div class="st-hfmenu-angle-stepper">
          <button class="st-btn st-btn--ghost st-hfmenu-angle-stepper__btn" type="button" data-act="mega-bg-angle-step" data-step="-1" aria-label="Зменшити кут градієнта">◀</button>
          <input class="st-inp st-hfmenu-angle-stepper__input" type="number" min="0" max="360" step="1" data-act="mega-bg-angle-number" />
          <span class="st-hfmenu-angle-stepper__unit">°</span>
          <button class="st-btn st-btn--ghost st-hfmenu-angle-stepper__btn" type="button" data-act="mega-bg-angle-step" data-step="1" aria-label="Збільшити кут градієнта">▶</button>
        </div>
      </div>
    `);
    const megaColsHint = document.createElement('div');
    megaColsHint.className = 'st-hfmenu-quick__hint';
    megaColsHint.style.display = 'none';
    megaColsHint.dataset.role = 'mega-cols-hint';
    megaWrap.appendChild(megaWidthModeRow);
    megaWrap.appendChild(megaCustomWidthRow);
    megaWrap.appendChild(megaPositionRow);
    megaWrap.appendChild(megaOffsetLeftRow);
    megaWrap.appendChild(megaOffsetRightRow);
    megaWrap.appendChild(megaColsModeRow);
    megaWrap.appendChild(megaColsCustomRow);
    megaWrap.appendChild(megaGapRow);
    megaWrap.appendChild(megaColMinWidthRow);
    megaWrap.appendChild(megaBgModeRow);
    megaWrap.appendChild(megaBgColorRow);
    megaWrap.appendChild(megaBgImageRow);
    megaWrap.appendChild(megaBgImageSizeRow);
    megaWrap.appendChild(megaBgImageScaleRow);
    megaWrap.appendChild(megaBgImageRepeatRow);
    megaWrap.appendChild(megaBgImagePositionRow);
    megaWrap.appendChild(megaBgImageCustomPosRow);
    megaWrap.appendChild(megaBgGradient1Row);
    megaWrap.appendChild(megaBgGradient2Row);
    megaWrap.appendChild(megaBgGradient3Row);
    megaWrap.appendChild(megaBgOpacityRow);
    megaWrap.appendChild(megaPanelColorRow);
    megaWrap.appendChild(megaPanelOpacityRow);
    megaWrap.appendChild(megaPanelBlurRow);
    megaContentBlock.innerHTML = `
      <div class="st-hfmenu-contentbox__title">Контент Mega · рівні</div>
      <div class="st-hfmenu-contentbox__sub">Вибір рівнів 1–10. 1 — головне меню, 2 — заголовки Mega, 3 — пункти Mega, далі — глибші рівні.</div>
      <div class="st-hfmenu-levelstyles__levels" data-role="mega-content-levels"></div>
      <div class="st-hfmenu-levelstyles__level-actions">
        <button class="st-btn" type="button" data-act="mega-content-select-all">Вибрати всі</button>
        <button class="st-btn" type="button" data-act="mega-content-clear-selection">Очистити вибір</button>
      </div>
      <div class="st-hfmenu-contentbox__sub">Текст / елемент рівня</div>
    `.trim();
    megaContentBlock.appendChild(megaLinkColorRow);
    megaContentBlock.appendChild(megaLinkSizeRow);
    megaContentBlock.appendChild(megaTitleDividerColorRow);
    megaContentBlock.appendChild(megaTitleDividerOpacityRow);
    megaContentBlock.appendChild(megaTitleDividerWidthRow);
    megaContentBlock.appendChild(megaTitleDividerRadiusRow);
    megaContentBlock.appendChild(megaTitleGapRow);
    megaContentBlock.appendChild(megaLinkGapRow);
    megaContentBlock.appendChild(megaLinkPadYRow);
    megaContentBlock.appendChild(megaLinkPadXRow);
    megaContentBlock.appendChild(megaLinkRadiusRow);
    const megaContentHoverSub = document.createElement('div');
    megaContentHoverSub.className = 'st-hfmenu-contentbox__sub';
    megaContentHoverSub.textContent = 'Hover / Open / Current';
    megaContentBlock.appendChild(megaContentHoverSub);
    megaContentBlock.appendChild(megaLinkHoverColorRow);
    megaContentBlock.appendChild(megaLinkHoverBgColorRow);
    megaContentBlock.appendChild(megaLinkHoverBgOpacityRow);
    megaRadiusBlock.innerHTML = '<div class="st-hfmenu-radiusbox__title">Радіус Mega</div>';
    megaRadiusBlock.appendChild(megaRadiusCornersRow);
    megaRadiusBlock.appendChild(megaPanelBlurRadiusRow);
    megaRadiusBlock.appendChild(megaPanelBorderRadiusRow);
    megaRadiusBlock.appendChild(megaPanelRadiusRow);
    megaWrap.appendChild(megaRadiusBlock);
    megaWrap.appendChild(megaPanelBorderColorRow);
    megaWrap.appendChild(megaPanelBorderOpacityRow);
    megaWrap.appendChild(megaPanelBorderWidthRow);
    megaWrap.appendChild(megaPanelShadowColorRow);
    megaWrap.appendChild(megaPanelShadowOpacityRow);
    megaWrap.appendChild(megaPanelShadowXRow);
    megaWrap.appendChild(megaPanelShadowYRow);
    megaWrap.appendChild(megaPanelShadowBlurRow);
    megaWrap.appendChild(megaPanelShadowSpreadRow);
    megaWrap.appendChild(megaBgAngleRow);
    megaWrap.appendChild(megaColsHint);

    const levelsHint = document.createElement('div');
    levelsHint.className = 'st-hfmenu-quick__hint';
    levelsHint.textContent = 'На цьому етапі додаємо базову поведінку вже існуючих підрівнів, точне позиціонування 2 рівня і flyout для 3+ рівня: режим відкриття, вигляд (у т.ч. Mega Panel Basic), стрілка, прив’язка підменю, відступ зверху, ширини та напрям для 1 / 2 / 3+ рівня, а також позицію і геометрію 3+ рівня.';
    levelsWrap.appendChild(levelsHint);

    const settingsModeInput = settingsModeRow.querySelector('input[data-act="menu-settings-mode"]');
    const modeSelect = modeRow.querySelector('select[data-act="submenu-mode"]');
    const viewSelect = viewRow.querySelector('select[data-act="submenu-view"]');
    const arrowSelect = arrowRow.querySelector('select[data-act="submenu-arrow"]');
    const alignSelect = alignRow.querySelector('select[data-act="submenu-align"]');
    const offsetInput = offsetRow.querySelector('input[data-act="submenu-offset-y"]');
    const minWidthInput = minWidthRow.querySelector('input[data-act="submenu-min-width"]');
    const widthModeSelect = widthModeRow.querySelector('select[data-act="submenu-width-mode"]');
    const customWidthInput = customWidthRow.querySelector('input[data-act="submenu-custom-width"]');
    const megaWidthModeSelect = megaWidthModeRow.querySelector('select[data-act="mega-width-mode"]');
    const megaCustomWidthInput = megaCustomWidthRow.querySelector('input[data-act="mega-custom-width"]');
    const megaPositionSelect = megaPositionRow.querySelector('select[data-act="mega-position"]');
    const megaOffsetLeftInput = megaOffsetLeftRow.querySelector('input[data-act="mega-offset-left"]');
    const megaOffsetRightInput = megaOffsetRightRow.querySelector('input[data-act="mega-offset-right"]');
    const megaColsModeSelect = megaColsModeRow.querySelector('select[data-act="mega-cols-mode"]');
    const megaColsCustomInput = megaColsCustomRow.querySelector('input[data-act="mega-cols-custom"]');
    const megaGapInput = megaGapRow.querySelector('input[data-act="mega-gap"]');
    const megaColMinWidthInput = megaColMinWidthRow.querySelector('input[data-act="mega-col-minw"]');
    const megaBgModeSelect = megaBgModeRow.querySelector('select[data-act="mega-bg-mode"]');
    const megaBgColorInput = megaBgColorRow.querySelector('input[data-act="mega-bg-color"]');
    const megaBgColorDot = megaBgColorRow.querySelector('[data-role="mega-bg-color-dot"]');
    const megaBgImageInput = megaBgImageRow.querySelector('input[data-act="mega-bg-image"]');
    const megaBgImagePreview = megaBgImageRow.querySelector('[data-role="mega-bg-image-preview"]');
    const megaBgImagePreviewImg = megaBgImageRow.querySelector('[data-role="mega-bg-image-preview-img"]');
    const megaBgImagePreviewPath = megaBgImageRow.querySelector('[data-role="mega-bg-image-preview-path"]');
    const megaBgPickButtons = Array.from(megaBgImageRow.querySelectorAll('button[data-act="mega-bg-pick-image"]'));
    const megaBgSizeSelect = megaBgImageSizeRow.querySelector('select[data-act="mega-bg-size"]');
    const megaBgScaleInput = megaBgImageScaleRow.querySelector('input[data-act="mega-bg-scale"]');
    const megaBgScaleVal = megaBgImageScaleRow.querySelector('[data-role="mega-bg-scale-val"]');
    const megaBgRepeatSelect = megaBgImageRepeatRow.querySelector('select[data-act="mega-bg-repeat"]');
    const megaBgPositionSelect = megaBgImagePositionRow.querySelector('select[data-act="mega-bg-position"]');
    const megaBgPosXInput = megaBgImageCustomPosRow.querySelector('input[data-act="mega-bg-pos-x"]');
    const megaBgPosYInput = megaBgImageCustomPosRow.querySelector('input[data-act="mega-bg-pos-y"]');
    const megaBgGradient1Input = megaBgGradient1Row.querySelector('input[data-act="mega-bg-gradient-1"]');
    const megaBgGradient1Dot = megaBgGradient1Row.querySelector('[data-role="mega-bg-gradient-1-dot"]');
    const megaBgGradient2Input = megaBgGradient2Row.querySelector('input[data-act="mega-bg-gradient-2"]');
    const megaBgGradient2Dot = megaBgGradient2Row.querySelector('[data-role="mega-bg-gradient-2-dot"]');
    const megaBgGradient3Input = megaBgGradient3Row.querySelector('input[data-act="mega-bg-gradient-3"]');
    const megaBgGradient3Dot = megaBgGradient3Row.querySelector('[data-role="mega-bg-gradient-3-dot"]');
    const megaBgOpacityInput = megaBgOpacityRow.querySelector('input[data-act="mega-bg-opacity"]');
    const megaBgOpacityVal = megaBgOpacityRow.querySelector('[data-role="mega-bg-opacity-val"]');
    const megaPanelColorInput = megaPanelColorRow.querySelector('input[data-act="mega-panel-color"]');
    const megaPanelColorDot = megaPanelColorRow.querySelector('[data-role="mega-panel-color-dot"]');
    const megaPanelOpacityInput = megaPanelOpacityRow.querySelector('input[data-act="mega-panel-opacity"]');
    const megaPanelOpacityVal = megaPanelOpacityRow.querySelector('[data-role="mega-panel-opacity-val"]');
    const megaPanelBlurInput = megaPanelBlurRow.querySelector('input[data-act="mega-panel-blur"]');
    const megaPanelBlurVal = megaPanelBlurRow.querySelector('[data-role="mega-panel-blur-val"]');
    const megaRadiusCornersWrap = megaRadiusCornersRow.querySelector('[data-role="mega-radius-corners"]');
    const megaRadiusCornerButtons = Array.from(megaRadiusCornersRow.querySelectorAll('button[data-act="mega-radius-corner"]'));
    const megaPanelBlurRadiusInput = megaPanelBlurRadiusRow.querySelector('input[data-act="mega-panel-blur-radius"]');
    const megaPanelBlurRadiusVal = megaPanelBlurRadiusRow.querySelector('[data-role="mega-panel-blur-radius-val"]');
    const megaPanelBorderColorInput = megaPanelBorderColorRow.querySelector('input[data-act="mega-panel-border-color"]');
    const megaPanelBorderColorDot = megaPanelBorderColorRow.querySelector('[data-role="mega-panel-border-color-dot"]');
    const megaPanelBorderOpacityInput = megaPanelBorderOpacityRow.querySelector('input[data-act="mega-panel-border-opacity"]');
    const megaPanelBorderOpacityVal = megaPanelBorderOpacityRow.querySelector('[data-role="mega-panel-border-opacity-val"]');
    const megaPanelBorderWidthInput = megaPanelBorderWidthRow.querySelector('input[data-act="mega-panel-border-width"]');
    const megaPanelBorderWidthVal = megaPanelBorderWidthRow.querySelector('[data-role="mega-panel-border-width-val"]');
    const megaPanelBorderRadiusInput = megaPanelBorderRadiusRow.querySelector('input[data-act="mega-panel-border-radius"]');
    const megaPanelBorderRadiusVal = megaPanelBorderRadiusRow.querySelector('[data-role="mega-panel-border-radius-val"]');
    const megaPanelRadiusInput = megaPanelRadiusRow.querySelector('input[data-act="mega-panel-radius"]');
    const megaPanelRadiusVal = megaPanelRadiusRow.querySelector('[data-role="mega-panel-radius-val"]');
    const megaPanelShadowColorInput = megaPanelShadowColorRow.querySelector('input[data-act="mega-panel-shadow-color"]');
    const megaPanelShadowColorDot = megaPanelShadowColorRow.querySelector('[data-role="mega-panel-shadow-color-dot"]');
    const megaPanelShadowOpacityInput = megaPanelShadowOpacityRow.querySelector('input[data-act="mega-panel-shadow-opacity"]');
    const megaPanelShadowOpacityVal = megaPanelShadowOpacityRow.querySelector('[data-role="mega-panel-shadow-opacity-val"]');
    const megaPanelShadowXInput = megaPanelShadowXRow.querySelector('input[data-act="mega-panel-shadow-x"]');
    const megaPanelShadowXVal = megaPanelShadowXRow.querySelector('[data-role="mega-panel-shadow-x-val"]');
    const megaPanelShadowYInput = megaPanelShadowYRow.querySelector('input[data-act="mega-panel-shadow-y"]');
    const megaPanelShadowYVal = megaPanelShadowYRow.querySelector('[data-role="mega-panel-shadow-y-val"]');
    const megaPanelShadowBlurInput = megaPanelShadowBlurRow.querySelector('input[data-act="mega-panel-shadow-blur"]');
    const megaPanelShadowBlurVal = megaPanelShadowBlurRow.querySelector('[data-role="mega-panel-shadow-blur-val"]');
    const megaPanelShadowSpreadInput = megaPanelShadowSpreadRow.querySelector('input[data-act="mega-panel-shadow-spread"]');
    const megaPanelShadowSpreadVal = megaPanelShadowSpreadRow.querySelector('[data-role="mega-panel-shadow-spread-val"]');
    const megaTitleColorInput = megaTitleColorRow.querySelector('input[data-act="mega-title-color"]');
    const megaTitleColorDot = megaTitleColorRow.querySelector('[data-role="mega-title-color-dot"]');
    const megaTitleSizeInput = megaTitleSizeRow.querySelector('input[data-act="mega-title-size"]');
    const megaTitleSizeVal = megaTitleSizeRow.querySelector('[data-role="mega-title-size-val"]');
    const megaTitleDividerColorInput = megaTitleDividerColorRow.querySelector('input[data-act="mega-title-divider-color"]');
    const megaTitleDividerColorDot = megaTitleDividerColorRow.querySelector('[data-role="mega-title-divider-color-dot"]');
    const megaTitleDividerOpacityInput = megaTitleDividerOpacityRow.querySelector('input[data-act="mega-title-divider-opacity"]');
    const megaTitleDividerOpacityNumInput = megaTitleDividerOpacityRow.querySelector('input[data-role="mega-title-divider-opacity-num"]');
    const megaTitleDividerOpacityVal = megaTitleDividerOpacityRow.querySelector('[data-role="mega-title-divider-opacity-val"]');
    const megaTitleDividerWidthInput = megaTitleDividerWidthRow.querySelector('input[data-act="mega-title-divider-width"]');
    const megaTitleDividerWidthNumInput = megaTitleDividerWidthRow.querySelector('input[data-role="mega-title-divider-width-num"]');
    const megaTitleDividerWidthVal = megaTitleDividerWidthRow.querySelector('[data-role="mega-title-divider-width-val"]');
    const megaTitleDividerRadiusInput = megaTitleDividerRadiusRow.querySelector('input[data-act="mega-title-divider-radius"]');
    const megaTitleDividerRadiusNumInput = megaTitleDividerRadiusRow.querySelector('input[data-role="mega-title-divider-radius-num"]');
    const megaTitleDividerRadiusVal = megaTitleDividerRadiusRow.querySelector('[data-role="mega-title-divider-radius-val"]');
    const megaTitleDividerModeInputs = Array.from(megaTitleDividerModeRow.querySelectorAll('input[data-act="mega-title-divider-mode"]'));
    const megaTitleGapInput = megaTitleGapRow.querySelector('input[data-act="mega-title-gap"]');
    const megaTitleGapNumInput = megaTitleGapRow.querySelector('input[data-role="mega-title-gap-num"]');
    const megaTitleGapVal = megaTitleGapRow.querySelector('[data-role="mega-title-gap-val"]');
    const megaLinkColorInput = megaLinkColorRow.querySelector('input[data-act="mega-link-color"]');
    const megaLinkColorDot = megaLinkColorRow.querySelector('[data-role="mega-link-color-dot"]');
    const megaLinkSizeInput = megaLinkSizeRow.querySelector('input[data-act="mega-link-size"]');
    const megaLinkSizeVal = megaLinkSizeRow.querySelector('[data-role="mega-link-size-val"]');
    const megaLinkGapInput = megaLinkGapRow.querySelector('input[data-act="mega-link-gap"]');
    const megaLinkGapNumInput = megaLinkGapRow.querySelector('input[data-role="mega-link-gap-num"]');
    const megaLinkGapVal = megaLinkGapRow.querySelector('[data-role="mega-link-gap-val"]');
    const megaLinkPadYInput = megaLinkPadYRow.querySelector('input[data-act="mega-link-pad-y"]');
    const megaLinkPadYNumInput = megaLinkPadYRow.querySelector('input[data-role="mega-link-pad-y-num"]');
    const megaLinkPadYVal = megaLinkPadYRow.querySelector('[data-role="mega-link-pad-y-val"]');
    const megaLinkPadXInput = megaLinkPadXRow.querySelector('input[data-act="mega-link-pad-x"]');
    const megaLinkPadXNumInput = megaLinkPadXRow.querySelector('input[data-role="mega-link-pad-x-num"]');
    const megaLinkPadXVal = megaLinkPadXRow.querySelector('[data-role="mega-link-pad-x-val"]');
    const megaLinkRadiusInput = megaLinkRadiusRow.querySelector('input[data-act="mega-link-radius"]');
    const megaLinkRadiusVal = megaLinkRadiusRow.querySelector('[data-role="mega-link-radius-val"]');
    const megaLinkHoverColorInput = megaLinkHoverColorRow.querySelector('input[data-act="mega-link-hover-color"]');
    const megaLinkHoverColorDot = megaLinkHoverColorRow.querySelector('[data-role="mega-link-hover-color-dot"]');
    const megaLinkHoverBgColorInput = megaLinkHoverBgColorRow.querySelector('input[data-act="mega-link-hover-bg-color"]');
    const megaLinkHoverBgColorDot = megaLinkHoverBgColorRow.querySelector('[data-role="mega-link-hover-bg-color-dot"]');
    const megaLinkHoverBgOpacityInput = megaLinkHoverBgOpacityRow.querySelector('input[data-act="mega-link-hover-bg-opacity"]');
    const megaLinkHoverBgOpacityVal = megaLinkHoverBgOpacityRow.querySelector('[data-role="mega-link-hover-bg-opacity-val"]');
    const megaBgAngleInput = megaBgAngleRow.querySelector('input[data-act="mega-bg-angle"]');
    const megaBgAngleVal = megaBgAngleRow.querySelector('[data-role="mega-bg-angle-val"]');
    const megaBgAngleNumberInput = megaBgAngleRow.querySelector('input[data-act="mega-bg-angle-number"]');
    const megaBgAngleStepButtons = Array.from(megaBgAngleRow.querySelectorAll('button[data-act="mega-bg-angle-step"]'));
    const megaColsHintEl = megaWrap.querySelector('[data-role="mega-cols-hint"]');
    const megaContentLevelsHost = megaContentBlock.querySelector('[data-role="mega-content-levels"]');
    const megaContentSelectAllBtn = megaContentBlock.querySelector('[data-act="mega-content-select-all"]');
    const megaContentClearSelectionBtn = megaContentBlock.querySelector('[data-act="mega-content-clear-selection"]');
    const level1DirSelect = level1DirRow.querySelector('select[data-act="menu-level1-direction"]');
    const level2DirSelect = level2DirRow.querySelector('select[data-act="menu-level2-direction"]');
    const level3DirSelect = level3DirRow.querySelector('select[data-act="menu-level3-direction"]');
    const level3PosSelect = level3PosRow.querySelector('select[data-act="menu-level3-position"]');
    const level3OffsetXInput = level3OffsetXRow.querySelector('input[data-act="menu-level3-offset-x"]');
    const level3OffsetYInput = level3OffsetYRow.querySelector('input[data-act="menu-level3-offset-y"]');
    const level3MinWidthInput = level3MinWidthRow.querySelector('input[data-act="menu-level3-min-width"]');
    const level3WidthModeSelect = level3WidthModeRow.querySelector('select[data-act="menu-level3-width-mode"]');
    const level3CustomWidthInput = level3CustomWidthRow.querySelector('input[data-act="menu-level3-custom-width"]');
    const menuRootJustifySelect = menuRootJustifyRow.querySelector('select[data-act="menu-root-justify"]');
    const menuRootAlignSelect = menuRootAlignRow.querySelector('select[data-act="menu-root-align"]');
    const menuRootGapInput = menuRootGapRow.querySelector('input[data-act="menu-root-gap"]');
    const menuRootPadXInput = menuRootPadXRow.querySelector('input[data-act="menu-root-pad-x"]');
    const menuRootPadYInput = menuRootPadYRow.querySelector('input[data-act="menu-root-pad-y"]');

    if (settingsModeInput) settingsModeInput.checked = normalizeSettingsMode(data.menuSettingsMode) === '1';
    if (menuRootJustifySelect) menuRootJustifySelect.value = normalizeMenuRootJustify(data.menuRootJustify);
    if (menuRootAlignSelect) menuRootAlignSelect.value = normalizeMenuRootAlign(data.menuRootAlign);
    if (menuRootGapInput) {
      const l1RootGap = getLevelContentLayoutStyle(normalizeLevelContentLayoutStyles(data.levelContentLayoutStyles), 1).gap || data.menuRootGap;
      menuRootGapInput.value = normalizeMenuRootGap(l1RootGap);
    }
    if (menuRootPadXInput) menuRootPadXInput.value = normalizeMenuRootPad(data.menuRootPadX, '0');
    if (menuRootPadYInput) menuRootPadYInput.value = normalizeMenuRootPad(data.menuRootPadY, '0');
    const setSimpleRowLabel = (rowEl, text) => {
      const labelEl = rowEl instanceof HTMLElement ? rowEl.querySelector('.st-hfmenu-row__label') : null;
      if (labelEl) labelEl.textContent = text;
      const firstBoxText = rowEl instanceof HTMLElement ? rowEl.querySelector('.st-hfmenu-row__labelbox > span:first-child') : null;
      if (firstBoxText) firstBoxText.textContent = text;
    };
    setSimpleRowLabel(megaLinkColorRow, 'Колір тексту рівня');
    setSimpleRowLabel(megaLinkSizeRow, 'Розмір тексту рівня');
    setSimpleRowLabel(megaTitleDividerColorRow, 'Колір розділювача');
    setSimpleRowLabel(megaTitleDividerOpacityRow, 'Прозорість розділювача');
    setSimpleRowLabel(megaTitleDividerWidthRow, 'Товщина розділювача');
    setSimpleRowLabel(megaTitleDividerRadiusRow, 'Радіус розділювача');
    setSimpleRowLabel(megaTitleDividerModeRow, 'Тип розділювача');
    setSimpleRowLabel(megaTitleGapRow, 'Відступ після рівня з підменю');
    setSimpleRowLabel(megaLinkGapRow, 'Відступ між пунктами');
    setSimpleRowLabel(megaLinkPadYRow, 'Внутрішній відступ Y');
    setSimpleRowLabel(megaLinkPadXRow, 'Внутрішній відступ X');
    setSimpleRowLabel(megaLinkRadiusRow, 'Скруглення елемента');
    if (modeSelect) modeSelect.value = normalizeSubmenuMode(data.submenuMode);
    if (viewSelect) viewSelect.value = normalizeSubmenuView(data.submenuView);
    if (arrowSelect) arrowSelect.value = normalizeSubmenuArrow(data.submenuArrow);
    if (alignSelect) alignSelect.value = normalizeSubmenuAlign(data.submenuAlign);
    if (offsetInput) offsetInput.value = normalizeSubmenuOffsetY(data.submenuOffsetY);
    if (minWidthInput) minWidthInput.value = normalizeSubmenuMinWidth(data.submenuMinWidth);
    if (widthModeSelect) widthModeSelect.value = normalizeSubmenuWidthMode(data.submenuWidthMode);
    if (customWidthInput) customWidthInput.value = normalizeSubmenuCustomWidth(data.submenuCustomWidth);
    if (megaWidthModeSelect) megaWidthModeSelect.value = normalizeSubmenuWidthMode(data.submenuWidthMode);
    if (megaCustomWidthInput) megaCustomWidthInput.value = normalizeSubmenuCustomWidth(data.submenuCustomWidth);
    if (megaPositionSelect) megaPositionSelect.value = normalizeMegaPosition(data.menuMegaPosition);
    if (megaOffsetLeftInput) megaOffsetLeftInput.value = normalizeMegaSideOffset(data.menuMegaOffsetLeft);
    if (megaOffsetRightInput) megaOffsetRightInput.value = normalizeMegaSideOffset(data.menuMegaOffsetRight);
    if (megaColsModeSelect) megaColsModeSelect.value = normalizeMegaColsMode(data.menuMegaCols);
    if (megaColsCustomInput) megaColsCustomInput.value = normalizeMegaColsCustom(data.menuMegaColsCustom);
    if (megaGapInput) megaGapInput.value = normalizeMegaColGap(data.menuMegaGap);
    if (megaColMinWidthInput) megaColMinWidthInput.value = normalizeMegaColMinWidth(data.menuMegaColMinWidth);
    if (megaBgModeSelect) megaBgModeSelect.value = normalizeMegaBgMode(data.menuMegaBgMode);
    const megaBgColorSafe = normalizeMegaBgColor(data.menuMegaBgColor, '#020617');
    if (megaBgColorInput) megaBgColorInput.value = megaBgColorSafe;
    if (megaBgColorDot) megaBgColorDot.style.background = megaBgColorSafe;
    const syncMegaRadiusCornerButtons = (bits) => {
      const normalizedBits = normalizeMegaRadiusCorners(bits, data.menuMegaRadiusCorners || '1111');
      const state = parseMegaRadiusCorners(normalizedBits);
      megaRadiusCornerButtons.forEach((btn) => {
        const corner = String(btn.getAttribute('data-corner') || '');
        const active = corner === 'tr' ? state.tr : corner === 'br' ? state.br : corner === 'bl' ? state.bl : state.tl;
        setMegaCornerToggleState(btn, active);
      });
      if (megaRadiusCornersWrap instanceof HTMLElement) megaRadiusCornersWrap.setAttribute('data-corners', normalizedBits);
      return normalizedBits;
    };
    data.menuMegaRadiusCorners = syncMegaRadiusCornerButtons(data.menuMegaRadiusCorners || '1111');
    let megaBgImageStable = recallMegaBgImage(blk, data.menuMegaBgImage);
    if (megaBgImageInput) {
      megaBgImageInput.value = megaBgImageStable;
      megaBgImageInput.dataset.assetUrl = megaBgImageStable;
    }
    updateMegaBgImagePreview(megaBgImageStable);
    const megaBgSizeSafe = normalizeMegaBgSizeMode(data.menuMegaBgSize);
    const megaBgScaleSafe = normalizeMegaBgScale(data.menuMegaBgScale);
    const megaBgRepeatSafe = normalizeMegaBgRepeat(data.menuMegaBgRepeat);
    const megaBgPositionSafe = normalizeMegaBgPosition(data.menuMegaBgPosition);
    const megaBgPosXSafe = normalizeMegaBgPosPercent(data.menuMegaBgPosX, '50');
    const megaBgPosYSafe = normalizeMegaBgPosPercent(data.menuMegaBgPosY, '50');
    if (megaBgSizeSelect) megaBgSizeSelect.value = megaBgSizeSafe;
    if (megaBgScaleInput) megaBgScaleInput.value = megaBgScaleSafe;
    if (megaBgScaleVal) megaBgScaleVal.textContent = `${megaBgScaleSafe}%`;
    if (megaBgRepeatSelect) megaBgRepeatSelect.value = megaBgRepeatSafe;
    if (megaBgPositionSelect) megaBgPositionSelect.value = megaBgPositionSafe;
    if (megaBgPosXInput) megaBgPosXInput.value = megaBgPosXSafe;
    if (megaBgPosYInput) megaBgPosYInput.value = megaBgPosYSafe;
    const megaTitleColorSafe = normalizeMegaTitleColor(data.menuMegaTitleColor, '#f8fafc');
    if (megaTitleColorInput) megaTitleColorInput.value = megaTitleColorSafe;
    if (megaTitleColorDot) megaTitleColorDot.style.background = megaTitleColorSafe;
    const megaTitleSizeSafe = normalizeMegaTitleSize(data.menuMegaTitleSize, '16');
    if (megaTitleSizeInput) megaTitleSizeInput.value = megaTitleSizeSafe;
    if (megaTitleSizeVal) megaTitleSizeVal.textContent = `${megaTitleSizeSafe}px`;
    const megaTitleDividerColorSafe = normalizeMegaTitleDividerColor(data.menuMegaTitleDividerColor, '#94a3b8');
    if (megaTitleDividerColorInput) megaTitleDividerColorInput.value = megaTitleDividerColorSafe;
    if (megaTitleDividerColorDot) megaTitleDividerColorDot.style.background = megaTitleDividerColorSafe;
    const megaTitleDividerOpacitySafe = normalizeMegaTitleDividerOpacity(data.menuMegaTitleDividerOpacity, '16');
    if (megaTitleDividerOpacityInput) megaTitleDividerOpacityInput.value = megaTitleDividerOpacitySafe;
    if (megaTitleDividerOpacityNumInput) megaTitleDividerOpacityNumInput.value = megaTitleDividerOpacitySafe;
    if (megaTitleDividerOpacityVal) megaTitleDividerOpacityVal.textContent = `${megaTitleDividerOpacitySafe}%`;
    const megaTitleDividerWidthSafe = normalizeMegaTitleDividerWidth(data.menuMegaTitleDividerWidth, '1');
    if (megaTitleDividerWidthInput) megaTitleDividerWidthInput.value = megaTitleDividerWidthSafe;
    if (megaTitleDividerWidthNumInput) megaTitleDividerWidthNumInput.value = megaTitleDividerWidthSafe;
    if (megaTitleDividerWidthVal) megaTitleDividerWidthVal.textContent = `${megaTitleDividerWidthSafe}px`;
    const megaTitleDividerRadiusSafe = clampMegaInt(data.menuMegaTitleDividerRadius, 0, 40, 0);
    if (megaTitleDividerRadiusInput) megaTitleDividerRadiusInput.value = megaTitleDividerRadiusSafe;
    if (megaTitleDividerRadiusNumInput) megaTitleDividerRadiusNumInput.value = megaTitleDividerRadiusSafe;
    if (megaTitleDividerRadiusVal) megaTitleDividerRadiusVal.textContent = `${megaTitleDividerRadiusSafe}px`;
    const megaTitleGapSafe = normalizeMegaTitleGap(data.menuMegaTitleGap, '12');
    if (megaTitleGapInput) megaTitleGapInput.value = megaTitleGapSafe;
    if (megaTitleGapNumInput) megaTitleGapNumInput.value = megaTitleGapSafe;
    if (megaTitleGapVal) megaTitleGapVal.textContent = `${megaTitleGapSafe}px`;
    const megaLinkColorSafe = normalizeMegaLinkColor(data.menuMegaLinkColor, '#e2e8f0');
    if (megaLinkColorInput) megaLinkColorInput.value = megaLinkColorSafe;
    if (megaLinkColorDot) megaLinkColorDot.style.background = megaLinkColorSafe;
    const megaLinkSizeSafe = normalizeMegaLinkSize(data.menuMegaLinkSize, '15');
    if (megaLinkSizeInput) megaLinkSizeInput.value = megaLinkSizeSafe;
    if (megaLinkSizeVal) megaLinkSizeVal.textContent = `${megaLinkSizeSafe}px`;
    const megaLinkGapSafe = normalizeMegaLinkGap(data.menuMegaLinkGap, '8');
    if (megaLinkGapInput) megaLinkGapInput.value = megaLinkGapSafe;
    if (megaLinkGapNumInput) megaLinkGapNumInput.value = megaLinkGapSafe;
    if (megaLinkGapVal) megaLinkGapVal.textContent = `${megaLinkGapSafe}px`;
    const megaLinkPadYSafe = normalizeMegaLinkPadY(data.menuMegaLinkPadY, '8');
    if (megaLinkPadYInput) megaLinkPadYInput.value = megaLinkPadYSafe;
    if (megaLinkPadYNumInput) megaLinkPadYNumInput.value = megaLinkPadYSafe;
    if (megaLinkPadYVal) megaLinkPadYVal.textContent = `${megaLinkPadYSafe}px`;
    const megaLinkPadXSafe = normalizeMegaLinkPadX(data.menuMegaLinkPadX, '10');
    if (megaLinkPadXInput) megaLinkPadXInput.value = megaLinkPadXSafe;
    if (megaLinkPadXNumInput) megaLinkPadXNumInput.value = megaLinkPadXSafe;
    if (megaLinkPadXVal) megaLinkPadXVal.textContent = `${megaLinkPadXSafe}px`;
    const megaLinkRadiusSafe = normalizeMegaLinkRadius(data.menuMegaLinkRadius, '10');
    if (megaLinkRadiusInput) megaLinkRadiusInput.value = megaLinkRadiusSafe;
    if (megaLinkRadiusVal) megaLinkRadiusVal.textContent = `${megaLinkRadiusSafe}px`;
    const megaLinkHoverColorSafe = normalizeMegaLinkHoverColor(data.menuMegaLinkHoverColor, '#ffffff');
    if (megaLinkHoverColorInput) megaLinkHoverColorInput.value = megaLinkHoverColorSafe;
    if (megaLinkHoverColorDot) megaLinkHoverColorDot.style.background = megaLinkHoverColorSafe;
    const megaLinkHoverBgColorSafe = normalizeMegaLinkHoverBgColor(data.menuMegaLinkHoverBgColor, '#38bdf8');
    if (megaLinkHoverBgColorInput) megaLinkHoverBgColorInput.value = megaLinkHoverBgColorSafe;
    if (megaLinkHoverBgColorDot) megaLinkHoverBgColorDot.style.background = megaLinkHoverBgColorSafe;
    const megaLinkHoverBgOpacitySafe = normalizeMegaLinkHoverBgOpacity(data.menuMegaLinkHoverBgOpacity, '10');
    if (megaLinkHoverBgOpacityInput) megaLinkHoverBgOpacityInput.value = megaLinkHoverBgOpacitySafe;
    if (megaLinkHoverBgOpacityVal) megaLinkHoverBgOpacityVal.textContent = `${megaLinkHoverBgOpacitySafe}%`;
    const megaBgGradient1Safe = normalizeMegaBgColor(data.menuMegaBgGradient1, '#020617');
    const megaBgGradient2Safe = normalizeMegaBgColor(data.menuMegaBgGradient2, '#0f172a');
    const megaBgGradient3Safe = normalizeMegaBgColor(data.menuMegaBgGradient3, '#1e293b');
    if (megaBgGradient1Input) megaBgGradient1Input.value = megaBgGradient1Safe;
    if (megaBgGradient1Dot) megaBgGradient1Dot.style.background = megaBgGradient1Safe;
    if (megaBgGradient2Input) megaBgGradient2Input.value = megaBgGradient2Safe;
    if (megaBgGradient2Dot) megaBgGradient2Dot.style.background = megaBgGradient2Safe;
    if (megaBgGradient3Input) megaBgGradient3Input.value = megaBgGradient3Safe;
    if (megaBgGradient3Dot) megaBgGradient3Dot.style.background = megaBgGradient3Safe;
    if (megaBgOpacityInput) megaBgOpacityInput.value = normalizeMegaBgOpacity(data.menuMegaBgOpacity);
    if (megaBgOpacityVal) megaBgOpacityVal.textContent = `${normalizeMegaBgOpacity(data.menuMegaBgOpacity)}%`;
    const megaPanelColorSafe = normalizeMegaPanelColor(data.menuMegaPanelColor, '#020617');
    if (megaPanelColorInput) megaPanelColorInput.value = megaPanelColorSafe;
    if (megaPanelColorDot) megaPanelColorDot.style.background = megaPanelColorSafe;
    const megaPanelOpacitySafe = normalizeMegaPanelOpacity(data.menuMegaPanelSurfaceOpacity, '100');
    if (megaPanelOpacityInput) megaPanelOpacityInput.value = megaPanelOpacitySafe;
    if (megaPanelOpacityVal) megaPanelOpacityVal.textContent = `${megaPanelOpacitySafe}%`;
    const megaPanelBlurSafe = normalizeMegaPanelBlur(data.menuMegaPanelBlur, '0');
    if (megaPanelBlurInput) megaPanelBlurInput.value = megaPanelBlurSafe;
    if (megaPanelBlurVal) megaPanelBlurVal.textContent = `${megaPanelBlurSafe}px`;
    data.menuMegaRadiusCorners = normalizeMegaRadiusCorners(data.menuMegaRadiusCorners, '1111');
    data.menuMegaPanelBlurCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBlurCornerValues, data.menuMegaPanelBlurRadius || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
    data.menuMegaPanelBorderCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBorderCornerValues, data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
    data.menuMegaPanelCornerValues = normalizeMegaCornerValues(data.menuMegaPanelCornerValues, data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
    const megaPanelBlurRadiusSafe = normalizeMegaPanelBlurRadius(pickMegaCornerValueForSelection(data.menuMegaPanelBlurCornerValues, data.menuMegaRadiusCorners, data.menuMegaPanelBlurRadius || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners), data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18');
    data.menuMegaPanelBlurRadius = megaPanelBlurRadiusSafe;
    if (megaPanelBlurRadiusInput) megaPanelBlurRadiusInput.value = megaPanelBlurRadiusSafe;
    if (megaPanelBlurRadiusVal) megaPanelBlurRadiusVal.textContent = `${megaPanelBlurRadiusSafe}px`;
    const megaPanelBorderColorSafe = normalizeMegaPanelBorderColor(data.menuMegaPanelBorderColor, '#94a3b8');
    if (megaPanelBorderColorInput) megaPanelBorderColorInput.value = megaPanelBorderColorSafe;
    if (megaPanelBorderColorDot) megaPanelBorderColorDot.style.background = megaPanelBorderColorSafe;
    const megaPanelBorderOpacitySafe = normalizeMegaPanelBorderOpacity(data.menuMegaPanelBorderOpacity, '22');
    if (megaPanelBorderOpacityInput) megaPanelBorderOpacityInput.value = megaPanelBorderOpacitySafe;
    if (megaPanelBorderOpacityVal) megaPanelBorderOpacityVal.textContent = `${megaPanelBorderOpacitySafe}%`;
    const megaPanelBorderWidthSafe = normalizeMegaPanelBorderWidth(data.menuMegaPanelBorderWidth, '1');
    if (megaPanelBorderWidthInput) megaPanelBorderWidthInput.value = megaPanelBorderWidthSafe;
    if (megaPanelBorderWidthVal) megaPanelBorderWidthVal.textContent = `${megaPanelBorderWidthSafe}px`;
    const megaPanelBorderRadiusSafe = normalizeMegaPanelBorderRadius(pickMegaCornerValueForSelection(data.menuMegaPanelBorderCornerValues, data.menuMegaRadiusCorners, data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners), data.menuMegaPanelRadius || '18');
    data.menuMegaPanelBorderRadius = megaPanelBorderRadiusSafe;
    if (megaPanelBorderRadiusInput) megaPanelBorderRadiusInput.value = megaPanelBorderRadiusSafe;
    if (megaPanelBorderRadiusVal) megaPanelBorderRadiusVal.textContent = `${megaPanelBorderRadiusSafe}px`;
    const megaPanelRadiusSafe = normalizeMegaPanelRadius(pickMegaCornerValueForSelection(data.menuMegaPanelCornerValues, data.menuMegaRadiusCorners, data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners), '18');
    data.menuMegaPanelRadius = megaPanelRadiusSafe;
    if (megaPanelRadiusInput) megaPanelRadiusInput.value = megaPanelRadiusSafe;
    if (megaPanelRadiusVal) megaPanelRadiusVal.textContent = `${megaPanelRadiusSafe}px`;
    const megaPanelShadowColorSafe = normalizeMegaPanelShadowColor(data.menuMegaPanelShadowColor, '#000000');
    if (megaPanelShadowColorInput) megaPanelShadowColorInput.value = megaPanelShadowColorSafe;
    if (megaPanelShadowColorDot) megaPanelShadowColorDot.style.background = megaPanelShadowColorSafe;
    const megaPanelShadowOpacitySafe = normalizeMegaPanelShadowOpacity(data.menuMegaPanelShadowOpacity, '42');
    if (megaPanelShadowOpacityInput) megaPanelShadowOpacityInput.value = megaPanelShadowOpacitySafe;
    if (megaPanelShadowOpacityVal) megaPanelShadowOpacityVal.textContent = `${megaPanelShadowOpacitySafe}%`;
    const megaPanelShadowXSafe = normalizeMegaPanelShadowAxis(data.menuMegaPanelShadowX, '0');
    if (megaPanelShadowXInput) megaPanelShadowXInput.value = megaPanelShadowXSafe;
    if (megaPanelShadowXVal) megaPanelShadowXVal.textContent = `${megaPanelShadowXSafe}px`;
    const megaPanelShadowYSafe = normalizeMegaPanelShadowAxis(data.menuMegaPanelShadowY, '22');
    if (megaPanelShadowYInput) megaPanelShadowYInput.value = megaPanelShadowYSafe;
    if (megaPanelShadowYVal) megaPanelShadowYVal.textContent = `${megaPanelShadowYSafe}px`;
    const megaPanelShadowBlurSafe = normalizeMegaPanelShadowBlur(data.menuMegaPanelShadowBlur, '48');
    if (megaPanelShadowBlurInput) megaPanelShadowBlurInput.value = megaPanelShadowBlurSafe;
    if (megaPanelShadowBlurVal) megaPanelShadowBlurVal.textContent = `${megaPanelShadowBlurSafe}px`;
    const megaPanelShadowSpreadSafe = normalizeMegaPanelShadowSpread(data.menuMegaPanelShadowSpread, '0');
    if (megaPanelShadowSpreadInput) megaPanelShadowSpreadInput.value = megaPanelShadowSpreadSafe;
    if (megaPanelShadowSpreadVal) megaPanelShadowSpreadVal.textContent = `${megaPanelShadowSpreadSafe}px`;
    if (megaBgAngleInput) megaBgAngleInput.value = normalizeMegaBgAngle(data.menuMegaBgAngle);
    if (megaBgAngleNumberInput) megaBgAngleNumberInput.value = normalizeMegaBgAngle(data.menuMegaBgAngle);
    if (megaBgAngleVal) megaBgAngleVal.textContent = `${normalizeMegaBgAngle(data.menuMegaBgAngle)}°`;
    if (level1DirSelect) level1DirSelect.value = normalizeLevelDirection(data.menuLevel1Direction, 'row');
    if (level2DirSelect) level2DirSelect.value = normalizeLevelDirection(data.menuLevel2Direction, 'column');
    if (level3DirSelect) level3DirSelect.value = normalizeLevelDirection(data.menuLevel3Direction, 'column');
    if (level3PosSelect) level3PosSelect.value = normalizeLevel3Position(data.level3Position);
    if (level3OffsetXInput) level3OffsetXInput.value = normalizeLevel3OffsetX(data.level3OffsetX);
    if (level3OffsetYInput) level3OffsetYInput.value = normalizeLevel3OffsetY(data.level3OffsetY);
    if (level3MinWidthInput) level3MinWidthInput.value = normalizeLevel3MinWidth(data.level3MinWidth);
    if (level3WidthModeSelect) level3WidthModeSelect.value = normalizeLevel3WidthMode(data.level3WidthMode);
    if (level3CustomWidthInput) level3CustomWidthInput.value = normalizeLevel3CustomWidth(data.level3CustomWidth);

    function formatMegaBgImagePreviewLabel(rawUrl = '') {
      const value = String(rawUrl || '').trim();
      if (!value) return '';
      if (/^data:image\//i.test(value)) return 'Вбудоване зображення';
      if (/^blob:/i.test(value)) return 'Тимчасове зображення';
      try {
        const parsed = new URL(value, window.location.href);
        const pathname = String(parsed.pathname || '').split('/').filter(Boolean);
        const filename = pathname.length ? decodeURIComponent(pathname[pathname.length - 1]) : '';
        if (filename) return filename;
        return parsed.hostname || 'Зовнішнє зображення';
      } catch (_) {}
      const parts = value.split('/').filter(Boolean);
      const tail = parts.length ? parts[parts.length - 1] : value;
      return tail.length > 48 ? `${tail.slice(0, 45)}…` : tail;
    }

    function updateMegaBgImagePreview(rawUrl = '') {
      const previewUrl = normalizeMegaBgImage(rawUrl || megaBgImageInput?.dataset?.assetUrl || megaBgImageInput?.value || megaBgImageStable || '');
      if (megaBgImagePreviewImg) {
        if (previewUrl) {
          megaBgImagePreviewImg.src = previewUrl;
        } else {
          megaBgImagePreviewImg.removeAttribute('src');
        }
      }
      if (megaBgImagePreviewPath) {
        const previewLabel = formatMegaBgImagePreviewLabel(previewUrl);
        megaBgImagePreviewPath.textContent = previewLabel || 'Картинка ще не вибрана';
        megaBgImagePreviewPath.title = previewLabel || '';
      }
      if (megaBgImagePreview) {
        megaBgImagePreview.classList.toggle('is-visible', !!previewUrl);
      }
    }

    const megaContentState = {
      selected: new Set(),
    };
    function safeMegaHex(value, fallback) {
      return (/^#([0-9a-fA-F]{6})$/.test(String(value || '').trim()) ? String(value).trim() : fallback);
    }
    function clampMegaInt(value, min, max, fallback) {
      const num = Number(value);
      if (!Number.isFinite(num)) return String(fallback);
      return String(Math.max(min, Math.min(max, Math.round(num))));
    }
    const getMegaContentFallbackForLevel = (level) => {
      const lvl = Math.max(1, Math.min(10, Number(level) || 1));
      if (lvl === 2) {
        return {
          color: normalizeMegaTitleColor(data.menuMegaTitleColor, '#f8fafc'),
          fs: normalizeMegaTitleSize(data.menuMegaTitleSize, '16'),
          br: '',
          gap: '',
          py: '',
          px: '',
          divColor: normalizeMegaTitleDividerColor(data.menuMegaTitleDividerColor, '#94a3b8'),
          divOpacity: normalizeMegaTitleDividerOpacity(data.menuMegaTitleDividerOpacity, '16'),
          divWidth: normalizeMegaTitleDividerWidth(data.menuMegaTitleDividerWidth, '1'),
          titleGap: normalizeMegaTitleGap(data.menuMegaTitleGap, '12'),
          hoverColor: '',
          hoverBgColor: '',
          hoverBgOpacity: '',
        };
      }
      if (lvl >= 3) {
        return {
          color: normalizeMegaLinkColor(data.menuMegaLinkColor, '#e2e8f0'),
          fs: normalizeMegaLinkSize(data.menuMegaLinkSize, '15'),
          br: normalizeMegaLinkRadius(data.menuMegaLinkRadius, '10'),
          gap: normalizeMegaLinkGap(data.menuMegaLinkGap, '8'),
          py: normalizeMegaLinkPadY(data.menuMegaLinkPadY, '8'),
          px: normalizeMegaLinkPadX(data.menuMegaLinkPadX, '10'),
          divColor: '',
          divOpacity: '',
          divWidth: '',
          titleGap: '',
          hoverColor: normalizeMegaLinkHoverColor(data.menuMegaLinkHoverColor, '#ffffff'),
          hoverBgColor: normalizeMegaLinkHoverBgColor(data.menuMegaLinkHoverBgColor, '#38bdf8'),
          hoverBgOpacity: normalizeMegaLinkHoverBgOpacity(data.menuMegaLinkHoverBgOpacity, '10'),
        };
      }
      return {
        color: '', fs: '', br: '', gap: '', py: '', px: '', divColor: '', divOpacity: '', divWidth: '', titleGap: '', hoverColor: '', hoverBgColor: '', hoverBgOpacity: '',
      };
    };
    const getMegaContentValuesForLevel = (level) => {
      const fallback = getMegaContentFallbackForLevel(level);
      const normal = getLevelStyle(data.levelStyles, level);
      const hover = getLevelStyle(data.levelHoverStyles, level);
      const layout = getLevelContentLayoutStyle(data.levelContentLayoutStyles, level);
      return {
        color: normal.color || fallback.color || '#e2e8f0',
        fs: normal.fs || fallback.fs || '15',
        br: normal.br || fallback.br || '10',
        gap: layout.gap || fallback.gap || '8',
        py: layout.py || fallback.py || '8',
        px: layout.px || fallback.px || '10',
        divColor: layout.divColor || fallback.divColor || '#94a3b8',
        divOpacity: layout.divOpacity || fallback.divOpacity || '16',
        divWidth: layout.divWidth || fallback.divWidth || '1',
        titleGap: layout.titleGap || fallback.titleGap || '12',
        hoverColor: hover.color || fallback.hoverColor || '#ffffff',
        hoverBgColor: hover.bg || fallback.hoverBgColor || '#38bdf8',
        hoverBgOpacity: hover.bgo || fallback.hoverBgOpacity || '10',
      };
    };
    const syncMegaContentButtons = () => {
      if (!(megaContentLevelsHost instanceof HTMLElement)) return;
      megaContentLevelsHost.querySelectorAll('button[data-level]').forEach((btn) => {
        const level = String(btn.getAttribute('data-level') || '');
        btn.classList.toggle('is-active', megaContentState.selected.has(level));
      });
    };
    const syncMegaContentControlsFromSelection = () => {
      const levels = Array.from(megaContentState.selected).sort((a, b) => Number(a) - Number(b));
      const rows = levels.length ? levels.map((level) => getMegaContentValuesForLevel(level)) : [getMegaContentFallbackForLevel(3)];
      const same = (key) => rows.every((row) => String(row[key] || '') === String(rows[0][key] || ''));
      const pick = (key, fallback) => same(key) ? String(rows[0][key] || fallback) : String(fallback);
      const color = safeMegaHex(pick('color', '#e2e8f0'), '#e2e8f0');
      const fs = clampMegaInt(pick('fs', '15'), 8, 96, 15);
      const divColor = safeMegaHex(pick('divColor', '#94a3b8'), '#94a3b8');
      const divOpacity = clampMegaInt(pick('divOpacity', '16'), 0, 100, 16);
      const divWidth = clampMegaInt(pick('divWidth', '1'), 0, 12, 1);
      const titleGap = clampMegaInt(pick('titleGap', '12'), 0, 64, 12);
      const gap = clampMegaInt(pick('gap', '8'), 0, 100, 8);
      const py = clampMegaInt(pick('py', '8'), 0, 70, 8);
      const px = clampMegaInt(pick('px', '10'), 0, 100, 10);
      const br = clampMegaInt(pick('br', '10'), 0, 200, 10);
      const hoverColor = safeMegaHex(pick('hoverColor', '#ffffff'), '#ffffff');
      const hoverBgColor = safeMegaHex(pick('hoverBgColor', '#38bdf8'), '#38bdf8');
      const hoverBgOpacity = clampMegaInt(pick('hoverBgOpacity', '10'), 0, 100, 10);
      if (megaLinkColorInput) megaLinkColorInput.value = color;
      if (megaLinkColorDot) megaLinkColorDot.style.background = color;
      if (megaLinkSizeInput) megaLinkSizeInput.value = fs;
      if (megaLinkSizeVal) megaLinkSizeVal.textContent = `${fs}px`;
      if (megaTitleDividerColorInput) megaTitleDividerColorInput.value = divColor;
      if (megaTitleDividerColorDot) megaTitleDividerColorDot.style.background = divColor;
      if (megaTitleDividerOpacityInput) megaTitleDividerOpacityInput.value = divOpacity;
      if (megaTitleDividerOpacityNumInput) megaTitleDividerOpacityNumInput.value = divOpacity;
      if (megaTitleDividerOpacityVal) megaTitleDividerOpacityVal.textContent = `${divOpacity}%`;
      if (megaTitleDividerWidthInput) megaTitleDividerWidthInput.value = divWidth;
      if (megaTitleDividerWidthNumInput) megaTitleDividerWidthNumInput.value = divWidth;
      if (megaTitleDividerWidthVal) megaTitleDividerWidthVal.textContent = `${divWidth}px`;
      const divRadius = clampMegaInt(pick('divRadius', '0'), 0, 40, 0);
      if (megaTitleDividerRadiusInput) megaTitleDividerRadiusInput.value = divRadius;
      if (megaTitleDividerRadiusNumInput) megaTitleDividerRadiusNumInput.value = divRadius;
      if (megaTitleDividerRadiusVal) megaTitleDividerRadiusVal.textContent = `${divRadius}px`;
      if (megaTitleGapInput) megaTitleGapInput.value = titleGap;
      if (megaTitleGapNumInput) megaTitleGapNumInput.value = titleGap;
      if (megaTitleGapVal) megaTitleGapVal.textContent = `${titleGap}px`;
      if (megaLinkGapInput) megaLinkGapInput.value = gap;
      if (megaLinkGapNumInput) megaLinkGapNumInput.value = gap;
      if (megaLinkGapVal) megaLinkGapVal.textContent = `${gap}px`;
      if (megaLinkPadYInput) megaLinkPadYInput.value = py;
      if (megaLinkPadYNumInput) megaLinkPadYNumInput.value = py;
      if (megaLinkPadYVal) megaLinkPadYVal.textContent = `${py}px`;
      if (megaLinkPadXInput) megaLinkPadXInput.value = px;
      if (megaLinkPadXNumInput) megaLinkPadXNumInput.value = px;
      if (megaLinkPadXVal) megaLinkPadXVal.textContent = `${px}px`;
      if (megaLinkRadiusInput) megaLinkRadiusInput.value = br;
      if (megaLinkRadiusVal) megaLinkRadiusVal.textContent = `${br}px`;
      if (megaLinkHoverColorInput) megaLinkHoverColorInput.value = hoverColor;
      if (megaLinkHoverColorDot) megaLinkHoverColorDot.style.background = hoverColor;
      if (megaLinkHoverBgColorInput) megaLinkHoverBgColorInput.value = hoverBgColor;
      if (megaLinkHoverBgColorDot) megaLinkHoverBgColorDot.style.background = hoverBgColor;
      if (megaLinkHoverBgOpacityInput) megaLinkHoverBgOpacityInput.value = hoverBgOpacity;
      if (megaLinkHoverBgOpacityVal) megaLinkHoverBgOpacityVal.textContent = `${hoverBgOpacity}%`;
      syncMegaContentButtons();
    };
    const renderMegaContentLevelButtons = () => {
      if (!(megaContentLevelsHost instanceof HTMLElement)) return;
      megaContentLevelsHost.innerHTML = '';
      for (let i = 1; i <= 10; i += 1) {
        const btn = document.createElement('button');
        btn.className = 'st-btn st-hfmenu-levelstyles__level';
        btn.type = 'button';
        btn.setAttribute('data-level', String(i));
        btn.textContent = String(i);
        btn.addEventListener('click', () => {
          const key = String(i);
          if (megaContentState.selected.has(key)) megaContentState.selected.delete(key);
          else megaContentState.selected.add(key);
          syncMegaContentControlsFromSelection();
        });
        megaContentLevelsHost.appendChild(btn);
      }
      syncMegaContentButtons();
    };

    const pickMegaBgFromGallery = async (cat = 'images') => {
      try {
        await openGalleryModal({
          cat,
          pickerMode: true,
          view: 'big',
          onPick: async ({ cat: pickedCat, folderId, itemId }) => {
            try {
              const items = await galListItems(pickedCat || cat, folderId);
              const it = (items || []).find(x => x && x.id === itemId);
              if (!it) return;
              let stableUrl = '';
              if (it.url) {
                stableUrl = String(it.url);
              } else if (it.blob) {
                stableUrl = await imageBlobToDataUrl(it.blob);
              } else {
                const fallbackUrl = galMakeObjectUrl(it);
                stableUrl = String(fallbackUrl || '');
              }
              if (!stableUrl) return;
              if (megaBgModeSelect) megaBgModeSelect.value = 'image';
              megaBgImageStable = rememberMegaBgImage(blk, stableUrl);
              if (megaBgImageInput) {
                megaBgImageInput.value = megaBgImageStable;
                megaBgImageInput.dataset.assetUrl = megaBgImageStable;
              }
              updateMegaBgImagePreview(megaBgImageStable);
              syncWidthInputs();
              applyLevelsSettings();
            } catch (err) {
              console.error('[HeaderFooterMenuWidget] pickMegaBgFromGallery error:', err);
            }
          }
        });
      } catch (err) {
        console.error('[HeaderFooterMenuWidget] openGalleryModal error:', err);
      }
    };

    let levelStylesWrap = null;

    const syncWidthInputs = () => {
      const viewMode = normalizeSubmenuView(viewSelect?.value);
      const megaVisible = viewMode === 'mega';
      const normalWidthMode = normalizeSubmenuWidthMode(widthModeSelect?.value);
      const megaWidthMode = normalizeSubmenuWidthMode(megaWidthModeSelect?.value || widthModeSelect?.value);
      const activeWidthMode = megaVisible ? megaWidthMode : normalWidthMode;
      if (widthModeRow instanceof HTMLElement) {
        widthModeRow.style.display = megaVisible ? 'none' : '';
      }
      if (customWidthRow instanceof HTMLElement) {
        customWidthRow.style.display = megaVisible ? 'none' : (normalWidthMode === 'custom' ? '' : 'none');
      }
      if (megaWrap instanceof HTMLElement) {
        megaWrap.style.display = megaVisible ? '' : 'none';
      }
      if (megaCustomWidthRow instanceof HTMLElement) {
        megaCustomWidthRow.style.display = megaVisible && activeWidthMode === 'custom' ? '' : 'none';
      }
      if (megaOffsetLeftRow instanceof HTMLElement) {
        const pos = normalizeMegaPosition(megaPositionSelect?.value);
        megaOffsetLeftRow.style.display = megaVisible && (pos === 'left' || pos === 'auto') ? '' : 'none';
      }
      if (megaOffsetRightRow instanceof HTMLElement) {
        const pos = normalizeMegaPosition(megaPositionSelect?.value);
        megaOffsetRightRow.style.display = megaVisible && (pos === 'right' || pos === 'auto') ? '' : 'none';
      }
      if (megaColsCustomRow instanceof HTMLElement) {
        megaColsCustomRow.style.display = megaVisible && normalizeMegaColsMode(megaColsModeSelect?.value) === 'custom' ? '' : 'none';
      }
      const megaBgMode = normalizeMegaBgMode(megaBgModeSelect?.value);
      if (megaBgModeRow instanceof HTMLElement) megaBgModeRow.style.display = megaVisible ? '' : 'none';
      if (megaBgColorRow instanceof HTMLElement) megaBgColorRow.style.display = megaVisible && megaBgMode === 'color' ? '' : 'none';
      if (megaBgImageRow instanceof HTMLElement) megaBgImageRow.style.display = megaVisible && megaBgMode === 'image' ? '' : 'none';
      if (megaBgImageSizeRow instanceof HTMLElement) megaBgImageSizeRow.style.display = megaVisible && megaBgMode === 'image' ? '' : 'none';
      if (megaBgImageScaleRow instanceof HTMLElement) megaBgImageScaleRow.style.display = megaVisible && megaBgMode === 'image' && normalizeMegaBgSizeMode(megaBgSizeSelect?.value) === 'custom' ? '' : 'none';
      if (megaBgImageRepeatRow instanceof HTMLElement) megaBgImageRepeatRow.style.display = megaVisible && megaBgMode === 'image' ? '' : 'none';
      if (megaBgImagePositionRow instanceof HTMLElement) megaBgImagePositionRow.style.display = megaVisible && megaBgMode === 'image' ? '' : 'none';
      if (megaBgImageCustomPosRow instanceof HTMLElement) megaBgImageCustomPosRow.style.display = megaVisible && megaBgMode === 'image' && normalizeMegaBgPosition(megaBgPositionSelect?.value) === 'custom' ? '' : 'none';
      if (megaBgGradient1Row instanceof HTMLElement) megaBgGradient1Row.style.display = megaVisible && megaBgMode === 'gradient' ? '' : 'none';
      if (megaBgGradient2Row instanceof HTMLElement) megaBgGradient2Row.style.display = megaVisible && megaBgMode === 'gradient' ? '' : 'none';
      if (megaBgGradient3Row instanceof HTMLElement) megaBgGradient3Row.style.display = megaVisible && megaBgMode === 'gradient' ? '' : 'none';
      if (megaBgOpacityRow instanceof HTMLElement) megaBgOpacityRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelColorRow instanceof HTMLElement) megaPanelColorRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelOpacityRow instanceof HTMLElement) megaPanelOpacityRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelBlurRow instanceof HTMLElement) megaPanelBlurRow.style.display = megaVisible ? '' : 'none';
      {
        const levelStyleLayoutExtraEl = levelStylesWrap instanceof HTMLElement ? levelStylesWrap.querySelector('[data-role="level-style-layout-extra"]') : null;
        if (levelStyleLayoutExtraEl instanceof HTMLElement) levelStyleLayoutExtraEl.style.display = megaVisible ? '' : 'none';
      }
      if (megaPanelBlurRadiusRow instanceof HTMLElement) megaPanelBlurRadiusRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelBorderColorRow instanceof HTMLElement) megaPanelBorderColorRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelBorderOpacityRow instanceof HTMLElement) megaPanelBorderOpacityRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelBorderWidthRow instanceof HTMLElement) megaPanelBorderWidthRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelBorderRadiusRow instanceof HTMLElement) megaPanelBorderRadiusRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelRadiusRow instanceof HTMLElement) megaPanelRadiusRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelShadowColorRow instanceof HTMLElement) megaPanelShadowColorRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelShadowOpacityRow instanceof HTMLElement) megaPanelShadowOpacityRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelShadowXRow instanceof HTMLElement) megaPanelShadowXRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelShadowYRow instanceof HTMLElement) megaPanelShadowYRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelShadowBlurRow instanceof HTMLElement) megaPanelShadowBlurRow.style.display = megaVisible ? '' : 'none';
      if (megaPanelShadowSpreadRow instanceof HTMLElement) megaPanelShadowSpreadRow.style.display = megaVisible ? '' : 'none';
      if (megaBgAngleRow instanceof HTMLElement) megaBgAngleRow.style.display = megaVisible && megaBgMode === 'gradient' ? '' : 'none';
      if (megaColsHintEl instanceof HTMLElement) {
        megaColsHintEl.style.display = 'none';
      }
      const level3WidthMode = normalizeLevel3WidthMode(level3WidthModeSelect?.value);
      if (level3CustomWidthRow instanceof HTMLElement) {
        level3CustomWidthRow.style.display = level3WidthMode === 'custom' ? '' : 'none';
      }
    };

    const applyLevelsSettings = () => {
      const selectedMegaContentLevels = Array.from(megaContentState.selected);
      const legacyMegaTitleSnapshot = {
        color: data.menuMegaTitleColor,
        size: data.menuMegaTitleSize,
        dividerColor: data.menuMegaTitleDividerColor,
        dividerOpacity: data.menuMegaTitleDividerOpacity,
        dividerWidth: data.menuMegaTitleDividerWidth,
        gap: data.menuMegaTitleGap,
      };
      const legacyMegaLinkSnapshot = {
        color: data.menuMegaLinkColor,
        size: data.menuMegaLinkSize,
        gap: data.menuMegaLinkGap,
        padY: data.menuMegaLinkPadY,
        padX: data.menuMegaLinkPadX,
        radius: data.menuMegaLinkRadius,
        hoverColor: data.menuMegaLinkHoverColor,
        hoverBgColor: data.menuMegaLinkHoverBgColor,
        hoverBgOpacity: data.menuMegaLinkHoverBgOpacity,
      };
      data.menuSettingsMode = normalizeSettingsMode(settingsModeInput?.checked ? '1' : '0');
      data.submenuMode = normalizeSubmenuMode(modeSelect?.value);
      data.submenuView = normalizeSubmenuView(viewSelect?.value);
      data.submenuArrow = normalizeSubmenuArrow(arrowSelect?.value);
      data.submenuAlign = normalizeSubmenuAlign(alignSelect?.value);
      data.submenuOffsetY = normalizeSubmenuOffsetY(offsetInput?.value);
      data.submenuMinWidth = normalizeSubmenuMinWidth(minWidthInput?.value);
      const megaVisible = normalizeSubmenuView(viewSelect?.value) === 'mega';
      data.submenuWidthMode = normalizeSubmenuWidthMode(megaVisible ? (megaWidthModeSelect?.value || widthModeSelect?.value) : widthModeSelect?.value);
      data.submenuCustomWidth = normalizeSubmenuCustomWidth(megaVisible ? (megaCustomWidthInput?.value || customWidthInput?.value) : customWidthInput?.value);
      data.menuMegaPosition = normalizeMegaPosition(megaPositionSelect?.value);
      data.menuMegaOffsetLeft = normalizeMegaSideOffset(megaOffsetLeftInput?.value);
      data.menuMegaOffsetRight = normalizeMegaSideOffset(megaOffsetRightInput?.value);
      data.menuMegaCols = normalizeMegaColsMode(megaColsModeSelect?.value);
      data.menuMegaColsCustom = normalizeMegaColsCustom(megaColsCustomInput?.value);
      data.menuMegaGap = normalizeMegaColGap(megaGapInput?.value);
      data.menuMegaColMinWidth = normalizeMegaColMinWidth(megaColMinWidthInput?.value);
      data.menuMegaBgMode = normalizeMegaBgMode(megaBgModeSelect?.value);
      data.menuMegaBgColor = normalizeMegaBgColor(megaBgColorInput?.value, '#020617');
      if (megaBgColorDot) megaBgColorDot.style.background = data.menuMegaBgColor;
      const megaBgImageRaw = normalizeMegaBgImage(megaBgImageInput?.dataset?.assetUrl || '');
      const megaBgImageResolved = megaBgImageRaw || megaBgImageStable || recallMegaBgImage(blk, data.menuMegaBgImage || blk?.dataset?.menuMegaBgImage || '');
      data.menuMegaBgImage = megaBgImageResolved;
      megaBgImageStable = rememberMegaBgImage(blk, megaBgImageResolved);
      if (megaBgImageInput) megaBgImageInput.dataset.assetUrl = megaBgImageStable || '';
      updateMegaBgImagePreview(megaBgImageStable);
      data.menuMegaBgSize = normalizeMegaBgSizeMode(megaBgSizeSelect?.value);
      data.menuMegaBgScale = normalizeMegaBgScale(megaBgScaleInput?.value);
      data.menuMegaBgRepeat = normalizeMegaBgRepeat(megaBgRepeatSelect?.value);
      data.menuMegaBgPosition = normalizeMegaBgPosition(megaBgPositionSelect?.value);
      data.menuMegaBgPosX = normalizeMegaBgPosPercent(megaBgPosXInput?.value, '50');
      data.menuMegaBgPosY = normalizeMegaBgPosPercent(megaBgPosYInput?.value, '50');
      if (megaBgScaleInput) megaBgScaleInput.value = data.menuMegaBgScale;
      if (megaBgScaleVal) megaBgScaleVal.textContent = `${data.menuMegaBgScale}%`;
      if (megaBgPosXInput) megaBgPosXInput.value = data.menuMegaBgPosX;
      if (megaBgPosYInput) megaBgPosYInput.value = data.menuMegaBgPosY;
      data.menuMegaTitleColor = normalizeMegaTitleColor(megaTitleColorInput?.value, '#f8fafc');
      if (megaTitleColorDot) megaTitleColorDot.style.background = data.menuMegaTitleColor;
      data.menuMegaTitleSize = normalizeMegaTitleSize(megaTitleSizeInput?.value, '16');
      if (megaTitleSizeInput) megaTitleSizeInput.value = data.menuMegaTitleSize;
      if (megaTitleSizeVal) megaTitleSizeVal.textContent = `${data.menuMegaTitleSize}px`;
      data.menuMegaTitleDividerColor = normalizeMegaTitleDividerColor(megaTitleDividerColorInput?.value, '#94a3b8');
      if (megaTitleDividerColorDot) megaTitleDividerColorDot.style.background = data.menuMegaTitleDividerColor;
      data.menuMegaTitleDividerOpacity = normalizeMegaTitleDividerOpacity(megaTitleDividerOpacityInput?.value, '16');
      if (megaTitleDividerOpacityInput) megaTitleDividerOpacityInput.value = data.menuMegaTitleDividerOpacity;
      if (megaTitleDividerOpacityVal) megaTitleDividerOpacityVal.textContent = `${data.menuMegaTitleDividerOpacity}%`;
      data.menuMegaTitleDividerWidth = normalizeMegaTitleDividerWidth(megaTitleDividerWidthInput?.value, '1');
      if (megaTitleDividerWidthInput) megaTitleDividerWidthInput.value = data.menuMegaTitleDividerWidth;
      if (megaTitleDividerWidthVal) megaTitleDividerWidthVal.textContent = `${data.menuMegaTitleDividerWidth}px`;
      data.menuMegaTitleDividerRadius = String(clampMegaInt(megaTitleDividerRadiusInput?.value, 0, 40, 0));
      if (megaTitleDividerRadiusInput) megaTitleDividerRadiusInput.value = data.menuMegaTitleDividerRadius;
      if (megaTitleDividerRadiusVal) megaTitleDividerRadiusVal.textContent = `${data.menuMegaTitleDividerRadius}px`;
      data.menuMegaTitleGap = normalizeMegaTitleGap(megaTitleGapInput?.value, '12');
      if (megaTitleGapInput) megaTitleGapInput.value = data.menuMegaTitleGap;
      if (megaTitleGapVal) megaTitleGapVal.textContent = `${data.menuMegaTitleGap}px`;
      data.menuMegaLinkColor = normalizeMegaLinkColor(megaLinkColorInput?.value, '#e2e8f0');
      if (megaLinkColorDot) megaLinkColorDot.style.background = data.menuMegaLinkColor;
      data.menuMegaLinkSize = normalizeMegaLinkSize(megaLinkSizeInput?.value, '15');
      if (megaLinkSizeInput) megaLinkSizeInput.value = data.menuMegaLinkSize;
      if (megaLinkSizeVal) megaLinkSizeVal.textContent = `${data.menuMegaLinkSize}px`;
      data.menuMegaLinkGap = normalizeMegaLinkGap(megaLinkGapInput?.value, '8');
      if (megaLinkGapInput) megaLinkGapInput.value = data.menuMegaLinkGap;
      if (megaLinkGapVal) megaLinkGapVal.textContent = `${data.menuMegaLinkGap}px`;
      data.menuMegaLinkPadY = normalizeMegaLinkPadY(megaLinkPadYInput?.value, '8');
      if (megaLinkPadYInput) megaLinkPadYInput.value = data.menuMegaLinkPadY;
      if (megaLinkPadYVal) megaLinkPadYVal.textContent = `${data.menuMegaLinkPadY}px`;
      data.menuMegaLinkPadX = normalizeMegaLinkPadX(megaLinkPadXInput?.value, '10');
      if (megaLinkPadXInput) megaLinkPadXInput.value = data.menuMegaLinkPadX;
      if (megaLinkPadXVal) megaLinkPadXVal.textContent = `${data.menuMegaLinkPadX}px`;
      data.menuMegaLinkRadius = normalizeMegaLinkRadius(megaLinkRadiusInput?.value, '10');
      if (megaLinkRadiusInput) megaLinkRadiusInput.value = data.menuMegaLinkRadius;
      if (megaLinkRadiusVal) megaLinkRadiusVal.textContent = `${data.menuMegaLinkRadius}px`;
      data.menuMegaLinkHoverColor = normalizeMegaLinkHoverColor(megaLinkHoverColorInput?.value, '#ffffff');
      if (megaLinkHoverColorDot) megaLinkHoverColorDot.style.background = data.menuMegaLinkHoverColor;
      data.menuMegaLinkHoverBgColor = normalizeMegaLinkHoverBgColor(megaLinkHoverBgColorInput?.value, '#38bdf8');
      if (megaLinkHoverBgColorDot) megaLinkHoverBgColorDot.style.background = data.menuMegaLinkHoverBgColor;
      data.menuMegaLinkHoverBgOpacity = normalizeMegaLinkHoverBgOpacity(megaLinkHoverBgOpacityInput?.value, '10');
      if (megaLinkHoverBgOpacityInput) megaLinkHoverBgOpacityInput.value = data.menuMegaLinkHoverBgOpacity;
      if (megaLinkHoverBgOpacityVal) megaLinkHoverBgOpacityVal.textContent = `${data.menuMegaLinkHoverBgOpacity}%`;
      const nextLevelStylesMap = normalizeLevelStyles(data.levelStyles);
      const nextLevelHoverStylesMap = normalizeLevelStyles(data.levelHoverStyles);
      const nextLevelOpenStylesMap = normalizeLevelStyles(data.levelOpenStyles);
      const nextLevelCurrentStylesMap = normalizeLevelStyles(data.levelCurrentStyles);
      const nextLevelContentLayoutMap = normalizeLevelContentLayoutStyles(data.levelContentLayoutStyles);
      if (selectedMegaContentLevels.length) {
        const sharedTextColor = normalizeMegaLinkColor(megaLinkColorInput?.value, '#e2e8f0');
        const sharedTextSize = normalizeMegaLinkSize(megaLinkSizeInput?.value, '15');
        const sharedDividerColor = normalizeMegaTitleDividerColor(megaTitleDividerColorInput?.value, '#94a3b8');
        const sharedDividerOpacity = normalizeMegaTitleDividerOpacity(megaTitleDividerOpacityInput?.value, '16');
        const sharedDividerWidth = normalizeMegaTitleDividerWidth(megaTitleDividerWidthInput?.value, '1');
        const sharedTitleGap = normalizeMegaTitleGap(megaTitleGapInput?.value, '12');
        const sharedItemGap = normalizeMegaLinkGap(megaLinkGapInput?.value, '8');
        const sharedPadY = normalizeMegaLinkPadY(megaLinkPadYInput?.value, '8');
        const sharedPadX = normalizeMegaLinkPadX(megaLinkPadXInput?.value, '10');
        const sharedRadius = normalizeMegaLinkRadius(megaLinkRadiusInput?.value, '10');
        const sharedHoverColor = normalizeMegaLinkHoverColor(megaLinkHoverColorInput?.value, '#ffffff');
        const sharedHoverBgColor = normalizeMegaLinkHoverBgColor(megaLinkHoverBgColorInput?.value, '#38bdf8');
        const sharedHoverBgOpacity = normalizeMegaLinkHoverBgOpacity(megaLinkHoverBgOpacityInput?.value, '10');
        selectedMegaContentLevels.forEach((level) => {
          const normalRow = getLevelStyle(nextLevelStylesMap, level);
          normalRow.color = sharedTextColor;
          normalRow.fs = sharedTextSize;
          normalRow.br = sharedRadius;
          nextLevelStylesMap[String(level)] = normalRow;
          const hoverRow = getLevelStyle(nextLevelHoverStylesMap, level);
          hoverRow.color = sharedHoverColor;
          hoverRow.bg = sharedHoverBgColor;
          hoverRow.bgo = sharedHoverBgOpacity;
          nextLevelHoverStylesMap[String(level)] = hoverRow;
          const openRow = getLevelStyle(nextLevelOpenStylesMap, level);
          openRow.color = sharedHoverColor;
          openRow.bg = sharedHoverBgColor;
          openRow.bgo = sharedHoverBgOpacity;
          nextLevelOpenStylesMap[String(level)] = openRow;
          const currentRow = getLevelStyle(nextLevelCurrentStylesMap, level);
          currentRow.color = sharedHoverColor;
          currentRow.bg = sharedHoverBgColor;
          currentRow.bgo = sharedHoverBgOpacity;
          nextLevelCurrentStylesMap[String(level)] = currentRow;
          const layoutRow = getLevelContentLayoutStyle(nextLevelContentLayoutMap, level);
          layoutRow.divColor = sharedDividerColor;
          layoutRow.divOpacity = sharedDividerOpacity;
          layoutRow.divWidth = sharedDividerWidth;
          layoutRow.titleGap = sharedTitleGap;
          layoutRow.gap = sharedItemGap;
          layoutRow.py = sharedPadY;
          layoutRow.px = sharedPadX;
          nextLevelContentLayoutMap[String(level)] = layoutRow;
        });
        if (selectedMegaContentLevels.includes('2')) {
          data.menuMegaTitleColor = sharedTextColor;
          data.menuMegaTitleSize = sharedTextSize;
          data.menuMegaTitleDividerColor = sharedDividerColor;
          data.menuMegaTitleDividerOpacity = sharedDividerOpacity;
          data.menuMegaTitleDividerWidth = sharedDividerWidth;
          data.menuMegaTitleDividerRadius = String(clampMegaInt(megaTitleDividerRadiusInput?.value, 0, 40, 0));
          data.menuMegaTitleGap = sharedTitleGap;
        } else {
          data.menuMegaTitleColor = legacyMegaTitleSnapshot.color;
          data.menuMegaTitleSize = legacyMegaTitleSnapshot.size;
          data.menuMegaTitleDividerColor = legacyMegaTitleSnapshot.dividerColor;
          data.menuMegaTitleDividerOpacity = legacyMegaTitleSnapshot.dividerOpacity;
          data.menuMegaTitleDividerWidth = legacyMegaTitleSnapshot.dividerWidth;
          data.menuMegaTitleGap = legacyMegaTitleSnapshot.gap;
        }
        if (selectedMegaContentLevels.some((level) => Number(level) >= 3)) {
          data.menuMegaLinkColor = sharedTextColor;
          data.menuMegaLinkSize = sharedTextSize;
          data.menuMegaLinkGap = sharedItemGap;
          data.menuMegaLinkPadY = sharedPadY;
          data.menuMegaLinkPadX = sharedPadX;
          data.menuMegaLinkRadius = sharedRadius;
          data.menuMegaLinkHoverColor = sharedHoverColor;
          data.menuMegaLinkHoverBgColor = sharedHoverBgColor;
          data.menuMegaLinkHoverBgOpacity = sharedHoverBgOpacity;
        } else {
          data.menuMegaLinkColor = legacyMegaLinkSnapshot.color;
          data.menuMegaLinkSize = legacyMegaLinkSnapshot.size;
          data.menuMegaLinkGap = legacyMegaLinkSnapshot.gap;
          data.menuMegaLinkPadY = legacyMegaLinkSnapshot.padY;
          data.menuMegaLinkPadX = legacyMegaLinkSnapshot.padX;
          data.menuMegaLinkRadius = legacyMegaLinkSnapshot.radius;
          data.menuMegaLinkHoverColor = legacyMegaLinkSnapshot.hoverColor;
          data.menuMegaLinkHoverBgColor = legacyMegaLinkSnapshot.hoverBgColor;
          data.menuMegaLinkHoverBgOpacity = legacyMegaLinkSnapshot.hoverBgOpacity;
        }
        data.levelStyles = nextLevelStylesMap;
        data.levelHoverStyles = nextLevelHoverStylesMap;
        data.levelOpenStyles = nextLevelOpenStylesMap;
        data.levelCurrentStyles = nextLevelCurrentStylesMap;
        data.levelContentLayoutStyles = nextLevelContentLayoutMap;
      } else {
        data.menuMegaTitleColor = legacyMegaTitleSnapshot.color;
        data.menuMegaTitleSize = legacyMegaTitleSnapshot.size;
        data.menuMegaTitleDividerColor = legacyMegaTitleSnapshot.dividerColor;
        data.menuMegaTitleDividerOpacity = legacyMegaTitleSnapshot.dividerOpacity;
        data.menuMegaTitleDividerWidth = legacyMegaTitleSnapshot.dividerWidth;
        data.menuMegaTitleGap = legacyMegaTitleSnapshot.gap;
        data.menuMegaLinkColor = legacyMegaLinkSnapshot.color;
        data.menuMegaLinkSize = legacyMegaLinkSnapshot.size;
        data.menuMegaLinkGap = legacyMegaLinkSnapshot.gap;
        data.menuMegaLinkPadY = legacyMegaLinkSnapshot.padY;
        data.menuMegaLinkPadX = legacyMegaLinkSnapshot.padX;
        data.menuMegaLinkRadius = legacyMegaLinkSnapshot.radius;
        data.menuMegaLinkHoverColor = legacyMegaLinkSnapshot.hoverColor;
        data.menuMegaLinkHoverBgColor = legacyMegaLinkSnapshot.hoverBgColor;
        data.menuMegaLinkHoverBgOpacity = legacyMegaLinkSnapshot.hoverBgOpacity;
      }
      data.menuMegaBgGradient1 = normalizeMegaBgColor(megaBgGradient1Input?.value, '#020617');
      data.menuMegaBgGradient2 = normalizeMegaBgColor(megaBgGradient2Input?.value, '#0f172a');
      data.menuMegaBgGradient3 = normalizeMegaBgColor(megaBgGradient3Input?.value, '#1e293b');
      if (megaBgGradient1Dot) megaBgGradient1Dot.style.background = data.menuMegaBgGradient1;
      if (megaBgGradient2Dot) megaBgGradient2Dot.style.background = data.menuMegaBgGradient2;
      if (megaBgGradient3Dot) megaBgGradient3Dot.style.background = data.menuMegaBgGradient3;
      data.menuMegaBgOpacity = normalizeMegaBgOpacity(megaBgOpacityInput?.value);
      data.menuMegaPanelColor = normalizeMegaPanelColor(megaPanelColorInput?.value, '#020617');
      data.menuMegaPanelSurfaceOpacity = normalizeMegaPanelOpacity(megaPanelOpacityInput?.value, '100');
      data.menuMegaPanelBlur = normalizeMegaPanelBlur(megaPanelBlurInput?.value, '0');
      data.menuMegaRadiusCorners = normalizeMegaRadiusCorners(data.menuMegaRadiusCorners, '1111');
      data.menuMegaPanelBlurCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBlurCornerValues, data.menuMegaPanelBlurRadius || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
      data.menuMegaPanelBorderCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBorderCornerValues, data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
      data.menuMegaPanelCornerValues = normalizeMegaCornerValues(data.menuMegaPanelCornerValues, data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
      const megaPanelBlurRadiusNext = normalizeMegaPanelBlurRadius(megaPanelBlurRadiusInput?.value, megaPanelBorderRadiusInput?.value || megaPanelRadiusInput?.value || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18');
      data.menuMegaPanelBlurCornerValues = applyMegaCornerValueToSelection(data.menuMegaPanelBlurCornerValues, data.menuMegaRadiusCorners, megaPanelBlurRadiusNext, megaPanelBlurRadiusNext, data.menuMegaRadiusCorners);
      data.menuMegaPanelBlurRadius = normalizeMegaPanelBlurRadius(pickMegaCornerValueForSelection(data.menuMegaPanelBlurCornerValues, data.menuMegaRadiusCorners, megaPanelBlurRadiusNext, data.menuMegaRadiusCorners), megaPanelBorderRadiusInput?.value || megaPanelRadiusInput?.value || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18');
      data.menuMegaPanelBorderColor = normalizeMegaPanelBorderColor(megaPanelBorderColorInput?.value, '#94a3b8');
      data.menuMegaPanelBorderOpacity = normalizeMegaPanelBorderOpacity(megaPanelBorderOpacityInput?.value, '22');
      data.menuMegaPanelBorderWidth = normalizeMegaPanelBorderWidth(megaPanelBorderWidthInput?.value, '1');
      const megaPanelBorderRadiusNext = normalizeMegaPanelBorderRadius(megaPanelBorderRadiusInput?.value, megaPanelRadiusInput?.value || data.menuMegaPanelRadius || '18');
      data.menuMegaPanelBorderCornerValues = applyMegaCornerValueToSelection(data.menuMegaPanelBorderCornerValues, data.menuMegaRadiusCorners, megaPanelBorderRadiusNext, megaPanelBorderRadiusNext, data.menuMegaRadiusCorners);
      data.menuMegaPanelBorderRadius = normalizeMegaPanelBorderRadius(pickMegaCornerValueForSelection(data.menuMegaPanelBorderCornerValues, data.menuMegaRadiusCorners, megaPanelBorderRadiusNext, data.menuMegaRadiusCorners), megaPanelRadiusInput?.value || data.menuMegaPanelRadius || '18');
      const megaPanelRadiusNext = normalizeMegaPanelRadius(megaPanelRadiusInput?.value, '18');
      data.menuMegaPanelCornerValues = applyMegaCornerValueToSelection(data.menuMegaPanelCornerValues, data.menuMegaRadiusCorners, megaPanelRadiusNext, megaPanelRadiusNext, data.menuMegaRadiusCorners);
      data.menuMegaPanelRadius = normalizeMegaPanelRadius(pickMegaCornerValueForSelection(data.menuMegaPanelCornerValues, data.menuMegaRadiusCorners, megaPanelRadiusNext, data.menuMegaRadiusCorners), '18');
      data.menuMegaPanelShadowColor = normalizeMegaPanelShadowColor(megaPanelShadowColorInput?.value, '#000000');
      data.menuMegaPanelShadowOpacity = normalizeMegaPanelShadowOpacity(megaPanelShadowOpacityInput?.value, '42');
      data.menuMegaPanelShadowX = normalizeMegaPanelShadowAxis(megaPanelShadowXInput?.value, '0');
      data.menuMegaPanelShadowY = normalizeMegaPanelShadowAxis(megaPanelShadowYInput?.value, '22');
      data.menuMegaPanelShadowBlur = normalizeMegaPanelShadowBlur(megaPanelShadowBlurInput?.value, '48');
      data.menuMegaPanelShadowSpread = normalizeMegaPanelShadowSpread(megaPanelShadowSpreadInput?.value, '0');
      data.menuMegaBgAngle = normalizeMegaBgAngle(megaBgAngleInput?.value || megaBgAngleNumberInput?.value);
      if (megaBgAngleInput) megaBgAngleInput.value = data.menuMegaBgAngle;
      if (megaBgAngleNumberInput) megaBgAngleNumberInput.value = data.menuMegaBgAngle;
      if (megaBgOpacityVal) megaBgOpacityVal.textContent = `${data.menuMegaBgOpacity}%`;
      if (megaPanelColorDot) megaPanelColorDot.style.background = data.menuMegaPanelColor;
      if (megaPanelOpacityVal) megaPanelOpacityVal.textContent = `${data.menuMegaPanelSurfaceOpacity}%`;
      if (megaPanelBlurVal) megaPanelBlurVal.textContent = `${data.menuMegaPanelBlur}px`;
      if (megaPanelBlurRadiusInput) megaPanelBlurRadiusInput.value = data.menuMegaPanelBlurRadius;
      if (megaPanelBlurRadiusVal) megaPanelBlurRadiusVal.textContent = `${data.menuMegaPanelBlurRadius}px`;
      data.menuMegaRadiusCorners = syncMegaRadiusCornerButtons(data.menuMegaRadiusCorners || '1111');
      if (megaPanelBorderColorDot) megaPanelBorderColorDot.style.background = data.menuMegaPanelBorderColor;
      if (megaPanelBorderOpacityVal) megaPanelBorderOpacityVal.textContent = `${data.menuMegaPanelBorderOpacity}%`;
      if (megaPanelBorderWidthInput) megaPanelBorderWidthInput.value = data.menuMegaPanelBorderWidth;
      if (megaPanelBorderWidthVal) megaPanelBorderWidthVal.textContent = `${data.menuMegaPanelBorderWidth}px`;
      if (megaPanelBorderRadiusInput) megaPanelBorderRadiusInput.value = data.menuMegaPanelBorderRadius;
      if (megaPanelBorderRadiusVal) megaPanelBorderRadiusVal.textContent = `${data.menuMegaPanelBorderRadius}px`;
      if (megaPanelRadiusInput) megaPanelRadiusInput.value = data.menuMegaPanelRadius;
      if (megaPanelRadiusVal) megaPanelRadiusVal.textContent = `${data.menuMegaPanelRadius}px`;
      if (megaPanelShadowColorDot) megaPanelShadowColorDot.style.background = data.menuMegaPanelShadowColor;
      if (megaPanelShadowOpacityVal) megaPanelShadowOpacityVal.textContent = `${data.menuMegaPanelShadowOpacity}%`;
      if (megaPanelShadowXVal) megaPanelShadowXVal.textContent = `${data.menuMegaPanelShadowX}px`;
      if (megaPanelShadowYVal) megaPanelShadowYVal.textContent = `${data.menuMegaPanelShadowY}px`;
      if (megaPanelShadowBlurVal) megaPanelShadowBlurVal.textContent = `${data.menuMegaPanelShadowBlur}px`;
      if (megaPanelShadowSpreadVal) megaPanelShadowSpreadVal.textContent = `${data.menuMegaPanelShadowSpread}px`;
      if (megaBgAngleVal) megaBgAngleVal.textContent = `${data.menuMegaBgAngle}°`;
      data.menuLevel1Direction = normalizeLevelDirection(level1DirSelect?.value, 'row');
      data.menuLevel2Direction = normalizeLevelDirection(level2DirSelect?.value, 'column');
      data.menuLevel3Direction = normalizeLevelDirection(level3DirSelect?.value, 'column');
      data.level3Position = normalizeLevel3Position(level3PosSelect?.value);
      data.level3OffsetX = normalizeLevel3OffsetX(level3OffsetXInput?.value);
      data.level3OffsetY = normalizeLevel3OffsetY(level3OffsetYInput?.value);
      data.level3MinWidth = normalizeLevel3MinWidth(level3MinWidthInput?.value);
      data.level3WidthMode = normalizeLevel3WidthMode(level3WidthModeSelect?.value);
      data.level3CustomWidth = normalizeLevel3CustomWidth(level3CustomWidthInput?.value);
      data.menuRootJustify = normalizeMenuRootJustify(menuRootJustifySelect?.value);
      data.menuRootAlign = normalizeMenuRootAlign(menuRootAlignSelect?.value);
      data.menuRootGap = normalizeMenuRootGap(menuRootGapInput?.value);
      // ✅ Root gap синхронізуємо в Рівень 1 — це тепер канонічне місце,
      // яке також використовує стандартний інспектор «Розмітка → Відстань між блоками».
      {
        const rootGapForLevel1 = normalizeMenuRootGap(data.menuRootGap);
        const layoutMapForRoot = normalizeLevelContentLayoutStyles(data.levelContentLayoutStyles);
        const level1LayoutForRoot = getLevelContentLayoutStyle(layoutMapForRoot, 1);
        level1LayoutForRoot.gap = rootGapForLevel1;
        layoutMapForRoot['1'] = level1LayoutForRoot;
        data.levelContentLayoutStyles = layoutMapForRoot;
      }
      data.menuRootPadX = normalizeMenuRootPad(menuRootPadXInput?.value, '0');
      data.menuRootPadY = normalizeMenuRootPad(menuRootPadYInput?.value, '0');
      debugMegaPanelState(blk, 'controlsBeforeWrite', {
        controls: {
          megaPanelBorderColorInput: megaPanelBorderColorInput?.value || '',
          megaPanelBorderOpacityInput: megaPanelBorderOpacityInput?.value || '',
          megaPanelBorderWidthInput: megaPanelBorderWidthInput?.value || '',
          megaPanelBorderRadiusInput: megaPanelBorderRadiusInput?.value || '',
          megaPanelRadiusInput: megaPanelRadiusInput?.value || '',
          megaBgModeSelect: megaBgModeSelect?.value || '',
        },
        dataSnapshot: {
          menuMegaPanelBorderColor: data.menuMegaPanelBorderColor,
          menuMegaPanelBorderOpacity: data.menuMegaPanelBorderOpacity,
          menuMegaPanelBorderWidth: data.menuMegaPanelBorderWidth,
          menuMegaPanelBorderRadius: data.menuMegaPanelBorderRadius,
          menuMegaPanelRadius: data.menuMegaPanelRadius,
          menuMegaPanelBlurRadius: data.menuMegaPanelBlurRadius,
          menuMegaPanelBlurCornerValues: data.menuMegaPanelBlurCornerValues,
          menuMegaPanelBorderCornerValues: data.menuMegaPanelBorderCornerValues,
          menuMegaPanelCornerValues: data.menuMegaPanelCornerValues,
          menuMegaRadiusCorners: data.menuMegaRadiusCorners,
        },
      });
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      setTimeout(() => debugMegaPanelState(blk, 'afterRenderMenuLinks', {
        dataSnapshot: {
          menuMegaPanelBorderColor: data.menuMegaPanelBorderColor,
          menuMegaPanelBorderOpacity: data.menuMegaPanelBorderOpacity,
          menuMegaPanelBorderWidth: data.menuMegaPanelBorderWidth,
          menuMegaPanelBorderRadius: data.menuMegaPanelBorderRadius,
          menuMegaPanelRadius: data.menuMegaPanelRadius,
          menuMegaPanelBlurRadius: data.menuMegaPanelBlurRadius,
          menuMegaPanelBlurCornerValues: data.menuMegaPanelBlurCornerValues,
          menuMegaPanelBorderCornerValues: data.menuMegaPanelBorderCornerValues,
          menuMegaPanelCornerValues: data.menuMegaPanelCornerValues,
          menuMegaRadiusCorners: data.menuMegaRadiusCorners,
        },
      }), 0);
      syncWidthInputs();
    };

    syncWidthInputs();
    renderMegaContentLevelButtons();
    syncMegaContentControlsFromSelection();
    megaContentSelectAllBtn?.addEventListener('click', () => {
      megaContentState.selected = new Set(Array.from({ length: 10 }, (_, idx) => String(idx + 1)));
      syncMegaContentControlsFromSelection();
    });
    megaContentClearSelectionBtn?.addEventListener('click', () => {
      megaContentState.selected.clear();
      syncMegaContentControlsFromSelection();
    });
    settingsModeInput?.addEventListener('change', applyLevelsSettings);
    modeSelect?.addEventListener('change', applyLevelsSettings);
    viewSelect?.addEventListener('change', applyLevelsSettings);
    arrowSelect?.addEventListener('change', applyLevelsSettings);
    alignSelect?.addEventListener('change', applyLevelsSettings);
    offsetInput?.addEventListener('input', applyLevelsSettings);
    minWidthInput?.addEventListener('input', applyLevelsSettings);
    widthModeSelect?.addEventListener('change', applyLevelsSettings);
    customWidthInput?.addEventListener('input', applyLevelsSettings);
    megaWidthModeSelect?.addEventListener('change', () => {
      if (widthModeSelect) widthModeSelect.value = normalizeSubmenuWidthMode(megaWidthModeSelect.value);
      syncWidthInputs();
      applyLevelsSettings();
    });
    megaCustomWidthInput?.addEventListener('input', () => {
      if (customWidthInput) customWidthInput.value = String(normalizeSubmenuCustomWidth(megaCustomWidthInput.value));
      applyLevelsSettings();
    });
    megaPositionSelect?.addEventListener('change', () => {
      syncWidthInputs();
      applyLevelsSettings();
    });
    megaOffsetLeftInput?.addEventListener('input', () => {
      if (megaOffsetLeftInput) megaOffsetLeftInput.value = normalizeMegaSideOffset(megaOffsetLeftInput.value);
      applyLevelsSettings();
    });
    megaOffsetRightInput?.addEventListener('input', () => {
      if (megaOffsetRightInput) megaOffsetRightInput.value = normalizeMegaSideOffset(megaOffsetRightInput.value);
      applyLevelsSettings();
    });
    megaColsModeSelect?.addEventListener('change', () => {
      syncWidthInputs();
      applyLevelsSettings();
    });
    megaColsCustomInput?.addEventListener('input', () => {
      const rawVal = megaColsCustomInput.value;
      if (megaColsCustomInput) megaColsCustomInput.setAttribute('data-raw-cols', String(rawVal));
      const nextVal = normalizeMegaColsCustom(rawVal);
      if (megaColsCustomInput) megaColsCustomInput.value = String(nextVal);
      if (megaColsHintEl instanceof HTMLElement) {
        const rawNum = Number((megaColsCustomInput && megaColsCustomInput.getAttribute('data-raw-cols')) || megaColsCustomInput.value || 0);
        const over = Number.isFinite(rawNum) && rawNum > 30;
        megaColsHintEl.textContent = over ? 'Максимальна кількість колонок — 30' : '';
        megaColsHintEl.style.display = over ? '' : 'none';
      }
      applyLevelsSettings();
    });
    megaGapInput?.addEventListener('input', () => {
      if (megaGapInput) megaGapInput.value = normalizeMegaColGap(megaGapInput.value);
      applyLevelsSettings();
    });
    megaColMinWidthInput?.addEventListener('input', () => {
      if (megaColMinWidthInput) megaColMinWidthInput.value = normalizeMegaColMinWidth(megaColMinWidthInput.value);
      applyLevelsSettings();
    });
    megaBgModeSelect?.addEventListener('change', () => {
      syncWidthInputs();
      applyLevelsSettings();
    });
    megaBgColorInput?.addEventListener('input', applyLevelsSettings);
    megaTitleColorInput?.addEventListener('input', applyLevelsSettings);
    megaTitleSizeInput?.addEventListener('input', applyLevelsSettings);
    megaTitleDividerColorInput?.addEventListener('input', applyLevelsSettings);
    megaTitleDividerOpacityInput?.addEventListener('input', applyLevelsSettings);
    megaTitleDividerWidthInput?.addEventListener('input', applyLevelsSettings);
    megaTitleDividerRadiusInput?.addEventListener('input', applyLevelsSettings);
    megaTitleGapInput?.addEventListener('input', applyLevelsSettings);
    megaLinkColorInput?.addEventListener('input', applyLevelsSettings);
    megaLinkSizeInput?.addEventListener('input', applyLevelsSettings);
    megaLinkGapInput?.addEventListener('input', applyLevelsSettings);
    megaLinkPadYInput?.addEventListener('input', applyLevelsSettings);
    megaLinkPadXInput?.addEventListener('input', applyLevelsSettings);
    megaLinkRadiusInput?.addEventListener('input', applyLevelsSettings);
    megaLinkHoverColorInput?.addEventListener('input', applyLevelsSettings);
    megaLinkHoverBgColorInput?.addEventListener('input', applyLevelsSettings);
    megaLinkHoverBgOpacityInput?.addEventListener('input', applyLevelsSettings);
    megaTitleDividerColorInput?.addEventListener('input', () => { levelLayoutState.dividerColor = safeMegaHex(megaTitleDividerColorInput.value, '#94a3b8'); applyLevelLayoutToSelected(); });
    megaTitleDividerOpacityInput?.addEventListener('input', () => { levelLayoutState.dividerOpacity = clampMegaInt(megaTitleDividerOpacityInput.value, 0, 100, 16); applyLevelLayoutToSelected(); });
    megaTitleDividerWidthInput?.addEventListener('input', () => { levelLayoutState.dividerWidth = clampMegaInt(megaTitleDividerWidthInput.value, 0, 12, 1); applyLevelLayoutToSelected(); });
    megaTitleDividerRadiusInput?.addEventListener('input', () => { levelLayoutState.dividerRadius = clampMegaInt(megaTitleDividerRadiusInput.value, 0, 40, 0); applyLevelLayoutToSelected(); });
    megaTitleDividerModeInputs.forEach((input) => input.addEventListener('change', () => {
      if (!input.checked) return;
      levelLayoutState.divMode = normalizeMegaDividerMode(input.value, 'joined');
      applyLevelLayoutToSelected();
    }));
    megaTitleGapInput?.addEventListener('input', () => { levelLayoutState.titleGap = clampMegaInt(megaTitleGapInput.value, 0, 64, 12); applyLevelLayoutToSelected(); });
    megaLinkGapInput?.addEventListener('input', () => { levelLayoutState.gap = clampMegaInt(megaLinkGapInput.value, 0, 100, 8); applyLevelLayoutToSelected(); });
    megaLinkPadYInput?.addEventListener('input', () => { levelLayoutState.py = clampMegaInt(megaLinkPadYInput.value, 0, 70, 8); applyLevelLayoutToSelected(); });
    megaLinkPadXInput?.addEventListener('input', () => { levelLayoutState.px = clampMegaInt(megaLinkPadXInput.value, 0, 100, 10); applyLevelLayoutToSelected(); });
    const attachLevelStyleDisplayModeListener = () => {
      if (!(levelStylesWrap instanceof HTMLElement)) return;
      if (levelStylesWrap.__stLevelDisplayModeBound) return;
      levelStylesWrap.__stLevelDisplayModeBound = true;
      levelStylesWrap.addEventListener('change', (ev) => {
        const input = ev.target?.closest?.('select[data-act="level-style-display-mode"]');
        if (!(input instanceof HTMLSelectElement) || !levelStylesWrap.contains(input)) return;
        levelLayoutState.showMode = normalizeLevelDisplayMode(input.value, 'all');
        megaShowModeDebug('levelStyleDisplayModeInput:change', {
          selectedLevels: Array.from(levelStylesState.selected),
          nextShowMode: levelLayoutState.showMode,
          inputValue: input.value || ''
        });
        applyLevelLayoutToSelected();
      });
      const input = levelStylesWrap.querySelector('select[data-act="level-style-display-mode"]');
      megaShowModeDebug('levelStyleDisplayModeInput:listener-attached', {
        found: !!input,
        selectedLevels: Array.from(levelStylesState.selected)
      });
    };
    megaBgImageInput?.addEventListener('input', () => {
      if (megaBgImageInput) megaBgImageInput.dataset.assetUrl = megaBgImageInput.value || '';
      updateMegaBgImagePreview(megaBgImageInput?.dataset?.assetUrl || megaBgImageInput?.value || '');
      applyLevelsSettings();
    });
    megaBgPickButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const cat = String(btn.getAttribute('data-cat') || 'images');
        await pickMegaBgFromGallery(cat);
      });
    });
    megaBgSizeSelect?.addEventListener('change', () => {
      syncWidthInputs();
      applyLevelsSettings();
    });
    megaBgScaleInput?.addEventListener('input', () => {
      if (megaBgScaleInput) megaBgScaleInput.value = normalizeMegaBgScale(megaBgScaleInput.value);
      applyLevelsSettings();
    });
    megaBgRepeatSelect?.addEventListener('change', applyLevelsSettings);
    megaBgPositionSelect?.addEventListener('change', () => {
      syncWidthInputs();
      applyLevelsSettings();
    });
    megaBgPosXInput?.addEventListener('input', () => {
      if (megaBgPosXInput) megaBgPosXInput.value = normalizeMegaBgPosPercent(megaBgPosXInput.value, '50');
      applyLevelsSettings();
    });
    megaBgPosYInput?.addEventListener('input', () => {
      if (megaBgPosYInput) megaBgPosYInput.value = normalizeMegaBgPosPercent(megaBgPosYInput.value, '50');
      applyLevelsSettings();
    });
    megaBgGradient1Input?.addEventListener('input', applyLevelsSettings);
    megaBgGradient2Input?.addEventListener('input', applyLevelsSettings);
    megaBgGradient3Input?.addEventListener('input', applyLevelsSettings);
    megaPanelColorInput?.addEventListener('input', () => {
      if (megaPanelColorInput) megaPanelColorInput.value = normalizeMegaPanelColor(megaPanelColorInput.value, '#020617');
      applyLevelsSettings();
    });
    megaBgOpacityInput?.addEventListener('input', () => {
      if (megaBgOpacityInput) megaBgOpacityInput.value = normalizeMegaBgOpacity(megaBgOpacityInput.value);
      megaBgImageStable = recallMegaBgImage(blk, megaBgImageStable || data.menuMegaBgImage || blk?.dataset?.menuMegaBgImage || '');
      if (megaBgImageInput && megaBgImageStable) megaBgImageInput.dataset.assetUrl = megaBgImageStable;
      applyLevelsSettings();
    });
    megaPanelOpacityInput?.addEventListener('input', () => {
      if (megaPanelOpacityInput) megaPanelOpacityInput.value = normalizeMegaPanelOpacity(megaPanelOpacityInput.value, '100');
      applyLevelsSettings();
    });
    megaPanelBlurInput?.addEventListener('input', () => {
      if (megaPanelBlurInput) megaPanelBlurInput.value = normalizeMegaPanelBlur(megaPanelBlurInput.value, '0');
      applyLevelsSettings();
    });
    megaPanelBlurRadiusInput?.addEventListener('input', () => {
      if (megaPanelBlurRadiusInput) megaPanelBlurRadiusInput.value = normalizeMegaPanelBlurRadius(megaPanelBlurRadiusInput.value, megaPanelBorderRadiusInput?.value || megaPanelRadiusInput?.value || '18');
      applyLevelsSettings();
    });
    megaRadiusCornerButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = parseMegaRadiusCorners(data.menuMegaRadiusCorners || '1111');
        const corner = String(btn.getAttribute('data-corner') || '');
        if (corner === 'tr') current.tr = !current.tr;
        else if (corner === 'br') current.br = !current.br;
        else if (corner === 'bl') current.bl = !current.bl;
        else current.tl = !current.tl;
        const nextBits = `${current.tl ? '1' : '0'}${current.tr ? '1' : '0'}${current.br ? '1' : '0'}${current.bl ? '1' : '0'}`;
        data.menuMegaRadiusCorners = syncMegaRadiusCornerButtons(nextBits);
        data.menuMegaPanelBlurCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBlurCornerValues, data.menuMegaPanelBlurRadius || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
        data.menuMegaPanelBorderCornerValues = normalizeMegaCornerValues(data.menuMegaPanelBorderCornerValues, data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
        data.menuMegaPanelCornerValues = normalizeMegaCornerValues(data.menuMegaPanelCornerValues, data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners);
        const blurUi = normalizeMegaPanelBlurRadius(pickMegaCornerValueForSelection(data.menuMegaPanelBlurCornerValues, data.menuMegaRadiusCorners, data.menuMegaPanelBlurRadius || data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners), data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18');
        data.menuMegaPanelBlurRadius = blurUi;
        if (megaPanelBlurRadiusInput) megaPanelBlurRadiusInput.value = blurUi;
        if (megaPanelBlurRadiusVal) megaPanelBlurRadiusVal.textContent = `${blurUi}px`;
        const borderUi = normalizeMegaPanelBorderRadius(pickMegaCornerValueForSelection(data.menuMegaPanelBorderCornerValues, data.menuMegaRadiusCorners, data.menuMegaPanelBorderRadius || data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners), data.menuMegaPanelRadius || '18');
        data.menuMegaPanelBorderRadius = borderUi;
        if (megaPanelBorderRadiusInput) megaPanelBorderRadiusInput.value = borderUi;
        if (megaPanelBorderRadiusVal) megaPanelBorderRadiusVal.textContent = `${borderUi}px`;
        const panelUi = normalizeMegaPanelRadius(pickMegaCornerValueForSelection(data.menuMegaPanelCornerValues, data.menuMegaRadiusCorners, data.menuMegaPanelRadius || '18', data.menuMegaRadiusCorners), '18');
        data.menuMegaPanelRadius = panelUi;
        if (megaPanelRadiusInput) megaPanelRadiusInput.value = panelUi;
        if (megaPanelRadiusVal) megaPanelRadiusVal.textContent = `${panelUi}px`;
        writeMenuData(blk, data);
        renderMenuLinks(blk, data);
        syncWidthInputs();
      });
    });
    megaPanelBorderColorInput?.addEventListener('input', () => {
      if (megaPanelBorderColorInput) megaPanelBorderColorInput.value = normalizeMegaPanelBorderColor(megaPanelBorderColorInput.value, '#94a3b8');
      applyLevelsSettings();
    });
    megaPanelBorderOpacityInput?.addEventListener('input', () => {
      if (megaPanelBorderOpacityInput) megaPanelBorderOpacityInput.value = normalizeMegaPanelBorderOpacity(megaPanelBorderOpacityInput.value, '22');
      applyLevelsSettings();
    });
    megaPanelBorderWidthInput?.addEventListener('input', () => {
      if (megaPanelBorderWidthInput) megaPanelBorderWidthInput.value = normalizeMegaPanelBorderWidth(megaPanelBorderWidthInput.value, '1');
      applyLevelsSettings();
    });
    megaPanelBorderRadiusInput?.addEventListener('input', () => {
      if (megaPanelBorderRadiusInput) megaPanelBorderRadiusInput.value = normalizeMegaPanelBorderRadius(megaPanelBorderRadiusInput.value, megaPanelRadiusInput?.value || '18');
      applyLevelsSettings();
    });
    megaPanelRadiusInput?.addEventListener('input', () => {
      if (megaPanelRadiusInput) megaPanelRadiusInput.value = normalizeMegaPanelRadius(megaPanelRadiusInput.value, '18');
      applyLevelsSettings();
    });
    megaPanelShadowColorInput?.addEventListener('input', () => {
      if (megaPanelShadowColorInput) megaPanelShadowColorInput.value = normalizeMegaPanelShadowColor(megaPanelShadowColorInput.value, '#000000');
      applyLevelsSettings();
    });
    megaPanelShadowOpacityInput?.addEventListener('input', () => {
      if (megaPanelShadowOpacityInput) megaPanelShadowOpacityInput.value = normalizeMegaPanelShadowOpacity(megaPanelShadowOpacityInput.value, '42');
      applyLevelsSettings();
    });
    megaPanelShadowXInput?.addEventListener('input', () => {
      if (megaPanelShadowXInput) megaPanelShadowXInput.value = normalizeMegaPanelShadowAxis(megaPanelShadowXInput.value, '0');
      applyLevelsSettings();
    });
    megaPanelShadowYInput?.addEventListener('input', () => {
      if (megaPanelShadowYInput) megaPanelShadowYInput.value = normalizeMegaPanelShadowAxis(megaPanelShadowYInput.value, '22');
      applyLevelsSettings();
    });
    megaPanelShadowBlurInput?.addEventListener('input', () => {
      if (megaPanelShadowBlurInput) megaPanelShadowBlurInput.value = normalizeMegaPanelShadowBlur(megaPanelShadowBlurInput.value, '48');
      applyLevelsSettings();
    });
    megaPanelShadowSpreadInput?.addEventListener('input', () => {
      if (megaPanelShadowSpreadInput) megaPanelShadowSpreadInput.value = normalizeMegaPanelShadowSpread(megaPanelShadowSpreadInput.value, '0');
      applyLevelsSettings();
    });
    megaBgAngleInput?.addEventListener('input', () => {
      const nextAngle = normalizeMegaBgAngle(megaBgAngleInput?.value);
      if (megaBgAngleInput) megaBgAngleInput.value = nextAngle;
      if (megaBgAngleNumberInput) megaBgAngleNumberInput.value = nextAngle;
      applyLevelsSettings();
    });
    megaBgAngleNumberInput?.addEventListener('input', () => {
      const nextAngle = normalizeMegaBgAngle(megaBgAngleNumberInput?.value);
      if (megaBgAngleNumberInput) megaBgAngleNumberInput.value = nextAngle;
      if (megaBgAngleInput) megaBgAngleInput.value = nextAngle;
      applyLevelsSettings();
    });
    megaBgAngleStepButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.getAttribute('data-step') || 0);
        const current = Number(normalizeMegaBgAngle(megaBgAngleNumberInput?.value || megaBgAngleInput?.value || '90'));
        const nextAngle = normalizeMegaBgAngle(String(current + step));
        if (megaBgAngleInput) megaBgAngleInput.value = nextAngle;
        if (megaBgAngleNumberInput) megaBgAngleNumberInput.value = nextAngle;
        applyLevelsSettings();
      });
    });
    level1DirSelect?.addEventListener('change', applyLevelsSettings);
    level2DirSelect?.addEventListener('change', applyLevelsSettings);
    level3DirSelect?.addEventListener('change', applyLevelsSettings);
    level3PosSelect?.addEventListener('change', applyLevelsSettings);
    level3OffsetXInput?.addEventListener('input', applyLevelsSettings);
    level3OffsetYInput?.addEventListener('input', applyLevelsSettings);
    level3MinWidthInput?.addEventListener('input', applyLevelsSettings);
    level3WidthModeSelect?.addEventListener('change', applyLevelsSettings);
    level3CustomWidthInput?.addEventListener('input', applyLevelsSettings);
    menuRootJustifySelect?.addEventListener('change', applyLevelsSettings);
    menuRootAlignSelect?.addEventListener('change', applyLevelsSettings);
    menuRootGapInput?.addEventListener('input', () => { if (menuRootGapInput) menuRootGapInput.value = normalizeMenuRootGap(menuRootGapInput.value); applyLevelsSettings(); });
    menuRootPadXInput?.addEventListener('input', () => { if (menuRootPadXInput) menuRootPadXInput.value = normalizeMenuRootPad(menuRootPadXInput.value, '0'); applyLevelsSettings(); });
    menuRootPadYInput?.addEventListener('input', () => { if (menuRootPadYInput) menuRootPadYInput.value = normalizeMenuRootPad(menuRootPadYInput.value, '0'); applyLevelsSettings(); });


    levelStylesWrap = document.createElement('div');
    levelStylesWrap.className = 'st-hfmenu-quick st-hfmenu-levelstyles';
    levelStylesWrap.innerHTML = `
      <div class="st-hfmenu-quick__title">Стилі рівнів — КОНТЕЙНЕРІВ</div>
      <div class="st-hfmenu-quick__sub">Рівні меню</div>
      <div class="st-hfmenu-levelstyles__levels" data-role="level-style-levels"></div>
      <div class="st-hfmenu-levelstyles__level-actions">
        <button class="st-btn" type="button" data-act="level-styles-select-all">Вибрати всі</button>
        <button class="st-btn" type="button" data-act="level-styles-clear-selection">Очистити вибір</button>
      </div>
      <div class="st-hfmenu-row st-hfmenu-levelstyles__displaymode-row">
        <div class="st-hfmenu-row__label">Показ рівня</div>
        <div class="st-hfmenu-row__ctrl">
          <select class="st-inp" data-act="level-style-display-mode">
            <option value="all">Показувати все</option>
            <option value="content">Показувати лише вміст</option>
          </select>
        </div>
      </div>
      <div class="st-hfmenu-levelstyles__statebar">
        <div class="st-hfmenu-quick__sub" data-role="level-style-state-label">Базові стилі · Normal</div>
        <div class="st-hfmenu-levelstyles__states">
          <button class="st-btn st-hfmenu-levelstyles__state is-active" type="button" data-act="level-style-state" data-state="normal">Normal</button>
          <button class="st-btn st-hfmenu-levelstyles__state" type="button" data-act="level-style-state" data-state="hover">Hover</button>
          <button class="st-btn st-hfmenu-levelstyles__state" type="button" data-act="level-style-state" data-state="open">Open</button>
          <button class="st-btn st-hfmenu-levelstyles__state" type="button" data-act="level-style-state" data-state="current">Current</button>
        </div>
        <div class="st-hfmenu-row st-hfmenu-levelstyles__target-row">
          <div class="st-hfmenu-row__label">Налаштувати</div>
          <div class="st-hfmenu-row__ctrl">
            <select class="st-inp" data-act="level-style-target-mode">
              <option value="container">Контейнер</option>
              <option value="item" selected>Пункти меню</option>
              <option value="off">Вимкнути</option>
            </select>
          </div>
        </div>
      </div>
      <div class="st-hfmenu-levelstyles__form">
        <div class="st-mini st-hfmenu-levelstyles__field st-hfmenu-levelstyles__field--bg" data-role="level-style-basic-bg-field">
          <div class="st-hfmenu-row__labelbox"><span>Фон</span><span class="st-hfmenu-color-dot" data-role="level-style-bg-dot" aria-hidden="true"></span></div>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-style-bg-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-hfmenu-color-input st-hfmenu-color-input--wide" type="color" value="#0f172a" data-act="level-style-bg" />
          <div class="st-hfmenu-levelstyles__stacked-range">
            <div class="st-hfmenu-row__label">Прозорість</div>
            ${buildStackedRangeControl({ act: 'level-style-bg-opacity', min: '0', max: '100', step: '1', value: '100', numberRole: 'level-style-bg-opacity-num' })}
          </div>
        </div>
        <div class="st-mini st-hfmenu-levelstyles__field" data-role="level-style-basic-border-mode-field">
          <div>Рамка</div>
          <div class="st-hfmenu-levelstyles__radio-row" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
            <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
              <input type="radio" name="levelStyleBorderMode" value="on" data-act="level-style-border-mode" checked />
              <span>Є рамка</span>
            </label>
            <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
              <input type="radio" name="levelStyleBorderMode" value="none" data-act="level-style-border-mode" />
              <span>Немає рамки</span>
            </label>
          </div>
        </div>
        <div class="st-mini st-hfmenu-levelstyles__field" data-role="level-style-basic-text-field">
          <div class="st-hfmenu-row__labelbox"><span>Текст</span><span class="st-hfmenu-color-dot" data-role="level-style-text-dot" aria-hidden="true"></span></div>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-style-color-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-hfmenu-color-input" type="color" value="#e2e8f0" data-act="level-style-color" />
        </div>
        <div class="st-mini st-hfmenu-levelstyles__field" data-role="level-style-basic-fs-field">
          <div>Розмір тексту</div>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-style-fs-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="number" min="8" max="96" step="1" value="14" data-act="level-style-fs" />
        </div>
        <div class="st-hfmenu-stylegroup" data-role="level-style-line-group">
          <div class="st-hfmenu-stylegroup__title">Лінія</div>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-style-border-enabled" />
            <span>Окремо</span>
          </label>
          <div class="st-hfmenu-stylegroup__rows">
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label"><span class="st-hfmenu-row__labelbox"><span>Колір</span><span class="st-hfmenu-color-dot" data-role="level-style-border-dot" aria-hidden="true"></span></span></div><div class="st-hfmenu-row__ctrl"><input class="st-hfmenu-color-input" type="color" value="#94a3b8" data-act="level-style-border-color" /></div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Товщина</div><div class="st-hfmenu-row__ctrl">${buildStackedRangeControl({ act: 'level-style-border-width', min: '0', max: '20', step: '1', value: '1', numberRole: 'level-style-border-width-num' })}</div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Радіус</div><div class="st-hfmenu-row__ctrl">${buildStackedRangeControl({ act: 'level-style-border-radius', min: '0', max: '200', step: '1', value: '12', numberRole: 'level-style-border-radius-num' })}</div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Прозорість</div><div class="st-hfmenu-row__ctrl">${buildStackedRangeControl({ act: 'level-style-border-opacity', min: '0', max: '100', step: '1', value: '100', numberRole: 'level-style-border-opacity-num' })}</div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Тип</div><div class="st-hfmenu-row__ctrl"><select class="st-inp" data-act="level-style-border-style"><option value="solid">solid</option><option value="dashed">dashed</option><option value="dotted">dotted</option></select></div></div>
          </div>
        </div>
        <div class="st-hfmenu-stylegroup" data-role="level-style-shadow-group">
          <div class="st-hfmenu-stylegroup__title">Тінь</div>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-style-shadow-enabled" />
            <span>Окремо</span>
          </label>
          <div class="st-hfmenu-stylegroup__rows">
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label"><span class="st-hfmenu-row__labelbox"><span>Колір</span><span class="st-hfmenu-color-dot" data-role="level-style-shadow-dot" aria-hidden="true"></span></span></div><div class="st-hfmenu-row__ctrl"><input class="st-hfmenu-color-input" type="color" value="#000000" data-act="level-style-shadow-color" /></div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Товщина</div><div class="st-hfmenu-row__ctrl">${buildStackedRangeControl({ act: 'level-style-shadow-blur', min: '0', max: '300', step: '1', value: '24', numberRole: 'level-style-shadow-blur-num' })}</div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Радіус</div><div class="st-hfmenu-row__ctrl">${buildStackedRangeControl({ act: 'level-style-shadow-spread', min: '-100', max: '200', step: '1', value: '0', numberRole: 'level-style-shadow-spread-num' })}</div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Прозорість</div><div class="st-hfmenu-row__ctrl">${buildStackedRangeControl({ act: 'level-style-shadow-opacity', min: '0', max: '100', step: '1', value: '100', numberRole: 'level-style-shadow-opacity-num' })}</div></div>
            <div class="st-hfmenu-row"><div class="st-hfmenu-row__label">Тип</div><div class="st-hfmenu-row__ctrl"><select class="st-inp" data-act="level-style-shadow-type"><option value="outer">outer</option><option value="inset">inset</option></select></div></div>
            <div class="st-hfmenu-stylegroup__inline2"><label class="st-mini st-hfmenu-levelstyles__field"><span>X</span><input class="st-inp" type="number" min="-200" max="200" step="1" value="0" data-act="level-style-shadow-x" /></label><label class="st-mini st-hfmenu-levelstyles__field"><span>Y</span><input class="st-inp" type="number" min="-200" max="200" step="1" value="8" data-act="level-style-shadow-y" /></label></div>
          </div>
        </div>
      </div>
      <div class="st-hfmenu-levelstyles__groups" data-role="level-style-groups"></div>
      <div class="st-hfmenu-levelstyles__extra" data-role="level-style-layout-extra" hidden></div>
      <div class="st-hfmenu-levelstyles__apply">
        <button class="st-btn" type="button" data-act="level-styles-apply">Застосувати до вибраних рівнів</button>
        <button class="st-btn" type="button" data-act="level-styles-reset">Скинути вибрані рівні</button>
      </div>
      <div class="st-hfmenu-quick__hint">На цьому кроці стилі задаються для рівнів 1–10 у станах Normal, Hover, Open і Current. Увімкніть перемикач "Налаштувати контейнер", щоб цими ж інструментами редагувати не пункти, а самі контейнери рівнів.</div>
    `.trim();

    const levelStyleLevelsHost = levelStylesWrap.querySelector('[data-role="level-style-levels"]');
    const levelStyleStateLabel = levelStylesWrap.querySelector('[data-role="level-style-state-label"]');
    const levelStyleStateButtons = Array.from(levelStylesWrap.querySelectorAll('[data-act="level-style-state"]'));
    const levelStyleDisplayModeInput = levelStylesWrap.querySelector('select[data-act="level-style-display-mode"]');
    const levelStyleTargetModeInput = levelStylesWrap.querySelector('select[data-act="level-style-target-mode"]');
    const levelStyleBgEnabled = levelStylesWrap.querySelector('input[data-act="level-style-bg-enabled"]');
    const levelStyleBgInput = levelStylesWrap.querySelector('input[data-act="level-style-bg"]');
    const levelStyleBgDot = levelStylesWrap.querySelector('[data-role="level-style-bg-dot"]');
    const levelStyleBgOpacityInput = levelStylesWrap.querySelector('input[data-act="level-style-bg-opacity"]');
    const levelStyleBgOpacityNumInput = levelStylesWrap.querySelector('input[data-role="level-style-bg-opacity-num"]');
    const levelStyleColorEnabled = levelStylesWrap.querySelector('input[data-act="level-style-color-enabled"]');
    const levelStyleColorInput = levelStylesWrap.querySelector('input[data-act="level-style-color"]');
    const levelStyleColorDot = levelStylesWrap.querySelector('[data-role="level-style-text-dot"]');
    const levelStyleFsEnabled = levelStylesWrap.querySelector('input[data-act="level-style-fs-enabled"]');
    const levelStyleFsInput = levelStylesWrap.querySelector('input[data-act="level-style-fs"]');
    const levelStyleBorderEnabled = levelStylesWrap.querySelector('input[data-act="level-style-border-enabled"]');
    const levelStyleBasicBorderModeField = levelStylesWrap.querySelector('[data-role="level-style-basic-border-mode-field"]');
    const levelStyleBorderModeInputs = Array.from(levelStylesWrap.querySelectorAll('input[data-act="level-style-border-mode"]'));
    const levelStyleBorderColorInput = levelStylesWrap.querySelector('input[data-act="level-style-border-color"]');
    const levelStyleBorderDot = levelStylesWrap.querySelector('[data-role="level-style-border-dot"]');
    const levelStyleBorderWidthInput = levelStylesWrap.querySelector('input[data-act="level-style-border-width"]');
    const levelStyleBorderWidthNumInput = levelStylesWrap.querySelector('input[data-role="level-style-border-width-num"]');
    const levelStyleBorderRadiusInput = levelStylesWrap.querySelector('input[data-act="level-style-border-radius"]');
    const levelStyleBorderRadiusNumInput = levelStylesWrap.querySelector('input[data-role="level-style-border-radius-num"]');
    const levelStyleBorderOpacityInput = levelStylesWrap.querySelector('input[data-act="level-style-border-opacity"]');
    const levelStyleBorderOpacityNumInput = levelStylesWrap.querySelector('input[data-role="level-style-border-opacity-num"]');
    const levelStyleBorderStyleInput = levelStylesWrap.querySelector('select[data-act="level-style-border-style"]');
    const levelStyleShadowEnabled = levelStylesWrap.querySelector('input[data-act="level-style-shadow-enabled"]');
    const levelStyleShadowColorInput = levelStylesWrap.querySelector('input[data-act="level-style-shadow-color"]');
    const levelStyleShadowDot = levelStylesWrap.querySelector('[data-role="level-style-shadow-dot"]');
    const levelStyleShadowXInput = levelStylesWrap.querySelector('input[data-act="level-style-shadow-x"]');
    const levelStyleShadowYInput = levelStylesWrap.querySelector('input[data-act="level-style-shadow-y"]');
    const levelStyleShadowBlurInput = levelStylesWrap.querySelector('input[data-act="level-style-shadow-blur"]');
    const levelStyleShadowBlurNumInput = levelStylesWrap.querySelector('input[data-role="level-style-shadow-blur-num"]');
    const levelStyleShadowSpreadInput = levelStylesWrap.querySelector('input[data-act="level-style-shadow-spread"]');
    const levelStyleShadowSpreadNumInput = levelStylesWrap.querySelector('input[data-role="level-style-shadow-spread-num"]');
    const levelStyleShadowOpacityInput = levelStylesWrap.querySelector('input[data-act="level-style-shadow-opacity"]');
    const levelStyleShadowOpacityNumInput = levelStylesWrap.querySelector('input[data-role="level-style-shadow-opacity-num"]');
    const levelStyleShadowTypeInput = levelStylesWrap.querySelector('select[data-act="level-style-shadow-type"]');
    const levelStyleLayoutExtra = levelStylesWrap.querySelector('[data-role="level-style-layout-extra"]');
    bindStackedRangePair(levelStyleBgOpacityInput, levelStyleBgOpacityNumInput, (raw) => normalizeLevelBgOpacityInput(raw) || '100');
    const levelStyleGroupsHost = levelStylesWrap.querySelector('[data-role="level-style-groups"]');
    if (levelStyleLayoutExtra instanceof HTMLElement) {
      const dividerGroup = document.createElement('div');
      dividerGroup.className = 'st-hfmenu-stylegroup';
      dividerGroup.setAttribute('data-role', 'level-style-divider-group');
      dividerGroup.innerHTML = '<div class="st-hfmenu-stylegroup__title">Розділювач</div><div class="st-hfmenu-stylegroup__rows"></div>';
      const dividerRows = dividerGroup.querySelector('.st-hfmenu-stylegroup__rows');
      if (dividerRows) {
        dividerRows.appendChild(megaTitleDividerColorRow);
        dividerRows.appendChild(megaTitleDividerWidthRow);
        dividerRows.appendChild(megaTitleDividerRadiusRow);
        dividerRows.appendChild(megaTitleDividerOpacityRow);
        dividerRows.appendChild(megaTitleDividerModeRow);
      }
      const spacingGroup = document.createElement('div');
      spacingGroup.className = 'st-hfmenu-stylegroup';
      spacingGroup.setAttribute('data-role', 'level-style-spacing-group');
      spacingGroup.innerHTML = '<div class="st-hfmenu-stylegroup__title">Відступи</div><div class="st-hfmenu-stylegroup__rows"></div>';
      const spacingRows = spacingGroup.querySelector('.st-hfmenu-stylegroup__rows');
      if (spacingRows) {
        spacingRows.appendChild(megaTitleGapRow);
        spacingRows.appendChild(megaLinkGapRow);
        spacingRows.appendChild(megaLinkPadYRow);
        spacingRows.appendChild(megaLinkPadXRow);
      }
      levelStyleLayoutExtra.appendChild(dividerGroup);
      levelStyleLayoutExtra.appendChild(spacingGroup);
    }
    const levelStylesForm = levelStylesWrap.querySelector('.st-hfmenu-levelstyles__form');
    const levelStyleBasicBgField = levelStylesWrap.querySelector('[data-role="level-style-basic-bg-field"]');
    const levelStyleBasicTextField = levelStylesWrap.querySelector('[data-role="level-style-basic-text-field"]');
    const levelStyleBasicFsField = levelStylesWrap.querySelector('[data-role="level-style-basic-fs-field"]');
    const levelStyleLineGroup = levelStylesWrap.querySelector('[data-role="level-style-line-group"]');
    const levelStyleShadowGroup = levelStylesWrap.querySelector('[data-role="level-style-shadow-group"]');
    const levelStyleDividerGroup = levelStylesWrap.querySelector('[data-role="level-style-divider-group"]');
    const levelStyleSpacingGroup = levelStylesWrap.querySelector('[data-role="level-style-spacing-group"]');
    const stripStyleGroupTitle = (groupEl) => {
      if (!(groupEl instanceof HTMLElement)) return groupEl;
      groupEl.querySelector('.st-hfmenu-stylegroup__title')?.remove();
      return groupEl;
    };
    const mountLevelStyleAccordion = ({ title, storageKey, defaultOpen = false, tooltipText = '', nodes = [] }) => {
      if (!(levelStyleGroupsHost instanceof HTMLElement)) return;
      const acc = createSubAccordion({
        title,
        storageKey,
        defaultOpen,
        variant: 'design-section',
        tooltipText,
      });
      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'st-hfmenu-levelstyles__accordion-body';
      nodes.forEach((node) => {
        if (node instanceof HTMLElement) bodyWrap.appendChild(node);
      });
      acc.body.appendChild(bodyWrap);
      levelStyleGroupsHost.appendChild(acc.wrap);
    };
    if (levelStyleGroupsHost instanceof HTMLElement) {
      mountLevelStyleAccordion({
        title: 'Основне',
        storageKey: LEVEL_STYLE_BASIC_ACCORDION_KEY,
        defaultOpen: true,
        tooltipText: `Фон
Рамка: Є рамка / Немає рамки
Текст
Розмір тексту
Базові стилі вибраних рівнів`,
        nodes: [levelStyleBasicBgField, levelStyleBasicBorderModeField, levelStyleBasicTextField, levelStyleBasicFsField],
      });
      mountLevelStyleAccordion({
        title: 'Лінії',
        storageKey: LEVEL_STYLE_LINE_ACCORDION_KEY,
        defaultOpen: false,
        tooltipText: `Колір лінії
Товщина
Радіус
Прозорість
Тип лінії`,
        nodes: [stripStyleGroupTitle(levelStyleLineGroup)],
      });
      mountLevelStyleAccordion({
        title: 'Тіні',
        storageKey: LEVEL_STYLE_SHADOW_ACCORDION_KEY,
        defaultOpen: false,
        tooltipText: `Колір тіні
Товщина
Радіус
Прозорість
Тип тіні`,
        nodes: [stripStyleGroupTitle(levelStyleShadowGroup)],
      });
      mountLevelStyleAccordion({
        title: 'Розділювач',
        storageKey: LEVEL_STYLE_DIVIDER_ACCORDION_KEY,
        defaultOpen: false,
        tooltipText: `Колір розділювача
Товщина
Радіус
Прозорість
Режим лінії`,
        nodes: [stripStyleGroupTitle(levelStyleDividerGroup)],
      });
      mountLevelStyleAccordion({
        title: 'Відступи',
        storageKey: LEVEL_STYLE_SPACING_ACCORDION_KEY,
        defaultOpen: false,
        tooltipText: `Відступ після рівня
Відступ між пунктами
Внутрішній відступ X/Y`,
        nodes: [stripStyleGroupTitle(levelStyleSpacingGroup)],
      });
      levelStylesForm?.remove();
      if (levelStyleLayoutExtra instanceof HTMLElement) levelStyleLayoutExtra.remove();
    }
    const levelStylesState = {
      selected: new Set(),
      state: 'normal',
      targetMode: 'item',
      values: {
        bgEnabled: false,
        bg: '#0f172a',
        bgOpacity: '100',
        colorEnabled: false,
        color: '#e2e8f0',
        fsEnabled: false,
        fs: '14',
        borderEnabled: false,
        borderColor: '#94a3b8',
        borderWidth: '1',
        borderRadius: '12',
        borderStyle: 'solid',
        borderOpacity: '100',
        radiusEnabled: false,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowOpacity: '100',
        shadowType: 'outer',
        shadowX: '0',
        shadowY: '8',
        shadowBlur: '24',
        shadowSpread: '0',
      },
    };

    const safeColor = (value, fallback) => (/^#([0-9a-fA-F]{6})$/.test(String(value || '').trim()) ? String(value).trim() : fallback);
    const normalizeLevelFsInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(8, Math.min(96, Math.round(num))));
    };
    const normalizeLevelBorderWidthInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(0, Math.min(20, Math.round(num))));
    };
    const normalizeLevelBorderRadiusInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(0, Math.min(200, Math.round(num))));
    };
    const normalizeLevelShadowAxisInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(-200, Math.min(200, Math.round(num))));
    };
    const normalizeLevelShadowBlurInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(0, Math.min(300, Math.round(num))));
    };
    const normalizeLevelShadowSpreadInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(-100, Math.min(200, Math.round(num))));
    };

    const normalizeLevelBgOpacityInput = (value) => {
      const num = Number(value);
      if (!Number.isFinite(num)) return '';
      return String(Math.max(0, Math.min(100, Math.round(num))));
    };

    bindStackedRangePair(levelStyleBorderWidthInput, levelStyleBorderWidthNumInput, normalizeLevelBorderWidthInput);
    bindStackedRangePair(levelStyleBorderRadiusInput, levelStyleBorderRadiusNumInput, normalizeLevelBorderRadiusInput);
    bindStackedRangePair(levelStyleBorderOpacityInput, levelStyleBorderOpacityNumInput, normalizeLevelBgOpacityInput);
    bindStackedRangePair(levelStyleShadowBlurInput, levelStyleShadowBlurNumInput, normalizeLevelShadowBlurInput);
    bindStackedRangePair(levelStyleShadowSpreadInput, levelStyleShadowSpreadNumInput, normalizeLevelShadowSpreadInput);
    bindStackedRangePair(levelStyleShadowOpacityInput, levelStyleShadowOpacityNumInput, normalizeLevelBgOpacityInput);
    bindStackedRangePair(megaTitleDividerOpacityInput, megaTitleDividerOpacityNumInput, (value) => clampMegaInt(value, 0, 100, 16));
    bindStackedRangePair(megaTitleDividerWidthInput, megaTitleDividerWidthNumInput, (value) => clampMegaInt(value, 0, 12, 1));
    bindStackedRangePair(megaTitleDividerRadiusInput, megaTitleDividerRadiusNumInput, (value) => clampMegaInt(value, 0, 40, 0));
    bindStackedRangePair(megaTitleGapInput, megaTitleGapNumInput, (value) => clampMegaInt(value, 0, 64, 12));
    bindStackedRangePair(megaLinkGapInput, megaLinkGapNumInput, (value) => clampMegaInt(value, 0, 100, 8));
    bindStackedRangePair(megaLinkPadYInput, megaLinkPadYNumInput, (value) => clampMegaInt(value, 0, 70, 8));
    bindStackedRangePair(megaLinkPadXInput, megaLinkPadXNumInput, (value) => clampMegaInt(value, 0, 100, 10));
    const levelLayoutState = {
      dividerColor: '#94a3b8',
      dividerOpacity: '16',
      dividerWidth: '1',
      dividerRadius: '0',
      divMode: 'joined',
      showMode: 'all',
      titleGap: '12',
      gap: '8',
      py: '8',
      px: '10',
    };
    const syncLevelLayoutInputs = () => {
      if (megaTitleDividerColorInput) megaTitleDividerColorInput.value = safeMegaHex(levelLayoutState.dividerColor, '#94a3b8');
      if (megaTitleDividerColorDot) megaTitleDividerColorDot.style.background = safeMegaHex(levelLayoutState.dividerColor, '#94a3b8');
      if (megaTitleDividerOpacityInput) megaTitleDividerOpacityInput.value = clampMegaInt(levelLayoutState.dividerOpacity, 0, 100, 16);
      if (megaTitleDividerOpacityNumInput) megaTitleDividerOpacityNumInput.value = clampMegaInt(levelLayoutState.dividerOpacity, 0, 100, 16);
      if (megaTitleDividerOpacityVal) megaTitleDividerOpacityVal.textContent = `${clampMegaInt(levelLayoutState.dividerOpacity, 0, 100, 16)}%`;
      if (megaTitleDividerWidthInput) megaTitleDividerWidthInput.value = clampMegaInt(levelLayoutState.dividerWidth, 0, 12, 1);
      if (megaTitleDividerWidthNumInput) megaTitleDividerWidthNumInput.value = clampMegaInt(levelLayoutState.dividerWidth, 0, 12, 1);
      if (megaTitleDividerWidthVal) megaTitleDividerWidthVal.textContent = `${clampMegaInt(levelLayoutState.dividerWidth, 0, 12, 1)}px`;
      if (megaTitleDividerRadiusInput) megaTitleDividerRadiusInput.value = clampMegaInt(levelLayoutState.dividerRadius, 0, 40, 0);
      if (megaTitleDividerRadiusNumInput) megaTitleDividerRadiusNumInput.value = clampMegaInt(levelLayoutState.dividerRadius, 0, 40, 0);
      if (megaTitleDividerRadiusVal) megaTitleDividerRadiusVal.textContent = `${clampMegaInt(levelLayoutState.dividerRadius, 0, 40, 0)}px`;
      megaTitleDividerModeInputs.forEach((input) => {
        input.checked = input.value === normalizeMegaDividerMode(levelLayoutState.divMode, 'joined');
      });
      if (levelStyleDisplayModeInput) levelStyleDisplayModeInput.value = normalizeLevelDisplayMode(levelLayoutState.showMode, 'all');
      if (megaTitleGapInput) megaTitleGapInput.value = clampMegaInt(levelLayoutState.titleGap, 0, 64, 12);
      if (megaTitleGapNumInput) megaTitleGapNumInput.value = clampMegaInt(levelLayoutState.titleGap, 0, 64, 12);
      if (megaTitleGapVal) megaTitleGapVal.textContent = `${clampMegaInt(levelLayoutState.titleGap, 0, 64, 12)}px`;
      if (megaLinkGapInput) megaLinkGapInput.value = clampMegaInt(levelLayoutState.gap, 0, 100, 8);
      if (megaLinkGapNumInput) megaLinkGapNumInput.value = clampMegaInt(levelLayoutState.gap, 0, 100, 8);
      if (megaLinkGapVal) megaLinkGapVal.textContent = `${clampMegaInt(levelLayoutState.gap, 0, 100, 8)}px`;
      if (megaLinkPadYInput) megaLinkPadYInput.value = clampMegaInt(levelLayoutState.py, 0, 70, 8);
      if (megaLinkPadYNumInput) megaLinkPadYNumInput.value = clampMegaInt(levelLayoutState.py, 0, 70, 8);
      if (megaLinkPadYVal) megaLinkPadYVal.textContent = `${clampMegaInt(levelLayoutState.py, 0, 70, 8)}px`;
      if (megaLinkPadXInput) megaLinkPadXInput.value = clampMegaInt(levelLayoutState.px, 0, 100, 10);
      if (megaLinkPadXNumInput) megaLinkPadXNumInput.value = clampMegaInt(levelLayoutState.px, 0, 100, 10);
      if (megaLinkPadXVal) megaLinkPadXVal.textContent = `${clampMegaInt(levelLayoutState.px, 0, 100, 10)}px`;
    };
    const syncLevelLayoutFromSelection = () => {
      const levels = Array.from(levelStylesState.selected).sort((a, b) => Number(a) - Number(b));
      if (!levels.length) {
        levelLayoutState.dividerColor = '#94a3b8';
        levelLayoutState.dividerOpacity = '16';
        levelLayoutState.dividerWidth = '1';
        levelLayoutState.dividerRadius = '0';
        levelLayoutState.divMode = 'joined';
        levelLayoutState.showMode = 'all';
        levelLayoutState.titleGap = '12';
        levelLayoutState.gap = '8';
        levelLayoutState.py = '8';
        levelLayoutState.px = '10';
        syncLevelLayoutInputs();
        return;
      }
      const rows = levels.map((level) => getLevelContentLayoutStyle(data.levelContentLayoutStyles, level));
      megaShowModeDebug('syncLevelLayoutFromSelection', { levels: levels.slice(), rows });
      const same = (getter) => rows.every((row) => getter(row) === getter(rows[0]));
      levelLayoutState.dividerColor = same((row) => row.divColor) ? (rows[0].divColor || '#94a3b8') : '#94a3b8';
      levelLayoutState.dividerOpacity = same((row) => row.divOpacity) ? (rows[0].divOpacity || '16') : '16';
      levelLayoutState.dividerWidth = same((row) => row.divWidth) ? (rows[0].divWidth || '1') : '1';
      levelLayoutState.dividerRadius = same((row) => row.divRadius) ? (rows[0].divRadius || '0') : '0';
      levelLayoutState.divMode = same((row) => row.divMode) ? normalizeMegaDividerMode(rows[0].divMode, 'joined') : 'joined';
      levelLayoutState.showMode = same((row) => row.showMode) ? normalizeLevelDisplayMode(rows[0].showMode, 'all') : 'all';
      levelLayoutState.titleGap = same((row) => row.titleGap) ? (rows[0].titleGap || '12') : '12';
      levelLayoutState.gap = same((row) => row.gap) ? (rows[0].gap || '8') : '8';
      levelLayoutState.py = same((row) => row.py) ? (rows[0].py || '8') : '8';
      levelLayoutState.px = same((row) => row.px) ? (rows[0].px || '10') : '10';
      syncLevelLayoutInputs();
    };
    const applyLevelLayoutToSelected = () => {
      const levels = Array.from(levelStylesState.selected);
      if (!levels.length) return;
      const stylesMap = normalizeLevelContentLayoutStyles(data.levelContentLayoutStyles);
      levels.forEach((level) => {
        const cur = getLevelContentLayoutStyle(stylesMap, level);
        cur.divColor = safeMegaHex(levelLayoutState.dividerColor, '#94a3b8');
        cur.divOpacity = clampMegaInt(levelLayoutState.dividerOpacity, 0, 100, 16);
        cur.divWidth = clampMegaInt(levelLayoutState.dividerWidth, 0, 12, 1);
        cur.divRadius = clampMegaInt(levelLayoutState.dividerRadius, 0, 40, 0);
        cur.divMode = normalizeMegaDividerMode(levelLayoutState.divMode, 'joined');
        cur.showMode = normalizeLevelDisplayMode(levelLayoutState.showMode, 'all');
        cur.titleGap = clampMegaInt(levelLayoutState.titleGap, 0, 64, 12);
        cur.gap = clampMegaInt(levelLayoutState.gap, 0, 100, 8);
        cur.py = clampMegaInt(levelLayoutState.py, 0, 70, 8);
        cur.px = clampMegaInt(levelLayoutState.px, 0, 100, 10);
        stylesMap[String(level)] = cur;
      });
      data.levelContentLayoutStyles = stylesMap;
      megaShowModeDebugGroup('applyLevelLayoutToSelected', {
        selectedLevels: levels.slice(),
        showMode: normalizeLevelDisplayMode(levelLayoutState.showMode, 'all'),
        snapshot: levels.reduce((acc, level) => {
          acc[level] = stylesMap[String(level)];
          return acc;
        }, {})
      });
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      syncLevelLayoutFromSelection();
    };

    const getActiveLevelStylesMap = () => {
      if (levelStylesState.state === 'hover') return normalizeLevelStyles(data.levelHoverStyles);
      if (levelStylesState.state === 'open') return normalizeLevelStyles(data.levelOpenStyles);
      if (levelStylesState.state === 'current') return normalizeLevelStyles(data.levelCurrentStyles);
      return normalizeLevelStyles(data.levelStyles);
    };
    const setActiveLevelStylesMap = (stylesMap) => {
      if (levelStylesState.state === 'hover') data.levelHoverStyles = stylesMap;
      else if (levelStylesState.state === 'open') data.levelOpenStyles = stylesMap;
      else if (levelStylesState.state === 'current') data.levelCurrentStyles = stylesMap;
      else data.levelStyles = stylesMap;
    };
    const getActiveLevelContainerStylesMap = () => {
      if (levelStylesState.state === 'hover') return normalizeLevelStyles(data.levelContainerHoverStyles);
      if (levelStylesState.state === 'open') return normalizeLevelStyles(data.levelContainerOpenStyles);
      if (levelStylesState.state === 'current') return normalizeLevelStyles(data.levelContainerCurrentStyles);
      return normalizeLevelStyles(data.levelContainerStyles);
    };
    const setActiveLevelContainerStylesMap = (stylesMap) => {
      if (levelStylesState.state === 'hover') data.levelContainerHoverStyles = stylesMap;
      else if (levelStylesState.state === 'open') data.levelContainerOpenStyles = stylesMap;
      else if (levelStylesState.state === 'current') data.levelContainerCurrentStyles = stylesMap;
      else data.levelContainerStyles = stylesMap;
    };
    const normalizeLevelStyleTargetMode = (value) => {
      const raw = String(value || '').trim().toLowerCase();
      if (raw === 'container' || raw === 'off') return raw;
      return 'item';
    };
    const getLevelStyleTargetMode = () => normalizeLevelStyleTargetMode(levelStylesState.targetMode);
    const isEditingLevelContainers = () => getLevelStyleTargetMode() === 'container';
    const isEditingLevelItems = () => getLevelStyleTargetMode() === 'item';
    const isLevelStyleTargetDisabled = () => getLevelStyleTargetMode() === 'off';
    const getStateTitle = () => {
      if (isLevelStyleTargetDisabled()) return 'Редагування вимкнено';
      const prefix = isEditingLevelContainers() ? 'Стилі контейнера' : 'Стилі пунктів меню';
      if (levelStylesState.state === 'hover') return `${prefix} · Hover`;
      if (levelStylesState.state === 'open') return `${prefix} · Open`;
      if (levelStylesState.state === 'current') return `${prefix} · Current`;
      return `${prefix} · Normal`;
    };
    const syncLevelEditModeUi = () => {
      const targetMode = getLevelStyleTargetMode();
      const containerMode = targetMode === 'container';
      const disabledMode = targetMode === 'off';
      if (levelStyleTargetModeInput) levelStyleTargetModeInput.value = targetMode;
      if (levelStyleBasicTextField instanceof HTMLElement) levelStyleBasicTextField.hidden = containerMode || disabledMode;
      if (levelStyleBasicFsField instanceof HTMLElement) levelStyleBasicFsField.hidden = containerMode || disabledMode;
      if (levelStylesWrap instanceof HTMLElement) {
        levelStylesWrap.dataset.editTarget = targetMode;
        levelStylesWrap.dataset.targetMode = targetMode;
      }
      const disableCtrls = [
        levelStyleBgEnabled,
        levelStyleBgInput,
        levelStyleBgOpacityInput,
        levelStyleBgOpacityNumInput,
        levelStyleColorEnabled,
        levelStyleColorInput,
        levelStyleFsEnabled,
        levelStyleFsInput,
        levelStyleBorderEnabled,
        ...levelStyleBorderModeInputs,
        levelStyleBorderColorInput,
        levelStyleBorderWidthInput,
        levelStyleBorderWidthNumInput,
        levelStyleBorderRadiusInput,
        levelStyleBorderRadiusNumInput,
        levelStyleBorderOpacityInput,
        levelStyleBorderOpacityNumInput,
        levelStyleBorderStyleInput,
        levelStyleShadowEnabled,
        levelStyleShadowColorInput,
        levelStyleShadowXInput,
        levelStyleShadowYInput,
        levelStyleShadowBlurInput,
        levelStyleShadowBlurNumInput,
        levelStyleShadowSpreadInput,
        levelStyleShadowSpreadNumInput,
        levelStyleShadowOpacityInput,
        levelStyleShadowOpacityNumInput,
        levelStyleShadowTypeInput,
      ];
      disableCtrls.forEach((ctrl) => {
        if (!(ctrl instanceof HTMLElement)) return;
        const isTextCtrl = ctrl === levelStyleColorEnabled || ctrl === levelStyleColorInput || ctrl === levelStyleFsEnabled || ctrl === levelStyleFsInput;
        ctrl.toggleAttribute('disabled', disabledMode || (containerMode && isTextCtrl));
      });
      levelStyleStateButtons.forEach((btn) => {
        if (!(btn instanceof HTMLElement)) return;
        btn.toggleAttribute('disabled', disabledMode);
      });
      [
        levelStylesWrap.querySelector('[data-act="level-styles-apply"]'),
        levelStylesWrap.querySelector('[data-act="level-styles-reset"]'),
      ].forEach((btn) => {
        if (!(btn instanceof HTMLElement)) return;
        btn.toggleAttribute('disabled', disabledMode);
      });
    };

    const getLevelBorderModeForUi = () => {
      const bw = normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth);
      return (levelStylesState.values.borderEnabled && bw === '0') ? 'none' : 'on';
    };

    const syncLevelBorderModeInputs = () => {
      const mode = getLevelBorderModeForUi();
      levelStyleBorderModeInputs.forEach((input) => {
        if (input instanceof HTMLInputElement) input.checked = input.value === mode;
      });
    };

    const syncLevelStyleInputs = () => {
      if (levelStyleStateLabel) levelStyleStateLabel.textContent = getStateTitle();
      levelStyleStateButtons.forEach((btn) => btn.classList.toggle('is-active', btn.getAttribute('data-state') === levelStylesState.state));
      if (levelStyleBgEnabled) levelStyleBgEnabled.checked = !!levelStylesState.values.bgEnabled;
      if (levelStyleBgInput) levelStyleBgInput.value = safeColor(levelStylesState.values.bg, '#0f172a');
      if (levelStyleBgDot) levelStyleBgDot.style.background = safeColor(levelStylesState.values.bg, '#0f172a');
      if (levelStyleBgOpacityInput) levelStyleBgOpacityInput.value = normalizeLevelBgOpacityInput(levelStylesState.values.bgOpacity) || '100';
      if (levelStyleBgOpacityNumInput) levelStyleBgOpacityNumInput.value = normalizeLevelBgOpacityInput(levelStylesState.values.bgOpacity) || '100';
      if (levelStyleColorEnabled) levelStyleColorEnabled.checked = !!levelStylesState.values.colorEnabled;
      if (levelStyleColorInput) levelStyleColorInput.value = safeColor(levelStylesState.values.color, '#e2e8f0');
      if (levelStyleColorDot) levelStyleColorDot.style.background = safeColor(levelStylesState.values.color, '#e2e8f0');
      if (levelStyleFsEnabled) levelStyleFsEnabled.checked = !!levelStylesState.values.fsEnabled;
      if (levelStyleFsInput) levelStyleFsInput.value = normalizeLevelFsInput(levelStylesState.values.fs) || '14';
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = !!levelStylesState.values.borderEnabled;
      syncLevelBorderModeInputs();
      if (levelStyleBorderColorInput) levelStyleBorderColorInput.value = safeColor(levelStylesState.values.borderColor, '#94a3b8');
      if (levelStyleBorderDot) levelStyleBorderDot.style.background = safeColor(levelStylesState.values.borderColor, '#94a3b8');
      if (levelStyleBorderWidthInput) levelStyleBorderWidthInput.value = normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth) || '1';
      if (levelStyleBorderWidthNumInput) levelStyleBorderWidthNumInput.value = normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth) || '1';
      if (levelStyleBorderRadiusInput) levelStyleBorderRadiusInput.value = normalizeLevelBorderRadiusInput(levelStylesState.values.borderRadius) || '12';
      if (levelStyleBorderRadiusNumInput) levelStyleBorderRadiusNumInput.value = normalizeLevelBorderRadiusInput(levelStylesState.values.borderRadius) || '12';
      if (levelStyleBorderOpacityInput) levelStyleBorderOpacityInput.value = normalizeLevelBgOpacityInput(levelStylesState.values.borderOpacity) || '100';
      if (levelStyleBorderOpacityNumInput) levelStyleBorderOpacityNumInput.value = normalizeLevelBgOpacityInput(levelStylesState.values.borderOpacity) || '100';
      if (levelStyleBorderStyleInput) levelStyleBorderStyleInput.value = (levelStylesState.values.borderStyle === 'dashed' || levelStylesState.values.borderStyle === 'dotted') ? levelStylesState.values.borderStyle : 'solid';
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = !!levelStylesState.values.shadowEnabled;
      if (levelStyleShadowColorInput) levelStyleShadowColorInput.value = safeColor(levelStylesState.values.shadowColor, '#000000');
      if (levelStyleShadowDot) levelStyleShadowDot.style.background = safeColor(levelStylesState.values.shadowColor, '#000000');
      if (levelStyleShadowOpacityInput) levelStyleShadowOpacityInput.value = normalizeLevelBgOpacityInput(levelStylesState.values.shadowOpacity) || '100';
      if (levelStyleShadowOpacityNumInput) levelStyleShadowOpacityNumInput.value = normalizeLevelBgOpacityInput(levelStylesState.values.shadowOpacity) || '100';
      if (levelStyleShadowTypeInput) levelStyleShadowTypeInput.value = levelStylesState.values.shadowType === 'inset' ? 'inset' : 'outer';
      if (levelStyleShadowXInput) levelStyleShadowXInput.value = normalizeLevelShadowAxisInput(levelStylesState.values.shadowX) || '0';
      if (levelStyleShadowYInput) levelStyleShadowYInput.value = normalizeLevelShadowAxisInput(levelStylesState.values.shadowY) || '8';
      if (levelStyleShadowBlurInput) levelStyleShadowBlurInput.value = normalizeLevelShadowBlurInput(levelStylesState.values.shadowBlur) || '24';
      if (levelStyleShadowBlurNumInput) levelStyleShadowBlurNumInput.value = normalizeLevelShadowBlurInput(levelStylesState.values.shadowBlur) || '24';
      if (levelStyleShadowSpreadInput) levelStyleShadowSpreadInput.value = normalizeLevelShadowSpreadInput(levelStylesState.values.shadowSpread) || '0';
      if (levelStyleShadowSpreadNumInput) levelStyleShadowSpreadNumInput.value = normalizeLevelShadowSpreadInput(levelStylesState.values.shadowSpread) || '0';
    };

    const syncLevelButtons = () => {
      if (!(levelStyleLevelsHost instanceof HTMLElement)) return;
      levelStyleLevelsHost.querySelectorAll('button[data-level]').forEach((btn) => {
        const level = String(btn.getAttribute('data-level') || '');
        btn.classList.toggle('is-active', levelStylesState.selected.has(level));
      });
    };

    const syncLevelStyleStateFromSelection = () => {
      const levels = Array.from(levelStylesState.selected).sort((a, b) => Number(a) - Number(b));
      if (isLevelStyleTargetDisabled()) return;
      const stylesMap = isEditingLevelContainers() ? getActiveLevelContainerStylesMap() : getActiveLevelStylesMap();
      if (!levels.length) {
        levelStylesState.values = {
          bgEnabled: false,
          bg: '#0f172a',
          bgOpacity: '100',
          colorEnabled: false,
          color: '#e2e8f0',
          fsEnabled: false,
          fs: '14',
          borderEnabled: false,
          borderColor: '#94a3b8',
          borderWidth: '1',
          borderRadius: '12',
          borderStyle: 'solid',
        borderOpacity: '100',
        radiusEnabled: false,
          shadowEnabled: false,
          shadowColor: '#000000',
          shadowOpacity: '100',
          shadowType: 'outer',
          shadowX: '0',
          shadowY: '8',
          shadowBlur: '24',
          shadowSpread: '0',
        };
        if (isEditingLevelContainers()) {
          levelStylesState.values.colorEnabled = false;
          levelStylesState.values.color = '#e2e8f0';
          levelStylesState.values.fsEnabled = false;
          levelStylesState.values.fs = '14';
        }
        syncLevelEditModeUi();
        syncLevelStyleInputs();
        syncLevelLayoutFromSelection();
        syncLevelButtons();
        return;
      }
      const rows = levels.map((level) => getLevelStyle(stylesMap, level));
      const same = (getter) => rows.every((row) => getter(row) === getter(rows[0]));
      const bgEnabled = rows.every((row) => !!row.bg);
      const colorEnabled = rows.every((row) => !!row.color);
      const fsEnabled = rows.every((row) => !!row.fs);
      const borderEnabled = rows.every((row) => !!row.bc || !!row.bw || !!row.br || !!row.bs);
      const shadowEnabled = rows.every((row) => !!row.shColor);
      levelStylesState.values = {
        bgEnabled,
        bg: bgEnabled && same((row) => row.bg) ? rows[0].bg : '#0f172a',
        bgOpacity: bgEnabled && same((row) => row.bgo) ? (rows[0].bgo || '100') : '100',
        colorEnabled,
        color: colorEnabled && same((row) => row.color) ? rows[0].color : '#e2e8f0',
        fsEnabled,
        fs: fsEnabled && same((row) => row.fs) ? rows[0].fs : '14',
        borderEnabled,
        borderColor: borderEnabled && same((row) => row.bc) ? (rows[0].bc || '#94a3b8') : '#94a3b8',
        borderWidth: borderEnabled && same((row) => row.bw) ? (rows[0].bw || '1') : '1',
        borderRadius: borderEnabled && same((row) => row.br) ? (rows[0].br || '12') : '12',
        borderStyle: borderEnabled && same((row) => row.bs) ? (rows[0].bs || 'solid') : 'solid',
        borderOpacity: borderEnabled && same((row) => row.bco) ? (rows[0].bco || '100') : '100',
        shadowEnabled,
        shadowColor: shadowEnabled && same((row) => row.shColor) ? (rows[0].shColor || '#000000') : '#000000',
        shadowOpacity: shadowEnabled && same((row) => row.sho) ? (rows[0].sho || '100') : '100',
        shadowType: shadowEnabled && same((row) => row.sht) ? (rows[0].sht || 'outer') : 'outer',
        shadowX: shadowEnabled && same((row) => row.shX) ? (rows[0].shX || '0') : '0',
        shadowY: shadowEnabled && same((row) => row.shY) ? (rows[0].shY || '8') : '8',
        shadowBlur: shadowEnabled && same((row) => row.shBlur) ? (rows[0].shBlur || '24') : '24',
        shadowSpread: shadowEnabled && same((row) => row.shSpread) ? (rows[0].shSpread || '0') : '0',
      };
      if (isEditingLevelContainers()) {
        levelStylesState.values.colorEnabled = false;
        levelStylesState.values.color = '#e2e8f0';
        levelStylesState.values.fsEnabled = false;
        levelStylesState.values.fs = '14';
      }
      syncLevelEditModeUi();
      syncLevelStyleInputs();
      syncLevelLayoutFromSelection();
      syncLevelButtons();
    };

    const renderLevelButtons = () => {
      if (!(levelStyleLevelsHost instanceof HTMLElement)) return;
      levelStyleLevelsHost.innerHTML = '';
      for (let i = 1; i <= 10; i += 1) {
        const btn = document.createElement('button');
        btn.className = 'st-btn st-hfmenu-levelstyles__level';
        btn.type = 'button';
        btn.setAttribute('data-level', String(i));
        btn.textContent = String(i);
        btn.addEventListener('click', () => {
          const key = String(i);
          if (levelStylesState.selected.has(key)) levelStylesState.selected.delete(key);
          else levelStylesState.selected.add(key);
          syncLevelStyleStateFromSelection();
        });
        levelStyleLevelsHost.appendChild(btn);
      }
      syncLevelButtons();
    };

    const applyActiveLevelStylesRuntimeOnly = () => {
      const editingContainers = isEditingLevelContainers();
      writeMenuData(blk, data);

      // 00329: level style controls must not rebuild menu links.
      // Re-rendering the menu can recreate the link DOM and fall back to tiny/default
      // button styles.  These controls only change CSS vars, so apply them in-place.
      if (editingContainers) {
        const normal = normalizeLevelStyles(data.levelContainerStyles);
        const hover = normalizeLevelStyles(data.levelContainerHoverStyles);
        const open = normalizeLevelStyles(data.levelContainerOpenStyles);
        const current = normalizeLevelStyles(data.levelContainerCurrentStyles);
        const stateMaps = { hover, open, current };
        blk.querySelectorAll('.st-menu__list[data-menu-list-depth], .st-menu__item--mega-shared-area[data-menu-shared-area]').forEach((listEl) => {
          if (!(listEl instanceof HTMLElement)) return;
          const level = Number(listEl.dataset.menuListDepth || listEl.dataset.menuDepth || 1) || 1;
          applyListContainerStyle(listEl, normal, level, stateMaps);
        });
        return;
      }

      applyMenuLevelStylesRuntime(
        blk,
        data.levelStyles,
        data.levelHoverStyles,
        data.levelOpenStyles,
        data.levelCurrentStyles
      );
    };

    const applyLevelStylesToSelected = ({ resync = true } = {}) => {
      const levels = Array.from(levelStylesState.selected);
      if (!levels.length) return;
      if (isLevelStyleTargetDisabled()) return;
      const editingContainers = isEditingLevelContainers();
      const stylesMap = editingContainers ? getActiveLevelContainerStylesMap() : getActiveLevelStylesMap();
      levels.forEach((level) => {
        const cur = getLevelStyle(stylesMap, level);

        // Keep the old behavior for groups that are explicitly enabled/disabled by
        // their checkboxes, but do not rebuild the menu after writing them.
        cur.bg = levelStylesState.values.bgEnabled ? safeColor(levelStylesState.values.bg, '#0f172a') : '';
        cur.bgo = levelStylesState.values.bgEnabled ? (normalizeLevelBgOpacityInput(levelStylesState.values.bgOpacity) || '100') : '';
        if (!editingContainers) {
          cur.color = levelStylesState.values.colorEnabled ? safeColor(levelStylesState.values.color, '#e2e8f0') : '';
          cur.fs = levelStylesState.values.fsEnabled ? (normalizeLevelFsInput(levelStylesState.values.fs) || '') : '';
        }
        cur.bc = levelStylesState.values.borderEnabled ? safeColor(levelStylesState.values.borderColor, '#94a3b8') : '';
        cur.bw = levelStylesState.values.borderEnabled ? (normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth) || '') : '';
        cur.br = levelStylesState.values.borderEnabled ? (normalizeLevelBorderRadiusInput(levelStylesState.values.borderRadius) || '') : '';
        cur.bs = levelStylesState.values.borderEnabled ? ((levelStylesState.values.borderStyle === 'dashed' || levelStylesState.values.borderStyle === 'dotted') ? levelStylesState.values.borderStyle : 'solid') : '';
        cur.bco = levelStylesState.values.borderEnabled ? (normalizeLevelBgOpacityInput(levelStylesState.values.borderOpacity) || '100') : '';
        cur.shColor = levelStylesState.values.shadowEnabled ? safeColor(levelStylesState.values.shadowColor, '#000000') : '';
        cur.sho = levelStylesState.values.shadowEnabled ? (normalizeLevelBgOpacityInput(levelStylesState.values.shadowOpacity) || '100') : '';
        cur.sht = levelStylesState.values.shadowEnabled ? (levelStylesState.values.shadowType === 'inset' ? 'inset' : 'outer') : '';
        cur.shX = levelStylesState.values.shadowEnabled ? (normalizeLevelShadowAxisInput(levelStylesState.values.shadowX) || '0') : '';
        cur.shY = levelStylesState.values.shadowEnabled ? (normalizeLevelShadowAxisInput(levelStylesState.values.shadowY) || '8') : '';
        cur.shBlur = levelStylesState.values.shadowEnabled ? (normalizeLevelShadowBlurInput(levelStylesState.values.shadowBlur) || '24') : '';
        cur.shSpread = levelStylesState.values.shadowEnabled ? (normalizeLevelShadowSpreadInput(levelStylesState.values.shadowSpread) || '0') : '';
        stylesMap[String(level)] = cur;
      });
      if (editingContainers) setActiveLevelContainerStylesMap(stylesMap);
      else setActiveLevelStylesMap(stylesMap);
      applyActiveLevelStylesRuntimeOnly();
      if (resync) syncLevelStyleStateFromSelection();
    };

    const applyLevelStylesRealtime = () => {
      if (isLevelStyleTargetDisabled()) return;
      if (!levelStylesState.selected.size) return;
      applyLevelStylesToSelected({ resync: false });
    };
    const applyLevelStylePatchToSelected = (patch, { resync = false } = {}) => {
      const levels = Array.from(levelStylesState.selected);
      if (!levels.length) return;
      if (isLevelStyleTargetDisabled()) return;
      const editingContainers = isEditingLevelContainers();
      const stylesMap = editingContainers ? getActiveLevelContainerStylesMap() : getActiveLevelStylesMap();
      levels.forEach((level) => {
        const cur = getLevelStyle(stylesMap, level);
        Object.keys(patch || {}).forEach((key) => {
          cur[key] = patch[key];
        });
        stylesMap[String(level)] = cur;
      });
      if (editingContainers) setActiveLevelContainerStylesMap(stylesMap);
      else setActiveLevelStylesMap(stylesMap);
      applyActiveLevelStylesRuntimeOnly();
      if (resync) syncLevelStyleStateFromSelection();
    };

    const commitLevelStylesFinal = () => {
      if (!levelStylesState.selected.size) return;
      applyLevelStylesToSelected({ resync: true });
    };

    const resetSelectedLevelStyles = () => {
      const levels = Array.from(levelStylesState.selected);
      if (!levels.length) return;
      if (isLevelStyleTargetDisabled()) return;
      const stylesMap = isEditingLevelContainers() ? getActiveLevelContainerStylesMap() : getActiveLevelStylesMap();
      levels.forEach((level) => {
        stylesMap[String(level)] = { bg: '', color: '', fs: '', bc: '', bs: '', bw: '', br: '', bgo: '', bco: '', shColor: '', sho: '', sht: '', shX: '', shY: '', shBlur: '', shSpread: '' };
      });
      if (isEditingLevelContainers()) setActiveLevelContainerStylesMap(stylesMap);
      else setActiveLevelStylesMap(stylesMap);
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      syncLevelStyleStateFromSelection();
    };


    [
      levelStyleBgInput,
      levelStyleBgOpacityInput,
      levelStyleBgOpacityNumInput,
      levelStyleColorInput,
      levelStyleFsInput,
      levelStyleBorderColorInput,
      levelStyleBorderWidthInput,
      levelStyleBorderWidthNumInput,
      levelStyleBorderRadiusInput,
      levelStyleBorderRadiusNumInput,
      levelStyleBorderOpacityInput,
      levelStyleBorderOpacityNumInput,
      levelStyleBorderStyleInput,
      levelStyleShadowColorInput,
      levelStyleShadowXInput,
      levelStyleShadowYInput,
      levelStyleShadowBlurInput,
      levelStyleShadowBlurNumInput,
      levelStyleShadowSpreadInput,
      levelStyleShadowSpreadNumInput,
      levelStyleShadowOpacityInput,
      levelStyleShadowOpacityNumInput,
      levelStyleShadowTypeInput,
      levelStyleBgEnabled,
      levelStyleColorEnabled,
      levelStyleFsEnabled,
      levelStyleBorderEnabled,
      levelStyleShadowEnabled,
    ].forEach((ctrl) => {
      ctrl?.addEventListener('change', commitLevelStylesFinal);
      ctrl?.addEventListener('blur', commitLevelStylesFinal);
    });

    levelStylesWrap.querySelector('[data-act="level-styles-select-all"]')?.addEventListener('click', () => {
      levelStylesState.selected = new Set(Array.from({ length: 10 }, (_, idx) => String(idx + 1)));
      syncLevelStyleStateFromSelection();
    });
    levelStylesWrap.querySelector('[data-act="level-styles-clear-selection"]')?.addEventListener('click', () => {
      levelStylesState.selected.clear();
      syncLevelStyleStateFromSelection();
    });
    levelStyleStateButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const rawState = String(btn.getAttribute('data-state') || 'normal').trim().toLowerCase();
        const nextState = (rawState === 'hover' || rawState === 'open' || rawState === 'current') ? rawState : 'normal';
        if (levelStylesState.state === nextState) return;
        levelStylesState.state = nextState;
        syncLevelStyleStateFromSelection();
      });
    });
    levelStyleTargetModeInput?.addEventListener('change', () => {
      levelStylesState.targetMode = normalizeLevelStyleTargetMode(levelStyleTargetModeInput.value);
      syncLevelStyleStateFromSelection();
    });
    attachLevelStyleDisplayModeListener();
    levelStylesWrap.querySelector('[data-act="level-styles-apply"]')?.addEventListener('click', applyLevelStylesToSelected);
    levelStylesWrap.querySelector('[data-act="level-styles-reset"]')?.addEventListener('click', resetSelectedLevelStyles);
    levelStyleBgEnabled?.addEventListener('change', () => {
      levelStylesState.values.bgEnabled = !!levelStyleBgEnabled.checked;
      applyLevelStylesRealtime();
    });
    levelStyleBgInput?.addEventListener('input', () => {
      levelStylesState.values.bgEnabled = true;
      if (levelStyleBgEnabled) levelStyleBgEnabled.checked = true;
      levelStylesState.values.bg = safeColor(levelStyleBgInput.value, '#0f172a');
      if (levelStyleBgDot) levelStyleBgDot.style.background = levelStylesState.values.bg;
      applyLevelStylesRealtime();
    });
    levelStyleBgOpacityInput?.addEventListener('input', () => {
      levelStylesState.values.bgEnabled = true;
      if (levelStyleBgEnabled) levelStyleBgEnabled.checked = true;
      levelStylesState.values.bgOpacity = normalizeLevelBgOpacityInput(levelStyleBgOpacityInput.value) || '100';
      applyLevelStylesRealtime();
    });
    levelStyleColorEnabled?.addEventListener('change', () => {
      levelStylesState.values.colorEnabled = !!levelStyleColorEnabled.checked;
      applyLevelStylesRealtime();
    });
    levelStyleColorInput?.addEventListener('input', () => {
      levelStylesState.values.colorEnabled = true;
      if (levelStyleColorEnabled) levelStyleColorEnabled.checked = true;
      levelStylesState.values.color = safeColor(levelStyleColorInput.value, '#e2e8f0');
      if (levelStyleColorDot) levelStyleColorDot.style.background = levelStylesState.values.color;
      applyLevelStylesRealtime();
    });
    levelStyleFsEnabled?.addEventListener('change', () => {
      levelStylesState.values.fsEnabled = !!levelStyleFsEnabled.checked;
      applyLevelStylesRealtime();
    });
    levelStyleFsInput?.addEventListener('input', () => {
      levelStylesState.values.fsEnabled = true;
      if (levelStyleFsEnabled) levelStyleFsEnabled.checked = true;
      levelStylesState.values.fs = normalizeLevelFsInput(levelStyleFsInput.value) || '14';
      applyLevelStylesRealtime();
    });
    levelStyleBorderEnabled?.addEventListener('change', () => {
      levelStylesState.values.borderEnabled = !!levelStyleBorderEnabled.checked;
      syncLevelBorderModeInputs();
      applyLevelStylesRealtime();
    });

    const applyLevelBorderModeOnly = (mode) => {
      if (isLevelStyleTargetDisabled()) return;
      const levels = Array.from(levelStylesState.selected);
      if (!levels.length) return;
      const editingContainers = isEditingLevelContainers();
      const stylesMap = editingContainers ? getActiveLevelContainerStylesMap() : getActiveLevelStylesMap();
      levels.forEach((level) => {
        const cur = getLevelStyle(stylesMap, level);
        if (mode === 'none') {
          cur.bw = '0';
          cur.bs = cur.bs || 'solid';
          // Не чіпаємо bg/color/fs/padding/shadow/radius: кнопка має втратити тільки рамку.
        } else {
          cur.bw = (normalizeLevelBorderWidthInput(cur.bw) && normalizeLevelBorderWidthInput(cur.bw) !== '0')
            ? normalizeLevelBorderWidthInput(cur.bw)
            : '1';
          cur.bs = cur.bs || 'solid';
          cur.bc = cur.bc || safeColor(levelStylesState.values.borderColor, '#94a3b8');
          cur.bco = cur.bco || normalizeLevelBgOpacityInput(levelStylesState.values.borderOpacity) || '100';
        }
        stylesMap[String(level)] = cur;
      });
      if (editingContainers) {
        setActiveLevelContainerStylesMap(stylesMap);
        writeMenuData(blk, data);
        const normal = normalizeLevelStyles(data.levelContainerStyles);
        const hover = normalizeLevelStyles(data.levelContainerHoverStyles);
        const open = normalizeLevelStyles(data.levelContainerOpenStyles);
        const current = normalizeLevelStyles(data.levelContainerCurrentStyles);
        const stateMaps = { hover, open, current };
        blk.querySelectorAll('.st-menu__list[data-menu-list-depth], .st-menu__item--mega-shared-area[data-menu-shared-area]').forEach((listEl) => {
          if (!(listEl instanceof HTMLElement)) return;
          const level = Number(listEl.dataset.menuListDepth || listEl.dataset.menuDepth || 1) || 1;
          applyListContainerStyle(listEl, normal, level, stateMaps);
        });
      } else {
        setActiveLevelStylesMap(stylesMap);
        writeMenuData(blk, data);
        applyMenuLevelStylesRuntime(blk, data.levelStyles, data.levelHoverStyles, data.levelOpenStyles, data.levelCurrentStyles);
      }
      if (mode === 'none') {
        levelStylesState.values.borderEnabled = true;
        levelStylesState.values.borderWidth = '0';
      } else {
        levelStylesState.values.borderEnabled = true;
        levelStylesState.values.borderWidth = (normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth) && normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth) !== '0') ? normalizeLevelBorderWidthInput(levelStylesState.values.borderWidth) : '1';
        levelStylesState.values.borderStyle = levelStylesState.values.borderStyle || 'solid';
        levelStylesState.values.borderColor = levelStylesState.values.borderColor || '#94a3b8';
      }
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = true;
      syncLevelBorderModeInputs();
      if (levelStyleBorderWidthInput) levelStyleBorderWidthInput.value = levelStylesState.values.borderWidth;
      if (levelStyleBorderWidthNumInput) levelStyleBorderWidthNumInput.value = levelStylesState.values.borderWidth;
    };

    levelStyleBorderModeInputs.forEach((input) => {
      input?.addEventListener('change', () => {
        if (!(input instanceof HTMLInputElement) || !input.checked) return;
        applyLevelBorderModeOnly(input.value === 'none' ? 'none' : 'on');
      });
    });
    levelStyleBorderColorInput?.addEventListener('input', () => {
      levelStylesState.values.borderEnabled = true;
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = true;
      levelStylesState.values.borderColor = safeColor(levelStyleBorderColorInput.value, '#94a3b8');
      if (levelStyleBorderDot) levelStyleBorderDot.style.background = levelStylesState.values.borderColor;
      // 00329: changing border color must update only border color, not font/size/fill.
      applyLevelStylePatchToSelected({
        bc: levelStylesState.values.borderColor,
        bco: normalizeLevelBgOpacityInput(levelStylesState.values.borderOpacity) || '100',
      });
    });
    levelStyleBorderWidthInput?.addEventListener('input', () => {
      levelStylesState.values.borderEnabled = true;
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = true;
      levelStylesState.values.borderWidth = normalizeLevelBorderWidthInput(levelStyleBorderWidthInput.value) || '1';
      syncLevelBorderModeInputs();
      applyLevelStylePatchToSelected({ bw: levelStylesState.values.borderWidth });
    });
    levelStyleBorderRadiusInput?.addEventListener('input', () => {
      levelStylesState.values.borderEnabled = true;
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = true;
      levelStylesState.values.borderRadius = normalizeLevelBorderRadiusInput(levelStyleBorderRadiusInput.value) || '12';
      applyLevelStylePatchToSelected({ br: levelStylesState.values.borderRadius });
    });
    levelStyleBorderOpacityInput?.addEventListener('input', () => {
      levelStylesState.values.borderEnabled = true;
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = true;
      levelStylesState.values.borderOpacity = normalizeLevelBgOpacityInput(levelStyleBorderOpacityInput.value) || '100';
      applyLevelStylePatchToSelected({ bco: levelStylesState.values.borderOpacity });
    });
    levelStyleBorderStyleInput?.addEventListener('change', () => {
      levelStylesState.values.borderEnabled = true;
      if (levelStyleBorderEnabled) levelStyleBorderEnabled.checked = true;
      levelStylesState.values.borderStyle = (levelStyleBorderStyleInput.value === 'dashed' || levelStyleBorderStyleInput.value === 'dotted') ? levelStyleBorderStyleInput.value : 'solid';
      applyLevelStylePatchToSelected({ bs: levelStylesState.values.borderStyle });
    });
    levelStyleShadowEnabled?.addEventListener('change', () => {
      levelStylesState.values.shadowEnabled = !!levelStyleShadowEnabled.checked;
      applyLevelStylesRealtime();
    });
    levelStyleShadowColorInput?.addEventListener('input', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowColor = safeColor(levelStyleShadowColorInput.value, '#000000');
      if (levelStyleShadowDot) levelStyleShadowDot.style.background = levelStylesState.values.shadowColor;
      applyLevelStylesRealtime();
    });
    levelStyleShadowOpacityInput?.addEventListener('input', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowOpacity = normalizeLevelBgOpacityInput(levelStyleShadowOpacityInput.value) || '100';
      applyLevelStylesRealtime();
    });
    levelStyleShadowTypeInput?.addEventListener('change', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowType = levelStyleShadowTypeInput.value === 'inset' ? 'inset' : 'outer';
      applyLevelStylesRealtime();
    });
    levelStyleShadowXInput?.addEventListener('input', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowX = normalizeLevelShadowAxisInput(levelStyleShadowXInput.value) || '0';
      applyLevelStylesRealtime();
    });
    levelStyleShadowYInput?.addEventListener('input', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowY = normalizeLevelShadowAxisInput(levelStyleShadowYInput.value) || '8';
      applyLevelStylesRealtime();
    });
    levelStyleShadowBlurInput?.addEventListener('input', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowBlur = normalizeLevelShadowBlurInput(levelStyleShadowBlurInput.value) || '24';
      applyLevelStylesRealtime();
    });
    levelStyleShadowSpreadInput?.addEventListener('input', () => {
      levelStylesState.values.shadowEnabled = true;
      if (levelStyleShadowEnabled) levelStyleShadowEnabled.checked = true;
      levelStylesState.values.shadowSpread = normalizeLevelShadowSpreadInput(levelStyleShadowSpreadInput.value) || '0';
      applyLevelStylesRealtime();
    });

    const containerStylesWrap = document.createElement('div');
    containerStylesWrap.className = 'st-hfmenu-quick st-hfmenu-levelstyles';
    containerStylesWrap.innerHTML = `
      <div class="st-hfmenu-quick__title">Стилі контейнерів рівнів</div>
      <div class="st-hfmenu-quick__sub">Контейнери рівнів меню</div>
      <div class="st-hfmenu-levelstyles__levels" data-role="level-box-levels"></div>
      <div class="st-hfmenu-levelstyles__level-actions">
        <button class="st-btn" type="button" data-act="level-box-select-all">Вибрати всі</button>
        <button class="st-btn" type="button" data-act="level-box-clear-selection">Очистити вибір</button>
      </div>
      <div class="st-hfmenu-levelstyles__form">
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Фон контейнера</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-box-bg-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="color" value="#0f172a" data-act="level-box-bg" />
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Лінії контейнера</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-box-border-enabled" />
            <span>Окремо</span>
          </label>
          <div class="st-hfmenu-levelstyles__split4">
            <input class="st-inp" type="color" value="#94a3b8" data-act="level-box-border-color" />
            <input class="st-inp" type="number" min="0" max="20" step="1" value="1" data-act="level-box-border-width" placeholder="Товщина" />
            <select class="st-inp" data-act="level-box-border-style">
              <option value="solid">solid</option>
              <option value="dashed">dashed</option>
              <option value="dotted">dotted</option>
            </select>
          </div>
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Радіус контейнера</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-box-radius-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="number" min="0" max="200" step="1" value="16" data-act="level-box-border-radius" placeholder="Радіус" />
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Тіні контейнера</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-box-shadow-enabled" />
            <span>Окремо</span>
          </label>
          <div class="st-hfmenu-levelstyles__split5">
            <input class="st-inp" type="color" value="#000000" data-act="level-box-shadow-color" />
            <input class="st-inp" type="number" min="-200" max="200" step="1" value="0" data-act="level-box-shadow-x" placeholder="X" />
            <input class="st-inp" type="number" min="-200" max="200" step="1" value="8" data-act="level-box-shadow-y" placeholder="Y" />
            <input class="st-inp" type="number" min="0" max="300" step="1" value="24" data-act="level-box-shadow-blur" placeholder="Blur" />
            <input class="st-inp" type="number" min="-100" max="200" step="1" value="0" data-act="level-box-shadow-spread" placeholder="Spread" />
          </div>
        </label>
      </div>
      <div class="st-hfmenu-levelstyles__apply">
        <button class="st-btn" type="button" data-act="level-box-apply">Застосувати до вибраних рівнів</button>
        <button class="st-btn" type="button" data-act="level-box-reset">Скинути вибрані рівні</button>
      </div>
      <div class="st-hfmenu-quick__hint">Тут задаються стилі саме для контейнерів рівнів 1–10: фон, лінії, тіні та окремий радіус. Зміни видно одразу в реальному часі.</div>
    `.trim();

    const levelBoxLevelsHost = containerStylesWrap.querySelector('[data-role="level-box-levels"]');
    const levelBoxBgEnabled = containerStylesWrap.querySelector('input[data-act="level-box-bg-enabled"]');
    const levelBoxBgInput = containerStylesWrap.querySelector('input[data-act="level-box-bg"]');
    const levelBoxBorderEnabled = containerStylesWrap.querySelector('input[data-act="level-box-border-enabled"]');
    const levelBoxBorderColorInput = containerStylesWrap.querySelector('input[data-act="level-box-border-color"]');
    const levelBoxBorderWidthInput = containerStylesWrap.querySelector('input[data-act="level-box-border-width"]');
    const levelBoxBorderRadiusInput = containerStylesWrap.querySelector('input[data-act="level-box-border-radius"]');
    const levelBoxBorderStyleInput = containerStylesWrap.querySelector('select[data-act="level-box-border-style"]');
    const levelBoxRadiusEnabled = containerStylesWrap.querySelector('input[data-act="level-box-radius-enabled"]');
    const levelBoxShadowEnabled = containerStylesWrap.querySelector('input[data-act="level-box-shadow-enabled"]');
    const levelBoxShadowColorInput = containerStylesWrap.querySelector('input[data-act="level-box-shadow-color"]');
    const levelBoxShadowXInput = containerStylesWrap.querySelector('input[data-act="level-box-shadow-x"]');
    const levelBoxShadowYInput = containerStylesWrap.querySelector('input[data-act="level-box-shadow-y"]');
    const levelBoxShadowBlurInput = containerStylesWrap.querySelector('input[data-act="level-box-shadow-blur"]');
    const levelBoxShadowSpreadInput = containerStylesWrap.querySelector('input[data-act="level-box-shadow-spread"]');
    const levelBoxState = {
      selected: new Set(),
      values: {
        bgEnabled: false,
        bg: '#0f172a',
        bgOpacity: '100',
        borderEnabled: false,
        borderColor: '#94a3b8',
        borderWidth: '1',
        borderRadius: '16',
        borderStyle: 'solid',
        borderOpacity: '100',
        radiusEnabled: false,
        shadowEnabled: false,
        shadowColor: '#000000',
        shadowOpacity: '100',
        shadowType: 'outer',
        shadowX: '0',
        shadowY: '8',
        shadowBlur: '24',
        shadowSpread: '0',
      },
    };

    const renderLevelBoxButtons = () => {
      if (!levelBoxLevelsHost) return;
      levelBoxLevelsHost.innerHTML = '';
      for (let i = 1; i <= 10; i += 1) {
        const key = String(i);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-btn st-hfmenu-levelstyles__level';
        btn.textContent = key;
        btn.dataset.level = key;
        btn.classList.toggle('is-active', levelBoxState.selected.has(key));
        btn.addEventListener('click', () => {
          if (levelBoxState.selected.has(key)) levelBoxState.selected.delete(key);
          else levelBoxState.selected.add(key);
          syncLevelBoxStateFromSelection();
        });
        levelBoxLevelsHost.appendChild(btn);
      }
    };

    const syncLevelBoxButtons = () => {
      if (!levelBoxLevelsHost) return;
      Array.from(levelBoxLevelsHost.querySelectorAll('[data-level]')).forEach((btn) => {
        const key = String(btn.getAttribute('data-level') || '');
        btn.classList.toggle('is-active', levelBoxState.selected.has(key));
      });
    };

    const syncLevelBoxStateFromSelection = () => {
      const map = normalizeLevelStyles(data.levelContainerStyles);
      const levels = Array.from(levelBoxState.selected).sort((a, b) => Number(a) - Number(b));
      if (!levels.length) {
        levelBoxState.values = {
          bgEnabled: false,
          bg: '#0f172a',
          bgOpacity: '100',
          borderEnabled: false,
          borderColor: '#94a3b8',
          borderWidth: '1',
          borderRadius: '16',
          borderStyle: 'solid',
        borderOpacity: '100',
        radiusEnabled: false,
          shadowEnabled: false,
          shadowColor: '#000000',
          shadowOpacity: '100',
          shadowType: 'outer',
          shadowX: '0',
          shadowY: '8',
          shadowBlur: '24',
          shadowSpread: '0',
        };
      } else {
        const first = getLevelStyle(map, levels[0]);
        levelBoxState.values = {
          bgEnabled: !!first.bg,
          bg: safeColor(first.bg, '#0f172a'),
          borderEnabled: !!(first.bc || first.bw || first.br || first.bs),
          borderColor: safeColor(first.bc, '#94a3b8'),
          borderWidth: normalizeLevelBorderWidthInput(first.bw) || '1',
          borderRadius: normalizeLevelBorderRadiusInput(first.br) || '16',
          borderStyle: (first.bs === 'dashed' || first.bs === 'dotted') ? first.bs : 'solid',
          radiusEnabled: !!first.br,
          shadowEnabled: !!first.shColor,
          shadowColor: safeColor(first.shColor, '#000000'),
          shadowX: normalizeLevelShadowAxisInput(first.shX) || '0',
          shadowY: normalizeLevelShadowAxisInput(first.shY) || '8',
          shadowBlur: normalizeLevelShadowBlurInput(first.shBlur) || '24',
          shadowSpread: normalizeLevelShadowSpreadInput(first.shSpread) || '0',
        };
      }
      if (levelBoxBgEnabled) levelBoxBgEnabled.checked = !!levelBoxState.values.bgEnabled;
      if (levelBoxBgInput) levelBoxBgInput.value = safeColor(levelBoxState.values.bg, '#0f172a');
      if (levelBoxBorderEnabled) levelBoxBorderEnabled.checked = !!levelBoxState.values.borderEnabled;
      if (levelBoxBorderColorInput) levelBoxBorderColorInput.value = safeColor(levelBoxState.values.borderColor, '#94a3b8');
      if (levelBoxBorderWidthInput) levelBoxBorderWidthInput.value = normalizeLevelBorderWidthInput(levelBoxState.values.borderWidth) || '1';
      if (levelBoxBorderRadiusInput) levelBoxBorderRadiusInput.value = normalizeLevelBorderRadiusInput(levelBoxState.values.borderRadius) || '16';
      if (levelBoxBorderStyleInput) levelBoxBorderStyleInput.value = (levelBoxState.values.borderStyle === 'dashed' || levelBoxState.values.borderStyle === 'dotted') ? levelBoxState.values.borderStyle : 'solid';
      if (levelBoxRadiusEnabled) levelBoxRadiusEnabled.checked = !!levelBoxState.values.radiusEnabled;
      if (levelBoxShadowEnabled) levelBoxShadowEnabled.checked = !!levelBoxState.values.shadowEnabled;
      if (levelBoxShadowColorInput) levelBoxShadowColorInput.value = safeColor(levelBoxState.values.shadowColor, '#000000');
      if (levelBoxShadowXInput) levelBoxShadowXInput.value = normalizeLevelShadowAxisInput(levelBoxState.values.shadowX) || '0';
      if (levelBoxShadowYInput) levelBoxShadowYInput.value = normalizeLevelShadowAxisInput(levelBoxState.values.shadowY) || '8';
      if (levelBoxShadowBlurInput) levelBoxShadowBlurInput.value = normalizeLevelShadowBlurInput(levelBoxState.values.shadowBlur) || '24';
      if (levelBoxShadowSpreadInput) levelBoxShadowSpreadInput.value = normalizeLevelShadowSpreadInput(levelBoxState.values.shadowSpread) || '0';
      syncLevelBoxButtons();
    };

    const applyLevelBoxStylesToSelected = () => {
      const levels = Array.from(levelBoxState.selected);
      if (!levels.length) return;
      const stylesMap = normalizeLevelStyles(data.levelContainerStyles);
      levels.forEach((level) => {
        const cur = getLevelStyle(stylesMap, level);
        cur.bg = levelBoxState.values.bgEnabled ? safeColor(levelBoxState.values.bg, '#0f172a') : '';
        cur.bc = levelBoxState.values.borderEnabled ? safeColor(levelBoxState.values.borderColor, '#94a3b8') : '';
        cur.bw = levelBoxState.values.borderEnabled ? (normalizeLevelBorderWidthInput(levelBoxState.values.borderWidth) || '') : '';
        cur.br = levelBoxState.values.radiusEnabled ? (normalizeLevelBorderRadiusInput(levelBoxState.values.borderRadius) || '') : '';
        cur.bs = levelBoxState.values.borderEnabled ? ((levelBoxState.values.borderStyle === 'dashed' || levelBoxState.values.borderStyle === 'dotted') ? levelBoxState.values.borderStyle : 'solid') : '';
        cur.shColor = levelBoxState.values.shadowEnabled ? safeColor(levelBoxState.values.shadowColor, '#000000') : '';
        cur.shX = levelBoxState.values.shadowEnabled ? (normalizeLevelShadowAxisInput(levelBoxState.values.shadowX) || '0') : '';
        cur.shY = levelBoxState.values.shadowEnabled ? (normalizeLevelShadowAxisInput(levelBoxState.values.shadowY) || '8') : '';
        cur.shBlur = levelBoxState.values.shadowEnabled ? (normalizeLevelShadowBlurInput(levelBoxState.values.shadowBlur) || '24') : '';
        cur.shSpread = levelBoxState.values.shadowEnabled ? (normalizeLevelShadowSpreadInput(levelBoxState.values.shadowSpread) || '0') : '';
        stylesMap[String(level)] = cur;
      });
      data.levelContainerStyles = stylesMap;
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      syncLevelBoxStateFromSelection();
    };

    const applyLevelBoxStylesRealtime = () => {
      if (!levelBoxState.selected.size) return;
      applyLevelBoxStylesToSelected();
    };

    const resetSelectedLevelBoxStyles = () => {
      const levels = Array.from(levelBoxState.selected);
      if (!levels.length) return;
      const stylesMap = normalizeLevelStyles(data.levelContainerStyles);
      levels.forEach((level) => {
        stylesMap[String(level)] = { bg: '', color: '', fs: '', bc: '', bs: '', bw: '', br: '', bgo: '', bco: '', shColor: '', sho: '', sht: '', shX: '', shY: '', shBlur: '', shSpread: '' };
      });
      data.levelContainerStyles = stylesMap;
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      syncLevelBoxStateFromSelection();
    };

    containerStylesWrap.querySelector('[data-act="level-box-select-all"]')?.addEventListener('click', () => {
      levelBoxState.selected = new Set(Array.from({ length: 10 }, (_, idx) => String(idx + 1)));
      syncLevelBoxStateFromSelection();
    });
    containerStylesWrap.querySelector('[data-act="level-box-clear-selection"]')?.addEventListener('click', () => {
      levelBoxState.selected.clear();
      syncLevelBoxStateFromSelection();
    });
    containerStylesWrap.querySelector('[data-act="level-box-apply"]')?.addEventListener('click', applyLevelBoxStylesToSelected);
    containerStylesWrap.querySelector('[data-act="level-box-reset"]')?.addEventListener('click', resetSelectedLevelBoxStyles);
    levelBoxBgEnabled?.addEventListener('change', () => { levelBoxState.values.bgEnabled = !!levelBoxBgEnabled.checked; applyLevelBoxStylesRealtime(); });
    levelBoxBgInput?.addEventListener('input', () => { levelBoxState.values.bgEnabled = true; if (levelBoxBgEnabled) levelBoxBgEnabled.checked = true; levelBoxState.values.bg = safeColor(levelBoxBgInput.value, '#0f172a'); applyLevelBoxStylesRealtime(); });
    levelBoxBorderEnabled?.addEventListener('change', () => { levelBoxState.values.borderEnabled = !!levelBoxBorderEnabled.checked; applyLevelBoxStylesRealtime(); });
    levelBoxRadiusEnabled?.addEventListener('change', () => { levelBoxState.values.radiusEnabled = !!levelBoxRadiusEnabled.checked; applyLevelBoxStylesRealtime(); });
    levelBoxBorderColorInput?.addEventListener('input', () => { levelBoxState.values.borderEnabled = true; if (levelBoxBorderEnabled) levelBoxBorderEnabled.checked = true; levelBoxState.values.borderColor = safeColor(levelBoxBorderColorInput.value, '#94a3b8'); applyLevelBoxStylesRealtime(); });
    levelBoxBorderWidthInput?.addEventListener('input', () => { levelBoxState.values.borderEnabled = true; if (levelBoxBorderEnabled) levelBoxBorderEnabled.checked = true; levelBoxState.values.borderWidth = normalizeLevelBorderWidthInput(levelBoxBorderWidthInput.value) || '1'; applyLevelBoxStylesRealtime(); });
    levelBoxBorderRadiusInput?.addEventListener('input', () => { levelBoxState.values.radiusEnabled = true; if (levelBoxRadiusEnabled) levelBoxRadiusEnabled.checked = true; levelBoxState.values.borderRadius = normalizeLevelBorderRadiusInput(levelBoxBorderRadiusInput.value) || '16'; applyLevelBoxStylesRealtime(); });
    levelBoxBorderStyleInput?.addEventListener('change', () => { levelBoxState.values.borderEnabled = true; if (levelBoxBorderEnabled) levelBoxBorderEnabled.checked = true; levelBoxState.values.borderStyle = (levelBoxBorderStyleInput.value === 'dashed' || levelBoxBorderStyleInput.value === 'dotted') ? levelBoxBorderStyleInput.value : 'solid'; applyLevelBoxStylesRealtime(); });
    levelBoxShadowEnabled?.addEventListener('change', () => { levelBoxState.values.shadowEnabled = !!levelBoxShadowEnabled.checked; applyLevelBoxStylesRealtime(); });
    levelBoxShadowColorInput?.addEventListener('input', () => { levelBoxState.values.shadowEnabled = true; if (levelBoxShadowEnabled) levelBoxShadowEnabled.checked = true; levelBoxState.values.shadowColor = safeColor(levelBoxShadowColorInput.value, '#000000'); applyLevelBoxStylesRealtime(); });
    levelBoxShadowXInput?.addEventListener('input', () => { levelBoxState.values.shadowEnabled = true; if (levelBoxShadowEnabled) levelBoxShadowEnabled.checked = true; levelBoxState.values.shadowX = normalizeLevelShadowAxisInput(levelBoxShadowXInput.value) || '0'; applyLevelBoxStylesRealtime(); });
    levelBoxShadowYInput?.addEventListener('input', () => { levelBoxState.values.shadowEnabled = true; if (levelBoxShadowEnabled) levelBoxShadowEnabled.checked = true; levelBoxState.values.shadowY = normalizeLevelShadowAxisInput(levelBoxShadowYInput.value) || '8'; applyLevelBoxStylesRealtime(); });
    levelBoxShadowBlurInput?.addEventListener('input', () => { levelBoxState.values.shadowEnabled = true; if (levelBoxShadowEnabled) levelBoxShadowEnabled.checked = true; levelBoxState.values.shadowBlur = normalizeLevelShadowBlurInput(levelBoxShadowBlurInput.value) || '24'; applyLevelBoxStylesRealtime(); });
    levelBoxShadowSpreadInput?.addEventListener('input', () => { levelBoxState.values.shadowEnabled = true; if (levelBoxShadowEnabled) levelBoxShadowEnabled.checked = true; levelBoxState.values.shadowSpread = normalizeLevelShadowSpreadInput(levelBoxShadowSpreadInput.value) || '0'; applyLevelBoxStylesRealtime(); });

    const arrowStylesWrap = document.createElement('div');
    arrowStylesWrap.className = 'st-hfmenu-quick st-hfmenu-levelstyles';
    arrowStylesWrap.innerHTML = `
      <div class="st-hfmenu-levelstyles__levels" data-role="level-arrow-levels"></div>
      <div class="st-hfmenu-levelstyles__level-actions">
        <button class="st-btn" type="button" data-act="level-arrow-select-all">Вибрати всі</button>
        <button class="st-btn" type="button" data-act="level-arrow-clear-selection">Очистити вибір</button>
      </div>
      <div class="st-hfmenu-levelstyles__statebar">
        <div class="st-hfmenu-quick__sub" data-role="level-arrow-state-label">Стрілки · Normal</div>
        <div class="st-hfmenu-levelstyles__states">
          <button class="st-btn st-hfmenu-levelstyles__state is-active" type="button" data-act="level-arrow-state" data-state="normal">Normal</button>
          <button class="st-btn st-hfmenu-levelstyles__state" type="button" data-act="level-arrow-state" data-state="hover">Hover</button>
          <button class="st-btn st-hfmenu-levelstyles__state" type="button" data-act="level-arrow-state" data-state="open">Open</button>
        </div>
      </div>
      <div class="st-hfmenu-levelstyles__form">
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Колір стрілки</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-arrow-color-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-hfmenu-color-input" type="color" value="#ffffff" data-act="level-arrow-color" />
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Розмір стрілки</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-arrow-size-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="number" min="8" max="64" step="1" value="12" data-act="level-arrow-size" />
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Товщина стрілки</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-arrow-stroke-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="number" min="0.5" max="12" step="0.1" value="1" data-act="level-arrow-stroke" />
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Відступ стрілки</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-arrow-gap-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="number" min="-20" max="80" step="1" value="0" data-act="level-arrow-gap" />
        </label>
        <label class="st-mini st-hfmenu-levelstyles__field">
          <span>Поворот стрілки</span>
          <label class="st-mini" style="display:flex;align-items:center;gap:6px;justify-content:flex-start;">
            <input type="checkbox" data-act="level-arrow-rot-enabled" />
            <span>Окремо</span>
          </label>
          <input class="st-inp" type="number" min="-360" max="360" step="1" value="180" data-act="level-arrow-rot" />
        </label>
      </div>
      <div class="st-hfmenu-levelstyles__apply">
        <button class="st-btn" type="button" data-act="level-arrow-apply">Застосувати до вибраних рівнів</button>
        <button class="st-btn" type="button" data-act="level-arrow-reset">Скинути вибрані рівні</button>
      </div>
    `.trim();

    const levelArrowLevelsHost = arrowStylesWrap.querySelector('[data-role="level-arrow-levels"]');
    const levelArrowStateLabel = arrowStylesWrap.querySelector('[data-role="level-arrow-state-label"]');
    const levelArrowStateButtons = Array.from(arrowStylesWrap.querySelectorAll('[data-act="level-arrow-state"]'));
    const levelArrowColorEnabled = arrowStylesWrap.querySelector('input[data-act="level-arrow-color-enabled"]');
    const levelArrowColorInput = arrowStylesWrap.querySelector('input[data-act="level-arrow-color"]');
    const levelArrowSizeEnabled = arrowStylesWrap.querySelector('input[data-act="level-arrow-size-enabled"]');
    const levelArrowSizeInput = arrowStylesWrap.querySelector('input[data-act="level-arrow-size"]');
    const levelArrowStrokeEnabled = arrowStylesWrap.querySelector('input[data-act="level-arrow-stroke-enabled"]');
    const levelArrowStrokeInput = arrowStylesWrap.querySelector('input[data-act="level-arrow-stroke"]');
    const levelArrowGapEnabled = arrowStylesWrap.querySelector('input[data-act="level-arrow-gap-enabled"]');
    const levelArrowGapInput = arrowStylesWrap.querySelector('input[data-act="level-arrow-gap"]');
    const levelArrowRotEnabled = arrowStylesWrap.querySelector('input[data-act="level-arrow-rot-enabled"]');
    const levelArrowRotInput = arrowStylesWrap.querySelector('input[data-act="level-arrow-rot"]');
    const levelArrowState = {
      selected: new Set(),
      state: 'normal',
      values: {
        colorEnabled: false,
        color: '#e2e8f0',
        sizeEnabled: false,
        size: '12',
        strokeEnabled: false,
        stroke: '1.8',
        gapEnabled: false,
        gap: '0',
        rotEnabled: false,
        rot: '180',
      },
    };
    const normalizeArrowSizeInput = (value) => {
      const num = Number(value); if (!Number.isFinite(num)) return ''; return String(Math.max(8, Math.min(64, Math.round(num))));
    };
    const normalizeArrowStrokeInput = (value) => {
      const num = Number(value); if (!Number.isFinite(num)) return ''; return String(Math.max(0.5, Math.min(12, Math.round(num * 10) / 10)));
    };
    const normalizeArrowGapInput = (value) => {
      const num = Number(value); if (!Number.isFinite(num)) return ''; return String(Math.max(-20, Math.min(80, Math.round(num))));
    };
    const normalizeArrowRotInput = (value) => {
      const num = Number(value); if (!Number.isFinite(num)) return ''; return String(Math.max(-360, Math.min(360, Math.round(num))));
    };
    const getArrowMapByState = () => {
      if (levelArrowState.state === 'hover') return normalizeLevelArrowStyles(data.levelArrowHoverStyles);
      if (levelArrowState.state === 'open') return normalizeLevelArrowStyles(data.levelArrowOpenStyles);
      return normalizeLevelArrowStyles(data.levelArrowStyles);
    };
    const setArrowMapByState = (map) => {
      if (levelArrowState.state === 'hover') data.levelArrowHoverStyles = normalizeLevelArrowStyles(map);
      else if (levelArrowState.state === 'open') data.levelArrowOpenStyles = normalizeLevelArrowStyles(map);
      else data.levelArrowStyles = normalizeLevelArrowStyles(map);
    };
    const renderLevelArrowButtons = () => {
      if (!levelArrowLevelsHost) return;
      levelArrowLevelsHost.innerHTML = '';
      for (let i = 1; i <= 10; i += 1) {
        const key = String(i);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'st-btn st-hfmenu-levelstyles__level';
        btn.textContent = key;
        btn.dataset.level = key;
        btn.classList.toggle('is-active', levelArrowState.selected.has(key));
        btn.addEventListener('click', () => {
          if (levelArrowState.selected.has(key)) levelArrowState.selected.delete(key);
          else levelArrowState.selected.add(key);
          syncLevelArrowStateFromSelection();
        });
        levelArrowLevelsHost.appendChild(btn);
      }
    };
    const syncLevelArrowButtons = () => {
      if (!levelArrowLevelsHost) return;
      Array.from(levelArrowLevelsHost.querySelectorAll('[data-level]')).forEach((btn) => {
        const key = String(btn.getAttribute('data-level') || '');
        btn.classList.toggle('is-active', levelArrowState.selected.has(key));
      });
    };
    const syncLevelArrowStateFromSelection = () => {
      const map = getArrowMapByState();
      const levels = Array.from(levelArrowState.selected).sort((a,b)=>Number(a)-Number(b));
      if (!levels.length) {
        levelArrowState.values = { colorEnabled:false, color:'#ffffff', sizeEnabled:false, size:'12', strokeEnabled:false, stroke:'1', gapEnabled:false, gap:'0', rotEnabled:false, rot:(levelArrowState.state === 'open' ? '180' : '0') };
      } else {
        const first = getLevelArrowStyle(map, levels[0]);
        levelArrowState.values = {
          colorEnabled: !!first.color,
          color: safeColor(first.color, '#e2e8f0'),
          sizeEnabled: !!first.size,
          size: normalizeArrowSizeInput(first.size) || '12',
          strokeEnabled: !!first.stroke,
          stroke: normalizeArrowStrokeInput(first.stroke) || '1.8',
          gapEnabled: !!first.gap,
          gap: normalizeArrowGapInput(first.gap) || '0',
          rotEnabled: !!first.rot,
          rot: normalizeArrowRotInput(first.rot) || (levelArrowState.state === 'open' ? '180' : '0'),
        };
      }
      if (levelArrowStateLabel) levelArrowStateLabel.textContent = `Стрілки · ${String(levelArrowState.state || 'normal').charAt(0).toUpperCase()}${String(levelArrowState.state || 'normal').slice(1)}`;
      if (levelArrowColorEnabled) levelArrowColorEnabled.checked = !!levelArrowState.values.colorEnabled;
      if (levelArrowColorInput) levelArrowColorInput.value = safeColor(levelArrowState.values.color, '#ffffff');
      if (levelArrowSizeEnabled) levelArrowSizeEnabled.checked = !!levelArrowState.values.sizeEnabled;
      if (levelArrowSizeInput) levelArrowSizeInput.value = normalizeArrowSizeInput(levelArrowState.values.size) || '12';
      if (levelArrowStrokeEnabled) levelArrowStrokeEnabled.checked = !!levelArrowState.values.strokeEnabled;
      if (levelArrowStrokeInput) levelArrowStrokeInput.value = normalizeArrowStrokeInput(levelArrowState.values.stroke) || '1';
      if (levelArrowGapEnabled) levelArrowGapEnabled.checked = !!levelArrowState.values.gapEnabled;
      if (levelArrowGapInput) levelArrowGapInput.value = normalizeArrowGapInput(levelArrowState.values.gap) || '0';
      if (levelArrowRotEnabled) levelArrowRotEnabled.checked = !!levelArrowState.values.rotEnabled;
      if (levelArrowRotInput) levelArrowRotInput.value = normalizeArrowRotInput(levelArrowState.values.rot) || (levelArrowState.state === 'open' ? '180' : '0');
      levelArrowStateButtons.forEach((btn) => btn.classList.toggle('is-active', btn.dataset.state === levelArrowState.state));
      syncLevelArrowButtons();
    };
    const applyLevelArrowStylesRealtime = () => {
      const levels = Array.from(levelArrowState.selected);
      const stylesMap = getArrowMapByState();
      levels.forEach((level) => {
        const cur = getLevelArrowStyle(stylesMap, level);
        cur.color = levelArrowState.values.colorEnabled ? safeColor(levelArrowState.values.color, '#ffffff') : '';
        cur.size = levelArrowState.values.sizeEnabled ? (normalizeArrowSizeInput(levelArrowState.values.size) || '12') : '';
        cur.stroke = levelArrowState.values.strokeEnabled ? (normalizeArrowStrokeInput(levelArrowState.values.stroke) || '1') : '';
        cur.gap = levelArrowState.values.gapEnabled ? (normalizeArrowGapInput(levelArrowState.values.gap) || '0') : '';
        cur.rot = levelArrowState.values.rotEnabled ? (normalizeArrowRotInput(levelArrowState.values.rot) || (levelArrowState.state === 'open' ? '180' : '0')) : '';
        stylesMap[String(level)] = cur;
      });
      setArrowMapByState(stylesMap);
      applyMenuArrowStylesRuntime(blk, data.levelArrowStyles, data.levelArrowHoverStyles, data.levelArrowOpenStyles);
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
    };
    arrowStylesWrap.querySelector('[data-act="level-arrow-select-all"]')?.addEventListener('click', () => { levelArrowState.selected = new Set(Array.from({ length: 10 }, (_, idx) => String(idx + 1))); syncLevelArrowStateFromSelection(); });
    arrowStylesWrap.querySelector('[data-act="level-arrow-clear-selection"]')?.addEventListener('click', () => { levelArrowState.selected.clear(); syncLevelArrowStateFromSelection(); });
    arrowStylesWrap.querySelector('[data-act="level-arrow-reset"]')?.addEventListener('click', () => {
      const stylesMap = getArrowMapByState();
      Array.from(levelArrowState.selected).forEach((level) => { stylesMap[String(level)] = { color:'', size:'', stroke:'', gap:'', rot:'' }; });
      setArrowMapByState(stylesMap);
      applyMenuArrowStylesRuntime(blk, data.levelArrowStyles, data.levelArrowHoverStyles, data.levelArrowOpenStyles);
      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
      syncLevelArrowStateFromSelection();
    });
    arrowStylesWrap.querySelector('[data-act="level-arrow-apply"]')?.addEventListener('click', applyLevelArrowStylesRealtime);
    levelArrowStateButtons.forEach((btn) => btn.addEventListener('click', () => { levelArrowState.state = btn.dataset.state || 'normal'; syncLevelArrowStateFromSelection(); }));
    levelArrowColorEnabled?.addEventListener('change', () => { levelArrowState.values.colorEnabled = !!levelArrowColorEnabled.checked; applyLevelArrowStylesRealtime(); });
    levelArrowColorInput?.addEventListener('input', () => { levelArrowState.values.colorEnabled = true; if (levelArrowColorEnabled) levelArrowColorEnabled.checked = true; levelArrowState.values.color = safeColor(levelArrowColorInput.value, '#e2e8f0'); applyLevelArrowStylesRealtime(); });
    levelArrowSizeEnabled?.addEventListener('change', () => { levelArrowState.values.sizeEnabled = !!levelArrowSizeEnabled.checked; applyLevelArrowStylesRealtime(); });
    levelArrowSizeInput?.addEventListener('input', () => { levelArrowState.values.sizeEnabled = true; if (levelArrowSizeEnabled) levelArrowSizeEnabled.checked = true; levelArrowState.values.size = normalizeArrowSizeInput(levelArrowSizeInput.value) || '12'; applyLevelArrowStylesRealtime(); });
    levelArrowStrokeEnabled?.addEventListener('change', () => { levelArrowState.values.strokeEnabled = !!levelArrowStrokeEnabled.checked; applyLevelArrowStylesRealtime(); });
    levelArrowStrokeInput?.addEventListener('input', () => { levelArrowState.values.strokeEnabled = true; if (levelArrowStrokeEnabled) levelArrowStrokeEnabled.checked = true; levelArrowState.values.stroke = normalizeArrowStrokeInput(levelArrowStrokeInput.value) || '1.8'; applyLevelArrowStylesRealtime(); });
    levelArrowGapEnabled?.addEventListener('change', () => { levelArrowState.values.gapEnabled = !!levelArrowGapEnabled.checked; applyLevelArrowStylesRealtime(); });
    levelArrowGapInput?.addEventListener('input', () => { levelArrowState.values.gapEnabled = true; if (levelArrowGapEnabled) levelArrowGapEnabled.checked = true; levelArrowState.values.gap = normalizeArrowGapInput(levelArrowGapInput.value) || '0'; applyLevelArrowStylesRealtime(); });
    levelArrowRotEnabled?.addEventListener('change', () => { levelArrowState.values.rotEnabled = !!levelArrowRotEnabled.checked; applyLevelArrowStylesRealtime(); });
    levelArrowRotInput?.addEventListener('input', () => { levelArrowState.values.rotEnabled = true; if (levelArrowRotEnabled) levelArrowRotEnabled.checked = true; levelArrowState.values.rot = normalizeArrowRotInput(levelArrowRotInput.value) || (levelArrowState.state === 'open' ? '180' : '0'); applyLevelArrowStylesRealtime(); });
    renderLevelArrowButtons();
    syncLevelArrowStateFromSelection();

    renderLevelBoxButtons();
    syncLevelBoxStateFromSelection();

    renderLevelButtons();
    syncLevelEditModeUi();
    syncLevelStyleStateFromSelection();
    syncLevelLayoutFromSelection();

    const hint = document.createElement('div');
    hint.className = 'st-hint';
    hint.textContent = 'Порада: сторінка + якір виглядає так: /about#team. Глибина вкладень зараз лише відображається (DnD буде наступним кроком).';

    const mainSettingsAcc = createSubAccordion({
      title: 'Головні налаштування',
      storageKey: CONTENT_SETTINGS_ACCORDION_KEY,
      defaultOpen: true,
      variant: 'design-section',
      tooltipText: `Іконка
Позиція
Структура меню
Додавання пунктів
Швидкий перехід до налаштувань меню`,
    });
    mainSettingsAcc.body.appendChild(iconRow);
    mainSettingsAcc.body.appendChild(posRow);
    mainSettingsAcc.body.appendChild(linksWrap);
    mainSettingsAcc.body.appendChild(addRootBtn);
    mainSettingsAcc.body.appendChild(tuneMenuBtn);

    const generalSettingsAcc = createSubAccordion({
      title: 'Загальні налаштування',
      storageKey: GENERAL_SETTINGS_ACCORDION_KEY,
      defaultOpen: false,
      variant: 'design-section',
      tooltipText: `Режим налаштування
Підменю
Вигляд
Розмітка пунктів меню
Позиція підменю
Ширина і напрямки рівнів`,
    });
    generalSettingsAcc.body.appendChild(menuLayoutWrap);
    generalSettingsAcc.body.appendChild(levelsWrap);

    const megaMenuAcc = createSubAccordion({
      title: 'Mega Menu',
      storageKey: MEGA_MENU_ACCORDION_KEY,
      defaultOpen: false,
      variant: 'design-section',
      tooltipText: `Ширина Mega
Позиція Mega
Колонки Mega
Фон, блок, рамка, тінь
Контент і радіуси Mega`,
    });
    megaMenuAcc.body.appendChild(megaWrap);

    const arrowStylesAcc = createSubAccordion({
      title: 'Стилі стрілок',
      storageKey: ARROW_STYLES_ACCORDION_KEY,
      defaultOpen: false,
      variant: 'design-section',
      tooltipText: `Рівні стрілок 1–10
Стан стрілок: Normal / Hover / Open
Колір, розмір, товщина, відступ і поворот
Застосування до одного або кількох рівнів`,
    });
    arrowStylesAcc.body.appendChild(arrowStylesWrap);

    editorBody.appendChild(mainSettingsAcc.wrap);
    editorBody.appendChild(quickWrap);
    editorBody.appendChild(generalSettingsAcc.wrap);
    editorBody.appendChild(megaMenuAcc.wrap);
    editorBody.appendChild(levelStylesWrap);
    editorBody.appendChild(arrowStylesAcc.wrap);
    editorBody.appendChild(hint);

    // Delegate editor changes
    editorBody.oninput = (ev) => {
      const t = ev.target;
      if (!(t instanceof HTMLInputElement)) return;
      const act = t.getAttribute('data-act');
      const pathStr = t.getAttribute('data-path') || '';
      if (!act || !pathStr) return;

      const parts = pathStr.split('.').filter(Boolean).map(n => Number(n));
      let node = null;
      let arr = data.items;
      for (const p of parts) {
        node = arr?.[p];
        if (!node) return;
        arr = node.children || [];
      }

      if (act === 'node-text') {
        node.text = t.value;
      }

      if (act === 'node-path' || act === 'node-anchor') {
        const raw = String(node.href || '').trim();
        let curPath = '';
        let curAnchor = '';

        if (/^https?:\/\//i.test(raw) || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
          curPath = raw;
          curAnchor = '';
        } else {
          const parts2 = raw.split('#');
          curPath = parts2[0] || '';
          curAnchor = (parts2.length > 1) ? parts2.slice(1).join('#') : '';
        }

        if (act === 'node-path') curPath = t.value;
        if (act === 'node-anchor') curAnchor = t.value;

        curPath = String(curPath || '').trim();
        curAnchor = String(curAnchor || '').trim();
        if (curAnchor.startsWith('#')) curAnchor = curAnchor.slice(1);

        node.href = curAnchor ? `${curPath || ''}#${curAnchor}` : (curPath || '');
      }

      writeMenuData(blk, data);
      renderMenuLinks(blk, data);
    };

    editorBody.onclick = async (ev) => {
      const btn = ev.target?.closest?.('button');
      if (!btn) return;
      const act = btn.getAttribute('data-act');

      // Prevent <summary> toggling when action buttons are clicked
      if (act === 'toggle-more' || act === 'rename-node' || act === 'dup-node' || act === 'del-node' || act === 'item-pick-icon') {
        ev.preventDefault();
        ev.stopPropagation();
      }

      if (act === 'quick-target-menu') {
        ev.preventDefault();
        selectStyleTarget('menu');
        return;
      }

      if (act === 'quick-target-item') {
        ev.preventDefault();
        selectStyleTarget('item');
        return;
      }

      if (act === 'quick-open-text') {
        ev.preventDefault();
        if (getSelectedInsideCurrentMenu()?.matches?.('[data-st-menu-item="1"]')) {
          try { showAllDesignSections(); } catch (_) {}
        } else {
          selectStyleTarget('item');
        }
        openDesignSectionByTitle('Текст');
        return;
      }

      if (act === 'quick-open-fill') {
        ev.preventDefault();
        openStyleSection('Заливка', 'menu');
        return;
      }

      if (act === 'quick-open-border') {
        ev.preventDefault();
        openStyleSection('Лінії', 'menu');
        return;
      }

      if (act === 'quick-open-shadow') {
        ev.preventDefault();
        openStyleSection('Тіні', 'menu');
        return;
      }

      if (act === 'toggle-more') {
        const det = btn.closest('details');
        if (det) det.open = !det.open;
        return;
      }

      if (act === 'rename-node') {
        const pathStr = btn.getAttribute('data-path') || '';
        if (!pathStr) return;

        const det = btn.closest('details');
        const titleSpan = det?.querySelector?.('.st-mi__title');
        const inp = det?.querySelector?.('input[data-act="node-text"][data-path="' + pathStr + '"]');
        if (!inp || !titleSpan) return;

        titleSpan.style.display = 'none';
        inp.style.display = '';
        inp.focus();
        inp.select();

        const finish = () => {
          inp.style.display = 'none';
          titleSpan.style.display = '';
          renderTreeRows();
        };

        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
          if (e.key === 'Escape') { e.preventDefault(); inp.value = String(inp.value || ''); inp.blur(); }
        }, { once: true });

        inp.addEventListener('blur', finish, { once: true });
        return;
      }

      if (act === 'dup-node') {
        const pathStr = btn.getAttribute('data-path') || '';
        if (!pathStr) return;

        const parts = pathStr.split('.').filter(Boolean).map(n => Number(n));
        if (!parts.length) return;

        const last = parts.pop();
        let arr = data.items;
        let node = null;
        for (const p of parts) {
          node = arr?.[p];
          if (!node) return;
          arr = node.children || (node.children = []);
        }
        const source = arr?.[last];
        if (!source) return;

        const cloneDeep = (x, depth = 0) => ({
          text: String(x?.text ?? ''),
          href: String(x?.href ?? ''),
          iconSvg: String(x?.iconSvg ?? ''),
          children: (depth >= 10) ? [] : (Array.isArray(x?.children) ? x.children.map(c => cloneDeep(c, depth + 1)) : []),
        });

        const copy = cloneDeep(source, parts.length);
        arr.splice(last + 1, 0, copy);

        writeMenuData(blk, data);
        renderMenuLinks(blk, data);
        rebuildEditor();
        return;
      }

      if (act === 'item-pick-icon') {
        // This is the same as pick-icon, but accessible from each menu item row
        try {
          await openGalleryModal({
            pickerMode: true,
            cat: 'icons',
            view: 'icons',
            onPick: async (payload) => {
              if (!payload) return;
              let svg = payload.svg || '';
              const url = payload.url || payload.src || '';
              if (!svg && url) {
                const r = await fetch(url);
                svg = await r.text();
              }
              svg = sanitizeMenuIconSvg(svg);
              const pathStr = btn.getAttribute('data-path') || '';
              const target = getByPath(data.items || [], pathStr);
              if (!target || !target.node) return;
              target.node.iconSvg = sanitizeMenuIconSvg(svg || '');
              writeMenuData(blk, data);
              renderMenuLinks(blk, data);
              rebuildEditor();
            }
          });
        } catch(e) {}
        return;
      }


      if (act === 'add-child') {
        const pathStr = btn.getAttribute('data-path') || '';
        if (!pathStr) return;
        const parts = pathStr.split('.').filter(Boolean).map(n => Number(n));
        let node = null;
        let arr = data.items;
        for (const p of parts) {
          node = arr?.[p];
          if (!node) return;
          arr = node.children || (node.children = []);
        }
        node.children = Array.isArray(node.children) ? node.children : [];
        if (parts.length >= 10) return; // max depth = 10 levels
        node.children.push({ text: 'Підпункт', href: '#', iconSvg: '', children: [] });
        writeMenuData(blk, data);
        renderMenuLinks(blk, data);
        rebuildEditor();
        return;
      }

      if (act === 'del-node') {
        const pathStr = btn.getAttribute('data-path') || '';
        if (!pathStr) return;
        const parts = pathStr.split('.').filter(Boolean).map(n => Number(n));
        if (!parts.length) return;

        const last = parts.pop();
        let arr = data.items;
        let node = null;
        for (const p of parts) {
          node = arr?.[p];
          if (!node) return;
          arr = node.children || (node.children = []);
        }
        if (!Array.isArray(arr) || !Number.isFinite(last)) return;
        arr.splice(last, 1);

        writeMenuData(blk, data);
        renderMenuLinks(blk, data);
        rebuildEditor();
        return;
      }

      if (act === 'clear-icon') {
        data.iconSvg = '';
        writeMenuData(blk, data);
        renderMenuLinks(blk, data);
        rebuildEditor();
        return;
      }

      if (act === 'pick-icon') {
        try {
          await openGalleryModal({
            pickerMode: true,
            cat: 'icons',
            view: 'icons',
            onPick: async (payload) => {
              if (!payload) return;
              let svg = payload.svg || '';
              const url = payload.url || payload.src || '';
              if (!svg && url) {
                const r = await fetch(url);
                svg = await r.text();
              }
              svg = sanitizeMenuIconSvg(svg);
              if (!svg) return;
              data.iconSvg = svg;
              writeMenuData(blk, data);
              renderMenuLinks(blk, data);
              rebuildEditor();
            }
          });
        } catch (_) {}
        return;
      }
    };

    const posRadios = editorBody.querySelectorAll('input[type="radio"][name="st-menu-iconpos"]');
    if (posRadios && posRadios.length) {
      posRadios.forEach((r) => {
        r.addEventListener('change', () => {
          const v = (r.value === 'after') ? 'after' : 'before';
          data.iconPos = v;
          writeMenuData(blk, data);
          renderMenuLinks(blk, data);
          rebuildEditor();
        });
      });
    }
  }

  // Пере-рендер на зміни selection
  const tick = () => rebuildEditor();
  window.addEventListener('st:selection:changed', tick);
  window.addEventListener('st:hb-selection-changed', tick);
  document.addEventListener('click', (e) => {
    // Не перерендерюємо віджет, коли кліки відбуваються всередині нього (інакше акордеони закриваються миттєво)
    try {
      if (sectionEl && sectionEl.contains(e.target)) return;
    } catch(_) {}
    setTimeout(tick, 0);
  }, true);

  // Перший рендер
  rebuildEditor();
}

export { initHeaderFooterMenuWidget };
