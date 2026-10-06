import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01410 migration adds assignee activity and durable message thread with safe backfill',()=>{
  const sql=read('sql/033_customer_messages_inbox.sql');assert.match(sql,/assigned_user_id text REFERENCES platform_users/);assert.match(sql,/last_activity_at/);assert.match(sql,/shifttime_customer_message_thread/);assert.match(sql,/kind IN \('customer','reply','note','status','assignment'\)/);assert.match(sql,/delivery_status/);assert.match(sql,/thread_customer_/);
});

test('01410 backend service scopes inbox by Store and supports list detail assignment status reply note and history',()=>{
  const svc=read('src/customer-messages-inbox-01410.mjs');assert.match(svc,/m\.store_id=\$1/);assert.match(svc,/listCustomerMessagesInbox01410/);assert.match(svc,/getCustomerMessageThread01410/);assert.match(svc,/updateCustomerMessage01410/);assert.match(svc,/addCustomerMessageThreadEntry01410/);assert.match(svc,/listCustomerMessageManagers01410/);assert.match(svc,/sendSmtpMail01409/);assert.match(svc,/kind==='note'/);assert.match(svc,/visibility/);assert.match(svc,/shifttime_notification_receipts/);assert.doesNotMatch(svc,/[А-Яа-яІіЇїЄєҐґ]/);
});

test('01410 server exposes protected Inbox routes without changing public message intake contract',()=>{
  const server=read('src/server.mjs'),old=read('src/notification-inbox-01404.mjs');assert.match(server,/messages'&&p\[4\]==='inbox'/);assert.match(server,/listCustomerMessagesInbox01410/);assert.match(server,/getCustomerMessageThread01410/);assert.match(server,/addCustomerMessageThreadEntry01410/);assert.match(server,/assertOrderWriteRole\(scope\)/);assert.match(old,/POST|shifttime_customer_message_thread/);assert.match(old,/PUBLISHED_SITE_IDENTITY_REQUIRED_01404/);
});

test('01410 db verification and backend check include the new durable Inbox components',()=>{const verify=read('scripts/db-verify.mjs'),pkg=read('package.json');assert.match(verify,/shifttime_customer_message_thread/);assert.match(pkg,/customer-messages-inbox-01410\.mjs/);});
