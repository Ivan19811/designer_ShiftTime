// 01566 · REAL order (not draft), transactional, manager-authorized and replay safe.
// Buyer accepted a STORE quote based on NP indicative delivery cost; not a carrier final invoice.
// Never initiates payment, reservation, TTN, customer notification or CRM dispatch.
import {randomUUID} from 'node:crypto';
import {buyerSelect01564,buyerBasis01564,assertOfferMatches01564} from './orders-buyer-offer-01564.mjs';
import {isReviewManager01560} from './orders-review-workflow-01560.mjs';
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const fail=(code,statusCode=409)=>Object.assign(new Error(code),{code,statusCode});
const DRAFT=/^orderdraft_[a-f0-9]{32}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validCents=n=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<1000000000;
function assertManager(scope){if(!scope?.storeId||!scope?.workspaceId||!scope?.accountId||!scope?.userId||!isReviewManager01560(scope))throw fail('ORDERS_PRODUCTION_FORBIDDEN_01566',403);}
function assertDraft(draftId){if(!DRAFT.test(String(draftId||'')))throw fail('ORDERS_PRODUCTION_DRAFT_INVALID_01566',400);}
export function validateCreateOrder01566(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['requestId','confirmCreation','acceptEstimatedShipping'].includes(k))||!UUID.test(String(input.requestId||''))||input.confirmCreation!==true||input.acceptEstimatedShipping!==true)throw fail('ORDERS_PRODUCTION_EXPLICIT_CONFIRMATION_REQUIRED_01566',400);
 return {requestId:input.requestId};
}
export function validateProductionSnapshot01566(row,now=Date.now()){
 if(!row?.accepted_at||row.revoked_at||!Number.isFinite(new Date(row.accepted_at).getTime())||new Date(row.accepted_at).getTime()>now+60_000||new Date(row.expires_at).getTime()<=now)throw fail('ORDERS_PRODUCTION_OFFER_NOT_CURRENT_01566');
 if(row.draft_currency!=='UAH'||row.draft_account_id==null||row.draft_workspace_id==null)throw fail('ORDERS_PRODUCTION_SCOPE_MISMATCH_01566');
 const basis=assertOfferMatches01564(row,buyerBasis01564(row),now);
 const items=Array.isArray(row.draft_items)?row.draft_items:[],packages=Array.isArray(row.packages)?row.packages:[];
 if(!items.length||items.length>200||!items.every(i=>Number.isSafeInteger(Number(i.quantity))&&Number(i.quantity)>0&&Number.isSafeInteger(Number(i.lineTotalCents))&&Number(i.lineTotalCents)>=0)||items.reduce((s,i)=>s+Number(i.lineTotalCents),0)!==Number(row.subtotal_cents))throw fail('ORDERS_PRODUCTION_ITEMS_INVALID_01566');
 if(!packages.length||packages.length!==basis.seats||!packages.every(p=>Number.isSafeInteger(Number(p.weightGrams))&&Number(p.weightGrams)>0&&Array.isArray(p.dimensionsCm)&&p.dimensionsCm.length===3&&p.dimensionsCm.every(x=>Number.isFinite(Number(x))&&Number(x)>0)))throw fail('ORDERS_PRODUCTION_PACKAGES_INVALID_01566');
 if(!validCents(row.subtotal_cents)||!validCents(row.delivery_cents)||!validCents(row.total_cents)||Number(row.subtotal_cents)+Number(row.delivery_cents)!==Number(row.total_cents)||Number(row.total_cents)!==basis.totalCents)throw fail('ORDERS_PRODUCTION_SUM_INVALID_01566');
 if(!row.contacts_current||!row.contacts_iv_b64||!row.contacts_ciphertext_b64||!row.contacts_tag_b64||!row.contacts_digest||new Date(row.contact_expires_at).getTime()<=now)throw fail('ORDERS_PRODUCTION_CONTACTS_INVALID_01566');
 return basis;
}
function safeOrder(row,{replayed=false}={}){
 return {stage:'01566',orderCreated:true,previewOnly:false,orderId:String(row.id),orderNumber:String(row.order_number),siteId:String(row.site_id),sourceDraftId:String(row.source_draft_id),createdAt:row.created_at,orderStatus:String(row.order_status),shippingStatus:String(row.shipping_status),paymentStatus:String(row.payment_status),inventoryStatus:String(row.inventory_status),crmStatus:String(row.crm_status),waybillStatus:String(row.waybill_status),estimatedCarrierPrice:true,buyerAcceptedStoreOffer:true,emailVerified:Boolean(row.email_possession_verified),subtotal:Number(row.subtotal_cents)/100,delivery:Number(row.delivery_cents)/100,total:Number(row.total_cents)/100,currency:'UAH',numberOfPackages:Number(row.number_of_packages),items:Array.isArray(row.items)?row.items.map(i=>({title:String(i.title||''),sku:String(i.sku||''),quantity:Number(i.quantity)||0,lineTotal:Number(i.lineTotalCents||0)/100})):[],packages:Array.isArray(row.packages)?row.packages.map(p=>({number:Number(p.number)||0,weightKg:Number(p.weightGrams||0)/1000,dimensionsCm:p.dimensionsCm||[]})):[],replayed,canPay:false,canCreateWaybill:false,canSyncCrm:false};
}
const fromScope='WHERE o.store_id=$1 AND o.account_id=$2 AND o.workspace_id=$3';
const showColumns='o.id,o.order_number,o.site_id,o.source_draft_id,o.created_at,o.order_status,o.shipping_status,o.payment_status,o.inventory_status,o.crm_status,o.waybill_status,o.email_possession_verified,o.subtotal_cents,o.delivery_cents,o.total_cents,o.currency,o.number_of_packages,o.items,o.packages';
const selectExisting=`SELECT ${showColumns} FROM shifttime_production_orders_01566 o ${fromScope} AND o.source_draft_id=$4 LIMIT 1`;
// Buyer-offer validator includes CURRENT quote, snapshots, store status and acceptance. Contacts copied encrypted only.
const snapshotQuery=buyerSelect01564.replace('SELECT o.*,',`SELECT d.account_id AS draft_account_id,d.workspace_id AS draft_workspace_id,d.created_by_user_id AS buyer_user_id,d.cart_id AS source_cart_id,d.currency AS draft_currency,c.iv_b64 AS contacts_iv_b64,c.ciphertext_b64 AS contacts_ciphertext_b64,c.tag_b64 AS contacts_tag_b64,c.contacts_digest,c.expires_at AS contact_expires_at,o.*,`)+` JOIN shifttime_checkout_contacts_01555 c ON c.draft_id=d.id AND c.store_id=d.store_id AND c.site_id=d.site_id AND c.created_by_user_id=d.created_by_user_id`;
export async function createProductionOrder01566(scope,draftId,input,{transaction=withTransaction,clock=()=>Date.now(),newId=randomUUID,validate=validateProductionSnapshot01566}={}){
 assertManager(scope);assertDraft(draftId);const args=validateCreateOrder01566(input);
 return transaction(async db=>{
  // Serialize order creation on draft, even across different manager idempotency keys.
  const locked=await db.query(`SELECT d.id FROM shifttime_checkout_drafts_01554 d WHERE d.id=$1 AND d.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 FOR UPDATE OF d`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
  if(!locked.rowCount)throw fail('ORDERS_PRODUCTION_DRAFT_NOT_FOUND_01566',404);
  const before=await db.query(selectExisting,[scope.storeId,scope.accountId,scope.workspaceId,draftId]);
  if(before.rowCount)return safeOrder(before.rows[0],{replayed:true});
  const selected=await db.query(snapshotQuery+` WHERE d.id=$1 AND d.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 ORDER BY o.created_at DESC LIMIT 1 FOR UPDATE OF o,r,q,c`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
  if(!selected.rowCount)throw fail('ORDERS_PRODUCTION_OFFER_NOT_FOUND_01566',404);
  const row=selected.rows[0];if(row.draft_account_id!==scope.accountId||row.draft_workspace_id!==scope.workspaceId||row.store_id!==scope.storeId)throw fail('ORDERS_PRODUCTION_SCOPE_MISMATCH_01566',403);
  const basis=validate(row,clock());
  // Buyer email proof is optional; never silently pretend to have verified it.
  const proof=await db.query('SELECT verified_at FROM shifttime_order_buyer_email_challenges_01565 WHERE offer_id=$1 AND draft_id=$2 AND store_id=$3',[row.id,draftId,scope.storeId]);
  const emailVerified=Boolean(proof.rows[0]?.verified_at);
  const id=newId();if(!UUID.test(id))throw fail('ORDERS_PRODUCTION_ID_INVALID_01566',500);
  const numberResult=await db.query("SELECT nextval('shifttime_production_order_number_seq_01566')::bigint AS seq");
  const seq=Number(numberResult.rows[0]?.seq);if(!Number.isSafeInteger(seq)||seq<1)throw fail('ORDERS_PRODUCTION_NUMBER_UNAVAILABLE_01566',503);
  const orderNumber='ST-'+String(seq).padStart(9,'0');
  const created=await db.query(`INSERT INTO shifttime_production_orders_01566 (id,order_number,account_id,workspace_id,store_id,site_id,source_draft_id,source_offer_id,source_cart_id,created_by_manager_id,request_id,buyer_acknowledged_at,email_possession_verified,cart_fingerprint,packing_fingerprint,items,packages,number_of_packages,total_weight_grams,recipient_city_ref,recipient_warehouse_ref,subtotal_cents,delivery_cents,total_cents)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17::jsonb,$18,$19,$20,$21,$22,$23,$24) RETURNING *`,[id,orderNumber,scope.accountId,scope.workspaceId,scope.storeId,basis.siteId,draftId,row.id,row.source_cart_id,scope.userId,args.requestId,row.accepted_at,emailVerified,basis.cartFingerprint,basis.packingFingerprint,JSON.stringify(row.draft_items),JSON.stringify(row.packages),basis.seats,Number(row.total_weight_grams),row.recipient_city_ref,row.recipient_warehouse_ref,basis.subtotalCents,basis.deliveryCents,basis.totalCents]);
  await db.query(`INSERT INTO shifttime_production_order_contacts_01566 (order_id,store_id,source_draft_id,iv_b64,ciphertext_b64,tag_b64,contacts_digest) VALUES($1,$2,$3,$4,$5,$6,$7)`,[id,scope.storeId,draftId,row.contacts_iv_b64,row.contacts_ciphertext_b64,row.contacts_tag_b64,row.contacts_digest]);
  await db.query(`INSERT INTO shifttime_production_order_events_01566 (order_id,store_id,actor_user_id,event_type,details) VALUES($1,$2,$3,'order_created',$4::jsonb)`,[id,scope.storeId,scope.userId,JSON.stringify({buyerAcknowledged:true,emailPossessionVerified:emailVerified,shippingCost:'store_offer_based_on_carrier_estimate',paymentInitiated:false,crmSent:false,waybillCreated:false})]);
  return safeOrder(created.rows[0]);
 });
}
export async function getProductionOrderForDraft01566(scope,draftId,{lookup=withClient}={}){
 assertManager(scope);assertDraft(draftId);
 return lookup(async db=>{const r=await db.query(selectExisting,[scope.storeId,scope.accountId,scope.workspaceId,draftId]);return {stage:'01566',draftId,found:Boolean(r.rowCount),order:r.rowCount?safeOrder(r.rows[0]):null};});
}
export async function listProductionOrders01566(scope,{limit=20,offset=0}={}, {lookup=withClient}={}){
 assertManager(scope);if(!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0||offset>1000000)throw fail('ORDERS_PRODUCTION_LIST_INVALID_01566',400);
 return lookup(async db=>{const rows=await db.query(`SELECT ${showColumns} FROM shifttime_production_orders_01566 o ${fromScope} ORDER BY o.created_at DESC,o.order_number DESC LIMIT $4 OFFSET $5`,[scope.storeId,scope.accountId,scope.workspaceId,limit,offset]);const cnt=await db.query(`SELECT count(*)::int AS n FROM shifttime_production_orders_01566 o ${fromScope}`,[scope.storeId,scope.accountId,scope.workspaceId]);return {stage:'01566',total:Number(cnt.rows[0]?.n||0),limit,offset,items:rows.rows.map(r=>safeOrder(r))};});
}

// Shared, read-only snapshot and DTO for 01567 buyer-controlled placement.
export {snapshotQuery as productionSnapshotQuery01566,safeOrder as productionPublicView01566};
