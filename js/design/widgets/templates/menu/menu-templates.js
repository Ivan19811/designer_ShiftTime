// js/design/widgets/templates/menu/menu-templates.js
// =======================================================
// [00382][SYSTEM][MENU DESIGN TEMPLATES]
// 50 дизайнів меню для шапки + ті самі 50 дизайнів для сайтбара у вертикальному вигляді.
// ВАЖЛИВО:
// - це шаблони ДИЗАЙНУ, а не даних;
// - при застосуванні до вибраного .st-block--menu тексти/посилання користувача зберігаються;
// - HTML потрібен для превʼю і як джерело CSS-токенів/inline-стилів.
// =======================================================

function escAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const DEMO_ITEMS = ['Головна', 'Каталог', 'Послуги', 'Про нас', 'Блог', 'Контакти'];

const DESIGNS = [
  ['Glass Pills Cyan',     '#e0f2fe', 'rgba(8,47,73,.40)', 'rgba(14,165,233,.22)', '#38bdf8', '999px', 'linear-gradient(135deg,rgba(56,189,248,.22),rgba(14,165,233,.08))', 'rgba(125,211,252,.45)', '0 12px 32px rgba(14,165,233,.22)', 18, 9, 14, 14, 'center'],
  ['Obsidian Split',       '#f8fafc', '#020617', 'rgba(255,255,255,.06)', '#f59e0b', '6px 24px 6px 24px', 'linear-gradient(180deg,rgba(30,41,59,.96),rgba(2,6,23,.96))', 'rgba(245,158,11,.45)', '0 16px 34px rgba(0,0,0,.34)', 14, 10, 18, 14, 'center'],
  ['Diagonal Mint',        '#ecfdf5', 'rgba(6,78,59,.30)', 'rgba(16,185,129,.16)', '#34d399', '22px 4px 22px 4px', 'linear-gradient(135deg,rgba(52,211,153,.24),rgba(5,150,105,.06))', 'rgba(52,211,153,.55)', '0 14px 30px rgba(16,185,129,.22)', 16, 9, 16, 14, 'center'],
  ['Clean Rectangle',      '#0f172a', '#ffffff', 'rgba(15,23,42,.04)', '#2563eb', '8px', '#ffffff', 'rgba(37,99,235,.28)', '0 10px 24px rgba(15,23,42,.10)', 12, 10, 16, 14, 'center'],
  ['Neon Outline',         '#dbeafe', '#020617', 'transparent', '#60a5fa', '999px', 'transparent', 'rgba(96,165,250,.78)', '0 0 0 1px rgba(96,165,250,.34),0 0 26px rgba(96,165,250,.24)', 16, 9, 15, 14, 'center'],
  ['Soft Rose Tabs',       '#fff1f2', 'rgba(136,19,55,.22)', 'rgba(244,63,94,.16)', '#fb7185', '18px 18px 4px 4px', 'linear-gradient(180deg,rgba(251,113,133,.25),rgba(244,63,94,.08))', 'rgba(251,113,133,.45)', '0 14px 28px rgba(244,63,94,.18)', 14, 9, 16, 14, 'center'],
  ['Royal Indigo',         '#eef2ff', 'rgba(49,46,129,.36)', 'rgba(99,102,241,.18)', '#818cf8', '14px', 'linear-gradient(135deg,rgba(99,102,241,.28),rgba(67,56,202,.10))', 'rgba(129,140,248,.52)', '0 16px 32px rgba(79,70,229,.25)', 16, 9, 16, 14, 'center'],
  ['Capsule Gold',         '#451a03', '#fffbeb', 'rgba(251,191,36,.20)', '#d97706', '999px', 'linear-gradient(135deg,#fef3c7,#fde68a)', 'rgba(217,119,6,.45)', '0 16px 34px rgba(217,119,6,.22)', 18, 10, 18, 14, 'center'],
  ['Squared Tech',         '#e2e8f0', '#0f172a', 'rgba(148,163,184,.10)', '#22d3ee', '2px', 'linear-gradient(180deg,rgba(15,23,42,.92),rgba(15,23,42,.76))', 'rgba(34,211,238,.42)', 'inset 0 0 0 1px rgba(255,255,255,.06)', 10, 9, 14, 13, 'center'],
  ['Bubble Candy',         '#4c0519', '#fff1f2', 'rgba(236,72,153,.20)', '#ec4899', '999px 999px 999px 12px', 'linear-gradient(135deg,#fce7f3,#fbcfe8)', 'rgba(236,72,153,.40)', '0 14px 30px rgba(236,72,153,.20)', 16, 10, 18, 14, 'center'],
  ['Mono Underline',       '#111827', 'transparent', 'transparent', '#111827', '0', 'transparent', 'transparent', 'none', 26, 6, 4, 14, 'center'],
  ['Ocean Bar',            '#eff6ff', 'rgba(12,74,110,.36)', 'rgba(2,132,199,.18)', '#0ea5e9', '10px', 'linear-gradient(135deg,rgba(14,165,233,.26),rgba(59,130,246,.12))', 'rgba(14,165,233,.44)', '0 16px 34px rgba(14,165,233,.20)', 14, 10, 16, 14, 'space-between'],
  ['Lime Frame',           '#ecfccb', 'rgba(54,83,20,.30)', 'rgba(132,204,22,.12)', '#a3e635', '16px 4px 16px 4px', 'rgba(132,204,22,.10)', 'rgba(163,230,53,.58)', '0 0 0 1px rgba(163,230,53,.18)', 14, 9, 15, 14, 'center'],
  ['Slate Minimal',        '#f8fafc', '#0f172a', 'rgba(255,255,255,.06)', '#94a3b8', '12px', 'rgba(255,255,255,.06)', 'rgba(148,163,184,.20)', '0 10px 24px rgba(0,0,0,.22)', 12, 9, 14, 14, 'flex-start'],
  ['Fire Gradient',        '#fff7ed', 'rgba(124,45,18,.25)', 'rgba(249,115,22,.18)', '#fb923c', '26px 8px 26px 8px', 'linear-gradient(135deg,rgba(251,146,60,.34),rgba(239,68,68,.14))', 'rgba(251,146,60,.52)', '0 16px 34px rgba(249,115,22,.25)', 16, 10, 18, 14, 'center'],
  ['Ice Rectangles',       '#0f172a', '#f8fafc', 'rgba(14,165,233,.08)', '#38bdf8', '4px', 'linear-gradient(180deg,#f8fafc,#e0f2fe)', 'rgba(14,165,233,.24)', '0 12px 26px rgba(14,165,233,.12)', 12, 10, 16, 14, 'center'],
  ['Dark Glass Compact',   '#f1f5f9', 'rgba(2,6,23,.55)', 'rgba(255,255,255,.07)', '#38bdf8', '999px', 'rgba(15,23,42,.48)', 'rgba(255,255,255,.12)', '0 18px 38px rgba(0,0,0,.28)', 8, 8, 12, 13, 'center'],
  ['Premium Brown',        '#fff7ed', 'rgba(67,20,7,.24)', 'rgba(120,53,15,.20)', '#92400e', '999px 16px 999px 16px', 'linear-gradient(135deg,rgba(146,64,14,.30),rgba(251,191,36,.12))', 'rgba(146,64,14,.35)', '0 14px 30px rgba(120,53,15,.20)', 16, 10, 17, 14, 'center'],
  ['Dashboard Blue',       '#dbeafe', 'rgba(30,64,175,.26)', 'rgba(37,99,235,.18)', '#60a5fa', '12px', 'linear-gradient(135deg,rgba(37,99,235,.28),rgba(29,78,216,.10))', 'rgba(96,165,250,.50)', '0 12px 28px rgba(37,99,235,.20)', 12, 9, 16, 14, 'center'],
  ['Sharp Business',       '#111827', '#ffffff', 'transparent', '#111827', '0', '#ffffff', '#111827', 'none', 10, 10, 18, 14, 'center'],
  ['Gradient Border',      '#faf5ff', 'rgba(88,28,135,.24)', 'rgba(168,85,247,.14)', '#c084fc', '18px', 'linear-gradient(rgba(17,24,39,.72),rgba(17,24,39,.72)) padding-box,linear-gradient(135deg,#22d3ee,#a855f7,#fb7185) border-box', 'transparent', '0 16px 36px rgba(168,85,247,.18)', 16, 10, 18, 14, 'center'],
  ['Paper Cut',            '#1f2937', '#fffaf0', 'rgba(251,191,36,.12)', '#b45309', '4px 18px 4px 18px', '#fffbeb', 'rgba(180,83,9,.32)', '4px 4px 0 rgba(180,83,9,.15)', 14, 10, 18, 14, 'center'],
  ['Aurora',               '#ecfeff', 'rgba(8,47,73,.35)', 'rgba(45,212,191,.14)', '#2dd4bf', '20px 20px 8px 20px', 'linear-gradient(135deg,rgba(45,212,191,.24),rgba(129,140,248,.20),rgba(244,114,182,.12))', 'rgba(45,212,191,.46)', '0 18px 38px rgba(45,212,191,.20)', 18, 10, 18, 14, 'center'],
  ['Red Alert',            '#fee2e2', 'rgba(127,29,29,.28)', 'rgba(239,68,68,.18)', '#ef4444', '10px', 'linear-gradient(135deg,rgba(239,68,68,.30),rgba(185,28,28,.12))', 'rgba(239,68,68,.48)', '0 14px 30px rgba(239,68,68,.22)', 14, 9, 16, 14, 'center'],
  ['Rounded Left Corner',  '#f8fafc', 'rgba(15,23,42,.28)', 'rgba(255,255,255,.06)', '#94a3b8', '26px 6px 6px 6px', 'rgba(255,255,255,.08)', 'rgba(255,255,255,.14)', '0 12px 28px rgba(0,0,0,.20)', 14, 9, 15, 14, 'center'],
  ['Rounded Right Corner', '#f8fafc', 'rgba(15,23,42,.28)', 'rgba(255,255,255,.06)', '#94a3b8', '6px 26px 6px 6px', 'rgba(255,255,255,.08)', 'rgba(255,255,255,.14)', '0 12px 28px rgba(0,0,0,.20)', 14, 9, 15, 14, 'center'],
  ['Top Left Bottom Right','#e0f2fe', 'rgba(12,74,110,.28)', 'rgba(14,165,233,.14)', '#38bdf8', '28px 4px 28px 4px', 'rgba(14,165,233,.12)', 'rgba(56,189,248,.48)', '0 12px 28px rgba(14,165,233,.18)', 14, 9, 15, 14, 'center'],
  ['Top Right Bottom Left','#fce7f3', 'rgba(131,24,67,.26)', 'rgba(236,72,153,.14)', '#f472b6', '4px 28px 4px 28px', 'rgba(236,72,153,.12)', 'rgba(244,114,182,.48)', '0 12px 28px rgba(236,72,153,.18)', 14, 9, 15, 14, 'center'],
  ['Large Round Buttons',  '#eff6ff', 'rgba(30,64,175,.24)', 'rgba(59,130,246,.16)', '#3b82f6', '999px', 'linear-gradient(180deg,rgba(255,255,255,.20),rgba(59,130,246,.10))', 'rgba(59,130,246,.45)', '0 14px 34px rgba(59,130,246,.18)', 12, 13, 22, 15, 'center'],
  ['Tiny Chips',           '#e2e8f0', 'rgba(15,23,42,.38)', 'rgba(255,255,255,.06)', '#cbd5e1', '999px', 'rgba(255,255,255,.06)', 'rgba(255,255,255,.12)', 'none', 6, 5, 10, 12, 'center'],
  ['Luxury Black Gold',    '#fef3c7', '#050505', 'rgba(251,191,36,.11)', '#fbbf24', '999px 10px 999px 10px', 'linear-gradient(135deg,rgba(251,191,36,.18),rgba(255,255,255,.03))', 'rgba(251,191,36,.50)', '0 18px 46px rgba(251,191,36,.16)', 16, 10, 18, 14, 'center'],
  ['Nature Leaf',          '#f0fdf4', 'rgba(20,83,45,.30)', 'rgba(34,197,94,.14)', '#22c55e', '18px 2px 18px 18px', 'linear-gradient(135deg,rgba(34,197,94,.22),rgba(132,204,22,.10))', 'rgba(34,197,94,.46)', '0 14px 28px rgba(34,197,94,.18)', 15, 9, 16, 14, 'center'],
  ['Lavender Soft',        '#faf5ff', 'rgba(88,28,135,.22)', 'rgba(168,85,247,.12)', '#a855f7', '18px', 'linear-gradient(180deg,rgba(216,180,254,.28),rgba(168,85,247,.08))', 'rgba(168,85,247,.38)', '0 14px 30px rgba(168,85,247,.14)', 14, 9, 16, 14, 'center'],
  ['Cyber Green',          '#dcfce7', '#020617', 'rgba(34,197,94,.12)', '#22c55e', '3px', 'rgba(34,197,94,.10)', 'rgba(34,197,94,.62)', '0 0 22px rgba(34,197,94,.20)', 14, 9, 15, 13, 'center'],
  ['Split Radius Big',     '#fff7ed', 'rgba(124,45,18,.22)', 'rgba(251,146,60,.13)', '#fb923c', '30px 30px 6px 30px', 'rgba(251,146,60,.12)', 'rgba(251,146,60,.44)', '0 12px 28px rgba(251,146,60,.16)', 14, 10, 18, 14, 'center'],
  ['Outlined White',       '#0f172a', '#ffffff', 'transparent', '#0f172a', '999px', '#ffffff', 'rgba(15,23,42,.18)', '0 12px 24px rgba(15,23,42,.08)', 14, 9, 16, 14, 'center'],
  ['Deep Purple Bar',      '#ede9fe', 'rgba(46,16,101,.38)', 'rgba(124,58,237,.18)', '#8b5cf6', '12px', 'linear-gradient(135deg,rgba(124,58,237,.30),rgba(46,16,101,.12))', 'rgba(139,92,246,.46)', '0 18px 38px rgba(124,58,237,.22)', 14, 10, 17, 14, 'space-around'],
  ['Sky Floating',         '#075985', '#f0f9ff', 'rgba(14,165,233,.12)', '#0284c7', '999px', 'linear-gradient(180deg,#f0f9ff,#e0f2fe)', 'rgba(2,132,199,.22)', '0 18px 34px rgba(2,132,199,.16)', 16, 11, 18, 14, 'center'],
  ['No Fill Thin Line',    '#cbd5e1', 'transparent', 'transparent', '#cbd5e1', '0', 'transparent', 'transparent', 'none', 22, 6, 6, 13, 'center'],
  ['Heavy Border',         '#f8fafc', 'rgba(15,23,42,.34)', 'rgba(255,255,255,.04)', '#38bdf8', '14px', 'rgba(255,255,255,.04)', 'rgba(56,189,248,.58)', '0 10px 26px rgba(0,0,0,.20)', 12, 9, 16, 14, 'center'],
  ['Warm Clay',            '#431407', '#fff7ed', 'rgba(234,88,12,.14)', '#ea580c', '22px 8px 22px 8px', 'linear-gradient(135deg,#fed7aa,#fdba74)', 'rgba(234,88,12,.34)', '0 16px 32px rgba(234,88,12,.18)', 15, 10, 17, 14, 'center'],
  ['Medical Clean',        '#075985', '#f8fafc', 'rgba(14,165,233,.08)', '#0ea5e9', '10px', '#f8fafc', 'rgba(14,165,233,.22)', '0 10px 24px rgba(14,165,233,.12)', 12, 9, 16, 14, 'center'],
  ['Edu Indigo Chips',     '#312e81', '#eef2ff', 'rgba(99,102,241,.10)', '#6366f1', '999px 999px 6px 999px', 'linear-gradient(135deg,#eef2ff,#e0e7ff)', 'rgba(99,102,241,.28)', '0 14px 28px rgba(99,102,241,.14)', 12, 9, 16, 14, 'center'],
  ['Auto Red Line',        '#450a0a', '#fff1f2', 'rgba(220,38,38,.12)', '#dc2626', '6px', '#fff1f2', 'rgba(220,38,38,.28)', '0 10px 24px rgba(220,38,38,.12)', 14, 10, 18, 14, 'center'],
  ['Real Estate Emerald',  '#064e3b', '#ecfdf5', 'rgba(16,185,129,.12)', '#059669', '18px', '#ecfdf5', 'rgba(5,150,105,.26)', '0 14px 28px rgba(5,150,105,.14)', 14, 10, 18, 14, 'center'],
  ['Logistics Orange',     '#7c2d12', '#fff7ed', 'rgba(249,115,22,.12)', '#f97316', '0 20px 0 20px', '#fff7ed', 'rgba(249,115,22,.30)', '0 14px 28px rgba(249,115,22,.14)', 14, 10, 18, 14, 'space-between'],
  ['Portfolio Ghost',      '#f8fafc', 'transparent', 'transparent', '#f8fafc', '999px', 'rgba(255,255,255,.04)', 'rgba(255,255,255,.10)', 'none', 20, 8, 12, 13, 'center'],
  ['Contrast Dot',         '#ffffff', '#111827', 'rgba(255,255,255,.05)', '#ffffff', '999px 999px 999px 4px', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.12)', '0 12px 24px rgba(0,0,0,.22)', 13, 9, 16, 14, 'center'],
  ['Smooth SaaS',          '#eff6ff', 'rgba(30,41,59,.28)', 'rgba(59,130,246,.12)', '#60a5fa', '16px', 'linear-gradient(135deg,rgba(59,130,246,.20),rgba(255,255,255,.05))', 'rgba(96,165,250,.34)', '0 16px 34px rgba(37,99,235,.16)', 14, 9, 16, 14, 'center'],
  ['Premium Transparent',  '#f8fafc', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.06)', '#f8fafc', '20px', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.14)', 'inset 0 1px 0 rgba(255,255,255,.10),0 20px 44px rgba(0,0,0,.25)', 16, 10, 18, 14, 'center'],
];

