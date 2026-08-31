// js/design/widgets/templates/shared/hf-global-style-adapter.js
// [00690] Shared Header/Footer global-style template adapter.
// One adapter for test Header + test Footer: structure/content stay in JSON, styles become StyleStore CSS variables.

function clone00690_(value) {
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}

function styleObjToText00690_(style) {
  if (!style || typeof style !== 'object') return '';
  return Object.entries(style)
    .filter(([k, v]) => k && v != null && String(v) !== '')
    .map(([k, v]) => `${k}:${String(v)}`)
    .join(';');
}

function walkModel00690_(node, cb) {
  if (!node) return;
  cb(node);
  if (Array.isArray(node.children)) node.children.forEach((child) => walkModel00690_(child, cb));
}

function replaceEvery00690_(value, replacements) {
  let out = String(value || '');
  (replacements || []).forEach(([from, to]) => {
    if (!from) return;
    out = out.split(String(from)).join(String(to || ''));
  });
  return out;
}

export function retargetHfTemplateForGlobalStyles00690(model, options = {}) {
  const out = clone00690_(model);
  const scope = String(options.scope || out.scope || 'header').toLowerCase() === 'footer' ? 'footer' : 'header';
  const newTemplateId = String(options.newTemplateId || out.templateId || 'hf_global_style_test_json_v1');
  const oldTemplateId = String(options.oldTemplateId || out.templateId || '');
  const oldPrefix = String(options.oldPrefix || '');
  const newPrefix = String(options.newPrefix || '');
  const replacements = [
    [oldTemplateId, newTemplateId],
    [oldPrefix, newPrefix]
  ].filter(([a]) => a);

  out.templateId = newTemplateId;
  out.scope = scope;
  out.sourcePolicy = 'JSON_MODEL_IS_SOURCE_OF_TRUTH_FOR_GLOBAL_STYLES_TEST_00690';
  out.globalStylePolicy = 'SHARED_STYLESTORE_TOKENS_DO_NOT_CHANGE_CONTENT_OR_STRUCTURE_00690';

  walkModel00690_(out.root, (node) => {
    if (node.id) node.id = replaceEvery00690_(node.id, replacements);
    if (node.attrs && typeof node.attrs === 'object') {
      Object.keys(node.attrs).forEach((key) => {
        node.attrs[key] = replaceEvery00690_(node.attrs[key], replacements);
      });
      node.attrs['data-hf-template-id'] = newTemplateId;
      node.attrs['data-st-global-style-test'] = '1';
      node.attrs['data-st-global-style-scope'] = scope;
      if (node.type === 'section') node.attrs['data-st-global-style-root'] = '1';
    }
  });

  if (options.labelText) {
    let changed = false;
    walkModel00690_(out.root, (node) => {
      if (changed || node.type !== 'text') return;
      if (String(node.text || '').trim() === 'ТЕСТ') {
        node.text = String(options.labelText || 'Тест ГЛОБАЛЬНИХ СТИЛІВ');
        changed = true;
      }
    });
  }
  return out;
}

