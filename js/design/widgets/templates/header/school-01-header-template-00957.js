// 00957-SCHOOL-01-HEADER-TEMPLATE
// Canonical School 01 header JSON. The model is the source of truth; HTML is
// rendered once from the same model for the gallery and the current header engine.

import { SCHOOL_01_STYLE_PROFILES_00956 } from '../collections/school-01-collection-contract.js?v=00957';

export const SCHOOL_01_HEADER_TEMPLATE_ID_00957 = 'school-01-header';
export const SCHOOL_01_HEADER_MODEL_VERSION_00957 = 'st-hf-json-v1';

const TEMPLATE_ID_00957 = SCHOOL_01_HEADER_TEMPLATE_ID_00957;

const ICONS_00957 = Object.freeze({
  phone: [['path', { d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.61a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.47-1.29a2 2 0 0 1 2.11-.45c.83.3 1.71.51 2.61.63A2 2 0 0 1 22 16.92z' }]],
  mail: [['rect', { x: '2', y: '4', width: '20', height: '16', rx: '2' }], ['path', { d: 'm22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7' }]],
  pin: [['path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z' }], ['circle', { cx: '12', cy: '10', r: '3' }]],
  search: [['circle', { cx: '11', cy: '11', r: '8' }], ['path', { d: 'm21 21-4.3-4.3' }]],
  user: [['path', { d: 'M19 21a7 7 0 0 0-14 0' }], ['circle', { cx: '12', cy: '7', r: '4' }]],
  eye: [['path', { d: 'M2.1 12a10.8 10.8 0 0 1 19.8 0 10.8 10.8 0 0 1-19.8 0Z' }], ['circle', { cx: '12', cy: '12', r: '3' }]],
  menu: [['path', { d: 'M4 6h16M4 12h16M4 18h16' }]],
  arrow: [['path', { d: 'M5 12h14' }], ['path', { d: 'm13 6 6 6-6 6' }]],
  book: [['path', { d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20' }], ['path', { d: 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z' }], ['path', { d: 'M8 7h8M8 11h6' }]]
});

function styleText00957_(style) {
  return Object.entries(style || {}).map(([key, value]) => `${key}:${value};`).join('');
}

function node00957_(type, tag, id, attrs, style, children = []) {
  const node = {
    type,
    tag,
    ...(id ? { id } : {}),
    attrs: { ...(attrs || {}) },
    style: { ...(style || {}) },
    styleText: styleText00957_(style),
    children
  };
  if (id && ['section', 'level', 'container', 'block'].includes(type)) {
    node.attrs['data-node-id'] = id;
    node.attrs['data-hf-node-type'] = type;
    node.attrs['data-hf-template-id'] = TEMPLATE_ID_00957;
  }
  return node;
}

function text00957_(value) {
  return { type: 'text', text: String(value ?? '') };
}

function svg00957_(iconName, className = '') {
  const shapeNodes = (ICONS_00957[iconName] || []).map(([tag, attrs]) => node00957_('element', tag, '', attrs, {}, []));
  return node00957_('element', 'svg', '', {
    class: className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true'
  }, { width: '100%', height: '100%', display: 'block' }, shapeNodes);
}

function editableText00957_(value, className, style, attrs = {}) {
  return node00957_('element', 'span', '', {
    class: className,
    contenteditable: 'true',
    draggable: 'true',
    spellcheck: 'false',
    'data-st-text-target': '1',
    ...attrs
  }, style, [text00957_(value)]);
}

function simpleLink00957_(id, label, href, options = {}) {
  return node00957_('block', 'div', id, {
    class: `hb-elem st-block st-block--text st-block--link school01-top-link ${options.className || ''}`.trim(),
    'data-block-kind': 'text',
    'data-block-role': 'link',
    'data-name': options.name || label,
    'data-hb-tip': options.name || label,
    ...(options.priority ? { 'data-school01-priority': options.priority } : {})
  }, {
    width: 'auto', 'min-width': 'max-content', 'min-height': '44px', display: 'inline-flex',
    'align-items': 'center', 'justify-content': 'center', background: 'transparent', border: '0',
    overflow: 'visible', color: 'inherit', padding: '0', 'box-sizing': 'border-box', flex: '0 0 auto'
  }, [node00957_('element', 'a', '', {
    href,
    class: 'st-text-edit school01-top-link__anchor',
    'data-st-text-target': '1',
    contenteditable: 'true',
    draggable: 'true',
    spellcheck: 'false'
  }, {
    display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'min-height': '44px',
    padding: '7px 9px', color: 'inherit', 'font-size': '13px', 'font-weight': '700',
    'line-height': '1.2', 'text-decoration': 'none', 'white-space': 'nowrap', 'border-radius': '10px',
    'box-sizing': 'border-box'
  }, [text00957_(label)])]);
}

function iconText00957_(id, iconName, value, options = {}) {
  return node00957_('block', 'div', id, {
    class: `hb-elem st-block st-block--text school01-contact ${options.className || ''}`.trim(),
    'data-block-kind': 'text',
    'data-block-role': 'contact',
    'data-name': options.name || value,
    'data-hb-tip': options.name || value,
    ...(options.priority ? { 'data-school01-priority': options.priority } : {})
  }, {
    width: 'auto', 'min-width': 'max-content', 'min-height': '36px', display: 'inline-flex',
    'align-items': 'center', gap: '7px', background: 'transparent', border: '0', overflow: 'visible',
    color: 'inherit', padding: '0', 'box-sizing': 'border-box', flex: '0 0 auto'
  }, [
    node00957_('element', 'span', '', { class: 'school01-contact__icon', 'aria-hidden': 'true' }, {
      width: '16px', height: '16px', display: 'inline-flex', color: '#fcd34d', flex: '0 0 16px'
    }, [svg00957_(iconName)]),
    editableText00957_(value, 'st-text-edit school01-contact__text', {
      'font-size': '13px', 'font-weight': '700', 'line-height': '1.2', color: 'inherit', 'white-space': 'nowrap'
    })
  ]);
}

function iconButton00957_(id, iconName, label, options = {}) {
  return node00957_('block', 'div', id, {
    class: `hb-elem st-block st-block--icon school01-icon-action ${options.className || ''}`.trim(),
    'data-block-kind': 'icon',
    'data-name': label,
    'data-hb-tip': label,
    ...(options.mobileBurger ? { 'data-school01-mobile-burger': '1' } : {})
  }, {
    width: '46px', 'min-width': '46px', 'min-height': '46px', display: options.hidden ? 'none' : 'flex',
    'align-items': 'center', 'justify-content': 'center', background: 'transparent', border: '0',
    overflow: 'visible', color: '#102a43', flex: '0 0 46px', 'box-sizing': 'border-box',
    '--st-icon-size': '20px', '--st-icon-bg': '#fef3c7', '--st-icon-bw': '1px',
    '--st-icon-bc': '#fcd34d', '--st-icon-radius': '14px', '--st-icon-pad-y': '12px',
    '--st-icon-pad-x': '12px', '--st-icon-shadow': 'none'
  }, [node00957_('element', 'button', '', {
    type: 'button', class: 'st-icon-btn school01-icon-action__button', 'aria-label': label,
    ...(options.expanded != null ? { 'aria-expanded': String(options.expanded) } : {})
  }, {
    width: '46px', height: '46px', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
    border: '1px solid #fcd34d', 'border-radius': '14px', background: '#fef3c7', color: '#102a43',
    padding: '12px', 'box-sizing': 'border-box', cursor: 'pointer'
  }, [node00957_('element', 'span', '', { class: 'st-icon-svg' }, {
    display: 'inline-flex', width: '20px', height: '20px', 'align-items': 'center', 'justify-content': 'center'
  }, [svg00957_(iconName)])])]);
}

function logo00957_() {
  return node00957_('block', 'div', 'school01_header_logo_block_001', {
    class: 'hb-elem st-block st-block--text st-block--logo school01-logo',
    'data-block-kind': 'text', 'data-block-role': 'logo', 'data-name': 'Логотип ліцею', 'data-hb-tip': 'Логотип ліцею',
    'data-logo-mode': 'logo-text-subtitle', 'data-logo-source': 'icon', 'data-logo-pos': 'left',
    'data-logo-link-mode': 'home', 'data-logo-click-area': 'all', 'data-logo-fit': 'contain',
    'data-logo-align': 'center', 'data-logo-gap': '13', 'data-logo-mark-width': '54', 'data-logo-mark-height': '54',
    'data-logo-title-size': '22', 'data-logo-subtitle-size': '11', 'data-logo-mobile-mode': 'hide-subtitle'
  }, {
    width: 'auto', 'min-width': 'max-content', 'min-height': '58px', display: 'grid',
    'grid-template-columns': 'auto auto', 'grid-template-rows': 'auto auto', 'align-items': 'center',
    'column-gap': '13px', 'row-gap': '3px', background: 'transparent', border: '0', overflow: 'visible',
    color: '#102a43', padding: '0', 'box-sizing': 'border-box',
    '--st-logo-mark-w': '54px', '--st-logo-mark-h': '54px', '--st-logo-gap': '13px',
    '--st-logo-mobile-mark-w': '46px', '--st-logo-mobile-title-size': '18px', '--st-logo-mobile-subtitle-size': '10px'
  }, [
    node00957_('element', 'button', '', { type: 'button', class: 'st-logo__iconbtn school01-logo__mark', 'aria-label': 'Ліцей Обрій — на головну' }, {
      'grid-column': '1', 'grid-row': '1 / span 2', width: '54px', height: '54px', display: 'inline-flex',
      'align-items': 'center', 'justify-content': 'center', border: '1px solid #fcd34d', 'border-radius': '16px',
      background: 'linear-gradient(145deg,#fef3c7,#fde68a)', color: '#102a43', padding: '13px',
      'box-shadow': '0 12px 28px rgba(180,83,9,.16)', 'box-sizing': 'border-box'
    }, [node00957_('element', 'span', '', { class: 'st-logo__iconsvg' }, { display: 'inline-flex', width: '28px', height: '28px' }, [svg00957_('book')])]),
    editableText00957_('ЛІЦЕЙ «ОБРІЙ»', 'st-text-edit st-logo__title', {
      'grid-column': '2', 'grid-row': '1', 'font-family': 'Manrope, Inter, Arial, sans-serif',
      'font-size': '22px', 'font-weight': '850', 'line-height': '1.08', 'letter-spacing': '-.02em',
      color: '#102a43', 'white-space': 'nowrap'
    }, { 'data-logo-title': '1' }),
    editableText00957_('ОСВІТА, ЩО ВІДКРИВАЄ МАЙБУТНЄ', 'st-text-edit st-logo__subtitle', {
      'grid-column': '2', 'grid-row': '2', 'font-family': 'Manrope, Inter, Arial, sans-serif',
      'font-size': '11px', 'font-weight': '750', 'line-height': '1.2', 'letter-spacing': '.09em',
      color: '#92400e', 'white-space': 'nowrap'
    }, { 'data-logo-subtitle': '1' })
  ]);
}

function actionButton00957_(id, label, href, iconName, options = {}) {
  return node00957_('block', 'div', id, {
    class: `hb-elem st-block st-block--button school01-action-button ${options.className || ''}`.trim(),
    'data-block-kind': 'button', 'data-block-role': 'button', 'data-name': label, 'data-hb-tip': label,
    'data-button-mode': 'text-icon', 'data-button-icon-pos': options.iconPos || 'right',
    'data-button-text': label, 'data-button-href': href, 'data-button-link-mode': 'custom',
    'data-button-click-area': 'all', 'data-button-shape': 'pill', 'data-button-fill-mode': options.primary ? 'gradient' : 'solid',
    'data-button-color1': options.primary ? '#102a43' : '#fffdf5', 'data-button-color2': options.primary ? '#b45309' : '#fffdf5',
    'data-button-mobile-mode': options.mobileMode || 'inherit', ...(options.mobileLabel ? { 'data-button-mobile-label': options.mobileLabel } : {})
  }, {
    width: 'auto', 'min-width': 'max-content', 'min-height': '46px', display: 'inline-flex',
    'align-items': 'center', 'justify-content': 'center', gap: '9px', padding: '11px 17px',
    'border-radius': '999px', background: options.primary ? 'linear-gradient(135deg,#102a43,#b45309)' : '#fffdf5',
    color: options.primary ? '#ffffff' : '#102a43', border: options.primary ? '1px solid #102a43' : '1px solid #d7dee8',
    'box-shadow': options.primary ? '0 14px 30px rgba(16,42,67,.16)' : 'none', overflow: 'visible',
    flex: '0 0 auto', 'box-sizing': 'border-box', cursor: 'pointer',
    '--st-button-fill': options.primary ? 'linear-gradient(135deg,#102a43,#b45309)' : '#fffdf5',
    '--st-button-fg': options.primary ? '#ffffff' : '#102a43',
    '--st-button-border': options.primary ? '1px solid #102a43' : '1px solid #d7dee8',
    '--st-button-radius': '999px', '--st-button-shadow': options.primary ? '0 14px 30px rgba(16,42,67,.16)' : 'none',
    '--st-button-mobile-width': 'auto', '--st-button-mobile-label-size': '13px', '--st-button-mobile-icon-size': '18px'
  }, [
    ...(options.iconPos === 'left' ? [node00957_('element', 'button', '', { type: 'button', class: 'st-icon-btn st-button__iconbtn', 'aria-label': `${label}: іконка` }, { display: 'inline-flex', width: '18px', height: '18px', padding: '0', border: '0', background: 'transparent', color: 'inherit' }, [svg00957_(iconName, 'st-button__iconsvg')])] : []),
    editableText00957_(label, 'st-text-edit st-button__label', {
      'font-size': '14px', 'font-weight': '800', 'line-height': '1.2', color: 'inherit', 'white-space': 'nowrap'
    }),
    ...(options.iconPos !== 'left' ? [node00957_('element', 'button', '', { type: 'button', class: 'st-icon-btn st-button__iconbtn', 'aria-label': `${label}: іконка` }, { display: 'inline-flex', width: '18px', height: '18px', padding: '0', border: '0', background: 'transparent', color: 'inherit' }, [svg00957_(iconName, 'st-button__iconsvg')])] : [])
  ]);
}

function menu00957_() {
  const items = [
    ['Про ліцей', '/about'], ['Навчання', '/education'], ['Учням', '/students'], ['Батькам', '/parents'],
    ['Новини', '/news'], ['Документи', '/documents'], ['Контакти', '/contacts']
  ];
  const itemNodes = items.map(([label, href], index) => node00957_('element', 'li', '', {
    class: 'st-menu__item', 'data-menu-depth': '1'
  }, { flex: '0 0 auto' }, [node00957_('element', 'a', '', {
    class: `st-menu__link st-block st-block--menu-item school01-menu__link${index === 0 ? ' is-active' : ''}`,
    href, 'data-st-menu-item': '1', ...(index === 0 ? { 'aria-current': 'page' } : {})
  }, {
    display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'min-height': '44px',
    width: 'auto', 'min-width': 'max-content', padding: '10px 14px', 'border-radius': '999px',
    background: index === 0 ? '#102a43' : '#fffdf5', border: `1px solid ${index === 0 ? '#102a43' : '#fffdf5'}`,
    color: index === 0 ? '#ffffff' : '#102a43', 'text-decoration': 'none', 'font-size': '14px',
    'font-weight': '750', 'line-height': '1.2', 'white-space': 'nowrap', 'box-sizing': 'border-box'
  }, [node00957_('element', 'span', '', { class: 'st-menu__text', 'data-st-text-flow': 'nowrap' }, { 'white-space': 'nowrap' }, [text00957_(label)])])]));

  return node00957_('block', 'div', 'school01_header_menu_block_001', {
    class: 'hb-elem st-block st-block--menu school01-menu', 'data-block-kind': 'menu', 'data-name': 'Головне меню',
    'data-hb-tip': 'Головне меню', 'data-st-menu': '1', 'data-menu-variant': 'big',
    'data-menu-level1-direction': 'row', 'data-menu-icon-pos': 'before',
    'data-menu-items': JSON.stringify(items.map(([text, href]) => ({ text, href, children: [] })))
  }, {
    width: '100%', 'min-width': '0', 'max-width': '100%', 'min-height': '44px', display: 'flex',
    'align-items': 'center', 'justify-content': 'center', background: 'transparent', border: '0', overflow: 'visible',
    color: '#102a43', flex: '1 1 auto', 'box-sizing': 'border-box', '--st-menu-gap': '6px',
    '--st-menu-link-color': '#102a43', '--st-menu-link-fs': '14px', '--st-menu-radius': '999px',
    '--st-menu-item-bg': '#fffdf5', '--st-menu-item-bc': '#fffdf5', '--st-menu-item-bw': '1px'
  }, [node00957_('element', 'nav', '', { class: 'st-menu st-menu--big', 'aria-label': 'Головна навігація' }, {
    width: '100%', 'max-width': '100%', 'min-width': '0'
  }, [node00957_('element', 'ul', '', { class: 'st-menu__list', 'data-menu-list-depth': '1' }, {
    'list-style': 'none', margin: '0', padding: '0', display: 'flex', 'align-items': 'center',
    'justify-content': 'center', gap: '6px', 'flex-wrap': 'nowrap', width: '100%', 'max-width': '100%',
    'min-width': '0', 'box-sizing': 'border-box'
  }, itemNodes)])]);
}

const utilitySection00957_ = node00957_('section', 'section', 'school01_header_utility_section_001', {
  class: 'st-section school01-header-section school01-header-utility', 'data-sec-role': 'header',
  'data-hf-json-template': '1', 'data-st-header-part': 'utility', 'data-school01-header': '1'
}, {
  width: '100%', 'box-sizing': 'border-box', overflow: 'visible', padding: '0', margin: '0',
  background: '#102a43', color: '#ffffff', border: '0', 'border-bottom': '1px solid #294e6d',
  'box-shadow': 'none'
}, [node00957_('level', 'div', 'school01_header_utility_level_001', {
  class: 'st-row school01-utility-row', 'data-layout-mode': 'fr', 'data-layout-orient': 'row',
  'data-st-node': 'level', 'data-st-header-row-kind': 'utility'
}, {
  display: 'grid', 'grid-template-columns': 'minmax(0,1fr) max-content', 'align-items': 'center', gap: '18px',
  width: '100%', 'min-height': '48px', 'box-sizing': 'border-box', overflow: 'visible', padding: '0 24px'
}, [
  node00957_('container', 'div', 'school01_header_utility_left_001', {
    class: 'st-block school01-utility-group', 'data-layout-mode': 'flex', 'data-layout-orient': 'row',
    'data-st-node': 'container', 'data-name': 'Контакти ліцею'
  }, {
    'min-height': '44px', width: '100%', 'max-width': '100%', 'min-width': '0', display: 'flex',
    'flex-direction': 'row', 'flex-wrap': 'nowrap', 'align-items': 'center', 'justify-content': 'flex-start',
    gap: '18px', background: 'transparent', border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
  }, [
    iconText00957_('school01_header_phone_001', 'phone', '+38 (044) 123-45-67', { name: 'Телефон' }),
    iconText00957_('school01_header_mail_001', 'mail', 'info@obriy-lyceum.ua', { name: 'Електронна пошта', priority: 'optional' }),
    iconText00957_('school01_header_address_001', 'pin', 'м. Київ, вул. Освітня, 12', { name: 'Адреса', priority: 'optional' })
  ]),
  node00957_('container', 'div', 'school01_header_utility_right_001', {
    class: 'st-block school01-utility-group school01-utility-group--right', 'data-layout-mode': 'flex',
    'data-layout-orient': 'row', 'data-st-node': 'container', 'data-name': 'Сервісні посилання'
  }, {
    'min-height': '44px', width: 'auto', 'max-width': '100%', 'min-width': '0', display: 'flex',
    'flex-direction': 'row', 'flex-wrap': 'nowrap', 'align-items': 'center', 'justify-content': 'flex-end',
    gap: '4px', background: 'transparent', border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
  }, [
    simpleLink00957_('school01_header_parents_link_001', 'Батькам', '/parents', { className: 'school01-top-link--secondary' }),
    simpleLink00957_('school01_header_docs_link_001', 'Публічна інформація', '/documents', { className: 'school01-top-link--secondary' }),
    node00957_('block', 'div', 'school01_header_accessibility_001', {
      class: 'hb-elem st-block st-block--icon school01-accessibility', 'data-block-kind': 'icon',
      'data-name': 'Версія для слабозорих', 'data-hb-tip': 'Версія для слабозорих'
    }, { width: '44px', 'min-width': '44px', 'min-height': '44px', display: 'flex', 'align-items': 'center', 'justify-content': 'center', background: 'transparent', border: '0', color: '#ffffff' }, [
      node00957_('element', 'button', '', { type: 'button', class: 'st-icon-btn school01-accessibility__button', 'aria-label': 'Увімкнути версію для слабозорих' }, {
        width: '44px', height: '44px', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
        border: '1px solid #476985', 'border-radius': '12px', background: '#1b3a56', color: '#ffffff', padding: '10px', cursor: 'pointer'
      }, [svg00957_('eye')])
    ])
  ])
])]);

const mainSection00957_ = node00957_('section', 'section', 'school01_header_main_section_001', {
  class: 'st-section school01-header-section school01-header-main', 'data-sec-role': 'header',
  'data-hf-json-template': '1', 'data-st-header-part': 'main', 'data-school01-header': '1'
}, {
  width: '100%', 'box-sizing': 'border-box', overflow: 'visible', padding: '0', margin: '0',
  background: '#fffdf5', color: '#102a43', border: '0', 'border-bottom': '1px solid #d7dee8',
  'box-shadow': '0 14px 34px rgba(16,42,67,.10)'
}, [
  node00957_('level', 'div', 'school01_header_identity_level_001', {
    class: 'st-row school01-identity-row', 'data-layout-mode': 'fr', 'data-layout-orient': 'row',
    'data-st-node': 'level', 'data-st-header-row-kind': 'main'
  }, {
    display: 'grid', 'grid-template-columns': 'minmax(280px,1fr) max-content', 'align-items': 'center', gap: '24px',
    width: '100%', 'min-height': '84px', 'box-sizing': 'border-box', overflow: 'visible', padding: '12px 24px'
  }, [
    node00957_('container', 'div', 'school01_header_identity_container_001', {
      class: 'st-block school01-identity', 'data-layout-mode': 'flex', 'data-layout-orient': 'row',
      'data-st-node': 'container', 'data-name': 'Айдентика ліцею'
    }, {
      'min-height': '58px', width: '100%', 'max-width': '100%', 'min-width': '0', display: 'flex',
      'flex-direction': 'row', 'flex-wrap': 'nowrap', 'align-items': 'center', 'justify-content': 'flex-start',
      gap: '12px', background: 'transparent', border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
    }, [logo00957_()]),
    node00957_('container', 'div', 'school01_header_actions_container_001', {
      class: 'st-block school01-header-actions', 'data-layout-mode': 'flex', 'data-layout-orient': 'row',
      'data-st-node': 'container', 'data-name': 'Головні дії'
    }, {
      'min-height': '58px', width: 'auto', 'max-width': '100%', 'min-width': '0', display: 'flex',
      'flex-direction': 'row', 'flex-wrap': 'nowrap', 'align-items': 'center', 'justify-content': 'flex-end',
      gap: '9px', background: 'transparent', border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
    }, [
      iconButton00957_('school01_header_search_001', 'search', 'Пошук на сайті'),
      actionButton00957_('school01_header_account_001', 'Кабінет', '/account', 'user', { iconPos: 'left', mobileMode: 'icon-only', className: 'school01-account-button' }),
      actionButton00957_('school01_header_apply_001', 'Подати заяву', '/admission', 'arrow', { primary: true, mobileLabel: 'Вступ', className: 'school01-primary-cta' }),
      iconButton00957_('school01_header_burger_001', 'menu', 'Відкрити меню', { hidden: true, mobileBurger: true, expanded: false })
    ])
  ]),
  node00957_('level', 'div', 'school01_header_nav_level_001', {
    class: 'st-row school01-nav-row', 'data-layout-mode': 'fr', 'data-layout-orient': 'row',
    'data-st-node': 'level', 'data-st-header-row-kind': 'navigation'
  }, {
    display: 'grid', 'grid-template-columns': '1fr', 'align-items': 'center', gap: '0', width: '100%',
    'min-height': '56px', 'box-sizing': 'border-box', overflow: 'visible', padding: '5px 24px',
    background: '#ffffff', 'border-top': '1px solid #e7ebf0'
  }, [node00957_('container', 'div', 'school01_header_nav_container_001', {
    class: 'st-block school01-nav-container', 'data-layout-mode': 'flex', 'data-layout-orient': 'row',
    'data-st-node': 'container', 'data-name': 'Навігація ліцею'
  }, {
    'min-height': '46px', width: '100%', 'max-width': '100%', 'min-width': '0', display: 'flex',
    'flex-direction': 'row', 'flex-wrap': 'nowrap', 'align-items': 'center', 'justify-content': 'center',
    gap: '8px', background: 'transparent', border: '0', overflow: 'visible', padding: '0', 'box-sizing': 'border-box'
  }, [menu00957_()])])
]);

export const SCHOOL_01_HEADER_MODEL_00957 = Object.freeze({
  version: SCHOOL_01_HEADER_MODEL_VERSION_00957,
  schema: 'section-level-container-block-dom-v1',
  scope: 'header',
  templateId: TEMPLATE_ID_00957,
  sourcePolicy: 'SCHOOL_01_HEADER_JSON_IS_SOURCE_OF_TRUTH_00957',
  renderPolicy: 'DOM is rendered from this model; widgets edit nodes through stable data-node-id values.',
  root: {
    type: 'section-group', tag: 'div', id: 'school01_header_section_group_001',
    attrs: {
      'data-hf-node-type': 'section-group', 'data-hf-json-template': '1', 'data-hf-template-id': TEMPLATE_ID_00957,
      'data-node-id': 'school01_header_section_group_001', 'data-school01-header': '1',
      'data-st-header-structure': 'utility-plus-main-and-navigation-00957'
    },
    children: [utilitySection00957_, mainSection00957_]
  }
});

function escapeAttr00957_(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText00957_(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderNode00957_(node) {
  if (!node) return '';
  if (node.type === 'text') return escapeText00957_(node.text || '');
  if (node.type === 'section-group') return (node.children || []).map(renderNode00957_).join('');
  const tag = String(node.tag || 'div').toLowerCase();
  const attrs = { ...(node.attrs || {}) };
  if (node.styleText != null) attrs.style = String(node.styleText);
  const attrText = Object.entries(attrs).map(([key, value]) => (
    value === true || value === '' ? ` ${key}` : ` ${key}="${escapeAttr00957_(value)}"`
  )).join('');
  const children = (node.children || []).map(renderNode00957_).join('');
  return `<${tag}${attrText}>${children}</${tag}>`;
}

export function renderSchool01Header00957(model = SCHOOL_01_HEADER_MODEL_00957) {
  return renderNode00957_(model?.root);
}

export const SCHOOL_01_HEADER_TEMPLATE_00957 = Object.freeze({
  id: TEMPLATE_ID_00957,
  type: 'header',
  folderId: 'fld_header',
  name: 'Школа — 01 · Ліцей «Обрій»',
  styleName: 'Школа — 01 · Ліцей «Обрій» · Header',
  preview: 'school-01-header-premium',
  description: 'Преміальна шапка сучасного українського ліцею: контакти, публічна інформація, доступність, айдентика, пошук, кабінет, вступ і семантичне меню.',
  meta: {
    source: 'system', category: 'education', locale: 'uk-UA', collectionId: 'school-01',
    pairId: 'school-01', pairNo: 'S01', pairName: 'Школа — 01 · Ліцей «Обрій»',
    pairContract: 'header-footer-style-pair-v1-00965', pairedFooterTemplateId: 'school-01-footer',
    palette: 'navy amber warm white', rating: 9.8, modelContract: 'school-01-header-json-00957',
    jsonModel: SCHOOL_01_HEADER_MODEL_VERSION_00957, singleSourceOfTruth: 'model',
    accessibility: 'WCAG-2.2-AA-oriented', targetSize: '44px', responsive: true,
    contentPriority: ['admission', 'parents', 'search', 'public-information', 'contacts'],
    tools: ['section', 'row', 'container', 'logo', 'menu', 'text', 'icon', 'button']
  },
  styleProfile: SCHOOL_01_STYLE_PROFILES_00956.header,
  modelVersion: SCHOOL_01_HEADER_MODEL_VERSION_00957,
  model: SCHOOL_01_HEADER_MODEL_00957,
  html: renderSchool01Header00957(SCHOOL_01_HEADER_MODEL_00957),
  previewHtml: renderSchool01Header00957(SCHOOL_01_HEADER_MODEL_00957)
});
