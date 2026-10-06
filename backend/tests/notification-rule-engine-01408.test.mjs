import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeNotificationRule01408,evaluateNotificationRules01408,notificationRuleDefaultsFromLegacySupplier01408,supplierLegacyViewFromUniversalRules01408} from '../src/notification-rule-engine-core-01408.mjs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01408 normalizes universal rule contract with provider event severity conditions actions and scope',()=>{
  const rule=normalizeNotificationRule01408({eventType:'order.created',severity:'high',conditions:{items:[{field:'order.total',operator:'gte',value:10000}]},actions:{channels:['inApp']},scope:{type:'store',id:'store_1'}},{storeId:'store_1'});
  assert.equal(rule.provider,'orders');
  assert.equal(rule.eventType,'order.created');
  assert.equal(rule.severity,'high');
  assert.equal(rule.conditions.items[0].field,'order.total');
  assert.deepEqual(rule.actions.channels,['inApp']);
  assert.deepEqual(rule.scope,{type:'store',id:'store_1'});
});

test('01408 evaluates amount and severity threshold conditions without changing event business data',()=>{
  const rules=[
    normalizeNotificationRule01408({id:'r1',eventType:'order.created',severity:'high',conditions:{items:[{field:'order.total',operator:'gte',value:10000}]},actions:{channels:['inApp']}}),
    normalizeNotificationRule01408({id:'r2',eventType:'supplier.risk.detected',provider:'suppliers',severity:'critical',conditions:{items:[{field:'risk.level',operator:'severityAtLeast',value:'high'}]},actions:{channels:['inApp']}})
  ];
  const order={type:'order.created',provider:'orders',severity:'low',data:{order:{total:12500,status:'new'}}};
  const decision=evaluateNotificationRules01408(rules,order);
  assert.equal(decision.allowed,true);assert.equal(decision.effectiveSeverity,'high');assert.deepEqual(decision.channels,['inApp']);assert.equal(order.data.order.status,'new');
  const risk=evaluateNotificationRules01408(rules,{type:'supplier.risk.detected',provider:'suppliers',severity:'medium',data:{risk:{level:'high'}}});
  assert.equal(risk.allowed,true);assert.equal(risk.effectiveSeverity,'critical');
});

test('01408 migrates legacy Supplier policy into universal rules and can project it back for 01402 compatibility',()=>{
  const legacy={enabled:true,channels:{inApp:true},approvalReady:true,schedulerFailure:true,riskEnabled:true,minRisk:'high',priceChangeEnabled:true,priceChangePct:25,stockZeroEnabled:true,stockZeroCount:5};
  const rules=notificationRuleDefaultsFromLegacySupplier01408(legacy,{storeId:'store_1'}).map((x,i)=>({...x,id:`r${i}`,updatedAt:'2026-10-06T00:00:00Z'}));
  const projected=supplierLegacyViewFromUniversalRules01408(rules);
  assert.equal(projected.approvalReady,true);assert.equal(projected.minRisk,'high');assert.equal(projected.priceChangePct,25);assert.equal(projected.stockZeroCount,5);
});

test('01408 persistence migration server routes and real providers are wired to the universal engine',()=>{
  const migration=read('sql/031_notification_rule_engine.sql'),server=read('src/server.mjs'),service=read('src/notification-rule-engine-01408.mjs'),supplier=read('src/marketplace-supplier-sync-alerts-01401.mjs'),inbox=read('src/notification-inbox-01404.mjs'),pkg=read('package.json');
  assert.match(migration,/shifttime_notification_rules/);assert.match(migration,/event_type/);assert.match(migration,/conditions jsonb/);assert.match(migration,/actions jsonb/);
  assert.match(server,/listNotificationRules01408/);assert.match(server,/duplicateNotificationRule01408/);assert.match(server,/p\[3\]==='rules'/);
  assert.match(service,/ensureDefaults/);assert.match(service,/commerce_supplier_sync_alert_rules/);
  assert.match(supplier,/evaluateNotificationRules01408/);assert.match(supplier,/supplier\.approval\.created/);assert.match(inbox,/order\.created/);assert.match(inbox,/customer\.message\.created/);
  assert.match(pkg,/notification-rule-engine-core-01408/);
});
