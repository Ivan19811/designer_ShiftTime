// 01558 · Read-only merchant review queue. No PII, no order mutation, no CRM or TTN.
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const error=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
export function parseReviewList01558(query={}){
  const q=query instanceof URLSearchParams?query:new URLSearchParams(query);
  for(const key of q.keys())if(!['siteId','limit','offset'].includes(key))throw error('ORDERS_QUERY_INVALID_01558');
  const rawLimit=q.get('limit')??'20', rawOffset=q.get('offset')??'0';
  if(!/^\d{1,3}$/.test(rawLimit)||!/^\d{1,7}$/.test(rawOffset))throw error('ORDERS_QUERY_INVALID_01558');
  const limit=Number(rawLimit),offset=Number(rawOffset),siteId=String(q.get('siteId')||'').trim();
  if(limit<1||limit>50||offset<0||offset>1000000||siteId&&!/^[-\w:]{1,160}$/.test(siteId))throw error('ORDERS_QUERY_INVALID_01558');
  return {limit,offset,siteId};
}
export function safeReviewRow01558(r){
  const items=Array.isArray(r.items)?r.items:[],packages=Array.isArray(r.packages)?r.packages:[];
  // Explicit allowlist. Never return contacts, ciphertext, raw SQL rows or opaque fingerprints.
  return {draftId:String(r.draft_id),siteId:String(r.site_id),state:'awaiting_manual_review',createdAt:r.prepared_at,
    draftCreatedAt:r.draft_created_at,orderCreated:false,previewOnly:true,currency:'UAH',
    subtotal:Number(r.subtotal_cents)/100,provisionalDelivery:Number(r.provisional_delivery_cents)/100,
    provisionalTotal:Number(r.provisional_total_cents)/100,weightKg:Number(r.total_weight_grams)/1000,
    numberOfPackages:Number(r.number_of_packages),recipientCityRef:String(r.recipient_city_ref||''),
    recipientWarehouseRef:String(r.recipient_warehouse_ref||''),
    contactsEncrypted:Boolean(r.contacts_encrypted),crmDeliveryEnabled:false,
    items:items.slice(0,200).map(i=>({itemId:String(i.itemId||''),title:String(i.title||'').slice(0,180),sku:String(i.sku||'').slice(0,90),quantity:Number(i.quantity)||0,lineTotal:Number(i.lineTotalCents||0)/100,componentKind:String(i.componentKind||'').slice(0,50)})),
    packages:packages.slice(0,100).map(p=>({number:Number(p.number)||0,mainItemId:String(p.mainItemId||''),accessoryItemIds:Array.isArray(p.accessoryItemIds)?p.accessoryItemIds.map(String).slice(0,200):[],dimensionsCm:Array.isArray(p.dimensionsCm)?p.dimensionsCm.map(n=>Number(n)||0).slice(0,3):null,weightKg:Number(p.weightGrams||0)/1000}))};
}
export async function listReviewOrders01558(scope,input={},deps={}){
  if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId)throw error('ORDERS_SCOPE_REQUIRED_01558',403);
  const {siteId,limit,offset}=parseReviewList01558(input),lookup=deps.lookup||withClient;
  return lookup(async db=>{
    const params=[scope.storeId,scope.accountId,scope.workspaceId];
    const predicate=`r.store_id=$1 AND d.store_id=$1 AND d.account_id=$2 AND d.workspace_id=$3 AND d.id=r.draft_id AND r.site_id=d.site_id`;
    let siteClause='';if(siteId){params.push(siteId);siteClause=` AND r.site_id=$4`;}
    const sites=await db.query(`SELECT DISTINCT r.site_id FROM shifttime_checkout_review_queue_01556 r JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id WHERE ${predicate} ORDER BY r.site_id LIMIT 200`,params.slice(0,3));
    const total=await db.query(`SELECT count(*)::int AS total FROM shifttime_checkout_review_queue_01556 r JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id WHERE ${predicate}${siteClause}`,params);
    const rows=await db.query(`SELECT r.draft_id,r.site_id,r.created_at AS prepared_at,d.created_at AS draft_created_at,d.subtotal_cents,d.provisional_delivery_cents,d.provisional_total_cents,d.total_weight_grams,d.number_of_packages,d.recipient_city_ref,d.recipient_warehouse_ref,d.items,d.packages,EXISTS(SELECT 1 FROM shifttime_checkout_contacts_01555 c WHERE c.draft_id=r.draft_id AND c.store_id=$1 AND c.site_id=r.site_id AND c.expires_at>now()) AS contacts_encrypted FROM shifttime_checkout_review_queue_01556 r JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id WHERE ${predicate}${siteClause} ORDER BY r.created_at DESC,r.draft_id DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,offset]);
    return {stage:'01558',readOnly:true,previewOnly:true,storeId:scope.storeId,siteId,limit,offset,total:Number(total.rows[0]?.total||0),sites:sites.rows.map(r=>String(r.site_id)),items:rows.rows.map(safeReviewRow01558)};
  });
}
