// AI content-page generation history disabled in CLEAN-BASE-0001.
export const AI_PAGE_GENERATION_HISTORY_KEY = 'st_ai_design_disabled_page_generation_history_v1';
export const AI_PAGE_GENERATION_HISTORY_MAX = 0;
export function loadAiPageGenerationHistory(){ return []; }
export function saveAiPageGenerationHistory(){ return false; }
export function pushAiPageGenerationHistory(){ return null; }
export function markAiPageGenerationHistoryItem(){ return null; }
export function restoreAiPageGenerationHistoryItem(){ return null; }
export function deleteAiPageGenerationHistoryItem(){ return false; }
export function clearAiPageGenerationHistory(){ return false; }
export function compactAiPageHistoryLabel(){ return 'disabled'; }
