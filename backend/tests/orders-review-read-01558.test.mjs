import test from 'node:test';import assert from 'node:assert/strict';
import {parseReviewList01558,listReviewOrders01558,safeReviewRow01558} from '../src/orders-review-read-01558.mjs';
const scope={userId:'user-a',storeId:'store-a',workspaceId:'workspace-a',accountId:'account-a'};
test('01558 query accepts only safe bounded read filters',()=>{
 assert.deepEqual(parseReviewList01558(new URLSearchParams('siteId=site_1&limit=15&offset=2')),{siteId:'site_1',limit:15,offset:2,search:'',status:'',priority:'',assigneeId:''});
 for(const x of ['limit=100','offset=-2','siteId=site_1%27%3BDROP','unknown=hello','limit=x'])assert.throws(()=>parseReviewList01558(new URLSearchParams(x)));
});
test('01558 projects strictly non-PII internal order data',()=>{
 const r=safeReviewRow01558({draft_id:'draft',site_id:'site',prepared_at:new Date(),draft_created_at:new Date(),subtotal_cents:1000,provisional_delivery_cents:100,provisional_total_cents:1100,total_weight_grams:2000,number_of_packages:1,recipient_city_ref:'city',recipient_warehouse_ref:'warehouse',contacts_encrypted:true,items:[{title:'pan',lineTotalCents:1000,phone:'secret'}],packages:[],email:'secret',encrypted_payload:'secret'});
 assert.equal(r.previewOnly,true);assert.equal(r.items[0].title,'pan');assert.equal(r.contactsEncrypted,true);assert.equal(r.orderCreated,false);assert.equal(JSON.stringify(r).includes('secret'),false);
});
test('01558 SQL is store/account/workspace scoped, paginated, and never selects ciphertext',async()=>{
 const calls=[];const lookup=async run=>run({query:async(sql,args)=>{calls.push({sql,args});return calls.length===1?{rows:[{site_id:'site-1'}]}:calls.length===2?{rows:[{total:1}]}:{rows:[{draft_id:'orderdraft_a',site_id:'site-1',prepared_at:'2026-10-22',draft_created_at:'2026-10-22',subtotal_cents:100,provisional_delivery_cents:20,provisional_total_cents:120,total_weight_grams:1000,number_of_packages:1,items:[],packages:[]}]};}});
 const result=await listReviewOrders01558(scope,new URLSearchParams('siteId=site-1&limit=10&offset=0'),{lookup});
 assert.equal(result.total,1);assert.equal(result.items.length,1);assert.equal(result.readOnly,true);
 assert.equal(calls.length,3);assert.deepEqual(result.sites,['site-1']);for(const call of calls){assert.deepEqual(call.args.slice(0,3),['store-a','account-a','workspace-a']);assert.match(call.sql,/r.store_id=\$1/);assert.match(call.sql,/d.account_id=\$2/);assert.match(call.sql,/d.workspace_id=\$3/);assert.doesNotMatch(call.sql,/ciphertext|nonce|encrypted_payload/i);}
 assert.deepEqual(calls[2].args.slice(-2),[10,0]);
});
test('01558 refuses missing authenticated scope',async()=>{await assert.rejects(()=>listReviewOrders01558({},{}),/ORDERS_SCOPE_REQUIRED_01558/);});
