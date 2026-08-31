// js/design/ai-design/ai-theme-foundation.js
// [AI-SITE-GENERATOR-2026][Етап 3.6]
// Theme Token Foundation для AI Design Engine.
// Мета: AI генерує структуру через CSS-токени теми, а не зашиває кольори/радіуси/бордери намертво в блоки.

import { getAiDesignTheme, getAiDesignPresetOptions } from './ai-design-tokens.js';
import { getAiProfessionalThemePreset, getAiProfessionalThemePresetOptions, getAiProfessionalThemePresetGroups, getAiProfessionalThemePresetCount, hasAiProfessionalThemePreset } from './ai-theme-presets.js';

export const AI_THEME_SOURCE_OPTIONS = Object.freeze([
  Object.freeze({
    id: 'site',
    label: 'Системна тема сайту',
    description: 'AI-секції беруть кольори з глобальних --st-site-* токенів. Це база для майбутнього віджета “Теми”.'
  }),
  Object.freeze({
    id: 'ai',
    label: 'AI-тема генерації',
    description: 'AI-секції отримують власні токени з вибраного AI-пресету, але все одно через CSS-змінні.'
  }),
  Object.freeze({
    id: 'custom',
    label: 'Власні налаштування',
    description: 'AI бере кольори/бордери/радіуси з кастомних значень користувача.'
  })
]);

export const AI_RADIUS_PRESETS = Object.freeze({
  sharp: Object.freeze({ id: 'sharp', label: 'Гострі кути', section: '0px', card: '0px', button: '0px' }),
  light: Object.freeze({ id: 'light', label: 'Легке заокруглення', section: '14px', card: '12px', button: '10px' }),
  soft: Object.freeze({ id: 'soft', label: 'Мʼякі блоки', section: '34px', card: '24px', button: '999px' }),
  round: Object.freeze({ id: 'round', label: 'Дуже круглі', section: '46px', card: '32px', button: '999px' }),
  pill: Object.freeze({ id: 'pill', label: 'Pill / капсули', section: '44px', card: '34px', button: '999px' })
});

export const AI_BORDER_PRESETS = Object.freeze({
  none: Object.freeze({ id: 'none', label: 'Без бордера', width: '0px', style: 'solid', alpha: '0' }),
  thin: Object.freeze({ id: 'thin', label: 'Тонкий', width: '1px', style: 'solid', alpha: '1' }),
  medium: Object.freeze({ id: 'medium', label: 'Середній', width: '2px', style: 'solid', alpha: '1' }),
  contrast: Object.freeze({ id: 'contrast', label: 'Контрастний', width: '2px', style: 'solid', alpha: '1' }),
  glass: Object.freeze({ id: 'glass', label: 'Glass / прозорий', width: '1px', style: 'solid', alpha: '.55' })
});

export const AI_SHADOW_PRESETS = Object.freeze({
  none: Object.freeze({ id: 'none', label: 'Без тіні', card: 'none', button: 'none' }),
  soft: Object.freeze({ id: 'soft', label: 'Soft', card: '0 18px 46px rgba(15,23,42,.10)', button: '0 12px 28px rgba(15,23,42,.12)' }),
  medium: Object.freeze({ id: 'medium', label: 'Medium', card: '0 24px 70px rgba(15,23,42,.16)', button: '0 16px 36px rgba(15,23,42,.16)' }),
  premium: Object.freeze({ id: 'premium', label: 'Premium', card: '0 32px 92px rgba(15,23,42,.18)', button: '0 18px 42px rgba(15,23,42,.18)' }),
  glow: Object.freeze({ id: 'glow', label: 'Glow', card: '0 28px 90px rgba(59,130,246,.24)', button: '0 18px 48px rgba(59,130,246,.28)' })
});

export const DEFAULT_AI_THEME_SETTINGS = Object.freeze({
  source: 'ai',
  preset: 'theme-premium-natural',
  radiusPreset: 'soft',
  borderPreset: 'thin',
  shadowPreset: 'soft',
  custom: Object.freeze({
    bg: '#f8fafc',
    sectionBg: '#f8fafc',
    surface: '#ffffff',
    surfaceSoft: '#eef2ff',
    heading: '#0f172a',
    text: '#475569',
    muted: '#64748b',
    primary: '#2563eb',
    accent: '#7c3aed',
    border: 'rgba(15,23,42,.12)'
  })
});

function cleanId_(value, fallback) {
  const text = String(value || '').trim();
  return text || fallback;
}

function isHexColor_(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '').trim());
}

function cssVar_(name, fallback) {
  return `var(${name}, ${fallback})`;
}

