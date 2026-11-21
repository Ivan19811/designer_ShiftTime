// 01605E · Two authenticated merchant read routes omitted from prior classifiers.
// No public checkout, SSO, or unauthenticated access is affected.
// siteList delegates filtering to the authorized site IDs returned by access enforcement.
const decision=(permission,legacy='read',siteList=false)=>Object.freeze({permission,siteId:'',legacy,...(siteList?{siteList:true}:{})});
export function classifyLegacyReadAction01605E(method,parts){
  const m=String(method||'').toUpperCase(),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1'||m!=='GET')return null;
  if(p[2]==='site-revisions'&&p.length===3)return decision('site.pages.view','read',true);
  if(p[2]==='marketplace'&&p[3]==='snapshot'&&p[4]==='export'&&p.length===5)return decision('shop.products.view');
  return null;
}
