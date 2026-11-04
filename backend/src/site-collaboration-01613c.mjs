// 01613C · Site collaboration: explicit invite acceptance, always site-scoped.
// No shared passwords or email-based auto-grants; token hashes stored in PostgreSQL.
import crypto from 'node:crypto';

const clean=v=>String(v??'').trim();
const fail=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const uid=p=>`${p}_${crypto.randomUUID().replaceAll('-','').slice(0,20)}`;
export const hashSiteInvite01613C=token=>crypto.createHash('sha256').update(clean(token)).digest('hex');
export const validSiteInvite01613C=token=>/^[A-Za-z0-9_-]{43}$/.test(clean(token));
export const SITE_COLLAB_PERMISSIONS_01613C=Object.freeze({
 viewer:Object.freeze(['site.pages.view','site.design.view','site.publish.view']),
 editor:Object.freeze([
  'site.pages.view','site.pages.create','site.pages.edit','site.design.view','site.design.edit','site.publish.view',
  'api.mode.site_actions','site.design.actions.metadata_edit','site.design.actions.project_replace',
  'site.design.actions.draft_create','site.design.actions.draft_replace','site.design.actions.draft_details','site.design.actions.draft_delete',
  'site.design.canvas.create','site.design.canvas.update','site.design.canvas.move','site.design.canvas.delete',
  'ui.mode.navigation','ui.mode.inspector','ui.mode.controls','ui.nav.site','ui.nav.pages',
  'ui.inspector.siteopen','ui.inspector.pageadd','ui.inspector.sectionadd','ui.inspector.pagesave',
  'ui.control.pagecreate','ui.control.pagesave','ui.control.sectioncreate'
 ])
});
export function validateSiteCollab01613C(input={}){
 const siteId=clean(input.siteId),recipient=clean(input.recipient||input.email),access=clean(input.accessLevel)||'editor';
 if(!siteId||siteId.length>160||!/^[\w-]+$/.test(siteId))throw fail('ST_SITE_INVITE_SITE_INVALID_01613C');
 if(!['editor','viewer'].includes(access))throw fail('ST_SITE_INVITE_ACCESS_INVALID_01613C');
 if(!recipient||recipient.length>254||!( /^\S+@\S+\.\S+$/.test(recipient.toLowerCase())||/^(usr|user)_[a-f0-9]{16,40}$/.test(recipient)))throw fail('ST_SITE_INVITE_RECIPIENT_INVALID_01613C');
 return {siteId,recipient,accessLevel:access};
}
const owner=scope=>{
 if(scope?.role!=='owner'||!scope.accountId||!scope.workspaceId||!scope.storeId)throw fail('ST_SITE_INVITE_OWNER_REQUIRED_01613C',403);
};
const audit=(c,scope,actor,action,target,payload={})=>c.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload) VALUES($1,$2,$3,$4,$5,'site_collaboration',$6,$7::jsonb)`,[scope.accountId,scope.workspaceId,scope.storeId,actor,action,target,JSON.stringify(payload)]);
const transaction=async(run,fn)=>run(async c=>{await c.query('BEGIN');try{const result=await fn(c);await c.query('COMMIT');return result;}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}});
const defaultRun=async fn=>(await import('./db.mjs')).withClient(fn);

export async function listSiteInvites01613C(scope,{run=defaultRun}={}){
 owner(scope);return run(async c=>{
  const q=await c.query(`SELECT i.id,i.site_id "siteId",s.name "siteName",i.recipient_email "email",i.access_level "accessLevel",i.status,i.created_at "createdAt",i.expires_at "expiresAt",i.accepted_at "acceptedAt",i.assignment_id "assignmentId" FROM platform_site_collaboration_invites_01613c i JOIN shifttime_builder_sites s ON s.id=i.site_id AND s.account_id=i.account_id AND s.store_id=i.store_id WHERE i.account_id=$1 AND i.workspace_id=$2 AND i.store_id=$3 ORDER BY i.created_at DESC LIMIT 100`,[scope.accountId,scope.workspaceId,scope.storeId]);
  return {stage:'01613C',invitations:q.rows};
 });
}
export async function createSiteInvite01613C(scope,actor,input,{run=defaultRun}={}){
 owner(scope);const data=validateSiteCollab01613C(input);
 return transaction(run,async c=>{
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[scope.accountId,data.siteId]);
  const site=await c.query(`SELECT id FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active' FOR UPDATE`,[data.siteId,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!site.rowCount)throw fail('ST_SITE_INVITE_SCOPE_DENIED_01613C',403);
  let email=data.recipient.toLowerCase();
  if(!email.includes('@')){
   const user=await c.query(`SELECT email FROM platform_users WHERE id=$1 AND status='active'`,[data.recipient]);
   if(!user.rowCount)throw fail('ST_SITE_INVITE_RECIPIENT_NOT_FOUND_01613C',404);
   email=clean(user.rows[0].email).toLowerCase();
  }
  const actorUser=await c.query(`SELECT email FROM platform_users WHERE id=$1`,[actor]);
  if(actorUser.rows[0]?.email?.toLowerCase()===email)throw fail('ST_SITE_INVITE_SELF_DENIED_01613C',409);
  const token=crypto.randomBytes(32).toString('base64url'),hash=hashSiteInvite01613C(token);
  const existing=await c.query(`SELECT id FROM platform_site_collaboration_invites_01613c WHERE account_id=$1 AND site_id=$2 AND lower(recipient_email)=$3 AND status='pending' FOR UPDATE`,[scope.accountId,data.siteId,email]);
  let id;
  if(existing.rowCount){id=existing.rows[0].id;await c.query(`UPDATE platform_site_collaboration_invites_01613c SET token_hash=$2,access_level=$3,expires_at=now()+interval '7 days',invited_by_user_id=$4 WHERE id=$1`,[id,hash,data.accessLevel,actor]);}
  else{id=uid('scinv');await c.query(`INSERT INTO platform_site_collaboration_invites_01613c(id,account_id,workspace_id,store_id,site_id,recipient_email,access_level,token_hash,expires_at,invited_by_user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,now()+interval '7 days',$9)`,[id,scope.accountId,scope.workspaceId,scope.storeId,data.siteId,email,data.accessLevel,hash,actor]);}
  await audit(c,scope,actor,'site.invite.create',id,{siteId:data.siteId,accessLevel:data.accessLevel});
  // The bearer link is returned ONLY to the authorized owner, never in list/read logs.
  return {stage:'01613C',invitation:{id,siteId:data.siteId,email,accessLevel:data.accessLevel,status:'pending'},inviteToken:token};
 });
}
export async function revokeSiteInvite01613C(scope,actor,id,{run=defaultRun}={}){
 owner(scope);if(!/^scinv_[a-f0-9]{20}$/.test(clean(id)))throw fail('ST_SITE_INVITE_ID_INVALID_01613C');
 return transaction(run,async c=>{
  const q=await c.query(`SELECT id,status,assignment_id,site_id FROM platform_site_collaboration_invites_01613c WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 FOR UPDATE`,[id,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!q.rowCount||q.rows[0].status==='revoked')throw fail('ST_SITE_INVITE_NOT_FOUND_01613C',404);
  const row=q.rows[0];
  if(row.assignment_id)await c.query(`UPDATE platform_role_assignments_01597 SET status='revoked',revoked_at=now() WHERE id=$1 AND account_id=$2 AND store_id=$3 AND site_id=$4 AND status='active'`,[row.assignment_id,scope.accountId,scope.storeId,row.site_id]);
  await c.query(`UPDATE platform_site_collaboration_invites_01613c SET status='revoked',revoked_at=now() WHERE id=$1`,[id]);
  await audit(c,scope,actor,'site.invite.revoke',id,{siteId:row.site_id});
  return {ok:true,stage:'01613C'};
 });
}
// Called with a separately verified user session; never infer identity from the email field in the request.
export async function acceptSiteInvite01613C(userId,token,{run=defaultRun}={}){
 if(!clean(userId))throw fail('ST_SITE_INVITE_AUTH_REQUIRED_01613C',401);
 if(!validSiteInvite01613C(token))throw fail('ST_SITE_INVITE_INVALID_01613C',400);
 return transaction(run,async c=>{
  const q=await c.query(`SELECT i.* FROM platform_site_collaboration_invites_01613c i WHERE i.token_hash=$1 AND i.status='pending' AND i.expires_at>now() FOR UPDATE`,[hashSiteInvite01613C(token)]);
  if(!q.rowCount)throw fail('ST_SITE_INVITE_INVALID_01613C',404);
  const inv=q.rows[0];
  const user=await c.query(`SELECT email FROM platform_users WHERE id=$1 AND status='active'`,[userId]);
  if(!user.rowCount||clean(user.rows[0].email).toLowerCase()!==inv.recipient_email.toLowerCase())throw fail('ST_SITE_INVITE_EMAIL_MISMATCH_01613C',403);
  const site=await c.query(`SELECT 1 FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active'`,[inv.site_id,inv.account_id,inv.workspace_id,inv.store_id]);
  if(!site.rowCount)throw fail('ST_SITE_INVITE_SITE_UNAVAILABLE_01613C',409);
  const disabled=await c.query(`SELECT 1 FROM platform_memberships WHERE user_id=$1 AND account_id=$2 AND status='disabled' LIMIT 1`,[userId,inv.account_id]);
  if(disabled.rowCount)throw fail('ST_SITE_INVITE_MEMBER_DISABLED_01613C',403);
  const m=await c.query(`SELECT id,role FROM platform_memberships WHERE user_id=$1 AND account_id=$2 AND status='active' AND (workspace_id IS NULL OR workspace_id=$3) AND (store_id IS NULL OR store_id=$4) ORDER BY created_at LIMIT 1 FOR UPDATE`,[userId,inv.account_id,inv.workspace_id,inv.store_id]);
  let memberId=m.rows[0]?.id;
  if(m.rowCount&&m.rows[0].role==='owner')throw fail('ST_SITE_INVITE_SELF_DENIED_01613C',409);
  if(!memberId){
   memberId=uid('member');
   await c.query(`INSERT INTO platform_memberships(id,user_id,account_id,workspace_id,store_id,role,status,permissions) VALUES($1,$2,$3,$4,$5,'viewer','active','[]'::jsonb)`,[memberId,userId,inv.account_id,inv.workspace_id,inv.store_id]);
   await c.query(`INSERT INTO platform_site_collaboration_only_01613c(account_id,store_id,user_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[inv.account_id,inv.store_id,userId]);
  }
  const roleName=inv.access_level==='viewer'?'ShiftTime Site Viewer 01613C':'ShiftTime Site Editor 01613C';
  const permissions=[...SITE_COLLAB_PERMISSIONS_01613C[inv.access_level]].sort();
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[inv.account_id,roleName]);
  let roles=await c.query(`SELECT id,permissions,status FROM platform_custom_roles_01597 WHERE account_id=$1 AND lower(name)=lower($2) LIMIT 1 FOR UPDATE`,[inv.account_id,roleName]);
  let roleId=roles.rows[0]?.id;
  if(!roleId){roleId=uid('arole');await c.query(`INSERT INTO platform_custom_roles_01597(id,account_id,name,description,permissions,created_by_user_id,updated_by_user_id) VALUES($1,$2,$3,$4,$5::jsonb,$6,$6)`,[roleId,inv.account_id,roleName,'01613C system collaboration preset',JSON.stringify(permissions),inv.invited_by_user_id]);}
  else if(roles.rows[0].status!=='active'||JSON.stringify([...roles.rows[0].permissions].sort())!==JSON.stringify(permissions))throw fail('ST_SITE_INVITE_PRESET_MODIFIED_01613C',409);
  await c.query(`INSERT INTO platform_access_enrollments_01600(account_id,store_id,user_id) VALUES($1,$2,$3) ON CONFLICT(account_id,store_id,user_id) DO NOTHING`,[inv.account_id,inv.store_id,userId]);
  const existing=await c.query(`SELECT id FROM platform_role_assignments_01597 WHERE role_id=$1 AND membership_id=$2 AND store_id=$3 AND site_id=$4 AND status='active' LIMIT 1`,[roleId,memberId,inv.store_id,inv.site_id]);
  if(existing.rowCount)throw fail('ST_SITE_INVITE_ALREADY_GRANTED_01613C',409);
  const assignmentId=uid('agrant');
  await c.query(`INSERT INTO platform_role_assignments_01597(id,account_id,role_id,membership_id,store_id,site_id,scope_kind,assigned_by_user_id) VALUES($1,$2,$3,$4,$5,$6,'site',$7)`,[assignmentId,inv.account_id,roleId,memberId,inv.store_id,inv.site_id,inv.invited_by_user_id]);
  await c.query(`UPDATE platform_site_collaboration_invites_01613c SET status='accepted',assignment_id=$2,accepted_by_user_id=$3,accepted_at=now() WHERE id=$1`,[inv.id,assignmentId,userId]);
  await c.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload) VALUES($1,$2,$3,$4,'site.invite.accept','site_collaboration',$5,$6::jsonb)`,[inv.account_id,inv.workspace_id,inv.store_id,userId,inv.id,JSON.stringify({siteId:inv.site_id,accessLevel:inv.access_level})]);
  return {ok:true,stage:'01613C',storeId:inv.store_id,siteId:inv.site_id,accessLevel:inv.access_level};
 });
}

// Strict per-store boundary for memberships created solely by a site invitation.
// This blocks all legacy Marketplace/CRM/Admin/Media APIs until separately audited.
export async function assertSiteOnlyBoundary01613C(scope,userId,parts,{run=defaultRun}={}){
 if(!scope?.accountId||!scope.storeId||!clean(userId)||scope.role==='owner')return;
 const isSite=['sites','site-revisions'].includes(parts?.[2]);
 const isCollab=parts?.[2]==='collaboration'&&parts?.[3]==='accept';
 if(isSite||isCollab)return;
 const marked=await run(c=>c.query(`SELECT 1 FROM platform_site_collaboration_only_01613c WHERE account_id=$1 AND store_id=$2 AND user_id=$3`,[scope.accountId,scope.storeId,userId]));
 if(marked.rowCount)throw fail('ST_SITE_COLLAB_RESOURCE_DENIED_01613C',403);
}
