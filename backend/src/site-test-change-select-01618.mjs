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
// 01618E · Fail-closed block lineage repair. A submitted manager node is
// still addressed by its immutable source id. A missing id in the current
// original may be rebound ONLY when the complete rooted skeleton matches,
// and the untouched source content uniquely identifies the target at the
// same structural path. Never guess from a title or DOM position alone.
const shape01618E=n=>!obj(n)?null:{kind:clean(n.kind),componentType:clean(n.componentType),tag:clean(n.meta?.dom?.tag),className:clean(n.meta?.dom?.className),childCount:Array.isArray(n.children)?n.children.length:0};
const shapeSame01618E=(a,b)=>same(shape01618E(a),shape01618E(b));
function main01618E(project,siteId,pageId){
 const value=project?.storage?.pageSnapshots?.[`${siteId}:${pageId}`]?.siteFrameMain01040;
 return obj(value)&&obj(value.nodes)&&Array.isArray(value.rootIds)?value:null;
}
function rootedPaths01618E(main){
 if(!main||Object.keys(main.nodes).length>4000)return null;
 const paths=new Map(),byPath=new Map(),visiting=new Set();
 const walk=(id,path)=>{
  if(!safeId(id)||!obj(main.nodes[id])||paths.has(id)||visiting.has(id))return false;
  visiting.add(id);paths.set(id,path);byPath.set(path,id);
  const children=main.nodes[id].children;
  if(children!==undefined&&!Array.isArray(children))return false;
  for(let i=0;i<(children||[]).length;i++)if(!walk(children[i],path+'/'+i))return false;
  visiting.delete(id);return true;
 };
 for(let i=0;i<main.rootIds.length;i++)if(!walk(main.rootIds[i],String(i)))return null;
 return {paths,byPath};
}
// A successful remap records a provenance-only marker within the original node's
// authored meta. It survives canonical Main serialization and allows a second
// owner-approved manager to replace the same field intentionally even if the
// current text is no longer the immutable baseline text. No marker is ever read
// from the submitted manager project as authority.
function lineageKey01618E(baseline,siteId,pageId,nodeId){
 const source=main01618E(baseline,siteId,pageId);
 return source?projectSha01613D({stage:'01618E',siteId,pageId,nodeId,sourceSha:projectSha01613D(source)}):'';
}
function hasLineage01618E(node,key){
 return Boolean(key&&Array.isArray(node?.meta?.siteTestLineage01618E)&&node.meta.siteTestLineage01618E.includes(key));
}
function addLineage01618E(node,key){
 if(!key||!obj(node))return;
 if(!obj(node.meta))node.meta={};
 const previous=Array.isArray(node.meta.siteTestLineage01618E)?node.meta.siteTestLineage01618E.filter(x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x)):[];
 node.meta.siteTestLineage01618E=[...new Set([...previous,key])].slice(-24);
}
function fingerprint01618E(node){
 return stableJson01613D({kind:node.kind,componentType:node.componentType,
  tag:clean(node.meta?.dom?.tag),className:clean(node.meta?.dom?.className),content:node.content??null});
}
function uniqueFingerprint01618E(nodes,node){
 const key=fingerprint01618E(node);
 return Object.values(nodes).filter(n=>obj(n)&&fingerprint01618E(n)===key).length===1;
}
// Exported for diagnostics/tests; never exposes full stored page data in errors.
export function resolveSiteTestChangeTarget01618E({baseline,current,submitted,siteId,change}){
 const {pageId,nodeId}=change;
 const submittedNode=nodeMap(submitted,siteId,pageId)?.[nodeId];
 if(!obj(submittedNode))fail('ST_TEST_CHANGE_NODE_MISSING_01618',409);
 const baseNode=nodeMap(baseline,siteId,pageId)?.[nodeId];
 // The source and proposal must refer to the same structural kind.
 if(baseNode&&!shapeSame01618E(baseNode,submittedNode))fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 const currentMain=main01618E(current,siteId,pageId);
 const existing=currentMain?.nodes?.[nodeId];
 if(obj(existing)){
  if(!shapeSame01618E(existing,submittedNode))fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
  return {node:existing,nodeId,method:'exact'};
 }
 const sourceMain=main01618E(baseline,siteId,pageId);
 if(!currentMain||!sourceMain||!obj(baseNode))fail('ST_TEST_CHANGE_NODE_MISSING_01618',409);
 const a=rootedPaths01618E(sourceMain),b=rootedPaths01618E(currentMain);
 if(!a||!b||a.paths.size!==b.paths.size||sourceMain.rootIds.length!==currentMain.rootIds.length)
  fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 const path=a.paths.get(nodeId);
 if(path===undefined)fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 // Every rooted element must preserve its structural position and role.
 for(const [sourceId,sourcePath] of a.paths){
  const destId=b.byPath.get(sourcePath);
  if(!destId||!shapeSame01618E(sourceMain.nodes[sourceId],currentMain.nodes[destId]))
   fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 }
 const matchedId=b.byPath.get(path),candidate=currentMain.nodes[matchedId];
 if(!obj(candidate))fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 const marker=lineageKey01618E(baseline,siteId,pageId,nodeId);
 const lineage=hasLineage01618E(candidate,marker);
 const reliable=clean(baseNode.meta?.dom?.className)||clean(baseNode.content?.text)||clean(baseNode.content?.html);
 if(!reliable||!uniqueFingerprint01618E(sourceMain.nodes,baseNode))fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 if(lineage){
  if(Object.values(currentMain.nodes).filter(n=>hasLineage01618E(n,marker)).length!==1)
   fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 }else if(!same(baseNode.content,candidate.content)||!uniqueFingerprint01618E(currentMain.nodes,candidate))
  fail('ST_TEST_CHANGE_REMAP_UNSAFE_01618E',409);
 return {node:candidate,nodeId:matchedId,method:lineage?'preserved-lineage':'verified-lineage',lineageKey:marker};
}
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
export function composeSelectedSiteTestChanges01618({current,siteId,decisions,changesByTest,projectsByTest,baselinesByTest=new Map()}){
 if(!obj(current)||clean(current.site?.id)!==siteId)fail('ST_TEST_CHANGE_PROJECT_INVALID_01618');
 const selected=validateSiteTestChangeDecisions01618(decisions),out=clone(current),applied=[],rejected=[],overwrites=[];
 const touched=new Map();
 for(const selection of selected){
  const info=(changesByTest.get(selection.testId)||[]).find(x=>x.id===selection.changeId);
  if(!info)fail('ST_TEST_CHANGE_SELECTION_STALE_01618',409);
  if(selection.decision==='reject'){rejected.push({testId:selection.testId,changeId:selection.changeId});continue;}
  const submitted=projectsByTest.get(selection.testId);
  const match=resolveSiteTestChangeTarget01618E({baseline:baselinesByTest.get(selection.testId),current:out,submitted,siteId,change:info});
  const originalNode=match.node,submittedNode=nodeMap(submitted,siteId,info.pageId)?.[info.nodeId];
  const key=`${info.pageId}\u241f${match.nodeId}\u241f${info.field}`;
  if(touched.has(key))overwrites.push({pageId:info.pageId,nodeId:info.nodeId,field:info.field,previousTestId:touched.get(key),nextTestId:selection.testId});
  touched.set(key,selection.testId);
  if(Object.hasOwn(submittedNode,info.field))originalNode[info.field]=clone(submittedNode[info.field]);
  else delete originalNode[info.field];
  if(match.method!=='exact')addLineage01618E(originalNode,match.lineageKey);
  applied.push({testId:selection.testId,changeId:selection.changeId,pageId:info.pageId,nodeId:match.nodeId,sourceNodeId:info.nodeId,matchMethod:match.method,field:info.field});
 }
 if(!applied.length)fail('ST_TEST_CHANGE_NO_ACCEPTED_01618');
 if(same(out,current))fail('ST_TEST_CHANGE_NO_DIFFERENCE_01618',409);
 return {project:out,applied,rejected,overwrites,beforeSha:projectSha01613D(current),afterSha:projectSha01613D(out)};
}
export function siteTestSelectionPlanToken01618({siteId,revision,beforeSha,afterSha,decisions,sourceShas}){
 return projectSha01613D({stage:'01618',siteId,revision,beforeSha,afterSha,decisions,sourceShas});
}
