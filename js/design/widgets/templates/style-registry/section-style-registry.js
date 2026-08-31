// 00953-SECTION-STYLE-FULL-CYCLE-STABLE
// Central catalog for reusable section styles. A registry record contains style
// semantics only; text, media, DOM structure and geometry never enter this API.

import { getHeaderTemplatesDemo } from '../header/header-templates.js?v=00984';
import { getMainTemplatesDemo } from '../main/main-templates.js?v=01039';
import { getFooterTemplatesDemo } from '../footer/footer-templates.js?v=00984';
import { loadTemplatesStore, saveTemplatesStore } from '../store/templates-store.js';
import { assertTemplateStyleProfile00945 } from '../style-profile/template-style-profile-contract.js';
import { getHeaderFooterPairStyleCandidates00965 } from '../style-pairs/header-footer-style-pairs-00965.js?v=00965';

export const SECTION_STYLE_REGISTRY_VERSION_00953 = 'st-section-style-registry-v2-00953';
export const SECTION_STYLE_FOLDER_ID_00953 = 'fld_section_styles';
export const SECTION_STYLE_TAB_ID_00953 = 'section-styles';

const AREA_LABELS_00950 = Object.freeze({ header: 'Шапка', main: 'Main', footer: 'Footer' });

function clone00950_(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function esc00950_(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function systemTemplates00950_() {
  return [
    ...(getHeaderTemplatesDemo() || []),
    ...(getMainTemplatesDemo() || []),
    ...(getFooterTemplatesDemo() || [])
  ];
}

function previewHtml00950_(profile, title, sourceArea) {
  const t = profile.theme;
  const c = t.colors;
  const typography = t.typography;
  const sections = t.sections;
  const containers = t.containers;
  const blocks = t.blocks;
  const buttons = t.buttons;
  const menu = t.menu;
  const icons = t.icons;
  const source = AREA_LABELS_00950[sourceArea] || sourceArea;
  const chips = [c.primary, c.accent, c.surface, c.surface2, c.text, c.border]
    .map((color) => `<i style="display:block;width:34px;height:34px;border-radius:10px;background:${esc00950_(color)};border:1px solid rgba(15,23,42,.16)"></i>`)
    .join('');

  return `
    <section data-section-style-preview="00953" style="box-sizing:border-box;width:100%;min-height:360px;padding:28px 32px;background:${esc00950_(sections.bg)};color:${esc00950_(sections.text)};border:${esc00950_(sections.borderWidth)} solid ${esc00950_(sections.borderColor)};border-radius:${esc00950_(sections.radius)};box-shadow:${esc00950_(sections.shadow)};font-family:${esc00950_(typography.textFont)};overflow:hidden">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:24px">
        <div style="min-width:0">
          <div style="font-size:12px;font-weight:850;letter-spacing:.12em;text-transform:uppercase;color:${esc00950_(c.accent)}">Стиль секцій · ${esc00950_(source)}</div>
          <div style="margin-top:8px;font-family:${esc00950_(typography.headingFont)};font-size:${esc00950_(typography.h2Size)};line-height:${esc00950_(typography.headingLineHeight)};font-weight:${esc00950_(typography.headingWeight)};letter-spacing:${esc00950_(typography.headingLetterSpacing)};color:${esc00950_(typography.headingColor)}">${esc00950_(title)}</div>
          <div style="margin-top:10px;max-width:680px;font-size:${esc00950_(typography.bodySize)};line-height:${esc00950_(typography.textLineHeight)};font-weight:${esc00950_(typography.textWeight)};color:${esc00950_(typography.textColor)}">Єдиний набір кольорів, типографіки, кнопок, меню, рамок, радіусів і тіней. Контент та геометрія не входять у стиль.</div>
        </div>
        <div style="display:flex;gap:8px;flex:0 0 auto">${chips}</div>
      </div>
      <div style="display:grid;grid-template-columns:1.25fr .75fr;gap:18px;margin-top:24px">
        <div style="padding:20px;background:${esc00950_(containers.bg)};color:${esc00950_(containers.text)};border:${esc00950_(containers.borderWidth)} solid ${esc00950_(containers.borderColor)};border-radius:${esc00950_(containers.radius)};box-shadow:${esc00950_(containers.shadow)}">
          <div style="display:flex;flex-wrap:wrap;gap:10px">
            <span style="padding:${esc00950_(menu.paddingY)} ${esc00950_(menu.paddingX)};border:${esc00950_(menu.itemBorderWidth)} solid ${esc00950_(menu.itemBorderColor)};border-radius:${esc00950_(menu.radius)};background:${esc00950_(menu.itemBg)};color:${esc00950_(menu.text)};font-size:${esc00950_(menu.fontSize)};font-weight:${esc00950_(menu.fontWeight)}">Головна</span>
            <span style="padding:${esc00950_(menu.paddingY)} ${esc00950_(menu.paddingX)};border:${esc00950_(menu.itemBorderWidth)} solid ${esc00950_(menu.activeBorderColor)};border-radius:${esc00950_(menu.radius)};background:${esc00950_(menu.activeBg)};color:${esc00950_(menu.activeText)};font-size:${esc00950_(menu.fontSize)};font-weight:${esc00950_(menu.fontWeight)}">Активний</span>
            <span style="padding:${esc00950_(menu.paddingY)} ${esc00950_(menu.paddingX)};border:${esc00950_(menu.itemBorderWidth)} solid ${esc00950_(menu.hoverBorderColor)};border-radius:${esc00950_(menu.radius)};background:${esc00950_(menu.hoverBg)};color:${esc00950_(menu.hoverText)};font-size:${esc00950_(menu.fontSize)};font-weight:${esc00950_(menu.fontWeight)}">Наведення</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:20px">
            <span style="display:inline-flex;align-items:center;justify-content:center;padding:${esc00950_(buttons.paddingY)} ${esc00950_(buttons.paddingX)};border:${esc00950_(buttons.primaryBorderWidth)} solid ${esc00950_(buttons.primaryBorderColor)};border-radius:${esc00950_(buttons.radius)};background:${esc00950_(buttons.primaryBg)};color:${esc00950_(buttons.primaryText)};box-shadow:${esc00950_(buttons.shadow)};font-size:${esc00950_(buttons.fontSize)};font-weight:${esc00950_(buttons.fontWeight)}">Головна дія</span>
            <span style="display:inline-flex;align-items:center;justify-content:center;padding:${esc00950_(buttons.paddingY)} ${esc00950_(buttons.paddingX)};border:${esc00950_(buttons.secondaryBorderWidth)} solid ${esc00950_(buttons.secondaryBorderColor)};border-radius:${esc00950_(buttons.radius)};background:${esc00950_(buttons.secondaryBg)};color:${esc00950_(buttons.secondaryText)};font-size:${esc00950_(buttons.fontSize)};font-weight:${esc00950_(buttons.fontWeight)}">Додаткова</span>
          </div>
        </div>
        <div style="padding:20px;background:${esc00950_(blocks.altBg)};color:${esc00950_(blocks.altText)};border:${esc00950_(blocks.borderWidth)} solid ${esc00950_(blocks.borderColor)};border-radius:${esc00950_(blocks.radius)};box-shadow:${esc00950_(blocks.hoverShadow)}">
          <div style="display:flex;align-items:center;gap:12px">
            <i style="display:inline-flex;width:${esc00950_(icons.size)};height:${esc00950_(icons.size)};padding:10px;align-items:center;justify-content:center;border:${esc00950_(icons.borderWidth)} solid ${esc00950_(icons.borderColor)};border-radius:${esc00950_(icons.radius)};background:${esc00950_(icons.bg)};color:${esc00950_(icons.color)};font-style:normal;font-weight:900">◆</i>
            <div style="font-size:${esc00950_(blocks.headingFontSize)};font-weight:${esc00950_(blocks.headingFontWeight)};line-height:${esc00950_(blocks.headingLineHeight)};color:${esc00950_(blocks.headingText)}">Семантична картка</div>
          </div>
          <div style="margin-top:14px;font-size:${esc00950_(typography.bodySize)};line-height:${esc00950_(typography.textLineHeight)};color:${esc00950_(typography.textColor)}">Прев’ю будується з профілю, тому показує саме зареєстрований стиль, а не копію структури шаблону.</div>
        </div>
      </div>
    </section>`;
}

function recordFromCandidate00950_(candidate, source = 'system') {
  const rawProfile = candidate?.styleProfile || candidate?.profile;
  if (!rawProfile) return null;
  let profile;
  try {
    profile = assertTemplateStyleProfile00945(rawProfile, {
      templateId: String(rawProfile.templateId || candidate?.templateId || ''),
      area: String(rawProfile.area || candidate?.sourceArea || '')
    });
  } catch (error) {
    console.warn('[section-style-registry][00950] rejected invalid profile', {
      profileId: String(rawProfile?.profileId || ''),
      issues: Array.isArray(error?.issues) ? error.issues : [String(error?.message || error || '')]
    });
    return null;
  }
  const templateName = String(candidate?.name || candidate?.title || profile.templateId || profile.profileId);
  const explicitStyleName = candidate?.styleName || (source === 'user-style' ? candidate?.name : '');
  const styleName = String(explicitStyleName || `${templateName} · стиль`);
  const styleId = String(candidate?.styleId || `section_style_${profile.profileId}`);
  const compatibleAreas = Array.isArray(candidate?.meta?.compatibleAreas)
    ? candidate.meta.compatibleAreas.map(String).filter((area) => ['header','main','footer'].includes(area))
    : ['header','main','footer'];
  const resolvedCompatibleAreas = compatibleAreas.length ? compatibleAreas : ['header','main','footer'];
  return Object.freeze({
    id: styleId,
    styleId,
    type: SECTION_STYLE_TAB_ID_00953,
    folderId: SECTION_STYLE_FOLDER_ID_00953,
    name: styleName,
    description: String(candidate?.description || 'Зареєстрований семантичний стиль секцій.'),
    profileId: profile.profileId,
    collectionId: profile.collectionId,
    templateId: profile.templateId,
    sourceArea: profile.area,
    compatibleAreas: Object.freeze(resolvedCompatibleAreas.slice()),
    registryVersion: SECTION_STYLE_REGISTRY_VERSION_00953,
    styleProfile: profile,
    previewHtml: previewHtml00950_(profile, styleName, profile.area),
    html: previewHtml00950_(profile, styleName, profile.area),
    meta: Object.freeze({
      source,
      sectionStyleRegistry: true,
      sourceTemplateId: profile.templateId,
      sourceArea: profile.area,
      profileId: profile.profileId,
      compatibleAreas: Object.freeze(resolvedCompatibleAreas.slice())
    })
  });
}

const SOURCE_PRIORITY_00953 = Object.freeze({ system: 1, 'system-pair': 1, 'user-template': 2, 'user-style': 3 });

function buildSectionStyleRegistry00953_(store) {
  const userTemplates = Array.isArray(store?.items) ? store.items : [];
  const standalone = [
    ...(Array.isArray(store?.sectionStyles00950) ? store.sectionStyles00950 : []),
    ...(Array.isArray(store?.sectionStyles00953) ? store.sectionStyles00953 : [])
  ];
  const candidates = [
    ...getHeaderFooterPairStyleCandidates00965().map((item) => ({ candidate: item, source: 'system-pair' })),
    ...systemTemplates00950_().map((item) => ({ candidate: item, source: 'system' })),
    ...userTemplates.map((item) => ({ candidate: item, source: 'user-template' })),
    ...standalone.map((item) => ({ candidate: item, source: 'user-style' }))
  ];
  const byProfileId = new Map();
  candidates.forEach(({ candidate, source }) => {
    const record = recordFromCandidate00950_(candidate, source);
    if (!record) return;
    const previous = byProfileId.get(record.profileId) || null;
    const previousPriority = SOURCE_PRIORITY_00953[previous?.meta?.source] || 0;
    const nextPriority = SOURCE_PRIORITY_00953[source] || 0;
    if (!previous || nextPriority >= previousPriority) byProfileId.set(record.profileId, record);
  });
  return Array.from(byProfileId.values());
}

function registryFingerprint00953_(record) {
  const serialized = JSON.stringify({
    styleId: record.styleId,
    name: record.name,
    description: record.description,
    profileId: record.profileId,
    sourceArea: record.sourceArea,
    sourceTemplateId: record.templateId,
    source: record.meta?.source || '',
    styleProfile: record.styleProfile
  });
  let hash = 2166136261;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}-${serialized.length}`;
}

function updateRegistryIndex00953_(store, records) {
  if (!store || typeof store !== 'object') return false;
  if (!store.meta || typeof store.meta !== 'object') store.meta = {};
  const previous = store.meta.sectionStyleRegistry00953;
  const previousByProfile = new Map(
    (Array.isArray(previous?.records) ? previous.records : [])
      .map((item) => [String(item?.profileId || ''), item])
      .filter(([profileId]) => !!profileId)
  );
  const now = new Date().toISOString();
  const indexed = records.map((record) => {
    const prior = previousByProfile.get(record.profileId) || null;
    const fingerprint = registryFingerprint00953_(record);
    const unchanged = prior?.fingerprint === fingerprint;
    return {
      styleId: record.styleId,
      styleName: record.name,
      profileId: record.profileId,
      collectionId: record.collectionId,
      sourceArea: record.sourceArea,
      sourceTemplateId: record.templateId,
      source: String(record.meta?.source || ''),
      fingerprint,
      registeredAt: String(prior?.registeredAt || now),
      updatedAt: String(unchanged ? (prior?.updatedAt || prior?.registeredAt || now) : now)
    };
  });
  const next = {
    version: SECTION_STYLE_REGISTRY_VERSION_00953,
    folderId: SECTION_STYLE_FOLDER_ID_00953,
    dedupeKey: 'profileId',
    records: indexed
  };
  if (JSON.stringify(previous || null) === JSON.stringify(next)) return false;
  store.meta.sectionStyleRegistry00953 = next;
  return true;
}

export function getSectionStyleRegistry00953() {
  let store = null;
  try { store = loadTemplatesStore(); } catch (_) {}
  const records = buildSectionStyleRegistry00953_(store);
  try {
    if (store && updateRegistryIndex00953_(store, records)) saveTemplatesStore(store);
  } catch (error) {
    console.warn('[section-style-registry][00953] registry index save failed', error);
  }
  return Object.freeze(records);
}

export function getSectionStyleByProfileId00953(profileId) {
  const id = String(profileId || '');
  return getSectionStyleRegistry00953().find((record) => record.profileId === id) || null;
}

export function getSectionStyleById00953(styleId) {
  const id = String(styleId || '');
  return getSectionStyleRegistry00953().find((record) => record.styleId === id || record.id === id) || null;
}

export function registerSectionStyle00953({ name = '', description = '', styleProfile = null } = {}) {
  const record = recordFromCandidate00950_({ name, description, styleProfile }, 'user-style');
  if (!record) return Object.freeze({ ok: false, reason: 'invalid-style-profile' });
  const store = loadTemplatesStore();
  const replacedExistingProfile = buildSectionStyleRegistry00953_(store).some((item) => item.profileId === record.profileId);
  const styles = [
    ...(Array.isArray(store.sectionStyles00950) ? store.sectionStyles00950 : []),
    ...(Array.isArray(store.sectionStyles00953) ? store.sectionStyles00953 : [])
  ];
  const serialized = {
    styleId: record.styleId,
    styleName: record.name,
    description: record.description,
    styleProfile: clone00950_(record.styleProfile),
    registeredAt: new Date().toISOString()
  };
  const index = styles.findIndex((item) => String(item?.styleProfile?.profileId || '') === record.profileId);
  if (index >= 0) styles[index] = serialized;
  else styles.push(serialized);
  store.sectionStyles00953 = styles.filter((item, position, all) => {
    const profileId = String(item?.styleProfile?.profileId || '');
    return profileId && all.findLastIndex((candidate) => String(candidate?.styleProfile?.profileId || '') === profileId) === position;
  });
  delete store.sectionStyles00950;
  const records = buildSectionStyleRegistry00953_(store);
  updateRegistryIndex00953_(store, records);
  saveTemplatesStore(store);
  const savedRecord = records.find((item) => item.profileId === record.profileId) || record;
  return Object.freeze({ ok: true, record: clone00950_(savedRecord), replaced: replacedExistingProfile });
}

try {
  window.ST_SECTION_STYLE_REGISTRY_00953 = Object.freeze({
    list: getSectionStyleRegistry00953,
    getById: getSectionStyleById00953,
    getByProfileId: getSectionStyleByProfileId00953,
    register: registerSectionStyle00953
  });
} catch (_) {}
