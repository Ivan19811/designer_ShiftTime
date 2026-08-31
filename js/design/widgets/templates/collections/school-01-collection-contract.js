// 00957-SCHOOL-01-COLLECTION-CONTRACT
// Canonical contract for the staged "Школа — 01" Header/Main/Footer collection.
// Header, Main and Footer are ready and form one complete collection.

import {
  assertTemplateStyleProfile00945,
  TEMPLATE_STYLE_PROFILE_VERSION_00945
} from '../style-profile/template-style-profile-contract.js';

export const TEMPLATE_COLLECTION_CONTRACT_VERSION_00956 = 'st-template-collection-contract-v1-00956';
export const SCHOOL_01_COLLECTION_ID_00956 = 'school-01';

export const SCHOOL_01_TEMPLATE_IDS_00956 = Object.freeze({
  header: 'school-01-header',
  main: 'school-01-main',
  footer: 'school-01-footer'
});

const cloneJson00956_ = (value) => JSON.parse(JSON.stringify(value));

function deepFreeze00956_(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze00956_);
  return value;
}

export const SCHOOL_01_SHARED_THEME_00956 = deepFreeze00956_({
  colors: {
    primary: '#102a43',
    accent: '#b45309',
    surface: '#fffdf5',
    surface2: '#f1f5f9',
    text: '#102a43',
    muted: '#52616b',
    border: '#d7dee8',
    onPrimary: '#ffffff',
    onAccent: '#ffffff',
    onSurface: '#102a43',
    onSurface2: '#102a43'
  },
  radius: { sm: '8px', md: '14px', lg: '24px', pill: '999px' },
  shadow: {
    soft: '0 14px 34px rgba(16,42,67,.10)',
    md: '0 22px 54px rgba(16,42,67,.16)'
  },
  typography: {
    headingFont: 'Manrope, Inter, Arial, sans-serif',
    textFont: 'Manrope, Inter, Arial, sans-serif',
    h1Size: '52px', h2Size: '38px', h3Size: '30px',
    h4Size: '24px', h5Size: '20px', h6Size: '17px', bodySize: '16px',
    textLineHeight: '1.6', headingLineHeight: '1.12',
    letterSpacing: '0em', headingLetterSpacing: '-.025em',
    headingWeight: '850', textWeight: '500',
    headingColor: '#102a43', textColor: '#102a43',
    logoTitleSize: '22px', logoSubtitleSize: '11px',
    logoTitleLineHeight: '1.08', logoSubtitleLineHeight: '1.2',
    logoTitleLetterSpacing: '-.02em', logoSubtitleLetterSpacing: '.09em',
    logoTitleWeight: '850', logoSubtitleWeight: '750',
    logoTitleColor: '#102a43', logoSubtitleColor: '#92400e'
  },
  spacing: {
    densityPresetId: 'density-comfortable',
    sectionPaddingY: '72px', sectionPaddingX: '24px', containerPadding: '24px',
    blockPaddingY: '18px', blockPaddingX: '20px',
    levelGap: '28px', containerGap: '24px', blockGap: '18px', menuGap: '8px'
  },
  sections: {
    bg: '#fffdf5', altBg: '#102a43', text: '#102a43', altText: '#ffffff',
    borderWidth: '1px', borderColor: '#d7dee8',
    radius: '0px', shadow: 'none', overlay: 'linear-gradient(180deg,rgba(16,42,67,.02),rgba(16,42,67,.08))'
  },
  containers: {
    bg: 'transparent', altBg: 'transparent', text: 'inherit', altText: 'inherit',
    borderWidth: '0px', borderColor: 'transparent',
    radius: '24px', shadow: 'none', overlay: 'none'
  },
  blocks: {
    bg: '#ffffff', altBg: '#f1f5f9', text: '#102a43', altText: '#102a43',
    borderWidth: '1px', borderColor: '#d7dee8', radius: '14px',
    shadow: '0 14px 34px rgba(16,42,67,.10)',
    hoverShadow: '0 22px 54px rgba(16,42,67,.16)', hoverLift: '-3px', overlay: 'none',
    headingBg: '#fef3c7', headingText: '#102a43',
    headingBorderWidth: '1px', headingBorderColor: '#fcd34d',
    headingRadius: '999px', headingShadow: 'none',
    headingPaddingY: '8px', headingPaddingX: '16px',
    headingFontSize: '14px', headingFontWeight: '800', headingLineHeight: '1.2',
    headingLetterSpacing: '.08em', headingTextTransform: 'uppercase',
    contactBg: '#f1f5f9', contactText: '#102a43',
    contactBorderWidth: '1px', contactBorderColor: '#d7dee8',
    contactRadius: '14px', contactShadow: 'none',
    contactPaddingY: '10px', contactPaddingX: '14px', contactGap: '10px',
    contactFontSize: '14px', contactFontWeight: '700', contactLineHeight: '1.35', contactLetterSpacing: '0em'
  },
  buttons: {
    primaryBg: 'linear-gradient(135deg,#102a43,#b45309)', primaryText: '#ffffff', primaryBorderWidth: '1px', primaryBorderColor: '#102a43',
    primaryHoverBg: 'linear-gradient(135deg,#0b1f33,#92400e)', primaryHoverText: '#ffffff', primaryHoverBorderColor: '#92400e',
    primaryActiveBg: '#78350f', primaryActiveText: '#ffffff',
    primaryDisabledBg: '#d7dee8', primaryDisabledText: '#475569',
    secondaryBg: '#fffdf5', secondaryText: '#102a43', secondaryBorderWidth: '1px', secondaryBorderColor: '#102a43',
    secondaryHoverBg: '#f1f5f9', secondaryHoverText: '#102a43', secondaryHoverBorderColor: '#b45309',
    secondaryActiveBg: '#fef3c7', secondaryActiveText: '#102a43',
    ghostBg: '#fffdf5', ghostText: '#102a43', ghostBorderWidth: '0px', ghostBorderColor: 'transparent',
    ghostHoverBg: '#f1f5f9', ghostHoverText: '#102a43', ghostActiveBg: '#fef3c7', ghostActiveText: '#102a43',
    iconBg: '#fef3c7', iconText: '#102a43', iconBorderWidth: '1px', iconBorderColor: '#fcd34d',
    iconHoverBg: '#b45309', iconHoverText: '#ffffff', iconActiveBg: '#78350f', iconActiveText: '#ffffff',
    radius: '999px', iconRadius: '14px',
    shadow: '0 14px 30px rgba(16,42,67,.16)', hoverShadow: '0 20px 40px rgba(16,42,67,.22)',
    activeShadow: 'inset 0 2px 8px rgba(16,42,67,.24)', disabledOpacity: '.55',
    focusRingColor: '#b45309', focusRingWidth: '3px', focusRingOffset: '2px',
    fontSize: '15px', fontWeight: '800', lineHeight: '1.2', letterSpacing: '0em',
    paddingY: '12px', paddingX: '20px', gap: '10px'
  },
  menu: {
    text: '#102a43', hoverText: '#ffffff', activeText: '#ffffff',
    itemBg: '#fffdf5', hoverBg: '#102a43', activeBg: '#b45309',
    itemBorderWidth: '1px', itemBorderColor: '#fffdf5', hoverBorderColor: '#102a43', activeBorderColor: '#b45309',
    altText: '#ffffff', altHoverText: '#102a43', altActiveText: '#ffffff',
    altItemBg: '#102a43', altHoverBg: '#fef3c7', altActiveBg: '#b45309',
    altItemBorderColor: '#294e6d', altHoverBorderColor: '#fcd34d', altActiveBorderColor: '#b45309',
    radius: '999px', underlineHeight: '2px', underlineOffset: '5px', indicatorStyle: 'background',
    burgerBg: '#fef3c7', burgerColor: '#102a43', burgerRadius: '14px', mobileBg: '#fffdf5',
    focusRingColor: '#b45309', focusRingWidth: '3px', focusRingOffset: '2px',
    fontSize: '14px', fontWeight: '750', lineHeight: '1.2', letterSpacing: '0em',
    paddingY: '9px', paddingX: '13px'
  },
  links: {
    color: '#92400e', hoverColor: '#102a43', activeColor: '#78350f', visitedColor: '#78350f',
    underline: 'none', underlineHover: 'underline', underlineActive: 'underline',
    underlineOffset: '3px', underlineThickness: '1px',
    focusRingColor: '#b45309', focusRingWidth: '3px', focusRingOffset: '2px',
    fontSize: '15px', fontWeight: '700', lineHeight: '1.4', letterSpacing: '0em'
  },
  icons: {
    color: '#102a43', hoverColor: '#ffffff', activeColor: '#ffffff',
    bg: '#fef3c7', hoverBg: '#b45309', activeBg: '#78350f',
    borderWidth: '1px', borderColor: '#fcd34d', radius: '14px', size: '20px',
    focusRingColor: '#b45309', focusRingWidth: '3px', focusRingOffset: '2px',
    logoColor: '#102a43', logoBg: '#fef3c7', logoBorderWidth: '1px',
    logoBorderColor: '#fcd34d', logoRadius: '14px'
  },
  media: {
    overlay: 'linear-gradient(180deg,rgba(16,42,67,.02),rgba(16,42,67,.38))',
    hoverOverlay: 'linear-gradient(180deg,rgba(16,42,67,.01),rgba(16,42,67,.24))',
    borderWidth: '1px', borderColor: '#d7dee8', radius: '24px',
    shadow: '0 22px 54px rgba(16,42,67,.16)'
  }
});

