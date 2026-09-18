import test from 'node:test';
import assert from 'node:assert/strict';

const load=async()=>import('../src/traffic-integration-01201.mjs').catch(()=>({}));

test('01201 integration traffic context correlates external calls with the active HTTP request',async()=>{
  const mod=await load();
  assert.equal(typeof mod.runTrafficContext01201,'function');
  assert.equal(typeof mod.updateTrafficContext01201,'function');
  assert.equal(typeof mod.getTrafficContext01201,'function');
  await mod.runTrafficContext01201({requestId:'req_publish_1',method:'POST',pathname:'/api/v1/sites/site_123/publish'},async()=>{
    mod.updateTrafficContext01201({accountId:'acc_1',workspaceId:'ws_1',storeId:'store_1',actorUserId:'user_1'});
    const ctx=mod.getTrafficContext01201();
    assert.equal(ctx.requestId,'req_publish_1');
    assert.equal(ctx.operation,'site.publish');
    assert.equal(ctx.siteId,'site_123');
    assert.equal(ctx.accountId,'acc_1');
  });
});

test('01201 integration event marks external request body as Render service-initiated outbound',async()=>{
  const mod=await load();
  assert.equal(typeof mod.buildIntegrationTrafficEvent01201,'function');
  const event=mod.buildIntegrationTrafficEvent01201({
    context:{requestId:'req_1',accountId:'acc_1',workspaceId:'ws_1',storeId:'store_1',actorUserId:'u_1',module:'sites',operation:'site.publish',siteId:'site_1'},
    integration:'netlify',routeKey:'PUT /deploys/:deployId/files/:path',sequence:2,startedAtMs:1000,finishedAtMs:1040,statusCode:200,
    inboundBytes:120,outboundBytes:4096,
  });
  assert.equal(event.eventType,'integration');
  assert.equal(event.integration,'netlify');
  assert.equal(event.requestId,'req_1');
  assert.equal(event.operation,'site.publish');
  assert.equal(event.siteId,'site_1');
  assert.equal(event.inboundBytes,120);
  assert.equal(event.outboundBytes,4096);
  assert.equal(event.renderBillableOutboundBytes,4096);
  assert.equal(event.dedupeKey,'req_1:integration:netlify:2');
});
