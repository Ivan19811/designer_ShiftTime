import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPackingPlan01548,previewCartPacking01548} from '../src/shipping-packing-preview-01548.mjs';
const spec=(l,w,h,weight,locked=false)=>({lengthCm:l,widthCm:w,heightCm:h,weightKg:weight,separatePackage:locked,calculateDelivery:true});
function fixture({lockFirst=false,smallSecond=false}={}){
  const products=[{id:'pan40',name:'Сковорода 40 см',shipping01547:spec(40,40,15,7,lockFirst)},{id:'pan50',name:'Сковорода 50 см',shipping01547:spec(smallSecond?35:50,smallSecond?35:50,15,8)},{id:'cover50',name:'Кришка 50 см',shipping01547:spec(30,20,5,3)},{id:'case50',name:'Чохол',shipping01547:spec(20,20,5,1)},{id:'print',name:'Послуга',catalogRole01472:'service'}];
  const items=[
    {id:'main40',productId:'pan40',componentKind:'main',sourceKind:'store-product-01534',status:'active',currency:'UAH',quantity:1,title:'Сковорода 40 см',bundleId:'bundle1',lineTotal:1200},
    {id:'cover',productId:'cover50',componentKind:'accessory',parentItemId:'main40',sourceKind:'store-product-01534',status:'active',currency:'UAH',quantity:1,title:'Кришка',bundleId:'bundle1',lineTotal:430},
    {id:'main50',productId:'pan50',componentKind:'main',sourceKind:'store-product-01534',status:'active',currency:'UAH',quantity:1,title:'Сковорода 50 см',bundleId:'bundle2',lineTotal:1500},
    {id:'case',productId:'case50',componentKind:'accessory',parentItemId:'main50',sourceKind:'store-product-01534',status:'active',currency:'UAH',quantity:1,title:'Чохол',bundleId:'bundle2',lineTotal:100},
    {id:'service',productId:'print',componentKind:'service',parentItemId:'case',sourceKind:'store-product-01534',status:'active',currency:'UAH',quantity:1,title:'Друк',bundleId:'bundle2',lineTotal:100},
  ];return {items,catalog:{products,variants:[],specs:[]}};
}
test('two main items create two packages with own accessories; services excluded',()=>{
  const {items,catalog}=fixture();const plan=buildPackingPlan01548(items,catalog);
  assert.equal(plan.numberOfPackages,2);assert.deepEqual(plan.packages.map(x=>x.weightKg),[10,9]);
  assert.deepEqual(plan.packages.map(x=>x.accessories.map(a=>a.itemId)),[['cover'],['case']]);
  assert.equal(plan.serviceLines,1);assert.equal(plan.readyForOrder,false);
});
test('move accessory across bundles changes placement only, never canonical parent',()=>{
  const {items,catalog}=fixture();const plan=buildPackingPlan01548(items,catalog,[{unitKey:'case:1',packageId:'main40:1'}]);
  assert.deepEqual(plan.packages.map(x=>x.weightKg),[11,8]);
  assert.equal(plan.packages[0].accessories[1].parentItemId,'main50');
  assert.equal(items[3].parentItemId,'main50');
});
test('a separately packed main cannot receive accessory',()=>{
  const {items,catalog}=fixture({lockFirst:true});const plan=buildPackingPlan01548(items,catalog);
  assert.equal(plan.packages[0].accessories.length,0);
  assert.equal(plan.unassigned.length,1);
  assert.throws(()=>buildPackingPlan01548(items,catalog,[{unitKey:'case:1',packageId:'main40:1'}]),{code:'NP_PACKING_MOVE_NOT_ALLOWED_01548'});
});
test('reject physically too large accessory in destination',()=>{
  const {items,catalog}=fixture({smallSecond:true});
  catalog.products.find(p=>p.id==='cover50').shipping01547=spec(40,40,12,3);
  assert.throws(()=>buildPackingPlan01548(items,catalog,[{unitKey:'cover:1',packageId:'main50:1'}]),{code:'NP_PACKING_MOVE_NOT_ALLOWED_01548'});
});
test('cannot move a main, unlisted accessory, or arbitrary cart line',()=>{
  const {items,catalog}=fixture();for(const key of ['main40:1','service:1','unknown:1'])assert.throws(()=>buildPackingPlan01548(items,catalog,[{unitKey:key,packageId:'main50:1'}]),{code:'NP_PACKING_MOVE_INVALID_01548'});
});
test('main quantity >1 expands to same number of anchored packages',()=>{
  const {items,catalog}=fixture();items[0].quantity=2;items[1].quantity=2;const plan=buildPackingPlan01548(items,catalog);
  assert.equal(plan.numberOfPackages,3);
  assert.deepEqual(plan.packages.slice(0,2).map(x=>x.weightKg),[10,10]);
});
test('calculate delivery disabled never yields a carrier quote',()=>{
  const {items,catalog}=fixture();catalog.products[1].shipping01547.calculateDelivery=false;
  const plan=buildPackingPlan01548(items,catalog);
  assert.equal(plan.hasCarrierQuote,false);assert.ok(plan.warnings.includes('NP_PARCEL_CARRIER_PRICE_01547'));
});
test('scope and cart identity checked before producing plan',async()=>{
  const {items,catalog}=fixture();const scope={storeId:'store1'};
  const cartView=async()=>({id:'cart_'+'a'.repeat(24),siteId:'site1',items,issues:[]});
  const plan=await previewCartPacking01548(scope,{cartId:'cart_'+'a'.repeat(24),siteId:'site1'}, {cartView,parcelView:async()=>catalog});
  assert.equal(plan.previewOnly,true);assert.equal(plan.packages.length,2);
  await assert.rejects(()=>previewCartPacking01548(scope,{cartId:'cart_'+'b'.repeat(24),siteId:'site1'}, {cartView,parcelView:async()=>catalog}),{code:'NP_PACKING_CART_INVALID_01548'});
});
test('unknown product fails closed without fallbacks or fabricated weights',()=>{
  const {items,catalog}=fixture();catalog.products.splice(0,1);
  assert.throws(()=>buildPackingPlan01548(items,catalog),{code:'NP_PACKING_CATALOG_CHANGED_01548'});
});
test('accessory independently flagged forms a locked standalone package',()=>{
  const {items,catalog}=fixture();catalog.products.find(p=>p.id==='case50').shipping01547.separatePackage=true;
  const plan=buildPackingPlan01548(items,catalog);
  assert.equal(plan.numberOfPackages,3);
  assert.equal(plan.packages.at(-1).locked,true);
  assert.throws(()=>buildPackingPlan01548(items,catalog,[{unitKey:'case:1',packageId:'main40:1'}]),{code:'NP_PACKING_MOVE_INVALID_01548'});
});
