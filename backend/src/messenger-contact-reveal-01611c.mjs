// 01611C. Explicit, audited, purpose-limited manual viewing of VERIFIED fallback phone numbers.
// Never expose raw phone in list/thread APIs or logs; no guessed phone from customer JSON.
import {withClient} from './db.mjs';
import {verificationKey01611,openPhone01611} from './messenger-verification-core-01611.mjs';
import {canRevealMessengerPhone01611C} from './messenger-phone-access-core-01611c.mjs';

const ALLOWED_CHANNELS=new Set(['sms','telegram','viber','whatsapp']);
function deny(code,statusCode=403){const e=new Error(code);e.code=code;e.statusCode=statusCode;return e;}
export async function revealMessengerPhone01611C(scope,actorUserId,messageId,input={}){
  const channel=String(input.channel||'').trim().toLowerCase();
  const purpose=String(input.purpose||'reply').trim().toLowerCase();
  if(!ALLOWED_CHANNELS.has(channel))throw deny('MESSENGER_REVEAL_CHANNEL_INVALID_01611C',400);
  if(!['reply','call'].includes(purpose)||(purpose==='call'&&channel!=='sms'))throw deny('MESSENGER_REVEAL_PURPOSE_INVALID_01611C',400);
  return withClient(async db=>{
    await db.query('BEGIN');
    try{
      // Require the exact message, contact, site, workspace and account to belong to the actor's store.
      const m=await db.query(`SELECT m.messenger_contact_id "contactId",m.builder_site_id "siteId",m.assigned_user_id "assignedUserId"
        FROM shifttime_customer_messages m
        WHERE m.id=$1 AND m.store_id=$2 AND m.account_id=$3 AND m.workspace_id=$4 AND m.channel='chat' AND m.messenger_contact_id IS NOT NULL
        LIMIT 1`,[messageId,scope.storeId,scope.accountId,scope.workspaceId]);
      if(!m.rowCount)throw deny('MESSENGER_REVEAL_CONTACT_NOT_FOUND_01611C',404);
      const row=m.rows[0];
      if(!canRevealMessengerPhone01611C(scope,actorUserId,row.assignedUserId))throw deny('MESSENGER_REVEAL_ACCESS_DENIED_01611C',403);
      const c=await db.query(`SELECT vc.phone_sealed "sealed",vc.verified_at "verifiedAt"
        FROM shifttime_messenger_verified_channels_01611 vc
        JOIN shifttime_messenger_contacts_01611a contact ON contact.id=vc.contact_id
        WHERE vc.contact_id=$1 AND vc.store_id=$2 AND vc.account_id=$3 AND vc.workspace_id=$4
          AND vc.builder_site_id=$5 AND vc.channel=$6 AND vc.consent_fallback=TRUE
          AND contact.store_id=vc.store_id AND contact.account_id=vc.account_id
          AND contact.workspace_id=vc.workspace_id AND contact.builder_site_id=vc.builder_site_id
          AND contact.visitor_hash=vc.visitor_hash
        ORDER BY vc.verified_at DESC LIMIT 1`,[row.contactId,scope.storeId,scope.accountId,scope.workspaceId,row.siteId,channel]);
      if(!c.rowCount)throw deny('MESSENGER_REVEAL_CONSENT_REQUIRED_01611C',403);
      // Limit casual harvesting. Audit contains no phone, plaintext or encrypted payload.
      const recent=await db.query(`SELECT count(*)::int n FROM shifttime_messenger_phone_reveal_audit_01611c
        WHERE store_id=$1 AND actor_user_id=$2 AND created_at>now()-interval '5 minutes'`,[scope.storeId,actorUserId]);
      if(Number(recent.rows[0]?.n||0)>=10)throw deny('MESSENGER_REVEAL_RATE_LIMIT_01611C',429);
      const phone=openPhone01611(verificationKey01611(),c.rows[0].sealed);
      await db.query(`INSERT INTO shifttime_messenger_phone_reveal_audit_01611c
        (account_id,workspace_id,store_id,builder_site_id,message_id,contact_id,actor_user_id,channel,purpose)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[scope.accountId,scope.workspaceId,scope.storeId,row.siteId,messageId,row.contactId,actorUserId,channel,purpose]);
      await db.query('COMMIT');
      return {stage:'01611C',channel,phone,verifiedAt:c.rows[0].verifiedAt,expiresInSeconds:45};
    }catch(e){await db.query('ROLLBACK');throw e;}
  });
}
