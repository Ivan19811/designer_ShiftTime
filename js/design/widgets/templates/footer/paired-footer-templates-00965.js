// 00965-PAIRED-CANONICAL-FOOTER-LIBRARY
// One canonical Footer is generated from each explicit Header/Footer style pair.
// Structure is shared and functional; style tokens are exactly the pair theme.
// No DOM normalizer/adapter is used: model -> HTML is the only render path.

import {
  getHeaderFooterStylePairs00965,
  createPairAreaStyleProfile00965
} from '../style-pairs/header-footer-style-pairs-00965.js';

const MODEL_VERSION_00965 = 'st-hf-json-v1';

function styleText00965_(style) {
  return Object.entries(style || {}).map(([key, value]) => `${key}:${value};`).join('');
}

function node00965_(pair, type, tag, id, attrs = {}, style = {}, children = []) {
  const node = {
    type,
    tag,
    ...(id ? { id } : {}),
    attrs: { ...attrs },
    style: { ...style },
    styleText: styleText00965_(style),
    children
  };
  if (id && ['section', 'level', 'container', 'block'].includes(type)) {
    node.attrs['data-node-id'] = id;
    node.attrs['data-hf-node-type'] = type;
    node.attrs['data-hf-template-id'] = pair.footerTemplateId;
  }
  if (type === 'section') {
    node.attrs['data-hf-json-template'] = '1';
    node.attrs['data-hf-authored-template'] = '00965';
    node.attrs['data-hf-style-pair-id'] = pair.pairId;
    node.attrs['data-hf-style-pair-no'] = pair.no;
  }
  return node;
}

function text00965_(value) {
  return { type: 'text', text: String(value ?? '') };
}

function editable00965_(pair, value, className, style = {}, attrs = {}) {
  return node00965_(pair, 'element', 'span', '', {
    class: className,
    contenteditable: 'true',
    draggable: 'true',
    spellcheck: 'false',
    'data-st-text-target': '1',
    ...attrs
  }, style, [text00965_(value)]);
}

function blockText00965_(pair, id, value, role, style = {}, className = '') {
  return node00965_(pair, 'block', 'div', id, {
    class: `hb-elem st-block st-block--text hf00965-text ${className}`.trim(),
    'data-block-kind': 'text',
    'data-block-role': role,
    'data-name': value,
    'data-hb-tip': value
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '0',
    background: 'transparent', border: '0', overflow: 'visible', padding: '0',
    'box-sizing': 'border-box', ...style
  }, [editable00965_(pair, value, 'st-text-edit hf00965-text__edit', {
    display: 'block', width: '100%', 'max-width': '100%', 'min-width': '0',
    'min-height': '0', height: 'auto', padding: '0', border: '0',
    'line-height': 'inherit', color: 'inherit', 'font-size': 'inherit',
    'font-weight': 'inherit', 'letter-spacing': 'inherit',
    'white-space': 'normal', 'word-break': 'normal', 'overflow-wrap': 'break-word',
    'box-sizing': 'border-box'
  })]);
}

function linkBlock00965_(pair, id, label, href, theme) {
  return node00965_(pair, 'block', 'div', id, {
    class: 'hb-elem st-block st-block--text st-block--link hf00965-link-block',
    'data-block-kind': 'text', 'data-block-role': 'link', 'data-name': label, 'data-hb-tip': label
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '34px', display: 'flex',
    'align-items': 'center', background: 'transparent', border: '0', overflow: 'visible', padding: '0',
    color: theme.colors.text, 'box-sizing': 'border-box'
  }, [node00965_(pair, 'element', 'a', '', {
    href, class: 'st-text-edit hf00965-link', 'data-st-text-target': '1',
    contenteditable: 'true', draggable: 'true', spellcheck: 'false'
  }, {
    display: 'inline-flex', 'align-items': 'center', 'min-height': '34px', color: 'inherit',
    'font-size': theme.links.fontSize, 'font-weight': theme.links.fontWeight,
    'line-height': theme.links.lineHeight, 'text-decoration': 'none',
    'white-space': 'normal', 'word-break': 'normal', 'overflow-wrap': 'break-word',
    'box-sizing': 'border-box'
  }, [text00965_(label)])]);
}

