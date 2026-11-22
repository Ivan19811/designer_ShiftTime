// 01560 · Authenticated internal review management only. Never creates an order or transmits PII.
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const DRAFT=/^orderdraft_[a-f0-9]{32}$/i;
export const REVIEW_STATUSES_01560=Object.freeze(['awaiting_review','in_review','needs_information','on_hold','ready_for_manual_followup']);
export const isReviewManager01560=scope=>['owner','admin','order-manager'].includes(String(scope?.role||''));
export const canAssignReview01560=scope=>['owner','admin'].includes(String(scope?.role||''));
function requireScope(scope){if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId)throw fail('ORDERS_WORKFLOW_SCOPE_01560',403);}
function requireRole(scope){if(!isReviewManager01560(scope))throw fail('ORDERS_WORKFLOW_FORBIDDEN_01560',403);}
function requireDraft(draftId){if(!DRAFT.test(String(draftId||'')))throw fail('ORDERS_WORKFLOW_DRAFT_INVALID_01560');return draftId;}
export function validateReviewChange01560(input,scope){
  requireRole(scope);
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['status','assignedUserId','revision'].includes(k)))throw fail('ORDERS_WORKFLOW_INPUT_01560');
  const keys=Object.keys(input), revision=input.revision;
  if(!Number.isSafeInteger(revision)||revision<0||revision>2147483647||!keys.some(k=>k==='status'||k==='assignedUserId'))throw fail('ORDERS_WORKFLOW_REVISION_01560');
  let status;
  if(Object.hasOwn(input,'status')){if(!REVIEW_STATUSES_01560.includes(input.status))throw fail('ORDERS_WORKFLOW_STATUS_01560');status=input.status;}
  let assignedUserId;
  if(Object.hasOwn(input,'assignedUserId')){
    if(!canAssignReview01560(scope))throw fail('ORDERS_WORKFLOW_ASSIGN_FORBIDDEN_01560',403);
    if(input.assignedUserId!==null&&(!/^[\w:-]{1,160}$/.test(String(input.assignedUserId))))throw fail('ORDERS_WORKFLOW_ASSIGNEE_01560');
    assignedUserId=input.assignedUserId;
  }
  return {revision,status,assignedUserId,hasStatus:Object.hasOwn(input,'status'),hasAssignee:Object.hasOwn(input,'assignedUserId')};
}
const scopeQuery=`FROM shifttime_checkout_review_queue_01556 r JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id AND d.site_id=r.site_id AND d.store_id=r.store_id WHERE r.draft_id=$1 AND r.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4`;
export async function getReviewManagers01560(scope,{lookup=withClient}={}){
  requireScope(scope);requireRole(scope);
  return lookup(async db=>{
    const q=await db.query(`SELECT DISTINCT u.id,u.name FROM platform_users u JOIN platform_memberships m ON m.user_id=u.id JOIN platform_stores st ON st.id=$1 JOIN platform_workspaces w ON w.id=st.workspace_id WHERE u.status='active' AND m.account_id=$2 AND w.account_id=$2 AND w.id=$3 AND m.status='active' AND m.role IN ('owner','admin','order-manager') AND (m.workspace_id IS NULL OR m.workspace_id=$3) AND (m.store_id IS NULL OR m.store_id=$1) ORDER BY u.name,u.id LIMIT 200`,[scope.storeId,scope.accountId,scope.workspaceId]);
    return {stage:'01560',previewOnly:true,canManage:true,canAssign:canAssignReview01560(scope),statuses:REVIEW_STATUSES_01560,managers:q.rows.map(r=>({id:String(r.id),name:String(r.name||r.id).slice(0,120)}))};
  });
}
export async function getReviewHistory01560(scope,draftId,{lookup=withClient}={}){
  requireScope(scope);requireRole(scope);requireDraft(draftId);
  return lookup(async db=>{
    const owns=await db.query(`SELECT r.draft_id ${scopeQuery}`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
    if(!owns.rowCount)throw fail('ORDERS_WORKFLOW_NOT_FOUND_01560',404);
    const changes=await db.query(`SELECT a.id,a.previous_status,a.next_status,a.previous_assignee_user_id,a.next_assignee_user_id,a.revision,a.created_at,u.name actor_name FROM shifttime_orders_review_audit_01560 a LEFT JOIN platform_users u ON u.id=a.actor_user_id WHERE a.draft_id=$1 AND a.store_id=$2 ORDER BY a.id DESC LIMIT 100`,[draftId,scope.storeId]);
    return {stage:'01560',draftId,previewOnly:true,events:changes.rows.map(r=>({id:Number(r.id),previousStatus:r.previous_status,nextStatus:r.next_status,previousAssigneeUserId:r.previous_assignee_user_id||null,nextAssigneeUserId:r.next_assignee_user_id||null,revision:Number(r.revision),at:r.created_at,actorName:String(r.actor_name||'').slice(0,120)}))};
  });
}
export async function updateReviewWorkflow01560(scope,draftId,input,{transaction=withTransaction}={}){
  requireScope(scope);requireDraft(draftId);const change=validateReviewChange01560(input,scope);
  return transaction(async db=>{
    // Lock the shared review record even before a workflow row exists; serializes first writes.
    const r=await db.query(`SELECT r.draft_id,r.store_id ${scopeQuery} FOR UPDATE OF r`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);
    if(!r.rowCount)throw fail('ORDERS_WORKFLOW_NOT_FOUND_01560',404);
    const current=await db.query('SELECT status,assigned_user_id,version FROM shifttime_orders_review_workflow_01560 WHERE draft_id=$1 AND store_id=$2 FOR UPDATE',[draftId,scope.storeId]);
    const prev=current.rows[0]||{status:'awaiting_review',assigned_user_id:null,version:0};
    if(Number(prev.version)!==change.revision)throw fail('ORDERS_WORKFLOW_CONFLICT_01560',409);
    const nextStatus=change.hasStatus?change.status:prev.status;
    const nextAssignee=change.hasAssignee?change.assignedUserId:prev.assigned_user_id;
    if(nextAssignee){
      const m=await db.query(`SELECT 1 FROM platform_memberships m JOIN platform_users u ON u.id=m.user_id JOIN platform_stores st ON st.id=$2 JOIN platform_workspaces ws ON ws.id=st.workspace_id WHERE m.user_id=$1 AND m.account_id=$3 AND ws.id=$4 AND ws.account_id=$3 AND u.status='active' AND m.status='active' AND m.role IN ('owner','admin','order-manager') AND (m.workspace_id IS NULL OR m.workspace_id=$4) AND (m.store_id IS NULL OR m.store_id=$2) LIMIT 1`,[nextAssignee,scope.storeId,scope.accountId,scope.workspaceId]);
      if(!m.rowCount)throw fail('ORDERS_WORKFLOW_ASSIGNEE_FORBIDDEN_01560',403);
    }
    if(nextStatus===prev.status&&nextAssignee===prev.assigned_user_id)return {stage:'01560',draftId,unchanged:true,previewOnly:true,status:prev.status,assignedUserId:prev.assigned_user_id||null,revision:Number(prev.version)};
    const revision=Number(prev.version)+1;
    await db.query(`INSERT INTO shifttime_orders_review_workflow_01560 (draft_id,store_id,status,assigned_user_id,version,changed_by_user_id) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(draft_id) DO UPDATE SET status=EXCLUDED.status,assigned_user_id=EXCLUDED.assigned_user_id,version=EXCLUDED.version,changed_by_user_id=EXCLUDED.changed_by_user_id,updated_at=now() WHERE shifttime_orders_review_workflow_01560.store_id=EXCLUDED.store_id`,[draftId,scope.storeId,nextStatus,nextAssignee,revision,scope.userId]);
    await db.query(`INSERT INTO shifttime_orders_review_audit_01560 (draft_id,store_id,actor_user_id,previous_status,next_status,previous_assignee_user_id,next_assignee_user_id,revision) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[draftId,scope.storeId,scope.userId,prev.status,nextStatus,prev.assigned_user_id,nextAssignee,revision]);
    return {stage:'01560',draftId,unchanged:false,previewOnly:true,status:nextStatus,assignedUserId:nextAssignee||null,revision};
  });
}
