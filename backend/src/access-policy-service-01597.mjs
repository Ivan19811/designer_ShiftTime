// 01597 · Site/store-scoped role catalog, management, and read-only grant projection.
// Not yet wired into legacy write endpoints (01600); do not represent the preview as enforcement.
import crypto from 'node:crypto';
import {projectOwnNavigation01599} from './access-visibility-core-01599.mjs';
import {accessCatalog01597,assertAccessPolicyManager01597,mergeAccessGrants01597,normalizeAccessRoleInput01597,normalizeAccessAssignment01597} from './access-policy-core-01597.mjs';
const clean=v=>String(v??'').trim();
const uid=prefix=>`${prefix}_${crypto.randomUUID().replace(/-/g,'').slice(0,20)}`;
const err=(code,statusCode=400)=>Object.assign(new Error(code),{code,statusCode});
const ROLE_ID=/^arole_[a-f0-9]{20}$/;
const ASSIGNMENT_ID=/^agrant_[a-f0-9]{20}$/;
const USER_ID=/^(usr|user)_[a-f0-9]{16,40}$/;
function ensureScope(scope){for(const k of ['accountId','workspaceId','storeId'])if(!clean(scope?.[k]))throw err('ST_ACCESS_SCOPE_REQUIRED_01597',403);}

