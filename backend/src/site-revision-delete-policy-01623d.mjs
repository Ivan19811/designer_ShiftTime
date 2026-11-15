// 01623D · pure safety policy for test drafts. No DB side effects.
const clean=value=>String(value??'').trim();
export function classifyTestDraftDelete01623D({role='owner',userId='',authorUserId='',state='',hasHistory=false}={}){
  if(role!=='owner'&&(!clean(userId)||clean(userId)!==clean(authorUserId)))return 'ST_TEST_AUTHOR_REQUIRED_01613D';
  if(state==='processing')return 'ST_TEST_DRAFT_BUSY_01623D';
  if(['in_review','approved'].includes(clean(state))&&role!=='owner')return 'ST_TEST_REVIEW_DELETE_BLOCKED_01623D';
  if(hasHistory||!['editing','preview'].includes(clean(state)))return 'archive';
  return '';
}
