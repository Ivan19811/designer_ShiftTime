import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTrafficHistogramWindow01474,listTrafficHistogram01474,getTrafficHistogramDetails01474} from '../src/traffic-histogram-01474.mjs';
const scope={accountId:'account-example'};
const from='2026-10-13T00:00:00.000Z',to='2026-10-14T00:00:00.000Z';
test('range validation and selected sites cannot bypass account restrictions',()=>{
  assert.equal(parseTrafficHistogramWindow01474({from,to,unit:'hour'}).unit,'hour');
  assert.throws(()=>parseTrafficHistogramWindow01474({from,to,unit:'hour;DROP TABLE x'}),/INVALID_RANGE/);
  assert.throws(()=>parseTrafficHistogramWindow01474({from,to:'2027-12-30T00:00:00Z',unit:'hour'}),/INVALID_RANGE/);
  assert.throws(()=>parseTrafficHistogramWindow01474({from,to:from,unit:'hour'}),/INVALID_RANGE/);
  assert.deepEqual(parseTrafficHistogramWindow01474({from,to,unit:'day',siteIds:'site-1,site-2'}).siteIds,['site-1','site-2']);
});
test('histogram aggregates server query without sampling the last 100 rows',async()=>{
  const calls=[];
  const query=async(sql,args)=>{calls.push({sql,args});if(sql.includes('GROUP BY 1,2'))return {rows:[{bucket:'2026-10-13T01:00:00',site_id:'site-1',requests:'350',inbound:'14000',render_out:'10900000',service:'500',r2_direct:'0',failed:'1'}]};return {rows:[{site_id:'site-1',site_name:'Example site',requests:'400'}]};};
  const response=await listTrafficHistogram01474(scope,{from,to,unit:'hour',siteIds:'site-1'},{query,flush:async()=>{}});
  assert.equal(response.stage,'01474');assert.equal(response.buckets[0].renderOutboundBytes,10900000);assert.equal(response.buckets[0].requests,350);
  assert.match(calls[0].sql,/GROUP BY 1,2/);assert.doesNotMatch(calls[0].sql,/LIMIT 100/);assert.deepEqual(calls[0].args[3],['site-1']);
  assert.ok(calls.every(c=>c.args[0]==='account-example'));
});
test('bucket detail returns route totals and marks journal samples',async()=>{
  const rows=[{requests:'350',inbound:'11',render_out:'10900000',service:'0',r2_direct:'0',failed:'0'}];
  let index=0;
  const query=async()=>{index++;return {rows:index===1?rows:index===2?[{...rows,route_key:'GET /api/v1/media/assets',operation:'media.assets',module:'media',event_type:'http',last_at:new Date(from)}]:[]};};
  const out=await getTrafficHistogramDetails01474(scope,{from,to,unit:'hour'},{query,flush:async()=>{}});
  assert.equal(out.totals.renderOutboundBytes,10900000);assert.equal(out.routes[0].routeKey,'GET /api/v1/media/assets');assert.equal(out.eventsTruncated,true);
});