async function assertSiteInStore(c,scope,siteId){
  if(!siteId)return;
  const s=await c.query(`SELECT id FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active'`,[siteId,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!s.rowCount)throw err('ST_ACCESS_SITE_SCOPE_DENIED_01597',403);
}
async function audit(c,scope,actor,action,targetId,details={}){
  await c.query(`INSERT INTO platform_admin_audit_log(account_id,workspace_id,store_id,actor_user_id,action,target_type,target_id,payload) VALUES($1,$2,$3,$4,$5,'access_policy',$6,$7::jsonb)`,[scope.accountId,scope.workspaceId,scope.storeId,actor,action,targetId,JSON.stringify(details)]);
}
async function ensureRole(c,scope,roleId,lock=false){
  const q=await c.query(`SELECT id,account_id,name,description,permissions,status FROM platform_custom_roles_01597 WHERE account_id=$1 AND id=$2 ${lock?'FOR UPDATE':''}`,[scope.accountId,roleId]);
  if(!q.rowCount)throw err('ST_ACCESS_ROLE_NOT_FOUND_01597',404);
  return q.rows[0];
}
async function ensureMembership(c,scope,membershipId){
  const q=await c.query(`SELECT m.id,m.user_id FROM platform_memberships m WHERE m.id=$1 AND m.account_id=$2 AND m.status='active' AND (m.workspace_id IS NULL OR m.workspace_id=$3) AND (m.store_id IS NULL OR m.store_id=$4)`,[membershipId,scope.accountId,scope.workspaceId,scope.storeId]);
  if(!q.rowCount)throw err('ST_ACCESS_MEMBERSHIP_SCOPE_DENIED_01597',403);
  return q.rows[0];
}
async function listGrants(c,scope,userId,siteId=''){
  // Member-store containment is checked on every read, not only on assignment.
  const q=await c.query(`SELECT a.role_id "roleId",a.status,a.scope_kind "scopeKind",a.site_id "siteId",r.status "roleStatus",r.permissions
    FROM platform_role_assignments_01597 a
    JOIN platform_custom_roles_01597 r ON r.id=a.role_id AND r.account_id=a.account_id
    JOIN platform_memberships m ON m.id=a.membership_id AND m.account_id=a.account_id
    WHERE a.account_id=$1 AND a.store_id=$2 AND m.user_id=$3 AND m.status='active'
      AND (m.workspace_id IS NULL OR m.workspace_id=$4) AND (m.store_id IS NULL OR m.store_id=$2)
      AND a.status='active' AND r.status='active' AND (a.scope_kind='store' OR (a.scope_kind='site' AND a.site_id=$5))`,[scope.accountId,scope.storeId,userId,scope.workspaceId,siteId||null]);
  return mergeAccessGrants01597(q.rows,{siteId});
}
const defaultRun=async fn=>(await import('./db.mjs')).withClient(fn);
export function createAccessPolicyService01597({run=defaultRun}={}){
  return {
    catalog:()=>accessCatalog01597(),
    async roles(scope){assertAccessPolicyManager01597(scope);return run(async c=>{
      const q=await c.query(`SELECT r.id,r.name,r.description,r.permissions,r.status,r.created_at "createdAt",r.updated_at "updatedAt",(SELECT count(*)::int FROM platform_role_assignments_01597 a WHERE a.role_id=r.id AND a.account_id=r.account_id AND a.status='active') "assignedCount" FROM platform_custom_roles_01597 r WHERE r.account_id=$1 ORDER BY r.name,r.id LIMIT 200`,[scope.accountId]);return q.rows;
    });},
    async createRole(scope,actor,input){assertAccessPolicyManager01597(scope);const data=normalizeAccessRoleInput01597(input),id=uid('arole');return run(async c=>{
      await c.query('BEGIN');try{
        const q=await c.query(`INSERT INTO platform_custom_roles_01597(id,account_id,name,description,permissions,created_by_user_id,updated_by_user_id) VALUES($1,$2,$3,$4,$5::jsonb,$6,$6) RETURNING id,name,description,permissions,status`,[id,scope.accountId,data.name,data.description,JSON.stringify(data.permissions),actor]);
        await audit(c,scope,actor,'access.role.create',id,{permissions:data.permissions});await c.query('COMMIT');return q.rows[0];
      }catch(e){await c.query('ROLLBACK');if(e.code==='23505')throw err('ST_ACCESS_ROLE_NAME_EXISTS_01597',409);throw e;}
    });},
    async updateRole(scope,actor,id,input){assertAccessPolicyManager01597(scope);if(!ROLE_ID.test(id))throw err('ST_ACCESS_ROLE_ID_INVALID_01597');if(!input||typeof input!=='object'||Array.isArray(input))throw err('ST_ACCESS_ROLE_INPUT_INVALID_01597');return run(async c=>{
      await c.query('BEGIN');try{
        const prev=await ensureRole(c,scope,id,true);
        const data=normalizeAccessRoleInput01597({name:input.name??prev.name,description:input.description??prev.description,permissions:input.permissions??prev.permissions});
        const status=clean(input.status??prev.status);
        if(!['active','disabled'].includes(status))throw err('ST_ACCESS_ROLE_STATUS_INVALID_01597');
        const q=await c.query(`UPDATE platform_custom_roles_01597 SET name=$3,description=$4,permissions=$5::jsonb,status=$6,updated_by_user_id=$7,updated_at=now() WHERE id=$1 AND account_id=$2 RETURNING id,name,description,permissions,status`,[id,scope.accountId,data.name,data.description,JSON.stringify(data.permissions),status,actor]);
        await audit(c,scope,actor,'access.role.update',id,{before:{permissions:prev.permissions,status:prev.status},after:{permissions:data.permissions,status}});await c.query('COMMIT');return q.rows[0];
      }catch(e){await c.query('ROLLBACK');if(e.code==='23505')throw err('ST_ACCESS_ROLE_NAME_EXISTS_01597',409);throw e;}
    });},
    async assignments(scope){assertAccessPolicyManager01597(scope);return run(async c=>{
      const q=await c.query(`SELECT a.id,a.role_id "roleId",r.name "roleName",a.membership_id "membershipId",m.user_id "userId",a.scope_kind "scopeKind",a.site_id "siteId",a.store_id "storeId",a.status,a.created_at "createdAt",a.revoked_at "revokedAt" FROM platform_role_assignments_01597 a JOIN platform_custom_roles_01597 r ON r.id=a.role_id AND r.account_id=a.account_id JOIN platform_memberships m ON m.id=a.membership_id AND m.account_id=a.account_id WHERE a.account_id=$1 AND a.store_id=$2 AND (m.workspace_id IS NULL OR m.workspace_id=$3) AND (m.store_id IS NULL OR m.store_id=$2) ORDER BY a.created_at DESC LIMIT 300`,[scope.accountId,scope.storeId,scope.workspaceId]);return q.rows;
    });},
    async assign(scope,actor,input){assertAccessPolicyManager01597(scope);const data=normalizeAccessAssignment01597(input);return run(async c=>{
      await c.query('BEGIN');try{
        const role=await ensureRole(c,scope,data.roleId,true);if(role.status!=='active')throw err('ST_ACCESS_ROLE_DISABLED_01597',409);
        const member=await ensureMembership(c,scope,data.membershipId);await assertSiteInStore(c,scope,data.siteId);
        // 01600: persist explicit-access enrollment inside the SAME transaction as assignment.
        // This marker survives role revocation, preventing silent legacy privilege restoration.
        await c.query(`INSERT INTO platform_access_enrollments_01600(account_id,store_id,user_id)
          VALUES($1,$2,$3) ON CONFLICT (account_id,store_id,user_id) DO NOTHING`,
          [scope.accountId,scope.storeId,member.user_id]);
        const id=uid('agrant');
        const q=await c.query(`INSERT INTO platform_role_assignments_01597(id,account_id,role_id,membership_id,store_id,site_id,scope_kind,assigned_by_user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,role_id "roleId",membership_id "membershipId",store_id "storeId",site_id "siteId",scope_kind "scopeKind",status`,[id,scope.accountId,data.roleId,data.membershipId,scope.storeId,data.siteId,data.scopeKind,actor]);
        await audit(c,scope,actor,'access.assignment.create',id,{roleId:data.roleId,membershipId:data.membershipId,userId:member.user_id,scopeKind:data.scopeKind,siteId:data.siteId});await c.query('COMMIT');return q.rows[0];
      }catch(e){await c.query('ROLLBACK');if(e.code==='23505')throw err('ST_ACCESS_ASSIGNMENT_EXISTS_01597',409);throw e;}
    });},
    async revoke(scope,actor,id){assertAccessPolicyManager01597(scope);if(!ASSIGNMENT_ID.test(id))throw err('ST_ACCESS_ASSIGNMENT_ID_INVALID_01597');return run(async c=>{
      await c.query('BEGIN');try{
        const q=await c.query(`UPDATE platform_role_assignments_01597 SET status='revoked',revoked_at=now() WHERE id=$1 AND account_id=$2 AND store_id=$3 AND status='active' RETURNING id,role_id "roleId",membership_id "membershipId",status`,[id,scope.accountId,scope.storeId]);
        if(!q.rowCount)throw err('ST_ACCESS_ASSIGNMENT_NOT_FOUND_01597',404);
        await audit(c,scope,actor,'access.assignment.revoke',id,{roleId:q.rows[0].roleId,membershipId:q.rows[0].membershipId});await c.query('COMMIT');return q.rows[0];
      }catch(e){await c.query('ROLLBACK');throw e;}
    });},
    async myNavigation01599(scope,userId){
      ensureScope(scope);if(!USER_ID.test(clean(userId)))throw err('ST_ACCESS_USER_ID_INVALID_01597');
      return run(async c=>{
        // Tenant and Store verified by resolveAuthorizedStore in the router. The actor is
        // taken from the authenticated session and NEVER from a query parameter.
        const q=await c.query(`SELECT a.role_id "roleId",a.status,a.scope_kind "scopeKind",
          a.site_id "siteId",r.status "roleStatus",r.permissions
          FROM platform_role_assignments_01597 a
          JOIN platform_custom_roles_01597 r ON r.id=a.role_id AND r.account_id=a.account_id
          JOIN platform_memberships m ON m.id=a.membership_id AND m.account_id=a.account_id
          LEFT JOIN shifttime_builder_sites s ON s.id=a.site_id AND s.account_id=a.account_id
            AND s.workspace_id=$2 AND s.store_id=a.store_id AND s.status='active'
          WHERE a.account_id=$1 AND a.store_id=$3
            AND m.user_id=$4 AND m.status='active' AND a.status='active' AND r.status='active'
            AND (m.workspace_id IS NULL OR m.workspace_id=$2)
            AND (m.store_id IS NULL OR m.store_id=$3)
            AND (a.scope_kind='store' OR (a.scope_kind='site' AND s.id IS NOT NULL))
          ORDER BY a.id LIMIT 500`,[scope.accountId,scope.workspaceId,scope.storeId,userId]);
        return projectOwnNavigation01599(q.rows,{accountId:scope.accountId,storeId:scope.storeId,userId});
      });
    },
    async myAccess(scope,userId,siteId=''){
      ensureScope(scope);if(!USER_ID.test(clean(userId)))throw err('ST_ACCESS_USER_ID_INVALID_01597');
      return run(async c=>{await assertSiteInStore(c,scope,clean(siteId));return {stage:'01597',storeId:scope.storeId,accountId:scope.accountId,userId,...await listGrants(c,scope,userId,siteId),enforcement:'foundation-only'};});
    },
    async preview(scope,userId,siteId=''){
      assertAccessPolicyManager01597(scope);
      if(!USER_ID.test(clean(userId)))throw err('ST_ACCESS_USER_ID_INVALID_01597');
      return run(async c=>{await assertSiteInStore(c,scope,clean(siteId));const m=await c.query(`SELECT 1 FROM platform_memberships WHERE user_id=$1 AND account_id=$2 AND status='active' AND (workspace_id IS NULL OR workspace_id=$3) AND (store_id IS NULL OR store_id=$4) LIMIT 1`,[userId,scope.accountId,scope.workspaceId,scope.storeId]);if(!m.rowCount)throw err('ST_ACCESS_MEMBERSHIP_SCOPE_DENIED_01597',403);
        return {stage:'01597',accountId:scope.accountId,storeId:scope.storeId,userId,...await listGrants(c,scope,userId,siteId),enforcement:'foundation-only'};});
    },
  };
}
export const accessPolicyService01597=createAccessPolicyService01597();
