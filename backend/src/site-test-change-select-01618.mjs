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
// 01618F: editor/selection classes are transient decorations, not DOM roles.
const semanticClass01618F=value=>clean(value).split(/\s+/).filter(Boolean)
 .filter(c=>!(/^sf-main-selection-|^is-selected$|^st-selected$|^is-dragging$|^st-drop-marker$/.test(c)))
 .sort().join(' ');
const shape01618E=n=>!obj(n)?null:{kind:clean(n.kind),componentType:clean(n.componentType),tag:clean(n.meta?.dom?.tag),className:semanticClass01618F(n.meta?.dom?.className)};
const shapeSame01618E=(a,b)=>same(shape01618E(a),shape01618E(b));
const blocked01618F=(reason,code='ST_TEST_CHANGE_REMAP_UNSAFE_01618E')=>{
 const e=siteTestError01613D(code,409);e.matchReason01618F=reason;throw e;
};
// Compare authored markup without brittle runtime data-* and node ids; never
// ignore authored classes, styles, URLs, events or media attributes.
function markupSignature01618F(html){
 if(typeof html!=='string')return '';
 const tags=html.match(/<\/?[a-z][^>]*>/gi)||[];
 return tags.map(tag=>tag.replace(/\sdata-[\w:-]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi,'')
  .replace(/\s(?:contenteditable|draggable|spellcheck|data-sf-id|id)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi,'')
  .replace(/\s+/g,' ').trim()).join('|');
}
function contentAnchorSame01618F(base,candidate){
 const a=base?.content,b=candidate?.content;
 if(typeof a==='string')return a.length>=4&&a===b;
 if(!obj(a)||!obj(b))return false;
 const text=clean(a.text);
 if(text.length>=4&&a.text===b.text){
  return markupSignature01618F(a.html)===markupSignature01618F(b.html);
 }
 const html=clean(a.html);
 return html.length>=12&&html===clean(b.html);
}
function parentIndex01618F(main){
 const idx=new Map();
 if(!main)return idx;
 for(const [id,node] of Object.entries(main.nodes)){
  if(!obj(node))continue;
  for(const child of Array.isArray(node.children)?node.children:[]){
   if(!safeId(child)||idx.has(child))return null;
   idx.set(child,id);
  }
 }
 return idx;
}
function lineageCandidate01618F({sourceMain,currentMain,baseNode,nodeId,marker,anchorKey}){
 const sourceNodes=Object.values(sourceMain.nodes).filter(obj);
 if(sourceNodes.length>4000||Object.keys(currentMain.nodes).length>4000)blocked01618F('limit');
 const marked=Object.entries(currentMain.nodes).filter(([,node])=>obj(node)&&(hasLineage01618E(node,marker)||hasLineage01618E(node,anchorKey)));
 if(marked.length>1)blocked01618F('ambiguous');
 if(marked.length===1){
  const [id,node]=marked[0];
  if(!shapeSame01618E(baseNode,node))blocked01618F('role-changed');
  return {node,nodeId:id,method:'preserved-lineage',lineageKeys:[marker,anchorKey]};
 }
 // A unique, unmodified source anchor may survive cosmetic DOM changes,
 // insertion/deletion of unrelated siblings, and regeneration of node IDs.
 const stable=clean(baseNode.content?.text)||((typeof baseNode.content==='string')?clean(baseNode.content):'');
 if(stable.length<4&&!clean(baseNode.content?.html))blocked01618F('no-anchor');
 const sourceMatches=sourceNodes.filter(n=>shapeSame01618E(baseNode,n)&&contentAnchorSame01618F(baseNode,n));
 if(sourceMatches.length!==1)blocked01618F('ambiguous-source');
 const matches=Object.entries(currentMain.nodes).filter(([,node])=>obj(node)&&shapeSame01618E(baseNode,node)&&contentAnchorSame01618F(baseNode,node));
 if(!matches.length)blocked01618F('no-current-anchor');
 if(matches.length!==1)blocked01618F('ambiguous-target');
 const [id,node]=matches[0];
 const sourceTree=rootedPaths01618E(sourceMain),targetTree=rootedPaths01618E(currentMain);
 if(!sourceTree||!targetTree||!sourceTree.paths.has(nodeId)||!targetTree.paths.has(id))blocked01618F('tree-invalid');
 const a=parentIndex01618F(sourceMain),b=parentIndex01618F(currentMain);
 if(!a||!b)blocked01618F('tree-invalid');
 const baseParentId=a.get(nodeId),currentParentId=b.get(id);
 if(Boolean(baseParentId)!==Boolean(currentParentId))blocked01618F('parent-changed');
 if(baseParentId){
  const before=sourceMain.nodes[baseParentId],now=currentMain.nodes[currentParentId];
  if(!shapeSame01618E(before,now))blocked01618F('parent-changed');
  // With an otherwise generic parent, require additional evidence from a
  // stable ancestor or uniquely identifying parent content / DOM class.
  const parentRole=shape01618E(before);
  const meaningful=clean(parentRole?.className)||clean(before?.componentType);
  if(!meaningful)blocked01618F('parent-unverified');
 }
 return {node,nodeId:id,method:'anchored-lineage',lineageKeys:[marker,anchorKey]};
}
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
// Cross-branch provenance: two submitted managers may have different revision
// hashes even though they started from the same uniquely identified content.
function lineageAnchorKey01618F(sourceMain,baseNode,siteId,pageId){
 if(!sourceMain||!obj(baseNode)||!clean(baseNode.content?.text)&&typeof baseNode.content!=='string')return '';
 const title=clean(typeof baseNode.content==='string'?baseNode.content:baseNode.content?.text);
 if(title.length<4)return '';
 const count=Object.values(sourceMain.nodes).filter(n=>obj(n)&&shapeSame01618E(n,baseNode)&&contentAnchorSame01618F(baseNode,n)).length;
 if(count!==1)return '';
 return projectSha01613D({stage:'01618F',siteId,pageId,sourceRole:shape01618E(baseNode),sourceText:title,sourceMarkup:markupSignature01618F(baseNode.content?.html)});
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
 if(!obj(submittedNode))blocked01618F('source-missing','ST_TEST_CHANGE_NODE_MISSING_01618');
 const baseNode=nodeMap(baseline,siteId,pageId)?.[nodeId];
 if(baseNode&&!shapeSame01618E(baseNode,submittedNode))blocked01618F('source-role-changed');
 const currentMain=main01618E(current,siteId,pageId);
 const existing=currentMain?.nodes?.[nodeId];
 if(obj(existing)){
  if(!shapeSame01618E(existing,submittedNode))blocked01618F('role-changed');
  const srcMain=main01618E(baseline,siteId,pageId);
  const marker=srcMain?lineageKey01618E(baseline,siteId,pageId,nodeId):'';
  const anchor=srcMain?lineageAnchorKey01618F(srcMain,baseNode,siteId,pageId):'';
  return {node:existing,nodeId,method:'exact',lineageKeys:[marker,anchor]};
 }
 const sourceMain=main01618E(baseline,siteId,pageId);
 if(!currentMain)blocked01618F('original-main-missing','ST_TEST_CHANGE_NODE_MISSING_01618');
 if(!sourceMain||!obj(baseNode))blocked01618F('source-baseline-missing','ST_TEST_CHANGE_NODE_MISSING_01618');
 const marker=lineageKey01618E(baseline,siteId,pageId,nodeId);
 const anchorKey=lineageAnchorKey01618F(sourceMain,baseNode,siteId,pageId);
 // Fast path: exact structural path AND unique, unchanged original content.
 const a=rootedPaths01618E(sourceMain),b=rootedPaths01618E(currentMain);
 if(a&&b&&a.paths.size===b.paths.size&&sourceMain.rootIds.length===currentMain.rootIds.length){
  const path=a.paths.get(nodeId),matchedId=b.byPath.get(path);
  if(matchedId){
   let sameSkeleton=true;
   for(const [sourceId,sourcePath] of a.paths){
    const destId=b.byPath.get(sourcePath);
    if(!destId||!shapeSame01618E(sourceMain.nodes[sourceId],currentMain.nodes[destId])){
     sameSkeleton=false;break;
    }
   }
   if(sameSkeleton){
    const candidate=currentMain.nodes[matchedId],lineage=hasLineage01618E(candidate,marker)||hasLineage01618E(candidate,anchorKey);
    if(lineage){
     const n=Object.values(currentMain.nodes).filter(n=>hasLineage01618E(n,marker)||hasLineage01618E(n,anchorKey)).length;
     if(n===1)return {node:candidate,nodeId:matchedId,method:'preserved-lineage',lineageKeys:[marker,anchorKey]};
     blocked01618F('ambiguous');
    }
    if(contentAnchorSame01618F(baseNode,candidate)){
     const sourceUnique=Object.values(sourceMain.nodes).filter(n=>obj(n)&&shapeSame01618E(n,baseNode)&&contentAnchorSame01618F(baseNode,n)).length===1;
     const targetUnique=Object.values(currentMain.nodes).filter(n=>obj(n)&&shapeSame01618E(n,baseNode)&&contentAnchorSame01618F(baseNode,n)).length===1;
     if(sourceUnique&&targetUnique)return {node:candidate,nodeId:matchedId,method:'verified-lineage',lineageKeys:[marker,anchorKey]};
    }
   }
  }
 }
 return lineageCandidate01618F({sourceMain,currentMain,baseNode,nodeId,marker,anchorKey});
}