function serializeCssVars_(vars) {
  return Object.entries(vars || {})
    .filter(([key, value]) => key && value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `${key}:${String(value).trim()}`)
    .join(';');
}

function withAlphaNote_(color, alpha) {
  if (!color) return color;
  if (alpha === '1' || alpha === undefined || alpha === null) return color;
  // Не намагаємось математично міксувати rgba/hex у браузері без CSS color-mix.
  // Для glass-режиму лишаємо колір як є, а прозорість задаватиме майбутній Theme widget.
  return color;
}

function getSourceOption_(id) {
  return AI_THEME_SOURCE_OPTIONS.find((item) => item.id === id) || AI_THEME_SOURCE_OPTIONS[1];
}

function resolveThemePreset_(id, fallbackStyle = 'modern') {
  const presetId = cleanId_(id, fallbackStyle || 'modern');
  if (hasAiProfessionalThemePreset(presetId)) return getAiProfessionalThemePreset(presetId);
  return getAiDesignTheme(presetId || fallbackStyle || 'modern');
}

export function getAiThemeSourceOptions() {
  return AI_THEME_SOURCE_OPTIONS.map((item) => ({ ...item }));
}

export function getAiThemePresetOptions() {
  const legacy = getAiDesignPresetOptions().map((item) => ({ ...item, group: 'legacy', groupLabel: 'Базові стилі генератора' }));
  return [
    ...getAiProfessionalThemePresetOptions(),
    ...legacy
  ];
}

export function getAiThemePresetGroups() {
  return [
    ...getAiProfessionalThemePresetGroups(),
    { id: 'legacy', label: 'Базові стилі генератора', options: getAiDesignPresetOptions().map((item) => ({ ...item, group: 'legacy', groupLabel: 'Базові стилі генератора' })) }
  ];
}

export function getAiThemePresetCount() {
  return getAiProfessionalThemePresetCount() + getAiDesignPresetOptions().length;
}

export function getAiRadiusPresetOptions() {
  return Object.values(AI_RADIUS_PRESETS).map((item) => ({ ...item }));
}

export function getAiBorderPresetOptions() {
  return Object.values(AI_BORDER_PRESETS).map((item) => ({ ...item }));
}

export function getAiShadowPresetOptions() {
  return Object.values(AI_SHADOW_PRESETS).map((item) => ({ ...item }));
}

export function normalizeAiThemeSettings(input = {}) {
  const raw = (input && typeof input === 'object') ? input : {};
  const source = AI_THEME_SOURCE_OPTIONS.some((item) => item.id === raw.source) ? raw.source : DEFAULT_AI_THEME_SETTINGS.source;
  const preset = cleanId_(raw.preset, DEFAULT_AI_THEME_SETTINGS.preset);
  const radiusPreset = AI_RADIUS_PRESETS[raw.radiusPreset] ? raw.radiusPreset : DEFAULT_AI_THEME_SETTINGS.radiusPreset;
  const borderPreset = AI_BORDER_PRESETS[raw.borderPreset] ? raw.borderPreset : DEFAULT_AI_THEME_SETTINGS.borderPreset;
  const shadowPreset = AI_SHADOW_PRESETS[raw.shadowPreset] ? raw.shadowPreset : DEFAULT_AI_THEME_SETTINGS.shadowPreset;
  const customRaw = (raw.custom && typeof raw.custom === 'object') ? raw.custom : {};
  const def = DEFAULT_AI_THEME_SETTINGS.custom;
  const custom = {
    bg: isHexColor_(customRaw.bg) ? customRaw.bg : def.bg,
    sectionBg: isHexColor_(customRaw.sectionBg) ? customRaw.sectionBg : (isHexColor_(customRaw.bg) ? customRaw.bg : def.sectionBg),
    surface: isHexColor_(customRaw.surface) ? customRaw.surface : def.surface,
    surfaceSoft: isHexColor_(customRaw.surfaceSoft) ? customRaw.surfaceSoft : def.surfaceSoft,
    heading: isHexColor_(customRaw.heading) ? customRaw.heading : def.heading,
    text: isHexColor_(customRaw.text) ? customRaw.text : def.text,
    muted: isHexColor_(customRaw.muted) ? customRaw.muted : def.muted,
    primary: isHexColor_(customRaw.primary) ? customRaw.primary : def.primary,
    accent: isHexColor_(customRaw.accent) ? customRaw.accent : def.accent,
    border: String(customRaw.border || def.border).trim() || def.border
  };
  return { source, preset, radiusPreset, borderPreset, shadowPreset, custom };
}

