// 01070 · Multi-tenant platform schema.
// Platform/account context is deliberately separate from 01052 commerce entity models.
export const MARKETPLACE_PLATFORM_SCHEMA_ID_01070='st-marketplace-platform-context';
export const MARKETPLACE_PLATFORM_SCHEMA_VERSION_01070=1;

function nowIso(){return new Date().toISOString();}
function cleanString(v){return String(v??'').trim();}
function cleanArray(v){return Array.isArray(v)?v:[];}
function cleanObject(v){return v&&typeof v==='object'&&!Array.isArray(v)?{...v}:{ };}
function cleanStatus(v,allowed,fallback){const x=cleanString(v);return allowed.includes(x)?x:fallback;}
function uid(prefix){try{return `${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,18)}`;}catch{return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,10)}`;}}
function uniqueStrings(v){return [...new Set(cleanArray(v).map(cleanString).filter(Boolean))];}

export const MARKETPLACE_ROLE_IDS_01070=Object.freeze(['owner','admin','editor','catalog-manager','order-manager','viewer']);

export function createPlatformUser01070(input={}){const t=nowIso();return {
  id:cleanString(input.id)||uid('user'),
  email:cleanString(input.email),
  name:cleanString(input.name)||'Користувач',
  status:cleanStatus(input.status,['active','invited','disabled'],'active'),
  createdAt:cleanString(input.createdAt)||t,
  updatedAt:cleanString(input.updatedAt)||t
};}
export function createPlatformAccount01070(input={}){const t=nowIso();return {
  id:cleanString(input.id)||uid('acct'),
  name:cleanString(input.name)||'Моя організація',
  slug:cleanString(input.slug),
  status:cleanStatus(input.status,['active','suspended','archived'],'active'),
  ownerUserId:cleanString(input.ownerUserId),
  settings:cleanObject(input.settings),
  createdAt:cleanString(input.createdAt)||t,
  updatedAt:cleanString(input.updatedAt)||t
};}
export function createPlatformWorkspace01070(input={}){const t=nowIso();return {
  id:cleanString(input.id)||uid('ws'),
  accountId:cleanString(input.accountId),
  name:cleanString(input.name)||'Основний Workspace',
  slug:cleanString(input.slug),
  status:cleanStatus(input.status,['active','archived'],'active'),
  settings:cleanObject(input.settings),
  createdAt:cleanString(input.createdAt)||t,
  updatedAt:cleanString(input.updatedAt)||t
};}
export function createPlatformStore01070(input={}){const t=nowIso();return {
  id:cleanString(input.id)||uid('store'),
  workspaceId:cleanString(input.workspaceId),
  name:cleanString(input.name)||'Мій магазин',
  slug:cleanString(input.slug),
  status:cleanStatus(input.status,['draft','active','archived'],'active'),
  domain:cleanString(input.domain),
  locale:cleanString(input.locale)||'uk-UA',
  currency:cleanString(input.currency)||'UAH',
  settings:cleanObject(input.settings),
  createdAt:cleanString(input.createdAt)||t,
  updatedAt:cleanString(input.updatedAt)||t
};}
export function createPlatformMembership01070(input={}){const t=nowIso();const role=cleanString(input.role);return {
  id:cleanString(input.id)||uid('member'),
  userId:cleanString(input.userId),
  accountId:cleanString(input.accountId),
  workspaceId:cleanString(input.workspaceId)||null,
  storeId:cleanString(input.storeId)||null,
  role:MARKETPLACE_ROLE_IDS_01070.includes(role)?role:'viewer',
  status:cleanStatus(input.status,['active','invited','disabled'],'active'),
  permissions:uniqueStrings(input.permissions),
  createdAt:cleanString(input.createdAt)||t,
  updatedAt:cleanString(input.updatedAt)||t
};}

export function createEmptyPlatformSnapshot01070(){const t=nowIso();return {
  schemaId:MARKETPLACE_PLATFORM_SCHEMA_ID_01070,
  schemaVersion:MARKETPLACE_PLATFORM_SCHEMA_VERSION_01070,
  revision:0,
  createdAt:t,
  updatedAt:t,
  users:[],accounts:[],workspaces:[],stores:[],memberships:[],
  activeContext:{userId:'',accountId:'',workspaceId:'',storeId:''},
  migrations:{legacyCommerceScoped:false},
  settings:{futureMarketplaceNetwork:true,authMode:'development'}
};}

export function createDefaultPlatformSnapshot01070(){
  const user=createPlatformUser01070({id:'user_dev_owner',name:'Власник ShiftTime',email:'owner@local.shifttime'});
  const account=createPlatformAccount01070({id:'acct_default',name:'Моя організація',slug:'my-organization',ownerUserId:user.id});
  const workspace=createPlatformWorkspace01070({id:'ws_default',accountId:account.id,name:'Основний Workspace',slug:'main'});
  const store=createPlatformStore01070({id:'store_default',workspaceId:workspace.id,name:'Основний магазин',slug:'main-store'});
  const membership=createPlatformMembership01070({id:'member_default_owner',userId:user.id,accountId:account.id,workspaceId:workspace.id,storeId:store.id,role:'owner'});
  const base=createEmptyPlatformSnapshot01070();
  return {...base,users:[user],accounts:[account],workspaces:[workspace],stores:[store],memberships:[membership],activeContext:{userId:user.id,accountId:account.id,workspaceId:workspace.id,storeId:store.id}};
}

function normalizeArray(arr,factory){return cleanArray(arr).map(x=>factory(x)).filter(x=>x.id);}
function belongs(snapshot,ctx){
  const user=snapshot.users.find(x=>x.id===ctx.userId&&x.status!=='disabled');
  const account=snapshot.accounts.find(x=>x.id===ctx.accountId&&x.status==='active');
  const workspace=snapshot.workspaces.find(x=>x.id===ctx.workspaceId&&x.accountId===account?.id&&x.status==='active');
  const store=snapshot.stores.find(x=>x.id===ctx.storeId&&x.workspaceId===workspace?.id&&x.status!=='archived');
  return !!(user&&account&&workspace&&store);
}
function firstValidContext(snapshot){
  const user=snapshot.users.find(x=>x.status!=='disabled');
  const account=snapshot.accounts.find(x=>x.status==='active');
  const workspace=snapshot.workspaces.find(x=>x.accountId===account?.id&&x.status==='active');
  const store=snapshot.stores.find(x=>x.workspaceId===workspace?.id&&x.status!=='archived');
  return {userId:user?.id||'',accountId:account?.id||'',workspaceId:workspace?.id||'',storeId:store?.id||''};
}
export function normalizePlatformSnapshot01070(input={}){
  const raw=cleanObject(input); const fallback=createDefaultPlatformSnapshot01070();
  const out={
    schemaId:MARKETPLACE_PLATFORM_SCHEMA_ID_01070,
    schemaVersion:MARKETPLACE_PLATFORM_SCHEMA_VERSION_01070,
    revision:Number.isFinite(Number(raw.revision))?Number(raw.revision):0,
    createdAt:cleanString(raw.createdAt)||fallback.createdAt,
    updatedAt:cleanString(raw.updatedAt)||fallback.updatedAt,
    users:normalizeArray(raw.users,createPlatformUser01070),
    accounts:normalizeArray(raw.accounts,createPlatformAccount01070),
    workspaces:normalizeArray(raw.workspaces,createPlatformWorkspace01070),
    stores:normalizeArray(raw.stores,createPlatformStore01070),
    memberships:normalizeArray(raw.memberships,createPlatformMembership01070),
    activeContext:{userId:cleanString(raw.activeContext?.userId),accountId:cleanString(raw.activeContext?.accountId),workspaceId:cleanString(raw.activeContext?.workspaceId),storeId:cleanString(raw.activeContext?.storeId)},
    migrations:{...cleanObject(raw.migrations),legacyCommerceScoped:raw.migrations?.legacyCommerceScoped===true},
    settings:{futureMarketplaceNetwork:true,authMode:'development',...cleanObject(raw.settings)}
  };
  if(!out.users.length||!out.accounts.length||!out.workspaces.length||!out.stores.length){return fallback;}
  if(!belongs(out,out.activeContext)) out.activeContext=firstValidContext(out);
  return out;
}
export function touchPlatformSnapshot01070(input={}){const s=normalizePlatformSnapshot01070(input);return {...s,revision:(Number(s.revision)||0)+1,updatedAt:nowIso()};}
export function getActivePlatformContext01070(snapshot){
  const s=normalizePlatformSnapshot01070(snapshot),c=s.activeContext;
  return {
    ...c,
    user:s.users.find(x=>x.id===c.userId)||null,
    account:s.accounts.find(x=>x.id===c.accountId)||null,
    workspace:s.workspaces.find(x=>x.id===c.workspaceId)||null,
    store:s.stores.find(x=>x.id===c.storeId)||null
  };
}
export function getPlatformSummary01070(snapshot){const s=normalizePlatformSnapshot01070(snapshot),active=getActivePlatformContext01070(s);return {
  revision:s.revision,users:s.users.length,accounts:s.accounts.length,workspaces:s.workspaces.length,stores:s.stores.length,memberships:s.memberships.length,
  activeStoreId:active.storeId,activeStoreName:active.store?.name||'',activeWorkspaceName:active.workspace?.name||'',activeAccountName:active.account?.name||''
};}
