// 01616 - guarded three-way reconciliation for server-owned visual project only.
// Source: immutable published revision; current: editable original; draft: approved test.
// Never copies commerce/CRM data or modifies Netlify.
import {compareSiteTestProjects01614B} from './site-test-compare-01614b.mjs';
import {projectSha01613D,stableJson01613D,siteTestError01613D} from './site-test-core-01613d.mjs';
import {normalizeSiteTestSelection01615B} from './site-test-apply-core-01615b.mjs';
const own=(v,k)=>v!==null&&typeof v==='object'&&Object.prototype.hasOwnProperty.call(v,k);
const same=(a,b)=>a===undefined&&b===undefined||a!==undefined&&b!==undefined&&stableJson01613D(a)===stableJson01613D(b);
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const clone=v=>v===undefined?undefined:structuredClone(v);
const HDR=['headerState','headerPageModes','headerGlobalMode','headerHidden','headerTemplateIds'];
const FTR=['footerState','footerPageModes','footerGlobalMode','footerHidden','footerTemplateIds'];
const CSS=['globalStyleStore'];
const err=(code,status=409)=>{throw siteTestError01613D(code,status);};
const findPage=(p,id)=>p.site.pages.find(x=>x?.id===id);
export function normalizeSiteTestOverrides01616(value,selection){
 if(value===undefined||value===null)value={};
 if(!plain(value)||Object.keys(value).some(k=>!['pages','header','footer','styles'].includes(k)))err('ST_TEST_APPLY_RESOLUTION_INVALID_01616',400);
 const pages=value.pages??[];
 if(!Array.isArray(pages)||pages.some(p=>typeof p!=='string'||!selection.pages.includes(p))||new Set(pages).size!==pages.length)err('ST_TEST_APPLY_RESOLUTION_INVALID_01616',400);
 for(const area of ['header','footer','styles'])if(value[area]!==undefined&&typeof value[area]!=='boolean'||value[area]===true&&!selection[area])err('ST_TEST_APPLY_RESOLUTION_INVALID_01616',400);
 return {pages:[...pages].sort(),header:value.header===true,footer:value.footer===true,styles:value.styles===true};
}
function mergeNode(base,current,approved,ctx,path,depth=0){
 if(++ctx.visited>100000||depth>64){ctx.conflicts.push({area:ctx.area,path:path.join('.')});return clone(current);}
 if(same(current,base))return clone(approved);
 if(same(approved,base)||same(current,approved))return clone(current);
 if(plain(base)&&plain(current)&&plain(approved)){
  const out=Object.create(null);
  for(const key of new Set([...Object.keys(base),...Object.keys(current),...Object.keys(approved)])){
   // Defensive JSON handling: cannot insert prototype pollution keys.
   if(['__proto__','constructor','prototype'].includes(key)){ctx.conflicts.push({area:ctx.area,path:path.concat(key).join('.')});continue;}
   const result=mergeNode(own(base,key)?base[key]:undefined,own(current,key)?current[key]:undefined,own(approved,key)?approved[key]:undefined,ctx,[...path,key],depth+1);
   if(result!==undefined)out[key]=result;
  }
  return out;
 }
 ctx.conflicts.push({area:ctx.area,path:path.join('.')});return clone(current);
}
function valid(p,siteId){return plain(p)&&plain(p.site)&&p.site.id===siteId&&Array.isArray(p.site.pages)&&plain(p.storage)&&p.site.pages.every(x=>plain(x)&&typeof x.id==='string');}
export function composeSafeSiteTestApply01616({baseline,current,approved,siteId,selection,overrides,acknowledgeConflicts=false}){
 const chosen=normalizeSiteTestSelection01615B(selection);
 if(![baseline,current,approved].every(p=>valid(p,siteId)))err('ST_TEST_APPLY_PROJECT_INVALID_01615B');
 const replace=normalizeSiteTestOverrides01616(overrides,chosen);
 if((replace.pages.length||replace.header||replace.footer||replace.styles)&&acknowledgeConflicts!==true)err('ST_TEST_APPLY_OVERRIDE_CONFIRM_REQUIRED_01616',400);
 const delta=compareSiteTestProjects01614B(baseline,approved),changed=new Set(delta.pageChanges.map(p=>p.pageId));
 if(chosen.pages.some(id=>!changed.has(id))||(chosen.header&&!delta.headerChanged)||(chosen.footer&&!delta.footerChanged)||(chosen.styles&&!delta.styleChanged))err('ST_TEST_APPLY_NOT_CHANGED_01615B',400);
 const merged=clone(current),conflicts=[],preserved=[];
 const originalOrder=new Map(merged.site.pages.map((p,i)=>[p.id,i]));
 const targetMap=new Map(approved.site.pages.map(p=>[p.id,p]));
 const baselineMap=baseline.storage.pageSnapshots||{},currentMap=current.storage.pageSnapshots||{},targetSnap=approved.storage.pageSnapshots||{};
 if(!plain(baselineMap)||!plain(currentMap)||!plain(targetSnap))err('ST_TEST_APPLY_PROJECT_INVALID_01615B');
 function select(area,path,base,cur,draft,force){
  if(!same(base,cur))preserved.push(area);
  if(force)return clone(draft);
  const ctx={area,conflicts,visited:0};
  return mergeNode(base,cur,draft,ctx,path);
 }
 for(const id of chosen.pages){
  const area=`page:${id}`;
  const meta=select(area,['site','pages',id],findPage(baseline,id),findPage(current,id),targetMap.get(id),replace.pages.includes(id));
  merged.site.pages=merged.site.pages.filter(p=>p.id!==id);
  if(meta!==undefined){
   const sourceIndex=approved.site.pages.findIndex(p=>p.id===id);
   const preceding=approved.site.pages.slice(0,sourceIndex).map(p=>p.id).reverse().find(pid=>merged.site.pages.some(p=>p.id===pid));
   const position=preceding?merged.site.pages.findIndex(p=>p.id===preceding)+1:Math.min(originalOrder.get(id)??merged.site.pages.length,merged.site.pages.length);
   merged.site.pages.splice(position,0,meta);
  }
  const key=`${siteId}:${id}`;
  const result=select(area,['storage','pageSnapshots',id],own(baselineMap,key)?baselineMap[key]:undefined,own(currentMap,key)?currentMap[key]:undefined,own(targetSnap,key)?targetSnap[key]:undefined,replace.pages.includes(id));
  if(!plain(merged.storage.pageSnapshots))merged.storage.pageSnapshots={};
  if(result===undefined)delete merged.storage.pageSnapshots[key];else merged.storage.pageSnapshots[key]=result;
 }
 for(const [active,area,keys,forced] of [[chosen.header,'header',HDR,replace.header],[chosen.footer,'footer',FTR,replace.footer],[chosen.styles,'styles',CSS,replace.styles]]){
  if(!active)continue;
  for(const key of keys){
   const result=select(area,['storage',key],own(baseline.storage,key)?baseline.storage[key]:undefined,own(current.storage,key)?current.storage[key]:undefined,own(approved.storage,key)?approved.storage[key]:undefined,forced);
   if(result===undefined)delete merged.storage[key];else merged.storage[key]=result;
  }
 }
 // A conflict never produces a write token, not even for partly-safe changes.
 const groups=[...new Set(conflicts.map(c=>c.area))];
 if(groups.length)return {status:'conflict',conflicts:conflicts.slice(0,50),conflictAreas:groups,selection:chosen,overrides:replace,changedPages:delta.changedPages,preservedAreas:[...new Set(preserved)],canApply:false};
 if(same(merged,current))err('ST_TEST_APPLY_EMPTY_01615B',400);
 return {status:'ready',project:merged,selection:chosen,overrides:replace,changes:delta,beforeSha:projectSha01613D(current),afterSha:projectSha01613D(merged),changedPages:delta.changedPages,preservedAreas:[...new Set(preserved)],canApply:true};
}
export function siteTestConflictPlanToken01616({testId,projectRevision,sourceSha,beforeSha,draftSha,selection,overrides,afterSha}){
 return projectSha01613D({stage:'01616',testId,projectRevision,sourceSha,beforeSha,draftSha,selection,overrides,afterSha});
}
