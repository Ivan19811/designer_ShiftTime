import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateReadiness01562,getOrderReadiness01562} from '../src/orders-readiness-01562.mjs';
const draft='orderdraft_'+'a'.repeat(32),scope={storeId:'shop1',accountId:'acct1',workspaceId:'ws1',userId:'owner1',role:'owner'};
const base={draft_id:draft,site_id:'site1',workflow_status:'ready_for_manual_followup',contacts_current:true,cart_fingerprint:'a',review_cart_fingerprint:'a',packing_fingerprint:'b',review_packing_fingerprint:'b',subtotal_cents:298000,provisional_delivery_cents:31490,provisional_total_cents:329490,review_total_cents:329490,number_of_packages:1,items:[{quantity:1,lineTotalCents:298000}],packages:[{weightGrams:1200,dimensionsCm:[20,20,15]}]};
test('01562 read-only readiness reports verified invariants and always blocks final order',()=>{
 const out=evaluateReadiness01562(base);
 assert.equal(out.passed,6);assert.equal(out.total,9);assert.deepEqual(out.pending,['finalShippingQuote','buyerFinalConfirmation','productionOrderWriteEnabled']);
 for(const prop of ['canCreateOrder','canPay','canReserveInventory','canCreateWaybill','canSyncCrm','orderCreated'])assert.equal(out[prop],false);
 assert.equal(out.estimatedTotal,3294.9);assert.equal(JSON.stringify(out).includes('items'),true);assert.ok(!Object.keys(out).includes('contacts'));
});
test('01562 stale contacts, invalid package, modified price and status are flagged',()=>{
 const out=evaluateReadiness01562({...base,contacts_current:false,workflow_status:'in_review',review_cart_fingerprint:'x',review_total_cents:1,packages:[{weightGrams:0,dimensionsCm:[0,1,2]}],items:[]});
 for(const key of ['contactsCurrent','reviewMarkedReady','cartSnapshotMatches','packagePlanValid','itemsValid','estimatedPriceConsistent'])assert.ok(out.pending.includes(key));
});
test('01562 server enforces role, scoped read and no write operation',async()=>{
 const calls=[];const lookup=async fn=>fn({query:async(sql,args)=>{calls.push({sql,args});return {rowCount:1,rows:[base]};}});
 const out=await getOrderReadiness01562(scope,draft,{lookup});assert.equal(out.stage,'01562');assert.equal(calls.length,1);assert.deepEqual(calls[0].args,[draft,'shop1','acct1','ws1']);
 assert.match(calls[0].sql,/d.account_id=\$3 AND d.workspace_id=\$4/);assert.match(calls[0].sql,/c.expires_at>now\(\)/);assert.doesNotMatch(calls[0].sql,/(INSERT|UPDATE|DELETE|CREATE TABLE)/i);
 for(const badRole of ['editor','viewer'])await assert.rejects(getOrderReadiness01562({...scope,role:badRole},draft,{lookup}),/FORBIDDEN/);
 await assert.rejects(getOrderReadiness01562(scope,'bad',{lookup}),/DRAFT_INVALID/);
 await assert.rejects(getOrderReadiness01562(scope,draft,{lookup:async fn=>fn({query:async()=>({rowCount:0,rows:[]})})}),/NOT_FOUND/);
});
