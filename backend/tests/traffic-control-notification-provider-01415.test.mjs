import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {buildTrafficNotificationEvent01415,classifyAccountTraffic01415,classifySiteTraffic01415,classifyTrafficSpike01415,TRAFFIC_NOTIFICATION_THRESHOLDS_01415} from '../src/traffic-notification-core-01415.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('01415 account traffic uses existing 5 GB Render reference at 80 and 100 percent',()=>{
  assert.equal(TRAFFIC_NOTIFICATION_THRESHOLDS_01415.renderIncludedBytes,5_000_000_000);
  assert.equal(classifyAccountTraffic01415(3_999_999_999),null);
  assert.equal(classifyAccountTraffic01415(4_000_000_000)?.eventType,'traffic.warning');
  assert.equal(classifyAccountTraffic01415(5_000_000_000)?.eventType,'traffic.limit');
});

test('01415 site anomaly classifiers reuse Traffic Control scale and a 24h spike ratio',()=>{
  assert.equal(classifySiteTraffic01415(9*1024**3),null);
  assert.equal(classifySiteTraffic01415(10*1024**3)?.kind,'site-traffic-above-average');
  assert.equal(classifySiteTraffic01415(50*1024**3)?.kind,'site-traffic-exceeded');
  assert.equal(classifyTrafficSpike01415(30*1024**2,10*1024**2)?.kind,'site-traffic-spike');
  assert.equal(classifyTrafficSpike01415(9*1024**2,1*1024**2),null);
});

test('01415 universal event keeps traffic and storage context separate from Traffic Control business telemetry',()=>{
  const event=buildTrafficNotificationEvent01415({eventKey:'site:s1:2026-10:traffic',kind:'site-traffic-above-average',sourceId:'s1',sourceName:'Demo',traffic:{scope:'site',siteId:'s1',monthBytes:12_000_000_000,thresholdBytes:10_000_000_000}});
  assert.equal(event.provider,'traffic');assert.equal(event.type,'traffic.warning');assert.equal(event.data.traffic.siteId,'s1');assert.equal(event.data.storage.bytes,0);
});

test('01415 provider journals durable events, dispatches through 01409 and never mutates shifttime_traffic_events',()=>{
  const provider=read('src/traffic-notification-provider-01415.mjs'),recorder=read('src/traffic-recorder-01194.mjs'),service=read('src/traffic-service-01194.mjs'),server=read('src/server.mjs'),inbox=read('src/notification-inbox-01404.mjs');
  assert.match(provider,/shifttime_traffic_notification_events/);assert.match(provider,/dispatchNotificationEvent01409/);assert.match(provider,/evaluateNotificationRules01408/);assert.doesNotMatch(provider,/UPDATE shifttime_traffic_events/);
  assert.match(recorder,/evaluateTrafficBatchNotifications01415/);assert.match(service,/evaluateTrafficResourceNotifications01415/);assert.match(server,/listTrafficNotifications01415/);assert.match(server,/p\[3\]==='traffic'/);assert.match(inbox,/provider==='traffic'/);
});

test('01415 migration creates only notification journal, seeds three rules and backfills current threshold as read',()=>{
  const migration=read('sql/037_traffic_control_notification_provider.sql');
  assert.match(migration,/CREATE TABLE IF NOT EXISTS shifttime_traffic_notification_events/);for(const type of ['traffic.warning','traffic.limit','storage.warning'])assert.match(migration,new RegExp(type.replace('.','\\.')));
  assert.match(migration,/5000000000/);assert.match(migration,/4000000000/);assert.match(migration,/shifttime_notification_rules/);assert.match(migration,/shifttime_notification_receipts/);assert.match(migration,/'read'/);assert.doesNotMatch(migration,/CREATE TABLE IF NOT EXISTS shifttime_traffic_events/);
});