export function resolveAiThemeTokens(style = 'modern', settingsInput = {}) {
  const settings = normalizeAiThemeSettings(settingsInput);
  const sourceInfo = getSourceOption_(settings.source);
  const presetId = settings.preset || style || 'modern';
  const literalPreset = resolveThemePreset_(settings.source === 'ai' ? presetId : (style || presetId), style || 'modern');
  const aiPreset = resolveThemePreset_(presetId || style || 'modern', style || 'modern');
  const radius = AI_RADIUS_PRESETS[settings.radiusPreset] || AI_RADIUS_PRESETS.soft;
  const border = AI_BORDER_PRESETS[settings.borderPreset] || AI_BORDER_PRESETS.thin;
  const shadow = AI_SHADOW_PRESETS[settings.shadowPreset] || AI_SHADOW_PRESETS.soft;

  const custom = settings.custom || DEFAULT_AI_THEME_SETTINGS.custom;
  const literal = settings.source === 'custom'
    ? {
        ...literalPreset,
        bg: custom.bg,
        sectionBg: custom.sectionBg || custom.bg,
        panel: custom.surface,
        panelSoft: custom.surfaceSoft,
        soft: custom.surfaceSoft,
        heading: custom.heading,
        text: custom.text,
        muted: custom.muted,
        accent: custom.primary,
        accent2: custom.accent,
        border: custom.border,
        overlay: literalPreset.overlay
      }
    : (settings.source === 'ai' ? aiPreset : literalPreset);

  const siteFallbacks = {
    bg: literal.bg,
    sectionBg: literal.sectionBg || literal.bg,
    surface: literal.panel,
    surfaceSoft: literal.panelSoft || literal.soft,
    soft: literal.soft || literal.panelSoft || literal.panel,
    heading: literal.heading,
    text: literal.text,
    muted: literal.muted,
    primary: literal.accent,
    accent: literal.accent2 || literal.accent,
    border: literal.border,
    overlay: literal.overlay
  };

  const cssVars = settings.source === 'site'
    ? {
        '--st-theme-bg': `var(--st-site-bg, ${siteFallbacks.bg})`,
        '--st-theme-section-bg': `var(--st-site-section-bg, ${siteFallbacks.sectionBg})`,
        '--st-theme-surface': `var(--st-site-surface, ${siteFallbacks.surface})`,
        '--st-theme-surface-soft': `var(--st-site-surface-soft, ${siteFallbacks.surfaceSoft})`,
        '--st-theme-soft': `var(--st-site-soft, ${siteFallbacks.soft})`,
        '--st-theme-heading': `var(--st-site-heading, ${siteFallbacks.heading})`,
        '--st-theme-text': `var(--st-site-text, ${siteFallbacks.text})`,
        '--st-theme-muted': `var(--st-site-muted, ${siteFallbacks.muted})`,
        '--st-theme-primary': `var(--st-site-primary, ${siteFallbacks.primary})`,
        '--st-theme-accent': `var(--st-site-accent, ${siteFallbacks.accent})`,
        '--st-theme-border-color': `var(--st-site-border-color, ${withAlphaNote_(siteFallbacks.border, border.alpha)})`,
        '--st-theme-overlay': `var(--st-site-overlay, ${siteFallbacks.overlay})`,
        '--st-theme-radius-section': `var(--st-site-radius-section, ${radius.section})`,
        '--st-theme-radius-card': `var(--st-site-radius-card, ${radius.card})`,
        '--st-theme-radius-button': `var(--st-site-radius-button, ${radius.button})`,
        '--st-theme-border-width': `var(--st-site-border-width, ${border.width})`,
        '--st-theme-border-style': `var(--st-site-border-style, ${border.style})`,
        '--st-theme-card-shadow': `var(--st-site-card-shadow, ${shadow.card})`,
        '--st-theme-button-shadow': `var(--st-site-button-shadow, ${shadow.button})`
      }
    : {
        '--st-theme-bg': siteFallbacks.bg,
        '--st-theme-section-bg': siteFallbacks.sectionBg,
        '--st-theme-surface': siteFallbacks.surface,
        '--st-theme-surface-soft': siteFallbacks.surfaceSoft,
        '--st-theme-soft': siteFallbacks.soft,
        '--st-theme-heading': siteFallbacks.heading,
        '--st-theme-text': siteFallbacks.text,
        '--st-theme-muted': siteFallbacks.muted,
        '--st-theme-primary': siteFallbacks.primary,
        '--st-theme-accent': siteFallbacks.accent,
        '--st-theme-border-color': withAlphaNote_(siteFallbacks.border, border.alpha),
        '--st-theme-overlay': siteFallbacks.overlay,
        '--st-theme-radius-section': radius.section,
        '--st-theme-radius-card': radius.card,
        '--st-theme-radius-button': radius.button,
        '--st-theme-border-width': border.width,
        '--st-theme-border-style': border.style,
        '--st-theme-card-shadow': shadow.card,
        '--st-theme-button-shadow': shadow.button
      };

  const runtime = {
    id: literal.id || presetId || style,
    label: literal.label || presetId || style,
    description: literal.description || '',
    source: settings.source,
    sourceLabel: sourceInfo.label,
    presetId,
    presetLabel: aiPreset.label || literal.label || presetId,
    presetDescription: aiPreset.description || literal.description || '',
    presetGroup: aiPreset.group || 'legacy',
    presetGroupLabel: aiPreset.groupLabel || 'Базові стилі генератора',
    radiusPreset: radius.id,
    radiusLabel: radius.label,
    borderPreset: border.id,
    borderLabel: border.label,
    shadowPreset: shadow.id,
    shadowLabel: shadow.label,
    cssVars,
    cssText: serializeCssVars_(cssVars),
    literal,

    bg: cssVar_('--st-theme-bg', siteFallbacks.bg),
    sectionBg: cssVar_('--st-theme-section-bg', siteFallbacks.sectionBg),
    panel: cssVar_('--st-theme-surface', siteFallbacks.surface),
    panelSoft: cssVar_('--st-theme-surface-soft', siteFallbacks.surfaceSoft),
    soft: cssVar_('--st-theme-soft', siteFallbacks.soft),
    accent: cssVar_('--st-theme-primary', siteFallbacks.primary),
    accent2: cssVar_('--st-theme-accent', siteFallbacks.accent),
    heading: cssVar_('--st-theme-heading', siteFallbacks.heading),
    text: cssVar_('--st-theme-text', siteFallbacks.text),
    muted: cssVar_('--st-theme-muted', siteFallbacks.muted),
    border: cssVar_('--st-theme-border-color', siteFallbacks.border),
    borderWidth: cssVar_('--st-theme-border-width', border.width),
    borderStyle: cssVar_('--st-theme-border-style', border.style),
    borderCss: `${cssVar_('--st-theme-border-width', border.width)} ${cssVar_('--st-theme-border-style', border.style)} ${cssVar_('--st-theme-border-color', siteFallbacks.border)}`,
    overlay: cssVar_('--st-theme-overlay', siteFallbacks.overlay),
    radius: cssVar_('--st-theme-radius-card', radius.card),
    radiusLarge: cssVar_('--st-theme-radius-section', radius.section),
    buttonRadius: cssVar_('--st-theme-radius-button', radius.button),
    shadow: cssVar_('--st-theme-card-shadow', shadow.card),
    softShadow: cssVar_('--st-theme-card-shadow', shadow.card),
    buttonShadow: cssVar_('--st-theme-button-shadow', shadow.button),

    h1: literal.h1,
    h2: literal.h2,
    h3: literal.h3,
    bodySize: literal.bodySize,
    smallSize: literal.smallSize,
    letterSpacing: literal.letterSpacing,
    lineHeightTight: literal.lineHeightTight,
    lineHeightBody: literal.lineHeightBody,
    weightStrong: literal.weightStrong,
    sectionY: literal.sectionY,
    sectionX: literal.sectionX,
    rowGap: literal.rowGap,
    blockPad: literal.blockPad,
    maxWidth: literal.maxWidth
  };

  return runtime;
}

