// 00959-SCHOOL-01-MAIN-TEMPLATE
// One premium School 01 Main template. The authored structure is converted by
// the canonical Main importer into SiteFrameStore JSON on Add / Replace.

import { SCHOOL_01_STYLE_PROFILES_00956 } from '../collections/school-01-collection-contract.js?v=00959';

export const SCHOOL_01_MAIN_TEMPLATE_ID_00959 = 'school-01-main';
export const SCHOOL_01_MAIN_MODEL_VERSION_00959 = 'school-01-main-siteframe-html-v1-00959';

const ASSET_00959 = Object.freeze({
  hero: 'assets/collections/school-01/school-facade-hero.webp',
  classroom: 'assets/collections/school-01/students-in-class.webp',
  teacher: 'assets/collections/school-01/teacher-and-class.webp',
  stem: 'assets/collections/school-01/stem-laboratory.webp',
  library: 'assets/collections/school-01/school-library.webp',
  sports: 'assets/collections/school-01/school-sports.webp',
  creativity: 'assets/collections/school-01/school-creativity.webp',
  event: 'assets/collections/school-01/school-event.webp',
  director: 'assets/collections/school-01/director-portrait.webp',
  campus: 'assets/collections/school-01/school-campus-contact.webp'
});

const ICON_00959 = Object.freeze({
  calendar: '<path d="M6 2v4M18 2v4M3 9h18"/><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 13h3v3H8z"/>',
  journal: '<path d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2V3Z"/><path d="M9 3v18M12 8h4M12 12h4"/>',
  meal: '<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c3 2 3 8 0 10"/>',
  document: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
  spark: '<path d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
  shield: '<path d="M12 2 4 5v6c0 5.2 3.5 9 8 11 4.5-2 8-5.8 8-11V5Z"/><path d="m9 12 2 2 4-5"/>',
  flask: '<path d="M9 2h6M10 2v6l-5 9a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V2"/><path d="M7.5 16h9"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  trophy: '<path d="M8 3h8v5a4 4 0 0 1-8 0Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4M16 5h4v2a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-8.6-3.1 19.3 19.3 0 0 1-6-6 19.7 19.7 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6.1 6.1l1.5-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
});

function esc00959_(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[char]));
}

function style00959_(value) {
  if (typeof value === 'string') return value;
  return Object.entries(value || {}).map(([key, item]) => `${key}:${item};`).join('');
}

function attrs00959_(value) {
  return Object.entries(value || {}).filter(([, item]) => item != null && item !== false).map(([key, item]) => (
    `${key}="${esc00959_(item === true ? '' : item)}"`
  )).join(' ');
}

function level00959_(className, children, style, name) {
  return `<div class="st-row ${className}" data-st-node="level" data-layout-mode="fr" data-layout-orient="row" data-name="${esc00959_(name)}" style="${style00959_(style)}">${children.join('')}</div>`;
}

function container00959_(className, children, style, name) {
  return `<div class="st-block ${className}" data-st-node="container" data-layout-mode="flex" data-layout-orient="column" data-name="${esc00959_(name)}" style="${style00959_(style)}">${children.join('')}</div>`;
}

function textBlock00959_(kind, className, text, style, options = {}) {
  const level = Number(options.level || 0);
  const name = options.name || text;
  const role = options.role || kind;
  const innerAttrs = kind === 'heading'
    ? ` role="heading" aria-level="${level || 2}" data-st-heading="1"`
    : '';
  return `<div class="hb-elem st-block st-block--${kind} ${className}" data-block-kind="${kind}" data-block-role="${role}" data-name="${esc00959_(name)}"${level ? ` data-heading-level="${level}"` : ''} style="${style00959_(style)}"><div class="st-text-edit${kind === 'heading' ? ' st-text-edit--heading' : ''}" contenteditable="true" data-st-text-target="1" spellcheck="false"${innerAttrs}>${esc00959_(text)}</div></div>`;
}

function richBlock00959_(role, className, html, style, name) {
  return `<div class="hb-elem st-block st-block--${role} ${className}" data-block-kind="${role}" data-block-role="${role}" data-name="${esc00959_(name)}" style="${style00959_(style)}">${html}</div>`;
}

function icon00959_(name, className = '') {
  return richBlock00959_('icon', `school01-main-icon ${className}`.trim(), `<span class="school01-main-icon__glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_00959[name] || ICON_00959.spark}</svg></span>`, {
    width: '52px', height: '52px', 'min-width': '52px', 'min-height': '52px', display: 'grid', 'place-items': 'center', padding: '13px',
    background: '#fef3c7', color: '#102a43', border: '1px solid #fcd34d', 'border-radius': '16px', 'box-sizing': 'border-box'
  }, `Іконка: ${name}`);
}

function image00959_(path, alt, className, style = {}) {
  return richBlock00959_('image', className, `<img src="${esc00959_(path)}" alt="${esc00959_(alt)}" loading="lazy" decoding="async" style="width:100%;height:100%;display:block;object-fit:cover;">`, {
    width: '100%', height: '100%', 'min-height': '260px', overflow: 'hidden', background: '#dbe4ea', border: '0', 'border-radius': '24px', ...style
  }, alt);
}

function button00959_(label, className, style = {}) {
  return textBlock00959_('button', className, label, {
    width: 'auto', 'min-width': 'max-content', 'min-height': '48px', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center',
    padding: '13px 20px', 'border-radius': '999px', 'font-size': '15px', 'font-weight': '850', 'line-height': '1.2', cursor: 'pointer', ...style
  }, { name: label, role: 'button' });
}

function eyebrow00959_(text, className = '') {
  return textBlock00959_('text', `school01-main-eyebrow ${className}`.trim(), text, {
    width: 'fit-content', 'min-height': '30px', display: 'inline-flex', 'align-items': 'center', padding: '7px 12px',
    background: '#fef3c7', color: '#78350f', border: '1px solid #fcd34d', 'border-radius': '999px',
    'font-size': '12px', 'font-weight': '850', 'line-height': '1.2', 'letter-spacing': '.08em', 'text-transform': 'uppercase'
  }, { name: text });
}

