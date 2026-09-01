import test from 'node:test';
import assert from 'node:assert/strict';

const mod=await import('../src/auth-session-response-01089.mjs').catch(()=>({}));

test('01089 restored auth session response retains server expiry after F5',()=>{
  assert.equal(typeof mod.buildAuthSessionResponse01089,'function');
  const out=mod.buildAuthSessionResponse01089({
    session:{userId:'usr_1',email:'u@test.dev',name:'U',expiresAt:'2026-10-01T09:59:00.000Z'},
    scope:{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1',role:'manager'},
    requestId:'req_1'
  });
  assert.equal(out.expiresAt,'2026-10-01T09:59:00.000Z');
  assert.equal(out.user.id,'usr_1');
  assert.equal(out.scope.role,'manager');
  assert.equal(out.stage,'01089');
});
