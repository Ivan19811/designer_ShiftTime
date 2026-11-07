// 01615B — Server-only allowlisted project merge. NO Netlify / orders / CRM writes.
import {siteTestError01613D,projectSha01613D,stableJson01613D,assertProductionUnchanged01613D} from './site-test-core-01613d.mjs';
import {compareSiteTestProjects01614B} from './site-test-compare-01614b.mjs';
const fail=(code,status=409)=>{throw siteTestError01613D(code,status);};
const same=(a,b)=>stableJson01613D(a??null)===stableJson01613D(b??null);
const clone=v=>structuredClone(v);
const HEADER_KEYS=['headerState','headerPageModes','headerGlobalMode','headerHidden','headerTemplateIds'];
const FOOTER_KEYS=['footerState','footerPageModes','footerGlobalMode','footerHidden','footerTemplateIds'];
const STYLES_KEYS=['globalStyleStore'];
const allowed=new Set(['pages','header','footer','styles']);
export function normalizeSiteTestSelection01615B(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!allowed.has(k)))fail('ST_TEST_APPLY_SELECTION_INVALID_01615B',400);
 const pages=value.pages??[];
 if(!Array.isArray(pages)||pages.length>100||pages.some(p=>typeof p!=='string'||!p.trim()||p.length>160)||new Set(pages).size!==pages.length)fail('ST_TEST_APPLY_SELECTION_INVALID_01615B',400);
 for(const name of ['header','footer','styles'])if(value[name]!==undefined&&typeof value[name]!=='boolean')fail('ST_TEST_APPLY_SELECTION_INVALID_01615B',400);
 const result={pages:[...pages].sort(),header:value.header===true,footer:value.footer===true,styles:value.styles===true};
 if(!(result.pages.length||result.header||result.footer||result.styles))fail('ST_TEST_APPLY_EMPTY_01615B',400);
 return result;
}
function page(project,id){return (project?.site?.pages||[]).find(p=>p?.id===id);}
function assertProject(project,siteId){if(!project||typeof project!=='object'||Array.isArray(project)||project.site?.id!==siteId||!Array.isArray(project.site?.pages)||!project.storage||typeof project.storage!=='object'||Array.isArray(project.storage))fail('ST_TEST_APPLY_PROJECT_INVALID_01615B');}
function assertSelectedContentMatchesBase(baseline,current,siteId,selection){
 const oldMap=baseline.storage.pageSnapshots||{},currentMap=current.storage.pageSnapshots||{};
 for(const id of selection.pages){
  if(!same(page(baseline,id),page(current,id))||!same(oldMap[`${siteId}:${id}`],currentMap[`${siteId}:${id}`]))fail('ST_TEST_APPLY_CONFLICT_01615B');
 }
 for(const [chosen,keys] of [[selection.header,HEADER_KEYS],[selection.footer,FOOTER_KEYS],[selection.styles,STYLES_KEYS]]){
  if(chosen&&keys.some(k=>!same(baseline.storage[k],current.storage[k])))fail('ST_TEST_APPLY_CONFLICT_01615B');
 }
}
export function composeSiteTestApply01615B({baseline,current,approved,siteId,selection}){
 const chosen=normalizeSiteTestSelection01615B(selection);
 for(const p of [baseline,current,approved])assertProject(p,siteId);
 const diff=compareSiteTestProjects01614B(baseline,approved), changed=new Set(diff.pageChanges.map(x=>x.pageId));
 if(chosen.pages.some(id=>!changed.has(id))||(chosen.header&&!diff.headerChanged)||(chosen.footer&&!diff.footerChanged)||(chosen.styles&&!diff.styleChanged))fail('ST_TEST_APPLY_NOT_CHANGED_01615B',400);
 assertSelectedContentMatchesBase(baseline,current,siteId,chosen);
 const merged=clone(current);
 const selected=new Set(chosen.pages);
 const draftPages=approved.site.pages||[];
 const targetMap=new Map(draftPages.map(p=>[p.id,p]));
 const originalOrder=new Map(merged.site.pages.map((p,i)=>[p.id,i]));
 merged.site.pages=merged.site.pages.filter(p=>!selected.has(p.id));
 for(const id of chosen.pages)if(targetMap.has(id)){
  const targetIndex=draftPages.findIndex(p=>p.id===id);
  // Insert according to approved page order without modifying any other page entry.
  const preceding=draftPages.slice(0,targetIndex).map(p=>p.id).reverse().find(p=>merged.site.pages.some(x=>x.id===p));
  const position=preceding?merged.site.pages.findIndex(p=>p.id===preceding)+1:Math.min(originalOrder.get(id)??merged.site.pages.length,merged.site.pages.length);
  merged.site.pages.splice(position,0,clone(targetMap.get(id)));
 }
 if(!merged.storage.pageSnapshots)merged.storage.pageSnapshots={};
 const originalSnap=approved.storage.pageSnapshots||{};
 for(const id of chosen.pages){const key=`${siteId}:${id}`;if(Object.prototype.hasOwnProperty.call(originalSnap,key))merged.storage.pageSnapshots[key]=clone(originalSnap[key]);else delete merged.storage.pageSnapshots[key];}
 for(const [selectedFlag,keys] of [[chosen.header,HEADER_KEYS],[chosen.footer,FOOTER_KEYS],[chosen.styles,STYLES_KEYS]]){
  if(!selectedFlag)continue;
  for(const k of keys){if(Object.prototype.hasOwnProperty.call(approved.storage,k))merged.storage[k]=clone(approved.storage[k]);else delete merged.storage[k];}
 }
 if(same(merged,current))fail('ST_TEST_APPLY_EMPTY_01615B',400);
 return {project:merged,selection:chosen,changes:diff,beforeSha:projectSha01613D(current),afterSha:projectSha01613D(merged)};
}
export function assertApprovedForApply01615B({row,role,currentRevision,allowSafeRebase=false}){
 if(role!=='owner')fail('ST_TEST_OWNER_REQUIRED_01613D',403);
 if(row?.state!=='approved'||row?.revision_kind!=='draft')fail('ST_TEST_APPLY_NOT_APPROVED_01615B');
 if(!row.review_snapshot_sha||projectSha01613D(row.project_json)!==row.review_snapshot_sha)fail('ST_TEST_REVIEW_CONTENT_CHANGED_01615A');
 if(!allowSafeRebase)assertProductionUnchanged01613D(row.base_project_revision,currentRevision);
 else if(Number(currentRevision)<Number(row.base_project_revision))fail('ST_TEST_ORIGINAL_CHANGED_01613D');
 return true;
}
export function siteTestApplyPlanToken01615B({testId,projectRevision,beforeSha,draftSha,selection,afterSha}){
 return projectSha01613D({stage:'01615B',testId,projectRevision,beforeSha,draftSha,selection,afterSha});
}
export function assertCanRollbackSiteTest01615B({row,role,revision,sha}){
 if(role!=='owner')fail('ST_TEST_OWNER_REQUIRED_01613D',403);
 if(row?.state!=='applied'||!row?.backup_revision_id||!row?.applied_project_sha||row.applied_project_sha!==sha||Number(row.applied_project_revision)!==Number(revision))fail('ST_TEST_ROLLBACK_CONFLICT_01615B');
 return true;
}
