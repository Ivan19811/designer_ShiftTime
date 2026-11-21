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
  assert.match(src,/FOR UPDATE SKIP LOCKED/);assert.match(src,/executeProductImport01060/);assert.match(src,/buildProductImportPlan01060/);assert.match(src,/copySupplierMedia:false/);assert.match(src,/scheduled-auto-01399/);assert.match(src,/assertSafeRemoteImageUrl01396/);assert.match(src,/readPrivateGoogleSheet01398/);assert.match(src,/vendor\/marketplace-sync\/marketplace-import-export-service-01060\.mjs/);assert.doesNotMatch(src,/\.\.\/\.\.\/js\//);
});

test('01399 server exposes authenticated schedule CRUD/run routes and starts/stops worker with server lifecycle',async()=>{
  const src=await read('../src/server.mjs');
  assert.match(src,/p\[3\]==='supplier-sync-schedules'/);assert.match(src,/saveSupplierSyncSchedule01399/);assert.match(src,/runSupplierSyncNow01399/);assert.match(src,/assertWriteRole\(scope\)/);assert.match(src,/startSupplierSyncScheduler01399\(\)/);assert.match(src,/stopSupplierSyncScheduler01399\(\)/);
});

test('01399 env/config and package check expose scheduler controls',async()=>{
  const env=await read('../.env.example'),cfg=await read('../src/config.mjs'),pkg=await read('../package.json');
  assert.match(env,/SUPPLIER_SYNC_SCHEDULER_ENABLED=true/);assert.match(env,/SUPPLIER_SYNC_POLL_SECONDS=60/);assert.match(cfg,/supplierSyncSchedulerEnabled/);assert.match(cfg,/supplierSyncMaxJobsPerTick/);assert.match(pkg,/marketplace-supplier-sync-scheduler-core-01399\.mjs/);assert.match(pkg,/marketplace-supplier-sync-scheduler-01399\.mjs/);
});


test('01406 scheduler is self-contained inside backend and vendor import runtime is Node-loadable',async()=>{
  const src=await read('../src/marketplace-supplier-sync-scheduler-01399.mjs');
  assert.doesNotMatch(src,/\.\.\/\.\.\/js\//);
  assert.match(src,/vendor\/marketplace-sync\/marketplace-import-parsers-01060\.mjs/);
  assert.match(src,/vendor\/marketplace-sync\/marketplace-google-sheets-import-01393\.mjs/);
  assert.match(src,/vendor\/marketplace-sync\/marketplace-import-export-service-01060\.mjs/);
  const mod=await import('../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs?selfContained=01406');
  assert.equal(typeof mod.buildProductImportPlan01060,'function');
  assert.equal(typeof mod.executeProductImport01060,'function');
});

test('01406 backend vendor import executes canonical scheduled external-media import without browser runtime',async()=>{
  const {buildProductImportPlan01060,executeProductImport01060}=await import('../src/vendor/marketplace-sync/marketplace-import-export-service-01060.mjs?execute=01406');
  let state={revision:1,products:[],categories:[],attributes:[],attributeValues:[],variants:[],media:[],collections:[],filters:[],recommendations:[],feeds:[],settings:{importProfiles:[],importExportHistory:[],importHistory:[]}};
  const store={getState:()=>state,getRepositoryInfo:()=>({type:'api-server-01406',name:'test'}),replaceSnapshot:async next=>{state={...next,revision:(state.revision||0)+1};return state;},refresh:async()=>state};
  const rows=[{Name:'Pan',SKU:'PAN-1',Price:'1200',Stock:'3',Image:'https://example.com/pan.jpg'}],mapping={Name:'name',SKU:'sku',Price:'price',Stock:'stock',Image:'images'},options={rowMode:'products',copySupplierMedia:false,createMissingCategories:true};
  const plan=buildProductImportPlan01060(rows,mapping,state,options);
  assert.equal(plan.counts.create,1);assert.equal(plan.mediaCopySummary01396.externalWhenDisabled,1);
  const out=await executeProductImport01060(store,rows,mapping,options,{sourceName:'smoke',format:'csv',syncMode:'scheduled-auto-01399'});
  assert.equal(out.verified,true);assert.equal(state.products.length,1);assert.equal(state.products[0].sku,'PAN-1');assert.equal(state.media[0].url,'https://example.com/pan.jpg');
});
