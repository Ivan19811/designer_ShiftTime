// 01563 · Authenticated merchant-initiated carrier tariff recheck for a staged draft.
// This is an indicative getDocumentPrice quote, NOT a final carrier invoice or buyer consent.
// No cart writes, real orders, payment, inventory, TTN, CRM, or customer messaging.
import {isReviewManager01560} from './orders-review-workflow-01560.mjs';
import {getQuoteProfile01544} from './shipping-quote-service-01544.mjs';
import {requestNovaPoshtaQuote01544,isNovaPoshtaRef01544} from './nova-poshta-quote-01544.mjs';
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const draftPattern=/^orderdraft_[a-f0-9]{32}$/i;
const quoteRate01563=new Map();
export function assertRequoteLimit01563(storeId,userId,now=Date.now()){
 const bucket=Math.floor(now/60000),id=String(storeId)+':'+String(userId)+':'+bucket;
 for(const k of quoteRate01563.keys())if(!k.endsWith(':'+bucket))quoteRate01563.delete(k);
 const count=(quoteRate01563.get(id)||0)+1;if(count>6)throw fail('ORDERS_REQUOTE_RATE_LIMIT_01563',429);quoteRate01563.set(id,count);
}
const moneyCents=n=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<1000000000;
function authorize(scope,draftId){
 if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId||!isReviewManager01560(scope))throw fail('ORDERS_REQUOTE_FORBIDDEN_01563',403);
 if(!draftPattern.test(String(draftId||'')))throw fail('ORDERS_REQUOTE_DRAFT_INVALID_01563',400);
}
const currentQuery=`SELECT d.id AS draft_id,d.site_id,d.recipient_city_ref,d.recipient_warehouse_ref,d.cart_fingerprint,d.packing_fingerprint,
 d.subtotal_cents,d.provisional_delivery_cents,d.provisional_total_cents,d.total_weight_grams,d.number_of_packages,d.items,d.packages,
 r.cart_fingerprint AS review_cart_fingerprint,r.packing_fingerprint AS review_packing_fingerprint,r.provisional_total_cents AS review_total_cents
 FROM shifttime_checkout_drafts_01554 d JOIN shifttime_checkout_review_queue_01556 r
 ON r.draft_id=d.id AND r.store_id=d.store_id AND r.site_id=d.site_id
 WHERE d.id=$1 AND d.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 LIMIT 1`;
