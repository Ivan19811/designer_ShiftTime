// 01619B · Immutable, per-submission acceptance identity and compact audit metadata.
// A manager may submit a NEW revision of the same block. An accepted change from
// the SAME immutable revision cannot be applied again, even after a rollback.
import {projectSha01613D,siteTestError01613D} from './site-test-core-01613d.mjs';
const clean=x=>String(x??'').trim();
const fail=()=>{throw siteTestError01613D('ST_TEST_CHANGE_ALREADY_ACCEPTED_01619B',409);};
export const acceptanceKey01619B=(revisionId,changeId)=>`${clean(revisionId)}\u241f${clean(changeId)}`;
export function assertUnusedAcceptances01619B(decisions,revisionByTest,previousRows){
 const taken=new Set((previousRows||[]).map(x=>acceptanceKey01619B(x.revision_id,x.change_id)));
 for(const row of decisions||[]){
  if(row.decision!=='accept')continue;
  const revisionId=revisionByTest.get(row.testId);
  if(!revisionId)throw siteTestError01613D('ST_TEST_CHANGE_SELECTION_STALE_01618',409);
  if(taken.has(acceptanceKey01619B(revisionId,row.changeId)))fail();
 }
}
function fieldValue(project,siteId,pageId,nodeId,field){
 return project?.storage?.pageSnapshots?.[`${siteId}:${pageId}`]?.siteFrameMain01040?.nodes?.[nodeId]?.[field];
}
function summary(value){
 const str=typeof value==='string'?value:JSON.stringify(value??null);
 return String(str).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
}
export function acceptanceAudit01619B({siteId,applied,before,after,revisionByTest}){
 return applied.map(change=>{
  const revisionId=revisionByTest.get(change.testId);
  if(!revisionId)throw siteTestError01613D('ST_TEST_CHANGE_SELECTION_STALE_01618',409);
  const oldValue=fieldValue(before,siteId,change.pageId,change.nodeId,change.field);
  const newValue=fieldValue(after,siteId,change.pageId,change.nodeId,change.field);
  return {testId:change.testId,revisionId,changeId:change.changeId,pageId:change.pageId,
   nodeId:change.nodeId,sourceNodeId:change.sourceNodeId,field:change.field,matchMethod:change.matchMethod,
   beforePreview:summary(oldValue),afterPreview:summary(newValue),
   beforeFieldSha:projectSha01613D(oldValue??null),afterFieldSha:projectSha01613D(newValue??null)};
 });
}
