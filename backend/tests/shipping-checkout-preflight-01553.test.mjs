import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCheckoutPreflightInput01553,checkoutPreflight01553} from '../src/shipping-checkout-preflight-01553.mjs';
const siteId='site_test',cartId='cart_'+'d'.repeat(32),ref='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',scope={storeId:'store_test',userId:'user_test'};
const plan=()=>({siteId,cartId,cartFingerprint:'f'.repeat(64),savedRevision:4,layoutStale:false,moves:[],packages:[{id:'m:1',main:{calculateDelivery:true},accessories:[],dimensions:[50,50,15],weightKg:8},{id:'m:2',main:{calculateDelivery:true},accessories:[],dimensions:[40,40,10],weightKg:5.5}],unassigned:[],warnings:[],previewOnly:true,readyForOrder:false});
const cart=()=>({id:cartId,siteId,items:[{id:'line1',status:'active',sourceKind:'store-product-01534',currency:'UAH',lineTotal:1630,quantity:1},{id:'line2',status:'active',sourceKind:'store-product-01534',currency:'UAH',lineTotal:1350,quantity:1}],issues:[]});
const input=()=>({siteId,cartId,cityRecipient:ref,warehouseRef:ref,expectedPackingRevision:4,expectedPlaces:2,expectedWeightKg:13.5,expectedDeclaredValue:2980,expectedPrice:314.9});
const quoteResult=()=>({provider:'nova-poshta',quoteBasis:'server-cart-packing-01551',estimated:true,final:false,canPlaceOrder:false,orderReady:false,waybillCreated:false,fitUnverified:true,numberOfPackages:2,weightKg:13.5,packingRevision:4,declaredValue:2980,price:314.9,currency:'UAH'});
const mocks=(overrides={})=>({layout:async()=>plan(),cartView:async()=>cart(),quote:async()=>quoteResult(),...overrides});
test('01553 recomputes cart + packing and carrier preview, never permits real order',async()=>{
 const r=await checkoutPreflight01553(scope,{...input(),weightKg:1,declaredValue:1},{...mocks(),clientId:'testing'});
 assert.deepEqual([r.subtotal,r.shippingCost,r.estimatedTotal],[2980,314.9,3294.9]);
 assert.equal(r.stage,'01553');assert.equal(r.preflightPassed,true);assert.equal(r.canPlaceOrder,false);assert.equal(r.canPay,false);assert.equal(r.waybillCreated,false);assert.equal(r.previewOnly,true);assert.equal(r.final,false);
 assert.equal(r.packingRevision,4);assert.equal(r.numberOfPackages,2);assert.equal(r.weightKg,13.5);
 assert.ok(Number.isFinite(Date.parse(r.checkedAt)));
 assert.ok(!('contact' in r));assert.ok(!('phone' in r));
});
test('01553 passes scoped cart and reference ids to recalculation',async()=>{
 let request,options;await checkoutPreflight01553(scope,input(),mocks({quote:async (_scope,body,opts)=>{request=body;options=opts;return quoteResult();}}));
 assert.deepEqual(request,{siteId,cartId,cityRecipient:ref,warehouseRef:ref});assert.equal(typeof options.layout,'function');assert.equal(typeof options.cartView,'function');
});
test('01553 rejects counterfeit price inputs, cart ids, warehouse refs, revision and quantity',()=>{
 for(const mutate of [v=>v.siteId='../bad',v=>v.cartId='cart_easy',v=>v.cityRecipient='oops',v=>v.warehouseRef='',v=>v.expectedPackingRevision=-1,v=>v.expectedPlaces=0,v=>v.expectedWeightKg=0,v=>v.expectedPrice=NaN,v=>v.expectedPrice=12.345,v=>v.expectedDeclaredValue=0]){
  const v=input();mutate(v);assert.throws(()=>validateCheckoutPreflightInput01553(v));
 }
});
test('01553 blocks when trusted packaging revision changes',async()=>{
 await assert.rejects(()=>checkoutPreflight01553(scope,{...input(),expectedPackingRevision:5},mocks()),{code:'NP_PREFLIGHT_PACKING_CHANGED_01553'});
});
test('01553 blocks when trusted parcel mass or count changes',async()=>{
 await assert.rejects(()=>checkoutPreflight01553(scope,{...input(),expectedWeightKg:11},mocks()),{code:'NP_PREFLIGHT_PACKING_CHANGED_01553'});
 await assert.rejects(()=>checkoutPreflight01553(scope,{...input(),expectedPlaces:1},mocks()),{code:'NP_PREFLIGHT_PACKING_CHANGED_01553'});
});
test('01553 rejects differences in real product totals',async()=>{
 await assert.rejects(()=>checkoutPreflight01553(scope,{...input(),expectedDeclaredValue:1000},mocks()),{code:'NP_PREFLIGHT_CART_CHANGED_01553'});
});
test('01553 detects price changing at carrier',async()=>{
 await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({quote:async()=>({...quoteResult(),price:315})})),{code:'NP_PREFLIGHT_PRICE_CHANGED_01553'});
});
test('01553 rejects forged carrier state and nonprovisional quotes',async()=>{
 for(const mutate of [q=>q.final=true,q=>q.orderReady=true,q=>q.canPlaceOrder=true,q=>q.provider='other',q=>q.quoteBasis='none',q=>q.currency='USD',q=>q.fitUnverified=false,q=>q.price=NaN]){
  const q=quoteResult();mutate(q);await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({quote:async()=>q})),{code:'NP_PREFLIGHT_QUOTE_INVALID_01553'});
 }
});
test('01553 refuses wrong response parcel revision and weight',async()=>{
 await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({quote:async()=>({...quoteResult(),packingRevision:3})})),{code:'NP_PREFLIGHT_QUOTE_INVALID_01553'});
 await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({quote:async()=>({...quoteResult(),weightKg:1})})),{code:'NP_PREFLIGHT_QUOTE_INVALID_01553'});
});
test('01553 detects cart race after carrier calculation',async()=>{
 let reads=0;await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({cartView:async()=>{const c=cart();if(++reads===2)c.items[0].quantity=2;return c;}})),{code:'NP_PREFLIGHT_CART_CHANGED_01553'});
});
test('01553 detects layout race after carrier calculation',async()=>{
 let reads=0;await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({layout:async()=>{const p=plan();if(++reads===2)p.savedRevision=5;return p;}})),{code:'NP_PREFLIGHT_CART_CHANGED_01553'});
});
test('01553 rejects non-scoped caller',async()=>{
 await assert.rejects(()=>checkoutPreflight01553({},input(),mocks()),{code:'NP_PREFLIGHT_SCOPE_REQUIRED_01553'});
});
test('01553 rejects unassigned items even when client claims quote',async()=>{
 await assert.rejects(()=>checkoutPreflight01553(scope,input(),mocks({layout:async()=>({...plan(),unassigned:[{}]})})),{code:'NP_MULTI_PLAN_NOT_READY_01551'});
});
