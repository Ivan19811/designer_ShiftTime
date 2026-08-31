const clean=(v)=>String(v??'').trim();

export const ADMIN_ROLES_01087=Object.freeze(['owner','admin','manager','editor','viewer','catalog-manager','order-manager']);

export const ROLE_CAPABILITIES_01087=Object.freeze({
  owner:Object.freeze(['admin.view','admin.users.manage','admin.roles.manage','admin.invites.manage','admin.database.schema','admin.database.rows','catalog.write','orders.write']),
  admin:Object.freeze(['admin.view','admin.users.manage','admin.roles.manage','admin.invites.manage','admin.database.schema','admin.database.rows','catalog.write','orders.write']),
  manager:Object.freeze(['catalog.write','orders.write']),
  editor:Object.freeze(['catalog.write']),
  viewer:Object.freeze([]),
  'catalog-manager':Object.freeze(['catalog.write']),
  'order-manager':Object.freeze(['orders.write']),
});

export function normalizePermissions01087(input=[]){
  const src=Array.isArray(input)?input:[];
  return [...new Set(src.map(clean).filter(Boolean))].sort();
}

export function normalizeRole01087(value,{fallback='viewer'}={}){
  const role=clean(value).toLowerCase();
  return ADMIN_ROLES_01087.includes(role)?role:fallback;
}

export function getEffectiveCapabilities01087(scope={}){
  const role=normalizeRole01087(scope?.role);
  return [...new Set([...(ROLE_CAPABILITIES_01087[role]||[]),...normalizePermissions01087(scope?.permissions)])].sort();
}


export function getRoleCatalog01087(){return ADMIN_ROLES_01087.map(role=>({role,capabilities:[...(ROLE_CAPABILITIES_01087[role]||[])]}));}

export function hasCapability01087(scope,capability){
  return getEffectiveCapabilities01087(scope).includes(clean(capability));
}

export function assertCapability01087(scope,capability,message='Permission denied'){
  if(!hasCapability01087(scope,capability))throw Object.assign(new Error(message),{statusCode:403,code:'ST_ADMIN_PERMISSION_DENIED'});
  return true;
}

export function assertAdminView01087(scope){return assertCapability01087(scope,'admin.view','Admin access required');}
export function assertOwnerActor01087(scope){if(normalizeRole01087(scope?.role)!=='owner')throw Object.assign(new Error('Owner permission required'),{statusCode:403,code:'ST_OWNER_REQUIRED'});return true;}
export function canManageTargetRole01087(actorScope,targetRole){const target=normalizeRole01087(targetRole);if(target==='owner')return normalizeRole01087(actorScope?.role)==='owner';return hasCapability01087(actorScope,'admin.users.manage');}
