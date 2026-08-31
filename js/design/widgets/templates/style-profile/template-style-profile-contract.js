// 00945-TEMPLATE-STYLE-PROFILE-CONTRACT
// Pure template metadata contract. No DOM, Store, storage, history or geometry writes.

export const TEMPLATE_STYLE_PROFILE_VERSION_00945 = 'st-template-style-profile-v1-00945';

export const TEMPLATE_STYLE_PROFILE_AREAS_00945 = Object.freeze([
  'header',
  'main',
  'footer'
]);

const ROOT_FIELDS_00945 = Object.freeze([
  'version',
  'profileId',
  'collectionId',
  'templateId',
  'area',
  'theme'
]);

const THEME_FIELDS_00945 = Object.freeze({
  colors: Object.freeze([
    'primary', 'accent', 'surface', 'surface2', 'text', 'muted', 'border',
    'onPrimary', 'onAccent', 'onSurface', 'onSurface2'
  ]),
  radius: Object.freeze(['sm', 'md', 'lg', 'pill']),
  shadow: Object.freeze(['soft', 'md']),
  typography: Object.freeze([
    'headingFont', 'textFont',
    'h1Size', 'h2Size', 'h3Size', 'h4Size', 'h5Size', 'h6Size', 'bodySize',
    'textLineHeight', 'headingLineHeight',
    'letterSpacing', 'headingLetterSpacing',
    'headingWeight', 'textWeight', 'headingColor', 'textColor',
    'logoTitleSize', 'logoSubtitleSize',
    'logoTitleLineHeight', 'logoSubtitleLineHeight',
    'logoTitleLetterSpacing', 'logoSubtitleLetterSpacing',
    'logoTitleWeight', 'logoSubtitleWeight',
    'logoTitleColor', 'logoSubtitleColor'
  ]),
  spacing: Object.freeze([
    'densityPresetId',
    'sectionPaddingY', 'sectionPaddingX', 'containerPadding',
    'blockPaddingY', 'blockPaddingX',
    'levelGap', 'containerGap', 'blockGap', 'menuGap'
  ]),
  sections: Object.freeze([
    'bg', 'altBg', 'text', 'altText', 'borderWidth', 'borderColor', 'radius', 'shadow', 'overlay'
  ]),
  containers: Object.freeze([
    'bg', 'altBg', 'text', 'altText', 'borderWidth', 'borderColor', 'radius', 'shadow', 'overlay'
  ]),
  blocks: Object.freeze([
    'bg', 'altBg', 'text', 'altText', 'borderWidth', 'borderColor', 'radius', 'shadow',
    'hoverShadow', 'hoverLift', 'overlay',
    'headingBg', 'headingText', 'headingBorderWidth', 'headingBorderColor',
    'headingRadius', 'headingShadow', 'headingPaddingY', 'headingPaddingX',
    'headingFontSize', 'headingFontWeight', 'headingLineHeight',
    'headingLetterSpacing', 'headingTextTransform',
    'contactBg', 'contactText', 'contactBorderWidth', 'contactBorderColor',
    'contactRadius', 'contactShadow', 'contactPaddingY', 'contactPaddingX', 'contactGap',
    'contactFontSize', 'contactFontWeight', 'contactLineHeight', 'contactLetterSpacing'
  ]),
  buttons: Object.freeze([
    'primaryBg', 'primaryText', 'primaryBorderWidth', 'primaryBorderColor',
    'primaryHoverBg', 'primaryHoverText', 'primaryHoverBorderColor',
    'primaryActiveBg', 'primaryActiveText',
    'primaryDisabledBg', 'primaryDisabledText',
    'secondaryBg', 'secondaryText', 'secondaryBorderWidth', 'secondaryBorderColor',
    'secondaryHoverBg', 'secondaryHoverText', 'secondaryHoverBorderColor',
    'secondaryActiveBg', 'secondaryActiveText',
    'ghostBg', 'ghostText', 'ghostBorderWidth', 'ghostBorderColor',
    'ghostHoverBg', 'ghostHoverText', 'ghostActiveBg', 'ghostActiveText',
    'iconBg', 'iconText', 'iconBorderWidth', 'iconBorderColor',
    'iconHoverBg', 'iconHoverText', 'iconActiveBg', 'iconActiveText',
    'radius', 'iconRadius', 'shadow', 'hoverShadow', 'activeShadow', 'disabledOpacity',
    'focusRingColor', 'focusRingWidth', 'focusRingOffset',
    'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
    'paddingY', 'paddingX', 'gap'
  ]),
  menu: Object.freeze([
    'text', 'hoverText', 'activeText',
    'itemBg', 'hoverBg', 'activeBg',
    'itemBorderWidth', 'itemBorderColor', 'hoverBorderColor', 'activeBorderColor',
    'altText', 'altHoverText', 'altActiveText',
    'altItemBg', 'altHoverBg', 'altActiveBg',
    'altItemBorderColor', 'altHoverBorderColor', 'altActiveBorderColor',
    'radius', 'underlineHeight', 'underlineOffset', 'indicatorStyle',
    'burgerBg', 'burgerColor', 'burgerRadius', 'mobileBg',
    'focusRingColor', 'focusRingWidth', 'focusRingOffset',
    'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'paddingY', 'paddingX'
  ]),
  links: Object.freeze([
    'color', 'hoverColor', 'activeColor', 'visitedColor',
    'underline', 'underlineHover', 'underlineActive',
    'underlineOffset', 'underlineThickness',
    'focusRingColor', 'focusRingWidth', 'focusRingOffset',
    'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'
  ]),
  icons: Object.freeze([
    'color', 'hoverColor', 'activeColor',
    'bg', 'hoverBg', 'activeBg',
    'borderWidth', 'borderColor', 'radius', 'size',
    'focusRingColor', 'focusRingWidth', 'focusRingOffset',
    'logoColor', 'logoBg', 'logoBorderWidth', 'logoBorderColor', 'logoRadius'
  ]),
  media: Object.freeze([
    'overlay', 'hoverOverlay', 'borderWidth', 'borderColor', 'radius', 'shadow'
  ])
});

