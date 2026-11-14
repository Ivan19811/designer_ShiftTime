// 01613C4 · Explicit, store-scoped module delegation for accepted site collaborators.
// No tenant-wide or administrative capability can be granted through this service.
import {classifyProtectedAction01600} from './access-enforcement-core-01600.mjs';
import {normalizeProductPermissions01621,hasProductPermission01621,delegatedRoutePermission01621,allowedDelegatedCloudMedia01621} from './delegated-product-fields-01621.mjs';
import {classifyNotificationAccess01605B} from './access-audit-core-01605b.mjs';
const clean=v=>String(v??'').trim();
const error=(code,statusCode=403)=>Object.assign(new Error(code),{code,statusCode});
const defaultRun=async cb=>(await import('./db.mjs')).withClient(cb);
export const DELEGATED_MODULE_TIERS_01613C4=Object.freeze({marketplace:['none','view','edit'],messenger:['none','view','reply']});
export function normalizeModuleTiers01613C4(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>k!=='productPermissions'&&!Object.hasOwn(DELEGATED_MODULE_TIERS_01613C4,k)))throw error('ST_MODULE_TIER_INVALID_01613C4',400);
 const marketplace=clean(input.marketplace),messenger=clean(input.messenger);
 if(!DELEGATED_MODULE_TIERS_01613C4.marketplace.includes(marketplace)||!DELEGATED_MODULE_TIERS_01613C4.messenger.includes(messenger))throw error('ST_MODULE_TIER_INVALID_01613C4',400);
 return {marketplace,messenger,productPermissions:marketplace==='edit'?normalizeProductPermissions01621(input.productPermissions||[]):[]};
}
export function modulePermissions01613C4({marketplace='none',messenger='none',productPermissions=[]}={}){
 const p=[];const tiers={marketplace,messenger,productPermissions};
 if(marketplace!=='none')p.push('shop.products.view','ui.nav.marketplace');
 if(hasProductPermission01621(tiers,'products_create'))p.push('shop.products.create');
 if(['photos','texts','prices','attributes','categories_create','categories_edit'].some(x=>hasProductPermission01621(tiers,x)))p.push('shop.products.edit');
 if(hasProductPermission01621(tiers,'products_delete'))p.push('shop.products.delete');
 if(['categories_create','categories_edit','attributes'].some(x=>hasProductPermission01621(tiers,x))){
  p.push('api.mode.catalog_actions');
  if(hasProductPermission01621(tiers,'categories_create'))p.push('shop.products.catalog.categories_create');
  if(hasProductPermission01621(tiers,'categories_edit'))p.push('shop.products.catalog.categories_edit');
  if(hasProductPermission01621(tiers,'attributes'))p.push('shop.products.catalog.attributes_create','shop.products.catalog.attributes_edit','shop.products.catalog.attribute_values_create','shop.products.catalog.attribute_values_edit');
 }
 if(messenger!=='none')p.push('crm.messages.view','ui.nav.messenger');
 if(messenger==='reply')p.push('crm.messages.reply');
 return p;
}
export function moduleRoutePermission01613C4(method,parts,tiers={}){
 const m=clean(method).toUpperCase(),p=parts||[];
 if(p[0]!=='api'||p[1]!=='v1')return null;
 if(p[2]==='marketplace'){
  const derived=delegatedRoutePermission01621(m,p,tiers);
  // For the central access inspector, route shape may be evaluated without
  // personal grants; the signed-in store-scoped grant is checked separately.
  if(derived)return derived;
  if(m==='GET'){
   const dec=classifyProtectedAction01600(m,p);
   if(dec?.permission==='shop.products.view')return dec.permission;
  }
  if(m==='POST'&&p[3]==='atomic-catalog'&&p.length===4)return 'shop.products.view';
  if(p[3]==='products'&&p.length===4&&m==='POST')return 'shop.products.create';
  if(p[3]==='products'&&p.length===5&&m==='PATCH')return 'shop.products.edit';
  if(p[3]==='products'&&p.length===5&&m==='DELETE')return 'shop.products.delete';
  if(['categories','attributes','attribute-values','media'].includes(p[3])){
   if(p.length===4&&m==='POST'||p.length===5&&m==='PATCH')return 'shop.products.edit';
  }
  return null;
 }
 if(p[2]==='notifications'&&p[3]==='messages'&&p.length===4&&m==='GET')return 'crm.messages.view';
 if(p[2]==='notifications'&&p[3]==='messages'&&p[4]==='inbox'){
  const dec=classifyNotificationAccess01605B(m,p);
  if(m==='GET'&&dec?.permission==='crm.messages.view')return dec.permission;
  if(m==='POST'&&p.length===7&&p[6]==='thread'&&dec?.permission==='crm.messages.reply')return dec.permission;
 }
 return null;
}
export function moduleRouteAllowed01613C4(method,parts,tiers){
 const permission=moduleRoutePermission01613C4(method,parts,tiers);
 if(!permission)return false;
 if(parts?.[2]==='marketplace')return delegatedRoutePermission01621(method,parts,tiers)===permission
  &&modulePermissions01613C4(tiers).includes(permission);
 return modulePermissions01613C4(tiers).includes(permission);
}
export {allowedDelegatedCloudMedia01621};
const currentGrantsSql=`SELECT g.marketplace_tier "marketplace",g.messenger_tier "messenger",g.product_permissions "productPermissions"
 FROM platform_delegated_module_grants_01613c4 g
 WHERE g.account_id=$1 AND g.store_id=$2 AND g.user_id=$3
 AND EXISTS(SELECT 1 FROM platform_site_collaboration_invites_01613c inv
  JOIN shifttime_builder_sites site ON site.id=inv.site_id AND site.account_id=inv.account_id AND site.store_id=inv.store_id AND site.status='active'
  WHERE inv.account_id=g.account_id AND inv.store_id=g.store_id AND inv.accepted_by_user_id=g.user_id AND inv.status='accepted')
 AND EXISTS(SELECT 1 FROM platform_memberships mem WHERE mem.account_id=g.account_id AND mem.user_id=g.user_id AND mem.status='active'
  AND (mem.store_id IS NULL OR mem.store_id=g.store_id) AND mem.role<>'owner') LIMIT 1`;
