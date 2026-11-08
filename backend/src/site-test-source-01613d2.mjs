// 01613D2 · A delegated test must originate from an identifiable canonical
// server revision, never from arbitrary browser localStorage or a metadata-only shell.
const clean=v=>String(v??'').trim();
export function inspectOriginalProject01613D2(project,siteId=''){
 const site=project?.site;
 const pages=Array.isArray(site?.pages)?site.pages:[];
 const snapshots=project?.storage?.pageSnapshots;
 const prefix=`${clean(siteId||site?.id)}:`;
 const content=snapshots&&typeof snapshots==='object'&&!Array.isArray(snapshots)?Object.entries(snapshots).filter(([key])=>key.startsWith(prefix)):[];
 let authored=0,mainRoots=0;
 for(const [,value] of content){
  const roots=value?.siteFrameMain01040?.rootIds;
  const count=Array.isArray(roots)?roots.length:0;
  const fallback=Boolean(String(value?.rootHTML||value?.pageHTML||value?.previewHtml||'').trim());
  if(count||fallback)authored++;
  mainRoots+=count;
 }
 const valid=Boolean(site&&clean(site.id)&&(!clean(siteId)||clean(site.id)===clean(siteId))&&pages.length>0&&authored>0);
 return {valid,pageCount:pages.length,authoredPageCount:authored,mainRootCount:mainRoots};
}
export function chooseOriginalSource01613D2({siteProject,publishedProject,siteId='',siteSchema='01170',publishedSchema='01170',publishedRevisionId=''}={}){
 const published=inspectOriginalProject01613D2(publishedProject,siteId),cloud=inspectOriginalProject01613D2(siteProject,siteId);
 // 01619E: the *editable* project in Render owns the newest accepted changes.
 // Published is a historical LIVE snapshot only, never silently the seed for
 // a new test. Its ID remains available for immutable ancestry verification.
 if(cloud.valid)return {project:siteProject,schemaVersion:siteSchema,sourceRevisionId:'',sourceKind:'canonical',summary:cloud,cloudSummary:cloud,publishedRevisionId:published.valid?publishedRevisionId:''};
 // Retain an explicit published-only fallback for READ-ONLY legacy comparison;
 // create/reset reject it, rather than producing a stale manager test.
 if(published.valid)return {project:publishedProject,schemaVersion:publishedSchema,sourceRevisionId:publishedRevisionId,sourceKind:'published_fallback',summary:published,cloudSummary:cloud,publishedRevisionId};
 return null;
}
