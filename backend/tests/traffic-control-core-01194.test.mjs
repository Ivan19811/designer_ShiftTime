import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyTrafficRoute01194,
  buildHttpTrafficEvent01194,
  shouldRecordTrafficRequest01194,
} from '../src/traffic-control-core-01194.mjs';

test('01194 classifies site publish without leaking dynamic site id into route key',()=>{
  const out=classifyTrafficRoute01194('POST','/api/v1/sites/site_abc_123/publish');
  assert.equal(out.module,'sites');
  assert.equal(out.operation,'site.publish');
  assert.equal(out.routeKey,'POST /api/v1/sites/:siteId/publish');
  assert.equal(out.siteId,'site_abc_123');
});

test('01194 traffic admin reads are excluded so dashboard does not meter itself',()=>{
  assert.equal(shouldRecordTrafficRequest01194('GET','/api/v1/admin/traffic/summary'),false);
  assert.equal(shouldRecordTrafficRequest01194('GET','/api/v1/admin/traffic/events'),false);
  assert.equal(shouldRecordTrafficRequest01194('GET','/api/v1/sites'),true);
});

test('01194 HTTP event keeps account scope and payload byte direction separate',()=>{
  const event=buildHttpTrafficEvent01194({
    method:'PUT',pathname:'/api/v1/sites/site_1',requestId:'req_1',startedAtMs:1000,finishedAtMs:1250,statusCode:200,
    inboundBytes:1200,outboundBytes:3400,
    scope:{accountId:'acc_1',workspaceId:'ws_1',storeId:'store_1',actorUserId:'user_1'}
  });
  assert.equal(event.accountId,'acc_1');
  assert.equal(event.workspaceId,'ws_1');
  assert.equal(event.storeId,'store_1');
  assert.equal(event.siteId,'site_1');
  assert.equal(event.inboundBytes,1200);
  assert.equal(event.outboundBytes,3400);
  assert.equal(event.renderBillableOutboundBytes,3400);
  assert.equal(event.durationMs,250);
  assert.equal(event.result,'success');
  assert.equal(event.dedupeKey,'req_1:http:1000');
});
