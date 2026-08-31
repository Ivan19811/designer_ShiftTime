import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_ROLES_01087,
  getEffectiveCapabilities01087,
  canManageTargetRole01087,
  normalizePermissions01087,
} from '../src/admin-access-01087.mjs';

test('01087 admin role list preserves legacy roles and adds manager',()=>{
  assert.deepEqual(ADMIN_ROLES_01087,['owner','admin','manager','editor','viewer','catalog-manager','order-manager']);
});

test('owner has full admin capabilities',()=>{
  const caps=getEffectiveCapabilities01087({role:'owner',permissions:[]});
  for(const c of ['admin.view','admin.users.manage','admin.roles.manage','admin.invites.manage','admin.database.schema','admin.database.rows']) assert.equal(caps.includes(c),true,c);
});

test('admin can manage users but cannot manage owner role',()=>{
  assert.equal(getEffectiveCapabilities01087({role:'admin'}).includes('admin.users.manage'),true);
  assert.equal(canManageTargetRole01087({role:'admin'},'owner'),false);
  assert.equal(canManageTargetRole01087({role:'owner'},'owner'),true);
});

test('manager/editor/viewer do not get admin workspace by default',()=>{
  for(const role of ['manager','editor','viewer']) assert.equal(getEffectiveCapabilities01087({role}).includes('admin.view'),false,role);
});

test('explicit permission grants are normalized and merged',()=>{
  assert.deepEqual(normalizePermissions01087(['admin.view',' admin.view ','catalog.write',null]),['admin.view','catalog.write']);
  const caps=getEffectiveCapabilities01087({role:'viewer',permissions:['admin.view']});
  assert.equal(caps.includes('admin.view'),true);
});
