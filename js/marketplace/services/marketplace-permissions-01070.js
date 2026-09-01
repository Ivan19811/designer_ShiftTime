// 01070 · Role/permission resolver. Authorization remains server-side in production;
// this client resolver is for UI capability hints and local development only.
export const MARKETPLACE_PERMISSIONS_01070=Object.freeze([
  'platform.manage','workspace.manage','store.manage','members.manage','billing.manage',
  'catalog.read','catalog.write','media.write','imports.write','feeds.write','seo.write','design.write',
  'orders.read','orders.write','inventory.write','analytics.read'
]);
export const MARKETPLACE_ROLE_PERMISSIONS_01070=Object.freeze({
  owner:['*'],
  admin:['platform.manage','workspace.manage','store.manage','members.manage','catalog.read','catalog.write','media.write','imports.write','feeds.write','seo.write','design.write','orders.read','orders.write','inventory.write','analytics.read'],
  manager:['catalog.read','catalog.write','media.write','imports.write','feeds.write','seo.write','orders.read','orders.write','inventory.write','analytics.read'],
  editor:['catalog.read','catalog.write','media.write','imports.write','feeds.write','seo.write','design.write','analytics.read'],
  'catalog-manager':['catalog.read','catalog.write','media.write','imports.write','feeds.write','inventory.write','analytics.read'],
  'order-manager':['catalog.read','orders.read','orders.write','inventory.write','analytics.read'],
  viewer:['catalog.read','orders.read','analytics.read']
});
function matchesScope(m,ctx){
  if(m.status!=='active'||m.userId!==ctx.userId||m.accountId!==ctx.accountId)return false;
  if(m.workspaceId&&m.workspaceId!==ctx.workspaceId)return false;
  if(m.storeId&&m.storeId!==ctx.storeId)return false;
  return true;
}
export function getEffectivePermissions01070(snapshot,context=snapshot?.activeContext||{}){
  const grants=new Set();
  (snapshot?.memberships||[]).filter(m=>matchesScope(m,context)).forEach(m=>{
    (MARKETPLACE_ROLE_PERMISSIONS_01070[m.role]||[]).forEach(p=>grants.add(p));
    (m.permissions||[]).forEach(p=>grants.add(p));
  });
  return grants.has('*')?new Set(['*',...MARKETPLACE_PERMISSIONS_01070]):grants;
}
export function canMarketplace01070(snapshot,permission,context=snapshot?.activeContext||{}){const set=getEffectivePermissions01070(snapshot,context);return set.has('*')||set.has(permission);}
export function getEffectiveRoles01070(snapshot,context=snapshot?.activeContext||{}){return [...new Set((snapshot?.memberships||[]).filter(m=>matchesScope(m,context)).map(m=>m.role))];}
