// A live deploy and the editable project are distinct. Only advance an original
// that is an untouched bootstrap or still exactly equals the prior published copy.
const clean=v=>String(v??'').trim();
const ids=p=>(Array.isArray(p?.site?.pages)?p.site.pages:[]).map(x=>clean(x?.id));
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function eligibleOriginalProject01623U(project,siteId){
 const pages=ids(project), snapshots=project?.storage?.pageSnapshots;
 if(clean(project?.site?.id)!==siteId||!pages.length||pages.some(x=>!x)||new Set(pages).size!==pages.length||!object(snapshots))return false;
 if(!pages.includes('page_home'))return false;
 if(!pages.every(id=>object(snapshots[`${siteId}:${id}`])))return false;
 return pages.some(id=>{const p=snapshots[`${siteId}:${id}`];return p?.siteFrameMain01040?.rootIds?.length>0||!!clean(p?.pageHTML||p?.rootHTML||p?.previewHtml);});
}
export function planOriginalPromotion01623U({siteId,role,confirmed,canonical,revision,previousMatches,nextMatches,reviewed,project}){
 if(role!=='owner'||!confirmed)return {status:'preserved',reason:'unverified-owner-publication'};
 if(!eligibleOriginalProject01623U(project,siteId))return {status:'preserved',reason:'incomplete-project'};
 if(nextMatches)return {status:'already-current'};
 if(reviewed)return {status:'preserved',reason:'manager-review-history'};
 if(previousMatches)return {status:'sync',reason:'previous-publication-matches'};
 const old=ids(canonical), next=new Set(ids(project));
 if(Number(revision)===1&&clean(canonical?.site?.id)===siteId&&old.length<=1&&old.every(id=>next.has(id))&&next.size>old.length)
   return {status:'sync',reason:'bootstrap-original'};
 return {status:'preserved',reason:'independent-original'};
}
