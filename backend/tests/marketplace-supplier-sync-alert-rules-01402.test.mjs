import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {defaultSupplierSyncAlertRules01402,normalizeSupplierSyncAlertRules01402,evaluateSupplierSyncAlertRules01402} from '../src/marketplace-supplier-sync-alert-rules-core-01402.mjs';
const read=rel=>readFileSync(new URL(`../${rel}`,import.meta.url),'utf8');

test('01402 defaults preserve 01401 in-app behavior and keep external transports disabled',()=>{const r=defaultSupplierSyncAlertRules01402();assert.equal(r.enabled,true);assert.equal(r.channels.inApp,true);assert.equal(r.approvalReady,true);assert.equal(r.schedulerFailure,true);assert.equal(r.minRisk,'high');assert.equal(r.priceChangeEnabled,false);assert.equal(r.stockZeroEnabled,false);for(const k of ['email','telegram','slack','webhook'])assert.equal(r.channels[k],false);});

test('01402 rule engine evaluates approval, risk, price and stock thresholds independently',()=>{const r=normalizeSupplierSyncAlertRules01402({approvalReady:false,riskEnabled:true,minRisk:'critical',priceChangeEnabled:true,priceChangePct:20,stockZeroEnabled:true,stockZeroCount:2});const d=evaluateSupplierSyncAlertRules01402(r,{kind:'approval',risk:{level:'high',maxPriceChangePct:31,stockToZero:3}});assert.deepEqual(d.matches.sort(),['price-change','stock-zero']);});

test('01402 disabling in-app channel prevents new alerts without enabling external transports',()=>{const d=evaluateSupplierSyncAlertRules01402({channels:{inApp:false,email:true},approvalReady:true},{kind:'approval',risk:{level:'critical'}});assert.equal(d.allowed,false);assert.deepEqual(d.matches,[]);assert.equal(d.rules.channels.email,false);});

test('01402 migration/server/service wire persistent rules and extended alert kinds',()=>{const migration=read('sql/029_marketplace_supplier_sync_alert_rules.sql'),server=read('src/server.mjs'),alerts=read('src/marketplace-supplier-sync-alerts-01401.mjs'),pkg=read('package.json');assert.match(migration,/commerce_supplier_sync_alert_rules/);assert.match(migration,/price-change/);assert.match(migration,/stock-zero/);assert.match(server,/supplier-sync-alert-rules/);assert.match(server,/saveSupplierSyncAlertRules01402/);assert.match(alerts,/evaluateSupplierSyncAlertRules01402/);assert.match(alerts,/SUPPLIER_SYNC_PRICE_CHANGE_01402/);assert.match(alerts,/SUPPLIER_SYNC_STOCK_ZERO_01402/);assert.match(pkg,/marketplace-supplier-sync-alert-rules-core-01402/);});
