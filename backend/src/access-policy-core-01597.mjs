// ShiftTime 01597 · Stable, service-agnostic permission vocabulary.
// `labelKey` is an i18n key; no end-user strings are hardcoded in this API.
const define=(group,action,kind='action')=>Object.freeze({code:`${group}.${action}`,group,action,kind,labelKey:`access.permissions.${group.replaceAll('.','_')}.${action}`});
export const ACCESS_PERMISSIONS_01597=Object.freeze([
  define('site.pages','view'),define('site.pages','create'),define('site.pages','edit'),define('site.pages','delete'),
  define('site.design','view'),define('site.design','edit'),
  define('site.publish','view'),define('site.publish','execute'),define('site.publish','delete'),
  // 01606E · Exact server gates for site saves, drafts and publish.
  define('api.mode','site_actions'),
  ...['site_create','metadata_edit','project_replace','site_delete','draft_create','draft_replace','draft_details','draft_delete','publish'].map(action=>define('site.design.actions',action)),
  // 01606F · Atomic Canvas Main node operations (not entire project snapshots).
  ...['create','update','move','delete'].map(action=>define('site.design.canvas',action)),
  define('shop.products','view'),define('shop.products','create'),define('shop.products','edit'),define('shop.products','delete'),define('shop.products','import'),define('shop.products','prices'),
  // 01606B · Opt-in, independent SERVER authorization for high-impact product mutations.
  define('api.mode','product_actions'),define('api.mode','table_actions'),define('api.mode','catalog_actions'),
  ...['activate','deactivate','archive','variants_create','variants_edit','variants_delete','export','snapshot_replace','replace_apply','rollback_restore'].map(action=>define('shop.products.actions',action)),
  // 01606D · Categories, attributes and attribute values, each with independent server actions.
  ...['categories','attributes','attribute_values'].flatMap(kind=>['create','edit','delete'].map(action=>define('shop.products.catalog',kind+'_'+action))),
  // 01606C · Precise table CRUD boundaries, enforced after the original builder.tables base permission.
  ...['create','settings_edit','archive','fields_create','fields_edit','fields_delete','records_create','records_edit','records_delete','views_create','views_edit','views_delete'].map(action=>define('builder.tables.actions',action)),
  define('shop.orders','view'),define('shop.orders','edit'),define('shop.orders','status'),define('shop.orders','cancel'),define('shop.orders','refund'),
  define('shop.shipping','view'),define('shop.shipping','edit'),define('shop.shipping','simulate'),
  define('shop.payments','view'),define('shop.payments','create'),define('shop.payments','edit'),
  define('shop.payouts','view'),define('shop.payouts','edit'),
  define('shop.inventory','view'),define('shop.inventory','manage'),
  define('shop.suppliersync','view'),define('shop.suppliersync','manage'),define('shop.suppliersync','approve'),
  define('shop.settings','manage'), define('builder.integrations','view'),define('builder.integrations','manage'),
  define('builder.tables','view'),define('builder.tables','edit'),define('builder.tables','delete'),
  define('builder.smartblocks','view'),define('builder.smartblocks','edit'),
  define('builder.media','view'),define('builder.media','upload'),define('builder.media','delete'),
  define('builder.seo','view'),define('builder.seo','edit'),
  define('builder.ai','view'),define('builder.ai','configure'),
  define('crm.contacts','view'),define('crm.contacts','edit'),define('crm.contacts','export'),
  define('crm.messages','view'),define('crm.messages','reply'),define('crm.messages','manage'),
  define('shop.notifications','view'),define('shop.notifications','manage'),
  define('crm.orders','view'),define('crm.orders','edit'),
  define('team.members','view'),define('team.members','invite'),define('team.members','manage'),
  define('team.roles','view'),define('team.roles','manage'),
  // 01606 · Client-only exact visibility gates. Do not treat these as API authority.
  define('ui.mode','navigation'),define('ui.mode','inspector'),define('ui.mode','controls'),
  define('ui.nav','site'),define('ui.nav','pages'),define('ui.nav','marketplace'),define('ui.nav','shop'),define('ui.nav','orders'),
  define('ui.nav','notifications'),define('ui.nav','aiconsultant'),define('ui.nav','aiassistant'),define('ui.nav','modules'),define('ui.nav','tables'),
  define('ui.nav','design'),define('ui.nav','aidesign'),define('ui.nav','globaldesign'),define('ui.nav','background'),define('ui.nav','blocks'),
  define('ui.nav','global'),define('ui.nav','constructor'),
  define('ui.inspector','siteopen'),define('ui.inspector','pageadd'),define('ui.inspector','sectionadd'),define('ui.inspector','pagesave'),
  define('ui.control','pagecreate'),define('ui.control','pagesave'),define('ui.control','sectioncreate'),define('ui.control','sitetemplate'),define('ui.control','sitepublish'),
  define('ui.control','siteunpublish'),define('ui.control','shopcreate'),define('ui.control','shopvisibility'),define('ui.control','shopcartoptions'),define('ui.control','shopautopages'),
  define('ui.control','productcreate'),define('ui.control','productedit'),define('ui.control','productdelete'),define('ui.control','productimport'),define('ui.control','productregenerate'),
  define('ui.control','productmediaupload'),define('ui.control','deliverysettings'),define('ui.control','categorycreate'),define('ui.control','categoryaddchild'),define('ui.control','categorybulkactivate'),
  define('ui.control','categorybulkdeactivate'),define('ui.control','categoryreplaceapply'),define('ui.control','categoryreplacemedia'),define('ui.control','variantaddattribute'),define('ui.control','variantremoveattribute'),
  define('ui.control','variantvisibility'),define('ui.control','variantmediapick'),define('ui.control','variantmediaupload'),define('ui.control','variantmediaremove'),define('ui.control','librarymediaupload'),
  define('ui.control','pickermediaupload'),define('ui.control','productmediaextra'),define('ui.control','feedcreate'),define('ui.control','feedsave'),define('ui.control','feeddelete'),
  define('ui.control','feedmappingadd'),define('ui.control','feedmappingremove'),
  ...['canvasaddsection','canvasaddblock','canvasaddline','canvasaddtext','canvasaddarticle','canvasundo','canvasredo','canvaspagetree',
      'tablecreateopen','tablecreatesubmit','tablearchive','tableaddrow','tabledeleterow','tableaddcolumn','tablecreatecolumn',
      'tabledeletecolumn','tablesettingssave','tableaddview','tableviewapply','tablethemeapply','tableinsertmain'].map(action=>define('ui.control',action)),
]);
export const ACCESS_SCOPE_KINDS_01597=Object.freeze(['store','site']);
const known=new Set(ACCESS_PERMISSIONS_01597.map(p=>p.code));
const clean=v=>String(v??'').trim();
const err=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
export function normalizeAccessPermissions01597(value){
  if(!Array.isArray(value)||value.length>200)throw err('ST_ACCESS_PERMISSIONS_INVALID_01597');
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
