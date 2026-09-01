import test from 'node:test';
import assert from 'node:assert/strict';

const mod=await import('../src/auth-context-service-01088.mjs').catch(()=>({}));

test('01088 exposes authorized Store context normalizer',()=>{
  assert.equal(typeof mod.normalizeAuthorizedStoreContexts01088,'function');
});

test('authorized contexts dedupe Store rows and keep strongest matching role',()=>{
  const rows=[
    {store_id:'store_a',store_name:'A',workspace_id:'ws_a',workspace_name:'WA',account_id:'acct_a',account_name:'AA',membership_id:'m_manager',membership_workspace_id:'ws_a',membership_store_id:'store_a',role:'manager',permissions:['catalog.write']},
    {store_id:'store_a',store_name:'A',workspace_id:'ws_a',workspace_name:'WA',account_id:'acct_a',account_name:'AA',membership_id:'m_owner',membership_workspace_id:null,membership_store_id:null,role:'owner',permissions:[]},
    {store_id:'store_b',store_name:'B',workspace_id:'ws_b',workspace_name:'WB',account_id:'acct_b',account_name:'BB',membership_id:'m_store',membership_workspace_id:'ws_b',membership_store_id:'store_b',role:'manager',permissions:[]},
  ];
  const out=mod.normalizeAuthorizedStoreContexts01088(rows);
  assert.equal(out.length,2);
  assert.equal(out[0].storeId,'store_a');
  assert.equal(out[0].role,'owner');
  assert.equal(out[0].scopeMode,'account');
  assert.equal(out[1].storeId,'store_b');
  assert.equal(out[1].scopeMode,'store');
});
