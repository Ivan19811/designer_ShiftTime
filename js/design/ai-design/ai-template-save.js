// AI template saving for removed content-page templates is disabled in clean base.
export const AI_TEMPLATES_TAB = 'ai-templates';
export const AI_SECTIONS_FOLDER_ID = 'fld_ai_sections';
export function buildAiSectionTemplateName({ customName = '' } = {}) {
  return String(customName || 'AI section').trim();
}
export function saveAiSectionTemplate() {
  return { ok: false, reason: 'content-templates-disabled-clean-base' };
}
