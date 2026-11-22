// 01619Q · Fail-closed scope proof for owner-approved test changes.
// Pure JSON checks: no DB mutation, no Netlify, no browser-side authority.
import {projectSha01613D,siteTestError01613D} from './site-test-core-01613d.mjs';
const copy=x=>structuredClone(x);
const equal=(a,b)=>projectSha01613D(a)===projectSha01613D(b);
const fail=()=>{throw siteTestError01613D('ST_TEST_UNEXPECTED_PAGE_MUTATION_01619Q',409);};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function valid(before,after,siteId){
 if(!plain(before)||!plain(after)||before.site?.id!==siteId||after.site?.id!==siteId||
  !plain(before.storage)||!plain(after.storage)||!Array.isArray(before.site.pages)||!Array.isArray(after.site.pages)||
  !plain(before.storage.pageSnapshots)||!plain(after.storage.pageSnapshots))fail();
}
// Item-level approvals permit ONLY the explicitly selected page's canonical
// Main. Neither its utility-page metadata nor any other page can change.
export function assertSelectedMainScope01619Q({before,after,siteId,applied=[]}){
 valid(before,after,siteId);
 if(!Array.isArray(applied)||!applied.length)fail();
 const expected=copy(before),ids=new Set();
 for(const item of applied){
  if(!item||typeof item.pageId!=='string'||typeof item.nodeId!=='string'||typeof item.field!=='string'||
   !['content','style','styles','layout','attributes','props','classes'].includes(item.field))fail();
  const pageId=item.pageId,key=`${siteId}:${pageId}`;
  if(!before.site.pages.some(p=>p.id===pageId)||!after.site.pages.some(p=>p.id===pageId))fail();
  const old=expected.storage.pageSnapshots[key]?.siteFrameMain01040,
   fresh=after.storage.pageSnapshots[key]?.siteFrameMain01040;
  if(!plain(old?.nodes)||!plain(fresh?.nodes)||!plain(old.nodes[item.nodeId])||!plain(fresh.nodes[item.nodeId]))fail();
  const dest=old.nodes[item.nodeId],now=fresh.nodes[item.nodeId];
  if(Object.hasOwn(now,item.field))dest[item.field]=copy(now[item.field]);
  else delete dest[item.field];
  // Only the provenance marker added by the canonical matcher is permitted
  // outside the explicitly approved node field.
  if(Object.hasOwn(now.meta||{},'siteTestLineage01618E')){
   if(!plain(dest.meta))dest.meta={};
   dest.meta.siteTestLineage01618E=copy(now.meta.siteTestLineage01618E);
  }
  ids.add(pageId);
 }
 if(!equal(expected,after))fail();
 return {ok:true,scopedPageCount:ids.size};
}
// Whole-page reconciliation may change selected pages, but not the metadata
// of another system page, order data, other site settings, or other storage.
const HEADER=['headerState','headerPageModes','headerGlobalMode','headerHidden','headerTemplateIds'];
const FOOTER=['footerState','footerPageModes','footerGlobalMode','footerHidden','footerTemplateIds'];
export function assertSelectiveApplyScope01619Q({before,after,siteId,selection}){
 valid(before,after,siteId);
 const pages=selection?.pages;
 if(!Array.isArray(pages)||pages.some(p=>typeof p!=='string'))fail();
 const allowed=new Set(pages),from=new Map(before.site.pages.map(p=>[p.id,p])),to=new Map(after.site.pages.map(p=>[p.id,p]));
 if(from.size!==before.site.pages.length||to.size!==after.site.pages.length)fail();
 for(const id of new Set([...from.keys(),...to.keys()])){
  if(!allowed.has(id)&&!equal(from.get(id),to.get(id)))fail();
 }
 const oldSnapshots=before.storage.pageSnapshots,newSnapshots=after.storage.pageSnapshots;
 for(const key of new Set([...Object.keys(oldSnapshots),...Object.keys(newSnapshots)])){
  const prefix=`${siteId}:`;
  if(!key.startsWith(prefix)||!allowed.has(key.slice(prefix.length))){
   if(!equal(oldSnapshots[key],newSnapshots[key]))fail();
  }
 }
 const siteBefore=copy(before.site),siteAfter=copy(after.site);
 siteBefore.pages=[];siteAfter.pages=[];
 if(!equal(siteBefore,siteAfter))fail();
 const skip=new Set(['pageSnapshots',...(selection.header?HEADER:[]),...(selection.footer?FOOTER:[]),...(selection.styles?['globalStyleStore']:[])]);
 for(const prop of new Set([...Object.keys(before.storage),...Object.keys(after.storage)])){
  if(!skip.has(prop)&&!equal(before.storage[prop],after.storage[prop]))fail();
 }
 return {ok:true,scopedPageCount:allowed.size};
}
// Repair is intentionally limited to a single page snapshot.
export function assertRepairPageScope01619Q({before,after,siteId,pageId='page_home'}){
 valid(before,after,siteId);
 const expected=copy(before),key=`${siteId}:${pageId}`;
 if(!Object.hasOwn(after.storage.pageSnapshots,key)||!before.site.pages.some(p=>p.id===pageId))fail();
 expected.storage.pageSnapshots[key]=copy(after.storage.pageSnapshots[key]);
 if(!equal(expected,after))fail();
 return {ok:true,pageId};
}
