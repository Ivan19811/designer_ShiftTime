import test from 'node:test';
import assert from 'node:assert/strict';
import {listAccessHistory01605C,normalizeHistoryQuery01605C,recordDeniedAccess01605C,shouldRecordDenial01605C} from '../src/access-history-service-01605c.mjs';
const scope={role:'owner',accountId:'acct_alpha',workspaceId:'ws_alpha',storeId:'store_alpha'};
test('01605C owner-only audit query, keyset pagination and strict Account/Store/Workspace WHERE',async()=>{
 const seen=[];
 const run=async fn=>fn({query:async (sql,params)=>{seen.push({sql,params});return {rows:[{id:'98',createdAt:new Date('2026-10-29T12:00:00Z'),actorUserId:'usr_123',action:'access.role.update',targetType:'access_policy',targetId:'arole_123',payload:{password:'secret'}},{id:'97',createdAt:new Date('2026-10-29T11:00:00Z'),actorUserId:'usr_123',action:'access.role.create',targetType:'access_policy',targetId:'arole_124'}]};}});
 const r=await listAccessHistory01605C(scope,{filter:'roles',before:'100',limit:1},{run});
 assert.equal(r.items.length,1);assert.equal(r.hasMore,true);assert.equal(r.nextCursor,'98');
 assert.equal(r.items[0].payload,undefined);assert.deepEqual(seen[0].params.slice(0,3),['acct_alpha','store_alpha','ws_alpha']);
 assert.match(seen[0].sql,/account_id=\$1 AND store_id=\$2 AND workspace_id=\$3/);
 assert.match(seen[0].sql,/ORDER BY id DESC/);
 assert.deepEqual(seen[0].params[3],['access.role.create','access.role.update']);
});
test('01605C non-owner and malicious filters are rejected before database access',async()=>{
 const run=async()=>{throw Error('not called');};
 await assert.rejects(listAccessHistory01605C({...scope,role:'admin'},{},{run}),{statusCode:403});
 for(const params of [{filter:'invalid'},{limit:1001},{before:'1 OR 1=1'},{before:'-4'},{limit:0}])assert.throws(()=>normalizeHistoryQuery01605C(params),{statusCode:400});
});
test('01605C denied audit record does not store request body, URL, headers or secrets',async()=>{
 const records=[];const run=async fn=>fn({query:async(sql,params)=>{records.push({sql,params});return {rowCount:1};}});
 const event={permission:'shop.orders.edit',path:'/auth/private?token=secret',headers:{authorization:'Bearer secret'},body:{password:'hidden'}};
 const out=await recordDeniedAccess01605C(scope,'usr_123',event,'ST_ACCESS_PERMISSION_DENIED_01600',{run,now:999999999999});
 assert.equal(out,true);assert.equal(records.length,1);
 assert.deepEqual(records[0].params.slice(0,5),['acct_alpha','ws_alpha','store_alpha','usr_123','shop.orders.edit']);
 assert.doesNotMatch(JSON.stringify(records),/hidden|password|secret|Bearer/);
 assert.match(records[0].sql,/access.permission.denied/);
});
test('01605C repeats within three seconds are suppressed to bound log volume',()=>{
 const base={accountId:'acct_bound',storeId:'store_bound',actor:'usr_bound',permission:'shop.orders.status'};
 assert.equal(shouldRecordDenial01605C({...base,now:600000}),true);
 assert.equal(shouldRecordDenial01605C({...base,now:600100}),false);
 assert.equal(shouldRecordDenial01605C({...base,now:603100}),true);
});
