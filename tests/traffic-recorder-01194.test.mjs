import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrafficRecorder01194} from '../src/traffic-recorder-01194.mjs';

const event=n=>({dedupeKey:`e${n}`,requestId:`r${n}`,occurredAt:new Date(1000+n).toISOString(),accountId:'acc_1',workspaceId:'ws_1',storeId:'store_1',actorUserId:'u1',siteId:null,module:'sites',operation:'sites.list',routeKey:'GET /api/v1/sites',eventType:'http',integration:'browser',inboundBytes:n,outboundBytes:n*2,renderBillableOutboundBytes:n*2,statusCode:200,result:'success',durationMs:10});

test('01194 recorder batches queued events without blocking enqueue',async()=>{
  const batches=[];
  const recorder=createTrafficRecorder01194({writeBatch:async rows=>{batches.push(rows.map(r=>r.dedupeKey));},maxQueue:10,batchSize:2,flushIntervalMs:60000,setTimer:()=>0,clearTimer:()=>{}});
  assert.equal(recorder.enqueue(event(1)),true);
  assert.equal(recorder.enqueue(event(2)),true);
  assert.equal(recorder.enqueue(event(3)),true);
  assert.equal(recorder.getStats().queued,3);
  await recorder.flush();
  assert.deepEqual(batches,[['e1','e2'],['e3']]);
  assert.equal(recorder.getStats().queued,0);
  assert.equal(recorder.getStats().written,3);
});

test('01194 recorder drops overflow instead of growing without bound',()=>{
  const recorder=createTrafficRecorder01194({writeBatch:async()=>{},maxQueue:2,batchSize:2,flushIntervalMs:60000,setTimer:()=>0,clearTimer:()=>{}});
  assert.equal(recorder.enqueue(event(1)),true);
  assert.equal(recorder.enqueue(event(2)),true);
  assert.equal(recorder.enqueue(event(3)),false);
  assert.equal(recorder.getStats().queued,2);
  assert.equal(recorder.getStats().dropped,1);
});

test('01194 failed telemetry write is contained and reported by recorder health',async()=>{
  const recorder=createTrafficRecorder01194({writeBatch:async()=>{throw new Error('db unavailable');},maxQueue:4,batchSize:4,flushIntervalMs:60000,setTimer:()=>0,clearTimer:()=>{}});
  recorder.enqueue(event(1));
  assert.equal(await recorder.flush(),false);
  const stats=recorder.getStats();
  assert.equal(stats.queued,0);
  assert.equal(stats.dropped,1);
  assert.match(stats.lastError,/db unavailable/i);
});
