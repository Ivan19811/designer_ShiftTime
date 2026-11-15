// 01623 · Pure, fail-closed published site → Builder link and role policy.
const clean=value=>String(value??'').trim();
const ADMIN_EDIT_GRANTS_01623=new Set([
  'site.pages.edit','site.pages.create','site.design.edit',
  'shop.products.edit','shop.products.create','shop.products.import',
  'shop.settings.manage'
]);

export function resolveBuilderEntry01623(raw=process.env.SSO_ALLOWED_CALLBACKS||'',preferred=process.env.SITE_ADMIN_BUILDER_URL_01623||''){
  // Use only a callback explicitly registered for the Builder in the existing SSO allowlist.
  const options=clean(raw).split(',').map(v=>v.trim()).filter(v=>v.startsWith('builder='))
    .map(v=>v.slice(8)).filter(v=>{try{
      const u=new URL(v);return (u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname))
        &&!u.username&&!u.password&&!u.search&&!u.hash;
    }catch{return false;}});
  const target=clean(preferred);
  const selected=target?(options.includes(target)?target:''):
    options.find(v=>v.startsWith('https:'))||options[0]||'';
  return selected;
}
export function publishedSiteAdminDecision01623(members=[],{
  enrolled=false,siteId='',siteActive=true
}={}){
  if(!siteActive)return {role:'customer',canAdmin:false};
  const valid=members.filter(m=>m?.status==='active');
  if(valid.some(m=>m.role==='owner'))return {role:'owner',canAdmin:true};
  if(!enrolled)return {role:'customer',canAdmin:false};
  const allowed=valid.filter(m=>m.assignmentStatus==='active'&&m.accessRoleStatus==='active'
    &&(m.scopeKind==='store'||m.scopeKind==='site'&&clean(m.grantSiteId)===clean(siteId)));
  const canAdmin=allowed.some(m=>Array.isArray(m.permissions)&&m.permissions.some(p=>ADMIN_EDIT_GRANTS_01623.has(p)));
  if(!canAdmin)return {role:'customer',canAdmin:false};
  return {role:valid.some(m=>m.role==='admin')?'site_admin':'manager',canAdmin:true};
}
