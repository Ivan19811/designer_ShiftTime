import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateDraftReview01556,prepareDraftReview01556,reviewResponse01556} from '../src/shipping-checkout-review-01556.mjs';
const draftId='orderdraft_'+'a'.repeat(32),siteId='site_testing',scope={storeId:'store_a',userId:'user_a',accountId:'account_a',workspaceId:'workspace_a'};
const draft={id:draftId,site_id:siteId,cart_id:'cart_'+'a'.repeat(24),state:'draft',store_id:scope.storeId,request_hash:'r',cart_fingerprint:'c',packing_fingerprint:'p',packing_revision:3,recipient_city_ref:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',recipient_warehouse_ref:'ffffffff-1111-2222-3333-444444444444',number_of_packages:2,subtotal_cents:298000,provisional_delivery_cents:31490,provisional_total_cents:329490,total_weight_grams:13500,items:[{itemId:'first'}],created_at:new Date().toISOString()};
const options=(settings={})=>{
 const queries=[],row={draft_id:draftId,created_at:new Date().toISOString()};let review=settings.review||null;
 const client={async query(sql,args){queries.push({sql,args});
   if(sql.includes('FROM shifttime_checkout_drafts_01554'))return {rowCount:settings.noDraft?0:1,rows:[settings.draft||draft]};
   if(sql.includes('FROM shifttime_checkout_contacts_01555'))return {rowCount:settings.noContacts?0:1,rows:[{draft_id:draftId}]};
   if(sql.startsWith('SELECT * FROM shifttime_checkout_review_queue_01556'))return {rowCount:review?1:0,rows:review?[review]:[]};
   if(sql.startsWith('INSERT INTO shifttime_checkout_review_queue_01556')){review=row;return {rowCount:1,rows:[row]};}
   return {rowCount:1,rows:[]};
 }};
 return {queries,config:{transaction:fn=>fn(client),preflight:async()=>settings.preflight||{preflightPassed:true,canPlaceOrder:false,shippingCost:314.9,subtotal:2980,estimatedTotal:3294.9,_draftContext:{fake:true}},snapshot:async(_db,_scope,input)=>{settings.onSnapshot?.(input);return settings.items||draft.items;}}};
};
const payload={draftId,siteId,acknowledgeProvisional:true};
test('01556 strict API input and explicit acknowledgment',()=>{
 assert.deepEqual(validateDraftReview01556(payload),{draftId,siteId});
 for(const x of [{...payload,acknowledgeProvisional:false},{...payload,phone:'pii'},{...payload,siteId:'../site'},{...payload,draftId:'invalid'}])assert.throws(()=>validateDraftReview01556(x));
});
test('01556 creates disabled, PII-free CRM staging outbox after a server preflight',async()=>{
 const {config,queries}=options();const r=await prepareDraftReview01556(scope,payload,config);
 assert.equal(r.state,'awaiting_manual_review');assert.equal(r.crmDeliveryEnabled,false);assert.equal(r.canPlaceOrder,false);assert.equal(r.canPay,false);assert.equal(r.priceProvisional,true);
 const out=queries.find(q=>q.sql.startsWith('INSERT INTO shifttime_checkout_crm_outbox_01556'));assert.ok(out);assert.equal(out.args[3].includes('draftId'),true);assert.equal(out.sql.includes("'disabled'"),true);
 assert.ok(!JSON.stringify(r).includes('phone'));assert.match(queries.filter(q=>q.sql.includes('FROM shifttime_checkout_drafts_01554'))[1].sql,/FOR UPDATE/);
});
test('01556 idempotent prepared review does not duplicate outbox',async()=>{
 const prepared={draft_id:draftId,created_at:new Date().toISOString()},o=options({review:prepared});const r=await prepareDraftReview01556(scope,payload,o.config);
 assert.equal(r.replayed,true);assert.ok(!o.queries.some(x=>x.sql.includes('INSERT INTO shifttime_checkout_crm_outbox_01556')));
});
test('01556 refuses missing contacts, tenant, stale draft and changed shipping amounts',async()=>{
 await assert.rejects(()=>prepareDraftReview01556({},payload,options().config),{code:'NP_REVIEW_SCOPE_REQUIRED_01556'});
 await assert.rejects(()=>prepareDraftReview01556(scope,payload,options({noDraft:true}).config),{code:'NP_REVIEW_DRAFT_NOT_FOUND_01556'});
 await assert.rejects(()=>prepareDraftReview01556(scope,payload,options({noContacts:true}).config),{code:'NP_REVIEW_CONTACTS_REQUIRED_01556'});
 const stale={...draft,created_at:new Date(Date.now()-1000*60*60*25).toISOString()};
 await assert.rejects(()=>prepareDraftReview01556(scope,payload,options({draft:stale}).config),{code:'NP_REVIEW_DRAFT_EXPIRED_01556'});
 await assert.rejects(()=>prepareDraftReview01556(scope,payload,options({preflight:{preflightPassed:true,shippingCost:315,subtotal:2980,estimatedTotal:3295,canPlaceOrder:false,_draftContext:{fake:true}}}).config),{code:'NP_REVIEW_PRICE_OR_CART_CHANGED_01556'});
 await assert.rejects(()=>prepareDraftReview01556(scope,payload,options({items:[{itemId:'other'}]}).config),{code:'NP_REVIEW_PRICE_OR_CART_CHANGED_01556'});
});
test('01556 migration route, user-scoped manual review and consent deletion',()=>{
 const sql=readFileSync(new URL('../sql/049_checkout_review_queue_01556.sql',import.meta.url),'utf8');
 const server=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const contacts=readFileSync(new URL('../src/shipping-checkout-contacts-01555.mjs',import.meta.url),'utf8');
 assert.match(sql,/delivery_state text NOT NULL DEFAULT 'disabled' CHECK\(delivery_state='disabled'\)/);
 assert.doesNotMatch(sql,/email\s+text|phone\s+text|first_name\s+text/i);
 assert.match(server,/prepareDraftReview01556\(scope,input\)/);assert.match(server,/assertOrderWriteRole\(scope\)/);
 assert.match(contacts,/DELETE FROM shifttime_checkout_review_queue_01556/);
 assert.match(sql,/REFERENCES shifttime_checkout_drafts_01554\(id\) ON DELETE CASCADE/);
});

// 01557 regression: what previously failed in production after successful 01555 contacts binding.
test('01557 passes normalized declared-value cents into locked snapshot',async()=>{
 let seen=null;
 const o=options({onSnapshot:p=>{seen=p;}});
 const result=await prepareDraftReview01556(scope,payload,o.config);
 assert.equal(result.state,'awaiting_manual_review');
 assert.equal(seen.expectedDeclaredCents,298000);
 assert.equal(seen.expectedPriceCents,31490);
 assert.equal(seen.expectedPackingRevision,3);
 assert.equal(seen.expectedPlaces,2);
});
test('01557 PostgreSQL JSONB key-order normalization still rejects actual cart/price edits',async()=>{
 const base={itemId:'first',quantity:1,unitPriceCents:298000,meta:{b:1,a:2}};
 const stored={meta:{a:2,b:1},unitPriceCents:298000,quantity:1,itemId:'first'};
 const withItems={...draft,items:[stored]};
 const ok=options({draft:withItems,items:[base]});
 assert.equal((await prepareDraftReview01556(scope,payload,ok.config)).state,'awaiting_manual_review');
 const wrong=options({draft:withItems,items:[{...base,quantity:2}]});
 await assert.rejects(()=>prepareDraftReview01556(scope,payload,wrong.config),{code:'NP_REVIEW_PRICE_OR_CART_CHANGED_01556'});
});
