// 01564 · Explicit store-price proposal and bearer-link buyer acknowledgement.
// Acknowledgement is NOT identity verification, final carrier invoice, order, payment or TTN.
import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {isReviewManager01560} from './orders-review-workflow-01560.mjs';
import {verifyQuoteDraft01563} from './orders-carrier-requote-01563.mjs';
const withClient=async (...a)=>(await import('./db.mjs')).withClient(...a);
const withTransaction=async (...a)=>(await import('./db.mjs')).withTransaction(...a);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const draftRE=/^orderdraft_[a-f0-9]{32}$/i;
const tokenRE=/^[A-Za-z0-9_-]{43}$/;
const digest=token=>createHash('sha256').update('ST-ORDERS-OFFER-01564:'+token).digest('hex');
const money=n=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<1000000000;
function requireManager(scope,draftId){if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId||!isReviewManager01560(scope))throw fail('ORDERS_OFFER_ACCESS_DENIED_01564',403);if(!draftRE.test(String(draftId||'')))throw fail('ORDERS_OFFER_DRAFT_INVALID_01564',400);}
const snapshotQuery=`SELECT d.id AS draft_id,d.store_id,d.site_id,d.recipient_city_ref,d.recipient_warehouse_ref,d.cart_fingerprint,d.packing_fingerprint,
 d.subtotal_cents,d.provisional_delivery_cents,d.provisional_total_cents,d.total_weight_grams,d.number_of_packages,d.items,d.packages,
 r.cart_fingerprint AS review_cart_fingerprint,r.packing_fingerprint AS review_packing_fingerprint,r.provisional_total_cents AS review_total_cents,
 q.carrier_price_cents,q.checked_at AS carrier_checked_at,q.expires_at AS carrier_expires_at,q.sender_city_ref AS quote_sender_city_ref,
 q.old_shipping_cents AS quote_old_shipping_cents,q.cart_fingerprint AS quote_cart_fingerprint,q.packing_fingerprint AS quote_packing_fingerprint,q.subtotal_cents AS quote_subtotal_cents,
 q.recipient_city_ref AS quote_recipient_city_ref,q.recipient_warehouse_ref AS quote_recipient_warehouse_ref,
 q.total_weight_grams AS quote_weight_grams,q.number_of_packages AS quote_seats,
 s.sender_city_ref AS active_sender_city_ref,s.enabled AS shipping_enabled,
 COALESCE(w.status,'awaiting_review') AS workflow_status,
 EXISTS(SELECT 1 FROM shifttime_checkout_contacts_01555 c WHERE c.draft_id=d.id AND c.store_id=d.store_id AND c.site_id=d.site_id AND c.created_by_user_id=d.created_by_user_id AND c.expires_at>now()) AS contacts_current
 FROM shifttime_checkout_drafts_01554 d
 JOIN shifttime_checkout_review_queue_01556 r ON r.draft_id=d.id AND r.store_id=d.store_id AND r.site_id=d.site_id
 JOIN shifttime_order_carrier_quotes_01563 q ON q.draft_id=d.id AND q.store_id=d.store_id AND q.site_id=d.site_id
 JOIN shifttime_shipping_quote_profiles s ON s.store_id=d.store_id
 LEFT JOIN shifttime_orders_review_workflow_01560 w ON w.draft_id=d.id AND w.store_id=d.store_id`;
