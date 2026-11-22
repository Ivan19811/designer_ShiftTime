import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReviewChange01560,isReviewManager01560,canAssignReview01560,getReviewManagers01560,getReviewHistory01560,updateReviewWorkflow01560} from '../src/orders-review-workflow-01560.mjs';
const scope={userId:'u-owner',storeId:'s-1',accountId:'a-1',workspaceId:'w-1',role:'owner'};
const draft='orderdraft_'+'a'.repeat(32);
const editor={...scope,role:'editor'},orderManager={...scope,role:'order-manager'};
test('01560 allowed reviewers, strict payload and ownership of assignment',()=>{
 assert.equal(isReviewManager01560(scope),true);assert.equal(isReviewManager01560(editor),false);assert.equal(isReviewManager01560(orderManager),true);assert.equal(canAssignReview01560(orderManager),false);
 assert.deepEqual(validateReviewChange01560({status:'in_review',revision:0},orderManager),{status:'in_review',revision:0,assignedUserId:undefined,hasStatus:true,hasAssignee:false});
 for(const invalid of [{status:'paid',revision:0},{status:'in_review',revision:-1},{status:'in_review',revision:'0'},{status:'on_hold',revision:0,notes:'PII'},{assignedUserId:'u',revision:0}])assert.throws(()=>validateReviewChange01560(invalid,orderManager));
 assert.throws(()=>validateReviewChange01560({status:'on_hold',revision:0},editor));
});
test('01560 managers are selected from active memberships in same store, account and workspace',async()=>{
 const calls=[];const lookup=async fn=>fn({query:async(sql,params)=>{calls.push({sql,params});return {rows:[{id:'u-owner',name:'Owner'},{id:'u-order',name:'Operator'}]};}});
 const out=await getReviewManagers01560(scope,{lookup});assert.equal(out.canAssign,true);assert.equal(out.managers.length,2);assert.equal(calls.length,1);
 assert.deepEqual(calls[0].params,['s-1','a-1','w-1']);for(const pred of ['m.account_id=$2','w.id=$3','m.store_id IS NULL','m.status=\'active\'','u.status=\'active\''])assert.ok(calls[0].sql.includes(pred),pred);
});
test('01560 status edit is transactional, versioned, audited, store/account/workspace-scoped',async()=>{
 const calls=[];const query=async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT r.draft_id,r.store_id'))return {rowCount:1,rows:[{draft_id:draft,store_id:scope.storeId}]};if(sql.startsWith('SELECT status,assigned_user_id,version'))return {rowCount:0,rows:[]};return {rowCount:1,rows:[]};};
 const result=await updateReviewWorkflow01560(scope,draft,{status:'in_review',revision:0},{transaction:fn=>fn({query})});
 assert.equal(result.status,'in_review');assert.equal(result.revision,1);assert.equal(result.previewOnly,true);assert.equal(calls.length,4);assert.deepEqual(calls[0].params,[draft,'s-1','a-1','w-1']);assert.match(calls[0].sql,/FOR UPDATE OF r/);assert.match(calls[2].sql,/shifttime_orders_review_workflow_01560/);assert.match(calls[3].sql,/shifttime_orders_review_audit_01560/);
 const texts=calls.map(q=>q.sql).join('\n');assert.doesNotMatch(texts,/UPDATE shifttime_checkout_review_queue|CRM|waybill|payment|ciphertext/i);
});
test('01560 optimistic revision conflict blocks writes and audit',async()=>{
 const calls=[];const query=async(sql,params)=>{calls.push(sql);if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{draft_id:draft}]};return {rowCount:1,rows:[{status:'in_review',assigned_user_id:null,version:3}]};};
 await assert.rejects(()=>updateReviewWorkflow01560(scope,draft,{status:'on_hold',revision:2},{transaction:fn=>fn({query})}),/ORDERS_WORKFLOW_CONFLICT_01560/);
 assert.equal(calls.length,2);
});
test('01560 assignment is validated for active same-store membership before DB write',async()=>{
 const calls=[];const query=async(sql,params)=>{calls.push(sql);if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{draft_id:draft}]};if(sql.startsWith('SELECT status,'))return {rowCount:0,rows:[]};return {rowCount:0,rows:[]};};
 await assert.rejects(()=>updateReviewWorkflow01560(scope,draft,{assignedUserId:'user-other-tenant',revision:0},{transaction:fn=>fn({query})}),/ORDERS_WORKFLOW_ASSIGNEE_FORBIDDEN_01560/);
 assert.equal(calls.length,3);
});
test('01560 no-op does not manufacture audit history',async()=>{
 const calls=[];const query=async(sql,params)=>{calls.push(sql);if(sql.startsWith('SELECT r.draft_id'))return {rowCount:1,rows:[{draft_id:draft}]};return {rowCount:1,rows:[{status:'awaiting_review',assigned_user_id:null,version:0}]};};
 const result=await updateReviewWorkflow01560(scope,draft,{status:'awaiting_review',revision:0},{transaction:fn=>fn({query})});assert.equal(result.unchanged,true);assert.equal(calls.length,2);
});
test('01560 history is only visible after scope guard and includes no contacts',async()=>{
 const calls=[];const lookup=async fn=>fn({query:async(sql,args)=>{calls.push({sql,args});return calls.length===1?{rowCount:1,rows:[{draft_id:draft}]}:{rows:[{id:14,previous_status:'awaiting_review',next_status:'in_review',revision:1,actor_name:'Manager',created_at:'2026-10-23T00:00:00Z'}]};}});
 const data=await getReviewHistory01560(orderManager,draft,{lookup});assert.equal(data.events.length,1);assert.equal(data.events[0].actorName,'Manager');assert.deepEqual(calls[0].args,[draft,'s-1','a-1','w-1']);assert.deepEqual(calls[1].args,[draft,'s-1']);assert.equal(JSON.stringify(data).includes('email'),false);
 await assert.rejects(()=>getReviewHistory01560(editor,draft,{lookup}),/ORDERS_WORKFLOW_FORBIDDEN_01560/);
});