const FORBIDDEN_FIELDS_00945 = Object.freeze([
  'html', 'previewHtml', 'model', 'content',
  'layout', 'box', 'constraints', 'children', 'parentId',
  'x', 'y', 'left', 'top', 'right', 'bottom',
  'width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight',
  'position', 'coordinates'
]);

const REQUIRED_GROUPS_00945 = Object.freeze(Object.keys(THEME_FIELDS_00945));
const ID_PATTERN_00945 = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/i;

export const TEMPLATE_STYLE_PROFILE_CONTRACT_00945 = Object.freeze({
  version: TEMPLATE_STYLE_PROFILE_VERSION_00945,
  areas: TEMPLATE_STYLE_PROFILE_AREAS_00945,
  rootFields: ROOT_FIELDS_00945,
  themeFields: THEME_FIELDS_00945,
  forbiddenFields: FORBIDDEN_FIELDS_00945,
  sourceOfTruth: 'template-metadata',
  applicationAuthority: 'SiteFrameStore',
  geometryIncluded: false,
  contentIncluded: false
});

function isPlainObject00945_(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function cloneJson00945_(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze00945_(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze00945_);
  return value;
}

function pushUnknownFields00945_(value, allowedFields, path, errors) {
  if (!isPlainObject00945_(value)) {
    errors.push(`${path} must be a plain object`);
    return;
  }
  const allowed = new Set(allowedFields);
  Object.keys(value).forEach((key) => {
    if (!allowed.has(key)) errors.push(`${path}.${key} is not part of the 00945 contract`);
  });
}

function pushMissingFields00945_(value, requiredFields, path, errors) {
  if (!isPlainObject00945_(value)) return;
  requiredFields.forEach((key) => {
    if (!(key in value) || String(value[key] ?? '').trim() === '') {
      errors.push(`${path}.${key} is required`);
    }
  });
}

function pushForbiddenFields00945_(value, path, errors) {
  if (!value || typeof value !== 'object') return;
  const forbidden = new Set(FORBIDDEN_FIELDS_00945);
  Object.entries(value).forEach(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key;
    if (forbidden.has(key)) errors.push(`${childPath} is forbidden in a Style Profile`);
    pushForbiddenFields00945_(child, childPath, errors);
  });
}

function pushIdError00945_(value, path, errors) {
  const id = String(value || '').trim();
  if (!id) errors.push(`${path} is required`);
  else if (!ID_PATTERN_00945.test(id)) errors.push(`${path} contains unsupported characters`);
}

function colorChannel00945_(value) {
  const channel = Number(value) / 255;
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function parseHexColor00945_(raw) {
  const source = String(raw || '').trim();
  const match = source.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const hex = match[1].length === 3
    ? match[1].split('').map((part) => `${part}${part}`).join('')
    : match[1];
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16)
  };
}

