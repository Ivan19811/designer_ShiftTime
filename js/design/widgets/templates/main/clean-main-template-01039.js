// 01039 · Canonical clean Main template for scratch pages, component tests and page assembly.
import {
  assertTemplateStyleProfile00945,
  TEMPLATE_STYLE_PROFILE_VERSION_00945
} from '../style-profile/template-style-profile-contract.js';
import { MAIN_SELECTION_CARDS_PROFILE_00946 } from '../style-profile/main-selection-cards-profile-00946.js';

export const CLEAN_MAIN_TEMPLATE_ID_01039 = 'main-clean-canvas-01039';

const theme = JSON.parse(JSON.stringify(MAIN_SELECTION_CARDS_PROFILE_00946.theme));
theme.colors.primary = '#0f172a';
theme.colors.accent = '#64748b';
theme.colors.surface = '#ffffff';
theme.colors.surface2 = '#f8fafc';
theme.colors.text = '#0f172a';
theme.colors.muted = '#64748b';
theme.sections.bg = '#ffffff';
theme.sections.altBg = '#f8fafc';
theme.sections.altText = '#0f172a';
theme.sections.borderWidth = '0px';
theme.sections.borderColor = 'transparent';
theme.sections.radius = '0px';
theme.sections.shadow = 'none';
theme.containers.bg = 'transparent';
theme.containers.altBg = '#f8fafc';
theme.containers.borderWidth = '0px';
theme.containers.borderColor = 'transparent';
theme.containers.radius = '0px';
theme.containers.shadow = 'none';
theme.blocks.bg = 'transparent';
theme.blocks.altBg = '#f8fafc';
theme.blocks.borderWidth = '0px';
theme.blocks.borderColor = 'transparent';
theme.blocks.radius = '0px';
theme.blocks.shadow = 'none';
theme.spacing.sectionPaddingY = '0px';
theme.spacing.sectionPaddingX = '0px';
theme.spacing.containerPadding = '0px';
theme.spacing.levelGap = '0px';
theme.spacing.containerGap = '0px';
theme.spacing.blockGap = '0px';

const styleProfile = assertTemplateStyleProfile00945({
  version: TEMPLATE_STYLE_PROFILE_VERSION_00945,
  profileId: 'main-clean-canvas-01039-style',
  collectionId: 'clean-builder-canvas-01039',
  templateId: CLEAN_MAIN_TEMPLATE_ID_01039,
  area: 'main',
  theme
}, { templateId: CLEAN_MAIN_TEMPLATE_ID_01039, area: 'main' });

const html = `<section class="st-section st-main-clean-01039" data-name="Чистий Маїн" style="width:100%;min-height:520px;margin:0;padding:0;box-sizing:border-box;background:#ffffff;color:#0f172a;border:0;border-radius:0;box-shadow:none;overflow:visible;">
  <div class="st-row st-main-clean-level-01039" data-st-node="level" data-name="Чистий рівень" style="display:flex;flex-direction:row;align-items:stretch;width:100%;min-height:520px;margin:0;padding:0;gap:0;box-sizing:border-box;overflow:visible;">
    <div class="st-block st-main-clean-container-01039" data-st-node="container" data-name="Чистий контейнер" style="display:flex;flex:1 1 auto;flex-direction:column;align-items:stretch;justify-content:flex-start;width:100%;min-width:0;min-height:520px;margin:0;padding:0;gap:0;background:transparent;border:0;border-radius:0;box-shadow:none;box-sizing:border-box;overflow:visible;"></div>
  </div>
</section>`;

export const CLEAN_MAIN_TEMPLATE_01039 = Object.freeze({
  id: CLEAN_MAIN_TEMPLATE_ID_01039,
  type: 'main',
  folderId: 'fld_main_clean',
  name: '00 · Чистий Маїн',
  preview: 'clean-main-01039',
  description: 'Чистий canonical Main: одна секція → один рівень → один порожній контейнер. Для створення сторінок з нуля, тестів компонентів і складання нових блоків.',
  meta: Object.freeze({
    source: 'system',
    stage: '01039',
    category: 'clean-template',
    locale: 'uk-UA',
    siteFrameStore: true,
    cleanTemplate01039: true,
    canonicalMainRoot: true,
    mainApplyModes: ['add','replace'],
    replaceScope: 'main-area',
    singleSourceOfTruth: 'SiteFrameStore-after-apply'
  }),
  styleProfile,
  html,
  previewHtml: html
});
