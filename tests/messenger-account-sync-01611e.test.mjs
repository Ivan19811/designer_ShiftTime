import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {messengerAccountScope01611E,chatPattern01611E,scopedChat01611E} from '../src/messenger-account-core-01611e.mjs';
const site={accountId:'acct-a',workspaceId:'ws-a',storeId:'store-a',siteId:'site_foo1'};
const user='usr_0123456789abcdefghij',id='custmsg_'+('a'.repeat(32));
const raw=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const fake=(handlers=[])=>{
  const calls=[];
  return {calls,query:async fn=>fn({query:async(sql,params)=>{
    calls.push({sql,params});
    const response=handlers.shift();return response||{rows:[],rowCount:0};
  }})};
};
test('01611E account scope requires tenant + server-validated user ID',()=>{
 assert.deepEqual(messengerAccountScope01611E(site,user),['acct-a','ws-a','store-a','site_foo1',user]);
 assert.throws(()=>messengerAccountScope01611E(site,''),{statusCode:401});
 assert.throws(()=>messengerAccountScope01611E({},user),{statusCode:401});
});
test('01611E SQL filter scopes account/workspace/store/site/user and explicit verified contact',()=>{
 for(const condition of [/m.account_id=\$1/,/m.workspace_id=\$2/,/m.store_id=\$3/,/m.builder_site_id=\$4/,/c.customer_user_id=\$5/,/m.messenger_contact_id=c.id/,/EXISTS\(SELECT 1 FROM shifttime_messenger_verified_channels_01611/,/vc.visitor_hash=c.visitor_hash/])assert.match(scopedChat01611E,condition);
 assert.doesNotMatch(scopedChat01611E, /phone_hash\s*=|lower\(email\)/i);
 assert.match(raw('../src/messenger-account-sync-01611e.mjs'),/m.status<>'spam'/);
});
test('01611E rejects invalid chat ids and does not infer ownership from phone or name',()=>{
 assert.equal(chatPattern01611E.test(id),true);
 assert.equal(chatPattern01611E.test('../../etc/passwd'),false);
 assert.equal(chatPattern01611E.test('custmsg_123'),false);
 const service=raw('../src/messenger-account-sync-01611e.mjs');
 assert.match(service,/linkedChat\(db,scope,threadId/);
 assert.match(service,/messengerAccountScope01611E\(identity,userId\)/);
 assert.match(service,/FOR UPDATE OF m/);
 assert.match(service,/publicMessengerThread01609\(q.rows\)/);
 assert.match(service,/await db.query\('ROLLBACK'\)/);
 assert.match(service,/cleanMessengerBody01609\(body\)/);
 assert.doesNotMatch(service,/phone_hash\s*=|lower\(email\)/i);
});
test('01611E server endpoint requires existing site customer session, no guest fallback',()=>{
 const s=raw('../src/server.mjs');
 assert.match(s,/if\(p\[5\]==='account'\)/);
 assert.match(s,/if\(!user\?\.id\)return sendJson\(res,401/);
 assert.match(s,/customerSession01595\(publishedTrafficIdentity,bearer/);
 assert.match(s,/listMessengerAccountThreads01611E\(publishedTrafficIdentity,user.id\)/);
 assert.match(s,/replyMessengerAccountThread01611E\(publishedTrafficIdentity,user.id,p\[7\],input.body\)/);
});
test('01611E published runtime reuses hosted 01595 identity flow, no merchant password inputs',()=>{
 const src=raw('../public/site-messenger-01609.js'),templ=raw('../../js/message-blocks/messenger-block-01609.js'),loc=raw('../../js/i18n/locales/uk-01130.js');
 for(const part of ['codeChallenge:challenge','st_site_code','customerSessionName','/account/threads','/contact/link','beginAccountLogin','completeAccountLogin'])assert.ok(src.includes(part),part);
 assert.match(src,/fetch\('\/api\/v1\/public\/site\/account\/start'/);
 assert.doesNotMatch(src,/input\s+type=["']password["']/);
 assert.match(templ,/data-st-messenger-account-box/);
 assert.match(loc,/accountSigninInfo01611E/);
});
