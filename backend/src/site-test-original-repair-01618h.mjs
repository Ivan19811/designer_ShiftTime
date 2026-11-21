// 01618H · Explicit owner-only restoration of a stale Main page from an immutable
// published revision. Pure helpers; all writes, locks and backups are in workflow.
import {projectSha01613D} from './site-test-core-01613d.mjs';
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
const clean=v=>String(v??'').trim();
function page(project,siteId,pageId){
 if(clean(project?.site?.id)!==siteId||!Array.isArray(project?.site?.pages)||!project.site.pages.some(p=>p.id===pageId))return null;
 return project.storage?.pageSnapshots?.[`${siteId}:${pageId}`]||null;
}
const nodes=record=>obj(record?.siteFrameMain01040?.nodes)?record.siteFrameMain01040.nodes:{};
const count=record=>Object.keys(nodes(record)).length;
const nodeText=node=>clean(typeof node?.content==='string'?node.content:node?.content?.text||node?.content?.html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
function texts(record){return [...new Set(Object.values(nodes(record)).map(nodeText).filter(v=>v.length>=6))];}
export function inspectSiteTestOriginalDrift01618H({current,published,siteId,pageId='page_home',publishedRevisionId=''}){
 const before=page(current,siteId,pageId),canonical=page(published,siteId,pageId);
 const n=count(before),m=count(canonical),same=Boolean(before&&canonical&&projectSha01613D(before)===projectSha01613D(canonical));
 // Never equate a legitimately edited, full page with a "stale" shell merely
 // because its node IDs or headings differ. Only detect an obvious hollow page.
 const beforeTexts=texts(before),publishedTexts=texts(canonical),publishedSet=new Set(publishedTexts);
 const sharedTexts=beforeTexts.filter(x=>publishedSet.has(x)).length;
 const overlap=sharedTexts/Math.max(1,Math.min(beforeTexts.length,publishedTexts.length));
 const stale=Boolean(before&&canonical&&m>=16&&!same&&
  (n<m/4||(publishedTexts.length>=12&&beforeTexts.length<=2)||
   (n>=12&&beforeTexts.length>=6&&publishedTexts.length>=12&&overlap<0.05)));
 return {pageId,currentNodes:n,publishedNodes:m,publishedRevisionId,stale,
  currentPageSha:before?projectSha01613D(before):'',publishedPageSha:canonical?projectSha01613D(canonical):'',
  same,sharedTexts,contentOverlap:Math.round(overlap*100)};
}
export function composeSiteTestOriginalRepair01618H({current,published,siteId,pageId='page_home',publishedRevisionId=''}){
 const diag=inspectSiteTestOriginalDrift01618H({current,published,siteId,pageId,publishedRevisionId});
 if(!diag.stale)throw Object.assign(new Error('ST_TEST_ORIGINAL_REPAIR_NOT_NEEDED_01618H'),{code:'ST_TEST_ORIGINAL_REPAIR_NOT_NEEDED_01618H'});
 const project=structuredClone(current);project.storage.pageSnapshots[`${siteId}:${pageId}`]=structuredClone(page(published,siteId,pageId));
 const beforeSha=projectSha01613D(current),afterSha=projectSha01613D(project);
 if(beforeSha===afterSha)throw Object.assign(new Error('ST_TEST_ORIGINAL_REPAIR_NOT_NEEDED_01618H'),{code:'ST_TEST_ORIGINAL_REPAIR_NOT_NEEDED_01618H'});
 return {project,diag,beforeSha,afterSha};
}
export function siteTestOriginalRepairToken01618H({siteId,projectRevision,revisionId,beforeSha,afterSha,pageId}){
 return projectSha01613D({stage:'01618H',siteId,projectRevision,revisionId,beforeSha,afterSha,pageId});
}