export function buildAiThemeMetadata(style = 'modern', settingsInput = {}) {
  const runtime = resolveAiThemeTokens(style, settingsInput);
  return {
    source: runtime.source,
    sourceLabel: runtime.sourceLabel,
    presetId: runtime.presetId,
    presetLabel: runtime.presetLabel,
    radiusPreset: runtime.radiusPreset,
    radiusLabel: runtime.radiusLabel,
    borderPreset: runtime.borderPreset,
    borderLabel: runtime.borderLabel,
    shadowPreset: runtime.shadowPreset,
    shadowLabel: runtime.shadowLabel,
    presetDescription: runtime.presetDescription,
    presetGroup: runtime.presetGroup,
    presetGroupLabel: runtime.presetGroupLabel
  };
}

export function buildAiThemeDataAttrs(style = 'modern', settingsInput = {}) {
  const runtime = resolveAiThemeTokens(style, settingsInput);
  const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return [
    `data-ai-theme-source="${esc(runtime.source)}"`,
    `data-ai-theme-preset="${esc(runtime.presetId)}"`,
    `data-ai-theme-group="${esc(runtime.presetGroup)}"`,
    `data-ai-theme-radius="${esc(runtime.radiusPreset)}"`,
    `data-ai-theme-border="${esc(runtime.borderPreset)}"`,
    `data-ai-theme-shadow="${esc(runtime.shadowPreset)}"`
  ].join(' ');
}
