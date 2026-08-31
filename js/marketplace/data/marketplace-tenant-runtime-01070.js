// 01070 · Multi-tenant composition root layered above frozen 01052 commerce core.
import {getMarketplaceStore01052} from './marketplace-runtime-01052.js?v=01052';
import {LocalPlatformContextRepository01070} from '../repositories/local-platform-context-repository-01070.js?v=01070';
import {ScopedLocalMarketplaceRepository01070,getScopedMarketplaceStorageKey01070} from '../repositories/scoped-local-marketplace-repository-01070.js?v=01070';
import {LOCAL_MARKETPLACE_STORAGE_KEY_01052} from '../repositories/local-marketplace-repository-01052.js?v=01052';
import {MarketplaceTenantContextStore01070} from './marketplace-tenant-context-store-01070.js?v=01070';

let contextStore=null;let initPromise=null;let unsubscribe=null;let switching=Promise.resolve();
function hasStorageKey(key){try{return globalThis.localStorage?.getItem(key)!=null;}catch{return false;}}
function createScopedRepo(context){return new ScopedLocalMarketplaceRepository01070({tenantId:context.accountId,workspaceId:context.workspaceId,storeId:context.storeId});}
async function switchCommerceScope(context,{migrateLegacy=false}={}){
  const commerce=getMarketplaceStore01052(); if(!commerce.ready) await commerce.init(); if(!context?.storeId)return null;
  const scoped=createScopedRepo(context); const targetKey=getScopedMarketplaceStorageKey01070(context.storeId);
  let migrate=false;
  if(migrateLegacy&&!hasStorageKey(targetKey)&&hasStorageKey(LOCAL_MARKETPLACE_STORAGE_KEY_01052)) migrate=true;
  await commerce.setRepository(scoped,{migrateCurrent:migrate});
  try{window.dispatchEvent(new CustomEvent('st:marketplace-commerce-scope-changed',{detail:{context,repository:commerce.getRepositoryInfo(),migratedLegacy:migrate}}));}catch{}
  try{window.__ST_ALL_LOG__?.push?.('marketplace-tenant:commerce-scope-switched-01070',{tenantId:context.accountId,workspaceId:context.workspaceId,storeId:context.storeId,repository:commerce.getRepositoryInfo(),migratedLegacy:migrate,productCount:commerce.getProducts().length});}catch{}
  return commerce.getRepositoryInfo();
}
export function getMarketplaceTenantContextStore01070(){if(!contextStore)contextStore=new MarketplaceTenantContextStore01070({repository:new LocalPlatformContextRepository01070()});return contextStore;}
export async function initMarketplaceTenantRuntime01070(){
  if(initPromise)return initPromise;
  initPromise=(async()=>{
    const ctxStore=getMarketplaceTenantContextStore01070();await ctxStore.init();let ctx=ctxStore.getActiveContext();
    const needsLegacy=ctxStore.getState().migrations?.legacyCommerceScoped!==true;
    await switchCommerceScope(ctx,{migrateLegacy:needsLegacy});
    if(needsLegacy)await ctxStore.markMigration('legacyCommerceScoped',true);
    if(!unsubscribe)unsubscribe=ctxStore.subscribe(detail=>{if(detail.reason==='init'||String(detail.reason).startsWith('migration:'))return;const next=detail.context;if(!next?.storeId)return;switching=switching.then(()=>switchCommerceScope(next)).catch(e=>console.error('[01070] commerce scope switch failed',e));});
    ctx=ctxStore.getActiveContext();
    try{window.__ST_ALL_LOG__?.push?.('marketplace-tenant:runtime-ready-01070',{context:{userId:ctx.userId,tenantId:ctx.accountId,workspaceId:ctx.workspaceId,storeId:ctx.storeId},roles:ctxStore.getRoles(),permissions:ctxStore.getPermissions(),commerceRepository:getMarketplaceStore01052().getRepositoryInfo(),productModelsCarryTenantFields:false});}catch{}
    return {contextStore:ctxStore,commerceStore:getMarketplaceStore01052(),context:ctx};
  })();return initPromise;
}
export async function awaitMarketplaceTenantScope01070(){await switching;return getMarketplaceTenantContextStore01070().getActiveContext();}
export function getMarketplaceRepositoryContext01070(){const c=getMarketplaceTenantContextStore01070().getActiveContext();return Object.freeze({userId:c.userId,tenantId:c.accountId,workspaceId:c.workspaceId,storeId:c.storeId});}
export function getMarketplaceMediaScope01070(){const c=getMarketplaceRepositoryContext01070();return `tenant/${encodeURIComponent(c.tenantId)}/workspace/${encodeURIComponent(c.workspaceId)}/store/${encodeURIComponent(c.storeId)}`;}