export function applyGlobalStyleTokensToHfModel00690(model, options = {}) {
  const out = clone00690_(model);
  const scope = String(options.scope || out.scope || 'header').toLowerCase() === 'footer' ? 'footer' : 'header';
  const isFooter = scope === 'footer';
  const sectionBg = isFooter
    ? 'var(--st-gd-footer-bg,var(--st-gd-section-bg,var(--st-gd-header-bg,var(--st-gd-color-surface,#ffffff))))'
    : 'var(--st-gd-section-bg,var(--st-gd-header-bg,var(--st-gd-color-surface,#ffffff)))';
  const sectionAltBg = isFooter
    ? 'var(--st-gd-footer-alt-bg,var(--st-gd-section-alt-bg,var(--st-gd-header-alt-bg,var(--st-gd-color-surface-2,#f8fafc))))'
    : 'var(--st-gd-section-alt-bg,var(--st-gd-header-alt-bg,var(--st-gd-color-surface-2,#f8fafc)))';
  const sectionText = isFooter
    ? 'var(--st-gd-footer-text,var(--st-gd-color-text,#111827))'
    : 'var(--st-gd-color-text,#111827)';
  const sectionBorder = isFooter
    ? 'var(--st-gd-footer-border,var(--st-gd-section-border,var(--st-gd-block-border,1px solid var(--st-gd-color-border,#e2e8f0))))'
    : 'var(--st-gd-section-border,0px solid transparent)';
  const sectionRadius = isFooter
    ? 'var(--st-gd-footer-radius,var(--st-gd-section-radius,var(--st-gd-radius-lg,24px)))'
    : 'var(--st-gd-section-radius,0px)';
  const sectionShadow = isFooter
    ? 'var(--st-gd-footer-shadow,var(--st-gd-section-shadow,var(--st-gd-shadow-soft,0 14px 34px rgba(15,23,42,.08))))'
    : 'var(--st-gd-section-shadow,none)';

  walkModel00690_(out.root, (node) => {
    const attrs = node.attrs || {};
    const cls = String(attrs.class || '');
    const kind = String(attrs['data-block-kind'] || '');
    const role = String(attrs['data-block-role'] || '');
    const st = { ...(node.style || {}) };

    if (node.type === 'section') {
      st.background = sectionBg;
      st.color = sectionText;
      st['box-shadow'] = sectionShadow;
      st['border-radius'] = sectionRadius;
      st.border = sectionBorder;
      st['font-family'] = 'var(--st-gd-font,Inter,Manrope,Arial,sans-serif)';
      st.padding = 'var(--st-gd-section-padding-y,24px) var(--st-gd-section-padding-x,24px)';
      st['background-image'] = 'var(--st-gd-section-overlay,none)';
      st['min-height'] = 'var(--st-gd-section-min-height,0px)';
      st.overflow = 'visible';
    }

    if (node.type === 'level' || cls.includes('st-row')) {
      if (String(st.background || '').trim() && String(st.background).trim() !== 'transparent') st.background = sectionAltBg;
      if (st['border-bottom']) st['border-bottom'] = '1px solid var(--st-gd-color-border,#e2e8f0)';
      if (st['border-top']) st['border-top'] = '1px solid var(--st-gd-color-border,#e2e8f0)';
      st.color = sectionText;
      st.gap = 'var(--st-gd-container-gap,12px)';
      st['row-gap'] = 'var(--st-gd-level-gap,14px)';
      st['max-width'] = 'var(--st-gd-section-max-width,100%)';
      st['margin-left'] = 'auto';
      st['margin-right'] = 'auto';
      st.overflow = 'visible';
    }

    if (node.type === 'container') {
      st.background = 'var(--st-gd-container-bg,transparent)';
      st['background-image'] = 'var(--st-gd-container-overlay,none)';
      st.border = 'var(--st-gd-container-border,0px solid transparent)';
      st['border-radius'] = 'var(--st-gd-container-radius,var(--st-gd-radius-md,16px))';
      st['box-shadow'] = 'var(--st-gd-container-shadow,none)';
      st.color = 'inherit';
      st.padding = 'var(--st-gd-container-padding,0px)';
      st.gap = 'var(--st-gd-block-gap,8px)';
      st['min-height'] = 'var(--st-gd-container-min-height,0px)';
      st['max-width'] = 'var(--st-gd-container-max-width,100%)';
      st.overflow = 'visible';
    }

    if (node.type === 'block' || cls.includes('hb-elem')) {
      if (!cls.includes('st-block--button')) st.color = cls.includes('st-block--text') ? sectionText : 'inherit';
      st.background = 'var(--st-gd-block-bg,var(--st-gd-color-surface,#ffffff))';
      st['background-image'] = 'var(--st-gd-block-overlay,none)';
      st.border = 'var(--st-gd-block-border,1px solid var(--st-gd-color-border,#e2e8f0))';
      st['border-radius'] = 'var(--st-gd-block-radius,var(--st-gd-radius-md,16px))';
      st['box-shadow'] = 'var(--st-gd-block-shadow,none)';
      st['min-height'] = 'var(--st-gd-block-min-height,0px)';
      st['max-width'] = 'var(--st-gd-block-max-width,100%)';
      st.padding = 'var(--st-gd-block-padding-y,10px) var(--st-gd-block-padding-x,14px)';
      st.gap = 'var(--st-gd-block-gap,8px)';
      st.overflow = 'visible';
    }

    if (cls.includes('st-block--heading') || role === 'heading') {
      st.background = 'var(--st-gd-accent-soft,rgba(249,115,22,.10))';
      st.border = '1px solid var(--st-gd-accent-border,rgba(249,115,22,.32))';
      st['border-radius'] = 'var(--st-gd-block-radius,var(--st-gd-radius-md,16px))';
      st.color = 'var(--st-gd-color-accent,#f97316)';
      st['box-shadow'] = '0 14px 38px var(--st-gd-accent-shadow,rgba(249,115,22,.18))';
    }

    if (cls.includes('st-block--logo')) {
      st.color = sectionText;
      st['--st-logo-icon-size-local'] = st['--st-logo-icon-size-local'] || '22px';
      st['--st-icon-bg'] = 'var(--st-gd-accent-soft,rgba(249,115,22,.10))';
      st['--st-icon-bc'] = 'var(--st-gd-accent-border,rgba(249,115,22,.26))';
      st['--st-icon-radius'] = 'var(--st-gd-radius-md,16px)';
      st['--st-icon-shadow'] = '0 12px 30px var(--st-gd-accent-shadow,rgba(249,115,22,.18))';
    }

    if (cls.includes('st-logo__title')) st.color = sectionText;
    if (cls.includes('st-logo__subtitle')) st.color = 'var(--st-gd-color-accent,#f97316)';
    if (cls.includes('st-logo__iconbtn') || cls.includes('st-logo__mark')) {
      st.background = 'var(--st-gd-accent-soft,rgba(249,115,22,.10))';
      st.border = '1px solid var(--st-gd-accent-border,rgba(249,115,22,.28))';
      st.color = 'var(--st-gd-color-accent,#f97316)';
      st['border-radius'] = 'var(--st-gd-block-radius,var(--st-gd-radius-md,16px))';
    }

    if (cls.includes('st-block--menu') || attrs['data-st-menu']) {
      st.color = 'var(--st-gd-menu-text,var(--st-gd-color-text,#111827))';
      st['--st-menu-link-color'] = 'var(--st-gd-menu-text,var(--st-gd-color-text,#111827))';
      st['--st-menu-item-bg'] = 'var(--st-gd-menu-item-bg,transparent)';
      st['--st-menu-item-bc'] = 'var(--st-gd-menu-item-border-color,var(--st-gd-color-border,#e2e8f0))';
      st['--st-menu-item-bw'] = 'var(--st-gd-menu-item-border-width,0px)';
      st['--st-menu-radius'] = 'var(--st-gd-menu-item-radius,var(--st-gd-radius-pill,999px))';
      st['--st-menu-burger-bg'] = 'var(--st-gd-menu-burger-bg,var(--st-gd-accent-soft,rgba(249,115,22,.10)))';
      st['--st-menu-burger-color'] = 'var(--st-gd-menu-burger-color,var(--st-gd-color-text,#111827))';
      st['--st-menu-mobile-bg'] = 'var(--st-gd-menu-mobile-bg,var(--st-gd-color-surface,#ffffff))';
      st.gap = 'var(--st-gd-menu-gap,8px)';
      st.overflow = 'visible';
    }

    if (cls.includes('st-menu__link') || attrs['data-st-menu-item']) {
      st.background = 'var(--st-gd-menu-item-bg,var(--st-menu-item-bg,transparent))';
      st.border = 'var(--st-gd-menu-item-border-width,var(--st-menu-item-bw,0px)) solid var(--st-gd-menu-item-border-color,var(--st-menu-item-bc,var(--st-gd-color-border,#e2e8f0)))';
      st.color = 'var(--st-gd-menu-text,var(--st-menu-link-color,var(--st-gd-color-text,#111827)))';
      st['border-radius'] = 'var(--st-gd-menu-item-radius,var(--st-menu-radius,var(--st-gd-radius-pill,999px)))';
      st['text-decoration'] = 'none';
      st['text-underline-offset'] = 'var(--st-gd-menu-underline-offset,5px)';
    }

    if (cls.includes('st-block--button') || kind === 'button') {
      st.background = 'var(--st-gd-button-primary-bg,var(--st-gd-button-bg,var(--st-button-fill,#2563eb)))';
      st.color = 'var(--st-gd-button-primary-text,var(--st-gd-button-text,var(--st-button-fg,#ffffff)))';
      st.border = 'var(--st-gd-button-primary-border,var(--st-gd-button-border,var(--st-button-border,1px solid rgba(255,255,255,.18))))';
      st['border-radius'] = 'var(--st-gd-button-radius,var(--st-gd-radius-pill,var(--st-button-radius,999px)))';
      st['box-shadow'] = 'var(--st-gd-button-shadow,var(--st-gd-shadow-soft,var(--st-button-shadow,0 14px 34px rgba(15,23,42,.12))))';
      st['--st-button-fill'] = 'var(--st-gd-button-primary-bg,var(--st-gd-button-bg,var(--st-button-fill,#2563eb)))';
      st['--st-button-fg'] = 'var(--st-gd-button-primary-text,var(--st-gd-button-text,var(--st-button-fg,#ffffff)))';
      st['--st-button-border'] = 'var(--st-gd-button-primary-border,var(--st-gd-button-border,var(--st-button-border,1px solid rgba(255,255,255,.18))))';
      st['--st-button-radius'] = 'var(--st-gd-button-radius,var(--st-gd-radius-pill,var(--st-button-radius,999px)))';
      st['--st-button-shadow'] = 'var(--st-gd-button-shadow,var(--st-gd-shadow-soft,var(--st-button-shadow,0 14px 34px rgba(15,23,42,.12))))';
    }

    if (cls.includes('st-block--phone') || kind === 'phone') {
      st.background = 'var(--st-gd-accent-soft,rgba(249,115,22,.10))';
      st.border = '1px solid var(--st-gd-accent-border,rgba(249,115,22,.24))';
      st.color = sectionText;
      st['border-radius'] = 'var(--st-gd-radius-pill,999px)';
      st['box-shadow'] = 'none';
    }

    if (cls.includes('st-block--icon') || kind === 'icon') {
      st.color = sectionText;
      st['--st-icon-bg'] = 'var(--st-gd-accent-soft,rgba(249,115,22,.10))';
      st['--st-icon-bc'] = 'var(--st-gd-accent-border,rgba(249,115,22,.24))';
      st['--st-icon-radius'] = 'var(--st-gd-radius-md,16px)';
      st['--st-icon-shadow'] = 'none';
    }

    if (cls.includes('st-icon-btn') || cls.includes('st-button__iconbtn')) {
      st.background = 'var(--st-gd-button-icon-bg,var(--st-gd-accent-soft,rgba(249,115,22,.10)))';
      st.border = 'var(--st-gd-button-icon-border-width,1px) solid var(--st-gd-button-icon-border-color,var(--st-gd-accent-border,rgba(249,115,22,.24)))';
      st.color = 'var(--st-gd-button-icon-text,var(--st-gd-color-accent,#f97316))';
      st['border-radius'] = 'var(--st-gd-button-icon-radius,var(--st-gd-radius-md,16px))';
    }

    if (cls.includes('st-button__label')) {
      st.color = 'var(--st-gd-button-primary-text,var(--st-gd-button-text,#ffffff))';
    }

    if (cls.includes('st-text-edit')) {
      if (!cls.includes('st-button__label')) st.color = 'inherit';
      st['font-family'] = 'inherit';
    }

    node.style = st;
    node.styleText = styleObjToText00690_(st);
  });
  return out;
}
