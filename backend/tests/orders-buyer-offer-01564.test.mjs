import test from 'node:test';import assert from 'node:assert/strict';
import {createBuyerOffer01564,getBuyerOfferStatus01564,previewBuyerOffer01564,acknowledgeBuyerOffer01564,enforceOfferRate01564} from '../src/orders-buyer-offer-01564.mjs';
const scope={storeId:'store1',accountId:'account1',workspaceId:'workspace1',userId:'manager1',role:'owner'};
const draft='orderdraft_'+'a'.repeat(32),city='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',warehouse='cccccccc-cccc-4ccc-8ccc-cccccccccccc',sender='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const now=Date.parse('2026-10-24T10:00:00.000Z'),checked=new Date(now-60_000).toISOString(),expires=new Date(now+10*60_000).toISOString();
const token='A'.repeat(43);
const input={draft_id:draft,site_id:'site1',store_id:'store1',recipient_city_ref:city,recipient_warehouse_ref:warehouse,cart_fingerprint:'cart1',review_cart_fingerprint:'cart1',packing_fingerprint:'pack1',review_packing_fingerprint:'pack1',subtotal_cents:298000,provisional_delivery_cents:31490,provisional_total_cents:329490,review_total_cents:329490,total_weight_grams:13500,number_of_packages:2,items:[{title:'Сковорода',quantity:1,lineTotalCents:298000}],packages:[{weightGrams:8000,dimensionsCm:[50,50,15]},{weightGrams:5500,dimensionsCm:[40,40,10]}],carrier_price_cents:31490,carrier_checked_at:checked,carrier_expires_at:expires,quote_sender_city_ref:sender,active_sender_city_ref:sender,shipping_enabled:true,quote_cart_fingerprint:'cart1',quote_packing_fingerprint:'pack1',quote_old_shipping_cents:31490,quote_subtotal_cents:298000,quote_recipient_city_ref:city,quote_recipient_warehouse_ref:warehouse,quote_weight_grams:13500,quote_seats:2,workflow_status:'ready_for_manual_followup',contacts_current:true};
const offer={id:'00000000-0000-4000-8000-000000000001',draft_id:draft,store_id:'store1',site_id:'site1',cart_fingerprint:'cart1',packing_fingerprint:'pack1',subtotal_cents:298000,delivery_cents:31490,total_cents:329490,number_of_packages:2,carrier_checked_at:checked,offer_carrier_checked_at:checked,expires_at:expires,accepted_at:null,revoked_at:null,items:[{title:'Сковорода',quantity:1,lineTotal:2980}]};
const queryRow=(row,calls=[])=>async cb=>cb({query:async(sql,args)=>{calls.push({sql,args});if(sql.startsWith('UPDATE')||sql.startsWith('INSERT'))return {rows:[row],rowCount:1};return {rows:[row],rowCount:1};}});
test('01564 creates a token only for the authenticated store, persists its digest, and never creates an order',async()=>{
 const calls=[];const result=await createBuyerOffer01564(scope,draft,{transaction:queryRow(input,calls),clock:()=>now,newToken:()=>token});
 assert.equal(result.token,token);assert.equal(result.total,3294.9);assert.equal(result.canCreateOrder,false);
 assert.equal(calls.length,3);assert.match(calls[0].sql,/d.account_id=\$3 AND d.workspace_id=\$4/);assert.match(calls[0].sql,/FOR UPDATE OF d,r,q/);
 assert.match(calls[2].sql,/INSERT INTO shifttime_order_buyer_offers_01564/);assert.equal(calls[2].args[4].length,64);assert.notEqual(calls[2].args[4],token);assert.equal(calls[2].args[2],'store1');assert.equal(calls[2].args[10],329490);
 assert.doesNotMatch(calls.map(x=>x.sql).join(' '),/INSERT INTO orders\s*\(/i);
});
test('01564 status does not leak the bearer token',async()=>{
 const data=await getBuyerOfferStatus01564(scope,draft,{lookup:queryRow(offer)});assert.equal(data.available,true);assert.equal(data.offer.total,3294.9);assert.equal(data.canCreateOrder,false);assert.doesNotMatch(JSON.stringify(data),new RegExp(token));
 const revoked=await getBuyerOfferStatus01564(scope,draft,{lookup:queryRow({...offer,accepted_at:checked,revoked_at:checked})});assert.equal(revoked.offer.status,'revoked');
});
test('01564 buyer may preview exact offer and acknowledge explicitly, once',async()=>{
 const rows={...input,...offer,draft_subtotal_cents:298000,draft_number_of_packages:2,draft_items:input.items,offer_carrier_checked_at:checked};
 const preview=await previewBuyerOffer01564(token,{lookup:queryRow(rows),clock:()=>now});assert.equal(preview.items[0].lineTotal,2980);assert.equal(preview.status,'awaiting_acknowledgement');assert.equal(preview.canCreateOrder,false);
 await assert.rejects(acknowledgeBuyerOffer01564(token,false,{transaction:queryRow(rows),clock:()=>now}),/EXPLICIT_ACK_REQUIRED/);
 const updated={...rows,accepted_at:new Date(now).toISOString()};const calls=[];
 const transaction=async cb=>cb({query:async(sql,args)=>{calls.push({sql,args});return {rows:[sql.startsWith('UPDATE')?updated:rows],rowCount:1};}});
 const result=await acknowledgeBuyerOffer01564(token,true,{transaction,clock:()=>now});assert.equal(result.status,'acknowledged');assert.equal(result.orderCreated,false);assert.equal(result.identityVerified,false);assert.equal(calls.length,2);
 const again=await acknowledgeBuyerOffer01564(token,true,{transaction:queryRow(updated),clock:()=>now});assert.equal(again.alreadyAcknowledged,true);
});
test('01564 rejects absent permissions, missing manager readiness, expired quote, or shifted price',async()=>{
 await assert.rejects(createBuyerOffer01564({...scope,role:'viewer'},draft,{transaction:queryRow(input),clock:()=>now}),/ACCESS_DENIED/);
 await assert.rejects(createBuyerOffer01564(scope,draft,{transaction:queryRow({...input,workflow_status:'in_review'}),clock:()=>now}),/MANAGER_STATUS/);
 await assert.rejects(createBuyerOffer01564(scope,draft,{transaction:queryRow({...input,carrier_expires_at:new Date(now).toISOString()}),clock:()=>now}),/QUOTE_EXPIRED/);
 const r={...input,...offer,draft_subtotal_cents:298000,draft_number_of_packages:2,draft_items:input.items,offer_carrier_checked_at:checked,carrier_price_cents:40000};
 await assert.rejects(previewBuyerOffer01564(token,{lookup:queryRow(r),clock:()=>now}),/SOURCE_CHANGED/);
 await assert.rejects(previewBuyerOffer01564('bad',{lookup:queryRow(r),clock:()=>now}),/LINK_INVALID/);
 await assert.rejects(previewBuyerOffer01564(token,{lookup:queryRow({...r,revoked_at:checked}),clock:()=>now}),/EXPIRED/);
});
test('01564 rate control limits bearer attempts',()=>{for(let n=0;n<30;n++)assert.doesNotThrow(()=>enforceOfferRate01564('testip',()=>now));assert.throws(()=>enforceOfferRate01564('testip',()=>now),/TOO_MANY_REQUESTS/);});
