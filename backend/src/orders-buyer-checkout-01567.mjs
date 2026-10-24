// 01567 · Buyer-initiated real order from a short-lived accepted 01564 offer.
// Capability is kept in memory and provided only in POST body; no untrusted prices, customer data or SKU input.
import {randomUUID} from 'node:crypto';
import {digestOffer01564} from './orders-buyer-offer-01564.mjs';
import {validateProductionSnapshot01566,productionSnapshotQuery01566,productionPublicView01566} from './orders-production-01566.mjs';
const withTransaction=async(...a)=>(await import('./db.mjs')).withTransaction(...a);
const withClient=async(...a)=>(await import('./db.mjs')).withClient(...a);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const tokenPattern=/^[A-Za-z0-9_-]{43}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const tokenDigest=token=>{if(typeof token!=='string'||!tokenPattern.test(token))throw fail('BUYER_CHECKOUT_LINK_INVALID_01567',404);return digestOffer01564(token);};
export function validateBuyerPlacement01567(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(x=>!['token','requestId','confirmPlacement','acceptEstimatedShipping'].includes(x))||!UUID.test(String(input.requestId||''))||input.confirmPlacement!==true||input.acceptEstimatedShipping!==true)throw fail('BUYER_CHECKOUT_CONSENT_REQUIRED_01567',400);
 return {hash:tokenDigest(input.token),requestId:input.requestId};
}
const existingQuery=`SELECT * FROM shifttime_production_orders_01566 WHERE store_id=$1 AND source_draft_id=$2 LIMIT 1`;
const receipt=o=>({...productionPublicView01566(o),stage:'01567',buyerPlaced:true});
export async function placeBuyerOrder01567(input,{transaction=withTransaction,clock=()=>Date.now(),newId=randomUUID}={}){
 const args=validateBuyerPlacement01567(input);
 return transaction(async db=>{
  const reference=await db.query('SELECT draft_id,store_id FROM shifttime_order_buyer_offers_01564 WHERE token_hash=$1 LIMIT 1',[args.hash]);
  if(!reference.rowCount)throw fail('BUYER_CHECKOUT_LINK_INVALID_01567',404);
  const {draft_id:draftId,store_id:storeId}=reference.rows[0];
  // Same draft row lock as manager-created 01566 orders, ensuring no race or double order.
  const lock=await db.query('SELECT id FROM shifttime_checkout_drafts_01554 WHERE id=$1 AND store_id=$2 FOR UPDATE',[draftId,storeId]);
  if(!lock.rowCount)throw fail('BUYER_CHECKOUT_DRAFT_MISSING_01567',404);
  const snapshot=await db.query(productionSnapshotQuery01566+' WHERE o.token_hash=$1 LIMIT 1 FOR UPDATE OF o,r,q,c',[args.hash]);
  if(!snapshot.rowCount)throw fail('BUYER_CHECKOUT_LINK_INVALID_01567',404);
  const row=snapshot.rows[0];
  if(row.store_id!==storeId||row.draft_id!==draftId)throw fail('BUYER_CHECKOUT_SCOPE_MISMATCH_01567',403);
  if(row.revoked_at||!row.accepted_at||new Date(row.expires_at).getTime()<=clock())throw fail('BUYER_CHECKOUT_OFFER_EXPIRED_01567',410);
  const previous=await db.query(existingQuery,[storeId,draftId]);
  if(previous.rowCount){
   if(previous.rows[0].source_offer_id!==row.id)throw fail('BUYER_CHECKOUT_ALREADY_PLACED_01567',409);
   return {...receipt(previous.rows[0]),replayed:true};
  }
  const basis=validateProductionSnapshot01566(row,clock());
  // No change to manager workflow or prices: this is identical to 01566's stored offer snapshot.
  const proof=await db.query('SELECT verified_at FROM shifttime_order_buyer_email_challenges_01565 WHERE offer_id=$1 AND draft_id=$2 AND store_id=$3',[row.id,draftId,storeId]);
  const id=newId();if(!UUID.test(id))throw fail('BUYER_CHECKOUT_INTERNAL_01567',500);
  const serial=await db.query("SELECT nextval('shifttime_production_order_number_seq_01566')::bigint AS seq");
  const seq=Number(serial.rows[0]?.seq);if(!Number.isSafeInteger(seq)||seq<1)throw fail('BUYER_CHECKOUT_NUMBER_UNAVAILABLE_01567',503);
  const orderNumber='ST-'+String(seq).padStart(9,'0');
  const created=await db.query(`INSERT INTO shifttime_production_orders_01566
  (id,order_number,account_id,workspace_id,store_id,site_id,source_draft_id,source_offer_id,source_cart_id,created_by_manager_id,request_id,buyer_acknowledged_at,email_possession_verified,cart_fingerprint,packing_fingerprint,items,packages,number_of_packages,total_weight_grams,recipient_city_ref,recipient_warehouse_ref,subtotal_cents,delivery_cents,total_cents,placement_channel)
  VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,NULL,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19,$20,$21,$22,$23,'buyer_link') RETURNING *`,
  [id,orderNumber,row.draft_account_id,row.draft_workspace_id,storeId,row.site_id,draftId,row.id,row.source_cart_id,args.requestId,row.accepted_at,Boolean(proof.rows[0]?.verified_at),basis.cartFingerprint,basis.packingFingerprint,JSON.stringify(row.draft_items),JSON.stringify(row.packages),basis.seats,Number(row.total_weight_grams),row.recipient_city_ref,row.recipient_warehouse_ref,basis.subtotalCents,basis.deliveryCents,basis.totalCents]);
  await db.query(`INSERT INTO shifttime_production_order_contacts_01566(order_id,store_id,source_draft_id,iv_b64,ciphertext_b64,tag_b64,contacts_digest) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,storeId,draftId,row.contacts_iv_b64,row.contacts_ciphertext_b64,row.contacts_tag_b64,row.contacts_digest]);
  await db.query(`INSERT INTO shifttime_production_order_events_01566(order_id,store_id,actor_user_id,event_type,details) VALUES($1,$2,NULL,'order_created',$3::jsonb)`,[id,storeId,JSON.stringify({placement:'buyer_link',carrierEstimate:true,paymentInitiated:false,waybillCreated:false,crmSent:false})]);
  return {...receipt(created.rows[0]),replayed:false};
 });
}
// Limited one-time capability receipt. Returns no contacts, decryptable payload or bearer token.
export async function buyerOrderStatus01567(token,{lookup=withClient,clock=()=>Date.now()}={}){
 const hash=tokenDigest(token);
 return lookup(async db=>{
  const ref=await db.query('SELECT id,store_id,draft_id,expires_at,revoked_at FROM shifttime_order_buyer_offers_01564 WHERE token_hash=$1 LIMIT 1',[hash]);
  if(!ref.rowCount)throw fail('BUYER_CHECKOUT_LINK_INVALID_01567',404);
  const offer=ref.rows[0];if(offer.revoked_at||new Date(offer.expires_at).getTime()+86400000<=clock())throw fail('BUYER_CHECKOUT_LINK_EXPIRED_01567',410);
  const found=await db.query('SELECT * FROM shifttime_production_orders_01566 WHERE store_id=$1 AND source_offer_id=$2 AND source_draft_id=$3 LIMIT 1',[offer.store_id,offer.id,offer.draft_id]);
  return {stage:'01567',found:Boolean(found.rowCount),order:found.rowCount?receipt(found.rows[0]):null};
 });
}