function parseRgbColor00945_(raw) {
  const match = String(raw || '').trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
  if (!match || (match[4] != null && Number(match[4]) < 1)) return null;
  const rgb = { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]) };
  return Object.values(rgb).every((part) => Number.isFinite(part) && part >= 0 && part <= 255) ? rgb : null;
}

function parseSolidColor00945_(raw) {
  const value = String(raw || '').trim().toLowerCase();
  if (value === 'white') return { r: 255, g: 255, b: 255 };
  if (value === 'black') return { r: 0, g: 0, b: 0 };
  return parseHexColor00945_(value) || parseRgbColor00945_(value);
}

function extractColors00945_(raw) {
  const value = String(raw || '').trim();
  const direct = parseSolidColor00945_(value);
  if (direct) return [direct];
  const matches = value.match(/#[0-9a-f]{3,6}\b|rgba?\([^)]*\)/gi) || [];
  return matches.map(parseSolidColor00945_).filter(Boolean);
}

function relativeLuminance00945_(rgb) {
  return (
    0.2126 * colorChannel00945_(rgb.r)
    + 0.7152 * colorChannel00945_(rgb.g)
    + 0.0722 * colorChannel00945_(rgb.b)
  );
}

export function getTemplateStyleContrastRatio00945(foreground, background) {
  const foregroundColors = extractColors00945_(foreground);
  const backgroundColors = extractColors00945_(background);
  if (foregroundColors.length !== 1 || !backgroundColors.length) return null;
  const fgLuminance = relativeLuminance00945_(foregroundColors[0]);
  const ratios = backgroundColors.map((bg) => {
    const bgLuminance = relativeLuminance00945_(bg);
    const light = Math.max(fgLuminance, bgLuminance);
    const dark = Math.min(fgLuminance, bgLuminance);
    return (light + 0.05) / (dark + 0.05);
  });
  return Math.min(...ratios);
}

function readThemeToken00945_(profile, path) {
  return String(path || '').split('.').reduce((value, key) => value?.[key], profile?.theme);
}

function validateContrast00945_(profile, errors) {
  const pairs = [
    ['colors.text', 'colors.surface', 4.5],
    ['colors.text', 'colors.surface2', 4.5],
    ['colors.onPrimary', 'colors.primary', 4.5],
    ['colors.onAccent', 'colors.accent', 4.5],
    ['colors.onSurface', 'colors.surface', 4.5],
    ['colors.onSurface2', 'colors.surface2', 4.5],
    ['typography.headingColor', 'sections.bg', 4.5],
    ['typography.textColor', 'sections.bg', 4.5],
    ['sections.text', 'sections.bg', 4.5],
    ['sections.altText', 'sections.altBg', 4.5],
    ['typography.logoTitleColor', 'sections.bg', 4.5],
    ['typography.logoSubtitleColor', 'sections.bg', 4.5],
    ['buttons.primaryText', 'buttons.primaryBg', 4.5],
    ['buttons.primaryHoverText', 'buttons.primaryHoverBg', 4.5],
    ['buttons.primaryActiveText', 'buttons.primaryActiveBg', 4.5],
    ['buttons.secondaryText', 'buttons.secondaryBg', 4.5],
    ['buttons.secondaryHoverText', 'buttons.secondaryHoverBg', 4.5],
    ['buttons.secondaryActiveText', 'buttons.secondaryActiveBg', 4.5],
    ['buttons.ghostText', 'sections.bg', 4.5],
    ['buttons.ghostHoverText', 'buttons.ghostHoverBg', 4.5],
    ['buttons.ghostActiveText', 'buttons.ghostActiveBg', 4.5],
    ['menu.text', 'menu.itemBg', 4.5],
    ['menu.hoverText', 'menu.hoverBg', 4.5],
    ['menu.activeText', 'menu.activeBg', 4.5],
    ['menu.altText', 'menu.altItemBg', 4.5],
    ['menu.altHoverText', 'menu.altHoverBg', 4.5],
    ['menu.altActiveText', 'menu.altActiveBg', 4.5],
    ['links.color', 'sections.bg', 4.5],
    ['links.hoverColor', 'sections.bg', 4.5],
    ['links.activeColor', 'sections.bg', 4.5],
    ['icons.color', 'sections.bg', 3],
    ['icons.hoverColor', 'icons.hoverBg', 3],
    ['icons.activeColor', 'icons.activeBg', 3],
    ['buttons.focusRingColor', 'sections.bg', 3],
    ['menu.focusRingColor', 'sections.bg', 3],
    ['links.focusRingColor', 'sections.bg', 3],
    ['icons.focusRingColor', 'sections.bg', 3]
  ];

  return pairs.map(([foregroundPath, backgroundPath, minimum]) => {
    const foreground = readThemeToken00945_(profile, foregroundPath);
    const background = readThemeToken00945_(profile, backgroundPath);
    const ratio = getTemplateStyleContrastRatio00945(foreground, background);
    if (ratio == null) {
      errors.push(`contrast ${foregroundPath}/${backgroundPath} requires parseable solid text and solid/gradient background colors`);
    } else if (ratio < minimum) {
      errors.push(`contrast ${foregroundPath}/${backgroundPath} is ${ratio.toFixed(2)}; minimum is ${minimum.toFixed(1)}`);
    }
    return {
      foregroundPath,
      backgroundPath,
      ratio: ratio == null ? null : Math.round(ratio * 100) / 100,
      minimum
    };
  });
}

export function validateTemplateStyleProfile00945(profile, expected = {}) {
  const errors = [];
  if (!isPlainObject00945_(profile)) {
    return { ok: false, errors: ['styleProfile must be a plain object'], contrast: [] };
  }

  pushUnknownFields00945_(profile, ROOT_FIELDS_00945, 'styleProfile', errors);
  pushMissingFields00945_(profile, ROOT_FIELDS_00945, 'styleProfile', errors);
  pushForbiddenFields00945_(profile, 'styleProfile', errors);

  if (profile.version !== TEMPLATE_STYLE_PROFILE_VERSION_00945) {
    errors.push(`styleProfile.version must equal ${TEMPLATE_STYLE_PROFILE_VERSION_00945}`);
  }

  pushIdError00945_(profile.profileId, 'styleProfile.profileId', errors);
  pushIdError00945_(profile.collectionId, 'styleProfile.collectionId', errors);
  pushIdError00945_(profile.templateId, 'styleProfile.templateId', errors);

  const area = String(profile.area || '').trim();
  if (!TEMPLATE_STYLE_PROFILE_AREAS_00945.includes(area)) {
    errors.push(`styleProfile.area must be one of: ${TEMPLATE_STYLE_PROFILE_AREAS_00945.join(', ')}`);
  }

  const expectedTemplateId = String(expected.templateId || '').trim();
  const expectedArea = String(expected.area || '').trim();
  if (expectedTemplateId && profile.templateId !== expectedTemplateId) {
    errors.push(`styleProfile.templateId must match template.id (${expectedTemplateId})`);
  }
  if (expectedArea && area !== expectedArea) {
    errors.push(`styleProfile.area must match template.type (${expectedArea})`);
  }

  if (!isPlainObject00945_(profile.theme)) {
    errors.push('styleProfile.theme must be a plain object');
    return { ok: false, errors, contrast: [] };
  }

  pushUnknownFields00945_(profile.theme, REQUIRED_GROUPS_00945, 'styleProfile.theme', errors);
  pushMissingFields00945_(profile.theme, REQUIRED_GROUPS_00945, 'styleProfile.theme', errors);

  REQUIRED_GROUPS_00945.forEach((group) => {
    const value = profile.theme[group];
    const fields = THEME_FIELDS_00945[group];
    pushUnknownFields00945_(value, fields, `styleProfile.theme.${group}`, errors);
    pushMissingFields00945_(value, fields, `styleProfile.theme.${group}`, errors);
    if (!isPlainObject00945_(value)) return;
    Object.entries(value).forEach(([key, token]) => {
      if (typeof token !== 'string') {
        errors.push(`styleProfile.theme.${group}.${key} must be a CSS token string`);
      }
    });
  });

  const contrast = validateContrast00945_(profile, errors);
  return { ok: errors.length === 0, errors, contrast };
}

export function assertTemplateStyleProfile00945(profile, expected = {}) {
  const result = validateTemplateStyleProfile00945(profile, expected);
  if (!result.ok) {
    const error = new Error(`Invalid 00945 Template Style Profile: ${result.errors.join('; ')}`);
    error.name = 'TemplateStyleProfileContractError00945';
    error.issues = result.errors.slice();
    throw error;
  }
  return deepFreeze00945_(cloneJson00945_(profile));
}
