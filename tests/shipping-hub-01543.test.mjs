import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {verifyCrmBridgeToken01543,encryptStoreCarrierKey01543,decryptStoreCarrierKey01543,shippingEncryptionKey01543} from '../src/shipping-hub-01543.mjs';
const encryptionKey=crypto.randomBytes(32),secret='test-key-will-not-leak-0123456789';
test('01543 CRM bridge requires 32+ character exact server secret',()=>{
  const right=crypto.randomBytes(32).toString('hex');
  assert.equal(verifyCrmBridgeToken01543(right,right),true);
  assert.equal(verifyCrmBridgeToken01543('bad',right),false);
  assert.equal(verifyCrmBridgeToken01543('short','short'),false);
  assert.equal(verifyCrmBridgeToken01543('',right),false);
});
test('01543 AES-GCM store keys are encrypted, scoped and authenticated',()=>{
  const v=encryptStoreCarrierKey01543(secret,'store-a',{encryptionKey});
  assert.ok(v.startsWith('v1.'));
  assert.ok(!v.includes(secret));
  assert.equal(decryptStoreCarrierKey01543(v,'store-a',{encryptionKey}),secret);
  assert.throws(()=>decryptStoreCarrierKey01543(v,'store-b',{encryptionKey}));
  assert.throws(()=>decryptStoreCarrierKey01543(v,'store-a',{encryptionKey:crypto.randomBytes(32)}));
  assert.notEqual(v,encryptStoreCarrierKey01543(secret,'store-a',{encryptionKey}));
  assert.throws(()=>shippingEncryptionKey01543('not-a-base64-key'),/SHIPPING_ENCRYPTION_NOT_CONFIGURED/);
});
test('01543 authenticated, CRM and scoped public routes exist; TTN not falsely enabled',()=>{
  const code=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(code,/PUBLISHED_SITE_IDENTITY_REQUIRED_01543/);
  assert.match(code,/verifyCrmBridgeToken01543/);
  assert.match(code,/SHIPPING_BRIDGE_READ_ONLY_01543/);
  assert.match(code,/getStoreShippingConnection01543/);
  assert.match(code,/assertAdminRole\(scope\)/);
  const sql=readFileSync(new URL('../sql/043_shipping_hub_connections_01543.sql',import.meta.url),'utf8');
  assert.match(sql,/PRIMARY KEY\(store_id,provider\)/);
  assert.match(sql,/REFERENCES platform_stores\(id\)/);
  const hub=readFileSync(new URL('../src/shipping-hub-01543.mjs',import.meta.url),'utf8');
  assert.match(hub,/ttn:false,priceQuote:false/);
});
