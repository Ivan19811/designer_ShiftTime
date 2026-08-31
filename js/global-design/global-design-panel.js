// js/global-design/global-design-panel.js
// [00707] Style Map: малі ▾/● стоять ліворуч від кнопок Глобально/AI/Дизайн; ▾ відкриває старий сирий перелік деталей.

import { GlobalStyleStore, initGlobalStyleStore } from './style-store.js';
import { ST_GLOBAL_DESIGN_PRESETS, ST_GLOBAL_TYPOGRAPHY_PRESETS, ST_GLOBAL_SPACING_PRESETS, getGlobalDesignPresetById, getGlobalTypographyPresetById, getGlobalSpacingPresetById } from './style-presets.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isObj(v) { return !!(v && typeof v === 'object' && !Array.isArray(v)); }
function clone(v) { try { return JSON.parse(JSON.stringify(v)); } catch (_) { return v; } }
function mergeDeep_(base, patch) {
  const out = clone(base || {}) || {};
  if (!isObj(patch)) return out;
  Object.entries(patch).forEach(([k, v]) => {
    out[k] = (isObj(v) && isObj(out[k])) ? mergeDeep_(out[k], v) : clone(v);
  });
  return out;
}
function getByPath(obj, path) {
  return String(path || '').split('.').filter(Boolean).reduce((acc, k) => (acc && Object.prototype.hasOwnProperty.call(acc, k) ? acc[k] : undefined), obj);
}
function setByPath(obj, path, value) {
  const keys = String(path || '').split('.').filter(Boolean);
  let cur = obj;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      if (!isObj(cur[k])) cur[k] = {};
      cur = cur[k];
    }
  });
  return obj;
}
function normalizePx_(value, fallback = '0px') {
  const s = String(value ?? '').trim();
  if (/^-?\d+(\.\d+)?px$/i.test(s)) return s;
  if (/^-?\d+(\.\d+)?$/i.test(s)) return `${s}px`;
  return fallback;
}
function pxNumber_(value, fallback = 0) {
  const m = String(value ?? '').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : fallback;
}
function safeHex_(v, fallback) {
  const s = String(v || '').trim();
  return /^#[0-9a-f]{6}$/i.test(s) ? s : fallback;
}
function borderColorFrom_(border, fallback) {
  const s = String(border || '');
  const hex = s.match(/#[0-9a-f]{3,8}/i);
  if (hex) {
    const h = hex[0];
    if (h.length === 4) return '#' + h.slice(1).split('').map((c) => c + c).join('');
    return h.slice(0, 7);
  }
  const rgb = s.match(/rgba?\([^)]*\)/i);
  if (rgb) return fallback;
  return fallback;
}
function borderWidthFrom_(border, fallback = '1px') {
  const m = String(border || '').match(/\b(\d+(?:\.\d+)?)px\b/i);
  return m ? `${m[1]}px` : fallback;
}
function rgba_(hex, a) {
  const s = safeHex_(hex, '#000000').replace('#', '');
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, Number(a) || 0))})`;
}

const GROUP_LABELS_UA = {
  Dark: 'Темна', Light: 'Світла', Gray: 'Сіра', Minimal: 'Мінімальна', Colorful: 'Кольорова', Premium: 'Преміум', Pastel: 'Пастельна', Business: 'Бізнес', Nature: 'Природа', Warm: 'Тепла', Education: 'Освіта', Medical: 'Медична', Portfolio: 'Портфоліо', Sport: 'Спорт', Marketplace: 'Маркетплейс', Blue: 'Синя'
};

const PRESET_LABELS_UA = {
  'light-clean': 'Світла чиста', 'dark-premium': 'Темна преміум', 'gray-minimal': 'Сіра мінімальна', 'soft-pastel': 'Мʼяка пастельна', 'business-blue': 'Бізнес синя', 'luxury-gold': 'Преміум золота', 'nature-green': 'Природна зелена', 'tech-neon': 'Технологічна неонова', 'elegant-beige': 'Елегантна бежева', 'black-white': 'Чорно-біла', 'colorful-startup': 'Кольоровий стартап', 'restaurant-warm': 'Ресторанна тепла', 'education-soft': 'Освітня мʼяка', 'medical-clean': 'Медична чиста', 'law-premium': 'Юридична преміум', 'construction-orange': 'Будівельна помаранчева', 'beauty-pink': 'Beauty рожева', 'sport-contrast': 'Спортивна контрастна', 'portfolio-dark': 'Портфоліо темне', 'marketplace-light': 'Маркетплейс світлий', 'ocean-calm': 'Спокійний океан', 'slate-orange': 'Темний графіт + помаранчевий'
};

const COLOR_META = {
  primary: { label: 'Основний', help: 'ОСНОВНИЙ КОЛІР: бренд, важливі елементи, частина кнопок.' },
  accent: { label: 'Акцент', help: 'АКЦЕНТ: підсвітки, hover, декоративні акценти, друга частина кнопок.' },
  surface: { label: 'Фон', help: 'ФОН: основна поверхня шапки/секцій.' },
  text: { label: 'Текст', help: 'ТЕКСТ: меню, заголовки, звичайні написи.' },
  border: { label: 'Лінії', help: 'ЛІНІЇ/РАМКИ: бордери, розділювачі, контури.' }
};

const QUICK_COLOR_KEYS = ['primary', 'accent', 'surface', 'surface2', 'text', 'muted', 'border'];
const QUICK_COLOR_LABELS = {
  primary: 'Основний', accent: 'Акцент', surface: 'Фон', surface2: 'Додатковий фон', text: 'Текст', muted: 'Другорядний текст', border: 'Лінії / рамки'
};
const QUICK_COLOR_HELP = {
  primary: 'бренд і частина кнопок', accent: 'підсвітки, hover, акценти', surface: 'фон шапки/секцій', surface2: 'другий фон / нижній рівень', text: 'усі основні написи', muted: 'другорядні написи', border: 'рамки і лінії'
};

let previewPresetId00695_ = '';
let previewReturnTimer00695_ = 0;
let gdPendingMapFocusId00697_ = '';
let gdLastMapFocusReason00697_ = '';
let previewTypographyId00698_ = '';

const FORMAT_HELP = {
  color: 'ПІДТРИМУВАНІ ФОРМАТИ КОЛЬОРУ: #2563eb, #fff, rgb(37,99,235), rgba(37,99,235,.7), hsl(220 90% 56%), transparent. Для фону також можна: linear-gradient(135deg,#2563eb,#f97316).',
  shadow: 'ФОРМАТ ТІНІ CSS BOX-SHADOW: 0 14px 34px rgba(15,23,42,.18). Можна кілька тіней через кому: 0 10px 30px rgba(...), inset 0 0 0 1px rgba(...).',
  size: 'ФОРМАТ РОЗМІРУ: 0px, 8px, 16px, 999px. Для товщини рамки зазвичай 0px–8px. Для радіуса можна 0px–100px або 999px.',
  text: 'ФОРМАТ ТЕКСТУ: звичайний CSS-текст. Наприклад: Inter, Manrope, Arial, sans-serif.'
};

function shadowCssFromLevel_(level, strong = false) {
  const n = Math.max(0, Math.min(100, Number(level) || 0));
  if (n <= 0) return 'none';
  const y = Math.round(6 + n * (strong ? 0.24 : 0.16));
  const blur = Math.round(16 + n * (strong ? 0.72 : 0.50));
  const spread = Math.round(n > 65 ? (n - 65) / 10 : 0);
  const alpha = Math.max(0.04, Math.min(strong ? 0.32 : 0.24, (strong ? 0.08 : 0.06) + n / (strong ? 390 : 520)));
  return `0 ${y}px ${blur}px ${spread}px rgba(15,23,42,${alpha.toFixed(2)})`;
}
function shadowLevelFrom_(value, fallback = 35) {
  const s = String(value || '').trim();
  if (!s || s === 'none') return 0;
  const nums = s.match(/-?\d+(?:\.\d+)?/g) || [];
  const max = nums.map(Number).filter(Number.isFinite).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  if (!max) return fallback;
  return Math.max(0, Math.min(100, Math.round(max * 1.4)));
}
function isShadowPath_(path) {
  return /shadow/i.test(String(path || ''));
}
function helpKindForField_(field) {
  if (!field) return 'text';
  if (field.type === 'color') return 'color';
  if (field.type === 'shadowRange' || isShadowPath_(field.path)) return 'shadow';
  if (field.type === 'range') return 'size';
  return 'text';
}
const ADVANCED_GROUPS = [
  {
    title: 'Кнопки / hover / бордер',
    fields: [
      { path: 'buttons.fill', label: 'Фон кнопки', type: 'color', fallback: '#2563eb', help: 'КОЛІР АБО ГРАДІЄНТ. Кружечок справа відкриває ручний текстовий ввід.' },
      { path: 'buttons.text', label: 'Текст кнопки', type: 'color', fallback: '#ffffff' },
      { path: 'buttons.borderColor', label: 'Колір бордера кнопки', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.borderWidth', label: 'Товщина бордера', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '1px' },
      { path: 'buttons.hoverFill', label: 'Hover фон', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.hoverText', label: 'Hover текст', type: 'color', fallback: '#ffffff' },
      { path: 'buttons.hoverBorder', label: 'Hover бордер', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.shadow', label: 'Тінь кнопки', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '35', help: 'Повзунок змінює силу тіні. Кружечок справа відкриває ручний CSS box-shadow.' }
    ]
  },
  {
    title: 'Радіуси',
    fields: [
      { path: 'radius.sm', label: 'Малий радіус', type: 'range', min: 0, max: 48, step: 1, unit: 'px', fallback: '10px' },
      { path: 'radius.md', label: 'Середній радіус', type: 'range', min: 0, max: 64, step: 1, unit: 'px', fallback: '16px' },
      { path: 'radius.lg', label: 'Великий радіус', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '24px' },
      { path: 'radius.pill', label: 'Радіус кнопок', type: 'range', min: 0, max: 100, step: 1, unit: 'px', fallback: '40px' }
    ]
  },
  {
    title: 'Тіні',
    fields: [
      { path: 'shadow.soft', label: 'Мʼяка тінь', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '30', help: 'Повзунок сили мʼякої тіні. Кружечок справа — ручний CSS box-shadow.' },
      { path: 'shadow.md', label: 'Сильніша тінь / hover', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '55', help: 'Повзунок сили hover-тіні. Кружечок справа — ручний CSS box-shadow.' }
    ]
  }
];

const TYPOGRAPHY_GROUPS = [
  {
    title: 'Шрифти',
    fields: [
      { path: 'typography.headingFont', label: 'Шрифт заголовків', type: 'text', fallback: 'Manrope, Inter, Arial, sans-serif', help: 'CSS font-family для H1/H2/H3.' },
      { path: 'typography.textFont', label: 'Шрифт тексту', type: 'text', fallback: 'Inter, Arial, sans-serif', help: 'CSS font-family для звичайного тексту, меню і кнопок.' },
      { path: 'typography.font', label: 'Загальний fallback-шрифт', type: 'text', fallback: 'Inter, Manrope, Arial, sans-serif' }
    ]
  },
  {
    title: 'Розміри тексту',
    fields: [
      { path: 'typography.h1Size', label: 'Розмір H1', type: 'range', min: 28, max: 96, step: 1, unit: 'px', fallback: '56px' },
      { path: 'typography.h2Size', label: 'Розмір H2', type: 'range', min: 24, max: 76, step: 1, unit: 'px', fallback: '42px' },
      { path: 'typography.h3Size', label: 'Розмір H3', type: 'range', min: 18, max: 52, step: 1, unit: 'px', fallback: '28px' },
      { path: 'typography.h4Size', label: 'Розмір H4', type: 'range', min: 16, max: 44, step: 1, unit: 'px', fallback: '24px' },
      { path: 'typography.h5Size', label: 'Розмір H5', type: 'range', min: 14, max: 36, step: 1, unit: 'px', fallback: '20px' },
      { path: 'typography.h6Size', label: 'Розмір H6', type: 'range', min: 12, max: 30, step: 1, unit: 'px', fallback: '18px' },
      { path: 'typography.bodySize', label: 'Розмір тексту', type: 'range', min: 12, max: 24, step: 1, unit: 'px', fallback: '16px' }
    ]
  },
  {
    title: 'Ритм і щільність тексту',
    fields: [
      { path: 'typography.textLineHeight', label: 'Висота рядків тексту', type: 'range', min: 1, max: 2, step: 0.05, fallback: '1.55' },
      { path: 'typography.headingLineHeight', label: 'Висота рядків заголовків', type: 'range', min: 0.8, max: 2, step: 0.05, fallback: '1.15' },
      { path: 'typography.letterSpacing', label: 'Відстань у звичайному тексті', type: 'range', min: -2, max: 8, step: 0.1, unit: 'px', fallback: '0px' },
      { path: 'typography.headingLetterSpacing', label: 'Відстань у заголовках', type: 'range', min: -4, max: 6, step: 0.1, unit: 'px', fallback: '-0.8px' }
    ]
  },
  {
    title: 'Товщина і колір',
    fields: [
      { path: 'typography.headingWeight', label: 'Товщина заголовків', type: 'range', min: 300, max: 950, step: 50, fallback: '900' },
      { path: 'typography.textWeight', label: 'Товщина тексту', type: 'range', min: 300, max: 900, step: 50, fallback: '650' },
      { path: 'typography.headingColor', label: 'Колір заголовків', type: 'color', fallback: '#111827' },
      { path: 'typography.textColor', label: 'Колір тексту', type: 'color', fallback: '#111827' }
    ]
  }
];

const SPACING_GROUPS = [
  {
    title: 'Відступи секцій і контейнерів',
    fields: [
      { path: 'spacing.sectionPaddingY', label: 'Секція зверху / знизу', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '24px', help: 'Глобальний вертикальний padding секцій.' },
      { path: 'spacing.sectionPaddingX', label: 'Секція зліва / справа', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '24px', help: 'Глобальний горизонтальний padding секцій.' },
      { path: 'spacing.containerPadding', label: 'Padding контейнерів', type: 'range', min: 0, max: 48, step: 1, unit: 'px', fallback: '0px', help: 'Внутрішній відступ контейнерів.' }
    ]
  },
  {
    title: 'Відступи блоків і проміжки',
    fields: [
      { path: 'spacing.blockPaddingY', label: 'Блок зверху / знизу', type: 'range', min: 0, max: 64, step: 1, unit: 'px', fallback: '10px', help: 'Внутрішній вертикальний padding блоків.' },
      { path: 'spacing.blockPaddingX', label: 'Блок зліва / справа', type: 'range', min: 0, max: 64, step: 1, unit: 'px', fallback: '14px', help: 'Внутрішній горизонтальний padding блоків.' },
      { path: 'spacing.levelGap', label: 'Gap між рівнями', type: 'range', min: 0, max: 72, step: 1, unit: 'px', fallback: '14px', help: 'Проміжок між рівнями / rows.' },
      { path: 'spacing.containerGap', label: 'Gap між контейнерами', type: 'range', min: 0, max: 72, step: 1, unit: 'px', fallback: '12px', help: 'Проміжок між контейнерами.' },
      { path: 'spacing.blockGap', label: 'Gap між блоками', type: 'range', min: 0, max: 48, step: 1, unit: 'px', fallback: '8px', help: 'Проміжок між блоками всередині контейнера.' },
      { path: 'spacing.menuGap', label: 'Gap пунктів меню', type: 'range', min: 0, max: 48, step: 1, unit: 'px', fallback: '8px', help: 'Проміжок між пунктами меню.' }
    ]
  }
];

// [00700] Окремий глобальний шар стилів для секцій / контейнерів / блоків.
// Це не змінює контент, фото, текст або структуру — тільки CSS tokens у StyleStore.
const STRUCTURAL_STYLE_GROUPS = [
  {
    title: 'Секції',
    fields: [
      { path: 'sections.bg', label: 'Фон секцій', type: 'color', fallback: '#ffffff', help: 'Основний фон секцій / шапки.' },
      { path: 'sections.altBg', label: 'Альтернативний фон', type: 'color', fallback: '#f8fafc', help: 'Другий фон для рівнів / чергування.' },
      { path: 'sections.borderColor', label: 'Колір рамки секцій', type: 'color', fallback: '#e2e8f0' },
      { path: 'sections.borderWidth', label: 'Товщина рамки секцій', type: 'range', min: 0, max: 12, step: 1, unit: 'px', fallback: '0px' },
      { path: 'sections.radius', label: 'Радіус секцій', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '0px' },
      { path: 'sections.shadow', label: 'Тінь секцій', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '0' },
      { path: 'sections.minHeight', label: 'Мін. висота секцій', type: 'range', min: 0, max: 720, step: 10, unit: 'px', fallback: '0px' },
      { path: 'sections.maxWidth', label: 'Max-width вмісту секцій', type: 'text', fallback: '100%', placeholder: '100%, 1200px, 1440px', help: 'Застосовується до внутрішніх рівнів/rows, щоб секція лишалась на всю ширину.' },
      { path: 'sections.overlay', label: 'Overlay секцій', type: 'text', fallback: 'none', placeholder: 'none або linear-gradient(...)' }
    ]
  },
  {
    title: 'Контейнери',
    fields: [
      { path: 'containers.bg', label: 'Фон контейнерів', type: 'color', fallback: '#ffffff' },
      { path: 'containers.altBg', label: 'Альтернативний фон контейнерів', type: 'color', fallback: '#f8fafc' },
      { path: 'containers.borderColor', label: 'Колір рамки контейнерів', type: 'color', fallback: '#e2e8f0' },
      { path: 'containers.borderWidth', label: 'Товщина рамки контейнерів', type: 'range', min: 0, max: 12, step: 1, unit: 'px', fallback: '0px' },
      { path: 'containers.radius', label: 'Радіус контейнерів', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '16px' },
      { path: 'containers.shadow', label: 'Тінь контейнерів', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '0' },
      { path: 'containers.minHeight', label: 'Мін. висота контейнерів', type: 'range', min: 0, max: 480, step: 10, unit: 'px', fallback: '0px' },
      { path: 'containers.maxWidth', label: 'Max-width контейнерів', type: 'text', fallback: '100%', placeholder: '100%, 420px, 640px' },
      { path: 'containers.overlay', label: 'Overlay контейнерів', type: 'text', fallback: 'none', placeholder: 'none або linear-gradient(...)' }
    ]
  },
  {
    title: 'Блоки / картки',
    fields: [
      { path: 'blocks.bg', label: 'Фон блоків', type: 'color', fallback: '#ffffff' },
      { path: 'blocks.altBg', label: 'Альтернативний фон блоків', type: 'color', fallback: '#f8fafc' },
      { path: 'blocks.borderColor', label: 'Колір рамки блоків', type: 'color', fallback: '#e2e8f0' },
      { path: 'blocks.borderWidth', label: 'Товщина рамки блоків', type: 'range', min: 0, max: 12, step: 1, unit: 'px', fallback: '1px' },
      { path: 'blocks.radius', label: 'Радіус блоків', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '16px' },
      { path: 'blocks.shadow', label: 'Тінь блоків', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '0' },
      { path: 'blocks.hoverShadow', label: 'Hover-тінь блоків', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '0' },
      { path: 'blocks.hoverLift', label: 'Hover-підйом блоків', type: 'range', min: 0, max: 32, step: 1, unit: 'px', fallback: '0px' },
      { path: 'blocks.minHeight', label: 'Мін. висота блоків', type: 'range', min: 0, max: 480, step: 10, unit: 'px', fallback: '0px' },
      { path: 'blocks.maxWidth', label: 'Max-width блоків', type: 'text', fallback: '100%', placeholder: '100%, 360px, 640px' },
      { path: 'blocks.overlay', label: 'Overlay блоків', type: 'text', fallback: 'none', placeholder: 'none або linear-gradient(...)' }
    ]
  }
];


// [00701] Глобальний шар для кнопок / меню / посилань.
// Старі buttons.fill/text/border лишаються fallback, а нові поля дають повну систему варіантів.
const ACTION_STYLE_GROUPS = [
  {
    title: 'Кнопки · Primary',
    fields: [
      { path: 'buttons.primaryBg', label: 'Primary фон', type: 'color', fallback: '#2563eb', help: 'Основна CTA-кнопка.' },
      { path: 'buttons.primaryText', label: 'Primary текст', type: 'color', fallback: '#ffffff' },
      { path: 'buttons.primaryBorderColor', label: 'Primary бордер', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.primaryBorderWidth', label: 'Primary товщина бордера', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '1px' },
      { path: 'buttons.primaryHoverBg', label: 'Primary hover фон', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.primaryHoverText', label: 'Primary hover текст', type: 'color', fallback: '#ffffff' },
      { path: 'buttons.primaryActiveBg', label: 'Primary active фон', type: 'color', fallback: '#2563eb' },
      { path: 'buttons.primaryDisabledBg', label: 'Primary disabled фон', type: 'color', fallback: '#cbd5e1' },
      { path: 'buttons.primaryDisabledText', label: 'Primary disabled текст', type: 'color', fallback: '#64748b' },
      { path: 'buttons.disabledOpacity', label: 'Disabled opacity', type: 'range', min: 0.1, max: 1, step: 0.05, fallback: '0.55' },
      { path: 'buttons.radius', label: 'Радіус кнопок', type: 'range', min: 0, max: 999, step: 1, unit: 'px', fallback: '999px' },
      { path: 'buttons.hoverShadow', label: 'Hover-тінь кнопок', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '55' }
    ]
  },
  {
    title: 'Кнопки · Secondary / Ghost / Icon',
    fields: [
      { path: 'buttons.secondaryBg', label: 'Secondary фон', type: 'color', fallback: '#ffffff' },
      { path: 'buttons.secondaryText', label: 'Secondary текст', type: 'color', fallback: '#2563eb' },
      { path: 'buttons.secondaryBorderColor', label: 'Secondary бордер', type: 'color', fallback: '#e2e8f0' },
      { path: 'buttons.secondaryBorderWidth', label: 'Secondary товщина бордера', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '1px' },
      { path: 'buttons.secondaryHoverBg', label: 'Secondary hover фон', type: 'color', fallback: '#f8fafc' },
      { path: 'buttons.secondaryHoverText', label: 'Secondary hover текст', type: 'color', fallback: '#2563eb' },
      { path: 'buttons.ghostBg', label: 'Ghost фон', type: 'text', fallback: 'transparent', placeholder: 'transparent або rgba(...)' },
      { path: 'buttons.ghostText', label: 'Ghost текст', type: 'color', fallback: '#111827' },
      { path: 'buttons.ghostBorderWidth', label: 'Ghost товщина бордера', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '0px' },
      { path: 'buttons.ghostBorderColor', label: 'Ghost бордер', type: 'text', fallback: 'transparent', placeholder: 'transparent або #e2e8f0' },
      { path: 'buttons.ghostHoverBg', label: 'Ghost hover фон', type: 'text', fallback: 'rgba(14,165,233,.10)', placeholder: 'rgba(...) або #...' },
      { path: 'buttons.ghostHoverText', label: 'Ghost hover текст', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.iconBg', label: 'Icon фон', type: 'text', fallback: 'rgba(14,165,233,.12)', placeholder: 'rgba(...) або #...' },
      { path: 'buttons.iconText', label: 'Icon колір', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.iconBorderColor', label: 'Icon бордер', type: 'text', fallback: 'rgba(14,165,233,.30)', placeholder: 'rgba(...) або #...' },
      { path: 'buttons.iconBorderWidth', label: 'Icon товщина бордера', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '1px' },
      { path: 'buttons.iconRadius', label: 'Icon радіус', type: 'range', min: 0, max: 64, step: 1, unit: 'px', fallback: '16px' },
      { path: 'buttons.iconHoverBg', label: 'Icon hover фон', type: 'color', fallback: '#0ea5e9' },
      { path: 'buttons.iconHoverText', label: 'Icon hover текст', type: 'color', fallback: '#ffffff' }
    ]
  },
  {
    title: 'Меню',
    fields: [
      { path: 'menu.text', label: 'Текст меню', type: 'color', fallback: '#111827' },
      { path: 'menu.hoverText', label: 'Hover текст меню', type: 'color', fallback: '#0ea5e9' },
      { path: 'menu.activeText', label: 'Active текст меню', type: 'color', fallback: '#2563eb' },
      { path: 'menu.itemBg', label: 'Фон пунктів меню', type: 'text', fallback: 'transparent', placeholder: 'transparent або rgba(...)' },
      { path: 'menu.hoverBg', label: 'Hover фон меню', type: 'text', fallback: 'rgba(14,165,233,.10)', placeholder: 'rgba(...) або #...' },
      { path: 'menu.activeBg', label: 'Active фон меню', type: 'text', fallback: 'rgba(37,99,235,.12)', placeholder: 'rgba(...) або #...' },
      { path: 'menu.itemBorderColor', label: 'Колір бордера меню', type: 'color', fallback: '#e2e8f0' },
      { path: 'menu.itemBorderWidth', label: 'Товщина бордера меню', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '0px' },
      { path: 'menu.hoverBorderColor', label: 'Hover бордер меню', type: 'color', fallback: '#0ea5e9' },
      { path: 'menu.activeBorderColor', label: 'Active бордер меню', type: 'color', fallback: '#2563eb' },
      { path: 'menu.radius', label: 'Радіус пунктів меню', type: 'range', min: 0, max: 999, step: 1, unit: 'px', fallback: '999px' },
      { path: 'menu.underlineHeight', label: 'Товщина underline', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '2px' },
      { path: 'menu.underlineOffset', label: 'Відступ underline', type: 'range', min: 0, max: 16, step: 1, unit: 'px', fallback: '5px' },
      { path: 'menu.burgerBg', label: 'Burger фон', type: 'text', fallback: 'rgba(14,165,233,.12)', placeholder: 'rgba(...) або #...' },
      { path: 'menu.burgerColor', label: 'Burger колір', type: 'color', fallback: '#111827' },
      { path: 'menu.burgerRadius', label: 'Burger радіус', type: 'range', min: 0, max: 64, step: 1, unit: 'px', fallback: '16px' },
      { path: 'menu.mobileBg', label: 'Mobile menu фон', type: 'color', fallback: '#ffffff' }
    ]
  },
  {
    title: 'Посилання',
    fields: [
      { path: 'links.color', label: 'Колір посилань', type: 'color', fallback: '#2563eb' },
      { path: 'links.hoverColor', label: 'Hover колір посилань', type: 'color', fallback: '#0ea5e9' },
      { path: 'links.activeColor', label: 'Active колір посилань', type: 'color', fallback: '#2563eb' },
      { path: 'links.visitedColor', label: 'Visited колір посилань', type: 'color', fallback: '#2563eb' },
      { path: 'links.underline', label: 'Underline за замовчуванням', type: 'text', fallback: 'none', placeholder: 'none або underline' },
      { path: 'links.underlineHover', label: 'Underline on hover', type: 'text', fallback: 'underline', placeholder: 'none або underline' },
      { path: 'links.underlineOffset', label: 'Відступ underline', type: 'range', min: 0, max: 16, step: 1, unit: 'px', fallback: '3px' },
      { path: 'links.underlineThickness', label: 'Товщина underline', type: 'range', min: 1, max: 8, step: 1, unit: 'px', fallback: '1px' }
    ]
  }
];

const FOOTER_GROUPS = [
  {
    title: 'Футер',
    fields: [
      { path: 'footer.bg', label: 'Фон футера', type: 'color', fallback: '#ffffff', help: 'Якщо футер має відрізнятись від шапки — змінюй тут. Якщо не змінювати, бере загальний фон теми.' },
      { path: 'footer.altBg', label: 'Додатковий фон футера', type: 'color', fallback: '#f8fafc' },
      { path: 'footer.text', label: 'Текст футера', type: 'color', fallback: '#111827' },
      { path: 'footer.borderColor', label: 'Лінія футера', type: 'color', fallback: '#e2e8f0' },
      { path: 'footer.borderWidth', label: 'Товщина лінії футера', type: 'range', min: 0, max: 8, step: 1, unit: 'px', fallback: '1px' },
      { path: 'footer.radius', label: 'Радіус футера', type: 'range', min: 0, max: 96, step: 1, unit: 'px', fallback: '24px' },
      { path: 'footer.shadow', label: 'Тінь футера', type: 'shadowRange', min: 0, max: 100, step: 1, fallback: '30', help: 'Окрема тінь футера. Якщо не змінювати — бере загальну мʼяку тінь теми.' }
    ]
  }
];

function allFields_() {
  return ADVANCED_GROUPS.concat(TYPOGRAPHY_GROUPS, SPACING_GROUPS, STRUCTURAL_STYLE_GROUPS, ACTION_STYLE_GROUPS, FOOTER_GROUPS).flatMap((g) => g.fields || []);
}


function presetNameUa_(preset) {
  const id = String(preset?.id || '');
  return PRESET_LABELS_UA[id] || String(preset?.name || id || 'Тема');
}
function presetGroupUa_(preset) {
  const group = String(preset?.group || '');
  return GROUP_LABELS_UA[group] || group || 'Тема';
}
function sourceLabel_(s) {
  if (s === 'ai') return 'AI';
  if (s === 'design') return 'Дизайн';
  return 'Глобально';
}
function activePresetId_(st) {
  return String(st?.global?.id || st?.global?.presetId || 'light-clean');
}
function gradientFromColors_(primary, accent) {
  return `linear-gradient(135deg,${primary || '#2563eb'},${accent || primary || '#0ea5e9'})`;
}
function normalizeResolvedForControls_(resolved) {
  const out = clone(resolved || {}) || {};
  out.colors = Object.assign({}, out.colors || {});
  out.buttons = Object.assign({}, out.buttons || {});
  out.sections = Object.assign({}, out.sections || {});
  out.containers = Object.assign({}, out.containers || {});
  out.blocks = Object.assign({}, out.blocks || {});
  out.radius = Object.assign({}, out.radius || {});
  out.shadow = Object.assign({}, out.shadow || {});
  out.typography = Object.assign({}, out.typography || {});
  out.spacing = Object.assign({}, out.spacing || {});
  out.footer = Object.assign({}, out.footer || {});
  out.menu = Object.assign({}, out.menu || {});
  out.links = Object.assign({}, out.links || {});
  const c = out.colors;
  out.buttons.borderWidth = out.buttons.borderWidth || borderWidthFrom_(out.buttons.border, '1px');
  out.buttons.borderColor = out.buttons.borderColor || borderColorFrom_(out.buttons.border, c.accent || c.border || '#0ea5e9');
  out.buttons.shadow = out.buttons.shadow || out.shadow.soft || '0 14px 34px rgba(15,23,42,.08)';
  out.buttons.hoverFill = out.buttons.hoverFill || c.accent || '#0ea5e9';
  out.buttons.hoverText = out.buttons.hoverText || out.buttons.text || '#ffffff';
  out.buttons.hoverBorder = out.buttons.hoverBorder || out.buttons.borderColor || c.accent || '#0ea5e9';
  out.buttons.primaryBg = out.buttons.primaryBg || out.buttons.fill || c.primary || '#2563eb';
  out.buttons.primaryText = out.buttons.primaryText || out.buttons.text || '#ffffff';
  out.buttons.primaryBorderWidth = out.buttons.primaryBorderWidth || out.buttons.borderWidth || '1px';
  out.buttons.primaryBorderColor = out.buttons.primaryBorderColor || out.buttons.borderColor || c.accent || c.primary || '#0ea5e9';
  out.buttons.primaryHoverBg = out.buttons.primaryHoverBg || out.buttons.hoverFill || c.accent || '#0ea5e9';
  out.buttons.primaryHoverText = out.buttons.primaryHoverText || out.buttons.hoverText || out.buttons.primaryText || '#ffffff';
  out.buttons.primaryActiveBg = out.buttons.primaryActiveBg || c.primary || out.buttons.primaryBg;
  out.buttons.primaryDisabledBg = out.buttons.primaryDisabledBg || '#cbd5e1';
  out.buttons.primaryDisabledText = out.buttons.primaryDisabledText || '#64748b';
  out.buttons.secondaryBg = out.buttons.secondaryBg || c.surface || '#ffffff';
  out.buttons.secondaryText = out.buttons.secondaryText || c.primary || '#2563eb';
  out.buttons.secondaryBorderWidth = out.buttons.secondaryBorderWidth || '1px';
  out.buttons.secondaryBorderColor = out.buttons.secondaryBorderColor || c.border || '#e2e8f0';
  out.buttons.secondaryHoverBg = out.buttons.secondaryHoverBg || c.surface2 || '#f8fafc';
  out.buttons.secondaryHoverText = out.buttons.secondaryHoverText || c.primary || '#2563eb';
  out.buttons.ghostBg = out.buttons.ghostBg || 'transparent';
  out.buttons.ghostText = out.buttons.ghostText || c.text || '#111827';
  out.buttons.ghostBorderWidth = out.buttons.ghostBorderWidth || '0px';
  out.buttons.ghostBorderColor = out.buttons.ghostBorderColor || 'transparent';
  out.buttons.ghostHoverBg = out.buttons.ghostHoverBg || rgba_(c.accent || '#0ea5e9', .10);
  out.buttons.ghostHoverText = out.buttons.ghostHoverText || c.accent || '#0ea5e9';
  out.buttons.iconBg = out.buttons.iconBg || rgba_(c.accent || '#0ea5e9', .12);
  out.buttons.iconText = out.buttons.iconText || c.accent || '#0ea5e9';
  out.buttons.iconBorderWidth = out.buttons.iconBorderWidth || '1px';
  out.buttons.iconBorderColor = out.buttons.iconBorderColor || rgba_(c.accent || '#0ea5e9', .30);
  out.buttons.iconHoverBg = out.buttons.iconHoverBg || c.accent || '#0ea5e9';
  out.buttons.iconHoverText = out.buttons.iconHoverText || '#ffffff';
  out.buttons.radius = out.buttons.radius || out.radius?.pill || '40px';
  out.buttons.iconRadius = out.buttons.iconRadius || out.radius?.md || '16px';
  out.buttons.hoverShadow = out.buttons.hoverShadow || out.shadow?.md || out.buttons.shadow || '0 22px 60px rgba(15,23,42,.14)';
  out.buttons.disabledOpacity = out.buttons.disabledOpacity || '0.55';
  out.sections.bg = out.sections.bg || c.surface || '#ffffff';
  out.sections.altBg = out.sections.altBg || c.surface2 || '#f8fafc';
  out.sections.borderWidth = out.sections.borderWidth || borderWidthFrom_(out.sections.border, '0px');
  out.sections.borderColor = out.sections.borderColor || borderColorFrom_(out.sections.border, c.border || '#e2e8f0');
  out.sections.radius = out.sections.radius || '0px';
  out.sections.shadow = out.sections.shadow || 'none';
  out.sections.overlay = out.sections.overlay || 'none';
  out.sections.minHeight = out.sections.minHeight || '0px';
  out.sections.maxWidth = out.sections.maxWidth || '100%';
  out.containers.bg = out.containers.bg || 'transparent';
  out.containers.altBg = out.containers.altBg || c.surface2 || '#f8fafc';
  out.containers.borderWidth = out.containers.borderWidth || borderWidthFrom_(out.containers.border, '0px');
  out.containers.borderColor = out.containers.borderColor || borderColorFrom_(out.containers.border, c.border || '#e2e8f0');
  out.containers.radius = out.containers.radius || out.radius.md || '16px';
  out.containers.shadow = out.containers.shadow || 'none';
  out.containers.overlay = out.containers.overlay || 'none';
  out.containers.minHeight = out.containers.minHeight || '0px';
  out.containers.maxWidth = out.containers.maxWidth || '100%';
  out.blocks.borderWidth = out.blocks.borderWidth || borderWidthFrom_(out.blocks.border, '1px');
  out.blocks.borderColor = out.blocks.borderColor || borderColorFrom_(out.blocks.border, c.border || '#e2e8f0');
  out.blocks.altBg = out.blocks.altBg || c.surface2 || '#f8fafc';
  out.blocks.radius = out.blocks.radius || out.radius.md || '16px';
  out.blocks.shadow = out.blocks.shadow || 'none';
  out.blocks.hoverShadow = out.blocks.hoverShadow || 'none';
  out.blocks.hoverLift = out.blocks.hoverLift || '0px';
  out.blocks.overlay = out.blocks.overlay || 'none';
  out.blocks.minHeight = out.blocks.minHeight || '0px';
  out.blocks.maxWidth = out.blocks.maxWidth || '100%';
  out.footer.bg = out.footer.bg || out.sections.bg || c.surface || '#ffffff';
  out.footer.altBg = out.footer.altBg || out.sections.altBg || c.surface2 || '#f8fafc';
  out.footer.text = out.footer.text || c.text || '#111827';
  out.footer.borderWidth = out.footer.borderWidth || out.blocks.borderWidth || borderWidthFrom_(out.footer.border, '1px');
  out.footer.borderColor = out.footer.borderColor || borderColorFrom_(out.footer.border, out.blocks.borderColor || c.border || '#e2e8f0');
  out.footer.radius = out.footer.radius || out.radius.lg || '24px';
  out.footer.shadow = out.footer.shadow || out.shadow.soft || '0 14px 34px rgba(15,23,42,.08)';
  out.typography.font = out.typography.font || 'Inter, Manrope, Arial, sans-serif';
  out.typography.headingFont = out.typography.headingFont || out.typography.font;
  out.typography.textFont = out.typography.textFont || out.typography.font;
  out.typography.h1Size = out.typography.h1Size || '56px';
  out.typography.h2Size = out.typography.h2Size || '42px';
  out.typography.h3Size = out.typography.h3Size || '28px';
  out.typography.h4Size = out.typography.h4Size || '24px';
  out.typography.h5Size = out.typography.h5Size || '20px';
  out.typography.h6Size = out.typography.h6Size || '18px';
  out.typography.bodySize = out.typography.bodySize || '16px';
  out.typography.lineHeight = out.typography.lineHeight || '1.55';
  out.typography.textLineHeight = out.typography.textLineHeight || out.typography.lineHeight;
  out.typography.headingLineHeight = out.typography.headingLineHeight || '1.15';
  out.typography.letterSpacing = out.typography.letterSpacing || '0px';
  out.typography.headingLetterSpacing = out.typography.headingLetterSpacing || '-0.8px';
  out.typography.headingColor = out.typography.headingColor || out.colors.text || '#111827';
  out.typography.textColor = out.typography.textColor || out.colors.text || '#111827';
  out.spacing.densityPresetId = out.spacing.densityPresetId || 'density-standard';
  out.spacing.sectionPaddingY = out.spacing.sectionPaddingY || '24px';
  out.spacing.sectionPaddingX = out.spacing.sectionPaddingX || '24px';
  out.spacing.containerPadding = out.spacing.containerPadding || '0px';
  out.spacing.blockPaddingY = out.spacing.blockPaddingY || '10px';
  out.spacing.blockPaddingX = out.spacing.blockPaddingX || '14px';
  out.spacing.levelGap = out.spacing.levelGap || '14px';
  out.spacing.containerGap = out.spacing.containerGap || '12px';
  out.spacing.blockGap = out.spacing.blockGap || '8px';
  out.spacing.menuGap = out.spacing.menuGap || '8px';
  out.menu.text = out.menu.text || c.text || '#111827';
  out.menu.hoverText = out.menu.hoverText || c.accent || c.primary || '#0ea5e9';
  out.menu.activeText = out.menu.activeText || c.primary || '#2563eb';
  out.menu.itemBg = out.menu.itemBg || 'transparent';
  out.menu.hoverBg = out.menu.hoverBg || rgba_(c.accent || '#0ea5e9', .10);
  out.menu.activeBg = out.menu.activeBg || rgba_(c.primary || '#2563eb', .12);
  out.menu.itemBorderWidth = out.menu.itemBorderWidth || out.menu.borderWidth || '0px';
  out.menu.itemBorderColor = out.menu.itemBorderColor || c.border || '#e2e8f0';
  out.menu.hoverBorderColor = out.menu.hoverBorderColor || c.accent || '#0ea5e9';
  out.menu.activeBorderColor = out.menu.activeBorderColor || c.primary || '#2563eb';
  out.menu.radius = out.menu.radius || out.radius?.pill || '40px';
  out.menu.underlineHeight = out.menu.underlineHeight || '2px';
  out.menu.underlineOffset = out.menu.underlineOffset || '5px';
  out.menu.burgerBg = out.menu.burgerBg || rgba_(c.accent || '#0ea5e9', .12);
  out.menu.burgerColor = out.menu.burgerColor || c.text || '#111827';
  out.menu.burgerRadius = out.menu.burgerRadius || out.radius?.md || '16px';
  out.menu.mobileBg = out.menu.mobileBg || c.surface || '#ffffff';
  out.links.color = out.links.color || c.primary || '#2563eb';
  out.links.hoverColor = out.links.hoverColor || c.accent || '#0ea5e9';
  out.links.activeColor = out.links.activeColor || c.primary || '#2563eb';
  out.links.visitedColor = out.links.visitedColor || c.primary || '#2563eb';
  out.links.underline = out.links.underline || 'none';
  out.links.underlineHover = out.links.underlineHover || 'underline';
  out.links.underlineOffset = out.links.underlineOffset || '3px';
  out.links.underlineThickness = out.links.underlineThickness || '1px';
  return out;
}
function statusText_(st, resolved) {
  const presetId = activePresetId_(st);
  const preset = ST_GLOBAL_DESIGN_PRESETS.find((p) => String(p.id) === String(presetId));
  const colors = resolved?.colors || {};
  return [
    `Активне джерело: ${sourceLabel_(st.activeSource)}`,
    `Поточна тема: ${preset ? presetNameUa_(preset) : (st.global?.name || presetId)}`,
    `Ручні live-зміни зберігаються в активному джерелі: ${sourceLabel_(st.activeSource)}`,
    `Кольори: основний ${colors.primary || ''} / акцент ${colors.accent || ''} / фон ${colors.surface || ''} / текст ${colors.text || ''}`
  ].join('\n');
}


const STYLE_META_KEYS_00693 = new Set(['id', 'name', 'group', 'description', 'presetId', 'typographyPresetId', 'version', 'updatedAt']);
const STYLE_TOP_LABELS_00693 = {
  colors: 'Кольори', buttons: 'Кнопки', sections: 'Секції / шапка', containers: 'Контейнери', blocks: 'Блоки', radius: 'Радіуси', shadow: 'Тіні', typography: 'Текст', spacing: 'Відступи', footer: 'Футер', menu: 'Меню', links: 'Посилання'
};

function collectStyleLeaves00693_(obj, prefix = '', out = []) {
  if (!isObj(obj)) return out;
  Object.entries(obj).forEach(([key, value]) => {
    if (!key || STYLE_META_KEYS_00693.has(key)) return;
    const path = prefix ? `${prefix}.${key}` : key;
    if (isObj(value)) collectStyleLeaves00693_(value, path, out);
    else if (value != null && String(value) !== '') out.push({ path, value: String(value) });
  });
  return out;
}
function getPathValue00693_(obj, path) {
  return String(path || '').split('.').filter(Boolean).reduce((acc, k) => (acc && Object.prototype.hasOwnProperty.call(acc, k) ? acc[k] : undefined), obj);
}
function topLabel00693_(path) {
  const top = String(path || '').split('.')[0] || '';
  return STYLE_TOP_LABELS_00693[top] || top || 'Стиль';
}
function groupCounts00693_(paths) {
  const map = new Map();
  (paths || []).forEach((p) => {
    const label = topLabel00693_(typeof p === 'string' ? p : p.path);
    map.set(label, (map.get(label) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
}
function changedPathsForGlobal00693_(st) {
  const preset = getGlobalDesignPresetById(activePresetId_(st)) || {};
  const leaves = collectStyleLeaves00693_(st?.global || {});
  return leaves
    .filter(({ path, value }) => String(getPathValue00693_(preset, path) ?? '') !== String(value ?? ''))
    .map(({ path }) => path);
}
function savedPathsForSource00693_(st, source) {
  const obj = st?.[source] || {};
  return collectStyleLeaves00693_(obj).map(({ path }) => path);
}
function footerOverridePaths00693_(st) {
  const src = st?.activeSource || 'global';
  const obj = st?.[src] || {};
  return collectStyleLeaves00693_(obj.footer || {}, 'footer').map(({ path }) => path);
}
function sourceStats00693_(st, source) {
  const src = source || st?.activeSource || 'global';
  const paths = src === 'global' ? changedPathsForGlobal00693_(st) : savedPathsForSource00693_(st, src);
  return { source: src, paths, count: paths.length, groups: groupCounts00693_(paths) };
}
function renderGroups00693_(groups) {
  if (!groups || !groups.length) return '<span class="gd-muted">немає точкових змін</span>';
  return groups.map((g) => `<span class="gd-chip">${esc(g.label)}: ${esc(g.count)}</span>`).join('');
}
function renderSourceBanner00693_(st, resolved) {
  const src = st?.activeSource || 'global';
  const stats = sourceStats00693_(st, src);
  const presetId = activePresetId_(st);
  const preset = ST_GLOBAL_DESIGN_PRESETS.find((p) => String(p.id) === String(presetId));
  const footerCount = footerOverridePaths00693_(st).length;
  return `
    <div class="gd-source-banner" data-gd-active-source-banner="${esc(src)}">
      <div class="gd-source-banner__top">
        <span class="gd-source-pill gd-source-pill--${esc(src)}">${esc(sourceLabel_(src))}</span>
        <strong>Активне джерело стилю</strong>
      </div>
      <div class="gd-source-banner__text">
        Тема: <b>${esc(preset ? presetNameUa_(preset) : (st?.global?.name || presetId || ''))}</b> ·
        точкові зміни активного джерела: <b>${esc(stats.count)}</b> ·
        окремі поля футера: <b>${esc(footerCount)}</b>
      </div>
    </div>`;
}

function selectedElementSummary00695_() {
  try {
    const api = window.ST_ELEMENT_STYLE_SOURCE;
    const selected = typeof api?.selectedElements === 'function' ? api.selectedElements() : [];
    const el = selected && selected[0];
    if (!el) return 'Виберіть елемент, щоб скинути тільки його.';
    const type = el.getAttribute?.('data-hf-node-type') || el.getAttribute?.('data-st-node') || (el.classList?.contains('st-section') ? 'section' : el.classList?.contains('st-row') ? 'level' : el.classList?.contains('st-block') ? 'block' : el.tagName || 'element');
    const source = el.getAttribute?.('data-st-style-source') || el.dataset?.stStyleSource || 'global';
    return `Вибрано: ${type} · джерело: ${source}`;
  } catch (_) {
    return 'Виберіть елемент, щоб скинути тільки його.';
  }
}
function renderResetControls00695_() {
  const ui = (() => { try { return JSON.parse(localStorage.getItem('st_global_design_ui_00687') || '{}'); } catch (_) { return {}; } })();
  const resetClosed = ui.resetClosed === true;
  return `
    <div class="gd-card gd-card--reset ${resetClosed ? 'is-closed' : ''}" data-gd-reset-controls="1" data-gd-accordion="reset">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="reset" aria-label="Відкрити або закрити скидання стилів">${resetClosed ? '▸' : '▾'}</button><span>Скидання стилів</span></span><small>повернення до теми</small></div>
      <div class="gd-card__body">
        <div class="gd-note" data-gd-selected-reset-note>${esc(selectedElementSummary00695_())}</div>
        <div class="gd-reset-grid">
          <button class="gd-reset-btn" type="button" data-gd-action="reset-selected-global">Вибраний елемент → Глобально</button>
          <button class="gd-reset-btn" type="button" data-gd-action="reset-buttons-global">Усі кнопки → Глобально</button>
          <button class="gd-reset-btn" type="button" data-gd-action="reset-blocks-global">Усі блоки → Глобально</button>
          <button class="gd-reset-btn gd-reset-btn--danger" type="button" data-gd-action="reset-site-global">Весь сайт → активна тема</button>
        </div>
        <div class="gd-note">Це не змінює текст і фото. Скидання прибирає локальні inline-стилі елемента/групи і повертає керування через готову тему.</div>
      </div>
    </div>`;
}
function gdStyleMapRoot00696_() {
  return document;
}
function gdElementScope00696_(el) {
  try {
    if (el?.closest?.('#st-site-footer-slot,.st-site-footer-slot')) return 'footer';
    if (el?.closest?.('#st-site-header-slot,.st-site-header-slot')) return 'header';
    if (el?.closest?.('#site-root')) return 'main';
  } catch (_) {}
  return '';
}
function gdScopeLabel00696_(scope) {
  if (scope === 'header') return 'Шапка';
  if (scope === 'footer') return 'Футер';
  if (scope === 'removed-content') return 'Removed content';
  return 'Сайт';
}
function gdNodeType00696_(el) {
  const raw = String(el?.getAttribute?.('data-hf-node-type') || el?.getAttribute?.('data-st-node') || '').toLowerCase();
  if (raw === 'row') return 'level';
  if (raw) return raw;
  if (el?.classList?.contains('st-section')) return 'section';
  if (el?.classList?.contains('st-row')) return 'level';
  if (el?.classList?.contains('hb-container') || el?.classList?.contains('st-container')) return 'container';
  if (el?.classList?.contains('st-block')) return 'block';
  return String(el?.tagName || 'element').toLowerCase();
}
function gdTypeLabel00696_(type, el) {
  if (type === 'section') return 'Секція';
  if (type === 'level') return 'Рівень';
  if (type === 'container') return 'Контейнер';
  if (type === 'block') {
    if (el?.classList?.contains('st-block--menu')) return 'Блок меню';
    if (el?.classList?.contains('st-block--button')) return 'Кнопка';
    if (el?.classList?.contains('st-block--text')) return 'Текст';
    if (el?.classList?.contains('st-block--logo')) return 'Лого';
    if (el?.classList?.contains('st-block--phone')) return 'Телефон';
    if (el?.classList?.contains('st-block--icon')) return 'Іконка';
    return 'Блок';
  }
  return type || 'Елемент';
}
function gdExplicitSource00696_(el) {
  const explicit = String(el?.getAttribute?.('data-st-style-source') || el?.dataset?.stStyleSource || '').trim();
  return ['global', 'ai', 'design'].includes(explicit) ? explicit : '';
}
function gdHasGlobalTokens00696_(el) {
  const style = String(el?.getAttribute?.('style') || '');
  return /var\(--st-gd-|var\(--st-color-|var\(--st-button-|data-st-global-style/i.test(style)
    || el?.hasAttribute?.('data-st-global-style-test')
    || !!el?.closest?.('[data-st-global-style-root="1"],[data-st-global-style-test="1"]');
}
function gdElementSource00696_(el) {
  const explicit = gdExplicitSource00696_(el);
  if (explicit) return explicit;
  if (gdHasGlobalTokens00696_(el)) return 'global';
  const style = String(el?.getAttribute?.('style') || '');
  if (/background|--st-bgfx|border|box-shadow|color/i.test(style) || el?.classList?.contains('st-bgfx')) return 'design';
  return 'global';
}
function gdTextSnippet00696_(el) {
  const named = el?.getAttribute?.('data-name') || el?.getAttribute?.('aria-label') || el?.getAttribute?.('data-block-kind') || '';
  const txt = named || String(el?.textContent || '').replace(/\s+/g, ' ').trim();
  return txt.length > 42 ? `${txt.slice(0, 42)}…` : txt;
}
function gdEnsureMapId00696_(el) {
  if (!(el instanceof HTMLElement)) return '';
  let id = el.getAttribute('data-gd-style-map-id') || '';
  if (!id) {
    const base = el.getAttribute('data-node-id') || el.id || '';
    id = base ? `gdsm_${base}` : `gdsm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    try { el.setAttribute('data-gd-style-map-id', id); } catch (_) {}
  }
  return id;
}
const GD_VISUAL_PROP_LABELS_00696 = {
  background: 'фон', 'background-color': 'фон', 'background-image': 'фон/градієнт', color: 'текст', border: 'рамка', 'border-color': 'колір рамки', 'border-width': 'товщина рамки', 'border-radius': 'радіус', 'box-shadow': 'тінь', opacity: 'прозорість', filter: 'фільтр'
};
function gdChangedProps00696_(el, source) {
  const props = [];
  try {
    const style = el?.style;
    if (style) {
      for (let i = 0; i < style.length; i += 1) {
        const prop = style[i];
        if (!prop) continue;
        const val = style.getPropertyValue(prop) || '';
        if (/^--st-gd-|^--st-color-|^--st-button-|^--st-menu-/.test(prop)) continue;
        if (/var\(--st-gd-|var\(--st-color-|var\(--st-button-/.test(val)) continue;
        const label = GD_VISUAL_PROP_LABELS_00696[prop] || (/^--/.test(prop) ? prop : '');
        if (label && !props.includes(label)) props.push(label);
      }
    }
  } catch (_) {}
  if (el?.classList?.contains('st-bgfx') && !props.includes('фон')) props.push('фон');
  if (source === 'global' && !props.length) props.push('тема');
  if (source === 'ai' && !props.length) props.push('AI токени');
  if (source === 'design' && !props.length) props.push('ручний стиль');
  return props.slice(0, 5);
}
function gdDepth00696_(el) {
  const scope = gdElementScope00696_(el);
  const slot = scope === 'header' ? el.closest('#st-site-header-slot,.st-site-header-slot') : scope === 'footer' ? el.closest('#st-site-footer-slot,.st-site-footer-slot') : el.closest('#site-root');
  let d = 0;
  let cur = el?.parentElement;
  while (cur && cur !== slot && d < 8) {
    if (cur.matches?.('[data-hf-node-type],.st-section,.st-row,.st-block,.hb-container,.st-container')) d += 1;
    cur = cur.parentElement;
  }
  return d;
}
function gdCollectStyleElements00696_() {
  const root = gdStyleMapRoot00696_();
  const selector = [
    '#st-site-header-slot [data-hf-node-type]', '#st-site-header-slot .st-section', '#st-site-header-slot .st-row', '#st-site-header-slot .st-block',
    '#st-site-footer-slot [data-hf-node-type]', '#st-site-footer-slot .st-section', '#st-site-footer-slot .st-row', '#st-site-footer-slot .st-block',
    '#site-root .st-section', '#site-root .st-row', '#site-root .st-block'
  ].join(',');
  const seen = new Set();
  const out = [];
  try {
    Array.from(root.querySelectorAll(selector)).forEach((el) => {
      if (!(el instanceof HTMLElement) || seen.has(el)) return;
      if (el.closest?.('.hb-panel,.fb-panel,.builder__settings-sidebar,#global-design-panel')) return;
      const scope = gdElementScope00696_(el);
      if (!scope) return;
      const type = gdNodeType00696_(el);
      if (!['section','level','container','block'].includes(type)) return;
      seen.add(el);
      const source = gdElementSource00696_(el);
      const changedMeta00703 = gdChangedDetails00703_(el, source);
      out.push({
        id: gdEnsureMapId00696_(el),
        scope,
        type,
        label: gdTypeLabel00696_(type, el),
        text: gdTextSnippet00696_(el),
        source,
        depth: gdDepth00696_(el),
        changed: changedMeta00703.labels,
        changedDetails: changedMeta00703.details,
        manual: changedMeta00703.manual,
        selected: el.classList.contains('is-selected') || el.classList.contains('is-active') || el.classList.contains('hb-dom-selected') || el.classList.contains('hb-dom-active')
      });
    });
  } catch (_) {}
  return out;
}
function gdStyleMapCounts00696_(rows) {
  const counts = { global: 0, ai: 0, design: 0, header: 0, footer: 0, main: 0, manual: 0 };
  (rows || []).forEach((r) => {
    counts[r.source] = (counts[r.source] || 0) + 1;
    counts[r.scope] = (counts[r.scope] || 0) + 1;
    if (r.manual) counts.manual += 1;
  });
  return counts;
}

const GD_STYLE_MAP_FILTERS_00703 = ['global', 'ai', 'design', 'header', 'main', 'footer', 'manual'];
const GD_STYLE_MAP_SOURCE_FILTERS_00704 = ['global', 'ai', 'design'];
const GD_STYLE_MAP_SCOPE_FILTERS_00704 = ['header', 'main', 'footer'];
function gdNormalizeStyleMapFilters00704_(filters) {
  const clean = Array.isArray(filters) ? filters.map((f) => String(f || '')).filter((f) => GD_STYLE_MAP_FILTERS_00703.includes(f)) : [];
  const out = [];
  clean.forEach((f) => {
    if (GD_STYLE_MAP_SOURCE_FILTERS_00704.includes(f)) {
      for (let i = out.length - 1; i >= 0; i -= 1) if (GD_STYLE_MAP_SOURCE_FILTERS_00704.includes(out[i])) out.splice(i, 1);
    }
    if (GD_STYLE_MAP_SCOPE_FILTERS_00704.includes(f)) {
      for (let i = out.length - 1; i >= 0; i -= 1) if (GD_STYLE_MAP_SCOPE_FILTERS_00704.includes(out[i])) out.splice(i, 1);
    }
    if (!out.includes(f)) out.push(f);
  });
  return out;
}
function gdStyleMapUi00703_() {
  let ui = {};
  try { ui = JSON.parse(localStorage.getItem('st_global_design_ui_00687') || '{}'); } catch (_) { ui = {}; }
  const filters = gdNormalizeStyleMapFilters00704_(ui.styleMapFilters00703);
  return {
    query: String(ui.styleMapQuery00703 || '').trim(),
    filters
  };
}
function gdSaveStyleMapUi00703_(patch) {
  let ui = {};
  try { ui = JSON.parse(localStorage.getItem('st_global_design_ui_00687') || '{}'); } catch (_) { ui = {}; }
  Object.assign(ui, patch || {});
  try { localStorage.setItem('st_global_design_ui_00687', JSON.stringify(ui)); } catch (_) {}
  return gdStyleMapUi00703_();
}
function gdRowSearchText00703_(r) {
  return [r.scope, gdScopeLabel00696_(r.scope), r.type, r.label, r.text, r.source, sourceLabel_(r.source), (r.changed || []).join(' '), (r.changedDetails || []).join(' ')]
    .join(' ')
    .toLowerCase();
}
function gdRowMatchesStyleMapState00703_(r, state) {
  const st = state || gdStyleMapUi00703_();
  const q = String(st.query || '').toLowerCase();
  if (q && !gdRowSearchText00703_(r).includes(q)) return false;
  const filters = st.filters || [];
  if (!filters.length) return true;
  return filters.every((f) => {
    if (f === 'global' || f === 'ai' || f === 'design') return r.source === f;
    if (f === 'header' || f === 'main' || f === 'footer') return r.scope === f;
    if (f === 'manual') return !!r.manual;
    return true;
  });
}
function gdFilteredStyleRows00703_(rows, state) {
  const st = state || gdStyleMapUi00703_();
  return (rows || []).filter((r) => gdRowMatchesStyleMapState00703_(r, st));
}
function gdStyleMapFilterButton00703_(id, label, state, count) {
  const active = (state.filters || []).includes(id);
  const badge = typeof count === 'number' ? `<small>${esc(count)}</small>` : '';
  return `<button type="button" class="gd-map-filter ${active ? 'is-active' : ''}" data-gd-style-map-filter="${esc(id)}" aria-pressed="${active ? 'true' : 'false'}">${esc(label)}${badge}</button>`;
}
function gdStyleMapFilterButtons00703_(counts, state) {
  const rows = [
    ['global', 'Глобально', counts.global || 0],
    ['ai', 'AI', counts.ai || 0],
    ['design', 'Дизайн', counts.design || 0],
    ['header', 'Шапка', counts.header || 0],
    
    ['footer', 'Футер', counts.footer || 0],
    ['manual', 'Ручні зміни', counts.manual || 0]
  ];
  return rows.map(([id, label, count]) => gdStyleMapFilterButton00703_(id, label, state, count)).join('');
}
function gdChangedDetails00703_(el, source) {
  const details = [];
  const labels = [];
  let manual = false;
  try {
    const style = el?.style;
    if (style) {
      for (let i = 0; i < style.length; i += 1) {
        const prop = style[i];
        if (!prop) continue;
        const val = String(style.getPropertyValue(prop) || '').trim();
        if (!val) continue;
        const isTokenVar = /^--st-gd-|^--st-color-|^--st-button-|^--st-menu-/.test(prop);
        const usesGlobalToken = /var\(--st-gd-|var\(--st-color-|var\(--st-button-/.test(val);
        const label = GD_VISUAL_PROP_LABELS_00696[prop] || (/^--/.test(prop) ? prop : '');
        if (label && !labels.includes(label)) labels.push(label);
        if (!isTokenVar && !usesGlobalToken && label) {
          const shortVal = val.length > 42 ? `${val.slice(0, 42)}…` : val;
          details.push(`${label}: ${shortVal}`);
        } else if (label && details.length < 4) {
          const shortVal = val.length > 36 ? `${val.slice(0, 36)}…` : val;
          details.push(`${label}: ${shortVal}`);
        }
      }
    }
  } catch (_) {}
  if (el?.classList?.contains('st-bgfx')) {
    manual = true;
    if (!labels.includes('фон')) labels.push('фон');
    if (!details.includes('фон: st-bgfx')) details.push('фон: st-bgfx');
  }
  if (source === 'design') manual = true;
  if (source === 'global' && !labels.length) labels.push('тема');
  if (source === 'ai' && !labels.length) labels.push('AI токени');
  if (source === 'design' && !labels.length) labels.push('ручний стиль');
  return { labels: labels.slice(0, 6), details: details.slice(0, 8), manual };
}
function gdStyleMapDetailChips00705_(items, emptyText) {
  const list = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!list.length) return `<span class="gd-style-detail-empty-00705">${esc(emptyText || 'немає точкових змін')}</span>`;
  return list.map((item) => `<span class="gd-style-detail-chip-00705">${esc(item)}</span>`).join('');
}
function gdStyleMapRowPlainText00705_(row) {
  if (!row) return '';
  const get = (sel) => String(row.querySelector(sel)?.textContent || '').trim();
  const scope = row.getAttribute('data-gd-style-map-scope-label') || '';
  const label = row.getAttribute('data-gd-style-map-label') || '';
  const type = row.getAttribute('data-gd-style-map-type-label') || '';
  const source = row.getAttribute('data-gd-style-map-source-label') || '';
  const manual = row.getAttribute('data-gd-style-map-manual') === '1' ? 'Так' : 'Ні';
  const text = row.getAttribute('data-gd-style-map-text') || '';
  const details = get('[data-gd-style-map-row-details]') || 'Деталей немає.';
  return [
    'SHIFT TIME BUILDER · STYLE MAP DETAILS',
    `Елемент: ${label}`,
    `Область: ${scope}`,
    `Тип: ${type}`,
    `Джерело стилю: ${source}`,
    `Ручні зміни: ${manual}`,
    text ? `Текст елемента: ${text}` : '',
    '',
    'ДЕТАЛІ:',
    details.replace(/\s{2,}/g, ' ').replace(/\s*\n\s*/g, '\n').trim()
  ].filter(Boolean).join('\n');
}
function gdCopyText00705_(text) {
  const value = String(text || '');
  if (!value) return Promise.resolve(false);
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value).then(() => true).catch(() => false);
  return new Promise((resolve) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      resolve(!!ok);
    } catch (_) { resolve(false); }
  });
}
function gdCloseStyleMapDetailModal00705_() {
  try { document.querySelectorAll('[data-gd-style-map-detail-modal-00705]').forEach((n) => n.remove()); } catch (_) {}
}
function gdOpenStyleMapDetailModal00705_(row) {
  if (!row) return;
  gdCloseStyleMapDetailModal00705_();
  const scope = row.getAttribute('data-gd-style-map-scope-label') || '';
  const label = row.getAttribute('data-gd-style-map-label') || '';
  const type = row.getAttribute('data-gd-style-map-type-label') || '';
  const source = row.getAttribute('data-gd-style-map-source-label') || '';
  const sourceRaw = row.getAttribute('data-gd-style-map-source') || 'global';
  const detailsNode = row.querySelector('[data-gd-style-map-row-details]');
  const detailsHtml = (detailsNode?.outerHTML || '<div class="gd-note">Деталі для цього елемента відсутні.</div>').replace(/\s+hidden(?=[\s>])/g, '');
  const copyText = gdStyleMapRowPlainText00705_(row);
  const modal = document.createElement('div');
  modal.className = 'gd-style-map-modal-backdrop-00705';
  modal.setAttribute('data-gd-style-map-detail-modal-00705', '1');
  modal.innerHTML = `
    <div class="gd-style-map-modal-00705" role="dialog" aria-modal="true" aria-label="Деталі елемента карти стилів">
      <div class="gd-style-map-modal-head-00705">
        <div>
          <span class="gd-style-map-modal-kicker-00705">STYLE MAP · API / STYLE DETAILS</span>
          <h2>${esc(scope)} · ${esc(type)} · ${esc(source)}</h2>
          <p>${esc(label)}</p>
        </div>
        <button type="button" class="gd-style-map-modal-close-00705" data-gd-style-map-modal-close-00705="1" aria-label="Закрити">×</button>
      </div>
      <div class="gd-style-map-modal-body-00705" data-gd-style-map-copy-source-00705="1">
        <div class="gd-style-map-modal-summary-00705">
          <div><b>Область</b><strong>${esc(scope)}</strong></div>
          <div><b>Тип</b><strong>${esc(type)}</strong></div>
          <div><b>Джерело</b><strong class="gd-source-pill gd-source-pill--${esc(sourceRaw)}">${esc(source)}</strong></div>
        </div>
        <div class="gd-style-map-modal-explain-00706">
          <b>Що тут показано</b>
          <p>Нижче ті самі дані, які відкриває маленький трикутник у рядку: перелік API / CSS-змінних / style-властивостей, через які цей елемент отримує свій вигляд. Цей список не змінює сайт — він тільки пояснює, що саме знайдено у Style Map.</p>
        </div>
        <div class="gd-style-map-modal-details-00705">${detailsHtml}</div>
      </div>
      <div class="gd-style-map-modal-foot-00705">
        <p>Текст можна виділити мишкою, натиснути праву кнопку і скопіювати, або скористатись кнопкою нижче.</p>
        <div class="gd-style-map-modal-actions-00705">
          <button type="button" data-gd-style-map-modal-copy-00705="1">Копіювати</button>
          <button type="button" data-gd-style-map-modal-close-00705="1">Закрити</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close = () => gdCloseStyleMapDetailModal00705_();
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target?.closest?.('[data-gd-style-map-modal-close-00705]')) { close(); return; }
    const copyBtn = ev.target?.closest?.('[data-gd-style-map-modal-copy-00705]');
    if (copyBtn) {
      gdCopyText00705_(copyText).then((ok) => {
        try { copyBtn.textContent = ok ? 'Скопійовано' : 'Не скопійовано'; setTimeout(() => { copyBtn.textContent = 'Копіювати'; }, 1200); } catch (_) {}
      });
    }
  });
  const onKey = (ev) => {
    if (ev.key === 'Escape') {
      close();
      document.removeEventListener('keydown', onKey, true);
    }
  };
  document.addEventListener('keydown', onKey, true);
  try { modal.querySelector('[data-gd-style-map-modal-close-00705]')?.focus?.({ preventScroll: true }); } catch (_) {}
  log00687_('global-design-style-map-row-modal-00705', { scope, type, source: sourceRaw, label });
}
function gdToggleStyleMapRowDetails00705_(btn) {
  const row = btn?.closest?.('[data-gd-style-map-row]');
  const details = row?.querySelector?.('[data-gd-style-map-row-details]');
  if (!row || !details) return;
  const open = details.hasAttribute('hidden');
  row.classList.toggle('is-details-open-00705', open);
  if (open) details.removeAttribute('hidden');
  else details.setAttribute('hidden', '');
  try { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); } catch (_) {}
  btn.textContent = open ? '▴' : '▾';
  log00687_('global-design-style-map-row-details-toggle-00707', { open, id: row.getAttribute('data-gd-style-map-row') || '' });
}
function gdRenderStyleMapRow00696_(r) {
  const indent = Math.max(0, Math.min(5, Number(r.depth) || 0));
  const source = r.source || 'global';
  const search = gdRowSearchText00703_(r);
  const details = Array.isArray(r.changedDetails) ? r.changedDetails : [];
  const changed = Array.isArray(r.changed) ? r.changed : [];
  const scopeLabel = gdScopeLabel00696_(r.scope);
  const typeLabel = r.label || gdTypeLabel00696_(r.type);
  const sourceLabel = sourceLabel_(source);
  const oldDetails = details.length ? details : (changed.length ? changed : ['глобальна тема']);
  return `
    <div class="gd-style-el-row ${r.selected ? 'is-selected' : ''}" data-gd-style-map-row="${esc(r.id)}" data-gd-style-map-source="${esc(source)}" data-gd-style-map-source-label="${esc(sourceLabel)}" data-gd-style-map-scope="${esc(r.scope)}" data-gd-style-map-scope-label="${esc(scopeLabel)}" data-gd-style-map-type="${esc(r.type)}" data-gd-style-map-type-label="${esc(typeLabel)}" data-gd-style-map-label="${esc(typeLabel)}" data-gd-style-map-text="${esc(r.text || '')}" data-gd-style-map-manual="${r.manual ? '1' : '0'}" data-gd-style-map-search="${esc(search)}" tabindex="-1" aria-current="${r.selected ? 'true' : 'false'}" style="--gd-map-indent:${indent}">
      <div class="gd-style-el-main gd-style-el-main--compact-00705">
        <span class="gd-style-scope">${esc(scopeLabel)}</span>
        <b>${esc(typeLabel)}</b>
        ${r.text ? `<small>${esc(r.text)}</small>` : ''}
      </div>
      <div class="gd-style-el-source gd-style-el-source--compact-00705">
        <span class="gd-style-map-top-source-00708">
          <span class="gd-source-pill gd-source-pill--${esc(source)}">${esc(sourceLabel)}</span>
          <button class="gd-style-map-mini-btn-00705" type="button" data-gd-style-map-details-toggle="1" data-gd-style-map-target="${esc(r.id)}" aria-expanded="false" title="Відкрити старий перелік стилів">▾</button>
          <button class="gd-style-map-info-btn-00705" type="button" data-gd-style-map-info="1" data-gd-style-map-target="${esc(r.id)}" title="Відкрити цей самий перелік у великому вікні">●</button>
        </span>
      </div>
      <div class="gd-style-props gd-style-props--row-details-00706" data-gd-style-map-row-details="1" title="${esc(oldDetails.join(' · '))}" hidden>
        ${oldDetails.map((d) => `<span>${esc(d)}</span>`).join('')}
      </div>
      <div class="gd-style-el-actions gd-style-el-actions--00705">
        <button type="button" data-gd-style-map-action="select" data-gd-style-map-target="${esc(r.id)}">Виділити</button>
        <button type="button" data-gd-style-map-action="global" data-gd-style-map-target="${esc(r.id)}">Глобально</button>
        <button type="button" data-gd-style-map-action="ai" data-gd-style-map-target="${esc(r.id)}">AI</button>
        <button type="button" data-gd-style-map-action="design" data-gd-style-map-target="${esc(r.id)}">Дизайн</button>
      </div>
    </div>`;
}

function renderStyleMap00693_(st, resolved) {
  const active = st?.activeSource || 'global';
  const globalStats = sourceStats00693_(st, 'global');
  const aiStats = sourceStats00693_(st, 'ai');
  const designStats = sourceStats00693_(st, 'design');
  const activeStats = sourceStats00693_(st, active);
  const allRows = gdCollectStyleElements00696_();
  const uiState00703 = gdStyleMapUi00703_();
  const filteredRows00704 = gdFilteredStyleRows00703_(allRows, uiState00703);
  const rows = allRows;
  const counts = gdStyleMapCounts00696_(allRows);
  const filteredCounts = gdStyleMapCounts00696_(filteredRows00704);
  const ui00698 = (() => { try { return JSON.parse(localStorage.getItem('st_global_design_ui_00687') || '{}'); } catch (_) { return {}; } })();
  const styleMapClosed = ui00698.styleMapClosed === true;
  const hasRows = rows.length > 0;
  return `
    <div class="gd-card gd-card--style-map gd-card--style-map-00703 ${styleMapClosed ? 'is-closed' : ''}" data-gd-style-map="1" data-gd-accordion="styleMap">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="styleMap" aria-label="Відкрити або закрити карту стилів">${styleMapClosed ? '▸' : '▾'}</button><span>Карта стилів 2.0</span></span><small><span data-gd-style-map-filtered-count>${esc(filteredRows00704.length)}</span> / ${esc(allRows.length)} елементів</small></div>
      <div class="gd-card__body">
        <div class="gd-map-row gd-map-row--wide">
          <b>Пошук і фільтри</b>
          <div class="gd-style-map-toolbar">
            <input class="gd-style-map-search" type="search" data-gd-style-map-search="1" value="${esc(uiState00703.query)}" placeholder="Пошук: кнопка, меню, шапка, border, фон…" autocomplete="off">
            <button type="button" class="gd-map-filter-clear" data-gd-style-map-clear="1">Очистити</button>
          </div>
          <div class="gd-style-map-filters" data-gd-style-map-filters="1">
            ${gdStyleMapFilterButtons00703_(counts, uiState00703)}
          </div>
          <small>Фільтри можна комбінувати: наприклад, «Шапка» + «Дизайн» покаже тільки ручні/дизайн-елементи у шапці. Підсвічено на сайті: <b data-gd-style-map-highlight-count>0</b>.</small>
        </div>
        <div class="gd-map-row gd-map-row--wide">
          <b>Поточний стан</b>
          <div class="gd-chip-row">
            <span class="gd-chip">Шапка: ${esc(counts.header || 0)}</span>
            <span class="gd-chip">Футер: ${esc(counts.footer || 0)}</span>
            
            <span class="gd-chip">Глобально: ${esc(counts.global || 0)}</span>
            <span class="gd-chip">AI: ${esc(counts.ai || 0)}</span>
            <span class="gd-chip">Дизайн: ${esc(counts.design || 0)}</span>
            <span class="gd-chip gd-chip--warn">Ручні: ${esc(counts.manual || 0)}</span>
          </div>
          <small>Зараз у списку: ${esc(filteredRows00704.length)} · Глобально ${esc(filteredCounts.global || 0)} · AI ${esc(filteredCounts.ai || 0)} · Дизайн ${esc(filteredCounts.design || 0)} · Ручні ${esc(filteredCounts.manual || 0)}</small>
        </div>
        <div class="gd-map-row gd-map-row--wide">
          <b>Групові дії</b>
          <div class="gd-style-map-group-actions">
            <button type="button" data-gd-style-map-group-action="visible-global">Видимі → Глобально</button>
            <button type="button" data-gd-style-map-group-action="manual-global">Очистити всі ручні стилі</button>
            <button type="button" data-gd-style-map-group-action="header-global">Шапка → Глобально</button>
            
            <button type="button" data-gd-style-map-group-action="footer-global">Футер → Глобально</button>
          </div>
          <small>Групові дії не змінюють текст, фото або структуру. Вони тільки прибирають локальні стилі і повертають керування глобальній темі.</small>
        </div>
        <div class="gd-map-row gd-map-row--wide">
          <b>Точкові зміни активного джерела</b>
          <div class="gd-chip-row">${renderGroups00693_(activeStats.groups)}</div>
        </div>
        <div class="gd-source-stats">
          <span>Глобально: <b>${esc(globalStats.count)}</b></span>
          <span>AI: <b>${esc(aiStats.count)}</b></span>
          <span>Дизайн: <b>${esc(designStats.count)}</b></span>
        </div>
        <div class="gd-style-map-list" data-gd-style-map-list="1">
          ${hasRows ? rows.map(gdRenderStyleMapRow00696_).join('') : '<div class="gd-note" data-gd-style-map-empty="1">Карта стилів поки не знайшла елементів на сайті.</div>'}
        </div>
        <div class="gd-note" data-gd-style-map-empty-dom="1" hidden>За поточним пошуком/фільтрами нічого не знайдено. Очистіть пошук або фільтри.</div>
        <div class="gd-note">Кожен рядок має власне джерело стилю. Style Map 2.0 показує конкретні змінені властивості, дозволяє шукати, фільтрувати й масово повертати елементи під керування глобальної теми.</div>
      </div>
    </div>`;
}

function refreshStyleOverview00693_(root, st, resolved) {
  if (!root) return;
  const banner = root.querySelector('[data-gd-active-source-banner]');
  if (banner) {
    try { banner.outerHTML = renderSourceBanner00693_(st, resolved); } catch (_) {}
  }
  const map = root.querySelector('[data-gd-style-map]');
  if (map) {
    try { map.outerHTML = renderStyleMap00693_(st, resolved); } catch (_) {}
  }
}

function injectCss_() {
  ['st-global-design-css-00684', 'st-global-design-css-00686', 'st-global-design-css-00687'].forEach((id) => {
    const old = document.getElementById(id);
    if (old) old.remove();
  });
  const style = document.createElement('style');
  style.id = 'st-global-design-css-00687';
  style.textContent = `
    #global-design-panel{display:flex;flex-direction:column;gap:12px;color:#e5edf7;font-family:Inter,Manrope,Arial,sans-serif;}
    .gd-card{border:1px solid rgba(148,163,184,.20);border-radius:18px;background:rgba(15,23,42,.48);box-shadow:0 14px 34px rgba(0,0,0,.18);overflow:hidden;}
    .gd-card--themes{overflow:visible;}
    .gd-card__head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(148,163,184,.14);font-weight:900;letter-spacing:.02em;}
    .gd-card__head-main{display:flex;align-items:center;gap:8px;min-width:0;}
    .gd-card__body{padding:12px 14px;display:flex;flex-direction:column;gap:12px;}
    .gd-card.is-closed .gd-card__body{display:none;}
    .gd-card.is-closed .gd-card__head{border-bottom:0;}
    .gd-toggle{width:28px;height:28px;border-radius:10px;border:1px solid rgba(148,163,184,.25);background:rgba(2,6,23,.38);color:#e5edf7;font-weight:950;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;}
    .gd-toggle:hover{background:rgba(56,189,248,.16);border-color:rgba(56,189,248,.38);}
    .gd-note{font-size:12px;line-height:1.45;color:#aebbd0;background:rgba(2,6,23,.35);border:1px solid rgba(148,163,184,.14);border-radius:14px;padding:10px;}
    .gd-source-row{display:grid;grid-template-columns:1fr;gap:8px;}
    .gd-radio{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid rgba(148,163,184,.18);border-radius:14px;padding:9px 10px;background:rgba(2,6,23,.30);cursor:pointer;}
    .gd-radio input{accent-color:#38bdf8;}
    .gd-radio span{font-size:13px;font-weight:850;}
    .gd-radio small{display:block;font-size:11px;color:#8ea0b8;margin-top:2px;}
    .gd-themes{display:grid;grid-template-columns:1fr;gap:8px;max-height:420px;overflow:auto;padding-right:4px;}
    .gd-theme{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid rgba(148,163,184,.17);border-radius:16px;background:rgba(2,6,23,.28);padding:10px;cursor:pointer;text-align:left;color:inherit;}
    .gd-theme:hover{border-color:rgba(56,189,248,.45);box-shadow:0 0 0 3px rgba(56,189,248,.08);}
    .gd-theme.is-active{border-color:rgba(34,211,238,.72);box-shadow:0 0 0 3px rgba(34,211,238,.12),0 16px 34px rgba(34,211,238,.12);}
    .gd-theme:focus-visible{outline:2px solid rgba(34,211,238,.86);outline-offset:3px;}
    .gd-theme[aria-current="true"]{position:relative;}
    .gd-theme[aria-current="true"]::after{content:"АКТИВНА";position:absolute;right:10px;top:8px;font-size:8px;letter-spacing:.08em;color:#67e8f9;background:rgba(8,47,73,.55);border:1px solid rgba(34,211,238,.24);border-radius:999px;padding:2px 6px;}
    .gd-density-presets{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .gd-density-preset{border:1px solid rgba(148,163,184,.18);border-radius:16px;background:rgba(2,6,23,.30);color:inherit;padding:10px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:5px;min-height:82px;}
    .gd-density-preset:hover{border-color:rgba(56,189,248,.45);box-shadow:0 0 0 3px rgba(56,189,248,.08);}
    .gd-density-preset.is-active{border-color:rgba(34,211,238,.72);box-shadow:0 0 0 3px rgba(34,211,238,.12);}
    .gd-density-preset em{font-style:normal;font-size:10px;color:#94a3b8;font-weight:800;}
    .gd-density-preset strong{font-size:13px;color:#e5edf7;}
    .gd-density-preset p{margin:0;font-size:11px;line-height:1.35;color:#9fb0c9;}
    .gd-theme strong{font-size:13px;display:block;}
    .gd-theme em{font-style:normal;font-size:10px;color:#8ea0b8;text-transform:uppercase;letter-spacing:.08em;}
    .gd-theme p{margin:4px 0 0;font-size:11px;line-height:1.3;color:#aebbd0;}
    .gd-swatches{display:flex;align-items:center;gap:5px;}
    .gd-swatch{width:20px;height:20px;border-radius:999px;border:2px solid rgba(255,255,255,.38);box-shadow:0 5px 14px rgba(0,0,0,.22);cursor:help;}
    .gd-tooltip-00687{position:fixed;left:0;top:0;max-width:520px;z-index:2147483647;background:#020617;color:#ffffff;border:3px solid rgba(34,211,238,.95);border-radius:22px;padding:20px 22px;font-size:22px;line-height:1.3;font-weight:1000;letter-spacing:.015em;text-transform:uppercase;box-shadow:0 26px 90px rgba(0,0,0,.72),0 0 0 9999px rgba(2,6,23,.04);pointer-events:none;transform:translate(-50%,-100%);}
    .gd-tooltip-00687 small{display:block;margin-top:7px;color:#bae6fd;font-size:16px;line-height:1.4;font-weight:950;text-transform:none;letter-spacing:0;}
    .gd-grid2,.gd-grid1{display:grid;grid-template-columns:minmax(0,1fr);gap:7px;}
    .gd-field{
      display:grid;
      grid-template-columns:minmax(118px,34%) minmax(0,1fr);
      grid-template-areas:"label control" "manual manual" "preview preview";
      align-items:center;
      column-gap:12px;
      min-height:48px;
      padding:7px 9px 7px 12px;
      border:1px solid rgba(148,163,184,.14);
      border-radius:14px;
      background:linear-gradient(135deg,rgba(15,23,42,.62),rgba(2,6,23,.34));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
      color:#9fb0c9;
      font-size:11px;
      font-weight:800;
      transition:border-color .16s ease,background .16s ease,box-shadow .16s ease;
    }
    .gd-field:hover,.gd-field:focus-within{
      border-color:rgba(56,189,248,.34);
      background:linear-gradient(135deg,rgba(15,23,42,.78),rgba(8,47,73,.22));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.04),0 8px 24px rgba(2,6,23,.18);
    }
    .gd-field>b{
      grid-area:label;
      min-width:0;
      color:#f8fafc;
      font-size:11.5px;
      line-height:1.25;
      font-weight:900;
      letter-spacing:.005em;
    }
    .gd-field>small{display:none;}
    .gd-field input[type="text"],.gd-field input[type="number"]{
      width:100%;
      min-width:0;
      min-height:34px;
      border:1px solid rgba(148,163,184,.22);
      border-radius:10px;
      background:#0b1120;
      color:#e5edf7;
      padding:7px 9px;
      box-sizing:border-box;
      font-size:11px;
    }
    .gd-field input[type="range"]{
      width:100%;
      min-width:80px;
      height:18px;
      margin:0;
      accent-color:#22d3ee;
      cursor:pointer;
    }
    .gd-range-line{
      grid-area:control;
      display:grid;
      grid-template-columns:minmax(80px,1fr) 46px 25px;
      align-items:center;
      gap:8px;
      min-width:0;
    }
    .gd-range-value{
      min-width:0;
      border:1px solid rgba(56,189,248,.18);
      border-radius:8px;
      background:rgba(8,47,73,.26);
      padding:4px 5px;
      text-align:center;
      color:#e0f2fe;
      font-size:10.5px;
      line-height:1;
      font-weight:950;
      font-variant-numeric:tabular-nums;
    }

    .gd-control-row{
      grid-area:control;
      display:grid;
      grid-template-columns:minmax(0,1fr) 25px;
      align-items:center;
      gap:8px;
      min-width:0;
    }
    .gd-field--color .gd-control-row{grid-template-columns:30px 25px;justify-content:end;}
    .gd-field input[type="color"]{
      width:30px;
      height:30px;
      min-width:30px;
      padding:0;
      border:2px solid rgba(226,232,240,.78);
      border-radius:999px;
      background:transparent;
      box-shadow:0 0 0 3px rgba(56,189,248,.08),0 7px 16px rgba(0,0,0,.25);
      cursor:pointer;
      overflow:hidden;
    }
    .gd-field input[type="color"]::-webkit-color-swatch-wrapper{padding:0;}
    .gd-field input[type="color"]::-webkit-color-swatch{border:0;border-radius:999px;}
    .gd-field input[type="color"]::-moz-color-swatch{border:0;border-radius:999px;}
    .gd-manual-dot{width:25px;height:25px;border-radius:999px;border:1px solid rgba(125,211,252,.62);background:radial-gradient(circle at 35% 30%,#ffffff,#38bdf8 36%,#0f172a 76%);box-shadow:0 6px 15px rgba(56,189,248,.18);cursor:pointer;}
    .gd-manual-dot:hover,.gd-manual-dot.is-open{transform:translateY(-1px) scale(1.04);box-shadow:0 0 0 4px rgba(56,189,248,.14),0 14px 30px rgba(56,189,248,.30);}
    .gd-manual-line{grid-area:manual;display:none;grid-template-columns:minmax(0,1fr) 30px;gap:7px;align-items:center;margin-top:7px;padding-top:8px;border-top:1px solid rgba(148,163,184,.12);}
    .gd-manual-line.is-open{display:grid;}
    .gd-format-help{width:29px;height:29px;border-radius:999px;border:2px solid rgba(250,204,21,.80);background:#111827;color:#fef08a;font-size:16px;font-weight:1000;line-height:1;cursor:help;box-shadow:0 10px 28px rgba(250,204,21,.16);}
    .gd-format-help:hover{background:#facc15;color:#111827;}
    .gd-shadow-preview{grid-area:preview;height:8px;margin-top:6px;border-radius:999px;background:linear-gradient(90deg,rgba(255,255,255,.92),rgba(125,211,252,.88));border:1px solid rgba(148,163,184,.22);}
    .gd-section-title{margin:9px 2px 1px;padding-bottom:7px;border-bottom:1px solid rgba(34,211,238,.14);font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:#67e8f9;font-weight:950;}
    .gd-btn{border:1px solid rgba(56,189,248,.28);border-radius:14px;background:rgba(56,189,248,.10);color:#dff8ff;font-weight:900;font-size:12px;padding:10px 12px;cursor:pointer;}
    .gd-btn:hover{background:rgba(56,189,248,.16);}
    .gd-source-banner{border:1px solid rgba(34,211,238,.34);border-radius:18px;background:linear-gradient(135deg,rgba(14,165,233,.16),rgba(2,6,23,.34));padding:12px 14px;box-shadow:0 18px 44px rgba(14,165,233,.12);}
    .gd-source-banner__top{display:flex;align-items:center;gap:10px;margin-bottom:7px;}
    .gd-source-banner__top strong{font-size:13px;color:#f8fafc;font-weight:1000;letter-spacing:.02em;}
    .gd-source-banner__text{font-size:12px;color:#c7d2fe;line-height:1.45;}
    .gd-source-pill{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:4px 10px;font-size:10px;line-height:1;font-weight:1000;text-transform:uppercase;letter-spacing:.07em;border:1px solid rgba(148,163,184,.28);background:rgba(15,23,42,.70);color:#e5edf7;white-space:nowrap;}
    .gd-source-pill--global{background:rgba(14,165,233,.18);border-color:rgba(56,189,248,.50);color:#bae6fd;}
    .gd-source-pill--ai{background:rgba(168,85,247,.18);border-color:rgba(192,132,252,.52);color:#e9d5ff;}
    .gd-source-pill--design{background:rgba(249,115,22,.18);border-color:rgba(251,146,60,.52);color:#fed7aa;}
    .gd-card--style-map{border-color:rgba(34,211,238,.22);}
    .gd-map-row{display:grid;grid-template-columns:80px auto;gap:8px;align-items:start;border:1px solid rgba(148,163,184,.14);border-radius:14px;background:rgba(2,6,23,.28);padding:9px 10px;}
    .gd-map-row b{color:#e0f2fe;font-size:12px;font-weight:1000;}
    .gd-map-row small{grid-column:1/-1;color:#9fb0c9;font-size:11px;line-height:1.35;}
    .gd-map-row--wide{grid-template-columns:1fr;}
    .gd-chip-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .gd-chip{display:inline-flex;align-items:center;border:1px solid rgba(56,189,248,.24);background:rgba(56,189,248,.10);border-radius:999px;padding:4px 8px;font-size:10px;color:#dff8ff;font-weight:900;}
    .gd-muted{font-size:11px;color:#8ea0b8;font-weight:750;}
    .gd-source-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;}
    .gd-source-stats span{border:1px solid rgba(148,163,184,.14);border-radius:12px;background:rgba(2,6,23,.28);padding:8px 9px;font-size:11px;color:#aebbd0;font-weight:800;text-align:center;}
    .gd-source-stats b{color:#67e8f9;font-size:13px;}
    .gd-style-map-list{display:flex;flex-direction:column;gap:8px;max-height:520px;overflow:auto;padding-right:2px;}
    .gd-style-map-list::-webkit-scrollbar{width:7px;}
    .gd-style-map-list::-webkit-scrollbar-thumb{background:rgba(56,189,248,.34);border-radius:999px;}
    .gd-style-el-row{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(96px,.7fr);gap:8px;border:1px solid rgba(148,163,184,.16);border-radius:15px;background:rgba(2,6,23,.32);padding:9px 9px 9px calc(9px + var(--gd-map-indent,0) * 10px);}
    .gd-style-el-row.is-selected{border-color:rgba(250,204,21,.74);box-shadow:0 0 0 3px rgba(250,204,21,.12),0 14px 34px rgba(250,204,21,.10);}
    .gd-style-el-row.is-focused-00697{border-color:rgba(34,211,238,.95);box-shadow:0 0 0 4px rgba(34,211,238,.18),0 18px 46px rgba(34,211,238,.18);background:rgba(8,47,73,.42);}
    .gd-style-el-main{min-width:0;display:flex;flex-direction:column;gap:3px;}
    .gd-style-el-main b{font-size:12px;color:#f8fafc;font-weight:1000;line-height:1.1;}
    .gd-style-el-main small{font-size:10.5px;color:#9fb0c9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .gd-style-scope{align-self:flex-start;border:1px solid rgba(56,189,248,.26);border-radius:999px;background:rgba(56,189,248,.10);color:#bae6fd;font-size:9.5px;font-weight:1000;line-height:1;padding:3px 7px;letter-spacing:.04em;text-transform:uppercase;}
    .gd-style-el-source{display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-start;gap:5px;min-width:0;}
    .gd-style-map-top-source-00708{display:inline-flex;align-items:center;justify-content:flex-end;gap:5px;max-width:100%;min-width:0;}
    .gd-style-el-actions{grid-column:1/-1;display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
    .gd-style-el-actions button{border:1px solid rgba(148,163,184,.18);border-radius:11px;background:rgba(15,23,42,.58);color:#cbd5e1;font-size:10.5px;font-weight:1000;padding:7px 9px;cursor:pointer;min-height:30px;}
    .gd-style-el-actions button:hover{border-color:rgba(103,232,249,.60);background:rgba(14,165,233,.16);color:#f8fafc;}
    .gd-style-props[hidden],.gd-style-props--row-details-00706[hidden]{display:none !important;}
    .gd-style-map-mini-btn-00705,.gd-style-map-info-btn-00705{width:18px !important;height:18px !important;min-width:18px !important;min-height:18px !important;padding:0 !important;border-radius:999px !important;display:inline-flex !important;align-items:center !important;justify-content:center !important;flex:0 0 18px !important;}
    .gd-style-map-top-source-00708 .gd-source-pill{max-width:118px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .gd-style-map-mini-btn-00705{font-size:10px !important;line-height:1;color:#fde68a !important;border-color:rgba(250,204,21,.45) !important;background:rgba(250,204,21,.08) !important;}
    .gd-style-map-info-btn-00705{font-size:7px !important;line-height:1;color:#dff6ff !important;border-color:rgba(56,189,248,.48) !important;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.98),rgba(56,189,248,.58) 38%,rgba(15,23,42,.72) 76%) !important;box-shadow:none !important;}
    .gd-style-map-info-btn-00705:hover,.gd-style-map-mini-btn-00705:hover{transform:translateY(-1px);box-shadow:0 0 0 3px rgba(56,189,248,.12) !important;}
    .gd-style-row-details-00705{grid-column:1/-1;border:1px solid rgba(250,204,21,.22);border-radius:16px;background:linear-gradient(135deg,rgba(15,23,42,.76),rgba(2,6,23,.56));padding:11px;user-select:text;}
    .gd-style-row-details-grid-00705{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:10px;}
    .gd-style-row-details-grid-00705 div,.gd-style-row-details-section-00705,.gd-style-row-details-text-00705{border:1px solid rgba(148,163,184,.16);border-radius:13px;background:rgba(2,6,23,.34);padding:8px;}
    .gd-style-row-details-grid-00705 b,.gd-style-row-details-section-00705>b,.gd-style-row-details-text-00705>b{display:block;color:#fef08a;font-size:10px;font-weight:1000;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;}
    .gd-style-row-details-grid-00705 span,.gd-style-row-details-text-00705 p{margin:0;color:#e5edf7;font-size:12px;font-weight:850;line-height:1.35;}
    .gd-style-row-details-section-00705{margin-top:8px;}
    .gd-style-detail-chip-00705,.gd-style-detail-empty-00705{display:inline-flex;max-width:100%;margin:3px 4px 3px 0;border:1px solid rgba(56,189,248,.20);background:rgba(56,189,248,.08);border-radius:999px;padding:4px 8px;color:#bfdbfe;font-size:10px;font-weight:900;line-height:1.25;vertical-align:middle;}
    .gd-style-detail-empty-00705{border-color:rgba(148,163,184,.18);background:rgba(148,163,184,.08);color:#cbd5e1;}
    .gd-style-map-toolbar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;}
    .gd-style-map-search{width:100%;min-height:36px;border:1px solid rgba(56,189,248,.26);border-radius:13px;background:rgba(2,6,23,.56);color:#e5edf7;padding:8px 10px;font-size:12px;font-weight:800;box-sizing:border-box;}
    .gd-map-filter-clear{border:1px solid rgba(148,163,184,.22);border-radius:12px;background:rgba(15,23,42,.72);color:#dbeafe;font-size:11px;font-weight:1000;padding:9px 10px;cursor:pointer;}
    .gd-map-filter-clear:hover{border-color:rgba(103,232,249,.58);background:rgba(14,165,233,.16);}
    .gd-style-map-filters,.gd-style-map-group-actions{display:flex;flex-wrap:wrap;gap:7px;}
    .gd-map-filter,.gd-style-map-group-actions button{border:1px solid rgba(148,163,184,.20);border-radius:999px;background:rgba(15,23,42,.58);color:#cbd5e1;font-size:10.5px;font-weight:1000;padding:7px 9px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;}
    .gd-map-filter small{border-radius:999px;background:rgba(148,163,184,.15);padding:1px 5px;color:#bae6fd;}
    .gd-map-filter:hover,.gd-style-map-group-actions button:hover{border-color:rgba(103,232,249,.62);background:rgba(14,165,233,.16);color:#f8fafc;}
    .gd-map-filter.is-active{border-color:rgba(250,204,21,.76);background:rgba(250,204,21,.16);color:#fef9c3;box-shadow:0 0 0 3px rgba(250,204,21,.10);}
    .gd-style-el-row.is-filter-match-00704{border-color:rgba(250,204,21,.62);background:linear-gradient(135deg,rgba(250,204,21,.13),rgba(2,6,23,.36));box-shadow:0 0 0 2px rgba(250,204,21,.08),0 14px 30px rgba(250,204,21,.08);}
    .gd-style-el-row.is-filter-design-00704{border-color:rgba(251,191,36,.82);background:linear-gradient(135deg,rgba(251,191,36,.18),rgba(249,115,22,.10),rgba(2,6,23,.35));}
    .gd-style-map-group-actions button[data-gd-style-map-group-action="manual-global"]{border-color:rgba(251,146,60,.42);background:rgba(249,115,22,.14);color:#fed7aa;}
    .gd-style-props{grid-column:1/-1;display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0;}
    .gd-style-props span{border:1px solid rgba(56,189,248,.18);background:rgba(56,189,248,.08);border-radius:999px;padding:3px 7px;color:#bfdbfe;font-size:9.5px;font-weight:900;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .gd-style-props--row-details-00706{margin-top:3px;}

    .gd-style-map-modal-backdrop-00705{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 15%,rgba(14,165,233,.20),rgba(2,6,23,.82) 42%,rgba(0,0,0,.88));backdrop-filter:blur(8px);}
    .gd-style-map-modal-00705{width:min(980px,calc(100vw - 42px));max-height:calc(100vh - 42px);overflow:auto;border:2px solid rgba(56,189,248,.50);border-radius:28px;background:linear-gradient(145deg,#020617,#0f172a 45%,#111827);box-shadow:0 34px 120px rgba(0,0,0,.78),0 0 0 1px rgba(255,255,255,.06);color:#e5edf7;user-select:text;}
    .gd-style-map-modal-00705::-webkit-scrollbar{width:9px;}.gd-style-map-modal-00705::-webkit-scrollbar-thumb{background:rgba(56,189,248,.38);border-radius:999px;}
    .gd-style-map-modal-head-00705{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:24px 26px 18px;border-bottom:1px solid rgba(56,189,248,.20);background:linear-gradient(135deg,rgba(56,189,248,.14),rgba(250,204,21,.08));}
    .gd-style-map-modal-kicker-00705{display:inline-flex;margin-bottom:9px;border:1px solid rgba(250,204,21,.45);border-radius:999px;background:rgba(250,204,21,.12);color:#fef08a;padding:5px 9px;font-size:11px;font-weight:1000;letter-spacing:.12em;}
    .gd-style-map-modal-head-00705 h2{margin:0;color:#ffffff;font:1000 28px/1.08 Inter,Manrope,Arial,sans-serif;letter-spacing:-.03em;text-transform:uppercase;}
    .gd-style-map-modal-head-00705 p{margin:8px 0 0;color:#bae6fd;font-size:17px;line-height:1.35;font-weight:900;}
    .gd-style-map-modal-close-00705{flex:0 0 auto;width:44px;height:44px;border-radius:999px;border:1px solid rgba(248,250,252,.22);background:rgba(15,23,42,.78);color:#ffffff;font-size:30px;font-weight:900;line-height:1;cursor:pointer;}
    .gd-style-map-modal-close-00705:hover{border-color:rgba(248,113,113,.70);background:rgba(239,68,68,.18);}
    .gd-style-map-modal-body-00705{padding:22px 26px;}
    .gd-style-map-modal-summary-00705{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px;}
    .gd-style-map-modal-explain-00706{border:1px solid rgba(250,204,21,.28);border-radius:18px;background:linear-gradient(135deg,rgba(250,204,21,.10),rgba(56,189,248,.07));padding:14px 15px;margin-bottom:16px;}
    .gd-style-map-modal-explain-00706 b{display:block;color:#fef08a;font-size:13px;font-weight:1000;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;}
    .gd-style-map-modal-explain-00706 p{margin:0;color:#dbeafe;font-size:14px;line-height:1.5;font-weight:800;}
    .gd-style-map-modal-summary-00705 div{border:1px solid rgba(56,189,248,.18);border-radius:18px;background:rgba(2,6,23,.44);padding:13px;}
    .gd-style-map-modal-summary-00705 b{display:block;color:#fef08a;font-size:12px;font-weight:1000;text-transform:uppercase;letter-spacing:.09em;margin-bottom:7px;}
    .gd-style-map-modal-summary-00705 strong{display:block;color:#f8fafc;font-size:22px;font-weight:1000;line-height:1.12;}
    .gd-style-map-modal-details-00705 .gd-style-row-details-00705{display:block !important;border-color:rgba(56,189,248,.25);background:rgba(2,6,23,.28);}
    .gd-style-map-modal-details-00705 .gd-style-row-details-grid-00705{grid-template-columns:repeat(4,minmax(0,1fr));}
    .gd-style-map-modal-details-00705 .gd-style-props{display:flex;gap:9px;flex-wrap:wrap;padding:15px;border:1px solid rgba(56,189,248,.22);border-radius:18px;background:rgba(2,6,23,.44);}
    .gd-style-map-modal-details-00705 .gd-style-props span{font-size:14px;padding:8px 10px;border-color:rgba(56,189,248,.32);background:rgba(56,189,248,.11);color:#e0f2fe;}
    .gd-style-map-modal-details-00705 .gd-style-row-details-grid-00705 b,.gd-style-map-modal-details-00705 .gd-style-row-details-section-00705>b,.gd-style-map-modal-details-00705 .gd-style-row-details-text-00705>b{font-size:13px;color:#facc15;}
    .gd-style-map-modal-details-00705 .gd-style-row-details-grid-00705 span,.gd-style-map-modal-details-00705 .gd-style-row-details-text-00705 p{font-size:16px;color:#f8fafc;}
    .gd-style-map-modal-details-00705 .gd-style-detail-chip-00705,.gd-style-map-modal-details-00705 .gd-style-detail-empty-00705{font-size:14px;padding:7px 11px;border-radius:14px;color:#e0f2fe;}
    .gd-style-map-modal-foot-00705{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 26px 24px;border-top:1px solid rgba(56,189,248,.18);background:rgba(2,6,23,.38);}
    .gd-style-map-modal-foot-00705 p{margin:0;color:#cbd5e1;font-size:13px;line-height:1.45;font-weight:750;}
    .gd-style-map-modal-actions-00705{display:flex;gap:10px;flex:0 0 auto;}
    .gd-style-map-modal-actions-00705 button{border:1px solid rgba(56,189,248,.38);border-radius:14px;background:rgba(14,165,233,.16);color:#f8fafc;font-size:13px;font-weight:1000;padding:11px 14px;cursor:pointer;}
    .gd-style-map-modal-actions-00705 button:hover{border-color:rgba(250,204,21,.70);background:rgba(250,204,21,.15);color:#fef9c3;}
    @media (max-width:760px){.gd-style-map-modal-summary-00705,.gd-style-map-modal-details-00705 .gd-style-row-details-grid-00705{grid-template-columns:1fr;}.gd-style-map-modal-foot-00705{flex-direction:column;align-items:stretch;}.gd-style-map-modal-actions-00705{justify-content:flex-end;}}

    .gd-chip--warn{border-color:rgba(251,146,60,.34);background:rgba(249,115,22,.13);color:#fed7aa;}
    .gd-style-map-flash-00696,.gd-style-canvas-focus-00697{outline:3px solid rgba(250,204,21,.95) !important;box-shadow:0 0 0 6px rgba(250,204,21,.18),0 18px 48px rgba(250,204,21,.22) !important;}
    .gd-style-map-filter-highlight-00704{outline:3px solid rgba(250,204,21,.92) !important;outline-offset:2px !important;box-shadow:0 0 0 7px rgba(250,204,21,.16),0 16px 46px rgba(250,204,21,.22) !important;position:relative;z-index:12;}
    .gd-style-map-filter-highlight-00704::after{content:attr(data-gd-style-map-filter-label-00704);position:absolute;left:8px;top:8px;z-index:2147483001;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid rgba(250,204,21,.78);background:rgba(15,23,42,.92);color:#fef9c3;border-radius:999px;padding:3px 8px;font:900 10px/1.2 Inter,Manrope,Arial,sans-serif;letter-spacing:.03em;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.34);}
    .gd-style-map-filter-highlight--design-00704{outline-color:rgba(251,191,36,.98) !important;box-shadow:0 0 0 8px rgba(251,191,36,.18),0 18px 50px rgba(249,115,22,.24) !important;}
    .gd-style-map-filter-highlight--global-00704{outline-color:rgba(56,189,248,.96) !important;box-shadow:0 0 0 8px rgba(56,189,248,.14),0 18px 50px rgba(14,165,233,.20) !important;}
    .gd-style-map-filter-highlight--ai-00704{outline-color:rgba(192,132,252,.96) !important;box-shadow:0 0 0 8px rgba(192,132,252,.14),0 18px 50px rgba(168,85,247,.20) !important;}
    .gd-status{font-size:11px;color:#93c5fd;line-height:1.4;white-space:pre-wrap;}
    .gd-theme.is-preview{outline:2px solid rgba(250,204,21,.86);box-shadow:0 0 0 4px rgba(250,204,21,.14),0 18px 46px rgba(250,204,21,.18);}
    .gd-theme.is-preview:not(.is-active){background:rgba(250,204,21,.10);border-color:rgba(250,204,21,.58);}
    .gd-reset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
    .gd-reset-btn{border:1px solid rgba(56,189,248,.28);border-radius:14px;background:rgba(14,165,233,.12);color:#e0f2fe;font-size:11px;font-weight:1000;padding:10px 9px;cursor:pointer;text-align:left;}
    .gd-reset-btn:hover{border-color:rgba(103,232,249,.72);background:rgba(14,165,233,.20);color:#f8fafc;}
    .gd-reset-btn--danger{border-color:rgba(251,146,60,.38);background:rgba(249,115,22,.13);color:#fed7aa;}
    .gd-reset-btn--danger:hover{border-color:rgba(251,146,60,.78);background:rgba(249,115,22,.22);}
    .gd-typo-presets{display:grid;grid-template-columns:1fr;gap:8px;max-height:360px;overflow:auto;padding-right:4px;}
    .gd-typo-presets::-webkit-scrollbar{width:7px;}
    .gd-typo-presets::-webkit-scrollbar-thumb{background:rgba(56,189,248,.34);border-radius:999px;}
    .gd-typo-preset{display:grid;grid-template-columns:minmax(0,1fr) 58px;align-items:center;gap:10px;border:1px solid rgba(148,163,184,.17);border-radius:16px;background:rgba(2,6,23,.28);padding:10px;cursor:pointer;text-align:left;color:inherit;}
    .gd-typo-preset:hover{border-color:rgba(56,189,248,.45);box-shadow:0 0 0 3px rgba(56,189,248,.08);}
    .gd-typo-preset.is-active{border-color:rgba(34,211,238,.72);box-shadow:0 0 0 3px rgba(34,211,238,.12),0 16px 34px rgba(34,211,238,.12);}
    .gd-typo-preset em{font-style:normal;font-size:10px;color:#8ea0b8;text-transform:uppercase;letter-spacing:.08em;}
    .gd-typo-preset strong{display:block;font-size:13px;color:#f8fafc;font-weight:1000;}
    .gd-typo-preset p{margin:4px 0 0;font-size:11px;line-height:1.3;color:#aebbd0;}
    .gd-typo-demo{width:54px;height:42px;border-radius:14px;border:1px solid rgba(56,189,248,.24);background:rgba(14,165,233,.10);color:#e0f2fe;display:flex;align-items:center;justify-content:center;font-size:25px;line-height:1;}
    .gd-card__head{cursor:default;}
  `;
  document.head.appendChild(style);
}

function ensureTooltip_() {
  let tip = document.getElementById('gdSwatchTooltip00687');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'gdSwatchTooltip00687';
    tip.className = 'gd-tooltip-00687';
    tip.hidden = true;
    document.body.appendChild(tip);
  }
  return tip;
}
function hideTooltip_() {
  const tip = document.getElementById('gdSwatchTooltip00687');
  if (tip) tip.hidden = true;
  if (window.__GD_SWATCH_TIP_TIMER_00687__) {
    clearTimeout(window.__GD_SWATCH_TIP_TIMER_00687__);
    window.__GD_SWATCH_TIP_TIMER_00687__ = null;
  }
}
function showBigTooltip_(el, title, text, extra = '') {
  hideTooltip_();
  if (!el) return;
  window.__GD_SWATCH_TIP_TIMER_00687__ = setTimeout(() => {
    const tip = ensureTooltip_();
    tip.innerHTML = `${esc(title || 'ПІДКАЗКА')}<small>${esc(text || '')}${extra ? `<br>${esc(extra)}` : ''}</small>`;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const w = 220;
    const x = Math.max(w, Math.min(window.innerWidth - w, r.left + r.width / 2));
    const y = Math.max(110, r.top - 18);
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    try { window.__ST_PERF_DIAG__?.push?.('global-design-big-tooltip-show-00688', { title: String(title || ''), extra: String(extra || '') }, 'info'); } catch (_) {}
  }, 1000);
}
function showTooltipForSwatch_(el) {
  if (!el) return;
  const role = el.getAttribute('data-role-label') || '';
  const text = el.getAttribute('data-tip') || '';
  const color = el.getAttribute('data-color') || '';
  showBigTooltip_(el, role, text, color);
}

function fieldValue_(resolved, field) {
  const norm = normalizeResolvedForControls_(resolved);
  let v = getByPath(norm, field.path);
  if (v == null || v === '') v = field.fallback;
  if (field.type === 'range') return String(pxNumber_(v, pxNumber_(field.fallback, Number(field.min || 0))));
  if (field.type === 'shadowRange') return String(shadowLevelFrom_(v, Number(field.fallback || 35)));
  if (field.type === 'color') return safeHex_(v, field.fallback || '#000000');
  return String(v ?? '');
}
function manualValueForField_(resolved, field) {
  const norm = normalizeResolvedForControls_(resolved);
  let v = getByPath(norm, field.path);
  if (v == null || v === '') v = field.fallback || '';
  return String(v ?? '');
}
function renderManualLine_(attrs, value, kind) {
  const help = FORMAT_HELP[kind] || FORMAT_HELP.text;
  return `<span class="gd-manual-line" ${attrs}><input type="text" value="${esc(value || '')}" placeholder="Ввести вручну текстом"><button class="gd-format-help" type="button" data-gd-format-help="${esc(kind)}" data-tip="${esc(help)}" aria-label="Підказка формату">?</button></span>`;
}
function renderField_(field) {
  const inputId = `gd_${String(field.path).replace(/[^a-z0-9]+/gi, '_')}`;
  const common = `id="${esc(inputId)}" data-gd-control="1" data-gd-path="${esc(field.path)}" data-gd-type="${esc(field.type)}"`;
  const kind = helpKindForField_(field);
  const manualAttrs = `data-gd-manual-wrap="1" data-gd-manual-path="${esc(field.path)}" data-gd-manual-kind="${esc(kind)}"`;
  const dot = `<button class="gd-manual-dot" type="button" data-gd-manual-toggle="${esc(field.path)}" aria-label="Ввести значення вручну текстом"></button>`;
  if (field.type === 'range' || field.type === 'shadowRange') {
    return `<label class="gd-field gd-field--${esc(field.type)}"><b title="${esc(field.help || field.label)}">${esc(field.label)}</b><small>${esc(field.help || '')}</small><span class="gd-range-line"><input type="range" ${common} min="${esc(field.min ?? 0)}" max="${esc(field.max ?? 100)}" step="${esc(field.step ?? 1)}" data-gd-unit="${esc(field.unit || '')}"><span class="gd-range-value" data-gd-value-for="${esc(field.path)}"></span>${dot}</span>${field.type === 'shadowRange' ? `<span class="gd-shadow-preview" data-gd-shadow-preview="${esc(field.path)}"></span>` : ''}${renderManualLine_(manualAttrs, field.fallback || '', kind)}</label>`;
  }
  if (field.type === 'color') {
    return `<label class="gd-field gd-field--color"><b title="${esc(field.help || field.label)}">${esc(field.label)}</b><small>${esc(field.help || '')}</small><span class="gd-control-row"><input type="color" ${common}>${dot}</span>${renderManualLine_(manualAttrs, field.fallback || '', kind)}</label>`;
  }
  return `<label class="gd-field gd-field--text"><b title="${esc(field.help || field.label)}">${esc(field.label)}</b><small>${esc(field.help || '')}</small><span class="gd-control-row"><input type="text" ${common} placeholder="${esc(field.placeholder || '')}"><button class="gd-format-help" type="button" data-gd-format-help="${esc(kind)}" data-tip="${esc(FORMAT_HELP[kind] || FORMAT_HELP.text)}" aria-label="Підказка формату">?</button></span></label>`;
}
function renderQuickColor_(k, colors) {
  const label = QUICK_COLOR_LABELS[k] || k;
  const help = QUICK_COLOR_HELP[k] || '';
  const value = safeHex_(colors[k], '#000000');
  return `<label class="gd-field gd-field--color"><b title="${esc(help || label)}">${esc(label)}</b><small>${esc(help)}</small><span class="gd-control-row"><input type="color" data-gd-color="${esc(k)}" value="${esc(value)}"><button class="gd-manual-dot" type="button" data-gd-manual-color-toggle="${esc(k)}" aria-label="Ввести колір вручну текстом"></button></span>${renderManualLine_(`data-gd-manual-color-wrap="${esc(k)}" data-gd-manual-kind="color"`, colors[k] || value, 'color')}</label>`;
}
function renderAdvanced_() {
  return ADVANCED_GROUPS.map((group) => `
    <div class="gd-section-title">${esc(group.title)}</div>
    <div class="gd-grid2">
      ${group.fields.map(renderField_).join('')}
    </div>
  `).join('');
}

// [00692] Footer-specific controls use the same field renderer and the same
// StyleStore patch pipeline as Header/global controls. 00690 added the Footer
// accordion but missed this renderer, so initGlobalDesignPanel crashed and the
// inspector stayed empty.
function renderFooterAdvanced_() {
  return FOOTER_GROUPS.map((group) => `
    <div class="gd-section-title">${esc(group.title)}</div>
    <div class="gd-grid2">
      ${group.fields.map(renderField_).join('')}
    </div>
  `).join('');
}


function activeTypographyPresetId_(st) {
  const src = String(st?.activeSource || 'global');
  return String(st?.[src]?.typographyPresetId || st?.global?.typographyPresetId || 'typo-modern-saas');
}
function renderTypographyPresets00698_(st) {
  const active = activeTypographyPresetId_(st || GlobalStyleStore.read());
  return `<div class="gd-typo-presets" data-gd-typo-presets="1">
    ${ST_GLOBAL_TYPOGRAPHY_PRESETS.map((p) => {
      const t = p.typography || {};
      const on = String(p.id) === String(active);
      return `<button class="gd-typo-preset ${on ? 'is-active' : ''}" type="button" data-gd-typo-preset="${esc(p.id)}" aria-current="${on ? 'true' : 'false'}">
        <span><em>${esc(p.group || 'Типографіка')}</em><strong>${esc(p.name || p.id)}</strong><p>${esc(p.description || '')}</p></span>
        <span class="gd-typo-demo" style="font-family:${esc(t.headingFont || t.font || 'Inter, Arial, sans-serif')};font-weight:${esc(t.headingWeight || '900')};letter-spacing:${esc(t.headingLetterSpacing || '0px')};">Aa</span>
      </button>`;
    }).join('')}
  </div>`;
}
function renderTypographyAdvanced_() {
  return TYPOGRAPHY_GROUPS.map((group) => `
    <div class="gd-section-title">${esc(group.title)}</div>
    <div class="gd-grid2">
      ${group.fields.map(renderField_).join('')}
    </div>
  `).join('');
}

function activeSpacingPresetId_(st) {
  const src = String(st?.activeSource || 'global');
  return String(st?.[src]?.spacing?.densityPresetId || st?.global?.spacing?.densityPresetId || 'density-standard');
}
function renderSpacingPresets00699_(st) {
  const active = activeSpacingPresetId_(st || GlobalStyleStore.read());
  return `<div class="gd-density-presets" data-gd-density-presets="1">
    ${ST_GLOBAL_SPACING_PRESETS.map((p) => {
      const on = String(p.id) === String(active);
      return `<button class="gd-density-preset ${on ? 'is-active' : ''}" type="button" data-gd-spacing-preset="${esc(p.id)}" aria-current="${on ? 'true' : 'false'}">
        <em>${esc(p.group || 'Щільність')}</em><strong>${esc(p.name || p.id)}</strong><p>${esc(p.description || '')}</p>
      </button>`;
    }).join('')}
  </div>`;
}
function renderSpacingAdvanced_() {
  return SPACING_GROUPS.map((group) => `
    <div class="gd-section-title">${esc(group.title)}</div>
    <div class="gd-grid2">
      ${group.fields.map(renderField_).join('')}
    </div>
  `).join('');
}
function renderStructuralAdvanced00700_() {
  return STRUCTURAL_STYLE_GROUPS.map((group) => `
    <div class="gd-section-title">${esc(group.title)}</div>
    <div class="gd-grid2">
      ${group.fields.map(renderField_).join('')}
    </div>
  `).join('');
}
function renderActionAdvanced00701_() {
  return ACTION_STYLE_GROUPS.map((group) => `
    <div class="gd-section-title">${esc(group.title)}</div>
    <div class="gd-grid2">
      ${group.fields.map(renderField_).join('')}
    </div>
  `).join('');
}
function applySpacingPreset00699_(presetId) {
  const preset = getGlobalSpacingPresetById(presetId);
  if (!preset) return;
  const st = GlobalStyleStore.read();
  const src = st.activeSource || 'global';
  GlobalStyleStore.patch(src, { spacing: preset.spacing || {} }, `global-design-spacing-preset-${preset.id}-00699`);
  syncPanelFromStore_({ forceColorInputs: true, focusSpacingId: preset.id });
  log00687_('global-design-spacing-preset-00699', { source: src, presetId: preset.id });
}
function applyTypographyPreset00698_(presetId) {
  const preset = getGlobalTypographyPresetById(presetId);
  if (!preset) return;
  const st = GlobalStyleStore.read();
  const src = st.activeSource || 'global';
  GlobalStyleStore.patch(src, { typographyPresetId: preset.id, typography: preset.typography || {} }, `global-design-typography-preset-${preset.id}-00698`);
  syncPanelFromStore_({ forceColorInputs: true, focusTypographyId: preset.id });
  log00687_('global-design-typography-preset-00698', { source: src, presetId: preset.id });
}

function patchForColor_(sourceStyle, colorKey, value) {
  const src = normalizeResolvedForControls_(sourceStyle || {});
  const c = src.colors || {};
  const nextColors = Object.assign({}, c, { [colorKey]: value });
  const primary = nextColors.primary || '#2563eb';
  const accent = nextColors.accent || '#0ea5e9';
  const border = nextColors.border || '#e2e8f0';
  const patch = { colors: { [colorKey]: value } };
  if (colorKey === 'primary' || colorKey === 'accent') {
    patch.buttons = {
      fill: gradientFromColors_(primary, accent),
      borderColor: accent,
      borderWidth: src.buttons?.borderWidth || '1px',
      border: `${src.buttons?.borderWidth || '1px'} solid ${accent}`,
      hoverFill: accent,
      hoverBorder: accent
    };
  }
  if (colorKey === 'surface') {
    patch.sections = { bg: value, altBg: src.colors?.surface2 || src.sections?.altBg || value };
    patch.blocks = { bg: value, borderColor: src.blocks?.borderColor || border, borderWidth: src.blocks?.borderWidth || '1px', border: `${src.blocks?.borderWidth || '1px'} solid ${src.blocks?.borderColor || border}` };
  }
  if (colorKey === 'surface2') patch.sections = { altBg: value };
  if (colorKey === 'text') patch.typography = Object.assign({}, src.typography || {}, { headingColor: value, textColor: value });
  if (colorKey === 'border') {
    patch.blocks = { borderColor: value, borderWidth: src.blocks?.borderWidth || '1px', border: `${src.blocks?.borderWidth || '1px'} solid ${value}` };
  }
  return patch;
}
function patchForControl_(sourceStyle, path, type, rawValue) {
  const src = normalizeResolvedForControls_(sourceStyle || {});
  const patch = {};
  let value = rawValue;
  if (type === 'range') {
    const meta = allFields_().find((f) => f.path === path) || {};
    value = meta.unit ? `${rawValue}${meta.unit}` : String(rawValue);
  }
  if (type === 'shadowRange') {
    value = shadowCssFromLevel_(rawValue, path === 'shadow.md' || path === 'blocks.hoverShadow' || path === 'buttons.hoverShadow');
  }
  setByPath(patch, path, value);
  if (path === 'buttons.primaryBg') {
    patch.buttons = Object.assign({}, patch.buttons || {}, { fill: value });
  }
  if (path === 'buttons.primaryText') {
    patch.buttons = Object.assign({}, patch.buttons || {}, { text: value });
  }
  if (path === 'buttons.primaryBorderColor' || path === 'buttons.primaryBorderWidth') {
    const color = path === 'buttons.primaryBorderColor' ? value : (src.buttons?.primaryBorderColor || src.buttons?.borderColor || src.colors?.accent || '#0ea5e9');
    const width = path === 'buttons.primaryBorderWidth' ? value : (src.buttons?.primaryBorderWidth || src.buttons?.borderWidth || '1px');
    patch.buttons = Object.assign({}, patch.buttons || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${color}`, primaryBorderColor: color, primaryBorderWidth: width, primaryBorder: `${width} solid ${color}` });
  }
  if (path === 'buttons.borderColor' || path === 'buttons.borderWidth') {
    const color = path === 'buttons.borderColor' ? value : (src.buttons?.borderColor || borderColorFrom_(src.buttons?.border, src.colors?.accent || '#0ea5e9'));
    const width = path === 'buttons.borderWidth' ? value : (src.buttons?.borderWidth || borderWidthFrom_(src.buttons?.border, '1px'));
    patch.buttons = Object.assign({}, patch.buttons || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${color}` });
  }
  if (path === 'sections.borderColor' || path === 'sections.borderWidth') {
    const color = path === 'sections.borderColor' ? value : (src.sections?.borderColor || borderColorFrom_(src.sections?.border, src.colors?.border || '#e2e8f0'));
    const width = path === 'sections.borderWidth' ? value : (src.sections?.borderWidth || borderWidthFrom_(src.sections?.border, '0px'));
    patch.sections = Object.assign({}, patch.sections || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${width === '0px' ? 'transparent' : color}` });
  }
  if (path === 'containers.borderColor' || path === 'containers.borderWidth') {
    const color = path === 'containers.borderColor' ? value : (src.containers?.borderColor || borderColorFrom_(src.containers?.border, src.colors?.border || '#e2e8f0'));
    const width = path === 'containers.borderWidth' ? value : (src.containers?.borderWidth || borderWidthFrom_(src.containers?.border, '0px'));
    patch.containers = Object.assign({}, patch.containers || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${width === '0px' ? 'transparent' : color}` });
  }
  if (path === 'blocks.borderColor' || path === 'blocks.borderWidth') {
    const color = path === 'blocks.borderColor' ? value : (src.blocks?.borderColor || borderColorFrom_(src.blocks?.border, src.colors?.border || '#e2e8f0'));
    const width = path === 'blocks.borderWidth' ? value : (src.blocks?.borderWidth || borderWidthFrom_(src.blocks?.border, '1px'));
    patch.blocks = Object.assign({}, patch.blocks || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${width === '0px' ? 'transparent' : color}` });
  }
  if (path === 'footer.borderColor' || path === 'footer.borderWidth') {
    const color = path === 'footer.borderColor' ? value : (src.footer?.borderColor || borderColorFrom_(src.footer?.border, src.blocks?.borderColor || src.colors?.border || '#e2e8f0'));
    const width = path === 'footer.borderWidth' ? value : (src.footer?.borderWidth || borderWidthFrom_(src.footer?.border, '1px'));
    patch.footer = Object.assign({}, patch.footer || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${color}` });
  }
  if (path === 'buttons.shadow') {
    patch.shadow = Object.assign({}, patch.shadow || {}, { soft: value });
  }
  return patch;
}

function syncPanelFromStore_(opts = {}) {
  const root = document.getElementById('global-design-panel');
  if (!root) return;
  const st = GlobalStyleStore.read();
  const resolved = normalizeResolvedForControls_(GlobalStyleStore.resolve(st));
  const colors = resolved.colors || {};
  const activePreset = activePresetId_(st);

  root.querySelectorAll('input[name="gdSource"]').forEach((input) => { try { input.checked = String(input.value) === String(st.activeSource); } catch (_) {} });
  root.querySelectorAll('[data-gd-preset]').forEach((btn) => {
    const on = String(btn.getAttribute('data-gd-preset') || '') === String(activePreset);
    try { btn.classList.toggle('is-active', on); } catch (_) {}
    try { btn.setAttribute('aria-current', on ? 'true' : 'false'); } catch (_) {}
  });
  const activeTypography = activeTypographyPresetId_(st);
  root.querySelectorAll('[data-gd-typo-preset]').forEach((btn) => {
    const on = String(btn.getAttribute('data-gd-typo-preset') || '') === String(activeTypography);
    try { btn.classList.toggle('is-active', on); } catch (_) {}
    try { btn.setAttribute('aria-current', on ? 'true' : 'false'); } catch (_) {}
  });
  const activeSpacing = activeSpacingPresetId_(st);
  root.querySelectorAll('[data-gd-spacing-preset]').forEach((btn) => {
    const on = String(btn.getAttribute('data-gd-spacing-preset') || '') === String(activeSpacing);
    try { btn.classList.toggle('is-active', on); } catch (_) {}
    try { btn.setAttribute('aria-current', on ? 'true' : 'false'); } catch (_) {}
  });
  root.querySelectorAll('input[data-gd-color]').forEach((input) => {
    const key = input.getAttribute('data-gd-color') || '';
    const next = safeHex_(colors[key], input.value || '#000000');
    if (opts.forceColorInputs || document.activeElement !== input) { try { input.value = next; } catch (_) {} }
  });
  root.querySelectorAll('[data-gd-control="1"]').forEach((input) => {
    const path = input.getAttribute('data-gd-path') || '';
    const type = input.getAttribute('data-gd-type') || '';
    const next = fieldValue_(resolved, { path, type, fallback: input.value || '' });
    if (opts.forceColorInputs || document.activeElement !== input) { try { input.value = next; } catch (_) {} }
    const valueEl = root.querySelector(`[data-gd-value-for="${CSS.escape(path)}"]`);
    if (valueEl) valueEl.textContent = type === 'shadowRange' ? `${input.value}%` : `${input.value}${input.getAttribute('data-gd-unit') || ''}`;
    const preview = root.querySelector(`[data-gd-shadow-preview="${CSS.escape(path)}"]`);
    if (preview) preview.style.boxShadow = shadowCssFromLevel_(input.value, path === 'shadow.md' || path === 'blocks.hoverShadow' || path === 'buttons.hoverShadow');
  });
  root.querySelectorAll('[data-gd-manual-color-wrap]').forEach((wrap) => {
    const key = wrap.getAttribute('data-gd-manual-color-wrap') || '';
    const input = wrap.querySelector('input');
    if (!input) return;
    const next = colors[key] || input.value || '';
    if (opts.forceColorInputs || document.activeElement !== input) input.value = next;
  });
  root.querySelectorAll('[data-gd-manual-path]').forEach((wrap) => {
    const path = wrap.getAttribute('data-gd-manual-path') || '';
    const kind = wrap.getAttribute('data-gd-manual-kind') || 'text';
    const input = wrap.querySelector('input');
    if (!input) return;
    const field = allFields_().find((f) => f.path === path) || { path, type: kind };
    const next = manualValueForField_(resolved, field);
    if (opts.forceColorInputs || document.activeElement !== input) input.value = next;
  });
  const headSmall = root.querySelector('[data-gd-source-card] .gd-card__head small');
  if (headSmall) headSmall.textContent = sourceLabel_(st.activeSource);
  const status = root.querySelector('#gdStatus00684');
  if (status) status.textContent = statusText_(st, resolved);
  const resetNote = root.querySelector('[data-gd-selected-reset-note]');
  if (resetNote) resetNote.textContent = selectedElementSummary00695_();
  refreshStyleOverview00693_(root, st, resolved);
  try { requestAnimationFrame(() => gdApplyStyleMapDomFilters00703_()); } catch (_) { try { gdApplyStyleMapDomFilters00703_(); } catch (__) {} }
  if (opts.focusSelectedStyleMap || opts.focusStyleMapId || gdPendingMapFocusId00697_) {
    if (opts.focusStyleMapId) gdRequestStyleMapFocus00697_(opts.focusStyleMapId, opts.focusReason || 'explicit');
    gdFocusSelectedMapRowAfterRender00697_(opts.focusReason || 'selection');
  }

  const focusPresetId = opts.focusPresetId ? String(opts.focusPresetId) : '';
  if (focusPresetId) {
    const btn = root.querySelector(`[data-gd-preset="${CSS.escape(focusPresetId)}"]`);
    if (btn) requestAnimationFrame(() => {
      try { btn.focus({ preventScroll: true }); } catch (_) { try { btn.focus(); } catch (__) {} }
      try { btn.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_) {}
    });
  }
}

function log00687_(event, detail = {}, level = 'info') {
  try { window.__ST_PERF_DIAG__?.push?.(event, Object.assign({ widget: 'global-design' }, detail || {}), level); } catch (_) {}
  try { console.info('[00687][global-design]', event, detail || {}); } catch (_) {}
}

// [00702] Lightweight diagnostics and UI sync for color/range dragging.
// The heavy full panel sync is reserved for final change/commit, not every input tick.
let gdColorLastLogAt00702_ = 0;
let gdColorLiveCount00702_ = 0;
function perfNow00702_() { try { return performance.now(); } catch (_) { return Date.now(); } }
function logColorPerf00702_(event, detail = {}, level = 'info') {
  try { window.__ST_PERF_DIAG__?.push?.(event, Object.assign({ widget: 'global-design-color', fix: '00702' }, detail || {}), level); } catch (_) {}
  try {
    if (level === 'warn') console.warn('[00702][global-design-color]', event, detail || {});
    else console.info('[00702][global-design-color]', event, detail || {});
  } catch (_) {}
}
function logColorLiveSample00702_(detail = {}, durationMs = 0) {
  gdColorLiveCount00702_ += 1;
  const nowMs = perfNow00702_();
  if (durationMs > 24 || nowMs - gdColorLastLogAt00702_ > 650) {
    gdColorLastLogAt00702_ = nowMs;
    logColorPerf00702_('global-design-color-live-sample-00702', Object.assign({ burst: gdColorLiveCount00702_, durationMs }, detail || {}), durationMs > 40 ? 'warn' : 'info');
    gdColorLiveCount00702_ = 0;
  }
}
function syncLiveFieldUi00702_(input) {
  if (!input) return;
  const root = document.getElementById('global-design-panel');
  if (!root) return;
  const path = input.getAttribute?.('data-gd-path') || input.closest?.('[data-gd-manual-path]')?.getAttribute?.('data-gd-manual-path') || '';
  const type = input.getAttribute?.('data-gd-type') || '';
  if (path) {
    const valueEl = root.querySelector(`[data-gd-value-for="${CSS.escape(path)}"]`);
    if (valueEl) valueEl.textContent = type === 'shadowRange' ? `${input.value}%` : `${input.value}${input.getAttribute('data-gd-unit') || ''}`;
    const preview = root.querySelector(`[data-gd-shadow-preview="${CSS.escape(path)}"]`);
    if (preview) preview.style.boxShadow = shadowCssFromLevel_(input.value, path === 'shadow.md' || path === 'blocks.hoverShadow' || path === 'buttons.hoverShadow');
  }
}
function patchStoreFast00702_(src, patch, reason, live) {
  if (live && typeof GlobalStyleStore.patchLive === 'function') return GlobalStyleStore.patchLive(src, patch, reason);
  return GlobalStyleStore.patch(src, patch, reason);
}

function renderPanel_() {
  const root = document.getElementById('global-design-panel');
  if (!root) return;
  const st = GlobalStyleStore.read();
  const resolved = normalizeResolvedForControls_(GlobalStyleStore.resolve(st));
  const colors = resolved.colors || {};
  const activePreset = activePresetId_(st);
  const ui = (() => { try { return JSON.parse(localStorage.getItem('st_global_design_ui_00687') || '{}'); } catch (_) { return {}; } })();
  const sourceClosed = ui.sourceClosed === true;
  const styleMapClosed = ui.styleMapClosed === true;
  const resetClosed = ui.resetClosed === true;
  const themesClosed = ui.themesClosed === true;
  const typographyClosed = ui.typographyClosed === true;
  const spacingClosed = ui.spacingClosed === true;
  const structuralClosed = ui.structuralClosed === true;
  const actionClosed = ui.actionClosed === true;
  const quickClosed = ui.quickClosed === true;
  const advancedClosed = ui.advancedClosed === true;
  const footerClosed = ui.footerClosed === true;
  const statusClosed = ui.statusClosed === true;
  root.innerHTML = `
    ${renderSourceBanner00693_(st, resolved)}
    ${renderStyleMap00693_(st, resolved)}

    <div class="gd-card ${sourceClosed ? 'is-closed' : ''}" data-gd-source-card="1" data-gd-accordion="source">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="source" aria-label="Відкрити або закрити джерело стилю">${sourceClosed ? '▸' : '▾'}</button><span>Джерело стилю</span></span><small>${esc(sourceLabel_(st.activeSource))}</small></div>
      <div class="gd-card__body">
        <div class="gd-note">Дизайн / AI дизайн / Глобальний дизайн пишуть у <b>StyleStore</b>. Сайт малюється тільки з активного джерела через CSS variables. Контент, фото і текст не змінюються.</div>
        <div class="gd-source-row" data-gd-source-row>
          ${['global','ai','design'].map((src) => `
            <label class="gd-radio">
              <span><input type="radio" name="gdSource" value="${src}" ${st.activeSource === src ? 'checked' : ''}> ${esc(sourceLabel_(src))}<small>${src === 'global' ? 'Готові теми і глобальні токени' : src === 'ai' ? 'Останні AI-стилі у памʼяті' : 'Ручні стилі з віджета Дизайн'}</small></span>
            </label>`).join('')}
        </div>
      </div>
    </div>

    ${renderResetControls00695_()}

    <div class="gd-card gd-card--themes ${themesClosed ? 'is-closed' : ''}" data-gd-accordion="themes">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="themes" aria-label="Відкрити або закрити готові теми">${themesClosed ? '▸' : '▾'}</button><span>Готові теми</span></span><small>${ST_GLOBAL_DESIGN_PRESETS.length}</small></div>
      <div class="gd-card__body">
        <div class="gd-themes">
          ${ST_GLOBAL_DESIGN_PRESETS.map((p) => {
            const c = p.colors || {};
            const isActive = String(p.id) === String(activePreset);
            return `<button class="gd-theme ${isActive ? 'is-active' : ''}" type="button" data-gd-preset="${esc(p.id)}" aria-current="${isActive ? 'true' : 'false'}">
              <span><em>${esc(presetGroupUa_(p))}</em><strong>${esc(presetNameUa_(p))}</strong><p>${esc(p.description || '')}</p></span>
              <span class="gd-swatches">
                ${['primary','accent','surface','text','border'].map((k) => {
                  const meta = COLOR_META[k] || { label: k, help: k };
                  const color = c[k] || '#fff';
                  return `<i class="gd-swatch" data-role="${esc(k)}" data-role-label="${esc(meta.label)}" data-color="${esc(color)}" data-tip="${esc(meta.help)}" aria-label="${esc(meta.label)}" style="background:${esc(color)}"></i>`;
                }).join('')}
              </span>
            </button>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="gd-card gd-card--typography ${typographyClosed ? 'is-closed' : ''}" data-gd-accordion="typography">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="typography" aria-label="Відкрити або закрити типографіку">${typographyClosed ? '▸' : '▾'}</button><span>Типографіка</span></span><small>${ST_GLOBAL_TYPOGRAPHY_PRESETS.length} шаблонів</small></div>
      <div class="gd-card__body">
        <div class="gd-note">Типографіка змінює тільки стиль тексту: шрифти, розміри, товщину, висоту рядка і відстань між літерами. Текст і фото не змінюються.</div>
        ${renderTypographyPresets00698_(st)}
        ${renderTypographyAdvanced_()}
      </div>
    </div>



    <div class="gd-card gd-card--spacing ${spacingClosed ? 'is-closed' : ''}" data-gd-accordion="spacing">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="spacing" aria-label="Відкрити або закрити відступи і щільність">${spacingClosed ? '▸' : '▾'}</button><span>Відступи / щільність</span></span><small>${ST_GLOBAL_SPACING_PRESETS.length} пресети</small></div>
      <div class="gd-card__body">
        <div class="gd-note">Цей блок змінює тільки глобальні відступи і проміжки: padding секцій, контейнерів, блоків та gap між рівнями, контейнерами, блоками і пунктами меню. Контент і структура не змінюються.</div>
        ${renderSpacingPresets00699_(st)}
        ${renderSpacingAdvanced_()}
      </div>
    </div>

    <div class="gd-card gd-card--structural ${structuralClosed ? 'is-closed' : ''}" data-gd-accordion="structural">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="structural" aria-label="Відкрити або закрити стилі секцій, контейнерів і блоків">${structuralClosed ? '▸' : '▾'}</button><span>Секції / контейнери / блоки</span></span><small>00700 tokens</small></div>
      <div class="gd-card__body">
        <div class="gd-note">Цей блок керує глобальними стилями обгорток: фон, альтернативний фон, рамка, радіус, тінь, hover-тінь, hover-підйом, overlay, min-height і max-width. Контент, фото, текст і структура не змінюються.</div>
        ${renderStructuralAdvanced00700_()}
      </div>
    </div>


    <div class="gd-card gd-card--actions ${actionClosed ? 'is-closed' : ''}" data-gd-accordion="action">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="action" aria-label="Відкрити або закрити стилі кнопок, меню і посилань">${actionClosed ? '▸' : '▾'}</button><span>Кнопки / меню / посилання</span></span><small>00701 tokens</small></div>
      <div class="gd-card__body">
        <div class="gd-note">Цей блок керує тільки інтерактивними стилями: Primary / Secondary / Ghost / Icon button, hover / active / disabled, меню, burger/mobile menu і звичайні посилання. Контент і структура не змінюються.</div>
        ${renderActionAdvanced00701_()}
      </div>
    </div>

    <div class="gd-card ${quickClosed ? 'is-closed' : ''}" data-gd-accordion="quick">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="quick" aria-label="Відкрити або закрити швидку ручну зміну">${quickClosed ? '▸' : '▾'}</button><span>Швидка ручна зміна</span></span><small>${esc(sourceLabel_(st.activeSource))}</small></div>
      <div class="gd-card__body">
        <div class="gd-grid2">
          ${QUICK_COLOR_KEYS.map((k) => renderQuickColor_(k, colors)).join('')}
        </div>
      </div>
    </div>

    <div class="gd-card ${advancedClosed ? 'is-closed' : ''}" data-gd-accordion="advanced">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="advanced" aria-label="Відкрити або закрити розширені налаштування">${advancedClosed ? '▸' : '▾'}</button><span>Розширені налаштування</span></span><small>тіні / hover / бордери / радіуси</small></div>
      <div class="gd-card__body">
        ${renderAdvanced_()}
      </div>
    </div>

    <div class="gd-card ${footerClosed ? 'is-closed' : ''}" data-gd-accordion="footer">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="footer" aria-label="Відкрити або закрити налаштування футера">${footerClosed ? '▸' : '▾'}</button><span>Футер</span></span><small>окремо тільки те, чого немає у шапці</small></div>
      <div class="gd-card__body">
        <div class="gd-note">Футер за замовчуванням бере ту саму кольорову гаму, кнопки, меню, радіуси і тіні, що й шапка. Цей блок — тільки для точкових відмінностей футера.</div>
        ${renderFooterAdvanced_()}
      </div>
    </div>

    <div class="gd-card ${statusClosed ? 'is-closed' : ''}" data-gd-accordion="status">
      <div class="gd-card__head"><span class="gd-card__head-main"><button class="gd-toggle" type="button" data-gd-toggle="status" aria-label="Відкрити або закрити статус">${statusClosed ? '▸' : '▾'}</button><span>Статус / діагностика</span></span><small>службово</small></div>
      <div class="gd-card__body">
        <button class="gd-btn" type="button" data-gd-action="reset">Скинути до теми «Світла чиста»</button>
        <div class="gd-status" id="gdStatus00684">${esc(statusText_(st, resolved))}</div>
      </div>
    </div>
  `;
}

function saveUiState_(patch) {
  let ui = {};
  try { ui = JSON.parse(localStorage.getItem('st_global_design_ui_00687') || '{}'); } catch (_) { ui = {}; }
  Object.assign(ui, patch || {});
  try { localStorage.setItem('st_global_design_ui_00687', JSON.stringify(ui)); } catch (_) {}
}
function toggleAccordion_(name) {
  const card = document.querySelector(`[data-gd-accordion="${CSS.escape(name)}"]`);
  if (!card) return;
  const closed = !card.classList.contains('is-closed');
  card.classList.toggle('is-closed', closed);
  const btn = card.querySelector(`[data-gd-toggle="${CSS.escape(name)}"]`);
  if (btn) btn.textContent = closed ? '▸' : '▾';
  const patch = name === 'themes' ? { themesClosed: closed }
    : name === 'advanced' ? { advancedClosed: closed }
    : name === 'footer' ? { footerClosed: closed }
    : { [name + 'Closed']: closed };
  saveUiState_(patch);
  log00687_('global-design-accordion-toggle-00690', { name, closed });
}

function applyColorChange_(input, live = false) {
  const colorKey = input?.getAttribute?.('data-gd-color') || '';
  if (!colorKey) return;
  const started = perfNow00702_();
  const st = GlobalStyleStore.read();
  const src = st.activeSource || 'global';
  const mergedSrcStyle = normalizeResolvedForControls_(mergeDeep_(GlobalStyleStore.resolve(st), st[src] || {}));
  patchStoreFast00702_(src, patchForColor_(mergedSrcStyle, colorKey, input.value), `global-design-color-${colorKey}-${live ? 'live' : 'change'}-00687`, live);
  if (live) {
    syncLiveFieldUi00702_(input);
    logColorLiveSample00702_({ source: src, key: colorKey, value: input.value }, Math.round((perfNow00702_() - started) * 10) / 10);
    return;
  }
  syncPanelFromStore_({ forceColorInputs: false });
  logColorPerf00702_('global-design-color-change-saved-00702', { source: src, key: colorKey, value: input.value, durationMs: Math.round((perfNow00702_() - started) * 10) / 10 });
}
function applyControlChange_(input, live = false) {
  if (!input?.matches?.('[data-gd-control="1"]')) return;
  const path = input.getAttribute('data-gd-path') || '';
  const type = input.getAttribute('data-gd-type') || 'text';
  const started = perfNow00702_();
  const st = GlobalStyleStore.read();
  const src = st.activeSource || 'global';
  const mergedSrcStyle = normalizeResolvedForControls_(mergeDeep_(GlobalStyleStore.resolve(st), st[src] || {}));
  patchStoreFast00702_(src, patchForControl_(mergedSrcStyle, path, type, input.value), `global-design-control-${path}-${live ? 'live' : 'change'}-00687`, live);
  if (live) {
    syncLiveFieldUi00702_(input);
    logColorLiveSample00702_({ source: src, path, value: input.value }, Math.round((perfNow00702_() - started) * 10) / 10);
    return;
  }
  syncPanelFromStore_({ forceColorInputs: false });
  logColorPerf00702_('global-design-control-change-saved-00702', { source: src, path, value: input.value, durationMs: Math.round((perfNow00702_() - started) * 10) / 10 });
}


function patchManualPath_(sourceStyle, path, value) {
  const src = normalizeResolvedForControls_(sourceStyle || {});
  const patch = {};
  setByPath(patch, path, value);
  if (path === 'buttons.borderColor' || path === 'buttons.borderWidth') {
    const color = path === 'buttons.borderColor' ? value : (src.buttons?.borderColor || borderColorFrom_(src.buttons?.border, src.colors?.accent || '#0ea5e9'));
    const width = path === 'buttons.borderWidth' ? value : (src.buttons?.borderWidth || borderWidthFrom_(src.buttons?.border, '1px'));
    patch.buttons = Object.assign({}, patch.buttons || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${color}` });
  }
  if (path === 'sections.borderColor' || path === 'sections.borderWidth') {
    const color = path === 'sections.borderColor' ? value : (src.sections?.borderColor || borderColorFrom_(src.sections?.border, src.colors?.border || '#e2e8f0'));
    const width = path === 'sections.borderWidth' ? value : (src.sections?.borderWidth || borderWidthFrom_(src.sections?.border, '0px'));
    patch.sections = Object.assign({}, patch.sections || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${width === '0px' ? 'transparent' : color}` });
  }
  if (path === 'containers.borderColor' || path === 'containers.borderWidth') {
    const color = path === 'containers.borderColor' ? value : (src.containers?.borderColor || borderColorFrom_(src.containers?.border, src.colors?.border || '#e2e8f0'));
    const width = path === 'containers.borderWidth' ? value : (src.containers?.borderWidth || borderWidthFrom_(src.containers?.border, '0px'));
    patch.containers = Object.assign({}, patch.containers || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${width === '0px' ? 'transparent' : color}` });
  }
  if (path === 'blocks.borderColor' || path === 'blocks.borderWidth') {
    const color = path === 'blocks.borderColor' ? value : (src.blocks?.borderColor || borderColorFrom_(src.blocks?.border, src.colors?.border || '#e2e8f0'));
    const width = path === 'blocks.borderWidth' ? value : (src.blocks?.borderWidth || borderWidthFrom_(src.blocks?.border, '1px'));
    patch.blocks = Object.assign({}, patch.blocks || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${width === '0px' ? 'transparent' : color}` });
  }
  if (path === 'footer.borderColor' || path === 'footer.borderWidth') {
    const color = path === 'footer.borderColor' ? value : (src.footer?.borderColor || borderColorFrom_(src.footer?.border, src.blocks?.borderColor || src.colors?.border || '#e2e8f0'));
    const width = path === 'footer.borderWidth' ? value : (src.footer?.borderWidth || borderWidthFrom_(src.footer?.border, '1px'));
    patch.footer = Object.assign({}, patch.footer || {}, { borderColor: color, borderWidth: width, border: `${width} solid ${color}` });
  }
  if (path === 'buttons.shadow') patch.shadow = Object.assign({}, patch.shadow || {}, { soft: value });
  return patch;
}
function applyManualColorChange_(input, live = false) {
  const wrap = input?.closest?.('[data-gd-manual-color-wrap]');
  const colorKey = wrap?.getAttribute?.('data-gd-manual-color-wrap') || '';
  if (!colorKey) return;
  const started = perfNow00702_();
  const st = GlobalStyleStore.read();
  const src = st.activeSource || 'global';
  const mergedSrcStyle = normalizeResolvedForControls_(mergeDeep_(GlobalStyleStore.resolve(st), st[src] || {}));
  patchStoreFast00702_(src, patchForColor_(mergedSrcStyle, colorKey, input.value), `global-design-manual-color-${colorKey}-${live ? 'live' : 'change'}-00688`, live);
  if (live) {
    syncLiveFieldUi00702_(input);
    logColorLiveSample00702_({ source: src, key: colorKey, manual: true, value: input.value }, Math.round((perfNow00702_() - started) * 10) / 10);
    return;
  }
  syncPanelFromStore_({ forceColorInputs: false });
  logColorPerf00702_('global-design-manual-color-saved-00702', { source: src, key: colorKey, value: input.value, durationMs: Math.round((perfNow00702_() - started) * 10) / 10 });
}
function applyManualPathChange_(input, live = false) {
  const wrap = input?.closest?.('[data-gd-manual-path]');
  const path = wrap?.getAttribute?.('data-gd-manual-path') || '';
  if (!path) return;
  const started = perfNow00702_();
  const st = GlobalStyleStore.read();
  const src = st.activeSource || 'global';
  const mergedSrcStyle = normalizeResolvedForControls_(mergeDeep_(GlobalStyleStore.resolve(st), st[src] || {}));
  patchStoreFast00702_(src, patchManualPath_(mergedSrcStyle, path, input.value), `global-design-manual-path-${path}-${live ? 'live' : 'change'}-00688`, live);
  if (live) {
    syncLiveFieldUi00702_(input);
    logColorLiveSample00702_({ source: src, path, manual: true, value: input.value }, Math.round((perfNow00702_() - started) * 10) / 10);
    return;
  }
  syncPanelFromStore_({ forceColorInputs: false });
  logColorPerf00702_('global-design-manual-path-saved-00702', { source: src, path, value: input.value, durationMs: Math.round((perfNow00702_() - started) * 10) / 10 });
}

function setPreviewClass00695_(root, presetId) {
  if (!root) return;
  root.querySelectorAll('[data-gd-preset]').forEach((btn) => {
    const isPreview = !!presetId && String(btn.getAttribute('data-gd-preset') || '') === String(presetId);
    btn.classList.toggle('is-preview', isPreview);
  });
}
function previewTheme00695_(presetId) {
  if (!presetId || previewPresetId00695_ === presetId) return;
  if (previewReturnTimer00695_) {
    clearTimeout(previewReturnTimer00695_);
    previewReturnTimer00695_ = 0;
  }
  previewPresetId00695_ = String(presetId);
  try { GlobalStyleStore.previewPreset(previewPresetId00695_, 'global-design-preset-hover-00695'); } catch (_) {}
  setPreviewClass00695_(document.getElementById('global-design-panel'), previewPresetId00695_);
  log00687_('global-design-preset-preview-00695', { presetId: previewPresetId00695_ });
}
function restoreThemePreview00695_(reason = 'global-design-preset-preview-restore-00695') {
  if (!previewPresetId00695_) return;
  const restoredId = previewPresetId00695_;
  previewPresetId00695_ = '';
  if (previewReturnTimer00695_) clearTimeout(previewReturnTimer00695_);
  previewReturnTimer00695_ = window.setTimeout(() => {
    previewReturnTimer00695_ = 0;
    try { GlobalStyleStore.restoreAfterPreview(reason); } catch (_) {}
    setPreviewClass00695_(document.getElementById('global-design-panel'), '');
    log00687_('global-design-preset-preview-restore-00695', { presetId: restoredId });
  }, 30);
}
function resetElementsAction00695_(action) {
  const api = window.ST_ELEMENT_STYLE_SOURCE;
  let count = 0;
  if (action === 'reset-selected-global') count = Number(api?.resetSelectedToGlobal?.() || 0);
  else if (action === 'reset-buttons-global') count = Number(api?.resetButtonsToGlobal?.() || 0);
  else if (action === 'reset-blocks-global') count = Number(api?.resetBlocksToGlobal?.() || 0);
  else if (action === 'reset-site-global') {
    const presetId = activePresetId_(GlobalStyleStore.read());
    GlobalStyleStore.applyPresetToGlobal(presetId, 'global-design-reset-site-active-theme-00695');
    count = Number(api?.resetAllToGlobal?.() || 0);
  }
  syncPanelFromStore_({ forceColorInputs: true, focusPresetId: activePresetId_(GlobalStyleStore.read()) });
  log00687_('global-design-reset-to-global-00695', { action, count });
}


function gdSelectedCanvasElement00697_() {
  try {
    const sel = window.ST_SELECTION?.get?.();
    const arr = Array.isArray(sel?.elements) ? sel.elements : (sel?.element ? [sel.element] : []);
    const hit = arr.find((el) => el instanceof HTMLElement && el.isConnected && gdElementScope00696_(el) && !el.closest?.('.hb-panel,.fb-panel,.builder__settings-sidebar,#global-design-panel'));
    if (hit) return hit;
  } catch (_) {}
  try {
    return Array.from(document.querySelectorAll('#st-site-header-slot .hb-dom-active,#st-site-header-slot .is-active,#st-site-header-slot .is-selected,#st-site-footer-slot .hb-dom-active,#st-site-footer-slot .is-active,#st-site-footer-slot .is-selected,#site-root .is-active,#site-root .is-selected'))
      .find((el) => el instanceof HTMLElement && el.isConnected && gdElementScope00696_(el) && !el.closest?.('.hb-panel,.fb-panel,.builder__settings-sidebar,#global-design-panel')) || null;
  } catch (_) {}
  return null;
}
function gdCurrentSelectedMapId00697_() {
  const el = gdSelectedCanvasElement00697_();
  return el ? gdEnsureMapId00696_(el) : '';
}
function gdRequestStyleMapFocus00697_(id, reason = 'selection') {
  gdPendingMapFocusId00697_ = String(id || '');
  gdLastMapFocusReason00697_ = String(reason || 'selection');
}
function gdFocusStyleMapRow00697_(id, reason = 'selection') {
  const root = document.getElementById('global-design-panel');
  if (!root || !id) return false;
  let row = null;
  try { row = root.querySelector(`[data-gd-style-map-row="${CSS.escape(String(id))}"]`); } catch (_) { row = null; }
  if (!(row instanceof HTMLElement)) return false;
  try { root.querySelectorAll('.gd-style-el-row.is-focused-00697').forEach((n) => n.classList.remove('is-focused-00697')); } catch (_) {}
  try { row.classList.add('is-focused-00697', 'is-selected'); row.setAttribute('aria-current', 'true'); } catch (_) {}
  requestAnimationFrame(() => {
    try { row.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }); } catch (_) {}
    try { row.focus({ preventScroll: true }); } catch (_) { try { row.focus(); } catch (__) {} }
    try {
      window.setTimeout(() => { try { row.classList.remove('is-focused-00697'); } catch (_) {} }, 1600);
    } catch (_) {}
  });
  log00687_('global-design-style-map-focus-row-00697', { id, reason });
  return true;
}
function gdFocusSelectedMapRowAfterRender00697_(reason = 'selection') {
  const id = gdPendingMapFocusId00697_ || gdCurrentSelectedMapId00697_();
  if (!id) return;
  gdPendingMapFocusId00697_ = '';
  requestAnimationFrame(() => gdFocusStyleMapRow00697_(id, reason || gdLastMapFocusReason00697_ || 'selection'));
}

let gdStyleMapHighlightFrame00704_ = 0;
let gdStyleMapHighlightPayload00704_ = { rows: [], active: false, filters: [], query: '' };
function gdClearStyleMapCanvasHighlights00704_() {
  try {
    document.querySelectorAll('[data-gd-style-map-filter-highlight-00704="1"]').forEach((el) => {
      try {
        el.classList.remove('gd-style-map-filter-highlight-00704','gd-style-map-filter-highlight--design-00704','gd-style-map-filter-highlight--global-00704','gd-style-map-filter-highlight--ai-00704');
        el.removeAttribute('data-gd-style-map-filter-highlight-00704');
        el.removeAttribute('data-gd-style-map-filter-label-00704');
      } catch (_) {}
    });
  } catch (_) {}
}
function gdCanvasHighlightLabel00704_(row, filters, query) {
  const bits = [];
  const source = String(row?.source || row?.getAttribute?.('data-gd-style-map-source') || '');
  const scope = String(row?.scope || row?.getAttribute?.('data-gd-style-map-scope') || '');
  if (source) bits.push(sourceLabel_(source));
  if (scope) bits.push(gdScopeLabel00696_(scope));
  if (query) bits.push('Пошук');
  return bits.filter(Boolean).slice(0, 3).join(' · ') || 'Style Map';
}
function gdApplyStyleMapCanvasHighlightsNow00704_() {
  const payload = gdStyleMapHighlightPayload00704_ || { rows: [], active: false, filters: [], query: '' };
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  gdClearStyleMapCanvasHighlights00704_();
  const root = document.getElementById('global-design-panel');
  const countNode = root?.querySelector?.('[data-gd-style-map-highlight-count]');
  if (!payload.active || !rows.length) {
    if (countNode) countNode.textContent = '0';
    return;
  }
  let count = 0;
  rows.forEach((row) => {
    const id = String(row?.id || '');
    if (!id) return;
    const el = gdFindMapElement00696_(id);
    if (!(el instanceof HTMLElement) || !el.isConnected) return;
    try {
      const source = String(row.source || '');
      el.classList.add('gd-style-map-filter-highlight-00704');
      if (source === 'design') el.classList.add('gd-style-map-filter-highlight--design-00704');
      else if (source === 'global') el.classList.add('gd-style-map-filter-highlight--global-00704');
      else if (source === 'ai') el.classList.add('gd-style-map-filter-highlight--ai-00704');
      el.setAttribute('data-gd-style-map-filter-highlight-00704', '1');
      el.setAttribute('data-gd-style-map-filter-label-00704', gdCanvasHighlightLabel00704_(row, payload.filters, payload.query));
      count += 1;
    } catch (_) {}
  });
  if (countNode) countNode.textContent = String(count);
  log00687_('global-design-style-map-canvas-highlight-00704', { count, filters: payload.filters || [], query: payload.query || '' });
}
function gdScheduleStyleMapCanvasHighlights00704_(rows, meta = {}) {
  const query = String(meta.query || '').trim();
  const filters = Array.isArray(meta.filters) ? meta.filters.map(String).filter(Boolean) : [];
  gdStyleMapHighlightPayload00704_ = { rows: Array.isArray(rows) ? rows : [], active: !!(query || filters.length), filters, query };
  try { if (gdStyleMapHighlightFrame00704_) cancelAnimationFrame(gdStyleMapHighlightFrame00704_); } catch (_) {}
  try { gdStyleMapHighlightFrame00704_ = requestAnimationFrame(() => { gdStyleMapHighlightFrame00704_ = 0; gdApplyStyleMapCanvasHighlightsNow00704_(); }); }
  catch (_) { gdApplyStyleMapCanvasHighlightsNow00704_(); }
}
function gdRowsFromRenderedStyleMap00704_(map, query, activeFilters) {
  const rows = [];
  try {
    map.querySelectorAll('[data-gd-style-map-row]').forEach((row) => {
      const hay = String(row.getAttribute('data-gd-style-map-search') || '').toLowerCase();
      const source = String(row.getAttribute('data-gd-style-map-source') || '');
      const scope = String(row.getAttribute('data-gd-style-map-scope') || '');
      const manual = row.getAttribute('data-gd-style-map-manual') === '1';
      const okQuery = !query || hay.includes(query);
      const okFilters = !activeFilters.length || activeFilters.every((f) => {
        if (f === 'global' || f === 'ai' || f === 'design') return source === f;
        if (f === 'header' || f === 'main' || f === 'footer') return scope === f;
        if (f === 'manual') return manual;
        return true;
      });
      if (okQuery && okFilters) rows.push({ id: row.getAttribute('data-gd-style-map-row') || '', source, scope, manual });
    });
  } catch (_) {}
  return rows;
}
function gdApplyStyleMapDomFilters00703_() {
  const root = document.getElementById('global-design-panel');
  const map = root?.querySelector?.('[data-gd-style-map]');
  if (!map) return;
  const queryInput = map.querySelector('[data-gd-style-map-search]');
  const query = String(queryInput?.value || '').trim().toLowerCase();
  const activeFilters = Array.from(map.querySelectorAll('[data-gd-style-map-filter].is-active')).map((btn) => String(btn.getAttribute('data-gd-style-map-filter') || '')).filter(Boolean);
  let shown = 0;
  const highlightedRows = [];
  const highlightActive = !!(query || activeFilters.length);
  try {
    map.querySelectorAll('[data-gd-style-map-row]').forEach((row) => {
      const hay = String(row.getAttribute('data-gd-style-map-search') || '').toLowerCase();
      const source = String(row.getAttribute('data-gd-style-map-source') || '');
      const scope = String(row.getAttribute('data-gd-style-map-scope') || '');
      const manual = row.getAttribute('data-gd-style-map-manual') === '1';
      const okQuery = !query || hay.includes(query);
      const okFilters = !activeFilters.length || activeFilters.every((f) => {
        if (f === 'global' || f === 'ai' || f === 'design') return source === f;
        if (f === 'header' || f === 'main' || f === 'footer') return scope === f;
        if (f === 'manual') return manual;
        return true;
      });
      const show = okQuery && okFilters;
      row.hidden = !show;
      row.style.display = show ? '' : 'none';
      row.classList.toggle('is-filter-match-00704', show && highlightActive);
      row.classList.toggle('is-filter-design-00704', show && highlightActive && source === 'design');
      if (show) {
        shown += 1;
        if (highlightActive) highlightedRows.push({ id: row.getAttribute('data-gd-style-map-row') || '', source, scope, manual });
      }
    });
  } catch (_) {}
  const counter = map.querySelector('[data-gd-style-map-filtered-count]');
  if (counter) counter.textContent = String(shown);
  const empty = map.querySelector('[data-gd-style-map-empty-dom]');
  if (empty) empty.hidden = shown > 0;
  gdScheduleStyleMapCanvasHighlights00704_(highlightedRows, { query, filters: activeFilters });
}
function gdHandleStyleMapFilterClick00703_(btn) {
  if (!btn) return;
  const id = String(btn.getAttribute('data-gd-style-map-filter') || '');
  if (!GD_STYLE_MAP_FILTERS_00703.includes(id)) return;
  const state = gdStyleMapUi00703_();
  let filters = state.filters || [];
  if (filters.includes(id)) {
    filters = filters.filter((f) => f !== id);
  } else {
    if (GD_STYLE_MAP_SOURCE_FILTERS_00704.includes(id)) filters = filters.filter((f) => !GD_STYLE_MAP_SOURCE_FILTERS_00704.includes(f));
    if (GD_STYLE_MAP_SCOPE_FILTERS_00704.includes(id)) filters = filters.filter((f) => !GD_STYLE_MAP_SCOPE_FILTERS_00704.includes(f));
    filters = filters.concat(id);
  }
  filters = gdNormalizeStyleMapFilters00704_(filters);
  gdSaveStyleMapUi00703_({ styleMapFilters00703: filters });
  syncPanelFromStore_({ forceColorInputs: false, focusSelectedStyleMap: true, focusReason: 'style-map-filter-00703' });
  log00687_('global-design-style-map-filter-00703', { filter: id, active: filters.includes(id), filters });
}
function gdClearStyleMapFilters00703_() {
  gdSaveStyleMapUi00703_({ styleMapQuery00703: '', styleMapFilters00703: [] });
  gdScheduleStyleMapCanvasHighlights00704_([], { query: '', filters: [] });
  syncPanelFromStore_({ forceColorInputs: false, focusSelectedStyleMap: true, focusReason: 'style-map-clear-00704' });
  log00687_('global-design-style-map-clear-00704', {});
}
function gdRowsForGroupAction00703_(action) {
  const allRows = gdCollectStyleElements00696_();
  if (action === 'visible-global') return gdFilteredStyleRows00703_(allRows, gdStyleMapUi00703_());
  if (action === 'manual-global') return allRows.filter((r) => r.manual || r.source === 'design');
  if (action === 'header-global') return allRows.filter((r) => r.scope === 'header');
  if (action === 'main-global') return allRows.filter((r) => r.scope === 'main');
  if (action === 'footer-global') return allRows.filter((r) => r.scope === 'footer');
  return [];
}
function gdHandleStyleMapGroupAction00703_(action) {
  const rows = gdRowsForGroupAction00703_(action);
  const els = rows.map((r) => gdFindMapElement00696_(r.id)).filter((el) => el instanceof HTMLElement && el.isConnected);
  if (!els.length) {
    log00687_('global-design-style-map-group-empty-00703', { action });
    return;
  }
  const labels = {
    'visible-global': 'видимі елементи',
    'manual-global': 'усі ручні стилі',
    'header-global': 'елементи шапки',
    
    'footer-global': 'елементи футера'
  };
  const label = labels[action] || 'елементи';
  let ok = true;
  try {
    ok = window.confirm(`Повернути ${label} до Глобально?\nЕлементів: ${els.length}\nТекст, фото і структура не зміняться.`);
  } catch (_) { ok = true; }
  if (!ok) return;
  try { window.ST_ELEMENT_STYLE_SOURCE?.setSourceForElements?.(els, 'global', `style-map-group-00703:${action}`); }
  catch (_) {
    els.forEach((el) => { try { el.setAttribute('data-st-style-source', 'global'); el.dataset.stStyleSource = 'global'; } catch (__) {} });
  }
  syncPanelFromStore_({ forceColorInputs: false, focusSelectedStyleMap: true, focusReason: `style-map-group-00703:${action}` });
  log00687_('global-design-style-map-group-action-00703', { action, count: els.length });
}

function gdFindMapElement00696_(id) {
  if (!id) return null;
  try { return document.querySelector(`[data-gd-style-map-id="${CSS.escape(String(id))}"]`); } catch (_) { return null; }
}
function gdSelectionTypeFor00696_(el) {
  const type = gdNodeType00696_(el);
  if (type === 'section') return 'section';
  if (type === 'level') return 'row';
  if (type === 'container') return 'container';
  if (type === 'block') return 'block';
  return 'auto';
}
function gdSelectElement00696_(el) {
  if (!(el instanceof HTMLElement)) return false;
  const mapId00697 = gdEnsureMapId00696_(el);
  gdRequestStyleMapFocus00697_(mapId00697, 'map-to-canvas');
  try { window.ST_SELECTION?.setSingle?.(el, { type: gdSelectionTypeFor00696_(el) }); }
  catch (_) {
    try {
      document.querySelectorAll('.is-selected,.is-active,.hb-dom-selected,.hb-dom-active').forEach((n) => n.classList.remove('is-selected','is-active','hb-dom-selected','hb-dom-active'));
      el.classList.add('is-selected','is-active','hb-dom-selected','hb-dom-active');
      document.dispatchEvent(new CustomEvent('st:selection-changed', { detail: { elements: [el] } }));
    } catch (__) {}
  }
  try { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' }); } catch (_) {}
  try { if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); } catch (_) {}
  try { requestAnimationFrame(() => el.focus?.({ preventScroll: true })); } catch (_) {}
  try {
    el.classList.add('gd-style-map-flash-00696', 'gd-style-canvas-focus-00697');
    setTimeout(() => { try { el.classList.remove('gd-style-map-flash-00696', 'gd-style-canvas-focus-00697'); } catch (_) {} }, 1400);
  } catch (_) {}
  return true;
}
function handleStyleMapAction00696_(btn) {
  const action = String(btn?.getAttribute?.('data-gd-style-map-action') || '');
  const targetId = String(btn?.getAttribute?.('data-gd-style-map-target') || '');
  const el = gdFindMapElement00696_(targetId);
  if (!(el instanceof HTMLElement)) return;
  if (action === 'select') {
    gdSelectElement00696_(el);
  } else if (['global', 'ai', 'design'].includes(action)) {
    try { window.ST_ELEMENT_STYLE_SOURCE?.setSourceForElements?.([el], action, 'style-map-00696'); }
    catch (_) {
      try { el.setAttribute('data-st-style-source', action); el.dataset.stStyleSource = action; } catch (__) {}
    }
    gdSelectElement00696_(el);
  }
  syncPanelFromStore_({ forceColorInputs: false, focusStyleMapId: targetId, focusReason: 'map-action-00697' });
  log00687_('global-design-style-map-action-00697', { action, targetId, type: gdNodeType00696_(el), scope: gdElementScope00696_(el) });
}

function toggleManualLine_(btn) {
  if (!btn) return;
  const field = btn.closest?.('.gd-field');
  const line = field?.querySelector?.('.gd-manual-line');
  if (!line) return;
  const open = !line.classList.contains('is-open');
  line.classList.toggle('is-open', open);
  btn.classList.toggle('is-open', open);
  if (open) requestAnimationFrame(() => { try { line.querySelector('input')?.focus?.({ preventScroll: true }); } catch (_) {} });
  log00687_('global-design-manual-line-toggle-00688', { open });
}

function bindPanel_() {
  const root = document.getElementById('global-design-panel');
  if (!root || root.dataset.gdBound00687 === '1') return;
  root.dataset.gdBound00687 = '1';

  root.addEventListener('change', (ev) => {
    const source = ev.target?.matches?.('input[name="gdSource"]') ? ev.target.value : '';
    if (source) {
      try { GlobalStyleStore.flushLive?.('global-design-source-switch'); } catch (_) {}
      GlobalStyleStore.setActiveSource(source, 'global-design-radio-00687');
      syncPanelFromStore_({ forceColorInputs: true });
      log00687_('global-design-source-switch-00687', { source });
      return;
    }
    try { GlobalStyleStore.flushLive?.('global-design-final-change'); } catch (_) {}
    if (ev.target?.closest?.('[data-gd-manual-color-wrap]')) applyManualColorChange_(ev.target, false);
    else if (ev.target?.closest?.('[data-gd-manual-path]')) applyManualPathChange_(ev.target, false);
    else if (ev.target?.getAttribute?.('data-gd-color')) applyColorChange_(ev.target, false);
    else if (ev.target?.matches?.('[data-gd-control="1"]')) applyControlChange_(ev.target, false);
  });

  root.addEventListener('input', (ev) => {
    if (ev.target?.matches?.('[data-gd-style-map-search]')) {
      gdSaveStyleMapUi00703_({ styleMapQuery00703: String(ev.target.value || '') });
      gdApplyStyleMapDomFilters00703_();
      return;
    }
    if (ev.target?.closest?.('[data-gd-manual-color-wrap]')) applyManualColorChange_(ev.target, true);
    else if (ev.target?.closest?.('[data-gd-manual-path]')) applyManualPathChange_(ev.target, true);
    else if (ev.target?.getAttribute?.('data-gd-color')) applyColorChange_(ev.target, true);
    else if (ev.target?.matches?.('[data-gd-control="1"]')) applyControlChange_(ev.target, true);
  });

  root.addEventListener('click', (ev) => {
    const mapClear = ev.target?.closest?.('[data-gd-style-map-clear]');
    if (mapClear) {
      gdClearStyleMapFilters00703_();
      return;
    }
    const mapFilter = ev.target?.closest?.('[data-gd-style-map-filter]');
    if (mapFilter) {
      gdHandleStyleMapFilterClick00703_(mapFilter);
      return;
    }
    const mapGroup = ev.target?.closest?.('[data-gd-style-map-group-action]');
    if (mapGroup) {
      gdHandleStyleMapGroupAction00703_(String(mapGroup.getAttribute('data-gd-style-map-group-action') || ''));
      return;
    }
    const detailsToggle = ev.target?.closest?.('[data-gd-style-map-details-toggle]');
    if (detailsToggle) {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      gdToggleStyleMapRowDetails00705_(detailsToggle);
      return;
    }
    const infoBtn = ev.target?.closest?.('[data-gd-style-map-info]');
    if (infoBtn) {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
      gdOpenStyleMapDetailModal00705_(infoBtn.closest('[data-gd-style-map-row]'));
      return;
    }
    const mapBtn = ev.target?.closest?.('[data-gd-style-map-action]');
    if (mapBtn) {
      handleStyleMapAction00696_(mapBtn);
      return;
    }
    const mapRow = ev.target?.closest?.('[data-gd-style-map-row]');
    if (mapRow && !ev.target?.closest?.('[data-gd-style-map-action],[data-gd-style-map-details-toggle],[data-gd-style-map-info]')) {
      const targetId = mapRow.getAttribute('data-gd-style-map-row') || '';
      const el = gdFindMapElement00696_(targetId);
      if (el) {
        gdSelectElement00696_(el);
        syncPanelFromStore_({ forceColorInputs: false, focusStyleMapId: targetId, focusReason: 'map-row-click-00697' });
        log00687_('global-design-style-map-row-click-00697', { targetId, type: gdNodeType00696_(el), scope: gdElementScope00696_(el) });
      }
      return;
    }
    const manualDot = ev.target?.closest?.('.gd-manual-dot');
    if (manualDot) {
      toggleManualLine_(manualDot);
      return;
    }
    const typoPresetBtn = ev.target?.closest?.('[data-gd-typo-preset]');
    if (typoPresetBtn) {
      applyTypographyPreset00698_(typoPresetBtn.getAttribute('data-gd-typo-preset') || '');
      return;
    }
    const spacingPresetBtn = ev.target?.closest?.('[data-gd-spacing-preset]');
    if (spacingPresetBtn) {
      applySpacingPreset00699_(spacingPresetBtn.getAttribute('data-gd-spacing-preset') || '');
      return;
    }
    const toggle = ev.target?.closest?.('[data-gd-toggle]');
    if (toggle) {
      toggleAccordion_(toggle.getAttribute('data-gd-toggle') || '');
      return;
    }
    const presetBtn = ev.target?.closest?.('[data-gd-preset]');
    if (presetBtn) {
      const presetId = presetBtn.getAttribute('data-gd-preset') || '';
      // [00776] Hover preview must continue after click. Click only commits; it does not lock future previews.
      previewPresetId00695_ = '';
      if (previewReturnTimer00695_) { clearTimeout(previewReturnTimer00695_); previewReturnTimer00695_ = 0; }
      setPreviewClass00695_(root, '');
      GlobalStyleStore.applyPresetToGlobal(presetId, 'global-design-preset-click-00695');
      syncPanelFromStore_({ focusPresetId: presetId, forceColorInputs: true });
      log00687_('global-design-preset-focus-kept-hover-still-enabled-00776', { presetId, hoverPreviewLocked: false });
      return;
    }
    const action = ev.target?.closest?.('[data-gd-action]')?.getAttribute('data-gd-action') || '';
    if (action === 'reset') {
      GlobalStyleStore.reset('global-design-reset-click-00687');
      syncPanelFromStore_({ focusPresetId: activePresetId_(GlobalStyleStore.read()), forceColorInputs: true });
      log00687_('global-design-reset-00687', {});
    } else if (['reset-selected-global','reset-buttons-global','reset-blocks-global','reset-site-global'].includes(action)) {
      resetElementsAction00695_(action);
    }
  });

  root.addEventListener('pointerover', (ev) => {
    const theme = ev.target?.closest?.('[data-gd-preset]');
    if (theme && !theme.contains(ev.relatedTarget)) {
      previewTheme00695_(theme.getAttribute('data-gd-preset') || '');
    }
    const typography = ev.target?.closest?.('[data-gd-typo-preset]');
    if (typography && !typography.contains(ev.relatedTarget)) {
      const presetId = typography.getAttribute('data-gd-typo-preset') || '';
      GlobalStyleStore.previewTypographyPreset?.(presetId, `global-design-typography-preset-hover-${presetId}-00938`);
    }
    const help = ev.target?.closest?.('.gd-format-help');
    if (help) { showBigTooltip_(help, 'ПРАВИЛЬНИЙ ФОРМАТ', help.getAttribute('data-tip') || FORMAT_HELP.text); return; }
    const swatch = ev.target?.closest?.('.gd-swatch');
    if (swatch) showTooltipForSwatch_(swatch);
  });
  root.addEventListener('pointerout', (ev) => {
    const theme = ev.target?.closest?.('[data-gd-preset]');
    if (theme && !theme.contains(ev.relatedTarget)) {
      restoreThemePreview00695_();
    }
    const typography = ev.target?.closest?.('[data-gd-typo-preset]');
    if (typography && !typography.contains(ev.relatedTarget)) {
      GlobalStyleStore.restoreAfterPreview('global-design-typography-preset-preview-restore-00938');
    }
    const swatch = ev.target?.closest?.('.gd-swatch');
    if (swatch) hideTooltip_();
  });
  root.addEventListener('focusin', (ev) => {
    const help = ev.target?.closest?.('.gd-format-help');
    if (help) { showBigTooltip_(help, 'ПРАВИЛЬНИЙ ФОРМАТ', help.getAttribute('data-tip') || FORMAT_HELP.text); return; }
    const swatch = ev.target?.closest?.('.gd-swatch');
    if (swatch) showTooltipForSwatch_(swatch);
  });
  root.addEventListener('focusout', hideTooltip_);
}

export function initGlobalDesignPanel() {
  injectCss_();
  initGlobalStyleStore();
  renderPanel_();
  bindPanel_();
  syncPanelFromStore_({ focusPresetId: activePresetId_(GlobalStyleStore.read()), forceColorInputs: true });
  if (!window.__ST_GLOBAL_DESIGN_STYLE_MAP_EVENTS_00696__) {
    window.__ST_GLOBAL_DESIGN_STYLE_MAP_EVENTS_00696__ = true;
    document.addEventListener('st:selection-changed', () => {
      const id = gdCurrentSelectedMapId00697_();
      if (id) gdRequestStyleMapFocus00697_(id, 'canvas-selection-00697');
      syncPanelFromStore_({ forceColorInputs: false, focusSelectedStyleMap: true, focusReason: 'canvas-selection-00697' });
    });
    // [00774] Style-map focus is allowed only from real canvas selection.
    // Picking a ready theme or changing a style source must keep UI focus on that control,
    // not jump into the Style Map.
    document.addEventListener('st:element-style-source-changed', () => syncPanelFromStore_({ forceColorInputs: false }));
    window.addEventListener('st:global-style-applied', (ev) => {
      const reason = String(ev?.detail?.reason || '');
      const presetId = String(ev?.detail?.presetId || activePresetId_(GlobalStyleStore.read()) || '');
      if (/global-design-preset-click/i.test(reason) && presetId) syncPanelFromStore_({ forceColorInputs: false, focusPresetId: presetId });
      else syncPanelFromStore_({ forceColorInputs: false });
      try { window.__ST_PERF_DIAG__?.push?.('global-design-style-map-focus-suppressed-00774', { reason, presetId }, 'info'); } catch (_) {}
    });
  }
  try { window.ST_GLOBAL_DESIGN_PANEL = { render: renderPanel_, store: GlobalStyleStore }; } catch (_) {}
}
