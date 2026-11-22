import test from 'node:test';
import assert from 'node:assert/strict';
import {runTrafficContext01201,getTrafficContext01201,updateAuthenticatedTrafficContext01204} from '../src/traffic-integration-01201.mjs';

test('01204 authenticated builder scope enrichment preserves route-derived Site ID',async()=>{
  assert.equal(typeof updateAuthenticatedTrafficContext01204,'function');
  await runTrafficContext01201({requestId:'req_1',method:'POST',pathname:'/api/v1/sites/site_1/publish'},async()=>{
    updateAuthenticatedTrafficContext01204({scope:{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'},actorUserId:'user_1',publishedSiteId:''});
    assert.equal(getTrafficContext01201().siteId,'site_1');
  });
});

test('01204 verified published-site identity may override route Site ID for public traffic',async()=>{
  await runTrafficContext01201({requestId:'req_2',method:'POST',pathname:'/api/v1/public/traffic/ping'},async()=>{
    updateAuthenticatedTrafficContext01204({scope:{accountId:'acct_1',workspaceId:'ws_1',storeId:'store_1'},actorUserId:'user_1',publishedSiteId:'site_public'});
    assert.equal(getTrafficContext01201().siteId,'site_public');
  });
});
