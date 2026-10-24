import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDirectCheckout01570,placeDirectCheckout01570} from '../src/orders-direct-checkout-01570.mjs';
const scope={storeId:'store_x',accountId:'acct_x',workspaceId:'workspace_x',siteId:'site_x'};
const cartId='cart_'+'a'.repeat(32);
const requestId='b9af8820-2e34-4c55-b9ed-614e1a949a45';
const input={requestId,cityRecipient:'cafeface-1234-4567-8abc-abcdefabcdef',warehouseRef:'bfeface0-1234-4567-8abc-abcdefabcdef',acceptEstimatedDelivery:true,expectedDeliveryCents:28100,contacts:{firstName:'Customer Name',phone:'+380671234567',email:'',comment:''}};
const bad=code=>x=>x?.code===code;
test('01570 validates contact and authoritative destination, no browser item/price mutation fields',()=>{
 const valid=validateDirectCheckout01570(scope,cartId,input);assert.equal(valid.expectedDeliveryCents,28100);
 assert.throws(()=>validateDirectCheckout01570(scope,cartId,{...input,items:[]}),bad('DIRECT_CHECKOUT_REQUEST_INVALID_01570'));
 assert.throws(()=>validateDirectCheckout01570(scope,cartId,{...input,acceptEstimatedDelivery:false}),bad('DIRECT_CHECKOUT_REQUEST_INVALID_01570'));
 assert.throws(()=>validateDirectCheckout01570(scope,cartId,{...input,contacts:{...input.contacts,phone:'bad'}}),bad('NP_CONTACT_FIELDS_INVALID_01555'));
});
const plan={savedRevision:0,cartFingerprint:'c'.repeat(64),packages:[{id:'p1',main:{itemId:'i1'},accessories:[],dimensions:[40,40,10],weightKg:4.5}]};
const ctx={plan,cart:{id:cartId,siteId:scope.siteId},cartFingerprint:'b'.repeat(64),packingFingerprint:'c'.repeat(64)};
const trusted={plan,cart:ctx.cart,ctx,trusted:{weightKg:4.5,seats:1},subtotal:220000,delivery:28100,total:248100};
function orderRow(){return {id:'a9af8820-2e34-4c55-b9ed-614e1a949a45',order_number:'ST-000000003',site_id:scope.siteId,source_draft_id:'orderdraft_'+'0'.repeat(32),created_at:new Date().toISOString(),order_status:'received',shipping_status:'pending_manual_confirmation',payment_status:'not_started',inventory_status:'not_reserved',crm_status:'not_sent',waybill_status:'not_created',email_possession_verified:false,subtotal_cents:220000,delivery_cents:28100,total_cents:248100,currency:'UAH',number_of_packages:1,items:[{title:'Pan',quantity:1,lineTotalCents:220000}],packages:[{number:1,weightGrams:4500,dimensionsCm:[40,40,10]}]};}
test('01570 creates transactional order, encrypted contacts and no payment, TTN or CRM',async()=>{
 const statements=[];const existing=[];
 const db={query:async(sql,args)=>{statements.push({sql,args});if(sql.includes('FROM marketplace_carts WHERE'))return {rowCount:1,rows:[{status:'active',currency:'UAH'}]};if(sql.includes('SELECT * FROM shifttime_production_orders_01566'))return {rowCount:existing.length,rows:existing};if(sql.includes('nextval'))return {rows:[{seq:'3'}]};if(sql.includes('INSERT INTO shifttime_production_orders_01566'))return {rowCount:1,rows:[orderRow()]};return {rowCount:1,rows:[]};}};
 const out=await placeDirectCheckout01570(scope,cartId,input,{transaction:async fn=>fn(db),findExisting:async()=>null,readTrusted:async()=>trusted,locked:async()=>[{itemId:'i1',title:'Pan',quantity:1,lineTotalCents:220000}],newId:()=>orderRow().id,newDraftId:()=>`orderdraft_${'0'.repeat(32)}`,keyProvider:()=>Buffer.alloc(32,3)});
 assert.equal(out.orderNumber,'ST-000000003');assert.equal(out.total,2481);assert.equal(out.paymentStatus,'not_started');assert.equal(out.crmStatus,'not_sent');assert.equal(out.waybillStatus,'not_created');
 const sensitive=statements.find(x=>x.sql.includes('INSERT INTO shifttime_production_order_contacts_01566'));assert.ok(sensitive);assert.equal(JSON.stringify(sensitive).includes('Customer Name'),false);assert.equal(JSON.stringify(sensitive).includes('+380671234567'),false);
 assert.equal(statements.some(x=>x.sql.includes('INSERT INTO shifttime_production_order_events_01566')),true);
});
test('01570 refuses changed carrier charge and does not touch DB',async()=>{
 await assert.rejects(placeDirectCheckout01570(scope,cartId,{...input,expectedDeliveryCents:100},{readTrusted:async()=>trusted,findExisting:async()=>null,transaction:()=>{throw Error('transaction invoked')}}),bad('DIRECT_CHECKOUT_PRICE_CHANGED_01570'));
});
test('01570 replays existing direct order, no second INSERT',async()=>{
 let inserts=0;const db={query:async sql=>{if(sql.includes('FROM marketplace_carts WHERE'))return {rowCount:1,rows:[{status:'active',currency:'UAH'}]};if(sql.includes('SELECT * FROM shifttime_production_orders_01566'))return {rowCount:1,rows:[{...orderRow(),placement_channel:'direct_checkout'}]};if(sql.includes('INSERT'))inserts++;return {rowCount:0,rows:[]};}};
 const out=await placeDirectCheckout01570(scope,cartId,input,{readTrusted:async()=>trusted,findExisting:async()=>null,transaction:async fn=>fn(db)});assert.equal(out.replayed,true);assert.equal(inserts,0);
});
test('01570 refuses cart that was already used in manually created order',async()=>{
 const db={query:async sql=>sql.includes('FROM marketplace_carts WHERE')?{rowCount:1,rows:[{status:'active',currency:'UAH'}]}:{rowCount:1,rows:[{...orderRow(),placement_channel:'manager'}]}};
 await assert.rejects(placeDirectCheckout01570(scope,cartId,input,{readTrusted:async()=>trusted,findExisting:async()=>null,transaction:async fn=>fn(db)}),bad('DIRECT_CHECKOUT_ALREADY_ORDERED_01570'));
});
