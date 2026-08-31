// 00964-SCHOOL-01-FOOTER-CTA-COLLISION-PARITY
// 00963 keeps the 00962 model API but marks authored footer geometry so legacy canvas clipping cannot alter it.
// Canonical School 01 footer JSON. The model is the source of truth; HTML is
// rendered from the same model for gallery preview and the footer runtime.

import { SCHOOL_01_STYLE_PROFILES_00956 } from '../collections/school-01-collection-contract.js?v=00965';

export const SCHOOL_01_FOOTER_TEMPLATE_ID_00962 = 'school-01-footer';
export const SCHOOL_01_FOOTER_MODEL_VERSION_00962 = 'st-hf-json-v1';

const TEMPLATE_ID_00962 = SCHOOL_01_FOOTER_TEMPLATE_ID_00962;

const ICONS_00962 = Object.freeze({
  book: [['path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }], ['path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z' }], ['path', { d: 'M8 7h8M8 11h6' }]],
  phone: [['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.29a2 2 0 0 1 2.11-.45c.83.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z' }]],
  mail: [['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }], ['path', { d: 'm22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7' }]],
  pin: [['path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z' }], ['circle', { cx: '12', cy: '10', r: '3' }]],
  clock: [['circle', { cx: '12', cy: '12', r: '9' }], ['path', { d: 'M12 7v5l3 2' }]],
  arrow: [['path', { d: 'M5 12h14' }], ['path', { d: 'm13 6 6 6-6 6' }]],
  up: [['path', { d: 'm18 15-6-6-6 6' }]],
  eye: [['path', { d: 'M2.1 12a10.8 10.8 0 0 1 19.8 0 10.8 10.8 0 0 1-19.8 0Z' }], ['circle', { cx: '12', cy: '12', r: '3' }]],
  instagram: [['rect', { x: '3', y: '3', width: '18', height: '18', rx: '5' }], ['circle', { cx: '12', cy: '12', r: '4' }], ['circle', { cx: '17.5', cy: '6.5', r: '1' }]],
  facebook: [['path', { d: 'M14 8h4V3h-4c-3 0-5 2-5 5v3H6v5h3v5h5v-5h4l1-5h-5V8c0-.7.3-1 1-1Z' }]],
  youtube: [['path', { d: 'M22 12s0-4-1-6c-.5-1-1.5-1.5-2.5-1.7C16.5 4 12 4 12 4s-4.5 0-6.5.3C4.5 4.5 3.5 5 3 6c-1 2-1 6-1 6s0 4 1 6c.5 1 1.5 1.5 2.5 1.7C7.5 20 12 20 12 20s4.5 0 6.5-.3c1-.2 2-.7 2.5-1.7 1-2 1-6 1-6Z' }], ['path', { d: 'm10 9 5 3-5 3Z' }]],
  shield: [['path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z' }], ['path', { d: 'm9 12 2 2 4-4' }]],
  calendar: [['rect', { x: '3', y: '5', width: '18', height: '16', rx: '2' }], ['path', { d: 'M16 3v4M8 3v4M3 10h18' }]]
});

function styleText00962_(style) {
  return Object.entries(style || {}).map(([key, value]) => `${key}:${value};`).join('');
}

function node00962_(type, tag, id, attrs, style, children = []) {
  const node = {
    type,
    tag,
    ...(id ? { id } : {}),
    attrs: { ...(attrs || {}) },
    style: { ...(style || {}) },
    styleText: styleText00962_(style),
    children
  };
  const className00963 = String(node.attrs?.class || '');
  const authoredShape00963 = ['section', 'level', 'container', 'block'].includes(type) || /(^|\s)(st-row|st-block)(\s|$)/.test(className00963);
  if (authoredShape00963) {
    node.attrs['data-hf-authored-template'] = '00963';
  }
  if (id && ['section', 'level', 'container', 'block'].includes(type)) {
    node.attrs['data-node-id'] = id;
    node.attrs['data-hf-node-type'] = type;
    node.attrs['data-hf-template-id'] = TEMPLATE_ID_00962;
  }
  return node;
}

const text00962_ = (value) => ({ type: 'text', text: String(value ?? '') });

function svg00962_(name, className = '') {
  const shapes = (ICONS_00962[name] || []).map(([tag, attrs]) => node00962_('element', tag, '', attrs, {}, []));
  return node00962_('element', 'svg', '', {
    class: className,
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2',
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true'
  }, { width: '100%', height: '100%', display: 'block' }, shapes);
}

function editable00962_(value, className, style = {}, attrs = {}) {
  return node00962_('element', 'span', '', {
    class: className, contenteditable: 'true', draggable: 'true', spellcheck: 'false', 'data-st-text-target': '1', ...attrs
  }, style, [text00962_(value)]);
}

function textBlock00962_(id, value, style = {}, options = {}) {
  return node00962_('block', 'div', id, {
    class: `hb-elem st-block st-block--text ${options.heading ? 'st-block--heading ' : ''}${options.className || ''}`.trim(),
    'data-block-kind': 'text', ...(options.heading ? { 'data-block-role': 'heading' } : {}),
    'data-name': options.name || value, 'data-hb-tip': options.name || value
  }, {
    width: options.width || '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '0',
    background: 'transparent', border: '0', 'border-radius': '0', overflow: 'visible',
    padding: options.heading ? '2px 3px 3px' : '0', 'box-sizing': 'border-box', ...style
  }, [editable00962_(value, `st-text-edit ${options.heading ? 'st-heading__text ' : ''}${options.textClass || ''}`.trim(), {
    display: 'block', width: '100%', 'max-width': '100%', 'min-width': '0', 'min-height': '0', height: 'auto',
    padding: '0', border: '0', color: 'inherit', 'font-size': 'inherit', 'font-weight': 'inherit',
    'line-height': 'inherit', 'letter-spacing': 'inherit', 'word-break': 'normal', 'overflow-wrap': 'break-word',
    'box-sizing': 'border-box'
  })]);
}

function linkBlock00962_(id, label, href, options = {}) {
  return node00962_('block', 'div', id, {
    class: `hb-elem st-block st-block--text st-block--link school01-footer-link-block ${options.className || ''}`.trim(),
    'data-block-kind': 'text', 'data-block-role': 'link', 'data-name': label, 'data-hb-tip': label
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '34px', display: 'flex',
    'align-items': 'center', background: 'transparent', border: '0', overflow: 'visible', color: '#dbeafe',
    padding: '0', 'box-sizing': 'border-box'
  }, [node00962_('element', 'a', '', {
    href, class: 'st-text-edit school01-footer-link', 'data-st-text-target': '1', contenteditable: 'true', draggable: 'true', spellcheck: 'false'
  }, {
    display: 'inline-flex', 'align-items': 'center', 'min-height': '34px', color: 'inherit', 'font-size': '14px',
    'font-weight': '650', 'line-height': '1.35', 'text-decoration': 'none', 'box-sizing': 'border-box'
  }, [text00962_(label)])]);
}

function iconLink00962_(id, iconName, label, href, options = {}) {
  return node00962_('block', 'div', id, {
    class: `hb-elem st-block st-block--text school01-footer-contact ${options.className || ''}`.trim(),
    'data-block-kind': 'text', 'data-block-role': 'contact', 'data-name': options.name || label, 'data-hb-tip': options.name || label
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '42px', display: 'flex',
    'align-items': 'center', gap: '10px', background: 'transparent', border: '0', overflow: 'visible', color: '#ffffff',
    padding: '0', 'box-sizing': 'border-box'
  }, [
    node00962_('element', 'span', '', { class: 'school01-footer-contact__icon', 'aria-hidden': 'true' }, {
      width: '34px', height: '34px', 'min-width': '34px', display: 'inline-flex', 'align-items': 'center',
      'justify-content': 'center', color: '#fcd34d', background: 'rgba(252,211,77,.10)', border: '1px solid rgba(252,211,77,.22)',
      'border-radius': '11px', padding: '8px', 'box-sizing': 'border-box'
    }, [svg00962_(iconName)]),
    node00962_('element', 'a', '', {
      href, class: 'st-text-edit school01-footer-contact__link', 'data-st-text-target': '1', contenteditable: 'true', draggable: 'true', spellcheck: 'false'
    }, {
      color: '#ffffff', 'font-size': '14px', 'font-weight': '700', 'line-height': '1.4', 'text-decoration': 'none',
      'word-break': 'normal', 'overflow-wrap': 'break-word'
    }, [text00962_(label)])
  ]);
}

function button00962_(id, label, href, options = {}) {
  const primary = options.primary !== false;
  return node00962_('block', 'div', id, {
    class: `hb-elem st-block st-block--button school01-footer-button ${options.className || ''}`.trim(),
    'data-block-kind': 'button', 'data-block-role': 'button', 'data-name': label, 'data-hb-tip': label,
    'data-button-mode': 'text-icon', 'data-button-icon-pos': options.iconPos || 'right', 'data-button-text': label,
    'data-button-href': href, 'data-button-link-mode': 'custom', 'data-button-click-area': 'all', 'data-button-shape': 'pill',
    'data-button-fill-mode': primary ? 'gradient' : 'solid', 'data-button-color1': primary ? '#fcd34d' : '#fffdf5',
    'data-button-color2': primary ? '#b45309' : '#fffdf5'
  }, {
    width: options.width || 'auto', 'min-width': options.width === '100%' ? '0' : 'max-content', 'min-height': '48px',
    display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', gap: '10px', padding: '12px 19px',
    'border-radius': '999px', background: primary ? 'linear-gradient(135deg,#fcd34d,#b45309)' : 'rgba(255,255,255,.08)',
    color: primary ? '#102a43' : '#ffffff', border: primary ? '1px solid #fcd34d' : '1px solid rgba(255,255,255,.22)',
    'box-shadow': primary ? '0 16px 34px rgba(0,0,0,.22)' : 'none', overflow: 'visible', flex: '0 0 auto',
    'box-sizing': 'border-box', cursor: 'pointer', '--st-button-radius': '999px'
  }, [
    ...(options.iconPos === 'left' ? [node00962_('element', 'button', '', { type: 'button', class: 'st-icon-btn st-button__iconbtn', 'aria-label': `${label}: іконка` }, { width: '18px', height: '18px', display: 'inline-flex', padding: '0', border: '0', background: 'transparent', color: 'inherit' }, [svg00962_(options.icon || 'arrow')])] : []),
    editable00962_(label, 'st-text-edit st-button__label', { 'font-size': '14px', 'font-weight': '850', 'line-height': '1.2', color: 'inherit', 'white-space': 'nowrap' }),
    ...(options.iconPos !== 'left' ? [node00962_('element', 'button', '', { type: 'button', class: 'st-icon-btn st-button__iconbtn', 'aria-label': `${label}: іконка` }, { width: '18px', height: '18px', display: 'inline-flex', padding: '0', border: '0', background: 'transparent', color: 'inherit' }, [svg00962_(options.icon || 'arrow')])] : [])
  ]);
}

function iconAction00962_(id, iconName, label, href = '#', options = {}) {
  return node00962_('block', 'div', id, {
    class: `hb-elem st-block st-block--icon school01-footer-icon-action ${options.className || ''}`.trim(),
    'data-block-kind': 'icon', 'data-name': label, 'data-hb-tip': label
  }, {
    width: '44px', 'min-width': '44px', 'min-height': '44px', display: 'flex', 'align-items': 'center',
    'justify-content': 'center', background: 'transparent', border: '0', overflow: 'visible', color: '#ffffff',
    flex: '0 0 44px', 'box-sizing': 'border-box'
  }, [node00962_('element', 'a', '', { href, class: 'st-icon-btn school01-footer-icon-action__button', 'aria-label': label }, {
    width: '44px', height: '44px', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
    border: '1px solid rgba(255,255,255,.16)', 'border-radius': '14px', background: 'rgba(255,255,255,.06)',
    color: '#ffffff', padding: '11px', 'box-sizing': 'border-box', 'text-decoration': 'none'
  }, [svg00962_(iconName)])]);
}

function logo00962_() {
  return node00962_('block', 'div', 'school01_footer_logo_001', {
    class: 'hb-elem st-block st-block--text st-block--logo school01-footer-logo', 'data-block-kind': 'text',
    'data-block-role': 'logo', 'data-name': 'Логотип ліцею', 'data-hb-tip': 'Логотип ліцею',
    'data-logo-mode': 'logo-text-subtitle', 'data-logo-source': 'icon', 'data-logo-pos': 'left',
    'data-logo-link-mode': 'home', 'data-logo-click-area': 'all', 'data-logo-fit': 'contain', 'data-logo-align': 'center',
    'data-logo-gap': '13', 'data-logo-mark-width': '54', 'data-logo-mark-height': '54', 'data-logo-title-size': '22',
    'data-logo-subtitle-size': '11'
  }, {
    width: 'auto', 'min-width': '0', 'max-width': '100%', 'min-height': '58px', display: 'grid',
    'grid-template-columns': 'auto minmax(0,1fr)', 'grid-template-rows': 'auto auto', 'align-items': 'center',
    'column-gap': '13px', 'row-gap': '3px', background: 'transparent', border: '0', overflow: 'visible',
    color: '#ffffff', padding: '0', 'box-sizing': 'border-box'
  }, [
    node00962_('element', 'button', '', { type: 'button', class: 'st-logo__iconbtn school01-footer-logo__mark', 'aria-label': 'Ліцей Обрій — на головну' }, {
      'grid-column': '1', 'grid-row': '1 / span 2', width: '54px', height: '54px', display: 'inline-flex',
      'align-items': 'center', 'justify-content': 'center', border: '1px solid rgba(252,211,77,.5)', 'border-radius': '16px',
      background: 'linear-gradient(145deg,#fef3c7,#fcd34d)', color: '#102a43', padding: '13px',
      'box-shadow': '0 14px 32px rgba(0,0,0,.22)', 'box-sizing': 'border-box'
    }, [svg00962_('book')]),
    editable00962_('ЛІЦЕЙ «ОБРІЙ»', 'st-text-edit st-logo__title school01-footer-logo__title', {
      'grid-column': '2', 'grid-row': '1', 'font-family': 'Manrope, Inter, Arial, sans-serif', 'font-size': '22px',
      'font-weight': '900', 'line-height': '1.08', 'letter-spacing': '-.02em', color: '#ffffff', 'white-space': 'nowrap'
    }, { 'data-logo-title': '1' }),
    editable00962_('ОСВІТА, ЩО ВІДКРИВАЄ МАЙБУТНЄ', 'st-text-edit st-logo__subtitle school01-footer-logo__subtitle', {
      'grid-column': '2', 'grid-row': '2', 'font-family': 'Manrope, Inter, Arial, sans-serif', 'font-size': '11px',
      'font-weight': '750', 'line-height': '1.2', 'letter-spacing': '.09em', color: '#fde68a', 'white-space': 'nowrap'
    }, { 'data-logo-subtitle': '1' })
  ]);
}

function menuBlock00962_(id, label, items, options = {}) {
  const horizontal = options.horizontal === true;
  const itemNodes = items.map(([text, href]) => node00962_('element', 'li', '', {
    class: 'st-menu__item', 'data-menu-depth': '1'
  }, { width: horizontal ? 'auto' : '100%', flex: horizontal ? '0 0 auto' : '0 0 auto' }, [
    node00962_('element', 'a', '', {
      class: `st-menu__link st-block st-block--menu-item school01-footer-menu__link${options.compact ? ' school01-footer-menu__link--compact' : ''}`,
      href, 'data-st-menu-item': '1'
    }, {
      display: 'inline-flex', 'align-items': 'center', 'justify-content': 'flex-start', 'min-height': options.compact ? '34px' : '40px',
      width: horizontal ? 'auto' : '100%', 'min-width': '0', padding: options.compact ? '4px 0' : '6px 0',
      background: 'transparent', border: '0', color: options.compact ? '#aebdcb' : '#dbeafe', 'text-decoration': 'none',
      'font-size': options.compact ? '12px' : '14px', 'font-weight': options.compact ? '650' : '650', 'line-height': '1.35',
      'box-sizing': 'border-box'
    }, [node00962_('element', 'span', '', { class: 'st-menu__text' }, {}, [text00962_(text)])])
  ]));
  return node00962_('block', 'div', id, {
    class: `hb-elem st-block st-block--menu school01-footer-menu${options.compact ? ' school01-footer-menu--compact' : ''}`,
    'data-block-kind': 'menu', 'data-name': label, 'data-hb-tip': label, 'data-st-menu': '1', 'data-menu-variant': 'footer',
    'data-menu-level1-direction': horizontal ? 'row' : 'column', 'data-menu-icon-pos': 'before',
    'data-menu-items': JSON.stringify(items.map(([text, href]) => ({ text, href, children: [] })))
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '0', display: 'flex', 'align-items': 'flex-start',
    background: 'transparent', border: '0', overflow: 'visible', color: '#dbeafe', 'box-sizing': 'border-box'
  }, [node00962_('element', 'nav', '', { class: 'st-menu st-menu--footer', 'aria-label': label }, { width: '100%', 'max-width': '100%', 'min-width': '0' }, [
    node00962_('element', 'ul', '', { class: 'st-menu__list', 'data-menu-list-depth': '1' }, {
      'list-style': 'none', margin: '0', padding: '0', display: 'flex', 'flex-direction': horizontal ? 'row' : 'column',
      'align-items': horizontal ? 'center' : 'stretch', 'justify-content': horizontal ? 'flex-end' : 'flex-start',
      gap: horizontal ? '5px 16px' : '2px', 'flex-wrap': horizontal ? 'wrap' : 'nowrap', width: '100%', 'box-sizing': 'border-box'
    }, itemNodes)
  ])]);
}

function navColumn00962_(idPrefix, title, items) {
  return node00962_('container', 'div', `${idPrefix}_container`, {
    class: 'st-block school01-footer-nav-column', 'data-layout-mode': 'flex', 'data-layout-orient': 'column',
    'data-st-node': 'container', 'data-name': title
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', display: 'flex', 'flex-direction': 'column', gap: '8px',
    background: 'transparent', border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
  }, [
    textBlock00962_(`${idPrefix}_heading`, title, {
      color: '#fde68a', 'font-size': '12px', 'font-weight': '850', 'line-height': '1.2', 'letter-spacing': '.08em',
      'text-transform': 'uppercase', 'margin-bottom': '5px'
    }, { heading: true, name: title }),
    menuBlock00962_(`${idPrefix}_menu`, `${title} — навігація`, items)
  ]);
}

const ctaLevel00962_ = node00962_('level', 'div', 'school01_footer_cta_level_001', {
  class: 'st-row school01-footer-cta-row', 'data-layout-mode': 'fr', 'data-layout-orient': 'row', 'data-st-node': 'level'
}, {
  display: 'grid', 'grid-template-columns': 'minmax(0,1.35fr) max-content', 'align-items': 'center', gap: '28px',
  width: 'min(1280px,calc(100% - 48px))', margin: '0 auto', padding: '34px 38px', background: 'linear-gradient(120deg,rgba(255,255,255,.10),rgba(255,255,255,.04))',
  border: '1px solid rgba(255,255,255,.14)', 'border-radius': '28px', 'box-shadow': '0 24px 72px rgba(0,0,0,.18)',
  overflow: 'visible', 'box-sizing': 'border-box', 'backdrop-filter': 'blur(12px)'
}, [
  node00962_('container', 'div', 'school01_footer_cta_copy_001', {
    class: 'st-block school01-footer-cta-copy', 'data-layout-mode': 'flex', 'data-layout-orient': 'column', 'data-st-node': 'container', 'data-name': 'Вступний заклик'
  }, {
    width: '100%', 'min-width': '0', display: 'flex', 'flex-direction': 'column', gap: '8px', background: 'transparent', border: '0', padding: '0', overflow: 'visible'
  }, [
    textBlock00962_('school01_footer_cta_eyebrow_001', 'ВСТУП · 2026/2027', { color: '#fde68a', 'font-size': '11px', 'font-weight': '850', 'letter-spacing': '.12em', 'line-height': '1.2' }),
    textBlock00962_('school01_footer_cta_title_001', 'Готові побачити, як дитина може рости в сильному середовищі?', {
      color: '#ffffff', 'font-size': '30px', 'font-weight': '900', 'line-height': '1.12', 'letter-spacing': '-.025em'
    }, { heading: true, name: 'CTA заголовок' }),
    textBlock00962_('school01_footer_cta_text_001', 'Запишіться на знайомство з ліцеєм або поставте запитання нашій приймальній комісії.', {
      color: '#cbd5e1', 'font-size': '14px', 'font-weight': '550', 'line-height': '1.55'
    })
  ]),
  node00962_('container', 'div', 'school01_footer_cta_actions_001', {
    class: 'st-block school01-footer-cta-actions', 'data-layout-mode': 'flex', 'data-layout-orient': 'row', 'data-st-node': 'container', 'data-name': 'CTA дії'
  }, {
    width: 'auto', 'min-width': '0', display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap', 'align-items': 'center',
    'justify-content': 'flex-end', gap: '10px', background: 'transparent', border: '0', padding: '0', overflow: 'visible'
  }, [
    button00962_('school01_footer_cta_phone_001', 'Зателефонувати', 'tel:+380441234567', { primary: false, iconPos: 'left', icon: 'phone' }),
    button00962_('school01_footer_cta_apply_001', 'Подати заяву', '/admission', { primary: true, icon: 'arrow' })
  ])
]);

const mainLevel00962_ = node00962_('level', 'div', 'school01_footer_main_level_001', {
  class: 'st-row school01-footer-main-row', 'data-layout-mode': 'fr', 'data-layout-orient': 'row', 'data-st-node': 'level'
}, {
  display: 'grid', 'grid-template-columns': 'minmax(280px,1.35fr) repeat(3,minmax(150px,.72fr)) minmax(240px,1fr)',
  'align-items': 'start', gap: '34px', width: 'min(1280px,calc(100% - 48px))', margin: '0 auto', padding: '56px 0 44px',
  overflow: 'visible', 'box-sizing': 'border-box'
}, [
  node00962_('container', 'div', 'school01_footer_identity_001', {
    class: 'st-block school01-footer-identity', 'data-layout-mode': 'flex', 'data-layout-orient': 'column', 'data-st-node': 'container', 'data-name': 'Ліцей та контакти'
  }, {
    width: '100%', 'min-width': '0', display: 'flex', 'flex-direction': 'column', gap: '18px', background: 'transparent', border: '0', overflow: 'visible', padding: '0'
  }, [
    logo00962_(),
    textBlock00962_('school01_footer_description_001', 'Сучасний український ліцей у Києві: сильна академічна база, тьюторська підтримка, проєкти та спільнота, де дитину бачать і чують.', {
      color: '#b9c7d6', 'font-size': '14px', 'font-weight': '530', 'line-height': '1.62', 'max-width': '360px'
    }),
    node00962_('container', 'div', 'school01_footer_contacts_001', {
      class: 'st-block school01-footer-contacts', 'data-layout-mode': 'flex', 'data-layout-orient': 'column', 'data-st-node': 'container', 'data-name': 'Контакти'
    }, {
      width: '100%', display: 'flex', 'flex-direction': 'column', gap: '5px', background: 'transparent', border: '0', padding: '0', overflow: 'visible'
    }, [
      iconLink00962_('school01_footer_phone_001', 'phone', '+38 (044) 123-45-67', 'tel:+380441234567', { name: 'Телефон' }),
      iconLink00962_('school01_footer_mail_001', 'mail', 'info@obriy-lyceum.ua', 'mailto:info@obriy-lyceum.ua', { name: 'Електронна пошта' }),
      iconLink00962_('school01_footer_address_001', 'pin', 'м. Київ, вул. Освітня, 12', '/contacts', { name: 'Адреса' })
    ]),
    node00962_('container', 'div', 'school01_footer_socials_001', {
      class: 'st-block school01-footer-socials', 'data-layout-mode': 'flex', 'data-layout-orient': 'row', 'data-st-node': 'container', 'data-name': 'Соціальні мережі'
    }, {
      width: '100%', display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap', gap: '8px', background: 'transparent', border: '0', padding: '0', overflow: 'visible'
    }, [
      iconAction00962_('school01_footer_instagram_001', 'instagram', 'Instagram', '#'),
      iconAction00962_('school01_footer_facebook_001', 'facebook', 'Facebook', '#'),
      iconAction00962_('school01_footer_youtube_001', 'youtube', 'YouTube', '#')
    ])
  ]),
  navColumn00962_('school01_footer_school', 'Ліцей', [
    ['Про ліцей', '/about'], ['Команда', '/team'], ['Новини', '/news'], ['Контакти', '/contacts']
  ]),
  navColumn00962_('school01_footer_education', 'Навчання', [
    ['1–4 класи', '/education/primary'], ['5–9 класи', '/education/basic'], ['10–11 класи', '/education/senior'], ['Гуртки та студії', '/activities']
  ]),
  navColumn00962_('school01_footer_public', 'Батькам і громаді', [
    ['Розклад занять', '/schedule'], ['Е-щоденник', '/journal'], ['Публічна інформація', '/documents'], ['Протидія булінгу', '/anti-bullying'], ['Ліцензії та звітність', '/documents/licenses']
  ]),
  node00962_('container', 'div', 'school01_footer_admission_001', {
    class: 'st-block school01-footer-admission', 'data-layout-mode': 'flex', 'data-layout-orient': 'column', 'data-st-node': 'container', 'data-name': 'Вступ та графік'
  }, {
    width: '100%', 'min-width': '0', display: 'flex', 'flex-direction': 'column', gap: '13px', padding: '22px',
    background: 'linear-gradient(160deg,rgba(252,211,77,.12),rgba(255,255,255,.045))', border: '1px solid rgba(252,211,77,.22)',
    'border-radius': '22px', overflow: 'visible', 'box-sizing': 'border-box'
  }, [
    textBlock00962_('school01_footer_admission_kicker_001', 'ПРИЙМАЛЬНА КОМІСІЯ', { color: '#fde68a', 'font-size': '11px', 'font-weight': '850', 'letter-spacing': '.1em', 'line-height': '1.2' }),
    textBlock00962_('school01_footer_admission_title_001', 'Вступ до ліцею', { color: '#ffffff', 'font-size': '22px', 'font-weight': '900', 'line-height': '1.15' }, { heading: true }),
    textBlock00962_('school01_footer_admission_text_001', 'Правила прийому, перелік документів та консультація для батьків — в одному місці.', { color: '#cbd5e1', 'font-size': '13px', 'font-weight': '550', 'line-height': '1.55' }),
    node00962_('container', 'div', 'school01_footer_hours_001', {
      class: 'st-block school01-footer-hours', 'data-layout-mode': 'flex', 'data-layout-orient': 'row', 'data-st-node': 'container', 'data-name': 'Графік роботи'
    }, {
      width: '100%', display: 'flex', 'align-items': 'center', gap: '10px', padding: '10px 12px', background: 'rgba(5,20,35,.34)',
      border: '1px solid rgba(255,255,255,.10)', 'border-radius': '14px', overflow: 'visible', 'box-sizing': 'border-box'
    }, [
      node00962_('element', 'span', '', { 'aria-hidden': 'true' }, { width: '18px', height: '18px', color: '#fcd34d', display: 'inline-flex', flex: '0 0 18px' }, [svg00962_('clock')]),
      textBlock00962_('school01_footer_hours_text_001', 'Пн–Пт · 08:00–18:00', { color: '#ffffff', 'font-size': '12px', 'font-weight': '750', 'line-height': '1.3' })
    ]),
    button00962_('school01_footer_admission_button_001', 'Правила вступу', '/admission', { primary: true, width: '100%', icon: 'arrow' }),
    linkBlock00962_('school01_footer_consult_link_001', 'Записатися на консультацію', '/contacts', { className: 'school01-footer-link-block--accent' })
  ])
]);

const bottomLevel00962_ = node00962_('level', 'div', 'school01_footer_bottom_level_001', {
  class: 'st-row school01-footer-bottom-row', 'data-layout-mode': 'fr', 'data-layout-orient': 'row', 'data-st-node': 'level'
}, {
  display: 'grid', 'grid-template-columns': 'minmax(0,1fr) auto auto', 'align-items': 'center', gap: '18px',
  width: 'min(1280px,calc(100% - 48px))', margin: '0 auto', padding: '20px 0 26px', border: '0', 'border-top': '1px solid rgba(255,255,255,.12)',
  overflow: 'visible', 'box-sizing': 'border-box'
}, [
  node00962_('container', 'div', 'school01_footer_copyright_001', {
    class: 'st-block school01-footer-copyright', 'data-layout-mode': 'flex', 'data-layout-orient': 'column', 'data-st-node': 'container', 'data-name': 'Авторське право'
  }, {
    width: '100%', 'min-width': '0', display: 'flex', 'flex-direction': 'column', gap: '4px', background: 'transparent', border: '0', padding: '0', overflow: 'visible'
  }, [
    textBlock00962_('school01_footer_copyright_text_001', '© 2026 Ліцей «Обрій». Усі права захищені.', { color: '#cbd5e1', 'font-size': '12px', 'font-weight': '650', 'line-height': '1.4' }),
    textBlock00962_('school01_footer_copyright_note_001', 'Освітній простір, створений з повагою до дитини, родини та спільноти.', { color: '#8193a6', 'font-size': '11px', 'font-weight': '550', 'line-height': '1.4' })
  ]),
  node00962_('container', 'div', 'school01_footer_legal_001', {
    class: 'st-block school01-footer-legal', 'data-layout-mode': 'flex', 'data-layout-orient': 'row', 'data-st-node': 'container', 'data-name': 'Юридичні та сервісні посилання'
  }, {
    width: 'auto', 'min-width': '0', display: 'flex', 'align-items': 'center', 'justify-content': 'flex-end',
    background: 'transparent', border: '0', padding: '0', overflow: 'visible'
  }, [menuBlock00962_('school01_footer_legal_menu_001', 'Сервісні посилання', [
    ['Конфіденційність', '/privacy'], ['Карта сайту', '/sitemap'], ['Доступність', '/accessibility']
  ], { horizontal: true, compact: true })]),
  node00962_('container', 'div', 'school01_footer_backtop_001', {
    class: 'st-block school01-footer-backtop', 'data-layout-mode': 'flex', 'data-layout-orient': 'row', 'data-st-node': 'container', 'data-name': 'Повернутися нагору'
  }, {
    width: 'auto', display: 'flex', 'align-items': 'center', 'justify-content': 'flex-end', background: 'transparent', border: '0', padding: '0', overflow: 'visible'
  }, [iconAction00962_('school01_footer_backtop_button_001', 'up', 'Повернутися нагору', '#site-root', { className: 'school01-footer-icon-action--top' })])
]);

const footerSection00962_ = node00962_('section', 'footer', 'school01_footer_section_001', {
  class: 'st-section school01-footer-section', 'data-sec-role': 'footer', 'data-hf-json-template': '1',
  'data-school01-footer': '1', role: 'contentinfo'
}, {
  width: '100%', 'box-sizing': 'border-box', padding: '42px 0 0', margin: '0', color: '#ffffff', border: '0',
  'border-radius': '0', 'box-shadow': 'none', overflow: 'visible', position: 'relative', isolation: 'isolate',
  'font-family': 'Manrope, Inter, Arial, sans-serif',
  background: 'radial-gradient(circle at 82% 8%,rgba(180,83,9,.20),transparent 24%),radial-gradient(circle at 18% 100%,rgba(41,78,109,.40),transparent 32%),linear-gradient(145deg,#071a2b 0%,#102a43 50%,#0b2238 100%)'
}, [ctaLevel00962_, mainLevel00962_, bottomLevel00962_]);

export const SCHOOL_01_FOOTER_MODEL_00962 = Object.freeze({
  version: SCHOOL_01_FOOTER_MODEL_VERSION_00962,
  schema: 'section-level-container-block-dom-v1',
  scope: 'footer',
  templateId: TEMPLATE_ID_00962,
  sourcePolicy: 'SCHOOL_01_FOOTER_JSON_IS_SOURCE_OF_TRUTH_00962',
  renderPolicy: 'DOM is rendered from this model; widgets edit nodes through stable data-node-id values.',
  root: footerSection00962_
});

function escapeAttr00962_(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeText00962_(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderNode00962_(node) {
  if (!node) return '';
  if (node.type === 'text') return escapeText00962_(node.text || '');
  const tag = String(node.tag || 'div').toLowerCase();
  const attrs = { ...(node.attrs || {}) };
  if (node.styleText != null) attrs.style = String(node.styleText);
  const attrText = Object.entries(attrs).map(([key, value]) => value === true || value === '' ? ` ${key}` : ` ${key}="${escapeAttr00962_(value)}"`).join('');
  const children = (node.children || []).map(renderNode00962_).join('');
  return `<${tag}${attrText}>${children}</${tag}>`;
}

export function renderSchool01Footer00962(model = SCHOOL_01_FOOTER_MODEL_00962) {
  return renderNode00962_(model?.root);
}

export const SCHOOL_01_FOOTER_TEMPLATE_00962 = Object.freeze({
  id: TEMPLATE_ID_00962,
  type: 'footer',
  folderId: 'fld_footer',
  name: 'Школа — 01 · Ліцей «Обрій»',
  styleName: 'Школа — 01 · Ліцей «Обрій» · Footer',
  preview: 'school-01-footer-premium',
  description: 'Преміальний функціональний футер сучасного українського ліцею: вступний CTA, айдентика, прямі контакти, освітня навігація, публічна інформація, графік, соцмережі, доступність та юридичні посилання.',
  meta: {
    source: 'system', category: 'education', locale: 'uk-UA', collectionId: 'school-01',
    pairId: 'school-01', pairNo: 'S01', pairName: 'Школа — 01 · Ліцей «Обрій»',
    pairContract: 'header-footer-style-pair-v1-00965', pairedHeaderTemplateId: 'school-01-header',
    palette: 'navy amber warm white', rating: 9.9, footerSize: 'premium',
    modelContract: 'school-01-footer-json-00962', jsonModel: SCHOOL_01_FOOTER_MODEL_VERSION_00962,
    singleSourceOfTruth: 'model', accessibility: 'WCAG-2.2-AA-oriented', targetSize: '44px', responsive: true,
    contentPriority: ['admission', 'contacts', 'public-information', 'parents', 'accessibility', 'legal'],
    tools: ['section', 'row', 'container', 'logo', 'text', 'icon', 'button', 'link', 'gradient']
  },
  styleProfile: SCHOOL_01_STYLE_PROFILES_00956.footer,
  modelVersion: SCHOOL_01_FOOTER_MODEL_VERSION_00962,
  model: SCHOOL_01_FOOTER_MODEL_00962,
  html: renderSchool01Footer00962(SCHOOL_01_FOOTER_MODEL_00962),
  previewHtml: renderSchool01Footer00962(SCHOOL_01_FOOTER_MODEL_00962)
});
