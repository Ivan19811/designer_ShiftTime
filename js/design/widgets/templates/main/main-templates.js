// js/design/widgets/templates/main/main-templates.js
// [00891] System Main templates use the same runtime-source contract as Header/Footer.
// They are not stored as large system payloads in localStorage; the gallery merges
// them directly from this module and SiteFrameStore becomes the applied-site authority.

import { MAIN_SELECTION_CARDS_PROFILE_00946 } from '../style-profile/main-selection-cards-profile-00946.js';
import { CLEAN_MAIN_TEMPLATE_01039 } from './clean-main-template-01039.js?v=01039';
import { SCHOOL_01_MAIN_TEMPLATE_00959 } from './school-01-main-template-00959.js?v=00959';
import { SHIFTTIME_MARKETPLACE_01_MAIN_TEMPLATE_00981 } from './shifttime-marketplace-01-main-template-00981.js?v=00981';
import { SHIFTTIME_MARKETPLACE_02_MAIN_TEMPLATE_01024 } from './shifttime-marketplace-02-main-template-01024.js?v=01024';
import { STANDARD_PAGE_MAIN_TEMPLATES_01032 } from './shifttime-standard-page-mains-01034.js?v=01035';

const MAIN_TEMPLATES = [
  CLEAN_MAIN_TEMPLATE_01039,
  ...STANDARD_PAGE_MAIN_TEMPLATES_01032,
  SHIFTTIME_MARKETPLACE_02_MAIN_TEMPLATE_01024,
  SHIFTTIME_MARKETPLACE_01_MAIN_TEMPLATE_00981,
  SCHOOL_01_MAIN_TEMPLATE_00959,
  {
    id: 'main_selection_cards_00888',
    type: 'main',
    folderId: 'fld_main_other',
    name: 'Маїн · Дві картки',
    preview: 'main-two-cards-00888',
    description: 'Чиста Main-секція з рівнем, двома контейнерами, заголовками і текстом.',
    meta: {
      source: 'system',
      stage: '00891',
      siteFrameStore: true,
      mainApplyModes: ['add', 'replace']
    },
    styleProfile: MAIN_SELECTION_CARDS_PROFILE_00946,
    html: `<section class="st-section" style="width:100%;padding:32px;box-sizing:border-box;background:linear-gradient(135deg,#f8fafc,#eef2ff);border:1px solid rgba(99,102,241,.18);border-radius:18px;color:#0f172a;"><div class="st-row" data-st-node="level" style="display:flex;gap:20px;width:100%;align-items:stretch;"><div class="st-block" data-st-node="container" style="display:flex;flex:1 1 0;flex-direction:column;gap:10px;padding:24px;background:#fff;border:1px solid rgba(148,163,184,.35);border-radius:14px;"><div class="hb-elem st-block st-block--heading" style="font-size:22px;font-weight:800;color:#312e81;background:transparent;border:0;border-radius:0;box-shadow:none;">MAIN · НОВА СЕКЦІЯ</div><div class="hb-elem st-block st-block--text" style="font-size:14px;line-height:1.55;color:#475569;background:transparent;border:0;border-radius:0;box-shadow:none;">Шаблон додано через чистий SiteFrameStore.</div></div><div class="st-block" data-st-node="container" style="display:flex;flex:1 1 0;flex-direction:column;gap:10px;padding:24px;background:#fff;border:1px solid rgba(148,163,184,.35);border-radius:14px;"><div class="hb-elem st-block st-block--heading" style="font-size:22px;font-weight:800;color:#0f766e;background:transparent;border:0;border-radius:0;box-shadow:none;">ADD / REPLACE</div><div class="hb-elem st-block st-block--text" style="font-size:14px;line-height:1.55;color:#475569;background:transparent;border:0;border-radius:0;box-shadow:none;">Додати створює нову секцію, Замінити змінює активну.</div></div></div></section>`
  }
];

function cloneTemplate_(template) {
  try { return JSON.parse(JSON.stringify(template)); }
  catch { return { ...template }; }
}

export function getMainTemplatesDemo() {
  return MAIN_TEMPLATES.map(cloneTemplate_);
}