async function scopedDraft(db,scope,draftId,locked=false){
 const q=await db.query(currentQuery+(locked?' FOR UPDATE OF d, r':''),[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
 if(!q.rowCount)throw fail('ORDERS_REQUOTE_NOT_FOUND_01563',404);
 return q.rows[0];
}
export function verifyQuoteDraft01563(d){
 if(!d||!isNovaPoshtaRef01544(d.recipient_city_ref)||!isNovaPoshtaRef01544(d.recipient_warehouse_ref))throw fail('ORDERS_REQUOTE_RECIPIENT_INVALID_01563');
 if(!moneyCents(d.subtotal_cents)||!moneyCents(d.provisional_delivery_cents)||!moneyCents(d.provisional_total_cents)||Number(d.subtotal_cents)+Number(d.provisional_delivery_cents)!==Number(d.provisional_total_cents)||Number(d.provisional_total_cents)!==Number(d.review_total_cents))throw fail('ORDERS_REQUOTE_TOTAL_INVALID_01563');
 if(!Number.isSafeInteger(Number(d.total_weight_grams))||Number(d.total_weight_grams)<1||Number(d.total_weight_grams)>1000000||!Number.isSafeInteger(Number(d.number_of_packages))||Number(d.number_of_packages)<1||Number(d.number_of_packages)>100)throw fail('ORDERS_REQUOTE_PACKING_INVALID_01563');
 if(!d.cart_fingerprint||d.cart_fingerprint!==d.review_cart_fingerprint||!d.packing_fingerprint||d.packing_fingerprint!==d.review_packing_fingerprint)throw fail('ORDERS_REQUOTE_SNAPSHOT_INVALID_01563');
 const pkgs=Array.isArray(d.packages)?d.packages:[],items=Array.isArray(d.items)?d.items:[];
 if(pkgs.length!==Number(d.number_of_packages)||!items.length||items.length>200||pkgs.some(p=>!Number.isSafeInteger(Number(p.weightGrams))||Number(p.weightGrams)<1||!Array.isArray(p.dimensionsCm)||p.dimensionsCm.length!==3||p.dimensionsCm.some(n=>!Number.isFinite(Number(n))||Number(n)<=0||Number(n)>300))||pkgs.reduce((sum,p)=>sum+Number(p.weightGrams),0)!==Number(d.total_weight_grams))throw fail('ORDERS_REQUOTE_PACKING_INVALID_01563');
 return Object.freeze({draftId:String(d.draft_id),siteId:String(d.site_id),cityRecipient:d.recipient_city_ref,warehouseRef:d.recipient_warehouse_ref,subtotalCents:Number(d.subtotal_cents),oldShippingCents:Number(d.provisional_delivery_cents),weightKg:Number(d.total_weight_grams)/1000,seats:Number(d.number_of_packages),cartFingerprint:d.cart_fingerprint,packingFingerprint:d.packing_fingerprint});
}
const comparison=(a,b)=>a.draftId===b.draftId&&a.siteId===b.siteId&&a.subtotalCents===b.subtotalCents&&a.oldShippingCents===b.oldShippingCents&&a.weightKg===b.weightKg&&a.seats===b.seats&&a.cartFingerprint===b.cartFingerprint&&a.packingFingerprint===b.packingFingerprint&&a.cityRecipient===b.cityRecipient&&a.warehouseRef===b.warehouseRef;
export function quotePublic01563(row,basis,{replayed=false}={}){
 const price=Number(row.carrier_price_cents),old=basis.oldShippingCents,sub=basis.subtotalCents;
 return {stage:'01563',draftId:basis.draftId,siteId:basis.siteId,provider:'nova-poshta',currency:'UAH',tariffType:'carrier-estimate-not-final',estimated:true,final:false,price:price/100,oldPrice:old/100,delta:(price-old)/100,estimatedTotal:(sub+price)/100,oldEstimatedTotal:(sub+old)/100,numberOfPackages:basis.seats,weightKg:basis.weightKg,checkedAt:row.checked_at,expiresAt:row.expires_at,replayed,previewOnly:true,orderCreated:false,canCreateOrder:false,canPay:false,canCreateWaybill:false,canReserveInventory:false,canSyncCrm:false,buyerConfirmed:false};
}
// Stored estimate is an audit aid, not final proof. Expiry prevents indefinitely stale prices.
export async function getDraftRequote01563(scope,draftId,{lookup=withClient,clock=()=>Date.now()}={}){
 authorize(scope,draftId);
 return lookup(async db=>{
  const basis=verifyQuoteDraft01563(await scopedDraft(db,scope,draftId));
  const q=await db.query('SELECT carrier_price_cents,checked_at,expires_at,cart_fingerprint,packing_fingerprint,subtotal_cents,recipient_city_ref,recipient_warehouse_ref,total_weight_grams,number_of_packages,old_shipping_cents FROM shifttime_order_carrier_quotes_01563 WHERE draft_id=$1 AND store_id=$2',[draftId,scope.storeId]);
  const row=q.rows[0];
  const currentProfile=await db.query('SELECT sender_city_ref,enabled FROM shifttime_shipping_quote_profiles WHERE store_id=$1',[scope.storeId]);
  const profile=currentProfile.rows[0];
  const h=await db.query('SELECT id,old_shipping_cents,carrier_price_cents,checked_at FROM shifttime_order_carrier_quote_history_01563 WHERE draft_id=$1 AND store_id=$2 ORDER BY id DESC LIMIT 10',[draftId,scope.storeId]);
  const history=h.rows.map(x=>({at:x.checked_at,previous:Number(x.old_shipping_cents)/100,price:Number(x.carrier_price_cents)/100,delta:(Number(x.carrier_price_cents)-Number(x.old_shipping_cents))/100}));
  if(!row||!profile||profile.enabled!==true||row.sender_city_ref!==profile.sender_city_ref||row.cart_fingerprint!==basis.cartFingerprint||row.packing_fingerprint!==basis.packingFingerprint||Number(row.subtotal_cents)!==basis.subtotalCents||row.recipient_city_ref!==basis.cityRecipient||row.recipient_warehouse_ref!==basis.warehouseRef||Number(row.total_weight_grams)!==Math.round(basis.weightKg*1000)||Number(row.number_of_packages)!==basis.seats||Number(row.old_shipping_cents)!==basis.oldShippingCents||new Date(row.expires_at).getTime()<=clock())return {stage:'01563',draftId,available:false,history,estimated:true,final:false,previewOnly:true,canCreateOrder:false};
  return {...quotePublic01563(row,basis),available:true,history};
 });
}
export async function refreshDraftRequote01563(scope,draftId,{lookup=withClient,transaction=withTransaction,getProfile=getQuoteProfile01544,quote=requestNovaPoshtaQuote01544,clock=()=>Date.now()}={}){
 authorize(scope,draftId);
 // An explicit click is required. No background refreshing, and no direct browser NP credentials.
 const basis=await lookup(async db=>verifyQuoteDraft01563(await scopedDraft(db,scope,draftId)));
 assertRequoteLimit01563(scope.storeId,scope.userId,clock());
 const profile=await getProfile(scope.storeId);
 if(!profile?.configured||!profile.enabled)throw fail('ORDERS_REQUOTE_STORE_NOT_CONFIGURED_01563');
 const result=await quote({...profile,sampleParcelWeightKg:basis.weightKg,sampleSeats:basis.seats},{cityRecipient:basis.cityRecipient,warehouseRef:basis.warehouseRef,declaredValue:basis.subtotalCents/100});
 if(result?.provider!=='nova-poshta'||result?.currency!=='UAH'||result.estimated!==true||result.final!==false||result.canPlaceOrder!==false||!Number.isFinite(result.price)||!moneyCents(Math.round(result.price*100))||Math.abs(Math.round(result.price*100)-result.price*100)>0.00001)throw fail('ORDERS_REQUOTE_PROVIDER_INVALID_01563',502);
 const priceCents=Math.round(result.price*100);
 return transaction(async db=>{
  const fresh=verifyQuoteDraft01563(await scopedDraft(db,scope,draftId,true));
  const activeProfile=await db.query('SELECT sender_city_ref,enabled FROM shifttime_shipping_quote_profiles WHERE store_id=$1',[scope.storeId]);
  if(!activeProfile.rowCount||activeProfile.rows[0].enabled!==true||activeProfile.rows[0].sender_city_ref!==profile.senderCityRef)throw fail('ORDERS_REQUOTE_SENDER_CHANGED_01563');
  if(!comparison(basis,fresh))throw fail('ORDERS_REQUOTE_DRAFT_CHANGED_01563',409);
  // Short lifetime, no outbox/dispatch; never store PII or the API key.
  const checkedAt=new Date(clock()),expiresAt=new Date(checkedAt.getTime()+15*60*1000);
  const q=await db.query(`INSERT INTO shifttime_order_carrier_quotes_01563(draft_id,store_id,site_id,cart_fingerprint,packing_fingerprint,subtotal_cents,carrier_price_cents,checked_by_user_id,checked_at,expires_at,recipient_city_ref,recipient_warehouse_ref,sender_city_ref,total_weight_grams,number_of_packages,old_shipping_cents)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) ON CONFLICT(draft_id) DO UPDATE SET
   cart_fingerprint=EXCLUDED.cart_fingerprint,packing_fingerprint=EXCLUDED.packing_fingerprint,subtotal_cents=EXCLUDED.subtotal_cents,
   carrier_price_cents=EXCLUDED.carrier_price_cents,checked_by_user_id=EXCLUDED.checked_by_user_id,checked_at=EXCLUDED.checked_at,expires_at=EXCLUDED.expires_at,
   recipient_city_ref=EXCLUDED.recipient_city_ref,recipient_warehouse_ref=EXCLUDED.recipient_warehouse_ref,sender_city_ref=EXCLUDED.sender_city_ref,total_weight_grams=EXCLUDED.total_weight_grams,number_of_packages=EXCLUDED.number_of_packages,old_shipping_cents=EXCLUDED.old_shipping_cents
   WHERE shifttime_order_carrier_quotes_01563.store_id=EXCLUDED.store_id AND shifttime_order_carrier_quotes_01563.site_id=EXCLUDED.site_id
   RETURNING carrier_price_cents,checked_at,expires_at`,[draftId,scope.storeId,basis.siteId,basis.cartFingerprint,basis.packingFingerprint,basis.subtotalCents,priceCents,scope.userId,checkedAt,expiresAt,basis.cityRecipient,basis.warehouseRef,profile.senderCityRef,Math.round(basis.weightKg*1000),basis.seats,basis.oldShippingCents]);
  if(!q.rowCount)throw fail('ORDERS_REQUOTE_CONFLICT_01563');
  await db.query('INSERT INTO shifttime_order_carrier_quote_history_01563(draft_id,store_id,old_shipping_cents,carrier_price_cents,checked_by_user_id,checked_at) VALUES($1,$2,$3,$4,$5,$6)',[draftId,scope.storeId,basis.oldShippingCents,priceCents,scope.userId,checkedAt]);
  return {...quotePublic01563(q.rows[0],basis),available:true,history:[{at:checkedAt,previous:basis.oldShippingCents/100,price:priceCents/100,delta:(priceCents-basis.oldShippingCents)/100}]};
 });
}
