import test from 'node:test';
import assert from 'node:assert/strict';
import {cartPackingLayout01549} from '../src/shipping-packing-layout-01549.mjs';
const fp=n=>n.toString(16).padStart(64,'0');
const cartId='cart_'+'a'.repeat(24),scope={storeId:'storeOne',userId:'userOne'};
function harness(){
  const rows=new Map(),changes={fp:fp(1)},seen=[];
  const dbClient={async query(sql,args){seen.push({sql,args});const key=JSON.stringify(args?.slice(0,3));const previous=rows.get(key);
    if(sql.includes('SELECT cart_fingerprint'))return {rows:previous?[{cartFingerprint:previous.cartFingerprint,moves:previous.moves,revision:previous.revision}]:[]};
    if(sql.includes('INSERT INTO shifttime_shipping_cart_packing_01549')){
      if(previous&&previous.revision!==args[6])return {rows:[],rowCount:0};
      const next={cartFingerprint:args[3],moves:JSON.parse(args[4]),revision:(previous?.revision||0)+1};rows.set(key,next);return {rows:[{revision:next.revision}],rowCount:1};
    }
    if(sql.includes('DELETE FROM shifttime_shipping_cart_packing_01549')){rows.delete(key);return {rows:[],rowCount:previous?1:0};}
    throw Error('unexpected sql '+sql);
  }};
  const preview=async (_scope,input)=>{
    if(_scope.storeId!==scope.storeId||input.cartId!==cartId||input.siteId!=='siteOne')throw Object.assign(new Error('NP_PACKING_CART_INVALID_01548'),{code:'NP_PACKING_CART_INVALID_01548'});
    if(input.moves?.some(m=>m.unitKey!=='cover:1'||!['mainA:1','mainB:1'].includes(m.packageId)))throw Object.assign(new Error('NP_PACKING_MOVE_NOT_ALLOWED_01548'),{code:'NP_PACKING_MOVE_NOT_ALLOWED_01548'});
    return {stage:'01548',siteId:'siteOne',cartId,cartFingerprint:changes.fp,packages:[{id:'mainA:1',accessories:[]}],unassigned:[],moves:input.moves||[],previewOnly:true,readyForOrder:false};
  };
  const run=(action,more={})=>cartPackingLayout01549(scope,{action,cartId,siteId:'siteOne',...more},{dbClient,preview});
  return {run,rows,changes,seen,dbClient,preview};
}
test('01549 PostgreSQL: saves moves and restores them after a fresh load',async()=>{
  const {run,seen}=harness();
  const original=await run('load');assert.equal(original.savedRevision,0);assert.equal(original.saved,false);
  const moved=await run('save',{expectedRevision:0,moves:[{unitKey:'cover:1',packageId:'mainB:1'}]});
  assert.equal(moved.savedRevision,1);assert.equal(moved.saved,true);
  const reopened=await run('load');assert.equal(reopened.savedRevision,1);assert.deepEqual(reopened.moves,moved.moves);
  assert.ok(seen.some(x=>x.sql.includes('ON CONFLICT(store_id,site_id,cart_id)')));
});
test('01549 revision collision cannot silently overwrite saved move',async()=>{
  const {run}=harness();await run('save',{expectedRevision:0,moves:[]});
  await assert.rejects(()=>run('save',{expectedRevision:0,moves:[{unitKey:'cover:1',packageId:'mainB:1'}]}),{code:'NP_PACKING_REVISION_CONFLICT_01549'});
});
test('01549 cart edit invalidates old layout without returning stale positions',async()=>{
  const {run,changes}=harness();await run('save',{expectedRevision:0,moves:[{unitKey:'cover:1',packageId:'mainB:1'}]});
  changes.fp=fp(2);
  const refreshed=await run('load');assert.equal(refreshed.layoutStale,true);assert.deepEqual(refreshed.moves,[]);assert.equal(refreshed.savedRevision,1);
  const newSaved=await run('save',{expectedRevision:1,moves:[]});assert.equal(newSaved.savedRevision,2);
  assert.equal((await run('load')).layoutStale,false);
});
test('01549 reset removes saved layout, reopening uses automatic plan',async()=>{
  const {run}=harness();await run('save',{expectedRevision:0,moves:[{unitKey:'cover:1',packageId:'mainB:1'}]});
  const reset=await run('reset',{expectedRevision:1});assert.equal(reset.savedRevision,0);assert.equal(reset.saved,false);
  assert.deepEqual((await run('load')).moves,[]);
});
test('01549 invalid input and unauthorized cart are rejected without DB write',async()=>{
  const {run,seen,dbClient,preview}=harness();
  await assert.rejects(()=>run('save',{expectedRevision:-1,moves:[]}),{code:'NP_PACKING_REVISION_INVALID_01549'});
  await assert.rejects(()=>run('save',{expectedRevision:0,moves:[{unitKey:'pan:1',packageId:'mainB:1'}]}),{code:'NP_PACKING_MOVE_NOT_ALLOWED_01548'});
  await assert.rejects(()=>cartPackingLayout01549({storeId:'anotherStore'},{action:'load',cartId,siteId:'siteOne'},{dbClient,preview}),{code:'NP_PACKING_CART_INVALID_01548'});
  assert.ok(!seen.some(x=>x.sql.includes('INSERT INTO')));
});
