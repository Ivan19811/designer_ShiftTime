// ShiftTime 01606E · Site/Canvas snapshot safety boundary.
// This is a *secondary* precise grant check, never a substitute for the
// original 01600 site/page/publish permissions or tenant-scoped checks.
// Canvas element-level permissions remain UI-only until an atomic element API exists.
export const SITE_ACTION_MODE_01606E='api.mode.site_actions';
const action=(name,{uiControl='',also=[]}={})=>Object.freeze({
  permission:`site.design.actions.${name}`,
  uiControl,
  also:Object.freeze([...also])
});
const ACTIONS=Object.freeze({
  create:action('site_create'),
  metadata:action('metadata_edit'),
  project:action('project_replace',{uiControl:'ui.control.pagesave'}),
  remove:action('site_delete'),
  revisionCreate:action('draft_create',{also:['site.design.actions.project_replace']}),
  revisionReplace:action('draft_replace',{also:['site.design.actions.project_replace']}),
  revisionDetails:action('draft_details'),
  revisionDelete:action('draft_delete'),
  // Direct /publish receives a caller-supplied entire package. A publish grant
  // alone cannot authorize uploading arbitrary page designs to a live site.
  publishPackage:action('publish',{uiControl:'ui.control.sitepublish',also:['site.design.actions.project_replace']}),
  publishRevision:action('publish',{uiControl:'ui.control.sitepublish'}),
});
export const SITE_ACTION_CODES_01606E=Object.freeze([
  'site_create','metadata_edit','project_replace','site_delete','draft_create','draft_replace','draft_details','draft_delete','publish'
].map(x=>`site.design.actions.${x}`));
export function classifySiteAction01606E(method,parts){
  const m=String(method||'').toUpperCase(),p=parts;
  if(!Array.isArray(p)||p[0]!=='api'||p[1]!=='v1'||p[2]!=='sites')return null;
  if(p.length===3)return m==='POST'?ACTIONS.create:null;
  if(!p[3])return null;
  if(p.length===4){if(m==='PUT')return ACTIONS.project;if(m==='DELETE')return ACTIONS.remove;return null;}
  if(p.length===5){
    if(p[4]==='metadata'&&m==='PATCH')return ACTIONS.metadata;
    if(p[4]==='publish'&&m==='POST')return ACTIONS.publishPackage;
    if(p[4]==='revisions'&&m==='POST')return ACTIONS.revisionCreate;
    return null;
  }
  if(p[4]!=='revisions'||!p[5])return null;
  if(p.length===6){if(m==='PUT')return ACTIONS.revisionReplace;if(m==='DELETE')return ACTIONS.revisionDelete;return null;}
  if(p.length===7&&p[6]==='details'&&m==='PATCH')return ACTIONS.revisionDetails;
  if(p.length===7&&p[6]==='publish'&&m==='POST')return ACTIONS.publishRevision;
  return null;
}
const denied=permission=>Object.assign(new Error('ST_ACCESS_SITE_ACTION_DENIED_01606E'),{
  code:'ST_ACCESS_SITE_ACTION_DENIED_01606E',statusCode:403,permission
});
export function isPreciseSiteMode01606E(decision){
  return decision?.mode==='custom'&&Array.isArray(decision.permissions)&&
    (decision.permissions.includes(SITE_ACTION_MODE_01606E)||decision.permissions.includes('ui.mode.controls'));
}
export function assertSiteAction01606E(decision,requested){
  if(!requested||decision?.mode!=='custom')return true;
  const grants=new Set(Array.isArray(decision.permissions)?decision.permissions:[]);
  const uiRestricted=grants.has('ui.mode.controls');
  if(!grants.has(SITE_ACTION_MODE_01606E)&&!uiRestricted)return true;
  for(const permission of [requested.permission,...(requested.also||[])]){
    if(!grants.has(permission))throw denied(permission);
  }
  if(uiRestricted&&requested.uiControl&&!grants.has(requested.uiControl))throw denied(requested.uiControl);
  return true;
}
