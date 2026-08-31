// AI content-page generator disabled in CLEAN-BASE-0001.
export const AI_PAGE_HTML_KEY = 'st_ai_design_disabled_page_html_v1';
export const AI_PAGE_META_KEY = 'st_ai_design_disabled_page_meta_v1';
export const AI_PAGE_QUALITY_KEY = 'st_ai_design_disabled_page_quality_v1';
export const AI_PAGE_PROMPT_KEY = 'st_ai_design_disabled_page_prompt_v1';
export const AI_PAGE_TEMPLATE_NAME_KEY = 'st_ai_design_disabled_page_template_name_v1';
export const AI_PAGE_LAST_SAVED_TEMPLATE_ID_KEY = 'st_ai_design_disabled_last_saved_page_template_id_v1';
export const AI_PAGE_TYPES = [];
export function getAiPageTypeOptions(){ return []; }
export function resolveAiPageBlueprint(){ return null; }
export function buildAiPageSectionPrompt(){ return ''; }
export function buildAiPagePlanText(){ return ''; }
export function analyzeAiPageQuality(){ return { ok:false, score:0, issues:[], summary:'disabled in clean base' }; }
