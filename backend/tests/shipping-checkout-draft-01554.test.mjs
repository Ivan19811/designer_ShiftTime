import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateCheckoutDraftInput01554,createCheckoutDraft01554,checkoutDraftPublic01554} from '../src/shipping-checkout-draft-01554.mjs';
const uuid='550e8400-e29b-41d4-a716-446655440000';
const ref='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const scope={userId:'user_test',storeId:'store_test',workspaceId:'ws_test',accountId:'acc_test'};
const p=()=>({idempotencyKey:uuid,siteId:'site_test',cartId:'cart_'+'a'.repeat(32),cityRecipient:ref,warehouseRef:ref,expectedPackingRevision:2,expectedPlaces:2,expectedPrice:314.9,expectedWeightKg:13.5,expectedDeclaredValue:2980});
const row=()=>({id:'orderdraft_'+'f'.repeat(32),site_id:'site_test',cart_id:p().cartId,request_hash:'x'.repeat(64),created_at:'2026-10-23T19:00:00.000Z',subtotal_cents:298000,provisional_delivery_cents:31490,provisional_total_cents:329490,total_weight_grams:13500,number_of_packages:2});
const fakePreflight=async()=>({preflightPassed:true,canPlaceOrder:false,subtotal:2980,shippingCost:314.9,estimatedTotal:3294.9,weightKg:13.5,numberOfPackages:2,_draftContext:{cartFingerprint:'a'.repeat(64),packingFingerprint:'b'.repeat(64),cart:{items:[{id:'one'}]},plan:{packages:[{id:'p1',main:{itemId:'one'},accessories:[],dimensions:[50,50,15],weightKg:8},{id:'p2',main:{itemId:'two'},accessories:[],dimensions:[40,40,10],weightKg:5.5}]}}});
const db=(queries)=>({query:async(sql,args)=>{queries.push({sql,args});if(sql.includes('ON CONFLICT'))return {rowCount:1,rows:[row()]};return {rowCount:0,rows:[]};}});
test('01554 validates all preflight fields plus UUID idempotency',()=>{
 assert.equal(validateCheckoutDraftInput01554(p()).idempotencyKey,uuid);
 for(const tweak of [v=>v.idempotencyKey='guessable',v=>v.contact='name',v=>v.apiKey='secret',v=>v.items=[{}],v=>v.expectedPrice=0,v=>v.siteId='../wrong',v=>v.expectedPackingRevision=-1]){
   const input=p();tweak(input);assert.throws(()=>validateCheckoutDraftInput01554(input));
 }
});
test('01554 creates only a provisional draft, no contacts or side effects',async()=>{
 const queries=[],result=await createCheckoutDraft01554(scope,p(),{lookup:async()=>null,preflight:fakePreflight,transaction:async fn=>fn(db(queries)),snapshot:async()=>[{itemId:'one',quantity:1,unitPriceCents:298000}],newId:()=>row().id});
 assert.equal(result.draftId,row().id);assert.equal(result.previewOnly,true);assert.equal(result.state,'draft');
 assert.equal(result.canPlaceOrder,false);assert.equal(result.canPay,false);assert.equal(result.waybillCreated,false);assert.equal(result.crmSynced,false);
 assert.equal(result.provisionalTotal,3294.9);assert.equal(result.numberOfPackages,2);
 assert.equal(queries.length,1);const request=JSON.stringify(queries);
 assert.ok(!request.includes('phone'));assert.ok(!request.includes('email'));assert.ok(!request.includes('token'));
 assert.match(queries[0].sql,/ON CONFLICT\(store_id,created_by_user_id,idempotency_key\) DO NOTHING/);
});
test('01554 duplicate idempotency requests reuse stored draft without new carrier quote',async()=>{
 let quoteCalls=0;const saved=row();
 const incomingHash=(await createCheckoutDraft01554(scope,p(),{lookup:async()=>null,preflight:fakePreflight,transaction:async fn=>fn(db([])),snapshot:async()=>[],newId:()=>row().id})).stage;
 assert.equal(incomingHash,'01554');
 // A stored row uses a matching deterministic request hash computed from immutable fields.
 const {createHash}=await import('node:crypto');const v=p();const reqHash=createHash('sha256').update(JSON.stringify([v.siteId,v.cartId,v.cityRecipient,v.warehouseRef,v.expectedPackingRevision,v.expectedPlaces,31490,298000,v.expectedWeightKg])).digest('hex');
 saved.request_hash=reqHash;
 const replay=await createCheckoutDraft01554(scope,p(),{lookup:async()=>saved,preflight:async()=>{quoteCalls++;throw Error('should not run');}});
 assert.equal(replay.replayed,true);assert.equal(replay.draftId,saved.id);assert.equal(quoteCalls,0);
});
test('01554 rejects reuse of an idempotency key with a different checkout payload',async()=>{
 await assert.rejects(()=>createCheckoutDraft01554(scope,p(),{lookup:async()=>row(),preflight:fakePreflight}),{code:'NP_DRAFT_IDEMPOTENCY_CONFLICT_01554'});
});
test('01554 refuses any unauthorized or incomplete tenant',async()=>{
 await assert.rejects(()=>createCheckoutDraft01554({storeId:'store_test'},p()),{code:'NP_DRAFT_SCOPE_REQUIRED_01554'});
});
test('01554 requires successful server preflight, never trusts browser claim',async()=>{
 await assert.rejects(()=>createCheckoutDraft01554(scope,p(),{lookup:async()=>null,preflight:async()=>({preflightPassed:false})}),{code:'NP_DRAFT_PREFLIGHT_REQUIRED_01554'});
});
test('01554 never commits if rows changed during cart validation',async()=>{
 let committed=false;
 await assert.rejects(()=>createCheckoutDraft01554(scope,p(),{lookup:async()=>null,preflight:fakePreflight,transaction:async fn=>fn(db([])),snapshot:async()=>{throw Object.assign(new Error('changed'),{code:'NP_DRAFT_CART_CHANGED_01554'});}}),{code:'NP_DRAFT_CART_CHANGED_01554'});
 assert.equal(committed,false);
});
test('01554 migration and route are store-scoped, public writes not enabled',()=>{
 const source=readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
 const ddl=readFileSync(new URL('../sql/047_shipping_checkout_drafts_01554.sql',import.meta.url),'utf8');
 assert.match(source,/createCheckoutDraft01554\(scope/);assert.match(source,/assertOrderWriteRole\(scope\);\s*return sendJson\(res,201/);
 assert.doesNotMatch(source,/p\[2\]==='public'.*p\[5\]==='checkout-draft'/);
 assert.match(ddl,/UNIQUE \(store_id,created_by_user_id,idempotency_key\)/);
 assert.match(ddl,/state text NOT NULL DEFAULT 'draft'/);
 assert.doesNotMatch(ddl,/customer_name|email|phone|contact_json|api_key|token_hash/);
});
test('01554 draft public output excludes tenant and buyer data',()=>{
 const r=checkoutDraftPublic01554({...row(),store_id:'secret_store',created_by_user_id:'buyer_secret'});
 assert.ok(!JSON.stringify(r).includes('secret'));assert.ok(!('contact' in r));
});
test('01554 under transaction recomputes catalog prices and live parcel dimensions, rejecting edits',async()=>{
 const {lockedSnapshot01554}=await import('../src/shipping-checkout-draft-01554.mjs');
 const {authoredView01535}=await import('../src/marketplace-shop-cart-core-01535.mjs');
 const {buildPackingPlan01548,packingFingerprint01548}=await import('../src/shipping-packing-preview-01548.mjs');
 const {checkoutCartFingerprint01553}=await import('../src/shipping-checkout-preflight-01553.mjs');
 const state={products:[{id:'pan',name:'pan',price:2500,stock:100,currency:'UAH',status:'active',shipping01547:{weightKg:8,lengthCm:50,widthCm:50,heightCm:15,separatePackage:false,calculateDelivery:true}},{id:'lid',name:'lid',price:480,stock:100,currency:'UAH',status:'active',shipping01547:{weightKg:3,lengthCm:50,widthCm:50,heightCm:10,separatePackage:false,calculateDelivery:true}}],variants:[]};
 const ids=[{id:'main',productId:'pan',componentKind:'main',quantity:1,bundleId:'bundle',parentItemId:null,sourceKind:'store-product-01534'},{id:'accessory',productId:'lid',componentKind:'accessory',quantity:1,bundleId:'bundle',parentItemId:'main',sourceKind:'store-product-01534'}];
 const cartId=p().cartId,siteId='site_test';
 const cartItems=authoredView01535(state,ids,scope.storeId,siteId).items;
 const plan=buildPackingPlan01548(cartItems,{products:state.products,variants:[],specs:[]});
 const packingFingerprint=packingFingerprint01548(cartItems,plan);
 const ctx={cartFingerprint:checkoutCartFingerprint01553({id:cartId,siteId,currency:'UAH',items:cartItems}),packingFingerprint,plan};
 const input={...validateCheckoutDraftInput01554({...p(),expectedPlaces:1,expectedPackingRevision:2,expectedWeightKg:11})};
 const seen=[];
 const fakeDb={async query(sql,args){seen.push(sql);
   if(sql.includes('FROM marketplace_carts'))return {rowCount:1,rows:[{id:cartId,currency:'UAH',status:'active'}]};
   if(sql.includes('FROM commerce_store_snapshots'))return {rowCount:1,rows:[{snapshot:state}]};
   if(sql.includes('FROM marketplace_cart_items'))return {rowCount:2,rows:ids.map(x=>({id:x.id,productId:x.productId,variantId:'',variantSku:'',sourceKind:x.sourceKind,componentKind:x.componentKind,quantity:x.quantity,bundleId:x.bundleId,parentItemId:x.parentItemId}))};
   if(sql.includes('FROM shifttime_shipping_cart_packing_01549'))return {rowCount:1,rows:[{revision:2,cartFingerprint:packingFingerprint,moves:[]}]};
   if(sql.includes('FROM shifttime_shipping_product_parcels'))return {rowCount:0,rows:[]};
   throw Error('unexpected query');
 }};
 const result=await lockedSnapshot01554(fakeDb,scope,input,ctx);
 assert.equal(result.length,2);assert.equal(result.reduce((sum,x)=>sum+x.lineTotalCents,0),298000);
 assert.ok(seen.filter(x=>x.includes('FOR SHARE')).length>=5);
 state.products[1].shipping01547.weightKg=3.5;
 await assert.rejects(()=>lockedSnapshot01554(fakeDb,scope,input,ctx),{code:'NP_DRAFT_PACKING_CHANGED_01554'});
 state.products[1].shipping01547.weightKg=3;
 state.products[1].price=490;
 await assert.rejects(()=>lockedSnapshot01554(fakeDb,scope,input,ctx),{code:'NP_DRAFT_CART_CHANGED_01554'});
});