export async function currentDelegatedModules01613C4(scope,userId,{run=defaultRun}={}){
 if(!scope?.accountId||!scope?.storeId||!clean(userId)||scope.role==='owner')return {marketplace:'none',messenger:'none',productPermissions:[]};
 const q=await run(c=>c.query(currentGrantsSql,[scope.accountId,scope.storeId,userId]));
 return q.rows[0]||{marketplace:'none',messenger:'none',productPermissions:[]};
}
export async function listModuleDelegations01613C4(scope,{run=defaultRun}={}){
 if(scope?.role!=='owner')throw error('ST_MODULE_OWNER_REQUIRED_01613C4');
 const q=await run(c=>c.query(`SELECT g.user_id "userId",g.marketplace_tier "marketplace",g.messenger_tier "messenger",g.product_permissions "productPermissions"
 FROM platform_delegated_module_grants_01613c4 g WHERE g.account_id=$1 AND g.store_id=$2`,[scope.accountId,scope.storeId]));
 return {stage:'01613C4',grants:q.rows};
}
export async function setModuleDelegation01613C4(scope,actor,inviteId,input,{run=defaultRun}={}){
 if(scope?.role!=='owner'||!scope.accountId||!scope.workspaceId||!scope.storeId)throw error('ST_MODULE_OWNER_REQUIRED_01613C4');
 if(!/^scinv_[a-f0-9]{20}$/.test(clean(inviteId)))throw error('ST_MODULE_INVITE_INVALID_01613C4',400);
 const tiers=normalizeModuleTiers01613C4(input);
 return run(async c=>{
  await c.query('BEGIN');try{
   const inv=await c.query(`SELECT i.accepted_by_user_id "userId",i.status FROM platform_site_collaboration_invites_01613c i
    JOIN shifttime_builder_sites site ON site.id=i.site_id AND site.account_id=i.account_id AND site.workspace_id=i.workspace_id AND site.store_id=i.store_id AND site.status='active'
    WHERE i.id=$1 AND i.account_id=$2 AND i.workspace_id=$3 AND i.store_id=$4 FOR UPDATE OF i`,[inviteId,scope.accountId,scope.workspaceId,scope.storeId]);
   if(inv.rows[0]?.status!=='accepted'||!inv.rows[0]?.userId)throw error('ST_MODULE_INVITE_NOT_ACCEPTED_01613C4',409);
   const userId=inv.rows[0].userId;
   const mark=await c.query(`SELECT 1 FROM platform_memberships mem WHERE mem.account_id=$1 AND mem.user_id=$3 AND mem.status='active'
    AND mem.role<>'owner' AND (mem.store_id IS NULL OR mem.store_id=$2) AND (mem.workspace_id IS NULL OR mem.workspace_id=$4) LIMIT 1`,[scope.accountId,scope.storeId,userId,scope.workspaceId]);
   if(!mark.rowCount)throw error('ST_MODULE_MEMBERSHIP_DENIED_01613C4');
   await c.query(`INSERT INTO platform_delegated_module_grants_01613c4(account_id,store_id,user_id,marketplace_tier,messenger_tier,product_permissions,updated_by_user_id)
    VALUES($1,$2,$3,$4,$5,$6::jsonb,$7) ON CONFLICT(account_id,store_id,user_id) DO UPDATE SET marketplace_tier=$4,messenger_tier=$5,product_permissions=$6::jsonb,updated_by_user_id=$7,updated_at=now()`,[scope.accountId,scope.storeId,userId,tiers.marketplace,tiers.messenger,JSON.stringify(tiers.productPermissions),actor]);
   await c.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload)
    VALUES($1,$2,$3,$4,'site.module.permissions','site_collaboration',$5,$6::jsonb)`,[scope.accountId,scope.workspaceId,scope.storeId,actor,inviteId,JSON.stringify({userId,...tiers})]);
   await c.query('COMMIT');return {ok:true,stage:'01613C4',userId,...tiers};
  }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}
 });
}
