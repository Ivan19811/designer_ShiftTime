// 01561 · Store-scoped internal manager notes/priority only. No real orders, contacts, CRM, payments or waybills.
import {createHmac,createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {isReviewManager01560} from './orders-review-workflow-01560.mjs';
const withClient=async (...args)=>(await import('./db.mjs')).withClient(...args);
const withTransaction=async (...args)=>(await import('./db.mjs')).withTransaction(...args);
const error=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const validDraft=/^orderdraft_[a-f0-9]{32}$/i;
export const REVIEW_PRIORITIES_01561=Object.freeze(['low','normal','high','urgent']);
function validateScope(scope,draftId){if(!scope?.storeId||!scope?.accountId||!scope?.workspaceId||!scope?.userId||!isReviewManager01560(scope))throw error('ORDERS_MANAGER_FORBIDDEN_01561',403);if(!validDraft.test(String(draftId||'')))throw error('ORDERS_MANAGER_DRAFT_INVALID_01561');}
const ownershipSql=`FROM shifttime_checkout_review_queue_01556 r JOIN shifttime_checkout_drafts_01554 d ON d.id=r.draft_id AND d.store_id=r.store_id AND d.site_id=r.site_id WHERE r.draft_id=$1 AND r.store_id=$2 AND d.account_id=$3 AND d.workspace_id=$4`;
async function requireOwned(db,scope,draftId,lock=false){const q=await db.query(`SELECT r.draft_id ${ownershipSql}${lock?' FOR UPDATE OF r':''}`,[draftId,scope.storeId,scope.accountId,scope.workspaceId]);if(!q.rowCount)throw error('ORDERS_MANAGER_NOT_FOUND_01561',404);}
export function validatePriority01561(body){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).sort().join(',')!=='priority,revision'||!REVIEW_PRIORITIES_01561.includes(body.priority)||!Number.isSafeInteger(body.revision)||body.revision<0||body.revision>2147483647)throw error('ORDERS_MANAGER_PRIORITY_INPUT_01561');return {priority:body.priority,revision:body.revision};}
export function validateNote01561(body){if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==1||typeof body.text!=='string')throw error('ORDERS_MANAGER_NOTE_INPUT_01561');const text=body.text.trim().replace(/\r\n?/g,'\n');if(text.length<2||text.length>1200||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text))throw error('ORDERS_MANAGER_NOTE_LENGTH_01561');return text;}
export function noteKey01561(env=process.env){const value=String(env.SHIFTTIME_CHECKOUT_PII_KEY||'');if(!/^[a-fA-F0-9]{64}$/.test(value))throw error('ORDERS_MANAGER_ENCRYPTION_KEY_01561',503);return createHmac('sha256',Buffer.from(value,'hex')).update('shifttime:orders:notes:v1:01561').digest();}
const aad=(scope,draftId)=>Buffer.from(JSON.stringify([scope.storeId,draftId,'01561']), 'utf8');
export function sealNote01561(text,scope,draftId,key,{iv=randomBytes(12)}={}){if(!Buffer.isBuffer(key)||key.length!==32||iv.length!==12)throw error('ORDERS_MANAGER_ENCRYPTION_KEY_01561',503);const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad(scope,draftId));const ciphertext=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);return {iv:iv.toString('base64'),ciphertext:ciphertext.toString('base64'),tag:cipher.getAuthTag().toString('base64')};}
export function unsealNote01561(row,scope,draftId,key){const iv=Buffer.from(row.iv_b64,'base64'),tag=Buffer.from(row.tag_b64,'base64');if(iv.length!==12||tag.length!==16)throw error('ORDERS_MANAGER_NOTE_CORRUPT_01561',500);const decipher=createDecipheriv('aes-256-gcm',key,iv);decipher.setAAD(aad(scope,draftId));decipher.setAuthTag(tag);return Buffer.concat([decipher.update(Buffer.from(row.ciphertext_b64,'base64')),decipher.final()]).toString('utf8');}
export async function setReviewPriority01561(scope,draftId,body,{transaction=withTransaction}={}){
 validateScope(scope,draftId);const input=validatePriority01561(body);
 return transaction(async db=>{await requireOwned(db,scope,draftId,true);
  const current=await db.query('SELECT priority,version FROM shifttime_orders_review_priority_01561 WHERE draft_id=$1 AND store_id=$2 FOR UPDATE',[draftId,scope.storeId]);
  const prior=current.rows[0]||{priority:'normal',version:0};if(Number(prior.version)!==input.revision)throw error('ORDERS_MANAGER_CONFLICT_01561',409);
  if(input.priority===prior.priority)return {stage:'01561',draftId,previewOnly:true,unchanged:true,priority:prior.priority,revision:Number(prior.version)};
  const nextVersion=Number(prior.version)+1;
  await db.query('INSERT INTO shifttime_orders_review_priority_01561(draft_id,store_id,priority,version,changed_by_user_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (draft_id) DO UPDATE SET priority=EXCLUDED.priority,version=EXCLUDED.version,changed_by_user_id=EXCLUDED.changed_by_user_id,updated_at=now() WHERE shifttime_orders_review_priority_01561.store_id=EXCLUDED.store_id',[draftId,scope.storeId,input.priority,nextVersion,scope.userId]);
  await db.query('INSERT INTO shifttime_orders_review_priority_audit_01561(draft_id,store_id,actor_user_id,previous_priority,next_priority,version) VALUES ($1,$2,$3,$4,$5,$6)',[draftId,scope.storeId,scope.userId,prior.priority,input.priority,nextVersion]);
  return {stage:'01561',draftId,previewOnly:true,unchanged:false,priority:input.priority,revision:nextVersion};
 });
}
export async function createReviewNote01561(scope,draftId,body,{transaction=withTransaction,keyProvider=noteKey01561}={}){
 validateScope(scope,draftId);const text=validateNote01561(body);const key=keyProvider();
 return transaction(async db=>{await requireOwned(db,scope,draftId,true);const secure=sealNote01561(text,scope,draftId,key);
  const q=await db.query('INSERT INTO shifttime_orders_review_notes_01561(draft_id,store_id,author_user_id,iv_b64,ciphertext_b64,tag_b64) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,created_at',[draftId,scope.storeId,scope.userId,secure.iv,secure.ciphertext,secure.tag]);
  return {stage:'01561',draftId,previewOnly:true,noteId:Number(q.rows[0].id),createdAt:q.rows[0].created_at};
 });
}
export async function getReviewActivity01561(scope,draftId,{lookup=withClient,keyProvider=noteKey01561}={}){
 validateScope(scope,draftId);
 return lookup(async db=>{await requireOwned(db,scope,draftId);
  const pr=await db.query('SELECT priority,version FROM shifttime_orders_review_priority_01561 WHERE draft_id=$1 AND store_id=$2',[draftId,scope.storeId]);
  const changes=await db.query(`SELECT p.id,p.previous_priority,p.next_priority,p.created_at,COALESCE(u.name,'') actor_name FROM shifttime_orders_review_priority_audit_01561 p LEFT JOIN platform_users u ON u.id=p.actor_user_id WHERE p.draft_id=$1 AND p.store_id=$2 ORDER BY p.id DESC LIMIT 50`,[draftId,scope.storeId]);
  const workflow=await db.query(`SELECT a.id,a.previous_status,a.next_status,a.previous_assignee_user_id,a.next_assignee_user_id,a.created_at,COALESCE(u.name,'') actor_name FROM shifttime_orders_review_audit_01560 a LEFT JOIN platform_users u ON u.id=a.actor_user_id WHERE a.draft_id=$1 AND a.store_id=$2 ORDER BY a.id DESC LIMIT 50`,[draftId,scope.storeId]);
  const notes=await db.query(`SELECT n.id,n.iv_b64,n.ciphertext_b64,n.tag_b64,n.created_at,COALESCE(u.name,'') actor_name FROM shifttime_orders_review_notes_01561 n LEFT JOIN platform_users u ON u.id=n.author_user_id WHERE n.draft_id=$1 AND n.store_id=$2 ORDER BY n.id DESC LIMIT 50`,[draftId,scope.storeId]);
  const key=notes.rowCount||notes.rows.length?keyProvider():null;
  const events=[...changes.rows.map(r=>({kind:'priority',id:Number(r.id),at:r.created_at,actor:String(r.actor_name).slice(0,120),previousPriority:r.previous_priority,nextPriority:r.next_priority})),...workflow.rows.map(r=>({kind:'workflow',id:Number(r.id),at:r.created_at,actor:String(r.actor_name).slice(0,120),previousStatus:r.previous_status,nextStatus:r.next_status,assigneeChanged:r.previous_assignee_user_id!==r.next_assignee_user_id})),...notes.rows.map(r=>({kind:'note',id:Number(r.id),at:r.created_at,actor:String(r.actor_name).slice(0,120),text:unsealNote01561(r,scope,draftId,key)}))].sort((a,b)=>new Date(b.at)-new Date(a.at)||b.id-a.id).slice(0,100);
  return {stage:'01561',draftId,previewOnly:true,priority:pr.rows[0]?.priority||'normal',priorityRevision:Number(pr.rows[0]?.version||0),events};
 });
}
