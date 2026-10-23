import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProductParcel01545,makeCartParcelPlan01545,listStoreProductParcels01545,saveStoreProductParcel01545,previewServerCartQuote01545} from '../src/shipping-product-parcels-01545.mjs';
const line=(productId,variantId,quantity,lineTotal,extra={})=>({sourceKind:'store-product-01534',status:'active',currency:'UAH',productId,variantId,quantity,lineTotal,...extra});
const sku=(productId,variantId,weightKg,extra={})=>({productId,variantId,weightKg,shippingRequired:true,...extra});
const scope={storeId:'store-a',userId:'user-a'};
test('01545 parcel validation rejects fake weight, partial dims and invalid selector',()=>{
 assert.equal(normalizeProductParcel01545({productId:'pan',weightKg:2,lengthCm:40,widthCm:40,heightCm:10}).weightKg,2);
 assert.equal(normalizeProductParcel01545({productId:'engraving',shippingRequired:false}).weightKg,null);
 assert.throws(()=>normalizeProductParcel01545({productId:'pan',weightKg:0}),/WEIGHT_INVALID/);
 assert.throws(()=>normalizeProductParcel01545({productId:'pan',weightKg:2,lengthCm:40}),/DIMENSIONS_INVALID/);
 assert.throws(()=>normalizeProductParcel01545({productId:'../danger',weightKg:2}),/PRODUCT_INVALID/);
});
test('01545 server cart weight uses exact variant, product fallback, quantity and excluded service',()=>{
 const items=[line('pan','v-50',2,2400),line('lid','v-50',2,860),line('service','',1,0)];
 const specs=[sku('pan','',4),sku('pan','v-50',5),sku('lid','',0.8),{productId:'service',variantId:'',shippingRequired:false,weightKg:null}];
 const plan=makeCartParcelPlan01545(items,specs);
 assert.equal(plan.weightKg,11.6);assert.equal(plan.declaredValue,3260);assert.equal(plan.excludedLines,1);
 assert.throws(()=>makeCartParcelPlan01545(items,specs.slice(0,2)),/PRODUCTS_NOT_CONFIGURED/);
 assert.throws(()=>makeCartParcelPlan01545([{...items[0],sourceKind:'seller-offer'}],specs),/CART_INVALID/);
 assert.throws(()=>makeCartParcelPlan01545([{...items[0],currency:'USD'}],specs),/CART_INVALID/);
});
test('01545 store parcel list and write always parameterize Store identity',async()=>{
 const calls=[],client={query:async(sql,args)=>{calls.push({sql,args});return {rows:[]};}};
 const catalog={products:[{id:'pan',name:'Pan'}],variants:[{id:'v-50',productId:'pan',sku:'p-50'}]};
 await listStoreProductParcels01545(scope,{dbClient:client,snapshotImpl:async()=>catalog});
 assert.deepEqual(calls[0].args,['store-a']);
 await saveStoreProductParcel01545(scope,{productId:'pan',variantId:'v-50',weightKg:5},{dbClient:client,snapshotImpl:async()=>catalog});
 assert.deepEqual(calls[1].args.slice(0,3),['store-a','pan','v-50']);
 await assert.rejects(()=>saveStoreProductParcel01545(scope,{productId:'other',weightKg:5},{dbClient:client,snapshotImpl:async()=>catalog}),/PRODUCT_NOT_FOUND/);
});
test('01545 quote from actual cart takes server subtotal only, never buyer values',async()=>{
 let seen;
 const cartId='cart_123456789012345678901234';
 const result=await previewServerCartQuote01545(scope,{siteId:'site-x',cartId,cityRecipient:'valid-recipient',warehouseRef:'valid-warehouse',declaredValue:1,weightKg:0}, {
   cartView:async (_scope,site,cart)=>({id:cart,siteId:site,items:[line('pan','v-50',2,2400),line('lid','',2,860)],issues:[]}),
   parcelView:async()=>({specs:[sku('pan','v-50',5),sku('lid','',.8)]}),
   quote:async (store,req,options)=>{seen={store,req,options};return {provider:'nova-poshta',price:123,currency:'UAH',estimated:true,final:false,canPlaceOrder:false};}
 });
 assert.equal(seen.store,'store-a');assert.equal(seen.req.declaredValue,3260);assert.equal(seen.options.trustedParcelWeightKg,11.6);
 assert.equal(result.orderReady,false);assert.equal(result.quoteBasis,'server-cart-product-parcels');
});
