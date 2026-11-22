// 01623 · Published-site admin discovery. A buyer-only token never grants Builder authority.
// The published site identity and the platform user ID are resolved by the server,
// never accepted from untrusted request JSON or URL parameters.
import {withClient} from './db.mjs';
import {customerSiteScope01595} from './site-customer-account-core-01595.mjs';

import {resolveBuilderEntry01623,publishedSiteAdminDecision01623} from './site-admin-access-core-01623.mjs';
const clean=value=>String(value??'').trim();
export async function getPublishedSiteAdminAccess01623(site,userId,{query=withClient,callbacks,preferred}={}){
  const scope=customerSiteScope01595(site),uid=clean(userId);
  if(!/^usr_[A-Za-z0-9_-]{8,100}$/.test(uid))return {stage:'01623',role:'customer',canAdmin:false};
  const result=await query(async client=>{
    // Scope to the exact published site, workspace, account and store. Revoked,
    // disabled or archived sites/memberships cannot create Builder affordances.
    const r=await client.query(`SELECT m.role,m.status,a.status "assignmentStatus",r.status "accessRoleStatus",
      a.scope_kind "scopeKind",a.site_id "grantSiteId",r.permissions,
      EXISTS (SELECT 1 FROM platform_access_enrollments_01600 e
        WHERE e.account_id=$2 AND e.store_id=$4 AND e.user_id=$5 AND e.mode='custom') "enrolled"
      FROM shifttime_builder_sites s
      JOIN platform_memberships m ON m.account_id=s.account_id AND m.user_id=$5
        AND m.status='active' AND (m.workspace_id IS NULL OR m.workspace_id=s.workspace_id)
        AND (m.store_id IS NULL OR m.store_id=s.store_id)
      LEFT JOIN platform_role_assignments_01597 a ON a.membership_id=m.id
        AND a.account_id=s.account_id AND a.store_id=s.store_id AND a.status='active'
        AND (a.scope_kind='store' OR a.scope_kind='site' AND a.site_id=s.id)
      LEFT JOIN platform_custom_roles_01597 r ON r.id=a.role_id AND r.account_id=s.account_id AND r.status='active'
      WHERE s.id=$1 AND s.account_id=$2 AND s.workspace_id=$3 AND s.store_id=$4
        AND s.status='active'`,[scope.siteId,site.accountId,site.workspaceId,site.storeId,uid]);
    return publishedSiteAdminDecision01623(r.rows,{siteId:scope.siteId,enrolled:r.rows.some(m=>m.enrolled)});
  });
  if(!result.canAdmin)return {stage:'01623',role:'customer',canAdmin:false};
  const allowed=resolveBuilderEntry01623(callbacks,preferred);
  const builderUrl=allowed?new URL(allowed):null;
  if(builderUrl){builderUrl.searchParams.set('st_sso','1');builderUrl.searchParams.set('st_site_id',scope.siteId);builderUrl.searchParams.set('st_store_id',scope.storeId);}
  return {stage:'01623',role:result.role,canAdmin:true,builderUrl:builderUrl?.href||null};
}
