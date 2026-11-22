import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeTrafficCleanupAuditRow01221,listTrafficCleanupAudit01221} from '../src/traffic-service-01194.mjs';

test('01221 normalizes persisted broken-reference cleanup audit events',()=>{
  const row={
    id:7,created_at:new Date('2026-09-19T11:29:00.000Z'),media_asset_id:'mediaasset_a',store_id:'store_1',
    event_type:'media.broken-reference.cleaned',payload:{stage:'01219',siteId:'site_1',objectKey:'accounts/a/file.jpg',fileName:'file.jpg',sizeBytes:383121,actorUserId:'usr_1'},
    workspace_id:'ws_1',file_name:'file.jpg',object_key:'accounts/a/file.jpg',actor_user_id:'usr_1',actor_name:'Ivan',actor_email:'ivan@example.com'
  };
  const out=normalizeTrafficCleanupAuditRow01221(row);
  assert.equal(out.actorUserId,'usr_1');
  assert.equal(out.actorName,'Ivan');
  assert.equal(out.siteId,'site_1');
  assert.equal(out.targetId,'mediaasset_a');
  assert.equal(out.fileName,'file.jpg');
  assert.equal(out.sizeBytes,383121);
  assert.equal(out.reason,'missing-r2-object');
  assert.equal(out.r2Deleted,false);
  assert.equal(out.historyPreserved,true);
});

test('01221 cleanup audit list is Account-scoped, bounded and reads immutable media event history',async()=>{
  let seenSql='',seenArgs=null;
  const out=await listTrafficCleanupAudit01221({accountId:'acct_1'},{limit:999},{query:async(sql,args)=>{
    seenSql=sql;seenArgs=args;
    return {rows:[{id:1,created_at:'2026-09-19T11:29:00.000Z',media_asset_id:'mediaasset_1',store_id:'store_1',event_type:'media.broken-reference.cleaned',payload:{actorUserId:'usr_1'},workspace_id:'ws_1'}]};
  }});
  assert.equal(out.stage,'01221');
  assert.equal(out.events.length,1);
  assert.match(seenSql,/a\.account_id=\$1/);
  assert.match(seenSql,/e\.event_type='media\.broken-reference\.cleaned'/);
  assert.deepEqual(seenArgs,['acct_1',100]);
});

test('01221 server exposes cleanup audit through admin traffic view capability',()=>{
  const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
  assert.match(server,/p\[4\]==='cleanup-audit'/);
  assert.match(server,/listTrafficCleanupAudit01221\(scope/);
  assert.match(server,/admin\.traffic\.view/);
});

test('01221 traffic summary advertises cleanup audit meter stage',()=>{
  const source=fs.readFileSync(new URL('../src/traffic-service-01194.mjs',import.meta.url),'utf8');
  assert.match(source,/stage:'01221'/);
  assert.match(source,/http\+service-payload-v9-cleanup-audit/);
});
