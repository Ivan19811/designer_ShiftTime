import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashInvitationToken01087,
  normalizeInvitationScope01087,
  assertMembershipMutationInvariant01087,
  validateInvitationEmail01087,
} from '../src/admin-service-helpers-01087.mjs';

test('invitation token hashing is deterministic and does not expose token',()=>{
  const a=hashInvitationToken01087('secret-token');
  const b=hashInvitationToken01087('secret-token');
  assert.equal(a,b);
  assert.equal(a.length,64);
  assert.notEqual(a,'secret-token');
});

test('invitation scope defaults to current Store and can be reduced to workspace/account',()=>{
  const scope={workspaceId:'ws_1',storeId:'store_1'};
  assert.deepEqual(normalizeInvitationScope01087(scope,'store'),{workspaceId:'ws_1',storeId:'store_1',scopeMode:'store'});
  assert.deepEqual(normalizeInvitationScope01087(scope,'workspace'),{workspaceId:'ws_1',storeId:null,scopeMode:'workspace'});
  assert.deepEqual(normalizeInvitationScope01087(scope,'account'),{workspaceId:null,storeId:null,scopeMode:'account'});
});

test('last active owner cannot be demoted or disabled',()=>{
  assert.throws(()=>assertMembershipMutationInvariant01087({actorRole:'owner',targetRole:'owner',nextRole:'admin',nextStatus:'active',activeOwnerCount:1}),/last active owner/i);
  assert.throws(()=>assertMembershipMutationInvariant01087({actorRole:'owner',targetRole:'owner',nextRole:'owner',nextStatus:'disabled',activeOwnerCount:1}),/last active owner/i);
});

test('admin cannot mutate owner membership',()=>{
  assert.throws(()=>assertMembershipMutationInvariant01087({actorRole:'admin',targetRole:'owner',nextRole:'owner',nextStatus:'active',activeOwnerCount:2}),/owner permission/i);
});

test('invitation email is normalized and validated',()=>{
  assert.equal(validateInvitationEmail01087(' USER@Example.COM '),'user@example.com');
  assert.throws(()=>validateInvitationEmail01087('broken'),/email/i);
});

test('existing disabled membership is reactivated instead of duplicated',async()=>{
  const mod=await import('../src/admin-service-helpers-01087.mjs');
  assert.equal(mod.membershipInviteAction01087(null),'create');
  assert.equal(mod.membershipInviteAction01087({status:'disabled'}),'reactivate');
  assert.equal(mod.membershipInviteAction01087({status:'active'}),'conflict');
});

test('role or explicit permission changes require role-management authority',async()=>{
  const mod=await import('../src/admin-service-helpers-01087.mjs');
  assert.equal(mod.requiresRolesManage01087({status:'disabled'}),false);
  assert.equal(mod.requiresRolesManage01087({role:'editor'}),true);
  assert.equal(mod.requiresRolesManage01087({permissions:['catalog.write']}),true);
});
