// 01605C · Read-only owner journal and sanitized denial records. No secrets, request bodies or URLs.
import {assertAccessPolicyManager01597} from './access-policy-core-01597.mjs';
const allowed=Object.freeze({
 roles:['access.role.create','access.role.update'],
 assignments:['access.assignment.create','access.assignment.revoke'],
 test:['access.test_worker.enroll','access.test_worker.replace'],
 denied:['access.permission.denied']
});
const all=Object.freeze(Object.values(allowed).flat());
const runDefault=async fn=>(await import('./db.mjs')).withClient(fn);
const fault=(code,statusCode=400)=>Object.assign(new Error(code),{statusCode,code});
export function normalizeHistoryQuery01605C(params={}){
 const filter=String(params.filter??'all');
 if(filter!=='all'&&!Object.hasOwn(allowed,filter))throw fault('ST_ACCESS_HISTORY_FILTER_INVALID_01605C');
 const requested=Number(params.limit??30);
 if(!Number.isInteger(requested)||requested<1||requested>100)throw fault('ST_ACCESS_HISTORY_LIMIT_INVALID_01605C');
 const before=String(params.before??'');
 if(before&&!/^[1-9][0-9]{0,18}$/.test(before))throw fault('ST_ACCESS_HISTORY_CURSOR_INVALID_01605C');
 return {filter,limit:requested,before,actions:filter==='all'?all:allowed[filter]};
}
export async function listAccessHistory01605C(scope,params={}, {run=runDefault}={}){
 assertAccessPolicyManager01597(scope);
 const input=normalizeHistoryQuery01605C(params);
 return run(async c=>{
  // Both account and Store are required. No cross-Store data or raw JSON payload escapes.
  const q=await c.query(`SELECT id::text AS id, created_at AS "createdAt",actor_user_id AS "actorUserId",action,target_type AS "targetType",target_id AS "targetId"
   FROM platform_admin_audit_log WHERE account_id=$1 AND store_id=$2 AND workspace_id=$3
   AND action=ANY($4::text[]) AND ($5::bigint IS NULL OR id<$5::bigint)
   ORDER BY id DESC LIMIT $6`,[scope.accountId,scope.storeId,scope.workspaceId,input.actions,input.before||null,input.limit+1]);
  const hasMore=q.rows.length>input.limit,rows=q.rows.slice(0,input.limit).map(r=>({
   id:String(r.id),createdAt:r.createdAt,actorUserId:r.actorUserId,action:r.action,
   targetType:r.targetType,targetId:r.targetId
  }));
  return {stage:'01605C',filter:input.filter,items:rows,hasMore,nextCursor:hasMore&&rows.length?rows[rows.length-1].id:null};
 });
}
const recent=new Map();
export function shouldRecordDenial01605C({accountId='',storeId='',actor='',permission='',now=Date.now()}={}){
 const key=[accountId,storeId,actor,permission].join(':');
 const prev=recent.get(key)||0;
 if(now-prev<3000)return false;
 if(recent.size>2000)recent.clear();
 recent.set(key,now);return true;
}
export async function recordDeniedAccess01605C(scope,actor,action,reason,{run=runDefault,now=Date.now()}={}){
 if(!scope?.accountId||!scope?.storeId||!scope?.workspaceId||!actor||!action?.permission)return false;
 const permission=String(action.permission);
 if(!/^[a-z][a-z0-9_.]{2,100}$/.test(permission))return false;
 if(!shouldRecordDenial01605C({accountId:scope.accountId,storeId:scope.storeId,actor,permission,now}))return false;
 const reasonCode=/^ST_[A-Z0-9_]{4,100}$/.test(String(reason))?String(reason):'ST_ACCESS_DENIED';
 // Deliberately exclude request path/query, IP, tokens, body, customer messages, and PII.
 await run(c=>c.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload)
  VALUES($1,$2,$3,$4,'access.permission.denied','permission',$5,$6::jsonb)`,
  [scope.accountId,scope.workspaceId,scope.storeId,actor,permission,JSON.stringify({reasonCode})]));
 return true;
}
