import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeAccountProfile01579,getAccountProfile01579} from '../src/auth-profile-service-01579.mjs';
test('01579 registration does not imply email proof',()=>{
 const profile=normalizeAccountProfile01579({id:'1',name:'O',email:'o@example.com',created_at:'2026-10-24'});
 assert.equal(profile.emailVerified,false);assert.equal(profile.phoneVerified,false);assert.equal(profile.phone,'');
});
test('01579 server proof requires a contact and a timestamp',()=>{
 const profile=normalizeAccountProfile01579({id:'1',email:'o@example.com',email_verified_at:'2026-10-24',phone_e164:'+380900000000',phone_verified_at:null});
 assert.equal(profile.emailVerified,true);assert.equal(profile.phoneVerified,false);
});
test('01579 query gets only the signed-in user row',async()=>{
 let params=[];const out=await getAccountProfile01579({userId:'u1'},{query:async(sql,p)=>{params=p;assert.match(sql,/WHERE id=\$1 AND status='active'/);return {rows:[{id:'u1',name:'N',email:'n@e.test'}]};}});
 assert.deepEqual(params,['u1']);assert.equal(out.id,'u1');
});
test('01579 prevents anonymous profile queries',async()=>{await assert.rejects(getAccountProfile01579({},{}),/AUTH_REQUIRED_01579/);});
test('01579 private endpoint uses auth middleware and disables caching',()=>{
 const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.ok(server.indexOf('const session=await authenticateRequest(req);') < server.indexOf('await getAccountProfile01579(session)'));
 assert.match(server,/profile:await getAccountProfile01579\(session\).*'cache-control':'private, no-store'/);
});
