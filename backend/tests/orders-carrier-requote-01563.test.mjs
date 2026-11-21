import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyQuoteDraft01563,quotePublic01563,getDraftRequote01563,refreshDraftRequote01563,assertRequoteLimit01563} from '../src/orders-carrier-requote-01563.mjs';
const draft='orderdraft_'+'a'.repeat(32),scope={storeId:'shop_1',accountId:'account_1',workspaceId:'ws_1',userId:'owner_1',role:'owner'};
const sender='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',city='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',warehouse='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const base={draft_id:draft,site_id:'site_1',recipient_city_ref:city,recipient_warehouse_ref:warehouse,cart_fingerprint:'finger1',review_cart_fingerprint:'finger1',packing_fingerprint:'finger2',review_packing_fingerprint:'finger2',subtotal_cents:298000,provisional_delivery_cents:31490,provisional_total_cents:329490,review_total_cents:329490,total_weight_grams:13500,number_of_packages:2,items:[{quantity:1}],packages:[{dimensionsCm:[50,50,15],weightGrams:8000},{dimensionsCm:[40,40,10],weightGrams:5500}]};
const profile={configured:true,enabled:true,senderCityRef:sender,senderCityName:'test',sampleParcelWeightKg:1,sampleSeats:1};
const ready={carrier_price_cents:32000,checked_at:'2026-10-24T10:00:00.000Z',expires_at:'2026-10-24T10:15:00.000Z',cart_fingerprint:'finger1',packing_fingerprint:'finger2',subtotal_cents:298000,recipient_city_ref:city,recipient_warehouse_ref:warehouse,total_weight_grams:13500,number_of_packages:2,old_shipping_cents:31490,sender_city_ref:sender};
function lookup(rows,{saved=null,record=[]}={}){return async callback=>callback({query:async(sql,args)=>{record.push({sql,args});if(sql.includes('shifttime_shipping_quote_profiles'))return {rows:[{sender_city_ref:sender,enabled:true}],rowCount:1};if(sql.includes('shifttime_order_carrier_quote_history_01563'))return {rows:[],rowCount:0};if(sql.includes('shifttime_order_carrier_quotes_01563'))return {rows:saved?[saved]:[],rowCount:saved?1:0};return {rows:[rows],rowCount:1};}});}
test('01563 refuses stale review, forged pack weights, corrupt sums and missing carrier refs',()=>{
 const valid=verifyQuoteDraft01563(base);assert.equal(valid.weightKg,13.5);assert.equal(valid.seats,2);
 for(const changed of [{review_cart_fingerprint:'evil'},{review_total_cents:111},{recipient_city_ref:'bad'},{total_weight_grams:14000},{number_of_packages:3},{packages:[]}])assert.throws(()=>verifyQuoteDraft01563({...base,...changed}),/ORDERS_REQUOTE_/);
});
test('01563 saved quote returns only indicative price, and expires safely',async()=>{
 const out=await getDraftRequote01563(scope,draft,{lookup:lookup(base,{saved:ready}),clock:()=>Date.parse('2026-10-24T10:05:00Z')});
 assert.equal(out.available,true);assert.equal(out.price,320);assert.equal(out.delta,5.1);assert.equal(out.canCreateOrder,false);assert.equal(out.final,false);
 assert.equal(out.estimatedTotal,3300);assert.deepEqual(out.history,[]);assert.equal(out.buyerConfirmed,false);assert.doesNotMatch(JSON.stringify(out),/apiKey|RecipientsPhone|ciphertext|recipient_city_ref/);
 const expired=await getDraftRequote01563(scope,draft,{lookup:lookup(base,{saved:ready}),clock:()=>Date.parse('2026-10-24T10:16:00Z')});assert.equal(expired.available,false);
 const stale=await getDraftRequote01563(scope,draft,{lookup:lookup(base,{saved:{...ready,recipient_warehouse_ref:city}}),clock:()=>Date.parse('2026-10-24T10:05:00Z')});assert.equal(stale.available,false);
});
test('01563 refresh uses trusted snapshot, provider-only server key and store-scoped transaction',async()=>{
 const calls=[],transaction=async callback=>callback({query:async(sql,args)=>{calls.push({sql,args});if(sql.includes('shifttime_shipping_quote_profiles'))return {rowCount:1,rows:[{sender_city_ref:sender,enabled:true}]};if(sql.includes('INSERT INTO shifttime_order_carrier_quotes_01563'))return {rowCount:1,rows:[ready]};return {rowCount:1,rows:[base]};}});
 let carrierParams;
 const out=await refreshDraftRequote01563(scope,draft,{lookup:lookup(base),transaction,getProfile:async()=>profile,quote:async(p,r)=>{carrierParams={p,r};return {provider:'nova-poshta',currency:'UAH',price:320,estimated:true,final:false,canPlaceOrder:false};},clock:()=>Date.parse('2026-10-24T10:01:00.000Z')});
 assert.equal(out.price,320);assert.equal(out.orderCreated,false);assert.equal(out.canCreateWaybill,false);assert.equal(out.canSyncCrm,false);
 assert.equal(carrierParams.p.sampleParcelWeightKg,13.5);assert.equal(carrierParams.p.sampleSeats,2);assert.equal(carrierParams.r.declaredValue,2980);assert.equal(carrierParams.r.warehouseRef,warehouse);
 assert.match(calls[0].sql,/d.account_id=\$3 AND d.workspace_id=\$4/);assert.match(calls[0].sql,/FOR UPDATE OF d, r/);assert.deepEqual(calls[0].args,[draft,'shop_1','account_1','ws_1']);assert.match(calls[2].sql,/ON CONFLICT\(draft_id\)/);assert.equal(calls[2].args[1],'shop_1');assert.equal(calls[2].args[6],32000);assert.equal(calls[2].args[12],sender);assert.match(calls[3].sql,/INSERT INTO shifttime_order_carrier_quote_history_01563/);
});
test('01563 authorization, fail-close provider and concurrent snapshot mutation',async()=>{
 for(const badRole of ['editor','viewer'])await assert.rejects(getDraftRequote01563({...scope,role:badRole},draft,{lookup:lookup(base)}),/FORBIDDEN/);
 await assert.rejects(getDraftRequote01563(scope,'bogus',{lookup:lookup(base)}),/DRAFT_INVALID/);
 await assert.rejects(getDraftRequote01563(scope,draft,{lookup:async cb=>cb({query:async()=>({rowCount:0,rows:[]})})}),/NOT_FOUND/);
 const common={lookup:lookup(base),getProfile:async()=>profile,clock:()=>Date.parse('2026-10-24T10:02:00Z')};
 await assert.rejects(refreshDraftRequote01563({...scope,userId:'unknown_quote_scope'},draft,{...common,quote:async()=>({provider:'fake',price:1,estimated:true,final:false,canPlaceOrder:false})}),/PROVIDER_INVALID/);
 await assert.rejects(refreshDraftRequote01563({...scope,userId:'change_quote_scope'},draft,{...common,quote:async()=>({provider:'nova-poshta',currency:'UAH',price:320,estimated:true,final:false,canPlaceOrder:false}),transaction:async cb=>cb({query:async sql=>({rowCount:1,rows:[sql.includes('shifttime_shipping_quote_profiles')?{sender_city_ref:sender,enabled:true}:{...base,cart_fingerprint:'changed',review_cart_fingerprint:'changed'}]})})}),/DRAFT_CHANGED/);
});
test('01563 per-user reprice limit protects the upstream provider',()=>{
 const now=Date.parse('2026-10-24T10:04:00Z');for(let n=0;n<6;n++)assert.doesNotThrow(()=>assertRequoteLimit01563('store-test-rate','user-test-rate',now));
 assert.throws(()=>assertRequoteLimit01563('store-test-rate','user-test-rate',now),/RATE_LIMIT/);
 assert.doesNotThrow(()=>assertRequoteLimit01563('store-test-rate','user-test-rate',now+60000));
});
