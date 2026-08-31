import test from 'node:test';
import assert from 'node:assert/strict';
import {roleLabel01087,canShowAdmin01087,buildAdminSummary01087,permissionLabel01087} from '../js/admin/admin-view-model-01087.js';

test('role labels are Ukrainian and legacy roles remain readable',()=>{
  assert.equal(roleLabel01087('owner'),'Власник');
  assert.equal(roleLabel01087('manager'),'Менеджер');
  assert.equal(roleLabel01087('catalog-manager'),'Менеджер каталогу');
});

test('admin visibility uses backend capabilities, not role guessing',()=>{
  assert.equal(canShowAdmin01087({actor:{capabilities:['admin.view']}}),true);
  assert.equal(canShowAdmin01087({actor:{capabilities:[]},scope:{role:'owner'}}),false);
});

test('admin summary normalizes missing counts',()=>{
  assert.deepEqual(buildAdminSummary01087({counts:{members:3,stores:2}}),{members:3,workspaces:0,stores:2,pendingInvitations:0});
});

test('permission labels are human readable',()=>{
  assert.match(permissionLabel01087('admin.database.rows'),/даних/i);
});

test('assignable role catalog hides owner from non-owner actors and requires role-management capability',async()=>{
  const mod=await import('../js/admin/admin-view-model-01087.js');
  assert.deepEqual(mod.assignableRoles01087({role:'admin',capabilities:['admin.roles.manage']}),['admin','manager','editor','viewer','catalog-manager','order-manager']);
  assert.equal(mod.assignableRoles01087({role:'owner',capabilities:['admin.roles.manage']}).includes('owner'),true);
  assert.deepEqual(mod.assignableRoles01087({role:'admin',capabilities:['admin.users.manage']}),[]);
});
