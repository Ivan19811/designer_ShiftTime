import test from 'node:test';
import assert from 'node:assert/strict';

const ctx=await import('../js/account/account-context-view-01088.js').catch(()=>({}));
const stage=await import('../js/core/build-stage.js').catch(()=>({}));

test('01088 account context view marks the active Store and keeps account/role labels',()=>{
  assert.equal(typeof ctx.buildAccountContexts01088,'function');
  const out=ctx.buildAccountContexts01088([
    {accountId:'acct_1',accountName:'My account',workspaceId:'ws_1',workspaceName:'Main WS',storeId:'store_1',storeName:'Own',role:'owner',scopeMode:'account'},
    {accountId:'acct_2',accountName:'Team account',workspaceId:'ws_2',workspaceName:'Team WS',storeId:'store_2',storeName:'Shop',role:'manager',scopeMode:'store'},
  ],'store_2');
  assert.equal(out.length,2);
  assert.equal(out[0].active,false);
  assert.equal(out[1].active,true);
  assert.match(out[1].title,/Team account/);
  assert.match(out[1].meta,/Менеджер/);
});

test('visible account build label comes from centralized current build stage',()=>{
  assert.equal(stage.SHIFTTIME_BUILD_STAGE,'01089');
  assert.equal(stage.buildStageLabel('ACCOUNT'),'ACCOUNT · 01089');
});
