import test from 'node:test';
import assert from 'node:assert/strict';
import {validateMultiPlacePlan01551,previewCartMultiPlaceQuote01551} from '../src/shipping-multiplace-quote-01551.mjs';
import {provePublishedCart01551,publicPackingLayout01551,publicMultiPlaceQuote01551,assertPublishedShippingRate01551} from '../src/shipping-public-cart-01551.mjs';
const cartId='cart_'+'e'.repeat(32),siteId='site_123',storeId='store_123',ref='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const plan=()=>({stage:'01548',siteId,cartId,cartFingerprint:'f'.repeat(64),savedRevision:3,layoutStale:false,moves:[],packages:[{id:'main:1',main:{calculateDelivery:true},accessories:[{calculateDelivery:true}],weightKg:8,dimensions:[50,50,15]},{id:'main2:1',main:{calculateDelivery:true},accessories:[],weightKg:5.5,dimensions:[40,40,10]}],unassigned:[],previewOnly:true,readyForOrder:false,warnings:['NP_PACKING_FIT_UNVERIFIED_01548']});
const cart=()=>({siteId,id:cartId,issues:[],items:[{id:'first',sourceKind:'store-product-01534',status:'active',currency:'UAH',lineTotal:1630},{id:'second',sourceKind:'store-product-01534',status:'active',currency:'UAH',lineTotal:1350}]});
const scope={storeId,userId:'owner1'};
test('01551 only server-authored count, mass and amount reach carrier, still provisional',async()=>{
 let call;const p=plan();const result=await previewCartMultiPlaceQuote01551(scope,{siteId,cartId,cityRecipient:ref,warehouseRef:ref,weightKg:1,seats:99,declaredValue:1,moves:[{packageId:'wrong'}]},{layout:async()=>p,cartView:async()=>cart(),quote:async (...args)=>{call=args;return {provider:'nova-poshta',price:333,currency:'UAH',estimated:true,final:false,canPlaceOrder:false};}});
 assert.equal(result.numberOfPackages,2);assert.equal(result.weightKg,13.5);assert.equal(result.declaredValue,2980);
 assert.deepEqual(call[1],{cityRecipient:ref,warehouseRef:ref,declaredValue:2980});assert.equal(call[2].trustedSeats,2);assert.equal(call[2].trustedParcelWeightKg,13.5);
 assert.equal(result.orderReady,false);assert.equal(result.canPlaceOrder,false);assert.equal(result.waybillCreated,false);assert.equal(result.fitUnverified,true);
});
test('01551 rejects missing weights, unassigned accessories, unsupported transport opt-out, stale plans',()=>{
 const base=plan(),c=cart();for(const mutate of [p=>p.unassigned.push({}),p=>p.packages[0].weightKg=null,p=>p.packages[0].main.calculateDelivery=false,p=>p.layoutStale=true,p=>p.packages[1].dimensions=[0,40,10]]){
  const p=plan();mutate(p);assert.throws(()=>validateMultiPlacePlan01551(p,c));
 }
});
test('01551 rejects changes to cart/layout during upstream carrier call',async()=>{
 const p=plan(),changed={...p,savedRevision:4};let n=0;
 await assert.rejects(()=>previewCartMultiPlaceQuote01551(scope,{siteId,cartId,cityRecipient:ref,warehouseRef:ref},{layout:async()=>++n===1?p:changed,cartView:async()=>cart(),quote:async()=>({price:1})}),{code:'NP_MULTI_PLAN_CHANGED_01551'});
});
test('01551 published site cart bearer must be in this exact tenant and active cart',async()=>{
 let values;const client={async query(sql,args){values=args;assert.match(sql,/ci\.site_id=\$3/);assert.match(sql,/ci\.store_id=\$2/);assert.match(sql,/c\.status='active'/);return {rowCount:1,rows:[{'?column?':1}]};}};
 assert.equal((await provePublishedCart01551({siteId,storeId},cartId,{client})).cartId,cartId);
 assert.deepEqual(values,[cartId,storeId,siteId]);
 await assert.rejects(()=>provePublishedCart01551({siteId,storeId:'other'},cartId,{client:{query:async()=>({rowCount:0,rows:[]})}}),{code:'NP_PUBLIC_CART_NOT_FOUND_01551'});
 await assert.rejects(()=>provePublishedCart01551({siteId,storeId},'cart_0',{client}),{code:'NP_PUBLIC_CART_REQUIRED_01551'});
});
test('01551 public endpoints ignore body-provided tenant and delegate only scoped cart',async()=>{
 const identity={siteId,storeId};const proof=async()=>({siteId,storeId,cartId,userId:null});let input;
 const result=await publicPackingLayout01551(identity,cartId,{action:'load',siteId,cartId},{proof,layout:async (_scope,request)=>{input=request;return {stage:'01548',previewOnly:true};}});
 assert.equal(input.siteId,siteId);assert.equal(input.cartId,cartId);assert.equal(result.publicCart,true);assert.equal(result.orderReady,false);
 await assert.rejects(()=>publicPackingLayout01551(identity,cartId,{siteId:'other'},{proof,layout:async()=>({})}),{code:'NP_PUBLIC_CART_SCOPE_MISMATCH_01551'});
 let quoted;
 await publicMultiPlaceQuote01551(identity,cartId,{siteId:'forged',cityRecipient:ref,warehouseRef:ref,declaredValue:1},{proof,quote:async (s,q)=>{quoted={s,q};return {orderReady:false};}});
 assert.equal(quoted.q.siteId,siteId);assert.equal(quoted.q.cartId,cartId);assert.equal(quoted.q.declaredValue,undefined);
});
test('01551 enforces per-site and per-client request rate limit',()=>{
 for(let i=0;i<30;i++)assert.doesNotThrow(()=>assertPublishedShippingRate01551('siteRateA','clientRateA',180000));
 assert.throws(()=>assertPublishedShippingRate01551('siteRateA','clientRateA',180000),{code:'NP_PUBLIC_PACKING_RATE_LIMIT_01551'});
 assert.doesNotThrow(()=>assertPublishedShippingRate01551('siteRateB','clientRateA',180000));
});