function createStyleProfile00956_(area) {
  const templateId = SCHOOL_01_TEMPLATE_IDS_00956[area];
  return assertTemplateStyleProfile00945({
    version: TEMPLATE_STYLE_PROFILE_VERSION_00945,
    profileId: `${templateId}-style`,
    collectionId: SCHOOL_01_COLLECTION_ID_00956,
    templateId,
    area,
    theme: cloneJson00956_(SCHOOL_01_SHARED_THEME_00956)
  }, { templateId, area });
}

export const SCHOOL_01_STYLE_PROFILES_00956 = deepFreeze00956_({
  header: createStyleProfile00956_('header'),
  main: createStyleProfile00956_('main'),
  footer: createStyleProfile00956_('footer')
});

const SCHOOL_01_CONTENT_BLUEPRINT_00956 = {
  header: {
    role: 'site-header',
    announcementBar: ['Телефон', 'Електронна пошта', 'Адреса', 'Батькам', 'Версія для слабозорих'],
    identity: { brand: 'Ліцей «Обрій»', tagline: 'Освіта, що відкриває майбутнє' },
    primaryAction: 'Подати заяву',
    utilities: ['Пошук', 'Особистий кабінет'],
    navigation: ['Про ліцей', 'Навчання', 'Учням', 'Батькам', 'Новини', 'Документи', 'Контакти']
  },
  main: {
    role: 'site-main',
    sections: [
      { id: 'hero', title: 'Школа, де знання стають можливостями', purpose: 'Головна обіцянка, фото ліцею та вступна дія' },
      { id: 'quick-links', title: 'Швидкий доступ', purpose: 'Розклад, електронний щоденник, харчування, документи' },
      { id: 'about', title: 'Про ліцей', purpose: 'Місія, цінності та коротка історія' },
      { id: 'metrics', title: 'Ліцей у цифрах', purpose: 'Учні, вчителі, гуртки та роки досвіду' },
      { id: 'advantages', title: 'Чому обирають нас', purpose: 'Сильні сторони освітнього середовища' },
      { id: 'programs', title: 'Освітні програми', purpose: 'Початкова, базова та профільна школа' },
      { id: 'events', title: 'Оголошення та події', purpose: 'Найближчі важливі дати' },
      { id: 'news', title: 'Новини ліцею', purpose: 'Актуальні матеріали з посиланнями' },
      { id: 'school-life', title: 'Життя ліцею', purpose: 'Навчання, спорт, творчість і спільнота' },
      { id: 'admission', title: 'Вступ до ліцею', purpose: 'Етапи вступу, строки та перелік документів' },
      { id: 'testimonials', title: 'Говорять учні та батьки', purpose: 'Короткі відгуки з нейтральними аватарами' },
      { id: 'contacts', title: 'Як нас знайти', purpose: 'Адреса, контакти, години роботи та карта' },
      { id: 'final-cta', title: 'Зробіть перший крок', purpose: 'Фінальна дія для заявки або консультації' }
    ]
  },
  footer: {
    role: 'site-footer',
    identity: ['Логотип', 'Короткий опис', 'Адреса', 'Телефон', 'Електронна пошта'],
    navigation: ['Про ліцей', 'Навчання', 'Учням', 'Батькам', 'Новини', 'Контакти'],
    publicInformation: ['Ліцензії', 'Публічна інформація', 'Фінансова звітність', 'Протидія булінгу'],
    admission: ['Правила прийому', 'Освітні програми', 'Документи', 'Політика конфіденційності'],
    service: ['Соціальні мережі', 'Графік роботи', 'Авторське право']
  }
};

