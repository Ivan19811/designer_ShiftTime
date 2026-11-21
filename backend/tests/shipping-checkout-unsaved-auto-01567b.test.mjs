import test from 'node:test';
import assert from 'node:assert/strict';
import {lockedSnapshot01554,validateCheckoutDraftInput01554} from '../src/shipping-checkout-draft-01554.mjs';
import {authoredView01535} from '../src/marketplace-shop-cart-core-01535.mjs';
import {buildPackingPlan01548,packingFingerprint01548} from '../src/shipping-packing-preview-01548.mjs';
import {checkoutCartFingerprint01553} from '../src/shipping-checkout-preflight-01553.mjs';
import {validateMultiPlacePlan01551} from '../src/shipping-multiplace-quote-01551.mjs';

const uuid='550e8400-e29b-41d4-a716-446655440000';
const ref='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const scope={userId:'test',storeId:'store_test',workspaceId:'w',accountId:'a'};
const cartId='cart_'+'a'.repeat(32),siteId='site_test';
function setup(){
  const state={products:[
    {id:'pan',name:'Pan',price:2500,stock:10,currency:'UAH',status:'active',shipping01547:{weightKg:8,lengthCm:50,widthCm:50,heightCm:15,separatePackage:false,calculateDelivery:true}},
    {id:'lid',name:'Lid',price:480,stock:10,currency:'UAH',status:'active',shipping01547:{weightKg:3,lengthCm:50,widthCm:50,heightCm:10,separatePackage:false,calculateDelivery:true}}
  ],variants:[]};
  const items=[
    {id:'main',productId:'pan',componentKind:'main',quantity:1,bundleId:'bundle',parentItemId:null,sourceKind:'store-product-01534'},
    {id:'accessory',productId:'lid',componentKind:'accessory',quantity:1,bundleId:'bundle',parentItemId:'main',sourceKind:'store-product-01534'}
  ];
  const projected=authoredView01535(state,items,scope.storeId,siteId).items;
  const plan=buildPackingPlan01548(projected,{products:state.products,variants:[],specs:[]});
  const trusted=validateMultiPlacePlan01551({...plan,siteId,cartId,previewOnly:true,layoutStale:false,moves:[]},{id:cartId,siteId,currency:'UAH',items:projected});
  const ctx={cartFingerprint:checkoutCartFingerprint01553({id:cartId,siteId,currency:'UAH',items:projected}),packingFingerprint:packingFingerprint01548(projected,plan),
    plan:{...plan,savedRevision:0,saved:false,layoutStale:false}};
  const input=validateCheckoutDraftInput01554({idempotencyKey:uuid,siteId,cartId,cityRecipient:ref,warehouseRef:ref,
    expectedPackingRevision:0,expectedPlaces:trusted.seats,expectedWeightKg:trusted.weightKg,
    expectedDeclaredValue:trusted.declaredValue,expectedPrice:314.9});
  const db={async query(sql){
    if(sql.includes('FROM marketplace_carts'))return {rowCount:1,rows:[{id:cartId,currency:'UAH',status:'active'}]};
    if(sql.includes('FROM commerce_store_snapshots'))return {rowCount:1,rows:[{snapshot:state}]};
    if(sql.includes('FROM marketplace_cart_items'))return {rowCount:items.length,rows:items.map(x=>({...x,variantId:'',variantSku:''}))};
    if(sql.includes('FROM shifttime_shipping_cart_packing_01549'))return {rowCount:0,rows:[]};
    if(sql.includes('FROM shifttime_shipping_product_parcels'))return {rowCount:0,rows:[]};
    throw Error('unexpected query: '+sql);
  }};
  return {state,items,ctx,input,db};
}
test('01567B unsaved automatic packing revision 0 is valid for draft after transaction recheck',async()=>{
  const t=setup();const lines=await lockedSnapshot01554(t.db,scope,t.input,t.ctx);
  assert.equal(lines.length,2);assert.equal(lines.reduce((s,l)=>s+l.lineTotalCents,0),298000);
});
test('01567B missing packing row is never valid for a saved revision or stale plan',async()=>{
  const t=setup();
  await assert.rejects(()=>lockedSnapshot01554(t.db,scope,{...t.input,expectedPackingRevision:2},t.ctx),{code:'NP_DRAFT_PACKING_CHANGED_01554'});
  await assert.rejects(()=>lockedSnapshot01554(t.db,scope,t.input,{...t.ctx,plan:{...t.ctx.plan,layoutStale:true}}),{code:'NP_DRAFT_PACKING_CHANGED_01554'});
});
test('01567B default plan still detects live parcel changes and price changes',async()=>{
  const t=setup();t.state.products[1].shipping01547.weightKg=9;
  await assert.rejects(()=>lockedSnapshot01554(t.db,scope,t.input,t.ctx),{code:'NP_DRAFT_PACKING_CHANGED_01554'});
  t.state.products[1].shipping01547.weightKg=3;t.state.products[1].price=481;
  await assert.rejects(()=>lockedSnapshot01554(t.db,scope,t.input,t.ctx),{code:'NP_DRAFT_CART_CHANGED_01554'});
});
