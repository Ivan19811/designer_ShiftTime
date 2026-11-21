import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeDatabaseTableName01087,
  redactDatabaseColumns01087,
  resolveRowScopeStrategy01087,
} from '../src/database-explorer-helpers-01087.mjs';

test('database table names accept simple public identifiers only',()=>{
  assert.equal(normalizeDatabaseTableName01087('platform_users'),'platform_users');
  assert.throws(()=>normalizeDatabaseTableName01087('users;drop table x'),/table/i);
  assert.throws(()=>normalizeDatabaseTableName01087('public.users'),/table/i);
});

test('sensitive hashes and large snapshot payloads are redacted from row browsing',()=>{
  const cols=['id','email','secret_hash','token_hash','snapshot','payload','created_at'];
  assert.deepEqual(redactDatabaseColumns01087('platform_users',cols),['id','email','created_at']);
});

test('platform_user_credentials is metadata-only',()=>{
  assert.deepEqual(resolveRowScopeStrategy01087('platform_user_credentials',['id','user_id','secret_hash']),{mode:'metadata-only',column:''});
});

test('row scope prefers account, then store, then workspace',()=>{
  assert.deepEqual(resolveRowScopeStrategy01087('x',['id','account_id','store_id']),{mode:'account',column:'account_id'});
  assert.deepEqual(resolveRowScopeStrategy01087('x',['id','store_id']),{mode:'store',column:'store_id'});
  assert.deepEqual(resolveRowScopeStrategy01087('x',['id','workspace_id']),{mode:'workspace',column:'workspace_id'});
});

test('migration journal is global-safe read-only metadata',()=>{
  assert.deepEqual(resolveRowScopeStrategy01087('shifttime_schema_migrations',['filename']),{mode:'global-safe',column:''});
});
