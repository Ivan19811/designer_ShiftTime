import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeSupplierSyncSchedule01399} from '../src/marketplace-supplier-sync-scheduler-core-01399.mjs';
import {fingerprintSupplierSyncPlan01400,safeSupplierSyncDiff01400} from '../src/marketplace-supplier-sync-approval-core-01400.mjs';
const read=rel=>readFile(new URL(rel,import.meta.url),'utf8');

test('01400 scheduler accepts approval mode while preserving safe defaults',()=>{
  assert.equal(normalizeSupplierSyncSchedule01399({mode:'approval'}).mode,'approval');
  assert.deepEqual(normalizeSupplierSyncSchedule01399({}),{enabled:false,mode:'validate',cadenceMinutes:1440,mediaMode:'external-only'});
});

test('01400 approval fingerprint is deterministic and revision-sensitive',()=>{
  const base={canonicalRows:[{sku:'A',price:10}],mapping:{SKU:'sku'},options:{rowMode:'products'},diff:{items:[{action:'update',changed:true}]},baseRevision:3};
  assert.equal(fingerprintSupplierSyncPlan01400(base),fingerprintSupplierSyncPlan01400({...base,mapping:{SKU:'sku'}}));
  assert.notEqual(fingerprintSupplierSyncPlan01400(base),fingerprintSupplierSyncPlan01400({...base,baseRevision:4}));
  assert.equal(fingerprintSupplierSyncPlan01400({...base,options:{rowMode:'products',copySupplierMedia:true}}),fingerprintSupplierSyncPlan01400({...base,options:{rowMode:'products',copySupplierMedia:false}}));
});

test('01400 safe diff keeps changed/create entities and caps large UI payloads',()=>{
  const items=Array.from({length:5},(_,i)=>({id:String(i),entity:'product',action:i===0?'skip':'update',changed:i>0,changes:[{field:'product.price',before:i,after:i+1}]}));
  const out=safeSupplierSyncDiff01400({summary:{fieldChanges:4},items},2);
  assert.equal(out.items.length,2);assert.equal(out.truncated,true);assert.equal(out.totalChangedEntities,4);assert.equal(out.summary.fieldChanges,4);
});

test('01400 migration adds approval queue and expands schedule mode',async()=>{
  const sql=await read('../sql/027_marketplace_supplier_sync_approval_queue.sql');
  assert.match(sql,/mode IN \('validate','approval','apply'\)/);assert.match(sql,/CREATE TABLE IF NOT EXISTS commerce_supplier_sync_approvals/);assert.match(sql,/status IN \('pending','approved','rejected','stale'\)/);assert.match(sql,/plan_fingerprint text NOT NULL/);assert.match(sql,/base_revision bigint NOT NULL/);
});

test('01400 backend re-reads source before approval and marks stale on changed plan/revision',async()=>{
  const src=await read('../src/marketplace-supplier-sync-approval-01400.mjs'),scheduler=await read('../src/marketplace-supplier-sync-scheduler-01399.mjs'),snapshot=await read('../src/commerce-snapshot-service.mjs');
  assert.match(src,/prepareSupplierSyncPlan01400/);assert.match(src,/freshFingerprint!==str\(row\.plan_fingerprint\)/);assert.match(src,/markSupplierSyncApprovalStale01400/);assert.match(scheduler,/mode==='approval'/);assert.match(scheduler,/upsertSupplierSyncApproval01400/);assert.match(scheduler,/status:'no-changes'/);assert.match(scheduler,/stalePendingSupplierSyncApprovals01400/);assert.match(snapshot,/MARKETPLACE_SNAPSHOT_REVISION_CONFLICT_01400/);assert.match(snapshot,/expectedRevision/);
});

test('01400 server exposes approval list/detail/approve/reject with write guard',async()=>{
  const src=await read('../src/server.mjs');assert.match(src,/p\[3\]==='supplier-sync-approvals'/);assert.match(src,/approveSupplierSyncApproval01400/);assert.match(src,/rejectAndUpdateSupplierSyncApproval01400/);assert.match(src,/assertWriteRole\(scope\)/);
});
