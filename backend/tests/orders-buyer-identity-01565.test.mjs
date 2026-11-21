import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {sealCheckoutContacts01555} from '../src/shipping-checkout-contacts-01555.mjs';
import {hashEmailCode01565,openBoundContactEmail01565,startBuyerEmailProof01565,verifyBuyerEmailProof01565,buyerEmailProofStatus01565,getManagerEmailProof01565} from '../src/orders-buyer-identity-01565.mjs';
const key=Buffer.alloc(32,41),now=Date.parse('2026-10-24T10:00:00Z'),draft='orderdraft_'+'a'.repeat(32),token='A'.repeat(43),uid='11111111-1111-4111-8111-111111111111',oid='22222222-2222-4222-8222-222222222222';
const sender='dddddddd-dddd-4ddd-8ddd-dddddddddddd',city='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',wh='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const sealed=sealCheckoutContacts01555({firstName:'Покупець',email:'buyer@example.org',phone:'+380991112233'}, {draftId:draft,siteId:'site1',storeId:'store1'},key);
const date=new Date(now-30_000).toISOString(),exp=new Date(now+8*60_000).toISOString();
const row={id:oid,draft_id:draft,site_id:'site1',store_id:'store1',accepted_at:date,revoked_at:null,expires_at:exp,offer_carrier_checked_at:date,carrier_checked_at:date,carrier_expires_at:exp,
 cart_fingerprint:'cart1',review_cart_fingerprint:'cart1',packing_fingerprint:'pack1',review_packing_fingerprint:'pack1',subtotal_cents:298000,draft_subtotal_cents:298000,provisional_delivery_cents:31490,provisional_total_cents:329490,review_total_cents:329490,
 total_weight_grams:13500,number_of_packages:2,draft_number_of_packages:2,items:[{title:'Сковорода',quantity:1,lineTotalCents:298000}],draft_items:[{title:'Сковорода',quantity:1,lineTotalCents:298000}],packages:[{weightGrams:8000,dimensionsCm:[50,50,15]},{weightGrams:5500,dimensionsCm:[40,40,10]}],
 carrier_price_cents:31490,delivery_cents:31490,total_cents:329490,quote_sender_city_ref:sender,active_sender_city_ref:sender,shipping_enabled:true,quote_cart_fingerprint:'cart1',quote_packing_fingerprint:'pack1',quote_old_shipping_cents:31490,quote_subtotal_cents:298000,quote_recipient_city_ref:city,quote_recipient_warehouse_ref:wh,recipient_city_ref:city,recipient_warehouse_ref:wh,quote_weight_grams:13500,quote_seats:2,workflow_status:'ready_for_manual_followup',contacts_current:true,
 identity_iv:sealed.iv,identity_ciphertext:sealed.data,identity_tag:sealed.tag};
const settings={notificationSmtpHost:'smtp.example.org',notificationEmailFrom:'noreply@example.org',notificationSmtpPort:587,notificationSmtpStartTls:true,notificationSmtpSecure:false};
function dbMock({rowValue=row,challenge=null}={}){const calls=[];return {calls,transaction:async fn=>fn({query:async(sql,args)=>{calls.push({sql,args});
 if(sql.includes('SELECT c.iv_b64')||sql.includes('WHERE o.token_hash=$1'))return {rows:[rowValue],rowCount:1};
 if(sql.includes('SELECT * FROM shifttime_order_buyer_email_challenges_01565'))return challenge?{rows:[challenge],rowCount:1}:{rows:[],rowCount:0};
 if(sql.includes('INSERT INTO shifttime_order_buyer_email_challenges_01565'))return {rows:[{id:uid,expires_at:exp,sent_at:date,send_count:1,attempt_count:0}],rowCount:1};
 if(sql.startsWith('UPDATE'))return {rows:[{...challenge,verified_at:date}],rowCount:1};
 return {rows:[],rowCount:0};}})};}
