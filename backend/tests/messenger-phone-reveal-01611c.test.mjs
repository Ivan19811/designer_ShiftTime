import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canRevealMessengerPhone01611C} from '../src/messenger-phone-access-core-01611c.mjs';
const scope=(role)=>({storeId:'store-one',role});
test('owner/admin may reveal only after their authenticated session and server scope',()=>{
  assert.equal(canRevealMessengerPhone01611C(scope('owner'),'user-a',''),true);
  assert.equal(canRevealMessengerPhone01611C(scope('admin'),'user-a','other'),true);
  assert.equal(canRevealMessengerPhone01611C(scope('admin'),'',''),false);
  assert.equal(canRevealMessengerPhone01611C({role:'owner'},'user-a',''),false);
});
test('assigned managers may reveal, but arbitrary employees and unassigned managers cannot',()=>{
  assert.equal(canRevealMessengerPhone01611C(scope('manager'),'user-a','user-a'),true);
  assert.equal(canRevealMessengerPhone01611C(scope('order-manager'),'user-a','user-a'),true);
  assert.equal(canRevealMessengerPhone01611C(scope('editor'),'user-a','user-a'),true);
  assert.equal(canRevealMessengerPhone01611C(scope('manager'),'user-a','user-b'),false);
  assert.equal(canRevealMessengerPhone01611C(scope('manager'),'user-a',''),false);
  assert.equal(canRevealMessengerPhone01611C(scope('viewer'),'user-a','user-a'),false);
});
test('sensitive endpoint uses explicit verified consent, tenant scope, audit and rate limit',()=>{
  const service=readFileSync(new URL('../src/messenger-contact-reveal-01611c.mjs',import.meta.url),'utf8');
  assert.match(service,/vc\.consent_fallback=TRUE/);
  assert.match(service,/vc\.account_id=\$3 AND vc\.workspace_id=\$4/);
  assert.match(service,/contact\.visitor_hash=vc\.visitor_hash/);
  assert.match(service,/phone_sealed/);
  assert.match(service,/shifttime_messenger_phone_reveal_audit_01611c/);
  assert.match(service,/interval '5 minutes'/);
  assert.doesNotMatch(service,/console\.(log|info|debug)\(/);
  const router=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(router,/p\[6\]==='reveal-phone'/);
  assert.match(router,/cache-control':'private, no-store/);
});
test('frontend never persists unmasked phone, only displays after authorized reveal',()=>{
  const ui=readFileSync(new URL('../../js/messenger/messenger-center-01610.js',import.meta.url),'utf8');
  assert.match(ui,/revealMessengerContactPhone01611C/);
  assert.match(ui,/this\.clearPhone01611C\(\)/);
  assert.match(ui,/45000/);
  assert.match(ui,/visibilitychange/);
  assert.doesNotMatch(ui,/(localStorage|sessionStorage)\.setItem\([^)]*phone/i);
});
