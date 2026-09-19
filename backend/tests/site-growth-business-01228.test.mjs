import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration=fs.readFileSync(new URL('../sql/021_site_growth_business_analytics.sql',import.meta.url),'utf8');
const server=fs.readFileSync(new URL('../src/server.mjs',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('../src/site-production-build-01143.mjs',import.meta.url),'utf8');
const recorder=fs.readFileSync(new URL('../src/traffic-recorder-01194.mjs',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../src/traffic-control-core-01194.mjs',import.meta.url),'utf8');
const service=fs.readFileSync(new URL('../src/site-growth-service-01228.mjs',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../src/config.mjs',import.meta.url),'utf8');

test('01228 service declares supported site growth ranges and fallback',()=>{
  assert.match(service,/\{'7d':7,'30d':30,'90d':90,'180d':180,'365d':365,all:36500\}/);
  assert.match(service,/return Object\.prototype\.hasOwnProperty\.call\(PERIOD_DAYS_01228,key\)\?key:'30d'/);
});

test('01228 migration stores one account/site snapshot per day with storage/resource metrics',()=>{
  assert.match(migration,/CREATE TABLE IF NOT EXISTS shifttime_site_metric_snapshots/);
  for(const marker of ['snapshot_date','r2_physical_bytes','logical_referenced_bytes','resource_count','shared_resource_count','broken_reference_count'])assert.match(migration,new RegExp(marker));
  assert.match(migration,/UNIQUE\s*\(account_id,\s*site_id,\s*snapshot_date\)/i);
});

test('01228 backend exposes site growth aggregation behind admin traffic access',()=>{
  assert.match(server,/admin.*traffic.*site-growth/s);
  assert.match(server,/getSiteGrowthAnalytics01228/);
  assert.match(service,/shifttime_site_metric_snapshots/);
  assert.match(service,/published-site\.page-open/);
  assert.match(service,/marketplace_seller_orders/);
  assert.match(service,/COUNT\(DISTINCT NULLIF\(metadata->>'sessionId'/);
});

test('01228 published-site telemetry sends session and page context while preserving bridge compatibility markers',()=>{
  assert.match(bridge,/data-st-published-traffic="01203"/);
  assert.match(bridge,/data-st-published-telemetry="01228"/);
  assert.match(bridge,/__ST_PUBLISHED_SITE_PING_01204__/);
  assert.match(bridge,/sessionStorage/);
  assert.match(bridge,/sessionId/);
  assert.match(bridge,/pagePath/);
  assert.match(bridge,/referrerPath/);
  assert.match(server,/setTrafficMetadata01228/);
  assert.match(recorder,/setTrafficMetadata01228/);
  assert.match(core,/metadata:/);
});

test('01228 backend release stage is current and new service contains no Cyrillic UI copy',()=>{
  assert.match(config,/01228/);
  assert.doesNotMatch(service,/[А-Яа-яІіЇїЄєҐґ]/);
});
