// 01618 · Owner-selected, per-node changes from immutable submitted revisions.
// Only allowlisted visual Main node properties are eligible. This deliberately
// cannot change the production deploy, orders, products, CRM, auth or site roles.
import {projectSha01613D,stableJson01613D,siteTestError01613D} from './site-test-core-01613d.mjs';
const clean=v=>String(v??'').trim();
const same=(a,b)=>stableJson01613D(a??null)===stableJson01613D(b??null);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const fail=(code,status=400)=>{throw siteTestError01613D(code,status);};
const clone=v=>v===undefined?undefined:structuredClone(v);
const FIELDS=['content','style','styles','layout','attributes','props','classes'];
const safeId=v=>typeof v==='string'&&v.length>0&&v.length<=200&&!v.includes('__proto__')&&!v.includes('constructor');
function nodeMap(p,siteId,pageId){const snap=p?.storage?.pageSnapshots?.[`${siteId}:${pageId}`];const main=snap?.siteFrameMain01040;return obj(main?.nodes)?main.nodes:null;}
function sample(v){const s=typeof v==='string'?v:typeof v==='object'&&v!==null?(typeof v.text==='string'?v.text:JSON.stringify(v)):String(v??'');return s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim().slice(0,180);}
export function listSelectableSiteTestChanges01618({baseline,submitted,siteId,testId,authorUserId=''}){
 if(!obj(baseline)||!obj(submitted)||clean(submitted.site?.id)!==siteId||clean(baseline.site?.id)!==siteId)fail('ST_TEST_CHANGE_PROJECT_INVALID_01618');
 const oldPages=new Map((baseline.site?.pages||[]).map(p=>[p.id,p])),newPages=new Map((submitted.site?.pages||[]).map(p=>[p.id,p]));
 const changes=[];let unsupported=0;
 for(const [pageId,page] of newPages){
  if(!safeId(pageId)||!oldPages.has(pageId))continue;
  const before=nodeMap(baseline,siteId,pageId),after=nodeMap(submitted,siteId,pageId);
  if(!before||!after)continue;
  for(const [nodeId,target] of Object.entries(after)){
   if(!safeId(nodeId)||!obj(target)||!obj(before[nodeId]))continue;
   const base=before[nodeId];
   for(const field of FIELDS){
    if(same(base[field],target[field]))continue;
    const id='ch_'+projectSha01613D({siteId,testId,pageId,nodeId,field}).slice(0,28);
    changes.push({id,testId,authorUserId,pageId,pageTitle:clean(page.title||page.name||pageId).slice(0,140),nodeId,field,
      category:field==='content'?'text':field==='layout'?'layout':'style',before:sample(base[field]),after:sample(target[field])});
   }
  }
  // Structural changes remain available only through the existing whole-page
  // approval flow. Never fake an individual selector for an added/deleted node.
  const aIds=Object.keys(after),bIds=Object.keys(before);
  unsupported+=aIds.filter(id=>!Object.hasOwn(before,id)).length+bIds.filter(id=>!Object.hasOwn(after,id)).length;
 }
 if(changes.length>2000)fail('ST_TEST_CHANGE_TOO_MANY_01618',413);
 return {changes,structuralChanges:unsupported};
}
export function validateSiteTestChangeDecisions01618(input){
 if(!Array.isArray(input)||!input.length||input.length>250)fail('ST_TEST_CHANGE_SELECTION_INVALID_01618');
 const set=new Set();
 return input.map((x,index)=>{
  if(!obj(x)||!safeId(x.testId)||!safeId(x.changeId)||!['accept','reject'].includes(x.decision)||set.has(x.testId+'\u241f'+x.changeId))fail('ST_TEST_CHANGE_SELECTION_INVALID_01618');
  set.add(x.testId+'\u241f'+x.changeId);
  return {testId:x.testId,changeId:x.changeId,decision:x.decision,index};
 });
}
export function composeSelectedSiteTestChanges01618({current,siteId,decisions,changesByTest,projectsByTest}){
 if(!obj(current)||clean(current.site?.id)!==siteId)fail('ST_TEST_CHANGE_PROJECT_INVALID_01618');
 const selected=validateSiteTestChangeDecisions01618(decisions),out=clone(current),applied=[],rejected=[],overwrites=[];
 const touched=new Map();
 for(const selection of selected){
  const info=(changesByTest.get(selection.testId)||[]).find(x=>x.id===selection.changeId);
  if(!info)fail('ST_TEST_CHANGE_SELECTION_STALE_01618',409);
  const key=`${info.pageId}\u241f${info.nodeId}\u241f${info.field}`;
  if(selection.decision==='reject'){rejected.push({testId:selection.testId,changeId:selection.changeId});continue;}
  const originalNode=nodeMap(out,siteId,info.pageId)?.[info.nodeId];
  const submittedNode=nodeMap(projectsByTest.get(selection.testId),siteId,info.pageId)?.[info.nodeId];
  if(!obj(originalNode)||!obj(submittedNode))fail('ST_TEST_CHANGE_NODE_MISSING_01618',409);
  if(touched.has(key))overwrites.push({pageId:info.pageId,nodeId:info.nodeId,field:info.field,previousTestId:touched.get(key),nextTestId:selection.testId});
  touched.set(key,selection.testId);
  if(Object.hasOwn(submittedNode,info.field))originalNode[info.field]=clone(submittedNode[info.field]);
  else delete originalNode[info.field];
  applied.push({testId:selection.testId,changeId:selection.changeId,pageId:info.pageId,nodeId:info.nodeId,field:info.field});
 }
 if(!applied.length)fail('ST_TEST_CHANGE_NO_ACCEPTED_01618');
 if(same(out,current))fail('ST_TEST_CHANGE_NO_DIFFERENCE_01618',409);
 return {project:out,applied,rejected,overwrites,beforeSha:projectSha01613D(current),afterSha:projectSha01613D(out)};
}
export function siteTestSelectionPlanToken01618({siteId,revision,beforeSha,afterSha,decisions,sourceShas}){
 return projectSha01613D({stage:'01618',siteId,revision,beforeSha,afterSha,decisions,sourceShas});
}
