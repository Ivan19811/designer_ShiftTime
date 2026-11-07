// 01617 · Safe multi-author overview. Never expose projects, tokens or other users'
// private branches to a contributor. Caller must first scope the SQL query.
const clean=v=>String(v??'').trim();
export function summarizeSiteTestCollaborators01617(rows,{owner=false,userId='',originalRevision=0}={}){
 const groups=new Map();
 for(const branch of Array.isArray(rows)?rows:[]){
  const author=clean(branch.author_user_id||branch.authorUserId);
  if(!author||(!owner&&author!==clean(userId)))continue;
  const group=groups.get(author)||{authorUserId:author,branchCount:0,editing:0,inReview:0,approved:0,applied:0,updatedAt:null};
  const state=clean(branch.state);
  group.branchCount++;
  if(['editing','preview'].includes(state))group.editing++;
  if(state==='in_review')group.inReview++;
  if(state==='approved')group.approved++;
  if(state==='applied')group.applied++;
  const at=branch.updated_at||branch.updatedAt||null;
  if(at&&(!group.updatedAt||new Date(at)>new Date(group.updatedAt)))group.updatedAt=at;
  groups.set(author,group);
 }
 return {stage:'01617',originalProjectRevision:Number(originalRevision)||0,managerCount:groups.size,
  activeCount:[...groups.values()].reduce((n,g)=>n+g.editing,0),
  pendingCount:[...groups.values()].reduce((n,g)=>n+g.inReview,0),
  collaborators:[...groups.values()].sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')))};
}
export function assertOriginalWriteVersion01617({expectedRevision,currentRevision,protectedByTest=false}={}){
 const expected=Number(expectedRevision),current=Number(currentRevision);
 if(expectedRevision===undefined||expectedRevision===null||expectedRevision===''){
  if(protectedByTest)throw Object.assign(new Error('Current Render revision is required'),{code:'ST_ORIGINAL_EXPECTED_REVISION_REQUIRED_01617',statusCode:409});
  return {checked:false};
 }
 if(!Number.isSafeInteger(expected)||expected<1||!Number.isSafeInteger(current)||current<1||expected!==current)
  throw Object.assign(new Error('Original project changed on Render; reload before saving'),{code:'ST_ORIGINAL_STALE_REVISION_01617',statusCode:409});
 return {checked:true,revision:current};
}
