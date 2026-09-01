import test from 'node:test';
import assert from 'node:assert/strict';

const mod=await import('../js/marketplace/data/marketplace-auth-propagation-01089.js').catch(()=>({}));

const authState={
  status:'authenticated',
  token:'real-token',
  user:{id:'usr_manager',name:'Manager User'},
  scope:{
    accountId:'acct_owner',accountName:'Ivan Test · ShiftTime',
    workspaceId:'ws_owner',workspaceName:'Основний Workspace',
    storeId:'store_owner',storeName:'Основний магазин',
    role:'manager',permissions:['catalog.write']
  }
};
const localContext={userId:'usr_local',accountId:'acct_local',workspaceId:'ws_local',storeId:'store_default'};

 test('01089 Real Auth forces API repository even when persisted config is local',()=>{
  assert.equal(typeof mod.resolveMarketplaceRepositoryMode01089,'function');
  assert.equal(mod.resolveMarketplaceRepositoryMode01089({configuredMode:'local',authState}),'api');
  assert.equal(mod.resolveMarketplaceRepositoryMode01089({configuredMode:'local',authState:{status:'anonymous',token:'',scope:null}}),'local');
});

test('01089 effective Marketplace context is server-authorized Auth scope, not store_default',()=>{
  assert.equal(typeof mod.resolveEffectiveMarketplaceContext01089,'function');
  const ctx=mod.resolveEffectiveMarketplaceContext01089({authState,localContext});
  assert.equal(ctx.userId,'usr_manager');
  assert.equal(ctx.accountId,'acct_owner');
  assert.equal(ctx.workspaceId,'ws_owner');
  assert.equal(ctx.storeId,'store_owner');
  assert.equal(ctx.storeName,'Основний магазин');
  assert.equal(ctx.role,'manager');
  assert.deepEqual(ctx.permissions,['catalog.write']);
  assert.equal(ctx.source,'real-auth');
});

test('01089 authenticated API transport prefers real token and server Store over DEV/local fallback',()=>{
  assert.equal(typeof mod.resolveMarketplaceRequestAuth01089,'function');
  const out=mod.resolveMarketplaceRequestAuth01089({authState,backendConfig:{devToken:'dev-token'},localContext});
  assert.equal(out.token,'real-token');
  assert.equal(out.storeId,'store_owner');
  assert.equal(out.workspaceId,'ws_owner');
  assert.equal(out.role,'manager');
  assert.equal(out.source,'real-auth');
});

test('01089 Marketplace UI capability model recognizes manager instead of falling back to no permissions',async()=>{
  const permissions=await import('../js/marketplace/services/marketplace-permissions-01070.js');
  assert.ok(Array.isArray(permissions.MARKETPLACE_ROLE_PERMISSIONS_01070.manager));
  assert.ok(permissions.MARKETPLACE_ROLE_PERMISSIONS_01070.manager.includes('catalog.write'));
  assert.ok(permissions.MARKETPLACE_ROLE_PERMISSIONS_01070.manager.includes('orders.write'));
});

test('01089 store-scoped operational runtimes refresh even when API repository type stays the same',async()=>{
  const sync=await import('../js/marketplace/data/marketplace-runtime-sync-01089.js').catch(()=>({}));
  assert.equal(typeof sync.syncMarketplaceOperationalRepository01089,'function');
  const calls=[];
  const store={getRepositoryInfo:()=>({type:'api-marketplace-inventory'}),setRepository:async()=>calls.push('set'),refresh:async reason=>calls.push(`refresh:${reason}`)};
  const next={type:'api-marketplace-inventory'};
  await sync.syncMarketplaceOperationalRepository01089(store,next,{reason:'auth-context-changed'});
  assert.deepEqual(calls,['refresh:auth-context-changed']);
});
