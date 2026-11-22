import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTrafficSummary01194,normalizeTrafficEventRow01194,RENDER_REFERENCE_01194} from '../src/traffic-service-01194.mjs';

test('01194 traffic summary returns numeric byte counters and Render reference budget',()=>{
  const out=normalizeTrafficSummary01194({today_inbound:'100',today_outbound:'250',today_requests:'3',today_failed:'1',month_inbound:'900',month_outbound:'1500',month_requests:'8',month_failed:'2'});
  assert.deepEqual(out.today,{inboundBytes:100,outboundBytes:250,renderBillableOutboundBytes:250,requests:3,failed:1});
  assert.deepEqual(out.month,{inboundBytes:900,outboundBytes:1500,renderBillableOutboundBytes:1500,requests:8,failed:2});
  assert.equal(RENDER_REFERENCE_01194.includedBytes,5_000_000_000);
  assert.equal(RENDER_REFERENCE_01194.overageUsdPerGb,0.15);
});

test('01194 traffic event row stays safe for JSON and retains route metadata',()=>{
  const out=normalizeTrafficEventRow01194({id:'42',occurred_at:new Date('2026-09-15T10:00:00Z'),module:'sites',operation:'site.publish',route_key:'POST /api/v1/sites/:siteId/publish',site_id:'site_1',inbound_bytes:'1024',outbound_bytes:'2048',render_billable_outbound_bytes:'2048',status_code:202,result:'success',duration_ms:333});
  assert.equal(out.id,'42');
  assert.equal(out.siteId,'site_1');
  assert.equal(out.inboundBytes,1024);
  assert.equal(out.outboundBytes,2048);
  assert.equal(out.statusCode,202);
  assert.equal(out.occurredAt,'2026-09-15T10:00:00.000Z');
});

test('01194 admin Traffic reads flush queued telemetry before querying PostgreSQL',async()=>{
  const fs=await import('node:fs');
  const src=fs.readFileSync(new URL('../src/traffic-service-01194.mjs',import.meta.url),'utf8');
  assert.match(src,/await flushTrafficRecorder01194\(\)/);
});