const SCHOOL_01_COMPONENTS_00956 = {
  actions: ['primary-button', 'secondary-button', 'ghost-link', 'icon-button'],
  navigation: ['desktop-menu', 'mobile-menu', 'active-indicator', 'utility-link'],
  cards: ['quick-link-card', 'program-card', 'metric-card', 'news-card', 'event-card', 'testimonial-card'],
  information: ['badge', 'date-chip', 'contact-item', 'document-link'],
  media: ['hero-image', 'editorial-image', 'portrait', 'gallery-image'],
  interactionStates: ['default', 'hover', 'focus-visible', 'active', 'disabled']
};

const SCHOOL_01_ASSET_MANIFEST_00956 = [
  ['school-facade-hero', 'assets/collections/school-01/school-facade-hero.webp', 'hero', 'Широкий сучасний фасад українського ліцею'],
  ['students-in-class', 'assets/collections/school-01/students-in-class.webp', 'about', 'Учні під час спільної роботи у світлому класі'],
  ['teacher-and-class', 'assets/collections/school-01/teacher-and-class.webp', 'advantages', 'Учитель пояснює матеріал невеликій групі'],
  ['stem-laboratory', 'assets/collections/school-01/stem-laboratory.webp', 'programs', 'Безпечна STEM-лабораторія та командний проєкт'],
  ['school-library', 'assets/collections/school-01/school-library.webp', 'school-life', 'Сучасна бібліотека з учнями'],
  ['school-sports', 'assets/collections/school-01/school-sports.webp', 'school-life', 'Шкільна спортивна активність'],
  ['school-creativity', 'assets/collections/school-01/school-creativity.webp', 'school-life', 'Творча майстерня або музичне заняття'],
  ['school-event', 'assets/collections/school-01/school-event.webp', 'news', 'Загальношкільна подія у просторій залі'],
  ['director-portrait', 'assets/collections/school-01/director-portrait.webp', 'testimonials', 'Нейтральний професійний портрет директора'],
  ['school-campus-contact', 'assets/collections/school-01/school-campus-contact.webp', 'contacts', 'Вхід до кампусу для контактного блоку']
].map(([id, path, role, brief]) => ({
  id,
  path,
  role,
  brief,
  status: 'ready',
  license: 'project-owned-generated',
  metadataAuthority: 'assets/system/manifest.json'
}));

