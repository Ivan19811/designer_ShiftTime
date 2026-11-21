// 01551 · Provisional, server-authoritative carrier estimate for multiple cargo places.
// Does not authorize orders, payments, TTN or dimensional fit certification.
import {cartPackingLayout01549} from './shipping-packing-layout-01549.mjs';
const shopCartView01535=async (...args)=>(await import('./marketplace-shop-cart-service-01535.mjs')).shopCartView01535(...args);
import {previewStoreQuote01544} from './shipping-quote-service-01544.mjs';
import {isNovaPoshtaRef01544} from './nova-poshta-quote-01544.mjs';
const str=v=>String(v??'').trim();
const bad=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const safeId=v=>/^[-\w:]{1,160}$/.test(str(v));
const cartPattern=/^cart_[a-z0-9]{24,48}$/i;
export function validateMultiPlacePlan01551(plan,cart){
  if(!plan||plan.previewOnly!==true||plan.readyForOrder!==false||!Array.isArray(plan.packages)||!Array.isArray(plan.unassigned)||plan.unassigned.length||!plan.packages.length||plan.packages.length>100)throw bad('NP_MULTI_PLAN_NOT_READY_01551');
  if(plan.layoutStale||!Array.isArray(plan.moves))throw bad('NP_MULTI_PLAN_NOT_READY_01551');
  if(plan.warnings?.some(w=>['NP_PACKING_MEASUREMENTS_MISSING_01548','NP_PARCEL_CARRIER_PRICE_01547','NP_PACKING_UNASSIGNED_01548'].includes(w)))throw bad('NP_MULTI_PARCEL_DATA_MISSING_01551');
  let grams=0;
  for(const p of plan.packages){
    if(!p?.main||!p.main.calculateDelivery||!Number.isFinite(p.weightKg)||p.weightKg<=0||p.weightKg>1000||!Array.isArray(p.dimensions)||p.dimensions.length!==3||p.dimensions.some(d=>!Number.isFinite(d)||d<=0||d>300)||p.accessories?.some(a=>a.calculateDelivery!==true))throw bad('NP_MULTI_PARCEL_DATA_MISSING_01551');
    grams+=Math.round(p.weightKg*1000);
  }
  if(grams<=0||grams>1000000)throw bad('NP_MULTI_PARCEL_DATA_MISSING_01551');
  const items=cart?.items;
  if(!Array.isArray(items)||!items.length||cart.issues?.length||cart.id!==plan.cartId||cart.siteId!==plan.siteId||items.some(i=>i.sourceKind!=='store-product-01534'||i.status!=='active'||i.currency!=='UAH'))throw bad('NP_MULTI_CART_INVALID_01551');
  const cents=items.reduce((n,i)=>{const v=Number(i.lineTotal);if(!Number.isFinite(v)||v<0||Math.abs(Math.round(v*100)-v*100)>0.00001)throw bad('NP_MULTI_CART_INVALID_01551');return n+Math.round(v*100);},0);
  if(cents<100||cents>1000000000)throw bad('NP_MULTI_CART_INVALID_01551');
  return {weightKg:grams/1000,seats:plan.packages.length,declaredValue:cents/100};
}
export async function previewCartMultiPlaceQuote01551(scope,input,{layout=cartPackingLayout01549,cartView=shopCartView01535,quote=previewStoreQuote01544,clientId=''}={}){
  const siteId=str(input?.siteId),cartId=str(input?.cartId);
  if(!str(scope?.storeId)||!safeId(siteId)||!cartPattern.test(cartId))throw bad('NP_MULTI_CART_INVALID_01551',400);
  if(!isNovaPoshtaRef01544(input?.cityRecipient)||!isNovaPoshtaRef01544(input?.warehouseRef))throw bad('NP_QUOTE_RECIPIENT_INVALID_01544',400);
  // Always use saved layout and a freshly resolved Store/catalog cart. Never trust
  // browser-supplied weights, product prices, seats, moves, or declaredValue.
  const plan=await layout(scope,{action:'load',siteId,cartId});
  const cart=await cartView(scope,siteId,cartId);
  const trusted=validateMultiPlacePlan01551(plan,cart);
  const result=await quote(scope.storeId,{cityRecipient:input.cityRecipient,warehouseRef:input.warehouseRef,declaredValue:trusted.declaredValue},{clientId,trustedParcelWeightKg:trusted.weightKg,trustedSeats:trusted.seats});
  // Prevent a silently stale carrier preview if cart or layout changed mid-request.
  const rechecked=await layout(scope,{action:'load',siteId,cartId});
  if(rechecked.cartFingerprint!==plan.cartFingerprint||rechecked.savedRevision!==plan.savedRevision||rechecked.layoutStale)throw bad('NP_MULTI_PLAN_CHANGED_01551');
  return {...result,stage:'01551',quoteBasis:'server-cart-packing-01551',numberOfPackages:trusted.seats,seats:trusted.seats,weightKg:trusted.weightKg,declaredValue:trusted.declaredValue,packingRevision:plan.savedRevision,estimated:true,final:false,canPlaceOrder:false,orderReady:false,waybillCreated:false,fitUnverified:true};
}
