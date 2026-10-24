// 01562 · Read-only, store-scoped pre-order readiness report.
// This module must NOT create orders, accept money, reserve goods, issue TTN or send CRM messages.
import {isReviewManager01560} from './orders-review-workflow-01560.mjs';
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const DRAFT=/^orderdraft_[a-f0-9]{32}$/i;
const check=(key,ok)=>({key,ok:Boolean(ok)});
const positiveInt=n=>Number.isSafeInteger(Number(n))&&Number(n)>0;

export function evaluateReadiness01562(row){
  // Fail closed. Do not equate provisional shipping prices or manual-review consent with a final quote / buyer authorization.
  const items=Array.isArray(row.items)?row.items:[];
  const packages=Array.isArray(row.packages)?row.packages:[];
  const itemLinesValid=items.length>0&&items.length<=200&&items.every(i=>positiveInt(i.quantity)&&Number.isSafeInteger(Number(i.lineTotalCents))&&Number(i.lineTotalCents)>=0);
  const packagePlanValid=packages.length>0&&packages.length<=100&&packages.length===Number(row.number_of_packages)&&packages.every(p=>positiveInt(p.weightGrams)&&Array.isArray(p.dimensionsCm)&&p.dimensionsCm.length===3&&p.dimensionsCm.every(d=>Number(d)>0&&Number.isFinite(Number(d))));
  const snapshotsMatch=Boolean(row.cart_fingerprint&&row.review_cart_fingerprint&&row.cart_fingerprint===row.review_cart_fingerprint&&row.packing_fingerprint&&row.review_packing_fingerprint&&row.packing_fingerprint===row.review_packing_fingerprint);
  const priceConsistent=positiveInt(row.subtotal_cents)&&positiveInt(row.provisional_delivery_cents)&&Number(row.subtotal_cents)+Number(row.provisional_delivery_cents)===Number(row.provisional_total_cents)&&Number(row.provisional_total_cents)===Number(row.review_total_cents);
  const checks=[
    check('reviewMarkedReady',row.workflow_status==='ready_for_manual_followup'),
    check('contactsCurrent',row.contacts_current===true),
    check('cartSnapshotMatches',snapshotsMatch),
    check('itemsValid',itemLinesValid),
    check('packagePlanValid',packagePlanValid),
    check('estimatedPriceConsistent',priceConsistent),
    check('finalShippingQuote',false), // Not stored by 01554–01561: never infer from estimate.
    check('buyerFinalConfirmation',false), // Buyer must explicitly accept exact final total in a future flow.
    check('productionOrderWriteEnabled',false) // Deliberately disabled until separate approved release.
  ];
  return {stage:'01562',draftId:String(row.draft_id),siteId:String(row.site_id),previewOnly:true,orderCreated:false,canCreateOrder:false,canPay:false,canReserveInventory:false,canCreateWaybill:false,canSyncCrm:false,
    estimatedSubtotal:Number(row.subtotal_cents)/100,estimatedDelivery:Number(row.provisional_delivery_cents)/100,estimatedTotal:Number(row.provisional_total_cents)/100,
    workflowStatus:String(row.workflow_status||'awaiting_review'),checks,passed:checks.filter(c=>c.ok).length,total:checks.length,pending:checks.filter(c=>!c.ok).map(c=>c.key)};
}

export async function getOrderReadiness01562(scope,draftId,{lookup=withClient}={}){
  if(!scope?.storeId||!scope?.workspaceId||!scope?.accountId||!scope?.userId||!isReviewManager01560(scope))throw fail('ORDERS_READINESS_FORBIDDEN_01562',403);
  if(!DRAFT.test(String(draftId||'')))throw fail('ORDERS_READINESS_DRAFT_INVALID_01562');
  return lookup(async db=>{
    const result=await db.query(`SELECT r.draft_id,r.site_id,r.cart_fingerprint AS review_cart_fingerprint,r.packing_fingerprint AS review_packing_fingerprint,r.provisional_total_cents AS review_total_cents,
      d.cart_fingerprint,d.packing_fingerprint,d.subtotal_cents,d.provisional_delivery_cents,d.provisional_total_cents,d.items,d.packages,d.number_of_packages,
      COALESCE(w.status,'awaiting_review') AS workflow_status,
      EXISTS (SELECT 1 FROM shifttime_checkout_contacts_01555 c WHERE c.draft_id=d.id AND c.store_id=$2 AND c.site_id=d.site_id AND c.created_by_user_id=d.created_by_user_id AND c.expires_at>now()) AS contacts_current
      FROM shifttime_checkout_review_queue_01556 r
      JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id AND d.store_id=r.store_id AND d.site_id=r.site_id
      LEFT JOIN shifttime_orders_review_workflow_01560 w ON w.draft_id=r.draft_id AND w.store_id=r.store_id
      WHERE r.draft_id=$1 AND r.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4 LIMIT 1`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
    if(!result.rowCount)throw fail('ORDERS_READINESS_NOT_FOUND_01562',404);
    return evaluateReadiness01562(result.rows[0]);
  });
}
