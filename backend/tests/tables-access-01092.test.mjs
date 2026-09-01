import test from 'node:test';
import assert from 'node:assert/strict';
import {canReadTable01092,canWriteTable01092,tableScopeMatches01092} from '../src/tables-field-types-01092.mjs';
const scope={accountId:'account_1',workspaceId:'workspace_1',storeId:'store_1',role:'editor'};

test('01092 scope matcher isolates Account, Workspace and Store tables',()=>{
  assert.equal(tableScopeMatches01092({scopeType:'account',accountId:'account_1'},scope,'user_x'),true);
  assert.equal(tableScopeMatches01092({scopeType:'workspace',accountId:'account_1',workspaceId:'workspace_2'},scope,'user_x'),false);
  assert.equal(tableScopeMatches01092({scopeType:'store',accountId:'account_1',workspaceId:'workspace_1',storeId:'store_2'},scope,'user_x'),false);
});

test('01092 Personal table stays owner-only while explicit permissions remain supported',()=>{
  const personal={scopeType:'personal',ownerUserId:'owner_1'};
  assert.equal(canReadTable01092(personal,scope,'owner_1'),true);
  assert.equal(canReadTable01092(personal,scope,'user_2'),false);
  assert.equal(canWriteTable01092({...personal,permissionRole:'editor'},scope,'user_2'),true);
  assert.equal(canWriteTable01092({...personal,permissionRole:'viewer'},scope,'user_2'),false);
});