function quickCard00959_(iconName, title, body) {
  return container00959_('school01-main-quick-card', [
    icon00959_(iconName, 'school01-main-quick-card__icon'),
    container00959_('school01-main-quick-card__copy', [
      textBlock00959_('heading', 'school01-main-card-title', title, { 'font-size': '17px', 'font-weight': '850', color: '#102a43', 'line-height': '1.2' }, { level: 3 }),
      textBlock00959_('text', 'school01-main-card-text', body, { 'font-size': '13px', 'font-weight': '600', color: '#52616b', 'line-height': '1.45' })
    ], { display: 'flex', 'flex-direction': 'column', gap: '4px', width: '100%', 'min-width': '0', background: 'transparent', border: '0' }, title)
  ], {
    display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '14px', width: '100%', 'min-width': '0', padding: '18px',
    background: 'rgba(255,253,245,.96)', border: '1px solid rgba(255,255,255,.75)', 'border-radius': '20px',
    'box-shadow': '0 16px 38px rgba(16,42,67,.13)', 'backdrop-filter': 'blur(12px)', 'box-sizing': 'border-box'
  }, title);
}

function metric00959_(value, label) {
  return container00959_('school01-main-metric', [
    textBlock00959_('heading', 'school01-main-metric__value', value, { 'font-size': '44px', 'font-weight': '900', color: '#fcd34d', 'line-height': '1' }, { level: 3 }),
    textBlock00959_('text', 'school01-main-metric__label', label, { 'font-size': '13px', 'font-weight': '750', color: '#dbeafe', 'line-height': '1.35', 'letter-spacing': '.03em' })
  ], { display: 'flex', 'flex-direction': 'column', gap: '7px', padding: '22px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.13)', 'border-radius': '20px' }, label);
}

function advantage00959_(iconName, title, body, accent = false) {
  return container00959_(`school01-main-advantage${accent ? ' school01-main-advantage--accent' : ''}`, [
    icon00959_(iconName),
    textBlock00959_('heading', 'school01-main-card-title school01-main-advantage__title', title, { 'font-size': '22px', 'font-weight': '880', color: accent ? '#ffffff' : '#102a43', 'line-height': '1.15' }, { level: 3 }),
    textBlock00959_('text', 'school01-main-card-text school01-main-advantage__text', body, { 'font-size': '15px', 'font-weight': '550', color: accent ? '#e6f1f8' : '#52616b', 'line-height': '1.65' })
  ], {
    display: 'flex', 'flex-direction': 'column', gap: '16px', width: '100%', padding: '26px',
    background: accent ? `linear-gradient(145deg,rgba(7,26,43,.96),rgba(16,42,67,.80)),url("${ASSET_00959.teacher}") center/cover no-repeat` : '#ffffff',
    border: accent ? '1px solid #294e6d' : '1px solid #d7dee8', 'border-radius': '24px',
    'box-shadow': accent ? '0 24px 54px rgba(16,42,67,.20)' : '0 14px 34px rgba(16,42,67,.08)'
  }, title);
}

function program00959_(kicker, title, body, items, className = '') {
  return container00959_(`school01-main-program ${className}`.trim(), [
    textBlock00959_('text', 'school01-main-program__kicker', kicker, { 'font-size': '12px', 'font-weight': '850', color: '#92400e', 'line-height': '1.2', 'letter-spacing': '.08em', 'text-transform': 'uppercase' }),
    textBlock00959_('heading', 'school01-main-program__title', title, { 'font-size': '26px', 'font-weight': '900', color: '#102a43', 'line-height': '1.12' }, { level: 3 }),
    textBlock00959_('text', 'school01-main-program__body', body, { 'font-size': '14px', 'font-weight': '550', color: '#52616b', 'line-height': '1.6' }),
    richBlock00959_('list', 'school01-main-program__list', `<ul>${items.map((item) => `<li>${esc00959_(item)}</li>`).join('')}</ul>`, { width: '100%', color: '#102a43', 'font-size': '13px', 'font-weight': '700', 'line-height': '1.5' }, `${title}: переваги`),
    button00959_('Дізнатися більше', 'school01-main-button school01-main-button--ghost', { background: '#fffdf5', color: '#102a43', border: '1px solid #d7dee8', 'box-shadow': 'none' })
  ], {
    display: 'flex', 'flex-direction': 'column', gap: '14px', width: '100%', padding: '28px', background: '#ffffff',
    border: '1px solid #d7dee8', 'border-radius': '26px', 'box-shadow': '0 16px 38px rgba(16,42,67,.08)'
  }, title);
}