const school01Contract00956_ = {
  version: TEMPLATE_COLLECTION_CONTRACT_VERSION_00956,
  collectionId: SCHOOL_01_COLLECTION_ID_00956,
  name: 'Школа — 01',
  category: 'education',
  locale: 'uk-UA',
  brand: {
    name: 'Ліцей «Обрій»',
    descriptor: 'Сучасний український ліцей',
    fictional: true
  },
  lifecycle: {
    status: 'collection-ready',
    visibleInGallery: true,
    templatesReady: true,
    assetsReady: true,
    templateReadiness: { header: true, main: true, footer: true },
    areaGalleryVisibility: { header: true, main: true, footer: true },
    nextStage: 'complete-00962'
  },
  authority: {
    collectionMetadata: 'this-contract',
    assetMetadata: 'assets/system/manifest.json',
    styleApplication: 'SiteFrameStore',
    runtimeAdapters: false,
    geometryIncluded: { header: true, main: true, footer: true }
  },
  templateIds: cloneJson00956_(SCHOOL_01_TEMPLATE_IDS_00956),
  styleProfiles: cloneJson00956_(SCHOOL_01_STYLE_PROFILES_00956),
  contentBlueprint: SCHOOL_01_CONTENT_BLUEPRINT_00956,
  components: SCHOOL_01_COMPONENTS_00956,
  assets: SCHOOL_01_ASSET_MANIFEST_00956,
  galleryPreview: {
    size: 'large',
    source: 'rendered-template',
    status: 'collection-ready',
    areaStatus: { header: 'ready', main: 'ready', footer: 'ready' },
    cardOrder: ['header', 'main', 'footer']
  }
};

