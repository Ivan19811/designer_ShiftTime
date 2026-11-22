import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCreateOrder01566,validateProductionSnapshot01566,createProductionOrder01566,getProductionOrderForDraft01566,listProductionOrders01566} from '../src/orders-production-01566.mjs';
const scope={role:'owner',storeId:'store-1',workspaceId:'ws-1',accountId:'acct-1',userId:'user-1'};
const draft='orderdraft_'+'a'.repeat(32),requestId='d4973cb5-41f6-488a-98d6-65d3333ec3d2';
const input={requestId,confirmCreation:true,acceptEstimatedShipping:true};
const existing={id:'841ddf09-8a51-4c13-87d2-3e55d8ca0555',order_number:'ST-000000042',site_id:'site-1',source_draft_id:draft,created_at:new Date(),order_status:'received',shipping_status:'pending_manual_confirmation',payment_status:'not_started',inventory_status:'not_reserved',crm_status:'not_sent',waybill_status:'not_created',email_possession_verified:false,subtotal_cents:298000,delivery_cents:31490,total_cents:329490,currency:'UAH',number_of_packages:2};
test('01566 requires explicit affirmation and UUID; no browser price accepted',()=>{
 assert.deepEqual(validateCreateOrder01566(input),{requestId});
 for(const invalid of [{},{...input,acceptEstimatedShipping:false},{...input,confirmCreation:false},{...input,requestId:'x'},{...input,total:1}])assert.throws(()=>validateCreateOrder01566(invalid),{code:'ORDERS_PRODUCTION_EXPLICIT_CONFIRMATION_REQUIRED_01566'});
});
test('01566 only store manager can access production order and requires scoped draft id',async()=>{
 await assert.rejects(createProductionOrder01566({...scope,role:'viewer'},draft,input),{statusCode:403});
 await assert.rejects(createProductionOrder01566(scope,'foobar',input),{statusCode:400});
});
test('01566 replay by same draft returns stored real order, not duplicate write',async()=>{
 const seen=[];
 const transaction=async fn=>fn({query:async(sql,params)=>{seen.push(sql);if(sql.includes('FOR UPDATE OF d'))return {rowCount:1,rows:[{id:draft}]};if(sql.includes('FROM shifttime_production_orders_01566'))return {rowCount:1,rows:[existing]};throw new Error('Unexpected write in replay');}});
 const result=await createProductionOrder01566(scope,draft,input,{transaction});
 assert.equal(result.replayed,true);assert.equal(result.orderCreated,true);assert.equal(result.orderNumber,existing.order_number);assert.equal(seen.length,2);
 assert.equal(JSON.stringify(result).includes('ciphertext'),false);
});
test('01566 no draft / no offer / cross store fails closed',async()=>{
 const t1=async fn=>fn({query:async()=>({rowCount:0,rows:[]})});
 await assert.rejects(createProductionOrder01566(scope,draft,input,{transaction:t1}),{code:'ORDERS_PRODUCTION_DRAFT_NOT_FOUND_01566'});
 const t2=async fn=>fn({query:async sql=>sql.includes('FOR UPDATE OF d')?{rowCount:1,rows:[{id:draft}]}:{rowCount:0,rows:[]}});
 await assert.rejects(createProductionOrder01566(scope,draft,input,{transaction:t2}),{code:'ORDERS_PRODUCTION_OFFER_NOT_FOUND_01566'});
});
test('01566 stale/unacknowledged buyer proposal cannot be written',()=>{
 assert.throws(()=>validateProductionSnapshot01566({accepted_at:null}),{code:'ORDERS_PRODUCTION_OFFER_NOT_CURRENT_01566'});
 assert.throws(()=>validateProductionSnapshot01566({accepted_at:new Date(),revoked_at:new Date(),expires_at:new Date(Date.now()+100000)}),{code:'ORDERS_PRODUCTION_OFFER_NOT_CURRENT_01566'});
 assert.throws(()=>validateProductionSnapshot01566({accepted_at:new Date(),expires_at:new Date(Date.now()-1000)}),{code:'ORDERS_PRODUCTION_OFFER_NOT_CURRENT_01566'});
});
test('01566 scoped read never returns PII and references store/account/workspace',async()=>{
 let args=[];
 const lookup=async fn=>fn({query:async(sql,params)=>{args=params;assert.match(sql,/o.store_id=\$1 AND o.account_id=\$2 AND o.workspace_id=\$3/);return {rowCount:1,rows:[existing]};}});
 const got=await getProductionOrderForDraft01566(scope,draft,{lookup});assert.equal(got.found,true);assert.equal(got.order.orderNumber,'ST-000000042');assert.deepEqual(args,[scope.storeId,scope.accountId,scope.workspaceId,draft]);
 assert.equal(Object.hasOwn(got.order,'email'),false);
});
test('01566 list limits, scope, no contact leakage',async()=>{
 let calls=0;
 const lookup=async fn=>fn({query:async(sql,params)=>{calls++;assert.match(sql,/o.store_id=\$1 AND o.account_id=\$2 AND o.workspace_id=\$3/);assert.equal(params[0],scope.storeId);return calls===1?{rows:[existing]}:{rows:[{n:1}]};}});
 const result=await listProductionOrders01566(scope,{limit:20,offset:0},{lookup});assert.equal(result.items.length,1);assert.equal(result.total,1);
 await assert.rejects(listProductionOrders01566(scope,{limit:999},{lookup}),{statusCode:400});
});
test('01566 manager create flow writes order + encrypted contact + audit exactly once',async()=>{
 let calls=[],newId='05b9e874-b3b8-4ccf-a587-d9e9b35a6e42';
 const row={id:'10c1ca64-44f5-41ef-9433-3ddb83db8c7d',store_id:'store-1',draft_account_id:'acct-1',draft_workspace_id:'ws-1',source_cart_id:'cart-1',accepted_at:new Date(Date.now()-10000),contacts_iv_b64:'I'.repeat(16),contacts_ciphertext_b64:'C'.repeat(32),contacts_tag_b64:'T'.repeat(24),contacts_digest:'d'.repeat(64),draft_items:[],packages:[],total_weight_grams:1000,recipient_city_ref:'city',recipient_warehouse_ref:'wh'};
 const transaction=async fn=>fn({query:async (sql,params)=>{calls.push({sql,params});if(sql.includes('FOR UPDATE OF d'))return {rowCount:1,rows:[{id:draft}]};if(sql.includes('FROM shifttime_production_orders_01566'))return {rowCount:0,rows:[]};if(sql.includes('JOIN shifttime_checkout_contacts_01555'))return {rowCount:1,rows:[row]};if(sql.startsWith('SELECT nextval'))return {rows:[{seq:'123'}]};if(sql.includes('INSERT INTO shifttime_production_orders_01566'))return {rowCount:1,rows:[{...existing,id:newId,order_number:'ST-000000123'}]};if(sql.includes('INSERT INTO shifttime_production_order_contacts_01566'))return {rowCount:1};if(sql.includes('INSERT INTO shifttime_production_order_events_01566'))return {rowCount:1};if(sql.includes('shifttime_order_buyer_email_challenges_01565'))return {rows:[]};throw Error('Unknown query '+sql.slice(0,75));}});
 // Validator substitution only in unit test, never exposed by an HTTP route.
 const result=await createProductionOrder01566(scope,draft,input,{transaction,newId:()=>newId,clock:()=>Date.now(),validate:()=>({siteId:'site-1',cartFingerprint:'f'.repeat(64),packingFingerprint:'e'.repeat(64),seats:2,subtotalCents:298000,deliveryCents:31490,totalCents:329490})});
 assert.equal(result.orderCreated,true);assert.equal(result.orderNumber,'ST-000000123');
 assert.equal(calls.filter(x=>x.sql.includes('INSERT INTO ')).length,3);
 const statement=calls.find(x=>x.sql.includes('INSERT INTO shifttime_production_orders_01566'));
 assert.equal(statement.params[21],298000);assert.equal(statement.params[22],31490);assert.equal(statement.params[23],329490);
 assert.equal(JSON.stringify(result).includes('C'.repeat(32)),false);
});
test('01566 validates a current consented 2-parcel store offer and rejects a changed price',()=>{
 const now=Date.parse('2026-10-24T10:00:00.000Z'),checked=new Date(now-60_000).toISOString(),expires=new Date(now+10*60_000).toISOString();
 const city='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',wh='cccccccc-cccc-4ccc-8ccc-cccccccccccc',sender='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
 const items=[{title:'Сковорода',quantity:1,lineTotalCents:120000},{title:'Кришка',quantity:1,lineTotalCents:43000}];
 const row={id:'1e3d8111-e1f0-4181-b8b0-a1e56395b1be',draft_id:draft,site_id:'site-1',store_id:'store-1',draft_account_id:'acct-1',draft_workspace_id:'ws-1',draft_currency:'UAH',source_cart_id:'cart-1',
  cart_fingerprint:'cartfp',review_cart_fingerprint:'cartfp',packing_fingerprint:'packfp',review_packing_fingerprint:'packfp',draft_subtotal_cents:163000,subtotal_cents:163000,provisional_delivery_cents:15000,provisional_total_cents:178000,review_total_cents:178000,
  delivery_cents:15000,total_cents:178000,draft_items:items,packages:[{weightGrams:8000,dimensionsCm:[50,50,15]},{weightGrams:3500,dimensionsCm:[40,40,10]}],total_weight_grams:11500,
  draft_number_of_packages:2,number_of_packages:2,recipient_city_ref:city,recipient_warehouse_ref:wh,quote_recipient_city_ref:city,quote_recipient_warehouse_ref:wh,
  carrier_price_cents:15000,carrier_checked_at:checked,offer_carrier_checked_at:checked,carrier_expires_at:expires,quote_sender_city_ref:sender,active_sender_city_ref:sender,shipping_enabled:true,
  quote_cart_fingerprint:'cartfp',quote_packing_fingerprint:'packfp',quote_old_shipping_cents:15000,quote_subtotal_cents:163000,quote_weight_grams:11500,quote_seats:2,
  workflow_status:'ready_for_manual_followup',contacts_current:true,contacts_iv_b64:'I'.repeat(16),contacts_ciphertext_b64:'C'.repeat(32),contacts_tag_b64:'T'.repeat(24),contacts_digest:'e'.repeat(64),contact_expires_at:expires,
  accepted_at:new Date(now-30_000).toISOString(),expires_at:expires,revoked_at:null};
 const basis=validateProductionSnapshot01566(row,now);assert.equal(basis.totalCents,178000);assert.equal(basis.seats,2);
 assert.throws(()=>validateProductionSnapshot01566({...row,delivery_cents:16000},now));
 assert.throws(()=>validateProductionSnapshot01566({...row,contacts_current:false},now));
 assert.throws(()=>validateProductionSnapshot01566({...row,draft_items:[{...items[0],lineTotalCents:1},items[1]]},now));
});
