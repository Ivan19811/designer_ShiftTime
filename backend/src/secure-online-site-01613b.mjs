// ShiftTime 01613B · Fail-closed site-API boundary for multi-user online Builder.
// This operates AFTER 01600 tenant-scoped DB authorization and BEFORE any request body
// is parsed. Client visibility/headers never grant rights. A tenant owner is unaffected.
import {classifySiteAction01606E,assertSiteAction01606E} from './access-site-actions-core-01606e.mjs';
const isMutation=verb=>['POST','PUT','PATCH','DELETE'].includes(verb);
const deny=(code,permission='site.pages.view')=>Object.assign(new Error(code),{code,statusCode:403,permission});
export const isOnlineSiteRoute01613B=(parts)=>Array.isArray(parts)&&parts[0]==='api'&&parts[1]==='v1'&&
  (parts[2]==='sites'||parts[2]==='site-revisions');
export function assertOnlineSiteAccess01613B(scope,decision,method,parts){
  if(!isOnlineSiteRoute01613B(parts))return true;
  const verb=String(method||'').toUpperCase();
  // No unknown site action may reach a handler on a permissions fallback.
  if(!decision?.allowed)throw deny('ST_ONLINE_SITE_UNCLASSIFIED_01613B');
  if(scope?.role==='owner')return true;
  if(decision.mode!=='custom')throw deny('ST_ONLINE_SITE_EXPLICIT_GRANT_REQUIRED_01613B',decision.permission);
  const permissions=new Set(Array.isArray(decision.permissions)?decision.permissions:[]);
  if(parts[2]==='site-revisions'){
    if(verb!=='GET')throw deny('ST_ONLINE_SITE_READ_ONLY_01613B');
    // 01600 returned site IDs for custom-scoped list queries. The route filters by them.
    if(!('allowedSiteIds' in decision))throw deny('ST_ONLINE_SITE_LIST_UNSCOPED_01613B');
    return true;
  }
  if(!isMutation(verb)){
    if(verb!=='GET')throw deny('ST_ONLINE_SITE_METHOD_DENIED_01613B');
    if(parts.length===3&&(!('allowedSiteIds' in decision)))throw deny('ST_ONLINE_SITE_LIST_UNSCOPED_01613B');
    return true;
  }
  // The shared account owner's direct Netlify credentials and destructive actions
  // cannot be delegated by a generic editor role. Personal-site owners operate
  // with role=owner in their own tenant/workspace, not a borrowed store.
  const action=classifySiteAction01606E(verb,parts);
  if(parts[4]==='test'){
    // 01615A: owner-only review decisions; never delegate via a site-edit grant.
    if(parts.length===7&&['review','apply-plan','apply','rollback'].includes(parts[6]))throw deny('ST_TEST_OWNER_REQUIRED_01613D','site.publish.execute');
    const allowed=verb==='POST'&&(
      parts.length===5 || (parts.length===7&&['preview','submit','reset'].includes(parts[6])));
    if(!allowed)throw deny('ST_TEST_ACTION_DENIED_01613D','site.publish.execute');
    if(!permissions.has('site.pages.edit'))throw deny('ST_TEST_EDIT_REQUIRED_01613D','site.pages.edit');
    return true;
  }
  if(parts.length===3||verb==='DELETE'&&parts.length===4||
     parts[4]==='publish'&&verb==='POST'||
     parts[4]==='revisions'&&parts[6]==='publish'&&verb==='POST'){
    throw deny('ST_ONLINE_SITE_OWNER_APPROVAL_REQUIRED_01613B',action?.permission||'site.publish.execute');
  }
  // Unlike the older opt-in controls, browser-authorized site edits require
  // explicit precise permissions by default. No legacy or UI-only fallback.
  if(!permissions.has('api.mode.site_actions'))
    throw deny('ST_ONLINE_SITE_PRECISE_MODE_REQUIRED_01613B','api.mode.site_actions');
  if(action){
    assertSiteAction01606E(decision,action);
    return true;
  }
  // Atomic Canvas endpoints have additional operation-type checks in 01606F/G;
  // they are the only mutating site endpoints not classified by 01606E.
  const canvas=verb==='POST'&&parts.length===5&&parts[4]==='canvas';
  const draftCanvas=verb==='POST'&&parts.length===7&&parts[4]==='revisions'&&parts[6]==='canvas';
  // 01614A: per-author branch + fingerprint + shell-key checks are server-enforced.
  const testShell=verb==='POST'&&parts.length===7&&parts[4]==='revisions'&&parts[6]==='test-shell'&&permissions.has('site.pages.edit');
  if(!canvas&&!draftCanvas&&!testShell)throw deny('ST_ONLINE_SITE_ACTION_UNCLASSIFIED_01613B');
  return true;
}