test('01565 decrypts only the server-bound contact email using draft/store/site AAD',()=>{
 assert.equal(openBoundContactEmail01565(row,key),'buyer@example.org');
 assert.throws(()=>openBoundContactEmail01565({...row,site_id:'wrong'},key));
 assert.throws(()=>openBoundContactEmail01565({...row,identity_ciphertext:Buffer.from('bad').toString('base64')},key));
});
test('01565 sends OTP only to encrypted address, persists only keyed hash, no order actions',async()=>{
 const mock=dbMock();let out={};const result=await startBuyerEmailProof01565(token,{transaction:mock.transaction,clock:()=>now,keyProvider:()=>key,newCode:()=> '123456',settings,sender:async(opts,email)=>{out={opts,email};return {ok:true};}});
 assert.equal(result.stage,'01565');assert.equal(result.canCreateOrder,false);assert.equal(out.email.to,'buyer@example.org');assert.match(out.email.text,/123456/);
 const save=mock.calls.find(x=>x.sql.includes('INSERT INTO shifttime_order_buyer_email_challenges_01565'));
 assert.ok(save);assert.equal(save.args[4],hashEmailCode01565(key,save.args[0],'123456'));assert.doesNotMatch(JSON.stringify(save.args),/123456|buyer@example.org/);
 assert.doesNotMatch(JSON.stringify(result),/123456|buyer@example.org|A{43}/);
});
test('01565 fails closed if SMTP unavailable, link invalid, offer unacknowledged, or missing email',async()=>{
 await assert.rejects(startBuyerEmailProof01565(token,{transaction:dbMock().transaction,settings:{},keyProvider:()=>key}),/SMTP_NOT_CONFIGURED/);
 await assert.rejects(startBuyerEmailProof01565('invalid',{transaction:dbMock().transaction,settings,keyProvider:()=>key}),/LINK_INVALID/);
 await assert.rejects(startBuyerEmailProof01565(token,{transaction:dbMock({rowValue:{...row,accepted_at:null}}).transaction,settings,keyProvider:()=>key}),/OFFER_INVALID/);
 const bad=sealCheckoutContacts01555({firstName:'a',email:'',phone:'+380991112233'}, {draftId:draft,siteId:'site1',storeId:'store1'},key);
 await assert.rejects(startBuyerEmailProof01565(token,{transaction:dbMock({rowValue:{...row,identity_iv:bad.iv,identity_ciphertext:bad.data,identity_tag:bad.tag}}).transaction,settings,keyProvider:()=>key,clock:()=>now}),/EMAIL_REQUIRED/);
});
test('01565 incorrect code counts an attempt and commits before raising error; correct code marks proof',async()=>{
 const challenge={id:uid,offer_id:oid,code_hash:hashEmailCode01565(key,uid,'123456'),attempt_count:0,send_count:1,created_at:date,sent_at:date,expires_at:exp,verified_at:null};
 const wrong=dbMock({challenge});await assert.rejects(verifyBuyerEmailProof01565(token,'111111',{transaction:wrong.transaction,clock:()=>now,keyProvider:()=>key}),/CODE_INCORRECT/);
 assert.ok(wrong.calls.find(x=>x.sql.includes('attempt_count=attempt_count+1')));
 const right=dbMock({challenge});const result=await verifyBuyerEmailProof01565(token,'123456',{transaction:right.transaction,clock:()=>now,keyProvider:()=>key});assert.equal(result.verified,true);assert.equal(result.canCreateOrder,false);
});
test('01565 resend cooldown, 3-email maximum and five-attempt lock are enforced in DB',async()=>{
 const challenge={id:uid,offer_id:oid,code_hash:hashEmailCode01565(key,uid,'123456'),attempt_count:5,send_count:3,created_at:date,sent_at:date,expires_at:exp,verified_at:null};
 await assert.rejects(startBuyerEmailProof01565(token,{transaction:dbMock({challenge}).transaction,clock:()=>now,settings,keyProvider:()=>key}),/SEND_LIMIT/);
 await assert.rejects(verifyBuyerEmailProof01565(token,'123456',{transaction:dbMock({challenge}).transaction,clock:()=>now,keyProvider:()=>key}),/ATTEMPTS_EXCEEDED/);
 const c={...challenge,send_count:1,attempt_count:0};await assert.rejects(startBuyerEmailProof01565(token,{transaction:dbMock({challenge:c}).transaction,clock:()=>now,settings,keyProvider:()=>key}),/COOLDOWN/);
});
test('01565 manager status is isolated by store/account/workspace and reveals no email',async()=>{
 const scope={storeId:'store1',accountId:'acct1',workspaceId:'w1',userId:'u1',role:'owner'},calls=[];
 const result=await getManagerEmailProof01565(scope,draft,{lookup:async cb=>cb({query:async(sql,args)=>{calls.push({sql,args});return {rowCount:1,rows:[{id:oid,accepted_at:date,revoked_at:null,verified_at:date,expires_at:exp}]};}})});
 assert.equal(result.verified,true);assert.equal(result.canCreateOrder,false);assert.deepEqual(calls[0].args,[draft,'store1','acct1','w1']);assert.doesNotMatch(JSON.stringify(result),/buyer@example.org/);
 await assert.rejects(getManagerEmailProof01565({...scope,role:'viewer'},draft),/FORBIDDEN/);
});
