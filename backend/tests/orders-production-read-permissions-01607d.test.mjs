import test from 'node:test';
import assert from 'node:assert/strict';
import {listProductionOrders01566,getProductionOrderForDraft01566,createProductionOrder01566} from '../src/orders-production-01566.mjs';
import {classifyProtectedAction01600} from '../src/access-enforcement-core-01600.mjs';
const viewer={role:'viewer',storeId:'store-1',workspaceId:'ws-1',accountId:'acct-1',userId:'u-1'};
const grant={allowed:true,permission:'shop.orders.view',mode:'custom'};
const draft='orderdraft_'+'a'.repeat(32);
test('01607D list and detail reads require trusted server-side shop.orders.view decision for viewer',async()=>{
 let calls=0;const lookup=async fn=>fn({query:async(_sql)=>{calls++;return {rows:calls===1?[]:[],rowCount:0}}});
 await assert.rejects(listProductionOrders01566(viewer,{},{lookup}),{statusCode:403});
 await assert.rejects(listProductionOrders01566(viewer,{},{lookup,authorization:{allowed:false,permission:'shop.orders.view'}}),{statusCode:403});
 await assert.rejects(listProductionOrders01566(viewer,{},{lookup,authorization:{allowed:true,permission:'shop.orders.edit'}}),{statusCode:403});
 const data=await listProductionOrders01566(viewer,{},{lookup,authorization:grant});
 assert.equal(data.stage,'01566');assert.equal(data.total,0);assert.equal(calls,2);
 await assert.rejects(getProductionOrderForDraft01566(viewer,draft,{lookup}),{statusCode:403});
 const detail=await getProductionOrderForDraft01566(viewer,draft,{lookup,authorization:grant});
 assert.equal(detail.found,false);
});
test('01607D production write remains manager-only even with shop.orders.view',async()=>{
 const rid='d4973cb5-41f6-488a-98d6-65d3333ec3d2';
 await assert.rejects(createProductionOrder01566({...viewer,permissions:['shop.orders.view']},draft,{requestId:rid,confirmCreation:true,acceptEstimatedShipping:true}),{statusCode:403});
 const action=classifyProtectedAction01600('GET',['api','v1','integrations','shipping-hub','orders-production']);
 assert.equal(action.permission,'shop.orders.view');
});
