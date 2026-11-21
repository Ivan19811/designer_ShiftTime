import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {hashMessengerVisitor01609,cleanMessengerBody01609,publicMessengerThread01609} from '../src/messenger-core-01609.mjs';
import {installPublishedMessenger01609} from '../src/site-messenger-publish-01609.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('01609 visitor capabilities are validated and persisted only as one-way digest',()=>{
  const key='stmv_'+ 'A'.repeat(43);
  assert.match(hashMessengerVisitor01609(key),/^[a-f0-9]{64}$/);
  assert.notEqual(hashMessengerVisitor01609(key),key);
  assert.throws(()=>hashMessengerVisitor01609('guessable'),{code:'MESSENGER_VISITOR_REQUIRED_01609'});
  assert.equal(cleanMessengerBody01609(' hello '),'hello');
  assert.throws(()=>cleanMessengerBody01609('x'),{code:'MESSENGER_BODY_REQUIRED_01609'});
});
test('01609 never returns internal notes, status, or assignment events to public chat',()=>{
  const rows=[{id:'a',kind:'customer',visibility:'customer',body:'hello'},{id:'b',kind:'note',visibility:'internal',body:'secret'},{id:'c',kind:'reply',visibility:'customer',body:'hi'},{id:'d',kind:'status',visibility:'internal',body:'secret'}];
  assert.deepEqual(publicMessengerThread01609(rows).map(x=>x.body),['hello','hi']);
});
test('01609 only injects Messenger runtime into published pages that contain chat blocks',()=>{
  const files=new Map([
    ['index.html',Buffer.from('<html><head><script data-st-published-traffic="01203"></script></head><body><section data-st-messenger-01609="1"></section></body></html>')],
    ['about/index.html',Buffer.from('<html><head><script data-st-published-traffic="01203"></script></head><body></body></html>')]
  ]);
  installPublishedMessenger01609(files);
  assert.match(String(files.get('index.html')),/data-st-published-messenger="01609"/);
  assert.doesNotMatch(String(files.get('about/index.html')),/site-messenger-01609/);
  assert.match(String(files.get('assets/site-messenger-01609.js')),/x-st-messenger-visitor/);
  const first=files.get('index.html').toString();
  installPublishedMessenger01609(files);
  assert.equal(files.get('index.html').toString(),first);
});
test('01609 new schema and server must enforce tenant, site, and order scope',()=>{
  const schema=read('sql/064_messenger_chat_01609.sql'),svc=read('src/messenger-service-01609.mjs'),server=read('src/server.mjs');
  assert.match(schema,/customer_user_id text REFERENCES platform_users/);
  assert.match(schema,/production_order_id uuid REFERENCES shifttime_production_orders_01566/);
  assert.match(svc,/m\.account_id|account_id=\$2/);
  assert.match(svc,/builder_site_id=\$5/);
  assert.match(svc,/messenger_visitor_hash=\$6/);
  assert.match(svc,/o\.site_id=m\.builder_site_id/);
  assert.match(server,/customerSession01595\(publishedTrafficIdentity,bearer/);
  assert.match(server,/linkMessengerProductionOrder01609/);
});
test('01609 Builder UI and public UI use canonical translation data; Messenger AI stays disabled',()=>{
  const blocks=read('../js/message-blocks/messenger-block-01609.js'),locale=read('../js/i18n/locales/uk-01130.js');
  assert.match(blocks,/data-st-messenger-ai-mode=\\"off\\"|data-st-messenger-ai-mode="off"/);
  assert.match(blocks,/ST_SITE_FRAME_STORE_AUTHORITY_00876/);
  assert.match(locale,/messenger01609/);
  assert.doesNotMatch(blocks,/[А-Яа-яІіЇїЄєҐґ]/);
});