function button00965_(pair, id, label, href, theme, secondary = false) {
  const b = theme.buttons;
  const bg = secondary ? b.secondaryBg : b.primaryBg;
  const fg = secondary ? b.secondaryText : b.primaryText;
  const borderColor = secondary ? b.secondaryBorderColor : b.primaryBorderColor;
  return node00965_(pair, 'block', 'div', id, {
    class: 'hb-elem st-block st-block--button hf00965-button',
    'data-block-kind': 'button', 'data-block-role': 'button', 'data-name': label, 'data-hb-tip': label,
    'data-button-mode': 'text', 'data-button-text': label, 'data-button-href': href,
    'data-button-link-mode': 'custom', 'data-button-click-area': 'all', 'data-button-shape': 'pill',
    'data-button-fill-mode': 'solid', 'data-button-color1': bg
  }, {
    width: 'auto', 'min-width': 'max-content', 'min-height': '46px', display: 'inline-flex',
    'align-items': 'center', 'justify-content': 'center', gap: b.gap, padding: `${b.paddingY} ${b.paddingX}`,
    'border-radius': b.radius, background: bg, color: fg,
    border: `${secondary ? b.secondaryBorderWidth : b.primaryBorderWidth} solid ${borderColor}`,
    'box-shadow': secondary ? 'none' : b.shadow, overflow: 'visible', flex: '0 0 auto',
    'box-sizing': 'border-box'
  }, [editable00965_(pair, label, 'st-text-edit st-button__label', {
    'font-size': b.fontSize, 'font-weight': b.fontWeight, 'line-height': b.lineHeight,
    color: 'inherit', 'white-space': 'nowrap', width: 'auto', 'min-height': '0', height: 'auto',
    padding: '0', border: '0'
  })]);
}

function menu00965_(pair, id, label, items, theme) {
  const lis = items.map(([txt, href], index) => node00965_(pair, 'element', 'li', '', {
    class: 'st-menu__item', 'data-menu-depth': '1'
  }, { width: '100%', 'list-style': 'none' }, [
    node00965_(pair, 'element', 'a', '', {
      href, class: 'st-menu__link st-block st-block--menu-item hf00965-menu__link', 'data-st-menu-item': '1'
    }, {
      display: 'inline-flex', 'align-items': 'center', 'justify-content': 'flex-start',
      width: '100%', 'min-width': '0', 'min-height': '34px', padding: '4px 0',
      background: 'transparent', border: '0', color: theme.menu.text, 'text-decoration': 'none',
      'font-size': theme.menu.fontSize, 'font-weight': theme.menu.fontWeight,
      'line-height': theme.menu.lineHeight, 'box-sizing': 'border-box'
    }, [node00965_(pair, 'element', 'span', '', { class: 'st-menu__text' }, {
      'white-space': 'normal', 'word-break': 'normal', 'overflow-wrap': 'break-word'
    }, [text00965_(txt)])])
  ]));

  return node00965_(pair, 'block', 'div', id, {
    class: 'hb-elem st-block st-block--menu hf00965-menu', 'data-block-kind': 'menu', 'data-name': label,
    'data-hb-tip': label, 'data-st-menu': '1', 'data-menu-variant': 'footer', 'data-menu-level1-direction': 'column',
    'data-menu-items': JSON.stringify(items.map(([text, href]) => ({ text, href, children: [] })))
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', display: 'flex', 'align-items': 'flex-start',
    background: 'transparent', border: '0', overflow: 'visible', padding: '0', color: theme.menu.text,
    'box-sizing': 'border-box'
  }, [node00965_(pair, 'element', 'nav', '', { 'aria-label': label, class: 'st-menu st-menu--footer' }, {
    width: '100%', 'max-width': '100%', 'min-width': '0'
  }, [node00965_(pair, 'element', 'ul', '', { class: 'st-menu__list', 'data-menu-list-depth': '1' }, {
    margin: '0', padding: '0', width: '100%', display: 'flex', 'flex-direction': 'column', gap: '3px',
    'list-style': 'none', 'box-sizing': 'border-box'
  }, lis)])]);
}

