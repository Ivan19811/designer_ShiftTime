// 01600 · Server-side checks for scoped custom roles and sticky enrollment.
// Every write is authorized before request content is parsed or any mutation begins.
import {grantDecision01600,requireProtectedAccess01600} from './access-enforcement-core-01600.mjs';
const clean=v=>String(v??'').trim();
const defaultRun=async fn=>(await import('./db.mjs')).withClient(fn);
export async function inspectProtectedAccess01600(scope,userId,action,{run=defaultRun}={}){
  if(!scope?.accountId||!scope?.workspaceId||!scope?.storeId||!clean(userId)||!action?.permission){
    throw Object.assign(new Error('ST_ACCESS_SCOPE_REQUIRED_01600'),{statusCode:403});
  }
  const siteId=clean(action.siteId);
  // 01605D · A site path must belong to the authenticated Account/Workspace/Store
  // even for owners and non-enrolled legacy roles. No authority comes from the URL alone.
  if(scope.role==='owner'){
    if(siteId)await run(async client=>{
      const valid=await client.query(`SELECT 1 FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active'`,[siteId,scope.accountId,scope.workspaceId,scope.storeId]);
      if(!valid.rowCount)throw Object.assign(new Error('ST_ACCESS_SITE_SCOPE_DENIED_01600'),{code:'ST_ACCESS_SITE_SCOPE_DENIED_01600',statusCode:403});
    });
    return {allowed:true,mode:'owner',permission:action.permission};
  }
  return run(async client=>{
    const enrolled=await client.query(`SELECT mode FROM platform_access_enrollments_01600 WHERE account_id=$1 AND store_id=$2 AND user_id=$3 AND mode='custom' LIMIT 1`,[scope.accountId,scope.storeId,userId]);
    // The tenant boundary precedes both legacy and custom authorization decisions.
    if(siteId){
      const valid=await client.query(`SELECT 1 FROM shifttime_builder_sites WHERE id=$1 AND account_id=$2 AND workspace_id=$3 AND store_id=$4 AND status='active'`,[siteId,scope.accountId,scope.workspaceId,scope.storeId]);
      if(!valid.rowCount)throw Object.assign(new Error('ST_ACCESS_SITE_SCOPE_DENIED_01600'),{code:'ST_ACCESS_SITE_SCOPE_DENIED_01600',statusCode:403});
    }
    // Existing staff without custom assignment retain the pre-01600 legacy authorizations.
    // Once enrolled, removal of EVERY role cannot restore legacy write privileges.
    if(!enrolled.rowCount){
      const roles=action.legacy==='admin'?['admin']:action.legacy==='order-write'?['admin','manager','editor','order-manager']:action.legacy==='order-read'?['admin','manager','editor','order-manager','viewer']:action.legacy==='read'?['admin','manager','editor','catalog-manager','order-manager','viewer']:['admin','manager','editor','catalog-manager'];
      const result=grantDecision01600({role:scope.role,enrolled:false,permission:action.permission,legacyAllowed:roles.includes(scope.role)});
      return {...requireProtectedAccess01600(result,action.permission),permission:action.permission};
    }
    const q=await client.query(`SELECT r.permissions,a.scope_kind "scopeKind",s.id "siteId" FROM platform_role_assignments_01597 a
      JOIN platform_custom_roles_01597 r ON r.id=a.role_id AND r.account_id=a.account_id AND r.status='active'
      JOIN platform_memberships m ON m.id=a.membership_id AND m.account_id=a.account_id AND m.status='active'
      LEFT JOIN shifttime_builder_sites s ON s.id=a.site_id AND s.account_id=a.account_id AND s.workspace_id=$2 AND s.store_id=a.store_id AND s.status='active'
      WHERE a.account_id=$1 AND a.store_id=$3 AND m.user_id=$4 AND a.status='active'
        AND (m.workspace_id IS NULL OR m.workspace_id=$2) AND (m.store_id IS NULL OR m.store_id=$3)
        AND (a.scope_kind='store' OR (($5::text IS NOT NULL OR $6::boolean) AND a.scope_kind='site' AND s.id IS NOT NULL AND ($6::boolean OR s.id=$5)))`,
    [scope.accountId,scope.workspaceId,scope.storeId,userId,siteId||null,!!action.siteList]);
    const permissions=[...new Set(q.rows.flatMap(r=>Array.isArray(r.permissions)?r.permissions:[]))];
    if(action.siteList){
      const allStores=q.rows.filter(r=>r.scopeKind==='store').some(r=>Array.isArray(r.permissions)&&r.permissions.includes(action.permission));
      const allowedSiteIds=[...new Set(q.rows.filter(r=>r.scopeKind==='site'&&r.siteId&&Array.isArray(r.permissions)&&r.permissions.includes(action.permission)).map(r=>r.siteId))];
      return {...requireProtectedAccess01600({allowed:allStores||allowedSiteIds.length>0,mode:'custom'},action.permission),
        permission:action.permission,allowedSiteIds:allStores?null:allowedSiteIds};
    }
    const result=grantDecision01600({role:scope.role,enrolled:true,permissions,permission:action.permission});
    return {...requireProtectedAccess01600(result,action.permission),permission:action.permission};
  });
}
export function assertLegacyForUnmanaged01600(scope,decision,kind='write'){
  if(decision?.mode==='custom'||decision?.mode==='owner')return;
  // Legacy guards remain in place for non-migrated staff.
  const roles=kind==='admin'?['owner','admin']:kind==='order'?['owner','admin','manager','editor','order-manager']:['owner','admin','manager','editor','catalog-manager'];
  if(!roles.includes(scope?.role))throw Object.assign(new Error('ST_ACCESS_LEGACY_ROLE_DENIED_01600'),{statusCode:403});
}
