import crypto from 'node:crypto';
import {withClient} from './db.mjs';
import {
  ADMIN_ROLES_01087,
  assertCapability01087,
  assertOwnerActor01087,
  canManageTargetRole01087,
  normalizePermissions01087,
  normalizeRole01087,
} from './admin-access-01087.mjs';

const clean=(v)=>String(v??'').trim();
const uid=(prefix)=>`${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
const fail=(message,statusCode=400,code='ST_ADMIN_ERROR')=>Object.assign(new Error(message),{statusCode,code});
import {hashInvitationToken01087,validateInvitationEmail01087,normalizeInvitationScope01087,assertMembershipMutationInvariant01087,membershipInviteAction01087,requiresRolesManage01087} from './admin-service-helpers-01087.mjs';
export {hashInvitationToken01087,validateInvitationEmail01087,normalizeInvitationScope01087,assertMembershipMutationInvariant01087,membershipInviteAction01087,requiresRolesManage01087} from './admin-service-helpers-01087.mjs';

async function audit(client,scope,actorUserId,action,targetType,targetId,payload={}){
  await client.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,[scope.accountId,scope.workspaceId||null,scope.storeId||null,actorUserId,action,targetType,targetId||'',JSON.stringify(payload||{})]);
}

export async function getAdminOverview01087(scope,actorUserId){
  assertCapability01087(scope,'admin.view','Admin access required');
  return withClient(async client=>{
    const [members,workspaces,stores,invites,auditRows]=await Promise.all([
      client.query(`SELECT count(DISTINCT user_id)::int n FROM platform_memberships WHERE account_id=$1 AND status='active'`,[scope.accountId]),
      client.query(`SELECT count(*)::int n FROM platform_workspaces WHERE account_id=$1 AND status='active'`,[scope.accountId]),
      client.query(`SELECT count(*)::int n FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id WHERE w.account_id=$1 AND s.status<>'archived'`,[scope.accountId]),
      client.query(`SELECT count(*)::int n FROM platform_invitations WHERE account_id=$1 AND status='pending' AND expires_at>now()`,[scope.accountId]),
      client.query(`SELECT id,action,target_type "targetType",target_id "targetId",payload,created_at "createdAt" FROM platform_admin_audit_log WHERE account_id=$1 ORDER BY id DESC LIMIT 12`,[scope.accountId]),
    ]);
    return {stage:'01087',accountId:scope.accountId,actorUserId,counts:{members:members.rows[0]?.n||0,workspaces:workspaces.rows[0]?.n||0,stores:stores.rows[0]?.n||0,pendingInvitations:invites.rows[0]?.n||0},recentAudit:auditRows.rows};
  });
}

export async function listMembers01087(scope){
  assertCapability01087(scope,'admin.view','Admin access required');
  return withClient(async client=>{
    const q=await client.query(`SELECT m.id,m.user_id "userId",u.email,u.name,m.account_id "accountId",m.workspace_id "workspaceId",w.name "workspaceName",m.store_id "storeId",s.name "storeName",m.role,m.status,m.permissions,m.created_at "createdAt",m.updated_at "updatedAt"
      FROM platform_memberships m JOIN platform_users u ON u.id=m.user_id
      LEFT JOIN platform_workspaces w ON w.id=m.workspace_id LEFT JOIN platform_stores s ON s.id=m.store_id
      WHERE m.account_id=$1 ORDER BY CASE m.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END,u.name,u.email,m.created_at`,[scope.accountId]);
    return q.rows;
  });
}

export async function updateMembership01087(scope,actorUserId,membershipId,input={}){
  assertCapability01087(scope,'admin.users.manage','User management permission required');
  if(requiresRolesManage01087(input))assertCapability01087(scope,'admin.roles.manage','Role management permission required');
  const id=clean(membershipId);if(!id)throw fail('Membership id is required');
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      const targetQ=await client.query(`SELECT id,user_id,role,status,permissions FROM platform_memberships WHERE id=$1 AND account_id=$2 FOR UPDATE`,[id,scope.accountId]);
      if(!targetQ.rowCount)throw fail('Membership not found',404,'ST_MEMBERSHIP_NOT_FOUND');
      const target=targetQ.rows[0];
      const ownerCountQ=await client.query(`SELECT count(*)::int n FROM platform_memberships WHERE account_id=$1 AND role='owner' AND status='active'`,[scope.accountId]);
      const nextRole=input.role===undefined?target.role:normalizeRole01087(input.role,{fallback:''});
      if(!ADMIN_ROLES_01087.includes(nextRole))throw fail('Unsupported role',400,'ST_ROLE_INVALID');
      const nextStatus=input.status===undefined?target.status:clean(input.status).toLowerCase();
      if(!['active','disabled'].includes(nextStatus))throw fail('Unsupported membership status',400,'ST_MEMBERSHIP_STATUS');
      assertMembershipMutationInvariant01087({actorRole:scope.role,targetRole:target.role,nextRole,nextStatus,activeOwnerCount:ownerCountQ.rows[0]?.n||0});
      if(!canManageTargetRole01087(scope,nextRole))throw fail('Owner permission required to assign this role',403,'ST_OWNER_REQUIRED');
      const permissions=input.permissions===undefined?normalizePermissions01087(target.permissions):normalizePermissions01087(input.permissions);
      const q=await client.query(`UPDATE platform_memberships SET role=$3,status=$4,permissions=$5::jsonb,updated_at=now() WHERE id=$1 AND account_id=$2 RETURNING id,user_id "userId",account_id "accountId",workspace_id "workspaceId",store_id "storeId",role,status,permissions,updated_at "updatedAt"`,[id,scope.accountId,nextRole,nextStatus,JSON.stringify(permissions)]);
      await audit(client,scope,actorUserId,'membership.update','membership',id,{before:{role:target.role,status:target.status,permissions:target.permissions},after:{role:nextRole,status:nextStatus,permissions}});
      await client.query('COMMIT');return q.rows[0];
    }catch(e){try{await client.query('ROLLBACK');}catch{}throw e;}
  });
}

export async function listInvitations01087(scope){
  assertCapability01087(scope,'admin.view','Admin access required');
  return withClient(async client=>{const q=await client.query(`SELECT i.id,i.email,i.role,i.permissions,i.status,i.workspace_id "workspaceId",w.name "workspaceName",i.store_id "storeId",s.name "storeName",i.invited_by_user_id "invitedByUserId",u.name "invitedByName",i.expires_at "expiresAt",i.created_at "createdAt",i.accepted_at "acceptedAt" FROM platform_invitations i LEFT JOIN platform_workspaces w ON w.id=i.workspace_id LEFT JOIN platform_stores s ON s.id=i.store_id LEFT JOIN platform_users u ON u.id=i.invited_by_user_id WHERE i.account_id=$1 ORDER BY i.created_at DESC LIMIT 100`,[scope.accountId]);return q.rows;});
}

export async function createInvitation01087(scope,actorUserId,input={}){
  assertCapability01087(scope,'admin.invites.manage','Invitation permission required');
  const email=validateInvitationEmail01087(input.email),role=normalizeRole01087(input.role,{fallback:'viewer'}),permissions=normalizePermissions01087(input.permissions);
  if(role==='owner')assertOwnerActor01087(scope);
  const inviteScope=normalizeInvitationScope01087(scope,input.scopeMode||'store');
  const expiresHours=Math.min(24*30,Math.max(1,Number(input.expiresHours)||168));
  return withClient(async client=>{
    await client.query('BEGIN');
    try{
      const userQ=await client.query(`SELECT id,email,name,status FROM platform_users WHERE lower(email)=lower($1) LIMIT 1`,[email]);
      if(userQ.rowCount){
        const user=userQ.rows[0];
        const exists=await client.query(`SELECT id,status,role FROM platform_memberships WHERE account_id=$1 AND user_id=$2 ORDER BY created_at LIMIT 1 FOR UPDATE`,[scope.accountId,user.id]);
        const existingMembership=exists.rows[0]||null;
        const action=membershipInviteAction01087(existingMembership);
        if(action==='conflict')throw fail('Користувач уже має доступ до цього Account',409,'ST_MEMBER_EXISTS');
        let q,memberId;
        if(action==='reactivate'){
          memberId=existingMembership.id;
          q=await client.query(`UPDATE platform_memberships SET workspace_id=$3,store_id=$4,role=$5,status='active',permissions=$6::jsonb,updated_at=now() WHERE id=$1 AND account_id=$2 RETURNING id,user_id "userId",account_id "accountId",workspace_id "workspaceId",store_id "storeId",role,status,permissions`,[memberId,scope.accountId,inviteScope.workspaceId,inviteScope.storeId,role,JSON.stringify(permissions)]);
          await audit(client,scope,actorUserId,'membership.reactivate','membership',memberId,{email,role,scopeMode:inviteScope.scopeMode});
        }else{
          memberId=uid('member');
          q=await client.query(`INSERT INTO platform_memberships(id,user_id,account_id,workspace_id,store_id,role,status,permissions) VALUES($1,$2,$3,$4,$5,$6,'active',$7::jsonb) RETURNING id,user_id "userId",account_id "accountId",workspace_id "workspaceId",store_id "storeId",role,status,permissions`,[memberId,user.id,scope.accountId,inviteScope.workspaceId,inviteScope.storeId,role,JSON.stringify(permissions)]);
          await audit(client,scope,actorUserId,'membership.add-existing','membership',memberId,{email,role,scopeMode:inviteScope.scopeMode});
        }
        await client.query('COMMIT');return {kind:'membership',member:{...q.rows[0],email:user.email,name:user.name},inviteToken:'',inviteLinkToken:''};
      }
      const token=crypto.randomBytes(32).toString('base64url'),tokenHash=hashInvitationToken01087(token),invitationId=uid('invite');
      const existing=await client.query(`SELECT id FROM platform_invitations WHERE account_id=$1 AND lower(email)=lower($2) AND status='pending' LIMIT 1 FOR UPDATE`,[scope.accountId,email]);
      let q;
      if(existing.rowCount){
        q=await client.query(`UPDATE platform_invitations SET workspace_id=$3,store_id=$4,role=$5,permissions=$6::jsonb,token_hash=$7,status='pending',invited_by_user_id=$8,expires_at=now()+($9::text||' hours')::interval,updated_at=now() WHERE id=$1 AND account_id=$2 RETURNING id,email,role,permissions,status,workspace_id "workspaceId",store_id "storeId",expires_at "expiresAt",created_at "createdAt"`,[existing.rows[0].id,scope.accountId,inviteScope.workspaceId,inviteScope.storeId,role,JSON.stringify(permissions),tokenHash,actorUserId,String(expiresHours)]);
      }else{
        q=await client.query(`INSERT INTO platform_invitations(id,account_id,workspace_id,store_id,email,role,permissions,token_hash,status,invited_by_user_id,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'pending',$9,now()+($10::text||' hours')::interval) RETURNING id,email,role,permissions,status,workspace_id "workspaceId",store_id "storeId",expires_at "expiresAt",created_at "createdAt"`,[invitationId,scope.accountId,inviteScope.workspaceId,inviteScope.storeId,email,role,JSON.stringify(permissions),tokenHash,actorUserId,String(expiresHours)]);
      }
      await audit(client,scope,actorUserId,'invitation.create','invitation',q.rows[0].id,{email,role,scopeMode:inviteScope.scopeMode,expiresHours});
      await client.query('COMMIT');return {kind:'invitation',invitation:q.rows[0],inviteToken:token,inviteLinkToken:token};
    }catch(e){try{await client.query('ROLLBACK');}catch{}throw e;}
  });
}

export async function revokeInvitation01087(scope,actorUserId,invitationId){
  assertCapability01087(scope,'admin.invites.manage','Invitation permission required');
  const id=clean(invitationId);return withClient(async client=>{await client.query('BEGIN');try{const q=await client.query(`UPDATE platform_invitations SET status='revoked',updated_at=now() WHERE id=$1 AND account_id=$2 AND status='pending' RETURNING id,email,status`,[id,scope.accountId]);if(!q.rowCount)throw fail('Pending invitation not found',404,'ST_INVITE_NOT_FOUND');await audit(client,scope,actorUserId,'invitation.revoke','invitation',id,{email:q.rows[0].email});await client.query('COMMIT');return q.rows[0];}catch(e){try{await client.query('ROLLBACK');}catch{}throw e;}});
}

export async function inspectInvitation01087(token){
  const hash=hashInvitationToken01087(token);if(!clean(token))throw fail('Invitation token is required',400,'ST_INVITE_TOKEN');
  return withClient(async client=>{const q=await client.query(`SELECT i.id,i.email,i.role,i.permissions,i.account_id "accountId",a.name "accountName",i.workspace_id "workspaceId",w.name "workspaceName",i.store_id "storeId",s.name "storeName",i.expires_at "expiresAt" FROM platform_invitations i JOIN platform_accounts a ON a.id=i.account_id LEFT JOIN platform_workspaces w ON w.id=i.workspace_id LEFT JOIN platform_stores s ON s.id=i.store_id WHERE i.token_hash=$1 AND i.status='pending' AND i.expires_at>now() LIMIT 1`,[hash]);if(!q.rowCount)throw fail('Запрошення недійсне або прострочене',404,'ST_INVITE_INVALID');return q.rows[0];});
}

export async function loadInvitationForRegistration01087(client,{inviteToken,email}={}){
  const token=clean(inviteToken);if(!token)return null;const normalizedEmail=validateInvitationEmail01087(email),hash=hashInvitationToken01087(token);
  const q=await client.query(`SELECT i.*,a.name account_name,w.name workspace_name,s.name store_name FROM platform_invitations i JOIN platform_accounts a ON a.id=i.account_id LEFT JOIN platform_workspaces w ON w.id=i.workspace_id LEFT JOIN platform_stores s ON s.id=i.store_id WHERE i.token_hash=$1 AND i.status='pending' AND i.expires_at>now() LIMIT 1 FOR UPDATE OF i`,[hash]);
  if(!q.rowCount)throw fail('Запрошення недійсне або прострочене',404,'ST_INVITE_INVALID');const invitation=q.rows[0];if(clean(invitation.email).toLowerCase()!==normalizedEmail)throw fail('Email не збігається із запрошенням',409,'ST_INVITE_EMAIL_MISMATCH');return invitation;
}

export async function acceptInvitationForUser01087(client,{invitation,userId}={}){
  if(!invitation||!userId)throw fail('Invitation and user are required');
  const existing=await client.query(`SELECT id,role,status FROM platform_memberships WHERE account_id=$1 AND user_id=$2 LIMIT 1`,[invitation.account_id,userId]);
  let membershipId=existing.rows[0]?.id||'';
  if(!existing.rowCount){membershipId=uid('member');await client.query(`INSERT INTO platform_memberships(id,user_id,account_id,workspace_id,store_id,role,status,permissions) VALUES($1,$2,$3,$4,$5,$6,'active',$7::jsonb)`,[membershipId,userId,invitation.account_id,invitation.workspace_id||null,invitation.store_id||null,invitation.role,JSON.stringify(normalizePermissions01087(invitation.permissions))]);}
  else if(existing.rows[0].status==='disabled')await client.query(`UPDATE platform_memberships SET status='active',role=$3,permissions=$4::jsonb,updated_at=now() WHERE id=$1 AND account_id=$2`,[membershipId,invitation.account_id,invitation.role,JSON.stringify(normalizePermissions01087(invitation.permissions))]);
  await client.query(`UPDATE platform_invitations SET status='accepted',accepted_by_user_id=$2,accepted_at=now(),updated_at=now() WHERE id=$1`,[invitation.id,userId]);
  await client.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload) VALUES($1,$2,$3,$4,'invitation.accept','invitation',$5,$6::jsonb)`,[invitation.account_id,invitation.workspace_id||null,invitation.store_id||null,userId,invitation.id,JSON.stringify({membershipId})]);
  const storeQ=invitation.store_id?await client.query(`SELECT s.id store_id,s.name store_name,w.id workspace_id,w.name workspace_name,a.id account_id,a.name account_name FROM platform_stores s JOIN platform_workspaces w ON w.id=s.workspace_id JOIN platform_accounts a ON a.id=w.account_id WHERE s.id=$1`,[invitation.store_id]):invitation.workspace_id?await client.query(`SELECT s.id store_id,s.name store_name,w.id workspace_id,w.name workspace_name,a.id account_id,a.name account_name FROM platform_workspaces w JOIN platform_accounts a ON a.id=w.account_id JOIN platform_stores s ON s.workspace_id=w.id AND s.status<>'archived' WHERE w.id=$1 ORDER BY s.created_at LIMIT 1`,[invitation.workspace_id]):await client.query(`SELECT s.id store_id,s.name store_name,w.id workspace_id,w.name workspace_name,a.id account_id,a.name account_name FROM platform_accounts a JOIN platform_workspaces w ON w.account_id=a.id AND w.status='active' JOIN platform_stores s ON s.workspace_id=w.id AND s.status<>'archived' WHERE a.id=$1 ORDER BY w.created_at,s.created_at LIMIT 1`,[invitation.account_id]);
  if(!storeQ.rowCount)throw fail('Запрошений Account не має активного Store',409,'ST_INVITE_NO_STORE');const r=storeQ.rows[0];
  return {membershipId,scope:{userId,tenantId:r.account_id,accountId:r.account_id,accountName:r.account_name,workspaceId:r.workspace_id,workspaceName:r.workspace_name,storeId:r.store_id,storeName:r.store_name,role:invitation.role,permissions:normalizePermissions01087(invitation.permissions)}};
}
