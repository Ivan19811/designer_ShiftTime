import crypto from 'node:crypto';
import {withClient} from './db.mjs';
function clean(v){return String(v??'').trim();}
export function hashToken(token){return crypto.createHash('sha256').update(String(token||'')).digest('hex');}
function bearer(req){const h=clean(req.headers.authorization);return h.toLowerCase().startsWith('bearer ')?h.slice(7).trim():'';}
export async function authenticateRequest(req){const token=bearer(req);if(!token){const e=new Error('Authorization Bearer token is required');e.statusCode=401;throw e;}const tokenHash=hashToken(token);return withClient(async client=>{const q=await client.query(`SELECT s.id session_id,s.user_id,s.expires_at,u.email,u.name FROM api_sessions s JOIN platform_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.status='active' AND u.status='active' AND (s.expires_at IS NULL OR s.expires_at>now()) LIMIT 1`,[tokenHash]);if(!q.rowCount){const e=new Error('Invalid or expired session');e.statusCode=401;throw e;}await client.query('UPDATE api_sessions SET last_seen_at=now() WHERE id=$1',[q.rows[0].session_id]);return {sessionId:q.rows[0].session_id,userId:q.rows[0].user_id,email:q.rows[0].email,name:q.rows[0].name,expiresAt:q.rows[0].expires_at||null};});}
export async function resolveAuthorizedStore(userId,requestedStoreId=''){
  const storeId=clean(requestedStoreId);return withClient(async client=>{
    const params=[userId];let storeClause='';if(storeId){params.push(storeId);storeClause=`AND st.id=$2`;}
    const q=await client.query(`SELECT st.id store_id,st.name store_name,st.workspace_id,ws.name workspace_name,ws.account_id,a.id account_id,a.name account_name,m.role,m.permissions
      FROM platform_stores st
      JOIN platform_workspaces ws ON ws.id=st.workspace_id AND ws.status='active'
      JOIN platform_accounts a ON a.id=ws.account_id AND a.status='active'
      JOIN platform_memberships m ON m.user_id=$1 AND m.account_id=a.id AND m.status='active'
       AND (m.workspace_id IS NULL OR m.workspace_id=ws.id)
       AND (m.store_id IS NULL OR m.store_id=st.id)
      WHERE st.status<>'archived' ${storeClause}
      ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,st.created_at ASC LIMIT 1`,params);
    if(!q.rowCount){const e=new Error(storeId?'No access to requested Store':'No authorized Store found');e.statusCode=403;throw e;}
    const r=q.rows[0];return {userId,tenantId:r.account_id,accountId:r.account_id,accountName:r.account_name,workspaceId:r.workspace_id,workspaceName:r.workspace_name,storeId:r.store_id,storeName:r.store_name,role:r.role,permissions:Array.isArray(r.permissions)?r.permissions:[]};
  });
}
export function assertWriteRole(scope){if(!['owner','admin','manager','editor','catalog-manager'].includes(scope.role)){const e=new Error('Write permission denied for this Store');e.statusCode=403;throw e;}}
export function assertAdminRole(scope){if(!['owner','admin'].includes(scope.role)){const e=new Error('Admin permission required');e.statusCode=403;throw e;}}

export function assertOrderWriteRole(scope){if(!['owner','admin','manager','editor','order-manager'].includes(scope.role)){const e=new Error('Order/shipping write permission denied for this Store');e.statusCode=403;throw e;}}
