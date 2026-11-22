// 01611E: pure server-side access constraints used by account sync.
import {messengerError01609} from './messenger-core-01609.mjs';
export const messengerAccountScope01611E=(identity,userId)=>{
  if(!identity?.accountId||!identity?.workspaceId||!identity?.storeId||!identity?.siteId)
    throw messengerError01609('MESSENGER_SITE_REQUIRED_01609',401);
  if(!/^usr_[a-z0-9]{20}$/i.test(String(userId||'')))
    throw messengerError01609('MESSENGER_ACCOUNT_LOGIN_REQUIRED_01611E',401);
  return [identity.accountId,identity.workspaceId,identity.storeId,identity.siteId,userId];
};
export const chatPattern01611E=/^custmsg_[a-f0-9]{32}$/;
export const scopedChat01611E=`m.account_id=$1 AND m.workspace_id=$2 AND m.store_id=$3 AND m.builder_site_id=$4
  AND m.channel='chat' AND m.messenger_contact_id=c.id
  AND c.account_id=m.account_id AND c.workspace_id=m.workspace_id
  AND c.store_id=m.store_id AND c.builder_site_id=m.builder_site_id
  AND c.customer_user_id=$5
  AND EXISTS(SELECT 1 FROM shifttime_messenger_verified_channels_01611 vc
    WHERE vc.contact_id=c.id AND vc.account_id=c.account_id AND vc.workspace_id=c.workspace_id
    AND vc.store_id=c.store_id AND vc.builder_site_id=c.builder_site_id
    AND vc.visitor_hash=c.visitor_hash)`;
export const linkedFrom01611E=`shifttime_customer_messages m JOIN shifttime_messenger_contacts_01611a c ON c.id=m.messenger_contact_id`;