export function validateSchool01CollectionContract00956(contract) {
  const errors = [];
  if (!contract || typeof contract !== 'object') return { ok: false, errors: ['contract must be an object'] };
  if (contract.version !== TEMPLATE_COLLECTION_CONTRACT_VERSION_00956) errors.push('invalid contract version');
  if (contract.collectionId !== SCHOOL_01_COLLECTION_ID_00956) errors.push('invalid collection id');
  if (contract.lifecycle?.status !== 'collection-ready') errors.push('collection must be at collection-ready stage');
  if (contract.lifecycle?.visibleInGallery !== true) errors.push('complete collection must be visible in the full collection gallery');
  if (contract.lifecycle?.templatesReady !== true) errors.push('all three collection templates must be ready');
  if (contract.lifecycle?.assetsReady !== true) errors.push('assets must be ready at asset-pack stage');
  if (contract.lifecycle?.templateReadiness?.header !== true || contract.lifecycle?.templateReadiness?.main !== true) errors.push('Header and Main templates must be ready');
  if (contract.lifecycle?.templateReadiness?.footer !== true) errors.push('Footer template must be ready');
  if (contract.lifecycle?.areaGalleryVisibility?.header !== true || contract.lifecycle?.areaGalleryVisibility?.main !== true) errors.push('Header and Main must be visible in their area galleries');
  if (contract.lifecycle?.areaGalleryVisibility?.footer !== true) errors.push('Footer must be visible in its area gallery');
  if (contract.lifecycle?.nextStage !== 'complete-00962') errors.push('invalid next stage');
  if (contract.authority?.assetMetadata !== 'assets/system/manifest.json') errors.push('asset metadata authority must be the system manifest');
  if (contract.authority?.geometryIncluded?.header !== true || contract.authority?.geometryIncluded?.main !== true || contract.authority?.geometryIncluded?.footer !== true) errors.push('Header, Main and Footer geometry must be included');
  if (contract.galleryPreview?.areaStatus?.header !== 'ready' || contract.galleryPreview?.areaStatus?.main !== 'ready' || contract.galleryPreview?.areaStatus?.footer !== 'ready') errors.push('Header, Main and Footer gallery previews must be ready');

  const areas = ['header', 'main', 'footer'];
  const ids = areas.map((area) => contract.templateIds?.[area]);
  if (new Set(ids).size !== areas.length || ids.some((id) => !id)) errors.push('template ids must be present and unique');
  areas.forEach((area) => {
    const profile = contract.styleProfiles?.[area];
    if (profile?.collectionId !== SCHOOL_01_COLLECTION_ID_00956) errors.push(`${area} profile has invalid collection id`);
    if (profile?.templateId !== contract.templateIds?.[area]) errors.push(`${area} profile has invalid template id`);
    if (profile?.area !== area) errors.push(`${area} profile has invalid area`);
  });
  if (contract.contentBlueprint?.main?.sections?.length !== 13) errors.push('main blueprint must contain exactly 13 sections');
  if (contract.assets?.length !== 10) errors.push('asset manifest must contain exactly 10 ready assets');
  if (contract.assets?.some((asset) => asset.status !== 'ready')) errors.push('all 00956 assets must be ready');
  if (contract.assets?.some((asset) => asset.metadataAuthority !== 'assets/system/manifest.json')) errors.push('all assets must use the system manifest authority');
  if (new Set((contract.assets || []).map((asset) => asset.path)).size !== contract.assets?.length) errors.push('asset paths must be unique');
  return { ok: errors.length === 0, errors };
}

export function assertSchool01CollectionContract00956(contract) {
  const result = validateSchool01CollectionContract00956(contract);
  if (!result.ok) throw new Error(`Invalid 00956 School 01 collection contract: ${result.errors.join('; ')}`);
  return deepFreeze00956_(cloneJson00956_(contract));
}

export const SCHOOL_01_COLLECTION_CONTRACT_00956 = assertSchool01CollectionContract00956(school01Contract00956_);
