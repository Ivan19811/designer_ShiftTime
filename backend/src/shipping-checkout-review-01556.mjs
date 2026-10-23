// 01556 · Prepare an authenticated CHECKOUT DRAFT for MANUAL review only.
// The CRM outbox is intentionally disabled. No real order, payment, stock reservation, PII disclosure or TTN.
import {checkoutPreflight01553} from './shipping-checkout-preflight-01553.mjs';
import {lockedSnapshot01554} from './shipping-checkout-draft-01554.mjs';
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const draftPattern=/^orderdraft_[a-f0-9]{32}$/i;
const sitePattern=/^[-\w:]{1,160}$/;
const cents=n=>Math.round(Number(n)*100);
export function validateDraftReview01556(input){
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['draftId','siteId','acknowledgeProvisional'].includes(k)))throw fail('NP_REVIEW_INPUT_INVALID_01556',400);
  if(!draftPattern.test(String(input.draftId||''))||!sitePattern.test(String(input.siteId||''))||input.acknowledgeProvisional!==true)throw fail('NP_REVIEW_CONFIRMATION_REQUIRED_01556',400);
  return {draftId:input.draftId,siteId:input.siteId};
}
export function reviewResponse01556(row,{replayed=false}={}){
  return {stage:'01556',draftId:row.draft_id,state:'awaiting_manual_review',replayed,contactsEncrypted:true,previewOnly:true,final:false,canPlaceOrder:false,canPay:false,orderCreated:false,waybillCreated:false,crmSynced:false,crmDeliveryEnabled:false,crmSyncState:'not_sent',paymentState:'not_started',shippingState:'not_booked',priceProvisional:true,preparedAt:row.created_at};
}
export async function prepareDraftReview01556(scope,input,{transaction=withTransaction,preflight=checkoutPreflight01553,snapshot=lockedSnapshot01554,clock=()=>Date.now()}={}){
  if(!scope?.storeId||!scope?.userId||!scope?.accountId||!scope?.workspaceId)throw fail('NP_REVIEW_SCOPE_REQUIRED_01556',403);
  const args=validateDraftReview01556(input);
  // The first read is scoped, and the following transactional re-read is locked to avoid TOCTOU.
  const draft=await transaction(async db=>{
    const r=await db.query(`SELECT * FROM shifttime_checkout_drafts_01554 WHERE id=$1 AND store_id=$2 AND account_id=$3 AND workspace_id=$4 AND created_by_user_id=$5 AND site_id=$6 FOR SHARE`,[args.draftId,scope.storeId,scope.accountId,scope.workspaceId,scope.userId,args.siteId]);
    if(!r.rowCount||r.rows[0].state!=='draft')throw fail('NP_REVIEW_DRAFT_NOT_FOUND_01556',404);
    return r.rows[0];
  });
  if(clock()-new Date(draft.created_at).getTime()>24*3600_000)throw fail('NP_REVIEW_DRAFT_EXPIRED_01556');
  const p={siteId:draft.site_id,cartId:draft.cart_id,cityRecipient:draft.recipient_city_ref,warehouseRef:draft.recipient_warehouse_ref,expectedPackingRevision:Number(draft.packing_revision),expectedPlaces:Number(draft.number_of_packages),expectedPrice:Number(draft.provisional_delivery_cents)/100,expectedWeightKg:Number(draft.total_weight_grams)/1000,expectedDeclaredValue:Number(draft.subtotal_cents)/100};
  // A trusted server preflight refreshes cart, packing and provisional carrier estimate.
  const verified=await preflight(scope,p,{includeDraftContext:true});
  if(!verified?.preflightPassed||!verified?._draftContext||verified.canPlaceOrder!==false||cents(verified.shippingCost)!==Number(draft.provisional_delivery_cents)||cents(verified.subtotal)!==Number(draft.subtotal_cents)||cents(verified.estimatedTotal)!==Number(draft.provisional_total_cents))throw fail('NP_REVIEW_PRICE_OR_CART_CHANGED_01556');
  return transaction(async db=>{
    const q=await db.query(`SELECT * FROM shifttime_checkout_drafts_01554 WHERE id=$1 AND store_id=$2 AND account_id=$3 AND workspace_id=$4 AND created_by_user_id=$5 AND site_id=$6 FOR UPDATE`,[args.draftId,scope.storeId,scope.accountId,scope.workspaceId,scope.userId,args.siteId]);
    if(!q.rowCount||q.rows[0].state!=='draft')throw fail('NP_REVIEW_DRAFT_NOT_FOUND_01556',404);
    const locked=q.rows[0];
    if(clock()-new Date(locked.created_at).getTime()>24*3600_000||JSON.stringify([locked.request_hash,locked.cart_fingerprint,locked.packing_fingerprint,locked.packing_revision,locked.provisional_delivery_cents,locked.subtotal_cents,locked.provisional_total_cents])!==JSON.stringify([draft.request_hash,draft.cart_fingerprint,draft.packing_fingerprint,draft.packing_revision,draft.provisional_delivery_cents,draft.subtotal_cents,draft.provisional_total_cents]))throw fail('NP_REVIEW_DRAFT_CHANGED_01556');
    const contacts=await db.query(`SELECT draft_id FROM shifttime_checkout_contacts_01555 WHERE draft_id=$1 AND store_id=$2 AND site_id=$3 AND created_by_user_id=$4 AND expires_at>now() FOR SHARE`,[args.draftId,scope.storeId,args.siteId,scope.userId]);
    if(!contacts.rowCount)throw fail('NP_REVIEW_CONTACTS_REQUIRED_01556');
    // Do not trust a browser-provided snapshot; verify current catalog/cart/packaging in the same PG TX.
    const freshItems=await snapshot(db,scope,p,verified._draftContext);
    if(!Array.isArray(freshItems)||!freshItems.length||JSON.stringify(freshItems)!==JSON.stringify(locked.items))throw fail('NP_REVIEW_PRICE_OR_CART_CHANGED_01556');
    const prior=await db.query(`SELECT * FROM shifttime_checkout_review_queue_01556 WHERE draft_id=$1 AND store_id=$2 FOR UPDATE`,[args.draftId,scope.storeId]);
    if(prior.rowCount)return reviewResponse01556(prior.rows[0],{replayed:true});
    const review=await db.query(`INSERT INTO shifttime_checkout_review_queue_01556 (draft_id,store_id,site_id,created_by_user_id,cart_fingerprint,packing_fingerprint,provisional_total_cents) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (draft_id) DO NOTHING RETURNING *`,[args.draftId,scope.storeId,args.siteId,scope.userId,locked.cart_fingerprint,locked.packing_fingerprint,locked.provisional_total_cents]);
    if(!review.rowCount){const existing=await db.query(`SELECT * FROM shifttime_checkout_review_queue_01556 WHERE draft_id=$1 AND store_id=$2`,[args.draftId,scope.storeId]);if(!existing.rowCount)throw fail('NP_REVIEW_CONFLICT_01556');return reviewResponse01556(existing.rows[0],{replayed:true});}
    // Durable staging record; NO dispatch worker or direct CRM connection reads this table in 01556.
    await db.query(`INSERT INTO shifttime_checkout_crm_outbox_01556 (draft_id,store_id,site_id,event_type,delivery_state,reference_payload) VALUES ($1,$2,$3,'checkout_draft_ready_for_manual_review','disabled',$4::jsonb) ON CONFLICT (draft_id) DO NOTHING`,[args.draftId,scope.storeId,args.siteId,JSON.stringify({draftId:args.draftId,storeId:scope.storeId,siteId:args.siteId,contactReference:'encrypted-draft-only',priceProvisional:true})]);
    return reviewResponse01556(review.rows[0]);
  });
}
