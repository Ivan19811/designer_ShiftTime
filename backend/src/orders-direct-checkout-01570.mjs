// 01570 · Customer checkout directly from a canonical Store cart.
// No manager proposal, payment, stock reservation, CRM delivery or TTN required.
// All pricing, catalog contents, packing and shipping estimates are resolved by Render.
import {randomUUID} from 'node:crypto';
import {cartPackingLayout01549} from './shipping-packing-layout-01549.mjs';
import {shopCartView01535} from './marketplace-shop-cart-service-01535.mjs';
import {previewCartMultiPlaceQuote01551,validateMultiPlacePlan01551} from './shipping-multiplace-quote-01551.mjs';
import {checkoutCartFingerprint01553} from './shipping-checkout-preflight-01553.mjs';
import {lockedSnapshot01554} from './shipping-checkout-draft-01554.mjs';
import {validateCheckoutContacts01555,sealCheckoutContacts01555,contactEncryptionKey01555} from './shipping-checkout-contacts-01555.mjs';
import {productionPublicView01566} from './orders-production-01566.mjs';
import {isNovaPoshtaRef01544} from './nova-poshta-quote-01544.mjs';
const withTransaction=async(...args)=>(await import('./db.mjs')).withTransaction(...args);
const withClient=async(...args)=>(await import('./db.mjs')).withClient(...args);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const uid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const cartPattern=/^cart_[a-z0-9]{24,48}$/i;
const sitePattern=/^[-\w:]{1,160}$/;
const cents=value=>Number.isFinite(Number(value))&&Math.abs(Number(value)*100-Math.round(Number(value)*100))<0.00001?Math.round(Number(value)*100):NaN;
const sourceDraftId=()=>`orderdraft_${randomUUID().replaceAll('-','')}`;
export function validateDirectCheckout01570(scope,cartId,input){
 if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!sitePattern.test(String(scope.siteId||''))||!cartPattern.test(String(cartId||'')))throw fail('DIRECT_CHECKOUT_SCOPE_INVALID_01570',403);
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['requestId','cityRecipient','warehouseRef','contacts','acceptEstimatedDelivery','expectedDeliveryCents'].includes(k))||!uid.test(String(input.requestId||''))||input.acceptEstimatedDelivery!==true)throw fail('DIRECT_CHECKOUT_REQUEST_INVALID_01570',400);
 if(!Number.isSafeInteger(input.expectedDeliveryCents)||input.expectedDeliveryCents<=0||input.expectedDeliveryCents>1000000000)throw fail('DIRECT_CHECKOUT_PRICE_REQUIRED_01570',400);
 if(!isNovaPoshtaRef01544(input.cityRecipient)||!isNovaPoshtaRef01544(input.warehouseRef))throw fail('DIRECT_CHECKOUT_DESTINATION_INVALID_01570',400);
 if(!input.contacts||Object.keys(input.contacts).some(k=>!['firstName','phone','email','comment'].includes(k)))throw fail('DIRECT_CHECKOUT_CONTACTS_INVALID_01570',400);
 // 01555 validation is the single canonical validation for phone, optional email and name.
 const contacts=validateCheckoutContacts01555({draftId:'orderdraft_'+'0'.repeat(32),siteId:scope.siteId,confirmed:true,...input.contacts}).contacts;
 return {requestId:input.requestId,expectedDeliveryCents:input.expectedDeliveryCents,cityRecipient:input.cityRecipient,warehouseRef:input.warehouseRef,contacts};
}
export async function trustedDirectCheckout01570(scope,cartId,input,{packing=cartPackingLayout01549,cartView=shopCartView01535,quote=previewCartMultiPlaceQuote01551}={}){
 const plan=await packing(scope,{action:'load',siteId:scope.siteId,cartId});
 const cart=await cartView(scope,scope.siteId,cartId);
 const trusted=validateMultiPlacePlan01551(plan,cart);
 const fingerprint=checkoutCartFingerprint01553(cart);
 const result=await quote(scope,{siteId:scope.siteId,cartId,cityRecipient:input.cityRecipient,warehouseRef:input.warehouseRef});
 if(result.provider!=='nova-poshta'||result.quoteBasis!=='server-cart-packing-01551'||result.estimated!==true||result.final!==false||result.currency!=='UAH'||result.packingRevision!==plan.savedRevision||result.numberOfPackages!==trusted.seats||Math.abs(result.weightKg-trusted.weightKg)>.001||cents(result.declaredValue)!==cents(trusted.declaredValue)||!Number.isSafeInteger(cents(result.price))||cents(result.price)<=0)throw fail('DIRECT_CHECKOUT_QUOTE_INVALID_01570',502);
 const replan=await packing(scope,{action:'load',siteId:scope.siteId,cartId});
 const recart=await cartView(scope,scope.siteId,cartId);
 if(replan.layoutStale||replan.savedRevision!==plan.savedRevision||replan.cartFingerprint!==plan.cartFingerprint||checkoutCartFingerprint01553(recart)!==fingerprint)throw fail('DIRECT_CHECKOUT_CART_CHANGED_01570');
 const subtotal=cents(trusted.declaredValue),delivery=cents(result.price);
 if(subtotal<100||subtotal>1000000000||delivery<1||delivery>1000000000||subtotal+delivery>1000000000)throw fail('DIRECT_CHECKOUT_AMOUNTS_INVALID_01570');
 return {plan,cart,ctx:{plan,cart,cartFingerprint:fingerprint,packingFingerprint:plan.cartFingerprint},trusted,subtotal,delivery,total:subtotal+delivery};
}
const safe=record=>({...productionPublicView01566(record),stage:'01570',orderCreated:true,estimatedCarrierPrice:true,placementChannel:'direct_checkout',noPaymentTaken:true});
export async function placeDirectCheckout01570(scope,cartId,input,{transaction=withTransaction,clock=()=>Date.now(),newId=randomUUID,newDraftId=sourceDraftId,keyProvider=contactEncryptionKey01555,readTrusted=trustedDirectCheckout01570,locked=lockedSnapshot01554,findExisting=async(s,c)=>withClient(async db=>(await db.query("SELECT * FROM shifttime_production_orders_01566 WHERE store_id=$1 AND site_id=$2 AND source_cart_id=$3 LIMIT 1",[s.storeId,s.siteId,c])).rows[0]||null)}={}){
 const data=validateDirectCheckout01570(scope,cartId,input);
 const prior=await findExisting(scope,cartId);
 if(prior){if(prior.placement_channel!=='direct_checkout')throw fail('DIRECT_CHECKOUT_ALREADY_ORDERED_01570');return {...safe(prior),replayed:true};}
 const before=await readTrusted(scope,cartId,data);
 if(before.delivery!==data.expectedDeliveryCents)throw fail('DIRECT_CHECKOUT_PRICE_CHANGED_01570');
 return transaction(async db=>{
  // All changes to this canonical cart acquire the same marketplace_carts lock.
  const lockedCart=await db.query(`SELECT id,status,currency FROM marketplace_carts WHERE id=$1 AND marketplace_id='marketplace_shifttime' FOR UPDATE`,[cartId]);
  if(!lockedCart.rowCount||lockedCart.rows[0].status!=='active'||lockedCart.rows[0].currency!=='UAH')throw fail('DIRECT_CHECKOUT_CART_INVALID_01570');
  const existing=await db.query(`SELECT * FROM shifttime_production_orders_01566 WHERE store_id=$1 AND site_id=$2 AND source_cart_id=$3 LIMIT 1`,[scope.storeId,scope.siteId,cartId]);
  if(existing.rowCount){
    if(existing.rows[0].placement_channel!=='direct_checkout')throw fail('DIRECT_CHECKOUT_ALREADY_ORDERED_01570');
    return {...safe(existing.rows[0]),replayed:true};
  }
  const p={siteId:scope.siteId,cartId,expectedPackingRevision:before.plan.savedRevision,expectedPlaces:before.trusted.seats,expectedWeightKg:before.trusted.weightKg,expectedDeclaredCents:before.subtotal};
  const items=await locked(db,scope,p,before.ctx);
  const id=newId(),draftId=newDraftId();
  if(!uid.test(id)||!/^orderdraft_[a-f0-9]{32}$/i.test(draftId))throw fail('DIRECT_CHECKOUT_INTERNAL_ID_01570',500);
  const seqResult=await db.query("SELECT nextval('shifttime_production_order_number_seq_01566')::bigint AS seq");
  const seq=Number(seqResult.rows[0]?.seq);
  if(!Number.isSafeInteger(seq)||seq<1)throw fail('DIRECT_CHECKOUT_NUMBER_UNAVAILABLE_01570',503);
  const packages=before.plan.packages.map((p,i)=>({number:i+1,packageId:p.id,mainItemId:p.main.itemId,accessoryItemIds:p.accessories.map(a=>a.itemId),dimensionsCm:p.dimensions,weightGrams:Math.round(p.weightKg*1000)}));
  const orderNumber='ST-'+String(seq).padStart(9,'0');
  const created=await db.query(`INSERT INTO shifttime_production_orders_01566 (id,order_number,account_id,workspace_id,store_id,site_id,source_draft_id,source_offer_id,source_cart_id,created_by_manager_id,request_id,buyer_acknowledged_at,email_possession_verified,cart_fingerprint,packing_fingerprint,items,packages,number_of_packages,total_weight_grams,recipient_city_ref,recipient_warehouse_ref,subtotal_cents,delivery_cents,total_cents,placement_channel)
    VALUES($1,$2,$3,$4,$5,$6,$7,NULL,$8,NULL,$9,to_timestamp($10/1000.0),false,$11,$12,$13::jsonb,$14::jsonb,$15,$16,$17,$18,$19,$20,$21,'direct_checkout') RETURNING *`,
    [id,orderNumber,scope.accountId,scope.workspaceId,scope.storeId,scope.siteId,draftId,cartId,data.requestId,clock(),before.ctx.cartFingerprint,before.ctx.packingFingerprint,JSON.stringify(items),JSON.stringify(packages),packages.length,Math.round(before.trusted.weightKg*1000),data.cityRecipient,data.warehouseRef,before.subtotal,before.delivery,before.total]);
  const key=keyProvider();
  const sealed=sealCheckoutContacts01555(data.contacts,{storeId:scope.storeId,siteId:scope.siteId,draftId},key);
  await db.query(`INSERT INTO shifttime_production_order_contacts_01566 (order_id,store_id,source_draft_id,iv_b64,ciphertext_b64,tag_b64,contacts_digest) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,scope.storeId,draftId,sealed.iv,sealed.data,sealed.tag,sealed.digest]);
  await db.query(`INSERT INTO shifttime_production_order_events_01566 (order_id,store_id,actor_user_id,event_type,details) VALUES($1,$2,NULL,'order_created',$3::jsonb)`,[id,scope.storeId,JSON.stringify({placement:'direct_checkout',carrierEstimate:true,paymentInitiated:false,waybillCreated:false,crmSent:false})]);
  return {...safe(created.rows[0]),replayed:false};
 });
}
export async function directCheckoutStatus01570(scope,cartId,{lookup=withClient}={}){
 if(!scope?.storeId||!sitePattern.test(String(scope.siteId||''))||!cartPattern.test(String(cartId||'')))throw fail('DIRECT_CHECKOUT_SCOPE_INVALID_01570',403);
 return lookup(async db=>{const q=await db.query(`SELECT * FROM shifttime_production_orders_01566 WHERE store_id=$1 AND site_id=$2 AND source_cart_id=$3 ORDER BY created_at DESC LIMIT 1`,[scope.storeId,scope.siteId,cartId]);const r=q.rows[0];return {stage:'01570',found:Boolean(q.rowCount),order:r?{stage:'01570',orderCreated:true,orderNumber:String(r.order_number),orderStatus:String(r.order_status),placementChannel:String(r.placement_channel||'manager'),total:Number(r.total_cents)/100,currency:'UAH',numberOfPackages:Number(r.number_of_packages)}:null};});
}