function verifyCurrent(row,now=Date.now()){
 const basis=verifyQuoteDraft01563(row);
 if(!row.contacts_current)throw fail('ORDERS_OFFER_CONTACTS_EXPIRED_01564');
 if(row.workflow_status!=='ready_for_manual_followup')throw fail('ORDERS_OFFER_MANAGER_STATUS_01564');
 if(row.shipping_enabled!==true||row.active_sender_city_ref!==row.quote_sender_city_ref)throw fail('ORDERS_OFFER_SENDER_CHANGED_01564');
 if(row.cart_fingerprint!==row.quote_cart_fingerprint||row.packing_fingerprint!==row.quote_packing_fingerprint||Number(row.subtotal_cents)!==Number(row.quote_subtotal_cents)||row.recipient_city_ref!==row.quote_recipient_city_ref||row.recipient_warehouse_ref!==row.quote_recipient_warehouse_ref||Number(row.total_weight_grams)!==Number(row.quote_weight_grams)||Number(row.number_of_packages)!==Number(row.quote_seats))throw fail('ORDERS_OFFER_QUOTE_CHANGED_01564');
 if(Number(row.quote_old_shipping_cents)!==basis.oldShippingCents)throw fail('ORDERS_OFFER_PREVIOUS_PRICE_CHANGED_01564');
 if(!money(row.carrier_price_cents)||new Date(row.carrier_expires_at).getTime()<=now||new Date(row.carrier_checked_at).getTime()>now+60_000)throw fail('ORDERS_OFFER_QUOTE_EXPIRED_01564');
 return {...basis,deliveryCents:Number(row.carrier_price_cents),totalCents:basis.subtotalCents+Number(row.carrier_price_cents),quoteCheckedAt:new Date(row.carrier_checked_at).getTime(),quoteExpiresAt:new Date(row.carrier_expires_at).getTime()};
}
const details=(row,now=Date.now())=>({stage:'01564',offerId:row.id,expiresAt:row.expires_at,subtotal:Number(row.subtotal_cents)/100,delivery:Number(row.delivery_cents)/100,total:Number(row.total_cents)/100,currency:'UAH',numberOfPackages:Number(row.number_of_packages),items:Array.isArray(row.items)?row.items:[],status:row.revoked_at?'revoked':row.accepted_at?'acknowledged':new Date(row.expires_at).getTime()<=now?'expired':'awaiting_acknowledgement',acceptedAt:row.accepted_at||null,disclaimerType:'store-price-proposal-carrier-estimate',carrierFinal:false,identityVerified:false,previewOnly:true,orderCreated:false,canCreateOrder:false,canPay:false,canCreateWaybill:false,canSyncCrm:false});
function publicItems(raw){return (Array.isArray(raw)?raw:[]).slice(0,200).map(i=>({title:String(i.title||i.name||'').slice(0,180),quantity:Number(i.quantity)||0,lineTotal:Number.isFinite(Number(i.lineTotal))?Number(i.lineTotal):Number(i.lineTotalCents||0)/100}));}
function assertOfferMatches(o,row,now){const basis=verifyCurrent(row,now);if(o.cart_fingerprint!==basis.cartFingerprint||o.packing_fingerprint!==basis.packingFingerprint||o.site_id!==basis.siteId||Number(o.subtotal_cents)!==basis.subtotalCents||Number(o.delivery_cents)!==basis.deliveryCents||Number(o.total_cents)!==basis.totalCents||Number(o.number_of_packages)!==basis.seats||new Date(o.offer_carrier_checked_at).getTime()!==basis.quoteCheckedAt)throw fail('ORDERS_OFFER_SOURCE_CHANGED_01564');return basis;}
export async function createBuyerOffer01564(scope,draftId,{transaction=withTransaction,clock=()=>Date.now(),newToken=()=>randomBytes(32).toString('base64url')}={}){
 requireManager(scope,draftId);
 return transaction(async db=>{
  const snap=await db.query(snapshotQuery+' WHERE d.id=$1 AND d.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 FOR UPDATE OF d,r,q',[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
  if(!snap.rowCount)throw fail('ORDERS_OFFER_NOT_FOUND_01564',404);
  const basis=verifyCurrent(snap.rows[0],clock());const expiresAt=new Date(Math.min(basis.quoteExpiresAt,clock()+15*60_000));
  if(expiresAt.getTime()<=clock()+30_000)throw fail('ORDERS_OFFER_QUOTE_TOO_OLD_01564');
  const token=newToken();if(!tokenRE.test(token))throw fail('ORDERS_OFFER_TOKEN_INVALID_01564',500);
  // Revoking the previous link is intentional. A replaced accepted offer does not create an order.
  await db.query('UPDATE shifttime_order_buyer_offers_01564 SET revoked_at=now() WHERE draft_id=$1 AND store_id=$2 AND revoked_at IS NULL',[draftId,scope.storeId]);
  const id=randomUUID();
  await db.query(`INSERT INTO shifttime_order_buyer_offers_01564
   (id,draft_id,store_id,site_id,token_hash,cart_fingerprint,packing_fingerprint,carrier_checked_at,subtotal_cents,delivery_cents,total_cents,number_of_packages,items,created_by_user_id,expires_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,[id,draftId,scope.storeId,basis.siteId,digest(token),basis.cartFingerprint,basis.packingFingerprint,new Date(basis.quoteCheckedAt),basis.subtotalCents,basis.deliveryCents,basis.totalCents,basis.seats,JSON.stringify(publicItems(snap.rows[0].items)),scope.userId,expiresAt]);
  return {stage:'01564',draftId,offerId:id,token,expiresAt,subtotal:basis.subtotalCents/100,delivery:basis.deliveryCents/100,total:basis.totalCents/100,previewOnly:true,carrierFinal:false,canCreateOrder:false};
 });
}
export async function getBuyerOfferStatus01564(scope,draftId,{lookup=withClient}={}){
 requireManager(scope,draftId);
 return lookup(async db=>{const q=await db.query(`SELECT o.* FROM shifttime_order_buyer_offers_01564 o JOIN shifttime_checkout_drafts_01554 d ON d.id=o.draft_id AND d.store_id=o.store_id WHERE o.draft_id=$1 AND o.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 ORDER BY o.created_at DESC LIMIT 1`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);return {stage:'01564',draftId,available:Boolean(q.rowCount),...(q.rowCount?{offer:details(q.rows[0])}:{}),previewOnly:true,canCreateOrder:false};});
}
// Query deliberately derives from the same cross-table snapshot as manager creation.
const buyerSelect=`SELECT o.*,o.carrier_checked_at AS offer_carrier_checked_at,d.id AS draft_id,d.recipient_city_ref,d.recipient_warehouse_ref,d.cart_fingerprint,d.packing_fingerprint,d.subtotal_cents AS draft_subtotal_cents,d.provisional_delivery_cents,d.provisional_total_cents,d.total_weight_grams,d.number_of_packages AS draft_number_of_packages,d.items AS draft_items,d.packages,
 r.cart_fingerprint AS review_cart_fingerprint,r.packing_fingerprint AS review_packing_fingerprint,r.provisional_total_cents AS review_total_cents,
 q.carrier_price_cents,q.checked_at AS carrier_checked_at,q.expires_at AS carrier_expires_at,q.sender_city_ref AS quote_sender_city_ref,q.old_shipping_cents AS quote_old_shipping_cents,q.cart_fingerprint AS quote_cart_fingerprint,q.packing_fingerprint AS quote_packing_fingerprint,q.subtotal_cents AS quote_subtotal_cents,q.recipient_city_ref AS quote_recipient_city_ref,q.recipient_warehouse_ref AS quote_recipient_warehouse_ref,q.total_weight_grams AS quote_weight_grams,q.number_of_packages AS quote_seats,
 s.sender_city_ref AS active_sender_city_ref,s.enabled AS shipping_enabled,COALESCE(w.status,'awaiting_review') AS workflow_status,
 EXISTS(SELECT 1 FROM shifttime_checkout_contacts_01555 c WHERE c.draft_id=d.id AND c.store_id=d.store_id AND c.site_id=d.site_id AND c.created_by_user_id=d.created_by_user_id AND c.expires_at>now()) AS contacts_current
 FROM shifttime_order_buyer_offers_01564 o JOIN shifttime_checkout_drafts_01554 d ON d.id=o.draft_id AND d.store_id=o.store_id AND d.site_id=o.site_id
 JOIN shifttime_checkout_review_queue_01556 r ON r.draft_id=d.id AND r.store_id=d.store_id
 JOIN shifttime_order_carrier_quotes_01563 q ON q.draft_id=d.id AND q.store_id=d.store_id
 JOIN shifttime_shipping_quote_profiles s ON s.store_id=d.store_id
 LEFT JOIN shifttime_orders_review_workflow_01560 w ON w.draft_id=d.id AND w.store_id=d.store_id`;
// Overlapping column aliases from the offer are normalized to draft fields for the existing validator.
function buyerBasis(r){return {...r,subtotal_cents:r.draft_subtotal_cents,number_of_packages:r.draft_number_of_packages,items:r.draft_items,site_id:r.site_id,draft_id:r.draft_id};}
function requireToken(token){if(typeof token!=='string'||!tokenRE.test(token))throw fail('ORDERS_OFFER_LINK_INVALID_01564',404);return digest(token);}
const publicRate=new Map();
export function enforceOfferRate01564(ip,clock=()=>Date.now()){
 const minute=Math.floor(clock()/60000),key=String(ip||'unknown').slice(0,120)+':'+minute;
 for(const k of publicRate.keys())if(!k.endsWith(':'+minute))publicRate.delete(k);
 const global='global:'+minute;const globalCount=(publicRate.get(global)||0)+1;publicRate.set(global,globalCount);if(globalCount>600)throw fail('ORDERS_OFFER_TOO_MANY_REQUESTS_01564',429);
 const count=(publicRate.get(key)||0)+1;publicRate.set(key,count);if(count>30)throw fail('ORDERS_OFFER_TOO_MANY_REQUESTS_01564',429);
}
export async function previewBuyerOffer01564(token,{lookup=withClient,clock=()=>Date.now()}={}){
 const hash=requireToken(token);
 return lookup(async db=>{const q=await db.query(buyerSelect+' WHERE o.token_hash=$1 LIMIT 1',[hash]);if(!q.rowCount)throw fail('ORDERS_OFFER_LINK_INVALID_01564',404);
  const o=q.rows[0];if(o.revoked_at||new Date(o.expires_at).getTime()<=clock())throw fail('ORDERS_OFFER_EXPIRED_01564',410);
  if(!o.accepted_at)assertOfferMatches(o,buyerBasis(o),clock());
  return {...details(o,clock()),items:publicItems(o.items),available:true};
 });
}
export async function acknowledgeBuyerOffer01564(token,acknowledge,{transaction=withTransaction,clock=()=>Date.now()}={}){
 const hash=requireToken(token);if(acknowledge!==true)throw fail('ORDERS_OFFER_EXPLICIT_ACK_REQUIRED_01564',400);
 return transaction(async db=>{
  const q=await db.query(buyerSelect+' WHERE o.token_hash=$1 LIMIT 1 FOR UPDATE OF o,d,r,q',[hash]);if(!q.rowCount)throw fail('ORDERS_OFFER_LINK_INVALID_01564',404);
  const o=q.rows[0];if(o.revoked_at||new Date(o.expires_at).getTime()<=clock())throw fail('ORDERS_OFFER_EXPIRED_01564',410);
  // Acknowledgement is irrevocable for the same link; never silently rewrites its terms.
  if(o.accepted_at)return {...details(o,clock()),items:publicItems(o.items),alreadyAcknowledged:true};
  assertOfferMatches(o,buyerBasis(o),clock());
  const saved=await db.query('UPDATE shifttime_order_buyer_offers_01564 SET accepted_at=now() WHERE id=$1 AND accepted_at IS NULL AND revoked_at IS NULL RETURNING *',[o.id]);
  if(!saved.rowCount)throw fail('ORDERS_OFFER_CONFLICT_01564');
  return {...details(saved.rows[0],clock()),items:publicItems(o.items),alreadyAcknowledged:false};
 });
}