// 01618G · The owner may explicitly map an old revision to one live Render node.
// This is not fuzzy/automatic matching: every proposed target comes from the
// *current* server project, and the choice is checked again inside the write
// transaction against a SHA of the complete original node.
function manualRole01618G(node){return !obj(node)?null:{kind:clean(node.kind),componentType:clean(node.componentType),tag:clean(node.meta?.dom?.tag)};}
function manualSource01618G({baseline,current,submitted,siteId,change}){
 const {pageId,nodeId}=change;
 const source=main01618E(baseline,siteId,pageId),original=main01618E(current,siteId,pageId);
 const base=source?.nodes?.[nodeId],proposal=nodeMap(submitted,siteId,pageId)?.[nodeId];
 if(!source||!original||!obj(base)||!obj(proposal)||!shapeSame01618E(base,proposal))return null;
 if(Object.keys(source.nodes).length>4000||Object.keys(original.nodes).length>4000)return null;
 const srcParents=parentIndex01618F(source),curParents=parentIndex01618F(original);
 const srcTree=rootedPaths01618E(source),curTree=rootedPaths01618E(original);
 if(!srcParents||!curParents||!srcTree||!curTree||!srcTree.paths.has(nodeId))return null;
 return {source,original,base,srcParents,curParents,curTree};
}
function validManualTarget01618G(ctx,sourceNodeId,targetNodeId){
 const {source,original,base,srcParents,curParents,curTree}=ctx;
 if(!safeId(targetNodeId)||!obj(original.nodes[targetNodeId])||!curTree.paths.has(targetNodeId))return false;
 const candidate=original.nodes[targetNodeId];
 if(!same(manualRole01618G(base),manualRole01618G(candidate)))return false;
 if(!clean(base.kind)&&!clean(base.componentType)&&!clean(base.meta?.dom?.tag))return false;
 const fromParent=srcParents.get(sourceNodeId),toParent=curParents.get(targetNodeId);
 if(Boolean(fromParent)!==Boolean(toParent))return false;
 if(fromParent&&!same(manualRole01618G(source.nodes[fromParent]),manualRole01618G(original.nodes[toParent])))return false;
 return true;
}
export function listManualSiteTestTargets01618G({baseline,current,submitted,siteId,change}){
 const ctx=manualSource01618G({baseline,current,submitted,siteId,change});
 if(!ctx)return [];
 const output=[];
 const {original,curParents}=ctx;
 for(const [targetNodeId,node] of Object.entries(original.nodes)){
  if(!validManualTarget01618G(ctx,change.nodeId,targetNodeId))continue;
  const label=clean(typeof node.content==='string'?node.content:node.content?.text||node.content?.html||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,110);
  const parentId=curParents.get(targetNodeId);
  output.push({nodeId:targetNodeId,expectedTargetHash:projectSha01613D(node),
   currentText:label||'—',currentValue:sample(node[change.field]),parentClass:semanticClass01618F(original.nodes[parentId]?.meta?.dom?.className).slice(0,110),
   className:semanticClass01618F(node.meta?.dom?.className).slice(0,110),role:clean(node.componentType||node.kind).slice(0,60)});
  if(output.length>120)return []; // too many indistinguishable candidates: no unsafe enormous list
 }
 // Prefer intact authored semantic classes; allow broader structural choices only
 // when every candidate has a changed class (then the owner must decide).
 const sourceClass=semanticClass01618F(ctx.base.meta?.dom?.className);
 const sameClass=sourceClass?output.filter(row=>row.className===sourceClass):[];
 return sameClass.length?sameClass:output;
}
function ownerMatch01618G({baseline,initial,current,submitted,siteId,change,selection}){
 // A manually supplied id is valid only for a genuinely blocked automatic match.
 try{
  resolveSiteTestChangeTarget01618E({baseline,current:initial,submitted,siteId,change});
  fail('ST_TEST_MANUAL_TARGET_NOT_NEEDED_01618G',409);
 }catch(err){if(err?.code==='ST_TEST_MANUAL_TARGET_NOT_NEEDED_01618G')throw err;}
 const candidates=listManualSiteTestTargets01618G({baseline,current:initial,submitted,siteId,change});
 const chosen=candidates.find(row=>row.nodeId===selection.targetNodeId);
 if(!chosen||chosen.expectedTargetHash!==selection.expectedTargetHash)fail('ST_TEST_MANUAL_TARGET_STALE_01618G',409);
 const node=main01618E(current,siteId,change.pageId)?.nodes?.[chosen.nodeId];
 if(!obj(node))fail('ST_TEST_MANUAL_TARGET_STALE_01618G',409);
 const source=main01618E(baseline,siteId,change.pageId),base=source?.nodes?.[change.nodeId];
 const marker=source?lineageKey01618E(baseline,siteId,change.pageId,change.nodeId):'';
 const anchor=source&&base?lineageAnchorKey01618F(source,base,siteId,change.pageId):'';
 return {node,nodeId:chosen.nodeId,method:'owner-confirmed-01618G',lineageKeys:[marker,anchor]};
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
  const hasTarget=x.targetNodeId!==undefined||x.expectedTargetHash!==undefined;
  if(hasTarget&&!(x.decision==='accept'&&safeId(x.targetNodeId)&&typeof x.expectedTargetHash==='string'&&/^[a-f0-9]{64}$/.test(x.expectedTargetHash)))fail('ST_TEST_MANUAL_TARGET_INVALID_01618G',400);
  return {testId:x.testId,changeId:x.changeId,decision:x.decision,index,
   ...(hasTarget?{targetNodeId:x.targetNodeId,expectedTargetHash:x.expectedTargetHash}:{})};
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
  const baseline=baselinesByTest.get(selection.testId);
  const match=selection.targetNodeId?ownerMatch01618G({baseline,initial:current,current:out,submitted,siteId,change:info,selection}):
   resolveSiteTestChangeTarget01618E({baseline,current:out,submitted,siteId,change:info});
  const originalNode=match.node,submittedNode=nodeMap(submitted,siteId,info.pageId)?.[info.nodeId];
  const key=`${info.pageId}\u241f${match.nodeId}\u241f${info.field}`;
  if(touched.has(key))overwrites.push({pageId:info.pageId,nodeId:info.nodeId,field:info.field,previousTestId:touched.get(key),nextTestId:selection.testId});
  touched.set(key,selection.testId);
  if(Object.hasOwn(submittedNode,info.field))originalNode[info.field]=clone(submittedNode[info.field]);
  else delete originalNode[info.field];
  for(const proof of match.lineageKeys||[])addLineage01618E(originalNode,proof);
  applied.push({testId:selection.testId,changeId:selection.changeId,pageId:info.pageId,nodeId:match.nodeId,sourceNodeId:info.nodeId,matchMethod:match.method,field:info.field});
 }
 if(!applied.length)fail('ST_TEST_CHANGE_NO_ACCEPTED_01618');
 if(same(out,current))fail('ST_TEST_CHANGE_NO_DIFFERENCE_01618',409);
 return {project:out,applied,rejected,overwrites,beforeSha:projectSha01613D(current),afterSha:projectSha01613D(out)};
}
export function siteTestSelectionPlanToken01618({siteId,revision,beforeSha,afterSha,decisions,sourceShas}){
 return projectSha01613D({stage:'01618',siteId,revision,beforeSha,afterSha,decisions,sourceShas});
}