function dataItemsAttr(items = DEMO_ITEMS) {
  return escAttr(JSON.stringify(items.map((text, idx) => ({ text, href: idx === 0 ? '/' : `/${String(text).toLowerCase().replace(/\s+/g, '-')}` }))));
}

function levelStyleJson(cfg) {
  const [name, color, rootBg, itemBase, accent, radius, itemBg, border, shadow, gap, py, px, fs] = cfg;
  return escAttr(JSON.stringify({
    1: {
      color,
      bg: itemBg,
      bc: border,
      bw: '1',
      br: radius,
      fs: String(fs),
      fw: '850',
      shadow,
      hColor: color,
      hBg: itemBase,
      hBc: accent,
      hShadow: shadow
    }
  }));
}

function layoutStyleJson(cfg, vertical = false) {
  const gap = cfg[9];
  const py = cfg[10];
  const px = cfg[11];
  const justify = vertical ? 'flex-start' : (cfg[13] || 'center');
  return escAttr(JSON.stringify({ 1: { gap: String(gap), py: String(py), px: String(px), justify, align: vertical ? 'stretch' : 'center' } }));
}

function blockHtml(cfg, index, vertical = false) {
  const [name, color, rootBg, itemBase, accent, radius, itemBg, border, shadow, gap, py, px, fs, justify] = cfg;
  const id = String(index).padStart(2, '0');
  const folderId = vertical ? 'fld_sidebar_menu' : 'fld_menu_header';
  const variant = vertical ? 'sidebar' : 'header';
  const direction = vertical ? 'column' : 'row';
  const width = vertical ? '100%' : 'auto';
  const minWidth = vertical ? '0' : 'max-content';
  // [00383] horizontal menu gets about 10px top/bottom breathing room;
  // sidebar menu uses smaller outer padding so buttons do not look lost inside the block.
  const rootPad = vertical ? '8px 10px' : '10px 12px';
  const listWidth = vertical ? '100%' : 'auto';
  const listJustify = vertical ? 'flex-start' : justify;
  const linkWidth = vertical ? '100%' : 'auto';
  const linkJustify = vertical ? 'flex-start' : 'center';
  const outerClass = `st-menu-design-template st-menu-design-template--${variant} st-menu-design-template--${id}`;
  const listItems = DEMO_ITEMS.map((text, idx) => `
            <li class="st-menu__item" data-menu-depth="1" style="flex:${vertical ? '0 0 auto' : '0 0 auto'};width:${vertical ? '100%' : 'auto'};box-sizing:border-box;">
              <a class="st-menu__link st-block st-block--menu-item" data-st-menu-item="1" href="${idx === 0 ? '/' : '#'}" style="display:inline-flex;align-items:center;justify-content:${linkJustify};gap:8px;min-height:${Math.max(30, py * 2 + 18)}px;width:${linkWidth};min-width:${vertical ? '0' : 'max-content'};padding:${py}px ${px}px;border-radius:${radius};background:${itemBg};border:1px solid ${border};color:${color};text-decoration:none;font-size:${fs}px;font-weight:850;letter-spacing:.01em;line-height:1.12;white-space:nowrap;box-sizing:border-box;box-shadow:${shadow};">
                <span class="st-menu__text" data-st-text-flow="nowrap" style="white-space:nowrap;word-break:normal;overflow-wrap:normal;line-height:1.12;">${escAttr(text)}</span>
              </a>
            </li>`).join('');

  return {
    id: `menu_${variant}_${id}`,
    type: vertical ? 'sidebar' : 'menu',
    name: `${id} · ${name}${vertical ? ' · Sidebar' : ''}`,
    folderId,
    html: `
      <div class="hb-elem st-block st-block--menu ${outerClass}"
        data-st-menu="1"
        data-block-kind="menu"
        data-menu-variant="${vertical ? 'sidebar' : 'big'}"
        data-menu-template-pack="00383"
        data-menu-template-index="${id}"
        data-menu-template-target="${vertical ? 'sidebar' : 'header'}"
        data-name="${vertical ? 'Меню сайтбара' : 'Меню шапки'}"
        data-menu-items="${dataItemsAttr()}"
        data-menu-icon-svg=""
        data-menu-icon-pos="before"
        data-menu-level1-direction="${direction}"
        data-menu-level-styles="${levelStyleJson(cfg)}"
        data-menu-level-content-layout-styles="${layoutStyleJson(cfg, vertical)}"
        style="width:${width};min-width:${minWidth};max-width:100%;min-height:${vertical ? '260px' : '48px'};display:flex;align-items:${vertical ? 'stretch' : 'center'};justify-content:${vertical ? 'flex-start' : 'center'};background:${rootBg};border:1px solid ${border};border-radius:${vertical ? '22px' : '999px'};overflow:visible;color:${color};padding:${rootPad};box-sizing:border-box;--st-menu-root-gap:${gap}px;--st-menu-gap:${gap}px;--st-menu-root-pad-x:${px}px;--st-menu-root-pad-y:${py}px;--st-menu-link-color:${color};--st-menu-link-color-h:${color};--st-menu-link-fs:${fs}px;--st-menu-radius:${radius};--st-menu-item-bg:${itemBg};--st-menu-item-bc:${border};--st-menu-item-bw:1px;--st-menu-item-bs:solid;--st-menu-item-shadow:${shadow};--st-menu-l1-bg:${itemBg};--st-menu-l1-color:${color};--st-menu-l1-bc:${border};--st-menu-l1-bw:1px;--st-menu-l1-br:${radius};--st-menu-l1-fs:${fs}px;--st-menu-l1-shadow:${shadow};--st-menu-l1-h-bg:${itemBase};--st-menu-l1-h-color:${color};--st-menu-l1-h-bc:${accent};--st-menu-l1-h-shadow:${shadow};"
      >
        <nav class="st-menu ${vertical ? 'st-menu--sidebar' : 'st-menu--big'}" aria-label="Menu" style="width:${listWidth};max-width:100%;min-width:0;display:block;">
          <ul class="st-menu__list" data-menu-list-depth="1" style="list-style:none;margin:0;padding:0;display:flex;flex-direction:${direction};align-items:${vertical ? 'stretch' : 'center'};align-content:center;justify-content:${listJustify};gap:${gap}px;flex-wrap:${vertical ? 'nowrap' : 'wrap'};width:${listWidth};max-width:100%;min-width:0;box-sizing:border-box;">
            ${listItems}
          </ul>
        </nav>
      </div>`.trim(),
    previewHtml: '',
    description: `${vertical ? 'Вертикальний' : 'Горизонтальний'} шаблон дизайну меню. При застосуванні зберігає існуючі назви пунктів і посилання вибраного меню.`,
    meta: {
      source: 'system',
      menuDesignTemplate: true,
      menuTarget: vertical ? 'sidebar' : 'header',
      pairedDesignId: `menu_${vertical ? 'header' : 'sidebar'}_${id}`,
      createdAt: '2026-05-23T00:00:00.000Z',
      updatedAt: '2026-05-23T00:00:00.000Z',
      fixedBy: '00383'
    }
  };
}

export function getMenuTemplatesDemo() {
  const out = [];
  DESIGNS.forEach((cfg, idx) => {
    out.push(blockHtml(cfg, idx + 1, false));
    out.push(blockHtml(cfg, idx + 1, true));
  });
  return out.map((tpl) => ({ ...tpl, previewHtml: tpl.previewHtml || tpl.html }));
}

export default getMenuTemplatesDemo;
