// 01553 · Server-authoritative checkout preflight: read-only, no order, payment, TTN or PII.
// Both published and authenticated builder routes delegate to a scoped Store cart.
import {createHash} from 'node:crypto';
import {cartPackingLayout01549} from './shipping-packing-layout-01549.mjs';
const shopCartView01535=async (...args)=>(await import('./marketplace-shop-cart-service-01535.mjs')).shopCartView01535(...args);
import {validateMultiPlacePlan01551,previewCartMultiPlaceQuote01551} from './shipping-multiplace-quote-01551.mjs';
import {isNovaPoshtaRef01544} from './nova-poshta-quote-01544.mjs';
const str=x=>String(x??'').trim();
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const cents=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=10000000&&Math.abs(Math.round(x*100)-x*100)<0.00001?Math.round(x*100):null;
const cartIdRe=/^cart_[a-z0-9]{24,48}$/i;
const siteIdRe=/^[-\w:]{1,160}$/;
export function checkoutCartFingerprint01553(cart){
  const rows=(cart?.items||[]).map(i=>[str(i.id),str(i.productId),str(i.variantId),str(i.parentItemId),str(i.bundleId),str(i.sourceKind),str(i.status),str(i.currency),i.quantity,cents(Number(i.lineTotal))]);
  return createHash('sha256').update(JSON.stringify([cart?.siteId,cart?.id,cart?.currency,rows])).digest('hex');
}
export function validateCheckoutPreflightInput01553(input){
  const siteId=str(input?.siteId),cartId=str(input?.cartId);
  if(!siteIdRe.test(siteId)||!cartIdRe.test(cartId))throw fail('NP_PREFLIGHT_CART_INVALID_01553',400);
  if(!isNovaPoshtaRef01544(input?.cityRecipient)||!isNovaPoshtaRef01544(input?.warehouseRef))throw fail('NP_PREFLIGHT_RECIPIENT_INVALID_01553',400);
  if(!Number.isSafeInteger(input?.expectedPackingRevision)||input.expectedPackingRevision<0||input.expectedPackingRevision>1000000000)throw fail('NP_PREFLIGHT_REVISION_INVALID_01553',400);
  if(!Number.isSafeInteger(input?.expectedPlaces)||input.expectedPlaces<1||input.expectedPlaces>100)throw fail('NP_PREFLIGHT_PLACES_INVALID_01553',400);
  if(cents(input?.expectedPrice)===null||cents(input.expectedPrice)<=0||cents(input.expectedDeclaredValue)===null||cents(input.expectedDeclaredValue)<=0)throw fail('NP_PREFLIGHT_AMOUNTS_INVALID_01553',400);
  if(typeof input?.expectedWeightKg!=='number'||!Number.isFinite(input.expectedWeightKg)||input.expectedWeightKg<=0||input.expectedWeightKg>1000)throw fail('NP_PREFLIGHT_WEIGHT_INVALID_01553',400);
  return {siteId,cartId,cityRecipient:input.cityRecipient,warehouseRef:input.warehouseRef,expectedPackingRevision:input.expectedPackingRevision,expectedPlaces:input.expectedPlaces,expectedPriceCents:cents(input.expectedPrice),expectedDeclaredCents:cents(input.expectedDeclaredValue),expectedWeightKg:input.expectedWeightKg};
}
export async function checkoutPreflight01553(scope,input,{layout=cartPackingLayout01549,cartView=shopCartView01535,quote=previewCartMultiPlaceQuote01551,clientId='',includeDraftContext=false}={}){
  if(!str(scope?.storeId))throw fail('NP_PREFLIGHT_SCOPE_REQUIRED_01553',403);
  const p=validateCheckoutPreflightInput01553(input);
  const read=async()=>{
    const plan=await layout(scope,{action:'load',siteId:p.siteId,cartId:p.cartId});
    const cart=await cartView(scope,p.siteId,p.cartId);
    return {plan,cart,trusted:validateMultiPlacePlan01551(plan,cart),cartFingerprint:checkoutCartFingerprint01553(cart)};
  };
  const initial=await read();
  const {plan,trusted}=initial;
  if(plan.savedRevision!==p.expectedPackingRevision||trusted.seats!==p.expectedPlaces||Math.abs(trusted.weightKg-p.expectedWeightKg)>.001)throw fail('NP_PREFLIGHT_PACKING_CHANGED_01553');
  if(cents(trusted.declaredValue)!==p.expectedDeclaredCents)throw fail('NP_PREFLIGHT_CART_CHANGED_01553');
  const result=await quote(scope,{siteId:p.siteId,cartId:p.cartId,cityRecipient:p.cityRecipient,warehouseRef:p.warehouseRef},{layout,cartView,clientId});
  // Carrier estimate is still provisional; a previously shown price is only a comparison value.
  if(result?.provider!=='nova-poshta'||result?.quoteBasis!=='server-cart-packing-01551'||result.estimated!==true||result.final!==false||result.canPlaceOrder!==false||result.orderReady!==false||result.waybillCreated!==false||result.fitUnverified!==true||result.currency!=='UAH'||cents(result.price)===null||cents(result.price)<=0)throw fail('NP_PREFLIGHT_QUOTE_INVALID_01553',502);
  const after=await read();
  if(after.cartFingerprint!==initial.cartFingerprint||after.plan.cartFingerprint!==plan.cartFingerprint||after.plan.savedRevision!==plan.savedRevision||after.plan.layoutStale||after.trusted.seats!==trusted.seats||Math.abs(after.trusted.weightKg-trusted.weightKg)>.001||cents(after.trusted.declaredValue)!==cents(trusted.declaredValue))throw fail('NP_PREFLIGHT_CART_CHANGED_01553');
  if(result.packingRevision!==plan.savedRevision||result.numberOfPackages!==trusted.seats||Math.abs(result.weightKg-trusted.weightKg)>.001||cents(result.declaredValue)!==cents(trusted.declaredValue))throw fail('NP_PREFLIGHT_QUOTE_INVALID_01553',502);
  if(cents(result.price)!==p.expectedPriceCents)throw fail('NP_PREFLIGHT_PRICE_CHANGED_01553');
  const amount=cents(trusted.declaredValue),delivery=cents(result.price);
  return Object.freeze({stage:'01553',preflightPassed:true,previewOnly:true,final:false,orderReady:false,canPlaceOrder:false,canPay:false,waybillCreated:false,fitUnverified:true,quoteBasis:'server-cart-packing-01551',provider:'nova-poshta',currency:'UAH',packingRevision:plan.savedRevision,numberOfPackages:trusted.seats,weightKg:trusted.weightKg,subtotal:amount/100,shippingCost:delivery/100,estimatedTotal:(amount+delivery)/100,checkedAt:new Date().toISOString(),...(includeDraftContext?{_draftContext:{cartFingerprint:after.cartFingerprint,packingFingerprint:after.plan.cartFingerprint,cart:after.cart,plan:after.plan}}:{})});
}
