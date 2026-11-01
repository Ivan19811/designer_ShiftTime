import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const base=dirname(fileURLToPath(import.meta.url));
const file=path=>readFileSync(resolve(base,path),'utf8');
test('01611A contact IDs are visitor-scoped and never merged by phone or name',()=>{
 const sql=file('../sql/066_messenger_contact_profiles_01611a.sql');
 assert.match(sql,/UNIQUE\(store_id,builder_site_id,visitor_hash\)/);
 assert.match(sql,/ON CONFLICT\(store_id,builder_site_id,visitor_hash\) DO NOTHING/);
 assert.match(sql,/UPDATE shifttime_customer_messages m[\s\S]+messenger_visitor_hash=c\.visitor_hash/);
 assert.doesNotMatch(sql,/UNIQUE\s*\(\s*phone_hash\s*\)/i);
});
test('01611A only links to authenticated account with original guest capability + proof',()=>{
 const srv=file('../src/server.mjs'),code=file('../src/messenger-contact-profiles-01611a.mjs');
 assert.match(srv,/linkVisitorContactToAuthenticatedUser01611A\(publishedTrafficIdentity,guest,user\?\.id\|\|null\)/);
 assert.match(code,/if\(!customerUserId\)/);
 assert.match(code,/shifttime_messenger_verified_channels_01611/);
 assert.match(code,/FOR UPDATE/);
 assert.match(code,/MESSENGER_CONTACT_ALREADY_LINKED_01611A/);
 assert.match(code,/MESSENGER_CONTACT_OWNER_CONFLICT_01611A/);
 assert.match(code,/customer_user_id IS NULL OR customer_user_id=\$6/);
 const messenger=file('../src/messenger-service-01609.mjs');
 assert.doesNotMatch(messenger,/if\(customerUserId&&!chat.customerUserId\)/);
});
test('01611A proof transaction atomically attaches the verified contact',()=>{
 const code=file('../src/messenger-verification-service-01611.mjs');
 assert.match(code,/const contact=await ensureVerifiedContact01611A\(db,s\)/);
 assert.match(code,/contact_id=EXCLUDED\.contact_id/);
 assert.match(code,/await attachExistingMessengerMessages01611A\(db,s,contact.id\)/);
 assert.match(code,/await db.query\('COMMIT'\)/);
});
test('01611A manager sees only masked channels and public contact endpoint returns no raw phone',()=>{
 const inbox=file('../src/customer-messages-inbox-01410.mjs');
 assert.match(inbox,/maskedPhone:maskPhone01611\(openPhone01611/);
 assert.match(inbox,/messengerContactId/);
 assert.match(file('../src/messenger-contact-profiles-01611a.mjs'),/maskedPhone:maskPhone01611\(openPhone01611/);
});
