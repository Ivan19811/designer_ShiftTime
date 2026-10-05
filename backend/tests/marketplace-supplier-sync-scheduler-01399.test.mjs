import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeSupplierSyncSchedule01399,nextSupplierSyncRunAt01399,schedulerSourceSummary01399} from '../src/marketplace-supplier-sync-scheduler-core-01399.mjs';
const read=rel=>readFile(new URL(rel,import.meta.url),'utf8');

test('01399 schedule normalization is OFF by default, validation-first and clamps cadence',()=>{
  assert.deepEqual(normalizeSupplierSyncSchedule01399({}),{enabled:false,mode:'validate',cadenceMinutes:1440,mediaMode:'external-only'});
  assert.equal(normalizeSupplierSyncSchedule01399({enabled:true,mode:'apply',cadenceMinutes:1}).cadenceMinutes,15);
  assert.equal(normalizeSupplierSyncSchedule01399({cadenceMinutes:99999}).cadenceMinutes,10080);
  assert.equal(normalizeSupplierSyncSchedule01399({mode:'anything'}).mode,'validate');
});

test('01399 next run calculation preserves explicit cadence',()=>{
  assert.equal(nextSupplierSyncRunAt01399(new Date('2026-10-05T10:00:00.000Z'),60),'2026-10-05T11:00:00.000Z');
});

test('01399 summary is stable numeric transport for UI/history',()=>{
  assert.deepEqual(schedulerSourceSummary01399({rows:'8',fieldChanges:'4',variantCreate:2}),{rows:8,errors:0,fieldChanges:4,productCreate:0,productUpdate:0,variantCreate:2,variantUpdate:0,mediaRemote:0});
});

test('01399 migration provides due index, lease, mode and minimum cadence',async()=>{
  const sql=await read('../sql/026_marketplace_supplier_sync_scheduler.sql');
  assert.match(sql,/CREATE TABLE IF NOT EXISTS commerce_supplier_sync_schedules/);assert.match(sql,/lease_until timestamptz/);assert.match(sql,/mode IN \('validate','apply'\)/);assert.match(sql,/cadence_minutes BETWEEN 15 AND 10080/);assert.match(sql,/idx_commerce_supplier_sync_due/);assert.match(sql,/UNIQUE\(store_id,supplier_source_id\)/);
});

test('01399 backend worker claims with SKIP LOCKED, runs canonical import and forces scheduled media to external URL mode',async()=>{
  const src=await read('../src/marketplace-supplier-sync-scheduler-01399.mjs');
  assert.match(src,/FOR UPDATE SKIP LOCKED/);assert.match(src,/executeProductImport01060/);assert.match(src,/buildProductImportPlan01060/);assert.match(src,/copySupplierMedia:false/);assert.match(src,/syncMode:'scheduled-auto-01399'/);assert.match(src,/assertSafeRemoteImageUrl01396/);assert.match(src,/readPrivateGoogleSheet01398/);assert.match(src,/marketplace-import-export-service-01060\.js\?scheduler=01399/);
});

test('01399 server exposes authenticated schedule CRUD/run routes and starts/stops worker with server lifecycle',async()=>{
  const src=await read('../src/server.mjs');
  assert.match(src,/p\[3\]==='supplier-sync-schedules'/);assert.match(src,/saveSupplierSyncSchedule01399/);assert.match(src,/runSupplierSyncNow01399/);assert.match(src,/assertWriteRole\(scope\)/);assert.match(src,/startSupplierSyncScheduler01399\(\)/);assert.match(src,/stopSupplierSyncScheduler01399\(\)/);
});

test('01399 env/config and package check expose scheduler controls',async()=>{
  const env=await read('../.env.example'),cfg=await read('../src/config.mjs'),pkg=await read('../package.json');
  assert.match(env,/SUPPLIER_SYNC_SCHEDULER_ENABLED=true/);assert.match(env,/SUPPLIER_SYNC_POLL_SECONDS=60/);assert.match(cfg,/supplierSyncSchedulerEnabled/);assert.match(cfg,/supplierSyncMaxJobsPerTick/);assert.match(pkg,/marketplace-supplier-sync-scheduler-core-01399\.mjs/);assert.match(pkg,/marketplace-supplier-sync-scheduler-01399\.mjs/);
});