function eventCard00959_(day, month, title, text) {
  return container00959_('school01-main-event-card', [
    container00959_('school01-main-date', [
      textBlock00959_('heading', 'school01-main-date__day', day, { 'font-size': '26px', 'font-weight': '900', color: '#102a43', 'line-height': '1' }, { level: 3 }),
      textBlock00959_('text', 'school01-main-date__month', month, { 'font-size': '10px', 'font-weight': '850', color: '#92400e', 'line-height': '1', 'letter-spacing': '.1em', 'text-transform': 'uppercase' })
    ], { width: '64px', 'min-width': '64px', height: '64px', display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center', gap: '3px', background: '#fef3c7', border: '1px solid #fcd34d', 'border-radius': '18px' }, `${day} ${month}`),
    container00959_('school01-main-event-card__copy', [
      textBlock00959_('heading', 'school01-main-card-title', title, { 'font-size': '17px', 'font-weight': '850', color: '#102a43', 'line-height': '1.2' }, { level: 3 }),
      textBlock00959_('text', 'school01-main-card-text', text, { 'font-size': '13px', 'font-weight': '550', color: '#52616b', 'line-height': '1.45' })
    ], { display: 'flex', 'flex-direction': 'column', gap: '5px', width: '100%', 'min-width': '0', background: 'transparent', border: '0' }, title)
  ], { display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '16px', width: '100%', padding: '16px', background: '#ffffff', border: '1px solid #d7dee8', 'border-radius': '20px' }, title);
}

function newsCard00959_(path, tag, title, date) {
  return container00959_('school01-main-news-card', [
    image00959_(path, title, 'school01-main-news-card__image', { 'min-height': '210px', 'border-radius': '20px' }),
    container00959_('school01-main-news-card__copy', [
      textBlock00959_('text', 'school01-main-news-card__meta', `${tag} · ${date}`, { 'font-size': '11px', 'font-weight': '850', color: '#92400e', 'line-height': '1.3', 'letter-spacing': '.06em', 'text-transform': 'uppercase' }),
      textBlock00959_('heading', 'school01-main-news-card__title', title, { 'font-size': '20px', 'font-weight': '880', color: '#102a43', 'line-height': '1.25' }, { level: 3 }),
      button00959_('Читати новину', 'school01-main-text-link', { 'min-height': '40px', padding: '8px 0', background: 'transparent', color: '#92400e', border: '0', 'border-radius': '0' })
    ], { display: 'flex', 'flex-direction': 'column', gap: '11px', width: '100%', padding: '20px', background: 'transparent', border: '0' }, title)
  ], { display: 'flex', 'flex-direction': 'column', gap: '0', width: '100%', padding: '8px', background: '#ffffff', border: '1px solid #d7dee8', 'border-radius': '28px', overflow: 'hidden', 'box-shadow': '0 14px 34px rgba(16,42,67,.08)' }, title);
}

function step00959_(number, title, body) {
  return container00959_('school01-main-step', [
    textBlock00959_('heading', 'school01-main-step__number', number, { width: '48px', height: '48px', display: 'grid', 'place-items': 'center', background: '#b45309', color: '#ffffff', 'border-radius': '16px', 'font-size': '18px', 'font-weight': '900', 'line-height': '1' }, { level: 3 }),
    textBlock00959_('heading', 'school01-main-step__title', title, { 'font-size': '18px', 'font-weight': '850', color: '#102a43', 'line-height': '1.2' }, { level: 3 }),
    textBlock00959_('text', 'school01-main-step__body', body, { 'font-size': '13px', 'font-weight': '550', color: '#52616b', 'line-height': '1.5' })
  ], { display: 'flex', 'flex-direction': 'column', gap: '13px', width: '100%', padding: '22px', background: '#fffdf5', border: '1px solid #d7dee8', 'border-radius': '22px' }, title);
}

function contactItem00959_(iconName, title, value) {
  return container00959_('school01-main-contact-item', [
    icon00959_(iconName, 'school01-main-contact-item__icon'),
    container00959_('school01-main-contact-item__copy', [
      textBlock00959_('text', 'school01-main-contact-item__label', title, { 'font-size': '11px', 'font-weight': '850', color: '#7a8994', 'line-height': '1.2', 'letter-spacing': '.07em', 'text-transform': 'uppercase' }),
      textBlock00959_('text', 'school01-main-contact-item__value', value, { 'font-size': '15px', 'font-weight': '750', color: '#102a43', 'line-height': '1.4' })
    ], { display: 'flex', 'flex-direction': 'column', gap: '4px', width: '100%', background: 'transparent', border: '0' }, title)
  ], { display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '14px', width: '100%', padding: '13px', background: '#ffffff', border: '1px solid #d7dee8', 'border-radius': '18px' }, title);
}

const sectionHead00959_ = (eyebrow, title, body, dark = false) => container00959_('school01-main-section-head', [
  eyebrow00959_(eyebrow, dark ? 'school01-main-eyebrow--dark' : ''),
  textBlock00959_('heading', 'school01-main-section-title', title, { 'font-size': '40px', 'font-weight': '900', color: dark ? '#ffffff' : '#102a43', 'line-height': '1.08', 'letter-spacing': '-.03em' }, { level: 2 }),
  textBlock00959_('text', 'school01-main-section-lead', body, { 'font-size': '16px', 'font-weight': '550', color: dark ? '#dbeafe' : '#52616b', 'line-height': '1.65' })
], { display: 'flex', 'flex-direction': 'column', gap: '14px', width: '100%', 'max-width': '740px', background: 'transparent', border: '0' }, title);

function buildSchool01MainHtml00959_() {
  const hero = level00959_('school01-main-row school01-main-hero', [
    container00959_('school01-main-hero__content', [
      eyebrow00959_('Ліцей «Обрій» · Київ', 'school01-main-eyebrow--glass'),
      textBlock00959_('heading', 'school01-main-hero__title', 'Школа, де знання стають можливостями', { 'font-size': '64px', 'font-weight': '920', color: '#ffffff', 'line-height': '1.01', 'letter-spacing': '-.045em', 'max-width': '820px' }, { level: 1 }),
      textBlock00959_('text', 'school01-main-hero__lead', 'Сучасна українська освіта, сильна спільнота й простір, у якому кожна дитина відкриває власний шлях до майбутнього.', { 'font-size': '19px', 'font-weight': '560', color: '#eef6fb', 'line-height': '1.62', 'max-width': '680px' }),
      container00959_('school01-main-actions', [
        button00959_('Подати заяву', 'school01-main-button school01-main-button--primary', { background: 'linear-gradient(135deg,#fcd34d,#b45309)', color: '#102a43', border: '1px solid #fcd34d', 'box-shadow': '0 16px 34px rgba(0,0,0,.22)' }),
        button00959_('Відкрити ліцей', 'school01-main-button school01-main-button--glass', { background: 'rgba(255,255,255,.10)', color: '#ffffff', border: '1px solid rgba(255,255,255,.42)', 'box-shadow': 'none', 'backdrop-filter': 'blur(12px)' })
      ], { display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap', gap: '12px', width: '100%', background: 'transparent', border: '0' }, 'Дії вступу')
    ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'center', gap: '22px', width: '100%', 'min-width': '0', padding: '56px 0', background: 'transparent', border: '0' }, 'Головна обіцянка'),
    container00959_('school01-main-hero__aside', [
      textBlock00959_('text', 'school01-main-hero__aside-kicker', 'ВСТУП · 2026/2027', { 'font-size': '11px', 'font-weight': '850', color: '#fde68a', 'line-height': '1.2', 'letter-spacing': '.12em' }),
      textBlock00959_('heading', 'school01-main-hero__aside-title', 'День відкритих дверей', { 'font-size': '28px', 'font-weight': '900', color: '#ffffff', 'line-height': '1.12' }, { level: 2 }),
      textBlock00959_('text', 'school01-main-hero__aside-date', '29 серпня · 11:00', { 'font-size': '16px', 'font-weight': '800', color: '#ffffff', 'line-height': '1.3' }),
      textBlock00959_('text', 'school01-main-hero__aside-text', 'Познайомтеся з командою, освітніми програмами й просторами ліцею.', { 'font-size': '14px', 'font-weight': '550', color: '#dbeafe', 'line-height': '1.55' }),
      button00959_('Зареєструватися', 'school01-main-button school01-main-button--light', { width: '100%', background: '#ffffff', color: '#102a43', border: '1px solid #ffffff', 'box-shadow': 'none' })
    ], { display: 'flex', 'flex-direction': 'column', gap: '14px', width: '100%', 'max-width': '350px', padding: '28px', background: 'rgba(5,20,35,.58)', border: '1px solid rgba(255,255,255,.24)', 'border-radius': '28px', 'box-shadow': '0 24px 70px rgba(0,0,0,.30)', 'backdrop-filter': 'blur(16px)' }, 'День відкритих дверей')
  ], {
    display: 'grid', 'grid-template-columns': 'minmax(0,1.45fr) minmax(300px,.55fr)', 'align-items': 'end', gap: '42px', width: '100%', 'min-height': '690px', padding: '76px clamp(28px,6vw,88px)',
    background: `linear-gradient(90deg,rgba(5,20,35,.94) 0%,rgba(16,42,67,.82) 48%,rgba(16,42,67,.26) 100%),linear-gradient(0deg,rgba(5,20,35,.55),transparent 55%),url("${ASSET_00959.hero}") center/cover no-repeat`,
    color: '#ffffff', overflow: 'hidden', position: 'relative', 'box-sizing': 'border-box'
  }, 'Hero');

  const quick = level00959_('school01-main-row school01-main-quick', [
    quickCard00959_('calendar', 'Розклад занять', 'Уроки, заміни та дзвінки'),
    quickCard00959_('journal', 'Е-щоденник', 'Оцінки й навчальні матеріали'),
    quickCard00959_('meal', 'Меню їдальні', 'Актуальне меню на тиждень'),
    quickCard00959_('document', 'Документи', 'Правила, звіти та заяви')
  ], { display: 'grid', 'grid-template-columns': 'repeat(4,minmax(0,1fr))', gap: '14px', width: 'min(1280px,calc(100% - 48px))', margin: '-54px auto 0', padding: '0', position: 'relative', 'z-index': '3' }, 'Швидкий доступ');

  const about = level00959_('school01-main-row school01-main-about', [
    container00959_('school01-main-about__media', [
      image00959_(ASSET_00959.classroom, 'Учні ліцею працюють разом у світлому класі', 'school01-main-about__image', { 'min-height': '520px', 'border-radius': '30px', 'box-shadow': '0 24px 64px rgba(16,42,67,.16)' }),
      container00959_('school01-main-about__badge', [
        textBlock00959_('heading', 'school01-main-about__badge-value', '30', { 'font-size': '36px', 'font-weight': '920', color: '#102a43', 'line-height': '1' }, { level: 3 }),
        textBlock00959_('text', 'school01-main-about__badge-text', 'років створюємо освіту майбутнього', { 'font-size': '12px', 'font-weight': '750', color: '#52616b', 'line-height': '1.35' })
      ], { display: 'flex', 'flex-direction': 'column', gap: '5px', width: '180px', padding: '20px', background: '#fef3c7', border: '1px solid #fcd34d', 'border-radius': '22px', 'box-shadow': '0 18px 42px rgba(16,42,67,.16)', position: 'absolute', right: '-18px', bottom: '28px' }, '30 років досвіду')
    ], { display: 'flex', 'flex-direction': 'column', width: '100%', position: 'relative', background: 'transparent', border: '0' }, 'Фото ліцею'),
    container00959_('school01-main-about__content', [
      sectionHead00959_('Про ліцей', 'Освіта, що допомагає дитині знайти власний голос', 'Ми поєднуємо сильну академічну основу, проєктне навчання й культуру поваги. Учні не просто запамʼятовують — вони досліджують, створюють і беруть відповідальність.'),
      container00959_('school01-main-values-inline', [
        textBlock00959_('text', 'school01-main-value-pill', 'Критичне мислення', { padding: '9px 13px', background: '#f1f5f9', color: '#102a43', border: '1px solid #d7dee8', 'border-radius': '999px', 'font-size': '12px', 'font-weight': '800' }),
        textBlock00959_('text', 'school01-main-value-pill', 'Повага й довіра', { padding: '9px 13px', background: '#f1f5f9', color: '#102a43', border: '1px solid #d7dee8', 'border-radius': '999px', 'font-size': '12px', 'font-weight': '800' }),
        textBlock00959_('text', 'school01-main-value-pill', 'Сміливість діяти', { padding: '9px 13px', background: '#f1f5f9', color: '#102a43', border: '1px solid #d7dee8', 'border-radius': '999px', 'font-size': '12px', 'font-weight': '800' })
      ], { display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap', gap: '8px', width: '100%', background: 'transparent', border: '0' }, 'Цінності'),
      button00959_('Дізнатися про ліцей', 'school01-main-button school01-main-button--secondary', { background: '#fffdf5', color: '#102a43', border: '1px solid #102a43', 'box-shadow': 'none' })
    ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'center', gap: '24px', width: '100%', padding: '32px', background: 'transparent', border: '0' }, 'Про ліцей')
  ], { display: 'grid', 'grid-template-columns': 'minmax(0,.95fr) minmax(0,1.05fr)', gap: '64px', width: 'min(1240px,calc(100% - 48px))', margin: '0 auto', padding: '112px 0 88px', 'align-items': 'center' }, 'Про ліцей');

  const metrics = level00959_('school01-main-row school01-main-metrics', [
    container00959_('school01-main-metrics__intro', [
      eyebrow00959_('Ліцей у цифрах', 'school01-main-eyebrow--dark'),
      textBlock00959_('heading', 'school01-main-metrics__title', 'Середовище, у якому є місце для кожного таланту', { 'font-size': '34px', 'font-weight': '900', color: '#ffffff', 'line-height': '1.12', 'letter-spacing': '-.025em' }, { level: 2 })
    ], { display: 'flex', 'flex-direction': 'column', gap: '14px', width: '100%', background: 'transparent', border: '0' }, 'Ліцей у цифрах'),
    metric00959_('640', 'учнів у спільноті'),
    metric00959_('72', 'педагоги й тьютори'),
    metric00959_('24', 'гуртки та студії'),
    metric00959_('96%', 'вступають до обраних закладів')
  ], { display: 'grid', 'grid-template-columns': 'minmax(280px,1.5fr) repeat(4,minmax(150px,1fr))', gap: '14px', width: '100%', padding: '64px clamp(24px,5vw,72px)', background: 'linear-gradient(135deg,#071a2b,#102a43 55%,#173f5f)', 'align-items': 'stretch' }, 'Ліцей у цифрах');

  const advantages = level00959_('school01-main-row school01-main-advantages', [
    sectionHead00959_('Чому «Обрій»', 'Школа, яку обирають за середовище, а не лише за програму', 'Кожен елемент навчання — від класу до позашкільної активності — підтримує допитливість, самостійність і безпеку дитини.'),
    container00959_('school01-main-advantages__grid', [
      advantage00959_('flask', 'Навчання через дію', 'STEM-лабораторії, дослідження та міжпредметні проєкти перетворюють знання на реальний досвід.', true),
      advantage00959_('users', 'Увага до кожного', 'Невеликі навчальні групи, тьюторський супровід і зрозумілий зворотний звʼязок для родини.'),
      advantage00959_('shield', 'Безпечна спільнота', 'Психологічна підтримка, культура поваги та чіткі правила взаємодії без приниження й булінгу.'),
      advantage00959_('globe', 'Відкрите мислення', 'Українська ідентичність, іноземні мови та міжнародні навчальні практики в одному середовищі.')
    ], { display: 'grid', 'grid-template-columns': 'repeat(4,minmax(0,1fr))', gap: '16px', width: '100%', background: 'transparent', border: '0' }, 'Переваги ліцею')
  ], { display: 'flex', 'flex-direction': 'column', gap: '38px', width: 'min(1240px,calc(100% - 48px))', margin: '0 auto', padding: '92px 0' }, 'Чому обирають нас');

  const programs = level00959_('school01-main-row school01-main-programs', [
    sectionHead00959_('Освітній маршрут', 'Програми, що ростуть разом з учнем', 'Послідовна траєкторія від першої допитливості до свідомого вибору професійного напряму.'),
    container00959_('school01-main-programs__grid', [
      program00959_('1–4 класи', 'Початкова школа', 'Навчаємо вчитися, ставити запитання й працювати разом.', ['Інтегровані курси', 'Адаптація та тьютор', 'Творчі майстерні']),
      program00959_('5–9 класи', 'Базова школа', 'Формуємо міцну академічну базу й самостійність у навчанні.', ['Поглиблені предмети', 'STEM і проєкти', 'Друга іноземна мова'], 'school01-main-program--featured'),
      program00959_('10–11 класи', 'Профільна школа', 'Допомагаємо обрати напрям, сформувати портфоліо й підготуватися до вступу.', ['Індивідуальна траєкторія', 'Профорієнтація', 'Підготовка до НМТ'])
    ], { display: 'grid', 'grid-template-columns': 'repeat(3,minmax(0,1fr))', gap: '18px', width: '100%', background: 'transparent', border: '0' }, 'Освітні програми')
  ], { display: 'flex', 'flex-direction': 'column', gap: '38px', width: '100%', padding: '88px max(24px,calc((100% - 1240px)/2))', background: 'linear-gradient(180deg,#f1f5f9,#fffdf5)' }, 'Освітні програми');

  const events = level00959_('school01-main-row school01-main-events', [
    container00959_('school01-main-events__feature', [
      eyebrow00959_('Найближча подія', 'school01-main-eyebrow--glass'),
      textBlock00959_('heading', 'school01-main-events__feature-title', 'Фестиваль науки та ідей', { 'font-size': '42px', 'font-weight': '920', color: '#ffffff', 'line-height': '1.06', 'letter-spacing': '-.03em' }, { level: 2 }),
      textBlock00959_('text', 'school01-main-events__feature-text', 'Учнівські експерименти, технологічні проєкти, відкриті лабораторії та зустрічі з науковцями.', { 'font-size': '16px', 'font-weight': '560', color: '#eef6fb', 'line-height': '1.6' }),
      textBlock00959_('text', 'school01-main-events__feature-date', '12 вересня · 12:00–17:00', { 'font-size': '14px', 'font-weight': '850', color: '#fde68a', 'line-height': '1.3' }),
      button00959_('Переглянути програму', 'school01-main-button school01-main-button--light', { background: '#ffffff', color: '#102a43', border: '1px solid #ffffff', 'box-shadow': 'none' })
    ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'flex-end', gap: '16px', width: '100%', 'min-height': '500px', padding: '40px', background: `linear-gradient(0deg,rgba(5,20,35,.88),rgba(16,42,67,.16)),url("${ASSET_00959.event}") center/cover no-repeat`, border: '0', 'border-radius': '30px', overflow: 'hidden', 'box-shadow': '0 24px 64px rgba(16,42,67,.18)' }, 'Фестиваль науки та ідей'),
    container00959_('school01-main-events__list', [
      sectionHead00959_('Календар', 'Події й оголошення', 'Важливі дати для учнів і батьків.'),
      eventCard00959_('29', 'СЕР', 'День відкритих дверей', 'Екскурсія кампусом і зустріч із командою.'),
      eventCard00959_('02', 'ВЕР', 'Початок навчального року', 'Святкова зустріч учнів та класних наставників.'),
      eventCard00959_('18', 'ВЕР', 'Батьківська майстерня', 'Як підтримувати самостійність підлітка у навчанні.'),
      button00959_('Увесь календар', 'school01-main-button school01-main-button--secondary', { background: '#fffdf5', color: '#102a43', border: '1px solid #102a43', 'box-shadow': 'none' })
    ], { display: 'flex', 'flex-direction': 'column', gap: '14px', width: '100%', padding: '12px 0', background: 'transparent', border: '0' }, 'Календар подій')
  ], { display: 'grid', 'grid-template-columns': 'minmax(0,1.08fr) minmax(360px,.92fr)', gap: '46px', width: 'min(1240px,calc(100% - 48px))', margin: '0 auto', padding: '96px 0', 'align-items': 'center' }, 'Оголошення та події');

  const news = level00959_('school01-main-row school01-main-news', [
    container00959_('school01-main-news__head', [
      sectionHead00959_('Актуальне', 'Новини ліцею', 'Історії учнів, досягнення команди та важливе зі шкільного життя.'),
      button00959_('Усі новини', 'school01-main-button school01-main-button--secondary', { background: '#fffdf5', color: '#102a43', border: '1px solid #102a43', 'box-shadow': 'none' })
    ], { display: 'flex', 'flex-direction': 'row', 'justify-content': 'space-between', 'align-items': 'end', gap: '24px', width: '100%', background: 'transparent', border: '0' }, 'Заголовок новин'),
    container00959_('school01-main-news__grid', [
      newsCard00959_(ASSET_00959.stem, 'Досягнення', 'Команда ліцею перемогла у міському STEM-челенджі', '14.08.2026'),
      newsCard00959_(ASSET_00959.library, 'Освітній простір', 'У бібліотеці відкрили лабораторію медіаграмотності', '08.08.2026'),
      newsCard00959_(ASSET_00959.sports, 'Спорт', 'Наші учні вибороли три медалі на шкільній лізі', '02.08.2026')
    ], { display: 'grid', 'grid-template-columns': 'repeat(3,minmax(0,1fr))', gap: '18px', width: '100%', background: 'transparent', border: '0' }, 'Новини')
  ], { display: 'flex', 'flex-direction': 'column', gap: '38px', width: '100%', padding: '88px max(24px,calc((100% - 1240px)/2))', background: '#f1f5f9' }, 'Новини ліцею');

  const life = level00959_('school01-main-row school01-main-life', [
    sectionHead00959_('Життя ліцею', 'Місце для знань, дружби, спорту й творчості', 'Школа продовжується після уроків — у командах, студіях, майстернях і спільних проєктах.'),
    container00959_('school01-main-life__bento', [
      richBlock00959_('image', 'school01-main-life-card school01-main-life-card--large', `<img src="${ASSET_00959.library}" alt="Учні у сучасній бібліотеці" loading="lazy"><span><b>Бібліотека і медіацентр</b><small>Читати · досліджувати · створювати</small></span>`, { 'min-height': '500px', background: '#102a43', border: '0', 'border-radius': '28px', overflow: 'hidden', position: 'relative' }, 'Бібліотека і медіацентр'),
      richBlock00959_('image', 'school01-main-life-card', `<img src="${ASSET_00959.sports}" alt="Спортивні заняття учнів" loading="lazy"><span><b>Спорт і команди</b><small>Рух, витривалість, взаємопідтримка</small></span>`, { 'min-height': '240px', background: '#102a43', border: '0', 'border-radius': '28px', overflow: 'hidden', position: 'relative' }, 'Спорт і команди'),
      richBlock00959_('image', 'school01-main-life-card', `<img src="${ASSET_00959.creativity}" alt="Творче заняття у ліцеї" loading="lazy"><span><b>Мистецтво і творчість</b><small>Музика, театр, дизайн і власні ідеї</small></span>`, { 'min-height': '240px', background: '#102a43', border: '0', 'border-radius': '28px', overflow: 'hidden', position: 'relative' }, 'Мистецтво і творчість')
    ], { display: 'grid', 'grid-template-columns': '1.2fr .8fr', 'grid-template-rows': '1fr 1fr', gap: '16px', width: '100%', background: 'transparent', border: '0' }, 'Життя ліцею')
  ], { display: 'flex', 'flex-direction': 'column', gap: '38px', width: 'min(1240px,calc(100% - 48px))', margin: '0 auto', padding: '96px 0' }, 'Життя ліцею');

  const admission = level00959_('school01-main-row school01-main-admission', [
    container00959_('school01-main-admission__head', [
      sectionHead00959_('Вступ', 'Простий і зрозумілий шлях до ліцею', 'Ми зробили процес вступу прозорим для родини й комфортним для дитини.', true),
      button00959_('Розпочати вступ', 'school01-main-button school01-main-button--primary', { background: 'linear-gradient(135deg,#fcd34d,#b45309)', color: '#102a43', border: '1px solid #fcd34d', 'box-shadow': 'none' })
    ], { display: 'flex', 'flex-direction': 'row', 'justify-content': 'space-between', 'align-items': 'end', gap: '28px', width: '100%', background: 'transparent', border: '0' }, 'Вступ до ліцею'),
    container00959_('school01-main-admission__steps', [
      step00959_('01', 'Заявка', 'Заповніть коротку форму на сайті.'),
      step00959_('02', 'Знайомство', 'Зустріч із родиною та майбутнім учнем.'),
      step00959_('03', 'Діагностика', 'Мʼяко визначаємо навчальні потреби.'),
      step00959_('04', 'Рішення', 'Узгоджуємо програму й наступні кроки.')
    ], { display: 'grid', 'grid-template-columns': 'repeat(4,minmax(0,1fr))', gap: '14px', width: '100%', background: 'transparent', border: '0' }, 'Етапи вступу')
  ], { display: 'flex', 'flex-direction': 'column', gap: '38px', width: '100%', padding: '84px max(24px,calc((100% - 1240px)/2))', background: 'linear-gradient(135deg,#071a2b,#102a43 62%,#173f5f)', color: '#ffffff' }, 'Вступ до ліцею');

  const testimonials = level00959_('school01-main-row school01-main-testimonials', [
    sectionHead00959_('Голоси спільноти', 'Про ліцей — словами тих, хто живе ним щодня', 'Відкритість і довіра починаються з чесного діалогу.'),
    container00959_('school01-main-testimonials__grid', [
      container00959_('school01-main-director', [
        image00959_(ASSET_00959.director, 'Директорка ліцею', 'school01-main-director__portrait', { width: '150px', 'min-width': '150px', height: '190px', 'min-height': '190px', 'border-radius': '24px' }),
        container00959_('school01-main-director__copy', [
          textBlock00959_('text', 'school01-main-quote', '«Наша мета — не дати дитині готову карту світу, а навчити впевнено прокладати власний маршрут».', { 'font-size': '20px', 'font-weight': '700', color: '#102a43', 'line-height': '1.55' }),
          textBlock00959_('heading', 'school01-main-quote-author', 'Олена Ковальчук', { 'font-size': '16px', 'font-weight': '900', color: '#102a43', 'line-height': '1.2' }, { level: 3 }),
          textBlock00959_('text', 'school01-main-quote-role', 'директорка ліцею', { 'font-size': '12px', 'font-weight': '700', color: '#92400e', 'line-height': '1.3' })
        ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'center', gap: '10px', width: '100%', background: 'transparent', border: '0' }, 'Слово директорки')
      ], { display: 'flex', 'flex-direction': 'row', gap: '24px', width: '100%', padding: '24px', background: '#fef3c7', border: '1px solid #fcd34d', 'border-radius': '28px' }, 'Слово директорки'),
      container00959_('school01-main-quote-card', [
        textBlock00959_('text', 'school01-main-quote', '«Син став сміливіше ставити запитання і сам планує навчальні проєкти. Для нас це найбільший результат».', { 'font-size': '17px', 'font-weight': '650', color: '#102a43', 'line-height': '1.6' }),
        textBlock00959_('heading', 'school01-main-quote-author', 'Наталія, мама учня 7 класу', { 'font-size': '14px', 'font-weight': '850', color: '#102a43', 'line-height': '1.3' }, { level: 3 })
      ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'space-between', gap: '18px', width: '100%', padding: '28px', background: '#ffffff', border: '1px solid #d7dee8', 'border-radius': '28px' }, 'Відгук мами'),
      container00959_('school01-main-quote-card', [
        textBlock00959_('text', 'school01-main-quote', '«Тут можна бути собою, пробувати нове й не боятися помилитися. Учителі справді слухають».', { 'font-size': '17px', 'font-weight': '650', color: '#102a43', 'line-height': '1.6' }),
        textBlock00959_('heading', 'school01-main-quote-author', 'Марко, учень 10 класу', { 'font-size': '14px', 'font-weight': '850', color: '#102a43', 'line-height': '1.3' }, { level: 3 })
      ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'space-between', gap: '18px', width: '100%', padding: '28px', background: '#ffffff', border: '1px solid #d7dee8', 'border-radius': '28px' }, 'Відгук учня')
    ], { display: 'grid', 'grid-template-columns': '1.4fr .8fr .8fr', gap: '16px', width: '100%', background: 'transparent', border: '0' }, 'Відгуки')
  ], { display: 'flex', 'flex-direction': 'column', gap: '38px', width: '100%', padding: '92px max(24px,calc((100% - 1240px)/2))', background: '#fffdf5' }, 'Говорять учні та батьки');

  const contacts = level00959_('school01-main-row school01-main-contacts', [
    container00959_('school01-main-contacts__content', [
      sectionHead00959_('Контакти', 'Завітайте до «Обрію»', 'Покажемо навчальні простори, познайомимо з командою й відповімо на запитання про вступ.'),
      container00959_('school01-main-contact-list', [
        contactItem00959_('pin', 'Адреса', 'м. Київ, вул. Освітня, 12'),
        contactItem00959_('phone', 'Телефон', '+38 (044) 123-45-67'),
        contactItem00959_('mail', 'Електронна пошта', 'info@obriy-lyceum.ua'),
        contactItem00959_('clock', 'Години роботи', 'Пн–Пт · 08:00–19:00')
      ], { display: 'grid', 'grid-template-columns': 'repeat(2,minmax(0,1fr))', gap: '10px', width: '100%', background: 'transparent', border: '0' }, 'Контактні дані'),
      button00959_('Запланувати візит', 'school01-main-button school01-main-button--primary', { background: 'linear-gradient(135deg,#102a43,#b45309)', color: '#ffffff', border: '1px solid #102a43' })
    ], { display: 'flex', 'flex-direction': 'column', 'justify-content': 'center', gap: '24px', width: '100%', padding: '24px 0', background: 'transparent', border: '0' }, 'Контакти'),
    container00959_('school01-main-contacts__media', [
      image00959_(ASSET_00959.campus, 'Вхід до кампусу ліцею Обрій', 'school01-main-contacts__image', { 'min-height': '560px', 'border-radius': '30px', 'box-shadow': '0 24px 64px rgba(16,42,67,.16)' }),
      container00959_('school01-main-map-chip', [
        icon00959_('pin'),
        textBlock00959_('text', 'school01-main-map-chip__text', '12 хв від центру · поруч метро', { 'font-size': '13px', 'font-weight': '800', color: '#102a43', 'line-height': '1.35' })
      ], { display: 'flex', 'flex-direction': 'row', 'align-items': 'center', gap: '10px', width: 'fit-content', padding: '10px 14px', background: 'rgba(255,253,245,.94)', border: '1px solid rgba(255,255,255,.82)', 'border-radius': '18px', 'box-shadow': '0 14px 34px rgba(16,42,67,.16)', 'backdrop-filter': 'blur(12px)', position: 'absolute', left: '22px', bottom: '22px' }, 'Розташування')
    ], { display: 'flex', 'flex-direction': 'column', width: '100%', position: 'relative', background: 'transparent', border: '0' }, 'Кампус ліцею')
  ], { display: 'grid', 'grid-template-columns': 'minmax(0,.9fr) minmax(0,1.1fr)', gap: '58px', width: 'min(1240px,calc(100% - 48px))', margin: '0 auto', padding: '96px 0', 'align-items': 'center' }, 'Як нас знайти');

  const finalCta = level00959_('school01-main-row school01-main-final', [
    container00959_('school01-main-final__content', [
      eyebrow00959_('Наступний крок', 'school01-main-eyebrow--glass'),
      textBlock00959_('heading', 'school01-main-final__title', 'Відкрийте для дитини більше можливостей', { 'font-size': '48px', 'font-weight': '920', color: '#ffffff', 'line-height': '1.05', 'letter-spacing': '-.035em', 'max-width': '780px' }, { level: 2 }),
      textBlock00959_('text', 'school01-main-final__text', 'Залиште заявку — команда вступу звʼяжеться з вами, відповість на запитання й допоможе обрати програму.', { 'font-size': '17px', 'font-weight': '550', color: '#dbeafe', 'line-height': '1.6', 'max-width': '700px' }),
      container00959_('school01-main-actions', [
        button00959_('Подати заяву', 'school01-main-button school01-main-button--primary', { background: 'linear-gradient(135deg,#fcd34d,#b45309)', color: '#102a43', border: '1px solid #fcd34d', 'box-shadow': 'none' }),
        button00959_('Поставити запитання', 'school01-main-button school01-main-button--glass', { background: 'rgba(255,255,255,.10)', color: '#ffffff', border: '1px solid rgba(255,255,255,.36)', 'box-shadow': 'none' })
      ], { display: 'flex', 'flex-direction': 'row', 'flex-wrap': 'wrap', gap: '12px', width: '100%', background: 'transparent', border: '0' }, 'Фінальні дії')
    ], { display: 'flex', 'flex-direction': 'column', 'align-items': 'center', 'text-align': 'center', gap: '20px', width: '100%', 'max-width': '900px', margin: '0 auto', background: 'transparent', border: '0' }, 'Фінальний заклик')
  ], { display: 'flex', 'justify-content': 'center', width: '100%', padding: '92px 24px', background: `linear-gradient(135deg,rgba(5,20,35,.97),rgba(16,42,67,.90)),url("${ASSET_00959.hero}") center 58%/cover no-repeat`, color: '#ffffff' }, 'Зробіть перший крок');

  return `<section class="st-section school01-main-template" data-sec-role="main" data-template-id="${SCHOOL_01_MAIN_TEMPLATE_ID_00959}" data-school01-main="1" data-school01-main-version="00959" style="${style00959_({
    width: '100%', margin: '0', padding: '0', background: '#fffdf5', color: '#102a43', border: '0', 'border-radius': '0',
    'box-shadow': 'none', overflow: 'hidden', 'box-sizing': 'border-box', 'font-family': 'Manrope,Inter,Arial,sans-serif',
    'container-type': 'inline-size', 'container-name': 'school01-main'
  })}">${[hero, quick, about, metrics, advantages, programs, events, news, life, admission, testimonials, contacts, finalCta].join('')}</section>`;
}

export const SCHOOL_01_MAIN_HTML_00959 = buildSchool01MainHtml00959_();

// The gallery card should present the decisive first screen instead of shrinking
// the complete 13-zone page into an unreadable miniature. Add / Replace still
// receives the full canonical HTML above.
export const SCHOOL_01_MAIN_PREVIEW_HTML_00959 = `<div class="school01-main-gallery-preview" style="width:100%;height:980px;overflow:hidden;background:#fffdf5;pointer-events:none;">${SCHOOL_01_MAIN_HTML_00959}</div>`;

export const SCHOOL_01_MAIN_TEMPLATE_00959 = Object.freeze({
  id: SCHOOL_01_MAIN_TEMPLATE_ID_00959,
  type: 'main',
  folderId: 'fld_main_home',
  name: 'Школа — 01 · Повний Main',
  preview: 'school-01-main-premium',
  description: 'Преміальний повний Main ліцею: 13 змістовних зон від hero та швидких сервісів до вступу, контактів і фінального CTA.',
  meta: Object.freeze({
    source: 'system',
    stage: '00959',
    collectionId: 'school-01',
    modelContract: SCHOOL_01_MAIN_MODEL_VERSION_00959,
    siteFrameStore: true,
    mainApplyModes: Object.freeze(['add', 'replace']),
    replaceScope: 'main-area',
    sectionCount: 13,
    assetCount: 10,
    palette: 'navy amber warm ivory',
    accessibility: 'WCAG-2.2-aware',
    rating: 9.9
  }),
  styleProfile: SCHOOL_01_STYLE_PROFILES_00956.main,
  html: SCHOOL_01_MAIN_HTML_00959,
  previewHtml: SCHOOL_01_MAIN_PREVIEW_HTML_00959
});

export function validateSchool01MainTemplate00959(template = SCHOOL_01_MAIN_TEMPLATE_00959) {
  const html = String(template?.html || '');
  const requiredSections = ['school01-main-hero', 'school01-main-quick', 'school01-main-about', 'school01-main-metrics', 'school01-main-advantages', 'school01-main-programs', 'school01-main-events', 'school01-main-news', 'school01-main-life', 'school01-main-admission', 'school01-main-testimonials', 'school01-main-contacts', 'school01-main-final'];
  const errors = [];
  if (template?.id !== SCHOOL_01_MAIN_TEMPLATE_ID_00959) errors.push('invalid template id');
  if (template?.type !== 'main') errors.push('invalid template type');
  if (!html.includes('data-school01-main-version="00959"')) errors.push('missing 00959 root marker');
  requiredSections.forEach((className) => { if (!html.includes(className)) errors.push(`missing ${className}`); });
  Object.values(ASSET_00959).forEach((assetPath) => { if (!html.includes(assetPath)) errors.push(`missing asset ${assetPath}`); });
  if (template?.styleProfile?.templateId !== SCHOOL_01_MAIN_TEMPLATE_ID_00959) errors.push('invalid style profile');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

const validation00959_ = validateSchool01MainTemplate00959();
if (!validation00959_.ok) throw new Error(`Invalid School 01 Main template 00959: ${validation00959_.errors.join('; ')}`);
