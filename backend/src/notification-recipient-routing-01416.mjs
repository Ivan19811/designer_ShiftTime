import {withClient} from './db.mjs';
import {NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,NOTIFICATION_RECIPIENT_ROLES_01416,normalizeNotificationRecipients01416,notificationRecipientMatches01416,normalizeNotificationRecipientCatalog01416} from './notification-recipient-routing-core-01416.mjs';
const str=value=>String(value??'').trim();
export async function listNotificationRecipientCatalog01416(scope={}){
  const rows=await withClient(async client=>{const q=await client.query(`SELECT u.id "userId",u.name,u.email,m.role,m.id "membershipId",CASE WHEN m.store_id IS NOT NULL THEN 'store' WHEN m.workspace_id IS NOT NULL THEN 'workspace' ELSE 'tenant' END "scopeMode" FROM platform_memberships m JOIN platform_users u ON u.id=m.user_id AND u.status='active' WHERE m.account_id=$1 AND m.status='active' AND (m.workspace_id IS NULL OR m.workspace_id=$2) AND (m.store_id IS NULL OR m.store_id=$3) ORDER BY m.created_at,u.id`,[scope.accountId,scope.workspaceId,scope.storeId]);return q.rows;});
  const items=normalizeNotificationRecipientCatalog01416(rows);
  return {stage:NOTIFICATION_RECIPIENT_ROUTING_STAGE_01416,roles:[...NOTIFICATION_RECIPIENT_ROLES_01416],items};
}

export async function resolveNotificationRecipients01416(scope={},selectors=[]){
  const normalized=normalizeNotificationRecipients01416(selectors);if(!normalized.length)return [];
  const catalog=await listNotificationRecipientCatalog01416(scope);
  return catalog.items.filter(item=>notificationRecipientMatches01416(normalized,item));
}
