// 01558 · Read-only merchant review queue. No PII, no order mutation, no CRM or TTN.
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const error=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
export function parseReviewList01558(query={}){
  const q=query instanceof URLSearchParams?query:new URLSearchParams(query);
  for(const key of q.keys())if(!['siteId','limit','offset','search','status','priority','assigneeId'].includes(key))throw error('ORDERS_QUERY_INVALID_01558');
  const rawLimit=q.get('limit')??'20', rawOffset=q.get('offset')??'0';
  if(!/^\d{1,3}$/.test(rawLimit)||!/^\d{1,7}$/.test(rawOffset))throw error('ORDERS_QUERY_INVALID_01558');
  const limit=Number(rawLimit),offset=Number(rawOffset),siteId=String(q.get('siteId')||'').trim();
  if(limit<1||limit>50||offset<0||offset>1000000||siteId&&!/^[-\w:]{1,160}$/.test(siteId))throw error('ORDERS_QUERY_INVALID_01558');
  const search=String(q.get('search')||'').trim(),status=String(q.get('status')||'').trim(),priority=String(q.get('priority')||'').trim(),assigneeId=String(q.get('assigneeId')||'').trim();
  if(search.length>120||/[\x00-\x1f]/.test(search)||status&&!['awaiting_review','in_review','needs_information','on_hold','ready_for_manual_followup'].includes(status)||priority&&!['low','normal','high','urgent'].includes(priority)||assigneeId&&!/^[\w:-]{1,160}$/.test(assigneeId))throw error('ORDERS_QUERY_INVALID_01558');
  return {limit,offset,siteId,search,status,priority,assigneeId};
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
    workflowStatus:String(r.workflow_status||'awaiting_review'),workflowRevision:Number(r.workflow_revision||0),
    priority:String(r.review_priority||'normal'),priorityRevision:Number(r.priority_revision||0),
    assignedUserId:r.assigned_user_id?String(r.assigned_user_id):null,assignedUserName:String(r.assigned_user_name||''),
    items:items.slice(0,200).map(i=>({itemId:String(i.itemId||''),title:String(i.title||'').slice(0,180),sku:String(i.sku||'').slice(0,90),quantity:Number(i.quantity)||0,lineTotal:Number(i.lineTotalCents||0)/100,componentKind:String(i.componentKind||'').slice(0,50)})),
    packages:packages.slice(0,100).map(p=>({number:Number(p.number)||0,mainItemId:String(p.mainItemId||''),accessoryItemIds:Array.isArray(p.accessoryItemIds)?p.accessoryItemIds.map(String).slice(0,200):[],dimensionsCm:Array.isArray(p.dimensionsCm)?p.dimensionsCm.map(n=>Number(n)||0).slice(0,3):null,weightKg:Number(p.weightGrams||0)/1000}))};
}
export async function listReviewOrders01558(scope,input={},deps={}){
  if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId)throw error('ORDERS_SCOPE_REQUIRED_01558',403);
  const {siteId,limit,offset,search,status,priority,assigneeId}=parseReviewList01558(input),lookup=deps.lookup||withClient;
  return lookup(async db=>{
    const params=[scope.storeId,scope.accountId,scope.workspaceId];
    const predicate=`r.store_id=$1 AND d.store_id=$1 AND d.account_id=$2 AND d.workspace_id=$3 AND d.id=r.draft_id AND r.site_id=d.site_id`;
    let siteClause='';if(siteId){params.push(siteId);siteClause=` AND r.site_id=$${params.length}`;}
    if(status){params.push(status);siteClause+=` AND COALESCE(w.status,'awaiting_review')=$${params.length}`;}
    if(priority){params.push(priority);siteClause+=` AND COALESCE(mp.priority,'normal')=$${params.length}`;}
    if(assigneeId){params.push(assigneeId);siteClause+=` AND w.assigned_user_id=$${params.length}`;}
    if(search){params.push('%'+search.replace(/[\\%_]/g,c=>'\\'+c)+'%');siteClause+=` AND (r.draft_id ILIKE $${params.length} ESCAPE '\\' OR r.site_id ILIKE $${params.length} ESCAPE '\\' OR EXISTS (SELECT 1 FROM jsonb_array_elements(d.items) item WHERE (item->>'title') ILIKE $${params.length} ESCAPE '\\' OR (item->>'sku') ILIKE $${params.length} ESCAPE '\\'))`;}
    const joins=` JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id LEFT JOIN shifttime_orders_review_workflow_01560 w ON w.draft_id=r.draft_id AND w.store_id=r.store_id LEFT JOIN shifttime_orders_review_priority_01561 mp ON mp.draft_id=r.draft_id AND mp.store_id=r.store_id`;
    const sites=await db.query(`SELECT DISTINCT r.site_id FROM shifttime_checkout_review_queue_01556 r JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id WHERE ${predicate} ORDER BY r.site_id LIMIT 200`,params.slice(0,3));
    const total=await db.query(`SELECT count(*)::int AS total FROM shifttime_checkout_review_queue_01556 r ${joins} WHERE ${predicate}${siteClause}`,params);
    const rows=await db.query(`SELECT w.status AS workflow_status,w.version AS workflow_revision,mp.priority AS review_priority,mp.version AS priority_revision,w.assigned_user_id,COALESCE(assignee.name,'') AS assigned_user_name,r.draft_id,r.site_id,r.created_at AS prepared_at,d.created_at AS draft_created_at,d.subtotal_cents,d.provisional_delivery_cents,d.provisional_total_cents,d.total_weight_grams,d.number_of_packages,d.recipient_city_ref,d.recipient_warehouse_ref,d.items,d.packages,EXISTS(SELECT 1 FROM shifttime_checkout_contacts_01555 c WHERE c.draft_id=r.draft_id AND c.store_id=$1 AND c.site_id=r.site_id AND c.expires_at>now()) AS contacts_encrypted FROM shifttime_checkout_review_queue_01556 r ${joins} LEFT JOIN platform_users assignee ON assignee.id=w.assigned_user_id WHERE ${predicate}${siteClause} ORDER BY r.created_at DESC,r.draft_id DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`,[...params,limit,offset]);
    return {stage:'01558',readOnly:true,previewOnly:true,storeId:scope.storeId,siteId,limit,offset,total:Number(total.rows[0]?.total||0),sites:sites.rows.map(r=>String(r.site_id)),items:rows.rows.map(safeReviewRow01558)};
  });
}
