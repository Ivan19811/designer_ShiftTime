// 01599 · Projection of the signed-in member's *own* active store/site grants.
// UI policy only: legacy resource endpoints require independent enforcement in 01600.
import {mergeAccessGrants01597} from './access-policy-core-01597.mjs';
const clean=v=>String(v??'').trim();
export function projectOwnNavigation01599(rows=[],{accountId='',storeId='',userId=''}={}){
  const valid=(Array.isArray(rows)?rows:[]).filter(r=>r.status==='active'&&r.roleStatus==='active'&&['store','site'].includes(r.scopeKind));
  const storeRows=valid.filter(r=>r.scopeKind==='store');
  const sites=[...new Set(valid.filter(r=>r.scopeKind==='site'&&clean(r.siteId)).map(r=>clean(r.siteId)))].sort();
  const siteGrants=sites.map(siteId=>({siteId,...mergeAccessGrants01597([...storeRows,...valid.filter(r=>r.scopeKind==='site'&&clean(r.siteId)===siteId)],{siteId})}));
  const allPermissions=[...new Set([...
    mergeAccessGrants01597(storeRows).permissions,
    ...siteGrants.flatMap(r=>r.permissions)
  ])].sort();
  return {stage:'01599',accountId:clean(accountId),storeId:clean(storeId),userId:clean(userId),
    storePermissions:mergeAccessGrants01597(storeRows).permissions,siteGrants,allPermissions,
    semantics:'explicit-grants',enforcement:'ui-only-until-01600'};
}
