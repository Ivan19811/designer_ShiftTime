// ShiftTime 01597 · Stable, service-agnostic permission vocabulary.
// `labelKey` is an i18n key; no end-user strings are hardcoded in this API.
const define=(group,action,kind='action')=>Object.freeze({code:`${group}.${action}`,group,action,kind,labelKey:`access.permissions.${group.replaceAll('.','_')}.${action}`});
export const ACCESS_PERMISSIONS_01597=Object.freeze([
  define('site.pages','view'),define('site.pages','create'),define('site.pages','edit'),define('site.pages','delete'),
  define('site.design','view'),define('site.design','edit'),
  define('site.publish','view'),define('site.publish','execute'),define('site.publish','delete'),
  define('shop.products','view'),define('shop.products','create'),define('shop.products','edit'),define('shop.products','delete'),define('shop.products','import'),define('shop.products','prices'),
  define('shop.orders','view'),define('shop.orders','edit'),define('shop.orders','status'),define('shop.orders','cancel'),define('shop.orders','refund'),
  define('builder.tables','view'),define('builder.tables','edit'),define('builder.tables','delete'),
  define('builder.smartblocks','view'),define('builder.smartblocks','edit'),
  define('builder.media','view'),define('builder.media','upload'),define('builder.media','delete'),
  define('builder.seo','view'),define('builder.seo','edit'),
  define('builder.ai','view'),define('builder.ai','configure'),
  define('crm.contacts','view'),define('crm.contacts','edit'),define('crm.contacts','export'),
  define('crm.orders','view'),define('crm.orders','edit'),
  define('team.members','view'),define('team.members','invite'),define('team.members','manage'),
  define('team.roles','view'),define('team.roles','manage'),
]);
export const ACCESS_SCOPE_KINDS_01597=Object.freeze(['store','site']);
const known=new Set(ACCESS_PERMISSIONS_01597.map(p=>p.code));
const clean=v=>String(v??'').trim();
const err=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
export function normalizeAccessPermissions01597(value){
  if(!Array.isArray(value)||value.length>100)throw err('ST_ACCESS_PERMISSIONS_INVALID_01597');
  const out=[...new Set(value.map(clean))].sort();
  if(out.some(v=>!known.has(v)))throw err('ST_ACCESS_PERMISSION_UNKNOWN_01597');
  return out;
}
export function normalizeAccessRoleInput01597(data={}){
  if(!data||typeof data!=='object'||Array.isArray(data))throw err('ST_ACCESS_ROLE_INPUT_INVALID_01597');
  const name=clean(data.name),description=clean(data.description||'');
  if(name.length<2||name.length>80||description.length>500)throw err('ST_ACCESS_ROLE_NAME_INVALID_01597');
  return {name,description,permissions:normalizeAccessPermissions01597(data.permissions??[])};
}
export function normalizeAccessAssignment01597(data={}){
  const roleId=clean(data.roleId),membershipId=clean(data.membershipId),scopeKind=clean(data.scopeKind).toLowerCase()||'store',siteId=clean(data.siteId);
  if(!/^arole_[a-f0-9]{20}$/.test(roleId)||!/^member_[a-f0-9]{16,40}$/.test(membershipId)||!ACCESS_SCOPE_KINDS_01597.includes(scopeKind))throw err('ST_ACCESS_ASSIGNMENT_INVALID_01597');
  if(scopeKind==='site'&&(!siteId||siteId.length>160))throw err('ST_ACCESS_SITE_REQUIRED_01597');
  if(scopeKind==='store'&&siteId)throw err('ST_ACCESS_STORE_SITE_CONFLICT_01597');
  return {roleId,membershipId,scopeKind,siteId:scopeKind==='site'?siteId:null};
}
export function assertAccessPolicyManager01597(scope){
  // Deliberately owner-only until role delegation has its own non-escalation checks.
  if(scope?.role!=='owner')throw err('ST_ACCESS_OWNER_REQUIRED_01597',403);
  for(const key of ['accountId','workspaceId','storeId'])if(!clean(scope?.[key]))throw err('ST_ACCESS_SCOPE_REQUIRED_01597',403);
  return true;
}
export function mergeAccessGrants01597(rows=[],{siteId=''}={}){
  const requestedSiteId=clean(siteId),set=new Set(),roleIds=new Set();
  for(const r of rows){
    if(r.status!=='active'||r.roleStatus!=='active')continue;
    if(r.scopeKind==='site'&&(!requestedSiteId||r.siteId!==requestedSiteId))continue;
    if(r.scopeKind!=='store'&&r.scopeKind!=='site')continue;
    roleIds.add(r.roleId);
    for(const p of (Array.isArray(r.permissions)?r.permissions:[]))if(known.has(p))set.add(p);
  }
  return {permissions:[...set].sort(),roleIds:[...roleIds].sort(),scopeKind:requestedSiteId?'site':'store',siteId:requestedSiteId||null};
}
export function accessCatalog01597(){return {stage:'01597',permissions:ACCESS_PERMISSIONS_01597,scopeKinds:ACCESS_SCOPE_KINDS_01597,semantics:'explicit-allow-only',enforcement:'foundation-only'};}
