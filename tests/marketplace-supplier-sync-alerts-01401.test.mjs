import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyzeSupplierSyncRisk01401,MARKETPLACE_SUPPLIER_SYNC_ALERT_STAGE_01401} from '../src/marketplace-supplier-sync-alert-core-01401.mjs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01401 risk engine classifies critical price spikes and extracts change types',()=>{
  const risk=analyzeSupplierSyncRisk01401({items:[{entity:'product',action:'update',changed:true,changes:[{field:'product.price',before:100,after:160},{field:'product.stock',before:4,after:0},{field:'product.categories',before:['a'],after:['b']}]}],summary:{fieldChanges:3},totalChangedEntities:1},{fieldChanges:3});
  assert.equal(MARKETPLACE_SUPPLIER_SYNC_ALERT_STAGE_01401,'01401');
  assert.equal(risk.level,'critical');
  assert.equal(risk.maxPriceChangePct,60);
  assert.equal(risk.stockToZero,1);
  assert.deepEqual(risk.types,['category','price','stock']);
  assert.ok(risk.reasons.includes('price-change-critical'));
});

test('01401 risk engine escalates bulk stock-to-zero changes to medium/high without inventing text',()=>{
  const items=Array.from({length:22},(_,i)=>({entity:'variant',action:'update',changed:true,sku:`V${i}`,changes:[{field:'variant.stock',before:2,after:0}]}));
  const risk=analyzeSupplierSyncRisk01401({items,summary:{fieldChanges:22},totalChangedEntities:22},{fieldChanges:22});
  assert.equal(risk.level,'high');assert.equal(risk.stockToZero,22);assert.deepEqual(risk.types,['stock']);
});

test('01401 backend migration, routes and scheduler wire persistent alerts and approval risk',()=>{
  const migration=read('sql/028_marketplace_supplier_sync_alerts.sql'),server=read('src/server.mjs'),scheduler=read('src/marketplace-supplier-sync-scheduler-01399.mjs'),approval=read('src/marketplace-supplier-sync-approval-store-01400.mjs'),alerts=read('src/marketplace-supplier-sync-alerts-01401.mjs');
  assert.match(migration,/commerce_supplier_sync_alerts/);assert.match(migration,/ADD COLUMN IF NOT EXISTS risk jsonb/);
  assert.match(server,/supplier-sync-alerts/);assert.match(server,/setSupplierSyncAlertStatus01401/);
  assert.match(scheduler,/createSupplierSyncApprovalAlerts01401/);assert.match(scheduler,/createSupplierSyncSchedulerErrorAlert01401/);
  assert.match(approval,/analyzeSupplierSyncRisk01401/);assert.match(approval,/risk=excluded\.risk/);
  assert.match(alerts,/approval-ready/);assert.match(alerts,/risk-detected/);assert.match(alerts,/scheduler-error/);
});
