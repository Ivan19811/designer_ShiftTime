import test from 'node:test';
import assert from 'node:assert/strict';
import {createDecipheriv,randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateCheckoutContacts01555,contactEncryptionKey01555,sealCheckoutContacts01555,bindCheckoutContacts01555,eraseCheckoutContacts01555} from '../src/shipping-checkout-contacts-01555.mjs';
const draftId='orderdraft_'+'f'.repeat(32),siteId='site_hello';
const key=randomBytes(32),scope={storeId:'store_1',workspaceId:'ws_1',accountId:'acc_1',userId:'user_1'};
const input={draftId,siteId,firstName:'Example Person',phone:'+380 67 000 00 00',email:'example@example.test',comment:'Testing only',confirmed:true};
const owned={id:draftId,site_id:siteId,cart_id:'cart_one',state:'draft',created_at:new Date().toISOString()};
const ownQueries=[];
function client(rows=ownQueries){return {async query(sql,args){rows.push({sql,args});if(sql.includes('FROM shifttime_checkout_drafts_01554'))return {rowCount:1,rows:[owned]};if(sql.startsWith('SELECT contacts_digest'))return {rowCount:0,rows:[]};if(sql.includes('DELETE FROM shifttime_checkout_contacts_01555'))return {rowCount:1,rows:[]};return {rowCount:1,rows:[]};}};}
const options={keyProvider:()=>key,transaction:fn=>fn(client())};
test('01555 accepts explicit consent, validates typed bounded fields, rejects unknown data',()=>{
 assert.deepEqual(validateCheckoutContacts01555(input).contacts,{firstName:input.firstName,phone:input.phone,email:input.email,comment:input.comment});
 for(const invalid of [{...input,confirmed:false},{...input,firstName:'x'},{...input,phone:'x'},{...input,apiKey:'oops'},{...input,comment:{text:'secret'}},{...input,siteId:'../ab'}])assert.throws(()=>validateCheckoutContacts01555(invalid));
});
test('01555 key is required and is exactly 32 random bytes',()=>{
 assert.throws(()=>contactEncryptionKey01555({}),{code:'NP_CONTACT_KEY_NOT_CONFIGURED_01555'});
 assert.throws(()=>contactEncryptionKey01555({SHIFTTIME_CHECKOUT_PII_KEY:'123'}));
 assert.equal(contactEncryptionKey01555({SHIFTTIME_CHECKOUT_PII_KEY:key.toString('hex')}).length,32);
});
test('01555 encrypts PII with unique IV, authenticated tag and tenant-specific AAD',()=>{
 const v=validateCheckoutContacts01555(input).contacts,ctx={storeId:scope.storeId,siteId,draftId};
 const a=sealCheckoutContacts01555(v,ctx,key),b=sealCheckoutContacts01555(v,ctx,key);
 assert.notEqual(a.iv,b.iv);assert.notEqual(a.data,b.data);assert.equal(a.digest,b.digest);
 assert.ok(!JSON.stringify(a).includes(input.phone));
 const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(a.iv,'base64'));decipher.setAAD(Buffer.from([scope.storeId,siteId,draftId].join(':')));decipher.setAuthTag(Buffer.from(a.tag,'base64'));
 assert.deepEqual(JSON.parse(Buffer.concat([decipher.update(Buffer.from(a.data,'base64')),decipher.final()]).toString()),v);
 const bad=createDecipheriv('aes-256-gcm',key,Buffer.from(a.iv,'base64'));bad.setAAD(Buffer.from(['another_store',siteId,draftId].join(':')));bad.setAuthTag(Buffer.from(a.tag,'base64'));
 assert.throws(()=>Buffer.concat([bad.update(Buffer.from(a.data,'base64')),bad.final()]));
});
test('01555 saves only ciphertext and returns no contacts',async()=>{
 ownQueries.length=0;const result=await bindCheckoutContacts01555(scope,input,options);
 assert.equal(result.contactState,'bound');assert.equal(result.canPlaceOrder,false);assert.equal(result.crmSynced,false);
 assert.ok(!JSON.stringify(result).includes(input.phone));assert.equal(result.draftId,draftId);
 const insert=ownQueries.find(q=>q.sql.includes('INSERT INTO shifttime_checkout_contacts_01555'));
 assert.ok(insert);assert.ok(!JSON.stringify(insert).includes(input.phone));assert.ok(!JSON.stringify(insert).includes(input.email));
 assert.match(ownQueries[0].sql,/created_by_user_id=\$5/);
});
test('01555 repeated identical contact submission is idempotent and edits rejected',async()=>{
 let digest='';const queries=[];
 const db={async query(sql,args){queries.push({sql,args});if(sql.includes('FROM shifttime_checkout_drafts_01554'))return {rowCount:1,rows:[owned]};if(sql.startsWith('SELECT contacts_digest'))return digest?{rowCount:1,rows:[{contacts_digest:digest}]}:{rowCount:0,rows:[]};if(sql.includes('INSERT INTO'))digest=args[7];return {rowCount:1,rows:[]};}};
 const setup={keyProvider:()=>key,transaction:fn=>fn(db)};
 await bindCheckoutContacts01555(scope,input,setup);
 const again=await bindCheckoutContacts01555(scope,input,setup);assert.equal(again.replayed,true);
 await assert.rejects(()=>bindCheckoutContacts01555(scope,{...input,phone:'+380 66 111 11 11'},setup),{code:'NP_CONTACT_ALREADY_BOUND_01555'});
 assert.equal(queries.filter(x=>x.sql.includes('INSERT INTO')).length,1);
});
test('01555 refuses missing ownership, non-draft states and expired drafts',async()=>{
 await assert.rejects(()=>bindCheckoutContacts01555({},input,options),{code:'NP_CONTACT_SCOPE_REQUIRED_01555'});
 await assert.rejects(()=>bindCheckoutContacts01555(scope,input,{...options,transaction:fn=>fn({query:async()=>({rowCount:0,rows:[]})})}),{code:'NP_CONTACT_DRAFT_NOT_FOUND_01555'});
 const expired={...owned,created_at:new Date(Date.now()-2*86400000).toISOString()};
 await assert.rejects(()=>bindCheckoutContacts01555(scope,input,{...options,transaction:fn=>fn({query:async()=>({rowCount:1,rows:[expired]})})}),{code:'NP_CONTACT_DRAFT_EXPIRED_01555'});
});
test('01555 can delete encrypted contacts with matching owner scope',async()=>{
 const r=await eraseCheckoutContacts01555(scope,{draftId,siteId},{transaction:fn=>fn(client([]))});
 assert.equal(r.contactState,'not_bound');assert.equal(r.erased,true);
});
test('01555 migration and route protect private contacts and no payment/order side effects',()=>{
 const sql=readFileSync(new URL('../sql/048_checkout_contacts_encrypted_01555.sql',import.meta.url),'utf8');
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 assert.match(sql,/REFERENCES shifttime_checkout_drafts_01554\(id\) ON DELETE CASCADE/);
 assert.doesNotMatch(sql,/phone\s+text|first_name\s+text|email\s+text/i);
 assert.match(server,/assertOrderWriteRole\(scope\);\s*if\(!\/\^orderdraft_/);
 assert.match(server,/bindCheckoutContacts01555\(scope,input\)/);
});