function container00965_(pair, id, name, children, style = {}) {
  return node00965_(pair, 'container', 'div', id, {
    class: 'st-block hf00965-container', 'data-st-node': 'container', 'data-layout-mode': 'flex',
    'data-layout-orient': 'column', 'data-name': name
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', display: 'flex', 'flex-direction': 'column',
    gap: '12px', background: 'transparent', border: '0', overflow: 'visible', padding: '0',
    'box-sizing': 'border-box', ...style
  }, children);
}

function buildModel00965_(pair) {
  const t = pair.theme;
  const text = t.colors.text;
  const muted = t.colors.muted;
  const border = t.colors.border;
  const surface = t.sections.bg;
  const surface2 = t.colors.surface2;
  const rootId = `hf${pair.no}_footer_section_001`;
  const brand = pair.brandTitle || pair.shortName || 'BRAND';
  const subtitle = pair.brandSubtitle || 'Сучасний простір';
  const cta = pair.ctaLabel || 'Дізнатися більше';

  const top = node00965_(pair, 'level', 'div', `hf${pair.no}_footer_level_001`, {
    class: 'st-row hf00965-top', 'data-st-node': 'level', 'data-layout-mode': 'fr', 'data-layout-orient': 'row'
  }, {
    display: 'grid', 'grid-template-columns': 'repeat(auto-fit,minmax(280px,1fr))', 'align-items': 'center',
    gap: '24px', width: 'min(1280px,calc(100% - 48px))', margin: '0 auto', padding: '28px 0',
    'box-sizing': 'border-box', overflow: 'visible', 'border-bottom': `1px solid ${border}`
  }, [
    container00965_(pair, `hf${pair.no}_footer_container_001`, 'Бренд та опис', [
      blockText00965_(pair, `hf${pair.no}_footer_block_001`, brand, 'logo', {
        color: text, 'font-size': t.typography.logoTitleSize, 'font-weight': t.typography.logoTitleWeight,
        'line-height': t.typography.logoTitleLineHeight, 'letter-spacing': t.typography.logoTitleLetterSpacing
      }, 'st-block--logo'),
      blockText00965_(pair, `hf${pair.no}_footer_block_002`, subtitle, 'subtitle', {
        color: text, opacity: '.78', 'font-size': '12px', 'font-weight': '750', 'line-height': '1.35',
        'letter-spacing': '.06em', 'text-transform': 'uppercase'
      }),
      blockText00965_(pair, `hf${pair.no}_footer_block_003`, 'Зручна навігація, контакти та основні дії — усе в одному місці.', 'text', {
        color: muted, 'font-size': t.typography.bodySize, 'font-weight': t.typography.textWeight,
        'line-height': t.typography.textLineHeight, 'max-width': '620px'
      })
    ], { gap: '8px' }),
    container00965_(pair, `hf${pair.no}_footer_container_002`, 'CTA', [
      blockText00965_(pair, `hf${pair.no}_footer_block_004`, 'Є питання або готові почати?', 'heading', {
        color: text, 'font-size': '22px', 'font-weight': '850', 'line-height': '1.2'
      }, 'st-block--heading'),
      node00965_(pair, 'container', 'div', `hf${pair.no}_footer_container_003`, {
        class: 'st-block hf00965-actions', 'data-st-node': 'container', 'data-layout-mode': 'flex',
        'data-layout-orient': 'row', 'data-name': 'Дії'
      }, {
        width: '100%', 'min-width': '0', display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap',
        gap: '10px', 'align-items': 'center', 'justify-content': 'flex-start', background: 'transparent',
        border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
      }, [
        button00965_(pair, `hf${pair.no}_footer_block_005`, cta, '#', t, false),
        button00965_(pair, `hf${pair.no}_footer_block_006`, 'Контакти', '#contacts', t, true)
      ])
    ], {
      padding: '18px', background: surface2, border: `1px solid ${border}`,
      'border-radius': t.radius.lg, 'box-shadow': t.shadow.soft
    })
  ]);

  const main = node00965_(pair, 'level', 'div', `hf${pair.no}_footer_level_002`, {
    class: 'st-row hf00965-main', 'data-st-node': 'level', 'data-layout-mode': 'fr', 'data-layout-orient': 'row'
  }, {
    display: 'grid', 'grid-template-columns': 'repeat(auto-fit,minmax(190px,1fr))', 'align-items': 'start',
    gap: '28px', width: 'min(1280px,calc(100% - 48px))', margin: '0 auto', padding: '34px 0',
    'box-sizing': 'border-box', overflow: 'visible'
  }, [
    container00965_(pair, `hf${pair.no}_footer_container_004`, 'Навігація', [
      blockText00965_(pair, `hf${pair.no}_footer_block_007`, 'Навігація', 'heading', { color: text, 'font-size': '14px', 'font-weight': '850', 'line-height': '1.2', 'text-transform': 'uppercase', 'letter-spacing': '.06em' }, 'st-block--heading'),
      menu00965_(pair, `hf${pair.no}_footer_block_008`, 'Навігація', [['Головна','/'],['Про нас','#about'],['Послуги','#services'],['Контакти','#contacts']], t)
    ]),
    container00965_(pair, `hf${pair.no}_footer_container_005`, 'Інформація', [
      blockText00965_(pair, `hf${pair.no}_footer_block_009`, 'Інформація', 'heading', { color: text, 'font-size': '14px', 'font-weight': '850', 'line-height': '1.2', 'text-transform': 'uppercase', 'letter-spacing': '.06em' }, 'st-block--heading'),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_010`, 'Новини', '#news', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_011`, 'FAQ', '#faq', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_012`, 'Документи', '#documents', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_013`, 'Карта сайту', '#sitemap', t)
    ]),
    container00965_(pair, `hf${pair.no}_footer_container_006`, 'Контакти', [
      blockText00965_(pair, `hf${pair.no}_footer_block_014`, 'Контакти', 'heading', { color: text, 'font-size': '14px', 'font-weight': '850', 'line-height': '1.2', 'text-transform': 'uppercase', 'letter-spacing': '.06em' }, 'st-block--heading'),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_015`, '+38 (000) 000-00-00', 'tel:+380000000000', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_016`, 'hello@example.com', 'mailto:hello@example.com', t),
      blockText00965_(pair, `hf${pair.no}_footer_block_017`, 'Україна', 'contact', { color: muted, 'font-size': '14px', 'font-weight': '700', 'line-height': '1.4' })
    ]),
    container00965_(pair, `hf${pair.no}_footer_container_007`, 'Соцмережі', [
      blockText00965_(pair, `hf${pair.no}_footer_block_018`, 'Ми у мережі', 'heading', { color: text, 'font-size': '14px', 'font-weight': '850', 'line-height': '1.2', 'text-transform': 'uppercase', 'letter-spacing': '.06em' }, 'st-block--heading'),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_019`, 'Instagram', '#instagram', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_020`, 'Facebook', '#facebook', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_021`, 'YouTube', '#youtube', t)
    ])
  ]);

  const bottom = node00965_(pair, 'level', 'div', `hf${pair.no}_footer_level_003`, {
    class: 'st-row hf00965-bottom', 'data-st-node': 'level', 'data-layout-mode': 'flex', 'data-layout-orient': 'row'
  }, {
    display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap', 'align-items': 'center',
    'justify-content': 'space-between', gap: '12px', width: 'min(1280px,calc(100% - 48px))',
    margin: '0 auto', padding: '18px 0 22px', border: '0', 'border-top': `1px solid ${border}`,
    overflow: 'visible', 'box-sizing': 'border-box'
  }, [
    container00965_(pair, `hf${pair.no}_footer_container_008`, 'Copyright', [
      blockText00965_(pair, `hf${pair.no}_footer_block_022`, `© 2026 ${brand}. Усі права захищені.`, 'text', {
        color: muted, 'font-size': '12px', 'font-weight': '650', 'line-height': '1.4'
      })
    ], { width: 'auto', flex: '1 1 280px' }),
    node00965_(pair, 'container', 'div', `hf${pair.no}_footer_container_009`, {
      class: 'st-block hf00965-legal', 'data-st-node': 'container', 'data-layout-mode': 'flex',
      'data-layout-orient': 'row', 'data-name': 'Юридичні посилання'
    }, {
      width: 'auto', 'min-width': '0', display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap',
      'align-items': 'center', 'justify-content': 'flex-end', gap: '14px', background: 'transparent',
      border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
    }, [
      linkBlock00965_(pair, `hf${pair.no}_footer_block_023`, 'Конфіденційність', '#privacy', t),
      linkBlock00965_(pair, `hf${pair.no}_footer_block_024`, 'Умови', '#terms', t)
    ])
  ]);

  const root = node00965_(pair, 'section', 'footer', rootId, {
    class: 'st-section hf00965-footer-section', 'data-sec-role': 'footer', role: 'contentinfo'
  }, {
    width: '100%', 'box-sizing': 'border-box', padding: '18px 0 0', margin: '0',
    background: surface, color: text, border: '0', 'border-top': `1px solid ${border}`,
    'border-radius': '0', 'box-shadow': t.sections.shadow, overflow: 'visible',
    'font-family': t.typography.textFont
  }, [top, main, bottom]);

  return {
    version: MODEL_VERSION_00965,
    schema: 'section-level-container-block-dom-v1',
    scope: 'footer',
    templateId: pair.footerTemplateId,
    sourcePolicy: 'PAIR_MODEL_IS_SOURCE_OF_TRUTH_00965',
    renderPolicy: 'DOM is rendered from this canonical model; no runtime normalizer/adapter.',
    root
  };
}

function escAttr00965_(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escText00965_(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderNode00965_(node) {
  if (!node) return '';
  if (node.type === 'text') return escText00965_(node.text || '');
  const tag = String(node.tag || 'div').toLowerCase();
  const attrs = { ...(node.attrs || {}) };
  if (node.styleText != null && node.styleText !== '') attrs.style = String(node.styleText);
  const attrText = Object.entries(attrs).map(([key, val]) => val === true || val === '' ? ` ${key}` : ` ${key}="${escAttr00965_(val)}"`).join('');
  const children = Array.isArray(node.children) ? node.children.map(renderNode00965_).join('') : '';
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  if (voidTags.has(tag)) return `<${tag}${attrText}>`;
  return `<${tag}${attrText}>${children}</${tag}>`;
}
function clone00965_(value) { return JSON.parse(JSON.stringify(value)); }

const RAW_00965 = getHeaderFooterStylePairs00965().map((pair) => {
  const model = buildModel00965_(pair);
  return {
    id: pair.footerTemplateId,
    type: 'footer',
    folderId: 'fld_footer',
    name: `${pair.no} · ${pair.name} · FOOTER`,
    styleName: `${pair.no} · ${pair.name} · Footer`,
    preview: `paired-footer-${pair.no}`,
    description: `Парний футер до Header ${pair.no}. Однакові дизайн-токени, стандартні ключі та канонічна JSON-модель.`,
    meta: {
      source: 'system',
      palette: pair.palette,
      pairId: pair.pairId,
      pairNo: pair.no,
      pairName: pair.name,
      pairedHeaderTemplateId: pair.headerTemplateId,
      pairContract: 'header-footer-style-pair-v1-00965',
      modelContract: MODEL_VERSION_00965,
      singleSourceOfTruth: 'model',
      standardKeys00965: true,
      generatedPairFooter00965: true,
      tools: ['section','row','container','logo','menu','text','button','link']
    },
    modelVersion: MODEL_VERSION_00965,
    model,
    styleProfile: createPairAreaStyleProfile00965(pair, 'footer', pair.footerTemplateId),
    html: renderNode00965_(model.root)
  };
});

export const PAIRED_FOOTER_TEMPLATES_00965 = Object.freeze(RAW_00965.map(Object.freeze));
export function getPairedFooterTemplates00965() { return PAIRED_FOOTER_TEMPLATES_00965.map(clone00965_); }
